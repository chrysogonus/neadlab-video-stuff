"""Transcript (lyric sheet) -> the project's data/lines.txt and data/sections.json.

The sheet has bracketed headers ("[Chorus - explosive, belted]"): the name before the dash is
the section, the rest is a performance note. A "(spoken)" line prefix or "spoken" in the note
marks a spoken section. Headers that only direct the performance ([Stop ...], [End ...]) are not
sections: they become markers before the next sung line (or after the last one). Parenthesised
words inside a line, such as a gang shout "(hey!)", stay in the line: they are sung. A sheet
without headers gets its sections from its stanzas (blank-line separated): a stanza whose text
repeats is a chorus, the others are verses.

A project's SUNG map (projects/<id>/tuning.py) replaces lines the vocal sings differently.

  uv run python lyrics_sheet.py --project <id>          write the files
  uv run python lyrics_sheet.py --project <id> --check  compare with the files on disk
"""
import common
import json
import re
import sys

DIRECTIONS = {"stop", "end"}


def parse(text):
    lines, sections, markers = [], [], []
    stanzas, gap = [], True          # first line of each blank-line separated stanza
    cur = None
    for raw in text.splitlines():
        s = " ".join(raw.split())
        if not s:
            gap = True
            continue
        # (the note follows a spaced dash: "Pre-Chorus" is one name)
        m = re.fullmatch(r"\[(.+?)(?:\s+-\s+(.*))?\]", s)
        if m:
            name, note = m.group(1).strip(), (m.group(2) or "").strip()
            if name.lower() in DIRECTIONS:
                markers.append(dict(name=name, note=note, marker=True, before_line=len(lines)))
                continue
            cur = dict(name=name, first_line=len(lines))
            if note:
                cur["note"] = note
            if "spoken" in note.lower():
                cur["spoken"] = True
            sections.append(cur)
            continue
        if s.lower().startswith("(spoken)"):
            s = s[len("(spoken)"):].strip()
            if cur is not None:
                cur["spoken"] = True
        if gap:
            stanzas.append(len(lines))
            gap = False
        lines.append(s)
    if not sections and lines:
        sections = stanza_sections(stanzas, lines)
    for i, sec in enumerate(sections):
        end = sections[i + 1]["first_line"] if i + 1 < len(sections) else len(lines)
        sec["n_lines"] = end - sec["first_line"]
    return lines, sections, markers


def stanza_sections(stanzas, lines):
    """Sections of a sheet without headers: one per stanza, "Chorus" where the stanza's text repeats."""
    bounds = list(zip(stanzas, stanzas[1:] + [len(lines)]))
    key = lambda a, b: tuple(re.sub(r"[^a-z' ]", "", l.lower()).strip() for l in lines[a:b])
    count = {}
    for a, b in bounds:
        count[key(a, b)] = count.get(key(a, b), 0) + 1
    return [dict(name="Chorus" if count[key(a, b)] > 1 else "Verse", first_line=a) for a, b in bounds]


def main():
    lines, sections, markers = parse(common.SHEET.read_text(encoding="utf-8"))
    # where the vocal sings something else than the sheet (verified per project, see its tuning.py)
    for i, sung in (common.CFG.SUNG or {}).items():
        print(f"  sung line {i}: {lines[i]!r} -> {sung!r}")
        lines[i] = sung
    secs = json.dumps(sections + markers, indent=2) + "\n"
    txt = "\n".join(lines) + "\n"
    if "--check" in sys.argv:
        ok_l = common.LYRICS_SRC.read_text(encoding="utf-8") == txt
        ok_s = json.loads(common.SECTIONS_SRC.read_text()) == json.loads(secs)
        print(f"{common.LYRICS_SRC}: {'same' if ok_l else 'DIFFERS'}\n{common.SECTIONS_SRC}: {'same' if ok_s else 'DIFFERS'}")
        sys.exit(0 if ok_l and ok_s else 1)
    common.LYRICS_SRC.parent.mkdir(parents=True, exist_ok=True)
    common.LYRICS_SRC.write_text(txt, encoding="utf-8")
    common.SECTIONS_SRC.write_text(secs)
    print(f"wrote {common.LYRICS_SRC} ({len(lines)} lines), {common.SECTIONS_SRC} "
          f"({len(sections)} sections, {len(markers)} markers)")
    for sec in sections:
        print(f"  {sec['first_line']:>3} +{sec['n_lines']:<2} {sec['name']}{' (spoken)' if sec.get('spoken') else ''}")


if __name__ == "__main__":
    main()
