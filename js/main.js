/* ===================================================================
   RHC Sim — application bootstrap & real-time loop
   =================================================================== */
(function (RHC) {
  "use strict";

  var DT = 0.005;        // fixed cardiac timestep (s)
  var MAX_FRAME = 0.1;   // clamp big gaps (backgrounded tab)
  var ORDER = ["RA", "RV", "PA", "PCWP"];

  var app = {
    sim: new RHC.Simulator(),
    scope: null, pullback: null, heart: null,
    frozen: false, speed: 1,
    quiz: false, revealed: false,
    autoTimer: null,
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
    RHC.UI.setPosition(app.sim.position);   // refresh label/heart/banner for current position
    RHC.UI.showTeaching(c);
  }

  function loadRandomCase() {
    var i = Math.floor(Math.random() * RHC.CASES.length);
    loadCase(RHC.CASES[i].id);
  }

  function startAuto() {
    stopAuto();
    RHC.UI.setAutoBtn(true);
    var i = 0;
    RHC.UI.setPosition("RA");
    app.autoTimer = setInterval(function () {
      i++;
      if (i > 3) { stopAuto(); return; }
      RHC.UI.setPosition(ORDER[i]);
    }, 2800);
  }
  function stopAuto() {
    if (app.autoTimer) { clearInterval(app.autoTimer); app.autoTimer = null; }
    RHC.UI.setAutoBtn(false);
  }
  function toggleAuto() { if (app.autoTimer) stopAuto(); else startAuto(); }

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
      if (!app.frozen) {
        acc += elapsed * app.speed;
        var steps = 0;
        while (acc >= DT && steps < 800) {
          app.sim.step(DT);
          app.scope.push(app.sim.t, app.sim.out, app.sim.position);
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
