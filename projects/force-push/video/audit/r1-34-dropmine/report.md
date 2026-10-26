# Audit: force-push — proof-177.15-185.mp4

7.8 s from track 177.15; 8 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.74 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 1.20 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 67 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 50 % | 19 % | 35 % |  |
| hard cuts per minute | 61.15 | 8.07 | 48.46 | **above** |
| share of the frame that is true black | 17 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 86 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.05 | 0.07 | 0.09 | **below** |
| accent area (median) | 22 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 29 % | 23 % | 26 % | **above** |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 34-dropmine | 0.80 / 7.22 | 0.17 | 0.46 | 26 % | 79 % | 0.58 |
| 35-chant3 | 1.15 / 26.64 | 0.26 | 0.92 | 51 % | 93 % | 0.33 |

## Weakest scenes (big motion against their music)

34-dropmine (7.22 @ drums 0.58), 35-chant3 (26.64 @ drums 0.33)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (0 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

none
