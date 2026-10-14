# Step: treatment and style

Write the video's treatment, `projects/{{id}}/data/treatment.md`, and its look, `projects/{{id}}/data/style.json`.

Read the lyric (`projects/{{id}}/data/lines.txt`, and the sheet as supplied: `projects/{{id}}/{{transcript}}`), the
brief and the library. Then decide, as a director would:

1. **One central idea.** A single concrete world the whole video lives in, taken from the lyric's own imagery and
   jargon (a song about leaving told as a departures board; a song about memory told as a library's card catalogue). Not a mood, not
   "abstract visuals": a world with objects, marks and rules that the words can act on. Say why it fits this lyric.
2. **Visual vocabulary.** The objects, places and processes of that world, and how each is shown as a picture: drawn
   by code (geometry, 3D, light, particles that form things, diagrams, machines, maps), not spelled out in words.
   Pictures carry the video: the karaoke layer already shows every sung line, so a scene shows what the words are
   about, not the words again. Text in a scene is a label, a reading or a document inside the world, never the main
   event. Say which scenes carry each object: custom scenes (point 5) for the pictures the library cannot draw,
   library scenes (terminal, list, counter, chart, timeline, chat, flow, field, pulse...) with the parameters that
   put them in this world. The scenes that set the lyric itself as type (`lib-lyric`, `lib-slam`, `lib-quote`) are
   for at most 2 moments in the whole video (e.g. the main hook once).
3. **A recurring motif that evolves.** Something that returns and changes (a count that climbs, a list that gets
   struck, a graph that grows), with a plant early that pays off late.
4. **The arc, section by section.** Energy from the brief: quiet sections are sparse, choruses are the biggest
   moments, and each chorus returns changed (bigger, inverted, a new palette, a new layer). Name the scene and the
   palette of every section. Plan the instrumental passages too. Every section has a visual subject: name the thing
   on screen.
5. **Custom scenes.** 4 to 8 scenes written for this video in a later step: the world's key pictures (its places,
   objects and the turns of the story), each carrying one or more sections. For each: what it shows (the image, its
   depth and light), how it moves with the music, how it changes on the sung words, and how it evolves when it
   returns.
6. **Style bible.** Palettes: one to three, named for their role (e.g. `night` for the verses, `flare` for the
   choruses), each with `bg`, `type`, `accent` (and optionally `accent2`, `dim`, `panel`, `rule`, `onAccent`), with the
   reason for each colour. Restraint: a ground, a type colour and one or two accents per palette, so the pictures
   read as one world. Type roles (display, body, mono, serif). Motion: things land on the sung word, breathe with the
   beat, enter with intent. The karaoke layer sits over the pictures: keep it light (`"next": false`, a `scrim` only
   as strong as legibility needs, around 0.3).
7. **Don'ts** for the later steps (clichés to avoid for this song).

Wit is welcome where the lyric is witty; sincerity where it is sincere. Avoid generic music-video clichés (random
particles, spectrum bars, lens flares) unless they mean something in the world you chose.

`style.json`: follow the format in the brief; `type` on `bg` contrast >= 7, `accent` on `bg` >= 3 in every palette;
the karaoke colours must name keys every palette has (`type`, `accent`, `bg` are safe).

When both files are written, run `bun app/scripts/check.ts {{id}} style` and fix what it reports until it prints ok.
