// Harvest Now, Decrypt Later (Banger Remix): the clock. "I've got the time": a brass clock sealed in a block of
// clear ice, gold light behind it. Phases (entry `phase`):
// - `freeze` (choruses 1 and 2): the second hand drags slower as frost thickens on the ice and stops dead on the
//   cue's anchor, with a small shiver.
// - `thaw` (final chorus, "I had the time"): cracks run through the ice and it falls away in shards; the hands run
//   again, the minute hand sweeping as if to make up the years.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import { LineBatch } from '../engine/lines';
import { F, font } from '../engine/type';
import { clamp, ease, hexToLinear, mulberry32, prog } from '../engine/util';
import { LibScene, hit } from './_lib';
import { Stage, backdrop, camKeys, colors, depthAlpha, dust, envProbe, fitOf, lin } from './harvest-remix-kit';

export const schema: SceneSchema = {
  description: 'A brass clock sealed in a block of clear ice in gold light. freeze: the second hand slows as frost thickens and stops on the anchor; thaw: the ice cracks and falls away in shards and the hands run again. Harvest remix.',
  kinds: ['song'],
  lyrics: 'layer',
  entry: {
    phase: { type: 'string', enum: ['freeze', 'thaw'], default: 'freeze', description: 'freeze: time stops in the ice; thaw: the ice breaks and time runs' },
  },
  cue: {},
  example: { entry: { phase: 'freeze' }, cues: [{}] },
};

type Phase = 'freeze' | 'thaw';
interface P { phase: Phase }

const CR = 0.62; // the clock face radius

function faceTexture() {
  const N = 1024, cv = document.createElement('canvas'); cv.width = N; cv.height = N;
  const c = cv.getContext('2d')!;
  const g = c.createRadialGradient(N / 2, N / 2, 0, N / 2, N / 2, N / 2);
  g.addColorStop(0, '#F6EEDC'); g.addColorStop(0.9, '#E6D8BC'); g.addColorStop(1, '#BFA87C');
  c.fillStyle = g; c.fillRect(0, 0, N, N);
  c.translate(N / 2, N / 2);
  c.strokeStyle = '#1E1A14'; c.fillStyle = '#1E1A14';
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2, big = i % 5 === 0;
    c.lineWidth = big ? 9 : 3;
    c.beginPath(); c.moveTo(Math.sin(a) * N * 0.44, -Math.cos(a) * N * 0.44); c.lineTo(Math.sin(a) * N * (big ? 0.38 : 0.415), -Math.cos(a) * N * (big ? 0.38 : 0.415)); c.stroke();
  }
  const R = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  c.font = font(F.serif(600), 72); c.textAlign = 'center'; c.textBaseline = 'middle';
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; c.fillText(R[i]!, Math.sin(a) * N * 0.31, -Math.cos(a) * N * 0.31); }
  c.font = font(F.mono(500), 26); c.fillText('COLD STORAGE · 2021', 0, N * 0.16);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

interface Shard { m: THREE.Mesh; v: THREE.Vector3; w: THREE.Vector3; p0: THREE.Vector3 }

export default class HarvestRemixClock extends LibScene<P> {
  static schema = schema;
  private st = new Stage(30, 0.03, 100);
  private hands: THREE.Mesh[] = [];
  private shards: Shard[] = [];
  private iceMat!: THREE.MeshPhysicalMaterial;
  private block!: THREE.Mesh;
  private cracks = new LineBatch(800, { screen2D: false, worldWidth: true, blend: 'add', depthTest: false });
  private crackSegs: { a: THREE.Vector3; b: THREE.Vector3; s: number }[] = [];
  private back!: ReturnType<typeof backdrop>;
  private motes!: ReturnType<typeof dust>;
  private S = 0; private E = 0; private aAt = 0;
  private c = colors(this.ctx.style, 'amber');
  private get ph() { return this.P.phase; }

  override setup() {
    this.st.fit = fitOf(this.ctx.style);
    this.S = this.ctx.start; this.E = this.ctx.end;
    this.aAt = this.cues[0]?.at ?? this.S + 1.5;
    this.c = colors(this.ctx.style, this.cues[0]?.def.palette ?? 'amber');
    const r = this.ctx.renderer, sc = this.st.scene, c = this.c;
    sc.environment = envProbe(r, lin(c.bg, 0.6), [
      { w: 4, h: 4, p: [0, 2, -6], at: [0, 0, 0], c: lin(c.gold, 5) },
      { w: 12, h: 2, p: [0, 8, 2], at: [0, 0, 0], c: lin('#FFE6C0', 1.2) },
      { w: 5, h: 5, p: [-6, 0, 4], at: [0, 0, 0], c: lin(c.ice, 0.7) },
    ]);
    this.back = backdrop();
    (this.back.u.uTop!.value as THREE.Color).copy(lin(c.bg, 1.4));
    (this.back.u.uBot!.value as THREE.Color).copy(lin(c.bg, 0.5));
    (this.back.u.uGlowC!.value as THREE.Color).copy(lin(c.accent, 0.6));
    this.back.u.uGlow!.value = 1; this.back.u.uGlowR!.value = 0.35;
    sc.add(this.back.mesh);
    // the clock: a brass case, the face, three hands, a glass bezel
    const brass = new THREE.MeshPhysicalMaterial({ color: lin('#D9AE5C'), metalness: 1, roughness: 0.25, envMapIntensity: 1.3 });
    depthAlpha(brass, {}, 'hr-clk-brass');
    const caseG = new THREE.LatheGeometry([[0.001, -0.12], [CR + 0.1, -0.12], [CR + 0.13, -0.06], [CR + 0.13, 0.04], [CR + 0.08, 0.07], [CR, 0.05], [0.001, 0.05]].map(([x, y]) => new THREE.Vector2(x, y)), 128);
    const cs = new THREE.Mesh(caseG, brass); cs.rotation.x = Math.PI / 2; sc.add(cs);
    const faceM = new THREE.MeshStandardMaterial({ map: faceTexture(), roughness: 0.6, envMapIntensity: 0.6 });
    depthAlpha(faceM, {}, 'hr-clk-face');
    const face = new THREE.Mesh(new THREE.CircleGeometry(CR, 96), faceM); face.position.z = 0.055; sc.add(face);
    const handM = new THREE.MeshPhysicalMaterial({ color: lin('#1B1712'), metalness: 0.6, roughness: 0.35 });
    depthAlpha(handM, {}, 'hr-clk-hand');
    for (const [len, w, z] of [[0.33, 0.035, 0.07], [0.5, 0.022, 0.08], [0.55, 0.008, 0.09]] as [number, number, number][]) {
      const g = new THREE.BoxGeometry(w, len, 0.008); g.translate(0, len / 2 - 0.06, 0);
      const h = new THREE.Mesh(g, z > 0.085 ? brass : handM); h.position.z = z; sc.add(h); this.hands.push(h);
    }
    sc.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 20).rotateX(Math.PI / 2).translate(0, 0, 0.09), brass));
    // the ice: a clear block round it, in shards for the thaw
    this.iceMat = new THREE.MeshPhysicalMaterial({
      color: lin('#F4FBFF'), roughness: 0.08, transmission: 1, thickness: 0.8, ior: 1.31, attenuationColor: lin('#BFE4F5'), attenuationDistance: 2.5,
      clearcoat: 1, clearcoatRoughness: 0.15, envMapIntensity: 1.4,
    });
    depthAlpha(this.iceMat, { uRimCol: { value: lin(c.ice) }, uRim: { value: 0.2 } }, 'hr-clk-ice');
    if (this.ph === 'freeze') {
      this.block = new THREE.Mesh(new RoundedBoxGeometry(1.8, 1.8, 0.7, 5, 0.08), this.iceMat);
      sc.add(this.block);
    } else {
      const rnd = mulberry32(7);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
        const m = new THREE.Mesh(new RoundedBoxGeometry(0.6, 0.6, 0.7, 3, 0.04), this.iceMat);
        const p0 = new THREE.Vector3(-0.6 + i * 0.6, -0.6 + j * 0.6, 0);
        m.position.copy(p0);
        sc.add(m);
        this.shards.push({ m, p0, v: new THREE.Vector3((i - 1) * 0.8 + (rnd() - 0.5) * 0.5, 0.4 + rnd() * 0.8, 0.8 + rnd() * 0.9), w: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(5) });
      }
      // cracks across the front of the ice, from the centre out
      for (let k = 0; k < 9; k++) {
        let a = (k / 9) * Math.PI * 2 + rnd() * 0.4, x = 0, y = 0, s = 0;
        for (let i = 0; i < 9; i++) {
          const L = 0.06 + rnd() * 0.08, nx = x + Math.cos(a) * L, ny = y + Math.sin(a) * L;
          this.crackSegs.push({ a: new THREE.Vector3(x, y, 0.36), b: new THREE.Vector3(nx, ny, 0.36), s });
          s += L; x = nx; y = ny; a += (rnd() - 0.5) * 0.7;
        }
      }
      const cm = this.cracks.mat; cm.blendSrcAlpha = THREE.ZeroFactor; cm.blendDstAlpha = THREE.OneFactor;
    }
    const key = new THREE.SpotLight(lin('#FFE0B0'), 40, 20, 0.5, 0.7, 1.3); key.position.set(-2.5, 4, 4); key.target.position.set(0, 0, 0); sc.add(key, key.target);
    const rim = new THREE.SpotLight(lin(c.gold), 60, 20, 0.6, 0.6, 1.3); rim.position.set(1.5, 2.5, -4); rim.target.position.set(0, 0, 0); sc.add(rim, rim.target);
    this.motes = dust(700, [5, 4, 4], 4);
    (this.motes.u.uCol!.value as THREE.Color).copy(lin('#FFE6C0', 1.1));
    this.motes.u.uSize!.value = 7;
    sc.add(this.motes.pts);
  }

  /** The hands' angles (radians, clockwise from twelve) at t. */
  private handsAt(t: number): [number, number, number] {
    const S = this.S, a = this.aAt;
    if (this.ph === 'freeze') {
      const T = Math.max(0.3, a - S), u = clamp((t - S) / T);
      const sec = 4.6 + (Math.PI * 2 / 60) * 8 * T / 3 * (1 - Math.pow(1 - u, 3));
      const shiver = t > a ? 0.02 * Math.exp(-(t - a) * 8) * Math.sin((t - a) * 50) : 0;
      return [1.1, 5.2, sec + shiver];
    }
    const run = Math.max(0, t - (S + 0.5));
    return [1.1 + run * 0.5, 5.2 + run * 6 * (1 + run), 4.6 + run * 6.3];
  }

  override draw() {}

  override render(f: Frame, out: THREE.WebGLRenderTarget) {
    const t = f.t, r = this.ctx.renderer, S = this.S, E = this.E, c = this.c, freeze = this.ph === 'freeze';
    const cm = camKeys(t, [
      { t: S, c: [0.9, 0.35, 3.0], g: [0, 0, 0], fov: 32, ap: 22 },
      { t: E + 0.3, c: [0.45, 0.25, 2.55], g: [0, 0, 0], fov: 32, ap: 24, e: ease.linear },
    ]);
    const focus = this.st.look(cm.c, cm.g, cm.fov);
    const h = this.handsAt(t);
    this.hands.forEach((m, i) => { m.rotation.z = -h[i]!; });
    if (freeze) {
      const fr = 0.15 + 0.35 * prog(t, S, this.aAt) + 0.15 * hit(t, this.aAt, 0.4);
      this.iceMat.roughness = 0.08 + fr * 0.35;
    } else {
      const go = S + 0.55;
      for (const sd of this.shards) {
        const u = Math.max(0, t - go);
        sd.m.position.set(sd.p0.x + sd.v.x * u, sd.p0.y + sd.v.y * u - 4.9 * u * u, sd.p0.z + sd.v.z * u);
        sd.m.rotation.set(sd.w.x * u, sd.w.y * u, sd.w.z * u);
        sd.m.visible = u < 2;
      }
    }
    this.motes.u.uTime!.value = t;
    this.back.u.uTime!.value = t;
    this.st.time = t;
    this.st.beams = [{ p: [1.5, 3, -3.5], d: [-1.5, -3, 3.5], angle: 0.3, color: lin(c.gold, 1.4), range: 7 }];
    this.st.fog = { density: 0.18, noise: 0.6, haze: 0.004, hazeColor: lin(c.accent, 0.6), maxDist: 15 };
    this.st.begin(r, [0, 0, 0]);
    if (!freeze) {
      const run = (t - S - 0.1) * 3.5;
      if (run > 0 && t < S + 0.65) {
        this.cracks.clear();
        const g = hexToLinear(c.gold);
        for (const q of this.crackSegs) if (q.s < run) this.cracks.seg(q.a.x, q.a.y, q.a.z, q.b.x, q.b.y, q.b.z, 0.006, g[0] * 3, g[1] * 3, g[2] * 3, 1);
        this.cracks.render(r, this.st.rt, this.st.cam);
      }
    }
    this.st.finish(r, out, { focus, ap: cm.ap });
    return {
      bloom: 0.7, bloomThreshold: 0.85, bloomRadius: 0.65, halation: 0.1, ca: 0.15, grain: 0.016, vignette: 0.5, hud: 0,
      shake: (freeze ? [hit(t, this.aAt, 0.08) * 4, hit(t, this.aAt, 0.08) * 5] : [hit(t, S + 0.55, 0.1) * 8, hit(t, S + 0.55, 0.1) * 10]) as [number, number],
      gain: [1.06, 1.0, 0.9] as [number, number, number], lift: [0.006, 0.003, 0] as [number, number, number], sat: 1.1,
      streak: 0.4, streakTint: [1.0, 0.8, 0.5] as [number, number, number],
    };
  }
}
