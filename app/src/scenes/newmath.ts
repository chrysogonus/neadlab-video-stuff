// NEWMATH — FIG. 7, the offer (L14–15). Back on ink.
// On "handed" a sheet is handed across the frame: a post-quantum lattice, drawn as real geometry —
// the points ripple in on "new math", a short basis (glacier) and a long, skewed one (bone),
// and a target point whose closest lattice vector is the hard problem. On L15 the lyric's promise
// becomes a backlog ticket that slides in from the right and parks: PRIORITY LOW (the bridge's
// ticket, foreshadowed). LATER is stamped on it on "that".
import { type Frame } from '../engine/scene';
import { F, font } from '../engine/type';
import type { Line } from '../engine/lyrics';
import { clamp, ease, lerp, prog, pulse } from '../engine/util';
import { C, Plate, W, MONO_M, bottomUp, drawKaraoke, layoutWords, line, mixC, mono, stamp, type KLayout } from './_kit';

const SHEET = { x: 170, y: 190, w: 920, h: 560 };
const TICKET = { x: 1210, y: 300, w: 540, h: 360 };
const B1 = { x: 58, y: 12 }, B2 = { x: 20, y: 54 }; // short basis
const LB1 = { x: B1.x * 3 + B2.x * 2, y: B1.y * 3 + B2.y * 2 }, LB2 = { x: B1.x * 4 + B2.x * 3, y: B1.y * 4 + B2.y * 3 }; // long basis of the same lattice
const LYR_Y = 975;

export default class NewMath extends Plate {
  L14!: Line; L15!: Line;
  k14!: KLayout; k15!: KLayout;
  tHand = 0; tNew = 0; tSaid = 0; tThat = 0;
  pts: { x: number; y: number; d: number }[] = [];

  override setup() {
    this.L14 = this.line('They handed you');
    this.L15 = this.line("get around to that");
    const fam = F.archivo(100, 700);
    this.k14 = layoutWords(this.L14.words, fam, 64, 1720);
    this.k15 = layoutWords(this.L15.words, fam, 64, 1720);
    this.tHand = this.L14.words[1]!.start;
    this.tNew = this.L14.words.find((w) => /new/i.test(w.w))!.start;
    this.tSaid = this.L15.words[1]!.start;
    this.tThat = this.L15.words[this.L15.words.length - 1]!.start;
    // lattice points inside the sheet's drawing area, relative to its centre
    const hw = SHEET.w / 2 - 40, hh = SHEET.h / 2 - 70;
    for (let i = -20; i <= 20; i++) for (let j = -20; j <= 20; j++) {
      const x = i * B1.x + j * B2.x, y = i * B1.y + j * B2.y;
      if (Math.abs(x) < hw && Math.abs(y) < hh) this.pts.push({ x, y, d: Math.hypot(x, y) });
    }
  }

  draw(c: CanvasRenderingContext2D, f: Frame) {
    const t = f.t;
    mono(c, 'FIG. 7', 96, 108, 13, C.glacier, { track: 3 });
    mono(c, 'THE OFFER · A LATTICE PROBLEM', 176, 108, 13, C.bone_(0.55), { track: 3 });
    line(c, 96, 126, W - 96, 126, C.bone_(0.2));
    mono(c, `${this.ctr.year(t)}`, W - 96, 108, 13, C.glacier, { align: 'right', track: 3 });

    // the sheet, handed in from the right
    const hk = prog(t, this.tHand - 0.15, this.tHand + 0.55, ease.outCubic);
    const sx = lerp(W + 40, SHEET.x, hk) - prog(t, this.tSaid - 0.2, this.tSaid + 0.4, ease.inOutCubic) * 60;
    const rot = lerp(0.06, 0, hk);
    if (hk > 0) {
      c.save();
      c.translate(sx + SHEET.w / 2, SHEET.y + SHEET.h / 2); c.rotate(rot);
      this.sheet(c, t);
      c.restore();
    }
    // the ticket
    const tk = prog(t, this.tSaid - 0.1, this.tSaid + 0.6, ease.outCubic);
    if (tk > 0) {
      const park = prog(t, this.tThat - 0.1, this.tThat + 0.2, ease.outBack);
      c.save();
      c.translate(lerp(W + 60, TICKET.x, tk) + TICKET.w / 2, TICKET.y + TICKET.h / 2); c.rotate(lerp(0.08, -0.03, park));
      this.ticket(c, t);
      c.restore();
    }

    const st = { sung: C.bone, unsung: C.bone_(0.22), active: C.glacier, lift: 4, align: 'center' as const };
    for (const [l, k, nx] of [[this.L14, this.k14, this.L15], [this.L15, this.k15, null]] as const) {
      const until = nx ? nx.start - 0.15 : this.ctx.end + 1;
      const a = clamp(Math.min((t - (l.start - 0.4)) / 0.3, (until - t) / 0.2));
      if (a <= 0) continue;
      c.save(); c.globalAlpha = a;
      drawKaraoke(c, k, t, W / 2, bottomUp(k, LYR_Y), st);
      c.restore();
    }
  }

  /** The handed sheet, drawn about its centre. */
  private sheet(c: CanvasRenderingContext2D, t: number) {
    const { w, h } = SHEET;
    c.fillStyle = C.ink2; c.fillRect(-w / 2, -h / 2, w, h);
    c.strokeStyle = C.bone_(0.8); c.lineWidth = 1.25; c.strokeRect(-w / 2, -h / 2, w, h);
    mono(c, 'ML-KEM · MODULE LATTICE · FIPS 203 (2024)', -w / 2 + 24, -h / 2 + 34, 12, C.bone_(0.75), { track: 2.5 });
    mono(c, 'RECOMMENDED: MIGRATE NOW', w / 2 - 24, -h / 2 + 34, 12, C.glacier, { align: 'right', track: 2.5 });
    const cy = 20;
    // the points ripple in from the origin on "new math"
    const r = (t - this.tNew + 0.1) * 900;
    for (const p of this.pts) {
      const k = clamp((r - p.d) / 120);
      if (k <= 0) continue;
      const fresh = clamp(1 - (r - p.d) / 240);
      c.fillStyle = mixC(C.bone_(0.75 * k), C.glacier_(0.75 * k), fresh);
      c.beginPath(); c.arc(p.x, p.y + cy, 2.6, 0, Math.PI * 2); c.fill();
    }
    const kb = prog(t, this.tNew + 0.25, this.tNew + 0.75, ease.outCubic);
    if (kb > 0) {
      // the long basis: valid, useless
      arrow(c, 0, cy, LB1.x * kb, cy + LB1.y * kb, C.bone_(0.55), 1.25, true);
      arrow(c, 0, cy, LB2.x * kb, cy + LB2.y * kb, C.bone_(0.55), 1.25, true);
      // the short basis: the trapdoor
      arrow(c, 0, cy, B1.x * kb, cy + B1.y * kb, C.glacier, 2.5, false);
      arrow(c, 0, cy, B2.x * kb, cy + B2.y * kb, C.glacier, 2.5, false);
      c.globalAlpha = kb;
      mono(c, 'b₁', B1.x + 8, cy + B1.y + 4, 13, C.glacier, { track: 0 });
      mono(c, 'b₂', B2.x - 26, cy + B2.y + 16, 13, C.glacier, { track: 0 });
      c.globalAlpha = 1;
    }
    // the hard problem: a target off the lattice and its closest vector
    const kt = prog(t, this.tNew + 0.6, this.tNew + 1.1, ease.outCubic);
    if (kt > 0) {
      const tx = -300, ty = cy - 140;
      const nx = -5 * B1.x - 2 * B2.x, ny = cy - 5 * B1.y - 2 * B2.y;
      c.globalAlpha = kt;
      c.strokeStyle = C.bone; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(tx - 8, ty - 8); c.lineTo(tx + 8, ty + 8); c.moveTo(tx + 8, ty - 8); c.lineTo(tx - 8, ty + 8); c.stroke();
      c.setLineDash([3, 4]); line(c, tx, ty, nx, ny, C.bone_(0.7)); c.setLineDash([]);
      c.strokeStyle = C.glacier; c.beginPath(); c.arc(nx, ny, 9, 0, Math.PI * 2); c.stroke();
      c.fillStyle = C.ink2; c.fillRect(tx + 12, ty - 40, 240, 44);
      mono(c, 'CLOSEST VECTOR: HARD', tx + 20, ty - 22, 12, C.bone_(0.85), { track: 2.5 });
      mono(c, '(EVEN FOR THEM)', tx + 20, ty - 4, 11, C.bone_(0.5), { track: 2.5 });
      c.globalAlpha = 1;
    }
  }

  /** The backlog ticket, drawn about its centre. */
  private ticket(c: CanvasRenderingContext2D, t: number) {
    const { w, h } = TICKET;
    c.fillStyle = C.bone; c.fillRect(-w / 2, -h / 2, w, h);
    c.fillStyle = C.ink; c.fillRect(-w / 2, -h / 2, w, 46);
    mono(c, 'BACKLOG · SEC-4471', -w / 2 + 20, -h / 2 + 30, 14, C.bone, { track: 3 });
    const row = (k: string, v: string, y: number, col = C.ink) => {
      mono(c, k, -w / 2 + 24, y, 11, C.ink_(0.55), { track: 3 });
      c.font = font(MONO_M, 20); c.fillStyle = col; c.textAlign = 'left'; c.letterSpacing = '0.5px';
      c.fillText(v, -w / 2 + 170, y + 2);
    };
    row('SUMMARY', 'Migrate to post-quantum KEM', -h / 2 + 100);
    row('PRIORITY', 'Low', -h / 2 + 150, C.glacierInk);
    row('ASSIGNEE', 'You', -h / 2 + 200);
    row('DUE', 'Q3 2031', -h / 2 + 250);
    row('STATUS', 'Will get around to it', -h / 2 + 300);
    const sk = prog(t, this.tThat - 0.02, this.tThat + 0.5);
    if (sk > 0) stamp(c, 'LATER', w / 2 - 110, -h / 2 + 238, 46, -0.14, C.glacierInk, sk, 83, { ink: 0.8 });
  }

  override post(f: Frame) {
    const hit = pulse(f.t, this.tThat, 0.1);
    return { bloom: 0.3, vignette: 0.45, zoom: 1 + 0.004 * f.a.kick + 0.01 * hit };
  }
  override ground(_f: Frame, out: import('three').WebGLRenderTarget) {
    this.bg.render(this.ctx.renderer, out, { grid: 0.3, gridStep: 48, seed: 10.1 });
  }
}

function arrow(c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, col: string, lw: number, dashed: boolean) {
  const len = Math.hypot(x1 - x0, y1 - y0);
  if (len < 2) return;
  c.save();
  c.strokeStyle = col; c.fillStyle = col; c.lineWidth = lw;
  if (dashed) c.setLineDash([6, 5]);
  c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
  c.setLineDash([]);
  const a = Math.atan2(y1 - y0, x1 - x0), s = 6 + lw * 2;
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - Math.cos(a - 0.35) * s, y1 - Math.sin(a - 0.35) * s); c.lineTo(x1 - Math.cos(a + 0.35) * s, y1 - Math.sin(a + 0.35) * s); c.fill();
  c.restore();
}
