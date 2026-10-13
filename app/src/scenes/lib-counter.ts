// Library: the counter. A big number rolls to each cue's `value` on its anchor (digits in fixed cells, so the
// roll never jitters), under a label; a delta pill says how far it moved, and a sparkline under it keeps every
// value so far, the newest lit. From Harvest's running byte count; for any figure a line names: a price, a
// count, a year, a percentage.
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import { measure } from '../engine/type';
import { ease, lerp, prog } from '../engine/util';
import { LibScene, M, W, arrive, label, pill, text, type Look } from './_lib';

export const schema: SceneSchema = {
  description: 'A big number that rolls to each cue\'s value on its anchor, with a label, the change as a pill and a sparkline of every value so far. For figures: counts, prices, years, percentages.',
  kinds: ['explainer', 'song'],
  lyrics: 'layer',
  entry: {
    title: { type: 'string', default: '', description: 'a kicker above the number (what is being counted)' },
    prefix: { type: 'string', default: '', description: 'before the number, e.g. "$"' },
    unit: { type: 'string', default: '', description: 'after the number, e.g. "%", " GB"' },
    decimals: { type: 'number', default: 0, min: 0, max: 3, description: 'decimal places' },
    delta: { type: 'boolean', default: true, description: 'show the change from the previous value as a pill' },
  },
  cue: {
    value: { type: 'number', description: 'the value the number rolls to on this cue\'s anchor' },
    label: { type: 'string', default: '', description: 'what the value is, under the number (keeps the previous label if empty)' },
  },
  example: {
    entry: { title: 'Data harvested', unit: ' TB', decimals: 1 },
    cues: [{ value: 4.2, label: 'one inbox' }, { value: 310, label: 'one company' }, { value: 9400, label: 'one country' }, { value: 88000, label: 'everyone' }],
  },
};

interface P { title: string; prefix: string; unit: string; decimals: number; delta: boolean }
interface C { value: number; label: string }

const ROLL = 0.7; // s a change takes

export default class LibCounter extends LibScene<P, C> {
  static schema = schema;
  private vals: number[] = [];
  private labels: string[] = [];

  override setup() {
    let lab = '';
    for (const c of this.cues) {
      const p = this.cp(c);
      this.vals.push(p.value);
      lab = p.label || lab;
      this.labels.push(lab);
    }
  }

  private fmt(v: number) {
    const s = Math.abs(v).toFixed(this.P.decimals);
    const [i, d] = s.split('.');
    return `${v < 0 ? '−' : ''}${this.P.prefix}${i!.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${d ? `.${d}` : ''}`;
  }

  /** The value shown at t: rolling from the previous value to each cue's over ROLL s from its anchor. */
  private value(t: number) {
    let v = 0;
    this.cues.forEach((c, i) => { if (t >= c.at) v = lerp(i ? this.vals[i - 1]! : 0, this.vals[i]!, ease.outExpo(prog(t, c.at, c.at + ROLL))); });
    return v;
  }

  draw(c: CanvasRenderingContext2D, f: Frame, k: Look) {
    const t = f.t, fam = this.font('display'), mono = this.font('mono');
    const i = this.cues.findLastIndex((x) => x.at <= t);
    const top = M + 40, x0 = M + 40;

    if (this.P.title) label(c, this.P.title, x0, top + 20, mono, k.dim, 26);

    // the number: each glyph in a cell as wide as the widest digit, so a roll does not jitter; the unit after it
    // smaller and dim
    const s = this.fmt(this.value(t)), unit = this.P.unit.trim();
    const longest = this.fmt(Math.max(...this.vals.map(Math.abs))).replace(/\d/g, '0');
    const room = W - 2 * x0 - (unit ? measure(unit, fam, 260 * 0.42) + 24 : 0);
    const size = Math.min(260, (260 * room) / measure(longest, fam, 260));
    const cell = measure('0', fam, size), base = top + 60 + size * 0.78;
    const pop = i >= 0 ? 1 + 0.04 * Math.pow(0.5, (t - this.cues[i]!.at) / 0.08) : 1;
    let x = x0;
    c.save();
    c.translate(x0, base); c.scale(pop, pop); c.translate(-x0, -base);
    for (const ch of s) {
      const digit = /\d/.test(ch), w = digit ? cell : measure(ch, fam, size);
      text(c, ch, digit ? x + cell / 2 : x, base, fam, size, i >= 0 ? k.type : k.dim, { align: digit ? 'center' : 'left' });
      x += w;
    }
    if (unit) text(c, unit, x + size * 0.08, base, fam, size * 0.42, k.dim);
    c.restore();

    // the label, and the change as a pill
    const ly = base + 76;
    if (i >= 0) {
      const a = arrive(t, this.cues[i]!.at, 0.3);
      c.save();
      c.globalAlpha = a;
      const lw = this.labels[i] ? text(c, this.labels[i]!, x0, ly + (1 - a) * 12, this.font('body'), 52, k.type) : 0;
      if (this.P.delta && i > 0 && this.vals[i - 1] !== 0) {
        const d = (this.vals[i]! - this.vals[i - 1]!) / Math.abs(this.vals[i - 1]!);
        const ds = `${d >= 0 ? '+' : '−'}${Math.abs(d) >= 10 ? `${Math.round(Math.abs(d))}×` : `${Math.round(Math.abs(d) * 100)}%`}`;
        pill(c, ds, x0 + lw + (lw ? 28 : 0), ly - 18, mono, 30, k.accent, k.onAccent);
      }
      c.restore();
    }

    // sparkline of every value so far (log scale when the values span decades)
    const sx0 = x0, sx1 = W - M - 40, sy1 = this.bottom - 10, sy0 = Math.max(ly + 60, sy1 - 150);
    if (sy1 - sy0 < 40) return;
    const pos = this.vals.map((v) => v > 0 ? v : 0);
    const logs = Math.max(...pos) / Math.max(1e-9, Math.min(...pos.filter((v) => v > 0))) > 100;
    const yv = (v: number) => { const a = logs ? Math.log10(Math.max(v, 1e-9)) : v; const all = this.vals.map((u) => (logs ? Math.log10(Math.max(u, 1e-9)) : u));
      const lo = Math.min(0, ...all), hi = Math.max(...all); return lerp(sy1, sy0, hi > lo ? (a - lo) / (hi - lo) : 0.5); };
    const n = this.vals.length, xv = (j: number) => lerp(sx0, sx1, n > 1 ? j / (n - 1) : 0.5);
    c.fillStyle = k.rule; c.fillRect(sx0, sy1 + 0.5, sx1 - sx0, 1.5);
    c.strokeStyle = k.type; c.lineWidth = 3; c.lineJoin = 'round';
    c.beginPath();
    for (let j = 0; j <= i; j++) {
      const p = j === 0 ? 1 : ease.inOutCubic(prog(t, this.cues[j]!.at, this.cues[j]!.at + ROLL));
      const px = lerp(xv(j - 1 < 0 ? 0 : j - 1), xv(j), p), py = lerp(yv(j ? this.vals[j - 1]! : this.vals[0]!), yv(this.vals[j]!), p);
      if (j === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.stroke();
    for (let j = 0; j <= i; j++) {
      const a = arrive(t, this.cues[j]!.at + (j ? ROLL * 0.6 : 0), 0.2);
      if (a <= 0) continue;
      c.beginPath(); c.arc(xv(j), yv(this.vals[j]!), (j === i ? 10 : 6) * a, 0, Math.PI * 2);
      c.fillStyle = j === i ? k.accent : k.type; c.fill();
    }
    for (let j = i + 1; j < n; j++) { // the values still to come: hollow ticks on the axis
      c.beginPath(); c.arc(xv(j), sy1, 4, 0, Math.PI * 2); c.strokeStyle = k.rule; c.lineWidth = 2; c.stroke();
    }
  }
}
