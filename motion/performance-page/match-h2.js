(function () {
  // Match headings and big numbers to the site's own H2. Squarespace scales it with the screen, so measure a hidden
  // H2 styled like a text block; without one (outside Squarespace), use the first H2 on the page that isn't ours.
  function measure() {
    var root = document.documentElement.style, host = document.querySelector(".sqs-block-content");
    if (host) {
      var probe = document.createElement("div");
      probe.className = "sqs-html-content"; probe.style.cssText = "position:absolute;visibility:hidden;left:-9999px";
      probe.innerHTML = "<h2>Ag</h2>"; host.appendChild(probe);
      var cs = getComputedStyle(probe.firstChild);
      root.setProperty("--mf-h2", cs.fontSize); root.setProperty("--mf-h2-font", cs.fontFamily);
      root.setProperty("--mf-h2-weight", cs.fontWeight); root.setProperty("--mf-h2-ls", cs.letterSpacing === "normal" ? "0" : cs.letterSpacing);
      probe.remove(); return;
    }
    var heads = document.querySelectorAll("h2");
    for (var i = 0; i < heads.length; i++) {
      if (heads[i].closest(".mf-res, .mf-facts, .mf-faq")) continue;
      root.setProperty("--mf-h2", getComputedStyle(heads[i]).fontSize); break;
    }
  }
  measure();
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);
})();
