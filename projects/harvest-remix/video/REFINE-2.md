# REFINE-2.md — harvest-remix v22, refinement round 2 (the last; pipeline step C)

The second round brief. It comes from step A on draft 1 (`audit/draft-1/report.md`) and step B, the independent review
(`audit/draft-1/review.md`), checked by the lead on frames of `renders/video.mp4`. Read both, then this file, then
REFINE-1.md (its film-level rules and check section still hold), `V20-WORKER.md` (hard rules), `SYSTEM.md`,
`assets/kit/README.md` (the traps — the renderer one matters this round), then your frame(s). Round 1 is in: **keep what
works, fix what this brief names.** Every sung word stays on its `lyrics.json` start; spans are unchanged.

## Where draft 1 stands

Much closer to the references: hook 1, "now", dark, qubits and drop 1 are now at their level; unseen hits 85 → 53;
every word start the reviewer checked lands on time; the new object match cuts (vault → clock 33.81, lockup → chart
99.76, shards → "now" 145.27, letter → envelope → browser 160.06) are the best thing to keep. What is left, confirmed by
the lead on the draft's frames:

1. **The end card shows no NEAD.** In the render, N, E and A flash for a single frame each and D never shows; from 162.3
   to 164.4 the card reads only "HARVEST NOW, DECRYPT LATER". The stills (`./vid snap`) showed the letters — a render-only
   failure, almost certainly the renderer trap (a property set only in a `fromTo`'s `from`, or a `render()`/`tl.set`
   race). AGENTS.md requires the artist name on the end card.
2. **The final drop opens on a held picture:** a glowing "now" over a fading globe from 149.4 to 152.7 (breach's tail and
   library's first bar), so the 150.92 switch is invisible; the 158.23 roll is answered by a letter that sits still.
3. **Flat rings remain** (rule 9): 08-mine at 96.85–96.95, 97.50, 97.75 (plus burst lines behind the cream "now,");
   05-harvest at 59.1–59.3; an orange wash floods 13-reading's page at 143.45–143.58.
4. **Smaller:** ticket's bass return (114.35) drops to motion 4–6; keep's entrance is a tiny "i" over dim props
   (23.66–24.5); the seal's 0–2.4 s is nearly still for more than a bar; watch's eye wall is edge to edge (highlight 59).

Not taken this round: replacing the overlay's remaining light sweeps with object matches (seven cuts and their
neighbours — too wide for the last round; reported to the user).

## The work (one worker per row)

| worker | frame(s) | fix |
|---|---|---|
| A | 15-secure (160.058–164.400) | NEAD stamps on the card on 162.32, 162.80, 163.25, 163.71 (N, E, A, D) and **stays** to 164.4 — at the size the snap showed. Find why the render drops the letters (the kit README's renderer trap; check every `fromTo`, every `tl.set` vs `render()` switch) and **verify in a range proof's frames, not stills.** Keep the round-1 layout (upper-left card, right 40 % dark). |
| B | 22-breach (145.444–150.923), 23-library (150.923–160.058) | Make 149.4–160 the payoff. Breach: keep "now" on the record and pull back into the wall from 149.4 — no glowing "now" floating free over the globe. Library: start the drawer corridor on 150.92 with "now" slamming onto the first drawer as its stamp (no held globe bar); on the 158.23 roll slam the drawers shut toward the lens one per snare, then fold the letter into the envelope that lands on 15's first frame (`ENV` in 23 already matches 15). |
| C | 08-mine (85.147–99.756) | Remove the rings and burst lines (96.82–97.75): the rotor drums slam to a stop with sparks off the teeth and "harvest" printed off the drum; the 97.65 cream "now," is a paper strip fed out of the machine; start the rotors spinning on the 85.147 downbeat. `WOW.explode` draws rings when given `parent` — pass `fx: false`. Keep its last instant (09 continues it). |
| D | 10-ticket (105.243–117.940), 13-reading (134.514–143.604) | Ticket: at the 114.35 bass return let the chat thread take the full frame and whip through 2022–2025 while OPEN FOR races, landing on "who'd even store it?" — the scene's biggest move. Reading: drop the orange wash at 143.45–143.58; Archie stamps READ again on 141.96 (an object hit). Keep both frames' hand-overs. |
| E | 03-keep (23.656–33.806), 01-seal (0–7.96) | Keep: slide 16's frosted drawer 0001 into the vault wall on 23.66 and slam "break" into the empty top half (no tiny "i" over dim props); keep the round-1 vault → clock match at 33.81. Seal: a hot wax bead drops onto the card on the 2.269 kick, and the "decrypt later" scramble starts on bar 2 (1.83) — the title stays uncropped. |
| F | 05-harvest (48.491–61.346), 17-watch (41.720–45.487) | Harvest: replace the orange ring around the card at 59.1–59.3 with the wax glinting and the drawer lamps flaring. Watch: light only the irises next to the lyric band, the outer eyes dimmed to silhouettes (highlight comes from the lit irises, not from more of them). |

## Check (as REFINE-1, plus)

- **Verify render-only behaviour on a proof's frames**, not only on `./vid snap` stills: the end-card defect passed snap.
- Proof files are named by range; other workers may render the same one. Re-render before you audit if in doubt.
- Compare with `audit/draft-1/report.md` (same units). Signals, never targets.
- Write only your frame file(s). Never commit, never run `./vid assemble`, never edit the kit or overlays.
