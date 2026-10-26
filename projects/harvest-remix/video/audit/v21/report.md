# Audit: harvest-remix — harvest-remix.mp4

164.4 s from track 0.00; 104 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 1.90 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 6.79 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 90 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 44 % | 19 % | 35 % |  |
| hard cuts per minute | 37.96 | 8.07 | 48.46 |  |
| share of the frame that is true black | 37 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 48 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 19 % | 20 % | 9 % |  |
| detail (edge density) | 0.08 | 0.07 | 0.09 |  |
| accent area (median) | 5 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 19 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| seal | 2.27 / 6.27 | 11.18 | 0.23 | 208 | 55 % | 100 % | 0.04 |
| sent | 0.50 / 4.81 | 2.58 | 0.60 | 202 | 28 % | 68 % | 0.04 |
| intercept | 1.77 / 4.27 | 9.98 | 0.14 | 122 | 55 % | 99 % | 0.05 |
| keep | 1.12 / 10.40 | 6.01 | 0.13 | 85 | 49 % | 84 % | 0.09 |
| wait | 1.97 / 8.98 | 9.44 | 0.24 | 215 | 43 % | 56 % | 0.33 |
| watch | 5.19 / 15.28 | 19.93 | 0.12 | 71 | 40 % | 49 % | 0.26 |
| hook | 2.48 / 7.78 | 11.53 | 0.16 | 106 | 43 % | 100 % | 0.12 |
| harvest | 10.60 / 20.93 | 23.64 | 0.17 | 96 | 19 % | 96 % | 0.50 |
| qubits | 2.40 / 6.19 | 9.69 | 0.12 | 76 | 40 % | 79 % | 0.34 |
| later | 1.78 / 9.64 | 12.08 | 0.34 | 217 | 33 % | 39 % | 0.36 |
| mine | 3.77 / 11.96 | 13.85 | 0.16 | 107 | 37 % | 98 % | 0.31 |
| dark | 1.10 / 5.51 | 7.19 | 0.39 | 219 | 41 % | 33 % | 0.17 |
| ticket | 0.92 / 2.18 | 6.11 | 0.89 | 229 | 0 % | 33 % | 0.47 |
| petabytes | 2.85 / 11.53 | 11.89 | 0.20 | 120 | 19 % | 100 % | 0.66 |
| key | 2.52 / 4.72 | 6.92 | 0.27 | 193 | 40 % | 100 % | 0.07 |
| fridge | 2.63 / 15.73 | 12.60 | 0.19 | 139 | 58 % | 51 % | 0.07 |
| reading | 0.52 / 2.07 | 3.54 | 0.80 | 211 | 18 % | 100 % | 0.05 |
| now | 2.21 / 3.14 | 7.40 | 0.10 | 80 | 74 % | 96 % | 0.04 |
| breach | 2.52 / 6.10 | 19.41 | 0.15 | 124 | 44 % | 100 % | 0.65 |
| library | 1.09 / 3.79 | 5.97 | 0.12 | 123 | 62 % | 97 % | 0.64 |
| secure | 0.50 / 6.99 | 2.92 | 0.50 | 217 | 34 % | 64 % | 0.02 |

## Weakest scenes (big motion against their music)

ticket (2.18 @ drums 0.47), library (3.79 @ drums 0.64), reading (2.07 @ drums 0.05), breach (6.10 @ drums 0.65), now (3.14 @ drums 0.04), qubits (6.19 @ drums 0.34), dark (5.51 @ drums 0.17), petabytes (11.53 @ drums 0.66), intercept (4.27 @ drums 0.05), key (4.72 @ drums 0.07)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (85 of the 312 strong onsets and downbeats this video can judge (of 312 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

0.5, 11.64, 15.34, 19.03, 20.88, 22.74, 28.29, 30.12, 31.98, 41.85, 45.53, 48.97, 49.43, 49.87, 50.79, 50.79, 51.26, 51.72, 52.62, 52.64, 53.09, 53.55, 54.92, 56.31, 56.75, 58.14, 60.41, 61.81, 63.17, 63.85, 64.31, 64.54, 64.99, 65.0, 65.7, 66.14, 66.37, 67.97, 68.2, 68.66, 69.0, 69.36, 69.81, 70.26, 73.46, 76.33, 76.68, 76.91, 79.64, 79.66, 88.32, 91.77, 97.46, 100.67, 107.05, 107.06, 107.08, 114.35, 114.35, 114.81, 115.25, 118.24, 118.93, 122.72, 122.87, 123.33, 129.6, 130.06, 132.56, 138.02, 139.89, 143.79, 146.81, 147.72, 147.74, 148.2, 156.4, 156.4, 156.85, 156.87, 157.31, 158.23, 158.54, 159.91, 161.87
