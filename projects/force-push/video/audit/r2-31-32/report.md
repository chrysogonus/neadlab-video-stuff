# Audit: force-push — proof-151.68-170.3.mp4

18.6 s from track 151.68; 8 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.72 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 2.03 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 59 % | 63 % | 86 % | **below** |
| seconds whose composition changes > 0.10 | 29 % | 19 % | 35 % |  |
| hard cuts per minute | 25.76 | 8.07 | 48.46 |  |
| share of the frame that is true black | 27 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 6 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 39 % | 20 % | 9 % |  |
| detail (edge density) | 0.05 | 0.07 | 0.09 | **below** |
| accent area (median) | 2 % | 3 % | 3 % | **below** |
| seconds with no accent colour | 39 % | 23 % | 26 % | **above** |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| 31-checkout | 1.02 / 9.80 | 6.12 | 0.78 | 216 | 17 % | 37 % | 0.00 |
| 32-acappella | 0.48 / 2.94 | 4.86 | 0.09 | 49 | 43 % | 76 % | 0.11 |
| 33-drop (part) | 5.43 / 27.42 | 17.26 | 0.35 | 218 | 20 % | 94 % | 0.09 |

## Weakest scenes (big motion against their music)

32-acappella (2.94 @ drums 0.11), 31-checkout (9.80 @ drums 0.00), 33-drop (27.42 @ drums 0.09)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (1 of the 28 strong onsets and downbeats this video can judge (of 425 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

160.73
