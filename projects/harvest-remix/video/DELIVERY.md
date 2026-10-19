# harvest-remix v21: delivery record

Delivered 2026-10-19 from the user-approved V21.md plan ("implement these refinements and render the video afterwards
in 4k at 60 fps") and uploaded to YouTube. The plan, the per-shot measurements and the render log are in V21.md;
V9.md … V20.md hold the earlier rounds.

**Upload:** repository-root `out/harvest-remix.mp4`.
**Subtitles:** `renders/harvest-remix-lyrics.en.srt`.
**Thumbnails** (1280×720, YouTube Test & Compare): `renders/thumbnail-v21-1-sealed-read.png` (recommended),
`-2-every-byte-mine.png`, `-3-decrypted-now.png` (and `.jpg` copies). Source: `compositions/thumbnail/v21/`, a
standalone composition over three of the master's own 4K frames (158.95, 92.4, 153.5 s); snapshot it at t = 0.5, 1.5,
2.5 and scale to 1280×720.

- H.264, 3840×2160, constant 60 fps, 9,864 frames, 164.400 s; AAC from the master WAV, 320 kbps target (324,377 bps).
- Size 2,718,362,564 bytes (about 2.7 GB).
- Rendered with HyperFrames 0.8.164 on the GPU (WSLg chrome-gpu wrapper, `--browser-gpu --workers 4 --resolution 4k
  --fps 60`). WebGL layers render at 1× and are upscaled; type and DOM/SVG are native 4K. The session ended during the
  CLI's encode, so the captured frames were encoded by hand (libx264 medium, CRF 16, BT.709 tv range), then
  `./vid master harvest-remix` muxed the master audio.

## Changes from v20: the 10 weakest shots

| Shot | v21 |
|---|---|
| 03 vault bolt roll | machined steel door lit in the shader, bolts white-hot on the throw (v20's darkening canvas filter removed) |
| 03 "i only have" | Plan B under a warm work lamp, pan to drawer 0001 |
| 04 clock + 12 callback | cream enamel dial, sprung second hand on the snares, time-lapse on "time"; 12 the same dial aged |
| 04 intake | pneumatic mail machine, one envelope per word, the gate slams on "mine" |
| 06 passwords | monitor dialog, sticky notes slapped on per hat, UNCHANGED stamp |
| 07 "new math" | lamp-lit FIPS 203 folder, pop-up lattice locks into a cube on "math", DEFERRED stamp |
| 08 rotor lines | three framings on the downbeats, cream paper tapes per word, speed streaks up to the hook |
| 15 outro | push into the browser, "secure." lock tooltip, padlocks pop, the seal rolls into a 2.1 s cream end card, NEAD stamped one letter per beat |
| 21 "the key falls out" | cryostat stages lit per hit, 13's key thrown to the lens, lands on "out" |
| 22 globe | read per kick, top to bottom, fully lit at the cut into 23 |

The rule behind them (every shot has a near-white highlight, a world object filling half the frame and its own light
source) is guideline 16 in docs/visual-guidelines.md.

## Measurements (master vs the v20 proof)

Film: luma 71 → 81, p90 132 → 158, motion median 8.0 → 9.6, longest still 1.4 s (23's calm read), cream share
(luma > 120) 18 → 20 %. Every redesigned shot rose; two stay below the p90 ≥ 80 target: 03's bolt roll (62) and
"i only have" (74). Per-shot numbers: V21.md, Status.

## Verification

- `npx hyperframes check --no-browser-gpu`: 0 errors; contrast warnings in 02 and 18, as in v20.
- Master: 9,864 frames verified after the hand encode; ffprobe 3840×2160, 60 fps, 164.4 s, AAC.
- Thumbnails checked at 336×189 (YouTube's small size).

All scene spans and sung-word starts are unchanged from v15; master audio is unchanged.
