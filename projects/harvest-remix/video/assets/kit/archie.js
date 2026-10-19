// archie.js — Archie, the film's one character (harvest-remix v12). A small, weathered cream filing-cabinet robot on
// tank treads, with a telescoping neck and a binocular head whose fire irises are its eyes. Load after hr-kit.js.
//
//   const archie = HR.archie(svgOrG, { id: "f03a", x: 1500, y: 1000, scale: 1 });   // y = ground line
//   archie.mood(tl, "curious", 1.2);          // tween to a named pose (MOODS below) at local time 1.2
//   archie.rollTo(tl, 1200, 0.4, 0.9);        // drive to x = 1200 (treads and wheels turn with the distance)
//   archie.hop(tl, 2.0); archie.blink(tl, 2.6); archie.look(tl, -1, 0.2, 3.0);
//   function render() { archie.apply(tl.time() + T0); }   // in the frame's onUpdate
//
// Props (v14): parent an SVG prop into a claw; its origin is the grip point between the pincers.
//   const g = archie.hand("R");               // follows the R claw: position and the forearm's rotation (+y = down the forearm)
//   const g = archie.hand("R", { upright: true }); // follows position only: the prop stays upright on screen
//   archie.handAt("R"), archie.headAt();      // {x, y} of the grip / the head's centre in the parent's units (last apply)
//
// Gestures (v14): small choreographed sequences. The hit lands on `at`; anticipation starts before it.
//   archie.stamp(tl, at, { side: "R" });     // wind-up (arm high, lean back, crouch) from at-0.42, slam on `at`,
//                                             //   squash + a recoil hop off the treads, settle back by at+0.9
//   archie.startle(tl, at, { h, air, settle }); // jolt up (hop, arms fly up, a tremble), lids snap wide, brows up,
//                                             //   pupils small; settles to "surprised" with arms down by at+0.9.
//                                             //   h = jump height (66), air = time off the ground (0.37 s; the take
//                                             //   scales with it), settle: false = land and leave the pose to you
//   archie.doze(tl, at, dur, { nod });        // nods off over `dur`: lids droop, the head drops, catches itself on
//                                             //   `nod` (default at+0.4·dur), then sinks in steps; asleep (lids shut,
//                                             //   neck short, swaying, Z's rising) at at+dur
//   archie.wake(tl, at);                      // snaps awake: lids open, neck up, a double blink (pair with startle)
//   archie.shiver(tl, at, dur);               // hunched, arms hugging, fast deterministic jitter; back to the prior pose
//   archie.puff(tl, at);                      // inhale (lean back, neck up, chest swells) from at-0.5, blow on `at`
//                                             //   (head thrusts forward, eyes squeeze), back to the prior pose by at+1
//   archie.swoon(tl, at);                     // an "oh!" inhale, then melts: soft eyes, claws clasped, a slow sway
//   archie.smug(tl, at);                      // chin up, half lids, claws on hips, a little bounce and a brow flick
//   archie.peek(tl, at, { from, dist, dur }); // his entrance: hidden `dist` px off the frame edge ("right" | "left" |
//                                             //   "bottom") until `at`, slides in leaning round the edge (from the
//                                             //   bottom: the neck periscopes up) and looks around shiftily
//   archie.tapTread(tl, at, n, { side: "L", every: 0.24 }); // n impatient tread taps, the slaps land on at + k·every
// New moods: drowsy, asleep, startled, swoon, cold. New pose keys (all default to a no-op): hsc (head scale), swell
// (chest), jit (tremble), sway (sleepy sway and slow breath), zz (Z's), tapL/tapR, px/py (offset, used by peek).
//
// Seek-safe: every authoring call is a fromTo on the caller's timeline, its "from" taken from an authoring cursor, so
// author each property in time order. Idle life (breathing, micro-saccades, blinks) is a pure function of time,
// added in apply(). Units are px at scale 1: Archie stands ~430 tall, ~350 wide across the treads.
(function () {
  if (!window.HR || HR.archie) return;
  const NS = "http://www.w3.org/2000/svg";
  const S = (parent, tag, attrs, text) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    parent.appendChild(e);
    return e;
  };
  const f2 = (v) => v.toFixed(2);

  // the pose space; MOODS override any subset
  const BASE = {
    x: 0, y: 0, sc: 1, lift: 0, rot: 0, sqx: 1, sqy: 1, roll: 0,
    neck: 0.35, tilt: 0, turn: 0, lookX: 0, lookY: 0, pupil: 1, glow: 0.7,
    lidL: 0.12, lidR: 0.12, lowL: 0, lowR: 0, lidRotL: 0, lidRotR: 0,
    browL: 0, browR: 0, browRotL: 0, browRotR: 0, eyeTiltL: 0, eyeTiltR: 0,
    shL: 8, elL: 10, clawL: 0.2, shR: 8, elR: 10, clawR: 0.2,
    drawer: 0, blink: 0, idle: 1,
    hsc: 1, swell: 0, jit: 0, sway: 0, zz: 0, tapL: 0, tapR: 0, px: 0, py: 0,
  };
  const MOODS = {
    neutral: { neck: 0.35, tilt: 0, pupil: 1, lidL: 0.12, lidR: 0.12, lowL: 0, lowR: 0, lidRotL: 0, lidRotR: 0,
      browL: 0, browR: 0, browRotL: 0, browRotR: 0, eyeTiltL: 0, eyeTiltR: 0, glow: 0.7 },
    curious: { neck: 0.85, tilt: -12, pupil: 1.35, lidL: 0, lidR: 0, lowL: 0, lowR: 0, lidRotL: 0, lidRotR: 0,
      browL: -6, browR: -20, browRotL: -4, browRotR: 6, eyeTiltL: -4, eyeTiltR: 6, glow: 0.95 },
    happy: { neck: 0.55, tilt: 6, pupil: 1.2, lidL: 0.05, lidR: 0.05, lowL: 0.72, lowR: 0.72, lidRotL: 0, lidRotR: 0,
      browL: -12, browR: -12, browRotL: -3, browRotR: 3, eyeTiltL: 8, eyeTiltR: -8, glow: 1.1 },
    sad: { neck: 0.05, tilt: -6, pupil: 1.25, lidL: 0.32, lidR: 0.32, lowL: 0, lowR: 0, lidRotL: -14, lidRotR: 14,
      browL: -2, browR: -2, browRotL: -18, browRotR: 18, eyeTiltL: -16, eyeTiltR: 16, glow: 0.55 },
    smug: { neck: 0.45, tilt: 9, pupil: 0.85, lidL: 0.48, lidR: 0.3, lowL: 0.18, lowR: 0.1, lidRotL: 6, lidRotR: -3,
      browL: 2, browR: -14, browRotL: 7, browRotR: -5, eyeTiltL: 3, eyeTiltR: -2, glow: 0.8 },
    surprised: { neck: 1, tilt: 0, pupil: 0.62, lidL: 0, lidR: 0, lowL: 0, lowR: 0, lidRotL: 0, lidRotR: 0,
      browL: -22, browR: -22, browRotL: 0, browRotR: 0, eyeTiltL: 0, eyeTiltR: 0, glow: 1.2 },
    sleepy: { neck: 0, tilt: 14, pupil: 1, lidL: 0.72, lidR: 0.8, lowL: 0.1, lowR: 0.1, lidRotL: -6, lidRotR: 6,
      browL: 6, browR: 6, browRotL: -6, browRotR: 6, eyeTiltL: -6, eyeTiltR: 6, glow: 0.4 },
    love: { neck: 0.7, tilt: -8, pupil: 1.75, lidL: 0.08, lidR: 0.08, lowL: 0.3, lowR: 0.3, lidRotL: 0, lidRotR: 0,
      browL: -12, browR: -12, browRotL: -12, browRotR: 12, eyeTiltL: -6, eyeTiltR: 6, glow: 1.5 },
    focused: { neck: 0.6, tilt: 0, pupil: 0.9, lidL: 0.28, lidR: 0.28, lowL: 0.12, lowR: 0.12, lidRotL: 10, lidRotR: -10,
      browL: 4, browR: 4, browRotL: 12, browRotR: -12, eyeTiltL: 0, eyeTiltR: 0, glow: 1 },
    drowsy: { neck: 0.15, tilt: 7, pupil: 1, lidL: 0.55, lidR: 0.62, lowL: 0.08, lowR: 0.08, lidRotL: -4, lidRotR: 4,
      browL: 5, browR: 5, browRotL: -6, browRotR: 6, eyeTiltL: -5, eyeTiltR: 5, glow: 0.5 },
    asleep: { neck: -0.45, tilt: 18, pupil: 1, lidL: 1, lidR: 1, lowL: 0.12, lowR: 0.12, lidRotL: 0, lidRotR: 0,
      browL: 7, browR: 7, browRotL: -5, browRotR: 5, eyeTiltL: -8, eyeTiltR: 8, glow: 0.25 },
    startled: { neck: 1.3, tilt: 0, pupil: 0.42, lidL: 0, lidR: 0, lowL: 0, lowR: 0, lidRotL: 0, lidRotR: 0,
      browL: -30, browR: -30, browRotL: 6, browRotR: -6, eyeTiltL: 0, eyeTiltR: 0, glow: 1.5 },
    swoon: { neck: 0.55, tilt: -16, pupil: 1.9, lidL: 0.4, lidR: 0.4, lowL: 0.38, lowR: 0.38, lidRotL: -8, lidRotR: 8,
      browL: -14, browR: -14, browRotL: -16, browRotR: 16, eyeTiltL: -10, eyeTiltR: 10, glow: 1.6 },
    cold: { neck: 0, tilt: 0, pupil: 0.8, lidL: 0.3, lidR: 0.3, lowL: 0.22, lowR: 0.22, lidRotL: -10, lidRotR: 10,
      browL: -8, browR: -8, browRotL: -16, browRotR: 16, eyeTiltL: -6, eyeTiltR: 6, glow: 0.45 },
  };
  const ARMS_REST = { shL: 8, elL: 10, clawL: 0.2, shR: 8, elR: 10, clawR: 0.2 };
  const FACE_ARMS = [...Object.keys(MOODS.neutral), ...Object.keys(ARMS_REST)];
  const GRIP = 74; // the grip point between the pincers, down the forearm from the elbow

  // deterministic hash for idle noise
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  HR.archie = (parent, o = {}) => {
    const p = o.id || "arc";
    const seed = o.seed ?? 1;
    const s = Object.assign({}, BASE, { x: o.x ?? 0, y: o.y ?? 0, sc: o.scale ?? 1 }, o.pose || {});
    const cur = Object.assign({}, s); // authoring cursor
    const root = S(parent, "g", { class: "hr-archie" });

    // ---- defs: gradients, clips, the baked enamel grime ------------------------------------------------------
    const defs = S(root, "defs", {});
    defs.innerHTML = `
      <linearGradient id="${p}-front" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="#F4F0E8"/><stop offset="0.45" stop-color="#E4DDD0"/><stop offset="1" stop-color="#B9B0A0"/></linearGradient>
      <linearGradient id="${p}-top" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FBF8F2"/><stop offset="1" stop-color="#E9E3D7"/></linearGradient>
      <linearGradient id="${p}-side" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A9A090"/><stop offset="1" stop-color="#6E675B"/></linearGradient>
      <linearGradient id="${p}-drw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EEE8DD"/><stop offset="1" stop-color="#CFC7B8"/></linearGradient>
      <linearGradient id="${p}-chrome" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.3" stop-color="#B8B4AA"/><stop offset="0.6" stop-color="#5A574F"/><stop offset="1" stop-color="#9A968C"/></linearGradient>
      <linearGradient id="${p}-steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3A3833"/><stop offset="0.35" stop-color="#8A867C"/><stop offset="0.55" stop-color="#5A574F"/><stop offset="1" stop-color="#2A2825"/></linearGradient>
      <linearGradient id="${p}-house" x1="0" y1="0" x2="0.2" y2="1"><stop offset="0" stop-color="#F7F3EC"/><stop offset="0.55" stop-color="#DDD5C7"/><stop offset="1" stop-color="#ACA393"/></linearGradient>
      <linearGradient id="${p}-barrel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8F887A"/><stop offset="1" stop-color="#4E4A42"/></linearGradient>
      <linearGradient id="${p}-lid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A574F"/><stop offset="1" stop-color="#2A2825"/></linearGradient>
      <radialGradient id="${p}-lens" cx="0.42" cy="0.38" r="0.7"><stop offset="0" stop-color="#2B2925"/><stop offset="0.7" stop-color="#151513"/><stop offset="1" stop-color="#0B0B0A"/></radialGradient>
      <radialGradient id="${p}-iris" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFF1E4"/><stop offset="0.28" stop-color="#FFB98F"/><stop offset="0.62" stop-color="#E85D26"/><stop offset="1" stop-color="#7A2A0E"/></radialGradient>
      <radialGradient id="${p}-halo" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#E85D26" stop-opacity="0.55"/><stop offset="0.45" stop-color="#E85D26" stop-opacity="0.18"/><stop offset="1" stop-color="#E85D26" stop-opacity="0"/></radialGradient>
      <radialGradient id="${p}-shadow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#000" stop-opacity="0.62"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <radialGradient id="${p}-rivet" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.45" stop-color="#9A968C"/><stop offset="1" stop-color="#3A3833"/></radialGradient>
      <clipPath id="${p}-fclip"><rect x="-100" y="-252" width="200" height="194" rx="10"/></clipPath>
      <clipPath id="${p}-lclipL"><circle r="27"/></clipPath>
      <clipPath id="${p}-lclipR"><circle r="27"/></clipPath>`;

    // enamel wear: speckle, chips through to the steel, rust runs in fire ink, baked once from a seeded canvas
    const grime = (() => {
      const c = document.createElement("canvas"); c.width = 400; c.height = 388;
      const x = c.getContext("2d"), r = HR.rng(9100 + seed);
      for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(60,50,40,${(0.03 + r() * 0.07).toFixed(3)})`; x.fillRect(r() * 400, r() * 388, 1 + r() * 2, 1 + r() * 2); }
      const chip = (cx, cy, s) => {
        x.beginPath();
        for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2, rr = s * (0.5 + r() * 0.7); x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.7); }
        x.closePath(); x.fillStyle = "rgba(58,56,51,0.85)"; x.fill();
        x.strokeStyle = "rgba(255,255,255,0.5)"; x.lineWidth = 1.2; x.stroke();
      };
      // chips crowd the edges and corners, where a cabinet gets knocked
      for (let i = 0; i < 26; i++) {
        const edge = r(), cx = edge < 0.5 ? (r() < 0.5 ? 6 + r() * 14 : 380 + r() * 14) : r() * 400, cy = edge < 0.5 ? r() * 388 : (r() < 0.5 ? 4 + r() * 12 : 370 + r() * 14);
        chip(cx, cy, 2 + r() * 7);
      }
      for (let i = 0; i < 6; i++) chip(40 + r() * 320, 40 + r() * 300, 1.5 + r() * 2.5);
      // rust runs under the rivets and the drawer seams
      for (let i = 0; i < 9; i++) {
        const rx = 14 + r() * 372, ry = r() < 0.5 ? 18 + r() * 20 : 170 + r() * 30, len = 30 + r() * 90;
        const g = x.createLinearGradient(rx, ry, rx, ry + len);
        g.addColorStop(0, "rgba(160,64,22,0.5)"); g.addColorStop(1, "rgba(160,64,22,0)");
        x.fillStyle = g; x.fillRect(rx, ry, 2 + r() * 4, len);
      }
      // a soft dirt gradient towards the floor
      const d = x.createLinearGradient(0, 220, 0, 388); d.addColorStop(0, "rgba(70,60,48,0)"); d.addColorStop(1, "rgba(70,60,48,0.35)");
      x.fillStyle = d; x.fillRect(0, 0, 400, 388);
      return c.toDataURL("image/png");
    })();

    // ---- the build: back to front ---------------------------------------------------------------------------
    const shadow = S(root, "ellipse", { cx: 0, cy: 4, rx: 205, ry: 22, fill: `url(#${p}-shadow)` });
    const halo = S(root, "g", {});            // the eyes' light on the world (behind everything)
    const haloC = S(halo, "ellipse", { rx: 210, ry: 150, fill: `url(#${p}-halo)` });
    const rig = S(root, "g", {});             // position, squash, lift
    // treads
    const treads = [-1, 1].map((side) => {
      const g = S(rig, "g", { transform: `translate(${side * 122} -36)` });
      S(g, "rect", { x: -66, y: -34, width: 132, height: 68, rx: 34, fill: "#111111" });
      S(g, "rect", { x: -62, y: -30, width: 124, height: 60, rx: 30, fill: "#2A2825" });
      const loop = S(g, "rect", { x: -60, y: -28, width: 120, height: 56, rx: 28, fill: "none", stroke: "#5A574F", "stroke-width": 7,
        "stroke-dasharray": "5 6", pathLength: 352 });
      S(g, "rect", { x: -60, y: -28, width: 120, height: 56, rx: 28, fill: "none", stroke: "rgba(255,255,255,0.18)", "stroke-width": 1.2 });
      const wheels = [-34, 0, 34].map((wx, i) => {
        const w = S(g, "g", { transform: `translate(${wx} ${i === 1 ? 2 : 0})` });
        S(w, "circle", { r: i === 1 ? 15 : 17, fill: `url(#${p}-steel)`, stroke: "#111111", "stroke-width": 2 });
        const spin = S(w, "g", {});
        S(spin, "circle", { r: i === 1 ? 9 : 10, fill: "#3A3833", stroke: "#8A867C", "stroke-width": 1.5 });
        for (let k = 0; k < 4; k++) S(spin, "path", { d: "M0 -8 V8", stroke: "#111111", "stroke-width": 2, transform: `rotate(${k * 45})` });
        S(w, "circle", { r: 3, fill: "#E85D26" });
        return spin;
      });
      // the mud-guard plate over the top of the tread
      S(g, "path", { d: "M-58 -32 Q0 -48 58 -32 L54 -24 Q0 -38 -54 -24 Z", fill: "#3A3833", stroke: "#111111", "stroke-width": 2 });
      return { g, side, loop, wheels };
    });
    // chassis
    S(rig, "rect", { x: -128, y: -74, width: 256, height: 22, rx: 6, fill: "#2A2825", stroke: "#111111", "stroke-width": 2.5 });
    S(rig, "path", { d: "M-124 -71 H124", stroke: "rgba(255,255,255,0.22)", "stroke-width": 1.5 });
    for (const bx of [-110, -70, 70, 110]) S(rig, "circle", { cx: bx, cy: -63, r: 3.2, fill: `url(#${p}-rivet)` });

    // the upper body leans and squashes about the chassis
    const upper = S(rig, "g", {});
    // arms behind? no: arms are drawn after the body (in front), so they can hug and type
    const body = S(upper, "g", {});
    // side and top faces (3/4 view, light from upper left)
    S(body, "path", { d: "M100 -252 L118 -266 V-74 L100 -58 Z", fill: `url(#${p}-side)`, stroke: "#111111", "stroke-width": 2.5, "stroke-linejoin": "round" });
    S(body, "path", { d: "M-100 -252 L-82 -266 H118 L100 -252 Z", fill: `url(#${p}-top)`, stroke: "#111111", "stroke-width": 2.5, "stroke-linejoin": "round" });
    S(body, "rect", { x: -100, y: -252, width: 200, height: 194, rx: 10, fill: `url(#${p}-front)`, stroke: "#111111", "stroke-width": 3 });
    const fwear = S(body, "g", { "clip-path": `url(#${p}-fclip)` });
    S(fwear, "image", { href: grime, x: -100, y: -252, width: 200, height: 194, preserveAspectRatio: "none" });
    S(body, "path", { d: "M-94 -248 H94", stroke: "rgba(255,255,255,0.85)", "stroke-width": 2, "stroke-linecap": "round" });
    S(body, "path", { d: "M-97 -244 V-66", stroke: "rgba(255,255,255,0.45)", "stroke-width": 1.5 });
    // side-face stencil and vent slots
    for (let k = 0; k < 5; k++) S(body, "path", { d: `M104 ${-226 + k * 12} l10 -8`, stroke: "#3A3833", "stroke-width": 3, "stroke-linecap": "round" });
    // drawers: 0001 on top (it opens: the mouth that files the letters), ∞ below
    const drawerOpen = S(body, "g", {});      // the dark slot revealed when the top drawer opens
    const slot = S(drawerOpen, "rect", { x: -86, y: -240, width: 172, height: 0, fill: "#0B0B0A" });
    const mkDrawer = (y, label) => {
      const g = S(body, "g", {});
      S(g, "rect", { x: -88, y, width: 176, height: 84, rx: 5, fill: `url(#${p}-drw)`, stroke: "#111111", "stroke-width": 2.5 });
      S(g, "path", { d: `M-84 ${y + 3} H84`, stroke: "rgba(255,255,255,0.9)", "stroke-width": 1.5 });
      S(g, "path", { d: `M-84 ${y + 81} H84`, stroke: "rgba(60,50,40,0.35)", "stroke-width": 2 });
      // label card in its brass-less holder
      S(g, "rect", { x: -34, y: y + 12, width: 68, height: 28, rx: 2, fill: "#3A3833", stroke: "#111111", "stroke-width": 2 });
      S(g, "rect", { x: -30, y: y + 15, width: 60, height: 22, fill: "#FBF8F2" });
      S(g, "text", { x: 0, y: y + 31, "text-anchor": "middle", "font-family": "IBM Plex Mono", "font-weight": 600, "font-size": label.length > 1 ? 15 : 20,
        "letter-spacing": 1.5, fill: "#111111" }, label);
      // pull handle: chrome bar on two posts
      S(g, "rect", { x: -30, y: y + 50, width: 8, height: 16, rx: 2, fill: "#5A574F", stroke: "#111111", "stroke-width": 1.5 });
      S(g, "rect", { x: 22, y: y + 50, width: 8, height: 16, rx: 2, fill: "#5A574F", stroke: "#111111", "stroke-width": 1.5 });
      S(g, "rect", { x: -36, y: y + 56, width: 72, height: 11, rx: 5.5, fill: `url(#${p}-chrome)`, stroke: "#111111", "stroke-width": 2 });
      S(g, "ellipse", { cx: 0, cy: y + 72, rx: 34, ry: 3, fill: "rgba(17,17,17,0.18)" });
      return g;
    };
    const drawer1 = mkDrawer(-240, "0001");
    mkDrawer(-148, "∞");
    // a dent, the FRAGILE sticker peeling at one corner, rivets
    S(body, "path", { d: "M46 -120 q16 -10 30 2", fill: "none", stroke: "rgba(60,50,40,0.45)", "stroke-width": 3, "stroke-linecap": "round" });
    S(body, "path", { d: "M47 -116 q15 -8 28 2", fill: "none", stroke: "rgba(255,255,255,0.8)", "stroke-width": 1.5, "stroke-linecap": "round" });
    const st = S(body, "g", { transform: "translate(-80 -100) rotate(-9)" });
    S(st, "path", { d: "M0 0 H62 V20 L54 22 L50 16 H0 Z", fill: "#FBF8F2", stroke: "rgba(17,17,17,0.55)", "stroke-width": 1 });
    S(st, "path", { d: "M50 16 L54 22 L62 20 L58 13 Z", fill: "#C9C0B0" });
    S(st, "text", { x: 5, y: 13, "font-family": "IBM Plex Mono", "font-weight": 600, "font-size": 9.5, "letter-spacing": 1.2, fill: "#E85D26" }, "FRAGILE");
    S(st, "path", { d: "M5 17 H44", stroke: "#E85D26", "stroke-width": 1 });
    for (const [rx, ry] of [[-90, -242], [90, -242], [-90, -68], [90, -68]]) S(body, "circle", { cx: rx, cy: ry, r: 3.4, fill: `url(#${p}-rivet)`, stroke: "rgba(17,17,17,0.5)", "stroke-width": 0.8 });
    // a tiny ARCHIE stencil on the lower drawer's edge
    S(body, "text", { x: 84, y: -76, "text-anchor": "end", "font-family": "IBM Plex Mono", "font-weight": 600, "font-size": 8, "letter-spacing": 1.4, fill: "rgba(17,17,17,0.55)" }, "ARCHIE");

    // the neck: a collar on the lid, two telescoping tubes
    const neckG = S(upper, "g", {});
    S(neckG, "ellipse", { cx: 10, cy: -260, rx: 30, ry: 9, fill: "#3A3833", stroke: "#111111", "stroke-width": 2.5 });
    const tube1 = S(neckG, "rect", { x: -7, y: -300, width: 34, height: 42, rx: 5, fill: `url(#${p}-steel)`, stroke: "#111111", "stroke-width": 2.5 });
    const tube2 = S(neckG, "rect", { x: -1, y: -330, width: 22, height: 40, rx: 4, fill: `url(#${p}-steel)`, stroke: "#111111", "stroke-width": 2.5 });
    const ring1 = S(neckG, "rect", { x: -9, y: -303, width: 38, height: 8, rx: 3, fill: "#5A574F", stroke: "#111111", "stroke-width": 2 });

    // the head: a hinge bar and two binocular eye housings, each tilting on its own
    const headPos = S(upper, "g", {});
    const head = S(headPos, "g", {});
    const hinge = S(head, "g", {});
    S(hinge, "rect", { x: -40, y: -14, width: 80, height: 18, rx: 9, fill: `url(#${p}-steel)`, stroke: "#111111", "stroke-width": 2.5 });
    S(hinge, "circle", { cx: 0, cy: -5, r: 7, fill: `url(#${p}-rivet)`, stroke: "#111111", "stroke-width": 1.5 });
    const eye = (side) => {
      const outer = S(head, "g", {});          // turn shift + tilt about the hinge end
      const g = S(outer, "g", {});
      // the barrel's thickness under the housing
      S(g, "rect", { x: -44, y: -26, width: 88, height: 66, rx: 22, fill: `url(#${p}-barrel)`, stroke: "#111111", "stroke-width": 3 });
      S(g, "rect", { x: -44, y: -34, width: 88, height: 66, rx: 22, fill: `url(#${p}-house)`, stroke: "#111111", "stroke-width": 3 });
      S(g, "path", { d: "M-28 -31 H28", stroke: "rgba(255,255,255,0.95)", "stroke-width": 2.5, "stroke-linecap": "round" });
      // lens bezel with ticks
      S(g, "circle", { r: 31, fill: "#2A2825", stroke: "#111111", "stroke-width": 2.5 });
      for (let k = 0; k < 24; k++) S(g, "path", { d: "M0 -30 V-27", stroke: k % 6 ? "#5A574F" : "#9A968C", "stroke-width": 1.5, transform: `rotate(${k * 15})` });
      const lens = S(g, "g", { "clip-path": `url(#${p}-lclip${side < 0 ? "L" : "R"})` });
      S(lens, "circle", { r: 27, fill: `url(#${p}-lens)` });
      const irisG = S(lens, "g", {});
      const iris = S(irisG, "circle", { r: 17, fill: `url(#${p}-iris)` });
      S(irisG, "circle", { r: 17, fill: "none", stroke: "rgba(255,190,150,0.55)", "stroke-width": 1 });
      for (let k = 0; k < 12; k++) S(irisG, "path", { d: "M0 -9 V-15", stroke: "rgba(122,42,14,0.45)", "stroke-width": 1.2, transform: `rotate(${k * 30 + 8})` });
      const pupil = S(irisG, "circle", { r: 7, fill: "#0B0B0A" });
      // lids live inside the lens: upper lid slides down, lower lid rises (a smile)
      const lidUp = S(lens, "g", {});
      S(lidUp, "rect", { x: -40, y: -80, width: 80, height: 53, fill: `url(#${p}-lid)` });
      S(lidUp, "path", { d: "M-40 -27 H40", stroke: "#111111", "stroke-width": 3 });
      S(lidUp, "path", { d: "M-40 -31 H40", stroke: "rgba(255,240,226,0.45)", "stroke-width": 1.5 });
      const lidLow = S(lens, "g", {});
      S(lidLow, "path", { d: "M-40 80 V27 Q0 12 40 27 V80 Z", fill: `url(#${p}-lid)` });
      S(lidLow, "path", { d: "M-40 30 Q0 15 40 30", fill: "none", stroke: "rgba(255,240,226,0.4)", "stroke-width": 1.5 });
      S(lidLow, "path", { d: "M-40 27 Q0 12 40 27", fill: "none", stroke: "#111111", "stroke-width": 3 });
      // glints on the glass (not affected by look)
      S(g, "ellipse", { cx: -10, cy: -11, rx: 6, ry: 4, fill: "rgba(255,255,255,0.92)", transform: "rotate(-30 -10 -11)" });
      S(g, "circle", { cx: 9, cy: 10, r: 2.2, fill: "rgba(255,255,255,0.7)" });
      S(g, "circle", { r: 27, fill: "none", stroke: "rgba(255,255,255,0.12)", "stroke-width": 1.5 });
      // two screws on the housing
      S(g, "circle", { cx: side * -34, cy: 20, r: 2.6, fill: `url(#${p}-rivet)` });
      S(g, "circle", { cx: side * 34, cy: -22, r: 2.6, fill: `url(#${p}-rivet)` });
      // the brow plate
      const brow = S(outer, "g", {});
      S(brow, "rect", { x: -34, y: -6, width: 68, height: 12, rx: 6, fill: "#3A3833", stroke: "#111111", "stroke-width": 2.5 });
      S(brow, "path", { d: "M-28 -3 H28", stroke: "rgba(255,255,255,0.35)", "stroke-width": 1.5, "stroke-linecap": "round" });
      return { outer, g, irisG, iris, pupil, lidUp, lidLow, brow, side };
    };
    const eyes = [eye(-1), eye(1)];

    // arms: shoulder disc, upper bar, elbow, forearm, a two-finger pincer
    const arm = (side) => {
      const mir = S(upper, "g", { transform: side < 0 ? "scale(-1 1)" : "" });
      const sh = S(mir, "g", {});
      S(sh, "rect", { x: -9, y: 0, width: 18, height: 52, rx: 9, fill: `url(#${p}-steel)`, stroke: "#111111", "stroke-width": 2.5 });
      S(sh, "path", { d: "M-2 4 V46", stroke: "rgba(255,255,255,0.4)", "stroke-width": 1.2 });
      const el = S(sh, "g", { transform: "translate(0 50)" });
      S(el, "rect", { x: -8, y: 0, width: 16, height: 46, rx: 8, fill: `url(#${p}-steel)`, stroke: "#111111", "stroke-width": 2.5 });
      S(el, "circle", { r: 10, fill: "#3A3833", stroke: "#111111", "stroke-width": 2.5 });
      S(el, "circle", { r: 2.5, fill: "#9A968C" });
      const handWrap = S(el, "g", { transform: "translate(0 46) scale(1.45)" }), hand = S(handWrap, "g", {});
      S(hand, "rect", { x: -11, y: -4, width: 22, height: 12, rx: 4, fill: "#5A574F", stroke: "#111111", "stroke-width": 2.5 });
      const fa = S(hand, "g", { transform: "translate(-7 7)" }), fb = S(hand, "g", { transform: "translate(7 7)" });
      S(fa, "path", { d: "M0 0 Q-7 12 -1 22 Q2 16 4 6 Z", fill: "#E4DDD0", stroke: "#111111", "stroke-width": 2.2, "stroke-linejoin": "round" });
      S(fb, "path", { d: "M0 0 Q7 12 1 22 Q-2 16 -4 6 Z", fill: "#E4DDD0", stroke: "#111111", "stroke-width": 2.2, "stroke-linejoin": "round" });
      const shDisc = S(mir, "g", {});
      S(shDisc, "circle", { r: 15, fill: "#3A3833", stroke: "#111111", "stroke-width": 2.5 });
      S(shDisc, "circle", { r: 4, fill: `url(#${p}-rivet)` });
      return { mir, sh, el, handWrap, fa, fb, shDisc, side };
    };
    const arms = [arm(-1), arm(1)];
    const anchors = []; // props parented into a claw (hand())

    // the Z's of a sleeping archive: three rising letters above the head (shown while zz > 0)
    const zG = S(root, "g", { display: "none" });
    const zs = [0, 1, 2].map(() => S(zG, "text", { "font-family": "IBM Plex Mono", "font-weight": 600, fill: "#F0ECE5", "text-anchor": "middle" }, "z"));

    // ---- per-frame pose ---------------------------------------------------------------------------------------
    const D = Math.PI / 180;
    const rotP = (x, y, a) => { const c = Math.cos(a * D), n = Math.sin(a * D); return [x * c - y * n, x * n + y * c]; };
    let last = { breath: 0, rotE: 0, jx: 0, hy: -334 }; // what the last apply() used (for handAt/headAt)
    // a point in the upper body's frame → the parent's units, through upper (lean, breath, swell), rig and root
    const upperToParent = (x, y) => {
      const sw = s.swell;
      if (sw) { x *= 1 + 0.04 * sw; y = (y + 64) * (1 + 0.06 * sw) - 64; }
      y += last.breath * 0.4;
      [x, y] = rotP(x, y + 64, last.rotE); y -= 64;
      x *= s.sqx; y = y * s.sqy - s.lift;
      return { x: s.x + s.px + last.jx + x * s.sc, y: s.y + s.py + y * s.sc };
    };
    const apply = (T) => {
      const id = s.idle;
      const breath = Math.sin(T * 2.3 + seed) * 1.6 * id;
      // micro-saccades: the gaze steps to a new nearby point every ~0.7 s
      // v19: each step eases over ~70 ms and is smaller (instant ±0.11 steps added to darting)
      const sq = T / 0.7 + seed * 0.37, k = Math.floor(sq), se = Math.min(1, (sq - k) * 0.7 / 0.07), su = se * se * (3 - 2 * se);
      const sac = (n) => [(hash(n + seed * 13) - 0.5) * 0.12, (hash(n * 1.7 + seed * 7) - 0.5) * 0.1];
      const [s0x, s0y] = sac(k - 1), [s1x, s1y] = sac(k);
      const sx = (s0x + (s1x - s0x) * su) * id, sy = (s0y + (s1y - s0y) * su) * id;
      // blinks: deterministic, every ~3–4.5 s, with an occasional double
      const per = 3.6, ph = ((T + seed * 1.37) % per + per) % per, bi = Math.floor((T + seed * 1.37) / per);
      const tri = (q) => (q < 0 ? 0 : q < 0.055 ? q / 0.055 : q < 0.15 ? 1 - (q - 0.055) / 0.095 : 0);
      let auto = tri(ph - hash(bi) * 1.2);
      if (hash(bi * 3.1) > 0.6) auto = Math.max(auto, tri(ph - hash(bi) * 1.2 - 0.22));
      const blink = Math.max(s.blink, auto * id);
      // v14: the sleepy sway (slow, deep breathing) and the tremble (fast, small, a pure function of time)
      const sw = s.sway, jit = s.jit;
      const swing = sw ? sw * Math.sin(T * 1.9 + seed) : 0;
      const jx = jit ? jit * (Math.sin(T * 91.7) * 2.4 + Math.sin(T * 57.3 + 1.3) * 1.5) : 0;
      const jr = jit ? jit * Math.sin(T * 73.1 + 0.7) * 1.2 : 0;
      const rotE = s.rot + swing * 2.2 + jr;
      last = { breath, rotE, jx, hy: last.hy };

      const lift = s.lift;
      root.setAttribute("transform", `translate(${f2(s.x + s.px + jx)} ${f2(s.y + s.py)}) scale(${(s.sc).toFixed(4)})`);
      shadow.setAttribute("rx", f2(205 * (1 - Math.min(0.5, lift / 400))));
      shadow.setAttribute("opacity", (1 - Math.min(0.6, lift / 300)).toFixed(3));
      rig.setAttribute("transform", `translate(0 ${f2(-lift)}) scale(${s.sqx.toFixed(4)} ${s.sqy.toFixed(4)})`);
      upper.setAttribute("transform", `rotate(${f2(rotE)} 0 -64) translate(0 ${f2(breath * 0.4)})` +
        (s.swell ? ` translate(0 -64) scale(${(1 + 0.04 * s.swell).toFixed(4)} ${(1 + 0.06 * s.swell).toFixed(4)}) translate(0 64)` : ""));

      // treads and wheels turn with the distance driven; a tapped tread lifts its inner end and slaps down
      treads.forEach(({ g, side, loop, wheels }) => {
        const tap = side < 0 ? s.tapL : s.tapR;
        g.setAttribute("transform", tap ? `translate(${side * 122} ${f2(-36 - tap * 8)}) rotate(${f2(-side * tap * 13)} ${side * 60} 30)` : `translate(${side * 122} -36)`);
        loop.setAttribute("stroke-dashoffset", f2(-s.roll * 0.9));
        wheels.forEach((w) => w.setAttribute("transform", `rotate(${f2((s.roll / 16) * 57.3)})`));
      });
      drawer1.setAttribute("transform", `translate(0 ${f2(s.drawer * 18)}) scale(${(1 + s.drawer * 0.03).toFixed(4)})`);
      slot.setAttribute("height", f2(s.drawer * 20));

      // the neck telescopes; the head sits on top of the inner tube
      const ext = s.neck * 30 + breath + (sw ? sw * 3.5 * Math.sin(T * 1.9 + seed + 1.2) : 0);
      tube2.setAttribute("y", f2(-330 - ext));
      tube2.setAttribute("height", f2(40 + ext));
      const hy = -334 - ext;
      last.hy = hy;
      const hjx = jit ? jit * Math.sin(T * 67.9 + 2.1) * 1.8 : 0;
      headPos.setAttribute("transform", `translate(${f2(10 + hjx)} ${f2(hy + 6)}) scale(${+(1.3 * s.hsc).toFixed(4)})`);
      head.setAttribute("transform", `rotate(${f2(s.tilt + swing * 3)} 0 0)`);
      const turn = s.turn, lx = s.lookX + sx + turn * 0.4, ly = s.lookY + sy;
      hinge.setAttribute("transform", `translate(${f2(turn * 10)} 0)`);
      eyes.forEach((e) => {
        const L = e.side < 0;
        const far = (turn > 0 && L) || (turn < 0 && !L);
        const sxE = 1 - (far ? Math.abs(turn) * 0.22 : 0);
        const ex = e.side * 50 + turn * (far ? 24 : 18);
        const tilt = L ? s.eyeTiltL : s.eyeTiltR;
        e.outer.setAttribute("transform", `translate(${f2(ex)} -46) rotate(${f2(tilt)} ${f2(-e.side * 40)} 20) scale(${sxE.toFixed(3)} 1)`);
        const pup = s.pupil;
        e.irisG.setAttribute("transform", `translate(${f2(lx * 8)} ${f2(ly * 7)})`);
        e.pupil.setAttribute("r", f2(7 * pup));
        e.iris.setAttribute("r", f2(17 * (0.94 + 0.06 * pup)));
        const lid = Math.min(1, (L ? s.lidL : s.lidR) + blink * (1 - (L ? s.lidL : s.lidR)));
        const lrot = L ? s.lidRotL : s.lidRotR;
        e.lidUp.setAttribute("transform", `translate(0 ${f2(lid * 56)}) rotate(${f2(lrot)})`);
        const low = (L ? s.lowL : s.lowR) * (1 - blink);
        e.lidLow.setAttribute("transform", `translate(0 ${f2(-low * 22)})`);
        const by = L ? s.browL : s.browR, br = L ? s.browRotL : s.browRotR;
        e.brow.setAttribute("transform", `translate(0 ${f2(-43 + by * 0.8 + blink * 5)}) rotate(${f2(br)})`);
      });
      // light: the irises glow, and throw a soft fire halo onto the world around the head
      const gl = s.glow;
      eyes.forEach((e) => e.iris.setAttribute("opacity", (0.75 + 0.25 * Math.min(1, gl)).toFixed(3)));
      halo.setAttribute("transform", `translate(${f2(10 + turn * 12)} ${f2(hy - 46 - lift)})`);
      halo.setAttribute("opacity", (Math.min(1.6, gl) * 0.55).toFixed(3));
      haloC.setAttribute("rx", f2(170 + gl * 50));

      // arms, and the props held in them
      arms.forEach((a) => {
        const L = a.side < 0;
        const shA = L ? s.shL : s.shR, elA = L ? s.elL : s.elR, cl = L ? s.clawL : s.clawR;
        a.shDisc.setAttribute("transform", "translate(108 -206)");
        a.sh.setAttribute("transform", `translate(108 -206) rotate(${f2(-shA)})`);
        a.el.setAttribute("transform", `translate(0 50) rotate(${f2(-elA)})`);
        a.fa.setAttribute("transform", `translate(-7 7) rotate(${f2(cl * 28)})`);
        a.fb.setAttribute("transform", `translate(7 7) rotate(${f2(-cl * 28)})`);
      });
      for (const h of anchors) {
        const L = h.a.side < 0, shA = L ? s.shL : s.shR, elA = L ? s.elL : s.elR;
        // upright: cancel the shoulder, elbow and body rotation; L: un-mirror the arm's flip
        const r = h.upright ? shA + elA + (L ? rotE : -rotE) : 0;
        h.g.setAttribute("transform", `translate(0 ${GRIP}) rotate(${f2(r)})${L ? " scale(-1 1)" : ""}`);
      }

      // the Z's: each rises and drifts right from above the head, growing, on a 1.8 s loop
      if (s.zz > 0.001) {
        zG.setAttribute("display", "inline");
        zs.forEach((z, i) => {
          const q = ((T / 1.8 + i / 3 + seed * 0.13) % 1 + 1) % 1;
          z.setAttribute("x", f2(10 + s.tilt * 1.2 + 34 + q * 70 + Math.sin(q * 7 + i) * 8));
          z.setAttribute("y", f2(hy - 70 - lift - q * 120));
          z.setAttribute("font-size", f2(26 + q * 30));
          z.setAttribute("opacity", (s.zz * Math.sin(q * Math.PI) * 0.9).toFixed(3));
        });
      } else zG.setAttribute("display", "none");
    };
    const handAt = (side) => {
      const L = side === "L", shA = L ? s.shL : s.shR, elA = L ? s.elL : s.elR;
      let [x, y] = rotP(0, GRIP, -elA); y += 50;
      [x, y] = rotP(x, y, -shA); x += 108; y -= 206;
      return upperToParent(L ? -x : x, y);
    };
    const headAt = () => upperToParent(10, last.hy + 6 - 46 * 1.3 * s.hsc);

    // ---- authoring helpers (all fromTo from the cursor; author each property in time order) -------------------
    const to = (tl, props, at, dur = 0.3, ease = "power3.out") => {
      const from = {};
      for (const k in props) from[k] = cur[k];
      Object.assign(cur, props);
      if (dur <= 0) { tl.set(s, props, at); return; }
      tl.fromTo(s, from, { ...props, duration: dur, ease, immediateRender: false }, at);
    };
    const pick = (keys) => Object.fromEntries(keys.map((k) => [k, cur[k]])); // the cursor's current values, to return to
    const api = {
      el: root, s, apply, to,
      mood(tl, name, at, dur = 0.35, ease = "back.out(1.6)") { to(tl, MOODS[name], at, dur, ease); },
      look(tl, x, y, at, dur = 0.18, ease = "power3.out") { to(tl, { lookX: x, lookY: y }, at, dur, ease); },
      blink(tl, at) {
        tl.fromTo(s, { blink: 0 }, { blink: 1, duration: 0.05, ease: "power2.in", immediateRender: false }, at);
        tl.fromTo(s, { blink: 1 }, { blink: 0, duration: 0.11, ease: "power2.out", immediateRender: false }, at + 0.05);
      },
      // drive: x and the tread distance move together, the body leans into the acceleration and settles
      rollTo(tl, x, at, dur = 0.8, ease = "power2.inOut") {
        const dx = x - cur.x;
        to(tl, { x, roll: cur.roll + dx / cur.sc }, at, dur, ease);
        tl.fromTo(s, { rot: 0 }, { rot: -Math.sign(dx) * 5, duration: dur * 0.3, ease: "power2.out", immediateRender: false }, at);
        tl.fromTo(s, { rot: -Math.sign(dx) * 5 }, { rot: 0, duration: dur * 0.7 + 0.35, ease: "elastic.out(1, 0.45)", immediateRender: false }, at + dur * 0.3);
      },
      // a happy hop: squash, launch, land on `at + 0.32`, squash, settle
      hop(tl, at, h = 46) {
        tl.fromTo(s, { sqx: 1, sqy: 1 }, { sqx: 1.08, sqy: 0.9, duration: 0.08, ease: "power2.out", immediateRender: false }, at);
        tl.fromTo(s, { sqx: 1.08, sqy: 0.9 }, { sqx: 0.95, sqy: 1.07, duration: 0.1, ease: "power2.out", immediateRender: false }, at + 0.08);
        tl.fromTo(s, { lift: 0 }, { lift: h, duration: 0.13, ease: "power2.out", immediateRender: false }, at + 0.08);
        tl.fromTo(s, { lift: h }, { lift: 0, duration: 0.13, ease: "power2.in", immediateRender: false }, at + 0.21);
        tl.fromTo(s, { sqx: 0.95, sqy: 1.07 }, { sqx: 1.1, sqy: 0.88, duration: 0.06, ease: "power2.out", immediateRender: false }, at + 0.32);
        tl.fromTo(s, { sqx: 1.1, sqy: 0.88 }, { sqx: 1, sqy: 1, duration: 0.5, ease: "elastic.out(1, 0.4)", immediateRender: false }, at + 0.38);
      },
      // a nod on a beat: the head dips and springs back
      nod(tl, at, amt = 7) {
        tl.fromTo(s, { tilt: cur.tilt }, { tilt: cur.tilt + amt, duration: 0.07, ease: "power2.out", immediateRender: false }, at);
        tl.fromTo(s, { tilt: cur.tilt + amt }, { tilt: cur.tilt, duration: 0.35, ease: "elastic.out(1, 0.5)", immediateRender: false }, at + 0.07);
      },
      // a squash on a hit (a flinch or a satisfied bounce)
      bump(tl, at, amt = 0.08) {
        tl.fromTo(s, { sqx: 1, sqy: 1 }, { sqx: 1 + amt, sqy: 1 - amt, duration: 0.05, ease: "power2.out", immediateRender: false }, at);
        tl.fromTo(s, { sqx: 1 + amt, sqy: 1 - amt }, { sqx: 1, sqy: 1, duration: 0.45, ease: "elastic.out(1, 0.4)", immediateRender: false }, at + 0.05);
      },

      // ---- v14: props and gestures ----------------------------------------------------------------------------
      hand(side, o = {}) {
        const a = arms[side === "L" ? 0 : 1];
        const g = document.createElementNS(NS, "g");
        a.el.insertBefore(g, a.handWrap); // behind the pincers, so they close over the prop
        anchors.push({ g, a, upright: !!o.upright });
        apply(0);
        return g;
      },
      handAt, headAt,

      stamp(tl, at, o = {}) {
        const R = (o.side || "R") !== "L", sh = R ? "shR" : "shL", el = R ? "elR" : "elL", cl = R ? "clawR" : "clawL", d = R ? 1 : -1;
        const pre = pick(FACE_ARMS);
        // wind-up: the arm swings high, the body leans away and crouches, the eyes narrow
        to(tl, { [sh]: 172, [el]: -4, [cl]: 1, rot: -9 * d, sqx: 1.07, sqy: 0.91, neck: 0.2, lidL: 0.34, lidR: 0.34,
          browL: 6, browR: 6, browRotL: 12, browRotR: -12, pupil: 0.9 }, at - 0.42, 0.3, "power2.out");
        // the swing: stretch up as the arm whips down
        to(tl, { [sh]: 24, [el]: -6, rot: 10 * d, sqx: 0.93, sqy: 1.09 }, at - 0.1, 0.1, "power3.in");
        // impact on `at`: a hard squash, the eyes pop, and the recoil kicks him off his treads
        to(tl, { sqx: 1.15, sqy: 0.84, lidL: 0, lidR: 0, browL: -20, browR: -20, browRotL: 0, browRotR: 0, pupil: 0.65, neck: 0 }, at, 0.05, "power2.out");
        to(tl, { lift: 30, sqx: 0.96, sqy: 1.05 }, at + 0.05, 0.11, "power2.out");
        to(tl, { lift: 0, sqx: 1.08, sqy: 0.92 }, at + 0.16, 0.11, "power2.in");
        to(tl, { sqx: 1, sqy: 1 }, at + 0.27, 0.45, "elastic.out(1, 0.4)");
        to(tl, { rot: 0 }, at + 0.3, 0.6, "elastic.out(1, 0.45)");
        // settle back to the pose he had
        to(tl, pre, at + 0.42, 0.45, "power2.inOut");
      },

      startle(tl, at, o = {}) {
        const h = o.h ?? 66, k = (o.air ?? 0.37) / 0.37; // jump height, time in the air (scales the whole take)
        // the take: everything at once, a frame after the cause
        to(tl, { ...MOODS.startled, zz: 0, sway: 0, idle: 1, shL: 72, elL: 46, shR: 72, elR: 46, clawL: 1, clawR: 1, jit: 0.9 }, at, 0.06, "power3.out");
        to(tl, { lift: h, sqx: 0.87, sqy: 1.16 }, at, 0.12 * k, "power3.out");
        to(tl, { lift: 0, sqx: 0.98, sqy: 1.03 }, at + 0.22 * k, 0.15 * k, "power2.in");
        to(tl, { sqx: 1.13, sqy: 0.86 }, at + 0.37 * k, 0.05, "power2.out");
        to(tl, { sqx: 1, sqy: 1 }, at + 0.37 * k + 0.05, 0.45 * k, "elastic.out(1, 0.4)");
        to(tl, { jit: 0 }, at + 0.3 * k, 0.3 * k, "power2.in");
        // settle: the arms come down, the eyes stay wide (settle: false leaves the landing pose to the caller)
        if (o.settle !== false) to(tl, { ...MOODS.surprised, ...ARMS_REST }, at + 0.55 * k, 0.35, "power2.inOut");
      },

      doze(tl, at, dur, o = {}) {
        const nod = o.nod ?? at + dur * 0.4, end = at + dur;
        // heavy lids, the shoulders drop
        to(tl, { ...MOODS.drowsy, shL: 3, elL: 5, shR: 3, elR: 5, clawL: 0.1, clawR: 0.1 }, at, Math.max(0.15, nod - at - 0.26), "sine.inOut");
        // the head drops... and catches itself on `nod`
        to(tl, { lidL: 0.92, lidR: 0.95, neck: -0.25, tilt: 15 }, nod - 0.24, 0.22, "power2.in");
        to(tl, { lidL: 0.22, lidR: 0.16, neck: 0.5, tilt: -3, browL: -16, browR: -12, glow: 0.8 }, nod, 0.1, "back.out(2.5)");
        // then sinks for good, in two steps
        const r = end - nod - 0.4;
        to(tl, { lidL: 0.72, lidR: 0.8, neck: 0.05, tilt: 8, browL: 4, browR: 4, glow: 0.45 }, nod + 0.4, r * 0.45, "sine.inOut");
        to(tl, { ...MOODS.asleep, sway: 1, idle: 0.4 }, nod + 0.4 + r * 0.55, r * 0.45, "power2.in");
        to(tl, { zz: 1 }, end - 0.15, 0.4, "power1.out");
      },

      wake(tl, at) {
        to(tl, { ...MOODS.surprised, ...ARMS_REST, zz: 0, sway: 0, idle: 1 }, at, 0.1, "back.out(2)");
        api.blink(tl, at + 0.3); api.blink(tl, at + 0.5);
      },

      shiver(tl, at, dur) {
        const pre = pick([...FACE_ARMS, "jit", "swell"]);
        to(tl, { ...MOODS.cold, shL: -34, elL: -96, shR: -34, elR: -96, clawL: 0.9, clawR: 0.9, swell: -0.7, jit: 1 }, at, 0.16, "power2.out");
        to(tl, pre, at + dur, 0.3, "power2.inOut");
      },

      puff(tl, at) {
        const pre = pick([...FACE_ARMS, "rot", "swell", "hsc"]);
        // inhale: lean back, the neck rises, the chest fills, the arms float out
        to(tl, { rot: -6, neck: pre.neck + 0.55, swell: 1, hsc: 0.94, lidL: 0, lidR: 0, browL: -16, browR: -16, browRotL: 0, browRotR: 0,
          pupil: 1.25, shL: 24, elL: 28, shR: 24, elR: 28 }, at - 0.5, 0.42, "sine.inOut");
        // blow: the head thrusts at us, the chest empties, the eyes squeeze
        to(tl, { rot: 4, neck: pre.neck - 0.15, swell: -0.7, hsc: 1.22, lidL: 0.55, lidR: 0.55, browL: 8, browR: 8, browRotL: 14, browRotR: -14,
          pupil: 0.8, shL: 0, elL: 4, shR: 0, elR: 4 }, at, 0.1, "power3.out");
        to(tl, { swell: -0.85, hsc: 1.18 }, at + 0.1, 0.3, "none");
        to(tl, pre, at + 0.45, 0.5, "back.out(1.6)");
      },

      swoon(tl, at) {
        to(tl, { neck: cur.neck + 0.35, lidL: 0, lidR: 0, browL: -18, browR: -18, pupil: 1.3 }, at, 0.2, "power2.out");
        to(tl, { ...MOODS.swoon, shL: -38, elL: -102, shR: -38, elR: -102, clawL: 0.9, clawR: 0.9, sway: 0.7 }, at + 0.24, 0.9, "sine.inOut");
      },

      smug(tl, at) {
        to(tl, { ...MOODS.smug, neck: 0.72, tilt: 9, shL: 42, elL: -104, shR: 42, elR: -104, clawL: 0.6, clawR: 0.6, lookX: 0.75, lookY: -0.05 }, at, 0.3, "back.out(1.7)");
        api.bump(tl, at + 0.08, 0.05);
        to(tl, { browR: -26 }, at + 0.5, 0.07, "power2.out");
        to(tl, { browR: MOODS.smug.browR }, at + 0.62, 0.3, "power2.inOut");
      },

      peek(tl, at, o = {}) {
        const from = o.from || "right", d = o.dist ?? 300, dur = o.dur ?? 0.7;
        if (from === "bottom") {
          // hidden below the edge, rises to the eyes, then the neck periscopes up and he looks both ways
          tl.fromTo(s, { py: d }, { py: 0, duration: dur, ease: "power2.out", immediateRender: true }, at);
          cur.py = 0;
          to(tl, { ...MOODS.curious, neck: 1.35 }, at + dur * 0.7, 0.3, "back.out(2)");
        } else {
          // hidden past the side edge, slides in leaning round it like a corner
          const k = from === "left" ? -1 : 1;
          tl.fromTo(s, { px: k * d }, { px: 0, duration: dur, ease: "power2.out", immediateRender: true }, at);
          cur.px = 0;
          to(tl, { rot: -k * 12, ...MOODS.curious }, at, dur * 0.8, "power2.out");
          to(tl, { rot: -k * 5 }, at + dur + 1.1, 0.4, "power2.inOut");
        }
        // the shifty look round: away, back, a blink
        const t1 = at + dur;
        to(tl, { lookX: -0.85, turn: -0.5 }, t1 + 0.15, 0.14, "power3.out");
        to(tl, { lookX: 0.85, turn: 0.5 }, t1 + 0.6, 0.14, "power3.out");
        api.blink(tl, t1 + 0.95);
        to(tl, { lookX: 0, turn: 0 }, t1 + 1.05, 0.2, "power2.out");
      },

      tapTread(tl, at, n = 1, o = {}) {
        const key = (o.side || "L") === "R" ? "tapR" : "tapL", every = o.every ?? 0.24;
        for (let i = 0; i < n; i++) {
          const t = at + i * every;
          tl.fromTo(s, { [key]: 0 }, { [key]: 1, duration: 0.11, ease: "power2.out", immediateRender: false }, t - 0.16);
          tl.fromTo(s, { [key]: 1 }, { [key]: 0, duration: 0.05, ease: "power3.in", immediateRender: false }, t - 0.05);
          api.bump(tl, t, 0.035);
        }
      },
    };
    apply(0);
    return api;
  };
  HR.archie.MOODS = MOODS;
})();
