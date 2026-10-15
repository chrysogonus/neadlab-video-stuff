// Harvest Now, Decrypt Later (Banger Remix): the key. "The fridge hums low, the key falls out": under the
// chandelier, the gold package of its chip seen from below in its own light, cold vapour curling around it. On
// "hums" the rig shivers and the chip's lit qubits stream down out of it and gather into the outline of a toothed
// key; on the anchor ("falls") the key is solid gold and drops, turning, in slow motion through the vapour toward a
// frosted padlock waiting below, the camera tilting down after it.
import * as THREE from 'three';
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import { clamp, ease, hexToLinear, lerp, mulberry32, prog } from '../engine/util';
import { LibScene, hit } from './_lib';
import { Stage, keyShape, backdrop, camKeys, colors, depthAlpha, dust, envProbe, lin, padlock, fitOf } from './harvest-remix-kit';

export const schema: SceneSchema = {
  description: 'Under the chandelier\'s gold chip in its own light, vapour curling: on "hums" the rig shivers and the lit qubits stream out and gather into a toothed key; on the anchor the key turns solid gold and falls in slow motion through the vapour toward a frosted padlock below. Harvest remix.',
  kinds: ['song'],
  lyrics: 'layer',
  entry: {},
  cue: {
    hums: { type: 'string', default: 'hums', description: 'the word of the line on which the qubits leave the chip' },
  },
  example: { entry: {}, cues: [{}] },
};

interface C { hums: string }

const CHIP_Y = 3.0, KEY_Y = 2.35, LOCK_Y = -0.2;
const NG = 18; // the chip's qubit grid


const VAPOR_V = /* glsl */ `
precision highp float;
in vec3 position; in vec2 uv;
uniform mat4 modelViewMatrix, projectionMatrix;
out vec2 vUv; out float vD;
void main() { vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }`;

export default class HarvestRemixKey extends LibScene<Record<string, never>, C> {
  static schema = schema;
  private st = new Stage(34, 0.03, 100);
  private rig = new THREE.Group();
  private dots!: THREE.InstancedMesh;
  private from: THREE.Vector3[] = []; private to: THREE.Vector3[] = [];
  private key = new THREE.Group(); private keyMat!: THREE.MeshPhysicalMaterial;
  private keyU!: Record<string, THREE.IUniform>;
  private vapors: { m: THREE.Mesh; u: Record<string, THREE.IUniform> }[] = [];
  private glow = new THREE.PointLight(0xffffff, 0, 8, 1.4);
  private motes!: ReturnType<typeof dust>;
  private back!: ReturnType<typeof backdrop>;
  private S = 0; private E = 0; private aHums = 1e9; private aFall = 1e9;
  private c = colors(this.ctx.style, 'amber');

  override setup() {
    this.st.fit = fitOf(this.ctx.style);
    this.S = this.ctx.start; this.E = this.ctx.end;
    const cue = this.cues[0];
    this.c = colors(this.ctx.style, cue?.def.palette ?? 'amber');
    const hums = cue ? this.cp(cue).hums : 'hums';
    this.aFall = cue?.at ?? this.E - 1.3;
    this.aHums = cue?.line?.words.find((w) => w.w.toLowerCase().startsWith(hums))?.start ?? this.aFall - 1.5;
    const r = this.ctx.renderer, sc = this.st.scene, c = this.c;
    sc.environment = envProbe(r, lin(c.bg, 0.5), [
      { w: 8, h: 2, p: [0, 9, 2], at: [0, 2, 0], c: lin(c.gold, 4) },
      { w: 12, h: 5, p: [0, -2, -8], at: [0, 2, 0], c: lin(c.accent, 1.2) },
      { w: 5, h: 5, p: [-7, 3, 4], at: [0, 2, 0], c: lin(c.accent2, 0.6) },
    ]);
    this.back = backdrop();
    (this.back.u.uTop!.value as THREE.Color).copy(lin(c.bg, 2));
    (this.back.u.uBot!.value as THREE.Color).copy(lin('#06101C', 0.8));
    (this.back.u.uGlowC!.value as THREE.Color).copy(lin(c.accent, 0.5));
    this.back.u.uGlow!.value = 1; this.back.u.uGlowR!.value = 0.35;
    sc.add(this.back.mesh);

    // the chip: a gold package under the last plate, a cold finger up into the dark
    const gold = new THREE.MeshPhysicalMaterial({ color: lin('#FFC86E'), metalness: 1, roughness: 0.22, envMapIntensity: 1.3 });
    const gU = depthAlpha(gold, { uRimCol: { value: lin(c.accent) } }, 'hr-key-gold');
    gU.uRim!.value = 0.4;
    const pkg = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.06, 0.62), gold);
    pkg.position.y = CHIP_Y;
    const finger = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3, 24), gold);
    finger.position.y = CHIP_Y + 1.5;
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.05, 96), gold);
    plate.position.y = CHIP_Y + 1.1;
    this.rig.add(pkg, finger, plate);
    sc.add(this.rig);

    // the qubits: dots on the chip's underside, which become the key
    const [bow, shaft] = keyShape();
    const keyPts: THREE.Vector3[] = [];
    const rnd = mulberry32(5);
    const inside = (x: number, y: number) => {
      const d = Math.hypot(x, y);
      if (d < 0.11 && d > 0.06) return true;
      if (Math.abs(x) < 0.026 && y < -0.1 && y > -0.53) return true;
      if (x > 0 && x < 0.09 && y < -0.38 && y > -0.53) return (Math.floor((-0.38 - y) / 0.034) % 2) === 0;
      return false;
    };
    while (keyPts.length < NG * NG) {
      const x = (rnd() - 0.5) * 0.24, y = 0.12 - rnd() * 0.66;
      if (inside(x, y)) keyPts.push(new THREE.Vector3(x, y, 0));
    }
    const dm = new THREE.MeshBasicMaterial({ color: 0xffffff });
    depthAlpha(dm, {}, 'hr-key-dot', false);
    this.dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0085, 10, 8), dm, NG * NG);
    this.dots.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(NG * NG * 3), 3);
    for (let j = 0; j < NG; j++) for (let i = 0; i < NG; i++) {
      this.from.push(new THREE.Vector3((i - (NG - 1) / 2) * 0.026, CHIP_Y - 0.035, (j - (NG - 1) / 2) * 0.026));
      this.to.push(keyPts[j * NG + i]!);
    }
    sc.add(this.dots);
    // the solid key
    this.keyMat = new THREE.MeshPhysicalMaterial({ color: lin('#FFC86E'), metalness: 1, roughness: 0.2, envMapIntensity: 1.5, transparent: false });
    this.keyU = depthAlpha(this.keyMat, { uRimCol: { value: lin(c.accent) } }, 'hr-key-key');
    for (const sh of [bow, shaft]) {
      const g = new THREE.ExtrudeGeometry(sh!, { depth: 0.022, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.005, bevelSegments: 3, curveSegments: 48 });
      g.translate(0, 0, -0.011);
      this.key.add(new THREE.Mesh(g, this.keyMat));
    }
    this.key.visible = false;
    sc.add(this.key);

    // the frosted padlock waiting below
    const frosted = new THREE.MeshPhysicalMaterial({ color: lin('#DCEFFF'), roughness: 0.5, transmission: 1, thickness: 0.6, attenuationColor: lin('#BFE6FF'), attenuationDistance: 1.2, envMapIntensity: 1.2 });
    depthAlpha(frosted, {}, 'hr-key-frost');
    const chrome = new THREE.MeshPhysicalMaterial({ color: lin('#E8EEF2'), metalness: 1, roughness: 0.4 });
    depthAlpha(chrome, {}, 'hr-key-chrome');
    const hole = new THREE.MeshBasicMaterial({ color: lin(c.bg, 0.5) });
    depthAlpha(hole, {}, 'hr-key-hole', false);
    const lk = padlock(0.5, frosted, chrome, hole);
    lk.g.position.set(0.1, LOCK_Y, 0.2);
    lk.g.rotation.x = -0.5;
    sc.add(lk.g);

    // vapour: soft noise sheets lit gold from above, at several depths
    for (let i = 0; i < 6; i++) {
      const u: Record<string, THREE.IUniform> = { uTime: { value: 0 }, uSeed: { value: i * 7.3 }, uCol: { value: lin(c.accent, 0.45) }, uAmt: { value: 0.28 } };
      const mat = new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3, vertexShader: VAPOR_V, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
        uniforms: u,
        fragmentShader: `precision highp float;\nin vec2 vUv; in float vD;\nout vec4 fragColor;\n${'' /* common below */}` + VAPOR_COMMON,
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.2), mat);
      m.position.set((i % 2 ? 0.4 : -0.4), CHIP_Y - 0.4 - i * 0.55, -0.8 + (i % 3) * 0.6);
      m.renderOrder = 30 + i;
      sc.add(m);
      this.vapors.push({ m, u });
    }
    this.glow.color.copy(lin(c.gold));
    this.glow.position.set(0, CHIP_Y - 0.3, 0.2);
    sc.add(this.glow);
    sc.add(new THREE.HemisphereLight(lin(c.gold), lin('#0A1A2C'), 0.4));
    this.motes = dust(600, [4, 5, 3], 12);
    (this.motes.u.uCol!.value as THREE.Color).copy(lin(c.gold, 1.2));
    this.motes.u.uSize!.value = 6;
    this.motes.pts.position.y = 1.5;
    sc.add(this.motes.pts);
  }

  /** Where the key hangs and how it is turned at t (before the fall: forming; after: falling in slow motion). */
  private keyAt(t: number) {
    const f = Math.max(0, t - this.aFall);
    const y = KEY_Y - 0.5 * 1.25 * f * f - 0.15 * f;
    return { y, spin: 0.6 * f + 0.25 * Math.sin(t * 0.8), tilt: 0.35 * f };
  }

  override draw() {}

  override render(f: Frame, out: THREE.WebGLRenderTarget) {
    const t = f.t, r = this.ctx.renderer, S = this.S, E = this.E, c = this.c, a = f.a;
    const k = this.keyAt(t);
    const cm = camKeys(t, [
      { t: S, c: [0.5, 1.75, 2.6], g: [0, CHIP_Y - 0.1, 0], fov: 34, ap: 22 },
      { t: this.aFall, c: [0.25, 1.85, 2.05], g: [0, KEY_Y - 0.15, 0], fov: 34, ap: 26, e: ease.inOutQuad },
      { t: E + 0.3, c: [0.2, 1.35, 2.1], g: [0, Math.min(KEY_Y - 0.2, k.y - 0.1), 0], fov: 34, ap: 26, e: ease.linear },
    ]);
    const focus = this.st.look(cm.c, cm.g, cm.fov);

    // the rig shivers on "hums"
    const hum = t > this.aHums ? Math.exp(-(t - this.aHums) / 1.0) * ease.outCubic(prog(t, this.aHums, this.aHums + 0.1)) : 0;
    this.rig.position.x = hum * 0.012 * Math.sin(t * 47) + 0.0015 * a.bass * Math.sin(t * 71);
    this.rig.position.z = hum * 0.009 * Math.cos(t * 41);

    // the qubits: lit on the chip, streaming down into the key shape, then the key is solid
    const form = ease.inOutCubic(prog(t, this.aHums + 0.1, this.aFall - 0.15));
    const solid = ease.outCubic(prog(t, this.aFall - 0.2, this.aFall + 0.08));
    const gold = hexToLinear(c.gold);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3(), col = new THREE.Color();
    this.key.position.set(0, k.y, 0);
    this.key.rotation.set(k.tilt, k.spin, 0.12 * Math.sin(t));
    this.key.updateMatrixWorld(true);
    for (let i = 0; i < this.from.length; i++) {
      const d = clamp(form * 1.25 - (i % 37) / 37 * 0.25);
      const dest = this.to[i]!.clone().applyMatrix4(this.key.matrixWorld);
      const src = this.from[i]!.clone().add(new THREE.Vector3(this.rig.position.x, 0, this.rig.position.z));
      p.lerpVectors(src, dest, ease.inOutQuad(d));
      p.y -= Math.sin(Math.PI * d) * 0.12;
      const v = (1 - solid) * (2.4 + 2 * hit(t, this.aHums, 0.3)) * (0.85 + 0.15 * Math.sin(t * 5 + i));
      sc.setScalar(1 - solid * 0.8);
      m.compose(p, q, sc);
      this.dots.setMatrixAt(i, m);
      col.setRGB(gold[0] * v, gold[1] * v, gold[2] * v);
      this.dots.setColorAt(i, col);
    }
    this.dots.instanceMatrix.needsUpdate = true;
    this.dots.instanceColor!.needsUpdate = true;
    this.key.visible = solid > 0.01;
    this.keyU.uRim!.value = 0.5 + 2.5 * hit(t, this.aFall, 0.3);
    (this.keyU.uGlow!.value as THREE.Color).setRGB(gold[0] * 0.25 * (1 - solid * 0.7), gold[1] * 0.25 * (1 - solid * 0.7), gold[2] * 0.25 * (1 - solid * 0.7));
    this.glow.intensity = 6 + 6 * hum + 10 * hit(t, this.aFall, 0.3);
    for (const v of this.vapors) v.u.uTime!.value = t;
    this.motes.u.uTime!.value = t;
    this.back.u.uTime!.value = t;
    (this.back.u.uGlowP!.value as THREE.Vector2).set(...this.st.uv([0, CHIP_Y, 0]));

    this.st.time = t;
    this.st.beams = [{ p: [0, CHIP_Y - 0.05, 0], d: [0, -1, 0.15], angle: 0.5, color: lin(c.gold, 0.7 + 0.8 * hum + 1.2 * hit(t, this.aFall, 0.3)), range: 4 }];
    this.st.fog = { density: 0.12, noise: 0.7, haze: 0, maxDist: 12 };
    this.st.render(r, out, {
      focus, ap: cm.ap, clear: [0, 0, 0],
      rays: { uv: this.st.uv([0, CHIP_Y, 0]), amt: 1.0 + 1.5 * hum, thr: 0.8, len: 0.8, decay: 0.97, rad: 0.4, tint: lin(c.gold, 0.9) },
      lens: 0.063, lensCol: lin(c.accent2, 0.5),
    });
    return {
      bloom: 0.75, bloomThreshold: 0.85, bloomRadius: 0.6, halation: 0.12, ca: 0.22, grain: 0.016, vignette: 0.48, hud: 0,
      shake: [hum * 6 * Math.sin(t * 40), hum * 4 * Math.cos(t * 37)] as [number, number],
      gain: [1.06, 1.0, 0.9] as [number, number, number], lift: [0.004, 0.003, 0.004] as [number, number, number], sat: 1.12,
    };
  }
}

const VAPOR_COMMON = /* glsl */ `
uniform float uTime, uSeed, uAmt;
uniform vec3 uCol;
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fb(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vn(p); p = p * 2.03 + 7.1; a *= 0.5; } return s; }
void main() {
  vec2 p = vUv * vec2(3.0, 1.6) + vec2(uSeed, 0.0);
  vec2 w = vec2(fb(p + vec2(uTime * 0.06, uTime * 0.03)), fb(p + 3.3 - vec2(uTime * 0.04, 0.0)));
  float n = fb(p + 1.6 * w + vec2(uTime * 0.05, 0.0));
  float edge = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x) * smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.6, vUv.y);
  float a = smoothstep(0.5, 0.95, n) * edge * uAmt * smoothstep(0.3, 1.0, vD);
  fragColor = vec4(uCol * a, 0.0);
}`;

void lerp;
