# Harvest Now, Decrypt Later — music video

A generative, code-rendered music video with word-synced karaoke typography. Every frame is a deterministic function of song time, so the live preview in the browser and the offline 1080p60 (or 4K60) export are identical.

The song is sung by the eavesdropper: it intercepts a message in 2021, keeps an encrypted copy, waits patiently while the archive grows, and reads it the year the key falls out. The video tells that as thirteen engraved "plates" (a protocol diagram, a cold-store rack, a patience dial, a dilution refrigerator, a backlog ticket…), cold glacier blue for three minutes and warm only when the key falls out. The concept, style bible and line-by-line cue sheet are in [`docs/TREATMENT.md`](docs/TREATMENT.md); the engine and scene API in [`docs/ENGINE.md`](docs/ENGINE.md).

This repo is a fork of [mexicat/pdoom-video](https://github.com/mexicat/pdoom-video) (MIT): the engine, the timing pipeline and the render tooling come from there; every song-specific part has been replaced. The video was made with Claude (Opus 5.5) in Claude Code.

## Layout

- `audio/harvest.wav` — the master (48 kHz WAV). `audio/harvest.mp3` is a copy the browser preview plays; the export muxes the WAV.
- `lyrics/harvest-lyrics.txt` — the lyric sheet with its section headers; `lyrics/lyrics.txt` (one sung line per row) and `lyrics/sections.json` (the song form) are derived from it.
- `analysis/` — Python (uv) tools that produced the timing data: Demucs stem separation, CTC forced alignment cross-checked with Whisper (faster-whisper, CUDA), beat/downbeat/onset analysis.
- `data/lyrics.json` — word-level lyric timings. `data/audio.json` — tempo (96.71 BPM), beats, downbeats, sections, onsets and loudness envelopes.
- `app/` — the renderer: TypeScript + three.js, bun + Vite.
  - `src/song.ts` — the song's file names (the analysis has its own copy in `analysis/common.py`).
  - `src/timeline.ts` — the edit: thirteen entries, each cut on the last beat before its first lyric line.
  - `src/scenes/` — one module per plate: `send`, `ice`, `keep`, `wait` (the three choruses), `qubits`, `passwords`, `newmath`, `ticket`, `petabytes`, `thaw`, `secure`; `_kit.ts` holds what they share (karaoke text, the year/archive counters, stamps, hatching, the padlock).
  - `src/engine/` — renderer core (unchanged from upstream apart from the palette).
  - `scripts/render.ts` — offline renderer (Chrome → raw frames over WebSocket → ffmpeg).
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

## Render the video

```sh
cd app
bun scripts/render.ts video --samples auto --shutter 0.2 --out ../out/harvest.mp4
```

- **Output:** 1920×1080 at 60 fps, x264 CRF 16, AAC audio from the WAV master.
- **Draft:** `--samples 4 --preset veryfast` renders a quick draft.
- **4K:** add `--scale 2` (and `--x264 aq-mode=3:rc-lookahead=30`).
- **Checking a scene:** `bun scripts/render.ts stills --t 52.0,58.9 --only wait1 --out ../out/wip/wait1`, or `sheet --cuts` for a contact sheet of every scene boundary.

Motion blur, adaptive sampling and the render pipeline are described in [`docs/ENGINE.md`](docs/ENGINE.md).

## Regenerate the timing data

The committed `data/*.json` files are all the renderer needs. To regenerate them (or to start from a new song: put its WAV in `audio/`, its lyric sheet in `lyrics/`, and set `SONG` in `analysis/common.py` and `app/src/song.ts`):

```sh
cd analysis
uv sync
uv run python -m demucs -n htdemucs_ft -d cuda -o stems ../audio/harvest.wav
uv run python tempo_probe.py          # check TEMPO_RANGE in analyze.py
uv run python ctc_emissions.py && uv run python vocal_feats.py && uv run python whisper_run.py
uv run python analyze.py              # data/audio.json
uv run python align.py --plots        # data/lyrics.json + QA plots in analysis/qa/
uv run python sections_bars.py        # suggests SECTION_BARS for analyze.py; paste it in and rerun analyze.py
```

Check the words `align.py` reports with low confidence against the plots in `analysis/qa/`, and correct them in `FIX` in `align.py` if needed. The models download a few GB of weights into `analysis/.cache/`.

A new song also needs new scenes: the plates look lyric lines up by their text, so they only work with this song's lyrics.

## Credits

- **Song:** "Harvest Now, Decrypt Later". <!-- TODO: songwriter / performer credit -->
- **Engine and tooling:** [mexicat/pdoom-video](https://github.com/mexicat/pdoom-video), MIT.
- **Fonts:** Archivo, IBM Plex Mono and Cormorant Garamond (SIL Open Font License). Single-stroke EMS and Hershey fonts via the `hersheytext` package (OFL / public domain).

## License

The code is released under the [MIT License](LICENSE). The fonts in `app/public/fonts/` keep their own licenses (see Credits), and the song and lyrics (`audio/`, `lyrics/`, `data/lyrics.json`) are not covered by it: they belong to their authors.
