> Delivered as v21 (DELIVERY.md). The sections below are the contract's revisions, newest first, up to v15; v16–v21
> changed frames, not this contract (their plans: V16.md … V21.md; their rules went into docs/HOUSE-STYLE.md and
> docs/visual-guidelines.md). The `renders/` and `backups/` files cited below were removed in the 2026-10-19 cleanup.

# V9 — harvest-remix v15 (overrides earlier sections where stated)

Approved scope: V15.md. Preserve scene spans and aligned words. 11-petabytes may change only for framing, explicitly superseding its earlier byte lock. Orange remains dominant; cyan and violet are allowed locally on active breach electricity/extraction in 22/23. Effects are code-rendered, contact-bound, timeline-driven and seek-safe; software WebGL, no post passes. Archie’s final acting is restrained and continuous. Preserve v14 in backups/v14-sources/.

---

# V8 — harvest-remix v14: the archive opens (overrides earlier sections where stated)

Approved plan/proof: `V14.md`, `renders/proof-v14.mp4`. House-style revision 2 and V7 remain the visual contract.
All scene spans and `lyrics.json` word starts remain fixed. `11-petabytes.html` stays byte-identical.

- **The globe recipe:** self-contained Three.js points (sharp discs + additive bloom), ink occlusion and hairlines;
  software WebGL, no post passes. One continuous move per spectacle. 05 preserves its first five shots, then falls
  through the archive to a whole envelope and one drawer lamp. 22 and 23 share the same radius-12 lamp sphere,
  97 × 193 points, 43° field of view and boundary camera z=34. The breach opens into the globe; the chain pull
  extinguishes it row by row, ending at the actual 15 thumbnail seal (1118,381).
- **Archie is an actor:** use the existing opt-in `archie.js` gestures and hand anchors. Each gesture follows the
  caller's paused timeline; render-time gaze must not overwrite a gesture's eyelids, arms or tilt. Held props must
  visibly follow hands. Never cover a sung lyric. 12 wakes and blows dust/cobweb away; 13 swoons, wipes a lens and
  stamps READ; 15 types, pauses and flourishes SEND while reacting to the deferred security ticket.
- **Every text has a reason:** story, joke or sourced fact, inventoried in `renders/texts-v14.md`. Remove decorative
  engineering codes and repeated OBJ kickers. Ciphertext, fabricated key digits and narrative counters are fiction,
  not security estimates. The carried letter consistently uses TLS 1.3 / X25519 / AES-256-GCM. No invented factoring
  progress, attack-cost keyspace or time-to-break. 03's plate now says `CLASSICAL ATTACK: NOT PRACTICAL`.
- **Determinism and review:** keep the one-timeline contract. Snapshot final sources before checking solo staging
  (the snap command copies files). Pin HyperFrames 0.8.164 with `--no-browser-gpu`. Inspect contact sheets and stills,
  then full check, per-second review, 60 fps delivery render and original-WAV master. No commit or push.

---

# V7 — harvest-remix v13: restraint, small text, payoffs (overrides V6 and earlier where stated)

The plan is `V13.md`; the house style is `docs/HOUSE-STYLE.md` revision 2; the evidence is
`docs/REFERENCE-VIDEOS.md`. Every sung-word time and scene span is unchanged. 11-petabytes stays locked.

- **Black ground.** The ground token is `--ink: #0A0A0A` (was `#111111`). Ink used as paint on cream or orange
  objects (type on paper, stamps, the seal's letter) may stay `#111111`. Remove ground textures: ghost ciphertext
  walls, drawer-grid backdrops, out-of-focus ghost copies, near-plane bokeh glyphs and big orange glow washes. A
  glow may sit tight behind an object that emits it. The drawer wall stays only where it is the subject (05, 09,
  22/23).
- **Accent as light, never ground.** No `backgroundColor: #E85D26` on a root, panel or full-bleed plane. The
  accent marks what emits or is sung: the hero word, the seal, a lamp, the spark, the cable, a lit edge. Hero
  words are flat fire with `hr-glow`, not extruded with burnt steps. The loud moments are black with the accent
  at its brightest, or a short cream flash.
- **Small text, every scene.** 2–4 deadpan details in Plex Mono 13–18 px, `--cream-muted` on ink, `#5F5B54` on
  cream. Each one true and specific (a protocol name, a status, a price), never a date for Q-Day or a time to
  break RSA. It sits on the object it describes: a footer, a label, a field, a tag.
- **Plants and payoffs** (keep the exact strings):
  - 01/02 footer `TLS 1.3 · X25519 · FORWARD SECRECY ✓` → 22 the same line with `X25519` struck through;
  - 06 g3 fields `MAIL · BANK · CLOUD` → 22 records `passwords changed ×14 · irrelevant`;
  - 07/10 ticket `SEC-0001 · Migrate to post-quantum crypto` → 15 toast `SEC-0001 · moved to next quarter (×19)`;
  - BYTES HELD's label → `BYTES READ` on "now" (145.444) in 22.
- **Motion blur on snaps only:** `data-hf-motion-blur` on 1–3 slamming or whipping elements per scene, never on a
  word while it is read (blur the approach, land sharp).
- **The lyric on or as the object** where V13.md's table says so.

---

# V6 — harvest-remix v12: spectacle (overrides V5 where stated)

The plan and its revisions are in `V12.md`.

- **Archie** (`assets/kit/archie.js`, `HR.archie`) replaces the lamp-headed Archivist wherever it appeared: in 04, 12,
  13, 15 and 16. He is not a focus, so add no new cameos.
  - Mount him in the old `viewBox="0 0 300 380"` svg at `x: 150, y: 372, scale: 0.68`.
  - Author moods on the timeline after `tl` exists. Drive `lookX`/`lookY`/`turn`/`tilt` absolutely in `render()`,
    then call `archie.apply(T)`.
  - Prefer open-eyed poses: heavy lids read as closed eyes at small size.
- **The 08 chorus is the cipher bank.** Six Enigma rotor drums decelerate onto the sung hero words. The hook is four
  full-bleed shots.
- **Imagery stays in the archive vocabulary:** type, vaults, drawers, envelopes, seals, the counter, cipher machinery.
  No cosmic or abstract centrepieces: the user rejected a sun, a quantum chip, a black hole and the letter.
- **Performance:** draw many-part 3D objects on a canvas, not as many CSS-3D elements. 144 CSS-3D faces rendered at
  about 8 frames a minute under software GL.
- **Finish layer:** light-sweep transitions on eight cuts, and edge punches on 24 chorus and drop downbeats.

---

# V5 — harvest-remix v11: ideas, voices, registers (overrides V4 and earlier where stated)

v10's craft stays: V4 below still holds. v11 adds what the reference videos (LGTM, p(doom)) have and v10 lacked. The
plan is in `V11.md`. The reference frames are `10-ticket.html` (cream register, marker voice, serif voice) and
`15-secure.html` (the bookend and the Archivist). Read both first.

- **One literal idea per line.** Before building, write down what each sung line *literally* shows, as a visual pun.
  The archive's drawer wall is a texture, not an idea: use it in no more than 3 scenes in the film.
- **Layout families: rotate, never repeat a neighbour's.**
  - **text on a path or surface:** glyphs follow a cable, chart line, arc or object edge, or lie on a plane in
    perspective;
  - **full-bleed type:** one word or line owns the frame;
  - **screen/UI:** an app, a terminal or a mail client, with the lyric typed into or living inside the UI;
  - **cream paper register:** `#F0ECE5` ground, ink type, fire accent; 10-ticket is the model.

  The v10 default of lyric top-left and object right is now just one option among many.
- **Three typographic voices, plus the archive's marker:**
  - Barlow is the song;
  - Plex Mono is the machine;
  - **Instrument Serif Italic** (`assets/fonts/instrument-serif-400-italic.woff2`, `font-style: italic`) is the
    harvester's intimate voice: "darling", "my love", "i'll see you", direct speech;
  - **Caveat Brush** (`assets/fonts/caveat-brush-400.woff2`) is the archive's marker. Use `#C8481A` on cream and the
    fire colour on ink.

  Keep the marker sparse: about 8 notes in the whole film, each a dry aside such as "(it never was)", "(obviously)",
  "again.", "me.". Draw it on: arrows and circles are SVG paths with `pathLength="100"`, revealed through
  `stroke-dashoffset` in `render()`, and words are revealed left to right with `clip-path: inset()` in `render()`.
- **The Archivist** is the film's one character, copied from 15-secure's `#f15-arch` SVG. It is a filing cabinet
  (bevelled drawers, label cards 0001 and ∞) on a two-strut lamp arm with a conical shade; the fire bulb is its eye
  (`hr-glowbox`).
  - **Behaviour:** deadpan and small in gesture. The head nods on keystrokes and tilts on hits. It never speaks; the
    marker is its voice.
  - **Placement:** it never covers a lyric. It enters from a frame edge.
- **BYTES HELD, the escalating motif.** It is one counter style: Plex Mono, a fire value, the label "BYTES HELD". It
  climbs across 04 (from 0), 08 (locked, its own counter), 12 (billions) and 22 (it peaks), and it should be visibly
  bigger every time.
- **Insider precision.** Use real names and facts, not decoration:
  - Mosca's inequality, x + y > z (shelf life + migration time > time to a quantum computer);
  - Shor's algorithm;
  - logical vs physical qubits;
  - FIPS 203 / ML-KEM (Aug 2024);
  - Y2Q, Q-Day;
  - TLS 1.3, X25519.
- **Transitions:** where two scenes share an object, match-cut on it (same position and scale across the cut).
- Every rule in V4 still applies: object detail, `sharp: true`, build order, contrast, and locks on 06, 08 and 11.

---

# V4 — harvest-remix v10: the detail pass (overrides V3 and v2 where stated)

The user asked for every scene at the highest degree of detail: stunning and refined, inside the approved look
(broadside palette, the kit's motion grammar, flat graphic objects, no realistic 3D). Reference frames:
`compositions/frames/01-seal.html` (opening) and `compositions/frames/18-hook.html` (hook). Read both first.

- **Locked, never edit:** `06-qubits.html` and `08-mine.html` (restored byte-identical from v8 at their v8 spans)
  and `11-petabytes.html`. Hashes in `renders/sources-v10-locked.sha256`. Don't change the kit or finish in ways
  that alter them; new kit behaviour is opt-in only.
- **Keep each scene's idea, timing and lyric layout;** raise its craft. Every sung word stays on its `lyrics.json`
  start. Change a layout only where the scene is weak (empty half-frames, tiny rows, muddy contrast).
- **Objects are built from parts.** Shaded faces (gradient per plane, not one fill), a fold or bevel highlight
  line, a soft contact shadow, a raking-light overlay, engraved mono micro-labels with real-feeling content
  (dates, routes, sizes: the story's facts — Tue 09 Mar 2021, AMS-IX, RSA-2048, OBJ 0001), screws/rivets,
  cable runs, barcodes in fire ink. 01's envelope flaps, sorting barcode and sculpted seal (rim with drips,
  radial gradient, bead ring, embossed "a.") are the bar.
- **Fill the frame with depth, not clutter.** No empty half-frame: a background plane of related objects out of
  focus (01's harvested copies at brightness 0.24, blur, 0.42 opacity), a printed form or structure at 10–20 %
  (18's record sheet), the near plane's huge blurred hex at ≤ 0.035.
- **Texture is baked once** from seeded canvases: paper fibre, orange stock, ink masks (18's pinhole mask on
  impressions and stamps: subtle, the type must still read crisp).
- **Beats get physical answers:** a slam squashes (scaleY 0.93 → elastic), spits a few ink dots, kicks the
  camera roll; bare kicks get an object hit (18's rubber stamps). Overlapping camera tweens must not outlive the
  next one (`gsap_tween_tail`).
- **Hero settle:** pass `sharp: true` to `HR.hero` (the elastic settle otherwise drives the blur negative, Chrome
  rejects it and the word stays soft). A hand-rolled settle tweens blur separately with a non-elastic ease.
- **Build order:** create every element before any `tl.set` / tween that selects it (GSAP resolves selectors at
  creation: "GSAP target not found").
- Contrast: chrome on orange is full ink `#111111`; mono on cream paper ≥ `#5F5B54`.

---

# V3 — harvest-remix v9 (overrides v2 only where stated)

Keep approved v8 typography, palette, kit and finish. Referenceframes: backups/v8-sources/compositions/frames/01-seal.html and04-wait.html. User approved their style; this is a new visual-design pass within it.

- STORYBOARD.md now contains23 tiled scenes. Read exact spans and V9 direction. Every sungword stays atlyrics.jsonstart, regardless of shortenedoldframes.
- Big forms before microdetail: clear silhouettes, physical thickness, cable routing, apertureblades, structuralarchitecture. Every newscene must have a new composition/action/viewpoint.
- 2.5D SVG/CSS is preferred for machine,lattice,eye; three.js only firstdrop,lockedpetabytes,finalsequence22+23. No photorealmetal, extraaccent, HUD clutter or randompaperstorm.
- Quantumfridge: obliquecoolingplates and routedcables; processorpackages appear earlierin06. Mechanicaleye: retain machinedrings; add apertureblades, no biologicalfibres.
- Finale: replace independent pageflight with orderedbreach and immense openrecords, then originalletter. Wordnow starts145.270, impact145.444.
- LOCK11-petabytes: do not edit its HTML or timing, or sharedkit/finish in ways changing it.
- Every decoration data-layout-ignore; lyrics sharp and72pxminimum, hero10–15cqw. Newscript IDs prefix ownframe.
- Snapshot each changedframe with ./vid snap and inspectpixels, including interiorposes. Report actualchanges and proofpaths.

---

# SYSTEM.md — the shared craft of this video

## v2 (harvest-remix v8) — read this first; it overrides v1 below where they differ

v7 read as "meh": words popped in fully formed and froze, 12 of 15 frames had no camera, and grounds were flat
with no light (see `UPGRADE.md` §1). v2 makes every frame alive, deep and lit. The reference frames are
`01-seal.html` and `04-wait.html`: read both before you start and reuse their structure.

**The kit.** Every frame loads the shared kit inside its `<template>`, before its own script:
`<script src="assets/kit/env.js"></script><script src="assets/kit/hr-kit.js"></script>`.
`window.HR` gives you:

| API | What it does |
|---|---|
| `HR.lead(tl, word, t)` | A lead word builds glyph by glyph, rising and sharpening, landing on its time. |
| `HR.hero(tl, word, t, {spread, over, pre})` | A hero word's three-phase hit: anticipation, slam on its time, elastic settle. |
| `HR.decrypt(tl, word, t)` | Mono hex settles into the word, resolving on its time. Call `HR.draw(tl)` in render. |
| `HR.exit(tl, line, t)` | A line leaves in a glyph wave, about 0.25 s, starting at t. |
| `HR.stage(root)` | The parallax camera. Tween `stage.cam {x, y, z, rot, focus}` and call `stage.apply(trackT)` in render. |
| `HR.band(name, T)` / `HR.hit(kind, T)` / `HR.onsetsIn(kind, a, b)` | The music, at track seconds. |
| `HR.glow(el, T)` | Bass-driven bloom on `.hr-glow` (text) and `.hr-glowbox` (shapes). |
| `HR.rng` / `HR.cipher` / `HR.glyphs` | Deterministic helpers. |

All `t` arguments are frame-local; `T` is track seconds.

**Rules:**

1. **Every sung word enters through the kit.** Use `lead` or `hero`, or `decrypt` for a word that resolves
   from hex. A 0 ms pop is only allowed for texture, such as the excuse roll.
2. **Nothing holds dead.** Something meaningful moves at all times: the camera (micro-drift is automatic),
   a breathing glow, a counter, a scramble, lamps.
3. **Lines leave.** When a line is replaced on screen, call `HR.exit` on it about 0.26 s before the next
   line's first word. A hard cut at a frame or group boundary is fine without an exit.
4. **Three or four planes.** Build the frame from `.hr-layer` children of `#root` with `data-depth`:
   - background, 0.25–0.35, with `data-dof` of 4–6 px;
   - midground (objects), 0.6–0.7;
   - type, 0.7–1;
   - optionally near, 1.6–1.8, with a few huge blurred hex glyphs at 3–5% opacity.

   Give the type plane a `transform-origin` at the lyric's anchor (e.g. `5.5% 85%`) so camera pushes
   never shove it past the 5.5cqw pad. Mark decorative planes `data-layout-ignore`.
5. **The camera:** one deliberate move per phrase or bar (truck ±60 px, push 1 → 1.06–1.1, a focus pull on a
   story beat) and a 1.03–1.09 punch on the frame's biggest hit, with an elastic settle. Keep the totals
   small; the drift and kick pulse are already in `stage.apply`.
6. **Light is allowed:**
   - Fire glows: `.hr-glow` on fire words on dark, `.hr-glowbox` on the seal, lamps and padlock body,
     driven by `HR.glow` each frame.
   - Soft radial light behind the subject (fire on dark, cream on orange), breathing with `HR.band`.
   - Depth of field on the background plane.

   Type itself stays flat and crisp. Grain, vignette, light leaks and drop flashes come from the finish
   layer (`compositions/overlays/finish.html`); never add your own.
7. **Detail.** Objects look like things:
   - paper fibre on cards (bake a seeded canvas once);
   - bevel and lamp on drawers (see 04);
   - a highlight arc on the seal;
   - extrusion on the big declarations (04's hook `text-shadow` stack).
8. **Music micro-motion,** read in render from `HR.hit` and `HR.band`:
   - kick: the stage pulse, automatic;
   - bass: glow and light breathing;
   - hats: hex flicker and lamp flicker;
   - snare: a 1 px nudge on the hero.

   Small amounts.
9. **Velocity into cuts.** The last 0.3–0.4 s before a hard cut on a drop accelerates (power3.in scale or
   push) and smears for the final 0.1 s (`filter: blur`), as 04 does into 05.
10. **Extrusions and chrome.**
    - Extrude fire type with dark burnt steps (`#7a2c0e #5e220b #451a09 #2f1307 #1f0f07`) and ink type with
      `rgba(120, 40, 10, …)` (04's hook). A same-colour stack smears and reads out of focus.
    - Put kickers and counters on their own low-depth plane (≈ 0.2), so camera punches never push them off
      the frame edge (08).
11. **State-dependent styles use a class on the root, never `#root[attr]`.** The runtime rewrites `#root`
    in CSS, so `#root[data-x]` and `#root.x` rules silently never match. Safest: toggle a frame-prefixed class
    on a child wrapper of root (e.g. a group div) and write `.fNN-x .child { … }` with class selectors on the
    children (14). Rules from a class toggled on root itself worked for class-only descendants (07) but not for
    `#id` descendants (14). Change the root's own ground with `tl.set(root, { backgroundColor })` (01), or with
    `!important` on the class rule (07). Verify state styles in a snap.
12. **Rendering is 60 fps.** Check motion with `./vid snap` at several consecutive times (e.g. word − 0.1,
    word, +0.05, +0.15, +0.4), not single stills.

The original v1 contract follows. Its idea, tokens, lyric rule, code conventions and 3D budget still hold.

---

Every frame of this video is built by a different worker, and it has to read as ONE film. This file is the
contract between them. `frame.md` (broadside, verbatim) is the brand; this file is how this video uses it.
Read both, then your `## Frame` block in `STORYBOARD.md`. When this file and a generic skill rule disagree,
this file wins for this video.

## The idea: ciphertext and plaintext

The singer is the collector: someone who copies your encrypted mail today and reads it when a quantum
machine can. The video tells it in type:

- **Plaintext is the voice.** Every sung lyric is Barlow, lowercase, set as broadside display type. It is the
  only text that speaks in the voice of the song.
- **Ciphertext is the archive.** Everything harvested is IBM Plex Mono uppercase hex (`0-9 A-F`), in
  `cream-hint`/`cream-muted` on ink: the walls, the drawers, the letter's body. It scrambles; it is never
  readable until the end.
- **The letter, object 0001.** One love letter is followed through the film: a flat cream card (envelope ratio
  1.6:1), its body ciphertext, sealed with the fire-orange **seal** — a flat disc, the film's only circle motif
  (seal, padlock body, fridge plates, the "now" sun). Label chrome: `OBJ 0001`.
- **Registers.** Dark (`ink-black` ground) is the archive and the default. Orange (`fire-orange` ground, ink
  type) is declaration: hooks, drops, "now". Flip register only on a downbeat or a drop, as a 0 ms hard cut.

## Tokens (copy verbatim into every frame's `<style>`)

```css
@font-face { font-family: "Barlow"; src: url("assets/fonts/barlow-400.woff2") format("woff2"); font-weight: 400; }
@font-face { font-family: "Barlow"; src: url("assets/fonts/barlow-600.woff2") format("woff2"); font-weight: 600; }
@font-face { font-family: "Barlow"; src: url("assets/fonts/barlow-700.woff2") format("woff2"); font-weight: 700; }
@font-face { font-family: "Barlow"; src: url("assets/fonts/barlow-800.woff2") format("woff2"); font-weight: 800; }
@font-face { font-family: "Barlow"; src: url("assets/fonts/barlow-900.woff2") format("woff2"); font-weight: 900; }
@font-face { font-family: "IBM Plex Mono"; src: url("assets/fonts/ibm-plex-mono-400.woff2") format("woff2"); font-weight: 400; }
@font-face { font-family: "IBM Plex Mono"; src: url("assets/fonts/ibm-plex-mono-500.woff2") format("woff2"); font-weight: 500; }
@font-face { font-family: "IBM Plex Mono"; src: url("assets/fonts/ibm-plex-mono-600.woff2") format("woff2"); font-weight: 600; }
#root {
  position: absolute; inset: 0; overflow: hidden; container-type: size;
  --ink: #111111; --ink-alt: #1A1A18; --fire: #E85D26; --cream: #F0ECE5;
  --cream-muted: #888880; --cream-hint: #505048; --border: #282826;
  background: var(--ink); color: var(--cream);
}
```

Only these colors exist. No green, no red, no blue, no gradients as grounds, no shadows, no rounded corners
(the seal and dots are the only circles). Light in the 3D frames is fire-orange and cream; fog is ink.

## Lyrics (the hard rule)

`lyrics.json` holds every sung line and word with its **track-second** `start`. It is the timing truth.

- Every sung word of your frame is on screen, as sung (the line `text`, lowercased; keep apostrophes, commas
  and the final period/question mark as written).
- **A word appears on its own `start`** (frame-local `start − span_sec[0]`): a 0 ms `tl.set` reveal, or an
  entrance that begins at `start − 0.04` and lands within 0.25 s. Never before its time, never late.
- A line stays readable until the next line starts (or until a cut at least 0.4 s after its last word).
- **Legibility floor** (a phone shows 1080p at ~1/5 size): the line on screen is ≥ 72 px (3.75cqw); a hero
  word is display scale (10–15cqw). Line measure ≤ 78cqw, left-anchored at `pad-x` 5.5cqw unless the block
  says otherwise. One display moment at a time.
- **Hero word** per line (named in the storyboard): in `--fire` on dark, or in weight/scale on orange; it
  lands on its own word time with the frame's strongest move.
- A hero word may decrypt (binary-decrypt: mono hex glyphs settling into the Barlow word) — the scramble runs
  in the 0.3–0.5 s before its `start` and resolves exactly ON `start`.

## Motion (from `/hyperframes-animation`)

- Hard hits are 0 ms `tl.set` (cuts, register flips, swaps, stamps). Eased entrances 0.25–0.5 s
  (`power3.out`, `expo.out`); macro builds over a roll or a phrase (`none`/`power1.inOut`).
- Moves that must land on a beat start 40–190 ms early so they complete ON it.
- One camera/push move per phrase, never per beat. Ambient life everywhere: the background layer drifts or
  breathes slowly so no frame is ever dead still (except a deliberate freeze).
- Every frame has depth: background (ghost ciphertext wall at 4–8% opacity, slow drift; hairline grid) →
  midground (the object of the line) → foreground (the lyric).
- Exits: on a frame's last line, the next frame does the cut — no fade-outs at frame ends. Frames hard-cut.

## Code (one file per frame, `compositions/frames/<frame_id>.html`)

- `<template>`-wrapped, root `<div id="root" data-composition-id="<frame_id>" data-width="1920"
  data-height="1080" data-duration="<span length>">`; all `<style>`/`<script>` inside the template; GSAP is the
  host's global `gsap`.
- One `gsap.timeline({ paused: true })`, built synchronously, registered last:
  `window.__timelines["<frame_id>"] = tl;`
- Prefix every id and class with your frame number (`f02-…`). Never use `Math.random`, `Date.now`,
  `performance.now`, rAF or network fetches. Variation comes from the seeded PRNG below.
- Anything drawn per frame (canvas, WebGL, scrambling glyphs) is drawn from the timeline's own time:
  `tl.eventCallback("onUpdate", render)` where `render()` reads `tl.time()`; call `render()` once after
  building. Scramble glyphs change on a 15 Hz clock: `step = Math.floor(t * 15)`.
- Deterministic helpers (copy as needed):

```js
const f02rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const HEX = "0123456789ABCDEF";
const f02cipher = (n, seed) => { const r = f02rng(seed); let s = ""; for (let i = 0; i < n; i++) s += HEX[(r() * 16) | 0]; return s; };
```

- **three.js** (the cinematic frames only): `<script type="module">` inside the template,
  `import * as THREE from "./assets/vendor/three.module.js";`, a `<canvas>` child of `#root` sized
  1920×1080, `new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true })`,
  `setPixelRatio(1)`, `setSize(1920, 1080, false)`. Build the timeline inside the module and register it at
  the end of the module. Rendering is **software WebGL** (SwiftShader): budget ≤ 2 InstancedMesh/Points
  systems of ≤ 20k instances, no shadow maps, no post-processing passes, simple shaders (`MeshBasicMaterial`,
  `MeshLambertMaterial` or a small `ShaderMaterial`). Fog to `--ink`. Type over WebGL is DOM, not textures.

## See your frame

`./vid snap harvest-remix <frame_id> --at <track seconds,…>` (run from the repo root) mounts your frame on its
own at its span and writes stills to `snapshots/<frame_id>/`. Look at them (Read the PNGs). Check at least:
the first frame, every hero word's time + 0.1 s, every cut inside the frame, and the last frame. Fix what you
see, snap again. Done when every still passes: one display moment, the sung line legible, nothing clipped or
overlapping, the ground never empty, the brand rules held.

## Reference

`compositions/frames/02-sent.html` is the reference implementation of this system (lyric layer, ciphertext,
the letter object, depth layers). Read it before you start; reuse its patterns and code.
