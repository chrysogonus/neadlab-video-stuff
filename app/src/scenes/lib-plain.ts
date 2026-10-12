// Library: the plainest scene. The current cue's palette as a ground, with a soft light in its accent colour (if
// it has one) low in the frame that swells with the music (the vocal and the kick) and breathes on the bar. It
// draws no lyrics: the project-wide karaoke layer carries the words. A placeholder for the scene library (phase 3).
import type * as THREE from 'three';
import { Scene, type Frame } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { rgba } from '../engine/palette';
import type { ResolvedCue } from '../engine/cues';

export default class LibPlain extends Scene {
  L = new Layer2D();

  render(f: Frame, out: THREE.WebGLRenderTarget) {
    const cues = (this.ctx.params.cues ?? []) as ResolvedCue[];
    const cue = cues.filter((c) => c.start <= f.t).at(-1) ?? cues[0];
    const pals = this.ctx.style.palettes;
    const pal = (cue && pals[cue.def.palette]) || Object.values(pals)[0]!;
    const c = this.L.ctx;
    this.L.clear(pal.bg);
    if (pal.accent) {
      const k = 0.1 + 0.16 * f.a.vocal + 0.12 * f.a.kick + 0.05 * Math.cos(f.barPhase * Math.PI * 2);
      const g = c.createRadialGradient(W / 2, H * 0.78, 0, W / 2, H * 0.78, W * 0.62);
      g.addColorStop(0, rgba(pal.accent, k));
      g.addColorStop(1, rgba(pal.accent, 0));
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    }
    this.ctx.comp.draw(this.ctx.renderer, this.L.upload(), out, { mode: 'replace' });
    return { bloom: 0.2, halation: 0, ca: 0.4, grain: 0.03, vignette: 0.3 };
  }
}
