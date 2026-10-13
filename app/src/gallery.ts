// The gallery: every library scene in turn over a project's song, each with its schema's example parameters,
// so the whole library can be looked at (and rendered, render.ts gallery) on real lyrics and audio. The song's
// lines are dealt out in order: each scene gets an equal run of consecutive lines, one cue per line.
import type { Lyrics } from './engine/lyrics';
import type { AudioData } from './engine/audio';
import type { CueDef, CueSheet } from './engine/cues';
import { makeStyle, type Style } from './engine/style';
import { LIBRARY } from './library';

/** Two palettes, so every scene can be checked on a dark and a light ground (?palette=night|day). */
export const GALLERY_STYLE: Style = makeStyle({
  palettes: {
    night: { bg: '#0D0F14', type: '#F1EEE6', accent: '#FFB547', accent2: '#5CC8FF' },
    day: { bg: '#F2EEE5', type: '#16181D', accent: '#E0482B', accent2: '#1F6FD1' },
  },
});

export function gallerySheet(ly: Lyrics, au: AudioData, palette = 'night', only?: string[]): CueSheet {
  const names = Object.keys(LIBRARY).filter((n) => !only || only.includes(n));
  const sectionOf = (t: number) => au.sections.find((s) => t >= s.start - 1e-3 && t < s.end)!.name;
  const n = ly.lines.length, K = names.length;
  const seen = new Map<string, number>();
  const occ = ly.lines.map((l) => { const k = seen.get(l.text) ?? 0; seen.set(l.text, k + 1); return k; });
  const cues: CueDef[] = [];
  const entries = names.map((name, i) => {
    const s = LIBRARY[name]!;
    const lines = ly.lines.slice(Math.floor((i * n) / K), Math.floor(((i + 1) * n) / K));
    lines.forEach((l, j) => cues.push({
      id: `L${l.i}`, lyric: l.text, ...(seen.get(l.text)! > 1 ? { occurrence: occ[l.i] } : {}), scene: name, section: sectionOf(l.start),
      initial: '-', action: '-', result: '-', anchor: { word: l.words.at(-1)!.w }, palette, region: 'full', transition: 'cut', motif: '-',
      params: s.example.cues[j % s.example.cues.length],
    }));
    return { id: name, file: name, cut: i === 0 ? { at: 'zero' as const } : { at: 'beat' as const, cue: `L${lines[0]!.i}` }, params: s.example.entry };
  });
  return { entries, cues };
}
