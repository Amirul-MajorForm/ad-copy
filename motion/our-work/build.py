"""Our Work page (majorform.co/our-work): case studies in layout A, Wada 271 "jewel tones".

Run: python3 build.py   -> writes, in this folder:
  01-hero.html ... 04-closing.html   one Squarespace Code block each, in page order (no scripts, so the editor shows true sizes)
  header.html                        paste once in the page's Page Header Code Injection: schema and the H2 size match
  page-settings.txt                  SEO title and description
  preview.html                       the whole page, for review only
Every card has the same structure, so "Read the case study" sits at the bottom of each card and lines up across a row.
Hovering a card pops out its callouts; on touch screens they show without hover.
"""
import base64, html, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "..", "platform-pages", "assets")
LOGOS = os.path.join(HERE, "..", "logo-marquee", "logos")
SITE = "https://www.majorform.co"
W = SITE + "/our-work/"
CONTACT = SITE + "/contact"
e = html.escape

# Wada 271: Cobalt Green, Pomegranate Purple, Green Blue, Deep Slate Green
MINT, POME, TEAL, DEEP = "#96d1aa", "#b71f57", "#099197", "#112f2c"
NAVY = "#233551"
ART = [MINT, POME, TEAL]                      # behind product shots, in turn
FG = {MINT: NAVY, POME: "#ffffff", TEAL: "#ffffff", DEEP: "#ffffff"}

SERVICES = [("perf", "Performance marketing"), ("comm", "Social commerce"), ("social", "Social media content")]

# s: service group (None = not set yet: shows under "All work" only). v/l: headline result (None = no confirmed number yet).
# art: ("img", file, fit) | ("logo", key) | ("type",). callouts: up to 3, (text, left %, top %).
CASES = [
    dict(b="OATSIDE", t="Scaling digital media across APAC with OATSIDE", tag="Meta · Shopee", s="perf", v="+30%", l="ROAS year on year",
         u=W + "oatside-digital-marketing-majorform-2026", art=("img", "oatside-barista-pack.webp", "float"),
         co=[("CPAS ads", 4, 10), ("Geo-targeting", 52, 46), ("Shopee audiences", 4, 78)], feat=True),
    dict(b="Blackmores", t="Driving ROI on TikTok Shop with Blackmores", tag="TikTok Shop", s="comm", v="+30%", l="ROI from TikTok GMV Max",
         u=W + "blackmores-tiktok-livestreaming-majorform-2026", art=("img", "blackmores-fish-oil.webp", "float"),
         co=[("GMV Max", 4, 12), ("ROI optimisation", 44, 50), ("Creative scaling", 4, 80)], feat=True),
    dict(b="Yoga Movement", t="Turning searches into class-pack sales for Yoga Movement", tag="Google Search", s="perf", v="+56%", l="purchase completions from Search",
         u=W + "yogamovement-digital-marketing-majorform-2026", art=("img", "yoga-movement-app.webp", "bottom"),
         co=[("Brand Search", 4, 12), ("Local Search", 56, 34), ("Google Search", 4, 58)], feat=True),
    dict(b="Flexar", t="Driving app installs for Flexar in Singapore", tag="Google · TikTok", s="perf", v="34K+", l="app installs in 4 months",
         u=W + "app-install-digital-marketing-singapore-2026", art=("img", "flexar-app.webp", "bottom"),
         co=[("Google App Campaigns", 4, 14), ("TikTok App Promotion", 34, 44), ("AppsFlyer", 4, 70)], feat=True),
    dict(b="The Generation Clean", t="Brand films for The Generation Clean", tag="Video content", s="social", v=None, l="Content case study",
         u=W + "the-generation-clean-attitude-social-media-video-majorform-2026", art=("img", "attitude-shampoo.webp", "float"),
         co=[("Brand films", 4, 14), ("Shorts", 64, 46), ("Singapore launch", 4, 78)]),
    dict(b="LizFlorals", t="Social media content for a wedding and event florist", tag="Social media content", s="social",
         u=W + "lizflorals-content-creation-case-study-majorform-2026", art=("type",), co=[]),
    dict(b="MBold", t="Social media content for a gym", tag="Social media content", s="social",
         u=W + "gym-content-marketing-mbold-singapore-2026", art=("logo", "mbold"), co=[]),
    dict(b="PawPal", t="A clearer social media identity for PawPal", tag="Social media content", s="social",
         u=W + "pawpal-social-media-pet-brand-singapore-2026", art=("type",), co=[]),
    dict(b="Sunday Bedding", t="Sunday Bedding", tag=None, s=None, u=W + "majorform-sunday-bedding", art=("logo", "sunday"), co=[]),
    dict(b="Grey & Sanders", t="Grey & Sanders", tag=None, s=None, u=W + "grey-and-sanders", art=("type",), co=[]),
    dict(b="TAG Espresso", t="TAG Espresso", tag=None, s=None, u=W + "tag-espresso-2025", art=("type",), co=[]),
    dict(b="Ripple+ Home", t="Ripple+ Home", tag=None, s=None, u=W + "rippleco-home-singapore-2025", art=("type",), co=[]),
    dict(b="Urban Company", t="Urban Company", tag=None, s=None, u=W + "urban-company", art=("logo", "urban-company"), co=[]),
    dict(b="SoundPeats", t="SoundPeats", tag=None, s=None, u=W + "soundpeats-singapore-2025", art=("type",), co=[]),
    dict(b="Katin Life", t="Katin Life", tag=None, s=None, u=W + "katin-life", art=("type",), co=[]),
]
PLATE = [("+56%", "Yoga Movement purchase completions from Search", MINT), ("34K+", "Flexar app installs in 4 months", DEEP),
         ("+30%", "Blackmores ROI on TikTok Shop", POME), ("+30%", "OATSIDE ROAS year on year", TEAL)]
CALLOUT_COLOURS = [(DEEP, "#ffffff"), ("#ffffff", NAVY), (POME, "#ffffff")]

_cache = {}
def data_uri(path):
    if path not in _cache:
        if path.startswith(ASSETS):  # product shots: card-sized copies keep each block light
            from io import BytesIO
            from PIL import Image
            im = Image.open(path); im.thumbnail((440, 440)); buf = BytesIO(); im.save(buf, "WEBP", quality=82)
            _cache[path] = "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()
        else:
            _cache[path] = "data:image/png;base64," + base64.b64encode(open(path, "rb").read()).decode()
    return _cache[path]

FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,500;9..40,600&family=Space+Grotesk:wght@400;500&display=swap">'
BASE = """
  .mfw { --ink: #233551; --text: #3d4350; --muted: #6b7180; --rule: rgba(35, 53, 81, .16); --deep: #112f2c; --mint: #96d1aa; --pome: #b71f57; --teal: #099197;
    container-type: inline-size; font-family: "Space Grotesk", system-ui, sans-serif; color: var(--text); font-size: 16px; line-height: 1.55; }
  .mfw * { box-sizing: border-box; }
  .mfw h1, .mfw h2, .mfw h3, .mfw p { margin: 0; }
  .mfw .mfw-h2 { color: var(--ink); font-family: var(--mf-h2-font, "DM Sans", "Helvetica Neue", Arial, sans-serif); font-weight: var(--mf-h2-weight, 600);
    font-size: var(--mf-h2, clamp(30px, 4cqi, 44px)); letter-spacing: var(--mf-h2-ls, -.03em); line-height: 1.05; text-transform: none; }
  .mfw .mfw-eyebrow { margin-bottom: 8px; font-size: 11px; font-weight: 500; letter-spacing: .16em; text-transform: uppercase; color: var(--muted); }
  .mfw .mfw-btn { display: inline-flex; align-items: center; gap: 10px; padding: 12px 20px; border-radius: 999px; background: var(--deep); color: #fff; font-size: 15px;
    font-weight: 500; text-decoration: none; border: 1px solid var(--deep); transition: background .3s, color .3s, border-color .3s; }
  .mfw .mfw-btn:hover, .mfw .mfw-btn:focus-visible { background: var(--mint); border-color: var(--mint); color: var(--deep); }
  .mfw a:focus-visible, .mfw label:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; }
"""
CARD_CSS = """
  /* one card: art panel (with hover callouts) above or beside the body; the link sits at the bottom of every body */
  .mfw .mfw-card { display: flex; flex-direction: column; height: 100%; border-radius: 18px; overflow: hidden; background: var(--deep); color: #f3f2f7; text-decoration: none;
    transition: transform .35s cubic-bezier(.2, .8, .2, 1), box-shadow .35s; }
  .mfw .mfw-card:hover, .mfw .mfw-card:focus-visible { transform: translateY(-4px); box-shadow: 0 18px 36px -16px rgba(17, 47, 44, .55); }
  .mfw .mfw-art { position: relative; background: var(--bg); display: grid; place-items: center; aspect-ratio: 4 / 3; padding: 18px; flex: none; }
  .mfw .mfw-art { overflow: hidden; }
  .mfw .mfw-art > img { position: absolute; inset: 0; margin: auto; display: block; max-width: 70%; max-height: 84%; width: auto; height: auto; object-fit: contain;
    transition: transform .5s cubic-bezier(.2, .8, .2, 1); }
  .mfw .mfw-card:hover .mfw-art > img { transform: scale(1.05); }
  .mfw .mfw-art--bottom > img { inset: auto 0 0; margin: 0 auto; max-width: 80%; max-height: 92%; transform-origin: bottom center; }
  .mfw .mfw-art--logo > img { max-width: 52%; max-height: 40%; filter: var(--lf); opacity: .85; }
  .mfw .mfw-art--type span { font: 600 clamp(22px, 3cqi, 30px)/1.05 "DM Sans", sans-serif; letter-spacing: -.03em; color: var(--tc); text-align: center; text-wrap: balance; }
  /* callouts: hidden until the card is hovered or focused, then they pop out one after another */
  .mfw .mfw-co { position: absolute; z-index: 2; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; line-height: 1; font-size: 12px; font-weight: 500;
    padding: 7px 11px; border-radius: 999px; background: var(--cb); color: var(--cf); box-shadow: 0 8px 20px -10px rgba(4, 32, 44, .55);
    opacity: 0; transform: translateY(6px) scale(.85); transition: opacity .25s, transform .35s cubic-bezier(.2, .9, .3, 1.3); pointer-events: none; }
  .mfw .mfw-co::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; opacity: .7; }
  .mfw .mfw-card:hover .mfw-co, .mfw .mfw-card:focus-visible .mfw-co { opacity: 1; transform: none; }
  .mfw .mfw-card:hover .mfw-co:nth-of-type(2), .mfw .mfw-card:focus-visible .mfw-co:nth-of-type(2) { transition-delay: .08s; }
  .mfw .mfw-card:hover .mfw-co:nth-of-type(3), .mfw .mfw-card:focus-visible .mfw-co:nth-of-type(3) { transition-delay: .16s; }
  @media (hover: none) { .mfw .mfw-co { opacity: 1; transform: none; font-size: 11px; padding: 6px 9px; } }
  .mfw .mfw-body { flex: 1; display: flex; flex-direction: column; gap: 6px; padding: 18px 20px 20px; }
  .mfw .mfw-tag { font-size: 11px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; color: var(--mint); }
  .mfw .mfw-res { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 10px; }
  .mfw .mfw-res b { font: 600 34px/1 "DM Sans", sans-serif; letter-spacing: -.045em; color: #fff; }
  .mfw .mfw-res span { font-size: 14px; color: rgba(243, 242, 247, .78); }
  .mfw .mfw-card h3 { color: #fff; font-family: inherit; font-size: 18px; font-weight: 500; line-height: 1.3; letter-spacing: -.01em; text-transform: none; }
  .mfw .mfw-go { margin-top: auto; padding-top: 10px; align-self: flex-start; font-size: 14px; font-weight: 500; }
  .mfw .mfw-go span { border-bottom: 1px solid rgba(255, 255, 255, .4); }
  .mfw .mfw-go i { font-style: normal; display: inline-block; transition: transform .25s; }
  .mfw .mfw-card:hover .mfw-go i { transform: translateX(4px); }
  @media (prefers-reduced-motion: reduce) { .mfw .mfw-card, .mfw .mfw-art > img, .mfw .mfw-co, .mfw .mfw-go i { transition: none; } .mfw .mfw-card:hover { transform: none; } }
"""

def art(c, n):
    bg = ART[n % 3]; fg = FG[bg]
    style = f'--bg:{bg};--tc:{fg};--lf:{"brightness(0) invert(1)" if fg == "#ffffff" else "brightness(0)"}'
    kind = c["art"][0]
    if kind == "img":
        inner, cls = f'<img src="{data_uri(os.path.join(ASSETS, c["art"][1]))}" alt="{e(c["b"])}">', " mfw-art--bottom" if c["art"][2] == "bottom" else ""
    elif kind == "logo":
        inner, cls = f'<img src="{data_uri(os.path.join(LOGOS, c["art"][1] + ".png"))}" alt="{e(c["b"])}">', " mfw-art--logo"
    else:
        inner, cls = f'<span aria-hidden="true">{e(c["b"])}</span>', " mfw-art--type"
    cos = "".join(f'<span class="mfw-co" aria-hidden="true" style="left:{x}%;top:{y}%;--cb:{CALLOUT_COLOURS[i][0]};--cf:{CALLOUT_COLOURS[i][1]}">{e(t)}</span>'
                  for i, (t, x, y) in enumerate(c["co"]))
    return f'<div class="mfw-art{cls}" style="{style}">{inner}{cos}</div>'

def card(c, n, cls=""):
    tag = f'{e(c["b"])} · {e(c["tag"])}' if c.get("tag") else e(c["b"])
    res = (f'<p class="mfw-res"><b>{e(c["v"])}</b><span>{e(c["l"])}</span></p>' if c.get("v") else "")
    return (f'<a class="mfw-card{cls}" href="{e(c["u"])}">{art(c, n)}<div class="mfw-body"><span class="mfw-tag">{tag}</span>{res}'
            f'<h3>{e(c["t"])}</h3><span class="mfw-go"><span>Read the case study</span> <i aria-hidden="true">&rarr;</i></span></div></a>')

def block(name, css, inner, note):
    return (f"<!-- MajorForm Our Work page: {note}\n     Paste into its own Squarespace Code block, with Display Source turned off. No scripts. -->\n"
            f"{FONTS}\n<style>{BASE}{css}</style>\n<div class=\"mfw mfw--{name}\">{inner}</div>\n")

HERO_CSS = """
  .mfw--hero { display: grid; gap: 28px; }
  @container (min-width: 860px) { .mfw--hero { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: center; gap: 48px; } }
  .mfw--hero .mfw-crumbs { display: flex; gap: 6px; font-size: 13px; color: var(--muted); }
  .mfw--hero .mfw-crumbs a { color: var(--ink); text-decoration: none; border-bottom: 1px solid var(--rule); }
  .mfw--hero h1 { margin: 14px 0 16px; color: var(--ink); font-family: "DM Sans", "Helvetica Neue", Arial, sans-serif; font-weight: 600;
    font-size: clamp(38px, 6cqi, 64px); line-height: .95; letter-spacing: -.045em; text-transform: none; text-wrap: balance; }
  .mfw--hero .mfw-lede { margin-bottom: 24px; font-size: 18px; line-height: 1.5; max-width: 44ch; }
  .mfw--hero .mfw-plate { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .mfw--hero .mfw-tile { border-radius: 6px; padding: 18px; min-height: 140px; display: grid; align-content: end; gap: 4px; background: var(--bg); color: var(--fg);
    transition: transform .35s cubic-bezier(.2, .8, .2, 1); }
  .mfw--hero .mfw-tile:hover { transform: translateY(-3px); }
  .mfw--hero .mfw-tile b { font: 600 clamp(34px, 4.6cqi, 54px)/.95 "DM Sans", sans-serif; letter-spacing: -.045em; }
  .mfw--hero .mfw-tile span { font-size: 13px; font-weight: 500; line-height: 1.3; }
"""
FEAT_CSS = CARD_CSS + """
  .mfw.mfw--featured .mfw-top { margin-bottom: 20px; }
  .mfw.mfw--featured .mfw-grid { display: grid; gap: 12px; grid-template-columns: minmax(0, 1fr); }
  @container (min-width: 700px) { .mfw.mfw--featured .mfw-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  /* (both card blocks carry the same base styles, so these overrides use a stronger selector) */
  /* featured cards: image beside the story on wide screens, a little larger than the grid cards below */
  @container (min-width: 1000px) {
    .mfw.mfw--featured .mfw-card { flex-direction: row; }
    .mfw.mfw--featured .mfw-art { width: 42%; aspect-ratio: auto; min-height: 210px; }
    .mfw.mfw--featured .mfw-body { padding: 20px 22px; }
  }
  .mfw.mfw--featured .mfw-res b { font-size: clamp(36px, 3.6cqi, 46px); }
"""
ALL_CSS = CARD_CSS + """
  .mfw--all .mfw-top { margin-bottom: 18px; }
  .mfw--all .mfw-filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; border: 0; padding: 0; }
  .mfw--all .mfw-filters input { position: absolute; opacity: 0; pointer-events: none; }
  .mfw--all .mfw-filters label { cursor: pointer; border: 1px solid var(--rule); border-radius: 999px; padding: 8px 16px; font-size: 14px; font-weight: 500; color: var(--ink);
    transition: background .25s, color .25s, border-color .25s; }
  .mfw--all .mfw-filters label:hover { border-color: var(--ink); }
  .mfw--all .mfw-filters input:checked + label { background: var(--deep); border-color: var(--deep); color: #fff; }
  .mfw--all .mfw-filters input:focus-visible + label { outline: 2px solid var(--ink); outline-offset: 2px; }
  .mfw--all .mfw-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr)); }
  .mfw--all:has(#mfw-f-perf:checked) .mfw-cell:not(.s-perf), .mfw--all:has(#mfw-f-comm:checked) .mfw-cell:not(.s-comm),
  .mfw--all:has(#mfw-f-social:checked) .mfw-cell:not(.s-social) { display: none; }
"""
CLOSE_CSS = """
  .mfw--closing { display: grid; justify-items: center; gap: 14px; text-align: center; padding: 8px 0; color: rgba(255, 255, 255, .78); }
  .mfw--closing .mfw-h2 { color: #fff; }
  .mfw--closing .mfw-h2 em { font-style: normal; color: var(--mint); }
  .mfw--closing .mfw-btn { background: var(--mint); border-color: var(--mint); color: var(--deep); }
  .mfw--closing .mfw-btn:hover, .mfw--closing .mfw-btn:focus-visible { background: #fff; border-color: #fff; }
  .mfw--closing .mfw-pills { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 18px; padding-top: 22px; border-top: 1px solid rgba(255, 255, 255, .14); max-width: 760px; }
  .mfw--closing .mfw-pills p { width: 100%; font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: rgba(255, 255, 255, .55); }
  .mfw--closing .mfw-pills a { position: relative; overflow: hidden; isolation: isolate; border: 1px solid rgba(255, 255, 255, .3); border-radius: 999px; padding: 8px 14px;
    color: #fff; text-decoration: none; font-size: 14px; transition: color .3s, border-color .3s; }
  .mfw--closing .mfw-pills a::after { content: ""; position: absolute; inset: 0; z-index: -1; background: var(--c); transform: translateY(102%); transition: transform .35s cubic-bezier(.2, .8, .2, 1); }
  .mfw--closing .mfw-pills a:hover { color: var(--deep); border-color: var(--c); }
  .mfw--closing .mfw-pills a:hover::after { transform: none; }
"""
RELATED = [("Performance marketing", SITE + "/performance-marketing-majorform-singapore"), ("Meta Ads", SITE + "/meta-ads-agency-singapore"),
           ("TikTok Ads", SITE + "/tiktok-ads-agency-singapore"), ("Search Ads", SITE + "/google-search-ads-agency-singapore"),
           ("Social media content", SITE + "/social-media-management-singapore-2026")]

def build():
    feats = [c for c in CASES if c.get("feat")]
    rest = [c for c in CASES if not c.get("feat")]
    hero = (f'<div><nav class="mfw-crumbs" aria-label="Breadcrumb"><a href="{SITE}/">Home</a><span aria-hidden="true">/</span><span>Our work</span></nav>'
            '<h1>Case Studies: Real Brands, Real Growth</h1>'
            '<p class="mfw-lede">How MajorForm helps brands in Singapore and across Asia grow, with the numbers behind each campaign: paid media, social commerce and content.</p>'
            f'<a class="mfw-btn" href="{CONTACT}">Talk to our strategists <span aria-hidden="true">&rarr;</span></a></div>'
            '<div class="mfw-plate">' + "".join(f'<div class="mfw-tile" style="--bg:{bg};--fg:{FG[bg]}"><b>{e(v)}</b><span>{e(l)}</span></div>' for v, l, bg in PLATE) + "</div>")
    featured = ('<div class="mfw-top"><p class="mfw-eyebrow">Featured</p><h2 class="mfw-h2">Our biggest wins</h2></div><div class="mfw-grid">'
                + "".join(card(c, i) for i, c in enumerate(feats)) + "</div>")
    filters = ('<input type="radio" name="mfw-f" id="mfw-f-all" checked><label for="mfw-f-all">All work</label>'
               + "".join(f'<input type="radio" name="mfw-f" id="mfw-f-{k}"><label for="mfw-f-{k}">{n}</label>' for k, n in SERVICES))
    # the grid lists the rest first, then the featured four again so each service filter shows its full set; under "All work" the repeats stay hidden
    cells = "".join(f'<div class="mfw-cell s-{c["s"]}">{card(c, i + 1)}</div>' for i, c in enumerate(rest))
    cells += "".join(f'<div class="mfw-cell mfw-dup s-{c["s"]}">{card(c, i)}</div>' for i, c in enumerate(feats))
    allw = ('<div class="mfw-top"><p class="mfw-eyebrow">All case studies</p><h2 class="mfw-h2">Browse by service</h2></div>'
            f'<div class="mfw-filters" role="group" aria-label="Filter case studies by service">{filters}</div><div class="mfw-grid">{cells}</div>')
    pills = "".join(f'<a href="{u}" style="--c:{[MINT, TEAL][i % 2]}">{e(n)}</a>' for i, (n, u) in enumerate(RELATED))
    closing = ('<h2 class="mfw-h2">Want results like <em>these?</em></h2><p>Tell us your goal and we\'ll show you how we\'d plan it.</p>'
               f'<a class="mfw-btn" href="{CONTACT}">Talk to our strategists <span aria-hidden="true">&rarr;</span></a>'
               f'<div class="mfw-pills"><p>Explore our services</p>{pills}</div>')
    blocks = {
        "hero": block("hero", HERO_CSS, hero, "hero with H1 and headline results."),
        "featured": block("featured", FEAT_CSS, featured, "four featured case studies; hover a card for its callouts."),
        "all": block("all", ALL_CSS + "\n  .mfw--all:has(#mfw-f-all:checked) .mfw-dup { display: none; }\n", allw, "every case study, with service filters."),
        "closing": block("closing", CLOSE_CSS, closing, "closing call to action. Set this section's background to #2a2829."),
    }
    for i, (k, h) in enumerate(blocks.items()):
        open(os.path.join(HERE, f"{i + 1:02d}-{k}.html"), "w").write(h)
    items = [{"@type": "ListItem", "position": i + 1, "url": c["u"], "name": c["t"]} for i, c in enumerate(feats + rest)]
    schema = [
        {"@context": "https://schema.org", "@type": "CollectionPage", "@id": W.rstrip("/") + "#page", "url": W.rstrip("/"),
         "name": "Case Studies: Real Brands, Real Growth",
         "description": "MajorForm case studies with the results behind each campaign: performance marketing, social commerce and social media content for brands in Singapore and Asia.",
         "isPartOf": {"@id": SITE + "/#website"}, "about": {"@id": SITE + "/#organization"},
         "mainEntity": {"@type": "ItemList", "numberOfItems": len(items), "itemListElement": items}},
        {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Our work", "item": W.rstrip("/")}]},
    ]
    probe = open(os.path.join(HERE, "..", "case-cards", "homepage-header.html")).read().split("-->", 1)[1].strip()
    open(os.path.join(HERE, "header.html"), "w").write(
        "<!-- MajorForm Our Work page header. Paste into Page Settings > Advanced > Page Header Code Injection on /our-work.\n"
        "     Replaces the page's old WebPage schema with a CollectionPage that lists every case study, and matches the block headings to your H2 size. -->\n"
        '<script type="application/ld+json">\n' + json.dumps(schema, indent=2, ensure_ascii=False) + "\n</script>\n" + probe + "\n")
    open(os.path.join(HERE, "page-settings.txt"), "w").write(
        "URL slug:        /our-work (unchanged)\n"
        "SEO title:       MajorForm Case Studies | Results in Singapore & Asia\n"
        "SEO description: See the results behind MajorForm's campaigns: performance marketing, social commerce and content for brands like OATSIDE, Blackmores and Yoga Movement.\n")
    bands = {"closing": "#2a2829"}
    page = "".join((f"<section class='band' style='background:{bands[k]}'>{h}</section>" if k in bands else f"<div>{h}</div>") for k, h in blocks.items())
    open(os.path.join(HERE, "preview.html"), "w").write(
        "<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><title>Our Work preview</title>"
        "<body style='margin:0;background:#fff;overflow-x:hidden'><main style='max-width:1180px;margin:0 auto;padding:40px clamp(16px,4vw,40px) 0;display:grid;gap:72px'>"
        + page + "</main><style>.band{margin-inline:calc(50% - 50vw);padding:72px calc(50vw - 50%)}</style>")
    print("blocks:", list(blocks), "| sizes KB:", [len(h) // 1024 for h in blocks.values()])
    print("Not yet in a service filter (shown under All work only):", ", ".join(c["b"] for c in CASES if not c["s"]))

if __name__ == "__main__":
    build()
