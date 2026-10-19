// hr-kit.js — the shared motion kit of the house style (docs/HOUSE-STYLE.md); first built for harvest-remix v8.
// Canonical copy: templates/hyperframes/assets/kit/hr-kit.js (./vid video installs it into new projects).
// Colours: set --hr-accent-rgb / --hr-light-rgb ("r, g, b") on #root for another palette. Load after env.js, inside a frame's
// <template>:  <script src="assets/kit/env.js"></script><script src="assets/kit/hr-kit.js"></script>
// Everything here is deterministic and seek-safe: timeline tweens are fromTo on the frame's ONE paused timeline,
// and per-frame state (camera, pulses, glow) is a pure function of time, applied in the frame's onUpdate render.
(function () {
  if (window.HR) return;
  const E = window.HR_ENV;
  const HR = {};

  // ---- deterministic helpers ------------------------------------------------------------------------------
  HR.rng = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  HR.HEX = "0123456789ABCDEF";
  HR.cipher = (n, seed) => { const r = HR.rng(seed); let s = ""; for (let i = 0; i < n; i++) s += HR.HEX[(r() * 16) | 0]; return s; };
  const clamp01 = (x) => Math.max(0, Math.min(1, x));

  // ---- the music (track seconds) --------------------------------------------------------------------------
  /** A band envelope (rms | bass | drums | vocal | high), 0..1, linearly interpolated at track second t. */
  HR.band = (name, t) => {
    const v = E.bands[name], x = t * E.fps, i = Math.floor(x);
    if (i < 0) return v[0]; if (i >= v.length - 1) return v[v.length - 1];
    return v[i] + (v[i + 1] - v[i]) * (x - i);
  };
  const lastBefore = (arr, t) => { let lo = 0, hi = arr.length - 1, k = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (arr[m][0] <= t) { k = m; lo = m + 1; } else hi = m - 1; } return k; };
  /** Onset envelope (kick | snare | hat): strongest recent hit, s·e^(−Δt/decay), 0..1, at track second t. */
  HR.hit = (kind, t, decay = 0.16) => {
    const on = E.onsets[kind]; let k = lastBefore(on, t), v = 0;
    while (k >= 0 && t - on[k][0] < decay * 5) { v = Math.max(v, on[k][1] * Math.exp(-(t - on[k][0]) / decay)); k--; }
    return clamp01(v);
  };
  /** Onset times (track seconds) of a kind within [a, b), strongest first if `top` is given. */
  HR.onsetsIn = (kind, a, b, top) => {
    const xs = E.onsets[kind].filter(([t]) => t >= a && t < b);
    return (top ? xs.sort((p, q) => q[1] - p[1]).slice(0, top).sort((p, q) => p[0] - q[0]) : xs).map(([t]) => t);
  };

  // ---- type ------------------------------------------------------------------------------------------------
  /** Split an element's text into glyph spans (.hr-g); spaces stay as text. Returns the glyph spans. */
  HR.glyphs = (el) => {
    const text = el.textContent; el.textContent = "";
    const out = [];
    for (const ch of text) {
      if (ch === " ") { el.appendChild(document.createTextNode(" ")); continue; }
      const g = document.createElement("span"); g.className = "hr-g"; g.textContent = ch; el.appendChild(g); out.push(g);
    }
    return out;
  };
  /**
   * A lead word builds glyph by glyph: each glyph rises from below its baseline (clipped by the word) and sharpens.
   * Lands on local time t: the first glyph is readable at t, the word complete ~0.25 s later.
   */
  HR.lead = (tl, word, t, o = {}) => {
    const gs = word._hrG || (word._hrG = HR.glyphs(word));
    word.classList.add("hr-clip");
    const stagger = o.stagger ?? Math.min(0.022, 0.2 / Math.max(1, gs.length));
    tl.fromTo(gs, { yPercent: o.from ?? 105, opacity: 0, filter: "blur(6px)" },
      { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: o.dur ?? 0.34, ease: "expo.out", stagger }, Math.max(0, t - 0.03));
    return gs;
  };
  /**
   * A hero word hits in three phases: anticipation (glyphs gather from scattered, blurred and small, from t − 0.16),
   * the slam ON t (overscaled and streaked), and an elastic settle. `spread` scatters the glyphs horizontally (px).
   * Pass `sharp: true` (all new work) so the settle never leaves the word blurred.
   */
  HR.hero = (tl, word, t, o = {}) => {
    const gs = word._hrG || (word._hrG = HR.glyphs(word));
    const n = gs.length, mid = (n - 1) / 2, spread = o.spread ?? 26, pre = o.pre ?? 0.16;
    tl.fromTo(gs, { opacity: 0, scale: 0.35, yPercent: 40, x: (i) => (i - mid) * spread, filter: "blur(14px)" },
      { opacity: 1, scale: o.over ?? 1.22, yPercent: 0, x: 0, filter: "blur(2px)", duration: pre, ease: "power3.in", stagger: { each: 0.006, from: "center" } },
      Math.max(0, t - pre - 0.006 * mid));
    tl.fromTo(gs, { scale: o.over ?? 1.22, filter: "blur(2px)" },
      { scale: 1, filter: "blur(0px)", duration: o.settle ?? 0.6, ease: "elastic.out(1, 0.42)", immediateRender: false }, t);
    if (o.skew !== false) tl.fromTo(word, { skewX: -8 }, { skewX: 0, duration: 0.5, ease: "elastic.out(1, 0.5)", immediateRender: false }, t);
    // `sharp`: the elastic settle drives the blur below 0, which Chrome rejects, so the last valid blur sticks and
    // the word stays soft mid-settle. This tween, added later, wins every frame and clears the blur monotonically.
    // Opt-in so frames rendered before it (v8/v9, the locked ones) keep their exact look.
    if (o.sharp) tl.fromTo(gs, { filter: "blur(2px)" }, { filter: "blur(0px)", duration: o.settle ?? 0.6, ease: "power2.out", immediateRender: false }, t);
    return gs;
  };
  /** Decrypt: glyph slots scramble mono hex from t − dur and resolve, left to right, ending exactly ON t. */
  HR.decrypt = (tl, word, t, o = {}) => {
    const gs = word._hrG || (word._hrG = HR.glyphs(word));
    const dur = o.dur ?? 0.45, seed = o.seed ?? 7;
    gs.forEach((g) => { g.dataset.ch = g.textContent; });
    const st = { p: 0 }, f = HR.rng(seed);
    const offs = gs.map(() => f());
    const draw = () => {
      const p = st.p, step = Math.floor(tl.time() * 20);
      gs.forEach((g, i) => {
        const done = p >= 1 || p > (i + 1) / (gs.length + 1);
        g.textContent = done ? g.dataset.ch : HR.HEX[(Math.floor(offs[i] * 97) + step * 7 + i * 3) % 16];
        g.classList.toggle("hr-hex", !done);
      });
    };
    tl.fromTo(gs, { opacity: 0 }, { opacity: 1, duration: 0.01 }, Math.max(0, t - dur));
    tl.fromTo(st, { p: 0 }, { p: 1, duration: dur, ease: "none" }, Math.max(0, t - dur));
    (tl._hrDraws || (tl._hrDraws = [])).push(draw);
    return gs;
  };
  /** Run the kit's per-frame draws for a timeline (decrypt scrambles). Call from the frame's render(). */
  HR.draw = (tl) => { for (const f of tl._hrDraws || []) f(); };
  /** A line leaves: its glyphs drop out in a fast wave (or `dir: -1` rise), blurring; starts at t, ~0.3 s. */
  HR.exit = (tl, line, t, o = {}) => {
    const gs = Array.from(line.querySelectorAll(".hr-g"));
    const targets = gs.length ? gs : [line];
    tl.fromTo(targets, { yPercent: 0, opacity: 1, filter: "blur(0px)" },
      { yPercent: (o.dir ?? 1) * 70, opacity: 0, filter: "blur(10px)", duration: o.dur ?? 0.24, ease: "power2.in",
        stagger: { each: o.stagger ?? 0.008, from: o.from ?? "start" }, immediateRender: false }, t);
  };

  // ---- camera and depth -------------------------------------------------------------------------------------
  /**
   * A parallax stage. Layers are the children of `root` that carry data-depth (0 = locked to frame, 1 = full camera
   * motion; > 1 = foreground passing in front) and optionally data-dof (max blur px when the camera's focus is off).
   * Tween stage.cam {x, y, z, rot, focus} on the timeline; call stage.apply(trackT) in render().
   * Every frame also gets a seeded micro-drift and a kick pulse on top.
   */
  HR.stage = (root, o = {}) => {
    const layers = Array.from(root.querySelectorAll("[data-depth]")).map((el) => ({
      el, d: parseFloat(el.dataset.depth), dof: parseFloat(el.dataset.dof || "0"),
    }));
    const cam = { x: 0, y: 0, z: 1, rot: 0, focus: 1 };
    const seed = o.seed ?? 3, drift = o.drift ?? 1, pulse = o.pulse ?? 1;
    return {
      cam, layers,
      apply(T) {
        const dx = (Math.sin(T * 0.41 + seed) * 7 + Math.sin(T * 0.13 + seed * 2) * 5) * drift;
        const dy = (Math.sin(T * 0.33 + seed * 3) * 5 + Math.sin(T * 0.09 + seed) * 4) * drift;
        const dr = Math.sin(T * 0.21 + seed) * 0.18 * drift;
        const k = HR.hit("kick", T, 0.14) * 0.014 * pulse;
        for (const { el, d, dof } of layers) {
          const s = 1 + (cam.z - 1) * d + k * d;
          el.style.transform = `translate3d(${(-(cam.x + dx) * d).toFixed(2)}px, ${(-(cam.y + dy) * d).toFixed(2)}px, 0) ` +
            `scale(${s.toFixed(4)}) rotate(${((cam.rot + dr) * d).toFixed(3)}deg)`;
          if (dof) el.style.filter = `blur(${(dof * (1 - cam.focus)).toFixed(2)}px)`;
        }
      },
    };
  };

  // ---- light --------------------------------------------------------------------------------------------------
  /** Set the glow intensity of an element (.hr-glow / .hr-glowbox) from the bass envelope at track second T. */
  HR.glow = (el, T, base = 0.45, amt = 0.75) => {
    el.style.setProperty("--hr-glow", (base + amt * HR.band("bass", T) + 0.4 * HR.hit("kick", T, 0.2)).toFixed(3));
  };

  // ---- shared CSS ---------------------------------------------------------------------------------------------
  const css = document.createElement("style");
  css.textContent = `
    .hr-g { display: inline-block; will-change: transform, filter, opacity; transform-origin: 50% 70%; }
    .hr-clip { clip-path: inset(-0.6em -0.4em 0 -0.4em); }
    .hr-hex { font-family: "IBM Plex Mono"; font-weight: 600; letter-spacing: 0; transform: scaleX(0.92); }
    .hr-layer { position: absolute; inset: 0; transform-origin: 50% 50%; will-change: transform; }
    .hr-glow { text-shadow: 0 0 calc(var(--hr-glow, 0.5) * 26px) rgba(var(--hr-accent-rgb, 232, 93, 38), 0.62),
                            0 0 calc(var(--hr-glow, 0.5) * 80px) rgba(var(--hr-accent-rgb, 232, 93, 38), 0.32); }
    .hr-glowbox { filter: drop-shadow(0 0 calc(var(--hr-glow, 0.5) * 22px) rgba(var(--hr-accent-rgb, 232, 93, 38), 0.66))
                          drop-shadow(0 0 calc(var(--hr-glow, 0.5) * 70px) rgba(var(--hr-accent-rgb, 232, 93, 38), 0.3)); }
    .hr-glowcream { text-shadow: 0 0 calc(var(--hr-glow, 0.5) * 22px) rgba(var(--hr-light-rgb, 240, 236, 229), 0.35); }
  `;
  document.head.appendChild(css);

  window.HR = HR;
})();
