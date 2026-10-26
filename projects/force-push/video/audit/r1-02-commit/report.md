# Audit: force-push — proof-0-20.385.mp4

20.4 s from track 0.00; 9 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.55 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 0.99 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 58 % | 63 % | 86 % | **below** |
| seconds whose composition changes > 0.10 | 5 % | 19 % | 35 % | **below** |
| hard cuts per minute | 26.47 | 8.07 | 48.46 |  |
| share of the frame that is true black | 13 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 35 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.04 | 0.07 | 0.09 | **below** |
| accent area (median) | 7 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 15 % | 23 % | 26 % |  |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 01-status | 0.56 / 1.55 | 0.14 | 0.29 | 23 % | 88 % | 0.00 |
| 02-commit | 0.56 / 4.93 | 0.12 | 0.19 | 28 % | 84 % | 0.17 |
| 03-stash | 0.80 / 2.50 | 0.08 | 0.09 | 31 % | 13 % | 0.28 |

## Weakest scenes (big motion against their music)

03-stash (2.50 @ drums 0.28), 01-status (1.55 @ drums 0.00), 02-commit (4.93 @ drums 0.17)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (0 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

none
