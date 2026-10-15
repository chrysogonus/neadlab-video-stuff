// Harvest Now, Decrypt Later (Banger Remix): the archive from outside. Night over a frozen plain; the facility, long
// low halls with rows of cold windows, cooling towers breathing vapour, red aviation lights blinking, sits in the
// ice under an aurora, and the polished ice mirrors the sky. Phases (entry `phase`):
// - `title` (intro): a slow aerial push toward the facility; the title and credit fade up, cinema-style.
// - `exterior` (bridge, the answer to "Who'd even store it?"): gliding low over its roofs and vents.
// - `end` (outro): wide and still, the title and credit again.
// The sky and the ice are one fullscreen shader (aurora, stars, the ice's reflection, haze to the horizon, depth in
// alpha); the facility is three.js meshes over it; vapour and the air's light through the stage's volume pass.
import * as THREE from 'three';
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import { Layer2D } from '../engine/gl';
import { GLSL_COMMON } from '../engine/glsl/common';
import { F, font, measure } from '../engine/type';
import { ease, mulberry32, prog } from '../engine/util';
import { LibScene, W, H } from './_lib';
import { Stage, camKeys, colors, depthAlpha, dust, envProbe, fitOf, lin, type V3 } from './harvest-remix-kit';

export const schema: SceneSchema = {
  description: 'The archive from outside: a facility of long cold-lit halls and steaming towers on a frozen plain at night under an aurora, the ice mirroring the sky. title: an aerial push in with the title and credit; exterior: gliding low over the roofs; end: wide and still with the title and credit. Harvest remix.',
  kinds: ['song'],
  lyrics: 'layer',
  entry: {
    phase: { type: 'string', enum: ['title', 'exterior', 'end'], default: 'title', description: 'which shot of the facility' },
  },
  cue: {
    title: { type: 'string', default: '', description: 'the title set over the shot' },
    credit: { type: 'string', default: '', description: 'the credit under the title' },
  },
  example: { entry: { phase: 'title' }, cues: [{ title: 'HARVEST NOW, DECRYPT LATER', credit: 'NEAD' }] },
};

type Phase = 'title' | 'exterior' | 'end';
interface P { phase: Phase }
interface C { title: string; credit: string }

const SKY_V = /* glsl */ `
precision highp float;
in vec3 position;
out vec2 vUv;
void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 1.0, 1.0); }`;
const SKY_F = /* glsl */ `
precision highp float;
precision highp int;
in vec2 vUv;
out vec4 fragColor;
${GLSL_COMMON}
uniform mat4 uInvVP;
uniform vec3 uCamP;
uniform float uTime;
uniform vec3 uAur1, uAur2, uIce, uDeep;

vec3 aurora(vec3 rd) {
  if (rd.y <= 0.0) return vec3(0.0);
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 7; i++) {
    float h = 3500.0 + float(i) * 260.0;
    vec2 p = rd.xz / rd.y * h * 0.00028;
    float n = fbm(vec2(p.x * 0.6 + uTime * 0.03, float(i) * 0.37), 3);
    float curve = -p.y - 5.0 - 1.4 * sin(p.x * 0.35 + n * 2.4 + uTime * 0.05);
    float band = exp(-curve * curve / 0.9) * (0.55 + 0.45 * fbm(vec2(p.x * 7.0 - uTime * 0.25, float(i)), 2));
    float rays = 0.8 + 0.2 * sin(p.x * 18.0 + n * 6.0);
    vec3 c = mix(uAur1, uAur2, float(i) / 6.0);
    acc += c * band * rays * (1.0 - float(i) / 8.0);
  }
  return acc * 0.32 * smoothstep(0.0, 0.05, rd.y);
}
vec3 sky(vec3 rd) {
  vec3 c = mix(uDeep * 0.022, uDeep * 0.004, smoothstep(0.0, 0.4, rd.y));
  c += uDeep * 0.02 * exp(-max(rd.y, 0.0) * 18.0); // a band of glow on the horizon
  vec3 q = rd * 420.0, id = floor(q);
  float st = step(0.996, hash13(id)) * (1.0 - smoothstep(0.0, 0.3, length(fract(q) - 0.5)));
  c += vec3(0.75, 0.82, 1.0) * st * 0.9 * smoothstep(0.02, 0.2, rd.y);
  c += aurora(rd);
  // the mountains on the horizon: a far ridge, snow on its faces catching the aurora, a nearer, darker one
  float az = atan(rd.x, rd.z);
  float r1 = 0.012 + 0.03 * (fbm(vec2(az * 2.2, 1.3), 5) * 0.5 + 0.5) * (0.6 + 0.4 * sin(az * 1.3 + 2.0));
  float r2 = 0.004 + 0.016 * (fbm(vec2(az * 4.5, 7.1), 4) * 0.5 + 0.5);
  if (rd.y < r1) {
    float face = fbm(vec2(az * 40.0, rd.y * 300.0), 4) * 0.5 + 0.5;
    vec3 m = uDeep * 0.012 + (uAur1 * 0.02 + uIce * 0.03) * smoothstep(0.45, 0.8, face) * smoothstep(r1 - 0.02, r1, rd.y);
    c = m;
    c += uDeep * 0.02 * exp(-(r1 - rd.y) * 60.0);
  }
  if (rd.y < r2) c = uDeep * 0.006 + uIce * 0.004 * (fbm(vec2(az * 60.0, rd.y * 400.0), 3) * 0.5 + 0.5);
  return c;
}
void main() {
  vec4 w = uInvVP * vec4(vUv * 2.0 - 1.0, 1.0, 1.0);
  vec3 rd = normalize(w.xyz / w.w - uCamP);
  vec3 col; float depth;
  if (rd.y < -0.0005) {
    float d = uCamP.y / -rd.y;
    vec3 p = uCamP + rd * d;
    // the ice: a polished plain with long pressure ridges and sastrugi, mirroring the sky
    vec2 g = p.xz * 0.02;
    float near = smoothstep(700.0, 80.0, d);
    float e = 0.04;
    float h0 = fbm(g, 4), hx = fbm(g + vec2(e, 0.0), 4), hz = fbm(g + vec2(0.0, e), 4);
    float ridge = 0.5 + 0.5 * sin(p.x * 0.004 + p.z * 0.011 + fbm(p.xz * 0.002, 3) * 4.0);
    float snow = smoothstep(-0.1, 0.25, fbm(p.xz * 0.003 + 3.0, 4));
    vec3 n = normalize(vec3(-(hx - h0) / e * 0.006 * near * (0.5 + ridge), 1.0, -(hz - h0) / e * 0.006 * near * (0.5 + ridge)));
    vec3 rr = reflect(rd, n);
    float fres = 0.04 + 0.96 * pow(1.0 - max(dot(-rd, n), 0.0), 5.0);
    // snow: matte, lit by the aurora and the moon, wind-carved into drifts; ice: dark and glassy, mirroring the sky
    float drift = 0.85 + 0.3 * (fbm(vec2(p.x * 0.03 + p.z * 0.01, p.z * 0.08), 3) * 0.5 + 0.5);
    vec3 snowC = (uIce * 0.035 + uAur1 * 0.008 + vec3(0.02, 0.025, 0.04)) * drift;
    col = mix(uIce * 0.004 + sky(rr) * fres, snowC + sky(rr) * fres * 0.12, snow);
    // the ploughed roads: dark packed ice along the light poles and to the halls, tyre ruts down them
    float road = max((1.0 - smoothstep(5.0, 6.5, abs(p.z - 120.0))) * step(-230.0, p.x) * step(p.x, 250.0),
                     (1.0 - smoothstep(4.0, 5.5, abs(p.x + 110.0))) * step(-40.0, p.z) * step(p.z, 120.0));
    float rut = 1.0 - 0.35 * (1.0 - smoothstep(0.3, 0.9, abs(abs(fract(p.z * 0.1 + p.x * 0.1) - 0.5) - 0.2) * 10.0));
    col = mix(col, (uIce * 0.006 + sky(rr) * fres * 0.6) * rut, road);
    // glints of frost crystals
    float gl = step(0.9985, hash12(floor(p.xz * 3.0)));
    col += vec3(0.8, 0.9, 1.0) * gl * 0.5 * snow * smoothstep(300.0, 30.0, d);
    float fog = 1.0 - exp(-d * 0.00045);
    col = mix(col, uDeep * 0.018 + aurora(vec3(rd.x, 0.15, rd.z)) * 0.12, fog);
    depth = d * dot(rd, normalize(-vec3(uInvVP[2]))) ;
    depth = d;
  } else { col = sky(rd); depth = 1e5; }
  fragColor = vec4(col, depth);
}`;

export default class HarvestRemixAerial extends LibScene<P, C> {
  static schema = schema;
  private st = new Stage(30, 1, 40000);
  private skyMat!: THREE.RawShaderMaterial;
  private reds: THREE.MeshBasicMaterial[] = [];
  private plumes: THREE.Mesh[] = [];
  private over = new Layer2D();
  private motes!: ReturnType<typeof dust>;
  private S = 0; private E = 0;
  private title = ''; private credit = '';
  private c = colors(this.ctx.style, 'frost');
  private get ph() { return this.P.phase; }

  override setup() {
    this.st.fit = fitOf(this.ctx.style);
    this.S = this.ctx.start; this.E = this.ctx.end;
    const cue = this.cues[0];
    if (cue) { const p = this.cp(cue); this.title = p.title; this.credit = p.credit; }
    this.c = colors(this.ctx.style, 'frost');
    const r = this.ctx.renderer, sc = this.st.scene, c = this.c;
    sc.environment = envProbe(r, lin('#02040A'), [
      { w: 400, h: 60, p: [0, 300, -600], at: [0, 0, 0], c: lin('#3CFFB0', 0.5) },
      { w: 400, h: 200, p: [0, 600, 0], at: [0, 0, 0], c: lin('#1A3A80', 0.3) },
    ]);
    // sky and ice
    const tri = new THREE.BufferGeometry();
    tri.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    this.skyMat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: SKY_V, fragmentShader: SKY_F, depthTest: false, depthWrite: false,
      uniforms: {
        uInvVP: { value: new THREE.Matrix4() }, uCamP: { value: new THREE.Vector3() }, uTime: { value: 0 },
        uAur1: { value: lin('#2CFFA8') }, uAur2: { value: lin('#7A4CFF') }, uIce: { value: lin(c.ice) }, uDeep: { value: lin(c.deep) },
      },
    });
    const sky = new THREE.Mesh(tri, this.skyMat);
    sky.frustumCulled = false; sky.renderOrder = -100;
    sc.add(sky);

    this.facility(sc);
    const moon = new THREE.DirectionalLight(lin('#9FBFFF'), 1.5); moon.position.set(-300, 400, -500); sc.add(moon);
    sc.add(new THREE.HemisphereLight(lin('#1A3060'), lin('#05080F'), 0.4));
    this.motes = dust(1500, [600, 120, 600], 31);
    (this.motes.u.uCol!.value as THREE.Color).copy(lin('#DDEBFF', 0.8));
    this.motes.u.uSize!.value = 60;
    this.motes.pts.position.set(0, 60, 0);
    sc.add(this.motes.pts);
  }

  /**
   * The facility: long halls clad in ribbed steel with strips of cold windows and loading docks, snow on the roofs and
   * rows of chillers on them, hyperbolic cooling towers breathing vapour, a lattice radio mast and dishes, fuel tanks,
   * light poles along the roads, a fence round it all; red aviation lights blinking on everything tall.
   */
  private facility(sc: THREE.Scene) {
    const c = this.c, rnd = mulberry32(17);
    const tex = (w: number, h: number, f: (x: CanvasRenderingContext2D) => void, rx = 1, ry = 1) => {
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h; f(cv.getContext('2d')!);
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; return t;
    };
    const ribs = tex(256, 256, (x) => {
      x.fillStyle = '#2A3444'; x.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 16; i++) { const g = x.createLinearGradient(i * 16, 0, i * 16 + 16, 0); g.addColorStop(0, '#1A2230'); g.addColorStop(0.5, '#3A4658'); g.addColorStop(1, '#1A2230'); x.fillStyle = g; x.fillRect(i * 16, 0, 16, 256); }
      x.fillStyle = 'rgba(255,255,255,0.05)'; x.fillRect(0, 120, 256, 3);
    });
    const snowT = tex(512, 512, (x) => {
      x.fillStyle = '#B9CCE0'; x.fillRect(0, 0, 512, 512);
      const r = mulberry32(5);
      for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '120,140,170'},${0.05 + r() * 0.08})`; x.beginPath(); x.ellipse(r() * 512, r() * 512, 10 + r() * 60, 3 + r() * 10, 0.3, 0, Math.PI * 2); x.fill(); }
    });
    const fan = tex(256, 256, (x) => {
      x.fillStyle = '#4A5668'; x.fillRect(0, 0, 256, 256);
      for (const cx of [64, 192]) { x.fillStyle = '#10161F'; x.beginPath(); x.arc(cx, 128, 54, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#8894A6'; x.lineWidth = 3; for (let rr = 14; rr < 56; rr += 9) { x.beginPath(); x.arc(cx, 128, rr, 0, Math.PI * 2); x.stroke(); } x.beginPath(); x.moveTo(cx - 54, 128); x.lineTo(cx + 54, 128); x.moveTo(cx, 74); x.lineTo(cx, 182); x.stroke(); }
    });
    const winT = tex(512, 64, (x) => {
      x.fillStyle = '#0B1220'; x.fillRect(0, 0, 512, 64);
      for (let i = 0; i < 16; i++) { const on = (i * 7) % 5 !== 0; x.fillStyle = on ? '#CFF4FF' : '#24384E'; x.fillRect(i * 32 + 3, 6, 26, 52); x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(i * 32 + 3, 30, 26, 3); }
    });
    const wall = new THREE.MeshStandardMaterial({ map: ribs, bumpMap: ribs, bumpScale: 2, roughness: 0.55, metalness: 0.5, envMapIntensity: 0.7 });
    const roof = new THREE.MeshStandardMaterial({ map: snowT, roughness: 0.75, envMapIntensity: 0.9 });
    const unit = new THREE.MeshStandardMaterial({ color: lin('#3A4658'), roughness: 0.5, metalness: 0.6 });
    const fanM = new THREE.MeshStandardMaterial({ map: fan, roughness: 0.5, metalness: 0.5 });
    const steel = new THREE.MeshStandardMaterial({ color: lin('#8A96A8'), roughness: 0.35, metalness: 0.9 });
    const win = new THREE.MeshBasicMaterial({ map: winT, color: lin(c.ice, 2.6) });
    const dock = new THREE.MeshBasicMaterial({ color: lin('#FFD49A', 3) });
    for (const [m, k, l] of [[wall, 'wall', true], [roof, 'roof', true], [unit, 'unit', true], [fanM, 'fan', true], [steel, 'steel', true], [win, 'win', false], [dock, 'dock', false]] as [THREE.Material, string, boolean][]) depthAlpha(m, {}, `hr-aer-${k}`, l);
    const box = (sx: number, sy: number, sz: number, m: THREE.Material | THREE.Material[], x: number, y: number, z: number, ry = 0) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); b.position.set(x, y, z); b.rotation.y = ry; sc.add(b); return b;
    };
    const halls: [number, number, number, number, number][] = [[0, 0, 220, 14, 46], [10, 70, 180, 12, 38], [-30, -70, 160, 11, 34], [140, 10, 60, 18, 60]];
    for (const [x, z, lx, ly, lz] of halls) {
      // the cladding's ribs repeat every 4 m
      const wm = wall.clone(); wm.map = ribs.clone(); wm.map.repeat.set(lx / 4, 1); wm.map.needsUpdate = true; wm.bumpMap = wm.map;
      depthAlpha(wm, {}, 'hr-aer-wall');
      box(lx, ly, lz, wm, x, ly / 2, z);
      const rm = roof.clone(); rm.map = snowT.clone(); rm.map.repeat.set(lx / 40, lz / 40); rm.map.needsUpdate = true; depthAlpha(rm, {}, 'hr-aer-roof');
      box(lx + 1.2, 0.9, lz + 1.2, rm, x, ly + 0.45, z);
      // parapet edge, darker
      box(lx + 1.4, 0.3, lz + 1.4, unit, x, ly + 0.05, z);
      // window strips along both long sides, docks with warm light at the ends
      for (const side of [-1, 1]) {
        const wmat = win.clone(); wmat.map = winT.clone(); wmat.map.repeat.set((lx - 12) / 16, 1); wmat.map.needsUpdate = true;
        depthAlpha(wmat, {}, 'hr-aer-win', false);
        const wmesh = new THREE.Mesh(new THREE.PlaneGeometry(lx - 12, 1.4), wmat);
        wmesh.position.set(x, ly * 0.62, z + side * (lz / 2 + 0.05)); if (side < 0) wmesh.rotation.y = Math.PI; sc.add(wmesh);
        for (let k = 0; k < 3; k++) {
          const d = new THREE.Mesh(new THREE.PlaneGeometry(4, 4.5), dock);
          d.position.set(x - lx / 2 + 14 + k * 9, 2.3, z + side * (lz / 2 + 0.06)); if (side < 0) d.rotation.y = Math.PI; sc.add(d);
        }
      }
      // chillers in rows on the roof, ducts between them
      for (let k = 0; k < Math.floor((lx - 16) / 9); k++) for (const row of [-1, 1]) {
        if (rnd() < 0.12) continue;
        const ux = x - lx / 2 + 12 + k * 9, uz = z + row * lz * 0.22;
        box(6.5, 2.2, 4.2, [unit, unit, fanM, unit, unit, unit], ux, ly + 2.0, uz);
      }
      box(lx - 20, 1.1, 1.1, steel, x, ly + 1.5, z);
    }
    // the cooling towers: hyperbolic shells, a red light on each rim
    const prof: THREE.Vector2[] = [];
    for (let i = 0; i <= 24; i++) { const v = i / 24, y = v * 46; prof.push(new THREE.Vector2(9 + 4.5 * Math.pow((v - 0.72) / 0.72, 2) * (v < 0.72 ? 1 : 0.6), y)); }
    const shellT = tex(256, 256, (x) => { x.fillStyle = '#3A4452'; x.fillRect(0, 0, 256, 256); const r = mulberry32(2); for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(20,26,36,${0.1 + r() * 0.2})`; x.fillRect(r() * 256, 0, 2 + r() * 6, 256); } for (let y = 0; y < 256; y += 32) { x.fillStyle = 'rgba(255,255,255,0.05)'; x.fillRect(0, y, 256, 2); } }, 6, 1);
    const towerM = new THREE.MeshStandardMaterial({ map: shellT, roughness: 0.85, side: THREE.DoubleSide, envMapIntensity: 0.5 });
    depthAlpha(towerM, {}, 'hr-aer-tower');
    const towers: [number, number][] = [[-150, 20], [-150, -30], [210, 60]];
    for (const [x, z] of towers) {
      const t = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), towerM); t.position.set(x, 0, z); sc.add(t);
      this.redLight(sc, [x, 46.5, z]);
      this.st.beams.push({ p: [x, 46, z], d: [0, 1, 0], angle: 0.55, color: lin('#BFD8FF', 0.12), range: 70 });
      this.plume(sc, [x, 46, z]);
    }
    // the radio mast: a lattice of legs and bracing, red lights up it; two dishes by it
    const mx = 190, mz = -110, mh = 90;
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2, leg = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, mh, 6), steel);
      leg.position.set(mx + Math.cos(a) * 1.6, mh / 2, mz + Math.sin(a) * 1.6); sc.add(leg);
    }
    for (let y = 3; y < mh; y += 4) { const ring = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.08, 4, 3), steel); ring.rotation.x = Math.PI / 2; ring.position.set(mx, y, mz); sc.add(ring); }
    for (const y of [30, 60, mh]) this.redLight(sc, [mx, y + 0.5, mz]);
    const dishM = new THREE.MeshStandardMaterial({ color: lin('#C8D4E2'), roughness: 0.4, metalness: 0.2, side: THREE.DoubleSide });
    depthAlpha(dishM, {}, 'hr-aer-dish');
    for (const [dx, dz, s] of [[170, -80, 7], [205, -60, 5]] as [number, number, number][]) {
      const d = new THREE.Mesh(new THREE.SphereGeometry(s, 32, 12, 0, Math.PI * 2, 0, 0.55), dishM);
      d.position.set(dx, s * 1.3, dz); d.rotation.set(-1.0, 0.4, 0); sc.add(d);
      box(0.8, s * 1.1, 0.8, steel, dx, s * 0.55, dz);
    }
    // fuel tanks
    const tankM = new THREE.MeshStandardMaterial({ color: lin('#9AA6B6'), roughness: 0.4, metalness: 0.7 });
    depthAlpha(tankM, {}, 'hr-aer-tank');
    for (let k = 0; k < 4; k++) { const tk = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 9, 32), tankM); tk.position.set(100 + k * 13, 4.5, -60); sc.add(tk); }
    // light poles along the roads: a warm pool under each
    const poleLamp = new THREE.MeshBasicMaterial({ color: lin('#FFE0B0', 5) });
    depthAlpha(poleLamp, {}, 'hr-aer-lamp', false);
    for (let k = 0; k < 14; k++) {
      const px = -180 + k * 30, pz = 115;
      box(0.35, 12, 0.35, steel, px, 6, pz);
      const l = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 0.6), poleLamp); l.position.set(px, 12, pz); sc.add(l);
      if (k % 3 === 0) { const pl = new THREE.PointLight(lin('#FFD8A0'), 600, 40, 2); pl.position.set(px, 11, pz); sc.add(pl); }
    }
    // the fence: posts round the site
    for (let k = 0; k < 120; k++) {
      const a = (k / 120) * Math.PI * 2, rx = 260, rz = 170;
      box(0.2, 3, 0.2, steel, 30 + Math.cos(a) * rx, 1.5, 10 + Math.sin(a) * rz);
    }
  }

  private redLight(sc: THREE.Scene, p: V3) {
    const red = new THREE.MeshBasicMaterial({ color: lin('#FF2A1A', 6) });
    depthAlpha(red, {}, 'hr-aer-red', false);
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 8), red); l.position.set(...p); sc.add(l);
    this.reds.push(red);
  }

  /** Vapour rising off a cooling tower: a camera-facing sheet of drifting noise, widening as it rises. */
  private plume(sc: THREE.Scene, p: V3) {
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
      uniforms: { uTime: { value: 0 }, uCol: { value: lin('#9FB8D8', 0.05) } },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `${GLSL_COMMON}
        varying vec2 vUv; uniform float uTime; uniform vec3 uCol;
        void main() {
          vec2 q = vUv; float w = 0.18 + 0.32 * q.y;
          float n = fbm(vec2(q.x * 3.0, q.y * 2.5 - uTime * 0.18), 5) * 0.5 + 0.5;
          float col = 1.0 - smoothstep(w * 0.6, w, abs(q.x - 0.5 + 0.08 * sin(q.y * 3.0 + uTime * 0.2)));
          float a = col * smoothstep(0.2, 0.75, n) * smoothstep(0.0, 0.08, q.y) * (1.0 - smoothstep(0.5, 1.0, q.y)) * 0.85;
          gl_FragColor = vec4(uCol * (0.6 + 0.8 * n) * a, a);
        }`,
    });
    const q = new THREE.Mesh(new THREE.PlaneGeometry(60, 90), m);
    q.position.set(p[0], p[1] + 44, p[2]);
    q.renderOrder = 40;
    sc.add(q);
    this.plumes.push(q);
  }

  private cam(t: number) {
    const S = this.S, E = this.E;
    if (this.ph === 'title') return camKeys(t, [
      { t: S, c: [-170, 30, 270], g: [60, 40, -500], fov: 34, ap: 0 },
      { t: E + 0.5, c: [-140, 26, 205], g: [60, 38, -500], fov: 34, ap: 0, e: ease.linear },
    ]);
    if (this.ph === 'exterior') return camKeys(t, [
      { t: S, c: [-150, 46, 120], g: [40, 6, -10], fov: 34, ap: 0 },
      { t: E + 0.3, c: [-90, 40, 95], g: [80, 6, -20], fov: 34, ap: 0, e: ease.linear },
    ]);
    return camKeys(t, [
      { t: S, c: [-260, 50, 560], g: [60, 60, -500], fov: 34, ap: 0 },
      { t: E + 0.5, c: [-245, 48, 530], g: [60, 60, -500], fov: 34, ap: 0, e: ease.linear },
    ]);
  }

  override draw() {}

  override render(f: Frame, out: THREE.WebGLRenderTarget) {
    const t = f.t, r = this.ctx.renderer, S = this.S, E = this.E;
    const cm = this.cam(t);
    this.st.look(cm.c as V3, cm.g as V3, cm.fov);
    const u = this.skyMat.uniforms;
    (u.uInvVP!.value as THREE.Matrix4).multiplyMatrices(this.st.cam.matrixWorld, this.st.cam.projectionMatrixInverse);
    (u.uCamP!.value as THREE.Vector3).copy(this.st.cam.position);
    u.uTime!.value = t;
    for (const [i, m] of this.reds.entries()) m.color.copy(lin('#FF2A1A', ((t * 0.8 + i * 0.33) % 1) < 0.18 ? 7 : 0.2));
    this.motes.u.uTime!.value = t;
    for (const q of this.plumes) {
      // face the camera about the vertical
      q.rotation.y = Math.atan2(this.st.cam.position.x - q.position.x, this.st.cam.position.z - q.position.z);
      (q.material as THREE.ShaderMaterial).uniforms.uTime!.value = t;
    }
    this.st.time = t;
    this.st.fog = { density: 0.0012, noise: 0.7, haze: 0.0, maxDist: 600, drift: [3, 0.5, 1] };
    this.st.render(r, out, { focus: 500, ap: 0, clear: [0, 0, 0] });

    // the title, cinema-style: wide letter-spaced caps, the credit under it
    this.over.clear();
    if ((this.ph === 'title' || this.ph === 'end') && this.title) {
      const o = this.over.ctx;
      const a = this.ph === 'title'
        ? ease.inOutQuad(prog(t, S + 0.6, S + 1.6)) * (1 - ease.inOutQuad(prog(t, E - 0.5, E)))
        : ease.inOutQuad(prog(t, S + 0.2, S + 1.2));
      const fam = F.archivo(125, 300), size = 46, track = size * 0.5;
      o.globalAlpha = a;
      o.font = font(fam, size); o.letterSpacing = `${track}px`; o.textAlign = 'center'; o.textBaseline = 'middle';
      o.fillStyle = '#EAF2FA';
      const tw = measure(this.title, fam, size, track);
      const ty = H / 2 - 150;
      o.fillText(this.title, W / 2 + track / 2, ty);
      o.fillStyle = 'rgba(234,242,250,0.35)';
      o.fillRect(W / 2 - tw * 0.18, ty + 44, tw * 0.36, 1.5);
      o.font = font(F.archivo(125, 500), 22); o.letterSpacing = '14px'; o.fillStyle = '#9FB4C8';
      o.fillText(this.credit, W / 2 + 7, ty + 82);
      o.letterSpacing = '0px'; o.globalAlpha = 1;
      this.ctx.comp.draw(r, this.over.upload(), out, { mode: 'normal' });
    }
    return {
      bloom: 0.6, bloomThreshold: 0.8, bloomRadius: 0.7, halation: 0.04, ca: 0.15, grain: 0.016, vignette: 0.5, hud: 0,
      gain: [0.9, 1.0, 1.1] as [number, number, number], lift: [0, 0.003, 0.01] as [number, number, number], sat: 1.12,
      fade: this.ph === 'end' ? ease.inQuad(prog(t, E - 0.6, E)) : this.ph === 'title' ? 1 - ease.outQuad(prog(t, S, S + 1.2)) : 0,
    };
  }
}
