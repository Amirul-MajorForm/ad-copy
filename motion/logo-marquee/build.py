"""Build squarespace-snippet.html: a self-contained logo marquee with the PNGs inlined.

Run: python3 build.py   (reads logos/*.png, writes squarespace-snippet.html)
"""
import base64, math, os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))

# Rows in display order; each row scrolls the opposite way to the one above it.
ROWS = [
    [("oatside", "Oatside"), ("blackmores", "Blackmores"), ("the-ordinary", "The Ordinary"),
     ("yoga-movement", "Yoga Movement"), ("strong-pilates", "Strong Pilates")],
    [("sebamed", "Sebamed"), ("dettol", "Dettol"), ("hada-labo", "Hada Labo"),
     ("melano-cc", "Melano CC"), ("shiseido-professional", "Shiseido Professional")],
    [("schwarzkopf-professional", "Schwarzkopf Professional"), ("flexar", "Flexar"), ("mbold", "MBOLD"),
     ("urban-company", "Urban Company"), ("sunday", "Sunday")],
]
SPEEDS = [36, 28, 40]  # pixels per second, per row
AREA = 6400            # target visual area per logo in px^2
MAX_H = 60


def logo_tag(slug, name):
    path = os.path.join(HERE, "logos", slug + ".png")
    w, h = Image.open(path).size
    dh = min(MAX_H, math.sqrt(AREA / (w / h)))
    data = base64.b64encode(open(path, "rb").read()).decode()
    return f'<img src="data:image/png;base64,{data}" alt="{name}" style="height:{dh:.0f}px">'


rows_html = "\n".join(
    f'  <div class="mf-logos__row" data-dir="{"right" if i % 2 else "left"}" data-speed="{SPEEDS[i]}">'
    f'<div class="mf-logos__track"><div class="mf-logos__set">{"".join(logo_tag(*l) for l in row)}</div></div></div>'
    for i, row in enumerate(ROWS)
)

TEMPLATE = open(os.path.join(HERE, "template.html")).read()
out = TEMPLATE.replace("<!--ROWS-->", rows_html)
open(os.path.join(HERE, "squarespace-snippet.html"), "w").write(out)
print("wrote squarespace-snippet.html", len(out), "bytes")
