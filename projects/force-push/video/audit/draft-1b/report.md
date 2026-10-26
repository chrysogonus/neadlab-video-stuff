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
| 01-status | 0.55 / 1.54 | 2.55 | 0.14 | 80 | 23 % | 88 % | 0.00 |
| 02-commit | 0.57 / 4.78 | 3.59 | 0.12 | 52 | 29 % | 84 % | 0.17 |
| 03-stash | 0.63 / 4.40 | 3.54 | 0.11 | 47 | 33 % | 83 % | 0.28 |
| 04-feature | 0.86 / 4.59 | 5.90 | 0.12 | 52 | 32 % | 86 % | 0.23 |
| 05-branch | 2.55 / 7.90 | 13.63 | 0.16 | 111 | 24 % | 80 % | 0.14 |
| 06-blame | 0.78 / 4.29 | 5.55 | 0.11 | 54 | 53 % | 81 % | 0.26 |
| 07-merge | 0.54 / 3.60 | 3.98 | 0.79 | 218 | 0 % | 83 % | 0.36 |
| 08-patches | 1.31 / 3.48 | 9.12 | 0.10 | 64 | 43 % | 71 % | 0.08 |
| 09-stop | 0.89 / 3.08 | 3.91 | 0.10 | 42 | 33 % | 99 % | 0.00 |
| 10-force | 0.95 / 14.48 | 5.31 | 0.21 | 194 | 28 % | 99 % | 0.30 |
| 11-rewrote | 0.71 / 4.99 | 6.29 | 0.11 | 56 | 47 % | 95 % | 0.49 |
| 12-lies | 1.17 / 6.67 | 6.77 | 0.17 | 116 | 15 % | 99 % | 0.41 |
| 13-timeline | 0.54 / 3.15 | 3.01 | 0.11 | 70 | 46 % | 96 % | 0.45 |
| 14-local | 0.65 / 6.33 | 4.81 | 0.13 | 61 | 16 % | 84 % | 0.44 |
| 15-origin | 1.03 / 8.01 | 6.86 | 0.79 | 218 | 1 % | 68 % | 0.46 |
| 16-chant | 1.03 / 3.65 | 8.15 | 0.13 | 82 | 31 % | 99 % | 0.24 |
| 17-squash | 0.83 / 4.32 | 4.35 | 0.13 | 62 | 14 % | 80 % | 0.23 |
| 18-message | 1.13 / 10.98 | 6.84 | 0.77 | 218 | 3 % | 58 % | 0.02 |
| 19-cherry | 1.00 / 4.65 | 5.56 | 0.10 | 61 | 42 % | 99 % | 0.45 |
| 20-phone | 0.90 / 4.86 | 5.37 | 0.12 | 59 | 21 % | 83 % | 0.10 |
| 21-ignore | 1.16 / 4.55 | 9.08 | 0.12 | 69 | 33 % | 97 % | 0.03 |
| 22-revert | 0.93 / 4.75 | 8.30 | 0.11 | 58 | 36 % | 70 % | 0.25 |
| 23-force2 | 1.42 / 17.30 | 7.47 | 0.18 | 118 | 15 % | 99 % | 0.39 |
| 24-rewrote2 | 1.18 / 7.48 | 9.18 | 0.12 | 70 | 43 % | 99 % | 0.50 |
| 25-lies2 | 1.85 / 14.52 | 9.62 | 0.16 | 116 | 30 % | 97 % | 0.51 |
| 26-timeline2 | 0.98 / 4.18 | 5.99 | 0.12 | 97 | 35 % | 100 % | 0.53 |
| 27-local2 | 0.66 / 6.39 | 5.80 | 0.11 | 61 | 42 % | 82 % | 0.52 |
| 28-origin2 | 0.92 / 11.81 | 6.04 | 0.78 | 218 | 1 % | 39 % | 0.52 |
| 29-chant2 | 1.38 / 5.93 | 9.14 | 0.14 | 84 | 27 % | 99 % | 0.28 |
| 30-shared | 0.62 / 1.75 | 4.95 | 0.81 | 218 | 0 % | 61 % | 0.00 |
| 31-checkout | 1.03 / 4.00 | 6.21 | 0.78 | 216 | 18 % | 38 % | 0.00 |
| 32-acappella | 0.40 / 2.72 | 4.10 | 0.08 | 44 | 56 % | 66 % | 0.11 |
| 33-drop | 1.30 / 12.07 | 8.04 | 0.23 | 217 | 31 % | 74 % | 0.54 |
| 34-dropmine | 0.78 / 7.10 | 4.49 | 0.17 | 118 | 26 % | 79 % | 0.58 |
| 35-chant3 | 1.01 / 9.32 | 6.78 | 0.14 | 81 | 23 % | 98 % | 0.33 |
| 36-reflog | 0.76 / 2.13 | 5.35 | 0.11 | 52 | 24 % | 61 % | 0.00 |
| 37-end | 0.47 / 5.71 | 4.16 | 0.17 | 119 | 24 % | 70 % | 0.20 |

## Weakest scenes (big motion against their music)

13-timeline (3.15 @ drums 0.45), 26-timeline2 (4.18 @ drums 0.53), 01-status (1.54 @ drums 0.00), 07-merge (3.60 @ drums 0.36), 30-shared (1.75 @ drums 0.00), 19-cherry (4.65 @ drums 0.45), 11-rewrote (4.99 @ drums 0.49), 32-acappella (2.72 @ drums 0.11), 16-chant (3.65 @ drums 0.24), 36-reflog (2.13 @ drums 0.00)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (29 of the 424 strong onsets and downbeats this video can judge (of 425 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

23.9, 26.21, 26.21, 28.54, 46.61, 50.28, 50.31, 52.15, 81.64, 92.24, 92.69, 92.71, 93.17, 94.09, 98.22, 98.23, 98.67, 99.13, 99.59, 101.88, 101.91, 122.59, 135.44, 142.32, 147.86, 149.7, 153.37, 190.06, 193.79
