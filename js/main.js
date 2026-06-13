/* ===================================================================
   RHC Sim — application bootstrap & real-time loop
   =================================================================== */
(function (RHC) {
  "use strict";

  var DT = 0.005;        // fixed cardiac timestep (s)
  var MAX_FRAME = 0.1;   // clamp big gaps (backgrounded tab)
  var AUTO_RATE = 7;     // catheter depth units / second during auto-advance

  var app = {
    sim: new RHC.Simulator(),
    scope: null, pullback: null, heart: null,
    frozen: false, speed: 1,
    quiz: false, revealed: false,
    cathVel: 0,          // set by holding Advance/Withdraw (depth units/sec)
    autoSweep: false,    // continuous RA→wedge sweep
    loadCase: loadCase,
    loadRandomCase: loadRandomCase,
    toggleAuto: toggleAuto,
    stopAuto: stopAuto
  };

  function loadCase(id) {
    var c = RHC.caseById(id);
    app.sim.loadCase(c);
    app.revealed = false;
    app.scope.reset();
    app.pullback.setCase(app.sim.hemo);
    RHC.UI.syncPatient();
    RHC.UI.refreshMonitors();
    RHC.UI.markActiveCase(id);
    RHC.UI.onDepthChange();   // refresh label/heart/banner/gauge for current depth
    RHC.UI.showTeaching(c);
  }

  function loadRandomCase() {
    var i = Math.floor(Math.random() * RHC.CASES.length);
    loadCase(RHC.CASES[i].id);
  }

  function startAuto() {
    if (app.sim.depth >= RHC.DEPTH.max - 1) app.sim.setDepth(0);  // restart sweep from the top
    app.autoSweep = true; app.cathVel = 0;
    RHC.UI.setAutoBtn(true);
  }
  function stopAuto() { app.autoSweep = false; RHC.UI.setAutoBtn(false); }
  function toggleAuto() { if (app.autoSweep) stopAuto(); else startAuto(); }

  function init() {
    app.scope = new RHC.Scope({
      ecg: document.getElementById("cvEcg"),
      pressure: document.getElementById("cvPressure")
    });
    app.pullback = new RHC.Pullback(document.getElementById("cvPullback"));
    app.heart = new RHC.Heart(document.getElementById("heartSvg"));
    RHC.UI.init(app);
    loadCase("normal");
    RHC.app = app; // exposed for debugging

    // freeze-mode measurement cursor: track pointer across the pressure scope
    var scopeEl = document.getElementById("scope");
    var ref = document.getElementById("cvPressure");
    scopeEl.addEventListener("mousemove", function (e) {
      var rect = ref.getBoundingClientRect();
      var frac = (e.clientX - rect.left) / rect.width;
      app.scope.setCursor(frac < 0 ? 0 : frac > 1 ? 1 : frac);
    });
    scopeEl.addEventListener("mouseleave", function () { app.scope.setCursor(null); });

    var acc = 0, last = performance.now();
    function frame(now) {
      var elapsed = (now - last) / 1000; last = now;
      if (elapsed > MAX_FRAME) elapsed = MAX_FRAME;

      // ---- continuous catheter motion (auto sweep or held buttons) ----
      var dmove = 0;
      if (app.autoSweep) dmove = AUTO_RATE * elapsed;
      if (app.cathVel) { dmove = app.cathVel * elapsed; if (app.autoSweep) stopAuto(); }
      if (dmove) {
        app.sim.setDepth(app.sim.depth + dmove);
        if (app.autoSweep && app.sim.depth >= RHC.DEPTH.max) stopAuto();
        RHC.UI.onDepthChange();
      }

      // ---- advance the waveform ----
      if (!app.frozen) {
        var col = RHC.depthColor(app.sim.depth);   // one color lookup per frame
        acc += elapsed * app.speed;
        var steps = 0;
        while (acc >= DT && steps < 800) {
          app.sim.step(DT);
          app.scope.push(app.sim.t, app.sim.out, col);
          acc -= DT; steps++;
        }
      }

      app.scope.frozen = app.frozen;
      app.scope.draw();
      app.pullback.draw();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})(window.RHC = window.RHC || {});
