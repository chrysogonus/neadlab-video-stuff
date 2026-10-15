// Harvest Now, Decrypt Later (Banger Remix): the relic. What the copies keep, and what never expires: two blocks of
// clear ice hang in a shaft of cold light in the dark, turning slowly on their strings. On the cue's anchor
// ("blueprint") the first catches the light: frozen inside it, a building's floor plan in glowing line work; on
// the next named word ("birthday") the second: a cake with candles and a date. Each hangs a paper tag with the
// cue's `tag` ("valid: forever"). The blocks are transmissive three.js glass (they refract what is frozen in them);
// bubbles hang in the ice; ice dust drifts in the beam.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import { F, font } from '../engine/type';
import { ease, hexToLinear, mulberry32, prog } from '../engine/util';
import { LibScene, hit } from './_lib';
import { Stage, backdrop, camKeys, colors, depthAlpha, dust, envProbe, lin, fitOf } from './harvest-remix-kit';

export const schema: SceneSchema = {
  description: 'Two blocks of clear ice hanging in a shaft of cold light: on the anchor a building\'s floor plan glows frozen in the first, on the next named word a birthday cake with a date in the second; paper tags read the cue\'s tag. Harvest remix.',
  kinds: ['song'],
  lyrics: 'layer',
  entry: {},
  cue: {
    tag: { type: 'string', default: 'valid: forever', description: 'the text on the tags' },
    second: { type: 'string', default: 'birthday', description: 'the word of the line on which the second block lights' },
  },
  example: { entry: {}, cues: [{ tag: 'valid: forever' }] },
};

interface C { tag: string; second: string }

const BS = 1.15; // block size

/** A line drawing on black (for an additive plane frozen in the ice): the floor plan or the cake. */
function drawing(kind: 'plan' | 'cake') {
  const N = 1024, cv = document.createElement('canvas'); cv.width = N; cv.height = N;
  const c = cv.getContext('2d')!;
  c.fillStyle = '#000'; c.fillRect(0, 0, N, N);
  c.strokeStyle = '#fff'; c.fillStyle = '#fff'; c.lineCap = 'round'; c.lineJoin = 'round';
  if (kind === 'plan') {
    // an architect's sheet: grid axes, walls, doors and windows, room names, furniture, a stair, dimensions, a title block
    c.lineWidth = 1.5; c.globalAlpha = 0.5;
    c.setLineDash([14, 6, 3, 6]);
    for (const [i, x] of [150, 392, 632, 874].entries()) { c.beginPath(); c.moveTo(x, 110); c.lineTo(x, 880); c.stroke(); c.font = font(F.mono(500), 22); c.textAlign = 'center'; c.fillText('ABCD'[i]!, x, 98); }
    for (const [i, y] of [170, 470, 854].entries()) { c.beginPath(); c.moveTo(110, y); c.lineTo(900, y); c.stroke(); c.fillText(String(i + 1), 96, y + 8); }
    c.setLineDash([]); c.globalAlpha = 1;
    c.lineWidth = 9;
    c.strokeRect(150, 170, 724, 684);
    c.lineWidth = 6;
    const walls: [number, number, number, number][] = [[150, 470, 520, 470], [600, 470, 874, 470], [470, 170, 470, 360], [470, 420, 470, 470], [640, 470, 640, 854], [150, 660, 330, 660], [400, 660, 640, 660]];
    for (const [a, b, x, y] of walls) { c.beginPath(); c.moveTo(a, b); c.lineTo(x, y); c.stroke(); }
    c.lineWidth = 3;
    for (const [x, y, r, a0] of [[520, 470, 80, 0], [470, 360, 60, Math.PI / 2], [330, 660, 70, 0]] as [number, number, number, number][]) { c.beginPath(); c.moveTo(x, y); c.arc(x, y, r, a0, a0 + Math.PI / 2); c.stroke(); }
    for (const x of [230, 330, 700, 790]) { c.beginPath(); c.moveTo(x, 162); c.lineTo(x + 60, 162); c.moveTo(x, 178); c.lineTo(x + 60, 178); c.stroke(); }
    // furniture: a bed, a sofa, a table and chairs, kitchen units, a stair
    c.lineWidth = 2.5;
    c.strokeRect(690, 520, 140, 190); c.strokeRect(700, 530, 120, 40);
    c.strokeRect(190, 230, 220, 70); c.strokeRect(190, 230, 220, 20);
    c.beginPath(); c.arc(300, 390, 45, 0, Math.PI * 2); c.stroke();
    for (const a of [0, 1.57, 3.14, 4.71]) c.strokeRect(300 + Math.cos(a) * 70 - 14, 390 + Math.sin(a) * 70 - 14, 28, 28);
    c.strokeRect(500, 190, 350, 40); for (let x = 500; x < 850; x += 50) { c.beginPath(); c.moveTo(x, 190); c.lineTo(x, 230); c.stroke(); }
    for (let k = 0; k < 9; k++) { c.beginPath(); c.moveTo(170, 690 + k * 18); c.lineTo(300, 690 + k * 18); c.stroke(); }
    c.beginPath(); c.moveTo(235, 830); c.lineTo(235, 700); c.lineTo(222, 716); c.moveTo(235, 700); c.lineTo(248, 716); c.stroke();
    c.font = font(F.mono(500), 22); c.textAlign = 'center';
    for (const [t, x, y] of [['LIVING', 300, 450], ['KITCHEN', 670, 300], ['BED 1', 760, 760], ['STAIR', 235, 860 - 190], ['HALL', 520, 560], ['BATH', 520, 760]] as [string, number, number][]) c.fillText(t, x, y);
    // dimensions and the title block
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(150, 905); c.lineTo(874, 905); c.moveTo(150, 895); c.lineTo(150, 915); c.moveTo(874, 895); c.lineTo(874, 915); c.stroke();
    c.font = font(F.mono(500), 30); c.fillText('12.40 m', 512, 945);
    c.textAlign = 'left'; c.font = font(F.mono(600), 30); c.fillText('LEVEL 2 · NORTH WING', 150, 60);
    c.font = font(F.mono(400), 20); c.fillText('DWG A-201 · REV C · SCALE 1:100 · CONFIDENTIAL', 150, 88);
  } else {
    // a birthday card: the cake (two tiers, scallops, candles with flames, a plate), stars and balloons, a message by hand
    c.lineWidth = 8;
    c.beginPath(); c.ellipse(512, 800, 330, 60, 0, 0, Math.PI * 2); c.stroke();
    c.strokeRect(232, 560, 560, 230);
    c.strokeRect(322, 400, 380, 160);
    c.lineWidth = 5;
    for (let x = 232; x < 792; x += 56) { c.beginPath(); c.arc(x + 28, 560, 28, 0, Math.PI); c.stroke(); }
    for (let x = 322; x < 702; x += 54) { c.beginPath(); c.arc(x + 27, 400, 27, 0, Math.PI); c.stroke(); }
    for (let x = 262; x < 780; x += 40) { c.beginPath(); c.arc(x, 700, 6, 0, Math.PI * 2); c.fill(); }
    for (let i = 0; i < 5; i++) {
      const x = 372 + i * 70;
      c.strokeRect(x - 9, 300, 18, 100);
      for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(x - 9, 310 + k * 24); c.lineTo(x + 9, 300 + k * 24); c.stroke(); }
      c.beginPath(); c.moveTo(x, 290); c.quadraticCurveTo(x + 22, 255, x, 220); c.quadraticCurveTo(x - 22, 255, x, 290); c.stroke();
    }
    for (const [x, y, r] of [[150, 260, 60], [880, 300, 52]] as [number, number, number][]) {
      c.beginPath(); c.ellipse(x, y, r * 0.85, r, 0, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.moveTo(x, y + r); c.bezierCurveTo(x + 20, y + r + 60, x - 20, y + r + 120, x + 10, y + r + 180); c.stroke();
    }
    c.lineWidth = 3;
    for (const [x, y] of [[230, 140], [780, 150], [120, 480], [900, 520], [520, 150]]) { c.beginPath(); for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2, rr = k % 2 ? 9 : 22; c.lineTo(x! + Math.cos(a) * rr, y! + Math.sin(a) * rr); } c.closePath(); c.stroke(); }
    c.font = font(F.hand(), 80); c.textAlign = 'center';
    c.fillText('Happy 40th, Dad!', 512, 950);
    c.font = font(F.hand(), 60);
    c.fillText('9 March', 512, 690 - 20);
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.NoColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Fractures in ice: a few long branching hairlines (white on black, for a cutout). */
function cracks(seed: number) {
  const N = 512, cv = document.createElement('canvas'); cv.width = N; cv.height = N;
  const c = cv.getContext('2d')!, rnd = mulberry32(seed);
  c.fillStyle = '#000'; c.fillRect(0, 0, N, N);
  c.strokeStyle = '#fff'; c.lineCap = 'round';
  const branch = (x: number, y: number, a: number, len: number, w: number, d: number) => {
    c.lineWidth = w; c.beginPath(); c.moveTo(x, y);
    for (let k = 0; k < len; k += 6) { a += (rnd() - 0.5) * 0.5; x += Math.cos(a) * 6; y += Math.sin(a) * 6; c.lineTo(x, y); if (d > 0 && rnd() < 0.06) { c.stroke(); branch(x, y, a + (rnd() < 0.5 ? 1 : -1) * (0.5 + rnd() * 0.6), len * 0.4, w * 0.7, d - 1); c.lineWidth = w; c.beginPath(); c.moveTo(x, y); } }
    c.stroke();
  };
  for (let k = 0; k < 3; k++) branch(rnd() * N, rnd() * N, rnd() * 6.28, 200 + rnd() * 200, 2.2, 2);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.NoColorSpace; return t;
}

function tagTexture(s: string) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 200;
  const c = cv.getContext('2d')!;
  c.fillStyle = '#EFE6D2'; c.beginPath(); c.roundRect(4, 4, 504, 192, 18); c.fill();
  c.fillStyle = '#1a1a1a'; c.beginPath(); c.arc(56, 100, 16, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#22324F'; c.font = font(F.mono(500), 54); c.textAlign = 'left'; c.textBaseline = 'middle';
  c.fillText(s, 100, 104);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

interface Block { g: THREE.Group; art: THREE.MeshBasicMaterial; spot: THREE.SpotLight; at: number }

export default class HarvestRemixRelic extends LibScene<Record<string, never>, C> {
  static schema = schema;
  private st = new Stage(32, 0.03, 100);
  private blocks: Block[] = [];
  private back!: ReturnType<typeof backdrop>;
  private motes!: ReturnType<typeof dust>;
  private S = 0; private E = 0;
  private c = colors(this.ctx.style, 'frost');

  override setup() {
    this.st.fit = fitOf(this.ctx.style);
    this.S = this.ctx.start; this.E = this.ctx.end;
    const cue = this.cues[0];
    this.c = colors(this.ctx.style, cue?.def.palette ?? 'frost');
    const p = cue ? this.cp(cue) : { tag: 'valid: forever', second: 'birthday' };
    const a1 = cue?.at ?? this.S + 0.3;
    const a2 = cue?.line?.words.find((w) => w.w.toLowerCase().startsWith(p.second))?.start ?? a1 + 0.9;
    const r = this.ctx.renderer, sc = this.st.scene, c = this.c;
    sc.environment = envProbe(r, lin(c.bg, 0.4), [
      { w: 3, h: 3, p: [0, 9, 1], at: [0, 0, 0], c: lin('#DDEEFF', 9) },
      { w: 14, h: 4, p: [0, 1, -8], at: [0, 0, 0], c: lin(c.deep, 0.9) },
      { w: 4, h: 6, p: [-7, 1, 3], at: [0, 0, 0], c: lin(c.ice, 0.6) },
    ]);
    this.back = backdrop();
    (this.back.u.uTop!.value as THREE.Color).copy(lin(c.bg, 1.3));
    (this.back.u.uBot!.value as THREE.Color).copy(lin(c.bg, 0.5));
    (this.back.u.uGlowC!.value as THREE.Color).copy(lin(c.deep, 0.35));
    this.back.u.uGlow!.value = 1; this.back.u.uGlowR!.value = 0.45; (this.back.u.uGlowP!.value as THREE.Vector2).set(0.5, 0.75);
    sc.add(this.back.mesh);

    const ice = new THREE.MeshPhysicalMaterial({
      color: lin('#F2FAFF'), metalness: 0, roughness: 0.06, transmission: 1, thickness: 1.0, ior: 1.31,
      attenuationColor: lin('#A8DDF5'), attenuationDistance: 2.4, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.4, specularIntensity: 1,
    });
    depthAlpha(ice, { uRimCol: { value: lin('#DDF3FF') }, uRim: { value: 0.32 } }, 'hr-relic-ice');
    const string = new THREE.MeshBasicMaterial({ color: lin('#9AA8B8', 0.4) });
    depthAlpha(string, {}, 'hr-relic-string', false);
    const rnd = mulberry32(19);
    ([['plan', -0.85, a1], ['cake', 0.85, a2]] as ['plan' | 'cake', number, number][]).forEach(([kind, x, at], i) => {
      const g = new THREE.Group();
      const geo = new RoundedBoxGeometry(BS, BS * 1.18, BS * 0.8, 5, 0.09);
      // a little out of true, as cut ice is
      const pp = geo.getAttribute('position');
      for (let k = 0; k < pp.count; k++) pp.setXYZ(k, pp.getX(k) * (1 + 0.03 * Math.sin(pp.getY(k) * 5 + i)), pp.getY(k), pp.getZ(k) * (1 + 0.04 * Math.sin(pp.getX(k) * 4 + i * 2)));
      geo.computeVertexNormals();
      const block = new THREE.Mesh(geo, ice);
      g.add(block);
      // the frozen drawing: a glowing plane inside the block
      const art = new THREE.MeshBasicMaterial({ alphaMap: drawing(kind), alphaTest: 0.35, color: 0x000000, side: THREE.DoubleSide });
      depthAlpha(art, {}, 'hr-relic-art', false);
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(BS * 0.8, BS * 0.8), art);
      plane.rotation.y = 0.12 * (i ? -1 : 1);
      g.add(plane);
      // cracks and feathered fractures frozen in the ice: white hairlines on two planes at angles
      const crk = new THREE.MeshBasicMaterial({ alphaMap: cracks(31 + i * 7), alphaTest: 0.5, color: lin('#CFEFFF', 0.35), side: THREE.DoubleSide });
      depthAlpha(crk, {}, 'hr-relic-crack', false);
      for (let k = 0; k < 2; k++) {
        const cp = new THREE.Mesh(new THREE.PlaneGeometry(BS * 0.9, BS * 1.05), crk);
        cp.rotation.set(0.3 * (k ? 1 : -1), 0.9 + k * 1.3 + i, 0.2); cp.position.z = (k ? 0.18 : -0.2) * BS;
        g.add(cp);
      }
      // bubbles in the ice
      const bub = new THREE.MeshBasicMaterial({ color: lin('#DFF4FF', 0.6) });
      depthAlpha(bub, {}, 'hr-relic-bubble', false);
      for (let k = 0; k < 60; k++) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.003 + rnd() * 0.008, 8, 6), bub);
        b.position.set((rnd() - 0.5) * BS * 0.85, (rnd() - 0.5) * BS, (rnd() - 0.5) * BS * 0.6);
        g.add(b);
      }
      // the string and the tag
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 6, 6), string);
      s.position.y = BS * 0.59 + 3;
      g.add(s);
      const tagM = new THREE.MeshStandardMaterial({ map: tagTexture(p.tag), roughness: 0.8, side: THREE.DoubleSide, envMapIntensity: 0.6 });
      depthAlpha(tagM, {}, 'hr-relic-tag');
      const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.164), tagM);
      tag.position.set(BS * 0.32, BS * 0.59 + 0.16, BS * 0.42);
      tag.rotation.set(0, -0.2, 0.12 * (i ? 1 : -1));
      g.add(tag);
      const spot = new THREE.SpotLight(lin('#E6F4FF'), 0, 12, 0.32, 0.6, 1.2);
      spot.position.set(x * 0.6, 6, 1.4);
      spot.target = block;
      sc.add(spot);
      g.position.set(x, 1.55, 0);
      sc.add(g);
      this.blocks.push({ g, art, spot, at });
    });
    sc.add(new THREE.HemisphereLight(lin('#BFD8FF'), lin(c.bg), 0.15));
    this.motes = dust(700, [5, 4, 3], 3);
    (this.motes.u.uCol!.value as THREE.Color).copy(lin(c.ice, 1.3));
    this.motes.u.uSize!.value = 7;
    this.motes.pts.position.y = 1.6;
    sc.add(this.motes.pts);
  }

  override draw() {}

  override render(f: Frame, out: THREE.WebGLRenderTarget) {
    const t = f.t, r = this.ctx.renderer, S = this.S, E = this.E, c = this.c;
    const b1 = this.blocks[0]!, b2 = this.blocks[1]!;
    const cm = camKeys(t, [
      { t: S, c: [0.3, 1.85, 5.8], g: [0, 1.62, 0], fov: 32, ap: 12 },
      { t: b1.at + 0.1, c: [-0.3, 1.8, 4.9], g: [-0.45, 1.62, 0], fov: 32, ap: 16, e: ease.inOutQuad },
      { t: b2.at + 0.15, c: [0.3, 1.8, 4.8], g: [0.45, 1.62, 0], fov: 32, ap: 16, e: ease.inOutCubic },
      { t: E + 0.3, c: [0.1, 1.85, 5.4], g: [0.05, 1.62, 0], fov: 32, ap: 14, e: ease.inOutQuad },
    ]);
    const focus = this.st.look(cm.c, cm.g, cm.fov);
    const ice = hexToLinear(c.ice);
    for (const [i, b] of this.blocks.entries()) {
      b.g.rotation.y = 0.35 * Math.sin((t - S) * 0.5 + i * 2) + (i ? -0.25 : 0.25);
      b.g.rotation.z = 0.02 * Math.sin((t - S) * 0.7 + i);
      const on = ease.outCubic(prog(t, b.at - 0.05, b.at + 0.35));
      const k = on * (2.2 + 3 * hit(t, b.at, 0.3)) + 0.03;
      b.art.color.setRGB(ice[0] * k, ice[1] * k, ice[2] * k);
      b.spot.intensity = 18 + 60 * on + 60 * hit(t, b.at, 0.3);
    }
    this.motes.u.uTime!.value = t;
    this.back.u.uTime!.value = t;
    this.st.time = t;
    this.st.beams = this.blocks.map((b) => ({ p: [b.spot.position.x, b.spot.position.y, b.spot.position.z] as [number, number, number], d: [b.g.position.x - b.spot.position.x, b.g.position.y - b.spot.position.y, -b.spot.position.z] as [number, number, number], angle: 0.25, color: lin(c.ice, 0.25 + 0.6 * ease.outCubic(prog(t, b.at - 0.05, b.at + 0.35))), range: 9 }));
    this.st.fog = { density: 0.1, noise: 0.5, haze: 0, maxDist: 14 };
    this.st.render(r, out, {
      focus, ap: cm.ap, clear: [0, 0, 0],
      rays: { uv: this.st.uv([0, 6, 0.5]), amt: 0.9, thr: 0.8, len: 0.85, decay: 0.975, rad: 0.9, tint: lin(c.ice, 0.8) },
      lens: 0.072, lensCol: lin(c.ice, 0.5),
    });
    return {
      bloom: 0.75, bloomThreshold: 0.85, bloomRadius: 0.6, halation: 0.03, ca: 0.22, grain: 0.016, vignette: 0.48, hud: 0,
      gain: [0.93, 1.0, 1.1] as [number, number, number], lift: [0, 0.004, 0.012] as [number, number, number], sat: 1.1,
    };
  }
}
