"""Build squarespace-snippet.html for the homepage solutions section.

Run: python3 build.py   (inlines ../pillar-dots/pillar-dots.js into template.html)
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
script = open(os.path.join(HERE, "..", "pillar-dots", "pillar-dots.js")).read().strip()
out = open(os.path.join(HERE, "template.html")).read().replace("/*PILLAR_DOTS*/", script)
open(os.path.join(HERE, "squarespace-snippet.html"), "w").write(out)
print("wrote squarespace-snippet.html", len(out), "bytes")
