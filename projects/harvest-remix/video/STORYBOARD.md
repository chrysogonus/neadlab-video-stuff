---
compositionId: bgm
duration_s: 164.4
canvas: {"w": 1920, "h": 1080, "fps": 60}
mode: autonomous
message: "Everything you encrypt today is already being stored, waiting for the day it can be read."
style:
  font: "Barlow / IBM Plex Mono / Instrument Serif Italic / Caveat Brush"
  palette: ["#111111", "#E85D26", "#F0ECE5", "#888880", "#505048", "#1A1A18"]
assets: false
build_notes: ["SYSTEM.md is the shared contract: read it first", "one paused timeline per frame", "no remote assets", "lyrics.json gives every sung word's track second", "software WebGL: keep the 3D frames lean"]
avoid: ["generic slideshow", "tiny unreadable lyrics", "karaoke strip at the bottom", "HUD readouts and countdowns", "a second accent color", "empty dead frames"]
---

# Harvest Now, Decrypt Later (Banger Remix) — storyboard

Track 164.4 s at a tracked ~131 BPM (a bar ≈ 1.83 s). The song breathes: quiet verses, choruses on the bar, two
drops, a stripped final chorus, a near-silent bar (143.60) before the last drop on "now" (145.444). The film is
a designed kinetic-type spine (SYSTEM.md: plaintext = the voice, ciphertext = the archive, one letter
followed throughout) with three cinematic three.js hits: drop 1, "petabytes", and "now".

Rhythm: hook-HOLD · intimate · tension-BOLTS · bar-moves · HIT · counting · ROLL · breath · subtraction ·
comic · HIT · stillness · the reading · hush-HIT · coda.

Lines are named by their `lyrics.json` index (`L0` … `L30`); every word appears at its own `start`.

## V12 revision — 2026-10-17

All scene spans and sung-word times are unchanged. The changes from v11:

- **03:** from "keep" it becomes the vault: steel "keep", the HELD tag, four macro bolt cuts and the round door, with a
  match cut to 04's clock.
- **04, 12, 13, 15, 16:** Archie replaces the Archivist.
- **06:** g1 opens tight on the stack; g4 becomes the blueprint, birthday and drawer-0001 TRUE shots.
- **08:** the chorus becomes the cipher-bank rotor drums, and the hook becomes four full-bleed shots.
- **Finish layer:** light sweeps and edge punches.

11-petabytes remains locked. See V12.md and SYSTEM.md V6.

## V11 approved revision — resumed 2026-10-17

The user approved renders/proof-v11.mp4 (10-ticket and 15-secure). V11.md and SYSTEM.md V5 define the 18 editable scenes: cream UI, Instrument Serif voice, sparse Caveat marker, Archivist and mail-client bookend. All 21 scene spans and exact sung-word times stay unchanged. 06-qubits, 08-mine and 11-petabytes remain locked to renders/sources-v10-locked.sha256; 18-hook and 14-now retain v10.

BYTES HELD continuity: 04 grows to256; 05 carries256→1000; locked08 starts1000 and reaches about3.98billion; 12 continues from4294967296 to4398046511104; 22 peaks at8796093022208. Quantities are fictional archive storytelling, not technical capacity claims.

## V10 revision — 2026-10-16

21 scenes. v8's 06-qubits and 08-mine are restored byte-identical at their v8 spans (19-permanent and
20-iris leave the timeline; their sources are in backups/v9-sources/). 06, 08 and 11 are locked. Every other
scene is refined to the SYSTEM.md v4 detail bar.

## V9 approved revision — 2026-10-16

23 authored scenes. Eight additional files implement distinct subjects/viewpoints, not a claim of 53% more shots. Original33 groups and seven first-drop shots are the baseline; see V9.md for visual inventory. Preserve exact master, lyric times and petabytes source.

## Frame 1 — seal

- src: compositions/frames/01-seal.html
- duration: 7.96s
- span_sec: [0, 7.96]
- pacing: beat_cut
- mood: [cinematic, tense]
- feel: held pad with no drums, then the first kick at 6.12 and a kick/snare fill into the downbeat

### Groups

- **g1** — free_design
  - span_sec: [0.0, 6.117]
  - free_design: { dominant_system: "title poster that is already a thumbnail at t=0", primitives: ["negative-space-hold", "binary-decrypt"], density_topology: "hold" }
  - anchors: [0.498, 2.269, 4.253]
  - concept: The thumbnail is on screen in the very first frame (no fade from black). Dark register. Left, the
    title as one massive lowercase statement: "harvest now," in cream display and "decrypt later" below it in
    fire-orange — but "decrypt later" is still ciphertext: mono hex glyphs at display width that scramble and
    never quite settle. Right, the letter object (OBJ 0001): a flat cream card, its body lines ciphertext, no
    seal yet. Ghost ciphertext wall behind at 5%. Chrome: `NEAD` mono kicker top-left, `OBJ 0001` by the card.
    The pad swells: the whole frame BREATHES a slow push-in (1 → 1.04) and the cream brightens with it; the
    soft kick at 2.269 nudges the card 4 px.
  - copy: ["harvest now,", "decrypt later", "NEAD"]
- **g2** — free_design
  - span_sec: [6.117, 7.96]
  - free_design: { dominant_system: "the stamp", primitives: ["braam-punch", "palette-flip", "radial-burst-lines"], density_topology: "impact then decay" }
  - anchors: [6.117, 6.439, 6.737, 7.044, 7.96]
  - concept: On the first kick (6.117) the fire-orange SEAL STAMPS onto the card — 0 ms in, a scale punch
    1.3 → 1 landing on the kick, hairline burst lines around it. Kicks 6.439 / 6.737 / 7.044 each ring the
    seal once (a thin ring expands). The fill (7.044–7.92) is an accumulation: the card's ciphertext scrambles
    faster and faster, and on the downbeat 7.96 the next frame cuts in.

### V9 direction

Preserve approved v8 reference grammar; make title fully readable at t=0, put instability into archive texture. Stronger seal depth and paper edge light.

## Frame 2 — sent

- src: compositions/frames/02-sent.html
- duration: 8.1s
- span_sec: [7.96, 16.06]
- pacing: beat_cut
- mood: [cinematic, tense]
- feel: sparse drums under an intimate vocal; four lines, the voice leads

### Groups

- **g1** — free_design
  - span_sec: [7.96, 12.357]
  - free_design: { dominant_system: "lyric statement over the travelling letter", primitives: ["staggered-reveal", "hard-cut"], density_topology: "one line, one object" }
  - anchors: [8.351, 9.74, 11.005]
  - concept: L0 "you sent it on a tuesday, twenty twenty-one". The sealed card from frame 1 now travels: it
    GLIDES left → right along one hairline (the wire) across the lower third. Words land on their times;
    hero "tuesday," in fire-orange. On "twenty-one" (11.005) a mono postmark STAMPS on the card:
    `TUE · 2021`.
  - copy: L0, hero "tuesday,"
- **g2** — free_design
  - span_sec: [12.357, 16.06]
  - free_design: { dominant_system: "the padlock clicks, the letter becomes ciphertext", primitives: ["outline-to-fill", "binary-decrypt"], density_topology: "one line, one object" }
  - anchors: [13.22, 15.1]
  - concept: L1 "a little green padlock said the hard part was done". A flat padlock (cream outline body, the
    shackle open) is drawn beside the card on "padlock" (13.22). On "done" (15.1) the shackle SNAPS shut
    (0 ms) and the body FILLS fire-orange; the card's last plain lines scramble into hex. Hero "padlock".
  - copy: L1, hero "padlock"

### V9 direction

Only L0/L1 in this shortened scene. Improve the wire route with linked relay gates and visible depth; padlock remains graphic and tactile. Remove obsolete L2/L3 group code.

## Frame 3 — intercept

- src: compositions/frames/16-intercept.html
- duration: 7.596s
- span_sec: [16.06, 23.656]
- pacing: beat_cut
- mood: [cinematic, tense]
- feel: v9 distinct visual setup at aligned phrase boundary, continuous music

### Groups

- **g1** — free_design
  - span_sec: [16.06, 23.656]
  - free_design: { dominant_system: "intercept — v9", primitives: ["multi-phase-camera", "svg-path-draw", "kinetic-beat-slam"], density_topology: "one focal subject, structured depth" }
  - anchors: [16.06, 17.16, 19.74, 20.74, 22.96]
  - concept: Collector-side cross section: split a travelling ciphertext signal into the apparently successful delivery and a concealed interception channel. Macro hex layers, travelling pulses, mechanical copy gate and a deep intake slot. L2 and L3, every word at lyrics.json time. Distinct from v8's small letter sliding over the same wall.

## Frame 4 — keep

- src: compositions/frames/03-keep.html
- duration: 10.15s
- span_sec: [23.656, 33.806]
- pacing: beat_cut
- mood: [dark, tense]
- feel: the bass enters at 24.584 under two short lines; a seven-snare fill 31.943–33.787 into the chorus

### Groups

- **g1** — free_design
  - span_sec: [23.656, 31.943]
  - free_design: { dominant_system: "compare panels: break vs keep", primitives: ["palette-flip", "hard-cut"], density_topology: "two statements, one payoff" }
  - anchors: [24.54, 24.584, 25.58, 28.091, 29.24, 30.12]
  - concept: Broadside compare treatment. Left panel (dark): L4 "i don't have to break you" — hero "break";
    on "you" (25.58) a fire-orange rule SLASHES through "break". The bass entry (24.584) SETTLES the whole
    layout 6 px down, once. Right panel: L5 "i only have to keep you" — on "keep" (28.091) the right panel
    FLIPS to the orange register (0 ms) and "keep" lands in ink display; a small drawer front `0001` sits in it
    with a mono `HELD` tag. Ghost drawer grid behind both panels.
  - copy: L4 hero "break"; L5 hero "keep"
- **g2** — free_design
  - span_sec: [31.943, 33.806]
  - free_design: { dominant_system: "seven bolts", primitives: ["directional-fill", "screen-shake"], density_topology: "accumulate one per hit" }
  - anchors: [31.943, 32.406, 32.865, 33.097, 33.326, 33.556, 33.787]
  - concept: Drawer 0001 locks: each snare SLAMS one horizontal ink bolt across the orange panel (0 ms, a
    2 px settle), seven bolts barring the frame by 33.787. No shake beyond the settle.

### V9 direction

Preserve split comparison and shards. Add mechanical frame/beveled enclosure and dramatic slat geometry instead of another generic wall.

## Frame 5 — wait

- src: compositions/frames/04-wait.html
- duration: 7.914s
- span_sec: [33.806, 41.72]
- pacing: beat_cut
- mood: [hype, dark]
- feel: full band chorus, steady bars, a dip at 46.66 before the hook lands into the drop

### Groups

- **g1** — free_design
  - span_sec: [33.806, 38.642]
  - free_design: { dominant_system: "the archive counts time", primitives: ["counting-punch", "kinetic-letter-in"], density_topology: "one move per bar" }
  - anchors: [33.806, 35.631, 37.1, 37.47]
  - concept: L6 "i'll wait for you, i've got the time". Dark. A wide hairline drawer wall fills the ground;
    one move per bar (a lateral drift that changes direction on 35.631). A mono counter `DAYS HELD`
    ticks up once per beat in the top chrome. Hero "time" lands huge (display) on 37.1.
  - copy: L6 hero "time"
- **g2** — free_design
  - span_sec: [38.642, 41.72]
  - free_design: { dominant_system: "the archive floods", primitives: ["staggered-reveal", "word-grid-burst"], density_topology: "accumulate per beat" }
  - anchors: [38.642, 39.308, 40.942]
  - concept: L7 "every byte you ever sent is mine". Ciphertext rows POUR in from the right one per beat,
    filling the drawer wall; on "mine" (40.942) everything but the lyric drops to 30% and "mine" lands in
    fire-orange display.
  - copy: L7 hero "mine"

### V9 direction

Only L6/L7. Stronger physical archive ribs and moving intake topology; monumental clock-hand sweep behind time. Remove obsolete later and hook groups; those have new frames.

## Frame 6 — watch

- src: compositions/frames/17-watch.html
- duration: 3.767s
- span_sec: [41.72, 45.487]
- pacing: beat_cut
- mood: [cinematic, tense]
- feel: v9 distinct visual setup at aligned phrase boundary, continuous music

### Groups

- **g1** — free_design
  - span_sec: [41.72, 45.487]
  - free_design: { dominant_system: "watch — v9", primitives: ["multi-phase-camera", "svg-path-draw", "kinetic-beat-slam"], density_topology: "one focal subject, structured depth" }
  - anchors: [41.72, 42.818, 44.165, 44.58]
  - concept: First watching aperture: giant cropped mechanical shutter formed from archive slats. It opens on sooner, then closes around the original seal on later. Keep L8 poster readable in its own plane. Distinct subject and viewpoint from drawer wall.

## Frame 7 — hook

- src: compositions/frames/18-hook.html
- duration: 3.004s
- span_sec: [45.487, 48.491]
- pacing: beat_cut
- mood: [cinematic, tense]
- feel: v9 distinct visual setup at aligned phrase boundary, continuous music

### Groups

- **g1** — free_design
  - span_sec: [45.487, 48.491]
  - free_design: { dominant_system: "hook — v9", primitives: ["multi-phase-camera", "svg-path-draw", "kinetic-beat-slam"], density_topology: "one focal subject, structured depth" }
  - anchors: [45.487, 46.375, 47.56, 48.011]
  - concept: Full-frame hook press: HARVEST NOW / DECRYPT LATER as monumental alternating ink and orange type planes. A row of physical archive shutters retracts behind the title to open the path into the corridor. Exact L9 word starts, no extra lyric words.

## Frame 8 — harvest

- src: compositions/frames/05-harvest.html
- duration: 12.855s
- span_sec: [48.491, 61.346]
- pacing: beat_cut
- mood: [hype, cinematic]
- feel: the first drop, loudest instrumental so far; vocal chops 53.71–61.41; seven bars

### Groups

- **g1** — free_design
  - span_sec: [48.491, 61.346]
  - free_design: { dominant_system: "three.js: the harvest machine, one shot per bar", primitives: ["system-replace", "hard-cut", "held-text-strobe-burst"], density_topology: "one camera per bar" }
  - anchors: [48.491, 50.338, 52.181, 54.016, 55.847, 57.684, 59.512]
  - concept: CINEMATIC HIT 1. The archive as a machine of light. An instanced 3D archive: long corridors of
    drawer blocks (ink faces, cream hairline edges, a small fire-orange lamp per drawer), fog to ink; streams
    of flat cream cards (each with an orange seal dot) flow along lines of light into it. Seven shots, a 0 ms
    camera cut on every downbeat: (1) 48.491 rushing down a corridor; (2) looking straight down a circular
    shaft as cards spiral in; (3) tracking along a wall of drawers, lamps igniting one per beat; (4) wide:
    the archive as a city grid under fog; (5) macro: one card slides into slot `0001`; (6) the corridor again,
    faster; (7) rising out of the shaft as the vortex closes. Over the vocal chops (53.71–61.41) the word
    "harvest" strobes in fire-orange display in short bursts (≤ 2 s each, on the chop onsets), the only type.
  - copy: ["harvest"]

### V9 direction

Preserve all seven shots and music anchors. Refine major silhouettes, architectural ribs, intake rails, tower roof details and consistent light hierarchy. No extra tiny unreadable labels.

## Frame 9 — qubits

- src: compositions/frames/06-qubits.html
- duration: 14.641s
- span_sec: [61.346, 75.987]
- pacing: beat_cut
- mood: [dark, tense]
- feel: steady four-on-the-floor verse; four lines

### Groups

- **g1** — free_design
  - span_sec: [61.346, 65.616]
  - free_design: { dominant_system: "the beat as counting", primitives: ["staggered-reveal", "counting-punch"], density_topology: "accumulate one per beat" }
  - anchors: [62.02, 63.1, 63.168, 64.997, 65.0]
  - concept: L10 "they're stacking up the qubits, a few more every year". A flat stack of chips (hairline
    rectangles, each with a tiny fire-orange core) GROWS one layer per beat; mono year tags step `2021 2022
    2023 2024 2025` up its side. Hero "qubits".
  - copy: L10 hero "qubits"
- **g2** — free_design
  - span_sec: [65.616, 69.04]
  - free_design: { dominant_system: "the decade line", primitives: ["directional-fill", "hard-cut"], density_topology: "one long move" }
  - anchors: [66.8, 67.26, 68.619]
  - concept: L11 "the experts said a decade, now the decade's nearly here". One hairline spans the frame as
    ten year ticks; a fire-orange fill DRAWS along it from "decade," (66.8) and arrives at the ninth tick on
    "here" (68.619). Hero "nearly here".
  - copy: L11 hero "here"
- **g3** — free_design
  - span_sec: [69.04, 73.0]
  - free_design: { dominant_system: "the passwords change, the copy doesn't", primitives: ["content-swap", "typewriter-reveal"], density_topology: "swap per beat" }
  - anchors: [70.489, 70.505, 71.18, 72.318]
  - concept: L12 "you changed all of your passwords, you think that sees you through". Left: three password
    fields whose masked dots RE-TYPE on every beat (new lengths). Right: drawer `0001`, untouched, its
    ciphertext label still. Hero "passwords".
  - copy: L12 hero "passwords"
- **g4** — free_design
  - span_sec: [73.0, 75.987]
  - free_design: { dominant_system: "things that stay true", primitives: ["overlay-pop", "hard-cut"], density_topology: "two tags, one stamp" }
  - anchors: [73.22, 74.14, 75.02, 75.96]
  - concept: L13 "but a blueprint or a birthday stays as true as true". Two drawer tags pop in on their words
    (`BLUEPRINT`, `BIRTHDAY`, mono); on the first "true" (75.02) a fire-orange `TRUE` stamp lands across both.
  - copy: L13 hero "true"

Restored byte-identical from v8 (v10, user request). Locked: do not edit.

## Frame 10 — later

- src: compositions/frames/07-later.html
- duration: 9.16s
- span_sec: [75.987, 85.147]
- pacing: beat_cut
- mood: [tense, playful]
- feel: bass drops out; a kick roll accelerates 81.463–85.142 into the chorus

### Groups

- **g1** — free_design
  - span_sec: [75.987, 81.463]
  - free_design: { dominant_system: "the new math, postponed", primitives: ["mosaic-pack", "hard-cut"], density_topology: "assemble then shelve" }
  - anchors: [76.46, 77.7, 78.72, 79.84, 80.92]
  - concept: L14 "they handed you the new math". A lattice of dots (the post-quantum lattice, as pure
    geometry) PACKS into a tidy grid, locking on "math" (78.72). L15 "you said you'd get around to that": the
    lattice is filed into a small card marked `LATER`, pushed aside. Hero "new math", then "around".
  - copy: L14 hero "math"; L15 hero "around"
- **g2** — template: `roll-flipbook-word-cycle`
  - span_sec: [81.463, 85.147]
  - params: { bgColor: "#E85D26", textColor: "#111111", accentColor: "#F0ECE5", flipWords: ["later", "next sprint", "q3", "next year", "after launch", "monday", "later"], resolveText: "later", periodChar: "." }
  - role_bindings: { roll: { start: 81.463, end: 85.142 }, resolve: 85.142 }
  - concept: The kick roll is the excuse machine: one excuse per kick, accelerating with the kicks, in ink on
    orange, resolving to "later." on 85.142. The last sung word "that" (81.46) is the hand-off.

### V9 direction

One striking deep geometric construction locks on math78.72, compresses into postponed document on79.84, excuse roll starts81.46. Strong depth and significant node connections, not extra HUD or mathematical claims.

## Frame 11 — mine

- src: compositions/frames/08-mine.html
- duration: 14.609s
- span_sec: [85.147, 99.756]
- pacing: beat_cut
- mood: [hype, cinematic]
- feel: second chorus, heavier bass; the hook again at 96.82

### Groups

- **g1** — free_design
  - span_sec: [85.147, 96.82]
  - free_design: { dominant_system: "the machine breathes with the bass", primitives: ["palette-flip", "kinetic-letter-in", "hard-cut"], density_topology: "one move per bar" }
  - anchors: [85.147, 86.966, 88.52, 88.792, 90.626, 92.22, 92.461, 94.278, 95.84]
  - concept: The machine is real now. Orange register throughout this chorus (the inverse of chorus 1). A
    giant ink circle — the machine's core, concentric hairline plates — sits right of frame and SWELLS on
    each bass downbeat. Lines L16 "i'll wait for you, i've got the time" (hero "time"), L17 "every byte you
    ever sent is mine" (hero "mine"), L18 "i'll see you sooner or later" (hero "later") in ink, one layout per
    line, a 0 ms cut on each line's first word.
  - copy: L16 hero "time"; L17 hero "mine"; L18 hero "later"
- **g2** — free_design
  - span_sec: [96.82, 99.756]
  - free_design: { dominant_system: "the hook on dark", primitives: ["palette-flip", "binary-decrypt", "braam-punch"], density_topology: "declaration" }
  - anchors: [96.82, 97.653, 98.8, 99.28]
  - concept: L19 "harvest now, decrypt later": the chorus-1 hook lockup inverted — 0 ms flip to dark,
    "harvest" in fire-orange display; "decrypt" resolves from hex on 98.8.
  - copy: L19 hero "harvest"

Restored byte-identical from v8 (v10, user request). Locked: do not edit.

## Frame 12 — dark

- src: compositions/frames/09-dark.html
- duration: 5.487s
- span_sec: [99.756, 105.243]
- pacing: phrase_flow
- mood: [dark, dreamy]
- feel: eerie synth interlude, almost no drums, three downbeats

### Groups

- **g1** — free_design
  - span_sec: [99.756, 105.243]
  - free_design: { dominant_system: "lights out", primitives: ["negative-space-hold", "neon-flicker"], density_topology: "subtract per downbeat" }
  - anchors: [99.756, 101.588, 103.405]
  - concept: Night in the archive. A wall of hundreds of tiny fire-orange drawer lamps on ink; on each
    downbeat a third of them GO OUT (0 ms, in a seeded scatter) until only lamp `0001` remains, breathing.
    No lyric. A small mono `00:00` chrome in a corner — the only text.

### V9 direction

Keep musical breathing room. Give lamp extinction a directional shadow sweep across substantial archive pillars; one lamp remains focus. No empty black hold.

## Frame 13 — ticket

- src: compositions/frames/10-ticket.html
- duration: 12.697s
- span_sec: [105.243, 117.94]
- pacing: beat_cut
- mood: [playful, tense]
- feel: the bridge builds on a steady kick; the bass returns at 114.35

### Groups

- **g1** — free_design
  - span_sec: [105.243, 110.66]
  - free_design: { dominant_system: "the ticket", primitives: ["overlay-pop", "hard-cut"], density_topology: "one object, one stamp" }
  - anchors: [107.0, 107.765, 108.6, 109.54]
  - concept: The defenders' day, flat office daylight (dark register, cream ticket). L20 "ticket opened,
    priority low": a flat ticket card `SEC-0001 · migrate to post-quantum crypto` SLIDES in on "ticket"
    (107.0); on "low" (109.54) a mono `PRIORITY: LOW` tag STAMPS on it. Hero "low".
  - copy: L20 hero "low"
- **g2** — free_design
  - span_sec: [110.66, 114.2]
  - free_design: { dominant_system: "pushed across the quarters", primitives: ["content-swap", "staggered-reveal"], density_topology: "one push per beat" }
  - anchors: [110.694, 111.143, 111.608, 112.071, 112.522, 112.975, 113.22, 113.43]
  - concept: L21 "pushed to next quarter, four years in a row". A calendar strip of sixteen quarter cells
    (`Q1 … Q4` × four years); the ticket JUMPS one cell per kick, each cell it leaves stamped `DEFERRED`.
    On "row" (113.22) it lands in the last cell. Hero "four years".
  - copy: L21 hero "row"
- **g3** — free_design
  - span_sec: [114.2, 117.94]
  - free_design: { dominant_system: "pull quote", primitives: ["negative-space-hold", "kinetic-letter-in"], density_topology: "one quote held" }
  - anchors: [114.2, 114.351, 116.12, 117.76]
  - concept: L22 somebody asked, "who'd even store it?" — the broadside pull-quote treatment: an oversized
    fire-orange quote mark, the question in display, held still; "somebody asked," small above it. The
    question is the set-up for the cut to "petabytes".
  - copy: L22 hero "store it?"

### V9 direction

More substantial physical ticket press and split-flap calendar, textured stamped edges, foreground stack of deferred tickets; question staged as monumental pull quote with strong framing beforepetabytes.

## Frame 14 — petabytes

- src: compositions/frames/11-petabytes.html
- duration: 5.539s
- span_sec: [117.94, 123.479]
- pacing: beat_cut
- mood: [hype, cinematic]
- feel: the loudest bar of the song, then a snare roll 121.638–123.449 into the stripped final chorus

### Groups

- **g1** — free_design
  - span_sec: [117.94, 123.479]
  - free_design: { dominant_system: "three.js: one lamp to a planet of lamps", primitives: ["system-replace", "dolly-zoom", "crash-zoom-in"], density_topology: "reveal then rush" }
  - anchors: [117.94, 118.88, 119.8, 120.5, 121.638, 123.449]
  - concept: CINEMATIC HIT 2, the answer to "who'd even store it?". Cut on "petabytes" (117.94) to one
    fire-orange lamp (drawer 0001) in black; the camera PULLS BACK at speed and the lamp becomes one of
    hundreds of thousands — a sphere-sized archive of lamps in shells and rings, gold-orange on ink. Type
    over it (DOM): "petabytes," SLAMS in cream display on 117.94, "darling." on 118.88,
    "i adore it." on 119.8–120.5. On the snare roll (121.638) the camera RUSHES back in, accelerating with the
    roll, arriving at lamp 0001 on 123.449.
  - copy: L23 hero "petabytes,"

### V9 direction

LOCKED: preserve source bytes and timings exactly.

## Frame 15 — key

- src: compositions/frames/12-key.html
- duration: 7.543s
- span_sec: [123.479, 131.022]
- pacing: phrase_flow
- mood: [cinematic, dark]
- feel: stripped chorus, isolated hits (125.07, 127.093, 128.911, 132.098); stillness

### Groups

- **g1** — free_design
  - span_sec: [123.479, 128.253]
  - free_design: { dominant_system: "the chorus remembered, past tense", primitives: ["content-swap", "negative-space-hold"], density_topology: "one hold" }
  - anchors: [123.928, 124.34, 126.84, 127.093]
  - concept: L24 "i waited for you, i had the time" — the chorus line in the past tense. It is set like
    chorus 1's L6, but "waited" and "had" land in fire-orange as the tense changes. Slow, still, the drawer
    wall barely drifting. Hero "waited".
  - copy: L24 hero "waited"
- **g2** — free_design
  - span_sec: [128.253, 131.022]
  - free_design: { dominant_system: "drawer 0001 opens", primitives: ["mask-reveal"], density_topology: "one slow move" }
  - anchors: [128.911, 130.7]
  - concept: L25 "every byte you ever sent is mine": the hit at 128.911 starts drawer `0001` SLIDING open in
    slow motion; inside, the sealed card. Hero "mine" on 130.7.
  - copy: L25 hero "mine"

### V9 direction

Only L24/L25: move from archive isolation to one drawer revealing originalletter. Strong shadow silhouette and readable widening light slit. Fridge is new21.

## Frame 16 — fridge

- src: compositions/frames/21-fridge.html
- duration: 3.492s
- span_sec: [131.022, 134.514]
- pacing: phrase_flow
- mood: [cinematic, tense]
- feel: v9 distinct visual setup at aligned phrase boundary, continuous music

### Groups

- **g1** — free_design
  - span_sec: [131.022, 134.514]
  - free_design: { dominant_system: "fridge — v9", primitives: ["multi-phase-camera", "svg-path-draw", "kinetic-beat-slam"], density_topology: "one focal subject, structured depth" }
  - anchors: [131.022, 131.122, 131.86, 132.94, 133.2, 134.04]
  - concept: Full refined quantum fridge silhouette as an oblique graphic cutaway, not four front-facing discs: angled cooling plates, paired suspension columns, dense routed cable bundles, connectors and a processor at bottom. Restrained cream rims and fire signal. Machine already present at scene start; key appears 132.94, falls 133.2, lands 134.04. Exact L26.

## Frame 17 — reading

- src: compositions/frames/13-reading.html
- duration: 9.09s
- span_sec: [134.514, 143.604]
- pacing: phrase_flow
- mood: [cinematic, warm]
- feel: stripped, one isolated hit at 136.19; the vocal carries; near silence arrives at 143.60

### Groups

- **g1** — free_design
  - span_sec: [134.514, 143.604]
  - free_design: { dominant_system: "the reading", primitives: ["binary-decrypt", "negative-space-hold"], density_topology: "decrypt then hold" }
  - anchors: [134.514, 136.19, 136.72, 137.54, 138.78, 140.675, 141.96]
  - concept: The collector reads your letter. The key meets the seal; on the hit 136.19 the fire-orange seal
    SPLITS in two (0 ms, halves slide 20 px apart). The card fills the frame and its ciphertext DECRYPTS line
    by line (binary-decrypt, top to bottom, 136.19–137.5) into the letter's plain text, in Barlow 400:
    "my love, / i am writing this the old way, because some things should be sealed by hand. the little
    green padlock says / no one else will ever read it. / and tonight i choose to believe it. … / always
    yours, a." The sentence "no one else will ever read it." is the display moment: cream h2, held still
    from 137.5 to the end of the frame while the rest dims to 40%. The sung lines sit small (h3, lower left):
    L27 "so that's what you were on about", L28 "i said sooner or later", L29a "harvested then," (140.675,
    141.96).
  - copy: L27, L28, L29 words "harvested then,"; letter text as written

### V9 direction

Preserve intimate letter and sentence. Refine seal split and torn paper edges, improve contrast and sharply focused body; change start to134.514 without shifting any word timestamp.

## Frame 18 — now

- src: compositions/frames/14-now.html
- duration: 1.84s
- span_sec: [143.604, 145.444]
- pacing: beat_cut
- mood: [hype, cinematic, warm]
- feel: near silence 143.60–145.44 with "decrypted" sung alone, then the final drop on "now" at 145.444

### Groups

- **g1** — free_design
  - span_sec: [143.604, 145.444]
  - free_design: { dominant_system: "the hush", primitives: ["freeze-hold", "negative-space-hold"], density_topology: "empty then one word" }
  - anchors: [143.604, 144.26, 145.27]
  - concept: Near silence. Ink frame, one hairline of fire-orange light across the middle, slowly widening.
    "decrypted" appears alone on 144.26 (cream h1, left). "now" lands on its sung time 145.27, small.
  - copy: L29 words "decrypted", "now"

### V9 direction

HUSH ONLY. Slim light opening and huge quiet decrypted/now, words at144.26/145.27. End ondrop145.444; no three.js swarm. New22/23 ownfinale.

## Frame 19 — breach

- src: compositions/frames/22-breach.html
- duration: 5.479s
- span_sec: [145.444, 150.923]
- pacing: beat_cut
- mood: [cinematic, tense]
- feel: v9 distinct visual setup at aligned phrase boundary, continuous music

### Groups

- **g1** — free_design
  - span_sec: [145.444, 150.923]
  - free_design: { dominant_system: "breach — v9", primitives: ["multi-phase-camera", "svg-path-draw", "kinetic-beat-slam"], density_topology: "one focal subject, structured depth" }
  - anchors: [145.444, 147.279, 149.101]
  - concept: Final cinematic hit, phase 1. Ordered wall of sealed records; a visible decryption front opens records in coherent columns around giant NOW, word already began in preceding hush at 145.27. On drop145.444 impact then controlled oblique reveal. No random page swarm or tumbling confetti. Palette fire/ink/cream. Lean instanced geometry; three.js budget shared with 23-library as one final sequence.

## Frame 20 — library

- src: compositions/frames/23-library.html
- duration: 9.135s
- span_sec: [150.923, 160.058]
- pacing: beat_cut
- mood: [cinematic, tense]
- feel: v9 distinct visual setup at aligned phrase boundary, continuous music

### Groups

- **g1** — free_design
  - span_sec: [150.923, 160.058]
  - free_design: { dominant_system: "library — v9", primitives: ["multi-phase-camera", "svg-path-draw", "kinetic-beat-slam"], density_topology: "one focal subject, structured depth" }
  - anchors: [150.923, 152.746, 154.574, 156.4, 158.227, 160.058]
  - concept: Final cinematic hit, phase2/aftermath: a monumental orderly library of opened records in deep converging rows, camera moves on 150.923/154.574, readable NOW through held vocal to153.636. Return to original OBJ0001 letter in foreground at156.4, darkness closes during158.227 roll without cutting the roll. Strong silhouettes, structured geometry, no scattered paper. Preserve one original letter identity; no new lyric claims.

## Frame 21 — secure

- src: compositions/frames/15-secure.html
- duration: 4.342s
- span_sec: [160.058, 164.4]
- pacing: phrase_flow
- mood: [dark, elegant]
- feel: the voice alone, small hits at 162.32, silence from 163.708

### Groups

- **g1** — free_design
  - span_sec: [160.058, 164.4]
  - free_design: { dominant_system: "the loop closes", primitives: ["negative-space-hold", "staggered-exit"], density_topology: "one line, one hit, end card" }
  - anchors: [160.76, 161.563, 162.321, 163.708]
  - concept: Dark again. A new sealed card sits where the first one did, the small padlock beside it shut and
    fire-orange. L30 "connection secure." lands on its words (cream h1). On the hit 162.321 a pale copy
    quietly PEELS off the new card and slides into the dark — it starts again. End card on 163.708: `NEAD` and
    "harvest now, decrypt later" in mono chrome, held to the end.
  - copy: L30 hero "secure."; end card "NEAD", "harvest now, decrypt later"

### V9 direction

Refined lock construction and letter; quietly visible second copy into concealment; crisp NEAD endcard. Preserve exact lyric and final164.4.


## v15 approved refinement notes — 2026-10-18

V15.md records the approved scope. Scene spans and all lyric anchors remain unchanged.
03/04/17 vault, clock and iris re-centred; 08 Enigma re-centred with contact-bound branching arcs, seam light and lock scan; 11 petabytes framing adjusted under explicit user override of old byte lock. 16 copy now has a connected cable cutaway, one printer (Archie) and a scan attached to the printed copy. 05 follows the same orange-sealed envelope through its final shot. 22/23 share archive-threat.js: time-continuous scanning, orange exposure, cyan/violet electrical fronts and outgoing record points. 15 uses smaller finger motions, one slow glance and restrained SEND; ticket toast clears the letter and protocol strip. v14 sources preserved in backups/v14-sources/.
