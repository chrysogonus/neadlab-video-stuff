// Harvest Now, Decrypt Later (Banger Remix): the calendar. "Pushed to next quarter, four years in a row": a desk
// calendar of quarters in office daylight, sun striped by the blinds across the desk; its pages tear away one after
// another in a gust, Q3 2022 to Q2 2026, tumbling past the camera.
import * as THREE from 'three';
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import { F, font } from '../engine/type';
import { ease, mulberry32 } from '../engine/util';
import { LibScene } from './_lib';
import { Stage, camKeys, depthAlpha, dust, envProbe, fitOf, lin, paperMaterial, woodTexture } from './harvest-remix-kit';

export const schema: SceneSchema = {
  description: 'A desk calendar of quarters in office daylight striped by blinds; its pages tear away one after another in a gust (Q3 2022 to Q2 2026) and tumble past the camera. Harvest remix.',
  kinds: ['song'],
  lyrics: 'layer',
  entry: {
    from: { type: 'string', default: 'Q3 2022', description: 'the first quarter' },
    pages: { type: 'number', default: 16, description: 'how many quarters tear away' },
  },
  cue: {},
  example: { entry: {}, cues: [{}] },
};

interface P { from: string; pages: number }

const PW = 1.2, PH = 0.9;

const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

/** A page of the quarter planner: a red band, the quarter big, its three months as real calendars (weeks from Monday),
 *  and, in the defenders' red pen, "PQC migration" written in and pushed on to the next quarter. */
function pageTexture(qi: number, yr: number, last: boolean) {
  const w = 1024, h = 768, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d')!;
  c.fillStyle = '#F7F5F0'; c.fillRect(0, 0, w, h);
  const rnd = mulberry32(qi * 31 + yr);
  for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(${rnd() < 0.5 ? '120,100,70' : '255,255,255'},0.05)`; c.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1); }
  c.fillStyle = '#C2361F'; c.fillRect(0, 0, w, 84);
  c.fillStyle = '#FFF8F0'; c.font = font(F.archivo(100, 700), 30); c.textBaseline = 'middle'; c.textAlign = 'left';
  c.fillText('PLANNING  ·  PLATFORM SECURITY', 36, 44);
  c.textAlign = 'right'; c.font = font(F.mono(500), 22); c.fillText(`WEEK ${String(1 + qi * 13).padStart(2, '0')}–${String(13 + qi * 13).padStart(2, '0')}`, w - 36, 44);
  c.fillStyle = 'rgba(20,22,26,0.18)'; for (let k = 0; k < 17; k++) { c.beginPath(); c.arc(40 + k * 59, 100, 7, 0, Math.PI * 2); c.fill(); } // the binding holes
  c.fillStyle = '#14161A'; c.font = font(F.archivo(100, 900), 150); c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  c.fillText(`Q${qi + 1} ${yr}`, w / 2, 268);
  // the three months
  for (let m = 0; m < 3; m++) {
    const mo = qi * 3 + m, x0 = 48 + m * 318, y0 = 336;
    c.textAlign = 'left'; c.fillStyle = '#C2361F'; c.font = font(F.archivo(100, 700), 22); c.fillText(MONTHS[mo]!, x0, y0);
    c.font = font(F.mono(500), 15); c.fillStyle = '#6E6A62';
    'MTWTFSS'.split('').forEach((d, i) => c.fillText(d, x0 + i * 40 + 6, y0 + 34));
    const first = (new Date(Date.UTC(yr, mo, 1)).getUTCDay() + 6) % 7, days = new Date(Date.UTC(yr, mo + 1, 0)).getUTCDate();
    c.font = font(F.mono(400), 19);
    for (let d = 0; d < days; d++) {
      const cell = first + d, x = x0 + (cell % 7) * 40, y = y0 + 70 + Math.floor(cell / 7) * 34;
      c.fillStyle = cell % 7 >= 5 ? '#B04A38' : '#2E2C28';
      c.fillText(String(d + 1).padStart(2, ' '), x, y);
    }
  }
  // the red pen: the migration written in, struck through, and an arrow to the next quarter
  c.save();
  c.translate(470, 690); c.rotate(-0.04);
  c.fillStyle = '#B3122E'; c.strokeStyle = '#B3122E'; c.font = font(F.hand(), 52); c.textAlign = 'left';
  c.fillText(last ? 'PQC migration ??' : 'PQC migration', 0, 0);
  if (!last) {
    c.lineWidth = 4; c.beginPath(); c.moveTo(-6, -16); c.lineTo(300, -20); c.stroke();
    c.font = font(F.hand(), 40); c.fillText('→ next Q', 320, 4);
  }
  c.restore();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

function blinds() {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512;
  const c = cv.getContext('2d')!;
  c.fillStyle = '#000'; c.fillRect(0, 0, 512, 512);
  c.fillStyle = '#fff'; for (let y = 0; y < 512; y += 40) c.fillRect(0, y, 512, 24);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

interface Page { m: THREE.Mesh; at: number; v: THREE.Vector3; w: THREE.Vector3 }

export default class HarvestRemixCalendar extends LibScene<P> {
  static schema = schema;
  private st = new Stage(32, 0.03, 100);
  private pages: Page[] = [];
  private motes!: ReturnType<typeof dust>;
  private S = 0; private E = 0;

  override setup() {
    this.st.fit = fitOf(this.ctx.style);
    this.S = this.ctx.start; this.E = this.ctx.end;
    const r = this.ctx.renderer, sc = this.st.scene;
    r.shadowMap.enabled = true;
    sc.environment = envProbe(r, lin('#C9CDD0', 0.5), [
      { w: 8, h: 6, p: [6, 4, -2], at: [0, 0, 0], c: lin('#FFF4E0', 3) },
      { w: 20, h: 4, p: [0, 9, 2], at: [0, 0, 0], c: lin('#EEF2F4', 1.2) },
    ]);
    sc.background = null;
    // the desk and a wall behind
    const wood = new THREE.MeshStandardMaterial({ map: woodTexture('#8A6A4A', 4, 2), roughness: 0.42, envMapIntensity: 0.6 });
    const wallM = new THREE.MeshStandardMaterial({ color: lin('#D9DEE0'), roughness: 0.9, envMapIntensity: 0.4 });
    depthAlpha(wood, {}, 'hr-cal-wood'); depthAlpha(wallM, {}, 'hr-cal-wall');
    const desk = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), wood); desk.rotation.x = -Math.PI / 2; desk.receiveShadow = true; sc.add(desk);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), wallM); wall.position.set(0, 4, -2.5); wall.receiveShadow = true; sc.add(wall);
    this.props(sc);
    // the calendar: an easel base, the pages stacked on it, the last quarter at the bottom
    const base = new THREE.Mesh(new THREE.BoxGeometry(PW + 0.1, 0.06, 0.5), new THREE.MeshStandardMaterial({ color: lin('#2A2E33'), roughness: 0.5 }));
    depthAlpha(base.material as THREE.Material, {}, 'hr-cal-base');
    base.position.set(0, 0.03, 0); base.castShadow = true; sc.add(base);
    const n = Math.max(1, this.P.pages);
    const [q0, y0] = this.P.from.split(' ').map((x, i) => (i ? Number(x) : Number(x.replace('Q', '')))) as [number, number];
    const span = this.E - this.S - 0.25;
    for (let i = 0; i <= n; i++) {
      const qi = (q0 - 1 + i) % 4, yi = y0 + Math.floor((q0 - 1 + i) / 4);
      const m = paperMaterial(pageTexture(qi, yi, i === n));
      m.side = THREE.DoubleSide;
      depthAlpha(m, {}, 'hr-cal-page');
      const g = new THREE.PlaneGeometry(PW, PH); g.translate(0, -PH / 2, 0); // hinged at its top edge
      const pm = new THREE.Mesh(g, m);
      pm.castShadow = true; pm.receiveShadow = true;
      pm.position.set(0, PH + 0.08, -0.002 * i);
      pm.rotation.x = -0.25;
      sc.add(pm);
      const rnd = mulberry32(100 + i);
      this.pages.push({ m: pm, at: this.S + 0.05 + (i / n) * span * (0.6 + 0.4 * (i / n)), v: new THREE.Vector3(1.6 + rnd() * 1.4, 0.8 + rnd() * 1.2, 1.4 + rnd() * 1.2), w: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(9) });
    }
    this.pages.at(-1)!.at = 1e9; // the last quarter stays
    // the sun through the blinds
    const sun = new THREE.SpotLight(lin('#FFF1DA'), 115, 30, 0.5, 0.3, 1.0);
    sun.position.set(5, 5, 3); sun.target.position.set(0, 0.5, 0);
    sun.map = blinds(); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0003;
    sc.add(sun, sun.target);
    sc.add(new THREE.HemisphereLight(lin('#EEF2F6'), lin('#8A7A66'), 0.7));
    this.motes = dust(800, [6, 3, 4], 2);
    (this.motes.u.uCol!.value as THREE.Color).copy(lin('#FFF1DA', 1.2));
    this.motes.u.uSize!.value = 6;
    this.motes.pts.position.set(0, 1.2, 0.5);
    sc.add(this.motes.pts);
  }

  /** What else is on the desk: a coffee mug, a pen, a notepad with a to-do list, a stack of printouts, a keyboard. */
  private props(sc: THREE.Scene) {
    const add = (m: THREE.Mesh, key: string) => { depthAlpha(m.material as THREE.Material, {}, key); m.castShadow = true; m.receiveShadow = true; sc.add(m); return m; };
    // the mug: a lathed ceramic cup, coffee in it, a handle
    const ceramic = new THREE.MeshPhysicalMaterial({ color: lin('#ECE8E1'), roughness: 0.25, clearcoat: 0.6, clearcoatRoughness: 0.2 });
    const prof = [[0, 0], [0.042, 0], [0.046, 0.004], [0.047, 0.11], [0.044, 0.112], [0.041, 0.106], [0.04, 0.012], [0, 0.012]].map(([x, y]) => new THREE.Vector2(x, y));
    const mug = add(new THREE.Mesh(new THREE.LatheGeometry(prof, 48), ceramic), 'hr-cal-mug');
    mug.position.set(-0.78, 0, 0.42); mug.scale.setScalar(1.6);
    const coffee = add(new THREE.Mesh(new THREE.CircleGeometry(0.04, 32), new THREE.MeshStandardMaterial({ color: lin('#2A160A'), roughness: 0.1 })), 'hr-cal-coffee');
    coffee.rotation.x = -Math.PI / 2; coffee.position.set(0, 0.09, 0); mug.add(coffee);
    const handle = add(new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.0065, 12, 24, Math.PI * 1.2), ceramic), 'hr-cal-mug');
    handle.position.set(0.047, 0.06, 0); handle.rotation.z = -Math.PI * 0.6; mug.add(handle);
    // the pen
    const penM = new THREE.MeshStandardMaterial({ color: lin('#1B2433'), roughness: 0.3, metalness: 0.4 });
    const pen = add(new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.15, 16), penM), 'hr-cal-pen');
    pen.rotation.set(Math.PI / 2, 0, 0.9); pen.position.set(0.62, 0.006, 0.55);
    const tip = add(new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.02, 16), new THREE.MeshStandardMaterial({ color: lin('#C9A45C'), metalness: 0.9, roughness: 0.25 })), 'hr-cal-tip');
    tip.position.set(0, -0.085, 0); tip.rotation.x = Math.PI; pen.add(tip);
    // the notepad: a to-do list in the hand
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 640;
    const c = cv.getContext('2d')!;
    c.fillStyle = '#FBF7E4'; c.fillRect(0, 0, 512, 640);
    c.strokeStyle = 'rgba(80,120,180,0.25)'; c.lineWidth = 2;
    for (let y = 120; y < 640; y += 52) { c.beginPath(); c.moveTo(0, y); c.lineTo(512, y); c.stroke(); }
    c.strokeStyle = 'rgba(200,60,60,0.35)'; c.beginPath(); c.moveTo(70, 0); c.lineTo(70, 640); c.stroke();
    c.fillStyle = '#1F2A44'; c.font = font(F.hand(), 46);
    ['TODO', '✓ renew certs', '✓ team lunch', '– PQC migration', '   (next quarter)', '✓ fix VPN'].forEach((l, i) => c.fillText(l, 84, 100 + i * 52));
    c.strokeStyle = '#1F2A44'; c.lineWidth = 3; c.beginPath(); c.moveTo(84, 106); c.lineTo(180, 106); c.stroke();
    const padTex = new THREE.CanvasTexture(cv); padTex.colorSpace = THREE.SRGBColorSpace; padTex.anisotropy = 8;
    const pad = add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.012, 0.25), [paperMaterial(null, 0xf3eedc), paperMaterial(null, 0xf3eedc), paperMaterial(padTex), paperMaterial(null, 0xf3eedc), paperMaterial(null, 0xf3eedc), paperMaterial(null, 0xf3eedc)] as unknown as THREE.Material), 'hr-cal-pad');
    for (const m of pad.material as unknown as THREE.Material[]) depthAlpha(m, {}, 'hr-cal-pad');
    pad.position.set(0.78, 0.006, 0.3); pad.rotation.y = -0.25;
    // a stack of printouts, slightly askew
    for (let i = 0; i < 4; i++) {
      const sh = add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.003, 0.42), paperMaterial(null, 0xf4f2ee)), 'hr-cal-print');
      sh.position.set(-1.15, 0.002 + i * 0.003, 0.05); sh.rotation.y = 0.2 + (i - 1.5) * 0.04;
    }
  }

  override draw() {}

  override render(f: Frame, out: THREE.WebGLRenderTarget) {
    const t = f.t, r = this.ctx.renderer, S = this.S, E = this.E;
    for (const p of this.pages) {
      const u = t - p.at;
      if (u <= 0) { p.m.position.set(0, PH + 0.08, p.m.position.z); p.m.rotation.set(-0.25, 0, 0); continue; }
      // torn at the top, lifted by the gust, tumbling away to the right past the camera
      const tear = ease.outCubic(Math.min(1, u / 0.12));
      p.m.position.set(p.v.x * u + 0.6 * u * u, PH + 0.08 + p.v.y * u, p.v.z * u * tear);
      p.m.rotation.set(-0.25 - 2.2 * tear + p.w.x * u * 0.4, p.w.y * u * 0.5, p.w.z * u * 0.6);
      p.m.visible = u < 2.5;
    }
    const cm = camKeys(t, [
      { t: S, c: [-0.5, 0.75, 2.6], g: [0.1, 0.55, 0], fov: 32, ap: 14 },
      { t: E + 0.3, c: [-0.35, 0.7, 2.3], g: [0.15, 0.55, 0], fov: 32, ap: 14, e: ease.linear },
    ]);
    const focus = this.st.look(cm.c, cm.g, cm.fov);
    this.st.time = t;
    this.st.beams = [{ p: [5, 5, 3], d: [-5, -4.5, -3], angle: 0.3, color: lin('#FFF1DA', 0.35), range: 10 }];
    this.st.fog = { density: 0.05, noise: 0.6, haze: 0, maxDist: 12 };
    this.motes.u.uTime!.value = t;
    this.st.render(r, out, { focus, ap: cm.ap, clear: [0.6, 0.6, 0.6] });
    return {
      bloom: 0.35, bloomThreshold: 1.0, bloomRadius: 0.6, halation: 0, ca: 0.1, grain: 0.014, vignette: 0.35, hud: 0,
      gain: [1.03, 1.0, 0.96] as [number, number, number], lift: [0.004, 0.004, 0.005] as [number, number, number], sat: 1.05,
      streak: 0.15,
    };
  }
}
