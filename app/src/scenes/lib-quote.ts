// Library: the pull quote. One line per cue set large in the italic serif, centred, under an oversized opening
// quote mark in accent that hangs off its first row and glides to each new quote. A sung line is wiped as it is
// sung (the word being sung in accent, settling to the type colour); a cue's `quote` replaces it with a quote
// card whose words rise in turn. An optional attribution (`by`) sits under a short accent rule. For the line a
// song turns on, a lyric worth framing, or a quotation in an explainer.
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import type { ResolvedCue } from '../engine/cues';
import type { Word } from '../engine/lyrics';
import { drawKaraoke, layoutWords, type KLayout } from '../engine/karaoke';
import { font, measure, smart } from '../engine/type';
import { clamp, ease, lerp, prog } from '../engine/util';
import { LibScene, W, H, hit, label, type Look } from './_lib';

export const schema: SceneSchema = {
  description: 'A large serif pull quote under an oversized accent quote mark: the sung line wiped as it is sung, or a quotation (`quote`) revealed word by word, with an optional attribution. For a lyric worth framing, or a quotation in an explainer.',
  kinds: ['song', 'explainer'],
  lyrics: 'own',
  entry: {},
  cue: {
    quote: { type: 'string', default: '', description: 'text of the quote card (replaces the sung line, which is then not shown); empty: the sung line, wiped as sung' },
    by: { type: 'string', default: '', description: 'attribution under the quote, e.g. a name or source (none if empty)' },
  },
  example: {
    entry: {},
    cues: [{}, { by: 'Force Push, verse two' }, { quote: 'The best commit is the one you never have to revert.', by: 'Engineering proverb' }, {}],
  },
};

interface C { quote: string; by: string }

const LEAD = 0.45;
const LH = 1.12; // row pitch (em)
const MAXW = 1380;

const markSize = (lay: KLayout) => clamp(lay.size * 3.4, 280, 440);

interface Card { cue: ResolvedCue; lay: KLayout; sung: boolean; by: string; x: number; y: number; show: number; hide: number }

export default class LibQuote extends LibScene<Record<string, never>, C> {
  static schema = schema;
  private cards: Card[] = [];

  override setup() {
    const fam = this.font('serif');
    const cards = this.cues.flatMap((cue) => {
      const p = this.cp(cue), q = smart(p.quote.trim());
      if (!q && !cue.line) return [];
      // a quote card's words are all "sung" from the start; its reveal is drawn by time instead
      const words: Word[] = q ? q.split(/\s+/).map((w, i) => ({ w, start: 0, end: 0, line: -1, index: i, gi: i })) : cue.line!.words;
      const by = p.by.trim();
      const lay = this.fit(words, fam, by ? 600 : 680);
      const h = lay.rows.length * lay.size * LH + (by ? 110 : 0);
      // the block centred (a touch above the middle), the first row's baseline
      const x = (W - lay.width) / 2 + markSize(lay) * 0.14, y = H * 0.48 - h / 2 + lay.size * 0.78;
      return [{ cue, lay, sung: !q, by, x, y, show: -Infinity, hide: Infinity }];
    });
    cards.forEach((c, i) => {
      const prev = cards[i - 1], next = cards[i + 1];
      const t0 = (x: Card) => (x.sung ? x.cue.line!.start : x.cue.start);
      const t1 = (x: Card) => (x.sung ? x.cue.line!.end : x.cue.end);
      if (prev) c.show = Math.max(t0(c) - LEAD, Math.min(t1(prev), t0(c)) - 0.02);
      if (next) c.hide = Math.max(t0(next) - LEAD, Math.min(t1(c), t0(next)) - 0.02);
    });
    this.cards = cards;
  }

  /** The largest size the words fit at in balanced rows (≤ 3), inside maxH; greedy rows at the smallest size. */
  private fit(words: Word[], fam: string, maxH: number): KLayout {
    for (let s = 132; s >= 52; s -= 4) {
      const lay = layoutWords(words, fam, s, MAXW, 0, 3);
      if (lay.width <= MAXW && lay.rows.length * s * LH <= maxH) return lay;
    }
    const s = 52, sp = measure(' ', fam, s);
    const lay: KLayout = { rows: [], fam, size: s, tracking: 0, width: 0 };
    let row: KLayout['rows'][number] = { items: [], width: 0 };
    for (const w of words) {
      const ww = measure(w.w, fam, s);
      if (row.items.length && row.width + sp + ww > MAXW) { lay.rows.push(row); row = { items: [], width: 0 }; }
      const x0 = row.items.length ? row.width + sp : 0;
      row.items.push({ w, x: x0, width: ww }); row.width = x0 + ww;
    }
    lay.rows.push(row);
    lay.width = Math.max(...lay.rows.map((r) => r.width));
    return lay;
  }

  draw(c: CanvasRenderingContext2D, f: Frame, k: Look) {
    const t = f.t;
    const i = this.cards.findLastIndex((x) => x.show <= t);
    if (i < 0) return;
    this.mark(c, f, k, i);
    for (const j of [i - 1, i]) {
      const cd = this.cards[j];
      if (!cd || t >= cd.hide + 0.3) continue;
      const out = cd.hide === Infinity ? 0 : ease.inOutCubic(prog(t, cd.hide, cd.hide + 0.3));
      const inn = cd.show === -Infinity ? 1 : ease.outCubic(prog(t, cd.show + 0.1, cd.show + 0.45));
      c.save();
      c.globalAlpha = (1 - out) * inn;
      c.translate(0, (1 - inn) * 16 - out * 24);
      this.card(c, t, k, cd);
      c.restore();
    }
  }

  /** The quote mark: hanging off the first row of the card on screen, gliding to the next one. */
  private mark(c: CanvasRenderingContext2D, f: Frame, k: Look, i: number) {
    const t = f.t, cd = this.cards[i]!, prev = this.cards[i - 1];
    const pos = (x: Card) => ({ x: x.x - x.lay.size * 0.3, y: x.y - x.lay.size * 0.64, z: markSize(x.lay) });
    const a = pos(cd), b = prev ? pos(prev) : a;
    const g = prev ? ease.inOutCubic(prog(t, cd.show, cd.show + 0.5)) : 1;
    const x = lerp(b.x, a.x, g), y = lerp(b.y, a.y, g), z = lerp(b.z, a.z, g);
    const fam = this.font('serif');
    const s = (1 + 0.06 * hit(t, cd.cue.at, 0.14) + 0.012 * f.a.kick) * (prev ? 1 : ease.outCubic(prog(t, this.ctx.start, this.ctx.start + 0.5)));
    c.save();
    c.translate(x, y); c.scale(s, s);
    c.font = font(fam, z);
    c.textAlign = 'right'; c.textBaseline = 'alphabetic';
    c.fillStyle = k.accent;
    // the mark's glyph sits high in its em: drop it so its top meets the first row's cap height
    c.fillText('“', 0, z * 0.7);
    c.restore();
  }

  private card(c: CanvasRenderingContext2D, t: number, k: Look, cd: Card) {
    const { lay, x, y } = cd, lh = lay.size * LH;
    if (cd.sung) {
      drawKaraoke(c, lay, t, x, y, { sung: k.a('type'), unsung: k.a('type', 0.22), active: k.a('accent'), lineH: LH });
    } else {
      // quote card: the words rise in turn from the cue's start
      const n = lay.rows.reduce((s, r) => s + r.items.length, 0), step = Math.min(0.07, 1.1 / Math.max(1, n));
      const t0 = Math.max(cd.show, cd.cue.start - 0.1);
      c.font = font(lay.fam, lay.size);
      c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      c.fillStyle = k.type;
      const base = c.globalAlpha;
      let j = 0;
      lay.rows.forEach((row, r) => row.items.forEach((it) => {
        const d = t0 + j++ * step, p = ease.outCubic(prog(t, d, d + 0.5));
        c.globalAlpha = base * p;
        c.fillText(it.w.w, x + it.x, y + r * lh + (1 - p) * lay.size * 0.25);
      }));
      c.globalAlpha = base;
    }
    if (!cd.by) return;
    // attribution: a short accent rule growing, then the name in mono caps
    const ay = y + (lay.rows.length - 1) * lh + lay.size * 0.42 + 78;
    const t0 = Math.min(cd.cue.at, (cd.sung ? cd.cue.line!.end : cd.cue.start + 1.2)) - 0.2;
    const g = ease.outCubic(prog(t, t0, t0 + 0.45));
    if (g <= 0) return;
    c.fillStyle = k.accent;
    c.fillRect(x, ay - 7, 56 * g, 2);
    const base = c.globalAlpha;
    c.globalAlpha = base * ease.outCubic(prog(t, t0 + 0.15, t0 + 0.55));
    label(c, cd.by, x + 80 + (1 - g) * 12, ay, this.font('mono'), k.dim, 22);
    c.globalAlpha = base;
  }
}
