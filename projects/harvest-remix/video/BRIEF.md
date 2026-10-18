---
workflow: music-to-video
flow: automation
storyboard: no
message: "Everything you encrypt today is already being stored, waiting for the day it can be read."
destination: youtube
aspect: 1920x1080
language: en
length: 164.4s
angle: lyric video
---

## Intent

The official lyric video for NEAD's "Harvest Now, Decrypt Later (Banger Remix)", for the Neadlab YouTube channel.
It should stop people scrolling and make them rewatch: a designed kinetic-type spine with a few cinematic hits on
the song's biggest moments (first drop, "Petabytes", the final drop on "NOW"). The user's words: "stunning visuals,
on-point sync, every shot fitting its line"; the previous drafts' procedural 3D was "not good enough".

## Assets

- assets/bgm.mp3 — the master (made by `./vid video harvest-remix` from projects/harvest-remix/input/).
- lyrics.json — every sung line and word with its track-second time (the repo's forced alignment). The timing truth
  for every lyric on screen.

## Customizations

- One love letter is followed through the whole video (a sealed ciphertext object, drawer 0001), copied and
  stored in verse 1, and read on "now" — the story from projects/harvest-remix/proposal.md, retold in type.
- Artist name NEAD on the title and end cards.

## Notes

- Imagery is code-rendered only: type, shapes, SVG, canvas, three.js. No photos, generated images or video clips.
- Quantum stays metaphor: no ETA, no countdowns, no hooded hackers, skulls, "ACCESS GRANTED", Matrix rain,
  globes with attack arcs. The letters and numbers on screen are fiction written for the video.
- Autonomous run: no checkpoints; render after `check` passes and the snapshots were inspected.
