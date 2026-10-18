// Harvest Now, Decrypt Later (Banger Remix): the relic. What the copies keep, and what never expires: two blocks of
// clear ice hang in a shaft of cold light in the dark, turning slowly on their strings. On the cue's anchor
// ("blueprint") the first catches the light: frozen inside it, a building's floor plan in glowing line work; on
// the next named word ("birthday") the second: a cake with candles and a date. Each hangs a paper tag with the
// cue's `tag` ("valid: forever"). The blocks are transmissive three.js glass (they refract what is frozen in them);
// bubbles hang in the ice; ice dust drifts in the beam.
// Phase `single` ("I don't have to break you"): the copy of the Tuesday letter frozen in one slab of ice, intact,
// lowered on two steel cables through a shaft of cold light into a steel cradle; on the anchor it settles with its
// whole weight, frost blooming out along its base and ice dust puffing up into the light. No force: kept whole.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import { F, font } from '../engine/type';
import { ease, hexToLinear, mulberry32, prog } from '../engine/util';
import { LibScene, hit } from './_lib';
import { Stage, backdrop, camKeys, colors, depthAlpha, dust, envProbe, envelopeProp, frostGrowth, iceCracks, iceMaterial, iceSlab, lin, fitOf } from './harvest-remix-kit';

export const schema: SceneSchema = {
  description: 'Two blocks of clear ice hanging in a shaft of cold light: on the anchor a building\'s floor plan glows frozen in the first, on the next named word a birthday cake with a date in the second; paper tags read the cue\'s tag. Harvest remix.',
  kinds: ['song'],
  lyrics: 'layer',
  entry: {
    phase: { type: 'string', enum: ['pair', 'single'], default: 'pair', description: 'pair: the blueprint and the birthday; single: the copy in its slab, set down in a cradle' },
  },
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

const SL: [number, number, number] = [1.12, 0.83, 0.46]; // the single slab
const REST = 1.2; // the slab's centre at rest in the cradle

export default class HarvestRemixRelic extends LibScene<{ phase: 'pair' | 'single' }, C> {
  static schema = schema;
  private st = new Stage(32, 0.03, 100);
  private blocks: Block[] = [];
  private back!: ReturnType<typeof backdrop>;
  private motes!: ReturnType<typeof dust>;
  private S = 0; private E = 0;
  private c = colors(this.ctx.style, 'frost');
  // single
  private slab = new THREE.Group(); private cables: THREE.Mesh[] = []; private aSet = 0;
  private bloomM!: THREE.MeshBasicMaterial; private shaft = new THREE.SpotLight(0xffffff, 0, 12, 0.3, 0.6, 1.2);

  override setup() {
    this.st.fit = fitOf(this.ctx.style);
    this.S = this.ctx.start; this.E = this.ctx.end;
    const cue = this.cues[0];
    this.c = colors(this.ctx.style, cue?.def.palette ?? 'frost');
    if (this.P.phase === 'single') { this.single(); return; }
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
      const crk = new THREE.MeshBasicMaterial({ alphaMap: iceCracks(31 + i * 7), alphaTest: 0.5, color: lin('#CFEFFF', 0.35), side: THREE.DoubleSide });
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

  /** The copy in its slab over a steel cradle, two cables holding it, a shaft of cold light from above. */
  private single() {
    const r = this.ctx.renderer, sc = this.st.scene, c = this.c;
    this.aSet = this.cues[0]?.at ?? this.S + 0.9;
    sc.environment = envProbe(r, lin(c.bg, 0.4), [
      { w: 3, h: 3, p: [0, 9, 1], at: [0, 0, 0], c: lin('#DDEEFF', 9) },
      { w: 14, h: 4, p: [0, 1, -8], at: [0, 0, 0], c: lin(c.deep, 0.9) },
      { w: 4, h: 6, p: [-7, 1, 3], at: [0, 0, 0], c: lin(c.ice, 0.6) },
    ]);
    this.back = backdrop();
    (this.back.u.uTop!.value as THREE.Color).copy(lin(c.bg, 1.3));
    (this.back.u.uBot!.value as THREE.Color).copy(lin(c.bg, 0.5));
    (this.back.u.uGlowC!.value as THREE.Color).copy(lin(c.deep, 0.35));
    this.back.u.uGlow!.value = 2.2; this.back.u.uGlowR!.value = 0.32; (this.back.u.uGlowP!.value as THREE.Vector2).set(0.5, 0.55);
    sc.add(this.back.mesh);
    // the slab and the frozen copy in it, frosted over
    const ice = iceMaterial('hr-relic-slab', { rough: 0.1, atten: 1.3, rim: 0.85 });
    const slab = iceSlab(SL[0], SL[1], SL[2], 4, ice.m);
    this.slab.add(slab.g);
    const copy = envelopeProp(0.8, c, { pale: true, key: 'hr-relic-copy' });
    this.slab.add(copy.g);
    const fm = new THREE.MeshBasicMaterial({ alphaMap: frostGrowth(512, [[0, 128, 0.1, 230], [0, 384, -0.1, 230], [512, 128, Math.PI - 0.1, 230], [512, 384, Math.PI + 0.1, 230], [256, 512, -Math.PI / 2, 150]], 9, 1.5), alphaTest: 0.35, color: lin('#E6F6FF', 0.55) });
    depthAlpha(fm, {}, 'hr-relic-cfrost', false);
    const fr = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.52), fm);
    fr.position.z = 0.024; copy.g.add(fr);
    // the cables, from the slab's top corners up out of frame
    const steel = new THREE.MeshStandardMaterial({ color: lin('#AFC0D0'), metalness: 1, roughness: 0.3 });
    depthAlpha(steel, {}, 'hr-relic-steel');
    for (const x of [-SL[0] * 0.36, SL[0] * 0.36]) {
      const cab = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 6, 8), steel);
      cab.position.set(x, SL[1] / 2 + 3, 0);
      this.slab.add(cab); this.cables.push(cab);
    }
    sc.add(this.slab);
    // the cradle: a steel saddle lined with frosted rubber
    const cradle = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(SL[0] * 1.1, 0.06, SL[2] * 1.9), steel);
    base.position.y = REST - SL[1] / 2 - 0.05;
    cradle.add(base);
    for (const z of [-1, 1]) {
      const lip = new THREE.Mesh(new THREE.BoxGeometry(SL[0] * 1.1, 0.16, 0.035), steel);
      lip.position.set(0, REST - SL[1] / 2 + 0.04, z * (SL[2] / 2 + 0.04));
      cradle.add(lip);
    }
    const rubber = new THREE.MeshStandardMaterial({ color: lin('#1A2230'), roughness: 0.9 });
    depthAlpha(rubber, {}, 'hr-relic-rubber');
    const pad = new THREE.Mesh(new THREE.BoxGeometry(SL[0] * 1.02, 0.02, SL[2] * 1.2), rubber);
    pad.position.y = REST - SL[1] / 2 - 0.012;
    cradle.add(pad);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 2.4, 16), steel);
    leg.position.y = REST - SL[1] / 2 - 1.28;
    cradle.add(leg);
    sc.add(cradle);
    // the frost that blooms out along the base on the set-down
    this.bloomM = new THREE.MeshBasicMaterial({ alphaMap: frostGrowth(512, Array.from({ length: 14 }, (_, i) => [256 + (i - 6.5) * 30, 256, i % 2 ? Math.PI / 2 : -Math.PI / 2, 120 + (i % 3) * 40] as [number, number, number, number]), 5, 2), alphaTest: 1, color: lin('#E6F6FF', 0.7) });
    depthAlpha(this.bloomM, {}, 'hr-relic-bloom', false);
    const bloom = new THREE.Mesh(new THREE.PlaneGeometry(SL[0] * 1.3, SL[2] * 2.4), this.bloomM);
    bloom.rotation.x = -Math.PI / 2; bloom.position.y = REST - SL[1] / 2 - 0.0005;
    sc.add(bloom);
    this.shaft.position.set(0.2, 6, 1.0); this.shaft.target.position.set(0, REST, 0);
    this.shaft.color.copy(lin('#E6F4FF'));
    sc.add(this.shaft, this.shaft.target);
    sc.add(new THREE.HemisphereLight(lin('#BFD8FF'), lin(c.bg), 0.18));
    this.motes = dust(600, [4, 3.5, 3], 3);
    (this.motes.u.uCol!.value as THREE.Color).copy(lin(c.ice, 1.3));
    this.motes.u.uSize!.value = 7;
    this.motes.pts.position.y = REST + 0.6;
    sc.add(this.motes.pts);
  }

  private renderSingle(f: Frame, out: THREE.WebGLRenderTarget) {
    const t = f.t, r = this.ctx.renderer, S = this.S, E = this.E, c = this.c, a = this.aSet;
    const cm = camKeys(t, [
      { t: S, c: [0.55, REST + 0.7, 2.75], g: [0, REST + 0.3, 0], fov: 32, ap: 14 },
      { t: a + 0.2, c: [0.32, REST + 0.36, 2.25], g: [0, REST - 0.02, 0], fov: 32, ap: 18, e: ease.inOutQuad },
      { t: E + 0.3, c: [0.1, REST + 0.2, 1.8], g: [0, REST - 0.04, 0], fov: 32, ap: 20, e: ease.outQuad },
    ]);
    const focus = this.st.look(cm.c, cm.g, cm.fov);
    // lowered slowly, the last inch eased, then the whole weight settles (a small damped give)
    const down = ease.inOutQuad(prog(t, S - 0.6, a));
    const give = t > a ? -0.012 * Math.exp(-(t - a) * 9) * Math.sin((t - a) * 34) : 0;
    this.slab.position.y = REST + 0.95 * (1 - down) + give;
    this.slab.rotation.y = 0.25 * Math.sin((t - S) * 0.4) * (1 - ease.outCubic(prog(t, a - 0.3, a + 0.6))) - 0.18;
    // the cables go slack: they sag a touch and dim
    for (const cab of this.cables) cab.scale.x = cab.scale.z = 1 - 0.2 * prog(t, a, a + 0.4);
    this.bloomM.alphaTest = 1 - 0.95 * ease.outCubic(prog(t, a, a + 0.9));
    this.bloomM.visible = t >= a;
    this.shaft.intensity = 70 + 40 * hit(t, a, 0.3);
    this.motes.u.uTime!.value = t;
    this.motes.u.uAmt!.value = 0.8 + 2.2 * hit(t, a, 0.6);
    this.back.u.uTime!.value = t;
    this.st.time = t;
    this.st.beams = [{ p: [0.2, 6, 1.0], d: [-0.2, REST - 6, -1.0], angle: 0.24, color: lin(c.ice, 0.55 + 0.4 * hit(t, a, 0.4)), range: 9 }];
    this.st.fog = { density: 0.1, noise: 0.5, haze: 0, maxDist: 14 };
    this.st.render(r, out, {
      focus, ap: cm.ap, clear: [0, 0, 0],
      rays: { uv: this.st.uv([0.2, 6, 1]), amt: 0.9, thr: 0.8, len: 0.85, decay: 0.975, rad: 0.9, tint: lin(c.ice, 0.8) },
      lens: 0.06, lensCol: lin(c.ice, 0.5),
    });
    return {
      bloom: 0.75, bloomThreshold: 0.85, bloomRadius: 0.6, halation: 0.03, ca: 0.22, grain: 0.016, vignette: 0.48, hud: 0,
      gain: [0.93, 1.0, 1.1] as [number, number, number], lift: [0, 0.004, 0.012] as [number, number, number], sat: 1.1,
    };
  }

  override draw() {}

  override render(f: Frame, out: THREE.WebGLRenderTarget) {
    if (this.P.phase === 'single') return this.renderSingle(f, out);
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
