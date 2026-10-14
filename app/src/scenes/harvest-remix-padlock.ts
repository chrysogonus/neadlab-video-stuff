// Harvest Now, Decrypt Later (Banger Remix): the address bar. One hairline browser bar in the blue-black, opened
// from a point of light; at its left end a small green padlock, the only warm light, its glow pooling on the dark
// and breathing with the loudness; a caret blinking on the beat. Frost dendrites grow in from the frame corners a
// step on each downbeat, as on the glass in front of the camera (rime haze behind them). On each cue's anchor the
// padlock clicks: the shackle seats, a ring of green light. Phase `open` (intro): the plant, frost creeping in.
// Phase `secure` (outro): the same bar, clean corners; on the anchor a browser tooltip opens under the lock, then
// one last thread of frost reaches in from the lower-left corner toward it.
//
// Three layers: a fullscreen pass (ground, glow, haze) in HDR, the picture on a Canvas2D layer (moved by a slow
// push-in), and the frost as a 2D LineBatch on the lens (it does not move with the camera).
import * as THREE from 'three';
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import { FSPass } from '../engine/gl';
import { LineBatch } from '../engine/lines';
import { clamp, ease, hexToLinear, lerp, mulberry32, prog } from '../engine/util';
import { LibScene, W, H, arrive, cursorOn, hit, mixHex, text, type Look } from './_lib';
import { measure } from '../engine/type';
import { rgba } from '../engine/palette';

export const schema: SceneSchema = {
  description: 'A hairline browser address bar in the dark with a small glowing green padlock and a caret; frost dendrites grow in from the corners on the downbeats; the padlock clicks on each anchor. Intro and outro of the Harvest remix.',
  kinds: ['song'],
  lyrics: 'layer',
  entry: {
    phase: { type: 'string', enum: ['open', 'secure'], default: 'open', description: 'open: the plant, frost creeping in from the corners; secure: clean corners, then one last thread of frost from the lower-left after the anchor' },
  },
  cue: {
    frost: { type: 'number', default: 0, min: 0, max: 1, description: 'how far in from the corners the frost has grown by the end of the cue (0 none, 1 to the centre); it grows a step on each downbeat' },
    tooltip: { type: 'string', default: '', description: 'a small browser tooltip that opens under the padlock on the anchor' },
  },
  example: { entry: { phase: 'open' }, cues: [{ frost: 0.25 }] },
};

interface P { phase: 'open' | 'secure' }
interface C { frost: number; tooltip: string }

const CX = W / 2, CY = 500; // the bar's centre
const BW = 1150, BH = 84; // the bar
const U = 34; // the padlock's body width
const LOCK_X = CX - BW / 2 + BH / 2 + 14; // the padlock's centre
const CARET_X = LOCK_X + U / 2 + 30;
const DIAG = Math.hypot(CX, H / 2); // corner to centre
const GROW = 0.9; // s a frost step takes
const CAP = 160000;

// the dendrites: per level, step px, side-branch spacing px, side length (share of what remains, cap px), wiggle
const STEP = [6, 4, 3], SPACE = [13, 6], RATIO = [0.34, 0.4], MAXSIDE = [80, 15], WIGGLE = [0.012, 0.03, 0.05];
const LVL = [{ w: 1.4, a: 0.5 }, { w: 1.0, a: 0.34 }, { w: 0.75, a: 0.24 }];

/** Segments of a branching ice crystal (ax, ay, bx, by, s0, s1, level) grown from (x, y) at angle `a`; s is path length from the root. */
function grow(out: number[], rnd: () => number, x: number, y: number, a: number, len: number, lvl: number, s: number, side = 1) {
  const st = STEP[lvl]!, n = Math.max(1, Math.round(len / st));
  const curve = (rnd() - 0.5) * (lvl ? 0.012 : 0.003);
  let next = SPACE[lvl] !== undefined ? SPACE[lvl]! * (0.4 + rnd()) : Infinity, alt = rnd() < 0.5 ? 1 : -1;
  for (let i = 0; i < n; i++) {
    a += curve * st + (rnd() - 0.5) * WIGGLE[lvl]!;
    const nx = x + Math.cos(a) * st, ny = y + Math.sin(a) * st;
    out.push(x, y, nx, ny, s, s + st, lvl);
    x = nx; y = ny; s += st;
    const done = (i + 1) * st, rem = len - done;
    if (lvl < 2 && done >= next && rem > st * 2) {
      next += SPACE[lvl]! * (0.7 + 0.6 * rnd());
      const sl = Math.min(rem * RATIO[lvl]!, MAXSIDE[lvl]! * side) * (0.7 + 0.4 * rnd());
      const da = (Math.PI / 3) * (0.95 + 0.1 * rnd()); // ice branches at sixty degrees
      if (lvl === 0) { // paired, like a feather
        grow(out, rnd, x, y, a + da, sl, 1, s, side);
        grow(out, rnd, x, y, a - da, sl * (0.8 + 0.25 * rnd()), 1, s, side);
      } else { grow(out, rnd, x, y, a + alt * da, sl, 2, s, side); alt = -alt; }
    }
  }
}

const GROUND = /* glsl */ `
uniform vec3 bg; uniform vec3 ice; uniform vec3 green;
uniform vec2 lock; uniform float glow; uniform float pointA; uniform float cy;
uniform vec4 reach; // rime radius per corner: TL, TR, BL, BR
float rime(vec2 p, vec2 c, float r, float s) {
  if (r < 1.0) return 0.0;
  float m = smoothstep(r * 1.15, r * 0.1, length(p - c));
  float n = fbm(p / 80.0 + s, 4) * 0.5 + 0.5;
  float fine = snoise(p / 7.0 + s * 3.1) * 0.5 + 0.5;
  return m * m * n * (0.55 + 0.45 * fine);
}
void main() {
  vec2 p = vec2(FRAG_PX.x, ${H.toFixed(1)} - FRAG_PX.y);
  vec3 col = bg;
  // the room's faint cold light from above, and the screen's own lift around the bar
  col += ice * 0.008 * exp(-p.y / 480.0);
  vec2 q = (p - vec2(${CX.toFixed(1)}, cy)) / vec2(900.0, 420.0);
  col += ice * 0.007 * exp(-2.0 * dot(q, q));
  // the padlock's light: a tight core and a wide spill, stretched a little along the bar
  vec2 g = (p - lock) * vec2(0.75, 1.2);
  float d2 = dot(g, g);
  col += green * glow * (0.13 * exp(-d2 / (2.0 * 40.0 * 40.0)) + 0.016 * exp(-sqrt(d2) / 150.0));
  // the point of light the bar opens from
  float pd = length(p - vec2(${CX.toFixed(1)}, cy));
  col += mix(ice, vec3(1.0), 0.6) * pointA * (3.0 * exp(-pd * pd / 20.0) + 0.08 * exp(-pd / 70.0));
  // rime on the glass at the corners
  float h = rime(p, vec2(0.0), reach.x, 1.3) + rime(p, vec2(${W.toFixed(1)}, 0.0), reach.y, 7.9)
          + rime(p, vec2(0.0, ${H.toFixed(1)}), reach.z, 4.4) + rime(p, vec2(${W.toFixed(1)}, ${H.toFixed(1)}), reach.w, 11.2);
  col += mix(ice, vec3(1.0), 0.35) * 0.05 * h;
  fragColor = vec4(col, 1.0);
}`;

export default class HarvestRemixPadlock extends LibScene<P, C> {
  static schema = schema;
  private ground = new FSPass(GROUND, {
    bg: { value: new THREE.Vector3() }, ice: { value: new THREE.Vector3() }, green: { value: new THREE.Vector3() },
    lock: { value: new THREE.Vector2() }, glow: { value: 0 }, pointA: { value: 0 }, cy: { value: CY },
    reach: { value: new THREE.Vector4() },
  });
  private lines = new LineBatch(CAP, { blend: 'add' });
  private frost = new Float32Array(0); // corner crystals, 7 per segment
  private corner = new Uint8Array(0); // their corner
  private thread = new Float32Array(0); // the outro's last thread
  private cornerMul = [1, 1, 1, 1];
  private steps: number[][] = []; // per cue, the downbeats its frost grows on
  private lockT = 0; // when the padlock arrives

  override setup() {
    const au = this.ctx.audio, start = this.ctx.start;
    this.lockT = au.beats.find((b) => b >= start + 0.42) ?? start + 0.5;
    this.steps = this.cues.map((c) => au.downbeats.filter((d) => d >= c.start - 1e-3 && d < c.end));

    // the corner crystals, grown as far as the frost will ever reach here
    const maxF = Math.max(0, ...this.cues.map((c) => this.cp(c).frost));
    if (maxF > 0) {
      const rnd = mulberry32(2021), segs: number[] = [], corner: number[] = [];
      const corners = [[0, 0], [W, 0], [0, H], [W, H]] as const;
      corners.forEach(([cx, cy], ci) => {
        const mul = (this.cornerMul[ci] = 0.85 + 0.3 * rnd());
        const sx = cx ? -1 : 1, sy = cy ? -1 : 1; // inward
        const n = 4 + Math.floor(rnd() * 2), reach = maxF * DIAG * mul * 1.05 + 40;
        for (let j = 0; j < n; j++) {
          const q = ((j + 0.25 + 0.5 * rnd()) / n) * (Math.PI / 2); // 0 along the horizontal edge .. π/2 along the vertical
          const a = Math.atan2(sy * Math.sin(q), sx * Math.cos(q));
          const off = 20 + rnd() * 150, alongX = q < Math.PI / 4; // rooted on the edge it leans away from
          const x0 = cx - sx * 4 + (alongX ? 0 : sx * off), y0 = cy - sy * 4 + (alongX ? sy * off : 0);
          const before = segs.length;
          grow(segs, rnd, x0, y0, a, reach * (0.5 + 0.5 * rnd()), 0, off * 0.6);
          for (let i = before; i < segs.length; i += 7) corner.push(ci);
        }
      });
      this.frost = new Float32Array(segs);
      this.corner = new Uint8Array(corner);
    }
    // the outro's thread: one stem from the lower-left corner toward the padlock, small needles only
    if (this.P.phase === 'secure') {
      const segs: number[] = [], a = Math.atan2(CY - H, LOCK_X + 10);
      grow(segs, mulberry32(87), -6, H + 6, a, 420, 0, 0, 0.22);
      this.thread = new Float32Array(segs);
    }
  }

  /** The frost's reach (share of corner-to-centre) at t: each cue's target, reached a step per downbeat. */
  private frostAt(t: number) {
    let F = 0;
    this.cues.forEach((c, i) => {
      const target = this.cp(c).frost, dbs = this.steps[i]!;
      if (target <= 0 && F <= 0) return;
      if (!dbs.length) { if (t >= c.start) F = target; return; }
      let g = 0;
      for (const d of dbs) g += ease.outCubic(prog(t, d, d + GROW));
      F = lerp(F, target, g / dbs.length);
    });
    return F;
  }

  /** The camera: a slow push-in on the bar over the entry. */
  private zoom(t: number) { return 1 + 0.055 * ease.inOutQuad(prog(t, this.ctx.start, this.ctx.end)); }

  /** The bar opening from a point: its width and height (0..1), and the point's light. */
  private reveal(t: number) {
    const s = this.ctx.start;
    return {
      w: ease.inOutCubic(prog(t, s + 0.04, s + 0.4)),
      h: ease.outCubic(prog(t, s + 0.3, s + 0.55)),
      point: 1 - ease.inCubic(prog(t, s, s + 0.38)),
    };
  }

  /** The anchor before or at t (the last click). */
  private lastAt(t: number) { return this.cues.filter((c) => c.at <= t).at(-1); }

  draw(c: CanvasRenderingContext2D, f: Frame, k: Look) {
    const t = f.t, z = this.zoom(t), rv = this.reveal(t);
    c.translate(CX, CY); c.scale(z, z); c.translate(-CX, -CY);

    // the bar: a hairline pill on faint glass, lit a little more near the padlock
    if (rv.w > 0) {
      const bw = Math.max(4, BW * rv.w), bh = lerp(2, BH, rv.h), x0 = CX - bw / 2, y0 = CY - bh / 2;
      c.beginPath(); c.roundRect(x0, y0, bw, bh, bh / 2);
      c.fillStyle = k.a('panel', 0.6 * rv.h); c.fill();
      const g = c.createLinearGradient(x0, 0, x0 + bw, 0);
      const lit = mixHex(k.type, k.accent2, 0.45 * arrive(t, this.lockT, 0.35)); // the padlock's light on the glass
      g.addColorStop(0, rgba(lit, 0.55)); g.addColorStop(0.12, rgba(lit, 0.34)); g.addColorStop(0.35, k.a('type', 0.3)); g.addColorStop(1, k.a('type', 0.26));
      c.strokeStyle = g; c.lineWidth = 1.8; c.stroke();
      if (rv.h > 0.5) { // the glass's top edge catching the room light
        const hg = c.createLinearGradient(x0, 0, x0 + bw, 0);
        hg.addColorStop(0, k.a('type', 0)); hg.addColorStop(0.5, k.a('type', 0.09)); hg.addColorStop(1, k.a('type', 0));
        c.fillStyle = hg; c.fillRect(x0 + bh / 2, y0 + 3, bw - bh, 1);
      }
    }

    const la = arrive(t, this.lockT, 0.35);
    if (la <= 0) return;
    const last = this.lastAt(t), click = last ? hit(t, last.at, 0.07) : 0;
    // the shackle sits a little proud until the first click, then seats (with a small settle)
    const first = this.cues[0]?.at ?? Infinity;
    const lift = t < first ? 2.4 : 2.4 * Math.exp(-(t - first) * 18) * Math.cos((t - first) * 40);
    const ly = CY + 3;
    c.save();
    c.globalAlpha = la;
    c.translate(LOCK_X, ly); c.scale(0.9 + 0.1 * la + 0.05 * click, 0.9 + 0.1 * la + 0.05 * click); c.translate(-LOCK_X, -ly);
    this.drawLock(c, LOCK_X, ly, k, Math.max(0, lift));
    c.restore();

    // the click's ring of light
    if (last && t - last.at < 0.9) {
      const p = (t - last.at) / 0.9, r = lerp(U * 0.7, U * 3.4, ease.outCubic(p));
      c.beginPath(); c.arc(LOCK_X, ly - U * 0.15, r, 0, Math.PI * 2);
      c.strokeStyle = k.a('accent2', 0.85 * Math.pow(1 - p, 1.6)); c.lineWidth = lerp(2.5, 0.8, p); c.stroke();
    }

    // the caret, on the beat
    if (cursorOn(f.beat)) { c.fillStyle = k.a('type', 0.85 * la); c.fillRect(CARET_X, CY - 19, 2.5, 38); }

    // the tooltip under the padlock
    const tipCue = this.cues.find((x) => this.cp(x).tooltip && t >= x.at);
    if (tipCue) {
      const s = this.cp(tipCue).tooltip, a = arrive(t, tipCue.at + 0.08, 0.32), fam = this.font('body'), size = 26;
      const tw = measure(s, fam, size), pw = tw + 44, ph = 54, px = LOCK_X - 30, py = CY + BH / 2 + 18 - (1 - a) * 8;
      c.save();
      c.globalAlpha = a;
      c.beginPath(); c.roundRect(px, py, pw, ph, 10);
      c.moveTo(LOCK_X - 9, py); c.lineTo(LOCK_X, py - 9); c.lineTo(LOCK_X + 9, py);
      c.fillStyle = mixHex(k.panel, k.type, 0.04); c.fill();
      c.strokeStyle = k.a('type', 0.22); c.lineWidth = 1.2; c.stroke();
      text(c, s, px + 22, py + ph / 2 + size * 0.35, fam, size, k.type);
      c.restore();
    }
  }

  /** A padlock with its body centred at (x, y): shackle arc and legs, rounded body with a little volume, keyhole. */
  private drawLock(c: CanvasRenderingContext2D, x: number, y: number, k: Look, lift: number) {
    const g = k.accent2, top = y - 0.36 * U, sy = y - 0.6 * U - lift, r = 0.29 * U;
    // shackle
    c.beginPath();
    c.moveTo(x - r, top + 4); c.lineTo(x - r, sy); c.arc(x, sy, r, Math.PI, 0); c.lineTo(x + r, top + 4);
    c.strokeStyle = mixHex(g, k.bg, 0.12); c.lineWidth = 0.14 * U; c.lineCap = 'butt'; c.stroke();
    c.beginPath(); c.arc(x, sy, r + 0.025 * U, Math.PI * 1.08, Math.PI * 1.45); // its sheen
    c.strokeStyle = mixHex(g, '#ffffff', 0.55); c.lineWidth = 0.035 * U; c.stroke();
    // body
    const bg = c.createLinearGradient(0, top, 0, top + 0.74 * U);
    bg.addColorStop(0, mixHex(g, '#ffffff', 0.22)); bg.addColorStop(0.45, g); bg.addColorStop(1, mixHex(g, k.bg, 0.3));
    c.beginPath(); c.roundRect(x - U / 2, top, U, 0.74 * U, 0.16 * U);
    c.fillStyle = bg; c.fill();
    c.fillStyle = mixHex(g, '#ffffff', 0.6); c.fillRect(x - U / 2 + 0.16 * U, top + 1, U - 0.32 * U, 1.2);
    // keyhole
    const kc = mixHex(g, k.bg, 0.78), ky = y - 0.05 * U;
    c.beginPath(); c.arc(x, ky, 0.09 * U, 0, Math.PI * 2);
    c.moveTo(x - 0.035 * U, ky); c.lineTo(x - 0.055 * U, ky + 0.24 * U); c.lineTo(x + 0.055 * U, ky + 0.24 * U); c.lineTo(x + 0.035 * U, ky);
    c.fillStyle = kc; c.fill();
  }

  /** Crystal segments up to path length R, into the line batch; growing tips glint. */
  private drawFrost(segs: Float32Array, R: (i: number) => number, col: [number, number, number], gain: number) {
    const b = this.lines;
    for (let i = 0, n = 0; i < segs.length; i += 7, n++) {
      const s0 = segs[i + 4]!, s1 = segs[i + 5]!, rr = R(n);
      if (s0 >= rr) continue;
      const lvl = segs[i + 6]!, ax = segs[i]!, ay = segs[i + 1]!, p = Math.min(1, (rr - s0) / (s1 - s0));
      const bx = ax + (segs[i + 2]! - ax) * p, by = ay + (segs[i + 3]! - ay) * p;
      const age = clamp((rr - s1) / 260), tip = Math.exp(-(rr - s0) / 10);
      const L = LVL[lvl]!, e = gain * (1 + 1.6 * tip), al = L.a * (0.7 + 0.3 * age);
      b.seg(ax, ay, 0, bx, by, 0, L.w + 0.5 * age, col[0] * e, col[1] * e, col[2] * e, al);
    }
  }

  override render(f: Frame, out: THREE.WebGLRenderTarget) {
    const t = f.t, k = this.lookAt(t), r = this.ctx.renderer, z = this.zoom(t), rv = this.reveal(t);
    const la = arrive(t, this.lockT, 0.35), last = this.lastAt(t);
    const F = this.frostAt(t), reach = F * DIAG;

    const u = this.ground.u;
    (u.bg!.value as THREE.Vector3).set(...hexToLinear(k.bg));
    (u.ice!.value as THREE.Vector3).set(...hexToLinear(k.accent));
    (u.green!.value as THREE.Vector3).set(...hexToLinear(k.accent2));
    (u.lock!.value as THREE.Vector2).set(CX + (LOCK_X - CX) * z, CY);
    u.glow!.value = la * (0.7 + 0.75 * f.a.rms) + (last ? 1.4 * hit(t, last.at, 0.16) : 0);
    u.pointA!.value = rv.point;
    (u.reach!.value as THREE.Vector4).set(...(this.cornerMul.map((m) => reach * m * 0.9) as [number, number, number, number]));
    this.ground.render(r, out);

    this.L.clear();
    const c = this.L.ctx;
    c.save();
    try { this.draw(c, f, k); } finally { c.restore(); }
    this.ctx.comp.draw(r, this.L.upload(), out, { mode: 'normal' });

    // frost on the lens
    this.lines.clear();
    const col = hexToLinear(mixHex(k.type, k.accent, 0.4)), gain = 0.85 + 0.2 * f.a.kick;
    if (reach > 0) this.drawFrost(this.frost, (n) => reach * this.cornerMul[this.corner[n]!]!, col, gain);
    const tc = this.cues.find((x) => this.cp(x).tooltip) ?? this.cues.at(-1);
    if (this.thread.length && tc) {
      const tr = 360 * ease.outQuad(prog(t, tc.at + 0.6, this.ctx.end + 0.2));
      if (tr > 0) this.drawFrost(this.thread, () => tr, col, gain * 1.15);
    }
    if (this.lines.count) this.lines.render(r, out);

    return { bloom: 0.5, bloomThreshold: 0.6, bloomRadius: 0.45, halation: 0, ca: 0.12, grain: 0.034, vignette: 0.34, hud: 0 };
  }
}
