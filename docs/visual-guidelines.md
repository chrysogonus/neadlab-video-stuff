# Visual guidelines: checks on the rendered frames

What every Neadlab render is checked against. [HOUSE-STYLE.md](HOUSE-STYLE.md) says what the look is; this file
says how to check a render against it. Every item is tested on rendered frames, not on code. First written from the
harvest-remix v19 audit (2026-10-19, `projects/harvest-remix/video/V20.md`); revised the same day so that every item
names its source.

## Sources and weight

Each item names where it comes from, and that decides its weight:

- **User:** the user's verdict on a render, or a decision of theirs (AGENTS.md, this revision).
- **Refs:** seen or measured in the two reference videos, LGTM and p(doom) ([REFERENCE-VIDEOS.md](REFERENCE-VIDEOS.md)).
  Two videos show what the hits share, not why they hit.
- **Audit:** an agent's analysis of harvest-remix renders (V17–V21). The plans that carried these were approved, but
  the numbers are one agent's judgment of one film, not evidence.

**Rules** come from the user, the references and phone legibility. They are firm: a frame that breaks one is a
defect, fixed before delivery or raised with the user. **Signals** come from the audits, plus the measured figures
behind the references. A signal is reported, never a target. A flag sends you to that moment in a still strip,
and you decide. Never move a number with shake, grain, flashes or brightness filters: the number gets better and the
film gets worse.

## Rules

1. **Never still, never jolting.** A breath is calm, never frozen; the end card is the only hold. Accents come on
   real hits: no per-frame random shake, no sudden lurches. *User:* v12 chorus "too static and slow"; v17 "I don't
   want scenes to look too slow and static and I don't want sudden abrupt movements".
2. **Motion follows the music.** Movement swells with the drums and settles in the breaths; hits land on the beat or
   the sung syllable they belong to. *User:* v17 opening "slightly too fast and doesn't really sync". *Refs:* p(doom)
   cuts on beats and on sung syllables.
3. **Every word on its sung time.** Each sung word appears on its `lyrics.json` start, the line is the sung text,
   and the unsung rest waits dim or in outline. Check stills at the word starts: a frame-difference strip shows that
   something changed, not that the right word appeared. *Refs:* §7; *User:* AGENTS.md.
4. **Phone-legible.** Every sung line reads in a 480×270 copy of the frame, and nothing is drawn over it. *User:*
   AGENTS.md quality bar; *Refs:* lyric lines 60–110 px tall at 1080p.
5. **One big element on a black ground.** Every frame has one big thing, the lyric or a world object, on an empty
   near-black ground. A small prop alone in a black void for more than a beat is a defect; so is a frame filled edge
   to edge with props and texture. *Refs:* true black over 20–44 % of the frame, hooks full-frame, "the references'
   emptiness is what makes their type and accent pop"; *User:* 2026-10-19, replacing the 35 % and 50 % coverage rules.
6. **Hooks are posters.** The hook and the song's key words are set full-frame, on or as the object. *Refs:* p(doom)
   sets SERVANT, I'M and P(DOOM) full-frame.
7. **The opening hooks.** t = 0 is a poster that works as the thumbnail, or a narrative cold open backed by a designed
   thumbnail. *User:* AGENTS.md quality bar.
8. **Black, one accent as a pointer, cream paper for the light rhythm.** The accent marks the sung word, the spark,
   the number that matters; it is never a ground. A second colour gets one moment at most. *Refs:* §6 and the
   numbers table; *User:* the house style.
9. **Set pieces stay in the song's world; explosions are mechanical.** The big moments use the world's own objects;
   the object comes apart, and its parts, sparks and light carry the hit. No cosmic or abstract centres, lightning,
   flat shock rings, colour washes over the frame or particle nebulae. *User:* v12 chorus (a sun-like centre, then a
   chip and a singularity that felt "random"; imagery should stay consistent with the archive); v19 effects "weird,
   underwhelming, low quality". *Refs:* §9.

## Signals

The audit reports these. A flag is a question about that moment, not a failure.

| Signal | Flags | Source | For comparison |
|---|---|---|---|
| Still run | motion below 1.5 for more than 2 s | Audit (V20) | |
| Motion vs drums | a scene's motion median under 12 where drums ≥ 0.6, under 6 in a verse, outside 2.5–6 in a breath | Audit (V20) | harvest-remix v19: the drawer tunnel 23, small props in black voids 3.7, the Mosca chart 1.2. *Refs:* pace is not what separates the hits; LGTM, the bigger one, moves less than harvest-remix v12 |
| Jolts | a scene's peak motion well above three times its median | Audit (V17) | the steady scenes (17-watch, 11-petabytes) measure about 3 |
| Unseen hit | an onset ≥ 0.9 or a downbeat with no visible change within ±1 frame | Audit (V20) | a change does not prove it is the right one |
| Slow opening | motion under 6 after 0.3 s, or no object hit before 2.5 s | Audit (V20) | |
| Hero-word width | a section with no sung word across ≥ 60 % of the frame width | Audit (V18) | p(doom)'s full-frame words |
| Small element | the biggest element under about a third of the frame | Audit (V20, V21) | the weak harvest-remix v20 verse props: 15–25 % |
| No highlight | 90th-percentile luma under 80 | Audit (V21) | harvest-remix v20, ranked by an agent: the 10 best shots 74–239, the 10 worst 34–68 |
| Ground | 20th-percentile luma, median over the film | Refs | p(doom) 0.047, LGTM 0.063 |
| Dark area | share of pixels darker than 0.09 | Refs | 42–57 % |
| Accent area | median share of the frame carrying the accent | Refs | about 3 % in both |
| Cream frames | share of frames in the cream register | Refs | p(doom) 9 %, LGTM 20 % |
| Repeated layout | neighbouring lines with the lyric in the same position | Audit (V18) | v17: a small lead line top left in five shots in a row |
| Few framings | a scene over 4 s without tight, mid and wide framings | Audit (V19, V20) | one sustained typographic transformation can be the better choice |
| Flat depth | no parallax between two stills 0.5 s apart | Audit (V20) | |
| No transformation | a scene whose last frame differs from its first only in position; under a third of scene switches as object match cuts | Audit (V20); the idea is *Refs* | p(doom)'s best quality is transformation; LGTM cuts ~8 times a minute and moves the camera or morphs instead |
| Flat peaks | a big drop that is not the brightest and fastest stretch of the film | Audit (V19) | v19: the final drop (147–156 s) was the darkest, stillest stretch |
| Flashes | flashes at more than three moments in the film | Audit (V20) | p(doom) uses flashes and whips |

## How to measure

- **Contact sheets:** 2 fps of the whole film, 5–10 fps strips around every drop and every scene switch.
- **Luma and motion:** per frame at 10 fps, 320×180 gray. Luma is the mean (`signalstats` YAVG). Motion is the
  mean frame difference (`tblend=all_mode=difference`, then YAVG). Take per-second and per-scene medians; jolts are a
  scene's peak over its median.
- **Highlights:** the 90th-percentile luma per frame (`signalstats` YHIGH) at 480×270, 4 fps.
- **Ground, dark area, accent area, cream frames:** `successful-videos-reference/analysis/scripts/metrics.py`, as in
  REFERENCE-VIDEOS.md ("Measuring a render"), so the figures compare with the references'.
- **Music:** the tracked drums and RMS (`data/audio.json`), the kick, snare and hat onsets and downbeats (`HR_ENV`
  in `assets/kit/env.js`), and the word times (`data/lyrics.json`).
- **Still run:** a stretch where motion stays below 1.5.
