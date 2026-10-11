// bun test (from app/): song configuration, selection propagation, the Force Push cue sheet and timeline.
import { describe, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import path from 'node:path';
import manifest from '../../songs.json';
import { DEFAULT_SONG, SONG_IDS, getSong } from '../src/songs';
import { TIMELINES } from '../src/timelines';
import { Lyrics } from '../src/engine/lyrics';
import { AudioData } from '../src/engine/audio';
import { CUES, ENTRIES, type CueDef } from '../src/force-push/cues';
import { CueError, resolveCues, resolveEntries } from '../src/force-push/resolve';
import { makeTimeline } from '../src/timeline-force-push';
import { pageURL } from '../scripts/page-url';

const ROOT = path.resolve(import.meta.dir, '../..');
const load = async (song: string) => {
  const s = getSong(song);
  return {
    ly: new Lyrics(await Bun.file(path.join(ROOT, s.data, 'lyrics.json')).json()),
    au: new AudioData(await Bun.file(path.join(ROOT, s.data, 'audio.json')).json()),
  };
};

describe('song configuration', () => {
  test('every song in songs.json has a timeline, and only those', () => {
    expect(Object.keys(TIMELINES).sort()).toEqual([...SONG_IDS].sort());
    expect(SONG_IDS).toContain(DEFAULT_SONG);
  });
  test('unknown songs fail clearly', () => {
    expect(() => getSong('nope')).toThrow(/unknown song 'nope'/);
  });
  test('each song resolves to its own existing files', () => {
    const seen = new Map<string, string>();
    for (const id of SONG_IDS) {
      const s = getSong(id);
      for (const f of [s.master, s.preview, `${s.data}/audio.json`, `${s.data}/lyrics.json`]) {
        expect(existsSync(path.join(ROOT, f))).toBe(true);
        expect(seen.get(f)).toBeUndefined(); // no two songs share an asset
        seen.set(f, id);
      }
      expect(s.out.startsWith('out/')).toBe(true);
    }
  });
  test('analysis data carries the master it was made from', async () => {
    for (const id of ['force-push'] as const) {
      const s = getSong(id);
      const au = await Bun.file(path.join(ROOT, s.data, 'audio.json')).json();
      const ly = await Bun.file(path.join(ROOT, s.data, 'lyrics.json')).json();
      const sha = new Bun.CryptoHasher('sha256').update(await Bun.file(path.join(ROOT, s.master)).arrayBuffer()).digest('hex');
      expect(au.source.sha256).toBe(sha);
      expect(ly.source.sha256).toBe(sha);
      expect(au.source.file).toBe(s.master);
    }
  });
  test('the Python pipeline picks the same song and paths', () => {
    const uv = Bun.which('uv') ?? `${process.env.HOME}/.local/bin/uv`;
    if (!existsSync(uv)) return; // (no analysis environment here)
    const r = Bun.spawnSync([uv, 'run', '--project', path.join(ROOT, 'analysis'), 'python', '-c',
      'import common, json; print(json.dumps(dict(song=common.SONG, audio=str(common.AUDIO), data=str(common.DATA))))', '--song', 'force-push'],
    { cwd: path.join(ROOT, 'analysis') });
    expect(r.exitCode).toBe(0);
    const py = JSON.parse(r.stdout.toString().trim().split('\n').pop()!);
    const s = getSong('force-push');
    expect(py.song).toBe('force-push');
    expect(py.audio).toBe(path.join(ROOT, s.master));
    expect(py.data).toBe(path.join(ROOT, s.data));
    const bad = Bun.spawnSync([uv, 'run', '--project', path.join(ROOT, 'analysis'), 'python', '-c', 'import common', '--song', 'nope'], { cwd: path.join(ROOT, 'analysis') });
    expect(bad.exitCode).not.toBe(0);
    expect(bad.stderr.toString()).toContain("unknown song 'nope'");
  }, 60000);
  test('manifest default is harvest (existing behaviour kept)', () => {
    expect(manifest.default).toBe('harvest');
  });
});

describe('render.ts page URL', () => {
  test('keeps a --url with its own path and query, and sets song/only/scale', () => {
    const u = new URL(pageURL('http://localhost:5190/sub/?foo=1', { song: 'force-push', only: 'intro,graph', scale: 2 }));
    expect(u.pathname).toBe('/sub/');
    expect(u.searchParams.get('foo')).toBe('1');
    expect(u.searchParams.get('export')).toBe('1');
    expect(u.searchParams.get('song')).toBe('force-push');
    expect(u.searchParams.get('only')).toBe('intro,graph');
    expect(u.searchParams.get('scale')).toBe('2');
    expect(new URL(pageURL('http://localhost:5173', { song: 'harvest', scale: 1 })).searchParams.has('scale')).toBe(false);
  });
});

describe('Force Push cue sheet', async () => {
  const { ly, au } = await load('force-push');
  test('resolves, and every sung line has exactly one cue', () => {
    const r = resolveCues(ly, au);
    const lines = [...r.values()].filter((c) => c.line).map((c) => c.line!.i);
    expect(new Set(lines).size).toBe(ly.lines.length);
    expect(lines.length).toBe(ly.lines.length);
  });
  test('timings are finite and inside the song; anchors inside their lines', () => {
    for (const c of resolveCues(ly, au).values()) {
      for (const v of [c.start, c.end, c.at]) { expect(Number.isFinite(v)).toBe(true); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(au.duration); }
      expect(c.end).toBeGreaterThan(c.start);
      if (c.word) { expect(c.at).toBeGreaterThanOrEqual(c.start); expect(c.at).toBeLessThan(c.end); }
    }
  });
  const fails = (cues: CueDef[], re: RegExp) => {
    try { resolveCues(ly, au, cues, ENTRIES); } catch (e) { expect(e).toBeInstanceOf(CueError); expect((e as Error).message).toMatch(re); return; }
    throw new Error('expected a CueError');
  };
  const swap = (id: string, patch: Partial<CueDef>) => CUES.map((c) => (c.id === id ? { ...c, ...patch } : c));
  test('a missing lyric is reported', () => fails(swap('L03', { lyric: 'Four years in' }), /L03: lyric not found/));
  test('an ambiguous repeated lyric is reported with its matches', () => fails(swap('L15', { occurrence: undefined }), /L15: .* is ambiguous \(lines 15, 37\)/));
  test('an occurrence out of range is reported', () => fails(swap('L15', { occurrence: 5 }), /occurrence 5 .* out of range/));
  test('a missing anchor word is reported', () => fails(swap('L04', { anchor: { word: 'drawer' } }), /L04: anchor word "drawer" not in line 4/));
  test('a cue in the wrong section is reported', () => fails(swap('L25', { section: 'bridge' }), /L25: starts at .* outside section bridge/));
  test('an uncovered line is reported', () => fails(CUES.filter((c) => c.id !== 'L40'), /line 40 .* has no cue/));
});

describe('Force Push timeline', async () => {
  const { ly, au } = await load('force-push');
  test('entries tile the whole song with no gaps or overlaps', () => {
    const es = resolveEntries(ly, au);
    expect(es[0]!.start).toBe(0);
    for (let i = 1; i < es.length; i++) expect(es[i]!.start).toBe(es[i - 1]!.end);
    expect(es[es.length - 1]!.end).toBe(au.duration);
    for (const e of es) expect(e.end - e.start).toBeGreaterThan(5);
  });
  test('no cut lands while the previous line is still being sung (beyond a 0.15 s tail)', () => {
    for (const e of resolveEntries(ly, au).slice(1)) {
      const sung = ly.lines.filter((l) => l.start < e.start && l.end > e.start + 0.15);
      expect(sung.map((l) => `${e.def.id} cuts into line ${l.i}`)).toEqual([]);
    }
  });
  test('makeTimeline hands each entry its module and cues', () => {
    const tl = makeTimeline(ly, au);
    expect(tl.map((e) => e.id)).toEqual(ENTRIES.map((e) => e.id));
    for (const e of tl) {
      expect(e.file).toMatch(/^force-push-/);
      expect(existsSync(path.join(import.meta.dir, '../src/scenes', `${e.file}.ts`))).toBe(true);
      expect((e.params!.cues as unknown[]).length).toBeGreaterThan(0);
    }
  });
});
