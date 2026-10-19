# V20 frame-worker brief (shared by every worker)

You refine **one to three frames** of harvest-remix (v19 → v20). This is a polish-and-escalation pass on a film the user
likes: change only what your section asks for; everything else in your frame stays as it is.

Read, in this order: `/home/chrysogonus/workspace/neadlab-video-stuff/AGENTS.md`, `docs/HOUSE-STYLE.md`,
`docs/visual-guidelines.md` (the 15 checks — your frame must pass them), `projects/harvest-remix/video/V20.md` (the scene
map, the weakest-scene analysis and the change table; **your section is below**), `projects/harvest-remix/video/V17-WORKER.md`
(**its hard rules and its "Verify like this" section apply unchanged**), `assets/kit/wow-kit.js` and `assets/kit/hr-kit.js`
(headers), then your frame file(s). The v19 copies are in `backups/v19-sources/compositions/frames/`. Work in
`/home/chrysogonus/workspace/neadlab-video-stuff/projects/harvest-remix/video/`.

Reference frames the lead rebuilt for v20 (read them for the idiom): `compositions/frames/09-dark.html` (Mosca: three
framings, one per bar via `HR.stage` camera keys; a front that steps on each hit — the `keyed()` helper; a stamp on a
snare) and `compositions/frames/01-seal.html` (the v20 block: hits on the pad's own onsets).

## What the user asked for

"Never boring, visually rich and beautiful, with moments viewers haven't seen before. Intensity should escalate with the
music. Use contrast so the big moments land." Polish and escalation, not a redesign: keep each scene's idea, facts, puns
and small-text layer. No shot visually static for more than ~2 s.

## v20 hard rules (on top of V17-WORKER's)

- Size motion by the measured drums (`HR.band("drums", T)`, `WOW.energy`), not by the section's name. Every onset ≥ 0.9
  (`HR_ENV` in `assets/kit/env.js`) and every downbeat in your span changes something visible.
- Fill the frame: the hero object ≥ 35 % of the frame in every still; no small prop alone in a black void for more than a
  beat. Fix voids by scale and camera, never by a grey ground (ground luma rule in HOUSE-STYLE).
- Neighbouring lines never share a lyric position; lyric lead words ≥ 72 px; every sung word appears on its `lyrics.json`
  start.
- Explosions are mechanical (parts, sparks, light from the object). No lightning, flat CSS rings or full-frame washes.
- No jolts: camera moves ease in and out (≥ 0.35 s), shakes use the kit's 11 Hz `WOW.shake`, recoil ≤ 8 px.
- Keep your frame's in/out switches (kinds, times) and its first/last instant unless your section says so: neighbours
  match-cut against them. A GSAP timeline must still run to the frame's full duration (if you remove the last tween, add
  `tl.set({}, {}, DUR)` — v20 lesson: a short timeline freezes the frame's end).
- Render cost: SVG/canvas/DOM only; no new three.js scenes, no post passes, no full-frame motion blur.
- Do not edit `assets/kit/`, any other frame, `index.html`, `STORYBOARD.md`, the overlays or the V*.md files. No
  whole-project check, no full render, no git.

## Measure

Stills: `./vid snap harvest-remix <frame> --at <track s,…>` (re-run it before any solo render: it refreshes the solo copy).
Motion and luma: a 30 fps solo render, then the metric:
```
cd projects/harvest-remix/video/.hyperframes/solo/<frame> && npx hyperframes render --no-browser-gpu --fps 30 --quality draft -o <scratch>/<frame>.mp4
ffmpeg -v error -i <scratch>/<frame>.mp4 -vf "fps=10,scale=320:180,format=gray,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-" -f null - | grep -o 'YAVG=[0-9.]*'
```
(drop `tblend=all_mode=difference,` for luma). Solo renders have no grain layer, so their motion floor is lower than the
film's. The v19 figures to beat are in V20.md's scene map (measured on the full film with grain).

## Sections

### W1 — 06-qubits, verse 2 (61.346–75.987) — V20.md change #5
One continuous camera travel through one line-drawn space instead of five black voids. Each prop ≥ 35 % of the frame, the
lyric on the object, the lyric position changing per line.
- 62.02–65.62 "They're stacking up the qubits, a few more every year": the stack grows a layer per kick (already "one layer
  a beat"); the camera cranes up it so the stack fills the frame height.
- 65.62–69.04 "The experts said a decade, now the decade's nearly here": the camera *flies along* the runway, digits passing
  under on the kicks; "decade" painted on the runway surface.
- 69.04–73.0 "You changed all of your passwords, you think that sees you through": the password fields scramble one per
  hat; "UNCHANGED" stamps on a snare; the panel fills ≥ 35 % of the frame.
- 73.0–76.46 "But a blueprint or a birthday stays as true as true": blueprint and birthday hit on their word times (73.22,
  74.14), then TRUE.
- Keep the 05→06 match cut (06 opens on the chip core at 3.2×) and 06's out switch into 07.
Targets: motion median ≥ 8 (v19: 3.7), luma ≥ 30 (v19: 23), no still run > 2 s.

### W2 — static holds in 12-key (123.479–131.022) and 13-reading (134.514–143.604) — change #6
- 12: a callback with a difference to 04's clock: the year reel ticks 2021 → 2025 on the kicks, a slow orbit/push, the
  face shows wear (scratches, dust in the light). Keep the 128–131 byte counter as is. Target 124–128: motion ≥ 5,
  no still run.
- 13, 134.51–137.54 "So that's what you were on about": the envelope and key fill ≥ 40 % of the frame; the key turns in the
  seal on "about" (its word time in lyrics.json, ≈ 136.6).
- 13, 137.54–143.6 the cream letter ("I said sooner or later", "harvested then,"): the camera drifts along the handwriting,
  the marker writes in real time, Archie leans in on the hits. The drums are near zero at 139–141: keep it calm (motion
  2.5–6), but no still run > 2 s (v19: ~5 s at motion ≈ 2).

### W3 — 10-ticket bridge (105.243–117.94) and the holds in 02-sent (13–14.5) and 15-secure (161–163) — changes #7, #6
- 10: keep every gag. The bridge has the song's loudest drums (peak 1.0) over calm paper (motion 4.8): add a kick-driven
  carrier: cards shuffle a few px per kick, a ≤ 2 px camera recoil per kick, the Gantt bars slide a quarter at a time on
  the kicks ("again." on its snare), the cursor visible and moving. Target motion median ≥ 7.
- 02, 13.0–14.5: the padlock breathes and its shackle clicks on the hat; no still run.
- 15, 161–163: a 1.5 % push and a cursor blink before the end card; calm (the outro's drums are ≈ 0), no still run > 2 s
  except the end card itself.

### W4 — 16-intercept (16.06–23.656) and 18-hook (45.487–48.491) — changes #10, #11
- 16: light packets run along the fibre on each hat; the copy device's tap pulses on the snare; "read" and "copy" ≥ 2× their
  current size. Target motion ≥ 9.
- 18: the hex digits decrypt one group per hat into "decrypt later"; the archive stamp slams on the snare (the frame already
  loads motion-blur; use it on the slam only). Target 46–48: no still run, motion ≥ 6.

## Final report (your last message; the lead reads only this)

Short: what changed per shot (track-time spans), the music events the new motion sits on, the measured luma/motion before and
after, the snapshot times you inspected, files changed, anything you could not fix. No code.
