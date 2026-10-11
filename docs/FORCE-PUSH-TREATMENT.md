# Force Push — treatment & style bible

Song: "Force Push" (NEAD), 3:29.64, ~130.5 BPM with a drifting tempo (tracked grid). Timing data:
`data/force-push/` (see the cue sheet, [`FORCE-PUSH-CUES.md`](FORCE-PUSH-CUES.md), for every phrase).

## The idea

A breakup told entirely in Git. The singer has spent three years in a repository called `us` with
someone who "never could commit", and ends it the way you end a bad history: by rewriting it and
force-pushing over the remote. The video is that repository, seen through the tools you would use on
it — a terminal, a commit graph, a blame view, a rebase todo list, a `.gitignore`, a reflog — with the
lyric set large over every one of them. Each phrase does one thing to the repo, and you can see what
it did.

**Central argument.** Rewriting the shared history *is* the breakup. The song is gleeful about it,
and the video lets it be — but it keeps Git honest, and that honesty is the ending: a force push
does not erase anything. It moves a ref. The old commits are still there, unreachable, in the
ex's local clone and in the reflog. The song knows this ("Keep your local copy", "the ref-log…
forgets you in thirty days. I can wait."), so the last thing that happens is the only real
deletion: thirty days pass and `git gc` prunes them.

**Opening promise.** A dark terminal, a huge blinking cursor on the filtered beat, then
`git status` — `nothing to commit`. "Story of your life." The repo is named, the branch is named,
and one status line is planted: `nothing to commit, working tree clean`, of which only the
first half is sung and lit.

**Recurring motif.** The commit graph and its pointers. The singer's commits are filled
off-white discs; the ex's are hollow rings. `main`, `origin/main` and `HEAD` are pills; the
green one is always the singer's current truth. Every chorus returns to the same graph and moves
`origin/main` — and every time the state is different (one force push, then two, then three; the
ghost lanes of unreachable history pile up; the ex's local copy goes from intact to rejected).

**Escalation.** Verse 1 builds the evidence (stash, the hidden branch, the blame). The pre-chorus
strips it down to big type and one command. Chorus 1 is the first push. Verse 2 is the cleanup,
in paper mode (squash, cherry-pick, ignore). Chorus 2 pushes over the ex's revert. The bridge is
the etiquette page that says never do this; it is ignored. The a cappella is the push itself,
quiet. The drop is everything at once, inverted.

**Climax.** The drop and the last post-chorus: paper mode, the graph at full size with three
ghost lanes, the crowd counter at a million, `git log --author=you` returning nothing.

**Closing callback.** The outro returns to the opening terminal, same framing. `git reflog` still
lists the ex's states — Git remembers. "It forgets you in thirty days." "I can wait." The hard hit
starts the thirty days going by; `git gc` removes the unreachable objects one per beat of the
"dun-dun" tag; when the drums drop out, `git status` prints the planted line again — and this time
the lit half is `working tree clean`.

## Tone

- Gleeful, smug, precise. It is a pop song about a breakup; the joke is how *exactly* the Git
  vocabulary fits, so the interfaces are accurate: real command lines, real messages
  (`HEAD detached at …`, `! [rejected] … (non-fast-forward)`, `--force-with-lease`), plausible hashes.
- No real product chrome. Panels are generic: no OS title bars, no imitation of a named Git host's
  UI, no logos. The phone is a rounded rectangle. The day grid is three rows of 365 dots, not a
  contribution chart.
- No stock "hacker" imagery: no code rain, no glitch, no neon. Clean editorial motion design.
- The ex is "you", a hollow ring — never a face. The singer is "me", a filled disc.

## Palette (local tokens: `app/src/force-push/kit.ts`)

| token | dark mode | paper mode | meaning |
|---|---|---|---|
| ground | `#0B1018` near-black navy | `#F3EFE7` warm off-white | the field |
| panel | `#131A26` | `#E9E3D8` | interface surfaces |
| rule | `#2A3546` | `#CFC7B8` | fine rules, grids, unlit graph edges |
| dim | `#5E6A7C` | `#8A8274` | secondary labels, unsung words |
| type | `#EEF1F4` | `#15171B` | primary type and ink |
| **green** | `#3BE07F` | `#0E9F4E` | **the singer's current truth**: `HEAD`, `origin/main`, the accepted/pushed state, progress that completes |
| **coral** | `#FF6F61` | `#D2463A` | **consequence**: the ex's hidden work, conflicts, lies, rejected and unreachable things |

Green is on screen from the first frame (the `main` pill). Coral is held back until it is
earned: it first appears when "the other branch you tried to hide" is found (27.98 s). Peak
contrast is reserved for the word being sung and for the consequence being revealed; everything
else sits back. Glow is a soft halo on green pointers only. Post: light grain (0.03), no
halation, faint chromatic aberration, gentle vignette — all subordinate to legibility.

**Presentation modes.** Dark for the repository and the pushes; paper for the cleanup (verse 2,
the second post-chorus, the bridge's etiquette page, and the inverted drop); one green field for
the last chant. A section change is a mode change.

## Typography

- **Archivo** (heavy, wide for slams; regular widths for lines) — the lyric. 88–180 px for main
  phrases at 1920×1080, fitted explicitly, laid out once per line and highlighted without reflow.
- **IBM Plex Mono** — every interface surface: commands, hashes, labels, pills, counters. Labels a
  viewer must read are 26–34 px; anything smaller is decoration and never carries a joke.
- **Cormorant Garamond** — only for "They say…": the etiquette page in the bridge is the one voice
  that is not the singer's.
- Karaoke: the line's words appear dim up to ~0.4 s early; each word lights when it is sung
  (`Lyrics.wordProgress`, never ahead of the voice) and settles. Lyrics live inside the scene
  (a terminal line, a file line, a hero line) — there is no subtitle strip.

## Composition & motion

- 96 px title-safe margins. Three layouts: text-left/object-right (verses), centred hero (slams,
  chants, the a cappella), full-frame evidence (blame, rebase, reflog).
- Flat interfaces; depth only as restrained scale and parallax. Crisp silhouettes, subdued
  background (a faint dot grid).
- Motion: fast arrival (0.15–0.35 s, ease-out), quick settle, readable hold (0.6–1.2 s where the
  music allows), then a motivated transformation. Impacts (FORCE/PUSH, stamps) get a short punch-in
  and shake; nothing drifts at random.
- Transition vocabulary: hard cut (default, on the beat before a phrase), match (terminal → graph,
  graph → graph across choruses), motivated pull-back (intro), wipe (the "Wipe it clean" squeegee),
  stamped impact (FORCE PUSH).

## Timing rules (as applied)

Phrase meaning picks the scene; the tracked beat grid places cuts and accents; word timing drives
the karaoke. Cuts land on the last beat at or before the incoming phrase unless the previous line is
still being sung there, in which case the cut waits for the phrase boundary. Sung words are never
quantised. Sung tails carry across cuts. Every repeated chorus changes at least one state (see the
cue sheet's motif column). Intro, the pad before verse 1, the drum build before the a cappella and
the whole 12 s tag after "I can wait." are covered on purpose.

## Scenes

| entry | module | lines | mode | what happens |
|---|---|---|---|---|
| `intro` | `force-push-terminal` | 0–2 | dark | Huge cursor on the beat → `git status` typed with the voice → `nothing to commit` (sung half lit) → "Story of your life." Pull-back to the terminal; `git log --graph` starts the pad. |
| `graph` | `force-push-graph` | pad, 3–6 | dark | Commits by "me" stamp in on the beat over the pad; 3-year axis. "never could commit": a ring tries to attach and falls off. "stash": a "me" disc dropped into `stash@{0}`. "just a feature": a `feature` pill. "found the other branch": the hidden lane unfolds — coral rings. |
| `blame` | `force-push-blame` | 7–10 | dark | Full-frame `git blame relationship.md`: every broken line blamed on "you"; `--author=me` → 0 lines; `git merge you` → CONFLICT; each conflict "introduced by you". |
| `nomore1` | `force-push-nomore` | 11–14 | dark | "NO MORE" hero; patches, one more try, the night-time log, each struck. `HEAD detached at 3f9e2c1` floats off. "Stop," freezes everything; "one beat" ticks once; `git push --force origin main` typed, Enter on "gone". |
| `chorus1` | `force-push-chorus` | 15–18 | dark | FORCE / PUSH slam; `origin/main` jumps to the rewritten tip; the old line drops into a ghost lane ("history"); commit messages reworded `us:` → `me:`; second slam crushes the lies; a brand new green line runs off-frame, no merge back. |
| `origin1` | `force-push-origin` | 19–20 | dark | Split: the ex's local copy (old graph, intact) vs `origin` (clean). "Origin's mine": origin takes the frame; collaborators: me ✓, you —. |
| `chant1` | `force-push-chant` | 21–24 | dark | Stomp type: FORCE! / PUSH! / (hey!) per bar; a squeegee wipe, a ring erased, a crowd of +1s (128), `git log --author=you` → nothing. |
| `squash` | `force-push-squash` | 25–28 | paper | `git rebase -i --root`: 1,095 picks squashed to one line; `fix: wasted time`; three good days cherry-picked out of 1,095 dots; the rest rebased off the tree. |
| `phone` | `force-push-phone` | 29–32 | paper | Phone lit by PR notifications; "Please review?" → reviewers: none; `.gitignore` line 1: `you`; incoming files greyed out, `git status` → nothing to commit. |
| `nomore2` | `force-push-nomore` | 33–36 | dark | Same stage, state changed: items arrive already struck; the ex's night logs are now begging commits; a `Revert "force push"` request → "cute." and flicked away; `git push --force` again. |
| `chorus2` | `force-push-chorus` | 37–40 | dark | Same graph: the ex's revert commits are force-pushed over too; two ghost lanes; push counter 2. |
| `origin2` | `force-push-origin` | 41–42 | dark | The ex's copy now shows `! [rejected] main -> main (non-fast-forward)`. |
| `chant2` | `force-push-chant` | 43–46 | paper | Same chant in paper mode; crowd 4,096. |
| `etiquette` | `force-push-etiquette` | 47–50 | paper | The etiquette page (Cormorant): never force a shared branch; collaborators can lose work; "you — last checkout 3 years ago"; `--force-with-lease` struck to `--force`; Enter on "go". |
| `acapella` | `force-push-acapella` | build, 51–52 | dark | Drum build = `Writing objects` 0→100 %. Then the a cappella, quiet: one line at a time, "you and me" → "me." |
| `drop` | `force-push-chorus` | 53–54 | paper | The third push, inverted and biggest: three ghost lanes, the whole graph. |
| `origin3` | `force-push-origin` | 55–56 | paper | The ex's copy far away, rejected ×3; origin fills the frame. |
| `chant3` | `force-push-chant` | 57–60 | green | Biggest chant on a green field; crowd 1,000,000. |
| `outro` | `force-push-terminal` | 61–63, tag | dark | The opening terminal again: `git reflog` lists the ex's states; "expires in 30 days"; "I can wait." Hit: 30 days elapse, `git gc` prunes the coral entries per beat; drums out: `nothing to commit, working tree clean` — the clean half lit green. |
