// Library: the word slam. Each cue's anchor word (or its `word`) lands huge on the anchor: in big, a rim of
// rays, a kick of the frame; until the next one it breathes with the kick. The words before it stay behind as
// outlined ghosts, smaller and fading, so a run of cues reads as a stack of hits. A wind-up bar grows toward each
// anchor. From Force Push's chants; for choruses, hooks and the one word an explainer line turns on.
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import type { ResolvedCue } from '../engine/cues';
import { measure, plain } from '../engine/type';
import { clamp, ease, hash, lerp, prog } from '../engine/util';
import { LibScene, M, W, hit, mixHex, text, type Look } from './_lib';

export const schema: SceneSchema = {
  description: 'One word per cue lands huge on its anchor (the anchor word, or `word`), with a hit of the frame; earlier words linger as outlined ghosts. For hooks, chants and the key word of a line.',
  kinds: ['song', 'explainer'],
  lyrics: 'layer',
  entry: {
    fill: { type: 'string', enum: ['type', 'accent'], default: 'accent', description: 'colour of the landed word' },
    upper: { type: 'boolean', default: true, description: 'set the words in capitals' },
  },
  cue: {
    word: { type: 'string', default: '', description: 'the word to slam (default: the anchor word, punctuation dropped)' },
    fill: { type: 'string', enum: ['', 'type', 'accent'], default: '', description: "this word's colour, when it differs from the entry's fill" },
  },
  example: { entry: { fill: 'accent', upper: true }, cues: [{}, {}, { word: 'never' }, {}] },
};

interface P { fill: 'type' | 'accent'; upper: boolean }
interface C { word: string; fill: '' | 'type' | 'accent' }

const GHOSTS = 2;

export default class LibSlam extends LibScene<P, C> {
  static schema = schema;
  private words: string[] = [];

  override setup() {
    this.words = this.cues.map((c) => {
      const w = this.cp(c).word || plain(c.word?.w ?? c.line?.words.at(-1)?.w ?? '').replace(/[^\p{L}\p{N}'&-]/gu, '');
      return this.P.upper ? w.toUpperCase() : w;
    });
  }

  /** The cues whose word has landed by t, latest last. */
  private landed(t: number) { return this.cues.map((c, i) => ({ c, i })).filter(({ c }) => c.at <= t); }

  draw(c: CanvasRenderingContext2D, f: Frame, k: Look) {
    const fam = this.font('display'), t = f.t, maxW = W - 2 * M - 80;
    const sizeOf = (s: string) => Math.min(300, (300 * maxW) / Math.max(1, measure(s, fam, 300)));
    const done = this.landed(t), cur = done.at(-1);
    // the landed word's baseline: its cap height centred a little below the middle of the free area
    const zc = cur ? sizeOf(this.words[cur.i]!) : 200;
    const cy = (M + this.bottom) / 2 + 60 + zc * 0.36;

    // ghosts: the words before, outlined, stacked above it and drifting up as they are replaced
    let gy = cy - zc * 0.72 - 40;
    done.slice(0, -1).slice(-GHOSTS).reverse().forEach(({ i }, g) => {
      const s = this.words[i]!, z = Math.min(sizeOf(s), zc) * (0.42 - g * 0.1);
      const age = t - this.cues[i + 1]!.at; // since it was replaced
      gy -= 24 + 10 * ease.outCubic(clamp(age / 0.4));
      const y = gy;
      gy -= z * 0.72;
      c.save();
      c.globalAlpha = 0.55 * (1 - g / GHOSTS) * clamp(age / 0.15);
      c.font = `${z}px "${fam}"`; c.textAlign = 'center'; c.lineWidth = 2; c.strokeStyle = k.dim;
      c.strokeText(s, W / 2, y);
      c.restore();
    });

    // wind-up: a bar growing toward the next anchor (from its cue's start)
    const next = this.cues.find((x) => x.at > t);
    if (next && t >= next.start - 0.2) {
      const p = prog(t, next.start, next.at, ease.inQuad);
      const bw = 520 * p;
      c.fillStyle = k.a('accent', 0.85);
      c.fillRect(W / 2 - bw / 2, cy + 46, bw, 6);
    }
    if (!cur) return;

    // the landed word: in big (1.25 → 1 over 0.16 s), a white-hot first frame, then breathing with the kick
    const s = this.words[cur.i]!, z = sizeOf(s), lt = t - cur.c.at;
    const land = ease.outCubic(clamp(lt / 0.16));
    const scale = lerp(1.25, 1, land) * (1 + 0.025 * f.a.kick);
    const hot = hit(t, cur.c.at, 0.06);
    c.save();
    c.translate(W / 2, cy);
    c.scale(scale, scale);
    c.globalAlpha = clamp(lt / 0.05);
    text(c, s, 0, 0, fam, z, mixHex(k[this.cp(cur.c).fill || this.P.fill], k.type, hot * 0.7), { align: 'center' });
    c.restore();
    this.rays(c, cur.c, t, k, measure(s, fam, z) * scale, cy - z * 0.35);
  }

  /** A burst of short rays around the word for 0.35 s after it lands. */
  private rays(c: CanvasRenderingContext2D, cue: ResolvedCue, t: number, k: Look, w: number, cy: number) {
    const lt = t - cue.at;
    if (lt < 0 || lt > 0.35) return;
    const p = ease.outCubic(lt / 0.35);
    c.save();
    c.strokeStyle = k.a('accent', 1 - p);
    c.lineWidth = 4;
    c.lineCap = 'round';
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + hash(i, cue.at) * 0.3;
      const rx = w / 2 + 60, ry = 190;
      const r0 = lerp(1.0, 1.35, p), r1 = r0 + 0.12 + 0.1 * hash(i, 7);
      c.beginPath();
      c.moveTo(W / 2 + Math.cos(a) * rx * r0, cy + Math.sin(a) * ry * r0);
      c.lineTo(W / 2 + Math.cos(a) * rx * r1, cy + Math.sin(a) * ry * r1);
      c.stroke();
    }
    c.restore();
  }

  override post(f: Frame) {
    const cur = this.landed(f.t).at(-1);
    const h = cur ? hit(f.t, cur.c.at, 0.07) : 0;
    // (no post flash: added in linear light it lifts the whole ground to a grey veil for a frame)
    return { shake: [Math.sin(f.t * 91) * 9 * h, Math.cos(f.t * 77) * 6 * h] as [number, number], zoom: 1 + 0.012 * h };
  }
}

