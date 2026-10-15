from lyrics_sheet import parse


def test_headers_preserve_hyphenated_names_and_sung_parentheses():
    lines, sections, markers = parse("""[Pre-Chorus - quiet]
  Keep   the (hey!) words
[Chorus - spoken, urgent]
(spoken) Let go
[End - fade out]
""")
    assert lines == ["Keep the (hey!) words", "Let go"]
    assert sections == [
        {"name": "Pre-Chorus", "note": "quiet", "first_line": 0, "n_lines": 1},
        {"name": "Chorus", "note": "spoken, urgent", "spoken": True, "first_line": 1, "n_lines": 1},
    ]
    assert markers == [{"name": "End", "note": "fade out", "marker": True, "before_line": 2}]


def test_repeated_stanzas_become_choruses_without_losing_lines():
    lines, sections, markers = parse("First verse\n\nLet go!\nStay free\n\nSecond verse\n\nlet go\nstay free\n")
    assert len(lines) == 6
    assert [(s["name"], s["first_line"], s["n_lines"]) for s in sections] == [
        ("Verse", 0, 1), ("Chorus", 1, 2), ("Verse", 3, 1), ("Chorus", 4, 2),
    ]
    assert markers == []


def test_spoken_prefix_and_stop_marker_do_not_add_lyric_lines():
    lines, sections, markers = parse("[Verse]\n(spoken) Hello\n[Stop - silence]\nGoodbye\n")
    assert lines == ["Hello", "Goodbye"]
    assert sections == [{"name": "Verse", "first_line": 0, "spoken": True, "n_lines": 2}]
    assert markers == [{"name": "Stop", "note": "silence", "marker": True, "before_line": 1}]


def test_empty_sheet_has_no_sections():
    assert parse("\n  \n") == ([], [], [])
