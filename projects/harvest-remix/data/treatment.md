# Harvest Now, Decrypt Later (Banger Remix): treatment

## 1. The central idea: cold storage

The whole video happens in **the collector's cold room**: a facility where intercepted traffic is kept on ice
until a machine cold enough to open it is ready. The singer is the collector, a patient lover ("I'll wait for you,
I've got the time", "Petabytes, darling. I adore it"), and the cold room is where the love letters are kept.

It fits because the lyric already lives there: "I put it on ice", "I only have to keep you", "the fridge hums low,
the key falls out". The joke at the core of the world is literal: a quantum computer *is* a fridge. A dilution
refrigerator hangs its gold-plated stages like a chandelier and cools its chip to ten thousandths of a degree above
absolute zero. So the room holds two cold things: the **archive** (racks of frozen, sealed envelopes) and the
**chandelier** (the machine being built, stage by stage, to thaw them). The song's arc is the room's arc: a copy
is filed (verses), the archive grows (chorus one), the machine grows (verse two, chorus two), the defenders
postpone (bridge), the machine reaches base temperature and the archive thaws into plaintext (final chorus). The
little green padlock that "said the hard part was done" opens the video and closes it, still saying so.

The world's rules:

- Every message is a **sealed envelope** with a small padlock on its flap and a date stamp. Sealed means
  unreadable: its contents are never shown until the thaw.
- A copy is always made: the tap on the wire peels off a ghost of every envelope and drops it to the cold room.
- Cold is shown as **frost growing on surfaces** (hairline dendrites creeping across glass, drawer fronts, the
  padlock), never as falling snow. Temperature is a reading (K, mK) on the chandelier.
- Daylight belongs to the defenders (the office) and, in the end, to plaintext: when the archive thaws, the cold
  blue room is flooded with flat white light.

## 2. Visual vocabulary

| object / place / process | shown as | carried by |
|---|---|---|
| The address bar and its little green padlock | a single hairline browser bar in the dark, a small closed padlock drawn in green, a blinking caret | `harvest-remix-padlock` (intro, outro) |
| The wire and the tap | one glowing fibre crossing the frame left to right; envelopes ride it as sealed packets; a prism-like splitter halfway along peels a translucent copy off each one and drops it into a frost-lined chute | `harvest-remix-wire` (verse 1, verse 2) |
| The envelope | a flat 3D card with a folded flap, a padlock on the seal, a mono date stamp ("TUE 2021-03-09") | wire, vault |
| Ciphertext | the envelope's face under the tap's reader: a dense block of shifting hex and noise that never resolves (a reading, not a caption) | wire |
| The cold room / archive | a three.js aisle of steel racks receding into fog; each rack a wall of small drawers with frosted fronts, a mono tag and a pale status lamp; overhead strip lights in cold blue; breath-like mist at floor level | `harvest-remix-vault` (prechorus 1, chorus 1, bridge payoff, final chorus) |
| The storage gauge | the archive's fill reading, in petabytes, mounted on the cold room wall | `lib-counter` (chorus 1 instrumental), echoed as a tag in the vault |
| The chandelier (dilution refrigerator) | five gold-plated circular stages hung one under another on rods, coiled coax lines spiralling down between them, a small square chip at the bottom with a grid of qubit dots; a temperature readout beside each stage (50 K, 4 K, 800 mK, 100 mK, 10 mK) | `harvest-remix-chandelier` (verse 2, chorus 2, final chorus) |
| The new math | a crystalline 3D lattice of points (ML-KEM is lattice cryptography) with one bright short vector; the good lock nobody installs | `harvest-remix-lattice` (prechorus 2) |
| The backlog | a daylight kanban board: columns headed by quarters, one ticket card "PQC-114 Migrate key exchange to post-quantum", a "LOW" priority chip, a comment thread | `harvest-remix-backlog` (bridge) |
| The key | a toothed key built from the chip's qubit dots, dropping out of the bottom of the chandelier | chandelier (final chorus) |
| The thaw | frost retreating from drawer fronts in a wave, padlocks springing open down the aisle, envelopes unfolding into the documents inside: drawn as line drawings (a building blueprint, a birthday cake with a date, the Tuesday message as ruled lines) | vault (final chorus) |

Text inside scenes is only ever a label or a reading in the world: date stamps, drawer tags, temperatures, qubit
counts, ticket fields, the gauge. The karaoke layer carries every sung line; the scenes show what the words are
about. The one exception is the first chorus hook (L9), set big with `lib-lyric`: the only lyric-as-type moment in
the video.

## 3. The recurring motif: the padlock (and the drawer it ends up in)

One small padlock is planted in the first frame and paid off in the last. Its states:

| section | state of the padlock |
|---|---|
| intro | one small green padlock in an empty address bar, closed. The plant. |
| verse 1 | the same padlock rides the Tuesday envelope down the wire; it clicks green on "padlock". The tap copies it: the copy's padlock is a pale, frosted twin. |
| prechorus 1 | the frosted padlock is filed in drawer **0001**, tag "TUE 2021-03-09". The drawer shuts on "keep". |
| chorus 1 | hundreds of frosted padlocks fill the aisle; the drawer counter climbs; the gauge rolls to petabytes in the instrumental. |
| verse 2 | new green padlocks on new envelopes ("you changed all of your passwords"); below, the old frosted copies do not change. |
| prechorus 2 | a new kind of lock, the lattice, is handed over, then boxed and stamped "LATER". |
| chorus 2 | the frosted padlocks wait under the chandelier; on "decrypt" (L19) the first hairline crack runs across one of them. |
| bridge | the boxed lattice is the ticket's attachment, pushed quarter after quarter; on "Petabytes" the aisle pulls back to an endless field of frosted padlocks. |
| final chorus | the key falls (L26); padlocks spring open in a chain down the aisle (L27); drawer 0001, the Tuesday envelope, opens first (L28): the plant pays off. |
| outro | the little green padlock again, closed, intact, glowing politely: "Connection secure." It is telling the truth, today. |

A second, quieter counter runs alongside: the drawer count on the vault tags (0001 in prechorus 1, five figures by
the end of chorus 1, "3.1 PB" at the bridge) and the chandelier's temperature (300 K bare frame in verse 2, falling
to 20 mK in chorus 2, 10 mK "base" in the final chorus).

## 4. The arc, section by section

| section | time | energy | subject on screen | scene(s) | palette |
|---|---|---|---|---|---|
| intro | 0.00–8.35 | low | the empty address bar and the green padlock; frost begins to creep from the frame corners on each bar | `harvest-remix-padlock` | `frost` |
| verse 1 | 8.35–23.66 | low | the wire: the Tuesday envelope, the padlock clicking green, the tap's unreadable reading, the copy dropping into the chute | `harvest-remix-wire` | `frost` |
| prechorus 1 | 23.66–33.81 | mid | the first drawer in a dark cold room: the copy filed, the lock glinting untouched on "break", the drawer shutting on "keep" | `harvest-remix-vault` (keep) | `frost` |
| chorus 1 | 33.81–48.52 | high | the archive at scale: the camera dollies down the aisle, drawers slamming shut on the beats, envelopes dropping from chutes, amber status lamps; the hook set big | `harvest-remix-vault` (harvest), then `lib-lyric` for L9 | `amber` |
| instrumental | 48.52–62.02 | high | the storage gauge on the cold room wall rolling up through four figures | `lib-counter` | `amber` |
| verse 2 | 62.02–69.04 | mid | the chandelier as a bare frame under work lights: stages bolted on, the chip's qubit grid filling, the readout counting down the decade | `harvest-remix-chandelier` (build) | `frost` |
| verse 2 | 69.04–76.46 | mid | the wire again, now dense: new locks on new envelopes; below, the old copies in the chute, two of them glimpsed through the frost (a blueprint, a birthday) | `harvest-remix-wire` (rekey) | `frost` |
| prechorus 2 | 76.46–85.15 | mid | the lattice crystallising, then folded into a crate stamped "LATER" and slid into the dark | `harvest-remix-lattice` | `frost` |
| chorus 2 | 85.15–99.82 | high | the chandelier complete and turning, gold stages lit, coax coiling, temperature falling per line, the frozen padlocks waiting below; first crack on "decrypt" | `harvest-remix-chandelier` (cool) | `amber` |
| instrumental | 99.82–105.24 | mid | the chandelier hums alone; its stages dim one by one to black | `harvest-remix-chandelier` | `amber` |
| bridge | 105.24–117.94 | highest | the defenders' office in flat daylight: the ticket opened, shoved one column right on every beat for sixteen quarters, the comment "who'd even store it?" | `harvest-remix-backlog` | `plain` |
| bridge | 117.94–123.48 | highest | "Petabytes, darling": the camera pulls back out of one drawer to an endless warehouse of frosted racks | `harvest-remix-vault` (petabytes) | `amber` |
| final chorus | 123.48–134.51 | high | the chandelier at base temperature, 10 mK, every qubit lit; the stages shiver on "hums low"; the key drops out on "falls" | `harvest-remix-chandelier` (base) | `amber` |
| final chorus | 134.51–153.64 | high | the thaw: daylight floods the cold room, frost retreats, padlocks spring open down the aisle, drawer 0001 opens first, envelopes unfold into their drawings; on the long "Harvested then, decrypted now" the camera rises over a whole city of open drawers | `harvest-remix-vault` (thaw) | `plain` |
| instrumental | 153.64–160.06 | high | the open archive holds in the white light, pages settling; the light drains to a single point | `harvest-remix-vault` (thaw) | `plain` |
| outro | 160.06–164.40 | mid | the address bar and the little green padlock, closed and intact: "Connection secure." A last thread of frost creeps in from a corner | `harvest-remix-padlock` | `frost` |

How the choruses change: **chorus 1** is the harvest (the archive filling, amber lamps in the frost); **chorus 2**
is the machine for later (a new subject, the chandelier, with the archive now a layer beneath it, and the first
crack); the **final chorus** inverts the whole room: the cold blue ground turns to flat white daylight, closed
becomes open, sealed becomes readable.

Proposed entries (the cues step decides the details):

1. `open` `harvest-remix-padlock` at zero (intro).
2. `tap` `harvest-remix-wire` on the beat of L0.
3. `keep` `harvest-remix-vault` on the beat of L4.
4. `harvest` `harvest-remix-vault` at bar 18 (chorus 1), the same scene with its chorus behaviour.
5. `hook` `lib-lyric` on the beat of L9: `{"align": "left", "upper": true}`, anchor `Harvest`, emphasis `later`.
6. `gauge` `lib-counter` at the end of L9: `{"title": "Cold storage · used", "unit": " PB", "decimals": 1}`; span
   cues on bars 27, 29, 31, 32 rolling to 0.1 ("one Tuesday"), 4.7 ("one company"), 310 ("one ministry"),
   9400 ("one continent").
7. `build` `harvest-remix-chandelier` on the beat of L10.
8. `rekey` `harvest-remix-wire` on the beat of L12.
9. `newmath` `harvest-remix-lattice` on the beat of L14.
10. `cryo` `harvest-remix-chandelier` on the beat of L16, through the instrumental to bar 57.
11. `backlog` `harvest-remix-backlog` at bar 57.
12. `petabytes` `harvest-remix-vault` on the word of L23 (transition pullback).
13. `base` `harvest-remix-chandelier` on the beat of L24.
14. `thaw` `harvest-remix-vault` on the word of L27.
15. `secure` `harvest-remix-padlock` at bar 87.

Anchors worth landing: L0 `Tuesday,` (date stamp), L1 `padlock` (green click), L2 `read` (the reader fails),
L3 `ice` (the copy hits the chute; frost blooms), L4 `break` (the lock glints, untouched), L5 `keep` (drawer
shuts), L6 `time`, L7 `mine`, L8 `later`, L9 `Harvest`, L10 `qubits,`, L11 `decade’s`, L12 `passwords,`,
L13 `blueprint`, L14 `math`, L15 `that` (crate stamped LATER), L19 `decrypt` (first crack), L20 `opened,`,
L21 `row`, L22 `store`, L23 `Petabytes,`, L24 `time`, L25 `mine`, L26 `falls`, L27 `about`, L28 `later`,
L29 `decrypted`, L30 `secure.`.

## 5. Custom scenes

### `harvest-remix-padlock`: the address bar

- **Image.** Near-black ground in the frost palette. One hairline rounded rectangle (a browser address bar) at
  centre, wide and thin, with a small padlock drawn in green at its left end (a real padlock shape: shackle arc,
  rounded body, keyhole) and a slowly blinking caret. A soft green glow under the lock is the only warm light.
  Frost dendrites (branching hairlines, grown procedurally from seed points) creep in from the frame corners.
- **Music.** Frost grows a step on each downbeat; the caret blinks on the beat; the lock's glow breathes with the
  loudness.
- **Sung words.** On the cue's anchor the padlock gives one small "click" (the shackle seats a pixel deeper, a ring
  of light). In the outro, on `secure.`, the address bar shows a tiny "Connection secure" tooltip under the lock,
  as a browser does: a reading, quietly ironic.
- **Return.** Intro: frost creeping in, the bar alone (the plant). Outro: the same bar, clean, the lock intact,
  frost retreated, then one last thread of frost creeping in from a corner as the song ends (the next harvest
  begins). Entry param `phase`: `open` | `secure`.

### `harvest-remix-wire`: the tap

- **Image.** A single glowing fibre crosses the frame left to right at upper third, with depth (it recedes slightly
  toward the right, a little perspective). Sealed envelopes ride it as 3D cards. Halfway along, a small prism
  housing (the tap) clamps the fibre; under it a frost-lined chute falls out of frame. The tap's reader is a small
  panel showing the envelope's face as a block of shifting hex.
- **Music.** Envelopes travel on the beats (eased hops along the wire, not linear drift); the fibre's light pulses
  with the kicks; the reader's hex churns with the hats.
- **Sung words.** Verse 1, one envelope as the subject: L0 it is sent and stamped "TUE 2021-03-09" on `Tuesday,`;
  L1 its padlock clicks green on `padlock`; L2 it passes the tap and the reader fills with noise that never
  resolves on `read`; L3 a translucent copy peels off on `copy` and drops into the chute on `ice`, frost blooming up
  its walls.
- **Return (verse 2, `rekey`).** The wire is dense: dozens of envelopes, every one copied, the chute a steady drop.
  On `passwords,` the new envelopes' padlocks all re-key at once (a ripple of green clicks along the wire) while the
  copies already in the chute stay frosted and unchanged. On `blueprint` and `birthday` the camera dips into the
  chute: two old envelopes seen through their frost, a faint line drawing of a building plan in one, a cake with a
  date in the other; their tags read "valid: forever". Entry param `phase`: `one` | `rekey`.

### `harvest-remix-vault`: the cold room

- **Image.** three.js. A long aisle between tall steel racks, each a wall of small drawers with frosted glass
  fronts, a mono tag and a pale status lamp. Overhead strip lights, cold blue, falling off into fog; low mist at
  the floor. Depth comes from the fog and the rhythm of rack uprights. Each drawer holds one sealed envelope, its
  frosted padlock visible through the glass.
- **Music.** The camera dollies on the bar (a step, a settle); drawers slide shut on the kicks; status lamps tick
  on with the hats; the strip lights swell with loudness.
- **Sung words.** The anchor is a drawer's action: filed, shut, tagged.
- **Phases (entry param `phase`).**
  - `keep` (prechorus 1, frost): darkness, one rack lit. Drawer 0001 receives the copy; on `break` the camera
    passes close to the lock and it glints, untouched; on `keep` the drawer slides shut and its tag prints
    "0001 · TUE 2021-03-09". Racks fade up behind as the section builds.
  - `harvest` (chorus 1, amber): the full aisle, amber status lamps behind frost, envelopes dropping from chutes in
    the ceiling, drawers slamming in waves down the aisle, the tag counter on the end of each rack climbing
    (00412, 01930, 08811 …).
  - `petabytes` (bridge L23, amber): starts tight on one drawer, then a long pullback up and out until the aisle is
    one line among hundreds, a city grid of racks under a dark ceiling; a wall tag reads "3.1 PB".
  - `thaw` (final chorus, plain): the light changes from cold blue to flat daylight in a wave down the aisle; frost
    retreats from the drawer fronts; padlocks spring open in a chain (`about`); drawer 0001 opens first and its
    envelope unfolds into ruled lines of the Tuesday message (`later`); on `decrypted` every drawer opens and the
    camera rises over a white city of open drawers and unfolded pages; in the instrumental the pages settle and the
    light drains to a point.

### `harvest-remix-chandelier`: the dilution refrigerator

- **Image.** Centre frame, a vertical stack of five circular plates hung on thin rods, each smaller than the one
  above: the classic gold-plated "chandelier" of a quantum computer, rendered in three.js with warm specular
  metal. Coax lines spiral down between plates; a square chip at the bottom shows a grid of qubit dots. A thin
  readout beside each plate: 50 K, 4 K, 800 mK, 100 mK, 10 mK. Below, out of focus, the frozen archive drawers.
- **Music.** It turns slowly; plates flash a rim light on the downbeats in sequence top to bottom; the coax
  shimmer runs with the hats; the whole rig shivers subtly with the bass.
- **Sung words.** Anchors add or light parts of the machine; the readouts change on anchors.
- **Phases (entry param `phase`).**
  - `build` (verse 2, frost): a bare frame under cold work lights, room temperature (300 K). On `qubits,` a plate
    is bolted on and the chip's grid lights a new row (qubit count reading 53 → 127 → 433 → 1121). On `decade’s` a
    small readout "Q-DAY ETA" counts its years down fast to "near".
  - `cool` (chorus 2, amber): complete and gold, turning. The temperature falls one stage per line (4 K, 800 mK,
    100 mK, 20 mK). The frosted padlocks wait below. On `decrypt` (L19) a hairline crack runs across one of them.
    In the instrumental the plates dim one by one, top to bottom, to black.
  - `base` (final chorus, amber): at base temperature, "10 mK", every qubit lit, frost on the outer can. On
    `hums` the stages shiver visibly with a low wobble; on `falls` a key assembled from the qubit dots drops out of
    the bottom of the chip and falls out of frame.

### `harvest-remix-lattice`: the new math

- **Image.** A crystalline 3D lattice of points joined by hairlines, slowly rotating in the dark, green-lit (the
  good lock, the frost palette's green), with one bright short vector from the origin. A small mono label at the
  corner: "ML-KEM · FIPS 203 · 2024".
- **Music.** Lattice points light in shells outward from the origin on the beats; the rotation eases on the bars.
- **Sung words.** On `math` (L14) the lattice snaps into full crystal, the short vector flares. On L15 it folds down
  into a plain cardboard crate; on `that` a stamp lands on the crate, "LATER", and it slides off into the dark (the
  same crate becomes the ticket's attachment in the bridge).
- **Return.** It does not return as a scene; it returns as the crate icon on the ticket.

### `harvest-remix-backlog`: the ticket

- **Image.** Plain palette, flat office daylight. A kanban board seen straight on: column headers are quarters
  ("Q3 2022", "Q4 2022" …), one ticket card large in the frame: "PQC-114 · Migrate key exchange to
  post-quantum", a red "LOW" priority chip, an assignee avatar circle, a crate icon (the lattice from prechorus 2) as
  the attachment.
- **Music.** The bridge is the loudest section: the card is shoved one column right on every beat of L21, the
  quarter headers sliding past (sixteen quarters, Q3 2022 to Q2 2026), each shove with a little paper skid; a
  "moved" counter on the card ticks up.
- **Sung words.** L20: the card is created, fields filling in, the "LOW" chip stamped on `low`. L21: the shoves,
  landing on `row` with "Moved 16×". L22: a comment appears under the card and types itself: "who'd even store
  it?", with a thumbs-up count of 3 on `store`. (The comment is a document inside the world; the karaoke layer
  still carries the line.)
- **Return.** It does not return: the next cut (L23) answers the comment with the vault pullback.

## 6. Style bible

### Palettes

- **`frost`**: the cold room and the wire; intro, verses, prechoruses, outro.
  - `bg` #060A10, a blue-black: the dark of a server room at night, cold before anything is lit.
  - `type` #E6EFF4, frost white with a blue cast: the colour of rime.
  - `accent` #7CCFEA, ice cyan: frost, the fibre's light, the cold strip lamps.
  - `accent2` #46D17A, padlock green: reserved for the padlock and the lattice (the promise of safety). Nothing
    else is green.
  - `dim` #5E6E7B, `panel` #0E1620, `rule` #1C2834, `onAccent` #06121A.
- **`amber`**: the choruses and the chandelier; the collector's affection.
  - `bg` #0B0806, a warm black, so the gold reads as heat in the cold.
  - `type` #F4ECDF, warm paper white.
  - `accent` #E9A646, gold plating: the chandelier's metal and the archive's status lamps. A love song's warmth.
  - `accent2` #8FD3EA, frost: the cold is still present on the drawer fronts and the outer can.
  - `dim` #7A6A58, `panel` #18120C, `rule` #2C2218, `onAccent` #1A0F02.
- **`plain`**: daylight; the office in the bridge and the thawed archive in the final chorus. Plaintext.
  - `bg` #EEEAE1, flat paper-white office light.
  - `type` #14161A, ink.
  - `accent` #C2361F, sealing-wax red: the "LOW" chip, the broken seals, what is exposed.
  - `accent2` #1F7A45, the padlock green made dark enough to read in daylight.
  - `dim` #6E6A62, `panel` #E2DDD2, `rule` #CFC8BA, `onAccent` #FFF8F0.

### Type

- `display`: Archivo 100 / 900, for the few large labels (the hook, the gauge).
- `body`: Archivo 100 / 500, ticket fields and card text.
- `mono`: IBM Plex Mono 400: date stamps, drawer tags, temperatures, qubit counts, hex. The cold room's voice.
- `serif`: Cormorant Garamond italic 400: reserved for the few traces of the collector's hand (the "LATER" stamp is
  not serif; the documents unfolding in the thaw are).
- `stencil`: Archivo 62 / 900, rack numbers and the "LATER" stamp.

### Motion

- Things land on the sung word: a drawer shuts, a lock clicks, a stamp lands, a key falls. The anchor is a
  physical event with a small settle, never a fade.
- Breathe with the beat: camera steps on the bar, lights on the kicks, readouts and hex on the hats.
- Enter with intent: envelopes hop along the wire in eased beats; the ticket skids; the chandelier turns slowly
  and steadily (its calm is the menace).
- Cold is slow, the thaw is fast: frost grows in steps over bars; it retreats in a single wave.

### Karaoke

The lyric layer carries every line, low in frame, in Archivo 700, no next-line preview, a light scrim (0.3) in the
palette's ground. Scenes keep the bottom fifth quiet (the chute and the floor mist sit there, low contrast).

## 7. Don'ts

- No hooded hacker, no faces, no silhouettes in hoodies, no skulls, no "ACCESS GRANTED" / "HACKED" type.
- No green Matrix rain or falling 0s and 1s; ciphertext is a reading in the tap's panel, nothing more.
- No cyber-attack globe with arcs, no world map with pinging dots.
- No glowing-orb or brain "quantum computer", no Bloch spheres floating in space: the machine is a dilution
  refrigerator and looks like one.
- No falling snow: cold is frost growing on surfaces and numbers on readouts.
- No spectrum bars, lens flares, random particles, chromatic-aberration glitch as decoration.
- No real personal data in the thaw: the decrypted contents are line drawings (a blueprint, a cake, ruled lines).
- Don't set the lyric as type in scenes beyond the one `lib-lyric` hook (L9); the backlog comment and the outro
  tooltip are documents in the world, kept small.
- Don't play the collector as a villain in shadow: the wit is that it is a patient love song. Warmth (amber) belongs
  to the collector.
- Don't use green for anything but the padlock and the lattice.
