// Karaoke type: the primitives every lyric drawing uses (layout of a line's words in balanced rows, per-word
// wipes that never run ahead of the voice), and the project-wide karaoke layer drawn over every scene that does
// not draw its own lyrics (Scene.ownsLyrics), in the project's style (style.json "karaoke").
import { Lyrics, type Line, type Word } from './lyrics';
import { rgba } from './palette';
import { colorIn, fontFamily, type KaraokeStyle } from './style';
import { font, measure } from './type';
import { clamp, ease, lerp, prog, smoothstep } from './util';
import { W, H } from './gl';

/** Blend two rgba() strings (k = 0 → a, 1 → b). */
export function mixC(a: string, b: string, k: number) {
  const pa = a.match(/[\d.]+/g)!.map(Number), pb = b.match(/[\d.]+/g)!.map(Number);
  return `rgba(${[0, 1, 2].map((i) => Math.round(lerp(pa[i]!, pb[i]!, k))).join(',')},${lerp(pa[3] ?? 1, pb[3] ?? 1, k)})`;
}

export interface KItem { w: Word; x: number; width: number }
export interface KRow { items: KItem[]; width: number }
export interface KLayout { rows: KRow[]; fam: string; size: number; tracking: number; width: number }

/**
 * Lay a line's words out in rows no wider than maxW, balanced (the widest row as narrow as possible).
 * Words keep their kerning inside; the space between words is the font's own space.
 */
export function layoutWords(words: Word[], fam: string, size: number, maxW = Infinity, tracking = 0, maxRows = 3): KLayout {
  const ws = words.map((w) => measure(w.w, fam, size, tracking));
  const sp = measure(' ', fam, size) + tracking;
  const rowW = (a: number, b: number) => ws.slice(a, b).reduce((s, x) => s + x, 0) + sp * Math.max(0, b - a - 1);
  const n = words.length;
  let best: number[] = [0, n];
  if (rowW(0, n) > maxW) {
    // try 2 rows, then 3 rows: minimise the widest row
    let bestMax = Infinity;
    for (let i = 1; i < n; i++) {
      const m = Math.max(rowW(0, i), rowW(i, n));
      if (m < bestMax) { bestMax = m; best = [0, i, n]; }
    }
    if (bestMax > maxW && maxRows >= 3) {
      for (let i = 1; i < n; i++) for (let j = i + 1; j < n; j++) {
        const m = Math.max(rowW(0, i), rowW(i, j), rowW(j, n));
        if (m < bestMax) { bestMax = m; best = [0, i, j, n]; }
      }
    }
  }
  const rows: KRow[] = [];
  for (let r = 0; r + 1 < best.length; r++) {
    const items: KItem[] = [];
    let x = 0;
    for (let i = best[r]!; i < best[r + 1]!; i++) { items.push({ w: words[i]!, x, width: ws[i]! }); x += ws[i]! + sp; }
    rows.push({ items, width: x - sp });
  }
  return { rows, fam, size, tracking, width: Math.max(...rows.map((r) => r.width)) };
}

export interface KStyle {
  sung: string;
  unsung: string;
  /** Colour of the word being sung (wipe), settling to `sung` over ~0.4 s after its end. */
  active?: string;
  /** px the word rises from as it starts (settles over ~0.18 s); 0 = none. */
  lift?: number;
  align?: 'left' | 'center' | 'right';
  lineH?: number; // row pitch in em (default 1.02)
  /** Alpha of the unsung words: they appear up to `anticip` s before the line starts. */
  anticip?: number;
  /** Optional per-word override (colour/alpha) — e.g. one word in signal. */
  wordStyle?: (w: Word) => { sung?: string; unsung?: string } | void;
}

/**
 * Draw a laid-out line at (x, y = first row's baseline) with per-word karaoke wipes: every word
 * in `unsung`, then the sung part (Lyrics.wordProgress, so the wipe never runs ahead of the voice)
 * clipped and drawn in `sung`. Returns the pixel box for layout of neighbours.
 */
export function drawKaraoke(c: CanvasRenderingContext2D, lay: KLayout, t: number, x: number, y: number, st: KStyle) {
  const lh = lay.size * (st.lineH ?? 1.02);
  c.save();
  c.font = font(lay.fam, lay.size);
  c.textBaseline = 'alphabetic';
  c.textAlign = 'left';
  c.letterSpacing = `${lay.tracking}px`;
  lay.rows.forEach((row, ri) => {
    const ox = st.align === 'center' ? x - row.width / 2 : st.align === 'right' ? x - row.width : x;
    const by = y + ri * lh;
    for (const it of row.items) {
      const p = Lyrics.wordProgress(it.w, t);
      const ws = st.wordStyle?.(it.w) ?? {};
      const lift = st.lift ? st.lift * (1 - ease.outCubic(prog(t, it.w.start, it.w.start + 0.18))) * (p > 0 ? 1 : 0) : 0;
      const wx = ox + it.x;
      if (p < 1) { c.fillStyle = ws.unsung ?? st.unsung; c.fillText(it.w.w, wx, by); }
      if (p > 0) {
        c.save();
        if (p < 1) { c.beginPath(); c.rect(wx - lay.size, by - lay.size * 1.2, lay.size + it.width * p, lay.size * 1.6); c.clip(); }
        const settle = st.active ? 1 - prog(t, it.w.end, it.w.end + 0.4, ease.inOutQuad) : 0;
        c.fillStyle = settle > 0.01 ? mixC(ws.sung ?? st.sung, st.active!, settle) : ws.sung ?? st.sung;
        c.fillText(it.w.w, wx, by - lift);
        c.restore();
      }
    }
  });
  c.restore();
  return { w: lay.width, h: lh * lay.rows.length };
}

// ------------------------------------------------------------------ the layer

const LEAD = 0.45; // s a line shows before its first word
const HOLD = 1.2; // s it stays after its last word when the next line is not due
const FADE = 0.14;
const PROMOTE = 0.22; // s the previewed next line takes to move up into place (and the old one to leave)
const PREVIEW = 4; // s before its first word the next line shows under the current one
const SMALL = 0.6; // the preview's scale
const DIM = 0.8; // the preview's opacity (on top of the unsung words' own)

interface Slot {
  line: Line;
  lay: KLayout;
  /** On screen in the main place from `show` to `hide`. */
  show: number;
  hide: number;
  /** It was shown under the previous line before its turn (from `previewFrom`), and moves up into place. */
  previewed: boolean;
  previewFrom: number;
}

/** A line's words at the largest size from `max` down to `min` that fits `maxW` on one row, else on two. */
function fit(words: Word[], fam: string, maxW: number, max: number, min: number): KLayout {
  for (let s = max; s >= min; s -= 2) {
    const lay = layoutWords(words, fam, s, maxW, 0, 1);
    if (lay.width <= maxW) return lay;
  }
  return layoutWords(words, fam, max, maxW, 0, 2);
}

/**
 * The project-wide karaoke: the line being sung, centred in the lower third, each word wiped as it is sung;
 * the next line smaller and dim under it, moving up into place when its turn comes. A line comes in up to
 * LEAD s before its first word, but never while the line before is still being sung; after its last word it
 * stays until the next line comes in, or HOLD s at most. A scrim darkens the bottom of the frame while lyrics
 * are up. The engine draws it over every scene that does not draw its own lyrics (Engine.drawKaraoke).
 */
interface Colors { sung: string; unsung: string; active: string; scrim: (a: number) => string }

export class KaraokeLayer {
  private slots: Slot[];
  /** The karaoke colours in each palette. */
  private cols = new Map<string, Colors>();
  private col!: Colors;

  constructor(ly: Lyrics, private st: KaraokeStyle, palettes: Record<string, Record<string, string>>) {
    for (const [name, pal] of Object.entries(palettes)) {
      const c = (k: string) => colorIn(pal, k);
      this.cols.set(name, {
        sung: rgba(c(st.sung), 1), unsung: rgba(c(st.unsung), st.unsungAlpha), active: rgba(c(st.active), 1),
        scrim: (a) => rgba(c(st.scrimColor), a),
      });
    }
    const fam = fontFamily(st.font), maxW = W - 2 * 200;
    const hand = (a: Line, b: Line) => Math.max(b.start - LEAD, Math.min(a.end, b.start) - 0.02);
    this.slots = ly.lines.map((l, i) => {
      const prev = ly.lines[i - 1], next = ly.lines[i + 1];
      const show = prev ? hand(prev, l) : l.start - LEAD;
      const hide = next ? Math.min(hand(l, next), l.end + HOLD) : l.end + HOLD;
      return { line: l, lay: fit(l.words, fam, maxW, st.size, st.minSize), show, hide, previewed: false, previewFrom: 0 };
    });
    this.slots.forEach((s, i) => {
      const prev = this.slots[i - 1];
      s.previewed = st.next && !!prev && prev.hide >= s.show - 1e-3;
      s.previewFrom = prev ? Math.max(prev.show, s.line.start - PREVIEW) : s.show;
    });
  }

  /** First-row baseline that puts the layout's last row on the main baseline. */
  private top(lay: KLayout) { return this.st.y * H - (lay.rows.length - 1) * lay.size * 1.02; }
  /** First-row baseline of a line previewed under `under`. */
  private below(under: KLayout, lay: KLayout) { return this.st.y * H + under.size * 0.3 + lay.size * SMALL * 0.95; }

  private line(c: CanvasRenderingContext2D, s: Slot, t: number, scale: number, y: number, a: number) {
    if (a <= 0.003) return;
    c.save();
    c.globalAlpha *= a;
    c.translate(W / 2, y);
    c.scale(scale, scale);
    drawKaraoke(c, s.lay, t, 0, 0, { sung: this.col.sung, unsung: this.col.unsung, active: this.col.active, lift: 4, align: 'center' });
    c.restore();
  }

  /** `palette`: the palette of the cue on screen (the style's karaoke palette if none). */
  draw(c: CanvasRenderingContext2D, t: number, palette = this.st.palette) {
    this.col = this.cols.get(palette) ?? this.cols.get(this.st.palette)!;
    const S = this.slots;
    // the scrim: up while any line is, easing out over 0.6 s of silence (so it does not pump between lines)
    let gap = Infinity;
    for (const s of S) gap = Math.min(gap, t < s.show ? s.show - t : t > s.hide ? t - s.hide : 0);
    const sa = this.st.scrim * (1 - smoothstep(0, 0.6, gap));
    if (sa > 0.002) {
      const y0 = this.st.y * H - this.st.size * 2.6;
      const g = c.createLinearGradient(0, y0, 0, H);
      g.addColorStop(0, this.col.scrim(0));
      g.addColorStop(0.45, this.col.scrim(sa * 0.55));
      g.addColorStop(1, this.col.scrim(sa));
      c.fillStyle = g;
      c.fillRect(0, y0, W, H - y0);
    }
    for (let i = 0; i < S.length; i++) {
      const s = S[i]!, next = S[i + 1];
      const leaving = next?.previewed ? PROMOTE : 0;
      if (t < s.show || t >= s.hide + leaving) continue;
      const y = this.top(s.lay);
      if (t >= s.hide) {
        // scrolled away: up and out (gone in the first half) while the next line moves into place
        const k = ease.outCubic(prog(t, s.hide, s.hide + PROMOTE * 0.8));
        this.line(c, s, t, 1, y - s.lay.size * 0.9 * k, 1 - prog(t, s.hide, s.hide + PROMOTE * 0.55));
        continue;
      }
      const out = leaving ? 1 : clamp((s.hide - t) / FADE);
      if (s.previewed && t < s.show + PROMOTE) {
        const k = ease.inOutCubic(prog(t, s.show, s.show + PROMOTE));
        this.line(c, s, t, lerp(SMALL, 1, k), lerp(this.below(S[i - 1]!.lay, s.lay), y, k), lerp(DIM, 1, k) * out);
      } else {
        const k = ease.outCubic(prog(t, s.show, s.show + FADE * 2));
        this.line(c, s, t, 1, y + 10 * (1 - k), Math.min(clamp((t - s.show) / FADE), out));
      }
      // the next line, waiting underneath (once this one has settled in place)
      const from = Math.max(next?.previewFrom ?? 0, s.show + (s.previewed ? PROMOTE : FADE));
      if (next?.previewed && t >= from) this.line(c, next, t, SMALL, this.below(s.lay, next.lay), DIM * clamp((t - from) / 0.3));
    }
  }
}
