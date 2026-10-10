"""Display token -> pronunciation spelling used for CTC alignment.

Each display token (lyric line split on spaces) maps to one or more
pronunciation sub-words made of plain letters (and internal apostrophes).
"""
import re

PRON = {
    # "qubits" is spelled qu- but sung /kjuː/; the grapheme models align it badly as-is.
    "qubits,": "cue bits", "qubits": "cue bits",
    # split the compound so refinement gets a boundary inside it
    "Petabytes,": "peta bytes", "Petabytes": "peta bytes",
}

# alternative pronunciations to test (scored by alignment likelihood)
ALT = {}


def pron(token: str) -> list[str]:
    if token in PRON:
        return PRON[token].split()
    w = token.lower()
    w = w.replace("’", "'")
    w = re.sub(r"[^a-z' ]", " ", w)
    w = w.strip("' ")
    return [p.strip("'") for p in w.split() if p.strip("'")]


if __name__ == "__main__":
    import common
    for _, _, t in common.load_lyrics_src():
        print(t, "->", " | ".join(" ".join(pron(w)) for w in t.split(" ")))
