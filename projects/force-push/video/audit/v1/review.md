# Review: force-push v1 (`out/force-push.mp4`)

Independent review, pipeline step B (docs/REVIEW.md). I judged it from the 37 strips in `strips/`, full frames pulled
at 0, 3.5, 12, 14.6, 28.0, 34, 37.6, 44, 54.5, 70.5, 94, 98.5, 101, 135.5, 165, 168.8, 182.5 and 206 s, and step A's
`report.md`. Strip frames are cited as `scene row.col` (row and column from 1, 4 fps, so a frame sits at
`span start + ((row−1)·6 + col−1) · 0.25 s`).

## 1. Verdict

The writing is at reference level: the world, the insider git strings, the counter and the plants match LGTM. The
picture is not: motion is below both references (median 0.31 against 0.37 and 1.17, p90 0.74 against 1.94 and 5.96),
and with 69 % true black and 9 % mid-tone seconds it plays as a well-written terminal, not a set of designed plates.
The biggest weakness is how the cuts land: most of the 100 hard cuts open on an empty prompt and one small word
(02, 03, 04, 05, 06, 08, 13, 14, 22, 36). Each verse scene feels like the same screen restarting, and chorus 2 looks
like a rerun of chorus 1. The thing to keep is the chant set (16, 29, 35) and the drop's first bar (33): there the
type goes full-frame, hits on the stomps and reads at a glance, and every other scene should be measured against it.

## 2. Scene table

Scores 1–5; 3 = fine for YouTube. Each reason explains that row's lowest score.

| scene | idea | motion | trans | legib | colour | craft | variety | lowest score's reason |
|---|---|---|---|---|---|---|---|---|
| 01-status | 3 | 2 | 3 | 3 | 3 | 3 | 4 | the poster dims at 1.5 s, then 3 s of only `git status.` (still run 1.6–4.8); the storyboard's title lockup never lands (14.6 s) |
| 02-commit | 4 | 2 | 2 | 4 | 2 | 3 | 3 | 1.8 s of empty prompt before "three"; typing is the only motion |
| 03-stash | 3 | 3 | 2 | 4 | 3 | 3 | 2 | lyric stacked top left like 02; the stash entry `me` is footnote-sized |
| 04-feature | 4 | 3 | 2 | 4 | 3 | 3 | 2 | 1.5 s of "said it's just" alone on black (04 1.2–2.1); top left a third time |
| 05-branch | 4 | 2 | 2 | 3 | 2 | 3 | 3 | a hairline in a void (28.0 s); p90 0.34 under a verse groove |
| 06-blame | 3 | 2 | 2 | 3 | 2 | 3 | 3 | the joke (every author `you`) is ~1 cqw mono; the lyric is a caption under the log (34, 37.6 s) |
| 07-merge | 4 | 2 | 3 | 4 | 3 | 3 | 4 | 7.8 s on one static page; `>>>>>>> you` is printed at h3, not slammed (07 5.5) |
| 08-patches | 4 | 3 | 2 | 4 | 3 | 3 | 4 | hard cut onto "no" alone (08 1.1) |
| 09-stop | 4 | 3 | 4 | 4 | 3 | 3 | 3 | none below 3: the held beat and the Enter cut work |
| 10-force | 4 | 3 | 4 | 4 | 4 | 3 | 3 | the hook fills ~55 % of the width (54.5 s), not a full-frame poster |
| 11-rewrote | 4 | 3 | 2 | 4 | 3 | 3 | 4 | plain hard cut in; the hash wave only reads up close |
| 12-lies | 4 | 3 | 3 | 4 | 4 | 3 | 3 | none below 3: `FORCE PUSH!` back in a corner two scenes after 10 |
| 13-timeline | 3 | 2 | 2 | 4 | 3 | 3 | 4 | one tilted lockup frozen 64.9–67.9 (13 2.1 → 3.6) at drums 0.45 |
| 14-local | 3 | 3 | 2 | 4 | 3 | 3 | 4 | their "tiny clone" is a grey box whose text can't be read (70.5 s) |
| 15-origin | 3 | 3 | 3 | 4 | 3 | 3 | 4 | none below 3: the empty collaborator row is an invisible hairline |
| 16-chant | 4 | 4 | 3 | 4 | 4 | 4 | 4 | none below 3: best scene in the film |
| 17-squash | 4 | 4 | 3 | 3 | 3 | 3 | 4 | none below 3: the squashed line is thin by design |
| 18-message | 3 | 3 | 3 | 4 | 3 | 3 | 4 | none below 3: plain text on paper, little to look at |
| 19-cherry | 3 | 2 | 2 | 4 | 3 | 3 | 4 | the picked days are ~1 % squares (94 s); "out of my tree" is grey dust (98.5 s) |
| 20-phone | 4 | 3 | 2 | 3 | 2 | 3 | 4 | a grey phone in a void (101 s); hard cut in |
| 21-ignore | 4 | 3 | 3 | 4 | 3 | 3 | 4 | none below 3 |
| 22-revert | 4 | 3 | 2 | 4 | 3 | 3 | 3 | opens on "no" alone (107.4 s) |
| 23-force2 | 3 | 3 | 4 | 4 | 4 | 3 | 2 | a rerun of 10; the changed hashes are mono at <1 cqw |
| 24-rewrote2 | 3 | 3 | 2 | 4 | 3 | 3 | 2 | a rerun of 11 |
| 25-lies2 | 3 | 3 | 3 | 4 | 4 | 3 | 2 | a rerun of 12; verse 2's lies are mono h3 |
| 26-timeline2 | 4 | 2 | 2 | 4 | 3 | 3 | 3 | the payoff (`git remote remove you`) is good, but the lockup freezes as in 13 |
| 27-local2 | 3 | 3 | 2 | 4 | 3 | 3 | 2 | a rerun of 14; only the marker changes, `(still.)` |
| 28-origin2 | 3 | 3 | 3 | 4 | 3 | 3 | 2 | a rerun of 15; the deleted row can't be seen (135.5 s) |
| 29-chant2 | 3 | 4 | 3 | 4 | 4 | 4 | 3 | none below 3: the blame payoff (all `me`) is footnote-sized (29 5.3) |
| 30-shared | 4 | 3 | 3 | 3 | 3 | 4 | 4 | none below 3: microscopic man-page text, fine for a breath |
| 31-checkout | 4 | 3 | 4 | 4 | 3 | 3 | 4 | none below 3 |
| 32-acappella | 3 | 1 | 2 | 3 | 2 | 3 | 4 | 7 s still run (161.8–169.0) and no wind-up into the biggest drop (168.8 s) |
| 33-drop | 4 | 4 | 4 | 4 | 4 | 4 | 3 | none below 3: after the poster bar it falls back to 12's layout |
| 34-dropmine | 3 | 3 | 3 | 4 | 4 | 3 | 2 | the local-copy set a third time (14, 27, 34) |
| 35-chant3 | 3 | 4 | 3 | 4 | 4 | 4 | 3 | none below 3: the film's peak, but the same as 16 |
| 36-reflog | 4 | 2 | 2 | 4 | 3 | 3 | 3 | opens on an empty prompt for 0.5 s; dry by design |
| 37-end | 4 | 3 | 3 | 4 | 3 | 3 | 4 | none below 3: but the poster lands ~1.4 s before the end, with no room for the end screen |

## 3. The weakest scenes, ranked

1. **32-acappella (160.7–169.3).** One grey serif line on black for 7 s (still run 161.8–169.0). The storyboard's
   "last beat accelerates into the drop" is not in the render: at 168.8 s the line is still fading in word by word,
   and the film's biggest hit, 169.27, arrives straight from its stillest frame. It also opens with 1.2 s of a
   shrinking prompt in a void (32 1.2 → 2.1).
   **Fix:** set the line on its first word with no empty lead-in. A slow, continuous camera push (scale 1.0 → 1.3
   over the scene) aims the line and the `git push --force` prompt at the cursor. On the last bar (167.4–169.27) the
   prompt retypes to `git push --force origin main`, one keystroke per eighth note, and the cursor walks right,
   shoving the serif words off the frame edge. Enter is the cut into 33's `FORCE`.

2. **01-status, the first 15 s (0–15.08).** The t = 0 poster is a good thumbnail (0 s). It dims to a ghost at 1.4 s,
   and from 1.6 to 4.8 s the only thing on screen is `git status.` in mono at ~4 cqw (3.5 s). The graph (9.4–15) is
   clean but sits in the upper half. The storyboard's `force push / NEAD` lockup on the last downbeat is missing
   (14.6 s shows the graph alone). A viewer gets 1.5 s of hook, then 3 s of near-black.
   **Fix:** keep the poster as the scene. Type `git status.` into the poster's own prompt line under `force push`, so
   the big type stays lit until 4.74. "nothing to commit." then replaces the poster as display type (11 cqw) at its
   word time. During the pad, draw the graph at full frame width while the counter's `1,095` counts up in display
   digits on the right, and land the lockup on 15.08 as the storyboard says.

3. **Chorus 2 (23–28, 114.1–136.8).** The 10 vs 23 and 15 vs 28 strips are the same frames: same layout, type size
   and light leak. The world's changes (`9c0ffee`, verse 2's lies, `(still.)`, the gone collaborator row at 135.5 s)
   sit in mono text under 1 cqw. Drums are higher than in chorus 1 (0.39–0.53 against 0.30–0.49), but motion is the
   same (10: 0.59, 23: 0.62). LGTM's half-robot board is the kind of change a viewer sees at a glance; this one isn't.
   **Fix:** give each scene one escalation at poster scale and keep the set:
   - **23:** `FORCE PUSH!` at ≥ 85 cqw, and the push strikes through the log's `you` rows in the accent on "history".
   - **25:** the overwrite stroke crosses `Revert "force push"` set at display size.
   - **27:** their clone box starts at half of 14's size and slides off the left edge on "care".
   - **28:** row 2 of the collaborator list collapses shut on "not there".

4. **06-blame (31.1–38.7).** The joke, every blamed line's author is `you`, sits in ~1 cqw gutter text. At phone
   size it is a grey log with a caption under it (34 s, 37.6 s). "blame" is h2, not a display word. In 7.6 s the only
   move is a highlight bar stepping down the rows.
   **Fix:** make the gutter the image. The camera starts tight on the author column, `(you` eight rows tall, and each
   row stamps in the accent on a kick as the highlight passes. The sung line types into the code column beside it at
   lyric size. On "your name" (37.32) the camera pulls out wide and every `you` lights at once. On "not mine" (38.24)
   `lines by you 8 · lines by me 0` lands at display scale.

5. **05-branch (27.57–31.14).** It opens on a hairline across a black void with "then i" at ~4 cqw (28.0 s). The
   hidden branch is a thin grey curve, and motion p90 is 0.34 in a verse groove (the second-weakest in the audit).
   **Fix:** match-cut from 04. The kebab-case `feature/nothing-on-the-side` drops down out of 04 and becomes the
   curve's label. The camera then tracks left to right along `main` as `git branch -a` scrolls, and dives down the
   curve with "branch" at 28.98. On "hide" (30.81) the whole curve lights in the accent, end to end.

6. **13-timeline (63.68–68.69); 26-timeline2 has the same problem.** The tilted lockup holds identical frames from
   64.9 to 67.9 (13 rows 2–3) at drums 0.45 (p90 0.73). The `Fast-forward` joke is small mono text.
   **Fix:** move the line, not the type. The graph scrolls right to left at a beat-locked speed, with a new commit dot
   passing under "timeline" on each kick. On "goodbyes" (68.04) `Fast-forward` prints at h2, and the camera does a
   literal fast-forward: a 0.3 s whip along the line, with motion blur, into 14.

7. **19-cherry (92.09–100.04).** The contribution grid is good, but it sits mid-grey in the upper half. The three
   picked days are ~1 % squares with tiny commit cards (94 s), and the "out of my tree" fall reads as dust (98.5 s).
   p90 is 1.13 at drums 0.45.
   **Fix:** set the grid at full width. On "three" (95.10) the camera punches in on the three accent squares one per
   beat, and each opens its commit card at h3 (`first date`, `that sunday`, `the beach`). On "rebased" (96.16) the
   other 1,092 squares fall off the frame bottom with gravity on the kick, motion-blurred, leaving the three cards
   drawn as a new three-dot graph.

8. **02–04, verse 1 (15.08–27.57).** Three neighbours stack the lyric top left (02 3.x, 03 2.x, 04 2.x), and each
   opens on an empty frame: 02 is cursor only from 15.08 to 15.6, and 04 holds "said it's just" alone on black for
   1.5 s.
   **Fix:** vary the position and carry the objects across the cuts.
   - **03:** set the lyric as the stash row itself, centred at display scale: `stash@{3 years ago}: On main: me`,
     with `me` in the accent.
   - **04:** set the kebab branch name full-bleed along the bottom edge.
   - **Cuts:** 02's last line, `Aborting commit due to empty commit message.`, scrolls up as 03's prompt types
     `git stash list`. The cut becomes a terminal scroll instead of a reset.

9. **07-merge (38.72–46.55).** The idea lands and the type reads (44 s), but the page sits still for 7.8 s
   (p90 0.66 at drums 0.36). The storyboard's slam on `>>>>>>> you` (45.42) arrives as an h3 print (07 5.5).
   **Fix:** a slow camera drift down the file through the scene. On 45.42 `>>>>>>> you` stamps in at display scale
   (≥ 11 cqw, accent, slight rotation like a rubber stamp) with one physical paper jolt.

10. **37-end (197.43–209.64).** The 30-day countdown is the film's best reason to watch to the end. The bookend poster
    appears at ~206.7, though, and "push" only at ~208.2, leaving 1.4 s of finished end card. YouTube's end screen
    needs 5–20 s, and from 204 to 206.7 the big `0` sits on the right third, where the cards go (206 s).
    **Fix:** count two days per kick from 20 so `0` lands near 202 and `git gc` clears by 203.5. Put the poster up by
    203.5 for ~6 s of end card, and dim the poster's right-hand git log to a faint texture so two video cards and the
    subscribe button can sit over it.

Also in the table: 14-local's "tiny stale clone" is a grey box whose text can't be read (70.5 s). Draw it as a real
miniature terminal with `behind by 1095` legible at h3.

## 4. Film-level fixes

1. **Cut on objects, not onto empty prompts.** Of 100 hard cuts, most land on a near-empty terminal: a cursor and
   one word, sometimes for 1–1.8 s (02, 03, 04, 05, 06, 08, 13, 14, 22, 36). That accounts for the low median
   motion and the "verse restarts" feel. Fix it in both verses first (02–08, 17–22).
   - **Carry the screen across.** The last output line of a scene scrolls up and becomes the next scene's prompt, as
     a real terminal does, or the scene's object turns into the next (04's branch name → 05's curve; 13's line → 14's
     clone).
   - **Use any lead-in before the first sung word** for that carry-over move. Never a bare cursor.
   - **Each verse cut gets a velocity move** (scroll, whip or punch) with motion blur, as 09 → 10 already does with
     its Enter.

2. **Make the hook a poster, and keep it lit through the first 15 s.** The thumbnail frame works (0 s), but the
   film then gives the viewer 3 s of near-black (1.6–4.8). The chorus hook `FORCE PUSH!` never spans the frame until
   the drop: ~55 % width at 10, 12 and 23 (54.5 s). Rework 01 as in item 2 above: the poster stays lit through 4.74,
   "nothing to commit." goes display size, and the full-width graph and lockup land on 15.08. Set `FORCE PUSH!` at
   ≥ 85 cqw for the first bar of 10 and 23, the way 33 does (33 1.1–1.4), then let it settle into the corner layout.

3. **Make the pacing curve climb: an escalated chorus 2 and a real build into the drop.** Today the curve is flat
   from chorus 1 to chorus 2 (same frames, same motion despite louder drums), and the bridge runs ~25 s of low motion
   (144–169) ending in a frozen 7 s (32), so the drop has nothing to rise from.
   - **Chorus 2 (23–28):** apply item 3's per-scene escalations, and make them brighter. Put more frame area on lit
     accent: the strike-throughs, the overwrite stroke, the collapsing row. Use the brightness the report says is
     missing (44 % of seconds have no accent; mid-tone seconds are 9 % against 28–33 %).
   - **32:** give it the push-in and the keystroke wind-up (item 1), so 167.4–169.27 is the fastest-rising bar
     before the film's peak.
