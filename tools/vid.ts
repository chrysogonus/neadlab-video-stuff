#!/usr/bin/env bun
// The pipeline: a song and its lyric sheet in, a HyperFrames project and the upload out (run from the repo root as ./vid).
//   ./vid new <id> --audio <file> --transcript <file> [--title <title>]   create projects/<id>/
//   ./vid analyze <id> [--force step,step]   run the analysis steps whose inputs changed (see STEPS)
//   ./vid status <id>                        which steps are current, stale or missing
//   ./vid check [--full]                     fast repository quality gates (no GPU or Chrome); --full adds the
//                                            analysis reproducing every project's data/audio.json
//   ./vid video <id>                         the HyperFrames project for the music-to-video skill (see HYPERFRAMES)
//   ./vid assemble <id>                      its index.html: the skill's assembler, plus compositions/overlays/ on top
//   ./vid snap <id> [<frame_id>] --at <t,...> stills at track seconds, of the project or of one frame on its own
//                                            (checked first: a frame whose script throws fails here)
//   ./vid proof <id> [--from <s>] --to <s>   a 60 fps proof render of the project between two track seconds
//   ./vid master <id>                        its render with the master's audio -> out/<id>.mp4
// A step runs when an output is missing or its inputs' contents changed since it last ran (hashes in
// work/steps.json). A step with no record whose outputs all exist is adopted as current: committed data
// (a fresh clone, a migrated project) is never recomputed just because it has no record. Steps listed in
// project.json's "frozen" never run: their committed outputs cannot be made again (Harvest's alignment).
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const [cmd, id] = argv;
const opt = (k: string) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : undefined; };
const UV = Bun.which('uv') ?? `${process.env.HOME}/.local/bin/uv`;
const FFMPEG = Bun.which('ffmpeg') ?? `${process.env.HOME}/.local/bin/ffmpeg`;
const ROOT = path.resolve(import.meta.dir, '..');

interface Project { title: string; audio: string; transcript: string; frozen?: string[] }

/** projects/<id>/project.json; an unknown id fails with the list. */
function project(pid: string): Project {
  const file = path.join(ROOT, 'projects', pid, 'project.json');
  if (!existsSync(file)) {
    const ids = readdirSync(path.join(ROOT, 'projects')).filter((x) => existsSync(path.join(ROOT, 'projects', x, 'project.json')));
    throw new Error(`unknown project '${pid}' (projects/ has: ${ids.sort().join(', ')})`);
  }
  return JSON.parse(readFileSync(file, 'utf8'));
}

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
  const json = project(pid);
  const dir = path.join(ROOT, 'projects', pid);
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
  console.log(`\n${json.title}: analysis current (projects/${pid}/data/)`);
}

function status(pid: string) {
  const json = project(pid);
  const dir = path.join(ROOT, 'projects', pid);
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
  // the master: a WAV as given; anything else decoded once to a 48 kHz WAV (the analysis and ./vid master read it)
  let master = `input/${path.basename(audio)}`;
  copyFileSync(audio, path.join(dir, master));
  if (path.extname(audio).toLowerCase() !== '.wav') {
    const wav = master.replace(/\.[^.]+$/, '.wav');
    ffmpeg(['-i', path.join(dir, master), '-ar', '48000', '-c:a', 'pcm_s24le', path.join(dir, wav)]);
    master = wav;
  }
  const title = opt('title') ?? path.basename(audio).replace(/\.[^.]+$/, '');
  writeFileSync(path.join(dir, 'project.json'), JSON.stringify({ title, audio: master, transcript: tx }, null, 2) + '\n');
  console.log(`created projects/${pid}/ (${title}); next: ./vid analyze ${pid}`);
}

function ffmpeg(args: string[]) {
  const r = Bun.spawnSync([FFMPEG, '-v', 'error', '-y', ...args], { stdout: 'inherit', stderr: 'inherit' });
  if (r.exitCode !== 0) throw new Error(`ffmpeg ${args.join(' ')} failed`);
}

// ------------------------------------------------------------------ HYPERFRAMES
// Videos are HyperFrames projects (AGENTS.md), projects/<id>/video/, built with the music-to-video skill. This
// stage hands the skill what it cannot measure itself, next to its own analysis:
//   assets/bgm.mp3   the master (320k; regenerated, not committed)
//   audiomap.json    the skill's analyzer on bgm.mp3 (its one beat/energy map)
//   lyrics.json      the aligned lyrics (data/lyrics.json): every sung line and word with its time, and its section
// It scaffolds the project once and refreshes those three files on every run; the brief, storyboard and frames
// are never touched. `./vid master` swaps the render's lossy audio for the master's (AAC 320k) for the upload.
const HF = ['npx', '--yes', 'hyperframes@0.8.164'];
const ANALYZER = path.join(ROOT, '.agents', 'skills', 'music-to-video', 'scripts', 'analyze-beatgrid.py');

function video(pid: string) {
  const json = project(pid), dir = path.join(ROOT, 'projects', pid), vdir = path.join(dir, 'video');
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
  for (const f of ['assets/kit/hr-kit.js', 'assets/kit/wow-kit.js', 'assets/kit/motion-blur.js', 'assets/kit/README.md', 'compositions/overlays/finish.html']) {
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
    title: json.title,
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
  let dir = vdir, start = 0, checkFailed = false;
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
    // only this frame: check lints every composition in the copy, and another frame's error is not this one's
    for (const f of readdirSync(path.join(dir, 'compositions', 'frames'))) if (f !== `${frame}.html`) rmSync(path.join(dir, 'compositions', 'frames', f));
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
    // a frame whose script throws renders as a dead frame in the film without failing anything; check catches it.
    // The stills are taken either way (they are how you find the fault); a failed check fails the command after them.
    const c = Bun.spawnSync([...HF, 'check', dir, '--no-browser-gpu'], { stdout: 'pipe', stderr: 'pipe' });
    const log = c.stdout.toString() + c.stderr.toString();
    checkFailed = c.exitCode !== 0;
    if (checkFailed) console.error(log);
    else {
      for (const line of log.split('\n').filter((l) => /^\s*[✗⚠]/.test(l))) console.log(line);
      console.log(`check passed: ${frame} on its own`);
    }
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
  if (checkFailed) throw new Error(`hyperframes check failed on ${frame} on its own (its report is above the stills)`);
}

/**
 * A proof clip: the assembled project cut to [--from, --to] (track seconds) — clips outside dropped, the rest shifted
 * and trimmed — rendered at 60 fps to video/renders/proof-<from>-<to>.mp4 (one working copy per range, so frame-workers
 * can proof side by side). HyperFrames renders whole compositions only, so the cut is a copy. --from moves back to the
 * start of the frame playing there (pick it inside the previous frame to see the handoff). HyperFrames clamps a
 * negative data-start to 0, so a clip that began before the cut (the full-length overlays) is played from its offset:
 * media through data-media-start, a composition by moving its timeline (offsetComposition).
 * ponytail: a media clip's data-automation envelope is not shifted; shift it too when one is cut from the front.
 */
function proof(pid: string, from: number, to: number) {
  const vdir = path.join(ROOT, 'projects', pid, 'video');
  const r3 = (x: number) => Math.round(x * 1000) / 1000;
  const clip = /<(div|audio|video)\b[^>]*?data-start="([\d.]+)"[^>]*?data-duration="([\d.]+)"[^>]*>(?:<\/\1>)?/gs;
  const index = readFileSync(path.join(vdir, 'index.html'), 'utf8');
  const total = Number(index.match(/data-composition-id="main"[\s\S]*?data-duration="([\d.]+)"/)?.[1]);
  let t0 = from;
  for (const [tag, , start, dur] of index.matchAll(clip)) {
    const a = Number(start);
    if (tag.includes('data-composition-src="compositions/frames/') && a <= from && from < a + Number(dur!)) t0 = a;
  }
  if (!(t0 >= 0 && to > t0 && to <= total)) throw new Error(`usage: ./vid proof <id> [--from <s>] --to <s> (track seconds, 0 ≤ --from < --to ≤ ${total})`);
  const dir = path.join(vdir, '.hyperframes', `proof-${t0}-${to}`), out = path.join(vdir, 'renders', `proof-${t0}-${to}.mp4`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  linkProject(vdir, dir);
  const html = index.replace(clip, (tag, kind, start, dur) => {
    const a = Number(start), b = a + Number(dur);
    if (tag.includes('data-composition-id="main"')) return tag.replace(`data-duration="${dur}"`, `data-duration="${r3(to - t0)}"`);
    if (b <= t0 || a >= to) return '';
    let out = tag.replace(`data-start="${start}"`, `data-start="${r3(Math.max(a - t0, 0))}"`)
      .replace(`data-duration="${dur}"`, `data-duration="${r3(Math.min(b, to) - Math.max(a, t0))}"`);
    if (a < t0) {
      const off = r3(t0 - a), media = out.match(/data-media-start="([\d.]+)"/);
      if (kind !== 'div') out = media ? out.replace(media[0], `data-media-start="${r3(Number(media[1]) + off)}"`) : out.replace(`<${kind}`, `<${kind} data-media-start="${off}"`);
      else offsetComposition(dir, tag, off);
    }
    return out;
  });
  writeFileSync(path.join(dir, 'index.html'), html);
  console.log(`proof ${t0}–${to} s${t0 < from ? ` (from the start of the frame playing at ${from})` : ''}`);
  const r =Bun.spawnSync([...HF, 'render', dir, '-q', 'delivery', '--fps', '60', '--no-browser-gpu', '-o', out], { stdout: 'inherit', stderr: 'inherit' });
  if (r.exitCode !== 0) throw new Error(`proof render failed (exit ${r.exitCode})`);
  console.log(path.relative(ROOT, out));
}

/**
 * In the proof copy, move a composition's timeline `off` seconds earlier, in place: the runtime's seek fixes up the
 * timeline's own children, so a wrapper timeline renders immediateRender:false tweens wrong. GSAP shifts a timeline
 * whose child starts below 0, so: a child over before the cut is rendered at its end and removed; one under way at the
 * cut plays on through a tween of its totalTime; the rest move. (An overlay reading tl.time() itself sees proof time.)
 * It needs the timeline registered by the end of the composition's script, as the frame contract asks; otherwise the
 * injected script throws and the proof shows the clip without its animation.
 */
function offsetComposition(dir: string, tag: string, off: number) {
  const src = tag.match(/data-composition-src="([^"]+)"/)?.[1], id = tag.match(/data-composition-id="([^"]+)"/)?.[1];
  if (!src || !id) return; // a plain timed element has no timeline of its own
  const file = path.join(dir, src), text = readFileSync(file, 'utf8');
  if (!text.includes('</template>')) throw new Error(`${src}: no </template>, so the proof cannot offset it`);
  writeFileSync(file, text.replace('</template>', `<script>(() => { // ./vid proof: this clip began ${off} s before the cut
  const off = ${off}, tl = window.__timelines[${JSON.stringify(id)}];
  if (!tl) throw new Error("./vid proof: " + ${JSON.stringify(id)} + " registers no timeline by the end of its script, so it cannot be offset");
  for (const c of tl.getChildren(false, true, true)) {
    const s = c.startTime() - off, e = c.endTime() - off;
    if (e <= 0) { c.totalProgress(1); tl.remove(c); }
    else if (s < 0) { tl.remove(c); tl.fromTo(c, { totalTime: -s }, { totalTime: c.totalDuration(), duration: e, ease: "none" }, 0); }
    else c.startTime(s);
  }
})();</script>
</template>`));
}

function master(pid: string) {
  const dir = path.join(ROOT, 'projects', pid), json = project(pid);
  const src = path.join(dir, 'video', 'renders', 'video.mp4');
  if (!existsSync(src)) throw new Error(`projects/${pid}/video/renders/video.mp4 is missing; render the HyperFrames project first`);
  mkdirSync(path.join(ROOT, 'out'), { recursive: true });
  const out = path.join(ROOT, 'out', `${pid}.mp4`);
  ffmpeg(['-i', src, '-i', path.join(dir, json.audio), '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k',
    '-shortest', '-movflags', '+faststart', out]);
  console.log(`out/${pid}.mp4`);
}

try {
  if (cmd === 'check') {
    if (argv.length > 2 || (id && id !== '--full')) throw new Error('usage: ./vid check [--full]');
    const r = Bun.spawnSync([process.execPath, 'quality.ts', ...argv.slice(1)], { cwd: import.meta.dir, stdout: 'inherit', stderr: 'inherit' });
    process.exit(r.exitCode);
  }
  else if (cmd === 'new') create(id!);
  else if (!id) throw new Error('usage: ./vid check | new|analyze|status|video|assemble|snap|proof|master <id> (see tools/vid.ts)');
  else if (cmd === 'analyze') analyze(id, opt('force')?.split(',') ?? []);
  else if (cmd === 'status') status(id);
  else if (cmd === 'video') video(id);
  else if (cmd === 'assemble') assemble(id);
  else if (cmd === 'snap') snap(id, argv[2]?.startsWith('--') ? undefined : argv[2], opt('at'));
  else if (cmd === 'proof') proof(id, Number(opt('from') ?? 0), Number(opt('to')));
  else if (cmd === 'master') master(id);
  else throw new Error(`unknown command '${cmd}'`);
} catch (e) {
  console.error(`vid: ${(e as Error).message}`);
  process.exit(1);
}
