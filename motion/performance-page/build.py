"""Build the performance page Squarespace snippets.

Run: python3 build.py
  eyebrow-snippet.html  hero part 1: the eyebrow line
  hero-snippet.html     hero part 2: dot animation + buttons (inlines ../pillar-dots/pillar-dots.js)
  results-snippet.html  recent results strip
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
script = open(os.path.join(HERE, "..", "pillar-dots", "pillar-dots.js")).read().strip()

hero = open(os.path.join(HERE, "hero-template.html")).read().replace("/*PILLAR_DOTS*/", script)
open(os.path.join(HERE, "hero-snippet.html"), "w").write(hero)
print("wrote hero-snippet.html", len(hero), "bytes")

eyebrow = open(os.path.join(HERE, "eyebrow-template.html")).read()
open(os.path.join(HERE, "eyebrow-snippet.html"), "w").write(eyebrow)
print("wrote eyebrow-snippet.html", len(eyebrow), "bytes")

results = open(os.path.join(HERE, "results-template.html")).read()
open(os.path.join(HERE, "results-snippet.html"), "w").write(results)
print("wrote results-snippet.html", len(results), "bytes")
