# Audit: force-push — proof-100.044-107.87.mp4

7.8 s from track 100.04; 7 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 1.14 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 2.03 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 100 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 0 % | 19 % | 35 % | **below** |
| hard cuts per minute | 53.62 | 8.07 | 48.46 | **above** |
| share of the frame that is true black | 9 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 29 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.05 | 0.07 | 0.09 | **below** |
| accent area (median) | 3 % | 3 % | 3 % |  |
| seconds with no accent colour | 0 % | 23 % | 26 % |  |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 20-phone | 0.93 / 4.73 | 0.12 | 0.19 | 21 % | 83 % | 0.10 |
| 21-ignore | 1.10 / 4.27 | 0.15 | 0.24 | 5 % | 98 % | 0.03 |
| 22-revert | 1.64 / 3.55 | 0.08 | 0.12 | 45 % | 13 % | 0.25 |

## Weakest scenes (big motion against their music)

22-revert (3.55 @ drums 0.25), 20-phone (4.73 @ drums 0.10), 21-ignore (4.27 @ drums 0.03)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (2 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

101.88, 101.91
