// Resolve the cue sheet (cues.ts) against the song's word timings and beat grid. Every problem — a lyric
// that is missing, ambiguous or out of range, an anchor word not in its line, a cue in the wrong section,
// an entry with no cues — is collected and thrown together, so a broken sheet fails loudly at load.
import type { AudioData } from '../engine/audio';
import { Lyrics, type Line, type Word } from '../engine/lyrics';
import { plain } from '../engine/type';
import { CUES, ENTRIES, type CueDef, type Cut, type EntryDef, type Ref } from './cues';

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

/** Line indices whose text equals `text` (quote style and spacing ignored). */
export function linesMatching(ly: Lyrics, text: string): number[] {
  const k = key(text);
  return ly.lines.filter((l) => key(l.text) === k).map((l) => l.i);
}

export function resolveCues(ly: Lyrics, au: AudioData, cues: CueDef[] = CUES, entries: EntryDef[] = ENTRIES) {
  const problems: string[] = [];
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

/** Entry start times from their cut rules (see Cut in cues.ts). */
function cutTime(cut: Cut, cues: Map<string, ResolvedCue>, ly: Lyrics, au: AudioData): number {
  const lastBeatAtOrBefore = (t: number) => au.timeOfBeat(Math.floor(au.beatAt(t + 0.02)));
  switch (cut.at) {
    case 'zero': return 0;
    case 'bar': return au.downbeats[cut.bar]!;
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
export function resolveEntries(ly: Lyrics, au: AudioData, cues = resolveCues(ly, au), entries: EntryDef[] = ENTRIES): ResolvedEntry[] {
  const problems: string[] = [];
  const starts = entries.map((e) => {
    const missing = 'cue' in e.cut && !cues.has(e.cut.cue);
    if (missing) problems.push(`entry ${e.id}: cut refers to unknown cue '${(e.cut as { cue: string }).cue}'`);
    return missing ? NaN : cutTime(e.cut, cues, ly, au);
  });
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
