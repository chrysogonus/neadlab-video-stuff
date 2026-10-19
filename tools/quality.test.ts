import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { reproduceAnalysis } from './quality-checks';

const dirs: string[] = [];
const temp = () => { const dir = mkdtempSync(path.join(tmpdir(), 'video-quality-test-')); dirs.push(dir); return dir; };
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });

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
