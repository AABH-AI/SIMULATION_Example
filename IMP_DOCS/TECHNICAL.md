# Technical Reference — TET BPA
> Architecture, filter system, chart patterns, Git workflow. Last updated: 2026-06-22

---

## Two Active Files

| File | Status | Sessions |
|---|---|---|
| `BPA_FORCASTING_MOCK.HTML` | **Active development** | 14–current |
| `AST_Forcasting.html` | Stable, not under active development | 1–13 |

---

## BPA_FORCASTING_MOCK.HTML — Architecture

### Router Functions
```js
openDashboard(moduleId)   // activates module, builds left nav, calls setTimeout(initCharts, 80)
switchPage(pageId, ...)   // shows/hides sub-pages; calls resetPageFilters() first on every call
```

### Chart Stores
```js
const chartInstances = {};  // all Chart.js instances (FA, DP quadrants, Demand Trends, FT)
const wiCharts = {};        // What-If Simulation charts (managed separately)
let _dpBaseData = null;     // raw seeded data for quadrant charts (set in initDemandProfilingQuadrants)
let _ftBaseData  = null;    // raw seeded data for SR trend charts (set in initForecastTrendChart)
```

`initCharts()` destroys all `chartInstances` and reinitialises on every `openDashboard()`.

### Module Init Pattern
```js
// openDashboard():
if (moduleId === 'whatif') { setTimeout(wiInit, 80); }
else { setTimeout(initCharts, 80); }
// initCharts() calls: mk() × 3 (FA charts), initDemandProfilingQuadrants(),
//                    initDemandTrends(), applyAllFilteredCharts()
// Forecast Trend is lazy: switchPage → setTimeout(initForecastTrendChart, 80)
```

### switchPage() — full dispatch table
```js
function switchPage(pageId, linkEl, moduleId, label) {
  // ... show/hide pages, update nav + breadcrumb ...
  resetPageFilters();  // fires on EVERY page switch
  if (pageId === 'dr-page-raw')           renderRawTable();
  if (pageId === 'da-page-log')           renderAlerts('all');
  if (pageId === 'fa-page-actuals')       generateActualsTable();
  if (pageId === 'fa-page-partner')       generatePartnerTable();
  if (pageId === 'fa-page-forecast-trend') setTimeout(initForecastTrendChart, 80);
  if (pageId === 'wi-page-sim')           setTimeout(wiRenderAll, 60);
  if (pageId === 'wi-page-scenarios')     wiRenderAIInsights(); wiRenderScenarios();
  if (pageId === 'wi-page-publish')       wiRenderPublishReadiness(); wiRenderAudit();
  if (pageId === 'dp-page-overview' || pageId === 'dp-page-trends') {
    updateDPQuadrantCharts(); updateDemandTrends();
  }
}
```

---

## Filter System

### getActiveFilters()
```js
// Returns { group: [values] } for groups with specific selections.
// If "(All)" is checked, the group key is ABSENT from the returned object (= all values).
// If nothing is checked, group key is present with empty array [] (= show nothing).
getActiveFilters()   // → e.g. { fy: ['FY26'], lob: ['TET','TES'] }
```

### resetPageFilters()
```js
function resetPageFilters() {
  // FY → FY26 only, Quarter → Q1, LOB → All (the "(All)" checkbox)
  // Closes open filter dropdowns
  updateFilterChips();
}
const resetDPFilters = resetPageFilters; // backward-compat alias
```

### Product Group (LOB) Filter
Display label: "Product Group". Internal `data-group`: `"lob"`. Values: All / TET / TES / THS.
```js
const DP_LOB_SHARE = { TET: 0.60, TES: 0.25, THS: 0.15 };

function getDPLOBMult() {
  const f = getActiveFilters();
  if (!f.lob || f.lob.length === 0) return 1.0;
  return f.lob.reduce((s, pg) => s + (DP_LOB_SHARE[pg] || 0), 0);
}
// TET only: 0.60, TES only: 0.25, TET+TES: 0.85, all three: 1.0
```

### applyAllFilteredCharts()
```js
function applyAllFilteredCharts() {
  updateFARegionChart();        // FA region bar
  updateFAPartnerChart();       // Partner MDR
  updateFAOverviewChart();      // FA overview line
  updateDPQuadrantCharts();     // scale quadrant data by LOB × FY
  updateDemandTrends();         // sum DP_TREND_PG by product groups × FY
  updateForecastTrendChart();   // scale SR trend + error chart by LOB × FY
}
```

---

## Actuals Profiling Charts

### Quadrant Data Pattern
```js
// initDemandProfilingQuadrants() stores base data then scales via filter
_dpBaseData = { consistent, erratic, intermittent, lumpy };

function updateDPQuadrantCharts() {
  if (!_dpBaseData) return;
  const mult = getDPLOBMult() * getActiveFYMultiplier();
  ['consistent','erratic','intermittent','lumpy'].forEach(key => {
    const c = chartInstances['dp-chart-' + key];
    if (!c) return;
    c.data.datasets[0].data = _dpBaseData[key].map(v => Math.round(v * mult));
    c.update('none');
  });
}
```

### Demand Trends Pattern
```js
// Per-product-group demand arrays — TET+TES+THS = combined totals
const DP_TREND_PG = {
  TET: { wow: [...], mom: [...], qoq: [...] },  // 60% of total
  TES: { wow: [...], mom: [...], qoq: [...] },  // 25%
  THS: { wow: [...], mom: [...], qoq: [...] },  // 15%
};

function updateDemandTrends() {
  const selPGs = (!f.lob || f.lob.length===0) ? ['TET','TES','THS'] : f.lob;
  // sum demand arrays for selected groups, scale by FY mult, recalculate % change
  // update bar colors (green/red) + line data in-place, call c.update('none')
}
```

---

## Forecast Trend Charts

### Data Stores
```js
_ftBaseData = { actuals, forecast, adjForecast, planForecast, weeks, TODAY_IDX }
// actuals:      W01–W22, declining ~612K → ~576K with noise (seeded 42)
// forecast:     W22–W52, smooth decline from lastActual (seeded 77)
// adjForecast:  W22–W52, less steep, manually lifted (seeded 13)
// planForecast: W01–W22, flat ~607K historical plan (seeded 88) — used for error bars
```

### Chart.js Inline Plugin Pattern (vertical divider)
```js
const vertDivider = {
  id: 'ft_divider',
  afterDraw(chart) {
    const px = chart.scales.x.getPixelForValue(TODAY_IDX);
    // draw dashed vertical line + pill label using canvas ctx
  }
};
chartInstances[mainId] = new Chart(mainEl, { type:'line', plugins:[vertDivider], ... });
```

### Error Chart — Zero Reference Line
```js
// Dark gridline at y=0 to act as reference without needing an annotation plugin:
y: { grid: { color: ctx => ctx.tick.value === 0 ? 'rgba(0,0,0,0.2)' : gridColor() } }
```

### KPI + Stat Tiles Update Helper
```js
function _ftUpdateKPIs(sA, sF, sAd, errors, errWeeks, TODAY_IDX) {
  // Updates: ft-last-actual, ft-mape-kpi, ft-bias-kpi (KPI strip)
  //          ft-mape, ft-bias, ft-best-week, ft-worst-week (stat tiles in right panel)
  // Bias color: |bias|<2% → green, >0 → amber, <0 → red
  // MAPE color: <4% → green, 4–8% → amber, >8% → red
}
```

---

## CV Info Tooltip Pattern
```html
<!-- X-axis label with inline info button -->
<div class="cv-tooltip-wrap">
  <span class="dp-x-text">Coefficient of Variation (Demand)</span>
  <button class="cv-info-btn" onclick="toggleCVTooltip(event)">i</button>
  <div id="cv-tooltip-box" class="cv-tooltip-box" style="display:none;">
    <!-- CV formula + Low/High interpretation -->
  </div>
</div>
```
```js
function toggleCVTooltip(e) {
  e.stopPropagation();
  const box = document.getElementById('cv-tooltip-box');
  box.style.display = box.style.display !== 'none' ? 'none' : 'block';
  // registers one-shot outside-click listener to close
}
```

---

## Git Workflow

### Binary Path (Git NOT in PATH)
```powershell
$git = "C:\Users\arnav.bhargava\AppData\Local\Programs\Git\bin\git.exe"
```

### Standard Push Sequence
```powershell
& $git add <files>
& $git commit -m "message"
& $git stash
& $git pull --rebase origin master   # always — GH Actions pushes manifest.json after each push
& $git stash pop
& $git push origin master
```

### Fix: Permission Denied on .git/objects
```powershell
icacls .git\objects /grant "${env:USERNAME}:(OI)(CI)F" /T
```

---

## Known Issues & Fixes

| Issue | Root Cause | Fix Applied |
|---|---|---|
| Highcharts charts not rendering | Containers measured 0-width when module hidden at init time | Reverted to Chart.js; Highcharts removed |
| Quadrant charts blank on load | Chart.js initialised before module becomes visible | `initCharts` called via `setTimeout(80)` after module is shown |
| Filter reset only for DP pages | `resetDPFilters` only called for demand-profiling sub-pages | Renamed to `resetPageFilters`, called at top of every `switchPage` |
| LOB label vs internal key | Display rename to "Product Group" but `data-group="lob"` kept | Intentional: avoids breaking `getActiveFilters()` and all filter logic |
| Push rejected (remote ahead) | GH Actions auto-commits manifest.json after every push | Always `git stash → pull --rebase → stash pop → push` |
| Git permission denied on objects | NTFS ACL issue on `.git/objects` | `icacls .git\objects /grant ...` |

---

## AST_Forcasting.html — Architecture (legacy reference)

### Chart Stores
- `chartInstances` — FA, Demand Profiling, Alerts, Raw Data charts
- `wiCharts` — What-If Simulation charts only
- Both must be updated on theme toggle

### What-If Compute (current — no Forecast Modifier)
```js
const WI_SLIDERS = [
  { key:'growth',  label:'New Contracts Growth', min:-20, max:50,  step:1,   val:8    },
  { key:'renewal', label:'Renewal Rate',    min:70,  max:100, step:0.5, val:89.5 },
];
let wiState = { renewal:89.5, growth:8, unitsOverride:'' };
// Default produces ~7.6% ASU lift
```

## data.html — Standalone Architecture

### Tab Switching (lightweight, no router)
```js
const tabInited = {};
function switchTab(tab, btn) {
  document.querySelectorAll('.dm-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.dm-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  if (btn) btn.classList.add('active');
  if (!tabInited[tab]) { tabInited[tab] = true; setTimeout(() => initTab(tab), 80); }
}
// setTimeout(80) matches BPA pattern — ensures DOM is visible before Chart.js measures container
```

### Seeded Data Generation
```js
const rng = seeded(1618);  // named rng to avoid collision with inner .map(d => ...) vars
const rawData = Array.from({length:150}, (_, i) => {
  const region  = REGIONS[Math.floor(rng() * 3)];
  // ... all fields generated deterministically from the same seed chain
  const status  = rng() < 0.073 ? 'Needs Review' : 'Within Tolerance'; // ~7.3% anomaly
  return { idx:i+1, region, subregion, partner, lob, fy:'FY26', quarter, week, sr, fasu, tasu, fdsr, status };
});
```

### Animated Counter Pattern (Data Quality hero)
```js
function animateCounter(target) {
  const el = document.getElementById('dq-num');
  const dur = 1100, t0 = performance.now();
  const ease = t => t < .5 ? 2*t*t : -1+(4-2*t)*t;  // quadratic ease-in-out
  const tick = now => {
    const p = Math.min((now - t0) / dur, 1);
    el.textContent = ((target) * ease(p)).toFixed(1);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
// Respects prefers-reduced-motion via CSS: .comp-fill { transition: none; }
// Only called once per tab visit (guarded by tabInited)
```

### CSS Progress Bars (animated via requestAnimationFrame)
```js
// Render bars at width:0% first, then flip to target after paint:
grid.innerHTML = fields.map(f => `
  <div class="comp-fill" style="width:0%;background:${col}" data-target="${p}"></div>
`).join('');
requestAnimationFrame(() => {
  document.querySelectorAll('.comp-fill[data-target]').forEach(el => {
    el.style.width = el.dataset.target + '%';
  });
});
// CSS transition: width 0.7s cubic-bezier(.4,0,.2,1) — browser handles the animation
```

### Export Pattern (no server needed)
```js
function exportCSV() {
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'isg-bpa-data.csv'; a.click();
}
// Same pattern for JSON: JSON.stringify(rawFiltered, null, 2)
```

---

## Future Work (BPA_FORCASTING_MOCK.HTML)
See `TODO` file for full backlog. Key items:
- Merge Week.html SR/ASU/Dispatch switcher behaviour into BPA after review
- Merge data.html Data Management tabs into BPA after review
- Quarter filter: actual data slicing for QoQ chart
- Per-quarter drill-down from QoQ → weekly breakdown
- Demand Trends: FY YoY comparison overlay
- Profiling Overview: scatter-plot (Occurrence % vs CV %) for individual SKU placement
