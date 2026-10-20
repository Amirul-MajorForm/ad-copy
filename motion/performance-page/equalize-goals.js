(function () {
  // Goal cards sit in separate code blocks, which Squarespace sizes to their content.
  // Match cards side by side to the tallest in their row; stacked cards keep their own height.
  var queued = false;
  function equalize() {
    queued = false;
    var cards = Array.prototype.slice.call(document.querySelectorAll(".mf-goal"));
    cards.forEach(function (c) { c.style.minHeight = ""; });
    var rows = [];
    cards.forEach(function (c) {
      var top = Math.round(c.getBoundingClientRect().top + window.pageYOffset);
      var row = rows.filter(function (r) { return Math.abs(r.top - top) < 40; })[0];
      if (!row) { row = { top: top, cards: [] }; rows.push(row); }
      row.cards.push(c);
    });
    rows.forEach(function (r) {
      if (r.cards.length < 2) return;
      var max = Math.max.apply(null, r.cards.map(function (c) { return c.offsetHeight; }));
      r.cards.forEach(function (c) { c.style.minHeight = max + "px"; });
    });
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(equalize); } }
  queue();
  window.addEventListener("load", queue);
  window.addEventListener("resize", queue);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(queue);
})();
