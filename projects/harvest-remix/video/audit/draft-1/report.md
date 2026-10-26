# Audit: harvest-remix — video.mp4

164.4 s from track 0.00; 76 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 1.85 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 6.84 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 88 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 47 % | 19 % | 35 % |  |
| hard cuts per minute | 27.74 | 8.07 | 48.46 |  |
| share of the frame that is true black | 37 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 53 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 18 % | 20 % | 9 % |  |
| detail (edge density) | 0.09 | 0.07 | 0.09 |  |
| accent area (median) | 5 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 20 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| seal | 0.65 / 4.26 | 3.80 | 0.19 | 205 | 60 % | 100 % | 0.04 |
| sent | 0.58 / 4.98 | 2.75 | 0.60 | 202 | 28 % | 67 % | 0.04 |
| intercept | 1.42 / 6.88 | 7.68 | 0.12 | 106 | 59 % | 99 % | 0.05 |
| keep | 0.95 / 9.71 | 4.74 | 0.13 | 82 | 54 % | 80 % | 0.09 |
| wait | 1.80 / 8.59 | 6.73 | 0.22 | 215 | 50 % | 34 % | 0.33 |
| watch | 1.75 / 4.61 | 7.60 | 0.09 | 59 | 50 % | 27 % | 0.26 |
| hook | 0.81 / 3.52 | 5.51 | 0.15 | 216 | 58 % | 82 % | 0.12 |
| harvest | 12.66 / 24.26 | 34.28 | 0.21 | 136 | 19 % | 96 % | 0.50 |
| qubits | 2.63 / 7.39 | 11.24 | 0.13 | 88 | 41 % | 90 % | 0.34 |
| later | 1.55 / 9.10 | 11.63 | 0.33 | 215 | 33 % | 36 % | 0.36 |
| mine | 3.73 / 11.74 | 13.63 | 0.16 | 107 | 38 % | 98 % | 0.31 |
| dark | 0.41 / 4.76 | 1.94 | 0.36 | 218 | 46 % | 46 % | 0.17 |
| ticket | 1.48 / 3.97 | 7.83 | 0.89 | 230 | 0 % | 27 % | 0.47 |
| petabytes | 2.81 / 10.76 | 11.96 | 0.19 | 114 | 19 % | 100 % | 0.66 |
| key | 2.29 / 4.61 | 4.83 | 0.24 | 193 | 50 % | 99 % | 0.07 |
| fridge | 2.60 / 15.76 | 12.33 | 0.19 | 139 | 59 % | 50 % | 0.07 |
| reading | 0.53 / 2.14 | 2.75 | 0.79 | 211 | 17 % | 100 % | 0.05 |
| now | 1.94 / 4.74 | 6.19 | 0.10 | 84 | 73 % | 96 % | 0.04 |
| breach | 4.12 / 9.98 | 23.74 | 0.30 | 207 | 31 % | 100 % | 0.65 |
| library | 3.08 / 8.30 | 14.45 | 0.17 | 118 | 31 % | 99 % | 0.64 |
| secure | 0.26 / 3.38 | 1.86 | 0.30 | 208 | 60 % | 64 % | 0.02 |

## Weakest scenes (big motion against their music)

ticket (3.97 @ drums 0.47), reading (2.14 @ drums 0.05), watch (4.61 @ drums 0.26), hook (3.52 @ drums 0.12), library (8.30 @ drums 0.64), dark (4.76 @ drums 0.17), secure (3.38 @ drums 0.02), breach (9.98 @ drums 0.65), petabytes (10.76 @ drums 0.66), qubits (7.39 @ drums 0.34)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (53 of the 312 strong onsets and downbeats this video can judge (of 312 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

11.64, 15.34, 19.03, 20.88, 28.29, 30.12, 31.98, 33.13, 40.47, 41.85, 43.7, 45.28, 58.14, 60.41, 68.66, 76.33, 76.68, 76.91, 77.14, 77.38, 77.6, 78.52, 79.64, 79.66, 80.0, 80.35, 88.32, 91.77, 97.46, 103.41, 107.51, 107.52, 110.69, 110.7, 112.97, 118.24, 118.93, 122.72, 122.87, 123.33, 129.6, 130.06, 132.56, 136.2, 138.02, 139.89, 143.79, 149.57, 153.2, 153.22, 153.66, 155.49, 158.54
