# WORKER.md — Force Push, stage 5: one frame-worker builds one frame

You build ONE frame of the Force Push lyric video (AGENTS.md "Making a video", stage 5). Other workers build the
other frames at the same time; the lead reviews the assembled film after you. Work from the repo root
`/home/chrysogonus/workspace/neadlab-video-stuff`.

## Read first, in this order

1. `projects/force-push/video/SYSTEM.md` — the contract: world, registers, tokens, voices, lyric rule, devices,
   real git strings, motion, code conventions. It wins over any generic skill rule.
2. Your `## Frame N — <frame_id>` block in `projects/force-push/video/STORYBOARD.md` — what your scene literally shows,
   its span, its lines, hero words with their track seconds, its small text.
3. The reference frames, which the user approved; copy their structure and code patterns:
   - `compositions/frames/01-status.html` — the opening: keystroke list (typing seekable from time), the counter
     in `render()`, graph lanes drawn with `pathLength` + `strokeDashoffset`, dots popping on time.
   - `compositions/frames/10-force.html` — the hook: `HR.hero` slams, camera punches, strikes drawn with `scaleX`.
   - `compositions/frames/09-stop.html` — a short frame: a line building word by word while a command types.
   - `compositions/frames/06-blame.html`, `compositions/frames/30-shared.html` — approved stills of their scenes
     (static; if one of these is your frame, animate it without changing its look).
4. `projects/force-push/video/assets/kit/README.md` — the kit and the traps that cost whole rounds before.
5. `docs/visual-guidelines.md` — the rules (firm) and the signals (look, never game them).
6. `projects/force-push/video/lyrics.json` — every sung word's `start`/`end` in track seconds (the timing truth);
   `data/audio.json` is not needed: `assets/kit/env.js` (`HR_ENV`) has the drums, onsets and downbeats.

**Vary the layout from your neighbours** (house style: neighbouring shots never put the lyric in the same place).
Look at the previous frame's contact sheet, `projects/force-push/video/snapshots/<previous frame>/sheet.png`, if it
exists, and choose a different family and lyric position: the lyric typed at a prompt; set inside a UI (editor,
blame gutter, list, phone); riding a graph line or path; one word full-frame; a cream printed page; the lyric
centred or right-aligned instead of top-left. 02–04 already used "stacked poster lyric at the left with a prompt":
don't use it again until 08.

If your frame forks another (the storyboard's `note: … fork 1x-…`), read that frame first and keep its set, changing
only what the storyboard says moved on.

## Build

- Write only `projects/force-push/video/compositions/frames/<frame_id>.html` (it is a placeholder now; replace it).
  Do not edit SYSTEM.md, STORYBOARD.md, the kit, other frames or the overlays. If you need a kit change, say so in
  your report instead.
- Root: `data-composition-id="<frame_id>"`, `data-duration` = the storyboard `duration` exactly. All times in your
  code are frame-local (`t = track − span_sec[0]`); use an `at(T)` helper like the references.
- Every sung word of your frame appears on its own `start` (SYSTEM.md "Lyrics"). Hero words land on their seconds
  with the frame's strongest move. Lines stay until the next line starts.
- The header strip (top, mono label voice) is in every frame; its right side carries the counter:

  | frames | strip right side |
  |---|---|
  | 02–08 | `commits by you 1,095` |
  | 11–16 | `commits by you on origin 0` |
  | 17 | `commits by you 1,095` → `1` on "single" (squashed) |
  | 18 | `commits by you 1` |
  | 19 | `commits by you 1` → `3` on "three" (cherry-picked) |
  | 20–22 | `commits by you 3` |
  | 23 | `commits by you on origin 3` → `0` on "history" (struck, as in 10) |
  | 24–35 | `commits by you on origin 0` |
  | 36 | `reflog: unreachable 1,095` |
  | 37 | `expires in 30 days` → counting down to `0`, then `commits by you 0` |

- Two terminals: the singer's prompt is `~/us (main) $` (the default); the ex's is `you@laptop ~/us (<branch>) $`
  (04 uses it: the ex creates `feature/nothing-on-the-side`; 05 is the singer finding it as
  `remotes/you/feature/nothing-on-the-side`). The strip is always the singer's view of the repo.
- Hashes are fixed across the film. Before the rewrite (01, 10): `e81b0d4` ready. (the new tip) · `9d03b7e` merge
  branch 'you' · `3f2a1c9` you and me · `a7c21f0` we'll get to it · `4c9d7a1` just a feature · `91be33a` moved in ·
  `0b5f6e2` nothing on the side · `5d0a8c4` initial commit. After 11's rebase: `e81b0d4` ready. · `6b1e9f3` we'll get
  to it · `d27a0c5` just a feature · `8f4c61b` moved in · `1a93e7d` nothing on the side · `b05d2f8` initial commit. Verse 2 and chorus 2 (19, 23): `51d0a3e` first date · `c7f2b18` the beach · `0e96d4a` that sunday (cherry-picked, author
  `you`) · `2b7d4e8` Revert "force push" (the PR #57 commit, author `you`) · `9c0ffee` ready. (chorus 2's new tip).
  The squashed commit (17, 18): `7e0c3b2` fix: wasted time (author `you`, committer `me`).
- Glow on thin fire glyphs (`l`, `i`, `!`) makes `hyperframes check` read the halo as the background and fail the
  contrast. Use `.hr-glowbox` (a drop-shadow on the word, which disappears with the glyph) instead of `.hr-glow` on
  hero words: it looks the same and passes (13-timeline does this). No glow at all on cream.
- Never still, never jolting; type at a human rhythm; output lines arrive whole on kicks; hard hits are 0 ms.
- Keep it lean: type, SVG, canvas. No three.js. Decorative layers carry `data-layout-ignore`.
- Your frame hard-cuts into the next one: no fade-out at the end.

## Check (you must)

- `./vid snap force-push <frame_id> --at <track seconds,…>` mounts your frame alone, runs `hyperframes check` on it
  and writes stills to `projects/force-push/video/snapshots/<frame_id>/` with a `sheet.png`. It exits non-zero when
  the check fails; fix every ✗ (contrast, overlap, overflow, script errors). Snap at least: the first frame, every
  hero word's second + 0.1, every group boundary, the last frame. Read the PNGs.
- Judge each still against the four questions (does it express its lyric, belong to `~/us`, does its motion fit this
  moment, does it develop something) and against SYSTEM.md: phone-legible lyric (≥ 72 px), one display moment, one
  big element on an empty ground, the accent as a pointer, real git strings only.
- Optional, once you are happy with the stills: `./vid proof force-push --from <your start> --to <your end>` renders
  your range at 60 fps to `renders/proof-<from>-<to>.mp4` (other frames may still be placeholders).
- Never commit, never run `./vid assemble`, never edit files outside your frame.

## Report (your final message)

The path of your frame, the snap times you checked and the check result, what the frame shows line by line (one
sentence each), anything you deviated from in the storyboard and why, and anything the lead should look at.

## Waves (the lead dispatches three at a time, in this order)

1. 02-commit, 03-stash, 04-feature · 2. 05-branch, 06-blame, 07-merge · 3. 08-patches, 11-rewrote, 12-lies ·
4. 13-timeline, 14-local, 15-origin · 5. 16-chant, 17-squash, 18-message · 6. 19-cherry, 20-phone, 21-ignore ·
7. 22-revert, 23-force2, 24-rewrote2 · 8. 25-lies2, 26-timeline2, 27-local2 · 9. 28-origin2, 29-chant2, 30-shared ·
10. 31-checkout, 32-acappella, 33-drop · 11. 34-dropmine, 35-chant3, 36-reflog · 12. 37-end
