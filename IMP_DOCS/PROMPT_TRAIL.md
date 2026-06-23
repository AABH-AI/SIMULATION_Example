# Prompt Trail — ISG BPA
> Chronological log of every major request and what was built/fixed. Update after each session.
> Last updated: 2026-06-23

---

## Session 1 — Initial Dashboard (Supply Chain Goliath era)
**Files**: `epic_dashboard_mockup.html`
**What was built**:
- Left accordion nav panel, right Power BI-style filter panel
- Dark/light theme, CSV export, rule-based Smart Insights banner
- No pie charts (replaced with horizontal bar charts)

---

## Session 2 — Rebranding & Professional Redesign
**Files**: `IBP_Forcasting.html`, `index.html`
**Prompts**: Rename to ISG BPA, recreate UI professionally
**What was done**:
- Full title/branding rename; adopted Indigo-Black design system
- Plus Jakarta Sans + IBM Plex Mono font pairing
- Rebuilt left nav, filter chips, breadcrumb, KPI cards

---

## Session 3 — Landing Page + Two New Modules
**Files**: `index.html`, `bend_the_curve.html`, `IBP_Forcasting.html`
**What was built**:
- `index.html`: 3-column Primary Tools grid + searchable All Modules list
- `bend_the_curve.html`: 8 toggle levers, target slider, gap-to-target chart
- What-If Simulation added as native module inside `IBP_Forcasting.html`

---

## Session 4 — Theme Switcher Fix
**Root cause**: `[data-theme="light"]` still had dark nav tokens.
**Fix**: `--nav-bg: #ffffff`, `--nav-hover: #eef1fc`. Also fixed `wiCharts` missing from theme toggle loop.

---

## Sessions 5–10 — What-If Simulation Buildout
(Various slider, chart, scenario, and publish page iterations in `IBP_Forcasting.html`)

---

## Session 11 — What-If Slider Reorder + Data Raw Rename
**Files**: `IBP_Forcasting.html`
**Prompts**:
- Reorder What-If sliders: New Contract Growth first, APOS Renewal second
- Rename Data Raw → Data Management
- Update What-If tile stat to show lever names

**What was done**:
- `WI_SLIDERS` array reordered: growth (index 0), renewal (index 1)
- `modules['data-raw'].title` → `'Data Management'`; home tile updated

---

## Session 12 — Remove Forecast Modifier + Hide Filters in What-If
**Files**: `IBP_Forcasting.html`
**What was done**:
- `WI_SLIDERS`: removed `{ key:'modifier', ... }` entry; `wiState.modifier` removed
- `wiCompute()`: removed all `st.modifier` terms from all formulas
- `openDashboard()`: hides filter button + auto-collapses right panel for What-If

---

## Session 13 — Universal Filter Enforcement + KPI Sanity
**Files**: `IBP_Forcasting.html`
**Root causes**:
1. Chart update functions only checked `mult === 0` — Quarter/Month/Region empty states silently ignored
2. `switchChannel()` had no filter reset
3. `triggerDataUpdate()` fluctuated % values with no cap

**What was fixed**:
- Added `shouldHideAll()` — returns `true` if any of FY/Quarter/Month/Region has 0 selected
- Added `getSelectedQuarters()`, `getSelectedFiscalMonthIndices()`, `AP_MONTHS`/`Q_MONTH_IDX`
- Every chart update function calls `shouldHideAll()` guard
- `switchChannel()`: calls `resetFilters()` on every tab switch
- `triggerDataUpdate()`: % capped 0–99.9%, M suffix handled, signed values skipped

---

## Session 14 — BPA_FORCASTING_MOCK.HTML: Actuals Profiling Rebuild
**Files**: `BPA_FORCASTING_MOCK.HTML`
**Prompts**:
- Rebuild Actuals Profiling quadrant charts with monthly data and no fill
- Add CV info "i" button on X-axis label
- Add "Demand Trends" as a second sub-page (WoW / MoM / QoQ)

**What was built**:
- Replaced 28-pt quarterly Chart.js charts with 84-pt monthly series (2016–2022)
- Removed fill; X-axis shows year labels only via tick callback
- Seeded PRNG (`seeded(n)`) for reproducible mock data per demand category
- CV tooltip popup with formula (CV = Std Dev ÷ Mean), Low/High interpretation
- `toggleCVTooltip()` with outside-click dismissal
- New modules config entry: `demand-profiling` now has 2 pages: Profiling Overview + Demand Trends
- `dp-page-trends` HTML section with WoW/MoM/QoQ cards, each with `<canvas>` in a `.dp-trend-canvas-wrap`
- `initDemandTrends()`: Chart.js bar+line mixed charts, green/red color-coded columns, dashed % change overlay

---

## Session 15 — Filter-Aware Actuals Profiling + Product Group Rename
**Files**: `BPA_FORCASTING_MOCK.HTML`, `TODO`
**Prompts**:
- Make quadrant + trend charts respond to FY and LOB filters
- Rename LOB → Product Group (ESG / HES / ISG)
- Remove "SKUs" suffix from KPI card labels
- Reset filters when switching between sub-pages
- Create TODO backlog file

**What was done**:
- KPI labels: "Consistent SKUs" → "Consistent" (all 4 cards)
- Filter panel label: "LOB" → "Product Group" (internal `data-group="lob"` kept for compatibility)
- Table column headers + CSV/Excel export headers: "LOB" → "Product Group"
- `DP_LOB_SHARE = { ISG:0.60, ESG:0.25, HES:0.15 }` — demand shares for quadrant scaling
- `DP_TREND_PG` — exact per-product-group demand arrays (ISG+ESG+HES = combined totals)
- `getDPLOBMult()` — returns sum of selected group shares (1.0 for All)
- `updateDPQuadrantCharts()` — scales `_dpBaseData` arrays by LOB × FY multiplier
- `updateDemandTrends()` — sums `DP_TREND_PG` for selected groups, scales by FY, recalculates % change
- `_dpBaseData` global — stores raw seeded data set by `initDemandProfilingQuadrants()`
- `resetDPFilters()` renamed to `resetPageFilters()`; called in `switchPage()` for DP pages
- `applyAllFilteredCharts()` now calls `updateDPQuadrantCharts()` + `updateDemandTrends()`
- `TODO` file created with 7 backlog items

---

## Session 16 — Forecast Trend Sub-page + Two-Column Layout + Global Filter Reset
**Files**: `BPA_FORCASTING_MOCK.HTML`
**Prompts**:
- Add new sub-page under Forecast Accuracy for SR Actuals / Forecast / Adjusted Forecast chart
- Reference: MDR chart (Image #1) + whiteboard sketch (Image #2)
- Add a second column to make it more professional
- Global filter reset on every page switch

**What was built**:

### Forecast Trend page (`fa-page-forecast-trend`)
- Added as 4th tab under Forecast Accuracy in `modules` config
- Two-column `visual-row` layout:
  - **Left** (flex 1.8): SR weekly Chart.js line chart, FY26 W01–W52
    - Actuals: solid blue line with subtle fill under (W01–W22)
    - Forecast: long-dashed green `[8,4]` (W22–W52)
    - Adjusted Forecast: short-dotted amber `[3,3]` (W22–W52)
    - Vertical divider at W22: Chart.js inline plugin (`vertDivider`) with pill label
    - SVG inline legend in card header (exact dash patterns shown)
  - **Right** (flex 1): Forecast Error bars + stat tiles
    - Bar chart: `(planForecast - actuals) / actuals × 100` per week (W01–W22)
    - Green = over-forecast, red = under-forecast
    - Zero reference line via `grid.color` callback
    - 4 `.ft-stat-tile` tiles: **MAPE**, **Bias** (color-coded), **Best Week**, **Worst Week**
- KPI strip: Current Week, Last Actual SR, YTD Forecast Error (MAPE), Forecast Bias
- `_ftBaseData` stores: actuals, forecast, adjForecast, planForecast, weeks, TODAY_IDX
- `_ftUpdateKPIs()` helper updates all KPI chips + stat tiles
- `updateForecastTrendChart()` — in-place filter update (LOB + FY scaling)
- `initForecastTrendChart()` initializes both charts and calls `_ftUpdateKPIs()`

### Global filter reset
- `resetPageFilters()` replaces `resetDPFilters()` (alias kept for compatibility)
  - Resets: FY → FY26 only, Quarter → Q1, LOB → All
  - Also closes any open filter dropdowns via `classList.remove('open')`
- **Called at the start of every `switchPage()` call** — all page switches reset filters
- `applyAllFilteredCharts()` now also calls `updateForecastTrendChart()`

---

## Session 17 — Actuals Profiling: 4-Quadrant Demand Classification Rebuild
**Date**: 2026-06-23 | **Commit**: `4d771dc`
**Files**: `BPA_FORCASTING_MOCK.HTML`
**Prompts**:
- Replace all existing Actuals Profiling charts with 4-quadrant demand classification layout matching reference image
- Image reference: `New Mockup Designs/visuals/ACTUAL_PROFILING.png`

**What was built**:
- Replaced the old 4-tab channel system (Overall/ASU/Dispatch/SR with 12+ charts) entirely
- New 2×2 quadrant matrix with axis labels:
  - Y-axis: "Frequency % (Occurrence variation)" with 50% threshold marker
  - X-axis: "Coefficient of Variation (Demand)" with 50% threshold marker
- 4 Chart.js line charts, each with deterministic mock data matching the demand pattern:
  - **Consistent** (green `#16a34a`): smooth seasonal curve 38M–64M
  - **Erratic** (amber `#d97706`): chaotic high-variance 0.6M–4.8M
  - **Intermittent** (blue `#2563eb`): ~40% zero periods, moderate spikes
  - **Lumpy** (pink `#db2777`): ~65% zeros, large irregular spikes
- 4 KPI cards: Consistent / Erratic / Intermittent / Lumpy SKU counts
- Legend table at bottom matching the reference image (Occurrence × CoV classification rules)
- Removed: all old `switchChannel()`, `dp-channel-*` divs, `AP_*_TREND_BASE` constants, `updateDP*` and `updateAP*` functions
- CSS: new `.dp-matrix-wrap`, `.dp-quadrant-grid`, `.dp-quad-*`, `.dp-legend-*` classes
- JS: `initDemandProfilingQuadrants()` replaces the old multi-tab init

---

## Session 18 — Demand Trends: WoW/MoM → YoY+QoQ + Filter-Aware Clipping
**Date**: 2026-06-23 | **Commits**: `4d771dc`, `7242c5e`
**Files**: `BPA_FORCASTING_MOCK.HTML`
**Prompts**:
- Remove WoW and MoM charts from Demand Trends; keep only QoQ and add YoY
- Demand Trends charts must clip to selected FY and Quarter filters (not just scale)

**What was changed**:
- **HTML**: 3-column `.dp-trends-grid` → 2-column; removed WoW+MoM cards; added YoY card
- **CSS**: Grid `1fr 1fr 1fr` → `1fr 1fr`; canvas height 220px → 260px; new `.dp-trend-badge-yoy` (amber)
- **Data**: `DP_TREND_PG` keys stripped of `wow`/`mom`; `yoy` arrays added (FY22–FY26 annual totals per PG)
- **Metadata constants** added alongside `DP_TREND_PG`:
  - `YOY_FULL_LABELS` / `YOY_FY_TAG` — maps each YoY bar to its FY filter value (null = historical)
  - `QOQ_FULL_LABELS` / `QOQ_FY_TAG` / `QOQ_Q_TAG` — maps each QoQ bar to FY and Quarter

**Filter logic** (`updateDemandTrends()` rewrite):
- **YoY**: clips to `selFYs` — historical bars (FY22/23/24) visible only when all 3 FYs selected; Quarter filter ignored
- **QoQ**: clips to `selFYs × selQs` — FY24 historical shown only when all FYs selected; each bar must match both FY and Quarter selection
- Empty selection → chart cleared (empty labels/data)
- % change recalculated within the visible slice (not against hidden data)

---

## Session 19 — Forecast Trend KPI Cards: Accuracy % for ASU / SR / Dispatch
**Date**: 2026-06-23 | **Commit**: `(current)`
**Files**: `BPA_FORCASTING_MOCK.HTML`, `IMP_DOCS/`
**Prompts**:
- Change the 4 KPI cards in Forecast Trend to: Current Week, ASU Forecast Accuracy%, SR Forecast Accuracy%, Dispatch Forecast Accuracy%
- Update IMP_DOCS and create prompt trail with git commit history

**What was changed**:
- **HTML KPI strip** (`fa-page-forecast-trend`): replaced Last Actual SR / YTD Forecast Error / Forecast Bias with ASU%, SR%, Dispatch% accuracy cards
  - IDs: `ft-current-week`, `ft-asu-acc`, `ft-sr-acc`, `ft-dsp-acc` (+ matching `-sub` IDs)
- **`_ftUpdateKPIs()`** rewritten:
  - Right-panel stat tiles (ft-mape, ft-bias, ft-best-week, ft-worst-week) still updated
  - SR accuracy = `100 - MAPE` (derived from the weekly SR error data already computed)
  - ASU accuracy = `95.4% + (fyMult - 1.0) × 1.8` (calibrated mock base, FY-scaled)
  - Dispatch accuracy = `97.1% + (fyMult - 1.0) × 1.2` (calibrated mock base, FY-scaled)
  - Color coding: ≥95% → green, ≥90% → amber, <90% → red
  - Period sub-label shows "Overall · W01–W22" (current week from weeks array)

---

## Session 20 — Rename "Demand by LOB" + IMP_DOCS sync
**Date**: 2026-06-23 | **Commit**: `(current)`
**Files**: `Week.html`, `IMP_DOCS/HANDOFF.md`, `IMP_DOCS/PROMPT_TRAIL.md`
**Prompts**:
- Rename "Demand by LOB — Fiscal Week" chart — doesn't fit Forecast Accuracy context
- Chosen name: **"Weekly LOB Breakdown"**
- Update all IMP_DOCS to reflect current state

**What was changed**:
- `Week.html`: chart title + HTML comment renamed to "Weekly LOB Breakdown"
- `HANDOFF.md`: Forecast Trend right-panel description updated to current state (Weekly LOB Breakdown, AOP line details, `updateLOBWeeklyChart` behaviour)
- `PROMPT_TRAIL.md`: this entry added

---

## Session 21 — SR/ASU/Dispatch switcher on main trend chart; remove MAPE/Bias tiles
**Date**: 2026-06-23 | **Commit**: `0c64a28`
**Files**: `BPA_FORCASTING_MOCK.HTML`
**Prompts**:
- Add the SR/ASU/Dispatch graph switcher (from Week.html) to BPA's main Forecast Trend chart
- Remove MAPE, Bias, Best Week, Worst Week stat tiles from Weekly LOB Breakdown right panel
- LOB chart filter: Week filter (blank when all unchecked) already implemented — no change

**What was changed**:
- **CSS**: added `.ft-metric-toggle` / `.ft-metric-btn` styles
- **HTML left chart header**: added `[SR] [ASU] [Dispatch]` toggle buttons; added `id="ft-chart-left-title"` and `id="ft-chart-left-sub"` to title/subtitle elements
- **HTML right panel**: removed entire `ft-stats-grid` (MAPE, Bias, Best Week, Worst Week tiles)
- **JS globals**: added `_ftMetricData = {}`, `_ftMetric = 'sr'`
- **JS constants**: replaced `AOP_FY_TARGETS` with `AOP_METRIC_TARGETS` (SR/ASU/Dispatch × FY25/26/27); added `FT_METRIC_CONF` (title, sub, yFmt per metric); updated `getAOPTargetValue()` to use current `_ftMetric`
- **`initForecastTrendChart()`**: generates ASU data (base ~295K/week, growth) and Dispatch data (base ~6200/week, decline) alongside SR using seeded PRNG; populates `_ftMetricData`
- **`updateForecastTrendChart()`**: reads `_ftMetricData[_ftMetric]` for actuals/forecast/adj; updates y-axis format callback on each call
- **`switchChartMetric(metric, btnEl)`**: new function — sets `_ftMetric`, updates button states, updates title/sub elements, calls `updateForecastTrendChart()`
