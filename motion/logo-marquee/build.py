"""Build squarespace-snippet.html: a static client logo wall with service filter pills, pure CSS (no script).

Run: python3 build.py   (reads logos/*.png, writes squarespace-snippet.html)

Choosing a pill (performance marketing, social commerce, social media) keeps that service's brands bright and greys
out the rest. The pills are radio buttons styled as pills, so it works without a script and the Squarespace editor
shows the block at its real size.
"""
import base64, math, os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))

# Filter pills, in order. "all" is the default and shows every brand at full strength.
FILTERS = [("all", "All clients"), ("performance", "Performance marketing"), ("commerce", "Social commerce"), ("social", "Social media")]

# Logos in display order: (file in logos/, name, services, "new" to show a NEW badge)
LOGOS = [
    ("oatside", "Oatside", "performance", ""), ("blackmores", "Blackmores", "performance", ""),
    ("the-ordinary", "The Ordinary", "commerce", ""), ("yoga-movement", "Yoga Movement", "performance", ""),
    ("masterchef", "MasterChef", "performance", "new"), ("strong-pilates", "Strong Pilates Singapore", "performance", ""),
    ("sebamed", "Sebamed", "commerce", ""), ("dettol", "Dettol", "", ""), ("atomic-events", "Atomic Events", "performance", "new"),
    ("hada-labo", "Hada Labo", "commerce", ""), ("melano-cc", "Melano CC", "commerce", ""),
    ("shiseido-professional", "Shiseido Professional", "commerce", ""),
    ("schwarzkopf-professional", "Schwarzkopf Professional", "commerce", ""), ("flexar", "Flexar", "performance", ""),
    ("mbold", "MBOLD", "social", ""), ("urban-company", "Urban Company", "social", ""), ("sunday", "Sunday", "social", ""),
]
AREA = 6400  # target visual area per logo in px^2, so wide and stacked logos look equally heavy
MAX_H = 60


def size(slug):
    w, h = Image.open(os.path.join(HERE, "logos", slug + ".png")).size
    dh = min(MAX_H, math.sqrt(AREA / (w / h)))
    return round(dh * w / h), round(dh)


def data(slug):
    return "data:image/png;base64," + base64.b64encode(open(os.path.join(HERE, "logos", slug + ".png"), "rb").read()).decode()


radios = "".join(f'<input class="mf-logos__radio" type="radio" name="mf-logos-filter" id="mf-logos-{k}" value="{k}"{" checked" if k == "all" else ""}>'
                 for k, _ in FILTERS)
pills = "".join(f'<label class="mf-logos__pill" for="mf-logos-{k}">{name}</label>' for k, name in FILTERS)
logos = "".join(
    f'<li class="mf-logos__l" data-g="{g}"{" data-new" if new else ""}>'
    f'<img src="{data(s)}" alt="{name}{" (new client)" if new else ""}" width="{size(s)[0]}" height="{size(s)[1]}" loading="lazy"></li>'
    for s, name, g, new in LOGOS)
# one dimming rule per service: when its pill is chosen, brands outside it fade to grey
dim = ",\n  ".join(f'#mf-logos-{k}:checked ~ .mf-logos__wall .mf-logos__l:not([data-g~="{k}"])' for k, _ in FILTERS if k != "all")
on = ",\n  ".join(f'#mf-logos-{k}:checked ~ .mf-logos__pills label[for="mf-logos-{k}"]' for k, _ in FILTERS)
focus = ",\n  ".join(f'#mf-logos-{k}:focus-visible ~ .mf-logos__pills label[for="mf-logos-{k}"]' for k, _ in FILTERS)

out = f"""<!-- MajorForm client logos with service filters. Paste this whole file into a Squarespace Code block with Display Source turned off.
     Choosing a pill keeps that service's brands bright and greys out the rest. No scripts, so the editor shows its real size.
     To add a logo or change groups: edit LOGOS in build.py and rebuild. -->
<div class="mf-logos" role="region" aria-label="Brands we've worked with">
  {radios}
  <div class="mf-logos__pills" role="group" aria-label="Highlight brands by service">{pills}</div>
  <ul class="mf-logos__wall">{logos}</ul>
</div>
<style>
  .mf-logos {{ --deep: #04202c; display: grid; justify-items: center; gap: clamp(22px, 3vw, 34px); padding-block: 8px; font-family: "Space Grotesk", system-ui, sans-serif; }}
  .mf-logos__radio {{ position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }}
  .mf-logos__pills {{ display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }}
  .mf-logos__pill {{ position: relative; overflow: hidden; isolation: isolate; cursor: pointer; padding: 8px 16px; border-radius: 999px; border: 1px solid rgba(255, 255, 255, .35);
    color: #ffffff; font-size: 14px; font-weight: 500; line-height: 1.2; transition: color .3s, border-color .3s; user-select: none; }}
  .mf-logos__pill::after {{ content: ""; position: absolute; inset: 0; z-index: -1; background: #ffefae; transform: translateY(102%); transition: transform .4s cubic-bezier(.2, .8, .2, 1); }}
  .mf-logos__pill:hover {{ border-color: #ffefae; }}
  {on} {{ color: var(--deep); border-color: #ffefae; }}
  {on.replace('"]', '"]::after')} {{ transform: none; }}
  {focus} {{ outline: 2px solid #ffffff; outline-offset: 3px; }}
  .mf-logos__wall {{ list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; justify-content: center; align-items: center;
    gap: clamp(18px, 2.4vw, 30px) clamp(28px, 3.6vw, 52px); max-width: 1240px; }}
  .mf-logos__l {{ position: relative; margin: 0; padding: 0; line-height: 0; transition: opacity .45s ease, filter .45s ease, transform .45s cubic-bezier(.2, .8, .2, 1); }}
  .mf-logos__l::before, .mf-logos__l::marker {{ content: none; }}
  .mf-logos__l img {{ display: block; width: auto; max-width: none; opacity: .92; }}
  /* "NEW" badge on recently added clients */
  .mf-logos__l[data-new]::after {{ content: "NEW"; position: absolute; top: -9px; right: -26px; padding: 3px 7px; border-radius: 999px;
    background: #ffefae; color: var(--deep); font: 700 9px/1 "Space Grotesk", system-ui, sans-serif; letter-spacing: .12em; box-shadow: 0 4px 12px -6px rgba(0, 0, 0, .6); }}
  {dim} {{ opacity: .2; filter: grayscale(1); transform: scale(.94); }}
  @media (prefers-reduced-motion: reduce) {{ .mf-logos__pill, .mf-logos__pill::after, .mf-logos__l {{ transition: none; }} }}
</style>
"""
open(os.path.join(HERE, "squarespace-snippet.html"), "w").write(out)
print("wrote squarespace-snippet.html", len(out), "bytes")
