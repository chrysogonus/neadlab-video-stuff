"""Shared paths / cache setup for the analysis scripts.

Import this module FIRST (before torch / huggingface / mlx imports) so that all
model downloads land in analysis/.cache/.
"""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent          # analysis/
REPO = ROOT.parent                               # repo root
CACHE = ROOT / ".cache"
for var, sub in [("TORCH_HOME", "torch"), ("HF_HOME", "hf"), ("HF_HUB_CACHE", "hf/hub"),
                 ("XDG_CACHE_HOME", "xdg"), ("HUGGINGFACE_HUB_CACHE", "hf/hub"),
                 ("TRANSFORMERS_CACHE", "hf/transformers"), ("MPLCONFIGDIR", "mpl"),
                 ("NUMBA_CACHE_DIR", "numba"), ("UV_CACHE_DIR", "uv")]:
    os.environ.setdefault(var, str(CACHE / sub))
    (CACHE / sub).mkdir(parents=True, exist_ok=True)

# The project, one directory under projects/ (each with a project.json, which the renderer reads too):
# `--project <id>` on any analysis script's command line, else the PROJECT environment variable, else the
# only project there is. Every project-dependent path and constant follows from it.
import hashlib
import importlib.util
import json
import sys
import types

PROJECTS = REPO / "projects"


def project_ids():
    return sorted(p.name for p in PROJECTS.iterdir() if (p / "project.json").is_file())


def _pick_project():
    ids = project_ids()
    if "--project" in sys.argv:
        i = sys.argv.index("--project")
        if i + 1 >= len(sys.argv):
            raise SystemExit("--project needs a value: " + ", ".join(ids))
        pid = sys.argv[i + 1]
        del sys.argv[i:i + 2]          # (the scripts read their own positional args)
    else:
        pid = os.environ.get("PROJECT") or (ids[0] if len(ids) == 1 else None)
    if pid is None:
        raise SystemExit("choose a project with --project <id>: " + ", ".join(ids))
    if pid not in ids:
        raise SystemExit(f"unknown project {pid!r}; projects/ has: " + ", ".join(ids))
    return pid


# Analysis settings a project may set by hand in projects/<id>/tuning.py. None means "detect it"
# (see analyze.py); the dicts and lists are manual corrections, verified on the QA plots.
TUNING_DEFAULTS = dict(
    TEMPO_RANGE=None,      # (lo, hi) BPM window of the constant-tempo grid search
    GRID=None,             # "constant" | "tracked"
    BAR_PHASE=None,        # index (0..3) of the first beat that is a downbeat
    SECTION_BARS=None,     # [(name, first bar | None, end bar | None)]
    WHISPER_PROMPT=None,   # the transcript's jargon, so Whisper does not "correct" it
    SUNG=None,             # {line: what is sung} where the vocal differs from the transcript
    PRON={}, ALT={}, LINE_WINDOWS={}, ANCHORS={}, FIX={}, EXTRA_DESC=[],
    ALIGN_NOTES="",
)


def _load_tuning(path):
    cfg = types.SimpleNamespace(**TUNING_DEFAULTS)
    if path.exists():
        spec = importlib.util.spec_from_file_location(f"tuning_{PROJECT.replace('-', '_')}", path)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        for k in TUNING_DEFAULTS:
            if hasattr(mod, k):
                setattr(cfg, k, getattr(mod, k))
    return cfg


PROJECT = _pick_project()
DIR = PROJECTS / PROJECT
SPEC = json.loads((DIR / "project.json").read_text())
KIND = SPEC.get("kind", "song")
CFG = _load_tuning(DIR / "tuning.py")

# The lossless master is the one time reference for everything: the stems are separated
# from it, the analysis reads it, and the export muxes it. No mp3 decode is involved
# anywhere in this pipeline, so there is no encoder delay to correct (see STEM_OFFSET_SAMPLES).
AUDIO = DIR / SPEC["audio"]
SHEET = DIR / SPEC["transcript"]
DATA = DIR / "data"                  # what the renderer reads (committed)
LYRICS_SRC = DATA / "lines.txt"      # the sung/spoken lines, derived from the transcript
SECTIONS_SRC = DATA / "sections.json"
WORK = DIR / "work"                  # intermediate results (stems, emissions, whisper json, alignments)
STEMS = WORK / "stems" / "htdemucs_ft"
QA = WORK / "qa"
QA.mkdir(parents=True, exist_ok=True)
WORK.mkdir(parents=True, exist_ok=True)
DATA.mkdir(parents=True, exist_ok=True)
if not AUDIO.exists():
    raise SystemExit(f"[{PROJECT}] audio not found: {AUDIO}")


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
    return dict(project=PROJECT, file=SPEC["audio"], sha256=MASTER_SHA256,
                sample_rate=info.samplerate, frames=info.frames,
                duration=round(info.frames / info.samplerate, 6))


def check_source(d):
    """Cached results in `d` (stems, work files) belong to this master: refuse them otherwise.

    The first use stamps the directory with the master's hash; a later master (a new mix,
    another project pointed at the same dir) then fails loudly instead of reusing stale caches.
    """
    stamp = d / "source.json"
    if stamp.exists():
        got = json.loads(stamp.read_text()).get("sha256")
        if got != MASTER_SHA256:
            raise SystemExit(f"[{PROJECT}] {d} was made from another master (sha256 {got[:12]}..., "
                             f"master is {MASTER_SHA256[:12]}...). Delete it and rerun.")
    elif d.exists():
        stamp.write_text(json.dumps(dict(project=PROJECT, file=SPEC["audio"], sha256=MASTER_SHA256), indent=1))


MASTER_SHA256 = _sha256(AUDIO)
check_source(WORK)
if STEMS.exists():
    check_source(STEMS)


def load_lyrics_src(sung=True):
    """Read the project's lines file -> list of (start, end, text), one row per sung or spoken line,
    with the lines sung differently from the transcript (data/sung.json, see sung.py) as sung.

    The alignment is driven by the text and the audio alone; align.py destructures the
    two time fields and never reads them, so they are None.
    """
    lines = [" ".join(l.split()) for l in LYRICS_SRC.read_text(encoding="utf-8").splitlines() if l.strip()]
    if sung and (DATA / "sung.json").exists():
        heard = json.loads((DATA / "sung.json").read_text())["lines"]
        lines = [heard.get(str(i), l) for i, l in enumerate(lines)]
    return [(None, None, l) for l in lines]


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


KARAOKE = WORK / "stems" / "karaoke"


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
