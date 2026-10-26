# Audit: force-push — proof-19.885-28.07.mp4

8.2 s from track 19.89; 1 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.63 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 2.17 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 86 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 0 % | 19 % | 35 % | **below** |
| hard cuts per minute | 7.32 | 8.07 | 48.46 | **below** |
| share of the frame that is true black | 31 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 0 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.04 | 0.07 | 0.09 | **below** |
| accent area (median) | 2 % | 3 % | 3 % | **below** |
| seconds with no accent colour | 38 % | 23 % | 26 % | **above** |

## Scenes

| scene | motion p50 / p90 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|
| 03-stash | 0.64 / 4.48 | 0.11 | 0.25 | 33 % | 83 % | 0.28 |
| 04-feature | 0.85 / 4.70 | 0.12 | 0.21 | 31 % | 86 % | 0.23 |
| 05-branch | 0.14 / 0.27 | 0.04 | 0.04 | 95 % | 0 % | 0.14 |

## Weakest scenes (big motion against their music)

05-branch (0.27 @ drums 0.14), 03-stash (4.48 @ drums 0.28), 04-feature (4.70 @ drums 0.23)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (3 of 425 strong onsets and downbeats change nothing visible within ±2 frames)

23.9, 26.21, 26.21
