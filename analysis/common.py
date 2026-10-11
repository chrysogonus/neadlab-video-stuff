"""Shared paths / cache setup for the analysis scripts.

Import this module FIRST (before torch / huggingface / mlx imports) so that all
model downloads land in analysis/.cache/.
"""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent          # analysis/
PROJECT = ROOT.parent                            # repo root
CACHE = ROOT / ".cache"
for var, sub in [("TORCH_HOME", "torch"), ("HF_HOME", "hf"), ("HF_HUB_CACHE", "hf/hub"),
                 ("XDG_CACHE_HOME", "xdg"), ("HUGGINGFACE_HUB_CACHE", "hf/hub"),
                 ("TRANSFORMERS_CACHE", "hf/transformers"), ("MPLCONFIGDIR", "mpl"),
                 ("NUMBA_CACHE_DIR", "numba"), ("UV_CACHE_DIR", "uv")]:
    os.environ.setdefault(var, str(CACHE / sub))
    (CACHE / sub).mkdir(parents=True, exist_ok=True)

# The song, chosen from the shared manifest (songs.json, which the renderer reads too):
# `--song <id>` on any analysis script's command line, else the SONG environment variable,
# else the manifest's default. Every song-dependent path and constant follows from it.
import hashlib
import importlib
import json
import sys

MANIFEST = json.loads((PROJECT / "songs.json").read_text())


def _pick_song():
    if "--song" in sys.argv:
        i = sys.argv.index("--song")
        if i + 1 >= len(sys.argv):
            raise SystemExit("--song needs a value: " + ", ".join(MANIFEST["songs"]))
        song = sys.argv[i + 1]
        del sys.argv[i:i + 2]          # (the scripts read their own positional args)
    else:
        song = os.environ.get("SONG", MANIFEST["default"])
    if song not in MANIFEST["songs"]:
        raise SystemExit(f"unknown song {song!r}; songs.json has: " + ", ".join(MANIFEST["songs"]))
    return song


SONG = _pick_song()
SPEC = MANIFEST["songs"][SONG]
# song-specific constants (tempo window, section map, transcription prompt, alignment fixes)
CFG = importlib.import_module(f"songs.{SPEC['analysis']['module']}")

# The lossless master is the one time reference for everything: the stems are separated
# from it, the analysis reads it, and the export muxes it. No mp3 decode is involved
# anywhere in this pipeline, so there is no encoder delay to correct (see STEM_OFFSET_SAMPLES).
AUDIO = PROJECT / SPEC["master"]
STEMS = PROJECT / SPEC["analysis"]["stems"]
SHEET = PROJECT / SPEC["sheet"]
LYRICS_SRC = PROJECT / SPEC["lines"]
SECTIONS_SRC = PROJECT / SPEC["sections"]
DATA = PROJECT / SPEC["data"]
QA = PROJECT / SPEC["analysis"]["qa"]
WORK = PROJECT / SPEC["analysis"]["work"]   # intermediate results (whisper json, alignments)
QA.mkdir(parents=True, exist_ok=True)
WORK.mkdir(parents=True, exist_ok=True)
DATA.mkdir(parents=True, exist_ok=True)
if not AUDIO.exists():
    raise SystemExit(f"[{SONG}] master not found: {AUDIO}")


def _sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


def source():
    """Identity of the master every result here derives from (written into the emitted JSON)."""
    import soundfile as sf
    info = sf.info(str(AUDIO))
    return dict(song=SONG, file=SPEC["master"], sha256=MASTER_SHA256,
                sample_rate=info.samplerate, frames=info.frames,
                duration=round(info.frames / info.samplerate, 6))


def check_source(d):
    """Cached results in `d` (stems, work files) belong to this master: refuse them otherwise.

    The first use stamps the directory with the master's hash; a later master (a new mix,
    another song pointed at the same dir) then fails loudly instead of reusing stale caches.
    """
    stamp = d / "source.json"
    if stamp.exists():
        got = json.loads(stamp.read_text()).get("sha256")
        if got != MASTER_SHA256:
            raise SystemExit(f"[{SONG}] {d} was made from another master (sha256 {got[:12]}..., "
                             f"master is {MASTER_SHA256[:12]}...). Delete it and rerun.")
    elif d.exists():
        stamp.write_text(json.dumps(dict(song=SONG, file=SPEC["master"], sha256=MASTER_SHA256), indent=1))


MASTER_SHA256 = _sha256(AUDIO)
check_source(WORK)
if STEMS.exists():
    check_source(STEMS)


def load_lyrics_src():
    """Read the song's lyric lines file -> list of (start, end, text), one row per sung line.

    The alignment is driven by the text and the audio alone; align.py destructures the
    two time fields and never reads them, so they are None.
    """
    lines = [l.strip() for l in LYRICS_SRC.read_text(encoding="utf-8").splitlines()]
    return [(None, None, " ".join(l.split())) for l in lines if l]


# Zero by construction: Demucs separates the same WAV master that AUDIO points at, so
# stem time is master time. (The original song went through an mp3 whose LAME encoder
# delay had to be measured and subtracted here; with a WAV master there is no delay.)
STEM_OFFSET_SAMPLES = 0
STEM_OFFSET_SEC = 0.0


def load_stem(name, sr=None, mono=True):
    """Load a Demucs stem (already in master time, see STEM_OFFSET_SAMPLES)."""
    import soundfile as sf
    import numpy as np
    y, s = sf.read(STEMS / f"{name}.wav", dtype="float32", always_2d=True)
    y = y[STEM_OFFSET_SAMPLES:]
    y = y.mean(axis=1) if mono else y.T
    if sr and sr != s:
        import soxr
        y = soxr.resample(y, s, sr) if mono else np.stack([soxr.resample(c, s, sr) for c in y])
        s = sr
    return y, s


KARAOKE = ROOT / "stems" / "karaoke" / SONG


def load_lead(sr=None, mono=True):
    """Lead vocal only (mel-band-roformer karaoke model run on the master)."""
    import soundfile as sf
    import numpy as np
    y, s = sf.read(KARAOKE / "lead.wav", dtype="float32", always_2d=True)
    y = y.mean(axis=1) if mono else y.T
    if sr and sr != s:
        import soxr
        y = soxr.resample(y, s, sr) if mono else np.stack([soxr.resample(c, s, sr) for c in y])
        s = sr
    return y, s


def load_vocal_source(name, sr=None):
    """'vocals' = Demucs vocal stem (mono sum), 'vocL'/'vocR' = its left/right
    channel (choruses are double-tracked and panned L/R, so each channel is
    closer to a single voice), 'lead' = karaoke lead."""
    if name == "lead":
        return load_lead(sr)
    if name in ("vocL", "vocR"):
        y, s = load_stem("vocals", sr=sr, mono=False)
        return y[0 if name == "vocL" else 1], s
    return load_stem("vocals", sr=sr)


def load_mix(sr=44100, mono=True):
    import librosa
    y, s = librosa.load(str(AUDIO), sr=sr, mono=mono)
    return y, s
