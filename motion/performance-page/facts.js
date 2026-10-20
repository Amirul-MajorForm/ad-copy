(function () {
  var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var HOLD = 3200; // ms the finished state stays before the dots replay

  function dot(v, cls, css) { var i = document.createElement("i"); if (cls) i.className = cls; for (var k in css) i.style[k] = css[k]; v.appendChild(i); return i; }

  function build(v) {
    v.innerHTML = "";
    var kind = v.getAttribute("data-viz");
    if (kind === "years") {
      dot(v, "line", {});
      for (var k = 0; k < 10; k++) dot(v, k === 9 ? "hot" : "", { left: (3 + k * 15.5) + "px", top: "24px", width: "7px", height: "7px", transitionDelay: (0.25 + k * 0.11) + "s" });
      dot(v, "hot", { left: "151px", top: "20px", width: "15px", height: "15px", transitionDelay: "1.45s" });
    } else if (kind === "brands") {
      for (var n = 0; n < 30; n++) {
        var r = Math.floor(n / 10), c = n % 10;
        dot(v, [4, 13, 22, 27].indexOf(n) >= 0 ? "teal" : (n === 29 ? "hot" : ""), { left: (6 + c * 16) + "px", top: (8 + r * 17) + "px", width: "8px", height: "8px", transitionDelay: (0.2 + n * 0.04) + "s" });
      }
    } else if (kind === "team") {
      [[8, 2, "Strategy"], [118, 2, "Creative"], [8, 40, "Media"], [118, 40, "Data"]].forEach(function (p, i) {
        dot(v, "teal", { left: p[0] + "px", top: (p[1] + 4) + "px", width: "9px", height: "9px", transitionDelay: (0.2 + i * 0.1) + "s" });
        var t = document.createElement("em"); t.textContent = p[2]; t.style.left = (p[0] + 14) + "px"; t.style.top = (p[1] + 2) + "px"; v.appendChild(t);
      });
      dot(v, "hot", { left: "75px", top: "18px", width: "20px", height: "20px", transform: "scale(0)" });
    }
  }

  function merge(v, timers) {
    var dots = v.querySelectorAll("i"), labels = v.querySelectorAll("em");
    timers.push(setTimeout(function () {
      for (var i = 0; i < 4; i++) { dots[i].style.left = "80px"; dots[i].style.top = "23px"; dots[i].style.transitionDelay = (i * 0.06) + "s"; }
      for (var j = 0; j < labels.length; j++) labels[j].style.opacity = "0";
    }, 1100));
    timers.push(setTimeout(function () {
      for (var i = 0; i < 4; i++) dots[i].style.opacity = "0";
      dots[4].style.transitionDelay = "0s"; dots[4].style.transform = "scale(1)";
    }, 1900));
  }

  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count")), suffix = el.getAttribute("data-suffix") || "", start = null;
    function step(now) {
      if (start === null) start = now;
      var p = Math.min(1, (now - start) / 1300);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  document.querySelectorAll(".mf-facts:not([data-mf-init])").forEach(function (root) {
    root.setAttribute("data-mf-init", "");
    var vizzes = root.querySelectorAll(".mf-facts__viz"), team = root.querySelector('[data-viz="team"]');
    var timers = [], running = false, counted = false;

    function clear() { timers.forEach(clearTimeout); timers = []; }
    function play() {
      clear();
      root.classList.remove("mf-facts--play");
      for (var i = 0; i < vizzes.length; i++) build(vizzes[i]);
      void root.offsetWidth;
      root.classList.add("mf-facts--play");
      merge(team, timers);
      timers.push(setTimeout(function () {
        root.classList.remove("mf-facts--play");           // dots shrink away in the same stagger
        var c = team.querySelector("i.hot:last-of-type"); if (c) c.style.transform = "scale(0)";
        timers.push(setTimeout(function () { if (running) play(); }, 1500));
      }, 2600 + HOLD));
    }

    if (reduced) {
      // Finished state, no motion: everything shown, team already merged into one dot
      for (var i = 0; i < vizzes.length; i++) build(vizzes[i]);
      root.classList.add("mf-facts--play");
      var d = team.querySelectorAll("i"), l = team.querySelectorAll("em");
      for (var k = 0; k < 4; k++) d[k].style.opacity = "0";
      for (var m = 0; m < l.length; m++) l[m].style.opacity = "0";
      d[4].style.transform = "scale(1)";
      return;
    }

    for (var j = 0; j < vizzes.length; j++) build(vizzes[j]);
    if (!window.IntersectionObserver) { running = true; play(); return; }
    new IntersectionObserver(function (entries) {
      var on = entries[entries.length - 1].isIntersecting;
      if (on && !running) {
        running = true;
        if (!counted) { counted = true; root.querySelectorAll("[data-count]").forEach(countUp); }
        play();
      } else if (!on && running) {
        running = false; clear();
      }
    }, { threshold: 0.3 }).observe(root);
  });
})();
