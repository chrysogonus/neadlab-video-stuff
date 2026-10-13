# Step: alignment review

The word alignment of `projects/{{id}}` has suspect placements, listed in `projects/{{id}}/work/qa/align_flags.json`
(and `work/qa/align_report.md`): a line whose first word is stretched over more than 1 s per syllable. Two
different errors produce that, and a real held note can too:
1. **The first word parked early**, on an instrumental lead-in the vocal stem still carries (a pad, a drone, a
   riser): the singer really starts later, and the word should start later.
2. **The first word is right, but the words after it are placed too late**: the first word stretches to fill the
   gap. Then its start stays; the following words move earlier.
3. **A held note** that is really sung that long: no change.

For each flagged line, check every word of the line, not only the first, on its QA plot
`projects/{{id}}/work/qa/line_NN.png` (NN = line index, two digits). The plot shows the vocal stem's spectrogram (a sung
or spoken word: harmonics with formants and consonant noise; a pad or riser: flat steady partials or a smooth
sweep), its loudness and onsets, and word tracks: `final` (the current alignment), `fused-ctc`, `mms`, `lv60k` (two
acoustic models) and `whisper` (a speech recogniser). Find each word's real start: the voice's onsets, where the
models and Whisper put it, and how many syllables the singer delivers where. Shouted words in a chorus often come
in quick succession, one per beat. The Whisper words are also in `projects/{{id}}/work/whisper_turbo_prompt.json`
(segments[].words[] with start/end) and the beat times in `projects/{{id}}/data/audio.json` (`beats`).

Write the corrections into `projects/{{id}}/tuning.py` (create it if missing; keep everything already in it). Token
indices are 0-based within the line:

```python
# Verified on the QA plots: <what you saw, per line>
ANCHORS = {
    (LINE, TOKEN, 0): (EARLIEST_START, None),   # that word may not start before EARLIEST_START (case 1)
}
FIX = {
    (LINE, TOKEN): dict(start=TRUE_START, conf=0.7),   # a word's corrected start (cases 1 and 2)
}
```

Case 1: an anchor on the first word plus a fix of its start. Case 2: fixes of the starts of the misplaced words that
follow (no anchor; leave the first word as it is). Case 3: no change, say so in a comment. Edit only
`projects/{{id}}/tuning.py`; the pipeline re-runs the alignment.
