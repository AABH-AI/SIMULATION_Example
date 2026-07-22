/*
 * Forecast Copilot -- shared engine (fc_engine v1)
 * Single source of truth for all 6 pages. Loaded before each page-specific inline script.
 * Requires Highcharts (loaded via CDN in <head>) to be present before this file runs.
 *
 * Highcharts 11.4.8 is used under its free non-commercial license (research/demo use only).
 */

/* ==== FORECAST COPILOT SHARED ENGINE (fc_engine v1) ==== */
const FILTER_OPTIONS = {
  quarter: (()=>{const a=[];for(let y=2022;y<=2028;y++)for(let q=1;q<=4;q++)a.push(y+'-Q'+q);return a;})(),
  week: (()=>{const a=[];for(let y=2022;y<=2028;y++)for(let w=1;w<=53;w++)a.push(y+'-W'+String(w).padStart(2,'0'));return a;})(),
  region: ['All','AMERICAS','EMEA','APJ'],
  lob: ['All','PowerEdge','PowerStore','PowerScale','PowerFlex','VxRail','Avamar','Networking','Insignia'],
  business: ['All','ESG','ISG','HES'],
  service: ['All','Parts Only ESG','Parts Only ISG','Parts + Labour ESG','Parts + Labour ISG','Labour Only ESG','Labour Only ISG'],
  coreupsell: ['All','Core','Upsell'],
  wotype: ['All','Break Fix','Part/s dispatch'],
  fqm: ['All','1','0'],
  gcfa: ['All','GCFA','non-GCFA','Unknown']
};

const FC_STATE_KEY = 'fc_state_v1';
const FC_DEFAULT_STATE = {
  filters: { quarter: '2025-Q1', week: '2025-W01', region: 'AMERICAS', lob: 'PowerEdge', business: 'ESG', service: 'Parts + Labour ESG', coreupsell: 'All', wotype: 'All', fqm: 'All', gcfa: 'All' },
  ncOverride: 10, aposOverride: 5, simMode: 'manual',
  btcStrategy: null, manualBTC: null, distMode: 'equal',
  approvals: { scenario: false, btc: false, submitted: false },
  scenarios: [], activeScenarioId: null
};
function fcLoadState() {
  let state;
  try {
    const raw = localStorage.getItem(FC_STATE_KEY);
    if (!raw) state = JSON.parse(JSON.stringify(FC_DEFAULT_STATE));
    else {
      const parsed = JSON.parse(raw);
      state = { ...JSON.parse(JSON.stringify(FC_DEFAULT_STATE)), ...parsed,
        filters: { ...FC_DEFAULT_STATE.filters, ...(parsed.filters||{}) },
        approvals: { ...FC_DEFAULT_STATE.approvals, ...(parsed.approvals||{}) } };
    }
  } catch(e) { state = JSON.parse(JSON.stringify(FC_DEFAULT_STATE)); }
  return fcEnsureScenarios(state);
}
function fcSaveState(state) {
  try { fcSyncActiveScenario(); } catch(e) {}   // mirror live edits into the active scenario
  localStorage.setItem(FC_STATE_KEY, JSON.stringify(state));
}

/* ==== SCENARIO LAYER (Phase 3) ==========================================
 * fcState.scenarios[] = named full-state plans; fcState.activeScenarioId is the
 * one currently loaded into the live fields (filters / overrides / BTC / dist /
 * approvals). The "active scenario" IS the live working state -- every page
 * reads fcState.filters etc. unchanged, and fcSaveState() mirrors live edits
 * back into the active scenario automatically (so edits stick to it). Switching
 * loads another scenario's plan into the live fields. All in localStorage; no
 * backend. Publishing one to Excel is Phase 5.
 * ---------------------------------------------------------------------- */
const FC_PLAN_KEYS = ['filters','ncOverride','aposOverride','simMode','btcStrategy','manualBTC','distMode','approvals'];
const FC_PRESETS = {
  Baseline:     { ncOverride:10, aposOverride:5,  simMode:'manual', btcStrategy:null,                manualBTC:null, distMode:'equal' },
  Aggressive:   { ncOverride:30, aposOverride:20, simMode:'manual', btcStrategy:'historicalBestFit', manualBTC:null, distMode:'ai' },
  Conservative: { ncOverride:0,  aposOverride:0,  simMode:'manual', btcStrategy:'closestToAOP',       manualBTC:null, distMode:'historical' }
};
function fcGenId() { return 'sc_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function fcDeep(v) { return (v && typeof v === 'object') ? JSON.parse(JSON.stringify(v)) : v; }
function fcSnapshotPlanFrom(obj) { const p = {}; FC_PLAN_KEYS.forEach(k => { p[k] = fcDeep(obj[k]); }); return p; }
function fcSnapshotPlan() { return fcSnapshotPlanFrom(fcState); }
function fcEnsureScenarios(state) {
  if (!Array.isArray(state.scenarios) || state.scenarios.length === 0) {
    const sc = { id: fcGenId(), name: 'Baseline', plan: fcSnapshotPlanFrom(state) };
    state.scenarios = [sc]; state.activeScenarioId = sc.id;
  } else if (!state.scenarios.find(s => s.id === state.activeScenarioId)) {
    state.activeScenarioId = state.scenarios[0].id;
  }
  return state;
}
function fcActiveScenario() { return (fcState.scenarios || []).find(s => s.id === fcState.activeScenarioId) || null; }
function fcSyncActiveScenario() { const s = fcActiveScenario(); if (s) s.plan = fcSnapshotPlan(); }
function fcApplyPlan(plan) { FC_PLAN_KEYS.forEach(k => { if (k in plan) fcState[k] = fcDeep(plan[k]); }); }
function fcComputeFor(plan) {
  const backup = fcSnapshotPlan();
  fcApplyPlan(plan);
  let r; try { r = fcCompute(); } finally { fcApplyPlan(backup); }
  return r;
}
function fcSwitchScenario(id, reload) {
  const s = (fcState.scenarios || []).find(x => x.id === id); if (!s) return;
  fcSyncActiveScenario();                       // persist current edits to the outgoing scenario first
  fcState.activeScenarioId = id; fcApplyPlan(s.plan); fcSaveState(fcState);
  if (reload !== false && typeof location !== 'undefined' && location.reload) location.reload();
}
function fcSaveAsScenario(name) {
  const sc = { id: fcGenId(), name: name || ('Scenario ' + ((fcState.scenarios || []).length + 1)), plan: fcSnapshotPlan() };
  fcState.scenarios.push(sc); fcState.activeScenarioId = sc.id; fcSaveState(fcState); return sc;
}
function fcDuplicateScenario(id) {
  const src = (fcState.scenarios || []).find(x => x.id === id) || fcActiveScenario(); if (!src) return null;
  fcSyncActiveScenario();
  const sc = { id: fcGenId(), name: src.name + ' copy', plan: fcDeep(src.plan) };
  fcState.scenarios.push(sc); fcState.activeScenarioId = sc.id; fcSaveState(fcState); return sc;
}
function fcRenameScenario(id, name) {
  const s = (fcState.scenarios || []).find(x => x.id === id); if (s && name) { s.name = name; fcSaveState(fcState); }
}
function fcDeleteScenario(id) {
  const list = fcState.scenarios || []; if (list.length <= 1) return false;   // always keep at least one
  const idx = list.findIndex(x => x.id === id); if (idx < 0) return false;
  const wasActive = fcState.activeScenarioId === id;
  list.splice(idx, 1);
  if (wasActive) { fcState.activeScenarioId = list[0].id; fcApplyPlan(list[0].plan); }
  fcSaveState(fcState); return wasActive;        // caller reloads when the active scenario changed
}
function fcApplyPreset(name, reload) {
  const preset = FC_PRESETS[name]; if (!preset) return;
  const plan = fcSnapshotPlan();                 // keep the current slice (filters); recipe sets the levers
  Object.assign(plan, preset);
  plan.approvals = { scenario: false, btc: false, submitted: false };
  let sc = (fcState.scenarios || []).find(s => s.name === name);
  if (sc) sc.plan = plan; else { sc = { id: fcGenId(), name, plan }; fcState.scenarios.push(sc); }
  fcState.activeScenarioId = sc.id; fcApplyPlan(plan); fcSaveState(fcState);
  if (reload !== false && typeof location !== 'undefined' && location.reload) location.reload();
}

let fcState = fcLoadState();
function fcSetFilter(key, value) { fcState.filters[key] = value; fcSaveState(fcState); }

/* ==== DATA PROVIDER (Phase 2) ============================================
 * Live mode: the real input workbook, read via serve.py's GET /api/dataset.
 * Simulated mode: the seeded generator below (used when there is no server,
 * e.g. opening a page from file://). The mode is decided once at load and
 * surfaced by a "Live / Simulated" badge. In live mode:
 *   - real weekly ASU + Warranty Expirations drive each slice,
 *   - SR / Dispatch stay derived (ratios),
 *   - New Contracts / APOS stay modeled levers (no such columns exist),
 *   - filter OPTIONS are derived from the data's own distinct values.
 * Historical BTC / accuracy / AOP remain modeled overlays in both modes.
 * ------------------------------------------------------------------------ */
var fcDataMode = 'simulated';   // 'live' once /api/dataset loads successfully
var fcDataset = null;           // raw /api/dataset payload
var fcLiveRows = null;          // cached row array for slice aggregation

// Engine filter key -> real dataset field. Keys absent here are seeded-only.
// 'business' has no real column, so in live mode it is repurposed to the real
// (and useful) Warranty Type dimension; 'lob' maps to the Product column.
const FC_LIVE_FIELD = {
  quarter: 'fiscalQuarter', week: 'fiscalWeek', region: 'region', lob: 'product',
  business: 'warrantyType', service: 'serviceType', coreupsell: 'coreUpsell',
  wotype: 'woType', fqm: 'fqmFlag', gcfa: 'gcfaType'
};
// Relabel the filter rail in live mode where the seeded label no longer fits.
const FC_LIVE_LABEL = { lob: 'Product', business: 'Warranty Type' };
// Derived Dispatch/SR ratio per real Service Type (no real dispatch column exists).
const FC_LIVE_DISPATCH_RATIO = { 'All': 0.50, 'Labour Only': 0.68, 'Parts + Labour': 0.56, 'Parts Only': 0.33 };

function fcFetchDatasetSync() {
  // Synchronous on purpose: the engine script runs before each page's inline
  // render script, so a blocking GET here guarantees real data is ready before
  // the first fcCompute() -- no per-page async wiring needed. Any failure
  // (no server, file://) is caught and we stay in simulated mode.
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/dataset', false);
    xhr.send(null);
    if (xhr.status >= 200 && xhr.status < 300 && xhr.responseText) return JSON.parse(xhr.responseText);
  } catch (e) { /* fall through to simulated */ }
  return null;
}

function fcDistinctFromRows(field) {
  const seen = Object.create(null), out = [];
  for (let i = 0; i < fcLiveRows.length; i++) {
    let v = fcLiveRows[i][field];
    if (v === null || v === undefined) continue;
    v = String(v);
    if (!seen[v]) { seen[v] = 1; out.push(v); }
  }
  out.sort();
  return out;
}

function fcApplyLiveFilterOptions() {
  // Options derived from the data's distinct values (not hardcoded). Quarter and
  // Week get no 'All' (the engine parses the quarter string); the rest do.
  const withAll = (field) => ['All'].concat(fcDistinctFromRows(field));
  FILTER_OPTIONS.quarter    = fcDistinctFromRows('fiscalQuarter');
  FILTER_OPTIONS.week       = fcDistinctFromRows('fiscalWeek');
  FILTER_OPTIONS.region     = withAll('region');
  FILTER_OPTIONS.lob        = withAll('product');
  FILTER_OPTIONS.business    = withAll('warrantyType');
  FILTER_OPTIONS.service    = withAll('serviceType');
  FILTER_OPTIONS.coreupsell = withAll('coreUpsell');
  FILTER_OPTIONS.wotype     = withAll('woType');
  FILTER_OPTIONS.fqm        = withAll('fqmFlag');
  FILTER_OPTIONS.gcfa       = withAll('gcfaType');
}

function fcRepairLiveFilters() {
  // A stored fc_state_v1 (or the seeded defaults) may hold values that don't
  // exist in the real data (AMERICAS vs Americas, PowerEdge vs Poweredge, the
  // ESG/ISG service combos, ...). Snap any invalid value to a sensible real one
  // so the default live slice is populated.
  Object.keys(FC_LIVE_FIELD).forEach((key) => {
    const opts = FILTER_OPTIONS[key] || [];
    if (opts.indexOf(fcState.filters[key]) !== -1) return;
    if (key === 'quarter')   fcState.filters.quarter = opts.indexOf('2025-Q1') >= 0 ? '2025-Q1' : opts[opts.length - 1];
    else if (key === 'week') fcState.filters.week = opts[0];
    else                     fcState.filters[key] = 'All';   // broad, dense default slice
  });
  fcSaveState(fcState);
}

function fcInitData() {
  const d = fcFetchDatasetSync();
  if (!d || !Array.isArray(d.rows) || !d.rows.length) { fcDataMode = 'simulated'; return; }
  fcDataset = d; fcLiveRows = d.rows; fcDataMode = 'live';
  fcApplyLiveFilterOptions();
  fcRepairLiveFilters();
}

function fcRowMatches(row, filters) {
  for (const key in FC_LIVE_FIELD) {
    if (key === 'quarter' || key === 'week') continue;   // quarter applied separately; week is not a slice constraint
    const sel = filters[key];
    if (sel == null || sel === 'All') continue;
    const rv = row[FC_LIVE_FIELD[key]];
    if (rv == null || String(rv) !== String(sel)) return false;
  }
  return true;
}

function fcLiveDispatchRatio(filters) {
  const s = filters.service;
  return FC_LIVE_DISPATCH_RATIO[s] != null ? FC_LIVE_DISPATCH_RATIO[s] : FC_LIVE_DISPATCH_RATIO['All'];
}

// Aggregate the real workbook into 13 canonical weekly ASU + Expiration values
// for the selected quarter + slice. ASU is a stock -> carry the last observed
// value forward into weeks with no matching rows (and back-fill leading gaps);
// Expirations is a flow -> zero when absent. Returns null unless live.
function fcLiveWeeklyBase(filters) {
  if (fcDataMode !== 'live' || !fcLiveRows) return null;
  const weeks = fcWeeksForQuarter(filters.quarter);
  const sums = Object.create(null);
  weeks.forEach((w) => { sums[w] = { asu: 0, exp: 0, has: false }; });
  for (let i = 0; i < fcLiveRows.length; i++) {
    const r = fcLiveRows[i];
    if (r.fiscalQuarter !== filters.quarter) continue;
    const w = r.fiscalWeek;
    if (!(w in sums)) continue;
    if (!fcRowMatches(r, filters)) continue;
    sums[w].asu += r.asu || 0; sums[w].exp += r.warrantyExpirations || 0; sums[w].has = true;
  }
  let anyHas = false, firstVal = 0;
  for (let k = 0; k < weeks.length; k++) { if (sums[weeks[k]].has) { anyHas = true; firstVal = sums[weeks[k]].asu; break; } }
  if (!anyHas) return { weeks, asuBase: weeks.map(() => 0), expirations: weeks.map(() => 0), empty: true };
  const asuBase = [], expirations = [];
  let last = firstVal;
  weeks.forEach((w) => {
    if (sums[w].has) last = sums[w].asu;
    asuBase.push(Math.round(last));
    expirations.push(Math.round(sums[w].exp));
  });
  return { weeks, asuBase, expirations, empty: false };
}

function seeded(s) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
function fcHash(str) { let h = 0; for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) % 2147483647; } return h || 1; }
function fcSeedFor(filters, salt) { return fcHash([filters.region, filters.lob, filters.business, filters.service, filters.quarter, salt||''].join('|')); }

const FC_REGION_FACTOR   = { All: 2.65, AMERICAS: 1.15, EMEA: 0.85, APJ: 0.65 };
const FC_LOB_FACTOR       = { All: 6.25, PowerEdge: 1.20, PowerStore: 0.90, PowerScale: 0.80, PowerFlex: 0.85, VxRail: 1.00, Avamar: 0.50, Networking: 0.60, Insignia: 0.40 };
const FC_BUSINESS_FACTOR  = { All: 2.90, ESG: 1.00, ISG: 1.30, HES: 0.60 };
const FC_SERVICE_FACTOR   = {
  'All':                { volume: 5.05, dispatchRatio: 0.50 },
  'Parts Only ESG':     { volume: 1.00, dispatchRatio: 0.32 },
  'Parts Only ISG':     { volume: 1.05, dispatchRatio: 0.35 },
  'Parts + Labour ESG': { volume: 0.90, dispatchRatio: 0.55 },
  'Parts + Labour ISG': { volume: 0.95, dispatchRatio: 0.58 },
  'Labour Only ESG':    { volume: 0.55, dispatchRatio: 0.68 },
  'Labour Only ISG':    { volume: 0.60, dispatchRatio: 0.70 }
};
/* Segmentation share factors — All = 1.0 (whole dataset); each value is its share, so the parts sum to the whole */
const FC_COREUPSELL_FACTOR = { 'All': 1.00, 'Core': 0.60, 'Upsell': 0.40 };
const FC_WOTYPE_FACTOR     = { 'All': 1.00, 'Break Fix': 0.60, 'Part/s dispatch': 0.40 };
const FC_FQM_FACTOR        = { 'All': 1.00, '1': 0.60, '0': 0.40 };
const FC_GCFA_FACTOR       = { 'All': 1.00, 'GCFA': 0.20, 'non-GCFA': 0.75, 'Unknown': 0.05 };
const FC_BASE_ASU = 480000, FC_BASE_NC_WEEKLY = 9200, FC_BASE_APOS_WEEKLY = 21500;
const FC_EXPIRATION_RATE = 0.035, FC_BASE_RENEWAL_RATE = 0.853, FC_SR_RATIO = 0.185;

function fcCombinedFactor(filters) {
  const svc = FC_SERVICE_FACTOR[filters.service] || FC_SERVICE_FACTOR['Parts Only ESG'];
  return (FC_REGION_FACTOR[filters.region]||1) * (FC_LOB_FACTOR[filters.lob]||1) * (FC_BUSINESS_FACTOR[filters.business]||1) * svc.volume
    * (FC_COREUPSELL_FACTOR[filters.coreupsell]||1) * (FC_WOTYPE_FACTOR[filters.wotype]||1)
    * (FC_FQM_FACTOR[filters.fqm]||1) * (FC_GCFA_FACTOR[filters.gcfa]||1);
}
function fcDispatchRatio(filters) { return (FC_SERVICE_FACTOR[filters.service] || FC_SERVICE_FACTOR['Parts Only ESG']).dispatchRatio; }

function fcWeeksForQuarter(quarter) {
  const [y, qStr] = quarter.split('-Q'); const q = +qStr;
  const startWeek = (q - 1) * 13 + 1; const weeks = [];
  for (let i = 0; i < 13; i++) weeks.push(y + '-W' + String(startWeek + i).padStart(2, '0'));
  return weeks;
}

function fcGenerateWeeklySeries(filters) {
  const live = fcLiveWeeklyBase(filters);                 // real slice base, or null when simulated
  const factor = fcCombinedFactor(filters);
  const dispatchRatio = live ? fcLiveDispatchRatio(filters) : fcDispatchRatio(filters);
  const rngNC = seeded(fcSeedFor(filters, 'nc'));
  const rngAPOS = seeded(fcSeedFor(filters, 'apos'));

  // New Contracts / APOS stay modeled levers. Scale their magnitude to the slice:
  // seeded uses the multiplicative factor; live scales to the real ASU level so
  // the levers move the forecast by a sensible proportion.
  let ncApScale = factor;
  if (live && !live.empty) ncApScale = fcAvg(live.asuBase) / FC_BASE_ASU;
  const newContracts = [], apos = [];
  for (let w = 0; w < 13; w++) {
    const seasonal = 1 + 0.08 * Math.sin((w / 13) * Math.PI * 2);
    const trend = 1 + w * 0.004;
    newContracts.push(Math.round(FC_BASE_NC_WEEKLY * ncApScale * seasonal * trend * (0.94 + rngNC() * 0.12)));
    apos.push(Math.round(FC_BASE_APOS_WEEKLY * ncApScale * seasonal * trend * (0.94 + rngAPOS() * 0.12)));
  }

  // Modeled roll-forward. startPrior/expSeries let live mode anchor it to real
  // data; when omitted it behaves exactly as the original seeded model.
  function rollModeled(ncFactor, aposFactor, startPrior, expSeries) {
    const asu = []; let prior = startPrior;
    for (let w = 0; w < 13; w++) {
      const expirations = expSeries ? expSeries[w] : prior * FC_EXPIRATION_RATE;
      const renewals = apos[w] * FC_BASE_RENEWAL_RATE * aposFactor;
      const additions = newContracts[w] * ncFactor;
      const cur = prior - expirations + renewals + additions;
      asu.push(cur); prior = cur;
    }
    return asu;
  }

  if (live && !live.empty) {
    // Baseline = real observed ASU; SR/Dispatch derived by ratio.
    const asuBase = live.asuBase.slice();
    const expirations = live.expirations.slice();
    const srBase = asuBase.map(v => Math.round(v * FC_SR_RATIO));
    const dspBase = srBase.map(v => Math.round(v * dispatchRatio));
    // Levers apply as the modeled lift RELATIVE to default overrides, so the
    // real baseline is preserved at default sliders (ratio = 1) and moves
    // proportionally as NC/APOS change.
    const startPrior = asuBase[0];
    const modeledDefault = rollModeled(1, 1, startPrior, expirations);
    const rollASU = (ncFactor, aposFactor) => {
      const m = rollModeled(ncFactor, aposFactor, startPrior, expirations);
      return asuBase.map((v, w) => Math.round(v * (modeledDefault[w] ? m[w] / modeledDefault[w] : 1)));
    };
    return { weeks: live.weeks, newContracts, apos, asuBase, srBase, dspBase, expirations, factor, dispatchRatio, rollASU, source: 'live' };
  }

  // ---- seeded fallback (original behavior) ----
  const rollASU = (ncFactor, aposFactor) => rollModeled(ncFactor, aposFactor, FC_BASE_ASU * factor).map(Math.round);
  const asuBase = rollASU(1, 1);
  const srBase = asuBase.map(v => Math.round(v * FC_SR_RATIO));
  const dspBase = srBase.map(v => Math.round(v * dispatchRatio));
  const expirations = asuBase.map(v => Math.round(v * FC_EXPIRATION_RATE));
  return { weeks: fcWeeksForQuarter(filters.quarter), newContracts, apos, asuBase, srBase, dspBase, expirations, factor, dispatchRatio, rollASU, source: 'simulated' };
}

function fcSensitivity() { return { nc: 0.6, apos: 0.4 }; }
function fcApplyOverrides(series, ncOverridePct, aposOverridePct) {
  const sens = fcSensitivity();
  const ncFactor = 1 + ((ncOverridePct - 10) / 100) * sens.nc;
  const aposFactor = 1 + ((aposOverridePct - 5) / 100) * sens.apos;
  const asuAdj = series.rollASU(Math.max(0, ncFactor), Math.max(0, aposFactor));
  const srAdj = asuAdj.map(v => Math.round(v * FC_SR_RATIO));
  const dspAdj = srAdj.map(v => Math.round(v * series.dispatchRatio));
  return { asuAdj, srAdj, dspAdj, ncFactor, aposFactor };
}
function fcSum(arr) { return arr.reduce((a,b) => a+b, 0); }
function fcAvg(arr) { return arr.length ? fcSum(arr)/arr.length : 0; }

function fcPriorQuarters(quarter, n) {
  let [y, qStr] = quarter.split('-Q'); y = +y; let q = +qStr; const out = [];
  for (let i = 0; i < n; i++) { q -= 1; if (q < 1) { q = 4; y -= 1; } out.unshift(y + '-Q' + q); }
  return out;
}

function fcGenerateHistory(filters) {
  const factor = fcCombinedFactor(filters);
  const quarters = fcPriorQuarters(filters.quarter, 12);
  const rngBTC = seeded(fcSeedFor(filters, 'hist-btc'));
  const rngAcc = seeded(fcSeedFor(filters, 'hist-acc'));
  const rngAop = seeded(fcSeedFor(filters, 'hist-aop'));
  const rngMod = seeded(fcSeedFor(filters, 'hist-mod'));
  const btc = [], accuracy = [], aop = [], modern = [];
  for (let i = 0; i < 12; i++) {
    const drift = i * 0.12;
    btc.push(+(3.2 + drift + rngBTC() * 3.2).toFixed(1));
    accuracy.push(Math.round(86 + drift * 0.6 + rngAcc() * 9));
    aop.push(Math.round(76 + drift * 1.4 + rngAop() * 20));
    modern.push(Math.round(60 + drift * 1.1 + rngMod() * 15));
  }
  const rngT = seeded(fcSeedFor(filters, 'targets'));
  const aopTargetPct = Math.round(92 + rngT() * 6);
  const modernTargetPct = Math.round(70 + rngT() * 10);
  const triadCommitmentPct = Math.round(88 + rngT() * 8);
  return { quarters, btc, accuracy, aop, modern, aopTargetPct, modernTargetPct, triadCommitmentPct, factor };
}

function fcRecommendOverrides(filters) {
  const hist = fcGenerateHistory(filters);
  const avgAccuracy = fcAvg(hist.accuracy);
  const shortfall = Math.max(0, 100 - avgAccuracy);
  const nc = Math.max(0, Math.min(100, Math.round(10 + shortfall * 1.8)));
  const apos = Math.max(0, Math.min(100, Math.round(5 + shortfall * 1.2)));
  return { nc, apos, avgAccuracy: Math.round(avgAccuracy),
    rationale: `Based on a ${Math.round(avgAccuracy)}% average forecast accuracy over the last 12 fiscal quarters, a corrective override is recommended to compensate for historical variance.` };
}

function fcRecommendBTC(filters, scenarioTotals) {
  const hist = fcGenerateHistory(filters);
  const weights = [1,1,1,2,2,2,3,3,3,4,4,5];
  const wsum = weights.reduce((a,b)=>a+b,0);
  const historicalBestFit = hist.btc.reduce((s,v,i)=>s+v*weights[i],0) / wsum;
  const latestAccuracy = hist.accuracy[hist.accuracy.length - 1];
  const accuracyShortfall = Math.max(0, 100 - latestAccuracy) / 100;
  const target = scenarioTotals.srTotal * (1 + accuracyShortfall * 0.6);
  const gap = target - scenarioTotals.srTotal;
  const closestToAOP = Math.max(0, Math.min(25, (gap / scenarioTotals.srTotal) * 100));
  const balanced = (historicalBestFit + closestToAOP) / 2;
  function detail(btcPct) {
    const srAdj = Math.round(scenarioTotals.srTotal * (1 + btcPct/100));
    const dspAdj = Math.round(scenarioTotals.dspTotal * (1 + btcPct/100));
    const gapToTarget = Math.round(target - srAdj);
    const distFromHist = Math.abs(btcPct - historicalBestFit);
    const confidence = Math.max(60, Math.min(98, Math.round(95 - distFromHist * 3)));
    const risk = distFromHist <= 2 ? 'Low' : distFromHist <= 5 ? 'Medium' : 'High';
    return { btcPct: +btcPct.toFixed(2), srAdj, dspAdj, gapToTarget, confidence, risk };
  }
  return { historicalBestFit: detail(historicalBestFit), balanced: detail(balanced), closestToAOP: detail(closestToAOP),
    target: Math.round(target), aopTargetPct: hist.aopTargetPct, modernTargetPct: hist.modernTargetPct, triadCommitmentPct: hist.triadCommitmentPct, hist };
}

function fcDistributeWeekly(series, btcPct, distMode) {
  const n = series.weeks.length;
  let weights = new Array(n).fill(1);
  if (distMode === 'historical') weights = series.weeks.map((_,i) => 0.7 + (i/(n-1)) * 0.6);
  else if (distMode === 'ai') { const avg = fcAvg(series.srBase); weights = series.srBase.map(v => 1 + Math.max(0, (avg - v) / avg) * 0.8); }
  const wSum = weights.reduce((a,b)=>a+b,0);
  const wNorm = weights.map(w => w * n / wSum);
  const dsForecast = series.srBase.slice();
  const totalUplift = fcSum(dsForecast) * (btcPct/100);
  const shareBase = dsForecast.map((v,i) => v * wNorm[i]);
  const shareSum = fcSum(shareBase);
  const btcForecast = dsForecast.map((v,i) => Math.round(v + totalUplift * (shareBase[i]/shareSum)));
  const variance = btcForecast.map((v,i) => v - dsForecast[i]);
  const wowChange = btcForecast.map((v,i) => i===0 ? null : +(((v - btcForecast[i-1]) / btcForecast[i-1]) * 100).toFixed(1));
  return { weeks: series.weeks, dsForecast, btcForecast, variance, wowChange };
}

function fcCompute() {
  const filters = fcState.filters;
  const series = fcGenerateWeeklySeries(filters);
  const adj = fcApplyOverrides(series, fcState.ncOverride, fcState.aposOverride);
  const hist = fcGenerateHistory(filters);
  const originalTotals = { nc: fcSum(series.newContracts), apos: fcSum(series.apos), asu: series.asuBase[series.asuBase.length-1], sr: fcSum(series.srBase), dsp: fcSum(series.dspBase), expir: fcSum(series.expirations || []) };
  const scenarioTotals = { asu: adj.asuAdj[adj.asuAdj.length-1], sr: fcSum(adj.srAdj), dsp: fcSum(adj.dspAdj) };
  const btcRec = fcRecommendBTC(filters, { srTotal: scenarioTotals.sr, dspTotal: scenarioTotals.dsp });
  let selectedBTCPct = 0, selectedDetail = null;
  if (fcState.btcStrategy === 'manual' && fcState.manualBTC != null) {
    selectedBTCPct = fcState.manualBTC;
    const srAdj = Math.round(scenarioTotals.sr * (1 + selectedBTCPct/100));
    const dspAdj = Math.round(scenarioTotals.dsp * (1 + selectedBTCPct/100));
    selectedDetail = { btcPct: selectedBTCPct, srAdj, dspAdj, gapToTarget: Math.round(btcRec.target - srAdj), confidence: 70, risk: 'Medium' };
  } else if (fcState.btcStrategy && btcRec[fcState.btcStrategy]) {
    selectedDetail = btcRec[fcState.btcStrategy]; selectedBTCPct = selectedDetail.btcPct;
  }
  const weekly = fcDistributeWeekly({ weeks: series.weeks, srBase: adj.srAdj }, selectedBTCPct, fcState.distMode);
  const finalSR = selectedDetail ? selectedDetail.srAdj : scenarioTotals.sr;
  const finalDsp = selectedDetail ? selectedDetail.dspAdj : scenarioTotals.dsp;
  const finalGap = btcRec.target - finalSR;
  const meetsAOP = finalSR >= btcRec.target * 0.98;
  const modernAchievement = hist.modern[hist.modern.length-1];
  const meetsModernization = modernAchievement >= hist.modernTargetPct;
  const triadMinBTC = btcRec.closestToAOP.btcPct * (hist.triadCommitmentPct / 100);
  const meetsTriad = selectedBTCPct >= triadMinBTC;
  const readyForSubmission = meetsAOP && meetsModernization && !!fcState.btcStrategy;
  return { filters, series, adj, hist, btcRec, originalTotals, scenarioTotals, selectedBTCPct, selectedDetail, weekly,
    final: { sr: finalSR, dsp: finalDsp, gap: Math.round(finalGap), target: btcRec.target, btcPct: selectedBTCPct },
    status: { meetsAOP, meetsModernization, meetsTriad, readyForSubmission, modernAchievement } };
}

function fcWireFilters(onChange) {
  document.querySelectorAll('.filter-item[data-filter]').forEach(item => {
    const key = item.dataset.filter;
    if (fcDataMode === 'live' && FC_LIVE_LABEL[key]) {
      const lab = item.querySelector('.filter-label');
      if (lab) lab.textContent = FC_LIVE_LABEL[key];
    }
    const btn = item.querySelector('.filter-value');
    btn.firstChild.textContent = fcState.filters[key];
    const dd = document.createElement('div'); dd.className = 'filter-dropdown';
    FILTER_OPTIONS[key].forEach(opt => {
      const o = document.createElement('div');
      o.className = 'filter-option' + (fcState.filters[key] === opt ? ' selected' : '');
      o.textContent = opt;
      o.onclick = (e) => {
        e.stopPropagation();
        btn.firstChild.textContent = opt;
        dd.querySelectorAll('.filter-option').forEach(x => x.classList.remove('selected'));
        o.classList.add('selected'); dd.classList.remove('open');
        fcSetFilter(key, opt); onChange();
      };
      dd.appendChild(o);
    });
    item.appendChild(dd);
    btn.onclick = (e) => {
      e.stopPropagation();
      document.querySelectorAll('.filter-dropdown.open').forEach(x => { if (x!==dd) x.classList.remove('open'); });
      dd.classList.toggle('open');
    };
  });
  document.addEventListener('click', () => document.querySelectorAll('.filter-dropdown.open').forEach(x => x.classList.remove('open')));
}

function fcN(v) { return v>=1e6?(v/1e6).toFixed(2)+'M':v>=1e3?Math.round(v/1e3).toLocaleString()+'K':Math.round(v).toString(); }
function fcPct(v, d) { return v.toFixed(d==null?1:d)+'%'; }

/* ---- theme (light/dark) ---- */
function fcCurrentTheme() { return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; }
var FC_ICON_MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
var FC_ICON_SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
function fcSyncThemeBtn() {
  var dark = fcCurrentTheme() === 'dark';
  var i = document.getElementById('theme-toggle-icon'); if (i) i.innerHTML = dark ? FC_ICON_SUN : FC_ICON_MOON;
  var l = document.getElementById('theme-toggle-label'); if (l) l.textContent = dark ? 'Light mode' : 'Dark mode';
}
function fcRethemeCharts() {
  var tc = fcAxisColors();
  Object.keys(fcHCharts).forEach(function (id) {
    var c = fcHCharts[id]; if (!c) return;
    try { c.update({ xAxis: { lineColor: tc.line, crosshair: { color: tc.crosshair }, labels: { style: { color: tc.axis } } }, yAxis: { gridLineColor: tc.grid, labels: { style: { color: tc.axis } } } }, true); } catch (e) {}
  });
}
function fcApplyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem('fc_theme', t); } catch (e) {}
  fcSyncThemeBtn();
  fcRethemeCharts();
}
function fcToggleTheme() { fcApplyTheme(fcCurrentTheme() === 'dark' ? 'light' : 'dark'); }

/* ---- chart rendering: Highcharts (11.4.8) ---- */
const fcHCharts = {};
if (typeof Highcharts !== 'undefined') Highcharts.setOptions({
  chart: { style: { fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" } },
  lang: { thousandsSep: ',' }
});

function fcDefaultFmt(v) { return v >= 1000 ? fcN(v) : String(Math.round(v * 10) / 10); }

function fcHCContainer(id, fallbackH) {
  let el = document.getElementById(id);
  if (!el) return null;
  if (el.tagName.toLowerCase() === 'svg') {
    const div = document.createElement('div');
    div.id = id;
    div.style.width = '100%';
    div.style.height = (el.getAttribute('height') || fallbackH || 170) + 'px';
    el.replaceWith(div);
    el = div;
  }
  return el;
}

function fcHCTooltip(fmt) {
  const f = fmt || fcDefaultFmt;
  return {
    shared: true,
    backgroundColor: '#0f172a', borderColor: '#0f172a', borderRadius: 8,
    shadow: { color: 'rgba(15,23,42,0.28)', offsetY: 4, width: 10 },
    padding: 10,
    style: { color: '#f1f5f9', fontSize: '11.5px' },
    formatter: function () {
      let s = '<span style="font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:700">' + this.x + '</span>';
      (this.points || [this.point && { series: this.series, color: this.color, y: this.y }]).forEach(p => {
        if (!p) return;
        s += '<br/><span style="color:' + p.color + '">●</span> ' + p.series.name + ': <b>' + f(p.y) + '</b>';
      });
      return s;
    }
  };
}

function fcAxisColors() {
  var dark = document.documentElement.getAttribute('data-theme') === 'dark';
  return dark
    ? { grid: '#26324a', axis: '#9aa4bc', line: '#2a3650', crosshair: '#3a4870' }
    : { grid: '#e8edf7', axis: '#8a94ad', line: '#dde5f2', crosshair: '#c7d2e6' };
}
function fcHCAxes(labels, opts) {
  var tc = fcAxisColors();
  return {
    xAxis: {
      categories: labels,
      crosshair: { color: tc.crosshair, dashStyle: 'ShortDot', width: 1 },
      lineColor: tc.line, tickLength: 0,
      labels: { style: { color: tc.axis, fontSize: '9.5px', textOverflow: 'none', whiteSpace: 'nowrap' }, rotation: labels.length > 6 ? -35 : 0 }
    },
    yAxis: {
      title: { text: null },
      min: opts.min != null ? opts.min : 0,
      max: opts.max != null ? opts.max : null,
      gridLineColor: tc.grid,
      tickPositions: opts.yTicks || undefined,
      labels: {
        style: { color: tc.axis, fontSize: '10px' },
        formatter: function () { return opts.yFmt ? opts.yFmt(this.value) : fcDefaultFmt(this.value); }
      }
    }
  };
}

function fcDrawLineSeries(svgId, series, opts) {
  opts = opts || {};
  const el = fcHCContainer(svgId, opts.h); if (!el || typeof Highcharts === 'undefined') return;
  const labels = opts.labels || series[0].data.map((_, i) => 'P' + (i + 1));
  const sData = series.map((s, i) => ({
    name: s.name || 'Series ' + (i + 1),
    data: s.data.slice(), color: s.color,
    dashStyle: s.dashed ? 'ShortDash' : 'Solid'
  }));
  const existing = fcHCharts[svgId];
  if (existing && existing.series.length === sData.length && existing.options.chart.type === 'line') {
    existing.xAxis[0].setCategories(labels, false);
    sData.forEach((s, i) => existing.series[i].setData(s.data, false, { duration: 320 }));
    existing.redraw();
    return;
  }
  if (existing) existing.destroy();
  const ax = fcHCAxes(labels, opts);
  fcHCharts[svgId] = Highcharts.chart(el, {
    chart: { type: 'line', backgroundColor: 'transparent', spacing: [10, 8, 4, 4], animation: { duration: 320 } },
    title: { text: null }, credits: { enabled: false }, legend: { enabled: false },
    xAxis: ax.xAxis, yAxis: ax.yAxis,
    tooltip: fcHCTooltip(opts.fmt),
    plotOptions: {
      line: {
        lineWidth: 2.2,
        animation: { duration: 320 },
        marker: { enabled: false, symbol: 'circle', radius: 3.5, lineWidth: 1.5, lineColor: '#ffffff' },
        states: { hover: { lineWidthPlus: 0.6, halo: { size: 6 } } }
      }
    },
    series: sData
  });
}

function fcDrawGroupedBars(svgId, categories, seriesArr, opts) {
  opts = opts || {};
  const el = fcHCContainer(svgId, opts.h); if (!el || typeof Highcharts === 'undefined') return;
  const sData = seriesArr.map((s, i) => ({
    name: s.label || 'Series ' + (i + 1),
    data: s.values.slice(), color: s.color
  }));
  const existing = fcHCharts[svgId];
  if (existing && existing.series.length === sData.length && existing.options.chart.type === 'column') {
    existing.xAxis[0].setCategories(categories, false);
    sData.forEach((s, i) => existing.series[i].setData(s.data, false, { duration: 320 }));
    existing.redraw();
    return;
  }
  if (existing) existing.destroy();
  const ax = fcHCAxes(categories, opts);
  fcHCharts[svgId] = Highcharts.chart(el, {
    chart: { type: 'column', backgroundColor: 'transparent', spacing: [10, 8, 4, 4], animation: { duration: 320 } },
    title: { text: null }, credits: { enabled: false }, legend: { enabled: false },
    xAxis: ax.xAxis, yAxis: ax.yAxis,
    tooltip: fcHCTooltip(opts.fmt),
    plotOptions: {
      column: {
        borderRadius: 3, borderWidth: 0,
        groupPadding: 0.14, pointPadding: 0.06,
        animation: { duration: 320 },
        states: { hover: { brightness: 0.08 } }
      }
    },
    series: sData
  });
}
/* ---- Live / Simulated data-source badge ---- */
function fcInjectBadge() {
  if (typeof document === 'undefined' || document.getElementById('fc-data-badge')) return;
  const live = fcDataMode === 'live';
  const el = document.createElement('div');
  el.id = 'fc-data-badge';
  el.setAttribute('role', 'status');
  el.title = live
    ? 'Live data: ASU & Warranty Expirations read from the input workbook (dell_isg,esg_fy24-26.xlsx). SR/Dispatch are derived; New Contracts, APOS and BTC are modeled. Click to re-check.'
    : 'Simulated data: no local server detected, so figures are seeded/generated. Run "python serve.py" and click to switch to live data.';
  el.style.cssText = [
    'position:fixed', 'left:14px', 'bottom:14px', 'z-index:9999',
    'display:inline-flex', 'align-items:center', 'gap:7px',
    'font:600 11.5px/1 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
    'letter-spacing:.02em', 'padding:7px 11px', 'border-radius:999px', 'cursor:pointer',
    'user-select:none', 'box-shadow:0 4px 14px rgba(15,23,42,.16)',
    'border:1px solid ' + (live ? '#99e3d5' : '#f4d29a'),
    'background:' + (live ? '#e7f8f3' : '#fef4e2'),
    'color:' + (live ? '#0f766e' : '#b45309')
  ].join(';');
  el.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:'
    + (live ? '#0d9488' : '#d97706') + ';box-shadow:0 0 0 3px '
    + (live ? 'rgba(13,148,136,.18)' : 'rgba(217,119,6,.18)') + '"></span>'
    + (live ? 'Live data' : 'Simulated data');
  el.onclick = () => location.reload();   // re-check the data source (e.g. after starting the server)
  (document.body || document.documentElement).appendChild(el);
}

/* ---- Scenario UI: bar in the filter rail + compare modal (Phase 3) ---- */
function fcEsc(s) { return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function fcBtcLabel(k) { return { historicalBestFit:'Historical Best Fit', balanced:'Balanced', closestToAOP:'Closest to AOP', manual:'Manual' }[k] || '—'; }

function fcInjectScenarioCSS() {
  if (typeof document === 'undefined' || document.getElementById('fc-scenario-css')) return;
  const st = document.createElement('style'); st.id = 'fc-scenario-css';
  st.textContent = `
  #fc-scenario-bar{margin:0 0 16px;padding:12px;border:1px solid #d7e0ef;border-radius:12px;background:#f4f8fe;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
  #fc-scenario-bar .fc-scn-hd{display:flex;align-items:center;gap:6px;font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#0f766e;margin-bottom:7px}
  #fc-scn-select{width:100%;padding:7px 8px;border:1px solid #cfd9ea;border-radius:8px;background:#fff;font:600 12.5px Inter,sans-serif;color:#0d1020}
  .fc-scn-actions{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
  .fc-scn-actions button{flex:1 1 auto;padding:5px 8px;border:1px solid #cfd9ea;border-radius:7px;background:#fff;font:600 11px Inter,sans-serif;color:#37415a;cursor:pointer}
  .fc-scn-actions button:hover{background:#eef3fb;border-color:#b4c2dd}
  .fc-scn-actions button.fc-scn-cmp{background:#0d9488;border-color:#0d9488;color:#fff;flex-basis:100%}
  .fc-scn-actions button.fc-scn-cmp:hover{background:#0b7f74}
  .fc-scn-presets{margin-top:9px;padding-top:9px;border-top:1px dashed #d7e0ef}
  .fc-scn-presets .fc-scn-plabel{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#8a94ad;margin-bottom:5px}
  .fc-scn-presets .fc-scn-chips{display:flex;gap:5px}
  .fc-scn-presets button{flex:1;padding:5px 6px;border:1px solid #cfd9ea;border-radius:999px;background:#fff;font:600 10.5px Inter,sans-serif;color:#37415a;cursor:pointer}
  .fc-scn-presets button:hover{background:#e7f8f3;border-color:#99e3d5;color:#0f766e}
  .fc-cmp-overlay{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:10000;display:flex;align-items:center;justify-content:center}
  .fc-cmp-overlay[hidden]{display:none}
  .fc-cmp-modal{background:#fff;border-radius:16px;max-width:820px;width:92%;max-height:88vh;overflow:auto;padding:20px;box-shadow:0 24px 60px rgba(15,23,42,.3);font-family:Inter,sans-serif}
  .fc-cmp-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
  .fc-cmp-head b{font-size:16px;color:#0d1020}
  #fc-cmp-close{border:none;background:#eef1f7;border-radius:8px;width:30px;height:30px;font-size:15px;cursor:pointer;color:#5a6280}
  .fc-cmp-pick{display:flex;flex-wrap:wrap;gap:12px;align-items:center;padding:10px 0 14px;border-bottom:1px solid #eef1f7;margin-bottom:12px}
  .fc-cmp-pick label{font-size:12.5px;color:#37415a;display:flex;gap:5px;align-items:center}
  .fc-cmp-hint{font-size:11.5px;color:#8a94ad}
  .fc-cmp-table{width:100%;border-collapse:collapse;font-size:12.5px}
  .fc-cmp-table th,.fc-cmp-table td{padding:9px 12px;text-align:right;border-bottom:1px solid #eef1f7}
  .fc-cmp-table th:first-child,.fc-cmp-table td.fc-cmp-lbl{text-align:left;color:#5a6280;font-weight:600}
  .fc-cmp-table thead th{color:#0d1020;font-weight:800;border-bottom:2px solid #dbe3f0}
  .fc-cmp-table td{font-variant-numeric:tabular-nums;color:#0d1020}`;
  document.head.appendChild(st);
}

function fcRenderScenarioBar() {
  const bar = document.getElementById('fc-scenario-bar'); if (!bar) return;
  const list = fcState.scenarios || [];
  const active = fcState.activeScenarioId;
  bar.innerHTML =
    '<div class="fc-scn-hd"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/></svg>Scenario</div>' +
    '<select id="fc-scn-select">' + list.map(s => `<option value="${s.id}" ${s.id===active?'selected':''}>${fcEsc(s.name)}</option>`).join('') + '</select>' +
    '<div class="fc-scn-actions">' +
      '<button data-act="new">New</button>' +
      '<button data-act="dup">Duplicate</button>' +
      '<button data-act="rename">Rename</button>' +
      '<button data-act="del">Delete</button>' +
      '<button data-act="cmp" class="fc-scn-cmp">Compare scenarios</button>' +
    '</div>' +
    '<div class="fc-scn-presets"><div class="fc-scn-plabel">Presets (apply to current slice)</div><div class="fc-scn-chips">' +
      Object.keys(FC_PRESETS).map(p => `<button data-preset="${p}">${p}</button>`).join('') +
    '</div></div>';

  bar.querySelector('#fc-scn-select').addEventListener('change', e => fcSwitchScenario(e.target.value));
  bar.querySelectorAll('[data-act]').forEach(btn => btn.addEventListener('click', () => {
    const act = btn.dataset.act, cur = fcActiveScenario();
    if (act === 'new') { const n = prompt('Name this scenario', 'Scenario ' + ((fcState.scenarios||[]).length + 1)); if (n) { fcSaveAsScenario(n.trim()); fcRenderScenarioBar(); } }
    else if (act === 'dup') { fcDuplicateScenario(fcState.activeScenarioId); fcRenderScenarioBar(); }
    else if (act === 'rename') { const n = prompt('Rename scenario', cur ? cur.name : ''); if (n) { fcRenameScenario(fcState.activeScenarioId, n.trim()); fcRenderScenarioBar(); } }
    else if (act === 'del') { if ((fcState.scenarios||[]).length <= 1) { alert('Keep at least one scenario.'); return; } if (confirm(`Delete "${cur ? cur.name : ''}"?`)) { const wasActive = fcDeleteScenario(fcState.activeScenarioId); if (wasActive && location.reload) location.reload(); else fcRenderScenarioBar(); } }
    else if (act === 'cmp') fcOpenCompare();
  }));
  bar.querySelectorAll('[data-preset]').forEach(btn => btn.addEventListener('click', () => fcApplyPreset(btn.dataset.preset)));
}

function fcInjectScenarioUI() {
  if (typeof document === 'undefined') return;
  fcInjectScenarioCSS();
  const rail = document.querySelector('.filter-rail');
  if (rail && !document.getElementById('fc-scenario-bar')) {
    const bar = document.createElement('div'); bar.id = 'fc-scenario-bar';
    const sub = rail.querySelector('.filter-rail-sub');
    if (sub && sub.nextSibling) rail.insertBefore(bar, sub.nextSibling);
    else if (sub) rail.appendChild(bar);
    else rail.insertBefore(bar, rail.firstChild);
    fcRenderScenarioBar();
  }
  if (!document.getElementById('fc-cmp-overlay')) {
    const ov = document.createElement('div'); ov.id = 'fc-cmp-overlay'; ov.className = 'fc-cmp-overlay'; ov.hidden = true;
    ov.innerHTML = '<div class="fc-cmp-modal"><div class="fc-cmp-head"><b>Compare scenarios</b><button id="fc-cmp-close" title="Close">✕</button></div><div class="fc-cmp-pick" id="fc-cmp-pick"></div><div id="fc-cmp-body"></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', e => { if (e.target === ov) ov.hidden = true; });
    const closeBtn = ov.querySelector('#fc-cmp-close');
    if (closeBtn) closeBtn.addEventListener('click', () => { ov.hidden = true; });
  }
}

function fcOpenCompare() {
  const ov = document.getElementById('fc-cmp-overlay'); if (!ov) return;
  const list = fcState.scenarios || [];
  const chosen = new Set([fcState.activeScenarioId]);
  for (const s of list) { if (chosen.size >= 3) break; chosen.add(s.id); }
  document.getElementById('fc-cmp-pick').innerHTML =
    '<span class="fc-cmp-hint">Pick up to 3 scenarios:</span>' +
    list.map(s => `<label><input type="checkbox" value="${s.id}" ${chosen.has(s.id)?'checked':''}>${fcEsc(s.name)}</label>`).join('');
  document.querySelectorAll('#fc-cmp-pick input').forEach(cb => cb.addEventListener('change', fcRenderCompare));
  fcRenderCompare();
  ov.hidden = false;
}

function fcRenderCompare() {
  const boxes = [...document.querySelectorAll('#fc-cmp-pick input')];
  const ids = boxes.filter(b => b.checked).map(b => b.value).slice(0, 3);
  boxes.forEach(b => { b.disabled = (!b.checked && ids.length >= 3); });
  const list = fcState.scenarios || [];
  const cols = ids.map(id => list.find(s => s.id === id)).filter(Boolean);
  const body = document.getElementById('fc-cmp-body');
  if (!cols.length) { body.innerHTML = '<p class="fc-cmp-hint">Select at least one scenario.</p>'; return; }
  const rows = cols.map(s => ({ name: s.name, plan: s.plan, r: fcComputeFor(s.plan) }));
  const metrics = [
    ['Slice',                 x => `${x.plan.filters.quarter} · ${x.plan.filters.region} · ${x.plan.filters.lob}`],
    ['NC / APOS override',    x => `${x.plan.ncOverride}% / ${x.plan.aposOverride}%`],
    ['BTC strategy',          x => fcBtcLabel(x.plan.btcStrategy)],
    ['BTC %',                 x => fcPct(x.r.final.btcPct || 0, 2)],
    ['ASU baseline (qtr end)',x => fcN(x.r.originalTotals.asu)],
    ['ASU scenario (levers)', x => fcN(x.r.scenarioTotals.asu)],
    ['SR scenario (levers)',  x => fcN(x.r.scenarioTotals.sr)],
    ['Dispatch scenario',     x => fcN(x.r.scenarioTotals.dsp)],
    ['Final SR (with BTC)',   x => fcN(x.r.final.sr)],
    ['Forecast accuracy',     x => x.r.hist.accuracy[x.r.hist.accuracy.length-1] + '%']
  ];
  let html = '<table class="fc-cmp-table"><thead><tr><th></th>' + rows.map(x => `<th>${fcEsc(x.name)}</th>`).join('') + '</tr></thead><tbody>';
  for (const [label, fn] of metrics) html += `<tr><td class="fc-cmp-lbl">${label}</td>` + rows.map(x => `<td>${fn(x)}</td>`).join('') + '</tr>';
  html += '</tbody></table>';
  body.innerHTML = html;
}

/* ==== END SHARED ENGINE ==== */
fcInitData();        // decide live vs simulated before any page render (synchronous)
fcSyncThemeBtn();
function fcBoot() { fcInjectBadge(); fcInjectScenarioUI(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fcBoot);
else fcBoot();