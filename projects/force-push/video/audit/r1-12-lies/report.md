# Audit: force-push — proof-60.78-64.179.mp4

3.4 s from track 60.78; 1 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 1.02 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 1.96 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 100 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 50 % | 19 % | 35 % |  |
| hard cuts per minute | 17.65 | 8.07 | 48.46 |  |
| share of the frame that is true black | 19 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 67 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.05 | 0.07 | 0.09 | **below** |
| accent area (median) | 9 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 33 % | 23 % | 26 % | **above** |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 12-lies | 1.22 / 6.31 | 0.17 | 0.42 | 15 % | 99 % | 0.41 |
| 13-timeline | 0.52 / 3.18 | 0.07 | 0.10 | 49 % | 73 % | 0.45 |

## Weakest scenes (big motion against their music)

13-timeline (3.18 @ drums 0.45), 12-lies (6.31 @ drums 0.41)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (0 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

none
