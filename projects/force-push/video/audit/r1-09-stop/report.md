# Audit: force-push — proof-46.55-53.88.mp4

7.3 s from track 46.55; 3 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 1.35 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 1.60 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 100 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 0 % | 19 % | 35 % | **below** |
| hard cuts per minute | 24.55 | 8.07 | 48.46 |  |
| share of the frame that is true black | 36 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 0 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.04 | 0.07 | 0.09 | **below** |
| accent area (median) | 9 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 14 % | 23 % | 26 % |  |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 08-patches | 1.36 / 3.71 | 0.10 | 0.28 | 43 % | 71 % | 0.08 |
| 09-stop | 0.90 / 3.09 | 0.10 | 0.14 | 33 % | 99 % | 0.00 |
| 10-force | 0.80 / 12.05 | 0.15 | 0.32 | 56 % | 100 % | 0.30 |

## Weakest scenes (big motion against their music)

08-patches (3.71 @ drums 0.08), 09-stop (3.09 @ drums 0.00), 10-force (12.05 @ drums 0.30)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (3 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

50.28, 50.31, 52.15
