// Library: the pulse. An abstract radial instrument that breathes with the music, drawn in hairlines: rings
// emitted from the core on every kick (or beat, or bar) travel out across the frame, a ring of radial ticks
// swells with the drums and sparkles with the hats, a dial steps round one notch per bar under a fixed index, and
// four lamps count the beat; small mono notes give the bar and the tempo. Each cue winds an accent arc round the
// dial and lands on its anchor with a shock ring and the dial lit in the accent. For instrumental passages, intros
// and choruses that want energy rather than a diagram.
import type * as THREE from 'three';
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import { FSPass, clearRT, makeRT } from '../engine/gl';
import { LineBatch } from '../engine/lines';
import { clamp, ease, hash, hexToLinear, lerp, noise1, prog, TAU } from '../engine/util';
import { LibScene, M, W, hit, label, mixHex } from './_lib';

export const schema: SceneSchema = {
  description: 'An abstract radial instrument in hairlines that breathes with the music: rings emitted on the kicks (or beats, or bars), a tick ring driven by the drums and hats, a dial stepping round each bar, and an accent shock ring on each cue\'s anchor. For instrumentals, intros and choruses that want energy, not a diagram.',
  kinds: ['song', 'explainer'],
  lyrics: 'layer',
  entry: {
    shape: { type: 'string', enum: ['rings', 'polygon', 'arcs'], default: 'rings', description: 'the emitted and shock rings: circles, hexagons, or circles broken into arcs' },
    emit: { type: 'string', enum: ['kick', 'beat', 'bar'], default: 'kick', description: 'what emits a ring: each kick drum hit, each beat, or each bar (for sparse or drumless music)' },
    density: { type: 'number', default: 1, min: 0.5, max: 2, description: 'how fine and busy the instrument is: tick counts and ring echoes' },
  },
  cue: {},
  example: { entry: { shape: 'rings', emit: 'kick', density: 1 }, cues: [{}] },
};

interface P { shape: 'rings' | 'polygon' | 'arcs'; emit: 'kick' | 'beat' | 'bar'; density: number }
type RGB = [number, number, number];

const R0 = 64; // core
const R1 = 150; // reactive ticks start
const R2 = 292; // dial
const LIFE = 2.4; // s an emitted ring travels
const SHOCK = 1.2; // s a cue's shock ring travels
const NOTCH = TAU / 32; // the dial's step per bar

export default class LibPulse extends LibScene<P> {
  static schema = schema;
  // opaque colours pre-mixed with the ground and drawn with 'max' (the brighter line wins, no beads where
  // segments meet); on a light ground the lines are drawn the same way as darkness below the ground into `ink`,
  // which is then taken off the ground, so there the darker line wins
  private b = new LineBatch(24000, { blend: 'max' });
  private ink = makeRT();
  private paper = new FSPass(
    'uniform sampler2D src; uniform vec3 bg; void main() { fragColor = vec4(max(bg - texture(src, vUv).rgb, 0.0), 1.0); }',
    { src: { value: null }, bg: { value: [0, 0, 0] } },
  );
  private emits: [number, number][] = [];
  private cx = W / 2;
  private cy = 430;
  private bg: RGB = [0, 0, 0];
  private dark = true;
  private notes = '';

  override setup() {
    const au = this.ctx.audio, kicks = au.onsets.kick ?? [];
    const src = this.P.emit === 'kick' && kicks.length ? kicks
      : (this.P.emit === 'bar' ? au.downbeats : au.beats).map((t): [number, number] => [t, 1]);
    this.emits = src.filter(([t]) => t > this.ctx.start - LIFE && t <= this.ctx.end);
    this.cy = Math.round((M + this.bottom) / 2);
  }

  draw() {}

  /**
   * A linear colour: `hex` at `a` over the ground, times `boost` (HDR) on a dark ground; on a light one, how far
   * below the ground it is, with `a` lifted (linear mixing reads lighter there) to weigh as much as on dark.
   */
  private col(hex: string, a: number, boost = 1): RGB {
    const c = hexToLinear(hex), g = this.bg, k = this.dark ? clamp(a) : 1 - Math.pow(1 - clamp(a), 2.4);
    if (!this.dark) return [Math.max(0, k * (g[0] - c[0])), Math.max(0, k * (g[1] - c[1])), Math.max(0, k * (g[2] - c[2]))];
    return [lerp(g[0], c[0] * boost, k), lerp(g[1], c[1] * boost, k), lerp(g[2], c[2] * boost, k)];
  }
  private seg(ax: number, ay: number, bx: number, by: number, w: number, c: RGB) { this.b.seg2(ax, ay, bx, by, w, c); }
  private polar(r: number, a: number): [number, number] { return [this.cx + Math.cos(a) * r, this.cy + Math.sin(a) * r]; }
  private dot(x: number, y: number, d: number, c: RGB) { this.b.seg2(x, y, x, y, d, c); }

  private arc(r: number, a0: number, a1: number, w: number, c: RGB) {
    const n = Math.max(2, Math.ceil((Math.abs(a1 - a0) * r) / 9));
    let [px, py] = this.polar(r, a0);
    for (let i = 1; i <= n; i++) {
      const [x, y] = this.polar(r, lerp(a0, a1, i / n));
      this.seg(px, py, x, y, w, c);
      px = x; py = y;
    }
  }

  /** An emitted or shock ring in the entry's shape, turned by `rot`. */
  private ring(r: number, w: number, c: RGB, rot: number) {
    if (this.P.shape === 'polygon') {
      for (let i = 0; i < 6; i++) {
        const [ax, ay] = this.polar(r, rot + (i * TAU) / 6), [bx, by] = this.polar(r, rot + ((i + 1) * TAU) / 6);
        this.seg(ax, ay, bx, by, w, c);
      }
    } else if (this.P.shape === 'arcs') {
      for (let i = 0; i < 8; i++) { const a = rot + (i * TAU) / 8; this.arc(r, a, a + (TAU / 8) * 0.64, w, c); }
    } else this.arc(r, 0, TAU, w, c);
  }

  override render(f: Frame, out: THREE.WebGLRenderTarget) {
    const k = this.lookAt(f.t), t = f.t, a = f.a, d = this.P.density;
    this.bg = hexToLinear(k.bg);
    this.dark = this.bg[0] * 0.2126 + this.bg[1] * 0.7152 + this.bg[2] * 0.0722 < 0.3;
    this.b.clear();
    const { cx, cy } = this;

    // the cue: the latest landed anchor's impact, and the next one's wind-up
    const landed = this.cues.filter((c) => c.at <= t).at(-1);
    const h = landed ? hit(t, landed.at, 0.28) : 0;
    const hot = mixHex(k.type, k.accent, clamp(h * 1.6)); // type, turning accent on the anchor
    const next = this.cues.find((c) => c.at > t && c.start < c.at && c.start <= t);

    // the horizon: an axis through the core, broken around the dial, with end ticks
    const ax = this.col(k.type, 0.16);
    this.seg(M, cy, cx - R2 - 64, cy, 1, ax);
    this.seg(cx + R2 + 64, cy, W - M, cy, 1, ax);
    for (const x of [M, W - M]) this.seg(x, cy - 8, x, cy + 8, 1, ax);

    // rings emitted on the kicks (beats, bars): decelerating outward, fading; echoes at higher density
    const rotAt = (bar: number) => { const i = Math.floor(bar); return (i + ease.outCubic(clamp((bar - i) / 0.18))) * NOTCH; };
    for (const [te, s] of this.emits) {
      const age = t - te;
      if (age < 0 || age > LIFE) continue;
      const u = age / LIFE, r = lerp(R0, 1180, 1 - Math.pow(1 - u, 2.2));
      const rot = rotAt(this.ctx.audio.barAt(te));
      const fade = Math.pow(1 - u, 1.7) * clamp(age / 0.04) * s;
      this.ring(r, lerp(1.8, 1, u), this.col(k.type, 0.62 * fade), rot);
      if (d > 1.2) this.ring(r * 0.94, 1, this.col(k.type, 0.22 * fade), rot);
    }

    // the core: reference circle, the beat lamps on it, and a disc that thumps with the kick
    this.ring0(R0, this.col(k.dim, 0.55));
    const beat = Math.floor(clamp(f.barPhase * 4, 0, 3.999));
    for (let i = 0; i < 4; i++) {
      const [x, y] = this.polar(R0, -Math.PI / 2 + (i * TAU) / 4);
      this.dot(x, y, i === beat ? 9 : 5, i === beat ? this.col(k.accent, 1, 1.4) : this.col(k.dim, 0.9));
    }
    this.dot(cx, cy, 12 + 9 * a.kick + 18 * h, this.col(hot, 1, 1 + 3 * h));

    // reactive ticks: lengths follow the drums along a slow profile (mirrored left/right), hats spark a few
    const NR = 16 * Math.round(6 * d), r1 = R1 + 7 * a.kick, sixteenth = Math.floor(f.beat * 4);
    this.ring0(R1 - 16, this.col(k.dim, 0.3));
    for (let i = 0; i < NR; i++) {
      const m = Math.min(i, NR - i), u = (2 * m) / NR; // 0 at the top, 1 at the bottom, mirrored
      const prof = 0.5 + 0.5 * noise1(u * 5.5 + f.beat * 0.3, 11);
      const spark = hash(m, sixteenth) < 0.16 ? a.hat : 0;
      const len = 4 + 78 * a.drums * Math.pow(prof, 1.6) + 30 * spark;
      const ang = -Math.PI / 2 + (i / NR) * TAU;
      const [x0, y0] = this.polar(r1, ang), [x1, y1] = this.polar(r1 + len, ang);
      this.seg(x0, y0, x1, y1, 1.25, spark > 0.3 ? this.col(k.type, 0.95, 1.6) : this.col(k.type, 0.3 + 0.55 * prof * a.drums));
    }

    // the dial: a ring and ticks turning one notch per bar, under a fixed index at the top
    const rot = rotAt(f.bar), N = 16 * Math.round(8 * d);
    this.ring0(R2, this.col(hot, 0.6 + 0.3 * h, 1 + 2 * h), 1.25 + 1.75 * a.snare);
    for (let i = 0; i < N; i++) {
      const card = i % (N / 4) === 0, major = i % (N / 16) === 0;
      const len = card ? 26 : major ? 15 : 6, ang = -Math.PI / 2 + rot + (i / N) * TAU;
      const [x0, y0] = this.polar(R2 - len, ang), [x1, y1] = this.polar(R2, ang);
      const c = major ? this.col(hot, 0.85, 1 + 2 * h) : this.col(k.dim, 0.7);
      this.seg(x0, y0, x1, y1, card ? 2.5 : major ? 1.5 : 1, c);
    }
    this.ring0(R2 + 18, this.col(k.dim, 0.28), 1);
    const [ix, iy] = this.polar(R2 + 30, -Math.PI / 2), [jx, jy] = this.polar(R2 + 48, -Math.PI / 2);
    this.seg(ix, iy, jx, jy, 3, this.col(k.type, 0.9));

    const ht = landed ? hit(t, landed.at, 0.12) : 0;
    if (ht > 0.03) this.ring0(R2 + 18, this.col(k.accent, ht, 1.3 + 2 * ht), 2.5);
    // wind-up: an accent arc round the outer track from the cue's start to its anchor
    if (next) {
      const p = prog(t, next.start, next.at);
      const a1 = -Math.PI / 2 + p * TAU;
      this.arc(R2 + 18, -Math.PI / 2, a1, 2.5, this.col(k.accent, 0.95, 1.3));
      const [hx, hy] = this.polar(R2 + 18, a1);
      this.dot(hx, hy, 8, this.col(k.accent, 1, 2));
    }

    // the anchor's shock: a fast accent ring and its echo, in the entry's shape
    for (const c of this.cues) {
      for (const [dl, wd, al] of [[0, 5, 1], [0.09, 1.5, 0.5]] as const) {
        const age = t - c.at - dl;
        if (age < 0 || age > SHOCK) continue;
        const u = age / SHOCK, r = R2 + 18 + 1100 * ease.outCubic(u);
        this.ring(r, lerp(wd, 0.8, u), this.col(k.accent, al * Math.pow(1 - u, 1.3), 1.3 + 2 * Math.pow(1 - u, 4)), rotAt(this.ctx.audio.barAt(c.at)));
      }
    }

    const r = this.ctx.renderer;
    if (this.dark) {
      clearRT(r, out, this.bg);
      this.b.render(r, out);
    } else {
      clearRT(r, this.ink, [0, 0, 0]);
      this.b.render(r, this.ink);
      this.paper.u.src!.value = this.ink.texture;
      this.paper.u.bg!.value = this.bg;
      this.paper.render(r, out);
    }
    // annotations at the ends of the horizon: the bar count and the tempo (the layer is redrawn and uploaded only
    // when they change)
    const bar = Math.max(1, Math.floor(f.bar - this.ctx.audio.barAt(this.ctx.start)) + 1);
    const notes = `Bar ${String(bar).padStart(3, '0')}|${Math.round(this.ctx.audio.bpm)} bpm|${k.dim}`;
    if (notes !== this.notes) {
      const [l, rt] = notes.split('|') as [string, string], c = this.L.ctx, mono = this.font('mono');
      this.L.clear();
      label(c, l, M, cy - 16, mono, k.a('dim', 0.9), 14);
      label(c, rt, W - M, cy - 16, mono, k.a('dim', 0.9), 14, 'right');
      this.L.upload();
      this.notes = notes;
    }
    this.ctx.comp.draw(r, this.L.texture, out);

    const hh = landed ? hit(t, landed.at, 0.08) : 0;
    return {
      bloom: this.dark ? 0.6 : 0.12, bloomThreshold: this.dark ? 0.8 : 0.97, bloomRadius: 0.5, halation: 0, ca: this.dark ? 0.35 : 0.15, grain: 0.032,
      vignette: this.dark ? 0.32 : 0.18, hud: 0, zoom: 1 + 0.005 * a.kick + 0.014 * hh,
    };
  }

  /** A full circle round the core. */
  private ring0(r: number, c: RGB, w = 1) { this.arc(r, 0, TAU, w, c); }
}
