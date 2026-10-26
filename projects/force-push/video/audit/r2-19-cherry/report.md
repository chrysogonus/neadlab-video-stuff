# Audit: force-push — proof-88.22-100.6.mp4

12.4 s from track 88.22; 1 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 1.53 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 2.45 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 82 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 18 % | 19 % | 35 % | **below** |
| hard cuts per minute | 4.85 | 8.07 | 48.46 | **below** |
| share of the frame that is true black | 30 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 0 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 25 % | 20 % | 9 % |  |
| detail (edge density) | 0.07 | 0.07 | 0.09 |  |
| accent area (median) | 3 % | 3 % | 3 % |  |
| seconds with no accent colour | 17 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| 18-message | 1.11 / 11.17 | 7.42 | 0.77 | 218 | 3 % | 58 % | 0.02 |
| 19-cherry | 1.71 / 5.17 | 7.46 | 0.11 | 62 | 42 % | 99 % | 0.45 |
| 20-phone (part) | 0.90 / 2.66 | 4.51 | 0.11 | 61 | 25 % | 55 % | 0.31 |

## Weakest scenes (big motion against their music)

20-phone (2.66 @ drums 0.31), 19-cherry (5.17 @ drums 0.45), 18-message (11.17 @ drums 0.02)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (0 of the 27 strong onsets and downbeats this video can judge (of 425 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

none
