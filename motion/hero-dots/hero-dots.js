/*!
 * MajorForm hero dots
 * Scattered dots flow into wave lines, then a growth path draws through them.
 * Loop: Observe (scatter) -> Decide (waves) -> Act (path) -> back to scatter.
 *
 * Usage: <div data-hero-dots data-preset="dark"></div> and include this script.
 * Optional attributes: data-bg (hex or "transparent"), data-dot, data-accent,
 * data-mint, data-speed (1 = normal), data-interactive ("false" to disable cursor).
 */
(function () {
  "use strict";

  var PRESETS = {
    dark: { bg: "#0b0b0e", dot: "#ecebf6", accent: "#7b6bff", mint: "#5fe3b0", dotAlpha: 1 },
    light: { bg: "#f6f4ee", dot: "#3a2be0", accent: "#3a2be0", mint: "#4fd9a4", dotAlpha: 0.9 }
  };

  var LOOP = 14; // seconds per Observe -> Decide -> Act cycle

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(v) { v = clamp(v, 0, 1); return v * v * (3 - 2 * v); }
  function ramp(t, a, b) { return ease((t - a) / (b - a)); }

  function timeline(t) {
    var morph = t < 11 ? ramp(t, 2.5, 5) : 1 - ramp(t, 11, 13.5);
    var path = ramp(t, 5.5, 9);
    var pathAlpha = 1 - ramp(t, 11, 12.5);
    var phase = t < 3.5 ? 0 : t < 6 ? 1 : t < 12 ? 2 : 0;
    return { morph: morph, path: path, pathAlpha: pathAlpha, phase: phase };
  }

  function HeroDots(el, opts) {
    opts = opts || {};
    var ds = el.dataset;
    this.el = el;
    this.speed = parseFloat(opts.speed || ds.speed || 1) || 1;
    this.interactive = (opts.interactive !== undefined ? opts.interactive : ds.interactive) + "" !== "false";
    this.onPhase = opts.onPhase || null;
    this.overrides = {
      bg: opts.bg || ds.bg, dot: opts.dot || ds.dot,
      accent: opts.accent || ds.accent, mint: opts.mint || ds.mint
    };
    this.setPreset(opts.preset || ds.preset || "dark");

    if (getComputedStyle(el).position === "static") el.style.position = "relative";
    var c = this.canvas = document.createElement("canvas");
    c.setAttribute("aria-hidden", "true");
    c.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none";
    el.insertBefore(c, el.firstChild);
    this.ctx = c.getContext("2d");

    this.t = 0;
    this.last = 0;
    this.phase = -1;
    this.mouse = { x: -9999, y: -9999 };
    this.visible = true;
    this.reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

    var self = this;
    this.frame = function (now) { self.tick(now); };
    this.onResize = function () { self.resize(); if (self.reduced) self.draw(); };
    this.onMove = function (e) {
      var r = self.canvas.getBoundingClientRect();
      self.mouse.x = e.clientX - r.left;
      self.mouse.y = e.clientY - r.top;
    };
    this.onLeave = function () { self.mouse.x = self.mouse.y = -9999; };

    if (window.ResizeObserver) {
      this.ro = new ResizeObserver(this.onResize);
      this.ro.observe(el);
    } else {
      window.addEventListener("resize", this.onResize);
    }
    if (this.interactive) {
      window.addEventListener("pointermove", this.onMove, { passive: true });
      document.addEventListener("pointerleave", this.onLeave);
    }
    if (window.IntersectionObserver) {
      this.io = new IntersectionObserver(function (en) { self.visible = en[0].isIntersecting; });
      this.io.observe(el);
    }

    this.resize();
    if (this.reduced) {
      this.t = 9.5; // still frame with waves and the full path
      this.draw();
    } else {
      this.raf = requestAnimationFrame(this.frame);
    }
  }

  HeroDots.prototype.setPreset = function (name) {
    var p = PRESETS[name] || PRESETS.dark, o = this.overrides;
    this.colors = {
      bg: o.bg || p.bg, dot: o.dot || p.dot, accent: o.accent || p.accent,
      mint: o.mint || p.mint, dotAlpha: p.dotAlpha
    };
    if (this.reduced && this.ctx) this.draw();
  };

  HeroDots.prototype.resize = function () {
    var r = this.el.getBoundingClientRect();
    var W = Math.max(1, r.width), H = Math.max(1, r.height);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = W; this.H = H;
    this.canvas.width = Math.round(W * dpr);
    this.canvas.height = Math.round(H * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.scale = clamp(Math.min(W, H * 1.6) / 900, 0.55, 1.4);

    var narrow = W < 640;
    var gap = narrow ? 12 : 15;
    var cols = Math.ceil(W / gap) + 2;
    var rows = narrow ? 11 : 15;
    var dots = [];
    for (var row = 0; row < rows; row++) {
      for (var col = 0; col < cols; col++) {
        var u = col / (cols - 1);
        dots.push({
          u: u, k: row / (rows - 1) - 0.5,
          sx: Math.random() * W, sy: Math.random() * H,
          vx: (Math.random() - 0.5) * 9, vy: (Math.random() - 0.5) * 9,
          seed: Math.random() * 6.283,
          size: 0.8 + Math.random() * 1.2,
          delay: u * 0.38 + Math.random() * 0.12,
          ox: 0, oy: 0
        });
      }
    }
    this.dots = dots;

    this.mints = [
      { u: 0.14, k: -0.36 }, { u: 0.43, k: 0.41 }, { u: 0.71, k: -0.08 }, { u: 0.9, k: 0.3 }
    ].map(function (m) {
      m.sx = Math.random() * W; m.sy = Math.random() * H; m.seed = Math.random() * 6.283;
      return m;
    });
  };

  // Position on the wave field. u: 0..1 across, k: -0.5..0.5 row offset.
  HeroDots.prototype.wave = function (u, k, t) {
    var H = this.H;
    var pinch = 0.56 + 0.06 * Math.sin(t * 0.21);
    var d = u - pinch;
    var spread = 0.2 + 0.8 * (1 - Math.exp(-(d * d) / 0.05));
    return {
      x: u * this.W,
      y: H * 0.5 + k * H * 0.95 * spread +
        Math.sin(u * 5.6 + t * 0.6 + k * 1.7) * H * 0.065 +
        Math.sin(u * 2.2 - t * 0.33) * H * 0.05
    };
  };

  HeroDots.prototype.tick = function (now) {
    var dt = this.last ? Math.min((now - this.last) / 1000, 0.05) : 0;
    this.last = now;
    if (this.visible && !document.hidden) {
      this.t = (this.t + dt * this.speed) % LOOP;
      this.wanderDt = dt * this.speed;
      this.draw();
    }
    this.raf = requestAnimationFrame(this.frame);
  };

  HeroDots.prototype.draw = function () {
    var ctx = this.ctx, W = this.W, H = this.H, t = this.t, c = this.colors, s = this.scale;
    var tl = timeline(t);
    var flow = t; // waves only show mid-loop, so wrapping at LOOP is invisible
    var wdt = this.wanderDt || 0;
    var mx = this.mouse.x, my = this.mouse.y, R = 110 * s, R2 = R * R;

    if (tl.phase !== this.phase) {
      this.phase = tl.phase;
      if (this.onPhase) this.onPhase(tl.phase);
    }

    if (c.bg === "transparent") ctx.clearRect(0, 0, W, H);
    else { ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H); }

    // Field dots
    ctx.fillStyle = c.dot;
    var dots = this.dots, TAU = 6.283;
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i];
      d.sx += d.vx * wdt; d.sy += d.vy * wdt;
      if (d.sx < -4) d.sx += W + 8; else if (d.sx > W + 4) d.sx -= W + 8;
      if (d.sy < -4) d.sy += H + 8; else if (d.sy > H + 4) d.sy -= H + 8;

      var m = ease(tl.morph * 1.5 - d.delay);
      var w = this.wave(d.u, d.k, flow);
      var x = d.sx + (w.x - d.sx) * m;
      var y = d.sy + (w.y - d.sy) * m;

      var tx = 0, ty = 0, dx = x - mx, dy = y - my, dd = dx * dx + dy * dy;
      if (dd < R2 && dd > 0.01) {
        var dist = Math.sqrt(dd), f = (1 - dist / R);
        f = f * f * 28 * s;
        tx = dx / dist * f; ty = dy / dist * f;
      }
      d.ox += (tx - d.ox) * 0.12; d.oy += (ty - d.oy) * 0.12;

      var shimmer = 0.55 + 0.45 * Math.sin(t * 1.8 + d.seed * 3);
      var edge = 1 - Math.abs(d.k) * 1.1 * m;
      ctx.globalAlpha = c.dotAlpha * (0.3 + 0.7 * shimmer * edge) * (0.6 + 0.4 * m);
      var r = (d.size * (1 - m) + (1.2 + 0.45 * shimmer) * m) * s;
      ctx.beginPath();
      ctx.arc(x + d.ox, y + d.oy, r < 0.6 ? 0.6 : r, 0, TAU);
      ctx.fill();
    }

    // Mint accent dots
    ctx.fillStyle = c.mint;
    for (var j = 0; j < this.mints.length; j++) {
      var md = this.mints[j];
      var mm = ease(tl.morph * 1.5 - md.u * 0.4);
      var mw = this.wave(md.u, md.k, flow);
      var fx = md.sx + Math.sin(t * 0.4 + md.seed) * 30 * s;
      var fy = md.sy + Math.cos(t * 0.33 + md.seed) * 24 * s;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(fx + (mw.x - fx) * mm, fy + (mw.y - fy) * mm, 4.2 * s, 0, TAU);
      ctx.fill();
    }

    // Growth path: bottom-left to top-right, riding the waves
    if (tl.path > 0 && tl.pathAlpha > 0) {
      var N = 22, pts = [], shown = tl.path * (N - 1);
      for (var p = 0; p < N && p <= shown + 1; p++) {
        var q = p / (N - 1);
        var pw = this.wave(0.05 + q * 0.88, 0.3 - 0.6 * ease(q * 1.05), flow);
        var grow = clamp(shown - p + 1, 0, 1);
        pts.push({ x: pw.x, y: pw.y, r: (2.4 + 9 * Math.pow(q, 1.7)) * s * ease(grow), g: grow });
      }
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 1.2 * s;
      ctx.globalAlpha = 0.35 * tl.pathAlpha;
      ctx.beginPath();
      for (var a = 0; a < pts.length; a++) {
        if (pts[a].g <= 0) break;
        if (a === 0) ctx.moveTo(pts[a].x, pts[a].y); else ctx.lineTo(pts[a].x, pts[a].y);
      }
      ctx.stroke();

      ctx.fillStyle = c.accent;
      ctx.globalAlpha = tl.pathAlpha;
      for (var b = 0; b < pts.length; b++) {
        if (pts[b].r <= 0) continue;
        ctx.beginPath();
        ctx.arc(pts[b].x, pts[b].y, pts[b].r, 0, TAU);
        ctx.fill();
      }

      // Pulse ring on the leading dot
      var lead = pts[Math.min(pts.length - 1, Math.floor(shown))];
      if (lead && lead.r > 0) {
        var pulse = (t * 0.9) % 1;
        ctx.globalAlpha = (1 - pulse) * 0.5 * tl.pathAlpha;
        ctx.lineWidth = 1.5 * s;
        ctx.beginPath();
        ctx.arc(lead.x, lead.y, lead.r + pulse * 18 * s, 0, TAU);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  };

  HeroDots.prototype.destroy = function () {
    cancelAnimationFrame(this.raf);
    if (this.ro) this.ro.disconnect(); else window.removeEventListener("resize", this.onResize);
    if (this.io) this.io.disconnect();
    window.removeEventListener("pointermove", this.onMove);
    document.removeEventListener("pointerleave", this.onLeave);
    this.canvas.remove();
  };

  function mountAll() {
    var els = document.querySelectorAll("[data-hero-dots]");
    for (var i = 0; i < els.length; i++) {
      if (!els[i].__heroDots) els[i].__heroDots = new HeroDots(els[i]);
    }
  }

  window.HeroDots = HeroDots;
  window.HeroDots.mountAll = mountAll;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountAll);
  else mountAll();
})();
