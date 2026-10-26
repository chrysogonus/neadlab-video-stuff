# Audit: force-push — proof-121.534-129.84.mp4

8.3 s from track 121.53; 8 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 1.08 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 2.41 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 57 % | 63 % | 86 % | **below** |
| seconds whose composition changes > 0.10 | 29 % | 19 % | 35 % |  |
| hard cuts per minute | 57.72 | 8.07 | 48.46 | **above** |
| share of the frame that is true black | 29 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 25 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.05 | 0.07 | 0.09 | **below** |
| accent area (median) | 11 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 12 % | 23 % | 26 % |  |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 25-lies2 | 2.02 / 14.38 | 0.16 | 0.44 | 30 % | 98 % | 0.51 |
| 26-timeline2 | 0.98 / 4.17 | 0.12 | 0.35 | 35 % | 99 % | 0.53 |
| 27-local2 | 0.62 / 2.79 | 0.07 | 0.10 | 49 % | 3 % | 0.52 |

## Weakest scenes (big motion against their music)

27-local2 (2.79 @ drums 0.52), 26-timeline2 (4.17 @ drums 0.53), 25-lies2 (14.38 @ drums 0.51)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (2 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

122.59, 124.88
