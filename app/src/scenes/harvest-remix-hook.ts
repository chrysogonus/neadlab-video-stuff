// Harvest Now, Decrypt Later (Banger Remix): the hook. The video's one lyric set as type: a wall of frosted glass
// fills the frame, faintly gold from a light behind it, and each word of "Harvest now, decrypt later" is cut through
// the ice as it is sung, the gold light blazing through the letters and out in shafts. The anchor word and the
// last word land hardest: cracks run out across the frost from them and frost dust shakes loose.
//
// A fullscreen shader (the glass, the light through the cuts) over two Canvas2D masks (the letters; their glow and
// the cracks), finished by the stage's light shafts; the frost dust is a third layer, added.
import * as THREE from 'three';
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import { FSPass, Layer2D } from '../engine/gl';
import { F, font, measure, textPoints } from '../engine/type';
import { clamp, ease, hexToLinear, lerp, mulberry32, prog } from '../engine/util';
import { LibScene, W, H, hit } from './_lib';
import { Stage, colors, lensFrostTexture, lin, fitOf } from './harvest-remix-kit';
import type { Word } from '../engine/lyrics';

export const schema: SceneSchema = {
  description: 'The hook cut through a wall of frosted glass: each word of the sung line is cut through the ice as it is sung, gold light blazing through the letters and out in shafts; the anchor and last words crack the frost around them and shake frost dust loose. Draws the lyric itself. Harvest remix.',
  kinds: ['song'],
  lyrics: 'own',
  entry: {},
  cue: {},
  example: { entry: {}, cues: [{}] },
};

const GLASS_F = /* glsl */ `
uniform sampler2D tMask, tHalo, tFrost;
uniform vec3 uGold, uBg, uIce;
uniform float uTime, uZoom, uBack, uCut;
void main() {
  vec2 uv = (vUv - 0.5) / uZoom + 0.5;
  uv.x += (uv.y - 0.5) * 0.02;
  vec2 p = (uv - vec2(0.45, 0.55)) * vec2(${(W / H).toFixed(4)}, 1.0);
  // the frost: a milky layer with crystals, lit from behind (brighter toward the light)
  float n = fbm(uv * vec2(9.0, 5.0) + 3.1, 4);
  float cr = texture(tFrost, uv * 0.9 + 0.05).r;
  float back = exp(-dot(p, p) / 0.35) * uBack;
  float fine = fbm(uv * vec2(60.0, 34.0) + 7.0, 2);
  vec3 glass = uBg * 0.6 + uIce * (0.025 + 0.06 * cr + 0.012 * n + 0.01 * fine) + uGold * (0.02 + 0.07 * cr + 0.015 * n) * (0.3 + back);
  float m = texture(tMask, uv).r;
  vec3 halo = texture(tHalo, uv).rgb;
  // the cuts: clear ice, the light pouring through (hot at the centre of each stroke)
  vec3 cut = mix(uGold, vec3(1.0, 0.92, 0.75), 0.25) * (1.7 + 0.3 * n) * uCut * (0.75 + 0.35 * back);
  vec3 col = mix(glass, cut, m);
  // around the cuts and along the cracks the frost is shattered and lit
  col += uGold * halo.r * (0.45 + 0.6 * cr) * (1.0 - m) + mix(uGold, vec3(1.0), 0.4) * 1.6 * halo.g * (1.0 - m);
  fragColor = vec4(col, 1000.0);
}`;

interface Placed { w: Word; text: string; x: number; y: number; size: number; hard: boolean }

export default class HarvestRemixHook extends LibScene {
  static schema = schema;
  private st = new Stage();
  private glass!: FSPass;
  private mask = new Layer2D();
  private halo = new Layer2D(W / 2, H / 2, 1);
  private spark = new Layer2D();
  private words: Placed[] = [];
  private bursts: { at: number; pts: { x: number; y: number; vx: number; vy: number; s: number }[] }[] = [];
  private cracks: { at: number; segs: [number, number, number, number, number][] }[] = [];
  private fam = F.archivo(87, 900);
  private c = colors(this.ctx.style, 'amber');

  override setup() {
    this.st.fit = fitOf(this.ctx.style);
    const cue = this.cues[0];
    this.c = colors(this.ctx.style, cue?.def.palette ?? 'amber');
    const ws = cue?.line?.words ?? [];
    // two rows: the first half of the words, then the rest, left aligned, as large as fits
    const half = Math.ceil(ws.length / 2);
    const rows = [ws.slice(0, half), ws.slice(half)];
    const txt = (w: Word) => w.w.toUpperCase();
    let size = 300;
    const rowW = (row: Word[], s: number) => measure(row.map(txt).join(' '), this.fam, s);
    while (size > 80 && Math.max(...rows.map((r) => rowW(r, size))) > W - 300) size -= 4;
    const lineH = size * 0.9, top = H / 2 - lineH / 2 + size * 0.36 - 20;
    const anchor = cue?.word;
    rows.forEach((row, ri) => {
      let x = 150;
      for (const w of row) {
        const t = txt(w);
        this.words.push({ w, text: t, x, y: top + ri * lineH, size, hard: w === anchor || w === ws.at(-1) });
        x += measure(`${t} `, this.fam, size);
      }
    });
    // the hard words: frost dust from inside their letters, cracks out from their edges
    const rnd = mulberry32(9);
    for (const p of this.words.filter((q) => q.hard)) {
      const pts = textPoints(p.text, this.fam, p.size, 14, 3).map((q) => ({
        x: p.x + q.x, y: p.y + q.y, vx: (rnd() - 0.5) * 160, vy: -60 - rnd() * 220, s: 1.2 + rnd() * 2.2,
      }));
      this.bursts.push({ at: p.w.start, pts });
      const ww = measure(p.text, this.fam, p.size), segs: [number, number, number, number, number][] = [];
      for (let k = 0; k < 7; k++) {
        let x = p.x + rnd() * ww, y = p.y - p.size * (rnd() < 0.5 ? 0.74 : -0.02);
        let a = (y < p.y - p.size * 0.4 ? -1 : 1) * (Math.PI / 2) + (rnd() - 0.5) * 2.0, s = 0;
        const n = 4 + Math.floor(rnd() * 5);
        for (let i = 0; i < n; i++) {
          const L = 14 + rnd() * 30, nx = x + Math.cos(a) * L, ny = y + Math.sin(a) * L;
          segs.push([x, y, nx, ny, s]); s += L; x = nx; y = ny; a += (rnd() - 0.5) * 0.5;
          if (rnd() < 0.3) { const b = a + (rnd() < 0.5 ? 0.8 : -0.8), bl = 10 + rnd() * 18; segs.push([x, y, x + Math.cos(b) * bl, y + Math.sin(b) * bl, s]); }
        }
      }
      this.cracks.push({ at: p.w.start, segs });
    }
    this.glass = new FSPass(GLASS_F, {
      tMask: { value: this.mask.texture }, tHalo: { value: this.halo.texture }, tFrost: { value: lensFrostTexture(31) },
      uGold: { value: new THREE.Vector3(...hexToLinear(this.c.accent)) }, uBg: { value: new THREE.Vector3(...hexToLinear(this.c.bg)) },
      uIce: { value: new THREE.Vector3(...hexToLinear(this.c.accent2)) },
      uTime: { value: 0 }, uZoom: { value: 1 }, uBack: { value: 1 }, uCut: { value: 1 },
    });
  }

  override draw() {}

  override render(f: Frame, out: THREE.WebGLRenderTarget) {
    const t = f.t, r = this.ctx.renderer, a = f.a, S = this.ctx.start, E = this.ctx.end;
    // the masks: each word cut in as it is sung (a stamp: it lands from a little larger)
    const m = this.mask.ctx, h = this.halo.ctx;
    this.mask.clear('#000'); this.halo.clear('#000');
    m.fillStyle = '#fff';
    for (const p of this.words) {
      if (t < p.w.start - 0.03) continue;
      const k = prog(t, p.w.start - 0.03, p.w.start + (p.hard ? 0.16 : 0.12), ease.outCubic);
      const sc = lerp(p.hard ? 1.22 : 1.12, 1, k);
      const ww = measure(p.text, this.fam, p.size);
      m.save();
      m.translate(p.x + ww / 2, p.y - p.size * 0.36);
      m.scale(sc, sc);
      m.globalAlpha = clamp(k * 1.5);
      m.font = font(this.fam, p.size); m.textBaseline = 'alphabetic';
      m.fillText(p.text, -ww / 2, p.size * 0.36);
      m.restore();
      // its glow in the frost (half res, blurred): red channel
      h.save();
      h.scale(0.5, 0.5);
      h.filter = 'blur(10px)';
      h.globalAlpha = clamp(k) * (0.75 + 0.5 * hit(t, p.w.start, p.hard ? 0.35 : 0.2));
      h.fillStyle = '#f00';
      h.font = font(this.fam, p.size); h.textBaseline = 'alphabetic';
      h.fillText(p.text, p.x, p.y);
      h.restore();
    }
    // the cracks (green channel), drawn as they run
    h.save(); h.scale(0.5, 0.5); h.strokeStyle = '#0f0'; h.lineCap = 'round';
    for (const cr of this.cracks) {
      const run = (t - cr.at) * 900;
      if (run <= 0) continue;
      h.lineWidth = 1.6;
      h.globalAlpha = 0.8;
      for (const [x0, y0, x1, y1, s] of cr.segs) {
        if (s > run) continue;
        h.beginPath(); h.moveTo(x0, y0); h.lineTo(x1, y1); h.stroke();
      }
    }
    h.restore();
    this.mask.upload(); this.halo.upload();

    // the glass, pushing in slowly; the light behind breathes with the mix and kicks on the hard words
    const kick = Math.max(0, ...this.words.filter((p) => p.hard).map((p) => hit(t, p.w.start, 0.25)));
    const u = this.glass.u;
    u.uTime!.value = t;
    u.uZoom!.value = 1 + 0.05 * prog(t, S, E) + 0.03 * kick;
    u.uBack!.value = 0.8 + 0.5 * a.rms + 1.2 * kick;
    u.uCut!.value = 0.9 + 0.3 * a.rms + 0.8 * kick;
    this.glass.render(r, this.st.rt);
    this.st.finish(r, out, {
      focus: 1000, ap: 0,
      rays: { uv: [0.45, 0.55], amt: 0.9 + 1.2 * kick, thr: 1.0, len: 0.5, decay: 0.975, rad: 1.2, tint: lin(this.c.accent, 0.9) },
      lens: 0.063 + 0.05 * kick, lensCol: lin(this.c.accent2, 0.35),
    });

    // frost dust shaken loose from the hard words, falling in the light
    const sp = this.spark.ctx;
    this.spark.clear();
    let any = false;
    for (const b of this.bursts) {
      const age = t - b.at;
      if (age < 0 || age > 1.8) continue;
      any = true;
      for (const q of b.pts) {
        const x = q.x + q.vx * age, y = q.y + q.vy * age + 0.5 * 900 * age * age;
        const al = clamp(1 - age / 1.8) * 0.9;
        sp.fillStyle = `rgba(255,236,200,${al})`;
        sp.beginPath(); sp.arc(x, y, q.s, 0, Math.PI * 2); sp.fill();
      }
    }
    if (any) this.ctx.comp.draw(r, this.spark.upload(), out, { mode: 'add', tint: [3, 2.6, 2] });

    return {
      bloom: 0.55, bloomThreshold: 1.1, bloomRadius: 0.6, halation: 0.2, ca: 0.22, grain: 0.016, vignette: 0.5, hud: 0,
      shake: [kick * 7, kick * 9] as [number, number],
      gain: [1.06, 1.0, 0.9] as [number, number, number], lift: [0.006, 0.003, 0] as [number, number, number], sat: 1.1,
    };
  }
}
