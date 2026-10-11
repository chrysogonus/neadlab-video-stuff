"""Harvest Now, Decrypt Later: the analysis constants the committed data/*.json were made with."""

TEMPO_RANGE = (90.0, 105.0)

SECTION_BARS = [
    # Derived from lyrics/sections.json against the fitted grid: `uv run python sections_bars.py`.
    # Each section starts on the latest downbeat at or before its first sung line, so a plate
    # is never late for its own first word (the same rule timeline.ts's cut() uses for beats).
    ("intro", None, 3),
    ("verse1", 3, 11),
    ("prechorus1", 11, 16),
    ("chorus1", 16, 27),
    ("verse2", 27, 35),
    ("prechorus2", 35, 38),
    ("chorus2", 38, 47),
    ("bridge", 47, 55),
    ("finalchorus", 55, 71),
    ("outro", 71, None),
]

# The song's jargon, so the decoder does not "correct" it into something commoner.
WHISPER_PROMPT = ("Song lyrics: harvest now, decrypt later; qubits, petabytes, padlock, "
                  "ciphertext, blueprint, passwords, decade.")

PRON = {
    # "qubits" is spelled qu- but sung /kjuː/; the grapheme models align it badly as-is.
    "qubits,": "cue bits", "qubits": "cue bits",
    # split the compound so refinement gets a boundary inside it
    "Petabytes,": "peta bytes", "Petabytes": "peta bytes",
}
ALT = {}

LINE_WINDOWS = {}
ANCHORS = {}
FIX = {}

# (inherited from the upstream song and kept as the committed data was made with it)
EXTRA_DESC = [
    (34.9, 38.3, "backing-vocal tail / 'ah' ad-lib after 'eyes' over the break (chorus 1 end)"),
    (108.5, 110.15, "lead-in before 'Just transformers': Whisper hears a stuttered 'Just, just, just' (low confidence)"),
    (122.4, 125.9, "sustained backing 'ah' pad under 'I'm upping my P(doom)' (final chorus) - lead is buried here"),
    (140.6, 153.5, "outro chant: repeated 'oh' / 'oh-oh' vocal hook (Whisper: 'Oh, oh, oh...') until the drums stop at ~153"),
]

ALIGN_NOTES = (
    "Timeline = gapless mp3 decode (same as data/audio.json); Demucs stems shifted -23 ms "
    "(LAME encoder delay). Method: (1) CTC emissions (20 ms frames) of the Demucs vocal stem "
    "from two acoustic models, torchaudio MMS_FA and wav2vec2-large-lv60k-960h, each on the "
    "mono sum and on the left and right channels (choruses are double-tracked L/R), fused as a "
    "probability mixture; (2) one global constrained Viterbi forced alignment of all 46 lines "
    "over the whole song with a garbage 'star' token between lines to absorb ad-libs; "
    "acronyms/odd words aligned with phonetic spellings (AGI='ay gee i', P(doom)='pee doom', "
    "ChatGPT='chat gee pee tee', NVDA='en vee dee ay', MLP='em el pee', CDR='see dee are', "
    "PTO='pee tee oh', GPU='gee pee you', RLHF='are el aitch eff', One E thirty='one ee thirty', "
    "Neumann's='noymans'); (3) signal refinement per syllable unit on the vocal stem: start moved "
    "to the voice re-entry after a rest, snapped to the nearest spectral-flux onset, or moved back "
    "to the start of s/sh/ch/f/th frication; ends = next word start when legato, else when the "
    "voice drops 15 dB below the word level (held notes keep their full length); (4) "
    "cross-check against mlx-whisper large-v3-turbo word timestamps and the individual "
    "models/channels, plus a mel-roformer karaoke lead-vocal stem for the final chorus; "
    "(5) manual verification of every line on zoomed spectrogram/pitch/onset plots "
    "(analysis/qa/zl_*.png) with ~20 manual corrections (align.py FIX). "
    "conf: 0.35 + agreement of the independent alignments (<=60 ms) + CTC posterior + "
    "Whisper agreement; manual fixes carry their own conf. 'syl' = start/end of each spelled "
    "letter or compound part (AGI, ChatGPT, P(doom), NVDA, MLP, CDR, PTO, GPU, RLHF, "
    "Killswitch, Post-Chinchilla, super-dense, pre-training, self-upgrade). "
    "NVDA pronunciation is ambiguous: 'Nvidia' scores slightly better acoustically than "
    "'en-vee-dee-ay', but the word timing is the same either way (62.54-63.36), so syl uses "
    "the letter split. "
    "Uncertain words: final-chorus 'I'm upping my' (124.5-125.4, buried under a backing pad, "
    "placed by rhythm of the other choruses, +-100 ms); 'are' (83.93, could be 84.58); "
    "'me' (57.14); 'alive' (21.35); 'eat' (20.27); 'Just transformers' region (108.5-110.2 lead-in); "
    "chorus 'I'm' pickups (22.76, 59.13, 95.47) +-50 ms; 'lies,' 31.14. Everything else "
    "is expected within ~30-50 ms at word starts."
)
