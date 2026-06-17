# HANDOFF — ISG BPA Project
> Quick-start context for any new AI session or teammate.
> Last updated: 2026-06-17 | Owner: Arnav Bhargava (arnav.bhargava@alignedautomation.com)

---

## What This Project Is
Interactive simulation + analytics dashboards for **ISG BPA: Business Planning and Analytics** at Aligned Automation Services. Hosted as a static GitHub Pages site — pure HTML/CSS/JS, no backend.

## Live URLs
- **Site**: https://aabh-ai.github.io/SIMULATION_Example/
- **Repo**: https://github.com/AABH-AI/SIMULATION_Example
- **Branch**: `master` (Pages served from master)

## Active Files

| File | Role |
|---|---|
| `index.html` | Landing page — Primary Tools grid + searchable all-modules list |
| `IBP_Forcasting.html` | **Main dashboard** — 4 modules + What-If Simulation |
| `enterprise_whatif_forecasting_platform.html` | Standalone What-If Simulation |
| `bend_the_curve.html` | Goal-first strategic planning with lever toggles |
| `dell_workflow.html` | Dell workflow simulation |
| `IMP_DOCS/` | This folder — always keep updated |

Legacy (do not delete, just ignore): `epic_dashboard_mockup.html`, `executive_forecast_operational_dashboard.html`, `simulation-overview-platform.html`

---

## Modules Inside IBP_Forcasting.html

| moduleId | HTML div | Title |
|---|---|---|
| `forecast-accuracy` | `#module-forecast-accuracy` | Actuals Accuracy |
| `demand-profiling` | `#module-demand-profiling` | Demand Profiling |
| `demand-alerts` | `#module-demand-alerts` | Demand Planning Alerts |
| `data-raw` | `#module-data-raw` | Data Raw |
| `whatif` | `#module-whatif` | What-If Simulation |

---

## Session Summary — 2026-06-17

### Goal of the Task
Two changes requested for `IBP_Forcasting.html`:

1. **Remove dark theme — white/light theme only, permanently.** No toggle button, no dark mode.
2. **Demand Profiling → Overall tab redesign.** Replace generic cards and charts with ISG-specific Overall metrics and four specific graph types: Region Wise, QoQ, MoM, WoW (9-week).

---

### Files Inspected

| File | Why |
|---|---|
| `IBP_Forcasting.html` | Full read of CSS `:root` / `[data-theme]` blocks, HTML structure for Overall tab (`#dp-channel-overall`), JS theme toggle, chart init (`initCharts`), filter-aware update functions, `TREND_DATA_52`, `FILTER_AWARE_CHARTS`, `switchChannel`, `applyAllFilteredCharts` |
| `IMP_DOCS/HANDOFF.md` | Read before overwriting to preserve project-level context |

---

### Files Modified

#### `IBP_Forcasting.html` (sole modified file)

**Change 1 — White theme permanent (CSS, ~lines 12–63)**
- Old: `:root` held dark color tokens; `[data-theme="light"]` was a secondary override.
- New: `:root` now holds the light theme tokens directly. The `[data-theme="light"]` block is removed entirely.
- Light values now baked in as the single source of truth.

**Change 2 — Theme toggle button removed (HTML, ~line 641)**
- Removed `<button onclick="toggleTheme()">` from `#dashboard-view .header-right`.

**Change 3 — JS `isDark` + Chart defaults (JS, ~lines 1248–1497)**
- `let isDark = true` → `let isDark = false`
- `Chart.defaults.color = '#6b758f'` → `'#5a6280'` (light-theme text-2)
- `toggleTheme()` function removed entirely (no longer needed; `gridColor()` / `axisColor()` still exist and return light-mode values since `isDark = false`)

**Change 4 — Overall tab KPI cards (HTML, `#dp-channel-overall`)**
- Old: 4 generic KPIs (Total Demand, Forecast Accuracy, Total SRs, Avg Weekly Volume)
- New: 4 ISG-specific KPIs

| Label | Value | Accent |
|---|---|---|
| Overall Forecast ISG | 284.6K | `var(--accent)` / +5.2% vs PY |
| Overall Actuals | 271.3K | default / +3.8% vs PY |
| Overall Accuracy | 95.4% | `var(--green)` / Target: 92% |
| Overall Variance | +4.8% | `var(--amber)` / Forecast vs Actuals |

Element IDs: `#ov-kpi-forecast`, `#ov-kpi-actuals`, `#ov-kpi-accuracy`, `#ov-kpi-variance`

**Change 5 — Overall tab charts (HTML + JS)**
- Old: 2 charts — `dp-chart-overall-stacked` (stacked bar by sub-region) + `dp-chart-overall-trend` (8-week line, 3 channels)
- New: 4 charts across 2 rows

| Chart ID | Title | Type | Description |
|---|---|---|---|
| `dp-chart-overall-region` | Region Wise — Forecast vs Actuals | Grouped bar | AMER / EMEA / APJ — ISG Forecast + Actuals |
| `dp-chart-overall-qoq` | QoQ — Quarter on Quarter | Grouped bar | Q1–Q4 Forecast vs Actuals |
| `dp-chart-overall-mom` | MoM — Month on Month | Line (filled) | M1–M6 Forecast vs Actuals |
| `dp-chart-overall-wow` | WoW — Week on Week (9-Week Trend) | Line (filled) | W1–W9 default, filter-window aware |

**Change 6 — New JS data constants (added after `FA_PARTNER_BASE`)**
```js
DP_OVERALL_REGION_BASE  // { AMER, EMEA, APJ } — { forecast, actuals }
DP_OVERALL_QOQ_BASE     // { forecast: [Q1..Q4], actuals: [Q1..Q4] }
DP_OVERALL_MOM_BASE     // { forecast: [M1..M6], actuals: [M1..M6] }
```

**Change 7 — New TREND_DATA_52 keys (added to existing object)**
```js
'dp-ov-forecast': _makeTrend(1175, 130, 0)   // 52-week overall ISG forecast
'dp-ov-actuals':  _makeTrend(1115, 125, 0)   // 52-week overall actuals
```

**Change 8 — FILTER_AWARE_CHARTS set updated**
- Removed: `dp-chart-overall-stacked`
- Added: `dp-chart-overall-region`, `dp-chart-overall-qoq`, `dp-chart-overall-mom`, `dp-chart-overall-wow`

**Change 9 — Chart update functions replaced**
- Removed: `updateDPOverallStackedChart()`, `updateDPOverallTrendChart()`
- Added: `updateDPOverallRegionChart()`, `updateDPOverallQoQChart()`, `updateDPOverallMoMChart()`, `updateDPOverallWoWChart()`

Each new function respects:
- Region filter (`getActiveFilters().region`)
- FY multiplier (`getActiveFYMultiplier()`)
- Week-index window for WoW (`getSelectedWeekIndices().slice(0,9)`)

**Change 10 — `applyAllFilteredCharts()` updated**
- Now calls all 4 new Overall update functions instead of the 2 removed ones.

**Change 11 — `switchChannel()` updated**
- Chart refresh list now references 4 new Overall chart IDs instead of stacked/trend.

---

### Current State

- **Theme**: Permanently white/light. No toggle. `isDark = false` hardcoded.
- **Demand Profiling → Overall tab**: 4 ISG KPI cards + 4 charts (Region, QoQ, MoM, WoW-9wk).
- **Field Services tab**: Unchanged (Region bar + Dispatch Trend line).
- **Care tab**: Unchanged (Sub-region bar + AMER/EMEA/APJ trend line).
- **All other modules**: Unchanged (Forecast Accuracy, Alerts, Raw Data, What-If).
- **File not committed yet** — changes are local only.

---

### Tests Run and Results

- No automated test suite exists (static HTML project).
- Manual verification done via code inspection:
  - All old chart IDs (`dp-chart-overall-stacked`, `dp-chart-overall-trend`) confirmed absent via grep — 0 matches.
  - All new chart IDs confirmed present in HTML (canvas), JS init, FILTER_AWARE_CHARTS, update functions, and switchChannel.
  - `toggleTheme` / `ti-moon` / `isDark = true` confirmed absent — 0 matches.
  - `:root` CSS confirmed as light-theme values only.
- **Browser test**: Not yet run (no browser launched in this session). Visual verification pending.

---

### Known Issues / Things to Watch

1. **WoW chart with week-filter active**: When the user selects a specific subset of weeks in the right panel (e.g., only W20–W30), `getSelectedWeekIndices()` returns those. `slice(0,9)` takes the first 9 of that filtered set — which is correct behaviour but may show e.g. W20–W28 instead of W1–W9. This is intentional but should be confirmed with user.

2. **QoQ / MoM charts + week filter**: QoQ and MoM use static base arrays (not derived from the 52-week trend). They respond to FY multiplier only. Quarter/month/week filter panel selections do not adjust QoQ or MoM chart windows (those are by definition fixed at Q1–Q4 / M1–M6). This is correct conceptually but worth confirming.

3. **KPI card values are static mock data**: `#ov-kpi-forecast`, `#ov-kpi-actuals`, etc. are hardcoded HTML values. They do not update when filters change. If dynamic KPI update is needed, a JS function tied to `applyAllFilteredCharts` will need to be added.

4. **`BPA_FORCASTING_MOCK.HTML`** appears in `git status` as modified (pre-existing change from a prior session). Not touched in this session — needs a separate commit or review.

5. **`TODO` file** is untracked in git. Unknown content — should be reviewed before next commit.

---

### Next Exact Steps

#### Immediate (visual QA)
1. Open `IBP_Forcasting.html` in a browser (double-click or local server).
2. Confirm home page renders in white/light theme with no dark background.
3. Click **Demand Profiling** tile → confirm breadcrumb reads `Home › Demand Profiling › Profiling Overview`.
4. On Overall tab confirm: 4 KPI cards (ISG Forecast / Actuals / Accuracy / Variance) visible.
5. Confirm 4 charts render below in 2 rows: Region Wise, QoQ (top row) and MoM, WoW-9wk (bottom row).
6. Switch to Field Services and Care tabs — confirm they still work normally.
7. Open the filter panel (top-right ≡ icon) — toggle region/FY/quarter filters and confirm the 4 Overall charts update responsively.
8. Confirm no theme toggle button appears in the header.

#### If visual QA passes
9. Commit `IBP_Forcasting.html` with a clear message.
10. Decide what to do with `BPA_FORCASTING_MOCK.HTML` changes (commit separately or discard).
11. Push to master: `git push origin master`.

#### Pending feature requests (not yet started)
- Field Services tab and Care tab may need similar KPI / chart upgrades to match the Overall tab's level of specificity.
- Dynamic KPI cards in Overall tab (values that update with filters).
- Sub-tabs or deeper drill-down inside the Overall, QoQ, MoM, WoW charts.

---

## New AI Session — Paste This
```
Project: ISG BPA dashboard for Aligned Automation Services.
Repo path: D:\OneDrive - Aligned Automation Services Private Limited\Documents\simulations
Live site: https://aabh-ai.github.io/SIMULATION_Example/
Main file: IBP_Forcasting.html (5 modules including What-If Simulation)
Git binary: C:\Users\arnav.bhargava\AppData\Local\Programs\Git\bin\git.exe (not in PATH)
Always: git pull --rebase origin master before push (GH Actions auto-commits manifest.json)

Last session (2026-06-17):
- IBP_Forcasting.html: white theme permanent, Overall tab rebuilt with 4 KPI cards
  (Overall Forecast ISG / Actuals / Accuracy / Variance) and 4 charts
  (Region Wise, QoQ, MoM, WoW-9wk). Changes local, not yet committed.
- BPA_FORCASTING_MOCK.HTML has pre-existing uncommitted changes (unrelated).

Read IMP_DOCS/ for full context:
- HANDOFF.md      → this file (project overview + last session detail)
- DESIGN_SYSTEM.md → CSS tokens, fonts, Chart.js
- TECHNICAL.md    → architecture, What-If spec, Git workflow
- PROMPT_TRAIL.md → full history of what was built and why
```
