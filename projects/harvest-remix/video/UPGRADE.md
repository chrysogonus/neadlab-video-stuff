# harvest-remix v8 — upgrade draft

**Status:** approved 2026-10-16 (light allowed; renders stay 1080p60 for now, 4K later). Proof in progress.

**Goal:** the same film (story, sync points, lyrics, 15 frames) made sharper, more beautiful, more detailed,
and above all more animated.

## 1. Why v7 looks "meh"

I looked at the render frame by frame (12 consecutive frames at three moments), not just at stills.

| Problem | Evidence |
|---|---|
| **Words pop, then freeze.** Each word appears fully formed within one frame, with an 18 px settle, and then never moves again. | "tuesday," (9.74) is complete in frame 1 of 12 and identical in frames 2–12. "harvest" on the hook is unchanged across 12 frames. |
| **The camera never moves in the 2D frames.** | 12 of 15 frames are a static page. Only the three three.js frames have a camera. |
| **There is no light, depth or texture.** | Flat `#111` or flat orange grounds. The ghost hex wall is barely visible at about 5%. There are no highlights, glow, grain or focus falloff. The preset (broadside) forbids gradients and shadows, and that is its print-poster DNA showing. |
| **Every frame uses the same layout.** | A lead row plus a display hero row, top left, in about 25 of 31 lines. |
| **Objects are diagrams.** | The card, padlock and drawers are flat rectangles with 14 px labels. They read as icons, not things. |
| **Cuts are plain hard cuts.** | All 14 seams are 0 ms cuts. None is designed, and none is a match cut. |
| **It isn't sharp.** | 1080p30 with no motion blur. The fast moves (stamp, bolts, hook slam) step visibly. YouTube re-encodes 1080p at a low bitrate. |
| **The music barely moves the picture.** | Outside the cut points, nothing reacts to kick, bass or hats. |

## 2. Decisions I need from you

1. **Allow light within the palette.** I'd amend broadside for this film: fire-orange may **glow** (bloom
   halos, light leaks, volumetric shafts in 3D), backgrounds may have **depth of field** (blur) and a
   **vignette**, and the whole film gets fine **film grain**. Colours stay ink, fire and cream, with no new
   hue, and type stays flat and crisp. *Recommended: this is the single biggest beauty lever.*
2. **Render at 4K and 60 fps.**
   - **Sharpness:** text and hairlines are drawn at twice the density (`--resolution landscape-4k`), and
     YouTube streams 4K uploads at a far higher bitrate, which also sharpens 1080p viewers.
   - **Motion:** 60 fps makes the fast type moves read as motion instead of steps.
   - **Cost:** about 8× the render time, roughly 70–80 min of software-GL rendering per full pass.
     *Recommended.*

## 3. System upgrades (every frame)

These go into a new `SYSTEM.md` v2, with two hand-built reference frames, before any worker starts.

### 3.1 Type choreography (rules: `kinetic-beat-slam`, `hacker-flip-3d`, `waterfall-entry`, `motion-blur-streak`)

- **Lead words** build per glyph: a mask-rise from below the baseline with an 18–25 ms glyph stagger and a
  0.12 s blur-to-sharp on each glyph, landing on the word's time.
- **Hero words** get a three-phase hit:
  - anticipation: the glyphs gather 120 ms early, squashed and blurred;
  - slam on the word time: scale 1.25 → 1, with a motion-blur streak on the approach only;
  - settle: one damped overshoot, then a slow breathe (tracking −0.04em → −0.03em, a 0.5° skew drift).
- **Nothing holds dead.** Every line is alive until it leaves:
  - a slow push of the whole type block (1 → 1.04 over the line);
  - the hero word reacting to kicks (a 1.5% pulse);
  - the decrypt words flickering one glyph on hats.
- **Lines leave.** When a new line replaces another on screen, the old one exits with a designed move, such as
  glyphs dropping out in a 15 ms wave, a slice wipe, or a push. The move is chosen per frame and finishes by
  the next word.
- **Ten lyric layouts, not one.** Each line is assigned a layout so no layout repeats within ten lines:
  - stacked left;
  - huge cropped word bleeding off the frame edge;
  - vertical stack, one word per row;
  - word per cut, full frame;
  - two-column call and response;
  - type on a path around the seal circle;
  - type inside the drawer front;
  - centred declaration;
  - type behind an object (depth);
  - ticker.

### 3.2 Camera and depth (rules: `multi-phase-camera`, `viewport-change`, `depth-of-field-blur`, `3d-camera-flight`)

- Every 2D frame is built as a `.world` of **three parallax planes**:
  - background: a lit drawer wall or ciphertext;
  - midground: the line's object;
  - foreground: the type.
- A continuous camera runs over it: micro-drift always, one deliberate move per phrase (push, truck, tilt),
  and a punch-in (`coordinate-target-zoom`) on the frame's biggest hero word.
- The background plane is always slightly out of focus (DOF blur 2–6 px) and racks focus on story beats. The
  card sharpens when it becomes the subject.

### 3.3 Light and finish (registry: `grain-overlay`; rules: `ambient-glow-bloom`)

- One **finish layer** sits above all frames on its own track for the whole film: animated film grain at 4–6%,
  a soft vignette, and a 1-frame chromatic fringe on the six biggest hits (first kick, drop 1, "petabytes",
  "now" and the two hook slams).
- **Fire elements glow:** the seal, lamps, the padlock body and hero words on dark get a bloom halo built from
  stacked blurred copies, breathing with the bass envelope from `data/audio.json`.
- A **light leak** sweeps across on each register flip to orange, so the flip feels like light arriving rather
  than a colour swap.

### 3.4 Music drives micro-motion

There is one shared helper per frame that reads `data/audio.json` envelopes (kick, snare, hat, bass, vocal) at
`tl.time()`:

- **Kick:** a stage pulse (scale +1.2%), with the hairlines flashing from cream-hint to cream for one frame.
- **Bass:** glow intensity and the breathing of the seal or core.
- **Hats:** a ciphertext shimmer, where a few glyphs re-roll.
- **Snare:** a 1 px horizontal offset on the hero word.

Small amounts, everywhere, so the whole film breathes with the track. This is deterministic, because it is a
pure function of time.

### 3.5 Designed transitions (`transitions/catalog.md`; registry shader transitions)

- **Five seams become designed transitions:**
  - 04 → 05, drop 1: the hook lockup shatters into the corridor (cinematic-zoom shader, 0.4 s, landing on 48.491).
  - 10 → 11: "store it?" whip-pans into the lamp (whip-pan, 0.3 s).
  - 13 → 14: the held sentence dissolves to the hush line (domain-warp, 0.6 s).
  - 14 → 15: the pages collapse into the new card (scale-swap).
  - 07 → 08: the excuse roll smashes into chorus 2 on 85.142 (flash-through-white, 0.04 s).
- **Three circle match cuts:**
  - the seal (01) → the padlock body (02);
  - the machine core (08) → the lamp field (09);
  - the fridge plate (12) → the seal under the key (13).
- **The other seams:** they stay hard cuts on the downbeat, but with velocity matching. The outgoing frame
  accelerates into the cut (power3.in plus a short blur ramp) and the incoming one decelerates.

### 3.6 Detail pass on the objects

| Object | Upgrade |
|---|---|
| **Letter card** | Paper fibre texture (a seeded canvas noise baked once), a deckled edge, the envelope flap with soft shading, and the ciphertext printed as if pressed into paper. |
| **Seal** | Embossed relief, with a highlight ring and an inner monogram ("A."). Light glints off it on hits. |
| **Padlock** | Body and shackle bevels, a specular sweep across the body on "done", and the keyhole lit fire from inside. |
| **Drawer wall** | Fronts with bevel, label plate and handle; a lamp per drawer with bloom; parallax between rows. Rendered in three.js as the shared background plane, so it gets real perspective. |
| **Lattice, fridge and ticket** | Glowing lattice nodes with connecting light; fridge plates with concentric machining rings and a slow rotation; the ticket as a tilted paper card with a stamp texture. |

## 4. Per-frame upgrades (beyond the system)

| Frame | v8 upgrade |
|---|---|
| **01 seal** | The thumbnail gets light: the wax glows as it is poured, the title decrypt flickers glyph by glyph, and a slow dolly runs from 1 to 1.08. The stamp gets anticipation, a squash-slam, a wax splash of fire droplets, and a camera kick. |
| **02 sent** | The card flies along a 3D wire with parallax postmarks passing by. The padlock is a three-phase build (draw, shackle drop, light-up). The push into ciphertext becomes a real dolly through layered hex planes with DOF. |
| **03 keep** | "break" cracks into glyph shards on the slash. The keep panel floods orange as a wipe from the drawer. The seven bolts are thick, beveled steel bars that slide in with motion blur, each with a spark. |
| **04 wait** | The drawer wall becomes the three.js plane with a tracking camera. "time" is built from a clock hand sweep. The "mine" flood is hundreds of hex rows streaming into drawers. The hook lockup is the film's signature: a three-phase slam with glow and a light leak. |
| **05 harvest** | Bloom on the light lines, volumetric haze in the corridor, card motion blur, and a calmer city shot (fewer, larger towers). Strobe words get the chromatic fringe. |
| **06 qubits** | The chips are three.js extrusions with glowing cores, stacking per beat with a light pulse. The decade line is a light beam. The passwords re-type with a scanning cursor. |
| **07 later** | The lattice packs as glowing nodes connecting in a wave. The excuse roll becomes a kinetic word-per-kick cut, full frame, alternating register, accelerating, instead of the pile-up. |
| **08 mine** | The core is a lit three.js machine (rings rotating, plates breathing with the bass, light shafts). The hex streams have depth. |
| **09 dark** | The lamps are true bloom points with lens-like halos. The camera pushes through rows, and the lamps extinguish with a tiny dying flicker. |
| **10 ticket** | The ticket is a tilted paper card in 3D. Calendar cells flip like a split-flap board. The pull quote builds glyph by glyph with the quote mark swinging in. |
| **11 petabytes** | Add bloom and depth haze, and motion blur on the rush. Otherwise keep it: it's the strongest frame. |
| **12 key** | The fridge gets real depth (plates in three.js with machining rings and a cold-light rim). The key falls with spin and motion blur and lands with a ring of light. |
| **13 reading** | The letter fills the frame as paper with fibre and light. The decrypt runs as a wave of glyph flips (`hacker-flip-3d`). The held sentence gets a slow rack-focus from the letter to the sentence. |
| **14 now** | Pages get paper shading and motion blur, with bloom on the broken seals. The flip-wave gets a light front, a bright band travelling outward. The camera recoil on the drop gets anticipation. |
| **15 secure** | The padlock clicks with a specular glint. The copy peels with a paper bend. The end card builds glyph by glyph and holds with grain and a breathing seal. |

## 5. How I'd build it (proof first)

1. **SYSTEM v2 and shared kit.** I write SYSTEM.md v2 and a shared kit: the type choreography helper, the
   audio-envelope helper, the parallax camera, and the finish layer. The kit is inlined into each frame, since
   sub-compositions are self-contained.
2. **Proof clip.** I rebuild two frames by hand under v2, 01-seal (the thumbnail) and 04-wait (chorus and
   hook). I render 0:00–0:08 plus 0:33.8–0:48.5 with the 04 → 05 transition at 4K60, and you review it in
   motion. *This is the review gate. If the proof isn't clearly better, we adjust before spending on the rest.*
3. **Full rebuild.** I re-dispatch the other 13 frames to workers with SYSTEM v2 and the two proofs as
   references, at three at a time to stay inside the usage limits.
4. **Motion QA.** Stills are not enough this time:
   - consecutive-frame strips (12 frames) at every hero word, slam and cut;
   - `animation-map.mjs` to find dead zones, meaning anything static for more than 1 bar;
   - `hyperframes check`.
5. **Delivery.** A 4K60 render, `./vid master`, then a final strip review of the render itself.

**Estimate:**

| Stage | Time | Tokens |
|---|---|---|
| Proof (steps 1–2) | about 1.5 h, including a ~10 min 4K60 proof render | — |
| Full rebuild (step 3) | about 3–4 h of worker time | ~2–3 M |
| Final 4K60 render | about 70–80 min | — |

**Answer the two decisions in §2 and I'll start with the proof.**
