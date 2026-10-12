"""Where the vocal sings something other than the transcript -> data/sung.json.

The transcript is what the singer was given; the take can differ (a stage direction sung, a phrase
rewritten). For each line, the Whisper words heard inside the line's aligned time span are compared
with the line's words, and every place they differ (words replaced, inserted or dropped) is a
candidate edit. A candidate is kept only if the acoustic models agree: the line's CTC alignment over
the same audio scores at least MARGIN (log-probability) better with the edit than without. Whisper
mishears sung words, so its reading alone never changes a line: "It's been detached" for "Head's
been detached" scores worse than the sheet and is dropped. Not considered at all: words Whisper did
not hear (it misses shouts and gang chants, and a shorter text always scores better against audio the
garbage token can absorb), near-homophones ("your" for "you're", "rebase" for "Rebased"), and words
Whisper itself is unsure of.

common.load_lyrics_src() applies the kept edits, so align.py aligns what is sung. Lines a project's
tuning.py corrects by hand (SUNG) are already in data/lines.txt and are not checked again.

  uv run python sung.py --project <id>
"""
import common
import json
import re
from difflib import SequenceMatcher

import numpy as np

from ctcalign import FRAME, align, emissions
from pron import pron

MARGIN = 8.0      # nats; Force Push's sung deviations score 17-25 better than the sheet, a near tie 3.6
MIN_PROB = 0.6    # Whisper's probability of each heard word,
MEAN_PROB = 0.8   # and on average (Force Push's sung deviations: 0.82-0.91; misheard words: 0.61-0.78)
SAME = 0.7        # spelling similarity above which two readings are the same word misheard
PAD = 0.6         # s of audio around a line, at most (halfway to the neighbouring lines)


def norm(word):
    return "".join(pron(word))


def heard_words():
    W = json.loads((common.WORK / "whisper_turbo_prompt.json").read_text())
    return [(w["word"].strip(), w["start"], w["end"], w.get("probability", 1.0))
            for s in W["segments"] for w in s.get("words", []) if norm(w["word"].strip())]


def score(E, tokens, f0, f1):
    """Viterbi log-probability of the tokens (with garbage around them) over frames f0..f1."""
    return align(E[f0:f1], [tokens])[1]


def main():
    lines = [t for _, _, t in common.load_lyrics_src(sung=False)]
    toks = [t.split(" ") for t in lines]
    E = emissions("fused6")
    spans = align(E, toks)[0]
    bounds = [(spans[(li, 0)][0][0], spans[(li, len(t) - 1)][-1][1]) for li, t in enumerate(toks)]
    heard = heard_words()
    hand = set((common.CFG.SUNG or {}).keys())
    out, evidence = {}, []
    for li, words in enumerate(toks):
        if li in hand:
            continue
        s, e = bounds[li]
        lo = max(s - PAD, (bounds[li - 1][1] + s) / 2 if li else 0.0)
        hi = min(e + PAD, (e + bounds[li + 1][0]) / 2 if li + 1 < len(toks) else e + PAD)
        hw = [h for h in heard if lo <= (h[1] + h[2]) / 2 <= hi]
        ops = SequenceMatcher(a=[norm(w) for w in words], b=[norm(h[0]) for h in hw], autojunk=False).get_opcodes()
        # (the scored audio covers every heard word, even where the sheet's alignment gave it to a neighbour)
        f0 = int(min([lo] + [h[1] - 0.1 for h in hw]) / FRAME)
        f1 = int(max([hi] + [h[2] + 0.1 for h in hw]) / FRAME) + 1
        cur = list(words)
        base = score(E, cur, f0, f1)
        # right to left, so the indices of the edits still to try stay valid
        for tag, i1, i2, j1, j2 in reversed(ops):
            if tag == "equal":
                continue
            new_words = [re.sub(r"[^\w'’-]", "", h[0]) for h in hw[j1:j2]]
            probs = [h[3] for h in hw[j1:j2]]
            a, b = "".join(norm(w) for w in words[i1:i2]), "".join(norm(w) for w in new_words)
            if tag == "delete" or min(probs) < MIN_PROB or np.mean(probs) < MEAN_PROB or SequenceMatcher(a=a, b=b).ratio() >= SAME:
                continue
            trial = cur[:i1] + new_words + cur[i2:]
            if not trial:
                continue
            sc = score(E, trial, f0, f1)
            ok = sc - base >= MARGIN
            evidence.append(dict(line=li, sheet=" ".join(words[i1:i2]), heard=" ".join(new_words),
                                 p=round(min(probs), 2), gain=round(sc - base, 2), kept=ok))
            if ok:
                cur, base = trial, sc
        if cur != words:
            # (a word inserted before the line's first word takes its capital)
            if cur[0] != words[0] and words[0] in cur and not re.match(r"I\b", words[0]):
                cur[cur.index(words[0])] = words[0][0].lower() + words[0][1:]
            text = " ".join(cur)
            out[li] = text[0].upper() + text[1:]
            print(f"  line {li}: {lines[li]!r} -> {out[li]!r}")
    (common.DATA / "sung.json").write_text(json.dumps(
        dict(lines={str(k): v for k, v in out.items()}, evidence=evidence, margin=MARGIN), indent=1, ensure_ascii=False) + "\n")
    print(f"{len(out)} lines sung differently; {sum(not e['kept'] for e in evidence)} heard differences rejected "
          f"-> {common.DATA / 'sung.json'}")


if __name__ == "__main__":
    main()
