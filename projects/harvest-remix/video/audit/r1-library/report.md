# Audit: harvest-remix — proof-145.444-160.058.mp4

14.6 s from track 145.44; 2 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 2.66 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 6.84 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 100 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 62 % | 19 % | 35 % |  |
| hard cuts per minute | 8.21 | 8.07 | 48.46 |  |
| share of the frame that is true black | 37 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 86 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 7 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.14 | 0.07 | 0.09 |  |
| accent area (median) | 6 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 0 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| breach | 4.14 / 9.88 | 27.16 | 0.30 | 207 | 31 % | 100 % | 0.65 |
| library | 3.09 / 8.55 | 12.96 | 0.17 | 125 | 31 % | 99 % | 0.64 |

## Weakest scenes (big motion against their music)

library (8.55 @ drums 0.64), breach (9.88 @ drums 0.65)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (8 of the 39 strong onsets and downbeats this video can judge (of 312 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

149.09, 149.1, 149.57, 153.2, 153.22, 153.66, 155.49, 158.54
