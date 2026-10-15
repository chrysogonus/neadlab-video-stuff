// Harvest Now, Decrypt Later (Banger Remix): the cable. The letter crossing the sea: the ocean floor at night, sand
// in long ripples, one armoured cable lying across it into the dark; on the cue's anchor a pulse of cyan light races
// along the cable past the camera and away into the deep, lighting the sand and the drifting marine snow as it goes.
import * as THREE from 'three';
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import { ease, hexToLinear, mulberry32 } from '../engine/util';
import { LibScene, hit } from './_lib';
import { Stage, camKeys, colors, depthAlpha, dust, envProbe, fitOf, lin } from './harvest-remix-kit';

export const schema: SceneSchema = {
  description: 'The ocean floor at night: rippled sand, an armoured cable running into the dark; on the anchor a pulse of cyan light races along it past the camera into the deep, lighting the sand and marine snow. Harvest remix.',
  kinds: ['song'],
  lyrics: 'layer',
  entry: {},
  cue: {},
  example: { entry: {}, cues: [{}] },
};

/** The cable's path over the sea floor (metres), from behind the camera into the deep. */
function path() {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 40; i++) {
    const z = 6 - i * 4;
    pts.push(new THREE.Vector3(Math.sin(i * 0.23) * 1.6 + i * 0.05, 0.12 + 0.05 * Math.sin(i * 0.9), z));
  }
  return new THREE.CatmullRomCurve3(pts);
}

export default class HarvestRemixCable extends LibScene {
  static schema = schema;
  private st = new Stage(30, 0.05, 400);
  private curve = path();
  private cableU: Record<string, THREE.IUniform> = { uRun: { value: -1 }, uGlowC: { value: new THREE.Color() }, uTrail: { value: 0 } };
  private glow = new THREE.PointLight(0xffffff, 0, 14, 1.6);
  private motes!: ReturnType<typeof dust>;
  private S = 0; private E = 0; private aRun = 0;
  private c = colors(this.ctx.style, 'frost');

  override setup() {
    this.st.fit = fitOf(this.ctx.style);
    this.S = this.ctx.start; this.E = this.ctx.end;
    this.aRun = this.cues[0]?.at ?? this.S + 0.3;
    const r = this.ctx.renderer, sc = this.st.scene, c = this.c;
    sc.environment = envProbe(r, lin('#010308'), [{ w: 30, h: 10, p: [0, 20, -10], at: [0, 0, 0], c: lin(c.deep, 0.6) }]);
    // the sea floor: rippled sand
    const g = new THREE.PlaneGeometry(80, 200, 320, 640);
    const p = g.getAttribute('position'), rnd = mulberry32(3);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i);
      const h = 0.06 * Math.sin(x * 2.2 + Math.sin(y * 0.3) * 1.5) + 0.25 * Math.sin(x * 0.15 + y * 0.05) + 0.02 * (rnd() - 0.5);
      p.setZ(i, h);
    }
    g.computeVertexNormals();
    // sand: grains, darker silt in the troughs, shell grit
    const sc2 = document.createElement('canvas'); sc2.width = 1024; sc2.height = 1024;
    const sg = sc2.getContext('2d')!;
    sg.fillStyle = '#8C9AA6'; sg.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 60000; i++) { const v = rnd(); sg.fillStyle = v < 0.5 ? `rgba(40,52,64,${0.08 + rnd() * 0.15})` : v < 0.95 ? `rgba(200,210,220,${0.06 + rnd() * 0.12})` : `rgba(230,225,210,${0.3 + rnd() * 0.4})`; sg.fillRect(rnd() * 1024, rnd() * 1024, 1 + rnd() * 2, 1 + rnd() * 2); }
    for (let i = 0; i < 90; i++) { sg.fillStyle = `rgba(30,40,52,${0.05 + rnd() * 0.08})`; sg.beginPath(); sg.ellipse(rnd() * 1024, rnd() * 1024, 30 + rnd() * 120, 10 + rnd() * 40, rnd() * 3, 0, Math.PI * 2); sg.fill(); }
    const sandT = new THREE.CanvasTexture(sc2); sandT.colorSpace = THREE.SRGBColorSpace; sandT.wrapS = sandT.wrapT = THREE.RepeatWrapping; sandT.repeat.set(20, 50); sandT.anisotropy = 8;
    const sand = new THREE.MeshStandardMaterial({ map: sandT, bumpMap: sandT, bumpScale: 1.5, roughness: 0.95, envMapIntensity: 0.5 });
    depthAlpha(sand, {}, 'hr-cab-sand');
    const floor = new THREE.Mesh(g, sand);
    floor.rotation.x = -Math.PI / 2; floor.position.z = -80;
    floor.receiveShadow = true;
    sc.add(floor);
    // the cable: dark armour wires wound round it, a seam of glass inside that carries the light
    const stripes = document.createElement('canvas'); stripes.width = 1024; stripes.height = 64;
    const sx = stripes.getContext('2d')!;
    for (let x = 0; x < 1024; x += 8) { sx.fillStyle = x % 16 ? '#3A4048' : '#262A30'; sx.save(); sx.transform(1, 0, -0.6, 1, 0, 0); sx.fillRect(x, 0, 8, 64); sx.restore(); }
    const st = new THREE.CanvasTexture(stripes); st.wrapS = st.wrapT = THREE.RepeatWrapping; st.repeat.set(160, 1); st.colorSpace = THREE.SRGBColorSpace;
    const armour = new THREE.MeshStandardMaterial({ map: st, roughness: 0.5, metalness: 0.7, envMapIntensity: 0.8 });
    const U = this.cableU;
    armour.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vDepthA; varying float vRunU;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvDepthA = -mvPosition.z; vRunU = uv.x;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vDepthA; varying float vRunU; uniform float uRun, uTrail; uniform vec3 uGlowC;')
        .replace('#include <dithering_fragment>', `#include <dithering_fragment>
float dr = vRunU - uRun;
float pulse = exp(-dr * dr / 0.000012) * 5.0 + (dr < 0.0 ? exp(dr / 0.035) * uTrail : 0.0);
gl_FragColor.rgb += uGlowC * pulse;
gl_FragColor.a = vDepthA;`);
    };
    armour.customProgramCacheKey = () => 'hr-cab-armour';
    const cable = new THREE.Mesh(new THREE.TubeGeometry(this.curve, 800, 0.11, 20), armour);
    cable.castShadow = true;
    sc.add(cable);
    this.seabed(sc);
    this.glow.color.copy(lin(c.ice));
    sc.add(this.glow);
    sc.add(new THREE.HemisphereLight(lin('#1A3A70'), lin('#000000'), 0.25));
    // the survey vehicle's lamps, just above and behind the camera: a cool pool on the sand
    const rov = new THREE.SpotLight(lin('#CFE6FF'), 40, 30, 0.55, 0.6, 1.4);
    rov.position.set(1.8, 2.2, 5); rov.target.position.set(0.3, 0, -5); rov.castShadow = true; rov.shadow.mapSize.set(2048, 2048);
    sc.add(rov, rov.target);
    const top = new THREE.DirectionalLight(lin('#4A7AD0'), 0.9); top.position.set(2, 10, -6); sc.add(top);
    this.motes = dust(2500, [16, 8, 40], 9);
    (this.motes.u.uCol!.value as THREE.Color).copy(lin('#BFD8F0', 0.9));
    this.motes.u.uSize!.value = 6;
    (this.motes.u.uDrift!.value as THREE.Vector3).set(0.05, -0.12, 0.02);
    this.motes.pts.position.set(0, 3, -12);
    sc.add(this.motes.pts);
  }

  /** What lies on the bottom: rocks half sunk in the sand, a repeater housing on the cable with its clamps, tube worms. */
  private seabed(sc: THREE.Scene) {
    const rnd = mulberry32(12);
    const rockM = new THREE.MeshStandardMaterial({ color: lin('#2E353C'), roughness: 0.8, envMapIntensity: 0.4 });
    depthAlpha(rockM, {}, 'hr-cab-rock');
    for (let i = 0; i < 70; i++) {
      const g = new THREE.IcosahedronGeometry(0.15 + Math.pow(rnd(), 3) * 1.2, 4);
      const p = g.getAttribute('position');
      const ph = rnd() * 10;
      for (let k = 0; k < p.count; k++) {
        // a lumpy stone: the same displacement for every copy of a vertex (the faces stay joined)
        const x = p.getX(k), y = p.getY(k), z = p.getZ(k), l = Math.hypot(x, y, z) || 1;
        const f = 1 + 0.22 * Math.sin(x / l * 3.1 + ph) * Math.sin(y / l * 2.7 + ph * 1.3) + 0.12 * Math.sin(z / l * 5.3 + ph * 0.7);
        p.setXYZ(k, x * f, y * f * 0.6, z * f);
      }
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, rockM);
      const nearR = i < 30, z = nearR ? 2 - rnd() * 18 : 4 - rnd() * 110, side = rnd() < 0.5 ? -1 : 1;
      m.position.set(side * (nearR ? 0.7 + rnd() * 3.5 : 0.8 + rnd() * 9), -0.05, z); m.rotation.set(rnd(), rnd() * 6, rnd());
      m.castShadow = true; m.receiveShadow = true; sc.add(m);
    }
    // the repeater: a steel cylinder in the cable's line, tapered ends, two clamps either side
    const steel = new THREE.MeshStandardMaterial({ color: lin('#5A646E'), roughness: 0.35, metalness: 0.85, envMapIntensity: 0.9 });
    depthAlpha(steel, {}, 'hr-cab-steel');
    const u = 0.055, at = this.curve.getPointAt(u), tan = this.curve.getTangentAt(u);
    const rep = new THREE.Mesh(new THREE.LatheGeometry([[0.11, -0.9], [0.2, -0.75], [0.26, -0.6], [0.26, 0.6], [0.2, 0.75], [0.11, 0.9]].map(([x, y]) => new THREE.Vector2(x!, y!)), 40), steel);
    rep.position.copy(at); rep.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan);
    rep.castShadow = true; sc.add(rep);
    for (const k of [-0.62, -0.3, 0.3, 0.62]) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.025, 8, 40), steel);
      band.position.copy(at).addScaledVector(tan, k); band.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan); sc.add(band);
    }
    // tube worms: thin pale tubes in clusters, their crowns catching the light
    const tube = new THREE.MeshStandardMaterial({ color: lin('#C8C0B0'), roughness: 0.6 });
    const crown = new THREE.MeshStandardMaterial({ color: lin('#B3122E'), roughness: 0.4, emissive: lin('#3A0408') });
    depthAlpha(tube, {}, 'hr-cab-tube'); depthAlpha(crown, {}, 'hr-cab-crown');
    for (let k = 0; k < 6; k++) {
      const cx = (rnd() < 0.5 ? -1 : 1) * (1.2 + rnd() * 4), cz = -2 - rnd() * 40;
      for (let j = 0; j < 7; j++) {
        const h = 0.15 + rnd() * 0.35, w = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, h, 8), tube);
        const x = cx + (rnd() - 0.5) * 0.4, z = cz + (rnd() - 0.5) * 0.4;
        w.position.set(x, h / 2, z); w.rotation.set((rnd() - 0.5) * 0.3, 0, (rnd() - 0.5) * 0.3); sc.add(w);
        const cr = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 6), crown); cr.position.set(x, h, z); sc.add(cr);
      }
    }
  }

  override draw() {}

  override render(f: Frame, out: THREE.WebGLRenderTarget) {
    const t = f.t, r = this.ctx.renderer, S = this.S, E = this.E, c = this.c;
    const cm = camKeys(t, [
      { t: S, c: [1.3, 0.75, 3.4], g: [0.2, 0.15, -6], fov: 34, ap: 14 },
      { t: E + 0.3, c: [1.0, 0.7, 1.8], g: [0.3, 0.12, -8], fov: 34, ap: 14, e: ease.linear },
    ]);
    const focus = this.st.look(cm.c, cm.g, cm.fov);
    // the pulse: from behind the camera, away down the cable (curve parameter u)
    const run = 0.004 + (t - this.aRun) * 0.07;
    this.cableU.uRun!.value = t >= this.aRun - 0.3 ? run : -1;
    this.cableU.uTrail!.value = t >= this.aRun ? 1.2 : 0;
    const ice = hexToLinear(c.ice);
    (this.cableU.uGlowC!.value as THREE.Color).setRGB(ice[0], ice[1], ice[2]);
    const pp = this.curve.getPointAt(Math.min(0.999, Math.max(0, run)));
    this.glow.position.set(pp.x, pp.y + 0.35, pp.z);
    this.glow.intensity = t >= this.aRun - 0.3 && run < 1 ? 2.5 + 3 * Math.min(1, (t - this.aRun) / 0.8) : 0;
    this.st.time = t;
    this.st.beams = [
      { p: [pp.x, pp.y + 0.2, pp.z], d: [0, 1, 0], angle: 1.4, color: lin(c.ice, 1.4 * (run < 1 && t >= this.aRun - 0.3 ? 1 : 0)), range: 2.5 },
      { p: [-3, 30, -14], d: [0.1, -1, 0.05], angle: 0.12, color: lin(c.deep, 0.5), range: 60 },
      { p: [4, 30, -26], d: [-0.05, -1, 0.1], angle: 0.1, color: lin(c.deep, 0.35), range: 60 },
    ];
    this.st.fog = { density: 0.06, noise: 0.5, haze: 0.01, hazeColor: lin(c.deep, 1), maxDist: 60, drift: [0.05, -0.02, 0.03] };
    this.motes.u.uTime!.value = t;
    this.st.render(r, out, { focus, ap: cm.ap, clear: [0, 0, 0] });
    return {
      bloom: 0.75, bloomThreshold: 0.8, bloomRadius: 0.65, halation: 0, ca: 0.15, grain: 0.016, vignette: 0.55, hud: 0,
      gain: [0.9, 1.0, 1.12] as [number, number, number], lift: [0, 0.003, 0.012] as [number, number, number], sat: 1.1,
      streak: 0.5 + 0.6 * hit(t, this.aRun, 0.3),
    };
  }
}
