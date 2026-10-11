// The commit graph: the recurring motif. One geometry for every scene that shows it (graph, chorus,
// origin), so each chorus returns to the same composition with its state changed.
import { clamp, ease } from '../engine/util';
import { FONT, monoText, node, pill, type Theme } from './kit';

/** Main lane: commit i of MAIN at (GX(i), GY). */
export const GY = 640;
export const GX = (i: number) => 170 + i * 96;
export const R = 15; // commit radius
/** The side lane (the ex's `other`), and where it leaves main. */
export const SIDE_Y = 500;
export const SIDE_FROM = 6;
export const SX = (j: number) => GX(SIDE_FROM) + 150 + j * 120;
/** Ghost lanes (unreachable history) below main, newest nearest. */
export const GHOST_Y = (k: number) => GY + 150 + k * 92;

/** A straight edge, drawn to fraction p. */
export function edge(c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, col: string, w = 4, p = 1, dash?: number[]) {
  if (p <= 0) return;
  c.save();
  c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round';
  if (dash) c.setLineDash(dash);
  c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + (x1 - x0) * clamp(p), y0 + (y1 - y0) * clamp(p)); c.stroke();
  c.restore();
}

/** A branch-off curve from (x0, y0) to (x1, y1) (an S with horizontal ends), drawn to fraction p. */
export function branch(c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, col: string, w = 4, p = 1, dash?: number[]) {
  if (p <= 0) return;
  c.save();
  c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round';
  if (dash) c.setLineDash(dash);
  const n = 28, k = clamp(p);
  c.beginPath();
  for (let i = 0; i <= n * k; i++) {
    const u = i / n, e = ease.inOutCubic(u);
    const x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * e;
    if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  c.stroke();
  c.restore();
}

/** A pointer pill above a commit with a short stem. `solid`: filled (current), else outlined. */
export function pointer(c: CanvasRenderingContext2D, s: string, x: number, y: number, th: Theme, o: { col?: string; solid?: boolean; dy?: number; size?: number; glow?: boolean; a?: number } = {}) {
  const col = o.col ?? th.green, dy = o.dy ?? 70, size = o.size ?? 24;
  c.save();
  c.globalAlpha *= o.a ?? 1;
  c.strokeStyle = col; c.lineWidth = 2;
  c.beginPath(); c.moveTo(x, y - R - 6); c.lineTo(x, y - dy + size * 0.78); c.stroke();
  const w = o.solid !== false
    ? pill(c, s, x, y - dy, { size, fill: col, color: th.mode === 'dark' && col === th.green ? th.onGreen : th.bg, align: 'center', glow: o.glow ? col : undefined })
    : pill(c, s, x, y - dy, { size, stroke: col, color: col, fill: th.bg, align: 'center' });
  c.restore();
  return w;
}

/** A small mono label (hash or message) centred under/over a commit. */
export function label(c: CanvasRenderingContext2D, s: string, x: number, y: number, col: string, size = 20, align: CanvasTextAlign = 'center') {
  monoText(c, s, x, y, size, col, { fam: FONT.mono, align });
}

export { node };
