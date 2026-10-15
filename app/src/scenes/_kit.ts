// Shared kit for the Harvest plates: the two running values (year, bytes kept), per-word karaoke
// text, engraving primitives drawn with Canvas2D, the paper/ink ground, and a Plate base class.
// Everything is a pure function of song time (see docs/ENGINE.md).
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D, W, H, SCALE } from '../engine/gl';
import { rgba } from '../engine/palette';
import { Lyrics, type Line, type Word } from '../engine/lyrics';
import { F, font, glyphX, measure } from '../engine/type';
import { drawStrokeText } from '../engine/stroke';
import { clamp, ease, hash, lerp, mulberry32 } from '../engine/util';

export { W, H };
export const MONO = F.mono(400);
export const MONO_M = F.mono(500);
export const MONO_B = F.mono(600);

// ------------------------------------------------------------------ running values

/** Bytes kept, reached by the end of each lyric line (L0..L30). The size is the joke. (L22 ends just under
 * 1 PB so the count crosses into petabytes on the word "Petabytes".) */
const KEPT = [4.2e3, 4.2e3, 4.2e3, 8.4e3, 1.1e6, 1.1e6, 4.0e7, 3.1e8, 1.4e9, 6.0e9, 2.2e10, 6.0e10, 1.4e11, 3.0e11, 4.8e11, 6.0e11,
  1.1e12, 4.0e12, 1.2e13, 3.8e13, 9.5e13, 2.1e14, 9.95e14, 1.4e15, 2.6e15, 4.1e15, 6.2e15, 7.8e15, 8.8e15, 9.4e15, 9.4e15];

/** The year and how much has been kept: anchored to lyric lines, pure functions of t. */
export class Counters {
  private kept: [number, number][] = [];
  /** [time, year] steps; the year is the plot. */
  steps: [number, number][] = [];
  constructor(ly: Lyrics) {
    const L = ly.lines;
    // kept: zero until the copy of the first message exists, then log-linear between line ends
    this.kept.push([L[0]!.start, 0]);
    L.forEach((l, i) => this.kept.push([l.end, KEPT[i] ?? KEPT[KEPT.length - 1]!]));
    const at = (q: string, wi = 0, nth = 0) => ly.get(q, nth).words[wi]!.start;
    this.steps = [
      [-1, 2021],
      [at('Every byte', 0, 0), 2022],
      [at('Harvest now', 0, 0), 2023],
      [at('stacking up the qubits'), 2024],
      [at('The experts said', 8), 2031], // "nearly here"
      [at('Every byte', 0, 1), 2032],
      ...[0, 1, 2, 3].map((k) => [ly.get('Pushed to next quarter').words[k * 2]!.start, 2033 + k] as [number, number]),
    ];
  }
  /** Bytes kept at t (monotone). */
  bytes(t: number): number {
    const k = this.kept;
    if (t <= k[0]![0]) return 0;
    for (let i = 1; i < k.length; i++) {
      const [t1, v1] = k[i]!;
      if (t <= t1) {
        const [t0, v0] = k[i - 1]!;
        if (v0 <= 0) return t >= t1 - 0.05 ? v1 : 0;
        const u = (t - t0) / Math.max(1e-3, t1 - t0);
        return Math.pow(10, lerp(Math.log10(v0), Math.log10(v1), u));
      }
    }
    return k[k.length - 1]![1];
  }
  /** The year at t (integer). */
  year(t: number): number {
    let y = this.steps[0]![1];
    for (const [ts, v] of this.steps) if (t >= ts) y = v;
    return y;
  }
  /** Time of the last year step at or before t, and 0..1 pulse after it (for a flick on the readout). */
  yearFlick(t: number): number {
    let last = -99;
    for (const [ts] of this.steps) if (ts > 0 && t >= ts) last = ts;
    return Math.pow(0.5, (t - last) / 0.12);
  }
}

const UNITS = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB'];
/** "4.20 kB", "310 GB", "9.40 PB": three significant figures. */
export function fmtBytes(b: number): string {
  if (b < 1) return '0 B';
  let u = 0;
  while (b >= 1000 && u < UNITS.length - 1) { b /= 1000; u++; }
  const s = b >= 100 ? b.toFixed(0) : b >= 10 ? b.toFixed(1) : b.toFixed(2);
  return `${s} ${UNITS[u]}`;
}
/** The unit index (0 = B … 5 = PB) of a byte count. */
export const unitOf = (b: number) => (b < 1 ? 0 : Math.min(UNITS.length - 1, Math.floor(Math.log10(b) / 3)));

// ------------------------------------------------------------------ karaoke

// (the primitives live in the engine, which draws the project-wide karaoke layer with them)
import { drawKaraoke, layoutWords, mixC, type KItem, type KLayout, type KRow, type KStyle } from '../engine/karaoke';
export { drawKaraoke, layoutWords, mixC, type KItem, type KLayout, type KRow, type KStyle };

/** First-row baseline for a laid-out line whose LAST row should sit on `yLast` (wrapped lines grow upward). */
export const bottomUp = (lay: KLayout, yLast: number, lineH = 1.02) => yLast - (lay.rows.length - 1) * lay.size * lineH;

/** The x of word `w` inside a laid-out line (row-aligned like drawKaraoke), and its row index. */
export function wordPos(lay: KLayout, w: Word, x: number, align: KStyle['align'] = 'left') {
  for (let ri = 0; ri < lay.rows.length; ri++) {
    const row = lay.rows[ri]!;
    const ox = align === 'center' ? x - row.width / 2 : align === 'right' ? x - row.width : x;
    for (const it of row.items) if (it.w === w) return { x: ox + it.x, w: it.width, row: ri };
  }
  return null;
}

/** Opacity of a line's text: in `fade` s before it starts (anticipation ≤ 0.4 s), out over `out` s at `until`. */
export function lineAlpha(l: Line, t: number, until: number, fade = 0.35, out = 0.25) {
  return clamp(Math.min((t - (l.start - fade)) / fade, (until - t) / out), 0, 1);
}

/** Sung progress through a line by character count (0..1). */
export const lineProgress = (l: Line, t: number) => Lyrics.lineCharProgress(l, t) / Math.max(1, l.text.length);

/** Draw a string in pieces with kerning: the first `n` chars in colour a, the rest in b. */
export function drawSplit(c: CanvasRenderingContext2D, s: string, n: number, x: number, y: number, fam: string, size: number, a: string, b: string, tracking = 0) {
  c.font = font(fam, size);
  c.letterSpacing = `${tracking}px`;
  const k = Math.floor(clamp(n, 0, s.length));
  if (k > 0) { c.fillStyle = a; c.fillText(s.slice(0, k), x, y); }
  if (k < s.length) { c.fillStyle = b; c.fillText(s.slice(k), x + glyphX(s, k, fam, size, tracking), y); }
}

// ------------------------------------------------------------------ drawing primitives

/** Mono label: tracked caps in IBM Plex Mono. */
export function mono(c: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, col: string, o: { align?: CanvasTextAlign; track?: number; fam?: string } = {}) {
  c.save();
  c.font = font(o.fam ?? MONO_M, size);
  c.letterSpacing = `${o.track ?? size * 0.16}px`;
  c.textAlign = o.align ?? 'left';
  c.textBaseline = 'alphabetic';
  c.fillStyle = col;
  c.fillText(s, x, y);
  c.restore();
}

export function line(c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, col: string, w = 1) {
  c.strokeStyle = col; c.lineWidth = w;
  c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
}

/** A partially drawn segment (0..1 of its length). */
export function lineP(c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, p: number, col: string, w = 1) {
  if (p <= 0) return;
  line(c, x0, y0, lerp(x0, x1, clamp(p)), lerp(y0, y1, clamp(p)), col, w);
}

/** Rectangle outline, drawn progressively around its perimeter (p = 0..1). */
export function rectP(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, p: number, col: string, lw = 1) {
  if (p <= 0) return;
  const per = 2 * (w + h);
  let L = per * clamp(p);
  const pts: [number, number][] = [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];
  c.strokeStyle = col; c.lineWidth = lw;
  c.beginPath(); c.moveTo(x, y);
  for (let i = 1; i < pts.length && L > 0; i++) {
    const [ax, ay] = pts[i - 1]!, [bx, by] = pts[i]!;
    const d = Math.hypot(bx - ax, by - ay), u = Math.min(1, L / d);
    c.lineTo(ax + (bx - ax) * u, ay + (by - ay) * u);
    L -= d;
  }
  c.stroke();
}

/** Parallel hatching clipped to a path (call with the path already built via `shape`). */
export function hatch(c: CanvasRenderingContext2D, shape: (c: CanvasRenderingContext2D) => void, box: [number, number, number, number], gap: number, angle: number, col: string, lw = 1) {
  c.save();
  c.beginPath(); shape(c); c.clip();
  const [x, y, w, h] = box;
  const cx = x + w / 2, cy = y + h / 2, R = Math.hypot(w, h) / 2 + gap;
  const ca = Math.cos(angle), sa = Math.sin(angle);
  c.strokeStyle = col; c.lineWidth = lw;
  c.beginPath();
  for (let d = -R; d <= R; d += gap) {
    const px = cx - sa * d, py = cy + ca * d;
    c.moveTo(px - ca * R, py - sa * R); c.lineTo(px + ca * R, py + sa * R);
  }
  c.stroke();
  c.restore();
}

/** Engineering dimension line between (x0,y) and (x1,y) with end ticks and a centred mono label. */
export function dimension(c: CanvasRenderingContext2D, x0: number, y: number, x1: number, label: string, col: string, size = 12) {
  c.save();
  c.strokeStyle = col; c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x0, y); c.lineTo(x1, y);
  for (const x of [x0, x1]) { c.moveTo(x - 5, y + 5); c.lineTo(x + 5, y - 5); c.moveTo(x, y - 9); c.lineTo(x, y + 9); }
  c.stroke();
  const tw = measure(label, MONO_M, size, size * 0.12) + 14;
  c.clearRect((x0 + x1) / 2 - tw / 2, y - size, tw, size * 2);
  c.restore();
  mono(c, label, (x0 + x1) / 2, y + size * 0.36, size, col, { align: 'center', track: size * 0.12 });
}

/** Leader line from a point to a label, with a dot at the point. */
export function leader(c: CanvasRenderingContext2D, px: number, py: number, kx: number, ky: number, lx: number, col: string, p = 1) {
  c.save();
  c.fillStyle = col;
  c.beginPath(); c.arc(px, py, 2.5, 0, Math.PI * 2); c.fill();
  const d1 = Math.hypot(kx - px, ky - py), d2 = Math.abs(lx - kx), L = (d1 + d2) * clamp(p);
  c.strokeStyle = col; c.lineWidth = 1;
  c.beginPath(); c.moveTo(px, py);
  if (L <= d1) c.lineTo(lerp(px, kx, L / d1), lerp(py, ky, L / d1));
  else { c.lineTo(kx, ky); c.lineTo(kx + Math.sign(lx - kx) * (L - d1), ky); }
  c.stroke();
  c.restore();
}

/** Corner registration ticks of a box (engineering-drawing crop marks). */
export function corners(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, l: number, col: string, lw = 1) {
  c.strokeStyle = col; c.lineWidth = lw;
  c.beginPath();
  for (const [px, py, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]] as const) {
    c.moveTo(px + sx * l, py); c.lineTo(px, py); c.lineTo(px, py + sy * l);
  }
  c.stroke();
}

/** Registration target (circle + cross). */
export function target(c: CanvasRenderingContext2D, x: number, y: number, r: number, col: string) {
  c.strokeStyle = col; c.lineWidth = 1;
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
  c.moveTo(x - r * 1.6, y); c.lineTo(x + r * 1.6, y); c.moveTo(x, y - r * 1.6); c.lineTo(x, y + r * 1.6);
  c.stroke();
}

/**
 * The padlock glyph, engraved: hatched body, keyhole, shackle. `open` 0..1 lifts and swings the
 * shackle's free leg out. (cx, cy) = centre of the body; s = body width.
 */
export function padlock(c: CanvasRenderingContext2D, cx: number, cy: number, s: number, open: number, ink: string, o: { hatch?: string; fill?: string; lw?: number; keyhole?: string } = {}) {
  const bw = s, bh = s * 0.78, r = s * 0.1;
  const x = cx - bw / 2, y = cy - bh / 2;
  const lw = o.lw ?? Math.max(1, s / 60);
  const sw = s * 0.3; // shackle half-width (centre line)
  const lift = s * 0.28 * ease.outCubic(clamp(open));
  const swing = 0.55 * ease.inOutCubic(clamp((open - 0.35) / 0.65));
  c.save();
  // shackle: U from the left leg (fixed in the body) over to the right leg; lifts and swings about the left leg
  c.strokeStyle = ink; c.lineWidth = s * 0.075; c.lineCap = 'butt';
  c.save();
  c.translate(cx - sw, y - lift);
  c.rotate(-swing);
  c.beginPath();
  c.moveTo(0, s * 0.12 + lift);
  c.lineTo(0, -s * 0.18);
  c.arc(sw, -s * 0.18, sw, Math.PI, 0);
  c.lineTo(2 * sw, s * 0.12);
  c.stroke();
  c.restore();
  // body
  const body = (k: CanvasRenderingContext2D) => k.roundRect(x, y, bw, bh, r);
  if (o.fill) { c.fillStyle = o.fill; c.beginPath(); body(c); c.fill(); }
  if (o.hatch) hatch(c, body, [x, y, bw, bh], Math.max(3, s / 26), -Math.PI / 4, o.hatch, Math.max(0.8, lw * 0.7));
  c.strokeStyle = ink; c.lineWidth = lw * 1.4;
  c.beginPath(); body(c); c.stroke();
  // keyhole
  c.fillStyle = o.keyhole ?? ink;
  c.beginPath();
  c.arc(cx, cy - bh * 0.06, s * 0.075, 0, Math.PI * 2);
  c.moveTo(cx - s * 0.035, cy - bh * 0.02); c.lineTo(cx + s * 0.035, cy - bh * 0.02); c.lineTo(cx + s * 0.05, cy + bh * 0.22); c.lineTo(cx - s * 0.05, cy + bh * 0.22);
  c.fill();
  c.restore();
}

/**
 * A rubber stamp: framed mono caps, rotated, inked unevenly (deterministic speckle knocked out).
 * `k` 0..1 = the strike: overshoot scale then settle; ink coverage `ink` 0..1.
 */
export function stamp(c: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, rot: number, col: string, k: number, seed: number, o: { ink?: number; frame?: boolean; fam?: string } = {}) {
  if (k <= 0) return;
  const sc = 1 + 0.35 * (1 - ease.outCubic(clamp(k * 3)));
  const a = clamp(k * 6);
  c.save();
  c.translate(x, y); c.rotate(rot); c.scale(sc, sc);
  c.globalAlpha *= a;
  const fam = o.fam ?? F.mono(700);
  c.font = font(fam, size);
  c.letterSpacing = `${size * 0.08}px`;
  const tw = measure(s, fam, size, size * 0.08);
  const pad = size * 0.38;
  // draw onto a scratch canvas so the speckle only eats the stamp
  const sw = Math.ceil(tw + pad * 2 + 8), sh = Math.ceil(size * 1.0 + pad * 2 + 8);
  const sc2 = scratch(sw, sh);
  const g = sc2.ctx;
  g.clearRect(0, 0, sw, sh);
  g.font = font(fam, size);
  g.letterSpacing = `${size * 0.08}px`;
  g.fillStyle = col; g.strokeStyle = col;
  g.textBaseline = 'middle'; g.textAlign = 'center';
  g.fillText(s, sw / 2, sh / 2 + size * 0.05);
  if (o.frame !== false) { g.lineWidth = Math.max(2, size * 0.08); g.strokeRect(4 + size * 0.04, 4 + size * 0.04, sw - 8 - size * 0.08, sh - 8 - size * 0.08); }
  g.globalCompositeOperation = 'destination-out';
  const rnd = mulberry32(seed);
  const ink = o.ink ?? 0.85;
  // fine speckle whatever the size (ink texture is a property of the rubber, not of the type size)
  const rMax = Math.min(size * 0.06, 3.2);
  const n = Math.floor(((sw * sh) / 26) * (1 - ink) + 40);
  for (let i = 0; i < n; i++) {
    const px = rnd() * sw, py = rnd() * sh, r = 0.5 + rnd() * rnd() * rMax;
    g.globalAlpha = 0.5 + rnd() * 0.5;
    g.beginPath(); g.arc(px, py, r, 0, Math.PI * 2); g.fill();
  }
  // one dry streak
  g.globalAlpha = 0.55;
  g.fillRect(0, sh * (0.2 + rnd() * 0.6), sw, Math.min(size * 0.05, 4));
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  c.drawImage(sc2.canvas, -sw / 2, -sh / 2, sw, sh);
  c.restore();
}

const scratches = new Map<string, { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }>();
/** A reusable offscreen canvas in logical px (backing store SCALE× larger). */
function scratch(w: number, h: number) {
  const key = `${w}x${h}`;
  let s = scratches.get(key);
  if (!s) {
    const canvas = document.createElement('canvas');
    canvas.width = w * SCALE; canvas.height = h * SCALE;
    // Stamps are redrawn into this shared canvas, so use the same stable rasterisation as Layer2D.
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.scale(SCALE, SCALE);
    s = { canvas, ctx };
    scratches.set(key, s);
  }
  return s;
}

/** A static offscreen layer drawn once (in logical px) and blitted each frame. */
export function bake(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(w * SCALE); canvas.height = Math.ceil(h * SCALE);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);
  draw(ctx);
  return { canvas, w, h, draw: (c: CanvasRenderingContext2D, x: number, y: number, s = 1) => c.drawImage(canvas, x, y, w * s, h * s) };
}

/** Deterministic pseudo-text glyph run for ciphertext: base64-ish characters from a seed. */
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
export function cipher(n: number, seed: number) {
  let s = '';
  for (let i = 0; i < n; i++) s += B64[Math.floor(hash(i, seed) * 64)]!;
  return s;
}
export const HEXCH = '0123456789abcdef';
export function hexStr(n: number, seed: number) {
  let s = '';
  for (let i = 0; i < n; i++) s += HEXCH[Math.floor(hash(i, seed, 7) * 16)]!;
  return s;
}

// ------------------------------------------------------------------ ground

/**
 * The plate's ground: ink (paper = 0) or bone paper (paper = 1), with a faint fibre texture, a soft
 * light falloff and an optional engraving grid. Pure function of its uniforms.
 */
export class Ground {
  pass = new FSPass(/* glsl */ `
    uniform float paper, grid, gridStep, seed, light;
    uniform vec2 gridOff;
    void main() {
      vec2 px = FRAG_PX;
      vec2 uv = px / vec2(${W}.0, ${H}.0);
      float fib = fbm(vec2(px.x * 0.004, px.y * 0.05) + seed, 4) * 0.5 + fbm(px * 0.02 + seed * 3.1, 3) * 0.5;
      vec3 inkC = C_INK * (0.92 + 0.12 * fib) + C_INK2 * 0.35 * smoothstep(0.9, 0.1, length((uv - vec2(0.5, 0.42)) * vec2(1.3, 1.0))) * light;
      vec3 boneC = C_BONE * (0.94 + 0.05 * fib - 0.06 * smoothstep(0.35, 1.0, length((uv - 0.5) * vec2(1.1, 1.0))));
      vec3 col = mix(inkC, boneC, paper);
      // engraving grid: hairlines every gridStep logical px
      vec2 g = (px - gridOff) / gridStep;
      vec2 fw = fwidth(g);
      vec2 d = abs(fract(g + 0.5) - 0.5) / max(fw, 1e-4);
      float gl = max(pxLine(d.x, 0.0, 1.2), pxLine(d.y, 0.0, 1.2));
      vec3 lineC = mix(C_BONE * 0.06, C_INK * 0.5 + C_GRAPHITE * 0.12, paper);
      col = mix(col, lineC, gl * grid);
      fragColor = vec4(col, 1.0);
    }`, {
    paper: { value: 0 }, grid: { value: 0 }, gridStep: { value: 48 }, seed: { value: 0 }, light: { value: 1 }, gridOff: { value: { x: 0, y: 0 } },
  });
  render(renderer: THREE.WebGLRenderer, out: THREE.WebGLRenderTarget, o: { paper?: number; grid?: number; gridStep?: number; seed?: number; light?: number; gridOff?: [number, number] } = {}) {
    const u = this.pass.u;
    u.paper!.value = o.paper ?? 0;
    u.grid!.value = o.grid ?? 0;
    u.gridStep!.value = o.gridStep ?? 48;
    u.seed!.value = o.seed ?? 0;
    u.light!.value = o.light ?? 1;
    u.gridOff!.value = { x: o.gridOff?.[0] ?? 0, y: o.gridOff?.[1] ?? 0 };
    this.pass.render(renderer, out);
  }
}

// ------------------------------------------------------------------ plate base


/** Colours as CSS strings for Canvas2D. */
export const C = {
  ink: rgba('ink'), ink2: rgba('ink2'), bone: rgba('bone'), ash: rgba('ash'), graphite: rgba('graphite'), glacier: rgba('glacier'), glacierInk: rgba('glacierInk'), signal: rgba('signal'), ember: rgba('ember'),
  bone_: (a: number) => rgba('bone', a), ink_: (a: number) => rgba('ink', a), glacier_: (a: number) => rgba('glacier', a), glacierInk_: (a: number) => rgba('glacierInk', a), signal_: (a: number) => rgba('signal', a), ash_: (a: number) => rgba('ash', a), ember_: (a: number) => rgba('ember', a),
};

/**
 * A plate: a Ground, one Canvas2D layer and the counters. Subclasses implement `draw` (Canvas2D in
 * logical px) and optionally `ground` (GL into `out` before the layer goes on top) and `post`.
 */
export abstract class Plate extends Scene {
  L = new Layer2D();
  bg = new Ground();
  ctr!: Counters;
  override init(): void | Promise<void> { this.ctr = new Counters(this.ctx.lyrics); this.setup(); }
  /** Per-plate setup (fonts are loaded; lyrics and audio are available). */
  setup(): void {}
  ground(_f: Frame, out: THREE.WebGLRenderTarget) { this.bg.render(this.ctx.renderer, out); }
  abstract draw(c: CanvasRenderingContext2D, f: Frame): void;
  post(_f: Frame): PostOverrides { return {}; }
  /** Layers drawn after the Canvas2D layer (GL overlays). */
  over(_f: Frame, _out: THREE.WebGLRenderTarget) {}
  render(f: Frame, out: THREE.WebGLRenderTarget) {
    this.ground(f, out);
    this.L.clear();
    const c = this.L.ctx;
    c.save();
    try {
      this.draw(c, f);
    } catch (e) {
      // the context outlives the frame: an exception mid-draw would leave its clips and transforms
      // stacked for every later frame. Reset it (clear() re-applies the output scale) and rethrow.
      c.reset();
      this.L.clear();
      throw e;
    }
    c.restore();
    this.ctx.comp.draw(this.ctx.renderer, this.L.upload(), out);
    this.over(f, out);
    // cold by default: no red-orange halation, and only real highlights bloom (thaw overrides)
    return { halation: 0, bloomThreshold: 1.0, ...this.post(f) };
  }
  /** Line by content (fails loudly while authoring). */
  line(q: string, nth = 0) { return this.ctx.lyrics.get(q, nth); }
  /** Song time of beat index nearest t (snap helper). */
  snap(t: number) { const au = this.ctx.audio; return au.timeOfBeat(Math.round(au.beatAt(t))); }
  /** Last downbeat at or before t. */
  downAt(t: number) { const d = this.ctx.audio.downbeats; let b = d[0] ?? 0; for (const x of d) if (x <= t + 1e-3) b = x; return b; }
}

// ------------------------------------------------------------------ plotter pen

/**
 * [start, end] song time for each char of a line's text: a word's chars are written evenly across
 * the word; a space takes the next word's start (so the pen waits there, not mid-air).
 */
export function charTimes(l: Line): [number, number][] {
  const out: [number, number][] = [];
  l.words.forEach((w, wi) => {
    const n = Array.from(w.w).length;
    const d = Math.max(0.05, Math.min(w.end - w.start, 0.9));
    for (let i = 0; i < n; i++) out.push([w.start + (d * i) / n, w.start + (d * (i + 1)) / n]);
    const nx = l.words[wi + 1];
    if (nx) out.push([nx.start, nx.start]);
  });
  return out;
}

/**
 * A lyric written by a plotter pen: the whole line as a faint ghost, the written part in `ink`, and
 * the pen head. Returns the head position (or null when nothing is written yet).
 */
export function penWrite(c: CanvasRenderingContext2D, st: import('../engine/stroke').StrokeText, len: number, x: number, y: number, o: { ink: string; ghost?: string; lw?: number; head?: string; headR?: number }) {
  c.save();
  c.translate(x, y);
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.lineWidth = o.lw ?? 2;
  if (o.ghost) { c.strokeStyle = o.ghost; drawStrokeText(c, st, st.total); }
  c.strokeStyle = o.ink;
  const head = len > 0 ? drawStrokeText(c, st, len) : null;
  if (head && len < st.total - 0.5 && o.head) {
    const r = o.headR ?? 5;
    const g = c.createRadialGradient(head.x, head.y, 0, head.x, head.y, r * 4);
    g.addColorStop(0, o.head); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.beginPath(); c.arc(head.x, head.y, r * 4, 0, Math.PI * 2); c.fill();
    c.fillStyle = o.head; c.beginPath(); c.arc(head.x, head.y, r * 0.6, 0, Math.PI * 2); c.fill();
  }
  c.restore();
  return head ? { x: head.x + x, y: head.y + y } : null;
}

// ------------------------------------------------------------------ the bookend

/** Centre and size of the bookend padlock (first frame of `send`, last frame of `secure`: they match). */
export const BOOKEND = { x: 960, y: 500, s: 250, R: 300 };

/**
 * The bookend's index ring around the padlock, its registration target and its labels. `lit` ticks
 * (of 64) are glacier; `rot` turns the ring. At lit = 0, rot = 0 this is the video's first frame.
 */
export function bookendRing(c: CanvasRenderingContext2D, lit: number, rot: number) {
  const { x, y, R } = BOOKEND;
  c.strokeStyle = C.bone_(0.16); c.lineWidth = 1;
  c.beginPath(); c.arc(x, y, R, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.arc(x, y, R + 18, 0, Math.PI * 2); c.stroke();
  const nB = 64;
  for (let i = 0; i < nB; i++) {
    const a = (i / nB) * Math.PI * 2 - Math.PI / 2 + rot;
    const big = i % 8 === 0;
    c.strokeStyle = i < lit ? C.glacier_(0.85) : C.bone_(big ? 0.4 : 0.2);
    c.lineWidth = big ? 1.5 : 1;
    const r1 = R + (big ? 18 : 9);
    c.beginPath(); c.moveTo(x + Math.cos(a) * R, y + Math.sin(a) * R); c.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); c.stroke();
  }
  target(c, x, y - R - 52, 7, C.bone_(0.3));
  mono(c, 'CONNECTION SECURE', x, 860, 15, C.bone_(0.8), { align: 'center', track: 5 });
  mono(c, `SESSION ${hexStr(16, 3)}`, x, 888, 11, C.bone_(0.35), { align: 'center', track: 2.5 });
}

/** The bookend padlock, closed, in bone (as at the very start). */
export function bookendLock(c: CanvasRenderingContext2D, x = BOOKEND.x, y = BOOKEND.y, s = BOOKEND.s, open = 0) {
  padlock(c, x, y, s, open, C.bone, { hatch: C.bone_(0.4), fill: C.ink, keyhole: C.bone });
}
