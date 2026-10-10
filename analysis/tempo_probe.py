"""Find the tempo search window for analyze.py's TEMPO_RANGE.

analyze.py fits a constant-tempo grid by exhaustive search inside TEMPO_RANGE. That
search cannot find a tempo outside its window -- it locks onto a metric relative
instead (half/double/4:3) and the kick residual blows up. Run this first.

  uv run python tempo_probe.py
"""
import common
import numpy as np
import librosa

HOP = 256
SR = 22050


def main():
    y, sr = common.load_stem("drums", sr=SR)
    onset = librosa.onset.onset_strength(y=y, sr=sr, hop_length=HOP)
    fps = sr / HOP

    tg = librosa.feature.tempogram(onset_envelope=onset, sr=sr, hop_length=HOP, win_length=512)
    ac = tg.mean(axis=1)
    bpms = 60 * fps / np.maximum(np.arange(len(ac)), 1e-9)
    m = (bpms > 50) & (bpms < 220)
    peaks = []
    for b in bpms[m][np.argsort(ac[m])[::-1]]:
        if all(abs(b - s) > 3 for s in peaks):
            peaks.append(float(b))
        if len(peaks) >= 6:
            break
    est = float(librosa.feature.tempo(onset_envelope=onset, sr=sr, hop_length=HOP,
                                      aggregate=np.median)[0])

    print("tempogram peaks:  " + "  ".join(f"{b:.2f}" for b in peaks))
    print(f"median estimate:  {est:.3f} BPM")

    # constant tempo? (adjacent tempogram bins differ by ~2 BPM here, so small
    # window-to-window changes are quantisation, not drift)
    w = int(30 * fps)
    print("per-30s:          " + "  ".join(
        f"{float(librosa.feature.tempo(onset_envelope=onset[i:i+w], sr=sr, hop_length=HOP, aggregate=np.median)[0]):.1f}"
        for i in range(0, max(1, len(onset) - w // 2), w)))
    print(f"\nTEMPO_RANGE = ({est - 7:.1f}, {est + 7:.1f})")


if __name__ == "__main__":
    main()
