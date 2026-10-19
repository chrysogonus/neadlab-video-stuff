# Neadlab — music videos for NEAD

Beat-synced lyric videos for the YouTube channel Neadlab: a song and its lyric sheet in, a video ready to upload out. Every
video is a [HyperFrames](https://hyperframes.heygen.com) project (HTML + GSAP compositions), every image is drawn in
code, and every lyric appears on the time its word is sung.

| Video | Project | Made with |
|---|---|---|
| Harvest Now, Decrypt Later (Banger Remix) | `projects/harvest-remix/` | HyperFrames, v21 (2026-10-19); record in [`video/DELIVERY.md`](projects/harvest-remix/video/DELIVERY.md) |
| Harvest Now, Decrypt Later | `projects/harvest/` | the retired three.js engine (git history up to `e4376f8`) |
| Force Push | `projects/force-push/` | the retired three.js engine |

How a video is made, the house style and the quality bar are in [`AGENTS.md`](AGENTS.md),
[`docs/HOUSE-STYLE.md`](docs/HOUSE-STYLE.md) and [`docs/visual-guidelines.md`](docs/visual-guidelines.md); why the
two reference videos work is in [`docs/REFERENCE-VIDEOS.md`](docs/REFERENCE-VIDEOS.md).

## Layout

- `projects/<id>/` — one directory per song:
  - `project.json` — title, `audio` (the master the analysis reads and `./vid master` muxes), `transcript` (the
    lyric sheet, with or without `[Section]` headers), and `frozen` steps (below).
  - `input/` — the master and the lyric sheet as supplied.
  - `data/` — the analysis, committed: `lines.txt` + `sections.json` (from the sheet), `sung.json`, `lyrics.json`
    (word timings), `audio.json` (beats, bars, sections, envelopes, onsets).
  - `tuning.py` (optional) — hand corrections the analysis cannot detect (see [Analysis](#analysis)).
  - `video/` — the HyperFrames project (`./vid video` scaffolds it; the `/music-to-video` skill builds it).
  - `work/` — stems, model outputs, QA plots, the step record (not in the repo; regenerable).
- `vid` — the pipeline (`tools/vid.ts`).
- `tools/` — `vid.ts` and the repository checks (TypeScript, bun).
- `analysis/` — the Python (uv) analysis: Demucs stems, CTC forced alignment cross-checked with Whisper, beat,
  downbeat and onset analysis.
- `templates/hyperframes/` — the house-style kit and finish layer `./vid video` installs into a new project.
- `.agents/skills/` (linked from `.claude/skills/`) — the HyperFrames skills.
- `successful-videos-reference/analysis/` — frame analysis of the two reference videos (the videos themselves are
  not in the repo).
- `out/` — the uploads, `out/<id>.mp4` (not in the repo).

## Requirements

[bun](https://bun.sh) 1.4, Node.js (for `npx hyperframes`, pinned to 0.8.164), ffmpeg with libx264, and
[uv](https://docs.astral.sh/uv/). The analysis needs, in practice, an NVIDIA GPU; its models download a few GB of
weights into `analysis/.cache/`. Run `cd tools && bun install` once.

## Making a video

```sh
./vid new my-song --audio ~/song.wav --transcript ~/lyrics.txt --title "My Song"   # projects/my-song/
./vid analyze my-song             # sheet -> stems -> vocal features -> CTC -> Whisper -> sung -> align -> beats
./vid status my-song              # which steps are current
./vid video my-song               # the HyperFrames project at projects/my-song/video/
#   ... build it with /music-to-video (AGENTS.md) ...
./vid assemble my-song            # index.html from STORYBOARD.md, plus the overlays
./vid snap my-song [02-sent] --at 12.5,14   # stills + contact sheet (one frame on its own, or the whole film)
./vid proof my-song --to 30       # a 60 fps proof of the first 30 s
./vid master my-song              # renders/video.mp4 + the master's audio -> out/my-song.mp4
```

Non-WAV audio is decoded once to a 48 kHz WAV. `./vid video` reruns safely after any analysis change: it refreshes
`assets/bgm.mp3`, `audiomap.json` (with our tracked beat grid in place of the skill's) and `lyrics.json`, and
never touches the brief, storyboard or frames.

## Analysis

Each step runs only when its inputs changed (content hashes in `work/steps.json`; a changed script does not count,
use `--force step,step`). Committed data without a record is adopted, not recomputed; steps listed in
`project.json`'s `frozen` never run.

| step | script (`analysis/`) | writes |
|---|---|---|
| sheet | `lyrics_sheet.py` | `data/lines.txt`, `data/sections.json`: `[Section - note]` headers, or stanzas (a repeated stanza is a chorus) |
| stems | `separate.py` | Demucs htdemucs_ft stems (GPU) |
| vocal | `vocal_feats.py` | vocal pitch, loudness and onsets |
| ctc | `ctc_emissions.py` | MMS_FA and wav2vec2-LV60K emissions on the vocal stem's mono, left and right channel (GPU) |
| whisper | `whisper_run.py turbo` | faster-whisper word timestamps; the prompt lists the sheet's uncommon words unless `tuning.py` sets one |
| sung | `sung.py` | `data/sung.json`: lines the vocal sings differently from the sheet, kept only when the CTC alignment of the line scores at least 8 better with them |
| align | `align.py --plots` | `data/lyrics.json`, a QA plot per line and `work/qa/align_report.md` (the words below confidence 0.6) |
| beats | `analyze.py` | `data/audio.json` |

`analyze.py` detects the tempo window, constant or tracked grid (tracked when a constant grid's local phase error
spreads over 40 ms), the bar phase and the sections, and records how in `audio.json`'s `detected`. Numbers in the
sheet are aligned as spoken words ("2021" → "twenty twenty one").

What it cannot detect goes into the project's `tuning.py`: word starts corrected on the plots (`FIX`, `ANCHORS`),
pronunciations (`PRON`), lines sung differently from the sheet (`SUNG`), and any setting pinned instead of detected
(`TEMPO_RANGE`, `GRID`, `BAR_PHASE`, `SECTION_BARS`, `WHISPER_PROMPT`). Stems and work files are stamped with the
master's SHA-256, so a changed master never reuses stale caches.

Inspection tools, all with `--project <id>`: `tempo_probe.py` (tempogram peaks and the search window),
`sections_bars.py` (the section table), `zoom.py 52.8 58.8 zoom_chorus1` (a zoomed spectrogram/pitch/onset plot with
the beat grid).

Harvest's `data/lyrics.json` predates this pipeline (aligned on an mp3 decode with manual corrections that are not
in its `tuning.py`), so its `sung` and `align` steps are frozen: do not re-align it.

## Checks

`./vid check` runs the repository gates: no tracked file over 5 MB outside `projects/*/input/`, the `tools/`
typecheck and tests, and Ruff and the tests for `analysis/` (from `analysis/tests/`'s own small `uv.lock`: NumPy,
pytest, Ruff). CI runs it on every push and pull request (bun 1.4.2, uv 0.11.21, Python 3.12). To run it before
every commit: `git config core.hooksPath .githooks`.

`./vid check --full` also reruns `analyze.py` for every project and requires it to reproduce the committed
`data/audio.json` byte for byte (into `out/check/<id>/`, never over the project's data). It needs the analysis
environment and each project's `work/stems/`.

## Credits

- **Songs:** NEAD.
- **Analysis and pipeline origins:** [mexicat/pdoom-video](https://github.com/mexicat/pdoom-video), MIT.
- **Fonts:** Barlow, IBM Plex Mono, Instrument Serif and Caveat Brush (SIL Open Font License; licenses beside them in
  `projects/*/video/assets/fonts/`).

## License

The code is released under the [MIT License](LICENSE). The fonts keep their own licenses, and the songs and lyrics
(`projects/*/input/`, `projects/*/data/`) are not covered by it: they belong to their authors.
