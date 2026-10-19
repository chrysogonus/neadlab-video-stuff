import pytest

from sections_bars import section_bars, section_rows


@pytest.mark.parametrize("start, bar", [(3.999, 0), (4.0, 1), (4.001, 1), (7.499, 1), (7.5, 2)])
def test_tracked_grid_cuts_at_the_downbeat_before_the_word(start, bar):
    rows = section_rows([0.0, 4.0, 7.5, 12.0], [{"start": start, "text": "First word"}],
                        [{"name": "Verse", "first_line": 0}])
    assert rows[0]["bar"] == bar
    assert rows[0]["lead"] >= 0


def test_sections_add_intro_number_repeats_and_ignore_markers():
    lines = [{"start": t, "text": "Line"} for t in [4.1, 8.1, 12.1]]
    secs = [{"name": name, "first_line": i} for i, name in enumerate(["Chorus", "Verse", "Chorus"])]
    secs.insert(1, {"name": "Stop", "marker": True, "before_line": 1})
    assert section_bars([0, 4, 8, 12, 16], lines, secs) == [
        ("intro", None, 1), ("chorus1", 1, 2), ("verse", 2, 3), ("chorus2", 3, None),
    ]


def test_first_section_at_bar_zero_has_no_extra_intro():
    assert section_bars([0, 4, 8], [{"start": 0.25, "text": "Line"}],
                        [{"name": "Verse", "first_line": 0}]) == [("verse", None, None)]
