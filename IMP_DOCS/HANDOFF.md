# HANDOFF — TET BPA Project
> Quick-start context for any new AI session or teammate.
> Last updated: 2026-06-25 | Owner: Arnav Bhargava (arnav.bhargava@alignedautomation.com)

---

## What This Project Is
Interactive simulation + analytics dashboards for **TET BPA: Business Planning and Analytics** at He. Hosted as a static GitHub Pages site — pure HTML/CSS/JS, no backend.

## Live URLs
- **Site**: https://aabh-ai.github.io/SIMULATION_Example/
- **Repo**: https://github.com/AABH-AI/SIMULATION_Example
- **Branch**: `master` (Pages served from master)

---

## Active Files

| File | Role |
|---|---|
| `BPA_FORCASTING_MOCK.HTML` | **Active development file** — rebuilt version of the dashboard (sessions 14+) |
| `data.html` | **Standalone Data Management dashboard** — 3 tabs: Data Overview · Data Quality · Full Raw View (session 22) |
| `Week.html` | Prototype: Forecast Trend with SR/ASU/Dispatch switcher on main chart — review before merging to BPA |
| `index.html` | Landing page — Primary Tools grid + searchable all-modules list |
| `AST_Forcasting.html` | Legacy main dashboard — 5 modules, stable, not under active development |
| `TET BPA — Business Planning and Analytics.html` | **Redesign of `AST_Forcasting.html`** — 6 Actuals Profiling channels (adds Field Services & Care using previously-unused trend data), teal design system, realistic FY26 data anchors (1.47M ASU / 5.87L SR / 2.34L Dispatch). Filename follows the em-dash "Title — Suffix" convention (matches its own `<title>` tag). Renamed from `AST_Forcasting_v2.html` on 2026-06-25 |
| `bend_the_curve.html` | Goal-first strategic planning with lever toggles |
| `TODO` | Backlog for Actuals Profiling future work |
| `CLAUDE.md` | Claude Code guidance for this repo |
| `IMP_DOCS/` | This folder — always keep updated |
| `forecast_copilot/*.html` | **Separate product** — "Forecast Copilot" AI Planning Suite, 6 self-contained pages, light theme (teal accent). Pushed and live on GitHub Pages. See dedicated section below. |

Legacy (do not delete, just ignore): `epic_dashboard_mockup.html`, `executive_forecast_operational_dashboard.html`, `simulation-overview-platform.html`, `enterprise_whatif_forecasting_platform.html`

---

## BPA_FORCASTING_MOCK.HTML — Module Structure

| moduleId | Title | Sub-pages |
|---|---|---|
| `forecast-accuracy` | Forecast Accuracy | Forecast Overview · Weekly Actuals & Metrics · Location & Partner View · **Forecast Trend** |
| `demand-profiling` | Actuals Profiling | **Profiling Overview** · **Demand Trends** |
| `demand-alerts` | Demand Planning Alerts | Alerts Log |
| `data-raw` | Data Management | Full Raw View |
| `whatif` | What-If Simulation | Simulation Controls · Scenario Playground · Forecast Publish |

---

## Forecast Trend Sub-page (`fa-page-forecast-trend`)

**KPI strip** (4 cards):
| Card | ID | Value |
|---|---|---|
| Current Week | `ft-current-week` | W22 (from `weeks[TODAY_IDX]`) |
| ASU Forecast Accuracy | `ft-asu-acc` | `95.4% + (fyMult-1)×1.8` |
| SR Forecast Accuracy | `ft-sr-acc` | `100 - MAPE` (from SR error data) |
| Dispatch Forecast Accuracy | `ft-dsp-acc` | `97.1% + (fyMult-1)×1.2` |

Color coded: ≥95% green · ≥90% amber · <90% red.

**Two-column layout:**
- **Left (~65%)** — **SR / ASU / Dispatch metric switcher** + weekly trend chart
  - `[SR] [ASU] [Dispatch]` toggle buttons (`ft-metric-btn`) call `switchChartMetric(metric, btn)`
  - Switching updates: chart title · subtitle · Actuals/Forecast/Adj/AOP datasets · y-axis format callback
  - Solid blue = Actuals, dashed green = Forecast, dotted amber = Adj. Forecast, indigo dash-dot = AOP
  - AOP: per-metric per-FY flat target from `AOP_METRIC_TARGETS`, always visible regardless of filters
  - Vertical "▶ Current Week" divider drawn at `TODAY_IDX` via inline Chart.js plugin
  - Responds to FY + Product Group filters via `updateForecastTrendChart()`
  - Key constants: `FT_METRIC_CONF` (title/sub/yFmt per metric), `AOP_METRIC_TARGETS` (SR/ASU/Dispatch × FY25/FY26/FY27)
  - Key globals: `_ftMetric` (current metric), `_ftMetricData` (actuals/forecast/adj per metric, seeded PRNG)
- **Right (~35%)** — **Weekly LOB Breakdown** (`fa-chart-lob-weekly`)
  - 5-line chart: five product-line series
  - X-axis: W01–W52, always static — only the Week filter (all-unchecked) blanks it
  - SR / ASU / Dispatch toggle via `switchLOBMetric()` · stat tiles (MAPE/Bias) **removed**

Base data: `_ftBaseData` (SR base), `_ftMetricData` (ASU + Dispatch generated in `initForecastTrendChart()`), `LOB_WEEKLY_DATA` (seeded PRNG, generated once).

---

## Actuals Profiling (`demand-profiling`)

### Profiling Overview (`dp-page-overview`)
- 4-quadrant demand classification matrix (Consistent / Erratic / Intermittent / Lumpy)
- 84-point monthly Chart.js line charts (2016–2022), no fill, year-only X-axis ticks
- Responds to FY + Product Group filters via `updateDPQuadrantCharts()`
- CV info button ("i") on X-axis label — popup explains CV formula + Low/High threshold
- KPI chips: no "SKUs" suffix (just "Consistent", "Erratic", etc.)

### Demand Trends (`dp-page-trends`)
- Two Chart.js bar+line mixed charts: **YoY** (annual) and **QoQ** (quarterly)
- Color-coded bars: green = up period, red = down, grey = first period (no prior)
- Dashed line overlay on secondary Y-axis shows % change
- Responds to FY + Quarter + Product Group filters via `updateDemandTrends()` — **clips visible data** to selected FY/Quarter, does not just scale
- Per-product-group demand splits stored in `DP_TREND_PG` (keys: `yoy`, `qoq`)
- Filter metadata:
  - `YOY_FY_TAG` — maps each YoY bar index to its FY value (`null` = historical FY22–24)
  - `QOQ_FY_TAG` / `QOQ_Q_TAG` — maps each QoQ bar to its FY + Quarter
- FY24 historical bars only appear when all 3 FYs are selected

---

## Filter System

### Filter Groups
| Group | `data-group` | Values | Default |
|---|---|---|---|
| Fiscal Year | `fy` | FY25, FY26, FY27 | FY26 checked |
| Quarter | `quarter` | Q1–Q4 | Q1 checked |
| Month | `month` | All, M1–M6 | All |
| Week | `week` | All, W1–W52 | All |
| Region | `region` | All, AMER, EMEA, APJ | All |
| Sub-Region | `subregion` | All + 7 values | All |
| **Product Group** | `lob` | All, TET, TES, THS | All |
| Location | `location` | All + 4 values | All |
| Queue | `queue` | All + 4 values | All |

> **Note**: Filter panel label reads "Product Group" but the internal `data-group` key remains `"lob"` to avoid breaking existing filter logic.

### Key Filter Helpers
```js
getActiveFilters()         // returns { group: [values] } — group absent = All selected
getActiveFYMultiplier()    // FY26=1.0, FY27=1.08, FY25=0.93; avg if multiple selected; 0 if none
getDPLOBMult()             // returns 0.60/0.25/0.15 for TET/TES/THS; 1.0 for All
shouldHideAll()            // true if FY, Quarter, Month, or Region has 0 selected
resetPageFilters()         // resets FY→FY26, Quarter→Q1, LOB→All; closes open dropdowns
```

### Product Group Demand Splits
```js
const DP_LOB_SHARE = { TET: 0.60, TES: 0.25, THS: 0.15 };  // quadrant chart scaling
// Exact per-group demand arrays (TET+TES+THS = combined total):
const DP_TREND_PG = { TET: { yoy:[...], qoq:[...] }, TES: {...}, THS: {...} };
```

### Global Filter Reset
`resetPageFilters()` is called at the **start of every `switchPage()` call** — filters always reset to defaults when navigating between any sub-pages.

---

## Chart Architecture (BPA_FORCASTING_MOCK.HTML)

| Store | Holds | Notes |
|---|---|---|
| `chartInstances` | All Chart.js instances (FA, DP quadrants, Demand Trends, FT) | Destroyed + recreated on every `openDashboard()` call |
| `wiCharts` | What-If Simulation Chart.js instances | Managed separately via `wiInit()` |
| `_dpBaseData` | Raw seeded quadrant chart data arrays | Set in `initDemandProfilingQuadrants()`, used by `updateDPQuadrantCharts()` |
| `_ftBaseData` | Raw seeded SR trend + plan forecast arrays | Set in `initForecastTrendChart()`, used by `updateForecastTrendChart()` |

### `applyAllFilteredCharts()` — what it updates
1. `updateFARegionChart()` — Forecast Accuracy region bar
2. `updateFAPartnerChart()` — Partner MDR chart
3. `updateFAOverviewChart()` — Overview line chart
4. `updateDPQuadrantCharts()` — scales quadrant data by LOB + FY
5. `updateDemandTrends()` — sums DP_TREND_PG by selected product groups + FY
6. `updateForecastTrendChart()` — scales SR trend + error chart by LOB + FY

---

## Git Workflow

```powershell
$git = "C:\Users\arnav.bhargava\AppData\Local\Programs\Git\bin\git.exe"
& $git add <files>
& $git commit -m "message"
& $git stash
& $git pull --rebase origin master   # CRITICAL — GH Actions auto-commits manifest.json
& $git stash pop
& $git push origin master
```

---

## data.html — Standalone Data Management Dashboard (Session 22)

Purpose-built standalone page (995 lines, no BPA dependencies). Auto-opens to Data Overview on load.

### Tab 1: Data Overview
- KPIs computed live from `rawData`: Total Records · Completeness · Anomalies · Duplicates
- Horizontal bars: Records by Region · Product Group Mix · Partner Coverage
- Status by Region (stacked horizontal bar: Within Tolerance / Needs Review)
- Weekly SR Trend by Region (3-line seeded seasonal chart, W01–W52)

### Tab 2: Data Quality
- **Hero**: animated counter counts from 0.0 to real health score in 1.1s — one orchestrated moment, nothing else moves. Respects `prefers-reduced-motion`.
- Verdict text + description + pills: all computed from `rawData`, verdict changes based on score
- Field Completeness grid: 10 fields, CSS progress bars (animate on first load), green/amber/red
- Anomaly Rate by Quarter: bar chart, colour-coded by severity (>6% red, >3% amber, else green)
- SR Range by Region: Min/Max/Avg/Std Dev in IBM Plex Mono
- Anomaly Log: table filtered to rows where `status !== 'Within Tolerance'`

### Tab 3: Full Raw View
- Sticky-header sortable table, 13 columns, search across all values
- CSV + JSON export (filtered rows only)
- LOB column colour-coded: TET=#3a6ef0 · TES=#16a34a · THS=#7c3aed

### data.html Architecture
```js
function seeded(s) { return () => { s=(s*16807)%2147483647; return (s-1)/2147483646; }; }
const rng = seeded(1618);
const rawData = Array.from({length:150}, ...) // deterministic 150-record dataset

const tabInited = {};
function switchTab(tab, btn) { /* lazy init via setTimeout(80) on first visit */ }
function mkChart(id, type, data, opts) { /* null-safe factory, destroys existing */ }
```
- ~7.3% anomaly rate (seeded) → ~11 records "Needs Review"
- `chartInstances{}` store (same pattern as BPA)

---

## Forecast Copilot — `forecast_copilot/` (rebuilt + light theme + pushed 2026-06-25)

A **separate, standalone product** from the TET BPA suite — an "AI Planning Suite" for BTC (Bend-The-Curve) forecast planning. Light theme (Inter font, teal `#0d9488` accent — converted from the original dark navy/teal so it matches the rest of the TET BPA suite's "no dark mode" convention), 6 self-contained pages, no shared CSS/JS between files or with the TET BPA suite. **Now pushed and live** at `forecast_copilot/*.html` — a repo-root `.nojekyll` file was added so GitHub Pages serves the dotfolder (Jekyll excludes dotfiles/folders by default, which would otherwise 404 every page). Linked as the top Primary Tool card in `index.html` and `landing_v2.html`.

### Files (nav order)
| File | Purpose |
|---|---|
| `Dashboard` | 9 KPI cards, Forecast vs Target table, 5 trend charts |
| `ASU Simulation` | Manual Simulation (NC/Renewals override sliders, real ASU-conversion formula) + Recommendation Mode (Accept/Modify/Reject) |
| `Historical Performance` | 12-quarter BTC/accuracy/AOP/Modernization trends, Forecast vs Actual |
| `AI BTC Advisor` | Real 3-strategy BTC Recommendation Engine (Historical Best Fit / Balanced / Closest to AOP) + Manual override |
| `BTC Distribution` | Automatic Weekly Distribution (Equal/Historical/AI Recommended modes), Weekly Forecast Table, region/LOB/business/service breakdowns |
| `Final Forecast` | Original/Scenario/BTC/Final forecast chart, Submission Summary, status checks, Approve/Submit buttons |

### What changed in this rebuild
The previous version (built by an earlier session, never merged to master) had a **fully cosmetic filter and interaction layer** across all 6 pages — every dropdown only changed a button's label text, 3-way toggles only swapped an `.active` CSS class, and almost every number on every page was a static value baked into the HTML at authoring time. Confirmed via full audit before starting: zero `localStorage`/`sessionStorage` usage anywhere, no filter click handler touched any chart/KPI/table, and the one working slider pair (ASU Simulation) applied a single crude multiplier uniformly across ASU/SR/Dispatch rather than the distinct formula the page's own subtitle described.

Rebuilt as a real, wired application:
- **Cross-page shared state** (`fc_state_v1` in `localStorage`) — filters, NC/Renewals overrides, selected BTC strategy, distribution mode, and approvals all persist and carry forward when navigating between pages (confirmed via a full simulated navigation test: change a filter on Dashboard → it's already selected when ASU Simulation loads → an override set there is visible on AI BTC Advisor → a BTC strategy picked there flows through to BTC Distribution and Final Forecast)
- **Seeded dummy-data engine** (`fcGenerateWeeklySeries` / `fcGenerateHistory`) — same seeded-PRNG pattern as `data.html` (`seeded(s)`), keyed by the active Region/LOB/Business/Service/Quarter combo so the same filter selection always produces the same numbers (deterministic) while different combos produce genuinely different, realistically-scaled ones
- **Real business-logic pipeline**: New Contracts + Renewals → ASU (`ASU[w] = ASU[w-1] - Expirations[w] + Renewals[w] + New Contracts[w]`, with Expirations and Renewals modeled as distinct variables, not folded into one factor) → SR → Dispatch, matching the spec's funnel exactly
- **BTC Recommendation Engine** computes 3 genuinely distinct values every time (e.g. Historical Best Fit 5.87% / Balanced 5.04% / Closest to AOP 4.2% for the default filter combo) — Historical Best Fit is a recency-weighted average of 12 historical quarters, Closest to AOP is derived from the accuracy-shortfall-driven target gap, Balanced is their midpoint
- **Automatic Weekly Distribution**: Equal/Historical/AI Recommended modes produce genuinely different per-week shapes while always summing to the identical total uplift (verified: same total, different weekly split)
- **BTC scale confirmed with user before implementing**: BTC is a small bend/uplift percentage (single digits to ~15-20%), matching what the pre-existing Historical BTC Trend chart and AI BTC Advisor already displayed — not a large 90%+ achievement metric (the spec's own example numbers used that larger scale, but implementing it would have contradicted the rest of the already-built app)
- Every JS file was extracted and executed under Node's `vm` module during development to smoke-test the math before considering a page done — caught and fixed one real bug (Target was defined as a fraction of the current forecast, so it was always below baseline and "Closest to AOP" always clamped to 0%)

### Known state
- Pushed to git — `forecast_copilot/*.html` is now tracked (added as an explicit exception; `.claude/worktrees/` and `.claude/settings.local.json` are ignored via `.gitignore` so a future broad `git add .claude/` stays safe)
- Live on GitHub Pages via a repo-root `.nojekyll` file
- Drill-down is implemented as making the existing filter panel fully functional (spec's own workflow describes selecting Quarter → Region → LOB → Business → Service as the drill-down path) rather than a separate UI

---

## Current State (2026-06-25)

- `BPA_FORCASTING_MOCK.HTML` — active, live on GitHub Pages
  - Forecast Trend: SR/ASU/Dispatch switcher on main chart, per-FY AOP line, Weekly LOB Breakdown right panel
  - Actuals Profiling: 4-quadrant overview + Demand Trends (WoW/MoM/QoQ)
- `data.html` — new standalone Data Management file (3 tabs), local only pending review
- `Week.html` — Forecast Trend prototype (SR/ASU/Dispatch on main chart), local pending review
- `AST_Forcasting.html` — stable, session 13 was last update
- `TET BPA — Business Planning and Analytics.html` — redesign of `AST_Forcasting.html`, pushed to GitHub Pages, linked from `index.html` and `landing_v2.html` as a Primary Tool
- `forecast_copilot/*.html` — Forecast Copilot rebuilt with real cross-page state and business logic, converted to light theme, pushed to GitHub Pages (via repo-root `.nojekyll`), linked as the top Primary Tool card in `index.html` and `landing_v2.html`

---

## New AI Session — Paste This
```
Project: TET BPA dashboard — He
Repo: D:\OneDrive - He\Documents\simulations
Live: https://aabh-ai.github.io/SIMULATION_Example/
ACTIVE file: BPA_FORCASTING_MOCK.HTML (sessions 14+)
NEW standalone: data.html (Data Management, 3 tabs), Week.html (Forecast Trend prototype)
Legacy: AST_Forcasting.html (sessions 1–13, stable)
Redesign: "TET BPA — Business Planning and Analytics.html" (renamed from AST_Forcasting_v2.html) — 6 Actuals Profiling channels, teal theme, FY26 data
Git binary: C:\Users\arnav.bhargava\AppData\Local\Programs\Git\bin\git.exe (not in PATH)
Git workflow: stash → pull --rebase origin master → stash pop → push
SEPARATE PRODUCT: forecast_copilot/*.html — Forecast Copilot AI Planning Suite (6 pages, light theme, pushed & live via .nojekyll, top card in index.html/landing_v2.html)

BPA_FORCASTING_MOCK modules:
  Forecast Accuracy (Forecast Trend with SR/ASU/Dispatch switcher + AOP line + Weekly LOB Breakdown) |
  Actuals Profiling (4-quadrant + Demand Trends WoW/MoM/QoQ) |
  Demand Alerts | Data Management | What-If Simulation

Filters: FY + Product Group (data-group="lob") drive chart scaling.
resetPageFilters() fires on every switchPage() call.
Chart data: _dpBaseData (quadrant), _ftBaseData + _ftMetricData (forecast trend SR/ASU/Dispatch).

Forecast Copilot (forecast_copilot/) nav order: Dashboard -> ASU Simulation -> Historical -> AI BTC Advisor -> BTC Distribution -> Final Forecast.
Shared engine (identical embedded block in all 6 files): fcState (localStorage key fc_state_v1) holds filters/overrides/btcStrategy/distMode/approvals. fcCompute() runs the full New Contracts->Renewals->ASU->SR->Dispatch->BTC pipeline.

Read IMP_DOCS/ for full context before making changes.
```
