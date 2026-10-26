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

Seven stages, run with `/music-to-video` in `projects/<id>/video/` and this repo's deviations (below). Stages 3 and
4 end on the user's verdict; nothing else stops. At every check, ask of each scene: does it express its lyric, does
it belong to this film's world, does its motion express this moment of the music, does it develop something across
the song?

1. **Analyze.** `./vid new <id> --audio <master> --transcript <lyrics.txt>`, then `./vid analyze <id>`: stems,
   word-level lyric alignment, sung-line detection, the tracked beat grid. Done when `projects/<id>/data/lyrics.json`
   exists and `work/qa/align_report.md` flags nothing you have not resolved. Then `./vid video <id>`: it scaffolds
   the HyperFrames project at **`projects/<id>/video/`** (the skill's `PROJECT_DIR`) and refreshes
   `assets/bgm.mp3`, `audiomap.json` and `lyrics.json`. Rerun it after any change to the analysis; it never touches
   the brief, storyboard or frames.
2. **Interpret.** The skill's Steps 2–3 with the house style: the song's world, a literal pun for each sung line,
   and what develops across the song (counters, plants and payoffs, the bookend). Write `BRIEF.md`,
   `STORYBOARD.md` and the video's `SYSTEM.md` (how this video uses `frame.md`: its idea, tokens, lyric rule,
   motion, code conventions). Post the plan summary and keep going.
3. **Look.** Build 3–4 representative scenes as stills (the opening, a verse, the first chorus and a contrasting
   section) and show them with `./vid snap <id> <frame_id> --at …`. **Stop for the user's verdict on the look.**
   Then make a rough still for every scene (composition, type, the lyric on its object; not finished detail) and
   check the contact sheet against the four questions and for repeated layouts. Stills judge the look, not the
   motion.
4. **Motion.** Animate the opening and the first chorus with its hook yourself: they are the reference frames.
   Render `./vid proof <id> --to <end of the first chorus>` and measure it (step A below:
   `./vid audit <id> --file projects/<id>/video/renders/proof-<from>-<to>.mp4`). **Stop for the user's verdict on the
   motion**, with the audit's film table beside the proof.
5. **Build.** Dispatch frame-workers (the skill's Step 4) three at a time, each with `SYSTEM.md`, both reference
   frames and the rough still of its scene. Each worker checks its own scene:
   - `./vid snap <id> <frame_id> --at …` runs `hyperframes check` on the scene alone, then takes the stills. It fails
     when a script throws; in the film that would only be a dead scene.
   - `./vid proof <id> --from <s> --to <s>` shows the scene moving, and `./vid audit` on that proof measures it.

   The kit and the traps that cost earlier rounds are in `assets/kit/README.md`. Review the signals in
   [docs/visual-guidelines.md](docs/visual-guidelines.md); never game them.
6. **Review: measure, critique, refine.** `./vid assemble <id>`, then `npx hyperframes check --no-browser-gpu` (a
   broken rule is a defect and gets fixed), then render a draft of the whole film to `renders/video.mp4` and run the
   three steps below on it until they pass or two rounds are done. The loop answers the skill's render question.
   - **A. Measure.** `./vid audit <id> --name draft-<n>` measures the draft against LGTM and p(doom) (motion, big
     moves, composition change, cuts, black area, mid-tones, detail, accent colour) and per scene, and writes
     `audit/draft-<n>/report.md` with the weakest scenes against their music, still runs and unseen hits, plus
     `strips/<scene>.jpg` for step B. A flag is a reason to look, not a target to game.
   - **B. Critique.** A fresh reviewer agent, which built nothing, follows [docs/REVIEW.md](docs/REVIEW.md): it
     scores every scene on idea, motion, transitions, legibility, colour and light, craft and variety from the strips,
     checks the hook, the pacing curve and the ending, and writes `audit/draft-<n>/review.md` with the weakest scenes
     ranked and one concrete fix each.
   - **C. Refine.** Take the weakest scenes from A and B (5–10), write the round's brief (`REFINE-<n>.md`: the
     film-level fixes and one fix per scene), dispatch workers three at a time as in stage 5, then re-render and run A
     and B again. Done when no scene scores below 3 in the review and every film metric on the "below/above" side
     has a written reason, or after two rounds; report what is left.
7. **Deliver.** `./vid master <id>` writes `out/<id>.mp4`, the render with the master's audio (AAC 320k): the file
   to upload; keep an earlier master under another name rather than overwrite it. With it come:
   - subtitles (`.srt`) built from `lyrics.json`;
   - a technical check with ffprobe: duration equals the master's, constant fps, audio present;
   - **the YouTube package check:** three thumbnail candidates (the t = 0 poster and two strong frames), compared
     side by side at YouTube's small sizes (168×94 and 320×180) for legibility and click appeal; the first frame
     matches the chosen thumbnail and the title; the last 20 s leave room for the end-screen elements (two video
     cards and a subscribe button, 5–20 s).

   Loudness is the user's choice: report the master's LUFS and change nothing unless asked. Shorts are not part of
   this pipeline yet.

**Not built yet.** Until these exist, do the work by hand:
- **Lyric-event registration.** It will let the audit check that the right word appears on its time.
- **`./vid deliver`.** It will build stage 7's package.

When one lands, update its stage here.

`./vid snap <id> [<frame_id>] --at <track seconds,…>` writes stills and a contact sheet to
`projects/<id>/video/snapshots/`. With a frame id it mounts that frame alone at its storyboard span, so a frame can
be judged before the others exist, and it runs `hyperframes check` on it first. Read the sheet after every change you
want to trust.

`./vid proof <id> [--from <s>] --to <s>` renders a 60 fps proof of that range to
`renders/proof-<from>-<to>.mp4`, one per range, so workers can proof side by side. `--from` moves back to the start of
the frame playing there: to see a handoff, pick a time inside the previous frame.

## This repo's deviations from `/music-to-video`

- **Step 0–1 are `./vid video`.** It runs the skill's analyzer, then replaces the audiomap's beat grid with our
  tracked one (`data/audio.json`): the skill's constant grid lands ~35 ms late on these Suno tracks. Rerun
  `./vid video` instead of the raw analyzer, or the late grid comes back.
- **Lyrics come from `lyrics.json`**, never from transcription: each sung line and word with its track-second
  start/end and its section. Every lyric on screen appears on its word's `start`, the hero word of a line lands
  on its own word time, and the line text is the sung text exactly.
- **One film, many workers.** The skill's Step 4 waits for stage 4's verdict. Workers then run three at a time
  with both reference frames (stage 5). `projects/harvest-remix/video/` is the worked example.
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
- **Runs are autonomous apart from two verdicts.** The user wants finished work, not checkpoints: write
  `BRIEF.md` with `flow: automation`, `storyboard: no`. The user's verdicts come at stage 3 (the look) and
  stage 4 (the motion), and nowhere else.
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
narrative cold open backed by a designed YouTube thumbnail. The full checklist, firm rules and reviewed
signals, is [docs/visual-guidelines.md](docs/visual-guidelines.md).

## Repository checks

`./vid check` (the pre-commit hook and CI) guards the repository: no tracked file over 5 MB outside
`projects/*/input/`, `tools/` typechecks and its tests pass, `analysis/` lints and its tests pass. Keep it green.
`./vid check --full` also reruns the beat analysis and requires every project's `data/audio.json` byte for byte.

The published Harvest and Force Push videos and harvest-remix v1–v6 came from a TypeScript/three.js engine, retired
on 2026-10-19; it is in git history up to `e4376f8` (`app/`, `prompts/`, the engine docs). Their masters are in `out/`.
