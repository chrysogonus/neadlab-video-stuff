// The cue sheet (projects/<id>/data/cues.json) and its resolution against the project's word timings and beat
// grid. A sheet lists the timeline entries (which scene module plays, and the rule its cut follows) and one cue
// per sung line (plus cues for the instrumental passages it stages): what is on screen, what happens, and the
// word or downbeat the action lands on. Every problem (a malformed cue, a lyric that is missing, ambiguous or
// out of range, an anchor word not in its line, a cue in the wrong section, a line with no cue, an entry with
// no cues) is collected and thrown together, so a broken sheet fails loudly at load.
import type { AudioData } from './audio';
import { Lyrics, type Line, type Word } from './lyrics';
import { plain } from './type';

export const REGIONS = ['left', 'right', 'center', 'top', 'bottom', 'full'] as const;
export const TRANSITIONS = ['cut', 'match', 'pullback', 'wipe', 'stamp', 'none'] as const;
export type Region = (typeof REGIONS)[number];
export type Transition = (typeof TRANSITIONS)[number];
/** A point in the song: a downbeat index, the song's start/end, or an edge of another cue. */
export type Ref = number | 'start' | 'end' | { cue: string; edge: 'start' | 'end' };
/** What the cue's dominant action lands on: a sung word of the line (nth occurrence in it) or a downbeat. */
export type Anchor = { word: string; nth?: number } | { bar: number };

export interface CueDef {
  id: string;
  /** Lyric cue: the line's exact text (straight or curly quotes) and, if that text repeats, which occurrence (0-based). */
  lyric?: string;
  occurrence?: number;
  /** Instrumental cue: the span it covers. */
  span?: [Ref, Ref];
  /** Timeline entry that plays it, and the audio section (data/audio.json) it must start in. */
  scene: string;
  section: string;
  initial: string;
  action: string;
  result: string;
  anchor: Anchor;
  /** One of the project's palettes (style.json). */
  palette: string;
  region: Region;
  transition: Transition;
  /** State of the recurring motif at this cue. */
  motif: string;
  /** The scene's parameters for this cue (a library scene's schema says which). */
  params?: Record<string, unknown>;
  assets?: string[];
  notes?: string;
}

/** Where a timeline entry starts. */
export type Cut =
  | { at: 'zero' }
  /** On the downbeat with this index (or `beats` grid beats after it: a cut held past a hit). */
  | { at: 'bar'; bar: number; beats?: number }
  /** At the first word of a cue (a phrase boundary). */
  | { at: 'word'; cue: string }
  /** On the last beat at or before a cue's first word; if the previous line is still being sung there, at the phrase boundary. */
  | { at: 'beat'; cue: string }
  /** When a cue's line ends. */
  | { at: 'end'; cue: string };

/** A timeline entry: the scene module (src/scenes/<file>.ts) that plays from its cut to the next entry's. */
export interface EntryDef { id: string; file: string; cut: Cut; params?: Record<string, unknown> }

export interface CueSheet { entries: EntryDef[]; cues: CueDef[] }

export interface ResolvedCue {
  def: CueDef;
  id: string;
  /** The sung line (lyric cues). */
  line: Line | null;
  start: number;
  end: number;
  /** When the dominant action lands (the anchor word's start, or the anchor downbeat). */
  at: number;
  /** The anchor word (lyric cues anchored on a word). */
  word: Word | null;
}

export interface ResolvedEntry { def: EntryDef; start: number; end: number; cues: ResolvedCue[] }

export class CueError extends Error {
  constructor(public problems: string[]) {
    super(`cue sheet: ${problems.length} problem(s)\n  ${problems.join('\n  ')}`);
  }
}

const key = (s: string) => plain(s).replace(/\s+/g, ' ').trim();
const CUTS = ['zero', 'bar', 'word', 'beat', 'end'];

/** Line indices whose text equals `text` (quote style and spacing ignored). */
export function linesMatching(ly: Lyrics, text: string): number[] {
  const k = key(text);
  return ly.lines.filter((l) => key(l.text) === k).map((l) => l.i);
}

/** Problems with the sheet's shape (a sheet is data, written by hand or by a model): fields, vocabularies, ids. */
function shapeProblems(sheet: CueSheet, palettes?: string[]): string[] {
  const problems: string[] = [];
  if (!Array.isArray(sheet?.entries) || !Array.isArray(sheet?.cues)) return ['a cue sheet needs "entries" and "cues" arrays'];
  const str = (v: unknown) => typeof v === 'string' && v.length > 0;
  const ids = new Set<string>();
  for (const e of sheet.entries) {
    const at = (e?.cut as { at?: string } | undefined)?.at;
    if (!str(e?.id) || !str(e?.file)) problems.push(`entry ${JSON.stringify(e)}: needs "id" and "file"`);
    else if (ids.has(e.id)) problems.push(`entry ${e.id}: duplicate id`);
    if (e?.params !== undefined && (typeof e.params !== 'object' || e.params === null || Array.isArray(e.params))) problems.push(`entry ${e?.id}: params must be an object`);
    else ids.add(e.id);
    if (!at || !CUTS.includes(at)) problems.push(`entry ${e?.id}: cut.at must be one of ${CUTS.join(', ')}`);
    else if (at === 'bar' ? !Number.isInteger((e.cut as { bar: number }).bar) : at !== 'zero' && !str((e.cut as { cue: string }).cue))
      problems.push(`entry ${e.id}: cut at '${at}' needs ${at === 'bar' ? 'an integer "bar"' : 'a "cue"'}`);
  }
  for (const c of sheet.cues) {
    const id = c?.id ?? JSON.stringify(c).slice(0, 60);
    for (const f of ['id', 'scene', 'section', 'initial', 'action', 'result', 'palette', 'motif'] as const)
      if (!str(c?.[f])) problems.push(`${id}: needs "${f}"`);
    if (!REGIONS.includes(c?.region)) problems.push(`${id}: region must be one of ${REGIONS.join(', ')}`);
    if (!TRANSITIONS.includes(c?.transition)) problems.push(`${id}: transition must be one of ${TRANSITIONS.join(', ')}`);
    const a = c?.anchor as Partial<{ word: string; bar: number }> | undefined;
    if (!a || (str(a.word) === Number.isInteger(a.bar))) problems.push(`${id}: anchor must be {"word": ...} or {"bar": <downbeat>}`);
    if (palettes && str(c?.palette) && !palettes.includes(c.palette)) problems.push(`${id}: palette '${c.palette}' is not in style.json (${palettes.join(', ')})`);
    if (c?.params !== undefined && (typeof c.params !== 'object' || c.params === null || Array.isArray(c.params))) problems.push(`${id}: params must be an object`);
  }
  return problems;
}

/** `palettes`: the names a cue's palette must be one of (style.json); unchecked if not given. */
export function resolveCues(ly: Lyrics, au: AudioData, sheet: CueSheet, palettes?: string[]) {
  const problems = shapeProblems(sheet, palettes);
  if (problems.length) throw new CueError(problems);
  const { cues, entries } = sheet;
  const out = new Map<string, ResolvedCue>();
  const seen = new Set<string>();
  const ids = new Set(entries.map((e) => e.id));
  const downbeat = (k: number) => {
    if (!Number.isInteger(k) || k < 0 || k >= au.downbeats.length) { problems.push(`downbeat ${k} out of range (0..${au.downbeats.length - 1})`); return NaN; }
    return au.downbeats[k]!;
  };

  // lyric cues first (instrumental spans may refer to them)
  for (const c of cues) {
    if (seen.has(c.id)) problems.push(`${c.id}: duplicate cue id`);
    seen.add(c.id);
    if (!ids.has(c.scene)) problems.push(`${c.id}: scene '${c.scene}' is not a timeline entry`);
    if (!!c.lyric === !!c.span) { problems.push(`${c.id}: needs exactly one of lyric / span`); continue; }
    if (!c.lyric) continue;
    const m = linesMatching(ly, c.lyric);
    if (m.length === 0) { problems.push(`${c.id}: lyric not found: "${c.lyric}"`); continue; }
    if (m.length > 1 && c.occurrence === undefined) { problems.push(`${c.id}: "${c.lyric}" is ambiguous (lines ${m.join(', ')}): set occurrence 0..${m.length - 1}`); continue; }
    const occ = c.occurrence ?? 0;
    if (occ < 0 || occ >= m.length) { problems.push(`${c.id}: occurrence ${occ} of "${c.lyric}" out of range (${m.length} found: lines ${m.join(', ')})`); continue; }
    const line = ly.lines[m[occ]!]!;
    let at = line.start, word: Word | null = null;
    if ('word' in c.anchor) {
      const a = c.anchor;
      const ws = line.words.filter((w) => key(w.w) === key(a.word));
      word = ws[a.nth ?? 0] ?? null;
      if (!word) { problems.push(`${c.id}: anchor word "${a.word}"${a.nth ? ` #${a.nth}` : ''} not in line ${line.i} "${line.text}"`); continue; }
      at = word.start;
    } else at = downbeat(c.anchor.bar);
    out.set(c.id, { def: c, id: c.id, line, start: line.start, end: line.end, at, word });
  }
  const ref = (c: CueDef, r: Ref): number => {
    if (r === 'start') return 0;
    if (r === 'end') return au.duration;
    if (typeof r === 'number') return downbeat(r);
    const o = out.get(r.cue);
    if (!o) { problems.push(`${c.id}: span refers to unknown or unresolved cue '${r.cue}'`); return NaN; }
    return r.edge === 'start' ? o.start : o.end;
  };
  for (const c of cues) {
    if (!c.span) continue;
    const a = ref(c, c.span[0]), b = ref(c, c.span[1]);
    if (!(b > a)) { problems.push(`${c.id}: span is empty or reversed (${a} .. ${b})`); continue; }
    const at = 'bar' in c.anchor ? downbeat(c.anchor.bar) : a;
    out.set(c.id, { def: c, id: c.id, line: null, start: a, end: b, at, word: null });
  }

  // every cue starts inside its section; times are finite and inside the song
  for (const r of out.values()) {
    const s = au.sections.find((x) => x.name === r.def.section);
    if (!s) problems.push(`${r.id}: unknown section '${r.def.section}'`);
    else if (r.start < s.start - 1e-3 || r.start >= s.end) problems.push(`${r.id}: starts at ${r.start.toFixed(2)} s, outside section ${s.name} (${s.start}–${s.end})`);
    for (const [k, v] of [['start', r.start], ['end', r.end], ['at', r.at]] as const)
      if (!Number.isFinite(v) || v < 0 || v > au.duration + 1e-6) problems.push(`${r.id}: ${k} ${v} not inside the song`);
  }
  // every sung line has a cue (full coverage of the lyric)
  const covered = new Set([...out.values()].filter((r) => r.line).map((r) => r.line!.i));
  for (const l of ly.lines) if (!covered.has(l.i)) problems.push(`line ${l.i} "${l.text}" has no cue`);
  if (problems.length) throw new CueError(problems);
  return out;
}

/** Entry start times from their cut rules (see Cut). */
function cutTime(cut: Cut, cues: Map<string, ResolvedCue>, ly: Lyrics, au: AudioData): number {
  const lastBeatAtOrBefore = (t: number) => au.timeOfBeat(Math.floor(au.beatAt(t + 0.02)));
  switch (cut.at) {
    case 'zero': return 0;
    case 'bar': return cut.beats ? au.timeOfBeat(Math.round(au.beatAt(au.downbeats[cut.bar]!)) + cut.beats) : au.downbeats[cut.bar]!;
    case 'word': return cues.get(cut.cue)!.start;
    case 'end': return cues.get(cut.cue)!.end;
    case 'beat': {
      const c = cues.get(cut.cue)!, t = Math.min(lastBeatAtOrBefore(c.start), c.start);
      // the previous line must have finished (or nearly) by the cut, or the cut waits for the phrase boundary
      const prev = c.line ? ly.lines[c.line.i - 1] : null;
      return prev && prev.end > t + 0.12 ? c.start : t;
    }
  }
}

/** The edit: entries in order, each from its cut to the next one's (the last to the end of the song). */
export function resolveEntries(ly: Lyrics, au: AudioData, sheet: CueSheet, cues = resolveCues(ly, au, sheet)): ResolvedEntry[] {
  const problems: string[] = [];
  const { entries } = sheet;
  const starts = entries.map((e) => {
    const missing = 'cue' in e.cut && !cues.has(e.cut.cue);
    if (missing) problems.push(`entry ${e.id}: cut refers to unknown cue '${(e.cut as { cue: string }).cue}'`);
    else if (e.cut.at === 'bar' && !(e.cut.bar >= 0 && e.cut.bar < au.downbeats.length)) {
      problems.push(`entry ${e.id}: downbeat ${e.cut.bar} out of range (0..${au.downbeats.length - 1})`);
      return NaN;
    }
    return missing ? NaN : cutTime(e.cut, cues, ly, au);
  });
  if (entries[0] && entries[0].cut.at !== 'zero') problems.push(`entry ${entries[0].id}: the first entry must cut at 'zero'`);
  const res = entries.map((def, i) => ({
    def, start: starts[i]!, end: i + 1 < entries.length ? starts[i + 1]! : au.duration,
    cues: [...cues.values()].filter((c) => c.def.scene === def.id).sort((a, b) => a.start - b.start),
  }));
  for (const e of res) {
    if (!(e.end > e.start)) problems.push(`entry ${e.def.id}: empty or reversed (${e.start.toFixed(3)} .. ${e.end.toFixed(3)})`);
    if (!e.cues.length) problems.push(`entry ${e.def.id}: no cues`);
    for (const c of e.cues) if (c.start < e.start - 0.5 || c.start >= e.end) problems.push(`entry ${e.def.id}: cue ${c.id} starts at ${c.start.toFixed(2)}, outside the entry (${e.start.toFixed(2)}–${e.end.toFixed(2)})`);
  }
  if (problems.length) throw new CueError(problems);
  return res;
}
