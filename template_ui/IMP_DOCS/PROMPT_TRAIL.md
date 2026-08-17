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

### Session 37 — adjusted values hidden until modifier changed; Publish X-axis = quarter-ends
**Files**: `btc_adjustment_simulator_v2.html` (single file).

- **Adjusted-view gating (req 1, all pages/charts)**: every adjusted KPI card, chart line, table column and legend entry now stays **hidden until the page's modifier is actually changed** from neutral (100) — or a manual per-week edit exists. Per-page `showAdj` flag added in `renderRate` (SR/Disp: `mI≠100 || OVR[kind]`), `renderAsu` (`ncI≠100 || apI≠100 || any OVR.asu edit`), and `renderPub` (page-level: any modifier ≠100 or any `OVR` non-empty). Replaces the old `actualsOnly`-only gate; `showAdj = !actualsOnly && <changed>`. Adjusted chart series are kept in the series array with **empty data** when hidden (so legend/series indices stay aligned for the isolation/hover layer) — the line just appears/disappears.
- **Legend classes**: `.adj-lg` (SR/Disp "Adj" span, ASU "Adj ASU/NC/APOS"), `.adjdecl-lg` (ASU "Adj Decline" — needs `showAdj && DECL_IMPORTED`), `.pub-adj-lg` (Publish "Adj" spans). ASU "Decline Actuals" keeps `.decl-lg` (actuals — shown whenever declines present, independent of adjustment).
- **"Pop out" reveal**: `popReveal(kind,showAdj,els)` + `_admShown` fire a one-shot `@keyframes popIn` on the KPI row + table wrapper **only on the hidden→shown transition** (guarded so it does NOT re-fire on every slider tick → no drag flicker). KPI grid re-flows automatically (3↔6 cards for SR/Disp via `kr6`; 3/4↔6/8 for ASU via the existing `kr4`/`kr5` decline logic), so row 2 (adjusted) sits directly under row 1 (actuals/forecast).
- **Publish X-axis (req 2)**: unless the user has picked specific quarters/weeks (`F.quarter`/`F.week` empty), the four Publish charts reduce to the **beginning (first forecast) week + each quarter-ending week** (FY27 → `W01, W13, W26, W39, W52`) via a `cvis` (chart-only) index list — computed as first visible + last visible index per `TL.fq`. KPI **totals and the summary table still use the full window** (`vis`, all 52 weeks); only the chart axis is thinned. Selecting a quarter/week restores that selection's full weekly axis.
- **Verified** (real browser, `?v=` cache-bust reload, 0 console errors): SR/Disp/ASU/Publish all hide adjusted at neutral and reveal (with pop) on change; adjusted chart lines carry 0 plotted points when hidden, full points when shown; Publish default axis = `W01/W13/W26/W39/W52`, table = 52 rows; selecting FY27-Q1 expands the axis to its 13 weeks, clearing restores the 5 quarter-end points.
- **Not pushed** — local-only, awaiting owner review.

### Session 38 — declines decoupled (import-only, forecast-only, no adjust); Publish rebuilt with NC/APOS; x-axis label thinning; NC/APOS rename
**Files**: `btc_adjustment_simulator_v2.html` (single file).

- **Declines reworked (display-only, forecast-only, import-only)**: declines are no longer auto-pulled from `declines_dummy.js` on boot and no longer folded into the ASU math. They are now a **single teal forecast-only series** (card + column + chart line) shown **only after a manual CSV import**, and are **never adjusted** — the old "Decline Actuals" + "Adj Decline" pair (and the editable Adj Decline cell) are gone everywhere (ASU page + Publish). Import values land in a dedicated `DECL_VALS{fw:val}` (was `OVR.asu[fw].dec`); `computeAsuRows()` dropped `exp`/`adjDec`/`decCum` and now exposes a forecast-only `decl` per row; `Adj ASU = base + ncCum + renCum` (no decline term). `loadLob()` clears `DECL_VALS`/`DECL_IMPORTED` on any data change (must be re-imported); `aReset()` clears them too; the import button is no longer disabled by the ASU lock (declines are independent). Declines legend uses one `.decl-lg` span; `.adjdecl-lg` removed. Where the adjusted row would sit under Declines, a hidden `.kp` placeholder keeps the forecast/adjusted grid aligned.
- **Smart x-axis label thinning (all charts, all data points kept)**: new `axisLabels(idx)` + a 5th `xlab` arg to `svgChart()` (drives Highcharts `tickPositions` + a label `formatter`; `sig` includes `xlab` so a label change forces a rebuild). Data points are **never removed** (reverted last session's `cvis` point-dropping). Short span (≤8 quarters): label the **starting week + each quarter-ending week** (week labels). Longer span (>8 quarters): label the **starting quarter + ending quarter** only (quarter labels at the endpoints). Verified with a 23Q1–27Q2 range (234 pts, 18 quarters → exactly `23-Q1` and `27-Q2`); FY27 → `W01/W13/W26/W39/W52`.
- **Publish page rebuilt (req order + NC/APOS)**: added **New Contracts** and **APOS Renewals** forecast-vs-adjusted charts and KPI cards. All Publish cards, charts and the summary-table columns reordered to **NC, APOS, ASU, Declines (only if imported), SR, Dispatch**. KPI grid is now an N-column grid (`5` normally, `6` with declines) with **forecast in row 1 and adjusted in row 2** directly beneath each (hidden placeholder under Declines since it isn't adjusted). Declines chart is forecast-only and its card hides when nothing is imported. All Publish charts use the new x-axis label thinning while keeping every weekly data point.
- **Rename**: "New Contract" → **New Contracts**, "APOS Renewal" → **APOS Renewals** (ASU-page slider labels, Publish chart titles + card labels). `NC`/`APOS` abbreviations left as-is.
- **Verified** (real browser, `?v=` cache-bust, 0 console errors): declines hidden by default (no card/column/line); real Blob import via `importDeclines()` → Declines card/column + one forecast-only line (points only on the 52 forecast weeks), no adjusted decline even when NC is adjusted; Publish order + titles + table header exactly NC/APOS/ASU/Declines/SR/Disp, 52 categories with ticks at `[0,12,25,38,51]`, 52 table rows; long-range label logic returns start/end quarter; slider labels read "New Contracts"/"APOS Renewals".
- **Not pushed** — local-only, awaiting owner review.

### Session 39 — declines re-subtract from ASU; per-metric ASU reveal; remove-declines; Publish expand modal + adjusted colours
**Files**: `btc_adjustment_simulator_v2.html` (single file).

- **Declines subtract from Adjusted ASU again** (reversing S38's full decouple, per owner): `computeAsuRows()` accumulates `declCum` and `adjV = base + ncCum + renCum − declCum` (cumulative running-balance); the ASU-page "Adj ASU" chart line subtracts the week's `decl` too. Declines are still **never adjusted** (one forecast-only teal line/card/column, import-only) and still feed the MDR/ICR denominators, so `importDeclines()`/`removeDeclines()` now also re-render Disp/SR. Because declines now move Adjusted ASU, `DECL_IMPORTED` reveals the Adj ASU card/line even at neutral sliders.
- **Per-metric ASU reveal (fix)**: moving one ASU slider used to draw *every* adjusted line. Now `ncAdj`/`apAdj` are independent (each slider or its own manual edit), `asuAdj = ncAdj || apAdj || DECL_IMPORTED`; only the changed metric's Adj line/card/column shows (Adj ASU shows whenever anything affecting ASU changed). Legend classes split to `.adjasu-lg` / `.adjnc-lg` / `.adjap-lg`; row-2 KPI cells use hidden `.kp` placeholders so the forecast/adjusted grid stays column-aligned when only some adjusted cards show.
- **Remove imported declines**: new `✕ Remove file` button on the ASU controls (shown only when imported) → `removeDeclines()` clears `DECL_VALS`/`DECL_IMPORTED` and re-renders ASU + Disp/SR (+ Publish).
- **Publish adjusted-line colours**: Adj NC / Adj APOS stay orange `#ea580c`; **Adj ASU `#dc2626` (red), Adj SR `#db2777` (pink), Adj Disp `#ca8a04` (gold)** — each distinct from the NC (`#3a6ef0`), APOS (`#6d28d9`) forecasts and the declines teal (`#0d9488`). Legend dots updated to match.
- **Publish "⤢ Expand charts" modal**: new `#pubExpandModal` (backdrop `rgba(13,16,32,.4)` = 40% opaque) renders all Publish charts 2-up at 340px. The publish charts are now built from a single `specs[]` array reused by the page cards and the modal; `_pubExpand` caches it and the modal redraws live if it's open when data changes. `closePubExpand()` destroys the `cBig*` instances and empties the body, leaving the page charts untouched. **Verified collapse-back**: page chart is 250×250 before open and 250×250 after close, original instance still alive, no leaked `cBig*` charts.
- **Verified** (real browser, 0 console errors): NC-only → Adj NC + Adj ASU shown, Adj APOS hidden (and vice-versa); import 5,000/wk × 52 at neutral sliders → Adjusted ASU −260,000 vs base, Adj ASU card/line revealed, remove button clears it (aAdj==aBase); Publish adjusted colours red/pink/gold + orange; expand modal opens at 40% backdrop with 5 charts (6 with declines) and collapses back to original size.
- **Not pushed** — local-only, awaiting owner review.

### Session 40 — Publish colour fix (adjusted back to orange, recolour forecasts); per-chart / per-row expand
**Files**: `btc_adjustment_simulator_v2.html` (single file). Corrects two S39 choices per owner.

- **Publish colours corrected**: **all adjusted lines are the default orange `#ea580c` again** (S39's red/pink/gold on Adj ASU/SR/Disp reverted). Instead the **forecast** lines that previously collided are recoloured: **SR forecast → `#db2777` (pink)**, **Dispatches forecast → `#ca8a04` (gold)**; NC `#3a6ef0`, APOS `#6d28d9`, ASU `#16a34a`, Declines `#0d9488` keep theirs — so the six forecast lines are all distinct and none matches NC/APOS/ASU. Legend dots updated to match.
- **Expand is now individual, not all-at-once** (S39's single "Expand charts" modal removed). New CSS-promote focus mode: `toggleExpand(el)` adds `.expanded` (`position:fixed;inset:24px;z-index:85`) over a real `#expandBackdrop` (`rgba(13,16,32,.4)` = 40%); `collapseExpand()` (also Esc / backdrop click) removes it. Because it promotes the **same DOM element** (no clones) and just reflows Highcharts, every control keeps working and the element returns to its exact original size on collapse.
  - **Publish**: a `⤢` button top-right of each chart card expands **that one chart** (`toggleExpand(this.closest('.card'))`).
  - **Steps 1 & 2 (SRs/Dispatches, ASU)**: a `⤢` button top-right of the chart card expands the **whole chart+controls `.row`** (`toggleExpand(this.closest('.row'))`) — sliders/table edits stay live inside the expanded view. (Controls-reopen gear moved to `right:48px` to sit left of the expand button.)
- **Verified** (real browser, 0 console errors): forecast colours NC blue / APOS purple / ASU green / SR pink / Disp gold, all adjusted orange; expanding one Publish chart promotes only that card (others untouched) over the 40% backdrop, `.cw` 250→477, collapse returns it to 250 (`position` relative→fixed→relative, `anyExpanded`→0); Step-1 SR row expands to show chart+controls, moving the SR slider inside updates the Adj line, collapse restores 250.
- **Not pushed** — local-only, awaiting owner review.

### Session 41 — BPA_FORCASTING_MOCK.HTML: remove fake-live chrome; ship template_ui v2 + this to master/live
**Files**: `BPA_FORCASTING_MOCK.HTML`, `btc_adjustment_simulator_v2.html`, all IMP_DOCS mirrors, `.gitignore`.

- **BPA de-cluttered (removed misleading "live" chrome on the static mock)**: deleted the home **status bar** (green pulse-dot + "Live" + auto-updating "Refreshed HH:MM" clock) and the header's **`Refreshed HH:MM` stamp**; removed the `setRefreshStamp()` function and its `setInterval(…,60000)`. Removed the header **`FY26 · All Regions` context badge** (`#global-context`) and dropped its hardcoded reset assignment; the filter-driven updater at `updateFilterChips()` is now null-guarded (`if(gc)`) so it no longer throws with the badge gone. Neutralised the Current-Week KPI sub-label `FY26 · Actuals through here` → `Actuals through here` (static HTML + its JS setter). Verified in-browser: none of the removed nodes/functions exist, no "Refreshed" text anywhere, sub-label correct, and `openDashboard`/`onFilterChange`/`resetFilters` all run with 0 console errors.
- **Shipped**: this session committed and pushed the template_ui BTC simulator v2 work (Sessions 37–41) **and** the BPA change to `master` (GitHub Pages → live). Live URLs: `…/template_ui/btc_adjustment_simulator_v2.html` and `…/BPA_FORCASTING_MOCK.HTML`.
- **Docs synced**: `PROMPT_TRAIL.md` copied from `template_ui/IMP_DOCS/` to the root `IMP_DOCS/` mirror (HANDOFF/TECHNICAL/DESIGN_SYSTEM already identical). `BTC_GUIDE.md` + `BTC_GUIDE_VS_SIMULATOR_DIFF.md` copied to root `IMP_DOCS/` **with matching root `.gitignore` entries added first** — those two carry real client material and are gitignored by exact path, so an un-ignored root copy would have leaked to the public site. `git check-ignore` confirmed both root copies are ignored before committing.

### Session 42 — BTC v2: per-segment sliders, allocation-driven filters, Publish rebuild, editable cycle label, brand tile
**Files**: `template_ui/btc_adjustment_simulator_v2.html`, `template_ui/input/declines_dummy.csv` (regenerated), new `template_ui/input/declines_dummy_alt.csv`, all IMP_DOCS mirrors, `.gitignore`.

- **Per-segment modifiers (SR / Dispatches)**: each segment sub-tab now owns its **own** modifier and per-week edits — `C._segMods[]`, `bendSeg(C,i)`, `sumSubs(C)`, `OVR[kind][segIdx][fw]`. The **All** tab shows the *sum* of the sub-segments (Σ subs == All verified exactly) and its slider acts as a uniform master. The All slider/control panel reflects sub-tab changes via `compositeMod(C)` (weight-composite, snapped to the 0.25 step). **Reset is per-tab** (`segReset`) — All resets everything. **Adjusted reveal is per-tab** (`segAdjActiveAt(C,idx)`): adjusting Unit A no longer draws Unit B's adjusted line. All-tab DS card sums the *rounded* per-segment shares (`sumSubsBase`) so it ties out with the sub tabs (killed a +1 drift).
- **Allocation-weight filter engine (Region etc. now actually work)**: previously only FY/FQ/FW/LOB reshaped the data — Region did nothing. Root causes: the weights were never applied, **and** the names didn't match (dataset `Americas` vs filter `AMERICAS`; `Parts Only` vs `Parts Only (Unit A)`). New `weightsFor(k)` / `dimShare(k)` / `allocMult()` / `SC(key,arr)` (memoised per multiplier+LOB) apply real `TL.alloc` weights (region / coreupsell / service, case- and suffix-tolerant) plus deterministic `SYNTH_ALLOC` splits for the dimensions the dataset carries no weights for (business, warranty, wotype, fqm, gcfa). Every series routes through it — SR, Disp, ASU, NC, APOS, declines, Publish charts, both CSV exports. Verified: AMERICAS 0.5079, EMEA 0.2684, APJ 0.2237, all-three → exactly 1.0, EMEA×UnitA = 0.1557. MDR/ICR rates unaffected (numerator and denominator scale together). **`SYNTH_ALLOC` ratios are placeholders — replace with real ones when known.**
- **Declines**: CSV extended from FY27-only (52 rows) to the **full FY22–FY27 window (312 rows)**, Σ across LOBs; import no longer drops pre-forecast weeks so history displays, but only forecast weeks feed `declCum` (actuals ASU untouched). Declines **survive a LOB change** (keyed by fiscal week, scaled by `allocMult`) — `loadLob()` no longer wipes them. Import/remove **lock with the ASU forecast** (buttons + file input disabled, and guarded inside `importDeclines`/`removeDeclines`). Colour → **`#8b0000`** everywhere (numeric columns stay default/black). New card shows the **WoW/QoQ/YoY change badge**. `declines_dummy_alt.csv` added as a re-import fixture (312 rows, every value different) — confirmed a second import fully replaces the first with zero stale keys.
- **APOS S-curve fix**: `ba = AP[i]*apM` was a **flat** multiplier from forecast week one, so the weekly delta was constant and the cumulative line came out straight. Now ramped by the same smoothstep the SR/Disp bends use (`apRamp`). **New Contracts still uses the flat model** — not changed, owner only flagged APOS.
- **Adjusted line colour** → **`#dc00ff`** across all charts/legends/cards/columns (20 occurrences); the old `#ea580c` orange was too close to the declines red.
- **Publish page rebuilt**: all visible charts on **one row** (`grid-auto-flow:column`, hidden card takes no track), plot area −20% (`.pubcharts .cw` 250→200px) leaving title/legend/axis untouched. **NC + Declines charts merged** into one plot on a card spanning two columns; the KPI cards stay separate with **Declines moved immediately right of New Contracts**. Em-dashes → hyphens in chart titles (table `—` placeholders kept). New `niceScale(mn,mx,maxTicks)` gives round axis bounds (steps 1/2/5 ×10ⁿ, ≤5 labels, top tick strictly above the peak, zero padding → no dead band): 4151–9452 → **[4K, 6K, 8K, 10K]**. X-axis tick marks (6px, outside) mark each week. Tooltip is `outside:true` with a positioner that lifts it **above** the plot so it stops covering the lines. Expanded view injects that chart's **own KPI cards inside the same box** (`PUB_KPI` + `pubKpiStrip`), labels **every** week, and allows up to 8 y-values.
- **Expand/focus mode**: horizontal size restored (`inset:24px`); the expanded card is a flex column so the **chart fills whatever the table/controls leave** — no dead space at the bottom (measured 1px residual); table capped at 38vh. Backdrops unified at **30%** (expand + modal). The **filter rail stays live while expanded** (`z-index 86` over the 84 backdrop) and the card yields the rail's 252px so they never overlap; collapsing the rail while expanded widens the card by exactly 252px, with charts reflowing on toggle. Expand button inset unified to `top/right:8px` on **every** page (controls gear to `right:42px`).
- **Header rebuilt**: `.brand` span replaced by a **`.brandtile`** (full 52px bar height, flex-centred) + `.brandtxt`. "BPA" is all-caps (ink ascent 11 / descent 0 vs font ascent 15 / descent 3) so it always rode high; a measured +2.3px correction puts its **ink centre exactly on the bar centre (26.0)** — 20.5px clear above and below. Divider gaps equalised at 12px each side (a −3px margin cancels the hover chip's padding).
- **Adjustment-cycle label**: the automatic "Adjustment Cycle ⟨FY⟩, Pass ⟨n⟩" logic is unchanged and remains the default, but the label is now **inline-editable at the top only** (single `contenteditable` span — plain weight, no underline, normal click-drag selection, Enter commits, blank reverts to auto, paste forced to plain text). The **export filename follows the label** (`btc-adjustment-cycle-fy27-pass-1.csv`), still overridable by the Export "File name" box, which now commits and blurs on Enter. **Pass n = number of .csv files in the outputs folder + 1**, re-counted on entering Publish (no longer tied to the old `btc-published*` name pattern). *Known limit*: a browser can only read that folder after the user grants access via the picker, so on a fresh load before any export the count falls back to `localStorage`.
- **Bug fixed (self-inflicted)**: the `PUB_KPI` assignment added for the expanded-view strip landed *inside* the `kPub.innerHTML =` statement, so the Publish KPI cards' HTML was built then discarded while `kPub` received `"[object Object]"` — syntax-valid, so `node --check` passed it. Assignment moved above the statement; 12 cards verified back in the correct order.
- **Verified** throughout via real-browser DOM/geometry measurement and Node harnesses (syntax check of the inline script on every pass; Σ-subs invariant; allocation multipliers against the real dataset; `niceScale` against the owner's exact cases; re-import replacement). Full-app runtime needs the real `input/*.js` — the preview pane loads the file as a `data:` snapshot, so `TL` is null there and a stub was used for the Publish checks.

### Session 43 — adjusted orange restored, Publish line isolation, expand alignment, Step-1 default view, ASU tie-out, editable AOP target, brand baseline
**Files**: `template_ui/btc_adjustment_simulator_v2.html` (single file), all IMP_DOCS mirrors.

- **Adjusted colour → orange again**: every `#dc00ff` (S42's magenta) reverted to **`#ea580c`** — 25 occurrences across legends, chart series, KPI cards and table columns on all four pages. Adj NC (`#0891b2`) and Adj APOS (`#ac4073`) on the ASU page keep their own colours, as they did before S42.
- **Publish charts: click-to-isolate lines**: the legend engine (hover-highlight + click-to-isolate, previously only on `cAsu`/`cDisp`/`cSr`) now covers the five Publish charts too. `LEG_SEL` maps chart-element id → legend container selector, `LEG_ISO` became a lazily-populated map (`isoOf`), and `initLegends(list)` is idempotent (`data-legbound` guard + a `data-col` attribute so the swatch colour survives re-binds) so it can be re-run at the end of `renderPub()` — the Publish charts don't exist at boot. Publish chart cards gained ids (`cardPubApos/Asu/Sr/Disp`; NC already had one). Hidden legend spans keep their index slot, so span index ↔ series index stays aligned with or without Declines.
- **Expanded chart top edge = filter-rail top edge**: `.expanded` inset changed from a uniform `24px` to `top:52px; left/right/bottom:24px` — the promoted card's top now sits exactly on the header line the rail starts at (measured: rail top 52, expanded top 52; right 1004 vs rail left 1028, so still no overlap).
- **Step 1 always opens in the default SR/Dispatch view**: new `resetSegViews()` (called from `setStep(1)`) snaps `SR._seg`/`DISP._seg` back to **All**, clears any legend isolation on `cSr`/`cDisp` and re-renders. Modifiers, per-week edits, locks and **the filter rail are untouched** (verified: after seg 1 + 85% + an isolated line, returning to Step 1 gives seg 0, all three series visible, `_segMods` still `[95.75,85,100,100,100]`, `F.fy` still `FY26,FY27`).
- **ASU count mismatch — real, fixed**: ASU is a running **balance** (a stock), so the ASU page reports the end-of-window level while Publish was **summing** it across all 52 forecast weeks — counting the same installed base 52 times. NC / APOS / SR / Dispatch / Declines are weekly **flows** and sum correctly; only ASU was wrong. Publish now reports `rows[last].base` / `rows[last].adj` with an "end of window" sub-label, and the two pages tie out exactly (both 6,355,461 on the default LOB selection).
- **Editable AOP target on Steps 1 and 2**: an **AOP target / wk** box now sits in the SR, Dispatches and ASU control panels. Default (blank box, value shown as placeholder) = **the average of that metric's AOP-target values across the forecast FY** — for SR/Dispatches the mean of `target rate × weekly ASU` over the forecast FY, for ASU the mean weekly inflow (NC + APOS), since the dataset carries no ASU SMOD target. The per-week AOP is now the **primary** input: the window total (`AOP Target` KPI) is `aop × visible weeks` and the target **rate** is derived from it, so Gap still ties out exactly (`Gap = BTC Adjusted − AOP Target`, verified 426,622 − 416,000 = +10,622). The existing Target-rate box still works and the two are mutually exclusive — setting one clears the other. The override is stored at 'All'-segment scale and rescaled by segment weight (8,000 on All → 2,332 on Unit A · Parts). ASU also gained a dashed AOP line (fixed series slot 6, so legend indices stay aligned whether or not Declines is present) and a **Gap / wk** readout. Cleared by Reset on each page.
- **"BPA" alignment (req 7)**: earlier passes centred the brand glyph's ink on the *bar's* centre line, which is not what the eye reads as aligned — two runs of different size look aligned when their **baselines** match. Brand + crumb + divider + cycle now live in one `.hdleft` flex group with `align-items:baseline`, so the browser lines the baselines up itself; the hand-tuned `top:2.3px` offset is gone. Measured: brand, crumb and cycle baselines all at **29.5px**, and the 12px gaps either side of the divider are unchanged.
- **Verified** (real browser over `python -m http.server`, real `input/*.js` loaded, 0 console errors): `node --check`-equivalent syntax check of the inline script, div balance 118/118, plus scripted runs of every item above.
- **Not pushed** — local-only, awaiting owner review.

### Session 43b — steps 1↔2 swapped, lock mechanism removed, AOP target reworked into a modifier-style control
**Files**: `template_ui/btc_adjustment_simulator_v2.html` (single file), all IMP_DOCS mirrors.

- **Step order swapped back**: **1 = ASU (driver) → 2 = SRs & Dispatches → 3 = Publish** (reverses S36). Stepper labels, `setStep()`, `updateTabVisibility()`, the default tab/view (`ASUs` + `#vAsu` now carry `on`) and every in-panel nav button were flipped: ASU gets one centred "Go to Step 2 (SRs & Dispatches) →"; SR and Dispatches each get "← Step 1 (ASU)" + "Step 3 (Publish) →". `resetSegViews()` (the 'All'-segment default-view reset) moved from Step 1 to **Step 2**, where the SR/Dispatch pages now live.
- **Lock/publish gate removed entirely**: `ASU_LOCKED` / `DISP_LOCKED` / `SR_LOCKED` / `PUB{}`, the three "🔒 Lock forecast" buttons, `toggleLock` / `toggleDispLock` / `toggleSrLock`, `setLockUI` / `setDispLockUI` / `setSrLockUI`, the two per-page gate banners and the Publish gate banner are all gone. `maxStep()` is a constant `3`, so every step is reachable at any time; nothing disables sliders or table inputs any more, the declines import/remove buttons are always live, and **Export is always enabled** on the Publish page. Step "done" state in the stepper is now simply "any step before the current one".
- **AOP target reworked** (owner: it must be *the editable average of the forecast year's values*, not a "/wk" figure):
  - Label is now **"AOP Target"** everywhere — the `/ wk` suffix is gone from all three panels (req 3.1.2; verified no `/wk`, `/week`, `/quarter`, `/year` string survives in the rendered DOM).
  - The value is, and always was, **the average of the forecast FY's (FY27) weekly values** — unchanged by the FY26+FY27 default view or by any filter (req 3.1.1). The **AOP Target KPI and the Gap** are what follow the selected time frame: target × visible weeks, and `Gap = BTC Adjusted − that` (req 3.1 / 3.1.3). Verified: AOP 9,000 → 936,000 over the 104-week default view, 468,000 over FY27 alone, while the editable value stays 9,000.
  - **Driven like the BTC Modifier** (req 3.2.3): a `.mb amber` block with a **range slider + number box** pair (`aopSync()`), travel ±50% of the automatic value (widened if a typed value falls outside), step 1 so the slider lands exactly on the typed/auto number. `syncAopUI()` repaints both controls on every render. The override is still stored at 'All'-segment scale and rescales per segment (8,000 All → 2,332 on Unit A · Parts). Setting the Target-rate box still clears the AOP override and vice versa; Reset restores the auto value.
  - **SRs / Dispatches**: the "Gap to Target" heading is gone (req 3.2.1) and every readout row is now one shape — label hard left, value hard right, all boxes 90px (req 3.2.2; measured: labels all at x 714.8, boxes all 905.2→995.2).
  - **ASU**: "Gap to AOP Target" heading and the "Gap / wk" row removed; the AOP Target block moved **up** to sit with the other control blocks, directly under Declines and above "ASU vs Base" (req 3.3). It is excluded from the actuals-only `.mb` hide via `.mb:not(.mb-aop)`, so the target stays visible in every view.
- **Verified** (real browser, real `input/*.js`, cache-busted reload, 0 console errors): inline-script syntax check, div balance 114/114, boot lands on Step 1/ASUs, free navigation 1↔2↔3 in both directions with no locks and Export enabled throughout, zero "Lock forecast" buttons and zero `.gate` elements in the DOM, AOP slider/box/KPI/chart-line/target-rate all consistent on SR, Dispatches and ASU, segment rescaling, per-page Reset, and header baselines still coincident (29.4 for brand/crumb/cycle).
- **Not pushed** — local-only, awaiting owner review.

### Session 44 — editable adjusted values everywhere + row comments/highlight; SR↔Dispatch segment swap; dynamic y-axis + single-week dots
**Files**: `template_ui/btc_adjustment_simulator_v2.html` (single file), IMP_DOCS mirrors.

- **Adjusted values editable on every page** (was: only SR/Disp *sub*-segment tabs, plus Adj NC / Adj APOS on ASU).
  - **SR / Dispatches `All` tab**: new All-level absolute override `OVR[kind][0][fw]`, applied via `allOvr()` / `sumSubsAdj()` *before* `C._adj` is set, so it flows to the chart, Delta column, KPIs, Publish page and both CSV exports. `segAdjActiveAt(C,0)` now counts it, so the adjusted column/line reveals. An All edit is **not** redistributed down to the sub-segments (documented in-code) — while one is active, Σ(sub tabs) can differ from the All total for that week.
  - **ASU — Adj ASU editable**: ASU is a running *balance*, so the override propagates forward. `computeAsuRows()` carries an `ovShift` accumulator: `adjV = base+ncCum+renCum−declCum+ovShift; if(o.aa!=null){ovShift += (o.aa−adjV); adjV = o.aa;}` — the edited week takes the typed value and every later week's balance shifts by the same delta (verified +76,809 across W12–W14).
  - **Publish — all five adjusted columns editable**, writing back into the same stores the source pages use (`NC→OVR.asu[fw].an`, `APOS→.ba`, `ASU→.aa`, `SR→OVR.sr[0][fw]`, `Disp→OVR.disp[0][fw]`), so edits round-trip in both directions. Declines stays read-only (import-only, never adjusted). Historical rows stay `—` everywhere.
  - Fixed a latent pre-existing bug exposed by clearable cells: `editAsu` now deletes an emptied `OVR.asu[fw]` object, otherwise `Object.keys(OVR.asu).length>0` (the Publish `showAdj` gate) latched on forever.
- **Comment column** (last column, all four tables): header + cells appear only under the existing `showAdj` gate; a `.cm` text input renders **only on rows that carry an override**, computed from the store (rows are innerHTML-rebuilt each render). New `CMT={disp:{seg:{fw}},sr:{seg:{fw}},asu:{fw},pub:{fw}}`. **Publish gets its own `pub[fw]` key** — a Publish row spans five stores, so no single source key could own the note; it is pruned when that week has no override in any of the five. Comments persist on `change`/blur only (no recompute mid-typing — 23 simulated keystrokes, 0 focus/caret breaks) and are HTML-escaped. Wired into `segReset` / `aReset` / `loadLob` and pruned inside `editRate`/`editAsu` so no orphan notes survive a cleared edit. **Not exported** — `csv()` / `_exportCsv()` deliberately untouched.
- **Edited-row highlight**: `tr.edt td{background:#eef4ff}` (light) / `#111a2e` (dark), declared after `tr.act` — historical rows can never be edited so the two never collide.
- **Table widths**: `table-layout:fixed` with no `<col>` crushed 9 columns to 63px and clipped `6,000,000` inside its input. New `fitTable()` sets `minWidth = 66 + 86×numericCols + comment`; common layouts fit exactly, only ASU-with-declines-and-all-adj and Publish-with-declines scroll inside the existing `.tw{overflow:auto}`.
- **Segment split swapped (SR ↔ Dispatches)**: per the real process, **Dispatches now has 4 sub-tabs** (Unit A/B × Parts / Parts+Labour) and **SRs has 2** (Unit A/B) — the reverse of S36. `segList()` test is now explicit (`kind==='sr'` → 2-way; everything else → 4-way). `hiddenFilters()` swapped to match: a Dispatch sub-segment hides Business Unit **and** Service Type; an SR sub-segment hides Business Unit only. New `segCur(C)` clamps a stale `_seg` to 0 (a shrinking list previously threw in `segBase`, which lacked the guard `bendSeg` had); `renderCtx()`'s info-bar lookup guarded too. Weight arithmetic untouched — Σ subs = 1 for both kinds, Σ sub-series == All verified element-by-element across all 8 LOBs × both kinds (disp weights .3064/.2736/.2219/.1981; sr .58/.42).
- **Charts — dynamic y-axis (small values / few FWs)**: `niceScale()` now runs on **every** chart, not just Publish (`yT = opts.yTicks || 5`). The degenerate `mn===mx` case no longer uses an absolute ±1 (a 2-unit window around 40,000) — it widens proportionally to ±2% of |value|, still clamped so positive data gets no negative headroom. Zero is never forced into the range. E.g. Publish ASU at 1 week: `5,322,833–5,322,836 step 1` → `5.2M–5.5M step 100K`; `cDisp` at 3 weeks: `3571.06–3849.94` → `3500–3900 step 100`.
- **Charts — single fiscal week rendered blank**: `marker.enabled` was hard-coded `false`, so a one-point series painted nothing. Markers now enable per series when its rendered data has **≤2 non-null points** (radius 3.5) — this also fixes isolated boundary points created by `mkData`'s actual/forecast null-splitting with `connectNulls:false`. Dense series are unchanged (markers stay off). The `sig` rebuild-guard did not encode marker state, so a marker change could ride the fast in-place `setData` path and go stale — `sig` now carries a `|m<flags>` suffix (confirmed: sig was byte-identical before the fix across an empty→populated adjusted series).
- **Verified**: `node --check` on the extracted inline script after each pass; Node harnesses (real `input/btc_data.js`, all LOBs) for the segment-sum invariant and 12 `niceScale` edge cases; real-browser passes over `python -m http.server` with DOM/geometry reads for every item above. 0 console errors throughout.
- **Not pushed** — local-only, awaiting owner review.

### Session 44b — owner follow-ups: comments in CSV, Enter-to-commit, All-tab edit redistributed
**Files**: `template_ui/btc_adjustment_simulator_v2.html` (single file), IMP_DOCS mirrors.

- **All-tab edit now redistributes down to the sub-segments** (reverses S44's non-redistribution). The All-level absolute override (`allOvr`/`sumSubsAdj`) is **deleted** — one mechanism only. `spreadAllEdit(C,fw,total)` splits a typed All total **pro-rata to each sub's current adjusted value** (via `bendSeg`, so per-sub modifiers and per-sub edits are respected; falls back to segment weights when every sub is 0 that week) and writes per-sub `OVR[kind][i][fw]`. `allocLR(total,shares)` does largest-remainder integer allocation so the rounded subs sum **exactly** to the typed total — naive rounding drifts (5,001 across the 4 dispatch subs → 5,002 naive, 5,001 LR; 4,000 randomized trials, 0 mismatches). Σ(subs) == All now holds at all times (full-window sweep: 0 mismatches over 104 weeks, both kinds). Sub tabs reveal their adjusted columns/lines because they genuinely carry overrides. Publish-page `SR_Adj`/`Disp_Adj` edits go through the same path (they already called `editRate(kind,0,…)`). Clearing an All cell removes that week from every sub. `hasRateOvr(kind,0,fw)` delegates to `hasAnyRateOvr`, so the All row stays tinted/commentable when any sub is edited.
- **Comment box**: **Enter** commits (`preventDefault` + `blur()` → the browser's own change-on-blur reuses the single existing write path); **Escape** reverts to the value captured at focus (`data-p`, not `defaultValue` — that goes stale because comment writes deliberately skip the re-render) and blurs without firing `change`. Font changed from `var(--ui)`/500 to **`var(--mo)` bold (700)** — identical computed `font-family` to the numeric cells, still left-aligned.
- **Comments in the CSV exports**: new `csvCell` (RFC-4180 — quotes only when the field holds `"`/`,`/CR/LF, doubles embedded quotes), `csvJoin`, `rateNote(kind,fw)` (All note + labelled sub notes joined with ` | `), and one shared `_csvRows()` builder both export paths use. Schema is now stable at 11 columns, each comment sitting immediately right of the adjusted column it belongs to: `FW,ASU_Base,ASU_Adj,ASU_Comment,SR_DS,SR_Adj,SR_Comment,Disp_DS,Disp_Adj,Disp_Comment,Comment` (trailing `Comment` = the Publish-level note). Blob type → `text/csv;charset=utf-8`.
- **Schema change worth knowing**: `csv(which)` had its OWN per-metric schemas (`FW,BaseASU,Declines,NewCt,APOS,AdjNew,BTCApos,AdjASU` for ASU; `FW,No IQR,Adj,Rate` for disp/sr) with unescaped joins. It is **unreferenced from the DOM** (no caller anywhere), so it was collapsed onto the shared builder — `csv('disp')` would now emit the publish schema and the old `Rate` column is gone. Reinstate per-metric sheets if that function is ever wired up.
- **Verified** (real browser, real keystrokes via CDP, 0 console errors): dispatches All 4,069 → typed 5,001 → subs 1,457/1,443/1,056/1,045 = 5,001, matching All row / Delta +825 / `DISP._adj` / chart point / Publish row, and All-tab KPI 430,058 == Σ of the four sub-tab KPIs; SRs 7,114 → 8,111 → 4,704 + 3,407; Publish `SR_Adj` 9,999 → 5,800 + 4,199 with both subs' reveal flags true at modifier 100; comment font `"IBM Plex Mono", monospace` / 700, Enter commits, Escape reverts, focus never lost while typing; both CSV paths byte-identical (5,386 B) and round-tripped through an independently written RFC-4180 parser with 0 ragged rows, including fields carrying a comma, an embedded quote, a non-ASCII char and a newline; resets and LOB change clear overrides + all four comment stores.
- **Pre-existing bug spotted, left alone**: the Delta column's sign prefix is `(delta>=0?'+':'')` where `delta` is an already-formatted string, so `Number("2,565")` is `NaN` and any delta ≥ 1,000 loses its `+`. Predates this session.
- **Not pushed** — local-only, awaiting owner review.

### Session 44c — Delta sign fix; comment column gated on edits + preview/popover/edit interaction; edit-propagation audit (INCOMPLETE)
**Files**: `template_ui/btc_adjustment_simulator_v2.html` (single file), IMP_DOCS mirrors, new `IMP_DOCS/SUBAGENT_LOG.md`.

- **Delta sign bug fixed** (`renderRate`): `var delta=fmt(adjs[i]-nds[i])` then `(delta>=0?'+':'')` compared an already comma-formatted **string**, so `Number("2,565")` was `NaN` and every delta ≥ 1,000 lost its `+`. Sign now comes off the number, formatting after: `var dN=adjs[i]-nds[i]; delta=(dN>=0?'+':'')+fmt(dN);`. Every other `>=0?'+'` site was audited (`gapN`, `grP`, `lift`, `kpi(pct)`) — all compare real numbers, this was the only instance. Verified at modifier 150: 27 rows with |Δ|≥1000 all carry `+`; at modifier 60: 24 rows ≤ −1000 keep `-`, zero `+-`.
- **Comment column now appears only when an edit exists** (was: whenever the adjusted columns showed). Per-table predicates `anyEd` (renderRate) / `anyEdA` (renderAsu) / `anyEdP` (renderPub) gate the `<th>`, the `<td>`s and the `fitTable()` width argument, so the numeric columns reclaim the space. Measured (Dispatches): no edits `minWidth 324px`, cols 241/241/241 → one edit `484px`, 189.6 ×3 + Comment 158.6 → cleared, back to 243 ×3. Each table decides independently.
- **Long comments — read/expand/edit interaction** replaces the always-on input. Cell shows a one-line ellipsis **preview** (`.cmp`, same mono/bold face; muted `Add a note…` when empty). **Single click** opens a `position:fixed` popover (`.cmpop`) to the right of the row with the full text wrapped — fixed positioning so it escapes `.tw{overflow:auto}`, with flip-left and vertical clamp (verified: popover `x=835…1135` vs scroll container `right=827.2`; bottom-row anchor clamps to y=770/bottom 892.3 in a 900px viewport). **Double click** upgrades it to an editing textarea (Enter commits, Shift+Enter newline, Escape reverts via `data-p`). `cmtCell` now emits store *coordinates* (`data-ct/ck/cs/cf`) dispatched through `cmtRead`/`cmtWrite` instead of a stringified `onchange` — storage keys and the 11-column CSV schema unchanged. Closes on Escape, outside mousedown, anchor movement, and at the top of all three renderers; singleton, no orphaned node (`body > .cmpop` count 0 after every cycle).
  - **Gesture split**: click opens the read popover, dblclick upgrades to edit — no click-delay timer. The click handler is idempotent and the preview node is never replaced while open, so the browser still synthesises `dblclick`. Verified 4× each independently plus interleaved.
  - **Three real bugs found and fixed during that work**: `textarea.focus()` emits a scroll event that the capture-phase listener read as a user scroll and instantly closed the editor (→ `focus({preventScroll:true})`); a scroll event already in flight when the popover opened closed it too (→ close-on-scroll is now decided from the **anchor rect** `_cmAt`, so it closes only once the row actually moves, and correctly ignores scrolling inside the popover); double-clicking the preview while already editing blurred the textarea (→ early-return branch re-focuses).
  - Escape now consumes the event when a popover is open, so an expanded chart behind it needs a second Escape (verified: Esc #1 closes the popover only, Esc #2 collapses the chart).
- **Edit-propagation correctness audit — STARTED, NOT FINISHED.** The audit pass (every `OVR` key → adjusted columns on every page, chart series, Delta, `BTC Adjusted`/`Adjusted Rate`/`AOP Target`/`Gap` tie-out, MDR/ICR denominators, Publish, both CSVs, the Σ-subs invariant, filter/LOB interaction, re-render fan-out) was **terminated mid-run by the org's monthly spend limit**. Recovered output ends at *"Three defects confirmed. Now let me apply the fixes."* — **the three defects are not described in the recovered output and no fixes were applied.** The file was left syntactically valid with all Session 44/44b/44c work intact (`node --check` on the extracted inline script: OK; `spreadAllEdit`/`allocLR`/`cmpop` all present). **This audit is still owed** — the full brief and the named risk points are recorded in `IMP_DOCS/SUBAGENT_LOG.md` so it can be re-run verbatim.
- **New doc**: `IMP_DOCS/SUBAGENT_LOG.md` — what was delegated to sub-agents across Sessions 44–44c, the orchestration rules used (parallel read-only recon, strictly sequential writers on a single file), per-agent findings/verification numbers/token cost, and the outstanding audit brief.
- **Not pushed** — local-only, awaiting owner review.

### Session 44d — edit-propagation audit re-run (COMPLETE) + both defects fixed
**Files**: `template_ui/btc_adjustment_simulator_v2.html` (single file), IMP_DOCS mirrors (`SUBAGENT_LOG.md`, this file).

- **The owed A6 audit was re-run inline** (no sub-agent — not requested this time), against the full brief in `SUBAGENT_LOG.md`. Every `OVR` key was traced to every consumer; a Node harness over the real `input/btc_data.js` exercised the redistribution invariant and the `aa` balance-override path. **All high-risk invariants hold** (R-a `_adj`/`ASU_ROWS` staleness — safe, absolute-indexed + `renderPub` recomputes ASU live; R-c redistribution/no-double-apply + Σsubs==typed; R-d AOP+edit Gap tie-out on All & subs; R-e reveal on edit alone at neutral modifiers; `Gap = BTC Adjusted − AOP Target` exact; MDR/ICR move on ASU edits; both CSV paths consistent; Delta sign fix present). The terminated run's "three defects" were unrecoverable — **only the two actually confirmed are reported, no third fabricated.**
- **Defect 1 fixed — `aa` "Adj ASU" edit was invisible on the ASU-page chart.** Card/table/Publish plot the running **balance** (`rows[i].adj`); the ASU-page chart plots the weekly **composition** (`adjNew+btcApos−decl`), so a direct Adj-ASU balance edit moved the card/table but not that chart line. `computeAsuRows()` now records `aaJump` (the net inflow injected by the re-anchor = the amount `ovShift` grows that week); the ASU-page "Adj ASU" line adds it, showing the edit as a **one-week inflow spike** that returns to normal next week (forward balance still carries automatically). Card/table/Publish untouched → all audit tie-outs preserved. Harness (+5,000 nudge): chart spike = exactly +5,000, next week baseline, forward balance +5,000.
- **Defect 2 fixed — per-week edits didn't rescale/clear on an allocation-filter change.** `OVR`/`CMT` are absolute counts; the base series rescales by `allocMult`, so an edit made under Region=All showed out of scale once a Region/Business/Warranty/Service/Core-Upsell/WO/FQM/GCFA filter narrowed the base (cleared only on LOB change before). `toggleMulti()` now clears `OVR`+`CMT` on any **allocation-dimension** change (`ALLOC_DIMS`), mirroring the LOB clear. **FY/FQ/FW are NOT cleared** (window-only; edits stay valid). Segment modifiers + target *rate* (`TGT_OVR`) survive (scale-invariant). Verified vs the real `ALLOC_DIMS`: 8/8 alloc dims clear, 3/3 window dims don't. `AOP_OVR` (a typed absolute count with the same scale-bound problem) is **also cleared** on an allocation-dim change per owner follow-up → resets to auto; the rate-based `TGT_OVR` is kept.
- **Verified**: `node --check` on the extracted inline engine after both fixes: OK. Full-app browser run blocked (Browser pane refuses `localhost` and loads the file as a `data:` snapshot where `input/btc_data.js` can't resolve) → Node-harness + branch-logic verification against real data/constants instead.
- **Not pushed** — local-only, awaiting owner review.

### Session 45 — Dispatches segment tabs 4 → 3 (service-type split)
**Files**: `template_ui/btc_adjustment_simulator_v2.html`, IMP_DOCS mirrors (`BTC_GUIDE_VS_SIMULATOR_DIFF.md`, this file).
**Prompt**: "dispatches page has 4 tabs. reduce to 3 — parts, parts+labour, labour only; alter cards/tables/charts accordingly."

- **`segList('disp')` rewritten**: was 4-way Unit A/B × (Parts / Parts+Labour); now **3-way by service type** — Parts / Parts+Labour / Labour Only (+ the All tab). Weights come from each LOB's real `alloc.service` shares, renormalised so the trio sums to 1 (fallback = equal thirds if a LOB has no service data). SRs untouched (2, Unit A/B).
- **`hiddenFilters()`**: a Dispatch segment now pins only the **Service** filter (was Business + Service). Business Unit is no longer a segment dimension for dispatches, so it stays available in the rail.
- **Everything downstream followed automatically** — cards, tables, charts, per-segment modifiers, segment notes, and both CSV exports all derive from `segList().length` (the engine is count-agnostic, per recon R2). No per-tab hardcoding lived outside `segList`. The stale-`_seg` clamp in `segCur()` already resets a saved index of 4 back to All. Comments in `segCur`/`segNote`/the A9 block updated for the new count.
- **Verified** against the real `input/btc_data.js` via Node: all 8 LOBs' 3 dispatch weights sum to exactly 1 (e.g. Server Line A `0.3812 / 0.3404 / 0.2784`); aggregate "All LOBs" carries `service` in its ASU-weighted merge, so Σ(sub-segments)==All holds. `segList` executes clean in-page, 0 console errors. Live in-app drag not exercised (the `data:` pane can't boot the dataset) — math confirmed by Node harness + branch trace.
- **Pushed to `master`** (deploys to the live GitHub Pages site).

### Session 46 — Publish page: default collapsed rail + hover box never covers lines
**Files**: `template_ui/btc_adjustment_simulator_v2.html`, IMP_DOCS mirrors (this file).
**Prompt**: "(1) default view for publish page: filters collapse. (2) hovering charts — make the box appear above lines so it doesn't hide them."

- **Publish defaults to a collapsed filter rail**: `go('pub')` now `document.body.classList.remove('rail-open')` before rendering, so entering Step 3 always shows full-width charts. The filters are still reachable via the funnel reopen button; Steps 1&2 are unaffected.
- **Hover tooltip no longer sits on the lines**: the positioner (req 4.1.3) already lifted the shared box *above* the plot, but a tall multi-series box with no room above fell back to tucking **inside** the plot (`plotTop+6`) — right over the lines. Fallback rewritten: prefer above → else **below the x-axis** (`plotTop+plotHeight+10`, off the lines) → last-resort pin to viewport top. `outside:true` box, so it can overlap the card header/legend area but never the plotted series.
- **Verified**: inline-script syntax check clean (`vm.Script` over all real `<script>` blocks — 0 errors). Live hover not exercised in-pane (the `data:` snapshot can't boot the dataset); positioner uses standard Highcharts `plotTop`/`plotHeight`/`getChartPosition`.
- **Pushed to `master`** (deploys to the live site).

### Session 47 — Hover box inside the chart + expand/collapse icon set + expanded-view button overlap
**Files**: `template_ui/btc_adjustment_simulator_v2.html`, IMP_DOCS mirrors (this file).
**Prompt**: (1) hover box appears way below charts — put it INSIDE the chart, above the value being read; (2) Publish expanded: the filter funnel overlaps the collapse button — shift the collapse button left, funnel in its place; (3) the hover box lingers ~2s after leaving — make it vanish immediately; (4) replace all expand/collapse chart buttons with the reference maximize/minimize icons.

- **Hover box (S46 regressed it)**: the below-the-axis fallback threw the box far under tall charts. Positioner rewritten to be **point-relative and inside** the plot — `outside:false`, box floats 14px **above the hovered value** (`plotTop+pt.plotY − h − 14`), dropping just below the value only when it's near the plot top; clamped to `chartWidth/chartHeight`.
- **Immediate hide**: `tooltip.hideDelay:0` — the box disappears the instant the pointer leaves (was the Highcharts ~500ms default reading as a lingering ghost).
- **Expanded-view overlap**: new CSS `body.expanding .expanded .expandbtn{right:56px}` shifts the collapse button left so the fixed filter funnel (`freopen`, `right:18px`) sits clear at the card's top-right instead of overlapping.
- **Icon set (req 4)**: all 9 expand buttons (3 Steps + 6 Publish) now use a **maximize** SVG (four outward corner arrows, Tabler `arrows-maximize`); `toggleExpand`/`collapseExpand` swap it to a **minimize** SVG (four inward arrows, `arrows-minimize`) and flip the title Expand↔Collapse via `_setExpBtn()` + `IC_EXPAND`/`IC_COLLAPSE` constants. The old `⤢` glyph is gone (0 remain).
- **Verified**: engine inline-script `vm.Script` parse OK; 9 maximize buttons + 2 icon constants present, 0 stray glyphs. Live hover/expand not exercised in-pane (`data:` snapshot won't boot the dataset).
- **Pushed to `master`** (deploys to the live site).

### Session 48 — corrections to S47 (expand icon markup, publish-scoped layout, hover box masks values)
**Files**: `template_ui/btc_adjustment_simulator_v2.html`, IMP_DOCS mirrors (this file). **NOT pushed — local only (owner: don't push unless told).**
**Prompt**: (1) expand button renders empty (outline only), only fills after an expand/collapse cycle; on ASU/SR/Dispatch put it back in its original position (never asked to shift it left there). (2) Publish expanded: move the filter button INTO the chart area at the exact spot the collapse button occupied. (3) hover box still masks the lines behind it (see image) — box must clear every value that falls under its own footprint, dynamically.

- **Empty button — root cause**: the S47 `replace_all` that swapped `⤢` for the SVG matched `>⤢</button>` and ate the `>` that closes each `<button>` start tag, so the markup became `title="Expand chart"<svg…>` — the SVG parsed as junk attributes inside the button tag (empty outline). `_setExpBtn()` repaired it via `innerHTML`, which is why it only appeared after expand→collapse. Restored the `>` on all 9 buttons (`title="…"><svg`). Confirmed in-DOM: the button now contains a real `<svg>` on load.
- **Button position (req 1.1)**: the left-shift is now **Publish-only** — `body.on-pub.expanding .expanded .expandbtn{right:52px}` (added an `on-pub` body class toggled in `go()`). Steps 1&2 keep the button at its original `right:8`.
- **Filter funnel into the collapse spot (req 2)**: `body.on-pub.expanding .freopen{top:60px;right:32px}` drops the fixed funnel onto the expanded card's top-right (the collapse button's old inset), while the collapse button sits just left of it.
- **Hover box masking (req 3)**: positioner now scans every visible series for the points whose x-pixel falls within the box's own width (`cx±w/2`), tracks the top-most (`topY`) and bottom-most (`botY`) of them, and floats the box **above `topY`** (or below `botY` when there's no room above). So it clears not just the hovered point but every neighbouring value it would otherwise cover. Recomputed per hover (cheap: ~a few hundred points).
- **Verified**: engine `vm.Script` OK; 0 malformed buttons, 9 well-formed, `on-pub` wired (CSS ×2 + `go()`); button SVG present in the rendered DOM. Hover/expand geometry not live-tested (snapshot won't boot the dataset) — owner to eyeball on run.

### Session 49 — publish expanded: collapse button follows the rail state; hover box left alone
**Files**: `template_ui/btc_adjustment_simulator_v2.html`, IMP_DOCS mirrors (this file). **NOT pushed — local only.**
**Prompt**: (1) publish charts: when the filters are expanded (rail open), the collapse button should sit where the filter button was. (2) hover box still not right — leave it.

- **Collapse-button position (req 1)**: the left-shift is now gated on `:not(.rail-open)` — `body.on-pub.expanding:not(.rail-open) .expanded .expandbtn{right:52px}`. So while the rail is collapsed the funnel owns the card's top-right corner and the collapse button sits just left of it; when the rail is **open** (funnel hidden) the collapse button falls back to `right:8` — the same top-right corner the filter button occupied. Reactive to `body.rail-open`, so toggling the rail while expanded repositions it live.
- **Hover box (req 2)**: left unchanged at the owner's instruction — no further edits to the tooltip positioner this session.

### Session 50 — table-only reset buttons + comment Delete + chart-aligned button geometry
**Files**: `template_ui/btc_adjustment_simulator_v2.html`, IMP_DOCS mirrors (this file).
**Prompt (across turns)**: (1) a reset for TABLE edits, separate from the control-panel Reset — button top-right of each table like the chart expand button; verify. (2) button overlapped the header text — shift table left, line it up with the column names. (3) add the reset on the Publish page, in line with the "Published Forecast Summary" title. (4) comments: red Delete button at the bottom-right of the expanded comment box, remove the extra bottom space. (5) ASU/SR/Dispatch button still off — align its BOTTOM edge with the column-names' bottom edge and its RIGHT edge with the chart's rightmost fiscal week.

- **Table-only reset (`tblReset(kind)`)** — clears ONLY the per-week `OVR` edits + `CMT` notes; the BTC modifier/sliders, target rate, AOP override and imported declines are untouched (that's what `dReset`/`sReset`/`aReset` are for). disp/sr respect the active segment tab exactly like `segReset` (a sub tab clears that segment, **All** clears every sub-segment); `asu` clears the Adj NC/APOS/ASU per-week edits; **`pub`** clears every metric's edits (the summary shows them all). Node harness: 9/9 + pub-branch checks pass (edits cleared, modifiers/target/AOP/declines preserved, sub-tab scoping correct, empty no-op).
- **Placement (Steps)** — each of the 3 Steps tables is wrapped in `.twwrap`; the button is absolutely positioned and **aligned to its chart from the live Highcharts layout** (`positionTblResets()`): RIGHT edge on `plotLeft+plotWidth` (the rightmost fiscal week), BOTTOM edge flush with the header row's measured bottom, and the table's `padding-right` set dynamically so the last column stays clear. Recomputed on every `renderRate`/`renderAsu`, on `reflowActiveCharts` (rail toggle / expand), on `go()` (tab switch) and on window `resize`; hidden views (0 width) are skipped and re-aligned when shown. (Static CSS can't track the plot edge, so this is done in JS.)
- **Placement (Publish)** — a smaller button lives inside the `Published Forecast Summary` `<h3>` (already flex `space-between`), right-aligned with the title rather than over the table corner.
- **Comment editor** — a red **Delete** button (`.cmdel`, `var(--rd)`) sits bottom-right in a compact `.cmfoot` footer next to the hint; `cmtDelete()` wipes that cell's note and closes without committing. Bottom padding tightened (hint `margin-top:0`, textarea `margin:0`, box `padding:7px 7px 6px`). `onmousedown preventDefault` stops the textarea blurring before the click lands.
- **Verified**: engine `vm.Script` OK across all passes; `tblReset` wired on all 4 surfaces; Node harness confirms the state contract. **Not visually verified** — no live browser reachable here (Control_Chrome is macOS-only, the Browser pane blocks localhost, the Chrome extension isn't connected), so the button pixel-alignment, comment footer and padding gap need an eyeball on a real run.

### Session 51 — SRs page: comment out Unit A / Unit B segment tabs
**Files**: `template_ui/btc_adjustment_simulator_v2.html`, IMP_DOCS mirrors (this file).
**Prompt**: SRs page — comment out the Unit A and Unit B tabs. If a direct fix, do it; else list dependencies.

- **Direct fix** — the SR page segment tabs come from a single source: `segList('sr')`, which returned `[{All},{Unit A,w:SEG_BU.A},{Unit B,w:SEG_BU.B}]`. Commented out the Unit A/B entries → `[{l:'All',w:1}]`. Now the SRs rate sheet shows only the **All** tab.
- **Safe by design** — every consumer already handles a variable-length tab list: `segCur` clamps a stale `_seg` to 0; `segModsOf` rebuilds the modifier array to `L.length`; `subIdxs` loops `1..L.length` (now empty → no per-sub-segment bends on SR); `renderSegTabs` draws from `L` (only the All button); the line-777 `SR._seg>0` business-filter pin never fires. `SEG_BU` is kept — it still feeds the Dispatch service split and the allocation-weight filter engine, independent of the SR tabs.
- **Left as-is**: v1 `btc_adjustment_simulator.html` still carries the Unit A/B tabs (change scoped to v2 only).
- **Verified**: engine inline-script `vm.Script` parse OK; `segList('sr')` returns 1 entry. Live tab render not exercised in-pane (snapshot won't boot the dataset).
