# V16 frame-worker brief (shared by every worker)

You rework **one frame** of harvest-remix (v15 → v16). Read, in this order: `/home/chrysogonus/workspace/neadlab-video-stuff/AGENTS.md`,
`docs/HOUSE-STYLE.md`, `projects/harvest-remix/video/V16.md` (the goals and **your** scene section),
`projects/harvest-remix/video/SYSTEM.md` (V9 and V7 are the visual contract), `assets/kit/wow-kit.js` (the shared
effects vocabulary; read its header and signatures), `assets/kit/hr-kit.js`, and `compositions/frames/01-seal.html`
(the lead's reference for how `WOW` is wired: effects layer, `WOW.draw(tl)` in `render()`, shakes on layers, paired
transitions). Then your frame file (the pre-v16 copy is in `backups/v15-sources/`). Work in
`/home/chrysogonus/workspace/neadlab-video-stuff/projects/harvest-remix/video/`.

## What the user asked for (verbatim goals)

More wow at every scene switch (like 03's stamp → pull back through the drawer → vault: *that* quality); more
overall effects; a faster pace; split static or boring scenes into 2–3 shots; **explosive** hero words and lyrics:
the viewer must want to dance. Nothing may sit unchanged for more than ~1.5 s; something moves on every kick; each
hero word lands with a shockwave/rays/shake. Be ambitious, then make it clean: every shot must still read at a glance.

## Hard rules

- **Do not change** the frame's span, `data-duration`, the composition id, or the `lyrics.json` word times. Every sung word
  appears on its `start`; the hero word of a line lands on its own word time; line text is the sung text exactly.
  Read the word times from `lyrics.json` (track seconds; frame-local time = track − frame start).
- One paused GSAP timeline per frame, registered as `window.__timelines["<frame-id>"]`; deterministic (no `Math.random`, no
  `Date.now`; use `HR.rng(seed)`); seek-safe (the render seeks; state is a pure function of timeline time, drawn from
  `tl.eventCallback("onUpdate", render)`; call `WOW.draw(tl)` and `HR.draw(tl)` there). Tweens that start later than 0 use
  `immediateRender: false`. Shaken/pulsed/transitioned elements are driven by `WOW` through CSS `translate/rotate/scale`/`filter`,
  so they must not be `stage.apply()` layers' own `filter` targets, but layers' `transform` is fine.
- Load `assets/kit/wow-kit.js` after `hr-kit.js`. **Do not edit any file in `assets/kit/` or any other frame.** If you
  need a helper, write it inside your frame. Note any wanted kit change in your final report.
- House style: ink ground `#0A0A0A` (black, mostly empty), fire `#E85D26` as light/pointer (≤ ~5 % of the frame on
  average; a hero word, a spark, a lit edge; brief full-frame flashes are fine), cream `#F0ECE5`; one accent hue only
  (exceptions: 08 and 13 may use a touch of electric blue-white at overload peaks, 22/23 already use cyan/violet). Fonts
  already in `assets/fonts/` (Barlow 400–900, IBM Plex Mono, Instrument Serif italic, Caveat Brush). Lyrics are poster
  type (≥ 72 px lead words; hero words huge). Every on-screen text means something (a joke, a fact, a status); keep the
  deadpan small-text layer and the existing plants/payoffs strings in SYSTEM.md V7. Code-rendered imagery only. Complex or
  realistic 3D is out: line-drawn / points / instanced simple meshes under **software WebGL** (no post passes); keep
  three.js frames lean.
- Decorative layers carry `data-layout-ignore` (effects layers, packets, particles). Deliberate overlap of real text gets
  `data-layout-allow-overlap`.
- Performance: the render is screenshot-based at software GL. Keep DOM particle counts sane (≤ ~150 animated nodes alive at
  once), avoid huge blurred layers on many elements, prefer canvas for many-part things.
- Do not run `hyperframes check` for the whole project, a full render, or any git command (the lead does those serially).
  No commits. Preserve unrelated working-tree changes.

## Verify like this (from the repo root `/home/chrysogonus/workspace/neadlab-video-stuff`)

`./vid snap harvest-remix <frame-id> --at t1,t2,…` mounts your frame alone at its span and writes stills plus
`projects/harvest-remix/video/snapshots/<frame-id>/sheet.png` (3 across). **Look at the sheet (Read the PNG)** at: the
frame's first instant, every shot start and every shot's last instant, every hero word's landing (+0.0 and +0.15 s),
mid-transition instants (the frame's first 0.15 s and last 0.15 s), and the last instant. Fix what you see (clipped
text, overlaps, empty frames, illegible lyric, things off-centre or cut off by the canvas edge). A snap takes ~30 s: batch
many times per call, and judge the *motion* by sampling densely (every 0.1 s) around each big move. Snapshots show only
the frame itself (no finish layer, no neighbouring frame).

## Switches

The cut at the frame's start and end is a paired move with the neighbour: use `WOW.transition(tl, root, {in, out, dur, total})`
with the kinds V16.md gives for your frame (the neighbour's frame will use the same kind on its side). Inside the
frame, cut between shots with the same kinds on each shot's group wrapper (`start`, `total`) or with a match-move you
design (a push-through, a whip with motion blur, a zoom out through an object, a spin, a drop). Use at least one
signature in-frame switch of "03's vault" quality that is specific to the scene's object, not just a generic wipe.

## Final report (your last message; the lead reads only this)

Keep it short: the shot list with track-time spans and what happens; the two or three signature moments; the
transitions in/out; files changed; the snapshot times you inspected and anything you could not fix; any kit change you
want. Do not paste code.
