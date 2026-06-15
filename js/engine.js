/* ===================================================================
   Float — hemodynamic waveform engine
   -------------------------------------------------------------------
   Pressure waveforms are *synthesized* from morphology parameters
   (not solved from a chamber ODE) so every teaching feature — a/c/v
   waves, x/y descents, dip-and-plateau, dicrotic notch, giant v —
   is under direct, recognizable control. A cardiac-phase clock drives
   the cycle and a respiratory-phase clock adds the baseline sway that
   makes end-expiration the right place to read a pressure.

   Phase convention: φ ∈ [0,1), φ = 0 is the onset of ventricular
   systole (the QRS). Systole occupies the first ~0.33 of the cycle.
   =================================================================== */
(function (RHC) {
  "use strict";

  var TS = 0.33;   // systolic fraction of the cardiac cycle

  function wrap(x) { return x - Math.floor(x); }
  // signed distance from phase `ph` to center `c`, wrapped to [-0.5, 0.5]
  function dd(ph, c) { var d = ph - c; if (d > 0.5) d -= 1; else if (d < -0.5) d += 1; return d; }
  function gauss(ph, c, s) { var d = dd(ph, c); return Math.exp(-(d * d) / (2 * s * s)); }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  /* ---------- ECG (timing reference, arbitrary units) ---------- */
  function ecgAt(ph) {
    var e = 0;
    e += 0.16 * gauss(ph, 0.86, 0.020);  // P wave (atrial depol — precedes QRS)
    e += -0.07 * gauss(ph, 0.985, 0.006); // Q
    e += 1.00 * gauss(ph, 0.015, 0.006);  // R
    e += -0.18 * gauss(ph, 0.045, 0.009); // S
    e += 0.24 * gauss(ph, 0.32, 0.030);   // T wave (repolarization)
    return e;
  }

  /* ---------- Atrial-type waveform: RA and PCWP/wedge ----------
     Baseline (= mean) + Gaussian a/c/v peaks − Gaussian x/y descents.
     `a` and `v` are the ABSOLUTE peak pressures of the a and v waves, so
     we add only their excursion above the mean (which may be negative — a
     wave authored at/below the mean reads as a damped/absent wave, e.g. the
     small a beside MR's giant v). x/y descent defaults scale off the crest
     height above the mean plus a small floor so every tracing keeps a
     visible descent. Every fiducial is independently tunable so a case can
     produce a giant v wave, an absent x, a deep y, etc.                   */
  function atrialWaveAt(ph, p, wedge) {
    var b = p.mean;
    var a = (p.a != null) ? p.a : b, c = p.c || 0, v = (p.v != null) ? p.v : b;
    var aAmp = a - b, vAmp = v - b;                 // a/v are absolute peaks
    var aP = aAmp > 0 ? aAmp : 0, vP = vAmp > 0 ? vAmp : 0;
    var x = (p.x != null) ? p.x : (wedge ? 0.5 * aP + 1.2 : 0.6 * aP + 1.0);
    var y = (p.y != null) ? p.y : (wedge ? 0.6 * vP + 1.8 : 0.6 * vP + 1.0);
    var aPos = (p.aPos != null) ? p.aPos : (wedge ? 0.96 : 0.90);
    var vPos = (p.vPos != null) ? p.vPos : (wedge ? 0.55 : 0.47);
    var sa = wedge ? 0.050 : 0.038;
    var sv = (p.vW != null) ? p.vW : (wedge ? 0.060 : 0.045);
    var val = b;
    val += aAmp * gauss(ph, aPos, sa);              // a wave → peaks at `a`
    // c wave (tricuspid closure, RA only): small notch kept below the a crest
    if (!wedge) val += Math.min(c, 0.6 * aP) * gauss(ph, 0.08, 0.022);
    val += vAmp * gauss(ph, vPos, sv);              // v wave → peaks at `v`
    val -= x * gauss(ph, 0.27, 0.040);              // x descent (mmHg below mean)
    val -= y * gauss(ph, 0.66, 0.045);              // y descent
    return val;
  }

  /* ---------- Right ventricle ----------
     Systolic dome over a diastolic baseline that dips early then
     fills to end-diastolic pressure (with an atrial kick). The
     `plateau` flag turns the filling into the rapid rise + flat
     "dip-and-plateau" / square-root sign of constriction/restriction. */
  function rvWaveAt(ph, p) {
    var sys = p.sys, edp = p.edp;
    var diaMin = (p.diaMin != null) ? p.diaMin : Math.max(0, edp - 3);
    var dome = Math.exp(-Math.pow(dd(ph, 0.15) / 0.105, 2));
    var dbase;
    if (ph < TS) {
      dbase = edp;                                  // (contraction rides on top of this)
    } else {
      var d = (ph - TS) / (1 - TS);
      var fill = p.plateau ? (1 - Math.exp(-d / 0.10)) : Math.pow(d, 0.6);
      dbase = diaMin + (edp - diaMin) * fill;
    }
    dbase += (p.aKick != null ? p.aKick : 1.2) * gauss(ph, 0.88, 0.025);
    return dbase + (sys - dbase) * dome;
  }

  /* ---------- Pulmonary artery ----------
     Ejection wave + dicrotic wave (their gap = the dicrotic notch at
     pulmonic-valve closure). Diastole runs off toward — but never to —
     the PA diastolic pressure.                                        */
  function paWaveAt(ph, p) {
    var sys = p.sys, dia = p.dia;
    var main = Math.exp(-Math.pow(dd(ph, 0.15) / 0.095, 2));
    var dicr = 0.34 * Math.exp(-Math.pow(dd(ph, 0.40) / 0.075, 2));
    var pulse = (main + dicr) / 1.04;
    return dia + (sys - dia) * pulse;
  }

  /* ---------- Respiratory baseline sway ----------
     Spontaneous inspiration lowers intrathoracic pressure (dir = −1).
     Kussmaul's sign (constriction) flips RA to rise on inspiration
     (dir = +1). Tamponade exaggerates the depth → pulsus paradoxus. */
  function respOffset(rp, depth, dir) {
    var insp = rp < 0.40 ? Math.sin(Math.PI * rp / 0.40) : 0;
    return (dir || -1) * depth * insp;
  }
  function respWeight(pos) {
    return pos === "RA" ? 1.0 : pos === "PCWP" ? 1.0 : pos === "PA" ? 0.8 : 0.5;
  }

  // pure pressure sampler — used by the live scope AND the pullback strip
  function sampleP(pos, ph, h) {
    if (pos === "RA") return atrialWaveAt(ph, h.ra, false);
    if (pos === "RV") return rvWaveAt(ph, h.rv);
    if (pos === "PA") return paWaveAt(ph, h.pa);
    return atrialWaveAt(ph, h.pcwp, true);
  }

  /* ---------- Continuous catheter depth ----------
     The catheter occupies a continuous depth (0–100). Each chamber has a
     "clean" zone; between zones the tip straddles a valve/junction and the
     tracing is a blend of the two neighbours (so the learner must seat the
     catheter to get a clean waveform). Past the last zone the balloon
     over-wedges — pulsatility damps out and the pressure drifts up.        */
  var DEPTH = {
    max: 100,
    zones: [
      { pos: "RA",   lo: 6,  hi: 24 },
      { pos: "RV",   lo: 32, hi: 50 },
      { pos: "PA",   lo: 58, hi: 76 },
      { pos: "PCWP", lo: 84, hi: 94 }
    ]
  };
  function zoneCenter(pos) {
    var z = DEPTH.zones;
    for (var i = 0; i < z.length; i++) if (z[i].pos === pos) return (z[i].lo + z[i].hi) / 2;
    return z[0].lo;
  }
  // classify a depth → { state, pos, clean, blendA, blendB, t }
  function depthInfo(d) {
    var z = DEPTH.zones;
    if (d < z[0].lo) return { state: "pre", pos: "RA", clean: false, blendA: "RA", blendB: "RA", t: 0 };
    for (var i = 0; i < z.length; i++) {
      if (d <= z[i].hi) {
        if (d >= z[i].lo) return { state: "clean", pos: z[i].pos, clean: true, blendA: z[i].pos, blendB: z[i].pos, t: 0 };
        var a = z[i - 1], b = z[i], t = (d - a.hi) / (b.lo - a.hi);
        return { state: "trans", pos: (t < 0.5 ? a.pos : b.pos), clean: false, blendA: a.pos, blendB: b.pos, t: t };
      }
    }
    var last = z[z.length - 1];
    return { state: "over", pos: "PCWP", clean: false, blendA: "PCWP", blendB: "PCWP",
             t: clamp((d - last.hi) / (DEPTH.max - last.hi), 0, 1) };
  }
  // instantaneous pressure for a continuous depth
  function pressureAtDepth(d, ph, h) {
    var info = depthInfo(d);
    if (info.state === "clean") return sampleP(info.pos, ph, h);
    if (info.state === "pre") { var ra = sampleP("RA", ph, h), m = h.ra.mean; return m + 0.45 * (ra - m); }
    if (info.state === "over") {
      var w = sampleP("PCWP", ph, h), wm = h.pcwp.mean, t = info.t;
      return (wm + (w - wm) * (1 - 0.85 * t)) + t * 10;   // damp pulsatility + upward drift
    }
    var pa = sampleP(info.blendA, ph, h), pb = sampleP(info.blendB, ph, h);
    return pa * (1 - info.t) + pb * info.t;               // straddling-valve blend
  }

  /* ===================================================================
     Simulator — clocks, current-position output, derived hemodynamics
     =================================================================== */
  function Simulator() {
    this.t = 0;
    this.cardPhase = 0;
    this.respPhase = 0;
    this.depth = zoneCenter("RA");   // continuous catheter depth (0–100)
    this.position = "RA";            // derived dominant chamber (label/color)
    this.hemo = null;
    this.out = { p: 0, ecg: 0, phase: 0, resp: 0, eExp: false };
    this.meas = {};
  }

  Simulator.prototype.loadCase = function (c) {
    // deep-ish clone so live HR/RR edits never mutate the case library
    this.hemo = JSON.parse(JSON.stringify(c.hemo));
    if (!this.hemo.resp) this.hemo.resp = { depth: 2, dir: -1 };
    this.hr = this.hemo.hr;
    this.rr = this.hemo.rr;
    this.computeDerived();
  };

  Simulator.prototype.setDepth = function (d) {
    this.depth = clamp(d, 0, DEPTH.max);
    this.position = depthInfo(this.depth).pos;  // keep derived chamber in sync
  };
  Simulator.prototype.setPosition = function (pos) { this.setDepth(zoneCenter(pos)); };

  Simulator.prototype.step = function (dt) {
    this.t += dt;
    this.cardPhase = wrap(this.cardPhase + dt * this.hr / 60);
    this.respPhase = wrap(this.respPhase + dt * this.rr / 60);
    var roff = respOffset(this.respPhase, this.hemo.resp.depth, this.hemo.resp.dir);
    this.out.ecg = ecgAt(this.cardPhase);
    this.out.p = pressureAtDepth(this.depth, this.cardPhase, this.hemo) + roff * respWeight(this.position);
    this.out.phase = this.cardPhase;
    this.out.resp = this.respPhase;
    this.out.eExp = (this.respPhase >= 0.80);   // end-expiration window
    return {};
  };

  // recompute derived hemodynamics from the stored profile + live HR
  Simulator.prototype.computeDerived = function () {
    var h = this.hemo;
    var map = (h.sbp + 2 * h.dbp) / 3;
    var co = h.co;
    var sv = co / this.hr * 1000;
    var pvrWood = (h.pa.mean - h.pcwp.mean) / co;
    this.meas = {
      // pressures (pass-through, authoritative)
      raMean: h.ra.mean,
      rvSys: h.rv.sys, rvEdp: h.rv.edp,
      paSys: h.pa.sys, paDia: h.pa.dia, paMean: h.pa.mean,
      pcwp: h.pcwp.mean,
      // derived
      map: map,
      co: co,
      ci: co / h.bsa,
      sv: sv,
      svi: sv / h.bsa,
      svr: (map - h.ra.mean) * 80 / co,
      pvr: pvrWood * 80,
      pvrWood: pvrWood,
      tpg: h.pa.mean - h.pcwp.mean,
      dpg: h.pa.dia - h.pcwp.mean,
      svo2: h.svo2,
      sao2: h.sao2
    };
    return this.meas;
  };

  // expose pure helpers for the renderer
  RHC.sampleP = sampleP;
  RHC.ecgAt = ecgAt;
  RHC.TS = TS;
  RHC.DEPTH = DEPTH;
  RHC.depthInfo = depthInfo;
  RHC.zoneCenter = zoneCenter;
  RHC.pressureAtDepth = pressureAtDepth;
  RHC.Simulator = Simulator;

})(window.RHC = window.RHC || {});
