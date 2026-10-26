# Audit: harvest-remix — proof-160.058-164.4.mp4

4.3 s from track 160.06; 1 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.33 | 0.37 | 1.17 | **below** |
| big-motion moments (90th percentile) | 0.46 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 67 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 33 % | 19 % | 35 % |  |
| hard cuts per minute | 13.79 | 8.07 | 48.46 |  |
| share of the frame that is true black | 62 % | 20 % | 44 % | **above** |
| mid-tone seconds (luma 0.15–0.5) | 100 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.04 | 0.07 | 0.09 | **below** |
| accent area (median) | 1 % | 3 % | 3 % | **below** |
| seconds with no accent colour | 25 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| secure | 0.25 / 3.42 | 2.19 | 0.28 | 208 | 62 % | 64 % | 0.02 |

## Weakest scenes (big motion against their music)

secure (3.42 @ drums 0.02)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (0 of the 5 strong onsets and downbeats this video can judge (of 312 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

none
