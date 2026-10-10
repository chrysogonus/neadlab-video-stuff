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

# The song. The renderer keeps its own copy of this in app/src/song.ts.
SONG = "harvest"

# The lossless master is the one time reference for everything: the stems are separated
# from it, the analysis reads it, and the export muxes it. No mp3 decode is involved
# anywhere in this pipeline, so there is no encoder delay to correct (see STEM_OFFSET_SAMPLES).
AUDIO = PROJECT / "audio" / f"{SONG}.wav"
STEMS = ROOT / "stems" / "htdemucs_ft" / SONG
LYRICS_SRC = PROJECT / "lyrics" / "lyrics.txt"
DATA = PROJECT / "data"
QA = ROOT / "qa"
WORK = ROOT / "work"          # intermediate results (whisper json, alignments)
QA.mkdir(exist_ok=True)
WORK.mkdir(exist_ok=True)
DATA.mkdir(exist_ok=True)


def load_lyrics_src():
    """Read lyrics.txt -> list of (start, end, text), one row per sung line.

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


KARAOKE = ROOT / "stems" / "karaoke"


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
