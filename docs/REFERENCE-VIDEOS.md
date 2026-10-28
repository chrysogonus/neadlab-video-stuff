# Reference videos: why "LGTM" and "i'm upping my p(doom)" work

The second, deeper analysis of the two reference videos in `successful-videos-reference/`, done on 2026-10-17.
It replaces the 2 s sampling summary in `projects/harvest-remix/video/V11.md`. This is the evidence; the rules
we take from it belong in `HOUSE-STYLE.md` once agreed.

## Method

- **Every second of both videos was looked at:** 305 frames of LGTM, 156 of p(doom), on labelled contact
  sheets carrying the sung line (`successful-videos-reference/analysis/<video>/sheets/`). Full-resolution
  1080p crops checked the render quality.
- **Measured per second:** luma, contrast, the share of true black and near-white, saturation, the frame area
  carrying the accent colour, edge density, composition change against the previous second, and motion (the
  median frame difference at 60 fps). Hard cuts were detected at 60 fps and compared with the beat grid.
- **Lyrics** come from Whisper `large-v3-turbo`, used only to label the sheets; the on-screen text is the real
  lyric.
- **Why they succeeded:** YouTube statistics and the 60 most-liked of their 400 / 211 comments
  (`successful-videos-reference/analysis/<video>/youtube.json`).
- **Intent:** p(doom)'s own treatment and engine notes, which sit in this repository's git history (this repo is
  a fork of `mexicat/pdoom-video`): `git show c4299a2:docs/TREATMENT.md`, and the revision-6 commit `fa164b7`.
- **For comparison:** our delivered harvest-remix v12 got the same measurements
  (`successful-videos-reference/analysis/harvest-remix-v12/`; its master is no longer in `out/`).

Scripts: `successful-videos-reference/analysis/scripts/`.

### Measuring a render

The house-style figures (true black, accent area, light frames, composition change) come from `metrics.py`,
run on a folder holding 1 fps frames, a tiny 60 fps raw stream and the audio:

```sh
D=/tmp/m; V=out/<id>.mp4; A=successful-videos-reference/analysis/scripts
mkdir -p $D/f
ffmpeg -i $V -vf "fps=1:round=down,scale=640:360" -q:v 3 $D/f/%04d.jpg
ffmpeg -i $V -an -vf "scale=96:54,format=rgb24" -f rawvideo $D/rgb60.raw
ffmpeg -i $V -vn -ac 1 -ar 44100 $D/audio.wav
analysis/.venv/bin/python -I $A/metrics.py $D
analysis/.venv/bin/python -I $A/summary.py $D
```

The `HOUSE STYLE` line gives three reference figures (signals, not targets; docs/visual-guidelines.md): `ground` is the 20th-percentile luma of a frame (median over the film), `dark09` the share of pixels darker than 0.09, and the accent area. The line prints only for a
render measured with the current `metrics.py`: the committed references' `metrics.json` predate the `ground` and
`dark09` keys, so the ground figures quoted for them cannot be reproduced from the committed data; rerun
`metrics.py` on the videos to get them. `black` is the mean share of pixels with luma < 0.06, `sat_area` the share carrying a saturated hue (the
accent), "light frames" the seconds with mean luma > 0.5.

## The numbers

|  | LGTM | p(doom) | harvest-remix v12 |
|---|---|---|---|
| Channel, at upload | Degenerative Pixels, 8.5k subscribers | mexicat, 900 subscribers (first upload in 11 years) | Neadlab |
| Views (2026-10-17) | **1,150,872 in 11 days** | **144,439 in 20 days** | — |
| Likes / views | 2.7 % | 2.5 % | — |
| Length, tempo | 5:05, ~118–120 BPM | 2:36, 132 BPM | 2:44, ~129 BPM |
| Distinct set pieces | ~50 (~6 s each; the chorus set of ~11 is reused 3×) | ~50 (~3 s each, about one per line) | 21 scenes (~8 s each) |
| Seconds whose composition changes (> 0.03 / > 0.10) | 63 % / 19 % | 86 % / 35 % | 61 % / 26 % |
| Motion, median frame difference | 0.37 | 1.17 | 0.64 |
| Hard cuts per minute | ~8 (it moves the camera and morphs instead) | ~48 (detector count); ~25 clean cuts (hard-cut share ≥ 0.5), plus flashes and whips | ~33 (detector count) |
| Light frames (luma > 0.5) | **20 %** | 9 % | 12 % |
| Dark frames (luma < 0.15) | 53 % | 58 % | 34 % |
| **Area of true black** (mean) | **20 %** | **44 %** | **2.6 %** |
| **Area carrying the accent** (median) | **3 %** | **3 %** | 6 % (p90: 70 %, full orange grounds) |
| Hue of the accent | green ~135° in 55 % of seconds | orange ~15° in every coloured second | orange ~15° |

Readings:

- **Pace is not the difference.** v12 changes composition as often as LGTM does, and LGTM, the far bigger hit,
  is the calmer of the two.
- **Restraint is.** The references are mostly true black with a little bright type and a tiny amount of
  accent. The accent is a light source and a pointer, about 3 % of the frame. v12 has a lighter, textured ground
  everywhere, and turns the accent into whole grounds.
- **Caveat on "true black":** the 0.06 threshold sits just under our ink `#111111` (luma 0.067), so v12's 2.6 % partly
  measures the ink token. The ground itself (the 20th-percentile luma of each frame, median over the film) is the
  fairer figure: p(doom) 0.047, LGTM 0.063, v12 0.078. v12's ground is lighter, and textured.
- **Beat lock:** about half of p(doom)'s clean hard cuts land on a beat and a fifth on the off-beat; the rest
  land on sung syllables. Its timeline snaps scene windows to downbeats, and inside a scene the hits follow the
  voice. (This is a constant-grid estimate; treat it as indicative.)

## Why they took off

The comments are unusually explicit. In order of how often and how strongly people say it:

1. **The song is a banger, and the video takes it seriously.** "Oh no. It's a banger" (2,200 likes); "I hate
   how much I like this". The video never undercuts the track; it serves it.
2. **It's about the viewer's own life, with insider precision.** LGTM is a postmortem of AI-first engineering
   culture that every developer recognises: "Goes so hard if you work in tech" (1,400); "watching this satire
   feels like watching a documentary". p(doom) packs AI-safety lore into every line: "the amount of domain
   knowledge … packed into this masterpiece is unreal" (73). **Specificity is what gets shared.** People send
   it to colleagues "after a board meeting".
3. **Density rewards rewatching, and rewatching drives the algorithm.** "SO MANY EASTER EGGS … Brad's password
   on a sticky note showing up later in the list of hacked passwords … Claude slowly taking over the board …
   Greg as a returning character" (715). Commenters post timestamps (0:19, 0:29, 3:35) and catalogue the
   references. "I already watched this 20 times today."
4. **Running gags with an arc.** "The board being gradually replaced by AI is a great touch" (1,300, and said
   again by others at 308 and 41). The P(doom) number going π, then 42, then NaN. Recurring things that
   *change* are what people notice and quote.
5. **The irony of being made by AI, and being good.** "The fact this is made with AI is the highest level of
   irony" (3,200); "'AI slop' implies the existence of AI gem" (489). For us: NEAD songs are about tech and
   security, so this frame is available to us too.
6. **Craft that reads as expensive.** "Highest quality … music video I've seen all week"; "Kinetic typography
   is hard"; "Very tight edit".

## What both videos do

### 1. A world, not a lyric sheet

Each video builds **one fictional world from the song's subject** and stages every line inside it.

- **LGTM** is a company, *LGTM Inc.*, told entirely through its own artefacts: Slack, a pull request, a keynote,
  all-hands slides, an org chart, a Gantt chart, an access dialog, a system prompt, a status page, a postmortem,
  a cheque, an evidence board.
- **p(doom)** is "plates from an illustrated treatise on the end of the world" (its treatment). Each plate
  borrows a scientific or bureaucratic idiom: a TikZ construction sheet, a loss landscape, a token-probability
  prompt, an oscilloscope, a banknote, a safety form, a textbook diagram, a roadmap, an odometer.

The lyric is never laid over a picture: **the words are a property of the object.** They are typed into a
form, ride on a loss curve, wrap a black hole, burn along a fuse, sit as tokens with token ids, stand as
containers on a cargo ship, are struck out by a marker, get stamped, or fly as checkmarks.

### 2. One literal visual pun per line, often two layers deep

The image does exactly what the words say, in the world's own terms. The joke is in the literalness.

| Line | What it shows |
|---|---|
| "they right-sized the team" (LGTM) | The word *right-sized* in quotes, selected with a design-tool bounding box and squashed narrower; a dictionary note: "*adj.* laid off, in a nicer font." |
| "the roadmap for the year is due in a week" | The Gantt chart and the line of type are both compressed horizontally, 365 days → 82 days. |
| "let's ship it to prod" | L-G-T-M as containers on a cargo ship, "LGTM LINES". |
| "so I'll leave it with God" | A heavenly cloud with rays, labelled *the cloud* (us-east-1 · availability: faith). |
| "spent his whole salary on tokens" | The words become tokenizer chips with token ids; Greg's salary drains into an API slot as coins. |
| "the velocity is vertical" | The word *vertical* runs up the chart's y-axis to 1,000,000. |
| "Forward MLP, backward, repeat" (p(doom)) | An MLP diagram; *backward* is set mirrored; *repeat* stutters. |
| "I feel my atoms rearranging" | The lyric's dots detach and re-form as a paperclip: a foreshadowing. |
| "without a single CDR" | A review schedule: SRR ✓, PDR ✓, CDR "STATUS: NOT HELD". The CD-R pun becomes Critical Design Review. |
| "nowhere left to go" | The type compressed to its narrowest width between the paperclips. |
| "post-Chinchilla, super-dense" | The lyric copies pack the title-safe box solid while TOKENS/PARAM runs 200 → 20,000. |

### 3. A deadpan "second voice" of small text

Under the big lyric runs a layer of tiny, precise, dry text that only a pausing viewer reads: footnotes,
labels, form fields, probability bars, dictionary entries, review metrics.

- *LGTM:* "0 of 312 files viewed" under the Approve button (55-like comment: "the most accurate thing anyone
  has put in a music video"); "eyes ×2 — slots, no lenses"; "legs ×4 — not load-tested"; "mouth ×0 — not
  included"; "teammate *n.* a seat, billed monthly. see also: headcount (former)"; rule 212 of a 211-rule
  system prompt; Q3 Priorities ranked "1. AI · 2. AI, but agentic … 13. Snacks".
- *p(doom):* "One nonillion floating-point operations per second. Rounded down, for safety."; "Dept. of
  Reasonable Assurances"; "Kolmogorov (1933): P(Ω) = 1. Deprecated."; "estimate no longer defined"; the
  alternative tokens under each sung word ("ChatGPT 0.61 · Claude 0.12 · Siri 0.04 · Mom 0.02").

This layer carries the wit and the insider knowledge. Most of the comment-worthy jokes live here.

### 4. Running devices that escalate, and pay off

- **A state variable that climbs.** p(doom)'s P(doom) value: 0.02 → 0.04 → 0.15 → 0.16 → 0.20 → 0.42 → 0.44 →
  0.999… → 1.00 → 1.50 → 3.14 → 42 → 1e9 → googol → ∞ → 0/0 → NaN. LGTM's header: "+40,128 lines" → "+90,112" →
  "+1,048,576", and "HUMANS WHO UNDERSTAND IT 4 → 2 → 1". (Powers of two, which commenters spotted.)
- **Recurring templates with variations.** p(doom)'s three pre-choruses use one prompt template (ChatGPT
  T 0.7 → Sydney behind bars T 1.3 → Gato at T 0.2, letters drifting apart). LGTM's chorus repeats the same ~11
  set pieces three times, but the world changes: the board is 0, then 2, then all robots; the bot's pedestal
  has no fire, then fire; the counters grow.
- **Plants and payoffs.** LGTM's 0:01 Slack message, "please do not touch billing.js. it is load-bearing.",
  pays off at 2:22 ("// DON'T TOUCH THIS. — G. (2014)" behind caution tape). Brad's sticky note "PW: BRAD09"
  (1:02) pays off in the leaked users.csv (3:35). The empty seat at the board becomes the bot's.
- **Characters.**
  - LGTM: BOT-001, a deliberately dumb coral box robot that wants nothing, introduced with an exploded-view
    diagram; Brad, the VP of Velocity; Greg, who appears only through his traces (badge, code comment, salary,
    last-day ticket) and is missed at the end.
  - p(doom): no mascots by design. The recurring "characters" are the spark (one orange point that draws,
    becomes the loss curve, the stock price, the paperclip, the fuse, and detonates) and the bland "assistant
    smile" mask.

### 5. A bookend that loops

- **LGTM** opens on Slack, Friday 4:58 PM: "Hey team! Quick one before the weekend: leadership's super excited
  about AI." It closes on the same Slack, 5:01 PM, after "Greg left #all-staff": "…does anybody have Greg's
  number?" BOT-001: "Great question!" The credits are a merged pull request: "Animation: Claude Opus 5.5 ·
  Song: Suno v6 · Reviewed by BOT-001 — approved by 1,365 reviewers · 0 humans".
- **p(doom)** closes on a "↻ Regenerate" button ("this response could not be verified"); clicking it rewinds
  every plate, and the last frame is the first. The video loops seamlessly, which invites the replay.

Neither opens on a poster. LGTM's first 3 seconds are a dim, small-text Slack screen; the hook is narrative
(who are these people, what is load-bearing?). The YouTube thumbnail does the poster's job, not frame 0.

### 6. Many looks, one system

p(doom) changes look every plate (engraving, oscilloscope, form, banknote, blueprint, raymarched 3D, UI), and
LGTM moves between dark UI, cream slides, line-art 3D, illustration and paper. They hold together because
everything else is fixed:

- **Palette:** near-black ink, a warm bone white, one accent. p(doom): ink `#0A0A0B`, bone `#EEE9DF`, signal
  orange `#FF4D12` (+ ember, blood). LGTM: charcoal navy, off-white, terminal green, plus coral for BOT-001
  alone. p(doom) gives a second accent (acid `#D8FF3C`) to **one moment** (the shrooms, ~2 s) and nothing else.
  LGTM changes the whole palette **once**, for the 3 AM incident (red).
- **Type:** one grotesk for the voice (p(doom): Archivo, animated on its width and weight axes; LGTM: a heavy
  rounded grotesk), one mono for the machine (IBM Plex Mono), one serif italic for the rare tender or sacred
  register (Cormorant: "The Omega Point's", "What did Ilya see?", *looks good to me*), and in LGTM a red
  hand-lettered marker for the human heckle ("(IT ISN'T)", "A HACKER WROTE IT").
- **Layout:** Swiss-grid discipline, asymmetric, generous negative space, hairline rules, a small mono header
  strip on most frames ("L-G-T-M · CHORUS 1 · THE DIFF · +45,889 LINES"), little annotations beside big type.
- **The light/dark rhythm comes from paper.** Bureaucratic and diagram scenes invert to cream paper with ink
  (LGTM: 20 % of frames; p(doom): 9 %). The accent keeps its colour on both.

### 7. Karaoke, but designed

Every lyric word appears exactly on its sung time and fills letter by letter in the accent; the unsung rest of
the line waits dim or in outline. That is the same mechanism in every scene, which is why scenes can vary so
much and stay readable. The words are big (lyric lines at roughly 60–110 px tall at 1080p, hooks full-frame)
and set in sentence case or a single all-caps slam, with no subtitle strip.

### 8. Rendering quality

What makes it look expensive at 1:1:

- **True motion blur.** p(doom) averages sub-frames over a 0.2 shutter at 60 fps, adaptively per tile (12
  sub-frames for still tiles, 36 for camera moves, 108–324 for whips and slams). Fast type streaks
  continuously instead of strobing. LGTM's whips show the same smear.
- **Bloom only on the accent.** In p(doom) only the signal colours exceed the bloom threshold; bone type stays
  crisp. Warm halation on bright edges, light grain, a gentle vignette, chromatic aberration kept low (0.5)
  so hairlines don't fringe.
- **Deep, clean blacks.** Large areas are left genuinely empty; texture lives on objects, not on the ground.
- **Line-drawn 3D.** The 3D is real (raymarched rooms, a shoggoth, a black hole, a keynote hall, an exploded
  robot) but drawn as illustration: engraving hatching that follows the form, hairline wireframes, flat matte
  materials. Hatching is filtered against moiré. Nothing tries to look photographic.
- **Printed-matter textures** where they mean something: rubber-stamp ink with speckle and a slight rotation,
  typewriter text, pinned paper, a torn page.
- **Encode:** 1080p60, x264 CRF 16, BT.709 tagged; p(doom) was also rendered as a true 4K60.

### 9. What they avoid

From p(doom)'s treatment, and visible in LGTM too: no neon cyberpunk, glowing brains, Matrix rain, lens-flare
soup, generic particle nebulae or stock "AI" imagery; no logos (p(doom)'s model names appear as words only,
and LGTM draws its chat, pull-request and slide screens in its own palette and type); no realistic human faces;
floaty screensaver motion; and white full-frame washes (revision 6 removed them in favour of zoom punches and
colour fringes).

## p(doom) in brief

- **Structure:** opening (TikZ unicorn) → loss landscape → prompt 1 → hook 1 → Chinese room / FOOM → shoggoth →
  spacetime → prompt 2 → hook 2 → basilisk / NVDA banknote / Omega Point / 1E30 odometer → bureau (form, MLP,
  von Neumann) → left turn → prompt 3 → hook 3 → paperclips → fuse → orthogonality → transformer stack →
  Chinchilla density / safety fences → RLHF askew → hook 4 → Loom / [MASK] → Ilya's laptop → theatre → the
  P(doom) blow-up → Regenerate → loop.
- **The hook escalates by plan.** (1) bone on ink, clean; (2) ink on an orange field; (3) hairline, tiny, black,
  eerie; (4) maximal, digits multiplying 0.99999…
- **Its best quality is transformation.** One element becomes the next scene: the spark becomes the loss
  curve's pen, the O of NOW is born as a black hole, the lyric's dots become a paperclip, the von Neumann page
  burns open onto the roadmap.

## LGTM in brief

- **Structure:** cold open (Slack) → title (LGTM built of code, Approve clicked in 3 s) → BOT-001's exploded
  view → verse 1 (keynote, all-hands, org chart, roadmap, admin access, 2009 CRT, system prompt, mocked tests,
  velocity, the black box) → chorus 1 → verse 2 (npm card catalogue, Greg's badge, token chips, caution tape,
  double-charge receipt, *Bugus billingensis*, prompt-injection ticket) → chorus 2 (the board half-robot, fire
  under the bot) → bridge in red (3 AM, DROP TABLE, the status page lying, users.csv for sale, "WE DON'T HAVE A
  BACKUP." shattering, the blameless lineup, "Action item: ☑ more AI", the token bill, the CEO's cheque, the
  evidence board stamped WE DID!) → final chorus (the bot reviews the bot, the humans cut out, the board all
  robots, BOT-001 in Brad's seat) → credits as a merged PR → the Slack bookend.
- **The chorus is a fixed set:** stamped LGTM keycaps, the diff counter, the stopwatch "in three seconds", "the
  checks are" made of checkmarks, `&& n0b0dy() kn0ws?` as code, the container ship, the Friday clock, *the
  cloud*, the board, the office floor. Reused three times, with the world's state advancing each time.
- **Its best quality is story.** Characters, a plant in the first second paid off minutes later, the narrative
  turning from comedy to disaster (the red bridge) to a quiet, bleak joke.

## Where harvest-remix v12 stands

Seen against them (v12, `successful-videos-reference/analysis/harvest-remix-v12/`):

- **Strong already:** one idea per line, the cream issue-tracker register, the marker voice "(didn't need)",
  "(sure.)", "(it never was)", the serif voice, the BYTES HELD counter, the outbox bookend, a character
  (Archie).
- **The ground is lighter and busy.** Ground luma 0.078 against 0.047–0.063 (2.6 % below 0.06 against 20–44 %); textured drawer walls, vignettes and
  props fill the frame. The references' emptiness is what makes their type and accent pop.
- **The accent is used as paint.** Full orange grounds at 0:06, 0:30, 1:30, 2:30 and 2:36; extruded, shadowed
  orange type. In the references the accent is a point, a word or a line: ~3 % of the frame.
- **Type sits beside the object.** v12's default is the lyric at left and a prop at right. The references put the
  lyric *on* or *as* the object.
- **The small-text layer is thin.** v12 has labels; it has few deadpan footnotes, numbers that tell a joke, or
  insider references a security engineer would screenshot.
- **Fewer, longer scenes.** 21 scenes in 2:44 against ~50 in 2:36 for p(doom).
- **No plant-and-payoff and no world that changes across choruses** beyond the counter.
- **Little motion blur:** only the 08 cipher-bank drums streak; the references' whips and slams all do.
