"""Run faster-whisper (word timestamps) on the vocal stem.

Writes work/whisper_<tag>.json in the shape align.py consumes:
    {"segments": [{"start":.., "end":.., "text":.., "words": [{"word":.., "start":.., "end":..}]}]}
Used as an independent cross-check for the CTC forced alignment in align.py, which
reads work/whisper_turbo_prompt.json.
"""
import common  # noqa: F401  (sets cache dirs)
import json
import sys

import numpy as np
import soundfile as sf
from faster_whisper import WhisperModel

MODELS = {
    "turbo": "large-v3-turbo",
    "large": "large-v3",
}

# The song's jargon, so the decoder does not "correct" it into something commoner.
PROMPT = common.CFG.WHISPER_PROMPT


def vocals16k():
    """The vocal stem as a 16 kHz mono float32 array.

    Handed to transcribe() directly rather than as a path: faster-whisper decodes paths
    through PyAV, whose av.open() no longer takes the metadata_errors kwarg it passes.
    Also written to work/ for inspection.
    """
    y, sr = common.load_vocal_source("vocals", sr=16000)
    y = y.astype(np.float32)
    p = common.WORK / "vocals16k.wav"
    if not p.exists():
        sf.write(p, y, sr)
        print(f"wrote {p} ({len(y) / sr:.1f}s)")
    return y


def load(model_name):
    """CUDA if ctranslate2 can use it, else CPU.

    ctranslate2 links CUDA 12 (libcublas.so.12) while torch here is built against
    CUDA 13, so the GPU path often fails. This is only the cross-check -- the CTC
    emissions that actually set the timings run on the GPU -- so CPU is fine.
    """
    kw = dict(download_root=str(common.CACHE / "faster-whisper"))
    try:
        m = WhisperModel(model_name, device="cuda", compute_type="float16", **kw)
        m.encode(np.zeros((80, 3000), dtype=np.float32))   # force the CUDA load now
        return m
    except Exception as e:
        print(f"[whisper] CUDA unavailable to ctranslate2 ({type(e).__name__}); using CPU")
        return WhisperModel(model_name, device="cpu", compute_type="int8", **kw)


def run(tag, model_name, prompt=None):
    model = load(model_name)
    segments, _info = model.transcribe(
        vocals16k(), language="en", word_timestamps=True,
        condition_on_previous_text=False, initial_prompt=prompt,
        temperature=0.0, no_speech_threshold=None,
    )
    out = {"segments": [
        {"start": s.start, "end": s.end, "text": s.text,
         "words": [{"word": w.word, "start": w.start, "end": w.end,
                    "probability": w.probability} for w in (s.words or [])]}
        for s in segments]}
    f = common.WORK / f"whisper_{tag}.json"
    f.write_text(json.dumps(out, indent=1, default=float))
    for seg in out["segments"]:
        print(f"{seg['start']:7.2f} {seg['end']:7.2f} {seg['text']}")
    return out


if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "turbo"
    run(which, MODELS[which])
    run(which + "_prompt", MODELS[which], PROMPT)   # the one align.py reads
