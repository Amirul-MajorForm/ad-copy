"""Build the performance page Squarespace pieces.

Run: python3 build.py
  injection.html        paste once: Page Settings > Advanced > Page Header Code Injection
  hero-block.html       code block in the hero (animation marker)
  results-block.html    code block: results strip (content and styling)
  facts-block.html      code block: About facts (content and styling)
  goal-brand.html, goal-performance.html, goal-commerce.html
                        one code block per goal card
  platforms-block.html  code block: platforms we manage, grouped by channel type

The code blocks contain no scripts, so Squarespace's editor shows them at their real height.
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))


def read(*parts):
    return open(os.path.join(HERE, *parts)).read().strip()


out = read("injection-template.html")
out = out.replace("/*PILLAR_DOTS*/", read("..", "pillar-dots", "pillar-dots.js"))
out = out.replace("/*MATCH_H2*/", read("match-h2.js"))
out = out.replace("/*RESULTS*/", read("results.js"))
out = out.replace("/*FACTS*/", read("facts.js"))
out = out.replace("/*GOALS*/", read("equalize-goals.js"))
open(os.path.join(HERE, "injection.html"), "w").write(out + "\n")
print("wrote injection.html", len(out), "bytes")
import sys
sys.path.insert(0, HERE)
import goals  # noqa: E402
import platforms  # noqa: E402
open(os.path.join(HERE, "platforms-block.html"), "w").write(platforms.block_html())
for card in goals.CARDS:
    open(os.path.join(HERE, f"goal-{card['key']}.html"), "w").write(goals.card_html(card))
for name in ("hero-block.html", "results-block.html", "facts-block.html", "goal-brand.html", "goal-performance.html", "goal-commerce.html", "platforms-block.html"):
    print(name, len(read(name)), "bytes, scripts:", read(name).count("<script"))
