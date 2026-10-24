"""Performance page FAQ: one script-free code block plus the matching FAQPage schema.

Questions and answers live here once, so the visible text and the schema always match.
Each question is a <details> element: the answers are plain HTML text, readable by search
engines even while closed, and opening one needs no script.
"""
import json
from html import escape

PAGE = "https://www.majorform.co/performance-marketing-majorform-2026"
CONTACT = "https://www.majorform.co/contact"

HEADING = "Questions brands ask about performance marketing"
INTRO = "What brands usually ask us before we start working together."
META = "https://majorform.co/meta-ads-agency-singapore"

# (question, answer, {phrase in the answer: link}). Links show on the page only; the schema keeps the same words as plain text.
FAQS = [
    ("How is MajorForm different from a traditional media agency?",
     "We're paid a retainer, not a commission on your ad spend. That gives our team the time to focus on strategy, "
     "testing and decisions backed by data across Meta, Google, TikTok and other platforms, and to shape the work "
     "around your goals, from building your brand to driving sales.", {}),
    ("Who is MajorForm for?",
     "Fast-growing startups, DTC brands and regional businesses that want to grow profitably through digital "
     "channels. That could mean launching in a new market, getting more from your ad spend or building growth that "
     "lasts. We tailor the work across three areas: brand, performance and commerce.", {}),
    ("What platforms does MajorForm manage?",
     "Meta (Facebook and Instagram), TikTok, LinkedIn and Google (Search, Performance Max, YouTube and App Install), "
     "plus commerce platforms like TikTok Shop, Amazon and Google Shopping, and programmatic partners such as "
     "StackAdapt, Teads and Criteo. We don't favour any one channel: we find what works for your audience and scale it.",
     {"Meta (Facebook and Instagram)": META}),
    ("What kind of results can I expect with MajorForm?",
     "It depends on your goals, but most clients see better CAC, ROAS and creative performance within the first 30 "
     "to 60 days. We test quickly, learn from every round and move budget to what converts, with clear reports so "
     "you can see what's working.", {}),
    ("What makes MajorForm effective for regional expansion across Southeast Asia?",
     "We plan each market on its own terms. Creative, media strategy and platform mix are localised to how mature "
     "the market is, what customers cost to acquire and how people use each channel, across Singapore, Malaysia, "
     "Indonesia, the Philippines and beyond. From launch to scale, we handle the complexity so you can grow with "
     "confidence.", {}),
]
# Wada 281 colours for each question's hover flood and open dot
WADA = ["#ffefae", "#96d1aa", "#2fc2b6", "#ffefae", "#96d1aa"]

HEADER = """<!-- MajorForm performance page: FAQs (navy panel beside the questions).
     Paste into its own Squarespace Code block, with Display Source turned off. No scripts.
     It includes its own H2, intro and "Talk to our strategists" link, so remove the old FAQ
     heading, accordion and button. The heading matches the site H2 through the page code injection.
     Questions live in faq.py, which also writes faq-schema.html, so the two always match. -->"""

STYLE = """<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500&display=swap">
<style>
  .mf-faq { --ink: #233551; --navy: #253551; --deep: #04202c; --text: #3d4350; --muted: #6b7180; --rule: rgba(35, 53, 81, .16);
    --lemon: #ffefae; --mint: #96d1aa; --teal: #00978d; --blue: #007190;
    container-type: inline-size; font-family: "Space Grotesk", system-ui, sans-serif; color: var(--text); }
  .mf-faq * { box-sizing: border-box; }
  .mf-faq__wrap { display: grid; grid-template-columns: minmax(0, 1fr); gap: 20px 48px; }
  /* Panel and questions both start at the top of the block */
  @container (min-width: 820px) { .mf-faq__wrap { grid-template-columns: minmax(0, 1fr) minmax(0, 1.75fr); align-items: start; } }

  /* Navy panel with a small four-colour Wada tile in the corner */
  .mf-faq__panel { position: relative; overflow: hidden; background: var(--navy); border-radius: 20px; padding: 30px 28px; color: rgba(255, 255, 255, .78); }
  .mf-faq__panel::before { content: ""; position: absolute; right: -40px; top: -40px; width: 150px; height: 150px; border-radius: 24px; background:
    linear-gradient(var(--lemon) 0 0) 0 0 / 50% 50% no-repeat, linear-gradient(var(--mint) 0 0) 100% 0 / 50% 50% no-repeat,
    linear-gradient(var(--teal) 0 0) 0 100% / 50% 50% no-repeat, linear-gradient(var(--blue) 0 0) 100% 100% / 50% 50% no-repeat; }
  .mf-faq .mf-faq__title { position: relative; margin: 0 0 10px; padding-top: 70px; max-width: 12ch; color: #fff;
    font-family: var(--mf-h2-font, "DM Sans", "Helvetica Neue", Arial, sans-serif); font-weight: var(--mf-h2-weight, 600);
    font-size: var(--mf-h2, clamp(28px, 3.2vw, 40px)); line-height: 1.08; letter-spacing: var(--mf-h2-ls, -.03em); text-transform: none; text-wrap: balance; }
  .mf-faq__intro { margin: 0 0 20px; font-size: 15px; line-height: 1.45; max-width: 36ch; }
  .mf-faq .mf-faq__cta { display: inline-flex; align-items: center; gap: 10px; padding: 12px 20px; border-radius: 999px; background: var(--mint); color: var(--deep);
    font-size: 15px; font-weight: 500; text-decoration: none; transition: background .3s; }
  .mf-faq .mf-faq__cta:hover, .mf-faq .mf-faq__cta:focus-visible { background: var(--lemon); }
  .mf-faq .mf-faq__cta:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }

  /* Questions: a Wada colour floods up behind the row on hover; the open question's number becomes a Wada dot */
  .mf-faq__list { border-top: 1px solid var(--rule); }
  .mf-faq details { border-bottom: 1px solid var(--rule); }
  .mf-faq summary { position: relative; isolation: isolate; overflow: hidden; list-style: none; cursor: pointer; display: grid; grid-template-columns: 2.6em minmax(0, 1fr) auto;
    align-items: center; gap: 4px 12px; padding: 18px 10px; border-radius: 10px; color: var(--ink); }
  .mf-faq summary::-webkit-details-marker { display: none; }
  .mf-faq summary::marker { content: none; }
  .mf-faq summary::after { content: ""; position: absolute; inset: 0; z-index: -1; background: var(--w); opacity: .55; transform: translateY(102%); transition: transform .4s cubic-bezier(.2, .8, .2, 1); }
  .mf-faq summary:hover::after { transform: none; }
  .mf-faq summary:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
  .mf-faq__num { justify-self: start; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; font-family: "DM Sans", "Helvetica Neue", Arial, sans-serif;
    font-weight: 600; font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; transition: background .3s, color .3s; }
  .mf-faq details[open] .mf-faq__num { background: var(--w); color: var(--ink); }
  .mf-faq .mf-faq__q { margin: 0; font-family: inherit; font-size: 18px; font-weight: 500; line-height: 1.3; letter-spacing: -.01em; color: inherit; text-transform: none; }
  .mf-faq__icon { position: relative; width: 30px; height: 30px; border-radius: 50%; border: 1px solid rgba(35, 53, 81, .35); background: #fff;
    transition: transform .35s cubic-bezier(.2, .8, .2, 1), background .3s, border-color .3s; }
  .mf-faq__icon::before, .mf-faq__icon::after { content: ""; position: absolute; left: 50%; top: 50%; width: 11px; height: 1.5px; margin: -.75px 0 0 -5.5px; background: var(--ink); border-radius: 1px; }
  .mf-faq__icon::after { transform: rotate(90deg); }
  .mf-faq details[open] .mf-faq__icon { transform: rotate(45deg); background: var(--deep); border-color: var(--deep); }
  .mf-faq details[open] .mf-faq__icon::before, .mf-faq details[open] .mf-faq__icon::after { background: #fff; }
  .mf-faq__a { margin: 0; padding: 0 52px 22px calc(2.6em + 22px); font-size: 15px; line-height: 1.5; max-width: 72ch; }
  .mf-faq__a a { color: var(--ink); text-decoration: underline; text-decoration-color: var(--teal); text-decoration-thickness: 2px; text-underline-offset: 3px; }
  /* Smooth open where the browser supports it; elsewhere it simply opens */
  .mf-faq { interpolate-size: allow-keywords; }
  .mf-faq details::details-content { height: 0; overflow: hidden; transition: height .4s cubic-bezier(.2, .8, .2, 1), content-visibility .4s allow-discrete; }
  .mf-faq details[open]::details-content { height: auto; }
  @container (max-width: 519px) { .mf-faq summary { grid-template-columns: minmax(0, 1fr) auto; } .mf-faq__num { display: none; } .mf-faq__a { padding: 0 10px 20px; } .mf-faq .mf-faq__q { font-size: 17px; } }
  @media (prefers-reduced-motion: reduce) { .mf-faq summary::after, .mf-faq__num, .mf-faq__icon, .mf-faq details::details-content { transition: none; } }
</style>"""


def answer_html(a, links):
    out = escape(a)
    for phrase, url in links.items():
        out = out.replace(escape(phrase), f'<a href="{url}">{escape(phrase)}</a>', 1)
    return out


def block_html():
    items = "\n".join(
        f'    <details style="--w:{WADA[i % len(WADA)]}"{" open" if i == 0 else ""}>\n'
        f'      <summary><span class="mf-faq__num" aria-hidden="true">{i + 1:02d}</span>'
        f'<h3 class="mf-faq__q">{escape(q)}</h3><span class="mf-faq__icon" aria-hidden="true"></span></summary>\n'
        f'      <p class="mf-faq__a">{answer_html(a, links)}</p>\n'
        f'    </details>'
        for i, (q, a, links) in enumerate(FAQS))
    return (f'{HEADER}\n{STYLE}\n<section class="mf-faq" id="faq" aria-labelledby="mf-faq-title">\n<div class="mf-faq__wrap">\n'
            f'  <div class="mf-faq__panel">\n    <h2 class="mf-faq__title" id="mf-faq-title">{escape(HEADING)}</h2>\n'
            f'    <p class="mf-faq__intro">{escape(INTRO)}</p>\n'
            f'    <a class="mf-faq__cta" href="{CONTACT}">Talk to our strategists <span aria-hidden="true">&rarr;</span></a>\n  </div>\n'
            f'  <div class="mf-faq__list">\n{items}\n  </div>\n</div>\n</section>\n')


def schema_html():
    data = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "@id": PAGE + "/#faq",
        "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a, _ in FAQS],
    }
    return ("<!-- FAQPage schema for the performance page: paste into Page Settings > Advanced > Page Header Code Injection,\n"
            "     next to the page's other code. If the page already has FAQPage schema, replace it with this so there is only one,\n"
            "     and the questions match the visible FAQ word for word. -->\n"
            '<script type="application/ld+json">\n' + json.dumps(data, indent=2, ensure_ascii=False) + "\n</script>\n")
