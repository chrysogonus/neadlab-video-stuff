#!/usr/bin/env bun
// Repository checks, shared by ./vid check and CI: fast and CPU-only. With --full (./vid check --full, local
// only) also the slow ones, per project: render determinism and stills against a baseline (Chrome with a GPU), and
// the beat analysis reproducing the committed audio.json (the analysis environment and the project's work/ stems).
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, statSync } from 'node:fs';
import path from 'node:path';
import { ROOT, loadProjects } from './projects';
import { baselineFiles, frameProblems, readPNG, reproduceAnalysis, type RenderManifest } from './quality-checks';

const app = path.join(ROOT, 'app');
const bun = process.execPath;
const uv = Bun.which('uv') ?? `${process.env.HOME}/.local/bin/uv`;
const ffmpeg = Bun.which('ffmpeg') ?? `${process.env.HOME}/.local/bin/ffmpeg`;
const ffprobe = Bun.which('ffprobe') ?? path.join(path.dirname(ffmpeg), 'ffprobe');
const python = [uv, 'run', '--locked', '--project', path.join(ROOT, 'analysis/tests')];
const projects = loadProjects();

function run(name: string, cmd: string[], cwd = ROOT) {
  console.log(`\n[check] ${name}`);
  const r = Bun.spawnSync(cmd, { cwd, stdout: 'inherit', stderr: 'inherit' });
  if (r.exitCode !== 0) {
    console.error(`[check] ${name} failed (exit ${r.exitCode})`);
    process.exit(r.exitCode || 1);
  }
}

function report(name: string, problems: string[]) {
  console.log(`\n[check] ${name}`);
  if (!problems.length) return;
  console.error(`[check] ${name} failed:\n${problems.map((p) => `- ${p}`).join('\n')}`);
  process.exit(1);
}

// Masters and previews belong to their project; anything else this large is a render, a stem or model weights.
const large = Bun.spawnSync(['git', 'ls-files', '-z'], { cwd: ROOT }).stdout.toString().split('\0')
  .filter((f) => f && !/^projects\/[^/]+\/(input\/|data\/preview\.mp3$)/.test(f))
  .filter((f) => existsSync(path.join(ROOT, f)) && statSync(path.join(ROOT, f)).size > 5e6);
report('Large files', large.map((f) => `${f}: over 5 MB (only projects/*/input/ and data/preview.mp3 may be)`));

run('TypeScript (app, scripts, tests and configs)', [bun, 'run', 'typecheck'], app);
run('Python lint', [...python, 'ruff', 'check', '--config', 'analysis/pyproject.toml', 'analysis', 'projects']);
run('Python tests', [...python, 'pytest', '-q', 'analysis/tests']);
run('Bun tests', [...python, bun, 'test'], app);
run('Generated cue documents', [bun, 'scripts/cues.ts', '--check'], app);
// The pipeline's own rules (scripts/check.ts), as ./vid make applies them, for every edit it may still change.
for (const [id, p] of Object.entries(projects))
  if (!p.frozen?.includes('cues') && existsSync(path.join(ROOT, 'projects', id, 'data/cues.json')))
    run(`Pipeline rules (${id})`, [bun, 'scripts/check.ts', id, 'style', 'cues'], app);
run('Production build', [bun, 'run', 'build'], app);

const full = process.argv.includes('--full'), update = process.argv.includes('--update-baseline');
if (full || update) {
  // Fail before expensive renders: a full check never skips required analysis or creates a reference implicitly.
  if (full) for (const id of Object.keys(projects)) {
    report(`Full-check prerequisites (${id})`, [
      ...['vocals', 'drums', 'bass', 'other'].filter((s) => !existsSync(path.join(ROOT, 'projects', id, 'work/stems/htdemucs_ft', `${s}.wav`)))
        .map((s) => `missing ${s}.wav; run ./vid analyze ${id}`),
      ...(!existsSync(path.join(ROOT, 'out/baseline', id, 'samples.json')) ? [`missing baseline manifest; run ./vid check --update-baseline before refactoring`] : []),
    ]);
  }
  for (const id of Object.keys(projects)) {
    const render = [bun, 'scripts/render.ts'];
    const options = ['--project', id, '--samples', '4', '--coverage'];
    run(`Render determinism (${id})`, [...render, 'check', ...options], app);

    const base = path.join(ROOT, 'out/baseline', id), now = path.join(ROOT, 'out/check', id);
    mkdirSync(path.dirname(base), { recursive: true });
    // A prior run may have sampled a different timeline; preserve its artifacts and render a complete fresh set.
    if (!update && existsSync(now)) renameSync(now, `${now}-previous-${Date.now()}`);
    const out = update ? mkdtempSync(`${base}-pending-`) : now;
    run(`Stills (${id})`, [...render, 'stills', ...options, '--out', out], app);
    const manifest = JSON.parse(readFileSync(path.join(out, 'samples.json'), 'utf8')) as RenderManifest;
    const files = baselineFiles(out, manifest);
    if (update) {
      for (const f of files) readPNG(path.join(out, f), ffmpeg, manifest.width, manifest.height);
      if (existsSync(base)) renameSync(base, `${base}-previous-${Date.now()}`);
      renameSync(out, base);
      console.log(`[check] baseline updated: ${base} (${files.length} frames); run ./vid check --full to verify`);
      continue;
    }
    baselineFiles(base, manifest);
    report(`Stills against out/baseline/${id}/`, files.flatMap((f) => {
      const a = readPNG(path.join(base, f), ffmpeg, manifest.width, manifest.height);
      const b = readPNG(path.join(now, f), ffmpeg, manifest.width, manifest.height);
      return frameProblems(a, b, manifest.width, manifest.height).map((p) => `${f}: ${p} (see out/check/${id}/)`);
    }));

    const video = path.join(now, 'smoke.mp4');
    run(`One-second video export (${id})`, [...render, 'video', '--project', id, '--from', '0', '--to', '1', '--fps', '60', '--samples', '4', '--workers', '1', '--preset', 'veryfast', '--out', video], app);
    const probe = Bun.spawnSync([ffprobe, '-v', 'error', '-count_frames', '-show_entries', 'stream=codec_type,width,height,nb_read_frames:format=duration', '-of', 'json', video]);
    if (probe.exitCode !== 0) throw new Error(`video inspection failed: ${probe.stderr.toString().trim()}`);
    const info = JSON.parse(probe.stdout.toString()) as { streams: { codec_type: string; width?: number; height?: number; nb_read_frames?: string }[]; format: { duration: string } };
    const v = info.streams.find((s) => s.codec_type === 'video');
    report(`Video dimensions, frames, duration and audio (${id})`, [
      ...(!v || v.width !== 1920 || v.height !== 1080 || Number(v.nb_read_frames) !== 60 ? ['expected 60 video frames at 1920x1080'] : []),
      ...(!info.streams.some((s) => s.codec_type === 'audio') ? ['missing audio stream'] : []),
      ...(!(Math.abs(Number(info.format.duration) - 1) <= 1 / 60) ? ['expected a one-second export'] : []),
    ]);

    const audio = path.join(ROOT, 'projects', id, 'data/audio.json');
    console.log(`\n[check] Analysis reproduces data/audio.json (${id})`);
    reproduceAnalysis([uv, 'run', '--locked', 'python', 'analyze.py', '--project', id], path.join(ROOT, 'analysis'), audio, path.join(now, 'audio.json'));
  }
}
console.log(update ? '\n[check] baselines updated; full verification still required' : '\n[check] all checks passed');
