# Step: custom scenes

The cue sheet (`projects/{{id}}/data/cues.json`) plays this custom scene, which does not exist yet: {{missing}}.
Write it as `app/src/scenes/<file>.ts`. Read the treatment and style (`projects/{{id}}/data/treatment.md`,
`style.json`), the cues of every entry that plays it (their `initial` / `action` / `result` say what to show and
when), and the engine guide `docs/ENGINE.md` (sections "Writing a scene", "The scene library", "Toolbox",
"Typography", "Motion blur and sampling").

- Build on the library kit: extend `LibScene` from `./_lib` (read `app/src/scenes/_lib.ts`), with a `static schema`
  (`lyrics: 'own'` if the scene draws the sung line itself, else `'layer'` and keep the lower third quiet: content
  above `this.bottom`). Read two or three library scenes first for the house style (e.g. `lib-counter.ts`,
  `lib-flow.ts`; GL: `lib-field.ts`, which overrides `render` to draw with the GPU).
- This scene is a picture: the treatment's object, place or process, drawn by code with depth, light and motion, so
  a still of it reads as a frame from a music video, not a slide. Use what the image needs: GL for depth, light and
  volume (three.js meshes and cameras, `FSPass` shaders with the SDFs, noise and shading in `glsl/common.ts`,
  `LineBatch` for 3D line work), Canvas2D for flat graphic drawing. Type only as labels or documents inside the
  picture; the karaoke layer carries the lyric.
- Everything a pure function of `f.t` (seeded randomness only); land the main motion on each cue's `at` (its anchor
  word's start), and let the picture breathe with the music (`f.a`: the audio features at t, such as `rms`, `kick`,
  `snare`); colours from the look `k` (the cue's palette); fonts from `this.font(role)`.
- Quality: premium motion design, restrained colour, no clip-art. It must read on a TV at 1080p (labels >= 24 px).

Check the scene by rendering and LOOKING at stills (use the Read tool on the PNGs), and iterate until it is good:
- `bun app/scripts/render.ts stills --project {{id}} --only <entry id> --t <times> --out projects/{{id}}/work/agent/stills/<entry id>`
- `bun app/scripts/render.ts check --project {{id}} --only <entry id> --t <two times>` (determinism)
- `bun app/scripts/check.ts {{id}} scene:<file>` must print ok at the end.
Write only `app/src/scenes/<file>.ts` (and stills under `projects/{{id}}/work/`).
