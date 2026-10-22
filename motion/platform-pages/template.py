"""Platform page template: renders one platform sheet (e.g. meta.py) into Squarespace code blocks.

Ten slots, each its own script-free code block with its own styles, so the editor shows true heights:
  1 hero, 2 shift, 3 problems, 4 work, 5 types, 6 results, 7 process, 8 fit, 9 faq, 10 related
plus schema.html for the page header (Service, BreadcrumbList, FAQPage, built from the same text).

Any value left as None in a sheet is not published: the item is dropped from the live block and listed
by build.py as missing. preview=True shows those gaps as orange placeholders instead, for review only.
"""
import json
from html import escape

import viz

SITE = "https://www.majorform.co"
CONTACT = SITE + "/contact"
PERFORMANCE = SITE + "/performance-marketing-majorform-2026"

FONT = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,600&family=Space+Grotesk:wght@400;500&display=swap">'

# Shared by every block. Headings set size and colour only, so they keep your site's heading font.
BASE = """
  .mfp { --ink: #233551; --deep: #04202c; --text: #3d4350; --muted: #6b7180; --rule: rgba(35, 53, 81, .16); --tint: #f4f6f8;
    --num: "DM Sans", "Helvetica Neue", Arial, sans-serif; --gap-ph: #c2410c;
    container-type: inline-size; font-family: "Space Grotesk", system-ui, sans-serif; color: var(--text); font-size: 16px; line-height: 1.55; }
  .mfp * { box-sizing: border-box; }
  .mfp p, .mfp ul, .mfp ol, .mfp h1, .mfp h2, .mfp h3 { margin: 0; }
  .mfp ul, .mfp ol { padding: 0; list-style: none; }
  .mfp li { margin: 0; padding: 0; }
  .mfp li::before, .mfp li::marker { content: none; }
  .mfp .mfp__h2 { color: var(--ink); font-size: var(--mf-h2, clamp(26px, 3vw, 38px)); line-height: 1.08; letter-spacing: -.03em; text-transform: none; text-wrap: balance; }
  .mfp .mfp__lede { margin-top: 10px; max-width: 62ch; color: #1a1a1a; }
  .mfp .mfp__body { margin-top: 22px; }
  .mfp a { color: inherit; }
  .mfp .mfp__btn { display: inline-flex; align-items: center; gap: 10px; padding: 12px 20px; border-radius: 999px; background: var(--deep); color: #fff; font-size: 15px; font-weight: 500;
    text-decoration: none; border: 1px solid var(--deep); transition: background .3s, color .3s, border-color .3s; }
  .mfp .mfp__btn:hover, .mfp .mfp__btn:focus-visible { background: var(--acc); border-color: var(--acc); color: var(--deep); }
  .mfp .mfp__btn--ghost { background: none; color: var(--ink); border-color: rgba(35, 53, 81, .3); }
  .mfp a:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; }
  .mfp .mfp__gap { color: var(--gap-ph); }
  .mfp b .mfp__gap, .mfp em .mfp__gap { font-size: inherit; color: #ffb38a; }
  @media (prefers-reduced-motion: reduce) { .mfp * { transition: none !important; } }
"""

CSS = {
    "hero": """
  .mfp--hero .mfp__crumbs { display: flex; flex-wrap: wrap; gap: 6px; font-size: 13px; color: var(--muted); }
  .mfp--hero .mfp__crumbs a { text-decoration: none; border-bottom: 1px solid var(--rule); color: var(--ink); }
  .mfp--hero .mfp__h1 { margin-top: 14px; color: var(--ink); font-size: clamp(38px, 6vw, 68px); line-height: .98; letter-spacing: -.045em; text-transform: none; text-wrap: balance; }
  .mfp--hero .mfp__thesis { margin-top: 14px; color: var(--ink); font-size: clamp(19px, 2.1vw, 24px); font-weight: 500; line-height: 1.3; letter-spacing: -.01em; max-width: 34ch; }
  .mfp--hero .mfp__answer { margin-top: 16px; max-width: 62ch; color: #1a1a1a; font-size: 17px; }
  .mfp--hero .mfp__ctas { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }
  .mfp--hero .mfp__strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 36px; }
  .mfp--hero .mfp__stat { background: var(--deep); color: #f3f2f7; border-radius: 14px; padding: 16px 18px; display: grid; gap: 4px; align-content: start; }
  .mfp--hero .mfp__stat b { font-family: var(--num); font-weight: 600; font-size: clamp(28px, 3vw, 38px); line-height: 1; letter-spacing: -.04em; color: #fff; }
  .mfp--hero .mfp__stat span { font-size: 13.5px; line-height: 1.35; color: rgba(243, 242, 247, .78); }
""",
    "shift": """
  .mfp--shift .mfp__cols { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; }
  @container (min-width: 640px) { .mfp--shift .mfp__cols { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  .mfp--shift .mfp__col { border-radius: 16px; padding: 20px 22px; background: var(--tint); }
  .mfp--shift .mfp__col--now { background: var(--acc); }
  .mfp--shift .mfp__col h3 { color: var(--ink); font-size: 13px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; }
  .mfp--shift .mfp__col ul { margin-top: 12px; display: grid; gap: 8px; }
  .mfp--shift .mfp__col li { display: flex; gap: 10px; align-items: baseline; color: #1a1a1a; }
  .mfp--shift .mfp__col li i { flex: none; width: 7px; height: 7px; border-radius: 50%; background: rgba(35, 53, 81, .35); transform: translateY(-1px); }
  .mfp--shift .mfp__col--now li i { background: var(--deep); }
""",
    "problems": """
  .mfp--problems .mfp__pairs { display: grid; gap: 10px; }
  .mfp--problems .mfp__pair { display: grid; grid-template-columns: minmax(0, 1fr); gap: 0; border: 1px solid var(--rule); border-radius: 16px; overflow: hidden; }
  @container (min-width: 700px) { .mfp--problems .mfp__pair { grid-template-columns: minmax(0, .85fr) minmax(0, 1.3fr); } }
  .mfp--problems .mfp__prob, .mfp--problems .mfp__fix { padding: 18px 22px; }
  .mfp--problems .mfp__prob { background: var(--tint); }
  .mfp--problems .mfp__tag { display: block; margin-bottom: 6px; font-size: 11px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); }
  .mfp--problems h3 { color: var(--ink); font-size: 18px; line-height: 1.25; letter-spacing: -.01em; text-transform: none; }
  .mfp--problems .mfp__prob p, .mfp--problems .mfp__fix p { margin-top: 6px; font-size: 15px; }
""",
    "work": """
  .mfp--work .mfp__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  @container (min-width: 600px) { .mfp--work .mfp__grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  @container (min-width: 960px) { .mfp--work .mfp__grid { grid-template-columns: repeat(6, minmax(0, 1fr)); } }
  .mfp--work figure { margin: 0; display: grid; gap: 8px; align-content: start; min-width: 0; }
  .mfp--work .mfp__shot { aspect-ratio: 9 / 16; max-width: 100%; width: 100%; border-radius: 12px; overflow: hidden; background: var(--deep); }
  .mfp--work .mfp__shot img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .mfp--work .mfp__shot--empty { display: grid; place-items: center; color: var(--gap-ph); background: #fff4ed; border: 1px dashed var(--gap-ph); font-size: 12px; text-align: center; padding: 8px; }
  .mfp--work figcaption { font-size: 13px; line-height: 1.35; }
  .mfp--work figcaption b { display: block; color: var(--ink); font-weight: 500; }
  .mfp--work figcaption span { color: var(--muted); }
""",
    "types": """
  .mfp--types .mfp__list { display: grid; grid-template-columns: minmax(0, 1fr); gap: 20px 16px; }
  @container (min-width: 640px) { .mfp--types .mfp__list { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @container (min-width: 960px) { .mfp--types .mfp__list { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  .mfp--types .mfp__type { border-top: 2px solid var(--ink); padding-top: 14px; display: grid; gap: 6px; align-content: start; }
  .mfp--types h3 { color: var(--ink); font-size: 19px; line-height: 1.2; letter-spacing: -.01em; text-transform: none; }
  .mfp--types p { font-size: 15px; }
  .mfp--types .mfp__kpi { font-size: 13px; color: var(--muted); }
""",
    "results": """
  .mfp--results .mfp__cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; }
  .mfp--results .mfp__card { position: relative; isolation: isolate; overflow: hidden; display: grid; gap: 6px; align-content: start; padding: 20px 22px; border-radius: 16px;
    background: var(--deep); color: #f3f2f7; text-decoration: none; transition: transform .35s cubic-bezier(.2, .8, .2, 1), color .3s; }
  .mfp--results .mfp__card em { font-style: normal; font-size: 11px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; color: #96d1aa; transition: color .3s; }
  .mfp--results .mfp__card b { font-family: var(--num); font-weight: 600; font-size: clamp(34px, 3.6vw, 46px); line-height: 1; letter-spacing: -.04em; color: #fff; transition: color .3s; }
  .mfp--results .mfp__card span { font-size: 15px; line-height: 1.35; color: rgba(243, 242, 247, .8); transition: color .3s; }
  .mfp--results .mfp__card u { margin-top: 8px; justify-self: start; text-decoration: none; font-size: 14px; font-weight: 500; border-bottom: 1px solid rgba(255, 255, 255, .35); }
  .mfp--results a.mfp__card::before { content: ""; position: absolute; inset: 0; z-index: -1; background: var(--acc); transform: translateY(101%); transition: transform .45s cubic-bezier(.2, .8, .2, 1); }
  .mfp--results a.mfp__card:hover, .mfp--results a.mfp__card:focus-visible { transform: translateY(-4px); color: var(--deep); }
  .mfp--results a.mfp__card:hover::before, .mfp--results a.mfp__card:focus-visible::before { transform: translateY(0); }
  .mfp--results a.mfp__card:hover *, .mfp--results a.mfp__card:focus-visible * { color: var(--deep); border-color: var(--deep); }
  .mfp--results .mfp__quote { margin: 12px 0 0; padding: 20px 22px; border-radius: 16px; background: var(--tint); }
  .mfp--results .mfp__quote p { color: var(--ink); font-size: 18px; line-height: 1.45; max-width: 60ch; }
  .mfp--results .mfp__quote footer { margin-top: 10px; font-size: 13.5px; color: var(--muted); }
""",
    "process": """
  .mfp--process .mfp__steps { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; counter-reset: mfp-step; }
  @container (min-width: 700px) { .mfp--process .mfp__steps { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  .mfp--process .mfp__steps li { counter-increment: mfp-step; border-top: 2px solid var(--ink); padding-top: 14px; display: grid; gap: 6px; align-content: start; }
  .mfp--process .mfp__steps li::before { content: "Step " counter(mfp-step); font-size: 11px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); }
  .mfp--process h3 { color: var(--ink); font-size: 19px; letter-spacing: -.01em; text-transform: none; }
  .mfp--process p { font-size: 15px; }
  .mfp--process .mfp__when { font-size: 13px; color: var(--muted); }
""",
    "fit": """
  .mfp--fit .mfp__cells { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; }
  .mfp--fit .mfp__cell { background: var(--tint); border-radius: 16px; padding: 18px 20px; display: grid; gap: 6px; align-content: start; }
  .mfp--fit h3 { color: var(--ink); font-size: 13px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; }
  .mfp--fit p { font-size: 15.5px; color: #1a1a1a; }
""",
    "faq": """
  .mfp--faq .mfp__list { border-top: 1px solid var(--rule); }
  .mfp--faq details { border-bottom: 1px solid var(--rule); }
  .mfp--faq summary { list-style: none; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 18px 2px; }
  .mfp--faq summary::-webkit-details-marker { display: none; }
  .mfp--faq summary::marker { content: none; }
  .mfp--faq h3 { color: var(--ink); font-family: inherit; font-size: 18px; font-weight: 500; line-height: 1.3; letter-spacing: -.01em; text-transform: none; }
  .mfp--faq .mfp__icon { position: relative; flex: none; width: 30px; height: 30px; border-radius: 50%; border: 1px solid rgba(35, 53, 81, .35); transition: background .3s, border-color .3s, transform .35s cubic-bezier(.2, .8, .2, 1); }
  .mfp--faq .mfp__icon::before, .mfp--faq .mfp__icon::after { content: ""; position: absolute; left: 50%; top: 50%; width: 11px; height: 1.5px; margin: -.75px 0 0 -5.5px; background: var(--ink); }
  .mfp--faq .mfp__icon::after { transform: rotate(90deg); }
  .mfp--faq details[open] .mfp__icon { transform: rotate(45deg); background: var(--deep); border-color: var(--deep); }
  .mfp--faq details[open] .mfp__icon::before, .mfp--faq details[open] .mfp__icon::after { background: #fff; }
  .mfp--faq summary:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; border-radius: 6px; }
  .mfp--faq .mfp__a { padding: 0 48px 20px 2px; max-width: 72ch; font-size: 15.5px; }
  .mfp--faq { interpolate-size: allow-keywords; }
  .mfp--faq details::details-content { height: 0; overflow: hidden; transition: height .4s cubic-bezier(.2, .8, .2, 1), content-visibility .4s allow-discrete; }
  .mfp--faq details[open]::details-content { height: auto; }
""",
    "related": """
  .mfp--related .mfp__links { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
  .mfp--related .mfp__link { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 14px 16px; border-radius: 12px; background: var(--tint); color: var(--ink); font-weight: 500; text-decoration: none; }
  .mfp--related .mfp__link--up { background: var(--deep); color: #fff; }
  .mfp--related .mfp__go { flex: none; width: 28px; height: 28px; border-radius: 50%; border: 1px solid currentColor; display: grid; place-items: center; font-size: 13px; opacity: .6; transition: transform .3s, opacity .3s; }
  .mfp--related a.mfp__link:hover .mfp__go, .mfp--related a.mfp__link:focus-visible .mfp__go { opacity: 1; transform: rotate(-45deg); }
  .mfp--related span.mfp__link { color: var(--muted); font-weight: 400; }
  .mfp--related .mfp__band { margin-top: 32px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px; padding: 28px clamp(20px, 4cqi, 40px); border-radius: 20px; background: var(--acc); }
  .mfp--related .mfp__band .mfp__h2 { color: var(--deep); }
""",
}


def e(s):
    return escape(s, quote=True)


class Gaps:
    """Collects what a sheet still needs, and renders a gap as a placeholder (preview) or drops it (live)."""
    def __init__(self, preview):
        self.preview, self.missing = preview, []

    def ok(self, value, what):
        if value is None:
            self.missing.append(what)
            return False
        return True

    def ph(self, label):
        return f'<span class="mfp__gap">[{e(label)}]</span>' if self.preview else ""


def wrap(slot, d, inner, comment):
    dark = slot in d.get("dark", {})
    head = (f"<!-- MajorForm {d['name']} page, slot {comment}.\n"
            f"     Paste into its own Squarespace Code block, with Display Source turned off. No scripts."
            + (f"\n     Set this section's background to your navy ({d['dark'][slot]}) so the block blends in." if dark else "")
            + (" Its animation comes from the page header script." if slot in viz.CSS else "") + " -->")
    css = BASE + CSS[slot] + (viz.DARK + DARK_CSS.get(slot, "") if dark else "") + viz.CSS.get(slot, "")
    style = f'--acc:{d["accent"]}' + (f';--mfp-bg:{d["dark"][slot]}' if dark else "")
    anim = " data-anim" if slot in viz.CSS else ""
    return (f'{head}\n{FONT}\n<style>{css}</style>\n<section class="mfp mfp--{slot}" style="{style}" '
            f'data-theme="{"dark" if dark else "light"}"{anim}>\n{inner}\n</section>\n')


def head2(title, lede=None, tag="h2", anchor=None):
    a = f' id="{anchor}"' if anchor else ""
    out = f'<{tag} class="mfp__h2"{a}>{e(title)}</{tag}>'
    if lede:
        out += f'\n<p class="mfp__lede">{e(lede)}</p>'
    return out


def hero(d, g):
    stats = []
    for value, label in d["stats"]:
        if g.ok(value, f"Hero stat: {label}"):
            stats.append(f'<div class="mfp__stat"><b>{e(value)}</b><span>{e(label)}</span></div>')
        elif g.preview:
            stats.append(f'<div class="mfp__stat"><b>{g.ph("x")}</b><span>{e(label)}</span></div>')
    crumbs = (f'<nav class="mfp__crumbs" aria-label="Breadcrumb"><a href="{SITE}/">Home</a><span aria-hidden="true">/</span>'
              f'<a href="{PERFORMANCE}">Performance marketing</a><span aria-hidden="true">/</span><span aria-current="page">{e(d["name"])}</span></nav>')
    inner = (f'{crumbs}\n<h1 class="mfp__h1">{e(d["h1"])}</h1>\n<p class="mfp__thesis">{e(d["thesis"])}</p>\n'
             f'<p class="mfp__answer">{e(d["answer"])}</p>\n'
             f'<div class="mfp__ctas"><a class="mfp__btn" href="{CONTACT}">Talk to our strategists <span aria-hidden="true">&rarr;</span></a>'
             f'<a class="mfp__btn mfp__btn--ghost" href="#results">See {e(d["short"])} results</a></div>')
    if stats:
        inner += '\n<div class="mfp__strip">' + "".join(stats) + "</div>"
    return wrap("hero", d, inner, "1: hero (H1, answer, proof numbers)")


def shift(d, g):
    s = d["shift"]
    def col(title, items, cls, art):
        return (f'<div class="mfp__col{cls}">{art}<h3>{e(title)}</h3><ul>'
                + "".join(f"<li><i aria-hidden=\"true\"></i><span>{e(x)}</span></li>" for x in items) + "</ul></div>")
    inner = (head2(s["title"], s["lede"]) + '\n<div class="mfp__body mfp__cols">'
             + col("What used to work", s["before"], "", viz.audience_before())
             + col("What works now", s["now"], " mfp__col--now", viz.audience_now()) + "</div>")
    return wrap("shift", d, inner, "2: what's changed")


def problems(d, g):
    arts = d.get("problem_viz", [])
    pairs = "".join(
        f'<div class="mfp__pair" style="--p:{i}"><div class="mfp__prob"><span class="mfp__tag">The problem</span><h3>{e(p)}</h3><p>{e(pd)}</p></div>'
        f'<div class="mfp__fix"><div><span class="mfp__tag">What we do</span><h3>{e(f)}</h3><p>{e(fd)}</p></div>'
        + (viz.PROBLEM_VIZ[arts[i]]() if i < len(arts) else "") + "</div></div>"
        for i, (p, pd, f, fd) in enumerate(d["problems"]))
    inner = head2(d["problems_title"]) + f'\n<div class="mfp__body mfp__pairs">{pairs}</div>'
    return wrap("problems", d, inner, "3: problems and fixes")


def work(d, g):
    figs = []
    for w in d["work"]:
        if g.ok(w["src"], f"Ad creative image: {w['title']}"):
            figs.append(f'<figure><div class="mfp__shot"><img src="{e(w["src"])}" alt="{e(w["alt"])}" loading="lazy" width="360" height="640"></div>'
                        f'<figcaption><b>{e(w["title"])}</b><span>{e(w["note"])}</span></figcaption></figure>')
        elif g.preview:
            figs.append(f'<figure><div class="mfp__shot mfp__shot--empty">[{e(w["title"])} image]</div>'
                        f'<figcaption><b>{e(w["title"])}</b><span>{e(w["note"])}</span></figcaption></figure>')
    if not figs:
        return None
    inner = head2(d["work_title"], d["work_lede"]) + '\n<div class="mfp__body mfp__grid">' + "".join(figs) + "</div>"
    return wrap("work", d, inner, "4: the work")


def types(d, g):
    items = "".join(f'<li class="mfp__type"><h3>{e(n)}</h3><p>{e(t)}</p><span class="mfp__kpi">{e(k)}</span></li>' for n, t, k in d["types"])
    inner = head2(d["types_title"], d["types_lede"]) + f'\n<ul class="mfp__body mfp__list">{items}</ul>'
    return wrap("types", d, inner, "5: campaign types")


def results(d, g):
    cards = []
    for r in d["results"]:
        if g.ok(r["value"], f"Result: {r['brand'] or 'a brand'} on {d['short']}") and r["brand"]:
            body = f'<em>{e(r["brand"])}</em><b>{e(r["value"])}</b><span>{e(r["label"])}</span>'
            if r.get("url"):
                cards.append(f'<a class="mfp__card" href="{e(r["url"])}">{body}<u>Read the case study&nbsp;<span aria-hidden="true">&rarr;</span></u></a>')
            else:
                cards.append(f'<div class="mfp__card">{body}</div>')
        elif g.preview:
            cards.append(f'<div class="mfp__card"><em>{g.ph("brand")}</em><b>{g.ph("x")}</b><span>{e(r["label"])}</span></div>')
    q = d["quote"]
    quote = ""
    if g.ok(q["text"], "Client quote about working with you on " + d["short"]):
        quote = f'<blockquote class="mfp__quote"><p>{e(q["text"])}</p><footer>{e(q["who"])}</footer></blockquote>'
    elif g.preview:
        quote = f'<blockquote class="mfp__quote"><p>{g.ph("one line from a client about working with MajorForm on " + d["short"])}</p><footer>{g.ph("name, role, brand")}</footer></blockquote>'
    if not cards and not quote:
        return None
    inner = head2(d["results_title"], d["results_lede"], anchor="results") + '\n<div class="mfp__body"><div class="mfp__cards">' + "".join(cards) + "</div>" + quote + "</div>"
    return wrap("results", d, inner, "6: results")


def process(d, g):
    steps = "".join(f'<li><h3>{e(t)}</h3><p>{e(p)}</p><span class="mfp__when">{e(w)}</span></li>' for t, p, w in d["process"])
    inner = head2("How we start", d["process_lede"]) + f'\n<ol class="mfp__body mfp__steps">{steps}</ol>'
    return wrap("process", d, inner, "7: how we start")


def fit(d, g):
    cells = []
    for title, text in d["fit"]:
        if g.ok(text, f"Fit and terms: {title}"):
            cells.append(f'<div class="mfp__cell"><h3>{e(title)}</h3><p>{e(text)}</p></div>')
        elif g.preview:
            cells.append(f'<div class="mfp__cell"><h3>{e(title)}</h3><p>{g.ph("your answer")}</p></div>')
    inner = head2(d["fit_title"]) + '\n<div class="mfp__body mfp__cells">' + "".join(cells) + "</div>"
    return wrap("fit", d, inner, "8: fit and terms")


def faq(d, g):
    items = "".join(
        f'<details{" open" if i == 0 else ""}><summary><h3>{e(q)}</h3><span class="mfp__icon" aria-hidden="true"></span></summary><p class="mfp__a">{e(a)}</p></details>'
        for i, (q, a) in enumerate(d["faqs"]))
    inner = head2(f'{d["name"]} FAQs') + f'\n<div class="mfp__body mfp__list">{items}</div>'
    return wrap("faq", d, inner, "9: FAQs (schema is in schema.html)")


def related(d, g):
    links = [f'<a class="mfp__link mfp__link--up" href="{PERFORMANCE}">Performance marketing <span class="mfp__go" aria-hidden="true">&uarr;</span></a>']
    for name, url in d["related"]:
        if url:
            links.append(f'<a class="mfp__link" href="{e(url)}">{e(name)} <span class="mfp__go" aria-hidden="true">&rarr;</span></a>')
        else:
            links.append(f'<span class="mfp__link">{e(name)}</span>')
    inner = (head2(f'{d["short"]} works best with') + '\n<div class="mfp__body mfp__links">' + "".join(links) + "</div>"
             f'\n<div class="mfp__band"><h2 class="mfp__h2">{e(d["closing"])}</h2><a class="mfp__btn" href="{CONTACT}">Talk to our strategists <span aria-hidden="true">&rarr;</span></a></div>')
    return wrap("related", d, inner, "10: related platforms and closing call to action")


# Extra rules when a slot sits on the navy background
DARK_CSS = {
    "shift": """
  .mfp--shift[data-theme="dark"] .mfp__col { background: var(--tint); }
  .mfp--shift[data-theme="dark"] .mfp__col li { color: #f3f2f7; }
  .mfp--shift[data-theme="dark"] .mfp__col li i { background: rgba(255, 255, 255, .35); }
  .mfp--shift[data-theme="dark"] .mfp__col--now { background: rgba(255, 239, 174, .08); box-shadow: inset 0 0 0 1px rgba(255, 239, 174, .45); }
  .mfp--shift[data-theme="dark"] .mfp__col--now h3 { color: var(--acc); }
  .mfp--shift[data-theme="dark"] .mfp__col--now li i { background: var(--acc); }
""",
    "problems": """
  .mfp--problems[data-theme="dark"] .mfp__fix h3 { color: var(--acc); }
""",
}


SLOTS = [("hero", hero), ("shift", shift), ("problems", problems), ("work", work), ("types", types),
         ("results", results), ("process", process), ("fit", fit), ("faq", faq), ("related", related)]


def schema(d):
    url = f'{SITE}/{d["slug"]}'
    data = [
        {"@context": "https://schema.org", "@type": "Service", "@id": url + "/#service", "name": d["service_name"],
         "serviceType": d["service_name"], "description": d["answer"], "url": url, "provider": {"@id": SITE + "/#organization"},
         "areaServed": [{"@type": "Country", "name": c} for c in d["markets"]], "category": "Performance Marketing"},
        {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Performance marketing", "item": PERFORMANCE},
            {"@type": "ListItem", "position": 3, "name": d["name"], "item": url}]},
        {"@context": "https://schema.org", "@type": "FAQPage", "@id": url + "/#faq", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in d["faqs"]]},
    ]
    return (f"<!-- {d['name']} page header. Paste into Page Settings > Advanced > Page Header Code Injection.\n"
            "     The schema is built from the same text as the page, so the FAQ answers match word for word.\n"
            "     The short script below plays the block animations once as they scroll into view. -->\n"
            '<script type="application/ld+json">\n' + json.dumps(data, indent=2, ensure_ascii=False) + "\n</script>\n"
            + viz.MOTION_JS + "\n")


def render(d, preview=False):
    """Returns ({slot: html}, missing). Slots with nothing confirmed to show are left out."""
    g = Gaps(preview)
    blocks = {}
    for name, fn in SLOTS:
        html = fn(d, g)
        if html:
            blocks[name] = html
    return blocks, g.missing
