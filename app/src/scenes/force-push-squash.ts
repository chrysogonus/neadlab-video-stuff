// FORCE PUSH — the cleanup (L25–L28). Paper mode: the light/dark change marks verse 2.
// `git rebase -i --root`: the todo list of three years of picks. On "Squashed" they flip to `squash` in a
// cascade, and on "single line" collapse into one. "Commit message says: fix, wasted time": COMMIT_EDITMSG
// types it with the voice. "Cherry-picked the good days": three rows of 365 dots (2023, 2024, 2025); three
// light green, 3 / 1,095. "Rebased the rest right out of my tree": the others slide off the right edge and
// the three become a tiny tree.
import { type Frame } from '../engine/scene';
import { Lyrics } from '../engine/lyrics';
import { clamp, ease, hash, lerp, prog } from '../engine/util';
import { FPScene, FONT, M, W, MAIN, theme, arrive, cursor, cursorOn, fitWords, hit, lineShow, monoText, node, panel, sing, text } from '../force-push/kit';
import type { KLayout } from './_kit';

const ED = { x: 1000, y: 140, w: W - M - 1000, h: 640 };
const HERO = { x: M, y: 262, w: 860 };
// three years of days: a block of 25 x 15 dots per year (365 of the 375 cells)
const BLOCK = { x: 300, y: 640, cols: 25, cell: 14, dot: 4.4, w: 25 * 14, gap: 110 };
const GOOD = [[0, 72], [1, 183], [2, 357]] as const; // (year, day) of the three good days
const GOOD_LABEL = ['14 Mar 2023', '2 Jul 2024', '24 Dec 2025'];
const LINES = ['L25', 'L26', 'L27', 'L28'];

export default class Squash extends FPScene {
  lays: KLayout[] = [];
  tSquashed = 0; tSingle = 0; tFix = 0; tWasted = 0; tTimeEnd = 0; tCherry = 0; tGood = 0; tThree = 0; tRebased = 0; tOut = 0; tTree = 0;

  override setup() {
    this.mode = 'paper'; this.th = theme('paper');
    this.lays = LINES.map((id) => fitWords(this.line(id).words, FONT.line, HERO.w, 104, 64, 2));
    this.tSquashed = this.word('L25', 'Squashed').start;
    this.tSingle = this.word('L25', 'single').start;
    this.tFix = this.word('L26', 'fix,').start;
    this.tWasted = this.word('L26', 'wasted').start;
    this.tTimeEnd = this.word('L26', 'time').end;
    this.tCherry = this.line('L27').start;
    this.tGood = this.word('L27', 'good').start;
    this.tThree = this.word('L27', 'three').start;
    this.tRebased = this.word('L28', 'Rebased').start;
    this.tOut = this.word('L28', 'out').start;
    this.tTree = this.word('L28', 'tree').start;
  }

  draw(c: CanvasRenderingContext2D, f: Frame) {
    const t = f.t, th = this.th;
    const seq = LINES.map((id) => this.line(id));
    // the lyric, top left (L27–L28 move up to make room for the grid)
    LINES.forEach((_, i) => {
      const a = lineShow(t, seq, i, this.ctx.end + 1);
      if (a <= 0) return;
      c.save(); c.globalAlpha = a;
      sing(c, this.lays[i]!, t, HERO.x, HERO.y - (1 - a) * 12, th, { dim: 0.2, color: { single: th.green, three: th.green, fix: th.coral, wasted: th.coral, time: th.coral } });
      c.restore();
    });
    // the editor: todo list, then the commit message; slides off right as the grid comes in
    const away = prog(t, this.tCherry - 0.35, this.tCherry + 0.1, ease.inCubic);
    if (away < 1) {
      c.save(); c.translate(away * 1000, 0);
      if (t < this.tFix - 0.5) this.todo(c, t); else this.message(c, t);
      c.restore();
    }
    if (t >= this.tCherry - 0.3) this.grid(c, t);
  }

  private todo(c: CanvasRenderingContext2D, t: number) {
    const th = this.th;
    const open = arrive(t, this.ctx.start, 0.15);
    c.save(); c.globalAlpha = open;
    const b = panel(c, ED.x + (1 - open) * 40, ED.y, ED.w, ED.h, th, { title: 'git-rebase-todo', right: 'rebase -i --root' });
    const collapse = prog(t, this.tSingle - 0.05, this.tSingle + 0.45, ease.inOutCubic);
    const rows = 13;
    for (let i = 0; i < rows; i++) {
      const y0 = b.y + 50 + i * 40, y = lerp(y0, b.y + 50, collapse);
      if (i > 0 && collapse >= 1) break;
      const a = i === 0 ? 1 : 1 - collapse;
      const flip = t >= this.tSquashed - 0.05 + i * 0.05 && i > 0;
      const cmd = i === 0 ? 'pick' : flip ? 'squash' : 'pick';
      const m = MAIN[i % MAIN.length]!;
      c.save(); c.globalAlpha *= a;
      const cw = monoText(c, cmd.padEnd(7), b.x + 26, y, 26, cmd === 'squash' ? th.green : th.type, { fam: FONT.monoB });
      monoText(c, `${m.h} ${m.m}`, b.x + 26 + cw, y, 26, th.mist, { fam: FONT.monoM });
      c.restore();
    }
    if (collapse < 1) monoText(c, '# … 1,082 more', b.x + 26, b.y + 50 + rows * 40, 26, th.a('dim', 1 - collapse), { fam: FONT.monoM });
    if (collapse >= 1) {
      monoText(c, 'pick    1a7c0de  three years', b.x + 26, b.y + 50, 26, th.type, { fam: FONT.monoB });
      monoText(c, '1,095 commits → 1', b.x + 26, b.y + 120, 44, th.green, { fam: FONT.monoB });
    }
    c.restore();
  }

  private message(c: CanvasRenderingContext2D, t: number) {
    const th = this.th;
    const b = panel(c, ED.x, ED.y, ED.w, ED.h, th, { title: 'COMMIT_EDITMSG', right: 'squash' });
    // typed with the voice: "fix:" on "fix,", " wasted time" across the two words
    const l = this.line('L26');
    const wFix = l.words.find((w) => w.w.startsWith('fix'))!, wW = this.word('L26', 'wasted'), wT = this.word('L26', 'time');
    let s = 'fix:'.slice(0, Math.round(4 * Lyrics.wordProgress(wFix, t + 0.05)));
    if (s.length === 4) s += ' wasted'.slice(0, Math.round(7 * Lyrics.wordProgress(wW, t)));
    if (s.length === 11) s += ' time'.slice(0, Math.round(5 * Lyrics.wordProgress(wT, t)));
    const w = monoText(c, s, b.x + 30, b.y + 110, 60, th.type, { fam: FONT.monoB });
    if (t < this.tTimeEnd + 0.2) cursor(c, b.x + 30 + w, b.y + 110, 60, th.type, cursorOn(this.ctx.audio.beatAt(t)) || s.length < 16);
    monoText(c, '# Please enter the commit message for your changes.', b.x + 30, b.y + 200, 22, th.dim, { fam: FONT.mono });
    monoText(c, '# 1,095 commits squashed into one.', b.x + 30, b.y + 236, 22, th.dim, { fam: FONT.mono });
  }

  /** Three years of days as three blocks of 365 dots; three picked; the rest rebased off the right edge; the three become a tree. */
  private grid(c: CanvasRenderingContext2D, t: number) {
    const th = this.th;
    const show = arrive(t, this.tCherry - 0.3, 0.35);
    const pick = prog(t, this.tGood - 0.05, this.tGood + 0.35, ease.outCubic);
    const off = prog(t, this.tRebased, this.tOut + 0.3, ease.inCubic);
    const tree = prog(t, this.tTree - 0.4, this.tTree + 0.3, ease.inOutCubic);
    const cell = (r: number, d: number) => ({ x: BLOCK.x + r * (BLOCK.w + BLOCK.gap) + (d % BLOCK.cols) * BLOCK.cell + BLOCK.cell / 2, y: BLOCK.y + Math.floor(d / BLOCK.cols) * BLOCK.cell + BLOCK.cell / 2 });
    for (let r = 0; r < 3; r++) {
      const bx = BLOCK.x + r * (BLOCK.w + BLOCK.gap);
      monoText(c, String(2023 + r), bx, BLOCK.y - 26, 28, th.a('mist', show * (1 - off)), { fam: FONT.monoB });
      monoText(c, '365 days', bx, BLOCK.y + 15 * BLOCK.cell + 30, 22, th.a('dim', show * (1 - off)), { fam: FONT.monoM });
      c.fillStyle = th.a('dim', 0.6 * show);
      for (let d = 0; d < 365; d++) {
        if (pick > 0 && GOOD.some(([gr, gd]) => gr === r && gd === d)) continue;
        // rebased off: each day slides right, staggered, accelerating, and fades
        const k = clamp((off - hash(d, r, 3) * 0.35) / 0.65);
        const { x, y } = cell(r, d);
        const px = x + ease.inCubic(k) * 1500;
        if (px > W + 10) continue;
        c.globalAlpha = 1 - k * 0.7;
        c.beginPath(); c.arc(px, y, BLOCK.dot, 0, Math.PI * 2); c.fill();
      }
      c.globalAlpha = 1;
    }
    // the three good days: picked out with a ring and a date, then carried to a small tree
    GOOD.forEach(([r, d], i) => {
      if (pick <= 0) return;
      const g = cell(r, d);
      const tx = 1500, ty = 380 + i * 110;
      const x = lerp(g.x, tx, tree), y = lerp(g.y, ty, tree);
      const k = clamp(pick * 3 - i * 0.6);
      if (k <= 0) return;
      node(c, x, y, lerp(BLOCK.dot * 1.6, 18, tree), 'me', th.green, { a: k });
      if (tree < 0.3) {
        const fade = k * (1 - tree / 0.3);
        c.strokeStyle = th.a('green', fade); c.lineWidth = 2;
        c.beginPath(); c.arc(g.x, g.y, BLOCK.dot * 3.2, 0, Math.PI * 2); c.stroke();
        c.beginPath(); c.moveTo(g.x, g.y - BLOCK.dot * 3.2); c.lineTo(g.x, BLOCK.y - 60 - i * 34); c.stroke();
        monoText(c, GOOD_LABEL[i]!, g.x + 8, BLOCK.y - 66 - i * 34, 24, th.a('green', fade), { fam: FONT.monoB });
      }
    });
    if (tree > 0) {
      c.strokeStyle = th.a('green', tree); c.lineWidth = 5;
      c.beginPath(); c.moveTo(1500, 380 + 18); c.lineTo(1500, 380 + 220 - 18); c.stroke();
      monoText(c, 'main \u00b7 3 commits', 1540, 500, 30, th.a('type', tree), { fam: FONT.monoB });
    }
    // "there were three": 3 / 1,095
    const k3 = arrive(t, this.tThree, 0.2) * (1 - tree);
    if (k3 > 0) text(c, '3 / 1,095', W - M, 380, FONT.hero, 110, th.a('green', k3), { align: 'right' });
  }

  override post(f: Frame) {
    const k = Math.max(hit(f.t, this.tSingle, 0.1), hit(f.t, this.tThree, 0.1) * 0.7);
    return { zoom: 1 + 0.008 * k, shake: [k * 2, -k * 1.5] as [number, number] };
  }
}
