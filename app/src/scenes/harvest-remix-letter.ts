// Harvest Now, Decrypt Later (Banger Remix): the letter. The Tuesday message as what the song says it is, a love
// letter: a cream envelope lying face down on a dark table under one raking light, its flap sealed with red wax
// pressed with a padlock sigil. Phases (entry `phase`):
// - `seal` (intro into verse 1): a red wax drop falls onto the flap's tip and spreads; a brass seal stamp descends
//   and presses into it on the instrumental cue's anchor (the wax squeezes out at the rim), lifts, and leaves the
//   padlock sigil; then the camera pulls back to the whole envelope and a postmark slams onto its corner with the
//   date on the sung anchor ("Tuesday,").
// - `open` (final chorus, "I said sooner or later", dawn): the same envelope in warm sunrise light; the seal
//   cracks in two, the flap lifts, the letter slides out and unfolds flat on the anchor: ruled lines of ink, the
//   date in serif italic.
import * as THREE from 'three';
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import { clamp, ease, lerp, mulberry32, prog } from '../engine/util';
import { F, font } from '../engine/type';
import { LibScene, hit } from './_lib';
import {
  Stage, camKeys, colors, depthAlpha, dust, envProbe, envelopeTexture, letterTexture, lin, paperMaterial, postmarkTexture, sealBump, woodTexture,
  type CamKey, type V3, fitOf } from './harvest-remix-kit';

export const schema: SceneSchema = {
  description: 'A cream envelope face down on a dark table under a raking light, its flap sealed with red wax: seal (a wax drop, a brass stamp presses a padlock sigil into it on the instrumental anchor, then a postmark with the date slams on at the sung anchor); open (dawn: the seal cracks, the flap lifts, the letter slides out and unfolds on the anchor). Harvest remix.',
  kinds: ['song'],
  lyrics: 'layer',
  entry: {
    phase: { type: 'string', enum: ['seal', 'open'], default: 'seal', description: 'seal: the wax pressed, the postmark; open: the seal breaks and the letter unfolds' },
    date: { type: 'string', default: 'TUE 2021-03-09', description: 'the postmark date' },
    letterDate: { type: 'string', default: 'Tuesday, 9 March 2021', description: 'the date at the top of the letter' },
  },
  cue: {},
  example: { entry: { phase: 'seal' }, cues: [{}, {}] },
};

type Phase = 'seal' | 'open';
interface P { phase: Phase; date: string; letterDate: string }

const EW = 3.2, ED = 2.0, ET = 0.03; // the envelope (x by z, thickness)
const TIP: V3 = [0, ET / 2 + 0.004, 0.16]; // the flap's tip, where the seal sits
const SR = 0.34; // the seal's radius
const LW = 1.9, LH = LW * 1.3; // the letter

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

export default class HarvestRemixLetter extends LibScene<P> {
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
  private aLater = 1e9; // open
  private c = colors(this.ctx.style, 'frost');
  private get ph() { return this.P.phase; }

  override setup() {
    this.st.fit = fitOf(this.ctx.style);
    this.S = this.ctx.start; this.E = this.ctx.end;
    const span = this.cues.find((c) => !c.line), sung = this.cues.find((c) => c.line);
    if (this.ph === 'seal') {
      this.aPress = span?.at ?? this.S + 3.7;
      this.aPost = sung?.at ?? this.aPress + 1.8;
      this.cWord = sung?.start ?? this.aPress + 0.4;
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
      const brass = new THREE.MeshPhysicalMaterial({ color: lin('#D8AE62'), metalness: 1, roughness: 0.28, envMapIntensity: 1.3 });
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
    } else {
      // the letter: three panels folded in three, unfolding about the middle one
      const tex = letterTexture(this.P.letterDate, { seed: 11 });
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
    const S = this.S, E = this.E;
    const ks: CamKey[] = this.ph === 'seal'
      ? [
          { t: S, c: [0.55, 1.25, 1.35], g: [0, 0, 0.12], fov: 30, ap: 26 },
          { t: this.aPress, c: [0.35, 1.05, 1.05], g: [0, 0, 0.14], fov: 30, ap: 30, e: ease.inOutQuad },
          { t: this.cWord + 0.2, c: [0.3, 1.1, 1.1], g: [0, 0, 0.14], fov: 30, ap: 30, e: ease.linear },
          { t: this.aPost - 0.15, c: [0.9, 3.4, 3.3], g: [0.2, 0, -0.05], fov: 30, ap: 12, e: ease.inOutCubic },
          { t: E + 0.3, c: [0.6, 3.2, 3.0], g: [0.15, 0, -0.05], fov: 30, ap: 12, e: ease.linear },
        ]
      : [
          { t: S, c: [0.35, 1.2, 1.15], g: [0, 0, 0.12], fov: 30, ap: 26 },
          { t: S + 0.65, c: [0.3, 1.5, 1.4], g: [0, 0, 0.05], fov: 30, ap: 22, e: ease.inOutQuad },
          { t: this.aLater, c: [0.15, 4.6, 0.75], g: [0, 0.5, -0.5], fov: 30, ap: 12, e: ease.inOutCubic },
          { t: E + 0.3, c: [0.08, 4.4, 0.65], g: [0, 0.5, -0.5], fov: 30, ap: 12, e: ease.linear },
        ];
    return camKeys(t, ks);
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
    if (ph === 'seal') {
      const tDrop = Math.min(S + 0.2, this.aPress - 1.5), tLand = tDrop + 0.4;
      const fall = prog(t, tDrop, tLand, ease.inQuad);
      const spread = ease.outCubic(prog(t, tLand, tLand + 0.6));
      const squash = t > tLand ? 0.25 * Math.exp(-(t - tLand) * 7) * Math.sin((t - tLand) * 30) : 0;
      pressed = ease.outCubic(prog(t, this.aPress - 0.05, this.aPress + 0.12));
      const bh = lerp(0.14, 0.07, spread) * (1 - squash), bw = lerp(0.1, 0.22, spread) * (1 + squash * 0.5);
      this.blob.visible = t >= tDrop && pressed < 1;
      this.blob.scale.set(bw * (1 + 0.5 * pressed), bh * (1 - 0.8 * pressed), bw * (1 + 0.5 * pressed));
      this.blob.position.set(TIP[0], lerp(1.6, TIP[1] + bh * 0.4, fall), TIP[2]);
      // the stamp: hovers, descends, presses on the anchor, lifts away
      const down = ease.inOutCubic(prog(t, this.aPress - 1.15, this.aPress - 0.3)) * 0.7 + ease.inQuad(prog(t, this.aPress - 0.3, this.aPress)) * 0.3;
      const lift = ease.inOutCubic(prog(t, this.aPress + 0.45, this.aPress + 1.2));
      const y = TIP[1] + 0.05 + lerp(2.2, 0, down) + 2.6 * lift;
      this.stamp.position.set(TIP[0] + 0.25 * lift, y - 0.04 * hit(t, this.aPress, 0.08), TIP[2] - 0.2 * lift);
      this.stamp.rotation.set(0, 0.6 * (1 - down) + 0.3 * lift, 0.15 * lift);
      this.stamp.visible = y < 4;
      shake = hit(t, this.aPress, 0.09) * 6 + hit(t, this.aPost, 0.07) * 4;
    }
    const sealS = ph === 'seal' ? lerp(0.3, 1, pressed) : 1;
    this.sealNear.visible = this.sealFar.visible = pressed > 0;
    // the seal: whole (seal), cracking in two along the flap's edge (open)
    const crack = ph === 'open' ? ease.outCubic(prog(t, S + 0.3, S + 0.55)) : 0;
    const flapA = ph === 'open' ? 2.05 * ease.inOutCubic(prog(t, S + 0.55, S + 1.25)) : 0;
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
      const out0 = S + 1.0, out1 = S + 1.55;
      const slide = ease.inOutCubic(prog(t, out0, out1));
      const unf = ease.inOutCubic(prog(t, out1 - 0.05, this.aLater));
      this.letter.visible = t >= S + 0.7;
      const up = ease.inOutCubic(prog(t, out1 - 0.1, this.aLater));
      this.letter.position.set(0, lerp(ET / 2 + 0.006, 0.4, slide) + 0.25 * up, lerp(-0.45, -1.3, slide) + 1.0 * up);
      this.letter.rotation.set(-Math.PI / 2 + lerp(0, 0.18, slide) * (1 - unf), 0, lerp(0.04, -0.03, unf));
      const snap = t > this.aLater ? 0.06 * Math.exp(-(t - this.aLater) * 9) * Math.sin((t - this.aLater) * 26) : 0;
      // folded: top panel over the middle (+π), bottom panel under it (−π); the bottom opens first
      const bot = Math.PI * 0.97 * (1 - ease.inOutCubic(prog(t, out1 - 0.05, lerp(out1, this.aLater, 0.55))));
      const top = Math.PI * 0.98 * (1 - ease.inOutCubic(prog(t, lerp(out1, this.aLater, 0.4), this.aLater))) + snap;
      this.panels[0]!.rotation.x = -top;
      this.panels[2]!.rotation.x = bot;
      const sc = lerp(0.5, 1, slide);
      this.letter.scale.set(sc, sc, sc);
    }

    // light
    const a = f.a;
    this.sun.intensity = (ph === 'open' ? 40 : 26) * (0.92 + 0.12 * a.rms);
    this.fill.intensity = ph === 'open' ? 0.35 : 0.18;
    this.st.scene.environmentIntensity = ph === 'open' ? 0.55 : 0.4;
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

    const warm = ph === 'open';
    return {
      bloom: 0.55, bloomThreshold: 0.9, bloomRadius: 0.6, halation: warm ? 0.15 : 0.05, ca: 0.22, grain: 0.016, vignette: 0.45, hud: 0,
      shake: [shake * 0.6, shake] as [number, number],
      gain: (warm ? [1.08, 1.0, 0.86] : [0.92, 1.0, 1.1]) as [number, number, number],
      lift: (warm ? [0.012, 0.006, 0] : [0, 0.004, 0.014]) as [number, number, number], sat: warm ? 1.15 : 1.08,
      exposure: clamp(1, 0, 2),
    };
  }
}
