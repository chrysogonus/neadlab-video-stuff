// Harvest Now, Decrypt Later (Banger Remix): the warehouse. Where "later" goes: the crate stamped LATER slides onto
// a shelf, and the camera pulls back and up, up out of its aisle, until it is one crate among thousands on endless
// rows of steel shelving under hanging lamps, light falling in cones through the dust.
import * as THREE from 'three';
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import { F, font } from '../engine/type';
import { ease, mulberry32, prog } from '../engine/util';
import { LibScene } from './_lib';
import { Stage, depthAlpha, dust, envProbe, fitOf, lin, type V3 } from './harvest-remix-kit';

export const schema: SceneSchema = {
  description: 'An endless dark warehouse of steel shelving stacked with identical crates stamped LATER under hanging lamps; the camera pulls back and up from one crate sliding onto a shelf until it is one among thousands. Harvest remix.',
  kinds: ['song'],
  lyrics: 'layer',
  entry: { stamp: { type: 'string', default: 'LATER', description: 'the word stamped on every crate' } },
  cue: {},
  example: { entry: {}, cues: [{}] },
};

interface P { stamp: string }

const ROWS = 9, BAYS = 26, LEVELS = 4; // shelf rows, bays per row, shelf levels
const BW = 2.4, LV = 1.3, RD = 1.2, PITCH = 4.2; // bay width, level height, rack depth, row pitch

function crateTexture(stamp: string) {
  const N = 1024, cv = document.createElement('canvas'); cv.width = N; cv.height = N;
  const c = cv.getContext('2d')!;
  c.fillStyle = '#A07E52'; c.fillRect(0, 0, N, N);
  const rnd = mulberry32(2);
  // planks: five boards with their own tone, grain, gaps between them
  for (let b = 0; b < 5; b++) {
    const y0 = b * N / 5;
    c.fillStyle = `rgba(${rnd() < 0.5 ? '70,48,24' : '210,180,130'},${0.06 + rnd() * 0.1})`; c.fillRect(0, y0, N, N / 5);
    for (let i = 0; i < 70; i++) {
      c.strokeStyle = `rgba(60,38,18,${0.05 + rnd() * 0.12})`; c.lineWidth = 1 + rnd() * 2;
      const y = y0 + rnd() * N / 5; c.beginPath();
      for (let x = 0; x <= N; x += 32) c.lineTo(x, y + Math.sin(x * 0.01 + i) * 3);
      c.stroke();
    }
    c.fillStyle = 'rgba(30,18,8,0.55)'; c.fillRect(0, y0, N, 5);
  }
  // corner battens and nails
  c.fillStyle = 'rgba(80,55,28,0.6)'; c.fillRect(0, 0, 70, N); c.fillRect(N - 70, 0, 70, N);
  c.fillStyle = 'rgba(255,230,190,0.12)'; c.fillRect(0, 0, 70, 6); c.fillRect(N - 70, 0, 70, 6);
  c.fillStyle = '#2A2420';
  for (let b = 0; b < 5; b++) for (const x of [35, N - 35]) for (const dy of [30, 150]) { c.beginPath(); c.arc(x, b * N / 5 + dy, 6, 0, Math.PI * 2); c.fill(); }
  // the stamp and a shipping label
  c.save(); c.translate(N / 2, N * 0.5); c.rotate(-0.07);
  c.strokeStyle = '#3A1810'; c.lineWidth = 14; c.globalAlpha = 0.82; c.strokeRect(-N * 0.32, -N * 0.11, N * 0.64, N * 0.22);
  c.fillStyle = '#3A1810'; c.font = font(F.archivo(62, 900), N * 0.16); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(stamp, 0, N * 0.01);
  c.restore();
  c.save(); c.translate(N * 0.62, N * 0.78); c.rotate(0.02);
  c.fillStyle = '#EDE6D6'; c.fillRect(0, 0, 260, 150);
  c.fillStyle = '#1A1A1A'; c.font = font(F.mono(500), 22); c.fillText('LOT 2021-03-09', 16, 36); c.fillText('KEEP COLD · DO NOT OPEN', 16, 68);
  for (let x = 16; x < 240; x += 4) if (rnd() < 0.6) c.fillRect(x, 88, 2 + Math.floor(rnd() * 2), 46);
  c.restore();
  // FRAGILE / THIS WAY UP on the side
  c.save(); c.translate(N * 0.16, N * 0.86); c.fillStyle = 'rgba(150,20,20,0.7)'; c.font = font(F.archivo(80, 900), 44); c.fillText('↑↑  THIS WAY UP', 0, 0); c.restore();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

export default class HarvestRemixWarehouse extends LibScene<P> {
  static schema = schema;
  private st = new Stage(32, 0.05, 600);
  private hero!: THREE.Mesh;
  private motes!: ReturnType<typeof dust>;
  private lamps: V3[] = [];
  private S = 0; private E = 0;

  override setup() {
    this.st.fit = fitOf(this.ctx.style);
    this.S = this.ctx.start; this.E = this.ctx.end;
    const r = this.ctx.renderer, sc = this.st.scene;
    const warm = lin('#FFD49A');
    sc.environment = envProbe(r, lin('#040506'), [{ w: 60, h: 4, p: [0, 14, 0], at: [0, 0, 0], c: warm.clone().multiplyScalar(0.8) }]);
    const box = new THREE.BoxGeometry(1, 1, 1);
    const crateM = new THREE.MeshStandardMaterial({ map: crateTexture(this.P.stamp), roughness: 0.85, envMapIntensity: 0.4 });
    depthAlpha(crateM, {}, 'hr-wh-crate');
    const steel = new THREE.MeshStandardMaterial({ color: lin('#24466E'), metalness: 0.5, roughness: 0.4, envMapIntensity: 0.6 });
    depthAlpha(steel, {}, 'hr-wh-steel');
    const beamM = new THREE.MeshStandardMaterial({ color: lin('#D0661E'), metalness: 0.3, roughness: 0.4, envMapIntensity: 0.6 });
    depthAlpha(beamM, {}, 'hr-wh-beam');
    const palletM = new THREE.MeshStandardMaterial({ color: lin('#9A7A50'), roughness: 0.85, envMapIntensity: 0.4 });
    depthAlpha(palletM, {}, 'hr-wh-pallet');
    const rnd = mulberry32(9);
    const nCrate = ROWS * BAYS * LEVELS * 2;
    const crates = new THREE.InstancedMesh(box, crateM, nCrate);
    const posts = new THREE.InstancedMesh(box, steel, ROWS * (BAYS + 1) * 2);
    const beams = new THREE.InstancedMesh(box, beamM, ROWS * BAYS * (LEVELS + 1) * 2);
    const pallets = new THREE.InstancedMesh(box, palletM, ROWS * BAYS * LEVELS * 2);
    let bi = 0, li = 0;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    let ci = 0, pi = 0;
    for (let row = 0; row < ROWS; row++) {
      const z = (row - 4) * PITCH;
      for (let b = 0; b <= BAYS; b++) for (const side of [-1, 1]) {
        m.compose(new THREE.Vector3(b * BW, (LEVELS * LV) / 2, z + side * RD / 2), q, new THREE.Vector3(0.08, LEVELS * LV, 0.08));
        posts.setMatrixAt(pi++, m);
      }
      for (let b = 0; b < BAYS; b++) {
        // two orange beams per level (front and back), the pallets' decks resting on them
        for (let l = 0; l <= LEVELS; l++) for (const sd of [-1, 1]) { m.compose(new THREE.Vector3(b * BW + BW / 2, l * LV + 0.02, z + sd * (RD / 2 - 0.04)), q, new THREE.Vector3(BW, 0.1, 0.06)); beams.setMatrixAt(bi++, m); }
        for (let l = 0; l < LEVELS; l++) for (let k = 0; k < 2; k++) {
          const s = 0.85 + rnd() * 0.15;
          e.set(0, (rnd() - 0.5) * 0.12, 0); q.setFromEuler(e);
          m.compose(new THREE.Vector3(b * BW + 0.6 + k * 1.15 + (rnd() - 0.5) * 0.08, l * LV + 0.2 + s * 0.45, z + (rnd() - 0.5) * 0.08), q, new THREE.Vector3(s, s * 0.9, s));
          crates.setMatrixAt(ci++, m);
          q.identity();
          m.compose(new THREE.Vector3(b * BW + 0.6 + k * 1.15, l * LV + 0.12, z), q, new THREE.Vector3(1.05, 0.13, RD - 0.05));
          pallets.setMatrixAt(li++, m);
        }
      }
    }
    crates.count = ci; posts.count = pi; beams.count = bi; pallets.count = li;
    sc.add(crates, posts, beams, pallets);
    // the hero crate: on the near shelf, sliding in
    this.hero = new THREE.Mesh(box, crateM);
    this.hero.scale.set(0.95, 0.86, 0.95);
    sc.add(this.hero);
    // floor and lamps
    // polished concrete: mottled, saw-cut joints every 4 m, a yellow line along each aisle
    const fc = document.createElement('canvas'); fc.width = 1024; fc.height = 1024;
    const fx = fc.getContext('2d')!, fr = mulberry32(8);
    fx.fillStyle = '#3A3C3E'; fx.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 300; i++) { fx.fillStyle = `rgba(${fr() < 0.5 ? '20,20,22' : '120,122,125'},${0.03 + fr() * 0.05})`; fx.beginPath(); fx.ellipse(fr() * 1024, fr() * 1024, 20 + fr() * 120, 10 + fr() * 60, fr() * 3, 0, Math.PI * 2); fx.fill(); }
    fx.fillStyle = 'rgba(10,10,10,0.6)'; fx.fillRect(0, 0, 1024, 3); fx.fillRect(0, 0, 3, 1024);
    fx.fillStyle = '#C9A227'; fx.fillRect(0, 200, 1024, 14);
    const ft = new THREE.CanvasTexture(fc); ft.colorSpace = THREE.SRGBColorSpace; ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(50, 200 / PITCH); ft.anisotropy = 8;
    const floorM = new THREE.MeshStandardMaterial({ map: ft, roughness: 0.35, metalness: 0.1, envMapIntensity: 0.8 });
    depthAlpha(floorM, {}, 'hr-wh-floor');
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), floorM); floor.rotation.x = -Math.PI / 2; floor.position.set(30, 0, 0); sc.add(floor);
    const shade = new THREE.MeshBasicMaterial({ color: warm.clone().multiplyScalar(4) });
    depthAlpha(shade, {}, 'hr-wh-lamp', false);
    for (let row = 0; row < ROWS - 1; row++) for (let b = 0; b < BAYS; b += 4) {
      const p: V3 = [b * BW + 1, LEVELS * LV + 2.2, (row - 3.5) * PITCH];
      const l = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.25, 20, 1, true), shade); l.position.set(...p); sc.add(l);
      this.lamps.push(p);
      if (this.lamps.length < 24) { const pl = new THREE.PointLight(warm, 30, 16, 1.4); pl.position.set(p[0], p[1] - 0.3, p[2]); sc.add(pl); }
    }
    sc.add(new THREE.HemisphereLight(lin('#3A4458'), lin('#0A0806'), 0.6));
    this.motes = dust(3000, [40, 10, 30], 6);
    (this.motes.u.uCol!.value as THREE.Color).copy(warm.clone().multiplyScalar(0.7));
    this.motes.u.uSize!.value = 10;
    this.motes.pts.position.set(14, 4, 0);
    sc.add(this.motes.pts);
  }

  override draw() {}

  override render(f: Frame, out: THREE.WebGLRenderTarget) {
    const t = f.t, r = this.ctx.renderer, S = this.S, E = this.E;
    // the hero crate slides onto the second shelf of the nearest row
    const slot: V3 = [3 * BW + 0.6, 1 * LV + 0.2 + 0.43, (0 - 4) * PITCH + 0.0];
    const sl = ease.outCubic(prog(t, S, S + 0.8));
    this.hero.position.set(slot[0], slot[1], slot[2] + RD * 1.4 * (1 - sl));
    // the pull back: from the crate's face, back and up over the rows
    const u = ease.inOutCubic(prog(t, S + 0.2, E + 0.3));
    const D = 2.6 * Math.pow(40 / 2.6, u);
    const dir = new THREE.Vector3(0.25 + 0.2 * u, 0.15 + 0.65 * u, 1).normalize();
    const g: V3 = [slot[0] + 6 * u, slot[1] + 1.2 * u, slot[2] + 8 * u];
    const c: V3 = [g[0] + dir.x * D, g[1] + dir.y * D, g[2] + dir.z * D];
    const focus = this.st.look(c, g, 34);
    this.st.time = t;
    // the four lamps nearest the camera cast visible cones
    const near = [...this.lamps].sort((a, b) => (a[0] - c[0]) ** 2 + (a[2] - c[2]) ** 2 - ((b[0] - c[0]) ** 2 + (b[2] - c[2]) ** 2)).slice(0, 4);
    this.st.beams = near.map((p) => ({ p, d: [0, -1, 0] as V3, angle: 0.5, color: lin('#FFD49A', 1.3), range: 8 }));
    this.st.fog = { density: 0.08, noise: 0.6, haze: 0.003, hazeColor: lin('#FFD49A', 0.4), maxDist: 80 };
    this.motes.u.uTime!.value = t;
    this.st.render(r, out, { focus, ap: 8 * (1 - u) + 2, clear: [0, 0, 0] });
    return {
      bloom: 0.6, bloomThreshold: 0.85, bloomRadius: 0.6, halation: 0.05, ca: 0.15, grain: 0.016, vignette: 0.55, hud: 0,
      gain: [1.04, 1.0, 0.92] as [number, number, number], lift: [0.003, 0.003, 0.004] as [number, number, number], sat: 0.95,
      streak: 0.35, streakTint: [1.0, 0.85, 0.6] as [number, number, number],
    };
  }
}
