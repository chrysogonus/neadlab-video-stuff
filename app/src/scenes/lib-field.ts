// Library: the field. Thousands of hairline streaks drifting through a curl-noise flow, like a generative
// print come alive: their speed and length follow the loudness and the drums, more of them surface while the
// voice sings, and depth reads as finer, fainter, slower lines. A share of them is in the accent: on each cue's
// anchor a wave travels out through the field and lights them. Atmosphere for instrumentals, choruses and
// any line that needs texture rather than a diagram.
//
// Stateless: a streak's head is traced from a seeded birth point through the current field over its travel since
// birth (the cumulative distance D(t), tabulated from the audio in setup), and its tail traced back from there.
import type * as THREE from 'three';
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import { clearRT } from '../engine/gl';
import { LineBatch } from '../engine/lines';
import { clamp, ease, hash, hexToLinear, noise3, smoothstep } from '../engine/util';
import { LibScene, M, W, H, hit } from './_lib';

export const schema: SceneSchema = {
  description: 'Thousands of hairline streaks drifting through a flow field, moving with the loudness and drums and thickening with the voice; on each cue\'s anchor an accent wave travels through them. Atmosphere and texture for instrumentals, choruses and reflective lines.',
  kinds: ['song', 'explainer'],
  lyrics: 'layer',
  entry: {
    flow: { type: 'string', enum: ['calm', 'storm'], default: 'calm', description: 'calm: a slow, mostly laminar drift; storm: fast, long streaks in turbulent eddies' },
    scale: { type: 'number', default: 1, min: 0.5, max: 2, description: 'size of the eddies (larger is broader, smoother flow)' },
  },
  cue: {},
  example: { entry: { flow: 'calm', scale: 1 }, cues: [{}] },
};

interface P { flow: 'calm' | 'storm'; scale: number }

const FLOWS = {
  // wind, curl (in units of the wind), field evolution /s, speed px/s, life (px of travel), tail step px, ink
  calm: { wx: 1, wy: -0.08, curl: 0.5, evolve: 0.05, speed: 55, life: 300, step: 7, ink: 1 },
  storm: { wx: 0.45, wy: 0.1, curl: 1.7, evolve: 0.16, speed: 150, life: 460, step: 12, ink: 0.7 },
};
const N = 6000; // streaks
const S = 14; // segments per streak
const K = 6; // steps tracing a head from its birth point
const PAD = 140; // birth margin outside the frame
const GX = 64, GY = 36, CELL = W / GX; // the field's grid
const RATE = 60; // Hz of the travel / voice tables
const WAVE = 2.4; // s an anchor's wave travels
const VMAX = 1.8; // speed cap (units of the wind), against kinks and runaway steps

export default class LibField extends LibScene<P> {
  static schema = schema;
  private onDark = new LineBatch(N * S, { blend: 'add' });
  private onLight = new LineBatch(N * S, { blend: 'normal' });
  private vx = new Float32Array((GX + 1) * (GY + 1));
  private vy = new Float32Array((GX + 1) * (GY + 1));
  private psi = new Float32Array((GX + 1) * (GY + 1));
  private t0 = 0;
  private dist = new Float32Array(0); // cumulative travel (px) at t0 + i / RATE
  private voice = new Float32Array(0); // smoothed vocal envelope
  private sx = 0; private sy = 0; // last sample of the field
  private cy = 430;

  private get fl() { return FLOWS[this.P.flow]; }

  override setup() {
    const au = this.ctx.audio, fl = this.fl;
    this.t0 = this.ctx.start - 1;
    const n = Math.ceil((this.ctx.end + 1 - this.t0) * RATE) + 2;
    this.dist = new Float32Array(n);
    this.voice = new Float32Array(n);
    let d = 0, v = au.env('vocal', this.t0);
    for (let i = 0; i < n; i++) {
      const t = this.t0 + i / RATE;
      const sp = fl.speed * (0.3 + 0.9 * au.env('rms', t) + 0.5 * au.env('drums', t) + 0.6 * au.hit('kick', t, 0.12));
      if (i) d += sp / RATE;
      this.dist[i] = d;
      v += (au.env('vocal', t) - v) * (1 - Math.exp(-1 / (RATE * 0.45)));
      this.voice[i] = v;
    }
    this.cy = Math.round((M + this.bottom) / 2);
  }

  draw() {}

  private table(a: Float32Array, t: number) {
    const x = clamp((t - this.t0) * RATE, 0, a.length - 1.001), i = Math.floor(x);
    return a[i]! + (a[i + 1]! - a[i]!) * (x - i);
  }

  /** The field at t on the grid: wind plus the curl of two octaves of noise (in units of the noise). */
  private field(t: number) {
    const fl = this.fl, f = 1 / (430 * this.P.scale), z = t * fl.evolve, nx = GX + 1;
    for (let j = 0; j <= GY; j++) for (let i = 0; i <= GX; i++) {
      const x = i * CELL * f, y = j * CELL * f;
      this.psi[j * nx + i] = noise3(x, y, z, 3) + 0.45 * noise3(x * 2.1 + y * 0.6 + 5.2, y * 2.1 - x * 0.6 + 1.7, z * 1.4 + 9, 4);
    }
    const g = 1 / (2 * CELL * f);
    for (let j = 0; j <= GY; j++) for (let i = 0; i <= GX; i++) {
      const p = this.psi, k = j * nx + i;
      const dx = (p[j * nx + Math.min(GX, i + 1)]! - p[j * nx + Math.max(0, i - 1)]!) * g;
      const dy = (p[Math.min(GY, j + 1) * nx + i]! - p[Math.max(0, j - 1) * nx + i]!) * g;
      this.vx[k] = fl.wx + fl.curl * dy;
      this.vy[k] = fl.wy - fl.curl * dx;
    }
  }

  /** Bilinear sample of the field at (x, y) px into (sx, sy), its speed capped at VMAX. */
  private at(x: number, y: number) {
    const gx = clamp(x / CELL, 0, GX - 1e-3), gy = clamp(y / CELL, 0, GY - 1e-3);
    const i = Math.floor(gx), j = Math.floor(gy), u = gx - i, v = gy - j, nx = GX + 1, k = j * nx + i;
    const a = this.vx, b = this.vy;
    const sx = (a[k]! * (1 - u) + a[k + 1]! * u) * (1 - v) + (a[k + nx]! * (1 - u) + a[k + nx + 1]! * u) * v;
    const sy = (b[k]! * (1 - u) + b[k + 1]! * u) * (1 - v) + (b[k + nx]! * (1 - u) + b[k + nx + 1]! * u) * v;
    const m = Math.min(1, VMAX / Math.hypot(sx, sy));
    this.sx = sx * m; this.sy = sy * m;
  }

  override render(f: Frame, out: THREE.WebGLRenderTarget) {
    const t = f.t, a = f.a, fl = this.fl, k = this.lookAt(t);
    const bg = hexToLinear(k.bg), ty = hexToLinear(k.type), ac = hexToLinear(k.accent);
    const dark = bg[0] * 0.2126 + bg[1] * 0.7152 + bg[2] * 0.0722 < 0.3;
    const b = dark ? this.onDark : this.onLight;
    b.clear();
    this.field(t);

    const D = this.table(this.dist, t);
    const dens = 0.42 + 0.58 * clamp(this.table(this.voice, t) * 1.6); // share of the streaks surfaced
    const step = fl.step * (0.55 + 0.9 * a.rms + 0.5 * a.drums); // tail step: longer streaks when loud
    // the anchors' waves: origin, front radius, strength
    const waves = this.cues.filter((c) => t >= c.at && t < c.at + WAVE).map((c) => {
      const age = t - c.at, n = this.cues.indexOf(c);
      return { x: W * (0.3 + 0.4 * hash(n, 17)), y: this.cy + 120 * (hash(n, 23) - 0.5), r: 1500 * ease.outQuart(age / WAVE) , s: 1 - age / WAVE };
    });
    const land = this.cues.filter((c) => c.at <= t).at(-1);
    const flash = land ? hit(t, land.at, 0.18) : 0;

    for (let i = 0; i < N; i++) {
      const rank = hash(i, 1);
      const vis = clamp((dens - rank) / 0.06);
      if (vis <= 0) continue;
      const z = hash(i, 2), depth = 0.35 + 0.65 * z; // 0 far .. 1 near
      const isAcc = hash(i, 3) < 0.14;
      // its life: a cycle of `life` px of travel, phase-shifted per streak; reborn at a new seeded point
      const L = fl.life * (0.7 + 0.6 * hash(i, 4));
      const trav = D * depth + hash(i, 5) * L, cyc = Math.floor(trav / L), s = trav - cyc * L;
      let x = -PAD + hash(i, cyc, 6) * (W + 2 * PAD), y = -PAD + hash(i, cyc, 7) * (H + 2 * PAD);
      const life = Math.min(1, s / (0.2 * L), (L - s) / (0.3 * L));
      for (let q = 0, h = s / K; q < K; q++) { // midpoint steps
        this.at(x, y);
        this.at(x + this.sx * h * 0.5, y + this.sy * h * 0.5);
        x += this.sx * h; y += this.sy * h;
      }
      if (x < -60 || x > W + 60 || y < -60 || y > H + 60) continue;

      // the waves: a band at the front brightens every streak; behind it the accent streaks keep glowing
      let band = 0, after = 0;
      for (const w of waves) {
        const dd = Math.hypot(x - w.x, y - w.y) - w.r;
        band = Math.max(band, w.s * Math.exp(-(dd * dd) / (2 * 70 * 70)));
        if (dd < 0) after = Math.max(after, w.s * Math.exp(dd / 240));
      }
      const glow = isAcc ? Math.min(1.5, 1.2 * band + 0.6 * after) : 0;
      const quiet = 1 - 0.55 * smoothstep(this.bottom - 90, this.bottom + 60, y); // under the lyric
      const al = vis * life * quiet * fl.ink * (0.16 + 0.42 * z) * (1 + 1.4 * band);
      const wid = 0.55 + 0.75 * z * z + (dark ? 0.6 : 1) * glow;
      const lit = isAcc ? Math.min(1, (dark ? 0.35 : 0.2) + glow + flash * 0.5) : 0.6 * band; // the front tints all
      let r: number, g: number, bl: number, op: number;
      if (dark) {
        const hdr = 1 + 1.6 * glow;
        r = (ty[0] + (ac[0] * hdr - ty[0]) * lit); g = (ty[1] + (ac[1] * hdr - ty[1]) * lit); bl = (ty[2] + (ac[2] * hdr - ty[2]) * lit);
        op = al * (isAcc ? 1 + 1.5 * glow : 1);
      } else {
        r = ty[0] + (ac[0] - ty[0]) * lit; g = ty[1] + (ac[1] - ty[1]) * lit; bl = ty[2] + (ac[2] - ty[2]) * lit;
        op = Math.min(1, al * 2.1 * (isAcc ? 1 + 2.5 * glow : 1));
      }

      // the tail, traced back from the head, fading
      const st = step * (0.5 + 0.5 * depth);
      for (let j = 0; j < S; j++) {
        this.at(x, y);
        const px = x - this.sx * st, py = y - this.sy * st;
        const fade = Math.pow(1 - j / S, 1.4);
        b.seg(x, y, 0, px, py, 0, wid, r, g, bl, op * fade);
        x = px; y = py;
      }
    }

    clearRT(this.ctx.renderer, out, bg);
    b.render(this.ctx.renderer, out);
    return {
      bloom: dark ? 0.5 : 0.1, bloomThreshold: dark ? 0.95 : 0.97, halation: 0, ca: dark ? 0.35 : 0.15, grain: 0.032,
      bloomRadius: 0.35, vignette: dark ? 0.34 : 0.2, hud: 0,
    };
  }
}
