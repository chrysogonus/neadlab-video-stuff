# harvest-remix v15: delivery record

Completed 2026-10-18 from the user-approved V15.md refinement plan. Nothing committed or pushed. v14 sources and delivery record remain in backups/v14-sources/; out/harvest-remix-v14.mp4 is preserved.

**Upload:** repository-root out/harvest-remix.mp4. Identical versioned copy: out/harvest-remix-v15.mp4.
**Thumbnail:** renders/thumbnail-v13.png, unchanged.

- H.264, 1920×1080, constant 60 fps, 9,864 frames, 164.400 seconds.
- Original master WAV encoded directly to AAC, 48 kHz, 320 kbps target (324,377 bps measured).
- Upload size 1,495,530,094 bytes (about 1.50 GB).

## Changes from v14

- 03: full vault rim and seven bolts centred inside frame; a hot-core seam light travels with locking.
- 04: first clock, Archie and floor alarm repositioned together, with the whole clock retained through camera movement.
- 17: iris/envelope raised and reduced; complete curved lyric and later landing remain inside frame.
- 05: one identifiable orange-sealed envelope follows a continuous trajectory through the final descent and into the drawer, replacing the late substitute-envelope spawn. First five shots preserved.
- 08: Enigma bank reframed; branching contact-bound white-core arcs, warm halos, seam electricity, contact illumination, sparks and scanning laser on word locks.
- 11: framing-only correction under the user's explicit override of the old byte lock. Globe anchor moves inward/down and far FOV widens; detail, shaders, timing and other motion preserved.
- 16: ambiguous eye replaced by connected longitudinal fibre cutaway; clearer COPY label and fewer competing annotations. Archie is the only printer, with a scanning beam attached to his emerging copy.
- 22/23: continuous scanning arcs, orange exposure, cyan/violet electrical fronts and outgoing record points make the archive visibly threatened. Shared world-space helper preserves the handoff and the final letter/chain/seal bookend.
- 15: small finger strokes replace fast head/arm flicks; one slower ticket glance, restrained SEND and settled look. Ticket notification clears the letter and protocol strip.
- Exact existing GSAP 3.14.2 is now bundled locally with verified original SHA-384. A CDN download failure blocked the first proof; the successful retry and final render use identical local bytes.

All scene spans and sung-word starts remain fixed; master audio is unchanged. SYSTEM.md V9 records the local breach-colour exception and petabytes framing override.

## Measurements from the exported upload

| Measure | v15 | Target |
|---|---:|---:|
| Ground luma, median p20 |0.035|≤0.05|
| Pixels darker than 0.09, mean |60%|≥40%|
| Accent area, median |4.4%|≈5% or less|
| Light frames |12%|10–20%|
| Composition change per second, >0.03 |54.9% (55% rounded)|55% guideline|

Composition change is 54.9%, just below the nominal 55% guideline; the summary rounds it to 55%.

Full results: renders/measure-v15/metrics.json and renders/summary-v15.log.

## Verification and evidence

- Full serial HyperFrames 0.8.164 check with software WebGL passed: renders/check-v15-final-retry.json,zero errors. Nine layout samples;32/33 contrast checks pass with one retained warning in unchanged 10-ticket. Existing file-size, readback and tween-tail warnings remain; the latter match v14's report. A concurrent startup timeout is superseded by the successful serial check.
- Ending motion proof: renders/proof-v15-ending.mp4, 19 seconds at 60 fps. Its ending sheet and dense Archie strip were inspected.
- Visual review: every scene start,first/last frame,changed hero poses and breach boundary; then all 164  exported one-second frames and full-resolution decoded close-ups. Export sheets: renders/measure-v15/sheets/. Close-ups: renders/decoded-v15/.
- Envelope path verified at 60 fps through actual Three.js camera matrices. Shared threat state returns identically under reverse seek; geometry is finite and built once without postprocessing.
- Delivery render completed in 59m 45.1s: screenshot capture,software GPU, three workers. renders/render-v15.log.
- Full upload decode passed with FFmpeg -xerror -err_detect explode: renders/decode-upload-v15.log.
- Format/frame count: renders/ffprobe-v15.json. Audio alignment: 0.0 ms lag at 10, 70, 145 seconds; correlation≥0.99981. renders/audio-alignment-v15.json.
- Repository checks passed before and after rendering: renders/repo-check-v15.log and renders/repo-check-v15-final.log.
- Finishing status: renders/finish-v15-status.json,ok: true. Delivery hashes: renders/delivery-hashes-v15.sha256. Source hashes: renders/sources-v15.sha256; verified after render. Timing invariants: renders/invariants-v15.json.

HyperFrames remains pinned at 0.8.164 under the project reproducibility contract. Studio preview: http://localhost:3017/#project/video. The HyperFrames desktop app adds chat editing: https://hyperframes.dev/studio/download?os=linux.
