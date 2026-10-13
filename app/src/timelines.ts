// How a project's timeline is made: from its cue sheet (projects/<id>/data/cues.json, see engine/cues.ts), or,
// for a project edited in code before cue sheets existed, from its timeline module.
import type { TimelineEntry } from './engine/engine';
import type { SceneClass } from './engine/scene';
import type { Lyrics } from './engine/lyrics';
import type { AudioData } from './engine/audio';
import { CueError, resolveCues, resolveEntries, type CueSheet } from './engine/cues';
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
    return resolveEntries(ly, au, sheet, resolveCues(ly, au, sheet, Object.keys(style.palettes))).map((e) => ({
      id: e.def.id,
      file: e.def.file,
      load: scene(e.def.file),
      start: e.start,
      end: e.end,
      params: { ...e.def.params, cues: e.cues },
    }));
  };
}
