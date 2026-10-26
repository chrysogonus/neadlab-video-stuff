# Audit: harvest-remix — proof-150.923-164.4.mp4

13.5 s from track 150.92; 3 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 1.17 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 5.57 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 92 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 58 % | 19 % | 35 % |  |
| hard cuts per minute | 13.35 | 8.07 | 48.46 |  |
| share of the frame that is true black | 43 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 85 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.10 | 0.07 | 0.09 |  |
| accent area (median) | 5 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 8 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| library | 3.11 / 8.55 | 12.36 | 0.17 | 125 | 31 % | 99 % | 0.64 |
| secure | 0.26 / 3.60 | 2.06 | 0.28 | 208 | 61 % | 65 % | 0.02 |

## Weakest scenes (big motion against their music)

library (8.55 @ drums 0.64), secure (3.60 @ drums 0.02)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (5 of the 34 strong onsets and downbeats this video can judge (of 312 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

153.2, 153.22, 153.66, 155.49, 158.54
