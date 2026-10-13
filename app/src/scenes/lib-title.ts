// Library: the title card. A thin accent rule draws itself toward the cue's anchor; on the anchor the title
// rises out of a mask letter by letter in the display face, tight and large, then the kicker (small mono caps
// above) and the subtitle (italic serif below the rule) arrive. A cue that names another title (or kicker, or
// subtitle) turns it into a chapter card: the old title drops back behind its mask and the next one draws in.
// Left-aligned, above the lyric area. For openings, chapter breaks and section titles in songs and explainers.
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import type { ResolvedCue } from '../engine/cues';
import type { Word } from '../engine/lyrics';
import { layoutWords, type KLayout } from '../engine/karaoke';
import { font, layout, smart, type TextLayout } from '../engine/type';
import { clamp, ease, prog } from '../engine/util';
import { LibScene, M, W, label, text, wrap, type Look } from './_lib';

export const schema: SceneSchema = {
  description: 'An editorial title card: an accent rule draws in, the big title rises letter by letter on the anchor, then a mono kicker above and a serif subtitle below. Cues may switch the title (chapter cards). For openings, chapters and section breaks.',
  kinds: ['song', 'explainer'],
  lyrics: 'layer',
  entry: {
    title: { type: 'string', description: 'the title' },
    kicker: { type: 'string', default: '', description: 'a short line in small mono capitals above the title, e.g. "Chapter one" (none if empty)' },
    subtitle: { type: 'string', default: '', description: 'a line under the title, in the italic serif (none if empty)' },
  },
  cue: {
    title: { type: 'string', default: '', description: 'a new title from this cue on (a chapter card); empty: keep the current one' },
    kicker: { type: 'string', default: '', description: 'a new kicker from this cue on; empty: keep the current one' },
    subtitle: { type: 'string', default: '', description: 'a new subtitle from this cue on; empty: keep the current one' },
  },
  example: {
    entry: { title: 'Force Push', kicker: 'Chapter one', subtitle: 'A love story in version control' },
    cues: [{}, {}, { title: 'History, rewritten', kicker: 'Chapter two', subtitle: 'What git push --force leaves behind' }],
  },
};

interface P { title: string; kicker: string; subtitle: string }

const X0 = M + 64, MAXW = W - 2 * X0;
const LH = 0.98; // title row pitch (em)
const DROP = 0.35; // s a card takes to leave

interface Card {
  cue: ResolvedCue; title: string; kicker: string; sub: string[];
  lay: KLayout; glyphs: TextLayout[][]; n: number;
  /** First row's baseline, the rule's y, the kicker's and the subtitle's baselines. */
  y: number; ry: number; ky: number; sy: number;
  ruleFrom: number; leave: number;
}

export default class LibTitle extends LibScene<P, P> {
  static schema = schema;
  private cards: Card[] = [];
  private subSize = 46;

  override setup() {
    const fam = this.font('display'), serif = this.font('serif');
    let cur = { title: this.P.title, kicker: this.P.kicker, subtitle: this.P.subtitle };
    for (const cue of this.cues) {
      const p = this.cp(cue);
      const next = { title: p.title || cur.title, kicker: p.kicker || cur.kicker, subtitle: p.subtitle || cur.subtitle };
      const same = this.cards.length && next.title === cur.title && next.kicker === cur.kicker && next.subtitle === cur.subtitle;
      cur = next;
      if (same) continue;
      const title = smart(cur.title.trim()), kicker = smart(cur.kicker.trim());
      const sub = cur.subtitle.trim() ? wrap(smart(cur.subtitle.trim()), serif, this.subSize, Math.min(MAXW, 1300)).slice(0, 2) : [];
      // the title as large as fits (≤ 2 rows) in the space above the lyric area
      const room = this.bottom - M - 40 - (kicker ? 70 : 0) - (sub.length ? 50 + sub.length * this.subSize * 1.2 : 0) - 40;
      const words = title.split(/\s+/).map((w, i) => ({ w, start: 0, end: 0, line: -1, index: i, gi: i }) as Word);
      let lay!: KLayout;
      for (let s = 220; s >= 56; s -= 4) {
        lay = layoutWords(words, fam, s, MAXW, -0.035 * s, 2);
        if (lay.width <= MAXW && lay.rows.length * s * LH <= room) break;
      }
      const z = lay.size, rows = lay.rows.length;
      const h = (kicker ? 70 : 0) + z * 0.74 + (rows - 1) * z * LH + z * 0.36 + (sub.length ? 50 + sub.length * this.subSize * 1.2 : 0);
      const top = Math.max(M, (M + this.bottom) / 2 - h / 2 - 10);
      const y = top + (kicker ? 70 : 0) + z * 0.74, ry = y + (rows - 1) * z * LH + z * 0.3;
      const glyphs = lay.rows.map((r) => r.items.map((it) => layout(it.w.w, fam, z, lay.tracking)));
      const at = cue.at;
      this.cards.push({
        cue, title, kicker, sub, lay, glyphs, n: glyphs.flat().reduce((s, g) => s + g.glyphs.length, 0),
        y, ry, ky: top + 22, sy: ry + 50 + this.subSize * 0.8, ruleFrom: Math.max(at - 2, Math.min(cue.start, at - 0.4)), leave: Infinity,
      });
    }
    this.cards.forEach((c, i) => {
      const next = this.cards[i + 1];
      if (!next) return;
      c.leave = Math.max(c.cue.at + 0.6, next.ruleFrom - 0.2);
      next.ruleFrom = Math.max(next.ruleFrom, c.leave + DROP);
    });
  }

  draw(c: CanvasRenderingContext2D, f: Frame, k: Look) {
    for (const cd of this.cards) if (f.t >= cd.ruleFrom - 0.01 && f.t < cd.leave + DROP + 0.1) this.card(c, f, k, cd);
  }

  private card(c: CanvasRenderingContext2D, f: Frame, k: Look, cd: Card) {
    const t = f.t, { lay, y } = cd, z = lay.size, at = cd.cue.at;
    const out = cd.leave === Infinity ? 0 : prog(t, cd.leave, cd.leave + DROP);

    // the rule: drawn toward the anchor, under the whole title; leaving, it retracts to the right
    const grow = ease.inOutCubic(prog(t, cd.ruleFrom, Math.max(cd.ruleFrom + 0.3, at)));
    const gone = ease.inOutCubic(out);
    const rx0 = X0 + lay.width * gone, rx1 = X0 + lay.width * grow;
    if (rx1 > rx0) { c.fillStyle = k.accent; c.fillRect(rx0, cd.ry - 1.5, rx1 - rx0, 3); }

    // the title, letter by letter out of a mask over each row (and back down when it leaves)
    const step = Math.min(0.028, 0.5 / Math.max(1, cd.n));
    c.save();
    c.font = font(lay.fam, z);
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    c.fillStyle = k.type;
    let j = 0;
    lay.rows.forEach((row, r) => {
      const by = y + r * z * LH;
      c.save();
      c.beginPath(); c.rect(X0 - z * 0.2, by - z * 1.05, MAXW + z * 0.4, z * 1.3); c.clip();
      row.items.forEach((it, wi) => {
        for (const g of cd.glyphs[r]![wi]!.glyphs) {
          const t0 = at - 0.04 + j * step, o0 = cd.leave + j++ * step * 0.5;
          const p = ease.outQuart(prog(t, t0, t0 + 0.6)) - (out > 0 ? ease.inCubic(prog(t, o0, o0 + DROP - 0.1)) : 0);
          if (p <= 0) continue;
          c.fillText(g.ch, X0 + it.x + g.x, by + (1 - p) * z * 1.1);
        }
      });
      c.restore();
    });
    c.restore();

    // kicker and subtitle, after the title
    const fade = 1 - ease.outCubic(clamp(out * 1.6));
    const ka = ease.outCubic(prog(t, at + 0.25, at + 0.65)) * fade;
    if (cd.kicker && ka > 0) {
      c.save(); c.globalAlpha = ka;
      label(c, cd.kicker, X0 + (1 - ka) * 16, cd.ky, this.font('mono'), k.accent, 22);
      c.restore();
    }
    const sa = ease.outCubic(prog(t, at + 0.45, at + 0.9)) * fade;
    if (cd.sub.length && sa > 0) {
      c.save(); c.globalAlpha = sa;
      cd.sub.forEach((s, i) => text(c, s, X0, cd.sy + i * this.subSize * 1.2 + (1 - sa) * 14, this.font('serif'), this.subSize, k.a('type', 0.72)));
      c.restore();
    }
  }
}
