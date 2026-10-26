# Audit: force-push — proof-107.37-117.66.mp4

10.3 s from track 107.37; 9 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 1.12 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 2.09 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 100 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 33 % | 19 % | 35 % |  |
| hard cuts per minute | 52.43 | 8.07 | 48.46 | **above** |
| share of the frame that is true black | 29 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 30 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.05 | 0.07 | 0.09 | **below** |
| accent area (median) | 9 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 10 % | 23 % | 26 % |  |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 22-revert | 1.23 / 3.31 | 0.11 | 0.25 | 37 % | 69 % | 0.25 |
| 23-force2 | 1.46 / 16.01 | 0.18 | 0.44 | 14 % | 99 % | 0.39 |
| 24-rewrote2 | 0.30 / 1.88 | 0.06 | 0.09 | 86 % | 83 % | 0.50 |

## Weakest scenes (big motion against their music)

24-rewrote2 (1.88 @ drums 0.50), 22-revert (3.31 @ drums 0.25), 23-force2 (16.01 @ drums 0.39)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (0 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

none
