import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';

export interface CoverageEntry { id: string; start: number; end: number; anchors: number[] }
export interface RenderManifest {
  project: string; width: number; height: number; samples: number; shutter: number;
  entries: CoverageEntry[]; times: number[];
}

/** One midpoint per entry, every anchor, and frames on either side of every transition. */
export function coverageTimes(entries: CoverageEntry[], duration: number): number[] {
  if (!entries.length || !Number.isFinite(duration) || duration <= 0) throw new Error('no valid timeline to sample');
  const last = Math.ceil(duration * 60) - 1, frames = new Set([0, last]);
  const add = (frame: number) => { if (frame >= 0 && frame <= last) frames.add(frame); };
  for (const e of entries) {
    if (![e.start, e.end, ...e.anchors].every(Number.isFinite) || e.start < 0 || e.end <= e.start || e.end > duration)
      throw new Error(`invalid timeline entry ${e.id}`);
    add(Math.round((e.start + e.end) * 30));
    for (const t of [e.start, e.end]) { add(Math.floor(t * 60) - 1); add(Math.ceil(t * 60) + 1); }
    for (const t of e.anchors) {
      if (t < e.start || t >= e.end) throw new Error(`anchor outside entry ${e.id}: ${t}`);
      add(Math.round(t * 60));
    }
  }
  return [...frames].sort((a, b) => a - b).map((f) => f / 60);
}

export const frameFile = (t: number) => `f_${String(Math.round(t * 60)).padStart(6, '0')}.png`;

/** The manifest and the complete frame set must exist before a baseline can be compared. */
export function baselineFiles(base: string, expected: RenderManifest): string[] {
  const manifest = path.join(base, 'samples.json');
  if (!existsSync(manifest)) throw new Error(`${base}: missing baseline manifest; run ./vid check --update-baseline before refactoring`);
  if (JSON.stringify(JSON.parse(readFileSync(manifest, 'utf8'))) !== JSON.stringify(expected))
    throw new Error(`${base}: baseline timings or render settings differ (samples.json); review the change before updating the baseline`);
  if (!expected.times.length) throw new Error(`${base}: no baseline samples`);
  const files = expected.times.map(frameFile);
  if (new Set(files).size !== files.length) throw new Error(`${base}: duplicate baseline samples`);
  const actual = readdirSync(base).filter((f) => f.endsWith('.png')).sort();
  if (JSON.stringify(actual) !== JSON.stringify([...files].sort())) throw new Error(`${base}: incomplete or unexpected baseline PNGs`);
  return files;
}

/** Analysis receives a separate output path; its failure cannot overwrite the reference data. */
export function reproduceAnalysis(command: string[], cwd: string, original: string, output: string): void {
  if (path.resolve(original) === path.resolve(output)) throw new Error('analysis output must be separate from the reference');
  rmSync(output, { force: true });
  const r = Bun.spawnSync([...command, '--output', output], { cwd, stdout: 'inherit', stderr: 'inherit' });
  if (r.exitCode !== 0) throw new Error(`analysis failed (exit ${r.exitCode}); reference data was not replaced`);
  if (!readFileSync(output).equals(readFileSync(original))) throw new Error(`analysis differs from ${original}; new output: ${output}`);
}

/** Decode a rendered PNG for pixel comparisons. */
export function readPNG(file: string, ffmpeg: string, width: number, height: number): Buffer {
  const png = readFileSync(file);
  if (png.length < 33 || !png.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) || png.toString('ascii', 12, 16) !== 'IHDR')
    throw new Error(`${file}: not a PNG`);
  if (png.readUInt32BE(16) !== width || png.readUInt32BE(20) !== height)
    throw new Error(`${file}: expected ${width}x${height}`);
  const r = Bun.spawnSync([ffmpeg, '-v', 'error', '-i', file, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']);
  if (r.exitCode !== 0) throw new Error(`${file}: decode failed (${r.exitCode}): ${r.stderr.toString().trim()}`);
  if (r.stdout.length !== width * height * 3) throw new Error(`${file}: decoded ${r.stdout.length} bytes of pixels, expected ${width * height * 3}`);
  return r.stdout;
}

export function frameProblems(a: Uint8Array, b: Uint8Array, width: number, height: number): string[] {
  if (width <= 0 || height <= 0 || a.length !== width * height * 3 || b.length !== a.length)
    return ['not rendered or a different size'];
  let px = 0, max = 0;
  for (let i = 0; i < a.length; i += 3) {
    const d = Math.max(Math.abs(a[i]! - b[i]!), Math.abs(a[i + 1]! - b[i + 1]!), Math.abs(a[i + 2]! - b[i + 2]!));
    if (d) { px++; max = Math.max(max, d); }
  }
  return max > 8 || px / (a.length / 3) > 0.001 ? [`max ${max} levels on ${px} px`] : [];
}
