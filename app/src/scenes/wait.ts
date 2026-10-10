// WAIT ×3 — FIG. 4, the hook plate (choruses). A patience instrument: a hairline calendar dial
// whose ring runs 2021 → 2037, a hand that points at the year the archive has reached, an inner
// ring that lights one tick per bar waited, the elapsed wait as a faint sector, and the year (or
// the archive's size) at its centre. The sung line runs under it; the title line slams in one word
// per hit at full frame. After the title the camera pulls back: this dial is one of fifteen.
//   n=1  bone on ink, clean.
//   n=2  bone paper, ink, heavier; the archive's size takes the centre; the dial is crowded.
//   n=3  past tense. Heavy type, no title line; the hand completes the circle as the plate ends.
import { type Frame } from '../engine/scene';
import { F, font, fitSize, measure } from '../engine/type';
import type { Line, Word } from '../engine/lyrics';
import { clamp, ease, hash, lerp, mulberry32, prog, pulse, TAU } from '../engine/util';
import { C, Plate, W, H, MONO_B, MONO_M, drawKaraoke, fmtBytes, hexStr, layoutWords, mixC, mono, type KLayout } from './_kit';

const Y0 = 2021, Y1 = 2037; // the dial's ring
const CX = 960, CY = 440, R = 290;
const LYR_Y = 930;

interface Pal { ink: string; dim: (a: number) => string; accent: string; accent_: (a: number) => string; paper: number }

export default class Wait extends Plate {
  n = 1;
  lines: Line[] = [];
  lays: KLayout[] = [];
  title: Line | null = null;
  titleSize = 300;
  t0 = 0; // first chorus's first word: the wait's tick origin
  bar = 2.48;
  pal!: Pal;
  others: { lit: number; label: string }[] = [];

  override setup() {
    const ly = this.ctx.lyrics;
    this.n = Number(this.ctx.params.n ?? 1);
    const k = this.n - 1;
    if (this.n < 3) {
      this.lines = [ly.get("I'll wait for you", k), ly.get('Every byte', k), ly.get("I'll see you sooner", k)];
      this.title = ly.get('Harvest now', k);
    } else {
      this.lines = [ly.get('I waited for you'), ly.get('Every byte', 2)];
    }
    const fam = this.n === 1 ? F.archivo(100, 700) : F.archivo(100, 900);
    const size = this.n === 3 ? 104 : 74;
    this.lays = this.lines.map((l) => layoutWords(l.words, fam, size, 1640));
    if (this.title) {
      const [a, b, c2, d] = this.title.words.map((w) => w.w.toUpperCase());
      const tf = F.archivo(125, 900);
      this.titleSize = Math.min(fitSize(`${a} ${b}`, tf, 1660, 340), fitSize(`${c2} ${d}`, tf, 1660, 340));
    }
    this.t0 = ly.get("I'll wait for you", 0).words[0]!.start;
    this.bar = 4 * 60 / this.ctx.audio.bpm;
    this.pal = this.n === 2
      ? { ink: C.ink, dim: C.ink_, accent: C.glacierInk, accent_: C.glacierInk_, paper: 1 }
      : { ink: C.bone, dim: C.bone_, accent: C.glacier, accent_: C.glacier_, paper: 0 };
    const rnd = mulberry32(400 + this.n);
    for (let i = 0; i < 15; i++) this.others.push({ lit: Math.floor(rnd() * 24), label: `SUBJECT ${String(1 + i * 37 + Math.floor(rnd() * 30)).padStart(5, '0')}` });
  }

  /** The year as a continuous value for the hand: eases between the counters' steps; n=3 completes the ring. */
  private yearC(t: number) {
    if (this.n === 3) return lerp(2036, Y1, prog(t, this.ctx.start, this.ctx.end - 0.05, ease.inOutCubic));
    const st = this.ctr.steps;
    let y = st[0]![1];
    for (let i = 1; i < st.length; i++) {
      const [ts, v] = st[i]!;
      if (t >= ts) y = lerp(st[i - 1]![1], v, prog(t, ts, ts + 0.9, ease.inOutCubic));
    }
    return y;
  }

  draw(c: CanvasRenderingContext2D, f: Frame) {
    const t = f.t, P = this.pal;
    const tl = this.title;
    // title phase: the dial recedes while the words slam; after it, the pull-back to fifteen dials
    const tIn = tl ? prog(t, tl.start - 0.25, tl.start + 0.05) : 0;
    const tEnd = tl ? tl.end + this.bar * 0.75 : Infinity;
    const tOut = tl ? prog(t, tEnd, tEnd + 0.6, ease.inOutCubic) : 0;
    const pull = tl ? prog(t, tEnd + 0.2, Math.min(this.ctx.end, tEnd + 3.2), ease.inOutCubic) : 0;
    const dialA = lerp(1, 0.12, tIn * (1 - tOut));
    const s = lerp(1, 0.37, pull);

    // header
    mono(c, `FIG. 4${'abc'[this.n - 1]}`, 96, 92, 13, P.accent, { track: 3 });
    mono(c, this.n === 3 ? 'PATIENCE · CONCLUDED' : 'PATIENCE', 186, 92, 13, P.dim(0.5), { track: 3 });
    mono(c, `${this.ctr.year(t)}`, W - 96, 92, 13, P.accent, { align: 'right', track: 3 });

    // the dial(s)
    c.save();
    c.translate(CX, CY + pull * 50); c.scale(s, s); c.translate(-CX, -CY);
    c.globalAlpha = dialA;
    const draw = prog(t, this.ctx.start, this.ctx.start + 0.7, ease.outCubic);
    const hand = (this.yearC(t) - Y0) / (Y1 - Y0);
    const lit = Math.max(0, Math.floor((t - this.t0) / this.bar) + 1);
    if (pull > 0) {
      let i = 0;
      for (let gy = -1; gy <= 1; gy++) for (let gx = -2; gx <= 2; gx++) {
        if (gx === 0 && gy === 0) continue;
        const o = this.others[i++]!;
        c.save();
        c.globalAlpha = dialA * pull;
        // every subject is waiting on the same calendar: the hands move as one
        this.dial(c, t, CX + gx * 760, CY + gy * 760, 1, hand, o.lit + lit, false, o.label, i);
        c.restore();
      }
    }
    this.dial(c, t, CX, CY, draw, hand, lit, true, 'SUBJECT 00001 · “M.”', 0);
    c.restore();
    if (pull > 0) {
      c.save(); c.globalAlpha = pull;
      c.fillStyle = P.paper ? C.bone_(0.92) : C.ink_(0.92);
      c.fillRect(W / 2 - 330, H - 92, 660, 40);
      mono(c, '15 SUBJECTS · ALL PENDING · NONE URGENT', W / 2, H - 66, 14, P.dim(0.7), { align: 'center', track: 4 });
      c.restore();
    }

    // the sung lines under the dial
    const st = { sung: P.ink, unsung: P.dim(0.2), active: P.accent, lift: this.n === 3 ? 6 : 4, align: 'center' as const };
    this.lines.forEach((l, i) => {
      const next = this.lines[i + 1] ?? tl;
      const until = next ? next.start - 0.12 : this.ctx.end + 1;
      const a = clamp(Math.min((t - (l.start - 0.4)) / 0.3, (until - t) / 0.18));
      if (a <= 0) return;
      const lay = this.lays[i]!;
      const rows = lay.rows.length;
      const y = this.n === 3 ? 980 - (rows - 1) * lay.size * 1.0 : LYR_Y;
      c.save();
      c.globalAlpha = a;
      drawKaraoke(c, lay, t, W / 2, y + (1 - ease.outCubic(clamp((t - (l.start - 0.4)) / 0.4))) * 16, st);
      c.restore();
    });

    // the title: one word per hit, full frame
    if (tl && tIn > 0 && tOut < 1) this.slam(c, t, tl, 1 - tOut);
  }

  private slam(c: CanvasRenderingContext2D, t: number, tl: Line, a: number) {
    const P = this.pal;
    const fam = F.archivo(125, 900), sz = this.titleSize;
    const ws = tl.words;
    const rowsTxt = [[ws[0]!, ws[1]!], [ws[2]!, ws[3]!]] as Word[][];
    const top = H / 2 - 0.82 * sz;
    const base = [top + 0.72 * sz, top + 0.72 * sz + 0.92 * sz];
    c.save();
    c.globalAlpha = a;
    c.font = font(fam, sz); c.textBaseline = 'alphabetic'; c.textAlign = 'left'; c.letterSpacing = '-4px';
    const sp = measure(' ', fam, sz) - 4;
    rowsTxt.forEach((row, ri) => {
      const txt = row.map((w) => w.w.toUpperCase());
      const widths = txt.map((s) => measure(s, fam, sz, -4));
      const rw = widths[0]! + sp + widths[1]!;
      let x = W / 2 - rw / 2;
      row.forEach((w, wi) => {
        const on = t >= w.start - 0.02;
        if (on) {
          const k = prog(t, w.start - 0.02, w.start + 0.16, ease.outCubic);
          const sc = lerp(1.22, 1, k);
          const cx = x + widths[wi]! / 2, cy = base[ri]! - sz * 0.36;
          const settle = 1 - prog(t, w.end, w.end + 0.5);
          c.save();
          c.translate(cx, cy); c.scale(sc, sc); c.translate(-cx, -cy);
          c.globalAlpha = a * clamp(k * 4);
          c.fillStyle = mixC(P.ink, P.accent, t < w.end ? 1 : settle);
          c.fillText(txt[wi]!, x, base[ri]!);
          c.restore();
        } else {
          c.fillStyle = P.dim(0.07);
          c.fillText(txt[wi]!, x, base[ri]!);
        }
        x += widths[wi]! + sp;
      });
    });
    c.restore();
  }

  /** One patience dial. `hand` 0..1 of the ring (2021 → 2037), `lit` bars waited (of 48 ticks). */
  private dial(c: CanvasRenderingContext2D, t: number, cx: number, cy: number, draw: number, hand: number, lit: number, main: boolean, label: string, seed: number) {
    const P = this.pal;
    const a0 = -Math.PI / 2;
    c.save();
    c.lineCap = 'butt';
    // rings
    c.strokeStyle = P.dim(0.55); c.lineWidth = 1.25;
    c.beginPath(); c.arc(cx, cy, R, a0, a0 + TAU * draw); c.stroke();
    c.strokeStyle = P.dim(0.22); c.lineWidth = 1;
    c.beginPath(); c.arc(cx, cy, R - 14, a0, a0 + TAU * draw); c.stroke();
    c.beginPath(); c.arc(cx, cy, R - 64, a0, a0 + TAU * draw); c.stroke();
    // year ticks and labels, quarter ticks between
    const yrs = Y1 - Y0;
    for (let q = 0; q < yrs * 4; q++) {
      const u = q / (yrs * 4);
      if (u > draw) break;
      const ang = a0 + TAU * u;
      const major = q % 4 === 0;
      const r0 = R, r1 = R + (major ? 16 : 7);
      c.strokeStyle = major ? P.dim(0.75) : P.dim(0.35); c.lineWidth = major ? 1.5 : 1;
      c.beginPath(); c.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0); c.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1); c.stroke();
      if (major) {
        const yv = Y0 + q / 4;
        const reached = hand >= u - 1e-4;
        c.save();
        c.translate(cx + Math.cos(ang) * (R + 40), cy + Math.sin(ang) * (R + 40));
        c.font = font(MONO_M, 13); c.textAlign = 'center'; c.textBaseline = 'middle'; c.letterSpacing = '1px';
        c.fillStyle = reached ? P.accent : P.dim(0.45);
        c.fillText(String(yv), 0, 0);
        c.restore();
      }
    }
    // inner ring: one tick per bar waited
    const NT = 48;
    for (let i = 0; i < NT; i++) {
      const ang = a0 + TAU * (i / NT);
      if (i / NT > draw) break;
      const on = i < lit;
      c.strokeStyle = on ? P.accent_(main ? 0.9 : 0.6) : P.dim(0.15); c.lineWidth = on ? 2 : 1;
      const r0 = R - 64, r1 = R - (on ? 26 : 40);
      c.beginPath(); c.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0); c.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1); c.stroke();
    }
    // the elapsed wait: a faint sector and an arc
    const ah = a0 + TAU * clamp(hand);
    c.fillStyle = P.accent_((main ? 0.1 : 0.07) * (P.paper ? 1.6 : 1));
    c.beginPath(); c.arc(cx, cy, R - 14, a0, ah); c.arc(cx, cy, 168, ah, a0, true); c.closePath(); c.fill();
    c.strokeStyle = P.accent; c.lineWidth = 3;
    c.beginPath(); c.arc(cx, cy, R - 7, a0, ah); c.stroke();
    // the hand: from outside the readout to the ring, with a small pivot ring where it would meet the centre
    c.strokeStyle = P.ink; c.lineWidth = 2;
    c.beginPath(); c.moveTo(cx + Math.cos(ah) * 168, cy + Math.sin(ah) * 168); c.lineTo(cx + Math.cos(ah) * (R - 4), cy + Math.sin(ah) * (R - 4)); c.stroke();
    c.fillStyle = P.ink;
    c.beginPath(); c.arc(cx + Math.cos(ah) * 168, cy + Math.sin(ah) * 168, 4, 0, TAU); c.fill();
    // completion (n=3): the ring closes and rings once
    if (main && this.n === 3) {
      const done = pulse(t, this.ctx.end - 0.25, 0.2);
      if (done > 0.02) { c.strokeStyle = P.accent_(done); c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, R + 60 + (1 - done) * 80, 0, TAU); c.stroke(); }
    }
    // the centre readout
    c.globalAlpha *= clamp(draw * 1.5);
    const y = this.ctr.year(t), kept = fmtBytes(this.ctr.bytes(t));
    if (this.n === 2 && main) {
      mono(c, 'ARCHIVE', cx, cy - 74, 12, P.dim(0.55), { align: 'center', track: 4 });
      c.font = font(F.mono(600), 76); c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.letterSpacing = '-2px';
      c.fillStyle = P.accent; c.fillText(kept, cx, cy + 24);
      mono(c, `${y}`, cx, cy + 70, 18, P.ink, { align: 'center', track: 4 });
    } else {
      mono(c, 'YEAR', cx, cy - 78, 12, P.dim(0.55), { align: 'center', track: 4 });
      const fl = main ? this.ctr.yearFlick(t) : 0;
      c.font = font(MONO_B, 96); c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.letterSpacing = '-2px';
      c.fillStyle = mixC(P.ink, P.accent, fl);
      c.fillText(String(y), cx, cy + 30);
      mono(c, main ? `ARCHIVE ${kept}` : `ARCHIVE ${fmtBytes(1e9 * Math.pow(10, hash(seed, 3) * 4))}`, cx, cy + 72, 15, P.accent, { align: 'center', track: 2.5 });
    }
    // name plate under the dial (n=3's heavy type takes that space)
    if (this.n === 3 && main) { c.restore(); return; }
    mono(c, label, cx, cy + R + 86, 12, P.dim(0.6), { align: 'center', track: 3 });
    if (main) mono(c, `KEY ${hexStr(12, 9 + this.n)}… · UNKNOWN`, cx, cy + R + 106, 11, P.dim(0.35), { align: 'center', track: 2 });
    c.restore();
  }

  override post(f: Frame) {
    const tl = this.title;
    let hit = 0;
    if (tl) for (const w of tl.words) hit = Math.max(hit, pulse(f.t, w.start, 0.09));
    return { bloom: 0.3, vignette: this.n === 2 ? 0.25 : 0.45, paper: this.pal.paper, zoom: 1 + 0.004 * f.a.kick + 0.022 * hit, shake: [hit * 4, -hit * 3] as [number, number] };
  }
  override ground(_f: Frame, out: import('three').WebGLRenderTarget) {
    this.bg.render(this.ctx.renderer, out, { paper: this.pal.paper, grid: 0, seed: 5 + this.n, light: 0.8 });
  }
}

