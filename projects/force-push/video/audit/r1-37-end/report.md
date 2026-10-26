# Audit: force-push — proof-191.895-209.64.mp4

17.8 s from track 191.90; 5 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.65 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 1.52 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 75 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 12 % | 19 % | 35 % | **below** |
| hard cuts per minute | 16.90 | 8.07 | 48.46 |  |
| share of the frame that is true black | 14 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 47 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.06 | 0.07 | 0.09 | **below** |
| accent area (median) | 6 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 35 % | 23 % | 26 % | **above** |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| 36-reflog | 0.78 / 2.10 | 5.29 | 0.11 | 62 | 24 % | 61 % | 0.00 |
| 37-end | 0.44 / 5.65 | 4.06 | 0.18 | 110 | 24 % | 70 % | 0.20 |

## Weakest scenes (big motion against their music)

36-reflog (2.10 @ drums 0.00), 37-end (5.65 @ drums 0.20)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (5 of the 36 strong onsets and downbeats this video can judge (of 425 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

193.79, 195.61, 203.83, 204.28, 204.29
