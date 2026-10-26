# Audit: harvest-remix — proof-33.806-45.5.mp4

11.7 s from track 33.81; 3 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 1.33 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 5.70 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 90 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 30 % | 19 % | 35 % |  |
| hard cuts per minute | 15.38 | 8.07 | 48.46 |  |
| share of the frame that is true black | 52 % | 20 % | 44 % | **above** |
| mid-tone seconds (luma 0.15–0.5) | 55 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.08 | 0.07 | 0.09 |  |
| accent area (median) | 1 % | 3 % | 3 % | **below** |
| seconds with no accent colour | 55 % | 23 % | 26 % | **above** |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| wait | 1.85 / 8.72 | 9.23 | 0.22 | 215 | 49 % | 34 % | 0.33 |
| watch | 1.17 / 3.17 | 5.66 | 0.08 | 53 | 58 % | 27 % | 0.26 |

## Weakest scenes (big motion against their music)

watch (3.17 @ drums 0.26), wait (8.72 @ drums 0.33)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (1 of the 18 strong onsets and downbeats this video can judge (of 312 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

43.7
