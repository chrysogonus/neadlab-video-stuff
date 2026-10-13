// The scene library's shared base and vocabulary (scenes/lib-*.ts). A library scene knows nothing about any one
// song: it reads its entry's resolved cues (the line, the anchor word, when the action lands), its parameters
// (checked against its schema when the sheet loads), the project's style (palette of the cue on screen, font
// roles) and the audio. Everything is a pure function of time.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides, type SceneCtx } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { rgba } from '../engine/palette';
import type { ResolvedCue } from '../engine/cues';
import type { Line, Word } from '../engine/lyrics';
import { Lyrics } from '../engine/lyrics';
import { withDefaults, type SceneSchema } from '../engine/schema';
import { fontFamily } from '../engine/style';
import { font, measure } from '../engine/type';
import { clamp, ease, lerp, prog } from '../engine/util';
import { layoutWords, type KLayout } from '../engine/karaoke';

export { W, H };
/** Title-safe margin (logical px). */
export const M = 96;

// ------------------------------------------------------------------ look

/**
 * The colour roles every library scene draws with, from the cue's palette: `bg`, `type` and `accent` should be
 * in every palette; the others are derived when missing (`panel`, `rule` and `dim` between bg and type,
 * `accent2` = accent, `onAccent` = bg). Hex strings; `a(role, alpha)` gives a CSS colour.
 */
export interface Look {
  bg: string; panel: string; rule: string; dim: string; type: string; accent: string; accent2: string; onAccent: string;
  a: (k: Role, alpha?: number) => string;
}
export type Role = Exclude<keyof Look, 'a'>;
const ROLES: Role[] = ['bg', 'panel', 'rule', 'dim', 'type', 'accent', 'accent2', 'onAccent'];

const rgb = (hex: string) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
/** Mix two hex colours (k = 0 → a). */
export function mixHex(a: string, b: string, k: number) {
  const x = rgb(a), y = rgb(b);
  return '#' + x.map((v, i) => Math.round(lerp(v, y[i]!, clamp(k))).toString(16).padStart(2, '0')).join('');
}
function makeLook(c: Record<Role, string>): Look {
  return { ...c, a: (k, alpha = 1) => rgba(c[k], alpha) };
}
const looks = new WeakMap<Record<string, string>, Look>();
export function look(pal: Record<string, string>): Look {
  let l = looks.get(pal);
  if (!l) {
    const bg = pal.bg ?? '#0B0B0E', type = pal.type ?? '#F2F0EA', accent = pal.accent ?? type;
    l = makeLook({
      bg, type, accent, panel: pal.panel ?? mixHex(bg, type, 0.06), rule: pal.rule ?? mixHex(bg, type, 0.18),
      dim: pal.dim ?? mixHex(bg, type, 0.45), accent2: pal.accent2 ?? accent, onAccent: pal.onAccent ?? bg,
    });
    looks.set(pal, l);
  }
  return l;
}
const blend = (a: Look, b: Look, k: number) => makeLook(Object.fromEntries(ROLES.map((r) => [r, mixHex(a[r], b[r], k)])) as Record<Role, string>);

// ------------------------------------------------------------------ base scene

/** Seconds a palette change between two cues takes (a crossfade of every colour). */
const RECOLOR = 0.35;

/**
 * A library scene: one Canvas2D layer over the look's ground, drawn in logical px and composited opaque into
 * `out`. `P` is the entry's parameters with the schema's defaults; `cues` the entry's resolved cues in order;
 * `cp(cue)` a cue's parameters with defaults. Subclasses set `static schema` and implement `draw`.
 */
export abstract class LibScene<P = Record<string, any>, C = Record<string, any>> extends Scene {
  L = new Layer2D();
  P!: P;
  cues: ResolvedCue[] = [];
  /** Lowest y (logical px) a scene should draw important content at when the karaoke layer is on. */
  bottom = H - M;

  constructor(ctx: SceneCtx) {
    super(ctx);
    this.ownsLyrics = this.schema.lyrics === 'own';
  }

  get schema() { return (this.constructor as unknown as { schema: SceneSchema }).schema; }

  override init(): void | Promise<void> {
    this.P = withDefaults<P>(this.schema.entry, this.ctx.params);
    this.cues = ((this.ctx.params.cues ?? []) as ResolvedCue[]).slice().sort((a, b) => a.start - b.start);
    const k = this.ctx.style.karaoke;
    if (k && !this.ownsLyrics) this.bottom = k.y * H - k.size * 1.9;
    return this.setup();
  }
  /** Per-scene setup (layouts, geometry): fonts, cues and parameters are available. */
  setup(): void | Promise<void> {}
  abstract draw(c: CanvasRenderingContext2D, f: Frame, k: Look): void;
  post(_f: Frame): PostOverrides { return {}; }

  /** A cue's parameters with the schema's defaults. */
  cp(c: ResolvedCue): C { return withDefaults<C>(this.schema.cue, c.def.params); }
  /** The cue on screen at t: the last one started at or before t (the first one before that). */
  cueAt(t: number): ResolvedCue | undefined { return this.cues.filter((c) => c.start <= t + 1e-6).at(-1) ?? this.cues[0]; }
  /** Index of cueAt(t). */
  cueIndex(t: number) { const c = this.cueAt(t); return c ? this.cues.indexOf(c) : -1; }
  /** Font family of a style role (display, body, mono, serif). */
  font(role: string) { const s = this.ctx.style.fonts[role] ?? this.ctx.style.fonts.body!; return fontFamily(s); }

  /** The look at t, crossfading over RECOLOR s when the cue on screen changes palette. */
  lookAt(t: number): Look {
    const pals = this.ctx.style.palettes, first = Object.values(pals)[0]!;
    const pal = (c: ResolvedCue | undefined) => (c && pals[c.def.palette]) || first;
    const i = this.cueIndex(t), cur = this.cues[i], prev = this.cues[i - 1];
    const a = look(pal(cur));
    if (!cur || !prev || pal(prev) === pal(cur) || t >= cur.start + RECOLOR) return a;
    return blend(look(pal(prev)), a, ease.inOutCubic(prog(t, cur.start, cur.start + RECOLOR)));
  }

  render(f: Frame, out: THREE.WebGLRenderTarget) {
    const k = this.lookAt(f.t);
    this.L.clear(k.bg);
    const c = this.L.ctx;
    c.save();
    try {
      this.draw(c, f, k);
    } catch (e) {
      // the context outlives the frame: reset its state stack before rethrowing
      c.reset();
      this.L.clear();
      throw e;
    }
    c.restore();
    this.ctx.comp.draw(this.ctx.renderer, this.L.upload(), out, { mode: 'replace' });
    return { bloom: 0.22, bloomThreshold: 0.92, halation: 0, ca: 0.35, grain: 0.032, vignette: 0.26, hud: 0, ...this.post(f) };
  }
}

// ------------------------------------------------------------------ timing

/** 0 → 1 over `d` s from t0 (ease-out): the house entrance. */
export const arrive = (t: number, t0: number, d = 0.28) => ease.outCubic(prog(t, t0, t0 + d));
/** Impact: 1 at t0, halving every `hl` s; 0 before. */
export const hit = (t: number, t0: number, hl = 0.09) => (t < t0 ? 0 : Math.pow(0.5, (t - t0) / hl));
/** The first characters of `s`, typed between t0 and t1. */
export const typed = (s: string, t: number, t0: number, t1: number) => s.slice(0, Math.round(s.length * prog(t, t0, t1)));
/** The first characters of `s`, typed with a sung line: each word types its share of s while it is sung. */
export function typedWith(s: string, words: Word[], t: number) {
  if (!words.length) return '';
  let n = 0;
  for (const w of words) n += (s.length / words.length) * Lyrics.wordProgress(w, t);
  return s.slice(0, Math.round(n));
}
/** Block cursor blink on the beat grid (on for the first 60 % of each beat). */
export const cursorOn = (beat: number) => beat < 0 || beat - Math.floor(beat) < 0.6;
/** The cue's moment: when its action lands (anchor), or its start. */
export const at = (c: ResolvedCue) => c.at;
/** Progress 0..1 of a line by its sung characters. */
export const lineProgress = (l: Line, t: number) => Lyrics.lineCharProgress(l, t) / Math.max(1, l.text.length);

// ------------------------------------------------------------------ type

/** Text at (x, y) in a family and size; returns its width. */
export function text(c: CanvasRenderingContext2D, s: string, x: number, y: number, fam: string, size: number, col: string,
  o: { align?: CanvasTextAlign; track?: number; baseline?: CanvasTextBaseline } = {}) {
  c.font = font(fam, size);
  c.letterSpacing = `${o.track ?? 0}px`;
  c.textAlign = o.align ?? 'left';
  c.textBaseline = o.baseline ?? 'alphabetic';
  c.fillStyle = col;
  c.fillText(s, x, y);
  c.letterSpacing = '0px';
  return measure(s, fam, size, o.track ?? 0);
}

/** The largest size from max down to min (step 2) at which `s` fits maxW on one line. */
export function fitSize(s: string, fam: string, maxW: number, max: number, min = 12, track = 0) {
  for (let z = max; z > min; z -= 2) if (measure(s, fam, z, (track * z) / 100) <= maxW) return z;
  return min;
}

/** A line's words laid out at the largest size (max..min) that fits maxW in maxRows rows. */
export function fitWords(words: Word[], fam: string, maxW: number, max: number, min = 40, maxRows = 2): KLayout {
  for (let s = max; s >= min; s -= 2) {
    const lay = layoutWords(words, fam, s, maxW, 0, maxRows);
    if (lay.width <= maxW && lay.rows.length <= maxRows) return lay;
  }
  return layoutWords(words, fam, min, maxW, 0, maxRows);
}

/** Wrap `s` into lines no wider than maxW. */
export function wrap(s: string, fam: string, size: number, maxW: number): string[] {
  const out: string[] = [];
  let cur = '';
  for (const w of s.split(/\s+/).filter(Boolean)) {
    const next = cur ? `${cur} ${w}` : w;
    if (cur && measure(next, fam, size) > maxW) { out.push(cur); cur = w; } else cur = next;
  }
  if (cur) out.push(cur);
  return out;
}

/** `s` wrapped to maxW, then narrowed to the least width that keeps the row count (no widows). */
export function balanced(s: string, fam: string, size: number, maxW: number) {
  const n = wrap(s, fam, size, maxW).length;
  let lo = maxW * 0.4, hi = maxW;
  if (n > 1) for (let j = 0; j < 10; j++) { const mid = (lo + hi) / 2; if (wrap(s, fam, size, mid).length <= n) hi = mid; else lo = mid; }
  return wrap(s, fam, size, hi);
}

// ------------------------------------------------------------------ marks

/** A rule drawn left to right (p 0..1), e.g. a strike-through. */
export function strike(c: CanvasRenderingContext2D, x0: number, y: number, x1: number, p: number, col: string, w = 6) {
  if (p <= 0) return;
  c.fillStyle = col;
  c.fillRect(x0, y - w / 2, (x1 - x0) * clamp(p), w);
}

/** A rounded panel (fill + 1.5 px rule). */
export function panel(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, stroke?: string, r = 14) {
  c.beginPath(); c.roundRect(x, y, w, h, r);
  c.fillStyle = fill; c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1.5; c.stroke(); }
}

/** A pill label centred vertically on y; returns its width. */
export function pill(c: CanvasRenderingContext2D, s: string, x: number, y: number, fam: string, size: number, fill: string, color: string, align: 'left' | 'center' | 'right' = 'left') {
  const tw = measure(s, fam, size, 0.5), pw = tw + size * 1.1, ph = size * 1.6;
  const x0 = align === 'center' ? x - pw / 2 : align === 'right' ? x - pw : x;
  c.beginPath(); c.roundRect(x0, y - ph / 2, pw, ph, ph / 2);
  c.fillStyle = fill; c.fill();
  text(c, s, x0 + pw / 2, y + size * 0.36, fam, size, color, { align: 'center', track: 0.5 });
  return pw;
}

/** A small mono caption in caps with tracking (labels, kickers). */
export function label(c: CanvasRenderingContext2D, s: string, x: number, y: number, fam: string, col: string, size = 18, align: CanvasTextAlign = 'left') {
  return text(c, s.toUpperCase(), x, y, fam, size, col, { align, track: size * 0.16 });
}
