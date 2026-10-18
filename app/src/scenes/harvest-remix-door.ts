// Harvest Now, Decrypt Later (Banger Remix): the vault door. A vast round door of machined steel set in a frosted
// wall, its locking wheel and ring of bolts, the archive's light behind it. Phases (entry `phase`):
// - `shut` (prechorus 1, "keep"): the door stands open, a shaft of cold light pouring out through it into the haze;
//   it swings shut by the cue's anchor, the shaft narrowing to nothing; then the bolts drive home round the rim a
//   group on each snare of the fill from the anchor on, the wheel turning a step with each; frost blooms across its
//   face on the last.
// - `open` (final chorus, dawn): the sealed door in frost; the wheel turns, the bolts draw back, and the door swings
//   open into the sunrise, gold light flooding out.
import * as THREE from 'three';
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import { clamp, ease, mulberry32, prog } from '../engine/util';
import { F, font } from '../engine/type';
import { LibScene, hit } from './_lib';
import { Stage, camKeys, colors, dendrite, depthAlpha, dust, envProbe, fitOf, lin } from './harvest-remix-kit';

export const schema: SceneSchema = {
  description: 'A vast round vault door of machined steel in a frosted wall. shut: it swings shut on a shaft of cold light, bolts driving home and the wheel spinning on the anchor, frost blooming over it; open: the frosted door unlocks and swings open into a flood of gold sunrise light. Harvest remix.',
  kinds: ['song'],
  lyrics: 'layer',
  entry: {
    phase: { type: 'string', enum: ['shut', 'open'], default: 'shut', description: 'shut: closing on the archive; open: opening into the sunrise' },
  },
  cue: {},
  example: { entry: { phase: 'shut' }, cues: [{}] },
};

type Phase = 'shut' | 'open';
interface P { phase: Phase }

const R = 2.6, TH = 0.9; // door radius, thickness
const NB = 16; // bolts

function frostDisc(seed: number) {
  const N = 1024, cv = document.createElement('canvas'); cv.width = N; cv.height = N;
  const c = cv.getContext('2d')!;
  c.fillStyle = '#000'; c.fillRect(0, 0, N, N);
  c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineCap = 'round';
  const rnd = mulberry32(seed);
  for (let i = 0; i < 70; i++) {
    const a = rnd() * Math.PI * 2, rr = N * 0.49;
    dendrite(c, rnd, N / 2 + Math.cos(a) * rr, N / 2 + Math.sin(a) * rr, a + Math.PI + (rnd() - 0.5) * 0.8, 60 + rnd() * 160, 3, 1.4);
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.NoColorSpace; return t;
}

export default class HarvestRemixDoor extends LibScene<P> {
  static schema = schema;
  private st = new Stage(32, 0.05, 200);
  private hinge = new THREE.Group(); // the door swings about its hinge (left edge)
  private wheel = new THREE.Group();
  private bolts: THREE.Mesh[] = [];
  private frostMat!: THREE.MeshBasicMaterial;
  private inner!: THREE.MeshBasicMaterial;
  private motes!: ReturnType<typeof dust>;
  private S = 0; private E = 0; private aAt = 0;
  /** shut: the snares of the fill from the anchor on, one group of bolts driven home on each. */
  private hits: number[] = [];
  private c = colors(this.ctx.style, 'frost');
  private get ph() { return this.P.phase; }

  override setup() {
    this.st.fit = fitOf(this.ctx.style);
    this.S = this.ctx.start; this.E = this.ctx.end;
    this.aAt = this.cues[0]?.at ?? this.S + 1.8;
    this.hits = this.ctx.audio.events('snare', this.aAt - 0.08, this.E + 0.05).map(([x]) => x);
    if (!this.hits.length) this.hits = [this.aAt];
    const dawn = this.ph === 'open';
    this.c = colors(this.ctx.style, dawn ? 'dawn' : 'frost');
    const r = this.ctx.renderer, sc = this.st.scene, c = this.c;
    const lightC = dawn ? lin('#FFC890') : lin('#CFE8FF');
    sc.environment = envProbe(r, lin(dawn ? '#1A0E06' : '#03060D'), [
      { w: 6, h: 6, p: [0, 1.8, -6], at: [0, 1.8, 0], c: lightC.clone().multiplyScalar(6) },
      { w: 20, h: 2, p: [0, 9, 4], at: [0, 0, 0], c: lin(dawn ? c.gold : c.ice, 0.8) },
      { w: 6, h: 6, p: [8, 2, 6], at: [0, 2, 0], c: lin(dawn ? c.deep : c.deep, 0.6) },
    ]);
    // the wall: a frosted steel bulkhead with the round opening, a thick ring frame
    const steel = new THREE.MeshPhysicalMaterial({ color: lin('#9AA6B2'), metalness: 1, roughness: 0.32, anisotropy: 0.8, envMapIntensity: 1.1 });
    const dark = new THREE.MeshPhysicalMaterial({ color: lin('#3A424C'), metalness: 0.9, roughness: 0.45, envMapIntensity: 0.9 });
    depthAlpha(steel, {}, 'hr-door-steel'); depthAlpha(dark, {}, 'hr-door-dark');
    const wallShape = new THREE.Shape();
    wallShape.moveTo(-14, -1); wallShape.lineTo(14, -1); wallShape.lineTo(14, 9); wallShape.lineTo(-14, 9); wallShape.lineTo(-14, -1);
    const hole = new THREE.Path(); hole.absarc(0, 1.8 + 0, R + 0.06, 0, Math.PI * 2, true);
    wallShape.holes.push(hole);
    // the bulkhead: steel plates 2 m square, seams and rows of rivets, streaks of grime (the extrusion's uv is in metres)
    const pc = document.createElement('canvas'); pc.width = pc.height = 1024;
    const px = pc.getContext('2d')!, pr = mulberry32(14);
    px.fillStyle = '#5A6470'; px.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 160; i++) { px.fillStyle = `rgba(${pr() < 0.5 ? '20,24,30' : '160,170,180'},${0.03 + pr() * 0.05})`; px.fillRect(pr() * 1024, pr() * 1024, 2 + pr() * 8, 40 + pr() * 300); }
    for (const k of [0, 512]) { px.fillStyle = 'rgba(10,12,16,0.8)'; px.fillRect(k, 0, 6, 1024); px.fillRect(0, k, 1024, 6); px.fillStyle = 'rgba(200,210,220,0.25)'; px.fillRect(k + 6, 0, 2, 1024); px.fillRect(0, k + 6, 1024, 2); }
    for (const k of [0, 512]) for (let j = 16; j < 1024; j += 32) for (const [x, y] of [[k + 22, j], [j, k + 22]]) { px.fillStyle = 'rgba(20,24,30,0.7)'; px.beginPath(); px.arc(x! + 1.5, y! + 1.5, 5, 0, Math.PI * 2); px.fill(); px.fillStyle = 'rgba(190,200,210,0.6)'; px.beginPath(); px.arc(x!, y!, 4, 0, Math.PI * 2); px.fill(); }
    const pt = new THREE.CanvasTexture(pc); pt.colorSpace = THREE.SRGBColorSpace; pt.wrapS = pt.wrapT = THREE.RepeatWrapping; pt.repeat.set(1 / 4, 1 / 4); pt.anisotropy = 8;
    const bulk = new THREE.MeshPhysicalMaterial({ map: pt, metalness: 0.85, roughness: 0.5, envMapIntensity: 0.9 });
    depthAlpha(bulk, {}, 'hr-door-bulk');
    const wall = new THREE.Mesh(new THREE.ExtrudeGeometry(wallShape, { depth: 1.2, bevelEnabled: false, curveSegments: 96 }), [bulk, dark]);
    wall.position.z = -1.2;
    sc.add(wall);
    const frame = new THREE.Mesh(new THREE.TorusGeometry(R + 0.35, 0.3, 32, 128), steel);
    frame.position.set(0, 1.8, 0.05); sc.add(frame);
    // stencilled on the bulkhead: the vault's name, a warning, hazard stripes along the opening's sill
    const sign = document.createElement('canvas'); sign.width = 1024; sign.height = 512;
    const sx = sign.getContext('2d')!;
    sx.fillStyle = 'rgba(230,236,242,0.85)'; sx.font = font(F.archivo(75, 900), 150); sx.fillText('B2', 20, 170);
    sx.font = font(F.archivo(100, 700), 64); sx.fillText('COLD ARCHIVE', 20, 270);
    sx.font = font(F.mono(500), 34); sx.fillText('AUTHORISED PERSONNEL ONLY', 20, 340); sx.fillText('KEEP SEALED · -18 °C', 20, 390);
    const stx = new THREE.CanvasTexture(sign); stx.colorSpace = THREE.SRGBColorSpace; stx.anisotropy = 8;
    const signM = new THREE.MeshBasicMaterial({ map: stx, transparent: true, color: lin('#FFFFFF', 0.35), depthWrite: false });
    signM.blending = THREE.CustomBlending; signM.blendSrc = THREE.SrcAlphaFactor; signM.blendDst = THREE.OneMinusSrcAlphaFactor; signM.blendSrcAlpha = THREE.ZeroFactor; signM.blendDstAlpha = THREE.OneFactor;
    const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(4, 2), signM); signMesh.position.set(-6.2, 4.4, 0.01); signMesh.renderOrder = 5; sc.add(signMesh);
    const hz = document.createElement('canvas'); hz.width = 512; hz.height = 64;
    const hx = hz.getContext('2d')!; hx.fillStyle = '#1A1A1A'; hx.fillRect(0, 0, 512, 64); hx.fillStyle = '#D9A520';
    for (let x = -64; x < 576; x += 64) { hx.beginPath(); hx.moveTo(x, 64); hx.lineTo(x + 32, 64); hx.lineTo(x + 64, 0); hx.lineTo(x + 32, 0); hx.fill(); }
    const hzt = new THREE.CanvasTexture(hz); hzt.colorSpace = THREE.SRGBColorSpace; hzt.wrapS = THREE.RepeatWrapping; hzt.repeat.set(6, 1);
    const hzM = new THREE.MeshStandardMaterial({ map: hzt, roughness: 0.7 }); depthAlpha(hzM, {}, 'hr-door-hazard');
    const sill = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.25, 0.08), hzM); sill.position.set(0, 1.8 - R - 0.95, 0.04); sc.add(sill);
    // panels and rivets on the wall
    const rivetG = new THREE.SphereGeometry(0.035, 10, 6);
    for (let a = 0; a < 48; a++) {
      const th = (a / 48) * Math.PI * 2, rr = R + 0.85;
      const rv = new THREE.Mesh(rivetG, steel); rv.position.set(Math.cos(th) * rr, 1.8 + Math.sin(th) * rr, 0.02); sc.add(rv);
    }
    // the door: a thick machined disc with concentric rings, bolts round its rim, the wheel at its centre
    const prof: THREE.Vector2[] = [];
    const rings = [[0.001, TH * 0.5], [0.5, TH * 0.5], [0.52, TH * 0.56], [1.1, TH * 0.56], [1.12, TH * 0.5], [1.8, TH * 0.5], [1.83, TH * 0.58], [2.3, TH * 0.58], [2.33, TH * 0.5], [R - 0.05, TH * 0.5], [R, TH * 0.44], [R, -TH * 0.5], [0.001, -TH * 0.5]];
    for (const [x, y] of rings) prof.push(new THREE.Vector2(x!, y!));
    const disc = new THREE.Mesh(new THREE.LatheGeometry(prof, 160), steel);
    disc.rotation.x = Math.PI / 2;
    const door = new THREE.Group();
    door.add(disc);
    for (let i = 0; i < NB; i++) {
      const th = (i / NB) * Math.PI * 2;
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.7, 20), steel);
      b.rotation.z = th - Math.PI / 2;
      b.position.set(Math.cos(th) * (R - 0.15), Math.sin(th) * (R - 0.15), 0);
      door.add(b); this.bolts.push(b);
    }
    // the maker's plate, riveted above the wheel
    const pl = document.createElement('canvas'); pl.width = 1024; pl.height = 320;
    const plx = pl.getContext('2d')!;
    const pg = plx.createLinearGradient(0, 0, 1024, 320); pg.addColorStop(0, '#C9A15A'); pg.addColorStop(0.5, '#E8C47A'); pg.addColorStop(1, '#A8823E');
    plx.fillStyle = pg; plx.fillRect(0, 0, 1024, 320);
    plx.strokeStyle = '#5A4018'; plx.lineWidth = 8; plx.strokeRect(18, 18, 988, 284);
    plx.fillStyle = '#3A2810'; plx.textAlign = 'center';
    plx.font = font(F.archivo(110, 900), 70); plx.fillText('HALDEN & CROSS', 512, 120);
    plx.font = font(F.mono(600), 36); plx.fillText('VAULT CLASS XII · SERIAL 0001 · 2021', 512, 190);
    plx.font = font(F.mono(400), 28); plx.fillText('TIME-LOCKED · DO NOT FORCE', 512, 250);
    for (const [x, y] of [[48, 48], [976, 48], [48, 272], [976, 272]]) { plx.fillStyle = '#6A5020'; plx.beginPath(); plx.arc(x!, y!, 14, 0, Math.PI * 2); plx.fill(); }
    const plt = new THREE.CanvasTexture(pl); plt.colorSpace = THREE.SRGBColorSpace; plt.anisotropy = 8;
    const plM = new THREE.MeshPhysicalMaterial({ map: plt, metalness: 0.9, roughness: 0.3, envMapIntensity: 1.2 }); depthAlpha(plM, {}, 'hr-door-plate');
    const plate = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.47, 0.03), [steel, steel, steel, steel, plM, steel]);
    plate.position.set(0, 1.45, TH * 0.585); door.add(plate);
    // the wheel: a rim, six spokes, a hub
    const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.07, 20, 96), steel);
    this.wheel.add(wheelRim);
    for (let k = 0; k < 6; k++) {
      const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.7, 12), steel);
      sp.rotation.z = (k / 6) * Math.PI; this.wheel.add(sp);
    }
    this.wheel.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.25, 32).rotateX(Math.PI / 2), steel));
    this.wheel.position.z = TH * 0.62;
    door.add(this.wheel);
    // frost on its face
    this.frostMat = new THREE.MeshBasicMaterial({ color: lin('#E6F4FF', 0.9), alphaMap: frostDisc(5), transparent: true, depthWrite: false, opacity: 0 });
    this.frostMat.blending = THREE.CustomBlending;
    this.frostMat.blendSrc = THREE.SrcAlphaFactor; this.frostMat.blendDst = THREE.OneFactor;
    this.frostMat.blendSrcAlpha = THREE.ZeroFactor; this.frostMat.blendDstAlpha = THREE.OneFactor;
    const fr = new THREE.Mesh(new THREE.CircleGeometry(R * 0.995, 96), this.frostMat);
    fr.position.z = TH * 0.6; door.add(fr);
    door.position.set(R, 0, 0); // relative to the hinge at the opening's left edge
    this.hinge.position.set(-R, 1.8, 0.1);
    this.hinge.add(door);
    // the hinge arm
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.6, 0.5), dark); arm.position.set(-0.1, 0, 0.2); this.hinge.add(arm);
    sc.add(this.hinge);
    // behind the opening: the light of the archive (shut) or the sunrise (open)
    this.inner = new THREE.MeshBasicMaterial({ color: lightC.clone().multiplyScalar(dawn ? 3.2 : 2.2) });
    depthAlpha(this.inner, {}, 'hr-door-inner', false);
    const back = new THREE.Mesh(new THREE.CircleGeometry(R + 0.3, 64), this.inner);
    back.position.set(0, 1.8, -6); sc.add(back);
    // the floor: polished, catching the light
    const floorM = new THREE.MeshPhysicalMaterial({ color: lin('#20262E'), metalness: 0.6, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1.2 });
    depthAlpha(floorM, {}, 'hr-door-floor');
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), floorM); floor.rotation.x = -Math.PI / 2; floor.position.set(0, -0.85, 10); sc.add(floor);
    const key = new THREE.SpotLight(lightC, 0, 30, 0.9, 0.8, 1.2); key.position.set(0, 1.8, -5); key.target.position.set(0, 0, 8); sc.add(key, key.target);
    (this as unknown as { key: THREE.SpotLight }).key = key;
    sc.add(new THREE.HemisphereLight(lin(dawn ? '#FFD9A8' : '#5A7AB0'), lin('#05070A'), dawn ? 0.35 : 0.25));
    // a key on the door's face from the camera side, raking low, so the machined rings read
    const face = new THREE.SpotLight(dawn ? lin('#FFD0A0') : lin('#AFCBFF'), 60, 30, 0.5, 0.7, 1.4);
    face.position.set(6, 5, 8); face.target.position.set(0, 1.8, 0); sc.add(face, face.target);
    this.motes = dust(1200, [14, 6, 10], 21);
    (this.motes.u.uCol!.value as THREE.Color).copy(lightC.clone().multiplyScalar(1.1));
    this.motes.u.uSize!.value = 10;
    this.motes.pts.position.set(0, 2, 4);
    sc.add(this.motes.pts);
  }

  /** How far the door stands open (radians about its hinge). */
  private swing(t: number) {
    if (this.ph === 'shut') return 1.25 * (1 - ease.inOutCubic(prog(t, this.S, this.aAt - 0.05)));
    const op = this.S + 0.9;
    return 1.35 * ease.inOutCubic(prog(t, op, this.E + 0.2));
  }

  override draw() {}

  override render(f: Frame, out: THREE.WebGLRenderTarget) {
    const t = f.t, r = this.ctx.renderer, S = this.S, E = this.E, shut = this.ph === 'shut', a = this.aAt;
    const cm = shut
      ? camKeys(t, [{ t: S, c: [4.6, 1.5, 9.5], g: [-0.4, 1.9, 0], fov: 34, ap: 10 }, { t: E + 0.3, c: [3.2, 1.6, 8.0], g: [-0.2, 1.85, 0], fov: 34, ap: 10, e: ease.linear }])
      : camKeys(t, [{ t: S, c: [2.4, 1.6, 7.5], g: [0, 1.8, 0], fov: 34, ap: 10 }, { t: E + 0.3, c: [0.8, 1.7, 5.8], g: [-0.3, 1.8, -2], fov: 34, ap: 10, e: ease.linear }]);
    const focus = this.st.look(cm.c, cm.g, cm.fov);
    const sw = this.swing(t);
    this.hinge.rotation.y = -sw;
    // bolts drive home round the rim a group per snare of the fill (shut) / draw back before the swing (open); the
    // wheel turns a step with each group
    const hs = this.hits, last = hs.at(-1)!;
    for (const [i, b] of this.bolts.entries()) {
      const hb = hs[Math.min(hs.length - 1, Math.floor((i * hs.length) / NB))]!;
      const bolt = shut ? ease.outBack(prog(t, hb, hb + 0.12)) : 1 - ease.inOutCubic(prog(t, S + 0.15, S + 0.8));
      const th = (i / NB) * Math.PI * 2, rr = R - 0.15 + 0.32 * bolt;
      b.position.set(Math.cos(th) * rr, Math.sin(th) * rr, 0);
    }
    this.wheel.rotation.z = shut ? hs.reduce((sum, h) => sum + (2.4 / hs.length) * ease.outCubic(prog(t, h, h + 0.18)), 0) : -2.8 * ease.inOutCubic(prog(t, S, S + 0.85));
    const thump = shut ? Math.max(...hs.map((h) => hit(t, h, 0.06))) : 0;
    this.hinge.position.x = -R + 0.01 * thump;
    // frost blooms after the seal (shut); sealed frost sheds as it opens
    this.frostMat.opacity = shut ? 0.12 * ease.outCubic(prog(t, a, last)) + 0.43 * ease.outCubic(prog(t, last, last + 0.45)) : 0.5 * (1 - ease.inQuad(prog(t, S + 0.4, S + 1.4)));
    // the light through the opening: as wide as the door stands open
    const open = clamp(Math.sin(sw) * 1.3);
    const lc = shut ? lin('#CFE8FF') : lin('#FFC890');
    const key = (this as unknown as { key: THREE.SpotLight }).key;
    key.intensity = 45 * open;
    this.st.time = t;
    this.st.beams = [{ p: [0, 1.8, -5], d: [0.05, -0.12, 1], angle: 0.42 * (0.3 + 0.7 * open), color: lc.clone().multiplyScalar(1.1 * open), range: 12 }];
    this.st.fog = { density: 0.12, noise: 0.6, haze: 0.004, hazeColor: lc, maxDist: 40 };
    this.motes.u.uTime!.value = t;
    this.motes.u.uAmt!.value = 0.3 + 0.7 * open;
    this.st.render(r, out, { focus, ap: cm.ap, clear: [0, 0, 0] });
    return {
      bloom: 0.7, bloomThreshold: 0.85, bloomRadius: 0.7, halation: shut ? 0 : 0.08, ca: 0.15, grain: 0.016, vignette: 0.5, hud: 0,
      gain: (shut ? [0.92, 1.0, 1.1] : [1.08, 1.0, 0.88]) as [number, number, number], lift: (shut ? [0, 0.003, 0.01] : [0.01, 0.005, 0]) as [number, number, number], sat: 1.1,
      streak: 0.45, streakTint: (shut ? [0.6, 0.8, 1.0] : [1.0, 0.8, 0.55]) as [number, number, number],
    };
  }
}
