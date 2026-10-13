# Force Push (blind): treatment

## 1. The idea: the repository `us.git`

The whole video happens inside one git repository, `~/us`, with one branch, `main`, and three years of history.
The relationship *is* the repo: he is the author `you`, she is `me`, their past is the commit log, and the
breakup is the one operation git warns you never to do on a shared branch: rewriting published history with
`git push --force`.

Why it fits: the lyric already lives here. Every line is a real git verb used as a feeling (commit, stash,
branch, blame, merge, conflict, patch, log, detached HEAD, squash, cherry-pick, rebase, pull request, review,
.gitignore, revert, force-with-lease, reflog). The song's joke is that the jargon is *exact*: a man who "never
could commit", a lover kept "in your stash", unreachable commits that the reflog really does forget after 30 days
(`gc.reflogExpireUnreachable`). So the video takes the jargon literally and plays it straight: real commands, real
git output, real defaults. The wit is in the accuracy.

Rules of the world:

- **The verses are local.** A dark terminal on her machine: she investigates, types, discovers. Typed commands
  are the verse's voice; git's deadpan replies are the punchlines.
- **The choruses are origin.** When she pushes, the world flips to the bright, public remote: the published,
  rewritten history that everyone pulls. Words get huge; the history graph gets torn and redrawn.
- **The drop is the forced update itself**: the red ground of `(forced update)`, the one time the whole frame
  is the accent's colour.
- Everything said on screen must be something git could plausibly print or a command that would run. No made-up
  "ERROR: LOVE NOT FOUND" jokes; the real messages are funnier.

## 2. Visual vocabulary

| object / mark | what it means | carried by |
|---|---|---|
| the terminal (`~/us main $`, window `zsh — ~/us`) | her private investigation | lib-terminal |
| git's replies (`nothing to commit, working tree clean`, `Aborting commit due to empty commit message.`, `+ 3f9c2e1...a41b7d0 main -> main (forced update)`) | the deadpan punchline under each command | lib-terminal `output` |
| conflict markers `<<<<<<< HEAD (me)` / `>>>>>>> you` | the blame: two columns, hers stays empty | lib-compare |
| a struck-through list headed "No more" | the pre-chorus vow; each item crossed out on the beat | lib-list (`mark: strike`) |
| the history graph (dots on a rail, hashes, branch labels `main`, `origin/main`, `you/other`) | the motif, see §3 | custom `fp-blind-history` |
| the sung line set as the anthem | choruses, the a cappella | lib-lyric |
| one slammed word | the gang chant | lib-slam |
| a phone thread with "Unknown" | his pull requests "lighting up my phone" | lib-chat |
| a serif pull quote | the bridge's received wisdom ("they say") | lib-quote |
| a rolling number with a sparkline | the count of him in history, falling to zero | lib-counter |
| an editorial title card | opening and closing slates | lib-title |

Typography carries it: **mono** (IBM Plex) is git's and the terminal's voice and also the project-wide karaoke
layer, so every sung line reads like a commit message; **display** (Archivo 112 % width, 900) is the push: wide,
heavy letters shoving across the frame in choruses and slams; **serif italic** (Cormorant) appears only in the
bridge, the one sincere moment; **body** (Archivo 500) for labels and list items.

## 3. The motif: the history of `you` (1,095 → 0)

One number and one graph, the same history seen at each stage of its erasure:

1. **Plant (intro, "Story of your life.")**: `git log --oneline | wc -l` prints `1095`. Three years, one commit a
   day. The number is never explained; it just sits there.
2. **Verse 1**: the blame. Every broken line is his; the `HEAD (me)` column stays empty.
3. **Chorus 1 (hero A)**: the 1,095 commits drawn as a graph, his side branch `you/other` among them; on
   "FORCE PUSH!" his history is torn out and `origin/main` jumps to her new tip.
4. **Verse 2**: `git rebase -i --root` squashes it: `1095` becomes `1` commit, message `fix, wasted time`.
   Cherry-picked: 3 (the good days).
5. **Drop (hero B)**: the graph returns, now a single straight rail of her commits only, growing up the frame
   in the forced palette.
6. **Payoff (outro)**: the counter: `1095` commits by you, unreachable → `30` days until git forgets → rolls to
   `0` through the instrumental ("I can wait"), and on the last hit `git gc --prune=now`.
7. **Second plant/payoff**: line 1's insult "Nothing to commit." returns as the last card: `nothing to commit,
   working tree clean`. The phrase that was his flaw becomes her peace.

## 4. The arc

Cue lyrics come from the brief's table (what is sung), not the sheet: line 14 is "One beat and you're gone",
line 34 "No more reading your logs and now", lines 51–52 end in periods.

| section | time | energy | scene | palette | plan |
|---|---|---|---|---|---|
| intro | 0.00–8.94 | low | lib-terminal, prompt `~/us main $`, title `zsh — ~/us` | local | L0 `git status` → `On branch main`, `Your branch is up to date with 'origin/main'.` L1 `git commit -am "us"` → `nothing to commit, working tree clean`. L2 `git log --oneline \| wc -l` → `1095` (plant). Sparse, dry, the cursor blinks on the beat. |
| intro instrumental | 8.94–16.93 (bars 4–9) | low | lib-title, span cue landing on bar 5 | local | title `Force Push`, kicker `~/us · main · 1,095 commits`, subtitle `a history, rewritten`. |
| verse1 a | L3–L6 | mid | lib-terminal (new session, same prompt) | local | L3 `git commit` → `Aborting commit due to empty commit message.` L4 `git stash list` → `stash@{0}: WIP on main: me`. L5 `git branch` → `* main` (nothing on the side). L6 `git branch -a` → `* main`, `  remotes/you/other`: the hidden branch appears only with `--all`. Enter lands on the anchor (commit / stash, / side / hide). |
| verse1 b | L7–L10 | mid | lib-compare, left `<<<<<<< HEAD (me)`, right `>>>>>>> you`, verdict `CONFLICT (content): every hunk is yours` | local | L7 right `every broken line` (anchor blame), L8 right `every single one` (anchor name,), L9 both `merge, work it through` (anchor merge,), L10 right `every conflict` (anchor you). The left column stays empty all verse: the joke of "your name, not mine". |
| prechorus1 | L11–L14 | mid, climbing | lib-list, title `No more`, mark strike, numbered | local | L11 `patches`, L12 `reading your logs at night`, L13 `a detached HEAD`, L14 `you`, struck on "gone" after the beat of silence. Strikes land on the anchor. |
| chorus1 | L15–L20 | high | **hero A** `fp-blind-history` (act `rewrite`) | origin | Cut to bright on "FORCE". The history graph; each chorus line lands as a new commit message at the top; his branch rips away on the first PUSH!, `origin/main` lands on "mine" (L20). |
| postchorus1 | L21–L24 | mid | lib-slam, fill accent, upper | origin | Slam the payoff word of each line: CLEAN, NEVER, CROWD, HISTORY. |
| verse2 a | L25–L28 | mid, smug | lib-terminal | local | L25 `git rebase -i --root` → `squash: 1095 commits → 1`, `Successfully rebased and updated refs/heads/main.` L26 `git commit --amend -m "fix, wasted time"` → `[main 0a1f3e2] fix, wasted time`. L27 `git cherry-pick 3c0ffee f00d42 b4dc0de` → `3 commits applied: the good days`. L28 `git rebase --onto main you/other` → `you/other: dropped`. |
| verse2 b | L29–L32 | mid | lib-chat, name `Unknown` | local | L29 them: `Review requested: "us (v2)"`. L30 me: `you're on your own`. L31 me: `echo you >> .gitignore`. L32 them: `hello??`, left unread. Her bubbles are accent. |
| prechorus2 a | L33–L34 | mid | lib-list again, `No more`, strike | local | L33 `one more try`, L34 `your logs`. Faster: the vow is a reflex now. |
| prechorus2 b | L35–L36 | mid | lib-terminal | local | L35 `git revert HEAD` → `error: nothing to revert`. L36 `git push --force origin main` entered on "do" → ` + 3f9c2e1...a41b7d0 main -> main (forced update)`: the push lands just before chorus 2. |
| chorus2 | L37–L42 | high | lib-lyric, align center, upper | origin | Changed: no graph now, the words alone at full width: the push already happened, this is the anthem. Emphasis words: history, rewrote, lies, timeline, care, mine. |
| postchorus2 | L43–L46 | high | lib-slam, fill type, upper | origin | Changed: slam the crowd's `HEY!` on each (hey!) token, then NOW on L46 (in accent via cue `word`). |
| bridge a | L47–L49 | mid, stripped | lib-quote | local | The sung line wiped in serif. L47 `by: "every git tutorial"`, L48 `by: "the docs, again"`, L49 no attribution: her own line. Slow, sincere, the most space in the video. |
| bridge b | L50 | mid | lib-terminal | local | `git push --force --no-force-with-lease --no-verify` entered on "go": no lease, no warning, literally. Output `Writing objects: 100% (1/1), done.` |
| finalchorus | L51–L52 | mid, a cappella | lib-lyric, align left, lowercase | local | The same words stated, not shouted: small, left, dark, the anchor in accent only. No beat motion (no drums). |
| drop | L53–L56 | highest | **hero B** `fp-blind-history` (act `own`) | forced | Key change: the whole frame turns forced-red. The graph returns as one straight rail of her commits only, each line a new commit; `origin/main` and `HEAD` both land on "mine". |
| postchorus3 | L57–L60 | high | lib-slam, fill accent, upper | forced | The biggest chant: PUSH! on each of the three, then HISTORY on L60. |
| outro | L61–L63 | mid, spoken | lib-counter, title `git reflog · unreachable`, delta false | local | L61 `1095`, label `commits by you` (anchor ref-log?). L62 `30`, label `days until git forgets` (anchor thirty). L63 `29`, label `I can wait` (anchor wait.). |
| outro instrumental | 197.42–~end (bars 107–113) | mid | same lib-counter, span cue | local | Rolls to `0`, label `git gc --prune=now`; the sparkline is the whole falling history 1095 → 30 → 0. |
| end card | the final hard hit (last bar) | | lib-title | local | title `Nothing to commit.`, kicker `git status`, subtitle `working tree clean`. Hold to the end. |

Energy rules: quiet sections (intro, bridge, a cappella) use one element on a dark ground and lots of space;
verses are information-dense but calm (one command or one item per line); choruses are the only bright ground
and the biggest type; the drop is the only red ground.

## 5. Hero moments (one custom scene, used twice)

`fp-blind-history`: a git history graph, drawn as `git log --graph` would: a vertical rail of commit dots with
short hashes and branch labels (`main`, `origin/main`, `HEAD`, `you/other`), the newest at the top; the scene
draws the lyric itself (each sung line becomes the newest commit's message, typed with the voice in display type,
the anchor word in accent). The library has nothing that shows a branching graph or can *remove* history, and
the removal is the story.

- **A, chorus 1 (`rewrite`, palette origin)**: the old history is visible below: a long rail fading into the
  thousands, with his side branch `you/other` splitting off. On the first "PUSH!" his branch and its commits are
  torn out of the frame (struck through in accent, then dropped), and the rail snaps straight; on the second
  "PUSH!" the old commits below her new tip collapse away; on "mine" (L20) `origin/main` moves to her tip.
- **B, the drop (`own`, palette forced)**: no old history and no side branch at all. A single straight rail of
  her commits only, climbing with each line, the hashes ticking on the beat, `origin/main` and `HEAD` landing
  together on "mine" (L56). The graph that was torn in A is now hers and clean.

No third custom scene: the library carries everything else in-world.

## 6. Style bible

Palettes (in `style.json`):

- **`local`**: intro, verses, pre-choruses, bridge, a cappella, outro. Her own machine at night.
  `bg #101114` graphite (a terminal, not pure black, so type sits softly); `type #ECE7DE` warm paper white
  (a person writing, not a phosphor screen); `accent #FF5B34` vermilion: the colour of force and of a deleted
  line in a diff, spent on the sung word, the Enter of each command and the strike.
- **`origin`**: choruses 1 and 2, post-choruses 1 and 2. The public remote, daylight, published.
  `bg #F2EEE5` paper; `type #131418` ink; `accent #D2341A` the same vermilion deepened to hold contrast on paper.
  The flip from dark to light is the push itself.
- **`forced`**: the drop and post-chorus 3 only. The `(forced update)` made into a ground.
  `bg #9C1A0C` oxide red (the vermilion taken to its darkest); `type #FFF3E8` warm white; `accent #FFC23F` amber,
  the heat at the centre of the red, for the sung word and the slammed chant.

Each palette is a ground, a type colour and one accent. No green: in git green means "added" and nothing of his
is being added.

Type roles: display = Archivo 112 % / 900 (choruses, slams, titles: wide, heavy, shoving); body = Archivo 100 /
500 (list items, labels); mono = IBM Plex Mono 400 (terminal, kickers, hashes) and the karaoke layer at mono 500,
size 58, y 0.87, unsung at 30 %, the active word in accent; serif = Cormorant italic 400 (bridge only).

Motion:

- Everything lands on the sung word: a command is *entered* on its anchor, a strike crosses on its anchor, a
  slam hits on its anchor, a commit lands on its anchor. Nothing moves "because it can".
- Breathe with the beat (130.5 BPM): the cursor blinks on beats; in choruses, hashes and labels tick on beats.
- Typing is with the voice, at speech speed, never instant.
- Cuts on the beat before the line (the usual cut); the cut into each chorus and the drop is hard, on the first
  word ("FORCE"), with the palette flip as the hit.
- Quiet sections hold still; the a cappella has no beat motion at all.

## 7. Don'ts

- No Matrix rain, green-on-black "hacker" screens, glitch/RGB-split, scanlines, CRT curvature or hoodie imagery.
  This is a woman at a terminal, not a heist.
- No hearts, broken hearts, roses, faces or silhouettes. The ex is only ever an author name, `you`.
- No logos or brand marks (no Octocat, no GitHub/GitLab chrome), no real people's names or emails in commits.
- No invented git errors ("ERROR: LOVE NOT FOUND"). Use real commands, real flags and git's real wording; if a
  reply has to be invented, it must read like git output.
- No particles, spectrum bars, lens flares or pulsing rings: lib-field and lib-pulse have no place in this world.
- Accent is never decoration: only the sung word, the Enter, the strike, the slam, the payoff number.
- Don't spend the `forced` palette before the drop, or the bright `origin` ground outside choruses and
  post-choruses.
- Don't let scene text sit in the karaoke band (lower ~20 %) in layer scenes.
- Don't explain the jargon. No captions saying what a force push is: the audience either knows or laughs anyway.
