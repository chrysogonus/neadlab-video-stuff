# Audit: harvest-remix — proof-0-8.5.mp4

8.5 s from track 0.00; 2 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.66 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 1.90 | 1.94 | 5.96 | **below** |
| seconds whose composition changes > 0.03 | 100 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 43 % | 19 % | 35 % |  |
| hard cuts per minute | 14.12 | 8.07 | 48.46 |  |
| share of the frame that is true black | 56 % | 20 % | 44 % | **above** |
| mid-tone seconds (luma 0.15–0.5) | 88 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 12 % | 20 % | 9 % |  |
| detail (edge density) | 0.06 | 0.07 | 0.09 | **below** |
| accent area (median) | 5 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 12 % | 23 % | 26 % |  |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| seal | 0.66 / 4.22 | 3.72 | 0.19 | 205 | 60 % | 100 % | 0.04 |
| sent (part) | 0.73 / 1.34 | 4.97 | 0.81 | 205 | 0 % | 0 % | 0.31 |

## Weakest scenes (big motion against their music)

sent (1.34 @ drums 0.31), seal (4.22 @ drums 0.04)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (0 of the 9 strong onsets and downbeats this video can judge (of 312 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

none
