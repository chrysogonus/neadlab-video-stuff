# Audit: force-push — proof-133.152-144.669.mp4

11.5 s from track 133.15; 24 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 1.11 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 2.83 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 100 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 20 % | 19 % | 35 % |  |
| hard cuts per minute | 124.86 | 8.07 | 48.46 | **above** |
| share of the frame that is true black | 14 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 45 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 27 % | 20 % | 9 % |  |
| detail (edge density) | 0.06 | 0.07 | 0.09 | **below** |
| accent area (median) | 6 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 18 % | 23 % | 26 % |  |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 28-origin2 | 0.95 / 11.95 | 0.78 | 0.92 | 1 % | 39 % | 0.52 |
| 29-chant2 | 1.38 / 5.79 | 0.14 | 0.30 | 27 % | 99 % | 0.28 |
| 30-shared | 0.88 / 1.31 | 0.83 | 0.92 | 1 % | 3 % | 0.00 |

## Weakest scenes (big motion against their music)

30-shared (1.31 @ drums 0.00), 29-chant2 (5.79 @ drums 0.28), 28-origin2 (11.95 @ drums 0.52)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (2 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

135.44, 142.32
