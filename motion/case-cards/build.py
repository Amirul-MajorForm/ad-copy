"""Homepage case study cards ("Explore our work"): one Squarespace Code block per case study.

Run: python3 build.py   -> writes <key>-card.html for each case below.
Each card shows the products floating on a brand colour with short callouts popping up in turn, beside the story,
service pills and a link to the case study. Product images are embedded, so nothing needs uploading.
The only script is a short one that matches the headline to the site's H2; without it the headline uses a close fallback.
"""
import base64, os
from html import escape as e

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "..", "platform-pages", "assets")

CASES = [
    {"key": "oatside", "brand": "OATSIDE", "kicker": "OATSIDE · Meta and Shopee", "bg": "#f3d23c",
     "title": "Scaling across APAC with OATSIDE",
     "text": "As OATSIDE's digital marketing partner, we execute full funnel campaigns across APAC ranging from large scale product launches to e-commerce campaigns.",
     "tags": [("Performance marketing", "#ffefae"), ("Media consultancy", "#96d1aa"), ("Livestreaming", "#2fc2b6")],
     "url": "https://www.majorform.co/our-work/oatside-digital-marketing-majorform-2026",
     # base image, then layers placed in % of it; "stage" means the base is an empty canvas and the layers are the products
     "art": {"base": "oatside-barista-pack.webp", "alt": "OATSIDE Barista Blend oat milk", "width": "min(78%, 230px)", "ratio": None,
             "layers": [("oatside-sticker-blue.webp", 79.59, 15.05, 20.41, "wob", 0, 1), ("oatside-sticker-green.webp", 0, 34.8, 23.47, "wobr", -1.2, 1)]},
     "callouts": [("CPAS ads", -14, 8, "#04202c", "#ffffff"), ("Geo-targeting", 64, 58, "#007190", "#ffffff"), ("Shopee audiences", -10, 84, "#ffffff", "#233551")]},
    {"key": "blackmores", "brand": "Blackmores", "kicker": "Blackmores · TikTok", "bg": "#f8b6ba", "flip": True,
     "title": "Driving ROI on TikTok Shop with Blackmores",
     "text": "Inefficient spend and creative fatigue were wasting budget. We scaled creative through affiliate content and focused our ROI approach on key SKUs.",
     "tags": [("Performance marketing", "#f8b6ba"), ("Livestreaming", "#b7c2a9")],
     "url": "https://www.majorform.co/our-work/blackmores-tiktok-livestreaming-majorform-2026",
     "art": {"base": "blackmores-stage.png", "alt": "Blackmores Fish Oil 1000 and Omega Mini", "width": "min(100%, 400px)", "ratio": "7 / 5", "stage": True,
             "layers": [("blackmores-omega-mini.webp", 14, 26, 30, "bob2", -1.6, 1), ("blackmores-fish-oil.webp", 40, 3, 40, "bob", 0, 2)]},
     "callouts": [("GMV Max", 6, 20, "#dd4027", "#ffffff"), ("ROI optimisation", 58, 66, "#0093a5", "#ffffff"), ("Creative Scaling", 2, 82, "#ffffff", "#233551")]},
]


def src(name):
    kind = "image/png" if name.endswith(".png") else "image/webp"
    return f"data:{kind};base64," + base64.b64encode(open(os.path.join(ASSETS, name), "rb").read()).decode()


STYLE = """<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,500;9..40,600&family=Space+Grotesk:wght@400;500&display=swap">
<style>
  .mf-case { --deep: #04202c; --line: rgba(255, 255, 255, .16); container-type: inline-size; font-family: "Space Grotesk", system-ui, sans-serif; color: rgba(243, 242, 247, .8); }
  .mf-case * { box-sizing: border-box; }
  .mf-case__card { display: grid; grid-template-columns: minmax(0, 1fr); border-radius: 22px; overflow: hidden; background: rgba(255, 255, 255, .05);
    transition: transform .4s cubic-bezier(.2, .8, .2, 1), box-shadow .4s; }
  .mf-case__card:hover { transform: translateY(-4px); box-shadow: 0 24px 50px -28px rgba(0, 0, 0, .8); }
  @container (min-width: 760px) { .mf-case__card { grid-template-columns: minmax(0, .78fr) minmax(0, 1.22fr); } .mf-case--flip .mf-case__card { grid-template-columns: minmax(0, 1.22fr) minmax(0, .78fr); } .mf-case--flip .mf-case__stage { order: 2; } }
  /* product stage: the products float on the brand colour, callouts pop up in turn */
  .mf-case__stage { background: var(--bg); display: grid; place-items: center; min-height: 260px; padding: 26px 24px; }
  .mf-case__art { position: relative; line-height: 0; }
  .mf-case__base { display: block; width: 100%; height: auto; animation: mf-case-float 5s ease-in-out infinite alternate; }
  .mf-case__art--stage .mf-case__base { opacity: 0; animation: none; }
  .mf-case__layer { position: absolute; height: auto; transition: scale .35s cubic-bezier(.2, .8, .2, 1); }
  .mf-case__card:hover .mf-case__layer { scale: 1.1; }
  .mf-case__layer--wob { animation: mf-case-wob 3.6s ease-in-out infinite alternate; }
  .mf-case__layer--wobr { animation: mf-case-wobr 4.2s ease-in-out infinite alternate; }
  .mf-case__layer--bob { animation: mf-case-bob 4.4s ease-in-out infinite alternate; }
  .mf-case__layer--bob2 { animation: mf-case-bob2 5s ease-in-out infinite alternate; }
  .mf-case__co { position: absolute; z-index: 3; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; line-height: 1; font-size: 12px; font-weight: 500;
    padding: 7px 12px; border-radius: 999px; background: var(--cb); color: var(--cf); box-shadow: 0 8px 20px -10px rgba(4, 32, 44, .55);
    opacity: 0; animation: mf-case-pop 7.8s cubic-bezier(.2, .8, .2, 1) infinite both; }
  .mf-case__co::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; opacity: .75; }
  /* story */
  .mf-case__body { padding: clamp(20px, 2.6cqi, 30px); display: grid; gap: 10px; align-content: center; }
  .mf-case__kick { margin: 0; font-size: 11px; font-weight: 500; letter-spacing: .16em; text-transform: uppercase; color: rgba(243, 242, 247, .6); }
  .mf-case .mf-case__title { margin: 0; color: #ffffff; text-transform: none; text-wrap: balance; line-height: 1.08;
    font-family: var(--mf-h2-font, "DM Sans", "Helvetica Neue", Arial, sans-serif); font-weight: var(--mf-h2-weight, 600);
    font-size: var(--mf-h2, clamp(28px, 3.2vw, 40px)); letter-spacing: var(--mf-h2-ls, -.03em); }
  .mf-case__text { margin: 0; font-size: 15px; line-height: 1.4; max-width: 72ch; }
  .mf-case__tags { display: flex; flex-wrap: wrap; gap: 8px; }
  .mf-case__tag { position: relative; overflow: hidden; isolation: isolate; padding: 5px 12px; border-radius: 999px; border: 1px solid rgba(255, 255, 255, .35); color: #ffffff;
    font-size: 13px; font-weight: 500; line-height: 1.3; cursor: default; transition: color .3s, border-color .3s; }
  .mf-case__tag::after { content: ""; position: absolute; inset: 0; z-index: -1; background: var(--c); transform: translateY(102%); transition: transform .4s cubic-bezier(.2, .8, .2, 1); }
  .mf-case__tag:hover { color: var(--deep); border-color: var(--c); }
  .mf-case__tag:hover::after { transform: none; }
  .mf-case .mf-case__more { justify-self: start; margin-top: 4px; display: inline-flex; align-items: center; gap: 10px; padding: 10px 18px; border-radius: 999px; background: #ffffff; color: var(--deep);
    font-size: 15px; font-weight: 500; text-decoration: none; transition: gap .3s; }
  .mf-case .mf-case__more:hover, .mf-case .mf-case__more:focus-visible { gap: 16px; }
  .mf-case .mf-case__more:focus-visible { outline: 2px solid #ffffff; outline-offset: 3px; }
  @keyframes mf-case-float { from { transform: translateY(4px); } to { transform: translateY(-6px); } }
  @keyframes mf-case-wob { from { transform: rotate(-9deg) translateY(2px); } to { transform: rotate(7deg) translateY(-6px); } }
  @keyframes mf-case-wobr { from { transform: rotate(8deg) translateY(-3px); } to { transform: rotate(-7deg) translateY(5px); } }
  @keyframes mf-case-bob { from { transform: translateY(6px) rotate(-2deg); } to { transform: translateY(-8px) rotate(2deg); } }
  @keyframes mf-case-bob2 { from { transform: translateY(-6px) rotate(2deg); } to { transform: translateY(7px) rotate(-1.5deg); } }
  @keyframes mf-case-pop { 0% { opacity: 0; transform: translateY(8px) scale(.6); } 7% { opacity: 1; transform: translateY(-2px) scale(1.06); } 10% { transform: none; }
    62% { opacity: 1; transform: none; } 70%, 100% { opacity: 0; transform: translateY(-6px) scale(.94); } }
  @media (prefers-reduced-motion: reduce) {
    .mf-case__card, .mf-case__layer, .mf-case__tag, .mf-case__tag::after, .mf-case__more { transition: none; }
    .mf-case__card:hover { transform: none; }
    .mf-case__base, .mf-case__layer { animation: none; } .mf-case__co { animation: none; opacity: 1; }
  }
</style>"""

# Match the headline to the site's H2: measure a hidden H2 styled like a Squarespace text block (runs once per page)
SCRIPT = """<script>
(function () {
  if (window.mfCaseH2) return; window.mfCaseH2 = true;
  function measure() {
    var host = document.querySelector(".sqs-block-content"); if (!host) return;
    var probe = document.createElement("div"); probe.className = "sqs-html-content"; probe.style.cssText = "position:absolute;visibility:hidden;left:-9999px";
    probe.innerHTML = "<h2>Ag</h2>"; host.appendChild(probe);
    var cs = getComputedStyle(probe.firstChild), root = document.documentElement.style;
    root.setProperty("--mf-h2", cs.fontSize); root.setProperty("--mf-h2-font", cs.fontFamily);
    root.setProperty("--mf-h2-weight", cs.fontWeight); root.setProperty("--mf-h2-ls", cs.letterSpacing === "normal" ? "0" : cs.letterSpacing);
    probe.remove();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", measure); else measure();
  window.addEventListener("resize", measure);
})();
</script>"""


def card(c):
    a = c["art"]
    layers = "".join(f'<img class="mf-case__layer mf-case__layer--{m}" src="{src(f)}" alt="" style="left:{l}%;top:{t}%;width:{w}%;animation-delay:{d}s;z-index:{z}">'
                     for f, l, t, w, m, d, z in a["layers"])
    cos = "".join(f'<span class="mf-case__co" aria-hidden="true" style="left:{l}%;top:{t}%;--cb:{b};--cf:{fg};animation-delay:{i * 1.3}s">{e(x)}</span>'
                  for i, (x, l, t, b, fg) in enumerate(c["callouts"]))
    art_style = f'width:{a["width"]}' + (f';aspect-ratio:{a["ratio"]}' if a.get("ratio") else "")
    tags = "".join(f'<span class="mf-case__tag" style="--c:{col}">{e(t)}</span>' for t, col in c["tags"])
    return f"""<!-- MajorForm homepage case study card: {c["brand"]}.
     Paste into its own Squarespace Code block under your "Explore our work" heading, with Display Source turned off.
     Images are embedded, so nothing needs uploading. Add one block per case study; cards alternate sides. -->
{STYLE}
<article class="mf-case{" mf-case--flip" if c.get("flip") else ""}">
  <div class="mf-case__card">
    <div class="mf-case__stage" style="--bg:{c["bg"]}"><div class="mf-case__art{" mf-case__art--stage" if a.get("stage") else ""}" style="{art_style}">
      <img class="mf-case__base" src="{src(a["base"])}" alt="{e(a["alt"])}" loading="lazy">{layers}{cos}</div></div>
    <div class="mf-case__body">
      <p class="mf-case__kick">{e(c["kicker"])}</p>
      <h3 class="mf-case__title">{e(c["title"])}</h3>
      <p class="mf-case__text">{e(c["text"])}</p>
      <div class="mf-case__tags">{tags}</div>
      <a class="mf-case__more" href="{e(c["url"])}">Read the case study <span aria-hidden="true">&rarr;</span></a>
    </div>
  </div>
</article>
{SCRIPT}
"""


for c in CASES:
    html = card(c)
    open(os.path.join(HERE, f'{c["key"]}-card.html'), "w").write(html)
    print(f'{c["key"]}-card.html', round(len(html.encode()) / 1024), "KB")
