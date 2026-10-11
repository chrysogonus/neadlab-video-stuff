# Harvest Now, Decrypt Later · Force Push — music videos

Generative, code-rendered music videos with word-synced karaoke typography, one renderer for several songs
(selected with `?song=` / `--song`, see [Songs](#songs)). Every frame is a deterministic function of song time, so the live preview in the browser and the offline 1080p60 (or 4K60) export are identical.

**Force Push** is a breakup told in Git: a repository called `us`, a commit graph whose `origin/main` gets force-pushed three times, and an ending where the reflog forgets. Treatment: [`docs/FORCE-PUSH-TREATMENT.md`](docs/FORCE-PUSH-TREATMENT.md); cue sheet: [`docs/FORCE-PUSH-CUES.md`](docs/FORCE-PUSH-CUES.md); inputs, provenance and validation: [`docs/FORCE-PUSH-NOTES.md`](docs/FORCE-PUSH-NOTES.md).

**Harvest Now, Decrypt Later** is sung by the eavesdropper: it intercepts a message in 2021, keeps an encrypted copy, waits patiently while the archive grows, and reads it the year the key falls out. The video tells that as thirteen engraved "plates" (a protocol diagram, a cold-store rack, a patience dial, a dilution refrigerator, a backlog ticket…), cold glacier blue for three minutes and warm only when the key falls out. The concept, style bible and line-by-line cue sheet are in [`docs/TREATMENT.md`](docs/TREATMENT.md); the engine and scene API in [`docs/ENGINE.md`](docs/ENGINE.md).

This repo is a fork of [mexicat/pdoom-video](https://github.com/mexicat/pdoom-video) (MIT): the engine, the timing pipeline and the render tooling come from there; every song-specific part has been replaced. The video was made with Claude (Opus 5.5) in Claude Code.

## Layout

- `songs.json` — the songs: each one's master, preview, lyric sheet, data directory, default output and analysis paths. The app and the analysis pipeline both read it.
- `audio/` — masters (48 kHz WAV) and the MP3s the browser preview plays (the export muxes the WAV): `harvest.wav`/`.mp3`, `Force Push.wav` (master) / `force-push.mp3` (preview, encoded from the master).
- `lyrics/` — lyric sheets with section headers (`harvest.txt`, `force-push.txt`) and the files derived from them by `analysis/lyrics_sheet.py`: Harvest's `lyrics.txt` + `sections.json`, Force Push's `force-push/lyrics.txt` + `force-push/sections.json`.
- `analysis/` — Python (uv) tools that produced the timing data: Demucs stem separation, CTC forced alignment cross-checked with Whisper (faster-whisper, CUDA), beat/downbeat/onset analysis.
- `data/lyrics.json`, `data/audio.json` — Harvest's word timings and music analysis (96.71 BPM). `data/force-push/` — Force Push's (tracked beat grid, ~130.5 BPM).
- `app/` — the renderer: TypeScript + three.js, bun + Vite.
  - `src/songs.ts` — the song registry over `songs.json`; `src/timelines.ts` — one timeline factory per song.
  - `src/timeline.ts` — Harvest's edit: thirteen entries, each cut on the last beat before its first lyric line.
  - `src/timeline-force-push.ts` + `src/force-push/` — Force Push's edit, built from the typed cue sheet (`cues.ts`, resolved and validated by `resolve.ts`), its style tokens and drawing kit (`kit.ts`) and the commit-graph geometry (`graph.ts`).
  - `src/scenes/` — Harvest's plates (`send`, `ice`, `keep`, `wait`, `qubits`, `passwords`, `newmath`, `ticket`, `petabytes`, `thaw`, `secure`; shared code in `_kit.ts`) and Force Push's scenes (`force-push-*.ts`).
  - `src/engine/` — renderer core (from upstream; changed here: the palette, per-song data loading, scene render errors recorded so an export fails).
  - `scripts/render.ts` — offline renderer (Chrome → raw frames over WebSocket → ffmpeg); `scripts/cues.ts` writes the Force Push cue sheet doc.
  - `test/` — `bun test`: song configuration and selection, the cue sheet's validation, timeline coverage.
- `out/` — renders (not in the repo).

## Requirements

[bun](https://bun.sh), Google Chrome and ffmpeg with libx264. The analysis tools need [uv](https://docs.astral.sh/uv/) and, in practice, an NVIDIA GPU.

On WSL2 the render script uses Chrome through WSLg's X display, which gets hardware GL (ANGLE over D3D12); a headless Chrome there falls back to software. It expects Chrome at `~/opt/chrome/opt/google/chrome/chrome` (override with `CHROME_PATH` or `--chrome`). `bun scripts/render.ts gpu` prints the renderer Chrome ended up with.

## Preview

```sh
cd app
bun install
bunx vite
```

Open http://localhost:5173 and use the keys below. `?t=23` starts at a given time.

| Key | Action |
|---|---|
| space | play / pause |
| ← / → | seek ±1 s (±5 s with shift) |
| `,` / `.` | step one frame |
| `[` / `]` | previous / next scene |
| `l` | loop the current scene |
| `h` | hide the UI |

## Songs

Each song in `songs.json` has its own master, preview, data, timeline and default output; nothing falls back to another song's assets, and an unknown song fails with the list of known ones. Without a selection the default is Harvest.

- Preview: http://localhost:5173/?song=force-push (keeps `?t=`, `?only=`, `?scale=`).
- Renderer: `--song force-push` in every mode of `scripts/render.ts`.
- Analysis: `--song force-push` on any `analysis/` script (or `SONG=force-push`).

## Render the video

```sh
cd app
bun scripts/render.ts video --song force-push --samples auto --shutter 0.2      # → out/force-push.mp4
bun scripts/render.ts video --song harvest --samples auto --shutter 0.2         # → out/harvest.mp4
```

- **Output:** 1920×1080 at 60 fps, x264 CRF 16, AAC audio from the song's WAV master.
- **Draft:** `--samples 4 --preset veryfast` renders a quick draft.
- **4K:** add `--scale 2` (and `--x264 aq-mode=3:rc-lookahead=30`).
- **Checking a scene:** `bun scripts/render.ts stills --song force-push --t 54.6,58.6 --only chorus1 --out ../out/wip/chorus1`, `sheet --song force-push --cuts --out ../out/force-push-cuts.png` for every scene boundary, `perf --song force-push --from 53 --to 58 --samples 1` for frame times.
- **Checks:** `bun test` (configuration, cue sheet, timeline); `bunx tsc --noEmit -p tsconfig.json && bunx tsc --noEmit -p tsconfig.scripts.json` (types); `bun scripts/render.ts check --song force-push --samples 4` (frames identical in order, in reverse and after seeks); `bun scripts/cues.ts --check` (the cue doc is current).
- A scene that fails to load or throws while rendering fails the run.

Motion blur, adaptive sampling and the render pipeline are described in [`docs/ENGINE.md`](docs/ENGINE.md).

## Regenerate the timing data

The committed data files are all the renderer needs. To regenerate a song's (here Force Push; for a new song add it to `songs.json` with a constants module in `analysis/songs/`, and a timeline in `app/src/timelines.ts`):

```sh
cd analysis
uv sync
S="--song force-push"
uv run python lyrics_sheet.py $S       # sheet -> sung lines + sections (applies the song's SUNG corrections)
uv run python separate.py $S           # Demucs stems of the master
uv run python tempo_probe.py $S        # check TEMPO_RANGE in analysis/songs/<song>.py
uv run python ctc_emissions.py $S && uv run python vocal_feats.py $S && uv run python whisper_run.py turbo $S
uv run python analyze.py $S --plots    # audio.json (GRID "tracked" follows a drifting tempo)
uv run python align.py $S --plots      # lyrics.json + QA plots in analysis/qa/<song>/
uv run python sections_bars.py $S      # suggests SECTION_BARS; paste it into analysis/songs/<song>.py, rerun analyze.py
uv run python zoom.py 52.8 58.8 zoom_chorus1 $S   # zoomed spectrogram/pitch/onsets with the beat grid, for checking words
```

Song-specific constants (tempo window, grid, bar phase, section map, Whisper prompt, pronunciations, alignment anchors and fixes, sung-lyric corrections) live in `analysis/songs/<song>.py`; stems, work files and QA plots in per-song directories stamped with the master's SHA-256, so a changed master never reuses stale caches. Check the words `align.py` reports with low confidence against the plots, and correct them in that module's `FIX`. The models download a few GB of weights into `analysis/.cache/`.

A new song also needs new scenes: they look lyric lines up by their text, so they only work with their own song's lyrics.

## Credits

- **Songs:** "Harvest Now, Decrypt Later", "Force Push". <!-- TODO: songwriter / performer credit -->
- **Engine and tooling:** [mexicat/pdoom-video](https://github.com/mexicat/pdoom-video), MIT.
- **Fonts:** Archivo, IBM Plex Mono and Cormorant Garamond (SIL Open Font License). Single-stroke EMS and Hershey fonts via the `hersheytext` package (OFL / public domain).

## License

The code is released under the [MIT License](LICENSE). The fonts in `app/public/fonts/` keep their own licenses (see Credits), and the song and lyrics (`audio/`, `lyrics/`, `data/lyrics.json`) are not covered by it: they belong to their authors.
