"""Build one paste-ready Squarespace code block per service page from pillar-dots.js.

Run: python3 build.py   (writes performance-snippet.html, social-snippet.html, commerce-snippet.html)
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT = open(os.path.join(HERE, "pillar-dots.js")).read().strip()

PAGES = [
    ("performance", "Performance marketing", "antwerp", "Wada 281, Antwerp"),
    ("social", "Social media content", "grenadine-olive", "Wada 201, Grenadine & Olive"),
    ("commerce", "Social commerce", "pomegranate", "Wada 271, Pomegranate"),
]

for pillar, page, palette, palette_name in PAGES:
    out = f"""<!-- MajorForm pillar dots: {page} hero ({palette_name}).
     Paste this whole file into a Squarespace Code block inside the page's hero section,
     with Display Source turned off. It fills the section behind your headline.
     Keep the headline left-aligned; the motion plays on the right. -->
<div data-pillar-dots data-pillar="{pillar}" data-palette="{palette}" data-fill="section"></div>
<script>
{SCRIPT}
</script>
"""
    path = os.path.join(HERE, f"{pillar}-snippet.html")
    open(path, "w").write(out)
    print(f"wrote {pillar}-snippet.html ({len(out)} bytes)")
