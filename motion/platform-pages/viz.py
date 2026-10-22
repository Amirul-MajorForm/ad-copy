"""Small SVG illustrations and their scroll-in motion for the platform page blocks.

Each illustration's resting state is the "after" (the fix), so the blocks read correctly with no script,
in the editor, and with reduced motion. The page script (MOTION_JS) adds .mfp-pre to blocks that start
below the fold, then .mfp-in when they scroll into view, so each one acts out before and after once.
"""
import math
import random

FIELD, ACC, RING, LINE = "#96d1aa", "#ffefae", "#2fc2b6", "rgba(255,255,255,.35)"
EASE = "cubic-bezier(.2, .8, .2, 1)"


def _r(v):
    return f"{v:.1f}".rstrip("0").rstrip(".")


# Slot 2: tightly fenced audiences (before) vs. a broad audience that creative reaches (now)
def audience_before():
    rnd = random.Random(4)
    fences, dots = [], []
    for f, x0 in enumerate((8, 104, 200)):
        fences.append(f'<rect class="mfp__fence" x="{x0}" y="10" width="88" height="96" rx="12" pathLength="1" style="--i:{f}"/>')
        for _ in range(6):
            dots.append(f'<circle cx="{_r(x0 + 16 + rnd.random() * 56)}" cy="{_r(24 + rnd.random() * 68)}" r="3"/>')
    return ('<svg class="mfp__viz mfp__viz--before" viewBox="0 0 296 116" role="presentation" aria-hidden="true" focusable="false">'
            f'<g fill="{FIELD}" opacity=".55">{"".join(dots)}</g>{"".join(fences)}</svg>')


def audience_now():
    # a broad audience on a loose grid; each creative fans out to a different part of it
    rnd = random.Random(11)
    cols, rows = 6, 5
    grid = {(r, c): (78 + c * 40 + (rnd.random() - .5) * 16, 14 + r * 22 + (rnd.random() - .5) * 10) for r in range(rows) for c in range(cols)}
    creatives = [(16, 14 + i * 22, (ACC, RING, FIELD)[i % 3]) for i in range(5)]
    dots, links = [], []
    for j, ((r, c), (px, py)) in enumerate(sorted(grid.items())):
        dx, dy = (180 - px) * .8, (58 - py) * .8   # start bunched in the middle, then spread out
        dots.append(f'<circle cx="{_r(px)}" cy="{_r(py)}" r="3" style="--dx:{_r(dx)}px;--dy:{_r(dy)}px;--i:{j}"/>')
    k = 0
    for i, (cx, cy, col) in enumerate(creatives):
        for c in (i % 2, 2 + i % 2, 4 + i % 2):
            r = max(0, min(rows - 1, i + (c // 2) - 1))
            px, py = grid[(r, c)]
            links.append(f'<line x1="{cx + 6}" y1="{cy}" x2="{_r(px)}" y2="{_r(py)}" stroke="{col}" pathLength="1" style="--i:{k}"/>')
            k += 1
    marks = "".join(f'<rect class="mfp__creative" x="{cx - 6}" y="{cy - 6}" width="12" height="12" rx="3" fill="{col}" style="--i:{i}"/>' for i, (cx, cy, col) in enumerate(creatives))
    return ('<svg class="mfp__viz mfp__viz--now" viewBox="0 0 296 116" role="presentation" aria-hidden="true" focusable="false">'
            f'<g class="mfp__links" stroke-width="1" opacity=".6">{"".join(links)}</g>'
            f'<g class="mfp__people" fill="{FIELD}">{"".join(dots)}</g>{marks}</svg>')


# Slot 3: one small chart per problem, resting on the fixed state
def fatigue():
    # performance decays, then jumps back with each fresh creative
    pts, x, refresh = [], 6, []
    for seg in range(4):
        top = 18 + seg * 1.5
        for t in range(6):
            pts.append((x + t * 7, top + (t / 5) ** 1.6 * 26))
        x += 35
        if seg < 3:
            refresh.append((x - 0.5, 18 + (seg + 1) * 1.5))
    d = "M" + " L".join(f"{_r(a)},{_r(b)}" for a, b in pts)
    dots = "".join(f'<circle class="mfp__pop" cx="{_r(a)}" cy="{_r(b)}" r="4" fill="{ACC}" style="--i:{i}"/>' for i, (a, b) in enumerate(refresh))
    return ('<svg class="mfp__viz mfp__viz--fatigue" viewBox="0 0 150 64" role="presentation" aria-hidden="true" focusable="false">'
            f'<line x1="4" y1="58" x2="146" y2="58" stroke="{LINE}"/>'
            f'<path class="mfp__draw" d="{d}" fill="none" stroke="{FIELD}" stroke-width="2" stroke-linejoin="round" pathLength="1"/>{dots}</svg>')


def structure():
    # nine thin, scattered ad sets become three campaigns with room to learn
    rects = []
    for i in range(9):
        col, row = i // 3, i % 3
        x, y = 22 + col * 40, 8 + row * 16
        sx, sy = 6 + (i % 3) * 46 + (i // 3) * 6, 6 + (i // 3) * 19
        rects.append(f'<rect x="{x}" y="{y}" width="28" height="14" rx="3" fill="{(FIELD, RING, ACC)[col]}" '
                     f'style="--dx:{sx - x}px;--dy:{sy - y}px;--i:{i}"/>')
    return ('<svg class="mfp__viz mfp__viz--structure" viewBox="0 0 150 64" role="presentation" aria-hidden="true" focusable="false">'
            f'<g class="mfp__sets">{"".join(rects)}</g></svg>')


def measurement():
    # reported and actual numbers start far apart, then match
    return ('<svg class="mfp__viz mfp__viz--measure" viewBox="0 0 150 64" role="presentation" aria-hidden="true" focusable="false">'
            f'<line x1="4" y1="50" x2="146" y2="50" stroke="{LINE}"/>'
            f'<rect class="mfp__bar mfp__bar--meta" x="34" y="14" width="26" height="36" rx="3" fill="{FIELD}"/>'
            f'<rect class="mfp__bar mfp__bar--sales" x="70" y="14" width="26" height="36" rx="3" fill="{RING}"/>'
            f'<path class="mfp__tick" d="M108,30 l6,6 l12,-13" fill="none" stroke="{ACC}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/>'
            '<text x="47" y="61" text-anchor="middle">Meta</text><text x="83" y="61" text-anchor="middle">Sales</text></svg>')


PROBLEM_VIZ = {"fatigue": fatigue, "structure": structure, "measurement": measurement}

# Dark variant for blocks placed on the site's navy sections
DARK = """
  .mfp[data-theme="dark"] { --ink: #ffffff; --text: rgba(243, 242, 247, .8); --muted: rgba(243, 242, 247, .6); --rule: rgba(255, 255, 255, .16);
    --tint: rgba(255, 255, 255, .06); background: var(--mfp-bg, #253551); color: var(--text); }
  .mfp[data-theme="dark"] .mfp__lede { color: rgba(243, 242, 247, .86); }
"""

CSS = {
    "shift": f"""
  .mfp--shift .mfp__viz {{ display: block; width: 100%; max-width: 360px; height: auto; margin: 2px 0 14px; }}
  .mfp--shift .mfp__fence {{ fill: none; stroke: {LINE}; stroke-width: 1.2; stroke-dasharray: 1; stroke-dashoffset: 0; }}
  .mfp--shift .mfp__people circle, .mfp--shift .mfp__creative {{ transform-box: fill-box; transform-origin: center; }}
  .mfp--shift .mfp__links line {{ stroke-dasharray: 1; stroke-dashoffset: 0; }}
  .mfp--shift .mfp__col li span {{ background: linear-gradient(currentColor, currentColor) 0 55% / 100% 1px no-repeat; }}
  .mfp--shift .mfp__col--now li span {{ background: none; }}
  .mfp--shift .mfp__col:not(.mfp__col--now) li {{ opacity: .72; }}
  /* before scrolling in */
  .mfp-pre.mfp--shift .mfp__fence {{ stroke-dashoffset: 1; }}
  .mfp-pre.mfp--shift .mfp__col:not(.mfp__col--now) li span {{ background-size: 0% 1px; }}
  .mfp-pre.mfp--shift .mfp__col:not(.mfp__col--now) li {{ opacity: 1; }}
  .mfp-pre.mfp--shift .mfp__people circle {{ transform: translate(var(--dx), var(--dy)) scale(.6); opacity: .3; }}
  .mfp-pre.mfp--shift .mfp__creative {{ transform: scale(0); }}
  .mfp-pre.mfp--shift .mfp__links line {{ stroke-dashoffset: 1; }}
  .mfp-pre.mfp--shift .mfp__col--now li {{ opacity: 0; transform: translateY(8px); }}
  /* the sequence: fences draw, old ways get struck through, then the audience opens up and creative reaches it */
  .mfp-in.mfp--shift .mfp__fence {{ transition: stroke-dashoffset .9s {EASE} calc(var(--i) * .12s); }}
  .mfp-in.mfp--shift .mfp__col:not(.mfp__col--now) li span {{ transition: background-size .5s ease 1.1s; }}
  .mfp-in.mfp--shift .mfp__col:not(.mfp__col--now) li:nth-child(2) span {{ transition-delay: 1.3s; }}
  .mfp-in.mfp--shift .mfp__col:not(.mfp__col--now) li:nth-child(3) span {{ transition-delay: 1.5s; }}
  .mfp-in.mfp--shift .mfp__col:not(.mfp__col--now) li {{ transition: opacity .5s ease 1.6s; }}
  .mfp-in.mfp--shift .mfp__people circle {{ transition: transform 1.1s {EASE} calc(1.6s + var(--i) * 25ms), opacity .8s ease calc(1.6s + var(--i) * 25ms); }}
  .mfp-in.mfp--shift .mfp__creative {{ transition: transform .5s {EASE} calc(2.2s + var(--i) * .1s); }}
  .mfp-in.mfp--shift .mfp__links line {{ transition: stroke-dashoffset .6s ease calc(2.5s + var(--i) * 40ms); }}
  .mfp-in.mfp--shift .mfp__col--now li {{ transition: opacity .5s ease 2.4s, transform .5s {EASE} 2.4s; }}
  .mfp-in.mfp--shift .mfp__col--now li:nth-child(2) {{ transition-delay: 2.6s; }}
  .mfp-in.mfp--shift .mfp__col--now li:nth-child(3) {{ transition-delay: 2.8s; }}
""",
    "problems": f"""
  .mfp--problems .mfp__fix {{ display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; align-items: center; }}
  @container (min-width: 520px) {{ .mfp--problems .mfp__fix {{ grid-template-columns: minmax(0, 1fr) 150px; }} }}
  .mfp--problems .mfp__viz {{ display: block; width: 100%; max-width: 150px; height: auto; }}
  .mfp--problems .mfp__viz text {{ font: 500 7.5px "Space Grotesk", system-ui, sans-serif; fill: rgba(243, 242, 247, .6); }}
  .mfp--problems .mfp__draw, .mfp--problems .mfp__tick {{ stroke-dasharray: 1; stroke-dashoffset: 0; }}
  .mfp--problems .mfp__pop, .mfp--problems .mfp__sets rect, .mfp--problems .mfp__bar {{ transform-box: fill-box; transform-origin: center bottom; }}
  .mfp--problems .mfp__pop {{ transform-origin: center; }}
  .mfp-pre.mfp--problems .mfp__pair {{ opacity: 0; transform: translateY(16px); }}
  .mfp-pre.mfp--problems .mfp__draw, .mfp-pre.mfp--problems .mfp__tick {{ stroke-dashoffset: 1; }}
  .mfp-pre.mfp--problems .mfp__pop {{ transform: scale(0); }}
  .mfp-pre.mfp--problems .mfp__sets rect {{ transform: translate(var(--dx), var(--dy)) scale(.55); opacity: .5; }}
  .mfp-pre.mfp--problems .mfp__bar--meta {{ transform: scaleY(1.35); }}
  .mfp-pre.mfp--problems .mfp__bar--sales {{ transform: scaleY(.45); }}
  .mfp-in.mfp--problems .mfp__pair {{ transition: opacity .6s ease calc(var(--p) * .35s), transform .7s {EASE} calc(var(--p) * .35s); }}
  .mfp-in.mfp--problems .mfp__draw {{ transition: stroke-dashoffset 1.6s ease calc(.4s + var(--p) * .35s); }}
  .mfp-in.mfp--problems .mfp__pop {{ transition: transform .4s {EASE} calc(.9s + var(--i) * .35s); }}
  .mfp-in.mfp--problems .mfp__sets rect {{ transition: transform 1s {EASE} calc(1.3s + var(--i) * 50ms), opacity .8s ease calc(1.3s + var(--i) * 50ms); }}
  .mfp-in.mfp--problems .mfp__bar {{ transition: transform 1.1s {EASE} 1.9s; }}
  .mfp-in.mfp--problems .mfp__tick {{ transition: stroke-dashoffset .5s ease 2.9s; }}
""",
}

# Page Header Code Injection script: plays each animated block once as it scrolls into view.
MOTION_JS = """<script>
document.addEventListener("DOMContentLoaded", function () {
  if ((window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) || !window.IntersectionObserver) return;
  document.querySelectorAll(".mfp[data-anim]").forEach(function (el) {
    if (el.getBoundingClientRect().top < window.innerHeight * 0.8) return; // already on screen: leave at rest
    el.classList.add("mfp-pre");
    var io = new IntersectionObserver(function (entries) {
      if (!entries[entries.length - 1].isIntersecting) return;
      io.disconnect();
      el.classList.add("mfp-in");
      requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.remove("mfp-pre"); }); });
    }, { threshold: 0.3 });
    io.observe(el);
  });
});
</script>"""
