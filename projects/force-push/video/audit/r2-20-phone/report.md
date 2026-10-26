# Audit: force-push — proof-92.086-103.9.mp4

11.8 s from track 92.09; 3 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 1.60 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 2.69 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 100 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 10 % | 19 % | 35 % | **below** |
| hard cuts per minute | 15.23 | 8.07 | 48.46 |  |
| share of the frame that is true black | 27 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 27 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.06 | 0.07 | 0.09 | **below** |
| accent area (median) | 3 % | 3 % | 3 % | **below** |
| seconds with no accent colour | 9 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| 19-cherry | 1.71 / 5.19 | 8.60 | 0.11 | 66 | 42 % | 99 % | 0.45 |
| 20-phone | 1.37 / 5.78 | 8.13 | 0.14 | 66 | 12 % | 85 % | 0.10 |
| 21-ignore (part) | 1.90 / 5.91 | 9.74 | 0.12 | 66 | 45 % | 85 % | 0.04 |

## Weakest scenes (big motion against their music)

19-cherry (5.19 @ drums 0.45), 20-phone (5.78 @ drums 0.10), 21-ignore (5.91 @ drums 0.04)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (0 of the 25 strong onsets and downbeats this video can judge (of 425 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

none
