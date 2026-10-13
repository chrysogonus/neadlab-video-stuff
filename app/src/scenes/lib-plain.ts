// Library: the plainest scene. The cue's palette as a ground, with a soft light in its accent colour low in the
// frame that swells with the music (the vocal and the kick) and breathes on the bar. For breathing room between
// busier scenes; the karaoke layer carries the words.
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import { LibScene, W, H, type Look } from './_lib';

export const schema: SceneSchema = {
  description: 'An empty ground in the palette with a soft light that swells with the music. Breathing room; the lyric or narration carries the moment.',
  kinds: ['song', 'explainer'],
  lyrics: 'layer',
  entry: {},
  cue: {},
  example: { entry: {}, cues: [{}] },
};

export default class LibPlain extends LibScene {
  static schema = schema;

  draw(c: CanvasRenderingContext2D, f: Frame, k: Look) {
    const a = 0.1 + 0.16 * f.a.vocal + 0.12 * f.a.kick + 0.05 * Math.cos(f.barPhase * Math.PI * 2);
    const g = c.createRadialGradient(W / 2, H * 0.78, 0, W / 2, H * 0.78, W * 0.62);
    g.addColorStop(0, k.a('accent', a));
    g.addColorStop(1, k.a('accent', 0));
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  }
}
