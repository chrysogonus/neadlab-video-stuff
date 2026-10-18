# Harvest Now, Decrypt Later (Banger Remix): treatment (v6)

v6 is a story pass. The look of v5 stays (2.39:1 scope frame, lyrics as subtitles in the lower bar, volumetric light,
oval bokeh, streaks, the data-centre archive, the real Earth, handwritten paper). What changes is the arc: one letter
followed from sealing to reading, a collector who is present without a face, a machine whose every step is motivated,
choruses that escalate instead of repeating, a final chorus that is one chain of cause and effect with one payoff, and
an ending that turns the warm finale into irony. 49 shots become 44 (3.7 s on average).

This file replaces the layered v3/v4/v5 notes; earlier versions are in git and in `out/harvest-remix-v{1..5}.mp4`.
`data/cues.json` (and so `cues.md`) still describes v5 and is rewritten from section 6 in the next step.

## 1. The story

The singer is the collector: patient, affectionate, unhurried, and the villain. The whole video is their point of
view. "You" is the sender. On a Tuesday in 2021 the sender seals a love letter (red wax, the padlock sigil) and sends
it; the little green padlock says it is safe, and it is, today. The collector cannot read it and does not try. They
take a copy, freeze it, and file it in drawer 0001 of a cold archive. They sit at a desk at the end of the aisle and
wait. Meanwhile a machine is being built to open it, and the defenders postpone. When the machine reaches base
temperature, its qubits become a key. The key falls into drawer 0001, the archive thaws at sunrise, and the collector
reads the Tuesday letter. Then a new message goes out, today, under a green padlock that says "Connection secure", and
a pale copy of it slips away into the ice. The harvest never stopped.

The thread is one object: **the Tuesday letter, drawer 0001**. It is on screen or named in every section:

| section | the letter |
|---|---|
| intro, verse 1 | sealed, postmarked, padlocked green; crosses the sea; copied at the tap and dropped on ice |
| prechorus 1 | filed in drawer 0001, tag "0001 · TUE 2021-03-09"; the vault door shuts on it |
| chorus 1 | its index card lies on the collector's desk; the drop's powers-of-ten start at drawer 0001 ("one Tuesday") |
| chorus 2 | drawer 0001 in focus under the hanging machine |
| final chorus | the key falls into drawer 0001's lock; the letter is opened and read on the collector's desk |
| outro | a new letter, dated today, sealed green, and copied again |

**The collector without a face.** Their place is a desk at the far end of the cold aisle: an empty chair, a brass
lamp (gold, their warmth), a cup of tea with a thread of steam, the index card for drawer 0001, and a desk clock
frozen in a block of ice. Nobody sits in the chair; the steam says someone just stood up. The desk returns twice
(chorus 1 frozen, final chorus thawed), and the letter is finally read on it.

**Tone.** The song is a seductive villain's love song, and the music turns triumphant at the end. The video stays on
the collector's side: the thaw is beautiful because the collector finds it beautiful. The irony is the outro's job:
the green padlock tells the truth today, and the copy is taken anyway. No cold "warning" ending and no moralising
caption; the last frame is pretty and wrong.

## 2. The world's rules

- Every message is a cream envelope with a red wax seal; sealed means unreadable until the thaw.
- The green padlock means "secure now". The frosted, colourless twin is the stored copy: secure now, readable later.
- Cold is frost growing on surfaces, ice dust hanging in light, vapour; never falling snow. Frost on the lens only in
  the intro and outro.
- Gold is the collector's warmth (the desk lamp, the archive's lamps behind frost) and the machine's metal.
- The quantum computer is a dilution refrigerator (the gold chandelier), installed in the archive, hanging at the
  bottom of the silo over the drawers. It is the same cold as the archive, made into a tool.
- Daylight is plaintext: the thaw is a sunrise, warm light, steam rising off the drawers.
- The defenders live in flat office daylight (the bridge); they never see the archive.

## 3. Colour script (`style.json`, unchanged)

| palette | where | colours | idea |
|---|---|---|---|
| `frost` | intro, verse 1, prechorus 1, verse 2, prechorus 2, outro | ink #03060D, glowing ice #7FE3FF / #8BE9FF, deep blue #1446A0, frost white #EAF6FF, padlock green #39E07A | the cold room, saturated and glowing |
| `amber` | choruses, the drop, the machine | warm black #0A0503, gold #FFB547 / #FFC15E, copper-rose #E07A5F, ice rim #9FE6FF | gold against ice |
| `plain` | bridge | fluorescent daylight, red LOW chip | the defenders' flat world |
| `dawn` | the thaw | cream-gold #FFE8C6 ground, warm ink, wax red #B3122E | sunrise, plaintext |

Motif colours in every palette: `wax`, `green` (only the padlock and the lattice), `ice`, `gold`, `deep`.

## 4. How the sections escalate

- **Chorus 1: the collection.** How much is kept: the aisle, the desk, the silo vortex, the robot, the counter, the
  hook, then the drop's powers-of-ten from drawer 0001 to a continent.
- **Chorus 2: the machine over the collection.** The same archive with the machine inside it. The camera falls down
  the silo and finds the chandelier hanging at the bottom; drawer 0001 waits under it; on "decrypt later" the key
  shows itself in the qubits for a moment and scatters (not yet); the lab's lights go out and the machine cools on
  alone through the night.
- **Bridge: the defenders' day.** Same night, other side: an office in daylight postponing the fix, and the question
  "who'd even store it?" answered by the archive itself, then by the whole night-side planet.
- **Final chorus: the opening.** One chain with no detours: the desk clock thaws → every qubit flares → the key forms
  and falls → it turns in drawer 0001 → the vault door bursts open on the sunrise → the Tuesday letter is read → every
  drawer opens and the camera rises over a golden archive → the sun breaks over the planet.
- **Outro: again.** Today's letter, green and secure, and its pale twin dropping away.

## 5. The scenes

20 scenes (the clock becomes the desk). Each line says what the scene shows and what v6 changes.

| scene | what it is | v6 shots | v6 change |
|---|---|---|---|
| `aerial` | the archive buildings in the ice at night under an aurora | title, outside, endcard | none |
| `padlock` | the glass padlock | open, lock, unlock, secure | `crack` retired; `unlock` is drawer 0001's frosted lock with its tag in frame; `secure` gains the sting (below) |
| `letter` | the envelope and letter | seal, letter | `open` is set on the collector's desk (lamp, tea, thawed clock) and runs 6 s: the seal breaks, the letter unfolds, the camera reads down the handwriting |
| `cable` | the undersea cable | cable | none |
| `wire` | the fibre, the prism tap, the frosted chute | tap, rekey | none |
| `vault` | the data-centre aisle of frosted drawers | keep, harvest, count, city | `thaw` and `city` become one continuous shot: the sun is already in from the door; on "decrypted" every drawer opens, then the camera rises over the racks |
| `door` | the round vault door | door, dawn | `open` becomes the first light of the thaw: the wheel spins and the door bursts open into the sunrise, light flooding in |
| `desk` (was `clock`) | the collector's desk at the end of the aisle: empty chair, brass lamp, tea steaming, index card "0001 · TUE 2021-03-09", desk clock in ice | desk1, desk2 | new set around the existing ice clock. `freeze`: lamp low, clock stops on the downbeat. `thaw`: the lamp flares gold, the ice cracks off the clock, the hands run |
| `silo` | the round shaft of drawers | silo, silo2 | `deep` ends on the chandelier hanging at the bottom of the shaft, its chip the gold glow; `sun` retired |
| `robot` | the tape-library arm | robot | used once (`fast` retired) |
| `hook` | "HARVEST NOW, DECRYPT LATER" cut through frost | hook | none |
| `scale` | powers-of-ten, the night Earth, the sunrise over the limb | scale, petabytes, sunrise | `gauge` opens on drawer 0001 with its tag; the "one ministry" level must read as city blocks (streets, roofs, traffic), not tiles |
| `chandelier` | the gold dilution refrigerator | build, cryo, under, night | `under` frames drawer 0001's tag in focus; `dim` becomes `night`: the lab's work-light banks go out one per downbeat, the fridge left running alone with its readout ticking down to 20 mK; `base` retired (base temperature reads on the chip) |
| `chip` | qubit chips in macro | fab, chip, ghost, qubits | new `ghost` phase: on "decrypt" the lit qubits form the outline of a key for a moment, on "later" it scatters; `qubits` readout "10 mK · BASE" |
| `relic` | a blueprint and a birthday cake frozen in ice | relic | none |
| `lattice` | the green lattice that folds into the LATER crate | newmath, crate | none |
| `warehouse` | racking full of LATER crates | stacks | none |
| `backlog` | the daylight kanban board | backlog, backlog2, comment | none |
| `calendar` | the quarter calendar | pages | none |
| `key` | the qubits form a gold key that falls | key | it falls toward drawer 0001, whose tag catches the gold light at the bottom of frame |

The outro sting (`padlock` `secure`): a fresh envelope, postmarked with today's date, its green padlock glowing. On
"secure." the lock clicks and the "Connection secure" tooltip opens. On the last beat a pale, frosted twin of the
envelope peels downward off it and drops out of frame into the dark, and one frost thread creeps in from the corner.

## 6. The edit

Times are seconds of the master; cuts follow the v5 grid (beats, downbeats, line ends) except where noted.

| # | shot | scene / phase | start | end | lyric | what we see |
|---|---|---|---:|---:|---|---|
| 1 | title | aerial title | 0.00 | 4.25 | — | the archive in the ice under an aurora; title and NEAD fade up |
| 2 | open | padlock open | 4.25 | 6.12 | — | the green glass padlock; frost grows in from the frame |
| 3 | seal | letter seal | 6.12 | 12.36 | L0 Tuesday | wax pressed with the padlock sigil; postmark "TUE 2021-03-09" slams on "Tuesday" |
| 4 | lock | padlock macro | 12.36 | 13.49 | L1 | the padlock in the wax clicks green on "padlock" |
| 5 | cable | cable | 13.49 | 16.06 | L1 | the letter as a pulse along the sea-floor cable |
| 6 | tap | wire one | 16.06 | 23.66 | L2, L3 | the tap reads only hex; on "copy" a pale twin peels off and drops onto the ice |
| 7 | keep | vault keep | 23.66 | 30.12 | L4, L5 | the copy filed in drawer 0001; it shuts on "keep", tag lit |
| 8 | door | door shut | 30.12 | 33.81 | — | the vault door swings shut, bolts home, frost blooms |
| 9 | harvest | vault harvest | 33.81 | 35.63 | L6 | the aisle, drawers slamming shut down its length |
| 10 | desk1 | desk freeze | 35.63 | 38.39 | L6 "time" | the collector's desk at the aisle's end: empty chair, lamp low, tea steaming, card 0001; the clock in ice stops on the downbeat |
| 11 | silo | silo fill | 38.39 | 41.15 | L7 "mine" | envelopes spiral into the shaft; every lamp flares on "mine" |
| 12 | robot | robot | 41.15 | 42.99 | — | the library arm slots a cartridge home |
| 13 | count | vault count | 42.99 | 45.49 | L8 "later" | the rack-end counter stops on 08811 |
| 14 | hook | hook | 45.49 | 50.34 | L9 | the hook cut through frost, gold light through it |
| 15 | scale | scale gauge | 50.34 | 61.80 | drop | drawer 0001 "0.1 PB · one Tuesday" → rack → hall → city → continent "9,400 PB" |
| 16 | build | chandelier build | 61.80 | 63.17 | L10 "qubits" | the bare frame bolting together, QUBITS 1121 |
| 17 | fab | chip wafer | 63.17 | 65.62 | L10 | a wafer of chips lighting up |
| 18 | chip | chip decade | 65.62 | 69.04 | L11 | four generations; "Q-DAY ETA near" on "decade's" |
| 19 | rekey | wire rekey | 69.04 | 73.00 | L12 | every live lock re-keys green; the frozen copies below stay pale |
| 20 | relic | relic | 73.00 | 76.45 | L13 | blueprint and birthday cake frozen in ice, "valid: forever" |
| 21 | newmath | lattice | 76.45 | 79.66 | L14 | the green lattice snaps into crystal on "math" |
| 22 | crate | lattice crate | 79.66 | 83.32 | L15 | it folds into a crate stamped LATER on "that" |
| 23 | stacks | warehouse | 83.32 | 85.15 | — | the crate becomes one of thousands |
| 24 | cryo | chandelier cool | 85.15 | 89.71 | L16 "time" | the gold fridge cooling, 50 K → 4 K on "time", frost creeping up its rods (absorbs v5's `clock2`) |
| 25 | silo2 | silo deep | 89.71 | 92.91 | L17 "mine" | falling down the frosted shaft; the gold glow below resolves into the chandelier hanging at the bottom |
| 26 | under | chandelier cool | 92.91 | 96.56 | L18 "later" | low on the drawers under the machine, tag "0001 · TUE 2021-03-09" in focus; 100 mK on "later" (absorbs v5's `robot2`) |
| 27 | ghost | chip ghost | 96.56 | 99.82 | L19 | macro on the chip: on "decrypt" the qubits trace a key, on "later" it scatters (replaces v5's `crack`) |
| 28 | night | chandelier night | 99.82 | 105.24 | — | the lab's light banks go out one per downbeat; the fridge runs alone, readout ticking to 20 mK |
| 29 | backlog | backlog | 105.24 | 110.70 | L20 | daylight board; PQC-114 opened, LOW |
| 30 | pages | calendar | 110.70 | 112.52 | L21 | quarter pages torn away |
| 31 | backlog2 | backlog | 112.52 | 114.20 | L21 "row" | the card lands in Q3 2026, "Moved 16×" |
| 32 | comment | backlog comment | 114.20 | 116.17 | L22 | "who'd even store it?" types itself |
| 33 | outside | aerial exterior | 116.17 | 117.94 | L22 "store" | the archive from the air, vents breathing: somebody stores it |
| 34 | petabytes | scale pullback | 117.94 | 123.93 | L23 | the night-side Earth veined with gold, "31,000 PB" |
| 35 | desk2 | desk thaw | 123.93 | 128.25 | L24 "time" | the lamp flares gold, the ice cracks off the clock and its hands run (absorbs v5's `base` and `clock3`) |
| 36 | qubits | chip base | 128.25 | 131.02 | L25 "mine" | "10 mK · BASE"; every qubit flares gold on "mine" |
| 37 | key | key | 131.02 | 134.51 | L26 "falls" | the qubits gather into a key; it falls through vapour toward drawer 0001 |
| 38 | unlock | padlock unlock | 134.51 | 136.20 | L27 | the key turns in drawer 0001's frosted lock; the shackle springs |
| 39 | dawn | door open | 136.20 | 137.54 | L27 "about" | the vault door bursts open into the sunrise |
| 40 | letter | letter open | 137.54 | 143.60 | L28 "later" | on the collector's desk the seal breaks, the letter unfolds on "later", the camera reads down the handwriting (cut on the downbeat before "decrypted") |
| 41 | city | vault thaw | 143.60 | 153.64 | L29 | sun down the aisle; on "decrypted" every drawer opens and pages unfold; over the held "now" the camera rises over a golden archive |
| 42 | sunrise | scale dawn | 153.64 | 160.06 | — | the sun breaks over the planet's edge and floods the frame |
| 43 | secure | padlock secure | 160.06 | 161.87 | L30 "secure" | today's letter, green, "Connection secure"; its pale twin drops away |
| 44 | endcard | aerial end | 161.87 | 164.40 | — | the archive under the aurora; title and NEAD |

Removed from v5: `clock1`/`clock2`/`clock3` (the desk replaces them), `robot2`, `crack`, `dim` (now `night`), `base`,
`thaw` (merged into `city`), `silo3`, `door2` (now `dawn`, moved earlier).

## 7. Don'ts

No faces, hands or figures (the collector is the empty chair, the lamp and the tea); no hooded hacker, skulls,
"ACCESS GRANTED"; no Matrix rain; no globe with attack arcs or pinging dots; no glowing-orb quantum computer; no
falling snow; no moralising caption at the end; no real personal data (the letters are fiction written for the
video); green only for the padlock and the lattice.
