// Harvest Now, Decrypt Later (Banger Remix): the padlock. One glass padlock in three.js, the video's recurring
// motif, lit from inside. Phases (entry `phase`):
// - `open` (intro): the plant. A green glass padlock hanging in the ink-blue dark, a shaft of cold light from
//   above left with ice dust in it; frost grows in on the lens a step per downbeat; on the cue's anchor the lock's
//   light breathes up and a ring of green light runs off it.
// - `macro` (verse 1, "padlock"): the padlock set in the red wax seal on the Tuesday envelope, extreme close-up,
//   shallow focus. It is dark and its shackle stands up; on the anchor the shackle drops home (click) and the
//   glass lights green, a ring of green light running out across the wax. With a `tooltip`, it opens under the
//   lock on the line's word "said"; on "done" the camera whips aside and the letter is gone, sent.
// - `crack` (chorus 2, "decrypt"): a frosted padlock in gold light, gold lamps out of focus behind; frost thickens
//   across it; on the anchor a crack runs through its body with a bright tick of gold light from inside.
// - `unlock` (final chorus, "So that's what you were on about"): the frosted padlock set in frosted red wax on the
//   face of the copy's slab of ice; the gold key slides into the keyhole and turns on "what", the frost on the lock
//   clears and its shackle springs; on the next downbeat (the hit) the slab cleaves in two, gold light pouring out of
//   the split, shards and frost dust thrown off. The keyhole stays centred for the match cut to the wax seal.
// - `secure` (outro): the green padlock again, clean lens; on the anchor it clicks and a small browser tooltip
//   "Connection secure" opens under it; then one last thread of frost reaches in from the lower-left corner.
import * as THREE from 'three';
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import { Layer2D } from '../engine/gl';
import { LineBatch } from '../engine/lines';
import { clamp, ease, hexToLinear, lerp, mulberry32, prog, smoothstep } from '../engine/util';
import { font, measure } from '../engine/type';
import { LibScene, W, H, hit } from './_lib';
import { Stage, backdrop, camKeys, colors, depthAlpha, dust, envProbe, envelopeTexture, goldKey, iceMaterial, iceSlab, lin, padlock, paperMaterial, type CamKey, type Padlock, fitOf } from './harvest-remix-kit';

export const schema: SceneSchema = {
  description: 'A glass padlock in three.js, lit from inside: open (intro, green, frost growing on the lens), macro (set in the red wax seal, it clicks shut and lights green on the anchor), crack (frosted, in gold light, a crack runs through it on the anchor), secure (outro: clicks, a "Connection secure" tooltip, a last thread of frost). Harvest remix.',
  kinds: ['song'],
  lyrics: 'layer',
  entry: {
    phase: { type: 'string', enum: ['open', 'macro', 'crack', 'unlock', 'secure'], default: 'open', description: 'which shot of the padlock (unlock: the gold key turns in the frosted lock and the shackle springs)' },
  },
  cue: {
    tooltip: { type: 'string', default: '', description: 'the browser tooltip that opens under the lock (secure: on the anchor; macro: on the word "said")' },
  },
  example: { entry: { phase: 'open' }, cues: [{}] },
};

type Phase = 'open' | 'macro' | 'crack' | 'unlock' | 'secure';
interface P { phase: Phase }
interface C { tooltip: string }

const BW = 1; // the lock's body width (world units)

export default class HarvestRemixPadlock extends LibScene<P, C> {
  static schema = schema;
  private st = new Stage(30, 0.02, 200);
  private lock!: Padlock;
  private core!: THREE.Mesh;
  private glassU!: Record<string, THREE.IUniform>;
  private coreMat!: THREE.MeshBasicMaterial;
  private glow = new THREE.PointLight(0x39e07a, 0, 6, 1.6);
  private key = new THREE.DirectionalLight(0xffffff, 1);
  private fill = new THREE.DirectionalLight(0xffffff, 0.4);
  private back!: ReturnType<typeof backdrop>;
  private motes!: ReturnType<typeof dust>;
  private ring!: THREE.Mesh;
  private ringMat!: THREE.MeshBasicMaterial;
  private bokeh: THREE.Mesh[] = [];
  private crack = new LineBatch(400, { screen2D: false, worldWidth: true, blend: 'add', depthTest: true });
  private crackPts: { a: THREE.Vector3; b: THREE.Vector3; s0: number; s1: number }[] = [];
  private crackLen = 1;
  private thread: { ax: number; ay: number; bx: number; by: number; s: number; w: number }[] = [];
  private over = new Layer2D();
  private keyG = new THREE.Group();

  private S = 0; private E = 0;
  private aAt = 1e9; // the cue's anchor
  private tipAt = 1e9; private goneAt = 1e9; // macro: the tooltip opens ("said"); the letter leaves ("done")
  private tWhat = 1e9; private tCleave = 1e9; // unlock: the key turns ("what"); the slab cleaves (the hit)
  private halves: THREE.Group[] = []; private shards!: THREE.InstancedMesh; private shardV: THREE.Vector3[] = [];
  private split = new THREE.PointLight(0xffc070, 0, 6, 1.5);
  private downbeats: number[] = [];
  private tip = '';
  private c = colors(this.ctx.style, 'frost');

  private get ph() { return this.P.phase; }

  override setup() {
    this.st.fit = fitOf(this.ctx.style);
    const S = this.ctx.start, E = this.ctx.end, au = this.ctx.audio;
    this.S = S; this.E = E;
    this.aAt = this.cues[0]?.at ?? S + 1;
    this.downbeats = au.downbeats.filter((d) => d > S - 0.01 && d < E);
    const tc = this.cues.find((c) => this.cp(c).tooltip);
    this.tip = (tc && this.cp(tc).tooltip) || (this.ph === 'secure' ? 'Connection secure' : '');
    const words = this.cues[0]?.line?.words ?? [];
    const word = (w: string) => words.find((x) => x.w.toLowerCase().replace(/[^a-z]/g, '') === w)?.start;
    this.tipAt = this.ph === 'macro' ? word('said') ?? 1e9 : this.aAt + 0.05;
    if (this.ph === 'macro') this.goneAt = word('done') ?? 1e9;
    if (this.ph === 'unlock') {
      this.tWhat = word('what') ?? S + 0.8;
      this.tCleave = au.downbeats.find((d) => d > this.tWhat + 0.45) ?? this.tWhat + 1;
    }
    this.c = colors(this.ctx.style, this.ph === 'unlock' ? 'amber' : this.cues[0]?.def.palette ?? 'frost');
    this.build();
  }

  private build() {
    const r = this.ctx.renderer, c = this.c, sc = this.st.scene, ph = this.ph, gold = ph === 'crack' || ph === 'unlock';
    const warm = gold;
    const keyC = warm ? new THREE.Color(1.0, 0.8, 0.55) : new THREE.Color(0.75, 0.88, 1.0);
    sc.environment = envProbe(r, lin(c.bg, 0.6), [
      { w: 10, h: 1.2, p: [-3, 7, 2], at: [0, 0, 0], c: keyC.clone().multiplyScalar(6) },
      { w: 3, h: 8, p: [7, 1, 3], at: [0, 0, 0], c: keyC.clone().multiplyScalar(1.4) },
      { w: 14, h: 4, p: [0, 2, -9], at: [0, 0, 0], c: lin(warm ? c.accent : c.deep, warm ? 1.4 : 0.7) },
      { w: 6, h: 3, p: [-6, -3, 5], at: [0, 0, 0], c: lin(warm ? c.accent : c.ice, 0.5) },
    ]);
    this.back = backdrop();
    sc.add(this.back.mesh);
    const bu = this.back.u;
    (bu.uTop!.value as THREE.Color).copy(lin(c.bg, warm ? 1.4 : 1.6));
    (bu.uBot!.value as THREE.Color).copy(lin(c.bg, 0.6));

    // the padlock: green glass (frosted for the crack), a chrome shackle, a glowing core visible through the glass
    const frosted = gold;
    const green = lin(c.green);
    const glass = new THREE.MeshPhysicalMaterial({
      color: frosted ? lin('#DCEFFF') : new THREE.Color(0.85, 1, 0.9), metalness: 0, roughness: frosted ? 0.5 : 0.05,
      transmission: 1, thickness: 0.7, ior: 1.5, attenuationColor: frosted ? lin('#BFE6FF') : green, attenuationDistance: frosted ? 1.2 : 0.55,
      clearcoat: 1, clearcoatRoughness: frosted ? 0.35 : 0.03, envMapIntensity: 1.3, specularIntensity: 1,
    });
    this.glassU = depthAlpha(glass, { uRimCol: { value: frosted ? lin(c.accent2) : green.clone() } }, 'hr-pad-glass');
    const chrome = new THREE.MeshPhysicalMaterial({ color: frosted ? lin('#E8EEF2') : 0xdfe6ea, metalness: 1, roughness: frosted ? 0.4 : 0.12, envMapIntensity: 1.4 });
    depthAlpha(chrome, {}, 'hr-pad-chrome');
    const hole = new THREE.MeshBasicMaterial({ color: frosted ? lin(c.bg, 0.5) : green.clone().multiplyScalar(4) });
    depthAlpha(hole, {}, 'hr-pad-hole', false);
    this.lock = padlock(BW, glass, chrome, hole);
    sc.add(this.lock.g);
    this.coreMat = new THREE.MeshBasicMaterial({ color: green.clone() });
    depthAlpha(this.coreMat, {}, 'hr-pad-core', false);
    this.core = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 16), this.coreMat);
    this.core.scale.set(BW * 0.5, this.lock.h * 0.42, BW * 0.14);
    this.lock.g.add(this.core);
    this.glow.color.copy(green);
    this.lock.g.add(this.glow);
    this.glow.position.set(0, 0, 0.5);

    this.key.position.set(-3, 6, 4); this.fill.position.set(4, 1, 3);
    this.key.color.copy(keyC); this.fill.color.copy(keyC);
    sc.add(this.key, this.fill);

    // the ring of light that runs off the lock on the click
    this.ringMat = new THREE.MeshBasicMaterial({ color: green.clone(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this.ringMat.blendSrcAlpha = THREE.ZeroFactor; this.ringMat.blendDstAlpha = THREE.OneFactor;
    this.ringMat.blending = THREE.CustomBlending; this.ringMat.blendSrc = THREE.OneFactor; this.ringMat.blendDst = THREE.OneFactor;
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.96, 1, 128), this.ringMat);
    this.ring.renderOrder = 20;
    sc.add(this.ring);

    if (ph === 'macro') {
      // the red wax seal behind the lock, and the envelope's paper behind that
      const wax = new THREE.MeshPhysicalMaterial({ side: THREE.DoubleSide, color: lin(c.wax), roughness: 0.28, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.12, sheen: 0.3, sheenColor: lin('#FF6A6A') });
      depthAlpha(wax, {}, 'hr-pad-wax');
      const pts: THREE.Vector2[] = [];
      const rnd = mulberry32(9);
      const R = 1.55;
      for (let i = 0; i <= 24; i++) {
        const u = i / 24;
        const rr = u < 0.75 ? R * (u / 0.75) : R + 0.08 * Math.sin((u - 0.75) / 0.25 * Math.PI);
        pts.push(new THREE.Vector2(Math.max(1e-3, rr), 0.12 * Math.sqrt(Math.max(0, 1 - Math.pow(u, 6))) + 0.02 * rnd()));
      }
      const disc = new THREE.Mesh(new THREE.LatheGeometry(pts, 96), wax);
      disc.rotation.x = Math.PI / 2;
      disc.position.z = -0.32;
      // a wobbly rim: squash the lathe a little out of round
      const p = disc.geometry.getAttribute('position');
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), k = 1 + 0.05 * Math.sin(a * 5 + 1) + 0.03 * Math.sin(a * 11);
        p.setX(i, x * k); p.setZ(i, z * k);
      }
      disc.geometry.computeVertexNormals();
      sc.add(disc);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.07, 24, 160), wax);
      rim.position.z = -0.2;
      rim.scale.z = 0.6;
      sc.add(rim);
      const paper = paperMaterial(envelopeTexture('TUE 2021-03-09', { seed: 3 }));
      depthAlpha(paper, {}, 'hr-pad-paper');
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(16, 8), paper);
      sheet.position.set(1.2, 1.4, -0.36);
      sc.add(sheet);
      this.ring.position.z = -0.17;
    }

    if (gold) {
      // gold archive lamps far behind, out of focus
      const rnd = mulberry32(31);
      for (let i = 0; i < 40; i++) {
        const m = new THREE.MeshBasicMaterial({ color: lin(c.accent, 3 + 4 * rnd()) });
        depthAlpha(m, {}, 'hr-pad-bokeh', false);
        const s = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), m);
        s.position.set((rnd() - 0.5) * 14, (rnd() - 0.5) * 7, -6 - rnd() * 6);
        sc.add(s); this.bokeh.push(s);
      }
      // the crack: a random walk across the body's face, with two short branches
      const z = 0.36 * BW / 2 + 0.004, rw = mulberry32(23);
      const main: THREE.Vector3[] = [];
      let y = -0.05;
      for (let i = 0; i <= 30; i++) {
        const x = lerp(-0.47, 0.47, i / 30 + (i && i < 30 ? (rw() - 0.5) * 0.02 : 0)) * BW;
        if (i) y += (rw() - 0.5) * (rw() < 0.25 ? 0.16 : 0.05) - 0.003;
        main.push(new THREE.Vector3(x, clamp(y, -0.33, 0.25), z));
      }
      let s = 0;
      const push = (pts: THREE.Vector3[], s0: number) => {
        let ss = s0;
        for (let i = 1; i < pts.length; i++) {
          const L = pts[i]!.distanceTo(pts[i - 1]!);
          this.crackPts.push({ a: pts[i - 1]!, b: pts[i]!, s0: ss, s1: ss + L });
          ss += L;
        }
        return ss;
      };
      s = push(main, 0);
      this.crackLen = s;
      for (const [k, dir] of [[8, 1], [19, -1], [25, 1]] as [number, number][]) {
        const b0 = main[k]!, br = [b0.clone()];
        let bx = b0.x, by = b0.y;
        for (let i = 0; i < 4; i++) { bx += 0.03 + rw() * 0.03; by += dir * (0.04 + rw() * 0.04); br.push(new THREE.Vector3(bx, by, z)); }
        const s0 = this.crackPts.find((q) => q.a === b0)?.s0 ?? 0;
        push(br, s0);
      }
      const cm = this.crack.mat;
      cm.blendSrcAlpha = THREE.ZeroFactor; cm.blendDstAlpha = THREE.OneFactor;
    }

    // the key (unlock): the turned gold key, its shaft into the keyhole, turned about the lock's axis; behind the lock
    // the copy's slab of ice (two halves meeting on a fracture) with the frosted wax of the seal on its face
    if (ph === 'unlock') {
      const goldM = new THREE.MeshPhysicalMaterial({ color: lin('#FFC86E'), metalness: 1, roughness: 0.16, envMapIntensity: 2.0, clearcoat: 0.6 });
      depthAlpha(goldM, { uRimCol: { value: lin(c.accent) }, uRim: { value: 0.6 } }, 'hr-pad-key');
      const inner = goldKey(goldM);
      inner.rotation.x = Math.PI / 2; // the shaft (−y) points into the lock (−z)
      inner.scale.setScalar(0.9);
      this.keyG.add(inner);
      this.keyG.position.set(0, 0.04, 0.6);
      this.lock.g.add(this.keyG);
      const ice = iceMaterial('hr-pad-slab', { rough: 0.1, atten: 1.6, rim: 0.7 });
      for (const side of [-1, 1]) {
        const h = iceSlab(1.7, 2.6, 0.9, side > 0 ? 3 : 8, ice.m);
        h.g.position.set(side * 0.86, -0.1, -0.68);
        const hg = new THREE.Group(); hg.add(h.g);
        sc.add(hg); this.halves.push(hg);
      }
      const wax = new THREE.MeshPhysicalMaterial({ color: lin('#6E1424'), roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.35, sheen: 0.6, sheenColor: lin('#CFE8FF') });
      depthAlpha(wax, {}, 'hr-pad-fwax');
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.82, 0.08, 96), wax);
      disc.rotation.x = Math.PI / 2; disc.position.z = -0.2;
      this.halves[0]!.add(disc); // the seal goes with the left half when it splits
      const shardM = new THREE.MeshPhysicalMaterial({ color: lin('#DFF2FF'), roughness: 0.08, metalness: 0, envMapIntensity: 2.2, emissive: lin(c.ice), emissiveIntensity: 0.12, clearcoat: 1 });
      depthAlpha(shardM, {}, 'hr-pad-shard');
      this.shards = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(0.026, 0), shardM, 60);
      const rs = mulberry32(77);
      for (let i = 0; i < 60; i++) this.shardV.push(new THREE.Vector3((rs() - 0.5) * 3, rs() * 2.4 - 0.6, 0.3 + rs() * 1.6));
      this.shards.visible = false;
      sc.add(this.shards);
      this.split.position.set(0, 0, -0.6);
      sc.add(this.split);
    }

    // ice dust in the light around the lock
    this.motes = dust(ph === 'macro' ? 260 : 700, ph === 'macro' ? [5, 3.5, 2.5] : [9, 6, 6], 41);
    (this.motes.u.uCol!.value as THREE.Color).copy(warm ? lin(c.accent, 1.6) : lin(c.ice, 1.4));
    this.motes.u.uSize!.value = ph === 'macro' ? 5 : 9;
    sc.add(this.motes.pts);

    // the last thread of frost (secure): a dendrite from the lower-left corner, drawn as it grows
    if (ph === 'secure') {
      const rnd = mulberry32(2026);
      const growTo = (x: number, y: number, a: number, len: number, lvl: number, s0: number, w: number) => {
        let s = s0, alt = 1, next = 10 + rnd() * 10;
        const n = Math.round(len / 4);
        for (let i = 0; i < n; i++) {
          a += (rnd() - 0.5) * 0.12;
          const nx = x + Math.cos(a) * 4, ny = y + Math.sin(a) * 4;
          this.thread.push({ ax: x, ay: y, bx: nx, by: ny, s, w });
          x = nx; y = ny; s += 4;
          if (lvl > 0 && i * 4 > next) { next += 8 + rnd() * 14; growTo(x, y, a + alt * (0.8 + rnd() * 0.4), (len - i * 4) * 0.35, lvl - 1, s, w * 0.7); alt = -alt; }
        }
      };
      growTo(-4, H + 4, -0.62, 520, 2, 0, 1.6);
    }
  }

  // ------------------------------------------------------------------ timing

  /** 0 → 1: the lock lit (macro: from the click on; otherwise always). */
  private lit(t: number) {
    if (this.ph === 'macro') return smoothstep(this.aAt - 0.02, this.aAt + 0.12, t);
    if (this.ph === 'crack' || this.ph === 'unlock') return 0;
    return smoothstep(this.S - 0.1, this.S + 0.6, t);
  }

  private cam(t: number) {
    const S = this.S, E = this.E, a = this.aAt;
    const ks: CamKey[] = this.ph === 'macro'
      ? [
          { t: S, c: [-1.1, -0.9, 3.6], g: [0.15, -0.05, 0], fov: 30, ap: 26 },
          { t: a, c: [-0.45, -0.55, 2.85], g: [0.05, -0.02, 0], fov: 30, ap: 30, e: ease.inOutQuad },
          { t: E + 0.3, c: [-0.2, -0.4, 2.6], g: [0.0, 0.0, 0], fov: 30, ap: 32, e: ease.linear },
        ]
      : this.ph === 'unlock'
        ? [
            { t: S, c: [1.45, 0.4, 2.0], g: [0.05, 0.0, 0.25], fov: 30, ap: 22 },
            { t: this.tWhat + 0.2, c: [1.15, 0.3, 2.15], g: [0.03, 0.0, 0.22], fov: 30, ap: 24, e: ease.inOutQuad },
            { t: this.tCleave, c: [0.35, 0.1, 2.5], g: [0, -0.02, 0.18], fov: 30, ap: 22, e: ease.inOutCubic },
            { t: E + 0.3, c: [0.0, 0.0, 1.7], g: [0, -0.02, 0.18], fov: 30, ap: 24, e: ease.outCubic },
          ]
      : this.ph === 'crack'
        ? [
            { t: S, c: [0.5, 0.3, 2.9], g: [0, 0.12, 0], fov: 30, ap: 30 },
            { t: a, c: [0.15, 0.18, 2.2], g: [0, 0.05, 0], fov: 30, ap: 34, e: ease.inOutQuad },
            { t: E + 0.3, c: [0.05, 0.12, 2.0], g: [0, 0.03, 0], fov: 30, ap: 34, e: ease.linear },
          ]
        : [
            { t: S, c: [-1.3, 0.1, 4.0], g: [0, -0.12, 0], fov: 30, ap: 16 },
            { t: E + 0.3, c: [0.45, 0.0, 3.5], g: [0, -0.14, 0], fov: 30, ap: 18, e: ease.linear },
          ];
    if (this.ph === 'macro' && this.goneAt < E) {
      // "done": a whip aside, the letter leaving frame to the right, sent
      const at = camKeys(this.goneAt, ks), k = ks.filter((q) => q.t < this.goneAt);
      return camKeys(t, [...k, { t: this.goneAt, c: at.c, g: at.g, fov: at.fov, ap: at.ap, e: ease.linear },
        { t: E + 0.04, c: [at.c[0] - 4.2, at.c[1] + 0.3, at.c[2]], g: [at.g[0] - 4.2, at.g[1] + 0.3, at.g[2]], fov: at.fov, ap: at.ap, e: ease.inCubic }]);
    }
    return camKeys(t, ks);
  }

  // ------------------------------------------------------------------ the frame

  override draw() {}

  override render(f: Frame, out: THREE.WebGLRenderTarget) {
    const t = f.t, r = this.ctx.renderer, ph = this.ph, c = this.c, a = f.a, gold = ph === 'crack' || ph === 'unlock';
    const cm = this.cam(t);
    const focus = this.st.look(cm.c, cm.g, cm.fov);

    // the lock: hangs and turns a little; the shackle stands up until the click (macro), seats on the anchor
    const g = this.lock.g;
    const sway = ph === 'macro' ? 0 : 0.18 * Math.sin((t - this.S) * 0.6) + 0.12;
    g.rotation.set(ph === 'macro' ? 0.05 : 0.04 * Math.sin(t * 0.8), sway, ph === 'macro' ? -0.05 : 0.02 * Math.sin(t * 0.5));
    const click = hit(t, this.aAt, 0.07);
    const sh = this.lock.shackle;
    const seat = ph === 'macro' ? 0.16 * (1 - ease.inQuad(prog(t, this.aAt - 0.12, this.aAt))) : 0;
    sh.position.y = this.lock.h / 2 - BW * 0.32 * 0.75 + seat - 0.012 * click;
    if (ph === 'unlock') {
      // slides in, turns a quarter on "what", the shackle springs; on the hit the slab cleaves and the halves part
      const S = this.S, w = this.tWhat, ins = ease.inOutCubic(prog(t, S + 0.02, w - 0.38)), turn = ease.inOutCubic(prog(t, w - 0.3, w));
      this.keyG.position.z = lerp(0.95, 0.42, ins);
      this.keyG.rotation.z = Math.PI / 2 - turn * Math.PI / 2;
      const pop = ease.outBack(prog(t, w + 0.02, w + 0.24));
      sh.position.y = this.lock.h / 2 - BW * 0.32 * 0.75 + 0.2 * pop;
      sh.rotation.y = -0.9 * ease.outCubic(prog(t, w + 0.1, w + 0.6));
      g.rotation.set(0, 0, 0);
      const cl = ease.outCubic(prog(t, this.tCleave, this.tCleave + 0.4));
      for (const [i, hg] of this.halves.entries()) {
        const side = i ? 1 : -1;
        hg.position.set(side * 0.55 * cl, -0.08 * cl, -0.15 * cl);
        hg.rotation.set(0, side * 0.32 * cl, side * -0.05 * cl);
      }
      // the shards and the gold light out of the split
      this.shards.visible = t >= this.tCleave;
      const dt = Math.max(0, t - this.tCleave), m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1);
      for (let i = 0; i < this.shardV.length; i++) {
        const v = this.shardV[i]!, p = new THREE.Vector3(v.x * dt * 0.9, v.y * dt * 0.8 - 1.2 * dt * dt, -0.4 + v.z * dt * 0.7);
        e4.set(dt * (3 + i % 5), dt * (2 + i % 3), 0); q4.setFromEuler(e4);
        m4.compose(p, q4, one.setScalar(0.6 + (i % 7) * 0.12)); this.shards.setMatrixAt(i, m4);
      }
      this.shards.instanceMatrix.needsUpdate = true;
      this.split.intensity = 40 * cl * (1 - 0.5 * prog(t, this.tCleave + 0.4, this.E));
      // the frost on the lock clears as the key turns
      const glass = this.lock.body.material as THREE.MeshPhysicalMaterial;
      glass.roughness = lerp(0.5, 0.08, ease.inOutQuad(prog(t, w - 0.1, w + 0.25)));
    }

    // light: the core and the glass glow, breathing with the loudness; the ring on the anchor
    const lit = this.lit(t);
    const breathe = 0.85 + 0.3 * a.rms;
    const green = hexToLinear(c.green);
    const glowK = gold ? 0 : lit * breathe * (ph === 'macro' ? 0.55 : 1) * (1 + 1.4 * hit(t, this.aAt, 0.25));
    this.coreMat.color.setRGB(green[0] * 2.6 * glowK + 0.02, green[1] * 2.6 * glowK + 0.02, green[2] * 2.6 * glowK + 0.02);
    (this.glassU.uGlow!.value as THREE.Color).setRGB(green[0] * 0.22 * glowK, green[1] * 0.22 * glowK, green[2] * 0.22 * glowK);
    this.glassU.uRim!.value = gold ? 0.25 : 0.35 * lit;
    this.glow.intensity = gold ? 0 : 3.5 * glowK;
    const rp = prog(t, this.aAt, this.aAt + 0.9, ease.outCubic);
    const rs = ph === 'macro' ? lerp(0.6, 4, rp) : lerp(0.7, 3.2, rp);
    this.ring.scale.set(rs, rs, rs);
    this.ring.visible = t >= this.aAt && rp < 1 && ph !== 'crack' && ph !== 'unlock';
    this.ringMat.color.setRGB(green[0] * 4 * (1 - rp), green[1] * 4 * (1 - rp), green[2] * 4 * (1 - rp));
    if (ph !== 'macro') this.ring.quaternion.copy(this.st.cam.quaternion);

    // the crack's gold light (crack)
    const crackP = ph === 'crack' ? ease.outCubic(prog(t, this.aAt - 0.04, this.aAt + 0.24)) : 0;
    const flash = ph === 'crack' ? hit(t, this.aAt + 0.16, 0.2) + 0.4 * hit(t, this.aAt, 0.05) : 0;
    if (ph === 'crack') {
      const gold = hexToLinear(c.accent);
      const gk = 0.05 + 0.6 * crackP + 1.2 * flash;
      this.coreMat.color.setRGB(gold[0] * 3 * gk, gold[1] * 3 * gk, gold[2] * 3 * gk);
      (this.glassU.uGlow!.value as THREE.Color).setRGB(gold[0] * 0.08 * gk, gold[1] * 0.08 * gk, gold[2] * 0.08 * gk);
      for (const b of this.bokeh) b.visible = true;
    }

    this.key.intensity = gold ? 2.4 : 1.6;
    this.fill.intensity = 0.4;
    this.st.scene.environmentIntensity = ph === 'macro' ? 0.7 + 0.5 * lit : 1;
    const bu = this.back.u;
    bu.uTime!.value = t;
    const glowP = this.st.uv([-3.2, 3.6, -3]);
    (bu.uGlowP!.value as THREE.Vector2).set(...glowP);
    (bu.uGlowC!.value as THREE.Color).copy(gold ? lin(c.accent) : lin(c.ice));
    bu.uGlow!.value = gold ? 0.9 : 0.55;
    bu.uGlowR!.value = 0.28;
    this.motes.u.uTime!.value = t;
    this.motes.u.uAmt!.value = ph === 'macro' ? 0.5 + 0.8 * lit : 1;

    // the light in the air: a cold beam from above left onto the lock (gold from above for the crack)
    this.st.time = t;
    const bc = gold ? lin(c.accent, 2.2) : lin(c.ice, ph === 'macro' ? 1.0 : 1.6);
    this.st.beams = [{ p: gold ? [0.4, 4.5, 0.6] : [-2.6, 4.4, 1.2], d: gold ? [-0.08, -1, -0.12] : [2.6, -4.4, -1.4], angle: 0.2, color: bc, range: 6 }];
    if (ph !== 'crack' && ph !== 'macro') this.st.beams.push({ p: [0, 0, -0.1], d: [0, 0, 1], angle: 1.2, color: lin(c.green, 0.35 * lit * breathe), range: 1.6 });
    this.st.fog = { density: ph === 'macro' ? 0.12 : 0.2, noise: 0.6, haze: 0.02, hazeColor: lin(gold ? c.accent : c.deep, 0.5), maxDist: 20 };

    // draw
    this.st.begin(r, [0, 0, 0]);
    if (ph === 'crack' && crackP > 0) {
      this.crack.clear();
      const gold = hexToLinear(c.accent);
      const head = crackP * (this.crackLen + 0.3);
      const m = this.lock.g.matrixWorld;
      this.lock.g.updateMatrixWorld(true);
      const va = new THREE.Vector3(), vb = new THREE.Vector3();
      const k = 4 + 30 * flash;
      for (const q of this.crackPts) {
        if (q.s0 > head) continue;
        const u = clamp((head - q.s0) / (q.s1 - q.s0));
        va.copy(q.a).applyMatrix4(m);
        vb.copy(q.a).lerp(q.b, u).applyMatrix4(m);
        this.crack.seg(va.x, va.y, va.z, vb.x, vb.y, vb.z, 0.0045, gold[0] * k, gold[1] * k, gold[2] * k, 1);
      }
      this.crack.render(r, this.st.rt, this.st.cam);
    }
    const light = gold || ph === 'macro' ? this.st.uv([-3.2, 3.6, -3]) : this.st.uv([0, 0, 0]);
    const lens = ph === 'open' ? 0.1 + 0.07 * this.downbeats.filter((d) => d <= t).reduce((s, d) => s + ease.outCubic(prog(t, d, d + 0.9)), 0)
      : ph === 'macro' ? 0.12 : gold ? 0.2 + 0.12 * prog(t, this.S, this.aAt) : 0;
    this.st.finish(r, out, {
      focus, ap: cm.ap,
      rays: gold || ph === 'macro'
        ? { uv: light, rad: 0.5, amt: gold ? 1.4 : 0.6, thr: 0.9, len: 0.75, decay: 0.97, tint: gold ? lin(c.accent, 0.8) : lin(c.ice, 0.7) }
        : { uv: light, amt: 2.2, thr: 0.5, len: 0.8, decay: 0.975, rad: 0.16, tint: new THREE.Color(1, 1, 1) },
      lens, lensMotif: ph === 'open', lensCol: gold ? lin(c.accent2, 0.7) : lin(c.ice, 0.6),
    });

    // the tooltip (macro, secure) and the last thread of frost (secure)
    if (ph === 'secure' || (ph === 'macro' && this.tip)) {
      this.over.clear();
      const o = this.over.ctx;
      const tp = prog(t, this.tipAt, this.tipAt + 0.25, ease.outCubic);
      if (tp > 0 && this.tip) {
        const fam = this.font('body'), size = ph === 'macro' ? 34 : 30;
        const lp = this.st.uv([0, -this.lock.h / 2 - 0.12, 0]);
        // under the lock, kept inside the picture band
        const band = this.ctx.style.aspect ? (H + W / this.ctx.style.aspect) / 2 : H;
        const x = lp[0] * W, y = Math.min((1 - lp[1]) * H + 14, band - 96) + 8 * (1 - tp);
        const tw = measure(this.tip, fam, size) + 40;
        o.globalAlpha = tp;
        o.fillStyle = 'rgba(14,22,34,0.92)';
        o.beginPath(); o.roundRect(x - tw / 2, y, tw, size + 24, 10); o.fill();
        o.strokeStyle = 'rgba(140,200,230,0.35)'; o.lineWidth = 1.5; o.stroke();
        o.font = font(fam, size); o.textAlign = 'center'; o.textBaseline = 'middle';
        o.fillStyle = c.type; o.fillText(this.tip, x, y + (size + 24) / 2);
        o.globalAlpha = 1;
      }
      const grown = ph === 'secure' ? Math.max(0, (t - this.aAt - 1.0) * 260) : 0;
      if (grown > 0) {
        o.lineCap = 'round';
        o.strokeStyle = 'rgba(190,235,255,0.75)';
        for (const s of this.thread) {
          if (s.s > grown) continue;
          o.lineWidth = s.w; o.beginPath(); o.moveTo(s.ax, s.ay); o.lineTo(s.bx, s.by); o.stroke();
        }
      }
      this.ctx.comp.draw(r, this.over.upload(), out, { mode: 'normal' });
    }

    const warm = gold;
    return {
      bloom: 0.75, bloomThreshold: 0.85, bloomRadius: 0.6, halation: warm ? 0.12 : 0.04, ca: 0.22, grain: 0.016, vignette: 0.42, hud: 0,
      gain: (warm ? [1.06, 1.0, 0.9] : [0.94, 1.0, 1.08]) as [number, number, number],
      lift: (warm ? [0.008, 0.004, 0] : [0, 0.004, 0.012]) as [number, number, number], sat: 1.12,
    };
  }
}
