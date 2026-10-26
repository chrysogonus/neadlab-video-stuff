# Audit: harvest-remix — proof-143.604-160.058.mp4

16.5 s from track 143.60; 10 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 4.77 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 7.57 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 100 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 80 % | 19 % | 35 % |  |
| hard cuts per minute | 36.44 | 8.07 | 48.46 |  |
| share of the frame that is true black | 31 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 69 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 6 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.16 | 0.07 | 0.09 |  |
| accent area (median) | 6 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 0 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| now | 2.04 / 4.70 | 7.14 | 0.10 | 82 | 73 % | 96 % | 0.04 |
| breach | 5.12 / 12.48 | 32.69 | 0.30 | 207 | 27 % | 100 % | 0.65 |
| library | 4.07 / 9.86 | 18.25 | 0.16 | 86 | 19 % | 99 % | 0.64 |

## Weakest scenes (big motion against their music)

library (9.86 @ drums 0.64), breach (12.48 @ drums 0.65), now (4.70 @ drums 0.04)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (3 of the 41 strong onsets and downbeats this video can judge (of 312 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

150.02, 153.2, 153.22
