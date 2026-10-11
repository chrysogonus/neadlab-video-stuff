// FORCE PUSH — the terminal. Intro (cues hook, L00–L02) and outro (L61–L63, tag) share one framing, so
// the ending lands on the composition the video opened with.
// Intro: a huge block cursor blinks on the filtered beat; `git status` types with the voice and the view
// pulls back to the whole terminal; the status line prints and "nothing to commit" lights as sung while
// ", working tree clean" stays dim (the plant); "Story of your life." lands as the hero line; then
// `git log --graph --all` types itself into the pad (the graph scene opens on that command).
// Outro: `git reflog` still lists the ex's states (coral); "expires in 30 days"; "I can wait."; the hit
// runs the thirty days out, `git gc` prunes one entry per beat of the tag, and when the drums drop out
// `git status` prints the planted line again — the clean half lit green.
import { type Frame } from '../engine/scene';
import { Lyrics, type Word } from '../engine/lyrics';
import { font, measure } from '../engine/type';
import { clamp, ease, lerp, prog } from '../engine/util';
import { FPScene, FONT, H, W, HASH, MAIN, OTHER, REVERTS, arrive, cursor, cursorOn, fitWords, hit, lineShow, monoText, panel, pill, sing, text, typed } from '../force-push/kit';
import type { KLayout } from './_kit';

// the terminal, in logical px (the same in both modes)
const P = { x: 240, y: 96, w: 1440, h: 650 };
const CX = P.x + 48; // text column
const PROMPT = { y: 240, size: 44 };
const MONO = 30; // output lines
const OUT1 = 306, OUT2 = 348;
const STATUS = { y: 462, size: 58 };
const PROMPT2 = 580;
const HERO_Y = 912; // the hero line sits under the terminal, on the ground

/** `~/us main $ ` drawn at (x, y); returns the x where the command starts. */
function prompt(c: CanvasRenderingContext2D, x: number, y: number, size: number, th: FPScene['th']) {
  let cx = x;
  cx += monoText(c, '~/us ', cx, y, size, th.mist, { fam: FONT.monoM });
  cx += monoText(c, 'main', cx, y, size, th.green, { fam: FONT.monoB });
  cx += monoText(c, ' $ ', cx, y, size, th.type, { fam: FONT.monoM });
  return cx;
}

/** Characters of each part typed across its word (a command typed with the voice). */
function typedParts(parts: [Word, string][], t: number) {
  let s = '';
  for (const [w, p] of parts) {
    const k = Lyrics.wordProgress(w, t);
    s += p.slice(0, Math.round(p.length * k));
    if (k < 1) break;
  }
  return s;
}

export default class Terminal extends FPScene {
  outro = false;
  // intro
  tGit = 0; tEnter = 0; tStatusEnd = 0;
  heroLay!: KLayout;
  // outro
  reflog: { h: string; ref: string; msg: string; you: boolean }[] = [];
  heroWait!: KLayout;
  tagStart = 0; gcAt: number[] = []; tStatus2 = 0; daysEnd = 0;

  override setup() {
    this.outro = this.ctx.params.mode === 'outro';
    if (!this.outro) {
      const l0 = this.line('L00');
      this.tGit = l0.words[0]!.start;
      this.tStatusEnd = l0.words[1]!.end;
      this.tEnter = this.tStatusEnd + 0.1;
      this.heroLay = fitWords(this.line('L02').words, FONT.hero, P.w, 160, 90, 1);
    } else {
      this.setupOutro();
    }
  }

  draw(c: CanvasRenderingContext2D, f: Frame) {
    if (this.outro) this.drawOutro(c, f);
    else this.drawIntro(c, f);
  }

  // ---------------------------------------------------------------- intro

  private drawIntro(c: CanvasRenderingContext2D, f: Frame) {
    const t = f.t, th = this.th;
    const l0 = this.line('L00'), l1 = this.line('L01');
    // prompt geometry at scale 1
    c.font = font(FONT.monoM, PROMPT.size);
    const cmdX = CX + measure('~/us main $ ', FONT.monoM, PROMPT.size);
    const cmd = typedParts([[l0.words[0]!, 'git '], [l0.words[1]!, 'status']], t);
    // hook: zoomed onto the cursor until "status.", then the pull-back to the whole terminal
    const z0 = 3.1;
    const back = ease.inOutCubic(prog(t, this.tGit + 0.12, this.tStatusEnd + 0.25));
    const z = lerp(z0, 1, back);
    // (the camera frames the whole prompt and follows the typing)
    const focusX = (CX + cmdX + measure(cmd, FONT.monoM, PROMPT.size) + PROMPT.size * 0.6) / 2, focusY = PROMPT.y - 16;
    const k = (z - 1) / (z0 - 1);
    c.save();
    c.translate(lerp(focusX, W / 2, k), lerp(focusY, H / 2, k));
    c.scale(z, z);
    c.translate(-focusX, -focusY);

    // the panel fades in as the view pulls back
    c.save();
    c.globalAlpha = clamp(back * 1.6);
    panel(c, P.x, P.y, P.w, P.h, th, { title: '~/us', right: 'zsh' });
    pill(c, 'main', P.x + P.w - 120, P.y + 27, { size: 22, fill: th.green, color: th.onGreen, align: 'right' });
    c.restore();

    // prompt 1 + command + cursor
    const x1 = prompt(c, CX, PROMPT.y, PROMPT.size, th);
    const cw = monoText(c, cmd, x1, PROMPT.y, PROMPT.size, th.type, { fam: FONT.monoM });
    if (t < this.tEnter) cursor(c, x1 + cw, PROMPT.y, PROMPT.size, th.type, cursorOn(f.beat));

    // output
    if (t >= this.tEnter) {
      const o = arrive(t, this.tEnter, 0.12);
      c.save(); c.globalAlpha = o;
      monoText(c, 'On branch main', CX, OUT1, MONO, th.dim);
      monoText(c, 'Your branch is up to date with \'origin/main\'.', CX, OUT2, MONO, th.dim);
      // the planted status line: the sung half lit with the voice, the rest dim
      const parts: [string, Word | null][] = [['nothing', l1.words[0]!], [' to', l1.words[1]!], [' commit', l1.words[2]!], [', working tree clean', null]];
      let x = CX;
      for (const [s, w] of parts) {
        const p = w ? Lyrics.wordProgress(w, t) : 0;
        const fam = FONT.monoB;
        const width = measure(s, fam, STATUS.size);
        monoText(c, s, x, STATUS.y, STATUS.size, th.a('type', w ? 0.22 : 0.16), { fam });
        if (p > 0) {
          c.save(); c.beginPath(); c.rect(x, STATUS.y - STATUS.size, width * p + 2, STATUS.size * 1.4); c.clip();
          monoText(c, s, x, STATUS.y, STATUS.size, th.type, { fam });
          c.restore();
        }
        x += width;
      }
      c.restore();
      // a bracket under the sung half once it is all sung
      const done = prog(t, l1.end, l1.end + 0.3, ease.outCubic);
      if (done > 0) {
        const wN = measure('nothing to commit', FONT.monoB, STATUS.size);
        c.fillStyle = th.a('type', 0.85);
        c.fillRect(CX, STATUS.y + 18, wN * done, 3);
      }
    }

    // prompt 2: the cursor waits, then `git log --graph --all` types itself into the pad
    const tP2 = l1.start - 0.3;
    if (t >= tP2) {
      const x2 = prompt(c, CX, PROMPT2, PROMPT.size, th);
      const log = typed('git log --graph --all', t, this.line('L02').end + 0.05, this.ctx.end - 0.12);
      const w2 = monoText(c, log, x2, PROMPT2, PROMPT.size, th.type, { fam: FONT.monoM });
      cursor(c, x2 + w2, PROMPT2, PROMPT.size, th.type, cursorOn(f.beat) || log.length > 0);
    }
    c.restore();

    // "Story of your life." — the hero line, with a leader from the status line
    const l2 = this.line('L02');
    const a2 = clamp((t - (l2.start - 0.35)) / 0.25);
    if (a2 > 0) {
      // a leader from the underlined status line down out of the terminal to the hero
      const lead = prog(t, l2.start - 0.35, l2.start + 0.05, ease.outCubic);
      const ly0 = STATUS.y + 22, ly1 = HERO_Y - this.heroLay.size * 0.82;
      c.strokeStyle = th.a('type', 0.55); c.lineWidth = 2;
      // (in the panel's left gutter, clear of the prompt below the status line)
      c.beginPath(); c.moveTo(CX - 4, ly0); c.lineTo(P.x + 22, ly0); c.lineTo(P.x + 22, lerp(ly0, ly1, lead)); c.stroke();
      c.save(); c.globalAlpha = a2;
      sing(c, this.heroLay, t, P.x, HERO_Y + (1 - a2) * 16, th, { dim: 0.18 });
      c.restore();
    }
  }

  override post(f: Frame) {
    if (this.outro) return this.postOutro(f);
    const k = hit(f.t, this.tEnter, 0.08) * 0.5;
    return { zoom: 1 + 0.006 * k, vignette: 0.3 };
  }

  // ---------------------------------------------------------------- outro

  private setupOutro() {
    const au = this.ctx.audio;
    // the reflog: the singer's pushes on top, the ex's old states (coral) underneath — still reachable here
    this.reflog = [
      { h: HASH.rewritten3, ref: 'HEAD@{0}', msg: 'push --force: forced-update', you: false },
      { h: HASH.rewritten3, ref: 'HEAD@{1}', msg: 'rebase -i (finish): returning to refs/heads/main', you: false },
      { h: OTHER[4]!.h, ref: 'HEAD@{2}', msg: 'checkout: moving from other to main', you: true },
      { h: REVERTS[0]!.h, ref: 'HEAD@{3}', msg: 'commit: Revert "force push"', you: true },
      { h: MAIN[14]!.h, ref: 'HEAD@{4}', msg: 'commit: us: we\'ll get to it', you: true },
      { h: MAIN[1]!.h, ref: 'HEAD@{5}', msg: 'commit: us: first date', you: true },
    ];
    this.heroWait = fitWords(this.line('L63').words, FONT.hero, P.w, 160, 90, 1);
    this.heroLay = fitWords(this.line('L61').words, FONT.hero, P.w, 160, 90, 1);
    this.tagStart = this.cue('tag').start;
    // the thirty days run out over the tag's first bars; gc then prunes one coral entry per beat
    const b0 = Math.ceil(au.beatAt(this.tagStart + 0.02));
    this.daysEnd = au.timeOfBeat(b0 + 9);
    this.gcAt = [0, 1, 2, 3].map((k) => au.timeOfBeat(b0 + 10 + k));
    // drums out: the status line again
    this.tStatus2 = au.timeOfBeat(b0 + 15);
  }

  private drawOutro(c: CanvasRenderingContext2D, f: Frame) {
    const t = f.t, th = this.th;
    const l61 = this.line('L61'), l63 = this.line('L63');
    // the same terminal as the opening, at scale 1
    const k = arrive(t, this.ctx.start, 0.15);
    c.save(); c.globalAlpha = k;
    panel(c, P.x, P.y, P.w, P.h, th, { title: '~/us', right: 'zsh' });
    pill(c, 'main', P.x + P.w - 120, P.y + 27, { size: 22, fill: th.green, color: th.onGreen, align: 'right' });
    c.restore();
    // git reflog, typed on "ref-log?"
    const x1 = prompt(c, CX, PROMPT.y, PROMPT.size, th);
    const wRef = this.word('L61', 'ref-log?');
    const cmd = typed('git reflog', t, wRef.start - 0.05, wRef.end - 0.05);
    const cw = monoText(c, cmd, x1, PROMPT.y, PROMPT.size, th.type, { fam: FONT.monoM });
    const enter = wRef.end;
    if (t < enter) cursor(c, x1 + cw, PROMPT.y, PROMPT.size, th.type, cursorOn(f.beat));
    // the entries
    const gc = t >= this.gcAt[0]! - 0.3;
    if (t >= enter) {
      let row = 0;
      this.reflog.forEach((e, i) => {
        const ap = arrive(t, enter + i * 0.06, 0.12);
        // gc prunes the coral entries, one per beat
        const ci = this.reflog.filter((x) => x.you).indexOf(e);
        const del = e.you ? prog(t, this.gcAt[ci]!, this.gcAt[ci]! + 0.2, ease.inCubic) : 0;
        if (del >= 1) return;
        const y = 306 + row * 46;
        row += 1 - del;
        c.save(); c.globalAlpha = ap * (1 - del);
        c.translate(del * 60, 0);
        const col = e.you ? th.coral : th.mist;
        let x = CX;
        x += monoText(c, e.h + ' ', x, y, 28, e.you ? th.coral : th.dim, { fam: FONT.monoM });
        x += monoText(c, e.ref + ': ', x, y, 28, th.type, { fam: FONT.monoB });
        monoText(c, e.msg, x, y, 28, col, { fam: FONT.monoM });
        // "It forgets you in thirty days": each coral entry gets its expiry
        if (e.you) {
          const ke = arrive(t, this.word('L62', 'forgets').start + ci * 0.12, 0.2);
          const left = Math.max(0, Math.round(30 * (1 - prog(t, this.tagStart, this.daysEnd))));
          if (ke > 0 && !gc) monoText(c, left > 0 ? `expires in ${left} day${left === 1 ? '' : 's'}` : 'expired', P.x + P.w - 48, y, 26, th.a('coral', ke * 0.85), { fam: FONT.monoB, align: 'right' });
        }
        c.restore();
      });
    }
    // the days: 30, then running out after the hit
    const kd = arrive(t, this.word('L62', 'thirty').start, 0.2);
    if (kd > 0 && t < this.tStatus2 - 0.2) {
      const left = Math.max(0, Math.round(30 * (1 - prog(t, this.tagStart, this.daysEnd))));
      const sc = 1 + 0.25 * hit(t, this.tagStart, 0.12);
      c.save(); c.translate(P.x + P.w - 48, 660); c.scale(sc, sc);
      text(c, `${left} day${left === 1 ? '' : 's'}`, 0, 0, FONT.hero, 96, th.a(left === 0 ? 'green' : 'type', kd), { align: 'right' });
      c.restore();
      monoText(c, left > 0 ? 'until the reflog forgets' : 'gc.reflogExpireUnreachable', P.x + P.w - 48, 700, 24, th.a('mist', kd), { fam: FONT.monoM, align: 'right' });
    }
    // git gc, then git status at the bottom prompt
    const pY = 640;
    if (t >= this.gcAt[0]! - 0.6 && t < this.tStatus2 - 0.1) {
      const x2 = prompt(c, CX, pY, PROMPT.size, th);
      monoText(c, typed('git gc', t, this.gcAt[0]! - 0.6, this.gcAt[0]! - 0.35), x2, pY, PROMPT.size, th.type, { fam: FONT.monoM });
      if (t >= this.gcAt[0]! - 0.3) {
        const pruned = this.gcAt.filter((g) => t >= g + 0.1).length;
        monoText(c, `Removing unreachable objects: ${pruned * 25}% (${pruned}/4)`, CX, pY + 52, 28, th.mist, { fam: FONT.monoM });
      }
    }
    if (t >= this.tStatus2 - 0.1) {
      // the planted line, now the other half lit
      const x2 = prompt(c, CX, PROMPT2 - 160, PROMPT.size, th);
      monoText(c, 'git status', x2, PROMPT2 - 160, PROMPT.size, th.type, { fam: FONT.monoM });
      const ks = arrive(t, this.tStatus2, 0.15);
      c.save(); c.globalAlpha = ks;
      monoText(c, 'On branch main', CX, PROMPT2 - 94, MONO, th.dim);
      const lit = prog(t, this.tStatus2 + 0.25, this.tStatus2 + 1.1, ease.inOutCubic);
      const nw = monoText(c, 'nothing to commit', CX, STATUS.y + 60, STATUS.size, th.a('type', 0.85), { fam: FONT.monoB });
      monoText(c, ', working tree clean', CX + nw, STATUS.y + 60, STATUS.size, th.a('type', 0.2), { fam: FONT.monoB });
      if (lit > 0) {
        const ww = measure(', working tree clean', FONT.monoB, STATUS.size);
        c.save(); c.beginPath(); c.rect(CX + nw, STATUS.y - 10, ww * lit, STATUS.size * 1.5); c.clip();
        monoText(c, ', working tree clean', CX + nw, STATUS.y + 60, STATUS.size, th.green, { fam: FONT.monoB });
        c.restore();
        c.fillStyle = th.green; c.fillRect(CX + nw + measure(', ', FONT.monoB, STATUS.size), STATUS.y + 78, (ww - measure(', ', FONT.monoB, STATUS.size)) * lit, 3);
      }
      c.restore();
      const x3 = prompt(c, CX, PROMPT2 + 30, PROMPT.size, th);
      cursor(c, x3, PROMPT2 + 30, PROMPT.size, th.type, cursorOn(f.beat));
    }
    // the hero lines under the terminal: "Oh, and the ref-log?", then "I can wait." (as "Story of your life.")
    const seq = [l61, l63];
    const a61 = lineShow(t, seq, 0, l63.start - 0.4, 0.3);
    if (a61 > 0) { c.save(); c.globalAlpha = a61; sing(c, this.heroLay, t, P.x, HERO_Y, th, { dim: 0.18 }); c.restore(); }
    const a63 = clamp((t - (l63.start - 0.3)) / 0.2) * clamp((this.tStatus2 - 0.2 - t) / 0.3);
    if (a63 > 0) { c.save(); c.globalAlpha = a63; sing(c, this.heroWait, t, P.x, HERO_Y, th, { dim: 0.18 }); c.restore(); }
  }

  private postOutro(f: Frame) {
    const t = f.t;
    let k = hit(t, this.tagStart, 0.12);
    for (const g of this.gcAt) k = Math.max(k, 0.5 * hit(t, g, 0.1));
    // the very end: the cursor blinks on, then a fade over the last half second of the song
    const fade = prog(t, this.ctx.end - 0.6, this.ctx.end - 0.05);
    return { zoom: 1 + 0.015 * k, shake: [k * 3, -k * 2] as [number, number], flash: 0.05 * hit(t, this.tagStart, 0.06), fade };
  }
}

