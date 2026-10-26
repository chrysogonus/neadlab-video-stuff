# Audit: force-push — proof-68.69-76.59.mp4

7.9 s from track 68.69; 6 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.97 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 1.55 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 83 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 50 % | 19 % | 35 % |  |
| hard cuts per minute | 45.57 | 8.07 | 48.46 |  |
| share of the frame that is true black | 5 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 0 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 57 % | 20 % | 9 % |  |
| detail (edge density) | 0.05 | 0.07 | 0.09 | **below** |
| accent area (median) | 7 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 14 % | 23 % | 26 % |  |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 14-local | 0.67 / 6.23 | 0.13 | 0.22 | 17 % | 85 % | 0.44 |
| 15-origin | 1.12 / 8.95 | 0.79 | 0.92 | 1 % | 67 % | 0.46 |
| 16-chant | 1.31 / 17.83 | 0.23 | 0.92 | 56 % | 90 % | 0.24 |

## Weakest scenes (big motion against their music)

14-local (6.23 @ drums 0.44), 15-origin (8.95 @ drums 0.46), 16-chant (17.83 @ drums 0.24)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (0 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

none
