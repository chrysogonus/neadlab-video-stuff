# Step: custom scenes

The cue sheet (`projects/{{id}}/data/cues.json`) plays these custom scenes, which do not exist yet: {{missing}}.
Write each one as `app/src/scenes/<file>.ts`. Read the treatment and style (`projects/{{id}}/data/treatment.md`,
`style.json`), the cues of each entry (their `initial` / `action` / `result` say what to show and when), and the
engine guide `docs/ENGINE.md` (sections "Writing a scene", "The scene library", "Typography", "Motion blur and
sampling").

- Build on the library kit: extend `LibScene` from `./_lib` (read `app/src/scenes/_lib.ts`), with a `static schema`
  (`lyrics: 'own'` if the scene draws the sung line itself, else `'layer'` and keep the lower third quiet: content
  above `this.bottom`). Read two or three library scenes first for the house style (e.g. `lib-slam.ts`,
  `lib-counter.ts`, `lib-flow.ts`; GL: `lib-field.ts`).
- Everything a pure function of `f.t` (seeded randomness only); land the main motion on each cue's `at` (its anchor
  word's start); colours from the look `k` (the cue's palette); fonts from `this.font(role)`.
- Quality: this is a hero moment of the video. Premium motion design, restrained colour, strong typography; no
  clip-art. It must read on a TV at 1080p (body text >= 36 px, labels >= 24 px).

Check each scene by rendering and LOOKING at stills (use the Read tool on the PNGs), and iterate until it is good:
- `bun app/scripts/render.ts stills --project {{id}} --only <entry id> --t <times> --out projects/{{id}}/work/agent/stills/<entry id>`
- `bun app/scripts/render.ts check --project {{id}} --only <entry id> --t <two times>` (determinism)
- `bun app/scripts/check.ts {{id}} scenes` must print ok at the end.
Write only `app/src/scenes/{{id}}-*.ts`.
