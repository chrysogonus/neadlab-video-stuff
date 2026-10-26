# REFINE-2.md — Force Push, refinement round 2 (pipeline step C)

The second and last round brief (AGENTS.md stage 6, step C). It comes from step A's measurements on draft 1
(`audit/draft-1b/report.md`) and step B's independent review (`audit/draft-1/review.md`), checked against the draft by the
lead. Read both, then this file, then REFINE-1.md (its film-level rules, transition table and check section still hold),
WORKER.md and SYSTEM.md. Your frame was refined in round 1: **keep what works, fix what this brief names.** Every sung
word stays on its `start`; the span is unchanged.

## Where draft 1 stands

Against the references draft 1 is in band on motion, composition change, cuts, true black (22 %) and accent; no still
runs; 29 unseen hits (v1 54). The reviewer: it would hold up on YouTube. Keep the hook slams (10, 12, 25, 33's first
bar), 05's carried-over branch name, the chants, the end card timing.

What is left, checked by the lead on frames of `renders/video.mp4`:

1. **Cuts that land on a dim, near-empty frame with one small word** for 0.5–1.4 s: 03 (19.89), 04 (23.70), 14 (68.69),
   27 (129.34), 34 (177.15), and 32's fade to a bare prompt (161.0–161.8). REFINE-1 rule 2 again: the first frame is
   the scene's object, lit, and the lead-in before the first sung word moves it. Where the line's first words come
   before the hero, set them at the lead size (≥ 3.75cqw, SYSTEM.md), not as a tiny label beside a cursor.
2. **The "brand new timeline," lockup holds its pose for 3–4 s** (13: 64.9–67.8; 26: 125.3–128.5; 33: 172.4–177.1). The
   graph scrolls and the command types, but the big type and framing do not change. The hold needs one big move.
3. **The drop is not the film's peak after its first bar:** from 172.4 it holds the lockup (item 2), while chorus 2's
   hooks keep moving. (The audit points the same way, 33's frame-diff p90 12.1 against 23's 17.3; a signal to look at,
   not a number to beat.)
4. **Small elements:** 19's secondary lines ("the rest right out of", ~2 % of the frame), 20's phone a quarter of the
   frame in a black void (100.0–101.4), 14's stale clone still an unreadable box.

Not taken: the review's note on 28 ("nothing happens on 'not there'") — the draft shows the panel closing and
`Collaborators: 1` stamping on "there" (135.6–136.4); and 23–25 "reruns" — round 1 rebuilt them bigger, and they stay.

## The work (one worker per row)

| worker | frames | fix |
|---|---|---|
| A | 13-timeline, 26-timeline2 | The hold on "timeline,": one big move per held bar — the camera dollies along the graph line (≥ 190 px or zoom ≥ 1.1) with the words riding it, a new commit dot landing on each kick under the camera, the line's head ring flaring; on "no" print `Fast-forward` and on "goodbyes" whip along the line into the next scene (as REFINE-1 said). 26 does it bigger (its drums are louder). Also 13's cut-in at 63.68: land on the line and the words, not a near-black frame. |
| B | 33-drop, 35-chant3 | Make the drop the peak a viewer sees: 33's second half (172.4–177.1) rides the timeline lane at double speed with the camera, the words landing per kick, one big musical move per bar into "goodbyes", still the brightest stretch; 35 the final chant visibly bigger than 16 and 29 (the crowd filling the whole frame by "crowd", the camera's biggest moves of the film). Judge it on full-rate frames beside 23's and 25's; the audit's numbers are signals, never targets (no extra shake or jolts to raise them). |
| C | 19-cherry | The sung lines at the lead size or bigger (≥ 3.75cqw; "three" and "tree" as display words at their times); one square filling per kick from 92.24 so the hits read (10 of the draft's 29 unseen hits are here: 92.24–94.09, 98.22–99.59); the other squares dropping with gravity on the rebase. Open on content (no empty grid). |
| D | 02-commit, 03-stash, 04-feature | Cut onto content: 02 opens on the editor already lit with its title bar (01's lockup becoming it), 03 on the stash row lit from the first frame (02's abort line scrolling up into `git stash list`), 04 on `git switch -c` already typing with the lead words at lead size. |
| E | 14-local, 27-local2, 34-dropmine | Cut onto content: each opens on its terminal already lit and the lead words at lead size, with a move from the first frame; 14's stale clone is a readable miniature terminal (`behind 'origin/main' by 1095 commits` legible at h3); 34 lands on the remote list lit and big, not a bare `git remote -v`. |
| F | 20-phone, 31-checkout, 32-acappella | 20: start tight on the lock screen (the phone ≥ 60 % of the frame height), stack one notification per hat. 31: no 2 s hold on "here I go" (158.5–160.7) — keep the flip moving into the cut. 32: no fade to a bare prompt at 161.0–161.8 — the line stays lit and the serif line is at least 5cqw; keep the build into 169.27. |

## Check (as REFINE-1, plus)

- `./vid snap` your frame(s), fix every ✗, read the stills — especially the first frame of each.
- A range proof and `./vid audit force-push --file <proof> --name r2-<frame>`; compare with `audit/draft-1b/report.md`
  (same units). The audit's scene table has "frame diff" (ranks the weakest) and "guideline motion" (the thresholds in
  docs/visual-guidelines.md); highlight is YHIGH 0–255.
- Pull your cut-in at full rate and look at it:
  `ffmpeg -ss <video s − 0.1> -i <proof> -t 0.5 -vf fps=30,scale=480:270,tile=5x3 -frames:v 1 <png>`.
- The kit README's traps (renderer: no property only in a `fromTo`'s `from`; motion blur on fixed-content tween moves
  only, settles on a wrapper). A whip `in` starts before 0 so the first frame is mid-whip on content
  (`WOW.transition(tl, cam, { in: "whipL", dur: 0.25, start: -0.1 })`).
- If a proof fails with "Runtime.evaluate timed out", retry once (the machine is shared).
