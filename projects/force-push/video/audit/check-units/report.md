# Audit: force-push — proof-136.79-152.18.mp4

15.4 s from track 136.79; 20 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.95 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 1.88 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 86 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 36 % | 19 % | 35 % |  |
| hard cuts per minute | 77.92 | 8.07 | 48.46 | **above** |
| share of the frame that is true black | 10 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 13 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 53 % | 20 % | 9 % |  |
| detail (edge density) | 0.08 | 0.07 | 0.09 |  |
| accent area (median) | 2 % | 3 % | 3 % | **below** |
| seconds with no accent colour | 20 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| 29-chant2 | 1.39 / 5.64 | 8.20 | 0.14 | 86 | 27 % | 99 % | 0.28 |
| 30-shared | 0.63 / 1.92 | 4.97 | 0.81 | 218 | 0 % | 61 % | 0.00 |
| 31-checkout (part) | 1.09 / 3.99 | 6.19 | 0.83 | 218 | 0 % | 3 % | 0.00 |

## Weakest scenes (big motion against their music)

30-shared (1.92 @ drums 0.00), 29-chant2 (5.64 @ drums 0.28), 31-checkout (3.99 @ drums 0.00)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (3 of the 19 strong onsets and downbeats this video can judge (of 425 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

142.32, 147.86, 149.7
