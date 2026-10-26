# Audit: force-push — proof-88.22-92.586.mp4

4.4 s from track 88.22; 0 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 1.42 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 1.79 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 100 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 67 % | 19 % | 35 % |  |
| hard cuts per minute | 0.00 | 8.07 | 48.46 | **below** |
| share of the frame that is true black | 10 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 0 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 75 % | 20 % | 9 % |  |
| detail (edge density) | 0.06 | 0.07 | 0.09 | **below** |
| accent area (median) | 2 % | 3 % | 3 % | **below** |
| seconds with no accent colour | 25 % | 23 % | 26 % |  |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 18-message | 1.11 / 11.16 | 0.77 | 0.92 | 3 % | 58 % | 0.02 |
| 19-cherry | 1.40 / 2.94 | 0.10 | 0.13 | 42 % | 83 % | 0.45 |

## Weakest scenes (big motion against their music)

19-cherry (2.94 @ drums 0.45), 18-message (11.16 @ drums 0.02)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (0 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

none
