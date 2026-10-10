# "Harvest Now, Decrypt Later" — build plan (rev 2)

Rendering `out/harvest.mp4` (1920×1080, 60 fps) from `audio/harvest.wav` and `lyrics/lyrics.txt`,
reusing the engine, timing pipeline and render tooling in this repo (a fork of
`mexicat/pdoom-video`, MIT) with every song-specific part replaced.

**Rev 2 changes:** the inputs arrived, so the plan is now written against the real song. The look
moves from rev 1's two-pane console to a **plate sequence** in the manner of the reference video.
The gates drop from three to one.

---

## 1. The inputs, as measured

| | |
|---|---|
| `audio/harvest.wav` | 48 kHz, 16-bit, stereo, **191.200 s (3:11)** — renamed from `Harvest Now, Decrypt Later.wav`; spaces and commas in a path break the render script's shell args |
| `lyrics/lyrics.txt` | **31 sung lines**, derived from `lyrics/harvest-lyrics.txt`: section headers stripped, the `(spoken)` marker stripped, whitespace normalised |
| `lyrics/sections.json` | the song form, derived from the same headers |

```
  line  section          lines
     0  Verse 1          4
     4  Pre-Chorus       2
     6  Chorus           4
    10  Verse 2          4
    14  Pre-Chorus       2
    16  Chorus           4
    20  Bridge           4
    24  Final Chorus     6
    30  Outro            1   (spoken)
```

Three consequences, all good:

1. **A WAV master deletes rev 1's §2.4 problem outright.** `STEM_OFFSET_SAMPLES` existed only
   because Demucs was fed an mp3 decode that kept the LAME encoder delay. With no mp3 anywhere in
   the analysis path there is no delay to correct: the offset is 0 by construction, and no
   cross-correlation is needed to prove it.
2. **The bracketed headers give `SECTION_BARS` almost for free.** Rev 1 budgeted guesswork plus
   listening; now each section's first line is known, so the bar map is "look up the bar of line
   0, 4, 6, 10, …" against the fitted beat grid. Mechanical.
3. **`analysis/` needs no ffmpeg.** `librosa`/`soundfile` read the WAV natively, so steps 4–5 can
   run before ffmpeg or Chrome exist. ffmpeg is needed only for the final mux in step 8.

Tokens to add to `analysis/pron.py` before aligning: `qubits` → `cue bits`,
`petabytes` → `peta bytes`, `decrypt`/`decrypted` → `dee crypt`/`dee crypted`,
`twenty-one` (the hyphen already splits into two subwords in the fallback, so verify rather than
add). Check the whole sheet with `uv run python pron.py`, which prints every line's pronunciation.

---

## 2. What I can and cannot see of the reference

The reference is **"GIBO — Rogue Little Guardian (Claude Opus 5.5 Music Video)"**
(`youtube.com/watch?v=o4cVrgbvvPo`). I can read its title; I cannot watch video, so I have not seen
a single frame of it.

What I am working from instead is this repo's own `docs/TREATMENT.md` — the style bible for the
video this engine was built to render, which describes that aesthetic in detail: a sequence of
**plates**, each with its own visual idiom (engraving, oscilloscope, bureaucratic paper, blueprint,
UI), one restrained palette and one type system across all of them, the lyric integrated
*graphically* into each plate rather than sitting on top as subtitles, per-word karaoke throughout,
hard cuts on downbeats, and a running piece of state staged inside the plates rather than in a
corner.

That is the style described in section 4 below. **If the reference departs from it in some way that
matters to you, tell me and I will adjust** — a sentence about what it looks like is worth more
than anything I can infer from a title.

---

## 3. Scope: plates, not one console

Rev 1 proposed a single parameterised scene (two fixed panes, one prop per line). That followed the
original brief's "eavesdropper's archive console" framing. Asking for the reference's look instead
changes the shape: the point of that style is that **the visual language changes every section**, so
one layout for the whole song is the wrong structure. Rev 1 §3 is superseded.

What carries over unchanged: 2D only, Canvas2D and `Layer2D`, the existing type system, determinism,
lyrics looked up by content, under 25 ms/frame. The original video's 38 scene files are a measure of
its ambition (ray-marched rooms, GLSL creatures), not of what this style requires.

**Eleven plate modules, fourteen timeline entries.** `wait` serves the three choruses.

---

## 4. The plates

The lyric is sung in first person **by the eavesdropper** — patient, possessive, fond of its
subject. That is the strongest thing the song gives the video, so the rule for every plate is: it is
an instrument the archive is using, and the archive is never in a hurry. Deadpan throughout.
Fictional names only; no real logos, no imitation of any real product's UI.

| id | section | idiom | what happens |
|---|---|---|---|
| `send` | V1 · L0–1 | engraved protocol diagram | A message leaves on a wire; handshake arrows draw one per word; the little padlock closes on the downbeat; the plaintext collapses into a hatched ciphertext slab. The lyric is written along the wire by a plotter pen (`stroke.ts`). |
| `ice` | V1 · L2–3 | elevation drawing + frost hatching | The slab is pure hatch — unreadable, and nobody tries. A copy is struck (two slabs), racked into a cold-store shelf elevation, one cartridge sliding home; frost crystallises over it in engraving hatch. |
| `keep` | PC1 · L4–5 | typography, mostly black | The thesis, and the quietest plate in the video. `BREAK` set huge and struck through; `KEEP` stamped over it. Slow, enormous negative space. |
| `wait` ×3 | C1 · L6–9<br>C2 · L16–19<br>FC · L24–29 | the hook plate | The recurring slam. A patience instrument: a hairline dial advancing one tick per bar, and the year readout. The title line lands one word per hit. Escalating: (1) clean, bone on ink; (2) inverted, heavier, the dial crowded with ticks; (3) past tense — the dial completes and the type goes maximal. |
| `qubits` | V2 · L10–11 | blueprint, plan and section | A dilution fridge drawn in section; the qubit count doubles on the beat. A ruler of years slides left so that the "decade" marker arrives under the playhead exactly on "nearly here". |
| `passwords` | V2 · L12–13 | UI-as-paper · **inverted** | A password field retyped per word — and behind it the archive slab, unchanged. Then two record cards, a blueprint and a birthday, both still perfectly legible. The archive does not react; that is the joke. |
| `newmath` | PC2 · L14–15 | lattice geometry | Post-quantum lattice handed across the frame. "Get around to that" becomes a backlog ticket sliding in from the right — foreshadowing `ticket`. |
| `ticket` | Bridge · L20–21 | bureaucratic paper · **inverted** | `PRIORITY: LOW`. The due date is stamped and re-stamped four times, each a quarter later, each previous one struck through. |
| `petabytes` | Bridge · L22–23 | scale grid + Cormorant | The question is asked in a small mono callout. The answer is a grid of storage cells filling and a unit ticking KB → MB → … → PB, with the last line in Cormorant italic — the one tender moment in the video. |
| `thaw` | FC · L26–27 | reversal of `send` + `ice` | The fridge hums; the key falls out; plate 1's padlock opens; the slab's hatching resolves into readable text. The penultimate line lands on the resolved plaintext. |
| `secure` | Outro · L30 | bookend | The spoken line. The crop-mark frame closes back in and the padlock sits closed again, so the first and last frames match and the video loops — the same `post.frame` trick the original uses. |

If the schedule needs cutting, three plates collapse cleanly: `newmath` into `ticket`, `ice` into
`send`, `passwords` into `qubits`. That is the full arc in eight.

### Palette: one cold accent, and orange reserved

The repo's palette is ink / bone / **`signal` hazard-orange**. Orange is the wrong temperature for a
song about cold storage — so: add one palette key, a cold glacier blue-green, and let it carry the
archive for the whole video. **`signal` orange appears exactly once**, in `thaw`, when the key falls
out. The video is cold for three minutes and goes hot for four bars.

This costs one entry in `palette.ts` and nothing else: the post chain's halation is tuned for
red-orange, and since orange now only appears at the payoff, that tuning lands precisely where it
should. `acid` stays unused.

### Type, karaoke, state

- **Type.** Archivo is the lyric's voice; IBM Plex Mono is every machine surface (labels, counters,
  stamps, hex, timestamps); Cormorant italic gets two moments only — `petabytes` and `secure`.
- **Karaoke.** Per-word everywhere, via `Lyrics.wordProgress`, and integrated differently in each
  plate: written by the pen in `send`, stamped in `keep` and `ticket`, typed in `passwords`,
  engraved into the grid in `petabytes`. Anticipation up to 0.4 s; the highlight is never early.
- **State.** Two running values, staged inside the plates rather than in a corner readout, exactly
  as the original stages its P(doom): **the year**, from the Tuesday in the first line up to the
  year the key falls out, and **the archive size**, climbing monotonically. Each plate shows them in
  its own idiom — a dial label, a shelf tag, a form field, a cell count.
- **Light/dark rhythm.** Rather than rev 1's global light-to-dark drift, two plates invert to bone
  paper (`passwords`, `ticket`), which is what gives the reference's edit its rhythm.

---

## 5. Step by step

One gate, at the end of step 6.

### Step 1 — toolchain, no sudo required

`sudo` wants a password here, so everything installs into `$HOME`:

```sh
curl -fsSL https://bun.sh/install | bash                     # -> ~/.bun/bin/bun
mkdir -p ~/.local/bin ~/opt
# static ffmpeg (needs libx264; verify with: ffmpeg -encoders | grep libx264)
curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz \
  | tar -xJ -C ~/opt && ln -sf ~/opt/ffmpeg-*-static/ff{mpeg,probe} ~/.local/bin/
# Chrome, unpacked rather than installed
curl -L -o /tmp/chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
dpkg -x /tmp/chrome.deb ~/opt/chrome
```

If you would rather install them properly, `sudo apt install -y ffmpeg google-chrome-stable
mesa-utils` is the same thing with a password — type `! sudo -v` in the prompt first so the
credential is cached in this session.

### Step 2 — baseline render, before changing any scene

```sh
cd app && bun install
```

Then in `scripts/render.ts`: `--use-angle=metal` → `--use-angle=gl`, `channel: 'chrome'` →
`executablePath: <~/opt/chrome/opt/google/chrome/chrome>`, add a `gpu` mode (~12 lines; it does not
exist, despite the original brief — the modes are `stills`, `sheet`, `plates`, `perf`, `video`), and
set `MESA_LOADER_DRIVER_OVERRIDE=d3d12` in the launch env.

```sh
bun scripts/render.ts gpu
bun scripts/render.ts stills --t 12.5,60,100 --out ../out/baseline
bun scripts/render.ts perf --from 20 --to 25
```

I will report the renderer string and the ms/frame rather than stopping on them. The only thing they
decide is the final sample count: hardware GL → `--samples auto`; software GL → a fixed low count.
Either way this video renders, because it is 2D — see §7.

### Step 3 — strip the original song

On a branch. Remove `audio/pdoom.mp3`, `lyrics/lyrics.src.js`, `data/*.json`, `app/src/scenes/*`,
`app/plates.json`, `app/public/plates/*`, `docs/TREATMENT.md`. Keep `LICENSE` unchanged and
`app/public/fonts/` with its `src/OFL.txt`.

Make the song a single setting: `app/src/song.ts` exporting the audio path, imported by `main.ts`
and `render.ts`; a `SONG` constant in `analysis/common.py` that `AUDIO`/`STEMS` derive from. Sweep
`pdoom` → `video` in the same commit — beyond the obvious files that means the `window.__pdoom`
global (~15 call sites), the `PDOOM_NO_HMR` env var, the spool directory name, the default output
path and `docs/ENGINE.md`.

The browser needs a compressed stream for `<audio>`, so also:
`ffmpeg -i audio/harvest.wav -c:a libmp3lame -b:a 320k audio/harvest.mp3`. Analysis keeps using the
WAV, and the final mux takes the WAV directly, so the mp3 is preview-only and its encoder delay
never touches the timeline.

### Step 4 — analysis environment

`pyproject.toml`: drop `mlx-whisper` — macOS-only wheels, so `uv sync` fails outright on Linux and
nothing in `analysis/` runs until it is gone — and add `faster-whisper`.

```sh
cd analysis
uv python install 3.12 && uv sync
uv run python -c "import torch; print(torch.cuda.is_available(), torch.cuda.get_device_capability())"
```

The capability check matters: the 5070 Ti is Blackwell (sm_120) and needs a CUDA 12.8+ torch build.
If it reports `False`, pin the CUDA wheel index rather than dropping to CPU.

Rewrite `whisper_run.py` for `faster-whisper`, emitting the one shape `align.py:288–290` consumes
(`{segments:[{words:[{word,start,end}]}]}`), with an `initial_prompt` naming this song's jargon. In
`ctc_emissions.py:28`, use `cuda` when available.

### Step 5 — timing data

1. `common.py`: `AUDIO` → the WAV; `load_lyrics_src()` reads `lyrics/lyrics.txt` and returns
   `(None, None, text)` rows — the approximate times are genuinely unused (`align.py:359,380`
   destructure and discard them); `STEM_OFFSET_SAMPLES = 0` per §1.
2. Demucs on the WAV: `uv run python -m demucs -n htdemucs_ft -d cuda -o stems ../audio/harvest.wav`.
   Optionally the `audio-separator` karaoke lead; if skipped, trim `fused_lead` from `ALTS`
   (`align.py:29`) or confidence scoring crashes.
3. `pron.py`: add the §1 entries, then `uv run python pron.py` to read every line back.
4. `uv run python ctc_emissions.py && uv run python vocal_feats.py && uv run python whisper_run.py`
5. `analyze.py`: clear `SECTION_BARS`, run once, read the printed tempo / first beat / kick residual
   sd, then fill the bar map from `lyrics/sections.json` against that grid. Re-run.
6. `uv run python align.py --plots` → `data/lyrics.json` + QA plots in `analysis/qa/`.
7. Iterate `FIX` against the plots (`zoom.py t0 t1` for close looks). Expect real hand work: held
   notes and doubled choruses are where sung-vocal CTC fails. Two specifics for this song — the
   choruses repeat nearly verbatim, so a mis-snapped chorus will look right in isolation and wrong
   against its neighbour; and the spoken outro should align *better* than anything sung.

I will report the tempo, the kick residual sd, and every word with `conf < 0.6`.

### Step 6 — treatment

Write `docs/TREATMENT.md` from §4: palette (including the one new key), type rules, karaoke rules,
the two state values, and a cue sheet with one row per lyric line — prop, what changes in it, state
changes.

> **GATE.** Approval before any scene is written. This is the only gate, and the cheapest point in
> the plan to change your mind: a cue-sheet row costs a sentence, a built plate costs a day.

### Step 7 — HUD, timeline, scenes

Replace `PDoom` in `hud.ts` with the year/size counters, update `engine.ts:8,322,514` and the
`pdoom`/`pdoomText`/`hudCorruption` post params. Write `app/src/timeline.ts` keeping its existing
`cut()` and `after()` helpers — last beat at/before a line's first word, nearest downbeat to a
line's end — with the fourteen entries from §4.

Then the plates, in the order they appear. After each: `bun scripts/render.ts stills --t <word
starts> --only <id>` and `bun scripts/render.ts sheet --cuts`, and **look at the PNGs**. The contact
sheet at sampled word starts is the karaoke test — the highlight must be on the word being sung,
never ahead of it.

Keep a dev server without live reload for renders (`VIDEO_NO_HMR=1 bunx vite --port 5190`, then
`--url http://localhost:5190`), or a file saved mid-render reloads the page.

### Step 8 — render

```sh
bun scripts/render.ts video --samples 4 --out ../out/harvest-draft.mp4
bun scripts/render.ts video --samples auto --shutter 0.2 --out ../out/harvest.mp4   # hardware GL
bun scripts/render.ts video --samples 8    --shutter 0.2 --out ../out/harvest.mp4   # software GL
```

Then `README.md`: this video, credit to `mexicat/pdoom-video` (MIT) for the engine, the fonts and
their licences, and the render command.

---

## 6. Done when

- `bunx tsc --noEmit -p tsconfig.json` clean; no `SCENE ERRORS` and no console errors in renders.
- `grep -ri pdoom` finds only the credit line.
- All 31 lines appear on screen; contact sheets at sampled word starts show the highlight on the
  right word.
- `out/harvest.mp4` plays all 3:11 with audio in sync at 1920×1080/60.
- First and last frames match except for the padlock.

## 7. Effort and risk

| Phase | Estimate |
|---|---|
| Steps 1–3 · toolchain, baseline, strip | ~2 h, low risk |
| Steps 4–5 · analysis and alignment | Half a day to a day. The risk here is hand work on `FIX`, not engineering. |
| Step 6 · treatment | ~2 h |
| Step 7 · HUD, timeline, 11 plates | **The bulk — several days.** Roughly half a day per plate, less for the collapsible three. |
| Step 8 · render | Minutes to ~2 h of machine time |

Risks, in order:

1. **Eleven plates is the real cost.** Not technically risky, just long. The eight-plate cut in §4
   is the lever if that is too much.
2. **Alignment of sung vocals.** Mitigated by `pron.py`, the QA plots and the `conf` report; the
   near-verbatim repeated choruses need checking against each other, not just in isolation.
3. **Chrome's GL backend.** A hardware path exists on this machine — ANGLE's GL backend over Mesa's
   `d3d12` Gallium driver (`d3d12_dri.so` is present, and `/dev/dxg` exposes the RTX 5070 Ti).
   `--use-angle=vulkan` would *not* work: the only Vulkan ICDs here are lavapipe and inapplicable
   intel/radeon ones, so Vulkan silently lands on the CPU while looking like success. Unproven until
   step 2 — and affordable either way, because a 2D frame on software GL still finishes 11,472
   frames in well under two hours.
4. **torch on Blackwell.** Checked explicitly in step 4.
5. **Model weights.** ~4 GB into `analysis/.cache/`; delete after step 5.

## 8. The one thing I need from you

Approve or redirect §4 — the eleven plates, the cold palette with orange held back for `thaw`, and
the eight-plate cut if you want it smaller. Everything in steps 1–5 is independent of that answer
and I can start on it immediately.

Anything you can tell me about how the reference video actually looks (§2) also goes straight into
§4, since I am working from this repo's style bible rather than from the video itself.
