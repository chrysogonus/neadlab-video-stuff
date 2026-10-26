# Audit: harvest-remix — proof-75.987-100.756.mp4

24.8 s from track 75.99; 21 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 2.95 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 6.11 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 100 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 48 % | 19 % | 35 % |  |
| hard cuts per minute | 50.84 | 8.07 | 48.46 | **above** |
| share of the frame that is true black | 34 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 58 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 21 % | 20 % | 9 % |  |
| detail (edge density) | 0.09 | 0.07 | 0.09 |  |
| accent area (median) | 6 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 25 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| later | 1.87 / 9.49 | 12.00 | 0.34 | 215 | 33 % | 37 % | 0.36 |
| mine | 3.79 / 10.86 | 13.56 | 0.15 | 107 | 39 % | 98 % | 0.31 |
| dark (part) | 1.16 / 12.54 | 7.01 | 0.33 | 218 | 53 % | 47 % | 0.43 |

## Weakest scenes (big motion against their music)

later (9.49 @ drums 0.36), dark (12.54 @ drums 0.43), mine (10.86 @ drums 0.31)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (6 of the 55 strong onsets and downbeats this video can judge (of 312 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

76.68, 76.91, 79.64, 79.66, 88.32, 91.77
