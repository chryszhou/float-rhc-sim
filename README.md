# RHC Sim — Right Heart Catheterization Simulator

An interactive, browser-based teaching tool for **right heart catheterization
(Swan–Ganz) waveforms**. Walk a catheter through the right atrium → right ventricle
→ pulmonary artery → wedge position and watch the pressure tracing change character
at each chamber, then load classic pathology cases (pulmonary hypertension, right
heart failure, tamponade, constriction, shock states, valve lesions) to learn the
hemodynamic fingerprints by sight and by the numbers.

It is a sibling of the [Tidal mechanical-ventilation simulator](https://chryszhou.github.io/tidal-ventilator-sim/)
and shares its zero-dependency, cath-lab-monitor aesthetic.

> **Educational model only — not a medical device.** Waveforms are stylized for
> teaching and the numbers are idealized. Do not use for clinical decisions.

## Features

- **Live ECG + pressure tracing** that scrolls like a real cath-lab monitor, colored
  by catheter position (RA blue, RV green, PA yellow, PCWP violet).
- **Continuous catheter depth** — the catheter moves through a continuous depth, not
  fixed stops. **Hold** Advance/Withdraw, drag the depth gauge, or use ← → to move it;
  you only get a clean waveform when the tip is *seated* in a chamber. In between you see
  the blended, straddling-the-junction tracing, and pushing past the wedge produces the
  damped, drifting **over-wedge** artifact — so the learner has to find the right spot.
- **Catheter map + depth gauge** — an SVG schematic highlights the seated chamber and
  threads the balloon-tipped catheter to the tip; a zoned gauge shows depth and live
  feedback ("✓ seated" / "seat the catheter" / "over-wedged"). Click a chamber to jump
  to its sweet spot, or **Auto-advance** to sweep RA → wedge continuously.
- **Composite pullback reference** — all four positions side-by-side on one mmHg scale.
- **Pressures + derived hemodynamics** — RA/RV/PA/PCWP, plus CO, CI, SVR, PVR (Wood
  units & dynes), TPG, DPG, SV and SvO₂, color-coded against normal ranges.
- **End-expiration shading** so you read pressures where pleural pressure ≈ 0.
- **Freeze + hover** to measure any point on the tracing.
- **Quiz mode** — hides the diagnosis and loads a random case; identify it from the
  waveforms, then reveal.
- Adjustable **heart rate / respiratory rate**, **light/dark theme**, fully responsive.

## Case library

Normal · Pulmonary arterial hypertension (Group 1) · PH from left heart disease
(Group 2) · Acute pulmonary embolism · RV failure / cor pulmonale · Tricuspid
regurgitation · Constrictive pericarditis · Cardiac tamponade · Cardiogenic shock ·
Septic / distributive shock · Hypovolemic shock · Severe mitral regurgitation ·
Mitral stenosis.

## Run it

No build, no dependencies. Either:

- **Double-click `index.html`** to open it directly (`file://`), or
- Serve the folder and open the printed URL:
  ```sh
  python3 -m http.server 8000
  # then visit http://localhost:8000
  ```

## Deploy to GitHub Pages

The files already live at the repo root, so Pages works with no build step:

1. Create a repo (e.g. `rhcsim`) and push this folder to it.
2. In **Settings → Pages**, set the source to the `main` branch, root (`/`).
3. The site publishes at `https://<your-username>.github.io/rhcsim/`.

## How it works

Pressure waveforms are **synthesized** from morphology parameters (a/c/v wave
amplitudes, x/y descent depths, dip-and-plateau flags, dicrotic-notch shaping)
rather than solved from a chamber ODE — this keeps every teaching feature under
direct, recognizable control. A cardiac-phase clock drives the cycle and a
respiratory-phase clock adds the baseline sway (Kussmaul's sign, pulsus paradoxus).

| File | Role |
|------|------|
| `js/engine.js` | waveform generators, cardiac/respiratory clocks, derived hemodynamics |
| `js/cases.js`  | the pathology library (hemodynamic profiles + teaching content) |
| `js/render.js` | canvas scope, composite pullback strip, SVG catheter-map updater |
| `js/ui.js`     | catheter controls, monitors, case library, teaching panel, quiz |
| `js/main.js`   | bootstrap + real-time loop + auto-advance |
