// FORCE PUSH — the gang chant (post-choruses: chant1 L21–L24 dark, chant2 L43–L46 paper, chant3 L57–L60 on a
// green field; params.n = 1, 2, 3). Full-frame stomp type, one bar per line: FORCE! slams in on beat 1 (top
// left), PUSH! on beat 2 (right), a "(hey!)" stamp on the and of 2, then the phrase across the bottom, sung.
// "Wipe it clean": a squeegee sweeps the frame clean. "Like you've never been": the ex's ring dissolves.
// "Hear the crowd": a field of +1s fills in and the count rolls (128, 4,096, 1,000,000 — each chant bigger).
// "You're not in my history now": `git log --author=you` → (no commits), "now" stamped.
import { type Frame } from '../engine/scene';
import type { Word } from '../engine/lyrics';
import { clamp, ease, hash, lerp, prog } from '../engine/util';
import { FPScene, FONT, M, W, H, theme, arrive, fitWords, hit, lineShow, monoText, panel, sing, text } from '../force-push/kit';
import { measure } from '../engine/type';
import { stamp, type KLayout } from './_kit';

const SLAM = 250;
const FORCE_Y = 330, PUSH_Y = 590, PHRASE_Y = 880;
const CROWD = [128, 4096, 1000000];

interface Bar { id: string; force: Word; push: Word; hey: Word; phrase: Word[]; lay: KLayout }

export default class Chant extends FPScene {
  n = 1;
  ids: string[] = [];
  bars: Bar[] = [];
  lastLay!: KLayout;
  forceW = 0; pushW = 0;
  tWipe = 0; tLike = 0; tNever = 0; tBeen = 0; tHear = 0; tCrowd = 0; tNow = 0; tLast = 0;

  override setup() {
    this.n = Number(this.ctx.params.n ?? 1);
    if (this.n === 2) { this.mode = 'paper'; this.th = theme('paper'); }
    if (this.n === 3) { this.mode = 'green'; this.th = theme('green'); }
    const base = this.n === 1 ? 21 : this.n === 2 ? 43 : 57;
    this.ids = [0, 1, 2, 3].map((k) => `L${base + k}`);
    this.bars = this.ids.slice(0, 3).map((id) => {
      const ws = this.line(id).words;
      const phrase = ws.slice(3);
      return { id, force: ws[0]!, push: ws[1]!, hey: ws[2]!, phrase, lay: fitWords(phrase, FONT.lineWide, 1300, 140, 90, 1) };
    });
    this.lastLay = fitWords(this.line(this.ids[3]!).words, FONT.line, W - 2 * M, 130, 80, 1);
    this.forceW = measure('FORCE!', FONT.slam, SLAM, -6);
    this.pushW = measure('PUSH!', FONT.slam, SLAM, -6);
    this.tWipe = this.word(this.ids[0]!, 'Wipe').start;
    this.tLike = this.word(this.ids[1]!, 'Like').start;
    this.tNever = this.word(this.ids[1]!, 'never').start;
    this.tBeen = this.word(this.ids[1]!, 'been').end;
    this.tHear = this.word(this.ids[2]!, 'Hear').start;
    this.tCrowd = this.word(this.ids[2]!, 'crowd').start;
    this.tNow = this.word(this.ids[3]!, 'now').start;
    this.tLast = this.line(this.ids[3]!).start;
  }

  draw(c: CanvasRenderingContext2D, f: Frame) {
    const t = f.t;
    const seq = this.ids.map((id) => this.line(id));
    this.crowd(c, t);
    this.bars.forEach((b, i) => {
      const a = lineShow(t, seq, i, this.ctx.end + 1, 0.3, 0.04, 0.06);
      if (a <= 0) return;
      c.save(); c.globalAlpha = a;
      this.stomp(c, t, b, i);
      c.restore();
    });
    // the last line: the empty log
    const a = lineShow(t, seq, 3, this.ctx.end + 1);
    if (a > 0) {
      c.save(); c.globalAlpha = a;
      this.emptyLog(c, t);
      c.restore();
    }
  }

  private stomp(c: CanvasRenderingContext2D, t: number, b: Bar, i: number) {
    const th = this.th;
    // the squeegee: everything left of it is wiped (bar 0, on "Wipe")
    const wipe = i === 0 ? prog(t, this.tWipe - 0.02, this.tWipe + 0.42, ease.inOutCubic) : 0;
    const wx = lerp(-80, W + 80, wipe);
    c.save();
    if (wipe > 0) { c.beginPath(); c.rect(wx, 0, W, H); c.clip(); }
    const kf = arrive(t, b.force.start - 0.02, 0.1), kp = arrive(t, b.push.start - 0.02, 0.1);
    if (kf > 0) this.slamWord(c, 'FORCE!', M, FORCE_Y, kf, th.type);
    if (kp > 0) this.slamWord(c, 'PUSH!', W - M - this.pushW, PUSH_Y, kp, this.n === 3 ? th.type : th.green);
    const kh = prog(t, b.hey.start - 0.02, b.hey.start + 0.5);
    if (kh > 0) stamp(c, '(hey!)', M + this.forceW + 150, FORCE_Y - 70, 62, -0.12, th.coral, kh, 31 + i, { ink: 0.9, fam: FONT.monoB });
    c.restore();
    if (wipe > 0 && wipe < 1) {
      c.fillStyle = th.type; c.fillRect(wx - 14, 0, 28, H);
      c.fillStyle = th.a('type', 0.25); c.fillRect(wx - 60, 0, 46, H);
    }
    // the phrase
    sing(c, b.lay, t, M, PHRASE_Y, th, { dim: 0.2, color: { clean: th.green, crowd: th.green, never: th.coral } });
    // "Like you've never been": the ring, dissolving
    if (i === 1) {
      const k = arrive(t, this.tLike - 0.1, 0.2);
      const gone = prog(t, this.tNever, this.tBeen, ease.inQuad);
      if (k > 0 && gone < 1) {
        const R = 120, cx = W - M - R - 30, cy = PHRASE_Y - 60;
        c.save(); c.globalAlpha *= k * (1 - gone);
        c.strokeStyle = th.coral; c.lineWidth = 22;
        const seg = (Math.PI * 2 * R) / 24;
        c.setLineDash([seg * (1 - gone), seg * gone + 0.001]);
        c.beginPath(); c.arc(cx, cy, R * (1 + 0.15 * gone), 0, Math.PI * 2); c.stroke();
        c.restore();
        monoText(c, gone > 0.5 ? 'never been' : 'you', cx, cy + 12, 34, th.a('coral', k * (gone > 0.5 ? 1 - gone : 1)), { fam: FONT.monoB, align: 'center' });
      }
    }
    // "Hear the crowd": the count next to the phrase
    if (i === 2) {
      const k = prog(t, this.tHear - 0.1, this.tCrowd + 0.3, ease.outCubic);
      if (k > 0) {
        const v = Math.round(CROWD[this.n - 1]! * k);
        text(c, v.toLocaleString('en-US'), W - M, PHRASE_Y, FONT.hero, 120, th.type, { align: 'right' });
        monoText(c, '+1', W - M, PHRASE_Y - 128, 30, th.mist, { fam: FONT.monoB, align: 'right' });
      }
    }
  }

  private slamWord(c: CanvasRenderingContext2D, s: string, x: number, y: number, k: number, col: string) {
    const w = measure(s, FONT.slam, SLAM, -6);
    const sc = 1 + 0.28 * (1 - k);
    c.save(); c.translate(x + w / 2, y - SLAM * 0.36); c.scale(sc, sc);
    text(c, s, -w / 2, SLAM * 0.36, FONT.slam, SLAM, col, { track: -6 });
    c.restore();
  }

  /** The crowd: a field of +1s behind the bar, filling in through "Hear the crowd", gone at the last line. */
  private crowd(c: CanvasRenderingContext2D, t: number) {
    const th = this.th;
    const fill = prog(t, this.tHear - 0.2, this.tCrowd + 0.4);
    const out = clamp((this.tLast - 0.1 - t) / 0.15);
    if (fill <= 0 || out <= 0) return;
    const cols = 24, rows = 13, sx = (W - 2 * M) / cols, sy = (H - 2 * M) / rows;
    c.save(); c.globalAlpha = out;
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
      const h = hash(q, r, this.n);
      if (h > fill) continue;
      const k = clamp((fill - h) * 12);
      monoText(c, '+1', M + q * sx + sx / 2, M + r * sy + sy * 0.7, 26, th.a('dim', 0.55 * k), { fam: FONT.monoB, align: 'center' });
    }
    c.restore();
  }

  private emptyLog(c: CanvasRenderingContext2D, t: number) {
    const th = this.th;
    sing(c, this.lastLay, t, (W - this.lastLay.width) / 2, 330, th, { dim: 0.2, color: { now: th.coral } });
    const b = panel(c, 560, 470, 800, 250, th, { title: 'git log --author=you' });
    const k = arrive(t, this.tLast + 0.25, 0.2);
    monoText(c, '(no commits)', b.x + b.w / 2, b.y + 120, 44, th.a('mist', k), { fam: FONT.monoB, align: 'center' });
    const ks = prog(t, this.tNow - 0.02, this.tNow + 0.6);
    if (ks > 0) stamp(c, 'NOW', 1540, 820, 90, -0.08, th.coral, ks, 57, { ink: 0.88, fam: FONT.monoB });
  }

  override post(f: Frame) {
    const t = f.t;
    let k = 0;
    for (const b of this.bars) k = Math.max(k, hit(t, b.force.start, 0.09), hit(t, b.push.start, 0.09) * 0.8);
    k = Math.max(k, hit(t, this.tNow, 0.1) * 0.7);
    const big = this.n === 3 ? 1.5 : 1;
    return { zoom: 1 + 0.018 * k * big, shake: [k * 5 * big, -k * 3 * big] as [number, number] };
  }
}
