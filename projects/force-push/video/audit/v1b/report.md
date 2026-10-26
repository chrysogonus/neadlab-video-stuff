# Audit: force-push — force-push.mp4

209.6 s from track 0.00; 100 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.31 | 0.37 | 1.17 | **below** |
| big-motion moments (90th percentile) | 0.74 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 61 % | 63 % | 86 % | **below** |
| seconds whose composition changes > 0.10 | 17 % | 19 % | 35 % | **below** |
| hard cuts per minute | 28.62 | 8.07 | 48.46 |  |
| share of the frame that is true black | 69 % | 20 % | 44 % | **above** |
| mid-tone seconds (luma 0.15–0.5) | 9 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 17 % | 20 % | 9 % |  |
| detail (edge density) | 0.05 | 0.07 | 0.09 | **below** |
| accent area (median) | 2 % | 3 % | 3 % | **below** |
| seconds with no accent colour | 44 % | 23 % | 26 % | **above** |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| 01-status | 0.13 / 0.35 | 1.07 | 0.05 | 32 | 84 % | 35 % | 0.00 |
| 02-commit | 0.15 / 0.75 | 1.36 | 0.06 | 35 | 86 % | 83 % | 0.17 |
| 03-stash | 0.32 / 1.03 | 2.37 | 0.09 | 92 | 86 % | 62 % | 0.28 |
| 04-feature | 0.21 / 1.00 | 1.73 | 0.08 | 71 | 86 % | 62 % | 0.23 |
| 05-branch | 0.16 / 0.34 | 1.54 | 0.07 | 28 | 88 % | 61 % | 0.14 |
| 06-blame | 0.21 / 1.31 | 2.02 | 0.09 | 42 | 85 % | 52 % | 0.26 |
| 07-merge | 0.38 / 0.66 | 2.11 | 0.83 | 219 | 0 % | 1 % | 0.36 |
| 08-patches | 0.39 / 1.22 | 2.83 | 0.08 | 31 | 88 % | 69 % | 0.08 |
| 09-stop | 0.46 / 1.23 | 4.44 | 0.07 | 27 | 90 % | 23 % | 0.00 |
| 10-force | 0.59 / 3.51 | 4.35 | 0.17 | 130 | 59 % | 100 % | 0.30 |
| 11-rewrote | 0.28 / 1.63 | 2.29 | 0.08 | 31 | 84 % | 96 % | 0.49 |
| 12-lies | 0.59 / 2.45 | 3.84 | 0.12 | 114 | 64 % | 99 % | 0.41 |
| 13-timeline | 0.21 / 0.73 | 1.30 | 0.08 | 53 | 85 % | 96 % | 0.45 |
| 14-local | 0.23 / 1.85 | 2.03 | 0.08 | 40 | 84 % | 86 % | 0.44 |
| 15-origin | 0.47 / 1.66 | 2.99 | 0.80 | 219 | 2 % | 0 % | 0.46 |
| 16-chant | 0.48 / 3.74 | 3.99 | 0.09 | 42 | 75 % | 56 % | 0.24 |
| 17-squash | 0.74 / 2.42 | 3.58 | 0.08 | 49 | 76 % | 76 % | 0.23 |
| 18-message | 0.37 / 0.89 | 1.93 | 0.84 | 219 | 1 % | 0 % | 0.02 |
| 19-cherry | 0.35 / 1.13 | 2.19 | 0.08 | 47 | 70 % | 99 % | 0.45 |
| 20-phone | 0.42 / 0.87 | 2.50 | 0.07 | 45 | 73 % | 52 % | 0.10 |
| 21-ignore | 0.32 / 1.17 | 2.31 | 0.07 | 40 | 81 % | 63 % | 0.03 |
| 22-revert | 0.38 / 1.94 | 2.71 | 0.08 | 51 | 86 % | 68 % | 0.25 |
| 23-force2 | 0.62 / 4.14 | 4.00 | 0.17 | 124 | 59 % | 99 % | 0.39 |
| 24-rewrote2 | 0.36 / 2.03 | 3.03 | 0.08 | 38 | 83 % | 98 % | 0.50 |
| 25-lies2 | 0.61 / 2.81 | 3.91 | 0.13 | 112 | 64 % | 99 % | 0.51 |
| 26-timeline2 | 0.28 / 1.01 | 2.03 | 0.09 | 66 | 81 % | 99 % | 0.53 |
| 27-local2 | 0.26 / 1.82 | 2.25 | 0.08 | 43 | 84 % | 84 % | 0.52 |
| 28-origin2 | 0.47 / 1.74 | 2.74 | 0.80 | 219 | 2 % | 0 % | 0.52 |
| 29-chant2 | 0.47 / 4.20 | 3.38 | 0.09 | 51 | 72 % | 62 % | 0.28 |
| 30-shared | 0.31 / 0.51 | 1.35 | 0.86 | 219 | 0 % | 0 % | 0.00 |
| 31-checkout | 0.46 / 1.56 | 2.79 | 0.81 | 219 | 17 % | 25 % | 0.00 |
| 32-acappella | 0.12 / 0.28 | 1.03 | 0.05 | 27 | 95 % | 0 % | 0.11 |
| 33-drop | 0.77 / 5.43 | 5.09 | 0.14 | 118 | 49 % | 77 % | 0.54 |
| 34-dropmine | 0.47 / 2.63 | 3.35 | 0.11 | 108 | 70 % | 77 % | 0.58 |
| 35-chant3 | 0.55 / 5.52 | 4.50 | 0.09 | 60 | 71 % | 58 % | 0.33 |
| 36-reflog | 0.19 / 0.83 | 1.36 | 0.07 | 48 | 86 % | 55 % | 0.00 |
| 37-end (part) | 0.16 / 1.11 | 1.83 | 0.11 | 50 | 76 % | 36 % | 0.20 |

## Weakest scenes (big motion against their music)

32-acappella (0.28 @ drums 0.11), 05-branch (0.34 @ drums 0.14), 13-timeline (0.73 @ drums 0.45), 07-merge (0.66 @ drums 0.36), 01-status (0.35 @ drums 0.00), 26-timeline2 (1.01 @ drums 0.53), 19-cherry (1.13 @ drums 0.45), 02-commit (0.75 @ drums 0.17), 30-shared (0.51 @ drums 0.00), 03-stash (1.03 @ drums 0.28)

## Still runs (guideline motion < 1.5 for more than 2 s)

1.6–4.8, 161.8–164.1, 166.0–169.0

## Unseen hits (54 of the 424 strong onsets and downbeats this video can judge (of 425 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

2.06, 3.93, 5.79, 7.65, 9.5, 11.36, 20.18, 23.9, 31.77, 31.77, 39.64, 46.61, 50.28, 50.31, 52.15, 64.13, 68.73, 68.75, 81.64, 85.33, 85.33, 88.56, 90.87, 101.88, 101.91, 105.56, 105.59, 124.88, 142.32, 146.01, 147.86, 149.7, 151.54, 153.37, 155.22, 159.79, 160.25, 160.99, 161.17, 161.45, 162.12, 162.55, 162.98, 163.89, 164.35, 164.82, 165.72, 166.19, 166.64, 167.56, 168.04, 190.06, 193.79, 208.35
