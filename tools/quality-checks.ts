import { readFileSync, rmSync } from 'node:fs';
import path from 'node:path';

/** Analysis receives a separate output path; its failure cannot overwrite the reference data. */
export function reproduceAnalysis(command: string[], cwd: string, original: string, output: string): void {
  if (path.resolve(original) === path.resolve(output)) throw new Error('analysis output must be separate from the reference');
  rmSync(output, { force: true });
  const r = Bun.spawnSync([...command, '--output', output], { cwd, stdout: 'inherit', stderr: 'inherit' });
  if (r.exitCode !== 0) throw new Error(`analysis failed (exit ${r.exitCode}); reference data was not replaced`);
  if (!readFileSync(output).equals(readFileSync(original))) throw new Error(`analysis differs from ${original}; new output: ${output}`);
}
