// Library: the chart. A bar or line chart built one data point per cue: on each anchor a bar rises (or the line
// extends) to the cue's value, its figure counting up over it; the newest point in the accent, the earlier ones
// settling to dim; hairline gridlines whose scale re-fits smoothly when a value outgrows it. Editorial (FT,
// Bloomberg), not a spreadsheet. For any series a line walks through: growth over the years, costs side by side.
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import { measure } from '../engine/type';
import { clamp, ease, lerp, prog } from '../engine/util';
import { LibScene, M, W, arrive, fitSize, mixHex, text, wrap, type Look } from './_lib';

export const schema: SceneSchema = {
  description: 'A bar or line chart built one data point per cue: each anchor adds a labelled value (a bar rising, or the line extending to it), the newest in the accent, with gridlines that re-fit as the values grow. For a series of figures: growth over time, quantities side by side, a ranking.',
  kinds: ['explainer', 'song'],
  lyrics: 'layer',
  entry: {
    title: { type: 'string', default: '', description: 'the chart\'s headline, top left (what is measured)' },
    kind: { type: 'string', enum: ['bar', 'line'], default: 'bar', description: 'bars (categories) or a line (a series over time)' },
    unit: { type: 'string', default: '', description: 'after each value, e.g. "%", " ms", "M"' },
    max: { type: 'number', default: 0, min: 0, description: 'a fixed axis maximum (at least the largest value); 0 = fit to the values so far, re-fitting as they grow' },
  },
  cue: {
    label: { type: 'string', description: 'the point\'s category or x label, under the axis (short: a year, a name)' },
    value: { type: 'number', description: 'the value this cue adds' },
  },
  example: {
    entry: { title: 'Repositories on GitHub', kind: 'bar', unit: 'M' },
    cues: [{ label: '2010', value: 1 }, { label: '2013', value: 10 }, { label: '2018', value: 100 }, { label: '2023', value: 420 }],
  },
};

interface P { title: string; kind: 'bar' | 'line'; unit: string; max: number }
interface C { label: string; value: number }
interface Scale { lo: number; hi: number; step: number }

const GROW = 0.6; // s a point takes to land (and the scale to re-fit)

/** A round tick step giving about `n` intervals over `range`. */
function niceStep(range: number, n = 4) {
  const raw = range / n, mag = Math.pow(10, Math.floor(Math.log10(raw)));
  return mag * ([1, 2, 2.5, 5, 10].find((m) => m * mag >= raw) ?? 10);
}
/** `v` with thousands separators and `d` decimals. */
function fmt(v: number, d: number) {
  const [i, f] = Math.abs(v).toFixed(d).split('.');
  return `${v < 0 ? '−' : ''}${i!.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${f ? `.${f}` : ''}`;
}
const decimals = (v: number) => Math.min(2, (String(v).split('.')[1] ?? '').length);

export default class LibChart extends LibScene<P, C> {
  static schema = schema;
  private vals: number[] = [];
  private labels: string[] = [];
  /** The axis after j + 1 points have landed. */
  private scales: Scale[] = [];
  private dec = 0;

  override setup() {
    for (const c of this.cues) { const p = this.cp(c); this.vals.push(p.value); this.labels.push(p.label); }
    this.dec = Math.max(0, ...this.vals.map(decimals));
    this.scales = this.vals.map((_, j) => {
      const seen = this.vals.slice(0, j + 1);
      const lo0 = Math.min(0, ...seen), hi0 = this.P.max > 0 ? this.P.max : Math.max(0, ...seen);
      const step = niceStep(Math.max(1e-9, hi0 - lo0) || 1);
      return { lo: Math.floor(lo0 / step + 1e-9) * step, hi: Math.max(step, Math.ceil(hi0 / step - 1e-9) * step), step };
    });
  }

  /** The axis at t: easing from the previous scale to the newest point's over GROW s from its anchor. */
  private scale(t: number, j: number): Scale & { e: number; prev: Scale } {
    const cur = this.scales[Math.max(0, j)]!, prev = this.scales[Math.max(0, j - 1)]!;
    const e = j > 0 ? prog(t, this.cues[j]!.at, this.cues[j]!.at + GROW, ease.outCubic) : 1;
    return { lo: lerp(prev.lo, cur.lo, e), hi: lerp(prev.hi, cur.hi, e), step: cur.step, e, prev };
  }

  draw(c: CanvasRenderingContext2D, f: Frame, k: Look) {
    const t = f.t, disp = this.font('display'), body = this.font('body'), mono = this.font('mono');
    const n = this.vals.length, j = this.cues.findLastIndex((x) => x.at <= t);
    const intro = arrive(t, this.ctx.start, 0.5);

    // headline: an accent tab over the title
    let top = M + 40;
    if (this.P.title) {
      c.globalAlpha = intro;
      c.fillStyle = k.accent; c.fillRect(M, M - 8, 64 * intro, 8);
      const z = fitSize(this.P.title, disp, W - 2 * M, 64, 32);
      text(c, this.P.title, M, M + 28 + z * 0.75, disp, z, k.type);
      top = M + 28 + z * 0.75 + 70;
      c.globalAlpha = 1;
    }

    // plot area: tick labels in a gutter on the left, category labels under the axis
    const gut = 120, px0 = M + gut, px1 = W - M, y0 = top + 34, y1 = this.bottom - 84;
    const s = this.scale(t, j);
    const yOf = (v: number, sc: { lo: number; hi: number } = s) => lerp(y1, y0, (v - sc.lo) / Math.max(1e-9, sc.hi - sc.lo));
    const slot = (px1 - px0) / Math.max(1, n), xOf = (i: number) => px0 + slot * (i + 0.5);

    // gridlines, cross-fading between the old and new step while the scale re-fits
    const grid = (sc: Scale, alpha: number) => {
      if (alpha <= 0.01) return;
      const d = Math.max(0, -Math.floor(Math.log10(sc.step) + 1e-9));
      const vTop = Math.floor((s.hi + 1e-9) / sc.step) * sc.step;
      for (let v = Math.ceil(sc.lo / sc.step - 1e-9) * sc.step; v <= s.hi + 1e-9; v += sc.step) {
        const y = yOf(v);
        if (y < y0 - 1 || y > y1 + 1) continue;
        const zero = Math.abs(v) < sc.step * 1e-6;
        c.globalAlpha = alpha * intro;
        c.fillStyle = zero ? mixHex(k.rule, k.type, 0.45) : k.rule;
        c.fillRect(px0 - 8, Math.round(y) - (zero ? 1 : 0.5), (px1 - px0 + 8) * intro, zero ? 2 : 1);
        const unit = Math.abs(v - vTop) < sc.step * 1e-6 ? this.P.unit : ''; // the unit on the top tick only
        text(c, fmt(v, d) + unit, px0 - 22, y + 7, mono, 20, k.dim, { align: 'right' });
      }
    };
    if (s.prev.step !== s.step) { grid(s.prev, 1 - s.e); grid(s, s.e); } else grid(s, 1);
    c.globalAlpha = 1;

    // the points
    const line = this.P.kind === 'line';
    const pts: { x: number; y: number; v: number }[] = [];
    for (let i = 0; i <= j; i++) {
      const g = prog(t, this.cues[i]!.at, this.cues[i]!.at + GROW, ease.outCubic);
      const newest = i === j, fade = i < j ? prog(t, this.cues[i + 1]!.at, this.cues[i + 1]!.at + 0.4) : 0;
      const col = mixHex(k.accent, line ? k.type : k.dim, fade);
      const v = line && i > 0 ? lerp(this.vals[i - 1]!, this.vals[i]!, g) : this.vals[i]! * g;
      const x = line && i > 0 ? lerp(xOf(i - 1), xOf(i), g) : xOf(i), y = yOf(v);
      pts.push({ x, y, v });
      if (!line) {
        const bw = Math.min(slot * 0.62, 150), yz = yOf(0);
        c.fillStyle = col;
        c.fillRect(x - bw / 2, Math.min(y, yz), bw, Math.abs(yz - y));
      }
      // the value over its point (under it when negative), counting up as it lands
      const vs = fmt(v, this.dec) + this.P.unit, room = slot - 12;
      const z = Math.min(newest ? 44 : 28, fitSize(vs, newest ? disp : body, room, newest ? 44 : 28, 14));
      const neg = this.vals[i]! < 0, vy = neg ? y + z + 14 : y - (line ? 24 : 16);
      c.globalAlpha = clamp(g * 4);
      text(c, vs, x, vy, newest ? disp : body, z, mixHex(k.accent, newest ? k.type : k.dim, newest ? 0 : fade), { align: 'center' });
      c.globalAlpha = 1;
    }
    if (line && pts.length) this.line(c, k, pts, t, j, yOf(Math.max(s.lo, Math.min(0, s.hi))));

    // category labels under the axis: the newest in type, the others dim; wrapped to two rows
    for (let i = 0; i <= j; i++) {
      const a = arrive(t, this.cues[i]!.at, 0.3);
      const s0 = this.labels[i]!, lz = Math.max(16, Math.min(26, fitSize(s0, body, slot - 16, 26, 16)));
      const rows = measure(s0, body, lz) > slot - 16 ? wrap(s0, body, lz, slot - 16).slice(0, 2) : [s0];
      c.globalAlpha = a;
      rows.forEach((r, ri) => text(c, r, xOf(i), y1 + 40 + ri * lz * 1.15 + (1 - a) * 10, body, lz, i === j ? k.type : k.dim, { align: 'center' }));
    }
    c.globalAlpha = 1;
    // the points still to come: small ticks on the axis
    for (let i = j + 1; i < n; i++) { c.fillStyle = k.rule; c.fillRect(xOf(i) - 1, y1 + 6, 2, 10 * intro); }
  }

  /** The line through the landed points, its dots, and a drop line from the newest to the axis. */
  private line(c: CanvasRenderingContext2D, k: Look, pts: { x: number; y: number }[], t: number, j: number, yz: number) {
    c.strokeStyle = k.type; c.lineWidth = 3.5; c.lineJoin = 'round'; c.lineCap = 'round';
    c.beginPath();
    pts.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
    c.stroke();
    const head = pts.at(-1)!;
    c.setLineDash([3, 7]); c.strokeStyle = k.a('accent', 0.7); c.lineWidth = 2;
    c.beginPath(); c.moveTo(head.x, head.y + 14); c.lineTo(head.x, yz); c.stroke();
    c.setLineDash([]);
    pts.forEach((p, i) => {
      const newest = i === j, r = newest ? 10 : 6;
      c.beginPath(); c.arc(p.x, p.y, r + 3, 0, Math.PI * 2); c.fillStyle = k.bg; c.fill();
      c.beginPath(); c.arc(p.x, p.y, r, 0, Math.PI * 2); c.fillStyle = newest ? k.accent : k.type; c.fill();
    });
    // a ring spreading from the newest point as it lands
    const lt = t - this.cues[j]!.at - GROW * 0.5;
    if (lt > 0 && lt < 0.6) {
      c.beginPath(); c.arc(head.x, head.y, 10 + 36 * ease.outCubic(lt / 0.6), 0, Math.PI * 2);
      c.strokeStyle = k.a('accent', 0.6 * (1 - lt / 0.6)); c.lineWidth = 2; c.stroke();
    }
  }
}
