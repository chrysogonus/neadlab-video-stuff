# Audit: force-push — proof-100.044-107.87.mp4

7.8 s from track 100.04; 7 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 1.14 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 2.14 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 100 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 0 % | 19 % | 35 % | **below** |
| hard cuts per minute | 53.62 | 8.07 | 48.46 | **above** |
| share of the frame that is true black | 23 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 0 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.05 | 0.07 | 0.09 | **below** |
| accent area (median) | 3 % | 3 % | 3 % |  |
| seconds with no accent colour | 0 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| 20-phone | 0.93 / 4.73 | 5.31 | 0.12 | 60 | 21 % | 83 % | 0.10 |
| 21-ignore | 1.12 / 4.69 | 8.28 | 0.12 | 58 | 33 % | 98 % | 0.03 |
| 22-revert (part) | 1.25 / 4.14 | 10.27 | 0.08 | 37 | 45 % | 13 % | 0.33 |

## Weakest scenes (big motion against their music)

22-revert (4.14 @ drums 0.33), 20-phone (4.73 @ drums 0.10), 21-ignore (4.69 @ drums 0.03)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (2 of the 6 strong onsets and downbeats this video can judge (of 425 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

101.88, 101.91
