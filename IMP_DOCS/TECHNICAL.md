# Technical Reference — ISG BPA
> Architecture, What-If Simulation spec, Git workflow. Last updated: 2026-06-16

---

## IBP_Forcasting.html — Module Architecture

### Router Functions
```js
openDashboard(moduleId)  // activates module, updates breadcrumb + nav highlight
switchPage(pageId)        // shows/hides sub-pages within active module
```

### Chart Stores
- `chartInstances` — holds Chart.js instances for the 4 original modules
- `wiCharts` — holds Chart.js instances for What-If Simulation
- Both must be updated on theme toggle (common bug: only iterating one)

### Module Init
```js
// In openDashboard():
if (moduleId === 'whatif') { setTimeout(wiInit, 80); }
else { setTimeout(initCharts, 80); }
```

### Theme Toggle (correct pattern)
```js
function toggleTheme() {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  document.getElementById('theme-icon').className = isDark ? 'ti ti-moon' : 'ti ti-sun';
  Object.values(chartInstances).forEach(c => { if(c) { updateChartTheme(c); c.update(); }});
  Object.values(wiCharts).forEach(c => { if(c) { updateChartTheme(c); c.update(); }});
}
```

---

## What-If Simulation — Full Spec

### Base Constants
```js
const WI_MONTHS = ['Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan'];
const WI_BASE = {
  asu: 1350000, sr: 587000, disp: 233700,
  renewalOppQty: 284500, baseRenewalRate: 85.3,
  renewedUnits: 242678, newContracts: 73140, asuContrib: 612.4e6,
};
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

### Compute Formula
Calibrated so defaults produce: +8.6% ASU lift → 1,466,100 ASU | 629K SR | 247K dispatches.
```js
function wiCompute(st) {
  const rRate = st.renewal / 100, baseR = WI_BASE.baseRenewalRate / 100;
  const asuMult = 1 + (st.growth/100)*0.8 + (st.modifier/100)*0.5 + (rRate/baseR - 1)*0.25;
  const whatifASU  = Math.round(WI_BASE.asu  * asuMult);
  const whatifSR   = Math.round(WI_BASE.sr   * (1 + (st.growth/100)*0.7 + (rRate/baseR-1)*0.2  + (st.modifier/100)*0.3));
  const whatifDisp = Math.round(WI_BASE.disp * (1 + (st.growth/100)*0.6 + (rRate/baseR-1)*0.15 + (st.modifier/100)*0.2));
  const renewedUnits    = st.unitsOverride
    ? (parseInt(st.unitsOverride) || WI_BASE.renewedUnits)
    : Math.round(WI_BASE.renewalOppQty * rRate);
  const newContracts    = Math.round(WI_BASE.newContracts * (1 + st.growth/100));
  const aposRenewals    = Math.round(renewedUnits * 2840);
  const newContractsVal = Math.round(newContracts * 2754);
  return {
    whatifASU, whatifSR, whatifDisp, renewedUnits, newContracts, aposRenewals, newContractsVal,
    asuDelta: whatifASU - WI_BASE.asu,
    srDelta: whatifSR - WI_BASE.sr,
    dispDelta: whatifDisp - WI_BASE.disp,
    growthPct: (whatifASU / WI_BASE.asu - 1) * 100,
  };
}
```

### Smart Chart Update Pattern
Avoids destroy/recreate on every slider `oninput` (would corrupt canvas at 60fps).
```js
function wiRenderCharts() {
  const d = _wiChartData();
  if (wiCharts['wi-chart-asu'] && wiCharts['wi-chart-sr'] && wiCharts['wi-chart-dp']) {
    // In-place update — no flicker, no canvas corruption
    wiCharts['wi-chart-asu'].data.datasets[1].data = d.asuAdj;
    wiCharts['wi-chart-asu'].update('none');
    wiCharts['wi-chart-sr'].data.datasets[1].data = d.srAdj;
    wiCharts['wi-chart-sr'].update('none');
    wiCharts['wi-chart-dp'].data.datasets[1].data = d.dpAdj;
    wiCharts['wi-chart-dp'].update('none');
    return;
  }
  // First render: create charts from scratch (fill:'-1' for band between base and adjusted)
}
```

### Renewed Units Override Input
```js
// HTML: <input type="text" inputmode="numeric" oninput="wiUnitsInput(this)">
function wiUnitsInput(el) {
  const digits = el.value.replace(/[^0-9]/g, '');
  if (!digits) { wiState.unitsOverride = ''; el.value = ''; return; }
  const n = parseInt(digits, 10);
  el.value = n.toLocaleString('en-IN');  // 5,00,000 format
  wiState.unitsOverride = n;
  wiRenderKPIs(); wiRenderImpact(); wiRenderPipeline(); wiRenderCharts();
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
$git = "C:\Users\arnav.bhargava\AppData\Local\Programs\Git\bin\git.exe"
cd "D:\OneDrive - Aligned Automation Services Private Limited\Documents\simulations"
& $git add <files>
& $git commit -m "message"
& $git pull --rebase origin master   # always — GH Actions pushes manifest.json after each push
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
| Light theme nav stayed dark | `--nav-bg/#nav-hover` in `[data-theme="light"]` were still dark navy hex values | Changed to `#ffffff` / `#eef1fc` |
| WI charts not updating on theme toggle | `toggleTheme()` only iterated `chartInstances`, not `wiCharts` | Added `Object.values(wiCharts).forEach(...)` |
| Sliders not affecting charts | `wiRenderCharts()` destroyed/recreated chart instances on every `oninput` | Smart in-place update pattern (see above) |
| `wiRenderCompTable` crash | Function referenced `wi-comp-table` element that was removed during restructure | Removed call from `wiRenderAll()` |
| Old slider keys in code | After WI_SLIDERS rebuild, `wiState.srint / .disp / .units` were still referenced in insights/save/publish | Updated all references to `renewal`, `growth`, `modifier` |
| Push rejected (remote ahead) | GH Actions auto-commits manifest.json after every push | Always `git pull --rebase origin master` before push |
| Git permission denied on objects | NTFS ACL issue on `.git/objects` | `icacls .git\objects /grant ...` |

---

## Future Work (not committed)

- [ ] Connect `wiCompute()` to real backend data
- [ ] Scenario Save/Load to localStorage in What-If module
- [ ] Fill `wi-page-publish` (Forecast Publish sub-page — currently scaffolded, empty)
- [ ] 4th Primary Tool on landing page (e.g., Executive Summary)
- [ ] Mobile-responsive breakpoints for IBP dashboard
- [ ] User authentication layer
- [ ] Export to PDF from What-If results
