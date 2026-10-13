// Library: the code panel. A calm editor: each cue appends its `code` to the file, typed over the line, with line
// numbers in a gutter and a minimal highlight (keywords, strings, numbers, comments); on the anchor the cue's
// `focus` lines light up behind a soft accent bar while the rest of the file dims, and the view scrolls to keep
// the newest code (or the focused lines) in sight. For explainers that build up or walk through a piece of code.
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import { measure } from '../engine/type';
import { clamp, ease, lerp, prog } from '../engine/util';
import { LibScene, M, W, cursorOn, label, mixHex, panel, text, type Look } from './_lib';

const LANGS = ['ts', 'js', 'py', 'go', 'rust', 'c', 'sh', 'sql', 'text'] as const;
type Lang = (typeof LANGS)[number];

export const schema: SceneSchema = {
  description: 'An editor panel: each cue appends code to a file, typed over its line, and on the anchor highlights the `focus` lines while the rest dims. For explainers that build up or walk through a short program, config or query.',
  kinds: ['explainer'],
  lyrics: 'layer',
  entry: {
    title: { type: 'string', default: '', description: 'the file name in the panel\'s header, e.g. "server.ts"' },
    lang: { type: 'string', default: 'ts', enum: LANGS, description: 'language for the keyword/string/comment highlight (text = none)' },
  },
  cue: {
    code: { type: 'string', description: 'the lines appended to the file (\\n between lines; a leading \\n leaves a blank line), typed over the cue\'s line' },
    focus: { type: 'number[]', default: [], description: 'file line numbers (1-based, as in the gutter) to highlight on the anchor; empty = no highlight' },
  },
  example: {
    entry: { title: 'tls-client.ts', lang: 'ts' },
    cues: [
      { code: '// 1. open a TCP connection and start TLS\nconst socket = tls.connect(443, \'example.com\');' },
      { code: '\n// 2. trust it only if the certificate checks out\nif (!socket.authorized) throw new Error(socket.authorizationError);', focus: [5] },
      { code: '\n// 3. from here on, every byte is encrypted\nsocket.write(\'GET / HTTP/1.1\\r\\nHost: example.com\\r\\n\\r\\n\');', focus: [8] },
      { code: 'socket.on(\'data\', (chunk) => console.log(chunk.length, \'bytes\'));', focus: [2, 9] },
    ],
  },
};

interface P { title: string; lang: Lang }
interface C { code: string; focus: number[] }

// ------------------------------------------------------------------ highlight

type Tok = 'kw' | 'str' | 'num' | 'com' | 'punct' | 'id';
const KW: Record<string, string> = {
  js: 'const let var function return if else for while do switch case break continue new class extends import export from default async await try catch finally throw typeof instanceof in of this super null undefined true false void interface type enum implements yield as',
  py: 'def return if elif else for while in not and or is import from as class try except finally raise with lambda None True False pass break continue yield async await global nonlocal assert del self',
  go: 'func package import var const type struct interface map chan go defer return if else for range switch case default break continue select nil true false err',
  rust: 'fn let mut pub struct enum impl trait use mod match if else for while loop return self Self crate async await move ref where true false as const static dyn',
  c: 'int char void return if else for while do switch case break continue struct typedef static const unsigned long short float double sizeof include define NULL true false',
  sh: 'if then else elif fi for while do done case esac in function return export local echo cd exit set sudo',
  sql: 'select from where insert into values update set delete create table index join left right inner outer on as and or not null group by order limit having primary key references distinct count',
};
const kwOf = (l: Lang) => new Set((KW[l === 'ts' ? 'js' : l] ?? '').split(' ').filter(Boolean));
const commentOf = (l: Lang) => (l === 'py' || l === 'sh' ? '#' : l === 'sql' ? '--' : '//');

/** A line split into runs of one role (a tiny line-based tokenizer: no multi-line strings or comments). */
function tokenize(s: string, lang: Lang): { a: number; b: number; k: Tok }[] {
  if (lang === 'text') return s ? [{ a: 0, b: s.length, k: 'id' }] : [];
  const kw = kwOf(lang), com = commentOf(lang), out: { a: number; b: number; k: Tok }[] = [];
  const re = /("(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?|`(?:[^`\\]|\\.)*`?)|(\b\d[\w.]*)|([A-Za-z_$][\w$]*)|(\s+)|([^\w\s"'`]+?)/y;
  let i = 0;
  while (i < s.length) {
    if (s.startsWith(com, i)) { out.push({ a: i, b: s.length, k: 'com' }); break; }
    re.lastIndex = i;
    const m = re.exec(s);
    if (!m) { out.push({ a: i, b: i + 1, k: 'id' }); i++; continue; }
    const k: Tok = m[1] ? 'str' : m[2] ? 'num' : m[3] ? (kw.has(lang === 'sql' ? m[3].toLowerCase() : m[3]) ? 'kw' : 'id') : m[5] ? 'punct' : 'id';
    out.push({ a: i, b: i + m[0].length, k });
    i += m[0].length;
  }
  return out;
}

// ------------------------------------------------------------------ scene

const HEAD = 64; // header height
const PAD = 40;

/** A display row: part of a file line (long lines wrap), when its first character is typed. */
interface Row { line: number; a: number; b: number; t: number }
/** A file line: its text, cue, offset of its first character in the cue's code, and its runs. */
interface FLine { s: string; cue: number; o: number; toks: { a: number; b: number; k: Tok }[] }

export default class LibCode extends LibScene<P, C> {
  static schema = schema;
  private lines: FLine[] = [];
  private rows: Row[] = [];
  private win: { t0: number; t1: number; focus: number; code: string; lines: Set<number> }[] = [];
  private size = 34;
  private lh = 54;
  private cw = 20;
  private cols = 80;
  private gut = 80;
  private box = { x: M, y: M, w: W - 2 * M, h: 0 };

  override setup() {
    const mono = this.font('mono');
    this.box.h = this.bottom - M;
    this.cues.forEach((c, i) => {
      const p = this.cp(c);
      // typing runs from the line's start to the anchor (or over the whole line when the anchor opens it)
      const t0 = c.start, t1 = c.at > t0 + 0.5 ? c.at : Math.max(c.end, t0 + 0.6);
      this.win.push({ t0, t1, focus: Math.max(c.at, t1), code: p.code, lines: new Set(p.focus) });
      let o = 0;
      for (const s of p.code.split('\n')) { this.lines.push({ s, cue: i, o, toks: tokenize(s, this.P.lang) }); o += s.length + 1; }
    });
    // the largest size (34 → 24) at which the longest line fits; beyond that, long lines wrap
    const digits = Math.max(2, String(this.lines.length).length);
    const longest = Math.max(1, ...this.lines.map((l) => l.s.length));
    for (this.size = 34; this.size > 24; this.size--) {
      const cw = measure('0', mono, this.size);
      if (longest * cw <= this.box.w - 2 * PAD - (digits + 2) * cw) break;
    }
    this.cw = measure('0', mono, this.size);
    this.lh = Math.round(this.size * 1.62);
    this.gut = (digits + 2) * this.cw;
    this.cols = Math.floor((this.box.w - 2 * PAD - this.gut) / this.cw);
    this.lines.forEach((l, li) => {
      const w = this.win[l.cue]!, n = Math.max(1, w.code.length);
      for (let a = 0; a === 0 || a < l.s.length; a += this.cols)
        this.rows.push({ line: li, a, b: Math.min(l.s.length, a + this.cols), t: lerp(w.t0, w.t1, (l.o + a) / n) });
    });
  }

  /** Characters of cue i's code typed by t. */
  private typed(i: number, t: number) { const w = this.win[i]!; return Math.round(w.code.length * prog(t, w.t0, w.t1)); }

  draw(c: CanvasRenderingContext2D, f: Frame, k: Look) {
    const t = f.t, mono = this.font('mono'), { x, y, w, h } = this.box;
    panel(c, x, y, w, h, k.panel, k.rule, 16);
    // header: the file name with a lit dot, the language on the right
    c.beginPath(); c.arc(x + PAD + 5, y + HEAD / 2, 5, 0, Math.PI * 2); c.fillStyle = k.accent; c.fill();
    text(c, this.P.title || 'untitled', x + PAD + 24, y + HEAD / 2 + 8, mono, 23, k.type);
    if (this.P.lang !== 'text') label(c, this.P.lang, x + w - PAD, y + HEAD / 2 + 7, mono, k.dim, 18, 'right');
    c.fillStyle = k.rule; c.fillRect(x, y + HEAD, w, 1.5);

    const top = y + HEAD + PAD * 0.7, capH = y + h - PAD * 0.7 - top;
    const ci = this.cues.findLastIndex((q) => q.start <= t + 1e-6);
    const cur = Math.max(0, ci);

    // focus: on the cue's anchor (once its code is typed), until the next cue starts typing
    const win = this.win[cur];
    const fk = win && ci >= 0 && win.lines.size
      ? ease.inOutCubic(prog(t, win.focus, win.focus + 0.4)) * (1 - ease.inOutCubic(prog(t, this.win[cur + 1]?.t0 ?? 1e9, (this.win[cur + 1]?.t0 ?? 1e9) + 0.3)))
      : 0;

    // scroll: the newest row in view, or the focused lines when they are above it
    const shown = this.rows.filter((r) => t >= r.t);
    const grow = (r: Row) => this.lh * ease.outCubic(prog(t, r.t, r.t + 0.16));
    const total = shown.reduce((s, r) => s + grow(r), 0);
    let scroll = Math.max(0, total - capH);
    if (fk > 0) {
      const fy = shown.map((r, j) => (win!.lines.has(r.line + 1) ? j * this.lh : -1)).filter((v) => v >= 0);
      if (fy.length) {
        const lo = Math.min(...fy), hi = Math.max(...fy) + this.lh;
        const want = lo < scroll || hi > scroll + capH ? clamp((lo + hi - capH) / 2, 0, Math.max(0, total - capH)) : scroll;
        scroll = lerp(scroll, want, fk);
      }
    }

    const gutX = x + PAD, codeX = gutX + this.gut;
    const caretLine = this.caret(t);
    const num = mixHex(k.dim, k.bg, 0.25);
    const role: Record<Tok, string> = { kw: k.accent, str: k.accent2, num: k.accent2, com: k.dim, punct: mixHex(k.type, k.dim, 0.45), id: k.type };
    c.save();
    c.beginPath(); c.rect(x, top - 6, w, capH + 12); c.clip();
    let ry = top - scroll;
    for (const r of shown) {
      const gh = grow(r), l = this.lines[r.line]!;
      if (ry + gh < top - this.lh || ry > top + capH) { ry += gh; continue; }
      const lit = fk > 0 && win!.lines.has(r.line + 1);
      const base = ry + this.lh / 2 + this.size * 0.36;
      // the line the caret is on gets a faint bar; focused lines a soft accent one with a tick in the gutter
      c.globalAlpha = 1;
      if (lit) {
        c.fillStyle = k.a('accent', 0.1 * fk); c.fillRect(x + 1.5, ry, w - 3, this.lh);
        c.fillStyle = k.a('accent', fk); c.fillRect(x + 1.5, ry, 4, this.lh);
      } else if (r.line === caretLine.line && fk === 0) {
        c.fillStyle = k.a('type', 0.035); c.fillRect(x + 1.5, ry, w - 3, this.lh);
      }
      c.globalAlpha = clamp((t - r.t) / 0.08) * (lit ? 1 : 1 - 0.68 * fk);
      if (r.a === 0) text(c, String(r.line + 1), codeX - this.cw * 1.5, base, mono, this.size * 0.8, r.line === caretLine.line || lit ? k.dim : num, { align: 'right' });
      // the typed part of this row, run by run
      const n = clamp(this.typed(l.cue, t) - l.o, 0, l.s.length);
      for (const tk of l.toks) {
        const a = Math.max(tk.a, r.a), b = Math.min(tk.b, r.b, n);
        if (b > a) text(c, l.s.slice(a, b), codeX + (a - r.a) * this.cw, base, mono, this.size, role[tk.k]);
      }
      // the caret: solid while typing, blinking on the beat while it waits
      if (r.line === caretLine.line && caretLine.col >= r.a && (caretLine.col < r.b + (r.b === l.s.length ? 1 : 0))) {
        const typing = ci >= 0 && t >= this.win[cur]!.t0 && t < this.win[cur]!.t1;
        if (typing || cursorOn(f.beat)) {
          c.globalAlpha = 1;
          c.fillStyle = k.accent;
          c.fillRect(codeX + (caretLine.col - r.a) * this.cw - 1, base - this.size * 0.82, 3, this.size * 1.08);
        }
      }
      ry += gh;
    }
    c.restore();
    if (total > capH + 1) { // the rows scrolled away fade under the header
      const g = c.createLinearGradient(0, top - 6, 0, top + 36);
      g.addColorStop(0, k.a('panel', 1)); g.addColorStop(1, k.a('panel', 0));
      c.fillStyle = g; c.fillRect(x + 2, top - 6, w - 4, 42);
    }
  }

  /** Where the caret is at t: the file line and column after the last typed character. */
  private caret(t: number) {
    let li = -1, col = 0;
    for (let j = 0; j < this.lines.length; j++) {
      const l = this.lines[j]!, n = this.typed(l.cue, t);
      if (n < l.o || (l.o === 0 && t < this.win[l.cue]!.t0)) break;
      li = j; col = Math.min(l.s.length, n - l.o);
    }
    return { line: li, col };
  }
}
