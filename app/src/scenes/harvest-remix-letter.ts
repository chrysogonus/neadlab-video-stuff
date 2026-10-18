// Harvest Now, Decrypt Later (Banger Remix): the letter. The Tuesday message as what the song says it is, a love
// letter: a cream envelope lying face down on a dark table under one raking light, its flap sealed with red wax
// pressed with a padlock sigil. Phases (entry `phase`):
// - `seal` (intro into verse 1): a red wax drop falls onto the flap's tip and spreads; a brass seal stamp descends
//   and presses into it on the instrumental cue's anchor (the wax squeezes out at the rim), lifts, and leaves the
//   padlock sigil; then the camera pulls back to the whole envelope and a postmark slams onto its corner with the
//   date on the sung anchor ("Tuesday,"). With two instrumental cues (the opening), the first is the drop: a stick
//   of wax melting at the top of frame lets one drop fall in slow motion onto the flap on its anchor, the title
//   fades up, and frost creeps across the envelope's paper toward the hot wax, stopping just short of the seal;
//   the second is the stamp (it presses on its
//   anchor, holds and lifts by its end, the sigil glowing faintly green as it clears). `shot` picks the camera of
//   one entry of that passage: wax, stamp or postmark.
// - `open` (final chorus, "…you were on about / I said sooner or later", dawn): the collector's desk; a reading lamp
//   clicks on as the shot cuts in on the wax seal; the seal snaps, the flap lifts, the letter slides out and opens
//   flat in about a second; then the camera holds still on one short line, "No one else will ever read it.", until
//   the anchor ("later"), and only then drifts down the page to the signature.
import * as THREE from 'three';
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import { clamp, ease, lerp, mulberry32, prog, smoothstep } from '../engine/util';
import { F, font, measure } from '../engine/type';
import { Layer2D, W, H } from '../engine/gl';
import { LibScene, hit } from './_lib';
import {
  PAYOFF, Stage, camKeys, colors, dendrite, depthAlpha, dust, envProbe, envelopeTexture, letterTexture, lin, paperMaterial, postmarkTexture, sealBump, woodTexture,
  type CamKey, type V3, fitOf } from './harvest-remix-kit';

export const schema: SceneSchema = {
  description: 'A cream envelope face down on a dark table under a raking light, its flap sealed with red wax: seal (a wax drop, a brass stamp presses a padlock sigil into it on the instrumental anchor, then a postmark with the date slams on at the sung anchor); open (dawn: the seal cracks, the flap lifts, the letter slides out and unfolds on the anchor). Harvest remix.',
  kinds: ['song'],
  lyrics: 'layer',
  entry: {
    phase: { type: 'string', enum: ['seal', 'open'], default: 'seal', description: 'seal: the wax pressed, the postmark; open: the seal breaks and the letter unfolds' },
    date: { type: 'string', default: 'TUE 2021-03-09', description: 'the postmark date' },
    letterDate: { type: 'string', default: 'Tuesday, 9 March 2021', description: 'the date at the top of the letter' },
    shot: { type: 'string', enum: ['', 'wax', 'stamp', 'postmark'], default: '', description: 'seal over several entries: which camera this entry is (empty: one continuous shot)' },
  },
  cue: {
    title: { type: 'string', default: '', description: 'seal, the drop cue: the title faded up over the shot from its anchor' },
    credit: { type: 'string', default: '', description: 'the credit under the title' },
  },
  example: { entry: { phase: 'seal' }, cues: [{}, {}] },
};

type Phase = 'seal' | 'open';
interface P { phase: Phase; date: string; letterDate: string; shot: '' | 'wax' | 'stamp' | 'postmark' }
interface C { title: string; credit: string }

const EW = 3.2, ED = 2.0, ET = 0.03; // the envelope (x by z, thickness)
const TIP: V3 = [0, ET / 2 + 0.004, 0.16]; // the flap's tip, where the seal sits
const SR = 0.34; // the seal's radius
const LW = 1.9, LH = LW * 1.3; // the letter
const LETTER_Y = 0.65, LETTER_Z = -0.3; // where the opened letter lies (flat, its top toward -z)
const OPEN_T = 1.05; // seconds from the cut until the letter lies open
const FX0 = -1.58, FX1 = -0.25, FZ0 = -0.97, FZ1 = 0.97; // the frost's patch: the envelope's left half, up to the seal
const STIP: V3 = [0.02, 0.36, 0.12]; // where the melting stick's tip hangs over the flap (the opening)

/** The padlock of the seal's impression (sealBump's layout) as an outline and keyhole, white on black: the sigil's glow. */
function sigilMask(n = 512) {
  const cv = document.createElement('canvas'); cv.width = n; cv.height = n;
  const c = cv.getContext('2d')!;
  c.fillStyle = '#000'; c.fillRect(0, 0, n, n);
  // light leaking round the relief: the sigil's outline, soft
  c.filter = 'blur(5px)';
  c.strokeStyle = '#fff'; c.lineWidth = n * 0.014;
  c.beginPath(); c.roundRect(n * 0.37, n * 0.47, n * 0.26, n * 0.2, n * 0.03); c.stroke();
  c.lineWidth = n * 0.05;
  c.beginPath(); c.arc(n / 2, n * 0.47, n * 0.08, Math.PI, 0); c.stroke();
  c.fillStyle = '#fff';
  c.beginPath(); c.arc(n / 2, n * 0.545, n * 0.03, 0, Math.PI * 2); c.fill();
  c.filter = 'none';
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.NoColorSpace; return t;
}

/** The front of another letter: a stamp, a postmark over it, an address in the hand. */
function addressTexture() {
  const w = 1024, h = 640, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d')!;
  c.fillStyle = '#EFE4CF'; c.fillRect(0, 0, w, h);
  const rnd = mulberry32(9);
  for (let i = 0; i < 1500; i++) { c.fillStyle = `rgba(${rnd() < 0.5 ? '120,90,50' : '255,255,255'},0.06)`; c.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 6, 1); }
  // the stamp: a perforated edge, a padlock printed small, a value
  c.save(); c.translate(w - 190, 50);
  c.fillStyle = '#F6F0E2'; c.fillRect(0, 0, 130, 160);
  c.fillStyle = '#B3122E'; c.fillRect(12, 12, 106, 136);
  c.fillStyle = '#F6F0E2'; c.font = font(F.archivo(100, 900), 30); c.textAlign = 'center'; c.fillText('1st', 65, 140);
  c.strokeStyle = '#F6F0E2'; c.lineWidth = 6; c.beginPath(); c.arc(65, 62, 18, Math.PI, 0); c.stroke(); c.fillRect(40, 62, 50, 36);
  c.fillStyle = '#EFE4CF'; for (let k = 0; k < 9; k++) { for (const [x, y] of [[k * 16, 0], [k * 16, 160], [0, k * 20], [130, k * 20]]) { c.beginPath(); c.arc(x!, y!, 5, 0, Math.PI * 2); c.fill(); } }
  c.restore();
  c.strokeStyle = 'rgba(30,40,90,0.7)'; c.lineWidth = 4;
  c.beginPath(); c.arc(w - 230, 150, 70, 0, Math.PI * 2); c.stroke();
  for (let k = 0; k < 4; k++) { c.beginPath(); for (let x = w - 520; x < w - 300; x += 6) c.lineTo(x, 110 + k * 26 + Math.sin(x * 0.05) * 6); c.stroke(); }
  c.fillStyle = '#22324F'; c.font = font(F.hand(), 64); c.textAlign = 'left';
  ['Ms R. Calloway', '7 Mill Street', 'Edinburgh', 'EH1 2QL'].forEach((l, i) => c.fillText(l, 300, 330 + i * 72));
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

export default class HarvestRemixLetter extends LibScene<P, C> {
  static schema = schema;
  private st = new Stage(32, 0.03, 100);
  private flap = new THREE.Group(); // pivots on the envelope's top edge
  private sealNear!: THREE.Mesh; private sealFar!: THREE.Mesh; // the seal's two halves (body side, flap side)
  private blob!: THREE.Mesh; // the wax drop before the press
  private stamp = new THREE.Group();
  private pmark!: THREE.Mesh; private postMat!: THREE.MeshBasicMaterial;
  private letter = new THREE.Group(); private panels: THREE.Group[] = [];
  private sun = new THREE.SpotLight(0xffffff, 0, 30, 0.5, 0.6, 1.2);
  private fill = new THREE.HemisphereLight(0xffffff, 0x000000, 0.2);
  private motes!: ReturnType<typeof dust>;
  private waxMat!: THREE.MeshPhysicalMaterial;

  private S = 0; private E = 0;
  private aPress = 1e9; private aPost = 1e9; private cWord = 1e9; // seal
  private aLand = -1; private tLift0 = 1e9; private tLift1 = 1e9; // seal, the opening: the drop lands; the stamp lifts
  private title = ''; private credit = '';
  private over = new Layer2D();
  private drip = new THREE.Group(); // the melting stick the drop falls from (the opening)
  private frost: THREE.Mesh | null = null; private frostU: Record<string, THREE.IUniform> = {};
  // open: the reading lamp; where the payoff line and the signature are on the page (fractions)
  private lamp = new THREE.SpotLight(0xffc888, 0, 9, 0.55, 0.7, 1.4);
  private payoff = { x: 0.4, y: 0.4 }; private signY = 0.85;
  private aLater = 1e9; // open
  private c = colors(this.ctx.style, 'frost');
  private get ph() { return this.P.phase; }

  override setup() {
    this.st.fit = fitOf(this.ctx.style);
    this.S = this.ctx.start; this.E = this.ctx.end;
    const spans = this.cues.filter((c) => !c.line), sung = this.cues.find((c) => c.line), span = spans.at(-1);
    if (this.ph === 'seal') {
      this.aPress = span?.at ?? this.S + 3.7;
      this.aPost = sung?.at ?? this.aPress + 1.8;
      this.cWord = sung?.start ?? this.aPress + 0.4;
      if (spans.length > 1) {
        const drop = spans[0]!;
        this.aLand = drop.at;
        this.tLift1 = span!.end; this.tLift0 = this.tLift1 - 0.54;
        const p = this.cp(drop); this.title = p.title; this.credit = p.credit;
      }
    } else this.aLater = sung?.at ?? this.S + 2.1;
    this.c = colors(this.ctx.style, (sung ?? span)?.def.palette ?? 'frost');
    this.build();
  }

  private build() {
    const r = this.ctx.renderer, sc = this.st.scene, c = this.c, dawn = this.ph === 'open';
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    const sunC = dawn ? lin('#FFC890') : lin('#C8E0FF');
    sc.environment = envProbe(r, lin(dawn ? '#3A2414' : c.bg, dawn ? 0.5 : 0.6), [
      { w: 6, h: 2, p: dawn ? [8, 3, 1] : [-8, 4, 2], at: [0, 0, 0], c: sunC.clone().multiplyScalar(5) },
      { w: 20, h: 4, p: [0, 10, -4], at: [0, 0, 0], c: lin(dawn ? '#FFE3BE' : c.deep, dawn ? 0.9 : 0.5) },
      { w: 6, h: 3, p: [0, 2, 9], at: [0, 0, 0], c: lin(dawn ? c.gold : c.ice, 0.4) },
      { w: 10, h: 6, p: [1, 7, 6], at: [0, 0, 0], c: lin(dawn ? '#FFE0B0' : '#DCEBFF', 1.6) },
    ]);
    sc.background = null;

    // the table
    const tableM = new THREE.MeshStandardMaterial({ map: woodTexture(dawn ? '#6A4528' : '#2A3446', 3, 3, 41), roughness: dawn ? 0.5 : 0.6, metalness: 0, envMapIntensity: 0.6 });
    depthAlpha(tableM, {}, 'hr-let-table');
    const table = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), tableM);
    table.rotation.x = -Math.PI / 2; table.position.y = -ET / 2;
    table.receiveShadow = true;
    sc.add(table);

    // the envelope: the body, the flap on its hinge, the seal across the tip, the postmark
    const date = this.P.date;
    const body = new THREE.Mesh(new THREE.BoxGeometry(EW, ET, ED), [
      paperMaterial(null, 0xe8dcc6), paperMaterial(null, 0xe8dcc6),
      paperMaterial(envelopeTexture(date, { postmark: false, seed: 5, sender: ['from A.', '12 Harbour Lane'] })), paperMaterial(null, 0xe8dcc6),
      paperMaterial(null, 0xe8dcc6), paperMaterial(null, 0xe8dcc6),
    ]);
    for (const m of body.material as THREE.Material[]) depthAlpha(m, {}, 'hr-let-paper');
    body.castShadow = true; body.receiveShadow = true;
    sc.add(body);
    const flapTex = envelopeTexture(date, { postmark: false, folds: false, seed: 6 });
    const fg = new THREE.BufferGeometry();
    const tipZ = TIP[2] + ED / 2;
    fg.setAttribute('position', new THREE.Float32BufferAttribute([-EW / 2, 0, 0, 0, 0, tipZ, EW / 2, 0, 0], 3));
    fg.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 0.5, 1 - tipZ / ED, 1, 1], 2));
    fg.computeVertexNormals();
    const flapM = paperMaterial(flapTex);
    flapM.side = THREE.DoubleSide;
    depthAlpha(flapM, {}, 'hr-let-paper');
    const flapMesh = new THREE.Mesh(fg, flapM);
    flapMesh.castShadow = true; flapMesh.receiveShadow = true;
    this.flap.add(flapMesh);
    this.flap.position.set(0, ET / 2 + 0.002, -ED / 2);
    sc.add(this.flap);

    this.props(sc, dawn);

    // the wax: two half discs (the split runs along the flap's edge), a drop before the press
    this.waxMat = new THREE.MeshPhysicalMaterial({
      color: lin(c.wax), roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.15, bumpMap: sealBump(), bumpScale: 3,
      sheen: 0.25, sheenColor: lin('#FF7070'), envMapIntensity: 1.1,
    });
    depthAlpha(this.waxMat, {}, 'hr-let-wax');
    const half = (phi0: number) => {
      const pts: THREE.Vector2[] = [];
      for (let i = 0; i <= 20; i++) {
        const u = i / 20, rr = u < 0.8 ? SR * (u / 0.8) : SR * (1 + 0.08 * Math.sin((u - 0.8) / 0.2 * Math.PI));
        pts.push(new THREE.Vector2(Math.max(1e-3, rr), 0.05 * Math.sqrt(Math.max(0, 1 - Math.pow(u, 8)))));
      }
      const g = new THREE.LatheGeometry(pts.reverse(), 64, phi0, Math.PI);
      const p = g.getAttribute('position'), uv = g.getAttribute('uv');
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), k = 1 + 0.06 * Math.sin(a * 6 + 1) + 0.03 * Math.sin(a * 13);
        const rr = Math.hypot(x, z) > SR * 0.85 ? k : 1;
        p.setX(i, x * rr); p.setZ(i, z * rr);
        uv.setXY(i, x / (2.4 * SR) + 0.5, 0.5 - z / (2.4 * SR));
      }
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, this.waxMat);
      m.castShadow = true;
      return m;
    };
    this.sealNear = half(0); // z >= 0 after the turn below: on the body
    this.sealFar = half(Math.PI);
    for (const s of [this.sealNear, this.sealFar]) s.rotation.y = Math.PI / 2;
    sc.add(this.sealNear);
    this.flap.add(this.sealFar); // rides the flap (placed in flap space each frame)
    this.blob = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.MeshPhysicalMaterial({ color: lin(c.wax), roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.2 }));
    depthAlpha(this.blob.material as THREE.Material, {}, 'hr-let-blob');
    this.blob.castShadow = true;
    sc.add(this.blob);

    if (this.ph === 'seal') {
      // the brass stamp: a disc with the sigil, a waisted neck, a turned wooden handle
      const brass = new THREE.MeshPhysicalMaterial({ color: lin('#D8AE62'), metalness: 1, roughness: 0.32, envMapIntensity: this.aLand >= 0 ? 2.6 : 1.3 });
      const wood = new THREE.MeshPhysicalMaterial({ color: lin('#3A2214'), metalness: 0, roughness: 0.45, clearcoat: 0.8, clearcoatRoughness: 0.2 });
      depthAlpha(brass, {}, 'hr-let-brass'); depthAlpha(wood, {}, 'hr-let-wood');
      const prof = (pts: [number, number][]) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 64);
      const head = new THREE.Mesh(prof([[0.001, 0], [SR * 0.92, 0], [SR * 0.95, 0.015], [SR * 0.95, 0.06], [0.16, 0.1], [0.07, 0.16], [0.06, 0.3], [0.001, 0.3]]), brass);
      const handle = new THREE.Mesh(prof([[0.001, 0.29], [0.08, 0.3], [0.1, 0.42], [0.075, 0.6], [0.09, 0.85], [0.14, 1.0], [0.13, 1.08], [0.06, 1.12], [0.001, 1.12]]), wood);
      head.castShadow = true; handle.castShadow = true;
      this.stamp.add(head, handle);
      sc.add(this.stamp);
      // the postmark decal
      this.postMat = new THREE.MeshBasicMaterial({ map: postmarkTexture(date, '#1B2A6B'), transparent: true, depthWrite: false });
      this.postMat.blending = THREE.CustomBlending;
      this.postMat.blendSrc = THREE.SrcAlphaFactor; this.postMat.blendDst = THREE.OneMinusSrcAlphaFactor;
      this.postMat.blendSrcAlpha = THREE.ZeroFactor; this.postMat.blendDstAlpha = THREE.OneFactor;
      this.postMat.color.setRGB(1, 1, 1);
      this.pmark = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), this.postMat);
      this.pmark.rotation.x = -Math.PI / 2;
      this.pmark.position.set(0.68, ET / 2 + 0.003, 0.5);
      this.pmark.renderOrder = 10;
      sc.add(this.pmark);
      if (this.aLand >= 0) this.opening(sc);
    } else {
      // the letter: three panels folded in three, unfolding about the middle one
      const tex = letterTexture(this.P.letterDate, { seed: 11, w: 2048 });
      const marks = (tex.userData.marks ?? []) as { text: string; y: number; x0: number; x1: number }[];
      const pm = marks.find((k) => k.text === PAYOFF);
      if (pm) this.payoff = { x: (pm.x0 + pm.x1) / 2, y: pm.y };
      this.signY = marks.at(-1)?.y ?? 0.85;
      this.lamp.position.set(-1.5, 2.7, -1.6);
      this.lamp.target.position.set(0, 0.6, -0.4);
      this.lamp.castShadow = true; this.lamp.shadow.mapSize.set(1024, 1024);
      sc.add(this.lamp, this.lamp.target);
      const h3 = LH / 3;
      for (let i = 0; i < 3; i++) {
        const g = new THREE.PlaneGeometry(LW, h3);
        const uv = g.getAttribute('uv');
        for (let k = 0; k < uv.count; k++) uv.setY(k, (2 - i + uv.getY(k)) / 3);
        const m = paperMaterial(tex);
        m.side = THREE.DoubleSide;
        depthAlpha(m, {}, 'hr-let-letter');
        const mesh = new THREE.Mesh(g, m);
        mesh.castShadow = true; mesh.receiveShadow = true;
        const pivot = new THREE.Group();
        if (i === 0) { mesh.position.y = h3 / 2; pivot.position.y = h3 / 2; } // top panel hinged at the middle's top edge
        if (i === 2) { mesh.position.y = -h3 / 2; pivot.position.y = -h3 / 2; } // bottom panel at its bottom edge
        pivot.add(mesh);
        this.panels.push(pivot);
        this.letter.add(pivot);
      }
      this.letter.rotation.x = -Math.PI / 2; // lies flat, its top toward -z
      sc.add(this.letter);
    }

    // the light: one raking spot (cold from the left; dawn: low sun from the right), soft shadows
    this.sun.color.copy(sunC);
    this.sun.position.set(...((dawn ? [6, 3.2, 1.5] : [-6.0, 2.6, 2.2]) as V3));
    this.sun.target.position.set(0, 0, -0.2);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.radius = 4;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.camera.near = 1; this.sun.shadow.camera.far = 20;
    sc.add(this.sun, this.sun.target);
    this.fill.color.copy(dawn ? lin('#FFE6C4') : lin('#5C86C8'));
    this.fill.groundColor.copy(lin(dawn ? '#3A2210' : '#02040A'));
    sc.add(this.fill);

    this.motes = dust(500, [7, 3, 6], dawn ? 17 : 13);
    (this.motes.u.uCol!.value as THREE.Color).copy(dawn ? lin('#FFD49A', 1.2) : lin(c.ice, 1.0));
    this.motes.u.uSize!.value = 7;
    this.motes.pts.position.set(0, 1.3, 0);
    sc.add(this.motes.pts);
  }

  // ------------------------------------------------------------------ the frame

  private cam(t: number) {
    const S = this.S, E = this.E, shot = this.P.shot;
    // the opening, one camera per entry: wide-ish over the desk (the frost has room at the left), low from the side
    // for the stamp, then over the envelope pulling back for the postmark
    if (shot === 'wax') return camKeys(t, [
      { t: 0, c: [-1.15, 0.95, 1.55], g: [-0.42, 0.02, 0.18], fov: 34, ap: 14 },
      { t: this.aPress, c: [-0.5, 0.6, 0.98], g: [-0.12, 0.04, 0.16], fov: 30, ap: 20, e: ease.inOutQuad },
    ]);
    if (shot === 'stamp') return camKeys(t, [
      { t: this.aPress, c: [1.15, 0.2, 0.86], g: [0, 0.16, 0.16], fov: 30, ap: 30 },
      { t: this.tLift1 + 0.2, c: [1.0, 0.24, 0.78], g: [0, 0.12, 0.16], fov: 30, ap: 30, e: ease.linear },
    ]);
    const ks: CamKey[] = this.ph === 'seal'
      ? [
          { t: S, c: [0.55, 1.25, 1.35], g: [0, 0, 0.12], fov: 30, ap: 26 },
          { t: this.aPress, c: [0.35, 1.05, 1.05], g: [0, 0, 0.14], fov: 30, ap: 30, e: ease.inOutQuad },
          { t: this.cWord + 0.2, c: [0.3, 1.1, 1.1], g: [0, 0, 0.14], fov: 30, ap: 30, e: ease.linear },
          { t: this.aPost - 0.15, c: [0.9, 3.4, 3.3], g: [0.2, 0, -0.05], fov: 30, ap: 12, e: ease.inOutCubic },
          { t: E + 0.3, c: [0.6, 3.2, 3.0], g: [0.15, 0, -0.05], fov: 30, ap: 12, e: ease.linear },
        ]
      : (() => {
          // the cut lands on the seal (matching the keyhole), rises as the letter opens, then holds on the line
          const at = (fx: number, fy: number): V3 => [-LW / 2 + LW * fx, LETTER_Y, LETTER_Z - LH / 2 + LH * fy];
          const P = at(this.payoff.x, this.payoff.y - 0.012), G = at(0.55, this.signY - 0.03), set = S + OPEN_T;
          return [
            { t: S, c: [0.03, 0.8, TIP[2] + 0.22], g: [0, 0, TIP[2]], fov: 30, ap: 20 },
            { t: set, c: [P[0], P[1] + 0.82, P[2] + 0.82], g: P, fov: 30, ap: 52, e: ease.inOutCubic },
            { t: this.aLater, c: [P[0], P[1] + 0.81, P[2] + 0.8], g: P, fov: 30, ap: 52, e: ease.linear },
            { t: E + 0.3, c: [G[0], G[1] + 1.2, G[2] + 0.7], g: G, fov: 30, ap: 34, e: ease.inOutCubic },
          ] as CamKey[];
        })();
    return camKeys(t, ks);
  }

  /**
   * The opening's props: the stick of wax melting over the flap (the drop falls from its tip), the frost that creeps
   * across the desk from the left toward the letter (dendrites revealed by a front that advances in x), and the
   * sigil's faint green glow (an emissive mask on the wax).
   */
  private opening(sc: THREE.Scene) {
    const waxM = new THREE.MeshPhysicalMaterial({ color: lin(this.c.wax), roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.1 });
    depthAlpha(waxM, {}, 'hr-let-stick');
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 1.4, 6), waxM);
    stick.position.y = 0.7;
    const melt = new THREE.MeshPhysicalMaterial({ color: lin(this.c.wax), roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05, emissive: lin('#FF3A1A'), emissiveIntensity: 0.35 });
    depthAlpha(melt, {}, 'hr-let-melt');
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), melt);
    tip.scale.y = 1.4;
    stick.castShadow = tip.castShadow = true;
    this.drip.add(stick, tip);
    sc.add(this.drip);

    // frost dendrites from the left edge of the canvas (= toward the letter), white on black
    const n = 1024, cv = document.createElement('canvas'); cv.width = n; cv.height = n;
    const c = cv.getContext('2d')!;
    c.fillStyle = '#000'; c.fillRect(0, 0, n, n);
    c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineCap = 'round';
    const rnd = mulberry32(303);
    for (let i = 0; i < 13; i++) dendrite(c, rnd, 0, (i + rnd()) / 13 * n, (rnd() - 0.5) * 0.8, n * (0.6 + rnd() * 0.45), 3, 2.2);
    for (let i = 0; i < 14; i++) dendrite(c, rnd, rnd() * n * 0.5, rnd() * n, (rnd() - 0.5) * 1.0, n * (0.12 + rnd() * 0.22), 2, 1.3);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.NoColorSpace; tex.anisotropy = 8;
    const fm = new THREE.MeshStandardMaterial({ color: lin('#EAF6FF', 0.8), map: tex, roughness: 0.22, metalness: 0, emissive: lin(this.c.ice), emissiveMap: tex, emissiveIntensity: 0.06, envMapIntensity: 1.4 });
    this.frostU = depthAlpha(fm, { uReach: { value: 0 } }, 'hr-let-frost');
    const before = fm.onBeforeCompile;
    fm.onBeforeCompile = (sh, rr) => {
      before.call(fm, sh, rr);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uReach;')
        .replace('#include <map_fragment>', `#include <map_fragment>
  float frontK = uReach + 0.06 * sin(vMapUv.y * 11.0 + 0.7) + 0.035 * sin(vMapUv.y * 37.0) + 0.02 * sin(vMapUv.y * 91.0 + 1.3);
  // thinner toward the front: only the strongest crystals lead it
  float lead = smoothstep(frontK - 0.16, frontK, vMapUv.x);
  if (sampledDiffuseColor.r < mix(0.1, 0.6, lead) || vMapUv.x > frontK) discard;
  diffuseColor.rgb *= 0.6 + 0.4 * smoothstep(frontK, frontK - 0.08, vMapUv.x);`);
    };
    this.frost = new THREE.Mesh(new THREE.PlaneGeometry(FX1 - FX0, FZ1 - FZ0), fm);
    this.frost.rotation.x = -Math.PI / 2;
    this.frost.position.set((FX0 + FX1) / 2, ET / 2 + 0.0042, (FZ0 + FZ1) / 2);
    this.frost.receiveShadow = true;
    this.frost.renderOrder = 5;
    sc.add(this.frost);

    // the sigil's glow: the padlock of the seal's bump map, as an emissive mask
    this.waxMat.emissiveMap = sigilMask();
    this.waxMat.emissive = lin(this.c.green);
    this.waxMat.emissiveIntensity = 0;
  }

  /** On the desk beside it: a fountain pen, a stick of the red sealing wax, another letter half under the first. */
  private props(sc: THREE.Scene, dawn: boolean) {
    const add = (m: THREE.Mesh, key: string) => { depthAlpha(m.material as THREE.Material, {}, key); m.castShadow = true; m.receiveShadow = true; sc.add(m); return m; };
    const lacquer = new THREE.MeshPhysicalMaterial({ color: lin('#0E1626'), roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05 });
    const gold = new THREE.MeshPhysicalMaterial({ color: lin('#D8AE62'), metalness: 1, roughness: 0.22 });
    const pen = new THREE.Group();
    const barrel = add(new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.07, 1.5, 32), lacquer), 'hr-let-pen');
    const cap = add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 32), lacquer), 'hr-let-pen'); cap.position.y = 1.05;
    const band = add(new THREE.Mesh(new THREE.CylinderGeometry(0.083, 0.083, 0.05, 32), gold), 'hr-let-gold'); band.position.y = 0.72;
    const clip = add(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.55, 0.02), gold), 'hr-let-gold'); clip.position.set(0, 1.08, 0.085);
    const nib = add(new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 32), gold), 'hr-let-gold'); nib.position.y = -0.9; nib.rotation.x = Math.PI;
    pen.add(barrel, cap, band, clip, nib);
    pen.rotation.set(Math.PI / 2, 0, -1.2); pen.position.set(2.45, -ET / 2 + 0.08, 0.6);
    sc.add(pen);
    const waxM = new THREE.MeshPhysicalMaterial({ color: lin(this.c.wax), roughness: 0.35, clearcoat: 0.6 });
    const stick = add(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.3, 6), waxM), 'hr-let-stick');
    stick.rotation.set(Math.PI / 2, 0, 0.35); stick.position.set(2.2, -ET / 2 + 0.09, -0.6);
    const tip = add(new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: lin('#3A0A0E'), roughness: 0.5 })), 'hr-let-stick');
    tip.position.y = -0.65; tip.rotation.x = Math.PI; stick.add(tip);
    // another envelope under this one, turned, with its stamp and address
    const other = add(new THREE.Mesh(new THREE.BoxGeometry(EW * 0.95, ET * 0.8, ED * 0.95), [
      paperMaterial(null, 0xe2d5bd), paperMaterial(null, 0xe2d5bd), paperMaterial(addressTexture()), paperMaterial(null, 0xe2d5bd), paperMaterial(null, 0xe2d5bd), paperMaterial(null, 0xe2d5bd),
    ] as unknown as THREE.Material), 'hr-let-other');
    for (const m of other.material as unknown as THREE.Material[]) depthAlpha(m, {}, 'hr-let-paper');
    other.position.set(-1.6, -ET / 2 - ET * 0.4 + 0.001, -0.9); other.rotation.y = 0.32;
    void dawn;
  }

  override draw() {}

  override render(f: Frame, out: THREE.WebGLRenderTarget) {
    const t = f.t, r = this.ctx.renderer, ph = this.ph, c = this.c;
    const cm = this.cam(t);
    const focus = this.st.look(cm.c, cm.g, cm.fov);
    const S = this.S;

    // the wax: a drop falls and spreads, then the stamp presses it flat into the seal (seal); sealed (open)
    let pressed = 1, shake = 0;
    this.blob.visible = false;
    const open = ph === 'seal' && this.aLand >= 0; // the opening: the drop from the melting stick, the frost
    if (ph === 'seal') {
      const tLand = open ? this.aLand : Math.min(S + 0.2, this.aPress - 1.5) + 0.4;
      const tDrop = tLand - (open ? 0.42 : 0.4);
      const fall = prog(t, tDrop, tLand, ease.inQuad);
      const spread = ease.outCubic(prog(t, tLand, tLand + 0.6));
      const squash = t > tLand ? 0.25 * Math.exp(-(t - tLand) * 7) * Math.sin((t - tLand) * 30) : 0;
      pressed = ease.outCubic(prog(t, this.aPress - 0.05, this.aPress + 0.12));
      const bh = lerp(open ? 0.1 : 0.14, 0.07, spread) * (1 - squash), bw = lerp(open ? 0.065 : 0.1, 0.22, spread) * (1 + squash * 0.5);
      this.blob.visible = t >= tDrop && pressed < 1;
      this.blob.scale.set(bw * (1 + 0.5 * pressed), bh * (1 - 0.8 * pressed), bw * (1 + 0.5 * pressed));
      this.blob.position.set(TIP[0], lerp(open ? STIP[1] - 0.09 : 1.6, TIP[1] + bh * 0.4, fall), TIP[2]);
      if (open) {
        // the drop gathers at the stick's tip, swells and lets go (slow motion); the stick rises out of frame after
        const grow = ease.inOutQuad(prog(t, tLand - 1.25, tDrop));
        if (t < tDrop) {
          const rr = lerp(0.012, 0.06, grow);
          this.blob.visible = grow > 0;
          this.blob.scale.set(rr, rr * (1.2 + 0.5 * grow), rr);
          this.blob.position.set(STIP[0], STIP[1] - 0.06 - rr * 0.9 * (1 + 0.5 * grow), STIP[2]);
        }
        const up = ease.inOutCubic(prog(t, tLand + 0.7, tLand + 2.2)) * 2.6;
        this.drip.position.set(STIP[0] + 0.35 * up, STIP[1] + up, STIP[2] - 0.25 * up);
        this.drip.rotation.set(-0.55, 0, -0.5);
        this.drip.visible = up < 2.5;
      }
      // the stamp: hovers, descends, presses on the anchor, lifts away (the opening: it holds through the fill and
      // lifts by the end of the stamp cue)
      const down = open
        ? ease.inOutCubic(prog(t, this.aPress - 1.9, this.aPress - 0.6)) * 0.75 + ease.inQuad(prog(t, this.aPress - 0.32, this.aPress)) * 0.25
        : ease.inOutCubic(prog(t, this.aPress - 1.15, this.aPress - 0.3)) * 0.7 + ease.inQuad(prog(t, this.aPress - 0.3, this.aPress)) * 0.3;
      const lift = open ? ease.inOutCubic(prog(t, this.tLift0, this.tLift1)) : ease.inOutCubic(prog(t, this.aPress + 0.45, this.aPress + 1.2));
      const y = TIP[1] + 0.05 + lerp(2.2, 0, down) + 2.6 * lift;
      this.stamp.position.set(TIP[0] + 0.25 * lift, y - 0.04 * hit(t, this.aPress, 0.08), TIP[2] - 0.2 * lift);
      this.stamp.rotation.set(0, 0.6 * (1 - down) + 0.3 * lift, 0.15 * lift);
      this.stamp.visible = y < 4;
      shake = open ? 0 : hit(t, this.aPress, 0.09) * 6 + hit(t, this.aPost, 0.07) * 4;
    }
    const sealS = ph === 'seal' ? lerp(0.3, 1, pressed) : 1;
    this.sealNear.visible = this.sealFar.visible = pressed > 0;
    // the seal: whole (seal), cracking in two along the flap's edge (open)
    const crack = ph === 'open' ? ease.outCubic(prog(t, S + 0.03, S + 0.2)) : 0;
    const flapA = ph === 'open' ? 2.05 * ease.inOutCubic(prog(t, S + 0.12, S + 0.5)) : 0;
    this.flap.rotation.x = -flapA;
    this.sealNear.position.set(TIP[0] + 0.03 * crack, TIP[1] - 0.002, TIP[2] + 0.035 * crack);
    this.sealNear.rotation.set(0.08 * crack, Math.PI / 2, 0);
    this.sealNear.scale.set(sealS, 1, sealS);
    // the far half sits on the flap at the tip, in flap space
    const tipZ = TIP[2] + ED / 2;
    this.sealFar.position.set(-0.02 * crack, 0.002, tipZ - 0.03 * crack);
    this.sealFar.rotation.set(-0.06 * crack, Math.PI / 2, 0);
    this.sealFar.scale.set(sealS, 1, sealS);
    (this.waxMat as THREE.MeshPhysicalMaterial).bumpScale = 3 * pressed;
    if (open) {
      // the sigil glows faintly green as the stamp clears it, for a moment
      const g = smoothstep(this.tLift0 + 0.25, this.tLift1, t) * (1 - ease.inOutQuad(prog(t, this.tLift1 + 0.1, this.tLift1 + 0.75)));
      this.waxMat.emissiveIntensity = 0.9 * g;
      // the frost's front: creeps in with the pad from the drop on, stops just short of the paper by the lift
      this.frostU.uReach!.value = 0.08 + 0.69 * ease.outQuad(prog(t, this.aLand - 1.2, this.aPress - 0.2)) + 0.06 * ease.outCubic(prog(t, this.aPress - 0.2, this.tLift1));
    }

    // the postmark (seal): lands on the anchor with a settle
    if (this.pmark) {
      const pa = prog(t, this.aPost - 0.06, this.aPost, ease.inQuad);
      const settle = t > this.aPost ? 0.05 * Math.exp(-(t - this.aPost) * 12) * Math.cos((t - this.aPost) * 40) : 0;
      this.pmark.visible = t >= this.aPost - 0.06;
      const sc = lerp(1.35, 1, pa) + settle;
      this.pmark.scale.set(sc, sc, sc);
      this.pmark.rotation.z = lerp(0.25, 0.06, pa);
      this.postMat.opacity = pa;
    }

    // the letter (open): slides out from under the flap, lifts and unfolds flat on the anchor
    if (ph === 'open') {
      // out of the envelope and open in about a second; it settles flat (a small snap) when the camera arrives
      const out0 = S + 0.28, out1 = S + 0.62, done = S + OPEN_T;
      const slide = ease.inOutCubic(prog(t, out0, out1));
      const unf = ease.inOutCubic(prog(t, out1 - 0.05, done));
      this.letter.visible = t >= S + 0.25;
      const up = ease.inOutCubic(prog(t, out1 - 0.1, done));
      this.letter.position.set(0, lerp(ET / 2 + 0.006, 0.4, slide) + (LETTER_Y - 0.4) * up, lerp(-0.45, -1.3, slide) + (LETTER_Z + 1.3) * up);
      this.letter.rotation.set(-Math.PI / 2 + lerp(0, 0.18, slide) * (1 - unf), 0, 0);
      const snap = t > done ? 0.04 * Math.exp(-(t - done) * 9) * Math.sin((t - done) * 26) : 0;
      // folded: top panel over the middle (+π), bottom panel under it (−π); the bottom opens first
      const bot = Math.PI * 0.97 * (1 - ease.inOutCubic(prog(t, out1 - 0.05, lerp(out1, done, 0.55))));
      const top = Math.PI * 0.98 * (1 - ease.inOutCubic(prog(t, lerp(out1, done, 0.4), done))) + snap;
      this.panels[0]!.rotation.x = -top;
      this.panels[2]!.rotation.x = bot;
      const sc = lerp(0.5, 1, slide);
      this.letter.scale.set(sc, sc, sc);
    }

    // light
    const a = f.a;
    // the reading lamp clicks on as the shot cuts in (open)
    this.lamp.intensity = ph === 'open' && t >= S + 0.04 ? 16 * (t < S + 0.1 ? 0.6 : 1) * (0.97 + 0.03 * Math.sin(t * 2.1)) : 0;
    this.sun.intensity = (ph === 'open' ? 7 : open ? 38 : 26) * (0.92 + 0.12 * a.rms) * (open ? lerp(0.12, 1, ease.inOutQuad(prog(t, 0.3, this.aLand + 0.2))) : 1);
    if (open) { this.sun.angle = 0.36; this.sun.penumbra = 0.85; }
    // the opening is lit by the raking light alone: the paper falls into shadow away from its pool
    this.fill.intensity = ph === 'open' ? 0.12 : open ? 0.07 : 0.18;
    this.st.scene.environmentIntensity = (ph === 'open' ? 0.28 : open ? 0.2 : 0.4) * (open ? lerp(0.15, 1, ease.inOutQuad(prog(t, 0.3, this.aLand + 0.6))) : 1);
    this.motes.u.uTime!.value = t;

    this.st.time = t;
    const sp = this.sun.position;
    this.st.beams = [{ p: [sp.x, sp.y, sp.z], d: [-sp.x, -sp.y, -sp.z - 0.2], angle: 0.32, color: (ph === 'open' ? lin('#FFC890') : lin('#C8E0FF')).multiplyScalar(0.55), range: 9 }];
    this.st.fog = { density: 0.07, noise: 0.45, haze: 0, maxDist: 14 };
    this.st.render(r, out, {
      focus, ap: cm.ap, clear: [0, 0, 0],
      lens: ph === 'seal' ? 0.12 + 0.05 * prog(t, S, this.E) : 0,
      lensCol: lin(c.ice, 0.5),
    });

    // the title over the drop, cinema-style: wide letter-spaced caps, the credit under it
    if (open && this.title) {
      const ta = ease.inOutQuad(prog(t, this.aLand, this.aLand + 1.0)) * (1 - ease.inOutQuad(prog(t, this.aPress - 1.7, this.aPress - 0.95)));
      if (ta > 0) {
        this.over.clear();
        const o = this.over.ctx;
        const fam = F.archivo(125, 300), size = 46, track = size * 0.5;
        o.globalAlpha = ta;
        o.font = font(fam, size); o.letterSpacing = `${track}px`; o.textAlign = 'center'; o.textBaseline = 'middle';
        o.fillStyle = '#EAF2FA';
        const tw = measure(this.title, fam, size, track);
        const ty = H / 2 - 262;
        o.fillText(this.title, W / 2 + track / 2, ty);
        o.fillStyle = 'rgba(234,242,250,0.35)';
        o.fillRect(W / 2 - tw * 0.18, ty + 44, tw * 0.36, 1.5);
        o.font = font(F.archivo(125, 500), 22); o.letterSpacing = '14px'; o.fillStyle = '#9FB4C8';
        o.fillText(this.credit, W / 2 + 7, ty + 82);
        o.letterSpacing = '0px'; o.globalAlpha = 1;
        this.ctx.comp.draw(r, this.over.upload(), out, { mode: 'normal' });
      }
    }

    const warm = ph === 'open';
    return {
      bloom: warm ? 0.3 : 0.55, bloomThreshold: warm ? 1.1 : 0.9, bloomRadius: 0.6, halation: warm ? 0.06 : 0.05, ca: 0.22, grain: 0.016, vignette: 0.45, hud: 0,
      shake: [shake * 0.6, shake] as [number, number],
      gain: (warm ? [1.04, 1.0, 0.9] : [0.92, 1.0, 1.1]) as [number, number, number],
      lift: (warm ? [0.012, 0.006, 0] : [0, 0.004, 0.014]) as [number, number, number], sat: warm ? 1.15 : 1.08,
      exposure: clamp(1, 0, 2),
      fade: open ? 1 - ease.outQuad(prog(t, 0, 0.9)) : 0,
    };
  }
}
