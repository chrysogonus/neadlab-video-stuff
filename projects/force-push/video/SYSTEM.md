# SYSTEM.md — Force Push: the shared craft of this video

Every frame is built by a different worker, and it has to read as ONE film. This file is the contract between them.
`frame.md` (broadside, verbatim) is the brand; docs/HOUSE-STYLE.md is the house look; this file is how this video uses
both. Read it, then your `## Frame` block in `STORYBOARD.md`, then the two reference frames (`01-status.html`, the
opening, and `10-force.html`, the first chorus hook). When this file and a generic skill rule disagree, this file wins.

## The idea: a history you can rewrite

The song is a breakup told in git. The singer was stashed, blamed and kept on a hidden branch; in the chorus she
force-pushes the ex out of the shared history. The video takes every line literally, inside one repository:

- **The world is `~/us`**, one repository, seen only through its own screens: the terminal, the log graph, `git
  blame`, a commit editor, the stash, the branch list, the remote's settings, a phone's pull-request notifications,
  the git documentation. Nothing is decoration: every screen is the thing the line names.
- **Two authors.** `me` (the singer) and `you` (the ex), always these exact lowercase names, in Plex Mono. `you` is
  the one the film deletes.
- **The lyric is on or is the object:** typed at the prompt, written as the commit message, blamed in the gutter,
  set between conflict markers, ridden along a branch line, squashed. Never a caption beside a screen.
- **The hook is the command.** `FORCE PUSH!` is the one all-caps slam in the film (as the sheet writes it); every
  other lyric is lowercase broadside Barlow.

## Registers

- **Dark** (`--ink` ground) is the terminal and the default.
- **Cream paper** (`--cream` ground, ink type, fire accent) is anything printed or documented: the conflict file
  (07), the remote's settings (15, 28), the commit message (18), the git docs in the bridge (30, 31). Cut between
  registers on a downbeat, as a 0 ms hard cut.
- **No orange grounds.** The accent marks what is sung, what is deleted and what is pushed: the hero word, `you` in
  the blame gutter, `>>>>>>> you`, the `+` of a forced update, the cursor. About 3 % of the frame.

## Tokens (copy verbatim into every frame's `<style>`)

```css
@font-face { font-family: "Barlow"; src: url("assets/fonts/barlow-400.woff2") format("woff2"); font-weight: 400; }
@font-face { font-family: "Barlow"; src: url("assets/fonts/barlow-600.woff2") format("woff2"); font-weight: 600; }
@font-face { font-family: "Barlow"; src: url("assets/fonts/barlow-700.woff2") format("woff2"); font-weight: 700; }
@font-face { font-family: "Barlow"; src: url("assets/fonts/barlow-800.woff2") format("woff2"); font-weight: 800; }
@font-face { font-family: "Barlow"; src: url("assets/fonts/barlow-900.woff2") format("woff2"); font-weight: 900; }
@font-face { font-family: "IBM Plex Mono"; src: url("assets/fonts/ibm-plex-mono-400.woff2") format("woff2"); font-weight: 400; }
@font-face { font-family: "IBM Plex Mono"; src: url("assets/fonts/ibm-plex-mono-500.woff2") format("woff2"); font-weight: 500; }
@font-face { font-family: "IBM Plex Mono"; src: url("assets/fonts/ibm-plex-mono-600.woff2") format("woff2"); font-weight: 600; }
@font-face { font-family: "Instrument Serif"; src: url("assets/fonts/instrument-serif-400-italic.woff2") format("woff2"); font-style: italic; }
@font-face { font-family: "Caveat Brush"; src: url("assets/fonts/caveat-brush-400.woff2") format("woff2"); }
#root {
  position: absolute; inset: 0; overflow: hidden; container-type: size;
  --ink: #0A0A0A; --ink-alt: #1A1A18; --fire: #E85D26; --cream: #F0ECE5;
  --cream-muted: #888880; --cream-hint: #505048; --border: #282826; --ink-on-cream: #111111; --muted-on-cream: #5F5B54;
  background: var(--ink); color: var(--cream);
}
```

Only these colours exist. **No diff red/green, no terminal green, no blue links, no logos.** Shapes are flat, with
1 px hairlines and sharp corners; the cursor block and graph dots are the only filled shapes besides type.

## Voices

- **Barlow** (lowercase, 700–900, tight tracking) is the song: every sung word.
- **IBM Plex Mono** is the machine: commands, git's output, hashes, labels, the counter. Uppercase 0.14em for
  labels; as-typed case for commands and output.
- **Instrument Serif Italic** is the soft voice, rare: "story of your life." (01), the bridge (30), the a cappella
  (32).
- **Caveat Brush** is the marker, about six notes in the film, each a dry aside: `(noted.)` (14), `(cute.)` (22).
  `#C8481A` on cream, `--fire` on ink. Drawn on left to right with `clip-path: inset()` in `render()`.

## Lyrics (the hard rule)

`lyrics.json` holds every sung line and word with its **track-second** `start`. It is the timing truth.

- Every sung word of your frame is on screen as sung: the line `text`, lowercased except `FORCE PUSH!` (and the chant's
  `Force! Push!`, which is set `FORCE! PUSH!`); keep apostrophes and punctuation as written.
- **A word appears on its own `start`** (frame-local `start − span_sec[0]`): a 0 ms reveal, or an entrance that
  begins at `start − 0.04` and lands within 0.25 s. Never before its time, never late. A word typed at a prompt
  types its letters from its `start` to its `end`.
- A line stays readable until the next line starts (or a cut at least 0.4 s after its last word).
- **Legible on a phone:** the sung line ≥ 72 px (3.75cqw); a hero word is display scale (11–17cqw); the hook and
  one word per section go full-frame. Line measure ≤ 78cqw, pad-x 5.5cqw. One display moment at a time.
- **Hero words** (named with their second in the storyboard) are `--fire` on ink (`.hr-glow`) or ink weight on cream,
  and land with the frame's strongest move.

## Running devices (keep the exact strings)

- **The counter**, one style everywhere: a header strip in Plex Mono, label `COMMITS BY you`, value in `--fire`.
  `1,095` (01–09) → `0` on origin (10) → `1` (17, squashed) → `3` (19, cherry-picked) → `0` (23) → in the outro the
  reflog's `expires in 30 days` runs down to `0` (37).
- **Plants and payoffs:**
  1. `feature/nothing-on-the-side` (04, created on `you@laptop`; 05, found as `remotes/you/feature/nothing-on-the-side`) →
     26 `git remote remove you`: the remote goes, and the branch vanishes from `git branch -a` (git prints nothing).
  2. `nothing to commit, working tree clean` (01, small) → 16 / 29 / 35 on "wipe it clean", big.
  3. `stash@{3 years ago}: On main: me` (03) → 34 `git stash pop` → `Dropped refs/stash@{0} (…)` on "mine".
  4. The blame gutter's author column, all `you` (06) → 29, all `me`.
  5. The hash `3f2a1c9` (`HEAD detached at 3f2a1c9`, 08) → 10 `+ 3f2a1c9...e81b0d4 main -> main (forced update)` →
     36 `3f2a1c9 HEAD@{2}: commit: you and me`.
- **The bookend:** the poster at t = 0 (`force push` over the unsent prompt `~/us (main) $ git push --force`) returns
  as 37's end card, same position and scale, so the video loops into frame 0.

## Insider precision (real git; quote exactly)

`Aborting commit due to empty commit message.` · `git stash list --date=relative` → `stash@{3 years ago}` ·
`CONFLICT (content): Merge conflict in us.txt` · `Automatic merge failed; fix conflicts and then commit the result.` ·
`You are in 'detached HEAD' state.` · `HEAD detached at 3f2a1c9` · `+ 3f2a1c9...e81b0d4 main -> main (forced update)` ·
`Successfully rebased and updated refs/heads/main.` · `Fast-forward` · `Your branch and 'origin/main' have diverged,
and have 1095 and 1 different commits each, respectively.` · `Everything up-to-date` · `nothing to commit, working
tree clean` · `git remote remove <name>` (silent) · `Dropped refs/stash@{0} (<hash>)` · `checkout: moving from
<a> to <b>` (reflog) · `--force-with-lease` · `gc.reflogExpireUnreachable` (default 30 days) · `git gc --prune=now`.
Hashes and dates are fiction; never invent a git message or flag.

## Motion

- The kit (`assets/kit/README.md`): load `env.js`, `hr-kit.js`, `wow-kit.js` inside your `<template>`; `HR.lead` /
  `HR.hero` for sung words, `HR.stage` for the parallax camera, `HR.band` / `HR.hit` / `WOW.on` / `WOW.energy` for the
  music. Read the kit README's traps before you write code.
- **Typing is the film's native motion.** Commands type at a human rhythm (letters on the hats or at 18–28 cps),
  output arrives as whole lines on kicks, the cursor blinks at 2 Hz when idle.
- Hard hits are 0 ms (`tl.set`): Enter, register flips, stamps, `(hey!)`. Eased entrances 0.25–0.5 s
  (`power3.out`, `expo.out`). Effects are sized by the measured drums (`HR.band("drums")`, `WOW.energy`), not by the
  section's name.
- **Never still, never jolting** (docs/visual-guidelines.md rule 1): a carrier move per phrase (scroll, camera
  drift, graph growing); accents only on real hits; shake is smooth noise.
- Motion blur (`data-hf-motion-blur='{"fps": 60}'`) on 1–3 slams or whips per scene, never on a word while it is read.
- Grain, vignette, leaks and flashes come from the finish layer (`compositions/overlays/finish.html`); never add
  your own.

## Code (one file per frame, `compositions/frames/<frame_id>.html`)

- `<template>`-wrapped, root `<div id="root" data-composition-id="<frame_id>" data-width="1920"
  data-height="1080" data-duration="<span length>">`; all `<style>`/`<script>` inside the template; GSAP is the
  host's global `gsap`.
- One `gsap.timeline({ paused: true })`, built synchronously, registered last: `window.__timelines["<frame_id>"] = tl;`.
  Pin its end with `tl.set({}, {}, DUR)`.
- Prefix every id and class with your frame number (`f02-…`). Never use `Math.random`, `Date.now`,
  `performance.now`, rAF or network fetches; variation comes from `HR.rng(seed)`.
- Anything drawn per frame (canvas, scrolling lists, the cursor) is drawn from the timeline's own time:
  `tl.eventCallback("onUpdate", render)` where `render()` reads `tl.time()`; call `render()` once after building.
- Decorative layers (long scrolling lists, the hash wall, the contribution grid) carry `data-layout-ignore`.
- No three.js unless the storyboard asks for it: this film is type, SVG and canvas.

## See your frame

`./vid snap force-push <frame_id> --at <track seconds,…>` (from the repo root) checks your frame on its own, then
writes stills to `snapshots/<frame_id>/`. Read them. Check at least the first frame, every hero word's time + 0.1 s,
every cut inside the frame, and the last frame. `./vid proof force-push --from <s> --to <s>` shows it moving. Done
when every still passes docs/visual-guidelines.md's rules and the four questions (AGENTS.md).
