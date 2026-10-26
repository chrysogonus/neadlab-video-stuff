"""Measure a render against the two reference videos and per scene (pipeline step A, AGENTS.md).

    uv run python audit.py --project <id> --video <mp4> [--offset <s>] [--name <name>]

--offset is the track second of the video's first frame (a range proof starts at its --from). Writes
projects/<id>/video/audit/<name>/: report.md (the film against LGTM and p(doom), every scene, the weakest scenes,
still runs, unseen hits), report.json, and strips/<scene>.jpg (4 fps frames of each scene, for the reviewer,
docs/REVIEW.md). The per-second metrics and the cut detector are the ones in
successful-videos-reference/analysis/scripts/metrics.py (keep them in step), so the figures compare with the
references' metrics.json. Signals, not targets (docs/visual-guidelines.md): a flag sends you to look.
"""
import argparse
import json
import re
import subprocess
import tempfile
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
REFS = {"LGTM": "lgtm", "p(doom)": "pdoom"}
REF_DIR = ROOT / "successful-videos-reference" / "analysis"

# film metrics compared with the references: (key, label, which side is a problem)
FILM_METRICS = [
    ("motion_p50", "typical motion (median frame difference)", "low"),
    ("motion_p90", "big-motion moments (90th percentile)", "low"),
    ("change_03", "seconds whose composition changes > 0.03", "low"),
    ("change_10", "seconds whose composition changes > 0.10", "low"),
    ("cuts_per_min", "hard cuts per minute", "both"),
    ("black", "share of the frame that is true black", "high"),
    ("mid", "mid-tone seconds (luma 0.15–0.5)", "low"),
    ("light", "light seconds (luma > 0.5)", "low"),
    ("edges", "detail (edge density)", "low"),
    ("accent_area", "accent area (median)", "both"),
    ("no_colour", "seconds with no accent colour", "high"),
]


# ---------------------------------------------------------------- pure helpers (tested without decoding)
def film_summary(rows, cuts, duration):
    """The film-level figures from per-second rows (metrics.py keys) and the cut list."""
    a = lambda k: np.array([r[k] for r in rows], dtype=float)  # noqa: E731
    luma, ch, mo = a("luma"), a("change"), a("motion")
    return {
        "motion_p50": float(np.median(mo)), "motion_p90": float(np.percentile(mo, 90)),
        "change_03": float((ch[1:] > 0.03).mean()), "change_10": float((ch[1:] > 0.10).mean()),
        "cuts_per_min": len(cuts) / duration * 60,
        "black": float(a("black").mean()), "mid": float(((luma >= 0.15) & (luma <= 0.5)).mean()),
        "light": float((luma > 0.5).mean()), "edges": float(a("edges").mean()),
        "accent_area": float(np.median(a("sat_area"))),
        "no_colour": float(np.mean([r["hue"] is None for r in rows])),
    }


def band_verdict(value, refs, side):
    """'in band', 'below' or 'above' the references' range; only the side that is a problem is flagged."""
    lo, hi = min(refs), max(refs)
    if value < lo and side in ("low", "both"):
        return "below"
    if value > hi and side in ("high", "both"):
        return "above"
    return "in band"


def still_runs(motion, fps, threshold=1.5, min_s=2.0):
    """Stretches where the guideline motion (10 fps, 320×180 gray, mean frame difference) stays below threshold."""
    runs, start = [], None
    for i, v in enumerate(list(motion) + [threshold]):
        if v < threshold and start is None:
            start = i
        elif v >= threshold and start is not None:
            if (i - start) / fps > min_s:
                runs.append((start / fps, i / fps))
            start = None
    return runs


def scene_spans(storyboard):
    """[(scene id, start, end)] from STORYBOARD.md's frame blocks, in track seconds."""
    return [(sid, float(a), float(b)) for sid, a, b in
            re.findall(r"## Frame \d+ — (\S+)\n\n- src: \S+\n- duration: [\d.]+s\n- span_sec: \[([\d.]+), ([\d.]+)\]", storyboard)]


def unseen_hits(d, fps, hits, offset=0.0):
    """Strong hits that change nothing visible: the frame difference d within ±2 frames of the hit stays near its ±0.5 s
    baseline. Only hits with 0.5 s of video on both sides are judged. Returns (judged, unseen) in track seconds."""
    m = fps // 2
    judged, unseen = [], []
    for T in hits:
        i = int(round((T - offset) * fps))
        if m <= i < len(d) - m:
            judged.append(T)
            if d[i - 2:i + 3].max() < 1.5 * np.median(d[i - m:i + m]) + 0.3:
                unseen.append(round(T, 2))
    return judged, unseen


def clip_span(a, b, start, end):
    """The part of the scene [a, b] the video [start, end] covers (all in track seconds), or None."""
    a2, b2 = max(a, start), min(b, end)
    return (a2, b2) if b2 > a2 else None


def samples(a, b, rate, n):
    """[k0, k1): the samples of a stream taken every 1/rate s from 0 whose times k/rate fall in [a, b) (video seconds),
    clipped to the stream's n samples. Rounding up at both ends keeps the scene before a cut out."""
    eps = 1e-6  # 0.25 * 4 is 1.0000000000000002 in floats
    return max(0, int(np.ceil(a * rate - eps))), min(n, int(np.ceil(b * rate - eps)))


def internal(k0, k1):
    """The differences d[i] (frame i to frame i + 1) between two frames of the scene's frames [k0, k1): a cut into or
    out of the scene counts toward neither scene."""
    return slice(k0, max(k0, k1 - 1))


def every(rate):
    """An ffmpeg filter that samples exactly at k / rate s: resample to 60 fps, keep every (60 / rate)th frame. (`fps=rate`
    alone keeps the last frame of each slot, up to half a slot late.)"""
    assert 60 % rate == 0
    return f"fps=60,select='not(mod(n,{60 // rate}))'"


def accent_light(rgb, hue=15.0, tol=30.0):
    """Share of the frames' pixels the accent lights, its halo included: hue within tol degrees of the accent's, some
    saturation, not dark (uint8 RGB frames, any shape ending in 3)."""
    f = rgb.astype(np.float32) / 255
    mx, mn = f.max(-1), f.min(-1)
    s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    h = np.degrees(np.arctan2(np.sqrt(3) * (f[..., 1] - f[..., 2]), 2 * f[..., 0] - f[..., 1] - f[..., 2])) % 360
    return float(((np.abs((h - hue + 180) % 360 - 180) < tol) & (s > 0.3) & (mx > 0.12)).mean())


def layout_map(frames):
    """A scene's layout: where its edges sit, averaged over its frames, on an 18×32 grid, as a unit vector."""
    g = frames.astype(np.float32)
    g = g.mean(-1) if g.ndim == 4 else g
    gy, gx = np.gradient(g, axis=(1, 2))
    e = np.hypot(gx, gy).mean(0)
    h, w = e.shape[0] // 18, e.shape[1] // 32
    v = e[:h * 18, :w * 32].reshape(18, h, 32, w).mean(axis=(1, 3)).ravel()
    v = v - v.mean()
    return v / (np.linalg.norm(v) + 1e-9)


def weakest(scenes, n=10):
    """Scenes ranked by big motion against their music: p90 motion / (0.3 + median drums), lowest first."""
    return sorted(scenes, key=lambda s: s["motion_p90"] / (0.3 + s["drums"]))[:n]


# ---------------------------------------------------------------- measuring (needs ffmpeg and PIL)
def frame_metrics(path):
    """Per-second frame metrics, the formulas of metrics.py."""
    from PIL import Image
    im = np.asarray(Image.open(path).convert("RGB")).astype(np.float32) / 255
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    Y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    mx, mn = im.max(-1), im.min(-1)
    sat = np.where(mx > 0.04, (mx - mn) / np.maximum(mx, 1e-6), 0)
    gy, gx = np.gradient(Y)
    hsv = np.asarray(Image.open(path).convert("HSV")).astype(np.float32)
    m = (hsv[..., 1] > 90) & (hsv[..., 2] > 60)
    hue = None
    if m.mean() > 0.01:
        h = hsv[..., 0][m] / 255 * 360
        hue = int(np.argmax(np.histogram(h, bins=12, range=(0, 360))[0]) * 30 + 15)
    small = np.asarray(Image.open(path).convert("L").resize((64, 36), Image.BILINEAR)).astype(np.float32) / 255
    return dict(luma=float(Y.mean()), black=float((Y < 0.06).mean()), dark09=float((Y < 0.09).mean()),
                sat=float(sat.mean()), sat_area=float(m.mean()), edges=float((np.hypot(gx, gy) > 0.08).mean()),
                hue=hue), small


def decode(video, vf, w, h, ch, ss=None, frames=None):
    pix = {1: "gray", 3: "rgb24"}[ch]
    seek = ["-ss", f"{ss:.3f}"] if ss is not None else []
    count = ["-frames:v", str(frames)] if frames else []
    raw = subprocess.run(["ffmpeg", "-v", "error", *seek, "-i", str(video), "-an", "-vf", f"{vf},scale={w}:{h},format={pix}",
                          *count, "-fps_mode", "passthrough", "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w, ch) if ch > 1 else np.frombuffer(raw, np.uint8).reshape(-1, h, w)


def cuts_and_motion(rgb, fps):
    """metrics.py's detector on the 96×54 stream: per-frame difference d, hard cuts, per-second median motion."""
    d = np.zeros(len(rgb) - 1, np.float32)
    q = np.zeros((len(rgb), 512), np.float32)
    for i in range(0, len(rgb), 600):  # in chunks: a 4 minute 60 fps stream is 200 MB as float
        blk = rgb[i:i + 601].astype(np.float32)
        d[i:i + len(blk) - 1] = np.abs(np.diff(blk, axis=0)).mean(axis=(1, 2, 3))
    for i, f in enumerate(rgb):
        qq = (f // 32).astype(np.int32)
        q[i] = np.bincount((qq[..., 0] * 64 + qq[..., 1] * 8 + qq[..., 2]).ravel(), minlength=512) / (f.shape[0] * f.shape[1])
    hd = 0.5 * np.abs(np.diff(q, axis=0)).sum(1)
    cuts = []
    for i in range(len(d)):
        nb = np.concatenate([d[max(0, i - 8):i], d[i + 1:i + 9]])
        if d[i] > 10 and d[i] > 3 * (np.median(nb) if len(nb) else 0) + 4 and hd[i] > 0.12:
            cuts.append((i + 1) / fps)
    secs = int(np.ceil(len(d) / fps))
    return d, cuts, [float(np.median(d[s * fps:(s + 1) * fps])) for s in range(secs)]


def accent_frames(rgb):
    """Per frame of the 96×54 stream: does a saturated hue cover more than 1 % (metrics.py's accent test)?"""
    f = rgb.astype(np.float32)
    mx, mn = f.max(-1), f.min(-1)
    s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0) * 255
    return (((s > 90) & (mx > 60)).mean(axis=(1, 2)) > 0.01)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True)
    ap.add_argument("--video", required=True)
    ap.add_argument("--offset", type=float, default=0.0)
    ap.add_argument("--name", default="audit")
    o = ap.parse_args()
    vdir = ROOT / "projects" / o.project / "video"
    out = vdir / "audit" / o.name
    (out / "strips").mkdir(parents=True, exist_ok=True)
    fps = 60  # metrics.py measures the references at 60 fps; resampling to it keeps motion comparable and indices exact

    # per second, as REFERENCE-VIDEOS.md "Measuring a render"
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["ffmpeg", "-v", "error", "-i", o.video, "-vf", "fps=1:round=down,scale=640:360", "-q:v", "3",
                        f"{tmp}/%04d.jpg"], check=True)
        rows, smalls = [], []
        for p in sorted(Path(tmp).glob("*.jpg")):
            m, s = frame_metrics(p)
            rows.append(m)
            smalls.append(s)
    for i, r in enumerate(rows):
        r["change"] = float(np.abs(smalls[i] - smalls[i - 1]).mean()) if i else 0.0
    rgb = decode(o.video, f"fps={fps}", 96, 54, 3)
    d, cuts, motion = cuts_and_motion(rgb, fps)
    for i, r in enumerate(rows):
        r["motion"] = motion[i] if i < len(motion) else 0.0
    duration = len(rgb) / fps
    film = film_summary(rows, cuts, duration)

    # the references, from their metrics.json
    refs = {}
    for label, key in REFS.items():
        M = json.load(open(REF_DIR / key / "metrics.json"))
        refs[label] = film_summary(M["rows"], M["cuts"], len(M["rows"]))
    film_rows = [(k, lbl, film[k], [refs[r][k] for r in REFS], band_verdict(film[k], [refs[r][k] for r in REFS], side))
                 for k, lbl, side in FILM_METRICS]

    # guideline motion (docs/visual-guidelines.md "How to measure": 10 fps, 320x180 gray); its thresholds apply only to this
    gray = decode(o.video, every(10), 320, 180, 1).astype(np.float32)
    gmo = np.concatenate([[0], np.abs(np.diff(gray, axis=0)).mean(axis=(1, 2))])

    # highlight as visual-guidelines defines it: signalstats YHIGH (90th percentile of the Y plane, 0–255), 480×270, 4 fps
    yhigh = np.percentile(decode(o.video, every(4) + ",scale=480:270,format=yuv420p,extractplanes=y", 480, 270, 1).reshape(-1, 480 * 270), 90, axis=1)

    # per scene, on the 60 fps stream, over the part of the scene this video covers
    audio = json.load(open(ROOT / "projects" / o.project / "data" / "audio.json"))
    drums, afps = np.array(audio["drums"]), audio["fps"]
    acc = accent_frames(rgb)
    sb = (vdir / "STORYBOARD.md").read_text()
    m = re.search(r'^light:.*"accent":\s*"#([0-9a-fA-F]{6})"', sb, re.M)
    rgb_acc = [int(m.group(1)[i:i + 2], 16) / 255 for i in (0, 2, 4)] if m else [232 / 255, 93 / 255, 38 / 255]
    accent_hue = float(np.degrees(np.arctan2(np.sqrt(3) * (rgb_acc[1] - rgb_acc[2]), 2 * rgb_acc[0] - rgb_acc[1] - rgb_acc[2])) % 360)
    small = decode(o.video, every(4), 320, 180, 3)
    lum = (rgb.astype(np.float32) @ np.array([0.2126, 0.7152, 0.0722], np.float32)) / 255
    scenes = []
    prev_map = None
    for sid, A, B in scene_spans(sb):
        span = clip_span(A, B, o.offset, o.offset + duration)
        if not span or span[1] - span[0] < 0.25:
            continue
        a, b = span
        i0, i1 = samples(a - o.offset, b - o.offset, fps, len(rgb))
        dd = d[internal(i0, i1)]
        g0, g1 = samples(a - o.offset, b - o.offset, 10, len(gmo))
        h0, h1 = samples(a - o.offset, b - o.offset, 4, len(yhigh))
        scenes.append(dict(id=sid, span=[a, b], part=(a, b) != (A, B), motion_p50=float(np.median(dd)), motion_p90=float(np.percentile(dd, 90)),
                           guide_p50=float(np.median(gmo[1:][internal(g0, g1)])) if g1 > g0 + 1 else 0.0,
                           luma=float(np.median(lum[i0:i1].mean(axis=(1, 2)))),
                           highlight=float(np.median(yhigh[h0:h1])) if h1 > h0 else 0.0,
                           black=float((lum[i0:i1] < 0.06).mean()), colour=float(acc[i0:i1].mean()),
                           drums=float(np.median(drums[int(a * afps):int(b * afps)]))))
        s0, s1 = samples(a - o.offset, b - o.offset, 4, len(small))
        fr = small[s0:s1] if s1 > s0 else small[max(0, s0 - 1):s0 + 1]
        lmap = layout_map(fr)
        scenes[-1].update(light=accent_light(fr, accent_hue), layout_prev=float(lmap @ prev_map) if prev_map is not None else None)
        prev_map = lmap

    # still runs (guideline definition) and unseen hits (strong onsets and downbeats that change nothing visible)
    runs = [(a + o.offset, b + o.offset) for a, b in still_runs(gmo, 10)]
    hits = sorted({round(t, 3) for k in ("kick", "snare") for t, s in audio["onsets"][k] if s >= 0.9} | set(audio["downbeats"]))
    judged, unseen = unseen_hits(d, fps, hits, o.offset)

    # strips for the reviewer, one image per scene, six across: row 1 is the cut-in (the first 0.2 s at 30 fps), the
    # rest the scene at 4 fps
    from PIL import Image
    for s in scenes:
        a, b = s["span"]
        fr = small[slice(*samples(a - o.offset, b - o.offset, 4, len(small)))]
        if not len(fr):
            continue
        cut_in = decode(o.video, every(30), 320, 180, 3, ss=a - o.offset, frames=6)
        fr = np.concatenate([cut_in, np.full((-len(cut_in) % 6, 180, 320, 3), 30, np.uint8), fr]) if len(cut_in) else fr
        cols, rows_n = 6, int(np.ceil(len(fr) / 6))
        sheet = Image.new("RGB", (cols * 324, rows_n * 184), (30, 30, 30))
        for k, f in enumerate(fr):
            sheet.paste(Image.fromarray(f), ((k % cols) * 324 + 2, (k // cols) * 184 + 2))
        sheet.save(out / "strips" / f"{s['id']}.jpg", quality=85)

    weak = weakest(scenes)
    json.dump(dict(video=o.video, offset=o.offset, film=film, refs=refs, scenes=scenes, still_runs=runs, unseen_hits=unseen, hits_judged=len(judged),
                   cuts=[round(c + o.offset, 3) for c in cuts], weakest=[s["id"] for s in weak]),
              open(out / "report.json", "w"), indent=1)
    pct = {"change_03", "change_10", "black", "mid", "light", "accent_area", "no_colour"}
    fmt = lambda k, v: f"{v * 100:.0f} %" if k in pct else f"{v:.2f}"  # noqa: E731
    md = [f"# Audit: {o.project} — {Path(o.video).name}", "",
          f"{duration:.1f} s from track {o.offset:.2f}; {len(cuts)} hard cuts. Signals, not targets "
          "(docs/visual-guidelines.md): a flag sends you to the strips (`strips/<scene>.jpg`).", "",
          "## The film against the references", "", "| | this | LGTM | p(doom) | |", "|---|---|---|---|---|"]
    md += [f"| {lbl} | {fmt(k, v)} | {fmt(k, rv[0])} | {fmt(k, rv[1])} | {'' if vd == 'in band' else '**' + vd + '**'} |"
           for k, lbl, v, rv, vd in film_rows]
    md += ["", "## Scenes", "",
           "Frame diff is the cut detector's measure (96×54 RGB at the video's fps) and ranks the weakest scenes; guideline "
           "motion is visual-guidelines' measure (10 fps, 320×180 gray), the one its thresholds and still runs use. Highlight is "
           "its YHIGH (90th-percentile Y, 0–255; flagged under 80). A scene marked (part) is only partly in this video; its "
           "figures and drums cover that part.", "",
           "| scene | frame diff p50 / p90 | guideline motion p50 | luma | highlight | black | colour | accent light | layout vs previous | drums |",
           "|---|---|---|---|---|---|---|---|---|---|"]
    lay = lambda v: "" if v is None else f"**{v:.2f}**" if v > 0.8 else f"{v:.2f}"  # noqa: E731
    md += [f"| {s['id']}{' (part)' if s['part'] else ''} | {s['motion_p50']:.2f} / {s['motion_p90']:.2f} | {s['guide_p50']:.2f} | {s['luma']:.2f} | {s['highlight']:.0f} | "
           f"{s['black'] * 100:.0f} % | {s['colour'] * 100:.0f} % | {s['light'] * 100:.1f} % | {lay(s['layout_prev'])} | {s['drums']:.2f} |"
           for s in scenes]
    md += ["", "Accent light: the share of the frame the accent lights, its halo included. Layout vs previous: "
           "how alike the scene's edge layout is to the scene before it (1 = the same; over 0.8 in bold, a repeated layout)."]
    md += ["", "## Weakest scenes (big motion against their music)", "",
           ", ".join(f"{s['id']} ({s['motion_p90']:.2f} @ drums {s['drums']:.2f})" for s in weak), "",
           "## Still runs (guideline motion < 1.5 for more than 2 s)", "",
           ", ".join(f"{a:.1f}–{b:.1f}" for a, b in runs) or "none", "",
           f"## Unseen hits ({len(unseen)} of the {len(judged)} strong onsets and downbeats this video can judge (of {len(hits)} "
           "in the song; the first and last 0.5 s are not judged) change nothing visible within ±2 frames)", "",
           ", ".join(map(str, unseen)) or "none", ""]
    (out / "report.md").write_text("\n".join(md))
    print("\n".join(md[:8 + len(film_rows)]))
    print(f"\nweakest: {', '.join(s['id'] for s in weak)}\nstill runs: {len(runs)}  unseen hits: {len(unseen)}/{len(judged)}")
    print(f"report: {(out / 'report.md').relative_to(ROOT)}")


if __name__ == "__main__":
    main()
