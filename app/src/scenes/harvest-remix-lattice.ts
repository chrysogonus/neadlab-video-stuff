// Harvest Now, Decrypt Later (Banger Remix): the new math. The post-quantum lock nobody installs, drawn as what it
// is: a crystalline 3D lattice of points (ML-KEM is lattice cryptography), skewed like a real crystal, joined by
// hairlines along its three basis directions and turning slowly in the dark over a faint pool of its own green light.
// Under it, flat on the floor and barely lit, lies a cardboard box net, waiting.
//
// The first cue (the line that hands it over): the lattice hangs loose and faint, its points drifting a little off
// their sites; on each beat a shell of points lights green outward from the origin; on the anchor the whole lattice
// snaps onto its sites (a spring), every hairline lights and one short bright vector flares out of the origin.
// The cue with a `stamp` (the line that puts it off): over the line the lattice folds down plane by plane into the
// box net's square, losing its skew; the four walls fold up around it, the flaps close over it and its light goes
// out; on the anchor the stamp slams onto the crate's front, and the crate holds, then slides off into the dark at
// the right before the cut. A mono label sits in the top-left corner throughout.
//
// Rendering: the box, the floor and their lights are three.js meshes in a multisampled target over a backdrop
// pass; the lattice is a 3D LineBatch depth-tested against them (so the walls hide it as they close); the label is
// a Canvas2D layer on top. A pure function of t.
import * as THREE from 'three';
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import type { ResolvedCue } from '../engine/cues';
import { FSPass, makeRT, clearRT } from '../engine/gl';
import { LineBatch } from '../engine/lines';
import { clamp, ease, hash, hexToLinear, lerp, mulberry32, noise1, prog } from '../engine/util';
import { LibScene, M, W, H, hit, label, mixHex, type Look } from './_lib';

export const schema: SceneSchema = {
  description: 'The new math as a picture (three.js): a crystalline 3D lattice of green points and hairlines turning in the dark; shells of points light outward from the origin on the beats and on the first cue\'s anchor the lattice snaps into full crystal with one short bright vector; on the cue with a `stamp`, the lattice folds down into a cardboard crate whose walls and flaps close over it, the stamp slams onto it on the anchor and the crate slides off into the dark at the right. A mono label in the corner. Harvest remix.',
  kinds: ['song'],
  lyrics: 'layer',
  entry: {
    label: { type: 'string', default: 'ML-KEM · FIPS 203 · 2024', description: 'the mono label in the top-left corner (none if empty)' },
    stamp: { type: 'string', default: 'LATER', description: 'the word stamped on the crate, when the folding cue does not give one' },
  },
  cue: {
    stamp: { type: 'string', default: '', description: 'set on the cue that boxes the lattice: it folds into a crate over the cue\'s line and this word is stamped on it at the anchor; empty: the cue that builds the lattice (snap on the anchor)' },
  },
  example: { entry: { label: 'ML-KEM · FIPS 203 · 2024', stamp: 'LATER' }, cues: [{}, { stamp: 'LATER' }] },
};

interface P { label: string; stamp: string }
interface C { stamp: string }
type V3 = [number, number, number];

// ------------------------------------------------------------------ the lattice (metres, y up)
const R = 3; // coefficients -R..R along each basis vector: 7³ points
const B: V3[] = [[0.3, 0, 0], [0.1, 0.29, 0], [0.065, 0.08, 0.28]]; // a skewed basis: a crystal, not a grid
const LC: V3 = [0, 1.5, 0]; // the lattice's centre while it floats
// ------------------------------------------------------------------ the crate
const S = 1.0; // side
const T = 0.016; // cardboard thickness
const PACK = (S * 0.78) / (2 * R); // the folded lattice's pitch inside the crate

const lin = (hex: string) => new THREE.Color().setRGB(...hexToLinear(hex), THREE.LinearSRGBColorSpace);

const BACK_F = /* glsl */ `
uniform vec3 uBg, uHaze, uGlow; uniform vec2 uC; uniform float uG;
void main() {
  vec2 q = (vUv - uC) * vec2(1.7778, 1.0);
  vec3 col = uBg + uHaze * exp(-pow((vUv.y - 0.5) / 0.32, 2.0)) + uGlow * uG * exp(-dot(q, q) / 0.09);
  fragColor = vec4(col, 1.0);
}`;

/** A canvas texture drawn once (2× for 4K sharpness on large faces). */
function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d')!);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export default class HarvestLattice extends LibScene<P, C> {
  static schema = schema;
  private rt = makeRT(W, H, { samples: 4 });
  private back = new FSPass(BACK_F, {
    uBg: { value: new THREE.Vector3() }, uHaze: { value: new THREE.Vector3() }, uGlow: { value: new THREE.Vector3() },
    uC: { value: new THREE.Vector2(0.5, 0.6) }, uG: { value: 1 },
  });
  private lines = new LineBatch(6000, { screen2D: false, worldWidth: true, blend: 'add', depthTest: true });
  private scene = new THREE.Scene();
  private cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 60);

  // lattice
  private pts: { c: V3; p: V3; shell: number; n: number; seed: number }[] = [];
  private edges: [number, number, number][] = []; // a, b, seed
  private origin = 0;
  private short = 0; // index of the point the short vector ends on
  private shellAt: number[] = [];
  private wp = new Float32Array(0); // world positions this frame
  private wd = new Float32Array(0); // depth factor this frame

  // crate
  private crate = new THREE.Group();
  private walls: THREE.Group[] = []; // hinges, front, right, back, left
  private flaps: THREE.Group[] = [];
  private stampMesh!: THREE.Mesh;
  private stampMat!: THREE.MeshStandardMaterial;
  private shadow!: THREE.Mesh;
  private spot = new THREE.SpotLight(0xffffff, 1, 0, 0.36, 0.85, 0);
  private green = new THREE.PointLight(0x00ff00, 1, 0, 2);
  private rim = new THREE.DirectionalLight(0xffffff, 0.6);
  private fill = new THREE.DirectionalLight(0xffffff, 0.4);
  private hemi = new THREE.HemisphereLight(0xffffff, 0x000000, 0.3);

  // timing
  private T0 = 0; private tSnap = 0; private tFold = 0; private tStamp = 0; private tSlide = 0; private tOut = 0;
  private stampText = '';

  override setup() {
    const k = this.lookAt(this.ctx.start + 0.01);
    this.timing();
    this.buildLattice();
    this.buildCrate(k);
  }

  private timing() {
    const cs = this.cues, snap = cs.find((c) => !this.cp(c).stamp) ?? cs[0];
    const fold: ResolvedCue | undefined = cs.find((c) => this.cp(c).stamp) ?? cs[1];
    this.T0 = this.ctx.start;
    this.tSnap = snap?.at ?? this.T0 + 2.4;
    this.tFold = fold ? Math.max(fold.start, this.tSnap + 0.4) : this.ctx.end + 10;
    this.tStamp = fold ? Math.max(fold.at, this.tFold + 1.2) : this.ctx.end + 12;
    this.tOut = this.ctx.end;
    this.tSlide = Math.max(this.tStamp + 1.2, this.tOut - 2.3);
    this.stampText = (fold && this.cp(fold).stamp) || this.P.stamp;
  }

  private buildLattice() {
    const idx = (i: number, j: number, k: number) => ((i + R) * (2 * R + 1) + (j + R)) * (2 * R + 1) + (k + R);
    for (let i = -R; i <= R; i++) for (let j = -R; j <= R; j++) for (let k = -R; k <= R; k++) {
      const p: V3 = [0, 1, 2].map((a) => i * B[0]![a]! + j * B[1]![a]! + k * B[2]![a]!) as V3;
      const n = Math.hypot(i, j, k);
      this.pts.push({ c: [i, j, k], p, shell: Math.round(n), n, seed: hash(i, j, k, 31) });
      if (i < R) this.edges.push([idx(i, j, k), idx(i + 1, j, k), hash(i, j, k, 1)]);
      if (j < R) this.edges.push([idx(i, j, k), idx(i, j + 1, k), hash(i, j, k, 2)]);
      if (k < R) this.edges.push([idx(i, j, k), idx(i, j, k + 1), hash(i, j, k, 3)]);
    }
    this.origin = idx(0, 0, 0);
    // the shortest non-zero lattice vector among the near neighbours (the "short vector" of the picture)
    let best = 1e9;
    for (const [q, pt] of this.pts.entries()) {
      const L = Math.hypot(...pt.p);
      if (q !== this.origin && pt.n < 2 && L < best && pt.p[0] > 0) { best = L; this.short = q; }
    }
    this.wp = new Float32Array(this.pts.length * 3);
    this.wd = new Float32Array(this.pts.length);
    // a shell lights on each beat from the entry's start; the shells left when the anchor comes light with it
    const beats = this.ctx.audio.beats.filter((b) => b >= this.T0 - 0.05 && b < this.tSnap - 0.08);
    const nShell = Math.max(...this.pts.map((p) => p.shell)) + 1;
    this.shellAt = Array.from({ length: nShell }, (_, s) => beats[s] ?? this.tSnap);
  }

  private buildCrate(k: Look) {
    const rnd = mulberry32(203);
    const kraft = mixHex('#8c6d4b', k.dim, 0.15);
    const kraftFace = (c: CanvasRenderingContext2D, w: number, h: number) => {
      c.fillStyle = kraft; c.fillRect(0, 0, w, h);
      // fibres and speckle
      for (let i = 0; i < 2600; i++) {
        const x = rnd() * w, y = rnd() * h, l = 4 + rnd() * 18, a = rnd() * Math.PI;
        c.strokeStyle = rnd() < 0.5 ? 'rgba(60,40,20,0.10)' : 'rgba(255,235,200,0.08)';
        c.lineWidth = 0.6 + rnd();
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke();
      }
      // worn, darker edges
      const g = c.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(40,26,12,0.28)'); g.addColorStop(0.06, 'rgba(40,26,12,0)');
      g.addColorStop(0.94, 'rgba(40,26,12,0)'); g.addColorStop(1, 'rgba(40,26,12,0.3)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      const g2 = c.createLinearGradient(0, 0, w, 0);
      g2.addColorStop(0, 'rgba(40,26,12,0.24)'); g2.addColorStop(0.05, 'rgba(40,26,12,0)');
      g2.addColorStop(0.95, 'rgba(40,26,12,0)'); g2.addColorStop(1, 'rgba(40,26,12,0.24)');
      c.fillStyle = g2; c.fillRect(0, 0, w, h);
    };
    const plainTex = canvasTex(1024, 1024, (c) => kraftFace(c, 1024, 1024));
    // the outer flaps carry half of the tape strip along their free edge
    const tapeTex = canvasTex(1024, 512, (c) => {
      kraftFace(c, 1024, 512);
      c.fillStyle = 'rgba(214,190,150,0.55)'; c.fillRect(0, 0, 1024, 92);
      c.fillStyle = 'rgba(255,250,235,0.22)'; c.fillRect(0, 10, 1024, 6);
    });
    const mat = (map: THREE.Texture, rough = 0.92) => new THREE.MeshStandardMaterial({ map, roughness: rough, metalness: 0 });
    const plain = mat(plainTex), taped = mat(tapeTex, 0.7);

    const bottom = new THREE.Mesh(new THREE.BoxGeometry(S, T, S), plain);
    bottom.position.y = T / 2;
    this.crate.add(bottom);
    for (let i = 0; i < 4; i++) {
      const side = new THREE.Group();
      side.rotation.y = (i * Math.PI) / 2;
      const hinge = new THREE.Group();
      hinge.position.set(0, T, S / 2);
      const outer = i % 2 === 0; // front and back: the outer flaps, full-height walls
      const h = outer ? S - T : S - 2 * T;
      const wall = new THREE.Mesh(new THREE.BoxGeometry(S - (outer ? 0 : 2 * T), h, T), plain);
      wall.position.set(0, h / 2, -T / 2);
      hinge.add(wall);
      const fh = new THREE.Group();
      fh.position.set(0, h, 0);
      const flap = new THREE.Mesh(new THREE.BoxGeometry(S - (outer ? 0 : 2 * T), S / 2 - (outer ? 0 : T), T),
        outer ? [plain, plain, plain, plain, taped, plain] : plain);
      flap.position.set(0, (S / 2 - (outer ? 0 : T)) / 2, -T / 2);
      fh.add(flap);
      hinge.add(fh);
      side.add(hinge);
      this.crate.add(side);
      this.walls.push(hinge);
      this.flaps.push(fh);
      if (i === 0) {
        // the stamp, on the front wall's outer face
        const ink = mixHex(k.bg, k.onAccent, 0.5);
        const fam = this.font('stencil');
        const stampTex = canvasTex(1400, 560, (c) => {
          const s = this.stampText.toUpperCase();
          c.fillStyle = ink; c.strokeStyle = ink;
          c.lineWidth = 22; c.beginPath(); c.roundRect(40, 40, 1320, 480, 26); c.stroke();
          c.lineWidth = 8; c.beginPath(); c.roundRect(82, 82, 1236, 396, 14); c.stroke();
          let z = 360;
          c.font = `900 ${z}px ${fam}`;
          while (c.measureText(s).width > 1100 && z > 80) { z -= 8; c.font = `900 ${z}px ${fam}`; }
          c.textAlign = 'center'; c.textBaseline = 'middle';
          c.letterSpacing = `${z * 0.04}px`;
          c.fillText(s, 700, 292);
          // the rubber's uneven bite: specks and a pale drag across one side
          c.globalCompositeOperation = 'destination-out';
          for (let q = 0; q < 2200; q++) {
            const x = rnd() * 1400, y = rnd() * 560, r = 1 + rnd() * rnd() * 7;
            c.globalAlpha = 0.35 + 0.65 * rnd();
            c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
          }
          const g = c.createLinearGradient(0, 0, 1400, 0);
          g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.75, 'rgba(0,0,0,0.05)'); g.addColorStop(1, 'rgba(0,0,0,0.42)');
          c.globalAlpha = 1; c.fillStyle = g; c.fillRect(0, 0, 1400, 560);
        });
        this.stampMat = new THREE.MeshStandardMaterial({ map: stampTex, transparent: true, roughness: 0.75, metalness: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
        this.stampMesh = new THREE.Mesh(new THREE.PlaneGeometry(S * 0.8, S * 0.32), this.stampMat);
        this.stampMesh.position.set(0, h * 0.55, 0.0015);
        this.stampMesh.rotation.z = 0.06;
        hinge.add(this.stampMesh);
      }
    }
    this.scene.add(this.crate);

    // floor: dark, a little sheen, fading out into the backdrop
    const fade = canvasTex(512, 512, (c) => {
      const g = c.createRadialGradient(256, 256, 0, 256, 256, 256);
      g.addColorStop(0, '#fff'); g.addColorStop(0.45, '#888'); g.addColorStop(1, '#000');
      c.fillStyle = g; c.fillRect(0, 0, 512, 512);
    });
    fade.colorSpace = THREE.NoColorSpace;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 16),
      new THREE.MeshStandardMaterial({ color: lin(mixHex(k.bg, k.panel, 0.7)), roughness: 0.42, metalness: 0, alphaMap: fade, transparent: true }));
    floor.rotation.x = -Math.PI / 2;
    floor.renderOrder = -1;
    this.scene.add(floor);
    // the crate's contact shadow
    const soft = canvasTex(256, 256, (c) => {
      const g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
      g.addColorStop(0, 'rgba(0,0,0,0.85)'); g.addColorStop(0.5, 'rgba(0,0,0,0.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(0, 0, 256, 256);
    });
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(S * 1.9, S * 1.9), new THREE.MeshBasicMaterial({ map: soft, transparent: true, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.002;
    this.scene.add(this.shadow);

    // lights: a cold key spot from above left, the lattice's green, a cold rim from behind right, a dim ambient
    this.spot.position.set(-1.6, 6.8, 3.4);
    this.spot.target.position.set(0, 0.3, 0);
    this.spot.color = lin(k.type);
    this.green.color = lin(k.accent2);
    this.rim.position.set(4, 3, -4);
    this.rim.color = lin(mixHex(k.type, k.accent, 0.4));
    this.fill.position.set(5, 2.5, 4);
    this.fill.color = lin(mixHex(k.type, k.accent, 0.25));
    this.hemi.color = lin(mixHex(k.bg, k.accent, 0.35));
    this.hemi.groundColor = lin(k.bg);
    this.scene.add(this.spot, this.spot.target, this.green, this.rim, this.fill, this.hemi);
  }

  draw() {}

  override render(f: Frame, out: THREE.WebGLRenderTarget) {
    const t = f.t, a = f.a, r = this.ctx.renderer, k = this.lookAt(t);

    // ------------------------------------------------ states
    const snapped = t >= this.tSnap;
    const snapHit = hit(t, this.tSnap, 0.22);
    const D = this.tStamp - this.tFold;
    const at = (x: number) => this.tFold + D * x; // a moment of the fold, as a share of the line up to the anchor
    const walls = [0.52, 0.44, 0.28, 0.36].map((s) => ease.outBack(prog(t, at(s), at(s + 0.24)), 1.2)); // front, right, back, left
    const inner = ease.inOutCubic(prog(t, at(0.72), at(0.86)));
    const outer = ease.outCubic(prog(t, at(0.83), at(0.98)));
    const closed = outer;
    const stampHit = hit(t, this.tStamp, 0.07);
    const slide = ease.inCubic(prog(t, this.tSlide, this.tOut + 0.25));
    const dark = ease.inOutCubic(prog(t, this.tSlide + 0.4, this.tOut + 0.2));
    const glow = (0.85 + 0.35 * a.rms + 0.25 * a.kick) * (1 - 0.9 * closed);

    // ------------------------------------------------ camera
    const cf = ease.inOutCubic(prog(t, this.tFold - 0.15, at(0.6)));
    const push = ease.inOutCubic(prog(t, this.tSnap - 0.1, this.tSnap + 1.4)) * 0.45;
    const az = -0.12 + 0.025 * (t - this.T0);
    const dist = 7.6 - push;
    const p0 = new THREE.Vector3(LC[0] + Math.sin(az) * dist, LC[1] + 0.35, LC[2] + Math.cos(az) * dist);
    const p1 = new THREE.Vector3(1.5, 4.7, 4.6); // above: looking down into the box as it closes
    const tg0 = new THREE.Vector3(LC[0], LC[1] - 0.25, LC[2]);
    const tg1 = new THREE.Vector3(0.05, 0.45, 0);
    const settle = ease.inOutCubic(prog(t, this.tStamp - 0.1, this.tSlide)); // then down toward the stamp
    p1.add(new THREE.Vector3(-0.4, -2.1, -0.5).multiplyScalar(settle));
    const pan = slide * 0.9;
    this.cam.position.lerpVectors(p0, p1, cf).add(new THREE.Vector3(pan * 0.4, 0, 0));
    this.cam.lookAt(tg0.lerp(tg1, cf).add(new THREE.Vector3(pan, 0, 0)));
    this.cam.updateMatrixWorld();

    // ------------------------------------------------ crate
    const cx = slide * 5.2;
    this.crate.position.set(cx, 0, 0);
    this.crate.rotation.y = -0.12 * slide;
    this.crate.scale.set(1 + 0.02 * stampHit, 1 - 0.045 * stampHit, 1 + 0.02 * stampHit);
    for (let i = 0; i < 4; i++) {
      this.walls[i]!.rotation.x = (Math.PI / 2) * (1 - walls[i]!);
      // flaps: splayed outward as the wall rises (an open box), then swung shut over the top
      this.flaps[i]!.rotation.x = 1.0 * walls[i]! - (Math.PI / 2 * 0.995 + 1.0) * (i % 2 === 0 ? outer : inner);
    }
    this.stampMesh.visible = t >= this.tStamp;
    this.stampMesh.scale.setScalar(1 + 0.07 * hit(t, this.tStamp, 0.04));
    this.shadow.position.x = cx;
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = 0.25 + 0.75 * ease.inOutCubic(prog(t, at(0.3), at(0.9)));

    // ------------------------------------------------ lights
    const keyUp = ease.inOutCubic(prog(t, this.tFold - 0.4, at(0.5)));
    this.spot.intensity = (0.12 + 2.6 * keyUp) * (1 + 0.6 * stampHit) * (1 - 0.6 * dark);
    // the lattice's light: under it while it floats, then spilling out of the box's open top until the flaps close
    this.green.position.set(0, lerp(LC[1], S + 0.3, ease.inOutCubic(prog(t, this.tFold, at(0.6)))), 0);
    this.green.intensity = 1.1 * glow * (1 + 1.6 * snapHit) * (1 - closed);
    this.rim.intensity = 0.15 + 0.25 * keyUp;
    this.fill.intensity = 0.4 * keyUp * (1 - 0.7 * dark);
    this.hemi.intensity = 0.18;

    // ------------------------------------------------ lattice
    this.lines.clear();
    if (t < this.tStamp) this.lattice(t, k, glow, snapped, snapHit, at, cf, closed);

    // ------------------------------------------------ draw
    const bg = hexToLinear(k.bg), ac2 = hexToLinear(k.accent2), ty = hexToLinear(k.type);
    const lc = new THREE.Vector3(LC[0], lerp(LC[1], 0.5, cf), LC[2]).project(this.cam);
    this.back.u.uBg!.value.set(...bg);
    this.back.u.uHaze!.value.set(ty[0] * 0.006, ty[1] * 0.008, ty[2] * 0.012);
    this.back.u.uGlow!.value.set(ac2[0] * 0.05, ac2[1] * 0.05, ac2[2] * 0.05);
    this.back.u.uC!.value.set(lc.x * 0.5 + 0.5, lc.y * 0.5 + 0.5);
    this.back.u.uG!.value = glow * (1 + snapHit) * (1 - closed);
    clearRT(r, this.rt, bg);
    this.back.render(r, this.rt);
    r.setRenderTarget(this.rt);
    r.render(this.scene, this.cam);
    if (this.lines.count) this.lines.render(r, this.rt, this.cam);
    this.ctx.comp.draw(r, this.rt.texture, out, { mode: 'replace' });

    // the label
    this.L.clear();
    if (this.P.label) {
      const c = this.L.ctx, y = M + 6;
      c.fillStyle = k.accent2;
      c.globalAlpha = 0.9;
      c.fillRect(M, y - 17, 10, 10);
      c.globalAlpha = 1;
      label(c, this.P.label, M + 26, y - 6, this.font('mono'), k.a('type', 0.82), 24);
      c.fillStyle = k.a('rule', 1);
      c.fillRect(M, y + 16, 300, 1.5);
    }
    this.ctx.comp.draw(r, this.L.upload(), out, { mode: 'normal' });

    return {
      bloom: 0.55, bloomThreshold: 0.8, bloomRadius: 0.5, halation: 0.06, ca: 0.25, grain: 0.034, vignette: 0.36, hud: 0,
      shake: [7 * stampHit, -5 * stampHit] as [number, number],
    };
  }

  /** The lattice's points, hairlines and short vector into the line batch. */
  private lattice(t: number, k: Look, glow: number, snapped: boolean, snapHit: number, at: (x: number) => number, cf: number, closed: number) {
    const au = this.ctx.audio, b = this.lines;
    const gr = hexToLinear(k.accent2), ty = hexToLinear(k.type);
    // orientation: a slow drift, stepping a little further on each bar (eased), plus a fixed tilt toward the camera
    const barf = au.barAt(t) - au.barAt(this.T0), bi = Math.floor(barf);
    const yaw = 0.5 + 0.1 * (bi + ease.inOutCubic(barf - bi)) + 0.02 * (t - this.T0);
    const rot = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.42, yaw, -0.06, 'YXZ'));
    const unrot = 1 - ease.inOutCubic(prog(t, this.tFold - 0.1, at(0.45)));
    const rq = new THREE.Quaternion().slerpQuaternions(new THREE.Quaternion(), new THREE.Quaternion().setFromRotationMatrix(rot), unrot);
    rot.makeRotationFromQuaternion(rq);
    // loose before the anchor; snaps onto the sites with a spring on it
    const ds = t - this.tSnap;
    const loose = !snapped ? 1 : Math.exp(-ds * 7) * Math.cos(ds * 30);
    // a beat wave running out through the crystal once it has snapped
    const beatf = au.beatAt(t), bp = beatf - Math.floor(beatf);
    const front = bp * 7.5;
    const v = new THREE.Vector3(), camP = this.cam.position;
    const camD = camP.distanceTo(new THREE.Vector3(LC[0], lerp(LC[1], 0.5, cf), LC[2]));
    const top = R; // fold order: the top plane first

    for (const [q, pt] of this.pts.entries()) {
      const amp = 0.075 * loose;
      v.set(
        pt.p[0] + amp * noise1(t * 0.35 + pt.seed * 40, 1),
        pt.p[1] + amp * noise1(t * 0.35 + pt.seed * 40, 2),
        pt.p[2] + amp * noise1(t * 0.35 + pt.seed * 40, 3),
      ).applyMatrix4(rot).add(new THREE.Vector3(...LC));
      // the fold: plane by plane (top first), each point to its site in the crate
      const j = pt.c[1], d0 = ((top - j) / (2 * R)) * 0.28;
      const w = ease.inOutCubic(prog(t, at(d0), at(d0 + 0.34)));
      if (w > 0) {
        const tx = pt.c[0] * PACK, ty2 = S * 0.5 + pt.c[1] * PACK, tz = pt.c[2] * PACK;
        v.set(lerp(v.x, tx, w), lerp(v.y, ty2, w) + Math.sin(Math.PI * w) * 0.12, lerp(v.z, tz, w));
      }
      this.wp[q * 3] = v.x; this.wp[q * 3 + 1] = v.y; this.wp[q * 3 + 2] = v.z;
      this.wd[q] = clamp(1 - (v.distanceTo(camP) - (camD - 1.4)) / 2.8, 0.25, 1);
    }

    const lit = (s: number) => t >= this.shellAt[s]!;
    const inside = 1 - 0.75 * closed;
    // hairlines: sparse and faint while loose, all lit on the snap
    for (const [ia, ib, sd] of this.edges) {
      const pa = this.pts[ia]!, pb = this.pts[ib]!;
      const both = lit(pa.shell) && lit(pb.shell);
      let al: number, col: V3, gain: number;
      if (snapped) {
        const wv = Math.exp(-(((pa.n + pb.n) / 2 - front) ** 2) / 0.9) * (1 - bp);
        al = 0.42 + 0.5 * snapHit + 0.25 * wv; col = gr; gain = (1.1 + 2.2 * snapHit + 1.2 * wv) * glow;
      } else if (both) {
        al = 0.2; col = gr; gain = 0.8 * glow;
      } else {
        if (sd > 0.4) continue;
        al = 0.07; col = ty; gain = 0.6;
      }
      const dep = (this.wd[ia]! + this.wd[ib]!) / 2;
      b.seg(this.wp[ia * 3]!, this.wp[ia * 3 + 1]!, this.wp[ia * 3 + 2]!, this.wp[ib * 3]!, this.wp[ib * 3 + 1]!, this.wp[ib * 3 + 2]!,
        0.0042, col[0] * gain, col[1] * gain, col[2] * gain, al * dep * inside);
    }
    // points: a dot and a faint halo
    for (const [q, pt] of this.pts.entries()) {
      const x = this.wp[q * 3]!, y = this.wp[q * 3 + 1]!, z = this.wp[q * 3 + 2]!, dep = this.wd[q]!;
      const sAt = this.shellAt[pt.shell]!, on = t >= sAt;
      let col: V3 = ty, gain = 0.55, wid = 0.016, al = 0.4;
      if (on || snapped) {
        const fl = hit(t, sAt, 0.12), wv = snapped ? Math.exp(-((pt.n - front) ** 2) / 0.7) * (1 - bp) : 0;
        col = gr; gain = (1.3 + 2.4 * fl + 2.2 * snapHit + 1.6 * wv) * glow; wid = (snapped ? 0.024 : 0.02) + 0.014 * fl + 0.01 * snapHit; al = 1;
      }
      b.seg(x, y, z, x, y, z, wid, col[0] * gain, col[1] * gain, col[2] * gain, al * dep * inside);
      if (on || snapped) b.seg(x, y, z, x, y, z, wid * 2.4, col[0] * gain, col[1] * gain, col[2] * gain, 0.06 * dep * inside);
    }
    // the short vector: out of the origin on the snap, flaring; gone as the fold starts
    const grow = ease.outCubic(prog(t, this.tSnap, this.tSnap + 0.16));
    const vis = grow * (1 - prog(t, this.tFold, at(0.25)));
    if (vis > 0) {
      const o = this.origin * 3, s = this.short * 3;
      const ax = this.wp[o]!, ay = this.wp[o + 1]!, az = this.wp[o + 2]!;
      const ex = lerp(ax, this.wp[s]!, grow), ey = lerp(ay, this.wp[s + 1]!, grow), ez = lerp(az, this.wp[s + 2]!, grow);
      const fl = hit(t, this.tSnap, 0.3), g = (3.2 + 7 * fl) * glow;
      const c: V3 = [lerp(gr[0], 1, 0.35 * fl), lerp(gr[1], 1, 0.35 * fl), lerp(gr[2], 1, 0.35 * fl)];
      b.seg(ax, ay, az, ex, ey, ez, 0.016 + 0.014 * fl, c[0] * g, c[1] * g, c[2] * g, vis);
      b.seg(ax, ay, az, ex, ey, ez, 0.06, c[0] * g, c[1] * g, c[2] * g, 0.08 * vis);
      // its head: four short strokes back from the tip around the shaft
      const dir = new THREE.Vector3(ex - ax, ey - ay, ez - az), len = dir.length();
      if (len > 1e-3) {
        dir.divideScalar(len);
        const u = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
        const w2 = new THREE.Vector3().crossVectors(dir, u);
        for (const e of [u, w2, u.clone().negate(), w2.clone().negate()]) {
          const hx = ex - dir.x * 0.085 + e.x * 0.035, hy = ey - dir.y * 0.085 + e.y * 0.035, hz = ez - dir.z * 0.085 + e.z * 0.035;
          b.seg(ex, ey, ez, hx, hy, hz, 0.012, c[0] * g, c[1] * g, c[2] * g, vis);
        }
      }
      b.seg(ax, ay, az, ax, ay, az, 0.05 + 0.03 * fl, c[0] * g, c[1] * g, c[2] * g, vis);
    }
  }
}
