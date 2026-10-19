# V17 frame-worker brief (shared by every worker)

You rework **one frame** of harvest-remix (v16 → v17). Read, in this order: `/home/chrysogonus/workspace/neadlab-video-stuff/AGENTS.md`,
`docs/HOUSE-STYLE.md`, `projects/harvest-remix/video/V17.md` (**the motion rules, the switch table and your scene section**),
`projects/harvest-remix/video/SYSTEM.md` (V9 and V7 are the visual contract), `assets/kit/wow-kit.js` (read the header,
the v17 additions `WOW.on`, `WOW.energy`, `WOW.SOFT` word kinds and the v17 switch kinds `pushIn | pullOut | glideL | glideR |
glideUp | glideDown`), `assets/kit/hr-kit.js`, and `compositions/frames/01-seal.html` (the lead's v17 reference: one slow
continuous push over the whole pad, small events only on real onsets, the hit on the first kick, `pushIn` out). Then your
frame file (the v16 copy is in `backups/v16-sources/compositions/frames/`). Work in
`/home/chrysogonus/workspace/neadlab-video-stuff/projects/harvest-remix/video/`.

## What the user asked for (their words)

"The beginning is slightly too fast and doesn't really sync with the music … I don't want scenes to look too slow and static
and I don't want sudden abrupt movements." Then: make every scene look more refined, improve effects and quality.
In practice: **always moving, never jerky; the big hits only where the music hits; energy that follows the song.**
v16's ideas stay unless V17.md says otherwise — this is a refinement, not a new film.

## Hard rules

- **Do not change** the frame's span, `data-duration`, the composition id, or the `lyrics.json` word times. Every sung word
  appears on its `start` (soft entrances may begin ≤ 0.06 s early so the word is readable on its start); the hero word of a
  line lands on its own word time; line text is the sung text exactly. No lyric shows before it is sung.
- `WOW.word` now hides its element from the frame's start until the entrance (`tl.set(el,{opacity:0},0)`); pass
  `{ hide: false }` for a re-entry of a word that is already on screen. Any other delayed `fromTo` entrance with
  `immediateRender: false` leaves the element visible before it starts: hide it explicitly from 0.
- `WOW.shake` is now smooth 11 Hz noise (a rumble, not per-frame jolts). The v17 switch kinds always cover the canvas.
- **Music data**: kick/snare/hat onsets and downbeats are in `assets/kit/env.js` (`HR_ENV.onsets`, `HR_ENV.downbeats`, track
  seconds) — the same data `HR.hit`/`HR.onsetsIn`/`WOW.on` use. List your span's events with:
  `python3 -c "import json;s=open('assets/kit/env.js').read();j=json.loads(s[s.index('{'):s.rindex('}')+1]);A,B=<start>,<end>;[print(k,[round(t,3) for t,a in v if A<=t<B]) for k,v in j['onsets'].items()];print('down',[round(t,3) for t in j['downbeats'] if A<=t<B])"`
  Every accent you place by hand goes through `WOW.on(trackT)` or is an exact onset/downbeat/word time from that data.
- One paused GSAP timeline per frame, registered as `window.__timelines["<frame-id>"]`; deterministic (no `Math.random`, no
  `Date.now`; use `HR.rng(seed)`); seek-safe (state is a pure function of timeline time, drawn from
  `tl.eventCallback("onUpdate", render)`; call `WOW.draw(tl)` and `HR.draw(tl)` there). Tweens that start later than 0 use
  `immediateRender: false`. Elements driven by WOW state helpers (shake/punch/pulse/transition) use CSS individual
  transform properties; give them their own wrapper.
- **Do not edit any file in `assets/kit/` or any other frame.** Helpers go inside your frame. Note wanted kit changes in your
  report.
- House style: ink ground `#0A0A0A`, fire `#E85D26` as light/pointer (≤ ~5 % of the frame on average), cream `#F0ECE5`; one
  accent hue (08 may use a touch of blue-white at lightning peaks only). Fonts in `assets/fonts/` (Barlow 400–900, IBM Plex
  Mono, Instrument Serif italic, Caveat Brush). Lyrics are poster type (≥ 72 px lead words; hero words huge). Keep the deadpan
  small-text layer and the plants/payoffs in SYSTEM.md V7. Code-rendered imagery only; 3D only as lines/points/simple
  instanced meshes under software WebGL, no post passes.
- Decorative layers carry `data-layout-ignore`; deliberate overlap of real text gets `data-layout-allow-overlap`.
- Performance: ≤ ~150 animated DOM nodes alive at once; prefer canvas for many-part things; no huge blurred layers.
- Do not run the whole-project `hyperframes check`, a render, or any git command. No commits.

## Verify like this (from the repo root `/home/chrysogonus/workspace/neadlab-video-stuff`)

`./vid snap harvest-remix <frame-id> --at t1,t2,…` (track seconds) mounts your frame alone and writes stills plus
`projects/harvest-remix/video/snapshots/<frame-id>/sheet.png`. **Read the sheet** at: the first instant (must be a fully
composed frame — no build-up from black), every shot start and last instant, every hero word (+0.0, +0.15 s), and the last
instant. To judge *motion*, sample a 1–2 s window every 0.1 s around each big move and each switch: consecutive stills must
change smoothly (no position/scale jump between two 0.1 s stills except on a deliberate hard cut or a chorus hero hit), and
static stretches must not exceed ~1 s without the carrier moving. Fix what you see: clipped text, overlaps, empty frames,
illegible lyric, things cut off by the canvas edge, mirrored back faces.

## Final report (your last message; the lead reads only this)

Short: the shot list with track-time spans and the carrier move in each; the accents and the music events they sit on; the
switches in/out (kinds and durations); what you removed from v16; files changed; the snapshot times you inspected; anything
you could not fix; any kit change you want. No code.
