import { afterEach, describe, expect, test } from 'bun:test';
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { baselineFiles, coverageTimes, frameFile, frameProblems, readPNG, reproduceAnalysis, type RenderManifest } from '../scripts/quality-checks';

const dirs: string[] = [];
const temp = () => { const dir = mkdtempSync(path.join(tmpdir(), 'video-quality-test-')); dirs.push(dir); return dir; };
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });

describe('visual comparison failures', () => {
  test('two empty or equally truncated decodes cannot pass', () => {
    expect(frameProblems(new Uint8Array(), new Uint8Array(), 1, 1).length).toBeGreaterThan(0);
    expect(frameProblems(new Uint8Array(2), new Uint8Array(2), 1, 1).length).toBeGreaterThan(0);
  });
  test('small raster noise is allowed, but a large change or too many changed pixels fails', () => {
    const a = new Uint8Array(3000), b = a.slice();
    expect(frameProblems(a, b, 1000, 1)).toEqual([]);
    b[0] = 1;
    expect(frameProblems(a, b, 1000, 1)).toEqual([]);
    b[3] = 1;
    expect(frameProblems(a, b, 1000, 1).length).toBeGreaterThan(0);
    b[3] = 0; b[0] = 9;
    expect(frameProblems(a, b, 1000, 1).length).toBeGreaterThan(0);
  });
  test('a failing decoder is rejected even when it produced bytes', () => {
    const dir = temp(), file = path.join(dir, 'frame.png'), decoder = path.join(dir, 'decoder');
    writeFileSync(file, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=', 'base64'));
    writeFileSync(decoder, '#!/bin/sh\nprintf abc\nexit 1\n'); chmodSync(decoder, 0o755);
    expect(() => readPNG(file, decoder, 1, 1)).toThrow(/decode/i);
  });
  test('successful decoding with no pixels is rejected', () => {
    const dir = temp(), file = path.join(dir, 'frame.png'), decoder = path.join(dir, 'decoder');
    writeFileSync(file, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=', 'base64'));
    writeFileSync(decoder, '#!/bin/sh\nexit 0\n'); chmodSync(decoder, 0o755);
    expect(() => readPNG(file, decoder, 1, 1)).toThrow(/pixels/i);
    expect(() => readPNG(file, decoder, 2, 1)).toThrow(/2x1/);
    writeFileSync(file, 'broken PNG');
    expect(() => readPNG(file, decoder, 1, 1)).toThrow(/not a PNG/);
  });
});

describe('coverage and baseline integrity', () => {
  const entries = [{ id: 'intro', start: 0, end: 2, anchors: [1] }, { id: 'verse', start: 2, end: 4, anchors: [2.5] }];
  const manifest: RenderManifest = { project: 'test', width: 1, height: 1, samples: 4, shutter: 0.5, entries, times: coverageTimes(entries, 4) };
  test('samples every scene, cue anchor, and both sides of a transition at 60 fps', () => {
    expect(manifest.times).toEqual([0, 1 / 60, 1, 119 / 60, 121 / 60, 2.5, 3, 239 / 60]);
    expect(new Set(manifest.times.map(frameFile)).size).toBe(manifest.times.length);
    expect(() => coverageTimes([], 4)).toThrow();
    expect(() => coverageTimes([{ ...entries[0]!, anchors: [NaN] }], 4)).toThrow();
  });
  test('missing, empty, incomplete, and stale baselines fail', () => {
    const dir = temp();
    expect(() => baselineFiles(path.join(dir, 'missing'), manifest)).toThrow(/missing/);
    expect(() => baselineFiles(dir, manifest)).toThrow(/missing/);
    writeFileSync(path.join(dir, 'samples.json'), JSON.stringify(manifest));
    expect(() => baselineFiles(dir, manifest)).toThrow(/incomplete/);
    for (const t of manifest.times) writeFileSync(path.join(dir, frameFile(t)), 'frame');
    expect(baselineFiles(dir, manifest)).toEqual(manifest.times.map(frameFile));
    expect(() => baselineFiles(dir, { ...manifest, samples: 1 })).toThrow(/settings differ/);
    writeFileSync(path.join(dir, 'extra.png'), 'unexpected');
    expect(() => baselineFiles(dir, manifest)).toThrow(/unexpected/);
  });
});

describe('analysis isolation', () => {
  test('a failed analysis that writes output leaves reference bytes intact', () => {
    const dir = temp(), original = path.join(dir, 'audio.json'), output = path.join(dir, 'new.json'), script = path.join(dir, 'analysis.ts');
    writeFileSync(original, 'reference');
    writeFileSync(script, "await Bun.write(process.argv.at(-1)!, 'partial'); process.exit(1);");
    expect(() => reproduceAnalysis([process.execPath, script], dir, original, output)).toThrow(/failed/);
    expect(readFileSync(original, 'utf8')).toBe('reference');
    expect(readFileSync(output, 'utf8')).toBe('partial');
  });
  test('changed analysis output fails, identical output passes, and in-place output is refused', () => {
    const dir = temp(), original = path.join(dir, 'audio.json'), output = path.join(dir, 'new.json'), script = path.join(dir, 'analysis.ts');
    writeFileSync(original, 'reference');
    writeFileSync(script, "await Bun.write(process.argv.at(-1)!, 'changed');");
    expect(() => reproduceAnalysis([process.execPath, script], dir, original, output)).toThrow(/differs/);
    expect(readFileSync(original, 'utf8')).toBe('reference');
    writeFileSync(script, "await Bun.write(process.argv.at(-1)!, 'reference');");
    expect(() => reproduceAnalysis([process.execPath, script], dir, original, output)).not.toThrow();
    expect(() => reproduceAnalysis([process.execPath, script], dir, original, original)).toThrow(/separate/);
    writeFileSync(script, 'process.exit(0);');
    expect(() => reproduceAnalysis([process.execPath, script], dir, original, output)).toThrow();
    expect(readFileSync(original, 'utf8')).toBe('reference');
  });
});
