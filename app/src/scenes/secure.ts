// SECURE — FIG. 0, bookend (L30, spoken). "Connection secure." set small in Cormorant italic.
// Everything else leaves; the crop-mark frame closes back in and the padlock returns, closed, in
// its index ring — whose ticks go out one by one — so the last frame is the first frame and the
// video loops.
import { type Frame } from '../engine/scene';
import { F } from '../engine/type';
import type { Line } from '../engine/lyrics';
import { clamp, ease, lerp, prog } from '../engine/util';
import { BOOKEND, C, Plate, W, bookendLock, bookendRing, drawKaraoke, fmtBytes, layoutWords, mono, type KLayout } from './_kit';

export default class Secure extends Plate {
  L30!: Line;
  k30!: KLayout;
  tIn = 0; // the padlock's return
  tFrame = 0; // the frame closing in

  override setup() {
    this.L30 = this.line('Connection secure');
    this.k30 = layoutWords(this.L30.words, F.serif(400, true), 76);
    this.tIn = this.L30.end + 0.6;
    this.tFrame = this.ctx.audio.timeOfBeat(Math.ceil(this.ctx.audio.beatAt(this.tIn + 1.2)));
  }

  draw(c: CanvasRenderingContext2D, f: Frame) {
    const t = f.t, end = this.ctx.end;
    // the spoken line, then it rises away as the padlock returns
    const la = clamp(Math.min((t - (this.L30.start - 0.4)) / 0.4, 1 - prog(t, this.tIn + 0.4, this.tIn + 1.6)));
    if (la > 0) {
      c.save();
      c.globalAlpha = la;
      const lift = prog(t, this.tIn, this.tIn + 1.6, ease.inOutCubic) * 60;
      drawKaraoke(c, this.k30, t, W / 2, 560 - lift, { sung: C.bone, unsung: C.bone_(0.2), active: C.glacier, align: 'center' });
      c.restore();
    }
    // a last deadpan reading, gone again before the end so the last frame matches the first
    const ra = Math.min(prog(t, this.L30.end, this.L30.end + 0.5), 1 - prog(t, this.tFrame + 2, this.tFrame + 3));
    if (ra > 0) {
      c.save(); c.globalAlpha = ra;
      mono(c, `ARCHIVE ${fmtBytes(this.ctr.bytes(t))} · ${this.ctr.year(t)} · NEXT SESSION PENDING`, W / 2, 980, 12, C.bone_(0.45), { align: 'center', track: 3 });
      c.restore();
    }
    // the bookend: ring and padlock back in; the ring's ticks go out one per beat until none are lit
    const k = prog(t, this.tIn, this.tIn + 1.4, ease.inOutCubic);
    if (k > 0) {
      c.save();
      c.globalAlpha = k;
      const beatsLeft = this.ctx.audio.beatAt(end) - this.ctx.audio.beatAt(t);
      const lit = Math.max(0, Math.min(64, Math.floor(beatsLeft * 3)));
      bookendRing(c, lit, (end - t) * 0.02);
      bookendLock(c, BOOKEND.x, lerp(BOOKEND.y + 30, BOOKEND.y, k), BOOKEND.s * lerp(0.92, 1, k));
      c.restore();
    }
  }

  override post(f: Frame) {
    return { frame: prog(f.t, this.tFrame, this.tFrame + 0.6, ease.outCubic), bloom: 0.35, vignette: 0.45 };
  }
  override ground(_f: Frame, out: import('three').WebGLRenderTarget) {
    // the same ground as the first frame
    this.bg.render(this.ctx.renderer, out, { grid: 0.5, gridStep: 48, seed: 1.3 });
  }
}
