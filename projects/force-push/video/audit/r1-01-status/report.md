# Audit: force-push — proof-0-15.581.mp4

15.6 s from track 0.00; 6 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.52 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 0.95 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 57 % | 63 % | 86 % | **below** |
| seconds whose composition changes > 0.10 | 0 % | 19 % | 35 % | **below** |
| hard cuts per minute | 23.10 | 8.07 | 48.46 |  |
| share of the frame that is true black | 12 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 40 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.04 | 0.07 | 0.09 | **below** |
| accent area (median) | 9 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 13 % | 23 % | 26 % |  |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 01-status | 0.55 / 1.52 | 0.14 | 0.29 | 23 % | 88 % | 0.00 |
| 02-commit | 0.98 / 5.98 | 0.06 | 0.07 | 82 % | 7 % | 0.17 |

## Weakest scenes (big motion against their music)

01-status (1.52 @ drums 0.00), 02-commit (5.98 @ drums 0.17)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (1 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

5.79
