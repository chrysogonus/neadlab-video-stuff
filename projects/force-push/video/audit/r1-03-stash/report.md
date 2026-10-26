# Audit: force-push — proof-15.081-24.196.mp4

9.1 s from track 15.08; 3 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.52 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 1.52 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 62 % | 63 % | 86 % | **below** |
| seconds whose composition changes > 0.10 | 0 % | 19 % | 35 % | **below** |
| hard cuts per minute | 19.74 | 8.07 | 48.46 |  |
| share of the frame that is true black | 26 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 11 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.04 | 0.07 | 0.09 | **below** |
| accent area (median) | 3 % | 3 % | 3 % |  |
| seconds with no accent colour | 33 % | 23 % | 26 % | **above** |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 02-commit | 0.56 / 4.70 | 0.12 | 0.19 | 28 % | 75 % | 0.17 |
| 03-stash | 0.64 / 4.51 | 0.11 | 0.25 | 33 % | 82 % | 0.28 |
| 04-feature | 0.11 / 0.23 | 0.04 | 0.04 | 96 % | 3 % | 0.23 |

## Weakest scenes (big motion against their music)

04-feature (0.23 @ drums 0.23), 03-stash (4.51 @ drums 0.28), 02-commit (4.70 @ drums 0.17)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (0 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

none
