# Audit: force-push — proof-63.679-72.435.mp4

8.8 s from track 63.68; 0 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.90 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 1.42 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 71 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 14 % | 19 % | 35 % | **below** |
| hard cuts per minute | 0.00 | 8.07 | 48.46 | **below** |
| share of the frame that is true black | 30 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 12 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.04 | 0.07 | 0.09 | **below** |
| accent area (median) | 9 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 0 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| 13-timeline | 1.00 / 5.12 | 5.23 | 0.11 | 64 | 43 % | 100 % | 0.45 |
| 14-local | 0.76 / 6.60 | 6.15 | 0.14 | 71 | 15 % | 89 % | 0.44 |

## Weakest scenes (big motion against their music)

13-timeline (5.12 @ drums 0.45), 14-local (6.60 @ drums 0.44)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (0 of the 20 strong onsets and downbeats this video can judge (of 425 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

none
