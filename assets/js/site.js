/* Marc Llopart — site interactions
   1) Career elevation profile (the signature) built from data
   2) Scroll-reveal via IntersectionObserver
   3) Active section nav (scrollspy)
   All motion respects prefers-reduced-motion. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Elevation profile ---------- */
  // year, level (0-100 seniority), label, peak?
  var CAREER = [
    { year: 2003, level: 40, label: "Everis" },
    { year: 2008, level: 34, label: "Norkom" },
    { year: 2010, level: 56, label: "luodaint" },
    { year: 2013, level: 46, label: "Santander" },
    { year: 2017, level: 52, label: "Abacus" },
    { year: 2018, level: 66, label: "Keeeb" },
    { year: 2019, level: 85, label: "Keeeb · Dir" },
    { year: 2021, level: 68, label: "UVE · BITA" },
    { year: 2026, level: 100, label: "Medullar · CTO", peak: true }
  ];

  function buildElevation() {
    var svg = document.getElementById("elev-svg");
    if (!svg) return;
    var W = 1000, H = 360;
    var padL = 26, padR = 26, padT = 78, padB = 46;
    var minY = 2003, maxY = 2026;
    var chartH = H - padT - padB;

    function sx(year) { return padL + (year - minY) / (maxY - minY) * (W - padL - padR); }
    function sy(level) { return padT + (1 - level / 100) * chartH; }

    var pts = CAREER.map(function (d) { return { x: sx(d.year), y: sy(d.level), d: d }; });

    var NS = "http://www.w3.org/2000/svg";
    function el(name, attrs) {
      var n = document.createElementNS(NS, name);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      return n;
    }

    // gradient fill under the line
    var defs = el("defs", {});
    var grad = el("linearGradient", { id: "elevGrad", x1: "0", y1: "0", x2: "0", y2: "1" });
    grad.appendChild(el("stop", { offset: "0", "stop-color": "var(--pine)", "stop-opacity": "0.22" }));
    grad.appendChild(el("stop", { offset: "1", "stop-color": "var(--pine)", "stop-opacity": "0" }));
    defs.appendChild(grad);
    svg.appendChild(defs);

    // faint vertical grid + year axis
    pts.forEach(function (p) {
      svg.appendChild(el("line", { x1: p.x, y1: padT - 8, x2: p.x, y2: H - padB,
        stroke: "var(--line)", "stroke-width": "1" }));
      var yr = el("text", { x: p.x, y: H - padB + 22, "text-anchor": "middle", class: "elev-axis" });
      yr.textContent = p.d.year === 2026 ? "now" : String(p.d.year);
      svg.appendChild(yr);
    });

    var lineD = pts.map(function (p, i) { return (i ? "L" : "M") + p.x.toFixed(1) + " " + p.y.toFixed(1); }).join(" ");
    var fillD = "M" + pts[0].x.toFixed(1) + " " + (H - padB) + " " +
      pts.map(function (p) { return "L" + p.x.toFixed(1) + " " + p.y.toFixed(1); }).join(" ") +
      " L" + pts[pts.length - 1].x.toFixed(1) + " " + (H - padB) + " Z";

    svg.appendChild(el("path", { d: fillD, class: "elev-fill" }));
    var line = el("path", { d: lineD, class: "elev-line" });
    svg.appendChild(line);

    // summits + labels (stagger label height to avoid collisions)
    pts.forEach(function (p, i) {
      var c = el("circle", { cx: p.x, cy: p.y, r: p.d.peak ? 7 : 5,
        class: "elev-summit" + (p.d.peak ? " is-peak" : "") });
      svg.appendChild(c);
      var ly = p.y - 16 - (i % 2 ? 15 : 0);
      var anchor = i === 0 ? "start" : (i === pts.length - 1 ? "end" : "middle");
      var t = el("text", { x: p.x, y: ly, "text-anchor": anchor, class: "elev-label" });
      var b = el("tspan", {}); b.setAttribute("class", "b"); b.textContent = p.d.label;
      b.style.fill = "var(--ink)"; b.style.fontWeight = "600";
      t.appendChild(b);
      svg.appendChild(t);
    });

    // set dash length for draw animation
    var len = line.getTotalLength ? line.getTotalLength() : 2600;
    document.querySelector(".elevation-frame").style.setProperty("--len", len);
  }

  /* ---------- 2. Scroll reveal ---------- */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (reduce || !("IntersectionObserver" in window)) {
      items.forEach(function (n) { n.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (n) { io.observe(n); });
  }

  /* ---------- 3. Scrollspy ---------- */
  function initNav() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".pagenav a"));
    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      var sec = document.getElementById(id);
      if (sec) map[id] = a;
    });
    var sections = Object.keys(map).map(function (id) { return document.getElementById(id); });
    if (!("IntersectionObserver" in window) || !sections.length) return;
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (l) { l.classList.remove("active"); });
          if (map[e.target.id]) map[e.target.id].classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });
  }

  function init() { buildElevation(); initReveal(); initNav(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
