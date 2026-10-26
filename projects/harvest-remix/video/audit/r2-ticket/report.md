# Audit: harvest-remix — proof-99.756-118.3.mp4

18.6 s from track 99.76; 3 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 1.21 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 3.92 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 100 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 12 % | 19 % | 35 % | **below** |
| hard cuts per minute | 9.70 | 8.07 | 48.46 |  |
| share of the frame that is true black | 15 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 28 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 72 % | 20 % | 9 % |  |
| detail (edge density) | 0.07 | 0.07 | 0.09 |  |
| accent area (median) | 1 % | 3 % | 3 % | **below** |
| seconds with no accent colour | 67 % | 23 % | 26 % | **above** |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| dark | 0.81 / 4.89 | 6.08 | 0.36 | 218 | 47 % | 46 % | 0.17 |
| ticket | 1.86 / 6.20 | 9.94 | 0.87 | 234 | 0 % | 28 % | 0.47 |
| petabytes (part) | 2.74 / 6.01 | 10.28 | 0.16 | 86 | 27 % | 100 % | 0.87 |

## Weakest scenes (big motion against their music)

petabytes (6.01 @ drums 0.87), ticket (6.20 @ drums 0.47), dark (4.89 @ drums 0.17)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (3 of the 40 strong onsets and downbeats this video can judge (of 312 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

100.67, 112.97, 113.9
