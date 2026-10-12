"""Demucs (htdemucs_ft) stem separation of the project's master into work/stems/htdemucs_ft/.

  uv run python separate.py --project <id>

Stems come out at 44.1 kHz in the master's timeline (no offset: see common.STEM_OFFSET_SAMPLES).
"""
import common
import subprocess
import sys

if __name__ == "__main__":
    out = common.STEMS.parent                 # work/stems/<model>/ -> -o work/stems
    model = common.STEMS.name
    subprocess.run([sys.executable, "-m", "demucs", "-n", model, "-d", "cuda", "-o", str(out),
                    "--filename", "{stem}.{ext}", str(common.AUDIO)], check=True)
    common.check_source(common.STEMS)
    print("stems in", common.STEMS)
