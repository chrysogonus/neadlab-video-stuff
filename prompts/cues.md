# Step: the cue sheet

Write `projects/{{id}}/data/cues.json`: the edit. Read the treatment (`projects/{{id}}/data/treatment.md`), the style
(`projects/{{id}}/data/style.json`), the brief and the library first.

- **Entries** (the timeline): one per scene change, in order, following the treatment's arc. Cut on phrase
  boundaries (usually `{"at": "beat", "cue": <the first cue of the new entry>}`; a chorus may cut `"word"` on its first
  word), typically every 6–25 s; never an entry shorter than 4 s. Consecutive entries should contrast (scene, scale,
  palette). Give library scenes the entry params that put them in the treatment's world (titles, prompts, units).
  Follow the treatment's pictures: the lyric-as-type scenes (`lib-lyric`, `lib-slam`, `lib-quote`) play at most 2
  entries; the karaoke layer carries the words everywhere else.
- **Cues**: exactly one per sung line, in order (`lyric` exactly as in the brief, `occurrence` when the text repeats),
  plus span cues for the instrumental passages the treatment stages. Each cue: the entry it plays in (`scene`), the
  brief's section of its line, a concrete `initial` / `action` / `result` (what is on screen, as a picture: the
  objects, their position, light and motion; a later QA step compares rendered stills against `result`, so describe
  what a frame will show), the `anchor` (the word the action
  lands on: the payoff word of the line, a token exactly as listed in the brief), its palette, region, transition
  and the motif's state. Cue `params` give library scenes their per-cue content (a list item, a counter value, a
  command and its output, a chart point, a chat message, a title...): write content that belongs to the treatment's
  world and reads well on screen (short, specific, witty where the song is).
- **Custom scenes** (the treatment's 4 to 8): an entry with `"file": "{{id}}-<name>"` and free entry params (one
  scene may play several entries); its cues' `action` and `result` must say precisely what the scene shows, because
  the next step writes the scene from them.

Check with `bun app/scripts/check.ts {{id}} style cues` and fix everything it reports until it prints ok (missing
custom scene files are fine at this step).
