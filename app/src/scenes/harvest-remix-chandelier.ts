// Harvest Now, Decrypt Later (Banger Remix): the chandelier. The dilution refrigerator of a quantum computer, the
// machine being built to open the archive: five gold-plated circular stages hung one under another on rods, each
// smaller than the one above, coax lines coiling down between them, a cold finger and a square qubit chip at the
// bottom. Behind and below it, out of focus, a rack wall of the archive's frosted drawers with their padlocks and
// status lamps. Callouts name the stages (PT1 50 K … MXC 10 mK) and light as the machine reaches them; a readout
// at the right carries the temperature, the qubit count and the Q-day ETA.
//
// Phases (entry `phase`): `build` (verse 2, frost: a bare frame under cold work lights, plates bolting on one per
// beat, the chip lighting a row per plate, the qubit count stepping to each cue's `qubits` with the last plate on
// the anchor; then it turns, and a Q-day ETA counts its years down on the hats and snaps to the cue's `eta`);
// `cool` (chorus 2, amber: complete and turning, plates rim-lit top to bottom on the downbeats, the temperature
// stepping to each cue's `temp` on its anchor, frost creeping up the rods; the camera tilts down the coax to the
// chip, past it to the drawers, and in to one padlock, across which a crack runs on the last cue's anchor; in the
// instrumental span it pulls back and the stages dim one by one to black, the readout last); `base` (final chorus,
// amber: qubits lighting row by row to all on the first anchor, gold light running down the coax and every drawer
// lamp lit on the second, the stages shivering on "hums" while the chip's dots gather into a toothed key, which
// drops out of the chip on the third anchor and falls out of frame).
//
// Rendering: three.js meshes (physically based gold, copper and steel in a light probe built from the palette, the
// drawers and the backdrop as shaders) into a multisampled target whose alpha carries the view depth; a gather
// pass blurs it by depth (the camera's focus follows its subject), then a Canvas2D layer of callouts and readouts.
import * as THREE from 'three';
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import type { ResolvedCue } from '../engine/cues';
import { FSPass, makeRT, clearRT } from '../engine/gl';
import { GLSL_COMMON } from '../engine/glsl/common';
import { LineBatch } from '../engine/lines';
import { measure } from '../engine/type';
import { clamp, ease, hash, hexToLinear, lerp, mulberry32, prog, smoothstep } from '../engine/util';
import { LibScene, W, H, fitSize, hit, label, text, mixHex, type Look } from './_lib';

export const schema: SceneSchema = {
  description: 'The dilution refrigerator ("chandelier") of a quantum computer in three.js: five gold-plated stages hung on rods, coax coiling between them, a qubit chip at the bottom, stage callouts and a temperature / qubit readout; behind it, out of focus, a wall of frosted archive drawers with padlocks. build: plates bolt onto a bare frame, the chip lights, qubit count and Q-day ETA count; cool: the temperature falls a stage per cue, the camera tilts down to the drawers and a crack runs across one padlock, then the stages dim; base: every qubit lit, light down the coax, the drawers claimed, a key of qubit dots falls out. Harvest remix.',
  kinds: ['song'],
  lyrics: 'layer',
  entry: {
    phase: { type: 'string', enum: ['build', 'cool', 'base'], default: 'cool', description: 'build: the bare frame assembled under work lights; cool: complete, cooling, the crack; base: at base temperature, the key falls' },
    from: { type: 'string', default: '', description: 'the temperature readout before the first cue changes it (default by phase: 300 K, 50 K, 20 mK)' },
    qubits: { type: 'number', default: 1121, description: 'the qubit count shown when no cue steps it (cool, base)' },
  },
  cue: {
    temp: { type: 'string', default: '', description: 'the temperature the readout lands on at the cue\'s anchor (e.g. "4 K", "800 mK", "10 mK · BASE"; build: the reading throughout)' },
    qubits: { type: 'number[]', default: [], description: 'build: the qubit counts stepped through, one per plate bolted on, the last on the anchor' },
    eta: { type: 'string', default: '', description: 'build: a Q-day ETA readout counts its years down from 10 and snaps to this on the anchor' },
  },
  example: { entry: { phase: 'cool' }, cues: [{ temp: '4 K' }, { temp: '800 mK' }, { temp: '100 mK' }, { temp: '20 mK' }] },
};

type Phase = 'build' | 'cool' | 'base';
interface P { phase: Phase; from: string; qubits: number }
interface C { temp: string; qubits: number[]; eta: string }

type V3 = [number, number, number];
const mix3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const lin = (hex: string) => new THREE.Color().setRGB(...hexToLinear(hex), THREE.LinearSRGBColorSpace);
const v3 = (c: [number, number, number], k = 1) => new THREE.Vector3(c[0] * k, c[1] * k, c[2] * k);

// ------------------------------------------------------------------ the machine (metres, y up, axis at x = z = 0)
const STAGES = [
  { y: 4.25, r: 0.6, name: 'PT1', temp: '50 K', k: 50 },
  { y: 3.87, r: 0.53, name: 'PT2', temp: '4 K', k: 4 },
  { y: 3.52, r: 0.46, name: 'STILL', temp: '800 mK', k: 0.8 },
  { y: 3.19, r: 0.4, name: 'CP', temp: '100 mK', k: 0.1 },
  { y: 2.88, r: 0.34, name: 'MXC', temp: '10 mK', k: 0.01 },
];
const NS = STAGES.length;
const PT = 0.042; // plate thickness
const FRAME_R = 0.29; // the frame's support rods (through every plate)
const CO_R = 0.215, NCOAX = 8; // coax lines
const CHIP_Y = 2.5, PKG = 0.27, DIE = 0.2, NG = 14, PITCH = 0.0122, DOT = 0.0042; // chip package, die, qubit grid
const FACE_Z = 0.017; // the package's front face
// the archive wall behind
const WALL_Z = -3.8, X0 = -8, CW = 0.62, CH = 0.32, NROW = 10, UPW = 0.07, BAYW = 3 * CW + UPW;
const PANE: [number, number, number, number] = [0.31, 0.2, 0.27, 0.095]; // glass: centre, half size (cell coords)
const LOCK_S = 0.07; // padlock body width
const NCRACK = 13;
const FROST_CAP = 12000;

const f4 = (x: number) => x.toFixed(4);
const WALL_CONST = /* glsl */ `
const float X0 = ${f4(X0)}, CW = ${f4(CW)}, CH = ${f4(CH)}, NROW = ${NROW}.0, UPW = ${f4(UPW)}, BAYW = ${f4(BAYW)};
const vec2 PANE_C = vec2(${f4(PANE[0])}, ${f4(PANE[1])}), PANE_H = vec2(${f4(PANE[2])}, ${f4(PANE[3])});
const float LOCK_S = ${f4(LOCK_S)};
`;

// the drawer wall: steel racks of drawers with frosted glass fronts, an envelope and padlock behind each pane, a tag,
// a status lamp; the hero drawer's padlock can crack. Writes its view depth to alpha.
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
${WALL_CONST}
uniform vec3 uSteel, uFrostC, uPaper, uLampC, uKey, uCrackC;
uniform float uAmb, uLamp, uLampAll, uFrost, uCrack, uCrackFlash, uLevel, uTime;
uniform vec2 uHero;
uniform vec2 uCrackP[${NCRACK}];
uniform sampler2D uFrostTex;

/** A padlock, body width s, centred on its body; the shackle above. */
float sdLock(vec2 p, float s) {
  float body = sdBox(p - vec2(0.0, -0.2 * s), vec2(0.5 * s, 0.38 * s) - 0.1 * s) - 0.1 * s;
  vec2 q = p - vec2(0.0, 0.2 * s);
  float R = 0.27 * s, th = 0.07 * s;
  float arc = q.y > 0.0 ? abs(length(q) - R) : abs(abs(q.x) - R);
  if (q.y < -0.1 * s) arc = 1e5;
  return min(body, arc - th);
}

void main() {
  vec2 w = vW.xy;
  float px = max(length(dFdx(vW)), length(dFdy(vW)));
  float lv = uLevel * (uAmb + 0.3 + 0.7 * smoothstep(-0.2, 3.6, w.y));
  float xr = w.x - X0, bay = floor(xr / BAYW), wb = xr - bay * BAYW;
  float c = floor((wb - UPW) / CW), r = floor(w.y / CH);
  vec3 col;
  if (wb < UPW || c > 2.0 || r >= NROW || r < 0.0) {
    // uprights and rails: brushed steel, a highlight down the upright's edge
    float e = wb < UPW ? 1.0 - smoothstep(0.0, 0.012, abs(wb - UPW * 0.3)) : 0.0;
    col = uSteel * (0.55 + 0.9 * e) * lv * uKey;
  } else {
    vec2 q = vec2(wb - UPW - c * CW, w.y - r * CH);
    vec2 id = vec2(bay * 3.0 + c, r);
    float seed = hash12(id + 0.37), seed2 = hash12(id.yx + 5.1);
    bool hero = all(lessThan(abs(id - uHero), vec2(0.5)));
    float aa = px * 1.2;
    float dCell = sdBox(q - vec2(CW, CH) * 0.5, vec2(CW, CH) * 0.5 - 0.006);
    float dGlass = sdBox(q - PANE_C, PANE_H) - 0.004;
    float dTag = sdBox(q - vec2(0.2, 0.052), vec2(0.15, 0.024));
    float dHandle = sdBox(q - vec2(0.43, 0.052), vec2(0.045, 0.006)) - 0.004;
    vec2 lc = vec2(0.555, 0.052);
    float dLed = length(q - lc) - 0.011;
    vec2 pq = q - PANE_C;
    float dEnv = sdBox(pq - vec2(0.0, -0.012), vec2(0.2, 0.072)) - 0.003;
    vec2 lq = pq - vec2(0.0, 0.004);
    float dLk = sdLock(lq, LOCK_S);
    float fCell = 1.0 - smoothstep(-aa, aa, dCell), fGlass = 1.0 - smoothstep(-aa, aa, dGlass);
    float fTag = 1.0 - smoothstep(-aa, aa, dTag), fHandle = 1.0 - smoothstep(-aa, aa, dHandle);
    float fLed = 1.0 - smoothstep(-aa, aa, dLed), fEnv = 1.0 - smoothstep(-aa, aa, dEnv), fLk = 1.0 - smoothstep(-aa, aa, dLk);
    float lamp = uLampAll * max(step(seed2, uLamp), 0.0) * (0.85 + 0.15 * sin(uTime * 2.1 + seed * 40.0));
    // behind the glass: the dark drawer, the pale envelope with its flap, the frosted padlock
    vec3 behind = uSteel * 0.08;
    float flap = min(sdSegment(pq, vec2(-0.2, 0.06), vec2(0.0, -0.005)), sdSegment(pq, vec2(0.2, 0.06), vec2(0.0, -0.005)));
    vec3 env = uPaper * 0.16 * (1.0 - 0.35 * (1.0 - smoothstep(0.0, aa * 2.0 + 0.0015, flap)));
    behind = mix(behind, env, fEnv);
    vec3 lockC = mix(uPaper, uFrostC, 0.4) * 0.24;
    float bevel = 1.0 - smoothstep(0.0, 0.004, abs(dLk + 0.002));
    lockC *= 1.0 + 0.5 * bevel * smoothstep(-0.02, 0.03, lq.y);
    float keyhole = 1.0 - smoothstep(-aa, aa, length(lq - vec2(0.0, -0.2 * LOCK_S)) - 0.07 * LOCK_S);
    lockC *= 1.0 - 0.6 * keyhole;
    lockC *= 0.85 + 0.3 * smoothstep(0.02, -0.03, lq.y); // a little shading down the body
    behind = mix(behind, lockC, fLk);
    // the crack: a hairline across the hero's padlock, lit from inside as it runs
    if (hero && uCrack > 0.0) {
      float best = 1e5, total = 0.0, head = 0.0;
      for (int i = 0; i < ${NCRACK - 1}; i++) total += length(uCrackP[i + 1] - uCrackP[i]);
      float run = 0.0;
      for (int i = 0; i < ${NCRACK - 1}; i++) {
        vec2 a = uCrackP[i], b = uCrackP[i + 1];
        float L = length(b - a);
        float vis = clamp((uCrack * total - run) / L, 0.0, 1.0);
        if (vis > 0.0) best = min(best, sdSegment(lq, a, mix(a, b, vis)));
        run += L;
      }
      float dc = best;
      float line = 1.0 - smoothstep(0.0003, 0.0003 + aa, dc);
      float halo = exp(-dc / 0.004);
      behind = mix(behind, uSteel * 0.02, line * 0.85);
      behind += uCrackC * (line * (0.6 + 3.0 * uCrackFlash) + halo * 0.5 * uCrackFlash);
    }
    // frost on the glass: branching crystals and a milky haze, thicker at the edges
    vec2 fuv = pq / (PANE_H * 2.0) + 0.5;
    if (fract(seed * 7.13) > 0.5) fuv.x = 1.0 - fuv.x;
    if (fract(seed * 3.71) > 0.5) fuv.y = 1.0 - fuv.y;
    float ft = texture(uFrostTex, fuv).r;
    float edgeIn = 1.0 - smoothstep(0.0, 0.05, -dGlass);
    float haze = uFrost * (0.3 + 0.7 * edgeIn) * (0.75 + 0.5 * fbm(pq * 30.0 + seed * 9.0, 2));
    vec3 glass = mix(behind, uFrostC * 0.08, sat(haze * 0.6)) + uFrostC * ft * uFrost * (0.06 + 0.12 * edgeIn);
    // the lamp's light diffused through the frost
    glass += uLampC * lamp * 0.5 * exp(-dot(q - lc, q - lc) / 0.02) * (0.3 + 0.7 * sat(haze));
    // the steel front, its top bevel catching the light; the pane in a dark recess
    vec3 alb = uSteel * (0.85 + 0.3 * (1.0 - smoothstep(0.0, 0.006, abs(q.y - (CH - 0.012)))));
    alb = mix(alb, uSteel * 0.25, (1.0 - smoothstep(0.0, 0.005, abs(dGlass + 0.002))) * 0.8);
    // the tag: paper with a typed line
    float gx = (q.x - 0.07) / 0.0105, gi = floor(gx), gf = fract(gx);
    float gw = 0.3 + 0.35 * hash12(vec2(gi, seed * 31.0));
    float tx = step(0.0, gi) * step(gi, 14.0 + floor(seed * 9.0)) * smoothstep(0.5 - gw * 0.5 - 0.05, 0.5 - gw * 0.5, gf)
      * (1.0 - smoothstep(0.5 + gw * 0.5, 0.5 + gw * 0.5 + 0.05, gf))
      * step(0.2, hash12(vec2(gi, floor(seed * 997.0)))) * (1.0 - smoothstep(0.003, 0.003 + aa, abs(q.y - 0.052)));
    vec3 tag = mix(uPaper * 0.3, uPaper * 0.1, tx * 0.7);
    col = alb * lv * uKey;
    col = mix(col, glass * lv, fGlass);
    col = mix(col, tag * lv * uKey, fTag);
    col = mix(col, vec3(0.002), fHandle);
    col = mix(col, uSteel * 0.2 + uLampC * lamp * 6.0, fLed);
    col = mix(vec3(0.002), col, fCell);
    // glass sheen: a soft diagonal reflection of the room's light
    col += uKey * 0.035 * fGlass * smoothstep(0.6, 1.0, sin((q.x + q.y * 1.6) * 7.0 + seed * 6.0) * 0.5 + 0.5);
  }
  fragColor = vec4(col, vD);
}`;

// the backdrop: the dark room, a soft pool of light around the machine, work lamps (build) far up
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
uniform vec3 uBg, uHaze, uLampC;
uniform vec2 uC; // the pool's centre (uv)
uniform float uPool, uLamps, uTime;
void main() {
  vec2 p = (vUv - uC) * vec2(${(W / H).toFixed(4)}, 1.0);
  vec3 c = uBg * (0.75 + 0.5 * vUv.y);
  float pool = exp(-dot(p * vec2(1.5, 0.9), p * vec2(1.5, 0.9)) / 0.12);
  c += uHaze * uPool * pool * (0.85 + 0.3 * fbm(vec3(p * 2.5, uTime * 0.05), 3));
  // two work lamps out of focus near the top corners
  for (int i = 0; i < 2; i++) {
    vec2 lp = vec2(i == 0 ? 0.16 : 0.86, 0.97);
    vec2 d = (vUv - lp) * vec2(${(W / H).toFixed(4)}, 1.0);
    c += uLampC * uLamps * (exp(-dot(d, d) / 0.0012) * 1.1 + exp(-dot(d, d) / 0.05) * 0.12);
  }
  fragColor = vec4(c, 200.0);
}`;

// depth of field: a gather by each pixel's circle of confusion (from the depth in alpha); nearer, sharper samples
// do not bleed onto what is behind them
const DOF_F = /* glsl */ `
uniform sampler2D tCol;
uniform float uFocus, uK, uMax;
const int N = 72;
float coc(float z) { return min(uMax, uK * abs(z - uFocus) / max(z, 0.05)); }
void main() {
  vec4 c0 = texture(tCol, vUv);
  // the nearest depth around: an anti-aliased edge of something sharp in front stays sharp
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
    vec4 s = texture(tCol, vUv + vec2(cos(th), sin(th)) * rr * px);
    float rs = coc(s.a);
    float w = s.a >= c0.a - 0.05 ? 1.0 : clamp(rs - rr + 1.0, 0.0, 1.0);
    acc += s.rgb * w; ws += w;
  }
  fragColor = vec4(acc / ws, 1.0);
}`;

// the standard materials, patched: rim light, the run of light down the coax, hat shimmer, dimming, depth in alpha
function patch(m: THREE.Material, U: Record<string, THREE.IUniform>, lit: boolean) {
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vDepthA;\nvarying float vRunU;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvDepthA = -mvPosition.z;\nvRunU = uv.x;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vDepthA;\nvarying float vRunU;\nuniform float uRim, uDim, uRun, uRunAmt, uShim, uTime;\nuniform vec3 uRimCol, uRunCol;')
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>
${lit ? 'float fres = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 3.0);\ngl_FragColor.rgb += uRimCol * uRim * (0.06 + 1.8 * fres);' : ''}
gl_FragColor.rgb += uRunCol * (uRunAmt * exp(-pow((vRunU - uRun) * 7.0, 2.0)) + uShim * pow(0.5 + 0.5 * sin(vRunU * 46.0 - uTime * 8.0), 14.0));
gl_FragColor.rgb *= 1.0 - uDim;
gl_FragColor.a = vDepthA;`);
  };
  m.customProgramCacheKey = () => (lit ? 'hr-chand-lit' : 'hr-chand-basic');
}

// ------------------------------------------------------------------ frost: branching crystals (2D, for the glass)
function growFrost(c: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  const rnd = mulberry32(seed);
  const branch = (x: number, y: number, a: number, len: number, lvl: number, lw: number) => {
    const st = 5 + lvl * -1.2;
    let n = Math.max(1, Math.round(len / st)), next = 14 + rnd() * 18, alt = rnd() < 0.5 ? 1 : -1;
    c.lineWidth = lw;
    c.beginPath(); c.moveTo(x, y);
    const kids: [number, number, number, number][] = [];
    for (let i = 0; i < n; i++) {
      a += (rnd() - 0.5) * 0.18;
      x += Math.cos(a) * st; y += Math.sin(a) * st;
      c.lineTo(x, y);
      if (x < 0 || x > w || y < 0 || y > h) break;
      const done = (i + 1) * st;
      if (lvl < 2 && done >= next && len - done > st * 2) {
        next += (lvl ? 9 : 16) * (0.7 + 0.6 * rnd());
        const sl = Math.min((len - done) * 0.45, lvl ? 22 : 90) * (0.6 + 0.5 * rnd());
        const da = (Math.PI / 3) * (0.9 + 0.2 * rnd());
        if (lvl === 0) { kids.push([x, y, a + da, sl]); kids.push([x, y, a - da, sl * 0.9]); }
        else { kids.push([x, y, a + alt * da, sl]); alt = -alt; }
      }
    }
    c.stroke();
    for (const [kx, ky, ka, kl] of kids) branch(kx, ky, ka, kl, lvl + 1, lw * 0.6);
  };
  c.strokeStyle = 'rgba(255,255,255,0.75)';
  c.lineCap = 'round';
  for (let i = 0; i < 110; i++) {
    // seeds along the pane's edges, growing inward
    const side = Math.floor(rnd() * 4), u = rnd();
    const [x, y, a] = side === 0 ? [u * w, 0, Math.PI / 2] : side === 1 ? [u * w, h, -Math.PI / 2] : side === 2 ? [0, u * h, 0] : [w, u * h, Math.PI];
    branch(x, y, a + (rnd() - 0.5) * 1.1, (0.12 + 0.4 * rnd() * rnd()) * (side < 2 ? h : w * 0.4), 0, 1.6);
  }
}

// ------------------------------------------------------------------ the scene

interface Stage { g: THREE.Group; U: Record<string, THREE.IUniform>; coaxU: Record<string, THREE.IUniform> }
interface Needle { a: V3; b: V3; y: number; ord: number; stage: number }
interface Temp { t: number; s: string }
interface Key { t: number; c: V3; g: V3; fov?: number; ap?: number; e?: (x: number) => number }

export default class HarvestRemixChandelier extends LibScene<P, C> {
  static schema = schema;
  private rt = makeRT(W, H, { samples: 4 });
  private scene = new THREE.Scene();
  private cam = new THREE.PerspectiveCamera(32, W / H, 0.05, 400);
  private dof = new FSPass(DOF_F, { tCol: { value: null }, uFocus: { value: 6 }, uK: { value: 30 }, uMax: { value: 16 } });
  private rig = new THREE.Group(); // turns
  private chip = new THREE.Group(); // hangs under the rig, facing the camera
  private stages: Stage[] = [];
  private frameRods!: THREE.Group;
  private dots!: THREE.InstancedMesh;
  private dotHome: [number, number][] = [];
  private keyPts: [number, number][] = [];
  private keyDot: number[] = []; // dot index → key point index (-1: not in the key)
  private wallMat!: THREE.RawShaderMaterial;
  private wall!: THREE.Mesh;
  private backMat!: THREE.RawShaderMaterial;
  private keyLight = new THREE.DirectionalLight(0xffffff, 1);
  private fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
  private frost = new LineBatch(FROST_CAP, { screen2D: false, worldWidth: true, blend: 'add', depthTest: true });
  private needles: Needle[] = [];
  private envTex: THREE.Texture | null = null;

  // moments
  private S = 0; private E = 0;
  private beat = 0.457;
  private downbeats: number[] = [];
  private beats: number[] = [];
  private hats: number[] = [];
  private temps: Temp[] = [];
  private bolts: number[] = []; // build: when each stage bolts on (-Infinity: there from the start)
  private qsteps: { t: number; n: number }[] = [];
  private etaFrom = 1e9; private etaAt = 1e9; private etaText = '';
  private blinkAt = 1e9;
  private crackAt = 1e9; private crackTempAt = 1e9;
  private dimFrom = 1e9; private dimTimes: number[] = [];
  private runFrom = 1e9; private claimAt = 1e9;
  private humsAt = 1e9; private fallAt = 1e9;
  private hero: [number, number] = [0, 0];
  private crackPts: THREE.Vector2[] = [];
  private qubitsMax = 1121;

  private get ph() { return this.P.phase; }

  override setup() {
    const au = this.ctx.audio, S = this.ctx.start, E = this.ctx.end;
    this.S = S; this.E = E;
    this.beat = au.beats.length > 1 ? (au.beats.at(-1)! - au.beats[0]!) / (au.beats.length - 1) : 0.457;
    this.downbeats = au.downbeats.filter((d) => d >= S - 0.01 && d < E + 0.01);
    this.beats = au.beats.filter((b) => b >= S - 2 && b < E + 1);
    this.hats = au.events('hat', S - 1, E + 1).map(([t]) => t);
    this.plan();
    this.build();
  }

  // ------------------------------------------------------------------ timing
  private lyricCues() { return this.cues.filter((c) => c.line); }
  private wordAt(c: ResolvedCue | undefined, re: RegExp) { return c?.line?.words.find((w) => re.test(w.w))?.start; }

  private plan() {
    const S = this.S, E = this.E, ly = this.lyricCues(), b = this.beat;
    const fromDefault = { build: '300 K', cool: '50 K', base: '20 mK' }[this.ph];
    const tempCue = this.cues.find((c) => this.cp(c).temp);
    this.temps = [{ t: -1e9, s: this.P.from || (this.ph === 'build' && tempCue ? this.cp(tempCue).temp : fromDefault) }];
    const qc = this.cues.find((c) => this.cp(c).qubits.length);
    const q = qc ? this.cp(qc).qubits : [];
    this.qubitsMax = q.at(-1) ?? this.P.qubits;
    if (this.ph === 'build') {
      // two plates hang from the start; the other three bolt on, a beat apart, the last on the anchor
      const a = ly[0]?.at ?? S + 1.2;
      this.bolts = [-1e9, -1e9, Math.max(S + 0.15, a - 2 * b), Math.max(S + 0.3, a - b), a];
      this.qsteps = q.length ? q.map((n, i) => ({ t: i === 0 ? -1e9 : this.bolts[NS - q.length + i] ?? a, n })) : [{ t: -1e9, n: this.P.qubits }];
      const ec = this.cues.find((c) => this.cp(c).eta);
      if (ec) { this.etaFrom = ec.start; this.etaAt = ec.at; this.etaText = this.cp(ec).eta; this.blinkAt = ec.at; }
    } else {
      this.bolts = STAGES.map(() => -1e9);
      for (const c of this.cues) {
        const s = this.cp(c).temp;
        if (s && c.line) this.temps.push({ t: c.at, s });
      }
    }
    if (this.ph === 'cool') {
      // the last sung cue: the temperature drops on its first word, the crack runs on its anchor
      const last = ly.at(-1);
      if (last) {
        this.crackAt = last.at;
        this.crackTempAt = last.line!.words[0]?.start ?? last.start;
        const tt = this.temps.find((x) => x.t === last.at);
        if (tt) tt.t = Math.min(tt.t, this.crackTempAt + 0.05);
      }
      // the instrumental span: the stages dim one by one on the beats, the last with the chip on its anchor
      const span = this.cues.find((c) => !c.line);
      if (span) {
        this.dimFrom = span.start;
        const bs = this.beats.filter((x) => x > span.start + 2 && x <= span.at + 0.01).slice(-NS);
        this.dimTimes = STAGES.map((_, i) => bs[i - (NS - bs.length)] ?? lerp(span.start + 2, span.at, i / (NS - 1)));
      }
    }
    if (this.ph === 'base') {
      this.runFrom = ly[1]?.start ?? S + 4.6;
      this.claimAt = ly[1]?.at ?? S + 7;
      this.humsAt = this.wordAt(ly[2], /^hums/i) ?? (ly[2]?.start ?? E - 3) + 0.35;
      this.fallAt = ly[2]?.at ?? E - 1.3;
    }
    for (const t of this.temps) if (t.t > -1e8) t.t = Math.max(t.t, S);
    this.temps.sort((x, y) => x.t - y.t);
  }

  // ------------------------------------------------------------------ building
  private build() {
    const k = look0(this), r = this.ctx.renderer;
    const gold = mixHexLin('#FFC870', k.accent, this.ph === 'build' ? 0.1 : 0.22);
    const copper = mixHexLin('#E8A07A', k.accent, 0.2);
    const steel = new THREE.Color(0.55, 0.57, 0.6);

    // the light probe: a dark room with strip lights overhead and soft panels, coloured by the palette
    const envScene = new THREE.Scene();
    const room = new THREE.Mesh(new THREE.BoxGeometry(30, 14, 30), new THREE.MeshBasicMaterial({ color: lin(mixHex(k.bg, k.dim, 0.15)), side: THREE.BackSide }));
    envScene.add(room);
    const warm = this.ph !== 'build';
    const keyC = warm ? [1.0, 0.82, 0.62] : [0.82, 0.92, 1.0];
    const panel = (w: number, h: number, pos: V3, look: V3, c: number[], k2: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c[0]! * k2, c[1]! * k2, c[2]! * k2), side: THREE.DoubleSide }));
      m.position.set(...pos); m.lookAt(...look); envScene.add(m);
    };
    for (let i = -2; i <= 2; i++) panel(0.3, 12, [i * 2.4, 6.5, 0], [i * 2.4, 0, 0], keyC, 7);
    panel(6, 5, [-9, 2, 4], [0, 0, 0], keyC, 2.2);
    panel(16, 5, [0, 9, -9], [0, 0, 0], keyC, 1.1);
    panel(22, 5, [0, 4.5, -12], [0, 2, 0], keyC, 0.7); // low behind: what the plates' tops reflect to a camera above
    panel(4, 6, [9, 1, -6], [0, 0, 0], keyC, 1.3);
    const lampLin = hexToLinear(warm ? k.accent : k.accent);
    panel(30, 3, [0, -2, -10], [0, 0, 0], lampLin, warm ? 1.2 : 0.25); // the archive's lamps, behind and below
    const pm = new THREE.PMREMGenerator(r);
    this.envTex = pm.fromScene(envScene, 0.035).texture;
    pm.dispose();
    this.scene.environment = this.envTex;

    // lights: a key from above front left, a fill from the right
    this.keyLight.position.set(-3, 7, 5);
    this.fillLight.position.set(5, 2, 3);
    this.keyLight.color.setRGB(keyC[0]!, keyC[1]!, keyC[2]!);
    this.fillLight.color.setRGB(keyC[0]!, keyC[1]!, keyC[2]!);
    this.scene.add(this.keyLight, this.fillLight);

    // backdrop
    this.backMat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: BACK_V, fragmentShader: BACK_F, depthTest: false, depthWrite: false,
      uniforms: { uBg: { value: v3(hexToLinear(k.bg)) }, uHaze: { value: v3(hexToLinear(warm ? k.accent : k.type), 0.05) }, uLampC: { value: v3(keyC as [number, number, number]) },
        uC: { value: new THREE.Vector2(0.5, 0.6) }, uPool: { value: 1 }, uLamps: { value: this.ph === 'build' ? 1 : 0 }, uTime: { value: 0 } },
    });
    const tri = new THREE.BufferGeometry();
    tri.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    const back = new THREE.Mesh(tri, this.backMat);
    back.frustumCulled = false; back.renderOrder = -10;
    this.scene.add(back);

    // plate caps: machined rings, a ring of mounting holes, feedthrough holes (colour and roughness maps)
    const capMaps = this.capMaps();
    this.scene.add(this.rig);
    const lathe = (rad: number) => {
      const e = 0.004, h = PT / 2;
      const g = new THREE.LatheGeometry([new THREE.Vector2(0.0001, -h), new THREE.Vector2(rad - e, -h), new THREE.Vector2(rad, -h + e), new THREE.Vector2(rad, h - e), new THREE.Vector2(rad - e, h), new THREE.Vector2(0.0001, h)], 160);
      const p = g.getAttribute('position'), uv = g.getAttribute('uv');
      for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / rad * 0.5 + 0.5, p.getZ(i) / rad * 0.5 + 0.5);
      return g;
    };
    const coaxAngles = Array.from({ length: NCOAX }, (_, j) => (j / NCOAX) * Math.PI * 2 + 0.2);
    for (let i = 0; i < NS; i++) {
      const st = STAGES[i]!;
      const U: Record<string, THREE.IUniform> = {
        uRim: { value: 0 }, uDim: { value: 0 }, uRun: { value: -1 }, uRunAmt: { value: 0 }, uShim: { value: 0 }, uTime: { value: 0 },
        uRimCol: { value: new THREE.Color(...hexToLinear(k.accent)) }, uRunCol: { value: new THREE.Color(...hexToLinear(k.accent)).multiplyScalar(3) },
      };
      const coaxU = { ...U, uRun: { value: -1 }, uRunAmt: { value: 0 }, uShim: { value: 0 } };
      const goldM = new THREE.MeshPhysicalMaterial({ color: gold, metalness: 1, roughness: 0.3, map: capMaps.col, roughnessMap: capMaps.rough, envMapIntensity: 1.25 });
      const goldR = new THREE.MeshPhysicalMaterial({ color: gold, metalness: 1, roughness: 0.24, envMapIntensity: 1.2 });
      const copM = new THREE.MeshPhysicalMaterial({ color: copper, metalness: 1, roughness: 0.33, envMapIntensity: 1.0 });
      const steelM = new THREE.MeshPhysicalMaterial({ color: steel, metalness: 1, roughness: 0.38, envMapIntensity: 0.8 });
      patch(goldM, U, true); patch(goldR, U, true); patch(steelM, U, true); patch(copM, coaxU, true);
      const g = new THREE.Group();
      g.position.y = st.y;
      const plate = new THREE.Mesh(lathe(st.r), goldM);
      g.add(plate);
      // the frame's collars where the support rods pass the plate
      for (let j = 0; j < 3; j++) {
        const a = (j / 3) * Math.PI * 2 + Math.PI / 6;
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, PT + 0.03, 20), goldR);
        col.position.set(Math.cos(a) * FRAME_R, 0, Math.sin(a) * FRAME_R);
        g.add(col);
      }
      if (this.ph !== 'build') {
        // rods up to the plate above, feedthrough blocks and the coax coiling down from it
        if (i > 0) {
          const up = STAGES[i - 1]!, gap = up.y - st.y - PT;
          for (let j = 0; j < 4; j++) {
            const a = (j / 4) * Math.PI * 2 + i * 0.4;
            const rr = st.r * 0.88;
            const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0075, 0.0075, gap, 10), steelM);
            rod.position.set(Math.cos(a) * rr, PT / 2 + gap / 2, Math.sin(a) * rr);
            g.add(rod);
          }
          for (const a of coaxAngles) {
            const pts: THREE.Vector3[] = [];
            const cx = Math.cos(a) * CO_R, cz = Math.sin(a) * CO_R;
            const top = gap + PT / 2, bot = PT / 2, n = 160, turns = 4 + Math.round(hash(i, a) * 2), hr = 0.016;
            for (let s = 0; s <= n; s++) {
              const u = s / n, y = lerp(top, bot, u);
              const w = smoothstep(0.28, 0.34, u) * (1 - smoothstep(0.66, 0.72, u));
              const ph = (u - 0.28) / 0.44 * turns * Math.PI * 2 + a;
              // the coil winds around a centre pushed out from the line, so the line runs straight in and out
              pts.push(new THREE.Vector3(cx + w * hr * (Math.cos(ph) - Math.cos(a)) + w * Math.cos(a) * hr, y, cz + w * hr * (Math.sin(ph) - Math.sin(a)) + w * Math.sin(a) * hr));
            }
            const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 140, 0.0042, 8), copM);
            g.add(tube);
          }
        }
        for (const a of coaxAngles) {
          const blk = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.022, 0.024), goldR);
          blk.position.set(Math.cos(a) * CO_R, -PT / 2 - 0.011, Math.sin(a) * CO_R);
          blk.rotation.y = -a;
          g.add(blk);
        }
      }
      this.rig.add(g);
      this.stages.push({ g, U, coaxU });
    }
    // the frame: support rods through every plate, hangers above
    const frameU = this.stages[0]!.U;
    const steelF = new THREE.MeshPhysicalMaterial({ color: steel, metalness: 1, roughness: 0.35, envMapIntensity: 0.8 });
    patch(steelF, frameU, true);
    this.frameRods = new THREE.Group();
    const yb = STAGES[NS - 1]!.y - 0.02, yt = 6.5;
    for (let j = 0; j < 3; j++) {
      const a = (j / 3) * Math.PI * 2 + Math.PI / 6;
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, yt - yb, 12), steelF);
      rod.position.set(Math.cos(a) * FRAME_R, (yt + yb) / 2, Math.sin(a) * FRAME_R);
      this.frameRods.add(rod);
      const hang = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, yt - STAGES[0]!.y, 14), steelF);
      const ha = a + Math.PI / 3;
      hang.position.set(Math.cos(ha) * 0.5, (yt + STAGES[0]!.y) / 2, Math.sin(ha) * 0.5);
      this.frameRods.add(hang);
    }
    this.rig.add(this.frameRods);

    // the chip: a cold finger, a gold package, the silicon die and its grid of qubits
    const mxc = this.stages[NS - 1]!;
    const goldC = new THREE.MeshPhysicalMaterial({ color: gold, metalness: 1, roughness: 0.22, envMapIntensity: 1.2 });
    patch(goldC, mxc.U, true);
    const finger = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, STAGES[NS - 1]!.y - PT / 2 - (CHIP_Y + PKG / 2) + 0.01, 24), goldC);
    finger.position.y = (STAGES[NS - 1]!.y - PT / 2 + CHIP_Y + PKG / 2) / 2;
    this.chip.add(finger);
    const pkg = new THREE.Mesh(new THREE.BoxGeometry(PKG, PKG, 0.03), goldC);
    pkg.position.y = CHIP_Y;
    this.chip.add(pkg);
    const dieM = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: this.dieMap(k), metalness: 0.2, roughness: 0.18, envMapIntensity: 0.9, clearcoat: 1, clearcoatRoughness: 0.08 });
    patch(dieM, mxc.U, true);
    const die = new THREE.Mesh(new THREE.PlaneGeometry(DIE, DIE), dieM);
    die.position.set(0, CHIP_Y, FACE_Z);
    this.chip.add(die);
    const dotM = new THREE.MeshBasicMaterial({ color: 0xffffff });
    patch(dotM, { ...mxc.U, uRim: { value: 0 }, uRunAmt: { value: 0 }, uShim: { value: 0 } }, false);
    this.dots = new THREE.InstancedMesh(new THREE.CircleGeometry(DOT, 18), dotM, NG * NG);
    this.dots.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(NG * NG * 3), 3);
    this.dots.frustumCulled = false;
    for (let j = 0; j < NG; j++) for (let i = 0; i < NG; i++) this.dotHome.push([(i - (NG - 1) / 2) * PITCH, ((NG - 1) / 2 - j) * PITCH]);
    this.chip.add(this.dots);
    this.scene.add(this.chip);
    this.planKey();

    // the archive wall
    if (this.ph !== 'build') {
      const ft = this.frostTex();
      this.wallMat = new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3, vertexShader: WALL_V, fragmentShader: WALL_F,
        uniforms: {
          uSteel: { value: v3(hexToLinear(mixHex(k.bg, k.type, 0.3))) }, uFrostC: { value: v3(hexToLinear(k.accent2)) },
          uPaper: { value: v3(hexToLinear(k.type)) }, uLampC: { value: v3(hexToLinear(k.accent)) }, uKey: { value: v3(keyC as [number, number, number], 0.2) },
          uCrackC: { value: v3(hexToLinear(mixHex(k.accent, '#FFFFFF', 0.5))) },
          uAmb: { value: 0.1 }, uLamp: { value: 0.6 }, uLampAll: { value: 1 }, uFrost: { value: 1 }, uCrack: { value: 0 }, uCrackFlash: { value: 0 }, uLevel: { value: 1 }, uTime: { value: 0 },
          uHero: { value: new THREE.Vector2() }, uCrackP: { value: [] as THREE.Vector2[] }, uFrostTex: { value: ft },
        },
      });
      this.wall = new THREE.Mesh(new THREE.PlaneGeometry(16, 3.6), this.wallMat);
      this.wall.position.set(0, 1.8, WALL_Z);
      this.wall.frustumCulled = false;
      this.scene.add(this.wall);
      // the hero drawer: the cell nearest (0.35, 1.75)
      let best = 1e9;
      for (let ci = 0; ci < 60; ci++) {
        const bay = Math.floor(ci / 3), c = ci % 3;
        const x = X0 + bay * BAYW + UPW + c * CW + PANE[0];
        const d = Math.abs(x - 0.35);
        if (d < best) { best = d; this.hero = [ci, 5]; }
      }
      this.wallMat.uniforms.uHero!.value.set(this.hero[0], this.hero[1]);
      // the crack: a random walk across the body, from edge to edge, with uneven steps and kinks
      const rnd = mulberry32(23);
      let y = -0.12 * LOCK_S;
      for (let i = 0; i < NCRACK; i++) {
        const u = i / (NCRACK - 1);
        const x = lerp(-0.56, 0.56, u + (i && i < NCRACK - 1 ? (rnd() - 0.5) * 0.05 : 0)) * LOCK_S;
        if (i) y += (rnd() - 0.5) * 0.16 * LOCK_S - 0.012 * LOCK_S;
        this.crackPts.push(new THREE.Vector2(x, clamp(y, -0.5 * LOCK_S, 0.12 * LOCK_S)));
      }
      this.wallMat.uniforms.uCrackP!.value = this.crackPts;
    }

    // frost: needles of rime along the rods and the plates' undersides (cool, base)
    if (this.ph !== 'build') this.planFrost();
    const fm = this.frost.mat;
    fm.blendSrcAlpha = THREE.ZeroFactor; fm.blendDstAlpha = THREE.OneFactor; // keep the depth in alpha
  }

  private capMaps() {
    const N = 1024, mk = () => { const cv = document.createElement('canvas'); cv.width = N; cv.height = N; return cv; };
    const cc = mk(), rc = mk(), c = cc.getContext('2d')!, r = rc.getContext('2d')!;
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, N, N);
    r.fillStyle = 'rgb(150,150,150)'; r.fillRect(0, 0, N, N);
    const ctr = N / 2;
    // lathe rings
    for (let i = 0; i < 260; i++) {
      const rad = (i / 260) * ctr, v = 120 + Math.round(70 * hash(i, 3));
      r.strokeStyle = `rgb(${v},${v},${v})`; r.lineWidth = 1.2;
      r.beginPath(); r.arc(ctr, ctr, rad, 0, Math.PI * 2); r.stroke();
    }
    const hole = (x: number, y: number, rad: number, shade: string) => {
      c.fillStyle = shade; c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, rad + 2.5, 0, Math.PI * 2); c.stroke();
    };
    for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2; hole(ctr + Math.cos(a) * ctr * 0.93, ctr + Math.sin(a) * ctr * 0.93, 5, '#1a1a1a'); }
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + 0.13; hole(ctr + Math.cos(a) * ctr * 0.62, ctr + Math.sin(a) * ctr * 0.62, 9, '#202020'); }
    hole(ctr, ctr, 34, '#141414');
    c.strokeStyle = 'rgba(80,60,30,0.5)'; c.lineWidth = 3;
    c.beginPath(); c.arc(ctr, ctr, ctr * 0.78, 0, Math.PI * 2); c.stroke();
    const col = new THREE.CanvasTexture(cc); col.colorSpace = THREE.SRGBColorSpace; col.anisotropy = 8;
    const rough = new THREE.CanvasTexture(rc); rough.colorSpace = THREE.NoColorSpace; rough.anisotropy = 8;
    return { col, rough };
  }

  private dieMap(k: Look) {
    const N = 1024, cv = document.createElement('canvas');
    cv.width = N; cv.height = N;
    const c = cv.getContext('2d')!;
    c.fillStyle = mixHex('#0B0D12', k.bg, 0.3); c.fillRect(0, 0, N, N);
    // bond pads around the edge, resonator meanders, bus lines
    c.fillStyle = '#B89A5C';
    for (let i = 0; i < 24; i++) {
      const u = 70 + (i / 23) * (N - 140);
      c.fillRect(u - 9, 14, 18, 30); c.fillRect(u - 9, N - 44, 18, 30); c.fillRect(14, u - 9, 30, 18); c.fillRect(N - 44, u - 9, 30, 18);
    }
    c.strokeStyle = 'rgba(150,160,175,0.55)'; c.lineWidth = 2.5;
    const rnd = mulberry32(5);
    for (let i = 0; i < 26; i++) {
      const x = 80 + rnd() * (N - 160), y = 80 + rnd() * (N - 160), len = 6 + Math.floor(rnd() * 8), dx = rnd() < 0.5 ? 1 : -1;
      c.beginPath(); c.moveTo(x, y);
      for (let s = 0; s < len; s++) { c.lineTo(x + dx * 40, y + s * 10); c.lineTo(x, y + s * 10 + 5); }
      c.stroke();
    }
    c.strokeStyle = 'rgba(120,130,145,0.35)'; c.lineWidth = 1.5;
    for (let i = 0; i < NG; i++) {
      const u = N / 2 + (i - (NG - 1) / 2) * (PITCH / DIE) * N;
      c.beginPath(); c.moveTo(u, 60); c.lineTo(u, N - 60); c.stroke();
      c.beginPath(); c.moveTo(60, u); c.lineTo(N - 60, u); c.stroke();
    }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  }

  private frostTex() {
    const cv = document.createElement('canvas');
    cv.width = 2048; cv.height = 720;
    const c = cv.getContext('2d')!;
    c.fillStyle = '#000'; c.fillRect(0, 0, cv.width, cv.height);
    growFrost(c, cv.width, cv.height, 77);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    return t;
  }

  /** The key: a ring for its bow, a shaft, three teeth hanging below; its outline as dots, each taken by the nearest qubit. */
  private planKey() {
    const pts: [number, number][] = [];
    const bow: [number, number] = [-0.052, 0.012], br = 0.03;
    for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; pts.push([bow[0] + Math.cos(a) * br, bow[1] + Math.sin(a) * br]); }
    for (let x = -0.016; x <= 0.077; x += 0.0085) pts.push([x, 0.012]);
    for (const tx of [0.034, 0.054, 0.072]) for (let s = 1; s <= 2; s++) pts.push([tx, 0.012 - s * 0.0085]);
    this.keyPts = pts;
    this.keyDot = new Array(NG * NG).fill(-1);
    const used = new Set<number>();
    pts.forEach((p, ki) => {
      let best = -1, bd = 1e9;
      this.dotHome.forEach((h, di) => {
        if (used.has(di)) return;
        const d = Math.hypot(h[0] - p[0], h[1] - p[1]);
        if (d < bd) { bd = d; best = di; }
      });
      used.add(best); this.keyDot[best] = ki;
    });
  }

  /** Rime needles along the rods (stage i's rods hang above its plate) and under the plates' rims. */
  private planFrost() {
    const rnd = mulberry32(31);
    const add = (a: V3, b: V3, stage: number, ord: number) => this.needles.push({ a, b, y: a[1], ord, stage });
    for (let i = 1; i < NS; i++) {
      const st = STAGES[i]!, up = STAGES[i - 1]!, gap = up.y - st.y - PT;
      for (let j = 0; j < 4; j++) {
        const ang = (j / 4) * Math.PI * 2 + i * 0.4, rr = st.r * 0.88;
        const cx = Math.cos(ang) * rr, cz = Math.sin(ang) * rr;
        for (let n = 0; n < 150; n++) {
          const y = PT / 2 + rnd() * gap, phi = rnd() * Math.PI * 2, len = 0.004 + 0.016 * rnd() * rnd();
          const dx = Math.cos(phi), dz = Math.sin(phi), tilt = (rnd() - 0.6) * 0.6;
          add([cx + dx * 0.008, y, cz + dz * 0.008], [cx + dx * (0.008 + len), y + tilt * len, cz + dz * (0.008 + len)], i, rnd());
        }
      }
    }
    for (let i = 0; i < NS; i++) {
      const st = STAGES[i]!;
      for (let n = 0; n < 420; n++) {
        const phi = rnd() * Math.PI * 2, rr = st.r - 0.004 - rnd() * 0.02, len = 0.006 + 0.022 * rnd() * rnd();
        const x = Math.cos(phi) * rr, z = Math.sin(phi) * rr, lean = (rnd() - 0.5) * 0.5;
        add([x, -PT / 2, z], [x + Math.cos(phi) * lean * len, -PT / 2 - len, z + Math.sin(phi) * lean * len], i, rnd());
      }
    }
    // the cold finger
    for (let n = 0; n < 260; n++) {
      const y = CHIP_Y + PKG / 2 + rnd() * (STAGES[NS - 1]!.y - CHIP_Y - PKG / 2 - PT / 2), phi = rnd() * Math.PI * 2, len = 0.005 + 0.016 * rnd() * rnd();
      this.needles.push({ a: [Math.cos(phi) * 0.022, y, Math.sin(phi) * 0.022], b: [Math.cos(phi) * (0.022 + len), y - len * 0.3, Math.sin(phi) * (0.022 + len)], y, ord: rnd(), stage: -1 });
    }
  }

  // ------------------------------------------------------------------ state at t

  private tempAt(t: number) { return this.temps.filter((x) => x.t <= t).at(-1)!; }

  /** Kelvin of a reading like "800 mK", "4 K", "10 mK · BASE". */
  private kelvin(s: string) {
    const m = /([\d.,]+)\s*(m?K)/.exec(s);
    if (!m) return 300;
    const v = parseFloat(m[1]!.replace(',', ''));
    return m[2] === 'mK' ? v / 1000 : v;
  }

  /** Frost line on the rods (world y below which rime has grown) and its density. */
  private frostAt(t: number) {
    if (this.ph === 'build') return { y: 0, d: 0 };
    if (this.ph === 'base') return { y: 4.6, d: 1 };
    const K = this.kelvin(this.tempAt(t).s), tt = this.tempAt(t).t;
    const lvl = K >= 40 ? 2.62 : K >= 3 ? 3.05 : K >= 0.5 ? 3.36 : K >= 0.05 ? 3.62 : 3.9;
    const prev = this.temps.filter((x) => x.t < tt).at(-1);
    const pK = prev ? this.kelvin(prev.s) : K;
    const plvl = pK >= 40 ? 2.62 : pK >= 3 ? 3.05 : pK >= 0.5 ? 3.36 : pK >= 0.05 ? 3.62 : 3.9;
    return { y: lerp(plvl, lvl, ease.outCubic(prog(t, tt, tt + 1.6))), d: 1 };
  }

  private camKeys(t: number, ks: Key[]) {
    let i = 0;
    while (i < ks.length - 2 && t >= ks[i + 1]!.t) i++;
    const a = ks[i]!, b = ks[i + 1] ?? a;
    const u = b === a ? 0 : (b.e ?? ease.inOutCubic)(clamp((t - a.t) / Math.max(1e-3, b.t - a.t)));
    return { c: mix3(a.c, b.c, u), g: mix3(a.g, b.g, u), fov: lerp(a.fov ?? 32, b.fov ?? 32, u), ap: lerp(a.ap ?? 26, b.ap ?? 26, u) };
  }

  private camAt(t: number) {
    const S = this.S, E = this.E, ly = this.lyricCues();
    const lin_ = ease.linear;
    if (this.ph === 'build') {
      const c11 = ly[1]?.start ?? S + 3.7;
      return this.camKeys(t, [
        { t: S, c: [-0.45, 4.75, 5.9], g: [0, 3.2, 0] },
        { t: c11, c: [0.1, 4.7, 5.55], g: [0.05, 3.2, 0], e: lin_ },
        { t: c11 + 1.4, c: [1.15, 4.65, 5.45], g: [1.0, 3.22, 0] },
        { t: E + 0.5, c: [1.35, 4.6, 5.2], g: [1.0, 3.22, 0], e: lin_ },
      ]);
    }
    if (this.ph === 'cool') {
      const c17 = ly[1]?.start ?? S + 4.6, a17 = ly[1]?.at ?? S + 7, c18 = ly[2]?.start ?? S + 7.6, a18 = ly[2]?.at ?? S + 10.5;
      const c19 = ly[3]?.start ?? S + 11.5, hz = WALL_Z, [hx, hy] = this.heroLock();
      const span = this.dimFrom < 1e8 ? this.dimFrom : E - 5;
      const W0: Key = { t: S, c: [-0.5, 4.75, 5.9], g: [0, 3.2, 0], ap: 22 };
      return this.camKeys(t, [
        W0,
        { t: c17, c: [0.35, 4.65, 5.55], g: [0, 3.2, 0], e: lin_, ap: 22 },
        { t: a17 + 0.2, c: [0.45, 3.45, 3.2], g: [0.02, 2.75, 0], ap: 30 },
        { t: c18, c: [0.5, 3.4, 3.05], g: [0.02, 2.72, 0], e: lin_, ap: 30 },
        { t: a18 - 0.3, c: [0.35, 1.75, 4.2], g: [0.15, 1.95, hz], ap: 34 },
        { t: c19 + 0.15, c: [0.32, 1.77, 3.9], g: [0.18, 1.93, hz], e: lin_, ap: 34 },
        // the padlock framed left of centre, so the readout at the right sits on the drawer's steel, not on it
        { t: c19 + 1.5, c: [hx + 0.105, hy + 0.03, hz + 0.72], g: [hx + 0.085, hy, hz], ap: 40, e: ease.inOutQuart },
        { t: span, c: [hx + 0.1, hy + 0.025, hz + 0.6], g: [hx + 0.085, hy, hz], e: lin_, ap: 40 },
        { t: span + 1.9, c: [-0.25, 4.6, 6.0], g: [0, 3.15, 0], ap: 22, e: ease.inOutCubic },
        { t: E + 0.5, c: [0.15, 4.6, 6.2], g: [0, 3.15, 0], ap: 22, e: lin_ },
      ]);
    }
    // base
    const c25 = ly[1]?.start ?? S + 4.5, c26 = ly[2]?.start ?? S + 7.3;
    return this.camKeys(t, [
      { t: S, c: [0.45, 4.75, 6.0], g: [0, 3.2, 0], ap: 22 },
      { t: c25, c: [-0.15, 4.6, 5.4], g: [0, 3.2, 0], e: lin_, ap: 22 },
      { t: c26, c: [-0.35, 4.2, 5.5], g: [0, 2.95, 0], ap: 22 },
      { t: c26 + 1.5, c: [0.12, 3.05, 2.3], g: [0, 2.42, 0], ap: 30 },
      { t: E + 0.5, c: [0.2, 3.0, 2.15], g: [0, 2.4, 0], e: lin_, ap: 30 },
    ]);
  }

  /** World x, y of the hero drawer's padlock. */
  private heroLock(): [number, number] {
    const [ci, r] = this.hero, bay = Math.floor(ci / 3), c = ci % 3;
    return [X0 + bay * BAYW + UPW + c * CW + PANE[0], r * CH + PANE[1] + 0.004 - 0.2 * LOCK_S * 0.5];
  }

  // ------------------------------------------------------------------ the frame

  override draw() {}

  override render(f: Frame, out: THREE.WebGLRenderTarget) {
    const t = f.t, r = this.ctx.renderer, k = this.lookAt(t), a = f.a, S = this.S;
    const ph = this.ph;

    // camera
    const cam = this.camAt(t);
    this.cam.fov = cam.fov;
    this.cam.position.set(...cam.c);
    this.cam.lookAt(...cam.g);
    this.cam.updateProjectionMatrix();
    this.cam.updateMatrixWorld(true);
    const focus = Math.hypot(cam.g[0] - cam.c[0], cam.g[1] - cam.c[1], cam.g[2] - cam.c[2]);

    // the rig turns (build: from the last plate on), shivers with the bass, and on "hums"
    const spin0 = ph === 'build' ? this.bolts[NS - 1]! : S - 2;
    const spun = t - spin0;
    const yaw = 0.35 + (spun > 0 ? 0.16 * (spun - 0.9 * (1 - Math.exp(-spun / 0.9))) : 0);
    this.rig.rotation.y = yaw;
    const humA = ph === 'base' && t > this.humsAt ? Math.exp(-(t - this.humsAt) / 1.1) * smoothstep(this.humsAt, this.humsAt + 0.12, t) : 0;
    const blink = t > this.blinkAt && t < this.blinkAt + 0.16 ? 0.25 : 1;

    // stages: bolting on, rim flashes on the downbeats (top to bottom), dimming
    for (let i = 0; i < NS; i++) {
      const st = this.stages[i]!, tb = this.bolts[i]!;
      const pre = prog(t, tb - 0.22, tb, ease.inQuad);
      const vis = t >= tb - 0.22;
      st.g.visible = vis;
      const bounce = t > tb ? 0.012 * Math.exp(-(t - tb) / 0.09) * Math.cos((t - tb) * 38) : 0;
      st.g.position.y = STAGES[i]!.y - 0.14 * (1 - pre) - bounce;
      const sc = lerp(0.82, 1, pre);
      st.g.scale.set(sc, 1, sc);
      const sh = humA * 0.012 * (0.6 + 0.25 * i) * Math.sin(t * 43 + i * 1.3) + 0.0012 * a.bass * Math.sin(t * 71 + i);
      st.g.position.x = sh;
      st.g.position.z = humA * 0.008 * (0.6 + 0.25 * i) * Math.cos(t * 37 + i * 2.1);
      let rim = 0;
      if (ph === 'build') rim = 1.4 * hit(t, tb, 0.16);
      else for (const d of this.downbeats) rim = Math.max(rim, hit(t, d + i * 0.07, 0.14));
      if (ph === 'base') rim *= 0.7;
      st.U.uRim!.value = rim * (ph === 'build' ? 0.5 : 0.9);
      const dim = ph === 'cool' && this.dimTimes.length ? smoothstep(this.dimTimes[i]! - 0.06, this.dimTimes[i]! + 0.3, t) * 0.93 : 0;
      st.U.uDim!.value = dim;
      st.U.uTime!.value = t;
      // the coax: the run of light down from the top plate (base; a tube's u runs from the plate above down to
      // this one), the shimmer with the hats
      const run = ph === 'base' ? ((t - this.runFrom) / (this.claimAt - this.runFrom)) * (NS - 1) - (i - 1) : -1;
      st.coaxU.uRun!.value = run;
      st.coaxU.uRunAmt!.value = ph === 'base' && run > -0.3 && run < 1.3 ? 1.6 : 0;
      let hat = 0;
      for (const h of this.hats) if (h <= t && t - h < 0.3) hat = Math.max(hat, hit(t, h, 0.07));
      st.coaxU.uShim!.value = ph === 'build' ? 0 : 0.35 * hat * (1 - dim) + (ph === 'base' && t > this.claimAt ? 0.15 : 0);
    }

    // lights
    const kl = (ph === 'build' ? 2.2 : 1.8) * blink * (1 - 0.9 * (this.stages[0]!.U.uDim!.value as number));
    this.keyLight.intensity = kl;
    this.fillLight.intensity = kl * 0.35;
    this.scene.environmentIntensity = blink * (ph === 'build' ? 0.9 : 1.0) * (1 - 0.85 * (this.stages[2]!.U.uDim!.value as number));

    // the chip: follows the MXC plate's shiver, faces the camera; its qubits
    const mxc = this.stages[NS - 1]!.g;
    this.chip.position.set(mxc.position.x, mxc.position.y - STAGES[NS - 1]!.y, mxc.position.z);
    this.chip.visible = mxc.visible || ph !== 'build';
    this.updateDots(t, k);

    // backdrop
    const bu = this.backMat.uniforms;
    bu.uTime!.value = t;
    bu.uLamps!.value = (ph === 'build' ? 1 : 0) * blink;
    const proj = new THREE.Vector3(0, 3.3, 0).project(this.cam);
    (bu.uC!.value as THREE.Vector2).set(proj.x * 0.5 + 0.5, proj.y * 0.5 + 0.5);
    bu.uPool!.value = (1 - 0.95 * (this.stages[NS - 1]!.U.uDim!.value as number)) * (ph === 'build' ? 1.2 : 1);

    // the wall
    if (this.wall) {
      const wu = this.wallMat.uniforms;
      wu.uTime!.value = t;
      wu.uLamp!.value = ph === 'base' ? (t >= this.claimAt ? 1 : 0.55) : 0.55;
      const claim = ph === 'base' ? hit(t, this.claimAt, 0.25) : 0;
      const lastDim = this.dimTimes.length ? smoothstep(this.dimTimes[NS - 1]! - 0.2, this.dimTimes[NS - 1]! + 0.4, t) : 0;
      wu.uLampAll!.value = (1 + 3 * claim) * (1 - 0.97 * lastDim);
      wu.uLevel!.value = (1 - 0.95 * lastDim) * blink;
      wu.uCrack!.value = ph === 'cool' ? ease.outCubic(prog(t, this.crackAt - 0.04, this.crackAt + 0.22)) : 0;
      wu.uCrackFlash!.value = ph === 'cool' ? hit(t, this.crackAt + 0.18, 0.18) + 0.25 * hit(t, this.crackAt, 0.05) : 0;
    }

    // frost needles
    this.frost.clear();
    if (ph !== 'build') {
      const fr = this.frostAt(t);
      const fc = hexToLinear(k.accent2);
      const va = new THREE.Vector3(), vb = new THREE.Vector3();
      this.rig.updateMatrixWorld(true);
      this.chip.updateMatrixWorld(true);
      for (const n of this.needles) {
        const m = (n.stage >= 0 ? this.stages[n.stage]!.g : this.chip).matrixWorld;
        const wy = n.stage >= 0 ? n.y + STAGES[n.stage]!.y : n.y;
        const grow = clamp((fr.y - wy) / 0.25 - n.ord * 0.6);
        if (grow <= 0) continue;
        va.set(...n.a).applyMatrix4(m);
        vb.set(lerp(n.a[0], n.b[0], grow), lerp(n.a[1], n.b[1], grow), lerp(n.a[2], n.b[2], grow)).applyMatrix4(m);
        const dim = n.stage >= 0 ? (this.stages[n.stage]!.U.uDim!.value as number) : (this.stages[NS - 1]!.U.uDim!.value as number);
        const al = 0.55 * (1 - dim);
        this.frost.seg(va.x, va.y, va.z, vb.x, vb.y, vb.z, 0.0016, fc[0] * 0.9 + 0.1, fc[1] * 0.9 + 0.1, fc[2] * 0.9 + 0.1, al);
      }
    }

    // draw: the scene into the depth-carrying target, frost over it, depth of field into out
    clearRT(r, this.rt, [0, 0, 0], 200);
    r.setRenderTarget(this.rt);
    r.render(this.scene, this.cam);
    if (this.frost.count) this.frost.render(r, this.rt, this.cam);
    this.dof.u.tCol!.value = this.rt.texture;
    this.dof.u.uFocus!.value = focus;
    this.dof.u.uK!.value = cam.ap;
    this.dof.render(r, out);

    // callouts and readouts
    this.L.clear();
    const c = this.L.ctx;
    c.save();
    this.overlay(c, t, k, cam.g);
    c.restore();
    this.ctx.comp.draw(r, this.L.upload(), out, { mode: 'normal' });

    return { bloom: 0.5, bloomThreshold: 0.88, bloomRadius: 0.55, halation: 0.08, ca: 0.25, grain: 0.03, vignette: 0.34, hud: 0 };
  }

  /** The qubit dots: lit rows (build: a row block per plate; base: row by row to all), the key forming and falling. */
  private updateDots(t: number, k: Look) {
    const ph = this.ph, mxDim = this.stages[NS - 1]!.U.uDim!.value as number;
    const acc = hexToLinear(k.accent), off = [0.03, 0.03, 0.035];
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
    // lit rows
    let rows = NG;
    if (ph === 'build') {
      const qn = this.qsteps.filter((x) => x.t <= t).at(-1)?.n ?? 53;
      const qPrev = this.qsteps.filter((x) => x.t <= t).at(-2)?.n ?? qn;
      const at = this.qsteps.filter((x) => x.t <= t).at(-1)?.t ?? -1e9;
      const rr = (n: number) => Math.max(1, Math.ceil((NG * n) / this.qubitsMax));
      rows = lerp(rr(qPrev), rr(qn), prog(t, at, at + 0.3));
    } else if (ph === 'base') {
      const a = this.lyricCues()[0]?.at ?? this.S + 3;
      const bs = this.beats.filter((b) => b > this.S && b <= a + 0.01);
      const done = bs.filter((b) => b <= t).length;
      rows = t >= a ? NG : lerp(6, NG - 1, bs.length ? done / bs.length : 0);
    }
    // glow: build cyan, cool dim gold that flares on the second anchor, base full
    const ly = this.lyricCues();
    let gain = ph === 'build' ? 3.2 : ph === 'base' ? 4.5 : 1.2;
    if (ph === 'cool') { const a17 = ly[1]?.at ?? 1e9; gain = t >= a17 ? 4.5 + 4 * hit(t, a17, 0.2) : 1.2; }
    if (ph === 'base') gain += 3 * hit(t, ly[0]?.at ?? 1e9, 0.2);
    gain *= 1 - mxDim;
    // the key (base): gather, then fall
    const gather = ph === 'base' ? prog(t, this.humsAt + 0.15, this.humsAt + 1.1, ease.inOutCubic) : 0;
    const fall = ph === 'base' ? t - this.fallAt : -1;
    for (let i = 0; i < NG * NG; i++) {
      const [hx, hy] = this.dotHome[i]!;
      const row = Math.floor(i / NG);
      const lit = clamp(rows - row);
      const ki = this.keyDot[i]!;
      let x = hx, y = hy, z = FACE_Z + 0.0012, b = lit * gain, sc = 1;
      if (ki >= 0 && gather > 0) {
        const kp = this.keyPts[ki]!, gi = clamp(gather * 1.4 - (ki / this.keyPts.length) * 0.4);
        x = lerp(hx, kp[0], gi); y = lerp(hy, kp[1], gi);
        b = gain * (1 + 1.2 * gi);
        if (fall > 0) {
          // the key drops out of the chip and falls, turning a little
          const d = 0.12 * fall + 0.42 * fall * fall, ang = 0.5 * fall * fall + 0.15 * fall;
          const cx = 0.012, cy = 0.012;
          const rx = x - cx, ry = y - cy;
          x = cx + rx * Math.cos(ang) - ry * Math.sin(ang);
          y = cy + rx * Math.sin(ang) + ry * Math.cos(ang) - d;
          z = FACE_Z + 0.0012 + 0.05 * Math.min(1, fall * 3);
          sc = 1 + 0.15 * Math.min(1, fall * 3);
        }
      } else if (gather > 0) b = lerp(b, 0.15 * b, gather);
      p.set(x, CHIP_Y + y, z);
      m.compose(p, q, s.set(sc, sc, sc));
      this.dots.setMatrixAt(i, m);
      const on = Math.min(1, b);
      this.dots.instanceColor!.setXYZ(i, lerp(off[0]!, acc[0] * b, on), lerp(off[1]!, acc[1] * b, on), lerp(off[2]!, acc[2] * b, on));
    }
    this.dots.instanceMatrix.needsUpdate = true;
    this.dots.instanceColor!.needsUpdate = true;
  }

  // ------------------------------------------------------------------ the overlay: stage callouts, the readout

  private overlay(c: CanvasRenderingContext2D, t: number, k: Look, target: V3) {
    const ph = this.ph, mono = this.font('mono');
    // stage callouts (cool, base) from the left rim of each plate to a column at the left, while the camera is on
    // the machine
    if (ph !== 'build') {
      const tK = this.kelvin(this.tempAt(t).s);
      const show = smoothstep(-1.4, -0.4, target[2]);
      const right = new THREE.Vector3().setFromMatrixColumn(this.cam.matrixWorld, 0);
      const colX = 470;
      if (show > 0.01) {
        const sg = c.createLinearGradient(0, 0, colX + 220, 0);
        sg.addColorStop(0, k.a('bg', 0.75 * show)); sg.addColorStop(0.75, k.a('bg', 0.55 * show)); sg.addColorStop(1, k.a('bg', 0));
        c.fillStyle = sg;
        c.fillRect(0, 0, colX + 220, H);
      }
      for (let i = 0; i < NS; i++) {
        if (show <= 0.01) break;
        const st = STAGES[i]!, g = this.stages[i]!.g;
        const wp = new THREE.Vector3(g.position.x, g.position.y, g.position.z).addScaledVector(right, -st.r * 1.02);
        const sp = wp.project(this.cam);
        const sx = (sp.x * 0.5 + 0.5) * W, sy = (0.5 - sp.y * 0.5) * H;
        const dim = this.stages[i]!.U.uDim!.value as number;
        const lit = tK <= st.k * 1.0001 ? 1 : 0;
        const al = show * (1 - dim / 0.93) * clamp((this.bottom - sy) / 40) * clamp((sy - 40) / 40);
        if (al <= 0.01) continue;
        const col = lit ? k.type : k.dim;
        c.globalAlpha = al;
        c.strokeStyle = k.a(lit ? 'accent' : 'dim', lit ? 0.8 : 0.6);
        c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(colX + 16, sy); c.lineTo(sx - 14, sy); c.stroke();
        c.fillStyle = k.a(lit ? 'accent' : 'dim', 0.9);
        c.beginPath(); c.arc(sx - 10, sy, 3.5, 0, Math.PI * 2); c.fill();
        text(c, st.temp, colX, sy + 9, mono, 26, col, { align: 'right' });
        label(c, st.name, colX - measure(st.temp, mono, 26) - 18, sy + 7, mono, k.a('dim', 0.95), 18, 'right');
      }
      c.globalAlpha = 1;
    }

    // the readout at the right: the reading, the qubit count, the Q-day ETA
    const x0 = 1400, y0 = 330;
    // a soft shade of the ground behind it, so it reads over the drawers
    const sg = c.createRadialGradient(x0 + 200, y0 + 110, 40, x0 + 200, y0 + 110, 440);
    sg.addColorStop(0, k.a('bg', 0.85)); sg.addColorStop(0.6, k.a('bg', 0.6)); sg.addColorStop(1, k.a('bg', 0));
    c.fillStyle = sg;
    c.fillRect(x0 - 260, y0 - 340, 900, 900);
    label(c, ph === 'build' ? 'Frame · temperature' : 'MXC · temperature', x0, y0, mono, k.a('dim', 1), 20);
    const cur = this.tempAt(t), prev = this.temps[this.temps.indexOf(cur) - 1];
    const u = prev ? prog(t, cur.t - 0.04, cur.t + 0.16, ease.outCubic) : 1;
    const flash = prev ? hit(t, cur.t, 0.25) : 0;
    c.save();
    c.beginPath(); c.rect(x0 - 10, y0 + 14, W - x0, 96); c.clip();
    const fit = (s: string) => fitSize(s, mono, W - x0 - 96, 72, 40);
    if (prev && u < 1) text(c, prev.s, x0, y0 + 92 - 60 * u, mono, fit(prev.s), k.a('type', 1 - u));
    text(c, cur.s, x0, y0 + 92 + 60 * (1 - u), mono, fit(cur.s), mixHex(k.type, k.accent, flash));
    c.restore();
    c.fillStyle = k.a('rule', 1);
    c.fillRect(x0, y0 + 124, 400, 1.5);
    // qubits
    let qn = this.qubitsMax;
    if (ph === 'build') qn = this.qsteps.filter((x) => x.t <= t).at(-1)?.n ?? qn;
    const qt = ph === 'build' ? this.qsteps.filter((x) => x.t <= t).at(-1)?.t ?? -1e9 : -1e9;
    label(c, 'Qubits', x0, y0 + 172, mono, k.a('dim', 1), 20);
    text(c, String(qn), x0 + 400, y0 + 174, mono, 32, mixHex(k.type, k.accent, hit(t, qt, 0.25)), { align: 'right' });
    // Q-day ETA (build, from its cue)
    if (t >= this.etaFrom) {
      const ap = arriveIn(t, this.etaFrom);
      c.globalAlpha = ap;
      let s: string;
      if (t >= this.etaAt) s = this.etaText;
      else {
        const hs = this.hats.filter((h) => h >= this.etaFrom && h < this.etaAt);
        const n = hs.filter((h) => h <= t).length;
        s = `${Math.max(1, 10 - Math.round((9 * n) / Math.max(1, hs.length)))} yr`;
      }
      const fl = hit(t, this.etaAt, 0.3);
      label(c, 'Q-day ETA', x0, y0 + 226, mono, k.a('dim', 1), 20);
      text(c, s, x0 + 400, y0 + 228, mono, 32, mixHex(k.type, k.accent, t >= this.etaAt ? 0.6 + 0.4 * fl : 0), { align: 'right' });
    }
    c.globalAlpha = 1;
  }
}

// ------------------------------------------------------------------ small helpers
const arriveIn = (t: number, t0: number) => ease.outCubic(prog(t, t0, t0 + 0.3));
/** The look of the entry's first cue. */
function look0(s: HarvestRemixChandelier): Look { return s.lookAt(s.cues[0]?.start ?? 0); }
function mixHexLin(a: string, b: string, k: number) { return lin(mixHex(a, b, k)); }
