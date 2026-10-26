"""The light pass: p(doom)'s post chain (git show fa164b7:app/src/engine/post.ts) over a rendered film or stills.

    uv run python finish.py --project <id> --video <raw.mp4> --out <mp4> [--offset <s>]
    uv run python finish.py --project <id> --stills <png,...> --times <track s,...>

The accent emits light: pixels near the accent hue are lifted into HDR (× boost) for the bloom source only, so the
7-mip bloom pyramid (Jimenez 13-tap down, tent up) and the red-orange halation grow around them while the cream type
stays crisp, the palette rule of p(doom) ("only signal/ember glow; bone type never blooms"). Then radial chromatic
aberration, the tone shoulder, a vignette and mid-tone grain with dither. The pyramid works at the logical 1080p
whatever the output size, so a 4K master has the same light as a proof. torch, on the GPU when there is one (a 1080p
frame is milliseconds there; x264 sets the pace), else the CPU (the tests).

./vid runs it for a project whose finish layer leaves grain, vignette and glow to it (the template's, from 2026-10-26);
STORYBOARD.md's frontmatter then sets `light: {"accent": "#hex", ...}` (film settings over DEFAULT), and a frame
block's `- light: {...}` overrides them for that frame's span.
"""
import argparse
import functools
import json
import re
import subprocess
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F

ROOT = Path(__file__).resolve().parent.parent
LOGICAL_W = 1920
MIPS = 7
# p(doom)'s defaults, plus: boost (how far the accent is lifted into HDR for the bloom source), hue_tol (degrees around
# the accent that count as emitting) and knee_k (the shoulder starts above the cream ink, so unlit type is unchanged)
DEFAULT = dict(bloom=0.55, threshold=0.85, knee=0.5, radius=0.75, halation=0.25, ca=1.2, grain=0.055, vignette=0.35,
               boost=1.6, hue_tol=28.0, knee_k=0.9)


# ---------------------------------------------------------------- settings from STORYBOARD.md
def light_settings(storyboard):
    """(film settings or None when the project does not use the pass, [(start, end, overrides)] per frame)."""
    head = re.match(r"---\n(.*?)\n---", storyboard, re.S)
    m = re.search(r"^light:\s*(\{.*\})\s*$", head.group(1) if head else "", re.M)
    if not m:
        return None, []
    film = {**DEFAULT, **json.loads(m.group(1))}
    if "accent" not in film:
        raise ValueError("STORYBOARD.md light: needs an accent (\"#rrggbb\")")
    frames = []
    for block in re.split(r"\n(?=## Frame )", storyboard):
        span = re.search(r"^- span_sec:\s*\[([\d.]+),\s*([\d.]+)\]", block, re.M)
        over = re.search(r"^- light:\s*(\{.*\})\s*$", block, re.M)
        if span and over:
            frames.append((float(span.group(1)), float(span.group(2)), json.loads(over.group(1))))
    return film, frames


def settings_at(t, film, frames):
    for a, b, over in frames:
        if a <= t < b:
            return {**film, **over}
    return film


# ---------------------------------------------------------------- the chain (torch, float32, NCHW)
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
LUMA = torch.tensor([0.2126, 0.7152, 0.0722]).view(1, 3, 1, 1)
SRGB_TO_LIN = torch.tensor([(c / 12.92) if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in np.arange(256) / 255],
                           dtype=torch.float32)


def luma(x):
    return (x * LUMA.to(x.device)).sum(1, keepdim=True)


def to_srgb(x):
    return torch.where(x <= 0.0031308, 12.92 * x, 1.055 * x.clamp(min=0.0031308) ** (1 / 2.4) - 0.055)


def resize(x, h, w):
    """Bilinear, texel centres aligned (sampling a smaller texture at a larger one's UVs)."""
    return F.interpolate(x, size=(h, w), mode="bilinear", align_corners=False)


def down13(src):
    """The 13-tap downsample (Jimenez 2014) to half size."""
    p = F.pad(src, (2, 2, 2, 2), mode="replicate")
    H, W = src.shape[2], src.shape[3]
    s = lambda dy, dx: p[:, :, 2 + dy:2 + dy + H:2, 2 + dx:2 + dx + W:2]  # noqa: E731
    a, b, c, d, e = s(-2, -2), s(-2, 0), s(-2, 2), s(-1, -1), s(-1, 1)
    f, g, h, i, j = s(0, -2), s(0, 0), s(0, 2), s(1, -1), s(1, 1)
    k, l, m = s(2, -2), s(2, 0), s(2, 2)
    return (d + e + i + j) * 0.125 + (a + b + g + f + b + c + h + g + f + g + l + k + g + h + m + l) * 0.03125


@functools.lru_cache(maxsize=8)
def _grid(h, w, device):
    """Pixel-centre sampling grid for grid_sample (align_corners=False)."""
    y = (torch.arange(h, dtype=torch.float32, device=device) + 0.5) / h * 2 - 1
    x = (torch.arange(w, dtype=torch.float32, device=device) + 0.5) / w * 2 - 1
    return torch.stack(torch.meshgrid(x, y, indexing="xy"), -1)[None]


def tent(src, r):
    """The 9-tap tent at r texels (bilinear taps, edges clamped)."""
    h, w = src.shape[2], src.shape[3]
    g = _grid(h, w, src.device)
    tap = lambda dy, dx: F.grid_sample(src, g + torch.tensor([2 * dx / w, 2 * dy / h], device=src.device),  # noqa: E731
                                       mode="bilinear", padding_mode="border", align_corners=False)
    o = [tap(dy, dx) for dy in (-r, 0, r) for dx in (-r, 0, r)]
    return (o[0] + 2 * o[1] + o[2] + 2 * o[3] + 4 * o[4] + 2 * o[5] + o[6] + 2 * o[7] + o[8]) / 16


def accent_key(srgb, accent, tol):
    """0..1 per pixel: how much this pixel is the accent (hue within tol degrees, saturated, not dark)."""
    mx, mn = srgb.amax(1, keepdim=True), srgb.amin(1, keepdim=True)
    sat = torch.where(mx > 1e-4, (mx - mn) / mx.clamp(min=1e-4), torch.zeros_like(mx))
    r, g, b = srgb[:, 0:1], srgb[:, 1:2], srgb[:, 2:3]
    hue = torch.rad2deg(torch.atan2(3 ** 0.5 * (g - b), 2 * r - g - b)) % 360
    ar, ag, ab = (int(accent[i:i + 2], 16) / 255 for i in (1, 3, 5))
    ahue = float(np.degrees(np.arctan2(3 ** 0.5 * (ag - ab), 2 * ar - ag - ab)) % 360)
    dh = ((hue - ahue + 180) % 360 - 180).abs()
    return (1 - dh / tol).clamp(0, 1) * ((sat - 0.35) / 0.25).clamp(0, 1) * ((mx - 0.2) / 0.2).clamp(0, 1)


def bloom_light(lin, srgb, p):
    """The light the accent sheds, at half the logical resolution: bloom (ups[0]) plus halation (ups[3])."""
    k = max(1, lin.shape[3] // LOGICAL_W) * 2
    half, half_srgb = F.avg_pool2d(lin, k), F.avg_pool2d(srgb, k)
    c = half * accent_key(half_srgb, p["accent"], p["hue_tol"]) * p["boost"]
    mx = c.amax(1, keepdim=True)
    rq = (mx - p["threshold"] + p["knee"]).clamp(0, 2 * p["knee"]) ** 2 / (4 * p["knee"] + 1e-5)
    mips = [c * torch.maximum(rq, mx - p["threshold"]) / mx.clamp(min=1e-5)]
    for _ in range(1, MIPS):
        mips.append(down13(mips[-1]))
    ups = [None] * MIPS
    prev = mips[-1]
    for i in range(MIPS - 2, -1, -1):
        ups[i] = mips[i] + resize(tent(prev, 0.5 + p["radius"]), mips[i].shape[2], mips[i].shape[3])
        prev = ups[i]
    halo = luma(resize(ups[3], ups[0].shape[2], ups[0].shape[3]))
    tint = torch.tensor([1.0, 0.18, 0.04], device=lin.device).view(1, 3, 1, 1)
    return ups[0] * (p["bloom"] / 3) + tint * halo * p["halation"]


@functools.lru_cache(maxsize=4)
def vignette_map(h, w, device):
    g = _grid(h, w, device)[0] / 2  # dc = uv - 0.5
    t = (((g[..., 0] ** 2 + (g[..., 1] * 0.8) ** 2).sqrt() - 0.95) / (0.25 - 0.95)).clamp(0, 1)
    return (t * t * (3 - 2 * t))[None, None]


@functools.lru_cache(maxsize=4)
def ca_grids(h, w, ca, device):
    """Where R and B are read from: radially outward and inward, by up to ~2.5 logical px at the edges."""
    g = _grid(h, w, device)
    dc = g / 2
    r2 = (dc[..., 0] * w / h) ** 2 + dc[..., 1] ** 2
    off = dc * r2[..., None] * (ca * 4 / LOGICAL_W) * 2  # p(doom)'s uv offset (dc * r2 * ca / res.x * 4) in grid units
    return g + off, g - off


def finish(img, p, seed):
    """One frame, uint8 RGB (H, W, 3) numpy -> uint8 RGB numpy, deterministic in (img, p, seed) on a device."""
    h, w = img.shape[:2]
    scale = w / LOGICAL_W
    x8 = torch.from_numpy(img.copy()).to(DEVICE).permute(2, 0, 1)[None].long()
    lin = SRGB_TO_LIN.to(DEVICE)[x8]
    srgb = x8.float() / 255
    col = lin
    if p["ca"]:
        gr, gb = ca_grids(h, w, float(p["ca"]), DEVICE)
        smp = lambda ch, g: F.grid_sample(lin[:, ch:ch + 1], g, mode="bilinear", padding_mode="border", align_corners=False)  # noqa: E731
        col = torch.cat([smp(0, gr), lin[:, 1:2], smp(2, gb)], 1)
    if p["bloom"] or p["halation"]:  # light falls around the accent, not on it: its own pixels keep their colour
        k2 = max(1, w // LOGICAL_W) * 2
        key = resize(accent_key(F.avg_pool2d(srgb, k2), p["accent"], p["hue_tol"]), h, w)
        col = col + resize(bloom_light(lin, srgb, p), h, w) * (1 - key)
    k = p["knee_k"]  # the shoulder: identity below k, exponential above, very bright values toward white
    col = torch.where(col > k, k + (1 - k) * (1 - torch.exp(-(col - k) / (1 - k))), col)
    over = col.amax(1, keepdim=True)
    col = col + (1 - col) * ((over - 2) / 10).clamp(0, 1) * 0.85
    if p["vignette"]:
        col = col * (1 - p["vignette"] + p["vignette"] * vignette_map(h, w, DEVICE))
    s = to_srgb(col.clamp(0, 1))
    if p["grain"]:  # two scales, stronger in the mid-tones; the fine one per output px, raised so 4K matches a proof
        gen = torch.Generator(DEVICE).manual_seed(seed)
        rnd = lambda *sh: torch.rand(*sh, generator=gen, device=DEVICE)  # noqa: E731
        g1 = (rnd(1, 1, h, w) - 0.5) * scale
        c = max(1, round(2 * scale))
        g2 = (rnd(1, 1, -(-h // c), -(-w // c)) - 0.5).repeat_interleave(c, 2).repeat_interleave(c, 3)[:, :, :h, :w]
        lm = luma(s)
        s = s + (g1 * 0.6 + g2 * 0.4) * p["grain"] * (0.55 + 1.2 * lm * (1 - lm))
        s = s + (rnd(1, 1, h, w) - 0.5) / 255
    return (s * 255).round().clamp(0, 255).to(torch.uint8)[0].permute(1, 2, 0).cpu().numpy()


# ---------------------------------------------------------------- video and stills
def probe(video):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate",
                          "-of", "json", str(video)], capture_output=True, check=True, text=True).stdout
    s = json.loads(out)["streams"][0]
    num, den = map(int, s["r_frame_rate"].split("/"))
    return s["width"], s["height"], num / den


@torch.inference_mode()
def finish_video(video, out, offset, film, frames):
    w, h, fps = probe(video)
    dec = subprocess.Popen(["ffmpeg", "-v", "error", "-i", str(video), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}", "-r", f"{fps}", "-i", "-",
                            "-i", str(video), "-map", "0:v", "-map", "1:a?", "-c:a", "copy",
                            "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-tune", "grain", "-x264-params", "aq-mode=3",
                            "-pix_fmt", "yuv420p", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
                            "-movflags", "+faststart", str(out)], stdin=subprocess.PIPE)
    size, n = w * h * 3, 0
    while (buf := dec.stdout.read(size)) and len(buf) == size:
        t = offset + n / fps
        enc.stdin.write(finish(np.frombuffer(buf, np.uint8).reshape(h, w, 3), settings_at(t, film, frames), round(t * 1000)).tobytes())
        n += 1
        if n % 600 == 0:
            print(f"  {n} frames ({n / fps:.0f} s)", flush=True)
    enc.stdin.close()
    if dec.wait() or enc.wait():
        raise SystemExit("finish: ffmpeg failed")
    print(f"light pass ({DEVICE.type}): {n} frames -> {out}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True)
    ap.add_argument("--video")
    ap.add_argument("--out")
    ap.add_argument("--offset", type=float, default=0.0)
    ap.add_argument("--stills")
    ap.add_argument("--times")
    o = ap.parse_args()
    film, frames = light_settings((ROOT / "projects" / o.project / "video" / "STORYBOARD.md").read_text())
    if film is None:
        raise SystemExit('finish: STORYBOARD.md needs light: {"accent": "#rrggbb"} in its frontmatter: this project\'s finish layer '
                         "leaves grain, vignette and glow to the light pass (assets/kit/README.md)")
    if o.video:
        finish_video(o.video, o.out, o.offset, film, frames)
        return
    from PIL import Image
    for f, t in zip(o.stills.split(","), map(float, o.times.split(","))):
        img = np.asarray(Image.open(f).convert("RGB"))
        with torch.inference_mode():
            Image.fromarray(finish(img, settings_at(t, film, frames), round(t * 1000))).save(f)
    print(f"light pass: {len(o.stills.split(','))} stills")


if __name__ == "__main__":
    main()
