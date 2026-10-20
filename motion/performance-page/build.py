"""Build the performance page Squarespace snippets.

Run: python3 build.py
  hero-snippet.html     dot animation only (inlines ../pillar-dots/pillar-dots.js)
  results-snippet.html  recent results strip
  facts-snippet.html    About facts with looping dot animations
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
script = open(os.path.join(HERE, "..", "pillar-dots", "pillar-dots.js")).read().strip()

hero = open(os.path.join(HERE, "hero-template.html")).read().replace("/*PILLAR_DOTS*/", script)
open(os.path.join(HERE, "hero-snippet.html"), "w").write(hero)
print("wrote hero-snippet.html", len(hero), "bytes")

facts = open(os.path.join(HERE, "facts-template.html")).read()
open(os.path.join(HERE, "facts-snippet.html"), "w").write(facts)
print("wrote facts-snippet.html", len(facts), "bytes")

results = open(os.path.join(HERE, "results-template.html")).read()
open(os.path.join(HERE, "results-snippet.html"), "w").write(results)
print("wrote results-snippet.html", len(results), "bytes")
