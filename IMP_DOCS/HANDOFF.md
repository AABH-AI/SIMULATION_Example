# HANDOFF — ISG BPA Project
> Quick-start context for any new AI session or teammate.
> Last updated: 2026-06-23 | Owner: Arnav Bhargava (arnav.bhargava@alignedautomation.com)

---

## What This Project Is
Interactive simulation + analytics dashboards for **ISG BPA: Business Planning and Analytics** at Aligned Automation Services. Hosted as a static GitHub Pages site — pure HTML/CSS/JS, no backend.

## Live URLs
- **Site**: https://aabh-ai.github.io/SIMULATION_Example/
- **Repo**: https://github.com/AABH-AI/SIMULATION_Example
- **Branch**: `master` (Pages served from master)

---

## Active Files

| File | Role |
|---|---|
| `BPA_FORCASTING_MOCK.HTML` | **Active development file** — rebuilt version of the dashboard (sessions 14+) |
| `index.html` | Landing page — Primary Tools grid + searchable all-modules list |
| `IBP_Forcasting.html` | Legacy main dashboard — 5 modules, stable, not under active development |
| `bend_the_curve.html` | Goal-first strategic planning with lever toggles |
| `dell_workflow.html` | Dell workflow simulation (standalone) |
| `TODO` | Backlog for Actuals Profiling future work |
| `CLAUDE.md` | Claude Code guidance for this repo |
| `IMP_DOCS/` | This folder — always keep updated |

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
  - 5-line chart: PowerEdge · APEX · VXRAIL · POWERFLEX · AVAMAR
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
| **Product Group** | `lob` | All, ISG, ESG, HES | All |
| Location | `location` | All + 4 values | All |
| Queue | `queue` | All + 4 values | All |

> **Note**: Filter panel label reads "Product Group" but the internal `data-group` key remains `"lob"` to avoid breaking existing filter logic.

### Key Filter Helpers
```js
getActiveFilters()         // returns { group: [values] } — group absent = All selected
getActiveFYMultiplier()    // FY26=1.0, FY27=1.08, FY25=0.93; avg if multiple selected; 0 if none
getDPLOBMult()             // returns 0.60/0.25/0.15 for ISG/ESG/HES; 1.0 for All
shouldHideAll()            // true if FY, Quarter, Month, or Region has 0 selected
resetPageFilters()         // resets FY→FY26, Quarter→Q1, LOB→All; closes open dropdowns
```

### Product Group Demand Splits
```js
const DP_LOB_SHARE = { ISG: 0.60, ESG: 0.25, HES: 0.15 };  // quadrant chart scaling
// Exact per-group demand arrays (ISG+ESG+HES = combined total):
const DP_TREND_PG = { ISG: { yoy:[...], qoq:[...] }, ESG: {...}, HES: {...} };
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

## Current State (2026-06-22)

- `BPA_FORCASTING_MOCK.HTML` — active file, all changes pushed and live
- `IBP_Forcasting.html` — stable, session 13 was last update
- `TODO` — tracked, contains Actuals Profiling backlog
- All filter logic filter-aware in BPA mock (FY + Product Group drive chart scaling)
- Global filter reset (`resetPageFilters`) fires on every page switch

---

## New AI Session — Paste This
```
Project: ISG BPA dashboard — Aligned Automation Services
Repo: D:\OneDrive - Aligned Automation Services Private Limited\Documents\simulations
Live: https://aabh-ai.github.io/SIMULATION_Example/
ACTIVE file: BPA_FORCASTING_MOCK.HTML (sessions 14+)
Legacy file: IBP_Forcasting.html (sessions 1–13, stable)
Git binary: C:\Users\arnav.bhargava\AppData\Local\Programs\Git\bin\git.exe (not in PATH)
Git workflow: stash → pull --rebase origin master → stash pop → push

BPA_FORCASTING_MOCK modules:
  Forecast Accuracy (4 tabs incl. Forecast Trend) |
  Actuals Profiling (Profiling Overview + Demand Trends) |
  Demand Alerts | Data Management | What-If Simulation

Filters: FY + Product Group (data-group="lob") drive chart scaling.
resetPageFilters() fires on every switchPage() call.
Chart data: _dpBaseData (quadrant charts), _ftBaseData (forecast trend charts).

Read IMP_DOCS/ for full context before making changes.
```
