"""Song-specific analysis constants, one module per song (named by songs.json -> analysis.module).

Each module defines:
  TEMPO_RANGE     analyze.py's tempo search window (BPM); find it with tempo_probe.py
  SECTION_BARS    analyze.py's section map in bars; suggested by sections_bars.py
  WHISPER_PROMPT  whisper_run.py's initial prompt (the song's jargon)
  PRON, ALT       pron.py's display token -> pronunciation spelling overrides
  LINE_WINDOWS, ANCHORS, FIX, EXTRA_DESC, ALIGN_NOTES   align.py's manual inputs and notes
"""
