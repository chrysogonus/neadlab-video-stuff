# Visual guidelines: checks on the rendered frames

A checklist for every Neadlab video, from the harvest-remix v19 audit (2026-10-19, `projects/harvest-remix/video/V20.md`).
[HOUSE-STYLE.md](HOUSE-STYLE.md) says what the look is; this file says how to check a render against it. Every item
is tested on rendered frames, not on code.

## How to measure

- **Contact sheets:** 2 fps of the whole film, 5–10 fps strips around every drop and every scene switch.
- **Luma and motion:** per frame at 10 fps, 320×180 gray. Luma is the mean (`signalstats` YAVG). Motion is the
  mean frame difference (`tblend=all_mode=difference`, then YAVG). Take per-second and per-scene medians.
- **Music:** the tracked drums and RMS (`data/audio.json`), the kick, snare and hat onsets and downbeats (`HR_ENV`
  in `assets/kit/env.js`), and the word times (`data/lyrics.json`).
- **Highlights:** the 90th-percentile luma per frame (`signalstats` YHIGH) at 4 fps.
- **Still run:** a stretch where motion stays below 1.5.

For reference, harvest-remix v19 measured these motion medians: the drawer tunnel (the best scene) 23; a verse of small
props in black voids 3.7; the Mosca chart 1.2.

## The checklist

1. **No dead frames.** No still run longer than 2 s. The end card is the only exception.
2. **Motion follows the drums.** Per-scene motion median: ≥ 12 where drums ≥ 0.6, ≥ 6 in verses, 2.5–6 in deliberate
   breaths. A breath is calm, never still.
3. **Every strong hit is seen.** Every onset of strength ≥ 0.9 and every downbeat changes something visible within ±1
   frame (a strip at the onset shows it).
4. **The first frame is a poster, and the first 5 s move.** t = 0 reads as a thumbnail; motion ≥ 6 from 0.3 s; at
   least one object hit before 2.5 s.
5. **Fill the frame.** The hero object covers ≥ 35 % of the frame in every still. No small prop in a black void for
   more than a beat.
6. **The hero word is a poster.** At its hit it spans ≥ 60 % of the frame width, sits on or is part of the object, and
   nothing is drawn over it.
7. **Phone-legible.** Every sung line reads in a 480×270 copy of the frame.
8. **No repeated lyric layout.** The lyric's placement changes from line to line.
9. **Three framings per scene.** A scene longer than 4 s shows tight, mid and wide framings, switched on downbeats.
10. **Depth.** At least two layers move at different speeds in every scene: two stills 0.5 s apart show parallax.
11. **Each scene transforms once.** A scene's last frame differs from its first in kind, not only in position.
12. **Peaks are the brightest and fastest.** The biggest drops have the highest luma × motion in the film; the quiet
    spans measure lower.
13. **Explosions are mechanical.** Parts, sparks and light come from the object. No lightning, flat rings or
    full-frame washes.
14. **Palette discipline.** Black ground (20th-percentile luma ≤ 0.05), one accent at ≤ 5 % of the frame, cream paper
    in 10–20 % of frames.
15. **Cuts are authored.** At least a third of the scene switches are object match cuts; flashes on at most three
    moments in the film.
16. **Every shot has a highlight and a light source.** At least one near-white or white-hot element in every frame
    (the 90th-percentile luma, `signalstats` YHIGH at 480×270, ≥ 80), a world object filling ≥ 50 % of the frame, lit by
    its own light (wax, lamps, paper under a lamp). harvest-remix v20: the 10 best shots measured p90 74–239, the 10 worst
    34–68 — mid-grey objects on black, HUD rings, particles and blur read as cheap.
