"""Performance page FAQ: one script-free code block plus the matching FAQPage schema.

Questions and answers live here once, so the visible text and the schema always match.
Each question is a <details> element: the answers are plain HTML text, readable by search
engines even while closed, and opening one needs no script.
"""
import json
from html import escape

PAGE = "https://www.majorform.co/performance-marketing-majorform-2026"
CONTACT = "https://www.majorform.co/contact"

HEADING = "Performance marketing FAQs"
INTRO = "What brands usually ask us before we start working together."

FAQS = [
    ("How is MajorForm different from a traditional media agency?",
     "Unlike traditional media agencies, MajorForm is not just about spending ad budgets and charging on a "
     "commission model. With a retainer model, we have the bandwidth and agility to focus on strategy, "
     "experimentation and data-backed decision-making across Meta, Google, TikTok and other platforms. Our system "
     "adapts to your objectives, from full-funnel branding to direct-response performance."),
    ("Who is MajorForm for?",
     "MajorForm is designed for fast-growing startups, DTC brands and regional businesses looking to scale "
     "profitably through digital channels. Whether you're launching in a new market, optimising your ad spend or "
     "building a sustainable growth engine, we offer tailored modules for brand, commerce and performance."),
    ("What platforms does MajorForm manage?",
     "We run and optimise campaigns across Meta (Facebook and Instagram), TikTok, LinkedIn, Google (Search, "
     "Performance Max, YouTube and App Install), commerce platforms (TikTok Shop, Amazon and Google Shopping) and "
     "programmatic partners such as StackAdapt, Teads and Criteo. We're channel-agnostic, built to find and scale "
     "what works for your audience and growth goals."),
    ("What kind of results can I expect with MajorForm?",
     "Results depend on your goals, but clients typically see improvements in CAC, ROAS and creative performance "
     "within the first 30 to 60 days. MajorForm is engineered to test fast, learn continuously and scale what "
     "converts, backed by clear reporting and strategy."),
    ("What makes MajorForm effective for regional expansion across Southeast Asia?",
     "MajorForm is skilled in managing the complexities of the SEA market. We localise creative, media strategy and "
     "platform mix based on market maturity, cost per acquisition and channel behaviour across Singapore, Malaysia, "
     "Indonesia, the Philippines and beyond. From launch to scale, we manage the complexity so you can grow with "
     "confidence."),
]

HEADER = """<!-- MajorForm performance page: FAQs.
     Paste into its own Squarespace Code block, with Display Source turned off. No scripts.
     It includes its own H2, intro and "Talk to our strategists" link, so remove the old FAQ
     heading, accordion and button. If you edit a question here, update faq-schema.html to match. -->"""

STYLE = """<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500&display=swap">
<style>
  .mf-faq { --ink: #233551; --deep: #04202c; --text: #3d4350; --muted: #6b7180; --rule: rgba(35, 53, 81, .16); --hot: #96d1aa;
    container-type: inline-size; font-family: "Space Grotesk", system-ui, sans-serif; color: var(--text); }
  .mf-faq * { box-sizing: border-box; }
  .mf-faq__wrap { display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px 64px; }
  @container (min-width: 820px) { .mf-faq__wrap { grid-template-columns: minmax(0, 1fr) minmax(0, 1.9fr); } .mf-faq__side { position: sticky; top: 120px; align-self: start; } }
  .mf-faq--stacked .mf-faq__wrap { grid-template-columns: minmax(0, 1fr) !important; max-width: 900px; margin: 0 auto; }
  .mf-faq--stacked .mf-faq__side { position: static; display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between; gap: 12px 24px; }
  .mf-faq--stacked .mf-faq__side > div { flex: 1 1 320px; }
  .mf-faq .mf-faq__title { margin: 0 0 10px; color: var(--ink); font-size: var(--mf-h2, clamp(30px, 3.2vw, 42px)); line-height: 1.05; letter-spacing: -.03em; text-transform: none; }
  .mf-faq__intro { margin: 0 0 20px; font-size: 15px; line-height: 1.5; max-width: 34ch; }
  .mf-faq .mf-faq__cta { display: inline-flex; align-items: center; gap: 10px; padding: 12px 20px; border-radius: 999px; background: var(--deep); color: #fff; font-size: 15px; font-weight: 500;
    text-decoration: none; transition: background .3s, color .3s; }
  .mf-faq .mf-faq__cta:hover, .mf-faq .mf-faq__cta:focus-visible { background: var(--hot); color: var(--deep); }
  .mf-faq .mf-faq__cta:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; }
  .mf-faq__list { border-top: 1px solid var(--rule); }
  .mf-faq details { border-bottom: 1px solid var(--rule); }
  .mf-faq summary { list-style: none; cursor: pointer; display: grid; grid-template-columns: 2.4em minmax(0, 1fr) auto; align-items: baseline; gap: 4px 12px; padding: 20px 4px; color: var(--ink); }
  .mf-faq summary::-webkit-details-marker { display: none; }
  .mf-faq summary::marker { content: none; }
  .mf-faq__num { font-size: 12px; font-weight: 500; letter-spacing: .12em; color: var(--muted); font-variant-numeric: tabular-nums; }
  .mf-faq .mf-faq__q { margin: 0; font-family: inherit; font-size: 18px; font-weight: 500; line-height: 1.3; letter-spacing: -.01em; color: inherit; text-transform: none; }
  .mf-faq__icon { position: relative; align-self: center; width: 30px; height: 30px; border-radius: 50%; border: 1px solid rgba(35, 53, 81, .35); transition: background .3s, border-color .3s, transform .35s cubic-bezier(.2, .8, .2, 1); }
  .mf-faq__icon::before, .mf-faq__icon::after { content: ""; position: absolute; left: 50%; top: 50%; width: 11px; height: 1.5px; margin: -.75px 0 0 -5.5px; background: var(--ink); border-radius: 1px; transition: background .3s; }
  .mf-faq__icon::after { transform: rotate(90deg); }
  .mf-faq summary:hover .mf-faq__icon { border-color: var(--ink); }
  .mf-faq details[open] .mf-faq__icon { transform: rotate(45deg); background: var(--deep); border-color: var(--deep); }
  .mf-faq details[open] .mf-faq__icon::before, .mf-faq details[open] .mf-faq__icon::after { background: #fff; }
  .mf-faq summary:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; border-radius: 6px; }
  .mf-faq__a { margin: 0; padding: 0 52px 22px calc(2.4em + 16px); font-size: 15px; line-height: 1.6; max-width: 70ch; }
  /* Smooth open where the browser supports it; elsewhere it simply opens */
  .mf-faq { interpolate-size: allow-keywords; }
  .mf-faq details::details-content { height: 0; overflow: hidden; transition: height .4s cubic-bezier(.2, .8, .2, 1), content-visibility .4s allow-discrete; }
  .mf-faq details[open]::details-content { height: auto; }
  @container (max-width: 519px) { .mf-faq summary { grid-template-columns: minmax(0, 1fr) auto; } .mf-faq__num { display: none; } .mf-faq__a { padding: 0 4px 20px; } .mf-faq .mf-faq__q { font-size: 17px; } }
  @media (prefers-reduced-motion: reduce) { .mf-faq__icon, .mf-faq details::details-content { transition: none; } }
</style>"""


def block_html(layout="split"):
    items = "\n".join(
        f'    <details{" open" if i == 0 else ""}>\n'
        f'      <summary><span class="mf-faq__num" aria-hidden="true">{i + 1:02d}</span>'
        f'<h3 class="mf-faq__q">{escape(q)}</h3><span class="mf-faq__icon" aria-hidden="true"></span></summary>\n'
        f'      <p class="mf-faq__a">{escape(a)}</p>\n'
        f'    </details>'
        for i, (q, a) in enumerate(FAQS))
    return (f'{HEADER}\n{STYLE}\n<section class="mf-faq{" mf-faq--stacked" if layout == "stacked" else ""}" id="faq" data-theme="light">\n<div class="mf-faq__wrap">\n'
            f'  <div class="mf-faq__side">\n    <div><h2 class="mf-faq__title">{escape(HEADING)}</h2>\n'
            f'    <p class="mf-faq__intro">{escape(INTRO)}</p></div>\n'
            f'    <a class="mf-faq__cta" href="{CONTACT}">Talk to our strategists <span aria-hidden="true">&rarr;</span></a>\n  </div>\n'
            f'  <div class="mf-faq__list">\n{items}\n  </div>\n</div>\n</section>\n')


def schema_html():
    data = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "@id": PAGE + "/#faq",
        "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQS],
    }
    return ("<!-- FAQPage schema for the performance page. Replace the FAQPage part of your existing schema with this,\n"
            "     so the questions match the visible FAQ word for word. -->\n"
            '<script type="application/ld+json">\n' + json.dumps(data, indent=2, ensure_ascii=False) + "\n</script>\n")
