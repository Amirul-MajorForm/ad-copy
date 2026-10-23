"""Platform page template: renders one platform sheet (e.g. meta.py) into Squarespace code blocks.

Ten slots, each its own script-free code block with its own styles, so the editor shows true heights:
  1 hero, 2 shift, 3 problems, 4 work, 5 types, 6 results, 7 process, 8 fit, 9 faq, 10 related
plus schema.html for the page header (Service, BreadcrumbList, FAQPage, built from the same text).

Any value left as None in a sheet is not published: the item is dropped from the live block and listed
by build.py as missing. preview=True shows those gaps as orange placeholders instead, for review only.
"""
import json
import re
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
  .mfp .mfp__h2 { color: var(--ink); font-family: var(--mf-h2-font, "DM Sans", "Helvetica Neue", Arial, sans-serif); font-weight: var(--mf-h2-weight, 600);
    font-size: var(--mf-h2, clamp(28px, 3.2vw, 40px)); line-height: 1.08; letter-spacing: var(--mf-h2-ls, -.03em); text-transform: none; text-wrap: balance; }
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
  .mfp--hero .mfp__h1 { margin-top: 14px; color: var(--ink); font-size: clamp(38px, 6vw, 68px); line-height: .9; letter-spacing: -.045em; text-transform: none; text-wrap: balance; }
  .mfp--hero .mfp__thesis { margin-top: 14px; color: var(--ink); font-size: clamp(19px, 2.1vw, 24px); font-weight: 500; line-height: 1.3; letter-spacing: -.01em; max-width: 34ch; }
  .mfp--hero .mfp__answer { margin-top: 16px; max-width: 62ch; color: #1a1a1a; font-size: 17px; }
  .mfp--hero .mfp__ctas { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }
  .mfp--hero .mfp__strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 36px; }
  .mfp--hero .mfp__strip--3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  @container (max-width: 479px) { .mfp--hero .mfp__strip--3 { gap: 6px; } .mfp--hero .mfp__strip--3 .mfp__stat { padding: 12px; } .mfp--hero .mfp__strip--3 .mfp__stat b { font-size: 24px; } .mfp--hero .mfp__strip--3 .mfp__stat span { font-size: 12px; } }
  .mfp--hero .mfp__stat { background: var(--deep); color: #f3f2f7; border-radius: 14px; padding: 16px 18px; display: grid; gap: 4px; align-content: start; }
  .mfp--hero .mfp__stat b { font-family: var(--num); font-weight: 600; font-size: clamp(28px, 3vw, 38px); line-height: 1; letter-spacing: -.04em; color: #fff; }
  .mfp--hero .mfp__stat span { font-size: 13.5px; line-height: 1.35; color: rgba(243, 242, 247, .78); }
  /* Poster layout: text left, colour plate right */
  .mfp--hero .mfp__cols { display: grid; grid-template-columns: minmax(0, 1fr); gap: 36px 56px; align-items: center; }
  @container (min-width: 900px) { .mfp--hero .mfp__cols { grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); } }
  .mfp--hero .mfp__poster { display: grid; gap: 18px; min-width: 0; }
  /* One square, split Mondrian-style: big top left, small top right, tall right, wide bottom */
  .mfp--hero .mfp__plates { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); grid-template-rows: repeat(6, minmax(0, 1fr)); gap: 8px;
    aspect-ratio: 1 / 1; max-width: 100%; container-type: inline-size; }
  .mfp--hero .mfp__plate { position: relative; overflow: hidden; isolation: isolate; background: var(--bg); color: var(--fg); border-radius: 4px;
    padding: clamp(12px, 4cqi, 24px); display: grid; align-content: end; gap: 4px; min-width: 0; }
  .mfp--hero .mfp__plate--1 { grid-area: 1 / 1 / 5 / 5; }
  .mfp--hero .mfp__plate--2 { grid-area: 1 / 5 / 3 / 7; }
  .mfp--hero .mfp__plate--3 { grid-area: 5 / 1 / 7 / 5; }
  .mfp--hero .mfp__plate--4 { grid-area: 3 / 5 / 7 / 7; }
  .mfp--hero .mfp__plate b { position: relative; color: var(--num-fg); font-family: var(--num); font-weight: 600; font-size: 11cqi; line-height: .9; letter-spacing: -.05em; transition: color .35s; }
  .mfp--hero .mfp__plate span { position: relative; font-size: clamp(12px, 2.6cqi, 15px); line-height: 1.3; font-weight: 500; transition: color .35s; }
  /* Hover: another colour from the same Wada combination floods up from the bottom, as on the results cards */
  .mfp--hero .mfp__plate { --tex: var(--tex0); transition: transform .35s cubic-bezier(.2, .8, .2, 1); }
  .mfp--hero .mfp__plate::after { content: ""; position: absolute; inset: 0; z-index: -2; background: var(--h-bg); transform: translateY(101%); transition: transform .5s cubic-bezier(.2, .8, .2, 1); }
  .mfp--hero .mfp__plate:hover { transform: translateY(-3px); --tex: var(--h-tex); }
  .mfp--hero .mfp__plate:hover::after { transform: translateY(0); }
  .mfp--hero .mfp__plate:hover b { color: var(--h-num); }
  .mfp--hero .mfp__plate:hover span { color: var(--h-fg); }
  /* Optional textures (none used on the Meta page): a sheet can add "texture" to a block */
  .mfp--hero .mfp__plate::before { content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none; }
  /* No hover on phones: the four colours rotate around the blocks, each fading into the next, so all four always differ */
  @property --tex { syntax: "<color>"; inherits: true; initial-value: transparent; }
  @media (hover: none) and (prefers-reduced-motion: no-preference) {
    .mfp--hero .mfp__plate { animation: mfp-rot-bg 18s ease-in-out infinite; }
    .mfp--hero .mfp__plate b { animation: mfp-rot-num 18s ease-in-out infinite; }
    .mfp--hero .mfp__plate span { animation: mfp-rot-fg 18s ease-in-out infinite; }
    .mfp--hero .mfp__plate--2, .mfp--hero .mfp__plate--2 b, .mfp--hero .mfp__plate--2 span { animation-delay: -4.5s; }
    .mfp--hero .mfp__plate--3, .mfp--hero .mfp__plate--3 b, .mfp--hero .mfp__plate--3 span { animation-delay: -9s; }
    .mfp--hero .mfp__plate--4, .mfp--hero .mfp__plate--4 b, .mfp--hero .mfp__plate--4 span { animation-delay: -13.5s; }
  }
  @keyframes mfp-rot-bg {
    0%, 19% { background-color: var(--s1-bg); --tex: var(--s1-tex); } 25%, 44% { background-color: var(--s2-bg); --tex: var(--s2-tex); }
    50%, 69% { background-color: var(--s3-bg); --tex: var(--s3-tex); } 75%, 94% { background-color: var(--s4-bg); --tex: var(--s4-tex); } 100% { background-color: var(--s1-bg); --tex: var(--s1-tex); } }
  @keyframes mfp-rot-num { 0%, 19% { color: var(--s1-num); } 25%, 44% { color: var(--s2-num); } 50%, 69% { color: var(--s3-num); } 75%, 94% { color: var(--s4-num); } 100% { color: var(--s1-num); } }
  @keyframes mfp-rot-fg { 0%, 19% { color: var(--s1-fg); } 25%, 44% { color: var(--s2-fg); } 50%, 69% { color: var(--s3-fg); } 75%, 94% { color: var(--s4-fg); } 100% { color: var(--s1-fg); } }
  @media (prefers-reduced-motion: reduce) { .mfp--hero .mfp__plate, .mfp--hero .mfp__plate::after { transition: none; } }
  .mfp--hero .mfp__logos { display: grid; gap: 8px; min-width: 0; }
  .mfp--hero .mfp__logos-label { font-size: 11px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); }
  .mfp--hero .mfp__marquee { overflow: hidden; -webkit-mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent); mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent); }
  .mfp--hero .mfp__track { display: flex; width: max-content; animation: mfp-marquee 22s linear infinite; }
  .mfp--hero .mfp__marquee:hover .mfp__track { animation-play-state: paused; }
  .mfp--hero .mfp__run { display: flex; align-items: center; gap: 44px; padding-right: 44px; }
  .mfp--hero .mfp__run img { display: block; height: 26px; width: auto; max-width: 140px; object-fit: contain; filter: brightness(0); opacity: .72; }
  .mfp--hero .mfp__more { font-size: 15px; font-weight: 500; color: var(--ink); white-space: nowrap; }
  @keyframes mfp-marquee { to { transform: translateX(-50%); } }
  @media (prefers-reduced-motion: reduce) { .mfp--hero .mfp__track { animation: none; } .mfp--hero .mfp__run[aria-hidden] { display: none; } .mfp--hero .mfp__marquee { -webkit-mask-image: none; mask-image: none; } }
""",
    "shift": """
  .mfp--shift .mfp__label { margin-bottom: 10px; font-size: 11px; font-weight: 500; letter-spacing: .16em; text-transform: uppercase; color: var(--muted); }
  .mfp--shift .mfp__top { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px 56px; align-items: end; }
  @container (min-width: 860px) { .mfp--shift .mfp__top { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } }
  .mfp--shift .mfp__top .mfp__lede { margin-top: 0; line-height: 1.45; }
  .mfp--shift .mfp__body { margin-top: 30px; }
  .mfp--shift .mfp__loop { display: grid; grid-template-columns: minmax(0, 1fr); gap: 22px; counter-reset: mfp-loop; }
  @container (min-width: 760px) { .mfp--shift .mfp__loop { grid-template-columns: repeat(3, minmax(0, 1fr)); grid-template-rows: auto auto 1fr auto; column-gap: 12px; row-gap: 0; }
    .mfp--shift .mfp__step { grid-row: span 4; grid-template-rows: subgrid; row-gap: 10px; } }
  .mfp--shift .mfp__step { counter-increment: mfp-loop; position: relative; border-radius: 16px; padding: 22px; display: grid; gap: 10px; align-content: start;
    background: var(--sb); color: var(--sf); }
  .mfp--shift .mfp__step::before { content: "0" counter(mfp-loop); font-family: var(--num); font-weight: 600; font-size: 13px; letter-spacing: .06em; }
  .mfp--shift .mfp__step--meta { box-shadow: inset 0 0 0 1px rgba(35, 53, 81, .25); }
  .mfp--shift .mfp__step h3 { color: inherit; font-size: 21px; line-height: 1.15; letter-spacing: -.015em; text-transform: none; }
  .mfp--shift .mfp__changed { font-size: 15px; line-height: 1.42; }
  .mfp--shift .mfp__we { align-self: start; margin-top: 4px; padding-top: 12px; border-top: 1px solid currentColor; border-top-color: color-mix(in srgb, currentColor 22%, transparent); display: grid; gap: 4px; }
  .mfp--shift .mfp__we span { font-size: 11px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; opacity: .75; }
  .mfp--shift .mfp__we p { font-size: 15px; line-height: 1.42; font-weight: 500; }
  .mfp--shift .mfp__step:not(:last-child)::after { content: "\\2193"; position: absolute; left: 50%; bottom: -11px; transform: translate(-50%, 50%); z-index: 1;
    width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; font-size: 13px; background: #ffffff; color: #00978d; font-weight: 600; box-shadow: 0 2px 6px rgba(4, 32, 44, .25); }  /* white circle, Wada teal arrow */
  @container (min-width: 760px) { .mfp--shift .mfp__step:not(:last-child)::after { content: "\\2192"; left: auto; right: -6px; bottom: auto; top: 50%; transform: translate(50%, -50%); } }
  .mfp--shift .mfp__close { margin-top: 22px; font-size: 16px; color: var(--ink); }
  .mfp--shift .mfp__close b { font-weight: 500; color: var(--acc2, var(--ink)); }
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
    "types_funnel": """
  .mfp--types .mfp__label { margin-bottom: 10px; font-size: 11px; font-weight: 500; letter-spacing: .16em; text-transform: uppercase; color: var(--muted); }
  .mfp--types .mfp__top { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px 56px; align-items: end; }
  @container (min-width: 860px) { .mfp--types .mfp__top { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } }
  .mfp--types .mfp__top .mfp__lede { margin-top: 0; line-height: 1.45; }
  .mfp--types .mfp__body { margin-top: 30px; }
  .mfp--types .mfp__funnel { display: grid; grid-template-columns: minmax(0, 1fr); gap: 22px; }
  @container (min-width: 820px) { .mfp--types .mfp__funnel { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; } }
  .mfp--types .mfp__stage { position: relative; border-radius: 16px; padding: 22px; display: grid; gap: 10px; align-content: start; background: var(--sb); color: var(--sf);
    transition: transform .35s cubic-bezier(.2, .8, .2, 1), box-shadow .35s; }
  /* Hover: the card lifts a little with a soft shadow */
  .mfp--types .mfp__stage:hover { transform: translateY(-6px); box-shadow: 0 18px 36px -14px rgba(4, 32, 44, .55); }
  .mfp--types .mfp__stage--line:hover { box-shadow: inset 0 0 0 1px rgba(35, 53, 81, .25), 0 18px 36px -14px rgba(4, 32, 44, .55); }
  /* Side by side, each campaign sits in a shared row, so dividers line up across the cards */
  @container (min-width: 820px) {
    .mfp--types .mfp__funnel { grid-template-rows: auto auto repeat(var(--rows), auto) 1fr; row-gap: 0; }
    .mfp--types .mfp__stage { grid-row: span calc(var(--rows) + 3); grid-template-rows: subgrid; row-gap: 0; }
    .mfp--types .mfp__stage h3 { padding: 10px 0 12px; }
    .mfp--types .mfp__funnel .mfp__camps { display: contents; } }
  .mfp--types .mfp__stage--line { box-shadow: inset 0 0 0 1px rgba(35, 53, 81, .25); }
  .mfp--types .mfp__step-n { font-family: var(--num); font-weight: 600; font-size: 13px; letter-spacing: .06em; }
  .mfp--types .mfp__stage h3 { color: inherit; font-size: 21px; line-height: 1.15; letter-spacing: -.015em; text-transform: none; }
  .mfp--types .mfp__camps { display: grid; }
  .mfp--types .mfp__camps > li { align-content: start; padding: 12px 0; border-top: 1px solid color-mix(in srgb, currentColor 22%, transparent); display: grid; gap: 4px; }
  .mfp--types .mfp__camps b { font-weight: 500; font-size: 16px; line-height: 1.3; }
  .mfp--types .mfp__camps p { font-size: 14.5px; line-height: 1.42; opacity: .9; }
  .mfp--types .mfp__pills { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
  .mfp--types .mfp__pill { position: relative; overflow: hidden; isolation: isolate; font-size: 12px; font-weight: 500; line-height: 1.2; border-radius: 999px; padding: 4px 10px;
    box-shadow: inset 0 0 0 1px color-mix(in srgb, currentColor 45%, transparent); cursor: default; transition: color .3s, box-shadow .3s; }
  /* Hover: another Wada colour floods up from the bottom, as on the hero tiles */
  .mfp--types .mfp__pill::after { content: ""; position: absolute; inset: 0; z-index: -1; background: var(--pb); transform: translateY(101%); transition: transform .4s cubic-bezier(.2, .8, .2, 1); }
  .mfp--types .mfp__pill:hover { color: var(--pf); box-shadow: inset 0 0 0 1px var(--pb); }
  .mfp--types .mfp__pill:hover::after { transform: translateY(0); }
  @media (prefers-reduced-motion: reduce) { .mfp--types .mfp__stage, .mfp--types .mfp__pill, .mfp--types .mfp__pill::after { transition: none; } .mfp--types .mfp__stage:hover { transform: none; } }
  .mfp--types .mfp__stage:not(:last-child)::after { content: "\\2193"; position: absolute; left: 50%; bottom: -11px; transform: translate(-50%, 50%); z-index: 1;
    width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; font-size: 13px; background: #ffffff; color: #00978d; font-weight: 600; box-shadow: 0 2px 6px rgba(4, 32, 44, .25); }  /* white circle, Wada teal arrow */
  @container (min-width: 820px) { .mfp--types .mfp__stage:not(:last-child)::after { content: "\\2192"; left: auto; right: -6px; bottom: auto; top: 46px; transform: translate(50%, -50%); } }
  .mfp--types .mfp__close { margin-top: 22px; font-size: 16px; color: var(--ink); }
  .mfp--types .mfp__close b { font-weight: 500; }
""",
    "results": """
  .mfp--results .mfp__label { margin-bottom: 10px; font-size: 11px; font-weight: 500; letter-spacing: .16em; text-transform: uppercase; color: var(--muted); }
  .mfp--results .mfp__top { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px 56px; align-items: end; }
  @container (min-width: 860px) { .mfp--results .mfp__top { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } }
  .mfp--results .mfp__top .mfp__lede { margin-top: 0; line-height: 1.45; }
  .mfp--results .mfp__body { margin-top: 28px; }
  .mfp--results .mfp__rgrid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; }
  @container (min-width: 900px) { .mfp--results .mfp__rgrid { grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr); } .mfp--results .mfp__rgrid--solo { grid-template-columns: minmax(0, 1fr); } }
  .mfp--results .mfp__feat { border-radius: 18px; overflow: hidden; display: grid; grid-template-columns: minmax(0, 1fr); background: var(--deep); color: #f3f2f7; text-decoration: none;
    transition: transform .35s cubic-bezier(.2, .8, .2, 1), box-shadow .35s; }
  @container (min-width: 640px) { .mfp--results .mfp__feat { grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); } }
  a.mfp__feat:hover, a.mfp__feat:focus-visible { transform: translateY(-4px); box-shadow: 0 18px 36px -16px rgba(4, 32, 44, .5); }
  .mfp--results .mfp__fimg { background: var(--fbg); display: grid; place-items: center; min-height: 260px; padding: 20px; }
  .mfp--results .mfp__fart { position: relative; display: inline-block; line-height: 0; max-width: 92%; }
  .mfp--results .mfp__fbase { display: block; width: auto; max-width: 100%; height: auto; max-height: 340px; animation: mfp-float 5s ease-in-out infinite alternate; }
  .mfp--results .mfp__layer { position: absolute; height: auto; transform-origin: 50% 50%; transition: scale .35s cubic-bezier(.2, .8, .2, 1); }
  .mfp--results .mfp__layer--wobble { animation: mfp-wobble 3.6s ease-in-out infinite alternate; }
  .mfp--results .mfp__layer--wobble-r { animation: mfp-wobble-r 4.2s ease-in-out infinite alternate; }
  a.mfp__feat:hover .mfp__layer, a.mfp__feat:focus-visible .mfp__layer { scale: 1.14; }
  @keyframes mfp-float { from { transform: translateY(4px); } to { transform: translateY(-6px); } }
  @keyframes mfp-wobble { from { transform: rotate(-9deg) translateY(2px); } to { transform: rotate(7deg) translateY(-6px); } }
  @keyframes mfp-wobble-r { from { transform: rotate(8deg) translateY(-3px); } to { transform: rotate(-7deg) translateY(5px); } }
  .mfp--results .mfp__fbody { padding: 26px; display: grid; gap: 10px; align-content: start; }
  .mfp--results .mfp__ftag { font-size: 11px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; color: #96d1aa; }
  .mfp--results .mfp__fnum { font-family: var(--num); font-weight: 600; font-size: clamp(52px, 7cqi, 76px); line-height: .95; letter-spacing: -.045em; color: #fff; }
  .mfp--results .mfp__flabel { font-size: 16px; }
  .mfp--results .mfp__fbody dl { margin: 6px 0 0; display: grid; gap: 10px; }
  .mfp--results .mfp__fbody dt { font-size: 11px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; color: rgba(243, 242, 247, .6); }
  .mfp--results .mfp__fbody dd { margin: 3px 0 0; font-size: 15px; line-height: 1.42; }
  .mfp--results .mfp__fbody u { text-decoration: none; justify-self: start; font-weight: 500; border-bottom: 1px solid rgba(255, 255, 255, .45); margin-top: 6px; color: #fff; }
  .mfp--results .mfp__side { display: grid; gap: 12px; }
  .mfp--results .mfp__mini { border-radius: 18px; padding: 22px; background: var(--mb); color: var(--ink); display: grid; gap: 4px; align-content: end; min-height: 160px; }
  .mfp--results .mfp__mini em { font-style: normal; font-size: 11px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; opacity: .75; }
  .mfp--results .mfp__mini b { font-family: var(--num); font-weight: 600; font-size: clamp(40px, 5cqi, 56px); line-height: .95; letter-spacing: -.045em; }
  @media (prefers-reduced-motion: reduce) { a.mfp__feat, .mfp--results .mfp__layer { transition: none; } a.mfp__feat:hover { transform: none; }
    .mfp--results .mfp__fbase, .mfp--results .mfp__layer { animation: none; } }
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
    head = (f"<!-- MajorForm {d['name']} page: {re.sub(r'^[0-9]+: ', '', comment)}.\n"
            f"     Paste into its own Squarespace Code block, with Display Source turned off. No scripts."
            + (f"\n     Set this section's background to your navy ({d['dark'][slot]}) so the block blends in." if dark else "")
            + (" Its animation comes from the page header script." if slot in viz.CSS or (slot == "hero" and d.get("hero_motion")) else "") + " -->")
    css = BASE + CSS["types_funnel" if slot == "types" and d.get("funnel") else slot] + (viz.DARK + DARK_CSS.get(slot, "") if dark else "") + viz.CSS.get(slot, "")
    style = f'--acc:{d["accent"]}' + (f';--mfp-bg:{d["dark"][slot]}' if dark else "")
    anim = " data-anim" if slot in viz.CSS else ""
    return (f'{head}\n{FONT}\n<style>{css}</style>\n<div class="mfp mfp--{slot}" style="{style}" '
            f'data-theme="{"dark" if dark else "light"}"{anim}>\n{inner}\n</div>\n')


def head2(title, lede=None, tag="h2", anchor=None):
    a = f' id="{anchor}"' if anchor else ""
    out = f'<{tag} class="mfp__h2"{a}>{e(title)}</{tag}>'
    if lede:
        out += f'\n<p class="mfp__lede">{e(lede)}</p>'
    return out


def hero(d, g):
    stats = []
    for value, label in ([] if d.get("poster") else d["stats"]):
        if g.ok(value, f"Hero stat: {label}"):
            stats.append(f'<div class="mfp__stat"><b>{e(value)}</b><span>{e(label)}</span></div>')
        elif g.preview:
            stats.append(f'<div class="mfp__stat"><b>{g.ph("x")}</b><span>{e(label)}</span></div>')
    crumbs = (f'<nav class="mfp__crumbs" aria-label="Breadcrumb"><a href="{SITE}/">Home</a><span aria-hidden="true">/</span>'
              f'<a href="{PERFORMANCE}">Performance marketing</a><span aria-hidden="true">/</span><span aria-current="page">{e(d.get("crumb", d["name"]))}</span></nav>')
    inner = (f'{crumbs}\n<h1 class="mfp__h1">{e(d["h1"])}</h1>\n<p class="mfp__thesis">{e(d["thesis"])}</p>\n'
             f'<p class="mfp__answer">{e(d["answer"])}</p>\n'
             f'<div class="mfp__ctas"><a class="mfp__btn" href="{CONTACT}">Talk to our strategists <span aria-hidden="true">&rarr;</span></a>'
             f'<a class="mfp__btn mfp__btn--ghost" href="#results">See {e(d["short"])} results</a></div>')
    if stats:
        inner += f'\n<div class="mfp__strip{" mfp__strip--3" if len(stats) == 3 else ""}">' + "".join(stats) + "</div>"
    if d.get("poster"):
        inner = f'<div class="mfp__cols"><div class="mfp__text">{inner}</div>{poster(d, g)}</div>'
    m = d.get("hero_motion")
    if m:  # the animation fills the Squarespace section behind the text (from the page header script)
        inner = (f'<div data-pillar-dots data-pillar="{e(m["mode"])}" data-palette="{e(m["palette"])}" data-fill="section"'
                 + "".join(f' data-{k}="{e(str(m[k]))}"' for k in ("speed", "start", "narrow-opacity") if m.get(k)) + "></div>\n"
                 + f'<div class="mfp__text">{inner}</div>')
    return wrap("hero", d, inner, "1: hero (H1, answer, proof numbers)")


def logo_src(key):
    """White logo PNGs from the logo marquee, embedded so the block needs no uploads."""
    import base64, os
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "logo-marquee", "logos", key + ".png")
    return "data:image/png;base64," + base64.b64encode(open(path, "rb").read()).decode()


TEXTURE_ART = {}


def plate_vars(b):
    h = b.get("hover", {})
    v = {"bg": b["bg"], "fg": b["fg"], "num-fg": b.get("num", b["fg"]), "tex0": b.get("tex", "rgba(255, 255, 255, .2)"),
         "h-bg": h.get("bg", b["bg"]), "h-fg": h.get("fg", b["fg"]), "h-num": h.get("num", h.get("fg", b["fg"])), "h-tex": h.get("tex", b.get("tex", "rgba(255, 255, 255, .2)"))}
    return ";".join(f"--{k}:{x}" for k, x in v.items())


def poster(d, g):
    """The numbers as a colour plate (a Wada combination), with a scrolling row of client logos under it."""
    cells = []
    for i, b in enumerate(d["poster"]):
        if not g.ok(b["value"], f"Poster: {b['label']}"):
            continue
        tex = b.get("texture", "")
        art = TEXTURE_ART.get(tex, "")
        cells.append(f'<div class="mfp__plate mfp__plate--{i + 1}{" mfp__tex--" + tex if tex else ""}" style="{plate_vars(b)}">'
                     f'{art}<b>{e(b["value"])}</b><span>{e(b["label"])}</span></div>')
    states = ";".join(f'--s{i + 1}-bg:{b["bg"]};--s{i + 1}-fg:{b["fg"]};--s{i + 1}-num:{b.get("num", b["fg"])};--s{i + 1}-tex:{b.get("tex", "rgba(255, 255, 255, .2)")}'
                      for i, b in enumerate(d["poster"][:4]))
    out = f'<div class="mfp__poster"><div class="mfp__plates" style="{states}">' + "".join(cells) + "</div>"
    if d.get("logos"):
        names = d["logos"]
        one = "".join(f'<img src="{logo_src(k)}" alt="{e(n)}" height="26">' for k, n in names) + (f'<span class="mfp__more">{e(d["logos_more"])}</span>' if d.get("logos_more") else "")
        # two identical runs make the loop seamless; the second is hidden from screen readers
        out += (f'<div class="mfp__logos"><p class="mfp__logos-label">{e(d.get("logos_label", "Brands we work with"))}</p>'
                f'<div class="mfp__marquee"><div class="mfp__track"><div class="mfp__run">{one}</div><div class="mfp__run" aria-hidden="true">{one}</div></div></div></div>')
    return out + "</div>"


def shift(d, g):
    """How the platform decides who sees an ad, as a three-step loop, with what changed and how we handle each step."""
    s = d["shift"]
    steps = "".join(
        f'<li class="mfp__step mfp__step--{st["who"]}" style="--sb:{st["bg"]};--sf:{st["fg"]}">'
        f'<h3>{e(st["title"])}</h3><p class="mfp__changed">{e(st["changed"])}</p>'
        f'<div class="mfp__we"><span>{e(s["we_label"])}</span><p>{e(st["we"])}</p></div></li>'
        for st in s["steps"])
    inner = (f'<p class="mfp__label">{e(s["label"])}</p>'
             f'<div class="mfp__top">{head2(s["title"])}<p class="mfp__lede">{e(s["lede"])}</p></div>'
             f'\n<ol class="mfp__body mfp__loop">{steps}</ol>'
             f'\n<p class="mfp__close"><b>{e(s["close_lead"])}</b> {e(s["close"])}</p>')
    return wrap("shift", d, inner, "2: how the platform has changed, and how we handle it")


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
    f = d.get("funnel")
    if not f:  # simple list, for sheets without a funnel
        items = "".join(f'<li class="mfp__type"><h3>{e(n)}</h3><p>{e(x)}</p><span class="mfp__kpi">{e(k)}</span></li>' for n, x, k in d["types"])
        inner = head2(d["types_title"], d["types_lede"]) + f'\n<ul class="mfp__body mfp__list">{items}</ul>'
        return wrap("types", d, inner, "campaign types")
    stages = "".join(
        f'<li class="mfp__stage{" mfp__stage--line" if st["bg"] == "transparent" else ""}" style="--sb:{st["bg"]};--sf:{st["fg"]};'
        f'--pb:{st.get("pill", {}).get("bg", "#253551")};--pf:{st.get("pill", {}).get("fg", "#ffffff")}">'
        f'<span class="mfp__step-n">{e(st["label"])}</span><h3>{e(st["title"])}</h3><ul class="mfp__camps">'
        + "".join(f'<li><b>{e(n)}</b><p>{e(x)}</p><span class="mfp__pills">'
                  + "".join(f'<span class="mfp__pill">{e(k)}</span>' for k in kpis) + "</span></li>" for n, x, kpis in st["items"])
        + "</ul></li>" for st in f["stages"])
    inner = (f'<p class="mfp__label">{e(f["label"])}</p>'
             f'<div class="mfp__top">{head2(f["title"])}<p class="mfp__lede">{e(f["lede"])}</p></div>'
             f'\n<ol class="mfp__body mfp__funnel" style="--rows:{max(len(st["items"]) for st in f["stages"])}">{stages}</ol>'
             f'\n<p class="mfp__close"><b>{e(f["close_lead"])}</b> {e(f["close"])}</p>')
    return wrap("types", d, inner, "campaign types across the funnel")


def asset_src(name):
    """Images in assets/ are embedded, so the block needs no uploads."""
    import base64, mimetypes, os
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", name)
    kind = mimetypes.guess_type(path)[0] or "image/png"
    return f"data:{kind};base64," + base64.b64encode(open(path, "rb").read()).decode()


def results(d, g):
    rs = d["results"]
    lead, rest = rs[0], rs[1:]
    if not g.ok(lead["value"], f"Result: {lead['brand'] or 'a brand'} on {d['short']}"):
        return None
    # the featured case: product on its colour, the number, challenge and approach, link to the case study
    # product art: a base image plus optional layers (e.g. stickers) placed in % of it, each with its own gentle motion
    layers = "".join(f'<img class="mfp__layer mfp__layer--{e(L.get("motion", "wobble"))}" src="{asset_src(L["src"])}" alt="" '
                     f'style="left:{L["left"]}%;top:{L["top"]}%;width:{L["width"]}%;animation-delay:{L.get("delay", 0)}s">'
                     for L in lead.get("layers", []))
    img = (f'<div class="mfp__fimg" style="--fbg:{lead.get("image_bg", "#f3d23c")}"><div class="mfp__fart">'
           f'<img class="mfp__fbase" src="{asset_src(lead["image"])}" alt="{e(lead["image_alt"])}" loading="lazy">{layers}</div></div>'
           if lead.get("image") else "")
    facts = "".join(f'<div><dt>{e(k)}</dt><dd>{e(v)}</dd></div>' for k, v in lead.get("story", []))
    feat_body = (f'<div class="mfp__fbody"><span class="mfp__ftag">{e(lead["brand"])} &middot; {e(d["short"])}</span>'
                 f'<b class="mfp__fnum">{e(lead["value"])}</b><span class="mfp__flabel">{e(lead["label"])}</span>'
                 + (f"<dl>{facts}</dl>" if facts else "")
                 + (f'<u>Read the case study&nbsp;<span aria-hidden="true">&rarr;</span></u>' if lead.get("url") else "") + "</div>")
    tag = "a" if lead.get("url") else "div"
    href = f' href="{e(lead["url"])}"' if lead.get("url") else ""
    feat = f'<{tag} class="mfp__feat"{href}>{img}{feat_body}</{tag}>'
    minis = []
    for r in rest:
        if g.ok(r["value"], f"Result: {r['brand'] or 'a brand'} on {d['short']}") and r["brand"]:
            minis.append(f'<div class="mfp__mini" style="--mb:{r.get("bg", "#ffefae")}"><em>{e(r["brand"])}</em><b>{e(r["value"])}</b><span>{e(r["label"])}</span></div>')
        elif g.preview:
            minis.append(f'<div class="mfp__mini" style="--mb:{r.get("bg", "#ffefae")}"><em>{g.ph("brand")}</em><b>{g.ph("x")}</b><span>{g.ph(r["label"])}</span></div>')
    side = f'<div class="mfp__side">{"".join(minis)}</div>' if minis else ""
    inner = (f'<p class="mfp__label">{e(d["results_label"])}</p>'
             f'<div class="mfp__top">{head2(d["results_title"], anchor="results")}<p class="mfp__lede">{e(d["results_lede"])}</p></div>'
             f'\n<div class="mfp__body mfp__rgrid{" mfp__rgrid--solo" if not minis else ""}">{feat}{side}</div>')
    return wrap("results", d, inner, "results")


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
    "hero": """
  .mfp.mfp--hero[data-theme="dark"] { background: transparent; }
  @container (min-width: 900px) { .mfp--hero .mfp__text { max-width: 54%; } .mfp--hero .mfp__strip { grid-template-columns: repeat(3, minmax(0, 1fr)); } }  /* beats the navy fill that other dark blocks on the page also declare */
  .mfp--hero[data-theme="dark"] .mfp__crumbs a { color: #fff; border-color: rgba(255, 255, 255, .3); }
  .mfp--hero[data-theme="dark"] .mfp__thesis { color: var(--acc); }
  .mfp--hero[data-theme="dark"] .mfp__answer { color: rgba(243, 242, 247, .86); }
  .mfp--hero[data-theme="dark"] .mfp__btn { background: var(--acc); border-color: var(--acc); color: var(--deep); }
  .mfp--hero[data-theme="dark"] .mfp__btn:hover, .mfp--hero[data-theme="dark"] .mfp__btn:focus-visible { background: #fff; border-color: #fff; }
  .mfp--hero[data-theme="dark"] .mfp__btn--ghost { background: none; color: #fff; border-color: rgba(255, 255, 255, .4); }
  .mfp--hero[data-theme="dark"] .mfp__btn--ghost:hover { background: rgba(255, 255, 255, .1); color: #fff; }
  .mfp--hero[data-theme="dark"] .mfp__strip { max-width: 640px; }
  .mfp--hero[data-theme="dark"] .mfp__stat { background: rgba(4, 32, 44, .55); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .12); -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); }
""",
    "shift": """
  .mfp--shift[data-theme="dark"] .mfp__label { color: #96d1aa; }
  .mfp--shift[data-theme="dark"] .mfp__step--meta { box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .28); }
  .mfp--shift[data-theme="dark"] .mfp__close { color: #fff; }
  .mfp--shift[data-theme="dark"] .mfp__close b { color: #96d1aa; }
""",
    "types": """
  .mfp--types[data-theme="dark"] .mfp__label { color: #96d1aa; }
  .mfp--types[data-theme="dark"] .mfp__stage--line { box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .28); }
  .mfp--types[data-theme="dark"] .mfp__close { color: #fff; }
  .mfp--types[data-theme="dark"] .mfp__close b { color: #96d1aa; }
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
            {"@type": "ListItem", "position": 3, "name": d.get("crumb", d["name"]), "item": url}]},
        {"@context": "https://schema.org", "@type": "FAQPage", "@id": url + "/#faq", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in d["faqs"]]},
    ]
    return (f"<!-- {d['name']} page header. Paste into Page Settings > Advanced > Page Header Code Injection.\n"
            "     The schema is built from the same text as the page, so the FAQ answers match word for word.\n"
            "     The short script below plays the block animations once as they scroll into view. -->\n"
            '<script type="application/ld+json">\n' + json.dumps(data, indent=2, ensure_ascii=False) + "\n</script>\n"
            + viz.MOTION_JS + "\n" + (hero_engine() if d.get("hero_motion") else ""))


def hero_engine():
    import os
    src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "pillar-dots", "pillar-dots.js")).read().strip()
    return "<script>\n" + src + "\n</script>\n"


def render(d, preview=False):
    """Returns ({slot: html}, missing). Slots with nothing confirmed to show are left out."""
    g = Gaps(preview)
    blocks, fns = {}, dict(SLOTS)
    for name in d.get("slots", [n for n, _ in SLOTS]):  # a sheet can drop or reorder slots
        html = fns[name](d, g)
        if html:
            blocks[name] = html
    return blocks, g.missing
