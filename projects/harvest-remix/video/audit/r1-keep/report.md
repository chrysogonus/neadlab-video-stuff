# Audit: harvest-remix — proof-7.96-34.81.mp4

26.9 s from track 7.96; 9 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 1.09 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 4.16 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 96 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 36 % | 19 % | 35 % |  |
| hard cuts per minute | 20.11 | 8.07 | 48.46 |  |
| share of the frame that is true black | 47 % | 20 % | 44 % | **above** |
| mid-tone seconds (luma 0.15–0.5) | 27 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 15 % | 20 % | 9 % |  |
| detail (edge density) | 0.06 | 0.07 | 0.09 | **below** |
| accent area (median) | 4 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 15 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| sent | 0.58 / 5.01 | 2.83 | 0.60 | 201 | 28 % | 67 % | 0.04 |
| intercept | 1.38 / 6.85 | 7.58 | 0.12 | 108 | 59 % | 99 % | 0.05 |
| keep | 0.94 / 9.65 | 4.70 | 0.13 | 87 | 54 % | 81 % | 0.09 |
| wait (part) | 0.66 / 2.41 | 3.82 | 0.22 | 216 | 65 % | 0 % | 0.44 |

## Weakest scenes (big motion against their music)

wait (2.41 @ drums 0.44), sent (5.01 @ drums 0.04), intercept (6.85 @ drums 0.05), keep (9.65 @ drums 0.09)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (9 of the 23 strong onsets and downbeats this video can judge (of 312 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

11.64, 15.34, 19.03, 20.88, 28.29, 30.12, 31.98, 32.44, 33.69
