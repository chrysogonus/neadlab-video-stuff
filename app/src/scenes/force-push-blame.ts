// FORCE PUSH — the blame (L07–L10). Dark, full-frame evidence.
// `git blame relationship.md` types with "So I ran the blame"; the file's lines are the promises from verse
// 1. On "blame" the blame column reveals top-down; on "broken" every line is flagged. "Every single one had
// your name": the author cells fill "you", coral, in a cascade; "not mine": `--author=me` → 0 lines.
// "You said we could merge": `git merge you` → CONFLICT; on "conflicts" the file becomes three conflict
// blocks. "But every conflict … started with you": each block is tagged "introduced by you", one per beat,
// and on "you" every `>>>>>>> you` marker lights.
import { type Frame } from '../engine/scene';
import { ease, prog } from '../engine/util';
import { FPScene, FONT, M, W, arrive, fitWords, hit, lineShow, monoText, panel, sing, typed } from '../force-push/kit';
import { hexStr, type KLayout } from './_kit';

const PANEL = { x: M, y: 140, w: W - 2 * M, h: 640 };
const ROW = 40, FS = 27;
const COLS = { hash: PANEL.x + 28, who: PANEL.x + 200, no: PANEL.x + 340, src: PANEL.x + 420 };
const LYR_Y = 878;
const LINES = ['L07', 'L08', 'L09', 'L10'];
const FILE = ['we\'ll get to it', 'it\'s just a feature', 'nothing on the side', 'I\'ll call you back', 'next week, promise',
  'we\'re fine', 'I was at work', 'it\'s not what it looks like', 'you\'re overreacting', 'one more try', 'I\'ll change', 'trust me'];
/** After the merge: three conflict blocks (ours / theirs). */
const CONFLICTS: [string, string][] = [['we said forever', 'i said maybe'], ['you\'re my person', 'you\'re a person'], ['no secrets', 'no comment']];

export default class Blame extends FPScene {
  lays: KLayout[] = [];
  tBlame = 0; tBroken = 0; tName = 0; tNotMine = 0; tMerge = 0; tConflicts = 0; tEvery = 0; tStarted = 0; tYou = 0;

  override setup() {
    this.lays = LINES.map((id) => fitWords(this.line(id).words, FONT.line, W - 2 * M, 96, 64, 1));
    this.tBlame = this.word('L07', 'blame').start;
    this.tBroken = this.word('L07', 'broken').start;
    this.tName = this.word('L08', 'name,').start;
    this.tNotMine = this.word('L08', 'not').start;
    this.tMerge = this.word('L09', 'merge,').start;
    this.tConflicts = this.word('L09', 'conflicts').start;
    this.tEvery = this.word('L10', 'every').start;
    this.tStarted = this.word('L10', 'started').start;
    this.tYou = this.word('L10', 'you').start;
  }

  draw(c: CanvasRenderingContext2D, f: Frame) {
    const t = f.t, th = this.th;
    const open = arrive(t, this.ctx.start, 0.15);
    c.save(); c.globalAlpha = open;
    const merged = t >= this.tConflicts;
    const b = panel(c, PANEL.x, PANEL.y + (1 - open) * 30, PANEL.w, PANEL.h, th, { title: 'relationship.md', right: merged ? 'MERGING' : 'git blame' });
    c.restore();
    this.command(c, t);
    c.save();
    c.beginPath(); c.rect(b.x, b.y, b.w, b.h); c.clip();
    const sw = prog(t, this.tConflicts - 0.05, this.tConflicts + 0.3, ease.inOutCubic);
    if (sw < 1) { c.save(); c.globalAlpha = 1 - sw; this.blameView(c, t, b.y); c.restore(); }
    if (sw > 0) { c.save(); c.globalAlpha = sw; this.conflictView(c, t, b.y); c.restore(); }
    c.restore();
    // the lyric, full width under the evidence
    const seq = LINES.map((id) => this.line(id));
    LINES.forEach((_, i) => {
      const a = lineShow(t, seq, i, this.ctx.end + 1);
      if (a <= 0) return;
      c.save(); c.globalAlpha = a;
      sing(c, this.lays[i]!, t, M, LYR_Y + (1 - a) * 12, th, { dim: 0.18, color: { you: th.coral, name: th.coral, conflicts: th.coral } });
      c.restore();
    });
  }

  /** The command row above the panel: blame, then the author filter, then the merge. */
  private command(c: CanvasRenderingContext2D, t: number) {
    const th = this.th, y = 110;
    let x = M;
    x += monoText(c, '~/us ', x, y, 30, th.mist, { fam: FONT.monoM });
    x += monoText(c, 'main', x, y, 30, th.green, { fam: FONT.monoB });
    x += monoText(c, ' $ ', x, y, 30, th.type, { fam: FONT.monoM });
    let s: string;
    if (t < this.tNotMine - 0.15) s = typed('git blame relationship.md', t, this.line('L07').start - 0.2, this.tBlame + 0.1);
    else if (t < this.tMerge - 0.2) s = 'git blame relationship.md ' + typed('--author=me', t, this.tNotMine - 0.15, this.tNotMine + 0.25);
    else s = typed('git merge you', t, this.tMerge - 0.2, this.tMerge + 0.2);
    const w = monoText(c, s, x, y, 30, th.type, { fam: FONT.monoB });
    // results at the right end of the command row
    if (t >= this.tNotMine + 0.3 && t < this.tMerge - 0.2) monoText(c, '0 lines', W - M, y, 30, th.mist, { fam: FONT.monoB, align: 'right' });
    if (t >= this.tMerge + 0.25) {
      const k = arrive(t, this.tMerge + 0.25, 0.15);
      monoText(c, 'CONFLICT (content): Merge conflict in relationship.md', x + w + 30, y, 26, th.a('coral', k), { fam: FONT.monoB });
    }
  }

  private blameView(c: CanvasRenderingContext2D, t: number, top: number) {
    const th = this.th;
    FILE.forEach((src, i) => {
      const y = top + 46 + i * ROW;
      const rev = prog(t, this.tBlame + i * 0.045, this.tBlame + i * 0.045 + 0.15);
      monoText(c, String(i + 1).padStart(2, ' '), COLS.no, y, FS, th.dim, { fam: FONT.mono });
      monoText(c, src, COLS.src, y, FS, th.type, { fam: FONT.monoM });
      if (rev > 0) {
        monoText(c, hexStr(7, 700 + i), COLS.hash, y, FS, th.a('dim', rev), { fam: FONT.mono });
        // author: pending, then "you" in a cascade on "name"
        const named = t >= this.tName - 0.15 + i * 0.05;
        monoText(c, named ? 'you' : '…', COLS.who, y, FS, named ? th.coral : th.a('dim', rev), { fam: FONT.monoB });
      }
      // "broken": every line flagged
      const br = prog(t, this.tBroken + i * 0.03, this.tBroken + i * 0.03 + 0.12);
      if (br > 0) {
        c.fillStyle = th.a('coral', 0.9 * br);
        c.fillRect(COLS.no - 28, y - FS * 0.72, 5, FS * 0.9);
      }
    });
    // "not mine": me — 0 of 12
    const k = arrive(t, this.tName + 0.4, 0.2);
    if (k > 0) {
      const x = PANEL.x + PANEL.w - 40, y = top + 46;
      monoText(c, `you  12 / 12`, x, y + ROW * 9, 30, th.a('coral', k), { fam: FONT.monoB, align: 'right' });
      monoText(c, `me    0 / 12`, x, y + ROW * 10, 30, th.a('mist', k), { fam: FONT.monoB, align: 'right' });
    }
  }

  private conflictView(c: CanvasRenderingContext2D, t: number, top: number) {
    const th = this.th;
    let row = 0;
    CONFLICTS.forEach(([ours, theirs], k) => {
      // tagged one per beat from "every conflict", all lit on "you"
      const au = this.ctx.audio;
      const tagAt = au.timeOfBeat(Math.ceil(au.beatAt(this.tEvery)) + k);
      const lit = t >= this.tYou;
      const rows: [string, string][] = [['<<<<<<< HEAD', th.mist], [ours, th.type], ['=======', th.dim], [theirs, th.type], ['>>>>>>> you', lit ? th.coral : th.mist]];
      rows.forEach(([s, col], j) => {
        const y = top + 44 + (row + j) * (ROW - 4);
        monoText(c, s, COLS.hash, y, FS, col, { fam: j === 4 && lit ? FONT.monoB : FONT.monoM });
      });
      const ty = top + 44 + row * (ROW - 4);
      const kt = arrive(t, tagAt, 0.18);
      if (kt > 0) {
        const x = PANEL.x + PANEL.w - 40;
        monoText(c, `conflict ${k + 1} · introduced by you · ${hexStr(7, 760 + k)}`, x + (1 - kt) * 30, ty + (ROW - 4) * 4, 27, th.a(lit ? 'coral' : 'type', kt), { fam: FONT.monoB, align: 'right' });
        c.fillStyle = th.a('coral', kt * 0.8);
        c.fillRect(COLS.hash - 16, ty - 26, 5, (ROW - 4) * 5 - 6);
      }
      row += 5;
    });
    // "started with you": the tally
    const k = arrive(t, this.tYou, 0.15);
    if (k > 0) {
      const sc = 1 + 0.4 * hit(t, this.tYou, 0.1);
      c.save(); c.translate(PANEL.x + PANEL.w - 40, top + 44 + 2 * (ROW - 4)); c.scale(sc, sc);
      monoText(c, 'you 3 / 3', 0, 0, 44, th.a('coral', k), { fam: FONT.monoB, align: 'right' });
      c.restore();
    }
  }

  override post(f: Frame) {
    const k = Math.max(hit(f.t, this.tMerge + 0.25, 0.1) * 0.7, hit(f.t, this.tYou, 0.1));
    return { zoom: 1 + 0.008 * k, shake: [k * 2, -k * 1.5] as [number, number] };
  }
}
