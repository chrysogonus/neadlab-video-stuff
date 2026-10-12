"""Display token -> pronunciation spelling used for CTC alignment.

Each display token (lyric line split on spaces) maps to one or more
pronunciation sub-words made of plain letters (and internal apostrophes).
"""
import re

import common

# project-specific spellings (projects/<id>/tuning.py)
PRON = common.CFG.PRON
# alternative pronunciations to test (scored by alignment likelihood)
ALT = common.CFG.ALT


ONES = ("zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen "
        "sixteen seventeen eighteen nineteen").split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()


def number_words(n: int) -> str:
    """How a number is said: a year as a year (1999 "nineteen ninety nine", 2021 "twenty twenty one",
    1905 "nineteen oh five", 1900 "nineteen hundred"), anything else as a cardinal."""
    if 1100 <= n <= 1999 or 2010 <= n <= 2099:
        hi, lo = divmod(n, 100)
        return cardinal(hi) + " " + ("hundred" if lo == 0 else "oh " + ONES[lo] if lo < 10 else cardinal(lo))
    return cardinal(n)


def cardinal(n: int) -> str:
    if n < 20:
        return ONES[n]
    if n < 100:
        return TENS[n // 10] + ("" if n % 10 == 0 else " " + ONES[n % 10])
    for size, name in ((10**9, "billion"), (10**6, "million"), (1000, "thousand"), (100, "hundred")):
        if n >= size:
            hi, lo = divmod(n, size)
            return cardinal(hi) + " " + name + ("" if lo == 0 else " " + cardinal(lo))


def pron(token: str) -> list[str]:
    if token in PRON:
        return PRON[token].split()
    # digits are spoken as words ("1,000" is one number)
    w = re.sub(r"\d+", lambda m: f" {number_words(int(m.group()))} ", re.sub(r"(?<=\d),(?=\d)", "", token))
    w = w.lower()
    w = w.replace("’", "'")
    w = re.sub(r"[^a-z' ]", " ", w)
    w = w.strip("' ")
    return [p.strip("'") for p in w.split() if p.strip("'")]


if __name__ == "__main__":
    for _, _, t in common.load_lyrics_src():
        print(t, "->", " | ".join(" ".join(pron(w)) for w in t.split(" ")))
