import sys, glob, json, os
from PIL import Image, ImageDraw, ImageFont
v = sys.argv[1]; per = 12; cols = 3; tw, th = 640, 360
W = json.load(open(f"{v}/whisper.json"))
font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20) if os.path.exists("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf") else ImageFont.load_default()
files = sorted(glob.glob(f"{v}/f/*.jpg")); os.makedirs(f"{v}/sheets", exist_ok=True)
def sung(t):
    return " / ".join(s["text"] for s in W if s["start"] <= t + 0.5 and s["end"] >= t - 0.5)[:70]
for k in range(0, len(files), per):
    chunk = files[k:k + per]; rows = (len(chunk) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tw, rows * (th + 28)), (40, 40, 40)); d = ImageDraw.Draw(sheet)
    for i, f in enumerate(chunk):
        t = k + i; x, y = (i % cols) * tw, (i // cols) * (th + 28)
        sheet.paste(Image.open(f), (x, y + 28))
        d.text((x + 6, y + 3), f"{t//60}:{t%60:02d}  {sung(t)}", fill=(255, 220, 0), font=font)
    sheet.save(f"{v}/sheets/{k:04d}.jpg", quality=85)
print(v, len(glob.glob(f"{v}/sheets/*.jpg")))
