// FORCE PUSH — the push (chorus1 L15–L18, chorus2 L37–L40, drop L53–L54; params.n = 1, 2, 3).
// The graph from verse 1, same geometry, every time in a later state. FORCE slams in on the pickup, PUSH! on
// the downbeat: the whole current line (and the ex's lane) drops into a ghost lane — unreachable, still in
// the reflog — and a rewritten line appears on main; origin/main jumps to its tip. "I rewrote the past":
// commit messages reword us: → me: one per beat, and "you and" is struck from the sung line. "Right over
// your lies": the pointer runs along the ghost lane striking each lie. "Brand new timeline": the green line
// runs off the frame; "no goodbyes": a merge-back connector starts and gives up.
// n = 2: the ex's revert commits sit on a side lane and go down with the line; two ghost lanes.
// n = 3 (the drop, paper mode): three ghost lanes, every lie struck at once, the biggest hit.
import { type Frame } from '../engine/scene';
import type { Word } from '../engine/lyrics';
import { clamp, ease, lerp, prog } from '../engine/util';
import { FPScene, FONT, M, W, MAIN, OTHER, REVERTS, LIES, reword, theme, arrive, camera, fitWords, hit, lineShow, monoText, node, sing, strike, text } from '../force-push/kit';
import { GHOST_Y, GX, GY, R, SIDE_FROM, SIDE_Y, SX, branch, edge, label, pointer } from '../force-push/graph';
import { measure } from '../engine/type';
import { hexStr, type KLayout } from './_kit';

const NEW = 12; // commits on each rewritten line
const SLAM_Y = 318, REST_Y = 430, HERO_Y = 262;

/** The lines each run drops into the ghost lanes (newest first) and the line it starts from. */
interface Line { n: number; hashes: string[]; msgs: string[] }
const lineOf = (k: number): Line => k === 0
  ? { n: MAIN.length, hashes: MAIN.map((m) => m.h), msgs: MAIN.map((m) => m.m) }
  : { n: NEW, hashes: Array.from({ length: NEW }, (_, i) => hexStr(7, 500 + k * 40 + i)), msgs: MAIN.slice(0, NEW).map((m) => reword(m.m)) };

export default class Chorus extends FPScene {
  n = 1;
  ids: string[] = [];
  slamA!: { line: string; force: Word; push: Word; rest: KLayout; restWords: Word[] };
  slamB: typeof this.slamA | null = null;
  heroLays = new Map<string, KLayout>();
  tPush = 0; tRewrote = 0; tPast = 0; tYouAnd = 0; tLineEnd16 = 0; tRight = 0; tLies = 0; tTimeline = 0; tGoodbyes = 0;
  forceW = 0; pushW = 0; slamSize = 200;

  override setup() {
    this.n = Number(this.ctx.params.n ?? 1);
    if (this.n === 3) { this.mode = 'paper'; this.th = theme('paper'); }
    const base = this.n === 1 ? 15 : this.n === 2 ? 37 : 53;
    this.ids = (this.n === 3 ? [53, 54] : [base, base + 1, base + 2, base + 3]).map((i) => `L${i}`);
    const slamIds = this.ids.filter((id) => /^FORCE/.test(this.line(id).text));
    const mk = (id: string) => {
      const ws = this.line(id).words;
      const restWords = ws.slice(2);
      return { line: id, force: ws[0]!, push: ws[1]!, restWords, rest: fitWords(restWords, FONT.line, W - 2 * M, 104, 70, 1) };
    };
    this.slamA = mk(slamIds[0]!);
    this.slamB = slamIds[1] ? mk(slamIds[1]) : null;
    // as big as fits the safe width (the drop's is the biggest the frame allows)
    const fit = (100 * (W - 2 * M - 44)) / (measure('FORCE', FONT.slam, 100, -2) + measure('PUSH!', FONT.slam, 100, -2));
    this.slamSize = Math.min(this.n === 3 ? 240 : 200, Math.floor(fit));
    this.forceW = measure('FORCE', FONT.slam, this.slamSize, -4);
    this.pushW = measure('PUSH!', FONT.slam, this.slamSize, -4);
    for (const id of this.ids) if (!/^FORCE/.test(this.line(id).text)) this.heroLays.set(id, fitWords(this.line(id).words, FONT.line, 1300, 104, 70, 2));
    this.tPush = this.slamA.push.start;
    const rw = this.ids.find((id) => /rewrote/.test(this.line(id).text));
    if (rw) {
      this.tRewrote = this.word(rw, 'rewrote').start;
      this.tPast = this.word(rw, 'past,').start;
      this.tYouAnd = this.word(rw, 'and').end;
      this.tLineEnd16 = this.line(rw).end;
    }
    const lies = this.slamB ?? this.slamA;
    this.tRight = (this.slamB ? this.word(lies.line, 'Right') : this.word(this.slamA.line, 'Right')).start;
    this.tLies = this.word(lies.line, 'lies').start;
    const tl = this.ids.find((id) => /^Brand/.test(this.line(id).text))!;
    this.tTimeline = this.word(tl, 'timeline,').start;
    this.tGoodbyes = this.word(tl, 'goodbyes').start;
  }

  draw(c: CanvasRenderingContext2D, f: Frame) {
    const t = f.t, th = this.th;
    const u = prog(t, this.tPush, this.tPush + 0.55, ease.inOutCubic); // the push
    // camera: settle in, follow the new line to the right in "Brand new timeline", pull out in the drop
    const pan = prog(t, this.tTimeline - 0.2, this.tTimeline + 2.4, ease.inOutCubic);
    const zoom = this.n === 3 ? lerp(1.0, 0.9, ease.inOutCubic(prog(t, this.tPush, this.tPush + 1.2))) : 1;
    c.save();
    camera(c, zoom * (1 + 0.02 * hit(t, this.tPush, 0.12)), W / 2, 700, -pan * 220, 0);
    this.ghosts(c, t, u);
    this.oldLine(c, t, u);
    this.newLine(c, t, u, pan);
    c.restore();

    // counters
    const pushes = t >= this.tPush ? this.n : this.n - 1;
    monoText(c, `force pushes: ${pushes}`, W - M, 110, 30, th.type, { fam: FONT.monoB, align: 'right' });
    monoText(c, `origin/main → ${t >= this.tPush ? lineOf(this.n).hashes[NEW - 1] : lineOf(this.n - 1).hashes[lineOf(this.n - 1).n - 1]}`, W - M, 150, 26, th.mist, { fam: FONT.monoM, align: 'right' });

    this.slam(c, t, this.slamA);
    if (this.slamB) this.slam(c, t, this.slamB);
    for (const [id, lay] of this.heroLays) this.hero(c, t, id, lay);
  }

  /** FORCE / PUSH! slam words over the centre, then the rest of the line under them. */
  /** This entry's lines in order, shown one at a time (slam lines centre, the others top left). */
  private show(t: number, id: string) {
    const seq = this.ids.map((x) => this.line(x));
    return lineShow(t, seq, this.ids.indexOf(id), this.ctx.end + 1, 0.3, 0.06);
  }

  private slam(c: CanvasRenderingContext2D, t: number, s: NonNullable<Chorus['slamB']>) {
    const th = this.th, size = this.slamSize;
    const a = Math.min(this.show(t, s.line), clamp((t - (s.force.start - 0.06)) / 0.05));
    if (a <= 0) return;
    const gap = 44, total = this.forceW + gap + this.pushW, x0 = (W - total) / 2;
    c.save(); c.globalAlpha = a;
    // FORCE: in from the left on its word; PUSH!: down onto the downbeat
    const kf = arrive(t, s.force.start - 0.03, 0.14), kp = arrive(t, s.push.start - 0.03, 0.12);
    const pushCol = this.n === 3 ? th.green : th.type;
    if (kf > 0) text(c, 'FORCE', x0 - (1 - kf) * 120, SLAM_Y, FONT.slam, size, th.type, { track: -4 });
    if (kp > 0) {
      const sc = 1 + 0.35 * (1 - kp);
      c.save(); c.translate(x0 + this.forceW + gap + this.pushW / 2, SLAM_Y - size * 0.35); c.scale(sc, sc);
      text(c, 'PUSH!', -this.pushW / 2, size * 0.35, FONT.slam, size, pushCol, { track: -4 });
      c.restore();
    }
    // the rest of the line, sung under the slam, centred
    sing(c, s.rest, t, (W - s.rest.width) / 2, REST_Y, th, { dim: 0.18, color: { lies: th.coral, history: th.mist } });
    c.restore();
  }

  /** A non-slam line as the hero, top left; "you and" struck once sung. */
  private hero(c: CanvasRenderingContext2D, t: number, id: string, lay: KLayout) {
    const th = this.th, l = this.line(id);
    const a = this.show(t, id);
    if (a <= 0) return;
    c.save(); c.globalAlpha = a;
    sing(c, lay, t, M, HERO_Y - (1 - a) * 12, th, { dim: 0.18, color: { me: th.green, timeline: th.green } });
    // "there's no you and me": strike "you and", leaving "me"
    if (/rewrote/.test(l.text)) {
      const ws = l.words, wy = ws.find((w) => w.w === 'you')!, wa = ws.find((w) => w.w === 'and')!;
      const p = prog(t, this.tYouAnd + 0.05, this.tYouAnd + 0.35, ease.outCubic);
      const pos = (w: Word) => {
        for (let r = 0; r < lay.rows.length; r++) for (const it of lay.rows[r]!.items) if (it.w === w) return { x: M + it.x, w: it.width, y: HERO_Y + r * lay.size };
        return null;
      };
      const py = pos(wy), pa = pos(wa);
      if (py && pa && p > 0) strike(c, py.x - 6, py.y - lay.size * 0.3, pa.x + pa.w + 6, p, th.coral, Math.max(6, lay.size * 0.08));
    }
    c.restore();
  }

  /** Earlier pushes' lines, dashed and dim, labelled unreachable; they shift down one lane at the push. */
  private ghosts(c: CanvasRenderingContext2D, t: number, u: number) {
    for (let k = 0; k < this.n - 1; k++) {
      const ln = lineOf(this.n - 2 - k); // newest first
      const y = lerp(GHOST_Y(k), GHOST_Y(k + 1), u);
      this.drawGhost(c, t, ln, y, k + (u > 0.5 ? 1 : 0));
    }
  }

  private drawGhost(c: CanvasRenderingContext2D, t: number, ln: Line, y: number, lane: number) {
    const th = this.th;
    const col = th.a('dim', 0.75);
    edge(c, GX(0), y, GX(ln.n - 1), y, col, 3, 1, [7, 9]);
    for (let i = 0; i < ln.n; i++) node(c, GX(i), y, R * 0.8, 'you', col, { ring: 2.5, fillIn: th.bg });
    // (the newest lane is labelled above its tip; older ones at their right end, clear of the lies above them)
    if (lane === 0) monoText(c, 'unreachable · still in the reflog', GX(ln.n - 1) + 24, y - 24, 22, th.dim, { fam: FONT.monoM, align: 'right' });
    else monoText(c, 'unreachable', GX(ln.n - 1) + 30, y + 8, 22, th.dim, { fam: FONT.monoM });
    this.lies(c, t, ln, y, lane);
  }

  /** Lie labels under a ghost lane, struck as the pointer runs over them ("Right over your lies"). */
  private lies(c: CanvasRenderingContext2D, t: number, ln: Line, y: number, lane: number) {
    // n = 1, 2: the newest ghost lane carries the lies; n = 3: every lane does, all struck at once
    if (this.n < 3 && lane !== 0) return;
    const th = this.th;
    const words = this.n === 2 || lane % 2 === 1 ? REVERTS.map((r) => r.m) : LIES;
    const show = arrive(t, this.tRight - 0.4, 0.25);
    if (show <= 0) return;
    const run = prog(t, this.tRight, this.tLies + 0.25, ease.inOutCubic);
    const xs = [2, 5, 8, 11].map((i) => GX(Math.min(i, ln.n - 1)));
    const runX = lerp(GX(0) - 40, GX(ln.n - 1) + 40, run);
    xs.forEach((x, i) => {
      const s = words[i % words.length]!;
      const w = monoText(c, s, x, y + 46, 24, th.a('coral', show), { fam: FONT.monoB, align: 'center' });
      const p = clamp((runX - (x - w / 2)) / Math.max(1, w));
      strike(c, x - w / 2 - 4, y + 38, x + w / 2 + 4, p, th.coral, 4);
    });
    if (run > 0 && run < 1) {
      // the pointer running over them
      c.save(); c.shadowColor = th.green; c.shadowBlur = 18;
      c.fillStyle = th.green; c.fillRect(runX - 3, y - 26, 6, 52);
      c.restore();
    }
  }

  /** The line being pushed over (and, n = 1, 2, the ex's lane): in place before the push, dropping into ghost lane 0 at it. */
  private oldLine(c: CanvasRenderingContext2D, t: number, u: number) {
    const th = this.th, ln = lineOf(this.n - 1);
    const y = lerp(GY, GHOST_Y(0), u);
    if (u >= 1) { this.drawGhost(c, t, ln, y, 0); }
    else {
      const col = this.n === 1 ? th.a('type', 0.55) : th.green;
      edge(c, GX(0), y, GX(ln.n - 1), y, col, 4, 1, u > 0 ? [7, 9] : undefined);
      for (let i = 0; i < ln.n; i++) {
        const gap = this.n === 1 && i === 12; // the stashed commit
        node(c, GX(i), y, R, gap ? 'you' : 'me', gap ? th.dim : lerpCol(th, u), { ring: 2.5 });
      }
      for (let i = 0; i < ln.n; i += 3) label(c, ln.hashes[i]!, GX(i), y + 46, th.a('dim', 1 - u), 18);
    }
    // the ex's lane: `other` (n = 1), the revert attempts (n = 2) — goes down with the line
    if (this.n < 3) {
      const lane = this.n === 1 ? OTHER : REVERTS;
      // (it folds into the ghost lane: unreachable with the rest)
      const ly = lerp(SIDE_Y, GHOST_Y(0), u), la = 1 - 0.85 * u;
      c.save(); c.globalAlpha = la;
      const from = this.n === 1 ? SIDE_FROM : 6;
      branch(c, GX(from) + R * 0.7, y - R * 0.7, SX(0) - R, ly, th.coral, 4, 1, u > 0 ? [7, 9] : undefined);
      lane.forEach((cm, j) => {
        if (j > 0) edge(c, SX(j - 1) + R, ly, SX(j) - R, ly, th.coral, 4);
        node(c, SX(j), ly, R, 'you', th.coral, { ring: 4.5, fillIn: th.bg });
        if (u < 0.3) label(c, cm.m, SX(j), j % 2 ? ly + 46 : ly - 32, th.a('coral', 0.9 * (1 - u / 0.3)), 20);
      });
      if (u < 0.5) pointer(c, this.n === 1 ? 'other' : 'you/revert', SX(lane.length - 1), ly, th, { col: th.coral, dy: 70, a: 1 - u * 2 });
      c.restore();
    }
    // origin/main and HEAD before the push
    if (u <= 0) pointer(c, 'HEAD → main · origin/main', GX(ln.n - 1), GY, th, { dy: 66, size: 24, glow: true });
  }

  /** The rewritten line: drawn on main at the push; reworded in "I rewrote the past"; extended in "Brand new timeline". */
  private newLine(c: CanvasRenderingContext2D, t: number, u: number, pan: number) {
    const th = this.th;
    if (u <= 0) return;
    const grow = prog(t, this.tPush + 0.05, this.tPush + 0.45, ease.outCubic);
    // "Brand new timeline": the line keeps going, off the right edge
    const ext = prog(t, this.tTimeline - 0.05, this.tTimeline + 1.8, ease.inOutCubic);
    const xEnd = lerp(GX(NEW - 1), GX(NEW - 1) + 260 + 900, ext);
    edge(c, GX(0), GY, lerp(GX(0), GX(NEW - 1), grow), GY, th.green, 5);
    if (ext > 0) edge(c, GX(NEW - 1), GY, xEnd, GY, th.green, 5);
    for (let i = 0; i < NEW; i++) {
      const k = clamp((grow * NEW - i) / 1.5);
      node(c, GX(i), GY, R, 'me', th.type, { a: k });
      if (k > 0.5) { c.strokeStyle = th.green; c.lineWidth = 3; c.beginPath(); c.arc(GX(i), GY, R + 3, 0, Math.PI * 2); c.stroke(); }
    }
    // new commits on the extension
    for (let j = 0; j < 6; j++) {
      const x = GX(NEW - 1) + 130 * (j + 1);
      if (x > xEnd - 10) break;
      node(c, x, GY, R, 'me', th.type);
    }
    // messages: us: → me:, one per beat from "rewrote"
    if (this.tRewrote > 0) {
      const show = arrive(t, this.tRewrote - 0.4, 0.3) * (1 - prog(t, this.tLineEnd16 + 0.6, this.tLineEnd16 + 1.0));
      if (show > 0) {
        [1, 3, 5, 7].forEach((i, k) => {
          const raw = this.n === 2 && k === 0 ? 'revert: us' : MAIN[i]!.m;
          const flipAt = this.ctx.audio.timeOfBeat(Math.ceil(this.ctx.audio.beatAt(this.tRewrote)) + k);
          const done = t >= flipAt;
          const s = done ? reword(raw) : raw;
          const y = k % 2 ? GY - 88 : GY - 46;
          c.save(); c.globalAlpha = show;
          label(c, s, GX(i), y, done ? th.green : th.mist, 24);
          c.restore();
        });
      }
    }
    // origin/main jumps from the old tip (dropping into the ghost lane) to the new tip, on an arc
    const j = prog(t, this.tPush + 0.05, this.tPush + 0.5, ease.inOutCubic);
    const oldTip = GX(lineOf(this.n - 1).n - 1);
    // (the newest commit on the extension still on screen: the pointer never leaves the frame)
    const onScreen = W - M - 230 + pan * 220;
    const tipX = ext > 0 ? Math.max(GX(NEW - 1), Math.min(xEnd, onScreen, GX(NEW - 1) + 130 * Math.floor((Math.min(xEnd, onScreen) - GX(NEW - 1)) / 130))) : GX(NEW - 1);
    const px = lerp(oldTip, tipX, j), py = GY - Math.sin(Math.PI * j) * 120;
    pointer(c, 'HEAD → main · origin/main', px, py, th, { dy: 66, size: 24, glow: true });
    // "no goodbyes": a merge-back connector starts down towards the ghost lane and gives up
    const g = prog(t, this.tGoodbyes, this.tGoodbyes + 0.6);
    if (g > 0 && g < 1) {
      c.save(); c.globalAlpha = 1 - ease.inQuad(g);
      branch(c, tipX, GY + R, tipX - 300, GHOST_Y(0), th.mist, 3, Math.min(0.4, g * 1.2), [6, 7]);
      monoText(c, 'no merge', tipX - 20, GY + 70, 24, th.mist, { fam: FONT.monoM, align: 'right' });
      c.restore();
    }
  }

  override post(f: Frame) {
    const t = f.t;
    let k = hit(t, this.tPush, 0.11) + 0.4 * hit(t, this.slamA.force.start, 0.08);
    if (this.slamB) k = Math.max(k, hit(t, this.slamB.push.start, 0.11) + 0.4 * hit(t, this.slamB.force.start, 0.08));
    const big = this.n === 3 ? 1.6 : 1;
    return { zoom: 1 + 0.02 * k * big, shake: [k * 5 * big, -k * 3 * big] as [number, number], flash: this.n === 3 ? 0.12 * hit(t, this.tPush, 0.1) : 0 };
  }
}

/** The pushed-over line's commits fade from type to dim as they drop. */
function lerpCol(th: FPScene['th'], u: number) { return u < 0.5 ? th.type : th.dim; }
