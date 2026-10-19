import sys, json, glob, os
import numpy as np
from PIL import Image
import librosa

def frame_metrics(path):
    im = np.asarray(Image.open(path).convert("RGB")).astype(np.float32) / 255
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    Y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    mx, mn = im.max(-1), im.min(-1)
    sat = np.where(mx > 0.04, (mx - mn) / np.maximum(mx, 1e-6), 0)
    rg, yb = r - g, 0.5 * (r + g) - b
    colorful = np.hypot(rg.std(), yb.std()) + 0.3 * np.hypot(rg.mean(), yb.mean())
    gy, gx = np.gradient(Y)
    edges = (np.hypot(gx, gy) > 0.08).mean()
    # hue of saturated pixels
    hsv = np.asarray(Image.open(path).convert("HSV")).astype(np.float32)
    m = (hsv[..., 1] > 90) & (hsv[..., 2] > 60)
    hue = None
    if m.mean() > 0.01:
        h = hsv[..., 0][m] / 255 * 360
        hist, _ = np.histogram(h, bins=12, range=(0, 360))
        hue = int(np.argmax(hist) * 30 + 15)
    small = np.asarray(Image.open(path).convert("L").resize((64, 36), Image.BILINEAR)).astype(np.float32) / 255
    return dict(luma=float(Y.mean()), contrast=float(Y.std()), black=float((Y < 0.06).mean()),
                white=float((Y > 0.85).mean()), ground=float(np.percentile(Y, 20)), dark09=float((Y < 0.09).mean()), sat=float(sat.mean()), sat_area=float(m.mean()),
                colorful=float(colorful), edges=float(edges), hue=hue), small

def cuts(raw, w=96, h=54, fps=60):
    a = np.fromfile(raw, np.uint8).reshape(-1, h, w, 3).astype(np.float32)
    d = np.abs(np.diff(a, axis=0)).mean(axis=(1, 2, 3))          # d[i]: frame i -> i+1
    # histogram distance (robust to motion)
    q = (a // 32).astype(np.int32)
    idx = q[..., 0] * 64 + q[..., 1] * 8 + q[..., 2]
    hist = np.stack([np.bincount(x.ravel(), minlength=512) for x in idx]).astype(np.float32) / (w * h)
    hd = 0.5 * np.abs(np.diff(hist, axis=0)).sum(1)
    out = []
    for i in range(len(d)):
        lo, hi = max(0, i - 8), min(len(d), i + 9)
        nb = np.concatenate([d[lo:i], d[i + 1:hi]])
        base = np.median(nb) if len(nb) else 0
        if d[i] > 10 and d[i] > 3 * base + 4 and hd[i] > 0.12:
            out.append(dict(t=round((i + 1) / fps, 3), d=round(float(d[i]), 1), hd=round(float(hd[i]), 2)))
    motion = [float(np.median(d[s * fps:(s + 1) * fps])) if s * fps < len(d) else 0 for s in range(int(np.ceil(len(d) / fps)))]
    return out, motion, d

def audio(wav):
    y, sr = librosa.load(wav, sr=22050, mono=True)
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units="time", tightness=200)
    rms = librosa.feature.rms(y=y, hop_length=512)[0]
    tt = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=512)
    per_s = [float(rms[(tt >= s) & (tt < s + 1)].mean()) for s in range(int(tt[-1]) + 1)]
    return float(np.atleast_1d(tempo)[0]), beats.tolist(), per_s

name = sys.argv[1]
os.chdir(name)
rows, smalls = [], []
for i, p in enumerate(sorted(glob.glob("f/*.jpg"))):
    m, s = frame_metrics(p)
    m["t"] = i
    rows.append(m); smalls.append(s)
for i in range(len(rows)):
    rows[i]["change"] = float(np.abs(smalls[i] - smalls[i - 1]).mean()) if i else 0.0
cut_list, motion, d = cuts("rgb60.raw")
tempo, beats, rms = audio("audio.wav")
for r in rows:
    r["motion"] = motion[r["t"]] if r["t"] < len(motion) else 0
    r["rms"] = rms[r["t"]] if r["t"] < len(rms) else 0
beats_a = np.array(beats)
for c in cut_list:
    j = int(np.argmin(np.abs(beats_a - c["t"])))
    c["beat_off_ms"] = round((c["t"] - beats_a[j]) * 1000)
    c["beat_idx"] = j
json.dump(dict(rows=rows, cuts=cut_list, tempo=tempo, beats=beats), open("metrics.json", "w"))
np.save("diff60.npy", d)
print(name, "tempo", round(tempo, 1), "beats", len(beats), "cuts", len(cut_list))
