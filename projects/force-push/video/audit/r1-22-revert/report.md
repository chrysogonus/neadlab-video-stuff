# Audit: force-push — proof-103.465-114.62.mp4

11.2 s from track 103.47; 16 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 1.02 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 1.68 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 100 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 10 % | 19 % | 35 % | **below** |
| hard cuts per minute | 85.97 | 8.07 | 48.46 | **above** |
| share of the frame that is true black | 21 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 27 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.05 | 0.07 | 0.09 | **below** |
| accent area (median) | 6 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 18 % | 23 % | 26 % |  |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 21-ignore | 1.11 / 4.13 | 0.15 | 0.24 | 5 % | 98 % | 0.03 |
| 22-revert | 0.95 / 4.95 | 0.11 | 0.25 | 36 % | 70 % | 0.25 |
| 23-force2 | 0.68 / 15.89 | 0.29 | 0.92 | 19 % | 97 % | 0.39 |

## Weakest scenes (big motion against their music)

22-revert (4.95 @ drums 0.25), 21-ignore (4.13 @ drums 0.03), 23-force2 (15.89 @ drums 0.39)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (0 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

none
