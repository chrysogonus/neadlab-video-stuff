// Force Push (blind): the history of `you`, the video's hero, used twice. The repository's history drawn as
// `git log --graph --oneline` would: a vertical rail of commit dots, newest on top, each with its short hash, its
// ref labels and its message. Every sung line becomes the newest commit: it appears on the rail as its line starts
// (a hollow dot, its hash ticking on the beat while it is written), its message types with the voice in big display
// type (the anchor word in accent) and the commit lands (the dot fills, HEAD moves to it); when the next one comes
// the message shrinks to a mono label on its row.
//   rewrite (chorus 1): her commits stack on top of his long history (fading down into the thousands) and his side
//     branch. Events land on their anchors: `tear` strikes the side branch and drops it out of the frame (the
//     graph snaps to one lane), `rehash` re-rolls every old hash, `collapse` drops all the old commits off the
//     bottom (origin/main is left dangling under the rail), `origin` slides origin/main up the rail onto her tip.
//   own (the drop): only her history, from a root at the bottom, climbing up the frame one commit per line;
//     `origin` brings origin/main down onto the tip beside HEAD.
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import type { ResolvedCue } from '../engine/cues';
import type { Word } from '../engine/lyrics';
import { layoutWords, type KLayout } from '../engine/karaoke';
import { font, measure, plain } from '../engine/type';
import { clamp, ease, frameIdx, hash, lerp, prog, smoothstep } from '../engine/util';
import { LibScene, M, W, H, hit, mixHex, text, type Look } from './_lib';

export const schema: SceneSchema = {
  description: 'A git history graph: each sung line becomes the newest commit on a vertical rail (its message typed big, the anchor word in accent); in act "rewrite" her commits stack over his long history and side branch, which are torn out, rehashed and collapsed on the cues\' events; in act "own" her history alone climbs the frame from a root.',
  kinds: ['song'],
  lyrics: 'own',
  entry: {
    act: { type: 'string', enum: ['rewrite', 'own'], default: 'rewrite', description: 'rewrite: over his old history and side branch; own: her commits only, from a root' },
    commits: { type: 'number', default: 1095, min: 1, description: 'rewrite: how many commits the old history has' },
    oldTip: { type: 'string', default: '3f9c2e1', description: 'rewrite: hash of the old tip (main, origin/main)' },
    side: { type: 'string', default: 'you/other', description: 'rewrite: the side branch\'s name' },
    sideCommits: { type: 'string[]', default: ['b81e0c7', '44d9a2f', 'e07c3b5'], description: 'rewrite: the side branch\'s commits, top (its tip) first' },
    root: { type: 'string', default: '5eed1e5', description: 'own: hash of the root commit at the bottom of the rail' },
  },
  cue: {
    hash: { type: 'string', description: 'short hash of the commit the line becomes' },
    event: { type: 'string', enum: ['commit', 'tear', 'rehash', 'collapse', 'origin'], default: 'commit', description: 'what lands on the anchor: commit (the commit itself), tear (the side branch is torn out), rehash (old hashes re-roll), collapse (the old commits fall away), origin (origin/main moves onto the tip)' },
  },
  example: {
    entry: { act: 'rewrite', commits: 1095, oldTip: '3f9c2e1', side: 'you/other', sideCommits: ['b81e0c7', '44d9a2f', 'e07c3b5'] },
    cues: [{ hash: '7e1d0a3', event: 'tear' }, { hash: 'c45f9b2', event: 'rehash' }, { hash: '19ae6d8', event: 'collapse' }, { hash: 'e0b3f71' }, { hash: '8d2c5aa' }, { hash: 'd2a84f4', event: 'origin' }],
  },
};

type Ev = 'commit' | 'tear' | 'rehash' | 'collapse' | 'origin';
interface P { act: 'rewrite' | 'own'; commits: number; oldTip: string; side: string; sideCommits: string[]; root: string }
interface C { hash: string; event: Ev }

const RX = 212; // the rail
const LANE = 92; // the side branch's lane, right of the rail
const TX = 56; // the text column, right of the outermost lane
const HEAD_Y = M + 18; // header baseline
const TOP = 252; // rewrite: the tip's row
const ROOT_Y = H - M - 30; // own: the root's row
const ROW = 64, ROW_OWN = 104, OLD = 58; // row pitch: her rows (rewrite, own), his rows
const MONO = 30, MONO_OLD = 28, PILL = 24, SMALL = 26;
const ARRIVE = 0.42; // s a new commit takes to open its place on the rail
const LEAD = 0.12; // s before its line it starts to
const HOP = 0.26; // s HEAD takes to hop to a new commit
const REF = 1.0; // s origin/main takes to move
const HEX = '0123456789abcdef';

/** Her commits: one per cue (and the root in act own). */
interface Node { hash: string; msg: string; cue: ResolvedCue | null; ev: Ev; arrive: number; land: number; lay: KLayout | null; gap: number }
/** His old history (act rewrite), top row first. */
interface Old { hash: string; rehash: string; msg: string; side: boolean; refs: string[] }
/** One of his rows at t: its place, how far it has fallen, its index and its index among the main rows (-1: side). */
interface OldRow { o: Old; y: number; fall: number; i: number; mi: number }
/** Where a ref label sits: a node index, OLD0 (his tip row), DANGLE (alone under the rail), SKY (above the frame). */
const OLD0 = -1, DANGLE = -2, SKY = -3;
interface Move { t: number; to: number; dur?: number }
/** A ref at t: moving from one place to another, p 0..1. */
interface Where { from: number; to: number; p: number }
/** The room a row keeps for a ref label: it opens as the label arrives, and closes only once the label has left. */
const room = (r: Where, id: number) => (r.to === id ? r.p : 0) + (r.from === id ? 1 - ease.inOutCubic(prog(r.p, 0.45, 1)) : 0);

const HIS = ['small fix', 'wip', 'fix later', 'Revert "sorry"', 'sorry', 'wip', 'update', 'minor changes', 'fix', 'wip', 'cleanup', 'fix', 'wip', 'misc'];
const SIDE = ['just a feature', 'nothing on the side', 'temp'];

const hex7 = (...seed: number[]) => Array.from({ length: 7 }, (_, i) => HEX[Math.floor(hash(...seed, i) * 16)]).join('');
const commas = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export default class FpBlindHistory extends LibScene<P, C> {
  static schema = schema;
  private own = false;
  private nodes: Node[] = [];
  private old: Old[] = [];
  private size = 100; // the big message's type size
  private track = 0;
  private at: Partial<Record<Ev, number>> = {};
  private head: Move[] = [];
  private origin: Move[] = [];
  private count: Move[] = [];

  override setup() {
    this.own = this.P.act === 'own';
    const disp = this.font('display');
    const col0 = RX + (this.own ? 0 : LANE) + TX, maxW = W - M - col0;
    const lined = this.cues.filter((c) => c.line);
    // one size for every message of the act: the largest at which each fits two rows
    const words = lined.map((c) => c.line!.words);
    for (this.size = 128; this.size > 60; this.size -= 2) {
      const tr = -0.012 * this.size;
      if (words.every((ws) => { const l = layoutWords(ws, disp, this.size, maxW, tr, 2); return l.rows.length <= 2 && l.width <= maxW; })) break;
    }
    this.track = -0.012 * this.size;

    if (this.own) this.nodes.push({ hash: this.P.root, msg: 'initial commit', cue: null, ev: 'commit', arrive: -Infinity, land: -Infinity, lay: null, gap: 0 });
    lined.forEach((c, i) => {
      const p = this.cp(c), line = c.line!;
      const lay = layoutWords(line.words, disp, this.size, maxW, this.track, 2);
      // rewrite opens on its first commit already in place (its line starts on the cut); own climbs on the cut
      const arrive = i > 0 ? line.start - LEAD : this.own ? Math.max(this.ctx.start, line.start - LEAD) : this.ctx.start - ARRIVE;
      // a plain commit lands on its anchor; with another event on the anchor it lands as its line starts
      const land = p.event === 'commit' ? c.at : Math.max(arrive, line.start);
      this.nodes.push({ hash: p.hash, msg: plain(line.text), cue: c, ev: p.event, arrive, land, lay, gap: 98 + (lay.rows.length - 0.06) * this.size });
      if (p.event !== 'commit') this.at[p.event] = c.at;
    });

    // his history: the old tip, the side branch interleaved (its fork parent is the next main row), the rest
    if (!this.own) {
      const main = (j: number, refs: string[] = []): Old => ({ hash: j ? hex7(31, j) : this.P.oldTip, rehash: j ? hex7(57, j) : this.P.oldTip, msg: HIS[j % HIS.length]!, side: false, refs });
      const side = (j: number): Old => ({ hash: this.P.sideCommits[j] ?? hex7(71, j), rehash: '', msg: SIDE[j % SIDE.length]!, side: true, refs: j ? [] : [this.P.side] });
      const sc = this.P.sideCommits.length;
      this.old.push(main(0));
      for (let j = 0; j < sc; j++) { this.old.push(side(j)); if (j === sc - 2) this.old.push(main(1)); }
      for (let j = sc > 1 ? 2 : 1; this.old.length < 22; j++) this.old.push(main(j));
    }

    // the refs: HEAD follows the landed tip; origin/main is his tip until the collapse leaves it dangling, then hers
    const first = this.own ? 1 : 0;
    this.head = [{ t: -Infinity, to: this.own ? 0 : OLD0 }, ...this.nodes.slice(first).map((n, i) => ({ t: n.land, to: i + first }))];
    this.origin = [{ t: -Infinity, to: this.own ? SKY : OLD0 }];
    if (this.at.collapse !== undefined) this.origin.push({ t: this.at.collapse + 0.3, to: DANGLE, dur: 0.5 });
    const oi = this.nodes.findIndex((n) => n.ev === 'origin');
    // (in act own it drops in from above: quickly, to land with HEAD)
    if (oi >= 0) this.origin.push({ t: this.nodes[oi]!.cue!.at, to: oi, dur: this.own ? 0.32 : REF });
    // the commit count in the header
    let n = this.own ? 1 : this.P.commits;
    this.count = [{ t: -Infinity, to: n }];
    for (const node of this.nodes.slice(first)) {
      this.count.push({ t: node.land, to: ++n });
      if (node.ev === 'collapse') this.count.push({ t: node.cue!.at, to: (n = this.nodes.indexOf(node) + 1) });
    }
  }

  // ------------------------------------------------------------------ layout

  /** The rows of her commits when the first s have arrived (newest at TOP, or the root at ROOT_Y). */
  private stack(s: number): number[] {
    const y: number[] = [], n = this.nodes;
    if (this.own) for (let j = 0; j < s; j++) y.push(j === 0 ? ROOT_Y : y[j - 1]! - (j === s - 1 ? n[j]!.gap : ROW_OWN));
    else for (let j = s - 1; j >= 0; j--) y[j] = j === s - 1 ? TOP : y[j + 1]! + (j + 1 === s - 1 ? n[j + 1]!.gap : ROW);
    return y;
  }
  private oldTopOf(s: number, y: number[]) { return s <= 0 ? TOP : y[0]! + (s === 1 ? this.nodes[0]!.gap : ROW); }

  /** Her rows at t (blending into the newest arrival), how many have arrived, and the top of his history. */
  private layout(t: number) {
    const s = this.nodes.filter((n) => n.arrive <= t).length;
    const cur = this.stack(s), prev = this.stack(s - 1);
    const a = s > 0 && Number.isFinite(this.nodes[s - 1]!.arrive) ? ease.inOutCubic(prog(t, this.nodes[s - 1]!.arrive, this.nodes[s - 1]!.arrive + ARRIVE)) : 1;
    // the newest comes out of the previous tip
    const ys = cur.map((y, j) => lerp(j < s - 1 ? prev[j]! : (prev[s - 2] ?? (this.own ? ROOT_Y : TOP)), y, a));
    const oldTop = lerp(this.oldTopOf(s - 1, prev), this.oldTopOf(s, cur), a);
    return { s, ys, a, oldTop };
  }

  /** The text column: right of the side lane until the tear, then snapping left onto the one rail. */
  private col(t: number) {
    if (this.own) return RX + TX;
    const at = this.at.tear;
    const p = at === undefined ? 0 : ease.outBack(prog(t, at + 0.42, at + 0.92), 1.2);
    return lerp(RX + LANE + TX, RX + TX, p);
  }

  /** Where a ref is at t: moving from one place to the next over `dur` s. */
  private where(moves: Move[], t: number, dur: number) {
    const i = moves.findLastIndex((m) => m.t <= t);
    const m = moves[i]!, from = moves[i - 1]?.to ?? m.to;
    return { from, to: m.to, p: Number.isFinite(m.t) ? ease.inOutCubic(prog(t, m.t, m.t + (m.dur ?? dur))) : 1 };
  }

  // ------------------------------------------------------------------ draw

  draw(c: CanvasRenderingContext2D, f: Frame, k: Look) {
    const t = f.t, mono = this.font('mono');
    const L = this.layout(t), col = this.col(t);
    const his = mixHex(k.dim, k.type, 0.35);
    const hashW = measure('0000000', mono, MONO), oldHashW = measure('0000000', mono, MONO_OLD);
    const pillW = (s: string) => measure(s, mono, PILL) + 24;
    const headW = pillW('HEAD -> main'), origW = pillW('origin/main');
    const head = this.where(this.head, t, HOP), orig = this.where(this.origin, t, REF);
    const presence = (r: Where, id: number) => (r.to === id ? r.p : 0) + (r.from === id ? 1 - r.p : 0);
    const tip = L.s - 1;

    // his history and the side branch (rewrite)
    const oldRows = this.own ? null : this.oldRows(t, L.oldTop);
    // where each place for a ref is at t (left edge of its first label, row centre)
    const spot = (id: number, ref: 'head' | 'origin'): [number, number] => {
      const after = ref === 'origin' ? (headW + 10) * room(head, id) : 0;
      if (id >= 0) return [col + hashW + 18 + after, L.ys[id] ?? L.ys[0] ?? TOP];
      // (not falling with his tip: origin/main is left hanging where it was)
      if (id === OLD0 && oldRows) return [col + oldHashW + 18 + after, oldRows[0]!.y];
      if (id === DANGLE) return [RX - origW / 2, (L.ys[0] ?? TOP) + ROW + 8];
      return [col + hashW + 18 + (headW + 10), (L.ys[tip] ?? TOP) - 110]; // SKY
    };
    const refPos = (r: Where, ref: 'head' | 'origin') => {
      const a = spot(r.from, ref), b = spot(r.to, ref);
      if (r.from === DANGLE) {
        // from under the rail: up beside the rail, across above the tip's row, down into place after HEAD
        const side = RX - origW - 16, above = b[1] - 62, q = (a0: number, a1: number) => ease.inOutCubic(prog(r.p, a0, a1));
        const x = lerp(lerp(a[0], side, q(0, 0.25)), b[0], q(0.5, 0.82));
        const y = lerp(lerp(a[1], above, q(0, 0.55)), b[1], q(0.78, 1));
        return [x, y] as const;
      }
      return [lerp(a[0], b[0], r.p), lerp(a[1], b[1], r.p)] as const;
    };

    this.header(c, t, k, mono);
    if (oldRows) this.drawOld(c, t, k, mono, oldRows, L, col, his, oldHashW);

    // her rail: from the root (or her oldest) to the tip
    if (L.s > 1) {
      c.fillStyle = k.type;
      const y0 = Math.min(...L.ys), y1 = Math.max(...L.ys);
      c.fillRect(RX - 2, y0, 4, y1 - y0);
    }
    // origin/main dangling under the rail: a dashed stub pointing at nothing
    const dangle = presence(orig, DANGLE);
    if (dangle > 0.01 && L.s > 0) {
      const [, dy] = spot(DANGLE, 'origin');
      c.save();
      c.globalAlpha = dangle;
      c.strokeStyle = k.dim; c.lineWidth = 3; c.setLineDash([6, 9]);
      c.beginPath(); c.moveTo(RX, L.ys[0]! + 14); c.lineTo(RX, dy - 24); c.stroke();
      c.restore();
    }

    // her commits
    for (let j = 0; j < L.s; j++) {
      const n = this.nodes[j]!, y = L.ys[j]!;
      const isTip = j === tip, nextArr = this.nodes[j + 1]?.arrive ?? Infinity;
      const appear = j === tip && Number.isFinite(n.arrive) ? clamp(L.a * 1.6) : 1;
      c.globalAlpha = appear;
      this.dot(c, f, k, n, y, isTip);
      // hash: ticking on the beat while the commit is written, set when it lands
      const landed = t >= n.land;
      const h = landed ? n.hash : n.hash.split('').map((_, i) => HEX[Math.floor(hash(j, i, Math.floor(f.beat * 2)) * 16)]).join('');
      text(c, h, col, y + MONO * 0.36, mono, MONO, landed ? k.type : k.dim);
      // the small message on the row: once the next commit has come (the big one shrinks into it)
      const pills = (headW + 10) * room(head, j) + (origW + 10) * room(orig, j);
      const next = Number.isFinite(nextArr);
      const small = !n.cue ? 1 : next ? ease.outCubic(prog(t, nextArr + 0.12, nextArr + 0.36)) : 0;
      if (small > 0) {
        c.globalAlpha = appear * small;
        text(c, n.msg, col + hashW + 18 + pills, y + MONO * 0.36, mono, MONO, k.type);
      }
      c.globalAlpha = 1;
      // (an arriving message shows once its row has mostly opened)
      const reveal = j === tip && Number.isFinite(n.arrive) ? ease.outCubic(prog(L.a, 0.4, 1)) : 1;
      const big = (next ? 1 - ease.outCubic(prog(t, nextArr, nextArr + 0.18)) : 1) * reveal;
      if (n.lay && n.cue && big > 0.01) this.message(c, f, k, n, col, y, big);
    }

    // the refs (origin first, so HEAD leads when they share a row)
    if (orig.from !== SKY || orig.to !== SKY) {
      const [x, y] = refPos(orig, 'origin');
      c.globalAlpha = orig.from === SKY ? orig.p : 1;
      this.pill(c, 'origin/main', x, y, mono, k, false, k.type);
      c.globalAlpha = 1;
    }
    // HEAD hops: it leaves its old row and lights on the new one (it never travels across the message)
    for (const [id, a] of [[head.from, 1 - prog(head.p, 0, 0.45)], [head.to, head.p]] as const) {
      if (a < 0.01) continue;
      const [x, y] = spot(id, 'head');
      c.globalAlpha = a;
      this.pill(c, 'HEAD -> main', x, y + (id === head.to ? 10 * (1 - a) : -6 * (1 - a)), mono, k, true, k.type);
    }
    c.globalAlpha = 1;
  }

  /** A commit dot: hollow while it is written, landing with a hit (accent for an instant), then breathing with the kick. */
  private dot(c: CanvasRenderingContext2D, f: Frame, k: Look, n: Node, y: number, isTip: boolean) {
    const t = f.t, r = isTip ? 15 : 11;
    if (t < n.land) {
      c.strokeStyle = k.type; c.lineWidth = 3.5;
      c.beginPath(); c.arc(RX, y, r - 1.5, 0, Math.PI * 2);
      c.fillStyle = k.bg; c.fill(); c.stroke();
      return;
    }
    const h = Number.isFinite(n.land) ? hit(t, n.land, 0.09) : 0;
    const z = r * (1 + 0.55 * h + (isTip ? 0.06 * f.a.kick : 0));
    c.fillStyle = mixHex(k.type, k.accent, clamp(h * 1.4));
    c.beginPath(); c.arc(RX, y, z, 0, Math.PI * 2); c.fill();
  }

  /** The tip's message: typed with the voice under its row in big display type, the anchor word in accent. */
  private message(c: CanvasRenderingContext2D, f: Frame, k: Look, n: Node, col: number, y: number, alpha: number) {
    const t = f.t, lay = n.lay!, cue = n.cue!, z = this.size, line = cue.line!;
    const base = y + 34 + z * 0.74;
    c.save();
    c.globalAlpha = alpha;
    c.font = font(lay.fam, z);
    c.letterSpacing = `${this.track}px`;
    c.textBaseline = 'alphabetic';
    let caret: [number, number] | null = null;
    for (const [ri, row] of lay.rows.entries()) {
      const by = base + ri * z + (1 - alpha) * 30;
      for (const it of row.items) {
        const n = typedChars(it.w, t);
        if (!n) continue;
        const s = it.w.w.slice(0, n), x = col + it.x;
        const anchor = it.w.index === cue.word?.index;
        c.fillStyle = anchor ? k.accent : k.type;
        if (anchor) {
          // the anchor word pops as it is sung
          const pop = 1 + 0.06 * hit(t, it.w.start, 0.12), cx = x + it.width / 2, cy = by - z * 0.36;
          c.save(); c.translate(cx, cy); c.scale(pop, pop); c.translate(-cx, -cy);
          c.fillText(s, x, by);
          c.restore();
        } else c.fillText(s, x, by);
        caret = [x + measure(s, lay.fam, z, this.track) + z * 0.06, by];
      }
    }
    // the caret after the last typed letter while the line is being sung
    if (caret && t < line.end + 0.15) {
      const [cx, cy] = caret;
      c.fillStyle = k.type;
      c.fillRect(cx, cy - z * 0.74, Math.max(4, z * 0.07), z * 0.86);
    }
    c.restore();
  }

  /** A ref label: HEAD solid, remotes outlined. */
  private pill(c: CanvasRenderingContext2D, s: string, x: number, y: number, mono: string, k: Look, solid: boolean, col: string) {
    const w = measure(s, mono, PILL) + 24, h = 40;
    c.beginPath(); c.roundRect(x, y - h / 2, w, h, 6);
    if (solid) { c.fillStyle = col; c.fill(); }
    else { c.fillStyle = k.bg; c.fill(); c.strokeStyle = col; c.lineWidth = 2; c.stroke(); }
    text(c, s, x + 12, y + PILL * 0.35, mono, PILL, solid ? k.bg : col);
    return w;
  }

  private header(c: CanvasRenderingContext2D, t: number, k: Look, mono: string) {
    text(c, 'git log --graph --oneline', M, HEAD_Y, mono, SMALL, k.dim);
    // the commit count, rolling to each new value
    const i = this.count.findLastIndex((m) => m.t <= t);
    const m = this.count[i]!, from = this.count[i - 1]?.to ?? m.to;
    const v = Number.isFinite(m.t) ? lerp(from, m.to, ease.outCubic(prog(t, m.t, m.t + (Math.abs(m.to - from) > 10 ? 0.7 : 0.2)))) : m.to;
    const unit = Math.round(v) === 1 ? ' commit' : ' commits';
    const uw = measure(unit, mono, SMALL);
    text(c, unit, W - M, HEAD_Y, mono, SMALL, k.dim, { align: 'right' });
    text(c, commas(v), W - M - uw, HEAD_Y, mono, SMALL, k.type, { align: 'right' });
    c.fillStyle = k.rule;
    c.fillRect(M, HEAD_Y + 26, W - 2 * M, 1.5);
  }

  // ------------------------------------------------------------------ his history (rewrite)

  /** His rows at t: their place (the side rows closing up after the tear) and how far they have fallen (collapse). */
  private oldRows(t: number, top: number): OldRow[] {
    const tear = this.at.tear, coll = this.at.collapse;
    const close = tear === undefined ? 0 : ease.inOutCubic(prog(t, tear + 0.4, tear + 0.9));
    let y = top, mi = 0;
    return this.old.map((o, i) => {
      const r: OldRow = { o, y, fall: 0, i, mi: o.side ? -1 : mi++ };
      y += OLD * (o.side ? 1 - close : 1);
      if (coll !== undefined && !o.side) {
        // the floor drops out: the lowest rows go first, the old tip last
        const u = Math.max(0, t - (coll + 0.16 * Math.max(0, 1 - r.mi / 10)));
        r.fall = 2600 * u * u;
      }
      return r;
    });
  }

  private drawOld(c: CanvasRenderingContext2D, t: number, k: Look, mono: string, rows: OldRow[],
    L: { s: number; ys: number[] }, col: number, his: string, hashW: number) {
    const fadeY = (y: number) => 1 - smoothstep(H - 330, H - 110, y);
    const fallA = (fall: number) => 1 - clamp(fall / 380);
    const tear = this.at.tear, rehash = this.at.rehash;

    // the main rail: one segment above each main row, falling with it
    let prevY = L.s > 0 ? L.ys[0]! : null;
    c.fillStyle = his;
    for (const r of rows) {
      if (r.o.side) continue;
      const y = r.y + r.fall;
      if (prevY !== null) {
        const len = r.y - prevY;
        c.globalAlpha = fadeY(y) * fallA(r.fall);
        c.fillRect(RX - 1.5, y - len, 3, len);
      }
      prevY = r.y;
    }
    c.globalAlpha = 1;

    // main rows: dot, hash (re-rolled on rehash), message
    for (const r of rows) {
      if (r.o.side) continue;
      const y = r.y + r.fall, a = fadeY(y) * fallA(r.fall);
      if (a <= 0.01) continue;
      c.globalAlpha = a;
      c.fillStyle = his;
      c.beginPath(); c.arc(RX, y, 8.5, 0, Math.PI * 2); c.fill();
      let h = r.o.hash, hc = his;
      if (rehash !== undefined && r.o.rehash !== r.o.hash) {
        const t0 = rehash + 0.03 * r.mi, p = prog(t, t0, t0 + 0.45);
        if (p >= 1) h = r.o.rehash;
        else if (p > 0) {
          // ticking: each digit spins, then locks left to right
          h = r.o.hash.split('').map((_, ci) => (p > (ci + 1) / 8 ? r.o.rehash[ci]! : HEX[Math.floor(hash(r.i, ci, Math.floor(frameIdx(t) / 2)) * 16)])).join('');
          hc = k.type;
        }
      }
      text(c, h, col, y + MONO_OLD * 0.36, mono, MONO_OLD, hc);
      // the old tip's message sits after its ref labels while they are there
      const refs = r.mi === 0 ? this.refsOnOld0(t) : 0;
      text(c, r.o.msg, col + hashW + 18 + refs, y + MONO_OLD * 0.36, mono, MONO_OLD, his);
    }
    c.globalAlpha = 1;

    // "… 1,095 commits": where the rail fades out
    const coll = this.at.collapse;
    const ef = coll === undefined ? 0 : 2600 * Math.max(0, t - coll) ** 2;
    c.globalAlpha = fallA(ef);
    text(c, `… ${commas(this.P.commits)} commits`, col, H - 70 + ef, mono, SMALL, k.dim);
    c.globalAlpha = 1;

    // the side branch: struck on the tear's anchor, then torn off and dropped
    const sides = rows.filter((r) => r.o.side);
    if (!sides.length) return;
    const drop = tear === undefined ? 0 : Math.max(0, t - (tear + 0.2));
    if (drop > 0.6) return;
    const forkRow = rows.find((r) => !r.o.side && r.i > sides.at(-1)!.i);
    const fy = forkRow ? forkRow.y : sides.at(-1)!.y + OLD;
    c.save();
    c.globalAlpha = 1 - ease.inQuad(clamp(drop / 0.5));
    c.translate(RX, fy);
    // torn off at the fork: it swings away to the right and falls
    c.translate(260 * drop, 2400 * drop * drop);
    c.rotate(1.4 * drop * drop + 0.5 * drop);
    c.translate(-RX, -fy);
    const lx = RX + LANE;
    c.strokeStyle = his; c.lineWidth = 3;
    c.beginPath();
    c.moveTo(lx, sides[0]!.y);
    c.lineTo(lx, sides.at(-1)!.y);
    c.bezierCurveTo(lx, fy - OLD * 0.35, RX, fy - OLD * 0.55, RX, fy - 9);
    c.stroke();
    sides.forEach((r, j) => {
      c.fillStyle = his;
      c.beginPath(); c.arc(lx, r.y, 8.5, 0, Math.PI * 2); c.fill();
      text(c, r.o.hash, col, r.y + MONO_OLD * 0.36, mono, MONO_OLD, his);
      let x = col + hashW + 18;
      for (const ref of r.o.refs) x += this.pill(c, ref, x, r.y, mono, k, false, his) + 10;
      const end = x + measure(r.o.msg, mono, MONO_OLD);
      text(c, r.o.msg, x, r.y + MONO_OLD * 0.36, mono, MONO_OLD, his);
      // the strike: across the whole row, one after another
      if (tear !== undefined) {
        const p = ease.outCubic(prog(t, tear + 0.035 * j, tear + 0.035 * j + 0.12));
        if (p > 0) { c.fillStyle = k.accent; c.fillRect(lx - 26, r.y - 3, (end + 14 - (lx - 26)) * p, 6); }
      }
    });
    c.restore();
  }

  /** Width the ref labels take on his tip's row at t (they leave it as HEAD and origin/main move off). */
  private refsOnOld0(t: number) {
    const mono = this.font('mono');
    return (measure('HEAD -> main', mono, PILL) + 34) * room(this.where(this.head, t, HOP), OLD0)
      + (measure('origin/main', mono, PILL) + 34) * room(this.where(this.origin, t, REF), OLD0);
  }

  override post(f: Frame) {
    const t = f.t;
    // the stamps: the tear and the collapse shake the frame; every landing and origin/main's arrival nudge it
    const big = Math.max(this.at.tear !== undefined ? hit(t, this.at.tear, 0.08) : 0, this.at.collapse !== undefined ? hit(t, this.at.collapse, 0.1) : 0);
    const small = Math.max(0, ...this.nodes.filter((n) => Number.isFinite(n.land)).map((n) => hit(t, n.land, 0.08)), this.at.origin !== undefined ? hit(t, this.at.origin, 0.1) : 0);
    return { shake: [Math.sin(t * 91) * 9 * big, Math.cos(t * 77) * 6 * big] as [number, number], zoom: 1 + 0.012 * big + 0.006 * small };
  }
}

/** Letters of a word typed by t: from its start at speech speed, all of it by its end. */
function typedChars(w: Word, t: number) {
  if (t < w.start) return 0;
  const n = w.w.length, d = Math.max(0.04, Math.min(w.end - w.start, n * 0.045));
  return Math.min(n, Math.ceil(n * clamp((t - w.start) / d) + 1e-6) || 1);
}
