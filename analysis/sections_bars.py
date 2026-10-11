"""Suggest SECTION_BARS for analyze.py from the aligned lyrics and the beat grid.

The song form comes from the song's sections.json (derived from the bracketed headers in
the lyric sheet by lyrics_sheet.py); the bar of each section's first sung line comes from
its lyrics.json against the grid in its audio.json (paths in songs.json).

Rule: a section starts on the LATEST DOWNBEAT AT OR BEFORE its first sung line --
the same "never after the word" convention timeline.ts's cut() uses for beats. A
section must never begin after its own first word, or its plate appears late and the
previous plate is still on screen over it. The cost is that a boundary can land in the
tail of the previous line's held last note, which is where a cut belongs anyway.

Run after a first `analyze.py` pass (SECTION_BARS may be empty then), then paste the
printed list into analysis/songs/<song>.py and run analyze.py again.

  uv run python sections_bars.py --song <id>
"""
import common
import json

def main():
    au = json.loads((common.DATA / "audio.json").read_text())
    ly = json.loads((common.DATA / "lyrics.json").read_text())
    secs = [s for s in json.loads(common.SECTIONS_SRC.read_text()) if not s.get("marker")]

    import numpy as np
    dbs = np.array(au["downbeats"])
    bar0 = dbs[0]
    # bar position from the downbeats themselves (a tracked grid has no constant bar length)
    bar_of = lambda t: float(np.interp(t, dbs, np.arange(len(dbs)), left=(t - dbs[0]) / (dbs[1] - dbs[0]) if t < dbs[0] else 0))

    rows = []
    for sec in secs:
        line = ly["lines"][sec["first_line"]]
        b = bar_of(line["start"])
        k = int(b // 1)                      # floor: never after the first word
        rows.append(dict(name=sec["name"], line=sec["first_line"], bar=k, raw=b,
                         into=(b - k) * 4, t=line["start"], lead=line["start"] - (dbs[k] if k >= 0 else bar0),
                         text=line["text"]))

    print(f"grid: first downbeat {bar0:.3f}s, mean bar {np.diff(dbs).mean():.3f}s ({au['bpm']:.3f} BPM)\n")
    print(f"{'section':<14}{'line':>5}{'t':>9}{'bar':>6}{'lead-in':>10}  first line")
    for r in rows:
        print(f"{r['name']:<14}{r['line']:>5}{r['t']:>9.2f}{r['bar']:>6}"
              f"{r['lead']:>9.2f}s  {r['text'][:38]}")

    print("\nSECTION_BARS = [")
    names = [slug(r["name"], i, rows) for i, r in enumerate(rows)]
    starts = [r["bar"] for r in rows]
    # intro, if the first section does not begin at bar 0
    if starts[0] > 0:
        print(f'    ("intro", None, {starts[0]}),')
    for i, (n, st) in enumerate(zip(names, starts)):
        end = starts[i + 1] if i + 1 < len(starts) else None
        print(f'    ("{n}", {st}, {end}),')
    print("]")


def slug(name, i, rows):
    """chorus -> chorus1/chorus2/... when a section name repeats."""
    base = name.lower().replace(" ", "").replace("-", "")
    same = [j for j, r in enumerate(rows) if r["name"] == name]
    return f"{base}{same.index(i) + 1}" if len(same) > 1 else base


if __name__ == "__main__":
    main()
