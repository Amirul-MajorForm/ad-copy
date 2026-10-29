"""Build squarespace-snippet.html: a self-contained logo marquee, pure CSS (no script).

Run: python3 build.py   (reads logos/*.png, writes squarespace-snippet.html)

Each logo image is stored once, as a CSS variable, and reused for every repeat, so the loop can repeat logos
as often as wide screens need without the code growing. Because there is no script, the Squarespace editor
shows the block at its real size.
"""
import base64, math, os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))

# Rows in display order; each row scrolls the opposite way to the one above it.
ROWS = [
    [("oatside", "Oatside"), ("blackmores", "Blackmores"), ("the-ordinary", "The Ordinary"),
     ("yoga-movement", "Yoga Movement"), ("masterchef", "MasterChef", "new"), ("strong-pilates", "Strong Pilates")],
    [("sebamed", "Sebamed"), ("dettol", "Dettol"), ("atomic-events", "Atomic Events", "new"), ("hada-labo", "Hada Labo"),
     ("melano-cc", "Melano CC"), ("shiseido-professional", "Shiseido Professional")],
    [("schwarzkopf-professional", "Schwarzkopf Professional"), ("flexar", "Flexar"), ("mbold", "MBOLD"),
     ("urban-company", "Urban Company"), ("sunday", "Sunday")],
]
SPEEDS = [36, 28, 40]  # pixels per second, per row
AREA = 6400            # target visual area per logo in px^2, so wide and stacked logos look equally heavy
MAX_H = 60
GAP = 72               # px between logos (smaller on narrow screens; the loop stays seamless either way)
COVER = 2200           # each half of a row's track is at least this wide, so wide screens never see a gap


def size(slug):
    w, h = Image.open(os.path.join(HERE, "logos", slug + ".png")).size
    dh = min(MAX_H, math.sqrt(AREA / (w / h)))
    return round(dh * w / h), round(dh)


def data(slug):
    return "data:image/png;base64," + base64.b64encode(open(os.path.join(HERE, "logos", slug + ".png"), "rb").read()).decode()


slugs = [l[0] for row in ROWS for l in row]
images = ";\n    ".join(f'--mf-l-{s}: url("{data(s)}")' for s in slugs)

rows_html = []
for i, row in enumerate(ROWS):
    one = sum(size(l[0])[0] + GAP for l in row)          # width of one pass through the row
    reps = max(1, math.ceil(COVER / one))                  # passes per half
    half = one * reps

    def logos(hidden):
        out = []
        for r in range(reps):
            for s, name, *flag in row:
                w, h = size(s)
                new = bool(flag and flag[0] == "new")
                label = "" if hidden or r else f' role="img" aria-label="{name}{" (new client)" if new else ""}"'
                rep = ' data-rep=""' if r else ""
                out.append(f'<i class="mf-logos__l"{label}{rep}{" data-new" if new else ""} style="--l:var(--mf-l-{s});--w:{w};--h:{h}"></i>')
        return "".join(out)
    rows_html.append(
        f'  <div class="mf-logos__row" data-dir="{"right" if i % 2 else "left"}" style="--mf-dur:{half / SPEEDS[i]:.1f}s">'
        f'<div class="mf-logos__track"><div class="mf-logos__set">{logos(False)}</div>'
        f'<div class="mf-logos__set" aria-hidden="true">{logos(True)}</div></div></div>')

out = f"""<!-- MajorForm logo marquee. Paste this whole file into a Squarespace Code block with Display Source turned off.
     Rows alternate direction and loop forever; hovering pauses them. No scripts, so the editor shows its real size.
     To add a logo: put a white PNG in logos/, add it to ROWS in build.py and rebuild. Add "new" to show a NEW badge. -->
<div class="mf-logos" role="region" aria-label="Brands we've worked with">
{chr(10).join(rows_html)}
</div>
<style>
  .mf-logos {{
    {images};
    --mf-scale: 1;  /* logo size relative to desktop: smaller on tablets and phones */
    --mf-gap: clamp(40px, 5vw, {GAP}px);
    display: grid;
    gap: clamp(28px, 4vw, 48px);
    padding-block: 12px;
    overflow: hidden;
    -webkit-mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
    mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
  }}
  .mf-logos__row {{ overflow: hidden; padding-top: 10px; margin-top: -10px; }}
  /* two identical halves; sliding by exactly one half makes the loop seamless */
  .mf-logos__track {{ display: flex; width: max-content; animation: mf-logos-scroll var(--mf-dur, 60s) linear infinite; }}
  .mf-logos__row[data-dir="right"] .mf-logos__track {{ animation-direction: reverse; }}
  .mf-logos:hover .mf-logos__track {{ animation-play-state: paused; }}
  .mf-logos__set {{ display: flex; align-items: center; gap: var(--mf-gap); padding-right: var(--mf-gap); }}
  .mf-logos__l {{ position: relative; display: block; flex: none; width: calc(var(--w) * var(--mf-scale) * 1px); height: calc(var(--h) * var(--mf-scale) * 1px); background: var(--l) center / contain no-repeat; opacity: .92; }}
  /* "NEW" badge on recently added clients (mark a logo with "new" in ROWS) */
  .mf-logos__l[data-new]::after {{ content: "NEW"; position: absolute; top: -9px; right: -26px; padding: 3px 7px; border-radius: 999px;
    background: #ffefae; color: #04202c; font: 700 9px/1 "Space Grotesk", system-ui, sans-serif; letter-spacing: .12em;
    box-shadow: 0 4px 12px -6px rgba(0, 0, 0, .6); }}
  @media (max-width: 899px) {{ .mf-logos {{ --mf-scale: .8; }} }}
  @media (max-width: 599px) {{ .mf-logos {{ --mf-scale: .6; --mf-gap: 32px; gap: 18px; }} }}
  @keyframes mf-logos-scroll {{ from {{ transform: translateX(0); }} to {{ transform: translateX(-50%); }} }}
  @media (prefers-reduced-motion: reduce) {{
    .mf-logos {{ -webkit-mask-image: none; mask-image: none; }}
    .mf-logos__track {{ animation: none; width: auto; justify-content: center; }}
    .mf-logos__set {{ flex-wrap: wrap; justify-content: center; padding-right: 0; row-gap: 28px; }}
    .mf-logos__set[aria-hidden], .mf-logos__l[data-rep] {{ display: none; }}
  }}
</style>
"""
open(os.path.join(HERE, "squarespace-snippet.html"), "w").write(out)
print("wrote squarespace-snippet.html", len(out), "bytes")
