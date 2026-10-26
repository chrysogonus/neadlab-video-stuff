import numpy as np
import pytest

from finish import DEFAULT, finish, light_settings, settings_at

ACCENT = "#E85D26"
P = {**DEFAULT, "accent": ACCENT}
QUIET = {**P, "ca": 0, "grain": 0, "vignette": 0}


def frame(ground=(17, 17, 17)):
    img = np.empty((216, 384, 3), np.uint8)
    img[:] = ground
    return img


def test_unlit_cream_type_on_ink_is_unchanged():
    img = frame()
    img[90:130, 60:320] = (240, 236, 229)  # cream type: it never blooms
    assert np.array_equal(finish(img, QUIET, 0), img)


def test_an_accent_stroke_sheds_light_around_it():
    img = frame()
    img[100:110, 150:230] = (232, 93, 38)
    out = finish(img, QUIET, 0).astype(int)
    assert out[80, 190, 0] > 17 + 8  # a glow above the stroke, reddish
    assert out[80, 190, 0] > out[80, 190, 2]
    assert np.abs(out[100:110, 150:230] - img[100:110, 150:230]).max() <= 40  # the stroke keeps its colour
    assert out[5, 5, 0] < out[80, 190, 0]  # it falls off with distance


def test_grain_and_vignette_are_deterministic_and_vary_by_frame():
    img = frame((120, 120, 120))
    a, b, c = finish(img, P, 7), finish(img, P, 7), finish(img, P, 8)
    assert np.array_equal(a, b)
    assert not np.array_equal(a, c)
    assert a[108, 192].mean() > a[2, 2].mean()  # the vignette darkens the corners


STORYBOARD = """---
canvas: {"w": 1920, "h": 1080, "fps": 60}
light: {"accent": "#E85D26", "grain": 0.04}
---

## Frame 1 — 01-a

- src: compositions/frames/01-a.html
- duration: 2s
- span_sec: [0.0, 2.0]
- light: {"bloom": 0.9}

## Frame 2 — 02-b

- src: compositions/frames/02-b.html
- duration: 3s
- span_sec: [2.0, 5.0]
"""


def test_settings_are_film_defaults_with_per_frame_overrides():
    film, frames = light_settings(STORYBOARD)
    assert film["grain"] == 0.04 and film["bloom"] == DEFAULT["bloom"]
    assert settings_at(1.0, film, frames)["bloom"] == 0.9
    assert settings_at(3.0, film, frames)["bloom"] == DEFAULT["bloom"]


def test_a_storyboard_without_light_does_not_use_the_pass():
    assert light_settings(STORYBOARD.replace('light: {"accent": "#E85D26", "grain": 0.04}\n', "")) == (None, [])


def test_light_needs_an_accent():
    with pytest.raises(ValueError):
        light_settings(STORYBOARD.replace('"accent": "#E85D26", ', ""))
