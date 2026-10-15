// Harvest Now, Decrypt Later (Banger Remix): the tap. One glowing fibre crosses the upper frame, receding to the
// right; sealed envelopes hang from it on small clips and hop along it on the beats, swinging as they land. Halfway
// along, a faceted glass prism clamped to the fibre is the tap: a reader panel beside it shows what it sees (hex
// that churns with the hats and never resolves), and under it a frosted glass chute falls away out of frame. Every
// envelope that passes is copied: a pale ghost peels off downward and drops into the chute, and frost grows up the
// chute's walls.
//
// Phase `one` (verse 1): a single envelope, its date stamp thudding on (cue `stamp`), its padlock clicking green,
// the reader lighting on its anchor, the copy peeling off and landing on the chute floor on the last anchor, frost
// blooming up the walls. Phase `rekey` (verse 2): a dense stream, the chute packed with old copies; on the first
// anchor every padlock on the wire re-keys in a ripple; the camera then dives into the chute, where two old copies
// turn face-up (a floor plan, a birthday cake) with a tag (cue `tag`).
//
// The world is 3D (a perspective camera, keyed per phase); the ground and its light are a fullscreen pass, the
// fibre a GL line batch, the solid things a Canvas2D layer drawn through the camera, and the frost and the light
// effects a second, additive line batch.
import * as THREE from 'three';
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import type { ResolvedCue } from '../engine/cues';
import { FSPass } from '../engine/gl';
import { LineBatch } from '../engine/lines';
import { rgba } from '../engine/palette';
import { clamp, ease, hash, hexToLinear, keys, lerp, mulberry32, prog, type Key } from '../engine/util';
import { LibScene, W, H, arrive, hit, mixHex, text, type Look } from './_lib';

export const schema: SceneSchema = {
  description: 'The tap on the wire: sealed envelopes hang from one glowing fibre and hop along it on the beats past a faceted prism tap with a reader panel of churning hex; each is copied, its pale ghost dropping into a frost-lined glass chute below. Verses of the Harvest remix.',
  kinds: ['song'],
  lyrics: 'layer',
  entry: {
    phase: { type: 'string', enum: ['one', 'rekey'], default: 'one', description: 'one: a single envelope stamped, locked, read and copied into the empty chute; rekey: a dense stream, padlocks re-keying in a ripple, then a dive into the packed chute where two old copies turn face-up' },
    stamp: { type: 'string', default: '', description: 'one: the date stamp on the envelope; rekey: the tag under the copies that turn face-up' },
  },
  cue: {
    stamp: { type: 'string', default: '', description: 'a date stamp that thuds onto the envelope on this cue\'s anchor (phase one)' },
    tag: { type: 'string', default: '', description: 'the tag shown under the copies that turn face-up in this cue (phase rekey)' },
  },
  example: { entry: { phase: 'one', stamp: 'TUE 2021-03-09' }, cues: [{ stamp: 'TUE 2021-03-09' }, {}, {}, {}] },
};

interface P { phase: 'one' | 'rekey'; stamp: string }
interface C { stamp: string; tag: string }

type V3 = [number, number, number];
interface CamKey { t: number; c: V3; g: V3; fov?: number; e?: (x: number) => number }
interface Hop { t: number; ds: number; lift: number; swing: number }

// ------------------------------------------------------------------ the world (units: the envelope is 2.6 wide)
const K = 0.3; // the fibre recedes: z = -K * s
const UL = Math.hypot(1, K);
const U: V3 = [1 / UL, 0, -K / UL]; // along the fibre
const V: V3 = [K / UL, 0, 1 / UL]; // across it, toward the camera
const fib = (s: number): V3 => [s, 0, -K * s];
const LW = 260, LH = 160; // card drawing space (px per unit: 100)
const EW = 2.6, EH = 1.6, HANG = 0.22; // the envelope and its hanger
const PL = 2.4, PR = 0.62, TIP = 0.45; // the prism: body length, radius, end tips
const CW = 1.9, CD = 1.3, TOP = -2.1, FLOOR = -5.4; // the chute (half width, half depth, mouth, floor)
const PILE = FLOOR + 0.42; // top of the pile of old copies (rekey)
const NEAR = 0.3;
const FOV = 32;
const CAP = 70000;

// the panel: centre, size (card px), and per phase its type
const PANEL_C: V3 = [4.4, 1.55, -1.95];
const PANEL_W = 400, PANEL_H = 240;
const PANEL = {
  one: { size: 26, cols: 8, rows: 5, head: 'TLS 1.3 · AES-256-GCM', y0: 44, y1: 92, dy: 31 },
  rekey: { size: 30, cols: 7, rows: 4, head: 'AES-256-GCM', y0: 48, y1: 104, dy: 38 },
};

// the stream (rekey)
const RS = 0.55, RD = 1.75; // envelope scale and spacing

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const Y: V3 = [0, 1, 0];

// ------------------------------------------------------------------ frost (branching ice on the chute's glass)
const FSTEP = [0.05, 0.035, 0.028], FSPACE = [0.12, 0.07], FRATIO = [0.32, 0.4], FMAX = [0.42, 0.1], FWIG = [0.03, 0.07, 0.1];
/** Segments (u0, v0, u1, v1, s0, s1, level) of a crystal grown from (u, v) at angle a, kept inside [0, w] x [0, h]. */
function grow(out: number[], rnd: () => number, u: number, v: number, a: number, len: number, lvl: number, s: number, w: number, h: number) {
  const st = FSTEP[lvl]!, n = Math.max(1, Math.round(len / st));
  const curve = (rnd() - 0.5) * (lvl ? 0.9 : 0.25);
  let next = FSPACE[lvl] !== undefined ? FSPACE[lvl]! * (0.4 + rnd()) : Infinity, alt = rnd() < 0.5 ? 1 : -1;
  for (let i = 0; i < n; i++) {
    a += curve * st + (rnd() - 0.5) * FWIG[lvl]!;
    const nu = u + Math.cos(a) * st, nv = v + Math.sin(a) * st;
    if (nu < 0 || nu > w || nv < 0 || nv > h) return;
    out.push(u, v, nu, nv, s, s + st, lvl);
    u = nu; v = nv; s += st;
    const done = (i + 1) * st, rem = len - done;
    if (lvl < 2 && done >= next && rem > st * 2) {
      next += FSPACE[lvl]! * (0.7 + 0.6 * rnd());
      const sl = Math.min(rem * FRATIO[lvl]!, FMAX[lvl]!) * (0.7 + 0.4 * rnd());
      const da = (Math.PI / 3) * (0.95 + 0.1 * rnd());
      if (lvl === 0) {
        grow(out, rnd, u, v, a + da, sl, 1, s, w, h);
        grow(out, rnd, u, v, a - da, sl * (0.8 + 0.25 * rnd()), 1, s, w, h);
      } else { grow(out, rnd, u, v, a + alt * da, sl, 2, s, w, h); alt = -alt; }
    }
  }
}

// ------------------------------------------------------------------ the ground
const GROUND = /* glsl */ `
uniform vec3 bg; uniform vec3 ice; uniform float time;
uniform vec4 fib; uniform float fibGlow;
uniform vec3 prism; uniform float prismGlow;
uniform vec4 pool; uniform float poolGlow;
void main() {
  vec2 p = vec2(FRAG_PX.x, ${H.toFixed(1)} - FRAG_PX.y);
  vec3 col = bg;
  // the room: a breath of cold haze, drifting
  float n = fbm(p / 520.0 + vec2(time * 0.015, time * 0.006), 3) * 0.5 + 0.5;
  col += ice * 0.007 * n;
  // the fibre lights the air around it
  float d = sdSegment(p, fib.xy, fib.zw);
  col += ice * fibGlow * (0.03 * exp(-d / 46.0) + 0.016 * exp(-d / 240.0));
  // the prism's glow
  float r = length(p - prism.xy) / max(prism.z, 1.0);
  col += mix(ice, vec3(1.0), 0.3) * prismGlow * (0.05 * exp(-r * r * 1.5) + 0.012 * exp(-r));
  // cold light pooled on the chute floor
  vec2 q = (p - pool.xy) / max(pool.zw, vec2(1.0));
  col += ice * poolGlow * 0.06 * exp(-dot(q, q) * 1.4);
  fragColor = vec4(col, 1.0);
}`;

export default class HarvestRemixWire extends LibScene<P, C> {
  static schema = schema;
  private ground = new FSPass(GROUND, {
    bg: { value: new THREE.Vector3() }, ice: { value: new THREE.Vector3() }, time: { value: 0 },
    fib: { value: new THREE.Vector4() }, fibGlow: { value: 1 },
    prism: { value: new THREE.Vector3() }, prismGlow: { value: 1 },
    pool: { value: new THREE.Vector4() }, poolGlow: { value: 0 },
  });
  private fibre = new LineBatch(4000, { blend: 'max' });
  private fx = new LineBatch(CAP, { blend: 'add' });
  private cam = new THREE.PerspectiveCamera(FOV, W / H, 0.1, 400);
  private pv = new THREE.Matrix4();
  private camPos: V3 = [0, 0, 10];
  private focal = 1;

  private keys: CamKey[] = [];
  private hops: Hop[] = [];
  private beats: number[] = []; // the stream's hop beats (rekey)
  private hopDur = 0.3;
  private kicks: number[] = [];
  private hats: number[] = [];
  private frost = new Float32Array(0); // world endpoints: ax ay az bx by bz s0 lvl wallGain
  private prismV: V3[] = [];
  private prismF: number[][] = [];
  private pile: { c: V3; psi: number; seed: number }[] = [];
  private frostPath = new Path2D();
  private planPath = new Path2D();
  private cakePath = new Path2D();
  private flamePath = new Path2D();

  // the moments
  private aStamp = 0; private aClick = 0; private aRead = 0; private aCopy = 0; private aIce = 0;
  private c1 = 0; private c2 = 0;
  private aRekey = 0; private l13 = 0; private aFlip1 = 0; private aFlip2 = 0;
  private stampText = ''; private tagText = '';

  private get one() { return this.P.phase === 'one'; }

  override setup() {
    const au = this.ctx.audio, S = this.ctx.start, E = this.ctx.end;
    const cue = (i: number): ResolvedCue | undefined => this.cues[Math.min(i, this.cues.length - 1)];
    const wordAt = (c: ResolvedCue | undefined, re: RegExp, fb: number) => c?.line?.words.find((w) => re.test(w.w))?.start ?? fb;
    this.kicks = au.events('kick', S - 4, E + 1).map(([t]) => t);
    this.hats = au.events('hat', S, E + 1).map(([t]) => t);
    const period = au.beats.length > 1 ? (au.beats.at(-1)! - au.beats[0]!) / (au.beats.length - 1) : 0.46;
    this.hopDur = period * 0.62;
    const beatsIn = (a: number, b: number) => au.beats.filter((x) => x >= a && x < b);

    if (this.one) {
      this.aStamp = cue(0)?.at ?? S + 1.5;
      this.c1 = cue(1)?.start ?? S + 4; this.aClick = cue(1)?.at ?? this.c1 + 0.8;
      this.c2 = cue(2)?.start ?? S + 8; this.aRead = cue(2)?.at ?? this.c2 + 0.6;
      this.aIce = cue(3)?.at ?? E - 0.7;
      this.aCopy = wordAt(cue(3), /copy/i, this.aIce - 2.2);
      const sc = this.cues.find((c) => this.cp(c).stamp);
      this.stampText = (sc && this.cp(sc).stamp) || this.P.stamp;
      if (sc) this.aStamp = sc.at;
      // the envelope's journey: hops on the beats between the moments
      const plan = (a: number, b: number, ds: number, lift: number) => {
        const bs = beatsIn(a, b);
        for (const t of bs) this.hops.push({ t, ds: ds / bs.length, lift, swing: 1 });
      };
      plan(S + 0.1, this.aStamp - 0.15, 1.7, 0.3);
      plan(this.aStamp + 0.9, this.c1 - 0.25, 1.1, 0.24);
      this.hops.push({ t: this.aClick, ds: 0, lift: 0.1, swing: 0.4 });
      plan(this.aClick + 0.6, this.c2 - 0.15, 1.65, 0.24);
      plan(this.aCopy + 0.55, E + 0.01, 1.05 * Math.max(1, beatsIn(this.aCopy + 0.55, E + 0.01).length), 0.28);
      // the camera: wide, close on the seal, tracking, medium on the tap, then back and down for the drop
      this.keys = [
        { t: S, c: [0.2, -0.2, 15.8], g: [0.2, -1.15, 0] },
        { t: this.c1, c: [-0.2, -0.25, 15], g: [-0.2, -1.2, 0], e: ease.inOutQuad },
        { t: this.c1 + 0.8, c: [-2.1, -0.75, 7.6], g: [-2.25, -1.05, 0.78] },
        { t: this.aClick + 0.55, c: [-2.0, -0.75, 7.3], g: [-2.15, -1.05, 0.75] },
        { t: this.c2, c: [-0.55, -0.75, 7.3], g: [-0.65, -1.05, 0.3], e: ease.inOutQuad },
        { t: this.c2 + 0.85, c: [1.4, -0.3, 12.6], g: [1.4, -0.95, 0] },
        { t: this.aCopy + 0.3, c: [1.3, -0.35, 11.9], g: [1.3, -0.97, 0], e: ease.inOutQuad },
        { t: this.aIce - 0.15, c: [1.3, -1.3, 18.4], g: [1.0, -2.85, 0] },
        { t: E, c: [1.4, -1.35, 19.0], g: [1.05, -2.85, 0], e: ease.linear },
      ];
    } else {
      this.aRekey = cue(0)?.at ?? S + 1.5;
      const c13 = cue(1);
      this.l13 = c13?.start ?? S + 4;
      this.aFlip1 = c13?.at ?? this.l13 + 0.25;
      this.aFlip2 = wordAt(c13, /birthday/i, this.aFlip1 + 0.92);
      const tc = this.cues.find((c) => this.cp(c).tag);
      this.tagText = (tc && this.cp(tc).tag) || this.P.stamp;
      this.beats = beatsIn(S - 4, E + 1);
      const r = mulberry32(39);
      for (let i = 0; i < 30; i++) {
        this.pile.push({ c: [(r() - 0.5) * 2.1, FLOOR + 0.03 + i * 0.013, (r() - 0.5) * 1.3], psi: (r() - 0.5) * 1.1, seed: i });
      }
      const dive = this.l13 - 0.65;
      this.keys = [
        { t: S, c: [0.8, -0.9, 21.5], g: [0.8, -2.6, 0] },
        { t: dive, c: [0.6, -0.9, 20], g: [0.6, -2.6, 0], e: ease.inOutQuad },
        // looking down past the pile's near edge, so the pile sits high and the lower fifth stays on the dark floor
        { t: this.aFlip1 - 0.05, c: [0, -1.05, 1.0], g: [0, -5, 0.42], fov: 44 },
        { t: E, c: [0, -1.4, 0.98], g: [0, -5, 0.44], fov: 44, e: ease.linear },
      ];
    }

    // the frost on the chute's four walls (u along the wall, v up from the floor)
    const rnd = mulberry32(this.one ? 309 : 2021), hgt = TOP - FLOOR, segs: number[] = [];
    const walls: { o: V3; u: V3; w: number; gain: number }[] = [
      { o: [-CW, FLOOR, -CD], u: [1, 0, 0], w: 2 * CW, gain: 0.45 },
      { o: [-CW, FLOOR, -CD], u: [0, 0, 1], w: 2 * CD, gain: 0.6 },
      { o: [CW, FLOOR, -CD], u: [0, 0, 1], w: 2 * CD, gain: 0.6 },
      { o: [-CW, FLOOR, CD], u: [1, 0, 0], w: 2 * CW, gain: 1 },
    ];
    for (const wl of walls) {
      const loc: number[] = [], n = Math.round(wl.w / 0.62);
      for (let i = 0; i < n; i++) {
        grow(loc, rnd, ((i + 0.3 + 0.4 * rnd()) / n) * wl.w, 0.01, Math.PI / 2 + (rnd() - 0.5) * 1.0, 1.4 + rnd() * 2.0, 0, 0, wl.w, hgt);
      }
      for (const side of [0, 1]) for (let i = 0; i < 2; i++) {
        const v0 = 0.2 + rnd() * 1.8, a = side ? Math.PI - 0.3 - rnd() * 0.5 : 0.3 + rnd() * 0.5;
        grow(loc, rnd, side ? wl.w - 0.01 : 0.01, v0, a, 0.7 + rnd() * 1.1, 0, v0 * 0.9, wl.w, hgt);
      }
      for (let i = 0; i < loc.length; i += 7) {
        const p = (u: number, v: number) => add(add(wl.o, mul(wl.u, u)), [0, v, 0]);
        segs.push(...p(loc[i]!, loc[i + 1]!), ...p(loc[i + 2]!, loc[i + 3]!), loc[i + 4]!, loc[i + 6]!, wl.gain);
      }
    }
    this.frost = new Float32Array(segs);

    // the prism: a hexagonal body along the fibre with pointed ends
    const ring = (a: number) => Array.from({ length: 6 }, (_, k): V3 => {
      const th = (k / 6) * Math.PI * 2 + Math.PI / 6;
      return add(mul(U, a), add(mul(Y, PR * Math.cos(th)), mul(V, PR * Math.sin(th))));
    });
    this.prismV = [...ring(-PL / 2), ...ring(PL / 2), mul(U, -PL / 2 - TIP), mul(U, PL / 2 + TIP)];
    for (let k = 0; k < 6; k++) {
      const k1 = (k + 1) % 6;
      this.prismF.push([k, k1, 6 + k1, 6 + k], [12, k1, k], [13, 6 + k, 6 + k1]);
    }

    // card drawings: frost on a copy, the floor plan, the cake
    const fr = mulberry32(77), fs: number[] = [];
    grow(fs, fr, 0.02, 0.02, 0.5, 0.9, 0, 0, 2.6, 1.6);
    grow(fs, fr, 2.58, 0.02, Math.PI - 0.6, 0.8, 0, 0, 2.6, 1.6);
    grow(fs, fr, 0.02, 1.58, -0.4, 0.7, 0, 0, 2.6, 1.6);
    grow(fs, fr, 2.58, 1.58, Math.PI + 0.5, 0.9, 0, 0, 2.6, 1.6);
    for (let i = 0; i < fs.length; i += 7) { this.frostPath.moveTo(fs[i]! * 100, fs[i + 1]! * 100); this.frostPath.lineTo(fs[i + 2]! * 100, fs[i + 3]! * 100); }
    const pl = this.planPath;
    pl.rect(40, 22, 180, 112);
    pl.moveTo(122, 22); pl.lineTo(122, 64); pl.moveTo(122, 92); pl.lineTo(122, 134);
    pl.moveTo(40, 82); pl.lineTo(84, 82); pl.moveTo(106, 82); pl.lineTo(122, 82);
    pl.moveTo(122, 70); pl.lineTo(170, 70); pl.moveTo(192, 70); pl.lineTo(220, 70);
    pl.moveTo(84, 82); pl.arc(84, 82, 22, 0, -Math.PI / 2, true);
    pl.moveTo(170, 70); pl.arc(170, 70, 22, Math.PI, Math.PI * 1.5);
    pl.moveTo(60, 22); pl.lineTo(60, 17); pl.lineTo(100, 17); pl.lineTo(100, 22);
    pl.moveTo(150, 134); pl.lineTo(150, 139); pl.lineTo(196, 139); pl.lineTo(196, 134);
    pl.moveTo(136, 84); pl.rect(136, 84, 38, 30); pl.moveTo(182, 96); pl.rect(182, 96, 24, 24);
    const ck = this.cakePath;
    ck.ellipse(130, 124, 74, 8, 0, 0, Math.PI * 2);
    ck.rect(82, 90, 96, 32); ck.rect(100, 64, 60, 26);
    for (let x = 82; x < 178; x += 12) { ck.moveTo(x, 96); ck.arc(x + 6, 96, 6, Math.PI, 0, true); }
    for (let x = 100; x < 160; x += 10) { ck.moveTo(x, 69); ck.arc(x + 5, 69, 5, Math.PI, 0, true); }
    for (const x of [111, 124, 137, 150]) {
      ck.rect(x - 2, 46, 4, 18);
      this.flamePath.moveTo(x, 34); this.flamePath.quadraticCurveTo(x + 5, 41, x, 44); this.flamePath.quadraticCurveTo(x - 5, 41, x, 34);
    }
  }

  // ------------------------------------------------------------------ camera and projection

  private setCamera(t: number) {
    const ks = this.keys, comp = (f: (k: CamKey) => number) => keys(t, ks.map((k): Key => [k.t, f(k), k.e]));
    const c: V3 = [comp((k) => k.c[0]), comp((k) => k.c[1]), comp((k) => k.c[2])];
    const g: V3 = [comp((k) => k.g[0]), comp((k) => k.g[1]), comp((k) => k.g[2])];
    const fov = comp((k) => k.fov ?? FOV);
    this.cam.fov = fov;
    this.cam.position.set(...c);
    this.cam.lookAt(...g);
    this.cam.updateProjectionMatrix();
    this.cam.updateMatrixWorld(true);
    this.pv.multiplyMatrices(this.cam.projectionMatrix, this.cam.matrixWorldInverse);
    this.camPos = c;
    this.focal = H / 2 / Math.tan((fov * Math.PI) / 360);
  }

  /** Screen x, y (logical px) and depth of a world point. */
  private pj(x: number, y: number, z: number): V3 {
    const e = this.pv.elements, w = e[3]! * x + e[7]! * y + e[11]! * z + e[15]!;
    const cx = e[0]! * x + e[4]! * y + e[8]! * z + e[12]!, cy = e[1]! * x + e[5]! * y + e[9]! * z + e[13]!;
    return [(cx / w * 0.5 + 0.5) * W, (0.5 - cy / w * 0.5) * H, w];
  }
  private pjv(p: V3) { return this.pj(p[0], p[1], p[2]); }

  /** A 3D segment into a batch, clipped at the near plane; width in px, or in world units if `world`. */
  private line(b: LineBatch, a: V3, c: V3, width: number, col: V3, alpha: number, world = false) {
    let pa = this.pjv(a), pc = this.pjv(c);
    if (pa[2] < NEAR && pc[2] < NEAR) return;
    if (pa[2] < NEAR || pc[2] < NEAR) {
      const k = (NEAR - pa[2]) / (pc[2] - pa[2]), m: V3 = [lerp(a[0], c[0], k), lerp(a[1], c[1], k), lerp(a[2], c[2], k)];
      if (pa[2] < NEAR) pa = this.pjv(m); else pc = this.pjv(m);
    }
    const w = world ? (width * this.focal * 2) / (pa[2] + pc[2]) : width;
    b.seg(pa[0], pa[1], 0, pc[0], pc[1], 0, w, col[0], col[1], col[2], alpha);
  }

  /** A world polygon as the current canvas path (clipped at the near plane); false if nothing is left. */
  private poly(c: CanvasRenderingContext2D, pts: V3[]) {
    const out: V3[] = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i]!, b = pts[(i + 1) % pts.length]!, pa = this.pjv(a), pb = this.pjv(b);
      if (pa[2] >= NEAR) out.push(pa);
      if ((pa[2] >= NEAR) !== (pb[2] >= NEAR)) {
        const k = (NEAR - pa[2]) / (pb[2] - pa[2]);
        out.push(this.pj(lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)));
      }
    }
    if (out.length < 3) return false;
    c.beginPath();
    out.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
    c.closePath();
    return true;
  }

  // ------------------------------------------------------------------ motion

  /** Phase one: the envelope's place on the fibre, its lift and its swing at t. */
  private envelope(t: number) {
    let s = -5.4, lift = 0, sw = 0;
    for (const h of this.hops) {
      const p = prog(t, h.t, h.t + this.hopDur);
      s += h.ds * ease.inOutCubic(p);
      lift += h.lift * Math.sin(Math.PI * p);
      if (t > h.t) { const a = t - h.t; sw -= 0.11 * h.swing * Math.min(1, h.ds / 0.4 + 0.3) * Math.sin(a * 10.5) * Math.exp(-a * 3.2); }
    }
    // the slide under the tap (L02)
    s += 0.95 * ease.inOutCubic(prog(t, this.c2, this.aRead - 0.3));
    return { s, lift, sw };
  }

  /** Rekey: hops of the stream done by t (fractional while hopping). */
  private hopsDone(t: number) {
    let n = 0;
    for (const b of this.beats) { if (b > t) break; n += ease.inOutCubic(prog(t, b, b + this.hopDur)); }
    return n;
  }
  private hopLift(t: number) {
    let l = 0, sw = 0;
    for (const b of this.beats) {
      if (b > t) break;
      const p = prog(t, b, b + this.hopDur), a = t - b;
      l += Math.sin(Math.PI * p);
      if (a < 3) sw -= Math.sin(a * 10.5) * Math.exp(-a * 3.2);
    }
    return { l, sw };
  }

  // ------------------------------------------------------------------ drawing: the card (an envelope)

  /**
   * An envelope card at centre `ce` with in-plane axes `r` (its width) and `u` (its height), `sc` its scale. The
   * side facing the camera is drawn: the back (flap, seal padlock, stamp) or the face (a drawing seen through frost).
   */
  private card(c: CanvasRenderingContext2D, k: Look, ce: V3, r: V3, u: V3, sc: number, o: {
    alpha: number; pale: number; lock: string; lockA?: number; lift?: number; stamp?: { s: string; p: number; hit: number };
    drawing?: 'plan' | 'cake'; reveal?: number;
  }) {
    const w = EW * sc / 2, h = EH * sc / 2;
    const L = this.pjv(add(ce, mul(r, -w))), R = this.pjv(add(ce, mul(r, w))), T = this.pjv(add(ce, mul(u, h))), B = this.pjv(add(ce, mul(u, -h)));
    const M0 = this.pjv(ce);
    if (Math.min(L[2], R[2], T[2], B[2]) < NEAR) return;
    let ax = (R[0] - L[0]) / LW, ay = (R[1] - L[1]) / LW;
    const bx = (B[0] - T[0]) / LH, by = (B[1] - T[1]) / LH;
    const back = ax * by - ay * bx > 0;
    if (!back) { ax = -ax; ay = -ay; }
    c.save();
    c.transform(ax, ay, bx, by, M0[0] - ax * LW / 2 - bx * LH / 2, M0[1] - ay * LW / 2 - by * LH / 2);
    c.globalAlpha = o.alpha;
    const paper = mixHex(mixHex(k.type, k.bg, 0.2), mixHex(k.type, k.accent, 0.35), o.pale);
    const g = c.createLinearGradient(0, 0, 0, LH);
    g.addColorStop(0, mixHex(paper, '#ffffff', 0.12)); g.addColorStop(0.5, paper); g.addColorStop(1, mixHex(paper, k.bg, 0.22));
    c.beginPath(); c.roundRect(0, 0, LW, LH, 4);
    c.fillStyle = g; c.fill();
    c.lineWidth = 1.5; c.strokeStyle = rgba(k.bg, 0.25); c.stroke();
    if (back) {
      // the folds and the flap, the seal padlock at its tip
      c.beginPath(); c.moveTo(0, LH); c.lineTo(LW * 0.43, LH * 0.53); c.moveTo(LW, LH); c.lineTo(LW * 0.57, LH * 0.53);
      c.strokeStyle = rgba(k.bg, 0.14); c.lineWidth = 1.5; c.stroke();
      c.beginPath(); c.moveTo(0, 2); c.lineTo(LW / 2, 90); c.lineTo(LW, 2);
      c.strokeStyle = rgba(k.bg, 0.1); c.lineWidth = 6; c.stroke();
      c.fillStyle = mixHex(paper, '#ffffff', 0.07); c.fill();
      c.strokeStyle = rgba(k.bg, 0.3); c.lineWidth = 1.6; c.stroke();
      this.lock(c, LW / 2, 86, 26, o.lock, o.lockA ?? 1, o.lift ?? 0, k);
      if (o.stamp && o.stamp.p > 0) this.stamp(c, k, o.stamp.s, o.stamp.p, o.stamp.hit);
    } else if (o.drawing) {
      c.globalAlpha = o.alpha * clamp(o.reveal ?? 1) * 0.85;
      c.strokeStyle = mixHex(k.accent, k.bg, 0.15); c.lineWidth = 2.4; c.lineJoin = 'round';
      c.stroke(o.drawing === 'plan' ? this.planPath : this.cakePath);
      if (o.drawing === 'cake') {
        c.fillStyle = mixHex(k.accent, k.bg, 0.15); c.fill(this.flamePath);
        text(c, '12 · 06 · 1987', LW / 2, 150, this.font('mono'), 14, mixHex(k.accent, k.bg, 0.2), { align: 'center' });
      }
      c.globalAlpha = o.alpha;
    }
    if (o.pale > 0) { // rime over a copy
      c.fillStyle = rgba(k.accent, 0.1 * o.pale); c.fillRect(0, 0, LW, LH);
      c.strokeStyle = rgba('#ffffff', 0.4 * o.pale); c.lineWidth = 1; c.stroke(this.frostPath);
    }
    c.restore();
  }

  /** A padlock with its body centred at (x, y), `s` its body width, in a colour; the shackle raised by `lift`. */
  private lock(c: CanvasRenderingContext2D, x: number, y: number, s: number, col: string, a: number, lift: number, k: Look) {
    const top = y - 0.36 * s, sy = y - 0.62 * s - lift, r = 0.29 * s;
    c.save();
    c.globalAlpha *= a;
    c.beginPath(); c.moveTo(x - r, top + 3); c.lineTo(x - r, sy); c.arc(x, sy, r, Math.PI, 0); c.lineTo(x + r, top + 3);
    c.strokeStyle = mixHex(col, k.bg, 0.15); c.lineWidth = 0.15 * s; c.stroke();
    const g = c.createLinearGradient(0, top, 0, top + 0.76 * s);
    g.addColorStop(0, mixHex(col, '#ffffff', 0.25)); g.addColorStop(0.5, col); g.addColorStop(1, mixHex(col, k.bg, 0.3));
    c.beginPath(); c.roundRect(x - s / 2, top, s, 0.76 * s, 0.16 * s);
    c.fillStyle = g; c.fill();
    const ky = y - 0.04 * s;
    c.beginPath(); c.arc(x, ky, 0.09 * s, 0, Math.PI * 2);
    c.moveTo(x - 0.035 * s, ky); c.lineTo(x - 0.06 * s, ky + 0.24 * s); c.lineTo(x + 0.06 * s, ky + 0.24 * s); c.lineTo(x + 0.035 * s, ky);
    c.fillStyle = mixHex(col, k.bg, 0.75); c.fill();
    c.restore();
  }

  /** The date stamp, slammed on (p 0..1 the descent) in dark ink, two lines in a rounded box. */
  private stamp(c: CanvasRenderingContext2D, k: Look, s: string, p: number, hitK: number) {
    const sp = s.indexOf(' '), l1 = sp > 0 ? s.slice(0, sp) : s, l2 = sp > 0 ? s.slice(sp + 1) : '';
    const fam = this.font('mono'), size = 20, ink = mixHex(k.bg, k.accent, 0.12);
    const cx = LW - 72, cy = LH - 30, sc = lerp(1.8, 1, ease.inQuad(p)) * (1 - 0.04 * hitK);
    c.save();
    c.translate(cx, cy); c.rotate(-0.07); c.scale(sc, sc);
    c.globalAlpha *= p * 0.88;
    c.beginPath(); c.roundRect(-64, -25, 128, 50, 6);
    c.strokeStyle = ink; c.lineWidth = 2.4; c.stroke();
    text(c, l1, 0, l2 ? -3 : 7, fam, size, ink, { align: 'center', track: 2 });
    if (l2) text(c, l2, 0, 18, fam, size, ink, { align: 'center' });
    c.restore();
  }

  // ------------------------------------------------------------------ drawing: the tap, the panel, the chute

  private drawPrism(c: CanvasRenderingContext2D, k: Look) {
    const vs = this.prismV, cp = this.camPos, L: V3 = [-0.35, 0.8, 0.5];
    const faces = this.prismF.map((f) => {
      const p = f.map((i) => vs[i]!), cen = mul(p.reduce((a, b) => add(a, b), [0, 0, 0] as V3), 1 / p.length);
      const n = cross(add(p[1]!, mul(p[0]!, -1)), add(p[2]!, mul(p[0]!, -1)));
      const nl = Math.hypot(...n), nn = mul(n, 1 / nl), toC = add(cp, mul(cen, -1));
      const front = nn[0] * toC[0] + nn[1] * toC[1] + nn[2] * toC[2] > 0;
      return { p, front, d: Math.hypot(...toC), lit: Math.max(0, nn[0] * L[0] + nn[1] * L[1] + nn[2] * L[2]) };
    }).sort((a, b) => b.d - a.d);
    for (const pass of [false, true]) for (const f of faces) {
      if (f.front !== pass || !this.poly(c, f.p)) continue;
      c.fillStyle = rgba(mixHex(k.accent, '#ffffff', 0.3 * f.lit), pass ? 0.06 + 0.16 * f.lit : 0.04);
      c.fill();
      c.strokeStyle = rgba(mixHex(k.accent, '#ffffff', 0.4), pass ? 0.3 + 0.4 * f.lit : 0.12);
      c.lineWidth = 1.2; c.lineJoin = 'round'; c.stroke();
    }
    // the collars clamping the fibre
    for (const sgn of [-1, 1]) {
      const pts: V3[] = [];
      for (const a of [PL / 2 + TIP - 0.05, PL / 2 + TIP + 0.22]) for (let i = 0; i < 16; i++) {
        const th = (i / 16) * Math.PI * 2;
        pts.push(this.pjv(add(mul(U, sgn * a), add(mul(Y, 0.17 * Math.cos(th)), mul(V, 0.17 * Math.sin(th))))));
      }
      const hull = convexHull(pts);
      if (hull.length < 3 || Math.min(...pts.map((p) => p[2])) < NEAR) continue;
      c.beginPath(); hull.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
      c.fillStyle = mixHex(k.panel, k.type, 0.08); c.fill();
      c.strokeStyle = rgba(k.accent, 0.45); c.lineWidth = 1.2; c.stroke();
    }
  }

  private drawPanel(c: CanvasRenderingContext2D, k: Look, t: number) {
    const lay = PANEL[this.P.phase], r: V3 = [0.985, 0, 0.17], hw = PANEL_W / 200, hh = PANEL_H / 200;
    const L = this.pjv(add(PANEL_C, mul(r, -hw))), R = this.pjv(add(PANEL_C, mul(r, hw)));
    const T = this.pjv(add(PANEL_C, [0, hh, 0])), B = this.pjv(add(PANEL_C, [0, -hh, 0])), M0 = this.pjv(PANEL_C);
    if (Math.min(L[2], R[2], T[2], B[2]) < NEAR) return;
    const ax = (R[0] - L[0]) / PANEL_W, ay = (R[1] - L[1]) / PANEL_W, bx = (B[0] - T[0]) / PANEL_H, by = (B[1] - T[1]) / PANEL_H;
    // the cable from the prism's collar to the panel
    const a0 = this.pjv(mul(U, PL / 2 + TIP + 0.1)), a1 = this.pjv(add(PANEL_C, [-hw * 0.7, -hh, 0]));
    if (a0[2] > NEAR) {
      c.beginPath(); c.moveTo(a0[0], a0[1]); c.bezierCurveTo(a0[0] + 40, a0[1] + 30, a1[0] - 10, a1[1] + 60, a1[0], a1[1]);
      c.strokeStyle = rgba(k.dim, 0.5); c.lineWidth = 1.5; c.stroke();
    }
    const on = this.one ? arrive(t, this.aRead, 0.05) * (t < this.aRead + 0.14 ? 0.55 + 0.45 * Math.cos((t - this.aRead) * 90) : 1) : 1;
    c.save();
    c.transform(ax, ay, bx, by, M0[0] - ax * PANEL_W / 2 - bx * PANEL_H / 2, M0[1] - ay * PANEL_W / 2 - by * PANEL_H / 2);
    c.beginPath(); c.roundRect(0, 0, PANEL_W, PANEL_H, 12);
    c.fillStyle = rgba(k.panel, 0.94); c.fill();
    c.strokeStyle = rgba(mixHex(k.rule, k.accent, 0.3 * on), 1); c.lineWidth = 2; c.stroke();
    c.beginPath(); c.roundRect(10, 10, PANEL_W - 20, PANEL_H - 20, 7);
    c.fillStyle = rgba(mixHex(k.bg, k.accent, 0.06 * on), 1); c.fill();
    const mono = this.font('mono');
    text(c, lay.head, 24, lay.y0, mono, lay.size, on > 0 ? mixHex(k.dim, k.type, 0.5 * on) : k.dim, { track: 1 });
    if (on > 0) {
      // the reading: hex that churns with the hats, each byte at its own rate
      let hats = 0;
      for (const h of this.hats) { if (h > t) break; hats++; }
      const cw = lay.size * 0.6;
      for (let rr = 0; rr < lay.rows; rr++) {
        let row = '';
        for (let cc = 0; cc < lay.cols; cc++) {
          const rate = 1 + Math.floor(hash(rr, cc, 5) * 3), n = Math.floor((hats + hash(rr, cc, 9) * 3) / rate);
          row += (cc ? ' ' : '') + Math.floor(hash(rr, cc, n, 3) * 256).toString(16).toUpperCase().padStart(2, '0');
        }
        text(c, row, 24, lay.y1 + rr * lay.dy, mono, lay.size, rgba(k.accent, 0.88 * on));
      }
      // the cursor block, never reaching an answer
      if (Math.floor(t * 2.4) % 2 === 0) { c.fillStyle = rgba(k.accent, 0.7 * on); c.fillRect(24 + lay.cols * 3 * cw, lay.y1 + (lay.rows - 1) * lay.dy - lay.size * 0.75, cw * 0.9, lay.size * 0.9); }
    }
    c.restore();
  }

  /** The chute's floor and walls; `inner` draws what lies inside it between the back walls and the front one. */
  private drawChute(c: CanvasRenderingContext2D, k: Look, frost: number, inner: () => void) {
    const fl: V3[] = [[-CW, FLOOR, -CD], [CW, FLOOR, -CD], [CW, FLOOR, CD], [-CW, FLOOR, CD]];
    if (this.poly(c, fl)) { c.fillStyle = rgba(mixHex(k.panel, k.accent, 0.04), 0.95); c.fill(); c.strokeStyle = rgba(k.accent, 0.25); c.lineWidth = 1.2; c.stroke(); }
    const glass = (pts: V3[], a: number) => {
      if (!this.poly(c, pts)) return;
      const b = this.pj(0, FLOOR, pts[0]![2]), t = this.pj(0, TOP, pts[0]![2]);
      const g = c.createLinearGradient(b[0], b[1], t[0], t[1]);
      g.addColorStop(0, rgba(k.accent, a * (0.05 + 0.12 * frost))); g.addColorStop(1, rgba(k.accent, a * (0.015 + 0.03 * frost)));
      c.fillStyle = g; c.fill();
    };
    const back: V3[] = [[-CW, FLOOR, -CD], [CW, FLOOR, -CD], [CW, TOP, -CD], [-CW, TOP, -CD]];
    const left: V3[] = [[-CW, FLOOR, -CD], [-CW, FLOOR, CD], [-CW, TOP, CD], [-CW, TOP, -CD]];
    const right: V3[] = [[CW, FLOOR, -CD], [CW, FLOOR, CD], [CW, TOP, CD], [CW, TOP, -CD]];
    const front: V3[] = [[-CW, FLOOR, CD], [CW, FLOOR, CD], [CW, TOP, CD], [-CW, TOP, CD]];
    glass(back, 0.8); glass(left, 0.9); glass(right, 0.9);
    inner();
    glass(front, 1);
    // the glass edges, the rim of the mouth lit from above
    const edge = (a: V3, b: V3, al: number, w = 1.2) => {
      const pa = this.pjv(a), pb = this.pjv(b);
      if (pa[2] < NEAR || pb[2] < NEAR) return;
      c.beginPath(); c.moveTo(pa[0], pa[1]); c.lineTo(pb[0], pb[1]); c.strokeStyle = rgba(mixHex(k.accent, '#ffffff', 0.3), al); c.lineWidth = w; c.stroke();
    };
    for (const [x, z] of [[-CW, -CD], [CW, -CD], [CW, CD], [-CW, CD]] as const) edge([x, FLOOR, z], [x, TOP, z], 0.28);
    for (let i = 0; i < 4; i++) { const a = fl[i]!, b = fl[(i + 1) % 4]!; edge([a[0], TOP, a[2]], [b[0], TOP, b[2]], 0.55, 1.6); }
  }

  // ------------------------------------------------------------------ the frame

  override draw() {}

  override render(f: Frame, out: THREE.WebGLRenderTarget) {
    const t = f.t, k = this.lookAt(t), r = this.ctx.renderer, a = f.a;
    this.setCamera(t);
    const ice = hexToLinear(k.accent), green = hexToLinear(k.accent2), white = hexToLinear(mixHex(k.type, k.accent, 0.25));
    const fb = this.fx, fbr = this.fibre;
    fb.clear(); fbr.clear();

    // --- state
    const one = this.one;
    const env = one ? this.envelope(t) : null;
    const frostR = one ? lerp(0.3, 4.2, ease.outCubic(prog(t, this.aIce - 0.05, this.aIce + 1.1))) : 4.2;
    const frostK = clamp(frostR / 3);

    // --- ground
    const u = this.ground.u;
    (u.bg!.value as THREE.Vector3).set(...hexToLinear(k.bg));
    (u.ice!.value as THREE.Vector3).set(...ice);
    u.time!.value = t;
    const sA = -24, sB = 30, fa = this.pjv(fib(sA)), fz = this.pjv(fib(sB));
    (u.fib!.value as THREE.Vector4).set(fa[0], fa[1], fz[0], fz[1]);
    u.fibGlow!.value = 0.75 + 0.5 * a.kick + 0.4 * a.rms;
    const pc = this.pj(0, 0, 0);
    (u.prism!.value as THREE.Vector3).set(pc[0], pc[1], (PR * 2.2 * this.focal) / Math.max(pc[2], 0.5));
    u.prismGlow!.value = 0.7 + 0.6 * a.rms + (one ? 1.2 * hit(t, this.aCopy, 0.25) : 0);
    const po = this.pj(0, FLOOR, 0), pr = (CW * this.focal) / Math.max(po[2], 0.5);
    (u.pool!.value as THREE.Vector4).set(po[0], po[1], pr * 1.1, pr * 0.6);
    u.poolGlow!.value = (one ? 0.35 * frostK + 2.5 * hit(t, this.aIce, 0.22) : 1) * (0.8 + 0.3 * a.rms);
    this.ground.render(r, out);

    // --- the fibre: a hot core and its halo, kick pulses running along it to the right
    const pulses = this.kicks.filter((x) => x <= t && x > t - 3.5).map((x) => ({ s: -22 + 17 * (t - x), amp: 1.4 * Math.exp(-(t - x) * 0.9) }));
    const N = 180;
    for (let i = 0; i < N; i++) {
      const s0 = lerp(sA, sB, i / N), s1 = lerp(sA, sB, (i + 1) / N), sm = (s0 + s1) / 2;
      let e = 0.9 + 0.35 * a.rms;
      for (const p of pulses) e += p.amp * Math.exp(-(((sm - p.s) / 1.1) ** 2));
      if (Math.abs(sm) < PL / 2 + TIP) e += 0.8;
      const core = mixHex(k.accent, '#ffffff', 0.55), cc = hexToLinear(core);
      this.line(fbr, fib(s0), fib(s1), 0.5, [ice[0] * e, ice[1] * e, ice[2] * e], 0.05, true);
      this.line(fbr, fib(s0), fib(s1), 0.13, [ice[0] * e, ice[1] * e, ice[2] * e], 0.22, true);
      this.line(fbr, fib(s0), fib(s1), 0.032, [cc[0] * 1.6 * e, cc[1] * 1.6 * e, cc[2] * 1.6 * e], 1, true);
    }
    if (fbr.count) fbr.render(r, out);

    // --- the picture (Canvas2D through the camera)
    this.L.clear();
    const c = this.L.ctx;
    c.save();
    try {
      this.drawPanel(c, k, t);
      if (one) this.pictureOne(c, k, t, env!, frostK);
      else this.pictureRekey(c, k, t, frostK);
      this.drawPrism(c, k);
    } finally { c.restore(); }
    this.ctx.comp.draw(r, this.L.upload(), out, { mode: 'normal' });

    // --- frost on the glass (additive hairlines), tips glinting while they grow
    const fc = hexToLinear(mixHex(k.type, k.accent, 0.4)), gain = 0.75 + 0.25 * a.hat;
    const F = this.frost;
    for (let i = 0; i < F.length; i += 9) {
      const s0 = F[i + 6]!;
      if (s0 >= frostR) continue;
      const lvl = F[i + 7]!, wg = F[i + 8]!, tip = Math.exp(-(frostR - s0) / 0.12) * (frostR < 4 ? 1 : 0);
      const e = gain * (1 + 1.8 * tip), al = (lvl === 0 ? 0.42 : lvl === 1 ? 0.3 : 0.22) * wg;
      this.line(fb, [F[i]!, F[i + 1]!, F[i + 2]!], [F[i + 3]!, F[i + 4]!, F[i + 5]!], lvl === 0 ? 1.3 : lvl === 1 ? 1.0 : 0.8, [fc[0] * e, fc[1] * e, fc[2] * e], al);
    }
    // the light inside the prism
    const pe = 1.3 + 0.6 * a.rms + (one ? 2 * hit(t, this.aCopy, 0.2) : 0);
    this.line(fb, fib(-PL / 2 - TIP), fib(PL / 2 + TIP), 0.09, [ice[0] * pe, ice[1] * pe, ice[2] * pe], 0.35, true);
    if (one) this.fxOne(t, ice, green, white, env!);
    else this.fxRekey(t, ice, green, white);
    if (fb.count) fb.render(r, out);

    return { bloom: 0.55, bloomThreshold: 0.7, bloomRadius: 0.45, halation: 0, ca: 0.15, grain: 0.034, vignette: 0.36, hud: 0 };
  }

  // ------------------------------------------------------------------ phase one

  /** Where the hanging envelope is: centre, axes. */
  private hanging(s: number, lift: number, sw: number, sc: number, tip = 0, drop = 0, back = 0) {
    const pivot = add(fib(s), [0, lift, 0]);
    const r = add(mul(U, Math.cos(sw)), mul(Y, Math.sin(sw)));
    let up = add(mul(Y, Math.cos(sw)), mul(U, -Math.sin(sw)));
    const ce0 = add(pivot, mul(up, -(HANG * sc + (EH * sc) / 2)));
    if (tip) up = add(mul(up, Math.cos(tip)), mul(V, -Math.sin(tip)));
    return { pivot, r, up, ce: add(add(ce0, [0, -drop, 0]), mul(V, back)) };
  }

  private lockState(t: number) {
    const k = this.lookAt(t);
    const green = arrive(t, this.aClick, 0.08);
    return { col: mixHex(mixHex(k.dim, k.type, 0.25), k.accent2, green), lift: t < this.aClick ? 3 : 3 * Math.exp(-(t - this.aClick) * 18) * Math.cos((t - this.aClick) * 40) };
  }

  /** The copy at t: null before it peels; its centre, axes and how far it has fallen. */
  private copyState(t: number, s: number) {
    if (t < this.aCopy) return null;
    const peel = ease.outCubic(prog(t, this.aCopy, this.aCopy + 0.45));
    const t0 = this.aIce - 0.72, fall = prog(t, t0, this.aIce);
    const h0 = this.hanging(s, 0, 0, 1);
    const y0 = h0.ce[1] - 0.95 * peel, yLand = FLOOR + 0.03;
    // falling: the card tips over backwards and lands flat; a small settle after
    const settle = t > this.aIce ? 0.12 * Math.exp(-(t - this.aIce) * 9) * Math.cos((t - this.aIce) * 30) : 0;
    const tip = lerp(0.05 * peel, Math.PI / 2, ease.inQuad(fall)) - settle;
    const y = t < t0 ? y0 : lerp(y0, yLand + 0.5 * Math.cos(tip) * 0, ease.inQuad(fall));
    const sway = t < t0 ? 0.04 * Math.sin((t - this.aCopy) * 5) * peel : 0;
    const up = add(mul(Y, Math.cos(tip)), mul(V, -Math.sin(tip)));
    const r = add(mul(U, Math.cos(sway)), mul(Y, Math.sin(sway)));
    const ce: V3 = [h0.ce[0], y + (t >= t0 ? (EH / 2) * Math.cos(tip) * (1 - fall) : 0), h0.ce[2] - 0.14 * peel * (1 - fall)];
    return { ce, r, up, peel, fall };
  }

  private copyS = 0; // the envelope's s when the copy peeled

  private pictureOne(c: CanvasRenderingContext2D, k: Look, t: number, env: { s: number; lift: number; sw: number }, frostK: number) {
    this.copyS = this.envelope(this.aCopy).s;
    const cp = this.copyState(t, this.copyS), ls = this.lockState(t);
    this.drawChute(c, k, frostK, () => {
      if (cp) this.card(c, k, cp.ce, cp.r, cp.up, 1, { alpha: lerp(0.0, 0.62, cp.peel), pale: 1, lock: mixHex(k.type, k.accent, 0.3), lockA: 0.7 });
    });
    // the envelope on its clip
    const h = this.hanging(env.s, env.lift, env.sw, 1);
    const top = add(h.ce, mul(h.up, EH / 2)), pv = this.pjv(h.pivot), tp = this.pjv(top);
    if (pv[2] > NEAR && tp[2] > NEAR) {
      c.beginPath(); c.moveTo(pv[0], pv[1]); c.lineTo(tp[0], tp[1]);
      c.strokeStyle = rgba(k.type, 0.5); c.lineWidth = Math.max(1, (0.025 * this.focal) / pv[2]); c.stroke();
      const cr = (0.07 * this.focal) / pv[2];
      c.beginPath(); c.roundRect(pv[0] - cr * 1.4, pv[1] - cr, cr * 2.8, cr * 2, cr * 0.5);
      c.fillStyle = mixHex(k.panel, k.type, 0.15); c.fill(); c.strokeStyle = rgba(k.accent, 0.6); c.lineWidth = 1; c.stroke();
    }
    const sp = prog(t, this.aStamp - 0.1, this.aStamp);
    this.card(c, k, h.ce, h.r, h.up, 1, {
      alpha: arrive(t, this.ctx.start, 0.2), pale: 0, lock: ls.col, lift: ls.lift,
      stamp: this.stampText ? { s: this.stampText, p: sp, hit: hit(t, this.aStamp, 0.06) } : undefined,
    });
  }

  private fxOne(t: number, ice: V3, green: V3, white: V3, env: { s: number; lift: number; sw: number }) {
    const fb = this.fx, h = this.hanging(env.s, env.lift, env.sw, 1);
    const at = (x: number, y: number): V3 => add(add(h.ce, mul(h.r, (x / LW - 0.5) * EW)), mul(h.up, (0.5 - y / LH) * EH));
    // the padlock's light once green, and its click ring
    const g = arrive(t, this.aClick, 0.08);
    if (g > 0) {
      const e = 1.2 + 2.5 * hit(t, this.aClick, 0.15);
      this.line(fb, at(LW / 2 - 2, 84), at(LW / 2 + 2, 84), 0.2, [green[0] * e, green[1] * e, green[2] * e], 0.35 * g, true);
      const rp = (t - this.aClick) / 0.8;
      if (rp > 0 && rp < 1) {
        const rad = lerp(18, 70, ease.outCubic(rp)), al = 0.9 * (1 - rp) ** 1.5;
        for (let i = 0; i < 40; i++) {
          const a0 = (i / 40) * Math.PI * 2, a1 = ((i + 1) / 40) * Math.PI * 2;
          this.line(fb, at(LW / 2 + rad * Math.cos(a0), 80 + rad * Math.sin(a0)), at(LW / 2 + rad * Math.cos(a1), 80 + rad * Math.sin(a1)), lerp(2.5, 1, rp), [green[0] * 2, green[1] * 2, green[2] * 2], al);
        }
      }
    }
    // the scan line sweeping the envelope's face as it slides under the tap
    const sc = prog(t, this.aRead - 0.45, this.aRead + 0.05);
    if (sc > 0 && sc < 1) {
      const y = lerp(4, LH - 4, ease.inOutQuad(sc)), e = 2.2;
      this.line(fb, at(0, y), at(LW, y), 1.8, [ice[0] * e, ice[1] * e, ice[2] * e], 0.9);
      const src = fib(0), b = add(src, [0, -PR * 0.9, 0]);
      this.line(fb, b, at(0, y), 1, ice, 0.25); this.line(fb, b, at(LW, y), 1, ice, 0.25);
    }
    // the copy: the tap's ray splitting down into the chute
    const ray = hit(t, this.aCopy, 0.3);
    if (ray > 0.01) {
      const e = 1.5 * ray;
      this.line(fb, fib(0), [0.15, FLOOR + 0.2, 0.1], 0.05, [ice[0] * e, ice[1] * e, ice[2] * e], 0.6, true);
    }
    // the landing: a ring of cold light on the floor
    const lp = (t - this.aIce) / 0.9;
    if (lp > 0 && lp < 1) {
      const rad = lerp(0.4, 2.2, ease.outCubic(lp)), al = 0.8 * (1 - lp) ** 2;
      for (let i = 0; i < 48; i++) {
        const a0 = (i / 48) * Math.PI * 2, a1 = ((i + 1) / 48) * Math.PI * 2;
        const p0: V3 = [clamp(rad * Math.cos(a0), -CW, CW), FLOOR + 0.01, clamp(rad * 0.7 * Math.sin(a0), -CD, CD)];
        const p1: V3 = [clamp(rad * Math.cos(a1), -CW, CW), FLOOR + 0.01, clamp(rad * 0.7 * Math.sin(a1), -CD, CD)];
        this.line(fb, p0, p1, 1.5, [white[0] * 2, white[1] * 2, white[2] * 2], al);
      }
    }
  }

  // ------------------------------------------------------------------ phase rekey

  private stream(t: number) {
    const hd = this.hopsDone(t), hl = this.hopLift(t), out: { j: number; s: number; lift: number; sw: number }[] = [];
    const j0 = Math.ceil((-22 - hd * RD) / RD), j1 = Math.floor((26 - hd * RD) / RD);
    for (let j = j0; j <= j1; j++) {
      const v = 0.8 + 0.4 * hash(j, 4);
      out.push({ j, s: (j + hd) * RD, lift: 0.16 * v * hl.l, sw: 0.1 * v * hl.sw });
    }
    return out.sort((a, b) => b.s - a.s);
  }
  /** When envelope j's padlock re-keys: a ripple running left to right from the anchor. */
  private rekeyAt(j: number) {
    const s = (j + this.hopsDone(this.aRekey)) * RD;
    return this.aRekey + 0.04 + 0.6 * clamp((s + 12) / 26);
  }
  /** The copies dropping: one per hop (the envelope then under the tap), falling into the pile. */
  private drops(t: number) {
    const out: { m: number; ce: V3; r: V3; up: V3; alpha: number }[] = [];
    this.beats.forEach((b, m) => {
      const t0 = b + this.hopDur, fall = t - t0;
      if (fall < 0 || fall > 1.4 || t0 > this.l13 - 1) return;
      const peel = ease.outCubic(clamp(fall / 0.25));
      const h0 = this.hanging(0, 0, 0, RS);
      const tf = Math.max(0, fall - 0.25), y = h0.ce[1] - 0.5 * peel - 0.5 * 9.8 * tf * tf;
      const land = PILE + 0.1;
      if (y < land - 0.02 && fall > 1.2) return;
      const yy = Math.max(land, y), landed = y <= land;
      const tip = Math.min(Math.PI / 2, tf * 3.2 + 0.05 * peel) * (0.85 + 0.15 * hash(m, 2));
      const up = add(mul(Y, Math.cos(tip)), mul(V, -Math.sin(tip)));
      const dx = (hash(m, 5) - 0.5) * 1.6 * clamp(tf * 2), dz = (hash(m, 6) - 0.5) * 0.8 * clamp(tf * 2);
      out.push({ m, ce: [h0.ce[0] + dx, yy, h0.ce[2] + dz - 0.1 * peel], r: U, up, alpha: 0.55 * peel * (landed ? clamp(1 - (fall - 1.0) / 0.2) : 1) });
    });
    return out;
  }

  private pictureRekey(c: CanvasRenderingContext2D, k: Look, t: number, frostK: number) {
    const frostCol = mixHex(k.type, k.accent, 0.3);
    this.drawChute(c, k, frostK, () => {
      for (const p of this.pile) {
        const r: V3 = [Math.cos(p.psi), 0, -Math.sin(p.psi)], up: V3 = [-Math.sin(p.psi), 0, -Math.cos(p.psi)];
        this.card(c, k, p.c, r, up, RS, { alpha: 0.7, pale: 1, lock: frostCol, lockA: 0.7 });
      }
      // the two old copies on top, turning face-up
      [[this.aFlip1, -0.82, 0.05, 'plan'], [this.aFlip2, 0.82, -0.05, 'cake']].forEach(([at, x, psi, d]) => {
        const ph = Math.PI * ease.outBack(clamp(prog(t, (at as number) - 0.3, (at as number) + 0.14)), 1.2);
        const r0: V3 = [Math.cos(psi as number), 0, -Math.sin(psi as number)], up0: V3 = [-Math.sin(psi as number), 0, -Math.cos(psi as number)];
        const r = add(mul(r0, Math.cos(ph)), mul(Y, Math.sin(ph)));
        const ce: V3 = [x as number, PILE + 0.02 + 0.35 * Math.sin(Math.min(Math.PI, ph)), 0.05];
        this.card(c, k, ce, r, up0, RS, { alpha: 0.85, pale: 1, lock: frostCol, lockA: 0.7, drawing: d as 'plan' | 'cake', reveal: arrive(t, (at as number) + 0.05, 0.4) });
      });
      for (const d of this.drops(t)) this.card(c, k, d.ce, d.r, d.up, RS, { alpha: d.alpha, pale: 1, lock: frostCol, lockA: 0.7 });
    });
    // the stream
    for (const e of this.stream(t)) {
      const h = this.hanging(e.s, e.lift, e.sw, RS);
      const top = add(h.ce, mul(h.up, (EH * RS) / 2)), pv = this.pjv(h.pivot), tp = this.pjv(top);
      if (pv[2] > NEAR && tp[2] > NEAR) {
        c.beginPath(); c.moveTo(pv[0], pv[1]); c.lineTo(tp[0], tp[1]);
        c.strokeStyle = rgba(k.type, 0.45); c.lineWidth = 1; c.stroke();
      }
      const ta = this.rekeyAt(e.j), fresh = arrive(t, ta, 0.06), flash = hit(t, ta, 0.12);
      const col = mixHex(mixHex(mixHex(k.accent2, k.dim, 0.6), k.accent2, fresh), '#ffffff', 0.5 * flash);
      this.card(c, k, h.ce, h.r, h.up, RS, { alpha: 1, pale: 0, lock: col, lift: fresh < 1 ? 3 * (1 - fresh) : 0 });
    }
    // tags under the copies that turned face-up
    if (this.tagText) {
      const mono = this.font('mono');
      for (const [at, x] of [[this.aFlip1, -0.82], [this.aFlip2, 0.82]] as const) {
        const s = this.tagText.slice(0, Math.round(this.tagText.length * prog(t, at + 0.15, at + 0.5)));
        if (!s) continue;
        const p = this.pj(x, PILE, 0.05 + (EH * RS) / 2 + 0.08);
        if (p[2] < NEAR) continue;
        const a = arrive(t, at + 0.15, 0.2);
        c.save(); c.globalAlpha = a;
        c.beginPath(); c.roundRect(p[0] - 128, p[1] + 2, 256, 46, 8); c.fillStyle = rgba(k.panel, 0.85); c.fill();
        c.strokeStyle = rgba(k.accent, 0.5); c.lineWidth = 1.2; c.stroke();
        text(c, s, p[0], p[1] + 34, mono, 28, k.accent, { align: 'center' });
        c.restore();
      }
    }
  }

  private fxRekey(t: number, ice: V3, green: V3, white: V3) {
    const fb = this.fx;
    // the ripple of re-keyed padlocks: a light and a ring on each as it clicks
    for (const e of this.stream(t)) {
      const ta = this.rekeyAt(e.j), fresh = arrive(t, ta, 0.06);
      if (fresh <= 0) continue;
      const h = this.hanging(e.s, e.lift, e.sw, RS);
      const at = (x: number, y: number): V3 => add(add(h.ce, mul(h.r, (x / LW - 0.5) * EW * RS)), mul(h.up, (0.5 - y / LH) * EH * RS));
      const ee = 1 + 3 * hit(t, ta, 0.12);
      this.line(fb, at(LW / 2 - 2, 84), at(LW / 2 + 2, 84), 0.12, [green[0] * ee, green[1] * ee, green[2] * ee], 0.4 * fresh, true);
      const rp = (t - ta) / 0.6;
      if (rp > 0 && rp < 1) {
        const rad = lerp(14, 60, ease.outCubic(rp)), al = 0.9 * (1 - rp) ** 1.5;
        for (let i = 0; i < 24; i++) {
          const a0 = (i / 24) * Math.PI * 2, a1 = ((i + 1) / 24) * Math.PI * 2;
          this.line(fb, at(LW / 2 + rad * Math.cos(a0), 80 + rad * Math.sin(a0)), at(LW / 2 + rad * Math.cos(a1), 80 + rad * Math.sin(a1)), 1.6, [green[0] * 2, green[1] * 2, green[2] * 2], al);
        }
      }
    }
    // each copy's ray from the tap
    this.beats.forEach((b) => {
      const ray = hit(t, b + this.hopDur, 0.18);
      if (ray > 0.02 && b + this.hopDur < this.l13 - 1) this.line(fb, fib(0), [0.1, PILE, 0.05], 0.035, [ice[0] * 1.3 * ray, ice[1] * 1.3 * ray, ice[2] * 1.3 * ray], 0.5, true);
    });
    // a cold glint across the face-up copies as they turn
    for (const [at, x] of [[this.aFlip1, -0.82], [this.aFlip2, 0.82]] as const) {
      const g = hit(t, at + 0.14, 0.15);
      if (g > 0.02) this.line(fb, [x - 0.7, PILE + 0.05, 0.05], [x + 0.7, PILE + 0.05, 0.05], 0.02, [white[0] * 2 * g, white[1] * 2 * g, white[2] * 2 * g], 0.6, true);
    }
  }
}

/** Convex hull (monotone chain) of screen points. */
function convexHull(pts: V3[]): V3[] {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o: V3, a: V3, b: V3) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: V3[] = [], up: V3[] = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2]!, lo[lo.length - 1]!, q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length >= 2 && cr(up[up.length - 2]!, up[up.length - 1]!, q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
