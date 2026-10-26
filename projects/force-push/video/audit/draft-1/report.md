# Audit: force-push — video.mp4

209.7 s from track 0.00; 155 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.93 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 2.03 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 80 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 26 % | 19 % | 35 % |  |
| hard cuts per minute | 44.36 | 8.07 | 48.46 |  |
| share of the frame that is true black | 22 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 27 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 16 % | 20 % | 9 % |  |
| detail (edge density) | 0.06 | 0.07 | 0.09 | **below** |
| accent area (median) | 4 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 19 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| 01-status | 0.55 / 1.56 | 2.54 | 0.14 | 80 | 23 % | 88 % | 0.00 |
| 02-commit | 0.57 / 4.94 | 3.98 | 0.12 | 53 | 29 % | 84 % | 0.17 |
| 03-stash | 0.63 / 4.64 | 3.47 | 0.11 | 46 | 33 % | 83 % | 0.28 |
| 04-feature | 0.87 / 4.73 | 5.51 | 0.12 | 46 | 32 % | 86 % | 0.23 |
| 05-branch | 2.57 / 8.44 | 14.21 | 0.16 | 112 | 24 % | 80 % | 0.14 |
| 06-blame | 0.79 / 4.35 | 5.38 | 0.11 | 54 | 53 % | 81 % | 0.26 |
| 07-merge | 0.55 / 3.68 | 3.94 | 0.79 | 218 | 0 % | 83 % | 0.36 |
| 08-patches | 1.31 / 3.86 | 9.03 | 0.10 | 68 | 43 % | 71 % | 0.08 |
| 09-stop | 0.93 / 3.14 | 4.27 | 0.10 | 45 | 33 % | 99 % | 0.00 |
| 10-force | 0.95 / 14.44 | 6.14 | 0.21 | 189 | 28 % | 99 % | 0.30 |
| 11-rewrote | 0.71 / 5.16 | 6.24 | 0.11 | 58 | 47 % | 95 % | 0.49 |
| 12-lies | 1.17 / 7.33 | 6.49 | 0.17 | 116 | 15 % | 99 % | 0.41 |
| 13-timeline | 0.54 / 3.36 | 3.15 | 0.11 | 70 | 46 % | 96 % | 0.45 |
| 14-local | 0.66 / 6.43 | 4.85 | 0.13 | 61 | 16 % | 84 % | 0.44 |
| 15-origin | 1.03 / 8.80 | 7.44 | 0.79 | 218 | 1 % | 68 % | 0.46 |
| 16-chant | 1.03 / 3.82 | 7.84 | 0.13 | 92 | 31 % | 99 % | 0.24 |
| 17-squash | 0.83 / 4.53 | 4.19 | 0.13 | 59 | 14 % | 80 % | 0.23 |
| 18-message | 1.13 / 10.95 | 7.56 | 0.77 | 218 | 3 % | 58 % | 0.02 |
| 19-cherry | 1.00 / 4.71 | 5.41 | 0.10 | 64 | 42 % | 99 % | 0.45 |
| 20-phone | 0.90 / 4.91 | 5.96 | 0.12 | 58 | 21 % | 83 % | 0.10 |
| 21-ignore | 1.17 / 4.57 | 7.92 | 0.12 | 56 | 33 % | 97 % | 0.03 |
| 22-revert | 0.93 / 4.99 | 8.39 | 0.11 | 61 | 36 % | 70 % | 0.25 |
| 23-force2 | 1.44 / 17.42 | 7.22 | 0.18 | 118 | 15 % | 99 % | 0.39 |
| 24-rewrote2 | 1.18 / 7.55 | 9.12 | 0.12 | 72 | 43 % | 99 % | 0.50 |
| 25-lies2 | 1.85 / 14.71 | 9.62 | 0.16 | 116 | 30 % | 97 % | 0.51 |
| 26-timeline2 | 0.98 / 4.26 | 5.97 | 0.12 | 97 | 35 % | 100 % | 0.53 |
| 27-local2 | 0.66 / 6.88 | 5.85 | 0.11 | 65 | 42 % | 82 % | 0.52 |
| 28-origin2 | 0.93 / 11.88 | 5.92 | 0.78 | 218 | 1 % | 39 % | 0.52 |
| 29-chant2 | 1.38 / 5.97 | 9.05 | 0.14 | 88 | 27 % | 99 % | 0.28 |
| 30-shared | 0.62 / 1.79 | 5.09 | 0.81 | 218 | 0 % | 61 % | 0.00 |
| 31-checkout | 1.03 / 4.03 | 6.23 | 0.78 | 216 | 18 % | 38 % | 0.00 |
| 32-acappella | 0.40 / 2.76 | 4.05 | 0.08 | 45 | 56 % | 66 % | 0.11 |
| 33-drop | 1.30 / 12.09 | 8.03 | 0.23 | 117 | 31 % | 74 % | 0.54 |
| 34-dropmine | 0.78 / 7.34 | 4.10 | 0.17 | 118 | 26 % | 79 % | 0.58 |
| 35-chant3 | 1.02 / 9.45 | 6.65 | 0.14 | 83 | 23 % | 98 % | 0.33 |
| 36-reflog | 0.77 / 2.13 | 5.35 | 0.11 | 60 | 24 % | 61 % | 0.00 |
| 37-end | 0.47 / 5.70 | 4.12 | 0.17 | 119 | 24 % | 70 % | 0.20 |

## Weakest scenes (big motion against their music)

13-timeline (3.36 @ drums 0.45), 26-timeline2 (4.26 @ drums 0.53), 01-status (1.56 @ drums 0.00), 07-merge (3.68 @ drums 0.36), 30-shared (1.79 @ drums 0.00), 19-cherry (4.71 @ drums 0.45), 11-rewrote (5.16 @ drums 0.49), 32-acappella (2.76 @ drums 0.11), 36-reflog (2.13 @ drums 0.00), 16-chant (3.82 @ drums 0.24)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (29 of the 424 strong onsets and downbeats this video can judge (of 425 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

23.9, 26.21, 26.21, 28.54, 46.61, 50.28, 50.31, 52.15, 81.64, 92.24, 92.69, 92.71, 93.17, 94.09, 98.22, 98.23, 98.67, 99.13, 99.59, 101.88, 101.91, 122.59, 135.44, 142.32, 147.86, 149.7, 153.37, 190.06, 193.79
