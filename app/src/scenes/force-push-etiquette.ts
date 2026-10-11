// FORCE PUSH — the etiquette page (bridge, L47–L50). Paper, soft: half-time, no shakes, slow drift.
// The one voice that is not the singer's, in Cormorant: "They say never force it on a shared branch" sets on
// the page, the rule's diagram beside it (two collaborators on main). "Somebody could lose it all": the
// warning, and the other collaborator's commits fade from the diagram. "But you checked out a long, long time
// ago": the ex's row — last checkout 3 years ago — on a timeline that stretches with "long, long". "So no
// lease, no warning, here I go": `git push --force-with-lease` loses "-with-lease" on "lease", the warning
// folds away on "warning", and the command is entered on "go".
import { type Frame } from '../engine/scene';
import { clamp, ease, prog } from '../engine/util';
import { FPScene, FONT, M, W, H, theme, arrive, cursor, cursorOn, fitWords, lineShow, monoText, node, panel, pill, sing, strike, text, typed } from '../force-push/kit';
import { measure } from '../engine/type';
import type { KLayout } from './_kit';

const PAGE = { x: M, y: 120, w: 1000, h: 720 };
const SIDE = { x: 1160, w: W - M - 1160 };
const LINES = ['L47', 'L48', 'L49', 'L50'];
const CMD_Y = 970;

export default class Etiquette extends FPScene {
  lays: KLayout[] = [];
  tShared = 0; tLose = 0; tChance = 0; tChecked = 0; tLong1 = 0; tLong2 = 0; tLease = 0; tWarning = 0; tGo = 0;

  override setup() {
    this.mode = 'paper'; this.th = theme('paper');
    this.lays = LINES.map((id) => fitWords(this.line(id).words, FONT.serif, PAGE.w - 120, 124, 80, 3));
    this.tShared = this.word('L47', 'shared').start;
    this.tLose = this.word('L48', 'lose').start;
    this.tChance = this.word('L48', 'chance').start;
    this.tChecked = this.word('L49', 'checked').start;
    this.tLong1 = this.word('L49', 'long,').start;
    this.tLong2 = this.word('L49', 'long', 0).start;
    this.tLease = this.word('L50', 'lease,').start;
    this.tWarning = this.word('L50', 'warning,').start;
    this.tGo = this.word('L50', 'go').start;
  }

  draw(c: CanvasRenderingContext2D, f: Frame) {
    const t = f.t, th = this.th;
    const drift = 1 + 0.015 * prog(t, this.ctx.start, this.ctx.end, ease.inOutQuad);
    c.save();
    c.translate(W / 2, H / 2); c.scale(drift, drift); c.translate(-W / 2, -H / 2);
    // the page
    const k = arrive(t, this.ctx.start, 0.3);
    c.save(); c.globalAlpha = k;
    const b = panel(c, PAGE.x, PAGE.y + (1 - k) * 30, PAGE.w, PAGE.h, th, { fill: '#FBF8F2', radius: 6 });
    monoText(c, 'GIT ETIQUETTE  ·  § 4.2  SHARED BRANCHES', b.x + 60, b.y + 70, 22, th.dim, { fam: FONT.monoB, track: 3 });
    c.fillStyle = th.rule; c.fillRect(b.x + 60, b.y + 92, b.w - 120, 2);
    c.restore();
    // the lyric, set on the page
    const seq = LINES.map((id) => this.line(id));
    LINES.forEach((_, i) => {
      const a = lineShow(t, seq, i, this.ctx.end + 1, 0.4, 0.25, 0.2);
      if (a <= 0) return;
      c.save(); c.globalAlpha = a;
      sing(c, this.lays[i]!, t, PAGE.x + 60, PAGE.y + 250, th, { dim: 0.16, color: { lose: th.coral, chance: th.coral, go: th.green } });
      c.restore();
    });
    this.diagram(c, t);
    this.warning(c, t);
    this.checkout(c, t);
    c.restore();
    this.command(c, t, f);
  }

  /** Two collaborators on a shared main; on "lose" the other one's commits fade. */
  private diagram(c: CanvasRenderingContext2D, t: number) {
    const th = this.th;
    const k = arrive(t, this.tShared - 0.3, 0.5);
    if (k <= 0) return;
    const x0 = SIDE.x + 40, y = 250;
    c.save(); c.globalAlpha = k;
    monoText(c, 'shared: main', x0, 160, 26, th.mist, { fam: FONT.monoB });
    c.strokeStyle = th.a('type', 0.5); c.lineWidth = 4;
    c.beginPath(); c.moveTo(x0, y); c.lineTo(x0 + 560, y); c.stroke();
    const lose = prog(t, this.tLose, this.tChance + 0.4, ease.inOutCubic);
    for (let i = 0; i < 7; i++) {
      const theirs = i % 2 === 1;
      c.save(); if (theirs) c.globalAlpha *= 1 - lose * 0.85;
      node(c, x0 + 20 + i * 86, y, 14, theirs ? 'you' : 'me', theirs ? th.mist : th.type, { ring: 4, fillIn: '#FBF8F2' });
      c.restore();
    }
    if (lose > 0.6) monoText(c, 'lost: 3 commits', x0 + 560, y + 56, 24, th.a('coral', clamp((lose - 0.6) / 0.3)), { fam: FONT.monoB, align: 'right' });
    c.restore();
  }

  /** The warning callout: appears on "lose", folds away on "warning". */
  private warning(c: CanvasRenderingContext2D, t: number) {
    const th = this.th;
    const k = arrive(t, this.tLose - 0.2, 0.4) * (1 - prog(t, this.tWarning, this.tWarning + 0.35, ease.inCubic));
    if (k <= 0) return;
    const x = SIDE.x, y = 360;
    c.save(); c.globalAlpha = k;
    c.translate(0, (1 - k) * 20);
    c.beginPath(); c.roundRect(x, y, SIDE.w, 170, 10);
    c.fillStyle = 'rgba(210,70,58,0.07)'; c.fill(); c.strokeStyle = th.coral; c.lineWidth = 2; c.stroke();
    monoText(c, '⚠ WARNING', x + 28, y + 46, 24, th.coral, { fam: FONT.monoB, track: 3 });
    text(c, 'Force-pushing rewrites history', x + 28, y + 94, FONT.serif, 40, th.type);
    text(c, 'others may have built on.', x + 28, y + 136, FONT.serif, 40, th.type);
    c.restore();
  }

  /** The ex's collaborator row: last checkout 3 years ago, on a timeline stretched by "long, long". */
  private checkout(c: CanvasRenderingContext2D, t: number) {
    const th = this.th;
    const k = arrive(t, this.tChecked - 0.2, 0.4);
    if (k <= 0) return;
    const x = SIDE.x, y = 620;
    c.save(); c.globalAlpha = k;
    monoText(c, 'COLLABORATORS', x, y, 22, th.dim, { fam: FONT.monoB, track: 3 });
    node(c, x + 16, y + 56, 13, 'you', th.mist, { ring: 4, fillIn: th.bg });
    monoText(c, 'you', x + 48, y + 66, 32, th.type, { fam: FONT.monoB });
    monoText(c, 'last checkout: 3 years ago', x + 130, y + 66, 26, th.mist, { fam: FONT.monoM });
    // the timeline back to that checkout, longer with each "long"
    const s1 = prog(t, this.tLong1, this.tLong1 + 0.5, ease.outCubic), s2 = prog(t, this.tLong2, this.tLong2 + 0.6, ease.outCubic);
    const len = 160 + 200 * s1 + 260 * s2;
    const ty = y + 120, xr = W - M;
    c.strokeStyle = th.a('type', 0.45); c.lineWidth = 2; c.setLineDash([2, 8]);
    c.beginPath(); c.moveTo(xr, ty); c.lineTo(xr - len, ty); c.stroke(); c.setLineDash([]);
    node(c, xr - len, ty, 9, 'you', th.mist, { ring: 3, fillIn: th.bg });
    node(c, xr, ty, 9, 'me', th.type);
    monoText(c, 'now', xr, ty + 40, 22, th.dim, { fam: FONT.monoM, align: 'right' });
    monoText(c, 'checked out', xr - len, ty + 40, 22, th.dim, { fam: FONT.monoM, align: 'center' });
    c.restore();
  }

  /** The command: --force-with-lease → --force; entered on "go". */
  private command(c: CanvasRenderingContext2D, t: number, f: Frame) {
    const th = this.th;
    const t0 = this.line('L50').start - 0.2;
    if (t < t0) return;
    let x = M;
    x += monoText(c, '~/us ', x, CMD_Y, 38, th.mist, { fam: FONT.monoM });
    x += monoText(c, 'main', x, CMD_Y, 38, th.green, { fam: FONT.monoB });
    x += monoText(c, ' $ ', x, CMD_Y, 38, th.type, { fam: FONT.monoM });
    const head = 'git push --force', lease = '-with-lease', tail = ' origin main';
    const sent = t >= this.tGo;
    const col = sent ? th.green : th.type;
    const typedHead = typed(head + lease + tail, t, t0, this.tLease - 0.1);
    // before "lease": typing the safe command
    if (t < this.tLease) {
      const w = monoText(c, typedHead, x, CMD_Y, 38, col, { fam: FONT.monoB });
      cursor(c, x + w, CMD_Y, 38, th.type, cursorOn(f.beat));
      return;
    }
    const wh = monoText(c, head, x, CMD_Y, 38, col, { fam: FONT.monoB });
    // "-with-lease" struck, then closed up
    const close = prog(t, this.tLease + 0.3, this.tLease + 0.6, ease.inOutCubic);
    const lw = measure(lease, FONT.monoB, 38);
    if (close < 1) {
      c.save(); c.globalAlpha = 1 - close;
      monoText(c, lease, x + wh, CMD_Y, 38, th.coral, { fam: FONT.monoB });
      strike(c, x + wh - 2, CMD_Y - 12, x + wh + lw + 2, prog(t, this.tLease, this.tLease + 0.2, ease.outCubic), th.coral, 4);
      c.restore();
    }
    const wt = monoText(c, tail, x + wh + lw * (1 - close), CMD_Y, 38, col, { fam: FONT.monoB });
    if (!sent) cursor(c, x + wh + lw * (1 - close) + wt, CMD_Y, 38, th.type, cursorOn(f.beat));
    else pill(c, 'no lease · no warning', x + wh + lw * (1 - close) + wt + 30, CMD_Y - 12, { size: 22, fill: th.green, color: th.bg });
  }

  override post(_f: Frame) {
    return { vignette: 0.14, grain: 0.02 };
  }
}
