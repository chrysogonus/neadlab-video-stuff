# Verified on the QA plots (work/qa/line_NN.png):
# L0 "Git status." (case 1): 0.2-1.55 s on the vocal stem is a flat pad partial (~250 Hz) with no
#   formants or consonants; the voice starts with the "G" burst at 1.56 (fused-ctc, mms, lv60k agree,
#   beat 1.589). "status." at 1.72 is right: the "s" noise runs 1.73-1.88 after the "t" closure of Git.
# L3 "Three years in ..." (case 1): 9.4-16.2 is the instrumental lead (steady vibrato partials) and
#   16.25-17.0 a noise sweep into the verse downbeat (16.935); "Three" is the voiced stack from ~17.0,
#   then years (17.38), in, and, you, never land one per beat as the acoustic models place them.
#   Whisper's Three 16.26 / years 17.02 is off the grid and sits on the sweep.
# L15 "FORCE PUSH! Baby, you're history" (case 2): FORCE at 53.44 is right: the shouted, noisy
#   FORCE PUSH! fills 53.44-54.4 (same look and spacing as FORCE/PUSH in L17 and L37), then a gap,
#   then "Baby," enters at 54.66 with the same rising glide as Baby in L37 (115.43). PUSH! moves to
#   ~54.0 (the chorus downbeat 53.984), Baby to 54.66; you're (55.28) and history (55.63) are right:
#   the FORCE->PUSH->Baby->you're->history spacing then matches L37 to within 0.05 s.
# L37 (not flagged, same delivery as L15): Baby starts at the voiced entry 115.43 (lv60k and
#   Whisper agree), not 115.64; the other words are right.
ANCHORS = {
    (0, 0, 0): (1.50, None),
    (3, 0, 0): (16.90, None),
}
FIX = {
    (0, 0): dict(start=1.56, conf=0.7),
    (3, 0): dict(start=16.97, conf=0.7),
    (15, 1): dict(start=54.00, conf=0.7),
    (15, 2): dict(start=54.66, conf=0.7),
    (37, 2): dict(start=115.43, conf=0.7),
}
