import json, sys, numpy as np
for v in sys.argv[1:]:
    M = json.load(open(f"{v}/metrics.json")); R = M["rows"]; C = M["cuts"]
    L = np.array([r["luma"] for r in R]); ch = np.array([r["change"] for r in R])
    print(f"\n==== {v}: {len(R)} s, tempo {M['tempo']:.1f} (beat {60/M['tempo']*1000:.0f} ms)")
    for k in ["luma","contrast","black","white","ground","dark09","sat","sat_area","colorful","edges","motion"]:
        if k not in R[0]: continue
        a = np.array([r[k] for r in R]); print(f"  {k:9s} mean {a.mean():.3f}  p10 {np.percentile(a,10):.3f}  p50 {np.median(a):.3f}  p90 {np.percentile(a,90):.3f}")
    if "ground" in R[0]: print(f"  HOUSE STYLE: ground (median p20 luma) {np.median([r['ground'] for r in R]):.3f} (<= 0.05)   pixels < 0.09: {np.mean([r['dark09'] for r in R])*100:.0f}% (>= 40%)   accent area median: {np.median([r['sat_area'] for r in R])*100:.1f}% (<= 5%)")
    print(f"  light frames (luma>.5): {(L>.5).mean()*100:.0f}%   dark (<.15): {(L<.15).mean()*100:.0f}%   mid: {((L>=.15)&(L<=.5)).mean()*100:.0f}%")
    for th in (0.03,0.06,0.1):
        print(f"  1s samples with composition change > {th}: {(ch[1:]>th).mean()*100:.0f}%")
    hues = [r["hue"] for r in R if r["hue"] is not None]
    hh = np.bincount(np.array(hues)//30, minlength=12)
    print("  dominant hue of saturated px (30° bins, count of seconds):", {i*30+15:int(c) for i,c in enumerate(hh) if c})
    print(f"  seconds w/ no saturated colour (>1% area): {sum(r['hue'] is None for r in R)}")
    t = np.array([c["t"] for c in C]); off = np.array([c["beat_off_ms"] for c in C])
    if len(t):
        sl = np.diff(np.concatenate([[0], t, [len(R)]]))
        print(f"  hard cuts: {len(C)} = {len(C)/len(R)*60:.1f}/min; shot length median {np.median(sl):.2f}s p10 {np.percentile(sl,10):.2f} p90 {np.percentile(sl,90):.2f}")
        print(f"  cut offset to nearest tracked beat: |off|<=33ms {np.mean(np.abs(off)<=33)*100:.0f}%, <=70ms {np.mean(np.abs(off)<=70)*100:.0f}%, median signed {np.median(off):.0f}ms")
        bi = np.array([c["beat_idx"] for c in C]); print("  cut beat index mod 4:", np.bincount(bi%4, minlength=4).tolist(), " mod 2:", np.bincount(bi%2,minlength=2).tolist())
