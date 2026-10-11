// The Force Push edit: one timeline entry per ENTRIES row (force-push/cues.ts), cut by its rule against the
// aligned data (data/force-push/), each handed its resolved cues. See docs/FORCE-PUSH-CUES.md.
import type { TimelineEntry } from './engine/engine';
import type { SceneClass } from './engine/scene';
import type { Lyrics } from './engine/lyrics';
import type { AudioData } from './engine/audio';
import { resolveEntries } from './force-push/resolve';

// (a template import rather than import.meta.glob, so this module also loads under bun test)
const scene = (file: string) => () => import(`./scenes/${file}.ts`) as Promise<{ default: SceneClass }>;

export function makeTimeline(ly: Lyrics, au: AudioData): TimelineEntry[] {
  return resolveEntries(ly, au).map((e) => ({
    id: e.def.id,
    file: e.def.file,
    load: scene(e.def.file),
    start: e.start,
    end: e.end,
    params: { ...e.def.params, cues: e.cues },
  }));
}
