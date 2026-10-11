// One timeline factory per song (the edit is song-specific: its lyric queries only match that song).
// Typed by SongId, so a song in songs.json without a timeline fails the type check.
import type { TimelineEntry } from './engine/engine';
import type { Lyrics } from './engine/lyrics';
import type { AudioData } from './engine/audio';
import type { SongId } from './songs';

export type MakeTimeline = (ly: Lyrics, au: AudioData) => TimelineEntry[];

export const TIMELINES: Record<SongId, () => Promise<{ makeTimeline: MakeTimeline }>> = {
  harvest: () => import('./timeline'),
  'force-push': () => import('./timeline-force-push'),
};
