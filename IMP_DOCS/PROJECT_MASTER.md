# ISG BPA — Project Master Document
> Single source of truth for AI context, handoffs, and model switches.
> Last updated: 2026-06-16 | Owner: Arnav Bhargava (arnav.bhargava@alignedautomation.com)

---

## 1. Project Identity

| Field | Value |
|---|---|
| Full name | **ISG BPA: Business Planning and Analytics** |
| Company | Aligned Automation Services Private Limited |
| GitHub repo | https://github.com/AABH-AI/SIMULATION_Example |
| Live URL | https://aabh-ai.github.io/SIMULATION_Example/ |
| Branch | `master` (GitHub Pages served from master) |
| Deployment | GitHub Actions auto-commits `manifest.json` on every push |

---

## 2. File Map

| File | Purpose | Status |
|---|---|---|
| `index.html` | Landing page — Primary Tools grid + searchable All Modules list | Active |
| `IBP_Forcasting.html` | Main dashboard — 4 original modules + What-If Simulation module | Active (primary) |
| `enterprise_whatif_forecasting_platform.html` | Standalone What-If Simulation (separate file) | Active |
| `bend_the_curve.html` | Goal-first strategic planning tool with lever toggles | Active |
| `dell_workflow.html` | Dell workflow simulation | Secondary |
| `epic_dashboard_mockup.html` | Legacy Supply Chain Goliath mockup | Legacy |
| `executive_forecast_operational_dashboard.html` | Legacy executive dashboard | Legacy |
| `simulation-overview-platform.html` | Overview platform | Secondary |
| `IMP_DOCS/PROJECT_MASTER.md` | **This file** | Always update |

---

## 3. Design System (Indigo-Black)

### CSS Custom Properties

```css
:root {
  /* Backgrounds */
  --bg: #07090f;
  --surface: #0d1018;
  --card: #111521;
  --card-hi: #161c2c;

  /* Borders */
  --border: #1d2135;
  --border-hi: #2c3460;

  /* Text */
  --text-1: #e9ecf7;   /* primary */
  --text-2: #6b758f;   /* secondary */
  --text-3: #3a4060;   /* muted / disabled */

  /* Accent palette */
  --accent: #4c7ef8;
  --accent-dim: rgba(76,126,248,0.08);
  --blue: #4c7ef8;     --blue-dim: rgba(76,126,248,0.08);
  --green: #22d472;    --green-dim: rgba(34,212,114,0.10);
  --red: #f06060;      --red-dim: rgba(240,96,96,0.10);
  --amber: #f0a830;    --amber-dim: rgba(240,168,48,0.10);
  --purple: #9d78f0;

  /* Nav */
  --nav-bg: #0a0c16;
  --nav-hover: #13172a;

  /* Typography */
  --font-ui: 'Plus Jakarta Sans', sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
}

/* Light theme overrides — MUST cover every dark token */
[data-theme="light"] {
  --bg: #f0f3fc;
  --surface: #ffffff;
  --card: #ffffff;
  --card-hi: #eef1fc;
  --border: #dde2f4;
  --border-hi: #b4bde8;
  --text-1: #0d1020;
  --text-2: #5a6280;
  --text-3: #9099be;
  --accent: #3a6ef0;
  --accent-dim: rgba(58,110,240,0.07);
  --blue: #3a6ef0;     --blue-dim: rgba(58,110,240,0.07);
  --green: #16a34a;    --green-dim: rgba(22,163,74,0.09);
  --red: #dc2626;      --red-dim: rgba(220,38,38,0.09);
  --amber: #b45309;    --amber-dim: rgba(180,83,9,0.09);
  --purple: #6d28d9;
  --nav-bg: #ffffff;       /* KEY — was accidentally #0f1328 */
  --nav-hover: #eef1fc;    /* KEY — was accidentally #1a2040 */
}
```

### Fonts
- **Display/UI**: Plus Jakarta Sans (weights 400, 500, 600, 700, 800) — Google Fonts CDN
- **Monospace / KPI numbers**: IBM Plex Mono — Google Fonts CDN

### Chart.js Version
`4.4.1` via CDN. Area band fills use `fill: '-1'` (fill to the dataset below).

---

## 4. IBP_Forcasting.html — Architecture

### Module Router
```js
openDashboard(moduleId)   // sets active module, updates breadcrumb, nav highlight
switchPage(pageId)         // shows/hides sub-pages within a module
```

### Modules
| moduleId | Title | Sub-pages |
|---|---|---|
| `forecast` | Forecast Accuracy | tech-asu, workorders, regional |
| `demand` | Demand Profiling | profiling, segmentation |
| `alerts` | Demand Planning Alerts | active-alerts, resolved |
| `raw` | Data Raw | raw-data |
| `whatif` | What-If Simulation | wi-page-sim, wi-page-scenarios, wi-page-publish |

### Module Init Pattern
```js
if (moduleId === 'whatif') { setTimeout(wiInit, 80); }
else { setTimeout(initCharts, 80); }
```
Chart instances live in `chartInstances` (original modules) and `wiCharts` (What-If module).

### Theme Toggle
```js
function toggleTheme() {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  document.getElementById('theme-icon').className = isDark ? 'ti ti-moon' : 'ti ti-sun';
  // MUST update BOTH chart stores:
  Object.values(chartInstances).forEach(c => { if(c) { updateChartTheme(c); c.update(); }});
  Object.values(wiCharts).forEach(c => { if(c) { updateChartTheme(c); c.update(); }});
}
```

---

## 5. What-If Simulation — Full Spec

### Base Constants
```js
const WI_MONTHS = ['Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan'];
const WI_BASE = {
  asu: 1350000, sr: 587000, disp: 233700,
  renewalOppQty: 284500, baseRenewalRate: 85.3,
  renewedUnits: 242678, newContracts: 73140, asuContrib: 612.4e6,
};

// Seasonal shapes (multiply by base/12 to get monthly value)
const WI_ASU_SHAPE  = [0.756,0.793,0.831,0.815,0.800,0.808,0.816,0.920,1.020,1.095,1.148,1.125];
const WI_SR_SHAPE   = [0.970,1.020,0.985,0.880,0.815,0.780,0.815,0.969,1.055,1.122,1.156,1.190];
const WI_DISP_SHAPE = [0.850,0.910,0.870,0.800,0.755,0.755,0.800,0.950,1.055,1.105,1.155,1.200];
```

### Sliders
```js
const WI_SLIDERS = [
  { key:'renewal',  label:'APOS Renewal Rate',    min:70,  max:100, step:0.5, val:89.5, fmt: v => v.toFixed(1)+'%' },
  { key:'growth',   label:'New Contracts Growth',  min:-20, max:50,  step:1,   val:8,    fmt: v => (v>=0?'+':'')+v+'%' },
  { key:'modifier', label:'Forecast Modifier',     min:-15, max:25,  step:1,   val:2,    fmt: v => (v>=0?'+':'')+v+'%' },
];
let wiState = { renewal:89.5, growth:8, modifier:2, unitsOverride:'' };
```

### Compute Formula (calibrated: defaults → +8.6% ASU lift, 629K SR, 247K dispatches)
```js
function wiCompute(st) {
  const rRate = st.renewal / 100, baseR = WI_BASE.baseRenewalRate / 100;
  const asuMult = 1 + (st.growth/100)*0.8 + (st.modifier/100)*0.5 + (rRate/baseR - 1)*0.25;
  const whatifASU  = Math.round(WI_BASE.asu  * asuMult);
  const whatifSR   = Math.round(WI_BASE.sr   * (1 + (st.growth/100)*0.7 + (rRate/baseR-1)*0.2  + (st.modifier/100)*0.3));
  const whatifDisp = Math.round(WI_BASE.disp * (1 + (st.growth/100)*0.6 + (rRate/baseR-1)*0.15 + (st.modifier/100)*0.2));
  const renewedUnits    = st.unitsOverride
    ? (parseInt(st.unitsOverride)||WI_BASE.renewedUnits)
    : Math.round(WI_BASE.renewalOppQty * rRate);
  const newContracts    = Math.round(WI_BASE.newContracts * (1 + st.growth/100));
  const aposRenewals    = Math.round(renewedUnits * 2840);
  const newContractsVal = Math.round(newContracts * 2754);
  return { whatifASU, whatifSR, whatifDisp, renewedUnits, newContracts,
           aposRenewals, newContractsVal,
           asuDelta: whatifASU-WI_BASE.asu, srDelta: whatifSR-WI_BASE.sr,
           dispDelta: whatifDisp-WI_BASE.disp, growthPct: (whatifASU/WI_BASE.asu-1)*100 };
}
```

### Smart Chart Update (performance — no destroy/recreate on slider drag)
```js
function wiRenderCharts() {
  const d = _wiChartData();
  // If charts exist → update in-place (60fps slider drag safe)
  if (wiCharts['wi-chart-asu'] && wiCharts['wi-chart-sr'] && wiCharts['wi-chart-dp']) {
    wiCharts['wi-chart-asu'].data.datasets[1].data = d.asuAdj;
    wiCharts['wi-chart-asu'].update('none');
    wiCharts['wi-chart-sr'].data.datasets[1].data = d.srAdj;
    wiCharts['wi-chart-sr'].update('none');
    wiCharts['wi-chart-dp'].data.datasets[1].data = d.dpAdj;
    wiCharts['wi-chart-dp'].update('none');
    return;
  }
  // First render: create charts (fill:'-1' for band fill between base and adjusted lines)
}
```

### Renewed Units Input (Indian comma formatting)
```js
function wiUnitsInput(el) {
  const digits = el.value.replace(/[^0-9]/g, '');
  if (!digits) { wiState.unitsOverride = ''; el.value = ''; return; }
  const n = parseInt(digits, 10);
  el.value = n.toLocaleString('en-IN');   // produces 5,00,000 format
  wiState.unitsOverride = n;
  wiRenderKPIs(); wiRenderImpact(); wiRenderPipeline(); wiRenderCharts();
}
// Input element must be type="text" inputmode="numeric" — NOT type="number"
```

---

## 6. index.html — Landing Page

### Primary Tools Grid
3-column responsive grid. Each card uses `--card-accent` CSS variable for themed border/CTA color.

| Card | File | Accent Color |
|---|---|---|
| ISG BPA: Business Planning and Analytics | IBP_Forcasting.html | `#4c7ef8` (blue) |
| What-If Simulation | enterprise_whatif_forecasting_platform.html | `#9d78f0` (purple) |
| Bend the Curve | bend_the_curve.html | `#22d472` (green) |

### LABELS Map (overrides auto-generated names)
```js
const LABELS = {
  'IBP_Forcasting.html':                          'ISG BPA: Business Planning and Analytics',
  'enterprise_whatif_forecasting_platform.html':  'What-If Simulation',
  'bend_the_curve.html':                          'Bend the Curve',
  'dell_workflow.html':                           'Dell Workflow',
  'simulation-overview-platform.html':            'Simulation Overview Platform',
  'executive_forecast_operational_dashboard.html':'Executive Forecast & Operational Dashboard',
  'epic_dashboard_mockup.html':                   'Epic Dashboard Mockup',
};
```

### PRIMARY Set (pins with badge in All Modules list)
```js
const PRIMARY = new Set([
  'IBP_Forcasting.html',
  'enterprise_whatif_forecasting_platform.html',
  'bend_the_curve.html',
]);
```

---

## 7. Git Workflow

### Git Binary Location
```
C:\Users\arnav.bhargava\AppData\Local\Programs\Git\bin\git.exe
```
Git is NOT in PATH. Always use the full path:
```powershell
$git = "C:\Users\arnav.bhargava\AppData\Local\Programs\Git\bin\git.exe"
& $git ...
```

### Push Sequence (always rebase — GitHub Actions auto-commits manifest.json)
```powershell
$git = "C:\Users\arnav.bhargava\AppData\Local\Programs\Git\bin\git.exe"
& $git add <files>
& $git commit -m "message"
& $git pull --rebase origin master   # REQUIRED — GH Actions pushes manifest.json
& $git push origin master
```

### Fix for Permission Denied on .git/objects
```powershell
icacls .git\objects /grant "${env:USERNAME}:(OI)(CI)F" /T
```

---

## 8. Prompt Trail (Chronological)

### Session 1 — Initial Dashboard (Supply Chain Goliath era)
> Built `epic_dashboard_mockup.html` — left accordion nav, right Power BI filter panel,
> dark/light theme, CSV export, rule-based Smart Insights, no pie charts.

### Session 2 — Rebranding & Professional Redesign
1. Rename "IBP" → "ISG BPA: Business Planning and Analytics" throughout
2. Remove "SUPPLY CHAIN INTELLIGENCE" branding
3. Redesign UI to be professional (invoked frontend-design plugin)
4. Kept only 4 pages: Forecast Accuracy, Work Orders, Demand Profiling, Demand Planning Alerts, Data Raw

### Session 3 — Landing Page + New Modules
1. Add "Bend the Curve" and "What-If Simulation" tabs on landing page
2. Created `bend_the_curve.html` — goal-first planning with 8 toggle levers, gap visualization, band-fill chart
3. Created What-If Simulation as native module inside `IBP_Forcasting.html`

### Session 4 — Theme Fix
- **Bug**: Left nav panel stayed dark navy in light mode
- **Root cause**: `--nav-bg: #0f1328` and `--nav-hover: #1a2040` in `[data-theme="light"]` were wrong
- **Fix**: Changed to `--nav-bg: #ffffff` and `--nav-hover: #eef1fc`
- **Also fixed**: `toggleTheme()` was not iterating `wiCharts`, only `chartInstances`

### Session 5 — Lovable AI Reference Design
- User shared reference: `lovable ai format/Whatif Simulation/` assets + prompt.md
- Rebuilt What-If Simulation to match Lovable AI design:
  - Monthly axis: Feb → Jan (12 months)
  - Band-fill area chart (base line + adjusted line, shaded between)
  - 3 sliders: APOS Renewal Rate (70–100%), New Contracts Growth (-20–+50%), Forecast Modifier (-15–+25%)
  - Renewed Units Override input with live Indian comma formatting (en-IN locale)
  - Calibrated `wiCompute()` to produce exactly +8.6% ASU lift with default slider values

### Session 6 — Slider → Chart Fix
- **Bug**: Sliders were not updating ASU Trend, SR Forecast, Dispatch Forecast charts
- **Root cause**: `wiRenderCharts()` was destroying and recreating Chart.js instances on every `oninput` event (~60/sec during drag), causing canvas context corruption
- **Fix**: Smart in-place update — check if `wiCharts` instances exist; if yes, update `.data.datasets[1].data` and call `.update('none')` (no animation); only create on first render

### Session 7 — Push prompt.md only
- Pushed `lovable ai format/Whatif Simulation/prompt.md` to GitHub
- Deliberately excluded PNG screenshots from the push

### Session 8 — This document
- Created `IMP_DOCS/PROJECT_MASTER.md` (this file) to consolidate all context
- Old `handoff.md` and `prompttrail.md` are now superseded by this file

---

## 9. Known Issues / Watch-outs

| Issue | Status | Notes |
|---|---|---|
| Git not in PATH | Permanent | Always use full binary path |
| GH Actions auto-commits manifest.json | Permanent | Always `git pull --rebase` before push |
| `wiRenderCompTable` removed | Fixed | Was referencing deleted `wi-comp-table` element |
| Old slider keys `srint`, `disp`, `units` | Fixed | Replaced with `renewal`, `growth`, `modifier` |
| Light theme nav stayed dark | Fixed | `--nav-bg` and `--nav-hover` in `[data-theme="light"]` |
| Charts not updating on theme change | Fixed | `toggleTheme()` now iterates `wiCharts` too |

---

## 10. How to Onboard a New AI Session

Paste this at the start of any new conversation:

```
Context: I'm building the ISG BPA dashboard for Aligned Automation Services.
Full project details are in IMP_DOCS/PROJECT_MASTER.md in the repo at:
D:\OneDrive - Aligned Automation Services Private Limited\Documents\simulations

Key facts:
- Main file: IBP_Forcasting.html (4 modules + What-If Simulation)
- Landing: index.html (Primary Tools grid + searchable all-modules list)
- Design: Indigo-black system, Plus Jakarta Sans + IBM Plex Mono, Chart.js 4.4.1
- Git binary: C:\Users\arnav.bhargava\AppData\Local\Programs\Git\bin\git.exe (not in PATH)
- Always: git pull --rebase origin master before push
- GitHub Pages: https://aabh-ai.github.io/SIMULATION_Example/

Please read IMP_DOCS/PROJECT_MASTER.md for full context before starting.
```

---

## 11. Future Work Ideas (not committed)

- [ ] Connect sliders to backend API (replace dummy `wiCompute()` with real data)
- [ ] Add Scenario Save/Load to localStorage in What-If module
- [ ] Forecast Publish flow in What-If (wi-page-publish sub-page is scaffolded but empty)
- [ ] Add a 4th primary tool to landing page (e.g., Executive Summary / Exec Report)
- [ ] Mobile-responsive breakpoints for IBP dashboard (currently desktop-only)
- [ ] User authentication layer (currently fully public)
- [ ] Export to PDF from What-If Simulation results
