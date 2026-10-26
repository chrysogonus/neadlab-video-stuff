# Audit: force-push — proof-31.139-47.05.mp4

15.9 s from track 31.14; 2 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.58 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 1.21 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 79 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 7 % | 19 % | 35 % | **below** |
| hard cuts per minute | 7.54 | 8.07 | 48.46 | **below** |
| share of the frame that is true black | 21 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 0 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 53 % | 20 % | 9 % |  |
| detail (edge density) | 0.06 | 0.07 | 0.09 | **below** |
| accent area (median) | 1 % | 3 % | 3 % | **below** |
| seconds with no accent colour | 13 % | 23 % | 26 % |  |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 06-blame | 0.78 / 4.21 | 0.11 | 0.23 | 53 % | 80 % | 0.26 |
| 07-merge | 0.57 / 3.69 | 0.79 | 0.92 | 0 % | 82 % | 0.36 |
| 08-patches | 0.24 / 2.57 | 0.05 | 0.04 | 90 % | 13 % | 0.08 |

## Weakest scenes (big motion against their music)

07-merge (3.69 @ drums 0.36), 08-patches (2.57 @ drums 0.08), 06-blame (4.21 @ drums 0.26)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (0 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

none
