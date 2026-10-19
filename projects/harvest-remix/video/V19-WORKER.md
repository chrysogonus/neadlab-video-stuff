# V19 frame-worker brief (shared by every worker)

You refine **one or two frames** of harvest-remix (v18 → v19). This is a polish pass on an approved film: change only what
your section asks for; everything else in your frame stays as it is.

Read, in this order: `/home/chrysogonus/workspace/neadlab-video-stuff/AGENTS.md`, `docs/HOUSE-STYLE.md`,
`projects/harvest-remix/video/V19.md` (the analysis table and **your section**), `projects/harvest-remix/video/V17-WORKER.md`
(**its hard rules and its "Verify like this" section apply unchanged**), `projects/harvest-remix/video/V17.md` (motion rules),
`projects/harvest-remix/video/V18.md` (the five v18 rules), `assets/kit/wow-kit.js` and `assets/kit/hr-kit.js` (headers), then
your frame file(s). The v18 copies are in `backups/v18-sources/compositions/frames/`. Work in
`/home/chrysogonus/workspace/neadlab-video-stuff/projects/harvest-remix/video/`.

## What the user asked for

"I like the latest variant … however it still needs polishing … so that this video becomes a great YouTube success."
The analysis found your span too dark, too empty or too still for its music (V19.md table). Goal: **every frame full,
legible at phone size, moving with the music, never jerky.** Keep the scene's idea, facts and small-text layer.

## v19 additions to the hard rules

- Size motion by the measured drums (`HR.band("drums", T)`, `WOW.energy`), not by the section's name.
- Neighbouring shots never share a lyric position; keep each lyric legible (≥ 72 px lead words).
- Explosions are mechanical: parts, sparks and light come from the object. No lightning, flat CSS rings or full-frame colour
  washes.
- Do not change your frame's in/out switches (kinds, times) or its first/last instant unless your section says so: the
  neighbouring frames match-cut against them.
- Do not edit `assets/kit/`, any other frame, `index.html`, `STORYBOARD.md` or the V*.md files. No whole-project check, no
  render, no git.

## Measure (in addition to the stills)

A frame's luma and motion from its own stills: sample your span every 0.1 s with `./vid snap` and compare consecutive stills
by eye; for numbers, run on the snapshot PNGs
`ffmpeg -v error -framerate 10 -pattern_type glob -i '<snapdir>/*.png' -vf "scale=320:180,format=gray,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-" -f null - | grep -o 'YAVG=[0-9.]*'`
(luma; add `tblend=all_mode=difference,` before `signalstats` for motion). Your section gives the targets.

## Final report (your last message; the lead reads only this)

Short: what changed per shot (track-time spans), the music events the new motion sits on, the measured luma/motion before and
after, the snapshot times you inspected, files changed, anything you could not fix. No code.
