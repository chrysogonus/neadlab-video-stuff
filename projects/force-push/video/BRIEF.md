---
workflow: music-to-video
flow: automation
storyboard: no
message: "A breakup told as a git history: the singer force-pushes the ex out of it, and only the reflog still remembers."
destination: youtube
aspect: 1920x1080
language: en
length: 209.64s
angle: lyric video
---

## Intent

The official lyric video for NEAD's "Force Push", for the Neadlab YouTube channel, made with the repo's seven-stage
pipeline (AGENTS.md "Making a video") and the house style (docs/HOUSE-STYLE.md). The audience is developers: every
git detail on screen must be real git, so the people who know it screenshot it. The published 2026-10 version came
from the retired three.js engine; this is a new version, not a port.

## Assets

- assets/bgm.mp3 — the master (made by `./vid video force-push` from projects/force-push/input/).
- lyrics.json — every sung line and word with its track-second time (the repo's forced alignment, including the two
  lines the vocal sings differently from the sheet: "Stop, one beat and you're gone" and "No more reading your
  logs / And now you want a revert? Baby, that's cute"). The timing truth for every lyric on screen.

## Customizations

- The world is one repository, `~/us`, seen through its own screens: terminal, log graph, blame, editor, stash,
  branches, the remote, a phone's notifications, the git documentation. Two authors: `me` (the singer) and `you`.
- Artist name NEAD on the title and end cards.

## Notes

- Imagery is code-rendered only: type, shapes, SVG, canvas. No photos, generated images or video clips, no logos
  (no GitHub or git marks: the screens are drawn in the palette).
- Commit hashes and dates are fiction; git's commands, flags, messages and defaults are real.
- Gates (AGENTS.md): the user's verdict on the look (stage 3 stills) and on the motion (stage 4 proof), nothing else.
