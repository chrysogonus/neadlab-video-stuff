// Library: the list. One item per cue, in big type, arriving as its line starts and marked on its anchor: struck
// through (Force Push's "no more" list), ticked, or left alone. The newest item leads in full colour; older ones
// settle dimmer, and once the list outgrows the frame the oldest scroll off the top. For enumerations: features,
// reasons, things that are over, a checklist.
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import { measure } from '../engine/type';
import { ease, lerp, prog } from '../engine/util';
import { LibScene, M, W, arrive, balanced, hit, label, mixHex, strike, text, wrap, type Look } from './_lib';

export const schema: SceneSchema = {
  description: 'A list built one item per cue in big type: each item arrives as its line starts and is struck through, ticked or left as is on the anchor; the newest leads, older ones dim and scroll off. For enumerations: reasons, features, things ruled out, a checklist.',
  kinds: ['explainer', 'song'],
  lyrics: 'layer',
  entry: {
    title: { type: 'string', default: '', description: 'a kicker above the list (what is being listed)' },
    mark: { type: 'string', default: 'none', enum: ['strike', 'check', 'none'], description: 'what happens to an item on its anchor: struck through, ticked, or nothing' },
    numbered: { type: 'boolean', default: true, description: 'number the items (01, 02 …) instead of bullets' },
  },
  cue: {
    item: { type: 'string', default: '', description: 'the item (default: the cue\'s line, cut to its first clause when long); a few words read best' },
  },
  example: {
    entry: { title: 'What HTTPS rules out', mark: 'strike', numbered: true },
    cues: [{ item: 'Passwords in plain text' }, { item: 'Cookies anyone can read' }, { item: 'Tampered downloads' }, { item: 'Ads injected by the Wi-Fi' }],
  },
};

interface P { title: string; mark: 'strike' | 'check' | 'none'; numbered: boolean }
interface C { item: string }

/** A sung line as a list item: trailing punctuation dropped, cut to its first clause (or 7 words) when long. */
function shorten(s: string) {
  const strip = (x: string) => x.trim().replace(/[\s.,;:!…—–-]+$/u, '');
  let out = strip(s);
  if (out.length > 40) {
    const clause = out.split(/(?<=[,;:?!—–])\s+/u).map(strip).find((x) => x.split(/\s+/).length >= 2);
    out = clause && clause.length < out.length ? clause : out;
  }
  const words = out.split(/\s+/);
  return words.length > 8 ? `${words.slice(0, 7).join(' ')}…` : out;
}

export default class LibList extends LibScene<P, C> {
  static schema = schema;
  private items: string[][] = []; // each item's wrapped rows
  private size = 96;

  override setup() {
    const fam = this.font('display'), tw = this.textW();
    const texts = this.cues.map((c) => this.cp(c).item || shorten(c.line?.text ?? ''));
    // one size for the whole list: the largest (96 → 52) at which every item fits in 2 rows (3 below 64 px)
    const rowsAt = (z: number) => (z >= 64 ? 2 : 3);
    const fits = (z: number) => texts.every((s) => { const r = wrap(s, fam, z, tw); return r.length <= rowsAt(z) && r.every((x) => measure(x, fam, z) <= tw); });
    for (this.size = 96; this.size > 52 && !fits(this.size); this.size -= 2);
    // a single word wider than the room even then: smaller still
    const wide = Math.max(0, ...texts.flatMap((s) => s.split(/\s+/)).map((w) => measure(w, fam, this.size)));
    if (wide > tw) this.size = Math.floor((this.size * tw) / wide);
    const R = rowsAt(this.size);
    this.items = texts.map((s) => {
      const rows = wrap(s, fam, this.size, tw);
      if (rows.length <= R) return balanced(s, fam, this.size, tw);
      // still too long at the smallest size: the last row ends in an ellipsis
      const rest = rows.slice(R - 1).join(' ').split(' ');
      while (rest.length > 1 && measure(`${rest.join(' ')}…`, fam, this.size) > tw) rest.pop();
      return [...rows.slice(0, R - 1), `${rest.join(' ')}…`];
    });
  }

  private markW() { return this.P.mark === 'check' ? 104 : this.P.numbered ? 118 : 72; }
  private textW() { return W - 2 * M - 40 - this.markW() - 40; }
  private pitch(i: number) { return this.items[i]!.length * this.size * 1.04 + this.size * 0.46; }

  draw(c: CanvasRenderingContext2D, f: Frame, k: Look) {
    const t = f.t, fam = this.font('display'), mono = this.font('mono'), S = this.size;
    const x0 = M + 40, tx = x0 + this.markW();
    let top = M + 30;
    if (this.P.title) {
      label(c, this.P.title, x0, M + 40, mono, k.dim, 24);
      c.fillStyle = k.rule; c.fillRect(x0, M + 66, W - 2 * M - 80, 1.5);
      top = M + 120;
    }
    const capH = this.bottom - top;

    // items in: each grows the list as it arrives; past the room, the list scrolls up
    const shown = this.cues.map((q, i) => ({ q, i })).filter(({ q }) => t >= q.start);
    const grow = (i: number) => this.pitch(i) * ease.inOutCubic(prog(t, this.cues[i]!.start, this.cues[i]!.start + 0.4));
    const total = shown.reduce((s, { i }) => s + grow(i), 0) - S * 0.46;
    let y = top - Math.max(0, total - capH);
    const newest = shown.at(-1)?.i ?? -1;

    for (const { q, i } of shown) {
      const rows = this.items[i]!, gh = grow(i);
      const a = arrive(t, q.start, 0.4), next = this.cues[i + 1];
      // older items settle dimmer once the next one arrives; items scrolling off the top fade
      const old = next ? ease.inOutCubic(prog(t, next.start, next.start + 0.5)) : 0;
      const off = Math.min(1, Math.max(0, (y - top + S * 0.6) / (S * 0.8)));
      if (off <= 0) { y += gh; continue; }
      const marked = this.P.mark === 'none' ? 0 : ease.outCubic(prog(t, q.at, q.at + 0.3));
      c.save();
      c.globalAlpha = a * off;
      const dy = (1 - a) * 26, base0 = y + S * 0.86 + dy;
      // the text: type while it leads, dim once older (and once struck)
      const dimK = Math.max(old * 0.7, this.P.mark === 'strike' ? marked * 0.55 : 0);
      const col = mixHex(k.type, k.dim, dimK);
      rows.forEach((s, r) => text(c, s, tx, base0 + r * S * 1.04, fam, S, col));
      // strike: one rule per row, drawn left to right on the anchor, row after row
      if (this.P.mark === 'strike') {
        const sp = prog(t, q.at, q.at + 0.32, ease.inOutCubic) * rows.length;
        rows.forEach((s, r) => {
          const w = measure(s, fam, S);
          strike(c, tx - 8, base0 + r * S * 1.04 - S * 0.34, tx + w + 8, sp - r, k.a('accent', lerp(1, 0.6, old)), Math.max(5, S * 0.07));
        });
      }
      this.marker(c, i, x0, base0 - S * 0.36, t, f, k, i === newest ? 1 - old : 0, old, mono);
      c.restore();
      y += gh;
    }
  }

  /** The number, bullet or tick box left of an item, centred on cy. `lead` 1 for the newest item. */
  private marker(c: CanvasRenderingContext2D, i: number, x: number, cy: number, t: number, f: Frame, k: Look, lead: number, old: number, mono: string) {
    const q = this.cues[i]!, pop = hit(t, q.at, 0.12);
    const breathe = 1 + 0.06 * f.a.kick * lead;
    if (this.P.mark === 'check') {
      const r = 34 * breathe * (1 + 0.12 * pop), p = prog(t, q.at, q.at + 0.3, ease.outCubic);
      c.beginPath(); c.arc(x + r, cy, r, 0, Math.PI * 2);
      if (p > 0) { c.fillStyle = mixHex(k.accent, k.dim, old * 0.6); c.fill(); }
      else { c.strokeStyle = k.dim; c.lineWidth = 2.5; c.stroke(); }
      if (p > 0) { // the tick, drawn in two strokes
        const pts: [number, number][] = [[-0.42, 0.02], [-0.12, 0.32], [0.44, -0.3]];
        c.strokeStyle = k.onAccent; c.lineWidth = 6; c.lineCap = 'round'; c.lineJoin = 'round';
        c.beginPath(); c.moveTo(x + r + pts[0]![0] * r, cy + pts[0]![1] * r);
        const s1 = Math.min(1, p * 2.2), s2 = Math.max(0, p * 2.2 - 1) / 1.2;
        c.lineTo(x + r + lerp(pts[0]![0], pts[1]![0], s1) * r, cy + lerp(pts[0]![1], pts[1]![1], s1) * r);
        if (s2 > 0) c.lineTo(x + r + lerp(pts[1]![0], pts[2]![0], s2) * r, cy + lerp(pts[1]![1], pts[2]![1], s2) * r);
        c.stroke();
      }
      return;
    }
    const col = mixHex(k.dim, k.accent, Math.max(lead, pop));
    if (this.P.numbered) {
      text(c, String(i + 1).padStart(2, '0'), x, cy + 13 * breathe, mono, 36 * breathe, col, { track: 1 });
    } else {
      const s = 14 * breathe * (1 + 0.3 * pop);
      c.fillStyle = col; c.fillRect(x + 8, cy - s / 2, s, s);
    }
  }
}
