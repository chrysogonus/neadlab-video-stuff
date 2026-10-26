# Audit: force-push — proof-27.57-39.223.mp4

11.7 s from track 27.57; 2 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.48 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 0.79 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 80 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 0 % | 19 % | 35 % | **below** |
| hard cuts per minute | 10.29 | 8.07 | 48.46 |  |
| share of the frame that is true black | 59 % | 20 % | 44 % | **above** |
| mid-tone seconds (luma 0.15–0.5) | 0 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.06 | 0.07 | 0.09 | **below** |
| accent area (median) | 3 % | 3 % | 3 % | **below** |
| seconds with no accent colour | 27 % | 23 % | 26 % | **above** |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 05-branch | 0.15 / 0.33 | 0.07 | 0.10 | 88 % | 61 % | 0.14 |
| 06-blame | 0.79 / 4.35 | 0.11 | 0.24 | 53 % | 81 % | 0.26 |
| 07-merge | 0.66 / 4.17 | 0.82 | 0.92 | 3 % | 0 % | 0.36 |

## Weakest scenes (big motion against their music)

05-branch (0.33 @ drums 0.14), 07-merge (4.17 @ drums 0.36), 06-blame (4.35 @ drums 0.26)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (0 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

none
