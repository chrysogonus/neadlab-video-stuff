# Audit: force-push — proof-184.53-197.931.mp4

13.4 s from track 184.53; 30 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.88 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 1.62 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 100 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 33 % | 19 % | 35 % |  |
| hard cuts per minute | 134.16 | 8.07 | 48.46 | **above** |
| share of the frame that is true black | 21 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 31 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.07 | 0.07 | 0.09 | **below** |
| accent area (median) | 5 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 15 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| 35-chant3 | 1.04 / 9.57 | 6.12 | 0.14 | 82 | 23 % | 98 % | 0.33 |
| 36-reflog | 0.78 / 2.16 | 5.14 | 0.11 | 60 | 24 % | 61 % | 0.00 |
| 37-end (part) | 0.51 / 6.82 | 3.00 | 0.17 | 89 | 50 % | 100 % | 0.74 |

## Weakest scenes (big motion against their music)

37-end (6.82 @ drums 0.74), 36-reflog (2.16 @ drums 0.00), 35-chant3 (9.57 @ drums 0.33)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (2 of the 17 strong onsets and downbeats this video can judge (of 425 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

190.06, 193.79
