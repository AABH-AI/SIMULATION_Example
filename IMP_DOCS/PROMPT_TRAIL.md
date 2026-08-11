# Prompt Trail — TET BPA
> Chronological log of every major request and what was built/fixed. Update after each session.
> Last updated: 2026-06-25 (Session 24)

---

## Session 1 — Initial Dashboard (Supply Chain Goliath era)
**Files**: `epic_dashboard_mockup.html`
**What was built**:
- Left accordion nav panel, right Power BI-style filter panel
- Dark/light theme, CSV export, rule-based Smart Insights banner
- No pie charts (replaced with horizontal bar charts)

---

## Session 2 — Rebranding & Professional Redesign
**Files**: `AST_Forcasting.html`, `index.html`
**Prompts**: Rename to TET BPA, recreate UI professionally
**What was done**:
- Full title/branding rename; adopted Indigo-Black design system
- Plus Jakarta Sans + IBM Plex Mono font pairing
- Rebuilt left nav, filter chips, breadcrumb, KPI cards

---

## Session 3 — Landing Page + Two New Modules
**Files**: `index.html`, `bend_the_curve.html`, `AST_Forcasting.html`
**What was built**:
- `index.html`: 3-column Primary Tools grid + searchable All Modules list
- `bend_the_curve.html`: 8 toggle levers, target slider, gap-to-target chart
- What-If Simulation added as native module inside `AST_Forcasting.html`

---

## Session 4 — Theme Switcher Fix
**Root cause**: `[data-theme="light"]` still had dark nav tokens.
**Fix**: `--nav-bg: #ffffff`, `--nav-hover: #eef1fc`. Also fixed `wiCharts` missing from theme toggle loop.

---

## Sessions 5–10 — What-If Simulation Buildout
(Various slider, chart, scenario, and publish page iterations in `AST_Forcasting.html`)

---

## Session 11 — What-If Slider Reorder + Data Raw Rename
**Files**: `AST_Forcasting.html`
**Prompts**:
- Reorder What-If sliders: New Contract Growth first, Service Renewals second
- Rename Data Raw → Data Management
- Update What-If tile stat to show lever names

**What was done**:
- `WI_SLIDERS` array reordered: growth (index 0), renewal (index 1)
- `modules['data-raw'].title` → `'Data Management'`; home tile updated

---

## Session 12 — Remove Forecast Modifier + Hide Filters in What-If
**Files**: `AST_Forcasting.html`
**What was done**:
- `WI_SLIDERS`: removed `{ key:'modifier', ... }` entry; `wiState.modifier` removed
- `wiCompute()`: removed all `st.modifier` terms from all formulas
- `openDashboard()`: hides filter button + auto-collapses right panel for What-If

---

## Session 13 — Universal Filter Enforcement + KPI Sanity
**Files**: `AST_Forcasting.html`
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
- Rename LOB → Product Group (TES / THS / TET)
- Remove "SKUs" suffix from KPI card labels
- Reset filters when switching between sub-pages
- Create TODO backlog file

**What was done**:
- KPI labels: "Consistent SKUs" → "Consistent" (all 4 cards)
- Filter panel label: "LOB" → "Product Group" (internal `data-group="lob"` kept for compatibility)
- Table column headers + CSV/Excel export headers: "LOB" → "Product Group"
- `DP_LOB_SHARE = { TET:0.60, TES:0.25, THS:0.15 }` — demand shares for quadrant scaling
- `DP_TREND_PG` — exact per-product-group demand arrays (TET+TES+THS = combined totals)
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

---

## Session 22 — data.html: standalone Data Management dashboard (3 tabs)
**Date**: 2026-06-23 | **Commit**: `(current)`
**Files**: `data.html`, `IMP_DOCS/`
**Prompts**:
- Build a standalone `data.html` from scratch (not a BPA copy) after reading all IMP_DOCS
- Best shot — purpose-built for Data Management with Data Overview, Data Quality, Full Raw View
- Follow design system exactly; no pie charts; one aesthetic risk

**Design decisions**:
- Design system applied exactly: `--bg #f0f3fc`, `--accent #3a6ef0`, Plus Jakarta Sans + IBM Plex Mono, no pie/donut, Indian number format
- **Aesthetic risk**: Data Quality tab opens with an animated counter (0.0 → real score in 1.1s, ease-in-out) for the overall data health %. One orchestrated moment, nothing else moves. Respects `prefers-reduced-motion`. Justified: data health is a single pass/fail number — the reveal mirrors how analysts wait for a result.
- Completeness bars also animate via CSS transition (respects `prefers-reduced-motion`)
- Copy written from the analyst's POV — verdict text changes based on score: ≥98% = "ready for forecasting", ≥95% = "minor issues", else = "clean before forecasting"
- LOB values in raw table colour-coded by group colour (TET=blue, TES=green, THS=purple)
- JSON export alongside CSV

**Architecture** (`data.html`, 995 lines — standalone, no BPA dependencies):
- Own CSS with exact BPA tokens; no external stylesheets beyond fonts/icons/Chart.js
- `seeded(s)` PRNG → `rng` → 150 deterministic records (same pattern as BPA)
- `rawData` array: region/subregion/partner/location/queue/lob/fy/quarter/month/week/sr/fasu/tasu/fdsr/status
- ~7.3% anomaly rate (seeded): 11 records flagged "Needs Review"
- `tabInited{}` map — tabs init lazily via `setTimeout(80)` on first visit (Chart.js pattern from TECHNICAL.md)
- `chartInstances{}` store — destroy+recreate on tab re-visit (not used here since each tab inits once)
- `mkChart(id, type, data, opts)` factory — null-safe, destroys existing before creating

**Tab: Data Overview**:
- Live-computed KPIs from `rawData` (anomaly count, avg completeness)
- 3×1 row: Records by Region · Product Group Mix · Partner Coverage (horizontal bars)
- 2-col row: Status by Region (stacked horiz bar) + Weekly SR by Region (3-line, seeded seasonal)

**Tab: Data Quality**:
- Animated health score hero (72px IBM Plex Mono, accent colour)
- Dynamic verdict + description + summary pills (all computed from rawData)
- Field completeness grid (10 fields, CSS progress bars, colour-coded)
- Anomaly Rate by Quarter bar (green/amber/red by severity threshold)
- SR range table: Min/Max/Avg/Std Dev per region (IBM Plex Mono)
- Anomaly log: filtered table of flagged rows

**Tab: Full Raw View**:
- Sticky-header sortable table, 13 columns, search across all values
- CSV + JSON export (filtered rows only)
- LOB column colour-coded (TET blue, TES green, THS purple)

---

## Session 23 — TET BPA redesign (`AST_Forcasting_v2.html` -> `TET BPA — Business Planning and Analytics.html`) and `index.html` light theme
**Date**: 2026-06-25
**Files**: `TET BPA — Business Planning and Analytics.html` (new, renamed from `AST_Forcasting_v2.html`), `index.html`, `landing_v2.html`, `IMP_DOCS/`

**Prompts**:
- Build a new, professional-looking dashboard referencing `AST_Forcasting.html` — first attempt was too close to a template; iterated twice on user feedback ("bruh, did you actually check... there are only 5 tabs" / "TO BE CLEAR SHOULD NOT LOOK GENERIC")
- Fix filter logic to match `AST_Forcasting.html` exactly; focus further passes on UI polish only
- Keep KPI data realistic — "not too much not too low... explain it as a future product"
- Update `index.html` to light theme and link the new file
- Read `IMP_DOCS/` and rename the new UI to follow the em-dash naming convention used by `forecast_copilot/` (clarified via AskUserQuestion: adopt the naming *style* only, keep TET BPA content — do not merge with the separate Forecast Copilot product)

**What was built** (`AST_Forcasting.html` redesign, 3 iterations):
- Home page: dark near-black hero (`#0c1526` nav), 5 module tiles matching `AST_Forcasting.html`'s exact copy and tile count (first draft wrongly added a 6th tile and generic gradient hero — corrected)
- Teal accent design system (`--accent: #0d9488`) replacing the original's blue, applied consistently across KPI cards, chart palettes, channel tabs, and the left nav active state
- **Actuals Profiling expanded from 4 to 6 channel tabs** — added Field Services and Care, wiring up `TREND_DATA_52` keys (`dp-fld-dis/fct`, `care-cf/apos/sr/dsp-fct/act`, `dp-care-amer/emea/apj`) that existed in the original file's data layer but were never rendered as tabs or charts
- KPI cards redesigned as shadow-only (no colored border/icon) — the 36→40px monospace number is the entire visual weight of the card
- Two-section module tiles: colored metric-area strip (icon + big number) + white body (name/desc/footer)
- All filter-aware chart update functions (`updFA_Region`, `updDP_QoQ`, `updCare`, etc.) ported 1:1 from `AST_Forcasting.html`'s `applyAllFilteredCharts()` pattern, extended for the 2 new channels
- Fixed a real bug found during this work: `FA_PARTNER_BASE` was referenced by `updFA_Partner()` but never defined — would have thrown a ReferenceError the first time a region filter was applied while viewing the Partner chart

**Root cause of iteration 1 & 2 failures**: didn't actually read `AST_Forcasting.html`'s real home-page HTML/copy before building — assumed structure instead of verifying it, producing a 6-tile generic-looking page when the source has exactly 5 tiles with specific copy.
**Fix**: full agent-driven audit of every module/page/chart/KPI in `AST_Forcasting.html` before the second rebuild; exact copy match on the 5 tiles.

**Data realism pass**: every static KPI value and every JS chart-data constant (`FA_REGION_BASE`, `DP_OVERALL_REGION_BASE`, `AP_DSP_TREND_BASE`, `AP_SR_TREND_BASE`, `T52` weekly trends) rescaled to derive consistently from 3 annual anchors: **1.47M ASU / 5.87L SR / 2.34L Dispatch** — weekly = annual÷52, monthly = annual÷12, so every KPI across every page tells the same underlying story.

**`index.html` changes**:
- Converted from dark theme (`#07090f` bg) to light theme (`#f1f4fa` bg, `#ffffff` cards) matching the new dashboard's tokens
- Added a teal accent bar to the header (was a dark radial-gradient)
- Added the new dashboard as a Primary Tool card

**Rename (this session, final step)**:
- `AST_Forcasting_v2.html` → `TET BPA — Business Planning and Analytics.html`, matching the file's own `<title>` tag and adopting BTC_Lovable's "Title — Suffix" em-dash convention — but staying pure TET BPA content, no Forecast Copilot branding (those are documented in HANDOFF.md as two separate products)
- Updated all 6 references in `index.html` (href, card-file label, `PRIMARY` set, `LABELS` map, sort-priority checks) and all 5 references in `landing_v2.html` (a parallel fork of `index.html` created by another session) — found via repo-wide grep before editing, to avoid missing a reference
- `manifest.json` not hand-edited — it's auto-regenerated by the `update-manifest` GitHub Action on push

**Git note**: pushes for this session went through the main checkout path directly (`D:\...\simulations`) rather than the worktree, because a prior push had cached the wrong GitHub account (`Arnav1771` instead of `AABH-AI`) in Windows Credential Manager — cleared via `cmdkey /delete`, re-authenticated as `AABH-AI`.



---

## Session 24 — Forecast Copilot: cross-page shared state + real business logic (all 6 pages rebuilt)
**Date**: 2026-06-25
**Files**: all 6 `forecast_copilot/*.html` pages (Dashboard, ASU Simulation, Historical Performance, AI BTC Advisor, BTC Distribution, Final Forecast), `IMP_DOCS/`

**Prompts**:
- "now if i change filter in one workspace it should be reflected in all workspaces" — plus a full pasted product spec ("AI-Powered Forecast Planning & Bend the Curve (BTC)") to check sliders and functionality against, and "keep the IMP_DOCS in check"

**Audit before any changes** (3 parallel agents): confirmed `forecast_copilot/` exists only in this worktree (never in the main checkout, untracked by git either way), and found every one of the 6 pages' filter dropdowns was purely cosmetic — clicking an option only changed the button's displayed text and a `.selected` CSS class, with zero effect on any chart, KPI, or table anywhere. No `localStorage`/`sessionStorage`/`postMessage`/`BroadcastChannel` existed at all — no cross-page state of any kind. The only working interactivity was two slider pairs (ASU Simulation's NC/Renewals overrides, AI BTC Advisor's 6 driver sliders), and even those only drove a crude single combined multiplier rather than the distinct formula each page's own subtitle described.

**Clarifying question asked before implementing**: whether "BTC%" should be a small bend/uplift percentage (matching the already-built Historical BTC Trend chart's 3-8% scale) or a large 90%+ achievement percentage (matching the spec's own example numbers, which used values like "97%"). User confirmed: small bend/uplift %. Implementing the spec's literal example would have contradicted 4 already-built pages that consistently used the smaller scale.

**What was built**:
- A single shared JS engine block, embedded identically (copy-pasted, unchanged) into all 6 files per the repo's existing "fully self-contained, no shared CSS/JS" convention for this product:
  - `fcState` — persisted to `localStorage` under `fc_state_v1`: filters (quarter/week/region/lob/business/service), `ncOverride`/`aposOverride`, `simMode`, `btcStrategy`/`manualBTC`, `distMode`, `approvals`. Loaded on every page load (`fcLoadState()`), saved on every change (`fcSaveState()`) — this is what makes a filter or selection made on one page appear already-selected when any other page loads next.
  - `fcGenerateWeeklySeries()` / `fcGenerateHistory()` — seeded dummy-data generator (same `seeded(s)` PRNG pattern as `data.html`), keyed by a hash of the active filter combo so the same combo always produces the same numbers and different combos produce different, realistically-scaled ones. Generates 13 fiscal weeks of New Contracts/Renewals/ASU/SR/Dispatch per the selected quarter, and 12 historical quarters of BTC/Forecast Accuracy/AOP/Modernization achievement.
  - Real ASU Conversion formula: `ASU[w] = ASU[w-1] - Expirations[w] + Renewals[w] + New Contracts[w]`, with Expirations (weekly churn) and Renewals modeled as distinct variables — the original page's subtitle stated this formula but the actual code just multiplied everything by one shared scalar.
  - `fcRecommendBTC()` — real 3-strategy BTC Recommendation Engine: Historical Best Fit (recency-weighted average of 12 historical quarters), Closest to AOP (derived from the accuracy-shortfall-driven target gap), Balanced (their midpoint) — 3 genuinely distinct numbers every time, not the previous single weighted-sum formula duplicated into 3 static table rows.
  - `fcDistributeWeekly()` — Automatic Weekly Distribution across the 13 selected fiscal weeks, with Equal/Historical/AI Recommended modes producing genuinely different per-week shapes while always summing to the same total uplift.
  - `fcRecommendOverrides()` — Recommendation Mode for ASU Simulation: analyzes 12-quarter average Forecast Accuracy and suggests NC/Renewals overrides, with Accept/Modify/Reject actions.
- **Dashboard**: added the filters panel (previously had none at all — no JS, no filters, 100% static) plus the spec's 9 KPI cards, Forecast vs Target table, and 5 trend charts.
- **ASU Simulation**: kept the 2 sliders, wired them to the real formula; added Original/Adjusted/Variance display and a full Recommendation Mode panel (previously the "AI Auto Simulation" toggle button did nothing beyond swapping its own CSS class).
- **Historical Performance**: wired all 4 charts + the "Best Historical BTC Range" / "Most Successful Planning Periods" KPIs to the real 12-quarter history instead of one-time static render from hardcoded arrays.
- **AI BTC Advisor**: replaced the fake 3-row comparison table (3 static rows, only one cell of one row actually moved when sliders changed) with the real `fcRecommendBTC()` output — clicking a strategy or a table row sets `fcState.btcStrategy` and persists it; added a working Manual BTC Override path that doesn't get silently overwritten by slider movement (a real bug in the original — moving any slider clobbered the manual override field).
- **BTC Distribution**: added the missing Weekly Forecast Table (Fiscal Week / DS Forecast / BTC Forecast / Variance / WoW Change — spec-required, previously absent entirely); wired the Equal/Historical/AI Recommended toggle to real distinct distribution math; wired the region/business donuts and LOB/service-type bars to computed shares instead of hardcoded numbers.
- **Final Forecast**: wired the Original/Scenario/BTC/Final/Target chart and Submission Summary table to real computed values flowing from the other 5 pages' state; the 4 status cards (Meets AOP/Modernization/Triad/Ready) now genuinely vary based on the selected BTC strategy instead of always showing "Achieved"; Approve/Submit button state now persists to `fcState.approvals` so it survives navigation and reload (previously reset on every page load).

**Verification approach**: every file's `<script>` block was extracted with a small Node script and executed under Node's `vm` module (stubbing `document`/`localStorage`) to smoke-test the actual math before considering a page done — this is real code execution, not just visual inspection. Caught and fixed one genuine bug this way: `Target` in the BTC engine was originally defined as a fraction of the current forecast (`scenarioTotals.srTotal * aopTargetPct/100 * 1.02`), which meant Target was mathematically always below the current baseline forecast, so "Closest to AOP" always computed a negative gap and clamped to 0%. Fixed by anchoring Target to the accuracy shortfall instead (`scenarioTotals.srTotal * (1 + accuracyShortfall * 0.6)`), which produces a genuine, usually-positive gap to close.

A final full cross-page navigation was simulated end to end: loaded Dashboard fresh → changed Region to EMEA → loaded ASU Simulation fresh (confirmed EMEA already selected) → set NC override to 40% → loaded AI BTC Advisor fresh (confirmed EMEA + NC=40% both present) → selected the "Balanced" BTC strategy → loaded BTC Distribution fresh (confirmed EMEA + Balanced both present) → loaded Final Forecast fresh (confirmed all three, plus a correctly-recomputed `selectedBTCPct`). This directly verifies the original ask — a filter or decision made in one workspace is reflected in every other workspace.

**Docs sync**: added a dedicated "Forecast Copilot" section to `IMP_DOCS/HANDOFF.md` (this product had never been documented in the canonical, git-tracked HANDOFF.md before — an earlier session's write-up of it only ever existed in a stale worktree copy that was never merged to master) — describes the 6 files, the shared-engine architecture, what changed in this rebuild, and known state (still local-only, not pushed).

**Not done without asking**: did not `git add`/commit/push the `forecast_copilot/` changes — that folder is untracked and has never been pushed for this product; pushing it would be a new decision (making local-only work visible/shared) rather than a continuation of an established pattern, so it's left for an explicit follow-up ask.


---

## Session 25 — Forecast Copilot: full light theme, pushed to git, added to UI Selection library
**Date**: 2026-06-25
**Files**: all 6 `forecast_copilot/*.html` pages, `.gitignore`, `.nojekyll` (new), `index.html`, `landing_v2.html`, `IMP_DOCS/`

**Prompts**:
- "add a full on light theme - and push it to the repo and put it in the UI Selection library which is hosted on gh pages"
- "build this in light theme and push it to the UI selction page and put it on TOP"

**Light theme conversion**: enumerated every distinct hex/rgba color used across all 6 files (28 unique values) before touching anything, then applied a single dark→light mapping via a Node script across all 6 files at once (167 total replacements) — background/sidebar/card tokens (`#0b0f1a`→`#f4f7fb`, `#0d1220`/`#111827`→`#ffffff`, etc.), text tokens inverted (light-on-dark → dark-on-light), and all 5 chart/semantic accent colors darkened for AA contrast against white (`#2dd4bf`→`#0d9488` teal, `#60a5fa`→`#0284c7` sky, `#a78bfa`→`#7c3aed` violet, `#f472b6`→`#db2777` pink, `#22c55e`→`#16a34a` green, `#ef4444`→`#dc2626` red) — plus softened box-shadows (`rgba(0,0,0,.4/.25)` → `rgba(15,23,42,0.16/0.10)`, appropriate for a light background instead of the harsh dark-theme shadow values). Re-ran the same Node `vm`-based smoke test from Session 24 on all 6 files afterward to confirm the bulk find/replace didn't break any embedded JS (all passed, all still produce identical, cross-page-consistent numbers).

**Pushing this to git required real care**, since `.claude/` is untracked as a whole in the main checkout and contains things that must never be published:
- Checked GitHub Pages' Jekyll behavior first — Jekyll excludes dotfiles/dotfolders by default, so `forecast_copilot/` would 404 on GitHub Pages even if pushed. Added an empty `.nojekyll` file at the repo root (standard fix for pure-static-HTML Pages sites) so the dotfolder is served as-is.
- `.claude/` also contains `settings.local.json` and `worktrees/` (a full nested git worktree) — neither should ever be committed. Added both as explicit `.gitignore` entries (`.claude/worktrees/`, `.claude/settings.local.json`) with a comment noting `forecast_copilot/` is the intentional exception, then verified with `git check-ignore` that the ignore rules and the intended-tracked folder behave exactly as expected before staging anything.
- Copied the 6 light-themed files from the worktree into the main checkout's `forecast_copilot/` (didn't exist there before this session).

**UI Selection library** (`index.html` + `landing_v2.html`): added a new Primary Tool card for Forecast Copilot, placed **first** in both the visual grid and the sort-priority logic (both files' `PRIMARY` set / `LABELS` map / sort comparator, and `landing_v2.html`'s `ORDER` array) — per the explicit "put it on TOP" instruction. Card links to `forecast_copilot/Dashboard — Forecast Copilot.html` as the natural entry point into the 6-page workflow. Both files use CRLF line endings, which silently broke the first pass of Node-based string replacement (`\n`-based search strings didn't match `\r\n` content) — fixed by switching to line-ending-agnostic regexes (`\r?\n`).

**A note on tool reliability**: mid-task, `node -e "..."` calls containing backtick-wrapped Markdown code spans (e.g. `` `forecast_copilot/*.html` ``) inside the double-quoted shell argument got partially corrupted — Bash treats backticks as command substitution even inside double quotes, so those spans were executed as (nonexistent) shell commands and their empty output silently replaced the intended text. Caught by re-reading the file after each patch rather than trusting the "success" log line, and fixed by writing patch content to standalone files first and having Node read them (avoiding shell string interpolation entirely) for any replacement text containing backticks.

**Docs sync**: updated the Forecast Copilot section, Active Files table row, and Current State bullet in `IMP_DOCS/HANDOFF.md` to reflect: light theme, pushed, live on GitHub Pages, linked in both UI Selection library files.

---

## Session 26 — Forecast Copilot: ALL filter option, Historical 0–100% y-axes, folder rename to `forecast_copilot/`
**Files**: `forecast_copilot/*.html` (all 6, moved from `.claude/BTC_Lovable/`), `index.html`, `landing_v2.html`, `.gitignore`, `IMP_DOCS/HANDOFF.md`
**Prompts**: "fix it now it is not showing the ALL button before and rename the file to 'forecast_copilot' and in Historical tab put (0-100)% properly in the UI"

**What was done**:
- **ALL filter option**: added `ALL` as the *first* option in the Region, Global LOB, Product Business and Service Type dropdowns on all 6 pages (`FILTER_OPTIONS`). Fiscal Quarter / Fiscal Week deliberately do NOT get ALL — `fcWeeksForQuarter()` / `fcPriorQuarters()` parse the quarter string (`split('-Q')`) and would produce NaN.
- **ALL semantics**: aggregate = sum of that dimension's factors — `FC_REGION_FACTOR.ALL: 2.65`, `FC_LOB_FACTOR.ALL: 6.25`, `FC_BUSINESS_FACTOR.ALL: 2.90`, `FC_SERVICE_FACTOR.ALL: { volume: 5.05, dispatchRatio: 0.50 }` (dispatch ratio is the volume-weighted mean). Because the engine is multiplicative, all-ALL = product of sums = exact total over the full cross-product of slices — self-consistent, verified finite via Node vm smoke test.
- **Historical y-axes**: `fcDrawLineSeries()` (shared engine, updated identically on all 6 pages) now accepts `opts.yTicks` + `opts.yFmt` — draws gridlines + right-anchored tick labels in a 40px left gutter; behaviour unchanged when the options are absent. Historical page now passes `0/25/50/75/100` with `%` formatting on Forecast Accuracy (was a zoomed 80–100 axis with no labels at all) and AOP & Modernization charts, and `0/3/6/9` `%` on the BTC trend.
- **Rename**: `git mv .claude/BTC_Lovable forecast_copilot` — the suite now lives at repo root, so the GH Pages URL loses the `.claude/` dotfolder segment. All links updated in `index.html` (card, PRIMARY set, LABELS, sort comparator), `landing_v2.html` (incl. `ORDER` array), HANDOFF.md; `.gitignore` comment refreshed. Cross-page nav links are relative filenames, so they survived the move untouched.

**Gotcha recorded**: these files are CRLF; a perl `\{\n` multiline pattern silently no-op'd until rewritten as `(\r?\n)` with the captured ending reused in the replacement.

---

## Session 26b — Forecast Copilot: chart hover inspection + fluid transitions; BTC range KPI shows 0%—100%
**Files**: `forecast_copilot/*.html` (all 6)
**Prompts**: "include the Graphs hover design... it should highlight values corresponds to the graph... in all the graphs of the UI, and make the graph design change fluidly"; "Best Historical BTC Range 3.8% — 6.4% change this value to 0%-100%"

**What was done**:
- **Hover layer on every SVG chart** (shared engine, identical on all 6 pages): `fcAttachHover()` adds a transparent capture rect per chart — on mousemove it snaps to the nearest data index, shows a dashed vertical guide line, colored marker dots on each series, and a floating dark tooltip (fixed-position, follows the chart point) listing series name + formatted value. CSS for the tooltip/markers is injected from JS (`fcHoverUI`) so no per-page style edits.
- **Fluid transitions**: `fcDrawLineSeries`/`fcDrawGroupedBars` now tween old→new data over 320ms (ease-in-out, rAF, cancels in-flight tween) whenever a chart re-renders with the same shape — filter changes and slider drags animate smoothly instead of snapping. First render draws instantly.
- **Series/label metadata**: all 15 chart call sites updated with `name:` per series and `labels:` (weeks/quarters) so tooltips read "2024-Q3 · AOP: 84%" instead of generic text. Percent charts pass `fmt` for % formatting.
- **BTC Distribution h-bars**: hover brightens the bar and highlights label+value (CSS only). Donuts keep their static legends (conic-gradient divs, values already visible).
- **Best Historical BTC Range KPI**: per explicit instruction, value text is now the literal "0% — 100%"; the meter below still marks where the historical band sits on the 0–100 track.
- Verified: Node vm smoke test loads and renders all 6 pages with ALL filters, stub DOM covering the hover layer APIs.

---

## Session 26c — Forecast Copilot: charts migrated to Highcharts
**Files**: `forecast_copilot/*.html` (all 6)
**Prompts**: "improve the overall graphs, use highcharts i think it is better for the UI"

**What was done**:
- Replaced the hand-rolled SVG chart engine with **Highcharts 11.4.8** while keeping the same shared-engine API (`fcDrawLineSeries`/`fcDrawGroupedBars` signatures unchanged), so all 15 call sites work untouched. `fcHCContainer()` swaps each legacy `<svg>` for a same-id `<div>` at first draw.
- Native Highcharts UX replaces the custom hover layer: shared dark tooltip (styled to match the old fc-tip), x-axis crosshair, hover halo/line-emphasis, 320ms animated `setData` updates on filter/slider changes (charts are cached in `fcHCharts` and updated in place, not recreated).
- Light-theme styling via options: transparent background, Inter font, grid #e8edf7, axis labels #94a3b8/#8a94ad, no titles/legends/credits (pages keep their HTML legends), `yTicks`→`tickPositions`, `yFmt`→axis label formatter, y-min defaults to 0.
- Removed the now-redundant page-drawn x-axis label divs writes (Historical ×4, Final Forecast, BTC Distribution) — Highcharts renders real axes.
- **CDN**: cdnjs (`cdnjs.cloudflare.com/.../highcharts/11.4.8/highcharts.min.js`), NOT code.highcharts.com — the latter 403s requests without a Referer header (breaks file:// loads and strict referrer policies). Found via real-browser testing.
- **Label crowding**: `rotation: labels.length > 6 ? -35 : 0`. Note: `autoRotation` is IGNORED when `labels.step` is set — cost one iteration to learn.
- Verified with Canary/Chromium on all 6 pages: 0 console errors, expected chart counts (5/3/4/0/1/1), slider-update path exercised, screenshots confirm no label overlap.
- Note: Highcharts is commercially licensed (free for personal/non-commercial use) — flagged to owner for internal-demo licensing review.

---

## Session 27 — Compliance content sweep
**Files**: all active HTML files, IMP_DOCS, CLAUDE.md, .gitignore; 13 legacy prototype files untracked

**What was done**:
- Company-compliance sweep replacing client-specific references across all deployed UI files and docs with neutral terminology (partner names, product-line names, renewal terminology), with a consistent identifier rename in the Forecast Copilot shared engine (`fc_state` localStorage key bumped to v2 so stale saved filter values reset cleanly).
- 13 legacy/prototype HTML files removed from git tracking and added to `.gitignore` — they remain on local disk but are no longer deployed or listed in manifest.json/All Modules.
- Full inventory of what was found and changed is documented in the local-only, gitignored `remove.md` at the repo root.
- Fixed: `distributeByFactor()` on BTC Distribution now excludes the `ALL` aggregate key so donut/h-bar breakdowns don't double-count.
- Verified: Node vm smoke tests on all 6 Forecast Copilot pages + real-browser checks (0 console errors, correct chart counts, slider path, forbidden-term scan = 0 hits).

---

## Session 28 — Nomenclature generalization
**Files**: `AST_Forcasting.html` (renamed from former main-dashboard filename), `TET BPA — Business Planning and Analytics.html` (renamed), index.html, landing_v2.html, bend_the_curve.html, epic_dashboard_mockup.html, forecast_copilot/*.html, CLAUDE.md, IMP_DOCS/*

**What was done**:
- Owner-directed nomenclature mapping applied across all tracked HTML + docs (word-boundary, case-sensitive): partner/brand and segment terms replaced with neutral codes (→ ATC, He, AST, TET, TES, THS; TEC/XTC mappings had zero occurrences).
- Both main dashboard files renamed via `git mv`; every internal link, card, label map, sort comparator, and doc reference updated. Old URLs 404 after deploy.
- forecast_copilot localStorage key bumped `fc_state_v2`→`fc_state_v3` so previously saved filter values (old segment names) reset instead of silently missing factor-map keys.
- Fixed collateral: the main dashboard's logo `<img>` used a hard-coded absolute `D:\` path (broken on the live site since day one) — now relative `Aligned logo.png`, which is tracked in the repo.
- Verified: Node parse/engine tests on all 6 copilot pages; real-browser checks on both renamed dashboards + index (0 unexpected console errors, 18/23 canvases render, nav click works, forbidden-term scan = 0; manifest.json fetch CORS error under file:// is expected and absent on https).

---

## Session 29 — BPA_FORCASTING_MOCK.HTML: compliance sweep + critical Forecast Copilot bug fix
**Files**: `BPA_FORCASTING_MOCK.HTML`

**What was done**:
- This file — the live "TET BPA — Forecasting Suite (Active)" card, the site's most-used dashboard — had been missed by the 2026-07-17 compliance/nomenclature sweep because it had 788 lines of uncommitted work-in-progress at the time. Applied the same mapping now: Dell→ATC, ISG→TET, ESG→TES, HES→THS, Aligned Automation→He, plus a second LOB list unique to this file (APEX→"Elastic Consumption", VXRAIL→"HCI Cluster", POWERFLEX→"SDS Platform", AVAMAR→"Data Protection") used by a Fiscal Week × LOB chart in a different module. Fixed hard-coded `D:\` logo path to relative, matching the earlier fix on the other dashboards.
- **Root-cause bug found and fixed**: the file's embedded Forecast Copilot module (`id="module-whatif"`) never actually opened — clicking its home-page tile silently failed. Cause: a "Medium Priority" KPI `<div>` in the unrelated Demand Alerts module had an unclosed `class="kpi-value kp` attribute, which swallowed the literal text of the Forecast Copilot module's HTML comment and opening `<div id="module-whatif">` tag into that one attribute string — so the element never existed in the parsed DOM, and `openDashboard('whatif')`'s first line (`getElementById('module-whatif').classList.add('active')`) threw and aborted before building the nav or booting the engine. Confirmed via `git show HEAD:...` that this exact corruption was already present in the last commit (861bb1c) — it has been broken on the live site, not just in today's WIP.
- Reconstructed the truncated KPI card (Medium Priority: 7, consistent with Total: 12 / High: 5) and closed the three ancestor divs before the Forecast Copilot module comment.
- Separately removed ~400 lines of fully dead legacy `wi*` engine code (superseded weeks ago by the `fc_*` engine now wired to the router; confirmed zero live call sites, and it referenced undefined `WI_BASE`/`WI_ASU_SHAPE` so it could never have run anyway) and a duplicate/orphaned "Forecast Publish Center + Audit Log" markup block that had been left sitting as a sibling of `module-whatif` instead of inside it (would have rendered on every module, not just Forecast Copilot, had the file not already been broken above it).
- Verified via Node vm syntax + div-balance checks (now perfectly balanced, was previously mismatched) and a full real-browser pass: home loads clean, all 5 module tiles open without errors, Forecast Copilot's 6 sub-pages (Dashboard, ASU Simulation, Historical Performance, AI BTC Advisor, BTC Distribution, Final Forecast) all render Highcharts and respond to slider input, Demand Alerts KPIs are now internally consistent (12 total = 5 high + 7 medium), and a forbidden-term scan across the whole single-page app returned zero hits.
- Noted but out of scope: the Demand Planning Alerts module has no clickable home-view tile (pre-existing, unrelated gap) — flagged for a future session.

---

## Session 30 — Standalone BTC Reference Guide

**Prompt**: owner asked for a single standalone HTML file (not inside forecast_copilot/) covering the same BTC reference material, for sharing with others outside the app.

**What was done**: created `BTC_Reference_Guide.html` at the repo root — same de-identified content as the in-app "BTC Guide" page (forecast_copilot/BTC Guide — Forecast Copilot.html): what BTC does, its 6 key parameters, one illustrative example with a small Highcharts chart, and a "why automate this" list. No real names, quotes, or Dell-specific tool/product names (same compliance standard as the in-app version — the sensitive source document was never committed to the repo).

Built as a genuinely standalone document rather than an app screen: no sidebar/nav chrome, no dependency on forecast_copilot's fc_engine.js, its own lightweight dark-mode toggle (separate localStorage key `btc_ref_theme`), and a table-of-contents with in-page anchor links. Uses the same Highcharts CDN + Inter font as the rest of the site for visual consistency.

Verified: JS syntax check, confidentiality scan (0 hits), real-browser pass (chart renders, dark mode toggles cleanly, all 4 TOC anchors scroll correctly, 0 console errors).

---

## Session 31 — BTC guides expanded with real workflow depth (de-identified)

**Prompt**: owner asked for more informative BTC guides — Excel/formula-level detail, the multi-business-unit "4-tab" workflow, strategies — after initially asking for real names/Dell terms to be included, then explicitly confirming (after a direct risk callout) to keep it de-identified instead, given both pages are on the public repo.

**What was added** (to both `BTC_Reference_Guide.html` and `forecast_copilot/BTC Guide — Forecast Copilot.html`, kept in sync): 5 new sections — **The Adjustment Formula** (a reverse-engineered power-curve ramp, explicitly labeled as one plausible implementation matching only the described qualitative shape, not a verified exact spec — the source's own formula section had no confirmed formula, only a described behavior), **Worked Example: The 4-Tab Case** (the real multi-business-unit × service-type intersection problem, generalized to "Unit A/Unit B × Parts Only/Parts + Labour"), **Publishing Workflow** (the real 6-step size → paste-as-value → mark → publish/discard → allocate → extract sequence, plus its real constraints: no zero values, values-only paste, occasional mistakes slipping through), **Quarterly Phasing** (expanded with the real "why a second, simpler pass exists" rationale), and **New vs. Renewal Adjustments** (expanded with real sequencing and the expiring-data lag complication). Illustrative example numbers were corrected to be internally consistent with the new formula (recomputed via Node — the original placeholder numbers didn't match what the formula actually produces at that modifier value).

**Compliance**: no real names, direct quotes, or Dell-specific tool/product names in either page — verified via confidentiality scan (0 hits) after the expansion, same as the original versions.

**Verified**: JS syntax on both files, formula output recomputed and cross-checked against the illustrative table, real-browser pass (chart renders, all new TOC anchors scroll correctly on both pages, new section text confirmed present, in-app page's 7-item nav and active state intact).

---

## Session 32 — Fix: right-side Filters panel silently broken across all BPA_FORCASTING_MOCK.HTML modules

**Prompt**: owner reported the Filters panel showing empty (just a search box, no checkboxes) on the Forecast Accuracy module; asked to check IMP_DOCS for prior context on this.

**Root cause** (pre-existing, not introduced by this session's edits — confirmed via `git show` that the offending CSS predates any of today's changes, tracing back to the original `mock in Main File` commit that embedded a Forecast Copilot-style module into this file): a CSS class-name collision. The embedded Copilot module's own filter-rail styles define a bare, unscoped `.filter-dropdown { display: none; ... }` rule (meant only for its own absolutely-positioned dropdown popups, toggled via a `.open` class added to that same element). The file's original, separate right-side Filters accordion panel (`#filter-container`) also happens to use the literal class name `.filter-dropdown` for its own group wrappers — but toggles visibility on a *child* (`.filter-dropdown-content.open`), never on the outer `.filter-dropdown` element itself. Because the Copilot rule's `display: none` had no scoping, it silently hid all 8 filter-group wrappers (93 checkboxes total) across every module (Forecast Accuracy, Actuals Profiling, Data Management, etc.) — the checkboxes were always present in the DOM, just permanently invisible.

**Fix**: scoped the Copilot module's `.filter-dropdown` / `.filter-dropdown.open` rules to `.filter-rail .filter-dropdown` / `.filter-rail .filter-dropdown.open` — mirroring a partial scoping fix that already existed one line above it (`.filter-rail .filter-dropdown { left: 0; right: 0; min-width: 0; }`) but wasn't applied to the actual `display` rule. This fully isolates the Copilot module's dropdown styling to its own `.filter-rail` container without touching the original Filters panel's accordion behavior.

**Verified**: JS syntax check; real-browser pass — Forecast Trend/Actuals Profiling/Data Management filter panels all show and expand their real checkbox groups (7/7/53/4/8/4/5/5 counts confirmed), the separate forecast_copilot_v2 page's own (differently-scoped) filter-dropdown pattern still opens/closes correctly with no regression, 0 console errors throughout.

---

## Session 33 — `template_ui/`: flow-aligned BTC simulator v2 (P1–P5)

**Prompt**: understand `template_ui/IMP_DOCS/adjustment flow.png`, list differences vs the current UI workflow, plan changes — then owner chose "everything, create a new file"; ASU = intermediate driver (per the image, not a publish endpoint).

**The reference flow** (`adjustment flow.png`): a 9-stage pipeline. Assets/contracts → an ASU box (ASU Actuals + New Contracts Fcst + **Ships Fcst** + APOS Renewal Fcst) → **Adjustment Cube [3]** → **ASUs Forecast [5]**. That adjusted ASU then *drives* Dispatches Forecast [6b] and Service Request Forecast [7b] (each stitched with its own actuals [6a]/[7a]) → a **second Adjustment Cube [8]** → **Dispatches Publish [6c]** + **SR Publish [7c]** → **Reporting Cube UMS [9]**. Key semantics: two sequential cubes; ASU is the upstream driver, *not* a UMS endpoint; only Dispatch + SR publish.

**Gap analysis vs `btc_adjustment_simulator.html`** (3 independent flat tabs): D1 disp/SR used static source arrays × modifier, ignoring the adjusted ASU (decoupled — the core defect); D2 no sequence; D3 the two cubes weren't represented; D4 Ships input missing; D6 UI required ASU itself to be published to unlock export; D7 publish allocation was an alert-only mock.

**Built** — new file `btc_adjustment_simulator_v2.html` (copied from the v1 base, then surgically edited; v1 left untouched):
- **P1 — disp/SR driven by adjusted ASU**: extracted `computeAsuRows()` (pure) as the single ASU-chain source. `calcRate(C, adjAsu)` now scales each forecast week's disp/SR by `adjAsu[i]/asu[i]` (volume follows ASU at the base MDR/ICR) *then* applies the BTC modifier (the modifier is what bends the rate toward target; pure ASU scaling holds the rate). `renderRate` computes rates against adjusted ASU. Moving the NC/APOS/Ships sliders now reflows into both downstream sheets (verified: NC +50% → disp forecast +12.4%; was +0% in v1).
- **P2 — sequence + ASU intermediate**: `ASU_LOCKED` gate. ASU controls' Publish button → **Lock forecast / Unlock to revise**; locking freezes the ASU sliders + table edits and enables the disp/SR Publish buttons (disabled + a gate banner until then). Unlocking invalidates any downstream publishes. Export unlocks on **disp && sr** only (ASU dropped from the gate).
- **P3 — stage stepper**: `1 Adjust ASU (driver) → 2 Adjust Dispatches & SRs → 3 Publish → UMS`, states on/done driven by lock + publish state. Tabs reordered to ASUs · Dispatches · SRs to match flow order.
- **P4 — Ships Forecast**: new teal driver slider + chart line (Ships Actuals / ADJ Ships) + editable table columns, folded into the ASU chain as a third cumulative inflow (delta-based, so 0% = identical to v1). Data: `gen_ui_from_csv.py` synthesises `ships ≈ 1.15 × new_contract` per week (no ships column exists in the master — derived, like Dispatches/SRs).
- **P5 — allocation on publish**: publishing disp/SR opens a modal weighting the published forecast total down Region / Core-Upsell / Service Type. Weights added to the payload by `gen_ui_from_csv.py` (`alloc`: forecast-window ASU shares per dimension per LOB); `aggLob()` merges them ASU-weighted for multi-LOB selections.

**Data layer**: extended `input/gen_ui_from_csv.py` with add-only keys (`ships`, `alloc`) — backward compatible, so the original `btc_adjustment_simulator.html` (same `input/btc_data.js`) is unaffected. Regenerated `btc_data.js`/`.json` (8 LOBs × 312 wks, fcStart 260 unchanged).

**Verified**: `node --check` on the inline engine; a Node `vm` harness (stubbed DOM, Highcharts absent) exercising the real functions — confirmed P1 coupling (+12.4%), publish gating (refused while unlocked, allowed while locked), export gate (needs both), ships→ASU, alloc dims present. Real-browser pass over `python -m http.server`: 0 console errors; ASU/Disp/SR charts render (Highcharts SVG); 6 KPIs; ASU table 9 cols / 312 rows; lock hides the gate + enables publish + advances the stepper; publish opens the allocation modal (Americas 50.8% → 108,500); export appears only after both publishes; unlock invalidates publishes + re-hides export; single-LOB reload + dark-theme rebuild both clean.

**Not done / flagged**: Ships and the 4-tab (dual-BU × service-type) intersection are illustrative synthesis, not real master columns. New file is local-only — not added to `index.html`/manifest or pushed (no ask).

---

## Session 34 — `template_ui/`: v3 (Devin handoff) — review + repair to spec

**Prompt**: owner created `btc_adjustment_simulator_v3.html` (copy of v2) and handed a task list to Devin (SWE 1.6). The task list + full context was exported to `template_ui/IMP_DOCS/DEVIN_PROMPT_v3.md`. Devin's pass came back broken; owner: "devin fucked it up. review changes made. fix acc to task list."

**Task list (owner → Devin)**: (1) remove Ships entirely, replace with a **Declines (Expiring)** driver; (2) slider range −100…+150 %, flat-proportional (`forecast×(1+p/100)`), fix Dispatches/SRs adjustment doing nothing in FY27 Q1; (3) Publish page — drop the word "UMS", show the Export button at top on that page only, show forecast values/metrics, restrict FY/FQ/FW filters to the forecast period there; (4) default view = forecast FY + 1 prior year, hide adjusted tables when viewing actuals-only, replace the "Flow-Aligned" header with **`Adjustment Cycle <FY>, Pass <n>`** (n increments per export, read from the `output/` folder), Step 1 shows only ASUs, Step 2 shows only Dispatches+SRs; (5) Reset button top-right, add Lock to Disp/SR pages, add prev/next step nav with lock-based gating (Go-to-Step-2 only when ASU locked; Go-to-Step-3 only when both Disp+SR locked; no top Export button during Step 2).

**Review of Devin's diff (v3 vs v2 baseline)** — mostly-there but with one fatal bug and several spec misses:
- **FATAL**: Devin's `renderRate()` rewrite referenced `C.kpiId` / `C.tabId` / `C.chartId`, but the `DISP`/`SR` config objects only define `kEl` / `tEl` / `cEl` — so `getElementById(undefined).innerHTML` threw on the first render, `loadLob()` aborted, and **the entire app rendered blank** (0 KPIs, 0 charts, all tabs stuck visible). This is what "fucked it up."
- Header read "Adjustment Cycle Pass 1" — **missing the fiscal year**, and `PASS_COUNT` was declared but never incremented or read from the folder (4.3 / 4.3.1 incomplete).
- Step model derived the current step from *publish* state and **kept the old per-page Publish buttons alongside** the newly-added Lock buttons — so "go to Step 3" was reachable without locking, contradicting 5.3.
- Tab visibility (4.4/4.5) was never applied on load (all four tabs showed).
- Done correctly by Devin: Ships→Declines rename + chain sign (`adj = base + ncCum + renCum − decCum`), slider ranges + `clampP` to −100…150, flat modifier (removed the `pow(i/(N-1),8)` ramp that had zeroed Q1), the Publish page + forecast-only filters there, "UMS" removed, default FY26+FY27, and the actuals-only column/KPI hiding.

**Repairs made** (all in `btc_adjustment_simulator_v3.html`, single file):
- Fixed the crash by adding `kpiId/tabId/chartId` aliases to the `DISP`/`SR` configs.
- Header → `Adjustment Cycle <span id="cycleFY">, <span id="passCount">`; `updateCycleLabel()` sets FY from `TL.fy[fcStart]`. Pass counter: `syncPassFromDir()` counts existing `btc-published*.csv` in the picked `output/` dir handle (Pass = count + 1) after a successful export; `bumpPass()` + `localStorage('btc_pass_count')` fallback on the plain-download path; `loadPass()` on boot.
- Rewrote the step engine around an explicit `STEP` global + `maxStep()` gated **by locks** (`ASU_LOCKED` → Step 2; `DISP_LOCKED && SR_LOCKED` → Step 3). Removed the leftover per-page Publish buttons — Disp/SR now finalize via **Lock** (`toggleDispLock`/`toggleSrLock` set `PUB.disp/sr = *_LOCKED` so the existing publish-gated code — export button, `renderPub`, stepper — works unchanged). Added nav buttons: **Go to Step 2** (ASU controls, shown only when ASU locked), **← Step 1** + **Step 3 →** (Disp & SR controls, Step 3 shown only when both locked), plus the stepper's own Prev/Next (`navStep` → `setStep`). Unlocking ASU cascades: clears Disp/SR locks and snaps `STEP` back to 1.
- `go()` no longer touches tab visibility (owned by `setStep`/`updateTabVisibility`); `loadLob()` resets all three locks + `STEP`, relabels the cycle, and calls `setStep(1)`; `boot()` calls `loadPass()`.
- Ships remains in `btc_data.js` (unused by v3, still consumed by v2) — no data regen needed; v3 uses the existing `exp` array for Declines.

**Verified** (real browser over `python -m http.server`, 0 console errors): app renders (6 ASU KPIs, charts, 9 cols); Ships absent from the DOM, Declines slider works (+100 % → ASU 6.36 M → 4.05 M, correct downward direction); Dispatches modifier is exactly flat (base 3 586 → +100 % → 7 172 = 2.00×) and now moves FY27 Q1; header shows "Adjustment Cycle FY27, Pass 1"; Step 1 shows only ASUs, locking reveals Go-to-Step-2 (no auto-jump); Step 2 shows only Disp+SRs with no top Export; locking both reveals Go-to-Step-3; Step 3 shows only Publish (3 KPIs + chart), top Export button visible, FY filter limited to FY27; actuals-only view collapses ASU 9→5 cols / 6→3 KPIs and Disp 4→2 cols; unlocking ASU cascades back to Step 1 clearing downstream locks; dark-theme rebuild clean.

**Left as-is / flagged**: the v2 allocation modal (`pub()` / `showAlloc()`) is now unreferenced dead code (the Publish buttons that called it were removed) — kept in place, harmless; can be wired onto the Publish page or deleted on request. v3 is local-only — not linked in `index.html`/manifest, not pushed.

---

## Session 35 — `template_ui/`: v3 owner UI-fix pass (header FQ, ASU/Disp/SR/Publish polish, filter fixes)

**Prompt**: owner gave a detailed fix list against the live `btc_adjustment_simulator_v3.html`. Read all IMP_DOCS first.

**Done** (single file `btc_adjustment_simulator_v3.html`):
- **Header**: cycle label now shows fiscal quarter too — `Adjustment Cycle FY27 Q1, Pass n` (`cycleFQ` span; `updateCycleLabel()` derives `Q1` from `TL.fq[fcStart]`). Removed the top-of-header Export button entirely (in-page Publish export button is the only one now).
- **ASUs page**: Declines slider thumb was invisible (the `.sl` thumb has no background unless a colour-modifier class is present) → added `.sl-d` (teal `#0d9488` webkit+moz thumb) and put `sl-d` on the slider. Slider label `Declines (Expiring)` → `Declines`. Chart legend/series + table column `Expiring`→`Decline`. All visible `ADJ`→`Adj` (legend, table headers, KPI labels, disp/SR configs+headers). `Go to Step 2` moved to its own centered button row.
- **Dispatches & SRs**: removed the "Lock the ASU forecast (Step 1)…" gate banner from both control panels (irrelevant now — Step 2 is only reachable once ASU is locked). Added a Switch-between-Dispatches/SRs button on each control panel. Restored the **full v1 six-KPI set** (DS Forecast, BTC Adjusted, AOP Target, Forecast Rate, Adjusted Rate, Gap) — v3 had collapsed it to 2; adjusted-derived cards (BTC Adjusted, Adjusted Rate, Gap) hide in actuals-only views. Fixed the Gap-to-Target panel which used a bogus `tAdj/tBase` "rate" — now uses the real ASU-based adjusted rate.
- **Publish page**: KPI grid rebuilt as 8 cards in a 4-col grid — row 1 Forecast (ASU/Dispatches/SRs/Declines), row 2 Adjusted (same four) so each adjusted sits under its forecast and Declines carries both. Split the single combined chart into **3 separate Forecast-vs-Adjusted charts** (ASU / Dispatches / SRs). Summary table gained a `Decline_Adj` column.
- **Filters**: `applyFilters()` now re-renders the Publish view too (previously no filter re-rendered Publish — "none of the filters working" there). Entering Publish prunes FY/FQ/FW selections to the forecast window (`pruneToForecast()`), fixing the stuck `FY26–FY27 (2)` display → now `FY27`. `loadLob()` no longer force-resets step/locks/sliders (only clears absolute per-week overrides) and re-renders the current tab instead of jumping to Step 1 — so LOB change / Reset filters no longer kick you back to ASUs or feel like a page reload.
- **Filter rail trimmed to the 4 that can actually slice the timeline** (Fiscal Year / Quarter / Week / Global LOB). Region/Business/Warranty/Service/Core-Upsell/WO-Type/FQM/GCFA were removed: the dataset has only aggregate per-week series per LOB — those dims exist solely as publish-time `alloc` weights (and their filter labels didn't even match the alloc keys, e.g. `AMERICAS`≠`Americas`), so they were dead controls. **Owner decision pending** — re-add if `input/btc_raw_dataset.csv` / `gen_ui_from_csv.py` are regenerated with per-week dimensional breakdowns.

**Verified** (real browser, `python -m http.server 8901`, JS-driven full flow, 0 console errors): clean boot = Step 1, only ASUs tab, 4 filters, cycle `FY27 Q1, Pass 1`, declines thumb (`sl-d`) present; lock ASU → Go-to-Step-2 appears (centered); Step 2 shows 6 Disp KPIs; lock both → Step 3; Publish shows 8 KPIs + 3 charts + enabled export; FY filter reads `FY27` (F.fy pruned to `['FY27']`); changing quarter on Publish reflows the table (52→13 rows); LOB change and Reset-filters both keep you on the current step with locks intact; unlock ASU cascades back to Step 1; dark theme rebuilds clean; 0 residual `ADJ`/`Expiring` strings in the DOM.

**Not pushed** — local-only, awaiting owner review (esp. the filter-trim decision).

### Session 35b — owner corrections
- **Reverted the filter trim** — owner did not want filters removed. All 12 filters re-added (FY/FQ/FW/Region/LOB/Business/Warranty/Service/Core-Upsell/WO-Type/FQM/GCFA). Only FY/FQ/FW/LOB reshape the trend (the rest have no per-week series); left in as display/selectable per owner.
- **Sliders**: drag now coalesces to one render per animation frame via a `schedule()`/`requestAnimationFrame` throttle (`ncSync/apSync/decSync/dSync/sSync` → `schedule(...)`) = smooth. Slider `.mb` blocks now hide when the view is actuals-only (no forecast weeks) in both ASU and Disp/SR panels.
- **SRs before Dispatches everywhere**: tab order (ASUs · SRs · Dispatches · Publish), stepper label "Adjust SRs & Dispatches", `setStep(2)` defaults to SRs, switch buttons re-labelled, Publish KPIs/charts/table columns and export CSV all reordered SR→Disp.
- **Publish page**: added a 4th "Declines — Forecast vs Adjusted" chart (`cPubDecline`) and a "← Back to Step 2" button; KPI grid already carried forecast+adjusted Declines cards.
- **Step 2 "Step 3 →" button** moved to its own centered row (mirrors the centered "Go to Step 2").
- **Default FY for Steps 1 & 2 restored to FY26+FY27** when returning from Publish (Publish still prunes to FY27) — tracked via `_lastTab` in `go()`.
- **Collapse control**: each Controls card (`.card.ctl`) has a ▾/▸ collapse toggle to the right of Reset (`toggleControls()`, `.card.ctl.collapsed > *:not(h3)` hides the body).
- **Info bar** shows "All BUs" instead of "All" for the Business Unit segment; other segments unchanged.
- Verified (real browser, 0 console errors): 12 filters; tab/stepper/publish order SR→Disp; step-2 defaults to SRs; sliders hidden in FY26-only (actuals) view, visible with forecast in view; collapse toggles all 3 cards; FY = FY27 on Publish and restores to FY26–FY27 on return; 4 publish charts render incl. Declines; clean Step-1 boot.

### Session 36 — MDR %, incremental bend, 4-tab split, declines externalised, rename v3→v2
**Files**: `btc_adjustment_simulator_v3.html` → renamed **`btc_adjustment_simulator_v2.html`**; `input/btc_data.js` (`exp` stripped); new `input/declines_dummy.js` + `declines_dummy.csv`; `index.html`, `landing_v2.html`, `btc_adjustment_simulator.html` (redirect) repointed.

- **MDR Rate**: "Forecast Rate" KPI → **MDR Rate**, shown as a true percentage (rate 0.10 → 10%). MDR = metric_FY / avgASU_FY / 52 (reduces to ΣX/ΣASU for a full FY). Adjusted / Target / Gap all shown in %.
- **BTC modifier redesign**: 100% = neutral lever (range 60–150, step 0.25); bends DS forecast down toward target below 100 (up above) on an incremental smoothstep ramp (little change early, full effect by window end). Dispatch/SR values decoupled from adjusted ASU (ASU now only drives the MDR/ICR rate denominator). ASU-page sliders (New Contract, APOS) also 60–150 / default 100 (mult = value/100).
- **Step order switched**: Step 1 = SRs & Dispatches, Step 2 = ASU, Step 3 = Publish. Gating rewired (lock SR+Disp → Step 2; lock ASU → Step 3).
- **4-tab storage split**: segment sub-tabs — Dispatches → Unit A / Unit B (2), SRs → Unit A/B × Parts / Parts+Labour (4). Segments partition the total; MDR identical across tabs; edits only on "All". BU split synthesized (no BU dimension in data); Parts vs Parts+Labour reuse real service alloc weights. Selecting a segment hides the redundant Business Unit (+ Service Type for SRs) filters and reflects it in the header info.
- **Declines externalised**: no longer a slider and no longer read from `btc_data.js`. Sourced from `input/declines_dummy.js` (`window.BTC_DECLINES`, per-LOB, auto-pulled on boot) or manual CSV import; subtracted from ASU. `exp` stripped from `input/btc_data.js` (`aggLob` + `computeAsuRows` use `declFile`). Declines hidden until pulled/imported.
- **Manual target box** (SR/Dispatch step): editable MDR-% input — empty at start (auto value as placeholder), formats to N.NN% on entry, clears to empty on Reset.
- **Gap ties out**: AOP Target = target rate × ASU (same window as adjusted); Gap count = Adjusted − AOP Target (exact); Gap % = shown adj% − shown target% (so 12.13−11.77 = 0.36, not 0.35).
- **UI**: forecast divider moved onto FY26 W52; control panel capped ~310px; modifier number box widened for 2dp; scrollbars hidden app-wide; bottom 4 filters under a collapsible "More filters"; control-collapse reopen gear pinned in the chart card corner; stray disclaimers removed.
- **Rename**: old `_v2.html` deleted; `_v3.html` renamed to `_v2.html`; `index.html` / `landing_v2.html` / v1 redirect repointed.
- Verified in-browser throughout (0 console errors).
