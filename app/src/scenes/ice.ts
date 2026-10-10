// ICE — FIG. 2, the copy goes on ice (L2–3).
// The ciphertext slab, pure hatching. A reading window crosses it on "I couldn't read a word of
// it" and shows nothing but noise; on "I didn't even try" it is put away and DECRYPTION ATTEMPTS
// is stamped 0. On "copy" a second, bit-exact slab is struck from the first; on "put it" it is
// racked as a cartridge into slot 001 of an enormous, empty cold-store rack (elevation drawing);
// on "ice" frost grows over the rack in engraving hairlines and the temperature falls.
import { type Frame } from '../engine/scene';
import { F, font } from '../engine/type';
import type { Line } from '../engine/lyrics';
import { clamp, ease, lerp, mulberry32, prog, pulse } from '../engine/util';
import { C, Plate, W, H, MONO, cipher, drawKaraoke, fmtBytes, hatch, layoutWords, line, lineAlpha, mono, rectP, stamp, type KLayout } from './_kit';

const SLAB = { x: 170, y: 300, w: 560, h: 340 };
const RACK = { x: 1010, y: 214, w: 760, h: 450, rows: 6, cols: 12 };
const slotW = RACK.w / RACK.cols, slotH = RACK.h / RACK.rows;
const LYR_X = 170, LYR_Y = 920;

interface Branch { pts: { x: number; y: number }[]; t0: number; len: number }

export default class Ice extends Plate {
  L2!: Line; L3!: Line;
  k2!: KLayout; k3!: KLayout;
  tRead = 0; tTry = 0; tCopy = 0; tPut = 0; tIce = 0;
  frost: Branch[] = [];

  override setup() {
    this.L2 = this.line("I couldn't read");
    this.L3 = this.line('I made myself a copy');
    const fam = F.archivo(100, 700);
    this.k2 = layoutWords(this.L2.words, fam, 66, W - 2 * LYR_X);
    this.k3 = layoutWords(this.L3.words, fam, 66, W - 2 * LYR_X);
    const w2 = this.L2.words, w3 = this.L3.words;
    this.tRead = w2[2]!.start; // "read"
    this.tTry = w2.find((w) => /didn/i.test(w.w))!.start;
    this.tCopy = w3.find((w) => /copy/i.test(w.w))!.start;
    this.tPut = w3.find((w) => /put/i.test(w.w))!.start;
    this.tIce = w3.find((w) => /ice/i.test(w.w))!.start;
    // frost: fern-like dendrites from the rack's frame inward (straight stems, paired side branches
    // at ±60°, as ice grows); each branch starts when its parent's tip passes it
    const rnd = mulberry32(77);
    const grow = (x: number, y: number, a: number, len: number, t0: number, depth: number) => {
      const step = 6;
      const n = Math.max(2, Math.floor(len / step));
      const pts = [{ x, y }];
      let px = x, py = y;
      const bend = (rnd() - 0.5) * 0.01;
      for (let i = 0; i < n; i++) { px += Math.cos(a + bend * i) * step; py += Math.sin(a + bend * i) * step; pts.push({ x: px, y: py }); }
      this.frost.push({ pts, t0, len: n * step });
      if (depth < 2) {
        for (let at = 3; at < n - 1; at += 2 + Math.floor(rnd() * 2)) {
          const u = at / n, sub = len * (depth === 0 ? 0.38 : 0.45) * (1 - u) * (0.7 + rnd() * 0.5);
          if (sub < 8) continue;
          for (const side of [-1, 1]) grow(pts[at]!.x, pts[at]!.y, a + side * (Math.PI / 3), sub, t0 + u * 0.5, depth + 1);
        }
      }
    };
    for (let i = 0; i < 22; i++) {
      const side = i % 4;
      const u = 0.06 + rnd() * 0.88;
      const [x, y, a] = side === 0 ? [RACK.x + u * RACK.w, RACK.y, Math.PI / 2] : side === 1 ? [RACK.x + RACK.w, RACK.y + u * RACK.h, Math.PI] : side === 2 ? [RACK.x + u * RACK.w, RACK.y + RACK.h, -Math.PI / 2] : [RACK.x, RACK.y + u * RACK.h, 0];
      grow(x, y, a + (rnd() - 0.5) * 0.9, 60 + rnd() * 110, rnd() * 0.45, 0);
    }
  }

  draw(c: CanvasRenderingContext2D, f: Frame) {
    const t = f.t;
    // the camera drifts from the slab to the rack across L3
    const pan = lerp(40, -40, prog(t, this.L3.start - 0.5, this.tIce + 0.5, ease.inOutCubic));
    const z = lerp(1.04, 1.0, prog(t, this.ctx.start, this.ctx.end, ease.outQuad));
    c.translate(W / 2 + pan, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2);

    mono(c, 'FIG. 2', 96, 118, 13, C.glacier, { track: 3 });
    mono(c, 'RETENTION · OBJECT 000001', 176, 118, 13, C.bone_(0.55), { track: 3 });
    line(c, 96, 136, W - 96, 136, C.bone_(0.22));
    mono(c, `${this.ctr.year(t)}`, W - 96, 118, 13, C.glacier, { align: 'right', track: 3 });

    this.slab(c, t, SLAB.x, SLAB.y, 1);
    // the copy: struck from the slab, then racked as a cartridge into slot 001
    if (t >= this.tCopy - 0.05) {
      const strike = prog(t, this.tCopy - 0.05, this.tCopy + 0.35, ease.outCubic);
      const go = prog(t, this.tPut - 0.1, this.tPut + 0.75, ease.inOutCubic);
      const slot = { x: RACK.x + 6, y: RACK.y + 6, w: slotW - 12, h: slotH - 12 };
      const x = lerp(SLAB.x + 34 * strike, slot.x, go), y = lerp(SLAB.y + 34 * strike, slot.y, go);
      const sw = lerp(SLAB.w, slot.w, go), sh = lerp(SLAB.h, slot.h, go);
      c.save();
      c.globalAlpha = clamp(strike * 3);
      c.fillStyle = C.ink; c.fillRect(x, y, sw, sh);
      hatch(c, (k) => k.rect(x, y, sw, sh), [x, y, sw, sh], lerp(5, 3, go), -Math.PI / 4, C.glacier_(0.8), 1);
      c.strokeStyle = C.glacier; c.lineWidth = 1.5; c.strokeRect(x, y, sw, sh);
      const fl = pulse(t, this.tCopy, 0.15);
      if (fl > 0.02) { c.fillStyle = C.glacier_(fl * 0.35); c.fillRect(x, y, sw, sh); }
      if (go < 0.5) mono(c, 'COPY 1 · BIT-EXACT · SHA-256 MATCH', x, y + sh + 26, 12, C.glacier_(1 - go * 2), { track: 2.5 });
      c.restore();
    }

    this.rack(c, t);

    // lyrics: the current line big, karaoke; L2 steps up and dims when L3 arrives
    const up = prog(t, this.L3.start - 0.5, this.L3.start - 0.1, ease.inOutCubic);
    const st = { sung: C.bone, unsung: C.bone_(0.24), active: C.glacier, lift: 4 };
    c.save();
    c.globalAlpha = lineAlpha(this.L2, t, 99) * lerp(1, 0.32, up);
    drawKaraoke(c, this.k2, t, LYR_X, LYR_Y - up * 80, st);
    c.restore();
    c.save();
    c.globalAlpha = lineAlpha(this.L3, t, 99);
    drawKaraoke(c, this.k3, t, LYR_X, LYR_Y, st);
    c.restore();

    mono(c, 'ARCHIVE', W - 96, H - 104, 11, C.bone_(0.4), { align: 'right', track: 3 });
    mono(c, fmtBytes(this.ctr.bytes(t)), W - 96, H - 80, 15, C.glacier, { align: 'right', track: 2 });
  }

  /** The original slab with its read attempt: a window crossing it on "read", put away on "didn't". */
  private slab(c: CanvasRenderingContext2D, t: number, x: number, y: number, a: number) {
    const { w, h } = SLAB;
    c.save();
    c.globalAlpha = a;
    c.fillStyle = C.ink; c.fillRect(x, y, w, h);
    hatch(c, (k) => k.rect(x, y, w, h), [x, y, w, h], 5, -Math.PI / 4, C.glacier_(0.55), 1);
    c.strokeStyle = C.glacier_(0.9); c.lineWidth = 1.5; c.strokeRect(x, y, w, h);
    mono(c, 'OBJ 000001 · 4.2 kB · AES-256-GCM', x, y - 14, 12, C.glacier_(0.85), { track: 2.5 });
    mono(c, 'INTERCEPTED TUE 09 MAR 2021 09:41:07Z', x, y + h + 26, 11, C.bone_(0.4), { track: 2 });
    // the reading window: a loupe sliding across, showing only noise
    const inn = prog(t, this.tRead - 0.3, this.tRead, ease.outCubic);
    const out = prog(t, this.tTry, this.tTry + 0.35, ease.inCubic);
    const vis = inn * (1 - out);
    if (vis > 0.001) {
      const u = prog(t, this.tRead - 0.2, this.tTry, ease.inOutQuad);
      const lx = x + 40 + u * (w - 300), ly = y + h / 2 - 50 - out * 40;
      c.save();
      c.globalAlpha *= vis;
      c.fillStyle = C.ink; c.fillRect(lx, ly, 220, 100);
      c.strokeStyle = C.bone; c.lineWidth = 1.25; c.strokeRect(lx, ly, 220, 100);
      c.font = font(MONO, 16); c.letterSpacing = '1px'; c.textAlign = 'left';
      // noise, re-rolled per beat: there is nothing to read
      const seed = Math.floor(this.ctx.audio.beatAt(t) * 2);
      for (let r = 0; r < 3; r++) { c.fillStyle = C.bone_(0.75); c.fillText(cipher(18, seed * 7 + r), lx + 14, ly + 30 + r * 26); }
      mono(c, 'READ', lx, ly - 10, 11, C.bone_(0.6), { track: 3 });
      c.restore();
    }
    // the deadpan verdict
    const sk = prog(t, this.tTry + 0.55, this.tTry + 0.75);
    if (sk > 0) stamp(c, 'DECRYPTION ATTEMPTS: 0', x + w - 210, y + h - 40, 22, -0.06, C.bone, sk, 11, { ink: 0.8 });
    c.restore();
  }

  /** The cold-store rack: an elevation drawing, 72 slots, one used; frost on "ice". */
  private rack(c: CanvasRenderingContext2D, t: number) {
    const p = prog(t, this.L3.start - 0.6, this.L3.start + 0.9, ease.outCubic);
    if (p <= 0) return;
    const { x, y, w, h, rows, cols } = RACK;
    c.save();
    rectP(c, x - 14, y - 14, w + 28, h + 28, p, C.bone_(0.8), 1.5);
    c.globalAlpha = p;
    c.strokeStyle = C.bone_(0.22); c.lineWidth = 1;
    c.beginPath();
    for (let r = 1; r < rows; r++) { c.moveTo(x, y + r * slotH); c.lineTo(x + w, y + r * slotH); }
    for (let k = 1; k < cols; k++) { c.moveTo(x + k * slotW, y); c.lineTo(x + k * slotW, y + h); }
    c.stroke();
    // slot numbers, tiny
    c.font = font(MONO, 9); c.fillStyle = C.bone_(0.28); c.textAlign = 'left'; c.letterSpacing = '0.5px';
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) c.fillText(String(r * cols + k + 1).padStart(3, '0'), x + k * slotW + 5, y + (r + 1) * slotH - 6);
    // legs and base, elevation style
    c.strokeStyle = C.bone_(0.6); c.lineWidth = 1.25;
    c.beginPath();
    c.moveTo(x - 14, y + h + 14); c.lineTo(x - 14, y + h + 44); c.moveTo(x + w + 14, y + h + 14); c.lineTo(x + w + 14, y + h + 44);
    c.moveTo(x - 60, y + h + 44); c.lineTo(x + w + 60, y + h + 44);
    c.stroke();
    hatch(c, (k) => k.rect(x - 60, y + h + 44, w + 120, 12), [x - 60, y + h + 44, w + 120, 12], 6, Math.PI / 4, C.bone_(0.35), 1);
    mono(c, 'COLD STORE · TIER 3 · RACK 07', x - 14, y - 30, 12, C.bone_(0.7), { track: 3 });
    mono(c, `CAPACITY 72 · USED ${t >= this.tPut + 0.6 ? 1 : 0}`, x + w + 14, y - 30, 12, C.bone_(0.5), { align: 'right', track: 3 });
    c.restore();

    // frost on "ice"
    const fp = prog(t, this.tIce - 0.1, this.ctx.end + 0.2);
    if (fp > 0) {
      const T = fp * 1.6;
      c.save();
      c.lineCap = 'round';
      for (const b of this.frost) {
        const q = clamp((T - b.t0) / 0.6);
        if (q <= 0) continue;
        const n = Math.max(2, Math.floor(b.pts.length * q));
        c.strokeStyle = C.glacier_(0.45); c.lineWidth = 1;
        c.beginPath(); c.moveTo(b.pts[0]!.x, b.pts[0]!.y);
        for (let i = 1; i < n; i++) c.lineTo(b.pts[i]!.x, b.pts[i]!.y);
        c.stroke();
      }
      c.restore();
      const temp = lerp(4, -18, ease.outCubic(clamp(fp * 1.5)));
      mono(c, `${temp < 0 ? '−' : ''}${Math.abs(temp).toFixed(1)} °C`, x + w + 14, y + h + 78, 15, C.glacier, { align: 'right', track: 2 });
    }
  }

  override post(f: Frame) {
    return { bloom: 0.3, vignette: 0.45, zoom: 1 + 0.004 * f.a.kick + 0.01 * pulse(f.t, this.tCopy, 0.12) };
  }
  override ground(_f: Frame, out: import('three').WebGLRenderTarget) {
    this.bg.render(this.ctx.renderer, out, { grid: 0.35, gridStep: 48, seed: 2.1 });
  }
}
