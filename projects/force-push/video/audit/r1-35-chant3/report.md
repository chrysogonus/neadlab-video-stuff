# Audit: force-push — proof-177.15-192.395.mp4

15.2 s from track 177.15; 30 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 1.05 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 1.46 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 86 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 43 % | 19 % | 35 % |  |
| hard cuts per minute | 118.03 | 8.07 | 48.46 | **above** |
| share of the frame that is true black | 23 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 60 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.05 | 0.07 | 0.09 | **below** |
| accent area (median) | 13 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 20 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| 34-dropmine | 0.79 / 7.22 | 4.44 | 0.17 | 118 | 26 % | 79 % | 0.58 |
| 35-chant3 | 1.02 / 9.49 | 7.05 | 0.14 | 81 | 23 % | 98 % | 0.33 |
| 36-reflog (part) | 0.05 / 0.29 | 0.74 | 0.04 | 27 | 96 % | 3 % | 0.00 |

## Weakest scenes (big motion against their music)

36-reflog (0.29 @ drums 0.00), 34-dropmine (7.22 @ drums 0.58), 35-chant3 (9.49 @ drums 0.33)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (1 of the 38 strong onsets and downbeats this video can judge (of 425 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

190.06
