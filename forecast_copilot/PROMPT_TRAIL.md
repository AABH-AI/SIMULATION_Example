# Prompt Trail — ISG BPA
> Chronological log of every major request and what was built/fixed. Update after each session.
> Last updated: 2026-07-20 (Session 27)

> **NOTE — this is a folder-local copy inside `forecast_copilot/`.** It adds the Session 27 entry for the
> shared-engine refactor. The canonical `../IMP_DOCS/PROMPT_TRAIL.md` is intentionally left unchanged.

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
- LOB values in raw table colour-coded by group colour (ISG=blue, ESG=green, HES=purple)
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
- LOB column colour-coded (ISG blue, ESG green, HES purple)

---

## Session 23 — ISG BPA redesign (`IBP_Forcasting_v2.html` -> `ISG BPA — Business Planning and Analytics.html`) and `index.html` light theme
**Date**: 2026-06-25
**Files**: `ISG BPA — Business Planning and Analytics.html` (new, renamed from `IBP_Forcasting_v2.html`), `index.html`, `landing_v2.html`, `IMP_DOCS/`

**Prompts**:
- Build a new, professional-looking dashboard referencing `IBP_Forcasting.html` — first attempt was too close to a template; iterated twice on user feedback ("bruh, did you actually check... there are only 5 tabs" / "TO BE CLEAR SHOULD NOT LOOK GENERIC")
- Fix filter logic to match `IBP_Forcasting.html` exactly; focus further passes on UI polish only
- Keep KPI data realistic — "not too much not too low... explain it as a future product"
- Update `index.html` to light theme and link the new file
- Read `IMP_DOCS/` and rename the new UI to follow the em-dash naming convention used by `forecast_copilot/` (clarified via AskUserQuestion: adopt the naming *style* only, keep ISG BPA content — do not merge with the separate Forecast Copilot product)

**What was built** (`IBP_Forcasting.html` redesign, 3 iterations):
- Home page: dark near-black hero (`#0c1526` nav), 5 module tiles matching `IBP_Forcasting.html`'s exact copy and tile count (first draft wrongly added a 6th tile and generic gradient hero — corrected)
- Teal accent design system (`--accent: #0d9488`) replacing the original's blue, applied consistently across KPI cards, chart palettes, channel tabs, and the left nav active state
- **Actuals Profiling expanded from 4 to 6 channel tabs** — added Field Services and Care, wiring up `TREND_DATA_52` keys (`dp-fld-dis/fct`, `care-cf/apos/sr/dsp-fct/act`, `dp-care-amer/emea/apj`) that existed in the original file's data layer but were never rendered as tabs or charts
- KPI cards redesigned as shadow-only (no colored border/icon) — the 36→40px monospace number is the entire visual weight of the card
- Two-section module tiles: colored metric-area strip (icon + big number) + white body (name/desc/footer)
- All filter-aware chart update functions (`updFA_Region`, `updDP_QoQ`, `updCare`, etc.) ported 1:1 from `IBP_Forcasting.html`'s `applyAllFilteredCharts()` pattern, extended for the 2 new channels
- Fixed a real bug found during this work: `FA_PARTNER_BASE` was referenced by `updFA_Partner()` but never defined — would have thrown a ReferenceError the first time a region filter was applied while viewing the Partner chart

**Root cause of iteration 1 & 2 failures**: didn't actually read `IBP_Forcasting.html`'s real home-page HTML/copy before building — assumed structure instead of verifying it, producing a 6-tile generic-looking page when the source has exactly 5 tiles with specific copy.
**Fix**: full agent-driven audit of every module/page/chart/KPI in `IBP_Forcasting.html` before the second rebuild; exact copy match on the 5 tiles.

**Data realism pass**: every static KPI value and every JS chart-data constant (`FA_REGION_BASE`, `DP_OVERALL_REGION_BASE`, `AP_DSP_TREND_BASE`, `AP_SR_TREND_BASE`, `T52` weekly trends) rescaled to derive consistently from 3 annual anchors: **1.47M ASU / 5.87L SR / 2.34L Dispatch** — weekly = annual÷52, monthly = annual÷12, so every KPI across every page tells the same underlying story.

**`index.html` changes**:
- Converted from dark theme (`#07090f` bg) to light theme (`#f1f4fa` bg, `#ffffff` cards) matching the new dashboard's tokens
- Added a teal accent bar to the header (was a dark radial-gradient)
- Added the new dashboard as a Primary Tool card

**Rename (this session, final step)**:
- `IBP_Forcasting_v2.html` → `ISG BPA — Business Planning and Analytics.html`, matching the file's own `<title>` tag and adopting BTC_Lovable's "Title — Suffix" em-dash convention — but staying pure ISG BPA content, no Forecast Copilot branding (those are documented in HANDOFF.md as two separate products)
- Updated all 6 references in `index.html` (href, card-file label, `PRIMARY` set, `LABELS` map, sort-priority checks) and all 5 references in `landing_v2.html` (a parallel fork of `index.html` created by another session) — found via repo-wide grep before editing, to avoid missing a reference
- `manifest.json` not hand-edited — it's auto-regenerated by the `update-manifest` GitHub Action on push

**Git note**: pushes for this session went through the main checkout path directly (`D:\...\simulations`) rather than the worktree, because a prior push had cached the wrong GitHub account (`Arnav1771` instead of `AABH-AI`) in Windows Credential Manager — cleared via `cmdkey /delete`, re-authenticated as `AABH-AI`.



---

## Session 24 — Forecast Copilot: cross-page shared state + real business logic (all 6 pages rebuilt)
**Date**: 2026-06-25
**Files**: all 6 `forecast_copilot/*.html` pages (Dashboard, ASU Simulation, Historical Performance, AI BTC Advisor, BTC Distribution, Final Forecast), `IMP_DOCS/`

**Prompts**:
- "now if i change filter in one workspace it should be reflected in all workspaces" — plus a full pasted product spec ("AI-Powered Forecast Planning & Bend the Curve (BTC)") to check sliders and functionality against, and "keep the IMP_DOCS in check"

**Audit before any changes** (3 parallel agents): confirmed `forecast_copilot/` exists only in this worktree (never in the main checkout, untracked by git either way), and found every one of the 6 pages' filter dropdowns was purely cosmetic — clicking an option only changed the button's displayed text and a `.selected` CSS class, with zero effect on any chart, KPI, or table anywhere. No `localStorage`/`sessionStorage`/`postMessage`/`BroadcastChannel` existed at all — no cross-page state of any kind. The only working interactivity was two slider pairs (ASU Simulation's NC/APOS overrides, AI BTC Advisor's 6 driver sliders), and even those only drove a crude single combined multiplier rather than the distinct formula each page's own subtitle described.

**Clarifying question asked before implementing**: whether "BTC%" should be a small bend/uplift percentage (matching the already-built Historical BTC Trend chart's 3-8% scale) or a large 90%+ achievement percentage (matching the spec's own example numbers, which used values like "97%"). User confirmed: small bend/uplift %. Implementing the spec's literal example would have contradicted 4 already-built pages that consistently used the smaller scale.

**What was built**:
- A single shared JS engine block, embedded identically (copy-pasted, unchanged) into all 6 files per the repo's existing "fully self-contained, no shared CSS/JS" convention for this product:
  - `fcState` — persisted to `localStorage` under `fc_state_v1`: filters (quarter/week/region/lob/business/service), `ncOverride`/`aposOverride`, `simMode`, `btcStrategy`/`manualBTC`, `distMode`, `approvals`. Loaded on every page load (`fcLoadState()`), saved on every change (`fcSaveState()`) — this is what makes a filter or selection made on one page appear already-selected when any other page loads next.
  - `fcGenerateWeeklySeries()` / `fcGenerateHistory()` — seeded dummy-data generator (same `seeded(s)` PRNG pattern as `data.html`), keyed by a hash of the active filter combo so the same combo always produces the same numbers and different combos produce different, realistically-scaled ones. Generates 13 fiscal weeks of New Contracts/APOS/ASU/SR/Dispatch per the selected quarter, and 12 historical quarters of BTC/Forecast Accuracy/AOP/Modernization achievement.
  - Real ASU Conversion formula: `ASU[w] = ASU[w-1] - Expirations[w] + APOS Renewals[w] + New Contracts[w]`, with Expirations (weekly churn) and Renewals modeled as distinct variables — the original page's subtitle stated this formula but the actual code just multiplied everything by one shared scalar.
  - `fcRecommendBTC()` — real 3-strategy BTC Recommendation Engine: Historical Best Fit (recency-weighted average of 12 historical quarters), Closest to AOP (derived from the accuracy-shortfall-driven target gap), Balanced (their midpoint) — 3 genuinely distinct numbers every time, not the previous single weighted-sum formula duplicated into 3 static table rows.
  - `fcDistributeWeekly()` — Automatic Weekly Distribution across the 13 selected fiscal weeks, with Equal/Historical/AI Recommended modes producing genuinely different per-week shapes while always summing to the same total uplift.
  - `fcRecommendOverrides()` — Recommendation Mode for ASU Simulation: analyzes 12-quarter average Forecast Accuracy and suggests NC/APOS overrides, with Accept/Modify/Reject actions.
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

## Session 27 — Forecast Copilot: shared engine extracted to `fc_engine.js`, `ALL`→`All`, folder-local docs
**Date**: 2026-07-20
**Files**: all 6 `forecast_copilot/*.html`, new `forecast_copilot/fc_engine.js`, new folder-local `forecast_copilot/README.md` · `HANDOFF.md` · `PROMPT_TRAIL.md`
**Prompts**:
- "create the new .js file" (extract the duplicated engine) · "change to All" · Highcharts confirmed non-commercial/research use
- "update the docs ... with a copy inside forecast_copilot folder, leave older docs as is"

**What was done**:
- **Verified the engine block was byte-identical across all 6 pages** (same MD5) before extracting — otherwise a per-file difference would have been silently dropped.
- Extracted the shared engine (`fc_engine v1`, ~420 lines) into **`forecast_copilot/fc_engine.js`** (single source of truth). Each page now loads `Highcharts (CDN, head) → <script src="fc_engine.js"> (bottom of body) → page-specific inline <script>`. Page-specific scripts were left untouched.
- **`ALL` → `All`** normalization done once in the engine file: `FILTER_OPTIONS` (region/lob/business/service) + `FC_REGION_FACTOR` / `FC_LOB_FACTOR` / `FC_BUSINESS_FACTOR` / `FC_SERVICE_FACTOR` keys — now consistent with the coreupsell/wotype/fqm/gcfa maps that already used `All`. All `ALL` references were confined to the engine block (grep-confirmed), so no page-specific code was affected.
- **Browser-verified all 6 pages**: engine loaded externally (`typeof fcCompute === 'function'`), content rendered, `All` live, **0 console errors**. Chart counts as expected (Dashboard 5 · ASU 3 · Historical 4 · Advisor 0 · Distribution 1 · Final 1).
- **Docs**: added folder-local `README.md` (full suite/architecture reference) and copies of `HANDOFF.md` + `PROMPT_TRAIL.md` inside `forecast_copilot/`, all updated for the refactor. **`../IMP_DOCS/` left untouched** per instruction (still describes the pre-refactor "identical block in all 6 files" state).

**Tooling note**: this machine (user harshit.nair) has **no Node.js** — the extraction was scripted in **Python 3.13** instead (the project docs assume Node from the original author's machine). No git in this checkout, so the 6 HTML files were backed up before the bulk edit. Runtime app has **zero Node dependency** (pure browser + Highcharts CDN), so it is unaffected either way.

**Not done without asking**: no `git add`/commit/push — changes are local-only, consistent with how this untracked-in-main product has been handled.

---

## Phase 1 — Local server + read path (`serve.py`, `test_dataset.py`)
**Date**: 2026-07-22 | **Branch**: `hn-new`
**Plan ref**: `BUILD_PLAN.md` → "Phase 1 — Server + read path"
**Files**: new `forecast_copilot/serve.py`, new `forecast_copilot/test_dataset.py`, `forecast_copilot/.gitignore` (ignore `__pycache__/`), docs

**What was built**:
- **`serve.py`** — a **zero-dependency** local server (Python stdlib only). Two jobs:
  1. Serves the static suite from `forecast_copilot/` (so pages load over `http://`, which the Phase 2 adapter needs); `/` 302-redirects to the Dashboard page.
  2. Read API over the immutable input workbook:
     - `GET /api/health` — liveness + `source`/`sheet`/`sha256`/`rowCount`.
     - `GET /api/dataset` — the **Service Dataset** sheet parsed to cached JSON: `columns` (13, keyed + typed), `rowCount`, `rows` (faithful records, ASU/Expirations/FQM as numbers), and a `summary` (numeric `totals` + `distinct` categorical values). `no-store` + CORS headers.
     - `GET /api/outputs` and `POST /api/publish` — honest **501** stubs (write path is Phase 5).
- **Parsing decision**: an `.xlsx` is a zip of XML, and this is a small fixed-format demo sheet, so the workbook is parsed with `zipfile` + `xml.etree` — **no openpyxl/pandas** (neither was installed here anyway; adding them would break the offline/static posture). Resolves the target sheet by *name* via `workbook.xml` + rels (robust to sheet reordering) and maps columns by *header label* (robust to column reordering). Values kept **verbatim** — no `Poweredge→PowerEdge`-style normalization (Phase 2 derives filter options from the data's own distinct values, which removes that reconciliation problem at the root).
- **Input immutability**: the server only ever *reads* the workbook; every `health`/`dataset` response echoes its `sha256`, which the test pins to the committed `input/INPUT_SHA256.txt`.
- **`test_dataset.py`** (stdlib `unittest`, 8 tests): asserts `load_dataset()` reproduces a **hand-checked pivot** of 12 slice aggregates (grand + by-FY + by-Region + 2-/3-dim slices), plus row count (2964), the 13-column schema, distinct values, the sha256 pin, and two structural checks (Region slices and FY slices each partition the grand total).

**How the pivot was ground-truthed**: computed with a **separate regex/streaming parse** of the `.xlsx` — a genuinely different code path from `serve.py`'s ElementTree parser — then cross-checked for internal consistency (regions sum to grand ΣASU 8,126,618,028; FYs likewise; counts reconcile to 2964). So the test cross-validates the parser rather than checking it against itself.

**Verified**: `python -m unittest -v` → 8/8 pass. Booted the server and confirmed `GET /api/health` (200, correct sha256), `GET /api/dataset` (200, ~915 KB, 2964 rows, faithful first/last rows, correct headers), static HTML + `fc_engine.js` serve 200, the two 501 stubs, and a 404 on an unknown `/api/*` route.

**Gotcha recorded**: this machine's console is cp1252 — a `Σ` in the startup banner crashed the process on print (JSON output was always UTF-8 and fine); banner switched to ASCII. Unrelated localhost noise in the log (`Dell Peripheral Manager` probing `/`) is harmless and just exercises the `/`→Dashboard redirect.

---

## Phase 2 — Engine data adapter: real-data dashboard (`fc_engine.js`)
**Date**: 2026-07-22 | **Branch**: `hn-new`
**Plan ref**: `BUILD_PLAN.md` → "Phase 2 — Engine data adapter" *(milestone: real-data dashboard)*
**Files**: `forecast_copilot/fc_engine.js`, docs

**What was built** — a data provider in the shared engine with two modes, decided once at load and shown by a fixed **Live/Simulated badge** (bottom-left):
- **Live** (serve.py running): real workbook via `GET /api/dataset`.
- **Simulated** (no server / `file://`): the original seeded engine, unchanged, as fallback.

**Load ordering solved without touching any page**: `fcInitData()` does a **synchronous** `GET /api/dataset` at engine load. Because the engine `<script>` runs before each page's inline render script, real data is ready before the first `fcCompute()` — no per-page async wiring. Any failure (no server, `file://`, non-2xx) is caught → stays Simulated. Badge click reloads to re-check.

**Filter options derived from the data's distinct values** (live) — kills the `AMERICAS`/`Americas`, `PowerEdge`/`Poweredge` reconciliation at the root. Mapping engine key → real column: `region→region`, `lob→product` (relabelled **Product**), `business→warrantyType` (relabelled **Warranty Type** — the sheet has no ESG/ISG/HES column, so this dead control is repurposed to a real, useful one), `service→serviceType`, `coreupsell→coreUpsell`, `wotype→woType`, `fqm→fqmFlag`, `gcfa→gcfaType`, `quarter→fiscalQuarter` (12 real quarters, no All), `week→fiscalWeek`. A stored/seeded filter value not present in the real options is snapped to `All` (`fcRepairLiveFilters`) so the default slice is populated.

**Pipeline anchoring** (live): `fcGenerateWeeklySeries` builds the slice from real weekly **ASU + Warranty Expirations** for the selected quarter, aggregated into the quarter's 13 canonical weeks. ASU is a stock → last observed value **carried forward** into weeks with no matching rows (narrow slices are sparse); Expirations is a flow → 0 when absent. **SR/Dispatch derived** by ratio (SR = ASU × 0.185; Dispatch = SR × per-serviceType ratio). **NC/APOS stay modeled levers**, scaled to the slice's real ASU level and applied as the modeled lift *relative to* the default slider position — so at default sliders the scenario equals the real baseline (ratio = 1) and sliders move it proportionally. Historical BTC/accuracy/AOP remain modeled overlays. The seeded branch is byte-for-byte the original behavior (kept as fallback).

**Design tension noted**: the seeded filter model doesn't cleanly map to the real sheet (no NC/APOS/SR/Dispatch/business columns; different casing/naming). Resolved by deriving options from the data, mapping/relabelling two filters, and keeping SR/Dispatch derived + NC/APOS as levers — exactly the split the plan's "data reality" section prescribes.

**Verification**:
- **Node `vm` smoke test** (stubbed DOM + XHR) in both modes: simulated reproduces the original seeded numbers; live derives real options, repairs state, and computes real slices. JS live aggregation **matches the Python parser exactly** (2025-Q1 All/All weekly ASU 47,344,042 … 50,109,496) and sparse-slice **carry-forward** confirmed (2026-Q1 Americas/Poweredge: 7 real weeks, gaps carried).
- **Real browser** (served by serve.py): all 6 pages load **live, 0 console errors**; badge "Live data"; Dashboard ASU 50.11M for the default slice; a filter change to EMEA×Poweredge recomputed to 38.29M (matches Python, carry-forward from W08); relabels + real options present.
- **Fallback** (plain `python -m http.server`, no `/api`): badge "Simulated data" (amber), seeded numbers, original labels, **0 console errors**. Screenshot confirms the badge is well-placed and non-overlapping.

**Note**: `let`/`const` engine globals aren't attached to `window`; introspect them as bare identifiers in the page realm (or via a `var` probe under Node `vm`).

---

## Phase 2b — Densify the modeled Service Dataset (Product × Region × week)
**Date**: 2026-07-22 | **Branch**: `hn-new`
**Prompt**: after Phase 2, user flagged that narrow (Product + Region) slices were sparse; decided to "rewrite the service dataset with products x region x 52 weeks x 3 fiscal years", then "explain option 1" and "proceed".
**Files**: new `forecast_copilot/densify_service_dataset.py`, `input/dell_isg,esg_fy24-26.xlsx` (rewritten sheet), new `input/dell_isg,esg_fy24-26.source.xlsx` (provenance), `input/INPUT_SHA256.txt`, `test_dataset.py`, docs

**Why**: the shipped Service Dataset was a *sample* — 2,964 rows = one row per (product, week), with Region and the other attributes set to a single rotating value. So a product appeared in only one region per week, and Product + Region drill-downs were sparse (~1/3 of weeks; e.g. Poweredge × Americas × 2026-Q1 = 7 of 13 weeks, filled by carry-forward). Structure confirmed first: distinct (week,product) == row count (2,964); each of 19 products has 156 rows (one per week); `2026-W01` had 19 rows, one per product, single region each.

**What was done**: densified to **8,892 rows** = 19 products × 3 regions × 156 weeks (one row per Product × Region × week). Each original (product, week) row is split into three region rows; ASU and Warranty Expirations are split across regions by that product's **own realised regional mix** (floored at 10% each, renormalised) using a **largest-remainder integer split** so the three parts sum EXACTLY to the original. Secondary attributes (Warranty Type, Core/Upsell, W/O Type, FQM Flag, GCFA Type, Service Type) are inherited unchanged.

**Total-preserving** (the key property): grand ASU stays exactly **8,126,618,028** and ΣExpirations exactly **46,961,720**; every per-product total is unchanged. Only regional detail fills in. ΣFQM = 3 × 2074 = 6,222 (flag inherited into each region row). Regional ASU totals shift slightly vs the original sample (largest-remainder split vs whole-row assignment) but still partition the grand total exactly — the test's structural partition checks confirm this automatically.

**Safety of the file rewrite**: verified the Service Dataset sheet has **no formulas** and `calcChain` references only sheetIds 1–4 (the four official/modeled sheets), never the Service Dataset (sheetId 5). So only `xl/worksheets/sheet1.xml` is rewritten (dimension + sheetData; string cells as **inline strings** to avoid touching the shared string table); a byte comparison confirms **every other part identical** — the real Dell 10-K sheets (FY26 Official, Product Estimates, Product x Quarter, Warranty Assumptions), styles, sharedStrings and calcChain are untouched. `densify_service_dataset.py` is **idempotent**: it preserves a pristine `*.source.xlsx` on first run and always regenerates from it. `INPUT_SHA256.txt` now pins both the working file (`e0645a76…`) and the source (`f3dc03a8…`).

**Verification**: generator's own asserts (totals preserved, row count, region set); independent inline-string regex parse recomputed the pivot ground truth for the new file; `test_dataset.py` updated to the dense pivot (row count 8,892; grand ASU/Expir unchanged; FQM ×3; region/product/multi-dim slices updated) → **8/8 pass**. Browser (served live): the Poweredge × Americas × 2026-Q1 ASU trend is now **13 distinct weekly points** (23.42M → 24.59M) matching Python exactly — no carry-forward — with 0 console errors.

**Runtime posture unchanged**: the server still only reads the input; densification is a deliberate one-time dev-time refinement of clearly-labelled modeled/dummy data, recorded here. Original sample recoverable from the `.source.xlsx` (and git history).
