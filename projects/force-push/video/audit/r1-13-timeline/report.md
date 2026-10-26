# Audit: force-push — proof-60.78-69.19.mp4

8.4 s from track 60.78; 1 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.79 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 1.46 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 57 % | 63 % | 86 % | **below** |
| seconds whose composition changes > 0.10 | 14 % | 19 % | 35 % | **below** |
| hard cuts per minute | 7.13 | 8.07 | 48.46 | **below** |
| share of the frame that is true black | 38 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 25 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.04 | 0.07 | 0.09 | **below** |
| accent area (median) | 10 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 25 % | 23 % | 26 % |  |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 12-lies | 1.23 / 6.31 | 0.17 | 0.43 | 15 % | 99 % | 0.41 |
| 13-timeline | 0.59 / 3.32 | 0.11 | 0.31 | 46 % | 97 % | 0.45 |
| 14-local | 0.24 / 0.37 | 0.04 | 0.04 | 96 % | 3 % | 0.44 |

## Weakest scenes (big motion against their music)

14-local (0.37 @ drums 0.44), 13-timeline (3.32 @ drums 0.45), 12-lies (6.31 @ drums 0.41)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (0 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

none
