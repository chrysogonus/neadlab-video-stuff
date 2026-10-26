# Audit: force-push — proof-169.27-177.15.mp4

7.9 s from track 169.27; 8 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 1.70 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 3.76 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 100 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 17 % | 19 % | 35 % | **below** |
| hard cuts per minute | 60.89 | 8.07 | 48.46 | **above** |
| share of the frame that is true black | 57 % | 20 % | 44 % | **above** |
| mid-tone seconds (luma 0.15–0.5) | 0 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 14 % | 20 % | 9 % |  |
| detail (edge density) | 0.04 | 0.07 | 0.09 | **below** |
| accent area (median) | 10 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 0 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | accent light | layout vs previous | drums |
|---|---|---|---|---|---|---|---|---|---|
| 33-drop | 2.08 / 7.06 | 9.51 | 0.09 | 57 | 63 % | 99 % | 18.2 % |  | 0.54 |

Accent light: the share of the frame the accent lights, its halo included. Layout vs previous: how alike the scene's edge layout is to the scene before it (1 = the same; over 0.8 in bold, a repeated layout).

## Weakest scenes (big motion against their music)

33-drop (7.06 @ drums 0.54)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (5 of the 20 strong onsets and downbeats this video can judge (of 425 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

171.28, 171.72, 171.72, 172.17, 172.17
