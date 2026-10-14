// Harvest Now, Decrypt Later (Banger Remix): the cold room. A three.js aisle between tall double-sided steel racks,
// each a wall of drawers with frosted glass fronts, a paper tag and a status lamp on the rail; cold strip lights hang
// over every aisle, their light pooling on the racks and smeared across a wet concrete floor, fog swallowing the far
// end and mist breathing at floor level. Behind each pane an envelope stands with its padlock; frost grows across
// the glass as branching hairlines (a texture whose second channel orders the growth). The racks repeat into a city
// grid of aisles and cross aisles, so the camera can pull out of one drawer to an endless warehouse.
//
// Phases (entry `phase`): `keep` (prechorus 1: one bay lit, drawer 0001 receives the frosted copy, the lock glints on
// the first anchor, the drawer shuts and its tag prints on the second, then the strip lights come on bay by bay);
// `harvest` (chorus 1: the full aisle with drawers open, slammed shut in a wave on the first anchor; envelopes drop
// from ceiling chutes into drawers that spring open to catch them, faster and faster, all slammed on the second; the
// camera swings round a rack end to its counter on the third; the counters roll to each cue's `count`); `gauge`
// (chorus 1 instrumental: the storage gauge hung over the aisle rolls to each cue's `value` on its anchor, a wave of
// drawers slams shut and more status lamps come on down the aisle as the archive fills); `petabytes`
// (bridge: a pullback from one drawer front to the city grid, a hanging tag swinging in); `thaw` (final chorus: a
// wall of daylight rolls down the aisle and the room turns into an ink drawing on paper, padlocks spring open in a
// chain, drawer 0001 opens and its letter unfolds, every drawer opens, pages unfold on every rack, the camera rises
// over the white city, and the light drains to a point).
//
// Rendering: the racks, trays (the drawers near the camera, which slide), strip lights, floor, cards (envelopes and
// pages, from a Canvas2D atlas) and plates (tag, counters, wall tag, Canvas2D textures) are three.js meshes with
// shared shaders (lighting, fog, the cold → daylight blend), drawn into a multisampled target and copied to `out`.
import * as THREE from 'three';
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import type { ResolvedCue } from '../engine/cues';
import { FSPass, makeRT, clearRT, SCALE } from '../engine/gl';
import { GLSL_COMMON } from '../engine/glsl/common';
import { rgba } from '../engine/palette';
import { font } from '../engine/type';
import { clamp, ease, hash, hexToLinear, keys, lerp, mulberry32, prog, smoothstep, type Key } from '../engine/util';
import { LibScene, W, H, look, mixHex, type Look } from './_lib';

export const schema: SceneSchema = {
  description: 'The cold room: a three.js aisle of steel racks of frosted glass drawers receding into fog under cold strip lights, each drawer holding a sealed envelope with a frosted padlock, the racks repeating into a city grid. keep: drawer 0001 receives the copy, glints, shuts and prints its tag; harvest: drawers slam in waves, envelopes drop from ceiling chutes, rack-end counters climb; gauge: a storage gauge hung over the aisle rolls up as more lamps come on; petabytes: a pullback from one drawer to the endless grid; thaw: daylight sweeps the aisle, padlocks spring open, letters unfold, the camera rises over a white city of open drawers. Harvest remix.',
  kinds: ['song'],
  lyrics: 'layer',
  entry: {
    phase: { type: 'string', enum: ['keep', 'harvest', 'gauge', 'petabytes', 'thaw'], default: 'keep', description: 'keep: the first drawer filed and shut; harvest: the archive filling; gauge: the storage gauge over the aisle rolling up; petabytes: the pullback to the city grid; thaw: daylight, every lock open' },
    tag: { type: 'string', default: '0001 · TUE 2021-03-09', description: 'the tag of drawer 0001 (its date heads the unfolded letter in the thaw)' },
    wallTag: { type: 'string', default: '', description: 'petabytes: the hanging tag that swings into view' },
    title: { type: 'string', default: 'Cold storage · used', description: 'gauge: the kicker over the reading' },
    unit: { type: 'string', default: ' PB', description: 'gauge: after the number' },
    decimals: { type: 'number', default: 1, description: 'gauge: decimal places of the reading' },
  },
  cue: {
    drawer: { type: 'string', default: '0001', description: 'the drawer the cue is about (drawer 0001 is the Tuesday envelope)' },
    tag: { type: 'string', default: '', description: 'keep: the tag drawer 0001 prints on this cue\'s anchor' },
    count: { type: 'string', default: '', description: 'harvest: the rack-end drawer counter this cue rolls to by its anchor' },
    wallTag: { type: 'string', default: '', description: 'petabytes: the hanging tag (overrides the entry\'s)' },
    value: { type: 'number', default: 0, description: 'gauge: the reading this cue rolls to on its anchor' },
    label: { type: 'string', default: '', description: 'gauge: what the reading is, under the number (keeps the previous one if empty)' },
  },
  example: { entry: { phase: 'harvest' }, cues: [{ count: '00412' }, { count: '01930' }, { count: '08811' }] },
};

interface P { phase: 'keep' | 'harvest' | 'gauge' | 'petabytes' | 'thaw'; tag: string; wallTag: string; title: string; unit: string; decimals: number }
interface C { drawer: string; tag: string; count: string; wallTag: string; value: number; label: string }

type V3 = [number, number, number];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => mul(a, 1 / (Math.hypot(...a) || 1));
const mix3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

// ------------------------------------------------------------------ the world (metres; the aisle runs along -z, s = -z)
const A = 1.25; // half the aisle: rack faces at x = ±A around aisle 0
const RD = 1.1; // rack depth (double-sided)
const P = 2 * A + RD; // row pitch (aisle centres at x = n * P)
const CW = 0.7, CH = 0.36, Y0 = 0.2, NROW = 8, RH = 3.2; // drawer cell, plinth, rows, rack height
const UP = 0.08, BAYW = 2.18, NBAY = 7, BL = NBAY * BAYW + UP, BP = 18.5; // uprights, bays (3 cells), block, block pitch
const COLS = NBAY * 3;
const LY = 3.7, CHUTE_Y = 4.45, CEIL_Y = 4.5; // strip lights, ceiling chutes, the ceiling
const NB_NEAR = 5, NEAR_S = NB_NEAR * BP; // blocks of aisle 0 whose drawers are trays
const NSEG = 56; // strip segments (bays) of aisle 0 with their own level
const TD = 0.55, TW = CW - 0.014, TH = CH - 0.014; // tray
const R0 = -48, R1 = 130, B0 = -6, B1 = 41; // rack rows R0..R1-1 (far out to +x, where the pullback looks), blocks B0..B1
const NTRAY = 2 * NB_NEAR * COLS * NROW;
const NCARD = 9000;
const ENV: [number, number] = [0.56, 0.35]; // envelope card
const PAGE: [number, number] = [0.36, 0.48]; // letter page
const LOCKV = 35; // m/s: the chain of padlocks springing open
const GZ = -9.2, GY = 2.75, GW = 2.1, GH = GW * 600 / 1024; // the gauge hung over aisle 0 (centre z, y; size)

const f3 = (x: number) => x.toFixed(4);
const CONST = /* glsl */ `
const float A = ${f3(A)}, RD = ${f3(RD)}, P = ${f3(P)};
const float CW = ${f3(CW)}, CH = ${f3(CH)}, Y0 = ${f3(Y0)}, NROW = ${NROW}.0, RH = ${f3(RH)};
const float UP = ${f3(UP)}, BAYW = ${f3(BAYW)}, NBAY = ${NBAY}.0, BL = ${f3(BL)}, BP = ${f3(BP)};
const float LY = ${f3(LY)}, NEAR_S = ${f3(NEAR_S)};
const float TD = ${f3(TD)}, TW = ${f3(TW)}, TH = ${f3(TH)};
`;

// shading shared by every mesh: the strip lights, the drawer front, fog and mist, the cold → daylight blend
const WORLD = /* glsl */ `
uniform vec3 uCam; uniform float uTime;
uniform vec3 uSteel, uStrip, uLampC, uFrostC, uPaperC, uFogC, uMistC;
uniform vec3 uDay, uInk, uRed, uFogDay;
uniform float uFogDen, uFogDenDay, uMist, uAmb, uFront, uOther, uSegLo, uSegHi, uLevel;
uniform float uLampAll, uFill, uFarOpen, uLockT, uFrostAll, uTwinkle;
uniform float uSeg[${NSEG}];
uniform sampler2D uFrostTex; uniform sampler2D uAtlas;

float thawAt(float s) { return sat((s - uFront) / 5.0 + 0.5); }
float segAt(float i) { return i < 0.0 ? uSegLo : i >= ${NSEG}.0 ? uSegHi : uSeg[int(i)]; }
/** Light level of the strip over aisle ai at s (bay segments on aisle 0, falling off over the cross aisles). */
float stripLevel(float ai, float s) {
  float b = floor(s / BP), w = s - b * BP;
  float inb = 1.0 - 0.8 * smoothstep(0.0, 1.4, min(w - BL, BP - w));
  float lv = uOther;
  if (abs(ai) < 0.5) {
    float u = b * NBAY + clamp((w - UP * 0.5) / BAYW, 0.0, NBAY - 0.001) - 0.5;
    float i0 = floor(u);
    lv = mix(segAt(i0), segAt(i0 + 1.0), smoothstep(0.0, 1.0, u - i0));
  }
  return lv * inb * uLevel;
}
/** A surface lit by the nearest aisle's strip light (a line along z at height LY), plus a little ambient. */
vec3 coldLight(vec3 p, vec3 n, vec3 alb, float spec) {
  float xa = abs(n.x) > 0.5 ? p.x + n.x * A : floor(p.x / P + 0.5) * P;
  float lv = stripLevel(floor(xa / P + 0.5), -p.z);
  vec3 L = vec3(xa - p.x, LY - p.y, 0.0);
  float d2 = max(dot(L, L), 1e-3);
  vec3 l = L * inversesqrt(d2);
  float diff = sat((dot(n, l) + 0.3) / 1.3) / (1.0 + 0.2 * d2);
  vec3 v = normalize(uCam - p), h = normalize(l + v);
  float sp = pow(max(dot(n, h), 0.0), 36.0) * spec / (1.0 + 0.12 * d2);
  return alb * (uAmb + uStrip * lv * 2.2 * diff) + uStrip * lv * sp;
}
/** Fog toward the room's air (cold, or daylight where the thaw has passed) and the mist on the floor, lit by the strips. */
vec3 finish(vec3 col, vec3 p, float th) {
  float d = length(p - uCam);
  float fa = 1.0 - exp(-d * mix(uFogDen, uFogDenDay, th));
  col = mix(col, mix(uFogC, uFogDay, th), fa);
  if (uMist > 0.0 && th < 1.0) {
    float lit = 0.12 + stripLevel(floor(p.x / P + 0.5), -p.z);
    float m = exp(-max(p.y, 0.0) / 0.5) * (0.5 + 0.5 * fbm(vec3(p.xz * 0.32, uTime * 0.08), 3));
    col += uMistC * m * uMist * lit * (1.0 - th) * (1.0 - exp(-d * 0.18));
  }
  return col;
}
float fillAA(float d, float px) { return 1.0 - smoothstep(-px, px, d); }
/** A padlock, body width s, its body centred a little below the origin; open (0..1) lifts and turns the shackle. */
float sdLock(vec2 p, float s, float open) {
  float body = sdBox(p - vec2(0.0, -0.2 * s), vec2(0.5 * s, 0.38 * s) - 0.1 * s) - 0.1 * s;
  float R = 0.28 * s, th = 0.075 * s, hL = 0.14 * s, lift = 0.3 * s * open;
  vec2 q = p - vec2(-R, 0.18 * s + lift);
  q.x /= max(cos(1.15 * open), 0.25);
  float legL = sdSegment(q, vec2(0.0, -0.3 * s - lift), vec2(0.0, hL));
  float legR = sdSegment(q, vec2(2.0 * R, 0.0), vec2(2.0 * R, hL));
  vec2 c = q - vec2(R, hL);
  float arc = c.y > 0.0 ? abs(length(c) - R) : 1e5;
  return min(body, min(min(legL, legR), arc) - th);
}
/** The atlas: tile i's content rect (envelopes 0..2 landscape, pages 3.. portrait), uv 0..1 y down. */
vec2 tileSize(float i) { return (i < 2.5 ? vec2(1.0, 0.62) : vec2(0.75, 1.0)) / vec2(4.0, 2.0); }
vec2 tileUV(float i, vec2 uv) {
  i = floor(i + 0.5); // an interpolated index can arrive as 3.9999
  float col = mod(i, 4.0), row = floor(i / 4.0);
  vec2 sz = i < 2.5 ? vec2(1.0, 0.62) : vec2(0.75, 1.0);
  return (vec2(col, row) + (1.0 - sz) * 0.5 + clamp(uv, 0.002, 0.998) * sz) / vec2(4.0, 2.0);
}
/** The atlas at tile i, uv in its content rect, with the uv's screen derivatives given (taken in uniform flow). */
vec3 atlas(float i, vec2 uv, vec2 dx, vec2 dy) {
  vec2 s = tileSize(i);
  return textureGrad(uAtlas, tileUV(i, uv), dx * s, dy * s).rgb;
}

struct Shade { vec3 alb; vec3 emis; float spec; vec3 day; };
/**
 * A drawer front, q in metres in its cell (x left to right as seen from the aisle, y up): a steel plate, a glass pane
 * with an envelope and its padlock behind it under frost, a paper tag and a handle on the rail, the status lamp.
 * cavity: the cell of a tray (the tray is the front; the face shows the dark hole); env: an envelope stands behind
 * the glass. day: the same in ink on paper. Fine detail fades out first (lod), then the whole front to its average
 * (far); the lamp stays a point of light down to a pixel or two, so a far wall of drawers reads as lit windows.
 */
Shade drawerFront(vec2 q, float seed, float frost, float lamp, float lock, float px, float cavity, float env) {
  Shade o;
  float lod = smoothstep(0.003, 0.012, px), far = smoothstep(0.035, 0.12, px);
  vec2 hc = vec2(CW, CH) * 0.5;
  float dCell = sdBox(q - hc, hc - 0.007);
  float dGlass = sdBox(q - vec2(0.35, 0.216), vec2(0.306, 0.113)) - 0.004;
  float dTag = sdBox(q - vec2(0.235, 0.048), vec2(0.19, 0.026));
  float dHandle = sdBox(q - vec2(0.53, 0.048), vec2(0.04, 0.005)) - 0.004;
  vec2 lc = vec2(0.64, 0.048);
  float dLed = length(q - lc) - 0.011;
  vec2 pq = q - vec2(0.35, 0.216);
  float dEnv = sdBox(pq - vec2(0.0, -0.012), vec2(0.19, 0.08)) - 0.003;
  float dLk = sdLock(pq - vec2(0.0, 0.016), 0.05, lock);
  float fCell = fillAA(dCell, px), fGlass = fillAA(dGlass, px), fTag = fillAA(dTag, px);
  float fHandle = fillAA(dHandle, px), fLed = fillAA(dLed, px), fEnv = fillAA(dEnv, px) * env, fLk = fillAA(dLk, px) * env;
  float rL = max(0.011, px * 1.1);
  float fLedFar = fillAA(length(q - lc) - rL, px) * pow(0.011 / rL, 1.1);
  // the tag's typed line (glyph-like marks)
  float gx = (q.x - 0.062) / 0.0128, gi = floor(gx);
  float len = 12.0 + floor(fract(seed * 13.7) * 9.0);
  float tx = step(0.0, gi) * step(gi, len) * step(0.2, fract(gx)) * step(fract(gx), 0.82) * step(0.22, hash12(vec2(gi, floor(seed * 997.0))))
    * step(abs(q.y - 0.048), 0.0085) * (1.0 - lod);
  // ---- cold
  vec3 alb = uSteel;
  vec3 behind = mix(uSteel * 0.16, uPaperC * 0.36, fEnv);
  behind = mix(behind, mix(uPaperC, uFrostC, 0.5) * 0.5, fLk);
  vec2 fuv = pq / vec2(0.62, 0.234) + 0.5;
  if (fract(seed * 7.13) > 0.5) fuv.x = 1.0 - fuv.x;
  if (fract(seed * 3.71) > 0.5) fuv.y = 1.0 - fuv.y;
  vec4 ft = texture(uFrostTex, fuv);
  float line = ft.r * smoothstep(ft.g, ft.g + 0.03, frost);
  float edgeIn = 1.0 - smoothstep(0.0, 0.015 + 0.07 * frost, -dGlass);
  float haze = frost * (0.22 + 0.78 * edgeIn);
  vec3 glass = mix(behind, uFrostC * 0.36, sat(haze * 0.8)) + uFrostC * line * (0.16 + 0.22 * edgeIn) * (1.0 - lod);
  // the bevel of the plate catches the light along its top edge; the pane sits in a dark recess
  float bevel = (1.0 - smoothstep(0.0, 0.006, abs(q.y - (CH - 0.012)))) * fCell;
  alb *= 1.0 + 0.8 * bevel;
  alb = mix(alb, uSteel * 0.25, (1.0 - smoothstep(0.0, 0.006, abs(dGlass + 0.002))) * 0.8);
  alb = mix(alb, glass, fGlass);
  alb = mix(alb, mix(uPaperC * 0.42, uSteel * 0.3, tx), fTag);
  alb = mix(alb, vec3(0.003), fHandle);
  alb = mix(alb, uSteel * 0.25, fLed);
  alb = mix(vec3(0.003), alb, fCell);
  float glow = exp(-dot(q - lc, q - lc) / 0.009) * (0.3 + 0.7 * sat(haze));
  vec3 em = uLampC * lamp * 0.7 * glow * fGlass;
  float glassAvg = 0.55;
  vec3 avgA = uSteel * 0.4 + glassAvg * mix(mix(uSteel * 0.16, uPaperC * 0.36, 0.4 * env), uFrostC * 0.36, sat(frost * 0.7)) + 0.05 * uPaperC * 0.42;
  o.alb = mix(alb, avgA, far);
  o.emis = (mix(em, uLampC * lamp * 0.03, far) + uLampC * lamp * 5.0 * mix(fLed, fLedFar, lod)) * (1.0 - cavity);
  o.spec = mix(0.3, 0.9, fGlass * (1.0 - far));
  o.alb = mix(o.alb, vec3(0.005), fCell * cavity);
  // ---- day: ink on paper, the glass clear, the padlock open, a broken red seal
  vec3 dy = mix(uDay * 0.35, uDay, fCell);
  vec3 gl = mix(uDay * 0.9, uDay, fEnv * 0.8);
  float flap = min(sdSegment(pq, vec2(-0.19, 0.068), vec2(0.0, -0.004)), sdSegment(pq, vec2(0.19, 0.068), vec2(0.0, -0.004)));
  float envInk = max(pxLine(abs(dEnv) / px, 0.4, 1.4) * 0.75, pxLine(flap / px, 0.3, 1.2) * 0.5 * fEnv);
  gl = mix(gl, uInk, envInk);
  gl = mix(gl, uInk, fLk);
  vec2 sq = pq - vec2(0.05, -0.03);
  float seal = fillAA(length(sq) - 0.012, px) * step(0.0018, abs(sq.x + sq.y * 0.35)) * step(0.5, lock) * env;
  gl = mix(gl, uRed, seal);
  dy = mix(dy, gl, fGlass);
  dy = mix(dy, mix(uDay, uInk, tx * 0.8), fTag);
  dy = mix(dy, uInk, fHandle);
  float ink = max(pxLine(abs(dCell) / px, 0.5, 1.5), pxLine(abs(dGlass) / px, 0.5, 1.5));
  ink = max(ink, max(pxLine(abs(dTag) / px, 0.4, 1.3) * 0.8, pxLine(abs(dLed) / px, 0.4, 1.3) * 0.7));
  dy = mix(dy, uInk, ink);
  dy = mix(dy, mix(uDay, uInk, 0.16), far);
  o.day = mix(dy, uDay * 0.4, fCell * cavity);
  return o;
}
/** Daylight shading: flat paper light, a little darker toward the floor. */
vec3 dayLight(vec3 c, vec3 p, vec3 n) { return c * (0.93 + 0.07 * n.y) * mix(0.84, 1.0, smoothstep(0.0, 0.9, p.y)); }
`;

const HEAD_V = `precision highp float;\nprecision highp int;\nuniform mat4 projectionMatrix; uniform mat4 viewMatrix;\n${CONST}`;
const HEAD_F = `precision highp float;\nprecision highp int;\nout vec4 fragColor;\n${GLSL_COMMON}\n${CONST}\n${WORLD}`;

// the racks: instanced boxes; their long sides are walls of drawers
const RACK_V = /* glsl */ `
in vec3 position; in vec3 normal; in vec3 iB; in vec3 iS;
out vec3 vW; out vec3 vN; out vec3 vL; out vec3 vS;
void main() {
  vL = position; vS = iS; vN = normal;
  vW = iB + position * iS;
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0);
}`;
const RACK_F = /* glsl */ `
in vec3 vW; in vec3 vN; in vec3 vL; in vec3 vS;
void main() {
  vec3 p = vW, n = normalize(vN);
  float s = -p.z, th = thawAt(s);
  float px = max(length(dFdx(p)), length(dFdy(p)));
  vec3 e3 = (0.5 - abs(vL)) * vS;
  float edge = abs(n.x) > 0.5 ? min(e3.y, e3.z) : abs(n.y) > 0.5 ? min(e3.x, e3.z) : min(e3.x, e3.y);
  vec3 alb = uSteel * 0.7, emis = vec3(0.0), day = uDay;
  float spec = 0.3, dayInk = pxLine(edge / px, 0.7, 1.7);
  if (abs(n.x) > 0.5) {
    float b = floor(s / BP), w = s - b * BP;
    float bay = min(floor(w / BAYW), NBAY - 1.0), wb = w - bay * BAYW;
    float c = floor((wb - UP) / CW);
    bool post = wb < UP || c > 2.0;
    if (post || p.y < Y0 || p.y >= Y0 + NROW * CH) {
      alb = post ? uSteel * 1.3 : p.y < Y0 ? uSteel * 0.4 : uSteel * 0.9;
      spec = 0.6;
      day = mix(uDay, uInk, post ? 0.88 : p.y < Y0 ? 0.55 : 0.8);
    } else {
      float nr = floor((p.x - n.x * 0.02) / P);
      bool near = s >= 0.0 && s < NEAR_S && ((nr == 0.0 && n.x < 0.0) || (nr == -1.0 && n.x > 0.0));
      float us = wb - UP - c * CW, r = floor((p.y - Y0) / CH);
      vec2 q = vec2(n.x < 0.0 ? CW - us : us, p.y - Y0 - r * CH);
      vec3 id = vec3(nr * 2.0 + step(0.0, n.x), b * 21.0 + bay * 3.0 + c, r);
      float seed = hash13(id * vec3(1.0, 1.0, 1.0) + vec3(0.37, 0.71, 0.13));
      float seed2 = hash13(id.zxy + vec3(5.1, 2.3, 9.7));
      float lamp = uLampAll * step(seed2, uFill) * (0.8 + 0.2 * sin(uTime * 2.3 + seed * 50.0)) * (1.0 + uTwinkle * step(0.8, fract(seed * 17.0)));
      float lt = uLockT + max(s, 0.0) / ${LOCKV.toFixed(1)} + seed * 0.08;
      float lock = th * smoothstep(lt, lt + 0.16, uTime);
      Shade sh = drawerFront(q, seed, uFrostAll * (1.0 - th), lamp, lock, px, near ? 1.0 : 0.0, 1.0);
      alb = sh.alb; emis = sh.emis; spec = sh.spec; day = sh.day;
      if (!near && uFarOpen > 0.0) {
        // far drawers opened in the daylight: the dark of the slot, a page standing up in it
        float far = smoothstep(0.035, 0.12, px), dp = sdBox(q - vec2(0.35, 0.2), vec2(0.15, 0.12));
        vec3 od = mix(uDay * 0.45, uDay, fillAA(dp, px));
        od = mix(od, uInk, pxLine(abs(dp) / px, 0.4, 1.4));
        day = mix(day, mix(od, mix(uDay, uInk, 0.2), far), uFarOpen);
      }
    }
  } else if (n.y > 0.5) {
    alb = uSteel * 0.55; spec = 0.2;
  } else {
    alb = uSteel * 0.85; spec = 0.45;
    float seam = pxLine(abs(fract(vL.x * 3.0) - 0.5) * vS.x / 3.0 / px, 0.4, 1.2);
    alb *= 1.0 - 0.5 * seam;
  }
  day = mix(day, uInk, dayInk);
  vec3 cold = coldLight(p, n, alb, spec) + emis;
  fragColor = vec4(finish(mix(cold, dayLight(day, p, n), th), p, th), 1.0);
}`;

// the trays: the drawers of aisle 0's two walls near the camera, which slide out
const TRAY_V = /* glsl */ `
in vec3 position; in vec3 normal; in vec3 iPos; in float iNx; in vec4 iSt; in vec2 iEx;
out vec3 vW; out vec3 vN; out vec3 vL; out vec3 vLN; out vec4 vSt; out vec2 vEx; out float vNx;
void main() {
  vec3 lp = position;
  float fx = iPos.x + iNx * (iSt.x + 0.004);
  vW = vec3(fx + iNx * (lp.x - 0.5) * TD, iPos.y + lp.y * TH, iPos.z + lp.z * TW);
  vN = vec3(normal.x * iNx, normal.y, normal.z);
  vL = lp; vLN = normal; vSt = iSt; vEx = iEx; vNx = iNx;
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0);
}`;
const TRAY_F = /* glsl */ `
in vec3 vW; in vec3 vN; in vec3 vL; in vec3 vLN; in vec4 vSt; in vec2 vEx; in float vNx;
void main() {
  vec3 p = vW, n = normalize(vN);
  float s = -p.z, th = thawAt(s);
  float px = max(length(dFdx(p)), length(dFdy(p)));
  vec3 alb = uSteel * 0.6, emis = vec3(0.0), day = uDay * 0.8;
  float spec = 0.3;
  // the card lying in the tray (its uv's derivatives taken here, outside the branches)
  vec2 m = vec2((0.5 - vNx * vL.z) * TW, (0.5 - vL.x) * TD);
  vec2 cs = vEx.x < 2.5 ? vec2(${f3(ENV[0])}, ${f3(ENV[1])}) : vec2(${f3(PAGE[0])}, ${f3(PAGE[1])});
  vec2 cu = (m - vec2(TW * 0.5, 0.022 + cs.y * 0.5)) / cs;
  vec2 cuv = vec2(cu.x + 0.5, 0.5 - cu.y), cdx = dFdx(cuv), cdy = dFdy(cuv);
  if (vLN.x > 0.5) {
    vec2 q = vec2((vNx < 0.0 ? 0.5 + vL.z : 0.5 - vL.z) * TW + 0.007, (vL.y + 0.5) * TH + 0.007);
    Shade sh = drawerFront(q, abs(vEx.y), vSt.z * (1.0 - th), vSt.y, vSt.w, px, 0.0, step(0.0, vEx.y));
    alb = sh.alb; emis = sh.emis; spec = sh.spec; day = sh.day;
  } else if (vLN.y > 0.5) {
    // the open top: a steel rim, the dark inside, the envelope or page lying in it
    float rim = min(min(m.x, TW - m.x), min(m.y, TD - m.y));
    float fr = fillAA(0.016 - rim, px);
    alb = mix(uSteel * (0.03 + 0.05 * smoothstep(0.016, 0.1, rim)), uSteel * 1.2, fr);
    spec = 0.6 * fr;
    day = mix(uDay * 0.55, uDay, fr);
    day = mix(day, uInk, pxLine(abs(rim - 0.016) / px, 0.4, 1.4));
    if (vEx.x >= 0.0) {
      float inCard = fillAA(sdBox(cu, vec2(0.5)) * min(cs.x, cs.y), px);
      vec3 tx = atlas(vEx.x, cuv, cdx, cdy);
      alb = mix(alb, tx * 0.85, inCard);
      day = mix(day, tx, inCard);
    }
  } else {
    alb = uSteel * 0.5;
    vec3 e3 = (0.5 - abs(vL)) * vec3(TD, TH, TW);
    float edge = abs(vLN.y) > 0.5 ? min(e3.x, e3.z) : min(e3.x, e3.y);
    day = mix(uDay * 0.9, uInk, pxLine(edge / px, 0.6, 1.6));
  }
  vec3 cold = coldLight(p, n, alb, spec) + emis;
  fragColor = vec4(finish(mix(cold, dayLight(day, p, n), th), p, th), 1.0);
}`;

// strip lights (type 0), ceiling chutes (1), steel rods (2): instanced boxes
const STRIP_V = /* glsl */ `
in vec3 position; in vec3 normal; in vec3 iB; in vec3 iS; in float iK;
out vec3 vW; out vec3 vN; out vec3 vL; out float vK;
void main() {
  vL = position; vN = normal; vK = iK;
  vW = iB + position * iS;
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0);
}`;
const STRIP_F = /* glsl */ `
in vec3 vW; in vec3 vN; in vec3 vL; in float vK;
uniform float uChute;
void main() {
  vec3 p = vW, n = normalize(vN);
  float s = -p.z, th = thawAt(s);
  vec3 col = uSteel * 0.08, day = uInk;
  if (vK < 0.5) {
    float lv = stripLevel(floor(p.x / P + 0.5), s);
    float w = s - floor(s / BP) * BP, wb = mod(w - UP, BAYW);
    float tube = smoothstep(0.08, 0.16, wb) * smoothstep(BAYW - 0.02, BAYW - 0.1, wb);
    if (n.y < -0.5) col += uStrip * lv * 6.0 * tube;
    else col += uStrip * lv * 0.4 * tube;
    day = mix(uDay, uInk, 0.85);
  } else if (vK < 1.5) {
    // a chute mouth: a dark square, its rim catching the light
    vec2 e = 0.5 - abs(vL.xz);
    float rim = 1.0 - smoothstep(0.03, 0.08, min(e.x, e.y));
    col = uSteel * 0.05 + uStrip * rim * 0.5 * uChute * (n.y < -0.5 ? 1.0 : 0.3);
    day = mix(uDay, uInk, 0.7);
  } else {
    col = coldLight(p, n, uSteel * 0.9, 0.5);
  }
  fragColor = vec4(finish(mix(col, day, th), p, th), 1.0);
}`;

// the floor: wet concrete, aisle lines, the strip lights smeared in its sheen
const FLOOR_V = /* glsl */ `
in vec3 position;
out vec3 vW;
void main() { vW = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }`;
const FLOOR_F = /* glsl */ `
in vec3 vW;
void main() {
  vec3 p = vW;
  float s = -p.z, th = thawAt(s);
  float px = max(length(dFdx(p)), length(dFdy(p)));
  float nz = fbm(p.xz * 0.7, 3) * 0.5 + 0.5;
  vec3 alb = uSteel * (0.22 + 0.14 * nz);
  float xa = floor(p.x / P + 0.5) * P, dx = abs(p.x - xa);
  float mark = 1.0 - smoothstep(0.012, 0.012 + px * 1.5, abs(dx - (A - 0.16)));
  alb = mix(alb, uPaperC * 0.3, mark * 0.5);
  vec3 cold = coldLight(p, vec3(0.0, 1.0, 0.0), alb, 0.0);
  vec3 cm = vec3(uCam.x, -uCam.y, uCam.z), rd = p - cm;
  vec3 q = p + rd * ((LY - p.y) / max(rd.y, 1e-3));
  float qa = floor(q.x / P + 0.5) * P;
  float refl = exp(-pow((q.x - qa) / 0.2, 2.0)) * stripLevel(floor(q.x / P + 0.5), -q.z) * (0.5 + 0.5 * nz);
  cold += uStrip * refl * 0.35 / (1.0 + length(p - uCam) * 0.02);
  vec3 day = uDay * 0.97;
  day = mix(day, uInk, (1.0 - smoothstep(0.006, 0.006 + px * 1.2, abs(dx - (A - 0.16)))) * 0.35);
  fragColor = vec4(finish(mix(cold, dayLight(day, p, vec3(0.0, 1.0, 0.0)), th), p, th), 1.0);
}`;

// the ceiling over the aisles (keep, harvest): dark panels, light pooling around the strips
const CEIL_F = /* glsl */ `
in vec3 vW;
void main() {
  vec3 p = vW;
  float px = max(length(dFdx(p)), length(dFdy(p)));
  vec3 alb = uSteel * (0.1 + 0.05 * (fbm(p.xz * 0.5, 2) * 0.5 + 0.5));
  vec2 g = 0.6 - abs(fract(p.xz / 1.2) - 0.5) * 1.2;
  alb *= 1.0 - 0.6 * (1.0 - smoothstep(0.0, px * 1.5 + 0.004, min(g.x, g.y)));
  fragColor = vec4(finish(coldLight(p, vec3(0.0, -1.0, 0.0), alb, 0.0), p, 0.0), 1.0);
}`;

// cards: envelopes and pages from the atlas (instanced quads, iU / iV half-extents)
const CARD_V = /* glsl */ `
in vec3 position; in vec3 iC; in vec3 iU; in vec3 iV; in vec4 iR; in vec4 iFx; in float iT;
out vec2 vUv; out vec3 vW; out vec3 vN; out vec4 vFx; out float vT;
void main() {
  vW = iC + iU * position.x * 2.0 + iV * position.y * 2.0;
  vUv = vec2(mix(iR.x, iR.z, position.x + 0.5), mix(iR.y, iR.w, 0.5 - position.y));
  vN = normalize(cross(iU, iV)); vFx = iFx; vT = iT;
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0);
}`;
const CARD_F = /* glsl */ `
in vec2 vUv; in vec3 vW; in vec3 vN; in vec4 vFx; in float vT;
void main() {
  vec2 dx = dFdx(vUv), dy = dFdy(vUv);
  vec3 n = normalize(vN);
  bool back = dot(n, uCam - vW) < 0.0;
  if (back) n = -n;
  vec3 tx = atlas(vT, back ? vec2(0.03, 0.97) : vUv, dx, dy);
  if (vFx.z < 0.999 && hash12(FRAG_PX + fract(uTime * 7.0) * 113.0) > vFx.z) discard;
  float th = max(thawAt(-vW.z), vFx.y);
  vec3 cold = coldLight(vW, n, tx, 0.25) + tx * uAmb * 2.0;
  if (vFx.x > -1.0) {
    // the glint: one bright streak across the padlock
    vec2 dl = (vUv - vec2(0.5, 0.56)) * vec2(1.6, 1.0);
    float band = exp(-pow(vUv.x * 0.8 + vUv.y * 0.6 - (0.6 + vFx.x * 1.3), 2.0) / 0.002);
    cold += mix(uFrostC, vec3(1.0), 0.5) * 9.0 * band * exp(-dot(dl, dl) / 0.014) * exp(-max(vFx.x, 0.0) * 1.8);
  }
  fragColor = vec4(finish(mix(cold, tx, th), vW, th), 1.0);
}`;

// plates: a Canvas2D texture on a quad (the tag, the counters, the wall tag)
const PLATE_V = /* glsl */ `
in vec3 position; in vec2 uv; uniform mat4 modelMatrix;
out vec2 vUv; out vec3 vW;
void main() { vUv = uv; vW = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }`;
const PLATE_F = /* glsl */ `
in vec2 vUv; in vec3 vW;
uniform sampler2D uTex; uniform float uGain; uniform float uDayP;
void main() {
  vec3 c = texture(uTex, vUv).rgb;
  float th = max(thawAt(-vW.z), uDayP);
  fragColor = vec4(finish(c * mix(uGain, 1.0, th), vW, th), 1.0);
}`;

// the light draining to a point (thaw, at the end)
const DRAIN = /* glsl */ `
uniform float uR; uniform vec3 uCol;
void main() {
  vec2 p = (FRAG_PX - vec2(${(W / 2).toFixed(1)}, ${(H / 2).toFixed(1)})) / ${H.toFixed(1)};
  float d = length(p);
  fragColor = vec4(uCol, smoothstep(uR, uR + 0.03 + uR * 0.7, d));
}`;

// ------------------------------------------------------------------ frost (branching ice), grown into a texture
const FSTEP = [0.02, 0.015, 0.011], FSPACE = [0.05, 0.035], FRATIO = [0.4, 0.45], FMAX = [0.2, 0.06], FWIG = [0.12, 0.16, 0.2];
/** Segments (u0, v0, u1, v1, s0, level) of a crystal grown from (u, v) at angle a inside [0, w] x [0, h]. */
function grow(out: number[], rnd: () => number, u: number, v: number, a: number, len: number, lvl: number, s: number, w: number, h: number) {
  const st = FSTEP[lvl]!, n = Math.max(1, Math.round(len / st));
  const curve = (rnd() - 0.5) * (lvl ? 1.0 : 0.3);
  let next = FSPACE[lvl] !== undefined ? FSPACE[lvl]! * (0.4 + rnd()) : Infinity, alt = rnd() < 0.5 ? 1 : -1;
  for (let i = 0; i < n; i++) {
    a += curve * st + (rnd() - 0.5) * FWIG[lvl]!;
    const nu = u + Math.cos(a) * st, nv = v + Math.sin(a) * st;
    if (nu < 0 || nu > w || nv < 0 || nv > h) return;
    out.push(u, v, nu, nv, s, lvl);
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

// ------------------------------------------------------------------ the scene

interface Tray { x: number; y: number; z: number; s: number; nx: number; wall: number; b: number; col: number; row: number; h1: number; h2: number; h3: number; h4: number }
interface Drop { tray: number; tc: number; t0: number; spin: number }
interface Page { c: V3; ang: number; kind: number; at: number; seed: number }
interface Plate { mesh: THREE.Mesh; cv: HTMLCanvasElement; c: CanvasRenderingContext2D; tex: THREE.CanvasTexture; mat: THREE.RawShaderMaterial; last: string; w: number; h: number }

export default class HarvestRemixVault extends LibScene<P, C> {
  static schema = schema;
  private rt = makeRT(W, H, { samples: 4 });
  private scene = new THREE.Scene();
  private cam = new THREE.PerspectiveCamera(40, W / H, 0.03, 1600);
  private drain = new FSPass(DRAIN, { uR: { value: 2 }, uCol: { value: new THREE.Vector3() } }, { blending: THREE.NormalBlending, transparent: true });
  private U: Record<string, THREE.IUniform> = {};
  private trayAttr: Record<string, THREE.InstancedBufferAttribute> = {};
  private cardAttr: Record<string, THREE.InstancedBufferAttribute> = {};
  private cardGeo!: THREE.InstancedBufferGeometry;
  private stripGeo!: THREE.InstancedBufferGeometry;
  private trays: Tray[] = [];
  private hero = 0;
  private nCard = 0;
  private plates: Record<string, Plate> = {};
  private counterMeshes: THREE.Mesh[] = [];

  // moments
  private S = 0; private E = 0;
  private beat = 0.457;
  private a: number[] = []; // the cues' anchors
  private c: number[] = []; // the cues' starts
  private downbeats: number[] = [];
  private kicks: number[] = [];
  private hats: number[] = [];
  private drops: Drop[] = [];
  private pages: Page[] = [];
  private counts: number[] = [];
  private tagText = '';
  private wallText = '';
  private dateLine = '';
  private aDecr = 0; private aEnvLand = 0;
  private pageAt = { c: [0, 0, 0] as V3, r: [1, 0, 0] as V3, u: [0, 1, 0] as V3 };
  private drainAt = 0;

  private get ph() { return this.P.phase; }

  override setup() {
    const au = this.ctx.audio, S = this.ctx.start, E = this.ctx.end;
    this.S = S; this.E = E;
    this.beat = au.beats.length > 1 ? (au.beats.at(-1)! - au.beats[0]!) / (au.beats.length - 1) : 0.457;
    this.a = this.cues.map((c) => c.at);
    this.c = this.cues.map((c) => c.start);
    this.downbeats = au.downbeats.filter((d) => d >= S - 0.01 && d < E + 0.01);
    this.kicks = au.events('kick', S - 1, E + 1).map(([t]) => t);
    this.hats = au.events('hat', S - 1, E + 1).map(([t]) => t);
    const tagCue = this.cues.find((c) => this.cp(c).tag);
    this.tagText = (tagCue && this.cp(tagCue).tag) || this.P.tag;
    const wc = this.cues.find((c) => this.cp(c).wallTag);
    this.wallText = (wc && this.cp(wc).wallTag) || this.P.wallTag || '31,000 PB';
    this.counts = this.cues.map((c, i) => parseInt(this.cp(c).count.replace(/\D/g, ''), 10) || [412, 1930, 8811][i] || 0);
    this.dateLine = letterDate(this.tagText);
    this.drainAt = au.downbeats.filter((d) => d < E - 0.5).at(-2) ?? E - 3;

    this.buildUniforms();
    this.buildWorld();
    this.buildAtlas();
    this.buildFrost();
    this.buildPlates();
    if (this.ph === 'harvest') this.planDrops();
    if (this.ph === 'thaw') this.planThaw();
  }

  /** The cue's anchor (or a fallback a little into the entry). */
  private at(i: number, fb: number) { return this.a[i] ?? fb; }
  private st(i: number, fb: number) { return this.c[i] ?? fb; }
  /** Start of the first word matching re in cue i's line. */
  private word(i: number, re: RegExp, fb: number) { const c: ResolvedCue | undefined = this.cues[i]; return c?.line?.words.find((w) => re.test(w.w))?.start ?? fb; }

  // ------------------------------------------------------------------ building

  private buildUniforms() {
    const v3 = () => ({ value: new THREE.Vector3() }), f = (x = 0) => ({ value: x });
    this.U = {
      uCam: v3(), uTime: f(), uSteel: v3(), uStrip: v3(), uLampC: v3(), uFrostC: v3(), uPaperC: v3(), uFogC: v3(), uMistC: v3(),
      uDay: v3(), uInk: v3(), uRed: v3(), uFogDay: v3(),
      uFogDen: f(0.03), uFogDenDay: f(0.006), uMist: f(), uAmb: f(0.03), uFront: f(1e5), uOther: f(1), uSegLo: f(1), uSegHi: f(1), uLevel: f(1),
      uLampAll: f(), uFill: f(), uFarOpen: f(), uLockT: f(1e5), uFrostAll: f(1), uTwinkle: f(),
      uSeg: { value: new Float32Array(NSEG).fill(1) },
      uFrostTex: { value: null }, uAtlas: { value: null },
    };
  }

  private mat(vert: string, frag: string, extra: Record<string, THREE.IUniform> = {}) {
    return new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: `${HEAD_V}\n${vert}`,
      fragmentShader: `${HEAD_F}\n${frag}`,
      uniforms: { ...this.U, ...extra },
      side: THREE.DoubleSide,
    });
  }

  private instanced(base: THREE.BufferGeometry, attrs: Record<string, number>, count: number) {
    const g = new THREE.InstancedBufferGeometry();
    g.index = base.index;
    g.setAttribute('position', base.getAttribute('position'));
    if (base.getAttribute('normal')) g.setAttribute('normal', base.getAttribute('normal'));
    if (base.getAttribute('uv')) g.setAttribute('uv', base.getAttribute('uv'));
    const out: Record<string, THREE.InstancedBufferAttribute> = {};
    for (const [k, n] of Object.entries(attrs)) {
      const at = new THREE.InstancedBufferAttribute(new Float32Array(count * n), n);
      at.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute(k, at);
      out[k] = at;
    }
    g.instanceCount = count;
    return { g, a: out };
  }

  private add(geo: THREE.BufferGeometry, mat: THREE.Material, order = 0) {
    const m = new THREE.Mesh(geo, mat);
    m.frustumCulled = false;
    m.renderOrder = order;
    this.scene.add(m);
    return m;
  }

  private buildWorld() {
    const box = new THREE.BoxGeometry(1, 1, 1);
    // racks
    const nRack = (R1 - R0) * (B1 - B0 + 1);
    const rk = this.instanced(box, { iB: 3, iS: 3 }, nRack);
    let i = 0;
    for (let n = R0; n < R1; n++) for (let b = B0; b <= B1; b++, i++) {
      rk.a.iB!.setXYZ(i, (n + 0.5) * P, RH / 2, -(b * BP + BL / 2));
      rk.a.iS!.setXYZ(i, RD, RH, BL);
    }
    this.add(rk.g, this.mat(RACK_V, RACK_F));
    // strip lights over every aisle and block, chutes over aisle 0, the wall tag's rods
    const nStrip = (R1 - R0 - 1) * (B1 - B0 + 1) + 2 * NB_NEAR * NBAY + 2;
    const sk = this.instanced(box, { iB: 3, iS: 3, iK: 1 }, nStrip);
    i = 0;
    for (let n = R0 + 1; n < R1; n++) for (let b = B0; b <= B1; b++, i++) {
      sk.a.iB!.setXYZ(i, n * P, LY + 0.03, -(b * BP + BL / 2));
      sk.a.iS!.setXYZ(i, 0.1, 0.06, BL - 0.1);
      sk.a.iK!.setX(i, 0);
    }
    for (let w = 0; w < 2; w++) for (let b = 0; b < NB_NEAR; b++) for (let bay = 0; bay < NBAY; bay++, i++) {
      const s = b * BP + bay * BAYW + UP + 1.5 * CW;
      sk.a.iB!.setXYZ(i, (w ? 1 : -1) * (A - 0.19), this.ph === 'harvest' ? CHUTE_Y : -50, -s);
      sk.a.iS!.setXYZ(i, 0.5, 0.1, 0.5);
      sk.a.iK!.setX(i, 1);
    }
    for (let j = 0; i < nStrip; i++, j++) {
      // the gauge's two hanging rods (parked under the floor in the other phases)
      const top = GY + GH / 2, on = this.ph === 'gauge';
      sk.a.iB!.setXYZ(i, on ? (j ? 0.85 : -0.85) : 0, on ? (top + CEIL_Y) / 2 : -50, on ? GZ : 0);
      sk.a.iS!.setXYZ(i, on ? 0.025 : 0.01, on ? CEIL_Y - top : 0.01, on ? 0.025 : 0.01);
      sk.a.iK!.setX(i, 2);
    }
    this.stripGeo = sk.g;
    this.add(sk.g, this.mat(STRIP_V, STRIP_F, { uChute: { value: this.ph === 'harvest' ? 1 : 0 } }));
    // floor
    const fl = new THREE.BufferGeometry();
    const x0 = R0 * P - 20, x1 = R1 * P + 20, z0 = -(B1 + 1) * BP - 20, z1 = -B0 * BP + 20;
    fl.setAttribute('position', new THREE.Float32BufferAttribute([x0, 0, z0, x1, 0, z0, x1, 0, z1, x0, 0, z1], 3));
    fl.setIndex([0, 2, 1, 0, 3, 2]);
    this.add(fl, this.mat(FLOOR_V, FLOOR_F));
    if (this.ph === 'keep' || this.ph === 'harvest' || this.ph === 'gauge') {
      const ce = new THREE.BufferGeometry();
      ce.setAttribute('position', new THREE.Float32BufferAttribute([x0, CEIL_Y, z0, x1, CEIL_Y, z0, x1, CEIL_Y, z1, x0, CEIL_Y, z1], 3));
      ce.setIndex([0, 1, 2, 0, 2, 3]);
      this.add(ce, this.mat(FLOOR_V, CEIL_F));
    }
    // trays
    const tr = this.instanced(box, { iPos: 3, iNx: 1, iSt: 4, iEx: 2 }, NTRAY);
    this.trayAttr = tr.a;
    for (let w = 0; w < 2; w++) for (let b = 0; b < NB_NEAR; b++) for (let col = 0; col < COLS; col++) for (let row = 0; row < NROW; row++) {
      const bay = Math.floor(col / 3), cc = col % 3;
      const s = b * BP + bay * BAYW + UP + cc * CW + CW / 2, y = Y0 + row * CH + CH / 2;
      const k = this.trays.length;
      const t: Tray = { x: w ? A : -A, y, z: -s, s, nx: w ? -1 : 1, wall: w, b, col, row, h1: hash(k, 11), h2: hash(k, 12), h3: hash(k, 13), h4: hash(k, 14) };
      this.trays.push(t);
      tr.a.iPos!.setXYZ(k, t.x, y, -s);
      tr.a.iNx!.setX(k, t.nx);
      tr.a.iEx!.setXY(k, -1, 0.001 + hash(k, 15));
    }
    this.hero = ((1 * NB_NEAR + 0) * COLS + 1) * NROW + 3;
    this.add(tr.g, this.mat(TRAY_V, TRAY_F));
    // cards
    const quad = new THREE.PlaneGeometry(1, 1);
    const cd = this.instanced(quad, { iC: 3, iU: 3, iV: 3, iR: 4, iFx: 4, iT: 1 }, NCARD);
    this.cardAttr = cd.a;
    this.cardGeo = cd.g;
    this.add(cd.g, this.mat(CARD_V, CARD_F), 1);
  }

  /** Tray k's front (x at the face of its open position), the front lip of its open top, and its axes. */
  private trayFrame(k: number, open: number) {
    const t = this.trays[k]!, fx = t.x + t.nx * (open + 0.004);
    const into: V3 = [-t.nx, 0, 0], right: V3 = [0, 0, -t.nx];
    return { fx, lip: [fx, t.y + TH / 2, t.z] as V3, into, right };
  }
  /** Where a card of height h lies in tray k (open by `open`), a little above its floor line. */
  private inTray(k: number, open: number, h: number) {
    const fr = this.trayFrame(k, open);
    return { ...fr, c: add(fr.lip, add(mul(fr.into, 0.022 + h / 2), [0, 0.003, 0])) };
  }

  // ------------------------------------------------------------------ textures: the atlas, the frost, the plates

  private atlasTile = 0;
  private buildAtlas() {
    const T = 512 * SCALE, cv = document.createElement('canvas');
    cv.width = 4 * T; cv.height = 2 * T;
    const c = cv.getContext('2d')!;
    this.atlasTile = T;
    const pals = this.ctx.style.palettes, first = Object.values(pals)[0]!;
    const cold = look(this.ph === 'thaw' ? pals.frost ?? first : pals[this.cues[0]?.def.palette ?? ''] ?? first);
    const day = look(pals[this.cues.at(-1)?.def.palette ?? ''] ?? pals.plain ?? first);
    const frostCol = coldOf(cold);
    c.fillStyle = cold.bg; c.fillRect(0, 0, cv.width, cv.height);
    const env = (i: number, f: (x: CanvasRenderingContext2D, w: number, h: number) => void) => {
      const col = i % 4, row = Math.floor(i / 4), w = T, h = T * 0.62;
      c.save(); c.translate(col * T, row * T + (T - h) / 2); c.scale(w / 560, h / 350); f(c, 560, 350); c.restore();
    };
    const page = (i: number, f: (x: CanvasRenderingContext2D, w: number, h: number) => void) => {
      const col = i % 4, row = Math.floor(i / 4), w = T * 0.75, h = T;
      c.save(); c.translate(col * T + (T - w) / 2, row * T); c.scale(w / 360, h / 480); f(c, 360, 480); c.restore();
    };
    const mono = this.font('mono'), serif = this.font('serif');
    const [stamp1, stamp2] = splitStamp(this.tagText);
    env(0, (x, w, h) => drawEnvelope(x, w, h, { paper: mixHex(cold.type, cold.bg, 0.16), line: cold.bg, lock: mixHex(cold.type, frostCol, 0.45), frost: mixHex('#ffffff', frostCol, 0.3), seed: 3 }));
    env(1, (x, w, h) => drawEnvelope(x, w, h, { paper: mixHex(cold.type, cold.bg, 0.16), line: cold.bg, lock: mixHex(cold.type, frostCol, 0.45), frost: mixHex('#ffffff', frostCol, 0.3), seed: 9, stamp: [stamp1, stamp2], mono }));
    const dPaper = mixHex(day.bg, '#ffffff', 0.55);
    env(2, (x, w, h) => drawEnvelope(x, w, h, { paper: dPaper, line: day.type, lock: day.type, open: true, seal: day.accent, seed: 9, stamp: [stamp1, stamp2], mono, ink: day.type }));
    page(3, (x, w, h) => drawPage(x, w, h, 'letter', { paper: dPaper, ink: day.type, red: day.accent, date: this.dateLine, serif, seed: 21 }));
    page(4, (x, w, h) => drawPage(x, w, h, 'plan', { paper: dPaper, ink: day.type, red: day.accent, seed: 4, mono }));
    page(5, (x, w, h) => drawPage(x, w, h, 'cake', { paper: dPaper, ink: day.type, red: day.accent, seed: 5, mono }));
    page(6, (x, w, h) => drawPage(x, w, h, 'letter', { paper: dPaper, ink: day.type, red: day.accent, seed: 6 }));
    page(7, (x, w, h) => drawPage(x, w, h, 'plan', { paper: dPaper, ink: day.type, red: day.accent, seed: 8, mono, alt: true }));
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.flipY = false;
    tex.anisotropy = 8;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.needsUpdate = true;
    this.U.uAtlas!.value = tex;
  }

  private buildFrost() {
    const w = 2.64, h = 1, PX = 400, cv = document.createElement('canvas');
    cv.width = Math.round(w * PX); cv.height = PX;
    const c = cv.getContext('2d')!;
    c.fillStyle = '#000'; c.fillRect(0, 0, cv.width, cv.height);
    const rnd = mulberry32(2021), segs: number[] = [], seeds: [number, number, number, number][] = [];
    // denser at the corners, where frost starts; the middle of the pane stays clearer
    for (let i = 0; i < 16; i++) seeds.push([(i + 0.2 + 0.6 * rnd()) / 16 * w, 0.005, Math.PI / 2 + (rnd() - 0.5) * 1.3, rnd() * 0.2]);
    for (let i = 0; i < 16; i++) seeds.push([(i + 0.2 + 0.6 * rnd()) / 16 * w, h - 0.005, -Math.PI / 2 + (rnd() - 0.5) * 1.3, rnd() * 0.2]);
    for (let i = 0; i < 5; i++) seeds.push([0.005, (i + 0.5) / 5 * h, (rnd() - 0.5) * 1.2, rnd() * 0.2]);
    for (let i = 0; i < 5; i++) seeds.push([w - 0.005, (i + 0.5) / 5 * h, Math.PI + (rnd() - 0.5) * 1.2, rnd() * 0.2]);
    for (const [cu, cv] of [[0, 0], [w, 0], [0, h], [w, h]] as const) for (let i = 0; i < 4; i++) {
      seeds.push([Math.abs(cu - 0.01), Math.abs(cv - 0.01), Math.atan2(cv ? -1 : 1, cu ? -1 : 1) + (rnd() - 0.5) * 1.2, rnd() * 0.1]);
    }
    // the growth order of a segment is its arc length from the seed (plus a seeded delay)
    for (const [u, v, a, off] of seeds) grow(segs, rnd, u, v, a, 0.2 + rnd() * 0.42, 0, off, w, h);
    const maxS = 0.7;
    c.lineCap = 'round';
    for (let k = 0; k < segs.length; k += 6) {
      const lvl = segs[k + 5]!, g = clamp(segs[k + 4]! / maxS);
      c.strokeStyle = `rgb(${lvl === 0 ? 255 : lvl === 1 ? 200 : 150}, ${Math.round(g * 255)}, 0)`;
      c.lineWidth = lvl === 0 ? 1.5 : lvl === 1 ? 1.1 : 0.8;
      c.beginPath(); c.moveTo(segs[k]! * PX, (h - segs[k + 1]!) * PX); c.lineTo(segs[k + 2]! * PX, (h - segs[k + 3]!) * PX); c.stroke();
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.NoColorSpace;
    tex.flipY = false;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    this.U.uFrostTex!.value = tex;
  }

  private plate(name: string, w: number, h: number, gain: number) {
    const cv = document.createElement('canvas');
    cv.width = Math.round(w * SCALE); cv.height = Math.round(h * SCALE);
    const c = cv.getContext('2d')!;
    c.scale(SCALE, SCALE);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    const mat = this.mat(PLATE_V, PLATE_F, { uTex: { value: tex }, uGain: { value: gain }, uDayP: { value: 0 } });
    const mesh = this.add(new THREE.PlaneGeometry(1, 1), mat, 2);
    mesh.visible = false;
    const p: Plate = { mesh, cv, c, tex, mat, last: '\u0000', w, h };
    this.plates[name] = p;
    return p;
  }

  private buildPlates() {
    if (this.ph === 'keep' || this.ph === 'thaw') this.plate('tag', 1024, 140, 0.9);
    if (this.ph === 'harvest') {
      const p = this.plate('count', 720, 270, 1);
      // the same reading on the near rack ends (blocks 0 and 1, both walls of aisle 0)
      for (const [x, b] of [[-1, 0], [0, 0], [-1, 1], [0, 1]] as const) {
        const m = b === 0 && x === -1 ? p.mesh : this.add(p.mesh.geometry, p.mat, 2);
        m.position.set((x + 0.5) * P, 1.95, -b * BP + 0.003);
        m.scale.set(0.98, 0.98 * 270 / 720, 1);
        m.visible = true;
        this.counterMeshes.push(m);
      }
    }
    if (this.ph === 'petabytes') this.plate('wall', 1024, 330, 1.2);
    if (this.ph === 'gauge') this.place(this.plate('gauge', 1024, 600, 1.15), [0, GY, GZ], [1, 0, 0], [0, 1, 0], GW, GH);
  }

  /** Redraw a plate's canvas when its content changes. */
  private paint(p: Plate, key: string, f: (c: CanvasRenderingContext2D, w: number, h: number) => void) {
    if (p.last === key) return;
    p.last = key;
    p.c.save(); p.c.setTransform(SCALE, 0, 0, SCALE, 0, 0); f(p.c, p.w, p.h); p.c.restore();
    p.tex.needsUpdate = true;
  }

  /** Place a plate quad: centre, its right and up unit axes, size in metres. */
  private place(p: Plate | THREE.Mesh, c: V3, r: V3, u: V3, w: number, h: number) {
    const m = 'mesh' in p ? p.mesh : p, n = cross(r, u);
    const mx = new THREE.Matrix4().makeBasis(new THREE.Vector3(...r), new THREE.Vector3(...u), new THREE.Vector3(...n));
    m.quaternion.setFromRotationMatrix(mx);
    m.position.set(...c);
    m.scale.set(w, h, 1);
    m.visible = true;
  }

  // ------------------------------------------------------------------ plans

  private planDrops() {
    const c7 = this.st(1, this.S + 4.8), aMine = this.at(1, this.S + 7.1);
    const rnd = mulberry32(77), used = new Set<number>();
    const beats = this.ctx.audio.beats.filter((b) => b >= c7 - 0.05 && b < aMine - 0.2);
    const per = [2, 3, 5, 8, 12, 16];
    beats.forEach((b, j) => {
      const n = per[Math.min(j, per.length - 1)]!;
      for (let k = 0; k < n; k++) {
        const tc = b + (k / n) * this.beat;
        if (tc > aMine - 0.12) continue;
        const camS = -this.camHarvest(tc).c[2];
        for (let tries = 0; tries < 40; tries++) {
          const wall = rnd() < 0.5 ? 0 : 1, s = camS + 3 + rnd() * 26;
          const blk = Math.floor(s / BP), bay = Math.floor((s - blk * BP) / BAYW);
          if (blk < 0 || blk >= NB_NEAR || bay >= NBAY) continue;
          const row = 1 + Math.floor(rnd() * (NROW - 2));
          const idx = ((wall * NB_NEAR + blk) * COLS + bay * 3 + 1) * NROW + row;
          if (used.has(idx)) continue;
          used.add(idx);
          const fallH = CHUTE_Y - (this.trays[idx]!.y + TH / 2);
          this.drops.push({ tray: idx, tc, t0: tc - Math.sqrt((2 * fallH) / 16), spin: rnd() * 2 - 1 });
          break;
        }
      }
    });
    this.drops.sort((x, y) => x.tc - y.tc);
  }

  private planThaw() {
    const c29 = this.st(2, this.S + 6.2);
    this.aDecr = this.word(2, /^decrypt/i, c29 + 3.5);
    const rnd = mulberry32(1987);
    for (let n = -16; n < 26; n++) for (let b = -3; b <= 10; b++) {
      const xc = (n + 0.5) * P;
      for (let k = 0; k < 6; k++) { // six slots along the rack top, so no two pages overlap
        const s = b * BP + (k + 0.5) * (BL / 6) + (rnd() - 0.5) * 0.5, x = xc + (rnd() - 0.5) * 0.3;
        const d = Math.hypot(x, s);
        if (rnd() > 1.15 - d / 120) continue;
        this.pages.push({ c: [x, RH + 0.03, -s], ang: (rnd() - 0.5) * 0.5, kind: 3 + Math.floor(rnd() * 5), at: this.aDecr + 0.15 + d * 0.006 + rnd() * 0.25, seed: rnd() });
      }
    }
    // the letter hovers in front of the camera as it settles on drawer 0001
    const cam = this.camThaw(this.at(1, this.S + 5.1) + 0.6);
    const f = norm(sub(cam.g, cam.c)), r = norm(cross(f, [0, 1, 0])), u = cross(r, f);
    this.pageAt = { c: add(cam.c, mul(f, 1.05)), r, u };
  }

  // ------------------------------------------------------------------ cameras

  private camKeys(t: number, ks: { t: number; c: V3; g: V3; fov?: number; e?: (x: number) => number }[]) {
    const comp = (fn: (k: (typeof ks)[number]) => number) => keys(t, ks.map((k): Key => [k.t, fn(k), k.e]));
    return {
      c: [comp((k) => k.c[0]), comp((k) => k.c[1]), comp((k) => k.c[2])] as V3,
      g: [comp((k) => k.g[0]), comp((k) => k.g[1]), comp((k) => k.g[2])] as V3,
      fov: comp((k) => k.fov ?? 40),
    };
  }

  private camKeep(t: number) {
    const S = this.S, E = this.E, aBreak = this.at(0, S + 1.1), c5 = this.st(1, S + 3.7);
    const io = ease.inOutCubic;
    return this.camKeys(t, [
      { t: S, c: [0.0, 2.3, 1.1], g: [1.0, 1.5, -1.25] },
      { t: aBreak, c: [0.38, 2.05, -0.3], g: [1.02, 1.55, -1.15], e: ease.inOutQuad },
      { t: c5, c: [0.46, 2.0, -0.55], g: [1.04, 1.55, -1.2], e: ease.linear },
      { t: c5 + 0.9, c: [0.3, 1.72, -0.12], g: [1.0, 1.4, -2.3], e: io },
      { t: E, c: [0.2, 1.72, 0.15], g: [0.82, 1.4, -3.0], e: ease.linear },
    ]);
  }

  private camHarvest(t: number): { c: V3; g: V3; fov: number } {
    const S = this.S, c8 = this.st(2, S + 7.9), aLater = this.at(2, S + 10.8);
    const base = (tt: number): { c: V3; g: V3; fov: number } => {
      // hold back a moment so both rack-end counters read whole, then glide in past them
      const hold = S + 1.2;
      let z = 4.6 - 0.12 * (tt - S) + 2.8 * (1 - ease.inOutCubic(prog(tt, hold, hold + 1.4)));
      for (const d of this.downbeats) if (d < c8 - 0.2) { const d0 = Math.max(d, hold); z -= 1.7 * ease.outCubic(prog(tt, d0, d0 + 0.75)); }
      const bob = 0.01 * Math.sin((tt - S) * 1.7);
      return { c: [0, 1.62 + bob, z], g: [0, 1.45, z - 40], fov: 40 };
    };
    if (t <= c8) return base(t);
    const b0 = base(c8);
    return this.camKeys(t, [
      { t: c8, c: b0.c, g: b0.g },
      { t: c8 + 1.6, c: [-0.2, 1.62, -14.4], g: [-0.35, 1.5, -40], e: ease.inOutQuad },
      { t: aLater - 0.15, c: [-0.62, 1.66, -16.35], g: [-1.45, 1.62, -19.6], e: ease.inOutCubic },
      { t: aLater + 0.25, c: [-0.64, 1.66, -16.42], g: [-1.47, 1.62, -19.62], e: ease.outCubic },
      { t: this.E + 1, c: [-0.66, 1.66, -16.5], g: [-1.47, 1.62, -19.62], e: ease.linear },
    ]);
  }

  private camGauge(t: number): { c: V3; g: V3; fov: number } {
    // inside the aisle, a slow push toward the gauge, stepping on the bars, looking a little up
    let z = -2.6 - 0.07 * (t - this.S);
    for (const d of this.downbeats) z -= 0.14 * ease.outCubic(prog(t, d, d + 0.75));
    const bob = 0.01 * Math.sin((t - this.S) * 1.7);
    return { c: [0, 1.62 + bob, z], g: [0, 3.72, z - 30], fov: 40 };
  }

  private camPetabytes(t: number): { c: V3; g: V3; fov: number } {
    const S = this.S, E = this.E;
    const F: V3 = [A, Y0 + 4 * CH + CH / 2, -(BP + 2 * BAYW + UP + CW * 1.5)];
    const u = clamp((t - S) / (E - S - 0.15));
    const e = 0.35 * ease.inOutQuad(u) + 0.65 * ease.outCubic(u);
    const D = 0.5 * Math.pow(170 / 0.5, e);
    // back off the drawer, then up out of the aisle before the racks pass under (never through the opposite rack)
    const up: V3 = [-0.55, 0.8, 0.2];
    const dir = norm(e < 0.25 ? mix3([-1, 0, 0], up, smoothstep(0, 0.25, e)) : mix3(up, [-0.84, 0.47, 0.27], smoothstep(0.25, 0.8, e)));
    const G: V3 = [18, 0, -70];
    const foc = mix3(F, G, smoothstep(0.12, 0.85, e));
    return { c: add(foc, mul(dir, D)), g: foc, fov: 40 };
  }

  private camThaw(t: number): { c: V3; g: V3; fov: number } {
    const S = this.S, E = this.E, c28 = this.st(1, S + 3), aLater = this.at(1, S + 5.1);
    const aDecr = this.aDecr || this.word(2, /^decrypt/i, S + 9.7);
    const nowEnd = this.cues[2]?.end ?? E - 6;
    return this.camKeys(t, [
      { t: S, c: [0, 1.62, 2.6], g: [0, 1.5, -40] },
      { t: c28, c: [0, 1.62, 1.7], g: [0, 1.5, -40], e: ease.linear },
      { t: c28 + 1.45, c: [-0.55, 1.8, -0.05], g: [1.0, 1.74, -0.62], e: ease.inOutCubic },
      { t: aLater + 0.3, c: [-0.6, 1.8, -0.12], g: [1.0, 1.75, -0.64], e: ease.outCubic },
      { t: aDecr - 0.1, c: [-0.3, 1.85, 1.25], g: [0.6, 1.6, -2.4], e: ease.inOutCubic },
      { t: aDecr + 0.7, c: [-0.3, 1.95, 1.4], g: [0.6, 1.5, -2.6], e: ease.outCubic },
      // rise straight up the aisle until clear of the rack tops, then out over the grid (never through a rack)
      { t: aDecr + 2.6, c: [-0.4, 4.4, 2.4], g: [1.2, 0.6, -7], e: ease.inOutCubic },
      { t: nowEnd, c: [-15, 21, 9], g: [6, 0, -16], e: ease.inOutCubic },
      { t: E, c: [-15.8, 22, 9.6], g: [6, 0, -16], e: ease.linear },
    ]);
  }

  private camAt(t: number) {
    switch (this.ph) {
      case 'keep': return this.camKeep(t);
      case 'harvest': return this.camHarvest(t);
      case 'gauge': return this.camGauge(t);
      case 'petabytes': return this.camPetabytes(t);
      default: return this.camThaw(t);
    }
  }

  // ------------------------------------------------------------------ the frame

  override draw() {}

  override render(f: Frame, out: THREE.WebGLRenderTarget) {
    const t = f.t, r = this.ctx.renderer;
    const cam = this.camAt(t);
    this.cam.fov = cam.fov;
    this.cam.near = clamp(Math.hypot(...sub(cam.g, cam.c)) * 0.012, 0.03, 1.5); // depth precision for the wide shots
    this.cam.position.set(...cam.c);
    this.cam.lookAt(...cam.g);
    this.cam.updateProjectionMatrix();
    this.cam.updateMatrixWorld(true);
    (this.U.uCam!.value as THREE.Vector3).set(...cam.c);
    this.U.uTime!.value = t;

    this.nCard = 0;
    const k = this.lookAt(t);
    const th = this.state(t, f, k, cam.c);
    this.cardGeo.instanceCount = this.nCard;
    for (const a of Object.values(this.cardAttr)) { a.needsUpdate = true; a.clearUpdateRanges(); a.addUpdateRange(0, this.nCard * a.itemSize); }
    for (const a of Object.values(this.trayAttr)) a.needsUpdate = true;

    const fog = this.U.uFront!.value < 1e4 ? (this.U.uFogDay!.value as THREE.Vector3) : (this.U.uFogC!.value as THREE.Vector3);
    clearRT(r, this.rt, [fog.x, fog.y, fog.z]);
    r.setRenderTarget(this.rt);
    r.render(this.scene, this.cam);
    this.ctx.comp.draw(r, this.rt.texture, out, { mode: 'replace' });

    if (this.ph === 'thaw' && t > this.drainAt) {
      const p = ease.inOutCubic(prog(t, this.drainAt, this.E - 0.25));
      this.drain.u.uR!.value = lerp(1.1, 0.004, p);
      const cold = hexToLinear((this.ctx.style.palettes.frost ?? {}).bg ?? '#060A10');
      (this.drain.u.uCol!.value as THREE.Vector3).set(...cold);
      this.drain.render(r, out);
    }
    const day = th;
    return {
      bloom: lerp(0.6, 0.12, day), bloomThreshold: lerp(0.72, 0.96, day), bloomRadius: 0.5, halation: 0, ca: lerp(0.18, 0.08, day),
      grain: 0.034, vignette: lerp(0.4, 0.14, day), hud: 0,
    };
  }

  /** Sets every uniform, tray, card and plate for t; returns how far the daylight has reached the camera (0..1). */
  private state(t: number, f: Frame, k: Look, camC: V3): number {
    const U = this.U, set = (n: string, v: number) => { U[n]!.value = v; };
    const vec = (n: string, c: [number, number, number]) => (U[n]!.value as THREE.Vector3).set(...c);
    const lin = hexToLinear;
    const pals = this.ctx.style.palettes;
    const ck = this.ph === 'thaw' ? look(pals.frost ?? Object.values(pals)[0]!) : k;
    const warm = this.ph === 'harvest' || this.ph === 'gauge' || this.ph === 'petabytes';
    const ice = coldOf(ck);
    vec('uSteel', lin(mixHex(mixHex(ck.bg, ck.dim, 0.55), ice, 0.1)));
    vec('uStrip', lin(ice));
    vec('uLampC', lin(warm ? ck.accent : mixHex(ck.type, ice, 0.3)));
    vec('uFrostC', lin(mixHex(ck.type, ice, 0.35)));
    vec('uPaperC', lin(ck.type));
    const fogC = lin(ck.bg), si = lin(ice);
    vec('uFogC', [fogC[0] + si[0] * 0.004, fogC[1] + si[1] * 0.004, fogC[2] + si[2] * 0.004]);
    vec('uMistC', [si[0] * 0.07, si[1] * 0.07, si[2] * 0.07]);
    const dk = this.ph === 'thaw' ? k : ck;
    vec('uDay', lin(dk.bg)); vec('uInk', lin(dk.type)); vec('uRed', lin(dk.accent)); vec('uFogDay', lin(dk.bg));
    set('uLevel', 0.85 + 0.3 * f.a.rms);
    set('uTwinkle', 0.6 * f.a.hat);
    const seg = U.uSeg!.value as Float32Array;
    const st = this.trayAttr.iSt!, ex = this.trayAttr.iEx!;
    let dayAtCam = 0;

    if (this.ph === 'keep') {
      const S = this.S, aBreak = this.at(0, S + 1.1), aKeep = this.at(1, S + 4.7);
      // one bay lit (a fluorescent flicker on), then the aisle bay by bay after the drawer shuts
      for (let i = 0; i < NSEG; i++) {
        const on = i === 0 || i === NBAY ? S - 0.02 + (i ? 0.3 : 0) : aKeep + 0.45 + (i - 1) * this.beat * 0.75;
        seg[i] = i === NBAY ? 0 : tube(t, on);
      }
      seg[NBAY] = tube(t, aKeep + 0.45 + 6 * this.beat * 0.75);
      set('uSegLo', seg[0]!); set('uSegHi', 0); set('uOther', 0);
      set('uLampAll', 0); set('uFill', 0); set('uFrostAll', 1); set('uFarOpen', 0); set('uLockT', 1e5); set('uFront', 1e5);
      set('uFogDen', 0.075); set('uFogDenDay', 0.075); set('uMist', 0.55); set('uAmb', 0.012);
      // the hero: open, receives the copy, shuts on the anchor; frost creeps over its glass, its lamp comes on
      const open = trayShut(t, 0.42, aKeep);
      for (let i = 0; i < NTRAY; i++) { st.setXYZW(i, 0, 0, 1, 0); ex.setX(i, -1); }
      const frost = lerp(0.08, 1, ease.inOutQuad(prog(t, aKeep + 0.05, aKeep + 1.7)));
      const lamp = 0.9 * flick(t, aKeep + 0.25);
      st.setXYZW(this.hero, open, lamp, frost, 0);
      this.heroEnv(open < 0.05);
      // the envelope slides down into the open drawer and lies flat; glints on the first anchor
      const fr = this.inTray(this.hero, open, ENV[1]);
      const land = this.ctx.audio.beats.find((b) => b > S + 0.65) ?? S + 0.9;
      const fall = ease.inQuad(prog(t, S + 0.05, land));
      const settle = t > land ? 0.05 * Math.exp(-(t - land) * 10) * Math.sin((t - land) * 28) : 0;
      const tilt = lerp(0.55, 0, fall) + settle;
      const cc = add(fr.c, [0, lerp(0.75, 0, fall) + Math.max(0, settle) * 0.05, 0]);
      const v = norm(add(mul(fr.into, Math.cos(tilt)), [0, Math.sin(tilt), 0]));
      this.card(cc, mul(fr.right, ENV[0] / 2), mul(v, ENV[1] / 2), 1, [0, 0, 1, 1], [t >= aBreak - 0.3 ? t - aBreak : -10, 0, 1, 0]);
      // the tag prints on the anchor
      const p = this.plates.tag!;
      const n = Math.round(this.tagText.length * clamp((t - aKeep - 0.1) / 0.7));
      this.paint(p, `${n}`, (c, w, h) => drawTag(c, w, h, this.tagText.slice(0, n), this.font('mono'), mixHex(ck.type, ck.bg, 0.5), ck.bg));
      this.placeTag(this.hero, open);
    } else if (this.ph === 'harvest') this.stateHarvest(t, f, seg);
    else if (this.ph === 'gauge') this.stateGauge(t, seg, k);
    else if (this.ph === 'petabytes') this.statePetabytes(t, k, seg);
    else dayAtCam = this.stateThaw(t, f, seg, camC, k);
    return dayAtCam;
  }

  private stateHarvest(t: number, f: Frame, seg: Float32Array) {
    const S = this.S, aTime = this.at(0, S + 3.3), aMine = this.at(1, S + 7.1), aLater = this.at(2, S + 10.8);
    const set = (n: string, v: number) => { this.U[n]!.value = v; };
    seg.fill(1);
    set('uSegLo', 1); set('uSegHi', 1); set('uOther', 1);
    set('uLampAll', 1 + 1.4 * pulse(t, aMine, 0.35)); set('uFill', 0.93); set('uFrostAll', 1); set('uFarOpen', 0); set('uLockT', 1e5); set('uFront', 1e5);
    set('uFogDen', 0.032); set('uFogDenDay', 0.032); set('uMist', 0.38); set('uAmb', 0.03);
    const st = this.trayAttr.iSt!, ex = this.trayAttr.iEx!;
    const camS0 = -this.camHarvest(aTime).c[2];
    const kicks = this.kicks.filter((x) => x > S + 0.2 && x < aTime - 0.25);
    const dropOf = new Map<number, Drop>();
    for (const d of this.drops) dropOf.set(d.tray, d);
    const flare = 1 + 1.6 * pulse(t, aMine, 0.3);
    for (let i = 0; i < NTRAY; i++) {
      const tr = this.trays[i]!;
      let open = 0, lamp = 1, tile = 0;
      const open0 = tr.h1 < 0.4 ? 0.12 + 0.3 * tr.h2 : 0;
      if (open0 > 0) {
        const early = tr.h3 < 0.35 && kicks.length ? kicks[Math.floor(tr.h4 * kicks.length)]! : Infinity;
        const tw = Math.min(early, aTime + Math.max(0, tr.s - camS0) / 26 + 0.04 * tr.h4);
        open = trayShut(t, open0, tw);
        lamp = t < tw ? 0.12 : flick(t, tw);
      }
      const d = dropOf.get(i);
      if (d) {
        // springs open to catch, stays open until every drawer slams on the anchor
        const o = 0.36 * ease.outBack(prog(t, d.tc - 0.3, d.tc - 0.12));
        if (t >= d.tc - 0.3) open = t < aMine ? o : trayShut(t, 0.36, aMine + 0.02 * tr.h2);
        if (t < d.tc) tile = -1;
        lamp = t < d.tc ? (open > 0 ? 0.12 : lamp) : flick(t, d.tc);
      }
      st.setXYZW(i, open, lamp * flare * (0.85 + 0.15 * Math.sin(t * 2.3 + tr.h4 * 50)), 1, 0);
      ex.setX(i, tile);
    }
    // the falling envelopes
    for (const d of this.drops) {
      if (t < d.t0 || t >= d.tc) continue;
      const fr = this.inTray(d.tray, 0.36, ENV[1]), tr = this.trays[d.tray]!;
      const u = (t - d.t0) / (d.tc - d.t0);
      const cc: V3 = [fr.c[0], lerp(CHUTE_Y - 0.06, fr.c[1], u * u), fr.c[2]];
      const wob = 0.5 * d.spin * Math.sin(u * 7) * (1 - u);
      const v = norm(add(mul(fr.into, Math.cos(wob)), [0, Math.sin(wob), 0]));
      const rr = norm(add(mul(fr.right, Math.cos(0.3 * d.spin * (1 - u))), mul(fr.into, Math.sin(0.3 * d.spin * (1 - u)) * -tr.nx)));
      this.card(cc, mul(rr, ENV[0] / 2), mul(v, ENV[1] / 2), 0);
    }
    // the counters: rolling up to each cue's count
    const [n0, n1, n2] = [this.counts[0] ?? 412, this.counts[1] ?? 1930, this.counts[2] ?? 8811];
    let val: number;
    if (t < aTime) val = lerp(Math.round(n0 * 0.3), n0, ease.outCubic(prog(t, S + 0.3, aTime)));
    else if (t < this.st(2, aMine + 0.8)) {
      const done = this.drops.filter((d) => d.tc <= t).length + (this.drops.find((d) => d.tc > t) ? clamp(1 - (this.drops.find((d) => d.tc > t)!.tc - t) / 0.2) : 0);
      val = lerp(n0, n1, this.drops.length ? done / this.drops.length : prog(t, aTime, aMine));
      if (t >= aMine) val = n1;
    } else val = lerp(n1, n2, ease.outQuart(prog(t, this.st(2, aMine + 0.8) + 0.2, aLater)));
    const p = this.plates.count!, ak = this.lookAt(t), shown = Math.floor(val);
    this.paint(p, `${shown}`, (c, w, h) => drawCounter(c, w, h, shown, this.font('mono'), ak));
  }

  private stateGauge(t: number, seg: Float32Array, k: Look) {
    const S = this.S, n = this.cues.length;
    const set = (nm: string, v: number) => { this.U[nm]!.value = v; };
    const vals = this.cues.map((c) => this.cp(c).value);
    // the reading: rolls (in log space) from the previous value to the current cue's on its anchor
    let i = -1;
    for (let j = 0; j < n; j++) if (t >= this.a[j]!) i = j;
    const from = i > 0 ? vals[i - 1]! : 0, to = i >= 0 ? vals[i]! : 0;
    const e = i >= 0 ? ease.outCubic(prog(t, this.a[i]!, this.a[i]! + 0.9)) : 0;
    const v = Math.pow(10, lerp(Math.log10(from + 0.01), Math.log10(to + 0.01), e)) - 0.01;
    let label = '';
    for (let j = 0; j <= i; j++) label = this.cp(this.cues[j]!).label || label;
    const top = Math.max(1, ...vals), frac = clamp(Math.log10(1 + v) / Math.log10(1 + top));
    // more status lamps on down the aisle as it fills; all of them flare on each anchor
    const fill = lerp(0.22, 0.95, frac);
    seg.fill(1);
    set('uSegLo', 1); set('uSegHi', 1); set('uOther', 1);
    set('uLampAll', 1 + (i >= 0 ? 1.2 * pulse(t, this.a[i]!, 0.35) : 0)); set('uFill', fill);
    set('uFrostAll', 1); set('uFarOpen', 0); set('uLockT', 1e5); set('uFront', 1e5);
    set('uFogDen', 0.032); set('uFogDenDay', 0.032); set('uMist', 0.38); set('uAmb', 0.03);
    // a share of the open drawers slams shut in a wave down the aisle on each anchor
    const st = this.trayAttr.iSt!, ex = this.trayAttr.iEx!;
    const camS = this.a.map((a) => -this.camGauge(a).c[2]);
    for (let j = 0; j < NTRAY; j++) {
      const tr = this.trays[j]!, g = Math.min(n - 1, Math.floor(tr.h1 * n));
      const open0 = n && tr.h3 < 0.3 ? 0.12 + 0.25 * tr.h2 : 0;
      const tw = (this.a[g] ?? S) + Math.max(0, tr.s - (camS[g] ?? 0)) / 26 + 0.04 * tr.h4;
      const open = open0 ? trayShut(t, open0, tw) : 0;
      const lamp = tr.h4 >= fill ? 0.06 : open0 ? (t < tw ? 0.12 : flick(t, tw)) : 1;
      st.setXYZW(j, open, lamp * (0.85 + 0.15 * Math.sin(t * 2.3 + tr.h4 * 50)), 1, 0);
      ex.setX(j, 0);
    }
    const d = Math.max(0, Math.round(this.P.decimals));
    const num = v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
    const p = this.plates.gauge!;
    this.paint(p, `${num}|${label}|${frac.toFixed(3)}`, (c, w, h) =>
      drawGauge(c, w, h, { title: this.P.title, num, unit: this.P.unit.trim(), label, frac, display: this.font('display'), body: this.font('body'), mono: this.font('mono') }, k));
  }

  private statePetabytes(t: number, k: Look, seg: Float32Array) {
    const S = this.S, E = this.E;
    const set = (n: string, v: number) => { this.U[n]!.value = v; };
    const u = clamp((t - S) / (E - S));
    seg.fill(1);
    set('uSegLo', 1); set('uSegHi', 1); set('uOther', 0.95);
    set('uLampAll', lerp(1, 2.4, smoothstep(0.3, 0.9, u))); // the far lamps carry the grid: city lights
    set('uFill', 0.9); set('uFrostAll', 1); set('uFarOpen', 0); set('uLockT', 1e5); set('uFront', 1e5);
    const fd = lerp(0.03, 0.0058, smoothstep(0.0, 0.7, u));
    set('uFogDen', fd); set('uFogDenDay', fd); set('uMist', 0.35 * (1 - smoothstep(0.1, 0.5, u))); set('uAmb', 0.03);
    const st = this.trayAttr.iSt!, ex = this.trayAttr.iEx!;
    for (let i = 0; i < NTRAY; i++) {
      const tr = this.trays[i]!;
      st.setXYZW(i, 0, tr.h2 < 0.9 ? 0.85 + 0.15 * Math.sin(t * 2.3 + tr.h4 * 50) : 0, 1, 0);
      ex.setX(i, -1);
    }
    // the hanging tag swings in, hinged at its top, in the upper left of the frame
    const cam = this.camPetabytes(t), fwd = norm(sub(cam.g, cam.c)), r = norm(cross(fwd, [0, 1, 0])), up = cross(r, fwd);
    const tIn = S + 0.55 * (E - S), sw = t < tIn ? 1.45 : 1.1 * Math.exp(-(t - tIn) * 2.2) * Math.cos((t - tIn) * 6.5);
    const D = 7, hv = Math.tan((20 * Math.PI) / 180) * D, hu = hv * (W / H);
    const hinge = add(add(add(cam.c, mul(fwd, D)), mul(r, -hu * 0.56)), mul(up, hv * 0.86));
    const pw = hu * 0.62, phh = pw * 330 / 1024;
    const pu = norm(sub(mul(up, Math.cos(sw)), mul(fwd, Math.sin(sw)))); // the bottom swings away from the camera
    const p = this.plates.wall!;
    this.paint(p, this.wallText, (c, w, h) => drawWallTag(c, w, h, this.wallText, this.font('mono'), k));
    if (t > tIn - 0.6) this.place(p, add(hinge, mul(pu, -phh / 2)), r, pu, pw, phh);
    else p.mesh.visible = false;
  }

  private stateThaw(t: number, f: Frame, seg: Float32Array, camC: V3, k: Look) {
    const S = this.S, aAbout = this.at(0, S + 2.2), c28 = this.st(1, S + 3), aLater = this.at(1, S + 5.1), aDecr = this.aDecr;
    const set = (n: string, v: number) => { this.U[n]!.value = v; };
    seg.fill(1);
    set('uSegLo', 1); set('uSegHi', 1); set('uOther', 1);
    // the wall of daylight rolls down the aisle toward the camera
    const front = lerp(115, -12, ease.inQuad(prog(t, S, S + 0.85)));
    set('uFront', front);
    set('uLampAll', 0.5); set('uFill', 0.95); set('uFrostAll', 1); set('uLockT', aAbout);
    set('uFarOpen', ease.outCubic(prog(t, aDecr + 0.1, aDecr + 0.6)));
    set('uFogDen', 0.055); set('uFogDenDay', 0.0075); set('uMist', 0.4); set('uAmb', 0.02);
    const camS = -camC[2];
    const st = this.trayAttr.iSt!, ex = this.trayAttr.iEx!;
    const heroOpen = 0.45 * ease.outBack(prog(t, c28 + 0.15, c28 + 0.55));
    const s0 = -2.6;
    for (let i = 0; i < NTRAY; i++) {
      const tr = this.trays[i]!;
      const lt = aAbout + Math.max(0, tr.s - s0) / LOCKV + 0.08 * tr.h1;
      const lock = ease.outBack(prog(t, lt, lt + 0.16));
      const ot = aDecr + 0.12 * tr.h2;
      let open = (0.28 + 0.14 * tr.h3) * ease.outBack(prog(t, ot, ot + 0.3));
      let tile = 3 + Math.floor(tr.h4 * 5);
      if (i === this.hero) { open = heroOpen; tile = t > aDecr + 2.4 ? 3 : -1; }
      st.setXYZW(i, open, 0.55 * flick(-1, -1), 1, lock);
      ex.setX(i, tile);
    }
    // drawer 0001: the envelope lifts out, its flap opens, the letter unfolds flat on the anchor
    const fr = this.inTray(this.hero, heroOpen, ENV[1]), cIn = fr.c, pIn = this.inTray(this.hero, heroOpen, PAGE[1]).c;
    const pa = this.pageAt, lift0 = c28 + 0.55, lift1 = c28 + 1.3, unf0 = c28 + 1.45;
    this.heroEnv(t < lift0);
    const back = ease.inOutCubic(prog(t, aDecr + 0.4, aDecr + 2.4)); // the letter settles back into its drawer
    if (t < unf0 + 0.15) {
      const q = ease.inOutCubic(prog(t, lift0, lift1));
      const cc = mix3(cIn, pa.c, q);
      const rr = norm(mix3(fr.right, pa.r, q)), vv = norm(mix3(fr.into, pa.u, q));
      const fade = 1 - prog(t, unf0, unf0 + 0.15);
      this.card(cc, mul(rr, ENV[0] / 2 * lerp(1, 0.75, q)), mul(vv, ENV[1] / 2 * lerp(1, 0.75, q)), 2, [0, 0, 1, 1], [-10, 1, fade, 0]);
    }
    if (t >= unf0 && t < aDecr + 2.4) {
      const q = back;
      const c0 = mix3(pa.c, pIn, q);
      const rr = norm(mix3(pa.r, fr.right, q)), uu = norm(mix3(pa.u, fr.into, q)), nn = cross(rr, uu);
      const bot = Math.PI * (1 - ease.inOutCubic(prog(t, unf0, unf0 + (aLater - unf0) * 0.5)));
      const snap = t > aLater ? 0.12 * Math.exp(-(t - aLater) * 9) * Math.sin((t - aLater) * 24) : 0;
      const top = Math.PI * (1 - ease.inCubic(prog(t, unf0 + (aLater - unf0) * 0.45, aLater))) + snap;
      const h3 = PAGE[1] / 3, hw = PAGE[0] / 2;
      this.card(c0, mul(rr, hw), mul(uu, h3 / 2), 3, [0, 1 / 3, 1, 2 / 3], [-10, 1, 1, 0]);
      const dt: V3 = norm(add(mul(uu, Math.cos(top)), mul(nn, Math.sin(top))));
      const ct = add(c0, mul(uu, h3 / 2));
      this.card(add(ct, mul(dt, h3 / 2)), mul(rr, hw), mul(dt, h3 / 2), 3, [0, 0, 1, 1 / 3], [-10, 1, 1, 0]);
      const db: V3 = norm(add(mul(uu, -Math.cos(bot)), mul(nn, -Math.sin(bot))));
      const cb = add(c0, mul(uu, -h3 / 2));
      this.card(add(cb, mul(db, h3 / 2)), mul(rr, hw), mul(db, -h3 / 2), 3, [0, 2 / 3, 1, 1], [-10, 1, 1, 0]);
    }
    // the pages unfold on every rack top
    for (const pg of this.pages) {
      if (t < pg.at) continue;
      const q = ease.outBack(prog(t, pg.at, pg.at + 0.45));
      const hop = Math.sin(Math.PI * prog(t, pg.at, pg.at + 0.6)) * 0.25;
      const ca = Math.cos(pg.ang), sa = Math.sin(pg.ang);
      const rr: V3 = [ca, 0, sa], uu: V3 = [sa, 0, -ca]; // face up
      // (drawn larger than a letter, so they still read from high over the racks)
      this.card(add(pg.c, [0, hop, 0]), mul(rr, PAGE[0]), mul(uu, PAGE[1] * lerp(0.34, 1, q)), pg.kind, [0, 0, 1, 1], [-10, 1, 1, 0]);
    }
    // drawer 0001's tag
    const p = this.plates.tag!;
    this.paint(p, 'day', (c, w, h) => drawTag(c, w, h, this.tagText, this.font('mono'), k.type, mixHex(k.bg, '#ffffff', 0.4)));
    (p.mat.uniforms.uDayP!.value as number) = 0;
    this.placeTag(this.hero, heroOpen);
    return clamp((camS - front) / 5 + 0.5);
  }

  /** Whether drawer 0001's envelope shows behind its glass (not while it lies in the open tray or is lifted out). */
  private heroEnv(show: boolean) {
    const s = 0.001 + hash(this.hero, 15);
    this.trayAttr.iEx!.setY(this.hero, show ? s : -s);
  }

  /** The tag plate on a tray's rail. */
  private placeTag(k: number, open: number) {
    const t = this.trays[k]!, p = this.plates.tag!;
    const fx = t.x + t.nx * (open + 0.004 + 0.0015);
    const qx = 0.235, qy = 0.048;
    const c: V3 = [fx, t.y - CH / 2 + qy, t.z + -t.nx * (qx - CW / 2)];
    this.place(p, c, [0, 0, -t.nx], [0, 1, 0], 0.376, 0.376 * 140 / 1024);
  }

  /** Push a card: centre, half-extent axes, atlas tile, sub-rect of the tile, fx (glint t, day, alpha, -). */
  private card(c: V3, u: V3, v: V3, tile: number, r: [number, number, number, number] = [0, 0, 1, 1], fx: [number, number, number, number] = [-10, 0, 1, 0]) {
    if (this.nCard >= NCARD) return;
    const i = this.nCard++, a = this.cardAttr;
    a.iC!.setXYZ(i, ...c); a.iU!.setXYZ(i, ...u); a.iV!.setXYZ(i, ...v);
    a.iR!.setXYZW(i, ...r); a.iFx!.setXYZW(i, ...fx); a.iT!.setX(i, tile);
  }
}

// ------------------------------------------------------------------ timing helpers

/** A fluorescent tube switching on at t0: a few stutters, then steady. */
function tube(t: number, t0: number) {
  if (t < t0) return 0;
  const a = t - t0;
  if (a > 0.32) return 1;
  return [0.7, 0, 0.45, 0.1, 0.9, 0.3, 1][Math.min(6, Math.floor(a / 0.046))]!;
}
/** A lamp coming on at t0 with a short flicker. */
function flick(t: number, t0: number) {
  if (t0 < 0) return 1;
  if (t < t0) return 0;
  const a = t - t0;
  return a > 0.14 ? 1 : 0.55 + 0.45 * Math.cos(a * 95);
}
/** A drawer open by `o` slammed shut at tw (a quick push, a small rebound). */
function trayShut(t: number, o: number, tw: number) {
  if (t < tw - 0.13) return o;
  if (t < tw) return o * (1 - ease.inQuad(prog(t, tw - 0.13, tw)));
  const a = t - tw;
  return Math.max(-0.004, -0.012 * Math.exp(-a * 16) * Math.sin(a * 40));
}
const pulse = (t: number, t0: number, hl: number) => (t < t0 ? 0 : Math.pow(0.5, (t - t0) / hl));

/** The cold colour of a look: the bluer of accent and accent2. */
function coldOf(k: Look) {
  const blue = (h: string) => { const n = parseInt(h.slice(1), 16); return (n & 255) - ((n >> 16) & 255); };
  return blue(k.accent2) > blue(k.accent) ? k.accent2 : k.accent;
}

// ------------------------------------------------------------------ the documents (Canvas2D)

/** "0001 · TUE 2021-03-09" → ["TUE", "2021-03-09"]. */
function splitStamp(tag: string): [string, string] {
  const m = tag.match(/([A-Z]{3})\s+(\d{4}-\d{2}-\d{2})/);
  return m ? [m[1]!, m[2]!] : [tag.split('·').at(-1)!.trim(), ''];
}
/** The letter's date line from the tag: "Tuesday, 9 March 2021". */
function letterDate(tag: string) {
  const m = tag.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return tag;
  const d = new Date(Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!));
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${days[d.getUTCDay()]}, ${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** A padlock with its body centred at (x, y), body width s; open lifts and turns the shackle. */
function drawLock(c: CanvasRenderingContext2D, x: number, y: number, s: number, col: string, shade: string, open = 0) {
  const top = y - 0.36 * s, r = 0.29 * s, lift = 0.32 * s * open;
  const sy = y - 0.62 * s - lift, sx = Math.max(0.3, Math.cos(1.1 * open));
  c.save();
  c.beginPath();
  c.moveTo(x - r, top + 3);
  c.lineTo(x - r, sy);
  c.ellipse(x - r + r * sx, sy, r * sx, r, 0, Math.PI, 0);
  c.lineTo(x - r + 2 * r * sx, open > 0 ? sy + 0.22 * s : top + 3);
  c.strokeStyle = col; c.lineWidth = 0.15 * s; c.lineCap = 'round'; c.stroke();
  const g = c.createLinearGradient(0, top, 0, top + 0.76 * s);
  g.addColorStop(0, mixHex(col, '#ffffff', 0.25)); g.addColorStop(0.6, col); g.addColorStop(1, mixHex(col, shade, 0.3));
  c.beginPath(); c.roundRect(x - s / 2, top, s, 0.76 * s, 0.16 * s);
  c.fillStyle = g; c.fill();
  const ky = y - 0.04 * s;
  c.beginPath(); c.arc(x, ky, 0.09 * s, 0, Math.PI * 2);
  c.moveTo(x - 0.035 * s, ky); c.lineTo(x - 0.06 * s, ky + 0.24 * s); c.lineTo(x + 0.06 * s, ky + 0.24 * s); c.lineTo(x + 0.035 * s, ky);
  c.fillStyle = mixHex(col, shade, 0.75); c.fill();
  c.restore();
}

/** Frost hairlines from the corners of a w x h card. */
function drawFrost(c: CanvasRenderingContext2D, w: number, h: number, col: string, seed: number, k = 1) {
  const rnd = mulberry32(seed), segs: number[] = [], sc = w / 2.6;
  const W2 = 2.6, H2 = (2.6 * h) / w;
  for (const [u, v, a] of [[0.02, 0.02, 0.5], [W2 - 0.02, 0.02, Math.PI - 0.6], [0.02, H2 - 0.02, -0.45], [W2 - 0.02, H2 - 0.02, Math.PI + 0.5], [W2 * 0.5, 0.02, Math.PI / 2 + 0.3]] as const) {
    grow(segs, rnd, u, v, a, (0.55 + rnd() * 0.35) * k, 0, 0, W2, H2);
  }
  c.save();
  c.strokeStyle = col; c.lineCap = 'round';
  for (let i = 0; i < segs.length; i += 6) {
    const lvl = segs[i + 5]!;
    c.globalAlpha = lvl === 0 ? 0.75 : lvl === 1 ? 0.55 : 0.4;
    c.lineWidth = lvl === 0 ? 1.6 : 1.1;
    c.beginPath(); c.moveTo(segs[i]! * sc, segs[i + 1]! * sc); c.lineTo(segs[i + 2]! * sc, segs[i + 3]! * sc); c.stroke();
  }
  c.restore();
}

/** An envelope seen from the back: paper, folds, the flap, the padlock on its seal, a date stamp, frost or a broken seal. */
function drawEnvelope(c: CanvasRenderingContext2D, w: number, h: number, o: {
  paper: string; line: string; lock: string; frost?: string; seed: number; stamp?: [string, string]; mono?: string; open?: boolean; seal?: string; ink?: string;
}) {
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, mixHex(o.paper, '#ffffff', 0.1)); g.addColorStop(1, mixHex(o.paper, o.line, 0.12));
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.strokeStyle = rgba(o.line, 0.35); c.lineWidth = 3; c.strokeRect(1.5, 1.5, w - 3, h - 3);
  c.beginPath(); c.moveTo(0, h); c.lineTo(w * 0.43, h * 0.55); c.moveTo(w, h); c.lineTo(w * 0.57, h * 0.55);
  c.strokeStyle = rgba(o.line, 0.2); c.lineWidth = 2; c.stroke();
  if (o.open) {
    // the flap folded up, its point above the card's top edge clipped; the inside of the envelope shaded
    c.beginPath(); c.moveTo(0, 2); c.lineTo(w / 2, h * 0.3); c.lineTo(w, 2);
    c.fillStyle = mixHex(o.paper, o.line, 0.1); c.fill();
    c.strokeStyle = rgba(o.line, 0.5); c.lineWidth = 2; c.stroke();
  } else {
    c.beginPath(); c.moveTo(0, 2); c.lineTo(w / 2, h * 0.58); c.lineTo(w, 2);
    c.fillStyle = mixHex(o.paper, '#ffffff', 0.08); c.fill();
    c.strokeStyle = rgba(o.line, 0.35); c.lineWidth = 2; c.stroke();
  }
  if (o.seal) {
    // the broken wax seal, in two halves
    const sx = w / 2, sy = h * 0.58;
    for (const side of [-1, 1]) {
      c.save(); c.translate(sx + side * 7, sy + side * 3); c.rotate(side * 0.18);
      c.beginPath(); c.arc(0, 0, 30, side > 0 ? -Math.PI / 2 : Math.PI / 2, side > 0 ? Math.PI / 2 : Math.PI * 1.5);
      c.closePath(); c.fillStyle = o.seal; c.fill(); c.restore();
    }
    drawLock(c, w * 0.78, h * 0.6, 44, o.lock, o.paper, 1);
  } else drawLock(c, w / 2, h * 0.56, 46, o.lock, o.line, 0);
  if (o.stamp && o.mono) {
    const ink = o.ink ?? mixHex(o.line, o.paper, 0.25);
    c.save(); c.translate(w - 98, h - 52); c.rotate(-0.07);
    c.beginPath(); c.roundRect(-80, -32, 160, 64, 7); c.strokeStyle = ink; c.lineWidth = 3; c.stroke();
    c.font = font(o.mono, 25); c.fillStyle = ink; c.textAlign = 'center';
    c.fillText(o.stamp[0], 0, -5); c.fillText(o.stamp[1], 0, 22);
    c.restore();
  }
  if (o.frost) drawFrost(c, w, h, o.frost, o.seed);
}

/** A page: a handwritten letter (with a date in serif italic), a floor plan, or a birthday cake; a broken red seal. */
function drawPage(c: CanvasRenderingContext2D, w: number, h: number, kind: 'letter' | 'plan' | 'cake', o: {
  paper: string; ink: string; red: string; seed: number; date?: string; serif?: string; mono?: string; alt?: boolean;
}) {
  const rnd = mulberry32(o.seed);
  c.fillStyle = o.paper; c.fillRect(0, 0, w, h);
  c.strokeStyle = rgba(o.ink, 0.25); c.lineWidth = 2; c.strokeRect(1, 1, w - 2, h - 2);
  // the creases of the tri-fold
  c.strokeStyle = rgba(o.ink, 0.1); c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(0, h / 3); c.lineTo(w, h / 3); c.moveTo(0, (2 * h) / 3); c.lineTo(w, (2 * h) / 3); c.stroke();
  c.strokeStyle = o.ink; c.fillStyle = o.ink; c.lineJoin = 'round'; c.lineCap = 'round';
  if (kind === 'letter') {
    let y0 = 52;
    if (o.date && o.serif) {
      c.font = font(o.serif, 30); c.textAlign = 'left'; c.fillText(o.date, 34, 58);
      y0 = 104;
    }
    c.lineWidth = 2.2;
    for (let y = y0; y < h - 40; y += 30) {
      c.strokeStyle = rgba(o.ink, 0.12); c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(30, y + 6); c.lineTo(w - 30, y + 6); c.stroke();
      c.strokeStyle = rgba(o.ink, 0.85); c.lineWidth = 2.1;
      let x = 34 + (y === y0 ? 26 : 0);
      const end = y > h - 80 ? w * 0.55 : w - 34 - rnd() * 50;
      while (x < end) {
        const wl = 18 + rnd() * 46;
        c.beginPath();
        for (let xx = x; xx < Math.min(x + wl, end); xx += 2) {
          const yy = y + Math.sin(xx * 0.55 + rnd() * 0.4) * (3 + rnd() * 3) - (rnd() < 0.05 ? 7 : 0);
          if (xx === x) c.moveTo(xx, yy); else c.lineTo(xx, yy);
        }
        c.stroke();
        x += wl + 9 + rnd() * 6;
      }
    }
  } else if (kind === 'plan') {
    c.save(); c.translate(w / 2, h / 2 - 10); if (o.alt) c.rotate(Math.PI / 2); c.translate(-150, -170);
    c.lineWidth = 4; c.strokeRect(0, 0, 300, 340);
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(150, 0); c.lineTo(150, 120); c.moveTo(150, 170); c.lineTo(150, 340);
    c.moveTo(0, 200); c.lineTo(90, 200); c.moveTo(130, 200); c.lineTo(150, 200);
    c.moveTo(150, 130 + 120); c.lineTo(230, 250); c.moveTo(270, 250); c.lineTo(300, 250);
    c.stroke();
    c.beginPath(); c.moveTo(90, 200); c.arc(90, 200, 40, 0, -Math.PI / 2, true); c.stroke();
    c.beginPath(); c.moveTo(230, 250); c.arc(230, 250, 40, Math.PI, Math.PI * 1.5); c.stroke();
    c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(0, 362); c.lineTo(300, 362); c.moveTo(0, 354); c.lineTo(0, 370); c.moveTo(300, 354); c.lineTo(300, 370); c.stroke();
    c.strokeRect(190, 30, 80, 60); c.strokeRect(30, 240, 70, 70);
    c.restore();
  } else {
    c.save(); c.translate(w / 2, h / 2 + 30);
    c.lineWidth = 3;
    c.beginPath(); c.ellipse(0, 70, 130, 16, 0, 0, Math.PI * 2); c.stroke();
    c.strokeRect(-100, 0, 200, 64); c.strokeRect(-66, -52, 132, 52);
    c.lineWidth = 2;
    c.beginPath();
    for (let x = -100; x < 100; x += 20) { c.moveTo(x, 12); c.arc(x + 10, 12, 10, Math.PI, 0, true); }
    for (let x = -66; x < 66; x += 16.5) { c.moveTo(x, -42); c.arc(x + 8.25, -42, 8.25, Math.PI, 0, true); }
    c.stroke();
    for (const x of [-42, -14, 14, 42]) {
      c.strokeRect(x - 4, -96, 8, 44);
      c.beginPath(); c.moveTo(x, -124); c.quadraticCurveTo(x + 9, -110, x, -102); c.quadraticCurveTo(x - 9, -110, x, -124); c.fill();
    }
    if (o.mono) { c.font = font(o.mono, 22); c.textAlign = 'center'; c.fillText('12 · 06 · 1987', 0, 130); }
    c.restore();
  }
  // the broken seal in a corner
  const sx = w - 48, sy = h - 46;
  c.fillStyle = o.red;
  for (const side of [-1, 1]) {
    c.save(); c.translate(sx + side * 4, sy + side * 2); c.rotate(side * 0.2);
    c.beginPath(); c.arc(0, 0, 20, side > 0 ? -Math.PI / 2 : Math.PI / 2, side > 0 ? Math.PI / 2 : Math.PI * 1.5); c.closePath(); c.fill();
    c.restore();
  }
}

/** The drawer's paper tag: typed mono text. */
function drawTag(c: CanvasRenderingContext2D, w: number, h: number, s: string, mono: string, ink: string, paper: string) {
  c.fillStyle = paper; c.fillRect(0, 0, w, h);
  c.strokeStyle = rgba(ink, 0.35); c.lineWidth = 3; c.strokeRect(1.5, 1.5, w - 3, h - 3);
  c.font = font(mono, 74); c.fillStyle = ink; c.textAlign = 'left'; c.textBaseline = 'middle';
  c.fillText(s, 34, h / 2 + 3);
}

/** A rack-end counter: five mono digits in the lamp colour on a steel plate. */
function drawCounter(c: CanvasRenderingContext2D, w: number, h: number, v: number, mono: string, k: Look) {
  c.fillStyle = mixHex(k.bg, k.dim, 0.28); c.fillRect(0, 0, w, h);
  c.strokeStyle = rgba(k.dim, 0.6); c.lineWidth = 4; c.strokeRect(2, 2, w - 4, h - 4);
  c.fillStyle = mixHex(k.bg, k.dim, 0.08); c.fillRect(26, 26, w - 52, h - 52);
  const s = String(v).padStart(5, '0'), cw = 120, x0 = w / 2 - (cw * 5) / 2 + cw / 2;
  c.font = font(mono, 170); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = mixHex(k.accent, '#ffffff', 0.12);
  for (let i = 0; i < 5; i++) c.fillText(s[i]!, x0 + i * cw, h / 2 + 6);
}

/** The storage gauge: a kicker, the big reading and its unit, a label, and a log-scale fill bar with decade ticks. */
function drawGauge(c: CanvasRenderingContext2D, w: number, h: number, o: {
  title: string; num: string; unit: string; label: string; frac: number; display: string; body: string; mono: string;
}, k: Look) {
  c.fillStyle = mixHex(k.bg, k.dim, 0.3); c.fillRect(0, 0, w, h);
  c.strokeStyle = rgba(k.dim, 0.7); c.lineWidth = 6; c.strokeRect(3, 3, w - 6, h - 6);
  c.fillStyle = mixHex(k.bg, k.dim, 0.06); c.fillRect(24, 24, w - 48, h - 48);
  const x0 = 64, x1 = w - 64;
  c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  c.font = font(o.mono, 34); c.fillStyle = mixHex(k.type, k.bg, 0.35);
  c.letterSpacing = '4px'; c.fillText(o.title.toUpperCase(), x0, 92); c.letterSpacing = '0px';
  // the number, shrunk to fit beside its unit
  c.font = font(o.display, 84);
  const uw = o.unit ? c.measureText(o.unit).width + 22 : 0;
  c.font = font(o.display, 230);
  const nw = c.measureText(o.num).width;
  if (nw > x1 - x0 - uw) c.font = font(o.display, (230 * (x1 - x0 - uw)) / nw);
  c.fillStyle = mixHex(k.accent, '#ffffff', 0.15);
  c.fillText(o.num, x0, 330);
  if (o.unit) {
    const ex = c.measureText(o.num).width;
    c.font = font(o.display, 84); c.fillStyle = mixHex(k.accent, k.bg, 0.35);
    c.fillText(o.unit, x0 + ex + 22, 330);
  }
  c.font = font(o.body, 52); c.fillStyle = k.type; c.fillText(o.label, x0, 420);
  // the fill bar, a tick per quarter
  const by = 484, bh = 26;
  c.fillStyle = mixHex(k.bg, k.dim, 0.25); c.fillRect(x0, by, x1 - x0, bh);
  c.fillStyle = k.accent; c.fillRect(x0, by, (x1 - x0) * o.frac, bh);
  c.fillStyle = mixHex(k.bg, k.dim, 0.6);
  for (let i = 0; i <= 4; i++) c.fillRect(x0 + ((x1 - x0) * i) / 4 - 1.5, by + bh + 8, 3, 16);
}

/** The hanging tag: a big mono reading on a dark plate. */
function drawWallTag(c: CanvasRenderingContext2D, w: number, h: number, s: string, mono: string, k: Look) {
  c.fillStyle = mixHex(k.bg, k.dim, 0.25); c.fillRect(0, 0, w, h);
  c.strokeStyle = rgba(k.accent, 0.55); c.lineWidth = 5; c.strokeRect(10, 10, w - 20, h - 20);
  c.font = font(mono, 168); c.fillStyle = k.accent; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(s, w / 2, h / 2 + 8);
}
