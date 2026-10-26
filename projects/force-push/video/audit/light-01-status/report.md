# Audit: force-push — proof-0-15.6.mp4

15.6 s from track 0.00; 9 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.26 | 0.37 | 1.17 | **below** |
| big-motion moments (90th percentile) | 1.46 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 43 % | 63 % | 86 % | **below** |
| seconds whose composition changes > 0.10 | 0 % | 19 % | 35 % | **below** |
| hard cuts per minute | 34.62 | 8.07 | 48.46 |  |
| share of the frame that is true black | 75 % | 20 % | 44 % | **above** |
| mid-tone seconds (luma 0.15–0.5) | 13 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.04 | 0.07 | 0.09 | **below** |
| accent area (median) | 8 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 13 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | accent light | layout vs previous | drums |
|---|---|---|---|---|---|---|---|---|---|
| 01-status | 0.35 / 1.91 | 1.83 | 0.08 | 45 | 75 % | 82 % | 11.8 % |  | 0.00 |
| 02-commit (part) | 1.07 / 6.76 | 7.21 | 0.09 | 48 | 37 % | 100 % | 17.9 % | 0.23 | 0.01 |

Accent light: the share of the frame the accent lights, its halo included. Layout vs previous: how alike the scene's edge layout is to the scene before it (1 = the same; over 0.8 in bold, a repeated layout).

## Weakest scenes (big motion against their music)

01-status (1.91 @ drums 0.00), 02-commit (6.76 @ drums 0.01)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (0 of the 7 strong onsets and downbeats this video can judge (of 425 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

none
