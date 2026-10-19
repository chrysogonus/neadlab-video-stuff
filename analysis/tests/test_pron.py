import pytest

import pron


@pytest.mark.parametrize(("number", "words"), [
    (0, "zero"), (1000, "one thousand"), (1900, "nineteen hundred"),
    (1905, "nineteen oh five"), (1999, "nineteen ninety nine"),
    (2000, "two thousand"), (2009, "two thousand nine"), (2021, "twenty twenty one"),
    (1_000_001, "one million one"),
])
def test_numbers_distinguish_years_from_cardinals(number, words):
    assert pron.number_words(number) == words


@pytest.mark.parametrize(("token", "words"), [
    ("1,000", ["one", "thousand"]), ("2021!", ["twenty", "twenty", "one"]),
    ("You’re", ["you're"]), ("(hey!)", ["hey"]), ("---", []),
])
def test_display_tokens_map_to_spoken_words(monkeypatch, token, words):
    monkeypatch.setattr(pron, "PRON", {})
    assert pron.pron(token) == words


def test_project_pronunciation_overrides_normalization(monkeypatch):
    monkeypatch.setattr(pron, "PRON", {"SHA256": "sha two fifty six"})
    assert pron.pron("SHA256") == ["sha", "two", "fifty", "six"]
