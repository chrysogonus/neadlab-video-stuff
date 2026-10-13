// Library: numbered steps. The current step stands large with its number in an accent disc and an optional detail
// line under it; on each cue's anchor the next one lands and the one before shrinks into a rail on the left with a
// check mark. A segmented bar and "02 / 04" say how far along it is. Before the first anchor the entry's title
// holds the stage. For explainers that walk through a procedure: a handshake, a deploy, a recipe.
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import { measure } from '../engine/type';
import { clamp, ease, lerp, prog } from '../engine/util';
import { LibScene, M, W, arrive, balanced, label, mixHex, text, type Look } from './_lib';

export const schema: SceneSchema = {
  description: 'Numbered steps: on each cue\'s anchor the next step lands large with its number in an accent disc (and an optional detail line), while the earlier ones collect in a checked rail with a progress bar. For procedures and sequences an explainer walks through.',
  kinds: ['explainer'],
  lyrics: 'layer',
  entry: {
    title: { type: 'string', default: '', description: 'what the steps are for, shown before the first step and above the rail' },
  },
  cue: {
    step: { type: 'string', description: 'the step, short (2–6 words read best)' },
    detail: { type: 'string', default: '', description: 'an optional sentence under the step' },
  },
  example: {
    entry: { title: 'The TLS handshake' },
    cues: [
      { step: 'Client hello', detail: 'Your browser lists the ciphers it speaks and sends a random number.' },
      { step: 'Server certificate', detail: 'The server proves who it is with a certificate signed by an authority your browser trusts.' },
      { step: 'Key exchange', detail: 'Both sides derive the same session key without ever sending it.' },
      { step: 'Encrypted from here on', detail: 'Every byte after the handshake is sealed with that key.' },
    ],
  },
};

interface P { title: string }
interface C { step: string; detail: string }

const RAIL = { x: M, w: 470, pitch: 66 };
const MAIN = { x: M + 600, w: W - M - (M + 600) };
const DISC = 62; // radius of the current step's disc
const OUT = 0.2, IN = 0.6; // s the old step takes to clear and the new one to land (its text after the old is gone)

/** A step laid out for the main area: wrapped rows and sizes. */
interface Lay { rows: string[]; size: number; detail: string[]; dsize: number; h: number }

export default class LibSteps extends LibScene<P, C> {
  static schema = schema;
  private lays: Lay[] = [];
  private rail: string[] = [];
  private title: Lay | null = null;
  private top = M + 120; // where the rail and the main block start

  override setup() {
    const fam = this.font('display'), body = this.font('body');
    const room = this.bottom - this.top - 20;
    const lay = (s: string, d: string, max: number): Lay => {
      // the largest step size that wraps to 3 rows or fewer and leaves room for the detail
      for (let size = max; ; size -= 4) {
        const rows = balanced(s, fam, size, MAIN.w);
        const dsize = Math.max(30, Math.min(40, Math.round(size * 0.4)));
        const detail = d ? balanced(d, body, dsize, MAIN.w - 40).slice(0, 3) : [];
        const h = DISC * 2 + 44 + size * 0.8 + (rows.length - 1) * size * 1.02 + size * 0.22 + (detail.length ? 30 + dsize * 0.8 + (detail.length - 1) * dsize * 1.3 : 0);
        const wide = Math.max(...rows.map((r) => measure(r, fam, size)));
        if ((rows.length <= 3 && h <= room && wide <= MAIN.w) || size <= 52) {
          // a single word wider than the room at the smallest size: smaller still
          const z = wide > MAIN.w ? Math.floor((size * MAIN.w) / wide) : size;
          return { rows: rows.slice(0, 3), size: z, detail, dsize, h: h - (size - z) * rows.length };
        }
      }
    };
    const body28 = 30;
    this.lays = this.cues.map((c) => { const p = this.cp(c); return lay(p.step, p.detail, 112); });
    this.rail = this.cues.map((c) => {
      // one row in the rail: cut with an ellipsis when it does not fit
      let s = this.cp(c).step;
      while (s.length > 1 && measure(s, body, body28) > RAIL.w - 70) s = `${s.slice(0, -2).trimEnd()}…`;
      return s;
    });
    if (this.P.title) this.title = lay(this.P.title, '', 120);
  }

  /** Index of the step that has landed by t (-1 before the first anchor). */
  private current(t: number) { return this.cues.findLastIndex((c) => c.at <= t); }

  draw(c: CanvasRenderingContext2D, f: Frame, k: Look) {
    const t = f.t, mono = this.font('mono'), body = this.font('body'), N = this.cues.length;
    const i = this.current(t);

    // progress: "02 / 04" and one segment per step, the current one filling on its anchor
    if (this.P.title) label(c, this.P.title, RAIL.x, M + 26, mono, k.dim, 22);
    const shown = Math.max(0, i) + 1;
    const nw = text(c, ` / ${String(N).padStart(2, '0')}`, W - M, M + 28, mono, 26, k.dim, { align: 'right' });
    text(c, String(shown).padStart(2, '0'), W - M - nw, M + 28, mono, 26, i >= 0 ? k.type : k.dim, { align: 'right' });
    const gap = 10, sw = (W - 2 * M - gap * (N - 1)) / Math.max(1, N), sy = M + 58;
    for (let j = 0; j < N; j++) {
      const sx = M + j * (sw + gap);
      c.fillStyle = k.rule; c.fillRect(sx, sy, sw, 4);
      const p = prog(t, this.cues[j]!.at, this.cues[j]!.at + 0.45, ease.inOutCubic);
      if (p > 0) { c.fillStyle = k.accent; c.fillRect(sx, sy, sw * p, 4); }
    }

    this.drawRail(c, t, i, k, mono, body);
    c.fillStyle = k.rule; c.fillRect(MAIN.x - 64, this.top, 1.5, this.bottom - this.top);

    // the main block: the outgoing step (or the title) leaves as the new one lands on the anchor
    const at = i >= 0 ? this.cues[i]!.at : 1e9;
    if (t < at + OUT) {
      const o = prog(t, at, at + OUT, ease.outCubic), dx = -50 * ease.inOutCubic(prog(t, at, at + OUT));
      if (i > 0) this.block(c, this.lays[i - 1]!, i - 1, 1 - o, dx, f, k);
      else this.block(c, this.title ?? this.lays[0]!, -1, 1 - o, dx, f, k);
    }
    if (i >= 0) this.block(c, this.lays[i]!, i, 1, 0, f, k, prog(t, at, at + IN));
  }

  /**
   * A step in the main area, `land` 0 → 1 as it arrives; i = -1 is the stage before the first step: the title
   * under a "4 steps" kicker, or (no title) a hollow disc waiting for step 1.
   */
  private block(c: CanvasRenderingContext2D, lay: Lay, i: number, alpha: number, dx: number, f: Frame, k: Look, land = 1) {
    const fam = this.font('display'), body = this.font('body');
    const y0 = this.top + Math.max(0, (this.bottom - this.top - lay.h) / 2 - 20);
    const cx = MAIN.x + DISC + dx, cy = y0 + DISC;
    c.save();
    c.globalAlpha = alpha;
    if (i < 0 && !this.title) {
      c.beginPath(); c.arc(cx, cy, DISC * (1 + 0.04 * f.a.kick), 0, Math.PI * 2);
      c.strokeStyle = k.rule; c.lineWidth = 3; c.stroke();
      text(c, '1', cx, cy + DISC * 0.36, fam, DISC * 0.98, k.dim, { align: 'center' });
      c.restore();
      return;
    }
    if (i < 0) label(c, `${this.cues.length} steps`, MAIN.x + dx, cy + 8, this.font('mono'), k.accent, 24);
    else {
      // the disc: pops in with a little overshoot, then breathes with the kick
      const r = DISC * lerp(0.4, 1, ease.outBack(clamp(land / 0.7))) * (1 + 0.025 * f.a.kick);
      c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fillStyle = k.accent; c.fill();
      c.globalAlpha = alpha * clamp(land * 3);
      text(c, String(i + 1), cx, cy + DISC * 0.36, fam, DISC * 0.98, k.onAccent, { align: 'center' });
    }
    // the step, then its detail, sliding in after the disc
    const a1 = ease.outCubic(prog(land, OUT / IN, 0.9)), a2 = ease.outCubic(prog(land, 0.5, 1));
    let y = cy + DISC + 44 + lay.size * 0.8;
    c.globalAlpha = alpha * a1;
    lay.rows.forEach((r, j) => text(c, r, MAIN.x + dx + (1 - a1) * 44, y + j * lay.size * 1.02, fam, lay.size, k.type));
    c.globalAlpha = alpha * a2;
    y += (lay.rows.length - 1) * lay.size * 1.02 + lay.size * 0.22 + 30 + lay.dsize * 0.8;
    for (const r of lay.detail) { text(c, r, MAIN.x + dx + (1 - a2) * 44, y, body, lay.dsize, mixHex(k.type, k.dim, 0.45)); y += lay.dsize * 1.3; }
    c.restore();
  }

  /** The rail: every step as a row, checked once passed, the current one lit, the ones to come as hollow numbers. */
  private drawRail(c: CanvasRenderingContext2D, t: number, i: number, k: Look, mono: string, body: string) {
    const N = this.cues.length, fit = Math.max(1, Math.floor((this.bottom - this.top) / RAIL.pitch));
    // more steps than rows: the rail scrolls to keep the current one in view
    const off = (j: number) => clamp(j - fit + 2, 0, Math.max(0, N - fit));
    const scroll = this.cues.reduce((s, q, j) => s + (off(j) - (j ? off(j - 1) : 0)) * prog(t, q.at, q.at + 0.5, ease.inOutCubic), 0);
    c.save();
    c.beginPath(); c.rect(RAIL.x - 10, this.top - 10, RAIL.w + 20, this.bottom - this.top + 10); c.clip();
    for (let j = 0; j < N; j++) {
      const q = this.cues[j]!, y = this.top + (j - scroll) * RAIL.pitch + 26, cx = RAIL.x + 20;
      const on = arrive(t, q.at, 0.35); // landed
      const done = j < i ? arrive(t, this.cues[j + 1]!.at, 0.35) : 0; // passed
      c.beginPath(); c.arc(cx, y, 20, 0, Math.PI * 2);
      if (on > 0 && done < 1) { c.fillStyle = k.a('accent', on * (1 - done)); c.fill(); }
      c.strokeStyle = mixHex(k.rule, k.dim, done); c.lineWidth = 2; c.stroke();
      if (done > 0) { // the check, drawn as the next step lands
        const p = done;
        c.strokeStyle = k.a('type', 0.8); c.lineWidth = 3; c.lineCap = 'round'; c.lineJoin = 'round';
        c.beginPath(); c.moveTo(cx - 8, y + 1);
        c.lineTo(cx - 8 + 5 * Math.min(1, p * 2), y + 1 + 5 * Math.min(1, p * 2));
        if (p > 0.5) c.lineTo(cx - 3 + 12 * (p - 0.5) * 2, y + 6 - 13 * (p - 0.5) * 2);
        c.stroke();
      } else {
        text(c, String(j + 1), cx, y + 7, mono, 19, on > 0.5 ? k.onAccent : k.dim, { align: 'center' });
      }
      if (on > 0) {
        c.globalAlpha = on;
        text(c, this.rail[j]!, cx + 42 + (1 - on) * 16, y + 10, body, 30, mixHex(k.type, k.dim, 0.75 * done));
        c.globalAlpha = 1;
      }
    }
    c.restore();
  }
}
