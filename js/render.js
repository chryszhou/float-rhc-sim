/* ===================================================================
   RHC Sim — canvas rendering
   -------------------------------------------------------------------
   · Scope    : scrolling ECG strip + pressure tracing (colored by the
                current catheter position), with an end-expiration band
                and a freeze/hover measurement cursor.
   · Pullback : static composite RA→RV→PA→wedge reference figure on a
                shared mmHg scale.
   · Heart    : updates the SVG catheter map (chamber highlight + tip).
   =================================================================== */
(function (RHC) {
  "use strict";

  function css(varName, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(varName);
    return (v && v.trim()) || fallback;
  }
  function setupHiDPI(canvas) {
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: rect.width, h: rect.height };
  }
  // scope stays dark in both themes → fixed instrument colors
  var GRID = "#101822", ZERO = "#26303f", AXIS = "#7c8aa0";

  function posColors() {
    return {
      RA: css("--c-ra", "#45c8ff"), RV: css("--c-rv", "#46d38a"),
      PA: css("--c-pa", "#ffce4a"), PCWP: css("--c-pcwp", "#b79bff")
    };
  }
  function niceStep(range) {
    return range <= 16 ? 4 : range <= 30 ? 5 : range <= 60 ? 10 : range <= 120 ? 20 : 25;
  }

  /* ============================================================
     Scope — rolling ECG + pressure
     ============================================================ */
  function Scope(els) {
    this.cvEcg = els.ecg;
    this.cvP = els.pressure;
    this.windowSec = 6;
    this.samples = [];     // { t, ecg, p, eExp, pos }
    this.t = 0;
    this.pmin = 0; this.pmax = 30;
    this.cursor = null;
    this.frozen = false;
    this.col = posColors();
  }
  Scope.prototype.reset = function () { this.samples = []; this.cursor = null; };
  Scope.prototype.setCursor = function (f) { this.cursor = f; };
  Scope.prototype.refreshColors = function () { this.col = posColors(); };

  Scope.prototype.push = function (t, out, pos) {
    this.t = t;
    this.samples.push({ t: t, ecg: out.ecg, p: out.p, eExp: out.eExp, pos: pos });
    var cutoff = t - this.windowSec - 0.5;
    if (this.samples.length > 4 && this.samples[0].t < cutoff) {
      var i = 0; while (i < this.samples.length && this.samples[i].t < cutoff) i++;
      if (i > 0) this.samples.splice(0, i);
    }
  };

  Scope.prototype._sampleAtFrac = function (frac) {
    var n = this.samples.length; if (!n) return null;
    var tt = (this.t - this.windowSec) + frac * this.windowSec;
    var lo = 0, hi = n - 1;
    while (lo < hi) { var mid = (lo + hi) >> 1; if (this.samples[mid].t < tt) lo = mid + 1; else hi = mid; }
    if (lo > 0 && Math.abs(this.samples[lo - 1].t - tt) < Math.abs(this.samples[lo].t - tt)) lo--;
    return this.samples[lo];
  };

  Scope.prototype.draw = function () {
    this._drawEcg();
    this._drawPressure();
  };

  Scope.prototype._timeMap = function (w) {
    var t1 = this.t, t0 = t1 - this.windowSec;
    return function (t) { return (t - t0) / (t1 - t0) * w; };
  };

  Scope.prototype._drawEcg = function () {
    var d = setupHiDPI(this.cvEcg), ctx = d.ctx, w = d.w, h = d.h;
    ctx.clearRect(0, 0, w, h);
    var s = this.samples, x = this._timeMap(w);
    var lo = -0.4, hi = 1.15, pad = 5;
    var y = function (v) { return h - pad - (v - lo) / (hi - lo) * (h - 2 * pad); };
    // faint baseline
    ctx.strokeStyle = GRID; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, y(0)); ctx.lineTo(w, y(0)); ctx.stroke();
    if (s.length < 2) return;
    ctx.beginPath(); ctx.lineWidth = 1.4; ctx.strokeStyle = css("--c-ecg", "#59e08a"); ctx.lineJoin = "round";
    for (var i = 0; i < s.length; i++) {
      var sx = x(s[i].t), sy = y(s[i].ecg);
      if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  };

  Scope.prototype._drawPressure = function () {
    var d = setupHiDPI(this.cvP), ctx = d.ctx, w = d.w, h = d.h;
    var s = this.samples, x = this._timeMap(w), pad = 8;
    ctx.clearRect(0, 0, w, h);

    // ---- autorange (expand fast, shrink slow) ----
    var lo = 1e9, hi = -1e9;
    for (var i = 0; i < s.length; i++) { var v = s[i].p; if (v < lo) lo = v; if (v > hi) hi = v; }
    if (lo === 1e9) { lo = 0; hi = 30; }
    var tMax = Math.max(10, hi + Math.max(2, (hi - lo) * 0.12));
    var tMin = Math.min(0, lo - 2);
    this.pmax += (tMax - this.pmax) * (tMax > this.pmax ? 0.4 : 0.08);
    this.pmin += (tMin - this.pmin) * (tMin < this.pmin ? 0.4 : 0.08);
    var pmin = this.pmin, pmax = this.pmax;
    var y = function (v) { return h - pad - (v - pmin) / (pmax - pmin) * (h - 2 * pad); };

    // ---- end-expiration shading (read pressures here) ----
    if (s.length > 1) {
      ctx.fillStyle = "rgba(255,158,199,0.06)";
      var run = null;
      for (var e = 0; e < s.length; e++) {
        if (s[e].eExp && run === null) run = s[e].t;
        if ((!s[e].eExp || e === s.length - 1) && run !== null) {
          var x0 = x(run), x1 = x(s[e].t);
          ctx.fillRect(x0, 0, Math.max(1, x1 - x0), h);
          run = null;
        }
      }
    }

    // ---- pressure gridlines + scale labels (mmHg) ----
    var step = niceStep(pmax - pmin);
    ctx.strokeStyle = GRID; ctx.fillStyle = AXIS; ctx.font = "9px monospace"; ctx.lineWidth = 1;
    ctx.textBaseline = "middle"; ctx.textAlign = "left";
    var start = Math.ceil(pmin / step) * step;
    for (var g = start; g <= pmax; g += step) {
      var gy = y(g);
      ctx.strokeStyle = (g === 0) ? ZERO : GRID;
      ctx.beginPath(); ctx.moveTo(22, gy); ctx.lineTo(w, gy); ctx.stroke();
      ctx.fillText(String(g), 2, gy);
    }
    // vertical time gridlines (1 s)
    ctx.strokeStyle = GRID;
    var x0t = this.t - this.windowSec;
    for (var ts = Math.ceil(x0t); ts <= this.t; ts++) {
      var px = x(ts); ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, h); ctx.stroke();
    }

    if (s.length < 2) return;

    // ---- trace, colored by each sample's catheter position ----
    ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.lineCap = "round";
    var curPos = null;
    for (var k = 0; k < s.length; k++) {
      if (s[k].pos !== curPos) {
        if (curPos !== null) ctx.stroke();
        ctx.beginPath();
        ctx.strokeStyle = this.col[s[k].pos] || "#fff";
        curPos = s[k].pos;
        ctx.moveTo(x(s[k].t), y(s[k].p));
      } else {
        ctx.lineTo(x(s[k].t), y(s[k].p));
      }
    }
    ctx.stroke();

    // ---- freeze-mode measurement cursor ----
    if (this.frozen && this.cursor != null) {
      var cx = this.cursor * w, cs = this._sampleAtFrac(this.cursor);
      ctx.strokeStyle = "rgba(232,240,252,0.5)"; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke(); ctx.setLineDash([]);
      if (cs) {
        var col = this.col[cs.pos] || "#fff", cyv = y(cs.p);
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx, cyv, 3.2, 0, 2 * Math.PI); ctx.fill();
        var label = Math.round(cs.p) + " mmHg";
        ctx.font = "bold 12px monospace";
        var bw = ctx.measureText(label).width + 12, bh = 17;
        var bx = cx + 8; if (bx + bw > w - 2) bx = cx - 8 - bw; if (bx < 2) bx = 2;
        var by = cyv - bh - 7; if (by < 2) by = cyv + 7; if (by + bh > h - 2) by = h - 2 - bh;
        ctx.fillStyle = "rgba(4,7,12,0.92)"; ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
        ctx.fillStyle = col; ctx.textBaseline = "middle"; ctx.textAlign = "left";
        ctx.fillText(label, bx + 6, by + bh / 2 + 0.5);
      }
    } else if (this.frozen) {
      ctx.fillStyle = "rgba(124,138,160,0.85)"; ctx.font = "10px monospace";
      ctx.textBaseline = "top"; ctx.textAlign = "right";
      ctx.fillText("hover to measure ↔", w - 6, 3); ctx.textAlign = "left";
    }
  };

  /* ============================================================
     Pullback — static composite RA→RV→PA→wedge reference
     ============================================================ */
  function Pullback(canvas) { this.canvas = canvas; this.hemo = null; }
  Pullback.prototype.setCase = function (h) { this.hemo = h; };
  Pullback.prototype.draw = function () {
    var d = setupHiDPI(this.canvas), ctx = d.ctx, w = d.w, h = d.h;
    ctx.clearRect(0, 0, w, h);
    if (!this.hemo) return;
    var hemo = this.hemo, col = posColors();
    var order = ["RA", "RV", "PA", "PCWP"];
    var beats = 2.4, padL = 26, padTop = 8, padBot = 16;
    var plotW = w - padL, segW = plotW / 4;

    // shared y-range across all positions
    var hi = -1e9, lo = 1e9;
    for (var oi = 0; oi < 4; oi++) {
      for (var ph = 0; ph < 1; ph += 0.02) {
        var v = RHC.sampleP(order[oi], ph, hemo);
        if (v > hi) hi = v; if (v < lo) lo = v;
      }
    }
    var pmax = Math.max(10, hi * 1.1), pmin = Math.min(0, lo - 2);
    var y = function (v) { return h - padBot - (v - pmin) / (pmax - pmin) * (h - padTop - padBot); };
    var step = niceStep(pmax - pmin);

    // gridlines + labels
    ctx.strokeStyle = GRID; ctx.fillStyle = AXIS; ctx.font = "9px monospace"; ctx.lineWidth = 1;
    ctx.textBaseline = "middle"; ctx.textAlign = "left";
    for (var g = Math.ceil(pmin / step) * step; g <= pmax; g += step) {
      var gy = y(g);
      ctx.strokeStyle = (g === 0) ? ZERO : GRID;
      ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(w, gy); ctx.stroke();
      ctx.fillText(String(g), 2, gy);
    }

    // each segment
    for (var si = 0; si < 4; si++) {
      var pos = order[si], x0 = padL + si * segW;
      // divider + label
      if (si > 0) {
        ctx.strokeStyle = "#1c2636"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x0, padTop); ctx.lineTo(x0, h - padBot); ctx.stroke();
      }
      ctx.fillStyle = col[pos]; ctx.font = "bold 10px monospace";
      ctx.textBaseline = "top"; ctx.textAlign = "left";
      ctx.fillText(pos, x0 + 5, 3);
      // trace
      ctx.beginPath(); ctx.lineWidth = 1.7; ctx.strokeStyle = col[pos]; ctx.lineJoin = "round";
      var n = Math.max(40, Math.floor(segW));
      for (var p = 0; p <= n; p++) {
        var frac = p / n, ph2 = (frac * beats) % 1;
        var val = RHC.sampleP(pos, ph2, hemo);
        var sx = x0 + frac * segW, sy = y(val);
        if (p === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }
  };

  /* ============================================================
     Heart — SVG catheter map updater
     ============================================================ */
  var TIP = { RA: [76, 62], RV: [80, 150], PA: [166, 58], PCWP: [220, 80] };
  var SEG_FOR_IDX = ["seg-enter", "seg-ra", "seg-rv", "seg-pa"]; // shown cumulatively
  var ORDER = ["RA", "RV", "PA", "PCWP"];
  function Heart(svg) { this.svg = svg; }
  Heart.prototype.update = function (pos) {
    var idx = ORDER.indexOf(pos);
    // chamber highlight
    ["ch-ra", "ch-rv", "ch-pa", "ch-pcwp"].forEach(function (id) {
      var el = document.getElementById(id); if (el) el.classList.remove("active");
    });
    var act = { RA: "ch-ra", RV: "ch-rv", PA: "ch-pa", PCWP: "ch-pcwp" }[pos];
    var ae = document.getElementById(act); if (ae) ae.classList.add("active");
    // cumulative catheter segments
    for (var i = 0; i < SEG_FOR_IDX.length; i++) {
      var seg = document.getElementById(SEG_FOR_IDX[i]);
      if (seg) seg.classList.toggle("on", i <= idx);
    }
    // tip
    var tip = document.getElementById("cathTip"), a = TIP[pos];
    if (tip && a) tip.setAttribute("transform", "translate(" + a[0] + "," + a[1] + ")");
  };

  RHC.Scope = Scope;
  RHC.Pullback = Pullback;
  RHC.Heart = Heart;

})(window.RHC = window.RHC || {});
