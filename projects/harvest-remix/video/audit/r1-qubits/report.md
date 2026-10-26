# Audit: harvest-remix — proof-48.491-76.5.mp4

28.0 s from track 48.49; 13 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 3.73 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 14.07 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 96 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 56 % | 19 % | 35 % |  |
| hard cuts per minute | 27.84 | 8.07 | 48.46 |  |
| share of the frame that is true black | 32 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 46 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.10 | 0.07 | 0.09 |  |
| accent area (median) | 8 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 7 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| harvest | 10.61 / 20.80 | 24.02 | 0.17 | 96 | 19 % | 96 % | 0.50 |
| qubits | 2.66 / 7.21 | 11.66 | 0.13 | 88 | 41 % | 89 % | 0.34 |
| later (part) | 7.10 / 11.45 | 24.08 | 0.31 | 205 | 41 % | 10 % | 0.62 |

## Weakest scenes (big motion against their music)

qubits (7.21 @ drums 0.34), later (11.45 @ drums 0.62), harvest (20.80 @ drums 0.50)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (16 of the 71 strong onsets and downbeats this video can judge (of 312 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

49.43, 49.87, 50.79, 50.79, 51.26, 51.72, 52.62, 52.64, 53.09, 53.55, 54.92, 56.31, 56.75, 58.14, 60.41, 68.66
