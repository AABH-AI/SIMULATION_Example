# Prompt Trail — ISG BPA
> Chronological log of every major request and what was built/fixed. Update after each session.
> Last updated: 2026-07-31 (Session 41 — BTC Advisor: Service Type moved to a right-hand column, others shortened, gap fix)

> **NOTE — relocated to `forecast_copilot/IMP_DOCS_FC/` on 2026-07-27.** Full history is retained here
> (nothing trimmed): Sessions 1–23 are inherited **main-suite (TET BPA, formerly "ISG BPA")** dashboard
> history; the **Forecast Copilot product begins at Session 24** (see the divider below). The canonical
> `../../IMP_DOCS/PROMPT_TRAIL.md` is intentionally left unchanged.

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

<!-- ════════════════════════════════════════════════════════════════════════ -->
<!--  ▲  ABOVE: TET BPA main-suite history (Sessions 1–23) — inherited context   -->
<!--  ▼  BELOW: FORECAST COPILOT product — this folder's subject                 -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

> ## ▼ Forecast Copilot starts here (Session 24)
> **The shift:** Sessions 1–23 above are the main-suite (TET BPA) dashboard history this trail
> inherited when it was copied. Everything from **Session 24** onward is the **Forecast Copilot**
> product — the cross-page rebuild, light theme, the shared `fc_engine.js` engine, Phases 0–6
> (server + real data + scenarios + weekly editing + publish), and the filter-rail UI polish.
> These docs were relocated from `forecast_copilot/` into `forecast_copilot/IMP_DOCS_FC/` on
> 2026-07-27, keeping the full record above rather than trimming it.

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

**Follow-up — scale ASU to a believable magnitude**: user flagged that the ASU figures were unrealistically large (~50M whole-business single-week; ~8.1B summed over 156 weeks — "impossible") and asked to reduce by ~90% preserving distribution ratios. Clarified first that the app *displays* a point-in-time figure (~50M), while the 8.1B is a sum-over-time artifact, and that a literal −10% wouldn't fix the magnitude. Applied a **uniform ×0.10 scale** folded into `densify_service_dataset.py` (`SCALE=0.10`) — uniform, so all ratios (region/product/week) are preserved exactly; Warranty Expirations scaled by the same factor to keep the ASU↔expiration relationship sane. Result: whole-business single-week installed base **~5M units** (Dashboard ASU card now reads 5.01M for All/All 2025-Q1), grand ASU **812,661,800** (= 8,126,618,028 × 0.10, exact via per-row round-then-split), ΣExpirations 4,696,068, FQM unchanged (6,222). Re-pinned `INPUT_SHA256.txt`, re-ground-truthed the pivot via independent parse, updated `test_dataset.py` → **8/8 pass**; browser confirmed 0 console errors and realistic KPIs live. `SCALE=1.0` in the generator reverts to densify-without-rescale.

## Phase 3 — Scenario layer (`fc_engine.js`)
**Date**: 2026-07-22 | **Branch**: `hn-new`
**Plan ref**: `BUILD_PLAN.md` → "Phase 3 — Scenario layer (#6)"
**Files**: `forecast_copilot/fc_engine.js`, docs
**Prompt**: user approved the Phase 3 plan ("go") with defaults — scenario bar in the filter rail, presets included, compare up to 3.

**What was built** — the single working plan became a **library of named scenarios**:
- **Model**: `fcState.scenarios[]` (each `{id, name, plan}` where plan = filters + ncOverride + aposOverride + simMode + btcStrategy + manualBTC + distMode + approvals) + `fcState.activeScenarioId`. The **active scenario IS the live state** — pages read `fcState.filters` etc. unchanged. `fcSaveState()` now mirrors live edits into the active scenario automatically (`fcSyncActiveScenario`), so every existing page mutation (all go through `fcSaveState`) keeps the active scenario current with zero per-page changes. Migration: `fcEnsureScenarios()` wraps any existing/fresh `fc_state_v1` into a first "Baseline" scenario.
- **CRUD**: `fcSaveAsScenario`, `fcDuplicateScenario`, `fcRenameScenario`, `fcDeleteScenario` (keeps ≥1), `fcSwitchScenario` (saves outgoing edits, loads the target plan, reloads the page so page-specific inputs like sliders reflect it).
- **Presets** (`FC_PRESETS`, deterministic): Baseline / Aggressive / Conservative apply a recipe of levers (NC/APOS/BTC strategy/dist) to the **current slice** via `fcApplyPreset` (create-or-update by name, then reload).
- **Compare** (up to 3): `fcComputeFor(plan)` applies a plan to the live fields, runs `fcCompute()`, then restores live state — so scenarios are evaluated without disturbing the active one. Modal tabulates slice, levers, BTC strategy/%, baseline vs **lever-adjusted** ASU/SR/Dispatch, final SR (with BTC), and accuracy.
- **UI injection**: scenario bar inserted at the top of `.filter-rail`, compare modal appended to `<body>`, CSS injected once — same decoupled pattern as the Live/Simulated badge, so all 6 pages get it without edits. New/Duplicate/Rename refresh the bar in place; switch/preset/delete-active reload.

**Design choices**: reload-on-switch (bulletproof: every page re-inits from the active plan — sliders, filter buttons, charts all consistent — with no per-page wiring); auto-save edits to the active scenario (document-like: your changes stick to the current scenario, "New/Duplicate" to branch).

**Verification**:
- **Node `vm` smoke test**: Baseline seeded + active; save-as/switch round-trips (editing EMEA/nc30 syncs to active; switching to Baseline restores AMERICAS/10; switching back restores EMEA/30); presets create scenarios with the right levers keeping the slice; `fcComputeFor` gives distinct per-scenario outputs and **restores live state**; duplicate/rename/delete; **persistence** across a fresh reload from localStorage.
- **Real browser** (served live): scenario bar renders (select, New/Duplicate/Rename/Delete/Compare, 3 preset chips), 0 console errors; created Baseline/Aggressive/Conservative + an EMEA·Poweredge scenario; Compare tabulated 3 side by side with the lever effect visible (Aggressive ASU-scenario 6.31M vs Baseline 6.08M on the same slice; Final SR 14.17M→15.29M with 5.46% BTC; EMEA slice ~1.3M, 89% accuracy). 8/8 dataset tests still pass (no data change). (Screenshot skipped — the browser pane wasn't displayed; verified via extracted table text.)

---

## Phase 6 — End-to-end walkthrough + docs refresh
**Date**: 2026-07-23 | **Branch**: `hn-new`
**Plan ref**: `BUILD_PLAN.md` → "Phase 6 — E2E + docs"
**Files**: `HANDOFF.md` (rewritten), `README.md`, `BUILD_PLAN.md`, `PROMPT_TRAIL.md`, memory. (No product code changed.)
**Prompt**: "phase 6. go. optional demo > later, when others' changes are consolidated."

**End-to-end walkthrough** (served live, one clean pass from a cleared `fc_state_v1`, checking console errors on every page): Dashboard → **Live** badge, real numbers, fresh state auto-migrated to a "Baseline" scenario, ASU 5.01M (All/All) → 2.46M on an Americas/Poweredge/2026-Q1 drill-down. Slice **carried** to ASU Simulation; NC/APOS 25/15 raised scenario ASU 2.46M→2.52M. Historical clean. AI BTC Advisor → picked "Balanced" (6.82%). BTC Distribution → strategy carried; edited week 2026-W06 (474,900→514,900) → ledger recorded it with a timestamp. Final Forecast → the whole chain flowed (slice + levers + strategy + weekly edit; final SR bottom-up 6,255,720); Approve Scenario + Approve BTC; **Submit → published** `forecast_baseline_2026-07-23_190748.xlsx` to `output/`, button disabled with tooltip, history panel listed it. Inspected the file on disk: **Final Forecast** sheet shows the weekly plan with W06 flagged **Edited=Yes**; **Assumptions** shows the slice + levers (Balanced, 25/15); **Audit** records the input **sha256** + the ledger entry — the full input→edit→publish story captured in one artifact. Killed the server, loaded via a plain static host → **Simulated** badge + seeded numbers, 0 errors. **Input sha256 unchanged** throughout; **14/14 tests pass**. Test-published files cleaned from `output/` (kept `.gitkeep`).

**Docs refresh**: rewrote the stale `HANDOFF.md` into a focused, current quick-start for the product (what it is, `python serve.py`, the loop, where things live, status, guardrails); README intro updated (static→live/loop, points to HANDOFF); `BUILD_PLAN.md` marked Phases 0–6 complete and the Power BI decision now evidence-backed; this entry. **Demo runbook deferred** per instruction (do it later, once other people's branches are consolidated). Phase 7 (LLM insights) remains optional.

## Phase 5 — Publish / write path (`serve.py`, Final Forecast page) — loop closed
**Date**: 2026-07-23 | **Branch**: `hn-new`
**Plan ref**: `BUILD_PLAN.md` → "Phase 5 — Publish / write path (1)" *(milestone: loop closed)*
**Files**: `forecast_copilot/serve.py`, `forecast_copilot/Final Forecast — Forecast Copilot.html`, new `forecast_copilot/test_publish.py`, docs
**Prompt**: "build Phase 5 with that behavior" (Submit disables until the plan changes; no delete/overwrite).

**Server (`serve.py`)** — a **stdlib-only .xlsx writer** (no openpyxl): `_write_xlsx(path, sheets)` builds a valid workbook (Content_Types, rels, workbook, a tiny styles part with normal+bold, one sheet part each) writing strings as **inline strings** so there's no shared-string table. `publish_forecast(payload)` lays the payload into three sheets — **Final Forecast** (summary + weekly plan with an Edited flag), **Assumptions** (slice + levers), **Audit** (publish metadata + the input file's sha256 + the change ledger) — and writes `forecast_<slug>_<YYYY-MM-DD_HHMMSS>.xlsx` to `output/`, **never overwriting** (`-2`/`-3` on clash). `list_outputs()` lists `output/*.xlsx` newest-first. Routes: `POST /api/publish` (reads the JSON body, writes, returns `{ok, filename, publishedAt, inputSha256, bytes}` with 201) and `GET /api/outputs`. Input is only read — its sha256 is captured into Audit and is unchanged after publishing.

**Client (Final Forecast page)** — Submit is now a **publish** action, not a toggle. `fcBuildPublishPayload()` assembles the on-screen summary + weekly series + slice/levers (live-mode labels: Product / Warranty Type) + `fcScenarioLedger()`. `fcSubmit()` POSTs to `/api/publish`; on success it stores `{fingerprint, filename, at}` on the active scenario and refreshes the **Published Forecasts** history panel (`/api/outputs`). **Disable-until-changed**: `fcApplySubmitUI()` (called from every render) shows "Published ✓" + disabled while the current plan's fingerprint (`fcPlanFingerprint()` over filters + levers + BTC + weekOverrides) matches the published one, tooltip "Published — edit the plan to publish a new version"; any edit re-enables it. **No delete/overwrite** — re-publishing adds a new file. Approve Scenario / Approve BTC stay per-review toggles that reset on load. **No-server fallback**: Submit downloads a JSON copy of the payload and shows a note to run `serve.py`.

**Verification**:
- **Python `test_publish.py`** (6 new tests; 14 total with the read-path suite): publish writes a valid zip with 3 sheets + well-formed XML; the payload's scenario/SR/week/edited flag appear; Audit records the input sha256 + ledger action + input filename; a **second publish never overwrites** (distinct file, `list_outputs` returns 2); the **input sha256 is unchanged**. 14/14 pass.
- **Real browser** (served live, 0 console errors): Submit enabled → click → **file written to `output/`** (`forecast_baseline_...xlsx`, ~4 KB), button → "Published ✓" disabled with the tooltip+filename, status line, history panel lists it; **editing NC 10→25 re-enabled Submit**; a second publish produced a **second file** (history shows both, newest first). Confirmed on disk + via `/api/outputs`; input sha256 still matches the committed pin. Test-published files were cleaned from `output/` afterward (kept `.gitkeep`).

## Fix — Final Forecast approval buttons were one-way (stuck disabled)
**Date**: 2026-07-23 | **Branch**: `hn-new`
**Files**: `forecast_copilot/Final Forecast — Forecast Copilot.html`
**Report**: user had clicked Approve Scenario / Approve BTC / Submit Forecast long ago; the state persisted, and the buttons "don't reset, can't submit or approve".
**Root cause**: `markDone()` set `btn.disabled = true` and `fcApplyApprovalUI()` re-disabled any button whose `fcState.approvals[key]` was true on load — so once approved (state persisted in `fc_state_v1`, now per-scenario after Phase 3), a button was permanently locked with no undo path.
**Fix**: made all three buttons **toggles** — click to approve/submit, click again to undo — and never left disabled. `fcApplyApprovalUI()` now sets label/`done`/`primary` from the current approval state with `disabled=false`; a single `toggleApproval(cfg)` flips `fcState.approvals[key]`, persists (to the active scenario), and re-applies the UI. Per follow-up, approvals are treated as **per-review**: the Final Forecast page resets `fcState.approvals` to all-false on every load, so each visit starts clean (in-session you can still approve/undo).
**Verified** (browser): reproduced the stuck all-approved state → buttons load enabled and reset; clicking approves (✓), clicking again undoes; approving all three then **reloading returns them to the base labels** with `{scenario:false,btc:false,submitted:false}`; 0 console errors.

## Phase 4 — Editing + ledger (`fc_engine.js`, BTC Distribution page)
**Date**: 2026-07-22 | **Branch**: `hn-new`
**Plan ref**: `BUILD_PLAN.md` → "Phase 4 — Editing + ledger (#4)"
**Files**: `forecast_copilot/fc_engine.js`, `forecast_copilot/BTC Distribution — Forecast Copilot.html`, docs
**Prompt**: "phase 4. go".

**What was built** — an editable weekly grid with a per-scenario change ledger:
- **Model**: `weekOverrides` added to the plan (a plan field, so it snapshots with the active scenario, persists, travels on switch, and is read by `fcCompute`) — maps a fiscal-week label → hand-typed BTC Forecast value. Each scenario also gets a `ledger[]` (an append-only audit trail kept on the scenario object, not in the plan, so `fcSyncActiveScenario` doesn't clobber it).
- **Pipeline**: `fcDistributeWeekly(series, btcPct, distMode, overrides)` now applies overrides — an overridden week uses the typed value, others keep their computed distribution — and returns `edited[]` + `hasOverrides`. When any override exists, `fcCompute` makes the plan **bottom-up**: `final.sr = sum(weekly.btcForecast)` (dispatch scaled by the scenario's dsp/sr ratio), so hand-edits flow to the Final Forecast page and its status checks.
- **Helpers**: `fcSetWeekOverride` / `fcClearWeekOverride` / `fcClearAllWeekOverrides` (each logs a timestamped delta via `fcLogEdit`), `fcScenarioLedger`.
- **UI (BTC Distribution)**: BTC Forecast column → editable `type=text inputmode=numeric` inputs (Indian-format display, parsed by stripping non-digits); edited cells flagged teal with a per-week reset ↺; an edit-status line + **Reset all edits** button; a **Change Ledger** panel (When / Action / Week / From / To, newest first). CSS injected once. Handlers re-render in place.

**Verification**:
- **Node `vm`**: setting an override changes that week's `btcForecast`, flips `hasOverrides`, makes `final.sr` the bottom-up sum, recomputes variance; ledger records `set`/`reset`; override lives in the active scenario's plan; ledger + override **persist across a reload** from localStorage.
- **Real browser** (served live, 0 console errors): edited 2026-W01 (11,31,381 → 15,00,000) → row flagged, reset appears, edit-count + Reset-all update, ledger row `set | 2026-W01 | — | 1.50M` with timestamp, `final.sr` 14.94M → 15.31M; navigated to **Final Forecast** — Submission Summary SR shows **15.31M** (edit flowed cross-page); reloaded BTC Distribution — override + ledger persisted; per-week reset restored the computed value (+`reset` ledger entry); **Reset all** cleared two edits (+`reset-all` entry). 8/8 dataset tests still pass.

**Noted (pre-existing, out of scope)**: the Final Forecast "Submission Summary" ASU row shows ~82.76M for an All/All 2026-Q1 slice — i.e. it appears to sum ASU across the 13 weeks even though the subtitle says "end-of-quarter level" (~6M). This predates Phase 4 (weekOverrides only touch BTC Forecast/final SR); flagged for a later fix.

## Follow-up — workbook split; source is now hand-maintained user restructured the input into two files and asked to "make changes to the engine". Inspected both before touching anything: `dell_isg,esg_fy24-26.xlsx` is now a **single-sheet source** (Service Dataset only), and `fy24-26_info.xlsx` holds the reference sheets (FY26 Official, Product Estimates, Product x Quarter, Warranty Assumptions) plus the "ASU by Product" sheet. The Service Dataset itself is **unchanged in content** — same 13 columns, 8,892 rows, identical totals (ΣASU 812,661,800 / ΣExpir 4,696,068 / ΣFQM 6,222); Excel just re-saved it (shared strings, re-ordered rows). So the engine needed **no functional code change**: `serve.py` already reads `dell_isg,esg_fy24-26.xlsx` → "Service Dataset" by name with the same schema, and all 8 tests pass against the re-saved file (aggregates are order-independent). Scaffolding updates only: re-pinned `INPUT_SHA256.txt` to the two current files (source + info; dropped the deleted `.source.xlsx` line); **retired `densify_service_dataset.py`** (its provenance `.source.xlsx` was deleted and its output would re-merge the sheets the user just split — the derivation stays in git history + this log); updated README's data section. Browser re-verified: app still loads live from the source, 0 console errors.

**Earlier follow-up — add an "ASU by Product" sheet**: user asked for a new sheet in the same workbook listing ASU for each product, organised by year > quarter > week. Added to the generator: one row per FY > Quarter > Week (156 weeks, chronological), first three columns FY / Fiscal Quarter / Fiscal Week, then one column per product (19, ASU summed across regions), then a Total column; frozen header + first three columns; Excel AutoFilter over `A1:W157`. Added as a new worksheet part `xl/worksheets/sheet6.xml` and registered surgically: `<sheet name="ASU by Product" sheetId="6" r:id="rId10"/>` in workbook.xml, `rId10` in workbook.xml.rels, an Override in `[Content_Types].xml`, and a `_xlnm._FilterDatabase` defined name (localSheetId 5). Also **fixed a latent stale-range bug** introduced by densification: the Service Dataset AutoFilter (`<autoFilter>` in sheet1 + the `_FilterDatabase` defined name) still read `A1:M2965` — corrected to `A1:M8893`. Validated: all XML parts well-formed; only sheet1 + workbook.xml + rels + `[Content_Types]` changed plus the new sheet6; sheets 2–5, styles, sharedStrings, calcChain, theme byte-identical; sheetIds unique 1–6; Total reconciles every row; grand sum across the sheet = 812,661,800 (matches). Re-pinned `INPUT_SHA256.txt` (`1e32fd92…`); serve.py still reads Service Dataset unchanged (8,892 rows); 8/8 tests pass.

---

## Filter-rail UI polish (compact rail, collapsible Workspace, cross-page zoom, dropdowns, labels)
**Date**: 2026-07-27 | **Branch**: `hn-new`
**Commits**: `0eb18a9` → `7343d7f` (all in the shared `fc_engine.js` unless noted).
**Prompts** (a run of UI-polish asks): port master's filter-rail look; contain the Conservative preset overflow; shrink the right-side filter boxes; make Workspace collapsible; add a Reset-filters control + make the rail collapsible; make zoom common across pages; drop the scenario switcher from the Dashboard (but **keep** its filters); equal left/right gaps for the dropdowns; dropdowns must flip up when there's no room below; fix Fiscal Week (no dropdown) / WO Type / FQM (cut in half) / stray carets / missing boundary; rename **Fiscal Quarter → Fiscal Qrtr** and **Product Business → Business Unit**, keep every label on one line.

**What was done** — all in the single shared engine `fc_engine.js` (edit once, all 6 pages inherit):
- **Master filter-rail port** (`0eb18a9`): brought master's Reset + collapsible filter-rail treatment into this branch and fixed the **Conservative preset** chip overflowing its box.
- **Compact rail + collapsible Workspace + Dashboard** (`eefdcc9`, later corrected): narrowed the rail, added a top-bar **Workspace** toggle that hides the left nav (persisted via `fc_nav_collapsed`), and made the rail respond to a **cross-page** zoom. Dashboard is detected by title (`fcIsDashboard`).
- **Dashboard scenario switcher** (`9fab3c0`): `fcInjectScenarioUI()` now early-returns on the Dashboard, so the Dashboard **keeps its filters** but drops the scenario dropdown/compare bar (it's a read-only overview, not a scenario editor).
- **Equal gaps** (`e99f410`): the rail is pure symmetric padding — the divider line moved off the rail onto `.main` (`border-right:none` on the rail, `border-left` on main) so left/right gaps match.
- **Cross-page zoom** (`2a3fa7f`, `1c6903c`): dropped the earlier custom zoom control; native browser zoom doesn't persist across separate HTML pages, so re-implemented an **invisible, gesture-driven** app zoom — Ctrl +/-/0 and Ctrl+wheel set `documentElement.style.zoom` and persist it (`fc_zoom`, 0.5–2.0). Because CSS `zoom` doesn't scale `vh`, a companion `--fc-vh-scale = 1/z` keeps the full-height panels (`html,body,.sidebar,.filter-rail,.main`) at window height.
- **Dropdowns** (`304f600`, `cfa9390`, `9341d8a`): reworked `fcFitDropdownToRail` so each dropdown is a **`position:fixed` overlay** (escapes the rail's `overflow:auto` clipping that was hiding Fiscal Week and cutting WO Type/FQM in half), sized to the rail width with **equal L/R gaps**, opening **down when it fits else up**, height-capped to the available space so long lists (Fiscal Week, 156 weeks) scroll inside. Removed every filter's dropdown **caret** and gave the dropdown a clear boundary (border + shadow + solid background).
- **Label rename + one-line alignment** (`7343d7f`): quarter → **"Fiscal Qrtr"** (both modes); the business filter → **"Business Unit"** in Simulated mode (options ESG/ISG/HES) while staying **"Warranty Type"** in Live mode (there it filters the warranty column) — driven by `FC_SIM_LABEL` / `FC_LIVE_LABEL`. Widened the rail **210px → 238px** and forced single-line labels (`white-space:nowrap`) so nothing wraps; uniform label height keeps the filter rows aligned.

**Verification**:
- **Node (mocked 720 viewport)**: `fcFitDropdownToRail` places a top filter **down** and within the viewport, and bottom filters + the tall Fiscal Week list **up** and within the viewport (height-capped).
- **Real browser** (served live): carets gone; every dropdown `position:fixed` with a border and its full option list; label widths measured — old "Product Business" overflowed (scroll 106 > client 100) while "Business Unit" / "Warranty Type" / "Fiscal Qrtr" all fit (100/100), no truncation; 0 console errors. (A final visual pass was limited because the preview pane collapsed to 0-height in this environment; geometry was confirmed via measurement + the Node placement check instead.)
- Pushed to `hn-new` (`e99f410..7343d7f`); `master`/gh-pages untouched.

## Session 28 — De-brand the input workbook: Dell terms → generic; rename to `forecast_fy26.xlsx`
**Files**: new `input/forecast_fy26.xlsx` (de-branded data), new `input/name_mapping_reference.xlsx` (lookup),
`serve.py`, `input/INPUT_SHA256.txt`, `test_dataset.py`, `test_publish.py`, `fc_engine.js`, folder-local docs.
**Prompts**: "the input file dell_isg,esg_fy24-26 has dell specific terms — replace them all with generic terms,
create a new reference excel file"; then "point everything to the new file" + a name-mapping reference file.

**What was done**:
- **Genericized the data** (values only; every number preserved — ΣASU 812,661,800 identical, 8,892 rows):
  - **Product** (19) → category+tier: Poweredge→*Server Line A*, Poweredge Ai→*Server Line B (AI)*,
    Cloud Servers→*Server Line C (Cloud)*; Powerstore/Powermax/Powerscale/Powerflex/Powervault/Compellent/
    Equallogic/Unity/Vmax/Vnx/Xtremio → *Storage Array A–K*; Avamar/Datadomain→*Data Protection A/B*;
    Powerswitch→*Networking A*, Legacy Networking→*Networking B (Legacy)*; Vxrail→*Hyperconverged A*.
  - **Warranty Type**: ProSupport→*Premium*, ProSupport Flex→*Premium Flex*, ProSupport Plus→*Premium Plus* (Basic kept).
  - **GCFA / Region / fiscal periods / Core-Upsell / W-O Type / Service Type / ASU**: left as-is (industry-generic).
  - ISG/ESG/HES appear **nowhere** in the workbook data (verified by scanning every part) — they only lived in the
    old filename, now dropped.
- **New files** written with `serve.py`'s stdlib xlsx writer (no openpyxl): `forecast_fy26.xlsx` and a
  `name_mapping_reference.xlsx` (sheet *Name Mapping*: Field · Category · Original (Dell) · Generic (new)).
- **Pointed everything at the new file**: `serve.py` `DEFAULT_INPUT`; re-pinned `INPUT_SHA256.txt`
  (`203422b8…`); updated `test_dataset.py` (Poweredge→Server Line A predicates) and `test_publish.py`
  (audit filename); Live-mode badge tooltip in `fc_engine.js`; and the filename in README/HANDOFF/BUILD_PLAN.
- **De-branded the UI too** (the Live-only data swap left Dell names in Simulated mode + cached state):
  - `fc_engine.js` Simulated-mode `FILTER_OPTIONS` + `FC_DEFAULT_STATE` + factor maps (`FC_LOB_FACTOR`,
    `FC_BUSINESS_FACTOR`, `FC_SERVICE_FACTOR`) re-keyed: LOB PowerEdge/PowerStore/…/Insignia →
    Server Line A / Storage Array A,C,D / Hyperconverged A / Data Protection A / Networking A,B;
    **business ESG/ISG/HES → Unit A/B/C** (this is where ISG/ESG/HES actually lived — the app's
    `business` filter, not the data); service `… ESG/ISG` suffixes → `… (Unit A/B)`.
  - Static filter-button placeholders + "Product Business"→"Business Unit" label updated in all 6 HTML pages.
  - **Bumped `FC_STATE_KEY` `fc_state_v1`→`fc_state_v2`** so browsers holding old Dell-named filter state
    (and old scenarios) discard it and load clean generic defaults.
- **Tests**: `python -m unittest` → **14/14 pass**.
- **Browser-verified (Live, served on `forecast_fy26.xlsx`)**: Product dropdown shows Server Line/Storage
  Array/… only; Warranty Type = Basic/Premium/Premium Flex/Premium Plus; 0 Dell terms in any rail.

**Note**: user deleted the superseded `input/dell_isg,esg_fy24-26.xlsx` (my `git rm` was permission-blocked).
Only a single internal code comment in `fc_engine.js` still names the old Dell terms (explains the live
value-snapping) — not user-visible.

### Follow-up — real Business Unit column; drop Unit C/HES
**Prompt**: "remove hes/unit c. add a column to the excel file. Business Unit: Unit A, Unit B. Unit A for
~80% values of each Global LOB."
**What was done**:
- **New `Business Unit` column** added to `forecast_fy26.xlsx` (now **14 columns**, 8,892 rows). Values
  **Unit A / Unit B**, assigned deterministically (`crc32(product|region|week) % 100 < 80`) → **~80% Unit A /
  ~20% Unit B per Product** (overall 80.4% A). Numbers (ASU/Exp/FQM) unchanged.
- **`business` filter is now a real data dimension**: `serve.py` `FIELD_SCHEMA` gains
  `("Business Unit","businessUnit","string")`; `fc_engine.js` `FC_LIVE_FIELD.business` → `businessUnit`,
  `FC_LIVE_LABEL.business` → "Business Unit", `fcApplyLiveFilterOptions` reads `businessUnit`. The old
  Live-mode "business → Warranty Type" hijack is gone (Warranty Type stays a data column, just not filtered).
- **Unit C / HES removed everywhere**: Simulated `FILTER_OPTIONS.business` → `['All','Unit A','Unit B']`;
  `FC_BUSINESS_FACTOR` → `{All:2.30,'Unit A':1.84,'Unit B':0.46}` (Unit A now the ~80% majority; All = sum).
- Re-pinned `INPUT_SHA256.txt` (`18c0c9f7…`); `test_dataset.py` gains the 14th column + an 80/20-split
  assertion (per-product share within ±8%). **15/15 tests pass.**
- Docs (README filter table, Live-mode section, input-columns list) updated.
- **Browser-verified (Live)**: Business Unit filter shows All/Unit A/Unit B (no Unit C); selecting Unit B
  drops ASU 3.98M→1.96M, confirming the column drives the slice end-to-end.

### Fix — keep Warranty Type as its own filter (regression from the BU change)
Wiring `business`→Business Unit had silently dropped Warranty Type from the rail (it had been the Live-mode
tenant of the `business` slot). That was never requested. Added a **dedicated `warranty` filter** instead of
reusing a slot:
- `fc_engine.js`: new `FILTER_OPTIONS.warranty` (Basic/Premium/Premium Flex/Premium Plus),
  `FC_DEFAULT_STATE.filters.warranty='All'`, `FC_LIVE_FIELD.warranty='warrantyType'`,
  `fcApplyLiveFilterOptions` derives it from the data, new `FC_WARRANTY_FACTOR` (segmentation shares,
  All=1.0 so defaults are unchanged) folded into `fcCombinedFactor`.
- New `data-filter="warranty"` rail row inserted after Business Unit in all **6 HTML pages**.
- Both modes now expose **Business Unit** and **Warranty Type** as independent filters (11 total).
- **Browser-verified (Live)**: Warranty Type = All/Basic/Premium/Premium Flex/Premium Plus; selecting
  Premium Plus moves ASU 3.98M→1.96M. 15/15 tests still pass. README filter table + count updated.

## Session 29 — Rename "ASU Simulation" → "What-If Simulation"; extend data to FY22–FY26; trim FY filter
**Files**: all 6 `*.html` (nav label), `ASU Simulation …html` (page title), `input/forecast_fy26.xlsx`,
`input/INPUT_SHA256.txt`, `fc_engine.js`, `test_dataset.py`, README/HANDOFF.
**Prompts**: (1) rename the left-nav item to "What-If Simulation" and drop "ASU" from the page title;
(2) FY filter ran 2022–2028 but data was only FY24–26 — "add dummy data for 2022-23, remove 2028",
then forecast FY27 (Task 2, ideas only).

**What was done**:
- **Nav rename**: left-sidebar label **"ASU Simulation" → "What-If Simulation"** on all 6 pages (href /
  filename unchanged, so links still work); main page title **"ASU What-If Simulation" → "What-If
  Simulation"**. `<title>` tag and the Dashboard activity-feed line left as-is (not requested).
- **Back-cast FY22 + FY23** into `forecast_fy26.xlsx` (one-off dev script, reused `serve._write_xlsx`):
  cloned the 2,964 FY24 rows twice, relabelled FY/quarter/week to 2022/2023, scaled ASU + Warranty
  Expirations by **FY23 = FY24 × 0.78, FY22 × 0.60** with deterministic ±3% per-row jitter
  (`crc32(product|region|week|fy)`). Every categorical column and distribution ratio preserved; FY24/25/26
  rows untouched. Data is now **14,820 rows = 19 × 3 × 260 weeks (FY22–FY26)**, smooth growth curve
  (ΣASU 129.5M → 168.3M → 215.6M → 270.6M → 326.4M; grand ~1.11B). Re-pinned `INPUT_SHA256.txt`
  (`8c5651df…`).
- **Filter trim**: `fc_engine.js` Simulated-mode `FILTER_OPTIONS.quarter`/`week` loop `2022→2028`
  changed to **`2022→2027`** (drops 2028; keeps 2027 as the FY27 forecast target). Live mode derives
  options from data → shows FY22–FY26 until Task 2 adds FY27.
- **Tests**: `test_dataset.py` pivot updated via an **independent regex parse** (different code path from
  serve's ElementTree) — new GRAND (14,820 / ΣASU 1,110,489,194 / ΣExp 6,372,280 / ΣFQM 10,380), added
  FY22/FY23 slices, updated Region + Server Line A slices + row count + distinct fy/quarter counts; the
  independent parse re-confirmed FY24/25/26 slices are byte-identical to the prior ground-truth. **15/15 pass.**

**Note**: opening the workbook in Excel to release a file lock silently re-encoded it and renamed the sheet
`Service Dataset → Raw_data`, breaking `load_dataset`; recovered with `git checkout -- forecast_fy26.xlsx`
(sha matched the pin) before regenerating. Excel must not save this file.

**Task 2 (FY27 forecast) — not yet built**; approaches floated to the user for a decision first.

## Session 30 — forecast_copilot_v2: page trim/rename, BTC Signals rework, filters/scenario chrome
**Files**: new folder `forecast_copilot_v2/` (copy of `forecast_copilot/`). Edited: `fc_engine.js`,
all 5 remaining `*.html`, `serve.py`. Deleted `ASU Simulation …html`; renamed
`AI BTC Advisor …html → BTC Advisor …html` and `BTC Distribution …html → BTC Visuals …html`.
**Prompts**: one batch of 6 numbered asks (remove What-If page; rename AI BTC Advisor→BTC Advisor +
BTC Signals rework; rename BTC Distribution→BTC Visuals + graph changes; Historical fixes; remove
scenario tab everywhere; show all filters). Items 3.3 "asdsad" and 4.3 "a" were stray keystrokes — skipped.

**What was done**:
- **All new work is isolated in `forecast_copilot_v2/`** (untracked copy); `forecast_copilot/` untouched.
- **(1) Removed What-If page**: deleted the ASU Simulation HTML, stripped its nav anchor from all pages,
  relabelled the Dashboard activity line "ASU Simulation recalculated" → "Forecast recalculated".
- **(2) BTC Advisor** (renamed from AI BTC Advisor — nav label, `<title>`, page-title):
  - "AI Confidence Signals" → **"BTC Signals"**; kept only **Modernization / Triad Commitment /
    Quality Improvement**; dropped AI Chatbot, Remote Resolution, Self Heal.
  - **"+ Add signal"** button (prompts for a name; new signal defaults to 50%). Each signal has a remove ×
    (keeps ≥1). Signals render dynamically from `fcState.btcSignals`.
  - **Equal weight**: `fcSignalsAverage()` = mean of signal values IS the **Selected BTC %**
    (engine `fcCompute` gains a `'signals'` branch; verified 100→100, 50→50, 4-signal case → 62.5%).
    Applied downstream as a **literal % uplift** (user-confirmed) into BTC Visuals + Final Forecast.
  - Strategy toggle + BTC Comparison table **left as-is** (user will revisit); `btcStrategy` now defaults
    to `'signals'` app-wide (`FC_DEFAULT_STATE`) so the signal-driven BTC is live on every page from load.
  - **Moved the Weekly Forecast Table** here from BTC Visuals (edit + per-week reset wiring came with it;
    the Change Ledger stays on BTC Visuals and still reflects edits via shared `fcState`).
- **(3) BTC Visuals** (renamed from BTC Distribution): LOB & Service Type distributions render as clean
  horizontal bars **without the 'All' aggregate row**, sorted largest-first, with a **count badge**
  ("8 LOBs" / "6 service types") top-right of each panel.
- **(4) Historical Performance**: "Best Historical BTC Range" meter now spans **55%–80%** (was a ~3–7%
  sliver near the left). Historical BTC + Forecast Accuracy trend x-axes now use the **last 12 fiscal
  quarters present in the input workbook** (`fcRecentFileQuarters()` → 2024-Q1…2026-Q4), replacing the
  window derived from the selected slice. Trend values are unchanged (they key off index+seed, not labels).
- **(5) Scenario switcher bar removed from every page** (`fcInjectScenarioUI` dropped from `fcBoot`); the
  scenario STATE still backs the compute pipeline.
- **(6) All filters visible**: the collapsible "More filters" group is gone — all 11 filters sit in the
  primary grid (`FC_PRIMARY_FILTERS` = all keys, `FC_SECONDARY_FILTERS` = []).
- **Cache fix (serve.py)**: static assets now send `Cache-Control: no-cache` so edits show on a normal
  refresh (Last-Modified still yields 304s when unchanged); `fc_engine.js` referenced as `?v=3` to bust
  any stale copy.

**Verified**: all 5 pages load with **0 console errors**; nav has 5 links (no What-If); signals math,
counts, range band, file-driven x-axis, no scenario bar, 11 visible filters all confirmed in-browser;
**`python -m unittest` → 15/15 pass**.

## Session 31 — forecast_copilot_v2: historical/accuracy tuning, BTC Signals weighting, FY filter
**Files**: `fc_engine.js`, `Historical Performance …html`, `BTC Advisor …html`, all 5 `*.html` (FY filter item + engine `?v=4`).
**Prompts**: second batch — (1) historical range/trend/accuracy + forecast-vs-actual avg line, drop AOP chart;
(2) BTC Advisor signal weighting/rounding, strategy→signals reflection, smaller boxes, Enter-to-apply,
Forecast Table tidy-ups; (3) fiscal-year filter + reorder + 'All' on every dropdown. (Item 3.3 was blank.)

**What was done**:
- **Historical (1)**: Best BTC range meter → **65%–80%**. Historical **BTC trend now varies 55%–85%**
  (y-axis rescaled to 50–90). **Forecast Accuracy trend is now a function of BTC** — peaks at **92% when
  BTC ≈ 75%**, tapering with distance (highest inside 65–80%), y-axis 60–100. Forecast vs Actual gains an
  **Average line** at the per-period midpoint of Forecast & Actual (extended `fcDrawGroupedBars` to accept a
  `type:'line'` overlay series). **Removed the AOP & Modernization Achievement chart** (engine still computes
  aop/modern for the Dashboard KPIs + submission gate).
- **BTC Advisor (2)**: Selected BTC now **rounds to a whole percent** (avg 61.7 → **62%**; downstream uplift
  uses the rounded value). **Picking a strategy** (Historical Best Fit / Balanced / Closest to AOP) now
  **loads that BTC into every signal** (set equal) so the BTC Signals tab *and* the Selected BTC reflect the
  choice, and the strategy button highlights. **BTC Signals + Selected BTC boxes made compact** (tighter
  rows, narrower right column `1.6fr/1fr`, smaller headline). **Manual override applies on Enter** as well as
  the button (renamed to "Use"). **Weekly Forecast Table → "Forecast Table"**: DS Forecast now shows
  whole-number **K/M** (e.g. 342K), and the **WoW Change column is removed**.
- **Filters (3)**: New **Fiscal Year** filter (maps to the workbook `fy` column). Filter rail reordered so the
  left column is **FY / Fiscal Week / Global LOB** and the right column is **Fiscal Quarter / Region /
  Business Unit** (via `FC_PRIMARY_FILTERS` order). **Every dropdown now leads with 'All'** — including
  Fiscal Year, Quarter and Week. Since the weekly view is quarter-based, `fcEffectiveQuarter()` resolves a
  `quarter='All'` selection to the latest real quarter — and, when a Fiscal Year is chosen, to that year's
  latest quarter — so nothing breaks and FY filtering yields data.
- Engine reference bumped to `fc_engine.js?v=4`.

**Verified in-browser (0 console errors, all pages)** + `python -m unittest` **15/15**:
Selected BTC 62% (signals avg 61.7); strategy click sets all signals to 70% & Selected BTC 70%; manual Enter
→ 42%; Forecast Table shows DS as "342K" with no WoW column; Historical range 65–80, BTC 57–81, accuracy
78–92 peaking at 92 when BTC=75, Forecast/Actual columns + Average line (exact midpoint), AOP chart gone;
FY filter present on all pages in the new order with 'All' at the top; FY24 + quarter='All' → effective
2024-Q4 with non-zero data.

## Session 32 — forecast_copilot_v2: trend lines, fixed BTC presets, BTC Visuals restructure
**Files**: `fc_engine.js`, `Historical Performance …html`, `BTC Advisor …html`, `BTC Visuals …html`, all 5 `*.html` (engine `?v=5`).
**Prompts**: third batch — (1) Historical trend lines + planning-period BTC + drop average line;
(2) BTC signals 50–100 range, fixed presets 75/60/80, comparison box above signals, DS full number;
(3) filters lead with 'All' + Reset → All; (4) BTC Visuals: remove dist toggles, donut hover + light-blue
'All', vertical LOB/Service bars side-by-side, remove ledger, move Opportunity table to BTC Advisor.

**What was done**:
- **Engine helpers**: `fcTrendline()` (least-squares straight line); `distributeByFactor()` and a Highcharts
  `fcDrawDonut()` (hover tooltip shows each slice's value; 'All' slice light blue `#8ec5ff`) moved/added to
  the engine. `fcDrawLineSeries`/`fcDrawGroupedBars` now accept `noHover` (series excluded from the shared
  tooltip) and a `line` overlay type; `fcHCAxes` honors an `opts.rotate` for rotated category labels.
  `fcResetFilters()` now resets **every** filter to 'All'.
- **Historical (1)**: Forecast vs Actual — the midpoint "Average" line became a **red least-squares trend
  line** with **no hover point**. BTC & Accuracy trend charts each got a **red dashed trend line** (also no
  hover). **Most Successful Planning Periods** now filters to quarters only (never 'All') and shows each
  quarter's **BTC value on the right**.
- **BTC Advisor (2)**: Signals slider range is now **50–100%** (never below 50). Strategies are **fixed
  presets — Historical Best Fit 75, Balanced 60, Closest to AOP 80**; selecting one (button or comparison
  row) sets every signal to that value, and a **manual entry likewise drives the signals** (floored at 50)
  and appears as its own comparison row. The **BTC Comparison** panel moved **above** the Signals / Selected
  BTC grid. The **DS Forecast** column shows the **full number** again (en-IN), not K/M.
- **Filters (3)**: 'All' already led every dropdown; **Reset now returns all filters to 'All'** (verified).
- **BTC Visuals (4)**: Removed the Equal/Historical/AI distribution **toggle buttons**. Region & Product
  Business are **Highcharts donuts** (hover shows values; 'All' slice light blue). **LOB and Service Type are
  now vertical bar charts, side by side** (grid-2, rotated labels, no 'All', count badge kept). **Change
  Ledger removed.** **Opportunity Table moved to the bottom of the BTC Advisor page.**
- Engine reference bumped to `fc_engine.js?v=5`.

**Verified in-browser (0 console errors, all pages)** + `python -m unittest` **15/15**:
Historical trend lines red + excluded from hover, planning periods quarters+BTC, AOP chart gone; Advisor
comparison above signals with presets 75/60/80, slider min 50, DS "3,41,899", Opportunity table at bottom,
Closest-to-AOP → all signals 80 & Selected 80%, manual 90 → all signals 90 + manual row; BTC Visuals has no
toggles/ledger/opportunity, donuts are pies with light-blue 'All', LOB/Service are side-by-side columns;
Reset sets fy/quarter/week/region/lob/business all to 'All'.

## Session 33 — forecast_copilot_v2: collapsible panels, drill-down Historical, dynamic FvA
**Files**: `fc_engine.js`, all 5 `*.html` (engine `?v=6`); heaviest changes in Historical, Dashboard, BTC Advisor, BTC Visuals.
**Prompts**: fourth batch — (1) move Workspace collapse into the sidebar; (2) filter-rail collapse button +
wider rail + bigger boxes + rename Hyperconverged A→Hyper A; (3) BTC-by-week only for a specific quarter;
(4) Dashboard ASU in Forecast vs Target + trends on latest quarter; (5) Historical drill-down trends +
FvA metric buttons; (6) BTC comparison columns + opportunity reason.

**What was done**:
- **Chrome (1,2)**: Removed the main-area "Workspace" toggle; the **collapse control now lives inside the
  sidebar**, and a matching **Filters collapse** button sits in the filter-rail header. Collapsing either
  panel reveals a left-edge **"Workspace »" / "Filters »" tab** to reopen it (persisted). Filter rail
  **widened to 296px** (cut from the main pane) and filter-value boxes now **wrap** long values (e.g.
  "Data Protection A") instead of clipping. **"Hyperconverged A" now displays as "Hyper A"** via a
  display-only relabel map (`FC_OPT_LABEL`/`fcOptLabel`) — the stored value stays "Hyperconverged A" so
  live-data filtering is unaffected.
- **BTC Visuals (3)**: "BTC Distribution by Fiscal Week" is shown **only when both Fiscal Year and Fiscal
  Quarter are specific** (hidden when either is 'All').
- **Dashboard (4)**: **ASU added to Forecast vs Target** (both the table and the chart). Trend sub-labels
  now name the effective quarter (latest when Quarter='All', via `fcEffectiveQuarter`).
- **Historical (5)**: Trend + Forecast-vs-Actual charts are now **drill-downs** driven by the filters —
  **"Last year"** (last 4 quarters) by default for the trends / **all quarters** for FvA; selecting a
  **Fiscal Year → that year's 4 quarters**; selecting a **Quarter → its 13 weeks**. Fixes that a Fiscal
  Year selection previously didn't change the graphs. BTC/accuracy **values are rounded**. FvA gains
  **metric buttons (New Contracts / APOS / ASU / SR / Dispatch)** that swap the series; no 'All' bucket;
  forecast bars turn **light blue in the weekly view**. Red no-hover trend line kept on all three charts.
- **BTC Advisor (6)**: Comparison table **drops Gap/Confidence/Risk**, **adds Adjusted ASU left of Adjusted
  SR**, and shows **full numbers** (en-IN). Opportunity table second reason is now "Strong chatbot
  deflection opportunity" (**"AI" removed**).
- **Engine helpers**: `fcTrendline`, `fcDrawDonut`, `distributeByFactor` (added earlier) plus this round —
  `fcOptLabel`, `fcToggleFilters`, and `fcDrawGroupedBars` reuse now updates series colour (so the
  week-view light-blue forecast applies on redraw). Engine bumped to `?v=6`.

**Verified in-browser (0 console errors, all pages)** + `python -m unittest` **15/15**:
Historical trends 4/4/13 points for last-year/FY/quarter with rounded integers and no-hover trend; FvA 20
bars default, 4 for a FY, 13 (light-blue forecast) for a quarter; metric buttons swap the data; chrome shows
in-sidebar Workspace collapse, filter collapse, 296px rail, "Hyper A" label, working collapse/reopen; BTC-by-
week hidden unless FY+quarter specific; Dashboard Forecast vs Target lists ASU/SR/Dispatch; BTC comparison =
Scenario/BTC%/Adjusted ASU/SR/Dispatch in full numbers; opportunity reason has no "AI".

## Session 34 — forecast_copilot_v2: icon-rail collapse, boxed reset, expand-to-detail charts
**Files**: `fc_engine.js`, all 5 `*.html` (engine `?v=7`).
**Prompts**: fifth batch — (1) Workspace collapses to thumbnails (no overlapping tab); drop "AI" from
"AI Planning Suite"; BTC Visuals nav thumbnail → bar chart. (2) box the Reset button between Filters and the
collapse control; remove "Planning slice selectors". (3) every graph gets a top-right expand button that
opens a centered detail view over a ~30%-blurred page.

**What was done**:
- **(1.1) Icon-rail collapse**: Collapsing the Workspace no longer hides it or shows a floating tab that
  overlapped the filters — the sidebar shrinks to a **62px icon rail** (brand mark + nav thumbnails), and its
  own collapse button flips «/» to expand again. The **Filters** rail collapses the same way (58px funnel-
  icon strip). The old left-edge reopen tabs (`#fc-expand-bar`) were removed.
- **(1.2)** "AI Planning Suite" → **"Planning Suite"** in the brand sub-label on all pages.
- **(1.3)** BTC Visuals nav **thumbnail changed to a bar-chart glyph** (was a pie).
- **(2.1)** The filter **Reset** is now a **bordered box button** sitting between the Filters title and the
  collapse button.
- **(2.2)** Removed the **"Planning slice selectors"** sub-label from the filter rail (fcWireFilterRailUI
  anchor falls back to the head).
- **(3) Expand-to-detail**: `fcInjectChartExpand()` adds a top-right **expand button to every chart panel**
  (detected via `svg[viewBox]` placeholders + rendered Highcharts targets). Clicking opens a **centered
  modal** and moves the live chart into it (reflow up, restore + reflow back on close); the page behind is
  **blurred (`backdrop-filter: blur(6px)`) with a dark tint** (~30% effect). Close via ✕, backdrop click, or
  Esc. `fcDrawGroupedBars` colour-on-reuse fix from last session retained.

**Verified in-browser (0 console errors, all pages)** + `python -m unittest` **15/15**:
brand reads "Planning Suite"; Reset is a boxed button; no "Planning slice selectors"; Workspace collapse →
62px icon rail (nav text hidden, thumbnails shown, no floating pin, glyph flips to »); Filters collapse →
58px strip with grid hidden; BTC Visuals nav icon is a bar chart; each graph panel has an expand button
(Dashboard 5, Historical 3, BTC Visuals 5); expand modal opens centered with blur(6px), moves the chart in
(title from the panel) and restores it on close.

---

## Session 35 — forecast_copilot_v2: BTC Advisor reworked to manual selection + saved scenarios; BTC Visuals merged in then deleted; expand-modal fixes
**Files**: `fc_engine.js` (engine `?v=8`), `BTC Advisor — Forecast Copilot.html` (rewritten), `Dashboard`/`Historical Performance`/`Final Forecast` (nav link removed, `?v=8`), **deleted** `BTC Visuals — Forecast Copilot.html`. Docs: `HANDOFF.md`.
**Prompts**: (1) BTC Advisor: drop "Recommend" from the subtitle; remove the Historical Best Fit / Balanced / Closest to AOP buttons; remove **BTC Signals**; add a **manual BTC slider** shifted to the left; **save up to 3 BTC scenarios**; move the **BTC Comparison** box to the right of the selector, have it reflect scenarios, and show it **only when ≥2 scenarios**; remove the **Opportunity table**. (2) Bring the **BTC Visuals** graphs into BTC Advisor. (3) After verifying, **delete BTC Visuals**. (4) Fix the expand-to-detail bugs: LOB & Service-Type bars **don't revert to original size** after expanding; Region & Product-Business donuts **don't grow** when expanded and their **legend disappears**.

**What was done**:
- **(1) BTC Advisor rewrite** — This page is now the single place BTC is chosen; it forces `btcStrategy='manual'` and normalises any legacy/out-of-range `manualBTC` into **[0, 25]%** (default 8%).
  - Subtitle → "Compare and select the BTC value to bend the curve toward your AOP target." (no "Recommend").
  - Removed the **strategy toggle**, the **BTC Signals** panel, and the **Opportunity table**.
  - **Manual BTC Selector** (left column): slider `0–25%` (step 0.5) → live **Selected BTC**, **Adjusted SR**, and an **AOP note** (✓ meets / △ short of target). Drives `fcState.manualBTC` and the whole app.
  - **Saved scenarios (up to 3)**: `fcState.btcScenarios[] = {id,name,btc}`. "Save scenario" captures the current BTC (name optional → "Scenario N"); chips list each with load-on-click and a × delete; **Save disabled at 3**.
  - **BTC Comparison** (right column): one row per saved scenario — BTC %, Adjusted ASU/SR/Dispatch off the current slice totals — active row highlighted, click a row to load its BTC. **Hidden until ≥2 scenarios**; when hidden the selector spans full width (`.advisor-grid.solo`).
- **(2) BTC Visuals graphs moved in**: Region & Product-Business **donuts** (+ legends), **LOB** and **Service-Type** vertical bars (count badges), and the quarter-only **Fiscal-Week** DS-vs-BTC bars — all rendered from the same engine helpers (`fcDrawDonut`, `fcDrawGroupedBars`, `distributeByFactor`, `FC_*_FACTOR`). The editable **Forecast Table** is retained below them.
- **(3) BTC Visuals deleted** (`git rm`) after in-browser verification; nav link removed from all remaining pages; the Dashboard activity item "BTC Visuals review" → "BTC distribution review".
- **(4) Expand-modal fixes (shared engine)**:
  - **Donuts didn't grow** — `fcDrawDonut` pinned `chart.height: 150`; removed it so the pie follows its container (still 150px normally via the `.donut` box, grows to fill the modal).
  - **Legend disappeared** — `fcOpenChartModal` moved only the chart `<div>`; it now moves the enclosing **`.donut-wrap`** (chart **+ legend**) when present, with new modal CSS scaling the donut to ~56% width / full height and enlarging the legend.
  - **Bars didn't revert** — new `fcReflowChart(id)` reflows **synchronously and again after a tick** on both open and close, and close now reflows the tracked `chartId` (not `firstElementChild.id`, which is undefined for a moved wrap), so charts reliably return to their original size.

**Verified in-browser (0 console errors, live data)** + `python -m unittest` **15/15**:
BTC Advisor renders donuts + LOB/Service bars + weekly bars; slider updates Selected BTC / Adjusted SR / AOP note; saving reveals the Comparison at the 2nd scenario (`.solo` drops), caps at 3, load/delete work; expanded donut carries its legend and both chart types return to original size on close (growth confirmed logically — the headless pane reports `innerHeight 0`, collapsing the modal's `86vh`, so on-screen growth is a real-viewport check). Dashboard/Historical/Final Forecast load clean on `?v=8` with a 4-item nav.

---

## Session 36 — forecast_copilot_v2: filter-collapse UX, LOB-aware distribution layout, BTC Selector figures, expand feature removed
**Files**: `fc_engine.js` (engine `?v=9`), `BTC Advisor — Forecast Copilot.html`, `Dashboard`/`Historical Performance`/`Final Forecast` (`?v=9`). Docs: `HANDOFF.md`.
**Prompts**: (1) Filters — once collapsed, drop the collapse button and **expand by clicking the funnel thumbnail**; **center the funnel** in the collapsed strip. (2) BTC Advisor — when a **single Global LOB** is selected, **remove the by-LOB chart** and lay Region / Product Business / Service Type out **3-across**; rename **"Manual BTC Selector" → "BTC Selector"**; add **Adjusted ASU** (before SR) and **Adjusted Dispatch** (after SR) figures. (3) **Remove the expand-to-detail views** from all visuals.

**What was done**:
- **(1) Filter collapse (shared engine `fcInjectChrome` + chrome CSS)**:
  - **(1.1)** `body.fc-filters-collapsed .fc-filter-toggle{display:none}` hides the collapse button once collapsed; a click handler on the **funnel header** expands again (ignores clicks on the toggle button so the expanded-state collapse still works).
  - **(1.2)** Centering fix: the funnel lives inside an injected `.filter-rail-head-title` flex wrapper whose own `font-size:13px` was re-showing the "Filters" text (~40px) and shoving the icon left. Collapsed rules now set the head to a centered column and force `.filter-rail-head-title{width:100%;justify-content:center;gap:0;font-size:0}` + a 22px funnel — verified the icon centre matches the rail centre (offset 0).
- **(2) BTC Advisor**:
  - **(2.1)** Distribution charts moved into one `#dist-grid`. When `filters.lob === 'All'` → class `lob-all` (2×2, LOB shown); otherwise `lob-one` (3 columns, `#panel-lob{display:none}` and its chart skipped) so Region / Business / Service sit in one row. Column count changes nudge Highcharts with `reflow()` so the width:100% charts refit.
  - **(2.2.1)** Panel title → **"BTC Selector"**.
  - **(2.2.2)** Added **Adjusted ASU** and **Adjusted Dispatch** calc boxes around the existing Adjusted SR (order: Selected BTC · ASU · SR · Dispatch), all from `scenarioAdjusted(r, selectedBTCPct)` so they match the comparison rows for the active BTC.
- **(3) Expand feature removed**: dropped the `fcInjectChartExpand()` call and deleted the whole expand block (icon, `fcInjectChartExpandCSS`, `fcReflowChart`, `fcOpenChartModal`, `fcCloseChartModal`, `fcInjectChartExpand`) from the engine — no expand buttons or modal are injected on any page now.

**Verified in-browser (0 console errors, live data)** + `python -m unittest` **15/15**:
BTC Advisor — title "BTC Selector"; calc shows BTC 8.0% / ASU 21,13,994 / SR 83,72,587 / Dispatch 41,86,297; default single LOB → `lob-one`, LOB panel hidden, 3 charts; switch to All → `lob-all`, LOB panel shown, `chart-lob` renders ("8 LOBs"); **0 expand buttons, no `#fc-chart-modal`**. Filters (checked on BTC Advisor + Historical) — collapsed strip hides the toggle, funnel centred (offset 0), clicking the funnel expands. Dashboard/Historical/Final Forecast load clean on `?v=9`.

---

## Session 37 — forecast_copilot_v2: cascading FY→Q→W filters, tight Forecast-vs-Actual band, BTC slider 0–100, one-row expandable charts, sidebar-icon collapse
**Files**: `fc_engine.js` (engine `?v=10`), `BTC Advisor` + `Historical Performance` (+ `Dashboard`/`Final Forecast` cache bump). Docs: `HANDOFF.md`.
**Prompts**: (1) Filters cascade — a chosen Fiscal Year limits Quarter+Week to that year; a chosen Quarter limits Week to its weeks. (2) Data — for 1 LOB / 1 quarter, forecast-vs-actual varies by only ~4–5k per **quarter** (outliers ≤10k), and actuals may sit **above** the forecast (previously always below). (3) BTC Advisor — slider 0–25% → **0–100%**; **BTC-by-week bars recoloured** to the Historical Forecast-vs-Actual palette; distribution charts **smaller, in one row, expandable** (30% backdrop, revert to original size, x-axis labels not cut off). (4) Workspace collapse — replace the «/» arrow with a **VS Code/Claude sidebar icon**, moved to the **left**. (5) Collapsed filters — show the **funnel near the workspace icon**; add a **gap** between the Filters/Reset head and the first filter.

**What was done**:
- **(1) Cascading filters (engine)**: `fcAllowedOptions(key)` derives Quarter from the FY (`FY22`==2022) and Week from the Quarter (`fcWeeksForQuarter`) or FY. `fcApplyFilterSelection` snaps now-invalid dependents to `All` and rebuilds their dropdowns via `fcRebuildFilterDropdown`; `fcWireFilters` was refactored onto these. Verified: FY22 → Quarter list is only 2022-Q1…Q4; Quarter 2022-Q2 → Week list is only 2022-W14…W26.
- **(2) Forecast vs Actual (Historical page)**: replaced `actual = forecast × accuracy` (always below, huge gap) with a per-quarter signed gap — mostly ±4–5k, ~1-in-7 an outlier up to ±10k — distributed across weeks in week-mode with jitter that nets to the quarter gap. Verified: 1-LOB/1-quarter week-mode quarter gap ≈ 4.1k with weeks landing above and below; quarter-mode gaps all ≤10k with mixed signs. Caption updated.
- **(3) BTC Advisor**: `BTC_MAX` 25→**100** (slider `max="100"`); **BTC-by-week** bars now DS=teal `#0d9488` / BTC=blue `#0284c7` (matching FvA); `#dist-grid` is now always **one row** (`lob-all`=4 cols, `lob-one`=3 cols) with compact donuts (stacked over legend, 118px) and 170px bar charts. **Per-chart expand** (`bx-*`, BTC-Advisor-local): 30%-opaque backdrop, fixed 640px card; moves the chart (or whole `.donut-wrap` so the legend comes too) into the modal and back. **Sizing uses `setSize(clientW, clientH)`** — Highcharts `reflow()` only re-reads width, so it wouldn't grow/return height; `setSize` grows in the modal and snaps back on close (verified 170→506→170; donut 118→445→118, legend travels).
- **(4) Workspace toggle (engine)**: static `FC_SIDEBAR_ICON` (panel-left glyph) replaces the arrow; `align-self:flex-start` (left); `fcSyncCollapseGlyphs` now only flips the tooltip for the nav.
- **(5) Collapsed filters (engine)**: the funnel becomes a **26×26 bordered icon button** at the top of the strip (top-aligned, matching the Workspace toggle so they pair up); `.primary-grid{margin-top:16px}` adds the head→filters gap.

**Verified in-browser (0 console errors, live data)** + `python -m unittest` **15/15**:
cascade lists correct; FvA band tight with above/below actuals; BTC slider max 100; fwbars colours `[#0d9488,#0284c7]`; dist-grid one row (4/3 cols); 5 expand buttons on BTC Advisor, **0** on Dashboard; expand grows and reverts (height + donut) with a 30% backdrop; Workspace toggle is an SVG icon (no arrow) pinned left; collapsed funnel boxed at top near the Workspace icon; 16px head→filter gap. All pages on `?v=10`.

---

## Session 38 — forecast_copilot_v2: Service→donut, horizontal donuts, international numbers, reusable expand (with reliable revert), FvA average line, sidebar funnel-reopen
**Files**: `fc_engine.js` (engine `?v=11`), `BTC Advisor` + `Historical Performance` (+ `Dashboard`/`Final Forecast` cache bump). Docs: `HANDOFF.md`.
**Prompts**: (1) Visuals — Service Type → donut like Region; make Region/Business donuts smaller **horizontally, not vertically** (they were clipped at the bottom); **all visuals must revert to original size after expand**. (2) Numbers → **international format** (grand/million: K/M/B, en-US grouping — not Indian lakhs). (3) Filters — **Reset** button the **same height** as the collapse button. (4) Historical Forecast vs Actual — make it **expandable** (30% backdrop, collapses to same size); **remove the trend line**, add an **Average line** (same colour) tracking the per-period forecast/actual midpoint. (pending) When filters are collapsed, show the **filter icon next to the Workspace icon**.

**What was done**:
- **(pending 5.1 — done)** Collapsing filters now **hides the whole rail** and shows a **funnel button in the sidebar, immediately right of the Workspace toggle** (`.fc-toggle-row` holds both; `.fc-filter-reopen` shows only when `body.fc-filters-collapsed`). Clicking the funnel reopens the filters. Replaces the old 58px funnel-strip.
- **(1.1)** BTC Advisor Service Type is a **donut** (`donut-service`/`legend-service`) rendered via `renderDonut`; removed the bar chart + count badge.
- **(1.2)** Donut layout reverted to **row** (donut *beside* legend) at a full **112×140** so the pie isn't clipped; the one-row compactness comes from narrower columns, not a squashed height.
- **(1.3 / 4.1) Reusable expand moved into the engine** as `fcInitChartExpand([panelId…])` (`fcx-*`, 30% backdrop, fixed 640px card). BTC Advisor opts in its 5 chart panels; Historical opts in the FvA panel. **Reliable revert**: `fcxFit` resizes each axis independently via `setSize(w>1?w:undefined, h>1?h:undefined)` and a single shared timer (no stale re-sizes); close **hides the modal first**, then restores the element and fits to the reclaimed container. Verified grow→revert: region donut 140→445→140, LOB 170→506→170, FvA 210→523→210.
- **(2)** `fcN` now emits **K/M/B with en-US grouping** (adds B, forces `en-US`). BTC Advisor summary figures (calc boxes, comparison) use `fcN` (e.g. 10.42M); the weekly table uses `en-US` full numbers (editable), dropping all `en-IN`.
- **(3)** `.filter-reset` is now **26px tall** (flex-centred) to match the collapse button.
- **(4.2)** FvA "Trend" (regression via `fcTrendline`) → **"Average"** line = `round((forecast+actual)/2)` per period, colour kept `#dc2626`; legend + caption updated.

**Verified in-browser (0 console errors, live data)** + `python -m unittest` **15/15**:
Service is a pie (6 legend items); donut-wrap is `row` at 140px; `fcN` → 8.37M/587K/1.23B/940; calc shows 10.42M etc.; 5 `fcx-btn` on BTC Advisor, 0 on Dashboard; expand grows **and** reverts for donut + bar + FvA with a 30% backdrop; Reset = 26px = toggle; collapsing filters hides the rail and shows the funnel 6px right of the Workspace icon (same row), funnel-click reopens; FvA has Forecast/Actual/**Average** (no Trend), Average = midpoints. All pages `?v=11`.

---

## Session 39 — filter rail re-collapsed to primary/secondary groups; Dashboard "Forecast vs Target" panel names disambiguated
**Files**: `fc_engine.js`, `Dashboard — Forecast Copilot.html`.
**Prompt**: user reviewed a screenshot of the Dashboard's filter rail (all 12 filters always visible, no collapse) and asked to decongest it; separately flagged that Dashboard has two panels both titled "Forecast vs Target" — one a table (ASU/SR/Dispatch), one a bar chart whose subtitle said "SR & Dispatch" even though the chart itself already plots ASU too.

**What was done**:
- **Filter rail**: `fcWireFilterRailUI()`'s primary/secondary-grid + collapsible "More filters" mechanism already existed in the engine (built in an earlier session) but `FC_SECONDARY_FILTERS` was empty and `FC_PRIMARY_FILTERS` held all 12 keys — a deliberate prior choice (comment: *"Every filter is shown in the primary grid — no collapsible 'More filters'"*). Reversed that: `FC_PRIMARY_FILTERS` now holds the 6 filters touched every visit (`fy, quarter, region, lob, service, business`); the other 6 (`week, warranty, coreupsell, wotype, fqm, gcfa`) moved to `FC_SECONDARY_FILTERS`, collapsed behind "More filters" by default. Order within `FC_PRIMARY_FILTERS` was chosen so `service`'s `grid-column:span 2` lands on its own row (4 single-col items before it, so the 2-col grid has a clean row boundary) rather than leaving a gap next to a half-filled row.
- **Dashboard panel naming**: chart panel retitled **"Forecast vs Target — Chart View"** (was a duplicate of the table panel's title); subtitle corrected to **"ASU, SR & Dispatch, current quarter"** (was "SR & Dispatch, current quarter" — the chart's own `fcDrawGroupedBars` call already included ASU, only the caption was stale).

**Verified before push**: `node --check` on `fc_engine.js` + inline-script syntax check (`new Function`) on all 4 pages (Dashboard, Historical Performance, BTC Advisor, Final Forecast) — all clean. Confirmed all 4 pages render the identical 12 `data-filter` keys, so nothing is orphaned by the primary/secondary split. Traced `fcWireFilterRailUI`'s `addCols` DOM-append + CSS grid auto-placement by hand for the new key order (no jsdom/browser available this session): primary grid lays out as 2 rows of 2 (`fy`/`quarter`, `region`/`lob`), then `service` full-width, then `business` trailing alone in col 1 — no mid-grid gaps; secondary grid is a clean 3×2. Confirmed `fcFitDropdownToRail`'s dropdown positioning is computed live via `item.closest('.filter-rail')` + `getBoundingClientRect()`, so it's unaffected by which grid (primary/secondary) an item sits in. Checked no id collisions (`secondary-filters`, `more-filters-toggle` were previously-dead code paths, never rendered while `FC_SECONDARY_FILTERS` was empty).

---

## Session 40 — forecast_copilot_v2: BTC Advisor distribution layout rework (Region/Business row, full-width LOB, larger Service, no 'All')
**Files**: `BTC Advisor — Forecast Copilot.html` only (no engine change).
**Prompts**: (1.1.1) Region + Product Business donuts — **remove the 'All' slice**; make the **two panels equal** (Business was taller). (1.1.2) LOB — **must revert after expand**; move it **below** Region/Business as a **full-width** row (spanning Region's left edge to Business's right edge). (1.1.3) Service Type — **larger horizontally**, **legend below** the chart. (1.1.4) verify all visuals revert after expand.

**What was done**:
- Replaced the single 4-across `#dist-grid` with an explicit stack: a `grid-2 dist-top` row (Region | Product Business) → full-width `#panel-lob` → full-width `#panel-service`.
- **(1.1.1.1)** `renderDistribution` filters `'All'` out of the Region and Business shares (they already were for LOB/Service).
- **(1.1.1.2)** `.dist-top` uses `minmax(0,1fr)` columns + `align-items:stretch`, and `.dist-top .donut-wrap{height:150px}` — so both panels are identical width **and** height regardless of legend length.
- **(1.1.2.2)** LOB is now a standalone full-width `.panel` (viewBox 900×200), so it spans the same content width as the Region/Business row by construction. The single-Global-LOB drop still applies (`#panel-lob` hidden, chart skipped).
- **(1.1.3)** `#panel-service .svc-wrap` is `flex-direction:column` (legend **below** the donut); the donut is enlarged in its full-width panel.
- **(1.1.2.1 / 1.1.4)** Revert re-verified for every chart via the engine's `fcxFit` (`setSize` per-axis): region 140→445→140, business 140→430→140, **LOB 200→506→200**, service 230→430→230 — all grow in the modal and return to original size. Making LOB a full-width standalone panel also removes the grid-column ambiguity that made its width measurement flaky on close.

**Verified in-browser (0 console errors)**: legends show no 'All'; Region & Business panels equal; single Global LOB hides `#panel-lob`; all four charts expand and revert. (No engine edit → no `?v` bump.)

---

## Session 41 — forecast_copilot_v2: Service Type moved to a right-hand column
**Files**: `BTC Advisor — Forecast Copilot.html` only (no engine change).
**Prompts**: (1) BTC Distribution by Service Type — move it to the **right of all the other visuals**; shorten the others horizontally to make room. (2) fix the missing gap between the bottom visual and the Forecast Table.
**What was done**: Wrapped Region/Business (the `dist-top` grid) + LOB in a `.dist-left` block and placed it beside `#panel-service` in a two-column `.dist-main` grid (`minmax(0,2.1fr) minmax(0,1fr)`, `align-items:stretch`). Service is now a **tall right column spanning the full height** of the left stack (Region/Business row + LOB); the left visuals are correspondingly narrower. Service keeps its legend-below layout, vertically centred in the tall panel (`#panel-service` flex column, `.svc-wrap{flex:1;justify-content:center}`), legend stacked. The two columns' bottom panels have `margin-bottom:0` for alignment, so `.dist-main` was given `margin-bottom:16px` to restore the gap before the Forecast Table.
**Verified in-browser (0 console errors)**: 2-track grid; Service panel height (590) = Region/Business row (279) + LOB (295) + gap → spans full height on the right; Region & Business still equal (279 each); all charts expand and revert; 16px gap between `.dist-main` and the Forecast Table. (No engine edit → no `?v` bump.)

## Session 42 (hn-new) — BTC Advisor: two-stage adjustment flow (APOS + Renewals → ASU → SR & Dispatch)
**Branch**: committed to **`hn-new` only** (owner: "commit to hn-new only, not on master").
**Files**: `BTC Advisor — Forecast Copilot.html` only (no engine change → engine stays `?v=11`).
**Prompt**: build a BTC-adjustment flow — Step 1 adjusts APOS (= "new contracts") + Renewals to give ASU (ASU = APOS + Renewals); that ASU feeds SR + Dispatch, which get a second round of adjustment. Drop "BTC" from the distribution headings; show APOS/Renewals controls + counts with ASU below (visuals adjust with the selection); move the BTC selector right and remove its ASU/SR/Dispatch boxes; after adjusting, show ASU + SR/Dispatch controls with counts; forecast table reflects the selection.
**Clarified (AskUserQuestion)**: Step-1 levers = APOS (new contracts) + Renewals; controls = sliders with live counts; BTC uplift stays a separate headline bend applied on top.

**What was built** (page-local; no shared-engine edit):
- **Step 1 (top-left)**: APOS + Renewals sliders (−50…+50% vs baseline) with live counts + baselines; prominent **ASU = APOS + Renewals** box. At 0% the figures equal the slice's real baseline.
- **BTC Selector (top-right)**: moved right; Adjusted ASU/SR/Dispatch boxes removed (keeps BTC-uplift slider + Selected BTC + AOP note + save-scenario).
- **Step 2**: shows the Step-1 ASU, then SR + Dispatch sliders with counts (SR derives from adjusted ASU by the slice's SR/ASU ratio then its own ±%; Dispatch derives from adjusted SR by the Dispatch/SR ratio then its own ±%).
- **Distribution visuals**: "BTC" dropped from all five headings; donuts/bars distribute the Step-1 adjusted ASU (LOB series relabelled BTC→ASU).
- **Persistence**: four adjustment %s (`aposAdjPct`/`renewAdjPct`/`srAdjPct`/`dspAdjPct`) in `fcState` (whole-object persistence). Scenarios / comparison / editable weekly table / chart-expand preserved.

**Branch-divergence note**: this branch does **not** have master's separate "Session 42 — ASU = APOS + Renewals data model" (workbook APOS/Renewals columns + `serve.py` schema + Excel-safe reader), which the owner put on `master` only. So here `stageFigures()` has no real `realApos`/`realRenewals` and uses an **80/20 fallback** of ASU — the flow still works and will automatically switch to the real columns if that data-model change is ever merged into this branch. A future merge of the two branches will need to reconcile the two distinct "Session 42" entries.

**Verified** (served live in the `hn-new/` clone, 0 console errors): baseline APOS + Renewals = ASU; adjusting APOS/Renewals flows to ASU→SR→Dispatch; SR/Dispatch sliders chain; filters re-drive figures; layout (Step 1 left / BTC right / Step 2 3-col) and stripped headings confirmed; `python -m unittest` unaffected.
