# Audit: force-push — proof-121.534-129.84.mp4

8.3 s from track 121.53; 9 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 1.33 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 2.70 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 86 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 29 % | 19 % | 35 % |  |
| hard cuts per minute | 64.93 | 8.07 | 48.46 | **above** |
| share of the frame that is true black | 30 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 25 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.05 | 0.07 | 0.09 | **below** |
| accent area (median) | 10 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 12 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| 25-lies2 | 2.02 / 14.39 | 9.63 | 0.16 | 116 | 30 % | 97 % | 0.51 |
| 26-timeline2 | 1.32 / 6.30 | 7.44 | 0.12 | 87 | 34 % | 100 % | 0.53 |
| 27-local2 (part) | 0.51 / 1.10 | 2.24 | 0.07 | 39 | 46 % | 0 % | 0.47 |

## Weakest scenes (big motion against their music)

27-local2 (1.10 @ drums 0.47), 26-timeline2 (6.30 @ drums 0.53), 25-lies2 (14.39 @ drums 0.51)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (1 of the 20 strong onsets and downbeats this video can judge (of 425 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

122.59
