// SEND — FIG. 1, the message leaves (intro + L0–1).
// Opens on the closed padlock inside the crop-mark frame ("CONNECTION SECURE": the last frame of
// `secure` matches it). On the verse's first downbeat the frame flies out and the padlock shrinks
// into the header of a protocol sequence diagram and opens. L0 draws the handshake, one arrow per
// word; on "padlock" it closes; on "said the hard part was done" the plaintext letter turns to
// ciphertext and collapses into a hatched slab, which crosses the wire past a quiet tap (TAP·07).
// Both lines are written by a plotter pen under the diagram.
import { type Frame } from '../engine/scene';
import { F, font } from '../engine/type';
import { strokeText, writtenLength, type StrokeText } from '../engine/stroke';
import type { Line } from '../engine/lyrics';
import { clamp, ease, lerp, prog, pulse, smoothstep } from '../engine/util';
import { BOOKEND, C, Plate, W, H, MONO, bookendLock, bookendRing, charTimes, cipher, hatch, hexStr, line, lineP, mixC, mono, padlock, penWrite, fmtBytes } from './_kit';

const A = 560, B = 1360; // lifelines
const HEAD_Y = 214; // header row (padlock between the two boxes)
const ARROW_Y0 = 318, ARROW_DY = 50;
const DATA_Y = 640; // the application-data arrow the slab rides
const TAP_X = 960;
const LETTER = [
  're: the house',
  '',
  'Plans attached (rev C, the',
  'basement one). Door code',
  'is my birthday, 14 03.',
  '',
  'Delete after reading.',
  '                     — M',
];
const HANDSHAKE: [string, 1 | -1][] = [
  ['CLIENT HELLO', 1], ['SERVER HELLO', -1], ['CERTIFICATE', -1], ['CERT VERIFY', -1], ['FINISHED', -1], ['FINISHED', 1],
];

export default class Send extends Plate {
  L0!: Line; L1!: Line;
  s0!: StrokeText; s1!: StrokeText;
  ct0: [number, number][] = []; ct1: [number, number][] = [];
  tVerse = 7.69; // first downbeat of the verse (frame flies out)
  tLock = 0; tSaid = 0; tDone = 0;

  override setup() {
    this.L0 = this.line('You sent it on a Tuesday');
    this.L1 = this.line('A little green padlock');
    this.s0 = strokeText(this.L0.text, 'readable', 64, 1.5);
    this.s1 = strokeText(this.L1.text, 'readable', 64, 1.5);
    this.ct0 = charTimes(this.L0); this.ct1 = charTimes(this.L1);
    this.tVerse = this.downAt(this.L0.start);
    const w = this.L1.words;
    this.tLock = w.find((x) => /padlock/i.test(x.w))!.start + 0.1;
    this.tSaid = w.find((x) => /said/i.test(x.w))!.start;
    this.tDone = w.find((x) => /done/i.test(x.w))!.start;
  }

  draw(c: CanvasRenderingContext2D, f: Frame) {
    const t = f.t;
    const tv = this.tVerse;
    const intro = 1 - prog(t, tv - 0.05, tv + 0.75, ease.inOutCubic); // 1 = the bookend padlock
    // slow push over the whole plate
    const z = lerp(1.0, 1.035, prog(t, tv, this.ctx.end, ease.inOutQuad)) * lerp(1, 1.06, intro * prog(t, 0, tv, ease.outQuad));
    c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2);

    // ---------------- the bookend: padlock in a rotating index ring
    const lockS = lerp(92, BOOKEND.s, intro), lockX = BOOKEND.x, lockY = lerp(HEAD_Y + 4, BOOKEND.y, intro);
    if (intro > 0.001) {
      c.save();
      c.globalAlpha = intro;
      bookendRing(c, Math.floor(f.beat), t * 0.02);
      c.restore();
    }

    // ---------------- the sequence diagram
    const dg = prog(t, tv + 0.15, tv + 1.2, ease.outCubic); // draw-in
    if (dg > 0) {
      c.save();
      const ink = C.bone_(0.82), dim = C.bone_(0.3);
      mono(c, 'FIG. 1', 96, 118, 13, C.glacier, { track: 3 });
      mono(c, 'TRANSMISSION · TLS 1.3 · AS SEEN ON THE WIRE', 176, 118, 13, C.bone_(0.55), { track: 3 });
      line(c, 96, 136, lerp(96, W - 96, dg), 136, C.bone_(0.22));
      // header boxes
      for (const [x, name, sub] of [[A, 'A', 'SENDER'], [B, 'B', 'RECIPIENT']] as const) {
        c.globalAlpha = dg;
        c.strokeStyle = ink; c.lineWidth = 1.25;
        c.strokeRect(x - 92, HEAD_Y - 32, 184, 64);
        c.font = font(F.archivo(100, 700), 30); c.fillStyle = C.bone; c.textAlign = 'center';
        c.fillText(name, x - 52, HEAD_Y + 11);
        mono(c, sub, x + 18, HEAD_Y + 6, 12, C.bone_(0.6), { align: 'center', track: 3 });
        c.globalAlpha = 1;
        // lifeline (dashed)
        c.save();
        c.setLineDash([2, 6]); c.strokeStyle = dim; c.lineWidth = 1;
        c.beginPath(); c.moveTo(x, HEAD_Y + 32); c.lineTo(x, lerp(HEAD_Y + 32, 740, dg)); c.stroke();
        c.restore();
      }
      // header wire through the padlock
      lineP(c, A + 92, HEAD_Y, lockX - 70, HEAD_Y, dg, dim);
      lineP(c, B - 92, HEAD_Y, lockX + 70, HEAD_Y, dg, dim);

      // handshake arrows, one per word of L0 (the last two words date the session)
      const w0 = this.L0.words;
      HANDSHAKE.forEach(([label, dir], i) => {
        const w = w0[i];
        if (!w) return;
        const p = prog(t, w.start - 0.02, w.start + 0.32, ease.outCubic);
        if (p <= 0) return;
        const y = ARROW_Y0 + i * ARROW_DY;
        const x0 = dir > 0 ? A : B, x1 = dir > 0 ? B : A;
        const y1 = y + 16;
        const fresh = pulse(t, w.start, 0.25);
        const col = fresh > 0.05 ? mixC(C.bone_(0.8), C.glacier, fresh) : C.bone_(0.7);
        lineP(c, x0, y, x1, y1, p, col, 1.25);
        if (p >= 1) {
          const ang = Math.atan2(y1 - y, x1 - x0);
          c.fillStyle = col;
          c.beginPath();
          c.moveTo(x1, y1);
          c.lineTo(x1 - Math.cos(ang - 0.28) * 12, y1 - Math.sin(ang - 0.28) * 12);
          c.lineTo(x1 - Math.cos(ang + 0.28) * 12, y1 - Math.sin(ang + 0.28) * 12);
          c.fill();
        }
        c.save();
        c.globalAlpha = clamp(p * 1.4);
        mono(c, label, 960, y - 10, 12, C.bone_(0.7), { align: 'center', track: 3 });
        mono(c, String(i + 1).padStart(2, '0'), dir > 0 ? A - 24 : B + 24, y + 5, 11, C.bone_(0.35), { align: 'center', track: 1 });
        c.restore();
      });
      // the date, stamped by "twenty twenty-one"
      const wY = w0[w0.length - 2], wY2 = w0[w0.length - 1];
      if (wY && t >= wY.start) {
        const s = t >= wY2!.start ? 'TUE 09 MAR 2021 · 09:41' : 'TUE 09 MAR 20';
        mono(c, s, W - 96, 118, 13, C.glacier, { align: 'right', track: 3 });
      }

      // application data: the slab rides this arrow on "done"
      const pData = prog(t, this.tSaid, this.tSaid + 0.6, ease.outCubic);
      if (pData > 0) {
        c.save(); c.setLineDash([]);
        lineP(c, A, DATA_Y, B, DATA_Y, pData, C.bone_(0.75), 1.25);
        if (pData >= 1) {
          c.fillStyle = C.bone_(0.75);
          c.beginPath(); c.moveTo(B, DATA_Y); c.lineTo(B - 12, DATA_Y - 4); c.lineTo(B - 12, DATA_Y + 4); c.fill();
        }
        mono(c, 'APPLICATION DATA', 960 + 140, DATA_Y - 12, 12, C.bone_(0.7), { align: 'left', track: 3 });
        c.restore();
        // the tap: quiet, cold, patient
        const pt = prog(t, this.tSaid + 0.4, this.tSaid + 1.0, ease.outCubic);
        if (pt > 0) {
          c.save();
          c.globalAlpha = pt;
          c.setLineDash([3, 5]); c.strokeStyle = C.glacier_(0.7); c.lineWidth = 1;
          c.beginPath(); c.moveTo(TAP_X, DATA_Y); c.lineTo(TAP_X, lerp(DATA_Y, 760, pt)); c.stroke();
          c.setLineDash([]);
          c.fillStyle = C.glacier;
          c.beginPath(); c.arc(TAP_X, DATA_Y, 4, 0, Math.PI * 2); c.fill();
          mono(c, 'TAP·07', TAP_X + 12, 760, 12, C.glacier, { track: 3 });
          c.restore();
        }
      }

      // the plaintext letter (left), turning to ciphertext and collapsing into the slab
      this.letter(c, t);
      // the wire, as a hex dump (right): one record per handshake message, then the data
      this.dump(c, t);
      c.restore();
    }

    // ---------------- the padlock (bookend → header)
    {
      const closeT = this.tLock;
      const open = intro > 0 ? lerp(prog(t, tv + 0.35, tv + 0.9, ease.outCubic), 0, intro) : 1 - prog(t, closeT - 0.08, closeT + 0.06, ease.inCubic);
      const closed = t >= closeT;
      const hit = pulse(t, closeT, 0.18);
      const s = lockS * (1 + 0.12 * hit);
      if (closed) padlock(c, lockX, lockY, s, open, C.glacier, { hatch: C.glacier_(0.55), fill: C.ink, keyhole: C.glacier });
      else bookendLock(c, lockX, lockY, s, open);
      if (hit > 0.02) {
        c.save();
        c.strokeStyle = C.glacier_(hit * 0.8); c.lineWidth = 1.5;
        c.beginPath(); c.arc(lockX, lockY, s * (0.9 + (1 - hit) * 1.4), 0, Math.PI * 2); c.stroke();
        c.restore();
      }
    }

    // ---------------- the lyric, written by the pen
    const pen0 = writtenLength(this.s0, this.ct0, t), pen1 = writtenLength(this.s1, this.ct1, t);
    const g0 = clamp((t - (this.L0.start - 0.45)) / 0.4), g1 = clamp((t - (this.L1.start - 0.45)) / 0.4);
    if (g0 > 0) {
      c.globalAlpha = g0;
      penWrite(c, this.s0, pen0, 150, 878, { ink: C.bone, ghost: C.bone_(0.13), lw: 2.6, head: C.glacier, headR: 5 });
    }
    if (g1 > 0) {
      c.globalAlpha = g1;
      penWrite(c, this.s1, pen1, 150, 972, { ink: C.bone, ghost: C.bone_(0.13), lw: 2.6, head: C.glacier, headR: 5 });
    }
    c.globalAlpha = 1;

    // ---------------- the counters, bottom right
    if (dg > 0) {
      c.globalAlpha = dg;
      mono(c, 'ARCHIVE', W - 96, H - 104, 11, C.bone_(0.4), { align: 'right', track: 3 });
      mono(c, fmtBytes(this.ctr.bytes(t)), W - 96, H - 80, 15, C.glacier, { align: 'right', track: 2 });
      c.globalAlpha = 1;
    }
  }

  /** Hex dump of the records on the wire: a new record per handshake word; the newest one lit. */
  private dump(c: CanvasRenderingContext2D, t: number) {
    const x = 1500, y0 = 300, lh = 21;
    const evs = [...this.L0.words.slice(0, HANDSHAKE.length).map((w) => w.start), this.tSaid, this.tSaid + 0.25, this.tSaid + 0.5, this.tDone, this.tDone + 0.2];
    const n = evs.filter((e) => t >= e).length;
    if (n === 0) return;
    mono(c, 'WIRE · TCP 443', x, y0 - 22, 11, C.bone_(0.45), { track: 2.5 });
    const rows = Math.min(n * 2, 20);
    const first = Math.max(0, n * 2 - 20);
    c.save();
    c.font = font(MONO, 13); c.letterSpacing = '0.5px'; c.textAlign = 'left';
    for (let r = 0; r < rows; r++) {
      const i = first + r;
      const rec = Math.floor(i / 2);
      const fresh = rec === n - 1 ? Math.pow(0.5, (t - evs[rec]!) / 0.3) : 0;
      const off = (i * 16).toString(16).padStart(4, '0');
      const kind = rec < HANDSHAKE.length ? (i % 2 === 0 ? '16 03 03' : '') : (i % 2 === 0 ? '17 03 03' : '');
      const bytes = (kind ? kind + ' ' : '') + hexStr(kind ? 16 : 24, 200 + i).replace(/(..)/g, '$1 ').trim();
      c.fillStyle = C.bone_(0.28);
      c.fillText(off, x, y0 + r * lh);
      c.fillStyle = fresh > 0.05 ? mixC(C.bone_(0.5), C.glacier, fresh) : C.bone_(0.5);
      c.fillText(bytes.slice(0, 35), x + 48, y0 + r * lh);
    }
    c.restore();
  }

  /** The letter: readable, then ciphertext per char on "said the hard part", then a hatched slab riding to B. */
  private letter(c: CanvasRenderingContext2D, t: number) {
    const x0 = 112, y0 = 318, lh = 30, w = 380, h = LETTER.length * lh + 26;
    const appear = prog(t, this.L0.start - 0.2, this.L0.start + 0.6, ease.outCubic);
    if (appear <= 0) return;
    const enc = prog(t, this.tSaid, this.tDone - 0.15); // ciphertext sweep
    const coll = prog(t, this.tDone - 0.25, this.tDone + 0.1, ease.inOutCubic); // collapse into slab
    const ride = prog(t, this.tDone + 0.05, this.tDone + 0.95, ease.inOutCubic); // slab rides to B
    c.save();
    c.globalAlpha = appear;
    if (coll < 1) {
      c.save();
      c.globalAlpha *= 1 - coll;
      c.strokeStyle = C.bone_(0.35); c.lineWidth = 1;
      c.strokeRect(x0 - 16, y0 - 34, w, h);
      mono(c, 'PLAINTEXT · 4.2 kB', x0 - 16, y0 - 44, 11, C.bone_(0.45), { track: 2.5 });
      c.font = font(MONO, 18); c.letterSpacing = '0px'; c.textAlign = 'left';
      LETTER.forEach((s, i) => {
        const y = y0 + i * lh + lerp(0, (DATA_Y - (y0 + i * lh)) * 0.6, coll);
        const n = s.length;
        // chars turn to ciphertext left to right, top line first
        const k = Math.floor(clamp(enc * (LETTER.length + 2) - i) * (n + 1));
        const cs = cipher(n, 91 + i).slice(0, k) + s.slice(k);
        c.fillStyle = k > 0 ? C.glacier_(0.85) : C.bone_(0.88);
        c.fillText(cs.slice(0, k), x0, y);
        c.fillStyle = C.bone_(0.88);
        c.fillText(s.slice(k), x0 + c.measureText(cs.slice(0, k)).width, y);
      });
      c.restore();
    }
    if (coll > 0) {
      // the slab: a hatched block, collapsing from the letter's box then riding the data arrow
      const sw = lerp(w, 150, coll), sh = lerp(h, 46, coll);
      const sx0 = lerp(x0 - 16, A - 75, coll), sy0 = lerp(y0 - 34, DATA_Y - 23, coll);
      const sx = lerp(sx0, B - 75 - 24, ride), sy = sy0;
      const shape = (k: CanvasRenderingContext2D) => k.rect(sx, sy, sw, sh);
      c.fillStyle = C.ink; c.fillRect(sx, sy, sw, sh);
      hatch(c, shape, [sx, sy, sw, sh], 4, -Math.PI / 4, C.glacier_(0.75), 1.1);
      c.strokeStyle = C.glacier; c.lineWidth = 1.25; c.strokeRect(sx, sy, sw, sh);
      mono(c, 'CIPHERTEXT', sx, sy - 10, 11, C.glacier_(lerp(0, 0.9, coll)), { track: 2.5 });
      // passing the tap: a cold blink
      const over = 1 - smoothstep(0, 60, Math.abs(sx + sw / 2 - TAP_X));
      if (over > 0) {
        c.fillStyle = C.glacier_(over * 0.9);
        c.beginPath(); c.arc(TAP_X, DATA_Y, 4 + over * 6, 0, Math.PI * 2); c.fill();
      }
    }
    c.restore();
  }

  override post(f: Frame) {
    const tv = this.tVerse;
    return {
      frame: 1 - prog(f.t, tv - 0.05, tv + 0.6, ease.inCubic),
      bloom: 0.35,
      vignette: 0.45,
      zoom: 1 + 0.004 * f.a.kick,
    };
  }

  override ground(_f: Frame, out: import('three').WebGLRenderTarget) {
    this.bg.render(this.ctx.renderer, out, { grid: 0.5, gridStep: 48, seed: 1.3 });
  }
}
