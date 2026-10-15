// Library: the terminal. A quiet full-frame shell: each cue types its `command` at the prompt while the line is
// sung, Enter lands on the anchor, the output prints line by line just after it, and the history scrolls up as
// the window fills (earlier commands dimmer). A block cursor blinks on the beat. From Force Push's terminal; for
// the commands an explainer walks through, or a lyric that reads as one.
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import { measure } from '../engine/type';
import { clamp, ease, prog } from '../engine/util';
import { LibScene, M, W, cursorOn, hit, mixHex, panel, text, typed, typedWith, type Look } from './_lib';

export const schema: SceneSchema = {
  description: 'A full-frame terminal: each cue types a command at the prompt over its line, enters it on the anchor and prints its output; the history scrolls up. For CLI walkthroughs (git, curl, ssh) and lyrics that read as commands.',
  kinds: ['explainer', 'song'],
  lyrics: 'layer',
  entry: {
    prompt: { type: 'string', default: '$', description: 'the prompt before each command; its last character is lit, e.g. "~/app main $"' },
    title: { type: 'string', default: '', description: 'window title in a quiet bar at the top, e.g. "zsh — ~/app" (no bar if empty)' },
  },
  cue: {
    command: { type: 'string', description: 'the command typed over the line and entered on the anchor' },
    output: { type: 'string[]', default: [], description: 'the lines it prints after Enter (long lines wrap)' },
  },
  example: {
    entry: { prompt: '~/us main $', title: 'zsh — ~/us' },
    cues: [
      { command: 'git status', output: ['On branch main', 'Your branch is ahead of \'origin/main\' by 3 commits.', 'nothing to commit, working tree clean'] },
      { command: 'git rebase -i HEAD~3', output: ['Successfully rebased and updated refs/heads/main.'] },
      { command: 'git push --force-with-lease origin main', output: ['Enumerating objects: 9, done.', 'Writing objects: 100% (5/5), 1.21 KiB | 1.21 MiB/s, done.', 'To github.com:me/us.git', ' + 3f9c2e1...a41b7d0 main -> main (forced update)'] },
      { command: 'git log --oneline -2', output: ['a41b7d0 (HEAD -> main, origin/main) a fresh start', '9e02c4f initial commit'] },
    ],
  },
};

interface P { prompt: string; title: string }
interface C { command: string; output: string[] }

const SIZE = 36, LH = 54; // type size and row pitch
const PAD = 44; // inner padding of the window
const BAR = 60; // title bar height
const GAP = 22; // air above each prompt after the first
const OUT0 = 0.08, OUT_DT = 0.05; // s from Enter to the first output line, and between lines

/** A block of rows in the history: a prompt with its command, or an output line. */
interface Row { cue: number; cmd: boolean; s: string; t: number; n: number; gap: number }

export default class LibTerminal extends LibScene<P, C> {
  static schema = schema;
  private rows: Row[] = [];
  private cmds: string[] = [];
  private t0: number[] = []; // when each command starts typing
  private cw = 0; // advance of one mono cell
  private cols = 80;
  private box = { x: M, y: M, w: W - 2 * M, h: 0 };

  override setup() {
    const mono = this.font('mono');
    this.cw = measure('0', mono, SIZE);
    this.box.h = this.bottom - M;
    this.cols = Math.floor((this.box.w - 2 * PAD) / this.cw);
    const pre = this.P.prompt ? `${this.P.prompt} ` : '';
    const cells = (s: string) => Math.max(1, Math.ceil(s.length / this.cols));
    let free = -1e9; // when the shell is ready for the next command
    this.cues.forEach((c, i) => {
      const p = this.cp(c);
      this.cmds.push(p.command);
      const before = c.line?.words.filter((w) => w.start < c.at - 0.02) ?? [];
      const t0 = before.length ? before[0]!.start : c.at - 0.4;
      this.t0.push(t0);
      this.rows.push({ cue: i, cmd: true, s: pre + p.command, t: Math.min(free, t0 - 0.05), n: cells(pre + p.command), gap: i ? GAP : 0 });
      p.output.forEach((s, j) => this.rows.push({ cue: i, cmd: false, s, t: c.at + OUT0 + j * OUT_DT, n: cells(s), gap: 0 }));
      free = c.at + OUT0 + p.output.length * OUT_DT + 0.12;
    });
    // the prompt waiting after the last command
    this.rows.push({ cue: this.cues.length, cmd: true, s: pre, t: free, n: 1, gap: GAP });
  }

  /** Characters of cue i's command typed by t: with the words sung before the anchor, all of it from the anchor. */
  private typedLen(i: number, t: number) {
    const c = this.cues[i], s = this.cmds[i] ?? '';
    if (!c || t >= c.at) return s.length;
    const before = c.line?.words.filter((w) => w.start < c.at - 0.02) ?? [];
    return (before.length ? typedWith(s, before, t) : typed(s, t, c.at - 0.4, c.at)).length;
  }

  draw(c: CanvasRenderingContext2D, f: Frame, k: Look) {
    const t = f.t, mono = this.font('mono'), { x, y, w, h } = this.box;
    panel(c, x, y, w, h, k.panel, k.rule, 16);
    let top = y + PAD;
    if (this.P.title) {
      text(c, this.P.title, x + w / 2, y + BAR / 2 + 7, mono, 21, k.dim, { align: 'center' });
      c.fillStyle = k.rule; c.fillRect(x, y + BAR, w, 1.5);
      top = y + BAR + PAD - 8;
    }
    const capH = y + h - PAD - top;

    // the history: every row that has appeared grows in, the content scrolls once it is taller than the window
    const shown = this.rows.filter((r) => t >= r.t);
    const grow = (r: Row) => (r.n * LH + r.gap) * ease.outCubic(prog(t, r.t, r.t + 0.1));
    const total = shown.reduce((s, r) => s + grow(r), 0);
    let ry = top - Math.max(0, total - capH);
    const pre = this.P.prompt ? `${this.P.prompt} ` : '';
    const out = mixHex(k.dim, k.type, 0.3);

    c.save();
    c.beginPath(); c.rect(x, top - 10, w, capH + 20); c.clip();
    for (const r of shown) {
      const gh = grow(r);
      if (ry + gh < top - LH) { ry += gh; continue; }
      // older commands settle dimmer once the next prompt is up
      const nextUp = this.rows.find((q) => q.cmd && q.cue === r.cue + 1)?.t ?? 1e9;
      c.globalAlpha = clamp((t - r.t) / 0.1) * (1 - 0.55 * ease.inOutCubic(prog(t, nextUp, nextUp + 0.3)));
      const base = (row: number) => ry + r.gap + row * LH + LH / 2 + SIZE * 0.34;
      if (!r.cmd) {
        for (let j = 0; j < r.n; j++) text(c, r.s.slice(j * this.cols, (j + 1) * this.cols), x + PAD, base(j), mono, SIZE, out);
      } else {
        const i = r.cue, cue = this.cues[i];
        const n = i < this.cues.length ? this.typedLen(i, t) : 0;
        const s = pre + (this.cmds[i] ?? '').slice(0, n);
        // Enter: the command flashes toward the accent, a soft bar behind it
        const kick = cue ? hit(t, cue.at, 0.14) : 0;
        if (kick > 0.01) { c.fillStyle = k.a('accent', 0.12 * kick); c.fillRect(x + PAD - 14, ry + r.gap + 4, w - 2 * PAD + 28, r.n * LH - 8); }
        const cmdCol = mixHex(k.type, k.accent, 0.7 * kick);
        for (let j = 0; j * this.cols < Math.max(1, s.length); j++) this.run(c, s, j * this.cols, x + PAD, base(j), mono, pre.length, k, cmdCol);
        // the block cursor: solid while typing, blinking on the beat while it waits, gone after Enter
        const waiting = !cue || t < cue.at;
        const typing = cue && t >= this.t0[i]! && t < cue.at;
        if (waiting && (typing || cursorOn(f.beat))) {
          const col = s.length % this.cols, row = Math.floor(s.length / this.cols);
          c.fillStyle = k.accent;
          c.fillRect(x + PAD + col * this.cw + 1, base(row) - SIZE * 0.8, this.cw - 2, SIZE * 1.02);
        }
      }
      ry += gh;
    }
    c.restore();

    // the oldest rows fade out under the top edge
    const g = c.createLinearGradient(0, top - 10, 0, top + 40);
    g.addColorStop(0, k.a('panel', 1)); g.addColorStop(1, k.a('panel', 0));
    if (total > capH) { c.fillStyle = g; c.fillRect(x + 2, top - 10, w - 4, 50); }
  }

  /** One wrapped row (cells i0..i0+cols) of a prompt + command: the prompt dim with its last mark lit, the command in `cmdCol`. */
  private run(c: CanvasRenderingContext2D, s: string, i0: number, x: number, y: number, mono: string, pl: number, k: Look, cmdCol: string) {
    const i1 = Math.min(s.length, i0 + this.cols), mark = pl - 2; // the prompt's last character (before its space)
    const seg = (a: number, b: number, col: string) => { if (b > a) text(c, s.slice(a, b), x + (a - i0) * this.cw, y, mono, SIZE, col); };
    seg(i0, Math.min(i1, Math.max(i0, mark)), k.dim);
    if (mark >= i0 && mark < i1) seg(mark, mark + 1, k.accent);
    seg(Math.max(i0, pl), i1, cmdCol);
  }

  override post(f: Frame) {
    const i = this.cues.findLastIndex((c) => c.at <= f.t);
    return { zoom: 1 + 0.004 * (i >= 0 ? hit(f.t, this.cues[i]!.at, 0.1) : 0) };
  }
}
