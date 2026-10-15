#!/usr/bin/env bun
// Fast, CPU-only repository checks. Shared by ./vid check and CI.
import path from 'node:path';
import { ROOT } from './projects';

const app = path.join(ROOT, 'app');
const uv = Bun.which('uv') ?? `${process.env.HOME}/.local/bin/uv`;
const python = [uv, 'run', '--locked', '--project', path.join(ROOT, 'analysis/tests')];

function run(name: string, cmd: string[], cwd = ROOT) {
  console.log(`\n[check] ${name}`);
  const r = Bun.spawnSync(cmd, { cwd, stdout: 'inherit', stderr: 'inherit' });
  if (r.exitCode !== 0) {
    console.error(`[check] ${name} failed (exit ${r.exitCode})`);
    process.exit(r.exitCode || 1);
  }
}

run('TypeScript (app, scripts, tests and configs)', [process.execPath, 'run', 'typecheck'], app);
run('Python lint', [...python, 'ruff', 'check', '--config', 'analysis/pyproject.toml', 'analysis', 'projects']);
run('Python tests', [...python, 'pytest', '-q', 'analysis/tests']);
run('Bun tests', [...python, process.execPath, 'test'], app);
run('Generated cue documents', [process.execPath, 'scripts/cues.ts', '--check'], app);
run('Production build', [process.execPath, 'run', 'build'], app);
console.log('\n[check] all checks passed');
