/* ===================================================================
   RHC Sim — case library (hemodynamic profiles + teaching content)
   -------------------------------------------------------------------
   hemo numbers are idealized teaching values. Pressures in mmHg.
     ra/pcwp : { mean, a, c, v, x, y, [vPos, vW, aPos] }  morphology
     rv      : { sys, diaMin, edp, [plateau, aKick] }
     pa      : { sys, dia, mean }
     resp    : { depth (mmHg sway), dir (-1 insp fall, +1 Kussmaul) }
   cat: baseline | pulm-htn | right-heart | pericardial | shock | valve
   =================================================================== */
(function (RHC) {
  "use strict";

  RHC.CASES = [

  /* ---------------------------------------------------------------- */
  { id: "normal", name: "Normal study", cat: "baseline",
    blurb: "Reference waveforms and pressures for an unstressed adult.",
    hemo: {
      hr: 75, rr: 14, bsa: 1.9, hb: 14,
      ra:  { mean: 4, a: 5, c: 2.5, v: 4, x: 2.5, y: 2.5 },
      rv:  { sys: 25, diaMin: 2, edp: 4 },
      pa:  { sys: 25, dia: 10, mean: 15 },
      pcwp:{ mean: 9, a: 11, v: 12 },
      co: 6.0, svo2: 70, sao2: 98, sbp: 118, dbp: 72,
      resp: { depth: 2, dir: -1 }
    },
    desc: "A normal right heart catheterization. As the catheter is advanced from the right atrium to the wedge position, the waveform changes character at each chamber — learn this sequence first; every pathology is a deviation from it.",
    cues: [
      "<b>RA</b>: low mean (2–6), gentle <b>a</b> and <b>v</b> waves with <b>x</b> and <b>y</b> descents; a ≳ v.",
      "<b>RV</b>: tall systolic spike, <b>low early-diastolic pressure</b> that fills to a small end-diastolic value.",
      "<b>PA</b>: same systolic pressure as the RV, a <b>dicrotic notch</b>, and a diastole that <b>does not fall to zero</b>.",
      "<b>PCWP</b>: damped atrial waveform (a and v waves), mean ≈ left atrial pressure (6–12)."
    ],
    pearls: [
      "PA <b>diastolic</b> ≈ PCWP when pulmonary vascular resistance is normal — a >5 mmHg gap suggests pre-capillary disease.",
      "Read all pressures at <b>end-expiration</b>, where pleural pressure is closest to zero.",
      "Normal <b>PVR</b> ≈ 1 Wood unit; normal <b>cardiac index</b> 2.5–4 L/min/m²."
    ]
  },

  /* ---------------------------------------------------------------- */
  { id: "pah", name: "Pulmonary arterial hypertension", cat: "pulm-htn",
    blurb: "Group 1 PH: severe pre-capillary PH with a normal wedge and high PVR.",
    hemo: {
      hr: 82, rr: 16, bsa: 1.8, hb: 15,
      ra:  { mean: 8, a: 12, c: 3, v: 7, x: 4, y: 3 },
      rv:  { sys: 85, diaMin: 6, edp: 12 },
      pa:  { sys: 85, dia: 35, mean: 52 },
      pcwp:{ mean: 10, a: 11, v: 10 },
      co: 3.8, svo2: 60, sao2: 95, sbp: 110, dbp: 70,
      resp: { depth: 2, dir: -1 }
    },
    desc: "Group 1 pulmonary arterial hypertension: the small pulmonary arteries remodel and obliterate, driving a high pre-capillary resistance. The PA pressure is markedly elevated while the wedge stays normal — the gradient across the lung is the whole story.",
    cues: [
      "<b>PA</b>: high systolic and especially high <b>diastolic</b> pressure, mean often >40.",
      "<b>PCWP</b>: <b>normal</b> (≤15) — the lesion is upstream of the capillary bed.",
      "<b>RV</b>: high systolic pressure with a prominent end-diastolic step; chronic load lets it reach 80+.",
      "<b>RA</b>: prominent <b>a</b> wave as the atrium contracts against a stiff, hypertrophied RV."
    ],
    pearls: [
      "Defining numbers: mPAP >20, <b>PCWP ≤15</b>, <b>PVR ≥2 Wood units</b> → pre-capillary PH.",
      "A wide <b>transpulmonary gradient</b> (mPAP − PCWP) and high <b>DPG</b> separate this from left-heart PH.",
      "A rising <b>RA pressure</b> with a falling cardiac index signals RV failure — the main driver of mortality."
    ]
  },

  /* ---------------------------------------------------------------- */
  { id: "ph-lhd", name: "PH from left heart disease", cat: "pulm-htn",
    blurb: "Group 2 (post-capillary) PH: high wedge but a NORMAL transpulmonary gradient.",
    hemo: {
      hr: 80, rr: 18, bsa: 1.95, hb: 13,
      ra:  { mean: 12, a: 13, c: 3, v: 11, x: 5, y: 5 },
      rv:  { sys: 55, diaMin: 10, edp: 14 },
      pa:  { sys: 55, dia: 28, mean: 38 },
      pcwp:{ mean: 26, a: 24, v: 28 },
      co: 4.2, svo2: 62, sao2: 96, sbp: 135, dbp: 80,
      resp: { depth: 2, dir: -1 }
    },
    desc: "Pulmonary hypertension driven by left-heart disease (HFpEF/HFrEF, valve disease). Elevated left atrial pressure backs up passively into the lung. The contrast with Group 1 PAH is the single most important teaching point on this screen.",
    cues: [
      "<b>PCWP</b>: clearly <b>elevated</b> (>15) — this is post-capillary PH.",
      "<b>PA diastolic</b> tracks the wedge closely → small <b>diastolic pressure gradient (DPG)</b>.",
      "<b>Transpulmonary gradient</b> (mPAP − PCWP) stays near normal in pure post-capillary disease.",
      "<b>RA</b> and RV end-diastolic pressures are elevated from the downstream congestion."
    ],
    pearls: [
      "PAH vs Group 2 hinges on the <b>wedge</b>: PAH ≤15 with high PVR; Group 2 >15.",
      "<b>Isolated post-capillary</b> PH: DPG <7 and PVR <3 WU. A high DPG/PVR means a <i>combined</i> pre- and post-capillary picture.",
      "Don't give pulmonary vasodilators for uncorrected Group 2 PH — you can precipitate pulmonary edema."
    ]
  },

  /* ---------------------------------------------------------------- */
  { id: "pe", name: "Acute pulmonary embolism", cat: "pulm-htn",
    blurb: "Acute cor pulmonale: RV pressure overload, but the thin RV can't generate >~60.",
    hemo: {
      hr: 110, rr: 26, bsa: 1.9, hb: 14,
      ra:  { mean: 14, a: 12, c: 3, v: 9, x: 4, y: 4 },
      rv:  { sys: 50, diaMin: 8, edp: 13 },
      pa:  { sys: 50, dia: 22, mean: 33 },
      pcwp:{ mean: 8, a: 9, v: 8 },
      co: 3.2, svo2: 55, sao2: 88, sbp: 100, dbp: 68,
      resp: { depth: 3, dir: -1 }
    },
    desc: "A large acute pulmonary embolism suddenly raises RV afterload. Unlike chronic PAH, the unprepared thin-walled RV cannot acutely generate systolic pressures much above 50–60 mmHg before it dilates and fails — an important clue to acuity.",
    cues: [
      "<b>PA/RV systolic</b> elevated but <b>capped ~50–60</b> — acute RV can't do more.",
      "<b>RA</b> elevated with a prominent a wave (acute RV pressure overload).",
      "<b>PCWP</b> normal or low — the LV is underfilled, not congested.",
      "Sinus <b>tachycardia</b>, hypoxemia, and a low cardiac output (obstructive shock)."
    ],
    pearls: [
      "PA systolic >60 with acute RV strain implies <b>chronic</b> disease (the RV had time to hypertrophy).",
      "Rising RA pressure + falling output = RV failure → the indication for reperfusion in massive PE.",
      "A normal wedge with high PA pressure localizes the obstruction to the <b>pulmonary vasculature</b>."
    ]
  },

  /* ---------------------------------------------------------------- */
  { id: "rvfail", name: "RV failure / cor pulmonale", cat: "right-heart",
    blurb: "Decompensated RV: high RA, elevated RVEDP, low output.",
    hemo: {
      hr: 92, rr: 18, bsa: 1.95, hb: 15,
      ra:  { mean: 18, a: 13, c: 3, v: 14, x: 4, y: 7 },
      rv:  { sys: 42, diaMin: 9, edp: 18 },
      pa:  { sys: 45, dia: 22, mean: 32 },
      pcwp:{ mean: 11, a: 12, v: 11 },
      co: 3.4, svo2: 54, sao2: 90, sbp: 104, dbp: 70,
      resp: { depth: 2, dir: -1 }
    },
    desc: "Chronic pulmonary hypertension has finally overwhelmed the right ventricle (cor pulmonale). The hallmark is a failing RV: a high right atrial pressure, an elevated RV end-diastolic pressure, and a low cardiac output despite the pulmonary disease.",
    cues: [
      "<b>RA</b> markedly elevated (often >15) — the cardinal sign of RV failure.",
      "<b>RVEDP</b> high and approaching the RA mean (a stiff, volume-loaded RV).",
      "<b>PA</b> elevated from the underlying chronic PH, but output is low.",
      "<b>PCWP</b> normal — congestion is right-sided, with clear lungs."
    ],
    pearls: [
      "When <b>RA approaches PCWP</b>, suspect the RV is the failing chamber.",
      "A low <b>SvO₂</b> reflects the poor forward output and high extraction.",
      "Volume often worsens a failing RV — over-filling bows the septum and impairs LV filling (ventricular interdependence)."
    ]
  },

  /* ---------------------------------------------------------------- */
  { id: "tr", name: "Severe tricuspid regurgitation", cat: "right-heart",
    blurb: "Giant CV wave — the RA tracing is 'ventricularized'.",
    hemo: {
      hr: 88, rr: 16, bsa: 1.9, hb: 13,
      ra:  { mean: 16, a: 5, c: 4, v: 22, x: 0, y: 8, vPos: 0.40, vW: 0.085 },
      rv:  { sys: 32, diaMin: 8, edp: 11 },
      pa:  { sys: 32, dia: 12, mean: 20 },
      pcwp:{ mean: 10, a: 11, v: 10 },
      co: 3.8, svo2: 58, sao2: 94, sbp: 108, dbp: 70,
      resp: { depth: 2, dir: -1 }
    },
    desc: "Severe tricuspid regurgitation drives RV pressure straight back into the right atrium during systole. The RA waveform loses its normal contour and takes on the shape of the ventricle — a 'ventricularized' atrial tracing dominated by a giant systolic wave.",
    cues: [
      "<b>RA</b>: giant <b>c-v (CV) wave</b> filling systole, with <b>loss of the x descent</b>.",
      "The RA tracing resembles an RV tracing — pressures nearly <b>equalize in systole</b>.",
      "Sharp, rapid <b>y descent</b> as the over-filled atrium empties.",
      "Elevated RA mean pressure with prominent venous pulsations clinically."
    ],
    pearls: [
      "The <b>CV wave</b> = c and v waves merged because regurgitant flow opposes atrial relaxation.",
      "Functional TR from RV dilation/PH is far more common than primary leaflet disease.",
      "On withdrawal, a ventricularized RA tracing can be mistaken for the RV — confirm by the diastolic shape."
    ]
  },

  /* ---------------------------------------------------------------- */
  { id: "constriction", name: "Constrictive pericarditis", cat: "pericardial",
    blurb: "Equalized diastolic pressures, RV dip-and-plateau, prominent x AND y.",
    hemo: {
      hr: 90, rr: 16, bsa: 1.9, hb: 13,
      ra:  { mean: 18, a: 9, c: 3, v: 9, x: 7, y: 9 },
      rv:  { sys: 36, diaMin: 6, edp: 18, plateau: true },
      pa:  { sys: 36, dia: 18, mean: 25 },
      pcwp:{ mean: 18, a: 9, v: 9 },
      co: 3.8, svo2: 60, sao2: 95, sbp: 112, dbp: 72,
      resp: { depth: 3, dir: 1 }
    },
    desc: "A rigid, scarred pericardium stops the heart from filling once it hits the pericardial limit. Early diastole fills freely, then halts abruptly — producing the dip-and-plateau ventricular waveform and equalization of all the diastolic pressures.",
    cues: [
      "<b>RV</b>: early diastolic <b>dip-and-plateau</b> (the 'square-root sign').",
      "<b>RA</b>: prominent <b>x and y</b> descents → an <b>M / W-shaped</b> waveform; sharp y is the standout.",
      "<b>Equalized</b> diastolic pressures: RA ≈ RVEDP ≈ PA diastolic ≈ PCWP (within ~5 mmHg).",
      "<b>Kussmaul's sign</b>: RA pressure fails to fall (rises) with inspiration."
    ],
    pearls: [
      "<b>PVR is normal</b> — the problem is a mechanical shell, not the pulmonary vasculature.",
      "Constriction vs tamponade: both equalize, but constriction has a <b>prominent y</b>; tamponade <b>blunts</b> it.",
      "Constriction vs restriction: look for <b>ventricular interdependence</b> (discordant RV/LV systolic pressures with respiration)."
    ]
  },

  /* ---------------------------------------------------------------- */
  { id: "tamponade", name: "Cardiac tamponade", cat: "pericardial",
    blurb: "Elevated equalized pressures, prominent x with a BLUNTED y, pulsus paradoxus.",
    hemo: {
      hr: 115, rr: 22, bsa: 1.9, hb: 13,
      ra:  { mean: 18, a: 7, c: 3, v: 6, x: 8, y: 0.5 },
      rv:  { sys: 32, diaMin: 16, edp: 18 },
      pa:  { sys: 32, dia: 18, mean: 24 },
      pcwp:{ mean: 19, a: 7, v: 6, y: 0.5 },
      co: 3.0, svo2: 55, sao2: 95, sbp: 98, dbp: 66,
      resp: { depth: 7, dir: -1 }
    },
    desc: "Pericardial fluid under pressure compresses every chamber throughout the cardiac cycle. Filling can only occur during ventricular ejection (when the heart shrinks), so the x descent is preserved but the y descent disappears — the mirror image of constriction.",
    cues: [
      "<b>RA</b>: prominent <b>x</b> descent with a <b>blunted / absent y</b> descent.",
      "<b>Equalized</b> elevated diastolic pressures (RA ≈ RVEDP ≈ PCWP), but <b>no</b> dip-and-plateau.",
      "Exaggerated respiratory swing — the hemodynamic basis of <b>pulsus paradoxus</b>.",
      "Sinus tachycardia and a low cardiac output."
    ],
    pearls: [
      "Filling is confined to systole → <b>x present, y absent</b> (constriction keeps a sharp y).",
      "Pulsus paradoxus = inspiratory SBP fall >10 mmHg from enhanced ventricular interdependence.",
      "Pericardiocentesis that <b>splits the previously-equal pressures</b> confirms the diagnosis and the cure."
    ]
  },

  /* ---------------------------------------------------------------- */
  { id: "cardiogenic", name: "Cardiogenic shock", cat: "shock",
    blurb: "High wedge + low cardiac index + high SVR + low SvO₂ (Forrester IV).",
    hemo: {
      hr: 110, rr: 24, bsa: 1.9, hb: 13,
      ra:  { mean: 14, a: 13, c: 3, v: 12, x: 4, y: 4 },
      rv:  { sys: 50, diaMin: 12, edp: 14 },
      pa:  { sys: 50, dia: 28, mean: 38 },
      pcwp:{ mean: 28, a: 26, v: 32 },
      co: 2.8, svo2: 45, sao2: 94, sbp: 88, dbp: 60,
      resp: { depth: 2, dir: -1 }
    },
    desc: "The left ventricle fails as a pump (e.g., large MI). Forward output collapses while blood dams up behind the LV, so the wedge climbs and the patient compensates with intense vasoconstriction. The classic 'cold and wet' hemodynamic profile.",
    cues: [
      "<b>PCWP</b> high (often >18) — pulmonary congestion behind a failing LV.",
      "<b>Cardiac index</b> low (<2.2) → the 'cold' state.",
      "<b>SVR</b> high from compensatory vasoconstriction; <b>SvO₂</b> low from high extraction.",
      "A regurgitant <b>v wave</b> may appear in the wedge if functional MR develops."
    ],
    pearls: [
      "Forrester IV = <b>high wedge + low index</b> (cold & wet) → the highest-mortality quadrant.",
      "Low <b>SvO₂</b> with high SVR is the fingerprint that separates cardiogenic from septic shock.",
      "A sudden giant wedge v wave after MI should prompt a hunt for acute MR or a VSD."
    ]
  },

  /* ---------------------------------------------------------------- */
  { id: "septic", name: "Septic / distributive shock", cat: "shock",
    blurb: "Low SVR, high cardiac output, HIGH SvO₂ — 'warm shock'.",
    hemo: {
      hr: 120, rr: 26, bsa: 1.9, hb: 11,
      ra:  { mean: 4, a: 5, c: 2, v: 4, x: 2, y: 2 },
      rv:  { sys: 28, diaMin: 2, edp: 4 },
      pa:  { sys: 28, dia: 10, mean: 16 },
      pcwp:{ mean: 8, a: 9, v: 8 },
      co: 8.5, svo2: 78, sao2: 96, sbp: 85, dbp: 40,
      resp: { depth: 2, dir: -1 }
    },
    desc: "Distributive (septic) shock: profound peripheral vasodilation drops the systemic resistance, the heart responds with a high output, and the tissues can't extract oxygen normally. The numbers are nearly the opposite of cardiogenic shock.",
    cues: [
      "<b>SVR very low</b> with a wide pulse pressure (low diastolic BP).",
      "<b>Cardiac output high</b> (hyperdynamic) — the 'warm' state.",
      "<b>SvO₂ high</b> — impaired peripheral O₂ extraction / micro-shunting.",
      "Low–normal filling pressures (RA, PCWP), worsened by capillary leak."
    ],
    pearls: [
      "<b>Low SVR + high CO + high SvO₂</b> = distributive shock until proven otherwise.",
      "Contrast cardiogenic shock: high SVR, low CO, low SvO₂ — the mirror image.",
      "Fluids + vasopressors raise SVR; persistently low SvO₂ later can signal myocardial depression."
    ]
  },

  /* ---------------------------------------------------------------- */
  { id: "hypovolemic", name: "Hypovolemic shock", cat: "shock",
    blurb: "Low filling pressures everywhere, high SVR, low SvO₂.",
    hemo: {
      hr: 125, rr: 24, bsa: 1.9, hb: 9,
      ra:  { mean: 1, a: 3, c: 1.5, v: 2, x: 1.5, y: 1.5 },
      rv:  { sys: 22, diaMin: 1, edp: 2 },
      pa:  { sys: 18, dia: 6, mean: 11 },
      pcwp:{ mean: 4, a: 5, v: 4 },
      co: 3.0, svo2: 50, sao2: 97, sbp: 86, dbp: 60,
      resp: { depth: 2, dir: -1 }
    },
    desc: "Inadequate circulating volume (hemorrhage, dehydration). Every filling pressure is low, the heart races to maintain output, and the periphery clamps down. The textbook volume-responsive shock.",
    cues: [
      "<b>RA and PCWP both low</b> — an under-filled circulation.",
      "<b>Low PA pressures</b> and small waveform amplitudes.",
      "<b>SVR high</b> (compensatory vasoconstriction); <b>SvO₂ low</b> (high extraction).",
      "Marked sinus tachycardia."
    ],
    pearls: [
      "Low filling pressures + low CO + high SVR → give <b>volume</b> and find the source.",
      "Both hypovolemic and cardiogenic shock have high SVR & low SvO₂ — the <b>wedge</b> separates them (low vs high).",
      "Exaggerated respiratory variation in the arterial trace predicts <b>fluid responsiveness</b>."
    ]
  },

  /* ---------------------------------------------------------------- */
  { id: "mr", name: "Severe mitral regurgitation", cat: "valve",
    blurb: "Giant v wave in the wedge tracing.",
    hemo: {
      hr: 88, rr: 18, bsa: 1.9, hb: 13,
      ra:  { mean: 10, a: 11, c: 3, v: 10, x: 4, y: 4 },
      rv:  { sys: 55, diaMin: 10, edp: 12 },
      pa:  { sys: 55, dia: 25, mean: 36 },
      pcwp:{ mean: 20, a: 14, v: 42, vPos: 0.55, vW: 0.07, y: 16 },
      co: 4.0, svo2: 60, sao2: 96, sbp: 115, dbp: 75,
      resp: { depth: 2, dir: -1 }
    },
    desc: "Severe mitral regurgitation pushes a regurgitant volume into a relatively non-compliant left atrium during systole, generating a towering v wave that the wedge tracing transmits — and that can drive secondary pulmonary hypertension.",
    cues: [
      "<b>PCWP</b>: a <b>giant v wave</b> (often >2× the mean wedge pressure).",
      "The tall v wave can even appear in the <b>PA</b> tracing as a late-systolic bump.",
      "Secondary <b>pulmonary hypertension</b> from the elevated left atrial pressure.",
      "Steep <b>y descent</b> after the giant v as the LA empties."
    ],
    pearls: [
      "The mean wedge <b>overestimates LV end-diastolic pressure</b> when a giant v wave is present — read the wedge at the a wave / pre-v.",
      "A large v wave is non-specific (any cause of a stiff, volume-loaded LA), but in the right context it screams acute MR.",
      "Don't confuse a giant wedge v wave on pullback with the PA tracing — check the timing against the ECG."
    ]
  },

  /* ---------------------------------------------------------------- */
  { id: "ms", name: "Mitral stenosis", cat: "valve",
    blurb: "Elevated wedge with a prominent a wave and a diastolic mitral gradient.",
    hemo: {
      hr: 84, rr: 16, bsa: 1.85, hb: 12,
      ra:  { mean: 9, a: 12, c: 3, v: 9, x: 4, y: 4 },
      rv:  { sys: 48, diaMin: 8, edp: 10 },
      pa:  { sys: 48, dia: 22, mean: 32 },
      pcwp:{ mean: 22, a: 28, v: 20, aPos: 0.94 },
      co: 3.8, svo2: 62, sao2: 96, sbp: 118, dbp: 76,
      resp: { depth: 2, dir: -1 }
    },
    desc: "A narrowed mitral valve obstructs LA emptying, so left atrial (wedge) pressure stays high throughout diastole while LV diastolic pressure is normal — the persistent diastolic gradient that defines the lesion. Chronic LA hypertension drives reactive pulmonary hypertension.",
    cues: [
      "<b>PCWP</b> elevated with a <b>prominent a wave</b> (forceful atrial contraction in sinus rhythm).",
      "A standing <b>diastolic gradient</b> between the wedge and LV pressure (the wedge stays high in diastole).",
      "Reactive <b>pulmonary hypertension</b>: elevated PA pressures and PVR.",
      "RA may show a prominent a wave once RV pressure rises."
    ],
    pearls: [
      "The mitral gradient is best measured wedge-to-LV; the <b>wedge is a left-atrial surrogate</b>.",
      "Atrial fibrillation <b>abolishes the a wave</b> and raises the mean wedge — rate control improves filling time.",
      "Out-of-proportion (reactive) PH can regress after the valve is fixed."
    ]
  }

  ];

  RHC.caseById = function (id) {
    for (var i = 0; i < RHC.CASES.length; i++) if (RHC.CASES[i].id === id) return RHC.CASES[i];
    return RHC.CASES[0];
  };

})(window.RHC = window.RHC || {});
