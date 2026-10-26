# Audit: force-push — proof-124.58-133.152.mp4

8.6 s from track 124.58; 2 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 1.10 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 2.07 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 86 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 14 % | 19 % | 35 % | **below** |
| hard cuts per minute | 13.98 | 8.07 | 48.46 |  |
| share of the frame that is true black | 29 % | 20 % | 44 % |  |
| mid-tone seconds (luma 0.15–0.5) | 0 % | 28 % | 33 % | **below** |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.06 | 0.07 | 0.09 | **below** |
| accent area (median) | 8 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 12 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| 26-timeline2 | 1.38 / 6.26 | 7.90 | 0.12 | 84 | 34 % | 100 % | 0.53 |
| 27-local2 | 0.75 / 6.93 | 7.27 | 0.12 | 66 | 38 % | 85 % | 0.52 |

## Weakest scenes (big motion against their music)

26-timeline2 (6.26 @ drums 0.53), 27-local2 (6.93 @ drums 0.52)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (0 of the 20 strong onsets and downbeats this video can judge (of 425 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

none
