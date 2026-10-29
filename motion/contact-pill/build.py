"""Build the floating "contact" button: one site-wide snippet per style.

Run: python3 build.py   -> writes contact-pill-<style>.html for each style below.
Paste one into Squarespace: Settings > Advanced (or Developer tools) > Code Injection > Footer. It shows on every page,
stays fixed as people scroll, appears after the first screen, and hides itself on the contact page.
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
CONTACT = "https://www.majorform.co/contact"
LABEL = "Talk to our strategists"
SHORT = "Let's talk"

ARROW = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
CHAT = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>'

BASE = """  .mf-cta { position: fixed; z-index: 9999; font-family: "Space Grotesk", system-ui, sans-serif; text-decoration: none;
    opacity: 0; pointer-events: none; transform: translateY(14px); transition: opacity .4s ease, transform .5s cubic-bezier(.2, .8, .2, 1); }
  .mf-cta.is-on { opacity: 1; pointer-events: auto; transform: none; }
  .mf-cta:focus-visible { outline: 2px solid #ffffff; outline-offset: 3px; box-shadow: 0 0 0 5px #04202c; }
  @media (prefers-reduced-motion: reduce) { .mf-cta, .mf-cta * { transition: none !important; animation: none !important; } }
  @media print { .mf-cta { display: none; } }"""

STYLES = {
    # A (chosen): a pill in the bottom-right corner with a live dot; fills with lemon on hover; full label on every screen size
    "pill": (f'<a class="mf-cta mf-cta--pill" href="{CONTACT}"><span class="mf-cta__dot" aria-hidden="true"></span><span>{LABEL}</span>{ARROW}</a>', """
  .mf-cta--pill { right: max(20px, env(safe-area-inset-right)); bottom: max(20px, env(safe-area-inset-bottom)); display: inline-flex; align-items: center; gap: 10px;
    padding: 13px 20px 13px 16px; border-radius: 999px; background: #04202c; color: #ffffff; font-size: 15px; font-weight: 500; line-height: 1;
    box-shadow: 0 14px 34px -14px rgba(4, 32, 44, .7), 0 0 0 1px rgba(255, 255, 255, .12); overflow: hidden; isolation: isolate; }
  .mf-cta--pill::before { content: ""; position: absolute; inset: 0; z-index: -1; background: #ffefae; transform: translateY(102%); transition: transform .4s cubic-bezier(.2, .8, .2, 1); }
  .mf-cta--pill:hover { color: #04202c; } .mf-cta--pill:hover::before { transform: none; }
  .mf-cta--pill svg { transition: transform .3s; } .mf-cta--pill:hover svg { transform: translateX(3px); }
  .mf-cta__dot { position: relative; width: 8px; height: 8px; border-radius: 50%; background: #96d1aa; flex: none; }
  .mf-cta__dot::after { content: ""; position: absolute; inset: 0; border-radius: 50%; background: inherit; animation: mf-cta-ping 2.4s ease-out infinite; }
  @keyframes mf-cta-ping { 0% { transform: scale(1); opacity: .7; } 70%, 100% { transform: scale(2.8); opacity: 0; } }
  @media (max-width: 599px) { .mf-cta--pill { padding: 12px 16px 12px 14px; font-size: 14px; gap: 8px; } }"""),
    # B: a tab on the right edge, halfway down the screen, reading upwards
    "tab": (f'<a class="mf-cta mf-cta--tab" href="{CONTACT}"><span>{SHORT}</span>{ARROW}</a>', """
  .mf-cta--tab { right: 0; top: 50%; display: inline-flex; align-items: center; gap: 8px; padding: 16px 12px; border-radius: 14px 0 0 14px;
    background: #ffefae; color: #04202c; font-size: 14px; font-weight: 600; letter-spacing: .02em; line-height: 1; writing-mode: vertical-rl; rotate: 180deg;
    box-shadow: 0 10px 30px -12px rgba(4, 32, 44, .55); margin-top: -60px; }
  .mf-cta--tab.is-on { transform: none; }
  .mf-cta--tab:not(.is-on) { transform: translateX(-100%); }
  .mf-cta--tab svg { rotate: 90deg; transition: translate .3s; }
  .mf-cta--tab:hover { background: #96d1aa; } .mf-cta--tab:hover svg { translate: 0 3px; }"""),
    # C: a round button that opens into a pill on hover (always open as a small pill on phones)
    "bubble": (f'<a class="mf-cta mf-cta--bubble" href="{CONTACT}" aria-label="{LABEL}">{CHAT}<span class="mf-cta__label">{LABEL}</span></a>', """
  .mf-cta--bubble { right: max(20px, env(safe-area-inset-right)); bottom: max(20px, env(safe-area-inset-bottom)); display: inline-flex; align-items: center;
    height: 56px; padding: 0 18px; border-radius: 999px; background: #ffefae; color: #04202c; font-size: 15px; font-weight: 500; white-space: nowrap;
    box-shadow: 0 14px 34px -14px rgba(4, 32, 44, .75), 0 0 0 1px rgba(4, 32, 44, .08); }
  .mf-cta--bubble svg { flex: none; }
  .mf-cta__label { max-width: 0; overflow: hidden; opacity: 0; transition: max-width .45s cubic-bezier(.2, .8, .2, 1), opacity .3s, margin .45s; }
  .mf-cta--bubble:hover .mf-cta__label, .mf-cta--bubble:focus-visible .mf-cta__label { max-width: 220px; opacity: 1; margin-left: 10px; }
  .mf-cta--bubble:hover { background: #96d1aa; }"""),
}

# show after the first screen, and never on the contact page itself
SCRIPT = """<script>
(function () {
  var a = document.querySelector(".mf-cta"); if (!a) return;
  if (/^\\/contact(\\/|$)/.test(location.pathname)) { a.remove(); return; }
  function check() { a.classList.toggle("is-on", window.scrollY > window.innerHeight * 0.6); }
  window.addEventListener("scroll", check, { passive: true }); check();
})();
</script>"""

for key, (html, css) in STYLES.items():
    out = (f"<!-- MajorForm floating contact button ({key}). Paste into Settings > Advanced > Code Injection > Footer (site-wide).\n"
           "     It stays in place as people scroll, appears after the first screen, and hides on the contact page. -->\n"
           f"{html}\n<style>\n{BASE}{css}\n</style>\n{SCRIPT}\n")
    open(os.path.join(HERE, f"contact-pill-{key}.html"), "w").write(out)
    print(f"contact-pill-{key}.html", len(out), "bytes")
