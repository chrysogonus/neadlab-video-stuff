# REFINE-1.md — Force Push, refinement round 1 (pipeline step C)

The round brief for frame-workers (AGENTS.md "Making a video", stage 6, step C). It comes from step A's measurements
(`audit/v1/report.md`) and step B's independent review (`audit/v1/review.md`): read both, then this file, then
WORKER.md and SYSTEM.md as before. Your frame already exists and is approved in its idea, world, strings and timing:
**raise it, don't replace it.** Every sung word stays on its `start`; the frame's span is unchanged.

## What the audit and the review found

Against LGTM and p(doom) the film moves too little (big-motion 90th percentile 0.74 against 1.94 / 5.96), is 69 % true
black against 20–44 %, has 9 % mid-tone seconds against 28–33 %, little detail, and no accent colour in 44 % of its
seconds. The reviewer: most of the 100 cuts land on an empty prompt with one small word, so each verse scene feels like
the same screen restarting; several jokes sit in tiny text; chorus 2 reads as a rerun of chorus 1; the opening dims
after 1.5 s; the a cappella does not build into the drop; the end card leaves no room for YouTube's end screen. Keep:
the chants (16, 29, 35), the drop's first bar (33), the git precision, the devices.

## Film-level rules for this round (every frame)

1. **Transitions (the table below).** Wrap everything that moves in your frame in one camera wrapper (e.g.
   `<div id="fNN-cam">` around the `.hr-layer`s; the root keeps its ground colour) and register
   `WOW.transition(tl, cam, { in: <kind>, out: <kind>, dur, total: DUR })` with your incoming cut's kind as `in` and
   your outgoing cut's kind as `out` (`cut` = none on that side); call `WOW.draw(tl, T0)` in `render()` (load
   `assets/kit/wow-kit.js` after hr-kit). The pair across a cut uses the same kind, so the move carries through.
   Never let a transition cover a sung word's first 0.25 s; if a word starts inside the first `dur`, shorten your `in`.
2. **Cut onto content, never onto an empty prompt.** Your first frame already shows your scene's object and the
   context the previous scene handed over (its last line scrolling away, the prompt with history, the object in
   place) — no near-empty first beat. Use any lead-in before your first sung word for a move.
3. **One big move per phrase,** sized by the drums (`HR.band("drums")`, `WOW.energy`): a camera push or truck of at
   least 10 % (zoom ≥ 1.1 or ≥ 190 px), a whip, or the scene's object travelling across a third of the frame. Small
   punches on hits stay. Chorus 2 (23–29) moves visibly more than chorus 1 (10–16): its drums are louder.
4. **Motion blur on fast moves:** `data-hf-motion-blur='{"fps": 60}'` on 1–3 slamming or whipping elements, with
   `<script src="assets/kit/motion-blur.js"></script>` (see the kit README and 18-hook in harvest-remix). Never on a
   word while it is read: blur the approach, land sharp.
5. **Light and depth: less black.** Every scene gets a light source tied to its object: a soft accent glow (radial,
   6–14 % opacity) behind the hero object or word, breathing with the bass (`HR.band("bass")`); a lit edge, a screen
   glow, a highlight on the object. Target: true black under about 55 % of the frame for most of the scene. No textures
   on the ground (house style), no second colour.
6. **Accent present:** the accent (a lane, the cursor, `you`, a `+`, an underline) is on screen in most seconds of
   the scene, as a pointer — about 3–5 % of the frame, not a ground.
7. **Jokes at poster scale:** the object that carries the line's joke is display-sized at its moment (a viewer must
   get it at phone size), not 1 % text.

## The transition table (track seconds; kinds from wow-kit: zoom, whipL/R, drop, rise, pushIn, pullOut, glides, cut)

| cut | at | drums | kind | dur |
|---|---|---|---|---|
| 01-status → 02-commit | 15.081 | 0.01 | `zoom` | 0.35 s |
| 02-commit → 03-stash | 19.885 | 0.49 | `glideUp` | 0.42 s |
| 03-stash → 04-feature | 23.696 | 0.18 | `glideL` | 0.42 s |
| 04-feature → 05-branch | 27.570 | 0.03 | `drop` | 0.40 s |
| 05-branch → 06-blame | 31.139 | 0.00 | `glideUp` | 0.42 s |
| 06-blame → 07-merge | 38.723 | 0.34 | `rise` | 0.40 s |
| 07-merge → 08-patches | 46.550 | 0.23 | `glideUp` | 0.42 s |
| 08-patches → 09-stop | 51.907 | 0.01 | `pushIn` | 0.46 s |
| 09-stop → 10-force | 53.380 | 0.00 | `cut` | 0.00 s |
| 10-force → 11-rewrote | 56.291 | 0.38 | `whipL` | 0.25 s |
| 11-rewrote → 12-lies | 60.780 | 0.16 | `whipR` | 0.25 s |
| 12-lies → 13-timeline | 63.679 | 0.52 | `whipL` | 0.25 s |
| 13-timeline → 14-local | 68.690 | 0.07 | `whipL` | 0.25 s |
| 14-local → 15-origin | 72.435 | 0.53 | `rise` | 0.40 s |
| 15-origin → 16-chant | 76.090 | 0.15 | `zoom` | 0.35 s |
| 16-chant → 17-squash | 83.484 | 0.26 | `pullOut` | 0.46 s |
| 17-squash → 18-message | 88.220 | 0.75 | `rise` | 0.40 s |
| 18-message → 19-cherry | 92.086 | 0.00 | `drop` | 0.40 s |
| 19-cherry → 20-phone | 100.044 | 0.19 | `glideR` | 0.42 s |
| 20-phone → 21-ignore | 103.465 | 0.06 | `glideUp` | 0.42 s |
| 21-ignore → 22-revert | 107.370 | 0.00 | `glideUp` | 0.42 s |
| 22-revert → 23-force2 | 114.120 | 0.00 | `cut` | 0.00 s |
| 23-force2 → 24-rewrote2 | 117.160 | 0.80 | `whipR` | 0.25 s |
| 24-rewrote2 → 25-lies2 | 121.534 | 0.20 | `whipL` | 0.25 s |
| 25-lies2 → 26-timeline2 | 124.580 | 0.71 | `whipR` | 0.25 s |
| 26-timeline2 → 27-local2 | 129.340 | 0.21 | `whipL` | 0.25 s |
| 27-local2 → 28-origin2 | 133.152 | 0.55 | `rise` | 0.40 s |
| 28-origin2 → 29-chant2 | 136.790 | 0.07 | `zoom` | 0.35 s |
| 29-chant2 → 30-shared | 144.169 | 0.00 | `pullOut` | 0.46 s |
| 30-shared → 31-checkout | 151.680 | 0.00 | `glideUp` | 0.42 s |
| 31-checkout → 32-acappella | 160.731 | 0.82 | `cut` | 0.00 s |
| 32-acappella → 33-drop | 169.270 | 0.00 | `cut` | 0.00 s |
| 33-drop → 34-dropmine | 177.150 | 0.13 | `whipL` | 0.25 s |
| 34-dropmine → 35-chant3 | 184.530 | 0.09 | `zoom` | 0.35 s |
| 35-chant3 → 36-reflog | 191.895 | 0.00 | `cut` | 0.00 s |
| 36-reflog → 37-end | 197.431 | 0.66 | `cut` | 0.00 s |

`cut` stays hard on purpose: the Enter into each hook (09→10, 22→23, 32→33), 31→32 (a match on the same prompt), the
drop to silence (35→36) and the beat's return (36→37).

## Per-scene fixes (from the review; scenes not listed get the film-level rules only)

- **01-status:** keep the poster lit through the first 15 s: type `git status.` into the poster's own prompt so the big
  type stays lit (dim it only partly), set "nothing to commit." large, draw the graph full-width with a large counter,
  and land a `force push / NEAD` lockup at the cut (15.08). t = 0 stays exactly as it is (the thumbnail and 37's
  bookend).
- **02-commit, 03-stash, 04-feature:** three left-top layouts in a row — vary them: 03 sets the stash entry
  `stash@{3 years ago}: On main: me` large in the centre; 04 runs the branch name full-width along the bottom; each
  scene's last line scrolls up into the next prompt (the `glideUp` cuts).
- **05-branch:** the branch name from 04 drops in and becomes the curve's label; the camera tracks along `main`, dives
  down the curve on "branch", the curve lights on "hide".
- **06-blame:** start tight on the author column, `you` stamping in fire on each kick; pull out wide on "your name";
  land `lines by you 8 · lines by me 0` large on "not mine".
- **07-merge:** drift the camera down the file; stamp `>>>>>>> you` large (display scale) at 45.42.
- **10-force:** first bar: FORCE PUSH! at ≥ 85 % of the frame width (as 33), then settle into the approved layout.
- **13-timeline, 26-timeline2:** scroll the graph under the words on the beat during the held "timeline,"; on
  "goodbyes" print `Fast-forward` and whip along the line into the next scene.
- **15-origin, 28-origin2:** the absence is the joke: the collaborator row visibly collapses / closes up on
  "not there", large.
- **19-cherry:** full-width grid; punch in on the three squares one per beat; drop the other 1,092 off-frame on the kick.
- **23-force2:** FORCE PUSH! at ≥ 85 % width; the struck `you` rows big, not footnotes.
- **25-lies2:** the overwrite stroke crosses a large `Revert "force push"`.
- **27-local2:** their clone box slides off-frame on "care".
- **32-acappella:** the build into the drop: the line starts on its first word with a slow push-in; on the last bar
  retype `git push --force origin main` one key per eighth note while the cursor shoves the words off-frame; the Enter
  is the cut (169.27). The last bar is the steepest rise in the film.
- **37-end:** count down faster so the poster is up by ~203.5 s (about 6 s of end card); leave the right ~40 % of the
  end card calm and dim (YouTube's video cards and subscribe button go there for 5–20 s); t = 209.6 still matches 01's
  t = 0 on the left.

## Check (as WORKER.md, plus)

**Renderer trap (found this round):** a property set only in a `fromTo`'s `from` (e.g. `opacity: 1`) is skipped by the
render's seeks though `snap` shows it — put it in both `from` and `to`, or `tl.set` it. Check your frame for it, and
trust the range proof over the stills.

**Motion-blur trap:** `motion-blur.js` clones its target once and ignores moves made in `render()`: blur only
fixed-content elements moved by timeline tweens (kit README).

`./vid snap force-push <frame> --at …` (fix every ✗; snap the first frame, both transitions mid-way, every hero word,
the last frame), then `./vid proof force-push --from <your start − 0.5> --to <your end + 0.5>` and
`./vid audit force-push --file projects/force-push/video/renders/proof-<from>-<to>.mp4 --name r1-<frame>`: your
scene's row should show more motion (p90), less black and more colour than its row in `audit/v1/report.md`. Report
both rows.
