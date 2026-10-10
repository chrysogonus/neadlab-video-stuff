// KEEP — FIG. 3, the thesis (L4–5). The quietest plate: vast black, Swiss type.
// "I don't have to" small, then BREAK set enormous; on the held "you" a bar strikes BREAK through.
// "I only have to" replaces the small line, and on "keep" KEEP is stamped over BREAK in glacier,
// slightly rotated, inked unevenly. Two deadpan footnotes; the counters very small.
import { type Frame } from '../engine/scene';
import { F, font, measure } from '../engine/type';
import { Lyrics, type Line, type Word } from '../engine/lyrics';
import { clamp, ease, lerp, prog, pulse } from '../engine/util';
import { C, Plate, W, H, drawKaraoke, fmtBytes, layoutWords, line, lineAlpha, mixC, mono, stamp, type KLayout } from './_kit';

const X = 150;
const BIG = 300; // BREAK / KEEP size
const ROW_SMALL = 340, ROW_BIG = 660;
const FAM_BIG = F.archivo(125, 900);
const FAM_YOU = F.archivo(100, 300);

export default class Keep extends Plate {
  L4!: Line; L5!: Line;
  k4!: KLayout; k5!: KLayout;
  wBreak!: Word; wYou4!: Word; wKeep!: Word; wYou5!: Word;
  bw = 0;

  override setup() {
    this.L4 = this.line("I don't have to break");
    this.L5 = this.line('I only have to keep');
    const fam = F.archivo(100, 500);
    const w4 = this.L4.words, w5 = this.L5.words;
    this.wBreak = w4.find((w) => /break/i.test(w.w))!;
    this.wYou4 = w4[w4.length - 1]!;
    this.wKeep = w5.find((w) => /keep/i.test(w.w))!;
    this.wYou5 = w5[w5.length - 1]!;
    // the small line: the words before break / keep
    this.k4 = layoutWords(w4.slice(0, w4.indexOf(this.wBreak)), fam, 64);
    this.k5 = layoutWords(w5.slice(0, w5.indexOf(this.wKeep)), fam, 64);
    this.bw = measure('BREAK', FAM_BIG, BIG, -6);
  }

  draw(c: CanvasRenderingContext2D, f: Frame) {
    const t = f.t;
    const z = lerp(1.0, 1.07, prog(t, this.ctx.start, this.ctx.end, ease.inOutQuad));
    c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2);

    mono(c, 'FIG. 3', X, 150, 13, C.glacier, { track: 3 });
    mono(c, 'METHOD', X + 80, 150, 13, C.bone_(0.5), { track: 3 });
    const rule = prog(t, this.ctx.start, this.ctx.start + 1.2, ease.outCubic);
    line(c, X, 168, X + (W - 2 * X) * rule, 168, C.bone_(0.2));

    const st = { sung: C.bone, unsung: C.bone_(0.2), active: C.glacier, lift: 3 };
    // small line: L4's, then L5's
    const swap = prog(t, this.L5.start - 0.45, this.L5.start - 0.1, ease.inOutCubic);
    c.save();
    c.globalAlpha = lineAlpha(this.L4, t, 99) * (1 - swap);
    drawKaraoke(c, this.k4, t, X, ROW_SMALL - swap * 20, st);
    c.restore();
    c.save();
    c.globalAlpha = swap;
    drawKaraoke(c, this.k5, t, X, ROW_SMALL + (1 - swap) * 20, st);
    c.restore();

    // BREAK: dim until sung, wiped in bone
    // BREAK (and its strike) recede once KEEP is stamped over them
    const bA = lineAlpha(this.L4, t, 99) * lerp(1, 0.45, prog(t, this.wKeep.start, this.wKeep.start + 0.4));
    c.save();
    c.globalAlpha = bA;
    const p = Lyrics.wordProgress(this.wBreak, t);
    c.font = font(FAM_BIG, BIG); c.letterSpacing = '-6px'; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
    c.fillStyle = C.bone_(0.1); c.fillText('BREAK', X - 8, ROW_BIG);
    if (p > 0) {
      c.save();
      c.beginPath(); c.rect(X - 20, ROW_BIG - BIG, 20 + this.bw * p, BIG * 1.2); c.clip();
      // once struck through, BREAK cools to graphite: it is not the method
      const struck = prog(t, this.wYou4.start, this.wYou4.start + 0.5);
      c.fillStyle = mixC(C.bone, C.graphite, struck);
      c.fillText('BREAK', X - 8, ROW_BIG);
      c.restore();
    }
    c.restore();
    // "you" after BREAK, light weight; lit again on L5's "you"
    const yx = X - 8 + this.bw + 34;
    c.save();
    c.font = font(FAM_YOU, 120); c.textBaseline = 'alphabetic';
    const y4 = Lyrics.wordProgress(this.wYou4, t), y5 = Lyrics.wordProgress(this.wYou5, t);
    c.fillStyle = C.bone_(0.12 * bA); c.fillText('you', yx, ROW_BIG);
    if (y4 > 0) {
      const glow = Math.max(pulse(t, this.wYou5.start, 0.6) * (y5 > 0 ? 1 : 0), y5 > 0 && y5 < 1 ? 1 : 0);
      c.fillStyle = mixC(C.bone, C.glacier, glow);
      c.save(); c.beginPath(); c.rect(yx - 10, ROW_BIG - 140, 10 + measure('you', FAM_YOU, 120) * clamp(y4), 180); c.clip();
      c.fillText('you', yx, ROW_BIG);
      c.restore();
    }
    c.restore();

    // the strike: a bar drawn through BREAK on the held "you"
    const sp = prog(t, this.wYou4.start, this.wYou4.start + 0.35, ease.inOutCubic);
    if (sp > 0) {
      c.save();
      c.globalAlpha = bA;
      c.fillStyle = C.bone;
      c.translate(X - 30, ROW_BIG - BIG * 0.36);
      c.rotate(-0.025);
      c.fillRect(0, -7, (this.bw + 60) * sp, 14);
      c.restore();
      mono(c, '¹ NOT REQUIRED', X, ROW_BIG + 90, 13, C.bone_(0.45 * clamp((t - this.wYou4.start - 0.3) * 3)), { track: 3 });
    }

    // KEEP: stamped over BREAK on "keep"
    const k = prog(t, this.wKeep.start - 0.03, this.wKeep.start + 0.9);
    if (k > 0) {
      stamp(c, 'KEEP', X + this.bw * 0.5, ROW_BIG - BIG * 0.36, BIG * 0.92, -0.06, C.glacier, k, 41, { ink: 0.82, fam: FAM_BIG, frame: false });
      mono(c, '² SUFFICIENT', X + 330, ROW_BIG + 90, 13, C.glacier_(clamp((t - this.wKeep.start - 0.4) * 3)), { track: 3 });
    }

    // counters, very small, bottom right
    mono(c, `${this.ctr.year(t)} · ARCHIVE ${fmtBytes(this.ctr.bytes(t))}`, W - X, H - 120, 12, C.bone_(0.45), { align: 'right', track: 3 });
  }

  override post(f: Frame) {
    const hit = pulse(f.t, this.wKeep.start, 0.1);
    return { bloom: 0.25, vignette: 0.5, zoom: 1 + 0.018 * hit, shake: [hit * 3, hit * -2] as [number, number] };
  }
  override ground(_f: Frame, out: import('three').WebGLRenderTarget) {
    this.bg.render(this.ctx.renderer, out, { grid: 0, seed: 3.7, light: 0.6 });
  }
}
