# Audit: force-push — proof-169.27-184.53.mp4

15.3 s from track 169.27; 13 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 1.16 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 2.59 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 86 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 50 % | 19 % | 35 % |  |
| hard cuts per minute | 51.09 | 8.07 | 48.46 | **above** |
| share of the frame that is true black | 22 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 80 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 7 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.06 | 0.07 | 0.09 | **below** |
| accent area (median) | 22 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 27 % | 23 % | 26 % | **above** |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| 33-drop | 1.40 / 12.59 | 9.72 | 0.23 | 215 | 30 % | 73 % | 0.54 |
| 34-dropmine | 0.82 / 7.20 | 5.02 | 0.17 | 118 | 26 % | 80 % | 0.58 |

## Weakest scenes (big motion against their music)

34-dropmine (7.20 @ drums 0.58), 33-drop (12.59 @ drums 0.54)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (0 of the 43 strong onsets and downbeats this video can judge (of 425 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

none
