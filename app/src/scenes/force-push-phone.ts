// FORCE PUSH — the phone and the .gitignore (L29–L32). Paper mode.
// "Your pull requests keep lighting up my phone": PR notifications stack on a phone, one per word, and the
// screen lights. "Please review? Honey, you're on your own": the review request — reviewers (none),
// approvals 0 / 1. "Wrote your name at the top of my git-ignore": the phone steps aside for `.gitignore`;
// line 1, `you`, typed on "name". "Whatever you send, I don't see it anymore": files fly in and grey out,
// ignored; `git status` lights "nothing to commit" again (the intro's half, not yet the clean one).
import { type Frame } from '../engine/scene';
import { clamp, ease, lerp, prog } from '../engine/util';
import { FPScene, FONT, M, W, theme, arrive, fitWords, hit, lineShow, monoText, panel, pill, sing, strike, typed } from '../force-push/kit';
import type { KLayout } from './_kit';

const HERO = { x: M, y: 262, w: 900 };
const PH = { x: 1180, y: 120, w: 420, h: 820 };
const LINES = ['L29', 'L30', 'L31', 'L32'];
const PRS = ['#12  can we talk?', '#13  revert pls', '#14  i miss us', '#15  fix: us', '#16  ???'];
const FILES = ['love-letter.txt', 'sorry.md', 'us.zip', 'playlist.m3u'];

export default class Phone extends FPScene {
  lays: KLayout[] = [];
  prT: number[] = [];
  tLight = 0; tReview = 0; tOwn = 0; tName = 0; tIgnore = 0; tSend = 0; tAny = 0;

  override setup() {
    this.mode = 'paper'; this.th = theme('paper');
    this.lays = LINES.map((id) => fitWords(this.line(id).words, FONT.line, HERO.w, 104, 64, 3));
    const ws = this.line('L29').words; // a PR per word from "pull"
    this.prT = PRS.map((_, i) => ws[Math.min(ws.length - 1, 1 + i)]!.start);
    this.tLight = this.word('L29', 'lighting').start;
    this.tReview = this.word('L30', 'review?').start;
    this.tOwn = this.word('L30', 'own').start;
    this.tName = this.word('L31', 'name').start;
    this.tIgnore = this.word('L31', 'git-ignore').start;
    this.tSend = this.word('L32', 'send,').start;
    this.tAny = this.word('L32', 'anymore').start;
  }

  draw(c: CanvasRenderingContext2D, f: Frame) {
    const t = f.t, th = this.th;
    const seq = LINES.map((id) => this.line(id));
    LINES.forEach((_, i) => {
      const a = lineShow(t, seq, i, this.ctx.end + 1);
      if (a <= 0) return;
      c.save(); c.globalAlpha = a;
      sing(c, this.lays[i]!, t, HERO.x, HERO.y - (1 - a) * 12, th, { dim: 0.2, color: { phone: th.green, own: th.coral, 'git-ignore': th.green, anymore: th.green } });
      c.restore();
    });
    const aside = prog(t, this.line('L31').start - 0.3, this.line('L31').start + 0.25, ease.inOutCubic);
    if (aside < 1) { c.save(); c.translate(aside * 800, 0); this.phone(c, t); c.restore(); }
    this.review(c, t, aside);
    if (aside > 0) this.ignore(c, t, aside);
  }

  private phone(c: CanvasRenderingContext2D, t: number) {
    const th = this.th;
    const k = arrive(t, this.ctx.start, 0.15);
    const { x, w, h } = PH, y = PH.y + (1 - k) * 60;
    c.save(); c.globalAlpha = k;
    // body: an ink slab, its screen lit by the notifications
    c.beginPath(); c.roundRect(x, y, w, h, 56); c.fillStyle = th.type; c.fill();
    const lit = clamp(this.prT.filter((p) => t >= p).length / PRS.length) * 0.6 + 0.4 * hit(t, this.tLight, 0.35);
    const sx = x + 22, sy = y + 70, sw = w - 44, sh = h - 140;
    c.beginPath(); c.roundRect(sx, sy, sw, sh, 30);
    c.fillStyle = `rgba(30,40,56,${1})`; c.fill();
    c.fillStyle = `rgba(59,224,127,${0.10 * lit})`; c.fill();
    monoText(c, '23:47', x + w / 2, y + 150, 64, 'rgba(238,241,244,0.9)', { fam: FONT.monoM, align: 'center' });
    // notifications stack downward, newest on top
    const shown = this.prT.filter((p) => t >= p - 0.03).length;
    for (let i = 0; i < shown; i++) {
      const ki = arrive(t, this.prT[i]! - 0.03, 0.18);
      const row = shown - 1 - i, ny = sy + 200 + row * 96 - (1 - ki) * 40;
      c.globalAlpha = k * ki;
      c.beginPath(); c.roundRect(sx + 14, ny, sw - 28, 82, 16); c.fillStyle = 'rgba(238,241,244,0.94)'; c.fill();
      monoText(c, 'PULL REQUEST · you', sx + 34, ny + 30, 18, 'rgba(21,23,27,0.55)', { fam: FONT.monoB, track: 1 });
      monoText(c, PRS[i]!, sx + 34, ny + 62, 24, 'rgba(21,23,27,1)', { fam: FONT.monoB });
    }
    c.restore();
  }

  /** "Please review?": the request card, left of the phone, until the .gitignore takes over. */
  private review(c: CanvasRenderingContext2D, t: number, aside: number) {
    const th = this.th;
    const k = arrive(t, this.tReview - 0.25, 0.22) * (1 - aside);
    if (k <= 0) return;
    const x = 560, y = 560;
    c.save(); c.globalAlpha = k;
    const b = panel(c, x + (1 - k) * 40, y, 580, 300, th, { title: 'review requested' });
    monoText(c, '"please review?"', b.x + 28, b.y + 58, 30, th.type, { fam: FONT.monoB });
    monoText(c, 'reviewers', b.x + 28, b.y + 116, 24, th.dim, { fam: FONT.monoM });
    const own = t >= this.tOwn;
    monoText(c, '(none)', b.x + 220, b.y + 116, 28, own ? th.coral : th.type, { fam: FONT.monoB });
    monoText(c, 'approvals', b.x + 28, b.y + 166, 24, th.dim, { fam: FONT.monoM });
    monoText(c, '0 / 1', b.x + 220, b.y + 166, 28, th.type, { fam: FONT.monoB });
    if (own) pill(c, 'on your own', b.x + 28, b.y + 214, { size: 24, fill: th.coral, color: th.bg });
    c.restore();
  }

  /** The .gitignore: `you` on line 1; what is sent lands greyed out; status: nothing to commit. */
  private ignore(c: CanvasRenderingContext2D, t: number, k: number) {
    const th = this.th;
    const x = 1000, y = 140, w = W - M - 1000, h = 560;
    c.save(); c.globalAlpha = k;
    const b = panel(c, x + (1 - k) * 60, y, w, h, th, { title: '.gitignore' });
    const lines = ['you', 'node_modules/', '.env', '*.log', 'drafts/'];
    lines.forEach((s, i) => {
      const ly = b.y + 56 + i * 46;
      monoText(c, String(i + 1), b.x + 26, ly, 26, th.dim, { fam: FONT.mono });
      const v = i === 0 ? typed(s, t, this.tName - 0.05, this.tName + 0.25) : s;
      monoText(c, v, b.x + 76, ly, 30, i === 0 ? th.green : th.mist, { fam: i === 0 ? FONT.monoB : FONT.monoM });
    });
    // files the ex sends: fly in from the left, greyed and struck on arrival (ignored)
    FILES.forEach((s, i) => {
      const t0 = this.tSend - 0.3 + i * 0.32;
      const u = prog(t, t0, t0 + 0.45, ease.outCubic);
      if (u <= 0) return;
      const fx = lerp(-300, b.x + 76, u), fy = b.y + 330 + i * 0; // they stack onto one row, each replacing the last
      const gone = clamp((t - (t0 + 0.45)) / 0.25);
      if (gone >= 1 && i < FILES.length - 1) return;
      c.save(); c.globalAlpha *= 1 - (i < FILES.length - 1 ? gone : 0);
      const fw = monoText(c, s, fx, fy, 30, u >= 1 ? th.dim : th.type, { fam: FONT.monoB });
      if (u >= 1) strike(c, fx - 4, fy - 10, fx + fw + 4, 1, th.dim, 3);
      monoText(c, u >= 1 ? 'ignored' : '→', fx + fw + 24, fy, 24, th.dim, { fam: FONT.monoM });
      c.restore();
    });
    c.restore();
    // git status: the intro's half again
    const ks = arrive(t, this.tAny - 0.1, 0.18);
    if (ks > 0) {
      const sy = 800;
      c.save(); c.globalAlpha = ks;
      monoText(c, '~/us main $ git status', 1000, sy, 28, th.mist, { fam: FONT.monoM });
      const nw = monoText(c, 'nothing to commit', 1000, sy + 56, 36, th.type, { fam: FONT.monoB });
      monoText(c, ', working tree clean', 1000 + nw, sy + 56, 36, th.a('dim', 0.6), { fam: FONT.monoB });
      c.restore();
    }
  }

  override post(f: Frame) {
    const k = Math.max(hit(f.t, this.tLight, 0.15) * 0.6, hit(f.t, this.tOwn, 0.1) * 0.6, hit(f.t, this.tName, 0.1) * 0.6);
    return { zoom: 1 + 0.008 * k, shake: [k * 2, -k * 1.5] as [number, number] };
  }
}
