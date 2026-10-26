# Audit: force-push — proof-144.169-161.23.mp4

17.1 s from track 144.17; 2 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.73 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 1.40 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 69 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 12 % | 19 % | 35 % | **below** |
| hard cuts per minute | 7.03 | 8.07 | 48.46 | **below** |
| share of the frame that is true black | 16 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 0 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 82 % | 20 % | 9 % |  |
| detail (edge density) | 0.08 | 0.07 | 0.09 |  |
| accent area (median) | 1 % | 3 % | 3 % | **below** |
| seconds with no accent colour | 41 % | 23 % | 26 % | **above** |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 30-shared | 0.62 / 1.80 | 0.81 | 0.92 | 0 % | 59 % | 0.00 |
| 31-checkout | 1.07 / 4.17 | 0.78 | 0.91 | 18 % | 38 % | 0.00 |
| 32-acappella | 0.05 / 0.15 | 0.05 | 0.04 | 95 % | 3 % | 0.11 |

## Weakest scenes (big motion against their music)

32-acappella (0.15 @ drums 0.11), 30-shared (1.80 @ drums 0.00), 31-checkout (4.17 @ drums 0.00)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (3 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

147.86, 149.7, 153.37
