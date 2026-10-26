# Audit: harvest-remix — proof-41.72-49.mp4

7.3 s from track 41.72; 4 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 1.54 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 3.14 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 100 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 67 % | 19 % | 35 % |  |
| hard cuts per minute | 32.95 | 8.07 | 48.46 |  |
| share of the frame that is true black | 43 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 43 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.05 | 0.07 | 0.09 | **below** |
| accent area (median) | 2 % | 3 % | 3 % | **below** |
| seconds with no accent colour | 43 % | 23 % | 26 % | **above** |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| watch | 1.57 / 3.86 | 6.58 | 0.09 | 58 | 52 % | 28 % | 0.26 |
| hook | 1.44 / 5.64 | 8.70 | 0.15 | 164 | 57 % | 82 % | 0.12 |
| harvest (part) | 12.42 / 20.10 | 25.67 | 0.21 | 102 | 6 % | 100 % | 0.56 |

## Weakest scenes (big motion against their music)

watch (3.86 @ drums 0.26), hook (5.64 @ drums 0.12), harvest (20.10 @ drums 0.56)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (2 of the 8 strong onsets and downbeats this video can judge (of 312 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

43.7, 45.28
