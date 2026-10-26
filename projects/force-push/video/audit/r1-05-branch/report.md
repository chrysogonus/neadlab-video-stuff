# Audit: force-push — proof-23.696-31.639.mp4

8.0 s from track 23.70; 2 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 2.15 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 2.68 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 100 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 33 % | 19 % | 35 % |  |
| hard cuts per minute | 15.09 | 8.07 | 48.46 |  |
| share of the frame that is true black | 20 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 14 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.05 | 0.07 | 0.09 | **below** |
| accent area (median) | 6 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 14 % | 23 % | 26 % |  |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 04-feature | 0.86 / 4.62 | 0.12 | 0.21 | 31 % | 86 % | 0.23 |
| 05-branch | 2.63 / 8.19 | 0.15 | 0.40 | 24 % | 80 % | 0.14 |
| 06-blame | 0.94 / 1.75 | 0.10 | 0.13 | 59 % | 3 % | 0.26 |

## Weakest scenes (big motion against their music)

06-blame (1.75 @ drums 0.26), 04-feature (4.62 @ drums 0.23), 05-branch (8.19 @ drums 0.14)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (4 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

25.75, 26.21, 26.21, 28.54
