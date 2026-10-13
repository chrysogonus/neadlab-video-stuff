// Library: the comparison. Two headed columns either side of a centred divider; on each anchor an item slides
// into its column (or, for a point they share, sits across the divider), and the column of the cue on screen is
// gently lit while the other steps back. An optional verdict lands under both with the last cue. For before /
// after, myth / fact, HTTP / HTTPS, merge / rebase.
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import { measure } from '../engine/type';
import { ease, lerp, prog } from '../engine/util';
import { LibScene, M, W, arrive, balanced, fitSize, mixHex, panel, pill, text, type Look } from './_lib';

export const schema: SceneSchema = {
  description: 'Two columns compared: each cue adds an item to the left or right column (or one across both) on its anchor, the current column gently lit; an optional verdict lands under both with the last cue. For before/after, myth/fact, option A versus option B.',
  kinds: ['explainer', 'song'],
  lyrics: 'layer',
  entry: {
    left: { type: 'string', description: 'the left column\'s heading, e.g. "Before", "Myth", "HTTP"' },
    right: { type: 'string', description: 'the right column\'s heading, e.g. "After", "Fact", "HTTPS"' },
    verdict: { type: 'string', default: '', description: 'a one-line conclusion shown under both columns from the last cue on (none if empty)' },
  },
  cue: {
    side: { type: 'string', enum: ['left', 'right', 'both'], description: 'the column the item goes in; "both" for a point they share (set across the divider)' },
    item: { type: 'string', description: 'the point, a short phrase (wraps)' },
  },
  example: {
    entry: { left: 'git merge', right: 'git rebase', verdict: 'Rebase in private, merge in public' },
    cues: [
      { side: 'left', item: 'Keeps history exactly as it happened' },
      { side: 'right', item: 'Replays your commits in one straight line' },
      { side: 'both', item: 'Brings your branch up to date' },
      { side: 'left', item: 'Safe on a shared branch' },
      { side: 'right', item: 'Never on commits others have pulled' },
    ],
  },
};

type Side = 'left' | 'right' | 'both';
interface P { left: string; right: string; verdict: string }
interface C { side: Side; item: string }

const GAP = 72; // from the divider to a column
const COL = W / 2 - GAP - M; // a column's width

export default class LibCompare extends LibScene<P, C> {
  static schema = schema;
  private items: { side: Side; rows: string[]; y: number }[] = [];
  private z = 40;
  private hz = 80;
  private top = 0;

  override setup() {
    const body = this.font('body'), disp = this.font('display');
    const cs = this.cues.map((c) => this.cp(c));
    // the largest item size (and, for long lists, a smaller heading) at which both columns fit the free height;
    // the slots are fixed from the start, so nothing re-flows as items arrive
    const fit = (hmax: number, z: number) => {
      this.hz = Math.min(fitSize(this.P.left, disp, COL, hmax, 36), fitSize(this.P.right, disp, COL, hmax, 36));
      this.top = M + this.hz * 0.75 + 96;
      this.z = z;
      let yl = 0, yr = 0;
      this.items = cs.map(({ side, item }) => {
        const rows = balanced(item, body, z, side === 'both' ? COL * 1.3 : COL - 44);
        const h = rows.length * z * 1.22 + z * 0.62 + (side === 'both' ? z * 0.5 : 0);
        const y = side === 'left' ? yl : side === 'right' ? yr : Math.max(yl, yr);
        if (side !== 'right') yl = y + h;
        if (side !== 'left') yr = y + h;
        return { side, rows, y };
      });
      return Math.max(yl, yr) <= this.colBottom() - 24 - this.top;
    };
    for (const hmax of [84, 64, 52]) for (let z = 44; z >= 26; z -= 2) if (fit(hmax, z)) return;
  }

  /** Lowest y of the columns (the verdict goes under them). */
  private colBottom() { return this.bottom - (this.P.verdict ? 120 : 10); }

  /** How lit each column is at t (1 = current, 0 = stepped back), easing over 0.35 s from each anchor. */
  private emphasis(t: number, side: 'left' | 'right') {
    const on = (i: number) => (i < 0 ? 1 : this.items[i]!.side === side || this.items[i]!.side === 'both' ? 1 : 0);
    const j = this.cues.findLastIndex((x) => x.at <= t);
    if (j < 0) return 1;
    return lerp(on(j - 1), on(j), prog(t, this.cues[j]!.at, this.cues[j]!.at + 0.35, ease.inOutCubic));
  }

  draw(c: CanvasRenderingContext2D, f: Frame, k: Look) {
    const t = f.t, disp = this.font('display'), body = this.font('body'), mono = this.font('mono');
    const j = this.cues.findLastIndex((x) => x.at <= t);
    const intro = arrive(t, this.ctx.start, 0.5);
    const hy = M + this.hz * 0.75 + 20, ry = hy + 38;

    // the columns: a soft panel behind the lit one, the heading, its rule
    for (const side of ['left', 'right'] as const) {
      const em = this.emphasis(t, side), x0 = side === 'left' ? M : W / 2 + GAP;
      const lit = j >= 0 ? em : 0;
      if (lit > 0.01) panel(c, x0 - 36, M - 24, COL + 72, this.colBottom() - M + 24, k.a('panel', lit * 0.85), undefined, 18);
      c.globalAlpha = intro;
      text(c, side === 'left' ? this.P.left : this.P.right, x0, hy, disp, this.hz, mixHex(k.dim, k.type, em));
      c.fillStyle = k.rule; c.fillRect(x0, ry, COL * intro, 1.5);
      c.fillStyle = k.accent; c.fillRect(x0, ry - 1.5, COL * lit * intro, 4);
      c.globalAlpha = 1;
    }
    // the divider: a hairline, broken where an item sits across it
    const dy1 = this.colBottom();
    c.fillStyle = k.rule;
    c.fillRect(W / 2 - 0.75, M - 8, 1.5, (dy1 - M + 8) * intro);

    this.items.forEach((it, i) => {
      if (i > j) return;
      const at = this.cues[i]!.at, a = arrive(t, at - 0.04, 0.4), newest = i === j;
      const settle = i < j ? prog(t, this.cues[i + 1]!.at, this.cues[i + 1]!.at + 0.35) : 0;
      const z = this.z, y = this.top + it.y + z * 0.9, lh = z * 1.22;
      if (it.side === 'both') {
        // across the divider: a ground-coloured band hides the hairline, a rule-outlined pill around the text
        const tw = Math.max(...it.rows.map((r) => measure(r, body, z)));
        const bw = tw + z * 1.6, bh = it.rows.length * lh + z * 0.5, bx = W / 2 - bw / 2, by = y - z * 1.22;
        c.globalAlpha = a;
        c.save(); c.translate(W / 2, by + bh / 2); c.scale(lerp(0.94, 1, a), lerp(0.94, 1, a)); c.translate(-W / 2, -(by + bh / 2));
        panel(c, bx, by, bw, bh, k.bg, mixHex(k.accent, k.rule, settle), bh / 2 > 40 ? 24 : bh / 2);
        it.rows.forEach((r, ri) => text(c, r, W / 2, y + ri * lh, body, z, mixHex(k.type, k.dim, settle * 0.5), { align: 'center' }));
        c.restore();
        c.globalAlpha = 1;
        return;
      }
      const em = this.emphasis(t, it.side), x0 = it.side === 'left' ? M : W / 2 + GAP;
      const dx = (1 - a) * (it.side === 'left' ? 36 : -36); // slides out from the divider
      c.globalAlpha = a * lerp(0.45, 1, em);
      c.fillStyle = mixHex(k.accent, k.dim, settle);
      c.fillRect(x0 + dx, y - z * 0.36, 22 * (newest ? 1 : 0.7), 4);
      it.rows.forEach((r, ri) => text(c, r, x0 + 44 + dx, y + ri * lh, body, z, k.type));
      c.globalAlpha = 1;
    });

    // the verdict, with the last cue: a rule across, then a pill and the line, centred as a group
    const last = this.cues.at(-1);
    if (this.P.verdict && last) {
      // after the last item, but in time to be read before the cut
      const a = arrive(t, Math.max(last.at + 0.15, Math.min(last.at + 0.6, this.ctx.end - 1.6)), 0.5), vy = this.bottom - 26;
      if (a > 0) {
        const serif = this.font('serif'), vz = fitSize(this.P.verdict, serif, W - 2 * M - 300, 54, 24);
        const pw = measure('VERDICT', mono, 18, 0.5) + 18 * 1.1, gw = pw + 28 + measure(this.P.verdict, serif, vz), gx = W / 2 - gw / 2;
        c.globalAlpha = a;
        pill(c, 'VERDICT', gx, vy - vz * 0.3, mono, 18, k.accent, k.onAccent);
        text(c, this.P.verdict, gx + pw + 28, vy + (1 - a) * 14, serif, vz, k.type);
        c.globalAlpha = 1;
      }
    }
  }
}
