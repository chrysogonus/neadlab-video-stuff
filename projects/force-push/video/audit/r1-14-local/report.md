# Audit: force-push — proof-63.679-72.935.mp4

9.3 s from track 63.68; 1 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.57 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 1.06 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 50 % | 63 % | 86 % | **below** |
| seconds whose composition changes > 0.10 | 25 % | 19 % | 35 % |  |
| hard cuts per minute | 6.47 | 8.07 | 48.46 | **below** |
| share of the frame that is true black | 26 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 0 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 11 % | 20 % | 9 % |  |
| detail (edge density) | 0.03 | 0.07 | 0.09 | **below** |
| accent area (median) | 7 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 11 % | 23 % | 26 % |  |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 13-timeline | 0.60 / 3.17 | 0.11 | 0.31 | 46 % | 97 % | 0.45 |
| 14-local | 0.70 / 6.24 | 0.13 | 0.22 | 17 % | 85 % | 0.44 |
| 15-origin | 0.44 / 3.88 | 0.84 | 0.92 | 4 % | 0 % | 0.46 |

## Weakest scenes (big motion against their music)

13-timeline (3.17 @ drums 0.45), 15-origin (3.88 @ drums 0.46), 14-local (6.24 @ drums 0.44)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (0 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

none
