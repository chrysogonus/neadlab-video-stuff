# Audit: force-push — proof-27.57-31.139.mp4

3.6 s from track 27.57; 0 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.72 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 1.53 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 100 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 0 % | 19 % | 35 % | **below** |
| hard cuts per minute | 0.00 | 8.07 | 48.46 | **below** |
| share of the frame that is true black | 55 % | 20 % | 44 % | **above** |
| mid-tone seconds (luma 0.15–0.5) | 0 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.07 | 0.07 | 0.09 | **below** |
| accent area (median) | 12 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 0 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | accent light | layout vs previous | drums |
|---|---|---|---|---|---|---|---|---|---|
| 05-branch | 0.96 / 4.28 | 4.76 | 0.12 | 84 | 56 % | 100 % | 24.4 % |  | 0.14 |

Accent light: the share of the frame the accent lights, its halo included. Layout vs previous: how alike the scene's edge layout is to the scene before it (1 = the same; over 0.8 in bold, a repeated layout).

## Weakest scenes (big motion against their music)

05-branch (4.28 @ drums 0.14)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (4 of the 5 strong onsets and downbeats this video can judge (of 425 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

28.07, 28.54, 29.48, 29.93
