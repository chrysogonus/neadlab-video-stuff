// The songs this app renders, from the shared manifest (songs.json at the repo root, which the
// analysis pipeline reads too). Every song-specific path resolves from one selected entry, so the
// preview audio, the analysis and lyrics data, the export master and the output file always agree.
// Browser: ?song=<id>; scripts/render.ts: --song <id>; neither: the manifest's default.
import manifest from '../../songs.json';

export type SongId = keyof typeof manifest.songs;

export interface Song {
  id: SongId;
  title: string;
  /** Lossless master the export muxes into the mp4 (the analysis reads it too), relative to the repo root. */
  master: string;
  /** Compressed stream the browser plays, relative to the repo root. Preview only. */
  preview: string;
  /** Directory of audio.json and lyrics.json, relative to the repo root (and served at that URL path). */
  data: string;
  /** Default output file for `bun scripts/render.ts video`, relative to the repo root. */
  out: string;
}

export const SONG_IDS = Object.keys(manifest.songs) as SongId[];
export const DEFAULT_SONG = manifest.default as SongId;

/** The song with this id; an unknown id throws (never falls back to another song's assets). */
export function getSong(id: string = DEFAULT_SONG): Song {
  const s = (manifest.songs as Record<string, Omit<Song, 'id'> | undefined>)[id];
  if (!s) throw new Error(`unknown song '${id}' (songs.json has: ${SONG_IDS.join(', ')})`);
  const { title, master, preview, data, out } = s;
  return { id: id as SongId, title, master, preview, data, out };
}
