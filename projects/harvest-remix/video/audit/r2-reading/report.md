# Audit: harvest-remix — proof-131.022-144.2.mp4

13.2 s from track 131.02; 5 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.54 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 2.76 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 58 % | 63 % | 86 % | **below** |
| seconds whose composition changes > 0.10 | 42 % | 19 % | 35 % |  |
| hard cuts per minute | 22.76 | 8.07 | 48.46 |  |
| share of the frame that is true black | 32 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 38 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 46 % | 20 % | 9 % |  |
| detail (edge density) | 0.08 | 0.07 | 0.09 |  |
| accent area (median) | 5 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 8 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| fridge | 2.67 / 15.31 | 11.63 | 0.19 | 154 | 59 % | 49 % | 0.07 |
| reading | 0.56 / 2.21 | 2.75 | 0.79 | 211 | 17 % | 100 % | 0.05 |
| now (part) | 0.45 / 2.01 | 2.41 | 0.08 | 87 | 80 % | 100 % | 0.22 |

## Weakest scenes (big motion against their music)

now (2.01 @ drums 0.22), reading (2.21 @ drums 0.05), fridge (15.31 @ drums 0.07)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (2 of the 9 strong onsets and downbeats this video can judge (of 312 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

132.56, 134.38
