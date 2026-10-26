# Audit: force-push — proof-114.12-122.034.mp4

7.9 s from track 114.12; 10 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 1.41 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 1.85 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 100 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 83 % | 19 % | 35 % |  |
| hard cuts per minute | 75.79 | 8.07 | 48.46 | **above** |
| share of the frame that is true black | 22 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 57 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.06 | 0.07 | 0.09 | **below** |
| accent area (median) | 10 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 0 % | 23 % | 26 % |  |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 23-force2 | 1.46 / 16.00 | 0.18 | 0.44 | 14 % | 99 % | 0.39 |
| 24-rewrote2 | 1.19 / 8.06 | 0.12 | 0.29 | 43 % | 100 % | 0.50 |
| 25-lies2 | 1.09 / 26.63 | 0.30 | 0.92 | 35 % | 83 % | 0.51 |

## Weakest scenes (big motion against their music)

24-rewrote2 (8.06 @ drums 0.50), 23-force2 (16.00 @ drums 0.39), 25-lies2 (26.63 @ drums 0.51)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (0 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

none
