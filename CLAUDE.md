# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**ISG BPA: Business Planning and Analytics** is a static HTML/CSS/JavaScript dashboard suite for demand forecasting and supply chain simulation at Aligned Automation Services. The project is hosted on GitHub Pages and requires no backend or build process.

- **Live site**: https://aabh-ai.github.io/SIMULATION_Example/
- **Repo**: https://github.com/AABH-AI/SIMULATION_Example
- **Branch deployed**: `master` (GitHub Pages serves from master)
- **Owner**: Arnav Bhargava (arnav.bhargava@alignedautomation.com)

---

## Repository Structure

### Active Files

| File | Purpose |
|------|---------|
| `IBP_Forcasting.html` | **Main dashboard** — 5 modules with 2,950 lines of embedded CSS/JS |
| `index.html` | Landing page — Primary Tools grid plus searchable All Modules list |
| `bend_the_curve.html` | Goal-first strategic planner with 8 lever toggles and target slider |
| `enterprise_whatif_forecasting_platform.html` | Standalone What-If reference (don't edit; local-only — gitignored for compliance, not deployed) |

### Documentation (Always Keep Updated)

| File | Content |
|------|---------|
| `IMP_DOCS/HANDOFF.md` | Quick-start for new sessions — active files, module structure, recent work |
| `IMP_DOCS/DESIGN_SYSTEM.md` | CSS tokens, typography, Chart.js patterns, number formatting |
| `IMP_DOCS/TECHNICAL.md` | Architecture, router functions, What-If simulation spec, Git workflow, known issues |
| `IMP_DOCS/PROMPT_TRAIL.md` | Chronological log of every major feature built and why |

### Legacy Files (Don't Delete; Ignore)

`epic_dashboard_mockup.html`, `executive_forecast_operational_dashboard.html`, `simulation-overview-platform.html`, and others from early prototypes.

### Build & Deployment

| File | Purpose |
|------|---------|
| `scripts/updateManifest.js` | Node.js script that auto-generates `manifest.json` with all HTML metadata. Runs via GitHub Actions post-push. |
| `package.json` | Minimal — only `"scripts": { "update-manifest": "node scripts/updateManifest.js" }` |
| `manifest.json` | Auto-generated; lists all HTML files. Do not edit manually. |

---

## Architecture: IBP_Forcasting.html

### Module System

The dashboard is built on a **module + page** router pattern. Each module has one or more sub-pages:

```javascript
const modules = {
  'forecast-accuracy': { 
    title: 'Forecast Accuracy',
    pages: [
      { id: 'fa-page-overview', label: 'Forecast Overview' },
      { id: 'fa-page-actuals', label: 'Weekly Actuals & Metrics' },
      { id: 'fa-page-partner', label: 'Location & Partner View' }
    ]
  },
  'whatif': { 
    title: 'What-If Simulation',
    pages: [
      { id: 'wi-page-sim', label: 'Simulation Controls' },
      { id: 'wi-page-scenarios', label: 'Scenario Playground' },
      { id: 'wi-page-publish', label: 'Forecast Publish' }
    ]
  }
  // ... five modules total: forecast-accuracy, demand-profiling, demand-alerts, data-raw, whatif
};
```

**Router functions**:
- `openDashboard(moduleId)` — Activates a module, renders left nav with its pages, updates breadcrumb
- `switchPage(pageId, linkEl, moduleId, label)` — Shows/hides sub-pages within the active module

**State variables**:
- `activeModule` — Current module ID (string)
- `activePageLabel` — Current page label (string)

### Chart Management

Two separate chart instance stores (critical architectural detail):

- `chartInstances = {}` — Holds Chart.js 4.4.1 instances for Forecast Accuracy, Demand Profiling, Alerts, Raw Data
- `wiCharts = {}` — Holds Chart.js instances for What-If Simulation module only

**When updating charts on theme toggle or filter change, both stores must be iterated.** Missing `wiCharts` iteration is a documented bug pattern.

### Filter & State Management

Filters are **checkbox form inputs** in `#filter-container` with `data-group` attributes:

```html
<input type="checkbox" data-group="region" value="AMER" onchange="onFilterChange()">
<input type="checkbox" data-group="fy" value="FY26" checked onchange="onFilterChange()">
```

**Reading active filters**:
```javascript
function getActiveFilters() {
  const groupState = {};
  document.querySelectorAll('#filter-container input[type=checkbox]:checked').forEach(cb => {
    const group = cb.dataset.group;
    if (!groupState[group]) groupState[group] = [];
    groupState[group].push(cb.value);
  });
  return groupState;
}
// Returns: { region: ['AMER', 'EMEA'], fy: ['FY26'], quarter: ['Q1', 'Q2'], ... }
```

**Applying filters**:
1. User checks/unchecks checkbox → `onFilterChange()` fires
2. Calls `applyAllFilteredCharts()` 
3. Each filter-aware chart's update function (e.g., `updateFAOverviewChart()`) reads current state via `getActiveFilters()` and re-renders

**Related helpers**:
- `getActiveFYMultiplier()` — Averages FY multipliers (FY26=1.0, FY27=1.08) for trend scaling
- `getSelectedWeekIndices()` — Returns array of week indices (0–51) respecting quarter/month/week filters
- `FILTER_AWARE_CHARTS` — Set of all chart IDs that respond to filter changes

### Data & Trends

All data is **mock-generated client-side**:

- `rawData` — Array of 150 records with fields: region, subregion, partner, location, queue, LOB, fiscal period, metrics (SR, FASU, TASU, FDSR)
- Generated on page load via `generateRawData()` using random sampling from predefined arrays
- `TREND_DATA_52` — Object with 52-week trend arrays for all chart types (e.g., `'fa-asu'`, `'dp-ov-forecast'`)
- Trends generated via `_makeTrend(base, variance, offset)` helper for realistic week-to-week fluctuation

**Filter-aware chart pattern**:
1. Chart update function calls `getActiveFilters()`, `getActiveFYMultiplier()`, `getSelectedWeekIndices()`
2. Filters data/trends accordingly
3. Updates chart via `.data.labels = ...` and `.data.datasets[i].data = ...`
4. Calls `.update()` to re-render

### Theme (Fixed to Light)

Theme is **permanently white/light**. No dark mode, no toggle button.

```javascript
let isDark = false;  // hardcoded
```

CSS `:root` tokens are light-themed; the `[data-theme="light"]` block has been removed. Light values are the single source of truth.

---

## What-If Simulation Module (Deep Dive)

Located inside `IBP_Forcasting.html`, moduleId: `'whatif'`. Sub-pages: Simulation Controls, Scenario Playground, Forecast Publish.

### Base Constants & Sliders

```javascript
const WI_BASE = {
  asu: 1350000, sr: 587000, disp: 233700,
  renewalOppQty: 284500, baseRenewalRate: 85.3,
  renewedUnits: 242678, newContracts: 73140,
};

const WI_SLIDERS = [
  { key:'renewal',  label:'Renewal Rate',    min:70,  max:100, step:0.5, val:89.5 },
  { key:'growth',   label:'New Contracts Growth',  min:-20, max:50,  step:1,   val:8    },
  { key:'modifier', label:'Forecast Modifier',     min:-15, max:25,  step:1,   val:2    },
];

let wiState = { renewal:89.5, growth:8, modifier:2, unitsOverride:'' };
```

Monthly seasonality arrays: `WI_MONTHS` (Feb–Jan), `WI_ASU_SHAPE`, `WI_SR_SHAPE`, `WI_DISP_SHAPE`.

### Compute Formula

```javascript
function wiCompute(st) {
  const rRate = st.renewal / 100;
  const baseR = WI_BASE.baseRenewalRate / 100;
  const asuMult = 1 + (st.growth/100)*0.8 + (st.modifier/100)*0.5 + (rRate/baseR-1)*0.25;
  const whatifASU = Math.round(WI_BASE.asu * asuMult);
  // ... SR, Dispatch, renewals, contracts calculations
  return { whatifASU, whatifSR, whatifDisp, asuDelta, srDelta, dispDelta, growthPct, ... };
}
```

**Calibrated**: Default slider values produce **+8.6% ASU lift** → 1,466,100 ASU.

### Chart Update Pattern

**Do not destroy/recreate charts on slider drag** — causes canvas corruption at 60fps.

```javascript
function wiRenderCharts() {
  const d = _wiChartData();
  if (wiCharts['wi-chart-asu'] && wiCharts['wi-chart-sr'] && wiCharts['wi-chart-dp']) {
    // In-place update — instant, no flicker
    wiCharts['wi-chart-asu'].data.datasets[1].data = d.asuAdj;
    wiCharts['wi-chart-asu'].update('none');  // 'none' = no animation
    // ... repeat for other charts
    return;
  }
  // First render: create from scratch with Chart constructor
}
```

Use `.update('none')` for instant re-render without animation.

---

## Design System

### Fonts

- **UI/Display**: Plus Jakarta Sans (weights 300–800)
- **Numbers/Mono**: IBM Plex Mono (weights 400–600)

Loaded via Google Fonts CDN.

### CSS Tokens (Light Theme Only)

```css
--bg: #f0f3fc;              /* Page background */
--surface: #ffffff;         /* Panels, cards */
--card: #ffffff;
--card-hi: #eef1fc;         /* Hover state */
--border: #dde2f4;
--border-hi: #b4bde8;
--text-1: #0d1020;          /* Primary text */
--text-2: #5a6280;          /* Secondary */
--text-3: #9099be;          /* Muted */
--accent: #3a6ef0;          /* Blue (ISG BPA accent) */
--green: #16a34a;           /* Success */
--red: #dc2626;             /* Error, alert */
--amber: #b45309;           /* Warning */
--purple: #6d28d9;          /* What-If accent */
--nav-bg: #ffffff;
--nav-hover: #eef1fc;
```

### Charts (Chart.js 4.4.1)

- **No pie/donut charts** (by design constraint — use horizontal bar charts instead)
- **Band fill**: `fill: '-1'` creates filled area between dataset 0 and current dataset
- **Theme update**: Call `updateChartTheme(chartInstance)` then `.update()` for both `chartInstances` and `wiCharts`
- **Filter updates**: Use `.update('none')` for instant re-render without animation

### Icons

Tabler Icons via CDN. Examples: `ti-moon`, `ti-sun`, `ti-home`, `ti-adjustments-horizontal`, `ti-chevron-down`.

### Number Formatting

Use Indian comma format (5,00,000 not 500,000):
```javascript
n.toLocaleString('en-IN')
```

For inputs accepting commas: `type="text" inputmode="numeric"`, NOT `type="number"`.

---

## Git Workflow

### Setup

Git is NOT in PATH. Use explicit binary:

```powershell
$git = "C:\Users\arnav.bhargava\AppData\Local\Programs\Git\bin\git.exe"
cd "D:\OneDrive - Aligned Automation Services Private Limited\Documents\simulations"
```

### Standard Workflow

```powershell
& $git add <files>
& $git commit -m "message"
& $git pull --rebase origin master   # CRITICAL: GH Actions auto-commits manifest.json
& $git push origin master
```

**Always `git pull --rebase origin master` before push.** GitHub Actions auto-commits `manifest.json` after each push.

### Post-Push Automation

GitHub Actions runs `npm run update-manifest` on every successful push. This auto-generates and commits `manifest.json` with all HTML file metadata.

---

## Common Operations

### Adding a New Dashboard Page

1. Create new HTML file with proper structure: import fonts, use CSS tokens, embed Chart.js
2. Commit and push — manifest.json auto-updates
3. (Optional) Add card link to `index.html`

### Modifying a Filtered Chart

1. Locate chart HTML: `<canvas id="chart-id"></canvas>`
2. Find chart init: `chartInstances['chart-id'] = new Chart(...)`
3. Create/update filter-aware update function
4. Add chart ID to `FILTER_AWARE_CHARTS` set
5. Call update function from `applyAllFilteredCharts()`

### Modifying What-If Sliders

1. Update `WI_SLIDERS` array
2. Update `wiState` object keys
3. Update `wiCompute()` formula
4. Update all render functions: `wiRenderKPIs()`, `wiRenderImpact()`, `wiRenderPipeline()`, `wiRenderCharts()`
5. Test slider drag and verify outputs update

---

## Known Issues & Workarounds

| Issue | Cause | Fix |
|-------|-------|-----|
| Chart doesn't update on filter | Chart ID missing from `FILTER_AWARE_CHARTS` | Add ID to set, call update function from `applyAllFilteredCharts()` |
| What-If charts unchanged on theme toggle | `toggleTheme()` only updated `chartInstances` | Iterate both stores with `.forEach()` loops |
| Sliders corrupt canvas | Chart.js destroy+recreate on every `oninput` | Use in-place update: `.data.datasets[1].data = newData; .update('none')` |
| WoW chart shows unexpected week range | `getSelectedWeekIndices().slice(0,9)` takes first 9 of filtered weeks | Intentional; document in feature request |
| Light theme nav still dark | `[data-theme="light"]` block had dark nav tokens | Ensure `:root` is single source of truth |
| Permission denied on `.git/objects` | NTFS ACL issue | Run: `icacls .git\objects /grant "${env:USERNAME}:(OI)(CI)F" /T` |

---

## Future Work (Not Yet Committed)

- Connect `wiCompute()` to real backend data (currently all mock)
- Scenario Save/Load to localStorage
- Fill `wi-page-publish` (Forecast Publish sub-page — scaffolded but empty)
- Dynamic KPI cards that respond to filter selections
- Mobile-responsive breakpoints
- User authentication layer
- Export to PDF from What-If results

---

## Recording Session Work

After completing substantial features or fixes, add a new session block to `IMP_DOCS/PROMPT_TRAIL.md`:

```markdown
## Session N — [Feature Name]
**Files**: [list of modified files]
**Prompts**: [user requests]

**What was done**:
- [bullet point]

**Root cause** (if fixing a bug): [explanation]
**Fix**: [what changed]
```

This creates a searchable history for future sessions.
