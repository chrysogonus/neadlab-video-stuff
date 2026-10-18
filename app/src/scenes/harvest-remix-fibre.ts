// Harvest Now, Decrypt Later (Banger Remix): the fibre. The wire the letter crosses, as a macro in a dark equipment
// room: one optical fibre across the frame, a glass thread with light pulsing inside it, and clamped on it a tap
// made like a piece of watchmaking (brass collars holding a glass prism). The sealed envelope rides under the
// fibre, its little padlock glowing green. One continuous passage over the entries of its `plan`; `shot` picks the
// camera of each:
// - `tap` ("I couldn't read a word of it, I didn't even try"): the envelope glides in and stops under the prism;
//   on "read" a reading lens swings over it and a warm lamp clicks on behind it, and through the backlit paper
//   there is nothing to read, only a shimmering grain of ciphertext; on "word" the focus breathes and the grain
//   swirls; on "try" the lamp clicks off and the lens swings away.
// - `copy` ("I made myself a copy and I put it on ice"): from below. On "copy" a scan bar sweeps the envelope in
//   the prism and a pale, translucent twin peels off it and drifts down, turning, while the original rides on;
//   from "put" frost grows over the copy; on "ice" clear ice crystallises around it in one sweep: the copy in a
//   block of ice, its padlock a frosted, colourless twin.
// - `bundle` (the drop): a cable split open, thousands of fibres fanning out of it with pulses of light racing
//   through them; at a row of brass taps every pulse splits off a twin; the camera tracks fast along the fan. It
//   comes in over the hook: the previous shot's last frame (its `tail`) breaks into shards of frosted glass that fly
//   at the camera, gold edges catching the light, the fibres moving behind them.
import * as THREE from 'three';
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import { F, font } from '../engine/type';
import { clamp, ease, lerp, mulberry32, prog, smoothstep } from '../engine/util';
import { LibScene, W, H, hit } from './_lib';
import {
  Stage, backdrop, camKeys, colors, depthAlpha, dust, envProbe, envelopeProp, fitOf, frostGrowth, iceMaterial, iceSlab, lin,
  type CamKey, type V3,
} from './harvest-remix-kit';

export const schema: SceneSchema = {
  description: 'An optical fibre in a dark equipment room with a brass-and-glass tap on it; the sealed envelope rides under it. tap: a reading lens and a warm backlight show only ciphertext through the paper (on "read"), then switch off (on "try"); copy: a scan bar copies the envelope, the pale copy drifts down and ice crystallises round it on "ice". Harvest remix.',
  kinds: ['song'],
  lyrics: 'layer',
  entry: {
    shot: { type: 'string', enum: ['tap', 'copy', 'bundle'], default: 'tap', description: 'which camera: tap (the reading), copy (from below: the copy and the ice), bundle (the drop: the fibres of a split cable, shattering in over the shot before)' },
  },
  cue: {},
  example: { entry: { shot: 'tap' }, cues: [{}, {}] },
};

interface P { shot: 'tap' | 'copy' | 'bundle' }

const EW = 0.5; // the envelope's width
const EY = -0.2; // where it rides, under the fibre
const FALL: V3 = [0.06, -1.02, 0.02]; // where the copy freezes
const SLAB: V3 = [0.7, 0.52, 0.2];

/** Rows of hex in a fibrous warm glow, darker glyphs: the light through the paper, nothing readable. */
function cipherTexture() {
  const w = 1024, h = 640, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d')!, rnd = mulberry32(73);
  c.fillStyle = '#d9d9d9'; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 1800; i++) { c.fillStyle = `rgba(${rnd() < 0.5 ? '255,255,255' : '90,90,90'},0.12)`; c.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 9, 1); }
  c.font = font(F.mono(600), 34); c.textBaseline = 'top';
  const hex = '0123456789ABCDEF';
  for (let y = 18; y < h - 30; y += 42) {
    let line = '';
    for (let k = 0; k < 24; k++) line += hex[Math.floor(rnd() * 16)]! + hex[Math.floor(rnd() * 16)]! + ' ';
    c.fillStyle = `rgba(20,20,20,${0.7 + rnd() * 0.25})`;
    c.fillText(line, 14 + rnd() * 30, y);
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.NoColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Pulses along the fibre's core: bright dashes of different lengths on a dim line (v along the fibre). */
function pulseTexture() {
  const cv = document.createElement('canvas'); cv.width = 8; cv.height = 512;
  const c = cv.getContext('2d')!, rnd = mulberry32(5);
  c.fillStyle = '#333'; c.fillRect(0, 0, 8, 512);
  for (let y = 0; y < 512;) { const l = 6 + rnd() * 30; const gr = c.createLinearGradient(0, y, 0, y + l); gr.addColorStop(0, '#333'); gr.addColorStop(0.5, '#fff'); gr.addColorStop(1, '#333'); c.fillStyle = gr; c.fillRect(0, y, 8, l); y += l + 10 + rnd() * 60; }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 6);
  return t;
}

export default class HarvestRemixFibre extends LibScene<P> {
  static schema = schema;
  private st = new Stage(30, 0.02, 100);
  private c = colors(this.ctx.style, 'frost');
  private S = 0; private E = 0;
  // the words the passage moves on
  private tRead = 1e9; private tWord = 1e9; private tTry = 1e9; private tCopy = 1e9; private tPut = 1e9; private tIce = 1e9;

  private back!: ReturnType<typeof backdrop>;
  private motes!: ReturnType<typeof dust>;
  private pulse!: THREE.CanvasTexture;
  private env!: ReturnType<typeof envelopeProp>;
  private copy!: ReturnType<typeof envelopeProp>;
  private cipher!: THREE.CanvasTexture;
  private lensPivot = new THREE.Group();
  private lamp = new THREE.PointLight(0xffb070, 0, 3, 1.6);
  private bulbM!: THREE.MeshBasicMaterial;
  private scanM!: THREE.MeshBasicMaterial; private scan!: THREE.Mesh;
  private frostM!: THREE.MeshBasicMaterial;
  private slab!: ReturnType<typeof iceSlab>;
  private clip = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
  private frontM!: THREE.MeshBasicMaterial; private front!: THREE.Mesh;
  private key = new THREE.SpotLight(0xffffff, 0, 8, 0.5, 0.6, 1.2);
  // bundle: the fibres (one draw, pulses in the shader), the shatter of the shot before
  private fibU: Record<string, THREE.IUniform> = {};
  private shardScene = new THREE.Scene(); private shardCam = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
  private shardU: Record<string, THREE.IUniform> = {};

  override setup() {
    if (this.P.shot === 'bundle') {
      this.st.fit = fitOf(this.ctx.style);
      this.S = this.ctx.start; this.E = this.ctx.end;
      this.handlesTransition = true;
      this.c = colors(this.ctx.style, this.cues[0]?.def.palette ?? 'amber');
      this.buildBundle();
      return;
    }
    this.st.fit = fitOf(this.ctx.style);
    this.S = this.ctx.start; this.E = this.ctx.end;
    const lines = this.cues.filter((q) => q.line);
    const word = (i: number, w: string) => lines[i]?.line?.words.find((x) => x.w.toLowerCase().replace(/[^a-z]/g, '') === w)?.start;
    this.tRead = word(0, 'read') ?? this.S + 0.6;
    this.tWord = word(0, 'word') ?? this.tRead + 0.45;
    this.tTry = word(0, 'try') ?? this.tRead + 2.3;
    this.tCopy = word(1, 'copy') ?? this.tTry + 1.7;
    this.tPut = word(1, 'put') ?? this.tCopy + 1;
    this.tIce = word(1, 'ice') ?? this.tCopy + 2.2;
    this.c = colors(this.ctx.style, this.cues[0]?.def.palette ?? 'frost');
    this.build();
  }

  private build() {
    const r = this.ctx.renderer, sc = this.st.scene, c = this.c;
    r.localClippingEnabled = true;
    sc.environment = envProbe(r, lin(c.bg, 0.5), [
      { w: 8, h: 1.2, p: [-2, 5, 2], at: [0, 0, 0], c: lin('#CFE6FF', 5) },
      { w: 3, h: 6, p: [5, 0, 3], at: [0, 0, 0], c: lin(c.ice, 1.2) },
      { w: 10, h: 3, p: [0, -1, -6], at: [0, 0, 0], c: lin(c.deep, 0.8) },
      { w: 2, h: 2, p: [-3, -2, 4], at: [0, 0, 0], c: lin('#FFB070', 0.8) },
    ]);
    this.back = backdrop();
    (this.back.u.uTop!.value as THREE.Color).copy(lin(c.bg, 1.4));
    (this.back.u.uBot!.value as THREE.Color).copy(lin(c.bg, 0.5));
    (this.back.u.uGlowC!.value as THREE.Color).copy(lin(c.deep, 0.5));
    this.back.u.uGlow!.value = 0.8; this.back.u.uGlowR!.value = 0.5;
    sc.add(this.back.mesh);

    // the equipment room behind, far out of focus: dark racks and their status lights
    const rnd = mulberry32(17);
    const rackM = new THREE.MeshStandardMaterial({ color: lin('#0B1220'), roughness: 0.6, metalness: 0.4 });
    depthAlpha(rackM, {}, 'hr-fib-rack');
    for (let i = 0; i < 7; i++) {
      const rack = new THREE.Mesh(new THREE.BoxGeometry(0.9, 3.4, 0.8), rackM);
      rack.position.set(-4 + i * 1.3, 0, -4.2 - rnd() * 0.8);
      sc.add(rack);
    }
    const ledCols = [lin(c.ice, 5), lin(c.green, 4), lin('#FFB547', 4), lin(c.ice, 3)];
    for (let i = 0; i < 70; i++) {
      const m = new THREE.MeshBasicMaterial({ color: ledCols[Math.floor(rnd() * 4)]!.clone().multiplyScalar(0.5 + rnd()) });
      depthAlpha(m, {}, 'hr-fib-led', false);
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), m);
      s.position.set(-4.3 + rnd() * 8.6, -1.5 + rnd() * 3, -3.75 - rnd() * 0.3);
      sc.add(s);
    }

    // the fibre: a glowing core with pulses running along it inside a clear glass cladding
    this.pulse = pulseTexture();
    const coreM = new THREE.MeshBasicMaterial({ map: this.pulse, color: lin(c.ice, 3.2) });
    depthAlpha(coreM, {}, 'hr-fib-core', false);
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 12, 8, 1, true), coreM);
    core.rotation.z = Math.PI / 2;
    sc.add(core);
    const clad = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transmission: 1, thickness: 0.02, ior: 1.46, clearcoat: 1, envMapIntensity: 1.2 });
    depthAlpha(clad, { uRimCol: { value: lin(c.ice) }, uRim: { value: 0.5 } }, 'hr-fib-clad');
    const cladM = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 12, 24, 1, true), clad);
    cladM.rotation.z = Math.PI / 2;
    sc.add(cladM);

    // the tap: knurled brass collars either side of a glass prism, an arm up to its housing
    const brass = new THREE.MeshPhysicalMaterial({ color: lin('#D8AE62'), metalness: 1, roughness: 0.28, envMapIntensity: 2.2 });
    depthAlpha(brass, {}, 'hr-fib-brass');
    const tap = new THREE.Group();
    for (const x of [-0.11, 0.11]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.05, 40), brass);
      col.rotation.z = Math.PI / 2; col.position.x = x; tap.add(col);
      for (let k = 0; k < 2; k++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.039, 0.004, 8, 40), brass);
        ring.rotation.y = Math.PI / 2; ring.position.x = x + (k ? 0.02 : -0.02); tap.add(ring);
      }
    }
    const prismM = new THREE.MeshPhysicalMaterial({ color: lin('#E8F4FF'), roughness: 0.03, transmission: 1, thickness: 0.12, ior: 1.52, clearcoat: 1, envMapIntensity: 1.6, dispersion: 2 });
    depthAlpha(prismM, { uRimCol: { value: lin(c.ice) }, uRim: { value: 0.4 } }, 'hr-fib-prism');
    const prism = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.17, 3), prismM);
    prism.rotation.z = Math.PI / 2; prism.rotation.x = Math.PI / 6;
    tap.add(prism);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.5, 0.03), brass);
    arm.position.set(0, 0.3, -0.03); tap.add(arm);
    const housing = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.16), brass);
    housing.position.set(0, 0.58, -0.03); tap.add(housing);
    for (const x of [-0.13, 0.13]) {
      const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 12), brass);
      screw.rotation.x = Math.PI / 2; screw.position.set(x, 0.58, 0.06); tap.add(screw);
    }
    sc.add(tap);
    // the scan bar inside the prism (copy)
    this.scanM = new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0, 0) });
    depthAlpha(this.scanM, {}, 'hr-fib-scan', false);
    this.scan = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.36, 0.1), this.scanM);
    this.scan.position.set(0, EY + 0.02, 0.0);
    sc.add(this.scan);

    // the envelope (riding) and its copy
    this.env = envelopeProp(EW, c, { key: 'hr-fib-env' });
    this.cipher = cipherTexture();
    this.env.paper.emissive = lin('#FFB070');
    this.env.paper.emissiveMap = this.cipher;
    this.env.paper.emissiveIntensity = 0;
    sc.add(this.env.g);
    this.copy = envelopeProp(EW, c, { pale: true, key: 'hr-fib-copy' });
    sc.add(this.copy.g);
    // the frost that grows over the copy
    const ff = 512;
    const seeds: [number, number, number, number][] = [];
    for (let i = 0; i < 4; i++) seeds.push([0, (i + 0.5) / 4 * ff, (rnd() - 0.5) * 0.7, ff * (0.35 + rnd() * 0.3)]);
    for (let i = 0; i < 4; i++) seeds.push([ff, (i + 0.5) / 4 * ff, Math.PI + (rnd() - 0.5) * 0.7, ff * (0.35 + rnd() * 0.3)]);
    for (let i = 0; i < 2; i++) seeds.push([(i + 0.5) / 2 * ff, ff, -Math.PI / 2 + (rnd() - 0.5) * 0.7, ff * (0.25 + rnd() * 0.2)]);
    this.frostM = new THREE.MeshBasicMaterial({ alphaMap: frostGrowth(ff, seeds, 9, 1.5), alphaTest: 1, color: lin('#E6F6FF', 0.55), transparent: false });
    depthAlpha(this.frostM, {}, 'hr-fib-frost', false);
    const frost = new THREE.Mesh(new THREE.PlaneGeometry(EW * 1.02, EW / 1.6 * 1.02), this.frostM);
    frost.position.z = EW * 0.03;
    this.copy.g.add(frost);

    // the ice: a slab grown round the copy by a clipping plane sweeping across it, a bright front at the sweep
    const ice = iceMaterial('hr-fib-ice');
    ice.m.clippingPlanes = [this.clip];
    this.slab = iceSlab(SLAB[0], SLAB[1], SLAB[2], 4, ice.m);
    for (const o of this.slab.extras.children) ((o as THREE.Mesh).material as THREE.Material).clippingPlanes = [this.clip];
    this.slab.g.position.set(...FALL);
    sc.add(this.slab.g);
    this.frontM = new THREE.MeshBasicMaterial({ alphaMap: frostGrowth(256, [[0, 128, 0, 240], [0, 60, 0.3, 200], [0, 200, -0.3, 200], [0, 20, 0.6, 160], [0, 236, -0.6, 160]], 21, 3), alphaTest: 0.05, color: new THREE.Color(0, 0, 0), side: THREE.DoubleSide });
    depthAlpha(this.frontM, {}, 'hr-fib-front', false);
    this.front = new THREE.Mesh(new THREE.PlaneGeometry(SLAB[2] * 1.3, SLAB[1] * 1.15), this.frontM);
    this.front.rotation.y = Math.PI / 2;
    sc.add(this.front);

    // the reading lens on its swing arm, and the lamp behind the envelope
    const lensM = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, transmission: 1, thickness: 0.06, ior: 1.6, clearcoat: 1, envMapIntensity: 1.4 });
    depthAlpha(lensM, { uRimCol: { value: lin('#FFE2B0') }, uRim: { value: 0.25 } }, 'hr-fib-lens');
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.15, 48, 24), lensM);
    lens.scale.z = 0.22;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.152, 0.011, 16, 72), brass);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.62, 10), brass);
    stem.position.set(0, 0.46, 0);
    const lensG = new THREE.Group();
    lensG.add(lens, rim, stem);
    lensG.position.set(0, -0.77, 0);
    this.lensPivot.add(lensG);
    this.lensPivot.position.set(-0.02, EY + 0.77, 0.2);
    sc.add(this.lensPivot);
    this.lamp.position.set(0.06, EY - 0.02, -0.32);
    sc.add(this.lamp);
    this.bulbM = new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0, 0) });
    depthAlpha(this.bulbM, {}, 'hr-fib-bulb', false);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), this.bulbM);
    bulb.position.copy(this.lamp.position).add(new THREE.Vector3(0, 0, -0.08));
    sc.add(bulb);

    this.key.position.set(-1.2, 2.4, 1.4); this.key.target.position.set(0, EY, 0);
    this.key.color.copy(lin('#D6E8FF'));
    sc.add(this.key, this.key.target);
    sc.add(new THREE.HemisphereLight(lin('#9CC0FF'), lin(c.bg), 0.25));

    this.motes = dust(120, [3, 2.6, 2], 23);
    (this.motes.u.uCol!.value as THREE.Color).copy(lin(c.ice, 1.1));
    this.motes.u.uSize!.value = 4;
    this.motes.pts.position.set(0, -0.4, 0);
    sc.add(this.motes.pts);
  }

  /** The split cable and its fan of fibres; the brass taps on the near ones, each with a twin branching off. */
  private buildBundle() {
    const r = this.ctx.renderer, sc = this.st.scene, c = this.c;
    sc.environment = envProbe(r, lin(c.bg, 0.4), [
      { w: 8, h: 1.2, p: [-2, 5, 2], at: [0, 0, 0], c: lin('#FFE2B0', 4) },
      { w: 10, h: 3, p: [0, -1, -6], at: [0, 0, 0], c: lin(c.ice, 0.6) },
    ]);
    this.back = backdrop();
    (this.back.u.uTop!.value as THREE.Color).copy(lin(c.bg, 1.6));
    (this.back.u.uBot!.value as THREE.Color).copy(lin(c.bg, 0.5));
    (this.back.u.uGlowC!.value as THREE.Color).copy(lin(c.accent, 0.35));
    this.back.u.uGlow!.value = 1; this.back.u.uGlowR!.value = 0.6;
    sc.add(this.back.mesh);
    const rnd = mulberry32(31);
    // fibres: a ribbon of thin tubes from the cable's cut end (x = 0) fanning out to the right; per vertex its u along
    // the fibre and a per-fibre phase, so the pulses run in the shader
    const pos: number[] = [], aU: number[] = [], aPh: number[] = [], idx: number[] = [];
    const tube = (pts: THREE.Vector3[], r0: number, u0: number, ph: number) => {
      const n = pts.length, rs = 5, base = pos.length / 3;
      for (let i = 0; i < n; i++) {
        const p = pts[i]!, d = (pts[Math.min(n - 1, i + 1)]!.clone().sub(pts[Math.max(0, i - 1)]!)).normalize();
        const a = new THREE.Vector3(0, 1, 0).cross(d).normalize(), b = d.clone().cross(a);
        for (let k = 0; k < rs; k++) {
          const th = (k / rs) * Math.PI * 2, o = a.clone().multiplyScalar(Math.cos(th) * r0).add(b.clone().multiplyScalar(Math.sin(th) * r0));
          pos.push(p.x + o.x, p.y + o.y, p.z + o.z); aU.push(u0 + i / (n - 1)); aPh.push(ph);
        }
      }
      for (let i = 0; i < n - 1; i++) for (let k = 0; k < rs; k++) {
        const a0 = base + i * rs + k, a1 = base + i * rs + (k + 1) % rs, b0 = a0 + rs, b1 = a1 + rs;
        idx.push(a0, b0, a1, a1, b0, b1);
      }
    };
    const N = 420;
    for (let i = 0; i < N; i++) {
      const ang = rnd() * Math.PI * 2, rr = Math.sqrt(rnd());
      const y0 = Math.sin(ang) * rr * 0.07, z0 = Math.cos(ang) * rr * 0.07;
      const y1 = (rnd() - 0.5) * 2.6, z1 = (rnd() - 0.65) * 3.2, len = 7 + rnd() * 3;
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k <= 40; k++) {
        const u = k / 40, fan = ease.inOutQuad(clamp(u / 0.45));
        pts.push(new THREE.Vector3(u * len, lerp(y0, y1, fan), lerp(z0, z1, fan)));
      }
      const ph = rnd();
      tube(pts, 0.0035 + rnd() * 0.002, 0, ph);
      // a twin branching off a tap on the near, low ones
      if (z1 > 0.4 && Math.abs(y1) < 0.9 && rnd() < 0.5) {
        const tu = 0.55, tp = pts[Math.round(tu * 40)]!;
        const tw: THREE.Vector3[] = [];
        for (let k = 0; k <= 20; k++) { const u = k / 20; tw.push(new THREE.Vector3(tp.x + u * 3, tp.y - 0.6 * u * u - 0.05 * u, tp.z + 0.4 * u)); }
        tube(tw, 0.0032, tu, ph);
        const brass = new THREE.MeshPhysicalMaterial({ color: lin('#D8AE62'), metalness: 1, roughness: 0.28, envMapIntensity: 2.2 });
        depthAlpha(brass, {}, 'hr-fib-brass');
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.05, 20), brass);
        col.rotation.z = Math.PI / 2; col.position.copy(tp);
        sc.add(col);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aU', new THREE.Float32BufferAttribute(aU, 1));
    g.setAttribute('aPh', new THREE.Float32BufferAttribute(aPh, 1));
    g.setIndex(idx);
    this.fibU = { uTime: { value: 0 }, uCol: { value: lin(c.ice, 1) }, uHot: { value: lin('#FFE6B8', 1) } };
    const mat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3, uniforms: this.fibU,
      vertexShader: `precision highp float;
in vec3 position; in float aU, aPh;
uniform mat4 modelViewMatrix, projectionMatrix;
out float vU, vPh, vD;
void main() { vU = aU; vPh = aPh; vec4 mv = modelViewMatrix * vec4(position, 1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `precision highp float;
in float vU, vPh, vD;
uniform float uTime; uniform vec3 uCol, uHot;
out vec4 fragColor;
void main() {
  // pulses racing out along the fibre: two trains at different speeds, sharp heads, soft tails
  float a = fract(vU * 2.2 - uTime * 1.9 + vPh * 7.0), b = fract(vU * 3.7 - uTime * 2.7 + vPh * 13.0);
  float p = pow(a, 26.0) * 1.0 + pow(b, 40.0) * 0.8 + smoothstep(0.75, 1.0, a) * 0.08;
  vec3 col = uCol * (0.06 + 0.1 * smoothstep(0.0, 0.2, vU)) + mix(uCol, uHot, 0.6) * p * 7.0;
  fragColor = vec4(col, vD);
}`,
    });
    const fib = new THREE.Mesh(g, mat);
    fib.frustumCulled = false;
    sc.add(fib);
    // the cable: a black jacket from the left, its cut end ringed in brass
    const jacket = new THREE.MeshStandardMaterial({ color: lin('#0A0E14'), roughness: 0.45, metalness: 0.2 });
    depthAlpha(jacket, {}, 'hr-fib-jacket');
    const cab = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 6, 40), jacket);
    cab.rotation.z = Math.PI / 2; cab.position.x = -3;
    sc.add(cab);
    sc.add(new THREE.HemisphereLight(lin('#FFE2B0'), lin(c.bg), 0.25));
    this.motes = dust(200, [6, 3, 3], 29);
    (this.motes.u.uCol!.value as THREE.Color).copy(lin(c.gold, 1));
    this.motes.u.uSize!.value = 4;
    this.motes.pts.position.set(2.5, 0, 0);
    sc.add(this.motes.pts);

    // the shatter: the last frame of the shot before, cut into shards (a jittered grid of triangles in clip space)
    const sp: number[] = [], sc0: number[] = [], sd: number[] = [], sb: number[] = [];
    const nx = 9, ny = 5, J = (i: number, j: number) => {
      const e = i === 0 || j === 0 || i === nx || j === ny;
      const h = mulberry32(i * 97 + j * 13);
      return [-1 + (2 * i) / nx + (e ? 0 : (h() - 0.5) * 0.16), -1 + (2 * j) / ny + (e ? 0 : (h() - 0.5) * 0.3)] as [number, number];
    };
    const tri = (a: [number, number], b: [number, number], cc: [number, number]) => {
      const cx = (a[0] + b[0] + cc[0]) / 3, cy = (a[1] + b[1] + cc[1]) / 3, rs = mulberry32(Math.round((cx + 2) * 1000 + (cy + 2) * 31));
      const dir = [cx * (0.8 + rs()), cy * (0.8 + rs()), (rs() - 0.5) * 6, 0.4 + rs()];
      for (const [k, v] of [a, b, cc].entries()) { sp.push(v[0], v[1], 0); sc0.push(cx, cy); sd.push(...dir); sb.push(k === 0 ? 1 : 0, k === 1 ? 1 : 0, k === 2 ? 1 : 0); }
    };
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      const a = J(i, j), b = J(i + 1, j), cc = J(i + 1, j + 1), d = J(i, j + 1);
      if ((i + j) % 2) { tri(a, b, cc); tri(a, cc, d); } else { tri(a, b, d); tri(b, cc, d); }
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    sg.setAttribute('aC', new THREE.Float32BufferAttribute(sc0, 2));
    sg.setAttribute('aD', new THREE.Float32BufferAttribute(sd, 4));
    sg.setAttribute('aB', new THREE.Float32BufferAttribute(sb, 3));
    this.shardU = { tUnder: { value: null }, uK: { value: 0 }, uGold: { value: lin(c.gold, 1) }, uAsp: { value: W / H } };
    const sm = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3, uniforms: this.shardU, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: `precision highp float;
in vec3 position; in vec2 aC; in vec4 aD; in vec3 aB;
uniform float uK, uAsp;
out vec2 vUv; out vec3 vB; out float vF;
void main() {
  vUv = position.xy * 0.5 + 0.5; vB = aB;
  float k = uK, e = k * k;
  // each shard flies out from the centre and at the camera (it grows), turning about its centroid
  vec2 q = (position.xy - aC) * vec2(uAsp, 1.0);
  float an = aD.z * e * 0.8, s = 1.0 + e * (0.35 + 0.8 * aD.w);
  q = mat2(cos(an), sin(an), -sin(an), cos(an)) * q * s;
  vec2 out2 = normalize(aC + 0.35 * aD.xy + 1e-4);
  vec2 p = aC + q / vec2(uAsp, 1.0) + out2 * (0.25 * k + 2.4 * e) + aD.xy * e * 0.5;
  vF = k;
  gl_Position = vec4(p, 0.0, 1.0);
}`,
      fragmentShader: `precision highp float;
in vec2 vUv; in vec3 vB; in float vF;
uniform sampler2D tUnder; uniform vec3 uGold;
out vec4 fragColor;
void main() {
  vec3 col = texture(tUnder, vUv).rgb;
  float edge = 1.0 - smoothstep(0.0, 0.022, min(vB.x, min(vB.y, vB.z)));
  col = col * (1.0 - 0.3 * vF) + uGold * edge * (1.2 + 2.5 * vF) * (1.0 - vF);
  fragColor = vec4(col, 1.0);
}`,
    });
    const shards = new THREE.Mesh(sg, sm);
    shards.frustumCulled = false;
    this.shardScene.add(shards);
  }

  private renderBundle(f: Frame, out: THREE.WebGLRenderTarget) {
    const t = f.t, r = this.ctx.renderer, c = this.c, S = this.S, E = this.E;
    // a fast track along the fan, from the cable's cut end out over the fibres
    const cm = camKeys(t, [
      { t: S, c: [-0.35, 0.32, 1.05], g: [0.8, 0.0, 0.1], fov: 30, ap: 30 },
      { t: E + 0.1, c: [3.3, 0.1, 0.95], g: [4.8, -0.05, 0.2], fov: 30, ap: 30, e: ease.inOutQuad },
    ]);
    const focus = this.st.look(cm.c, cm.g, cm.fov);
    this.fibU.uTime!.value = t;
    this.back.u.uTime!.value = t;
    this.motes.u.uTime!.value = t;
    this.st.time = t;
    this.st.beams = [];
    this.st.fog = { density: 0.08, noise: 0.5, haze: 0.01, hazeColor: lin(c.accent, 0.4), maxDist: 12 };
    this.st.render(r, out, { focus: focus * 0.8, ap: cm.ap, clear: [0, 0, 0], rays: { uv: [0.15, 0.55], amt: 0.4, thr: 0.9, len: 0.5, decay: 0.96, rad: 0.5, tint: lin(c.gold, 0.8) } });
    // the shatter over the overlap with the shot before
    if (f.under && f.tin < 1) {
      this.shardU.tUnder!.value = f.under;
      this.shardU.uK!.value = ease.outCubic(f.tin);
      r.setRenderTarget(out);
      r.render(this.shardScene, this.shardCam);
    }
    return {
      bloom: 0.85, bloomThreshold: 0.8, bloomRadius: 0.65, halation: 0.08, ca: 0.25, grain: 0.016, vignette: 0.5, hud: 0,
      streak: 0.3, streakTint: [1.0, 0.85, 0.6] as [number, number, number],
      gain: [1.04, 1.0, 0.94] as [number, number, number], lift: [0.004, 0.002, 0.004] as [number, number, number], sat: 1.1,
    };
  }

  // ------------------------------------------------------------------ timing

  /** Where the original envelope is along the fibre (x): glides in, waits at the tap, rides on after the copy. */
  private envX(t: number) {
    const arrive = lerp(-2.6, 0, ease.outCubic(prog(t, this.S, this.tRead - 0.15)));
    const nudge = 0.08 * ease.inOutQuad(prog(t, this.tTry + 0.2, this.tTry + 1.0));
    const away = 3.2 * ease.inCubic(prog(t, this.tCopy + 0.35, this.tCopy + 1.6));
    return arrive + nudge + away;
  }

  private cam(t: number) {
    const ks: CamKey[] = this.P.shot === 'tap'
      ? [
          { t: this.S, c: [-0.36, -0.06, 1.3], g: [-0.02, EY + 0.04, 0], fov: 30, ap: 34 },
          { t: this.tRead, c: [-0.24, -0.1, 1.12], g: [0, EY + 0.02, 0], fov: 30, ap: 36, e: ease.inOutQuad },
          { t: this.tTry + 0.8, c: [-0.16, -0.12, 1.02], g: [0.02, EY + 0.02, 0], fov: 30, ap: 36, e: ease.linear },
        ]
      : [
          { t: this.tTry + 0.6, c: [0.44, -0.66, 1.18], g: [0.06, EY - 0.02, 0], fov: 30, ap: 30 },
          { t: this.tCopy + 0.3, c: [0.4, -0.7, 1.16], g: [0.07, EY - 0.08, 0], fov: 30, ap: 30, e: ease.linear },
          { t: this.tIce - 0.1, c: [0.3, -1.0, 1.22], g: [FALL[0], FALL[1] + 0.02, FALL[2]], fov: 30, ap: 30, e: ease.inOutQuad },
          { t: this.E + 0.3, c: [0.22, -0.98, 0.98], g: [FALL[0], FALL[1] + 0.02, FALL[2]], fov: 30, ap: 32, e: ease.outQuad },
        ];
    return camKeys(t, ks);
  }

  override draw() {}

  override render(f: Frame, out: THREE.WebGLRenderTarget) {
    if (this.P.shot === 'bundle') return this.renderBundle(f, out);
    const t = f.t, r = this.ctx.renderer, c = this.c;
    const cm = this.cam(t);
    let focus = this.st.look(cm.c, cm.g, cm.fov);

    // the fibre's pulses run along it
    this.pulse.offset.y = -t * 1.6;

    // the envelope rides under the fibre, swaying a little
    const ex = this.envX(t);
    this.env.g.position.set(ex, EY + 0.006 * Math.sin(t * 2.1), 0);
    this.env.g.rotation.set(0.04 * Math.sin(t * 1.3), 0, 0.02 * Math.sin(t * 1.7));
    (this.env.glass as THREE.MeshPhysicalMaterial).emissiveIntensity = 1.4 * (0.85 + 0.3 * f.a.rms);

    // the reading: the lens swings in, the lamp clicks on behind the paper (only ciphertext shows), then both go
    const swingIn = ease.outBack(prog(t, this.tRead - 0.42, this.tRead), 1.2);
    const swingOut = ease.inOutCubic(prog(t, this.tTry + 0.05, this.tTry + 0.55));
    this.lensPivot.rotation.z = lerp(1.25, 0, swingIn) + 1.4 * swingOut;
    const lampOn = (t >= this.tRead ? 1 : 0) * (t >= this.tTry ? 0 : 1) * (0.94 + 0.06 * Math.sin(t * 61) * Math.sin(t * 23));
    this.lamp.intensity = 6 * lampOn;
    this.bulbM.color.copy(lin('#FFC27A', 9 * lampOn));
    this.env.paper.emissiveIntensity = 0.75 * lampOn;
    // the grain swirls on "word"
    const sw = ease.inOutCubic(prog(t, this.tWord - 0.05, this.tWord + 0.6));
    this.cipher.offset.set(0.02 * t + 0.35 * sw, 0.15 * sw + 0.01 * Math.sin(t * 3));
    this.cipher.rotation = 0.05 * Math.sin(t * 0.7) + 0.2 * sw;
    if (this.P.shot === 'tap') focus += 0.22 * Math.sin(Math.PI * prog(t, this.tWord - 0.05, this.tWord + 0.5));

    // the copy: the scan bar sweeps on "copy", a pale twin peels off and drifts down, turning; frost grows over it
    const sweep = prog(t, this.tCopy - 0.06, this.tCopy + 0.24);
    this.scan.visible = sweep > 0 && sweep < 1;
    this.scan.position.x = this.envX(this.tCopy) + lerp(-0.3, 0.3, sweep);
    this.scanM.color.copy(lin('#DFF6FF', 4 * Math.sin(Math.PI * sweep)));
    const cx0 = this.envX(this.tCopy);
    const peel = ease.outCubic(prog(t, this.tCopy + 0.04, this.tCopy + 0.4));
    const fall = ease.inOutQuad(prog(t, this.tCopy + 0.3, this.tIce - 0.12));
    const frozen = t >= this.tIce - 0.12;
    this.copy.g.visible = t >= this.tCopy + 0.04;
    // the copy materialises: a cold glow that settles to a pale ghost of the paper
    this.copy.paper.emissiveIntensity = 0.12 + 1.2 * (1 - smoothstep(this.tCopy + 0.04, this.tCopy + 0.5, t));
    this.copy.g.position.set(lerp(cx0, FALL[0], fall), lerp(EY - 0.07 * peel, FALL[1], fall), lerp(0.02, FALL[2], fall));
    const turn = Math.PI * 2 * fall;
    this.copy.g.rotation.set(0.35 * peel * (1 - fall) + 0.15 * Math.sin(Math.PI * fall), turn, -0.12 * Math.sin(Math.PI * fall));
    const grow = ease.inOutQuad(prog(t, this.tPut, this.tIce));
    this.frostM.alphaTest = clamp(1 - grow * 0.9, 0.08, 1);
    this.frostM.visible = grow > 0.005;

    // the ice crystallises round it: a sweep across the slab that lands on "ice", a bright frost front leading it
    const ice = ease.outCubic(prog(t, this.tIce - 0.2, this.tIce + 0.02));
    const x0 = FALL[0] - SLAB[0] * 0.6, x1 = FALL[0] + SLAB[0] * 0.6;
    const sx = lerp(x0, x1, ice);
    this.clip.constant = sx;
    this.slab.g.visible = ice > 0;
    this.front.visible = ice > 0 && ice < 1;
    this.front.position.set(sx, FALL[1], FALL[2]);
    this.frontM.color.copy(lin('#EAF8FF', 3 * Math.sin(Math.PI * ice) + 0.3));
    this.slab.g.rotation.set(0, 0.06 * Math.sin(t * 0.5), 0.02 * Math.sin(t * 0.4));
    if (frozen) this.copy.g.rotation.set(0, 0, 0);

    // light
    this.key.intensity = 10 + 30 * hit(t, this.tIce, 0.25);
    this.st.scene.environmentIntensity = 0.8;
    this.back.u.uTime!.value = t;
    (this.back.u.uGlowP!.value as THREE.Vector2).set(...this.st.uv([0.6, 1.2, -3]));
    this.motes.u.uTime!.value = t;
    this.motes.u.uAmt!.value = 0.6 + 1.2 * hit(t, this.tIce, 0.5);
    this.st.time = t;
    this.st.beams = [
      { p: [-1.2, 2.4, 1.4], d: [1.2, -2.4 + EY, -1.4], angle: 0.22, color: lin(c.ice, 0.5), range: 6 },
      { p: [this.lamp.position.x, this.lamp.position.y, this.lamp.position.z - 0.1], d: [0, 0, 1], angle: 0.9, color: lin('#FFB070', 0.5 * lampOn), range: 1.2 },
    ];
    this.st.fog = { density: 0.12, noise: 0.5, haze: 0.01, hazeColor: lin(c.deep, 0.5), maxDist: 10 };
    this.st.render(r, out, {
      focus, ap: cm.ap, clear: [0, 0, 0],
      rays: { uv: this.st.uv([this.lamp.position.x, this.lamp.position.y, this.lamp.position.z]), amt: 0.5 * lampOn, thr: 0.9, len: 0.5, decay: 0.96, rad: 0.25, tint: lin('#FFC890', 0.8) },
      lens: 0.06, lensCol: lin(c.ice, 0.4),
    });
    return {
      bloom: 0.8, bloomThreshold: 0.82, bloomRadius: 0.65, halation: 0.05, ca: 0.22, grain: 0.016, vignette: 0.48, hud: 0,
      gain: [0.93, 1.0, 1.1] as [number, number, number], lift: [0, 0.004, 0.012] as [number, number, number], sat: 1.1,
    };
  }
}
