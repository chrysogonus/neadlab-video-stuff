# The kit

Shared, seek-safe helpers for every frame of a house-style video (`docs/HOUSE-STYLE.md`).
`./vid video` installs these files into `projects/<id>/video/assets/kit/` once and never overwrites them, so a project
keeps the copy it was made with; only `env.js` is regenerated on every run. Canonical copies:
`templates/hyperframes/assets/kit/`.

| File | What | Load |
|---|---|---|
| `env.js` | `window.HR_ENV`: the song as data (`fps`, band envelopes at 50 Hz, beats, downbeats, kick/snare/hat onsets), generated from `data/audio.json` by `./vid video` | first |
| `hr-kit.js` | `HR`: seeded PRNG (`rng`), glyph scramble (`cipher`, `glyphs`), words that build glyph by glyph (`lead`, `decrypt`, `draw`), three-phase hits (`hero`), `exit`, a parallax camera with a kick pulse (`stage`, by `data-depth`/`data-dof`), `glow`, the music (`band`, `hit`, `onsetsIn`) | after `env.js` |
| `wow-kit.js` | `WOW`: shockwaves, rays, shards (`shock`, `rays`, `burst`, `explode`), `flash`, word entrances (`word`), `shake`, `punch`, `pulse`, scene switches (`transition`: `zoom`, `whipL`/`whipR`, `spin`, `drop`, `rise`, `cut`, `pushIn`, `pullOut`, `glideL`/`glideR`/`glideUp`/`glideDown`), applied each frame by `WOW.draw(tl, T0)` from `render()`; `WOW.on` snaps to `HR_ENV` hits, `WOW.energy` sizes them by the mix's loudness (RMS) | after `hr-kit.js` |
| `motion-blur.js` | the registry's motion blur: mark an element `data-hf-motion-blur='{"fps": 60}'` (other keys: `shutterAngle`, `shutterPhase`, `samplesPerFrame`, `sharp`; or `attachMotionBlur(selector, tl, opts)`; see `/hyperframes-animation`, `references/motion-blur.md`) | anywhere in the frame |
| `lines.js` | ES module, the set-piece kit (p(doom)'s engine, `git show fa164b7`): `createLines` (instanced anti-aliased capsule lines, 2D or 3D, additive), `createShutter` (sub-frame motion blur for a WebGL layer), `textOnPath` (sung words glyph by glyph along a 3D curve, lit on their times), `projector`, `renderer` (true 4K in a 4K render), `HATCH_GLSL` (engraving hatch, heat ramp), camera time helpers (`keys`, `prog`, `ease`, `springStep`, `pulse`, `noise1`, `hash`, `clamp`, `lerp`, `smoothstep`), the colours (`ACCENT`, `BONE`, `palette`) and the grid (`beatAt`, `beatsIn`) | `import * as K from "./assets/kit/lines.js"` in a `<script type="module">`, with `three` from `./assets/vendor/three.module.js` |

## Light and depth (docs/HOUSE-STYLE.md)

- **The light pass owns glow, grain and vignette.** The finish layer leaves them to it, so `STORYBOARD.md`'s
  frontmatter must set `light: {"accent": "#rrggbb"}` (the palette's accent; `./vid snap`, `proof` and `render` fail without it), and
  `./vid snap`, `proof` and `render` run `analysis/finish.py` over the frames: whatever is drawn in the accent emits light (bloom
  and halation), cream and bone stay crisp. So draw the hot things in the accent and add no CSS glow (`text-shadow`,
  `drop-shadow`, `.hr-glow*`, radial-gradient light) on top: it doubles. A frame's `- light: {"bloom": 0.8}` line
  in its `STORYBOARD.md` block changes the pass for that frame only.
- **A set piece is lines in a space.** `main` as a rail into the dark, a field of lanes, a curve the lyric rides:
  `createLines` draws tens of thousands of segments a frame on the GPU. Fog every segment by its distance to the
  camera (`alpha *= exp(-k · max(0, d − near))`) and rebuild the batch each frame from `t`.
- **The camera follows the singer.** Key it to the sung words (`K.keys(t, [[wordTime, arclength], …])` along the
  path) and to the beats, with a dive (`outExpo`, ~0.35 s) on the hero and smooth `noise1` drift; render the fast
  moves through `createShutter` (8 samples) and the rest directly.
- **Type on the object stays legible:** size the words in world units so the sung line is ≥ 72 px and a hero
  ≥ 11cqw on screen (`px = size · 1.4 · camera.projectionMatrix.elements[5] · 540 / distance`). Text drawn with
  `textOnPath` sits on a Canvas2D layer over the WebGL canvas; fixed copy (labels, terminals, the strip) stays DOM.
- `projects/force-push/video/compositions/frames/05-branch.html` is the worked example.

Colours follow `--hr-accent-rgb` and `--hr-light-rgb` (`"r, g, b"`) on the frame's `#root`; unset, they are
harvest-remix's fire orange and cream. (`wow-kit.js` reads them from the 2026-10-20 template on; an older project's
copy, harvest-remix's included, hard-codes the orange and cream.)

## Traps that cost harvest-remix whole rounds

- **A property only in a `fromTo`'s `from` is not rendered.** `tl.fromTo(el, {opacity: 1, x: 0}, {x: 100})`: the
  render's frame-by-frame seeks skip `opacity`, although `snap` shows it (02-commit lost a word in the video this way).
  Put every property in both `from` and `to`, or set it separately with `tl.set(el, {opacity: 1}, t)`.
- **Motion blur clones its target once** and seeks with events suppressed: an element whose content changes blurs
  stale content, and moves made in `render()` never blur. Put `data-hf-motion-blur` only on elements with fixed
  content moved by timeline tweens; use a plain CSS blur for render-driven moves. The copies follow the element's
  own opacity and visibility, but they sample the shutter around the current time: an element that waits invisible
  at its landing spot can smear there for a frame or two, so park it off-frame instead (`tl.set(el, {x: 1900}, 0)`).
  The copies are also on screen while the element's own tween settles: blur only the approach, and run a settle (an
  elastic, a squash) on a wrapper, or the check fails the blurred copy on contrast.
- **A script error kills the whole frame silently.** In the film it is just a dead frame; nothing fails. A kit call
  that uses `tl` before `const tl = …` (a TDZ error) did this to two frames. `./vid snap <id> <frame_id>` runs
  `hyperframes check` on the frame alone and fails on it.
- **`WOW.explode` with a `parent` draws a flat shock ring and rays** (`WOW.shock`, `WOW.rays`), which
  docs/visual-guidelines.md rule 9 forbids. Call it without `parent` (or with `fx: false`) and let the object carry the hit:
  its parts, sparks and light.
- **Switch a cut on one clock.** A `tl.set` switch and a `render()` switch at the same timestamp were seen to land a
  frame apart in a render (35-chant3), leaving one blank frame at an in-frame cut. Drive both sides of a cut from the
  same place, or offset them by a few ms so both have switched by the same frame (35 does this), and check the cut at
  full rate.
- **Pin the timeline's end.** Removing a frame's last tween shortens its timeline and freezes the frame's end:
  `tl.set({}, {}, DUR)`.
- **Measure after the fonts.** DOM measurements taken before the fonts load give the wrong size and pose:
  `await document.fonts.load(…)` first.
- **Shake is noise, never random per frame.** A new random offset every frame reads as jolts; use a smooth ~11 Hz
  noise from a seeded `HR.rng`. Never `Math.random`, `Date.now` or rAF.
- **Zoom and glide switches keep the scale at or above cover**, or a black border shows.
- **Many CSS-3D faces are slow under software WebGL** (144 faces rendered about 8 frames a minute). Draw them on a
  canvas instead.
- **A brightness filter on a WebGL canvas lifts the haze to a coloured ground;** pair it with contrast.
- **WebGL at `setPixelRatio(1)` is upscaled in a 4K render** while type and SVG stay sharp: use `K.renderer`
  (it takes `devicePixelRatio`), and size a Canvas2D layer `1920·dpr × 1080·dpr` with `ctx.setTransform(dpr, …)`.
- **A hung WSLg blocks Chrome.** When the GPU render times out waiting for Chrome, or `check` never finishes,
  WSLg's X server has hung (`xdpyinfo` does not answer): `./vid snap` and `check` run without a display anyway; add
  `--no-browser-gpu` to proofs and renders until WSL restarts. For a raw `npx hyperframes` call, prefix
  `env -u DISPLAY -u WAYLAND_DISPLAY`.
- **A module script runs after the classic ones** (`env.js`, `hr-kit.js`, `wow-kit.js` are ready inside it) and may
  `await document.fonts.load(…)` before it builds; register the timeline last, as always.
