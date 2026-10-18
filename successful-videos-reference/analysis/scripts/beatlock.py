import json, sys, numpy as np, librosa
for v in sys.argv[1:]:
    M = json.load(open(f"{v}/metrics.json"))
    y, sr = librosa.load(f"{v}/audio.wav", sr=22050)
    oenv = librosa.onset.onset_strength(y=y, sr=sr, hop_length=256)
    tempo, beats = librosa.beat.beat_track(onset_envelope=oenv, sr=sr, hop_length=256, units="time", tightness=400)
    period = 60 / float(np.atleast_1d(tempo)[0])
    strong = [c for c in M["cuts"] if c["hd"] >= 0.3]
    t = np.array([c["t"] for c in strong])
    # phase of each strong cut relative to the beat grid (fit one global phase)
    ph = ((t - beats[0]) / period) % 1.0
    ang = np.exp(2j * np.pi * ph); R = abs(ang.mean()); mu = np.angle(ang.mean()) / (2*np.pi) % 1
    d = ((ph - mu + 0.5) % 1 - 0.5) * period * 1000
    half = ((t - beats[0]) / (period/2)) % 1.0; Rh = abs(np.exp(2j*np.pi*half).mean())
    print(f"{v}: tempo {60/period:.1f}  strong cuts {len(t)}  beat-phase concentration R={R:.2f} (1=all at same phase, 0=random)  8th-note R={Rh:.2f}")
    print(f"   spread around mean phase: |d|<=17ms {np.mean(abs(d)<=17)*100:.0f}%  <=34ms {np.mean(abs(d)<=34)*100:.0f}%  <=60ms {np.mean(abs(d)<=60)*100:.0f}%")
