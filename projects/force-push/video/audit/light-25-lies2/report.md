# Audit: force-push — proof-121.534-124.9.mp4

3.4 s from track 121.53; 2 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 2.68 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 4.06 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 100 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 50 % | 19 % | 35 % |  |
| hard cuts per minute | 35.64 | 8.07 | 48.46 |  |
| share of the frame that is true black | 52 % | 20 % | 44 % | **above** |
| mid-tone seconds (luma 0.15–0.5) | 33 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.04 | 0.07 | 0.09 | **below** |
| accent area (median) | 11 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 0 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | accent light | layout vs previous | drums |
|---|---|---|---|---|---|---|---|---|---|
| 25-lies2 | 2.64 / 16.19 | 15.04 | 0.15 | 104 | 50 % | 97 % | 28.7 % |  | 0.51 |
| 26-timeline2 (part) | 1.26 / 2.42 | 4.75 | 0.09 | 48 | 28 % | 100 % | 52.2 % | 0.02 | 0.30 |

Accent light: the share of the frame the accent lights, its halo included. Layout vs previous: how alike the scene's edge layout is to the scene before it (1 = the same; over 0.8 in bold, a repeated layout).

## Weakest scenes (big motion against their music)

26-timeline2 (2.42 @ drums 0.30), 25-lies2 (16.19 @ drums 0.51)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (0 of the 7 strong onsets and downbeats this video can judge (of 425 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

none
