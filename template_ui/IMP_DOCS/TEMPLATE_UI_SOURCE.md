# template_ui — Source Material & Artifact Notes

> Understanding of the `template_ui/` folder. All content is Dell ISG BPA forecasting
> discovery material + a working "Bend the Curve" scenario-model prototype. Built from
> real presales/discovery call recordings with Doug O'Neill (forecast owner), Mark,
> Joanna, Gordon, Mike (labor), Zooey/Zui (data-science forecast), Brandon Adams (loads
> to Julius), Francisco (data engineer, adjustment cube extract/load).

---

## Files

| File | Type | Role |
|---|---|---|
| `artifact-793a3bd0-...-17.html` | HTML app | **Working prototype** — "Bend the Curve — ISG BPA Scenario Model". 3 views. See below. |
| `BTC Guide — Forecast Copilot.html` | HTML page | De-identified BTC reference guide (same as forecast_copilot in-app guide). Light/dark, Highcharts ramp demo. |
| `Adjustment 1Templates.xlsx` | Excel | The **real adjustment workbook** Doug demos in the calls. 4 sheets (below). |
| `day-3.vtt` | Transcript | **Core BTC demo** — Doug screen-shares the full VXRail adjustment walkthrough. Maps 1:1 to the artifact. |
| `day 4.txt` | Transcript | Follow-up session — adjustment order, upsell, aging/vintage, software ASU, publishing chain, future state. |

---

## The BTC Adjustment Process (from transcripts)

**Goal**: reconcile the statistical (data-science) forecast to committed **Service
Modernization (SMOD) targets** — parts-dispatch rate targets set by "triads"
(engineering + serviceability + quality product owners w/ exec sponsorship).

**Pipeline**: data-science forecast → **adjustment cube** (OLAP/what-if in Excel) →
analyst sizes BTC adjustment → publish → Francisco extracts → Brandon loads to
**Julius** (USDM-backed reporting) as a named forecast series (e.g. "FY27 AOP November ISG").

**Bend-the-Curve modifier** (the key lever):
- 100% = no change (adjusted = raw forecast). Lower % pulls forecast down toward target.
- Sensitivity Doug demoed on VXRail: 100%→gap unchanged; 85%→~6% gap; 80%→~2%; settled **77% → 14,389 dispatches vs 14,210 target, rate .131 vs .130**.
- Non-linear. Adjustment is **ramped/incremented** across the remaining weeks (first
  forecast week → W52): little change early, accumulates toward 2nd half. Artifact
  models this as a `^8` power-curve ramp (reverse-engineered, not a confirmed spec).
- Starting point on VXRail: DS forecast 15,674 disp / mod target 14,210 / ASUs 109,608 / rate .143 → must adjust down.

**4-Tab problem** (the "painful" multi-step): storage products (PowerScale, VXRail,
DataDomain, PowerFlex, PowerStore) roll up under **both ESG and ISG** hierarchies, and
each crosses **Parts Only** vs **Parts + Labour** service types → **4 tabs per product**,
each sized separately from the same 77% modifier. Same modifier → very different absolute
values per intersection (Doug's example: 380 total → 258 in one tab, 2 in another). The 4
sum back ~= original sizing. Non-dual / simpler metrics need only 1–2 tabs. ~5–8 products
need the full dual treatment; ~13 products scoped for SMOD + a handful of "rest of ISG".

**OLAP entry constraints** (real, modeled in artifact):
- Only takes **values, not formulas**; can't paste multiple items at once (throws error).
- **Rejects zeros** — needs a workaround formula for zero weeks.
- Enter value → **red mark** (pending) → **Publish** (commits, weighted-allocates down to
  region/country/core-upsell) or **Discard** (reverts). Weighted allocation, NOT equal.
- Actuals-gap: first 2–3 forecast weeks already have actuals by load time; Doug overrides
  those forecast cells with the actual value so totals tie (rows without a leading 1/2
  counting-sequence digit are actuals).
- `Dispatches No IQR` = original reference (never changes); `Dispatches Adj` = the editable
  column that gets extracted to Julius. Whole forecast range is extracted, not just edited rows.

**ASU chain** (Contracts adjustment): `ASU_Adj = Base − Expiring + New Contracts + APOS`.
Two adjustable fields (Doug: "New Contracts and APOS... two different fields we'd adjust"):
- **New Contracts** — raised/lowered per FP&A shipment guidance / product momentum.
- **APOS** — renewal side; % of expiring cohort that stays active (assumed retention rate,
  back-engineered). Expiring lags — Zooey reloads it after new/renewal sizing is committed.

**Quarterly phasing** (2nd, simpler pass): targets are set quarterly. Avoid naive
annual÷4 "cliff drop then Q1 spike" (leadership disliked). Uses a **direct % scale** (not
the ramp): compute % diff to quarterly target, apply, check quarter boundaries didn't break.
Intent: start higher, end lower within the year, same annual total, more results in 1H.

**Turnaround**: ~2 days dispatches, ~2 days SR, ~2–3 days ASU (extra Zooey reload step).
SR is last → gets compressed if delays upstream. Handful of small mistakes slip through
(volume of manual tabs, no version control). Post-UCR SR = 2nd adjustment round (Mike owns
labor/post-UCR), ~2× a year for AOP + 2H forecast.

---

## Artifact HTML — structure (maps to the above)

Header "ISG BPA / Scenario Model / Bend the Curve". Tokens = BPA light system
(`--ac:#3a6ef0`, Plus Jakarta + IBM Plex Mono, Chart.js 4.4.1). Backend-formula drawer.

**3 views** (`go('bend'|'asu'|'four')`):
- **Dispatch BTC** (`vBend`) — KPIs (DS Forecast, BTC Adjusted, SMOD Target, Forecast/Adjusted
  Rate, Gap), Dispatches line chart (DS/Adj/Target), Rate Comparison bar, weekly table + CSV.
  Modifier slider 50–100 (dflt 77). `Adjusted = T + (F−T)*(Mod/100)^8`, ramp `wt=0.3+0.7*(i/(N-1))`.
- **ASU Contracts** (`vAsu`) — 2 sliders: **New Contract** 80–100 (dflt 99, `^2`), **APOS** 10–100
  (dflt 55, `^8` + ramp). KPIs, ASU Forecast line, Contract Flows bar, table (Base/Expiring/NC/
  APOS/Adj New/BTC APOS/Adj ASU). V93=191/V94=441 defaults. Uses embedded 13-week `EXCEL` array.
- **4-Tab Storage** (`vFour`) — per product: dual (ESG/ISG × Parts+Labor/Parts Only = 4 tabs) or
  2 tabs. Edit → pending red-dot → Publish/Discard, zero-rejection, "was/published" states,
  weighted-allocation note. Mirrors OLAP flow exactly.

**Products** (`DATA`): VXRail, PowerScale, DataDomain, PowerFlex, PowerStore (all dual, sw40),
PowerEdge (non-dual, sw36). Each has f/t/a/r + weekly noise. `DATA.VXRail` = the demoed case.

**Backend-formula drawer** cites `[4][5][6]` — transcript refs. Formulas: Dispatch BTC,
BTC V93/V94, ASU chain, 4-Tab OLAP entry (with the "only values" / "no zeros" quotes).

---

## xlsx — `Adjustment 1Templates.xlsx` (4 sheets)

- **Sheet1** — raw extract note ("Weekly Field Expiring ASUs (ALL), 2026-Q2 - 2026-W20") + `_Measures[...]` list (SRs, Work Orders, Total/Field/Tech ASUs, TSUs, Forecasting, Labor Cost).
- **Contracts** (197×47) — ASU template. Left = **Julius** pivot (Fiscal Qtr/Week, Weekly Field
  ASUs, Expiring, APOS, Expiring). Right = **AOP Forecast / adjustment cube** ("Ships Field Adjust"
  → New Contract, APOS Renewal — the two editable fields). POWEREDGE example, FY25 W01+ data.
- **Dispatches** (168×33) — BTC dispatch template. Left Julius (Field ASU, Work Order Actuals, MDR).
  Right AOP (ASU Field Closing, **Dispatches No IQR** = orig, **Dispatches Adj** = editable, MDR Weekly).
  Filters shown: Break Fix, Svc Type (multiple), Global LOB POWEREDGE, ESG.
- **PreUCR SR** (168×33) — same layout: Tech ASUs / Assisted Demand; **SR No IQR** / **SR Adj** /
  SR-ICR Weekly. BUS_RPTG_GRP = Infrastructure Solutions (ISG), GCFA/NonGCFA distinction.

---

## Key domain terms

- **SMOD** = Service Modernization (dispatch-rate reduction program; SMOD 2.0 = vintage/ship-quarter focused, prescriptive per-vintage targets).
- **Triads** = engineering + serviceability + quality product owners who set the dispatch-reduction targets.
- **MDR** = dispatches ÷ ASUs (field). **ICR** = SR-based equivalent. Both = modernization success measures; adjust dispatches (straighter line) to hit the rate, not MDR directly.
- **ASU** = Active Service Unit (installed hardware asset). Field ASU vs Tech ASU (tech = remote/software-capable agents; software ASUs excluded today — known gap).
- **APOS** = renewal/retention of expiring contracts. **New Contracts** = new shipments.
- **UCR / Pre-UCR / Post-UCR SR** = SR forecast stages; post-UCR (Mike) feeds capacity/headcount planning, done ~2×/yr.
- **Julius** = reporting cube (pulls from USDM). **Adjustment cube** = OLAP what-if where Doug edits. **Francisco** extracts, **Brandon** loads to Julius.
- **IQR** = outlier-treatment method; storage products use **No IQR** series (IQR fits client/PC better than volatile storage).
- **Vintage/generation/aging** = top future-state ask: profile dispatches by ship-quarter × time.

---

## Build log

- **Fidelity mockups** (decision aids): `sim_A_grid.html` (faithful Excel grid), `sim_B_app.html`
  (polished app), `sim_C_hybrid.html` (grid + panel). User chose **B**.
- **`btc_adjustment_simulator.html`** — the deliverable. Polished scenario app (B style), all 3
  sheets as tabs, real POWEREDGE data from the xlsx:
  - **Dispatches** — 1 BTC modifier (50–100%, `^8` ramp over forecast wks), MDR gap-to-target, KPI strip, Chart.js (DS/Adj/Target), weekly table, CSV.
  - **Contracts (ASU)** — 2 levers (New Contract 80–120%, APOS Renewal 40–100%); ASU chain `Adj ASU = prev − Expiring + Adj New + BTC APOS`; ASU-lift meter; flows table.
  - **PreUCR SR** — 1 BTC modifier vs ICR target; same pattern as Dispatches.
  - Actuals weeks locked (`fc` index). Publish = mock (weighted-alloc note). No live cube.
  - Math verified in Node: DISP 100%→rate .0689, 77%→.0663 (target .0645); ASU chain clean.
  - **Fix (self-contained render):** Chart.js CDN removed — the render sandbox blocks external
    scripts, so `new Chart` threw in `window.onload` and killed all 3 sheets (empty grid, dead
    tabs, no charts). Now: inline SVG line charts (`svgChart()`), zero external deps, init runs
    **synchronously** at end of body (no load-order/CDN dependency). Works sandboxed + offline.
  - **Not yet**: real 4-tab ESG/ISG × Parts-Only/Parts+Labor intersections; other LOBs
    (only POWEREDGE has real rows); editable-cell/publish-discard fidelity (that was mockups A/C).

## Raw dataset (8-LOB source for the UI)

Source = `forecast_copilot_v2/input/forecast_fy26.xlsx` (already-anonymised master, 19 LOBs,
FY22–26, ASU/APOS/Renewals) + `name_mapping_reference.xlsx`. Generator: `template_ui/input/gen_btc_dataset.py`
(deterministic — stable md5 seed; `hash()` is salted per-process, don't use it). Outputs in `template_ui/input/`
(renamed from `data/`; an `output/` folder will hold the published series post-adjustment):

- **`btc_raw_dataset.csv`** — tidy long, 7,488 rows (8 LOB × 3 region × 312 wks), all dims + metrics.
- **`btc_data.json`** — compact per-LOB UI source: FY27 52-wk forecast window + 8-wk FY26 tail,
  dispatch/SR/ASU-chain arrays + SMOD/ICR targets.
- **`TERMS_REFERENCE.md` / `.csv`** — decode key (8 LOBs Dell→generic, dim mappings, metric defs, rate assumptions).

8 LOBs: Server Line A (Poweredge), Server Line B AI (Poweredge AI), Storage Array C (Powerscale),
Storage Array D (Powerflex), Storage Array H (Unity), Data Protection B (Datadomain),
Hyperconverged A (Vxrail), Networking A (Powerswitch).

Key facts:
- Master has ASU/APOS/Renewals only → **Dispatches & SR derived** = ASU × MDR(.00072)/ICR(.0013) × per-LOB mult × seeded noise, calibrated to the real Adjustment templates.
- **ASU chain** closes exactly within FY (Expiring = balancing term; New Contract/APOS Renewal modelled inflows). FY26→FY27 boundary = intentional anchor reset (24 = 8×3 non-continuous seam weeks).
- FY22–26 = actuals, FY27 = generated forward forecast (the BTC-adjustable window).
- **Wired (done):** `btc_adjustment_simulator.html` now `fetch`es `input/btc_data.json` on load →
  LOB dropdown (8) drives all 3 sheets; each LOB = 8-wk FY26 actual tail (locked) + 52-wk FY27 forecast
  the sliders bend. Hardcoded POWEREDGE slice removed. Load-error banner if fetch fails.
  **Must serve over http** (`python -m http.server` in `template_ui/`) — `fetch` is blocked on `file://`.
  Verified over http: LOB switch updates every sheet, KPIs match generator, 0 console errors.
- **Not yet:** region/BU/service filters (JSON is region-aggregated; needs richer JSON or read the raw CSV);
  `output/` publish folder; real 4-tab intersections.

## Future-state asks voiced in calls (product direction)

Slider + manual-precise-input BTC tool (replacing the manual 4-tab Excel); what-if scenario
modeling anyone can run live (Power BI-style visibility before Julius load, to cut validation
lag); vintage/ship-quarter dimension in the forecast; new-product/no-history intake (model off
production plan / predecessor LOB / market inputs); software ASU inclusion; region/geo drill-down;
initiative-level (triad) impact tracking connected end-to-end.
