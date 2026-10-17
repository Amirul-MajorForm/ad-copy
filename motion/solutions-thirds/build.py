"""Build the Squarespace snippets for the homepage solutions cards.

Run: python3 build.py
  squarespace-snippet.html  all three cards in one code block
  card-social.html, card-performance.html, card-commerce.html
                            one card per code block, each filling its own block
"""
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
script = open(os.path.join(HERE, "..", "pillar-dots", "pillar-dots.js")).read().strip()
template = open(os.path.join(HERE, "template.html")).read().replace("/*PILLAR_DOTS*/", script)

open(os.path.join(HERE, "squarespace-snippet.html"), "w").write(template)
print("wrote squarespace-snippet.html", len(template), "bytes")

articles = re.findall(r"    <article class=\"mf-sol__col\".*?</article>\n", template, flags=re.S)
names = ["social", "performance", "commerce"]
labels = ["Social media content", "Performance marketing", "Social commerce"]
assert len(articles) == 3
start = template.index("  <div class=\"mf-sol__cols\">\n") + len("  <div class=\"mf-sol__cols\">\n")
end = template.index("  </div>\n</div>\n<style>")
for name, label, article in zip(names, labels, articles):
    out = template[:start] + article + template[end:]
    out = out.replace('<div class="mf-sol">', '<div class="mf-sol mf-sol--single">', 1)
    out = re.sub(r"<!--.*?-->", f"""<!-- MajorForm solutions card: {label}.
     Paste into its own Squarespace Code block, with Display Source turned off.
     The card fills the code block, so size the block to the card you want
     (for thirds, place three card blocks side by side, each a third wide). -->""", out, count=1, flags=re.S)
    path = os.path.join(HERE, f"card-{name}.html")
    open(path, "w").write(out)
    print(f"wrote card-{name}.html", len(out), "bytes")
