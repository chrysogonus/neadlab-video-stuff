# Harvest Now, Decrypt Later (Banger Remix): choreography proposal, revision 3

The full shot-by-shot design for a video that should stop people scrolling and make them rewatch.

Revision 3 folds in the review of revision 2:

- the opening raises a question, not just admiration: frost creeps toward the letter while the wax is still hot, and
  the thumbnail image is on screen by 0:08
- the betrayal is readable on first viewing: one short sentence, held still
- the exposure in the climax reads without reading any page: every page carries its broken red seal
- the ice block no longer cracks (it could read as a failed attempt)
- four choreography contradictions are resolved (shots 14–15, 23, 44, and the final match cut)
- the proofs test motion and understanding, and the opening 30 seconds is a proof of its own

Revision 2 folded in the review of revision 1:

- the ending is warm but predatory
- the handwriting is withheld until the reading
- musical emphasis replaces mechanical timing rules
- the climax gets two bars
- effort is re-rated honestly
- the quantum imagery stays metaphorical
- five moments are proven in motion before the rest is built

Sources: `data/audio.json` (tracked beats and downbeats, kick/snare/hat onsets, stem energy), `data/lyrics.json`
(word times), the v5 render (`out/harvest-remix.mp4`) and its scenes. Times are seconds of the master. A "bar" is
about 1.83 s and a beat about 0.46 s.

---

## 1. What should astonish

A first-time viewer should come away with seven moments they could describe to a friend:

| when | moment | why it lands |
|---|---|---|
| 0:02 | Hot red wax pools on a love letter while frost creeps across the dark desk toward it | beauty with something wrong in it: what is coming for this letter? |
| 0:06 | The brass stamp hits the wax exactly on the first kick of the song | the first hit is perfect, so the viewer trusts the video |
| 0:38 | The frozen clock face becomes the mouth of the silo, and a vortex of envelopes pours into it; every lamp flares gold on "mine" | a match cut that makes people rewind |
| 0:48 | The frost wall carrying the hook shatters toward the camera on the drop | release after a held breath |
| 1:58 | On the loudest bar of the song, "Petabytes", the night side of the Earth, veined with gold | the jump from one letter to a whole planet |
| 2:25 | Near silence, one line of light… and on "NOW" the frozen archive bursts open in a sunrise | the payoff of the whole story, built for this one beat |
| 2:41 | "Connection secure", and a pale copy quietly drops away | the twist that sends people back to the start |

Five pillars carry these moments:

1. **One personal object inside a vast machine.** The video follows one love letter through an archive the size of a
   planet. Intimacy against scale is the engine of the spectacle.
2. **Product-film beauty.** Wax, glass, ice, gold, paper and light, filmed like a luxury commercial: macro lenses,
   shallow focus, raking light, slow motion where the music is quiet.
3. **Music as choreography.** Each passage answers the track in one clear way (section 3). Actions wind up before a
   word and land on its stressed syllable, and the biggest beats get held images, not more cuts.
4. **A visual rhyme of circles.** The wax seal, the clock face, the silo, the fridge plates, the vault door, the Earth
   and the sun are all circles. Five match cuts link them (section 2.4), so the video feels designed, not assembled.
5. **Plants and payoffs.**

   | planted | paid off |
   |---|---|
   | The "Connection secure" tooltip (0:13) | the outro (2:41) |
   | Frost closing over drawer 0001 (0:42) | clearing on "NOW" (2:25) |
   | The collector's reading lamp clicking off (0:19) | clicking on to read the letter (2:17) |
   | The handwriting, never shown | read at last |
   | Frost creeping toward the letter in the first shot | the letter frozen at "ice" (0:22) |
   | The letter's own short line, "No one else will ever read it." | read, held still, by the one person it was meant to keep out |

---

## 2. Visual language

### 2.1 Frame and type

- The frame is 2.39:1 inside the 16:9 video, with the lyrics as subtitles in the lower bar (`style.json` `aspect`).
  Every subject is composed for the scope frame. Nothing important sits in the outer 5% of the width, which phones crop
  in some players.
- The only type inside the picture is the hook (shot 14) and small diegetic labels: tags, postmarks, chip
  engravings, board cards, the storage gauge. The subtitle bar hides during the hook so the words are never doubled.
- Labels are always objects (printed, engraved, stamped, handwritten), never floating HUD readouts. Revision 1's
  temperature countdown and "Q-DAY ETA" are gone.

### 2.2 Materials (the look of the hero objects)

| object | material | must read as |
|---|---|---|
| wax | deep red (#B3122E), subsurface glow at thin edges, wet specular, slight surface tension at the rim | real sealing wax, freshly poured |
| glass padlock | clear glass with refraction, an inner emissive core (green #39E07A), a soft caustic on the surface below | a jewel, not an icon |
| envelope and letter | cream laid paper with visible fibre, a soft deckle, real handwriting in Caveat | something a person touched |
| ice | clear block with refraction, internal bubbles and fracture planes, frosted edges, a cold rim light | a museum piece |
| frost | dendrites growing along surfaces and glass, catching specular glints | alive, crawling |
| gold machine | brushed (anisotropic) gold plates, copper coils, warm reflections | the most expensive object in the room |
| the archive | steel drawer fronts with frosted glass, small amber lamps behind the frost, labels | endless, orderly, patient |

### 2.3 Camera grammar

- **Quiet passages:** slow dollies and drifts, macro lenses (an 85–100 mm look), focus pulls on the word.
- **Choruses:** wider lenses (24–35 mm look), confident moves of one bar each, symmetrical aisles and shafts.
- **Drops:** the edit is the instrument. Hard cuts on bars and fast camera moves, with no internal flashes.
- **Holds:** the three biggest beats (the first kick, "Petabytes", "NOW") are entered on a cut and then held.
- **No handheld shake.** Impacts are shown by the object (wax squeezing, bolts slamming, ice cleaving), not by
  shaking the camera.

### 2.4 The circle match cuts

| cut | from | to | how |
|---|---|---|---|
| 0:38.64 | the clock face in ice, centred, filling the frame height | the silo seen from its rim, the same size and position | the clock's rim becomes the silo's top ring |
| 1:29.95 | looking straight up at the gold fridge's plates (concentric) | looking straight down the silo (concentric rings) | concentric to concentric, up becomes down |
| 2:03.48 | the Earth's disc rushing toward the camera on the snare roll | the clock face in ice, the same disc | a planet becomes a clock: time is up |
| 2:16.66 | the keyhole of the frosted padlock, centred | the round wax seal on the opened letter | a key's turn becomes a letter's opening |
| 2:40.06 | the sun's disc, a small bright point over the dark limb after the white recedes, cooling toward green | the green glow of the new padlock, same position and size | light becomes a lock again |

### 2.5 Colour script

| chapter | palette | key light | grade |
|---|---|---|---|
| intro, verse 1 | `frost`, with the red wax as the only warm thing | one raking cold key, deep shadow | cool shadows, clean highlights |
| prechorus 1 | `frost` | single strip lights in fog | colder, lower |
| chorus 1, drop 1 | `amber` | amber lamps behind frost, cold strip lights | gold against ice |
| verse 2, prechorus 2 | `frost` | lab work light, then shafts | neutral, steely |
| chorus 2, interlude | `amber` | the gold machine as the main source | richer gold, deeper black |
| bridge | `plain` | flat office daylight with blind shadows | flat, slightly green fluorescent |
| final chorus to "now" | `amber` → `dawn` | the reading lamp, then the sun | warm, with cold remaining in the shadows |
| outro | `frost` | ink-blue dark, the green padlock | back to the start |

### 2.6 Technical quality

- Master in 4K (`--scale 2`), 60 fps. YouTube gives 4K uploads a higher-bitrate codec, which also helps 1080p viewers.
- **Banding.** Dark fog gradients show visible steps in the v5 stills (fog behind the key, the fridge frame, the vault
  door), and YouTube's re-encoding makes it worse. Add blue-noise dither in the post pass, plus a trace of grain. Test
  by re-encoding at about 8 Mbps.
- Fine detail (frost, handwriting, labels) is sized to survive 1080p compression: no hairlines under 2 px at 1080p.

---

## 3. Music: one dominant response per passage

The song breathes: quiet verses, a stripped final chorus, a near-silent bar before the last drop. Each passage gets
one main way of answering the music, so the scenes don't all pulse alike.

| passage | time | what the music does | dominant response |
|---|---|---|---|
| intro | 0.00–7.96 | pad, then a full-kit fill from the first kick (6.12) | **light** grows with the pad; then the **stamp** on the kick |
| verse 1 | 7.96–22.74 | sparse drums, intimate vocal | **the voice**: actions on stressed syllables, slow camera |
| prechorus 1 | 22.74–33.81 | bass enters at 24.58; a 7-snare fill (31.94–33.79) | **the bass** (the ice block settles on it); then **the snares** (one bolt each) |
| chorus 1 | 33.81–48.49 | full band; a dip at 46.66 | **the bar**: one camera move per bar, actions on lyric anchors |
| drop 1 | 48.49–61.35 | the loudest instrumental so far; vocal chops from 53.69 | **the cut**: one shot per bar |
| verse 2 | 61.35–75.99 | steady four-on-the-floor | **the beat as counting** (chips stack per beat) |
| prechorus 2 | 75.99–85.15 | bass out; kick roll accelerating (81.46–85.14) | **acceleration**: the camera speeds up with the roll |
| chorus 2 | 85.15–99.76 | full band, heavier bass | **the bass as breath**: the machine's gold light swells with it |
| interlude | 99.76–107.06 | eerie synths, almost no drums | **subtraction**: lights going out on downbeats |
| bridge | 105.24–117.94 | building throughout; bass returns at 114.35 | **comic precision**: office objects land on words |
| "Petabytes" | 117.94–123.48 | the loudest bar of the song; snare roll at 121.64 | **the cut**, then the **roll as a push-in** |
| final chorus A | 123.48–143.60 | stripped; isolated hits at 128.91 and 136.19 | **stillness and slow motion**; each hit gets one event |
| the hush | 143.60–145.44 | near silence; "decrypted" sung alone | **freeze** |
| "NOW" | 145.44–160.06 | the final drop | **everything at once**, then hats as shimmer on the pages |
| outro | 160.06–164.40 | the voice; small hits at 162.32; silence at 163.71 | **the voice**, then **one hit** drops the copy |

Timing rules (to apply with judgement):

- **Wind-up and landing.** Motion starts 4–10 frames before a word; the impact lands on the stressed vowel (word
  start plus 40–80 ms).
- **Cut placement.** Cuts sit on downbeats or the beat before a phrase by default. The exceptions are deliberate and
  marked in the shot list (⚑).
- **Hold, don't add.** When a beat carries a payoff, hold the image and let it develop; don't cut to another angle.
- **The engine sync layer is a set of tools.** Exposure punch, flare, dust glints, and camera nudge from the onsets
  in `audio.json`. Each passage uses at most one of them, tuned per scene, and many use none.

---

## 4. The story, and what it must feel like

You seal a love letter and send it. The little green padlock says it is safe, and today it is. I can't read it and
don't try. I take a copy, freeze it, and file it in drawer 0001, then wait while the world's traffic pours into my
archive. They build a machine; you change your passwords, which changes nothing for the copy I already have; they
postpone the fix. The machine hums, its qubits become a key, and I read your letter, including the line where you
trusted the padlock. At "now" the whole archive bursts open, and I read everyone. The archive never stops: new letters
keep pouring in, and the last one, today's, is copied as we watch.

- **Warm but predatory.** The ending is the most beautiful thing in the video, and the beauty belongs to the
  collector. Daylight is exposure, not freedom: pages hang in the air like specimens under a reading light; private
  sentences are legible; the silo keeps filling behind the thaw; on the planet the gold network burns brighter in the
  daylight instead of going out.
- **The handwriting is withheld.** No one, including the viewer, sees a single handwritten word until the reading
  (2:17). Before that, all we ever see is the outside of the envelope and the seal.
- **The betrayal reads on first viewing.** The letter (kit `LETTER`) gets one short sentence on a line of its own:
  "No one else will ever read it." The reading holds it still and centred for about two seconds; the rest of the
  letter rewards pausing.
- **The exposure reads without reading.** Every page in the climax hangs beside its broken red wax seal and torn
  envelope. Broken red seals against gold light say "opened private mail" at a glance, even on a phone.
- **Quantum stays metaphor.** The fridge, the frost and the key are the song's own images. There is no ETA, no
  countdown, and no temperature presented as a breakthrough. The chip generations appear as engraved details, as the
  lyric's "a few more every year", not as a progress bar to decryption.
- **Never:** faces, hands or figures; hooded hackers, skulls, "ACCESS GRANTED", Matrix rain; a globe with attack arcs;
  a glowing-orb computer; falling snow; a moralising caption; real personal data (all letters are fiction written for
  the video). Green is only for the padlock and the lattice.

---

## 5. Shot by shot

47 shots, 3.5 s on average. Effort per shot: **S** polish (timing, framing, light); **M** a new phase, prop or physical
behaviour in an existing scene; **L** a new build or a hard effect that will need several iterations. ⚑ marks a
deliberate exception to the timing rules.

### INTRO: the letter (0.00–7.96)

#### 1 · The drop of wax · 0.00–6.12 · pad

- **Purpose:** in four seconds, the viewer knows this is beautiful, personal and handmade, and that something cold is
  coming for it.
- **Image:** total black. A single raking cold light finds the flap of a cream envelope on a dark wooden desk, at
  macro distance: paper fibre visible, the light skimming across it. A stick of red sealing wax glows at the top of
  frame, its tip softening.
- **Choreography:**
  - 0.50: the light starts to rise.
  - 1.6: one drop of red wax gathers at the tip, stretches and falls in slow motion.
  - 2.38 (downbeat 1): it lands on the flap and spreads into a glossy pool with a small crown of wax at the rim.
  - 2.38: the title fades up, letter-spaced, thin and pale: HARVEST NOW, DECRYPT LATER, with NEAD beneath.
  - **The wrong detail.** From 2.38, while the wax is still steaming hot, frost creeps across the envelope's own
    paper from the left edge of frame toward the wax: fine dendrites, glinting in the raking light, advancing with
    the pad. Nobody comments on it. It is the first sign of the cold archive. *(Built: on the paper rather than the
    desk; at the desk it never entered the frame.)*
  - 4.25 (downbeat 2): the title fades. A brass seal stamp with a padlock sigil descends into the top of the frame,
    out of focus. The camera eases in toward the pool. The frost is a hand's width from the paper.
- **Sync:** the light and the frost follow the pad; the wax lands on downbeat 1.
- **Cut out:** a hard cut on the first kick.
- **Build:** `letter` (the seal phase has the stamp and the wax) · **M–L**: the falling drop and its spread are a new
  liquid behaviour. Fallback: the wax already pooled, with a light sweep revealing it (S).

#### 2 · The stamp · 6.12–7.96 · first kick and fill

- **Purpose:** the first hit is perfect.
- **Image:** close from the side at desk level. The brass stamp fills the upper half, the pool the lower.
- **Choreography:**
  - 6.12: the stamp hits on the first kick. Wax squeezes out at the rim in a ring, and a tiny tremor runs through the
    paper.
  - The fill rolls on 8th-note snares (6.10–7.94); the stamp holds.
  - 7.48: the stamp lifts, with a thread of wax stretching and snapping.
  - 7.94: the last snare. The sigil is revealed, glistening: a padlock pressed into the red. As the stamp clears it,
    the padlock glows faintly green from inside for a moment. This is the thumbnail image, on screen by 0:08.
  - At the frame edge, the frost has stopped just short of the paper, waiting.
- **Sync:** stamp on the kick, lift into the end of the fill.
- **Build:** `letter` seal · **M**: the wax squeeze and the thread are new deformation. Fallback: a squeeze with no
  thread.

### VERSE 1: sent, secured, intercepted, copied (7.96–22.74)

#### 3 · Postmark · 7.96–12.36 · "You sent it on a Tuesday, twenty twenty-one"

- **Purpose:** a real letter, on a real day.
- **Image:** the whole sealed envelope on the desk, cold side light. The address is in handwriting on the front ("Mr
  R. C…, 7 Mill St, Edinburgh"). This is the one exception to withholding the handwriting: an address, not the
  message.
- **Choreography:**
  - The camera pulls back and tilts slowly.
  - A rubber postmark stamp slams onto the corner on "Tues-" (9.74). The blue ink ring and "TUE 9 MAR" print
    crisply, with a faint smudge.
  - On "twenty-one" (11.01) the year "2021" inks into the ring a beat later, as a second, lighter strike.
- **Sync:** the voice.
- **Build:** `letter` seal (exists) · **S**.

#### 4 · The green padlock · 12.36–16.06 · "A little green padlock said the hard part was done"

- **Purpose:** the promise of safety that the whole video will betray.
- **Image:** extreme macro on the seal's padlock sigil. In this world it is a small glass padlock set in the wax.
  Shallow focus; the red wax falls into soft blur.
- **Choreography:**
  - On "pad-" (13.22) the shackle clicks home and the glass lights from inside, bright green, throwing a green caustic
    across the wax.
  - On "said" (13.84) a small, elegant tooltip fades in below the lock in a system font: 🔒 Connection secure. This
    is the plant for the outro.
  - On "done" (15.10) the envelope slides away out of frame, sent; the green light streaks into a short trail.
- **Sync:** the voice.
- **Cut out:** the green trail carries into shot 5.
- **Build:** `padlock` macro (exists) · **S–M** (the tooltip and the exit).

#### 5 · The tap · 16.06–19.74 · "I couldn't read a word of it, I didn't even try"

- **Purpose:** someone intercepts it, and it is unreadable to them.
- **Image:** the dark of an equipment room, very shallow focus. A single glowing optical fibre runs across the
  frame: a glass thread with light inside and a soft cyan halo. Clamped on it is a precision tap like a piece of
  watchmaking: a brass collar holding a glass prism. The sealed envelope, small and glowing green at its padlock,
  rides the fibre into the prism.
- **Choreography:**
  - On "read" (16.70) a reading lens swings over the envelope and a warm lamp clicks on behind it (the collector's
    lamp, planted here). Through the backlit paper there is nothing to read, only a shimmering grain of ciphertext
    where the words would be: noise, never handwriting.
  - On "word" (17.16) the lens racks focus and the grain swirls.
  - On "try" (18.98) the lamp clicks off. They don't bother. The envelope rides on.
- **Sync:** the voice.
- **Build:** new **`fibre`** scene (also used in shots 6, 15 and 23) · **M–L**: the fibre, the brass-and-glass tap
  and the backlit grain. Fallback: v5 `wire`, re-lit with shallow focus.

#### 6 · On ice · 19.74–23.66 · "I made myself a copy and I put it on ice"

- **Purpose:** the crime, and the video's central image: the copy in ice.
- **Image:** the tap from below. A thin scan bar of white light sits in the prism.
- **Choreography:**
  - On "co-" (20.74) the scan bar sweeps the envelope and a translucent twin peels off it downward, paper-thin and
    pale. The original rides on, untouched and glowing green.
  - The copy drifts down in slow motion, turning once.
  - From "put it on" (21.76) frost begins to race across it.
  - On "ice" (22.96) clear ice crystallises around it in one sweep: a cube of ice forms, with internal bubbles and
    fracture planes. The copy is suspended inside, its padlock a frosted, colourless twin.
- **Sync:** the voice; the freeze lands on "ice".
- **Build:** `fibre` + `relic` (the ice-block material exists) · **L**: ice growth is the hard effect. Fallback: a
  frost-dendrite burst covering the frame for 6 frames, revealing the finished block (M).

### PRECHORUS 1: kept (22.74–33.81)

#### 7 · "I don't have to break you" · 23.66–27.13

- **Purpose:** the collector doesn't need force, only patience: calm confidence, no attempt to break anything.
- **Image:** the ice block alone in a shaft of cold light, perfectly intact, turning slowly as it is lowered on thin
  steel cables; ice dust hanging in the beam. Inside, the sealed envelope. Below it, a steel cradle with a frosted
  rubber lining.
- **Choreography:**
  - On "break" (24.54), which is also where the bass enters (24.58), the block settles into the cradle with a heavy,
    satisfying weight: the cables go slack, a ring of frost blooms out along its base, and ice dust puffs up into the
    light.
  - Over "you" (25.58) it rests, untouched and whole, the envelope sharp inside it. The camera drifts closer.
- **Sync:** the bass entrance.
- **Build:** `relic` · **S** (a lowering move and a frost bloom).

#### 8 · "I only have to keep you" · 27.13–30.12

- **Purpose:** filed, in a specific place we will return to.
- **Image:** the cold aisle in darkness: one rack of steel drawers lit by a single strip light, the rest lost in
  fog; mist on the floor. Drawer 0001 stands open at eye level.
- **Choreography:**
  - The cradle with the ice block slides into the drawer.
  - On "keep" (28.09) the drawer shuts with a soft, heavy settle.
  - Its paper tag prints and lights: 0001 · TUE 2021-03-09. Its amber lamp comes on behind the frosted glass.
- **Sync:** the voice.
- **Build:** `vault` keep (exists; the drawer holds the block now) · **S–M**.

#### 9 · The vault door · 30.12–33.81 · drum fill

- **Purpose:** sealed in, and the build into the chorus.
- **Image:** inside the archive, facing the round vault door, which stands half open with cold light spilling in.
- **Choreography:**
  - Over bar 16 the door swings shut.
  - Then, in bar 17's fill, seven locking bolts drive home one per snare (31.94, 32.41, 32.87, 33.10, 33.33, 33.56,
    33.79), each with a puff of frost.
  - On 33.79 the last bolt lands and frost blooms across the face of the door.
- **Sync:** the snares.
- **Build:** `door` shut (exists) · **S–M** (bolts on onsets).

### CHORUS 1: the collection (33.81–48.49)

#### 10 · The aisle · 33.81–35.63 · "I'll wait for you…"

- **Purpose:** scale. It is not one drawer; it is all of them.
- **Image:** the full aisle in amber, perfectly symmetrical: two walls of frosted drawers receding to a vanishing
  point, small amber lamps behind each pane, cold strip lights overhead.
- **Choreography:** the camera dollies in one bar's worth. Open drawers slam shut in a wave toward the vanishing
  point, one rank per beat.
- **Sync:** the bar and the beat.
- **Build:** `vault` harvest (exists) · **S**.

#### 11 · The clock · 35.63–38.64 · "…I've got the time"

- **Purpose:** patience as a picture.
- **Image:** a clock face frozen in a block of clear ice, centred, gold light behind it.
- **Choreography:**
  - The second hand drags, slower each tick, as frost thickens over the ice.
  - On "time" (37.10) it stops.
  - The camera pushes in until the clock's rim fills the frame height.
- **Cut out:** the circle match cut into the silo (38.64).
- **Build:** `clock` (exists) · **S**, plus the matched framing.

#### 12 · The silo · 38.64–41.72 · "Every byte you ever sent is mine"

- **Purpose:** everyone's messages, not just one.
- **Image:** straight down a vast round shaft lined with thousands of frosted drawers, rings of gold lamps descending
  into blue fog.
- **Choreography:**
  - Sealed envelopes pour over the rim and spiral down in a vortex, faster with every beat.
  - On "mine" (40.94) every lamp in the shaft flares gold, ring after ring, downward.
- **Sync:** the beat for the vortex; the voice for the flare.
- **Build:** `silo` (exists; it is one of the best v5 shots) · **S**.

#### 13 · "I'll see you sooner or later" · 41.72–45.49

- **Purpose:** goodbye, until later. This plants the frost that clears at "NOW".
- **Image:** macro on drawer 0001's glass front, the ice block and envelope visible behind it, the amber lamp warm in
  the corner. The tag "0001 · TUE 2021-03-09" is sharp.
- **Choreography:**
  - Frost grows over the glass from its four edges, one step per beat; the envelope's shape slowly disappears.
  - On "later" (44.58) the last clear patch closes and the lamp glows on behind the frost.
- **Sync:** the beat.
- **Build:** `vault` + kit frost · **M**.

#### 14 · The hook · 45.49–48.49 · "Harvest now, decrypt later"

- **Purpose:** the title, and the one time the lyric is typography.
- **Image:** a wall of frosted glass filling the frame, lit gold from behind.
- **Choreography:**
  - The words cut through the frost as sung, each letter a clear cut with gold light blazing through. HARVEST (45.49)
    and LATER (48.01) land hardest, shaking frost dust loose.
  - In the dip (46.66) the light behind draws back, an inhale.
  - On the drop's downbeat (48.49) the wall shatters. The shatter belongs to shot 15 (below), which breaks this
    shot's last frame into shards.
- **Sync:** the voice, then the drop.
- **Subtitles:** the bar hides during this shot.
- **Build:** `hook` (exists) · **S**.

**The shatter transition (48.49–48.97, one beat).** Shot 15 starts on the downbeat and takes shot 14's frame as a
texture (the engine's `f.under`, which an incoming scene can composite itself). It cuts that frame into a few dozen
glass shards along frost fracture lines. The shards burst toward the camera, spinning, their edges catching gold
light, and through the widening gaps the fibre bundle of shot 15 is already moving. By the second kick (48.97) the
last shard has flown past the lens. The viewer sees the hook break open into the harvest.

### DROP 1: the harvest (48.49–61.35)

One shot per bar, nothing pulsing inside the shots: the cuts are the rhythm. A small engraved gauge plate,
COLD STORAGE · USED, sits in the corner of every shot and rolls up across the cuts (fiction): 0.1 PB → 4.7 → 310 →
9,400 PB.

| # | time | shot | build |
|---|---|---|---|
| 15 | 48.49–50.34 | **The bundle.** Revealed through the shards of the hook. Macro on a cable split open: thousands of glowing fibres fanning out, pulses of light racing through them. At a row of brass taps every pulse splits off a twin. The camera tracks along them fast. | `fibre` · M, plus the shatter transition · M |
| 16 | 50.34–52.18 | **The pour.** The silo from its rim, a torrent of envelopes pouring over the edge into the shaft. | `silo` new camera · S |
| 17 | 52.18–54.02 | **The arm.** The tape-library arm whips along its rail between towering racks and slots a cartridge home on the bar's last beat. | `robot` · S |
| 18 | 54.02–55.85 | **The slam.** (vocal chops enter) Low and close down a row: drawers slamming shut one after another toward the camera. | `vault` new camera · S |
| 19 | 55.85–57.68 | **The count.** A rack-end counter spinning, the aisle receding beside it. | `vault` count · S |
| 20 | 57.68–61.35 | **The hall.** Two bars. The camera rises out of the aisle, up through the racks, and keeps rising until the aisle is one line in a vast cold hall of thousands of aisles, amber lamps in rows to the horizon. The gauge lands on 9,400 PB on 59.51. | `vault` overhead (cold variant of v5's rise) · M |

### VERSE 2: the machine is coming (61.35–75.99)

#### 21 · Stacking · 61.35–65.62 · "They're stacking up the qubits, a few more every year"

- **Purpose:** someone is building the thing that opens the ice.
- **Image:** macro on a dark lab bench, cold work light. A small qubit chip, gold bond wires and a grid of dots.
- **Choreography:**
  - On the beats from "stacking" (62.12), larger chips slide in and stack beneath it like a staircase, each with its
    grid lighting cyan.
  - Each die carries a tiny engraved label: 53 · 2019, 127 · 2021, 433 · 2022, 1,121 · 2023.
  - On "year" (65.00) the last lands. The engravings are a detail for people who pause, not a headline.
- **Sync:** the beat as counting.
- **Build:** `chip` (exists, the strongest macro in v5) · **M** (the stacking).

#### 22 · Nearly here · 65.62–69.04 · "The experts said a decade, now the decade's nearly here"

- **Purpose:** the machine arrives in the archive. A threat, not a countdown.
- **Image:** the cold archive from low down. Out of the darkness above, the gold dilution refrigerator descends on
  its cables: five brushed-gold plates, copper coils, the chip at the bottom.
- **Choreography:**
  - It lowers through the frame, its warm light sliding down the frosted drawers.
  - On "decade's" (67.70) it stops with a heavy settle, hanging just above the racks, a gentle sway.
  - The frost on the nearest drawers glints gold.
  - No readouts.
- **Sync:** the voice.
- **Build:** `chandelier` · **S–M** (a new descent move; replaces v5's grey bare frame).

#### 23 · Passwords · 69.04–73.00 · "You changed all of your passwords, you think that sees you through"

- **Purpose:** the key insight of the song: changing passwords now does nothing for the copy already taken.
- **Image:** two planes. Behind: the live fibre with a stream of envelopes, their green padlocks bright, **in focus**.
  In front: the ice block with the envelope inside, **soft**, a pale shape in the lower left of the frame.
- **Choreography:**
  - On "pass-" (70.50) a ripple runs along the stream: every green padlock flickers and re-locks with a fresh,
    brighter green.
  - On "sees" (71.76) focus pulls forward to the ice block. The live stream melts into green bokeh, and the copy's
    frosted padlock comes sharp: unchanged, colourless, still. The camera holds on it to the end of the line.
- **Sync:** the voice.
- **Build:** `relic` + `fibre` as bokeh · **M** (replaces v5's `wire` rekey diagram).

#### 24 · True as true · 73.00–75.99 · "But a blueprint or a birthday stays as true as true"

- **Purpose:** what is in the copies doesn't expire.
- **Image:** two blocks of clear ice hanging in a shaft of light: a blueprint frozen in one, a birthday card and cake
  in the other. Tags "valid: forever".
- **Choreography:** the first block catches the light on "blueprint" (73.22), the second on "birthday" (74.14).
- **Build:** `relic` (exists) · **S**.

### PRECHORUS 2: postponed (75.99–85.15)

#### 25 · The new math · 75.99–79.66 · "They handed you the new math"

- **Purpose:** the fix exists.
- **Image:** a shaft of light in the dark. A green lattice crystal grows in it, point by point, and drifts toward the
  camera as if held out: handed over.
- **Choreography:**
  - On "math" (78.72) it snaps into a perfect crystal.
  - A small label at the frame corner: ML-KEM · FIPS 203 · 2024.
- **Build:** `lattice` · **S–M** (glassier material, the approach move).

#### 26 · LATER · 79.66–81.49 · "You said you'd get around to that"

- **Image and choreography:** the lattice folds plane by plane into a plain cardboard crate. On "that" (81.46) a
  rubber stamp slams LATER onto its side.
- **Build:** `lattice` crate (exists) · **S**.

#### 27 · Shelved · 81.49–85.15 · kick roll

- **Purpose:** one postponement among thousands.
- **Image and choreography:**
  - The crate slides onto a warehouse shelf.
  - The camera pulls back, slowly at first, then faster with every kick of the roll as it tightens to 16ths (83.32).
  - Shelf after shelf of LATER crates in orange racking blur past.
  - On 85.14 it stops dead: an endless warehouse.
- **Sync:** acceleration with the roll.
- **Build:** `warehouse` (exists) · **S**.

### CHORUS 2: the machine over the collection (85.15–99.76)

#### 28 · Cooling · 85.15–89.95 · "I'll wait for you, I've got the time"

- **Purpose:** the machine is now part of the archive, and it is getting ready.
- **Image:** the gold fridge hanging over the frosted racks, rim lights on its plates, the archive out of focus
  below.
- **Choreography:**
  - Its gold light swells with each bass note.
  - Frost creeps up its lowest rods, and by "time" (88.52) the lowest plate is rimed white.
  - The camera arcs underneath until it looks straight up at the plates: concentric gold circles.
- **Sync:** the bass as breath.
- **Cut out:** a match cut from the concentric plates into the concentric silo (89.95).
- **Build:** `chandelier` cool (exists) · **S–M**.

#### 29 · The fall · 89.95–92.96 · "Every byte you ever sent is mine"

- **Purpose:** chorus 1 showed the silo filling; now we fall to what waits at its bottom.
- **Image:** falling straight down the frosted shaft, rings of drawers rushing past, envelopes falling alongside.
- **Choreography:** the gold glow below grows. On "mine" (92.22) it resolves into the fridge, hanging at the bottom of
  the shaft, blazing.
- **Build:** `silo` deep (exists) · **M** (the fridge at the bottom).

#### 30 · Under the machine · 92.96–96.82 · "I'll see you sooner or later"

- **Purpose:** a return to drawer 0001, changed: now it has company.
- **Image:** low on drawer 0001, frosted shut, its tag sharp. Above it, out of focus, the gold machine's glow.
- **Choreography:**
  - The camera settles.
  - On "later" (95.84) the gold light swells and every frost crystal on the glass catches it at once, a field of
    tiny gold glints.
- **Build:** `chandelier` under · **S**.

#### 31 · The ghost key · 96.82–99.76 · "Harvest now, decrypt later"

- **Purpose:** foreshadowing. Not yet.
- **Image:** macro on the chip at the bottom of the fridge, qubits dimly lit.
- **Choreography:**
  - On "de-" (98.80) the lit qubits trace, for a breath, the outline of a key.
  - On "later" (99.28) it scatters back into the grid and dims.
- **Build:** `chip` · **M**.

### INTERLUDE: the night (99.76–107.06)

#### 32 · Lights out · 99.76–105.24

- **Purpose:** the machine works while everyone sleeps.
- **Image:** the archive hall with the fridge hanging in it. Banks of work lights overhead.
- **Choreography:** on 101.59 one bank of lights goes out; on 103.41 the next. The fridge is left glowing alone in the
  dark, its frost growing, its gold light breathing slowly with the synth.
- **Sync:** subtraction on downbeats.
- **Build:** `chandelier` dim (exists) · **S**.

### BRIDGE: the defenders' day (105.24–123.48)

#### 33 · Ticket · 105.24–110.70 · "Ticket opened, priority low"

- **Purpose:** comic relief with a point: the office in daylight, blind to the archive.
- **Image:** a daylight kanban board, blind shadows across it, a sticky note "budget: next FY".
- **Choreography:** the PQC-114 card drops into Q3 2022 on "o-" (107.77). The red LOW chip stamps on "low" (109.54).
- **Build:** `backlog` (exists) · **S**.

#### 34 · Pages · 110.70–112.52 · "Pushed to next quarter…"

- **Image and choreography:** the desk calendar on its stand in office light. One quarter page tears away on every 8th
  note, a flurry of paper, Q3 2022 … Q2 2026.
- **Build:** `calendar` · **S** (timing).

#### 35 · Sixteen times · 112.52–114.20 · "…four years in a row"

- **Image and choreography:** the card lands, slightly askew, in Q3 2026: "Moved 16×". It lands on "row" (113.22).
- **Build:** `backlog` · **S**.

#### 36 · The question · 114.20–117.94 · "Somebody asked, 'Who'd even store it?'"

- **Image and choreography:**
  - Close on the card. A comment box opens: "Somebody · just now", typing dots, then "who'd even store it?".
  - On "store" (116.94) a thumbs-up pops on with a count of 3.
  - The bass that returned at 114.35 builds underneath.
- **Build:** `backlog` comment (exists) · **S**.

#### 37 · Petabytes · 117.94–123.48 · "Petabytes, darling. I adore it."

- **Purpose:** the answer to the question, on the loudest bar of the song.
- **Image:** a hard cut to the night side of the Earth from orbit: real coastlines, clouds, a thin blue atmosphere,
  and every continent veined with gold light, the archive network threading between the cities. An engraved plate:
  ARCHIVE · 31,000 PB (fiction).
- **Choreography:**
  - The camera drifts.
  - On "a-dore" (119.92) it leans in, slowly and lovingly.
  - From the snare roll (121.64) it accelerates toward the planet until the disc fills the frame.
- **Sync:** the cut, then the roll.
- **Cut out:** a match cut from the Earth's disc to the clock face (123.48).
- **Build:** `earth` (exists, one of the best v5 shots) · **S–M**.

### FINAL CHORUS: the opening (123.48–145.44)

#### 38 · I had the time · 123.48–128.25 · "I waited for you, I had the time"

- **Purpose:** the wait is over. Quiet, intimate.
- **Image:** the clock in ice, now in warm gold light.
- **Choreography:** in slow motion, beads of water form on the ice and run. A sheet of ice slides off the face. On
  "time" (126.84) the hands start to run again.
- **Sync:** stillness; slow motion.
- **Build:** `clock` thaw (exists) · **S**.

#### 39 · Mine · 128.25–131.02 · "Every byte you ever sent is mine"

- **Image:** macro on the chip in gold light, frost on its edges.
- **Choreography:** on the isolated hit (128.91) a first row of qubits flares. On "mine" (130.70) every qubit blazes
  gold, and gold light runs down the bond wires.
- **Build:** `chip` base (exists) · **S**.

#### 40 · The key falls · 131.02–134.38 · "The fridge hums low, the key falls out"

- **Purpose:** the turn of the story.
- **Image:** under the fridge, looking up at the chip, gold light in curling vapour.
- **Choreography:**
  - On "hums" (131.37) the whole rig shivers: frost dust shakes loose from the plates and drifts down through the
    light.
  - The blazing qubits stream off the chip and gather into a real key: brushed gold, with a bit cut in the pattern of
    the qubit grid.
  - On "falls" (133.20) it drops out of the chip and falls in slow motion, turning, through the vapour, its edges
    catching the light.
- **Build:** `key` · **L**: a 3D gold key forming from particles is the hardest object in the act. Fallback: a key
  made only of qubit light, as particles with bloom (M).

#### 41 · The turn · 134.38–136.66 ⚑ · "So that's what…"

- **Purpose:** the lock opens.
- **Image:** macro on the ice block in drawer 0001: the frosted padlock sigil in the frozen wax seal, keyhole centred.
- **Choreography:**
  - The key slides in.
  - On "what" (135.20) it turns with a crisp click; the frost on the lock flashes to clear glass.
  - On the hit (136.19) the ice block cleaves cleanly in two along a fracture plane, and the halves part.
  - ⚑ The shot holds one beat past the hit so the cleave reads, then cuts.
- **Cut out:** a match cut from the keyhole to the round wax seal (136.66).
- **Build:** `padlock` + `relic` · **M** (key turn, ice cleave).

#### 42 · The reading · 136.66–140.68 · "…you were on about / I said sooner or later"

- **Purpose:** the payoff. For the first time, anyone reads the handwriting.
- **Image:** the collector's desk. The reading lamp from shot 5 clicks on, brass and warm. The letter, unfolded under
  it, beside the broken seal.
- **Choreography:**
  - 136.66–137.3: the seal snaps and the letter opens flat in one motion, settling under the lamp.
  - **137.3–139.6, held still:** the camera settles on one short line, centred in the frame and large enough to read on
    a phone, written on a line of its own in the letter:

    > *No one else will ever read it.*

    Only this line is in focus; the rest of the letter falls soft around it. No camera movement; only the lamp's
    light breathing faintly. About two seconds on seven words, so it registers on first viewing, under "I said sooner
    or…".
  - On "later" (139.64) the focus releases and the camera drifts down the page to "Keep it somewhere safe." and the
    signature, "Always yours, A." These are for people who pause; nobody needs to read them.
- **Sync:** the voice; stillness on the payoff line.
- **Build:** `letter` open (exists, with real text; the kit `LETTER` gets the short line) · **M** (the lamp, the
  focus, the composition).

#### 43 · Then · 140.68–145.44 · "Harvested then, decrypted…"

- **Purpose:** the breath before the payoff.
- **Image:** the cold aisle again, blue, frozen, silent: every drawer frosted shut, as in chorus 1.
- **Choreography:**
  - The camera creeps forward.
  - At 143.60 the music drops almost to silence, and so does the picture. Movement stops; only frost dust drifts in
    the strip lights.
  - On "de-" (144.26) a thin vertical line of sunlight opens at the far end of the aisle, like a door cracked open.
  - The camera holds.
- **Sync:** freeze.
- **Build:** `vault` · **M** (the light line, the stillness).

### "NOW" (145.44–160.06)

#### 44 · NOW · 145.44–149.10 · "now" (the final drop)

- **Purpose:** the biggest moment of the video, and it gets two full bars.
- **Image:** the same aisle and camera position as shot 43.
- **Choreography:**
  - **One wave, one direction.** The sunlight is the cause; the drawers are the effect. On 145.44 the line of light
    from shot 43 bursts wide at the far end, and a front of sunlight rushes down the aisle **toward the camera**.
  - As the front passes each rank of drawers, they snap open, their frost exploding into gold-lit steam behind the
    front. The front reaches the camera on beat 3 (146.37) and washes over the lens in a warm flare. Amber lamps
    flare white and settle.
  - Through the rest of bar 79 the aisle stands open and steaming in sunlight, all the way to the vanishing point.
  - **From the wash on:** the camera glides on down the aisle through the hanging pages. *(Built this way instead
    of a push into the empty drawer 0001, which did not read without more modelling; the glide is the stronger
    image.)*
  - In every open drawer around it, pages lift out and hang in the air facing the camera, each beside its broken red
    seal and torn envelope. The red seals read instantly as opened private mail. Other people's letters, for those
    who pause: "The keys are under the blue pot…", "The results came back fine…", "Keep this between us until the
    announcement. Shred after reading."
- **Sync:** everything on 145.44, then the hats as shimmer in the steam.
- **Build:** `vault` thaw (exists in a simpler form) · **L**. This is the shot to iterate the most. Fallback: v5's
  sunrise aisle with one hit-synced wave of drawers opening and a steam burst.

#### 45 · The reading room · 149.10–152.75 · "now" (held)

- **Purpose:** the violation, made beautiful: everyone's private words are read.
- **Image:** the camera rises above the racks. The whole hall is filled with thousands of hanging pages, glowing like
  paper lanterns in the sunrise.
- **Choreography:**
  - Each page hangs with its broken red seal beside it: from above, the hall is gold light dotted with thousands of
    small red seals, the signature image of the video.
  - Thin gold scan lines sweep across the pages in waves, on the kicks, each page brightening as it is read.
  - In the centre, the silo is still pouring: a fresh stream of sealed envelopes spirals down into it. The archive
    never stops.
- **Build:** `vault` city (exists as a rise) + pages + `silo` · **L**. Fallback: the v5 city rise with pages lying in
  the open drawers.

#### 46 · In broad daylight · 152.75–160.06 · final drop, peak

- **Purpose:** from one hall to the whole world, and it is still running.
- **Image:** the Earth's limb filling the lower third, the dawn terminator crossing it.
- **Choreography:**
  - As daylight sweeps over each continent the gold network does not go out. It burns on, visible in broad daylight.
  - On 156.40 (bar 85, the peak) the sun clears the limb: a starburst, a wide anamorphic streak, the frame flooding
    white-gold.
  - From 158.23 the white flood recedes with the music, but the sun's disc stays: a small, hard point of light over
    the darkening limb, the shape the eye keeps. Over the last two beats it shrinks to the size of the padlock's glow
    and cools from white toward green.
- **Sync:** the peak.
- **Cut out:** a match cut from the sun's disc to the green glow (160.06), at the same position and size, so the eye
  carries the point of light from one shot to the next.
- **Build:** `earth` dawn · **M** (reframe, the daylight network).

### OUTRO: again (160.06–164.40)

#### 47 · Connection secure · 160.06–164.40 · "Connection secure."

- **Purpose:** the twist. It is happening right now, to today's letter.
- **Image:** ink-blue dark, the start of the video again. A new envelope, its glass padlock glowing green, postmarked
  with today's date.
- **Choreography:**
  - On "se-cure" (161.56) the lock clicks and the same tooltip as shot 4 opens: 🔒 Connection secure.
  - On the hit (162.32) a pale, translucent twin peels off the envelope and drops away into the dark below, frost
    glinting on its edge.
  - The title fades up (162.8) over the green padlock: HARVEST NOW, DECRYPT LATER · NEAD.
  - Silence from 163.71. Hold.
- **Build:** `padlock` secure + `letter` · **M**.

---

## 6. What is reused, replaced and new

| v5 scene | fate | why |
|---|---|---|
| `letter`, `padlock`, `clock`, `silo`, `relic`, `chip`, `chandelier`, `hook`, `backlog`, `calendar`, `warehouse`, `lattice`, `robot`, `door`, `vault`, `earth` | **reused**, with new phases | they already look good; their new behaviours are listed per shot |
| `aerial` (facility exterior) | **retired** | boxy buildings on a flat plain; a convincing landscape is the most expensive thing to do in code |
| `cable` (sea floor) | **retired** | murky and unreadable; `fibre` does the same job as a beautiful macro |
| `wire` (tap and rekey diagram) | **retired** | reads as an infographic; replaced by `fibre` and the ice block |
| `scale` hall and city levels | **retired** | stripes and tiles; replaced by the drop-1 montage; the Earth stays |
| `key` | **rebuilt** | the v5 key is flat |
| **`fibre`** | **new** | shots 5, 6, 15, 23 |

### Effort, honestly

| size | shots | risk |
|---|---|---|
| **L** (several iterations expected) | 6 copy freezing, 40 key forming, 44 NOW, 45 reading room; 1 wax drop (with the creeping frost) is M–L | liquid, ice growth, particle-to-object, mass animation with steam |
| **M** | 2, 5, 13, 15 (with the shatter transition), 20, 21, 23, 29, 31, 41, 42, 43, 46, 47 | each adds a new physical behaviour; each has a fallback |
| **S** | the rest, now including 7 (the block settles, no crack) and 14 (the shatter moved to 15) | timing, framing, light |
| engine | sync tools with per-scene tuning (M), dither and grain (S), match-cut framing checks (S) | — |

This is more work than revision 1 claimed. The fallbacks keep the video finishable if an L shot doesn't reach the bar.

---

## 7. Prove it first

Before rebuilding all 47 shots, render these as finished, full-quality clips with the music, in this order (riskiest
and most important first):

| proof | shots | time | proves |
|---|---|---|---|
| P0 the opening 30 seconds | 1–8 | 0.00–30.12 | curiosity before the premise is explained; the material look; the first-kick hit; the fibre, unreadability and ice growth; the calm block on the bass |
| P5 NOW | 43–45 | 140.68–152.75 | the hush, one wave of cause and effect, the predatory beauty of the reading room, exposure that reads without reading |
| P4 key to letter | 40–42 | 131.02–140.68 | the 3D key, the cleave, the readable betrayal |
| P3 the harvest | 14–20 | 45.49–61.35 | the shatter transition, cut-on-bar energy, the montage reading as one idea |

P0 contains revision 2's P1 (wax seal) and P2 (copy freezing).

**What each clip must clear: motion and understanding, not stills.**

1. **Motion reads.** Every action has anticipation, a clear impact and a settle; motion blur and occlusion help
   rather than smear; transitions carry the eye (the same shape or position across the cut).
2. **Sync.** Every planned hit lands within 2 frames (33 ms at 60 fps) of its target. This is checked by measuring the
   rendered frames against `audio.json`, not by eye.
3. **Phone scale.** Watched at phone size (about 390 px wide), the subject of each shot, the payoff line and the red
   seals are legible.
4. **No banding** after re-encoding at YouTube-like bitrates (about 8 Mbps for 1080p).
5. **Render time** per clip is acceptable.

**The viewer test (needs a person who doesn't know the project).** Show the clip once, at normal speed, on a phone,
with sound. Ask:

- P0: What happened to the letter? What are you curious about now? Where did your attention drift?
- P4: What did the letter say? How did that make you feel?
- P5: What did the sunrise mean? If the answer is "everyone was freed", the predatory meaning needs more work.

If a proof fails, switch that shot to its fallback, or fix the meaning, before building the rest.

---

## 8. Build status (proof stage)

The edit is `data/cues.json` (47 entries; `cues.md` is generated from it and gives the exact cut times, which differ
from the table above by a beat in a few places, e.g. the clock → silo cut lands on the beat at 38.39). Shots not yet
built play v5 scenes as placeholders.

| proof | built | notes |
|---|---|---|
| P0 opening (shots 1–9) | the wax drop from a melting stick, title, frost creeping to the seal, stamp on the first kick, the green glow of the sigil, the tooltip on "said", the whip on "done", the new `fibre` scene (tap, lens, backlit ciphertext; the copy peeling off and freezing into a slab), the slab set down in its cradle, drawer 0001, the door's bolts on the seven snares | drawer 0001 receives the frosted envelope (the cradle is not shown) |
| P3 harvest (shots 14–20) | the hook shattering into the fibre bundle (a one-beat overlap, `tail`), the bundle, the silo pour, the robot, the slam along one wall, the counter close-up, the rise into the hall | no gauge overlay across the cuts yet; the hall's 9,400 PB tag carries the scale |
| P4 key → letter (shots 40–42) | a turned 3D gold key gathering from the qubits; it turns in the frosted lock on "what"; the reading lamp, the letter opening, the hold on "No one else will ever read it." | the slab's cleave behind the lock reads weakly |
| P5 NOW (shots 43–45) | the hush, the line of light on "decrypted", the sunrise front down the aisle on "now" (drawers, padlocks, steam), the pages hanging with their red seals, the glide through them, the cut to the hall of glowing pages read by scan lines on the kicks | — |

Engine: `bar` cuts take a `beats` offset; an entry's `tail` overlaps the next cut; post `dither` (harvest-remix 2.5)
against banding; `--pixfmt yuv420p10le` for a 10-bit master.

## 9. YouTube

- **The first five seconds** are the slow-motion wax drop, the title, and frost creeping toward the letter, then the
  stamp on the first kick. The first 30 seconds get their own proof (P0), since YouTube ties early retention to
  meeting the title's and thumbnail's promise.
- **Thumbnail:** the glowing green padlock in red wax (shot 4) with the title is the most iconic and highest-contrast
  frame, and the opening shows it by 0:08 (shot 2) so the video meets the thumbnail's promise at once. Alternatives: the gold hook through frost (14), the "NOW" aisle (44), the silo vortex (12).
- **Rewatch loop:** the last shot repeats the first gesture (a letter, a padlock, a copy taken), and the tooltip
  pays off the plant from 0:13.
- **Pause-worthy details:** the letter's text, the other people's notes, the chip engravings, ML-KEM · FIPS 203 ·
  2024, the sticky notes on the board. The video rewards freeze-framing and comments.
