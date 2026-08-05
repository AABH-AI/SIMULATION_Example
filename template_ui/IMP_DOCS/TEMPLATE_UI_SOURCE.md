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
- **`btc_adjustment_simulator.html`** — the deliverable (B style). Inline SVG charts (`svgChart()`),
  zero external deps, init runs **synchronously** at end of body (the render sandbox blocks CDN
  scripts, so Chart.js was removed). **Rebuilt heavily across later sessions — see the authoritative
  "CURRENT STATE" section below; the tab names / slider ranges / data-scope in this bullet are historical.**

## Raw dataset (8-LOB source for the UI)

Source = `forecast_copilot_v2/input/forecast_fy26.xlsx` (already-anonymised master, 19 LOBs,
FY22–26, ASU/APOS/Renewals) + `name_mapping_reference.xlsx`. Generator: `template_ui/input/gen_btc_dataset.py`
(deterministic — stable md5 seed; `hash()` is salted per-process, don't use it). Outputs in `template_ui/input/`
(renamed from `data/`; an `output/` folder will hold the published series post-adjustment):

- **`btc_raw_dataset.csv`** — tidy long, 7,488 rows (8 LOB × 3 region × 312 wks), all dims + metrics.
- **`btc_data.js` / `btc_data.json`** — per-LOB UI source. **Now the FULL FY22–FY27 weekly timeline
  (312 wks/LOB)**, region-aggregated, emitted by **`gen_ui_from_csv.py`** (reads `btc_raw_dataset.csv`
  directly — no xlsx/openpyxl dep). Per LOB: `fw/fy/fq/series/asu/disp/sr/nc/apos/exp` arrays, `fcStart`
  (=260, first FY27 wk), `dispTarget(N)/srTarget(N)`. Top-level `opts:{fy,quarter,week}` = the rail's
  option lists. `btc_data.js` wraps as `window.BTC_DATA` for `<script src>` (file://-safe; replaced the
  old `fetch` of `.json`). The older `gen_btc_dataset.py` (FY27-only + xlsx source) is superseded for the UI.
- **`TERMS_REFERENCE.md` / `.csv`** — decode key (8 LOBs Dell→generic, dim mappings, metric defs, rate assumptions).

8 LOBs: Server Line A (Poweredge), Server Line B AI (Poweredge AI), Storage Array C (Powerscale),
Storage Array D (Powerflex), Storage Array H (Unity), Data Protection B (Datadomain),
Hyperconverged A (Vxrail), Networking A (Powerswitch).

Key facts:
- Master has ASU/APOS/Renewals only → **Dispatches & SR derived** = ASU × MDR(.00072)/ICR(.0013) × per-LOB mult × seeded noise, calibrated to the real Adjustment templates.
- **ASU chain** closes exactly within FY (Expiring = balancing term; New Contract/APOS Renewal modelled inflows). FY26→FY27 boundary = intentional anchor reset (24 = 8×3 non-continuous seam weeks).
- FY22–26 = actuals, FY27 = generated forward forecast (the BTC-adjustable window; `fcStart`=260).

## btc_adjustment_simulator.html — CURRENT STATE (authoritative)

> Rebuilt across several iteration rounds; supersedes the historical "Build log" / "Raw dataset —
> Wired" notes above. Single self-contained HTML, inline SVG charts, no external deps, data via
> `<script src="input/btc_data.js">` (works from `file://`). Regenerate data: `python input/gen_ui_from_csv.py`.

**Header/chrome** — brand **"BPA"**, breadcrumb **"BTC Adjustment Simulator"** (old "ISG BPA /
Scenario Model /" dropped). No header LOB dropdown, no clock. Right purple **info badge** (`#ctx`,
`renderCtx()`) = `LOB · Business Unit · time-period`; time-period shows FY range plus Q and W ranges when selected.

**Tabs** — `ASUs` (default, leftmost) · `SRs` · `Dispatches`. `go('asu'|'sr'|'disp')`.

**Data model** — `window.BTC_DATA = {lobs, opts:{fy,quarter,week}, data:{lob:{fw,fy,fq,series,asu,disp,sr,nc,apos,exp,fcStart,dispTarget(N),srTarget(N)}}}`.
`TL` = active-LOB timeline; `loadLob(lob)` sets it, `'All'` → `aggLob()` sums all 8 LOBs. **Default LOB = All.**

**Filter rail** (right, collapsible, 12 filters) — fy/quarter/week **multi**, region, lob (Global LOB incl **All**),
business, warranty, service, coreupsell, wotype, fqm, gcfa **single**. fy/quarter/week/lob are functional;
the rest cosmetic (no per-dim data in `btc_data.js`).
- FY/FQ/FW are **arbitrary (non-contiguous) multi-select** via **checkbox squares** (`.cb`) inside each dropdown
  (`toggleMulti` toggles a value in/out, kept in option order). The old contiguous-range auto-fill and the
  FY↔FQ↔FW `syncTime` linking were **removed** — each of FY/FQ/FW now filters independently. (`syncTime` is dead code.)
- `visIdx()` = fy∩quarter∩week over `TL` → drives charts + tables + KPIs; all-clear = all 312 wks.
- Collapse `»` sits in the Filters header row; collapsed → fixed `☰` at `right:18px` (card-edge aligned).
  **Reset filters** button (→ All) under the header.

**KPI cards** (3-per-row) — each carries a **change badge** (▲green/▼red %, no QoQ/WoW text) between first
& last selected period (week→WoW, quarter→QoQ, fy→YoY). ASU: ASU actuals · Adjusted ASU · Declines ·
New Contracts · Renewals. Rate: DS Forecast · BTC Adjusted · **AOP Target** · Forecast Rate · Adjusted Rate ·
Gap (whole-number unit gap). US number grouping (`xxx,xxx,xxx`); ASU shown in full (no `M`). Sub-text removed.

**Charts** (`svgChart`) — solid **actuals**, recolored **forecast** segment after the divider. `SPLIT_FW` is now set
per-LOB in `loadLob` to `shortFW(TL.fw[TL.fcStart-1])` — i.e. the divider sits **exactly at `fcStart` (FY27)**, so the
forecast recolor and the slider bend start at the same point (old fixed `'25-W25'` mismatch removed). Dashed vertical
line + "forecast →".
- **SR & Dispatches** — DS line (blue actuals → **orange** `#ea580c` forecast), **Adj / modifier** line (green
  `#16a34a` actuals → **red** `#dc2626` forecast), AOP **Target** dashed amber.
- **ASU** — 4 lines: **ASU actuals** green `#16a34a` (static baseline = unadjusted `nc+apos`, spans the whole
  timeline; the adjusted line splits off it at forecast start); **New Contracts** `#3a6ef0` (forecast segment only);
  **Renewals** light pink `#f9a8d4` before → purple `#6d28d9` after; **Adjusted ASUs** orange `#ea580c`
  (=`adjNew+btcApos`, forecast only). ASU total (orange) = New Contracts + Renewals.
- **Hover tooltip** — dots + floating box; swatch/dot colour is **segment-aware** (uses `fcColor` when the hovered
  index is past `splitPos`), so e.g. SR/Disp Adj shows green before forecast, red after.

**Sliders** — range **−150%…+150%, neutral 0** (0 = forecast). Disp/SR **BTC Modifier**: `adj=nd·(1+(p/100)·ramp)`,
`ramp=(w/(N−1))^8`. ASU **New Contract**(blue)+**APOS Renewal**(purple): mult `=1+p/100`,
`adjNew=nc·mult`, `btcApos=apos·mult`. Negative bends down, positive up; at 0 the adjusted line overlays the
neutral forecast. Slider shortened (`flex:0.55`), number box widened (`82px`). `clampP()` clamps to [−150,150].

**Editable table** — adjusted cells on **forecast rows** are inputs (`.ec`): Disp/SR **Adj**; ASU **Adj New**+**BTC APOS**.
Edits store per-week in `OVR{disp,sr,asu}` (wins over slider), recompute chart/KPIs; cleared on Reset / LOB switch.

## Future-state asks voiced in calls (product direction)

Slider + manual-precise-input BTC tool (replacing the manual 4-tab Excel); what-if scenario
modeling anyone can run live (Power BI-style visibility before Julius load, to cut validation
lag); vintage/ship-quarter dimension in the forecast; new-product/no-history intake (model off
production plan / predecessor LOB / market inputs); software ASU inclusion; region/geo drill-down;
initiative-level (triad) impact tracking connected end-to-end.
