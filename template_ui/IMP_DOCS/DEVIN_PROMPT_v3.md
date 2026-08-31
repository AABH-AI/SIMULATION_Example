# Devin task — BTC Adjustment Simulator v3

**Model setting to use in Devin:** SWE 1.6, "slow" (max effort).

---

## Context

Single-file, static HTML/CSS/JS dashboard (no backend, no build). Part of a demand-forecasting suite. You will edit **one file**:

```
template_ui/btc_adjustment_simulator_v3.html
```

Do **not** edit `btc_adjustment_simulator.html` (v1) or `btc_adjustment_simulator_v2.html` (v2) — v3 is a copy of v2 and is the only UI file in scope. `input/gen_ui_from_csv.py` (the data generator) is in scope only where a task requires it.

### What the app models — the "adjustment flow"

A forecasting pipeline. Read `template_ui/IMP_DOCS/adjustment flow.png` and `template_ui/input/TERMS_REFERENCE.md` for the full picture. Summary:

1. **ASU** (Active Service Units — installed hardware base) is the upstream **driver**. It is built from an ASU chain: `ASU[w] = ASU[w-1] − Expiring[w] + NewContract[w] + APOS_Renewal[w]`.
2. Adjusted ASU **drives** the downstream **Dispatches** forecast (ASU × MDR) and **Service Requests / SRs** forecast (ASU × ICR).
3. Workflow is sequential: **Step 1** adjust & lock ASU → **Step 2** adjust & lock Dispatches + SRs → **Step 3** publish + export.
4. ASU is intermediate (not a publish endpoint). Only Dispatches + SRs are published.

### Current v3 state (inherited from v2)

- 3 tabs: **ASUs**, **Dispatches**, **SRs** (this order). A stage **stepper** at top: `1 Adjust ASU → 2 Adjust Dispatches & SRs → 3 Publish → UMS`.
- ASU page has driver sliders: **New Contract** (`ncS`/`ncI`), **APOS Renewal** (`apS`/`apI`), **Ships Forecast** (`shS`/`shI`). Each slider `k%` scales that component's forecast weeks.
- Dispatches / SRs pages each have one **BTC Modifier** slider (`dS`/`dI`, `sS`/`sI`) + a gap-to-target readout + Publish/Reset.
- **Lock** mechanic: ASU page has a "🔒 Lock forecast" button (`toggleLock()` / `ASU_LOCKED`); locking enables the disp/SR Publish buttons (disabled + gate banner until then). Export button (top, `#exportbtn`) appears once **both** Dispatches and SRs are published.
- Data: loaded from `input/btc_data.js` (`window.BTC_DATA`) → global `BTC` → active timeline `TL` (per selected LOB). Key `TL` arrays (parallel, indexed by fiscal week): `fw, fy, fq, series, asu, disp, sr, nc, apos, exp, ships`, plus `fcStart` (index where Forecast series begins), `dispTarget/srTarget` (+`…N`), `alloc` (allocation weights). 312 weeks/LOB, FY22–FY27, `fcStart = 260` (FY27 W01). The forecast window is FY27 (52 weeks); everything before is actuals.
- Right-side **Filters** rail (`F` state object): Fiscal Year / Quarter / Week / Region / LOB / Business Unit / etc. `visIdx()` returns the visible week indices for the current filter selection. `computeAsuRows()` is the single source of the ASU chain; `calcRate(C, adjAsu)` computes adjusted disp/SR (already coupled to adjusted ASU).
- Theme: light default + dark mode toggle (`data-theme` on `<body>`). Keep **both** themes working. Numbers use `en-US` grouping via `fmt()`. No pie/donut charts. Charts are Highcharts 11.4.8 (CDN) via `svgChart(elId, labels, series, yfmt)`.

### How to run & verify (do this for every change)

```bash
cd template_ui
python -m http.server 8901
# open http://localhost:8901/btc_adjustment_simulator_v3.html
```

Verify in a real browser: 0 console errors; charts render; sliders/lock/publish/export behave; light **and** dark theme both clean. A headless smoke test that extracts the inline `<script>` and runs the real functions under Node's `vm` (stub `document`/`localStorage`, leave `Highcharts` undefined so `svgChart` no-ops) is a good fast check for the math (this is how v2 was validated).

If you change `input/gen_ui_from_csv.py`, regenerate with `python input/gen_ui_from_csv.py` (deterministic; it reads `input/btc_raw_dataset.csv` and rewrites `btc_data.js`/`.json`). **Add-only** payload keys — v1 and v2 read the same `btc_data.js`, so do not remove or rename existing keys.

---

## Tasks

### 1. Remove Ships; replace with Declines

- Remove the **Ships** component entirely from the ASU page: the Ships slider (`shS`/`shI`), the "Ships Actuals" and "ADJ Ships" chart series + legend entries, the two Ships table columns, and the `ships` handling in `computeAsuRows()`.
- **Replace it with a "Declines" driver** — the ASU **Expiring** outflow (`TL.exp`). In the ASU chain `ASU = prev − Expiring + NewContract + APOS_Renewal`, Declines is the `Expiring` term. Add a working Declines slider that adjusts the Expiring outflow, wired into the chain and into the downstream disp/SR coupling (see Task 2.2). Show it in the chart + table the same way the other drivers are shown.
- The synthesized `ships` array in `gen_ui_from_csv.py` can be dropped (or left as an unused key). `exp` already exists in the payload — use it.

### 2. Sliders

**2.1 (all sliders)**
- Range: **−100% to +150%** (currently −150 to 150). Update the `min`/`max` on every slider input (`ncS/ncI, apS/apI, dS/dI, sS/sI`, the new Declines slider) **and** the `clampP()` clamp bounds.
- Behavior must be **flat proportional to the forecast value**: at `p%`, adjusted = `forecast × (1 + p/100)`. E.g. forecast 10 → −50% gives 5, +150% gives 25. Apply this uniformly across the whole forecast window.

**2.2 ASUs**
- The Declines slider must actually change the output (a "working slider for declines").

**2.3 Dispatches & SRs**
- **Bug: adjustment does nothing for FY27 Q1.** Root cause is the ramp weighting in `calcRate()` — it uses `ramp(i-fc, N) = pow(i/(N-1), 8)`, which is ≈0 for the early forecast weeks (all of Q1), so the modifier has no effect there. Replace the ramped weighting with the flat proportional behavior from Task 2.1 so the modifier applies evenly from FY27 W01 onward (fixing Q1 and satisfying 2.1's spec in one change).

### 3. Publish page (Step 3)

- Remove the word **"UMS"** everywhere (stepper label `Publish → UMS`, the allocation modal title `… → UMS allocation`, any comments/strings).
- Make Step 3 a real **page/view**. The **Export data** button (`#exportbtn`) should appear at the top **only on this page** (not globally).
- This page shows the **forecast values and related metrics** (adjusted forecast totals, targets, gaps, allocation, etc.).
- On this page, the Fiscal Year / Quarter / Week filters must offer **only forecast-period options** (FY27 and its quarters/weeks) — hide actuals periods from those three filters while on Step 3.

### 4. UI

- **4.1** Default chart/table view = the **forecast period + the 1 year immediately before it** (i.e. FY26 + FY27), instead of the full FY22–FY27 timeline. Set this as the initial filter/view state on load.
- **4.2** When the current view shows **actuals-only** periods, **hide the adjusted-value tables/columns**. Show adjusted values only when the forecast period is part of the view.
- **4.3** Remove **"Flow-Aligned"** from the header. Replace it with a label reading **`Adjustment Cycle <fiscal year>, Pass <n>`** (fiscal year = the forecast FY, e.g. FY27).
  - **`Pass <n>` increments with every data export.** Derive `n` by counting existing export files in the `output/` folder (the export writes there via the File System Access API — see `exportPublished()` / `_outDir`). If reading the folder isn't feasible in a static page, persist the pass count in `localStorage` and increment on each successful export; document whichever approach you take.
- **4.4** For **Step 1 ("Adjust ASU")**, show **only the ASUs page** (hide the Dispatches and SRs tabs).
- **4.5** For **Step 2 ("Adjust Dispatches & SRs")**, show **only the Dispatches and SRs pages** (hide the ASUs tab).

### 5. Control panel

- **5.1** Move the **Reset** button to the **top-right** of the control panel.
- **5.2** Add a **Lock forecast** control to the **Dispatches** and **SRs** pages (each metric locks independently), mirroring the ASU lock.
- **5.3** Add **previous / next step** navigation buttons:
  - **ASUs page:** show a **"Go to Step 2"** button, surfaced **only once the ASU forecast is locked**.
  - **Dispatches & SRs pages:**
    - a control to **switch between Dispatches and SRs**,
    - a **"Back to Step 1 (ASUs)"** button,
    - a **"Go to Step 3 (Publish)"** button, surfaced **only once both Dispatches and SRs are locked**.
  - Do **not** show the top **Export data** button during Step 2 (it belongs to Step 3 only — see Task 3).

---

## Constraints & acceptance

- Single file (`btc_adjustment_simulator_v3.html`); do not break v1/v2 or the shared `btc_data.js` (add-only data keys).
- Light **and** dark theme both correct; no pie/donut; `en-US` number formatting; 0 console errors.
- The three-step gated workflow must hold end-to-end: adjust+lock ASU → (Step 2 unlocks) adjust+lock Dispatches & SRs → (Step 3 unlocks) publish + export, with Export appearing only on Step 3 and the header pass-count advancing per export.
- Verify every change in a real browser before considering it done.
