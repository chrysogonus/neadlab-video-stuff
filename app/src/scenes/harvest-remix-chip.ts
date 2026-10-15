// Harvest Now, Decrypt Later (Banger Remix): the chip. Superconducting qubit chips in macro: a silicon die with a
// grid of cross-shaped qubits and meandering resonators, bond wires arching to a gold package. Phases (entry
// `phase`):
// - `decade` (verse 2, "the decade's nearly here", frost): four generations of chips on a dark bench, each larger
//   than the last (53, 127, 433, 1121 qubits); the camera tracks along the row as each lights its qubits; a
//   "Q-DAY ETA" readout counts its years down on the hats and snaps to the cue's `eta` on the anchor.
// - `base` (final chorus, "Every byte you ever sent is mine", amber): the chandelier's chip in its gold package,
//   frost on the edges; qubits light row by row on the beats; on the anchor every qubit flares gold and light runs
//   down the bond wires.
import * as THREE from 'three';
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import { Layer2D } from '../engine/gl';
import { clamp, ease, hexToLinear, lerp, mulberry32, prog } from '../engine/util';
import { F, font } from '../engine/type';
import { LibScene, W, H, hit, label } from './_lib';
import { Stage, backdrop, camKeys, colors, depthAlpha, dust, envProbe, lin, type CamKey, type V3, fitOf } from './harvest-remix-kit';

export const schema: SceneSchema = {
  description: 'Superconducting qubit chips in macro (silicon dies with cross-shaped qubits, resonators, gold bond wires and package). decade: four generations side by side (53 to 1121 qubits), the camera tracking along as each lights, a Q-day ETA counting down to the anchor; base: the chandelier\'s chip, qubits lighting row by row, all flaring gold on the anchor, light running down the bond wires. Harvest remix.',
  kinds: ['song'],
  lyrics: 'layer',
  entry: {
    phase: { type: 'string', enum: ['decade', 'base', 'wafer'], default: 'decade', description: 'decade: the row of chip generations; base: the one chip at base temperature; wafer: a whole wafer of chips under cleanroom light, lighting one after another' },
  },
  cue: {
    eta: { type: 'string', default: 'near', description: 'decade: what the Q-day ETA readout snaps to on the anchor' },
  },
  example: { entry: { phase: 'decade' }, cues: [{ eta: 'near' }] },
};

type Phase = 'decade' | 'base' | 'wafer';
interface P { phase: Phase }
interface C { eta: string }

const GENS = [{ n: 7, q: 53, s: 0.55 }, { n: 11, q: 127, s: 0.78 }, { n: 21, q: 433, s: 1.08 }, { n: 33, q: 1121, s: 1.5 }];

/** The die's face: dark silicon, cross-shaped qubits in a grid, meandering resonators, pads along the edges. */
function dieTexture(n: number, seed: number) {
  const N = 1024, cv = document.createElement('canvas'); cv.width = N; cv.height = N;
  const c = cv.getContext('2d')!;
  const g = c.createLinearGradient(0, 0, N, N);
  g.addColorStop(0, '#1B2230'); g.addColorStop(0.5, '#141A26'); g.addColorStop(1, '#202838');
  c.fillStyle = g; c.fillRect(0, 0, N, N);
  const rnd = mulberry32(seed), m = N * 0.1, pitch = (N - 2 * m) / n;
  // resonators: serpentines between the qubits
  c.strokeStyle = 'rgba(170,190,215,0.55)'; c.lineWidth = Math.max(1, pitch * 0.05);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    if (rnd() < 0.45) continue;
    const x = m + (i + 0.5) * pitch, y = m + (j + 0.5) * pitch, L = pitch * 0.42, k = 5;
    c.beginPath(); c.moveTo(x + pitch * 0.18, y);
    for (let s = 0; s <= k; s++) { const xx = x + pitch * 0.18 + (s / k) * L * 0.75; c.lineTo(xx, y + (s % 2 ? 1 : -1) * pitch * 0.1); }
    c.stroke();
  }
  // the qubits: a metal cross on each grid point
  c.fillStyle = 'rgba(200,215,235,0.85)';
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const x = m + (i + 0.5) * pitch, y = m + (j + 0.5) * pitch, a = pitch * 0.3, b = pitch * 0.07;
    c.fillRect(x - a, y - b, 2 * a, 2 * b); c.fillRect(x - b, y - a, 2 * b, 2 * a);
  }
  // pads around the edge
  c.fillStyle = '#C9A44E';
  const np = Math.max(8, n + 4);
  for (let k = 0; k < np; k++) {
    const u = m + ((k + 0.5) / np) * (N - 2 * m), w = (N - 2 * m) / np * 0.55;
    c.fillRect(u - w / 2, m * 0.25, w, m * 0.4); c.fillRect(u - w / 2, N - m * 0.65, w, m * 0.4);
    c.fillRect(m * 0.25, u - w / 2, m * 0.4, w); c.fillRect(N - m * 0.65, u - w / 2, m * 0.4, w);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

interface Chip { g: THREE.Group; n: number; q: number; s: number; dots: THREE.InstancedMesh; glowWires: THREE.InstancedMesh; nWires: number; x: number }

export default class HarvestRemixChip extends LibScene<P, C> {
  static schema = schema;
  private st = new Stage(30, 0.02, 100);
  private chips: Chip[] = [];
  private over = new Layer2D();
  private back!: ReturnType<typeof backdrop>;
  private motes!: ReturnType<typeof dust>;
  private key = new THREE.SpotLight(0xffffff, 0, 30, 0.7, 0.7, 1.2);
  private S = 0; private E = 0; private aAt = 1e9;
  private hats: number[] = []; private beats: number[] = [];
  private eta = 'near';
  private c = colors(this.ctx.style, 'frost');
  private get ph() { return this.P.phase; }

  override setup() {
    this.st.fit = fitOf(this.ctx.style);
    this.S = this.ctx.start; this.E = this.ctx.end;
    const cue = this.cues[0];
    this.aAt = cue?.at ?? this.E - 1;
    this.eta = cue ? this.cp(cue).eta : 'near';
    this.c = colors(this.ctx.style, cue?.def.palette ?? 'frost');
    const au = this.ctx.audio;
    this.hats = au.events('hat', this.S, this.E).map(([t]) => t);
    this.beats = au.beats.filter((b) => b > this.S - 0.01 && b < this.E);
    this.build();
  }

  private build() {
    if (this.ph === 'wafer') { this.buildWafer(); return; }
    const r = this.ctx.renderer, sc = this.st.scene, c = this.c, base = this.ph === 'base';
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFShadowMap;
    const keyC = base ? lin('#FFD49A') : lin('#CFE6FF');
    sc.environment = envProbe(r, lin(c.bg, 0.5), [
      { w: 12, h: 1.5, p: [-2, 7, 3], at: [0, 0, 0], c: keyC.clone().multiplyScalar(5) },
      { w: 8, h: 4, p: [6, 3, -4], at: [0, 0, 0], c: lin(base ? c.accent : c.deep, 1.4) },
      { w: 8, h: 4, p: [-6, 2, 5], at: [0, 0, 0], c: lin(base ? c.deep : c.ice, 0.7) },
    ]);
    this.back = backdrop();
    (this.back.u.uTop!.value as THREE.Color).copy(lin(c.bg, 1.2));
    (this.back.u.uBot!.value as THREE.Color).copy(lin(c.bg, 0.5));
    sc.add(this.back.mesh);

    // the bench (decade) or the cold plate the package sits on (base)
    const benchM = new THREE.MeshPhysicalMaterial({ color: base ? lin('#C8963C') : lin('#0E1626'), metalness: base ? 1 : 0.2, roughness: base ? 0.35 : 0.55, envMapIntensity: 0.8 });
    depthAlpha(benchM, {}, 'hr-chip-bench');
    const bench = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), benchM);
    bench.rotation.x = -Math.PI / 2; bench.receiveShadow = true;
    sc.add(bench);

    const gens = base ? [GENS[3]!] : GENS;
    let x = 0;
    const gold = new THREE.MeshPhysicalMaterial({ color: lin('#FFC86E'), metalness: 1, roughness: 0.25, envMapIntensity: 1.3 });
    depthAlpha(gold, {}, 'hr-chip-gold');
    const pcb = new THREE.MeshPhysicalMaterial({ color: lin(base ? '#D9A24A' : '#142030'), metalness: base ? 1 : 0.1, roughness: base ? 0.3 : 0.5, clearcoat: 0.6, envMapIntensity: 1 });
    depthAlpha(pcb, {}, 'hr-chip-pcb');
    gens.forEach((gen, gi) => {
      const g = new THREE.Group();
      const s = gen.s, pk = s * 1.7;
      // the package: a square board with a recess, the die in it
      let top: THREE.Material = pcb;
      if (!base) {
        // the board's top: a dark solder mask, gold traces fanning out from the die's edge to vias, fiducials, silkscreen
        const cv = document.createElement('canvas'); cv.width = cv.height = 2048;
        const c = cv.getContext('2d')!, rr = mulberry32(90 + gi);
        c.fillStyle = '#101A26'; c.fillRect(0, 0, 2048, 2048);
        const inner = 2048 / 1.7, i0 = (2048 - inner) / 2;
        c.strokeStyle = '#B8893A'; c.lineCap = 'round';
        for (let side = 0; side < 4; side++) for (let k = 0; k < 48; k++) {
          const u = i0 + (k + 0.5) * inner / 48, out = 40 + rr() * 260;
          c.save(); c.translate(1024, 1024); c.rotate(side * Math.PI / 2); c.translate(-1024, -1024);
          c.lineWidth = 3 + rr() * 3; c.beginPath(); c.moveTo(u, i0 - 4); c.lineTo(u, i0 - 30); c.lineTo(u + (u - 1024) * 0.25, i0 - 30 - out); c.stroke();
          c.fillStyle = '#C89A48'; c.beginPath(); c.arc(u + (u - 1024) * 0.25, i0 - 30 - out, 9, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#101A26'; c.beginPath(); c.arc(u + (u - 1024) * 0.25, i0 - 30 - out, 4, 0, Math.PI * 2); c.fill();
          c.restore();
        }
        c.fillStyle = '#C89A48';
        for (const [fx, fy] of [[90, 90], [1958, 90], [90, 1958]]) { c.beginPath(); c.arc(fx!, fy!, 22, 0, Math.PI * 2); c.fill(); }
        c.fillStyle = '#DCE3EA'; c.font = font(F.mono(500), 46); c.textAlign = 'left';
        c.fillText(`QX-${gen.n * gen.n} · REV B`, 140, 1990); c.fillText('CRYO-RATED · 10 mK', 1260, 1990);
        const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
        top = new THREE.MeshPhysicalMaterial({ map: tex, metalness: 0.2, roughness: 0.45, clearcoat: 0.8, clearcoatRoughness: 0.15, envMapIntensity: 1 });
        depthAlpha(top, {}, 'hr-chip-pcbtop');
      }
      const board = new THREE.Mesh(new THREE.BoxGeometry(pk, 0.06, pk), [pcb, pcb, top, pcb, pcb, pcb]);
      board.position.y = 0.03; board.castShadow = true; board.receiveShadow = true;
      g.add(board);
      const dieM = new THREE.MeshPhysicalMaterial({ map: dieTexture(gen.n, 31 + gi), metalness: 0.3, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.1, iridescence: 0.6, iridescenceIOR: 1.6 });
      depthAlpha(dieM, {}, 'hr-chip-die');
      const die = new THREE.Mesh(new THREE.BoxGeometry(s, 0.025, s), [pcb, pcb, dieM, pcb, pcb, pcb]);
      die.position.y = 0.0725; die.castShadow = true;
      g.add(die);
      // the qubits' light: a disc over each cross
      const n = gen.n, m = s * 0.1, pitch = (s - 2 * m) / n;
      const dm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.CustomBlending, depthWrite: false });
      dm.blendSrc = THREE.OneFactor; dm.blendDst = THREE.OneFactor; dm.blendSrcAlpha = THREE.ZeroFactor; dm.blendDstAlpha = THREE.OneFactor;
      const dots = new THREE.InstancedMesh(new THREE.CircleGeometry(pitch * 0.32, 20), dm, n * n);
      dots.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * n * 3), 3);
      const mm = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        mm.compose(new THREE.Vector3(-s / 2 + m + (i + 0.5) * pitch, 0.0862, -s / 2 + m + (j + 0.5) * pitch), q, new THREE.Vector3(1, 1, 1));
        dots.setMatrixAt(j * n + i, mm);
      }
      dots.renderOrder = 5;
      g.add(dots);
      // bond wires: arches from the die's pads to the board's, all round
      const arch = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.25, 0.6, 0), new THREE.Vector3(0.75, 0.55, 0), new THREE.Vector3(1, 0, 0)]);
      const wireGeo = new THREE.TubeGeometry(arch, 24, 0.012, 6);
      const np = Math.max(8, n + 4), nWires = np * 4;
      const wires = new THREE.InstancedMesh(wireGeo, gold, nWires);
      const gm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.CustomBlending, depthWrite: false });
      gm.blendSrc = THREE.OneFactor; gm.blendDst = THREE.OneFactor; gm.blendSrcAlpha = THREE.ZeroFactor; gm.blendDstAlpha = THREE.OneFactor;
      const glowWires = new THREE.InstancedMesh(new THREE.TubeGeometry(arch, 24, 0.02, 6), gm, nWires);
      glowWires.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(nWires * 3), 3);
      let k = 0;
      const len = (pk - s) / 2 * 0.8;
      for (let side = 0; side < 4; side++) for (let i = 0; i < np; i++) {
        const u = -s / 2 + m + ((i + 0.5) / np) * (s - 2 * m);
        const ang = side * Math.PI / 2;
        const from = new THREE.Vector3(s / 2 - m * 0.45, 0.085, u).applyAxisAngle(new THREE.Vector3(0, 1, 0), ang);
        mm.compose(from, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ang), new THREE.Vector3(len, len * 0.35, len));
        wires.setMatrixAt(k, mm); glowWires.setMatrixAt(k, mm); k++;
      }
      wires.castShadow = true;
      g.add(wires, glowWires);
      g.position.x = x + s * 0.85;
      x += pk + 0.45;
      sc.add(g);
      this.chips.push({ g, n, q: gen.q, s, dots, glowWires, nWires, x: g.position.x });
    });
    const mid = base ? this.chips[0]!.g.position.x : x / 2;
    for (const ch of this.chips) ch.g.position.x -= mid;
    for (const ch of this.chips) ch.x = ch.g.position.x;

    this.key.color.copy(keyC);
    this.key.position.set(-2, 6, 4);
    this.key.castShadow = true; this.key.shadow.mapSize.set(2048, 2048); this.key.shadow.radius = 3; this.key.shadow.bias = -0.0004;
    sc.add(this.key, this.key.target);
    sc.add(new THREE.HemisphereLight(keyC, lin(c.bg), 0.25));
    this.motes = dust(500, [8, 3, 5], 23);
    (this.motes.u.uCol!.value as THREE.Color).copy(base ? lin(c.accent, 1.2) : lin(c.ice, 1.1));
    this.motes.u.uSize!.value = 5;
    this.motes.pts.position.y = 1.2;
    sc.add(this.motes.pts);
  }

  /** When chip i lights (decade: as the camera arrives at it). */
  private litAt(i: number) {
    const S = this.S, span = Math.min(this.aAt, this.E - 0.6) - S;
    return S + 0.15 + (i / Math.max(1, this.chips.length - 1)) * span * 0.85;
  }

  private cam(t: number) {
    const S = this.S, E = this.E;
    if (this.ph === 'base') {
      return camKeys(t, [
        { t: S, c: [0.9, 1.5, 2.2], g: [0, 0.05, 0], fov: 30, ap: 26 },
        { t: this.aAt, c: [0.45, 1.05, 1.45], g: [0, 0.08, 0], fov: 30, ap: 30, e: ease.inOutQuad },
        { t: E + 0.3, c: [0.35, 0.95, 1.3], g: [0, 0.08, 0], fov: 30, ap: 30, e: ease.linear },
      ]);
    }
    const ks: CamKey[] = this.chips.map((ch, i) => ({ t: this.litAt(i) - 0.15, c: [ch.x - 0.15, 0.55 + ch.s * 0.7, 1.15 + ch.s * 0.9] as V3, g: [ch.x + 0.1, 0.05, 0] as V3, fov: 30, ap: 30 }));
    ks.unshift({ t: S - 0.3, c: [this.chips[0]!.x - 0.6, 0.6, 1.4], g: [this.chips[0]!.x, 0.05, 0], fov: 30, ap: 30 });
    ks.push({ t: E + 0.3, c: [this.chips.at(-1)!.x + 0.05, 0.55 + 1.05, 1.15 + 1.35], g: [this.chips.at(-1)!.x + 0.2, 0.05, 0], fov: 30, ap: 30, e: ease.linear });
    return camKeys(t, ks);
  }

  override draw() {}

  override render(f: Frame, out: THREE.WebGLRenderTarget) {
    if (this.ph === 'wafer') return this.renderWafer(f, out);
    const t = f.t, r = this.ctx.renderer, base = this.ph === 'base', c = this.c, a = f.a;
    const cm = this.cam(t);
    const focus = this.st.look(cm.c, cm.g, cm.fov);
    const qc = hexToLinear(base ? c.accent : c.ice);
    const col = new THREE.Color();
    this.chips.forEach((ch, i) => {
      const n = ch.n;
      // which qubits are lit: decade, rows sweeping on as the chip lights; base, row by row on the beats to all
      let rows: number;
      if (base) {
        const nb = this.beats.filter((b) => b <= t).length, total = Math.max(1, this.beats.filter((b) => b < this.aAt).length);
        rows = t >= this.aAt ? n : Math.floor((nb / total) * n * 0.9);
      } else rows = n * ease.outCubic(prog(t, this.litAt(i), this.litAt(i) + 0.5));
      const flare = base ? 1 + 1.8 * hit(t, this.aAt, 0.3) + (t >= this.aAt ? 0.25 : 0) : 1 + 1.5 * hit(t, this.litAt(i), 0.25);
      for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) {
        const on = j < rows ? 1 : j < rows + 1 ? rows - j : 0;
        const tw = 0.8 + 0.2 * Math.sin(t * 3 + (j * 13 + k * 7));
        const v = on * tw * flare * 3.2;
        col.setRGB(qc[0] * v + 0.01, qc[1] * v + 0.01, qc[2] * v + 0.012);
        ch.dots.setColorAt(j * n + k, col);
      }
      ch.dots.instanceColor!.needsUpdate = true;
      // light running down the bond wires (base, from the anchor)
      const run = base && t >= this.aAt ? (t - this.aAt) * 1.6 : -1;
      for (let w = 0; w < ch.nWires; w++) {
        const ph = ((w * 0.37) % 1);
        const v = run >= 0 ? 2.5 * Math.exp(-Math.pow(((run + ph) % 1) - 0.5, 2) / 0.02) : 0;
        col.setRGB(qc[0] * v, qc[1] * v, qc[2] * v);
        ch.glowWires.setColorAt(w, col);
      }
      ch.glowWires.instanceColor!.needsUpdate = true;
    });
    this.key.intensity = base ? 60 : 45;
    this.key.target.position.set(cm.g[0], 0, cm.g[2]);
    this.motes.u.uTime!.value = t;
    this.motes.pts.position.x = cm.g[0];
    this.back.u.uTime!.value = t;

    this.st.time = t;
    this.st.beams = [{ p: [this.key.position.x + cm.g[0], this.key.position.y, this.key.position.z], d: [2, -6, -4], angle: 0.3, color: lin(base ? '#FFD49A' : '#CFE6FF', 0.35), range: 10 }];
    this.st.fog = { density: 0.05, noise: 0.45, haze: 0, maxDist: 12 };
    this.st.render(r, out, {
      focus, ap: cm.ap, clear: [0, 0, 0],
      lens: base ? 0.2 : 0.08, lensCol: lin(c.accent2, 0.5),
    });

    // labels: each chip's qubit count (decade), the Q-day ETA readout
    this.over.clear();
    const o = this.over.ctx, mono = this.font('mono');
    if (!base) {
      for (const [i, ch] of this.chips.entries()) {
        const p = this.st.uv([ch.x, 0.0, ch.s * 0.85 + 0.15]);
        const al = prog(t, this.litAt(i), this.litAt(i) + 0.3);
        if (al <= 0 || p[0] < -0.1 || p[0] > 1.1) continue;
        o.globalAlpha = al;
        label(o, `${ch.q.toLocaleString('en-US')} qubits`, p[0] * W, (1 - p[1]) * H + 10, mono, c.type, 24, 'center');
      }
      o.globalAlpha = 1;
      // the ETA: years counting down on the hats, snapping on the anchor
      const hatsDone = this.hats.filter((h) => h <= t && h < this.aAt).length, nh = Math.max(1, this.hats.filter((h) => h < this.aAt).length);
      const yrs = Math.max(1, 10 - Math.floor((hatsDone / nh) * 9));
      const txt = t >= this.aAt ? this.eta : `${yrs} yr`;
      const x = W - 130, y = 200, fl = hit(t, this.aAt, 0.18);
      label(o, 'Q-day ETA', x, y, mono, c.dim, 22, 'right');
      o.font = font(this.font('display'), 92); o.textAlign = 'right'; o.textBaseline = 'alphabetic';
      o.fillStyle = t >= this.aAt ? c.accent : c.type;
      o.fillText(txt, x, y + 96);
      if (fl > 0.01) { o.globalAlpha = fl; o.fillStyle = '#ffffff'; o.fillText(txt, x, y + 96); o.globalAlpha = 1; }
    } else {
      const x = W - 130, y = 200;
      label(o, 'MXC · 10 mK', x, y, mono, c.dim, 22, 'right');
      o.font = font(this.font('display'), 92); o.textAlign = 'right';
      o.fillStyle = c.accent; o.fillText('1,121', x, y + 96);
      label(o, t >= this.aAt ? 'qubits · all lit' : 'qubits', x, y + 140, mono, c.type, 22, 'right');
    }
    this.ctx.comp.draw(r, this.over.upload(), out, { mode: 'normal' });

    return {
      bloom: 0.7, bloomThreshold: 0.9, bloomRadius: 0.55, halation: base ? 0.12 : 0.04, ca: 0.22, grain: 0.016, vignette: 0.45, hud: 0,
      gain: (base ? [1.06, 1.0, 0.9] : [0.94, 1.0, 1.08]) as [number, number, number], lift: (base ? [0.006, 0.003, 0] : [0, 0.004, 0.012]) as [number, number, number], sat: 1.1,
      shake: [hit(t, this.aAt, 0.08) * 4, hit(t, this.aAt, 0.08) * 5] as [number, number],
      exposure: clamp(1 + 0.15 * a.rms, 0, 2),
    };
  }
  // ------------------------------------------------------------------ the wafer
  private wafer!: { dots: THREE.InstancedMesh; order: number[]; n: number };

  /** A 300 mm wafer: a grid of dies (each a tiny qubit array) on iridescent silicon, under the cleanroom's yellow light. */
  private buildWafer() {
    const r = this.ctx.renderer, sc = this.st.scene;
    const yellow = lin('#FFD86A');
    sc.environment = envProbe(r, lin('#1A1608'), [
      { w: 14, h: 2, p: [0, 6, -2], at: [0, 0, 0], c: yellow.clone().multiplyScalar(4) },
      { w: 6, h: 6, p: [-6, 2, 4], at: [0, 0, 0], c: lin('#7FE3FF', 0.8) },
      { w: 10, h: 3, p: [6, 3, 4], at: [0, 0, 0], c: lin('#FF9AD0', 0.6) },
    ]);
    this.back = backdrop();
    (this.back.u.uTop!.value as THREE.Color).copy(lin('#2A220C', 0.6));
    (this.back.u.uBot!.value as THREE.Color).copy(lin('#0A0804', 0.6));
    sc.add(this.back.mesh);
    const N = 22, R = 1.5, pitch = (2 * R) / N;
    const cv = document.createElement('canvas'); cv.width = 2048; cv.height = 2048;
    const g = cv.getContext('2d')!;
    g.fillStyle = '#4A5468'; g.fillRect(0, 0, 2048, 2048);
    const px = 2048 / N;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = i * px, y = j * px;
      g.fillStyle = '#2A3040'; g.fillRect(x + 3, y + 3, px - 6, px - 6);
      g.fillStyle = 'rgba(200,215,235,0.75)';
      for (let b = 0; b < 6; b++) for (let a = 0; a < 6; a++) { const cx = x + px * (0.2 + a * 0.12), cy = y + px * (0.2 + b * 0.12); g.fillRect(cx - 3, cy - 0.8, 6, 1.6); g.fillRect(cx - 0.8, cy - 3, 1.6, 6); }
      g.fillStyle = '#C9A44E'; for (let k = 0; k < 8; k++) { g.fillRect(x + px * (0.12 + k * 0.1), y + px * 0.06, px * 0.05, px * 0.04); g.fillRect(x + px * (0.12 + k * 0.1), y + px * 0.9, px * 0.05, px * 0.04); }
    }
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const wm = new THREE.MeshPhysicalMaterial({ map: tex, metalness: 0.5, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05, iridescence: 1, iridescenceIOR: 1.8, iridescenceThicknessRange: [200, 600], envMapIntensity: 1.4 });
    depthAlpha(wm, {}, 'hr-chip-wafer');
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.012, 160), [new THREE.MeshPhysicalMaterial({ color: lin('#8A90A0'), metalness: 0.8, roughness: 0.3 }), wm, wm]);
    for (const m of disc.material as THREE.Material[]) depthAlpha(m, {}, 'hr-chip-wafer2');
    // the top cap's uvs: planar
    const uv = disc.geometry.getAttribute('uv'), pos = disc.geometry.getAttribute('position');
    for (let i = 0; i < uv.count; i++) if (Math.abs(pos.getY(i)) > 0.005) uv.setXY(i, pos.getX(i) / (2 * R) + 0.5, 0.5 - pos.getZ(i) / (2 * R));
    sc.add(disc);
    // a lit qubit glow over each whole die on the wafer
    const qv = document.createElement('canvas'); qv.width = 128; qv.height = 128;
    const qg = qv.getContext('2d')!;
    qg.fillStyle = '#000'; qg.fillRect(0, 0, 128, 128); qg.fillStyle = '#fff';
    for (let b = 0; b < 6; b++) for (let a = 0; a < 6; a++) { const cx = 128 * (0.2 + a * 0.12), cy = 128 * (0.2 + b * 0.12); qg.beginPath(); qg.arc(cx, cy, 3.2, 0, Math.PI * 2); qg.fill(); }
    const qt = new THREE.CanvasTexture(qv); qt.colorSpace = THREE.NoColorSpace;
    const dm = new THREE.MeshBasicMaterial({ color: 0xffffff, map: qt, transparent: true, blending: THREE.CustomBlending, depthWrite: false });
    dm.blendSrc = THREE.OneFactor; dm.blendDst = THREE.OneFactor; dm.blendSrcAlpha = THREE.ZeroFactor; dm.blendDstAlpha = THREE.OneFactor;
    const cells: [number, number][] = [];
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = -R + (i + 0.5) * pitch, z = -R + (j + 0.5) * pitch;
      if (Math.hypot(x, z) < R - pitch * 0.7) cells.push([x, z]);
    }
    const dots = new THREE.InstancedMesh(new THREE.PlaneGeometry(pitch, pitch).rotateX(-Math.PI / 2), dm, cells.length);
    dots.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cells.length * 3), 3);
    const m = new THREE.Matrix4();
    cells.forEach(([x, z], k) => { m.makeTranslation(x, 0.008, z); dots.setMatrixAt(k, m); });
    sc.add(dots);
    // light order: a sweep across the wafer from the near edge
    const order = cells.map(([x, z]) => (z + R) / (2 * R) * 0.75 + (x + R) / (2 * R) * 0.25 + 0.05 * hash01(x, z));
    this.wafer = { dots, order, n: cells.length };
    const key = new THREE.SpotLight(yellow, 30, 20, 0.6, 0.8, 1.2); key.position.set(-1, 4, -2); key.target.position.set(0, 0, 0); sc.add(key, key.target);
    sc.add(new THREE.HemisphereLight(yellow, lin('#0A0804'), 0.3));
    this.motes = dust(400, [4, 2, 4], 31);
    (this.motes.u.uCol!.value as THREE.Color).copy(yellow.clone().multiplyScalar(0.8));
    this.motes.u.uSize!.value = 4;
    this.motes.pts.position.y = 0.8;
    sc.add(this.motes.pts);
  }

  private renderWafer(f: Frame, out: THREE.WebGLRenderTarget) {
    const t = f.t, r = this.ctx.renderer, S = this.S, E = this.E;
    const cm = camKeys(t, [
      { t: S, c: [-1.9, 0.55, 1.6], g: [0.2, 0, -0.2], fov: 30, ap: 26 },
      { t: E + 0.3, c: [-1.4, 0.45, 1.25], g: [0.3, 0, -0.3], fov: 30, ap: 28, e: ease.linear },
    ]);
    const focus = this.st.look(cm.c, cm.g, cm.fov);
    const w = this.wafer, ice = hexToLinear(this.c.ice), col = new THREE.Color();
    const sweep = prog(t, S + 0.1, E - 0.2) * 1.15;
    for (let k = 0; k < w.n; k++) {
      const d = sweep - w.order[k]!;
      const v = d < 0 ? 0 : 3.5 + 6 * Math.exp(-d / 0.04);
      col.setRGB(ice[0] * v, ice[1] * v, ice[2] * v);
      w.dots.setColorAt(k, col);
    }
    w.dots.instanceColor!.needsUpdate = true;
    this.motes.u.uTime!.value = t;
    this.back.u.uTime!.value = t;
    this.st.time = t;
    this.st.beams = [{ p: [-1, 4, -2], d: [1, -4, 2], angle: 0.35, color: lin('#FFD86A', 0.6), range: 8 }];
    this.st.fog = { density: 0.04, noise: 0.5, haze: 0, maxDist: 10 };
    this.st.render(r, out, { focus, ap: cm.ap, clear: [0, 0, 0] });
    return {
      bloom: 0.7, bloomThreshold: 0.85, bloomRadius: 0.6, halation: 0.04, ca: 0.15, grain: 0.016, vignette: 0.5, hud: 0,
      gain: [1.04, 1.0, 0.92] as [number, number, number], lift: [0.004, 0.003, 0] as [number, number, number], sat: 1.12,
    };
  }
}

function hash01(x: number, z: number) { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }

void lerp;
