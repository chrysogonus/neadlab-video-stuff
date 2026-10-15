// Harvest Now, Decrypt Later (Banger Remix): the backlog. The defenders' office in flat daylight: a long planning
// board on the wall, one column per quarter, seen nearly straight on (the far end receding a little to the right),
// with sun falling through venetian blinds in slanted bars across it. Past quarters hold small finished tickets; the
// future is empty.
//
// The span cue (the bar the bridge opens on): the board settles into place and its rules draw down. The cue with a
// `priority`: one big paper ticket card drops onto the board in the first quarter on the line's second word, its
// title types itself, the assignee circle and the attachment (the lattice crate from the new math, stamped LATER)
// pop on, and on the anchor the priority chip is stamped onto it in sealing-wax red. The cue with `moved`: the card
// is shoved one column right, faster and faster on a sixteenth-note grid, landing in `column` on the anchor; it
// lifts and skids on each shove, the camera pulls back and chases it while the quarter headers stream past, and a
// "Moved n×" counter on the card ticks up. The cue with a `comment`: a comment slip slides out under the card, an
// avatar, a typing indicator, then the comment types itself as the quote is sung; on the anchor a thumbs-up
// reaction pops on and counts up to `likes`.
//
// Rendering: the board is drawn in Canvas2D (board px, with the camera's pan and zoom) onto a layer larger than the
// frame; a GL pass looks at it through a slightly yawed and pitched plane (real perspective) and lights it: the
// blinds' bars of warm sun (breathing with the loudness) over cooler ambient office light. A pure function of t.
import * as THREE from 'three';
import { fitOf } from './harvest-remix-kit';
import type { Frame } from '../engine/scene';
import type { SceneSchema } from '../engine/schema';
import type { Word } from '../engine/lyrics';
import { FSPass, Layer2D } from '../engine/gl';
import { F, font, measure, smart } from '../engine/type';
import { clamp, ease, hash, lerp, noise1, prog, springStep } from '../engine/util';
import { LibScene, H, W, arrive, cursorOn, hit, mixHex, pill, text, typed, typedWith, wrap, type Look } from './_lib';

export const schema: SceneSchema = {
  description: 'The backlog as a picture: a daylight planning board on an office wall, one column per quarter, sun through venetian blinds across it. A ticket card drops into the first quarter and fills in, its priority chip stamped on the anchor; on the `moved` cue it is shoved one column right again and again (accelerating), the camera chasing it, landing in `column` on the anchor with a "Moved n×" counter; on the `comment` cue a comment slip types itself under the card and a thumbs-up pops on the anchor. Harvest remix.',
  kinds: ['song'],
  lyrics: 'layer',
  entry: {
    ticket: { type: 'string', default: 'PQC-114', description: 'the ticket key, top left of the card' },
    title: { type: 'string', default: 'Migrate key exchange to post-quantum', description: 'the ticket title (wraps to two or three rows)' },
    from: { type: 'string', default: 'Q3 2022', description: 'the first quarter column, "Q<n> <year>"; the columns step a quarter each' },
    moves: { type: 'number', default: 16, min: 1, max: 40, description: 'how many quarters the card is pushed in all (the board has that many columns after the first, and a few more)' },
    view: { type: 'string', enum: ['board', 'comment'], default: 'board', description: 'board: the camera on the board and the card; comment: a close insert on the comment slip under the card' },
  },
  cue: {
    column: { type: 'string', default: '', description: 'the quarter the card is in after this cue; on a `moved` cue the card is shoved there, landing on the anchor' },
    priority: { type: 'string', default: '', description: 'set on the cue that opens the ticket: the card drops in on the line\'s second word and this chip is stamped on it at the anchor' },
    moved: { type: 'number', default: 0, min: 0, description: 'the card\'s "Moved n×" counter after this cue (the shoves happen over the cue\'s line)' },
    comment: { type: 'string', default: '', description: 'a comment typed under the card as the line is sung (from its third word)' },
    likes: { type: 'number', default: 0, min: 0, description: 'thumbs-up count the comment\'s reaction counts up to on the anchor' },
  },
  example: {
    entry: { ticket: 'PQC-114', title: 'Migrate key exchange to post-quantum', from: 'Q3 2022', moves: 16 },
    cues: [{}, { column: 'Q3 2022', priority: 'LOW' }, { column: 'Q3 2026', moved: 16 }, { comment: 'who\'d even store it?', likes: 3 }],
  },
};

interface P { ticket: string; title: string; from: string; moves: number; view: 'board' | 'comment' }
interface C { column: string; priority: string; moved: number; comment: string; likes: number }

// ------------------------------------------------------------------ the board (board px, y down)
const COL = 600; // column pitch
const CW = 520; // card width
const PAD = 34; // card padding
const HEAD_Y = 150; // header baseline
const RULE_Y = 186; // the rule under the headers
const CARD_Y = 236; // card top
const STUB_Y = 640; // first finished ticket in a past column
const EDGE_X = -64; // the board's left edge
const EDGE_Y = 40; // the board's top edge
// ------------------------------------------------------------------ the camera
const LW = 2200, LH = 1240; // the layer the board is drawn on (the perspective view samples beyond the frame)
const CAM0 = { x: 850, y: 470 }; // board px at the frame's centre while the card sits in the first column
const FOCAL = 1500; // px
const YAW = -0.1, PITCH = -0.035; // the board's turn away from the camera (right side and top recede)
const WIN = 2310; // the windows' pitch along the wall (the sun crosses the card in its first and last column)
const TITLE_PX = 40, TITLE_LH = 50;

const LIGHT_F = /* glsl */ `
uniform sampler2D uTex; uniform vec2 uLayer, uCam, uRot; uniform float uZoom, uSun, uShift;
uniform vec3 uWarm, uCool;
// sun through blinds on the wall: a slanted patch per window (the light comes from high on the left), cut into bars by
// the slats and split by a mullion; soft edges for the penumbra
float sun(vec2 b) {
  float x = b.x - 0.46 * b.y - uShift;
  float cell = mod(x, ${WIN.toFixed(1)});
  float w = 1150.0;
  float pane = smoothstep(0.0, 90.0, cell) * (1.0 - smoothstep(w - 90.0, w, cell));
  pane *= 1.0 - 0.85 * smoothstep(w * 0.47, w * 0.49, cell) * (1.0 - smoothstep(w * 0.51, w * 0.53, cell));
  float s = fract((b.y + 0.1 * b.x) / 46.0);
  float slat = smoothstep(0.16, 0.34, s) * (1.0 - smoothstep(0.74, 0.92, s));
  return pane * mix(0.25, 1.0, slat);
}
void main() {
  vec2 s = vec2(vUv.x * ${W.toFixed(1)} - ${(W / 2).toFixed(1)}, (1.0 - vUv.y) * ${H.toFixed(1)} - ${(H / 2).toFixed(1)});
  float ca = cos(uRot.x), sa = sin(uRot.x), cb = cos(uRot.y), sb = sin(uRot.y);
  vec3 e1 = vec3(ca, 0.0, -sa), e2 = vec3(sb * sa, cb, sb * ca), n = vec3(cb * sa, -sb, cb * ca);
  vec3 P0 = vec3(0.0, 0.0, ${FOCAL.toFixed(1)}), d = vec3(s, ${FOCAL.toFixed(1)});
  vec3 X = d * (dot(n, P0) / dot(n, d)) - P0;
  vec2 q = vec2(dot(X, e1), dot(X, e2));
  vec2 lp = q + uLayer * 0.5;
  vec3 col = texture(uTex, vec2(lp.x / uLayer.x, 1.0 - lp.y / uLayer.y)).rgb;
  vec2 b = q / uZoom + uCam;
  float l = sun(b) * uSun;
  // ambient office light, a little brighter toward the windows (upper left), cooler in the shade
  float amb = 0.89 + 0.06 * (1.0 - vUv.x) + 0.04 * vUv.y;
  col *= mix(uCool, uWarm, clamp(l * 3.0, 0.0, 1.0)) * (amb + l);
  fragColor = vec4(col, 1.0);
}`;

const lin = (r: number, g: number, b: number) => new THREE.Vector3(r, g, b);

/** The finished tickets of the past quarters: key, title, assignee. */
const DONE: [string, string, string][] = [
  ['PLAT-311', 'Fix flaky login test on CI', 'JM'], ['PLAT-298', 'Dark mode for settings page', 'AK'], ['OPS-87', 'Upgrade runtime to Node 20', 'RS'],
  ['SEC-142', 'Rotate staging API keys', 'LT'], ['PLAT-305', 'Reduce cold-start time by 30%', 'JM'], ['WEB-77', 'Cookie banner copy (legal)', 'EB'],
  ['OPS-91', 'Move CI runners to new region', 'RS'], ['SEC-150', 'Renew wildcard TLS certificate', 'LT'], ['PLAT-320', 'Refactor billing webhooks', 'AK'],
  ['WEB-80', 'Fix PDF export margins', 'EB'], ['SEC-155', 'Enable SSO for partner portal', 'LT'], ['OPS-95', 'Holiday on-call rota', 'RS'],
  ['PLAT-333', 'New onboarding checklist', 'JM'], ['SEC-161', 'Pen-test follow-ups (low)', 'LT'],
];
/** Sticky notes, in a hand. */
const STICKY = ['Q-day??\nask Lena', 'after the\nlaunch!', 'budget:\nnext FY', 'not urgent\n(yet)', 'blocked:\nvendor', 're-estimate\n→ 13 pts'];
/** Old marker, half wiped off the board. */
const GHOST = ['sprint 14 goals', 'freeze 15 Dec', 'OKR: uptime 99.9', 'retro → Thu', 'demo day!'];

export default class HarvestRemixBacklog extends LibScene<P, C> {
  static schema = schema;
  private board = new Layer2D(LW, LH);
  private light = new FSPass(LIGHT_F, {
    uTex: { value: null }, uLayer: { value: new THREE.Vector2(LW, LH) }, uCam: { value: new THREE.Vector2() },
    uRot: { value: new THREE.Vector2(YAW, PITCH) }, uZoom: { value: 1 }, uSun: { value: 0.2 }, uShift: { value: 0 },
    uWarm: { value: lin(1.0, 0.965, 0.9) }, uCool: { value: lin(0.965, 0.985, 1.03) },
  });

  private quarters: string[] = [];
  private rows: string[] = [];
  private CH = 300;
  // the moments
  private tBoard = 0;
  private tDrop = Infinity; private tLand = Infinity; private tStamp = Infinity; private tTitle1 = Infinity;
  private tAvatar = Infinity; private tCrate = Infinity;
  private priority = '';
  private startCol = 0;
  private shoves: number[] = []; // times
  private movedAt: number[] = []; // the counter's value after each shove
  private tPush0 = Infinity; private tPush1 = Infinity;
  private comment = ''; private likes = 0;
  private tSlip = Infinity; private tLike = Infinity; private slipEnd = Infinity;
  private typeWords: Word[] = [];

  override setup() {
    const P = this.P, au = this.ctx.audio;
    const m = /Q([1-4])\s+(\d{4})/.exec(P.from);
    let q = m ? +m[1]! - 1 : 2, y = m ? +m[2]! : 2022;
    for (let i = 0; i < P.moves + 4; i++) {
      this.quarters.push(`Q${q + 1} ${y}`);
      if (++q > 3) { q = 0; y++; }
    }
    this.rows = wrap(P.title, this.font('body'), TITLE_PX, CW - 2 * PAD);
    this.CH = 128 + (this.rows.length - 1) * TITLE_LH + 132;

    this.tBoard = this.cues.find((c) => !c.line)?.at ?? this.ctx.start;
    let col = 0, moved = 0;
    for (const c of this.cues) {
      const p = this.cp(c);
      const ci = p.column ? this.quarters.indexOf(p.column) : -1;
      if (p.priority) {
        const w = c.line?.words ?? [];
        this.priority = p.priority;
        this.tDrop = w[0]?.start ?? c.start;
        this.tLand = w[1]?.start ?? c.at;
        this.tStamp = c.at;
        this.tTitle1 = Math.max(this.tLand + 0.3, (w[2]?.end ?? c.at) - 0.05);
        this.tAvatar = w[2]?.start ?? this.tLand + 0.4;
        this.tCrate = lerp(this.tAvatar, this.tStamp, 0.45);
        if (ci >= 0) this.startCol = col = ci;
      } else if (p.moved > moved || (ci > col && !p.comment)) {
        // shoves from the line's first word to the anchor, accelerating, snapped to the sixteenth-note grid
        const n = ci > col ? ci - col : p.moved - moved;
        const s = c.line?.start ?? c.start, e = c.at;
        let last = -Infinity;
        for (let i = 0; i < n; i++) {
          const x = n > 1 ? i / (n - 1) : 1;
          let tt = i === n - 1 ? e : au.timeOfBeat(Math.round(au.beatAt(s + (e - s) * (1 - Math.pow(1 - x, 1.15))) * 4) / 4);
          const sixteenth = (au.timeOfBeat(au.beatAt(tt) + 1) - tt) / 4;
          if (tt <= last + sixteenth * 0.6) tt = last + sixteenth;
          if (i < n - 1) tt = Math.min(tt, e - (n - 1 - i) * 0.06);
          this.shoves.push(tt);
          last = tt;
          this.movedAt.push(Math.round(lerp(moved, p.moved || moved + n, (i + 1) / n)));
        }
        if (this.tPush0 === Infinity) this.tPush0 = this.shoves[0] ?? s;
        this.tPush1 = e;
        col += n;
        moved = p.moved || moved + n;
      }
      if (p.comment) {
        this.comment = smart(p.comment);
        this.likes = p.likes;
        this.tSlip = c.start;
        this.tLike = c.at;
        this.slipEnd = c.end;
        const w = c.line?.words ?? [];
        this.typeWords = w.length > 2 ? w.slice(2) : w;
      }
    }
  }

  draw() {}

  /** The card's resting angle after shove i (-1: as it lands). */
  private rest(i: number) {
    if (i < 0) return 0.01;
    if (i === this.shoves.length - 1) return -0.024;
    return (hash(i, 9) - 0.5) * 0.05;
  }

  /** The card at t: centre (board px), angle, lift (0 resting .. 1 in the air), shove count so far. */
  private card(t: number) {
    const skid = (i: number) => Math.min(0.13, i > 0 ? (this.shoves[i]! - this.shoves[i - 1]!) * 0.85 : 0.13);
    let x = this.startCol * COL + COL / 2, lift = 0, n = 0, dy = 0;
    for (let i = 0; i < this.shoves.length; i++) {
      const p = prog(t, this.shoves[i]! - skid(i) * 0.35, this.shoves[i]! + skid(i) * 0.65);
      x += COL * ease.outCubic(p);
      lift = Math.max(lift, Math.sin(Math.PI * p));
      dy += ((hash(i, 4) - 0.5) * 16 - (i ? (hash(i - 1, 4) - 0.5) * 16 : 0)) * ease.outCubic(p);
      if (t >= this.shoves[i]!) n = i + 1;
    }
    const i = n - 1;
    const a0 = this.rest(i - 1), a1 = this.rest(i);
    const ang = n ? lerp(a0, a1, springStep(t - this.shoves[i]!, 3.2, 0.32)) : a1;
    // the drop: from above the board, landing with a little bounce
    const d = prog(t, this.tDrop, this.tLand);
    const air = 1 - ease.inQuad(d);
    const bounce = t >= this.tLand ? Math.sin((t - this.tLand) * 26) * Math.exp(-(t - this.tLand) * 9) * 0.012 : 0;
    const stamp = hit(t, this.tStamp, 0.07);
    return {
      x, y: CARD_Y + this.CH / 2 + dy, ang: ang + air * -0.06 + stamp * 0.012, lift: Math.max(lift, air),
      scale: 1 + 0.16 * air - bounce + 0.012 * stamp, alpha: clamp(d * 4), n,
    };
  }

  /** The camera at t: board px at the frame's centre, and zoom. */
  private camera(t: number) {
    const a = this.ctx.audio;
    const w = 15; // the chase's spring (critically damped, rad/s)
    const S = (x: number) => (x <= 0 ? 0 : 1 - (1 + w * x) * Math.exp(-w * x));
    let x = CAM0.x + this.startCol * COL;
    for (const s of this.shoves) x += COL * S(t - s);
    // over the shoves the card comes to the centre of the frame (it starts in the left of it)
    const endX = this.startCol * COL + COL / 2 + this.shoves.length * COL;
    const k = ease.inOutCubic(prog(t, this.tPush0 - 0.2, this.tPush1 + 0.5));
    x += (endX - (CAM0.x + this.startCol * COL + this.shoves.length * COL)) * k;
    let zoom = 1.04 - 0.04 * springStep(t - this.tBoard, 1.6, 0.55);
    zoom *= 1 + 0.018 * prog(t, this.tBoard, this.tPush0, ease.inOutQuad); // a slow push in while the ticket opens
    zoom *= 1 - 0.17 * (ease.inOutCubic(prog(t, this.tPush0 - 0.25, this.tPush0 + 0.7)) - ease.inOutCubic(prog(t, this.tPush1, this.tPush1 + 0.9)));
    zoom *= 1 + 0.07 * ease.inOutCubic(prog(t, this.tSlip, this.slipEnd + 0.3));
    zoom *= 1 + 0.004 * a.hit('kick', t, 0.1);
    const y = CAM0.y + 46 * ease.inOutCubic(prog(t, this.tSlip, this.tSlip + 1.6)) + 8 * noise1(t * 0.3, 3);
    return { x: x + 10 * noise1(t * 0.25, 7), y, zoom: zoom / fitOf(this.ctx.style) };
  }

  override render(f: Frame, out: THREE.WebGLRenderTarget) {
    const t = f.t, k = this.lookAt(t), c = this.board.ctx;
    const card = this.card(t);
    let cam = this.camera(t);
    if (this.P.view === 'comment') {
      // the insert: close on the comment slip, pushing in slowly
      const sx = card.x - CW / 2 + 48 + (CW - 48) / 2, sy = CARD_Y + this.CH + 24 + 98;
      const u = prog(t, f.start, f.end);
      cam = { x: sx - 30 + 40 * u, y: sy - 40, zoom: lerp(1.85, 2.0, u) };
    }
    this.board.clear(mixHex(k.bg, k.dim, 0.42)); // the wall
    c.save();
    c.translate(LW / 2, LH / 2);
    c.scale(cam.zoom, cam.zoom);
    c.translate(-cam.x, -cam.y);
    const x0 = cam.x - LW / 2 / cam.zoom, x1 = cam.x + LW / 2 / cam.zoom;
    this.drawBoard(c, t, k, x0, x1, card);
    this.drawCard(c, t, k, card);
    if (t >= this.tSlip) this.drawSlip(c, t, k, card);
    c.restore();

    const u = this.light.u;
    u.uTex!.value = this.board.upload();
    (u.uCam!.value as THREE.Vector2).set(cam.x, cam.y);
    u.uZoom!.value = cam.zoom;
    u.uSun!.value = 0.15 + 0.07 * f.a.rms + 0.03 * noise1(t * 0.4, 11);
    u.uShift!.value = (t - this.tBoard) * 4 - 90; // the sun creeps along the wall
    this.light.render(this.ctx.renderer, out);
    const s = hit(t, this.tStamp, 0.05) * 3;
    return { bloom: 0.1, bloomThreshold: 1.05, halation: 0, ca: 0.18, grain: 0.016, vignette: 0.24, hud: 0, shake: [s * 0.6, s] as [number, number] };
  }

  // ------------------------------------------------------------------ the board

  private drawBoard(c: CanvasRenderingContext2D, t: number, k: Look, x0: number, x1: number, card: ReturnType<HarvestRemixBacklog['card']>) {
    const n = this.quarters.length, right = n * COL + 220;
    // the board: its aluminium edge, its shadow on the wall, its face
    c.save();
    c.shadowColor = 'rgba(30,24,16,0.22)'; c.shadowBlur = 26; c.shadowOffsetX = 10; c.shadowOffsetY = 14;
    c.fillStyle = k.bg; c.fillRect(EDGE_X, EDGE_Y, right - EDGE_X, 2000);
    c.restore();
    const g = c.createLinearGradient(EDGE_X, 0, EDGE_X + 14, 0);
    g.addColorStop(0, '#b9b6af'); g.addColorStop(0.4, '#e9e7e2'); g.addColorStop(1, '#a6a29a');
    c.fillStyle = g; c.fillRect(EDGE_X, EDGE_Y, 14, 2000);
    const gt = c.createLinearGradient(0, EDGE_Y, 0, EDGE_Y + 14);
    gt.addColorStop(0, '#c4c1ba'); gt.addColorStop(0.4, '#f1efea'); gt.addColorStop(1, '#a9a59d');
    c.fillStyle = gt; c.fillRect(EDGE_X, EDGE_Y, right - EDGE_X, 14);

    // the rules: under the headers (drawing left to right), between the columns (drawing down), on the settle
    const r = ease.inOutCubic(prog(t, this.tBoard, this.tBoard + 0.7));
    c.fillStyle = k.rule;
    c.fillRect(0, RULE_Y, (x1 + 200) * r, 2);
    const body = this.font('body');
    text(c, 'PLATFORM SECURITY  ·  ROADMAP  ·  updated weekly', 0, 96, this.font('mono'), 20, k.dim, { track: 2 });
    const cur = Math.round(this.startCol + (card.x - (this.startCol * COL + COL / 2)) / COL);
    for (let i = 0; i < n; i++) {
      const cl = i * COL;
      if (cl > x1 + 40 || cl + COL < x0 - 40) continue;
      const d = this.tBoard + 0.05 * Math.max(0, i - this.startCol);
      if (i > 0) {
        const len = ease.outCubic(prog(t, d + 0.1, d + 0.75)) * 1400;
        c.fillStyle = k.rule; c.fillRect(cl - 1, RULE_Y + 18, 2, len);
      }
      // the header: the quarter, and a count of what is in the column
      const a = arrive(t, d, 0.4), on = i === cur && t >= this.tDrop;
      c.save();
      c.globalAlpha = a;
      const hw = text(c, this.quarters[i]!, cl + 40, HEAD_Y + (1 - a) * 10, body, 38, on ? k.type : k.dim);
      const stubs = this.stubs(i);
      text(c, `${stubs + (on ? 1 : 0)}`, cl + 40 + hw + 18, HEAD_Y, body, 28, k.dim);
      if (on) { c.fillStyle = k.type; c.fillRect(cl + 40, RULE_Y - 2, hw, 4); }
      c.restore();
      // the finished tickets of the past quarters
      for (let j = 0; j < stubs; j++) this.drawStub(c, k, cl + (COL - CW) / 2, STUB_Y + j * 78, i, j, arrive(t, d + 0.2 + j * 0.06, 0.35));
      this.drawNotes(c, k, i, cl, stubs, arrive(t, d + 0.3, 0.4));
    }
  }

  /** How many finished tickets a column holds: the past quarters have one to three, the landing column and later none. */
  private stubs(i: number) {
    const last = this.startCol + this.shoves.length;
    return i >= last ? 0 : 1 + Math.floor(hash(i, 31) * 2.99);
  }

  private drawStub(c: CanvasRenderingContext2D, k: Look, x: number, y: number, i: number, j: number, a: number) {
    if (a <= 0) return;
    const w = CW, h = 60;
    c.save();
    c.globalAlpha = a;
    c.translate(x + w / 2, y + h / 2 + (1 - a) * 14);
    c.rotate((hash(i, j, 5) - 0.5) * 0.02);
    c.translate(-w / 2, -h / 2);
    c.shadowColor = 'rgba(30,24,16,0.16)'; c.shadowBlur = 5; c.shadowOffsetX = 2; c.shadowOffsetY = 3;
    c.fillStyle = mixHex(k.bg, '#ffffff', 0.5);
    c.beginPath(); c.roundRect(0, 0, w, h, 6); c.fill();
    c.shadowColor = 'transparent';
    // a done tick, the key and the title, the assignee's initials
    c.strokeStyle = k.dim; c.lineWidth = 3; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(22, 31); c.lineTo(29, 38); c.lineTo(42, 23); c.stroke();
    const d = DONE[(i * 5 + j * 3) % DONE.length]!;
    text(c, `${d[0]}`, 60, 25, this.font('mono'), 15, k.dim, { track: 1 });
    text(c, d[1], 60, 48, this.font('body'), 21, mixHex(k.type, k.dim, 0.35));
    c.fillStyle = mixHex(k.rule, k.dim, 0.3);
    c.beginPath(); c.arc(w - 32, h / 2, 15, 0, Math.PI * 2); c.fill();
    text(c, d[2], w - 32, h / 2 + 6, this.font('body'), 15, k.bg, { align: 'center' });
    c.restore();
  }

  /** The things stuck on the board that are not tickets: sticky notes in a hand, old marker half wiped off. */
  private drawNotes(c: CanvasRenderingContext2D, k: Look, i: number, cl: number, stubs: number, a: number) {
    if (a <= 0) return;
    const hand = F.hand();
    c.save();
    c.globalAlpha = a * 0.07;
    c.fillStyle = k.type; c.font = font(hand, 44); c.textAlign = 'left';
    const g = GHOST[i % GHOST.length]!;
    c.save(); c.translate(cl + 70, STUB_Y + stubs * 78 + 70 + hash(i, 3) * 40); c.rotate(-0.03); c.fillText(g, 0, 0);
    c.strokeStyle = k.type; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 18); c.quadraticCurveTo(160, 30, 300, 14); c.stroke(); c.restore();
    c.restore();
    if (stubs <= 1 && hash(i, 41) < 0.6) {
      const n = STICKY[i % STICKY.length]!, col = hash(i, 43) < 0.6 ? '#F4E07C' : '#F5B9AE';
      const x = cl + 300 + hash(i, 44) * 100, y = STUB_Y + stubs * 78 + 10 + hash(i, 45) * 40, r = (hash(i, 46) - 0.5) * 0.12;
      c.save();
      c.globalAlpha = a;
      c.translate(x, y); c.rotate(r);
      c.shadowColor = 'rgba(30,24,16,0.2)'; c.shadowBlur = 8; c.shadowOffsetX = 3; c.shadowOffsetY = 5;
      c.fillStyle = col; c.fillRect(0, 0, 190, 170);
      c.shadowColor = 'transparent';
      const cg = c.createLinearGradient(0, 120, 0, 170);
      cg.addColorStop(0, 'rgba(0,0,0,0)'); cg.addColorStop(1, 'rgba(60,40,0,0.08)');
      c.fillStyle = cg; c.fillRect(0, 0, 190, 170);
      c.fillStyle = 'rgba(0,0,0,0.05)'; c.fillRect(0, 0, 190, 26);
      c.fillStyle = '#2A2F3A'; c.font = font(hand, 42);
      n.split('\n').forEach((ln, li) => c.fillText(ln, 16, 72 + li * 46));
      c.restore();
    }
  }

  // ------------------------------------------------------------------ the ticket

  private drawCard(c: CanvasRenderingContext2D, t: number, k: Look, card: ReturnType<HarvestRemixBacklog['card']>) {
    if (t < this.tDrop) return;
    const CH = this.CH, paper = mixHex(k.bg, '#ffffff', 0.78);
    const body = this.font('body'), mono = this.font('mono'), disp = this.font('display');
    c.save();
    c.globalAlpha = card.alpha;
    c.translate(card.x, card.y);
    c.rotate(card.ang);
    c.scale(card.scale, card.scale);
    c.translate(-CW / 2, -CH / 2);
    // shadows: a soft one that spreads as the card lifts, a tight contact one as it rests
    c.save();
    const L = card.lift;
    c.shadowColor = `rgba(30,24,16,${0.2 + 0.06 * L})`; c.shadowBlur = 14 + 34 * L; c.shadowOffsetX = 5 + 22 * L; c.shadowOffsetY = 9 + 30 * L;
    c.fillStyle = paper; c.beginPath(); c.roundRect(0, 0, CW, CH, 8); c.fill();
    c.shadowColor = `rgba(30,24,16,${0.28 * (1 - L)})`; c.shadowBlur = 2; c.shadowOffsetX = 1; c.shadowOffsetY = 1.5;
    c.fill();
    c.restore();
    // the paper: a faint fall-off from the top edge
    const g = c.createLinearGradient(0, 0, 0, CH);
    g.addColorStop(0, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(0,0,0,0.02)');
    c.fillStyle = g; c.beginPath(); c.roundRect(0, 0, CW, CH, 8); c.fill();

    // the key, the assignee
    text(c, this.P.ticket, PAD, 64, mono, 30, k.dim, { track: 1 });
    const av = ease.outBack(prog(t, this.tAvatar, this.tAvatar + 0.3));
    if (av > 0) this.avatar(c, CW - PAD - 28, 54, 28 * av, k);

    // the title, typed
    const n = typed(this.P.title, t, this.tLand + 0.08, this.tTitle1).length;
    let left = n, ty = 128;
    for (const row of this.rows) {
      const s = row.slice(0, Math.max(0, left));
      const w = text(c, s, PAD, ty, body, TITLE_PX, k.type);
      if (left > 0 && left <= row.length && n < this.P.title.length && cursorOn(this.ctx.audio.beatAt(t) * 2)) {
        c.fillStyle = k.type; c.fillRect(PAD + w + 3, ty - TITLE_PX * 0.78, 3, TITLE_PX * 0.92);
      }
      left -= row.length + 1;
      ty += TITLE_LH;
    }

    // the bottom row: the attachment (the crate), the moves counter, the priority chip
    const by = CH - 58;
    c.fillStyle = k.rule; c.fillRect(PAD, by - 34, CW - 2 * PAD, 1.5);
    const cr = ease.outBack(prog(t, this.tCrate, this.tCrate + 0.32));
    if (cr > 0) {
      c.save(); c.translate(PAD + 46, by + 14); c.scale(cr, cr); this.crate(c, -46, -20, k); c.restore();
    }
    if (card.n > 0) {
      const i = card.n - 1, v = this.movedAt[i]!, pop = hit(t, this.shoves[i]!, 0.1);
      const last = card.n === this.shoves.length ? hit(t, this.shoves[i]!, 0.35) : 0;
      const mx = PAD + 134;
      const w0 = text(c, 'Moved ', mx, by + 24, mono, 28, k.dim);
      c.save();
      c.translate(mx + w0, by + 24); c.scale(1 + 0.25 * pop + 0.2 * last, 1 + 0.25 * pop + 0.2 * last);
      text(c, `${v}×`, 0, 0, mono, 28, mixHex(k.dim, k.type, Math.max(pop, card.n === this.shoves.length ? 1 : 0)));
      c.restore();
    }
    if (this.priority && t >= this.tStamp - 0.12) {
      const p = prog(t, this.tStamp - 0.12, this.tStamp, ease.inQuad);
      const sc = lerp(2.4, 1, p) * (1 - 0.07 * hit(t, this.tStamp, 0.06));
      const pw = measure(this.priority, disp, 28, 0.5) + 28 * 1.1;
      c.save();
      c.globalAlpha = card.alpha * clamp(p * 2);
      c.translate(CW - PAD - pw / 2, by + 14); c.rotate(-0.05 + (1 - p) * -0.12); c.scale(sc, sc);
      pill(c, this.priority, 0, 0, disp, 28, k.accent, k.onAccent, 'center');
      c.restore();
      // the stamp's ink ring, out from the chip
      const rg = prog(t, this.tStamp, this.tStamp + 0.45);
      if (rg > 0 && rg < 1) {
        c.strokeStyle = k.a('accent', 0.5 * (1 - rg)); c.lineWidth = 3;
        c.beginPath(); c.roundRect(CW - PAD - pw - 24 * rg, by + 14 - 22 - 24 * rg, pw + 48 * rg, 44 + 48 * rg, 22 + 24 * rg); c.stroke();
      }
    }
    c.restore();
  }

  /** The grey assignee circle: an unassigned head-and-shoulders. */
  private avatar(c: CanvasRenderingContext2D, x: number, y: number, r: number, k: Look) {
    c.save();
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
    c.fillStyle = mixHex(k.rule, k.bg, 0.3); c.fill();
    c.clip();
    c.fillStyle = mixHex(k.dim, k.rule, 0.35);
    c.beginPath(); c.arc(x, y - r * 0.18, r * 0.34, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(x, y + r * 0.82, r * 0.66, r * 0.5, 0, 0, Math.PI * 2); c.fill();
    c.restore();
  }

  /** The attachment: the cardboard crate of the new math, stamped, front face at (x, y), 92 × 54. */
  private crate(c: CanvasRenderingContext2D, x: number, y: number, k: Look) {
    const kraft = mixHex('#8c6d4b', k.dim, 0.15), w = 92, h = 54, d = 14;
    c.fillStyle = mixHex(kraft, '#ffffff', 0.2);
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + d, y - d); c.lineTo(x + w + d, y - d); c.lineTo(x + w, y); c.closePath(); c.fill();
    c.fillStyle = mixHex(kraft, '#000000', 0.22);
    c.beginPath(); c.moveTo(x + w, y); c.lineTo(x + w + d, y - d); c.lineTo(x + w + d, y + h - d); c.lineTo(x + w, y + h); c.closePath(); c.fill();
    c.fillStyle = kraft; c.fillRect(x, y, w, h);
    c.fillStyle = 'rgba(232,214,178,0.75)'; // the tape over the lid's seam
    c.beginPath(); c.moveTo(x + w / 2 - 7, y); c.lineTo(x + w / 2 - 7 + d, y - d); c.lineTo(x + w / 2 + 7 + d, y - d); c.lineTo(x + w / 2 + 7, y); c.closePath(); c.fill();
    c.fillRect(x + w / 2 - 7, y, 14, 9);
    const ink = '#2b1d10';
    c.save();
    c.translate(x + w / 2, y + h / 2 + 4); c.rotate(-0.06);
    c.strokeStyle = ink; c.lineWidth = 2; c.globalAlpha *= 0.85;
    c.strokeRect(-40, -15, 80, 30);
    text(c, 'LATER', 0, 9, this.font('stencil'), 25, ink, { align: 'center', track: 1 });
    c.restore();
  }

  // ------------------------------------------------------------------ the comment

  private drawSlip(c: CanvasRenderingContext2D, t: number, k: Look, card: ReturnType<HarvestRemixBacklog['card']>) {
    const a = ease.outCubic(prog(t, this.tSlip, this.tSlip + 0.45));
    const body = this.font('body'), mono = this.font('mono');
    const w = CW - 48, h = 196, x = card.x - CW / 2 + 48, y = CARD_Y + this.CH + 24 - (1 - a) * 70;
    c.save();
    c.globalAlpha = a;
    // the thread: a hairline from the card down to the slip
    c.fillStyle = k.rule; c.fillRect(x - 24, CARD_Y + this.CH + 6, 2, (y + 44) - (CARD_Y + this.CH + 6));
    c.fillRect(x - 24, y + 43, 24, 2);
    c.translate(x, y);
    c.rotate(0.006);
    c.save();
    c.shadowColor = 'rgba(30,24,16,0.18)'; c.shadowBlur = 10; c.shadowOffsetX = 4; c.shadowOffsetY = 6;
    c.fillStyle = mixHex(k.bg, '#ffffff', 0.7); c.beginPath(); c.roundRect(0, 0, w, h, 8); c.fill();
    c.restore();
    // the commenter
    c.beginPath(); c.arc(42, 44, 22, 0, Math.PI * 2); c.fillStyle = k.dim; c.fill();
    text(c, 'S', 42, 53, this.font('display'), 26, k.onAccent, { align: 'center' });
    const nw = text(c, 'Somebody', 78, 53, body, 28, k.type);
    text(c, '· just now', 78 + nw + 12, 53, mono, 24, k.dim);
    // the comment: a typing indicator, then the words as the quote is sung
    const s = typedWith(this.comment, this.typeWords, t);
    if (!s) {
      const b = this.ctx.audio.beatAt(t);
      for (let i = 0; i < 3; i++) {
        const ph = (b * 2 - i * 0.22) % 1;
        c.beginPath(); c.arc(84 + i * 22, 106 - 5 * Math.max(0, Math.sin(ph * Math.PI)), 6, 0, Math.PI * 2);
        c.fillStyle = mixHex(k.rule, k.dim, 0.3 + 0.7 * Math.max(0, Math.sin(ph * Math.PI))); c.fill();
      }
    } else {
      const tw = text(c, s, 26, 116, body, 38, k.type);
      if (s.length < this.comment.length || cursorOn(this.ctx.audio.beatAt(t))) {
        c.fillStyle = k.type; c.fillRect(26 + tw + 3, 116 - 30, 3, 36);
      }
    }
    // the reaction, on the anchor: a thumbs-up counting up
    if (this.likes > 0 && t >= this.tLike) {
      const p = ease.outBack(prog(t, this.tLike, this.tLike + 0.28));
      const nLikes = Math.min(this.likes, 1 + Math.floor((t - this.tLike) / 0.13));
      const bump = hit(t, this.tLike + (nLikes - 1) * 0.13, 0.08);
      c.save();
      c.translate(26 + 46, 160); c.scale(p * (1 + 0.12 * bump), p * (1 + 0.12 * bump));
      c.beginPath(); c.roundRect(-46, -22, 92, 44, 22);
      c.fillStyle = mixHex(k.bg, k.rule, 0.5); c.fill();
      c.strokeStyle = k.rule; c.lineWidth = 1.5; c.stroke();
      this.thumb(c, -20, 1, 26, k.type);
      text(c, `${nLikes}`, 14, 10, mono, 26, k.type);
      c.restore();
    }
    c.restore();
  }

  /** A thumbs-up glyph, centred at (x, y), about s px tall. */
  private thumb(c: CanvasRenderingContext2D, x: number, y: number, s: number, col: string) {
    c.save();
    c.translate(x, y); c.scale(s / 26, s / 26);
    c.fillStyle = col;
    c.beginPath(); c.roundRect(-12, -1, 5, 13, 1.5); c.fill(); // the cuff
    c.beginPath(); // the fist and the raised thumb
    c.moveTo(-5, -1);
    c.lineTo(-1, -9); c.quadraticCurveTo(0.5, -13, 3, -12); c.quadraticCurveTo(5, -11, 4, -7); c.lineTo(3, -2);
    c.lineTo(9, -2); c.quadraticCurveTo(12, -2, 11.5, 1); c.lineTo(10, 10); c.quadraticCurveTo(9.5, 12, 7, 12);
    c.lineTo(-5, 12); c.closePath(); c.fill();
    c.restore();
  }
}
