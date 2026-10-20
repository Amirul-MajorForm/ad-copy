(function () {
  var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll(".mf-res:not([data-mf-init])").forEach(function (el) {
    el.setAttribute("data-mf-init", "");

    if (reduced || !window.IntersectionObserver) return;
    var rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.85) return; // already on screen at load: show as is

    // Cards rise in one after another; numbers count up from zero to their real value.
    el.classList.add("mf-res--pre");
    var nums = Array.prototype.slice.call(el.querySelectorAll(".mf-res__num")).map(function (n) {
      var m = n.textContent.match(/^(\D*)([\d.]+)(.*)$/);
      return m ? { el: n, pre: m[1], val: parseFloat(m[2]), post: m[3], dec: (m[2].split(".")[1] || "").length, final: n.textContent } : null;
    }).filter(Boolean);
    nums.forEach(function (n) { n.el.textContent = n.pre + "0" + n.post; });

    var io = new IntersectionObserver(function (entries) {
      if (!entries[entries.length - 1].isIntersecting) return;
      io.disconnect();
      el.classList.add("mf-res--in");
      requestAnimationFrame(function () { el.classList.remove("mf-res--pre"); });
      nums.forEach(function (n, i) {
        var start = null, delay = 180 + i * 120, dur = 1300;
        function step(now) {
          if (start === null) start = now;
          var p = Math.min(1, Math.max(0, (now - start - delay) / dur));
          var e = 1 - Math.pow(1 - p, 3);
          n.el.textContent = p >= 1 ? n.final : n.pre + (n.val * e).toFixed(n.dec) + n.post;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.3 });
    io.observe(el);
  });
})();
