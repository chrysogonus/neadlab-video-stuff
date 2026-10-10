// The song. Everything song-specific that the renderer needs lives here.
// The analysis pipeline keeps its own copy of this in analysis/common.py (SONG).

/** Compressed stream the browser plays, relative to the repo root. Preview only. */
export const AUDIO = 'audio/harvest.mp3';

/** Lossless master the export muxes into the mp4. The analysis pipeline uses this too. */
export const MASTER = 'audio/harvest.wav';

/** Default output file for `bun scripts/render.ts video`, relative to the repo root. */
export const OUT = 'out/harvest.mp4';
