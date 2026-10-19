#!/usr/bin/env bun
// Repository checks, shared by ./vid check and CI: fast and CPU-only. With --full (./vid check --full, local only)
// also the beat analysis reproducing every project's committed audio.json (the analysis environment and the
// project's work/ stems).
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { reproduceAnalysis } from './quality-checks';

const ROOT = path.resolve(import.meta.dir, '..');
const bun = process.execPath;
const uv = Bun.which('uv') ?? `${process.env.HOME}/.local/bin/uv`;
const python = [uv, 'run', '--locked', '--project', path.join(ROOT, 'analysis/tests')];
const projects = readdirSync(path.join(ROOT, 'projects')).filter((id) => existsSync(path.join(ROOT, 'projects', id, 'project.json')));

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

// Masters belong to their project; anything else this large is a render, a stem or model weights.
const large = Bun.spawnSync(['git', 'ls-files', '-z'], { cwd: ROOT }).stdout.toString().split('\0')
  .filter((f) => f && !/^projects\/[^/]+\/input\//.test(f))
  .filter((f) => existsSync(path.join(ROOT, f)) && statSync(path.join(ROOT, f)).size > 5e6);
report('Large files', large.map((f) => `${f}: over 5 MB (only projects/*/input/ may be)`));

run('TypeScript (tools)', [bun, 'run', 'typecheck'], import.meta.dir);
run('Python lint', [...python, 'ruff', 'check', '--config', 'analysis/pyproject.toml', 'analysis', 'projects']);
run('Python tests', [...python, 'pytest', '-q', 'analysis/tests']);
run('Bun tests', [bun, 'test'], import.meta.dir);

if (process.argv.includes('--full')) {
  // Fail before the slow analysis: a full check never skips a project.
  report('Full-check prerequisites', projects.flatMap((id) => ['vocals', 'drums', 'bass', 'other']
    .filter((s) => !existsSync(path.join(ROOT, 'projects', id, 'work/stems/htdemucs_ft', `${s}.wav`)))
    .map((s) => `${id}: missing ${s}.wav; run ./vid analyze ${id}`)));
  for (const id of projects) {
    const now = path.join(ROOT, 'out/check', id);
    mkdirSync(now, { recursive: true });
    console.log(`\n[check] Analysis reproduces data/audio.json (${id})`);
    reproduceAnalysis([uv, 'run', '--locked', 'python', 'analyze.py', '--project', id], path.join(ROOT, 'analysis'),
      path.join(ROOT, 'projects', id, 'data/audio.json'), path.join(now, 'audio.json'));
  }
}
console.log('\n[check] all checks passed');
