// QUBITS — FIG. 5, the machine being built (L10–11).
// A dilution refrigerator in section: a chandelier of stages that stack in on "stacking", coax
// runs, temperature callouts. Beside it the processor's lattice: the physical-qubit count doubles
// on every beat of L10 (the logical count stays a deadpan 0, then 1). On L11 a ruler of years runs
// under a fixed NOW playhead: "a decade" draws the experts' bracket 2024–2034, and on "nearly
// here" the ruler slides so the playhead stands at 2031, three years short of the bracket's end.
import { type Frame } from '../engine/scene';
import { F, font } from '../engine/type';
import type { Line } from '../engine/lyrics';
import { clamp, ease, hash, lerp, prog, pulse } from '../engine/util';
import { C, Plate, W, H, MONO, bottomUp, drawKaraoke, hatch, layoutWords, leader, line, lineAlpha, mono, type KLayout } from './_kit';

const FX = 520; // fridge axis
const STAGES = [
  { y: 196, w: 420, label: '50 K', name: 'PT1' },
  { y: 286, w: 380, label: '4 K', name: 'PT2' },
  { y: 370, w: 330, label: '800 mK', name: 'STILL' },
  { y: 446, w: 280, label: '100 mK', name: 'COLD PLATE' },
  { y: 516, w: 230, label: '10 mK', name: 'MIXING CHAMBER' },
];
const CHIP_Y = 600;
const LAT = { x: 1150, y: 170, s: 410 }; // lattice panel
const RULER_Y = 790, PX_YEAR = 92;
const LYR_Y = 975;

export default class Qubits extends Plate {
  L10!: Line; L11!: Line;
  k10!: KLayout; k11!: KLayout;
  tStack = 0; tDecade = 0; tSlide0 = 0; tNearly = 0;
  beats: number[] = [];

  override setup() {
    this.L10 = this.line('stacking up the qubits');
    this.L11 = this.line('The experts said');
    const fam = F.archivo(100, 700);
    this.k10 = layoutWords(this.L10.words, fam, 64, 1700);
    this.k11 = layoutWords(this.L11.words, fam, 64, 1700);
    this.tStack = this.L10.words[1]!.start;
    this.tDecade = this.L11.words[4]!.start;
    this.tSlide0 = this.L11.words[7]!.start - 0.2; // "decade's"
    this.tNearly = this.L11.words[8]!.start;
    // the doubling beats: every beat from the line's first word to its end
    const au = this.ctx.audio;
    for (let b = Math.ceil(au.beatAt(this.L10.start - 0.05)); au.timeOfBeat(b) <= this.L10.end; b++) this.beats.push(au.timeOfBeat(b));
  }

  /** Physical qubits at t: 4, doubling per beat of L10, then "a few more" per beat. */
  private qubits(t: number) {
    const n = this.beats.filter((b) => t >= b).length;
    let q = 4 * Math.pow(2, Math.min(n, 8));
    if (n > 8) q += (n - 8) * 3;
    if (t > this.L10.end) q += Math.floor((t - this.L10.end) / 0.62) * 3;
    return Math.min(q, 1024 + 120);
  }

  draw(c: CanvasRenderingContext2D, f: Frame) {
    const t = f.t;
    const z = lerp(1.0, 1.03, prog(t, this.ctx.start, this.ctx.end, ease.inOutQuad));
    c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2);

    mono(c, 'FIG. 5', 96, 108, 13, C.glacier, { track: 3 });
    mono(c, 'THE MACHINE · DILUTION REFRIGERATOR, SECTION A–A', 176, 108, 13, C.bone_(0.55), { track: 3 });
    line(c, 96, 126, W - 96, 126, C.bone_(0.2));
    mono(c, `${this.ctr.year(t)}`, W - 96, 108, 13, C.glacier, { align: 'right', track: 3 });

    this.fridge(c, t);
    this.lattice(c, t);
    this.ruler(c, t);

    const st = { sung: C.bone, unsung: C.bone_(0.22), active: C.glacier, lift: 4, align: 'center' as const };
    for (const [l, k, nx] of [[this.L10, this.k10, this.L11], [this.L11, this.k11, null]] as const) {
      const until = nx ? nx.start - 0.15 : this.ctx.end + 1;
      const a = clamp(Math.min((t - (l.start - 0.4)) / 0.3, (until - t) / 0.2));
      if (a <= 0) continue;
      c.save(); c.globalAlpha = a;
      drawKaraoke(c, k, t, W / 2, bottomUp(k, LYR_Y), st);
      c.restore();
    }
  }

  private fridge(c: CanvasRenderingContext2D, t: number) {
    c.save();
    // the stages drop into place one per eighth from "stacking"
    STAGES.forEach((s, i) => {
      const t0 = this.tStack + i * 0.31 - 0.6;
      const k = prog(t, t0, t0 + 0.35, ease.outBack);
      if (k <= 0) return;
      const y = lerp(s.y - 60, s.y, k);
      c.globalAlpha = clamp(k * 2);
      const x = FX - s.w / 2;
      const plate = (q: CanvasRenderingContext2D) => q.rect(x, y - 9, s.w, 18);
      c.fillStyle = C.ink; c.beginPath(); plate(c); c.fill();
      hatch(c, plate, [x, y - 9, s.w, 18], 5, Math.PI / 4, C.bone_(0.55), 1);
      c.strokeStyle = C.bone; c.lineWidth = 1.25; c.beginPath(); plate(c); c.stroke();
      // support rods to the stage above
      if (i > 0) {
        const up = STAGES[i - 1]!;
        c.strokeStyle = C.bone_(0.6); c.lineWidth = 1;
        c.beginPath();
        for (const dx of [-0.42, 0.42]) { c.moveTo(FX + dx * s.w, y - 9); c.lineTo(FX + dx * s.w, up.y + 9); }
        c.stroke();
      }
      // callout
      const lx = FX + 300;
      leader(c, FX + s.w / 2, y, lx - 20, y, lx, C.bone_(0.55), clamp(k * 1.5));
      mono(c, s.label, lx, y + 5, 15, C.glacier, { track: 2 });
      mono(c, s.name, lx + 96, y + 4, 11, C.bone_(0.5), { track: 2.5 });
    });
    // coax runs: thin verticals through the stages, with a little helix where they cross each stage
    const kc = prog(t, this.tStack + 1.2, this.tStack + 2.2, ease.inOutCubic);
    if (kc > 0) {
      c.globalAlpha = 1;
      c.strokeStyle = C.bone_(0.35); c.lineWidth = 1;
      c.beginPath();
      for (let j = 0; j < 9; j++) {
        const x = FX - 80 + j * 20;
        c.moveTo(x, STAGES[0]!.y - 40); c.lineTo(x, lerp(STAGES[0]!.y - 40, CHIP_Y - 20, kc));
      }
      c.stroke();
      // the processor mount
      if (kc >= 1) {
        c.strokeStyle = C.bone; c.lineWidth = 1.25;
        c.strokeRect(FX - 60, CHIP_Y - 20, 120, 40);
        const glow = 0.5 + 0.5 * f01(t * 2);
        c.fillStyle = C.glacier_(0.25 + 0.35 * glow); c.fillRect(FX - 40, CHIP_Y - 10, 80, 20);
        leader(c, FX + 60, CHIP_Y, FX + 280, CHIP_Y, FX + 300, C.bone_(0.55));
        mono(c, 'QPU', FX + 300, CHIP_Y + 5, 15, C.glacier, { track: 2 });
        mono(c, 'SEE DETAIL B', FX + 360, CHIP_Y + 4, 11, C.bone_(0.5), { track: 2.5 });
      }
    }
    // the outer can (dashed), and the top flange
    const kk = prog(t, this.ctx.start, this.ctx.start + 0.8, ease.outCubic);
    c.globalAlpha = kk;
    c.setLineDash([6, 6]); c.strokeStyle = C.bone_(0.3); c.lineWidth = 1;
    c.strokeRect(FX - 250, 150, 500, lerp(0, CHIP_Y + 60 - 150, kk));
    c.setLineDash([]);
    c.fillStyle = C.bone_(0.8); c.fillRect(FX - 270, 146, 540, 4);
    c.restore();
  }

  private lattice(c: CanvasRenderingContext2D, t: number) {
    const { x, y, s } = LAT;
    const k = prog(t, this.ctx.start + 0.2, this.ctx.start + 1.0, ease.outCubic);
    if (k <= 0) return;
    c.save();
    c.globalAlpha = k;
    c.strokeStyle = C.bone_(0.7); c.lineWidth = 1.25; c.strokeRect(x, y, s, s);
    mono(c, 'DETAIL B · QPU LATTICE', x, y - 14, 12, C.bone_(0.6), { track: 3 });
    const q = this.qubits(t);
    const N = 32, pitch = s / N;
    const lastBeat = [...this.beats].reverse().find((b) => t >= b) ?? -9;
    const fresh = pulse(t, lastBeat, 0.25);
    const prevQ = this.qubits(lastBeat - 0.01);
    for (let i = 0; i < Math.min(q, N * N); i++) {
      // fill order: a centred spiral-ish order so the lattice grows from the middle
      const id = ORDER[i]!;
      const gx = id % N, gy = Math.floor(id / N);
      const px = x + (gx + 0.5) * pitch, py = y + (gy + 0.5) * pitch;
      const isNew = i >= prevQ;
      c.fillStyle = isNew && fresh > 0.02 ? C.glacier : C.bone_(0.75);
      c.beginPath(); c.arc(px, py, isNew ? 2.2 + fresh * 2 : 2.2, 0, Math.PI * 2); c.fill();
    }
    c.restore();
    c.save();
    c.globalAlpha = k;
    const logical = t >= this.L11.words[2]!.start ? 1 : 0;
    mono(c, 'PHYSICAL', x, y + s + 34, 11, C.bone_(0.5), { track: 3 });
    c.font = font(F.mono(600), 44); c.fillStyle = C.bone; c.textAlign = 'left'; c.letterSpacing = '-1px';
    c.fillText(q.toLocaleString('en-US'), x, y + s + 82);
    mono(c, 'LOGICAL', x + 250, y + s + 34, 11, C.bone_(0.5), { track: 3 });
    c.font = font(F.mono(600), 44); c.fillStyle = C.glacier;
    c.fillText(String(logical), x + 250, y + s + 82);
    c.restore();
  }

  private ruler(c: CanvasRenderingContext2D, t: number) {
    const k = prog(t, this.L11.start - 0.6, this.L11.start + 0.2, ease.outCubic);
    if (k <= 0) return;
    const yp = lerp(2024, 2031, prog(t, this.tSlide0, this.tNearly + 0.05, ease.inOutCubic));
    const X = (y: number) => W / 2 + (y - yp) * PX_YEAR;
    c.save();
    c.globalAlpha = k;
    // baseline + year ticks
    line(c, 0, RULER_Y, W, RULER_Y, C.bone_(0.6), 1.25);
    c.font = font(MONO, 13); c.textAlign = 'center'; c.letterSpacing = '1px';
    for (let y = 2014; y <= 2046; y++) {
      const x = X(y);
      if (x < -50 || x > W + 50) continue;
      for (let q = 1; q < 4; q++) line(c, x + (q * PX_YEAR) / 4, RULER_Y, x + (q * PX_YEAR) / 4, RULER_Y + 6, C.bone_(0.3));
      line(c, x, RULER_Y, x, RULER_Y + 14, C.bone_(0.75), 1.25);
      c.fillStyle = C.bone_(0.65); c.fillText(String(y), x, RULER_Y + 34);
    }
    // the experts' decade
    const bk = prog(t, this.tDecade - 0.05, this.tDecade + 0.6, ease.inOutCubic);
    if (bk > 0) {
      const x0 = X(2024), x1 = X(2034), by = RULER_Y - 46;
      c.strokeStyle = C.bone; c.lineWidth = 1.25;
      c.beginPath();
      c.moveTo(x0, by + 14); c.lineTo(x0, by); c.lineTo(lerp(x0, x1, bk), by);
      if (bk >= 1) c.lineTo(x1, by + 14);
      c.stroke();
      mono(c, 'A DECADE · EXPERT ESTIMATE, 2024', x0 + 8, by - 10, 12, C.bone_(0.8 * bk), { track: 2.5 });
      if (bk >= 1) mono(c, 'Q-DAY?', x1, by - 10, 12, C.bone, { align: 'center', track: 2.5 });
    }
    c.restore();
    // the playhead: fixed, cold
    c.save();
    c.globalAlpha = k;
    c.strokeStyle = C.glacier; c.lineWidth = 2;
    c.beginPath(); c.moveTo(W / 2, RULER_Y - 80); c.lineTo(W / 2, RULER_Y + 44); c.stroke();
    c.fillStyle = C.glacier;
    c.beginPath(); c.moveTo(W / 2 - 7, RULER_Y - 80); c.lineTo(W / 2 + 7, RULER_Y - 80); c.lineTo(W / 2, RULER_Y - 70); c.fill();
    mono(c, `NOW · ${this.ctr.year(t)}`, W / 2 + 12, RULER_Y - 68, 13, C.glacier, { track: 3 });
    c.restore();
  }

  override post(f: Frame) {
    let hit = 0;
    for (const b of this.beats) hit = Math.max(hit, pulse(f.t, b, 0.08));
    return { bloom: 0.3, vignette: 0.45, zoom: 1 + 0.004 * f.a.kick + 0.006 * hit };
  }
  override ground(_f: Frame, out: import('three').WebGLRenderTarget) {
    this.bg.render(this.ctx.renderer, out, { grid: 0.3, gridStep: 46, seed: 8.2 });
  }
}

const f01 = (x: number) => 0.5 + 0.5 * Math.sin(x);
/** Lattice fill order: cells sorted by distance from the centre (ties broken by a hash), so the chip grows outward. */
const ORDER: number[] = (() => {
  const N = 32, ids: [number, number][] = [];
  for (let i = 0; i < N * N; i++) {
    const gx = i % N - (N - 1) / 2, gy = Math.floor(i / N) - (N - 1) / 2;
    ids.push([i, Math.max(Math.abs(gx), Math.abs(gy)) + hash(i, 5) * 0.9]);
  }
  return ids.sort((a, b) => a[1] - b[1]).map((x) => x[0]);
})();
