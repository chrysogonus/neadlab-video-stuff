# REFINE-1.md — harvest-remix v22, refinement round 1 (pipeline step C)

The round brief for frame-workers (AGENTS.md stage 6, step C) on the delivered v21 master. It comes from step A
(`audit/v21/report.md`) and step B, the independent review (`audit/v21/review.md`), checked by the lead on frames of
`out/harvest-remix.mp4`. Read both, then this file, then `V20-WORKER.md` (its **v20 hard rules** and **Measure** apply
unchanged), `V17-WORKER.md` ("Verify like this"), `SYSTEM.md`, `assets/kit/README.md` (the traps), the headers of
`assets/kit/wow-kit.js` and `hr-kit.js`, `docs/visual-guidelines.md`, then your frame file(s). v21 is approved and
uploaded: **raise your scene, don't replace the film's look.** Every sung word stays on its `lyrics.json` start; spans
are unchanged. Load the /hyperframes-animation skill before writing motion.

## What the audit and the review found

v21 already moves more than both references (motion p50 1.90 against 0.37 / 1.17), and its object puns from 61 s to
143 s (stack, runway, sticky-note passwords, drawer cake, FIPS 203 folder, excuse roll, the 10 mK fridge, key, letter)
are at the references' level — keep them. The problem is the **pacing curve: the loudest music gets the stillest
pictures** — the bridge build (ticket, 105–118, the bass return at 114.35 unanswered) and the final drop's second half
(library, 151–160, drums 0.64). 85 of 312 strong hits change nothing visible; they matter where they cluster in loud 4/4
(drop 1 / harvest 15, qubits 18, library 7, ticket 6). Flat expanding rings — rule 9, a firm rule — recur (6.2, 33.6,
41.0, 45.3, 97.0, 152–157). "now" lands small in a corner on the 145.44 drop, then glows large over a held globe. The
opening title is cropped by the camera push from about 2.5 s. The end card holds 2.1 s, centred: no room for YouTube's
end screen.

## Film-level rules for this round

1. **Every kick in loud 4/4 is an object hit in the world** (a part drops, a lamp flares, a drawer slams, a row snaps),
   sized by `HR.band("drums")`; every phrase has one big move. Not a flat ring, flash or wash. The kit's kick pulse does
   not reach three.js frames (05, 22, 23): drive their hits from the timeline's `onUpdate` with `HR_ENV`'s onsets.
2. **Replace every flat ring in your frame** with the object's own reaction (sparks off the part, the word recoiling on
   its baseline, the shutter closing, the record stamped). Keep rings that are the object (a lamp's halo is fine).
3. **Key words are posters:** a hook word is full-frame and whole when it lands; a camera move never crops a word while
   it is the line being read.
4. **Cuts land on content**, and keep your frame's in/out switch kinds and first/last instants unless your row says so
   (neighbours cut against them). A whip `in` starts before 0 (`start: -0.1`).
5. The audit's numbers are signals, never targets (no shake, flashes or brightness to move them). Judge on full-rate
   frames.

## The work (one worker per row)

| worker | frame(s) | fix |
|---|---|---|
| A | 23-library (150.923–160.058) | The final drop must be the film's peak, not a held "now" over a dim globe. Go through the globe into the archive (rows of hairline drawers slamming open on the downbeats 152.75, 154.57, 156.40, records lifting out); the 158.23 roll closes them toward the lens, ending on the letter that hands over to 15 at 160.06. Every one of the 7 unseen hits answered. No flat rings. From ~159.4 the right ~40 % of the frame is calm (the end-screen window begins; see worker I). |
| B | 10-ticket (105.243–117.940) | The bridge builds: SEC-0001 jumps one quarter-cell per kick (110.69–113.43) with DEFERRED stamps, the camera trucks along the roadmap; the bass return at 114.35 is the big move (the chat scrolls through four years); the "me." dot hands over to petabytes at 117.94. Keep the cream register and the jokes. |
| C | 14-now (143.604–145.444), 22-breach (145.444–150.923) | One full-frame "now": on 145.27 the wax shards fly back together into it, and on 145.444 it slams onto the opened record as its READ stamp — no second small "now" in a corner. Breach's drop answers its kicks with the record and the archive, not rings. Hand over to 23 at 150.923 (worker A is rebuilding 23's opening — read its file at the end and match). |
| D | 06-qubits (61.346–75.987) | One object hit per kick (18 unseen): a chip plate drops onto the stack (62–65), runway lamps light in sequence (65.6–68.6), the password dots re-type (69–70.5); hold "birthday" (74.14) long enough to read. Keep every idea (it scored 5 on idea). |
| E | 01-seal (0–7.96), 18-hook (45.487–48.491) | 01: the title "harvest now, / decrypt later" stays whole through its first bar (the push crops it from ~2.5 s); the seal stamp at 6.12 hits with wax and the envelope, not a ring. 18: hook 1 full-frame (now ~55 % wide on a dim haze) with chorus 2's hook grammar (08-mine) so the two hooks escalate; no ring at 45.3. |
| F | 05-harvest (48.491–61.346) | Drop 1's 15 unseen kicks: a row of drawer lamps flares white-hot on each kick, the camera pushes on each downbeat; in the dark-wall shot (52.2–55.8) bring cream cards close to the lens. A three.js frame: drive hits from the timeline's `onUpdate` (rule 1); keep it lean. |
| G | 09-dark (99.756–105.243), 17-watch (41.720–45.487) | 09: no plain hard cut onto a still chart and no pan that crops the "x": "later" slides out of the lockup and becomes the z (Q-Day) marker; build x, + y, > z on the three downbeats. 17: defocus the outer eyes, "sooner or" straight on its own band, the shutter closes on "later" instead of the flat ring at 41.0. |
| H | 03-keep (23.656–33.806), 16-intercept (16.060–23.656) | 03: the vault hub ends at the clock dial's exact position and size so the last bolt (33.79) becomes 04's tick; bolt sparks instead of the ring at 33.6. 16: on "ice" (22.96) frost grows over drawer 0001 and "on ice" is set at hero size; clear the lyric's column. |
| I | 15-secure (160.058–164.400) | Room for YouTube's end screen (two video cards and a subscribe button, right ~40 %, from ~159.4 to the end): re-stage "secure." and the cream catalogue card with NEAD into the upper-left ~55–60 % of the frame, the right side calm and dark; keep the stamps (162.32, 162.80, 163.25) and the card's look. |

## Check

- `./vid snap harvest-remix <frame> --at …` on your frame alone (it runs `hyperframes check` first; fix every ✗), read
  the stills — every first frame, every hero word, every hit you changed.
- A range proof `./vid proof harvest-remix --from <s> --to <s>` including the previous scene's last 0.5 s, then
  `./vid audit harvest-remix --file <proof> --name r1-<frame>`; compare with `audit/v21/report.md` (same units). Pull
  your cut-in and your busiest bar at full rate:
  `ffmpeg -ss <video s> -i <proof> -t 0.5 -vf fps=30,scale=480:270,tile=5x3 -frames:v 1 <png>`.
- Proof files are named by range: other workers may render the same range. Re-render before you audit if in doubt.
  If a proof fails with "Runtime.evaluate timed out", retry once (the machine is shared).
- Write only your frame file(s). Never commit, never run `./vid assemble`, never edit the kit, overlays or other frames.

Final message: what changed, the snap times and check result, each scene's audit row v21 → r1, anything for the lead.
