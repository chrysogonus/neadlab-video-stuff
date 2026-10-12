"""Music analysis -> data/audio.json

  * beat grid: a constant tempo (tempo + phase fitted to drum / mix onsets, phase
    refined on kick attacks), or beats tracked through a drifting tempo, whichever keeps
    the local phase error small; downbeats (bar phase from the snare backbeat and the
    chord changes), sections on downbeats (from the aligned lyrics, so run align.py first),
  * 100 fps normalized envelopes (mix rms / low / mid / high, stem rms),
  * kick / snare / hat onsets from the drums stem, vocal note onsets.

All times are in the WAV master's timeline (the stems are separated from it, so they
need no correction; see common.STEM_OFFSET_SEC).

Every setting is detected unless the project's tuning.py pins it (TEMPO_RANGE, GRID,
BAR_PHASE, SECTION_BARS); what was used, and how it was found, goes into the JSON.

Run:  uv run python analyze.py --project <id> [--plots]
"""
import common
import json
import math
import sys

import numpy as np
import librosa
from scipy.ndimage import maximum_filter1d, median_filter, uniform_filter1d
from scipy.signal import butter, find_peaks, sosfiltfilt

from sections_bars import section_bars
from tempo_probe import estimate as estimate_tempo

SR = 44100
FPS = 100

# Pinned by a project's tuning.py, else detected (None):
# TEMPO_RANGE: the fitter does an exhaustive grid search inside it, so a window that excludes
# the true tempo silently locks onto a metric relative (half/double/4:3) and the kick residual
# blows up; detected by tempo_probe.estimate. SECTION_BARS: (name, first bar, end bar), bar k
# starts at downbeat k; detected by sections_bars.section_bars from the aligned lyrics.
# GRID: "constant" (one tempo for the whole song) or "tracked" (a song whose tempo drifts: the beats
# follow it, see track_beats); detected by local_shifts. BAR_PHASE: index of the first beat that is a
# downbeat (0..3); detected by bar_phase.
TEMPO_RANGE = common.CFG.TEMPO_RANGE
SECTION_BARS = common.CFG.SECTION_BARS
GRID = common.CFG.GRID
BAR_PHASE = common.CFG.BAR_PHASE
# A grid whose local phase error spreads wider than this (p5..p95) does not follow the song.
DRIFT_MS = 40


# ---------------------------------------------------------------------------
def band_sos(lo, hi, sr):
    if lo and hi:
        return butter(4, [lo, hi], btype="band", fs=sr, output="sos")
    if hi:
        return butter(4, hi, btype="low", fs=sr, output="sos")
    return butter(4, lo, btype="high", fs=sr, output="sos")


def frame_rms(x, sr, fps=FPS, win=2048):
    hop = sr / fps
    n = int(math.ceil(len(x) / sr * fps))
    pad = np.pad(x, (win // 2, win // 2 + int(hop) + 2))
    idx = (np.arange(n) * hop).astype(int)
    c = np.concatenate([[0.0], np.cumsum(pad.astype(np.float64) ** 2)])
    e = (c[idx + win] - c[idx]) / win
    return np.sqrt(np.maximum(e, 0))


def smooth_env(x, fps=FPS, attack=0.010, release=0.090):
    """One-pole follower: fast attack, slower release (visual friendly)."""
    aa = math.exp(-1 / (attack * fps))
    ar = math.exp(-1 / (release * fps))
    y = np.empty_like(x)
    s = 0.0
    for i, v in enumerate(x):
        a = aa if v > s else ar
        s = a * s + (1 - a) * v
        y[i] = s
    return y


def norm01(x, pct=99.0):
    ref = np.percentile(x, pct)
    return np.clip(x / (ref + 1e-12), 0, 1)


# ---------------------------------------------------------------------------
def onset_env(drums, mix, sr):
    """Drum + mix spectral-flux onset envelope (22.05 kHz, 32-sample hop) -> (envelope, frames/s)."""
    od = librosa.onset.onset_strength(y=librosa.resample(drums, orig_sr=sr, target_sr=22050),
                                      sr=22050, hop_length=32, lag=1, max_size=1)
    om = librosa.onset.onset_strength(y=librosa.resample(mix, orig_sr=sr, target_sr=22050),
                                      sr=22050, hop_length=32, lag=1, max_size=1)
    return od / (np.percentile(od, 99) + 1e-9) + om / (np.percentile(om, 99) + 1e-9), 22050 / 32


def fit_grid(drums, sr, duration, o, ofps, tempo_range):
    """Constant-tempo grid: coarse tempo/phase search inside tempo_range (BPM) on spectral-flux
    onset envelopes (onset_env), then phase refinement on kick attack times."""

    def score(P, off):
        ts = off + P * np.arange(int(duration / P) + 1)
        idx = np.round(ts * ofps).astype(int)
        idx = idx[(idx > 2) & (idx < len(o) - 2)]
        return np.maximum.reduce([o[idx - 1], o[idx], o[idx + 1]]).mean()

    best = (0, None, None)
    for bpm in np.arange(tempo_range[0], tempo_range[1], 0.02):
        P = 60 / bpm
        for off in np.arange(0, P, 0.004):
            s = score(P, off)
            if s > best[0]:
                best = (s, bpm, off)
    _, bpm, off = best
    for b2 in np.arange(bpm - 0.02, bpm + 0.02, 0.001):  # fine
        P = 60 / b2
        for o2 in np.arange(off - 0.01, off + 0.01, 0.001):
            s = score(P, o2)
            if s > best[0]:
                best = (s, b2, o2)
    _, bpm, off = best
    P = 60 / bpm
    # refine phase on kick attacks (steepest rise of low-band log energy)
    kick_t, _ = band_onsets(drums, sr, None, 120, win=0.012, min_gap=0.2, rel_db=12)
    n = np.round((kick_t - off) / P)
    res = kick_t - (off + n * P)
    res = res[np.abs(res) < 0.06]
    off = off + float(np.median(res))
    # first beat >= 0
    off = off - P * math.floor(off / P)
    return bpm, P, off, res


def local_shifts(beats, o, ofps, win=16, step=4, reach=0.16):
    """How far each stretch of `win` beats is off the song: the shift (s) within +-reach that best lines the
    stretch up with the onset envelope, every `step` beats. A grid that follows the song gives a narrow
    band (a constant lag of the envelope behind the attacks); a constant tempo laid over a drifting song
    walks away from it."""
    shifts = np.arange(-reach, reach + 1e-9, 0.002)
    n = len(o)
    out = []
    for i in range(0, len(beats) - win, step):
        b = np.asarray(beats[i:i + win])
        sc = []
        for d in shifts:
            idx = np.round((b + d) * ofps).astype(int)
            idx = idx[(idx > 1) & (idx < n - 2)]
            sc.append(np.maximum.reduce([o[idx - 1], o[idx], o[idx + 1]]).mean() if len(idx) else 0.0)
        out.append(shifts[int(np.argmax(sc))])
    return np.array(out)


def spread_ms(shifts):
    return float(np.percentile(shifts, 95) - np.percentile(shifts, 5)) * 1000 if len(shifts) else 0.0


def bar_phase(beats, snare_t, harmony, sr):
    """Index (0..3) of the first beat that is a downbeat. The snare backbeat (2 and 4) leaves two candidates;
    of those, the downbeat is where the harmony (the `other` + `bass` stems' chroma) changes most. Without a
    backbeat (fewer than 16 snares on beats) all four phases compete on the chord changes alone.
    Returns (phase, evidence)."""
    beats = np.asarray(beats)
    bi = np.interp(snare_t, beats, np.arange(len(beats)), left=np.nan, right=np.nan)
    bi = bi[~np.isnan(bi)]
    on_beat = np.round(bi[np.abs(bi - np.round(bi)) < 0.2]).astype(int)
    hop = 512
    ch = librosa.feature.chroma_cqt(y=harmony, sr=sr, hop_length=hop)
    ct = librosa.frames_to_time(np.arange(ch.shape[1]), sr=sr, hop_length=hop)
    bc = []
    for i in range(len(beats) - 1):
        m = (ct >= beats[i]) & (ct < beats[i + 1])
        v = ch[:, m].mean(axis=1) if m.any() else np.zeros(12)
        bc.append(v / (np.linalg.norm(v) + 1e-9))
    bc = np.array(bc)
    change = np.r_[0.0, 1 - (bc[1:] * bc[:-1]).sum(1)]          # how much the harmony changes into beat i
    ev = []
    for p in range(4):
        pos = (np.arange(len(change)) - p) % 4
        backbeat = float(np.mean(((on_beat - p) % 4) % 2 == 1)) if len(on_beat) else 0.0
        ratio = float(change[pos == 0].mean() / (change[pos != 0].mean() + 1e-9))
        ev.append(dict(phase=p, snare_backbeat=round(backbeat, 3), chord_change=round(ratio, 3)))
    cands = [e for e in ev if e["snare_backbeat"] >= 0.6] if len(on_beat) >= 16 else ev
    return max(cands or ev, key=lambda e: e["chord_change"])["phase"], ev


def track_beats(drums, mix, sr, bpm, kick_t, duration):
    """Beats that follow a drifting tempo: dynamic-programming beat tracking (librosa) on drum + mix
    onset envelopes with the constant fit's tempo as the prior and a high tightness (no tempo jumps),
    then each beat moved by the median kick-attack residual of its +-8 beats (the envelope peaks lag
    the attacks; where there are no kicks, the song-wide median). Returns (beats, residuals)."""
    sr2, hop = 22050, 128
    d2 = librosa.resample(drums, orig_sr=sr, target_sr=sr2)
    m2 = librosa.resample(mix, orig_sr=sr, target_sr=sr2)
    od = librosa.onset.onset_strength(y=d2, sr=sr2, hop_length=hop, lag=1, max_size=1)
    om = librosa.onset.onset_strength(y=m2, sr=sr2, hop_length=hop, lag=1, max_size=1)
    n = min(len(od), len(om))
    o = od[:n] / (np.percentile(od, 99) + 1e-9) + 0.5 * om[:n] / (np.percentile(om, 99) + 1e-9)
    _, bf = librosa.beat.beat_track(onset_envelope=o, sr=sr2, hop_length=hop, start_bpm=bpm,
                                    tightness=1600, trim=False, units="frames")
    bt = librosa.frames_to_time(bf, sr=sr2, hop_length=hop)
    # each kick's residual against its nearest tracked beat
    idx = np.searchsorted(bt, kick_t).clip(1, len(bt) - 1)
    near = np.where(np.abs(kick_t - bt[idx - 1]) < np.abs(kick_t - bt[idx]), idx - 1, idx)
    res = kick_t - bt[near]
    ok = np.abs(res) < 0.06
    glob = float(np.median(res[ok]))
    corr = np.full(len(bt), glob)
    for i in range(len(bt)):
        m = ok & (np.abs(near - i) <= 8)
        if m.sum() >= 4:
            corr[i] = float(np.median(res[m]))
    beats = bt + corr
    # extend to cover the whole song at the local period (the tracker may stop short of the ends)
    while beats[0] - (beats[1] - beats[0]) >= 0:
        beats = np.concatenate([[beats[0] - (beats[1] - beats[0])], beats])
    while beats[-1] + (beats[-1] - beats[-2]) <= duration:
        beats = np.concatenate([beats, [beats[-1] + (beats[-1] - beats[-2])]])
    idx = np.searchsorted(beats, kick_t).clip(1, len(beats) - 1)
    nearest = np.where(np.abs(kick_t - beats[idx - 1]) < np.abs(kick_t - beats[idx]), beats[idx - 1], beats[idx])
    return beats, kick_t - nearest


def band_onsets(x, sr, lo, hi, win=0.010, hop_s=0.002, min_gap=0.08, rel_db=10.0,
                decay_win=None):
    """Onsets in a frequency band: steepest rise of the band's log-energy
    envelope; strength = peak dB rise.  Returns (times, rise_db[, decay_db])."""
    xb = sosfiltfilt(band_sos(lo, hi, sr), x)
    h = int(hop_s * sr)
    w = int(win * sr)
    e = np.convolve(xb.astype(np.float64) ** 2, np.ones(w) / w, mode="same")[::h]
    db = 10 * np.log10(e + 1e-10)
    fps = sr / h  # exact frame rate (h is an integer number of samples)
    d = np.diff(db, prepend=db[0])
    d = uniform_filter1d(d, 3)
    # rise over ~20 ms
    lag = int(0.02 * fps)
    rise = db - np.concatenate([np.full(lag, db[0]), db[:-lag]])
    floor = median_filter(db, int(1.0 * fps) | 1)
    pk, _ = find_peaks(rise, height=rel_db, distance=int(min_gap * fps))
    times, strength = [], []
    for p in pk:
        a = max(0, p - lag)
        # attack time: steepest slope within the rise window
        q = a + int(np.argmax(d[a:p + 1]))
        peak_db = db[p:p + int(0.03 * fps)].max()
        if peak_db < floor[p] + 3:
            continue
        times.append(q / fps)
        strength.append(peak_db)
    return np.array(times), np.array(strength)


def drum_onsets(d, sr, grid_P, grid_off):
    """Kick / snare / hat onsets from the drums stem."""
    # KICK: <120 Hz
    kt, kdb = band_onsets(d, sr, None, 120, win=0.012, min_gap=0.15, rel_db=12)
    # SNARE (and the clap-like snare of the quiet chorus): candidates are
    # 1.5-5 kHz attacks; a snare has a long noisy 0.5-5 kHz tail 40-120 ms after
    # the attack.  Keep candidates whose tail is within 8 dB of the loudest tail
    # in +-2.5 s and within 25 dB of the song-wide level (rejects stem bleed).
    # Kick-only beats / hats have tails 12-30 dB lower.
    st, sdb = band_onsets(d, sr, 1500, 5000, win=0.010, min_gap=0.15, rel_db=10)
    xb = sosfiltfilt(band_sos(500, 5000, sr), d)
    e = np.sqrt(np.convolve(xb.astype(np.float64) ** 2, np.ones(441) / 441, mode="same"))
    tail = np.array([20 * np.log10(e[int((t + 0.04) * sr):int((t + 0.12) * sr)].mean() + 1e-9) for t in st])
    rel = np.array([tail[i] - tail[np.abs(st - st[i]) < 2.5].max() for i in range(len(st))])
    thr = np.percentile(tail, 95) - 25
    keep = (rel > -8) & (tail > thr)
    st, sdb, stail = st[keep], sdb[keep], tail[keep]
    # HAT: >7 kHz, short; drop those coinciding with snares (snare noise also
    # reaches 7k+)
    ht, hdb = band_onsets(d, sr, 7000, None, win=0.006, min_gap=0.06, rel_db=9)
    # (and those within 30 ms of a kick: the kick's beater click reaches 10 kHz)
    for other, gap in ((st, 0.04), (kt, 0.03)):
        if len(other) and len(ht):
            dist = np.min(np.abs(ht[:, None] - other[None, :]), axis=1)
            keep = dist > gap
            ht, hdb = ht[keep], hdb[keep]
    return (kt, kdb), (st, stail), (ht, hdb), thr


def strength01(db_vals, lo_pct=5, hi_pct=95):
    if len(db_vals) == 0:
        return db_vals
    lo, hi = np.percentile(db_vals, lo_pct), np.percentile(db_vals, hi_pct)
    return np.clip((db_vals - lo) / (hi - lo + 1e-9) * 0.8 + 0.2, 0, 1)


def vocal_onsets(v, sr):
    """Vocal note onsets: log-mel spectral flux peaks (5 ms hop) plus pitch
    jumps > 0.8 semitone while voiced, restricted to active vocal frames."""
    f = dict(np.load(common.WORK / "vocal_feats.npz"))
    hop = float(f["hop_s"])
    on = f["onset"]
    rms = f["rms_db"]
    loc = maximum_filter1d(rms, int(2.0 / hop))
    active = (rms > -45) & (rms > loc - 25)
    thr = uniform_filter1d(on, int(0.4 / hop)) * 1.5 + 0.15 * np.percentile(on, 99)
    pk, _ = find_peaks(on, height=0, distance=int(0.09 / hop))
    pk = [p for p in pk if on[p] > thr[p] and active[min(len(active) - 1, p + int(0.03 / hop))]]
    t_flux = np.array(pk) * hop
    s_flux = np.array([on[p] for p in pk])
    # pitch jumps (legato note changes that have little spectral flux)
    f0 = f["f0"]
    midi = librosa.hz_to_midi(np.where(f["voiced"] > 0, f0, np.nan))
    med = median_filter(np.nan_to_num(midi, nan=0), 9)
    jumps = []
    w = int(0.04 / hop)
    for i in range(w, len(med) - w):
        a, b = med[i - w], med[i + w]
        if a > 0 and b > 0 and abs(b - a) > 0.8 and active[i]:
            jumps.append(i)
    # collapse runs
    t_pitch, last = [], -1e9
    for i in jumps:
        if i - last > int(0.1 / hop):
            t_pitch.append(i * hop)
        last = i
    t_pitch = np.array(t_pitch)
    ts = list(zip(t_flux, s_flux / (np.percentile(s_flux, 95) + 1e-9)))
    for t in t_pitch:
        if len(t_flux) == 0 or np.min(np.abs(t_flux - t)) > 0.08:
            ts.append((t, 0.35))
    ts.sort()
    return [(float(t), float(min(1.0, max(0.1, s)))) for t, s in ts]


# ---------------------------------------------------------------------------
def main(plots=False):
    mix, _ = common.load_mix(SR)
    duration = len(mix) / SR
    stems = {n: common.load_stem(n, sr=SR)[0][: len(mix)] for n in ("vocals", "drums", "bass", "other")}
    for n in stems:
        if len(stems[n]) < len(mix):
            stems[n] = np.pad(stems[n], (0, len(mix) - len(stems[n])))

    tempo_est, tempo_auto = estimate_tempo(librosa.resample(stems["drums"], orig_sr=SR, target_sr=22050), 22050)
    tempo_range = tuple(TEMPO_RANGE) if TEMPO_RANGE else tempo_auto
    print(f"tempo estimate {tempo_est:.2f} BPM; search window {tempo_range}{' (tuning.py)' if TEMPO_RANGE else ''}")
    o, ofps = onset_env(stems["drums"], mix, SR)
    bpm, P, off, kick_res = fit_grid(stems["drums"], SR, duration, o, ofps, tempo_range)
    print(f"tempo {bpm:.3f} BPM  period {P:.5f}s  first beat {off:.4f}s  kick residual sd {kick_res.std()*1000:.1f} ms")
    const = off + P * np.arange(int((duration - off) / P) + 1)
    drift = dict(constant=round(spread_ms(local_shifts(const, o, ofps)), 1))
    grid = GRID or ("tracked" if drift["constant"] > DRIFT_MS else "constant")
    print(f"constant grid: local phase error spread {drift['constant']:.0f} ms -> {grid} grid{' (tuning.py)' if GRID else ''}")
    if grid == "tracked":
        kt0, _ = band_onsets(stems["drums"], SR, None, 120, win=0.012, min_gap=0.15, rel_db=12)
        beats, kick_res = track_beats(stems["drums"], mix, SR, bpm, kt0, duration)
        kick_res = kick_res[np.abs(kick_res) < 0.06]
        per = np.diff(beats)
        drift["tracked"] = round(spread_ms(local_shifts(beats, o, ofps)), 1)
        print(f"tracked grid: {len(beats)} beats, period {per.min()*1000:.0f}-{per.max()*1000:.0f} ms, "
              f"kick residual sd {kick_res.std()*1000:.1f} ms, local phase error spread {drift['tracked']:.0f} ms")
    else:
        beats = const
    if drift[grid] > DRIFT_MS:
        print(f"WARNING: the {grid} grid's local phase error spreads {drift[grid]:.0f} ms (> {DRIFT_MS}): "
              f"check the beats on the plots (--plots)")

    (kt, kdb), (st, sdb), (ht, hdb), sn_thr = drum_onsets(stems["drums"], SR, P, off)
    if BAR_PHASE is None:
        phase, phase_ev = bar_phase(beats, st, stems["other"] + stems["bass"], SR)
        print("bar phase", phase, "from", phase_ev)
    else:
        phase, phase_ev = BAR_PHASE, None
    # bar phase: beat `phase` is the first downbeat
    beat_in_bar = (np.arange(len(beats)) - phase) % 4
    downbeats = beats[beat_in_bar == 0]
    bar_t = lambda k: float(downbeats[k]) if k < len(downbeats) else float(downbeats[-1] + (k - len(downbeats) + 1) * 4 * P)

    # envelopes -------------------------------------------------------------
    n = int(math.ceil(duration * FPS))
    env = {}
    env["rms"] = frame_rms(mix, SR)[:n]
    for name, (lo, hi) in {"low": (None, 150), "mid": (150, 2000), "high": (4000, None)}.items():
        env[name] = frame_rms(sosfiltfilt(band_sos(lo, hi, SR), mix), SR)[:n]
    for s in ("vocal", "drums", "bass", "other"):
        env[s] = frame_rms(stems["vocals" if s == "vocal" else s], SR)[:n]
    for k in env:
        e = smooth_env(env[k])
        env[k] = [round(float(x), 3) for x in norm01(e)]
        assert len(env[k]) == n

    # onsets -------------------------------------------------------------------
    onsets = {
        "kick": [[round(float(t), 3), round(float(s), 3)] for t, s in zip(kt, strength01(kdb))],
        "snare": [[round(float(t), 3), round(float(s), 3)] for t, s in zip(st, strength01(sdb))],
        "hat": [[round(float(t), 3), round(float(s), 3)] for t, s in zip(ht, strength01(hdb))],
        "vocal": [[round(t, 3), round(s, 3)] for t, s in vocal_onsets(stems["vocals"], SR)],
    }
    # snare / kick position statistics -> bar phase evidence
    def pos_hist(ts):
        # 8th-note position in the bar (0 = downbeat), against the beats actually used
        ts = np.asarray(ts)
        bi = np.interp(ts, beats, np.arange(len(beats)), left=np.nan, right=np.nan)
        bi = bi[~np.isnan(bi)] - phase
        return np.bincount(np.round(bi * 2).astype(int) % 8, minlength=8).tolist()
    print("kick   8th-positions in bar:", pos_hist(kt))
    print("snare  8th-positions in bar:", pos_hist(st))
    print("hat    8th-positions in bar:", pos_hist(ht))

    # sections -------------------------------------------------------------------
    if SECTION_BARS is None:
        lyrics_json = common.DATA / "lyrics.json"
        if not lyrics_json.exists():
            raise SystemExit(f"{lyrics_json} is missing: sections are placed from the aligned lyrics, run align.py first")
        # (against the downbeats as written, to the ms: a word fixed onto a downbeat starts its section there)
        section_map = section_bars(np.round(downbeats, 3), json.loads(lyrics_json.read_text())["lines"],
                                   json.loads(common.SECTIONS_SRC.read_text()))
    else:
        section_map = SECTION_BARS
    sections = []
    for name, a, b in section_map:
        s = 0.0 if a is None else bar_t(a)
        e = duration if b is None else bar_t(b)
        sections.append(dict(name=name, start=round(s, 3), end=round(e, 3), bars=[a if a is not None else -1, b]))
    for s in sections:
        s.pop("bars")

    doc = dict(
        duration=round(duration, 3),
        bpm=round(bpm, 3),
        beat_period=round(P, 5),
        time_signature=4,
        beats=[round(float(t), 3) for t in beats],
        downbeats=[round(float(t), 3) for t in downbeats],
        sections=sections,
        fps=FPS,
        **env,
        onsets=onsets,
        source=common.source(),
        tempo_range=list(tempo_range),
        grid=grid,
        bar_phase=phase,
        detected=dict(tempo_estimate=round(tempo_est, 2), drift_ms=drift, bar_phase=phase_ev,
                      pinned=[k for k in ("TEMPO_RANGE", "GRID", "BAR_PHASE", "SECTION_BARS")
                              if getattr(common.CFG, k) is not None]),
        notes=NOTES.format(song=common.PROJECT, bpm=bpm, off=off, P=P, first_db=float(downbeats[0]),
                           grid=(GRID_TRACKED if grid == "tracked" else GRID_CONSTANT).format(bpm=bpm, off=off, P=P, kick_sd=kick_res.std() * 1000),
                           kick_sd=kick_res.std() * 1000,
                           sn=len(st), kk=len(kt), hh=len(ht)),
    )
    (common.DATA / "audio.json").write_text(json.dumps(doc, separators=(",", ":")))
    print("wrote", common.DATA / "audio.json", f"{len(beats)} beats, {len(downbeats)} downbeats, "
          f"{len(kt)} kicks, {len(st)} snares, {len(ht)} hats, {len(onsets['vocal'])} vocal onsets")
    if plots:
        make_plots(doc, stems)
    return doc


GRID_CONSTANT = (
    "Tempo is treated as constant: {bpm:.3f} BPM (period {P:.5f} s), fitted over the whole "
    "song on drum+mix onset envelopes, phase refined on kick attack times; first beat "
    "{off:.3f} s, kick residual sd {kick_sd:.1f} ms. The grid is extrapolated through any "
    "drum-less passage. ")
GRID_TRACKED = (
    "The tempo drifts (a constant {bpm:.3f} BPM fit is off by up to ~140 ms), so the beats are "
    "tracked: dynamic-programming beat tracking on drum+mix onset envelopes with {bpm:.3f} BPM as "
    "the prior (tightness 1600), each beat moved by the median kick-attack residual of its +-8 "
    "beats; kick residual sd {kick_sd:.1f} ms. `bpm` is the song-wide average; beats[] is the "
    "grid, so read beat and bar positions from it, not from bpm. ")
NOTES = (
    "Timeline = the WAV master of '{song}' (see `source`); Demucs separates that same file, so "
    "stems need no time correction. "
    "{grid}"
    "Bar phase from the snare backbeat (2 and 4) plus the chord changes (see `detected`); first downbeat "
    "{first_db:.3f} s, and bar k starts at downbeats[k]. "
    "Sections start on downbeats: each section of '{song}' data/sections.json on the latest downbeat at "
    "or before its first sung word (sections_bars.py), unless its tuning.py pins SECTION_BARS. "
    "Envelopes: 100 fps, frame i centred at i/100 s, 46 ms RMS window, one-pole smoothing "
    "(10 ms attack / 90 ms release), each divided by its own 99th percentile and clipped "
    "to 0..1 (linear amplitude). low <150 Hz, mid 150-2000 Hz, high >4 kHz of the full mix; "
    "vocal/drums/bass/other = stem RMS. "
    "Onsets [time, strength 0-1] from the drums stem: kick = attack (steepest rise) of the "
    "<120 Hz band ({kk}); snare = 1.5-5 kHz attacks whose 0.5-5 kHz noise tail 40-120 ms later "
    "is in the loudest local class ({sn}); hat = >7 kHz attacks not within 40 ms of a snare or "
    "30 ms of a kick ({hh}). vocal = note onsets from the vocal stem (log-mel flux peaks + "
    "legato pitch jumps > 0.8 semitone), including backing vocals / ad-libs."
)


def make_plots(doc, stems):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    t = np.arange(len(doc["rms"])) / FPS
    # 12 s windows across the whole song
    wins = [(t0, min(t0 + 12, doc["duration"])) for t0 in range(0, int(math.ceil(doc["duration"])), 12)]
    for (t0, t1) in wins:
        fig, ax = plt.subplots(3, 1, figsize=(22, 11), sharex=True,
                               gridspec_kw=dict(height_ratios=[2, 1.6, 1.4]))
        d = stems["drums"][int(t0 * SR):int(t1 * SR)]
        S = librosa.amplitude_to_db(np.abs(librosa.stft(d, n_fft=1024, hop_length=128)), ref=np.max)
        ax[0].imshow(S, origin="lower", aspect="auto", cmap="magma", vmin=-60, vmax=0,
                     extent=[t0, t0 + S.shape[1] * 128 / SR, 0, SR / 2])
        ax[0].set_ylim(0, 12000)
        ax[0].set_ylabel("drums stem")
        m = (t >= t0) & (t <= t1)
        for k, c in [("rms", "k"), ("low", "tab:red"), ("mid", "tab:green"), ("high", "tab:blue")]:
            ax[1].plot(t[m], np.array(doc[k])[m], color=c, lw=1, label=k)
        ax[1].legend(loc="upper left", fontsize=8)
        for k, c in [("vocal", "tab:purple"), ("drums", "tab:orange"), ("bass", "tab:brown"), ("other", "tab:olive")]:
            ax[2].plot(t[m], np.array(doc[k])[m], color=c, lw=1, label=k)
        ax[2].legend(loc="upper left", fontsize=8)
        for b in doc["beats"]:
            if t0 <= b <= t1:
                for a_ in ax:
                    a_.axvline(b, color="gray", lw=0.6, alpha=0.6)
        for b in doc["downbeats"]:
            if t0 <= b <= t1:
                for a_ in ax:
                    a_.axvline(b, color="c" if a_ is ax[0] else "k", lw=1.8)
        for name, y, c in [("kick", 1500, "tab:red"), ("snare", 5000, "w"), ("hat", 9500, "yellow")]:
            for (ot, s) in doc["onsets"][name]:
                if t0 <= ot <= t1:
                    ax[0].plot([ot], [y], marker="v", color=c, ms=4 + 8 * s)
        for (ot, s) in doc["onsets"]["vocal"]:
            if t0 <= ot <= t1:
                ax[2].plot([ot], [1.02], marker="v", color="tab:purple", ms=3 + 6 * s)
        for s in doc["sections"]:
            if t0 <= s["start"] <= t1:
                ax[1].text(s["start"], 1.02, s["name"], fontsize=14, color="tab:red")
                for a_ in ax:
                    a_.axvline(s["start"], color="tab:red", lw=2.5)
        ax[2].set_xlim(t0, t1)
        ax[2].set_xticks(np.arange(np.ceil(t0), t1, 0.5))
        fig.tight_layout()
        fig.savefig(common.QA / f"audio_{int(t0):03d}.png", dpi=65)
        plt.close(fig)
    # overview
    fig, ax = plt.subplots(2, 1, figsize=(24, 7), sharex=True)
    for k, c in [("rms", "k"), ("low", "tab:red"), ("high", "tab:blue")]:
        ax[0].plot(t, doc[k], color=c, lw=0.6, label=k)
    for k, c in [("vocal", "tab:purple"), ("drums", "tab:orange"), ("bass", "tab:brown"), ("other", "tab:olive")]:
        ax[1].plot(t, doc[k], color=c, lw=0.6, label=k)
    for s in doc["sections"]:
        for a_ in ax:
            a_.axvline(s["start"], color="tab:red", lw=1.5)
        ax[0].text(s["start"] + 0.2, 1.03, s["name"], fontsize=10, color="tab:red")
    for a_ in ax:
        a_.legend(loc="upper right", fontsize=8)
    ax[1].set_xticks(np.arange(0, doc["duration"] + 1, 5))
    fig.tight_layout()
    fig.savefig(common.QA / "audio_overview.png", dpi=65)
    plt.close(fig)


if __name__ == "__main__":
    main(plots="--plots" in sys.argv)
