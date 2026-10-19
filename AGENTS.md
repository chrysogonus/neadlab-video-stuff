# AGENTS.md — neadlab video stuff

Music videos for NEAD (YouTube channel "Neadlab"): a song plus its lyric sheet in, a beat-synced lyric video out.
The goal is a video that wins on YouTube: a scroll-stopping first second, every line readable on a phone,
every hit landing on its beat, one unmistakable look.

## Skills come first

Every video is a **HyperFrames** project (HTML + GSAP compositions rendered by `npx hyperframes`). Two skills own
the work; load them before planning or writing a single composition:

- **`/music-to-video`** — the workflow for every song: analyze → frame skeleton → plan (`STORYBOARD.md`) → one
  frame-worker sub-agent per frame → assemble → check → render. Follow its steps and gates in order.
- **`/hyperframes-animation`** — every motion decision: atomic rules, blueprints, transitions, the GSAP and
  three.js adapters. Pick rules from its `rules-index.md` before inventing motion.

Their companions (`/hyperframes`, `/hyperframes-core`, `/hyperframes-creative`, `/hyperframes-cli`,
`/hyperframes-registry`, `/hyperframes-keyframes`, `/hyperframes-audio`, `/media-use`) live beside them in
`.agents/skills/` (linked from `.claude/skills/`); the two skills point into them by relative path, so they stay
together. Refresh the whole set with `npx hyperframes skills update`, then copy the updated folders into
`.agents/skills/`.

## Making a video

1. `./vid new <id> --audio <master> --transcript <lyrics.txt>`, then `./vid analyze <id>` — stems, word-level
   lyric alignment, sung-line detection, the tracked beat grid. Done when `projects/<id>/data/lyrics.json`
   exists and `work/qa/align_report.md` flags nothing you have not resolved.
2. `./vid video <id>` — scaffolds the HyperFrames project at **`projects/<id>/video/`** (the skill's
   `PROJECT_DIR`) and refreshes `assets/bgm.mp3`, `audiomap.json` and `lyrics.json`. Rerun it after any change
   to the analysis; it never touches the brief, storyboard or frames.
3. Run `/music-to-video` in `projects/<id>/video/`, with this repo's deviations (below).
4. `./vid master <id>` — `out/<id>.mp4`, the render with the master's audio (AAC 320k), the file to upload.

`./vid snap <id> [<frame_id>] --at <track seconds,…>` writes stills and a contact sheet to
`projects/<id>/video/snapshots/`; with a frame id it mounts that frame alone at its storyboard span, so a frame
can be judged before the others exist. Read the sheet after every change you want to trust.

## This repo's deviations from `/music-to-video`

- **Step 0–1 are `./vid video`.** It runs the skill's analyzer, then replaces the audiomap's beat grid with our
  tracked one (`data/audio.json`): the skill's constant grid lands ~35 ms late on these Suno tracks. Rerun
  `./vid video` instead of the raw analyzer, or the late grid comes back.
- **Lyrics come from `lyrics.json`**, never from transcription: each sung line and word with its track-second
  start/end and its section. Every lyric on screen appears on its word's `start`, the hero word of a line lands
  on its own word time, and the line text is the sung text exactly.
- **One film, many workers.** Before Step 4, write the video's `SYSTEM.md` (how this video uses `frame.md`:
  its idea, tokens, lyric rule, motion, code conventions) and build two reference frames yourself (the opening
  and the first chorus with its hook). Render `./vid proof` and get the user's verdict, then dispatch the
  frame-workers three at a time with both frames, plus `./vid snap` to look at their own frame.
  `projects/harvest-remix/video/` is the worked example.
- **Software WebGL.** Headless Chrome gets no GPU context under WSL: pass `--no-browser-gpu` to every
  `hyperframes check`, `snapshot` and `render` (`./vid snap` does). Keep three.js frames lean (instancing,
  simple materials, no post passes) and drive them from the timeline (`tl.eventCallback("onUpdate", …)`).
- **Decorative layers carry `data-layout-ignore`** (ghost ciphertext walls, drawer grids, texture piles):
  `hyperframes check` otherwise reports every lyric over them as a text overlap. Deliberate layering of
  real text gets `data-layout-allow-overlap` on that element. Anything else `check` flags is a defect.
- **`STORYBOARD.md` frontmatter `canvas` is JSON** (`{"w": 1920, "h": 1080, "fps": 30}`); the assembler
  ignores the YAML flow form.
- **Imagery is code-rendered only** (user decision): type, shapes, SVG, canvas, shaders, three.js, registry
  blocks. No generated or supplied photos or video clips.
- **Runs are autonomous.** The user wants finished work, not checkpoints: write `BRIEF.md` with
  `flow: automation`, `storyboard: no`; post the plan summary and keep going; render once `check` passes and
  you have inspected the snapshots yourself (that answers the skill's render question).
- **Canvas** 1920×1080 (YouTube). Artist name on title and end cards: NEAD.

## House style

Every video uses the **house style**, [docs/HOUSE-STYLE.md](docs/HOUSE-STYLE.md). Read it before planning a
song. In short: a world built from the song's subject, told in kinetic type (poster-scale lyrics on or as that
world's objects, one literal pun per line, a deadpan small-text layer, counters and plants that pay off); black
and restrained (one small accent, a cream-paper register); motion from the shared kit and finish layer; 3D only
as line drawing. **Complex or realistic 3D is out**: it cost the most and still read as a generic CG demo
(harvest-remix v1–v6). `projects/harvest-remix/video/` is the approved model; the reference videos and why they
work are in [docs/REFERENCE-VIDEOS.md](docs/REFERENCE-VIDEOS.md).

## Quality bar

Before calling a video done, look at the snapshots at `t=0`, every frame start, every drop and the last frame,
and confirm each one: the line on screen is legible at phone size; nothing sits in an empty frame for more than a
beat; the frame matches the line being sung. The opening hooks in its first seconds: a poster first frame, or a
narrative cold open backed by a designed YouTube thumbnail.

## Repository checks

`./vid check` (the pre-commit hook and CI) guards the repository: no tracked file over 5 MB outside
`projects/*/input/`, `tools/` typechecks and its tests pass, `analysis/` lints and its tests pass. Keep it green.
`./vid check --full` also reruns the beat analysis and requires every project's `data/audio.json` byte for byte.

The published Harvest and Force Push videos and harvest-remix v1–v6 came from a TypeScript/three.js engine, retired
on 2026-10-19; it is in git history up to `e4376f8` (`app/`, `prompts/`, the engine docs). Their masters are in `out/`.
