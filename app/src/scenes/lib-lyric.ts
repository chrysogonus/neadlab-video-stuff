// Library: the kinetic lyric. The line being sung, set big across the frame in the display face (one to three
// rows, fitted), each word rising into place and filling in as it is sung while the words still to come wait
// faint; the cue's anchor word (and any `emphasis`) in accent, a size up, popping on its anchor. When the next
// line comes in, the old one leaves upward and the new one builds in its place; between lines the last one
// holds. From Force Push's chorus hero lines; for choruses, hooks and any stretch where the words are the picture.
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import type { ResolvedCue } from '../engine/cues';
import type { Line, Word } from '../engine/lyrics';
import { fontFamily } from '../engine/style';
import { font, measure, plain } from '../engine/type';
import { clamp, ease, prog } from '../engine/util';
import { LibScene, M, W, H, hit, type Look } from './_lib';

export const schema: SceneSchema = {
  description: 'The sung line set huge across the frame, word by word as it is sung (upcoming words faint), the anchor word in accent; each new line replaces the last. For choruses, hooks and lines that should be read big.',
  kinds: ['song', 'explainer'],
  lyrics: 'own',
  entry: {
    align: { type: 'string', enum: ['left', 'center'], default: 'left', description: 'alignment of the rows' },
    upper: { type: 'boolean', default: false, description: 'set the lines in capitals' },
  },
  cue: {
    emphasis: { type: 'string', default: '', description: 'another word of the line to set in accent (besides the anchor word)' },
  },
  example: { entry: { align: 'left', upper: false }, cues: [{}, { emphasis: 'name' }, {}, {}] },
};

interface P { align: 'left' | 'center'; upper: boolean }
interface C { emphasis: string }

const LEAD = 0.45; // s a line may come in before its first word (when the previous one is done)
const LEAVE = 0.24; // s the old line takes to leave
const BIG = 1.08; // the accented words' size, relative to the line's
const LH = 1.0; // row pitch (em)
const X0 = M + 64;
const BASE = H * 0.68; // the last row's baseline

interface Item { w: Word; x: number; row: number; size: number; fam: string; accent: boolean; anchor: boolean }
interface Slot { cue: ResolvedCue; line: Line; items: Item[]; rows: number[]; size: number; track: number; show: number; hide: number }

const key = (s: string) => plain(s).toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

export default class LibLyric extends LibScene<P, C> {
  static schema = schema;
  private sets: Slot[] = [];

  override setup() {
    const fam = this.font('display'), spec = this.ctx.style.fonts.display ?? this.ctx.style.fonts.body!;
    // the accented words: a step wider and heavier where the face has one
    const heavy = spec.family === 'archivo' ? fontFamily({ ...spec, width: Math.min(125, (spec.width ?? 100) + 12), weight: Math.min(900, (spec.weight ?? 700) + 200) }) : fam;
    const lined = this.cues.filter((c) => c.line);
    this.sets = lined.map((cue, i) => {
      const line = cue.line!, emph = key(this.cp(cue).emphasis);
      const words = line.words.map((w) => (this.P.upper ? { ...w, w: w.w.toUpperCase() } : w));
      const acc = words.map((w, j) => j === cue.word?.index || (!!emph && key(w.w) === emph));
      const set = this.fit(words, acc, cue.word?.index ?? -1, fam, heavy);
      const prev = lined[i - 1]?.line, next = lined[i + 1]?.line;
      // in up to LEAD s before its first word, but not while the previous line is still being sung
      const show = prev ? Math.max(line.start - LEAD, Math.min(prev.end, line.start) - 0.02) : -Infinity;
      const hide = next ? Math.max(next.start - LEAD, Math.min(line.end, next.start) - 0.02) : Infinity;
      return { cue, line, ...set, show, hide };
    });
  }

  /** The largest size (rows ≤ 3, inside the frame) the words fit at, laid out in balanced rows. */
  private fit(words: Word[], acc: boolean[], anchor: number, fam: string, heavy: string) {
    const maxW = W - 2 * X0, maxH = BASE - M - 40; // cap height of the first row stays under the top margin
    for (let size = 230; ; size -= 4) {
      const track = (this.P.upper ? 0.01 : -0.02) * size;
      const sizes = acc.map((a) => (a ? size * BIG : size));
      const fams = acc.map((a) => (a ? heavy : fam));
      const ws = words.map((w, j) => measure(w.w, fams[j]!, sizes[j]!, track));
      const sp = measure(' ', fam, size) + track;
      const rows = breakRows(ws, sp, maxW);
      const widest = Math.max(...rows.map(([a, b]) => ws.slice(a, b).reduce((s, x) => s + x, 0) + sp * (b - a - 1)));
      if ((rows.length <= 3 && widest <= maxW && rows.length * size * LH <= maxH) || size <= 64) {
        const items: Item[] = [], rowW: number[] = [];
        rows.forEach(([a, b], r) => {
          let x = 0;
          for (let j = a; j < b; j++) {
            items.push({ w: words[j]!, x, row: r, size: sizes[j]!, fam: fams[j]!, accent: acc[j]!, anchor: j === anchor });
            x += ws[j]! + sp;
          }
          rowW.push(x - sp);
        });
        return { items, rows: rowW, size, track };
      }
    }
  }

  draw(c: CanvasRenderingContext2D, f: Frame, k: Look) {
    const t = f.t;
    for (const s of this.sets) {
      if (t < s.show || t >= s.hide + LEAVE) continue;
      const out = s.hide === Infinity ? 0 : ease.outCubic(prog(t, s.hide, s.hide + LEAVE));
      this.line(c, f, k, s, out);
    }
  }

  private line(c: CanvasRenderingContext2D, f: Frame, k: Look, s: Slot, out: number) {
    const t = f.t, z = s.size, n = s.rows.length;
    // the last row on a fixed baseline, so lines grow upward from it and a change of line never jumps
    const y0 = BASE - (n - 1) * z * LH - out * z * 0.5;
    // the new line's waiting words come in once the old line is mostly gone
    const fadeIn = s.show === -Infinity ? 1 : ease.outCubic(prog(t, s.show + 0.1, s.show + 0.35));
    const gone = clamp(out * 1.5);
    c.save();
    c.textBaseline = 'alphabetic';
    c.textAlign = 'left';
    c.letterSpacing = `${s.track}px`;
    for (const it of s.items) {
      const x = (this.P.align === 'center' ? (W - s.rows[it.row]!) / 2 : X0) + it.x, y = y0 + it.row * z * LH;
      // waiting faint a little low; rising into place and filling in from the word's start
      const p = ease.outCubic(prog(t, it.w.start, it.w.start + 0.3));
      const col = it.accent ? k.accent : k.type;
      const a = (0.15 + 0.85 * p) * fadeIn;
      const rise = (1 - p) * z * 0.12 + (1 - fadeIn) * z * 0.2 + out * it.row * z * 0.08;
      c.font = font(it.fam, it.size);
      c.fillStyle = col;
      c.globalAlpha = (1 - gone) * (it.w.start <= t ? Math.max(a, p) : a);
      if (it.anchor && t >= it.w.start) {
        // the anchor pops on its start and then breathes with the kick
        const pop = 1 + 0.07 * hit(t, it.w.start, 0.12) + 0.012 * f.a.kick;
        const cx = x + measure(it.w.w, it.fam, it.size, s.track) / 2, cy = y - z * 0.35;
        c.save();
        c.translate(cx, cy); c.scale(pop, pop); c.translate(-cx, -cy);
        c.fillText(it.w.w, x, y + rise);
        c.restore();
      } else c.fillText(it.w.w, x, y + rise);
    }
    c.letterSpacing = '0px';
    c.restore();
  }

  override post(f: Frame) {
    const s = this.sets.find((x) => f.t >= x.cue.at && f.t < x.hide);
    const h = s ? hit(f.t, s.cue.at, 0.1) : 0;
    return { zoom: 1 + 0.006 * h };
  }
}

/** Break words (widths ws, space sp) into the fewest rows (≤ 3 tried) with the narrowest widest row. */
function breakRows(ws: number[], sp: number, maxW: number): [number, number][] {
  const n = ws.length;
  const rw = (a: number, b: number) => ws.slice(a, b).reduce((s, x) => s + x, 0) + sp * Math.max(0, b - a - 1);
  if (rw(0, n) <= maxW || n < 2) return [[0, n]];
  let best: [number, number][] = [], bestMax = Infinity;
  for (let i = 1; i < n; i++) {
    const m = Math.max(rw(0, i), rw(i, n));
    if (m < bestMax) { bestMax = m; best = [[0, i], [i, n]]; }
  }
  if (bestMax <= maxW || n < 3) return best;
  for (let i = 1; i < n; i++) for (let j = i + 1; j < n; j++) {
    const m = Math.max(rw(0, i), rw(i, j), rw(j, n));
    if (m < bestMax) { bestMax = m; best = [[0, i], [i, j], [j, n]]; }
  }
  return best;
}
