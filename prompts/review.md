# Step: review (round {{round}})

The video renders. Contact sheets of every entry are in `projects/{{id}}/work/qa/review/` (one PNG per entry: a frame
just after each cue's anchor, labelled with the cue id), and `projects/{{id}}/work/qa/review/cues.md` lists each cue
with its time, line, `initial` / `action` / `result` and the sheet it is on. Read the treatment and style first
(`projects/{{id}}/data/treatment.md`, `style.json`).

Look at every sheet (Read tool) and judge each entry as a demanding director would:
- Does the frame show what the cue's `result` says? Is the moment landing on its anchor?
- Legibility: nothing clipped or overflowing the frame, no text colliding with the karaoke lyric in the lower third,
  enough contrast, nothing too small to read on a TV.
- Does it look like the treatment (its world, palette, restraint)? Is it beautiful? Do consecutive entries contrast?
- Anything broken: empty or black frames, red error frames, placeholder text, a wrong palette.

Fix what is wrong at its source: `projects/{{id}}/data/cues.json` (params, palettes, which scene plays an entry, cuts,
the cue texts), `projects/{{id}}/data/style.json`, or a custom scene `app/src/scenes/{{id}}-*.ts`. To look closer,
render full-size stills: `bun app/scripts/render.ts stills --project {{id}} --only <entry> --t <times> --out
projects/{{id}}/work/agent/stills/<entry>`. After changes, `bun app/scripts/check.ts {{id}} style cues scenes` must
print ok.

Then write `projects/{{id}}/work/qa/review.md`: first line exactly `VERDICT: PASS` (nothing needed fixing) or
`VERDICT: FIXED` (you changed something), then one line per entry: ok, or what you fixed, or what remains wrong.
