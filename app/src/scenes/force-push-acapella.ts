// FORCE PUSH — the push itself, quiet (cue build, L51–L52). Dark.
// The drum build after "here I go" is the upload: `Writing objects` fills 0 → 100 % with the build, then
// git's own line for a forced update. Then the a cappella, said plainly: one line at a time in a light
// weight, lit slowly with the voice; on the second line "you and" fade out, leaving "me." in place.
import { type Frame } from '../engine/scene';
import { clamp, ease, prog } from '../engine/util';
import { FPScene, FONT, M, W, HASH, MAIN, arrive, fitWords, lineShow, monoText, sing } from '../force-push/kit';
import type { KLayout } from './_kit';

const X = 360;

export default class Acapella extends FPScene {
  lay1!: KLayout; lay2!: KLayout;
  b0 = 0; b1 = 0; tYou = 0; tMe = 0;

  override setup() {
    this.lay1 = fitWords(this.line('L51').words, FONT.light, W - 2 * M - 200, 136, 90, 2);
    this.lay2 = fitWords(this.line('L52').words, FONT.light, W - 2 * M - 200, 136, 90, 2);
    this.b0 = this.cue('build').start;
    this.b1 = this.cue('build').end;
    this.tYou = this.word('L52', 'you').start;
    this.tMe = this.word('L52', 'me.').start;
  }

  draw(c: CanvasRenderingContext2D, f: Frame) {
    const t = f.t, th = this.th;
    // the upload: up to the first sung word, then dim and up out of the way
    const quiet = prog(t, this.b1 - 0.2, this.b1 + 0.6, ease.inOutCubic);
    c.save(); c.globalAlpha = 1 - 0.8 * quiet; c.translate(0, -quiet * 180);
    this.upload(c, t);
    c.restore();
    // the a cappella
    const seq = [this.line('L51'), this.line('L52')];
    const a1 = lineShow(t, seq, 0, this.ctx.end + 1, 0.4, 0.3, 0.3);
    if (a1 > 0) { c.save(); c.globalAlpha = a1; sing(c, this.lay1, t, W / 2, 540, th, { dim: 0.14, align: 'center' }); c.restore(); }
    const a2 = lineShow(t, seq, 1, this.ctx.end + 1, 0.4, 0.3, 0.3);
    if (a2 > 0) {
      c.save(); c.globalAlpha = a2;
      // "you and" fade once "me." is sung, "me." stays where it is (no reflow)
      const fade = prog(t, this.tMe + 0.15, this.tMe + 0.7, ease.inOutCubic);
      sing(c, this.lay2, t, W / 2, 540, th, {
        align: 'center',
        dim: 0.14,
        wordStyle: (w) => (w.w === 'you' || w.w === 'and') && fade > 0 ? { sung: th.a('type', 1 - fade), unsung: th.a('type', 0.14 * (1 - fade)) } : w.w === 'me.' ? { sung: th.green } : undefined,
      });
      c.restore();
    }
  }

  private upload(c: CanvasRenderingContext2D, t: number) {
    const th = this.th, b0 = this.b0, b1 = this.b1;
    const k = arrive(t, this.ctx.start, 0.2);
    if (k <= 0) return;
    // the build accelerates: progress eased in
    const p = ease.inQuad(prog(t, b0 + 0.1, b1 - 0.35));
    const n = Math.round(1095 * p);
    const y = 380;
    c.save(); c.globalAlpha = k;
    monoText(c, '~/us main $ git push --force origin main', X, y - 140, 32, th.mist, { fam: FONT.monoM });
    monoText(c, 'Enumerating objects: 1095, done.', X, y - 80, 30, th.dim, { fam: FONT.monoM });
    monoText(c, `Writing objects: ${String(Math.round(p * 100)).padStart(3, ' ')}% (${n}/1095)`, X, y - 30, 34, th.type, { fam: FONT.monoB });
    const bw = W - 2 * X;
    c.fillStyle = th.rule; c.fillRect(X, y, bw, 10);
    c.save(); c.shadowColor = th.green; c.shadowBlur = 14;
    c.fillStyle = th.green; c.fillRect(X, y, bw * p, 10);
    c.restore();
    if (p >= 1) {
      const kd = arrive(t, b1 - 0.35, 0.15);
      monoText(c, `To origin`, X, y + 64, 30, th.a('mist', kd), { fam: FONT.monoM });
      monoText(c, ` + ${MAIN[MAIN.length - 1]!.h}...${HASH.rewritten3} main -> main (forced update)`, X, y + 106, 30, th.a('green', kd), { fam: FONT.monoB });
    }
    c.restore();
  }

  override post(f: Frame) {
    // quiet: a touch more vignette, almost no grain
    return { vignette: 0.32, grain: 0.02, zoom: 1 + 0.004 * clamp((f.t - this.b1) / (this.ctx.end - this.b1)) };
  }
}
