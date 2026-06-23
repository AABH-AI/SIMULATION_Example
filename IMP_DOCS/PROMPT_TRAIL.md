# Prompt Trail — ISG BPA
> Chronological log of every major request and what was built/fixed. Update after each session.
> Last updated: 2026-06-22

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
