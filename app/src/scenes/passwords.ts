// PASSWORDS — FIG. 6, futility (L12–13). Bone paper, ink.
// Left: an account-security form. The new password is typed a dot at a time through "changed all
// of your passwords", UPDATE is pressed, and the accounts tick CHANGED one per word of "you think
// that sees you through". Right: the archive's record of the intercepted message, unbothered — its
// contents and their shelf life. The credentials row is struck: EXPIRED · IRRELEVANT. On L13 the
// floor plan and the birthday slide out of the record as cards, still under the ciphertext veil,
// and each "true" stamps one STILL TRUE.
import { type Frame } from '../engine/scene';
import { F, font } from '../engine/type';
import type { Line, Word } from '../engine/lyrics';
import { clamp, ease, frameIdx, lerp, prog, pulse } from '../engine/util';
import { C, Plate, W, H, bottomUp, drawKaraoke, hatch, layoutWords, line, mono, stamp, type KLayout } from './_kit';

const FORM = { x: 150, y: 220, w: 640, h: 470 };
const REC = { x: 1130, y: 220, w: 640, h: 470 };
const CARD_A = { x: 150, y: 214, w: 450, h: 490 };
const CARD_B = { x: 640, y: 214, w: 450, h: 490 };
const ACCOUNTS = ['MAIL', 'BANK', 'CLOUD', 'WORK', 'ROUTER'];
const LYR_Y = 975;

export default class Passwords extends Plate {
  L12!: Line; L13!: Line;
  k12!: KLayout; k13!: KLayout;
  tType0 = 0; tType1 = 0; tUpdate = 0; ticks: number[] = []; tStrike = 0;
  wBlue!: Word; wBirth!: Word; trues: Word[] = [];

  override setup() {
    this.L12 = this.line('You changed all');
    this.L13 = this.line('But a blueprint');
    const fam = F.archivo(100, 700);
    this.k12 = layoutWords(this.L12.words, fam, 60, 1720);
    this.k13 = layoutWords(this.L13.words, fam, 60, 1720);
    const w = this.L12.words;
    this.tType0 = w[1]!.start; // changed
    this.tType1 = w[5]!.start + 0.4; // passwords
    this.tUpdate = w[6]!.start; // you
    this.ticks = w.slice(7).map((x) => x.start); // think that sees you through
    this.tStrike = w[w.length - 1]!.start + 0.1;
    const w13 = this.L13.words;
    this.wBlue = w13.find((x) => /blueprint/i.test(x.w))!;
    this.wBirth = w13.find((x) => /birthday/i.test(x.w))!;
    this.trues = w13.filter((x) => /true/i.test(x.w));
  }

  draw(c: CanvasRenderingContext2D, f: Frame) {
    const t = f.t;
    const z = lerp(1.0, 1.03, prog(t, this.ctx.start, this.ctx.end, ease.inOutQuad));
    c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2);

    mono(c, 'FIG. 6', 96, 108, 13, C.glacierInk, { track: 3 });
    mono(c, 'COUNTERMEASURES · AS OBSERVED', 176, 108, 13, C.ink_(0.6), { track: 3 });
    line(c, 96, 126, W - 96, 126, C.ink_(0.25));
    mono(c, `${this.ctr.year(t)}`, W - 96, 108, 13, C.glacierInk, { align: 'right', track: 3 });

    // L12: the form; it leaves to the left as the cards arrive
    const away = prog(t, this.L13.start - 0.3, this.L13.start + 0.4, ease.inCubic);
    if (away < 1) { c.save(); c.translate(-away * 900, 0); c.globalAlpha = 1 - away; this.form(c, t); c.restore(); }
    this.record(c, t);
    if (t >= this.wBlue.start - 0.1) this.card(c, t, 'blue');
    if (t >= this.wBirth.start - 0.1) this.card(c, t, 'birth');

    const st = { sung: C.ink, unsung: C.ink_(0.2), active: C.glacierInk, lift: 4, align: 'center' as const };
    for (const [l, k, nx] of [[this.L12, this.k12, this.L13], [this.L13, this.k13, null]] as const) {
      const until = nx ? nx.start - 0.15 : this.ctx.end + 1;
      const a = clamp(Math.min((t - (l.start - 0.4)) / 0.3, (until - t) / 0.2));
      if (a <= 0) continue;
      c.save(); c.globalAlpha = a;
      drawKaraoke(c, k, t, W / 2, bottomUp(k, LYR_Y), st);
      c.restore();
    }
  }

  private form(c: CanvasRenderingContext2D, t: number) {
    const { x, y, w, h } = FORM;
    const k = prog(t, this.ctx.start, this.ctx.start + 0.6, ease.outCubic);
    c.save();
    c.globalAlpha *= k;
    c.strokeStyle = C.ink; c.lineWidth = 1.5; c.strokeRect(x, y, w, h);
    c.fillStyle = C.ink; c.fillRect(x, y, w, 44);
    mono(c, 'ACCOUNT SECURITY', x + 20, y + 28, 14, C.bone, { track: 4 });
    const field = (label: string, fy: number, dots: number, active: boolean) => {
      mono(c, label, x + 30, fy - 12, 11, C.ink_(0.6), { track: 3 });
      c.strokeStyle = active ? C.glacierInk : C.ink_(0.6); c.lineWidth = active ? 2 : 1.25;
      c.strokeRect(x + 30, fy, w - 60, 46);
      c.fillStyle = C.ink;
      for (let i = 0; i < dots; i++) { c.beginPath(); c.arc(x + 54 + i * 22, fy + 23, 6, 0, Math.PI * 2); c.fill(); }
      if (active && Math.floor(frameIdx(t) / 12) % 2 === 0) c.fillRect(x + 46 + dots * 22, fy + 10, 2, 26);
    };
    const nNew = Math.floor(16 * prog(t, this.tType0, this.tType1));
    const nConf = Math.floor(16 * prog(t, this.tType1 + 0.05, this.tUpdate - 0.05));
    field('CURRENT PASSWORD', y + 96, 9, false);
    field('NEW PASSWORD', y + 186, nNew, t >= this.tType0 && t < this.tType1);
    field('CONFIRM', y + 276, nConf, t >= this.tType1 && t < this.tUpdate);
    // strength meter
    const sm = prog(t, this.tType0, this.tType1);
    mono(c, 'STRENGTH', x + 30, y + 360, 11, C.ink_(0.6), { track: 3 });
    for (let i = 0; i < 5; i++) { c.fillStyle = i < Math.ceil(sm * 5) ? C.ink : C.ink_(0.15); c.fillRect(x + 130 + i * 54, y + 352, 48, 8); }
    if (sm >= 1) mono(c, 'VERY STRONG', x + 420, y + 361, 11, C.glacierInk, { track: 3 });
    // the button
    const pressed = pulse(t, this.tUpdate, 0.12);
    const bx = x + w - 200, by = y + 392;
    c.fillStyle = t >= this.tUpdate ? C.glacierInk : C.ink;
    c.fillRect(bx + pressed * 2, by + pressed * 2, 170, 52);
    mono(c, t >= this.tUpdate ? 'UPDATED' : 'UPDATE', bx + 85 + pressed * 2, by + 32 + pressed * 2, 14, C.bone, { align: 'center', track: 4 });
    // accounts ticking, one per word
    ACCOUNTS.forEach((a, i) => {
      const tt = this.ticks[i] ?? 1e9;
      const on = t >= tt;
      const ax = x + 30 + i * 74, ay = y + 420;
      mono(c, a, ax, ay, 11, on ? C.ink : C.ink_(0.3), { track: 1.5 });
      if (on) mono(c, '✓', ax + 18, ay + 22, 16, C.glacierInk, { track: 0 });
    });
    c.restore();
  }

  /** The archive's record: unchanged by any of it. */
  private record(c: CanvasRenderingContext2D, t: number) {
    const { x, y, w, h } = REC;
    const k = prog(t, this.ctx.start + 0.2, this.ctx.start + 0.8, ease.outCubic);
    c.save();
    c.globalAlpha = k;
    c.strokeStyle = C.ink; c.lineWidth = 1.5; c.strokeRect(x, y, w, h);
    mono(c, 'ARCHIVE · OBJ 000001', x, y - 14, 12, C.ink_(0.7), { track: 3 });
    // the slab thumbnail
    const sx = x + 24, sy = y + 24, sw = 150, sh = 100;
    c.fillStyle = C.ink_(0.05); c.fillRect(sx, sy, sw, sh);
    hatch(c, (q) => q.rect(sx, sy, sw, sh), [sx, sy, sw, sh], 4, -Math.PI / 4, C.glacierInk_(0.8), 1);
    c.strokeStyle = C.glacierInk; c.strokeRect(sx, sy, sw, sh);
    mono(c, 'CIPHERTEXT · 4.2 kB', sx + sw + 20, sy + 20, 12, C.ink, { track: 2 });
    mono(c, 'RETAINED 2021-03-09', sx + sw + 20, sy + 44, 12, C.ink_(0.6), { track: 2 });
    const status = t >= this.ticks[2]! ? 'STATUS · UNAFFECTED' : 'STATUS · RETAINED';
    mono(c, status, sx + sw + 20, sy + 68, 12, t >= this.ticks[2]! ? C.glacierInk : C.ink_(0.6), { track: 2 });
    // contents and shelf life
    const ty = y + 180;
    mono(c, 'CONTENTS (ESTIMATED)', x + 24, ty, 11, C.ink_(0.55), { track: 3 });
    mono(c, 'SHELF LIFE', x + w - 24, ty, 11, C.ink_(0.55), { align: 'right', track: 3 });
    line(c, x + 24, ty + 12, x + w - 24, ty + 12, C.ink_(0.4));
    const rows: [string, string][] = [['credentials', '90 days'], ['floor plan, rev C', 'decades'], ['date of birth', 'lifetime']];
    rows.forEach(([a, b], i) => {
      const ry = ty + 56 + i * 58;
      c.font = font(F.mono(400), 20); c.fillStyle = C.ink; c.textAlign = 'left'; c.letterSpacing = '0px';
      c.fillText(a, x + 24, ry);
      c.textAlign = 'right'; c.fillText(b, x + w - 24, ry);
      c.setLineDash([2, 5]); line(c, x + 24 + c.measureText(a).width + 14, ry - 6, x + w - 24 - c.measureText(b).width - 14, ry - 6, C.ink_(0.35)); c.setLineDash([]);
      // the credentials row expires: struck, annotated
      if (i === 0) {
        const s = prog(t, this.tStrike, this.tStrike + 0.3, ease.inOutCubic);
        if (s > 0) {
          line(c, x + 20, ry - 7, lerp(x + 20, x + w - 20, s), ry - 7, C.ink, 2);
          if (s >= 1) mono(c, 'EXPIRED · IRRELEVANT', x + w - 24, ry + 24, 11, C.glacierInk, { align: 'right', track: 3 });
        }
      }
      // the rows that leave as cards are lit as they go
      const leave = i === 1 ? this.wBlue.start : i === 2 ? this.wBirth.start : 1e9;
      const lit = pulse(t, leave, 0.4);
      if (lit > 0.02) { c.fillStyle = C.glacierInk_(0.15 * lit); c.fillRect(x + 14, ry - 30, w - 28, 44); }
    });
    c.restore();
  }

  /** A card pulled from the record: the content, still under the ciphertext veil, and its STILL TRUE stamp. */
  private card(c: CanvasRenderingContext2D, t: number, which: 'blue' | 'birth') {
    const wd = which === 'blue' ? this.wBlue : this.wBirth;
    const dst = which === 'blue' ? CARD_A : CARD_B;
    const k = prog(t, wd.start - 0.1, wd.start + 0.55, ease.outCubic);
    const x = lerp(REC.x + 20, dst.x, k), y = lerp(REC.y + 230 + (which === 'blue' ? 58 : 116), dst.y, k);
    const w = lerp(REC.w - 40, dst.w, k), h = lerp(44, dst.h, k);
    c.save();
    c.fillStyle = C.bone; c.fillRect(x, y, w, h);
    c.strokeStyle = C.ink; c.lineWidth = 1.5; c.strokeRect(x, y, w, h);
    c.beginPath(); c.rect(x, y, w, h); c.clip();
    const ia = clamp((k - 0.4) / 0.6);
    c.globalAlpha = ia;
    // (the drawing only exists once the card is big enough to hold it)
    if (which === 'blue') { if (h > 260) this.plan(c, x + 30, y + 70, w - 60, h - 190); }
    else {
      c.font = font(F.archivo(100, 900), 150); c.fillStyle = C.ink; c.textAlign = 'center'; c.letterSpacing = '-4px';
      c.fillText('14·03', x + w / 2, y + 250);
      mono(c, '(ALSO: THE DOOR CODE)', x + w / 2, y + 296, 12, C.ink_(0.6), { align: 'center', track: 2.5 });
    }
    // the veil: the content is still ciphertext
    hatch(c, (q) => q.rect(x + 16, y + 52, w - 32, h - 170), [x + 16, y + 52, w - 32, h - 170], 5, -Math.PI / 4, C.glacierInk_(0.38), 1);
    mono(c, which === 'blue' ? 'FLOOR PLAN · REV C · BASEMENT' : 'DATE OF BIRTH · M.', x + 20, y + 32, 12, C.ink, { track: 2.5 });
    line(c, x + 16, y + h - 104, x + w - 16, y + h - 104, C.ink_(0.4));
    mono(c, 'SHELF LIFE', x + 20, y + h - 70, 11, C.ink_(0.55), { track: 3 });
    mono(c, which === 'blue' ? 'DECADES' : 'LIFETIME', x + 20, y + h - 40, 22, C.ink, { track: 3 });
    c.restore();
    // STILL TRUE, one per "true"
    const tw = this.trues[which === 'blue' ? 0 : 1];
    if (tw && t >= tw.start - 0.02) {
      const sk = prog(t, tw.start - 0.02, tw.start + 0.5);
      stamp(c, 'STILL TRUE', dst.x + dst.w / 2 + 10, dst.y + dst.h - 136, 40, which === 'blue' ? -0.12 : 0.08, C.glacierInk, sk, which === 'blue' ? 61 : 67, { ink: 0.8 });
    }
  }

  /** A small floor plan: rooms, doors as arcs, a dimension. */
  private plan(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    c.save();
    c.strokeStyle = C.ink; c.lineWidth = 3;
    c.strokeRect(x, y, w, h);
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x + w * 0.55, y); c.lineTo(x + w * 0.55, y + h * 0.45);
    c.moveTo(x + w * 0.55, y + h * 0.62); c.lineTo(x + w * 0.55, y + h);
    c.moveTo(x, y + h * 0.55); c.lineTo(x + w * 0.3, y + h * 0.55);
    c.moveTo(x + w * 0.42, y + h * 0.55); c.lineTo(x + w * 0.55, y + h * 0.55);
    c.stroke();
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x + w * 0.55, y + h * 0.45); c.arc(x + w * 0.55, y + h * 0.45, h * 0.17, Math.PI / 2, Math.PI, false);
    c.moveTo(x + w * 0.3, y + h * 0.55); c.arc(x + w * 0.3, y + h * 0.55, w * 0.12, 0, -Math.PI / 2, true);
    c.stroke();
    // stairs
    for (let i = 0; i < 7; i++) line(c, x + w * 0.7, y + h * (0.1 + i * 0.05), x + w * 0.95, y + h * (0.1 + i * 0.05), C.ink, 1);
    mono(c, 'STORE', x + w * 0.12, y + h * 0.3, 11, C.ink_(0.7), { track: 2 });
    mono(c, 'PLANT', x + w * 0.12, y + h * 0.8, 11, C.ink_(0.7), { track: 2 });
    mono(c, 'UP', x + w * 0.78, y + h * 0.5, 11, C.ink_(0.7), { track: 2 });
    c.restore();
  }

  override post(f: Frame) {
    let hit = 0;
    for (const w of this.trues) hit = Math.max(hit, pulse(f.t, w.start, 0.1));
    return { bloom: 0.15, vignette: 0.25, paper: 1, grain: 0.045, zoom: 1 + 0.012 * hit };
  }
  override ground(_f: Frame, out: import('three').WebGLRenderTarget) {
    this.bg.render(this.ctx.renderer, out, { paper: 1, grid: 0.14, gridStep: 40, seed: 9.4 });
  }
}
