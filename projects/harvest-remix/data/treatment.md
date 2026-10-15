# Harvest Now, Decrypt Later (Banger Remix): treatment (v5)

v5 is a detail pass over every scene, with the same edit, story and colour script as v4. The cold room is a real
data centre: storage sleds with vent grilles, ejector handles, printed barcode labels and activity LEDs; rack rails,
header labels and light bars; cable trays, an amber fibre raceway and busways overhead; a raised floor with perforated
tiles; and the room mirrored in its glossy floor. The thaw is lit as a real low sun down the aisle, not as an ink
drawing. The globe is the real Earth: Natural Earth coastlines, lakes, ice and towns (`src/assets/earth.json`, from
`scripts/earth-pack.ts`). Its night lights follow real cities and the roads between them, under clouds and a layered
atmosphere. The drop's lower levels have frosted lids over sealed envelopes, data halls, and city blocks with lit
streets and traffic. Paper carries real writing: the Tuesday letter and other people's notes in a hand (Caveat),
envelope addresses, ticket titles and sticky notes on the board, real month grids and red-pen notes on the calendar,
labels on crates, tape cartridges and chips. Every other scene gains its setting:
- the facility: clad halls, chillers, cooling towers with vapour, a mast, dishes, roads and mountains
- the sea floor: stones, a cable repeater and tube worms under an ROV lamp
- the warehouse: planked crates on pallets in orange-beamed racking
- the wire tap: an out-of-focus equipment room behind it
- the vault door: a riveted bulkhead with signage and a maker's plate
- the ice blocks: fractures, and a full architect's sheet and a birthday card frozen inside

v4 makes it big cinema: a 2.39:1 frame with the lyrics as subtitles in the lower bar (`style.json` `aspect`),
real volumetric light (spot beams and drifting fog marched against each scene's depth, `VolumeLight` in the kit),
anamorphic oval bokeh and horizontal streaks (`post.streak`), lenses widened for the scope frame, and a cleaner
frame (little grain, frost on the lens only as the intro's motif, no small callouts). It has 49 shots (3.4 s on
average) from 20 scenes: the 13 of v3 plus the archive from outside under an aurora (title, "who'd even store it",
end card), the ocean-floor cable, the vault door (shut on "keep", opened at sunrise), the ice clock (stopped in both
choruses, thawed in the last), the tape-library robot, the warehouse of LATER crates, and the calendar of quarters;
and new shots of v3 scenes: the wafer of chips, the key turning in the padlock, sunlight down the silo.

The v3 treatment follows; the edit is the cue sheet (`cues.md`).

---


v3 is written by hand, after v2 (`out/harvest-remix-v2.mp4`) was judged too plain: two sets filled 62% of the running
time, the frost palette read as teal-grey, the subjects were small in big dark frames, and shots ran 11 s at 131 BPM.
v3 has 32 shots (5.1 s on average) from 13 scenes, a colour script that follows the song's three temperatures, and a
lit, cinematic finish on every 3D scene (depth of field, light shafts, ice dust, frost on the lens, a grade).

## 1. The central idea: a love letter kept on ice

The singer is the collector, a patient lover; the intercepted message is a love letter, sealed with red wax under a
padlock sigil, and the cold room is where it waits until a machine cold enough to open it is ready. A quantum
computer *is* a fridge: its gold dilution refrigerator (the chandelier) cools the chip that will cut the key. The arc:
the letter is sealed and copied (verse 1), filed in the archive (prechorus 1), the archive is measured from one drawer
to a planet (chorus 1 and its drop), the machine grows (verse 2), the defenders postpone (bridge), the machine reaches
base temperature, its qubits become a key, and the archive thaws at sunrise (final chorus). The green padlock opens
the video and closes it, still saying "Connection secure".

The world's rules:

- Every message is a sealed envelope with a red wax seal; sealed means unreadable until the thaw.
- Cold is frost growing on surfaces and on the lens, ice dust hanging in the light, vapour; never falling snow.
- Gold is the collector's warmth and the machine's metal; the archive's lamps are gold behind frost.
- Daylight is plaintext: the thaw is a sunrise, warm gold light, steam rising off the drawers.

## 2. Colour script (`style.json`)

| palette | where | colours | idea |
|---|---|---|---|
| `frost` (cryo) | intro, verse 1, prechorus 1, verse 2, outro | ink #03060D, glowing ice #7FE3FF / #8BE9FF, deep blue fill #1446A0, frost white #EAF6FF, padlock green #39E07A | the cold room, saturated and glowing, not grey |
| `amber` (gild) | choruses, the chandelier, the drop | warm black #0A0503, gold #FFB547 / #FFC15E, copper-rose #E07A5F, ice rim #9FE6FF | gold against ice: what a dilution refrigerator looks like |
| `plain` (office) | bridge | fluorescent daylight, red LOW chip | the defenders' flat, dull world |
| `dawn` | final chorus thaw | cream-gold #FFE8C6 ground, warm ink, wax red #B3122E | sunrise, plaintext |

Every palette carries the motif colours: `wax` (the seal, the collector's love), `green` (only the padlock and the
lattice), `ice`, `gold`, `deep`. The engine's post grade (`gain`, `lift`, `sat`) pushes cold scenes blue in the
shadows and warm scenes gold.

## 3. The scenes

| scene | what it is | shots |
|---|---|---|
| `harvest-remix-padlock` | a glass padlock lit green from inside; four shots: the plant, the close-up in the red wax seal (it clicks shut and lights), the frosted lock cracking in gold light, the outro tooltip | open, lock, crack, secure |
| `harvest-remix-letter` | the envelope on a dark table: wax drop, brass stamp pressing the padlock sigil, postmark slam; at dawn the seal cracks, the flap lifts, the letter unfolds | seal, letter |
| `harvest-remix-wire` | the fibre, the prism tap, the hex reader, the frosted chute (v2, re-lit with shafts) | tap, rekey |
| `harvest-remix-vault` | the cold room's aisles of drawers (v2, re-lit; the thaw rebuilt as a sunrise: hot gold haze down the aisle, shafts, steam) | keep, harvest, count, thaw, city |
| `harvest-remix-silo` | the archive as a vast round shaft of drawers and gold lamp rings; envelopes spiral into it; chorus 2 falls down it | silo, silo2 |
| `harvest-remix-hook` | "HARVEST NOW, DECRYPT LATER" cut through a wall of frost, gold light through the letters, cracks and frost dust on the hard words (the only lyric set as type) | hook |
| `harvest-remix-scale` | one world at every scale: drawer lids, aisles, halls, city, continents from orbit; the drop's powers-of-ten pull back with the storage gauge; "Petabytes" out to the planet; the sunrise over the limb | scale, petabytes, sunrise |
| `harvest-remix-chandelier` | the gold dilution refrigerator (v2, framed closer, shafts, grade) | build, cryo, under, dim, base |
| `harvest-remix-chip` | qubit chips in macro: four generations (53 → 1121) with the Q-day ETA; the base chip flaring gold | chip, qubits |
| `harvest-remix-relic` | two ice blocks in a shaft of light, a blueprint and a birthday cake frozen in them, tags "valid: forever" | relic |
| `harvest-remix-lattice` | the green lattice and the LATER crate (v2), with a close insert on the crate | newmath, crate |
| `harvest-remix-backlog` | the daylight kanban board (v2), with a close insert on the comment | backlog, comment |
| `harvest-remix-key` | the chip's qubits stream out and gather into a gold key that falls through vapour toward a frosted padlock | key |

Shared look: `harvest-remix-kit.ts` (the stage with depth of field, shafts, lens frost; ice dust; the padlock and
envelope props; textures). Shots that cut away and back into one scene keep its motion running behind the cutaway
(the entry's `plan` param, `src/timelines.ts`).

## 4. The edit

The cue sheet (`data/cues.json`, rendered as `cues.md`) is the edit: 32 entries, one per shot. Section by section:

- **Intro**: padlock plant → the letter sealed with wax on bar 4.
- **Verse 1**: postmark on "Tuesday" → the padlock clicks green in the seal → the tap reads ciphertext → the copy on ice.
- **Prechorus 1**: drawer 0001, kept.
- **Chorus 1**: the aisle → the silo vortex on "mine" → the rack counter → the hook cut through frost.
- **Drop**: powers of ten, one level per gauge cue (one drawer, aisles, a hall, a city, a continent at 9,400 PB).
- **Verse 2**: the frame bolted together → four chip generations, Q-day "near" → passwords re-keyed → blueprint and birthday frozen in ice.
- **Prechorus 2**: the lattice → the crate stamped LATER.
- **Chorus 2**: the chandelier cooling → falling down the frosted silo → the drawers under the machine → the padlock cracks on "decrypt" → the stages dim.
- **Bridge**: the ticket pushed sixteen quarters → the comment "who'd even store it?" → "Petabytes, darling": the night side of the planet veined with gold.
- **Final chorus**: base temperature → every qubit flares → the key falls → sunrise down the aisle, padlocks open → the Tuesday letter opens → the golden city of open drawers → the sun breaks over the planet's limb and whites out.
- **Outro**: the green padlock, "Connection secure".

## 5. Don'ts (unchanged)

No hooded hacker, faces, skulls, "ACCESS GRANTED"; no Matrix rain; no globe with attack arcs or pinging dots (the
orbit shots are city lights at night, no arcs); no glowing-orb quantum computer; no falling snow; no real personal
data in the thaw (the letters are fiction, written for the video); green only for the padlock and the lattice.
