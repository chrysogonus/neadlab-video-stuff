---
compositionId: bgm
duration_s: 209.64
canvas: {"w": 1920, "h": 1080, "fps": 60}
mode: autonomous
message: "A breakup told as a git history: the singer force-pushes the ex out of it, and only the reflog still remembers."
style:
  font: "Barlow / IBM Plex Mono / Instrument Serif Italic / Caveat Brush"
  palette: ["#0A0A0A", "#E85D26", "#F0ECE5", "#888880", "#505048", "#1A1A18"]
assets: false
build_notes: ["SYSTEM.md is the shared contract: read it first", "one paused timeline per frame", "no remote assets", "lyrics.json gives every sung word's track second", "every git string on screen is real git or marked fiction"]
avoid: ["generic hacker terminal", "Matrix rain", "green-on-black", "logos", "karaoke strip at the bottom", "a second accent colour", "empty dead frames", "red/green diff colours"]
---

# Force Push — storyboard

Track 209.64 s at a tracked ~130.5 BPM (a bar ≈ 1.84 s). One repository, `~/us`, seen through its own screens. Lines are named by their `lyrics.json` index (`L0` … `L63`); every word appears at its own `start`. Hero words below carry their track second.

Running devices (SYSTEM.md has the exact strings): the counter `COMMITS BY you` (1,095 → 0 on origin → 1 → 3 → 0 → the reflog's 30 days → 0); plants 1–5 (the hidden branch, `working tree clean`, the stash entry `me`, the blame column, the hash `3f2a1c9`); the bookend (the poster at t = 0 returns as the end card).

## Frame 1 — 01-status

- src: compositions/frames/01-status.html
- duration: 15.081s
- span_sec: [0.0, 15.081]
- pacing: phrase_flow
- mood: [dry, cold]
- feel: spoken intro over a filtered beat, near-silences 0–2 and 3–7, then a held pad
- register: dark · layout: poster → terminal

### Groups

- **g1** — free_design
  - span_sec: [0.0, 1.53]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: []
  - shows: t = 0 is the poster and thumbnail: `force push` set huge in Barlow 900, the prompt `~/us (main) $ git push --force` under it in mono with a blinking block cursor (not sent). It holds at most one bar, then the poster pulls back into the terminal it was typed in.
  - small text: `NEAD` top left; `~/us` repository path.
- **g2** — free_design
  - span_sec: [1.53, 7.373]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [1.56, 1.716, 4.739, 5.46]
  - L0 (1.56): "Git status."
  - L1 (4.74): "Nothing to commit."
  - hero: **status** 1.716, **commit** 5.46
  - shows: The spoken lines are typed and answered by the terminal: `git status.` typed on the prompt at its word time; `nothing to commit.` comes back as git's output, set big (the lyric is the output line). Under it, small and real: `On branch main` / `nothing to commit, working tree clean` (plant 2).
  - small text: `On branch main`
- **g3** — free_design
  - span_sec: [7.373, 9.24]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [7.403, 8.5]
  - L2 (7.40): "Story of your life."
  - hero: **life** 8.5
  - shows: `story of your life.` in Instrument Serif Italic, the first aside of the film, lands under the output like a reply typed by someone else.
- **g4** — free_design
  - span_sec: [9.24, 15.081]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: []
  - shows: The pad (9.4–15.1): the window becomes the repo's log graph, three years drawn left to right, two author lanes `me` and `you` running side by side; the counter strip appears top right: `COMMITS BY you  1,095`. The title lockup `force push` / `NEAD` settles over it on the last downbeat.
  - small text: header strip `~/us · main · 3 years`

## Frame 2 — 02-commit

- src: compositions/frames/02-commit.html
- duration: 4.804s
- span_sec: [15.081, 19.885]
- pacing: beat_cut
- mood: [cool, low]
- feel: verse 1 enters low: snaps, sub bass
- register: dark · layout: editor

### Groups

- **g1** — free_design
  - span_sec: [15.081, 19.885]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [16.86, 19.46]
  - L3 (16.86): "Three years in and you never could commit"
  - hero: **Three** 16.86, **commit** 19.46
  - shows: A commit-message editor opens: the lyric is typed into it as the message, line by line. On "commit" the editor closes without saving and git answers: `Aborting commit due to empty commit message.` (real git). "three years" sits on the editor's status bar as `1,095 days`.
  - small text: `# Please enter the commit message for your changes.`

## Frame 3 — 03-stash

- src: compositions/frames/03-stash.html
- duration: 3.811s
- span_sec: [19.885, 23.696]
- pacing: beat_cut
- mood: [cool]
- feel: verse groove
- register: dark · layout: list rows

### Groups

- **g1** — free_design
  - span_sec: [19.885, 23.696]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [19.945, 21.366, 22.72]
  - L4 (19.95): "Hid me in your stash, said we'd get to it"
  - hero: **stash** 21.366, **get** 22.72
  - shows: `git stash list --date=relative`: one row, the singer, stashed and forgotten: `stash@{3 years ago}: On main: me`. The lyric is typed as rows of the list; the hero "stash" is the command. Plant 3: the stash entry `me`.
  - small text: `stash@{3 years ago}`

## Frame 4 — 04-feature

- src: compositions/frames/04-feature.html
- duration: 3.874s
- span_sec: [23.696, 27.57]
- pacing: beat_cut
- mood: [cool, sly]
- feel: verse groove, a fill at 25.96
- register: dark · layout: full-bleed type

### Groups

- **g1** — free_design
  - span_sec: [23.696, 27.57]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [23.756, 25.183, 26.744]
  - L5 (23.76): "Said it's just a feature, nothing on the side"
  - hero: **feature** 25.183, **side** 26.744
  - shows: The lyric literally becomes a branch name: "just a feature, nothing on the side" is retyped as `feature/nothing-on-the-side`, kebab-case, full-bleed. Plant 1.
  - small text: `git switch -c feature/nothing-on-the-side`

## Frame 5 — 05-branch

- src: compositions/frames/05-branch.html
- duration: 3.569s
- span_sec: [27.57, 31.139]
- pacing: beat_cut
- mood: [cool, sting]
- feel: verse groove
- register: dark · layout: text on a path

### Groups

- **g1** — free_design
  - span_sec: [27.57, 31.139]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [27.6, 28.98, 30.805]
  - L6 (27.60): "Then I found the other branch you tried to hide"
  - hero: **branch** 28.98, **hide** 30.805
  - shows: `git branch -a` scrolls; the graph reveals a second line splitting off behind the main one — the hidden branch — and the lyric rides that curve. On "hide" the branch name lights: `remotes/you/feature/nothing-on-the-side`.
  - small text: `(hidden: 1 branch)` → `git branch -a`

## Frame 6 — 06-blame

- src: compositions/frames/06-blame.html
- duration: 7.584s
- span_sec: [31.139, 38.723]
- pacing: beat_cut
- mood: [accusing]
- feel: verse groove, the second half of verse 1
- register: dark · layout: screen/UI

### Groups

- **g1** — free_design
  - span_sec: [31.139, 38.723]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [31.199, 32.66, 35.14, 37.32, 38.24]
  - L7 (31.20): "So I ran the blame on every broken line"
  - L8 (35.14): "Every single one had your name, not mine"
  - hero: **blame** 32.66, **name** 37.32, **mine** 38.24
  - shows: `git blame`: the gutter columns (hash · author · date) run down the frame, and the code being blamed is the lyric itself. Every row's author is `you`, in the accent; on "not mine" the tally under the gutter lands: `lines by you 8 · lines by me 0`. Plant 4: the author column.
  - small text: `git blame us.txt` · `^3f2a1c9 (you 2023-…)`

## Frame 7 — 07-merge

- src: compositions/frames/07-merge.html
- duration: 7.827s
- span_sec: [38.723, 46.55]
- pacing: beat_cut
- mood: [exasperated]
- feel: verse 1's last couplet, building to the pre-chorus
- register: cream · layout: cream paper

### Groups

- **g1** — free_design
  - span_sec: [38.723, 46.55]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [38.76, 40.1, 42.16, 42.88, 45.42]
  - L9 (38.76): "You said we could merge, work the conflicts through"
  - L10 (42.16): "But every conflict, baby, started with you"
  - hero: **merge** 40.1, **conflict** 42.88, **you** 45.42
  - shows: The first cream frame: a printed file with merge-conflict markers. The lyric sits between `<<<<<<< HEAD` and `=======`; on "started with you" the closing marker `>>>>>>> you` slams in, in the accent. Header: `CONFLICT (content): Merge conflict in us.txt` (real git).
  - small text: `Automatic merge failed; fix conflicts and then commit the result.`

## Frame 8 — 08-patches

- src: compositions/frames/08-patches.html
- duration: 5.357s
- span_sec: [46.55, 51.907]
- pacing: beat_cut
- mood: [climbing]
- feel: pre-chorus: claps, rising synths
- register: dark · layout: stacked rows, rising

### Groups

- **g1** — free_design
  - span_sec: [46.55, 51.907]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [46.58, 47.02, 48.44, 49.34, 50.1, 50.5]
  - L11 (46.58): "No more patches, no more one more try"
  - L12 (48.44): "No more reading your logs at night"
  - L13 (50.10): "Head's been detached for way too long"
  - hero: **patches** 47.02, **logs** 49.34, **detached** 50.5
  - shows: Three rows climb the frame as the synths rise: `0001-one-more-try.patch` files struck out one per clap; `git log` with timestamps at `03:12`; then the word "head's" literally detaches from its line and drifts off: `HEAD detached at 3f2a1c9` (plant 5).
  - small text: `You are in 'detached HEAD' state.`

## Frame 9 — 09-stop

- src: compositions/frames/09-stop.html
- duration: 1.473s
- span_sec: [51.907, 53.38]
- pacing: beat_cut
- mood: [held breath]
- feel: the stop: one beat of silence (53–54)
- register: dark · layout: terminal

### Groups

- **g1** — free_design
  - span_sec: [51.907, 53.38]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [51.967, 53.06]
  - L14 (51.97): "Stop, one beat and you're gone"
  - hero: **Stop** 51.967, **gone** 53.06
  - shows: Everything stops. One prompt: `~/us (main) $ git push --force origin main`, typed in full while the lyric is sung; the cursor blinks through the silent beat. The cut on Enter is the chorus.
  - small text: the prompt only

## Frame 10 — 10-force

- src: compositions/frames/10-force.html
- duration: 2.911s
- span_sec: [53.38, 56.291]
- pacing: beat_cut
- mood: [explosive]
- feel: chorus 1 SURGE: belted, huge synths
- register: dark · layout: full-bleed type

### Groups

- **g1** — free_design
  - span_sec: [53.38, 56.291]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [53.44, 53.96, 55.62]
  - L15 (53.44): "FORCE PUSH! Baby, you're history"
  - hero: **FORCE** 53.44, **PUSH** 53.96, **history** 55.62
  - shows: Enter. `FORCE PUSH!` slams full-frame, all caps, in the accent: the film's hook. Git's real output types under it: `+ 3f2a1c9...e81b0d4 main -> main (forced update)`. On "you're history" the word history becomes the title of a `git log` page, and the counter flips: `COMMITS BY you  1,095 → 0` on origin.
  - small text: `(forced update)`

## Frame 11 — 11-rewrote

- src: compositions/frames/11-rewrote.html
- duration: 4.489s
- span_sec: [56.291, 60.78]
- pacing: beat_cut
- mood: [defiant]
- feel: chorus
- register: dark · layout: column of hashes

### Groups

- **g1** — free_design
  - span_sec: [56.291, 60.78]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [56.4, 56.5, 58.48, 59.28]
  - L16 (56.40): "I rewrote the past, there's no you and me"
  - hero: **rewrote** 56.5, **past** 58.48, **you** 59.28
  - shows: Rewriting history literally rewrites it: a column of commit hashes changes in a wave, top to bottom (every SHA is new after a rewrite). The commit `you and me` is in the list; on "no you and me" its row is dropped and the list closes the gap.
  - small text: `Successfully rebased and updated refs/heads/main.`

## Frame 12 — 12-lies

- src: compositions/frames/12-lies.html
- duration: 2.899s
- span_sec: [60.78, 63.679]
- pacing: beat_cut
- mood: [explosive]
- feel: chorus hook again
- register: dark · layout: graph overwrite

### Groups

- **g1** — free_design
  - span_sec: [60.78, 63.679]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [60.84, 61.33, 62.96]
  - L17 (60.84): "FORCE PUSH! Right over your lies"
  - hero: **FORCE** 60.84, **PUSH** 61.33, **lies** 62.96
  - shows: The old commit messages are the ex's lies, quoted from verse 1 (`just a feature`, `we'll get to it`, `nothing on the side`). The new line is pushed right over them: the graph stroke draws across, each lie is overwritten as the stroke passes.
  - small text: `3 commits overwritten`

## Frame 13 — 13-timeline

- src: compositions/frames/13-timeline.html
- duration: 5.011s
- span_sec: [63.679, 68.69]
- pacing: beat_cut
- mood: [release]
- feel: chorus
- register: dark · layout: text on a path

### Groups

- **g1** — free_design
  - span_sec: [63.679, 68.69]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [63.88, 64.52, 68.04]
  - L18 (63.88): "Brand new timeline, no goodbyes"
  - hero: **Brand** 63.88, **timeline** 64.52, **goodbyes** 68.04
  - shows: One clean graph line runs edge to edge, the lyric riding it as commit labels. "no goodbyes": no merge commit, git says `Fast-forward`.
  - small text: `Fast-forward`

## Frame 14 — 14-local

- src: compositions/frames/14-local.html
- duration: 3.745s
- span_sec: [68.69, 72.435]
- pacing: beat_cut
- mood: [dismissive]
- feel: chorus
- register: dark · layout: split: big / tiny

### Groups

- **g1** — free_design
  - span_sec: [68.69, 72.435]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [68.72, 69.24, 71.22]
  - L19 (68.72): "Keep your local copy, I don't care"
  - hero: **local** 69.24, **care** 71.22
  - shows: Their local copy is a tiny, stale clone in a corner of the frame; mine fills the rest. Real git: `Your branch and 'origin/main' have diverged, and have 1095 and 1 different commits each, respectively.` Marker aside on "I don't care": `(noted.)`.
  - small text: `git status` on their machine

## Frame 15 — 15-origin

- src: compositions/frames/15-origin.html
- duration: 3.655s
- span_sec: [72.435, 76.09]
- pacing: beat_cut
- mood: [triumphant]
- feel: chorus end
- register: cream · layout: cream paper

### Groups

- **g1** — free_design
  - span_sec: [72.435, 76.09]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [72.56, 73.32, 74.945]
  - L20 (72.56): "Origin's mine and you're not there"
  - hero: **Origin** 72.56, **mine** 73.32, **there** 74.945
  - shows: The repository's settings page on cream: `git remote -v` shows `origin  me@home:us.git (push)`; the collaborators list has one name. "you're not there": the row where you were is an empty line with a hairline.
  - small text: `Collaborators: 1`

## Frame 16 — 16-chant

- src: compositions/frames/16-chant.html
- duration: 7.394s
- span_sec: [76.09, 83.484]
- pacing: beat_cut
- mood: [stomp]
- feel: post-chorus drop: gang chant, distorted bass
- register: dark · layout: full-bleed type

### Groups

- **g1** — free_design
  - span_sec: [76.09, 83.484]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [76.12, 76.54, 77.44, 77.873, 79.14, 79.8, 81.106, 81.52, 82.502]
  - L21 (76.12): "Force! Push! (hey!) Wipe it clean"
  - L22 (77.87): "Force! Push! (hey!) Like you've never been"
  - L23 (79.80): "Force! Push! (hey!) Hear the crowd"
  - L24 (81.52): "You're not in my history now"
  - hero: **Force** 76.12, **Push** 76.54, **clean** 77.44, **never** 79.14, **crowd** 81.106, **history** 82.502
  - shows: `FORCE!` and `PUSH!` alternate full-frame on the stomps, `(hey!)` stamped as a tag. Each line's tail is a git answer: "wipe it clean" → `nothing to commit, working tree clean` (plant 2 pays off); "like you've never been" → `git log --author=you` returns nothing; "hear the crowd" → rows of `Everything up-to-date` stacking like a crowd; "you're not in my history now" → the log, `me` only.
  - small text: `git log --author=you` (no output)

## Frame 17 — 17-squash

- src: compositions/frames/17-squash.html
- duration: 4.736s
- span_sec: [83.484, 88.22]
- pacing: beat_cut
- mood: [smug, heavy]
- feel: verse 2: low, playful, heavy beat
- register: dark · layout: type squashed

### Groups

- **g1** — free_design
  - span_sec: [83.484, 88.22]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [84.668, 87.277]
  - L25 (84.67): "Squashed three years down to a single line"
  - hero: **Squashed** 84.668, **single** 87.277
  - shows: An interactive-rebase todo list: `pick` and then `squash` on 1,094 rows, scrolling; the lyric itself is squashed: its type compresses horizontally into one thin line. Counter: `1,095 → 1`.
  - small text: `git rebase -i --root`

## Frame 18 — 18-message

- src: compositions/frames/18-message.html
- duration: 3.866s
- span_sec: [88.22, 92.086]
- pacing: beat_cut
- mood: [smug]
- feel: verse 2
- register: cream · layout: editor on paper

### Groups

- **g1** — free_design
  - span_sec: [88.22, 92.086]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [88.28, 88.96, 89.776, 90.704]
  - L26 (88.28): "Commit message says: fix, wasted time"
  - hero: **message** 88.96, **fix** 89.776, **wasted** 90.704
  - shows: The squashed commit's message, printed: `fix: wasted time` (a Conventional Commit). The lyric is the message.
  - small text: `1 file changed, 1095 deletions(-)`

## Frame 19 — 19-cherry

- src: compositions/frames/19-cherry.html
- duration: 7.958s
- span_sec: [92.086, 100.044]
- pacing: beat_cut
- mood: [wry]
- feel: verse 2
- register: dark · layout: grid

### Groups

- **g1** — free_design
  - span_sec: [92.086, 100.044]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [92.146, 95.099, 96.16, 99.08]
  - L27 (92.15): "Cherry-picked the good days, there were three"
  - L28 (96.16): "Rebased the rest right out of my tree"
  - hero: **Cherry** 92.146, **three** 95.099, **Rebased** 96.16, **tree** 99.08
  - shows: Three years of days as a grid of 1,095 squares (a contribution graph, drawn in the palette). Three are lit in the accent and picked: `git cherry-pick` of three hashes. "rebased the rest right out of my tree": the other 1,092 squares fall out of the tree.
  - small text: `3 good days`

## Frame 20 — 20-phone

- src: compositions/frames/20-phone.html
- duration: 3.421s
- span_sec: [100.044, 103.465]
- pacing: beat_cut
- mood: [teasing]
- feel: verse 2, faster lines
- register: dark · layout: phone UI

### Groups

- **g1** — free_design
  - span_sec: [100.044, 103.465]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [100.14, 100.26, 101.4, 101.68, 102.04, 103.285]
  - L29 (100.14): "Your pull requests keep lighting up my phone"
  - L30 (101.68): "Please review? Honey, you're on your own"
  - hero: **pull** 100.26, **phone** 101.4, **review** 102.04, **own** 103.285
  - shows: A phone's lock screen in the palette: pull-request notifications from `you` stack up on each hat. "Please review?" is a notification; the answer is the PR's sidebar: `Reviewers: none`.
  - small text: `#57 Revert "force push"`

## Frame 21 — 21-ignore

- src: compositions/frames/21-ignore.html
- duration: 3.905s
- span_sec: [103.465, 107.37]
- pacing: beat_cut
- mood: [cold]
- feel: verse 2's last couplet
- register: dark · layout: editor

### Groups

- **g1** — free_design
  - span_sec: [103.465, 107.37]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [103.525, 103.72, 104.62, 105.46, 106.717]
  - L31 (103.53): "Wrote your name at the top of my git-ignore"
  - L32 (105.46): "Whatever you send, I don't see it anymore"
  - hero: **name** 103.72, **git-ignore** 104.62, **anymore** 106.717
  - shows: `.gitignore`, line 1: `you` — the lyric typed at the top of the file. Files from you arrive as untracked and grey out as they land; `git status`: nothing.
  - small text: `# ignore`

## Frame 22 — 22-revert

- src: compositions/frames/22-revert.html
- duration: 6.75s
- span_sec: [107.37, 114.12]
- pacing: beat_cut
- mood: [climbing, bigger]
- feel: pre-chorus 2: bigger, snare roll
- register: dark · layout: stacked rows → terminal

### Groups

- **g1** — free_design
  - span_sec: [107.37, 114.12]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [107.4, 107.865, 109.18, 110.16, 110.48, 111.32, 112.42, 112.88]
  - L33 (107.40): "No more patches, no more one more try"
  - L34 (109.18): "No more reading your logs"
  - L35 (110.48): "And now you want a revert? Baby, that's cute"
  - L36 (112.88): "Watch what I do"
  - hero: **patches** 107.865, **logs** 110.16, **revert** 111.32, **cute** 112.42, **Watch** 112.88
  - shows: The pre-chorus rows climb again, faster. "And now you want a revert?": a PR `Revert "force push"` from you; the marker answers `(cute.)`. "Watch what I do": the prompt, the push command typed through the snare roll.
  - small text: `This branch has no conflicts with the base branch`

## Frame 23 — 23-force2

- src: compositions/frames/23-force2.html
- duration: 3.04s
- span_sec: [114.12, 117.16]
- pacing: beat_cut
- mood: [explosive]
- feel: chorus 2, louder, high ad-libs
- register: dark · layout: full-bleed type
- note: The chorus repeats its set with the world changed: fork 10-force.

### Groups

- **g1** — free_design
  - span_sec: [114.12, 117.16]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [114.18, 114.78, 116.395]
  - L37 (114.18): "FORCE PUSH! Baby, you're history"
  - hero: **FORCE** 114.18, **PUSH** 114.78, **history** 116.395
  - shows: Same set as 10, the world moved on: the output is now `+ e81b0d4...9c0ffee main -> main (forced update)` and the counter starts from the 3 cherry-picked days: `3 → 0`.
  - small text: `(forced update)`

## Frame 24 — 24-rewrote2

- src: compositions/frames/24-rewrote2.html
- duration: 4.374s
- span_sec: [117.16, 121.534]
- pacing: beat_cut
- mood: [defiant]
- feel: chorus 2, louder, high ad-libs
- register: dark · layout: column of hashes
- note: The chorus repeats its set with the world changed: fork 11-rewrote.

### Groups

- **g1** — free_design
  - span_sec: [117.16, 121.534]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [117.22, 117.28, 119.1, 120.04]
  - L38 (117.22): "I rewrote the past, there's no you and me"
  - hero: **rewrote** 117.28, **past** 119.1, **you** 120.04
  - shows: Same set as 11: the hash column rewrites again, and the dropped row is now the revert PR's commit.
  - small text: `Successfully rebased and updated refs/heads/main.`

## Frame 25 — 25-lies2

- src: compositions/frames/25-lies2.html
- duration: 3.046s
- span_sec: [121.534, 124.58]
- pacing: beat_cut
- mood: [explosive]
- feel: chorus 2, louder, high ad-libs
- register: dark · layout: graph overwrite
- note: The chorus repeats its set with the world changed: fork 12-lies.

### Groups

- **g1** — free_design
  - span_sec: [121.534, 124.58]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [121.594, 122.08, 123.72]
  - L39 (121.59): "FORCE PUSH! Right over your lies"
  - hero: **FORCE** 121.594, **PUSH** 122.08, **lies** 123.72
  - shows: Same set as 12: the lies being overwritten are verse 2's (`please review?`, `Revert "force push"`).
  - small text: `3 commits overwritten`

## Frame 26 — 26-timeline2

- src: compositions/frames/26-timeline2.html
- duration: 4.76s
- span_sec: [124.58, 129.34]
- pacing: beat_cut
- mood: [release]
- feel: chorus 2, louder, high ad-libs
- register: dark · layout: text on a path
- note: The chorus repeats its set with the world changed: fork 13-timeline.

### Groups

- **g1** — free_design
  - span_sec: [124.58, 129.34]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [124.64, 125.28, 128.78]
  - L40 (124.64): "Brand new timeline, no goodbyes"
  - hero: **Brand** 124.64, **timeline** 125.28, **goodbyes** 128.78
  - shows: Same set as 13, plus plant 1 pays off: `git remote remove you` — git prints nothing, and the hidden branch line from 05 (`remotes/you/feature/nothing-on-the-side`) is gone from `git branch -a`.
  - small text: `Fast-forward`

## Frame 27 — 27-local2

- src: compositions/frames/27-local2.html
- duration: 3.812s
- span_sec: [129.34, 133.152]
- pacing: beat_cut
- mood: [dismissive]
- feel: chorus 2, louder, high ad-libs
- register: dark · layout: split: big / tiny
- note: The chorus repeats its set with the world changed: fork 14-local.

### Groups

- **g1** — free_design
  - span_sec: [129.34, 133.152]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [129.4, 130.0, 131.94]
  - L41 (129.40): "Keep your local copy, I don't care"
  - hero: **local** 130.0, **care** 131.94
  - shows: Same set as 14: their clone is smaller and further behind: `behind 'origin/main' by 2 commits`.
  - small text: `git status` on their machine

## Frame 28 — 28-origin2

- src: compositions/frames/28-origin2.html
- duration: 3.638s
- span_sec: [133.152, 136.79]
- pacing: beat_cut
- mood: [triumphant]
- feel: chorus 2, louder, high ad-libs
- register: cream · layout: cream paper
- note: The chorus repeats its set with the world changed: fork 15-origin.

### Groups

- **g1** — free_design
  - span_sec: [133.152, 136.79]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [133.28, 134.04, 135.64]
  - L42 (133.28): "Origin's mine and you're not there"
  - hero: **Origin** 133.28, **mine** 134.04, **there** 135.64
  - shows: Same set as 15 on cream: the empty collaborator row is gone entirely.
  - small text: `Collaborators: 1`

## Frame 29 — 29-chant2

- src: compositions/frames/29-chant2.html
- duration: 7.379s
- span_sec: [136.79, 144.169]
- pacing: beat_cut
- mood: [stomp]
- feel: post-chorus 2
- register: dark · layout: full-bleed type
- note: Fork 16-chant.

### Groups

- **g1** — free_design
  - span_sec: [136.79, 144.169]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [136.82, 137.26, 138.12, 138.515, 139.54, 140.44, 141.808, 142.2, 143.2]
  - L43 (136.82): "Force! Push! (hey!) Wipe it clean"
  - L44 (138.51): "Force! Push! (hey!) Like you've never been"
  - L45 (140.44): "Force! Push! (hey!) Hear the crowd"
  - L46 (142.20): "You're not in my history now"
  - hero: **Force** 136.82, **Push** 137.26, **clean** 138.12, **never** 139.54, **crowd** 141.808, **history** 143.2
  - shows: Same set as 16; plant 4 pays off: the blame gutter returns with every author `me`.
  - small text: `git blame us.txt`

## Frame 30 — 30-shared

- src: compositions/frames/30-shared.html
- duration: 7.511s
- span_sec: [144.169, 151.68]
- pacing: phrase_flow
- mood: [soft, stripped]
- feel: bridge: piano and pads, half-time
- register: cream · layout: cream paper document

### Groups

- **g1** — free_design
  - span_sec: [144.169, 151.68]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [144.58, 145.08, 146.577, 147.959, 148.76, 151.002]
  - L47 (144.58): "They say never force it on a shared branch"
  - L48 (147.96): "Somebody could lose it all, no second chance"
  - hero: **never** 145.08, **shared** 146.577, **lose** 148.76, **chance** 151.002
  - shows: The git documentation, printed on cream: the lyric is the warning box ("never force it on a shared branch"), quoted in Instrument Serif Italic, the soft voice. "no second chance" is the footnote.
  - small text: `git push --force` · `--force-with-lease`

## Frame 31 — 31-checkout

- src: compositions/frames/31-checkout.html
- duration: 9.051s
- span_sec: [151.68, 160.731]
- pacing: phrase_flow
- mood: [soft, resolve]
- feel: bridge, rising into the a cappella
- register: cream · layout: cream paper → terminal

### Groups

- **g1** — free_design
  - span_sec: [151.68, 160.731]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [151.74, 152.16, 153.12, 155.352, 156.12, 157.04, 158.44]
  - L49 (151.74): "But you checked out a long, long time ago"
  - L50 (155.35): "So no lease, no warning, here I go"
  - hero: **checked** 152.16, **long** 153.12, **lease** 156.12, **warning** 157.04, **go** 158.44
  - shows: "you checked out a long, long time ago": a reflog line `checkout: moving from us to somewhere-else`, dated long ago. "no lease, no warning": `--force-with-lease` with `-with-lease` struck through, leaving `--force`. "here I go": the paper flips to the dark terminal.
  - small text: `checkout: moving from us to somewhere-else`

## Frame 32 — 32-acappella

- src: compositions/frames/32-acappella.html
- duration: 8.539s
- span_sec: [160.731, 169.27]
- pacing: phrase_flow
- mood: [bare, intimate]
- feel: final chorus a cappella, no drums; the drop builds at the end
- register: dark · layout: one line on black

### Groups

- **g1** — free_design
  - span_sec: [160.731, 169.27]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [161.912, 164.047, 165.4, 166.003, 168.96]
  - L51 (161.91): "Force push. Baby, you're history."
  - L52 (165.40): "I rewrote the past, there's no you and me."
  - hero: **Force** 161.912, **history** 164.047, **rewrote** 166.003, **me** 168.96
  - shows: The stillest frame of the film: black, one line, lowercase Instrument Serif Italic, sung softly: `force push. baby, you're history.` The second line builds word by word; the last beat accelerates into the drop.

## Frame 33 — 33-drop

- src: compositions/frames/33-drop.html
- duration: 7.88s
- span_sec: [169.27, 177.15]
- pacing: beat_cut
- mood: [biggest]
- feel: drop: key change up, biggest, full harmonies
- register: dark · layout: full-bleed + graph

### Groups

- **g1** — free_design
  - span_sec: [169.27, 177.15]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [169.33, 169.86, 171.46, 172.38, 172.98, 174.94]
  - L53 (169.33): "FORCE PUSH! Right over your lies"
  - L54 (172.38): "Brand new timeline, no goodbyes"
  - hero: **FORCE** 169.33, **PUSH** 169.86, **lies** 171.46, **timeline** 172.98, **goodbyes** 174.94
  - shows: The brightest, fastest stretch of the film: `FORCE PUSH!` at its largest; the overwrite (12) and the clean timeline (13) combined at full scale, a cream flash on the hit.
  - small text: `(forced update)`

## Frame 34 — 34-dropmine

- src: compositions/frames/34-dropmine.html
- duration: 7.38s
- span_sec: [177.15, 184.53]
- pacing: beat_cut
- mood: [biggest, triumphant]
- feel: drop
- register: dark · layout: terminal + full-bleed

### Groups

- **g1** — free_design
  - span_sec: [177.15, 184.53]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [177.18, 177.76, 179.7, 180.16, 181.78]
  - L55 (177.18): "Keep your local copy, I don't care"
  - L56 (180.16): "Origin's mine and you're not there"
  - hero: **local** 177.76, **care** 179.7, **Origin** 180.16, **mine** 181.78
  - shows: Plant 3 pays off: `git stash pop` — `Dropped refs/stash@{0}` — the singer, stashed in verse 1, comes back out on "mine". Origin is mine, full-frame.
  - small text: `Dropped refs/stash@{0} (…)`

## Frame 35 — 35-chant3

- src: compositions/frames/35-chant3.html
- duration: 7.365s
- span_sec: [184.53, 191.895]
- pacing: beat_cut
- mood: [stomp, biggest]
- feel: biggest post-chorus, crowd claps
- register: dark · layout: full-bleed type
- note: Fork 16-chant.

### Groups

- **g1** — free_design
  - span_sec: [184.53, 191.895]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [184.56, 185.019, 185.907, 186.4, 187.58, 188.22, 189.569, 189.9, 190.931]
  - L57 (184.56): "Force! Push! (hey!) Wipe it clean"
  - L58 (186.40): "Force! Push! (hey!) Like you've never been"
  - L59 (188.22): "Force! Push! (hey!) Hear the crowd"
  - L60 (189.90): "You're not in my history now"
  - hero: **Force** 184.56, **Push** 185.019, **clean** 185.907, **never** 187.58, **crowd** 189.569, **history** 190.931
  - shows: Same set as 16 at its biggest: the `Everything up-to-date` crowd fills the frame; the final log shows `me` only.

## Frame 36 — 36-reflog

- src: compositions/frames/36-reflog.html
- duration: 5.536s
- span_sec: [191.895, 197.431]
- pacing: phrase_flow
- mood: [dry, deadpan]
- feel: outro: spoken, dry, the beat cut out
- register: dark · layout: terminal

### Groups

- **g1** — free_design
  - span_sec: [191.895, 197.431]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: [192.328, 193.26, 194.403, 195.3, 196.803, 197.16]
  - L61 (192.33): "Oh, and the ref-log?"
  - L62 (194.40): "It forgets you in thirty days."
  - L63 (196.80): "I can wait."
  - hero: **ref-log** 193.26, **thirty** 195.3, **wait** 197.16
  - shows: Back to the terminal of the first frame. "oh, and the ref-log?": `git reflog` — and there you still are: `3f2a1c9 HEAD@{2}: commit: you and me`. "it forgets you in thirty days": `gc.reflogExpireUnreachable = 30.days` (git's real default). "i can wait.": the cursor.
  - small text: `HEAD@{2}`

## Frame 37 — 37-end

- src: compositions/frames/37-end.html
- duration: 12.209s
- span_sec: [197.431, 209.64]
- pacing: beat_cut
- mood: [release, final]
- feel: the beat returns on 197.43 for one last run, then the single hard hit
- register: dark · layout: terminal → poster

### Groups

- **g1** — free_design
  - span_sec: [197.431, 209.64]
  - free_design: { dominant_system: "kinetic type on the repo's own screens", primitives: ["kinetic-letter-in", "content-swap", "hard-cut"], density_topology: "one display moment at a time" }
  - anchors: []
  - shows: The 30 days run down, one per kick: `expires in 30 days … 1 day`. Then `git gc --prune=now`: the reflog lines vanish, the counter reads `COMMITS BY you  0`. The end card is the opening poster again (the bookend): `force push` / `NEAD`, the prompt clean, ready to loop into frame 0. The final hard hit lands on the card.
  - small text: `git gc --prune=now`
