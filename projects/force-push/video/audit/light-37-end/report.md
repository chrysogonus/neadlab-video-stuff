# Audit: force-push — proof-191.895-209.64.mp4

17.8 s from track 191.90; 5 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.61 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 1.54 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 62 % | 63 % | 86 % | **below** |
| seconds whose composition changes > 0.10 | 12 % | 19 % | 35 % | **below** |
| hard cuts per minute | 16.90 | 8.07 | 48.46 |  |
| share of the frame that is true black | 54 % | 20 % | 44 % | **above** |
| mid-tone seconds (luma 0.15–0.5) | 41 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.05 | 0.07 | 0.09 | **below** |
| accent area (median) | 10 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 35 % | 23 % | 26 % | **above** |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | accent light | layout vs previous | drums |
|---|---|---|---|---|---|---|---|---|---|
| 36-reflog | 0.89 / 2.40 | 5.37 | 0.10 | 53 | 36 % | 76 % | 20.6 % |  | 0.00 |
| 37-end | 0.46 / 4.92 | 3.61 | 0.17 | 125 | 63 % | 65 % | 19.5 % | 0.45 | 0.20 |

Accent light: the share of the frame the accent lights, its halo included. Layout vs previous: how alike the scene's edge layout is to the scene before it (1 = the same; over 0.8 in bold, a repeated layout).

## Weakest scenes (big motion against their music)

36-reflog (2.40 @ drums 0.00), 37-end (4.92 @ drums 0.20)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (1 of the 36 strong onsets and downbeats this video can judge (of 425 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

193.79
