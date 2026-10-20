"""Goal cards for the performance page: brand, performance, commerce.

Each card is its own Squarespace code block with no script. The dot illustrations are
inline SVG drawn here at build time, animated with CSS only, so they show in the editor too.
"""
import math

SAGE, LEMON, TEAL = "#96d1aa", "#ffefae", "#2fc2b6"


def c(x, y, r, fill, op=None, cls=None):
    o = f' opacity="{op:.2f}"' if op is not None else ""
    k = f' class="{cls}"' if cls else ""
    return f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{fill}"{o}{k}/>'


def art_brand():
    rings = []
    for ring in range(1, 6):
        n, rad = ring * 12, ring * 16
        dots = "".join(c(math.cos(i / n * 2 * math.pi) * rad, math.sin(i / n * 2 * math.pi) * rad, 1.4, SAGE, 0.75 - ring * 0.08) for i in range(n))
        # alternate rings orbit in opposite directions
        rings.append(f'<g class="mf-goal__spin mf-goal__spin--{ring % 2}">{dots}</g>')
    sats = c(34, -34, 4, TEAL) + c(-62, 40, 3.5, TEAL)
    return (f'<g transform="translate(200 100)">{"".join(rings)}<g class="mf-goal__spin mf-goal__spin--1">{sats}</g></g>'
            f'<circle cx="200" cy="100" r="13" fill="{LEMON}" class="mf-goal__pulse"/>')


def art_performance():
    field = "".join(c(x, 30 + row * 22 + math.sin(x / 50 + row * 0.6) * 8, 1.3, SAGE, 0.45)
                    for row in range(7) for x in range(12, 400, 13))
    path = "".join(c(40 + q * 320, 170 - (q ** 1.3) * 130, 2.5 + q * 6, LEMON, cls=f"mf-goal__step mf-goal__step--{k}")
                   for k, q in ((k, k / 8) for k in range(9)))
    return field + path


def art_commerce():
    lines = []
    for s in range(9):
        y0 = 20 + s * 20
        lines.append("".join(c(30 + t * 290, y0 + (100 - y0) * (t ** 1.6), 1.3, SAGE, 0.3 + t * 0.4) for t in (i / 20 for i in range(21))))
    buyers = "".join(c(330 + dx, 100 + dy, 4, TEAL, cls=f"mf-goal__buyer mf-goal__buyer--{i}")
                     for i, (dx, dy) in enumerate(((-22, 0), (0, -22), (0, 22), (-16, -16), (-16, 16))))
    return "".join(lines) + f'<circle cx="330" cy="100" r="15" fill="{LEMON}" class="mf-goal__pulse"/>' + buyers


CARDS = [
    {
        "key": "brand", "art": art_brand, "title": "I have brand goals",
        "text": "Full-funnel campaigns that build brand equity and deliver measurable results. We combine strategic media buying with high-impact creative to grow recall, reach and resonance across digital touchpoints.",
        "tags": ["Brand lift studies", "Ad recall lift", "Video ad sequencing"],
        "href": "https://www.majorform.co/our-work/oatside-digital-marketing-majorform-2026",
        "link": "See how we grew Oatside year on year",
    },
    {
        "key": "performance", "art": art_performance, "title": "I have performance goals",
        "text": "Fast, efficient and accountable growth. From creative testing to budget pacing and ROAS optimisation, we research market data and historical benchmarks, align with your targets, then scale what works.",
        "tags": ["Creative testing", "Budget pacing", "ROAS optimisation"],
        "href": "https://www.majorform.co/our-work/yogamovement-digital-marketing-majorform-2026",
        "link": "See how we cut Yoga Movement's CPA by 20%",
    },
    {
        "key": "commerce", "art": art_commerce, "title": "I have commerce goals",
        "text": "Profitable acquisition at scale for DTC and retail brands on TikTok, Shopee and Amazon, built on complete tagging across your biddable platforms and optimised for revenue and ROAS.",
        "tags": ["TikTok Shop", "Shopee", "Amazon"],
        "href": "https://www.majorform.co/our-work/blackmores-tiktok-livestreaming-majorform-2026",
        "link": "See Blackmores' Total Social Commerce strategy",
    },
]

STYLE = """<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500&display=swap">
<style>
  /* Goal card. Fonts: headings inherit your site's heading font; body text is Space Grotesk. */
  .mf-goal { --bg: #f4f6f8; --ink: #233551; --text: #3d4350; --rule: rgba(35, 53, 81, .18); --band: #04202c;
    height: 100%; display: grid; grid-template-rows: auto 1fr; border-radius: 18px; overflow: hidden; background: var(--bg);
    font-family: "Space Grotesk", system-ui, sans-serif; transition: transform .35s cubic-bezier(.2, .8, .2, 1), box-shadow .35s; }
  .mf-goal[data-theme="dark"] { --bg: #0a2b39; --ink: #ffffff; --text: rgba(243, 242, 247, .8); --rule: rgba(255, 255, 255, .22); }
  .mf-goal *, .mf-goal *::before, .mf-goal *::after { box-sizing: border-box; }
  .mf-goal:hover { transform: translateY(-4px); box-shadow: 0 18px 40px -24px rgba(4, 32, 44, .55); }
  .mf-goal__art { background: var(--band); line-height: 0; }
  .mf-goal__art svg { display: block; width: 100%; height: auto; }
  .mf-goal__body { padding: 22px 24px 24px; display: grid; gap: 12px; align-content: start; grid-template-rows: auto auto auto 1fr; }
  .mf-goal .mf-goal__title { margin: 0; font-size: clamp(22px, 2vw, 28px); line-height: 1.08; letter-spacing: -.03em; color: var(--ink); }
  .mf-goal .mf-goal__text { margin: 0; font-size: 15px; line-height: 1.45; color: var(--text); }
  .mf-goal__tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; padding: 0; list-style: none; }
  .mf-goal__tags li { margin: 0; list-style: none; font-size: 12.5px; line-height: 1.3; color: var(--ink); border: 1px solid var(--rule); border-radius: 999px; padding: 5px 11px; }
  .mf-goal__tags li::before, .mf-goal__tags li::marker { content: none; }
  .mf-goal .mf-goal__link { align-self: end; justify-self: start; margin-top: 6px; font-size: 14.5px; font-weight: 500; line-height: 1.3; color: var(--ink); text-decoration: none; border-bottom: 1px solid currentColor; padding-bottom: 2px; }
  .mf-goal .mf-goal__link:hover { opacity: .7; }
  .mf-goal .mf-goal__link:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; }

  /* Gentle CSS-only motion in the illustrations */
  .mf-goal__spin { transform-box: view-box; transform-origin: 0 0; animation: mf-goal-spin 60s linear infinite; }
  .mf-goal__spin--0 { animation-direction: reverse; animation-duration: 80s; }
  @keyframes mf-goal-spin { to { transform: rotate(360deg); } }
  .mf-goal__pulse { transform-box: fill-box; transform-origin: center; animation: mf-goal-pulse 2.4s ease-in-out infinite; }
  @keyframes mf-goal-pulse { 50% { transform: scale(1.18); } }
  .mf-goal__step { transform-box: fill-box; transform-origin: center; animation: mf-goal-step 4.5s ease-in-out infinite; }
  @keyframes mf-goal-step { 0%, 8% { transform: scale(.35); opacity: .35; } 22%, 75% { transform: scale(1); opacity: 1; } 100% { transform: scale(.35); opacity: .35; } }
  .mf-goal__buyer { transform-box: fill-box; transform-origin: center; animation: mf-goal-buy 3s ease-in-out infinite; }
  @keyframes mf-goal-buy { 0% { transform: translate(-60px, 0) scale(.4); opacity: 0; } 35%, 70% { transform: none; opacity: 1; } 100% { transform: scale(.4); opacity: 0; } }
  @media (prefers-reduced-motion: reduce) {
    .mf-goal, .mf-goal__spin, .mf-goal__pulse, .mf-goal__step, .mf-goal__buyer { animation: none; transition: none; }
    .mf-goal:hover { transform: none; }
  }
</style>
"""


def card_html(card):
    delays = ""
    if card["key"] == "performance":
        delays = "".join(f"  .mf-goal__step--{k} {{ animation-delay: {k * 0.18:.2f}s; }}\n" for k in range(9))
    if card["key"] == "commerce":
        delays = "".join(f"  .mf-goal__buyer--{k} {{ animation-delay: {k * 0.4:.1f}s; }}\n" for k in range(5))
    tags = "".join(f"<li>{t}</li>" for t in card["tags"])
    title = card["title"].replace("'", "&#39;")
    return f"""<!-- MajorForm performance page goal card: {card['title']}.
     Paste into its own Squarespace Code block, with Display Source turned off. No scripts, so the
     editor shows its true size. Equal heights for cards side by side come from the page code injection.
     data-theme="light" suits a white section; use "dark" on a dark section. -->
<article class="mf-goal mf-goal--{card['key']}" data-theme="light">
  <div class="mf-goal__art"><svg viewBox="0 0 400 200" role="presentation" aria-hidden="true" focusable="false">{card['art']()}</svg></div>
  <div class="mf-goal__body">
    <h3 class="mf-goal__title">{title}</h3>
    <p class="mf-goal__text">{card['text']}</p>
    <ul class="mf-goal__tags">{tags}</ul>
    <a class="mf-goal__link" href="{card['href']}">{card['link'].replace("'", "&#39;")}&nbsp;<span aria-hidden="true">→</span></a>
  </div>
</article>
{STYLE.replace('</style>', (delays + '</style>') if delays else '</style>')}"""
