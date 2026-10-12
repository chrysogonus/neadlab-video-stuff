// bun test (from app/): project configuration, selection propagation, cue sheets (the generic resolver on Force
// Push's sheet) and timelines, styles.
import { describe, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { getProject } from '../src/projects';
import { CODE_TIMELINES, sheetTimeline } from '../src/timelines';
import { Lyrics } from '../src/engine/lyrics';
import { AudioData } from '../src/engine/audio';
import { CueError, resolveCues, resolveEntries, type CueDef, type CueSheet } from '../src/engine/cues';
import { DEFAULT_STYLE, makeStyle } from '../src/engine/style';
import { pageURL } from '../scripts/page-url';
import { ROOT, loadProjects, loadSheet, loadStyle, project } from '../scripts/projects';

const IDS = Object.keys(loadProjects());
const load = async (id: string) => {
  const p = project(id);
  return {
    ly: new Lyrics(await Bun.file(path.join(ROOT, p.data, 'lyrics.json')).json()),
    au: new AudioData(await Bun.file(path.join(ROOT, p.data, 'audio.json')).json()),
  };
};

describe('project configuration', () => {
  test('every project has a cue sheet or a code timeline (not both), and its style loads', () => {
    for (const id of IDS) {
      expect([id, !!loadSheet(id) !== !!CODE_TIMELINES[id]]).toEqual([id, true]);
      expect(() => loadStyle(id)).not.toThrow();
    }
    for (const id of Object.keys(CODE_TIMELINES)) expect(IDS).toContain(id);
  });
  test('unknown or unchosen projects fail clearly', () => {
    expect(() => project('nope')).toThrow(/unknown project 'nope' \(projects\/ has: force-push, harvest\)/);
    expect(() => project()).toThrow(/choose a project .*: force-push, harvest/);
    const one = { solo: { title: 'Solo', kind: 'song' as const, audio: 'input/a.wav', transcript: 'input/a.txt' } };
    expect(getProject(one).id).toBe('solo');
  });
  test('each project resolves to its own existing files', () => {
    const seen = new Map<string, string>();
    for (const id of IDS) {
      const p = project(id);
      for (const f of [p.master, p.preview, `${p.data}/audio.json`, `${p.data}/lyrics.json`]) {
        expect(existsSync(path.join(ROOT, f))).toBe(true);
        expect(seen.get(f)).toBeUndefined(); // no two projects share an asset
        seen.set(f, id);
      }
      expect(p.out).toBe(`out/${id}.mp4`);
    }
  });
  test('analysis data carries the master it was made from', async () => {
    for (const id of ['force-push', 'harvest']) {
      const p = project(id);
      const sha = new Bun.CryptoHasher('sha256').update(await Bun.file(path.join(ROOT, p.master)).arrayBuffer()).digest('hex');
      const au = await Bun.file(path.join(ROOT, p.data, 'audio.json')).json();
      expect(au.source.sha256).toBe(sha);
      expect(`projects/${id}/${au.source.file}`).toBe(p.master);
      // (Harvest's lyrics.json predates the pipeline and carries no source)
      if (id === 'force-push') expect((await Bun.file(path.join(ROOT, p.data, 'lyrics.json')).json()).source.sha256).toBe(sha);
    }
  });
  test('the Python pipeline picks the same project and paths', () => {
    const uv = Bun.which('uv') ?? `${process.env.HOME}/.local/bin/uv`;
    if (!existsSync(uv)) return; // (no analysis environment here)
    const r = Bun.spawnSync([uv, 'run', '--project', path.join(ROOT, 'analysis'), 'python', '-c',
      'import common, json; print(json.dumps(dict(project=common.PROJECT, audio=str(common.AUDIO), data=str(common.DATA))))', '--project', 'force-push'],
    { cwd: path.join(ROOT, 'analysis') });
    expect(r.exitCode).toBe(0);
    const py = JSON.parse(r.stdout.toString().trim().split('\n').pop()!);
    const p = project('force-push');
    expect(py.project).toBe('force-push');
    expect(py.audio).toBe(path.join(ROOT, p.master));
    expect(py.data).toBe(path.join(ROOT, p.data));
    const bad = Bun.spawnSync([uv, 'run', '--project', path.join(ROOT, 'analysis'), 'python', '-c', 'import common', '--project', 'nope'], { cwd: path.join(ROOT, 'analysis') });
    expect(bad.exitCode).not.toBe(0);
    expect(bad.stderr.toString()).toContain("unknown project 'nope'");
  }, 60000);
});

describe('render.ts page URL', () => {
  test('keeps a --url with its own path and query, and sets project/only/scale', () => {
    const u = new URL(pageURL('http://localhost:5190/sub/?foo=1', { project: 'force-push', only: 'intro,graph', scale: 2 }));
    expect(u.pathname).toBe('/sub/');
    expect(u.searchParams.get('foo')).toBe('1');
    expect(u.searchParams.get('export')).toBe('1');
    expect(u.searchParams.get('project')).toBe('force-push');
    expect(u.searchParams.get('only')).toBe('intro,graph');
    expect(u.searchParams.get('scale')).toBe('2');
    expect(new URL(pageURL('http://localhost:5173', { project: 'harvest', scale: 1 })).searchParams.has('scale')).toBe(false);
  });
});

const FP = loadSheet('force-push')!;
const PALETTES = Object.keys(loadStyle('force-push').palettes);

describe('cue sheet (Force Push)', async () => {
  const { ly, au } = await load('force-push');
  test('resolves, and every sung line has exactly one cue', () => {
    const r = resolveCues(ly, au, FP, PALETTES);
    const lines = [...r.values()].filter((c) => c.line).map((c) => c.line!.i);
    expect(new Set(lines).size).toBe(ly.lines.length);
    expect(lines.length).toBe(ly.lines.length);
  });
  test('timings are finite and inside the song; anchors inside their lines', () => {
    for (const c of resolveCues(ly, au, FP).values()) {
      for (const v of [c.start, c.end, c.at]) { expect(Number.isFinite(v)).toBe(true); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(au.duration); }
      expect(c.end).toBeGreaterThan(c.start);
      if (c.word) { expect(c.at).toBeGreaterThanOrEqual(c.start); expect(c.at).toBeLessThan(c.end); }
    }
  });
  const fails = (cues: CueDef[], re: RegExp, entries = FP.entries) => {
    try { resolveEntries(ly, au, { entries, cues }, resolveCues(ly, au, { entries, cues }, PALETTES)); } catch (e) { expect(e).toBeInstanceOf(CueError); expect((e as Error).message).toMatch(re); return; }
    throw new Error('expected a CueError');
  };
  const swap = (id: string, patch: Partial<CueDef>) => FP.cues.map((c) => (c.id === id ? { ...c, ...patch } : c));
  test('a missing lyric is reported', () => fails(swap('L03', { lyric: 'Four years in' }), /L03: lyric not found/));
  test('an ambiguous repeated lyric is reported with its matches', () => fails(swap('L15', { occurrence: undefined }), /L15: .* is ambiguous \(lines 15, 37\)/));
  test('an occurrence out of range is reported', () => fails(swap('L15', { occurrence: 5 }), /occurrence 5 .* out of range/));
  test('a missing anchor word is reported', () => fails(swap('L04', { anchor: { word: 'drawer' } }), /L04: anchor word "drawer" not in line 4/));
  test('a cue in the wrong section is reported', () => fails(swap('L25', { section: 'bridge' }), /L25: starts at .* outside section bridge/));
  test('an uncovered line is reported', () => fails(FP.cues.filter((c) => c.id !== 'L40'), /line 40 .* has no cue/));
  // a sheet is data (written by hand or by a model): its shape is checked before anything resolves
  test('a malformed cue is reported field by field', () => fails(swap('L03', { region: 'middle' as never, anchor: { word: 'x', bar: 3 } as never, action: '' }),
    /L03: needs "action"[\s\S]*L03: region must be one of[\s\S]*L03: anchor must be/));
  test('a palette the style does not have is reported', () => fails(swap('L05', { palette: 'sepia' }), /L05: palette 'sepia' is not in style.json \(dark, paper, green\)/));
  test('a bad cut is reported', () => fails(FP.cues, /entry graph: cut.at must be one of/, FP.entries.map((e) => (e.id === 'graph' ? { ...e, cut: { at: 'drop' } as never } : e))));
  test('the first entry must start the song', () => fails(FP.cues, /entry intro: the first entry must cut at 'zero'/, FP.entries.map((e, i) => (i === 0 ? { ...e, cut: { at: 'bar', bar: 0 } } : e))));
  test('an entry no cue plays in is reported', () => fails(FP.cues.map((c) => (c.scene === 'phone' ? { ...c, scene: 'squash' } : c)), /entry phone: no cues/));
});

describe('timeline (Force Push)', async () => {
  const { ly, au } = await load('force-push');
  test('entries tile the whole song with no gaps or overlaps', () => {
    const es = resolveEntries(ly, au, FP);
    expect(es[0]!.start).toBe(0);
    for (let i = 1; i < es.length; i++) expect(es[i]!.start).toBe(es[i - 1]!.end);
    expect(es[es.length - 1]!.end).toBe(au.duration);
    for (const e of es) expect(e.end - e.start).toBeGreaterThan(5);
  });
  test('no cut lands while the previous line is still being sung (beyond a 0.15 s tail)', () => {
    for (const e of resolveEntries(ly, au, FP).slice(1)) {
      const sung = ly.lines.filter((l) => l.start < e.start && l.end > e.start + 0.15);
      expect(sung.map((l) => `${e.def.id} cuts into line ${l.i}`)).toEqual([]);
    }
  });
  test('the sheet timeline hands each entry its module and cues', () => {
    const tl = sheetTimeline(FP, loadStyle('force-push'))(ly, au);
    expect(tl.map((e) => e.id)).toEqual(FP.entries.map((e) => e.id));
    for (const e of tl) {
      expect(e.file).toMatch(/^force-push-/);
      expect(existsSync(path.join(import.meta.dir, '../src/scenes', `${e.file}.ts`))).toBe(true);
      expect((e.params!.cues as unknown[]).length).toBeGreaterThan(0);
    }
  });
});

describe('a sheet made from the data alone', async () => {
  // the shape a generated sheet takes: one entry per section that has lyrics (a plain library scene), one cue per
  // line anchored on its last word; it must resolve on any project's data
  const sheetFor = (ly: Lyrics, au: AudioData): CueSheet => {
    const seen = new Map<string, number>();
    const sectionOf = (t: number) => au.sections.find((s) => t >= s.start - 1e-3 && t < s.end)!.name;
    const cues: CueDef[] = ly.lines.map((l) => {
      const n = seen.get(l.text) ?? 0;
      seen.set(l.text, n + 1);
      const repeats = ly.lines.filter((x) => x.text === l.text).length > 1;
      return { id: `L${l.i}`, lyric: l.text, ...(repeats ? { occurrence: n } : {}), scene: sectionOf(l.start), section: sectionOf(l.start),
        initial: '-', action: '-', result: '-', anchor: { word: l.words.at(-1)!.w }, palette: 'main', region: 'full', transition: 'cut', motif: '-' };
    });
    const firsts = [...new Map([...cues].reverse().map((c) => [c.scene, c.id])).entries()].reverse(); // (each section's first line)
    return { entries: firsts.map(([sec, cue], i) => ({ id: sec, file: 'lib-plain', cut: i === 0 ? { at: 'zero' } : { at: 'beat', cue } })), cues };
  };
  for (const id of ['force-push', 'harvest']) {
    test(`${id}: resolves into entries that tile the song`, async () => {
      const { ly, au } = await load(id);
      const tl = sheetTimeline(sheetFor(ly, au), makeStyle())(ly, au);
      expect(tl[0]!.start).toBe(0);
      expect(tl.at(-1)!.end).toBe(au.duration);
      for (let i = 1; i < tl.length; i++) expect(tl[i]!.start).toBe(tl[i - 1]!.end);
    });
  }
});

describe('style.json', () => {
  test('defaults: one palette, the karaoke layer on in it', () => {
    const s = makeStyle();
    expect(Object.keys(s.palettes)).toEqual(['main']);
    expect(s.karaoke && s.karaoke.palette).toBe('main');
    expect(s).toEqual(DEFAULT_STYLE);
  });
  test('a project palette replaces the default; karaoke takes the first palette and merges by field', () => {
    const s = makeStyle({ palettes: { night: { bg: '#000000', type: '#FFFFFF', accent: '#FF0000' } }, karaoke: { size: 80 } });
    expect(Object.keys(s.palettes)).toEqual(['night']);
    expect(s.karaoke && [s.karaoke.palette, s.karaoke.size, s.karaoke.minSize]).toEqual(['night', 80, 44]);
  });
  test('the projects: Harvest draws its own lyrics everywhere, Force Push styles the layer in its dark palette', () => {
    expect(loadStyle('harvest').karaoke).toBe(false);
    const fp = loadStyle('force-push');
    expect(fp.karaoke && fp.karaoke.palette).toBe('dark');
    expect(Object.keys(fp.palettes)).toEqual(['dark', 'paper', 'green']);
  });
  test('a karaoke colour that is neither hex nor a palette key fails', () => {
    expect(() => makeStyle({ karaoke: { active: 'gold' } })).toThrow(/karaoke active 'gold' is neither a hex colour nor a key of palette 'main'/);
    // (a cue may put any palette on screen, so a key must be in all of them)
    expect(() => makeStyle({ palettes: { a: { bg: '#000000', type: '#FFFFFF', accent: '#FF0000' }, b: { bg: '#FFFFFF', type: '#000000' } } }))
      .toThrow(/karaoke active 'accent' is neither a hex colour nor a key of palette 'b'/);
    expect(() => makeStyle({ karaoke: { palette: 'nope' } })).toThrow(/karaoke palette 'nope'/);
  });
});
