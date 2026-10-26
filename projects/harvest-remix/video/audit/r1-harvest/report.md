# Audit: harvest-remix — proof-45.487-61.346.mp4

15.9 s from track 45.49; 6 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 12.85 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 15.96 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 100 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 93 % | 19 % | 35 % |  |
| hard cuts per minute | 22.69 | 8.07 | 48.46 |  |
| share of the frame that is true black | 25 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 60 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.13 | 0.07 | 0.09 |  |
| accent area (median) | 5 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 0 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| hook | 1.43 / 5.53 | 7.34 | 0.15 | 215 | 57 % | 83 % | 0.12 |
| harvest | 12.57 / 24.36 | 36.16 | 0.21 | 139 | 20 % | 96 % | 0.50 |

## Weakest scenes (big motion against their music)

hook (5.53 @ drums 0.12), harvest (24.36 @ drums 0.50)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (2 of the 38 strong onsets and downbeats this video can judge (of 312 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

58.14, 60.41
