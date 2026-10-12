// FORCE PUSH — local copy vs origin (origin1 L19–L20, origin2 L41–L42, origin3 L55–L56; params.n = 1, 2, 3).
// A split: on the left the ex's laptop, whose local copy still has the old history (Git keeps it there:
// a force push only moves the remote's ref); on the right `origin`, clean, green. "Keep your local copy":
// the copy is labelled theirs; "I don't care": it dims and recedes. n = 2: the copy tries to push and is
// rejected (non-fast-forward); n = 3 (paper): it is tiny and far, rejected three times. "Origin's mine":
// origin takes the frame; collaborators: me ✓ — and "you" is struck on "not there", leaving an empty slot.
import { type Frame } from '../engine/scene';
import { ease, lerp, prog } from '../engine/util';
import { FPScene, FONT, M, W, MAIN, OTHER, theme, arrive, fitWords, hit, lineShow, monoText, node, panel, pill, sing, strike } from '../force-push/kit';
import type { KLayout } from './_kit';

const TOP = 150, PH = 600;
const LYR_Y = 878;

export default class Origin extends FPScene {
  n = 1;
  ids: string[] = [];
  lays: KLayout[] = [];
  tKeep = 0; tCopy = 0; tCare = 0; tOrigin = 0; tNot = 0; tThere = 0;

  override setup() {
    this.n = Number(this.ctx.params.n ?? 1);
    if (this.n === 3) { this.mode = 'paper'; this.th = theme('paper'); }
    const base = this.n === 1 ? 19 : this.n === 2 ? 41 : 55;
    this.ids = [`L${base}`, `L${base + 1}`];
    this.lays = this.ids.map((id) => fitWords(this.line(id).words, FONT.line, W - 2 * M, 104, 64, 1));
    const [a, b] = this.ids as [string, string];
    this.tKeep = this.word(a, 'Keep').start;
    this.tCopy = this.word(a, 'copy,').start;
    this.tCare = this.word(a, 'care').start;
    this.tOrigin = this.word(b, "Origin's").start;
    this.tNot = this.word(b, 'not').start;
    this.tThere = this.word(b, 'there').start;
  }

  draw(c: CanvasRenderingContext2D, f: Frame) {
    const t = f.t, th = this.th;
    const take = prog(t, this.tOrigin - 0.15, this.tOrigin + 0.45, ease.inOutCubic); // origin takes the frame
    const care = prog(t, this.tCare - 0.1, this.tCare + 0.5, ease.inOutCubic);
    // left: the ex's local copy
    const far = this.n === 3 ? 0.55 : 1;
    const lk = arrive(t, this.ctx.start, 0.15);
    const lw = 820 * far, lh = PH * far;
    const lx = lerp(M, M - 60, care) - take * (lw + 200) + (this.n === 3 ? 120 : 0), ly = TOP + (PH - lh) / 2 + (this.n === 3 ? 60 : 0);
    if (lx + lw > 0) {
      c.save();
      c.globalAlpha = lk * lerp(1, 0.45, care);
      this.local(c, t, lx, ly, lw, lh, far);
      c.restore();
    }
    // right: origin, growing to the full width
    const ok = arrive(t, this.ctx.start + 0.06, 0.15);
    const rx = lerp(M + 820 + 88, M, take), rw = lerp(W - M - (M + 820 + 88), W - 2 * M, take);
    c.save(); c.globalAlpha = ok;
    this.origin(c, t, rx + (1 - ok) * 40, TOP, rw, PH, take);
    c.restore();
    // the lyric
    const seq = this.ids.map((id) => this.line(id));
    this.ids.forEach((_, i) => {
      const a = lineShow(t, seq, i, this.ctx.end + 1);
      if (a <= 0) return;
      c.save(); c.globalAlpha = a;
      sing(c, this.lays[i]!, t, M, LYR_Y + (1 - a) * 12, th, { dim: 0.18, color: { "origin's": th.green, mine: th.green, there: th.coral } });
      c.restore();
    });
  }

  /** The ex's laptop: the old history, intact; rejected pushes from n = 2. */
  private local(c: CanvasRenderingContext2D, t: number, x: number, y: number, w: number, h: number, s: number) {
    const th = this.th;
    const b = panel(c, x, y, w, h, th, { title: 'your laptop', right: 'local copy' });
    c.save(); c.translate(b.x, b.y); c.scale(s, s);
    // a mini graph: the old main and the `other` lane, untouched
    const gx = (i: number) => 60 + i * 44, gy = 300;
    c.strokeStyle = th.a('type', 0.5); c.lineWidth = 3;
    c.beginPath(); c.moveTo(gx(0), gy); c.lineTo(gx(MAIN.length - 1), gy); c.stroke();
    for (let i = 0; i < MAIN.length; i++) node(c, gx(i), gy, 9, 'me', th.type);
    c.strokeStyle = th.coral; c.lineWidth = 3;
    c.beginPath(); c.moveTo(gx(6), gy); c.bezierCurveTo(gx(7), gy, gx(6.5), gy - 90, gx(8), gy - 90); c.lineTo(gx(8 + OTHER.length - 1), gy - 90); c.stroke();
    OTHER.forEach((_, j) => node(c, gx(8 + j), gy - 90, 9, 'you', th.coral, { ring: 3, fillIn: th.panel }));
    monoText(c, 'main (old)', gx(MAIN.length - 1), gy + 46, 24, th.mist, { fam: FONT.monoM, align: 'right' });
    monoText(c, 'everything you had, still here', 30, 70, 26, th.mist, { fam: FONT.monoM });
    // n >= 2: a push from here, rejected
    if (this.n >= 2) {
      const k = arrive(t, this.tCopy, 0.2);
      if (k > 0) {
        c.globalAlpha *= k;
        monoText(c, '$ git push origin main', 30, 410, 26, th.type, { fam: FONT.monoM });
        monoText(c, ' ! [rejected]  main -> main (non-fast-forward)', 30, 452, 26, th.coral, { fam: FONT.monoB });
        monoText(c, 'hint: Updates were rejected because the tip of your', 30, 494, 22, th.dim, { fam: FONT.mono });
        monoText(c, 'hint: current branch is behind its remote counterpart.', 30, 524, 22, th.dim, { fam: FONT.mono });
        if (this.n === 3) monoText(c, 'rejected × 3', w / s - 30, 70, 30, th.coral, { fam: FONT.monoB, align: 'right' });
      }
    }
    c.restore();
  }

  /** Origin: the clean line and its collaborators. `take` 0..1 as it grows to the frame. */
  private origin(c: CanvasRenderingContext2D, t: number, x: number, y: number, w: number, h: number, take: number) {
    const th = this.th;
    const b = panel(c, x, y, w, h, th, { title: 'origin', right: take > 0.5 ? 'remote' : '' });
    // the green line: grows with the panel, so origin fills the frame when it takes it
    const n = 8, gy = b.y + lerp(190, 200, take), x0 = b.x + 70;
    const step = (b.w - 300) / (n - 1), r = lerp(13, 18, take);
    c.strokeStyle = th.green; c.lineWidth = lerp(5, 7, take);
    c.beginPath(); c.moveTo(x0, gy); c.lineTo(x0 + step * (n - 1), gy); c.stroke();
    for (let i = 0; i < n; i++) {
      node(c, x0 + step * i, gy, r, 'me', th.type);
      c.strokeStyle = th.green; c.lineWidth = 3; c.beginPath(); c.arc(x0 + step * i, gy, r + 3, 0, Math.PI * 2); c.stroke();
    }
    const tipX = x0 + step * (n - 1);
    c.strokeStyle = th.green; c.lineWidth = 2; c.beginPath(); c.moveTo(tipX, gy - r - 6); c.lineTo(tipX, gy - 54); c.stroke();
    pill(c, 'origin/main', tipX, gy - 78, { size: lerp(26, 30, take), fill: th.green, color: th.onGreen, align: 'center', glow: th.green });
    // collaborators (left) and the branch's facts (right, once origin has the frame)
    const cy = b.y + 330, fs = lerp(34, 44, take), row = lerp(70, 84, take);
    monoText(c, 'COLLABORATORS', b.x + 70, cy, 24, th.dim, { fam: FONT.monoB, track: 3 });
    node(c, b.x + 86, cy + row - 10, 15, 'me', th.type);
    const mw = monoText(c, 'me', b.x + 122, cy + row, fs, th.type, { fam: FONT.monoB });
    monoText(c, '\u2713 owner', b.x + 150 + mw, cy + row, fs * 0.85, th.green, { fam: FONT.monoB });
    // you: struck on "not", gone on "there"
    const gone = prog(t, this.tThere, this.tThere + 0.4, ease.inOutCubic);
    const yy = cy + row * 2;
    c.save(); c.globalAlpha *= 1 - gone * 0.85;
    node(c, b.x + 86, yy - 10, 15, 'you', th.coral, { ring: 4 });
    const yw = monoText(c, 'you', b.x + 122, yy, fs, th.coral, { fam: FONT.monoB });
    c.restore();
    strike(c, b.x + 114, yy - fs * 0.32, b.x + 122 + yw + 10, prog(t, this.tNot, this.tNot + 0.25, ease.outCubic), th.coral, 6);
    if (gone > 0) {
      c.save(); c.globalAlpha *= gone;
      c.setLineDash([8, 8]); c.strokeStyle = th.dim; c.lineWidth = 2;
      c.strokeRect(b.x + 140 + yw, yy - fs * 0.85, fs * 6, fs * 1.2);
      c.setLineDash([]);
      monoText(c, 'not there', b.x + 160 + yw, yy, fs * 0.8, th.dim, { fam: FONT.monoM });
      c.restore();
    }
    if (take > 0) {
      const fx = b.x + b.w - 70;
      c.save(); c.globalAlpha *= take;
      monoText(c, 'BRANCH', fx, cy, 24, th.dim, { fam: FONT.monoB, track: 3, align: 'right' });
      monoText(c, 'main \u00b7 8 commits', fx, cy + row, fs * 0.85, th.type, { fam: FONT.monoB, align: 'right' });
      monoText(c, `authors: 1 \u00b7 force pushes: ${this.n}`, fx, cy + row * 2, fs * 0.7, th.mist, { fam: FONT.monoM, align: 'right' });
      c.restore();
    }
  }

  override post(f: Frame) {
    const k = Math.max(hit(f.t, this.tOrigin, 0.1), this.n >= 2 ? hit(f.t, this.tCopy, 0.1) * 0.6 : 0);
    return { zoom: 1 + 0.008 * k, shake: [k * 2, -k * 1.5] as [number, number] };
  }
}
