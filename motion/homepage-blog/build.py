"""Homepage blog section (option D): the existing Squarespace Summary block, restyled with CSS, plus category filter pills.

No scripts anywhere, and new posts still appear by themselves.
  filter-block.html   a Code block placed just above the Summary block: the category pills and "Read all articles"
  header.html         CSS for the homepage's Page Header Code Injection: restyles the Summary block, filters it, and turns
                      each post's tags into audience callouts that pop out on hover
  preview.html        a working copy using the same markup Squarespace prints, for review only
Squarespace settings the CSS relies on (Summary block > Design and Display):
  Design: Grid (or List). Items: 12 or more. Primary metadata: Categories. Secondary metadata: Tags. Metadata position: Above title.
"""
import html, os
HERE = os.path.dirname(os.path.abspath(__file__))
BLOCK = "#block-yui_3_17_2_1_1755306803804_4200"   # the homepage blog Summary block
e = html.escape

# category name as set in Squarespace -> pill label (the filter matches the start of the category name in its link)
CATS = [("all", "All", None), ("perf", "Performance marketing", "Performance"), ("brand", "Brand & content", "Brand"),
        ("comm", "Social commerce", "Social"), ("ai", "AI & trends", "AI")]
WADA = ["#96d1aa", "#ffefae", "#f8b6ba", "#78cdd0"]   # callout pill colours, in turn

FILTER = f"""<!-- MajorForm homepage blog: category pills and "Read all articles". Paste into a Code block placed directly above the blog
     Summary block, with Display Source turned off. No scripts: the pills are radio buttons and the filtering is CSS in the page header. -->
<div class="mf-bf">
  <div class="mf-bf__pills" role="group" aria-label="Show articles about">
    {"".join(f'<input type="radio" name="mf-bf" id="mf-bf-{k}"{" checked" if k == "all" else ""}><label for="mf-bf-{k}">{e(n)}</label>' for k, n, _ in CATS)}
  </div>
  <a class="mf-bf__all" href="/blog-1">Read all articles <span aria-hidden="true">&rarr;</span></a>
</div>
<style>
  .mf-bf {{ display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px; font-family: "Space Grotesk", system-ui, sans-serif; }}
  .mf-bf__pills {{ display: flex; flex-wrap: wrap; gap: 8px; }}
  .mf-bf input {{ position: absolute; opacity: 0; pointer-events: none; }}
  .mf-bf label {{ cursor: pointer; border: 1px solid rgba(35, 53, 81, .2); border-radius: 999px; padding: 8px 16px; font-size: 14px; font-weight: 500; color: #233551;
    transition: background .25s, color .25s, border-color .25s; }}
  .mf-bf label:hover {{ border-color: #233551; }}
  .mf-bf input:checked + label {{ background: #233551; border-color: #233551; color: #fff; }}
  .mf-bf input:focus-visible + label, .mf-bf__all:focus-visible {{ outline: 2px solid #233551; outline-offset: 2px; }}
  .mf-bf__all {{ display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 999px; background: #04202c; color: #fff !important;
    font-size: 14px; font-weight: 500; text-decoration: none !important; transition: background .25s, color .25s; }}
  .mf-bf__all:hover {{ background: #96d1aa; color: #04202c !important; }}
  .mf-bf__all span {{ display: inline-block; transition: transform .25s; }}
  .mf-bf__all:hover span {{ transform: translateX(4px); }}
</style>
"""

S = BLOCK
filters = "\n".join(
    f'  body:has(#mf-bf-{k}:checked) {S} .summary-item:not(:has(.summary-metadata-item--cats a[href*="category={m}"])) {{ display: none !important; }}'
    for k, _, m in CATS if m)
colours = "\n".join(f"  {S} .summary-metadata-item--tags a:nth-of-type({i + 1}) {{ --c: {c}; transition-delay: {i * .07:.2f}s; }}" for i, c in enumerate(WADA))
HEADER = f"""<!-- MajorForm homepage blog styles. Paste into the homepage's Page Settings > Advanced > Page Header Code Injection.
     Restyles the blog Summary block, filters it by the category pills above it, and pops each post's tags out as audience callouts.
     Summary block settings: Design Grid, 12+ items, Primary metadata Categories, Secondary metadata Tags, metadata Above title. -->
<style>
  /* layout: a row of cards that scrolls sideways when there are more than three */
  {S} .summary-block-header, {S} .summary-read-more-link, {S} .summary-excerpt {{ display: none !important; }}
  {S} .summary-item-list {{ display: grid !important; grid-auto-flow: column; grid-auto-columns: calc((100% - 48px) / 3); gap: 24px;
    overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 8px; height: auto !important; transform: none !important; scrollbar-width: thin; }}
  @media (max-width: 767px) {{ {S} .summary-item-list {{ grid-auto-columns: 82%; gap: 16px; }} }}
  {S} .summary-item {{ position: relative !important; left: auto !important; top: auto !important; width: auto !important; margin: 0 !important;
    float: none !important; scroll-snap-align: start; text-align: left; display: flex !important; flex-direction: column; }}
  /* image: rounded, a gentle zoom on hover */
  {S} .summary-thumbnail-outer-container {{ order: 0; }}
  {S} .summary-thumbnail-container {{ display: block; position: relative; aspect-ratio: 4 / 3; border-radius: 16px; overflow: hidden; }}
  {S} .summary-thumbnail {{ position: absolute !important; inset: 0; padding: 0 !important; height: 100% !important; }}
  {S} .summary-thumbnail-image {{ position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; object-fit: cover;
    transition: transform .6s cubic-bezier(.2, .8, .2, 1); }}
  {S} .summary-item:hover .summary-thumbnail-image {{ transform: scale(1.05); }}
  /* text: category above a smaller, left-aligned title, then the link */
  {S} .summary-content {{ padding: 14px 2px 0 !important; text-align: left; display: flex; flex-direction: column; gap: 6px; flex: 1; }}
  {S} .summary-metadata-container--above-title {{ order: 0; }}
  {S} .summary-title {{ order: 1; margin: 0 !important; }}
  {S} .summary-title-link {{ font-size: 19px !important; line-height: 1.3 !important; font-weight: 500; letter-spacing: -.01em; color: #233551 !important;
    text-decoration: none !important; background: linear-gradient(currentColor 0 0) 0 100% / 0 1px no-repeat; transition: background-size .35s; }}
  {S} .summary-item:hover .summary-title-link {{ background-size: 100% 1px; }}
  {S} .summary-metadata-item--cats {{ font-size: 11px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; }}
  {S} .summary-metadata-item--cats a {{ color: #00978d !important; text-decoration: none !important; }}
  {S} .summary-content::after {{ content: "Read the article \\2192"; order: 3; margin-top: auto; padding-top: 6px; font-size: 14px; font-weight: 500; color: #233551; }}
  /* audience callouts: the post's tags, hidden until the card is hovered, then they pop out over the image one after another */
  {S} .summary-metadata-item--tags {{ position: absolute; left: 12px; right: 12px; top: 12px; z-index: 2; display: flex; flex-wrap: wrap; gap: 6px;
    font-size: 0; pointer-events: none; }}
  {S} .summary-metadata-item--tags a {{ font-size: 12px; font-weight: 500; line-height: 1; padding: 7px 11px; border-radius: 999px; background: var(--c, #96d1aa);
    color: #04202c !important; text-decoration: none !important; box-shadow: 0 8px 18px -10px rgba(4, 32, 44, .55);
    opacity: 0; transform: translateY(6px) scale(.85); transition: opacity .25s, transform .35s cubic-bezier(.2, .9, .3, 1.3); }}
  {S} .summary-item:hover .summary-metadata-item--tags a, {S} .summary-item:focus-within .summary-metadata-item--tags a {{ opacity: 1; transform: none; }}
{colours}
  /* phones and tablets have no hover: the tags show as small chips under the title instead */
  @media (hover: none) {{
    {S} .summary-metadata-container--above-title, {S} .summary-metadata--secondary {{ display: contents; }}
    {S} .summary-metadata-item--tags {{ position: static; order: 2; font-size: 0; }}
    {S} .summary-metadata-item--tags a {{ opacity: 1; transform: none; box-shadow: none; font-size: 11px; padding: 5px 9px; }}
  }}
  {S} .summary-metadata--secondary:empty, {S} .summary-metadata-container--below-title {{ display: none; }}
  /* category filter, driven by the pills in the code block above */
{filters}
  @media (prefers-reduced-motion: reduce) {{ {S} * {{ transition: none !important; }} }}
</style>
"""

# preview: the same markup Squarespace prints, with suggested categories and audience tags
POSTS = [
    ("How Much Do Facebook & Instagram Ads Cost in Singapore? (2026)", "Performance Marketing", ["Performance marketers", "Business owners"], "linear-gradient(135deg,#f7a8d8,#f6c08a)"),
    ("What a Meta Ads Agency Does in Your First 90 Days", "Performance Marketing", ["Business owners", "Marketing managers"], "linear-gradient(135deg,#bcd3ff,#e5eeff)"),
    ("ChatGPT Ads in Singapore: How They Work and Which Brands Should Test Them", "AI & Trends", ["Performance marketers", "Brand managers"], "linear-gradient(135deg,#9fcfc4,#7dbfb3)"),
    ("TikTok Live Selling & the Rise of Social Commerce (2026)", "Social Commerce", ["E-commerce teams", "Brand managers"], "linear-gradient(135deg,#ffb3c7,#ff7aa2)"),
    ("Performance Marketing vs. Brand Marketing: How to Choose (and Combine)", "Brand & Content", ["Brand managers", "Performance marketers", "Founders"], "linear-gradient(135deg,#ffe9a8,#f7c873)"),
    ("Social Media Content Mix Frameworks: Why the Numbers Don't Tell the Whole Story", "Brand & Content", ["Social media managers", "Brand managers"], "linear-gradient(135deg,#d7c8ff,#a998f0)"),
]
def slug(s): return s.replace(" & ", "+%26+").replace(" ", "+")
items = ""
for t, cat, tags, bg in POSTS:
    tag_links = ", ".join(f'<a href="/blog-1?tag={slug(x)}">{e(x)}</a>' for x in tags)
    items += f"""
<div class="summary-item positioned summary-item-record-type-text sqs-gallery-design-carousel-slide summary-item-has-thumbnail">
  <div class="summary-thumbnail-outer-container"><a href="#" class="summary-thumbnail-container sqs-gallery-image-container">
    <div class="summary-thumbnail img-wrapper"><div class="summary-thumbnail-image" style="background:{bg}"></div></div></a></div>
  <div class="summary-content sqs-gallery-meta-container">
    <div class="summary-metadata-container summary-metadata-container--above-title">
      <div class="summary-metadata summary-metadata--primary"><span class="summary-metadata-item summary-metadata-item--cats"><a href="/blog-1?category={slug(cat)}">{e(cat)}</a></span></div>
      <div class="summary-metadata summary-metadata--secondary"><span class="summary-metadata-item summary-metadata-item--tags">{tag_links}</span></div>
    </div>
    <div class="summary-title"><a href="#" class="summary-title-link">{e(t)}</a></div>
    <div class="summary-metadata-container summary-metadata-container--below-title"></div>
  </div>
</div>"""
summary = (f'<div class="sqs-block summary-v2-block" id="{BLOCK[1:]}"><div class="sqs-block-content"><div class="summary-block-wrapper summary-block-setting-design-grid">'
           f'<div class="summary-item-list-container"><header class="summary-block-header"><span class="summary-collection-title">Blog</span></header>'
           f'<div class="summary-item-list">{items}</div></div></div></div></div>')

if __name__ == "__main__":
    open(os.path.join(HERE, "filter-block.html"), "w").write(FILTER)
    open(os.path.join(HERE, "header.html"), "w").write(HEADER)
    open(os.path.join(HERE, "preview.html"), "w").write(
        "<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><title>Homepage Blog</title>"
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,600&family=Space+Grotesk:wght@400;500&display=swap">'
        + HEADER + "<body style='margin:0;background:#fff;font-family:Space Grotesk,system-ui,sans-serif'>"
        "<main style='max-width:1180px;margin:0 auto;padding:48px clamp(16px,4vw,40px) 64px;display:grid;grid-template-columns:minmax(0,1fr);gap:22px'>"
        "<div style='text-align:center'><h2 style='margin:0;font:600 clamp(30px,4vw,44px)/1.05 DM Sans,sans-serif;letter-spacing:-.035em;color:#233551'>Playbook for Growth Makers</h2>"
        "<p style='margin:10px 0 0;color:#3d4350'>Stories, strategies and tools from our in-market playbook for the modern marketer</p></div>"
        + FILTER + summary + "</main>")
    print("ok")
