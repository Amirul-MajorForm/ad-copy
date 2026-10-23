"""Build platform pages from their content sheets.

Run: python3 build.py [sheet ...]   (default: every sheet listed in SHEETS)
For each sheet, writes <key>/:
  01-hero.html ... 10-related.html   one Squarespace Code block each, in page order (empty slots are skipped)
  schema.html                        paste once: Page Settings > Advanced > Page Header Code Injection
  page-settings.txt                  URL slug, SEO title and description for Squarespace's page settings
  preview.html                       the whole page with placeholders shown in orange, for review only
Then prints what is still missing, facts to confirm, and any stray "[" placeholder text in the live blocks.
"""
import importlib
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import template  # noqa: E402

SHEETS = ["meta"]


def band(d, n, h):
    """Preview only: stand in for a Squarespace section, with a .section-background for the hero animation."""
    if n not in d.get("dark", {}):
        return f"<div>{h}</div>"
    return (f"<section class='band' style='background:{d['dark'][n]}'><div class='section-background'></div>"
            f"<div class='content'>{h}</div></section>")


def build(key):
    d = importlib.import_module(key).PAGE
    out = os.path.join(HERE, key)
    os.makedirs(out, exist_ok=True)
    for f in os.listdir(out):
        if re.match(r"\d\d-.*\.html$", f):
            os.remove(os.path.join(out, f))
    blocks, missing = template.render(d)
    for i, (name, html) in enumerate(blocks.items()):  # numbered by position on the page
        open(os.path.join(out, f"{i + 1:02d}-{name}.html"), "w").write(html)
    open(os.path.join(out, "schema.html"), "w").write(template.schema(d))
    open(os.path.join(out, "page-settings.txt"), "w").write(
        f"URL slug:        /{d['slug']}\nSEO title:       {d['title']}\nSEO description: {d['description']}\n"
        f"Navigation title: {d['name']}\n")
    pblocks, _ = template.render(d, preview=True)
    open(os.path.join(out, "preview.html"), "w").write(
        f"<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><title>{d['name']} preview</title>"
        "<body style='margin:0;background:#fff'><main style='max-width:1180px;margin:0 auto;padding:24px clamp(16px,4vw,40px) 64px;display:grid;gap:72px'>"
        + "".join(band(d, n, h) for n, h in pblocks.items()) + "</main>"
        "<style>body{overflow-x:hidden}.band{position:relative;margin-inline:calc(50% - 50vw);padding:72px calc(50vw - 50%)}"
        ".section-background{position:absolute;inset:0}.band>.content{position:relative}main>:first-child.band{margin-top:-24px;padding-block:96px 88px}</style>"
        + template.viz.MOTION_JS + (template.hero_engine() if d.get("hero_motion") else ""))

    print(f"{d['name']}: {len(blocks)} blocks, schema, page settings")
    visible = {n: re.sub(r"<(style|script)[^>]*>.*?</\1>|<!--.*?-->", "", h, flags=re.S) for n, h in blocks.items()}
    stray = [(n, m) for n, h in visible.items() for m in re.findall(r">[^<]*\[[^<\]]*\][^<]*<", h)]
    for label, items in (("Missing (left off the live page)", missing), ("Confirm before launch", d.get("confirm", [])),
                         ("Stray placeholder text in live blocks", [f"{n}: {m.strip('<>')}" for n, m in stray])):
        if items:
            print(f"  {label}:")
            for i in items:
                print(f"    - {i}")
    if len(d["title"]) > 60 or len(d["description"]) > 160:
        print(f"  Check lengths: title {len(d['title'])} (aim <= 60), description {len(d['description'])} (aim <= 160)")


for key in sys.argv[1:] or SHEETS:
    build(key)
