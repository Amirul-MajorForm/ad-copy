(function () {
  // Match the big numbers to the site's own H2 size, which Squarespace scales with the screen.
  function measure() {
    var heads = document.querySelectorAll("h2"), size = null;
    for (var i = 0; i < heads.length; i++) {
      if (heads[i].closest(".mf-res, .mf-facts")) continue;
      size = getComputedStyle(heads[i]).fontSize; break;
    }
    if (size) document.documentElement.style.setProperty("--mf-h2", size);
  }
  measure();
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);
})();
