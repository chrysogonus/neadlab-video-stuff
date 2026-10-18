// How a project's timeline is made: from its cue sheet (projects/<id>/data/cues.json, see engine/cues.ts), or,
// for a project edited in code before cue sheets existed, from its timeline module.
import type { TimelineEntry } from './engine/engine';
import type { SceneClass } from './engine/scene';
import type { Lyrics } from './engine/lyrics';
import type { AudioData } from './engine/audio';
import { CueError, resolveCues, resolveEntries, type CueSheet, type ResolvedCue, type ResolvedEntry } from './engine/cues';
import { libraryProblems } from './library';
import type { Style } from './engine/style';

export type MakeTimeline = (ly: Lyrics, au: AudioData) => TimelineEntry[];

/** Projects whose edit is code (their lyric queries only match their own transcript). */
export const CODE_TIMELINES: Record<string, () => Promise<{ makeTimeline: MakeTimeline }>> = {
  harvest: () => import('./timeline'),
};

// (a template import rather than import.meta.glob, so this module also loads under bun test)
const scene = (file: string) => () => import(`./scenes/${file}.ts`) as Promise<{ default: SceneClass }>;

/**
 * A cue sheet's edit: one timeline entry per sheet entry, cut by its rule, each handed its resolved cues. Throws
 * a CueError listing every problem, including the parameters of library scenes.
 */
export function sheetTimeline(sheet: CueSheet, style: Style): MakeTimeline {
  return (ly, au) => {
    const lib = libraryProblems(sheet);
    if (lib.length) throw new CueError(lib);
    const cues = resolveCues(ly, au, sheet, Object.keys(style.palettes));
    const entries = resolveEntries(ly, au, sheet, cues);
    const byId = new Map(entries.map((e) => [e.def.id, e]));
    return entries.map((e) => ({
      id: e.def.id,
      file: e.def.file,
      load: scene(e.def.file),
      start: e.start,
      // a `tail` (seconds) keeps the entry on screen past the next one's cut: an overlap the next scene composites
      // itself (e.g. shatters this one's last frame), or the engine crossfades
      end: e.end + Math.max(0, Number(e.def.params?.tail ?? 0)),
      params: { ...e.def.params, cues: e.cues, ...(e.def.params?.plan ? { plan: resolvePlan(e.def.id, e.def.params.plan as PlanDef, byId, cues) } : {}) },
    }));
  };
}

/**
 * An entry's `plan` param: one shot of a longer passage that other entries cut into. The scene times itself as if
 * it played the whole passage, from the start of entry `from` to the end of entry `to`, with every cue in `cues`
 * (its own and those of the shots cut in), so its motion runs on behind the cutaways.
 */
interface PlanDef { from: string; to: string; cues: string[] }
export interface Plan { start: number; end: number; cues: ResolvedCue[] }

function resolvePlan(id: string, p: PlanDef, entries: Map<string, ResolvedEntry>, cues: Map<string, ResolvedCue>): Plan {
  const a = entries.get(p.from), b = entries.get(p.to), problems: string[] = [];
  if (!a || !b) problems.push(`entry ${id}: plan refers to unknown entry '${!a ? p.from : p.to}'`);
  const cs = (p.cues ?? []).map((c) => cues.get(c) ?? (problems.push(`entry ${id}: plan refers to unknown cue '${c}'`), null));
  if (problems.length) throw new CueError(problems);
  return { start: a!.start, end: b!.end, cues: (cs as ResolvedCue[]).sort((x, y) => x.start - y.start) };
}
