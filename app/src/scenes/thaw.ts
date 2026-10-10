// THAW — FIG. 10, the one warm plate (L26–29 + tail). Signal orange enters the video here.
//   L26  The refrigerator from FIG. 5 returns; its hum is drawn on an oscilloscope, settling low.
//        On "key" a key slides out of the processor, falls on "falls" and lands on "out": the
//        padlock from FIG. 1 opens, and everything warm in the video happens from here.
//   L27  The ciphertext slab resolves, line by line, back into M.'s letter; the archive annotates
//        it: the door code underlined, 14 03 circled. "So that's what you were on about."
//   L28  The patience dial rewinds from 2036 to 2021 — the wait, played backwards.
//   L29  The title line in the past tense, one word per hit, warm.
//   tail "Delete after reading." is struck through and stamped RETAINED, and the plate goes cold.
import { type Frame } from '../engine/scene';
import { F, font, fitSize, measure } from '../engine/type';
import type { Line, Word } from '../engine/lyrics';
import { clamp, ease, lerp, prog, pulse, TAU } from '../engine/util';
import { C, Plate, W, H, MONO, bottomUp, drawKaraoke, hatch, layoutWords, line, mixC, mono, padlock, stamp, type KLayout } from './_kit';

const FX = 640; // fridge axis
const STAGES = [{ y: 220, w: 380 }, { y: 300, w: 340 }, { y: 374, w: 300 }, { y: 440, w: 256 }, { y: 502, w: 214 }];
const QPU_Y = 580, FLOOR_Y = 812;
const LOCK = { x: 1440, y: 430, s: 210 };
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
const LYR_Y = 975;

export default class Thaw extends Plate {
  L26!: Line; L27!: Line; L28!: Line; L29!: Line;
  k26!: KLayout; k27!: KLayout; k28!: KLayout;
  tKey = 0; tFalls = 0; tOut = 0;
  titleSize = 260;

  override setup() {
    this.L26 = this.line('The fridge hums low');
    this.L27 = this.line("what you were on about");
    this.L28 = this.line('I said sooner');
    this.L29 = this.line('Harvested then');
    const fam = F.archivo(100, 700);
    this.k26 = layoutWords(this.L26.words, fam, 64, 1720);
    this.k27 = layoutWords(this.L27.words, fam, 64, 1720);
    this.k28 = layoutWords(this.L28.words, fam, 64, 1720);
    const w = this.L26.words;
    this.tKey = w.find((x) => /key/i.test(x.w))!.start;
    this.tFalls = w.find((x) => /falls/i.test(x.w))!.start;
    this.tOut = w.find((x) => /out/i.test(x.w))!.start;
    const [a, b, c2, d] = this.L29.words.map((x) => x.w.toUpperCase());
    const tf = F.archivo(125, 900);
    this.titleSize = Math.min(fitSize(`${a} ${b}`, tf, 1700, 300), fitSize(`${c2} ${d}`, tf, 1700, 300));
  }

  /** 0..1: how warm the plate is (the key's landing to the end of the title line, then it cools). */
  private warm(t: number) {
    return Math.min(prog(t, this.tOut - 0.05, this.tOut + 0.3), 1 - prog(t, this.L29.end + 1.5, this.L29.end + 5));
  }

  draw(c: CanvasRenderingContext2D, f: Frame) {
    const t = f.t;
    const wm = this.warm(t);
    const acc = mixC(C.glacier, C.signal, wm);
    mono(c, 'FIG. 10', 96, 108, 13, acc, { track: 3 });
    mono(c, t < this.L27.start - 0.2 ? 'THE THAW · Q-DAY' : t < this.L28.start - 0.2 ? 'THE THAW · OBJ 000001, PLAINTEXT' : 'THE THAW', 186, 108, 13, C.bone_(0.55), { track: 3 });
    mono(c, `${this.ctr.year(t)}`, W - 96, 108, 13, acc, { align: 'right', track: 3 });

    // the four movements, each in on its line's beat with a short crossfade
    const seg = (a: number, b: number) => clamp(Math.min((t - a) / 0.25, (b - t) / 0.25));
    const sA = seg(this.ctx.start - 1, this.L27.start - 0.3);
    const sB = seg(this.L27.start - 0.3, this.L28.start - 0.25);
    const sC = seg(this.L28.start - 0.25, this.L29.start - 0.25);
    const sD = seg(this.L29.start - 0.25, this.L29.end + 1.4);
    const sE = seg(this.L29.end + 1.4, this.ctx.end + 1);
    if (sA > 0) { c.save(); c.globalAlpha = sA; this.fridge(c, t); c.restore(); }
    if (sB > 0) { c.save(); c.globalAlpha = sB; this.letter(c, t); c.restore(); }
    if (sC > 0) { c.save(); c.globalAlpha = sC; this.rewind(c, t); c.restore(); }
    if (sD > 0) { c.save(); c.globalAlpha = sD; this.slam(c, t); c.restore(); }
    if (sE > 0) { c.save(); c.globalAlpha = sE; this.retained(c, t); c.restore(); }

    // the sung lines (the title line is the slam itself)
    const st = { sung: C.bone, unsung: C.bone_(0.22), active: acc, lift: 4, align: 'center' as const };
    for (const [l, k, nx] of [[this.L26, this.k26, this.L27], [this.L27, this.k27, this.L28], [this.L28, this.k28, this.L29]] as const) {
      const until = nx.start - 0.15;
      const a = clamp(Math.min((t - (l.start - 0.4)) / 0.3, (until - t) / 0.2));
      if (a <= 0) continue;
      c.save(); c.globalAlpha = a;
      drawKaraoke(c, k, t, W / 2, bottomUp(k, LYR_Y), st);
      c.restore();
    }
  }

  /** L26: the fridge, its hum, the key, the padlock. */
  private fridge(c: CanvasRenderingContext2D, t: number) {
    const wm = this.warm(t);
    // stages and rods, as in FIG. 5
    STAGES.forEach((s, i) => {
      const x = FX - s.w / 2, y = s.y;
      const plate = (q: CanvasRenderingContext2D) => q.rect(x, y - 8, s.w, 16);
      c.fillStyle = C.ink; c.beginPath(); plate(c); c.fill();
      hatch(c, plate, [x, y - 8, s.w, 16], 5, Math.PI / 4, C.bone_(0.45), 1);
      c.strokeStyle = C.bone_(0.85); c.lineWidth = 1.25; c.beginPath(); plate(c); c.stroke();
      if (i > 0) {
        const up = STAGES[i - 1]!;
        c.strokeStyle = C.bone_(0.5); c.lineWidth = 1;
        c.beginPath();
        for (const dx of [-0.42, 0.42]) { c.moveTo(FX + dx * s.w, y - 8); c.lineTo(FX + dx * s.w, up.y + 8); }
        c.stroke();
      }
    });
    c.strokeStyle = C.bone_(0.28); c.lineWidth = 1;
    c.beginPath();
    for (let j = 0; j < 8; j++) { const x = FX - 70 + j * 20; c.moveTo(x, 180); c.lineTo(x, QPU_Y - 18); }
    c.stroke();
    c.fillStyle = C.bone_(0.75); c.fillRect(FX - 250, 176, 500, 4);
    c.strokeStyle = C.bone; c.lineWidth = 1.25; c.strokeRect(FX - 60, QPU_Y - 18, 120, 36);
    c.fillStyle = mixC(C.glacier_(0.5), C.signal_(0.8), wm); c.fillRect(FX - 40, QPU_Y - 9, 80, 18);
    // the hum: an oscilloscope trace under the floor line, settling low on "hums low"
    const ox = 220, oy = FLOOR_Y + 52, ow = 840;
    const amp = lerp(24, 5, prog(t, this.L26.words[2]!.start, this.L26.words[3]!.start + 0.8, ease.outCubic));
    c.strokeStyle = C.bone_(0.2); c.strokeRect(ox, oy - 30, ow, 60);
    c.strokeStyle = mixC(C.glacier, C.ember, wm); c.lineWidth = 1.5;
    c.beginPath();
    for (let i = 0; i <= 240; i++) {
      const u = i / 240;
      const y = oy + Math.sin(u * TAU * 9 + t * 9) * amp * 0.9 * (0.8 + 0.2 * Math.sin(u * TAU * 2 + t));
      if (i === 0) c.moveTo(ox + u * ow, y); else c.lineTo(ox + u * ow, y);
    }
    c.stroke();
    mono(c, 'HUM · 50 Hz · SETTLING', ox + ow + 16, oy + 4, 11, C.bone_(0.5), { track: 3 });
    line(c, 160, FLOOR_Y, 1760, FLOOR_Y, C.bone_(0.45), 1.25);
    hatch(c, (q) => q.rect(160, FLOOR_Y, 1600, 10), [160, FLOOR_Y, 1600, 10], 6, Math.PI / 4, C.bone_(0.25), 1);

    // the key: slides out of the processor on "key", falls on "falls", lands on "out"
    const out = prog(t, this.tKey - 0.05, this.tKey + 0.25, ease.outCubic);
    if (out > 0) {
      const fall = prog(t, this.tFalls, this.tOut);
      let ky = QPU_Y + 30 + out * 20, rot = 0;
      if (t >= this.tFalls) {
        // it tumbles half a turn and lands flat, bit up (the bow's rim on the floor)
        ky = lerp(QPU_Y + 50, FLOOR_Y - 34, ease.inQuad(fall));
        rot = lerp(0, Math.PI, ease.inQuad(fall));
        if (t > this.tOut) { const b = t - this.tOut; ky = FLOOR_Y - 34 - Math.abs(Math.sin(b * 11)) * 26 * Math.exp(-b * 6); rot = Math.PI + 0.1 * Math.sin(b * 11) * Math.exp(-b * 6); }
      }
      this.key(c, FX + (t > this.tOut ? (t - this.tOut) * 40 * Math.exp(-(t - this.tOut) * 2) : 0), ky, rot, t >= this.tKey ? 1 : 0);
    }
    // the padlock from FIG. 1, opening when the key lands
    const open = prog(t, this.tOut, this.tOut + 0.7, ease.outCubic);
    const hit = pulse(t, this.tOut, 0.2);
    padlock(c, LOCK.x, LOCK.y, LOCK.s * (1 + 0.08 * hit), open, mixC(C.glacier, C.signal, wm), { hatch: mixC(C.glacier_(0.5), C.ember_(0.6), wm), fill: C.ink, keyhole: mixC(C.glacier, C.signal, wm) });
    mono(c, open > 0.5 ? 'SESSION a3c4… · DECRYPTED' : 'SESSION a3c4… · SECURE', LOCK.x, LOCK.y + 190, 13, open > 0.5 ? C.signal : C.bone_(0.6), { align: 'center', track: 3 });
    if (hit > 0.02) { c.strokeStyle = C.signal_(hit); c.lineWidth = 2; c.beginPath(); c.arc(LOCK.x, LOCK.y, LOCK.s * (0.9 + (1 - hit) * 1.6), 0, TAU); c.stroke(); }
  }

  /** A key, engraved: bow ring, shaft, bit. (x, y) = centre of the shaft; length ~200. */
  private key(c: CanvasRenderingContext2D, x: number, y: number, rot: number, hot: number) {
    c.save();
    c.translate(x, y); c.rotate(rot);
    const col = hot ? C.signal : C.bone;
    c.strokeStyle = col; c.fillStyle = C.ink; c.lineWidth = 4;
    // bow
    c.beginPath(); c.arc(-82, 0, 32, 0, TAU); c.fill(); c.stroke();
    c.beginPath(); c.arc(-82, 0, 12, 0, TAU); c.stroke();
    // shaft
    c.beginPath(); c.moveTo(-50, -7); c.lineTo(104, -7); c.lineTo(104, 7); c.lineTo(-50, 7); c.closePath(); c.fill(); c.stroke();
    // bit
    c.beginPath(); c.moveTo(64, 7); c.lineTo(64, 34); c.lineTo(78, 34); c.lineTo(78, 22); c.lineTo(90, 22); c.lineTo(90, 34); c.lineTo(104, 34); c.lineTo(104, 7); c.closePath(); c.fill(); c.stroke();
    if (hot) hatch(c, (q) => q.arc(-82, 0, 30, 0, TAU), [-114, -32, 64, 64], 5, -Math.PI / 4, C.ember_(0.7), 1);
    c.restore();
  }

  /** L27: the letter, resolving out of its ciphertext line by line; the archive's annotations. */
  private letter(c: CanvasRenderingContext2D, t: number) {
    const x0 = 520, y0 = 250, lh = 66, size = 40;
    const w = this.L27.words;
    const t0 = this.L27.start - 0.2, t1 = w[w.length - 1]!.start + 0.3;
    c.save();
    c.strokeStyle = C.bone_(0.3); c.lineWidth = 1;
    c.strokeRect(x0 - 40, y0 - 70, 960, LETTER.length * lh + 60);
    mono(c, 'OBJ 000001 · PLAINTEXT · RECOVERED 2036', x0 - 40, y0 - 84, 12, C.signal, { track: 3 });
    c.font = font(MONO, size); c.textAlign = 'left'; c.letterSpacing = '0px';
    LETTER.forEach((s, i) => {
      if (!s.trim()) return;
      const y = y0 + i * lh;
      const lt0 = lerp(t0, t1, i / LETTER.length), lt1 = lt0 + (t1 - t0) / LETTER.length;
      const k = prog(t, lt0, lt1); // fraction of this line resolved
      const n = Math.floor(s.length * k);
      const tw = measure(s, MONO, size);
      // unresolved part: hatch
      if (k < 1) {
        const hx = x0 + measure(s.slice(0, n), MONO, size);
        hatch(c, (q) => q.rect(hx, y - size * 0.78, x0 + tw - hx, size * 0.95), [hx, y - size, x0 + tw - hx, size * 1.2], 5, -Math.PI / 4, C.glacier_(0.6), 1);
      }
      c.font = font(MONO, size); c.fillStyle = C.bone;
      c.fillText(s.slice(0, n), x0, y);
    });
    // annotations: the archive reads carefully
    const an = prog(t, t1 - 0.2, t1 + 0.4, ease.inOutCubic);
    if (an > 0) {
      const yD = y0 + 3 * lh, yB = y0 + 4 * lh;
      const dx = x0 + measure('basement one). ', MONO, size), dw = measure('Door code', MONO, size);
      line(c, dx, yD + 10, dx + dw * an, yD + 10, C.signal, 3);
      const bx = x0 + measure('is my birthday, ', MONO, size), bw = measure('14 03', MONO, size);
      c.strokeStyle = C.signal; c.lineWidth = 3;
      c.beginPath(); c.ellipse(bx + bw / 2, yB - 14, bw / 2 + 18, 34, -0.05, 0, TAU * an); c.stroke();
      mono(c, '← NOTED', bx + bw + 40, yB - 4, 16, C.signal_(an), { track: 3 });
    }
    c.restore();
  }

  /** L28: the patience dial rewinding from 2036 to 2021. */
  private rewind(c: CanvasRenderingContext2D, t: number) {
    const cx = W / 2, cy = 450, R = 280;
    const a0 = -Math.PI / 2;
    const u = 1 - prog(t, this.L28.start + 0.2, this.L28.end - 0.3, ease.inOutCubic) * (15 / 16); // 2036 → 2021
    c.save();
    c.strokeStyle = C.bone_(0.5); c.lineWidth = 1.25;
    c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();
    for (let y = 0; y < 16; y++) {
      const ang = a0 + TAU * (y / 16);
      line(c, cx + Math.cos(ang) * R, cy + Math.sin(ang) * R, cx + Math.cos(ang) * (R + 16), cy + Math.sin(ang) * (R + 16), C.bone_(0.7), 1.5);
      c.save();
      c.translate(cx + Math.cos(ang) * (R + 40), cy + Math.sin(ang) * (R + 40));
      c.font = font(F.mono(500), 13); c.textAlign = 'center'; c.textBaseline = 'middle'; c.letterSpacing = '1px';
      c.fillStyle = y / 16 <= u + 1e-3 ? C.ember : C.bone_(0.4);
      c.fillText(String(2021 + y), 0, 0);
      c.restore();
    }
    const ah = a0 + TAU * u;
    c.fillStyle = C.signal_(0.12);
    c.beginPath(); c.arc(cx, cy, R - 14, a0, ah); c.arc(cx, cy, 160, ah, a0, true); c.closePath(); c.fill();
    c.strokeStyle = C.signal; c.lineWidth = 3;
    c.beginPath(); c.arc(cx, cy, R - 7, a0, ah); c.stroke();
    c.strokeStyle = C.bone; c.lineWidth = 2;
    line(c, cx + Math.cos(ah) * 160, cy + Math.sin(ah) * 160, cx + Math.cos(ah) * (R - 4), cy + Math.sin(ah) * (R - 4), C.bone, 2);
    const yr = Math.round(2021 + u * 16 - 0.49);
    mono(c, 'THEN', cx, cy - 78, 12, C.bone_(0.55), { align: 'center', track: 4 });
    c.font = font(F.mono(600), 96); c.textAlign = 'center'; c.fillStyle = C.ember; c.letterSpacing = '-2px';
    c.fillText(String(Math.min(2036, yr)), cx, cy + 30);
    mono(c, 'REWIND', cx, cy + 72, 15, C.signal, { align: 'center', track: 4 });
    c.restore();
  }

  /** L29: HARVESTED THEN, / DECRYPTED NOW — one word per hit, warm. */
  private slam(c: CanvasRenderingContext2D, t: number) {
    const fam = F.archivo(125, 900), sz = this.titleSize;
    const ws = this.L29.words;
    const rows = [[ws[0]!, ws[1]!], [ws[2]!, ws[3]!]] as Word[][];
    const top = H / 2 - 0.82 * sz - 20;
    const base = [top + 0.72 * sz, top + 0.72 * sz + 0.92 * sz];
    const sp = measure(' ', fam, sz) - 4;
    c.save();
    c.font = font(fam, sz); c.textBaseline = 'alphabetic'; c.textAlign = 'left'; c.letterSpacing = '-4px';
    rows.forEach((row, ri) => {
      const txt = row.map((w) => w.w.toUpperCase());
      const widths = txt.map((s) => measure(s, fam, sz, -4));
      let x = W / 2 - (widths[0]! + sp + widths[1]!) / 2;
      row.forEach((w, wi) => {
        if (t >= w.start - 0.02) {
          const k = prog(t, w.start - 0.02, w.start + 0.16, ease.outCubic);
          const sc = lerp(1.25, 1, k);
          const cx = x + widths[wi]! / 2, cy = base[ri]! - sz * 0.36;
          c.save();
          c.translate(cx, cy); c.scale(sc, sc); c.translate(-cx, -cy);
          c.globalAlpha *= clamp(k * 4);
          // sung: hot signal (blooms), settling to ember-bone
          c.fillStyle = t < w.end ? C.signal : mixC(C.bone, C.ember, 0.35);
          c.fillText(txt[wi]!, x, base[ri]!);
          c.restore();
        } else { c.fillStyle = C.bone_(0.07); c.fillText(txt[wi]!, x, base[ri]!); }
        x += widths[wi]! + sp;
      });
    });
    c.restore();
  }

  /** Tail: the letter's last instruction, not followed. The plate goes cold again. */
  private retained(c: CanvasRenderingContext2D, t: number) {
    const t0 = this.L29.end + 1.4;
    const size = 64;
    const s = 'Delete after reading.';
    c.save();
    c.font = font(MONO, size); c.textAlign = 'center'; c.fillStyle = C.bone; c.letterSpacing = '0px';
    c.fillText(s, W / 2, H / 2);
    const tw = measure(s, MONO, size);
    const sk = prog(t, t0 + 1.2, t0 + 1.7, ease.inOutCubic);
    if (sk > 0) line(c, W / 2 - tw / 2 - 10, H / 2 - 20, W / 2 - tw / 2 - 10 + (tw + 20) * sk, H / 2 - 22, C.bone, 4);
    const st = prog(t, t0 + 2.4, t0 + 3.0);
    if (st > 0) stamp(c, 'RETAINED', W / 2 + 160, H / 2 + 90, 64, -0.08, C.glacier, st, 141, { ink: 0.85 });
    mono(c, '— M., 2021', W / 2 - tw / 2, H / 2 + 50, 14, C.bone_(0.5), { track: 3 });
    c.restore();
  }

  override post(f: Frame) {
    const t = f.t, wm = this.warm(t);
    let hit = pulse(t, this.tOut, 0.15) * 1.4;
    for (const w of this.L29.words) hit = Math.max(hit, pulse(t, w.start, 0.1));
    // warm: the signal blooms and the red-orange halation finally fires
    return {
      bloom: lerp(0.3, 0.75, wm), bloomThreshold: lerp(1.0, 0.75, wm), halation: lerp(0, 0.55, wm), vignette: 0.45,
      zoom: 1 + 0.004 * f.a.kick + 0.025 * hit, shake: [hit * 5, -hit * 4] as [number, number],
    };
  }
  override ground(f: Frame, out: import('three').WebGLRenderTarget) {
    this.bg.render(this.ctx.renderer, out, { grid: 0.25 * (1 - this.warm(f.t)), gridStep: 46, seed: 13.3, light: lerp(1, 1.3, this.warm(f.t)) });
  }
}
