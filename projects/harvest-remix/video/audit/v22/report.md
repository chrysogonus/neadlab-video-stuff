# Audit: harvest-remix — harvest-remix.mp4

164.4 s from track 0.00; 82 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 2.04 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 6.85 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 91 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 45 % | 19 % | 35 % |  |
| hard cuts per minute | 29.93 | 8.07 | 48.46 |  |
| share of the frame that is true black | 37 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 52 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 18 % | 20 % | 9 % |  |
| detail (edge density) | 0.09 | 0.07 | 0.09 |  |
| accent area (median) | 5 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 21 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| seal | 1.32 / 4.25 | 3.92 | 0.19 | 205 | 61 % | 100 % | 0.04 |
| sent | 0.53 / 4.98 | 2.68 | 0.59 | 202 | 28 % | 67 % | 0.04 |
| intercept | 1.43 / 5.65 | 7.49 | 0.12 | 100 | 60 % | 99 % | 0.05 |
| keep | 0.99 / 9.66 | 5.49 | 0.14 | 89 | 54 % | 81 % | 0.09 |
| wait | 1.74 / 8.74 | 6.74 | 0.22 | 215 | 50 % | 34 % | 0.33 |
| watch | 1.28 / 3.73 | 5.67 | 0.08 | 50 | 58 % | 27 % | 0.26 |
| hook | 0.88 / 3.52 | 5.47 | 0.15 | 216 | 58 % | 83 % | 0.12 |
| harvest | 12.46 / 23.91 | 34.09 | 0.21 | 136 | 20 % | 96 % | 0.50 |
| qubits | 2.62 / 7.39 | 11.24 | 0.13 | 88 | 41 % | 90 % | 0.34 |
| later | 1.52 / 9.29 | 11.63 | 0.33 | 216 | 33 % | 36 % | 0.36 |
| mine | 3.79 / 10.91 | 13.52 | 0.15 | 106 | 39 % | 98 % | 0.31 |
| dark | 0.51 / 4.75 | 1.96 | 0.36 | 219 | 46 % | 45 % | 0.17 |
| ticket | 1.81 / 6.06 | 9.47 | 0.87 | 233 | 0 % | 28 % | 0.47 |
| petabytes | 2.83 / 10.78 | 11.84 | 0.19 | 112 | 19 % | 100 % | 0.66 |
| key | 2.29 / 4.66 | 4.96 | 0.24 | 193 | 50 % | 99 % | 0.07 |
| fridge | 2.60 / 15.67 | 12.37 | 0.19 | 138 | 59 % | 50 % | 0.07 |
| reading | 0.51 / 2.09 | 2.70 | 0.80 | 211 | 17 % | 100 % | 0.05 |
| now | 1.92 / 4.69 | 6.19 | 0.10 | 84 | 73 % | 96 % | 0.04 |
| breach | 5.12 / 12.59 | 32.58 | 0.30 | 206 | 27 % | 100 % | 0.65 |
| library | 4.01 / 9.98 | 18.22 | 0.16 | 94 | 22 % | 97 % | 0.64 |
| secure | 0.26 / 3.40 | 1.85 | 0.29 | 208 | 60 % | 64 % | 0.02 |

## Weakest scenes (big motion against their music)

reading (2.09 @ drums 0.05), watch (3.73 @ drums 0.26), ticket (6.06 @ drums 0.47), hook (3.52 @ drums 0.12), dark (4.75 @ drums 0.17), secure (3.40 @ drums 0.02), library (9.98 @ drums 0.64), petabytes (10.78 @ drums 0.66), qubits (7.39 @ drums 0.34), seal (4.25 @ drums 0.04)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (43 of the 312 strong onsets and downbeats this video can judge (of 312 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

11.64, 15.34, 19.03, 20.88, 28.29, 30.12, 31.98, 33.13, 41.85, 43.7, 45.28, 58.14, 60.41, 68.66, 76.33, 76.68, 76.91, 77.14, 77.38, 77.6, 78.52, 79.64, 79.66, 80.0, 80.35, 88.32, 91.77, 100.67, 110.69, 110.7, 112.97, 113.9, 118.24, 118.93, 122.72, 122.87, 123.33, 129.6, 130.06, 132.56, 138.02, 139.89, 150.02
