# Audit: harvest-remix — proof-85.147-105.243.mp4

20.1 s from track 85.15; 9 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 3.48 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 6.47 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 100 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 53 % | 19 % | 35 % |  |
| hard cuts per minute | 26.87 | 8.07 | 48.46 |  |
| share of the frame that is true black | 39 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 75 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 5 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.09 | 0.07 | 0.09 |  |
| accent area (median) | 9 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 20 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| mine | 3.75 / 11.78 | 14.29 | 0.16 | 108 | 38 % | 98 % | 0.31 |
| dark | 0.82 / 4.91 | 5.69 | 0.36 | 218 | 47 % | 45 % | 0.17 |

## Weakest scenes (big motion against their music)

dark (4.91 @ drums 0.17), mine (11.78 @ drums 0.31)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (4 of the 32 strong onsets and downbeats this video can judge (of 312 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

88.32, 91.77, 97.46, 100.67
