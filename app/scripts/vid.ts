#!/usr/bin/env bun
// The pipeline: audio + transcript in, rendered video out, one step after another (run from the repo root as ./vid).
//   ./vid new <id> --audio <file> --transcript <file> [--title <title>]   create projects/<id>/
//   ./vid analyze <id> [--force step,step]   run the analysis steps whose inputs changed (see STEPS)
//   ./vid status <id>                        which steps are current, stale or missing
//   ./vid render <id> [render.ts options]    the final video (default: --samples auto --shutter 0.2); needs the
//                                            project's cue sheet, data/cues.json (and optionally data/style.json)
//   ./vid run <id>                           analyze, then render
// A step runs when an output is missing or its inputs' contents changed since it last ran (hashes in
// work/steps.json). A step with no record whose outputs all exist is adopted as current: committed data
// (a fresh clone, a migrated project) is never recomputed just because it has no record. Steps listed in
// project.json's "frozen" never run: their committed outputs cannot be made again (Harvest's alignment).
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT, project } from './projects';

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
    { id: 'sheet', script: 'lyrics_sheet.py', inputs: [transcript, 'tuning.py'], outputs: ['data/lines.txt', 'data/sections.json'],
      what: 'transcript -> lines and sections' },
    { id: 'stems', script: 'separate.py', inputs: [master], outputs: STEMS, what: 'Demucs stem separation (GPU)' },
    { id: 'vocal', script: 'vocal_feats.py', inputs: [STEMS[0]!], outputs: ['work/vocal_feats.npz'], what: 'vocal pitch, loudness and onsets' },
    { id: 'ctc', script: 'ctc_emissions.py', inputs: [STEMS[0]!], outputs: EMISSIONS, what: 'CTC emissions of two acoustic models (GPU)' },
    { id: 'whisper', script: 'whisper_run.py', args: ['turbo'], inputs: [STEMS[0]!, 'data/lines.txt', 'tuning.py'],
      outputs: ['work/whisper_turbo_prompt.json'], what: 'Whisper word timestamps (the cross-check)' },
    { id: 'sung', script: 'sung.py', inputs: ['data/lines.txt', 'work/whisper_turbo_prompt.json', 'tuning.py', ...EMISSIONS],
      outputs: ['data/sung.json'], what: 'lines the vocal sings differently from the transcript' },
    { id: 'align', script: 'align.py', args: ['--plots'],
      inputs: ['data/lines.txt', 'data/sung.json', 'work/vocal_feats.npz', 'work/whisper_turbo_prompt.json', 'tuning.py', ...EMISSIONS],
      outputs: ['data/lyrics.json'], what: 'word-level forced alignment + QA plots' },
    { id: 'beats', script: 'analyze.py', inputs: [master, ...STEMS, 'data/lyrics.json', 'data/sections.json', 'tuning.py'],
      outputs: ['data/audio.json'], what: 'beat grid, bars, sections, envelopes, onsets' },
  ];
}

const hashFile = (f: string) => existsSync(f) ? createHash('sha256').update(readFileSync(f)).digest('hex') : 'missing';

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

try {
  if (cmd === 'new') create(id!);
  else if (!id) throw new Error('usage: ./vid new|analyze|status|render|run <id> (see app/scripts/vid.ts)');
  else if (cmd === 'analyze') analyze(id, opt('force')?.split(',') ?? []);
  else if (cmd === 'status') status(id);
  else if (cmd === 'render') render(id, argv.slice(2));
  else if (cmd === 'run') { analyze(id); render(id, []); }
  else throw new Error(`unknown command '${cmd}'`);
} catch (e) {
  console.error(`vid: ${(e as Error).message}`);
  process.exit(1);
}
