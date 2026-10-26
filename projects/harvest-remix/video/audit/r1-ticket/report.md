# Audit: harvest-remix — proof-99.756-118.5.mp4

18.8 s from track 99.76; 4 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 1.34 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 2.49 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 94 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 24 % | 19 % | 35 % |  |
| hard cuts per minute | 12.80 | 8.07 | 48.46 |  |
| share of the frame that is true black | 13 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 22 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 78 % | 20 % | 9 % |  |
| detail (edge density) | 0.07 | 0.07 | 0.09 | **below** |
| accent area (median) | 0 % | 3 % | 3 % | **below** |
| seconds with no accent colour | 78 % | 23 % | 26 % | **above** |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| dark | 1.14 / 5.53 | 7.43 | 0.39 | 218 | 41 % | 31 % | 0.17 |
| ticket | 1.51 / 4.00 | 7.76 | 0.89 | 230 | 0 % | 27 % | 0.47 |
| petabytes (part) | 3.96 / 7.69 | 12.82 | 0.17 | 86 | 24 % | 100 % | 0.83 |

## Weakest scenes (big motion against their music)

ticket (4.00 @ drums 0.47), petabytes (7.69 @ drums 0.83), dark (5.53 @ drums 0.17)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (2 of the 40 strong onsets and downbeats this video can judge (of 312 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

100.67, 112.97
