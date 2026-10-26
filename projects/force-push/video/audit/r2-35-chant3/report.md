# Audit: force-push — proof-184.53-192.395.mp4

7.9 s from track 184.53; 27 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 1.42 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 2.52 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 100 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 50 % | 19 % | 35 % |  |
| hard cuts per minute | 205.93 | 8.07 | 48.46 | **above** |
| share of the frame that is true black | 19 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 57 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.08 | 0.07 | 0.09 |  |
| accent area (median) | 4 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 0 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| 35-chant3 | 1.44 / 12.14 | 11.15 | 0.15 | 89 | 22 % | 98 % | 0.33 |
| 36-reflog (part) | 0.61 / 0.86 | 3.43 | 0.08 | 42 | 28 % | 0 % | 0.00 |

## Weakest scenes (big motion against their music)

36-reflog (0.86 @ drums 0.00), 35-chant3 (12.14 @ drums 0.33)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (0 of the 14 strong onsets and downbeats this video can judge (of 425 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

none
