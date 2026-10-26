# Audit: force-push — proof-51.907-56.791.mp4

4.9 s from track 51.91; 8 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.90 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 1.05 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 100 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 67 % | 19 % | 35 % |  |
| hard cuts per minute | 97.96 | 8.07 | 48.46 | **above** |
| share of the frame that is true black | 22 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 75 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.06 | 0.07 | 0.09 | **below** |
| accent area (median) | 12 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 0 % | 23 % | 26 % |  |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 09-stop | 0.96 / 3.00 | 0.10 | 0.14 | 33 % | 98 % | 0.00 |
| 10-force | 0.96 / 15.93 | 0.21 | 0.59 | 28 % | 99 % | 0.30 |
| 11-rewrote | 0.27 / 1.65 | 0.06 | 0.09 | 89 % | 63 % | 0.49 |

## Weakest scenes (big motion against their music)

11-rewrote (1.65 @ drums 0.49), 09-stop (3.00 @ drums 0.00), 10-force (15.93 @ drums 0.30)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (0 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

none
