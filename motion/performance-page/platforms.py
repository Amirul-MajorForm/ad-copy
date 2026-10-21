"""Platforms we manage: one script-free code block, grouped by channel type.

Platforms with their own page are listed in bold. Give one a URL and it becomes a link
with an arrow; until then it stays plain text, so the live page never has a broken link.
Each platform name is an H3, under the section's H2 text block in Squarespace.
"""
from html import escape

GROUPS = [
    ("Social", [
        ("Meta Ads", "Facebook &amp; Instagram", True, None),
        ("TikTok Ads", "In-feed, Spark Ads", True, None),
        ("LinkedIn Ads", "B2B and lead generation", False, None),
    ]),
    ("Search &amp; video", [
        ("Search Ads", "Google Search, Performance Max", True, None),
        ("App Install Ads", "Installs and in-app actions", True, None),
        ("YouTube Ads", "Video reach and action", False, None),
    ]),
    ("Commerce", [
        ("TikTok Shop Ads", "Shop Ads and LIVE selling", True, None),
        ("Amazon Ads", "Sponsored Products and Brands", True, None),
        ("Google Shopping", "Product listing ads", True, None),
    ]),
    ("Programmatic", [
        ("StackAdapt", "Programmatic display and native", False, None),
        ("Teads", "Premium video and display", False, None),
        ("Criteo", "Retargeting and retail media", False, None),
    ]),
]

HEADER = """<!-- MajorForm performance page: Platforms we manage.
     Paste into its own Squarespace Code block under your "Platforms we manage" text, with Display
     Source turned off. No scripts. Bold platforms become links once their page URL is added. -->"""

STYLE = """<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500&display=swap">
<style>
  .mf-plat { --ink: #233551; --text: #3d4350; --muted: #6b7180; --rule: rgba(35, 53, 81, .16); --tint: #f4f6f8;
    container-type: inline-size; font-family: "Space Grotesk", system-ui, sans-serif; color: var(--text); }
  .mf-plat * { box-sizing: border-box; }
  .mf-plat__grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 14px; }
  @container (min-width: 520px) { .mf-plat__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @container (min-width: 900px) { .mf-plat__grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
  .mf-plat__group { background: var(--tint); border-radius: 16px; padding: 20px 20px 22px; }
  .mf-plat__type { margin: 0 0 6px; font-size: 11px; font-weight: 500; letter-spacing: .16em; text-transform: uppercase; color: var(--muted); }
  .mf-plat ul { list-style: none; margin: 0; padding: 0; }
  .mf-plat li { margin: 0; padding: 0; }
  .mf-plat li::before, .mf-plat li::marker { content: none; }
  .mf-plat__item { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--rule); color: var(--ink); text-decoration: none; background: none; }
  .mf-plat__name { margin: 0; font-family: inherit; font-size: 18px; font-weight: 500; line-height: 1.15; letter-spacing: -.01em; color: inherit; text-transform: none; }
  .mf-plat__item.is-page .mf-plat__name { font-weight: 600; }
  .mf-plat__what { display: block; margin: 1px 0 0; font-size: 12.5px; line-height: 1.3; color: var(--muted); }
  .mf-plat__arrow { font-size: 16px; opacity: .45; transition: transform .3s, opacity .3s; }
  a.mf-plat__item:hover .mf-plat__arrow, a.mf-plat__item:focus-visible .mf-plat__arrow { opacity: 1; transform: translateX(4px); }
  a.mf-plat__item:hover .mf-plat__name, a.mf-plat__item:focus-visible .mf-plat__name { text-decoration: underline; text-underline-offset: 4px; text-decoration-thickness: 1px; }
  a.mf-plat__item:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; border-radius: 4px; }
  @media (prefers-reduced-motion: reduce) { .mf-plat__arrow { transition: none; } }
</style>"""


def item_html(name, what, page, url):
    inner = f'<div><h3 class="mf-plat__name">{name}</h3><span class="mf-plat__what">{what}</span></div>'
    cls = "mf-plat__item is-page" if page else "mf-plat__item"
    if page and url:
        return f'<li><a class="{cls}" href="{escape(url)}">{inner}<span class="mf-plat__arrow" aria-hidden="true">&rarr;</span></a></li>'
    return f'<li><div class="{cls}">{inner}</div></li>'


def block_html(urls=None):
    """urls maps a platform name to a URL; it overrides the URLs in GROUPS (used for the mockup)."""
    urls = urls or {}
    groups = []
    for label, items in GROUPS:
        lis = "\n      ".join(item_html(n, w, p, urls.get(n, u)) for n, w, p, u in items)
        groups.append(f'  <div class="mf-plat__group">\n    <p class="mf-plat__type">{label}</p>\n    <ul>\n      {lis}\n    </ul>\n  </div>')
    body = "\n".join(groups)
    return f'{HEADER}\n{STYLE}\n<div class="mf-plat" data-theme="light">\n<div class="mf-plat__grid">\n{body}\n</div>\n</div>\n'
