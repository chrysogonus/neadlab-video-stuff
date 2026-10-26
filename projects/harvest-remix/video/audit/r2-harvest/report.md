# Audit: harvest-remix — proof-48.491-61.35.mp4

12.9 s from track 48.49; 4 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 13.17 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 16.34 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 100 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 91 % | 19 % | 35 % |  |
| hard cuts per minute | 18.65 | 8.07 | 48.46 |  |
| share of the frame that is true black | 22 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 67 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.15 | 0.07 | 0.09 |  |
| accent area (median) | 5 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 0 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| harvest | 12.56 / 23.86 | 36.33 | 0.21 | 138 | 19 % | 96 % | 0.50 |

## Weakest scenes (big motion against their music)

harvest (23.86 @ drums 0.50)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (2 of the 33 strong onsets and downbeats this video can judge (of 312 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

58.14, 60.41
