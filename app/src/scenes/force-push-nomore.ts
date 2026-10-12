// FORCE PUSH — "No more" (pre-chorus 1: L11–L14, params.n = 1; pre-chorus 2: L33–L36, n = 2). Dark.
// The sung line is the hero, top left; the things it ends arrive in a column on the right and are struck
// in coral on their words: a patch, the retry counter, the night-time log. n = 1: the green HEAD pill comes
// loose and drifts (`HEAD detached at 3f9e2c1`, a day counter); "Stop," freezes everything; "one beat"
// ticks a single beat; `git push --force origin main` types and is entered on "gone".
// n = 2: the list returns already struck; the log is now the ex's pleading commits; a `Revert "force push"`
// request arrives on "revert?", is stamped "cute." and flicked away; the push is typed again, entered on "do".
import { type Frame } from '../engine/scene';
import { clamp, ease, noise1, prog } from '../engine/util';
import { FPScene, FONT, M, W, HASH, arrive, cursor, cursorOn, fitWords, hit, lineShow, monoText, panel, pill, sing, strike, text, typed } from '../force-push/kit';
import { stamp, type KLayout } from './_kit';

const COL = { x: 1060, w: W - M - 1060 }; // the right column
const HERO = { x: M, y: 262, w: 880 };
const CMD_Y = 984;

export default class NoMore extends FPScene {
  n = 1;
  ids: string[] = [];
  lays: KLayout[] = [];
  tPatches = 0; tTry = 0; tNight = 0; tDetached = 0; tStop = 0; tBeat = 0; tGone = 0; tGoneEnd = 0;
  tRevert = 0; tCute = 0; tDo = 0; tLogs = 0;

  override setup() {
    this.n = Number(this.ctx.params.n ?? 1);
    this.ids = this.n === 1 ? ['L11', 'L12', 'L13', 'L14'] : ['L33', 'L34', 'L35', 'L36'];
    this.lays = this.ids.map((id) => fitWords(this.line(id).words, FONT.line, HERO.w, 112, 72, 3));
    const [a, b, cc, d] = this.ids as [string, string, string, string];
    this.tPatches = this.word(a, 'patches,').start;
    this.tTry = this.word(a, 'try').start;
    if (this.n === 1) {
      this.tNight = this.word(b, 'night').start;
      this.tDetached = this.word(cc, 'detached').start;
      this.tStop = this.word(d, 'Stop,').start;
      this.tBeat = this.word(d, 'beat').start;
      this.tGone = this.word(d, 'gone').start;
      this.tGoneEnd = this.word(d, 'gone').end;
    } else {
      this.tLogs = this.word(b, 'logs').start;
      this.tRevert = this.word(cc, 'revert?').start;
      this.tCute = this.word(cc, 'cute').start;
      this.tDo = this.word(d, 'do').start;
    }
  }

  /** Stage time: frozen from "Stop," until the push (n = 1), so drifting things hold still. */
  private st(t: number) { return this.n === 1 && t > this.tStop ? this.tStop : t; }

  draw(c: CanvasRenderingContext2D, f: Frame) {
    const t = f.t, th = this.th;
    // hero lines, one at a time
    const seq = this.ids.map((id) => this.line(id));
    this.ids.forEach((id, i) => {
      const a = lineShow(t, seq, i, this.ctx.end + 1);
      if (a <= 0) return;
      c.save(); c.globalAlpha = a;
      const big = id === 'L14' && t >= this.tStop;
      sing(c, this.lays[i]!, t, HERO.x, HERO.y - (1 - a) * 12, th, { dim: 0.18, color: { stop: th.type, gone: th.coral, revert: th.coral, cute: th.green } });
      if (big) {
        // "Stop," — the whole stage holds; a STOP marker under the line
        const k = arrive(t, this.tStop, 0.12);
        monoText(c, '■ STOPPED', HERO.x, HERO.y + this.lays[i]!.rows.length * this.lays[i]!.size + 40, 30, th.a('type', k), { fam: FONT.monoB, track: 4 });
      }
      c.restore();
    });
    if (this.n === 1) this.column1(c, t);
    else this.column2(c, t);
    this.command(c, t, f);
  }

  /** A card in the right column. Returns its inner box. */
  private card(c: CanvasRenderingContext2D, y: number, h: number, a: number, title: string) {
    c.save(); c.globalAlpha = a;
    const b = panel(c, COL.x + (1 - a) * 60, y, COL.w, h, this.th, { title });
    c.restore();
    return b;
  }

  private column1(c: CanvasRenderingContext2D, t: number) {
    const th = this.th;
    // a patch file
    const k1 = arrive(t, this.tPatches - 0.3, 0.22);
    if (k1 > 0) {
      const b = this.card(c, 180, 130, k1, 'fix-us.patch');
      c.save(); c.globalAlpha = k1;
      monoText(c, '@@ -1,3 +1,12 @@  we\'ll be fine', b.x + 24, b.y + 52, 30, th.mist, { fam: FONT.monoM });
      c.restore();
      strike(c, COL.x - 10, 245, COL.x + COL.w + 10, prog(t, this.tPatches + 0.05, this.tPatches + 0.3, ease.outCubic), th.coral, 7);
    }
    // the retry counter
    const k2 = arrive(t, this.tTry - 0.55, 0.22);
    if (k2 > 0) {
      const b = this.card(c, 340, 130, k2, 'one more try');
      const n = 44 + Math.min(3, Math.floor(clamp((this.st(t) - (this.tTry - 0.55)) / 0.12)));
      c.save(); c.globalAlpha = k2;
      text(c, `attempt ${n} / ∞`, b.x + 24, b.y + 54, FONT.lineWide, 44, th.type);
      c.restore();
      strike(c, COL.x - 10, 405, COL.x + COL.w + 10, prog(t, this.tTry + 0.05, this.tTry + 0.3, ease.outCubic), th.coral, 7);
    }
    // the night log
    const k3 = arrive(t, this.tNight - 1.0, 0.25);
    if (k3 > 0) {
      const b = this.card(c, 500, 200, k3, 'git log --author=you --since=23:00');
      c.save(); c.globalAlpha = k3;
      ['23:41  wip', '01:12  wip', '02:58  drinks?'].forEach((s, i) => {
        if (t >= this.tNight - 0.9 + i * 0.2) monoText(c, s, b.x + 24, b.y + 46 + i * 40, 30, i === 2 ? th.coral : th.mist, { fam: FONT.monoM });
      });
      c.restore();
      strike(c, COL.x - 10, 600, COL.x + COL.w + 10, prog(t, this.tNight + 0.05, this.tNight + 0.3, ease.outCubic), th.coral, 7);
    }
    // HEAD comes loose and drifts (frozen by "Stop,")
    const kd = arrive(t, this.tDetached - 0.35, 0.3);
    if (kd > 0) {
      const s = this.st(t), drift = clamp((s - this.tDetached) / 1.6);
      const ax = COL.x + 90, ay = 790; // the commit it came off
      const hx = ax + 220 * drift + noise1(s * 0.8, 3) * 30 * drift, hy = ay - 40 - 70 * drift + noise1(s * 0.7, 9) * 18 * drift;
      c.save(); c.globalAlpha = kd;
      c.fillStyle = th.type; c.beginPath(); c.arc(ax, ay, 15, 0, Math.PI * 2); c.fill();
      c.strokeStyle = th.green; c.lineWidth = 2; c.setLineDash([6, 6]);
      c.beginPath(); c.moveTo(ax, ay - 16); c.quadraticCurveTo(ax + 40, (ay + hy) / 2, hx, hy + 24); c.stroke(); c.setLineDash([]);
      pill(c, 'HEAD', hx, hy, { size: 34, fill: th.green, color: th.onGreen, align: 'center', glow: th.green });
      monoText(c, `HEAD detached at ${HASH.detached}`, COL.x, 872, 28, th.type, { fam: FONT.monoB });
      const days = Math.round(1095 * ease.outCubic(clamp((s - this.tDetached) / 1.2)));
      monoText(c, `for ${days.toLocaleString('en-US')} days`, COL.x, 910, 26, th.mist, { fam: FONT.monoM });
      c.restore();
    }
    // "one beat": a single beat lights
    if (t >= this.tBeat - 0.05) {
      const k = hit(t, this.tBeat, 0.25);
      const x = HERO.x + 8, y = 760;
      c.fillStyle = th.a('type', 0.25 + 0.75 * clamp(k * 2));
      c.beginPath(); c.arc(x + 18, y, 18 + 10 * k, 0, Math.PI * 2); c.fill();
      monoText(c, '1 beat', x + 58, y + 10, 30, th.type, { fam: FONT.monoB });
    }
  }

  private column2(c: CanvasRenderingContext2D, t: number) {
    const th = this.th;
    // the list returns, already struck (it is still over)
    const items: [string, number][] = [['fix-us.patch', 180], ['one more try', 300]];
    items.forEach(([s, y], i) => {
      const k = arrive(t, (i === 0 ? this.tPatches : this.tTry) - 0.35, 0.18);
      if (k <= 0) return;
      this.card(c, y, 96, k, s);
      strike(c, COL.x - 10, y + 48, COL.x + COL.w + 10, k, th.coral, 7);
      monoText(c, 'again', COL.x + COL.w - 24, y + 36, 24, th.a('coral', k), { fam: FONT.monoB, align: 'right' });
    });
    // the log: the ex's pleading commits, scrolling
    const kl = arrive(t, this.tLogs - 0.7, 0.25);
    if (kl > 0) {
      const b = this.card(c, 420, 230, kl, 'git log --author=you');
      const msgs = ['pls', 'can we talk', 'i miss us', 'revert?', 'pls', 'answer', 'i changed', 'pls'];
      const scroll = (t - (this.tLogs - 0.7)) * 3.2;
      c.save(); c.globalAlpha = kl;
      c.beginPath(); c.rect(b.x, b.y, b.w, b.h); c.clip();
      for (let i = 0; i < 12; i++) {
        const y = b.y + 40 + (i - (scroll % 1)) * 38;
        const m = msgs[(i + Math.floor(scroll)) % msgs.length]!;
        monoText(c, `${(23 + Math.floor((i + scroll) / 3)) % 24}:${String((17 * (i + Math.floor(scroll))) % 60).padStart(2, '0')}  ${m}`, b.x + 24, y, 26, th.mist, { fam: FONT.monoM });
      }
      c.restore();
      strike(c, COL.x - 10, 535, COL.x + COL.w + 10, prog(t, this.tLogs + 0.1, this.tLogs + 0.35, ease.outCubic), th.coral, 7);
    }
    // the revert request: arrives on "revert?", stamped "cute.", flicked away
    const kr = arrive(t, this.tRevert - 0.3, 0.25);
    if (kr > 0) {
      const fly = ease.inCubic(prog(t, this.tCute + 0.45, this.tCute + 0.85));
      const y = 700;
      c.save();
      c.translate(fly * 900, -fly * 120); c.rotate(fly * 0.25);
      c.globalAlpha = kr * (1 - fly);
      c.beginPath(); c.roundRect(COL.x, y, COL.w, 170, 14);
      c.fillStyle = th.panel; c.fill(); c.strokeStyle = th.coral; c.lineWidth = 3; c.stroke();
      monoText(c, 'Revert "force push"', COL.x + 28, y + 60, 34, th.coral, { fam: FONT.monoB });
      monoText(c, 'requested by you · 1 commit', COL.x + 28, y + 104, 26, th.mist, { fam: FONT.monoM });
      pill(c, 'Merge?', COL.x + COL.w - 28, y + 136, { size: 24, stroke: th.coral, color: th.coral, align: 'right' });
      const ks = prog(t, this.tCute - 0.02, this.tCute + 0.6);
      if (ks > 0) stamp(c, 'cute.', COL.x + COL.w * 0.62, y + 70, 64, -0.12, th.green, ks, 77, { ink: 0.85, fam: FONT.monoB });
      c.restore();
    }
  }

  /** The push, typed at the bottom: entered on "gone" (n = 1) / "do" (n = 2). */
  private command(c: CanvasRenderingContext2D, t: number, f: Frame) {
    const th = this.th;
    const enter = this.n === 1 ? this.tGone : this.tDo;
    const t0 = this.n === 1 ? this.tBeat - 0.3 : this.line('L36').start - 0.1;
    if (t < t0 - 0.3) return;
    const s = 'git push --force origin main';
    const done = typed(s, t, t0, enter - 0.06);
    const sent = t >= enter;
    let x = M;
    x += monoText(c, '~/us ', x, CMD_Y, 40, th.mist, { fam: FONT.monoM });
    x += monoText(c, 'main', x, CMD_Y, 40, th.green, { fam: FONT.monoB });
    x += monoText(c, ' $ ', x, CMD_Y, 40, th.type, { fam: FONT.monoM });
    const w = monoText(c, done, x, CMD_Y, 40, sent ? th.green : th.type, { fam: FONT.monoB });
    if (!sent) cursor(c, x + w, CMD_Y, 40, th.type, cursorOn(f.beat) || done.length > 0);
    else {
      const k = hit(t, enter, 0.2);
      monoText(c, '↵', x + w + 24, CMD_Y, 40, th.a('green', 0.4 + 0.6 * k), { fam: FONT.monoB });
    }
  }

  override post(f: Frame) {
    const t = f.t;
    const enter = this.n === 1 ? this.tGone : this.tDo;
    const k = hit(t, enter, 0.1) + (this.n === 1 ? 0.6 * hit(t, this.tStop, 0.08) : 0.6 * hit(t, this.tCute, 0.08));
    return { zoom: 1 + 0.01 * k, shake: [k * 2.5, k * -2] as [number, number] };
  }
}

