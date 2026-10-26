# Review: force-push draft 2 (`renders/video.mp4`)

Independent review, pipeline step B (docs/REVIEW.md). Sources:

- the 37 strips in `strips/` and step A's `report.md`;
- 0.5 s at 30 fps around all 36 scene switches and the drops (53.38, 114.12, 169.27);
- 5 fps sheets of the three "brand new timeline," holds (64.6–68.0, 125.2–128.8, 172.2–177.2);
- single frames at 0, 35.8, 95.25, 99.2, 100.6, 105.9, 164.5, 168.6, 172.6, 188.9, 189.7, 206.0.

Strip frames are cited as `scene row.col`. Row 1 is the cut-in. From row 2 on, a frame sits at
`span start + ((row−2)·6 + col−1) · 0.25 s`. Video seconds are track seconds.

## 1. Verdict

This draft is near the references on the measured figures: median motion 0.99, 85 % of seconds change
composition, true black 21 %, light seconds 16 %, no still runs, and unseen hits down to 13 (draft 1 had 29). It is a
YouTube-ready lyric video with one look, and the round-2 cut-ins now land on content.

The biggest weakness is the drop's second half. At 172.38–172.9 the frame dips to near-black with a small "brand"
top left (33 4.1–4.3, frame 172.6). After "goodbyes" (175.2–177.1) the lockup settles while the lane scrolls. The
held "timeline," in 13 and 26 still keeps one pose for its first two bars. So the film's peak still sags in the
middle.

The best thing to keep is the hook system: the motion-blurred `FORCE` whips at 53.38, 114.12 and 169.27 and the chant
slams. Keep the transitions that now carry an object across the cut too: the lockup becoming 02's title bar (15.08),
the stash row lit from 03's first frame (19.89), and 35's `me` log carried into 36 (191.9).

## 2. Scene table

Scores 1–5; 3 = fine for YouTube. The last column gives the lowest score's reason.

| scene | idea | motion | trans | legib | colour | craft | variety | lowest score's reason |
|---|---|---|---|---|---|---|---|---|
| 01-status | 4 | 3 | 4 | 4 | 3 | 4 | 4 | 9.0–9.75 is a sparse prompt, an axis and a `0`; the poster dims on "Git" (1.5) as it should |
| 02-commit | 4 | 3 | 4 | 4 | 3 | 3 | 3 | the editor is grey on black (highlight 53); "three" and "commit" carry it |
| 03-stash | 4 | 3 | 4 | 4 | 3 | 3 | 3 | none below 3; lands on the lit stash row (19.89) |
| 04-feature | 4 | 3 | 4 | 4 | 3 | 3 | 4 | the exit dips to three near-black frames (27.49–27.56) |
| 05-branch | 4 | 4 | 3 | 4 | 4 | 4 | 4 | enters through those black frames before the branch name slides in |
| 06-blame | 4 | 3 | 3 | 3 | 3 | 3 | 3 | "every single" sits mid-left at lead size, with the right half empty (35.8) |
| 07-merge | 4 | 3 | 3 | 4 | 4 | 4 | 4 | none below 3 |
| 08-patches | 4 | 4 | 3 | 4 | 3 | 3 | 3 | none below 3 |
| 09-stop | 4 | 3 | 4 | 4 | 3 | 3 | 3 | none below 3 |
| 10-force | 4 | 4 | 4 | 4 | 4 | 4 | 4 | none below 3; a brown edge leak at the left, 53.4–55 |
| 11-rewrote | 3 | 3 | 3 | 4 | 3 | 3 | 3 | the hash column is small mono in a left panel; the rewrite reads only as accent flicker |
| 12-lies | 4 | 4 | 4 | 4 | 4 | 4 | 3 | a flat ring on "lies" (62.7, 12 3.3) |
| 13-timeline | 3 | 3 | 3 | 4 | 3 | 3 | 4 | the type keeps one pose 64.6–67.0 with small drift; the big tilt comes only on the third bar |
| 14-local | 4 | 3 | 4 | 4 | 3 | 3 | 3 | none below 3; the clone terminal is lit and readable (68.7) |
| 15-origin | 4 | 3 | 3 | 4 | 4 | 3 | 4 | none below 3 |
| 16-chant | 4 | 4 | 4 | 4 | 4 | 4 | 4 | none below 3 |
| 17-squash | 4 | 3 | **2** | 3 | 3 | 3 | 4 | a plain hard cut onto a soft grey pick list, which holds 1.2 s (83.48–84.67) |
| 18-message | 4 | 3 | 3 | 4 | 4 | 3 | 4 | none below 3 |
| 19-cherry | 4 | 4 | 3 | 4 | 3 | 4 | 3 | the lyric stays bottom centre for all 8 s; "three" and "tree" are ~6.5cqw, under display scale |
| 20-phone | 4 | 3 | 3 | 4 | 3 | 3 | 4 | a plain cut from "tree" onto a dim lock screen (100.04) |
| 21-ignore | 4 | 3 | 3 | 4 | 3 | 3 | 3 | none below 3 |
| 22-revert | 4 | 3 | 3 | 4 | 3 | 3 | 3 | 08's layout again, as planned |
| 23-force2 | 3 | 4 | 4 | 4 | 4 | 4 | 3 | identical to 10 until 116.2; the change is the struck rows in mono in the side panel |
| 24-rewrote2 | 4 | 3 | 3 | 4 | 3 | 3 | 3 | none below 3; `2b7d4e8 Revert "force push"` now drops at h2 size on "you" (120.0, 24 4.6) |
| 25-lies2 | 3 | 4 | 4 | 4 | 4 | 4 | 3 | 12 again, with verse 2's lies |
| 26-timeline2 | 4 | 3 | 3 | 4 | 3 | 3 | 3 | the type holds as in 13; `git remote remove you` is now big and readable under it |
| 27-local2 | 3 | 3 | 4 | 4 | 3 | 3 | 3 | the same frame as 14; the change is mono (`by 2 commits`, `(still.)`) |
| 28-origin2 | 3 | 3 | 3 | 4 | 4 | 3 | 3 | 15 again; the empty row collapses on "there" (135.65) |
| 29-chant2 | 4 | 4 | 4 | 4 | 4 | 4 | 3 | a flat ring on "history" (143.0) |
| 30-shared | 4 | 3 | 3 | 4 | 3 | 4 | 4 | the calm breath it should be |
| 31-checkout | 4 | 3 | 4 | 4 | 3 | 4 | 4 | none below 3; the flip on "go" now keeps moving (159.2–160.7) |
| 32-acappella | 4 | 3 | 3 | 3 | 3 | 3 | 4 | the push-in crops the line starts off the left edge (168.2–169.2: "rce push", "wrote the past") |
| 33-drop | 4 | 3 | 4 | 4 | 4 | 4 | 3 | a near-black dip with a small "brand" at 172.38–172.9 |
| 34-dropmine | 4 | 4 | 4 | 4 | 4 | 4 | 3 | none below 3; lands on a lit `git remote -v` (177.15) |
| 35-chant3 | 4 | 4 | 4 | 3 | 4 | 3 | 3 | crowd rows sit behind "hear the crowd" at near-lyric size; a flat white ring (189.7) |
| 36-reflog | 4 | 3 | 4 | 4 | 3 | 3 | 4 | none below 3 |
| 37-end | 4 | 3 | 3 | 4 | 3 | 4 | 4 | NEAD is still only in the 8 px header strip (206.0) |

Only 17 scores below 3. Chorus 2's reruns (23, 25, 27, 28) score 3 on variety. Against their neighbours they look
different, and the brief kept them on purpose (REFINE-2, "Not taken"). Their world changes are still mostly mono.

## 3. The weakest scenes, ranked

1. **33-drop, 172.38–177.15.**
   - Round 2 put the lane in: perspective commits, a moving camera, `(forced update)` and the cream flash on
     "goodbyes" (174.94).
   - But the switch from "your lies" to the lane passes through a near-black frame. It holds a small "brand" top
     left and a thin line for ~0.5 s (frame 172.6; 33 4.1–4.3). This is the middle of the biggest drop.
   - From 175.2 to 177.1 the lockup settles while the lane scrolls (sheet rows 4–5).

   **Fix:** carry the cream `your lies` bar into the lane. It tilts down into perspective and becomes the lane's first
   commit, so the camera is already flying along the lane on 172.38. "brand" lands at h2 size on the nearest dot. On
   the held "goodbyes", pass one commit under the camera per kick, and dolly faster each bar into the whip at 177.15.

2. **13-timeline / 26-timeline2, the first two held bars (64.6–67.0, 125.3–127.8).**
   - REFINE-2's moves are there: `Fast-forward` on "no" (67.82), a whip on "goodbyes", and in 26
     `git remote remove you` striking the remote branch at a readable size.
   - But the big type keeps one pose for ~2.4 s with small drift (5 fps sheets: 13 rows 1–2, 26 rows 1–2). The one
     big move, a tilt and zoom up the line, comes only on the third bar (67.0 / 127.8).
   - The report still lists 13 and 26 among the weakest (p90 5.05 and 6.21 at drums 0.45 and 0.53).

   **Fix:** spread the move over the three bars:
   - bar 1: a push 1.0 → 1.08 toward the line's head;
   - bar 2: a slide along the line, with the next dot passing under "timeline,";
   - bar 3: the existing tilt.

   In 26, do it bigger, as the brief asked.

3. **Flat shock rings on the hooks (visual-guidelines rule 9, a firm rule).**
   - Thin rings expand over the type at 12 and 25 "lies" (62.7, 123.5), on 29's "history" (143.0), and across
     `FORCE` in 33 (169.3–170.5, 33 1.3–2.2).
   - The white ring at 189.7 in 35 is the clearest case (frame 189.7).
   - The rule names flat shock rings as an abstract effect laid on an object.

   **Fix:** let the object carry the hit. The commit dot under the word flares, the word recoils on its baseline, or
   the struck row snaps shut. The line-head ring on 13's graph dot is an object, so it can stay.

4. **17-squash opening (83.48–84.67).**
   - The cut from 16's `me` log is the film's one plain hard cut onto a soft, grey pick list (17 1.1–2.1).
   - It holds 1.2 s before "squashed" (84.67).
   - It is a breath in the vocal, but the picture has no event.

   **Fix:** open on the substitution. `:2,$s/^pick/squash/` is already typed, and on 83.48 Enter sends a wave down
   the list, turning `pick` into `squash` one row per eighth in the accent. The camera rides the wave down, so the list
   is moving and lit before the word lands.

5. **32-acappella, 160.73 and 168.2–169.2.**
   - Fixed since draft 1: no fade to a bare prompt, the serif line at ~5cqw (frame 164.5), and the build into the
     drop.
   - At 160.73 the match from 31 holds a static frame for ~0.8 s ("so no lease… here I go", 32 1.1–2.2), and the
     report lists 160.73 as an unseen hit.
   - The line sits right of centre (164.5), so the closing push-in crops the start of both lines off the left edge
     while they are sung (frame 168.6: "rce push", "wrote the past").

   **Fix:**
   - Centre the two serif lines, and push toward "history." so no sung word leaves the frame.
   - On 160.73 let the prompt's cursor fire one keystroke flash, the hit on the match.

6. **19-cherry, lyric position and scale (92.09–100.04).**
   - Fixed since draft 1: the lines are ≥ 3.75cqw (95.25, 99.2), the scene opens on a lit grid, the card close-ups
     read, and the squares fall. No unseen hits are left here.
   - But the lyric sits bottom centre for 8 s.
   - "three" and "tree" are ~6.5cqw beside the line, not display words.

   **Fix:** on 95.10 "three" jumps to 11cqw beside the three cards, top right. "rebased the rest right out of my"
   rides the falling squares down, and "tree" lands at display size over the three-dot graph on 99.08.

7. **37-end, the artist name and the small text.** The bookend works: the countdown ticks, `0` lands at ~202.4, and
   the poster is complete by 203.4 and holds ~6.2 s. The right ~40 % holds only a faint log, so there is room for the
   end-screen cards. But NEAD is still only in the header strip (frame 206.0), and the `hint:` lines under the prompt
   are near-invisible. **Fix:** set `NEAD` under the prompt at label size, as the 14.3 lockup does. Raise the two
   hint lines to `--cream-muted` so the joke (`Updates were rejected…`) rewards a pause.

8. **27-local2, the rerun of 14.** The cut-in is fixed (129.34 lands on the lit clone with `behind 'origin/main' by 2
   commits`). Otherwise it is 14's frame (strip 27 against 14), and the world change is mono. **Fix:** show their
   clone at half 14's size from the first frame. On "care" (131.94) it slides off the left edge, leaving the `(still.)`
   aside alone.

9. **Black frames at cuts.** Two to four near-black frames sit between whip-out and cut-in at:
   - 27.49–27.56 (04 → 05);
   - 72.39–72.42 (14 → 15);
   - 88.17–88.20 (17 → 18);
   - 92.04–92.07 (18 → 19);
   - 124.5 (25 → 26);
   - 133.1 (27 → 28).

   At 30 fps they read as a blink. They are not a defect, but they cut against REFINE-1's "first frame mid-whip on
   content". **Fix:** start each incoming whip at −0.1 s (the kit's `start: -0.1`), so the outgoing blur and the
   incoming blur overlap.

10. **20-phone's cut-in (100.04).** The phone is fixed: it fills the frame height, and by 100.6 it is ~58 % wide with
    the lyric at lead size. The cut from "tree" is still plain, onto a dim grey lock screen. **Fix:** match on the
    object. 19's three lit cards fall into the phone as its first three notifications (`you opened #53…`).

## 4. Film-level fixes

1. **Make the drop continuous and the holds move, so the peak reads as the peak.**
   - **Where:** 172.38 (33's dark dip), 175.2–177.1, and 13 and 26's first two bars (items 1 and 2).
   - **Why:** the report now puts 33 and 35 at the top of the brightness and motion figures (33: luma 0.23,
     highlight 217; 35: guideline motion 11.38, the film's highest). A viewer still sees the drop blink to black
     and then settle.
   - **Effect:** the curve 10 → 23 → 33 holds all the way through.

2. **Replace the flat rings with object hits, and close the blink at cuts.**
   - **Rings:** 62.7, 123.5, 143.0, 169.3–170.5 and 189.7 (item 3). This one is a rule, not a signal.
   - **Blinks:** the black frames in item 9, plus the two plain cuts at 83.48 and 100.04 (items 4 and 10).
   - **Effect:** every cut lands on content, and every hit is the world's own object.

3. **Let the small-text layer reward a pause.**
   - **The problem:** the deadpan layer is often `--cream-hint` and defocused, so it does not survive a screenshot:
     - the `hint:` lines at 0 and 206;
     - 06's dates beside the gutter (35.8);
     - the soft clone terminals at 70–71 and 130–131;
     - 37's right-side log.
   - **The fix:** raise the joke-carrying lines to `--cream-muted` and keep them in focus while the lyric holds. Add
     `NEAD` to the end card (item 7).

   The ground stays black.

## Draft 1's weak scenes: fixed or not

| draft 1 item | status in draft 2 |
|---|---|
| 1. Timeline lockup 13 / 26 / 33 | **Partly.** `Fast-forward` on "no", whips out, 26's `git remote remove you` readable, 33 rides a moving lane. Still: the first two bars of 13/26 hold one pose (64.6–67.0, 125.3–127.8); 33 dips dark at 172.4–172.9 and settles 175.2–177.1. |
| 2. 19-cherry | **Fixed.** Lines ≥ 3.75cqw (95.25), opens on a lit grid with "cherry-picked" at 92.15, squares fall on the rebase, no unseen hits left in 92–100. "three" and "tree" are ~6.5cqw, not display. |
| 3. Chorus 2 reruns | **Not taken, by decision.** 24's Revert row now drops at h2 size on "you" (120.0). 23, 27 and 28 are as before. |
| 4. 03 / 04 cut-ins | **Fixed.** 19.89 lands on the lit stash row; 23.70 lands mid-whip on `git branch` with `git switch` typing. |
| 5. 14 / 27 / 34 cut-ins | **Fixed.** All three land on a lit terminal (68.69, 129.34, 177.15); 14's clone is readable at h3 (`have 1095 and 1 different commits`). |
| 6. 20-phone | **Fixed.** The phone fills the frame height, notifications stack per hat, and the lyric is at lead size inside it (100.6). |
| 7. 31 → 32 | **Fixed** (no hold on "here I go", no fade to a bare prompt, serif ~5cqw). **New:** the left-edge crop at 168.2–169.2, and the static match at 160.73. |
| 8. 02-commit | **Fixed.** 01's lockup shrinks into the editor's title bar (15.08–15.4). |
| 9. 35-chant3 | **Fixed.** The `Everything up-to-date` crowd fills the frame by 189.6, and the final log puts `me` in the accent at a bigger size. The rows now crowd the lyric a little (189.7). |
| 10. 11 / 24 hash column | **Unchanged in 11**; 24 improved through the Revert row. |
| Cuts landing mid-whip on content | **Confirmed** at 15.08, 19.89, 23.70, 68.69, 129.34 and 177.15. At 63.68 it lands on the dim graph line with its labels for ~0.2 s before "brand" (63.88). That beats draft 1's near-black, but the frame is still dim. |
| 34's "origin's me" | It reads as the stash row (`On main: me`) above "origin's" until "mine" lands at 181.78. No lyric error. |
| The end card | Poster up by 203.4, right ~40 % calm. NEAD is still only in the header. |

## The two flagged metrics

- **Detail (edge density 0.06 against 0.07–0.09): a reason, mostly not a problem.**
  - **What the frames show:** big type on an empty near-black ground. The secondary layers are deliberately dim and
    defocused: 06's gutter (35.8), the clone terminals (70.5, 130.5), the phone screen (100.6), the poster's log
    (0, 206). Heavy motion blur on the whips (every cut tile) also lowers the figure.
  - **Do not add texture to move it.**
  - **The one real part:** the deadpan text is too dim and soft to read when paused (film-level fix 3). Fixing that
    raises the figure honestly.
- **Accent area (median 4 % against 3 %): a reason, not a problem.**
  - **The cause is design:** hero words are set in fire at display scale.
    - the poster's `push` (~12 % of the frame at 0–1.5 and 202.9–209.6);
    - "timeline," (64–68, 125–129, 172–175);
    - "local" (177.7–179.3);
    - "mine" (181.8–184.5);
    - `PUSH!`, "patches,", "care".
  - **Also:** the orange highlighter blocks on cream (07's "merge," and "conflict,", 18's `1095 deletions(-)`, 15's
    struck-row bar at 74.5–75) and the finish layer's warm edge leak (10 at 53.4–55, 23 at 114.2–115.5, 37 at
    197.4–200).
  - **Verdict:** the accent still points at the sung word everywhere I looked.
  - **Two moments to watch:**
    - 15's full-width orange bar over the collaborator row (74.5–75) is close to a ground;
    - the left-edge leak reads as a brown smear at phone size (37 1.1–2.6).

## Hook and ending

- **t = 0:** the `force push` poster (bone + fire, the prompt under it, the graph at right) reads at 168×94. It is the
  thumbnail and matches the end card. It holds ~1.5 s, then dims as `git status.` types on "Git" (1.56).
- **First 15 s:**
  - "nothing to commit." lands as display type on 4.74, and the serif aside follows at 7.4.
  - The pad draws three years of graph while the counter climbs to 1,095, and the lockup settles at ~14.3.
  - The thinnest moment is 9.0–9.75: a prompt typing `git`, the axis and a `0`.
- **Pacing:**
  - Light seconds come from cream at 07, 15, 18, 28, 30 and 31, with the first in verse 1.
  - The chorus 1 → 2 → drop → final chant climb now shows in the figures (35 is the film's most moving scene).
  - It dips visibly only at 172.4–172.9.
- **Ending:**
  - The countdown, `git gc` and the bookend poster give a reason to stay.
  - There is room for two cards and the subscribe button on the right ~40 % from 203.4 to 209.6.

## Check by ear

- **1.56:** does the poster dim on "Git"?
- **27.49–27.57:** the black blink into 05.
- **28.54:** unseen hit in 05.
- **46.61:** unseen hit just after the cut into 08.
- **50.28–52.15:** "been" and "detached" land at ~50.30 (unseen hits 50.28 / 50.31). Also 52.15, the beat after
  "Stop". "stop," slams at ~51.92, 0.05 s before its word: check it does not read early.
- **53.38:** Enter into `FORCE`.
- **63.68–63.88:** the cut and "Brand".
- **81.64:** unseen hit in 16's tail.
- **83.48:** the hard cut into 17.
- **92.15, 95.10, 99.08:** "cherry-picked", "three", "tree".
- **100.04:** the cut into the phone.
- **122.59:** unseen hit in 25.
- **135.44:** unseen hit just before "there".
- **142.32:** unseen hit in 29's tail.
- **147.86, 149.7:** unseen hits in the bridge.
- **160.73:** the static match into the a cappella (unseen hit).
- **161.91:** the first a cappella word.
- **167.4–169.27:** do the keystrokes of `origin main` sit on the eighths?
- **169.27:** the drop.
- **172.38:** the dark dip on "Brand".
- **174.94:** the cream flash on "goodbyes".
- **181.78:** "mine".
- **189.57:** "crowd" and the ring.
- **193.79:** unseen hit in 36.
- **197.43–202.4:** do the countdown ticks hit the kicks?
- **~202.9:** the poster lands.
- **~208.3:** the final hard hit on the end card.
