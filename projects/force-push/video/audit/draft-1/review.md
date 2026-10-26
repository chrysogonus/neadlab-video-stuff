# Review: force-push draft 1 (`renders/video.mp4`)

Independent review, pipeline step B (docs/REVIEW.md). Sources:

- the 37 strips in `strips/` and step A's `report.md`;
- 0.5 s at 30 fps around all 36 scene switches;
- native 60 fps frames at the cuts 60.78, 63.68, 68.69, 117.16, 121.53, 129.34 and 177.15;
- single frames at 0–14.5, 202.5–209.6 and at hero-word starts (25.18, 45.42, 95.10, 112.42, 116.39, 181.78).

Strip frames are cited as `scene row.col`. Row 1 is the cut-in. From row 2 on, a frame sits at
`span start + ((row−2)·6 + col−1) · 0.25 s`. Video seconds = track seconds. The v1 numbers are `audit/v1b`.

## 1. Verdict

This draft is close to the references on the measured figures: median motion 0.93 (v1 0.31), true black 22 %
(v1 69 %), no still runs, unseen hits down from 54 to 29. The chorus hook now lands as a full-frame poster with
motion-blurred slams. It would hold up on YouTube.

The biggest weakness is that several scenes still go flat:

- the "brand new timeline" lockup freezes for 3–4 s each time it plays: 13, 26, and the drop's second half
  at 172.4–177.1;
- the cuts whip out well but too often land on a near-empty dim terminal with one small word (19.89, 23.70,
  68.69, 129.34, 177.15).

So the film's peak, 169.27–177.15, is bright for one bar and then sits still. The best things to keep are the
hook slams: 10's `FORCE` across the whole frame at 53.4, 12's and 25's whip-in on `FORCE` over the lies panel,
and 33's first bar. Also keep 05's kebab branch name, carried from 04 onto the hidden curve.

## 2. Scene table

Scores 1–5; 3 = fine for YouTube. The last column gives the reason for the row's lowest score.

| scene | idea | motion | trans | legib | colour | craft | variety | lowest score's reason |
|---|---|---|---|---|---|---|---|---|
| 01-status | 4 | 3 | 3 | 4 | 3 | 3 | 4 | none below 3; 9.0–9.4 is a bare prompt and a `0` in the pad, and the graph is a thin line in mid-frame |
| 02-commit | 4 | 3 | 2 | 4 | 2 | 3 | 3 | opens on `git commit` alone, small, for 0.5 s (15.08–15.6); grey editor on black (highlight 53) |
| 03-stash | 3 | 3 | 2 | 3 | 2 | 3 | 3 | 1.4 s of a cursor and a small "hid" on black (19.9–21.3) before "stash" lands; highlight 46 |
| 04-feature | 4 | 3 | 2 | 4 | 3 | 3 | 4 | an orange cursor block and a small "said" for 1.4 s (23.7–25.1) |
| 05-branch | 4 | 4 | 4 | 4 | 4 | 4 | 4 | none below 3; the kebab name carries over from 04 and becomes the curve's label |
| 06-blame | 4 | 3 | 3 | 3 | 3 | 3 | 3 | none below 3; "every single one had" sits at ~2.5 cqw beside the gutter (34.6–36.4) |
| 07-merge | 4 | 3 | 3 | 4 | 4 | 4 | 4 | none below 3; the `>>>>>>> you` stamp lands on 45.42 |
| 08-patches | 4 | 3 | 3 | 4 | 3 | 3 | 3 | none below 3 |
| 09-stop | 4 | 3 | 4 | 4 | 3 | 3 | 3 | none below 3 |
| 10-force | 4 | 4 | 4 | 4 | 4 | 4 | 4 | none below 3 |
| 11-rewrote | 3 | 3 | 3 | 4 | 3 | 3 | 3 | none below 3; the hash wave is small mono in a left panel |
| 12-lies | 4 | 4 | 4 | 4 | 4 | 4 | 3 | none below 3 |
| 13-timeline | 3 | 2 | 2 | 4 | 3 | 3 | 4 | the lockup holds 64.9–67.8 (13 3.1 → 4.6) at drums 0.45; cuts in on a near-black frame with a dot (63.68–63.85) |
| 14-local | 3 | 3 | 2 | 4 | 3 | 3 | 3 | lands on a dim, empty terminal (68.69–69.2); their clone is still an unreadable box bottom left (70.5) |
| 15-origin | 4 | 3 | 3 | 4 | 4 | 3 | 4 | none below 3; row 2 `you` is struck in the accent and removed on "not there" |
| 16-chant | 4 | 4 | 4 | 4 | 4 | 4 | 4 | none below 3 |
| 17-squash | 4 | 3 | 3 | 3 | 3 | 3 | 4 | none below 3; 1.2 s of dim pick list before "squashed" |
| 18-message | 4 | 3 | 3 | 4 | 4 | 3 | 4 | none below 3 |
| 19-cherry | 4 | 3 | 2 | 2 | 3 | 3 | 4 | "the good days, there were three" and "the rest right out of my tree" are ~2.3 cqw (95.3, 99.2); opens on an empty dim grid (92.09–92.5) |
| 20-phone | 4 | 3 | 3 | 3 | 2 | 3 | 4 | a grey phone ~25 % wide in a black void, with the lyric inside it (100.0–101.4) |
| 21-ignore | 4 | 3 | 3 | 3 | 3 | 3 | 3 | none below 3 |
| 22-revert | 4 | 3 | 3 | 4 | 3 | 3 | 3 | none below 3 |
| 23-force2 | 3 | 4 | 4 | 4 | 4 | 4 | 2 | reads as 10 again; the change (struck `you` rows, `9c0ffee`) is mono in a side panel (116.4) |
| 24-rewrote2 | 3 | 3 | 3 | 4 | 3 | 3 | 2 | a rerun of 11 |
| 25-lies2 | 3 | 4 | 4 | 4 | 4 | 4 | 2 | a rerun of 12; `Revert "force push"` is the only new lie |
| 26-timeline2 | 3 | 2 | 2 | 4 | 3 | 3 | 2 | the lockup freezes as in 13 (125.3–128.5); `git remote remove you` is mono under it |
| 27-local2 | 2 | 3 | 2 | 4 | 3 | 3 | 2 | 14 again: lands on an empty terminal (129.34–129.45); the clone box and `behind ... by 2 commits` are tiny |
| 28-origin2 | 3 | 3 | 3 | 4 | 4 | 3 | 2 | 15 again; row 2 is already gone at frame 1, so nothing happens on "not there" |
| 29-chant2 | 4 | 4 | 4 | 4 | 4 | 4 | 3 | none below 3; the blame payoff (`me` gutter) reads at 143.5 |
| 30-shared | 4 | 3 | 3 | 3 | 3 | 4 | 4 | none below 3 |
| 31-checkout | 4 | 2 | 4 | 4 | 3 | 3 | 4 | "here i go" holds almost still from 158.5 to 160.7 (31 last 9 frames) |
| 32-acappella | 3 | 3 | 3 | 3 | 2 | 3 | 4 | luma 0.08, highlight 45; 161.0–161.8 fades to near-black before "Force" |
| 33-drop | 4 | 3 | 4 | 4 | 4 | 4 | 3 | none below 3; but 172.4–177.1 is 13's lockup again and holds |
| 34-dropmine | 4 | 3 | 2 | 4 | 4 | 3 | 3 | lands on a dim, empty `git remote -v` frame with a brown leak (177.15–177.7) |
| 35-chant3 | 3 | 4 | 4 | 4 | 4 | 4 | 2 | the same as 16 and 29; the crowd of `Everything up-to-date` is not visibly bigger |
| 36-reflog | 4 | 3 | 4 | 4 | 3 | 3 | 4 | none below 3; it carries 35's log across the cut |
| 37-end | 4 | 3 | 4 | 4 | 3 | 4 | 4 | none below 3; NEAD appears only in the tiny header strip |

## 3. The weakest scenes, ranked

1. **The timeline lockup, three times: 13 (63.68–68.69), 26 (124.58–129.34), 33's second half (172.4–177.15).**
   - The tilted "brand new timeline," holds near-identical frames for 3–4 s each time: 13 3.1 → 4.6, 26
     rows 3–4, 33 rows 4–6.
   - This happens under drums of 0.45–0.54. 13 and 26 are the report's two weakest scenes (p90 3.36 and 4.26).
   - In 33 it eats the second half of the film's biggest drop.
   - Only the cut-out whip is new since v1.

   **Fix:** let the graph line run. It scrolls right to left at one commit dot per kick, and each dot passes
   under the lyric and labels itself with a new hash. On "no" (67.82 / 128.54 / 174.36), git prints
   `Fast-forward` at h2. On "goodbyes" the camera fast-forwards: a 0.3 s blurred dolly along the line that
   becomes the cut. In 26, `remotes/you/feature/nothing-on-the-side` rides the line as a branch dot and is
   snipped off on "goodbyes". In 33, double the scroll speed and leave the cream flash on the "goodbyes" hit.

2. **19-cherry (92.09–100.04).**
   - The image works: three accent squares become cards, the rest fall (95.3, 97.6).
   - The sung lines are ~2.3 cqw under 72 px (95.3, 99.2), and "three" (95.10) and "tree" (99.08) are accents
     inside that small line rather than display words.
   - The scene opens on an empty dim grid (92.09–92.5), and the report's unseen hits cluster here: 92.24,
     92.69, 93.17, 94.09, 98.22–99.59.

   **Fix:**
   - Set "cherry-picked" at display scale from the first frame, with the grid already lit behind it.
   - Fill one square per kick from 92.24 to 94.09.
   - Put "three" at 11 cqw beside the three cards on 95.10.
   - On 98.38 ("out"), drop the other squares with gravity and motion blur, so the hits 98.22–99.59 each move
     something.
   - Set "tree" as the display word over the remaining three-dot graph on 99.08.

3. **Chorus 2 (23–28, 114.12–136.79): it plays as a rerun.**
   - Drums are higher than in chorus 1, and 23 is faster (p90 17.42 against 14.44).
   - The world's changes sit in side panels in mono: the struck `you` rows (116.4), `9c0ffee`, `Revert "force
     push"`, `behind 'origin/main' by 2 commits`.
   - 28 shows the collaborator row already gone at 133.15, so "not there" has no event.

   **Fix:** one poster-scale change per scene.
   - **23:** on "history" (116.39) the struck rows are struck by a full-width accent bar across the frame.
   - **24:** `Revert "force push"` is the dropped row, set at h2, and it falls out of the list on "you" (120.04).
   - **27:** their clone box is half of 14's size and slides off the left edge on "care" (131.94).
   - **28:** start with row 2 present, and collapse it shut on "there" (135.64).

4. **Verse 1 cut-ins: 03 (19.885) and 04 (23.696).**
   - The whips out of 02 and 03 are fine.
   - The cut-in lands on a cursor block and one small word for 1.4 s each: "hid" small on black (19.9–21.3),
     an orange block and "said" (23.7–25.1). That is a small prop in a black void (rule 5), and the unseen hit
     at 23.9 falls inside it.

   **Fix:** carry the object across.
   - **02 → 03:** 02's `Aborting commit due to empty commit message.` scrolls up as 03's prompt types
     `git stash list --date=relative`, and the stash row `stash@{3 years ago}: On main: me` is on screen from
     the first frame, dim, until "stash" lights it.
   - **03 → 04:** `you@laptop` types `git switch -c` from frame 1, and "said it's just a" sits at lyric size,
     not as a lead-in word.

5. **The local-copy set: 14 (68.69), 27 (129.34), 34 (177.15).**
   - All three cuts land on a dim terminal with two lines of mono and an empty frame for 0.5–0.6 s, confirmed at
     60 fps.
   - The "tiny stale clone" is still an unreadable box bottom left (70.5; v1 found the same).

   **Fix:** open on the clone itself. A miniature terminal at ~20 % of the frame shows
   `Your branch and 'origin/main' have diverged, and have 1095 and 1 different commits each` at a readable
   h3. "keep your" types beside it, and on "local" (69.24) the camera pulls back so it shrinks into the corner
   as "local" lands. In 34, the stash bar is the opening object instead.

6. **20-phone (100.04–103.47).** A grey phone ~25 % of the frame wide sits in a black void, with the lyric
   inside it at small size (100.1–101.4). The unseen hits 100.14 (pre-word) and 101.88/101.91 fall here.
   **Fix:**
   - Start tight on the lock screen, so the notifications fill two thirds of the frame.
   - Stack one PR notification per hat from `you`, with "pull" lit in the accent.
   - Make "phone" (101.40) a kick-sized buzz of the whole stack.
   - Cut the camera onto the PR's `Reviewers: none` on 101.88.

7. **31 → 32, the bridge into the a cappella (158.5–161.9).**
   - "here i go" holds almost still for 2.2 s (31 last 9 frames).
   - The cut-in to 32 starts on the same frame, then fades to near-black with a tiny prompt (161.0–161.8,
     pair at 160.73).
   - 32 is the film's darkest scene (luma 0.08, highlight 45). Its serif line is ~2.5 cqw. The keystroke
     wind-up on the last bar is there now (167.4–169.2: `git push --force origin main` types out).

   **Fix:**
   - On "go" (158.44) the prompt Enter goes through, and the cream page tears or flips to black over the next
     bar instead of holding.
   - Set 32's serif line at 5 cqw, centred, with the hero words lit (history, rewrote) and a soft glow.
   - Push the camera continuously 1.0 → 1.25.
   - Light the prompt line brighter on every keystroke of the last bar, so the frame rises toward 169.27.

8. **02-commit (15.08–19.89).** The scene opens on a small `git commit` prompt alone, centred (15.08–15.6), then a
   grey editor (highlight 53). "three" (16.86) and "commit" (19.46) land well.
   **Fix:** carry the lockup in. The `force push / NEAD` lockup from 01's last bar slides up and becomes the
   editor's title bar. The editor opens lit, with the `1,095 days` status bar in the accent.

9. **35-chant3 (184.53–191.9).** This is the biggest post-chorus, but it shows the same frames as 16 and 29
   (strip 35 against 16). The `Everything up-to-date` crowd fills a band, not the frame, and the final log only
   repeats 16's.
   **Fix:** let the crowd rows fill the whole frame behind `PUSH!` by 189.57 ("crowd"), one row per clap. On
   "history" (190.93) the final log prints every author as `me` at h2, all in the accent, like 29's payoff at
   twice the size.

10. **11-rewrote / 24-rewrote2.** The hash wave is mono in a left panel at ~1.5 cqw (56.5–58, 117.3–119). At phone
    size it is a grey column beside the lyric.
    **Fix:** set the hash column at h2 down the left third. On "rewrote" every hash rewrites in a top-to-bottom
    wave, one row per eighth note, with the changed characters lit in the accent. On "you" (59.28 / 120.04) the
    `you and me` row is struck and collapses.

Also noted:

- The cuts "recently changed so the cut lands mid-whip on content" (60 fps frames):
  - **Confirmed** at 60.78 and 121.534. The first frame is the lies panel, and `FORCE` whips in blurred from
    the next frame.
  - **Confirmed** at 117.16. The outgoing whip is blurred, and the incoming first frame is 24's hash panel.
  - **Refuted** at 63.68. It lands on near-black with one dot; "brand" arrives at 63.85.
  - **Refuted** at 68.69, 129.34 and 177.15. Each lands on a dim terminal with two mono lines for
    0.5–0.6 s. The outgoing whips are fine; the incoming frames are not on content.
- 34 shows "me" at display size just before "mine" (181.73), the stash entry turning into the word. It is a good
  idea, but check that "origin's me" does not read as a lyric error.
- The left-edge warm leak in 34's first second and 37's first 3 s (197.4–200) reads as a brown blob at phone size.
  It is the finish layer's leak on a non-flip moment.

## 4. Film-level fixes

1. **Land every cut on the next scene's object, not on a dim prompt.** The outgoing whip with motion blur is now
   the film's one transition, and it works. The incoming side still opens on a cursor or a near-empty terminal
   too often.
   - **Where:** 15.08, 19.885, 23.696, 63.68, 68.69, 100.04, 124.58, 129.34, 161.0 and 177.15.
   - **How:** have each scene's first frame hold its main object (stash row, branch command, graph line, clone
     terminal, lock screen) already lit. Use the lead-in before the first sung word to move that object, never
     to reveal it.
   - **Variety:** vary the transition at three of these cuts with an object match: the lockup becoming 02's title
     bar, the stash row carrying into 34, the line dolly into 14.

2. **Make the peak the peak: drop, chorus 2 and the last post-chorus.** The report puts 33 below 23 and 25 on
   both motion figures (p50 1.30 against 1.44 / 1.85; p90 12.09 against 17.42 / 14.71). 33 is the brightest dark
   scene (luma 0.23), but only its first bar is the fastest stretch; 172.4–177.1 holds.
   - Apply fix 1's moving graph line to 33 at double speed.
   - Give chorus 2 its poster-scale changes (item 3).
   - Give 35 the full-frame crowd (item 9).

   The curve should then climb 10 → 23 → 33 and 16 → 29 → 35, instead of reading as one chorus played three
   times.

3. **Raise the verses' light and lyric scale.** The report flags highlight under 80 in 02, 03, 04, 06, 08, 11, 13,
   14, 17, 19, 20, 21, 22, 24, 27, 32 and 36, mid-tones below, and detail below.
   - **The visible cause:** the verse objects (editor, stash list, grid, phone, hash panel) are mid-grey mono
     on black, and the lead lines are 2–2.5 cqw: 06 at 35 s, 19 at 95.3, 20 at 100.5, 21 at 105.8, 32 at 164.
   - **The fix:** give each verse object one lit element in bone or accent at h2: the stash row, the `you`
     gutter, the three cards, the PR card, the hash column. Set every sung lead line at ≥ 3.75 cqw, as SYSTEM.md
     requires.

   Do not brighten the ground.

## Hook and ending

- **Hook:**
  - **t = 0:** the `force push` poster (bone + accent, prompt under it, graph at right) reads at 168×94 and works
    as the thumbnail.
  - **First 3 s:** the poster holds about one bar, then dims while `git status.` types into its own prompt.
    The big type never leaves (fixed since v1).
  - **First 15 s:** "nothing to commit." lands as display type at 4.74, and the serif aside follows at 7.4.
  - **The pad:** the counter climbs 71 → 1,095 while the graph draws, and the lockup lands at ~14.3.
  - **Weak spot:** 9.0–9.4, a bare prompt with a `0`. The report's motion here (2.54) is under the
    slow-opening signal, which suits a spoken intro.
- **Ending:**
  - The countdown (30 → 1 at 197.4–202.3, one per kick) and `git gc` give the viewer a reason to stay.
  - `0` lands at ~202.5, and the bookend poster is complete by 203.5, so it is up for ~6.1 s.
  - The right ~45 % holds only a faint log, so there is room for two cards and the subscribe button (v1's 1.4 s
    is fixed).
  - **Gap:** NEAD is only in the tiny header strip. AGENTS.md wants the artist name on the end card, so set
    `NEAD` under the prompt at label size, as the 14.3 lockup does.

## Check by ear

- **0–1.5:** does the poster's dim land with the first spoken "Git status"?
- **9.0–9.4:** the bare prompt in the pad.
- **23.9, 26.21, 28.54:** unseen hits in 04/05.
- **45.42:** the `>>>>>>> you` stamp on "you".
- **50.28–52.15:** "detached" into "Stop", with unseen hits at 50.28, 50.31 and 52.15.
- **53.38:** Enter into `FORCE`.
- **63.68:** the cut on "Brand".
- **92.24–94.09:** the start of the cherry-pick, a run of unseen hits.
- **98.22–101.91:** the tree fall into the phone.
- **142.32, 147.86, 149.7, 153.37:** unseen hits in 29's tail and the bridge.
- **160.7–161.9:** the fade into the a cappella before "Force".
- **167.4–169.27:** do the keystrokes sit on the last bar's eighths?
- **169.27:** the drop.
- **181.73:** "me" → "mine".
- **190.06, 193.79:** unseen hits around the outro cut.
- **197.43:** do the countdown ticks hit the kicks?
- **~208.3:** does the final hard hit land on the end card?
