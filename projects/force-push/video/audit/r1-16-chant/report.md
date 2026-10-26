# Audit: force-push — proof-72.435-83.984.mp4

11.6 s from track 72.44; 28 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.95 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 1.96 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 100 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 40 % | 19 % | 35 % |  |
| hard cuts per minute | 145.45 | 8.07 | 48.46 | **above** |
| share of the frame that is true black | 3 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 55 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 27 % | 20 % | 9 % |  |
| detail (edge density) | 0.06 | 0.07 | 0.09 | **below** |
| accent area (median) | 6 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 9 % | 23 % | 26 % |  |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 15-origin | 1.07 / 7.96 | 0.79 | 0.92 | 1 % | 67 % | 0.46 |
| 16-chant | 1.11 / 4.18 | 0.16 | 0.31 | 8 % | 99 % | 0.24 |
| 17-squash | 1.21 / 2.23 | 0.09 | 0.15 | 9 % | 3 % | 0.23 |

## Weakest scenes (big motion against their music)

17-squash (2.23 @ drums 0.23), 16-chant (4.18 @ drums 0.24), 15-origin (7.96 @ drums 0.46)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (1 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

81.64
