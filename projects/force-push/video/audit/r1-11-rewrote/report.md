# Audit: force-push — proof-53.38-61.28.mp4

7.9 s from track 53.38; 6 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.96 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 1.31 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 100 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 33 % | 19 % | 35 % |  |
| hard cuts per minute | 45.57 | 8.07 | 48.46 |  |
| share of the frame that is true black | 36 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 29 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.07 | 0.07 | 0.09 |  |
| accent area (median) | 5 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 14 % | 23 % | 26 % |  |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 10-force | 1.00 / 13.72 | 0.21 | 0.59 | 28 % | 99 % | 0.30 |
| 11-rewrote | 0.77 / 5.31 | 0.11 | 0.23 | 47 % | 95 % | 0.49 |
| 12-lies | 0.96 / 16.87 | 0.16 | 0.27 | 21 % | 90 % | 0.41 |

## Weakest scenes (big motion against their music)

11-rewrote (5.31 @ drums 0.49), 10-force (13.72 @ drums 0.30), 12-lies (16.87 @ drums 0.41)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (0 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

none
