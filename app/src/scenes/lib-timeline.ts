// Library: the timeline. A horizontal axis of dated events: on each anchor a new event's flag drops onto the
// axis, its date big above and its label below, and the camera glides so the newest sits right of centre while
// the earlier ones recede left, smaller and dimmer. An accent progress line runs along the axis toward the next
// event. From Harvest's year counters and Force Push's graph axis; for histories, release dates, a chain of
// events a line walks through.
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import { clamp, ease, lerp, prog } from '../engine/util';
import { measure } from '../engine/type';
import { LibScene, M, W, arrive, fitSize, label, mixHex, text, wrap, type Look } from './_lib';

export const schema: SceneSchema = {
  description: 'A horizontal timeline: each cue drops a dated event onto the axis on its anchor (the date big, a short label under it) and the view pans so the newest sits right of centre, earlier events receding left. For histories, versions, a sequence of dated events.',
  kinds: ['explainer', 'song'],
  lyrics: 'layer',
  entry: {
    title: { type: 'string', default: '', description: 'a kicker, top left (what the timeline is of)' },
  },
  cue: {
    date: { type: 'string', description: 'the event\'s date, shown big: a year or a short date, e.g. "1977", "Mar 2021"' },
    label: { type: 'string', description: 'what happened, a few words (wraps to three rows at most)' },
  },
  example: {
    entry: { title: 'A short history of version control' },
    cues: [
      { date: '1972', label: 'SCCS tracks changes to single files' },
      { date: '1990', label: 'CVS lets a whole team commit' },
      { date: '2005', label: 'Linus writes Git in ten days' },
      { date: '2008', label: 'GitHub opens; push goes social' },
    ],
  },
};

interface P { title: string }
interface C { date: string; label: string }

const S = 680; // world px from an event to the next, at least
const AX = W * 0.56; // screen x of the newest event
const PAN = 0.9; // s the camera takes to the newest event

export default class LibTimeline extends LibScene<P, C> {
  static schema = schema;
  private dates: string[] = [];
  private labels: string[][] = [];
  private lzs: number[] = [];
  /** World x of each event (the first at 0): a long date pushes the next one further along. */
  private xs: number[] = [];
  private dz = 136;

  override setup() {
    const disp = this.font('display'), body = this.font('body');
    for (const c of this.cues) this.dates.push(this.cp(c).date);
    // one date size for all (the rhythm of the axis): the largest at which the longest date fits 760 px
    this.dz = Math.min(136, ...this.dates.map((d) => fitSize(d, disp, 760, 136, 40)));
    let x = 0;
    this.cues.forEach((c, i) => {
      this.xs.push(x);
      const span = Math.max(S, measure(this.dates[i]!, disp, this.dz) + 150), room = span - 130;
      x += span;
      // each label at the largest size (34..24) at which it fits three rows; past that, cut with an ellipsis
      const s = this.cp(c).label;
      let z = 34, rows = wrap(s, body, z, room);
      while (rows.length > 3 && z > 24) rows = wrap(s, body, (z -= 2), room);
      if (rows.length > 3) {
        let r = rows[2]!;
        while (r.includes(' ') && measure(r + '…', body, z) > room) r = r.slice(0, r.lastIndexOf(' '));
        rows = [rows[0]!, rows[1]!, r.replace(/[\s,.;:]+$/, '') + '…'];
      }
      this.labels.push(rows);
      this.lzs.push(z);
    });
  }

  /** World x at a continuous event index (before the first and past the last: S per event). */
  private wx(u: number) {
    const n = this.xs.length;
    if (!n) return 0;
    if (u <= 0) return u * S;
    if (u >= n - 1) return this.xs[n - 1]! + (u - n + 1) * S;
    const i = Math.floor(u);
    return lerp(this.xs[i]!, this.xs[i + 1]!, u - i);
  }

  draw(c: CanvasRenderingContext2D, f: Frame, k: Look) {
    const t = f.t, disp = this.font('display'), body = this.font('body'), mono = this.font('mono');
    const n = this.cues.length, j = this.cues.findLastIndex((x) => x.at <= t);
    const ay = Math.round((M + this.bottom) / 2) + 10;
    const intro = arrive(t, this.ctx.start, 0.5);

    if (this.P.title) {
      c.globalAlpha = intro;
      c.fillStyle = k.accent; c.fillRect(M, M + 2, 8, 22);
      label(c, this.P.title, M + 26, M + 22, mono, k.dim, 22);
      c.globalAlpha = 1;
    }

    // camera: the newest event at AX, gliding to each new one over PAN s around its anchor (so it lands near
    // the middle of the move); u is the event the camera is on, continuously
    let u = 0;
    for (let i = 1; i < n; i++) u += prog(t, this.cues[i]!.at - PAN * 0.55, this.cues[i]!.at + PAN * 0.45, ease.inOutCubic);
    const cam = this.wx(u), sx = (i: number) => AX + this.wx(i) - cam;

    // the axis, and the progress line toward the next event (from offscreen before the first)
    let head: number;
    if (j < 0) head = lerp(-1, 0, prog(t, this.ctx.start, this.cues[0]?.at ?? t, ease.inOutQuad));
    else if (j < n - 1) head = j + prog(t, this.cues[j]!.at, this.cues[j + 1]!.at, ease.inOutQuad);
    else head = j + 0.35 * prog(t, this.cues[j]!.at, this.cues[j]!.at + 4, ease.outCubic);
    const hx = sx(head);
    c.fillStyle = k.rule; c.fillRect(0, ay - 0.5, W * intro, 1.5);
    c.fillStyle = k.accent; c.fillRect(0, ay - 1.5, Math.max(0, hx), 3);
    c.beginPath(); c.arc(hx, ay, 5, 0, Math.PI * 2); c.fill();
    // the events still to come: small ticks
    for (let i = Math.max(0, j + 1); i < n; i++) {
      const x = sx(i);
      if (x > W + 10) break;
      c.fillStyle = i <= head ? k.accent : k.rule; c.fillRect(x - 1, ay - 8, 2, 16);
    }

    // the events: a flag (dot on the axis, a hairline up to the date), the date above, the label below
    for (let i = 0; i <= j; i++) {
      const x = sx(i);
      if (x < -2 * S || x > W + 40) continue;
      const at = this.cues[i]!.at, age = clamp(u - i, 0, 3), old = clamp(age);
      const drop = prog(t, at, at + 0.35, ease.outBack), a = arrive(t, at, 0.3);
      const fade = 1 - 0.3 * clamp(age - 0.5, 0, 2.5); // receding: dimmer the further back
      const dz = this.dz * lerp(1, 0.66, old), col = mixHex(k.type, k.dim, old);

      c.globalAlpha = fade;
      // the flag's hairline grows up from the axis
      const fh = (dz * 0.74 + 46) * ease.outCubic(prog(t, at, at + 0.4));
      c.fillStyle = mixHex(k.accent, k.rule, old); c.fillRect(x - 1, ay - fh, 2, fh);
      // the dot drops onto the axis
      const dy = (1 - drop) * -50;
      c.globalAlpha = fade * clamp(drop * 3);
      c.beginPath(); c.arc(x, ay + dy, lerp(10, 6, old), 0, Math.PI * 2);
      c.fillStyle = k.bg; c.fill();
      c.lineWidth = 3; c.strokeStyle = mixHex(k.accent, k.dim, old); c.stroke();
      if (old < 1) { c.beginPath(); c.arc(x, ay + dy, 5 * (1 - old), 0, Math.PI * 2); c.fillStyle = k.accent; c.fill(); }

      c.globalAlpha = fade * a;
      text(c, this.dates[i]!, x + 22, ay - 40 + (1 - a) * 18, disp, dz, col);
      const lz = this.lzs[i]! * lerp(1, 0.85, old);
      this.labels[i]!.forEach((r, ri) => text(c, r, x + 22, ay + 30 + lz * (1 + ri * 1.22) - (1 - a) * 12, body, lz, mixHex(k.type, k.dim, Math.max(0.15, old))));
      c.globalAlpha = 1;
    }

    // a ring spreading from the newest dot as it lands
    if (j >= 0) {
      const lt = t - this.cues[j]!.at - 0.2;
      if (lt > 0 && lt < 0.6) {
        c.beginPath(); c.arc(sx(j), ay, 10 + 34 * ease.outCubic(lt / 0.6), 0, Math.PI * 2);
        c.strokeStyle = k.a('accent', 0.6 * (1 - lt / 0.6)); c.lineWidth = 2; c.stroke();
      }
    }

    // the left edge fades into the ground, so the receding events dissolve rather than clip
    const g = c.createLinearGradient(0, 0, 300, 0);
    g.addColorStop(0, k.a('bg', 1)); g.addColorStop(1, k.a('bg', 0));
    c.fillStyle = g; c.fillRect(0, M + 40, 300, this.bottom - M - 40);
  }
}
