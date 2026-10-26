# Audit: harvest-remix — proof-23.656-34.81.mp4

11.2 s from track 23.66; 5 hard cuts. Signals, not targets (docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).

## The film against the references

| | this | LGTM | p(doom) | |
|---|---|---|---|---|
| typical motion (median frame difference) | 0.85 | 0.37 | 1.17 |  |
| big-motion moments (90th percentile) | 3.90 | 1.94 | 5.96 |  |
| seconds whose composition changes > 0.03 | 90 % | 63 % | 86 % |  |
| seconds whose composition changes > 0.10 | 40 % | 19 % | 35 % |  |
| hard cuts per minute | 26.87 | 8.07 | 48.46 |  |
| share of the frame that is true black | 54 % | 20 % | 44 % | **above** |
| mid-tone seconds (luma 0.15–0.5) | 45 % | 28 % | 33 % |  |
| light seconds (luma > 0.5) | 0 % | 20 % | 9 % | **below** |
| detail (edge density) | 0.06 | 0.07 | 0.09 | **below** |
| accent area (median) | 4 % | 3 % | 3 % | **above** |
| seconds with no accent colour | 27 % | 23 % | 26 % | **above** |

## Scenes

Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its figures and drums cover that part.

| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | drums |
|---|---|---|---|---|---|---|---|
| keep | 0.95 / 9.58 | 4.83 | 0.13 | 114 | 54 % | 79 % | 0.09 |
| wait (part) | 0.66 / 2.37 | 3.87 | 0.22 | 217 | 65 % | 0 % | 0.44 |

## Weakest scenes (big motion against their music)

wait (2.37 @ drums 0.44), keep (9.58 @ drums 0.09)

## Still runs (guideline motion < 1.5 for more than 2 s)

none

## Unseen hits (3 of the 13 strong onsets and downbeats this video can judge (of 312 in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)

28.29, 30.12, 33.13
