"""Demucs (htdemucs_ft) stem separation of the song's master into its stems dir (songs.json).

  uv run python separate.py --song <id>

Stems come out at 44.1 kHz in the master's timeline (no offset: see common.STEM_OFFSET_SAMPLES).
"""
import common
import subprocess
import sys

if __name__ == "__main__":
    out = common.STEMS.parent.parent          # stems/<model>/<song>/ -> -o stems
    model = common.STEMS.parent.name
    subprocess.run([sys.executable, "-m", "demucs", "-n", model, "-d", "cuda", "-o", str(out),
                    "--filename", f"{common.STEMS.name}/{{stem}}.{{ext}}", str(common.AUDIO)], check=True)
    common.check_source(common.STEMS)
    print("stems in", common.STEMS)
