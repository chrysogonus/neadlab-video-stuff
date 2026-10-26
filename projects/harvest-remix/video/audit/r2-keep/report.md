# Audit: harvest-remix — proof-16.06-34.5.mp4

18.4 s from track 16.06; 7 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 1.10 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 4.23 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 94 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 41 % | 19 % | 35 % |  |
| hard cuts per minute | 22.76 | 8.07 | 48.46 |  |
| share of the frame that is true black | 58 % | 20 % | 44 % | **above** |
| mid-tone seconds (luma 0.15–0.5) | 28 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.06 | 0.07 | 0.09 | **below** |
| accent area (median) | 4 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 11 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| intercept | 1.36 / 5.35 | 7.22 | 0.12 | 98 | 60 % | 99 % | 0.05 |
| keep | 1.02 / 9.90 | 5.20 | 0.14 | 98 | 54 % | 81 % | 0.09 |
| wait (part) | 0.65 / 2.29 | 3.74 | 0.22 | 218 | 65 % | 0 % | 0.39 |

## Weakest scenes (big motion against their music)

wait (2.29 @ drums 0.39), intercept (5.35 @ drums 0.05), keep (9.90 @ drums 0.09)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (5 of the 18 strong onsets and downbeats this video can judge (of 312 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

19.03, 20.88, 28.29, 30.12, 31.98
