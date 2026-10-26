# Audit: force-push — proof-38.723-52.407.mp4

13.7 s from track 38.72; 3 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.98 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 1.62 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 75 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 8 % | 19 % | 35 % | **below** |
| hard cuts per minute | 13.14 | 8.07 | 48.46 |  |
| share of the frame that is true black | 15 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 0 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 54 % | 20 % | 9 % |  |
| detail (edge density) | 0.06 | 0.07 | 0.09 | **below** |
| accent area (median) | 1 % | 3 % | 3 % | **below** |
| seconds with no accent colour | 31 % | 23 % | 26 % | **above** |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 07-merge | 0.57 / 3.72 | 0.79 | 0.92 | 0 % | 83 % | 0.36 |
| 08-patches | 1.31 / 3.75 | 0.11 | 0.28 | 43 % | 71 % | 0.08 |
| 09-stop | 0.58 / 3.86 | 0.08 | 0.11 | 35 % | 97 % | 0.00 |

## Weakest scenes (big motion against their music)

07-merge (3.72 @ drums 0.36), 08-patches (3.75 @ drums 0.08), 09-stop (3.86 @ drums 0.00)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (1 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

46.61
