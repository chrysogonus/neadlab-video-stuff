# Audit: force-push — proof-0-28.1.mp4

28.1 s from track 0.00; 10 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.57 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 1.74 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 70 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 4 % | 19 % | 35 % | **below** |
| hard cuts per minute | 21.35 | 8.07 | 48.46 |  |
| share of the frame that is true black | 15 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 25 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.04 | 0.07 | 0.09 | **below** |
| accent area (median) | 6 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 21 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| 01-status | 0.56 / 1.55 | 2.55 | 0.14 | 80 | 23 % | 88 % | 0.00 |
| 02-commit | 0.55 / 5.42 | 3.84 | 0.12 | 53 | 26 % | 88 % | 0.17 |
| 03-stash | 0.66 / 5.16 | 4.42 | 0.12 | 43 | 31 % | 63 % | 0.28 |
| 04-feature | 1.35 / 5.62 | 7.81 | 0.12 | 52 | 25 % | 88 % | 0.23 |
| 05-branch (part) | 2.33 / 16.17 | 12.25 | 0.10 | 44 | 41 % | 100 % | 0.23 |

## Weakest scenes (big motion against their music)

01-status (1.55 @ drums 0.00), 03-stash (5.16 @ drums 0.28), 04-feature (5.62 @ drums 0.23), 02-commit (5.42 @ drums 0.17), 05-branch (16.17 @ drums 0.23)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (0 of the 36 strong onsets and downbeats this video can judge (of 425 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

none
