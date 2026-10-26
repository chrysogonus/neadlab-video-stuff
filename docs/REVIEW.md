# REVIEW.md — the independent review of a draft (pipeline step B)

A reviewer judges a rendered draft the way a viewer would, and says what to fix first. The reviewer is a fresh agent
that did not plan or build the video: the builders graded their own frames, so they no longer see them. AGENTS.md
("Making a video", stage 6) says when it runs; this file is the reviewer's brief.

## Inputs

- `projects/<id>/video/audit/<name>/report.md` — step A's measurements: the film against LGTM and p(doom), every
  scene, the weakest scenes, still runs, unseen hits.
- `projects/<id>/video/audit/<name>/strips/<scene>.jpg` — one image per scene, six frames a row: the first row is the
  cut-in (the scene's first 0.2 s at 30 fps), the rest the scene at 4 fps. This is what you judge composition, colour
  and legibility on.
- **Full-rate frames** for motion and transitions, which 4 fps cannot show (easing, blur, a few dark frames at a cut):
  around every scene switch and every drop, pull 0.5 s at 30 fps,
  `ffmpeg -ss <video s − 0.25> -i <video> -t 0.5 -vf fps=30,scale=480:270,tile=5x3 -frames:v 1 <png>` (video seconds are track
  seconds minus the report's offset).
- `projects/<id>/video/STORYBOARD.md` — what each scene means to show (its line, its literal image); `SYSTEM.md` —
  the film's world and rules; `lyrics.json` — the sung lines.
- `docs/HOUSE-STYLE.md`, `docs/visual-guidelines.md` (rules firm, signals to look at), `docs/REFERENCE-VIDEOS.md`
  (why the two reference videos succeeded).

Judge the render, never the code. Do not edit any file except your review. You cannot hear the track: judge sync from
the report's unseen hits and still runs, and from frames at the word starts in `lyrics.json` (does the word appear on
its time?). The user watches the delivery with sound; say which moments they should check by ear.

## Scene rubric (score each 1–5; 3 = fine for YouTube, 5 = a viewer would screenshot it)

| | what you ask |
|---|---|
| **idea** | Does the image take the line literally, inside the film's world? Would a viewer get the joke at a glance? |
| **motion** | Does something meaningful move on every bar, sized by the music (bigger on the drums, calm in breaths)? Is there one big move per phrase? Never frozen, never jolting. |
| **transitions** | Is the way in and the way out authored (a match on an object, a whip, a zoom-through, a velocity move into the cut), or a plain hard cut onto a still layout? |
| **legibility** | Does the sung line read at phone size (imagine the frame 1/5 wide)? One display moment at a time? |
| **colour & light** | Is the accent there as a pointer? Is there depth and light (a highlight, a lit object, a glow), or text on a black void? |
| **craft** | Does it look expensive: motion blur on fast moves, physical hits, detail on objects, clean type? |
| **variety** | Does it look different from its neighbours (layout family, lyric position, register)? |
| **spectacle** | Would it hold its own beside the reference still of the same role (below)? Is there one hero set piece in a space (depth, a moving camera, light coming from the object), or type laid over a flat ground? |

## The pairwise reference test

Scores drift when a scene is judged alone; judged beside a reference they do not (a pairwise judge agrees with
people better than a pointwise one: GenArena, arXiv 2602.06013). For every scene that scores 3 or less on
**spectacle**, and for the hook and every drop, set one frame of the scene beside the reference still of its role,
left/right by a seeded coin flip (so the review can be redone), and answer: which is more striking at
phone size, and what one change would close the gap? Pull the reference stills from the videos in
`successful-videos-reference/` with `ffmpeg -ss <s> -i <video> -frames:v 1 -vf scale=960:540 <png>`:

| role | reference | seconds |
|---|---|---|
| hook / chorus | p(doom), the lyric riding the oscilloscope trace | 41.2 |
| drop / biggest | p(doom), the black hole with "SINGULARITY'S" on its ring | 43.5 |
| verse (a world object) | LGTM, the org chart being "right-sized" | 52.5 |
| verse (a document) | LGTM, the status page saying everything's fine | 211.5 |
| quiet line | p(doom), "Gato, please" typed at the prompt | 91.5 |

Write the verdicts in the review's scene table (a column *vs ref*: ours / ref / even) and put every "ref" scene in
the ranked list.

## Film checks

- **The hook:** the first frame as a thumbnail (does it make you click?), the first 3 s and the first 15 s (would a
  viewer stay?). Most viewers who leave, leave here.
- **The pacing curve:** do energy, motion and brightness rise with the song and peak on the drops? Is any stretch
  flat for longer than a phrase?
- **Variety:** runs of the same layout family or the same lyric position across neighbours.
- **The ending:** the last 20 s carry YouTube's end-screen elements (two video cards and a subscribe button sit over
  the frame for 5–20 s): is there room for them, and is there a reason to watch to the end?

## Output: `projects/<id>/video/audit/<name>/review.md`

1. **Verdict** in three sentences: how close this is to the references, the single biggest weakness, the single best
   thing to keep.
2. **Scene table:** every scene, its seven scores and the lowest score's reason in a few words.
3. **The weakest scenes, ranked** (up to 10): for each, what is wrong (cite the strip frame or the track second) and
   one concrete fix in the film's world — a specific image, move or transition a builder can act on, not "make it more
   dynamic".
4. **Film-level fixes:** the three changes with the biggest expected effect on the whole video (hook, pacing curve,
   transitions, colour), each with where to apply it.

Be direct and calibrated: no praise padding, no scores of 5 for "fine". Every claim points at a frame.
