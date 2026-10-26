# Audit: force-push — proof-121.534-125.08.mp4

3.5 s from track 121.53; 8 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 2.24 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 2.72 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 100 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 50 % | 19 % | 35 % |  |
| hard cuts per minute | 135.21 | 8.07 | 48.46 | **above** |
| share of the frame that is true black | 31 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 67 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.05 | 0.07 | 0.09 | **below** |
| accent area (median) | 9 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 0 % | 23 % | 26 % |  |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 25-lies2 | 2.02 / 14.38 | 0.16 | 0.44 | 30 % | 98 % | 0.51 |
| 26-timeline2 | 0.17 / 0.61 | 0.05 | 0.04 | 94 % | 83 % | 0.53 |

## Weakest scenes (big motion against their music)

26-timeline2 (0.61 @ drums 0.53), 25-lies2 (14.38 @ drums 0.51)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (1 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

122.59
