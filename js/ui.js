/* ===================================================================
   RHC Sim — UI: catheter controls, pressure & derived panels,
   case library, teaching panel, quiz mode, chrome
   =================================================================== */
(function (RHC) {
  "use strict";

  var ORDER = ["RA", "RV", "PA", "PCWP"];
  var POS_VAR = { RA: "--c-ra", RV: "--c-rv", PA: "--c-pa", PCWP: "--c-pcwp" };
  var BANNER = {
    RA:   "Right atrium — mean ≈ CVP. Identify a, c, v waves; read at end-expiration (shaded).",
    RV:   "Right ventricle — tall systolic spike; note the low diastole and the end-diastolic pressure (RVEDP).",
    PA:   "Pulmonary artery — find the dicrotic notch. PA diastolic ≈ wedge when PVR is normal.",
    PCWP: "Wedge — surrogate for left atrial / LV filling pressure. Read the a wave at end-expiration."
  };

  // patient sliders
  var PATIENT = [
    { key: "hr", label: "Heart rate", unit: "bpm", min: 40, max: 150, step: 1 },
    { key: "rr", label: "Resp rate", unit: "/min", min: 6, max: 40, step: 1 }
  ];

  // right-column pressure readouts (mmHg)
  var PRESSURES = [
    { id: "raMean", label: "RA mean", high: 8, crit: 15 },
    { id: "pcwp", label: "PCWP", high: 15, crit: 22 },
    { id: "rv", label: "RV", combo: true },
    { id: "pa", label: "PA", combo: true },
    { id: "paMean", label: "PA mean", high: 20, crit: 35, full: true }
  ];

  // derived hemodynamics + saturations
  var DERIVED = [
    { key: "co", label: "CO", unit: "L/min", dp: 1, low: 4, high: 8 },
    { key: "ci", label: "CI", unit: "L/min/m²", dp: 2, low: 2.5, high: 4.2, critLow: 1.8 },
    { key: "svr", label: "SVR", unit: "dyn·s/cm⁵", dp: 0, low: 800, high: 1200 },
    { key: "pvrWood", label: "PVR", unit: "WU", dp: 1, high: 3, critHigh: 5, dynKey: "pvr" },
    { key: "tpg", label: "TPG", unit: "mmHg", dp: 0, high: 12 },
    { key: "dpg", label: "DPG", unit: "mmHg", dp: 0, high: 7 },
    { key: "sv", label: "SV", unit: "mL", dp: 0, low: 60, high: 100 },
    { key: "svo2", label: "SvO₂", unit: "%", dp: 0, low: 60, high: 80, critLow: 50 }
  ];

  var UI = {}, app, els = {}, currentCase = null;

  function colorVar(pos) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(POS_VAR[pos]);
    return (v && v.trim()) || "#fff";
  }
  function unitSmall(u) { return u ? " <small>" + u + "</small>" : ""; }
  function classify(v, c) {
    if (v == null) return "";
    if (c.critLow != null && v < c.critLow) return "crit";
    if (c.critHigh != null && v > c.critHigh) return "crit";
    if (c.crit != null && v >= c.crit) return "crit";
    if (c.low != null && v < c.low) return "warn";
    if (c.high != null && v > c.high) return "warn";
    return "";
  }

  UI.init = function (a) {
    app = a;
    els.patient = document.getElementById("patientControls");
    els.pressures = document.getElementById("pressures");
    els.derived = document.getElementById("derived");
    els.library = document.getElementById("caseLibrary");
    this.buildPatient();
    this.buildPressures();
    this.buildDerived();
    this.buildLibrary();
    this.wireCatheter();
    this.wireChrome();
  };

  /* ---------------- patient sliders ---------------- */
  UI.buildPatient = function () {
    var wrap = els.patient; wrap.innerHTML = "";
    PATIENT.forEach(function (c) {
      var d = document.createElement("div"); d.className = "ctrl";
      var head = document.createElement("div"); head.className = "ctrl-head";
      var lbl = document.createElement("span"); lbl.className = "ctrl-label"; lbl.textContent = c.label;
      var val = document.createElement("span"); val.className = "ctrl-value";
      head.appendChild(lbl); head.appendChild(val);
      var input = document.createElement("input");
      input.type = "range"; input.min = c.min; input.max = c.max; input.step = c.step;
      input.addEventListener("input", function () {
        var v = parseFloat(input.value);
        app.sim[c.key] = v;
        if (c.key === "hr") { app.sim.computeDerived(); UI.refreshMonitors(); }
        val.innerHTML = v + unitSmall(c.unit);
      });
      d._input = input; d._val = val; d._cfg = c;
      d.appendChild(head); d.appendChild(input);
      wrap.appendChild(d);
    });
  };
  UI.syncPatient = function () {
    Array.prototype.forEach.call(els.patient.children, function (d) {
      var c = d._cfg; d._input.value = app.sim[c.key]; d._val.innerHTML = app.sim[c.key] + unitSmall(c.unit);
    });
  };

  /* ---------------- pressures panel ---------------- */
  function monCell(label, full) {
    var cell = document.createElement("div"); cell.className = "mon" + (full ? " full" : "");
    var l = document.createElement("div"); l.className = "mon-label"; l.textContent = label;
    var v = document.createElement("div"); v.className = "mon-value"; v.textContent = "--";
    cell.appendChild(l); cell.appendChild(v); cell._v = v;
    return cell;
  }
  UI.buildPressures = function () {
    var g = document.createElement("div"); g.className = "mon-grid";
    PRESSURES.forEach(function (m) { var cell = monCell(m.label, m.full); m._el = cell._v; g.appendChild(cell); });
    els.pressures.innerHTML = ""; els.pressures.appendChild(g);
  };
  UI.buildDerived = function () {
    var g = document.createElement("div"); g.className = "mon-grid";
    DERIVED.forEach(function (m) { var cell = monCell(m.label, m.full); m._el = cell._v; g.appendChild(cell); });
    els.derived.innerHTML = ""; els.derived.appendChild(g);
  };

  UI.refreshMonitors = function () {
    var meas = app.sim.meas;
    PRESSURES.forEach(function (m) {
      var el = m._el; if (!el) return;
      if (m.combo && m.id === "rv") {
        el.innerHTML = Math.round(meas.rvSys) + "/" + Math.round(meas.rvEdp) + unitSmall("mmHg");
        el.className = "mon-value" + (meas.rvSys > 35 ? " warn" : "");
      } else if (m.combo && m.id === "pa") {
        el.innerHTML = Math.round(meas.paSys) + "/" + Math.round(meas.paDia) + unitSmall("mmHg");
        el.className = "mon-value" + (meas.paSys > 35 ? " warn" : "");
      } else {
        var v = meas[m.id];
        el.innerHTML = Math.round(v) + unitSmall("mmHg");
        var cls = classify(v, m); el.className = "mon-value" + (cls ? " " + cls : "");
      }
    });
    DERIVED.forEach(function (m) {
      var el = m._el; if (!el) return;
      var v = meas[m.key];
      var txt = (v == null) ? "--" : Number(v).toFixed(m.dp);
      var extra = (m.dynKey && meas[m.dynKey] != null) ? " <small>" + Math.round(meas[m.dynKey]) + " dyn</small>" : unitSmall(m.unit);
      el.innerHTML = txt + extra;
      var cls = classify(v, m); el.className = "mon-value" + (cls ? " " + cls : "");
    });
  };

  /* ---------------- catheter controls ---------------- */
  UI.wireCatheter = function () {
    document.querySelectorAll("#posSeg button").forEach(function (b) {
      b.addEventListener("click", function () { app.stopAuto(); UI.setPosition(b.dataset.pos); });
    });
    document.getElementById("btnAdvance").addEventListener("click", function () {
      app.stopAuto(); var i = ORDER.indexOf(app.sim.position); UI.setPosition(ORDER[Math.min(3, i + 1)]);
    });
    document.getElementById("btnWithdraw").addEventListener("click", function () {
      app.stopAuto(); var i = ORDER.indexOf(app.sim.position); UI.setPosition(ORDER[Math.max(0, i - 1)]);
    });
    document.getElementById("btnAuto").addEventListener("click", function () { app.toggleAuto(); });
  };

  UI.setPosition = function (pos) {
    app.sim.setPosition(pos);
    document.querySelectorAll("#posSeg button").forEach(function (b) {
      b.classList.toggle("active", b.dataset.pos === pos);
    });
    var lbl = document.getElementById("pressLabel");
    lbl.textContent = pos; lbl.style.color = colorVar(pos);
    document.getElementById("posChipVal").textContent = pos;
    document.getElementById("bannerText").textContent = BANNER[pos];
    app.heart.update(pos);
  };

  UI.setAutoBtn = function (on) {
    var b = document.getElementById("btnAuto");
    b.classList.toggle("on", on);
    b.textContent = on ? "■ Stop auto-advance" : "▶ Auto-advance (RA → wedge)";
  };

  /* ---------------- case library ---------------- */
  var CAT_LABEL = {
    baseline: "Baseline", "pulm-htn": "Pulmonary HTN", "right-heart": "Right heart",
    pericardial: "Pericardial", shock: "Shock", valve: "Valve"
  };
  UI.buildLibrary = function () {
    var grid = els.library; grid.innerHTML = "";
    RHC.CASES.forEach(function (c) {
      var card = document.createElement("button"); card.className = "case-card"; card.dataset.id = c.id;
      card.innerHTML =
        '<span class="cc-cat ' + c.cat + '">' + (CAT_LABEL[c.cat] || c.cat) + "</span>" +
        '<div class="cc-name">' + c.name + "</div>" +
        '<div class="cc-blurb">' + c.blurb + "</div>";
      card.addEventListener("click", function () { app.loadCase(c.id); });
      grid.appendChild(card);
    });
  };
  UI.markActiveCase = function (id) {
    Array.prototype.forEach.call(els.library.children, function (card) {
      card.classList.toggle("active", card.dataset.id === id);
    });
  };

  /* ---------------- teaching + quiz ---------------- */
  function fillList(id, items) {
    var ul = document.getElementById(id); ul.innerHTML = "";
    (items || []).forEach(function (it) { var li = document.createElement("li"); li.innerHTML = it; ul.appendChild(li); });
  }
  UI.showTeaching = function (c) {
    currentCase = c;
    var veiled = app.quiz && !app.revealed;
    document.getElementById("quizVeil").hidden = !veiled;
    document.getElementById("teachBody").hidden = veiled;
    document.getElementById("teachCat").style.display = veiled ? "none" : "";
    if (veiled) {
      document.getElementById("teachTitle").textContent = "Identify this case";
      document.getElementById("caseChipVal").textContent = "— quiz —";
      return;
    }
    document.getElementById("teachTitle").textContent = c.name;
    document.getElementById("teachCat").textContent = CAT_LABEL[c.cat] || c.cat;
    document.getElementById("teachDesc").innerHTML = c.desc || "";
    document.getElementById("caseChipVal").textContent = c.name;
    fillList("teachCues", c.cues);
    fillList("teachPearls", c.pearls);
  };

  /* ---------------- chrome ---------------- */
  UI.wireChrome = function () {
    var themeBtn = document.getElementById("btnTheme");
    function applyTheme(t) {
      if (t === "light") document.documentElement.setAttribute("data-theme", "light");
      else document.documentElement.removeAttribute("data-theme");
      themeBtn.textContent = (t === "light") ? "☾ Dark" : "☀ Light";
      if (app.scope) app.scope.refreshColors();
    }
    var saved = null; try { saved = localStorage.getItem("rhcTheme"); } catch (e) {}
    applyTheme(saved || "dark");
    themeBtn.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
      applyTheme(next); try { localStorage.setItem("rhcTheme", next); } catch (e) {}
    });

    var freeze = document.getElementById("btnFreeze");
    freeze.addEventListener("click", function () {
      app.frozen = !app.frozen;
      freeze.classList.toggle("frozen", app.frozen);
      freeze.textContent = app.frozen ? "▶ Run" : "❚❚ Freeze";
      document.getElementById("scope").classList.toggle("measuring", app.frozen);
    });
    document.getElementById("simSpeed").addEventListener("change", function (e) {
      app.speed = parseFloat(e.target.value);
    });

    var quizBtn = document.getElementById("btnQuiz");
    quizBtn.addEventListener("click", function () {
      app.quiz = !app.quiz;
      quizBtn.classList.toggle("on", app.quiz);
      if (app.quiz) { app.loadRandomCase(); }
      else { app.revealed = false; UI.showTeaching(currentCase); }
    });
    document.getElementById("btnReveal").addEventListener("click", function () {
      app.revealed = true; UI.showTeaching(currentCase);
    });
  };

  RHC.UI = UI;
})(window.RHC = window.RHC || {});
