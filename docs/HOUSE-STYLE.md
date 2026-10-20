# House style — the Neadlab look

The look every NEAD video uses. harvest-remix (`projects/harvest-remix/video/`) proved the base, which the user
approved as the model for future videos. Revision 3 (2026-10-18, harvest-remix V18.md) adds five rules from the
v17 analysis. Revision 2 (2026-10-17) raises it to the level of the two reference
videos, "LGTM" and "i'm upping my p(doom)": the evidence and the reasons are in
[REFERENCE-VIDEOS.md](REFERENCE-VIDEOS.md). Read both before planning a new song (music-to-video Step 3) and
before writing its `SYSTEM.md`.

## The look in one line

**A world built from the song's subject, told in kinetic type: the lyric sits on or becomes that world's
objects, one literal pun per line, with a deadpan layer of small text for the viewers who pause.** Black,
restrained and lit by one accent; 3D only as line drawing.

## What makes it

1. **A world from the song's subject.** Find the song's world and stage every line inside it, through that
   world's own documents and objects. LGTM is a company told through its Slack, pull requests, slides and
   postmortem; p(doom) is plates from a scientific treatise. harvest-remix is an archive: mail, drawers, tickets,
   a love letter. The song's one idea gets a typographic form inside that world (harvest-remix: ciphertext
   against the sung plaintext). Nothing is decoration for its own sake.
2. **One literal pun per line, and the lyric is on or is the object.**
   - Before building, write down what each sung line literally shows. The joke is in how literally the image
     takes the words: "right-sized" squashed narrower; "ship it to prod" as containers on a ship; "due in a week"
     with the Gantt chart and the type both compressed.
   - The lyric is typed into the form, rides the curve, wraps the object, is stamped, struck through, made of
     tokens or containers. It is not a caption beside a prop.
   - A recurring background (a drawer wall, a code wall) is a texture, not an idea: no more than three scenes.
3. **Lyrics are poster typography,** never a karaoke strip.
   - Lead rows sit at h2 size; every hero word gets its own display row, 11–17cqw, in the accent.
   - Every sung word appears on its own aligned time (`lyrics.json`) and fills letter by letter in the accent; the
     rest of the line waits dim or in outline. Legible on a phone (≥ 72 px).
   - Layouts vary per line (stacked, compare panels, pull quote, lockup, word per cut, text on a path or
     surface, full-bleed); neighbouring scenes never share one, and **neighbouring shots never put the lyric in
     the same position** (rev 3: harvest-remix v17 had a small lead line top left in five shots in a row).
   - **Hooks are posters:** the hook and the song's key words are set full-frame (up to ~25cqw), the way p(doom)
     sets SERVANT, I'M and P(DOOM). A section with no word across 60 % of the frame width is a review flag
     ([visual-guidelines.md](visual-guidelines.md)), not a target.
4. **Three type voices.** One grotesk for the sung voice (big, tight, animated on width and weight where the font
   allows), one mono for the machine (labels, data, forms, footnotes), one serif italic for the rare tender or
   sacred line. Add a marker hand for the human heckle ("(it isn't)", "(sure.)") when the song suits it.
5. **A deadpan small-text layer.** Under the big lyric runs tiny, precise, dry text that rewards pausing:
   footnotes, form fields, labels, dictionary entries, review metrics, probability bars. It carries the wit and
   the insider references a security engineer would screenshot ("0 of 312 files viewed"; "Rounded down, for
   safety."). Every scene has some. It must be accurate: the jokes only land if the details are right.
6. **Running devices that escalate and pay off.**
   - **A counter that tells a story,** drawn inside the scene in its own form (a form field, a dial label, a
     header strip, a chart axis), escalating across the film: p(doom)'s P(doom) 0.02 → 42 → NaN, LGTM's "HUMANS
     WHO UNDERSTAND IT 4 → 2 → 1", harvest-remix's BYTES HELD.
   - **Choruses repeat their set with the world changed:** the same scenes, with the state moved on (LGTM's
     board fills with robots one chorus at a time).
   - **At least two plants that pay off:** a detail shown early returns later with new meaning (a sticky-note
     password that shows up in the leak).
   - **A bookend:** the last scene returns to the first, changed. A loop back into frame 0 is best.
   - **A recurring character only when the story needs one.** If there is one, it gets an arc, not just
     appearances.
7. **Restraint: black ground, one small accent.**
   - Pick one `hyperframes-creative` frame preset per song and copy it verbatim as `frame.md`. One accent hue
     only; harvest-remix uses `broadside`: ink, fire-orange and cream. **One exception per film:** a single
     literal second-colour moment when the lyric names the colour (p(doom)'s 2 s of acid green; harvest-remix's
     "little green padlock"), ideally planted for a payoff.
   - The ground is near-black (ink about `#0A0A0A`) and mostly empty; the references measure a ground luma of
     0.047–0.063 (the 20th-percentile luma of each frame, median over the film) and 42–57 % of pixels darker than
     0.09. Texture lives on objects, never on the ground.
   - **The accent is light and pointer, never a ground:** about 3 % of the frame in the references (median). It
     marks the sung word, the spark, the number that matters.
   - Two registers: the dark register, and a light **cream-paper** register for documents, forms and diagrams
     (9 % of p(doom)'s frames, 20 % of LGTM's), cut between on downbeats. The accent keeps its colour on both.
     **The first cream frame comes in verse 1**, so the opening has the light/dark rhythm too.
   - These figures are signals to compare against, not targets ([visual-guidelines.md](visual-guidelines.md)).
8. **Everything moves, through one motion grammar** (the kit, `assets/kit/hr-kit.js`):
   - words build glyph by glyph, hero words hit in three phases (anticipation, slam on the word, elastic
     settle), lines leave;
   - a camera move once per phrase, with micro-drift and a kick pulse; one element often transforms into the
     next scene;
   - **effects are sized by the measured drums** (`HR.band("drums")`, `WOW.energy`), not by the section's name:
     a pre-chorus roll that is louder than the chorus gets the chorus kit, and the biggest build is never the
     stillest picture;
   - **motion blur on whips, slams and fast zooms** (`hyperframes-animation`, `references/motion-blur.md`), so fast
     type streaks instead of strobing.

   Nothing holds dead.
9. **Light: glow on the accent only.** The accent glows; bone type stays crisp. Film grain, a gentle vignette,
   low chromatic aberration, and light leaks on the flips to the loud register (the finish layer,
   `compositions/overlays/finish.html`). The ground stays black.
10. **Objects are graphic and tactile; 3D is line drawing.**
    - Cards, forms, seals, drawers, tickets and keys are drawn simply, in the palette, then given detail: paper
      fibre, a rubber-stamp ink speckle, typewriter text. They read as things, not icons.
    - 3D may be used anywhere, drawn as lines: hairline wireframes and engraving-style hatching that follows the
      form, flat matte fills, fog to black. It reads as illustration, never as rendering.
    - Build it lean for software WebGL: line and instanced geometry, simple materials, no post passes, driven
      from the timeline.

## What to avoid

| Avoid | Why |
|---|---|
| **Complex or realistic 3D**: glass, ice, metal, fabric, photoreal props, physically lit hero objects, product-film materials | harvest-remix v1–v6 tried this in a custom three.js engine. Even with heavy effort (DOF, light shafts, refraction, reflections) it read as a generic CG demo, and it cost the most. Software WebGL here makes it worse. Line-drawn beats realistic, every time. |
| Generated or stock imagery | User decision: everything is code-rendered. |
| A second accent colour, gradients as grounds, the accent as a full-frame ground | Breaks the palette discipline; the accent stops pointing at anything. |
| Floating corner HUD overlays, decorative sci-fi interface clutter | Generic, and laid on top of the picture. Counters belong inside the scene (item 6). |
| Countdowns or ETAs that claim false precision about a real threat (Q-Day, breach dates) | Alarmist and inaccurate; the audience knows better. |
| Hooded hackers, Matrix rain | Stock imagery that breaks the tone. |
| A busy, mid-grey ground; texture everywhere | Kills the contrast that makes the type and the accent pop (harvest-remix v12: ground luma 0.078 against 0.047–0.063). |
| The lyric as a caption beside a prop, one layout template | The lyric must be on or be the object (item 2). |
| Words that pop in and freeze, static frames, plain hard cuts everywhere | This was v7's "meh". |
| Full-frame light washes | Leaks are edge-weighted, at most 0.4 opacity. |
| Abstract energy effects on an object: lightning, flat CSS shock rings, colour washes over the frame | harvest-remix v18's cipher-rotor locks read "weird, underwhelming, low quality" to the user. Explosions are mechanical: the object comes apart, its parts and sparks and its own light carry the hit (v19's exploded view). |

## How to make one

The stages are in [AGENTS.md](../AGENTS.md) ("Making a video"). What the house style adds to them:

- **Analyze:** `./vid video` installs the kit (`hr-kit.js`, `env.js`) and the finish layer from
  `templates/hyperframes/`.
- **Interpret:** the song's world, its idea and preset; a line table (each sung line and its literal pun); the
  running devices (counter, plants and payoffs, the bookend, a character only if the story needs one); the
  small-text jokes. The song's `SYSTEM.md` follows harvest-remix's: the world, the tokens, the three voices, the
  lyric rule and the kit rules.
- **Motion:** the default opening is a narrative cold open with a designed YouTube thumbnail. A poster first frame
  is also fine, but it **holds at most one bar** before the story starts moving.
- **Review:** fill the finish layer's `LEAKS` and `FLASHES` with the song's flips and drops before the 60 fps
  render. Check the render against [visual-guidelines.md](visual-guidelines.md) (rules firm, signals reviewed),
  and design the thumbnail.
