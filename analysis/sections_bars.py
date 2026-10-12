"""SECTION_BARS from the aligned lyrics and the beat grid (analyze.py calls section_bars(); run this
script to print the table it derives).

The form comes from the project's data/sections.json (derived from the bracketed headers in
the transcript by lyrics_sheet.py); the bar of each section's first sung line comes from
its data/lyrics.json against the grid in its data/audio.json.

Rule: a section starts on the LATEST DOWNBEAT AT OR BEFORE its first sung line --
the same "never after the word" convention timeline.ts's cut() uses for beats. A
section must never begin after its own first word, or its plate appears late and the
previous plate is still on screen over it. The cost is that a boundary can land in the
tail of the previous line's held last note, which is where a cut belongs anyway.

A project can still pin SECTION_BARS in its tuning.py; analyze.py then uses that list.

  uv run python sections_bars.py --project <id>
"""
import common
import json

import numpy as np


def section_rows(downbeats, lines, secs):
    """One row per section of `secs` (sections.json, markers excluded): the bar its first line falls in."""
    dbs = np.asarray(downbeats)
    # bar position from the downbeats themselves (a tracked grid has no constant bar length)
    bar_of = lambda t: float(np.interp(t, dbs, np.arange(len(dbs)), left=(t - dbs[0]) / (dbs[1] - dbs[0]) if t < dbs[0] else 0))
    rows = []
    for sec in secs:
        line = lines[sec["first_line"]]
        b = bar_of(line["start"])
        k = int(b // 1)                      # floor: never after the first word
        rows.append(dict(name=sec["name"], line=sec["first_line"], bar=k, raw=b,
                         into=(b - k) * 4, t=line["start"], lead=line["start"] - (dbs[k] if k >= 0 else dbs[0]),
                         text=line["text"]))
    return rows


def section_bars(downbeats, lines, secs):
    """[(name, first bar | None, end bar | None)]: an intro before the first section if it does not begin
    at bar 0, then each section up to the next one's first bar (repeated names numbered: chorus1, chorus2).
    None is the start or the end of the song."""
    secs = [s for s in secs if not s.get("marker")]
    rows = section_rows(downbeats, lines, secs)
    names = [slug(r["name"], i, rows) for i, r in enumerate(rows)]
    starts = [r["bar"] for r in rows]
    out = [("intro", None, starts[0])] if starts[0] > 0 else []
    for i, (n, st) in enumerate(zip(names, starts)):
        out.append((n, st if out else None, starts[i + 1] if i + 1 < len(starts) else None))
    return out


def slug(name, i, rows):
    """chorus -> chorus1/chorus2/... when a section name repeats."""
    base = name.lower().replace(" ", "").replace("-", "")
    same = [j for j, r in enumerate(rows) if r["name"] == name]
    return f"{base}{same.index(i) + 1}" if len(same) > 1 else base


def main():
    au = json.loads((common.DATA / "audio.json").read_text())
    ly = json.loads((common.DATA / "lyrics.json").read_text())
    secs = [s for s in json.loads(common.SECTIONS_SRC.read_text()) if not s.get("marker")]
    dbs = np.array(au["downbeats"])
    rows = section_rows(dbs, ly["lines"], secs)
    print(f"grid: first downbeat {dbs[0]:.3f}s, mean bar {np.diff(dbs).mean():.3f}s ({au['bpm']:.3f} BPM)\n")
    print(f"{'section':<14}{'line':>5}{'t':>9}{'bar':>6}{'lead-in':>10}  first line")
    for r in rows:
        print(f"{r['name']:<14}{r['line']:>5}{r['t']:>9.2f}{r['bar']:>6}"
              f"{r['lead']:>9.2f}s  {r['text'][:38]}")
    print("\nSECTION_BARS = [")
    for row in section_bars(dbs, ly["lines"], secs):
        print(f"    {row!r},")
    print("]")


if __name__ == "__main__":
    main()
