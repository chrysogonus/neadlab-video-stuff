# Audit: force-push — proof-92.086-103.965.mp4

11.9 s from track 92.09; 3 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 1.06 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 2.61 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 90 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 0 % | 19 % | 35 % | **below** |
| hard cuts per minute | 15.15 | 8.07 | 48.46 |  |
| share of the frame that is true black | 30 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 0 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.05 | 0.07 | 0.09 | **below** |
| accent area (median) | 3 % | 3 % | 3 % | **below** |
| seconds with no accent colour | 9 % | 23 % | 26 % |  |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 19-cherry | 1.10 / 4.68 | 0.10 | 0.20 | 43 % | 99 % | 0.45 |
| 20-phone | 0.94 / 4.76 | 0.12 | 0.19 | 21 % | 83 % | 0.10 |
| 21-ignore | 0.66 / 1.52 | 0.06 | 0.10 | 81 % | 53 % | 0.03 |

## Weakest scenes (big motion against their music)

21-ignore (1.52 @ drums 0.03), 19-cherry (4.68 @ drums 0.45), 20-phone (4.76 @ drums 0.10)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (13 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

92.69, 92.71, 93.17, 94.09, 96.37, 96.38, 98.22, 98.23, 98.67, 99.13, 99.59, 101.88, 101.91
