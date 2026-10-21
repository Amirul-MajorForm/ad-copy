"""Platforms we manage: one script-free code block, grouped by channel type.

Platforms with their own page get a circled arrow and, on hover, the same colour fill as the
results cards (one colour per group). Their links start as href="#", which does nothing when
clicked; replace each "#" with the page URL as the pages go live, here or in the pasted code.
Each platform name is an H3, under the section's H2 text block in Squarespace.
"""
from html import escape

GROUPS = [
    ("Social", "#ffefae", [
        ("Meta Ads", "Facebook &amp; Instagram", True, None),
        ("TikTok Ads", "In-feed, Spark Ads", True, None),
        ("LinkedIn Ads", "B2B and lead generation", False, None),
    ]),
    ("Search &amp; video", "#96d1aa", [
        ("Search Ads", "Google Search, Performance Max", True, None),
        ("App Install Ads", "Installs and in-app actions", True, None),
        ("YouTube Ads", "Video reach and action", False, None),
    ]),
    ("Commerce", "#2fc2b6", [
        ("TikTok Shop Ads", "Shop Ads and LIVE selling", True, None),
        ("Amazon Ads", "Sponsored Products and Brands", True, None),
        ("Google Shopping", "Product listing ads", True, None),
    ]),
    ("Programmatic", "#96d1aa", [
        ("StackAdapt", "Programmatic display and native", False, None),
        ("Teads", "Premium video and display", False, None),
        ("Criteo", "Retargeting and retail media", False, None),
    ]),
]

HEADER = """<!-- MajorForm performance page: Platforms we manage.
     Paste into its own Squarespace Code block under your "Platforms we manage" text, with Display
     Source turned off. No scripts.
     To link a platform page: replace href="#" on that platform's line with the page URL. -->"""

STYLE = """<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500&display=swap">
<style>
  .mf-plat { --ink: #233551; --deep: #04202c; --text: #3d4350; --muted: #6b7180; --rule: rgba(35, 53, 81, .16); --tint: #f4f6f8;
    container-type: inline-size; font-family: "Space Grotesk", system-ui, sans-serif; color: var(--text); }
  .mf-plat * { box-sizing: border-box; }
  .mf-plat__grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 14px; }
  @container (min-width: 520px) { .mf-plat__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @container (min-width: 900px) { .mf-plat__grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
  .mf-plat__group { background: var(--tint); border-radius: 16px; padding: 20px 14px 14px; }
  .mf-plat__type { margin: 0 6px 6px; font-size: 11px; font-weight: 500; letter-spacing: .16em; text-transform: uppercase; color: var(--muted); }
  .mf-plat ul { list-style: none; margin: 0; padding: 0; }
  .mf-plat li { margin: 0; padding: 0; position: relative; }
  .mf-plat li::before, .mf-plat li::marker { content: none; }
  .mf-plat li + li::after { content: ""; position: absolute; top: 0; left: 6px; right: 6px; border-top: 1px solid var(--rule); }
  .mf-plat__item { position: relative; isolation: isolate; overflow: hidden; display: flex; justify-content: space-between; align-items: center; gap: 10px;
    padding: 10px 6px; border-radius: 10px; color: var(--ink); text-decoration: none; background: none; transition: padding .35s cubic-bezier(.2, .8, .2, 1); }
  .mf-plat__name { margin: 0; font-family: inherit; font-size: 18px; font-weight: 500; line-height: 1.15; letter-spacing: -.01em; color: inherit; text-transform: none; }
  a.mf-plat__item .mf-plat__name { font-weight: 600; }
  .mf-plat__what { display: block; margin: 1px 0 0; font-size: 12.5px; line-height: 1.3; color: var(--muted); transition: color .3s; }
  .mf-plat__go { flex: none; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; border: 1px solid rgba(35, 53, 81, .35);
    color: var(--ink); font-size: 14px; line-height: 1; transition: background .3s, border-color .3s, color .3s, transform .35s cubic-bezier(.2, .8, .2, 1); }
  /* Colour fill slides up from the bottom, as on the results cards */
  a.mf-plat__item::before { content: ""; position: absolute; inset: 0; z-index: -1; background: var(--mf-hover); transform: translateY(101%); transition: transform .45s cubic-bezier(.2, .8, .2, 1); }
  .mf-plat li:hover > a.mf-plat__item, .mf-plat a.mf-plat__item:focus-visible { padding-left: 12px; padding-right: 10px; }
  .mf-plat li:hover > a.mf-plat__item::before, .mf-plat a.mf-plat__item:focus-visible::before { transform: translateY(0); }
  .mf-plat li:hover > a .mf-plat__what, .mf-plat a.mf-plat__item:focus-visible .mf-plat__what { color: rgba(4, 32, 44, .75); }
  .mf-plat li:hover > a .mf-plat__go, .mf-plat a.mf-plat__item:focus-visible .mf-plat__go { background: var(--deep); border-color: var(--deep); color: #fff; transform: rotate(-45deg); }
  .mf-plat li:hover::after, .mf-plat li:hover + li::after { opacity: 0; }
  .mf-plat a.mf-plat__item:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
  /* Until a page URL replaces "#", the row still shows its hover but clicking does nothing */
  .mf-plat a.mf-plat__item[href="#"] { pointer-events: none; }
  @media (prefers-reduced-motion: reduce) { .mf-plat__item, a.mf-plat__item::before, .mf-plat__go, .mf-plat__what { transition: none; } }
</style>"""


def item_html(name, what, page, url):
    inner = f'<div><h3 class="mf-plat__name">{name}</h3><span class="mf-plat__what">{what}</span></div>'
    if page:
        return (f'<li><a class="mf-plat__item" href="{escape(url or "#")}">{inner}'
                f'<span class="mf-plat__go" aria-hidden="true">&rarr;</span></a></li>')
    return f'<li><div class="mf-plat__item">{inner}</div></li>'


def block_html(urls=None):
    """urls maps a platform name to a URL; it overrides the URLs in GROUPS."""
    urls = urls or {}
    groups = []
    for label, colour, items in GROUPS:
        lis = "\n      ".join(item_html(n, w, p, urls.get(n, u)) for n, w, p, u in items)
        groups.append(f'  <div class="mf-plat__group" style="--mf-hover:{colour}">\n    <p class="mf-plat__type">{label}</p>\n    <ul>\n      {lis}\n    </ul>\n  </div>')
    body = "\n".join(groups)
    return f'{HEADER}\n{STYLE}\n<div class="mf-plat" data-theme="light">\n<div class="mf-plat__grid">\n{body}\n</div>\n</div>\n'
