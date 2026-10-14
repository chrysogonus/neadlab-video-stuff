# Verified on the QA plots:
# L10 "They're stacking up the qubits, ..." (line_10.png): case 1, first word parked early. 53.5-61.45 s is the
#   post-chorus wordless "oh" ad-lib (high held f0 ~600 Hz, smooth glides; both Whisper passes hear only "oh"),
#   not lyric. The verse voice enters with the onset cluster at ~62.04 s, an eighth-note pickup to the beat at
#   62.26 ("STACK-ing up the" on eighths, "QU-bits" on the 63.17 downbeat). fused-ctc, mms and lv60k all end
#   "They're" at ~62.1 and agree on stacking 62.15, up 62.8, the 62.94, qubits 63.1, so only the first word moves.
ANCHORS = {
    (10, 0, 0): (61.8, None),   # They're: after the last "oh" note (ends 61.45)
}
FIX = {
    (10, 0): dict(start=62.02, conf=0.7),   # They're
}
