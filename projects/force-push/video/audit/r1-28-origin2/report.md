# Audit: force-push — proof-129.34-137.29.mp4

8.0 s from track 129.34; 5 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.74 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 1.47 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 100 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 33 % | 19 % | 35 % |  |
| hard cuts per minute | 37.74 | 8.07 | 48.46 |  |
| share of the frame that is true black | 14 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 0 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 57 % | 20 % | 9 % |  |
| detail (edge density) | 0.05 | 0.07 | 0.09 | **below** |
| accent area (median) | 1 % | 3 % | 3 % | **below** |
| seconds with no accent colour | 43 % | 23 % | 26 % | **above** |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 27-local2 | 0.73 / 6.53 | 0.11 | 0.25 | 41 % | 82 % | 0.52 |
| 28-origin2 | 0.92 / 11.70 | 0.78 | 0.92 | 2 % | 39 % | 0.52 |
| 29-chant2 | 1.09 / 30.63 | 0.24 | 0.92 | 54 % | 87 % | 0.28 |

## Weakest scenes (big motion against their music)

27-local2 (6.53 @ drums 0.52), 28-origin2 (11.70 @ drums 0.52), 29-chant2 (30.63 @ drums 0.28)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (0 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

none
