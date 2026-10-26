# Audit: force-push — proof-117.16-121.534.mp4

4.4 s from track 117.16; 0 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 4.99 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 5.66 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 100 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 0 % | 19 % | 35 % | **below** |
| hard cuts per minute | 0.00 | 8.07 | 48.46 | **below** |
| share of the frame that is true black | 62 % | 20 % | 44 % | **above** |
| mid-tone seconds (luma 0.15–0.5) | 0 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.06 | 0.07 | 0.09 | **below** |
| accent area (median) | 11 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 0 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | accent light | layout vs previous | drums |
|---|---|---|---|---|---|---|---|---|---|
| 24-rewrote2 | 4.90 / 10.90 | 13.19 | 0.10 | 64 | 67 % | 95 % | 16.6 % |  | 0.50 |

Accent light: the share of the frame the accent lights, its halo included. Layout vs previous: how alike the scene's edge layout is to the scene before it (1 = the same; over 0.8 in bold, a repeated layout).

## Weakest scenes (big motion against their music)

24-rewrote2 (10.90 @ drums 0.50)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (2 of the 8 strong onsets and downbeats this video can judge (of 425 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

118.44, 118.45
