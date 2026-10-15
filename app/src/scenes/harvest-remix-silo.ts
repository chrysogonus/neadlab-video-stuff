// Harvest Now, Decrypt Later (Banger Remix): the silo. The archive as a vast round shaft sunk into the cold: its
// wall is drawers from rim to fog, thousands of frosted fronts with a gold lamp each, ringed every few rows by a
// walkway and its strip light; far below, a gold glow in blue fog. Sealed envelopes pour in from the rim and spiral
// down into it. Phases (entry `phase`):
// - `fill` (chorus 1, "Every byte you ever sent is mine"): looking straight down the shaft; the vortex of envelopes
//   speeds up on the beats; on the anchor every lamp flares, ring after ring downward.
// - `deep` (chorus 2): the shaft frosted white; the camera falls down it with the envelopes, rings rushing past;
//   on the anchor the deep floods gold.
//
// The wall is one cylinder drawn by a shader (cells, frost, lamps, fog, depth in alpha); the envelopes are an
// instanced mesh placed per frame on their spirals.
import * as THREE from 'three';
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import { GLSL_COMMON } from '../engine/glsl/common';
import { clamp, ease, hexToLinear, lerp, mulberry32, prog } from '../engine/util';
import { LibScene, hit } from './_lib';
import { Stage, colors, depthAlpha, dust, envProbe, envelopeTexture, lin, linV, paperMaterial, fitOf } from './harvest-remix-kit';

export const schema: SceneSchema = {
  description: 'The archive as a vast round shaft lined with drawers and gold lamps, ringed by walkways, sinking into blue fog over a gold glow; sealed envelopes spiral down into it. fill: looking straight down, the vortex speeding up, every lamp flaring ring by ring on the anchor; deep: the shaft frosted, the camera falling down it, the deep flooding gold on the anchor. Harvest remix.',
  kinds: ['song'],
  lyrics: 'layer',
  entry: {
    phase: { type: 'string', enum: ['fill', 'deep', 'sun'], default: 'fill', description: 'fill: looking down the shaft as it fills; deep: falling down it, frosted; sun: looking up it from the deep as sunlight pours down and the frost melts' },
  },
  cue: {},
  example: { entry: { phase: 'fill' }, cues: [{}] },
};

type Phase = 'fill' | 'deep' | 'sun';
interface P { phase: Phase }

const R = 6, DEPTH = 160; // shaft radius, depth
const NCOL = 64, CH = 0.36, LEVEL = 9; // drawer columns around, row height, rows per level (the last a walkway)
const NENV = 520;

const WALL_V = /* glsl */ `
precision highp float;
in vec3 position;
uniform mat4 modelMatrix, viewMatrix, projectionMatrix;
out vec3 vW; out float vD;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vec4 v = viewMatrix * w;
  vW = w.xyz; vD = -v.z;
  gl_Position = projectionMatrix * v;
}`;
const WALL_F = /* glsl */ `
precision highp float;
precision highp int;
in vec3 vW; in float vD;
out vec4 fragColor;
${GLSL_COMMON}
uniform vec3 uSteel, uFrost, uLamp, uFog, uDeep, uStrip;
uniform float uFrostAmt, uFlareT, uFlareV, uTime, uLampOn, uFogDen, uDeepAmt, uBeat, uMeltY, uSunAmt;
uniform vec3 uSunC;
uniform vec3 uCam;
const float NCOL = ${NCOL.toFixed(1)}, CH = ${CH.toFixed(3)}, LEVEL = ${LEVEL.toFixed(1)};
void main() {
  float a = atan(vW.z, vW.x);
  float u = (a / TAU + 0.5) * NCOL, col = floor(u), fu = fract(u);
  float v = -vW.y / CH, row = floor(v), fv = fract(v);
  float lev = floor(row / LEVEL), rl = mod(row, LEVEL);
  float px = fwidth(u) + fwidth(v);
  vec3 c;
  // the lamps of this level flare as the wave passes it (a wave running down the shaft)
  float depthY = -vW.y;
  float wave = uFlareT >= 0.0 ? exp(-pow((depthY - uFlareV) / 6.0, 2.0)) : 0.0;
  if (rl > LEVEL - 1.5) {
    // the walkway: a dark grating with a strip light along its top edge
    float strip = smoothstep(0.75, 0.95, fv) * (1.0 - smoothstep(0.95, 1.0, fv));
    float grate = 0.5 + 0.5 * step(0.5, fract(u * 6.0));
    c = uSteel * 0.25 * grate + uStrip * strip * (1.2 + 3.0 * wave);
  } else {
    float seed = hash12(vec2(col, row) + 0.37), seed2 = hash12(vec2(row, col) * 1.7 + 5.1);
    vec2 q = vec2(fu, fv);
    float frame = 1.0 - smoothstep(0.0, px * 1.5, min(min(q.x - 0.035, 0.965 - q.x), min(q.y - 0.07, 0.93 - q.y)));
    vec2 pq = (q - vec2(0.45, 0.55)) / vec2(0.36, 0.3);
    float pane = 1.0 - smoothstep(1.0 - px * 4.0, 1.0, max(abs(pq.x), abs(pq.y)));
    // behind the glass a pale envelope; frost over it
    vec3 behind = uSteel * 0.05 + vec3(0.9, 0.85, 0.75) * 0.05 * (1.0 - smoothstep(0.55, 0.7, max(abs(pq.x) * 0.9, abs(pq.y) * 1.3)));
    float fr = uFrostAmt * (0.55 + 0.45 * fbm(vec2(u * 3.0, v * 2.0) + seed * 9.0, 3)) * smoothstep(uMeltY - 4.0, uMeltY + 4.0, -vW.y);
    vec3 glass = mix(behind, uFrost * 0.22, sat(fr)) + uFrost * 0.06 * fr * (1.0 - max(abs(pq.x), abs(pq.y)));
    vec3 steel = uSteel * (0.55 + 0.35 * smoothstep(0.85, 0.95, fv));
    c = mix(steel, glass, pane);
    c = mix(c, uSteel * 0.15, frame * 0.6);
    // the lamp: a gold dot at the drawer's right, glowing through its own patch of frost
    vec2 lp = (q - vec2(0.88, 0.22)) * vec2(1.0, CH * NCOL / (TAU * 6.0) * 0.0 + 0.6);
    float lamp = step(seed2, uLampOn) * (0.8 + 0.2 * sin(uTime * 2.3 + seed * 40.0));
    float ld = length((q - vec2(0.88, 0.2)) * vec2(1.0, 0.55));
    c += uLamp * lamp * (exp(-ld * ld / 0.0012) * (3.0 + 6.0 * wave) + exp(-ld * ld / 0.02) * 0.25 * (1.0 + 2.0 * wave));
  }
  // light from the strips falls off away from them
  float toStrip = abs(rl + fv - (LEVEL - 0.15));
  c *= 0.6 + 0.6 * exp(-toStrip * 0.5);
  // the sun from the rim (sun phase): warm light falling down the wall, strongest near the top
  c += uSunC * uSunAmt * exp(vW.y / 45.0) * (0.6 + 0.4 * fbm(vec2(u * 0.5, v * 0.05) + uTime * 0.05, 2));
  // fog: blue with depth, a gold glow rising from the deep
  float d = length(vW - uCam);
  float fogK = 1.0 - exp(-d * uFogDen);
  vec3 fogC = mix(uFog, uDeep, uDeepAmt * smoothstep(20.0, 140.0, depthY));
  c = mix(c, fogC, fogK);
  fragColor = vec4(c, vD);
}`;

export default class HarvestRemixSilo extends LibScene<P> {
  static schema = schema;
  private st = new Stage(62, 0.05, 400);
  private wallMat!: THREE.RawShaderMaterial;
  private envs!: THREE.InstancedMesh;
  private seeds: { tb: number; a0: number; r0: number; spin: number; tilt: number; w: number; drop: number }[] = [];
  private glow!: THREE.Mesh; private glowMat!: THREE.MeshBasicMaterial;
  private motes!: ReturnType<typeof dust>;
  private S = 0; private E = 0; private aMine = 1e9; private beats: number[] = [];
  private c = colors(this.ctx.style, 'amber');
  private get ph() { return this.P.phase; }

  override setup() {
    this.st.fit = fitOf(this.ctx.style);
    this.S = this.ctx.start; this.E = this.ctx.end;
    const cue = this.cues[0];
    this.aMine = cue?.at ?? this.E - 1;
    this.c = colors(this.ctx.style, cue?.def.palette ?? 'amber');
    this.beats = this.ctx.audio.beats.filter((b) => b > this.S - 1 && b < this.E + 1);
    this.build();
  }

  private build() {
    const r = this.ctx.renderer, sc = this.st.scene, c = this.c, deep = this.ph === 'deep';
    sc.environment = envProbe(r, lin('#05070C'), [
      { w: 20, h: 3, p: [0, -10, 0], at: [0, 0, 0], c: lin(c.accent, 2.5) },
      { w: 20, h: 6, p: [0, 10, 0], at: [0, 0, 0], c: lin('#9FC4FF', 0.6) },
    ]);
    // the wall: an open cylinder seen from inside
    const geo = new THREE.CylinderGeometry(R, R, DEPTH, 160, 1, true);
    geo.translate(0, -DEPTH / 2 + 2, 0);
    this.wallMat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: WALL_V, fragmentShader: WALL_F, side: THREE.BackSide,
      uniforms: {
        uSteel: { value: linV(deep ? '#8FA6BF' : '#6E6A66', deep ? 0.55 : 0.45) }, uFrost: { value: linV(deep ? '#EAF6FF' : c.accent2) },
        uLamp: { value: linV(c.accent) }, uFog: { value: linV(deep ? '#0E2A55' : '#071733', 1) }, uDeep: { value: linV(c.accent, 1.6) },
        uStrip: { value: linV(deep ? '#BFE4FF' : '#FFD9A0', 1) },
        uFrostAmt: { value: deep ? 1 : 0.6 }, uFlareT: { value: -1 }, uFlareV: { value: -100 }, uTime: { value: 0 }, uLampOn: { value: deep ? 0.35 : 0.75 },
        uFogDen: { value: 0.018 }, uDeepAmt: { value: 1 }, uBeat: { value: 0 }, uCam: { value: new THREE.Vector3() },
        uMeltY: { value: -1000 }, uSunAmt: { value: 0 }, uSunC: { value: linV('#FFC890', 1) },
      },
    });
    const wall = new THREE.Mesh(geo, this.wallMat);
    wall.frustumCulled = false;
    sc.add(wall);
    // the deep's glow: a bright disc far down
    this.glowMat = new THREE.MeshBasicMaterial({ color: lin(c.accent, 4) });
    depthAlpha(this.glowMat, {}, 'hr-silo-glow', false);
    this.glow = new THREE.Mesh(new THREE.CircleGeometry(R * 0.98, 64), this.glowMat);
    this.glow.rotation.x = -Math.PI / 2;
    this.glow.position.y = -DEPTH + 4;
    sc.add(this.glow);

    // the envelopes
    const tex = envelopeTexture('', { w: 256, postmark: false, seed: 8, seal: c.wax });
    const m = paperMaterial(tex);
    m.side = THREE.DoubleSide;
    m.emissiveMap = tex; m.emissive = lin('#FFFFFF'); m.emissiveIntensity = 0.35;
    depthAlpha(m, {}, 'hr-silo-env');
    this.envs = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.62, 0.39), m, NENV);
    this.envs.frustumCulled = false;
    sc.add(this.envs);
    const rnd = mulberry32(deep ? 717 : 707);
    const span = this.E - this.S + 6;
    for (let i = 0; i < NENV; i++) {
      this.seeds.push({ tb: this.S - 5 + rnd() * span, a0: rnd() * Math.PI * 2, r0: R * (0.55 + 0.4 * rnd()), spin: (rnd() - 0.5) * 6, tilt: rnd() * Math.PI, w: 0.7 + 0.6 * rnd(), drop: 0.7 + 0.6 * rnd() });
    }
    const key = new THREE.PointLight(lin(c.accent), 400, 60, 1.5);
    key.position.set(0, -14, 0);
    sc.add(key);
    sc.add(new THREE.HemisphereLight(lin('#BFD8FF'), lin(c.accent), 0.6));
    this.motes = dust(900, [R * 2, 30, R * 2], 5);
    (this.motes.u.uCol!.value as THREE.Color).copy(lin(deep ? '#EAF6FF' : c.accent, 1.2));
    this.motes.u.uSize!.value = 10;
    sc.add(this.motes.pts);
  }

  /** The vortex's turn rate, faster on every beat (fill). */
  private spinAt(t: number) {
    const n = this.beats.filter((b) => b <= t).length;
    return 0.55 + 0.06 * n;
  }

  override draw() {}

  override render(f: Frame, out: THREE.WebGLRenderTarget) {
    const t = f.t, r = this.ctx.renderer, deep = this.ph === 'deep', S = this.S, a = f.a;
    // the camera: over the rim looking down (fill); falling down the shaft (deep)
    const sun = this.ph === 'sun';
    const fall = deep ? 70 * ease.inOutQuad(prog(t, S, this.E + 0.4)) + 6 * (t - S) : 0;
    const camY = sun ? -78 + 5 * (t - S) : deep ? 1 - fall : 4.2 - 0.6 * (t - S);
    const rot = 0.25 * (t - S);
    const off = deep ? 1.2 : 1.6;
    const cpos: [number, number, number] = [Math.cos(rot) * off, camY, Math.sin(rot) * off];
    const look: [number, number, number] = [Math.cos(rot + 1.2) * 0.6, camY + (sun ? 30 : -30), Math.sin(rot + 1.2) * 0.6];
    this.st.cam.up.set(Math.cos(rot + Math.PI / 2), 0, Math.sin(rot + Math.PI / 2));
    const focus = this.st.look(cpos, look, deep ? 70 : 62);

    // the wall: the flare wave runs down the shaft from the anchor
    const U = this.wallMat.uniforms;
    U.uTime!.value = t;
    (U.uCam!.value as THREE.Vector3).set(...cpos);
    const fl = t - this.aMine;
    U.uFlareT!.value = fl >= 0 ? fl : -1;
    U.uFlareV!.value = fl >= 0 ? -camY + fl * 70 : -100;
    U.uLampOn!.value = deep ? (t >= this.aMine ? 0.9 : 0.35) : 0.75 + 0.25 * hit(t, this.aMine, 0.4);
    U.uDeepAmt!.value = deep ? 0.6 + 1.1 * ease.outCubic(prog(t, this.aMine - 0.1, this.aMine + 0.8)) : 1 + 1.2 * hit(t, this.aMine, 0.5);
    this.glowMat.color.copy(lin(this.c.accent, deep ? 2 + 4 * ease.outCubic(prog(t, this.aMine - 0.1, this.aMine + 0.6)) : 4 * (1 + a.rms)));

    // the envelopes: spiral inward and down from the rim, tumbling
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1);
    const spin = this.spinAt(t);
    let n = 0;
    for (let i = 0; i < NENV; i++) {
      const sd = this.seeds[i]!, age = t - sd.tb;
      if (age < 0) { m4.makeScale(0, 0, 0); this.envs.setMatrixAt(i, m4); continue; }
      const rr = lerp(sd.r0, 0.6 + 0.8 * sd.w, 1 - Math.exp(-age / 2.2));
      const ang = sd.a0 + spin * sd.w * age * (1 + 0.15 * age);
      const y = (deep ? camY + 3 - 6 * sd.drop * age - 30 * (sd.w - 0.7) : 3 - sd.drop * (2.2 * age + 1.6 * age * age));
      p.set(Math.cos(ang) * rr, y, Math.sin(ang) * rr);
      e.set(sd.tilt + age * sd.spin * 0.6, ang + age * sd.spin, 0.4 * Math.sin(age * 2 + sd.tilt));
      q.setFromEuler(e);
      m4.compose(p, q, s);
      this.envs.setMatrixAt(i, m4);
      n++;
    }
    this.envs.instanceMatrix.needsUpdate = true;
    this.motes.pts.position.set(0, camY - 12, 0);
    this.motes.u.uTime!.value = t;

    if (sun) {
      // the sun pours down from the rim; the frost melts from the top down
      U.uMeltY!.value = -2 + 85 * ease.inOutQuad(prog(t, S, this.E + 0.5));
      U.uSunAmt!.value = 0.8 * ease.outCubic(prog(t, S - 0.3, S + 0.8));
      (U.uLamp!.value as THREE.Vector3).set(...hexToLinear('#FFC15E'));
      U.uLampOn!.value = 0.3; U.uDeepAmt!.value = 0;
      (U.uFog!.value as THREE.Vector3).set(...hexToLinear('#3A2210').map((x) => x * 0.6) as [number, number, number]);
      this.glow.position.y = 2.5; this.glow.rotation.x = Math.PI / 2;
      this.glowMat.color.copy(lin('#FFE6C0', 5));
      this.envs.visible = false;
    }
    const deepUv = this.st.uv([0, sun ? 2.5 : camY - 120, 0]);
    if (sun) { this.st.time = t; this.st.beams = [{ p: [0, 3, 0], d: [0, -1, 0], angle: 0.42, color: lin('#FFC890', 1.0), range: 90 }]; this.st.fog = { density: 0.004, noise: 0.6, haze: 0, maxDist: 120 }; }
    this.st.render(r, out, {
      focus: deep ? 8 : 9, ap: deep ? 8 : 6, clear: [0, 0, 0],
      rays: sun ? { uv: deepUv, amt: 0.7, thr: 0.8, len: 0.9, decay: 0.975, rad: 0.5, tint: lin('#FFD7A8', 1) } : { uv: deepUv, amt: deep ? 0.9 + 1.2 * hit(t, this.aMine, 0.5) : 1.2 + 1.5 * hit(t, this.aMine, 0.4), thr: 0.7, len: 0.9, decay: 0.97, rad: 0.45, tint: lin(this.c.accent, 1) },
      lens: deep ? 0.18 : 0.06, lensCol: lin(deep ? '#CFEFFF' : this.c.accent2, 0.5),
    });
    void focus; void n;
    return {
      bloom: 0.8, bloomThreshold: 0.8, bloomRadius: 0.65, halation: 0.12, ca: 0.22, grain: 0.016, vignette: 0.5, hud: 0,
      gain: [1.04, 1.0, 0.94] as [number, number, number], lift: [0.004, 0.004, 0.012] as [number, number, number], sat: 1.12,
      shake: [hit(t, this.aMine, 0.1) * 5, hit(t, this.aMine, 0.1) * 7] as [number, number],
      exposure: clamp(1, 0, 2),
    };
  }
}

void hexToLinear;
