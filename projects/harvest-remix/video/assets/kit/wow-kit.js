// wow-kit.js — harvest-remix v16: explosive type, shockwaves, beat pulses and scene-switch transitions.
// Load after env.js and hr-kit.js, inside a frame's <template>:  <script src="assets/kit/wow-kit.js"></script>
// Everything is deterministic and seek-safe. Two kinds of helper:
//  - tween helpers (burst, shock, rays, flash, word, explode) add fromTo tweens / DOM bits on the frame's ONE paused timeline;
//  - state helpers (shake, punch, pulse, transition) register a pure function of time and are applied by WOW.draw(tl),
//    which the frame calls from its render() (next to HR.draw(tl)). They drive the CSS individual transform properties
//    (translate / rotate / scale) and `filter`, so they never fight GSAP's `transform` on the same element.
//    Give state helpers their own wrapper element (a shaken or pulsed element must not be driven by stage.apply()).
(function () {
  if (window.WOW) return;
  const HR = window.HR, WOW = {};
  const FIRE = "232, 93, 38", CREAM = "240, 236, 229";
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const layer = (parent, cls) => { const d = document.createElement("div"); d.className = cls || ""; Object.assign(d.style, { position: "absolute", left: "0", top: "0", width: "0", height: "0", pointerEvents: "none" }); parent.appendChild(d); return d; };
  const rgba = (c, a) => `rgba(${c === "cream" ? CREAM : c === "fire" ? FIRE : c || FIRE}, ${a})`;

  // ---- tween helpers ------------------------------------------------------------------------------------------
  /** Expanding rings centred on (x, y) in `parent` at local time t. o: {r=700, n=2, color='fire', w=6, dur=0.55, gap=0.08} */
  WOW.shock = (tl, parent, o) => {
    const { x, y, t } = o, n = o.n ?? 2, r = o.r ?? 700, w = o.w ?? 6, dur = o.dur ?? 0.55, c = o.color ?? "fire";
    const host = layer(parent, "wow-shock"); host.style.left = x + "px"; host.style.top = y + "px";
    for (let i = 0; i < n; i++) {
      const ring = document.createElement("div");
      Object.assign(ring.style, { position: "absolute", left: "-100px", top: "-100px", width: "200px", height: "200px", borderRadius: "50%", boxSizing: "border-box", opacity: "0",
        border: `${w}px solid ${rgba(c, 0.95)}`, boxShadow: `0 0 28px ${rgba(c, 0.55)}, inset 0 0 28px ${rgba(c, 0.35)}` });
      host.appendChild(ring);
      const t0 = t + i * (o.gap ?? 0.08);
      tl.fromTo(ring, { opacity: 1, scale: 0.15, borderWidth: w * 1.6 }, { scale: r / 100, borderWidth: 0.5, opacity: 0, duration: dur, ease: "expo.out", immediateRender: false }, t0);
    }
    return host;
  };
  /** Speed lines radiating from (x, y): o: {n=22, r0=70, r1=900, w=4, color='cream', dur=0.45, seed=1} */
  WOW.rays = (tl, parent, o) => {
    const { x, y, t } = o, n = o.n ?? 22, r0 = o.r0 ?? 70, r1 = o.r1 ?? 900, c = o.color ?? "cream", rnd = HR.rng(o.seed ?? 1);
    const host = layer(parent, "wow-rays"); host.style.left = x + "px"; host.style.top = y + "px";
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 360 + rnd() * 9, len = 120 + rnd() * 260, wid = (o.w ?? 4) * (0.5 + rnd());
      const arm = document.createElement("div");
      Object.assign(arm.style, { position: "absolute", left: "0", top: "0", width: "0", height: "0", transform: `rotate(${a}deg)` });
      const line = document.createElement("i");
      Object.assign(line.style, { position: "absolute", display: "block", left: -wid / 2 + "px", top: -(r0 + len) + "px", width: wid + "px", height: len + "px", opacity: "0",
        transformOrigin: "50% 100%", background: `linear-gradient(0deg, ${rgba(c, 0.95)}, ${rgba(c, 0)})` });
      arm.appendChild(line); host.appendChild(arm);
      const t0 = t + rnd() * 0.05, d = (o.dur ?? 0.45) * (0.7 + rnd() * 0.6), far = (r1 - r0 - len) * (0.4 + rnd() * 0.6);
      tl.fromTo(line, { opacity: 1, y: 0, scaleY: 0.2 }, { y: -far, scaleY: 1, duration: d * 0.45, ease: "power4.out", immediateRender: false }, t0);
      tl.fromTo(line, { opacity: 1 }, { opacity: 0, y: -far * 1.25, duration: d * 0.55, ease: "power2.in", immediateRender: false }, t0 + d * 0.45);
    }
    return host;
  };
  /** Particle shards flying out of (x, y): o: {n=30, speed=900, size=[5,16], color='fire', dur=0.9, gravity=0, spread=360, aim=0, seed=1} */
  WOW.burst = (tl, parent, o) => {
    const { x, y, t } = o, n = o.n ?? 30, rnd = HR.rng(o.seed ?? 1), sz = o.size ?? [5, 16], dur = o.dur ?? 0.9, spread = (o.spread ?? 360) * Math.PI / 180, aim = (o.aim ?? 0) * Math.PI / 180;
    const host = layer(parent, "wow-burst"); host.style.left = x + "px"; host.style.top = y + "px";
    for (let i = 0; i < n; i++) {
      const a = aim + (rnd() - 0.5) * spread, v = (o.speed ?? 900) * (0.35 + rnd() * 0.65), s = sz[0] + rnd() * (sz[1] - sz[0]), cream = rnd() < (o.cream ?? 0.3);
      const p = document.createElement("div");
      Object.assign(p.style, { position: "absolute", left: -s / 2 + "px", top: -s * 0.25 + "px", width: s + "px", height: s * 0.5 + "px", opacity: "0", borderRadius: rnd() < 0.5 ? "50%" : "0",
        background: cream ? rgba("cream", 1) : rgba(o.color ?? "fire", 1), boxShadow: `0 0 12px ${rgba(o.color ?? "fire", 0.7)}` });
      host.appendChild(p);
      const dx = Math.cos(a) * v * dur * 0.6, dy = Math.sin(a) * v * dur * 0.6 + (o.gravity ?? 0) * dur * dur * 0.5, rot = (rnd() - 0.5) * 720;
      tl.fromTo(p, { opacity: 1, x: 0, y: 0, rotation: (a * 180) / Math.PI, scale: 1 }, { x: dx, y: dy, rotation: rot, scale: 0.2, opacity: 0, duration: dur * (0.7 + rnd() * 0.5), ease: "power3.out", immediateRender: false }, t + rnd() * 0.04);
    }
    return host;
  };
  /** A full-frame flash: o: {color='cream', a=0.8, dur=0.18} */
  WOW.flash = (tl, parent, t, o = {}) => {
    const f = document.createElement("div");
    Object.assign(f.style, { position: "absolute", inset: "0", pointerEvents: "none", opacity: "0", background: o.color === "fire" ? `rgb(${FIRE})` : `rgb(${CREAM})`, mixBlendMode: o.blend ?? "normal" });
    parent.appendChild(f);
    tl.fromTo(f, { opacity: o.a ?? 0.8 }, { opacity: 0, duration: o.dur ?? 0.18, ease: "power2.out", immediateRender: false }, t);
    return f;
  };
  /**
   * A sung word enters in one of several fast moves (≤ 0.26 s), readable ON t. kind: pop | drop | left | right | flip | zoom | spin.
   * Works on the whole element (use for lead words and lines); for a letter-by-letter hero use WOW.explode.
   */
  WOW.word = (tl, el, t, o = {}) => {
    const kind = o.kind ?? "pop", d = o.dur ?? 0.26, from = {
      pop: { scale: 0.3, opacity: 0, filter: "blur(8px)" }, drop: { y: -90, opacity: 0, scaleY: 1.3, filter: "blur(6px)" },
      left: { x: -220, skewX: 24, opacity: 0, filter: "blur(10px)" }, right: { x: 220, skewX: -24, opacity: 0, filter: "blur(10px)" },
      flip: { rotationX: -90, opacity: 0, transformPerspective: 600 }, zoom: { scale: 2.4, opacity: 0, filter: "blur(16px)" }, spin: { rotation: -18, scale: 0.4, opacity: 0, filter: "blur(8px)" },
    }[kind] || WOW.SOFT[kind];
    const soft = !!WOW.SOFT[kind];
    // v17: hidden from the frame's start until its entrance (a delayed fromTo otherwise leaves the word showing early).
    // Pass hide: false for a word that is already on screen before this entrance (a re-entry).
    if (o.hide !== false) tl.set(el, { opacity: 0 }, 0);
    const to = { x: 0, y: 0, scale: 1, scaleY: 1, skewX: 0, rotation: 0, rotationX: 0, opacity: 1, filter: "blur(0px)", duration: soft ? (o.dur ?? 0.42) : d,
      ease: soft ? "power3.out" : kind === "drop" ? "bounce.out" : "back.out(2.2)", immediateRender: false };
    tl.fromTo(el, from, to, Math.max(0, t - (soft ? 0.06 : 0.03)));
  };
  /** v17 soft entrances for WOW.word (verses, lead words): a short eased glide, ≤ 4 px blur, readable from t − 0.06. */
  WOW.SOFT = {
    rise: { y: 38, opacity: 0, filter: "blur(4px)" }, sink: { y: -38, opacity: 0, filter: "blur(4px)" },
    glide: { x: -56, opacity: 0, filter: "blur(4px)" }, glideR: { x: 56, opacity: 0, filter: "blur(4px)" },
    settle: { scale: 1.12, opacity: 0, filter: "blur(3px)" }, fade: { opacity: 0 },
  };

  // ---- v17: the music as data (track seconds) ------------------------------------------------------------------
  /**
   * Snap a track time to the nearest real musical event: o.kinds ⊂ ['kick','snare','hat','down'] (default kick, snare, down),
   * within o.tol s (default 0.12). Returns the event time, or t unchanged when nothing is near. Use it for every accent time
   * you choose by hand (sung-word times stay the word's own time).
   */
  WOW.on = (t, o = {}) => {
    const E = window.HR_ENV, kinds = o.kinds ?? ["kick", "snare", "down"], tol = o.tol ?? 0.12;
    let best = t, bd = tol + 1e-9;
    for (const k of kinds) {
      const xs = k === "down" ? E.downbeats : E.onsets[k].map((p) => p[0]);
      for (const x of xs) { const d = Math.abs(x - t); if (d < bd) { bd = d; best = x; } }
    }
    return best;
  };
  /** The music's loudness around track time t, 0..1 (rms averaged over ±0.5 s): size accents and pulses by it. */
  WOW.energy = (t) => { let s = 0; for (let i = -5; i <= 5; i++) s += HR.band("rms", t + i * 0.1); return clamp01(s / 11 / 0.45); };
  /**
   * The explosive hero word: glyphs are thrown in from outside the word with spin and blur, converge and overshoot ON t,
   * then the word lands with a shockwave, rays and a micro-shake. o: {parent (effects layer, default el's offsetParent),
   * from: 'burst'|'top'|'left'|'right'|'bottom', fx: true, shake: wrapper element to shake, seed, x,y (effect centre in parent px)}.
   */
  WOW.explode = (tl, word, t, o = {}) => {
    const gs = word._hrG || (word._hrG = HR.glyphs(word)), n = gs.length, mid = (n - 1) / 2, rnd = HR.rng(o.seed ?? 5), from = o.from ?? "burst", pre = o.pre ?? 0.22;
    word.classList.add("hr-clip"); word.style.clipPath = "none";
    gs.forEach((g, i) => {
      const a = rnd() * Math.PI * 2, far = 500 + rnd() * 500;
      let x = Math.cos(a) * far, y = Math.sin(a) * far * 0.6;
      if (from === "top") { x = (i - mid) * 40; y = -700 - rnd() * 300; } else if (from === "bottom") { x = (i - mid) * 40; y = 700 + rnd() * 300; }
      else if (from === "left") { x = -1300 - rnd() * 500; y = (rnd() - 0.5) * 200; } else if (from === "right") { x = 1300 + rnd() * 500; y = (rnd() - 0.5) * 200; }
      tl.fromTo(g, { x, y, rotation: (rnd() - 0.5) * 540, scale: 2.2 + rnd(), opacity: 0, filter: "blur(18px)" },
        { x: 0, y: 0, rotation: 0, scale: 1.18, opacity: 1, filter: "blur(2px)", duration: pre, ease: "power4.in", immediateRender: false }, Math.max(0, t - pre - 0.01 * Math.abs(i - mid)));
      tl.fromTo(g, { scale: 1.18, filter: "blur(2px)" }, { scale: 1, filter: "blur(0px)", duration: 0.55, ease: "elastic.out(1, 0.4)", immediateRender: false }, t);
    });
    tl.fromTo(word, { skewX: -10 }, { skewX: 0, duration: 0.5, ease: "elastic.out(1, 0.45)", immediateRender: false }, t);
    if (o.fx !== false && o.parent) {
      const cx = o.x ?? word.offsetLeft + word.offsetWidth / 2, cy = o.y ?? word.offsetTop + word.offsetHeight / 2;
      WOW.shock(tl, o.parent, { x: cx, y: cy, t, r: o.r ?? 900, n: 2, color: o.color ?? "fire" });
      WOW.rays(tl, o.parent, { x: cx, y: cy, t, n: o.rays ?? 18, r0: word.offsetHeight * 0.5, r1: 1100, seed: o.seed ?? 5 });
      if (o.burst) WOW.burst(tl, o.parent, { x: cx, y: cy, t, n: o.burst, seed: o.seed ?? 5 });
    }
    if (o.shake) WOW.shake(tl, o.shake, t, { amp: o.amp ?? 12, dur: 0.38 });
    return gs;
  };

  // ---- state helpers (pure functions of time; applied by WOW.draw) -----------------------------------------------
  const reg = (tl) => tl._wow || (tl._wow = { shakes: [], punches: [], pulses: [], trans: [] });
  /** A decaying jitter on `target` from t (amp px, seeded, ~30 Hz). */
  WOW.shake = (tl, target, t, o = {}) => { reg(tl).shakes.push({ target, t, amp: o.amp ?? 14, dur: o.dur ?? 0.4, seed: o.seed ?? 3, rot: o.rot ?? 0.5 }); };
  /** A zoom punch on `target`: scale s at t, back to 1 over dur (about the element's transform-origin). */
  WOW.punch = (tl, target, t, o = {}) => { reg(tl).punches.push({ target, t, s: o.s ?? 1.07, dur: o.dur ?? 0.45 }); };
  /** Beat pulse: `target` scale = 1 + amt · (kick|snare envelope) all film long; o: {kind='kick', amt=0.04, y=0 (px bob), decay=0.16} */
  WOW.pulse = (tl, target, o = {}) => { reg(tl).pulses.push({ target, band: o.band, kind: o.kind ?? "kick", amt: o.amt ?? 0.04, y: o.y ?? 0, decay: o.decay ?? 0.16, base: o.base ?? 0 }); };
  const TRANS = {
    // [out: u 0→1 over the last `dur` s of the frame] / [in: u 0→1 over the first `dur` s]
    zoom: { out: (u, e) => ({ scale: 1 + 1.4 * e.in3(u), blur: 22 * e.in3(u), op: 1 - 0.15 * u }), in: (u, e) => ({ scale: 0.5 + 0.5 * e.out4(u), blur: 16 * (1 - e.out4(u)), op: 1 }) },
    whipL: { out: (u, e) => ({ x: -1500 * e.in3(u), blur: 34 * e.in3(u), skew: 14 * e.in3(u), op: 1 }), in: (u, e) => ({ x: 1500 * (1 - e.out4(u)), blur: 30 * (1 - e.out4(u)), skew: -14 * (1 - e.out4(u)), op: 1 }) },
    whipR: { out: (u, e) => ({ x: 1500 * e.in3(u), blur: 34 * e.in3(u), skew: -14 * e.in3(u), op: 1 }), in: (u, e) => ({ x: -1500 * (1 - e.out4(u)), blur: 30 * (1 - e.out4(u)), skew: 14 * (1 - e.out4(u)), op: 1 }) },
    spin: { out: (u, e) => ({ scale: 1 + 1.1 * e.in3(u), rot: 16 * e.in3(u), blur: 20 * e.in3(u), op: 1 }), in: (u, e) => ({ scale: 0.4 + 0.6 * e.out4(u), rot: -16 * (1 - e.out4(u)), blur: 14 * (1 - e.out4(u)), op: 1 }) },
    drop: { out: (u, e) => ({ y: 1200 * e.in3(u), blur: 18 * e.in3(u), op: 1 }), in: (u, e) => ({ y: -1200 * (1 - e.out4(u)), blur: 18 * (1 - e.out4(u)), op: 1 }) },
    rise: { out: (u, e) => ({ y: -1200 * e.in3(u), blur: 18 * e.in3(u), op: 1 }), in: (u, e) => ({ y: 1200 * (1 - e.out4(u)), blur: 18 * (1 - e.out4(u)), op: 1 }) },
    cut: { out: () => ({ op: 1 }), in: () => ({ op: 1 }) },
    // v17 smooth switches: quadratic in/out so the speed is continuous through the cut, ≤ 8 px blur, and the frame ALWAYS
    // covers the canvas (scale ≥ 1, and a glide's offset is paired with just enough scale to cover the exposed edge) —
    // no black border, no dip. Use dur ≈ one beat (0.46 s) on each side; the incoming frame is fully composed at its first instant.
    pushIn: { out: (u, e) => ({ scale: 1 + 0.22 * e.in2(u), blur: 6 * e.in2(u) }), in: (u, e) => ({ scale: 1.16 - 0.16 * e.out2(u), blur: 6 * (1 - e.out2(u)) }) },
    pullOut: { out: (u, e) => ({ scale: 1 + 0.1 * e.in2(u), blur: 6 * e.in2(u) }), in: (u, e) => ({ scale: 1.22 - 0.22 * e.out2(u), blur: 6 * (1 - e.out2(u)) }) },
    glideL: { out: (u, e) => slide(-140 * e.in2(u), 0, 8 * e.in2(u)), in: (u, e) => slide(140 * (1 - e.out2(u)), 0, 8 * (1 - e.out2(u))) },
    glideR: { out: (u, e) => slide(140 * e.in2(u), 0, 8 * e.in2(u)), in: (u, e) => slide(-140 * (1 - e.out2(u)), 0, 8 * (1 - e.out2(u))) },
    glideUp: { out: (u, e) => slide(0, -80 * e.in2(u), 7 * e.in2(u)), in: (u, e) => slide(0, 80 * (1 - e.out2(u)), 7 * (1 - e.out2(u))) },
    glideDown: { out: (u, e) => slide(0, 80 * e.in2(u), 7 * e.in2(u)), in: (u, e) => slide(0, -80 * (1 - e.out2(u)), 7 * (1 - e.out2(u))) },
  };
  // an offset (x, y) plus the scale that keeps a 1920×1080 frame (centre origin) covering the canvas, with 4 % margin
  function slide(x, y, blur) { return { x, y, blur, scale: 1 + Math.max(Math.abs(x) / 960, Math.abs(y) / 540) * 1.04 }; }
  const EASE = { in3: (u) => u * u * u, out4: (u) => 1 - Math.pow(1 - u, 4), in2: (u) => u * u, out2: (u) => 1 - (1 - u) * (1 - u) };
  /**
   * The scene switch of this frame, as seen from its own side. `root` is the frame's #root. Pair kinds across a cut:
   * the outgoing frame's `out` and the next frame's `in` use the same kind, so the move carries through the cut
   * (zoom: push through the lens; whipL/whipR: a fast pan; spin; drop/rise). o: {in: kind, out: kind, dur=0.3, start=0 (local s the `in` begins),
   total (local s the shot/frame ends; `out` plays over [total − dur, total])}. `root` may be a shot's own group wrapper for in-frame cuts.
   */
  WOW.transition = (tl, root, o) => { reg(tl).trans.push({ root, inK: o.in, outK: o.out, dur: o.dur ?? 0.3, start: o.start ?? 0, total: o.total }); };

  /** Apply every registered state helper at the timeline's current time. Call from render() as WOW.draw(tl, T0) where T0 is the frame's track start (the music envelopes are in track seconds). */
  WOW.draw = (tl, T0 = 0) => {
    const r = tl._wow; if (!r) return;
    const T = tl.time(); // local; T0 = the frame's track start, used for the music envelopes // per-target accumulators so several helpers on one element compose
    const map = new Map(), get = (el) => { let s = map.get(el); if (!s) { s = { x: 0, y: 0, r: 0, s: 1, blur: null, op: null }; map.set(el, s); } return s; };
    for (const k of [...r.shakes, ...r.punches, ...r.pulses]) get(k.target); // idle targets are reset, not left mid-effect
    for (const k of r.trans) get(k.root).blur = 0; // an idle transition clears its blur (a seek may skip the frames that would)
    for (const k of r.shakes) {
      const d = T - k.t; if (d < 0 || d > k.dur) continue;
      // v17: smooth value noise at 11 Hz (smoothstep between seeded keys) instead of a new random offset every 1/30 s,
      // so a shake reads as a rumble, not as a string of jolts
      const w = Math.pow(1 - d / k.dur, 2), f = T * 11, i0 = Math.floor(f), u = f - i0, sm = u * u * (3 - 2 * u), s = get(k.target);
      const a0 = HR.rng(i0 * 131 + k.seed), a1 = HR.rng((i0 + 1) * 131 + k.seed);
      const n = () => { const p = a0() - 0.5, q = a1() - 0.5; return (p + (q - p) * sm) * 2; };
      s.x += n() * k.amp * w; s.y += n() * k.amp * w; s.r += n() * k.rot * w;
    }
    for (const k of r.punches) {
      const d = T - k.t; if (d < 0 || d > k.dur) continue;
      get(k.target).s *= 1 + (k.s - 1) * Math.pow(1 - d / k.dur, 3);
    }
    for (const k of r.pulses) {
      const v = k.band ? HR.band(k.band, T + T0) : HR.hit(k.kind, T + T0, k.decay), s = get(k.target);
      s.s *= 1 + k.amt * v + k.base; s.y -= k.y * v;
    }
    for (const k of r.trans) {
      const s = get(k.root), tot = k.total ?? tl.duration();
      if (k.inK && T >= k.start && T < k.start + k.dur) { const f = TRANS[k.inK].in(clamp01((T - k.start) / k.dur), EASE); s.x += f.x || 0; s.y += f.y || 0; s.r += f.rot || 0; s.s *= f.scale ?? 1; s.blur = Math.max(s.blur || 0, f.blur || 0); }
      if (k.outK && T > tot - k.dur && T <= tot + 0.001) { const f = TRANS[k.outK].out(clamp01((T - (tot - k.dur)) / k.dur), EASE); s.x += f.x || 0; s.y += f.y || 0; s.r += f.rot || 0; s.s *= f.scale ?? 1; s.blur = Math.max(s.blur || 0, f.blur || 0); }
    }
    for (const [el, s] of map) {
      el.style.translate = s.x || s.y ? `${s.x.toFixed(2)}px ${s.y.toFixed(2)}px` : "";
      el.style.rotate = s.r ? `${s.r.toFixed(3)}deg` : "";
      el.style.scale = s.s !== 1 ? s.s.toFixed(4) : "";
      if (s.blur != null) el.style.filter = s.blur > 0.3 ? `blur(${s.blur.toFixed(1)}px)` : "";
    }
  };
  window.WOW = WOW;
})();
