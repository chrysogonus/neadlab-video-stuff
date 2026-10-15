// Harvest Now, Decrypt Later (Banger Remix): the shared look of the remix's 3D scenes. A stage (three.js scene and
// camera into a multisampled HDR target whose alpha carries the view depth), finished by depth of field, light
// shafts from a light on screen (radial gather of the frame's highlights), frost on the lens and a grade; ice dust
// that hangs in the light; the two recurring props, the padlock and the envelope; the frost dendrites.
// Everything is a pure function of the time it is given.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { FSPass, makeRT, clearRT, W, H, SCALE } from '../engine/gl';
import { GLSL_COMMON } from '../engine/glsl/common';
import { clamp, ease, hexToLinear, lerp, mulberry32 } from '../engine/util';
import { F, font } from '../engine/type';
import type { Style } from '../engine/style';

export type V3 = [number, number, number];

/**
 * How much wider a camera's view gets for a letterboxed frame (style.aspect wider than 16:9): the picture band is
 * shorter than the frame, so lenses widen (by tan of the half angle) to keep subjects whole in it. Partly, not
 * fully: the scope frame crops a little tighter, as cinema does.
 */
export function fitOf(style: Style) {
  const a = style.aspect;
  if (!a || a <= W / H) return 1;
  const band = (W / a) / H;
  return 1 + (1 / band - 1) * 0.65;
}
/** A vertical field of view (degrees) widened by `fit`. */
export const fitFov = (fov: number, fit: number) => (2 * Math.atan(Math.tan((fov * Math.PI) / 360) * fit) * 180) / Math.PI;
export const mix3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
/** A hex colour as a linear THREE.Color (times k). */
export const lin = (hex: string, k = 1) => new THREE.Color().setRGB(...(hexToLinear(hex).map((x) => x * k) as V3), THREE.LinearSRGBColorSpace);
export const linV = (hex: string, k = 1) => new THREE.Vector3(...hexToLinear(hex).map((x) => x * k));

/** The remix's colours, by palette (style.json), with the fixed motif colours. */
export function colors(style: Style, name: string) {
  const p = style.palettes[name] ?? Object.values(style.palettes)[0]!;
  return {
    bg: p.bg!, type: p.type!, accent: p.accent!, accent2: p.accent2 ?? p.accent!, dim: p.dim ?? p.type!,
    deep: p.deep ?? p.accent!, wax: p.wax ?? '#B3122E', green: p.green ?? '#39E07A', ice: p.ice ?? '#8BE9FF', gold: p.gold ?? '#FFC15E',
  };
}

// ------------------------------------------------------------------ camera keys

export interface CamKey { t: number; c: V3; g: V3; fov?: number; ap?: number; e?: (x: number) => number }
/** Camera position, target, fov and aperture at t between keys (each key's ease shapes the move into it). */
export function camKeys(t: number, ks: CamKey[]) {
  let i = 0;
  while (i < ks.length - 2 && t >= ks[i + 1]!.t) i++;
  const a = ks[i]!, b = ks[i + 1] ?? a;
  const u = b === a ? 0 : (b.e ?? ease.inOutCubic)(clamp((t - a.t) / Math.max(1e-3, b.t - a.t)));
  return { c: mix3(a.c, b.c, u), g: mix3(a.g, b.g, u), fov: lerp(a.fov ?? 35, b.fov ?? 35, u), ap: lerp(a.ap ?? 20, b.ap ?? 20, u) };
}

// ------------------------------------------------------------------ materials

/**
 * Patch a three.js material to write its view depth into alpha (the stage's depth of field reads it), with an
 * optional rim light (uRim * uRimCol, by the fresnel term) and an extra emissive term.
 */
export function depthAlpha(m: THREE.Material, U: Record<string, THREE.IUniform> = {}, key = 'hrk', lit = true) {
  const u = { uRim: { value: 0 }, uRimCol: { value: new THREE.Color(1, 1, 1) }, uGlow: { value: new THREE.Color(0, 0, 0) }, ...U };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vDepthA;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvDepthA = -mvPosition.z;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vDepthA;\nuniform float uRim;\nuniform vec3 uRimCol, uGlow;')
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>
${lit ? 'float hrkFres = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 3.0);' : 'float hrkFres = 0.0;'}
gl_FragColor.rgb += uRimCol * uRim * (0.05 + 1.6 * hrkFres) + uGlow;
gl_FragColor.a = vDepthA;`);
  };
  m.customProgramCacheKey = () => `${key}-${lit ? 1 : 0}`;
  return u;
}

/** A light probe: a dark room of the given colour with bright panels (w, h, position, look-at, linear colour). */
export function envProbe(r: THREE.WebGLRenderer, room: THREE.Color, panels: { w: number; h: number; p: V3; at: V3; c: THREE.Color }[]) {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.BoxGeometry(40, 20, 40), new THREE.MeshBasicMaterial({ color: room, side: THREE.BackSide })));
  for (const q of panels) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(q.w, q.h), new THREE.MeshBasicMaterial({ color: q.c, side: THREE.DoubleSide }));
    m.position.set(...q.p); m.lookAt(...q.at); s.add(m);
  }
  const pm = new THREE.PMREMGenerator(r);
  const tex = pm.fromScene(s, 0.03).texture;
  pm.dispose();
  return tex;
}

// ------------------------------------------------------------------ the stage's passes

// depth of field: a gather by each pixel's circle of confusion (from the depth in alpha); nearer, sharper samples
// do not bleed onto what is behind them
const DOF_F = /* glsl */ `
uniform sampler2D tCol;
uniform float uFocus, uK, uMax;
const int N = 64;
float coc(float z) { return min(uMax, uK * abs(z - uFocus) / max(z, 0.05)); }
void main() {
  vec4 c0 = texture(tCol, vUv);
  vec2 tx = 1.0 / vec2(textureSize(tCol, 0));
  float zn = min(min(texture(tCol, vUv + vec2(tx.x, 0.0)).a, texture(tCol, vUv - vec2(tx.x, 0.0)).a),
                 min(texture(tCol, vUv + vec2(0.0, tx.y)).a, texture(tCol, vUv - vec2(0.0, tx.y)).a));
  float r0 = min(coc(c0.a), coc(min(zn, c0.a)));
  if (r0 < 0.5) { fragColor = vec4(c0.rgb, 1.0); return; }
  vec2 px = 1.0 / vec2(${W.toFixed(1)}, ${H.toFixed(1)});
  float rot = hash12(floor(FRAG_PX)) * 6.2832;
  vec3 acc = c0.rgb; float ws = 1.0;
  for (int i = 0; i < N; i++) {
    float fi = float(i) + 0.5;
    float rr = sqrt(fi / float(N)) * r0;
    float th = fi * 2.39996 + rot;
    vec4 s = texture(tCol, vUv + vec2(cos(th) * 0.62, sin(th)) * rr * px); // anamorphic: tall oval bokeh
    float rs = coc(s.a);
    float w = s.a >= c0.a - 0.05 ? 1.0 : clamp(rs - rr + 1.0, 0.0, 1.0);
    // bright out-of-focus highlights weigh a little more: round bokeh
    w *= 1.0 + 0.6 * smoothstep(1.2, 4.0, max(s.r, max(s.g, s.b)));
    acc += s.rgb * w; ws += w;
  }
  fragColor = vec4(acc / ws, 1.0);
}`;

// light shafts: a radial gather of the frame's highlights toward the light's position on screen, added on top
const RAYS_F = /* glsl */ `
uniform sampler2D tCol;
uniform vec2 uLight;     // uv
uniform float uAmt, uThr, uLen, uDecay, uRad;
uniform vec3 uTint;
const int N = 48;
const vec2 ASP = vec2(${(W / H).toFixed(4)}, 1.0);
void main() {
  vec2 d = (uLight - vUv) * uLen / float(N);
  float j = hash12(floor(FRAG_PX));
  vec2 uv = vUv + d * j;
  vec3 acc = vec3(0.0); float w = 1.0;
  for (int i = 0; i < N; i++) {
    vec3 c = min(texture(tCol, uv).rgb, vec3(3.0));
    float l = max(c.r, max(c.g, c.b));
    vec2 dl = (uv - uLight) * ASP;
    acc += c * (max(l - uThr, 0.0) / max(l, 1e-4)) * w * exp(-dot(dl, dl) / (uRad * uRad));
    w *= uDecay; uv += d;
  }
  fragColor = vec4(acc * uTint * uAmt / float(N), 1.0);
}`;

// frost on the lens: the dendrite texture, revealed from the frame's edges inward as uAmt grows, with a milky haze
const LENS_F = /* glsl */ `
uniform sampler2D tFrost;
uniform float uAmt, uTime;
uniform vec3 uCol;
void main() {
  vec2 p = (vUv - 0.5) * vec2(${(W / H).toFixed(4)}, 1.0);
  float edge = max(abs(p.x) / ${(W / H / 2).toFixed(4)}, abs(p.y) / 0.5);
  float corner = length(p) / ${Math.hypot(W / H / 2, 0.5).toFixed(4)};
  float e = max(edge * 0.8, corner);
  float n = fbm(vUv * vec2(5.0, 3.0) + 1.7, 3) * 0.18;
  float reach = 1.0 - uAmt;
  float m = smoothstep(reach - 0.02, reach + 0.14, e + n);
  float fr = texture(tFrost, vUv).r;
  vec3 c = uCol * (fr * 1.4 + 0.10 * smoothstep(reach + 0.05, reach + 0.4, e + n)) * m;
  fragColor = vec4(c, 1.0);
}`;

const SHARED = new Map<string, THREE.WebGLRenderTarget>();
/** A render target shared by every user of `key` (made on first use). */
export function shared(key: string, make: () => THREE.WebGLRenderTarget) {
  let rt = SHARED.get(key);
  if (!rt) { rt = make(); SHARED.set(key, rt); }
  return rt;
}


// volumetric light: spot beams and a depth haze in drifting fog, marched from the camera to the scene's depth (in
// the target's alpha), at half resolution; added onto the scene before the depth of field
const MAXB = 4;
const VOL_F = /* glsl */ `
uniform sampler2D tCol;
uniform mat4 uInvVP;
uniform vec3 uCamP, uCamF;
uniform int uN;
uniform vec3 uBP[${MAXB}], uBD[${MAXB}], uBC[${MAXB}];
uniform float uBA[${MAXB}], uBR[${MAXB}];
uniform float uDen, uNoise, uTime, uHaze, uMaxD, uDist;
uniform vec3 uHazeC, uDrift;
void main() {
  float zv = texture(tCol, vUv).a;
  vec4 w = uInvVP * vec4(vUv * 2.0 - 1.0, 1.0, 1.0);
  vec3 rd = normalize(w.xyz / w.w - uCamP);
  float tMax = min(uDist > 0.5 ? zv : zv / max(dot(rd, uCamF), 0.05), uMaxD);
  const int STEPS = 40;
  float dt = tMax / float(STEPS);
  float j = hash12(floor(FRAG_PX));
  vec3 acc = vec3(0.0);
  float trans = 1.0;
  for (int i = 0; i < STEPS; i++) {
    vec3 p = uCamP + rd * (dt * (float(i) + j));
    float n = 0.55 + uNoise * snoise(p * 0.7 + uDrift * uTime) + uNoise * 0.5 * snoise(p * 1.9 - uDrift * uTime * 1.7);
    float den = uDen * max(n, 0.0);
    vec3 li = uHazeC * uHaze;
    for (int b = 0; b < ${MAXB}; b++) {
      if (b >= uN) break;
      vec3 v = p - uBP[b];
      float d = length(v);
      float ca = dot(v / max(d, 1e-4), uBD[b]);
      float cone = smoothstep(cos(uBA[b]), cos(uBA[b] * 0.55), ca);
      float fall = 1.0 / (1.0 + d * d / (uBR[b] * uBR[b]));
      // forward scattering toward the camera: brighter looking into the beam
      float ph = 0.6 + 0.9 * pow(max(dot(-rd, -uBD[b]), 0.0), 4.0);
      li += uBC[b] * cone * fall * ph;
    }
    acc += li * den * trans * dt;
    trans *= exp(-den * dt * 0.15);
  }
  fragColor = vec4(acc, 1.0);
}`;

export interface Beam { p: V3; d: V3; angle: number; color: THREE.Color; range: number }
export interface Fog { density: number; noise?: number; haze?: number; hazeColor?: THREE.Color; drift?: V3; maxDist?: number }


/**
 * Volumetric light for any scene that draws into a target with its view depth (or, with `distance`, its distance
 * from the camera) in alpha: spot beams and haze in drifting fog, marched at half resolution and added back onto
 * the target before its depth of field.
 */
export class VolumeLight {
  beams: Beam[] = [];
  fog: Fog | null = null;
  time = 0;
  private volRT = shared('vol', () => makeRT(W / 2, H / 2, { depthBuffer: false }));
  private vol = new FSPass(VOL_F, {
    tCol: { value: null }, uInvVP: { value: new THREE.Matrix4() }, uCamP: { value: new THREE.Vector3() }, uCamF: { value: new THREE.Vector3() },
    uN: { value: 0 }, uBP: { value: Array.from({ length: MAXB }, () => new THREE.Vector3()) }, uBD: { value: Array.from({ length: MAXB }, () => new THREE.Vector3()) },
    uBC: { value: Array.from({ length: MAXB }, () => new THREE.Color()) }, uBA: { value: new Array(MAXB).fill(0.3) }, uBR: { value: new Array(MAXB).fill(5) },
    uDen: { value: 0.05 }, uNoise: { value: 0.5 }, uTime: { value: 0 }, uHaze: { value: 0 }, uMaxD: { value: 60 }, uDist: { value: 0 },
    uHazeC: { value: new THREE.Color() }, uDrift: { value: new THREE.Vector3(0.05, 0.02, 0.03) },
  });
  private add = new FSPass(`uniform sampler2D tex; void main() { fragColor = vec4(texture(tex, vUv).rgb, 0.0); }`, { tex: { value: null } }, { blending: THREE.CustomBlending, transparent: true });

  constructor() {
    const m = this.add.mat;
    m.blendEquation = THREE.AddEquation; m.blendSrc = THREE.OneFactor; m.blendDst = THREE.OneFactor;
    m.blendSrcAlpha = THREE.ZeroFactor; m.blendDstAlpha = THREE.OneFactor;
  }

  render(r: THREE.WebGLRenderer, rt: THREE.WebGLRenderTarget, cam: THREE.PerspectiveCamera, distance = false) {
    if (!this.fog || this.fog.density <= 0) return;
    const u = this.vol.u, f = this.fog;
    (u.uInvVP!.value as THREE.Matrix4).multiplyMatrices(cam.matrixWorld, cam.projectionMatrixInverse);
    (u.uCamP!.value as THREE.Vector3).copy(cam.position);
    cam.getWorldDirection(u.uCamF!.value as THREE.Vector3);
    const n = Math.min(MAXB, this.beams.length);
    u.uN!.value = n;
    for (let i = 0; i < n; i++) {
      const b = this.beams[i]!;
      (u.uBP!.value as THREE.Vector3[])[i]!.set(...b.p);
      (u.uBD!.value as THREE.Vector3[])[i]!.set(...b.d).normalize();
      (u.uBC!.value as THREE.Color[])[i]!.copy(b.color);
      (u.uBA!.value as number[])[i] = b.angle;
      (u.uBR!.value as number[])[i] = b.range;
    }
    u.uDen!.value = f.density; u.uNoise!.value = f.noise ?? 0.5; u.uHaze!.value = f.haze ?? 0;
    (u.uHazeC!.value as THREE.Color).copy(f.hazeColor ?? new THREE.Color(0, 0, 0));
    (u.uDrift!.value as THREE.Vector3).set(...(f.drift ?? [0.05, 0.02, 0.03]));
    u.uMaxD!.value = f.maxDist ?? 60;
    u.uDist!.value = distance ? 1 : 0;
    u.uTime!.value = this.time;
    u.tCol!.value = rt.texture;
    this.vol.render(r, this.volRT);
    this.add.u.tex!.value = this.volRT.texture;
    this.add.render(r, rt);
  }
}

export interface FinishOpts {
  /** Light shafts from a light at uv on screen. */
  rays?: { uv: [number, number]; amt: number; thr?: number; len?: number; decay?: number; rad?: number; tint?: THREE.Color };
  /** Frost on the lens, 0 (clear) to 1 (to the centre); kept faint (a clean frame) unless it is the motif itself. */
  lens?: number; lensCol?: THREE.Color; lensMotif?: boolean;
}

/** The finishing passes on a finished picture: copy into out, then light shafts and lens frost added on top. */
export class Finisher {
  private copy = new FSPass(`uniform sampler2D tex; void main() { fragColor = vec4(texture(tex, vUv).rgb, 1.0); }`, { tex: { value: null } });
  private rays = new FSPass(RAYS_F, {
    tCol: { value: null }, uLight: { value: new THREE.Vector2(0.5, 0.8) }, uAmt: { value: 0 }, uThr: { value: 1 }, uLen: { value: 0.6 },
    uDecay: { value: 0.96 }, uRad: { value: 0.3 }, uTint: { value: new THREE.Color(1, 1, 1) },
  }, { blending: THREE.AdditiveBlending, transparent: true });
  private lens = new FSPass(LENS_F, { tFrost: { value: null }, uAmt: { value: 0 }, uTime: { value: 0 }, uCol: { value: new THREE.Color(1, 1, 1) } },
    { blending: THREE.AdditiveBlending, transparent: true });
  private frostTex: THREE.CanvasTexture | null = null;

  /** `src` (if given) is copied into out first; the shafts gather from `shaftsFrom` (default src). */
  apply(r: THREE.WebGLRenderer, src: THREE.Texture | null, out: THREE.WebGLRenderTarget, o: FinishOpts, shaftsFrom?: THREE.Texture) {
    if (src) { this.copy.u.tex!.value = src; this.copy.render(r, out); }
    const from = shaftsFrom ?? src;
    if (o.rays && o.rays.amt > 0.001 && from) {
      const u = this.rays.u;
      u.tCol!.value = from;
      (u.uLight!.value as THREE.Vector2).set(...o.rays.uv);
      u.uAmt!.value = o.rays.amt;
      u.uThr!.value = o.rays.thr ?? 1;
      u.uLen!.value = o.rays.len ?? 0.6;
      u.uDecay!.value = o.rays.decay ?? 0.965;
      u.uRad!.value = o.rays.rad ?? 0.3;
      (u.uTint!.value as THREE.Color).copy(o.rays.tint ?? new THREE.Color(1, 1, 1));
      this.rays.render(r, out);
    }
    if (o.lens && o.lens > 0.001) {
      if (!this.frostTex) this.frostTex = lensFrostTexture(77);
      this.lens.u.tFrost!.value = this.frostTex;
      this.lens.u.uAmt!.value = o.lensMotif ? o.lens : o.lens * 0.5;
      (this.lens.u.uCol!.value as THREE.Color).copy(o.lensCol ?? new THREE.Color(0.6, 0.85, 1));
      this.lens.render(r, out);
    }
  }
}

export interface StageDraw extends FinishOpts {
  /** Focus distance (world units) and aperture (circle of confusion gain; 0 = all sharp). */
  focus: number; ap: number;
  /** Linear background colour the target is cleared to before the scene. */
  clear?: V3;
}

/** A three.js scene and camera drawn into a depth-carrying target, then finished into `out`. */
export class Stage {
  scene = new THREE.Scene();
  cam: THREE.PerspectiveCamera;
  // shared by every stage: scenes draw one at a time and the remix cuts hard, so one set of targets serves all
  // (a set per shot runs the GPU out of memory over a whole song)
  rt = shared('stage', () => makeRT(W, H, { samples: 4 }));
  private sharp = shared('sharp', () => makeRT(W, H, { depthBuffer: false }));
  private dof = new FSPass(DOF_F, { tCol: { value: null }, uFocus: { value: 5 }, uK: { value: 20 }, uMax: { value: 18 } });
  private fin = new Finisher();
  /** Spot beams and fog for the volumetric light (none: no volume pass). */
  private vl = new VolumeLight();
  get beams() { return this.vl.beams; }
  set beams(b: Beam[]) { this.vl.beams = b; }
  get fog() { return this.vl.fog; }
  set fog(f: Fog | null) { this.vl.fog = f; }
  get time() { return this.vl.time; }
  set time(t: number) { this.vl.time = t; }

  constructor(fov = 35, near = 0.03, far = 400) {
    this.cam = new THREE.PerspectiveCamera(fov, W / H, near, far);
  }


  /** Lens widening for a letterboxed frame (see fitOf). */
  fit = 1;

  /** Point the camera (position, target, fov; widened by `fit`). */
  look(c: V3, g: V3, fov: number) {
    this.cam.fov = fitFov(fov, this.fit);
    this.cam.position.set(...c);
    this.cam.lookAt(...g);
    this.cam.updateProjectionMatrix();
    this.cam.updateMatrixWorld(true);
    return Math.hypot(g[0] - c[0], g[1] - c[1], g[2] - c[2]);
  }

  /** Where a world point lands on screen (uv, 0..1, y up). */
  uv(p: V3): [number, number] {
    const v = new THREE.Vector3(...p).project(this.cam);
    return [v.x * 0.5 + 0.5, v.y * 0.5 + 0.5];
  }

  /** Render the scene into the depth-carrying target (cleared to `clear`, depth 1000). Extra draws may follow. */
  begin(r: THREE.WebGLRenderer, clear: V3 = [0, 0, 0]) {
    clearRT(r, this.rt, clear, 1000);
    r.setRenderTarget(this.rt);
    r.render(this.scene, this.cam);
    this.vl.render(r, this.rt, this.cam);
  }

  /** Depth of field, shafts and lens frost into out. */
  finish(r: THREE.WebGLRenderer, out: THREE.WebGLRenderTarget, o: StageDraw) {
    const rays = !!o.rays && o.rays.amt > 0.001;
    this.dof.u.tCol!.value = this.rt.texture;
    this.dof.u.uFocus!.value = o.focus;
    this.dof.u.uK!.value = o.ap;
    this.dof.render(r, rays ? this.sharp : out);
    this.fin.apply(r, rays ? this.sharp.texture : null, out, o, rays ? this.sharp.texture : undefined);
  }

  render(r: THREE.WebGLRenderer, out: THREE.WebGLRenderTarget, o: StageDraw) {
    this.begin(r, o.clear);
    this.finish(r, out, o);
  }
}

// ------------------------------------------------------------------ the backdrop

const BACK_V = /* glsl */ `
precision highp float;
in vec3 position;
out vec2 vUv;
void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 1.0, 1.0); }`;
const BACK_F = /* glsl */ `
precision highp float;
precision highp int;
in vec2 vUv;
out vec4 fragColor;
${GLSL_COMMON}
uniform vec3 uTop, uBot, uGlowC;
uniform vec2 uGlowP;
uniform float uGlow, uGlowR, uTime;
void main() {
  vec3 c = mix(uBot, uTop, smoothstep(0.0, 1.0, vUv.y));
  vec2 d = (vUv - uGlowP) * vec2(${(W / H).toFixed(4)}, 1.0);
  c += uGlowC * uGlow * exp(-dot(d, d) / (uGlowR * uGlowR)) * (0.9 + 0.2 * fbm(vec3(d * 3.0, uTime * 0.07), 3));
  fragColor = vec4(c, 1000.0);
}`;
/** A full-frame gradient with a soft glow, drawn first behind everything (depth: far). */
export function backdrop() {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const mat = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3, vertexShader: BACK_V, fragmentShader: BACK_F, depthTest: false, depthWrite: false,
    uniforms: {
      uTop: { value: new THREE.Color() }, uBot: { value: new THREE.Color() }, uGlowC: { value: new THREE.Color() },
      uGlowP: { value: new THREE.Vector2(0.5, 0.6) }, uGlow: { value: 0 }, uGlowR: { value: 0.5 }, uTime: { value: 0 },
    },
  });
  const m = new THREE.Mesh(geo, mat);
  m.frustumCulled = false; m.renderOrder = -100;
  return { mesh: m, u: mat.uniforms };
}

// ------------------------------------------------------------------ ice dust

const DUST_V = /* glsl */ `
precision highp float;
in vec3 position;
in vec4 seed;
uniform mat4 modelViewMatrix, projectionMatrix;
uniform float uTime, uSize, uPx;
uniform vec3 uBox, uDrift;
out float vTw; out float vDepth;
void main() {
  // each mote drifts and wraps inside the box, swaying a little
  vec3 p = position + uDrift * uTime * (0.6 + 0.8 * seed.x);
  p += vec3(sin(uTime * 0.7 + seed.y * 40.0), sin(uTime * 0.5 + seed.z * 30.0), cos(uTime * 0.6 + seed.x * 20.0)) * 0.03;
  p = mod(p + uBox * 0.5, uBox) - uBox * 0.5;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  vDepth = -mv.z;
  vTw = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * (2.0 + 4.0 * seed.w) + seed.y * 60.0), 6.0);
  gl_PointSize = uSize * uPx * (0.5 + seed.z) / max(vDepth, 0.1);
}`;
const DUST_F = /* glsl */ `
precision highp float;
in float vTw; in float vDepth;
uniform vec3 uCol;
uniform float uAmt, uNear;
out vec4 fragColor;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r = dot(q, q);
  if (r > 1.0) discard;
  float a = exp(-r * 4.0) * vTw * uAmt * smoothstep(uNear, uNear * 3.0, vDepth);
  fragColor = vec4(uCol * a, 0.0);
}`;
/** Ice dust: n motes in a box (centred on the group's origin) that drift, wrap and twinkle; additive, keeps the depth. */
export function dust(n: number, box: V3, seed = 1) {
  const rnd = mulberry32(seed);
  const pos = new Float32Array(n * 3), sd = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < 3; k++) pos[i * 3 + k] = (rnd() - 0.5) * box[k]!;
    for (let k = 0; k < 4; k++) sd[i * 4 + k] = rnd();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('seed', new THREE.BufferAttribute(sd, 4));
  const mat = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3, vertexShader: DUST_V, fragmentShader: DUST_F, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    uniforms: {
      uTime: { value: 0 }, uSize: { value: 6 }, uPx: { value: SCALE }, uBox: { value: new THREE.Vector3(...box) },
      uDrift: { value: new THREE.Vector3(0.02, -0.03, 0.01) }, uCol: { value: new THREE.Color(1, 1, 1) }, uAmt: { value: 1 }, uNear: { value: 0.15 },
    },
  });
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false;
  pts.renderOrder = 50;
  return { pts, u: mat.uniforms };
}

// ------------------------------------------------------------------ frost dendrites (Canvas2D)

/** Branching crystals: a stem from (x, y) at angle a, side branches alternating, recursing to `lvl` 0. */
export function dendrite(c: CanvasRenderingContext2D, rnd: () => number, x: number, y: number, a: number, len: number, lvl: number, lw: number) {
  const st = 4;
  const n = Math.max(1, Math.round(len / st));
  let next = 10 + rnd() * 14, alt = rnd() < 0.5 ? 1 : -1;
  c.lineWidth = lw;
  c.beginPath(); c.moveTo(x, y);
  const kids: [number, number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    a += (rnd() - 0.5) * 0.16;
    x += Math.cos(a) * st; y += Math.sin(a) * st;
    c.lineTo(x, y);
    if (lvl > 0 && (i * st) > next) {
      next += 9 + rnd() * 16;
      kids.push([x, y, a + alt * (0.75 + rnd() * 0.5), (len - i * st) * (0.3 + rnd() * 0.35)]);
      alt = -alt;
    }
  }
  c.stroke();
  for (const [kx, ky, ka, kl] of kids) dendrite(c, rnd, kx, ky, ka, kl, lvl - 1, lw * 0.7);
}

/** The lens frost: dendrites grown inward from the frame's edges and corners (white on black, 1/2 res). */
export function lensFrostTexture(seed: number) {
  const w = W / 2, h = H / 2;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d')!;
  c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
  c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineCap = 'round';
  const rnd = mulberry32(seed);
  for (let i = 0; i < 90; i++) {
    const side = Math.floor(rnd() * 4), u = rnd();
    const [x, y, a] = side === 0 ? [u * w, 0, Math.PI / 2] : side === 1 ? [u * w, h, -Math.PI / 2] : side === 2 ? [0, u * h, 0] : [w, u * h, Math.PI];
    dendrite(c, rnd, x, y, a + (rnd() - 0.5) * 1.2, 40 + rnd() * 160, 3, 1.1);
  }
  for (const [x, y, a] of [[0, 0, 0.6], [w, 0, Math.PI - 0.6], [0, h, -0.6], [w, h, Math.PI + 0.6]] as [number, number, number][])
    for (let i = 0; i < 6; i++) dendrite(c, rnd, x, y, a + (rnd() - 0.5) * 1.0, 120 + rnd() * 160, 3, 1.4);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.NoColorSpace;
  tex.flipY = true;
  return tex;
}

// ------------------------------------------------------------------ the padlock

export interface Padlock {
  g: THREE.Group;
  body: THREE.Mesh;
  /** The shackle's pivot (rotate y to swing it open, raise y to pop it). */
  shackle: THREE.Group;
  /** Body height; the lock is centred on its body, the shackle above. */
  h: number;
}
/** A padlock of body width w: a rounded body with a keyhole, a shackle that can pop and swing on its left leg. */
export function padlock(w: number, bodyMat: THREE.Material, shackleMat: THREE.Material, holeMat?: THREE.Material): Padlock {
  const g = new THREE.Group();
  const bw = w, bh = w * 0.8, bd = w * 0.36;
  const body = new THREE.Mesh(new RoundedBoxGeometry(bw, bh, bd, 4, w * 0.09), bodyMat);
  g.add(body);
  if (holeMat) {
    const hole = new THREE.Group();
    const top = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.075, w * 0.075, w * 0.02, 24), holeMat);
    top.rotation.x = Math.PI / 2; top.position.set(0, w * 0.04, bd / 2 + w * 0.002);
    const slot = new THREE.Mesh(new THREE.BoxGeometry(w * 0.05, w * 0.16, w * 0.02), holeMat);
    slot.position.set(0, -w * 0.05, bd / 2 + w * 0.002);
    hole.add(top, slot);
    g.add(hole);
  }
  // the shackle: a half torus on two legs; it pivots about its left leg
  const R = w * 0.3, th = w * 0.065, leg = w * 0.32;
  const shackle = new THREE.Group();
  const arc = new THREE.Mesh(new THREE.TorusGeometry(R, th, 16, 48, Math.PI), shackleMat);
  arc.position.set(R, leg, 0);
  const legGeo = new THREE.CylinderGeometry(th, th, leg, 16);
  const l1 = new THREE.Mesh(legGeo, shackleMat); l1.position.set(0, leg / 2, 0);
  const l2 = new THREE.Mesh(legGeo, shackleMat); l2.position.set(2 * R, leg / 2, 0);
  shackle.add(arc, l1, l2);
  shackle.position.set(-R, bh / 2 - leg * 0.75, 0);
  g.add(shackle);
  return { g, body, shackle, h: bh };
}

// ------------------------------------------------------------------ the envelope

/**
 * The envelope's face (the back, with the flap's edges, a postmark and a stamp) as a canvas texture: cream paper
 * with fibres, the date on the postmark. `w` px wide, aspect 1.6.
 */
export function envelopeTexture(date: string, opts: { w?: number; paper?: string; ink?: string; seed?: number; postmark?: boolean; folds?: boolean; seal?: string; sender?: string[] } = {}) {
  const w = opts.w ?? 1024, h = Math.round(w / 1.6);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d')!;
  const paper = opts.paper ?? '#F3E9D6', ink = opts.ink ?? '#2B3A55';
  c.fillStyle = paper; c.fillRect(0, 0, w, h);
  const rnd = mulberry32(opts.seed ?? 5);
  // fibres and mottling
  for (let i = 0; i < 2200; i++) {
    const x = rnd() * w, y = rnd() * h, l = 2 + rnd() * 10, a = rnd() * Math.PI;
    c.strokeStyle = rnd() < 0.5 ? 'rgba(120,90,50,0.06)' : 'rgba(255,255,255,0.12)';
    c.lineWidth = 0.6 + rnd();
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke();
  }
  const vg = c.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, w * 0.7);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(90,60,30,0.16)');
  c.fillStyle = vg; c.fillRect(0, 0, w, h);
  // the back's folds: the flap's V and the side flaps
  if (opts.folds !== false) {
  c.strokeStyle = 'rgba(80,60,40,0.28)'; c.lineWidth = w * 0.003;
  c.beginPath(); c.moveTo(0, 0); c.lineTo(w / 2, h * 0.58); c.lineTo(w, 0); c.stroke();
  c.strokeStyle = 'rgba(80,60,40,0.16)';
  c.beginPath(); c.moveTo(0, h); c.lineTo(w * 0.42, h * 0.5); c.moveTo(w, h); c.lineTo(w * 0.58, h * 0.5); c.stroke();
  // the flap's shadow
  const fg = c.createLinearGradient(0, h * 0.5, 0, h * 0.62);
  fg.addColorStop(0, 'rgba(60,40,20,0.10)'); fg.addColorStop(1, 'rgba(60,40,20,0)');
  c.fillStyle = fg;
  c.beginPath(); c.moveTo(w * 0.1, h * 0.12); c.lineTo(w / 2, h * 0.58); c.lineTo(w * 0.9, h * 0.12); c.lineTo(w * 0.9, h * 0.2); c.lineTo(w / 2, h * 0.66); c.lineTo(w * 0.1, h * 0.2); c.fill();
  }
  if (opts.postmark !== false) postmark(c, w * 0.8, h * 0.2, h * 0.13, date, ink, h);
  if (opts.sender) {
    // the sender's address, by hand, on the back below the flap
    c.save(); c.translate(w * 0.08, h * 0.84); c.rotate(-0.02);
    c.fillStyle = ink; c.font = font(F.hand(), h * 0.055); c.textAlign = 'left';
    opts.sender.forEach((l, i) => c.fillText(l, 0, i * h * 0.065));
    c.restore();
  }
  if (opts.seal) {
    const sg = c.createRadialGradient(w / 2 - h * 0.03, h * 0.56, 0, w / 2, h * 0.58, h * 0.11);
    sg.addColorStop(0, '#FF6A6A'); sg.addColorStop(0.5, opts.seal); sg.addColorStop(1, '#5A0812');
    c.fillStyle = sg;
    c.beginPath(); c.arc(w / 2, h * 0.58, h * 0.1, 0, Math.PI * 2); c.fill();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** A postmark: two rings, the date, wavy cancellation lines to its left. */
function postmark(c: CanvasRenderingContext2D, px: number, py: number, pr: number, date: string, ink: string, h: number) {
  c.strokeStyle = ink; c.globalAlpha = 0.85; c.lineWidth = h * 0.0065;
  c.beginPath(); c.arc(px, py, pr, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.arc(px, py, pr * 0.72, 0, Math.PI * 2); c.stroke();
  c.fillStyle = ink;
  c.font = font(F.mono(500), h * 0.05); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(date, px, py);
  c.font = font(F.mono(500), h * 0.032);
  c.fillText('· ENCRYPTED ·', px, py - pr * 0.86 + h * 0.03);
  for (let i = 0; i < 4; i++) {
    c.beginPath();
    for (let x = px - pr * 3.2; x < px - pr * 1.05; x += 4) c.lineTo(x, py - pr * 0.45 + i * pr * 0.3 + Math.sin(x * 0.05) * h * 0.012);
    c.stroke();
  }
  c.globalAlpha = 1;
}

/** A postmark alone on a transparent square (for a decal that lands on its own). */
export function postmarkTexture(date: string, ink = '#2B3A55') {
  const n = 512, cv = document.createElement('canvas'); cv.width = n * 2; cv.height = n;
  const c = cv.getContext('2d')!;
  postmark(c, n * 1.45, n / 2, n * 0.36, date, ink, n * 0.85);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** The Tuesday letter's words (fiction: no real person's data). */
export const LETTER = {
  greeting: 'My love,',
  body: [
    'I am writing this the old way, because some things should be sealed by hand. The little green padlock says no one else will ever read it, and tonight I choose to believe it.',
    'I keep thinking of the station in the rain, the umbrella that gave up, and how you laughed anyway. I have never been so happy to be soaked.',
    'Whatever happens, wherever this finds you, I meant every word. Keep it somewhere safe.',
  ],
  closing: 'Always yours,',
  sign: 'A.',
};
/** Other people's harvested notes (fiction), for the pages that unfold across the archive. */
export const NOTES = [
  { date: '14 Feb 2019', greeting: 'Dear Sam,', body: ['The keys are under the blue pot. Water the basil, ignore the cat. Back on Sunday, I promise.'], closing: 'x', sign: 'J.' },
  { date: '2 Nov 2020', greeting: 'Mum,', body: ['The results came back fine. Please stop worrying about me and start worrying about the garden.'], closing: 'Love,', sign: 'Ellie' },
  { date: '30 Jun 2022', greeting: 'R.,', body: ['The board votes on Friday. Keep this between us until the announcement. Shred after reading.'], closing: '', sign: 'M.' },
];

/**
 * Handwriting: paragraphs in Caveat, word-wrapped to maxW from (x, y) with line height lh; each word sits a little
 * off the line and the ink varies. Returns the y after the last line.
 */
export function handwrite(c: CanvasRenderingContext2D, paras: string[], x: number, y: number, maxW: number, size: number, lh: number, ink: string, seed: number, indent = 0) {
  const rnd = mulberry32(seed);
  c.save();
  c.font = font(F.hand(), size); c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = ink;
  const space = c.measureText(' ').width;
  for (const para of paras) {
    let cx = x + indent;
    for (const word of para.split(' ')) {
      const ww = c.measureText(word).width;
      if (cx + ww > x + maxW && cx > x) { cx = x; y += lh; }
      c.save();
      c.translate(cx, y + (rnd() - 0.5) * size * 0.06);
      c.rotate((rnd() - 0.5) * 0.03);
      c.globalAlpha = 0.82 + rnd() * 0.18;
      c.fillText(word, 0, 0);
      c.restore();
      cx += ww + space * (0.9 + rnd() * 0.3);
    }
    y += lh * 1.35;
  }
  c.restore();
  return y;
}

/**
 * A handwritten letter on a w x h page (in the page's own pixels): a date at the top right, a greeting, paragraphs,
 * a closing and a signature, on faint rules (the text sits on them).
 */
export function drawLetter(c: CanvasRenderingContext2D, w: number, h: number, o: { date: string; greeting: string; body: string[]; closing: string; sign: string; ink: string; seed: number; size?: number }) {
  const size = o.size ?? w * 0.052, lh = size * 1.18, m = w * 0.085;
  c.save();
  c.strokeStyle = 'rgba(70,110,170,0.13)'; c.lineWidth = Math.max(1, w * 0.0015);
  for (let yy = h * 0.2; yy < h * 0.95; yy += lh) { c.beginPath(); c.moveTo(m * 0.8, yy + 2); c.lineTo(w - m * 0.8, yy + 2); c.stroke(); }
  c.restore();
  c.save();
  c.font = font(F.hand(), size * 0.95); c.fillStyle = o.ink; c.textAlign = 'right';
  c.fillText(o.date, w - m, h * 0.11);
  c.restore();
  let y = h * 0.2;
  y = handwrite(c, [o.greeting], m, y, w - 2 * m, size, lh, o.ink, o.seed);
  y = handwrite(c, o.body, m, y, w - 2 * m, size, lh, o.ink, o.seed + 1, size * 1.2);
  if (o.closing) y = handwrite(c, [o.closing], w * 0.5, y, w * 0.45, size, lh, o.ink, o.seed + 2) - lh * 0.35;
  handwrite(c, [o.sign], w * 0.56, y, w * 0.4, size * 1.25, lh, o.ink, o.seed + 3);
}

/** The letter: cream paper with fibres, the Tuesday letter handwritten in blue-black ink. */
export function letterTexture(date: string, opts: { w?: number; seed?: number; ink?: string } = {}) {
  const w = opts.w ?? 1024, h = Math.round(w * 1.3);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d')!;
  c.fillStyle = '#F6EEDD'; c.fillRect(0, 0, w, h);
  const rnd = mulberry32(opts.seed ?? 11);
  for (let i = 0; i < 2600; i++) {
    const x = rnd() * w, y = rnd() * h, l = 2 + rnd() * 9, a = rnd() * Math.PI;
    c.strokeStyle = rnd() < 0.5 ? 'rgba(120,90,50,0.05)' : 'rgba(255,255,255,0.1)';
    c.lineWidth = 0.6 + rnd();
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke();
  }
  const vg = c.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(110,80,40,0.12)');
  c.fillStyle = vg; c.fillRect(0, 0, w, h);
  drawLetter(c, w, h, { date, ...LETTER, ink: opts.ink ?? '#22324F', seed: opts.seed ?? 11 });
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** A round bump map of a seal's impression: a raised rim and a padlock sigil in the middle (white = high). */
export function sealBump(n = 512) {
  const cv = document.createElement('canvas'); cv.width = n; cv.height = n;
  const c = cv.getContext('2d')!;
  const g = c.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
  g.addColorStop(0, '#606060'); g.addColorStop(0.72, '#5a5a5a'); g.addColorStop(0.8, '#d0d0d0'); g.addColorStop(0.9, '#909090'); g.addColorStop(1, '#202020');
  c.fillStyle = g; c.fillRect(0, 0, n, n);
  c.filter = 'blur(3px)';
  c.fillStyle = '#2a2a2a';
  c.beginPath(); c.arc(n / 2, n / 2, n * 0.33, 0, Math.PI * 2); c.fill();
  // the padlock: body and shackle raised
  c.fillStyle = '#e8e8e8'; c.strokeStyle = '#e8e8e8';
  c.beginPath(); c.roundRect(n * 0.37, n * 0.47, n * 0.26, n * 0.2, n * 0.03); c.fill();
  c.lineWidth = n * 0.035;
  c.beginPath(); c.arc(n / 2, n * 0.47, n * 0.08, Math.PI, 0); c.stroke();
  c.fillStyle = '#2a2a2a';
  c.beginPath(); c.arc(n / 2, n * 0.545, n * 0.022, 0, Math.PI * 2); c.fill();
  c.fillRect(n * 0.49, n * 0.55, n * 0.02, n * 0.06);
  // a ring of small beads
  c.fillStyle = '#c0c0c0';
  for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2; c.beginPath(); c.arc(n / 2 + Math.cos(a) * n * 0.39, n / 2 + Math.sin(a) * n * 0.39, n * 0.012, 0, Math.PI * 2); c.fill(); }
  c.filter = 'none';
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

/** Wood: grain along x in the given colour, darker late-wood lines and paler streaks; repeats rx by ry. */
export function woodTexture(base: string, rx = 1, ry = 1, seed = 77) {
  const cv = document.createElement('canvas'); cv.width = 2048; cv.height = 1024;
  const c = cv.getContext('2d')!;
  c.fillStyle = base; c.fillRect(0, 0, 2048, 1024);
  const rnd = mulberry32(seed);
  for (let i = 0; i < 520; i++) {
    const y = rnd() * 1024, a = 0.04 + rnd() * 0.1, dark = rnd() < 0.6;
    c.strokeStyle = dark ? `rgba(30,18,8,${a})` : `rgba(255,220,170,${a * 0.5})`; c.lineWidth = 1 + rnd() * 3;
    c.beginPath();
    for (let x = 0; x <= 2048; x += 32) c.lineTo(x, y + Math.sin(x * 0.004 + i) * 6 + Math.sin(x * 0.013 + i * 0.3) * 2);
    c.stroke();
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
  return t;
}

/** A paper material (cream, slightly translucent-looking sheen), writing depth to alpha. */
export function paperMaterial(map: THREE.Texture | null, color = 0xffffff) {
  const m = new THREE.MeshPhysicalMaterial({ color, map, roughness: 0.82, metalness: 0, sheen: 0.4, sheenRoughness: 0.6, sheenColor: new THREE.Color(1, 0.95, 0.85), envMapIntensity: 0.7 });
  return m;
}

// ------------------------------------------------------------------ the key

/** The key's outline (x right, y up, metres): a ring bow, a shaft, a bit with teeth. */
export function keyShape() {
  const s = new THREE.Shape();
  const R = 0.11, w = 0.026, L = 0.42;
  // the bow: a ring at the top
  s.absarc(0, 0, R, 0, Math.PI * 2, false);
  const hole = new THREE.Path(); hole.absarc(0, 0, R * 0.55, 0, Math.PI * 2, true);
  s.holes.push(hole);
  const shaft = new THREE.Shape();
  shaft.moveTo(-w, -R * 0.9); shaft.lineTo(w, -R * 0.9); shaft.lineTo(w, -R - L + 0.13);
  // the bit: teeth along the right side
  const teeth = [0.05, 0.03, 0.065, 0.04];
  let y = -R - L + 0.13;
  for (const d of teeth) { shaft.lineTo(w + d, y); y -= 0.028; shaft.lineTo(w + d, y); shaft.lineTo(w, y); y -= 0.006; }
  shaft.lineTo(w, -R - L); shaft.lineTo(-w, -R - L); shaft.lineTo(-w, -R * 0.9);
  return [s, shaft];
}
