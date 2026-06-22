# Prompt Trail — ISG BPA
> Chronological log of every major request and what was built/fixed. Update after each session.
> Last updated: 2026-06-18

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

## Session 5 — What-If Simulation Rebuild
**What was rebuilt**:
- Monthly axis Feb→Jan, band-fill area charts
- 3 sliders: APOS Renewal Rate / New Contracts Growth / Forecast Modifier
- Renewed Units Override with en-IN comma formatting
- `wiCompute()` calibrated to +8.6% ASU lift at defaults

---

## Session 6 — Slider → Chart Fix
**Root cause**: Chart.js destroy+recreate on every `oninput` corrupted canvas context.
**Fix**: Smart in-place update — if instances exist, update `.data.datasets[1].data` + `.update('none')`.

---

## Session 7 — Push prompt.md Only
Committed and pushed only `prompt.md` from lovable AI format folder; PNG screenshots excluded.

---

## Session 8 — IMP_DOCS Created
**Files**: `IMP_DOCS/HANDOFF.md`, `DESIGN_SYSTEM.md`, `TECHNICAL.md`, `PROMPT_TRAIL.md`
Replaced stale root-level handoff files with 4 focused docs in `IMP_DOCS/`.

---

## Session 9 — IBP Restructure: Actuals Profiling + CLAUDE.md
**Files**: `IBP_Forcasting.html`, `CLAUDE.md`
**Prompts**:
- Remove Demand Planning Alerts tile from landing page
- Rename Demand Profiling → Actuals Profiling
- Remove Field Services, Care, Contracts Forecast, APOS, SR, Dispatch channel tabs

**What was done**:
- Demand Planning Alerts tile removed from home (module HTML/JS kept but inaccessible)
- Module renamed to "Actuals Profiling" in tile, nav, JS modules config
- All 6 non-Overall channel tabs removed: HTML divs, chart inits, update functions, data constants all pruned
- `FILTER_AWARE_CHARTS`, `switchChannel`, `applyAllFilteredCharts` cleaned up
- `CLAUDE.md` added to repo root as Claude Code guidance file

---

## Session 10 — LOB Filter + ASU/Dispatch/SR Tabs
**Files**: `IBP_Forcasting.html`
**Prompts**:
- Remove Partner Name filter (Dell/OSP), add LOB filter with ISG/ESG/HES
- Add channel tabs: ASU, Dispatch, SR to Actuals Profiling

**What was done**:
- Partner Name filter dropdown removed; LOB dropdown (ISG/ESG/HES) added in its place
- `LOBS` constant updated from `['Field Services','Remote Support','Managed Services','Care']` to `['ISG','ESG','HES']`
- `getFilteredRawData()` updated to filter by `active.lob` instead of `active.partner`
- Channel tab bar restored with 4 tabs: Overall, ASU, Dispatch, SR
- **ASU tab**: 4 KPIs + 4 charts (Overall ASU Monthly Trend in millions, New Contracts Trend, APOS Renewal bar+rate line, Decline Analysis)
- **Dispatch tab**: 4 KPIs + Monthly Trend + Region Wise charts
- **SR tab**: 4 KPIs + Monthly Trend + Region Wise charts
- All new charts filter-aware; base data constants added (`AP_ASU_TREND_BASE`, `AP_NEW_CONTRACTS_BASE`, `AP_APOS_BASE`, `AP_DECLINE_BASE`, `AP_DSP_TREND_BASE`, `AP_SR_TREND_BASE`)
- APOS Renewal chart uses mixed bar+line with dual Y-axes (units left, rate% right)

---

## Session 11 — What-If Slider Reorder + Data Raw Rename
**Files**: `IBP_Forcasting.html`
**Prompts**:
- Reorder What-If sliders: New Contract Growth first, APOS Renewal second
- Rename Data Raw → Data Management
- Update What-If tile stat to show lever names instead of "6 levers · 5 scenarios"

**What was done**:
- `WI_SLIDERS` array reordered: growth (index 0), renewal (index 1)
- Tile stat updated to: `New Contract Growth · APOS Renewal`
- `modules['data-raw'].title` → `'Data Management'`; home tile title updated to match

---

## Session 12 — Remove Forecast Modifier + Hide Filters in What-If
**Files**: `IBP_Forcasting.html`
**Prompts**:
- Remove Forecast Modifier slider from What-If
- Hide Filters button when in What-If Simulation
- Rename Data Raw → Data Management (confirmed from Session 11)

**What was done**:
- `WI_SLIDERS`: removed `{ key:'modifier', ... }` entry
- `wiState`: removed `modifier: 2`
- `wiCompute()`: removed all `st.modifier` terms from asuMult, whatifSR, whatifDisp formulas
- Saved scenarios: `modifier` property removed from all 5 defaults + save/load code
- Filter toggle button given `id="filter-toggle-btn"` for targeting
- `openDashboard()`: hides filter button + auto-collapses right panel when `moduleId === 'whatif'`; restores button for all other modules

---

## Session 13 — Universal Filter Enforcement + KPI Sanity
**Files**: `IBP_Forcasting.html`
**Prompts**:
- Filters not working for ASU/Dispatch/SR (Month filter not updating charts)
- Filter should reset when switching channel tabs
- KPI cards showing invalid values like "110% accuracy"

**Root causes**:
1. All chart update functions only checked `mult === 0` (FY empty) — Quarter, Month, Region empty states were silently ignored
2. `switchChannel()` had no filter reset
3. `triggerDataUpdate()` fluctuated % values by ±10% with no cap, and didn't handle `M` suffix values

**What was fixed**:
- Added `shouldHideAll()` — returns `true` if any of FY/Quarter/Month/Region has 0 items selected
- Added `getSelectedQuarters()` — returns selected quarter labels for QoQ chart rendering
- Added `getSelectedFiscalMonthIndices()` + `AP_MONTHS`/`Q_MONTH_IDX`/`M_LABEL_IDX` constants — maps Q/M filter to 0–11 month indices in 12-month Feb→Jan data arrays
- **Every chart update function** now calls `shouldHideAll()` — sets empty labels+data arrays when true
- `updateDPOverallQoQChart()`: now renders only selected quarters as bars
- `updateDPOverallMoMChart()`: now uses `getSelectedFiscalMonthIndices().filter(i < 6)` to slice M1–M6 data
- All 6 AP update functions use `getSelectedFiscalMonthIndices()` + `shouldHideAll()`
- `switchChannel()`: calls `resetFilters()` before showing new channel — fresh filter state on every tab switch
- `triggerDataUpdate()`: % values capped 0–99.9%, `M` suffix handled (was collapsing `1.47M` → `1`), signed values (`+4.8%`) skipped, variance reduced from ±10% to ±5%
