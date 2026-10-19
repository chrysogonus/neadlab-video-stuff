# V21 frame-worker brief (shared by every worker)

You redesign **one weak shot (or two) inside one or two frames** of harvest-remix (v20 → v21), so that it reaches the level
of the film's best shots. Everything outside your span stays as it is.

Read, in this order: `/home/chrysogonus/workspace/neadlab-video-stuff/AGENTS.md`, `docs/HOUSE-STYLE.md`,
`docs/visual-guidelines.md`, `projects/harvest-remix/video/V21.md` (why the best shots work, and **your row W#**),
`projects/harvest-remix/video/V20-WORKER.md` (**its hard rules and its Measure section apply unchanged**),
`projects/harvest-remix/video/V17-WORKER.md` ("Verify like this"), `assets/kit/wow-kit.js` and `assets/kit/hr-kit.js`
(headers), then your frame file(s). The v20 copies are in `backups/v20-sources/compositions/frames/`. Work in
`/home/chrysogonus/workspace/neadlab-video-stuff/projects/harvest-remix/video/`. Load the /hyperframes-animation skill
before writing motion.

Look at the best shots before you start (stills from the v20 proof, `./vid snap harvest-remix --at <s>` writes them):
05 tunnel 49.0 and 57.5, 08 exploded rotors 92.4, 11 petabytes 120.6, 17 eyes 43.6, 03 KEEP 29.6, 07 sprint board 82.6.
Match their craft: a tactile object from the song's world filling ≥ 50 % of the frame, lit by its own light; real depth;
paper whites or white-hot accents on the black ground; one thing becoming many or transforming; the hero word part of the
object; deadpan small text. Explosions are mechanical. Code-rendered imagery only.

## Targets for your span

- p90 brightness ≥ 80 (at least one near-white or white-hot element in every frame), motion ≥ the v20 figure in V21.md,
  no still run > 2 s, every listed hit visible within ±1 frame, every sung word on its lyrics.json start.
- Measure p90 like luma, with `signalstats` key `lavfi.signalstats.YHIGH` instead of `YAVG`.
- Keep the frame's in/out switches and first/last instants unless your row says otherwise (neighbours cut against them).
- Render cost: SVG / canvas / DOM, or extend an existing three.js scene with simple line/instanced geometry. No new
  three.js scene in a frame that has none, no post passes, no full-frame motion blur. The film is rendered in 4K: draw
  canvases at 2× when `window.devicePixelRatio` is 2 if you add a new canvas (size it 3840×2160 and scale the context),
  and prefer SVG/DOM for new hero objects so they stay crisp.

## Sections

- **A — 04-wait and 12-key: W4 (04 intake 37.5–41.72) and W8 (04 clock 33.8–37.5, 12 clock 123.5–128.2).** 04's opening
  instant is cut against 03's vault hub (the lead makes 03's hub open into the clock at 33.81): keep 04's clock hub at its
  current screen position at t = 0. In 12 keep the 128–131 byte counter, but replace its flat CSS shock rings, rays and
  cream flash (at 128.911, 130.7 and on "mine") with a mechanical hit: the digits slam, sparks off the reel.
- **B — 21-fridge: W2 (132.0–134.5).** The fridge shot 131.0–132.0 stays. The last instant must hand over to 13's first
  frame (envelope + key, 134.514): the key lands where 13's key sits, or a clean hard cut on 134.51.
- **C — 07-later: W3 (76.0–79.5).** The 79.5 paper card and the sprint board after it stay.
- **D — 08-mine: W6 (85.1–91.5).** The bank opens reading "later·" (v20 match cut from 07) and the exploded-view locks from
  92.22 on stay exactly as they are; "time" at 88.52 keeps its lock.
- **E — 06-qubits: W9 (69–73).** The runway before and the blueprint after stay; keep the camera travel into and out of the
  span continuous.
- **F — 15-secure: W5 (160.058–164.4).** Keep the opening instant (cut from 23). The end card must be on screen ≥ 2 s,
  readable, and it is the film's last frame.

## Final report (your last message; the lead reads only this)

Short: what changed per shot (track-time spans), the music events the new motion sits on, the measured luma / p90 / motion
before and after, the snapshot times you inspected, files changed, anything you could not fix. No code.
