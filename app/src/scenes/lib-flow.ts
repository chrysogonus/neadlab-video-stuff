// Library: the flow diagram. Each cue adds a node (a rounded box with its label) on its anchor, an arrow
// drawing to it from its parent; the diagram lays itself out in layers (left to right by depth, stacked by
// siblings) and re-flows smoothly as it grows, fitted to the free area. The newest node is outlined in the
// accent, with a packet travelling its edge. From Harvest's protocol diagram; for pipelines, request paths,
// cause and effect, a decision tree.
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import { ease, lerp, prog } from '../engine/util';
import { LibScene, M, W, arrive, label, mixHex, panel, text, wrap, type Look } from './_lib';

export const schema: SceneSchema = {
  description: 'A flow diagram grown one node per cue: each anchor adds a labelled box with an arrow from its parent (the previous node unless `from` says otherwise), the layout re-flowing left to right as it grows. For pipelines, request paths, cause and effect, branching processes.',
  kinds: ['explainer', 'song'],
  lyrics: 'layer',
  entry: {
    title: { type: 'string', default: '', description: 'a kicker, top left (what the diagram shows)' },
  },
  cue: {
    node: { type: 'string', description: 'the node\'s label, a few words' },
    from: { type: 'number', default: -1, min: -1, description: 'the 1-based number of the earlier node its arrow comes from; -1 (default) = the previous node, 0 = none (starts a new branch root)' },
  },
  example: {
    entry: { title: 'What happens after git push' },
    cues: [
      { node: 'git push origin main' },
      { node: 'CI runs the tests' },
      { node: 'Teammates pull', from: 1 },
      { node: 'Deploy to production', from: 2 },
      { node: 'Merge conflicts', from: 3 },
    ],
  },
};

interface P { title: string }
interface C { node: string; from: number }
interface Box { x: number; y: number; w: number; h: number }
/** The diagram once nodes 0..j are in: their boxes (centre, size), label rows and type size. */
interface Lay { boxes: Box[]; rows: string[][]; z: number }

const REFLOW = 0.45; // s the layout takes to settle after a node is added
const DRAW = 0.4; // s an arrow takes to draw

export default class LibFlow extends LibScene<P, C> {
  static schema = schema;
  private labels: string[] = [];
  private parent: number[] = [];
  private lays: Lay[] = [];

  override setup() {
    const body = this.font('body');
    this.cues.forEach((c, i) => {
      const p = this.cp(c);
      this.labels.push(p.node);
      this.parent.push(p.from === 0 ? -1 : p.from > 0 && p.from <= i ? p.from - 1 : i - 1);
    });
    const depth: number[] = [];
    this.parent.forEach((p, i) => depth.push(p < 0 ? 0 : depth[p]! + 1));
    const top = M + (this.P.title ? 80 : 20), bot = this.bottom - 24, availW = W - 2 * M, availH = bot - top;

    for (let j = 0; j < this.cues.length; j++) {
      // a tidy layered layout of nodes 0..j: leaves on consecutive rows in depth-first order, parents centred on
      // their children
      const kids: number[][] = Array.from({ length: j + 1 }, () => []);
      for (let i = 1; i <= j; i++) if (this.parent[i]! >= 0) kids[this.parent[i]!]!.push(i);
      const row: number[] = [];
      let next = 0;
      const place = (i: number): number => {
        const ks = kids[i]!;
        if (!ks.length) return (row[i] = next++);
        const rs = ks.map(place);
        return (row[i] = (rs[0]! + rs.at(-1)!) / 2);
      };
      for (let i = 0; i <= j; i++) if (this.parent[i]! < 0) place(i);
      const cols = Math.max(...depth.slice(0, j + 1)) + 1, rows = next;
      const cw = Math.min(availW / cols, 540), ch = Math.min(availH / rows, 240);
      const bw = Math.min(cw - Math.max(56, Math.min(110, cw * 0.26)), 400), bh0 = Math.min(ch - 40, 136);
      // the largest type size at which every label fits its box on one row, down to 3/4 of the largest; else the
      // largest at which they fit in at most three rows (four when the boxes are narrow)
      const fits = (z: number, max: number) => {
        lrows = this.labels.slice(0, j + 1).map((s) => wrap(s, body, z, bw - 36));
        return lrows.every((r) => r.length <= max && r.length * z * 1.18 + 36 <= bh0);
      };
      let z = 44, lrows: string[][] = [];
      while (z > 32 && !fits(z, 1)) z -= 2;
      if (!fits(z, 1)) for (z = 44; z > 16 && !fits(z, bw < 200 ? 4 : 3); z -= 2);
      const bh = Math.min(bh0, Math.max(...lrows.map((r) => r.length)) * z * 1.18 + 56);
      const x0 = M + (availW - cols * cw) / 2, y0 = top + (availH - rows * ch) / 2;
      this.lays.push({
        boxes: Array.from({ length: j + 1 }, (_, i) => ({ x: x0 + (depth[i]! + 0.5) * cw, y: y0 + (row[i]! + 0.5) * ch, w: bw, h: bh })),
        rows: lrows, z,
      });
    }
  }

  /** The edge from box a to box b: a horizontal S-curve from a's right side to b's left, sampled. */
  private curve(a: Box, b: Box) {
    const x1 = a.x + a.w / 2 + 6, y1 = a.y, x2 = b.x - b.w / 2 - 10, y2 = b.y, dx = Math.max(30, (x2 - x1) * 0.55);
    const pts: { x: number; y: number }[] = [];
    for (let s = 0; s <= 32; s++) {
      const u = s / 32, v = 1 - u;
      pts.push({
        x: v * v * v * x1 + 3 * v * v * u * (x1 + dx) + 3 * v * u * u * (x2 - dx) + u * u * u * x2,
        y: v * v * v * y1 + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u * y2,
      });
    }
    return pts;
  }

  draw(c: CanvasRenderingContext2D, f: Frame, k: Look) {
    const t = f.t, body = this.font('body'), mono = this.font('mono');
    const j = this.cues.findLastIndex((x) => x.at <= t);
    if (this.P.title) {
      c.globalAlpha = arrive(t, this.ctx.start, 0.5);
      c.fillStyle = k.accent; c.fillRect(M, M + 2, 8, 22);
      label(c, this.P.title, M + 26, M + 22, mono, k.dim, 22);
      c.globalAlpha = 1;
    }
    if (j < 0) return;

    // the layout at t: the previous one easing into the newest over REFLOW s from its anchor
    const at = this.cues[j]!.at, B = this.lays[j]!, A = this.lays[j - 1] ?? B;
    const e = prog(t, at, at + REFLOW, ease.inOutCubic);
    const box = (i: number): Box => {
      const b = B.boxes[i]!, a = A.boxes[i] ?? b;
      return { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), w: lerp(a.w, b.w, e), h: lerp(a.h, b.h, e) };
    };
    const z = lerp(A.z, B.z, e);

    // edges, under the boxes: the old ones hairline, the newest in the accent, drawing in from its parent
    for (let i = 1; i <= j; i++) {
      const p = this.parent[i]!;
      if (p < 0) continue;
      const pts = this.curve(box(p), box(i)), newest = i === j;
      const d = newest ? prog(t, at, at + DRAW, ease.outCubic) : 1;
      const settle = i === j - 1 ? 1 - e : 0; // the previous newest edge cools as the next arrives
      const col = newest ? k.accent : mixHex(k.dim, k.accent, settle);
      const n = Math.max(1, Math.round(d * (pts.length - 1)));
      c.strokeStyle = col; c.lineWidth = newest ? 3 : 2; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath();
      for (let s = 0; s <= n; s++) (s ? c.lineTo(pts[s]!.x, pts[s]!.y) : c.moveTo(pts[s]!.x, pts[s]!.y));
      c.stroke();
      if (d > 0.85) { // the arrowhead, along the curve's last stretch
        const q = pts.at(-1)!, r = pts.at(-3)!, ang = Math.atan2(q.y - r.y, q.x - r.x), s = newest ? 13 : 11;
        c.fillStyle = col;
        c.beginPath();
        c.moveTo(q.x + 4, q.y);
        c.lineTo(q.x + 4 - s * Math.cos(ang - 0.45), q.y - s * Math.sin(ang - 0.45));
        c.lineTo(q.x + 4 - s * Math.cos(ang + 0.45), q.y - s * Math.sin(ang + 0.45));
        c.closePath(); c.fill();
      }
      // the packet: a dot running the newest edge, once it is drawn
      const lt = t - at - DRAW;
      if (newest && lt > 0) {
        const ph = (lt / 1.3) % 1, q = pts[Math.round(ph * (pts.length - 1))]!;
        c.globalAlpha = Math.sin(Math.PI * ph);
        c.beginPath(); c.arc(q.x, q.y, 7, 0, Math.PI * 2); c.fillStyle = k.accent; c.fill();
        c.beginPath(); c.arc(q.x, q.y, 14, 0, Math.PI * 2); c.fillStyle = k.a('accent', 0.2); c.fill();
        c.globalAlpha = 1;
      }
    }

    // the boxes: panel, hairline (the newest in the accent, arriving), label centred
    for (let i = 0; i <= j; i++) {
      const b = box(i), newest = i === j;
      const a = newest ? arrive(t, at - 0.02, 0.3) : 1, sc = newest ? lerp(0.9, 1, ease.outBack(Math.min(1, a))) : 1;
      const lit = newest ? 1 : i === j - 1 ? 1 - e : 0;
      c.save();
      c.globalAlpha = a;
      c.translate(b.x, b.y); c.scale(sc, sc);
      panel(c, -b.w / 2, -b.h / 2, b.w, b.h, k.panel, undefined, 14);
      c.strokeStyle = mixHex(k.rule, k.accent, lit); c.lineWidth = lerp(1.5, 3, lit);
      c.beginPath(); c.roundRect(-b.w / 2, -b.h / 2, b.w, b.h, 14); c.stroke();
      const rows = (e < 0.5 ? A : B).rows[i] ?? B.rows[i]!, lh = z * 1.18;
      rows.forEach((r, ri) => text(c, r, 0, (ri - (rows.length - 1) / 2) * lh + z * 0.36, body, z, newest ? k.type : mixHex(k.type, k.dim, 0.25), { align: 'center' }));
      // its number (what a later cue's `from` names), a small kicker over the box's corner
      if (b.h > 56) text(c, String(i + 1).padStart(2, '0'), -b.w / 2 + 2, -b.h / 2 - 12, mono, 16, newest ? k.accent : k.dim, { track: 1.5 });
      c.restore();
    }
  }
}
