# LIGHT.md — the light-and-depth rebuild of Force Push (round brief, 2026-10-26)

The user saw four scenes rebuilt with light and depth (05-branch, 10-force, 32-acappella, 33-drop) against v2, said
yes, and asked for every other scene to be rebuilt the same way. This is the brief every frame-worker of the round
shares. Read it, then the files it names.

## Read first

1. `docs/HOUSE-STYLE.md` item 9 (the light pass) and item 11 (light and depth) — the new rules.
2. `assets/kit/README.md`, section "Light and depth" and the traps; `assets/kit/lines.js` (the API).
3. `SYSTEM.md` (the film's contract) and your scenes' blocks in `STORYBOARD.md`; `lyrics.json` for word times.
4. The worked examples: `compositions/frames/05-branch.html` (a verse: rail, lanes, a branch, the follow camera),
   `10-force.html` (the hook), `32-acappella.html` (a quiet scene), `33-drop.html` (the drop). Their stills are in
   `snapshots/<id>/`.
5. Your scenes' current version: `compositions/frames/<id>.html` and `audit/draft-2/strips/<id>.jpg`, with the
   review's notes on them in `audit/draft-2/review.md`.

## Keep

- The scene's idea, its literal pun, every sung word on its own `start` (SYSTEM.md "Lyrics"), the exact git strings,
  the counter, the plants and payoffs, the register (dark or cream paper).
- The handoffs: the `WOW.transition` kinds in and out, and the state each neighbour expects. Look at the
  neighbours' current first and last frames (`./vid snap force-push <neighbour> --at …`); a neighbour that has
  already been rebuilt is the one you match.

## Change

- **One hero set piece in a space,** the line's object as lit line drawing, at least 40 % of the frame
  (`lines.js` lines, fog by distance, the world of 05: the repo as a place). A headline over a flat ground, a small
  terminal in a void, or the same headline-plus-terminal layout as the scenes around it does not count.
- **A camera through it,** keyed to the words and the beats (`K.keys`, `K.pulse`, `K.springStep`), with a dive or a
  push on the hero and the shutter (`createShutter`) on the fast moves.
- **The whole sung line stays in frame** until the next line starts (SYSTEM.md "Lyrics"): a follow camera frames the
  span from the line's first word on the object to the word being sung, pulling back as the line grows; it never
  pushes earlier words off an edge. Check it on consecutive proof frames (10 fps) around every camera move.
- **The lyric on the object** (`K.textOnPath` along a curve or a rail, standing on the floor, written on the
  document), ≥ 72 px for the sung line and display scale for heroes on screen. Fixed copy (strip, terminal, labels)
  stays DOM.
- **Light from the accent:** draw hot things in the accent and let the light pass bloom them; hero words may land
  white-hot and cool to fire (`opts.color` in `textOnPath`). **Remove every CSS glow** (`.hr-glow*` classes,
  `HR.glow` calls, `text-shadow`, `drop-shadow`, radial-gradient light divs).
- **Cream-paper scenes stay cream:** the document becomes a sheet in a space (in perspective, the camera moving over
  it, ink lines and type on it, the accent marking what is sung); no fire glow on the paper itself.
- **Choruses repeat their set with the world changed** (HOUSE-STYLE item 6): a chorus-2 scene reuses its chorus-1
  scene's world with the state moved on. When you own both, build them as one design.

## How to check

- `./vid snap force-push <id> --at <track seconds,…>` (runs `hyperframes check` on the scene alone, then stills
  through the light pass; read `snapshots/<id>/sheet.png` every iteration). It must pass check.
- WSLg may still be hung: `timeout 5 xdpyinfo >/dev/null && echo ok`. If it does not print ok, add
  `--no-browser-gpu` to every proof (software, several minutes per scene); otherwise proofs go through the GPU.
- One proof per scene near the end: `./vid proof force-push --from <start> --to <end> [--no-browser-gpu]`, then
  `./vid audit force-push --file projects/force-push/video/renders/proof-<start>-<end>.mp4 --name light-<id>`; pull
  frames with ffmpeg to check timing and the hero hits.
- Done when every still passes docs/visual-guidelines.md and the four questions (AGENTS.md), no word is early,
  and the scene clearly belongs with 05/10/32/33.

## Limits

Edit only your own frame files (and you may add a `- light: {…}` line to your own STORYBOARD block). Do not edit
the kit, templates, tools, SYSTEM.md, other frames or the rest of STORYBOARD.md. Do not commit. Do not kill
processes you did not start, or restart WSL.

## Report back (≤ 250 words per scene)

The set piece and how it follows the line; check result; sheet path; proof path and its audit row (motion p50/p90,
highlight, black, accent light); anything unresolved, and anything a neighbour must match.

## Round order (the lead's queue; three workers at a time, never two neighbours at once)

Done before the round: 05-branch, 10-force, 32-acappella, 33-drop (brightness fixed: highlight 57 → 162, then 152 after a wider pull-out that keeps the whole line in frame from 175.4 s to the whip). Done in the round: 09-stop, 01-status, 37-end. 05-branch re-framed (span camera; whole line in every 10 fps frame). Pending a framing fix (the follow camera pushes earlier words of the line off the left edge while it is sung): 04-feature, 11-rewrote, 24-rewrote2 — next in the queue, to their original workers.
Units (a worker each; chorus repeats with their chorus-1 scene, the chants together, the bookend together):

1. 04-feature · 09-stop · 34-dropmine (after 33's fix)
2. 01-status + 37-end · 11-rewrote + 24-rewrote2 · 31-checkout
F. framing fixes: 04-feature · 11-rewrote + 24-rewrote2 · 34-dropmine (sent back 22:30) · 31-checkout (sent back 22:39) (before batch 3)
3. 02-commit · 06-blame · 12-lies + 25-lies2 (12 + 25 started early)
4. 03-stash · 13-timeline + 26-timeline2 · 16-chant + 29-chant2 + 35-chant3
5. 07-merge · 14-local + 27-local2 · 23-force2
6. 08-patches · 15-origin + 28-origin2 · 17-squash
7. 18-message · 20-phone · 22-revert
8. 19-cherry · 21-ignore · 36-reflog
9. 30-shared

Then: assemble, a full render through the light pass, the audit and the independent review (AGENTS.md stage 6).

## Status when the round was paused (2026-10-26, 23:05; the user asked to stop and continue later)

Nothing is running. All workers were stopped; no render, snapshot or check process is left. Nothing is committed.

| Scene | State |
|---|---|
| 05-branch, 10-force, 32-acappella, 33-drop | **Done** (rebuilt before the round; 05 re-framed with a span camera at 22:12; 33's brightness fixed, highlight 152, whole line in frame from 175.4 s) |
| 09-stop, 01-status, 37-end | **Done** (checked on consecutive proof frames: the whole sung line stays in frame) |
| 04-feature | Rebuilt; **fails the framing gate** (6 fps: "ature, nothing", "nothing on" with "feature," gone mid-line). Fix not started. |
| 11-rewrote, 24-rewrote2 | Rebuilt; **fail the framing gate** (earlier words of "i rewrote the past, there's no you and me" leave the left edge). Fix not started. |
| 34-dropmine | Rebuilt; failed the gate (both lines lose their start at 6 fps); **fix was in progress when stopped** (file last edited 22:36). Passes `check`; framing unverified. |
| 31-checkout | Rebuilt (fanfold reflog sheet on cream, exact match into 32); failed the gate (line 49 loses "but you checked out" while "a long, long time ago" is sung); **fix in progress when stopped** (22:42). Passes `check`; framing unverified. |
| 12-lies, 25-lies2 | Rebuilt (the lies overwritten on origin/main); failed the gate only for ~0.3 s (the push-in on "lies" crops "right"/FORCE); **fix in progress when stopped** (22:42). Pass `check`; framing unverified. |
| the other 23 scenes | Not started: 02, 03, 06, 07, 08, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 26, 27, 28, 29, 30, 35, 36 (23 scenes; 13/26, 14/27, 15/28, 16/29/35 as chorus units) |

Counted: 7 done of 37 (3 of the round's 33), 7 rebuilt but failing or unverified on framing, 23 not started.

### To resume

1. Restart WSL first if you can (`wsl --shutdown` from Windows): WSLg's X server hung at ~19:00, so every proof since has been software (5–15 min each; add `--no-browser-gpu`). After a restart, check `timeout 5 xdpyinfo` answers, then proofs go through the GPU again.
2. Re-check the four stopped mid-fix scenes (34, 31, 12, 25): `./vid snap`, a proof, and 10 fps frames across every sung line (the whole line sung so far must be in every frame). Finish their fixes where it fails.
3. Fix 04, 11 and 24 the same way (05-branch.html's `follow()` is the span camera to copy).
4. Continue the queue above (batch 3 on), three workers at a time, with this brief; check every reported scene on consecutive frames before marking it done.
5. Then: `./vid assemble force-push`, `./vid render force-push`, `./vid audit force-push --name light-1`, the independent review (docs/REVIEW.md, with the pairwise reference test), and the user's verdict.

### Open film-level items

- **Light leaks** (`compositions/overlays/finish.html` LEAKS): lowered from 0.4 to 0.15 opacity at 23:00 (and in the template and HOUSE-STYLE) because the light pass bloomed them into an orange wash at the left edge on 53.38, 60.78, 121.534 and others. Not yet seen in a proof.
- **CSS glow** remains in the scenes not yet rebuilt; the light pass doubles it in a full render. It goes as each is rebuilt.
- **Handoff notes from the workers:** 03 must keep landing 04's glideL on the field and the terminal; 23-force2 was forked from the old 10 and must follow the new 10, and its whipR must hand over to 24's opening view down main from the root with 24's log state; 13 and 26 must use 12/25's hash pairs (right `e81b0d4`/`9c0ffee`, over `c40f9a2`/`5f2b8e1`, your lies `7b1e3d8`/`c81d3a4`) in left-to-right order; 36's last frame must stay the terminal page 37 opens on; 35 still enters with the zoom from 34.
- **Unseen hits** to look at in the review: 04 (25.75, 26.21, 27.14), 11 (57.21), 24 (118.44), 31 (153.37), 34 (178.14).
- **33-drop** uses 4 shutter samples under software WebGL (8 on the GPU); re-check its fast moves once GPU proofs work.
