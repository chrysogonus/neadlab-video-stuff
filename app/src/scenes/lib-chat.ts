// Library: the message thread. Each cue is a message in a calm chat column filling the frame: a typing indicator (three
// dots rippling on the beat) comes first, then the bubble arrives on its line's first word and its text types
// with the voice, the rest of it waiting faint. Messages from `them` sit left in a quiet panel colour, messages
// from `me` right in accent; the thread stacks upward and older messages scroll up and fade under a minimal
// contact header. From Force Push's phone; for conversations, texts, DMs, anything said to someone.
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import type { ResolvedCue } from '../engine/cues';
import { measure, smart } from '../engine/type';
import { clamp, ease, prog, smoothstep } from '../engine/util';
import { LibScene, M, W, H, mixHex, text, typedWith, wrap, type Look } from './_lib';

export const schema: SceneSchema = {
  description: 'A minimal messaging thread: each cue is a message bubble (from them, left, or me, right, in accent), announced by a typing indicator and typed with the voice; older messages scroll up. For conversations, texts and DMs.',
  kinds: ['song', 'explainer'],
  lyrics: 'own',
  entry: {
    name: { type: 'string', default: 'Unknown', description: 'the contact in the header (their name; its first letter fills the avatar)' },
  },
  cue: {
    from: { type: 'string', enum: ['them', 'me'], default: 'them', description: 'who sends the message: them (left) or me (right, in accent)' },
    text: { type: 'string', default: '', description: 'the message (typed with the sung line); empty: the sung line itself' },
  },
  example: {
    entry: { name: 'Sam' },
    cues: [{}, { from: 'me' }, {}, { from: 'me', text: 'new phone, who\'s this?' }],
  },
};

interface P { name: string }
interface C { from: 'them' | 'me'; text: string }

const COLW = 1160, X0 = (W - COLW) / 2, X1 = X0 + COLW;
const HEAD = M + 124; // the header's rule
const FOOT = H - M - 72; // the composer's top
const FS = 42, LH = 56, PX = 32, PY = 22, MAXW = Math.round(COLW * 0.7); // bubble type, row pitch, padding, widest bubble
const IND_W = 128, IND_H = 74; // the typing indicator
const ARRIVE = 0.3;

interface Msg { cue: ResolvedCue; me: boolean; s: string; rows: string[]; w: number; h: number; tin: number; arr: number; gap: number }

export default class LibChat extends LibScene<P, C> {
  static schema = schema;
  private msgs: Msg[] = [];

  override setup() {
    const fam = this.font('body');
    const cues = this.cues.filter((c) => c.line || this.cp(c).text.trim());
    this.msgs = cues.map((cue, i) => {
      const p = this.cp(cue), me = p.from === 'me';
      const s = (smart(p.text.trim()) || cue.line!.text).split(/\s+/).join(' ');
      // wrapped to the narrowest width that keeps the row count (balanced rows, no widows)
      let rows = wrap(s, fam, FS, MAXW - 2 * PX);
      for (let lo = 120, hi = MAXW - 2 * PX; hi - lo > 4;) {
        const mid = (lo + hi) / 2, r = wrap(s, fam, FS, mid);
        if (r.length <= rows.length && Math.max(...r.map((x) => measure(x, fam, FS))) <= mid) { rows = r; hi = mid; } else lo = mid;
      }
      const w = Math.max(...rows.map((r) => measure(r, fam, FS))) + 2 * PX, h = rows.length * LH + 2 * PY - (LH - FS) / 2;
      const arr = cue.line ? cue.line.start : cue.at;
      return { cue, me, s, rows, w, h, tin: arr, arr, gap: 0 };
    });
    this.msgs.forEach((m, i) => {
      const prev = this.msgs[i - 1];
      // the indicator: from a beat after the previous message arrived, at most 1.2 s before this one
      const tin = Math.max(prev ? prev.arr + 0.6 : this.ctx.start, m.arr - 1.2);
      if (m.arr - tin >= 0.3) m.tin = tin;
      m.gap = !prev ? 0 : prev.me === m.me ? 10 : 28;
    });
  }

  draw(c: CanvasRenderingContext2D, f: Frame, k: Look) {
    const t = f.t, body = this.font('body'), mono = this.font('mono');
    const bubble = mixHex(k.bg, k.type, 0.1);

    // the thread, bottom up: each message's slot grows in (indicator, then the bubble) and pushes the rest up
    let y = FOOT - 40;
    c.save();
    c.beginPath(); c.rect(X0 - 40, HEAD + 2, COLW + 80, FOOT - HEAD - 2); c.clip();
    for (let i = this.msgs.length - 1; i >= 0; i--) {
      const m = this.msgs[i]!;
      if (t < m.tin) continue;
      const ind = m.tin < m.arr ? ease.outCubic(prog(t, m.tin, m.tin + 0.25)) : 0;
      const a = ease.outCubic(prog(t, m.arr, m.arr + ARRIVE));
      const h = t < m.arr ? IND_H * ind : IND_H * (m.tin < m.arr ? 1 - a : 0) + m.h * a;
      const grow = t < m.arr ? ind : 1;
      const bottom = y;
      y -= h + m.gap * grow;
      if (bottom < HEAD - 40) break;
      // older messages fade as they near the header
      const fade = smoothstep(HEAD - 20, HEAD + 200, bottom - Math.min(h, 140) / 2);
      c.save();
      c.globalAlpha = fade;
      if (t < m.arr) this.indicator(c, f, k, m, bottom, ind, bubble);
      else this.bubble(c, t, k, m, bottom, bubble, body);
      c.restore();
    }
    c.restore();
    this.chrome(c, t, k, body, mono);
  }

  private indicator(c: CanvasRenderingContext2D, f: Frame, k: Look, m: Msg, bottom: number, a: number, fill: string) {
    const x = m.me ? X1 - IND_W : X0, top = bottom - IND_H;
    c.globalAlpha *= a;
    c.beginPath(); c.roundRect(x, top, IND_W, IND_H, m.me ? [37, 37, 10, 37] : [37, 37, 37, 10]);
    c.fillStyle = fill; c.fill();
    // three dots rippling left to right on every beat
    const ph = f.beat - Math.floor(f.beat);
    for (let j = 0; j < 3; j++) {
      const b = Math.exp(-((ph - 0.08 - j * 0.16) ** 2) / 0.008);
      c.beginPath(); c.arc(x + IND_W / 2 + (j - 1) * 27, top + IND_H / 2 - 5 * b, 8.5, 0, Math.PI * 2);
      c.fillStyle = m.me ? k.a('accent', 0.4 + 0.6 * b) : k.a('type', 0.3 + 0.6 * b); c.fill();
    }
  }

  private bubble(c: CanvasRenderingContext2D, t: number, k: Look, m: Msg, bottom: number, fill: string, fam: string) {
    const x = m.me ? X1 - m.w : X0, top = bottom - m.h;
    // in from its tail corner: a little small and low, settling
    const s = 0.9 + 0.1 * ease.outBack(clamp((t - m.arr) / ARRIVE), 1.4);
    const ox = m.me ? X1 : X0;
    c.translate(ox, bottom); c.scale(s, s); c.translate(-ox, -bottom);
    c.globalAlpha *= clamp((t - m.arr) / 0.12);
    c.beginPath(); c.roundRect(x, top, m.w, m.h, m.me ? [32, 32, 10, 32] : [32, 32, 32, 10]);
    c.fillStyle = m.me ? k.accent : fill; c.fill();
    // the text, typed with the voice over a faint copy of the rest
    const n = m.cue.line ? typedWith(m.s, m.cue.line.words, t).length : m.s.length;
    const col = m.me ? k.onAccent : k.type, ghost = m.me ? k.a('onAccent', 0.32) : k.a('type', 0.26);
    let off = 0;
    m.rows.forEach((r, i) => {
      const by = top + PY + FS * 0.82 + i * LH, shown = r.slice(0, clamp(n - off, 0, r.length));
      if (shown.length < r.length) text(c, r, x + PX, by, fam, FS, ghost);
      if (shown) text(c, shown, x + PX, by, fam, FS, col);
      off += r.length + 1;
    });
  }

  /** The contact header and the composer. */
  private chrome(c: CanvasRenderingContext2D, t: number, k: Look, body: string, mono: string) {
    const name = this.P.name.trim() || 'Unknown';
    const ay = HEAD - 62, r = 32;
    c.beginPath(); c.arc(X0 + r, ay, r, 0, Math.PI * 2); c.fillStyle = mixHex(k.bg, k.type, 0.16); c.fill();
    text(c, name.charAt(0).toUpperCase(), X0 + r, ay + 12, body, 32, k.type, { align: 'center' });
    c.beginPath(); c.arc(X0 + r * 1.72, ay + r * 0.72, 8, 0, Math.PI * 2); c.fillStyle = k.accent; c.fill();
    c.strokeStyle = k.bg; c.lineWidth = 3; c.stroke();
    text(c, name, X0 + 2 * r + 24, ay - 2, body, 36, k.type);
    const typing = this.msgs.some((m) => !m.me && m.tin < m.arr && t >= m.tin && t < m.arr);
    text(c, typing ? 'typing…' : 'online', X0 + 2 * r + 24, ay + 30, mono, 21, typing ? k.accent : k.dim, { track: 1.5 });
    c.fillStyle = k.rule; c.fillRect(X0, HEAD, COLW, 1.5);
    // the composer: an outlined field with its placeholder
    c.beginPath(); c.roundRect(X0, FOOT, COLW, 72, 36);
    c.strokeStyle = k.rule; c.lineWidth = 1.5; c.stroke();
    text(c, 'Message', X0 + 36, FOOT + 46, body, 28, k.dim);
  }
}
