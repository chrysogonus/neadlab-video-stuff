# Audit: force-push — proof-60.78-69.19.mp4

8.4 s from track 60.78; 1 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 1.02 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 2.11 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 86 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 14 % | 19 % | 35 % | **below** |
| hard cuts per minute | 7.13 | 8.07 | 48.46 | **below** |
| share of the frame that is true black | 25 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 25 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.04 | 0.07 | 0.09 | **below** |
| accent area (median) | 10 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 12 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| 12-lies | 1.23 / 6.31 | 6.86 | 0.17 | 116 | 15 % | 99 % | 0.41 |
| 13-timeline | 0.99 / 5.16 | 5.15 | 0.11 | 69 | 43 % | 100 % | 0.45 |
| 14-local (part) | 0.51 / 1.12 | 2.22 | 0.09 | 43 | 19 % | 0 % | 0.44 |

## Weakest scenes (big motion against their music)

14-local (1.12 @ drums 0.44), 13-timeline (5.16 @ drums 0.45), 12-lies (6.31 @ drums 0.41)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (0 of the 19 strong onsets and downbeats this video can judge (of 425 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

none
