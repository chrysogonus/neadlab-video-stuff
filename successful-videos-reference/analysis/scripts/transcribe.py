import sys, json, librosa
from faster_whisper import WhisperModel
m = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8", cpu_threads=16,
                 download_root="/home/chrysogonus/workspace/neadlab-video-stuff/analysis/.cache/faster-whisper")
for wav, out in zip(sys.argv[1::2], sys.argv[2::2]):
    segs, _ = m.transcribe(librosa.load(wav, sr=16000, mono=True)[0], language="en", word_timestamps=True, vad_filter=False, condition_on_previous_text=False)
    res = [{"start": s.start, "end": s.end, "text": s.text.strip()} for s in segs]
    json.dump(res, open(out, "w"), indent=1)
    print(out, len(res))
