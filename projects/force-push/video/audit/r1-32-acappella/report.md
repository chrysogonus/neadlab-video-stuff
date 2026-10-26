# Audit: force-push — proof-151.68-170.27.mp4

18.6 s from track 151.68; 7 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.70 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 1.50 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 59 % | 63 % | 86 % | **below** |
| seconds whose composition changes > 0.10 | 24 % | 19 % | 35 % |  |
| hard cuts per minute | 22.58 | 8.07 | 48.46 |  |
| share of the frame that is true black | 34 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 6 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 39 % | 20 % | 9 % |  |
| detail (edge density) | 0.05 | 0.07 | 0.09 | **below** |
| accent area (median) | 1 % | 3 % | 3 % | **below** |
| seconds with no accent colour | 44 % | 23 % | 26 % | **above** |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 31-checkout | 1.06 / 4.06 | 0.78 | 0.91 | 18 % | 39 % | 0.00 |
| 32-acappella | 0.40 / 2.83 | 0.08 | 0.13 | 56 % | 66 % | 0.11 |
| 33-drop | 7.21 / 34.31 | 0.35 | 0.92 | 20 % | 98 % | 0.54 |

## Weakest scenes (big motion against their music)

32-acappella (2.83 @ drums 0.11), 31-checkout (4.06 @ drums 0.00), 33-drop (34.31 @ drums 0.54)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (2 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

153.37, 158.91
