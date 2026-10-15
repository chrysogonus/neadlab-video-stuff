// Harvest Now, Decrypt Later (Banger Remix): the robot. The archive's tape library: an aisle between towering racks
// of frosted cartridges, thousands of them, a gold status light on each; a robotic picker rides a rail down the
// aisle, its carriage climbing a mast, and slots cartridges home on the beats. The default phase files one with a
// whip down the rail; `fast` (chorus 2) files one on every beat. Status lights ripple down the racks after each.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import { ease, hexToLinear, mulberry32, prog } from '../engine/util';
import { F, font } from '../engine/type';
import { LibScene, hit } from './_lib';
import { Stage, camKeys, colors, depthAlpha, dust, envProbe, fitOf, lin } from './harvest-remix-kit';

export const schema: SceneSchema = {
  description: 'A tape library: an aisle between towering racks of frosted cartridges with gold status lights; a robotic picker rides a rail and a mast and slots cartridges home on the beats (fast: on every beat), lights rippling down the racks. Harvest remix.',
  kinds: ['song'],
  lyrics: 'layer',
  entry: {
    phase: { type: 'string', enum: ['file', 'fast'], default: 'file', description: 'file: one whip and slot; fast: a slot on every beat' },
  },
  cue: {},
  example: { entry: {}, cues: [{}] },
};

interface P { phase: 'file' | 'fast' }

const COLS = 70, ROWS = 26, CW = 0.16, CH = 0.11, AISLE = 1.6; // cartridges per wall, slot size (m), aisle width

interface Move { t: number; x: number; y: number; side: number }

export default class HarvestRemixRobot extends LibScene<P> {
  static schema = schema;
  private st = new Stage(32, 0.03, 200);
  private carts!: THREE.InstancedMesh; private leds!: THREE.InstancedMesh;
  private carriage = new THREE.Group(); private head = new THREE.Group(); private held!: THREE.Mesh;
  private moves: Move[] = [];
  private S = 0; private E = 0;
  private c = colors(this.ctx.style, 'amber');

  override setup() {
    this.st.fit = fitOf(this.ctx.style);
    this.S = this.ctx.start; this.E = this.ctx.end;
    this.c = colors(this.ctx.style, this.cues[0]?.def.palette ?? 'amber');
    const r = this.ctx.renderer, sc = this.st.scene, c = this.c;
    sc.environment = envProbe(r, lin('#05070C'), [
      { w: 30, h: 1, p: [0, 5, 0], at: [0, 0, 0], c: lin('#CFE4FF', 5) },
      { w: 10, h: 6, p: [0, 1, -20], at: [0, 1, 0], c: lin(c.accent, 1.5) },
    ]);
    // the racks: two walls of cartridges facing the aisle
    const rnd = mulberry32(12);
    const cg = new THREE.BoxGeometry(CW * 0.86, CH * 0.8, 0.5);
    // each cartridge's face: its shell and a barcode label (the volume serial in coloured blocks over the bars),
    // from an atlas of 64 labels picked per instance
    const lab = document.createElement('canvas'); lab.width = 8 * 192; lab.height = 8 * 128;
    const lc = lab.getContext('2d')!, lr = mulberry32(64);
    const blocks = ['#E8463A', '#F2A33A', '#F5E04A', '#5FB0E8', '#9A6AD8', '#EDEDED', '#F27AA8', '#7FD0C8', '#D8A060', '#B8C4D0'];
    for (let k = 0; k < 64; k++) {
      const x0 = (k % 8) * 192, y0 = Math.floor(k / 8) * 128;
      lc.fillStyle = '#3A3F46'; lc.fillRect(x0, y0, 192, 128);
      lc.fillStyle = 'rgba(255,255,255,0.08)'; lc.fillRect(x0, y0, 192, 8);
      lc.fillStyle = '#F4F2EC'; lc.fillRect(x0 + 10, y0 + 40, 172, 80);
      const vs = `${String.fromCharCode(65 + Math.floor(lr() * 6))}${String(Math.floor(lr() * 99999)).padStart(5, '0')}L9`;
      for (let j = 0; j < 6; j++) {
        const ch = vs[j]!, ci = /\d/.test(ch) ? +ch : 9;
        lc.fillStyle = blocks[ci]!; lc.fillRect(x0 + 14 + j * 27, y0 + 44, 25, 26);
        lc.fillStyle = '#111'; lc.font = font(F.mono(700), 20); lc.textAlign = 'center'; lc.fillText(ch, x0 + 26.5 + j * 27, y0 + 64);
      }
      lc.fillStyle = '#111';
      for (let bx = x0 + 16; bx < x0 + 176;) { const bw = 1 + Math.floor(lr() * 3); if (lr() < 0.55) lc.fillRect(bx, y0 + 76, bw, 38); bx += bw + 1; }
    }
    const labT = new THREE.CanvasTexture(lab); labT.colorSpace = THREE.SRGBColorSpace; labT.anisotropy = 8;
    const cm = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: labT, roughness: 0.4, metalness: 0.2, clearcoat: 0.6, envMapIntensity: 0.9 });
    depthAlpha(cm, {}, 'hr-rob-cart');
    const prevCompile = cm.onBeforeCompile;
    cm.onBeforeCompile = (sh, rr) => {
      prevCompile.call(cm, sh, rr);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aLab;')
        .replace('#include <uv_vertex>', '#include <uv_vertex>\nvMapUv = (vec2(mod(aLab, 8.0), 7.0 - floor(aLab / 8.0)) + uv) / 8.0;');
    };
    cm.customProgramCacheKey = () => 'hr-rob-cart-lab';
    this.carts = new THREE.InstancedMesh(cg, cm, COLS * ROWS * 2);
    const labIdx = new Float32Array(COLS * ROWS * 2);
    for (let k = 0; k < labIdx.length; k++) labIdx[k] = Math.floor(rnd() * 64);
    cg.setAttribute('aLab', new THREE.InstancedBufferAttribute(labIdx, 1));
    const lm = new THREE.MeshBasicMaterial({ color: 0xffffff });
    depthAlpha(lm, {}, 'hr-rob-led', false);
    this.leds = new THREE.InstancedMesh(new THREE.SphereGeometry(0.009, 8, 6), lm, COLS * ROWS * 2);
    const m = new THREE.Matrix4(), col = new THREE.Color();
    let i = 0;
    for (const side of [-1, 1]) for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++, i++) {
      const px = side * (AISLE / 2 + 0.25), pz = -x * CW, py = 0.25 + y * CH;
      m.makeTranslation(px, py, pz); m.multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2));
      this.carts.setMatrixAt(i, m);
      const tone = rnd();
      col.copy(lin(tone < 0.7 ? '#E2E8EE' : tone < 0.85 ? '#C6D4E0' : '#EADFC8', 1.0));
      this.carts.setColorAt(i, col);
      this.leds.setMatrixAt(i, new THREE.Matrix4().makeTranslation(px - side * 0.255, py - CH * 0.25, pz + CW * 0.3));
      this.leds.setColorAt(i, new THREE.Color(0, 0, 0));
    }
    sc.add(this.carts, this.leds);
    // the frame: uprights between bays, the floor rail, the ceiling rail, strip lights
    const steel = new THREE.MeshPhysicalMaterial({ color: lin('#5A6470'), metalness: 1, roughness: 0.45, envMapIntensity: 0.45 });
    depthAlpha(steel, {}, 'hr-rob-steel');
    for (const side of [-1, 1]) for (let x = 0; x <= COLS; x += 10) {
      const u = new THREE.Mesh(new THREE.BoxGeometry(0.05, ROWS * CH + 0.4, 0.06), steel);
      u.position.set(side * (AISLE / 2 + 0.02), (ROWS * CH + 0.4) / 2, -x * CW + CW / 2); sc.add(u);
    }
    for (const y of [0.05, ROWS * CH + 0.45]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, COLS * CW + 2), steel);
      rail.position.set(0, y, -COLS * CW / 2); sc.add(rail);
    }
    const strip = new THREE.MeshBasicMaterial({ color: lin('#DDEBFF', 1.6) });
    depthAlpha(strip, {}, 'hr-rob-strip', false);
    const sl = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, COLS * CW), strip); sl.position.set(0, ROWS * CH + 0.9, -COLS * CW / 2); sc.add(sl);
    // the aisle floor: a steel grating
    const gc = document.createElement('canvas'); gc.width = 256; gc.height = 256;
    const gx = gc.getContext('2d')!;
    gx.fillStyle = '#05060A'; gx.fillRect(0, 0, 256, 256);
    gx.fillStyle = '#5A6270'; for (let k = 0; k < 256; k += 32) { gx.fillRect(k, 0, 6, 256); gx.fillRect(0, k, 256, 3); }
    const gt = new THREE.CanvasTexture(gc); gt.colorSpace = THREE.SRGBColorSpace; gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(16, 120); gt.anisotropy = 8;
    const floorM = new THREE.MeshPhysicalMaterial({ map: gt, metalness: 0.7, roughness: 0.35, clearcoat: 0.3, envMapIntensity: 0.5 });
    depthAlpha(floorM, {}, 'hr-rob-floor');
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(4, 30), floorM); floor.rotation.x = -Math.PI / 2; floor.position.z = -10; sc.add(floor);
    // the picker: a mast on the rails, a carriage on the mast, a gripper head with a cartridge
    const yellow = new THREE.MeshPhysicalMaterial({ color: lin('#E8B23A'), metalness: 0.3, roughness: 0.35, clearcoat: 0.8, envMapIntensity: 1 });
    depthAlpha(yellow, {}, 'hr-rob-yellow');
    const mast = new THREE.Mesh(new THREE.BoxGeometry(0.12, ROWS * CH + 0.4, 0.12), steel); mast.position.y = (ROWS * CH + 0.4) / 2;
    this.carriage.add(mast);
    const graphite = new THREE.MeshPhysicalMaterial({ color: lin('#262A31'), metalness: 0.7, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.2, envMapIntensity: 1.1 });
    depthAlpha(graphite, {}, 'hr-rob-graphite');
    const body = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.2, 0.26, 4, 0.03), graphite); this.head.add(body);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.345, 0.03, 0.265), yellow); stripe.position.y = -0.05; this.head.add(stripe);
    for (const zz of [-0.07, 0.07]) { const finger = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.025, 0.03, 2, 0.008), steel); finger.position.set(0.21, 0, zz); this.head.add(finger); }
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 24).rotateZ(Math.PI / 2), graphite); lens.position.set(0.175, 0.06, 0); this.head.add(lens);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), new THREE.MeshBasicMaterial({ color: lin('#FF3B2A', 5) })); eye.position.set(0.186, 0.06, 0);
    depthAlpha(eye.material as THREE.Material, {}, 'hr-rob-eye', false);
    this.head.add(eye);
    const hg = cg.clone(); hg.deleteAttribute('aLab');
    this.held = new THREE.Mesh(hg, cm); this.held.rotation.y = Math.PI / 2; this.head.add(this.held);
    this.head.scale.setScalar(1.25);
    this.carriage.add(this.head);
    sc.add(this.carriage);
    const key = new THREE.SpotLight(lin('#DDEBFF'), 80, 30, 0.6, 0.8, 1.3); key.position.set(0, ROWS * CH + 1, 2); key.target.position.set(0, 1, -6); sc.add(key, key.target);
    sc.add(new THREE.HemisphereLight(lin('#7090C0'), lin('#05070A'), 0.25));
    const mo = dust(800, [2, 3.5, 14], 8);
    (mo.u.uCol!.value as THREE.Color).copy(lin('#DDEBFF', 0.8)); mo.u.uSize!.value = 6; mo.pts.position.set(0, 1.6, -6);
    sc.add(mo.pts); (this as unknown as { mo: typeof mo }).mo = mo;
    // the moves: to a slot and in, on beats
    const beats = this.ctx.audio.beats.filter((b) => b > this.S - 0.01 && b < this.E + 0.5);
    const rs = mulberry32(this.P.phase === 'fast' ? 41 : 40);
    const every = this.P.phase === 'fast' ? 1 : 2;
    beats.forEach((b, k) => { if (k % every === 0) this.moves.push({ t: b, x: 3 + rs() * 20, y: 2 + Math.floor(rs() * (ROWS - 6)), side: rs() < 0.5 ? -1 : 1 }); });
    if (!this.moves.length) this.moves.push({ t: this.S + 0.5, x: 8, y: 10, side: 1 });
  }

  /** The picker at t: rail position (column), mast height (row), which wall, and how far the gripper reaches in. */
  private picker(t: number) {
    let i = 0;
    while (i < this.moves.length - 1 && t >= this.moves[i + 1]!.t - 0.35) i++;
    const cur = this.moves[i]!, prev = this.moves[i - 1] ?? { ...cur, x: cur.x + 6, y: cur.y - 4 };
    const go = ease.inOutCubic(prog(t, cur.t - 0.35, cur.t - 0.05));
    const reach = Math.sin(Math.PI * prog(t, cur.t - 0.05, cur.t + 0.3));
    return { x: prev.x + (cur.x - prev.x) * go, y: prev.y + (cur.y - prev.y) * go, side: go < 0.5 ? prev.side : cur.side, reach, slot: cur, hit: cur.t };
  }

  override draw() {}

  override render(f: Frame, out: THREE.WebGLRenderTarget) {
    const t = f.t, r = this.ctx.renderer, S = this.S, E = this.E, c = this.c;
    const pk = this.picker(t);
    const pz = -pk.x * CW, py = 0.25 + pk.y * CH;
    this.carriage.position.set(0, 0, pz);
    this.head.position.set(pk.side * (0.1 + 0.18 * pk.reach), py, 0);
    this.head.rotation.y = pk.side > 0 ? 0 : Math.PI;
    this.held.position.set(0.25 + 0.05 * pk.reach, 0, 0);
    this.held.visible = pk.reach < 0.6;
    // status lights: a ripple out from each filed slot
    const gold = hexToLinear(c.accent), col = new THREE.Color();
    let i = 0;
    for (const side of [-1, 1]) for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++, i++) {
      let v = 0.35 + 0.15 * Math.sin(t * 2 + x * 0.7 + y * 1.3);
      for (const mv of this.moves) {
        if (t < mv.t || mv.side !== side) continue;
        const d = Math.hypot(x - mv.x, (y - mv.y) * 1.4), w = (t - mv.t) * 40 - d;
        if (w > 0 && w < 3) v += 3 * (1 - w / 3);
      }
      col.setRGB(gold[0] * v * 2.2, gold[1] * v * 2.2, gold[2] * v * 2.2);
      this.leds.setColorAt(i, col);
    }
    this.leds.instanceColor!.needsUpdate = true;
    // the camera rides with the picker, a little behind and below it, looking up the aisle past it
    const k0 = this.picker(S), kz = -k0.x * CW;
    const cm = camKeys(t, [
      { t: S, c: [-0.5, py - 0.35, pz + 2.7], g: [0.15, py + 0.1, pz - 1.2], fov: 34, ap: 12 },
      { t: E + 0.3, c: [-0.45, py - 0.3, pz + 2.45], g: [0.15, py + 0.1, pz - 1.2], fov: 34, ap: 12, e: ease.linear },
    ]);
    void kz;
    const focus = this.st.look(cm.c, cm.g, cm.fov);
    this.st.time = t;
    this.st.beams = [{ p: [0, ROWS * CH + 1, 1], d: [0, -0.6, -1], angle: 0.35, color: lin('#DDEBFF', 0.16), range: 14 }];
    this.st.fog = { density: 0.05, noise: 0.5, haze: 0.002, hazeColor: lin(c.accent, 0.5), maxDist: 20 };
    const mo = (this as unknown as { mo: ReturnType<typeof dust> }).mo; mo.u.uTime!.value = t;
    this.st.render(r, out, { focus, ap: cm.ap, clear: [0, 0, 0] });
    const thump = hit(t, pk.hit, 0.07);
    return {
      bloom: 0.7, bloomThreshold: 0.85, bloomRadius: 0.6, halation: 0.05, ca: 0.15, grain: 0.016, vignette: 0.5, hud: 0,
      shake: [thump * 3, thump * 4] as [number, number],
      gain: [1.0, 1.0, 1.0] as [number, number, number], lift: [0.002, 0.003, 0.008] as [number, number, number], sat: 1.1,
    };
  }
}
