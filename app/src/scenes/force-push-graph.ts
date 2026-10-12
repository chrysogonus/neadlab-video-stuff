// FORCE PUSH — the repository, three years (cues pad, L03–L06). Dark.
// Opens on the intro's last command (`git log --graph --all`, top left). Over the pad the singer's commits
// stamp in along `main`, one per beat, on a 2023–2026 axis; the commit count is the hero. Then the verse:
// "Three years" spans the axis; on "commit" a hollow ring tries to join main and falls away; on "stash" a
// "me" disc drops into `stash@{0}`; "just a feature" pins a `feature` pill; "nothing on the side" labels
// an empty lane above; on "found" that lane unfolds — the ex's commits, coral, on `other` — the first coral.
import { type Frame } from '../engine/scene';
import { clamp, ease, lerp, prog } from '../engine/util';
import { FPScene, FONT, M, W, MAIN, OTHER, arrive, camera, fitWords, hit, lineShow, monoText, node, sing, strike, text, typed } from '../force-push/kit';
import { GX, GY, R, SIDE_FROM, SIDE_Y, SX, branch, edge, label, pointer } from '../force-push/graph';
import type { KLayout } from './_kit';

const HERO = { x: M, y: 262, w: 1200, max: 104 };
const AXIS_Y = 730;
const STASH = { x: 1160, y: 848, w: 600, h: 132 };
const LINES = ['L03', 'L04', 'L05', 'L06'];

export default class Graph extends FPScene {
  beats: number[] = []; // the 16 pad beats (commit stamps)
  lays: KLayout[] = [];
  tYears = 0; tCommit = 0; tStash = 0; tGetTo = 0; tFeature = 0; tSide = 0; tFound = 0; tHide = 0; tDrums = 0;

  override setup() {
    const au = this.ctx.audio;
    const b0 = Math.round(au.beatAt(this.ctx.start));
    this.beats = MAIN.map((_, i) => au.timeOfBeat(b0 + i));
    this.lays = LINES.map((id) => fitWords(this.line(id).words, FONT.line, HERO.w, HERO.max, 64, 2));
    this.tDrums = this.cue('pad').at;
    this.tYears = this.word('L03', 'years').start;
    this.tCommit = this.word('L03', 'commit').start;
    this.tStash = this.word('L04', 'stash,').start;
    this.tGetTo = this.word('L04', 'get').start;
    this.tFeature = this.word('L05', 'feature,').start;
    this.tSide = this.word('L05', 'side').start;
    this.tFound = this.word('L06', 'found').start;
    this.tHide = this.word('L06', 'hide').start;
  }

  draw(c: CanvasRenderingContext2D, f: Frame) {
    const t = f.t, th = this.th;
    const n = this.beats.filter((b) => t >= b - 0.02).length; // commits stamped
    // a slow push-in, punched on the drum entry and on the reveal
    c.save();
    camera(c, lerp(1, 1.035, prog(t, this.ctx.start, this.ctx.end, ease.inOutQuad)), W / 2, GY);

    // the command the intro typed, now the header
    const open = arrive(t, this.ctx.start, 0.35);
    monoText(c, '~/us main $ git log --graph --all', M, 110, 28, th.a('mist', open), { fam: FONT.monoM });
    // counters, top right
    const you = t >= this.tFound + 0.15 ? `you ${OTHER.length} · elsewhere` : 'you 0';
    monoText(c, `me ${n}`, W - M, 110, 30, th.type, { fam: FONT.monoB, align: 'right' });
    const youCol = t >= this.tFound + 0.15 ? th.coral : th.dim;
    const flick = hit(t, this.tCommit, 0.15);
    monoText(c, you, W - M, 150, 30, flick > 0.05 ? th.type : youCol, { fam: FONT.monoB, align: 'right' });

    this.hero(c, t, n);
    this.axis(c, t, n);
    this.main(c, t, n);
    this.ring(c, t);
    this.stash(c, t);
    this.feature(c, t);
    this.side(c, t);
    c.restore();
  }

  /** Over the pad: the commit count as the hero; then the verse lines, one at a time. */
  private hero(c: CanvasRenderingContext2D, t: number, n: number) {
    const th = this.th;
    const first = this.line('L03');
    const padOut = clamp((first.start - 0.3 - t) / 0.2);
    if (padOut > 0 && n > 0) {
      c.save(); c.globalAlpha = padOut;
      const s = `${n} commit${n === 1 ? '' : 's'}`;
      text(c, s, HERO.x, HERO.y, FONT.hero, 120, th.type);
      monoText(c, 'us.git · 2023 → 2026 · author: me', HERO.x + 4, HERO.y + 60, 28, th.mist, { fam: FONT.monoM });
      c.restore();
    }
    const seq = LINES.map((id) => this.line(id));
    LINES.forEach((id, i) => {
      const a = lineShow(t, seq, i, this.ctx.end + 1);
      if (a <= 0) return;
      c.save(); c.globalAlpha = a;
      const color: Record<string, string> = id === 'L06' && t >= this.tFound ? { other: th.coral, branch: th.coral } : {};
      sing(c, this.lays[i]!, t, HERO.x, HERO.y - (1 - a) * 14, th, { color });
      c.restore();
    });
  }

  private axis(c: CanvasRenderingContext2D, t: number, n: number) {
    const th = this.th;
    const p = prog(t, this.ctx.start + 0.1, this.beats[this.beats.length - 1]! + 0.3, ease.inOutCubic);
    const x0 = GX(0) - 40, x1 = GX(MAIN.length - 1) + 60;
    edge(c, x0, AXIS_Y, x1, AXIS_Y, th.rule, 2, p);
    for (const [yr, i] of [[2023, 0], [2024, 5], [2025, 10], [2026, 15]] as const) {
      if (n <= i) continue;
      c.fillStyle = th.rule; c.fillRect(GX(i) - 1, AXIS_Y - 8, 2, 16);
      label(c, String(yr), GX(i), AXIS_Y + 40, th.mist, 24);
    }
    // "Three years": a dimension spanning the history
    const d = prog(t, this.tYears - 0.05, this.tYears + 0.35, ease.outCubic);
    if (d > 0) {
      const y = AXIS_Y + 78, xa = GX(0), xb = lerp(GX(0), GX(MAIN.length - 1), d);
      c.strokeStyle = th.type; c.lineWidth = 2;
      c.beginPath(); c.moveTo(xa, y); c.lineTo(xb, y); c.moveTo(xa, y - 10); c.lineTo(xa, y + 10); c.moveTo(xb, y - 10); c.lineTo(xb, y + 10); c.stroke();
      const lw = 190;
      c.fillStyle = th.bg; c.fillRect((xa + xb) / 2 - lw / 2, y - 18, lw, 36);
      monoText(c, '3 YEARS', (xa + xb) / 2, y + 10, 28, th.type, { fam: FONT.monoB, align: 'center', track: 3 });
    }
  }

  private main(c: CanvasRenderingContext2D, t: number, n: number) {
    const th = this.th;
    for (let i = 0; i < MAIN.length; i++) {
      const tb = this.beats[i]!;
      if (t < tb - 0.02) break;
      const k = arrive(t, tb - 0.02, 0.18);
      if (i > 0) edge(c, GX(i - 1) + R, GY, GX(i) - R, GY, th.a('type', 0.6), 5, k);
      node(c, GX(i), GY, R, 'me', th.type, { a: k });
      label(c, MAIN[i]!.h, GX(i), GY + 46, th.a('dim', k), 18);
    }
    if (n === 0) return;
    // the newest commit's message above it while the pad runs
    const tip = n - 1, last = this.beats[tip]!;
    const msgA = clamp((this.line('L03').start - t) / 0.3) * arrive(t, last, 0.12);
    if (msgA > 0) label(c, MAIN[tip]!.m, GX(tip), GY - 110, th.a('mist', msgA), 24);
    // main / HEAD ride on the tip
    pointer(c, 'HEAD → main', GX(tip), GY, th, { dy: 66, size: 24, glow: true });
  }

  /** "you never could commit": a ring tries to join the tip and falls away. */
  private ring(c: CanvasRenderingContext2D, t: number) {
    const th = this.th, t0 = this.tCommit - 0.25;
    const u = prog(t, t0, t0 + 1.6);
    if (u <= 0 || u >= 1) return;
    const tipX = GX(MAIN.length - 1) + 96;
    // falls in towards the tip, misses, drops away
    const dropIn = ease.outCubic(clamp(u / 0.35));
    const fall = ease.inQuad(clamp((u - 0.45) / 0.55));
    const x = tipX, y = lerp(GY - 230, GY, dropIn) + fall * 320;
    c.save(); c.globalAlpha = 1 - fall;
    edge(c, GX(MAIN.length - 1) + R, GY, tipX - R, GY, th.a('type', 0.5), 3, clamp((u - 0.25) / 0.15) * (1 - clamp((u - 0.4) / 0.05)), [6, 6]);
    node(c, x, y, R, 'you', th.mist, { ring: 4 });
    if (u > 0.38) monoText(c, 'not committed', x, y - 34, 24, th.mist, { fam: FONT.monoM, align: 'center' });
    c.restore();
  }

  /** "Hid me in your stash": a drawer slides up; a "me" disc drops into it. */
  private stash(c: CanvasRenderingContext2D, t: number) {
    const th = this.th;
    const o = arrive(t, this.tStash - 0.25, 0.3);
    if (o <= 0) return;
    const { x, w, h } = STASH, y = STASH.y + (1 - o) * 60;
    c.save(); c.globalAlpha = o;
    c.beginPath(); c.roundRect(x, y, w, h, 12);
    c.fillStyle = th.panel; c.fill(); c.strokeStyle = th.rule; c.lineWidth = 2; c.stroke();
    monoText(c, 'stash@{0}: WIP on main', x + 24, y + 44, 26, th.type, { fam: FONT.monoB });
    // the TODO and its age ("said we'd get to it")
    const todo = typed('# TODO: get to it', t, this.tGetTo - 0.1, this.tGetTo + 0.7);
    monoText(c, todo, x + 24, y + 88, 24, th.mist, { fam: FONT.monoM });
    if (t > this.tGetTo + 0.8) monoText(c, '(3 years ago)', x + w - 24, y + 88, 24, th.dim, { fam: FONT.monoM, align: 'right' });
    c.restore();
    // the disc: lifts off the third-newest commit and drops into the drawer on "stash"
    const u = prog(t, this.tStash - 0.2, this.tStash + 0.45);
    if (u > 0) {
      const sx = GX(12), sy = GY, ex = x + w - 60, ey = STASH.y + 44 - 9;
      const e = ease.inOutCubic(u);
      const px = lerp(sx, ex, e), py = lerp(sy, ey, e) - Math.sin(Math.PI * e) * 120;
      node(c, px, py, R, 'me', th.type);
      if (u >= 1) monoText(c, 'me', ex - 30, ey + 9, 24, th.type, { fam: FONT.monoB, align: 'right' });
      // where it was: a hollow gap on main
      c.save(); c.globalAlpha = clamp(u * 3);
      node(c, sx, sy, R + 1, 'me', th.bg);
      node(c, sx, sy, R, 'you', th.dim, { ring: 2.5 });
      c.restore();
    }
  }

  /** "Said it's just a feature, nothing on the side". */
  private feature(c: CanvasRenderingContext2D, t: number) {
    const th = this.th;
    const k = arrive(t, this.tFeature - 0.05, 0.22);
    if (k <= 0) return;
    const x = GX(9);
    c.save(); c.globalAlpha = k;
    pointer(c, 'feature', x, GY, th, { col: th.mist, solid: false, dy: 66 + (1 - k) * 20 });
    monoText(c, 'just a', x - 66, GY - 66 + 9, 24, th.dim, { fam: FONT.monoM, align: 'right' });
    c.restore();
  }

  /** The side lane: "(none)" — then on "found" it unfolds into the ex's `other` branch, coral. */
  private side(c: CanvasRenderingContext2D, t: number) {
    const th = this.th;
    const k = arrive(t, this.tSide - 0.05, 0.3);
    if (k <= 0) return;
    const x0 = GX(SIDE_FROM), xEnd = SX(OTHER.length - 1);
    const reveal = prog(t, this.tFound - 0.05, this.tFound + 0.9, ease.inOutCubic);
    // the empty lane (dashed), labelled side: (none)
    c.save(); c.globalAlpha = k * (1 - reveal * 0.85);
    edge(c, x0 + 150, SIDE_Y, xEnd + 40, SIDE_Y, th.dim, 2, k, [4, 10]);
    c.restore();
    const lx = xEnd + 70;
    monoText(c, 'side:', lx, SIDE_Y + 9, 26, th.a('dim', k), { fam: FONT.monoM });
    const nx = lx + 92;
    const nw = monoText(c, '(none)', nx, SIDE_Y + 9, 26, th.a('mist', k), { fam: FONT.monoB });
    strike(c, nx - 4, SIDE_Y, nx + nw + 4, prog(t, this.tHide, this.tHide + 0.25, ease.outCubic), th.coral, 4);
    if (reveal <= 0) return;
    // the branch: off main at SIDE_FROM, the ex's commits as coral rings
    branch(c, x0 + R * 0.7, GY - R * 0.7, SX(0) - R, SIDE_Y, th.coral, 4, clamp(reveal * 2));
    OTHER.forEach((cm, j) => {
      const kj = clamp((reveal - 0.25 - j * 0.1) / 0.25);
      if (kj <= 0) return;
      if (j > 0) edge(c, SX(j - 1) + R, SIDE_Y, SX(j) - R, SIDE_Y, th.coral, 4, kj);
      node(c, SX(j), SIDE_Y, R, 'you', th.coral, { a: kj, ring: 4.5 });
      // (labels alternate above and below the lane so they never collide)
      label(c, cm.m, SX(j), j % 2 ? SIDE_Y + 46 : SIDE_Y - 32, th.a('coral', kj * 0.9), 20);
    });
    const tipA = clamp((reveal - 0.75) / 0.25);
    if (tipA > 0) pointer(c, 'other', SX(OTHER.length - 1), SIDE_Y, th, { col: th.coral, dy: 70, a: tipA, glow: true });
  }

  override post(f: Frame) {
    const k = Math.max(hit(f.t, this.tDrums, 0.1), hit(f.t, this.tFound, 0.12) * 0.8);
    return { zoom: 1 + 0.012 * k, shake: [k * 2, -k * 1.5] as [number, number] };
  }
}
