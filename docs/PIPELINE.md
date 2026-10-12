# From two hand-built videos to a general pipeline

Goal: hand over an audio file and a transcript (or, for an explainer, a script) and get a rendered, synced,
karaoke-style video whose visuals carry the theme. Two kinds of video: music videos and explainers.

## Decisions (2026-10-11)

| question | decision |
|---|---|
| Visuals | **Code-rendered only.** No generated images or video clips: deterministic, sharp at 4K, no licensing questions. |
| Language | **English only.** The alignment models (wav2vec2 LV60K, MMS_FA with English text) and the Whisper cross-check stay as they are. |
| Explainer audio | **The pipeline voices the script itself (TTS)**, so an explainer's input is a script, not a recording. |
| Review | **Fully automatic.** No approval stop; the pipeline checks its own work (QA stills, critique, mechanical checks) and reports what it checked. |

## Architecture

```
projects/<id>/
  project.json   title, kind (song | explainer), inputs
  input/         audio + transcript as supplied (explainer: script.md, optional brief.md)
  data/          what the renderer reads (committed): preview.mp3, lines.txt, sections.json, lyrics.json, audio.json,
                 cues.json, style.json; later: treatment.md
  cues.md        the cue sheet resolved to times (generated)
  tuning.py      optional hand corrections and pinned settings
  work/          stems, model outputs, QA plots and stills, steps.json (not committed)
```

`./vid` runs the steps in order; each runs only when the content of its inputs changed.

1. **Ingest:** copy the inputs, decode to a 48 kHz WAV master, encode the preview. *(done)*
2. **Transcript:** lines and sections from `[Section]` headers or from stanzas. *(done)*
3. **Analysis:** stems, beat grid (constant or tracked, detected), bar phase, sections, envelopes, onsets. *(done)*
4. **Alignment:** detection of lines sung differently from the transcript, CTC + Whisper cross-check, confidence, QA report. *(done)*
5. **Treatment** (LLM): one central metaphor, a style bible and an arc. Writes `treatment.md` + `style.json` (palette, fonts, texture, motion vocabulary).
6. **Cue sheet** (LLM, then checked mechanically): Force Push's typed `CueDef`/`Cut` generalized into the engine. One cue per line with an anchor word, scene, transition and motif state; the resolver rejects cuts off the beat or phrase, missing words, gaps, and lines with no cue.
7. **Scenes:** a library of parametric scenes with parameter schemas covers most cues. A custom-scene agent writes the 2–5 hero scenes against the `Scene` API. Good custom scenes are generalized into the library afterwards.
8. **QA loop:** stills at every cue's anchor, critiqued against the cue's `result` text. Mechanical checks: text contrast and safe area, karaoke highlight within ±1 frame of the word, determinism, frame-time budget. At most 2–3 repair rounds.
9. **Render and delivery files:** the existing renderer; captions (.srt/.vtt), YouTube chapters from the sections, thumbnail.

Engine changes this needs: a project-wide karaoke layer that scenes can take over, palette and fonts per project
(`style.json` instead of global constants), and scenes driven by cue ids and parameters instead of lyric text
(all three done in phase 2).

Explainer mode: the script is voiced by a local TTS model, picked by a listening test in phase 5. It must allow
commercial use (YouTube), e.g. Kokoro-82M (Apache-2.0) or Chatterbox (MIT); XTTS-v2 and F5-TTS's weights are
non-commercial. The audio then goes through the same alignment (the transcript is the script). The beat grid is
replaced by phrase timing: sentence boundaries, pauses, emphasis. An optional music bed is out of scope until asked.

## Phases

| phase | deliverable | done when | status |
|---|---|---|---|
| 1 | `projects/` layout, `./vid`, analysis settings detected, both songs migrated | both songs render the same frames as before; the analysis reproduces the committed data | done, see below |
| 2 | generic cue types and resolver, karaoke layer, `style.json` | Force Push runs from `cues.json` with no Force Push code in the engine | done, see below |
| 3 | scene library: ~10 extracted + ~6 for explainers, with parameter schemas | a gallery page renders every scene with sample parameters | |
| 4 | LLM steps 5–8 | a song not seen before goes end to end with no hand edits | |
| 5 | explainer mode (script → TTS → video), delivery files | a 3-minute explainer renders end to end | |

## Phase 1 results

- Both songs live in `projects/`; `songs.json`, `audio/`, `lyrics/`, `data/` and `analysis/songs/` are gone.
  Stills at 12 times across both songs are byte-identical before and after the move. A short export muxes the
  master from its new path.
- Detected instead of set by hand: the tempo window, the grid (constant vs. tracked), the bar phase and the
  section bars. Force Push, with none of them in its `tuning.py`, reproduces its committed `audio.json` exactly
  (beats, downbeats, sections, envelopes, onsets). So does Harvest with only its grid pinned. Re-aligning Force
  Push reproduces its `lyrics.json` exactly.
- New: section inference for transcripts without headers, numbers spoken as words in the alignment, an automatic
  Whisper prompt (the sheet's words that Whisper's tokenizer splits), and the alignment QA report.
- Lines sung differently from the sheet are detected (`sung.py`). It keeps a difference Whisper hears only if the
  line's CTC alignment scores at least 8 better with it. Dropped words, near-homophones and unsure hearings are
  never considered.
- End to end on a fresh project (Force Push's WAV and sheet, no `tuning.py`, every step from scratch, about
  10 minutes): same tempo (130.505 BPM), tracked grid and bar phase; beats within 16 ms of the committed ones.
  Two of the three sung deviations were found ("beat", "and now"); the inserted "Stop" was not (only one of the
  three CTC models hears it). No false deviations, on that project or on Force Push itself. Word starts against
  the hand-corrected data: median 0 ms, 93% within 50 ms, 95% within 100 ms. The misses are the places Force
  Push's `FIX` corrects by hand: "Three" placed 7.4 s early on a sustained pad (which also moves the verse 1
  section start), "Git" 1 s early on a drone, and the shouted gang chants.
- Open problem for phase 4: the QA report (words below confidence 0.6) does not flag those gross misses,
  because every model agrees on the wrong place. Anchoring lines where Whisper heard them was tried and dropped:
  Whisper's word times are not reliable enough (it moved verified lines on Force Push and missed "Three").
  Candidates: a vision check of the per-line QA plots, or flagging lines whose words sit on a sustained pitch
  with no onsets.
- Finding: Harvest drifts too. Its published constant grid is off by up to ~150 ms in places (local phase error
  spread 244 ms; a tracked grid gets 7 ms). It stays pinned, since the video is timed against it.

## Phase 2 results

- The cue sheet is data: `projects/force-push/data/cues.json` (19 entries, 68 cues, written out unchanged from the
  typed module it replaces). Its types and resolver moved from `src/force-push/` into the engine
  (`src/engine/cues.ts`), and `src/timelines.ts` turns any project's sheet into its timeline. Only Harvest, edited
  before cue sheets, keeps a timeline in code. Since a sheet will be written by a model, the resolver now also
  checks its shape: every cue's fields, region and transition vocabularies and anchor; every cut; each cue's
  palette against `style.json`; and that the first entry starts the song. The problems are reported together.
  The cue doc is generated per project (`projects/<id>/cues.md`).
- `style.json`: named palettes, font roles and the karaoke layer's settings, in `ctx.style` for every scene.
  Force Push's three palettes and ten font roles moved from its kit into its `style.json`, and the kit reads them
  from there. A project without one gets a default (one dark palette with an amber accent).
- The karaoke layer (`src/engine/karaoke.ts`):
  - **Layout:** the line being sung, centred in the lower third, at the largest size that fits one row (down to
    44 px), else on two rows. Each word is wiped as it is sung, in the accent colour while it is being sung.
  - **Next line:** shown smaller and dim under the current one; it moves up into place when its turn comes,
    while the old line leaves upwards.
  - **Timing:** a line comes in up to 0.45 s before its first word, never while the previous one is still being
    sung, and stays up to 1.2 s after its last word.
  - **Scrim:** darkens the bottom of the frame while lyrics are up and eases out over 0.6 s of silence.
  - **Colours:** palette keys, looked up in the palette of the cue on screen, so the lyric stays legible on light
    and dark grounds alike.
  - **Opt-outs:** a scene that draws its own lyrics sets `ownsLyrics` (every Force Push scene does), and
    `"karaoke": false` turns the layer off for a project (Harvest).
  - **Compositing:** the layer goes over the frame before post-processing, so it takes the grade and grain.
    (Drawing it into the HUD layer showed a dotted band where the scrim fades out, because the HUD composite
    divides by alpha a second time; the HUD is unchanged.)
- `lib-plain`, the first library scene: the cue's palette as a ground with a light that follows the music. A
  placeholder, so the layer could be checked on a project with no scenes of its own.
- Checks:
  - **Frames unchanged:** 18 Force Push and 6 Harvest stills match the pre-phase renders, except for differences
    of at most 3 levels in at most 9 px. The renderer also produces those between two runs of the same code: the
    same Harvest frame came out one way in two runs and the other way in a third.
  - **Tests:** `bun test` has 28 tests. New: the shape checks; a sheet generated from the data alone (one entry
    per section, one cue per line) resolves and tiles both songs; the style defaults and the colour checks.
  - **Other checks:**
    - both typechecks and `scripts/cues.ts --check` pass
    - `render.ts check` (in order, in reverse, after seeks) passes on a demo project with the layer on
- Left for later:
  - Harvest is still the code-edited exception (`src/timeline.ts`, and its palette and P(doom) HUD in the engine).
  - A cue's `transition` and `region` are descriptive: the scenes implement them, and the karaoke layer always
    sits low and centred.
