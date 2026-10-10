"""Suggest SECTION_BARS for analyze.py from the aligned lyrics and the beat grid.

The song form comes from lyrics/sections.json (derived from the bracketed headers in
the lyric sheet); the bar of each section's first sung line comes from data/lyrics.json
against the grid in data/audio.json.

Rule: a section starts on the LATEST DOWNBEAT AT OR BEFORE its first sung line --
the same "never after the word" convention timeline.ts's cut() uses for beats. A
section must never begin after its own first word, or its plate appears late and the
previous plate is still on screen over it. The cost is that a boundary can land in the
tail of the previous line's held last note, which is where a cut belongs anyway.

Run after a first `analyze.py` pass (SECTION_BARS may be empty then), then paste the
printed list into analyze.py and run analyze.py again.

  uv run python sections_bars.py
"""
import common
import json

def main():
    au = json.loads((common.DATA / "audio.json").read_text())
    ly = json.loads((common.DATA / "lyrics.json").read_text())
    secs = json.loads((common.PROJECT / "lyrics" / "sections.json").read_text())

    P, dbs = au["beat_period"], au["downbeats"]
    bar0, bar_len = dbs[0], 4 * P
    bar_of = lambda t: (t - bar0) / bar_len

    rows = []
    for sec in secs:
        line = ly["lines"][sec["first_line"]]
        b = bar_of(line["start"])
        k = int(b // 1)                      # floor: never after the first word
        rows.append(dict(name=sec["name"], line=sec["first_line"], bar=k, raw=b,
                         into=(b - k) * 4, t=line["start"], lead=line["start"] - (bar0 + k * bar_len),
                         text=line["text"]))

    print(f"grid: first downbeat {bar0:.3f}s, bar {bar_len:.3f}s ({au['bpm']:.3f} BPM)\n")
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
