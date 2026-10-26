# Audit: force-push — proof-160.731-177.65.mp4

16.9 s from track 160.73; 13 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.83 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 2.21 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 47 % | 63 % | 86 % | **below** |
| seconds whose composition changes > 0.10 | 33 % | 19 % | 35 % |  |
| hard cuts per minute | 46.06 | 8.07 | 48.46 |  |
| share of the frame that is true black | 41 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 31 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.05 | 0.07 | 0.09 | **below** |
| accent area (median) | 2 % | 3 % | 3 % | **below** |
| seconds with no accent colour | 31 % | 23 % | 26 % | **above** |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 32-acappella | 0.40 / 2.82 | 0.08 | 0.14 | 56 % | 66 % | 0.11 |
| 33-drop | 1.31 / 12.12 | 0.23 | 0.78 | 31 % | 74 % | 0.54 |
| 34-dropmine | 0.72 / 2.74 | 0.11 | 0.22 | 22 % | 93 % | 0.58 |

## Weakest scenes (big motion against their music)

34-dropmine (2.74 @ drums 0.58), 32-acappella (2.82 @ drums 0.11), 33-drop (12.12 @ drums 0.54)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (0 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

none
