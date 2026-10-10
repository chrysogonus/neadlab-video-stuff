// PETABYTES — FIG. 9, scale (L22–23).
// A grid of storage cells, one cell per unit of the archive's size, filling as L22 is sung; the
// question is asked in a small mono callout with a leader line, as if someone genuinely asked.
// The count crosses into petabytes on "Petabytes": the full grid collapses into a single cell and
// the unit slams from TB to PB. Then everything stops, and the line is set alone in Cormorant
// italic — the one tender moment in the video, the only place the archive admits to enjoying itself.
import { type Frame } from '../engine/scene';
import { F, font } from '../engine/type';
import type { Line } from '../engine/lyrics';
import { clamp, ease, lerp, prog, pulse } from '../engine/util';
import { C, Plate, W, H, MONO_M, bottomUp, drawKaraoke, fmtBytes, hatch, layoutWords, leader, line, mono, unitOf, type KLayout } from './_kit';

const CELL = 26, COLS = 40, ROWS = 25;
const GX = 150, GY = 190;
const RX = W - 150; // right edge of the readouts
const LYR_Y = 975;
const UNIT = ['B', 'kB', 'MB', 'GB', 'TB', 'PB'];

export default class Petabytes extends Plate {
  L22!: Line; L23!: Line;
  k22!: KLayout; k23!: KLayout;
  tCross = 0; tDarling = 0;

  override setup() {
    this.L22 = this.line('Somebody asked');
    this.L23 = this.line('Petabytes');
    this.k22 = layoutWords(this.L22.words, F.archivo(100, 700), 64, 1720);
    this.k23 = layoutWords(this.L23.words, F.serif(400, true), 132, 1500);
    // when the count crosses 1 PB (bisection on the counters)
    let a = this.L22.start, b = this.L23.end;
    for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (this.ctr.bytes(m) >= 1e15) b = m; else a = m; }
    this.tCross = b;
    this.tDarling = this.L23.words[1]!.start;
  }

  draw(c: CanvasRenderingContext2D, f: Frame) {
    const t = f.t;
    const stop = prog(t, this.tDarling - 0.3, this.tDarling + 0.4, ease.inOutCubic); // everything stops
    mono(c, 'FIG. 9', 96, 108, 13, C.glacier_(1 - stop * 0.7), { track: 3 });
    mono(c, 'SCALE · ONE CELL = ONE UNIT', 176, 108, 13, C.bone_(0.55 * (1 - stop * 0.7)), { track: 3 });
    mono(c, `${this.ctr.year(t)}`, W - 96, 108, 13, C.glacier_(1 - stop * 0.7), { align: 'right', track: 3 });

    const bytes = this.ctr.bytes(t);
    const u = unitOf(bytes);
    const val = bytes / Math.pow(1000, u);
    const coll = prog(t, this.tCross, this.tCross + 0.45, ease.inOutCubic); // the collapse into one PB cell
    const gridA = 1 - prog(t, this.tCross + 0.5, this.tCross + 1.0, ease.inOutCubic);

    c.save();
    c.globalAlpha = gridA;
    if (t < this.tCross) this.grid(c, Math.min(COLS * ROWS, Math.floor(val)), val % 1, 1, 0);
    else {
      // the old (full) grid shrinks into cell 0 of the new one while the new grid draws in around it
      if (coll < 1) { c.save(); c.globalAlpha *= 1 - coll; this.grid(c, COLS * ROWS, 0, lerp(1, 1 / COLS, coll), 0); c.restore(); }
      this.grid(c, Math.floor(val), val % 1, 1, coll);
    }
    c.restore();

    // the unit readout, top right of the grid
    const slam = pulse(t, this.tCross, 0.25);
    c.save();
    c.globalAlpha = 1 - stop * 0.6;
    mono(c, 'ARCHIVE', RX, GY - 64, 12, C.bone_(0.55), { align: 'right', track: 3 });
    c.font = font(F.mono(600), 46 * (1 + 0.25 * slam)); c.textAlign = 'right'; c.letterSpacing = '-1px';
    c.fillStyle = u >= 5 ? C.glacier : C.bone;
    c.fillText(fmtBytes(bytes), RX, GY - 18);
    mono(c, `1 CELL = 1 ${UNIT[u]}`, GX, GY - 18, 13, C.bone_(0.6), { track: 3 });
    c.restore();

    // the question, asked in a meeting
    this.question(c, t, 1 - prog(t, this.tCross - 0.15, this.tCross + 0.2), val);

    // L22: the usual karaoke under the grid
    {
      const until = this.L23.start - 0.15;
      const a = clamp(Math.min((t - (this.L22.start - 0.4)) / 0.3, (until - t) / 0.2));
      if (a > 0) {
        c.save(); c.globalAlpha = a;
        drawKaraoke(c, this.k22, t, W / 2, bottomUp(this.k22, LYR_Y), { sung: C.bone, unsung: C.bone_(0.22), active: C.glacier, lift: 4, align: 'center' });
        c.restore();
      }
    }
    // L23: alone, Cormorant italic, centred; the single PB cell sits above it
    {
      const a = prog(t, this.tCross + 0.15, this.tCross + 0.6);
      const cellA = prog(t, this.tCross + 0.5, this.tCross + 1.0);
      if (a > 0) {
        c.save(); c.globalAlpha = a;
        const y0 = bottomUp(this.k23, H / 2 + 150);
        drawKaraoke(c, this.k23, t, W / 2, y0 + (1 - ease.outCubic(a)) * 20, { sung: C.bone, unsung: C.bone_(0.18), active: C.glacier, align: 'center', lineH: 1.05 });
        c.restore();
        if (cellA > 0) {
          c.save(); c.globalAlpha = cellA;
          const cx = W / 2, cy = H / 2 - 230;
          c.fillStyle = C.ink; c.fillRect(cx - 22, cy - 22, 44, 44);
          hatch(c, (q) => q.rect(cx - 22, cy - 22, 44, 44), [cx - 22, cy - 22, 44, 44], 4, -Math.PI / 4, C.glacier_(0.85), 1);
          c.strokeStyle = C.glacier; c.lineWidth = 1.5; c.strokeRect(cx - 22, cy - 22, 44, 44);
          mono(c, fmtBytes(this.ctr.bytes(t)), cx, cy + 52, 13, C.glacier, { align: 'center', track: 3 });
          c.restore();
        }
      }
    }
  }

  /** The cell grid: `n` full cells and one partial; `s` scales it about cell 0; `draw` 0..1 draws the frame in. */
  private grid(c: CanvasRenderingContext2D, n: number, frac: number, s: number, draw: number) {
    c.save();
    c.translate(GX, GY); c.scale(s, s);
    const k = draw > 0 ? draw : 1;
    c.strokeStyle = C.bone_(0.16); c.lineWidth = 1 / s;
    c.beginPath();
    for (let r = 0; r <= ROWS; r++) { c.moveTo(0, r * CELL); c.lineTo(COLS * CELL * k, r * CELL); }
    for (let q = 0; q <= COLS; q++) { if (q / COLS > k) break; c.moveTo(q * CELL, 0); c.lineTo(q * CELL, ROWS * CELL); }
    c.stroke();
    // filled cells, row-major; the newest one glacier
    for (let i = 0; i <= Math.min(n, COLS * ROWS - 1); i++) {
      const part = i < n ? 1 : frac;
      if (part <= 0) continue;
      const x = (i % COLS) * CELL, y = Math.floor(i / COLS) * CELL;
      c.fillStyle = i >= n - 1 ? C.glacier_(0.9) : C.bone_(0.55);
      c.fillRect(x + 3, y + 3 + (CELL - 6) * (1 - part), CELL - 6, (CELL - 6) * part);
    }
    c.restore();
  }

  /** The question: a mono callout with a leader line, typed per word as it is sung. */
  private question(c: CanvasRenderingContext2D, t: number, a: number, val: number) {
    const ws = this.L22.words;
    const qStart = ws[2]!.start; // “Who’d
    const k = prog(t, qStart - 0.3, qStart, ease.outCubic);
    if (k <= 0 || a <= 0) return;
    const bx = 1260, by = 420, bw = 510, bh = 132;
    c.save();
    c.globalAlpha = k * a;
    c.fillStyle = C.ink; c.fillRect(bx, by, bw, bh);
    c.strokeStyle = C.bone; c.lineWidth = 1.25; c.strokeRect(bx, by, bw, bh);
    mono(c, `Q. FROM THE FLOOR · ALL-HANDS, ${this.ctr.year(t)}`, bx + 20, by + 30, 11, C.bone_(0.55), { track: 2.5 });
    const q = '“Who’d even store it?”';
    const shown = ws.slice(2).reduce((s, w, i) => (t >= w.start ? i + 1 : s), 0);
    const parts = q.split(' ').slice(0, shown).join(' ');
    c.font = font(MONO_M, 28); c.fillStyle = C.bone; c.textAlign = 'left'; c.letterSpacing = '0px';
    c.fillText(parts, bx + 20, by + 80);
    mono(c, '— SOMEBODY', bx + bw - 20, by + bh - 18, 11, C.bone_(0.5), { align: 'right', track: 2.5 });
    // the leader points at the newest cell: what they're asking about
    const i = Math.min(COLS * ROWS - 1, Math.floor(val));
    const cx = GX + (i % COLS) * CELL + CELL / 2, cy = GY + Math.floor(i / COLS) * CELL + CELL / 2;
    leader(c, cx, cy, bx - 30, cy, bx - 30, C.glacier_(0.8), k);
    line(c, bx - 30, cy, bx - 30, by + bh / 2, C.glacier_(0.8));
    line(c, bx - 30, by + bh / 2, bx, by + bh / 2, C.glacier_(0.8));
    c.restore();
  }

  override post(f: Frame) {
    const slam = pulse(f.t, this.tCross, 0.12);
    return { bloom: 0.3, vignette: 0.45 + 0.15 * prog(f.t, this.tDarling - 0.3, this.tDarling + 0.4), zoom: 1 + 0.004 * f.a.kick + 0.02 * slam, shake: [slam * 4, -slam * 3] as [number, number] };
  }
  override ground(f: Frame, out: import('three').WebGLRenderTarget) {
    this.bg.render(this.ctx.renderer, out, { grid: 0, seed: 12.7, light: lerp(0.8, 1.4, prog(f.t, this.tDarling - 0.3, this.tDarling + 0.6)) });
  }
}
