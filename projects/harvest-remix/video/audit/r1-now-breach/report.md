# Audit: harvest-remix — proof-134.514-151.4.mp4

16.9 s from track 134.51; 8 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 1.10 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 4.44 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 80 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 60 % | 19 % | 35 % |  |
| hard cuts per minute | 28.40 | 8.07 | 48.46 |  |
| share of the frame that is true black | 29 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 50 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 44 % | 20 % | 9 % |  |
| detail (edge density) | 0.12 | 0.07 | 0.09 |  |
| accent area (median) | 5 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 0 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| reading | 0.56 / 2.08 | 3.64 | 0.79 | 211 | 18 % | 100 % | 0.05 |
| now | 2.02 / 4.74 | 7.02 | 0.10 | 82 | 73 % | 96 % | 0.04 |
| breach | 4.12 / 9.89 | 26.35 | 0.30 | 207 | 31 % | 100 % | 0.65 |
| library (part) | 1.06 / 3.18 | 4.36 | 0.10 | 114 | 64 % | 100 % | 0.57 |

## Weakest scenes (big motion against their music)

library (3.18 @ drums 0.57), reading (2.08 @ drums 0.05), breach (9.89 @ drums 0.65), now (4.74 @ drums 0.04)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (3 of the 19 strong onsets and downbeats this video can judge (of 312 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

138.02, 143.79, 149.57
