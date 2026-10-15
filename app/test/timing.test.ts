import { describe, expect, test } from 'bun:test';
import { AudioData } from '../src/engine/audio';
import { Lyrics } from '../src/engine/lyrics';

describe('audio timing contracts', () => {
  const au = new AudioData({ duration: 6, bpm: 120, fps: 2, beats: [1, 1.5, 2.25, 3.25], downbeats: [1, 3.25, 6], sections: [], features: { rms: [0, 1, 0] }, onsets: { kick: [[1, 0.8], [2, 0.5]] } });
  test('tracked beats interpolate and extrapolate with the local beat period', () => {
    for (const [t, beat] of [[0.5, -1], [1, 0], [1.25, 0.5], [1.875, 1.5], [2.75, 2.5], [3.25, 3], [4.25, 4]])
      expect(au.beatAt(t!)).toBeCloseTo(beat!, 10);
    expect(au.timeOfBeat(1.5)).toBe(1.875);
    expect(au.nearestBeat(1.85)).toBe(1.5);
    expect(au.barAt(2.125)).toBe(0.5);
    expect(au.barAt(3.25)).toBe(1);
  });
  test('feature interpolation clamps at its ends and onset intervals are half open', () => {
    expect([-1, 0.25, 0.5, 5].map((t) => au.env('rms', t))).toEqual([0, 0.5, 1, 0]);
    expect(au.events('kick', 1, 2)).toEqual([[1, 0.8]]);
    expect(au.hit('kick', 0.99)).toBe(0);
    expect(au.hit('kick', 1)).toBe(0.8);
    expect(au.hit('kick', 1.11)).toBeCloseTo(0.4, 10);
  });
});

describe('lyric and karaoke timing contracts', () => {
  const ly = new Lyrics({ lines: [
    { text: 'Hello world', start: 1, end: 4, words: [{ w: 'Hello', start: 1, end: 2, syl: [[1, 1.2], [1.5, 2]] }, { w: 'world', start: 3, end: 4 }] },
    { text: 'Again', start: 5, end: 6, words: [{ w: 'Again', start: 5, end: 6 }] },
  ] });
  test('starts are inclusive, ends exclusive, and gaps have no active word or line', () => {
    expect(ly.lineAt(1)).toBe(ly.lines[0]!);
    expect(ly.lineAt(4)).toBeNull();
    expect(ly.lineAt(5)).toBe(ly.lines[1]!);
    expect(ly.wordAt(2)).toBeNull();
    expect(ly.wordAt(3)).toBe(ly.words[1]!);
    expect(ly.lastLine(4.5)).toBe(ly.lines[0]!);
    expect(ly.nextLine(4.5)).toBe(ly.lines[1]!);
    expect(ly.linesIn(4, 5)).toEqual([]);
  });
  test('syllable wipes pause through rests and reach exactly 0 and 1 at word boundaries', () => {
    const w = ly.words[0]!;
    for (const [t, progress] of [[0, 0], [1, 0], [1.1, 0.25], [1.3, 0.5], [1.75, 0.75], [2, 1]])
      expect(Lyrics.wordProgress(w, t!)).toBeCloseTo(progress!, 10);
    expect(Lyrics.lineCharProgress(ly.lines[0]!, 2.5)).toBe(6);
    expect(Lyrics.lineCharProgress(ly.lines[0]!, 3.5)).toBe(8.5);
    expect(Lyrics.lineCharProgress(ly.lines[0]!, 4)).toBe(11);
  });
});
