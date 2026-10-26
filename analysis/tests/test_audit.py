import pytest

import shutil
import subprocess

import numpy as np

from audit import (band_verdict, clip_span, decode, every, film_summary, internal, samples, scene_spans, still_runs,
                   unseen_hits, weakest)


@pytest.mark.parametrize("value, side, verdict", [
    (0.5, "low", "below"), (0.5, "high", "in band"), (3.0, "high", "above"), (3.0, "low", "in band"),
    (1.5, "both", "in band"), (0.5, "both", "below"), (3.0, "both", "above"),
])
def test_band_verdict_flags_only_the_side_that_is_a_problem(value, side, verdict):
    assert band_verdict(value, [1.0, 2.0], side) == verdict


def test_still_runs_are_longer_than_two_seconds_below_the_threshold():
    fps = 10
    motion = [3.0] * 10 + [0.5] * 25 + [3.0] * 10 + [0.5] * 15 + [0.5] * 30  # 2.5 s, then 4.5 s up to the end
    assert still_runs(motion, fps) == [(1.0, 3.5), (4.5, 9.0)]
    assert still_runs([0.5] * 20, fps) == []  # exactly 2 s is not "more than 2 s"


def test_scene_spans_read_the_storyboard_blocks():
    sb = ("## Frame 1 — 01-a\n\n- src: compositions/frames/01-a.html\n- duration: 2.5s\n- span_sec: [0.0, 2.5]\n- pacing: x\n\n"
          "## Frame 2 — 02-b\n\n- src: compositions/frames/02-b.html\n- duration: 1.25s\n- span_sec: [2.5, 3.75]\n")
    assert scene_spans(sb) == [("01-a", 0.0, 2.5), ("02-b", 2.5, 3.75)]


def test_weakest_weighs_motion_against_the_music():
    quiet_still = {"id": "a", "motion_p90": 0.3, "drums": 0.0}  # 1.0
    loud_still = {"id": "b", "motion_p90": 0.3, "drums": 0.7}   # 0.3: weaker, the music asks for more
    loud_moving = {"id": "c", "motion_p90": 3.0, "drums": 0.7}  # 3.0
    assert [s["id"] for s in weakest([quiet_still, loud_still, loud_moving], 2)] == ["b", "a"]


def test_film_summary_reads_metrics_rows():
    rows = [dict(luma=l, change=c, motion=m, black=0.5, edges=0.05, sat_area=0.02, hue=h)
            for l, c, m, h in [(0.1, 0.0, 0.2, None), (0.3, 0.05, 0.4, 15), (0.6, 0.2, 1.0, 15)]]
    f = film_summary(rows, cuts=[1.0, 2.0], duration=60)
    assert f["cuts_per_min"] == 2
    assert f["mid"] == pytest.approx(1 / 3) and f["light"] == pytest.approx(1 / 3)
    assert f["change_03"] == 1.0 and f["change_10"] == 0.5  # the first second has no "previous"
    assert f["no_colour"] == pytest.approx(1 / 3)


@pytest.mark.parametrize("fps", [30, 60])
def test_unseen_hits_judge_every_hit_with_half_a_second_either_side(fps):
    d = np.full(3 * fps, 0.1, np.float32)
    d[int(1.5 * fps)] = 5.0  # only the hit at 1.5 s changes the picture
    judged, unseen = unseen_hits(d, fps, [0.2, 0.75, 1.5, 2.25, 2.9], offset=0.0)
    assert judged == [0.75, 1.5, 2.25]  # 0.2 and 2.9 lack 0.5 s on one side
    assert unseen == [0.75, 2.25]
    judged, unseen = unseen_hits(d, fps, [100.75, 101.5], offset=100.0)  # a proof that starts at track 100 s
    assert judged == [100.75, 101.5] and unseen == [100.75]


def test_clip_span_keeps_only_the_part_the_video_covers():
    assert clip_span(10.0, 20.0, 15.0, 30.0) == (15.0, 20.0)
    assert clip_span(10.0, 20.0, 0.0, 30.0) == (10.0, 20.0)
    assert clip_span(10.0, 20.0, 25.0, 30.0) is None


def test_samples_keep_the_scene_before_a_cut_out():
    # a bright scene until 0.18 s, then dark until 0.5 s, sampled at 4 fps (0, 0.25, 0.5, ...)
    yhigh = np.array([235.0, 16.0, 16.0])
    k0, k1 = samples(0.18, 0.5, 4, len(yhigh))
    assert (k0, k1) == (1, 2) and float(np.median(yhigh[k0:k1])) == 16.0
    assert samples(0.25, 0.75, 4, 10) == (1, 3)  # a sample exactly on the cut belongs to the new scene
    assert samples(1.0, 3.0, 60, 100) == (60, 100)  # clipped to the stream


def test_internal_differences_leave_the_cut_to_neither_scene():
    d = np.array([0.0, 0.0, 9.0, 0.0])  # frames 0-2 one scene, 3-4 the next: d[2] is the cut
    assert list(d[internal(0, 3)]) == [0.0, 0.0]
    assert list(d[internal(3, 5)]) == [0.0]


@pytest.mark.skipif(not shutil.which("ffmpeg"), reason="needs ffmpeg")
def test_sampling_shows_each_sample_time_and_assigns_it_to_its_scene(tmp_path):
    # white until 0.30 s, then black, at 60 fps: the 4 fps sample at 0.25 s must still be white
    clip = tmp_path / "cut.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-f", "lavfi", "-i", "color=white:s=96x54:r=60:d=0.3", "-f", "lavfi",
                    "-i", "color=black:s=96x54:r=60:d=0.7", "-filter_complex", "[0][1]concat=n=2:v=1",
                    "-pix_fmt", "yuv420p", str(clip)], check=True)
    y = decode(clip, every(4), 96, 54, 1).reshape(-1, 96 * 54).mean(axis=1)
    assert len(y) == 4 and y[1] > 200 and y[2] < 40  # 0.25 s white, 0.5 s black
    white, black = samples(0.0, 0.3, 4, len(y)), samples(0.3, 1.0, 4, len(y))
    assert y[slice(*white)].min() > 200 and y[slice(*black)].max() < 40


def test_the_last_scene_keeps_the_videos_last_frame_and_difference():
    frames = np.array([0.0, 0.0, 0.0, 0.0, 9.0])  # 5 frames at 4 fps; the last one is a flash
    d = np.abs(np.diff(frames))
    k0, k1 = samples(0.5, 2.0, 4, len(frames))  # the scene runs to the video's end
    assert frames[k0:k1].max() == 9.0 and d[internal(k0, k1)].max() == 9.0


def test_accent_light_counts_the_accent_and_its_halo_not_cream():
    from audit import accent_light
    f = np.zeros((10, 10, 3), np.uint8)
    f[0:2] = (232, 93, 38)    # the accent
    f[2:4] = (120, 50, 25)    # its halo: darker, less saturated, same hue
    f[4:6] = (240, 236, 229)  # cream
    assert accent_light(f) == pytest.approx(0.4)


def test_layout_map_finds_the_same_layout_and_a_different_one():
    from audit import layout_map
    a = np.zeros((3, 180, 320), np.uint8)
    a[:, 20:60, 20:200] = 255   # a headline top left
    b = a.copy()
    b[:, :, :] = 0
    b[:, 110:170, 120:300] = 255  # a block bottom right
    assert layout_map(a) @ layout_map(a.copy()) == pytest.approx(1.0)
    assert layout_map(a) @ layout_map(b) < 0.5
