# Force Push — inputs, timing provenance, validation

## Inputs

| what | file | identity |
|---|---|---|
| master (one time reference; analysis + export) | `audio/Force Push.wav` | PCM s16le, 48 kHz stereo, 10,062,720 frames = 209.640 s; sha256 `d991901177a38f642ef1339a7d8ed1440debfb75f6f319a88c1a651eee969698`; metadata: "made with suno", 2026-10-10 |
| browser preview | `audio/force-push.mp3` | encoded from the master (`ffmpeg -i "audio/Force Push.wav" -map 0:a -c:a libmp3lame -q:a 2 -ar 48000`); a gapless decode is sample-aligned with the master (0-sample lag at 20, 100 and 180 s, correlation 0.998) |
| supplied MP3 (unused) | `audio/Force Push.mp3` | same mix as the WAV (also 0-sample lag after a gapless decode), carries cover art; kept as supplied |
| lyric sheet (authoritative text, left as written) | `lyrics/force-push.txt` | 14 sections, 64 sung lines, 3 direction markers ([Stop] ×2, [End]) |
| sung lines / sections (derived) | `lyrics/force-push/lyrics.txt`, `sections.json` | `analysis/lyrics_sheet.py --song force-push` |

The preview MP3 is only for the browser; every export muxes the WAV. A browser that ignored the MP3's LAME
gapless header would play up to one MP3 frame (24 ms) late in the preview only.

### Where the vocal differs from the sheet

Two lines are sung differently from the sheet. The derived lines file follows the vocal (the sheet is
untouched; the corrections and their evidence are in `analysis/songs/force_push.py`, `SUNG`):

- **Pre-chorus 1** sings the stage direction: "**Stop, one beat** and you're gone" (sheet: "One command and
  you're gone"). Both Whisper runs ("Stop one beat and you're gone", word probabilities 0.97 / 0.91 / 0.82), a
  greedy decode of the wav2vec2-LV60K emissions on the mono, left and right vocal stem ("stop one beat an
  you're gone"), and constrained CTC Viterbi scores over 51.0–54.2 s (−199.65 vs −224.28) agree.
- **Pre-chorus 2**: "No more reading your logs, **and now** you want a revert?" (sheet: "…logs at night / You want
  a revert?"). Whisper (both runs) and LV60K agree; Viterbi over 109.0–112.9 s: −113.21 vs −130.06. In
  pre-chorus 1 the same comparison is a near tie (−86.30 vs −89.89) and Whisper hears "at night", so the sheet
  stands there.

The video uses both: the singer literally sings "Stop," so the pre-chorus stage freezes on it.

## Timing

All emitted data carries `source` (song, file, sha256, sample rate, frames, duration). Stems, work files and
QA plots live in per-song directories stamped with the master's hash (`analysis/common.py`, `check_source`).

- **Stems:** Demucs htdemucs_ft on the master (CUDA, RTX 5070 Ti, 20 s), `analysis/stems/htdemucs_ft/force-push/`.
- **Tempo:** `tempo_probe.py` → 129.2 BPM (tempogram peaks 129.2, 132.5, 65.4); a constant fit in 122–137 BPM
  gives 130.505 BPM but its kick residuals drift from +140 ms (verse 1, ~129.3 BPM) to −105 ms (the end,
  ~130.7 BPM) and wrap by most of a beat across the kick-less 24–40 s. So the grid is **tracked**
  (`analyze.py`, `GRID = "tracked"`): librosa dynamic-programming beat tracking on drum+mix onsets with the
  fitted tempo as prior (tightness 1600), each beat moved by the median kick-attack residual of its ±8 beats.
  Result: 456 beats, periods 418–477 ms, kick residual sd 9.8 ms (constant grid: 20.9 ms with the drift).
- **Bar phase:** the snare backbeat sits on tracked beats 1 and 3 (mod 4) through the whole song without a
  slip, so downbeats are beat 0 or 2; `BAR_PHASE = 0` puts every chant "Force!" and every chorus "PUSH!" on a
  downbeat and gives regular phrases (12-bar choruses, 4-bar post-choruses, an 8-bar drop).
- **Sections:** `sections_bars.py` (a section starts on the latest downbeat at or before its first sung word).
- **Words:** fused CTC alignment (MMS_FA + LV60K on mono/L/R) with signal refinement, cross-checked against
  faster-whisper large-v3-turbo (CPU: ctranslate2 cannot use this machine's CUDA 13) and the individual
  models. Every disagreement was inspected on zoomed spectrogram/pitch/onset plots against the beat grid
  (`analysis/qa/force-push/zoom_*.png`); one anchor and 14 manual word starts (`FIX`), mostly the gang chants'
  "Force!" (which the held "there" of the line before had absorbed) and the first chorus's shouted "PUSH!".
  Least certain: the chants' "(hey!)" and "Like you've never" (±100 ms, voices over each other), "I" in
  "Keep your local copy, I don't care" (69.9 or ~70.4 s).
- **Structure found:** spoken intro over a filtered beat (0–9.5 s); a pad with light drums (9.5–16.8 s, a
  hum in the vocal stem, no lyric); the full kit enters on "Three years" (16.8 s); the bridge has no drums
  until a 3 s drum build (159.0–161.9 s) into the a cappella; the drop lands on "PUSH!" (169.86 s); the beat
  cuts out at 190.2 s; after "I can wait." the hard hit (197.43 s) starts ~7 s of full band with a "dun-dun"
  vocal chant, the drums stop at ~204.6 s and the chant ends alone at ~209 s.

## Validation

Run from `app/` unless noted.

| check | command | result |
|---|---|---|
| types (app, unfiltered) | `bunx tsc --noEmit -p tsconfig.json` | pass |
| types (scripts, unfiltered) | `bunx tsc --noEmit -p tsconfig.scripts.json` | pass |
| unit tests | `bun test` | 18 pass: song config and selection (incl. the Python pipeline agreeing on song and paths, unknown songs failing), page URL propagation, cue sheet resolution and its error reports (missing, ambiguous, out-of-range occurrence, missing anchor word, wrong section, uncovered line), timeline tiling 0–209.64 s with no gaps or overlaps, no cut into a still-sung line, every entry's module present |
| cue doc current | `bun scripts/cues.ts --check` | pass |
| seek / order determinism | `bun scripts/render.ts check --song force-push --samples 4 --shutter 0.2` | 7 frames across the song: 5 byte-identical in order, reverse and after far seeks; 2 within 1–3 levels on < 10 px (Chrome's GPU Canvas2D rasterises a dashed hairline a level differently on a path's first draw) |
| Harvest regression | Harvest stills at 9 times from a `git archive` of HEAD vs the current tree, with `--song harvest` and with no flag | 17 of 18 byte-identical; 1 at PSNR 81.7 dB, max 4 levels (the same first-draw rasteriser variance) |
| Harvest analysis regression | Harvest `analyze.py` into a scratch dir vs the committed `data/audio.json` | every data field identical (beats, downbeats, sections, onsets, envelopes); only `notes` reworded and `source`/`grid`/`tempo_range` added |
| Harvest lyric derivation | `uv run python lyrics_sheet.py --song harvest --check` (in `analysis/`) | reproduces `lyrics/lyrics.txt` and `lyrics/sections.json` exactly |
| 1080p / 4K layout | stills at `--scale 1` and `--scale 2` (58.6, 95.4, 206.8 s), the 4K ones area-downscaled | PSNR 36–39 dB: same layout (the remaining difference is the per-physical-pixel grain and sharper antialiasing) |

## Render

GPU path verified with `bun scripts/render.ts gpu --song force-push`: `ANGLE (Microsoft Corporation, D3D12 (NVIDIA GeForce RTX 5070 Ti), OpenGL 4.2)` (headed Chrome through WSLg).

| | command | result |
|---|---|---|
| frame cost | `perf --song force-push --from 53 --to 58 --samples 1` (also 76–81, 96–100) | 54–59 ms avg per frame incl. readback (p95 66–70 ms); one sub-frame is mostly Canvas2D drawing |
| draft | `video --song force-push --samples 4 --preset veryfast --workers 3 --out ../out/force-push-draft.mp4` | 12,578 frames in 11:12 (17.6 fps) |
| final | `video --song force-push --samples auto --shutter 0.2 --workers 3` → `out/force-push.mp4` | 12,578 frames in 35:01 (5.6 fps); sub-frames per frame 12: 10,917 · 36: 1,266 · 108: 307 · 324: 88. Adaptive vs fixed 36 / fixed 12 compared on the fastest slam (61.34 s): no visible difference; auto chose 36 there |

`out/force-push.mp4`: H.264 High, yuv420p, BT.709-tagged, 1920×1080, 60 fps, 12,578 frames, 209.633 s, 14.0 Mb/s;
AAC-LC 48 kHz stereo from the WAV master, 209.621 s (the last AAC frame ends 19 ms before the master, inside the
final fade). The muxed audio decodes sample-aligned with the master (0-sample lag at 20, 100 and 180 s, correlation
0.9999). Frames at known vocal events (FORCE 53.44, PUSH 61.33, the chant's Force! 76.12, the hit 197.43) show
the matching action. No black stretch ≥ 0.25 s (ffmpeg blackdetect). A listening/playback check by ear was not
possible here.

## Limitations

- Word timings for the gang chants' "(hey!)" and "Like you've never" are ±100 ms; the rest ~30–50 ms.
- Chrome's GPU Canvas2D rasterises a handful of hairline pixels 1–4 levels differently on a path's first draw, so
  frames are equivalent, not always byte-identical, across render orders (measured above).
- A recurring "Failed to load resource (404)" browser log line appears with the headed Chrome used for rendering
  (not with headless; most likely the favicon request); it does not affect the renders.
