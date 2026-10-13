# Step: treatment and style

Write the video's treatment, `projects/{{id}}/data/treatment.md`, and its look, `projects/{{id}}/data/style.json`.

Read the lyric (`projects/{{id}}/data/lines.txt`, and the sheet as supplied: `projects/{{id}}/{{transcript}}`), the
brief and the library. Then decide, as a director would:

1. **One central idea.** A single concrete world the whole video lives in, taken from the lyric's own imagery and
   jargon (a song about leaving told as a departures board; a song about memory told as a library's card catalogue). Not a mood, not
   "abstract visuals": a world with objects, marks and rules that the words can act on. Say why it fits this lyric.
2. **Visual vocabulary.** The objects and marks of that world, and which library scenes carry them (terminal, list,
   counter, chart, timeline, chat, flow, slam, lyric, quote, title, field, pulse...), with the parameters that make
   them belong to this world (the commands, list items, counter values, labels, titles). Text is the hero: this is
   a lyric video; typography carries it.
3. **A recurring motif that evolves.** Something that returns and changes (a count that climbs, a list that gets
   struck, a graph that grows), with a plant early that pays off late.
4. **The arc, section by section.** Energy from the brief: quiet sections are sparse, choruses are the biggest
   moments, and each chorus returns changed (bigger, inverted, a new palette, a new layer). Name the scene and the
   palette of every section. Plan the instrumental passages too.
5. **Hero moments.** At most 3 places where a custom scene (written in a later step) is worth it: the turns of the
   story. For each, what it shows and why the library cannot. If the library covers the video well, plan none.
6. **Style bible.** Palettes: one to three, named for their role (e.g. `night` for the verses, `flare` for the
   choruses), each with `bg`, `type`, `accent` (and optionally `accent2`, `dim`, `panel`, `rule`, `onAccent`), with the
   reason for each colour. Restraint: a ground, a type colour and one accent per palette; the accent is spent on the
   sung word and the payoff, not on decoration. Type roles (display, body, mono, serif). Motion: things land on the
   sung word, breathe with the beat, enter with intent.
7. **Don'ts** for the later steps (clichés to avoid for this song).

Wit is welcome where the lyric is witty; sincerity where it is sincere. Avoid generic music-video clichés (random
particles, spectrum bars, lens flares) unless they mean something in the world you chose.

`style.json`: follow the format in the brief; `type` on `bg` contrast >= 7, `accent` on `bg` >= 3 in every palette;
the karaoke colours must name keys every palette has (`type`, `accent`, `bg` are safe).

When both files are written, run `bun app/scripts/check.ts {{id}} style` and fix what it reports until it prints ok.
