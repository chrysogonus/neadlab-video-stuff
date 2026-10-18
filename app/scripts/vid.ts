#!/usr/bin/env bun
// The pipeline: audio + transcript in, rendered video out, one step after another (run from the repo root as ./vid).
//   ./vid new <id> --audio <file> --transcript <file> [--title <title>]   create projects/<id>/
//   ./vid analyze <id> [--force step,step]   run the analysis steps whose inputs changed (see STEPS)
//   ./vid status <id>                        which steps are current, stale or missing
//   ./vid check [--full|--update-baseline]   fast repository quality gates (no GPU or Chrome); --full adds the
//                                            slow local ones (render determinism, stills baseline, analysis)
//   ./vid render <id> [render.ts options]    the final video (default: --samples auto --shutter 0.2); needs the
//                                            project's cue sheet, data/cues.json (and optionally data/style.json)
//   ./vid run <id>                           analyze, then render
//   ./vid make <id> [--force step,step] [--only step,step] [--draft] [--no-render]
//                                            the whole video, with no hand edits: analyze, then the model steps
//                                            (see MODEL STEPS below; --only: just those), then render (--draft:
//                                            1 sample, fast x264)
//   ./vid video <id>                         the HyperFrames project for the music-to-video skill (see HYPERFRAMES)
//   ./vid assemble <id>                      its index.html: the skill's assembler, plus compositions/overlays/ on top
//   ./vid snap <id> [<frame_id>] --at <t,...> stills at track seconds, of the project or of one frame on its own
//   ./vid proof <id> --to <s>                a 60 fps proof render of the project's first <s> seconds
//   ./vid master <id>                        its render with the master's audio -> out/<id>.mp4
// A step runs when an output is missing or its inputs' contents changed since it last ran (hashes in
// work/steps.json). A step with no record whose outputs all exist is adopted as current: committed data
// (a fresh clone, a migrated project) is never recomputed just because it has no record. Steps listed in
// project.json's "frozen" never run: their committed outputs cannot be made again (Harvest's alignment), or they
// were made by hand (both songs' treatment, cue sheet and scenes).
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT, loadProjects, loadSheet, loadStyle, project } from './projects';
import { Lyrics } from '../src/engine/lyrics';
import { AudioData } from '../src/engine/audio';
import { resolveCues, resolveEntries } from '../src/engine/cues';
import { LIBRARY } from '../src/library';

const argv = process.argv.slice(2);
const [cmd, id] = argv;
const opt = (k: string) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : undefined; };
const UV = Bun.which('uv') ?? `${process.env.HOME}/.local/bin/uv`;
const FFMPEG = Bun.which('ffmpeg') ?? `${process.env.HOME}/.local/bin/ffmpeg`;

interface Step {
  id: string;
  script: string;
  args?: string[];
  /** Files (relative to the project directory) whose contents decide whether the step must run again. */
  inputs: string[];
  outputs: string[];
  what: string;
}

const STEMS = ['vocals', 'drums', 'bass', 'other'].map((s) => `work/stems/htdemucs_ft/${s}.wav`);
const EMISSIONS = ['mms', 'lv60k'].flatMap((m) => ['', '_vocL', '_vocR'].map((c) => `work/emission_${m}${c}.npy`));

function steps(master: string, transcript: string): Step[] {
  return [
    { id: 'sheet', script: 'lyrics_sheet.py', inputs: [transcript, 'tuning.py:SUNG'], outputs: ['data/lines.txt', 'data/sections.json'],
      what: 'transcript -> lines and sections' },
    { id: 'stems', script: 'separate.py', inputs: [master], outputs: STEMS, what: 'Demucs stem separation (GPU)' },
    { id: 'vocal', script: 'vocal_feats.py', inputs: [STEMS[0]!], outputs: ['work/vocal_feats.npz'], what: 'vocal pitch, loudness and onsets' },
    { id: 'ctc', script: 'ctc_emissions.py', inputs: [STEMS[0]!], outputs: EMISSIONS, what: 'CTC emissions of two acoustic models (GPU)' },
    { id: 'whisper', script: 'whisper_run.py', args: ['turbo'], inputs: [STEMS[0]!, 'data/lines.txt', 'tuning.py:WHISPER_PROMPT'],
      outputs: ['work/whisper_turbo_prompt.json'], what: 'Whisper word timestamps (the cross-check)' },
    { id: 'sung', script: 'sung.py', inputs: ['data/lines.txt', 'work/whisper_turbo_prompt.json', 'tuning.py:SUNG,PRON,ALT', ...EMISSIONS],
      outputs: ['data/sung.json'], what: 'lines the vocal sings differently from the transcript' },
    { id: 'align', script: 'align.py', args: ['--plots'],
      inputs: ['data/lines.txt', 'data/sung.json', 'work/vocal_feats.npz', 'work/whisper_turbo_prompt.json', 'tuning.py', ...EMISSIONS],
      outputs: ['data/lyrics.json'], what: 'word-level forced alignment + QA plots' },
    { id: 'beats', script: 'analyze.py', inputs: [master, ...STEMS, 'data/lyrics.json', 'data/sections.json', 'tuning.py:TEMPO_RANGE,GRID,BAR_PHASE,SECTION_BARS'],
      outputs: ['data/audio.json'], what: 'beat grid, bars, sections, envelopes, onsets' },
  ];
}

/**
 * A file's content hash; `tuning.py:A,B` hashes only those settings of a project's tuning.py (each top-level
 * assignment up to the next one), so a correction for one step does not rerun the steps that never read it.
 */
function hashFile(f: string) {
  const [file, names] = f.split('.py:') as [string, string | undefined];
  const real = names === undefined ? f : `${file}.py`;
  if (names === undefined) return existsSync(real) ? createHash('sha256').update(readFileSync(real)).digest('hex') : 'missing';
  // (no tuning.py sets nothing: the same as a tuning.py without those settings)
  const blocks = (existsSync(real) ? readFileSync(real, 'utf8') : '').split(/\n(?=[A-Z_][A-Z0-9_]*\s*=)/);
  const pick = names.split(',').map((n) => blocks.find((b) => new RegExp(`^\\s*${n}\\s*=`).test(b)) ?? `${n}: unset`);
  return createHash('sha256').update(pick.join('\n')).digest('hex');
}

function stepState(dir: string, s: Step, record: Record<string, string>) {
  const hash = createHash('sha256').update(s.inputs.map((f) => `${f}:${hashFile(path.join(dir, f))}`).join('\n')).digest('hex');
  const outputs = s.outputs.every((f) => existsSync(path.join(dir, f)));
  const state = !outputs ? 'missing' : !(s.id in record) ? 'unrecorded' : record[s.id] === hash ? 'current' : 'stale';
  return { hash, state };
}

function python(script: string, args: string[]) {
  console.log(`\n$ uv run python ${script} ${args.join(' ')}`);
  const r = Bun.spawnSync([UV, 'run', 'python', script, ...args], { cwd: path.join(ROOT, 'analysis'), stdout: 'inherit', stderr: 'inherit' });
  if (r.exitCode !== 0) throw new Error(`${script} failed (exit ${r.exitCode})`);
}

function analyze(pid: string, force: string[] = []) {
  const p = project(pid);
  const dir = path.join(ROOT, 'projects', pid);
  const json = JSON.parse(readFileSync(path.join(dir, 'project.json'), 'utf8'));
  const recFile = path.join(dir, 'work', 'steps.json');
  mkdirSync(path.dirname(recFile), { recursive: true });
  const record: Record<string, string> = existsSync(recFile) ? JSON.parse(readFileSync(recFile, 'utf8')) : {};
  for (const s of steps(json.audio, json.transcript)) {
    if (json.frozen?.includes(s.id)) {
      console.log(`[${s.id}] frozen (project.json)`);
      continue;
    }
    const { hash, state } = stepState(dir, s, record);
    if (state === 'unrecorded' && !force.includes(s.id)) {
      console.log(`[${s.id}] adopted: outputs exist, no record`);
    } else if (state === 'current' && !force.includes(s.id)) {
      console.log(`[${s.id}] current`);
    } else {
      console.log(`[${s.id}] ${force.includes(s.id) ? 'forced' : state}: ${s.what}`);
      python(s.script, [...(s.args ?? []), '--project', pid]);
    }
    // (each step hashes its inputs when its turn comes, after the steps that write them)
    record[s.id] = hash;
    writeFileSync(recFile, JSON.stringify(record, null, 1) + '\n');
  }
  const report = path.join(dir, 'work', 'qa', 'align_report.md');
  if (existsSync(report)) console.log(`\nalignment QA: ${path.relative(ROOT, report)}`);
  console.log(`\n${p.title}: analysis current (projects/${pid}/data/)`);
}

function status(pid: string) {
  project(pid);
  const dir = path.join(ROOT, 'projects', pid);
  const json = JSON.parse(readFileSync(path.join(dir, 'project.json'), 'utf8'));
  const recFile = path.join(dir, 'work', 'steps.json');
  const record = existsSync(recFile) ? JSON.parse(readFileSync(recFile, 'utf8')) : {};
  for (const s of steps(json.audio, json.transcript)) {
    const state = json.frozen?.includes(s.id) ? 'frozen' : stepState(dir, s, record).state;
    console.log(`${s.id.padEnd(8)} ${state.padEnd(10)} ${s.what}`);
  }
}

function create(pid: string) {
  const audio = opt('audio'), transcript = opt('transcript');
  if (!/^[a-z0-9][a-z0-9-]*$/.test(pid ?? '')) throw new Error('usage: ./vid new <id: lowercase letters, digits, dashes> --audio <file> --transcript <file>');
  if (!audio || !transcript) throw new Error('./vid new needs --audio <file> and --transcript <file>');
  const dir = path.join(ROOT, 'projects', pid);
  if (existsSync(dir)) throw new Error(`projects/${pid} exists`);
  for (const d of ['input', 'data', 'work']) mkdirSync(path.join(dir, d), { recursive: true });
  const tx = `input/${path.basename(transcript)}`;
  copyFileSync(transcript, path.join(dir, tx));
  // the master: a WAV as given; anything else decoded once to a 48 kHz WAV (the analysis and the export read it)
  let master = `input/${path.basename(audio)}`;
  copyFileSync(audio, path.join(dir, master));
  if (path.extname(audio).toLowerCase() !== '.wav') {
    const wav = master.replace(/\.[^.]+$/, '.wav');
    ffmpeg(['-i', path.join(dir, master), '-ar', '48000', '-c:a', 'pcm_s24le', path.join(dir, wav)]);
    master = wav;
  }
  ffmpeg(['-i', path.join(dir, master), '-c:a', 'libmp3lame', '-q:a', '2', path.join(dir, 'data', 'preview.mp3')]);
  const title = opt('title') ?? path.basename(audio).replace(/\.[^.]+$/, '');
  writeFileSync(path.join(dir, 'project.json'), JSON.stringify({ title, kind: 'song', audio: master, transcript: tx }, null, 2) + '\n');
  console.log(`created projects/${pid}/ (${title}); next: ./vid analyze ${pid}`);
}

function ffmpeg(args: string[]) {
  const r = Bun.spawnSync([FFMPEG, '-v', 'error', '-y', ...args], { stdout: 'inherit', stderr: 'inherit' });
  if (r.exitCode !== 0) throw new Error(`ffmpeg ${args.join(' ')} failed`);
}

function render(pid: string, extra: string[]) {
  const args = extra.length ? extra : ['--samples', 'auto', '--shutter', '0.2'];
  const r = Bun.spawnSync(['bun', 'scripts/render.ts', 'video', '--project', pid, ...args],
    { cwd: path.join(ROOT, 'app'), stdout: 'inherit', stderr: 'inherit' });
  if (r.exitCode !== 0) throw new Error(`render failed (exit ${r.exitCode})`);
}

// ------------------------------------------------------------------ HYPERFRAMES
// New videos are HyperFrames projects (AGENTS.md), projects/<id>/video/, built with the music-to-video skill. This
// stage hands the skill what it cannot measure itself, next to its own analysis:
//   assets/bgm.mp3   the master (320k; regenerated, not committed)
//   audiomap.json    the skill's analyzer on bgm.mp3 (its one beat/energy map)
//   lyrics.json      the aligned lyrics (data/lyrics.json): every sung line and word with its time, and its section
// It scaffolds the project once and refreshes those three files on every run; the brief, storyboard and frames
// are never touched. `./vid master` swaps the render's lossy audio for the master's (AAC 320k) for the upload.
const HF = ['npx', '--yes', 'hyperframes@0.8.164'];
const ANALYZER = path.join(ROOT, '.agents', 'skills', 'music-to-video', 'scripts', 'analyze-beatgrid.py');

function video(pid: string) {
  const p = project(pid), dir = path.join(ROOT, 'projects', pid), vdir = path.join(dir, 'video');
  const json = JSON.parse(readFileSync(path.join(dir, 'project.json'), 'utf8'));
  const lyrics = path.join(dir, 'data', 'lyrics.json');
  if (!existsSync(lyrics)) throw new Error(`projects/${pid}/data/lyrics.json is missing; run ./vid analyze ${pid} first`);
  if (!existsSync(path.join(vdir, 'hyperframes.json'))) {
    const r = Bun.spawnSync([...HF, 'init', vdir, '--non-interactive', '--example=blank', '--skill=music-to-video'], { stdout: 'inherit', stderr: 'inherit' });
    if (r.exitCode !== 0) throw new Error(`hyperframes init failed (exit ${r.exitCode})`);
  }
  for (const d of ['assets', 'renders']) mkdirSync(path.join(vdir, d), { recursive: true });
  const bgm = path.join(vdir, 'assets', 'bgm.mp3');
  ffmpeg(['-i', path.join(dir, json.audio), '-c:a', 'libmp3lame', '-b:a', '320k', bgm]);
  const ms = (t: number) => Math.round(t * 1000) / 1000;
  const audiomap = path.join(vdir, 'audiomap.json');
  python(ANALYZER, [bgm, '-o', audiomap]);
  // The skill's constant grid lands ~35 ms after the beat on our songs (harvest-remix: every hand-checked hit), and
  // Suno tempos drift; our tracked grid (data/audio.json) is the one we trust, so it replaces the skill's and the
  // phrase edges snap to it. Energy, onsets, rolls and silences stay the skill's.
  const am = JSON.parse(readFileSync(audiomap, 'utf8'));
  const ours = JSON.parse(readFileSync(path.join(dir, 'data', 'audio.json'), 'utf8')) as { bpm: number; beats: number[]; downbeats: number[] };
  const toDownbeat = (t: number) => ours.downbeats.reduce((a, b) => (Math.abs(b - t) < Math.abs(a - t) ? b : a));
  am.grid = { beats_sec: ours.beats, downbeats_sec: ours.downbeats, source: `projects/${pid}/data/audio.json (tracked grid, ./vid analyze)` };
  am.tempo.bpm = Math.round(ours.bpm * 10) / 10;
  am.tempo.n_beats = ours.beats.length;
  am.tempo.n_bars = ours.downbeats.length;
  for (const ph of am.phrases) { ph.start = toDownbeat(ph.start); ph.end = toDownbeat(ph.end); }
  writeFileSync(audiomap, JSON.stringify(am, null, 1) + '\n');
  // the music as data for the compositions (assets/kit/env.js, window.HR_ENV): band envelopes at 50 Hz (0..1) and
  // the drum onsets [t, strength], so frames can breathe with the track without a render-time fetch
  const full = JSON.parse(readFileSync(path.join(dir, 'data', 'audio.json'), 'utf8')) as Record<string, any>;
  const step = Math.round(full.fps / 50), q = (x: number) => Math.round(x * 100) / 100;
  const env = {
    fps: 50,
    bands: Object.fromEntries(['rms', 'bass', 'drums', 'vocal', 'high'].map((k) => [k, (full[k] as number[]).filter((_, i) => i % step === 0).map(q)])),
    onsets: Object.fromEntries(['kick', 'snare', 'hat'].map((k) => [k, (full.onsets[k] as [number, number][]).map(([t, s]) => [ms(t), q(s)])])),
    downbeats: ours.downbeats,
  };
  // the house-style kit and finish layer (docs/HOUSE-STYLE.md): installed once from templates/hyperframes/, never
  // overwritten — a project keeps the copy it was made with
  const tpl = path.join(ROOT, 'templates', 'hyperframes');
  for (const f of ['assets/kit/hr-kit.js', 'compositions/overlays/finish.html']) {
    const dst = path.join(vdir, f);
    if (existsSync(dst)) continue;
    mkdirSync(path.dirname(dst), { recursive: true });
    const text = readFileSync(path.join(tpl, f), 'utf8');
    writeFileSync(dst, f.endsWith('finish.html') ? text.replace('data-duration="0"', `data-duration="${am.audio.duration_sec}"`) : text);
    console.log(`installed ${f} (house style)`);
  }
  mkdirSync(path.join(vdir, 'assets', 'kit'), { recursive: true });
  writeFileSync(path.join(vdir, 'assets', 'kit', 'env.js'), `// generated by ./vid video from data/audio.json\nwindow.HR_ENV = ${JSON.stringify(env)};\n`);

  const { lines } = JSON.parse(readFileSync(lyrics, 'utf8')) as { lines: { text: string; start: number; end: number; words: { w: string; start: number; end: number }[] }[] };
  const sections = JSON.parse(readFileSync(path.join(dir, 'data', 'sections.json'), 'utf8')) as { name: string; first_line: number; n_lines: number }[];
  const section = (i: number) => sections.find((s) => i >= s.first_line && i < s.first_line + s.n_lines)?.name ?? null;
  writeFileSync(path.join(vdir, 'lyrics.json'), JSON.stringify({
    title: p.title,
    note: `aligned to the vocal by ./vid analyze (projects/${pid}/data/lyrics.json); track seconds, the audiomap's clock`,
    lines: lines.map((l, i) => ({ i, section: section(i), text: l.text, start: ms(l.start), end: ms(l.end),
      words: l.words.map((w) => ({ w: w.w, start: ms(w.start), end: ms(w.end) })) })),
  }, null, 1) + '\n');
  console.log(`projects/${pid}/video/: bgm.mp3, audiomap.json, lyrics.json (${lines.length} lines) current; build it with the music-to-video skill (AGENTS.md)`);
}

/**
 * The playable project: the skill's assembler (frames + bgm from STORYBOARD.md), then every
 * compositions/overlays/<id>.html mounted above the frames for the whole film (the finish layer: grain, light).
 */
function assemble(pid: string) {
  const vdir = path.join(ROOT, 'projects', pid, 'video');
  const r = Bun.spawnSync(['node', path.join(ROOT, '.agents', 'skills', 'music-to-video', 'scripts', 'assemble-index.mjs'),
    '--storyboard', path.join(vdir, 'STORYBOARD.md'), '--hyperframes', vdir, '--audiomap', path.join(vdir, 'audiomap.json')],
    { stdout: 'inherit', stderr: 'inherit' });
  if (r.exitCode !== 0) throw new Error(`assemble-index failed (exit ${r.exitCode})`);
  const dir = path.join(vdir, 'compositions', 'overlays');
  const overlays = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.html')).sort() : [];
  if (!overlays.length) return;
  const index = path.join(vdir, 'index.html');
  let html = readFileSync(index, 'utf8');
  const total = html.match(/data-composition-id="main"[\s\S]*?data-duration="([\d.]+)"/)?.[1];
  if (!total) throw new Error('index.html: no root duration');
  const clips = overlays.map((f, i) => {
    const id = f.replace(/\.html$/, '');
    return `      <div id="el-${id}" class="frame" data-composition-id="${id}" data-composition-src="compositions/overlays/${f}"\n` +
      `        data-start="0" data-duration="${total}" data-track-index="${2 + i}"></div>\n`;
  }).join('');
  const close = html.lastIndexOf('</div>', html.indexOf('<script>', html.indexOf('data-composition-id="main"')));
  const at = html.lastIndexOf('\n', close) + 1; // the root's closing line
  html = html.slice(0, at) + clips + html.slice(at);
  writeFileSync(index, html);
  console.log(`overlays: ${overlays.join(', ')}`);
}

/** A working copy of a HyperFrames project in `dir`: assets linked (large), compositions copied — the bundler reads a
 *  symlinked compositions/ as empty files. */
function linkProject(vdir: string, dir: string) {
  Bun.spawnSync(['ln', '-s', path.join(vdir, 'assets'), path.join(dir, 'assets')]);
  Bun.spawnSync(['cp', '-r', path.join(vdir, 'compositions'), path.join(dir, 'compositions')]);
}

/**
 * Stills at track seconds: of the assembled project, or of one frame (`frame` = its file stem, e.g. 02-sent) mounted
 * on its own at its STORYBOARD.md span — so a frame-worker can look at its frame before the others exist.
 * Software WebGL (SwiftShader): headless Chrome gets no GPU context under WSL.
 */
function snap(pid: string, frame: string | undefined, at: string | undefined) {
  if (!at) throw new Error('usage: ./vid snap <id> [<frame_id>] --at <track seconds,...>');
  const vdir = path.join(ROOT, 'projects', pid, 'video');
  let dir = vdir, start = 0;
  if (frame) {
    const sb = readFileSync(path.join(vdir, 'STORYBOARD.md'), 'utf8');
    const m = sb.match(new RegExp(`src:\\s*compositions/frames/${frame}\\.html[\\s\\S]*?span_sec:\\s*\\[\\s*([\\d.]+)\\s*,\\s*([\\d.]+)\\s*\\]`));
    if (!m) throw new Error(`no frame ${frame} with a span_sec in projects/${pid}/video/STORYBOARD.md`);
    start = Number(m[1]);
    const dur = Math.round((Number(m[2]) - start) * 1000) / 1000;
    dir = path.join(vdir, '.hyperframes', 'solo', frame);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    linkProject(vdir, dir);
    writeFileSync(path.join(dir, 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=1920, height=1080" />
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>* { margin: 0; padding: 0; box-sizing: border-box; } html, body { width: 1920px; height: 1080px; overflow: hidden; background: #000; }
#root { position: relative; width: 1920px; height: 1080px; overflow: hidden; } .frame { position: absolute; inset: 0; width: 100%; height: 100%; }</style>
</head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${dur}" data-width="1920" data-height="1080">
<div id="el-${frame}" class="frame" data-composition-id="${frame}" data-composition-src="compositions/frames/${frame}.html" data-start="0" data-duration="${dur}" data-track-index="1"></div>
</div>
<script>window.__timelines["main"] = gsap.timeline({ paused: true });</script>
</body></html>
`);
  }
  const times = at.split(',').map((t) => Math.round((Number(t) - start) * 1000) / 1000);
  const out = path.join(vdir, 'snapshots', frame ?? 'all');
  const r = Bun.spawnSync([...HF, 'snapshot', dir, '--at', times.join(','), '--no-end', '--keep', '-o', out, '--no-browser-gpu', '--describe', 'false'],
    { stdout: 'inherit', stderr: 'inherit' });
  if (r.exitCode !== 0) throw new Error(`hyperframes snapshot failed (exit ${r.exitCode})`);
  const stills = times.map((t) => path.join(out, `at-${t}s.png`));
  for (const [i, t] of at.split(',').entries()) console.log(`track ${t}s -> ${path.relative(ROOT, stills[i]!)}`);
  // one contact sheet in the order asked, three across
  const list = path.join(out, 'sheet.txt');
  writeFileSync(list, stills.map((f) => `file '${f}'\nduration 1\n`).join(''));
  ffmpeg(['-f', 'concat', '-safe', '0', '-i', list, '-vf', `scale=640:-1,tile=3x${Math.ceil(stills.length / 3)}:padding=6`, '-frames:v', '1', path.join(out, 'sheet.png')]);
  console.log(`sheet: ${path.relative(ROOT, path.join(out, 'sheet.png'))}`);
}

/**
 * A proof clip: the assembled project cut at --to (track seconds) — later frames dropped, clips and audio trimmed —
 * rendered at 60 fps to video/renders/proof.mp4. HyperFrames renders whole compositions only, so the cut is a copy.
 */
function proof(pid: string, to: number) {
  const vdir = path.join(ROOT, 'projects', pid, 'video'), dir = path.join(vdir, '.hyperframes', 'proof');
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  linkProject(vdir, dir);
  const html = readFileSync(path.join(vdir, 'index.html'), 'utf8').replace(/<(div|audio)\b[^>]*?data-start="([\d.]+)"[^>]*?data-duration="([\d.]+)"[^>]*>(?:<\/\1>)?/gs,
    (tag, _k, start, dur) => {
      const a = Number(start), b = a + Number(dur);
      if (tag.includes('data-composition-id="main"')) return tag.replace(`data-duration="${dur}"`, `data-duration="${to}"`);
      if (a >= to) return '';
      return b > to ? tag.replace(`data-duration="${dur}"`, `data-duration="${Math.round((to - a) * 1000) / 1000}"`) : tag;
    });
  writeFileSync(path.join(dir, 'index.html'), html);
  const out = path.join(vdir, 'renders', 'proof.mp4');
  const r = Bun.spawnSync([...HF, 'render', dir, '-q', 'delivery', '--fps', '60', '--no-browser-gpu', '-o', out], { stdout: 'inherit', stderr: 'inherit' });
  if (r.exitCode !== 0) throw new Error(`proof render failed (exit ${r.exitCode})`);
  console.log(path.relative(ROOT, out));
}

function master(pid: string) {
  const dir = path.join(ROOT, 'projects', pid), json = JSON.parse(readFileSync(path.join(dir, 'project.json'), 'utf8'));
  const src = path.join(dir, 'video', 'renders', 'video.mp4');
  if (!existsSync(src)) throw new Error(`projects/${pid}/video/renders/video.mp4 is missing; render the HyperFrames project first`);
  mkdirSync(path.join(ROOT, 'out'), { recursive: true });
  const out = path.join(ROOT, 'out', `${pid}.mp4`);
  ffmpeg(['-i', src, '-i', path.join(dir, json.audio), '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k',
    '-shortest', '-movflags', '+faststart', out]);
  console.log(`out/${pid}.mp4`);
}

// ------------------------------------------------------------------ MODEL STEPS
// Each runs headless Claude Code (`claude -p`) on a prompt from prompts/ (with prompts/_common.md), in the repo
// root, allowed to read the repo except other projects (and out/), to write only the files its step names, and to
// run only the commands it needs. After a step, the mechanical checks (scripts/check.ts) run; their problems go
// back to the step, up to 3 rounds. Every run's result (and its cost) is kept in work/agent/log/.
//   align-review  only when the alignment flags suspect placements (work/qa/align_flags.json): corrections in
//                 tuning.py, then the analysis runs again (2 rounds at most)
//   treatment     data/treatment.md + data/style.json (checked: style)
//   cues          data/cues.json (checked: style, cues)
//   scenes        each custom scene the sheet plays that does not exist yet, app/src/scenes/<id>-*.ts, one run per
//                 scene (checked: scene:<file>)
//   review        contact sheets at every cue's anchor (work/qa/review/), judged against the cues and fixed at the
//                 source; up to 2 rounds, until a round changes nothing
// Environment: VID_MODEL (claude --model), VID_BUDGET (--max-budget-usd per run).
const CLAUDE = Bun.which('claude') ?? `${process.env.HOME}/.local/bin/claude`;
const abs = (p: string) => `/${path.join(ROOT, p)}`; // (a permission rule's absolute path starts with //)

function promptText(pid: string, name: string, vars: Record<string, string>) {
  const p = project(pid), json = JSON.parse(readFileSync(path.join(ROOT, 'projects', pid, 'project.json'), 'utf8'));
  const all: Record<string, string> = { id: pid, title: p.title, kind: p.kind, transcript: json.transcript, ...vars };
  const text = ['_common', name].map((f) => readFileSync(path.join(ROOT, 'prompts', `${f}.md`), 'utf8')).join('\n\n');
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => all[k] ?? `{{${k}}}`);
}

interface AgentOpts { write: string[]; bash?: string[]; vars?: Record<string, string>; extra?: string }

function agent(pid: string, name: string, o: AgentOpts) {
  const ids = Object.keys(loadProjects()), others = ids.filter((x) => x !== pid);
  // A scene belongs to the longest project id it starts with (harvest-remix-vault is harvest-remix's, not harvest's);
  // every scene but the library's and this project's is hidden, the first videos' unprefixed ones too.
  const owner = (f: string) => ids.filter((x) => f.startsWith(`${x}-`)).sort((a, b) => b.length - a.length)[0];
  const scenes = readdirSync(path.join(ROOT, 'app', 'src', 'scenes'))
    .filter((f) => !/^(lib-|_)/.test(f) && owner(f) !== pid).map((f) => `app/src/scenes/${f}`);
  // (and the docs that describe the existing videos: each video is its own)
  const hidden = [...others.flatMap((x) => [`projects/${x}/**`, `app/src/${x}/**`]), ...scenes,
    ...readdirSync(path.join(ROOT, 'docs')).filter((f) => ![undefined, pid].includes(owner(f.toLowerCase()))).map((f) => `docs/${f}`),
    'out/**', 'README.md', 'docs/PIPELINE.md', 'docs/TREATMENT.md'];
  const allow = ['Read', 'Glob', 'Grep', ...o.write.flatMap((w) => [`Write(${abs(w)})`, `Edit(${abs(w)})`]), ...(o.bash ?? []).map((b) => `Bash(${b}:*)`)];
  const deny = hidden.flatMap((h) => [`Read(${abs(h)})`, `Grep(${abs(h)})`]);
  const text = promptText(pid, name, o.vars ?? {}) + (o.extra ? `\n\n${o.extra}` : '');
  const args = [CLAUDE, '-p', text, '--output-format', 'json', '--permission-mode', 'default', '--no-session-persistence',
    ...(process.env.VID_MODEL ? ['--model', process.env.VID_MODEL] : []), ...(process.env.VID_BUDGET ? ['--max-budget-usd', process.env.VID_BUDGET] : []),
    '--allowedTools', ...allow, '--disallowedTools', ...deny];
  console.log(`\n[${name}] claude -p prompts/${name}.md${o.extra ? ' (+ problems to fix)' : ''} ...`);
  const t0 = performance.now();
  const r = Bun.spawnSync(args, { cwd: ROOT, stdout: 'pipe', stderr: 'inherit' });
  const out = r.stdout.toString();
  const log = path.join(ROOT, 'projects', pid, 'work', 'agent', 'log');
  mkdirSync(log, { recursive: true });
  writeFileSync(path.join(log, `${new Date().toISOString().replace(/[:.]/g, '-')}-${name}.json`), out);
  let res: { result?: string; is_error?: boolean; total_cost_usd?: number; num_turns?: number };
  try { res = JSON.parse(out); } catch { throw new Error(`${name}: claude exited ${r.exitCode} without a result:\n${out.slice(0, 2000)}`); }
  const mins = ((performance.now() - t0) / 60000).toFixed(1);
  console.log(`[${name}] ${mins} min, ${res.num_turns ?? '?'} turns, $${(res.total_cost_usd ?? 0).toFixed(2)}\n${(res.result ?? '').trim()}`);
  const costs = path.join(ROOT, 'projects', pid, 'work', 'agent', 'costs.json');
  const c = existsSync(costs) ? JSON.parse(readFileSync(costs, 'utf8')) : {};
  c[name] = +((c[name] ?? 0) + (res.total_cost_usd ?? 0)).toFixed(4);
  writeFileSync(costs, JSON.stringify(c, null, 1) + '\n');
  if (r.exitCode !== 0 || res.is_error) throw new Error(`${name}: the model step failed (exit ${r.exitCode})`);
}

/** The mechanical checks of `stages`: their problems, empty when all pass. */
function check(pid: string, stages: string[]): string[] {
  const r = Bun.spawnSync(['bun', 'scripts/check.ts', pid, ...stages], { cwd: path.join(ROOT, 'app'), stdout: 'pipe', stderr: 'pipe' });
  if (r.exitCode === 0) return [];
  return r.stdout.toString().split('\n').filter((l) => l.startsWith('- ')).map((l) => l.slice(2)).concat(r.stderr.toString().trim() ? [r.stderr.toString().trim()] : []);
}

/** A model step, then its checks; the problems go back to it, up to `rounds` runs in all. */
function checked(pid: string, name: string, stages: string[], o: AgentOpts, rounds = 3) {
  let extra = o.extra;
  for (let k = 1; ; k++) {
    agent(pid, name, { ...o, extra });
    const problems = check(pid, stages);
    if (!problems.length) { console.log(`[${name}] checks ok (${stages.join(', ')})`); return; }
    console.log(`[${name}] ${problems.length} problem(s) after run ${k}:\n  ${problems.slice(0, 20).join('\n  ')}`);
    if (k >= rounds) throw new Error(`${name}: checks still fail after ${rounds} runs`);
    extra = `The mechanical checks (bun app/scripts/check.ts ${pid} ${stages.join(' ')}) found these problems in what you wrote. Fix every one of them (the files are as you left them):\n${problems.map((x) => `- ${x}`).join('\n')}`;
  }
}

/** The sheet's custom (non-library) scenes. */
const customScenes = (pid: string) => [...new Set((loadSheet(pid)?.entries ?? []).map((e) => e.file).filter((f) => !LIBRARY[f]))];
/** Custom scenes whose module does not exist yet. */
const missingScenes = (pid: string) => customScenes(pid).filter((f) => !existsSync(path.join(ROOT, 'app/src/scenes', `${f}.ts`)));

/** Contact sheets of every entry (a frame 0.25 s after each cue's anchor) and the cue list beside them. */
async function reviewSheets(pid: string) {
  const p = project(pid), dir = path.join(ROOT, 'projects', pid, 'work', 'qa', 'review');
  mkdirSync(dir, { recursive: true });
  for (const f of readdirSync(dir)) if (f.endsWith('.png')) Bun.spawnSync(['rm', path.join(dir, f)]);
  const ly = new Lyrics(await Bun.file(path.join(ROOT, p.data, 'lyrics.json')).json());
  const au = new AudioData(await Bun.file(path.join(ROOT, p.data, 'audio.json')).json());
  const sheet = loadSheet(pid)!;
  const entries = resolveEntries(ly, au, sheet, resolveCues(ly, au, sheet, Object.keys(loadStyle(pid).palettes)));
  const spec = entries.map((e, i) => {
    const out = path.join(dir, `${String(i + 1).padStart(2, '0')}-${e.def.id}.png`);
    const shots = [{ t: e.start + 0.4, label: `${e.def.id} opens` }, ...e.cues.map((c) => ({ t: c.at + 0.25, label: c.id }))]
      .map((s) => ({ ...s, t: +Math.min(Math.max(s.t, e.start + 0.05), e.end - 0.05).toFixed(2) }));
    return { out, times: shots.map((s) => s.t), labels: shots.map((s) => s.label), cols: 4, entry: e };
  });
  let md = `# Review: ${p.title}\n\nOne contact sheet per entry: its first moment, then a frame 0.25 s after each cue's anchor.\n`;
  for (const s of spec) {
    const e = s.entry;
    md += `\n## ${path.basename(s.out)}: entry \`${e.def.id}\` (\`${e.def.file}\`${e.def.params ? ` ${JSON.stringify(e.def.params)}` : ''}), ${e.start.toFixed(2)}–${e.end.toFixed(2)} s\n\n`;
    for (const c of e.cues) md += `- **${c.id}** at ${c.at.toFixed(2)} s${c.line ? ` "${c.line.text}"` : ' (instrumental)'}, palette ${c.def.palette}: ${c.def.initial} → ${c.def.action} → **${c.def.result}**${c.def.params ? ` params ${JSON.stringify(c.def.params)}` : ''}\n`;
  }
  writeFileSync(path.join(dir, 'cues.md'), md);
  writeFileSync(path.join(dir, 'spec.json'), JSON.stringify(spec.map(({ entry: _, ...s }) => s)));
  const r = Bun.spawnSync(['bun', 'scripts/render.ts', 'sheets', '--project', pid, '--spec', path.join(dir, 'spec.json')],
    { cwd: path.join(ROOT, 'app'), stdout: 'inherit', stderr: 'inherit' });
  if (r.exitCode !== 0) throw new Error(`review sheets failed to render (exit ${r.exitCode}): a scene fails to load or throws`);
}

async function make(pid: string, force: string[], draft: boolean, renderToo: boolean, only?: string[]) {
  const dir = path.join(ROOT, 'projects', pid);
  const json = JSON.parse(readFileSync(path.join(dir, 'project.json'), 'utf8'));
  const frozen = (s: string) => json.frozen?.includes(s) || (only !== undefined && !only.includes(s));
  // (a forced step starts from scratch: given its previous outputs, it revises them instead of starting over)
  const run = (s: string, out: string[]) => {
    if (frozen(s)) return false;
    if (!force.includes(s)) return out.some((f) => !existsSync(path.join(dir, f)));
    for (const f of out) rmSync(path.join(dir, f), { force: true });
    return true;
  };
  analyze(pid, force);

  // the alignment's suspect placements, reviewed on their plots (the analysis runs again on the corrections)
  for (let round = 1; round <= 2 && !json.frozen?.includes('align') && !frozen('align-review'); round++) {
    const flags = path.join(dir, 'work', 'qa', 'align_flags.json');
    const n = existsSync(flags) ? JSON.parse(readFileSync(flags, 'utf8')).length : 0;
    if (!n) break;
    console.log(`\n[align-review] ${n} suspect placement(s), round ${round}`);
    agent(pid, 'align', { write: [`projects/${pid}/tuning.py`] });
    analyze(pid);
  }

  const brief = Bun.spawnSync(['bun', 'scripts/brief.ts', pid], { cwd: path.join(ROOT, 'app'), stdout: 'inherit', stderr: 'inherit' });
  if (brief.exitCode !== 0) throw new Error('brief failed');
  const CHECK = 'bun app/scripts/check.ts';
  if (run('treatment', ['data/treatment.md', 'data/style.json']))
    checked(pid, 'treatment', ['style'], { write: [`projects/${pid}/data/treatment.md`, `projects/${pid}/data/style.json`], bash: [CHECK] });
  if (run('cues', ['data/cues.json']))
    checked(pid, 'cues', ['style', 'cues'], { write: [`projects/${pid}/data/cues.json`], bash: [CHECK] });
  // the custom scenes, one run each (a scene gets the step's whole attention and context); forced: all of them again
  const scenes = frozen('scenes') ? [] : force.includes('scenes') ? customScenes(pid) : missingScenes(pid);
  for (const f of scenes) {
    if (force.includes('scenes')) rmSync(path.join(ROOT, 'app', 'src', 'scenes', `${f}.ts`), { force: true });
    checked(pid, 'scenes', [`scene:${f}`], {
      write: [`app/src/scenes/${f}.ts`, `projects/${pid}/work/**`], bash: [CHECK, 'bun app/scripts/render.ts', 'bunx tsc'],
      vars: { missing: `\`${f}\`` },
    });
  }

  // a sheet that no longer fits the data (an analysis rerun moved a section boundary or a line) goes back to the cue
  // step with the problems, before anything renders it
  const stale = frozen('cues') ? [] : check(pid, ['style', 'cues']);
  if (stale.length) {
    console.log(`\n[cues] the sheet no longer resolves against the data (${stale.length} problem(s)): repairing`);
    checked(pid, 'cues', ['style', 'cues'], { write: [`projects/${pid}/data/cues.json`], bash: [CHECK],
      extra: `data/cues.json exists but no longer fits the data (the analysis changed after it was written). Keep the edit as it is and fix only these problems:\n${stale.map((x) => `- ${x}`).join('\n')}` });
  }

  for (let round = 1; round <= 2 && !frozen('review'); round++) {
    await reviewSheets(pid);
    const verdict = path.join(dir, 'work', 'qa', 'review.md');
    Bun.spawnSync(['rm', '-f', verdict]);
    checked(pid, 'review', ['style', 'cues', 'scenes'], {
      write: [`projects/${pid}/data/cues.json`, `projects/${pid}/data/style.json`, `app/src/scenes/${pid}-*`, `projects/${pid}/work/**`],
      bash: [CHECK, 'bun app/scripts/render.ts'], vars: { round: String(round) },
    });
    const first = existsSync(verdict) ? readFileSync(verdict, 'utf8').split('\n')[0]!.trim() : '';
    console.log(`[review] round ${round}: ${first || 'no verdict written'}`);
    if (first === 'VERDICT: PASS') break;
  }
  if (loadSheet(pid)) Bun.spawnSync(['bun', 'scripts/cues.ts', '--project', pid], { cwd: path.join(ROOT, 'app'), stdout: 'inherit', stderr: 'inherit' });
  const costs = path.join(dir, 'work', 'agent', 'costs.json');
  if (existsSync(costs)) console.log(`\nmodel steps, cost so far: ${readFileSync(costs, 'utf8').trim()}`);
  if (renderToo) render(pid, draft ? ['--samples', '1', '--preset', 'veryfast'] : []);
}

try {
  if (cmd === 'check') {
    if (argv.length > 2 || (id && !['--full', '--update-baseline'].includes(id))) throw new Error('usage: ./vid check [--full|--update-baseline]');
    const r = Bun.spawnSync([process.execPath, 'scripts/quality.ts', ...argv.slice(1)], { cwd: path.join(ROOT, 'app'), stdout: 'inherit', stderr: 'inherit' });
    process.exit(r.exitCode);
  }
  else if (cmd === 'new') create(id!);
  else if (!id) throw new Error('usage: ./vid check | new|analyze|status|render|run|make|video|assemble|snap|proof|master <id> (see app/scripts/vid.ts)');
  else if (cmd === 'analyze') analyze(id, opt('force')?.split(',') ?? []);
  else if (cmd === 'status') status(id);
  else if (cmd === 'render') render(id, argv.slice(2));
  else if (cmd === 'run') { analyze(id); render(id, []); }
  else if (cmd === 'video') video(id);
  else if (cmd === 'assemble') assemble(id);
  else if (cmd === 'snap') snap(id, argv[2]?.startsWith('--') ? undefined : argv[2], opt('at'));
  else if (cmd === 'proof') proof(id, Number(opt('to')));
  else if (cmd === 'master') master(id);
  else if (cmd === 'make') await make(id, opt('force')?.split(',') ?? [], argv.includes('--draft'), !argv.includes('--no-render'), opt('only')?.split(','));
  else throw new Error(`unknown command '${cmd}'`);
} catch (e) {
  console.error(`vid: ${(e as Error).message}`);
  process.exit(1);
}
