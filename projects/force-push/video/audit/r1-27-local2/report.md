# Audit: force-push — proof-124.58-133.652.mp4

9.1 s from track 124.58; 2 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.87 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 2.07 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 75 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 12 % | 19 % | 35 % | **below** |
| hard cuts per minute | 13.21 | 8.07 | 48.46 |  |
| share of the frame that is true black | 26 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 0 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 11 % | 20 % | 9 % |  |
| detail (edge density) | 0.05 | 0.07 | 0.09 | **below** |
| accent area (median) | 6 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 22 % | 23 % | 26 % |  |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 26-timeline2 | 0.96 / 4.32 | 0.12 | 0.35 | 35 % | 100 % | 0.53 |
| 27-local2 | 0.69 / 6.69 | 0.11 | 0.25 | 42 % | 82 % | 0.52 |
| 28-origin2 | 1.05 / 5.03 | 0.79 | 0.92 | 4 % | 0 % | 0.52 |

## Weakest scenes (big motion against their music)

26-timeline2 (4.32 @ drums 0.53), 28-origin2 (5.03 @ drums 0.52), 27-local2 (6.69 @ drums 0.52)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (0 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

none
