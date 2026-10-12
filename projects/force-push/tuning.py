"""Force Push: hand corrections to the analysis (verified on the QA plots in work/qa/).

The grid settings are detected (analyze.py) and match what this file used to pin: tempo window
(122, 137) around the 129.2 BPM estimate; a tracked grid, because the tempo drifts from ~129.3 BPM
in verse 1 to ~130.7 at the end (a constant grid is off by up to ~140 ms); bar phase 0, so every
gang-chant "Force!" and the chorus "PUSH!" fall on a downbeat; sections on the latest downbeat at or
before each section's first word (several sections open with a 1.2-1.8 s pickup).
"""

WHISPER_PROMPT = ("Song lyrics: git status, nothing to commit, force push, stash, branch, blame, "
                  "merge, conflicts, patches, logs, head detached, rebase, squash, cherry-picked, "
                  "pull requests, git-ignore, revert, origin, ref-log.")
# Where the vocal sings something other than the sheet (input/force-push.txt is left as written):
# {line index in the sung-lines file: what is sung}. lyrics_sheet.py applies these. Evidence (2026-10-11):
# both Whisper runs, a greedy decode of the wav2vec2-LV60K emissions on the mono, left and right vocal stem,
# and constrained CTC Viterbi scores of both readings over the same window (fused6 emissions).
SUNG = {
    # Pre-chorus 1: the stage direction "[Stop - one beat of silence]" is sung. Whisper: "Stop one beat and
    # you're gone" (word p 0.97/0.91/0.82); LV60K: "stop one beat an you're gone" on all three channels;
    # Viterbi 51.0-54.2 s: -199.65 vs -224.28 for "One command and you're gone".
    14: "Stop, one beat and you're gone",
    # Pre-chorus 2: "logs, and now you want a revert?" instead of "logs at night / You want a revert?".
    # Whisper (both runs): "your laws and now you want to revert"; LV60K: "your nos an niw you an o rober";
    # Viterbi 109.0-112.9 s: -113.21 vs -130.06. ("and now" leads into the question, so it opens the next line.)
    # (In pre-chorus 1 the same comparison is a near tie, -86.30 vs -89.89, and Whisper hears "at night":
    # the sheet stands there.)
    34: "No more reading your logs",
    35: "And now you want a revert? Baby, that's cute",
}

PRON = {}
ALT = {}
LINE_WINDOWS = {}

# Verified on the QA plots (analysis/qa/force-push/line_*.png, zoom_*.png) against the tracked beats.
ANCHORS = {
    # 9.4-16.4 s holds a sustained pitched pad in the vocal stem; the verse starts at ~16.9 (Whisper 16.38,
    # MMS/LV60K vocL/vocR 16.86). Without this the path parks "Three" on the pad at 9.43.
    (3, 0, 0): (16.0, None),
}

# (line, token) -> dict(start=...): word starts the automatic path gets wrong, from the zoomed plots.
FIX = {
    # "Three" (with the anchor above): the rest-onset rule would still pull it back to where the pad enters.
    (3, 0): dict(start=16.86, conf=0.8),
    # "Git": a low synth drone sits in the vocal stem from 0.2 s; the shout starts at 1.56 (all four alternatives).
    (0, 0): dict(start=1.56, conf=0.85),
    # chorus 1: "PUSH!" is the second half of the shouted burst, on the 53.98 beat (vocal onset 53.90);
    # then the near-silent beat 54.3-54.6 before "Baby" at 54.66.
    (15, 1): dict(start=53.96, conf=0.75),
    # "the" sits on the 57.68 beat (LV60K 57.56, MMS 57.64, Whisper 57.6); "past" at 58.33-58.48.
    (16, 2): dict(start=57.66, conf=0.75),
    # "PUSH!" at 61.33 (MMS 61.34, LV60K 61.32, vocR 61.32, Whisper 61.36; on the 61.37 downbeat).
    (17, 1): dict(start=61.33, conf=0.8),
    # The gang chants: "Force!" on beat 1 of each bar, "Push!" on beat 2, "(hey!)" on the and of 2, the phrase
    # on beats 3-4 (the cleanest, post-chorus 1, shows it best). Where "Force!" was absorbed by the held
    # "there" of the line before, it starts at the downbeat where the broadband shout begins.
    (21, 0): dict(start=76.12, conf=0.75),   # MMS 76.12, downbeat 76.12
    (23, 0): dict(start=79.80, conf=0.7),    # downbeat 79.80, MMS 79.70
    (43, 0): dict(start=136.82, conf=0.75),  # MMS 136.82, vocL 136.74, vocR 136.76; downbeat 136.82
    (43, 1): dict(start=137.26, conf=0.75),  # MMS/vocL/vocR 137.24-137.26; beat 137.28
    (43, 2): dict(start=137.52, conf=0.6),   # the and of 2, before "Wipe" on beat 3 (137.74)
    (57, 0): dict(start=184.56, conf=0.7),   # downbeat 184.56: the pitched "there" holds until the shout
    (58, 0): dict(start=186.40, conf=0.7),   # downbeat 186.39 (MMS 186.30, LV60K 186.34)
    (59, 0): dict(start=188.22, conf=0.7),   # downbeat 188.23 (MMS 188.12, vocL 188.20)
    (59, 2): dict(start=189.02, conf=0.55),  # beat 3 (189.15) is "Hear": the hey just before it
}

EXTRA_DESC = [
    (9.4, 16.4, "sustained pitched pad / hum in the vocal stem before verse 1 (no lyric)"),
    (197.4, 209.0, "tag after 'I can wait.': the hard hit (197.43) starts ~7 s of full band with a "
                   "'dun-dun-dun' vocal chant; drums out at ~204.6, the chant alone until ~209"),
]

ALIGN_NOTES = (
    "Timeline = the WAV master (see `source`); the Demucs stems are separated from it, so no offset. "
    "Lines: data/lines.txt, derived from the sheet input/force-push.txt by lyrics_sheet.py, "
    "with the two places the vocal differs from the sheet replaced by what is sung (tuning.py SUNG: "
    "pre-chorus 1 sings the stage direction, 'Stop, one beat and you're gone'; "
    "pre-chorus 2 sings 'No more reading your logs, and now you want a revert?'). "
    "Method: (1) CTC emissions (20 ms) of the vocal stem from torchaudio MMS_FA and wav2vec2-large-lv60k-960h "
    "on the mono sum and the left/right channels, fused as a probability mixture; (2) one global constrained "
    "Viterbi alignment of all 64 lines with a garbage 'star' token between lines; (3) signal refinement of "
    "word starts/ends on the vocal stem (rest onsets, spectral-flux onsets, frication); (4) cross-check "
    "against faster-whisper large-v3-turbo (CPU) and the individual models/channels; (5) the disagreements "
    "inspected on zoomed spectrogram/pitch/onset plots against the tracked beat grid, with one anchor and "
    "14 manual starts (FIX), mostly in the gang-chant post-choruses. "
    "conf: 0.35 + agreement of the alternatives (<=60 ms) + CTC posterior + Whisper agreement; manual "
    "fixes carry their own conf. Least certain: the gang chants' '(hey!)' and 'Like you've never' "
    "(+-100 ms, shouted over each other), 'I' in 'Keep your local copy, I don't care' (69.9 or ~70.4), "
    "chorus 'I rewrote' (56.4-56.7). Elsewhere word starts are expected within ~30-50 ms."
)
