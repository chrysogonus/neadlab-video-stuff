# Harvest Now, Decrypt Later — treatment & style bible

## The idea in one paragraph

The song is sung in the first person **by the eavesdropper**. It is patient, possessive and
fond of its subject: it does not need to break anything, it only needs to keep everything until
the maths gets cheaper. So the video is not a thriller — it is **one quiet shift at an archive
console**, told as a sequence of plates, each one an instrument the archive is using. Running
underneath are the only two things that change: **the year**, and **how much has been kept**.
Nothing moves on screen that is not either being sung or being counted. The joke, every time, is
that the machine is in no hurry. Deadpan throughout; fictional names only.

The video is cold for three minutes and goes warm for exactly four bars, when the key falls out.

## Tone

- Patient, not menacing. No countdown-clock urgency, no glitch, no alarm. The threat is that
  nothing is happening *yet*.
- Precise: hairlines, real engineering-drawing conventions, lining figures, correct units.
- Funny the way a filing system is funny. The bridge is the comic centre and it is all paperwork.
- Not slop: no neon cyberpunk, no Matrix rain, no glowing padlock-shield clip art, no binary
  streams, no hooded figures, no stock "hacker" imagery. No real logos, no imitation of any real
  product's UI — a padlock *glyph* is fine, a named browser's chrome is not.
- Original: every plate is drawn from primitives. Nothing traced from an existing artwork.

## Palette (`app/src/engine/palette.ts`)

Inherited, unchanged: **ink** `#0A0A0B`, **ink2** `#151517`, **graphite** `#5E5B57`,
**ash** `#9C978F`, **bone** `#EEE9DF`.

One key is **added**: **glacier** `#3FB8CC` — a cold cyan that carries the archive for the whole
video. It is the colour of the current word, the counters, and every live readout.

**signal** `#FF4D12` is **reserved**. It appears exactly once, in `thaw`, when the key falls out —
and then the engine's red-orange halation, which is tuned for precisely that hue, finally fires.
Before that moment there is no warm colour anywhere in the video. `ember`/`blood` support that one
moment only. **acid** is unused.

Only signal/ember may exceed ~0.85 linear (i.e. bloom). Glacier and bone must stay crisp.

Two plates invert to **bone paper with ink lines** (`passwords`, `ticket`). That light/dark
alternation is what gives the edit its rhythm; there is no global light-to-dark drift.

## Typography

- **Archivo** — the lyric's voice. Big, tight, confident. Width axis for expression.
- **IBM Plex Mono** — every machine surface: labels, counters, timestamps, hex, stamps, units,
  field names. Keeps typewriter quotes where it shows typed input (`plain()`).
- **Cormorant Garamond italic** — two moments only: the last line of `petabytes`, and `secure`.
- Swiss-grid discipline, asymmetric compositions, generous negative space, hairline rules, small
  mono annotations against large display type. Kerning via `layout()`/`glyphX()` whenever a word
  is drawn in pieces. No outlined or haloed type. Typographic punctuation except in the mono voice.

## Karaoke rules (every plate)

- Per word, from `Lyrics.wordProgress`. A word highlights at its `start` and completes by its
  `end`. Anticipation is fine — show a line's words dim up to ~0.4 s early — but **the highlight
  never runs ahead of the voice**.
- Sung = glacier (signal only in `thaw`); unsung = ~35% bone, or outline.
- Each plate integrates the lyric *differently and graphically*: written by a plotter pen,
  stamped, typed into a field, engraved into a grid, set as a form value. Never subtitles on top.
- Title-safe: ≥ 96 px from the edges.
- A blinking caret or any per-frame flicker uses `frameIdx(t)`, never `Math.floor(t * 60)`.

## Global state

Two values, staged **inside** the plates in each plate's own idiom — a dial label, a shelf tag,
a form field, a cell count — never as a permanent corner readout. Both come from `Counters` in
`engine/hud.ts`, anchored to lyric lines by content, pure functions of `t`.

| | arc | anchored to |
|---|---|---|
| **year** | 2021 → 2035 | starts at the year named in L0; climbs through verse 2; four ticks across L21; stops at L26 |
| **kept** | 4.2 kB → 9.4 PB | one message at L0; monotone; crosses into PB under L23 |

The year is the plot. The size is the joke.

## Plates

13 timeline entries, 11 modules (`wait` serves the three choruses). Times are from the aligned
data and are indicative — the edit in `src/timeline.ts` derives them, and scenes look lines up by
content, never by time.

| id | lines | window | idiom |
|---|---|---|---|
| `send` | bookend + 0–1 | 0.00 – 18.3 | engraved protocol diagram |
| `ice` | 2–3 | 18.3 – 28.7 | elevation drawing + frost hatching |
| `keep` | 4–5 | 28.7 – 40.2 | typography, mostly black |
| `wait` ①| 6–9 | 40.2 – 68.1 | the hook plate |
| `qubits` | 10–11 | 68.1 – 77.7 | blueprint, plan and section |
| `passwords` | 12–13 | 77.7 – 88.6 | UI-as-paper · **inverted** |
| `newmath` | 14–15 | 88.6 – 94.8 | lattice geometry |
| `wait` ②| 16–19 | 94.8 – 119.2 | the hook plate, heavier |
| `ticket` | 20–21 | 119.2 – 128.5 | bureaucratic paper · **inverted** |
| `petabytes` | 22–23 | 128.5 – 139.1 | scale grid + Cormorant |
| `wait` ③| 24–25 | 139.1 – 148.7 | the hook plate, past tense |
| `thaw` | 26–29 | 148.7 – 177.1 | reversal of `send` + `ice` — **the one warm plate** |
| `secure` | 30 | 177.1 – 191.2 | bookend |

### `send` — the message leaves
Opens on the **closed padlock**, centred, with the crop-mark frame in (`post.frame = 1`) — this
frame and the last frame of `secure` must match. The frame flies out on the first downbeat. A
handshake diagram draws itself across the frame, one arrow per word, engraved hairlines with mono
labels; the plaintext block on the left collapses into a solid hatched **ciphertext slab** as the
padlock closes. The lyric is written along the wire by a plotter pen (`stroke.ts`,
`writtenLength` synced to word timings). Bottom right, in mono: the year, and `KEPT 4.2 kB`.

### `ice` — the copy goes on ice
The slab is pure hatching: unreadable, and nobody tries. On L3 a second slab is struck from the
first (offset, identical) and racked into a **cold-store shelf elevation** — a technical drawing
of rows of cartridges seen face-on, one sliding home on the beat. Frost crystallises over it in
engraving hatch, growing per word. The lyric is set as shelf labels, each word a tag on the rack.

### `keep` — the thesis
The quietest plate. Vast black. `BREAK` set enormous in Archivo 900 and struck through on L4;
`KEEP` stamped over it on L5, slightly rotated, ink texture. Almost nothing else: one hairline
rule, the counters very small. Slow. This is the plate that explains the whole video.

### `wait` ×3 — the hook plate
A **patience instrument**: a hairline dial, 360° = the whole wait, with a hand that advances one
tick per bar and a mono year readout at its centre. The title line lands one word per hit, full
frame. Escalation:
- **①** clean, bone on ink, dial nearly empty, type at a civil size.
- **②** inverted ground, heavier weight, the dial crowded with accumulated ticks, the `KEPT`
  figure now large enough to read across the room.
- **③** past tense. The dial completes and keeps going. Type maximal. The year stops advancing.

### `qubits` — the machine being built
A **dilution fridge in section**: the real thing is a chandelier of stacked plates, which draws
beautifully in hairline. The qubit count doubles on the beat, each new one a dot on the lattice.
On L11 a **ruler of years** slides left so the `DECADE` marker arrives under the playhead exactly
on the word that names it. The lyric is set as annotation callouts with leader lines.

### `passwords` — futility (inverted)
Bone paper. A password field is retyped per word on L12, dots filling, a green `CHANGED` tick.
Behind it, unchanged and unbothered, the archive slab from `ice`. On L13 two record cards slide
out — a blueprint and a birthday — both still perfectly legible, stamped `STILL VALID`. The
archive does not react to the password change at all. That is the entire joke; play it straight.

### `newmath` — the offer
Post-quantum **lattice geometry**: a point lattice with a short basis and a long one, drawn as
real geometry, handed across the frame on L14. On L15 the lyric becomes a backlog ticket that
slides in from the right and parks — foreshadowing `ticket`.

### `ticket` — the bridge (inverted)
Bone paper, ink, the comic centre. A ticket: `PRIORITY: LOW`, mono fields, a reference number.
On L21 the due date is stamped and re-stamped **four times**, one per bar, each a quarter later,
each previous one struck through, the stamps overlapping and getting sloppier. The year counter
ticks with them.

### `petabytes` — scale
L22's question is asked in a small mono callout with a leader line, as if someone genuinely asked.
The answer is a **grid of storage cells** filling across the frame while the unit ticks
KB → MB → GB → TB → **PB**, crossing over exactly under the word. Then everything stops, and the
last line is set alone in **Cormorant italic** — the one tender moment in the video, and the only
place the archive admits to enjoying itself.

### `thaw` — the one warm plate
The reversal. On L26 the fridge from `qubits` returns and its hum is drawn as a settling waveform;
the key falls out as a literal object, and **signal orange enters the video for the first time** —
the padlock from `send` opens, and the halation fires. On L27 the ciphertext slab's hatching
resolves, line by line, into readable text behind the lyric. L28–29 are the inversion: the title
line runs backwards through its own animation from `wait`, past tense, warm.

### `secure` — bookend
The spoken line, set in Cormorant italic, small, centred. Everything else leaves. The crop-mark
frame closes back in and the **padlock sits closed again**, exactly as in frame 1 — so the first
and last frames match and the video loops.

## Cue sheet

`•` = the prop beat that pays the line off. Year/kept are the values *reached* by the line's end.

| # | t | plate | line opens with | prop beat | year | kept |
|---|---|---|---|---|---|---|
| 0 | 8.50 | `send` | "You sent it…" | • wire draws L→R, one arrow per word | 2021 | 4.2 kB |
| 1 | 13.68 | `send` | "A little green padlock…" | • the padlock closes on the downbeat | 2021 | 4.2 kB |
| 2 | 18.30 | `ice` | "I couldn't read…" | • slab is pure hatch; a cursor gives up | 2021 | 4.2 kB |
| 3 | 23.45 | `ice` | "I made myself a copy…" | • second slab struck, racked, frost grows | 2021 | 8.4 kB |
| 4 | 28.70 | `keep` | "I don't have to break you" | • BREAK struck through | 2021 | 1.1 MB |
| 5 | 33.07 | `keep` | "I only have to keep you" | • KEEP stamped over it | 2021 | 1.1 MB |
| 6 | 40.20 | `wait` ① | "I'll wait for you…" | • dial appears, hand starts | 2021 | 40 MB |
| 7 | 45.21 | `wait` ① | "Every byte…" | • KEPT figure ticks per word | 2022 | 310 MB |
| 8 | 50.22 | `wait` ① | "I'll see you…" | • hand sweeps a quarter | 2022 | 1.4 GB |
| 9 | 54.71 | `wait` ① | title line | • one word per hit, full frame | 2023 | 6.0 GB |
| 10 | 68.14 | `qubits` | "They're stacking up…" | • qubit count doubles on the beat | 2024 | 22 GB |
| 11 | 73.07 | `qubits` | "The experts said a decade…" | • year ruler slides; DECADE arrives | 2031 | 60 GB |
| 12 | 77.74 | `passwords` | "You changed all…" | • field retyped per word, CHANGED | 2031 | 140 GB |
| 13 | 83.04 | `passwords` | "But a blueprint…" | • two cards, STILL VALID | 2031 | 300 GB |
| 14 | 88.60 | `newmath` | "They handed you…" | • short basis handed across | 2031 | 480 GB |
| 15 | 91.28 | `newmath` | "You said you'd get around…" | • backlog ticket slides in, parks | 2031 | 600 GB |
| 16 | 94.84 | `wait` ② | "I'll wait for you…" | • inverted ground, dial crowded | 2031 | 1.1 TB |
| 17 | 99.83 | `wait` ② | "Every byte…" | • KEPT figure now huge | 2032 | 4.0 TB |
| 18 | 104.74 | `wait` ② | "I'll see you…" | • hand sweeps past the start | 2032 | 12 TB |
| 19 | 109.19 | `wait` ② | title line | • heavier slam, per word | 2032 | 38 TB |
| 20 | 119.22 | `ticket` | "Ticket opened…" | • ticket typed, PRIORITY: LOW | 2032 | 95 TB |
| 21 | 123.90 | `ticket` | "Pushed to next quarter…" | • four stamps, one per bar | 2035 | 210 TB |
| 22 | 128.48 | `petabytes` | the question | • mono callout with leader line | 2035 | 540 TB |
| 23 | 134.12 | `petabytes` | the answer | • unit crosses into PB; Cormorant | 2035 | 1.4 PB |
| 24 | 139.13 | `wait` ③ | "I waited for you…" | • past tense; dial completes | 2035 | 2.6 PB |
| 25 | 144.36 | `wait` ③ | "Every byte…" | • the figure stops climbing | 2035 | 4.1 PB |
| 26 | 148.72 | `thaw` | "The fridge hums low…" | • **signal enters**; padlock opens | 2035 | 6.2 PB |
| 27 | 154.12 | `thaw` | "So that's what…" | • slab resolves into readable text | 2035 | 7.8 PB |
| 28 | 158.06 | `thaw` | "I said sooner or later" | • the wait animation runs backwards | 2035 | 8.8 PB |
| 29 | 163.80 | `thaw` | title line, past tense | • the inversion, warm | 2035 | 9.4 PB |
| 30 | 177.10 | `secure` | "Connection secure." | • frame closes in; padlock closed | 2035 | 9.4 PB |

## Technical conventions

See [`docs/ENGINE.md`](ENGINE.md). 2D only (Canvas2D / `Layer2D`), deterministic, per-word sync,
beat-synced motion, hard cuts on downbeats, under 25 ms/frame, at most 2–3 Canvas2D layers per
plate. No 3D, no ray-marching, no shader-heavy scenes.
