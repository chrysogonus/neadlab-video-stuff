// TICKET — FIG. 8, the bridge (L20–21). Bone paper, ink: the comic centre, all paperwork.
// SEC-4471 fills the frame. On "Ticket opened" its fields type in; on "low" PRIORITY: LOW is
// stamped. On L21 the due date is stamped and re-stamped four times — one per year step, each a
// year later, each earlier stamp struck through, the stamps overlapping and getting sloppier —
// and an automatic comment logs every push. Among the watchers, quietly: TAP·07.
import { type Frame } from '../engine/scene';
import { F, font } from '../engine/type';
import type { Line } from '../engine/lyrics';
import { clamp, ease, lerp, prog, pulse } from '../engine/util';
import { C, Plate, W, H, MONO, MONO_M, bottomUp, drawKaraoke, layoutWords, line, mono, stamp, type KLayout } from './_kit';

const T = { x: 150, y: 160, w: 1080, h: 640 };
const LOG = { x: 1290, y: 160, w: 480 };
const LYR_Y = 975;

export default class Ticket extends Plate {
  L20!: Line; L21!: Line;
  k20!: KLayout; k21!: KLayout;
  tTicket = 0; tOpened = 0; tLow = 0;
  pushes: { t: number; year: number }[] = [];

  override setup() {
    this.L20 = this.line('Ticket opened');
    this.L21 = this.line('Pushed to next quarter');
    const fam = F.archivo(100, 700);
    this.k20 = layoutWords(this.L20.words, fam, 64, 1720);
    this.k21 = layoutWords(this.L21.words, fam, 64, 1720);
    const w = this.L20.words;
    this.tTicket = w[0]!.start; this.tOpened = w[1]!.start; this.tLow = w[w.length - 1]!.start;
    // the pushes are the counters' year steps inside L21 (one source of truth for the year)
    this.pushes = this.ctr.steps.filter(([ts]) => ts >= this.L21.start - 0.01 && ts <= this.L21.end).map(([ts, y]) => ({ t: ts, year: y }));
  }

  draw(c: CanvasRenderingContext2D, f: Frame) {
    const t = f.t;
    const z = lerp(1.0, 1.035, prog(t, this.ctx.start, this.ctx.end, ease.inOutQuad));
    c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2);

    mono(c, 'FIG. 8', 96, 108, 13, C.glacierInk, { track: 3 });
    mono(c, 'PROCESS · AS FOLLOWED', 176, 108, 13, C.ink_(0.6), { track: 3 });
    mono(c, `${this.ctr.year(t)}`, W - 96, 108, 13, C.glacierInk, { align: 'right', track: 3 });

    this.sheet(c, t);
    this.log(c, t);

    const st = { sung: C.ink, unsung: C.ink_(0.2), active: C.glacierInk, lift: 4, align: 'center' as const };
    for (const [l, k, nx] of [[this.L20, this.k20, this.L21], [this.L21, this.k21, null]] as const) {
      const until = nx ? nx.start - 0.15 : this.ctx.end + 1;
      const a = clamp(Math.min((t - (l.start - 0.4)) / 0.3, (until - t) / 0.2));
      if (a <= 0) continue;
      c.save(); c.globalAlpha = a;
      drawKaraoke(c, k, t, W / 2, bottomUp(k, LYR_Y), st);
      c.restore();
    }
  }

  private sheet(c: CanvasRenderingContext2D, t: number) {
    const { x, y, w, h } = T;
    const k = prog(t, this.ctx.start, this.ctx.start + 0.5, ease.outCubic);
    c.save();
    c.globalAlpha = k;
    c.fillStyle = C.ink; c.fillRect(x, y, w * k, 64);
    // header, typed on "Ticket"
    const head = 'SEC-4471 · Migrate to post-quantum KEM';
    const n = Math.floor(head.length * prog(t, this.tTicket - 0.1, this.tOpened));
    c.font = font(F.mono(600), 26); c.fillStyle = C.bone; c.textAlign = 'left'; c.letterSpacing = '0.5px';
    c.fillText(head.slice(0, n), x + 28, y + 42);
    c.strokeStyle = C.ink; c.lineWidth = 1.5; c.strokeRect(x, y, w, h);
    // fields
    const fy = y + 120, lh = 62;
    const field = (label: string, v: string, i: number, show: number, col = C.ink) => {
      const yy = fy + i * lh;
      mono(c, label, x + 32, yy, 12, C.ink_(0.55), { track: 3 });
      line(c, x + 32, yy + 14, x + 520, yy + 14, C.ink_(0.15));
      if (show <= 0) return;
      c.font = font(MONO_M, 22); c.fillStyle = col; c.textAlign = 'left'; c.letterSpacing = '0.5px';
      c.fillText(v.slice(0, Math.ceil(v.length * show)), x + 200, yy + 4);
    };
    const opened = prog(t, this.tOpened, this.tOpened + 0.6);
    field('REPORTER', 'Security', 0, prog(t, this.tTicket, this.tTicket + 0.4));
    field('ASSIGNEE', 'You', 1, prog(t, this.tTicket + 0.2, this.tTicket + 0.5));
    field('OPENED', '14 Sep 2031', 2, opened);
    field('PRIORITY', '', 3, 0);
    const pushes = this.pushes.filter((p) => t >= p.t).length;
    field('STATUS', pushes === 0 ? 'To do' : `Deferred${pushes > 1 ? ` (×${pushes})` : ''}`, 4, opened);
    // PRIORITY: LOW, stamped
    const sl = prog(t, this.tLow - 0.02, this.tLow + 0.5);
    if (sl > 0) stamp(c, 'LOW', x + 270, fy + 3 * lh - 4, 34, -0.05, C.glacierInk, sl, 101, { ink: 0.85 });
    // watchers (right column of the sheet)
    mono(c, 'WATCHERS', x + 620, fy, 12, C.ink_(0.55), { track: 3 });
    ['You', 'Security', 'Compliance', 'TAP·07'].forEach((nm, i) => {
      const on = t >= this.tOpened + 0.3 + i * 0.25;
      if (!on) return;
      c.font = font(MONO_M, 20); c.fillStyle = nm === 'TAP·07' ? C.glacierInk : C.ink; c.textAlign = 'left'; c.letterSpacing = '0.5px';
      c.fillText(nm, x + 620, fy + 40 + i * 34);
    });
    // the due-date box: four stamps, each later, each sloppier; the earlier ones struck
    const by = y + h - 210;
    line(c, x + 32, by - 20, x + w - 32, by - 20, C.ink_(0.3));
    mono(c, 'DUE', x + 32, by + 4, 12, C.ink_(0.55), { track: 3 });
    c.font = font(MONO_M, 26); c.fillStyle = C.ink; c.textAlign = 'left';
    c.fillText('Q3 2032', x + 32, by + 52);
    this.pushes.forEach((p, i) => {
      if (t < p.t - 0.02) return;
      const sk = prog(t, p.t - 0.02, p.t + 0.5);
      const sx = x + 330 + i * 190, sy = by + 60 + (i % 2 ? 18 : -10);
      const rot = [-0.06, 0.09, -0.15, 0.2][i]!;
      stamp(c, `Q3 ${p.year}`, sx, sy, 34 + i * 2, rot, i === this.pushes.length - 1 ? C.glacierInk : C.ink, sk, 120 + i, { ink: 0.85 - i * 0.1 });
    });
    // strike-throughs: the base date at the first push, each stamp at the next
    const strikes = [{ x0: x + 26, x1: x + 150, yy: by + 44 }, ...this.pushes.slice(0, -1).map((_, i) => ({ x0: x + 330 + i * 190 - 85, x1: x + 330 + i * 190 + 85, yy: by + 60 + (i % 2 ? 18 : -10) }))];
    strikes.forEach((s, i) => {
      const p = this.pushes[i];
      if (!p) return;
      const sp = prog(t, p.t + 0.05, p.t + 0.3, ease.inOutCubic);
      if (sp > 0) line(c, s.x0, s.yy, lerp(s.x0, s.x1, sp), s.yy - 4, C.ink, 3);
    });
    c.restore();
  }

  /** Activity log: one automatic comment per push. */
  private log(c: CanvasRenderingContext2D, t: number) {
    const { x, y, w } = LOG;
    const k = prog(t, this.tOpened, this.tOpened + 0.5, ease.outCubic);
    if (k <= 0) return;
    c.save();
    c.globalAlpha = k;
    mono(c, 'ACTIVITY', x, y + 20, 12, C.ink_(0.6), { track: 3 });
    line(c, x, y + 34, x + w, y + 34, C.ink_(0.3));
    const entries: { t: number; a: string; b: string }[] = [
      { t: this.tOpened, a: 'Security opened this ticket', b: '14 Sep 2031' },
      { t: this.tLow, a: 'Priority set to Low', b: '14 Sep 2031' },
      ...this.pushes.map((p, i) => ({ t: p.t, a: `You moved Due: Q3 ${p.year - 1} → Q3 ${p.year}`, b: i === 3 ? '“next quarter, for sure”' : `${12 + i} Jul ${p.year - 1}` })),
    ];
    let yy = y + 76;
    for (const e of entries) {
      if (t < e.t) break;
      const a = prog(t, e.t, e.t + 0.25, ease.outCubic);
      c.globalAlpha = k * a;
      c.fillStyle = C.ink; c.beginPath(); c.arc(x + 6, yy - 6, 4, 0, Math.PI * 2); c.fill();
      c.font = font(MONO, 17); c.textAlign = 'left'; c.letterSpacing = '0px';
      c.fillText(e.a, x + 22 + (1 - a) * 20, yy);
      mono(c, e.b, x + 22, yy + 22, 11, C.ink_(0.5), { track: 1.5 });
      yy += 64;
    }
    c.restore();
  }

  override post(f: Frame) {
    let hit = pulse(f.t, this.tLow, 0.1);
    for (const p of this.pushes) hit = Math.max(hit, pulse(f.t, p.t, 0.1));
    return { bloom: 0.15, vignette: 0.25, paper: 1, grain: 0.045, zoom: 1 + 0.012 * hit, shake: [hit * 3, hit * 2] as [number, number] };
  }
  override ground(_f: Frame, out: import('three').WebGLRenderTarget) {
    this.bg.render(this.ctx.renderer, out, { paper: 1, grid: 0, seed: 11.3 });
  }
}
