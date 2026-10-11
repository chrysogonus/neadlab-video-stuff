// Force Push: shared style tokens, the scene base class and the drawing vocabulary every scene uses
// (pills, commit nodes, panels, typed text, strikes, karaoke fitting), plus the one repository model the
// scenes share, so hashes and messages stay the same from the first graph to the last reflog.
// Local to this song: nothing here restyles Harvest. Everything is a pure function of song time.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { rgba } from '../engine/palette';
import { Lyrics, type Line, type Word } from '../engine/lyrics';
import { F, font, measure, plain } from '../engine/type';
import { clamp, ease, lerp, prog } from '../engine/util';
import { bake, drawKaraoke, hexStr, layoutWords, type KLayout, type KStyle } from '../scenes/_kit';
import type { ResolvedCue } from './resolve';

export { W, H };
export const M = 96; // title-safe margin (logical px)

// ------------------------------------------------------------------ tokens

const HEX = {
  dark: { bg: '#0B1018', panel: '#131A26', panel2: '#1A2332', rule: '#2A3546', dim: '#5E6A7C', mist: '#A3ADBB', type: '#EEF1F4', green: '#3BE07F', coral: '#FF6F61', onGreen: '#06120B' },
  paper: { bg: '#F3EFE7', panel: '#E9E3D8', panel2: '#DED7CA', rule: '#CFC7B8', dim: '#8A8274', mist: '#5F594F', type: '#15171B', green: '#0E9F4E', coral: '#D2463A', onGreen: '#F3EFE7' },
  // the last chant: a green field, ink type; consequence stays coral-ink
  green: { bg: '#3BE07F', panel: '#34CC72', panel2: '#2EB866', rule: '#27A85B', dim: '#1D6B3E', mist: '#11452A', type: '#06120B', green: '#06120B', coral: '#A3271C', onGreen: '#3BE07F' },
} as const;
export type Mode = keyof typeof HEX;

export interface Theme {
  mode: Mode;
  bg: string; panel: string; panel2: string; rule: string; dim: string; mist: string; type: string; green: string; coral: string; onGreen: string;
  /** The same colours at an alpha. */
  a: (k: Exclude<keyof Theme, 'mode' | 'a'>, alpha: number) => string;
}
const THEMES = new Map<Mode, Theme>();
export function theme(mode: Mode): Theme {
  let t = THEMES.get(mode);
  if (!t) {
    const h = HEX[mode];
    t = { mode, ...Object.fromEntries(Object.entries(h).map(([k, v]) => [k, rgba(v, 1)])) as Omit<Theme, 'mode' | 'a'>, a: (k, alpha) => rgba(h[k as keyof typeof h], alpha) } as Theme;
    THEMES.set(mode, t);
  }
  return t;
}

export const FONT = {
  slam: F.archivo(125, 900),
  hero: F.archivo(112, 900),
  line: F.archivo(100, 700),
  lineWide: F.archivo(112, 700),
  light: F.archivo(100, 300),
  mono: F.mono(400),
  monoM: F.mono(500),
  monoB: F.mono(600),
  serif: F.serif(400, true),
  serifUp: F.serif(600),
};

// ------------------------------------------------------------------ base scene

/**
 * A Force Push scene: one Canvas2D layer over the theme's ground, drawn in logical px and composited
 * opaque into `out` (so it fully overwrites it). `cue(id)` returns this entry's resolved cues.
 */
export abstract class FPScene extends Scene {
  L = new Layer2D();
  mode: Mode = 'dark';
  th = theme('dark');
  private cueMap = new Map<string, ResolvedCue>();

  override init(): void | Promise<void> {
    for (const c of (this.ctx.params.cues ?? []) as ResolvedCue[]) this.cueMap.set(c.id, c);
    this.setup();
  }
  /** Per-scene setup: layouts, geometry. Fonts, lyrics, audio and cues are available. */
  setup(): void {}
  abstract draw(c: CanvasRenderingContext2D, f: Frame): void;
  post(_f: Frame): PostOverrides { return {}; }

  cue(id: string): ResolvedCue {
    const c = this.cueMap.get(id);
    if (!c) throw new Error(`[${this.ctx.id}] no cue '${id}' in this entry (has: ${[...this.cueMap.keys()].join(', ')})`);
    return c;
  }
  line(id: string): Line {
    const l = this.cue(id).line;
    if (!l) throw new Error(`[${this.ctx.id}] cue '${id}' is not a lyric cue`);
    return l;
  }
  /** A word of a cue's line by its text (nth occurrence); throws if missing. */
  word(id: string, text: string, nth = 0): Word {
    const w = this.line(id).words.filter((x) => plain(x.w).toLowerCase() === plain(text).toLowerCase())[nth];
    if (!w) throw new Error(`[${this.ctx.id}] word "${text}" not in cue ${id}: "${this.line(id).text}"`);
    return w;
  }
  /** The beat at/before t and the beat index helpers. */
  beatTime(i: number) { return this.ctx.audio.timeOfBeat(i); }
  beatIdx(t: number) { return this.ctx.audio.beatAt(t); }

  render(f: Frame, out: THREE.WebGLRenderTarget) {
    this.L.clear();
    const c = this.L.ctx;
    c.save();
    try {
      ground(c, this.th);
      this.draw(c, f);
    } catch (e) {
      // the context outlives the frame: reset its state stack before rethrowing
      c.reset();
      this.L.clear();
      throw e;
    }
    c.restore();
    this.ctx.comp.draw(this.ctx.renderer, this.L.upload(), out, { mode: 'replace' });
    const paper = this.mode === 'dark' ? 0 : 1;
    return { halation: 0, bloom: 0.18, bloomThreshold: 0.95, bloomKnee: 0.3, grain: 0.028, ca: 0.3, vignette: paper ? 0.1 : 0.24, paper, hud: 0, ...this.post(f) };
  }
}

/** The ground: the theme's field with a faint dot grid (baked once per mode). */
const grounds = new Map<Mode, ReturnType<typeof bake>>();
export function ground(c: CanvasRenderingContext2D, th: Theme) {
  let g = grounds.get(th.mode);
  if (!g) {
    g = bake(W, H, (k) => {
      k.fillStyle = th.bg; k.fillRect(0, 0, W, H);
      k.fillStyle = th.a('type', th.mode === 'dark' ? 0.055 : 0.07);
      for (let y = 36; y < H; y += 48) for (let x = 24; x < W; x += 48) { k.beginPath(); k.arc(x, y, 1.1, 0, Math.PI * 2); k.fill(); }
    });
    grounds.set(th.mode, g);
  }
  g.draw(c, 0, 0);
}

// ------------------------------------------------------------------ timing helpers

/** Arrival: 0 → 1 over `d` s from t0 (ease-out), the house entrance. */
export const arrive = (t: number, t0: number, d = 0.25) => ease.outCubic(prog(t, t0, t0 + d));
/** Impact pulse: 1 at t0, decaying with half-life hl. 0 before. */
export const hit = (t: number, t0: number, hl = 0.09) => (t < t0 ? 0 : Math.pow(0.5, (t - t0) / hl));
/** Characters of `s` typed between t0 and t1. */
export const typed = (s: string, t: number, t0: number, t1: number) => s.slice(0, Math.round(s.length * prog(t, t0, t1)));
/** Characters of `s` typed with a sung line: each word of `words` types its share of s across its duration. */
export function typedWith(s: string, words: Word[], t: number) {
  if (!words.length) return '';
  const per = s.length / words.length;
  let n = 0;
  for (let i = 0; i < words.length; i++) n += per * Lyrics.wordProgress(words[i]!, t);
  return s.slice(0, Math.round(n));
}
/**
 * Opacity of line i of a sequence shown one at a time in one place: in up to `lead` s before it is sung,
 * out as the next one comes in — and never while a word of it is still being sung (a legato next line then
 * comes in on its first word). Consecutive lines never overlap. `end`: when the last line goes.
 */
export function lineShow(t: number, seq: Line[], i: number, end = Infinity, lead = 0.3, fin = 0.12, fout = 0.08) {
  const hand = (a: Line | undefined, b: Line) => (a ? Math.max(b.start - lead, Math.min(a.end, b.start) - 0.02) : b.start - lead);
  const l = seq[i]!, next = seq[i + 1];
  const s = hand(seq[i - 1], l), e = next ? hand(l, next) - fout * 0.5 : end;
  return clamp(Math.min((t - s) / fin, (e - t) / fout));
}

/** Block cursor: on for the first 60 % of every beat (blinks on the grid). */
export const cursorOn = (beat: number) => beat < 0 || beat - Math.floor(beat) < 0.6;

// ------------------------------------------------------------------ type

/**
 * Lay a line's words out at the largest size (<= max, >= min) that fits maxW in maxRows rows.
 * For hero lyric lines: computed once in setup, drawn every frame without reflow.
 */
export function fitWords(words: Word[], fam: string, maxW: number, max: number, min = 56, maxRows = 2, tracking = 0): KLayout {
  for (let s = max; s >= min; s -= 2) {
    const lay = layoutWords(words, fam, s, maxW, tracking * s / 100, maxRows);
    if (lay.width <= maxW && lay.rows.length <= maxRows) return lay;
  }
  return layoutWords(words, fam, min, maxW, tracking * min / 100, maxRows);
}

/** Karaoke in the theme: unsung dim, sung full type; optional per-word colour (by word text). */
export function sing(c: CanvasRenderingContext2D, lay: KLayout, t: number, x: number, y: number, th: Theme, o: Partial<KStyle> & { color?: Record<string, string>; dim?: number } = {}) {
  const col = o.color ?? {};
  return drawKaraoke(c, lay, t, x, y, {
    sung: th.type, unsung: th.a('type', o.dim ?? 0.2), lineH: 1.0, ...o,
    wordStyle: o.wordStyle ?? ((w) => {
      const k = col[plain(w.w).toLowerCase().replace(/[^a-z0-9'&-]/g, '')];
      return k ? { sung: k } : undefined;
    }),
  });
}

/** Mono text with tracking; returns its width. */
export function monoText(c: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, col: string, o: { fam?: string; track?: number; align?: CanvasTextAlign; baseline?: CanvasTextBaseline } = {}) {
  const fam = o.fam ?? FONT.mono, tr = o.track ?? 0;
  c.font = font(fam, size);
  c.letterSpacing = `${tr}px`;
  c.textAlign = o.align ?? 'left';
  c.textBaseline = o.baseline ?? 'alphabetic';
  c.fillStyle = col;
  c.fillText(s, x, y);
  c.letterSpacing = '0px';
  return measure(s, fam, size, tr);
}

/** Display text (Archivo etc.) at x,y; returns its width. */
export function text(c: CanvasRenderingContext2D, s: string, x: number, y: number, fam: string, size: number, col: string, o: { align?: CanvasTextAlign; track?: number; baseline?: CanvasTextBaseline } = {}) {
  c.font = font(fam, size);
  c.letterSpacing = `${o.track ?? 0}px`;
  c.textAlign = o.align ?? 'left';
  c.textBaseline = o.baseline ?? 'alphabetic';
  c.fillStyle = col;
  c.fillText(s, x, y);
  c.letterSpacing = '0px';
  return measure(s, fam, size, o.track ?? 0);
}

/** A strike-through drawn left to right (p 0..1). */
export function strike(c: CanvasRenderingContext2D, x0: number, y: number, x1: number, p: number, col: string, w = 6) {
  if (p <= 0) return;
  c.fillStyle = col;
  c.fillRect(x0, y - w / 2, (x1 - x0) * clamp(p), w);
}

// ------------------------------------------------------------------ interface vocabulary

/** A rounded pill label (pointers, branch names). Returns its width. */
export function pill(c: CanvasRenderingContext2D, s: string, x: number, y: number, o: { size?: number; fill?: string; color?: string; stroke?: string; glow?: string; align?: 'left' | 'center' | 'right'; fam?: string; dash?: boolean }) {
  const size = o.size ?? 26, fam = o.fam ?? FONT.monoB;
  const tw = measure(s, fam, size, 0.5);
  const pw = tw + size * 1.0, ph = size * 1.55;
  const x0 = o.align === 'center' ? x - pw / 2 : o.align === 'right' ? x - pw : x;
  c.save();
  c.beginPath(); c.roundRect(x0, y - ph / 2, pw, ph, ph / 2);
  if (o.fill) {
    if (o.glow) { c.shadowColor = o.glow; c.shadowBlur = size * 0.9; }
    c.fillStyle = o.fill; c.fill();
    c.shadowBlur = 0;
  }
  if (o.stroke) { c.strokeStyle = o.stroke; c.lineWidth = 2; if (o.dash) c.setLineDash([6, 5]); c.stroke(); }
  c.restore();
  monoText(c, s, x0 + pw / 2, y + size * 0.36, size, o.color ?? '#000', { fam, align: 'center', track: 0.5 });
  return pw;
}

/** A commit: "me" is a filled disc, "you" a hollow ring. `a` scales it in (0..1). */
export function node(c: CanvasRenderingContext2D, x: number, y: number, r: number, who: 'me' | 'you', col: string, o: { a?: number; ring?: number; fillIn?: string } = {}) {
  const k = o.a ?? 1;
  if (k <= 0) return;
  const rr = r * (0.6 + 0.4 * ease.outBack(clamp(k)));
  c.save();
  c.globalAlpha *= clamp(k * 2);
  c.beginPath(); c.arc(x, y, rr, 0, Math.PI * 2);
  if (who === 'me') { c.fillStyle = col; c.fill(); }
  else {
    if (o.fillIn) { c.fillStyle = o.fillIn; c.fill(); }
    c.strokeStyle = col; c.lineWidth = o.ring ?? Math.max(2, r * 0.32); c.stroke();
  }
  c.restore();
}

/** A flat interface panel with an optional header strip (mono title left, right label). */
export function panel(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, th: Theme, o: { title?: string; right?: string; header?: number; radius?: number; fill?: string; stroke?: string } = {}) {
  const r = o.radius ?? 14, hh = o.header ?? (o.title ? 54 : 0);
  c.save();
  c.beginPath(); c.roundRect(x, y, w, h, r);
  c.fillStyle = o.fill ?? th.panel; c.fill();
  c.strokeStyle = o.stroke ?? th.rule; c.lineWidth = 1.5; c.stroke();
  if (hh) {
    // (a filled rule, pixel-snapped: a fractional hairline stroke rasterises differently on Chrome's first draw)
    c.fillStyle = o.stroke ?? th.rule; c.fillRect(Math.round(x), Math.round(y + hh) - 1, Math.round(w), 2);
    if (o.title) monoText(c, o.title, x + 24, y + hh / 2 + 9, 24, th.mist, { fam: FONT.monoM });
    if (o.right) monoText(c, o.right, x + w - 24, y + hh / 2 + 9, 24, th.dim, { fam: FONT.monoM, align: 'right' });
  }
  c.restore();
  return { x, y: y + hh, w, h: h - hh };
}

/** A block cursor at (x, baseline y) for a mono size. */
export function cursor(c: CanvasRenderingContext2D, x: number, y: number, size: number, col: string, on = true) {
  if (!on) return;
  c.fillStyle = col;
  c.fillRect(x + 2, y - size * 0.8, size * 0.56, size * 0.98);
}

/** Camera: zoom about (cx, cy) and pan. Call inside save/restore. */
export function camera(c: CanvasRenderingContext2D, zoom: number, cx = W / 2, cy = H / 2, dx = 0, dy = 0) {
  c.translate(cx + dx, cy + dy); c.scale(zoom, zoom); c.translate(-cx, -cy);
}

/** Linear blend of two numbers by an eased 0..1, convenience for keyframed layouts. */
export const mix = (a: number, b: number, k: number) => lerp(a, b, clamp(k));

// ------------------------------------------------------------------ the repository

const hx = (seed: number) => hexStr(7, seed);

/** The shared history on `main`: 16 commits over three years, all by "me" (the ex never committed here). */
export const MAIN = [
  'initial commit', 'us: first date', 'us: move in', 'add: plants', 'us: anniversary', 'fix: the sink', 'us: holiday',
  'add: cat', 'us: we should talk', 'fix: again', 'us: next week, promise', 'add: therapy', 'us: one more try',
  'fix: everything', 'us: we\'ll get to it', 'docs: why',
].map((m, i) => ({ h: hx(101 + i), m, who: 'me' as const, date: 2023 + (i * 3) / 15 }));

/** The ex's hidden branch `other`: commits after all, just not to us. */
export const OTHER = ['wip', 'new phone who dis', 'drinks?', 'just a feature', 'tonight?'].map((m, i) => ({ h: hx(301 + i), m, who: 'you' as const }));

/** What the second push runs over: the ex's revert attempts. */
export const REVERTS = ['Revert "force push"', 'i changed', 'one more try', 'pls'].map((m, i) => ({ h: hx(401 + i), m, who: 'you' as const }));

/** The lies the chorus runs over. */
export const LIES = ['just a feature', 'nothing on the side', 'we\'ll get to it', 'next week, promise'];

/** `us:` → `me:` (the reword of "I rewrote the past"). */
export const reword = (m: string) => m.replace(/^us:/, 'me:').replace(/you & me/g, 'me');

/** The detached HEAD, the push target and the hash the reflog starts from. */
export const HASH = { detached: '3f9e2c1', rewritten: hx(901), rewritten2: hx(902), rewritten3: hx(903) };
