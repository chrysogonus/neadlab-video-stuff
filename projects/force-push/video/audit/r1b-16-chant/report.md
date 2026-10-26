# Audit: force-push — proof-72.435-83.984.mp4

11.6 s from track 72.44; 26 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.89 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 1.92 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 100 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 40 % | 19 % | 35 % |  |
| hard cuts per minute | 135.06 | 8.07 | 48.46 | **above** |
| share of the frame that is true black | 16 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 36 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 27 % | 20 % | 9 % |  |
| detail (edge density) | 0.06 | 0.07 | 0.09 | **below** |
| accent area (median) | 6 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 9 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| 15-origin | 1.07 / 7.96 | 7.01 | 0.79 | 218 | 1 % | 67 % | 0.46 |
| 16-chant | 1.05 / 3.81 | 7.52 | 0.13 | 87 | 31 % | 99 % | 0.24 |
| 17-squash (part) | 1.22 / 2.22 | 8.27 | 0.09 | 48 | 10 % | 3 % | 0.10 |

## Weakest scenes (big motion against their music)

17-squash (2.22 @ drums 0.10), 16-chant (3.81 @ drums 0.24), 15-origin (7.96 @ drums 0.46)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (1 of the 22 strong onsets and downbeats this video can judge (of 425 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

81.64
