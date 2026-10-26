# Audit: force-push — proof-76.09-88.72.mp4

12.6 s from track 76.09; 31 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 1.18 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 1.36 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 91 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 36 % | 19 % | 35 % |  |
| hard cuts per minute | 147.23 | 8.07 | 48.46 | **above** |
| share of the frame that is true black | 9 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 33 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.06 | 0.07 | 0.09 | **below** |
| accent area (median) | 2 % | 3 % | 3 % | **below** |
| seconds with no accent colour | 8 % | 23 % | 26 % |  |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 16-chant | 1.16 / 3.89 | 0.16 | 0.31 | 8 % | 99 % | 0.24 |
| 17-squash | 0.83 / 4.21 | 0.13 | 0.22 | 14 % | 82 % | 0.23 |
| 18-message | 3.13 / 6.98 | 0.81 | 0.92 | 3 % | 0 % | 0.02 |

## Weakest scenes (big motion against their music)

16-chant (3.89 @ drums 0.24), 17-squash (4.21 @ drums 0.23), 18-message (6.98 @ drums 0.02)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (1 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

81.64
