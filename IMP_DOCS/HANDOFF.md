# HANDOFF — ISG BPA Project
> Quick-start context for any new AI session or teammate.
> Last updated: 2026-06-18 | Owner: Arnav Bhargava (arnav.bhargava@alignedautomation.com)

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
| `IBP_Forcasting.html` | **Main dashboard** — 5 modules including What-If Simulation |
| `bend_the_curve.html` | Goal-first strategic planning with lever toggles |
| `dell_workflow.html` | Dell workflow simulation (standalone) |
| `CLAUDE.md` | Claude Code guidance for this repo |
| `IMP_DOCS/` | This folder — always keep updated |

Legacy (do not delete, just ignore): `epic_dashboard_mockup.html`, `executive_forecast_operational_dashboard.html`, `simulation-overview-platform.html`, `enterprise_whatif_forecasting_platform.html`

---

## Modules Inside IBP_Forcasting.html

| moduleId | HTML div | Title | Sub-pages |
|---|---|---|---|
| `forecast-accuracy` | `#module-forecast-accuracy` | Forecast Accuracy | Forecast Overview, Weekly Actuals & Metrics, Location & Partner View |
| `demand-profiling` | `#module-demand-profiling` | **Actuals Profiling** | Profiling Overview (channel tabs: Overall, ASU, Dispatch, SR) |
| `demand-alerts` | `#module-demand-alerts` | Demand Planning Alerts | Alerts Log (module exists but tile removed from home) |
| `data-raw` | `#module-data-raw` | **Data Management** | Full Raw View |
| `whatif` | `#module-whatif` | What-If Simulation | Simulation Controls, Scenario Playground, Forecast Publish |

---

## Actuals Profiling — Channel Tabs

| Channel key | HTML div | Content |
|---|---|---|
| `overall` | `#dp-channel-overall` | ISG Region Wise, QoQ, MoM, WoW charts |
| `asu` | `#dp-channel-asu` | ASU Monthly Trend (M), New Contracts Trend, APOS Renewal, Decline Analysis |
| `dsp` | `#dp-channel-dsp` | Dispatch Monthly Trend + Region Wise |
| `sr` | `#dp-channel-sr` | SR Monthly Trend + Region Wise |

Filters reset (`resetFilters()`) on every channel tab switch.

---

## What-If Simulation — Key Config

```js
const WI_SLIDERS = [
  { key:'growth',  label:'New Contracts Growth', min:-20, max:50,  step:1,   val:8    },
  { key:'renewal', label:'APOS Renewal Rate',    min:70,  max:100, step:0.5, val:89.5 },
  // Forecast Modifier removed
];
let wiState = { renewal:89.5, growth:8, unitsOverride:'' };
```

- Filters button hidden when What-If is active (auto-closes panel on open)
- Default sliders produce ~7.6% ASU lift (was 8.6% when Forecast Modifier existed)

---

## Filter System

### Active Filters
All filter groups use checkbox inputs in `#filter-container` with `data-group` attributes. `getActiveFilters()` returns `undefined` for a group when "(All)" is checked, and `[]` when nothing is checked.

### Filter Groups
| Group | Values | Notes |
|---|---|---|
| `fy` | FY25, FY26, FY27 | No (All) — FY26 checked by default |
| `quarter` | Q1, Q2, Q3, Q4 | No (All) — Q1 checked by default |
| `month` | All, M1–M6 | (All) checked by default |
| `week` | All, W1–W52 | (All) checked by default |
| `region` | All, AMER, EMEA, APJ | (All) checked by default |
| `subregion` | All + 7 values | (All) checked by default |
| `lob` | All, ISG, ESG, HES | (All) checked by default — replaces old Partner filter |
| `location` | All + 4 values | (All) checked by default |
| `queue` | All + 4 values | (All) checked by default |

### Universal Hide Rule
`shouldHideAll()` returns `true` if **any** of FY, Quarter, Month, or Region has 0 items selected. Every chart calls this — if it returns true, chart goes blank.

### Key Filter Helpers
- `getActiveFYMultiplier()` — returns 0 if no FY selected, else avg of FY_SCALE values
- `getSelectedWeekIndices()` — returns 0-based week indices from Q/M/W filters (for WoW charts)
- `getSelectedFiscalMonthIndices()` — returns 0-based month indices 0–11 in 12-month Feb→Jan array (for AP monthly charts)
- `getSelectedQuarters()` — returns selected quarter labels ['Q1',...] (for QoQ charts)
- `shouldHideAll()` — universal empty-filter guard

---

## Git Workflow

```powershell
$git = "C:\Users\arnav.bhargava\AppData\Local\Programs\Git\bin\git.exe"
& $git add <files>
& $git commit -m "message"
& $git stash                        # stash any unstaged changes
& $git pull --rebase origin master  # CRITICAL — GH Actions auto-commits manifest.json
& $git stash pop
& $git push origin master
```

**Always stash → pull --rebase → stash pop → push.** GitHub Actions auto-commits `manifest.json` after every push.

---

## Current State (2026-06-18)

- `IBP_Forcasting.html` — all changes pushed and live
- `BPA_FORCASTING_MOCK.HTML` — has local uncommitted changes (unrelated, pre-existing)
- `TODO` — untracked file, unknown content
- All filter logic fully enforced across all charts
- CLAUDE.md added to repo root

---

## New AI Session — Paste This
```
Project: ISG BPA dashboard — Aligned Automation Services
Repo: D:\OneDrive - Aligned Automation Services Private Limited\Documents\simulations
Live: https://aabh-ai.github.io/SIMULATION_Example/
Main file: IBP_Forcasting.html
Git binary: C:\Users\arnav.bhargava\AppData\Local\Programs\Git\bin\git.exe (not in PATH)
Git workflow: stash → pull --rebase origin master → stash pop → push

Modules: Forecast Accuracy | Actuals Profiling (Overall/ASU/Dispatch/SR tabs) |
         Demand Alerts (tile removed from home, module exists) |
         Data Management | What-If Simulation

Filters: shouldHideAll() guards all charts. LOB filter = ISG/ESG/HES.
What-If: 2 sliders only (New Contracts Growth, APOS Renewal Rate). No Forecast Modifier.

Read IMP_DOCS/ for full context before making changes.
```
