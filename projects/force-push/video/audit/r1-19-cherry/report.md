# Audit: force-push — proof-88.22-100.544.mp4

12.3 s from track 88.22; 1 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 1.32 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 2.32 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 82 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 18 % | 19 % | 35 % | **below** |
| hard cuts per minute | 4.86 | 8.07 | 48.46 | **below** |
| share of the frame that is true black | 30 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 0 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 25 % | 20 % | 9 % |  |
| detail (edge density) | 0.06 | 0.07 | 0.09 | **below** |
| accent area (median) | 2 % | 3 % | 3 % | **below** |
| seconds with no accent colour | 17 % | 23 % | 26 % |  |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 18-message | 1.11 / 11.17 | 0.77 | 0.92 | 3 % | 58 % | 0.02 |
| 19-cherry | 1.05 / 4.74 | 0.10 | 0.20 | 42 % | 99 % | 0.45 |
| 20-phone | 0.93 / 3.07 | 0.11 | 0.20 | 26 % | 50 % | 0.10 |

## Weakest scenes (big motion against their music)

19-cherry (4.74 @ drums 0.45), 20-phone (3.07 @ drums 0.10), 18-message (11.17 @ drums 0.02)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (8 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

92.24, 92.69, 92.71, 93.17, 94.09, 98.67, 99.13, 99.59
