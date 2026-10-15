// Harvest Now, Decrypt Later (Banger Remix): the scale. The archive at every size, as one world seen from above:
// the frosted lids of the drawers (each a sealed envelope under frost with a gold lamp), racks of them between
// aisles of strip light, halls of racks, city blocks of halls, and from orbit whole continents veined with their
// gold light under the blue rim of the atmosphere. A single fullscreen shader draws the ground at any altitude
// (each level fades to its average once its features are smaller than a pixel), flat below 20 km, on the sphere
// above it. Phases (entry `phase`):
// - `gauge` (the instrumental after chorus 1): a powers-of-ten pull back, one level per cue (the cue's downbeat
//   kicks the camera out to the next size), with the storage gauge rolling to each cue's `value` and `label`.
// - `pullback` (bridge, "Petabytes, darling"): from over a city of halls out to the whole night side of the planet,
//   every landmass veined with archive light; a wall tag with the total.
// - `dawn` (after the last chorus): the planet from orbit as the sun rises over its limb; daylight sweeps across
//   and the archive's lights go out under it; on the anchor the sun clears the limb and floods the frame.
import * as THREE from 'three';
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import { FSPass, Layer2D } from '../engine/gl';
import { clamp, ease, hexToLinear, lerp, prog } from '../engine/util';
import { font, measure } from '../engine/type';
import { LibScene, W, H, hit, label } from './_lib';
import { Stage, colors, lin, fitOf } from './harvest-remix-kit';
import { EARTH_GLSL, earthMaps, geoFrame } from './harvest-remix-earth';

// the first drawer: in Frankfurt, among the data centres
const HOME = [50.11, 8.68] as const;

export const schema: SceneSchema = {
  description: 'The archive at every scale, as one world seen from above: frosted drawer lids with gold lamps, racks between lit aisles, halls, city blocks, continents veined with gold light under the atmosphere. gauge: a powers-of-ten pull back, a level per cue, a storage gauge rolling to each value; pullback: from a city out to the whole night side of the planet; dawn: the sun rises over the limb, daylight puts the lights out, the sun floods the frame on the anchor. Harvest remix.',
  kinds: ['song'],
  lyrics: 'layer',
  entry: {
    phase: { type: 'string', enum: ['gauge', 'pullback', 'dawn'], default: 'gauge', description: 'which pass over the world' },
    title: { type: 'string', default: 'Cold storage · used', description: 'gauge: the readout\'s kicker' },
    unit: { type: 'string', default: ' PB', description: 'gauge: the unit after the value' },
  },
  cue: {
    value: { type: 'number', default: 0, description: 'gauge: the reading the gauge rolls to on the cue\'s downbeat' },
    label: { type: 'string', default: '', description: 'gauge: what that much is ("one Tuesday")' },
    wallTag: { type: 'string', default: '', description: 'pullback: the total shown as a tag' },
  },
  example: { entry: { phase: 'gauge' }, cues: [{ value: 0.1, label: 'one Tuesday' }, { value: 4.7, label: 'one company' }] },
};

type Phase = 'gauge' | 'pullback' | 'dawn';
interface P { phase: Phase; title: string; unit: string }
interface C { value: number; label: string; wallTag: string }

const RE = 6.371e6;

const WORLD_F = /* glsl */ `
uniform float uH, uPitch, uYaw, uFov, uTime, uSun, uLights, uFlood;
uniform vec3 uGold, uIce, uDeep, uSunC;
uniform vec2 uCamXY;
uniform mat3 uGeo;
const float RE = ${RE.toFixed(1)};
${EARTH_GLSL}
const vec3 GROUND = vec3(0.004, 0.006, 0.010);
const vec3 OCEAN = vec3(0.0015, 0.003, 0.008);

float box01(vec2 q, vec2 a, vec2 b, float aa) {
  vec2 d = max(a - q, q - b);
  return 1.0 - smoothstep(-aa, aa, max(d.x, d.y));
}
float lineAA(float d, float w, float aa) { return 1.0 - smoothstep(w - aa, w + aa, abs(d)); }

// a 2D Voronoi: (distance to the nearest cell point, distance to the edge between the two nearest)
vec2 voro(vec2 p) {
  vec2 n = floor(p), f = fract(p);
  float d1 = 8.0, d2 = 8.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j)), o = hash22(n + g);
    float d = length(g + o - f);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
  }
  return vec2(d1, d2 - d1);
}
// one drawer lid (q in 0..1, x across 0.62 m, y across 0.40 m; pm: metres per pixel): a brushed steel frame with
// screws, frosted glass over a sealed envelope (its flap, a postmark, the red wax seal with the padlock sigil), the
// frost grown in facets and feathers thickest at the edges, the gold lamp in its bezel
vec3 tile(vec2 q, float seed, float pm) {
  vec2 m = q * vec2(0.62, 0.40), cq = m - vec2(0.31, 0.2);
  float aa = max(pm, 1e-4);
  vec3 steel = vec3(0.045, 0.05, 0.058) * (0.85 + 0.3 * hash12(vec2(floor(m.y * 1500.0), floor(seed * 40.0))));
  float dIn = sdBox(cq, vec2(0.282, 0.172)) - 0.006;
  float glassIn = 1.0 - smoothstep(-aa, aa, dIn);
  vec3 c = steel;
  c *= 1.0 + 0.9 * (1.0 - smoothstep(0.0, aa * 1.5, abs(dIn + 0.001))) * step(0.0, cq.y); // the lit inner lip
  for (int k = 0; k < 4; k++) {
    vec2 sp = vec2(k == 0 || k == 2 ? -0.296 : 0.296, k < 2 ? -0.186 : 0.186);
    float ds = length(cq - sp);
    c = mix(c, vec3(0.09, 0.09, 0.1) * (0.6 + 0.8 * smoothstep(0.006, 0.0, length(cq - sp + 0.002))), 1.0 - smoothstep(0.007 - aa, 0.007 + aa, ds));
    c *= 1.0 - 0.7 * (1.0 - smoothstep(0.0, aa, abs(dot(cq - sp, normalize(vec2(1.0, 0.6 + seed))) ))) * step(ds, 0.006);
  }
  // under the glass
  vec2 ep = cq - vec2(-0.01, 0.0);
  float dEnv = sdBox(ep, vec2(0.22, 0.135)) - 0.004;
  float env = 1.0 - smoothstep(-aa, aa, dEnv);
  vec3 under = vec3(0.004, 0.005, 0.007);
  vec3 paper = vec3(0.62, 0.56, 0.46) * 0.32 * (0.92 + 0.08 * fbm(m * 60.0, 2));
  float flap = min(sdSegment(ep, vec2(-0.22, 0.135), vec2(0.0, -0.01)), sdSegment(ep, vec2(0.22, 0.135), vec2(0.0, -0.01)));
  paper *= 1.0 - 0.25 * (1.0 - smoothstep(0.0, aa * 1.2 + 0.0008, flap)) - 0.12 * smoothstep(0.0, -0.08, ep.y - 0.135 + 0.0) * step(ep.y, 0.135);
  // the postmark: two rings and wavy cancellation lines, in blue ink
  vec2 pp = ep - vec2(0.15, 0.08);
  float ring = min(abs(length(pp) - 0.034), abs(length(pp) - 0.025));
  float wav = abs(fract((pp.y + 0.003 * sin(pp.x * 300.0)) / 0.008) - 0.5) * 0.008;
  float ink = max(1.0 - smoothstep(0.0012, 0.0012 + aa, ring), (1.0 - smoothstep(0.0009, 0.0009 + aa, wav)) * step(pp.x, -0.04) * step(-0.13, pp.x) * step(abs(pp.y), 0.016));
  paper = mix(paper, vec3(0.03, 0.05, 0.12), ink * 0.7);
  // the wax seal: a red disc with a raised rim, the padlock sigil pressed into it, a glint
  vec2 wp = ep - vec2(0.0, -0.012);
  float dw = length(wp * vec2(1.0, 1.05)) - 0.032 - 0.002 * sin(atan(wp.y, wp.x) * 9.0 + seed * 20.0);
  float wax = 1.0 - smoothstep(-aa, aa, dw);
  vec3 waxC = vec3(0.32, 0.012, 0.025) * (0.8 + 0.5 * smoothstep(0.03, 0.0, length(wp - vec2(-0.01, 0.012))));
  float sig = min(sdBox(wp - vec2(0.0, -0.006), vec2(0.011, 0.008)) - 0.002, abs(length(wp - vec2(0.0, 0.004)) - 0.007) - 0.0016 + step(wp.y, 0.004) * 1.0);
  waxC *= 1.0 - 0.45 * (1.0 - smoothstep(0.0, aa, sig));
  waxC *= 1.0 + 0.6 * (1.0 - smoothstep(0.0, aa * 2.0, abs(dw + 0.004)));
  paper = mix(paper, waxC, wax);
  under = mix(under, paper, env);
  // frost: faceted plates, feathery crystals from the edges, a milky haze thickening toward the frame
  float edgeD = -dIn;
  vec2 vf = voro(m * 70.0 + seed * 13.0);
  float facets = 1.0 - smoothstep(0.0, 0.06, vf.y);
  // crystalline lace: fine Voronoi edges where the frost has grown (thick at the frame, in tongues toward the middle)
  float grown = smoothstep(0.0, 0.25, fbm(m * 9.0 + seed * 5.0, 3) * 0.5 + 0.5 - smoothstep(0.0, 0.11, edgeD) * -0.6 - 0.35 + 0.5 * (1.0 - smoothstep(0.0, 0.08, edgeD)));
  float lace = (1.0 - smoothstep(0.0, 0.09, voro(m * 190.0 + seed * 31.0).y)) * (1.0 - smoothstep(0.0, 0.0012, aa));
  float feather = (lace * 0.8 + 0.25) * grown;
  float haze = 0.35 + 0.45 * (1.0 - smoothstep(0.0, 0.09, edgeD)) + 0.12 * fbm(m * 25.0, 3);
  vec3 frostC = mix(uIce, vec3(1.0), 0.4) * 0.09;
  vec3 g = mix(under, frostC, sat(haze * 0.8));
  g += frostC * (facets * 0.35 * (1.0 - smoothstep(0.0, 0.002, aa)) + feather * 1.2);
  // the glass's sheen: a broad soft reflection across the lid
  g += vec3(0.02, 0.025, 0.03) * smoothstep(0.08, 0.0, abs(cq.x * 0.5 + cq.y + 0.05 - seed * 0.1));
  c = mix(c, g, glassIn);
  // the lamp: a small gold LED in a dark bezel at the frame's corner
  float lit = step(seed, 0.78);
  vec2 lc = cq - vec2(0.268, -0.18);
  float bez = 1.0 - smoothstep(0.009 - aa, 0.009 + aa, length(lc));
  c = mix(c, vec3(0.006), bez);
  float ld = length(lc * vec2(1.0, 1.0));
  c += uGold * lit * uLights * (exp(-ld * ld / 0.00002) * 6.0 + exp(-ld * ld / 0.0006) * 0.25 + exp(-ld * ld / 0.01) * 0.03);
  return c;
}
// the averages each level fades to once its features are below a pixel
vec3 tileAvg() { return mix(uIce, vec3(1.0), 0.4) * 0.05 + vec3(0.62, 0.56, 0.46) * 0.02 + uGold * uLights * 0.01; }
const float RP = 1.6, RD = 0.4, SEG = 12.4, GAP = 1.2;
vec3 aisleAvg() { return vec3(0.012, 0.014, 0.018) + mix(uIce, vec3(1.0), 0.35) * 0.04; }
vec3 hallAvg() { return mix(aisleAvg(), tileAvg(), (RD / RP) * (SEG / (SEG + GAP))); }

// a hall's floor (hp in metres from its corner): rows of racks of drawer lids between aisles of raised-floor tiles, a
// light fixture every few metres down each aisle, structural columns in the cross aisles, the hall's walls
vec3 hall(vec2 hp, float fp) {
  float ry = floor(hp.y / RP), fy = hp.y - ry * RP;
  float sx = mod(hp.x, SEG + GAP), sid = floor(hp.x / (SEG + GAP));
  float inRack = box01(vec2(sx, fy), vec2(0.0, 0.2), vec2(SEG, 0.2 + RD), fp);
  // the aisle: raised-floor tiles with perforated ones in the middle, glowing faintly where the fixtures are
  vec2 tq = vec2(sx, fy - 0.6) / 0.6, tf = fract(tq) - 0.5;
  float seam = (1.0 - smoothstep(0.0, fp * 1.5 + 0.003, min(abs(tf.x), abs(tf.y)) * 0.6 - 0.296)) * (1.0 - smoothstep(0.02, 0.06, fp));
  vec3 aisle = vec3(0.012, 0.014, 0.018) * (0.8 + 0.4 * hash12(floor(tq) + sid * 7.0)) * (1.0 - 0.5 * seam);
  float yMid = 0.6 + (RP - 0.6) * 0.5;
  // light fixtures: 1.2 m long, every 2.0 m; a pool of light on the floor around each
  float fxa = mod(sx + 0.4, 2.0) - 1.0;
  float fix = box01(vec2(fxa, fy - yMid), vec2(-0.6, -0.05), vec2(0.6, 0.05), fp);
  float pool = exp(-(fxa * fxa * 0.6 + pow(fy - yMid, 2.0) * 3.0));
  vec3 cold = mix(uIce, vec3(1.0), 0.35);
  aisle += cold * (pool * 0.02 + fix * 1.1 * clamp(0.06 / max(fp, 0.02), 0.15, 1.0)) * (1.0 - smoothstep(1.0, 3.0, fp));
  float tx = floor(sx / 0.62);
  vec2 q = vec2(fract(sx / 0.62), (fy - 0.2) / RD);
  float hero = (abs(hp.x - 33.71) < 0.31 && abs(hp.y - 74.0) < 0.2) ? 1.0 : 0.0;
  float seed = hero > 0.5 ? 0.0 : hash12(vec2(tx + sid * 31.0, ry));
  vec3 lid = tile(q, seed, fp);
  lid = mix(lid, tileAvg(), smoothstep(0.04, 0.16, fp));
  // a lamp smaller than a pixel is still a point of light
  vec2 lc = vec2(tx * 0.62 + 0.578, 0.2 + 0.02);
  float ldp = length(vec2(sx, fy) - lc) / max(fp, 1e-4);
  lid += uGold * uLights * step(seed, 0.78) * exp(-ldp * ldp / 0.6) * 2.2 * smoothstep(0.03, 0.12, fp) * (1.0 - smoothstep(0.25, 0.6, fp));
  vec3 c = mix(aisle, lid, max(inRack, smoothstep(0.1, 0.4, fp) * step(abs(fy - 0.4), 0.2 + fp)));
  // structural columns in the cross aisles, every other rack row
  vec2 cp = vec2(sx - (SEG + GAP * 0.5), mod(hp.y, 2.0 * RP) - RP);
  c = mix(c, vec3(0.03, 0.032, 0.036), box01(cp, vec2(-0.3), vec2(0.3), fp));
  c = mix(c, hallAvg(), smoothstep(1.5, 4.0, fp));
  return c;
}

// the ground at p (metres from the first drawer), its footprint fp (metres per pixel); e: its earth-fixed direction
// (the real map decides land and sea and how dense the archive's lights are); s: the surface there
vec3 world(vec2 p, float fp, vec3 e, out Surf s) {
  s = earthSurface(e, fp);
  float isLand = s.land;
  float dens = sat(s.lights * 1.6 + 0.9 * exp(-dot(p, p) / (2.0e4 * 2.0e4))) * isLand;
  dens *= sat(fbm(p / 4.0e4 + 9.1, 4) * 2.0 + 0.6);
  // city blocks of 120 x 200 m; a hall of 80 x 150 m in those the archive has reached
  vec2 bs = vec2(120.0, 200.0);
  vec2 q = p + vec2(33.71, 74.0); // the first drawer, inside the first hall
  vec2 bid = floor(q / bs), bp = q - bid * bs;
  float has = (hash12(bid + 0.5) < dens || all(equal(bid, vec2(0.0)))) ? 1.0 : 0.0;
  float inHall = box01(bp, vec2(0.0), vec2(80.0, 150.0), fp) * has;
  vec3 floorC = hall(bp, fp);
  // lamps smaller than a pixel: a glitter of gold points, as city lights at night
  float gcell = max(fp, 0.62);
  float glit = step(0.95, hash12(floor(q / gcell) + 17.0)) * smoothstep(0.3, 0.8, fp);
  floorC += uGold * uLights * glit * 1.2 * (1.0 - smoothstep(25.0, 90.0, fp));
  floorC = mix(floorC, hallAvg(), smoothstep(6.0, 25.0, fp));
  // the streets between blocks, lit by a lamp every 30 m; an avenue every fifth block, wider and brighter
  float av = (mod(bid.x, 5.0) == 0.0 ? 1.0 : 0.0), avy = (mod(bid.y, 4.0) == 0.0 ? 1.0 : 0.0);
  float rx = lineAA(bp.x - 100.0, 4.0 + 6.0 * av, fp), ry = lineAA(bp.y - 175.0, 4.0 + 6.0 * avy, fp);
  float lampsX = 0.35 + 0.65 * exp(-pow(mod(q.y, 30.0) - 15.0, 2.0) / max(6.0, fp * fp));
  float lampsY = 0.35 + 0.65 * exp(-pow(mod(q.x, 30.0) - 15.0, 2.0) / max(6.0, fp * fp));
  float road = max(rx * lampsX * (1.0 + av), ry * lampsY * (1.0 + avy));
  vec3 ground = GROUND + uGold * uLights * 0.22 * road * (0.15 + dens);
  vec3 city = mix(ground, floorC, inHall);
  // the other buildings of the block: dark roofs with rooftop plant and a few skylights
  vec2 nsub = vec2(1.0 + floor(hash12(bid + 3.3) * 3.0), 1.0 + floor(hash12(bid + 8.1) * 2.0));
  vec2 sub = vec2(100.0, 175.0) / nsub, sp = mod(bp, sub), sbi = floor(bp / sub);
  float bld = box01(sp, vec2(3.0), sub - 3.0, fp) * step(bp.x, 100.0) * step(bp.y, 175.0) * (1.0 - inHall);
  float hr = hash12(bid + sbi * 7.1 + 0.3);
  vec3 roof = vec3(0.011, 0.012, 0.014) * (0.6 + 0.9 * hr);
  vec2 pc = floor(sp / 9.0);
  roof *= 1.0 + 0.9 * box01(mod(sp, 9.0) - 4.5, vec2(-1.6), vec2(1.6), fp) * step(0.55, hash12(pc + sbi + bid));
  roof += uGold * uLights * 0.7 * step(0.97 - dens * 0.05, hash12(floor(sp / 2.5) + bid * 13.0 + sbi)) * (1.0 - smoothstep(3.0, 10.0, fp));
  city = mix(city, roof, bld);
  // traffic: headlights one way, tail lights the other, on every street
  vec2 lane = vec2(bp.x - 100.0, bp.y - 175.0);
  float onX = (1.0 - smoothstep(0.7, 0.7 + fp, abs(lane.x - 1.6))), offX = (1.0 - smoothstep(0.7, 0.7 + fp, abs(lane.x + 1.6)));
  float onY = (1.0 - smoothstep(0.7, 0.7 + fp, abs(lane.y - 1.6))), offY = (1.0 - smoothstep(0.7, 0.7 + fp, abs(lane.y + 1.6)));
  float cw = max(2.0, fp * fp);
  float h1 = exp(-pow(mod(q.y + uTime * 14.0 + hash12(bid) * 300.0, 41.0) - 20.0, 2.0) / cw);
  float t1 = exp(-pow(mod(q.y - uTime * 12.0 + hash12(bid + 1.0) * 300.0, 53.0) - 26.0, 2.0) / cw);
  float h2 = exp(-pow(mod(q.x + uTime * 13.0 + hash12(bid + 2.0) * 300.0, 47.0) - 23.0, 2.0) / cw);
  float t2 = exp(-pow(mod(q.x - uTime * 11.0 + hash12(bid + 3.0) * 300.0, 59.0) - 29.0, 2.0) / cw);
  vec3 cars = vec3(1.0, 0.92, 0.75) * (h1 * onX + h2 * onY) + vec3(0.9, 0.06, 0.02) * (t1 * offX + t2 * offY);
  city += cars * 1.6 * (0.3 + dens) * (1.0 - smoothstep(4.0, 12.0, fp)) * (1.0 - inHall);
  vec3 cityAvg = GROUND + uGold * uLights * 0.22 * (0.15 + dens) * 0.12 + dens * 0.5 * (hallAvg() - GROUND);
  // halls smaller than a pixel glitter too, thinning with the density
  float hc = max(fp * 1.5, 30.0);
  float hg = step(1.0 - dens * 0.75, hash12(floor(p / hc) + 3.0));
  cityAvg += uGold * uLights * hg * (0.3 + 0.4 * hash12(floor(p / hc) + 9.0)) * smoothstep(20.0, 80.0, fp);
  // and the town's glow under it, from the map
  cityAvg += uGold * uLights * s.lights * 0.35 * smoothstep(30.0, 200.0, fp);
  city = mix(city, cityAvg, smoothstep(25.0, 90.0, fp));
  vec3 c = mix(OCEAN, city, isLand);
  // from high up: the map's night lights, gold, white-hot in the biggest cities
  float li = s.lights;
  vec3 orbit = mix(OCEAN, vec3(0.008, 0.009, 0.012), isLand) + uGold * uLights * (li * 0.7 + li * li * 0.9) + vec3(1.0, 0.85, 0.6) * uLights * pow(li, 4.0) * 0.5;
  return mix(c, orbit, smoothstep(120.0, 900.0, fp));
}

vec3 stars(vec3 rd) {
  vec3 q = rd * 300.0, id = floor(q);
  float h = hash13(id);
  float s = step(0.992, h) * (1.0 - smoothstep(0.0, 0.35, length(fract(q) - 0.5)));
  return vec3(0.6, 0.7, 1.0) * s * 0.6;
}

void main() {
  vec2 sp = (vUv - 0.5) * vec2(${(W / H).toFixed(4)}, 1.0);
  float tf = tan(uFov * 0.5);
  // camera: above the first drawer (plus uCamXY), looking down, pitched toward +y by uPitch, turned by uYaw
  vec3 fw = vec3(0.0, sin(uPitch), -cos(uPitch));
  vec3 rt = vec3(1.0, 0.0, 0.0);
  vec3 up = cross(rt, fw);
  mat2 yr = rot2(uYaw);
  fw.xy = yr * fw.xy; rt.xy = yr * rt.xy; up.xy = yr * up.xy;
  vec3 rd = normalize(fw + (sp.x * rt + sp.y * up) * 2.0 * tf);
  float pxAng = 2.0 * tf / ${H.toFixed(1)};
  vec3 col;
  float flatK = 1.0 - smoothstep(1.5e4, 3.0e4, uH);
  vec3 cf = vec3(0.0), cs = vec3(0.0);
  if (flatK > 0.0) {
    // flat ground: z = 0
    if (rd.z < -1e-4) {
      float d = uH / -rd.z;
      vec2 p = uCamXY + rd.xy * d;
      float fp = d * pxAng / max(-rd.z, 0.2);
      Surf sf;
      cf = world(p, fp, uGeo * normalize(vec3(p, RE)), sf);
      // haze over distance
      cf = mix(cf, uDeep * 0.02, 1.0 - exp(-d / 6.0e5));
    } else cf = uDeep * 0.01 + stars(rd);
  }
  if (flatK < 1.0) {
    // the sphere: centre below the camera
    vec3 ro = vec3(uCamXY, RE + uH);
    float b = dot(ro, rd), c = dot(ro, ro) - RE * RE, disc = b * b - c;
    float ra = RE + 1.6e5;
    float ca = dot(ro, ro) - ra * ra, discA = b * b - ca;
    vec3 sun = normalize(vec3(0.0, cos(uSun), sin(uSun)));
    float hasSun = step(-1.5, uSun);
    if (disc > 0.0) {
      float d = -b - sqrt(disc);
      vec3 hp = ro + rd * d, n = normalize(hp);
      vec2 p = vec2(atan(n.x, n.z), asin(clamp(n.y, -1.0, 1.0))) * RE;
      float fp = d * pxAng / max(-dot(rd, n), 0.15);
      vec3 e = uGeo * n;
      Surf s;
      vec3 lights = world(p, fp, e, s);
      float ndl = dot(n, sun);
      float day = smoothstep(-0.1, 0.22, ndl) * hasSun;
      // clouds, from high enough up: they veil the lights at night (their tops faintly moonlit), white by day
      float cl = clouds(e, uTime) * smoothstep(1.5e5, 9e5, uH);
      vec3 night = lights * (1.0 - 0.7 * cl) + vec3(0.012, 0.016, 0.026) * cl;
      vec3 alb = mix(earthDay(e, s), vec3(0.8, 0.82, 0.86), cl);
      // daylight, reddened along the terminator, and the sun's glint on the sea
      vec3 sunC = mix(vec3(1.0, 0.42, 0.18), uSunC, smoothstep(0.02, 0.4, ndl));
      vec3 dayC = alb * sunC * max(ndl, 0.0) * 3.2;
      vec3 hv = normalize(sun - rd);
      dayC += uSunC * pow(max(dot(n, hv), 0.0), 400.0) * 6.0 * (1.0 - s.land) * (1.0 - cl);
      cs = mix(night, dayC + lights * 0.04, day);
      // the air over the surface: a blue haze thickening toward the limb, gold where the sun grazes it
      float mu = -dot(rd, n);
      vec3 airC = mix(uDeep * 0.1, mix(vec3(1.0, 0.5, 0.22), uSunC, 0.5) * 0.9, smoothstep(-0.25, 0.3, ndl) * hasSun);
      cs = mix(cs, airC, pow(1.0 - mu, 5.0) * 0.75);
    } else {
      cs = stars(rd);
    }
    if (discA > 0.0 && disc <= 0.0) {
      // the limb: a thin bright line of air hugging the planet, a soft glow above it, and the faint airglow shell
      float closest = sqrt(max(dot(ro, ro) - b * b, 0.0)), hgt = max(closest - RE, 0.0);
      vec3 pc = normalize(ro + rd * -b);
      float sunSide = hasSun * pow(sat(dot(pc, sun) * 0.5 + 0.5), 3.0);
      vec3 rimC = mix(uDeep * 1.1, mix(vec3(1.0, 0.55, 0.25), uSunC, 0.4) * 2.5, sunSide);
      cs += rimC * (exp(-hgt / 7.0e3) * 1.1 + exp(-hgt / 3.0e4) * 0.3);
      cs += uIce * 0.05 * exp(-pow((hgt - 9.5e4) / 5.0e3, 2.0));
    }
    // the sun itself, once it clears the limb
    if (uSun > -1.5 && disc <= 0.0) {
      float sd = 1.0 - dot(rd, sun);
      cs += uSunC * (exp(-sd / 3e-5) * 9.0 + exp(-sd / 0.0012) * 1.2 + exp(-sd / 0.012) * 0.06);
    }
  }
  col = mix(cs, cf, flatK);
  col = mix(col, vec3(2.2, 2.1, 1.95), uFlood);
  fragColor = vec4(col, 1000.0);
}`;

/** log10 altitude keys (time, log10 h). */
type Alt = [number, number];

export default class HarvestRemixScale extends LibScene<P, C> {
  static schema = schema;
  private st = new Stage();
  private pass!: FSPass;
  private over = new Layer2D();
  private alts: Alt[] = [];
  private S = 0; private E = 0;
  private c = colors(this.ctx.style, 'amber');
  private get ph() { return this.P.phase; }

  override setup() {
    this.st.fit = fitOf(this.ctx.style);
    this.S = this.ctx.start; this.E = this.ctx.end;
    this.c = colors(this.ctx.style, this.cues[0]?.def.palette ?? 'amber');
    const S = this.S, E = this.E;
    if (this.ph === 'gauge') {
      // one level per cue: a kick out on its downbeat, then a slow drift
      // each cue's level: one drawer, the aisles, a hall, a city, a continent; a kick out on the downbeat
      const lv = [-0.25, 1.35, 2.95, 4.5, 6.6], drift = [0.35, 0.3, 0.3, 0.35, 0.15];
      this.alts = [[S - 0.5, lv[0]!]];
      this.cues.forEach((c, i) => {
        const next = (this.cues[i + 1]?.at ?? E) - 0.02;
        if (i) { this.alts.push([c.at, this.alts.at(-1)![1]]); this.alts.push([c.at + 0.85, lv[i]!]); }
        this.alts.push([next, lv[i]! + drift[i]!]);
      });
      // the last level opens out to the continent from orbit
      const last = this.cues.at(-1);
      if (last) { this.alts.pop(); this.alts.push([last.at + 1.1, 5.9], [E + 0.2, lv[4]! + 0.2]); }
    } else if (this.ph === 'pullback') {
      const a = this.cues[0]?.at ?? S;
      this.alts = [[S - 0.5, 3.1], [a, 3.15], [a + 2.5, 5.2], [E + 0.3, 7.1]];
    } else this.alts = [[S - 1, 6.98], [E + 1, 6.9]];
    this.pass = new FSPass(WORLD_F, {
      uH: { value: 1 }, uPitch: { value: 0 }, uYaw: { value: 0 }, uFov: { value: 0.9 }, uTime: { value: 0 }, uSun: { value: -2 }, uLights: { value: 1 }, uFlood: { value: 0 },
      uGold: { value: new THREE.Vector3(...hexToLinear(this.c.accent)) }, uIce: { value: new THREE.Vector3(...hexToLinear(this.c.ice)) },
      uDeep: { value: new THREE.Vector3(...hexToLinear('#2E6BFF')) }, uSunC: { value: new THREE.Vector3(...hexToLinear('#FFD6A6')) }, uCamXY: { value: new THREE.Vector2() },
      uGeo: { value: geoFrame(...HOME) }, uLandMap: { value: earthMaps().land }, uLightMap: { value: earthMaps().lights },
    });
  }

  /** Where the sun (at angle uSun) lands on screen for the camera's pitch, yaw and fov (as the shader builds its rays). */
  private sunUv(sun: number, pitch: number, yaw: number, fov: number): [number, number] {
    const s = new THREE.Vector3(0, Math.cos(sun), Math.sin(sun));
    const fw = new THREE.Vector3(0, Math.sin(pitch), -Math.cos(pitch)), rt = new THREE.Vector3(1, 0, 0), up = new THREE.Vector3().crossVectors(rt, fw);
    const c = Math.cos(yaw), sn = Math.sin(yaw), rot = (v: THREE.Vector3) => v.set(c * v.x - sn * v.y, sn * v.x + c * v.y, v.z);
    rot(fw); rot(rt); rot(up);
    const z = s.dot(fw), tf = Math.tan(fov / 2);
    if (z <= 0) return [0.5, 1.2];
    return [0.5 + (s.dot(rt) / z) / (2 * tf) / (W / H), 0.5 + (s.dot(up) / z) / (2 * tf)];
  }

  private logH(t: number) {
    const ks = this.alts;
    if (t <= ks[0]![0]) return ks[0]![1];
    for (let i = 1; i < ks.length; i++) {
      const [t1, v1] = ks[i]!, [t0, v0] = ks[i - 1]!;
      if (t <= t1) {
        const u = clamp((t - t0) / Math.max(1e-3, t1 - t0));
        // kicks (a short span) ease out hard; drifts are linear in log altitude
        return lerp(v0, v1, t1 - t0 < 1.0 ? ease.outCubic(u) : this.ph === 'gauge' ? u : ease.inOutCubic(u));
      }
    }
    return ks.at(-1)![1];
  }

  override draw() {}

  override render(f: Frame, out: THREE.WebGLRenderTarget) {
    const t = f.t, r = this.ctx.renderer, ph = this.ph, S = this.S, E = this.E;
    const lh = this.logH(t), h = Math.pow(10, lh);
    const u = this.pass.u;
    u.uH!.value = h;
    // looking straight down near the ground, tilting toward the horizon as the camera climbs, then back to the disc
    const tilt = ph === 'dawn' ? 0.62 : smoothstep01(lh, 0.5, 3.5) * 0.55 * (1 - smoothstep01(lh, 5.6, 6.9)) + smoothstep01(lh, 6.0, 6.9) * (ph === 'pullback' ? 0.25 : 0.45);
    u.uPitch!.value = tilt;
    u.uYaw!.value = ph === 'dawn' ? 0 : 0.12 * (t - S) + (ph === 'pullback' ? 0.8 : 0);
    u.uFov!.value = 2 * Math.atan(Math.tan((ph === 'dawn' ? 0.75 : 0.85) / 2) * this.st.fit);
    u.uTime!.value = t;
    // the camera drifts across the ground a little at low altitude
    (u.uCamXY!.value as THREE.Vector2).set(0.04 * h * Math.sin((t - S) * 0.3), -0.25 * h * tilt);
    if (ph === 'dawn') {
      const a = this.cues[0]?.at ?? S + 2.8;
      // the sun climbs from behind the limb (its angle from the camera's nadir; the limb is at asin(RE / (RE + h)));
      // it clears the limb on the anchor and floods the frame
      const limb = Math.asin(RE / (RE + h));
      const th = t < a ? lerp(limb - 0.12, limb + 0.005, ease.inQuad(prog(t, S, a))) : lerp(limb + 0.005, limb + 0.2, ease.outQuad(prog(t, a, E + 1.5)));
      u.uSun!.value = th - Math.PI / 2;
      u.uLights!.value = 1 - 0.8 * prog(t, a - 0.5, E);
      u.uFlood!.value = ease.inQuad(prog(t, E - 0.55, E - 0.05));
    } else { u.uSun!.value = -2; u.uLights!.value = 1 + 0.4 * f.a.kick; u.uFlood!.value = 0; }
    this.pass.render(r, this.st.rt);
    const sunUv = ph === 'dawn' ? this.sunUv(u.uSun!.value as number, u.uPitch!.value as number, u.uYaw!.value as number, u.uFov!.value as number) : [0.5, 0.5] as [number, number];
    this.st.finish(r, out, {
      focus: 1000, ap: 0,
      rays: ph === 'dawn'
        ? { uv: sunUv, amt: 0.7 + 1.5 * hit(t, this.cues[0]?.at ?? S, 0.5), thr: 1.0, len: 0.7, decay: 0.97, rad: 0.12, tint: lin('#FFD7A8', 1) }
        : { uv: [0.5, 0.5], amt: 0.25, thr: 1.2, len: 0.35, decay: 0.97, rad: 0.8, tint: lin(this.c.accent, 1) },
      lens: ph === 'gauge' ? 0.05 : 0, lensCol: lin(this.c.ice, 0.4),
    });

    // the gauge readout (gauge) and the wall tag (pullback)
    this.over.clear();
    const o = this.over.ctx, mono = this.font('mono'), disp = this.font('display'), serif = this.font('serif');
    if (ph === 'gauge') {
      const i = this.cueIndex(t), cue = this.cues[i];
      const v1 = cue ? this.cp(cue).value : 0, v0 = i > 0 ? this.cp(this.cues[i - 1]!).value : 0;
      const roll = cue ? ease.outQuart(prog(t, cue.at, cue.at + 0.9)) : 0;
      const v = lerp(v0, v1, roll);
      const lab = cue ? this.cp(cue).label : '';
      const x = 120, y = 205, k = this.lookAt(t);
      const a0 = prog(t, S, S + 0.35, ease.outCubic);
      o.globalAlpha = a0;
      label(o, this.P.title, x, y, mono, k.a('type', 0.75), 22);
      const num = v.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
      o.font = font(disp, 128); o.fillStyle = k.accent; o.textAlign = 'left'; o.textBaseline = 'alphabetic';
      o.fillText(num, x - 6, y + 128);
      const nw = measure(num, disp, 128);
      o.font = font(disp, 54); o.fillText(this.P.unit.trim(), x + nw + 14, y + 128);
      o.font = font(serif, 44); o.fillStyle = k.type;
      o.globalAlpha = a0 * prog(t, cue?.at ?? S, (cue?.at ?? S) + 0.3);
      o.fillText(lab, x, y + 190);
      o.globalAlpha = a0;
      // the altitude, powers-of-ten style
      const alt = h < 1000 ? `${h < 10 ? h.toFixed(1) : Math.round(h)} m` : `${(h / 1000).toLocaleString('en-US', { maximumFractionDigits: h < 1e4 ? 1 : 0 })} km`;
      label(o, `altitude ${alt}`, W - 120, H - 165, mono, k.a('type', 0.7), 24, 'right');
      o.globalAlpha = 1;
    } else if (ph === 'pullback') {
      const cue = this.cues[0], tag = cue ? this.cp(cue).wallTag : '';
      const a0 = prog(t, (cue?.at ?? S) + 2.2, (cue?.at ?? S) + 2.8, ease.outCubic);
      if (tag && a0 > 0) {
        const k = this.lookAt(t);
        o.globalAlpha = a0;
        label(o, 'archive · total', 120, 200, mono, k.a('type', 0.7), 22);
        o.font = font(disp, 96); o.fillStyle = k.accent; o.textAlign = 'left'; o.fillText(tag, 114, 300);
        o.globalAlpha = 1;
      }
    }
    this.ctx.comp.draw(r, this.over.upload(), out, { mode: 'normal' });

    const dawn = ph === 'dawn';
    const a = this.cues[0]?.at ?? S;
    return {
      exposure: dawn ? 1 + 9 * ease.inCubic(prog(t, a + 1.6, E)) : 1,
      bloom: dawn ? 0.5 : 0.75, bloomThreshold: dawn ? 1.2 : 0.8, bloomRadius: dawn ? 0.45 : 0.75, halation: dawn ? 0 : 0.12, ca: 0.22, grain: 0.016, vignette: 0.45, hud: 0,
      gain: (dawn ? [1.08, 1.0, 0.9] : [1.04, 1.0, 0.95]) as [number, number, number], lift: [0.003, 0.003, 0.008] as [number, number, number], sat: 1.12,
    };
  }
}

function smoothstep01(x: number, a: number, b: number) { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); }
