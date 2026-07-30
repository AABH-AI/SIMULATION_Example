/*
 * Forecast Copilot -- shared engine (fc_engine v1)
 * Single source of truth for all 6 pages. Loaded before each page-specific inline script.
 * Requires Highcharts (loaded via CDN in <head>) to be present before this file runs.
 *
 * Highcharts 11.4.8 is used under its free non-commercial license (research/demo use only).
 */

/* ==== FORECAST COPILOT SHARED ENGINE (fc_engine v1) ==== */
const FILTER_OPTIONS = {
  fy: ['All','FY22','FY23','FY24','FY25','FY26','FY27'],
  quarter: (()=>{const a=['All'];for(let y=2022;y<=2027;y++)for(let q=1;q<=4;q++)a.push(y+'-Q'+q);return a;})(),
  week: (()=>{const a=['All'];for(let y=2022;y<=2027;y++)for(let w=1;w<=53;w++)a.push(y+'-W'+String(w).padStart(2,'0'));return a;})(),
  region: ['All','AMERICAS','EMEA','APJ'],
  lob: ['All','Server Line A','Storage Array A','Storage Array C','Storage Array D','Hyperconverged A','Data Protection A','Networking A','Networking B'],
  business: ['All','Unit A','Unit B'],
  warranty: ['All','Basic','Premium','Premium Flex','Premium Plus'],
  service: ['All','Parts Only (Unit A)','Parts Only (Unit B)','Parts + Labour (Unit A)','Parts + Labour (Unit B)','Labour Only (Unit A)','Labour Only (Unit B)'],
  coreupsell: ['All','Core','Upsell'],
  wotype: ['All','Break Fix','Part/s dispatch'],
  fqm: ['All','1','0'],
  gcfa: ['All','GCFA','non-GCFA','Unknown']
};

const FC_STATE_KEY = 'fc_state_v2';   // v2: generic de-branded filter values (old v1 keys are incompatible — discarded on upgrade)
const FC_DEFAULT_STATE = {
  filters: { fy: 'All', quarter: '2025-Q1', week: '2025-W01', region: 'AMERICAS', lob: 'Server Line A', business: 'Unit A', warranty: 'All', service: 'Parts + Labour (Unit A)', coreupsell: 'All', wotype: 'All', fqm: 'All', gcfa: 'All' },
  ncOverride: 10, renewOverride: 5, simMode: 'manual',
  // (2) BTC Signals drive the selected BTC by default across all pages.
  btcStrategy: 'signals', manualBTC: null, distMode: 'equal',
  // (2) BTC Signals — equal-weight levers whose average IS the selected BTC %.
  btcSignals: [
    { name: 'Modernization',      value: 65 },
    { name: 'Triad Commitment',   value: 70 },
    { name: 'Quality Improvement', value: 50 }
  ],
  weekOverrides: {},
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
        approvals: { ...FC_DEFAULT_STATE.approvals, ...(parsed.approvals||{}) },
        weekOverrides: { ...(parsed.weekOverrides||{}) } };
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
const FC_PLAN_KEYS = ['filters','ncOverride','renewOverride','simMode','btcStrategy','manualBTC','btcSignals','distMode','weekOverrides','approvals'];
const FC_PRESETS = {
  Baseline:     { ncOverride:10, renewOverride:5,  simMode:'manual', btcStrategy:null,                manualBTC:null, distMode:'equal' },
  Aggressive:   { ncOverride:30, renewOverride:20, simMode:'manual', btcStrategy:'historicalBestFit', manualBTC:null, distMode:'ai' },
  Conservative: { ncOverride:0,  renewOverride:0,  simMode:'manual', btcStrategy:'closestToAOP',       manualBTC:null, distMode:'historical' }
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

/* ---- Per-week edits + change ledger (Phase 4) ----
 * weekOverrides (a plan field) maps a fiscal-week label to a hand-typed BTC
 * Forecast value; fcDistributeWeekly applies them and fcCompute reflects the
 * result in the final SR, so an edit flows through to every page. Each edit is
 * appended as a timestamped delta to the ACTIVE scenario's ledger (an audit
 * trail that travels with the scenario). */
function fcNowISO() { try { return new Date().toISOString(); } catch (e) { return ''; } }
function fcScenarioLedger() { const s = fcActiveScenario(); if (!s) return []; if (!s.ledger) s.ledger = []; return s.ledger; }
function fcLogEdit(entry) { const s = fcActiveScenario(); if (!s) return; if (!s.ledger) s.ledger = []; s.ledger.push({ ts: fcNowISO(), ...entry }); }
function fcSetWeekOverride(week, value) {
  if (!fcState.weekOverrides) fcState.weekOverrides = {};
  const prev = fcState.weekOverrides[week];
  fcState.weekOverrides[week] = value;
  fcLogEdit({ action: 'set', field: 'btcForecast', week, from: (prev == null ? null : prev), to: value });
  fcSaveState(fcState);
}
function fcClearWeekOverride(week) {
  if (fcState.weekOverrides && week in fcState.weekOverrides) {
    const prev = fcState.weekOverrides[week];
    delete fcState.weekOverrides[week];
    fcLogEdit({ action: 'reset', field: 'btcForecast', week, from: prev, to: null });
    fcSaveState(fcState);
  }
}
function fcClearAllWeekOverrides() {
  const keys = Object.keys(fcState.weekOverrides || {});
  if (!keys.length) return;
  fcState.weekOverrides = {};
  fcLogEdit({ action: 'reset-all', field: 'btcForecast', week: '*', count: keys.length, from: null, to: null });
  fcSaveState(fcState);
}

let fcState = fcLoadState();
function fcSetFilter(key, value) { fcState.filters[key] = value; fcSaveState(fcState); }

// (2.2.1) Display-only relabels: the dropdown shows the label, state/matching keep
// the real value (so live-data filtering still works).
const FC_OPT_LABEL = { lob: { 'Hyperconverged A': 'Hyper A' } };
function fcOptLabel(key, val) { return (FC_OPT_LABEL[key] && FC_OPT_LABEL[key][val]) || val; }

/* ==== DATA PROVIDER (Phase 2) ============================================
 * Live mode: the real input workbook, read via serve.py's GET /api/dataset.
 * Simulated mode: the seeded generator below (used when there is no server,
 * e.g. opening a page from file://). The mode is decided once at load and
 * surfaced by a "Live / Simulated" badge. In live mode:
 *   - real weekly ASU + Warranty Expirations drive each slice,
 *   - SR / Dispatch stay derived (ratios),
 *   - New Contracts / RENEW stay modeled levers (no such columns exist),
 *   - filter OPTIONS are derived from the data's own distinct values.
 * Historical BTC / accuracy / AOP remain modeled overlays in both modes.
 * ------------------------------------------------------------------------ */
var fcDataMode = 'simulated';   // 'live' once /api/dataset loads successfully
var fcDataset = null;           // raw /api/dataset payload
var fcLiveRows = null;          // cached row array for slice aggregation

// Engine filter key -> real dataset field. Keys absent here are seeded-only.
// 'business' maps to the real Business Unit column (Unit A / Unit B); 'lob' maps
// to the Product column.
const FC_LIVE_FIELD = {
  fy: 'fy', quarter: 'fiscalQuarter', week: 'fiscalWeek', region: 'region', lob: 'product',
  business: 'businessUnit', warranty: 'warrantyType', service: 'serviceType', coreupsell: 'coreUpsell',
  wotype: 'woType', fqm: 'fqmFlag', gcfa: 'gcfaType'
};
// Relabel the filter rail in live mode where the seeded label no longer fits.
const FC_LIVE_LABEL = { lob: 'Product', business: 'Business Unit', quarter: 'Fiscal Qrtr' };
const FC_SIM_LABEL  = { business: 'Business Unit', quarter: 'Fiscal Qrtr' };
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
  // (3.2) Every dropdown leads with 'All' — including Fiscal Year / Quarter / Week.
  FILTER_OPTIONS.fy         = withAll('fy');
  FILTER_OPTIONS.quarter    = withAll('fiscalQuarter');
  FILTER_OPTIONS.week       = withAll('fiscalWeek');
  FILTER_OPTIONS.region     = withAll('region');
  FILTER_OPTIONS.lob        = withAll('product');
  FILTER_OPTIONS.business    = withAll('businessUnit');
  FILTER_OPTIONS.warranty   = withAll('warrantyType');
  FILTER_OPTIONS.service    = withAll('serviceType');
  FILTER_OPTIONS.coreupsell = withAll('coreUpsell');
  FILTER_OPTIONS.wotype     = withAll('woType');
  FILTER_OPTIONS.fqm        = withAll('fqmFlag');
  FILTER_OPTIONS.gcfa       = withAll('gcfaType');
}

function fcRepairLiveFilters() {
  // A stored fc_state_v1 (or the seeded defaults) may hold values that don't
  // exist in the real data (case/casing mismatches, retired service-type
  // combos, ...). Snap any invalid value to a sensible real one so the
  // default live slice is populated.
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
  const q = fcEffectiveQuarter(filters.quarter);
  const weeks = fcWeeksForQuarter(q);
  const sums = Object.create(null);
  weeks.forEach((w) => { sums[w] = { asu: 0, exp: 0, has: false }; });
  for (let i = 0; i < fcLiveRows.length; i++) {
    const r = fcLiveRows[i];
    if (r.fiscalQuarter !== q) continue;
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
const FC_LOB_FACTOR       = { All: 6.25, 'Server Line A': 1.20, 'Storage Array A': 0.90, 'Storage Array C': 0.80, 'Storage Array D': 0.85, 'Hyperconverged A': 1.00, 'Data Protection A': 0.50, 'Networking A': 0.60, 'Networking B': 0.40 };
const FC_BUSINESS_FACTOR  = { All: 2.30, 'Unit A': 1.84, 'Unit B': 0.46 };   /* Unit A ~80% share, Unit B ~20%; All = sum of parts */
const FC_WARRANTY_FACTOR  = { All: 1.00, 'Basic': 0.30, 'Premium': 0.40, 'Premium Flex': 0.10, 'Premium Plus': 0.20 };  /* segmentation shares — All = 1.0 leaves totals unchanged */
const FC_SERVICE_FACTOR   = {
  'All':                    { volume: 5.05, dispatchRatio: 0.50 },
  'Parts Only (Unit A)':    { volume: 1.00, dispatchRatio: 0.32 },
  'Parts Only (Unit B)':    { volume: 1.05, dispatchRatio: 0.35 },
  'Parts + Labour (Unit A)':{ volume: 0.90, dispatchRatio: 0.55 },
  'Parts + Labour (Unit B)':{ volume: 0.95, dispatchRatio: 0.58 },
  'Labour Only (Unit A)':   { volume: 0.55, dispatchRatio: 0.68 },
  'Labour Only (Unit B)':   { volume: 0.60, dispatchRatio: 0.70 }
};
/* Segmentation share factors — All = 1.0 (whole dataset); each value is its share, so the parts sum to the whole */
const FC_COREUPSELL_FACTOR = { 'All': 1.00, 'Core': 0.60, 'Upsell': 0.40 };
const FC_WOTYPE_FACTOR     = { 'All': 1.00, 'Break Fix': 0.60, 'Part/s dispatch': 0.40 };
const FC_FQM_FACTOR        = { 'All': 1.00, '1': 0.60, '0': 0.40 };
const FC_GCFA_FACTOR       = { 'All': 1.00, 'GCFA': 0.20, 'non-GCFA': 0.75, 'Unknown': 0.05 };
const FC_BASE_ASU = 480000, FC_BASE_NC_WEEKLY = 9200, FC_BASE_RENEW_WEEKLY = 21500;
const FC_EXPIRATION_RATE = 0.035, FC_BASE_RENEWAL_RATE = 0.853, FC_SR_RATIO = 0.185;

function fcCombinedFactor(filters) {
  const svc = FC_SERVICE_FACTOR[filters.service] || FC_SERVICE_FACTOR['Parts Only (Unit A)'];
  return (FC_REGION_FACTOR[filters.region]||1) * (FC_LOB_FACTOR[filters.lob]||1) * (FC_BUSINESS_FACTOR[filters.business]||1) * svc.volume
    * (FC_WARRANTY_FACTOR[filters.warranty]||1)
    * (FC_COREUPSELL_FACTOR[filters.coreupsell]||1) * (FC_WOTYPE_FACTOR[filters.wotype]||1)
    * (FC_FQM_FACTOR[filters.fqm]||1) * (FC_GCFA_FACTOR[filters.gcfa]||1);
}
function fcDispatchRatio(filters) { return (FC_SERVICE_FACTOR[filters.service] || FC_SERVICE_FACTOR['Parts Only (Unit A)']).dispatchRatio; }

// (3.2) The weekly view is quarter-based, so a 'All'/invalid quarter selection
// falls back to the latest real fiscal quarter available (keeps the 13-week series
// well-defined instead of breaking on 'All').
function fcEffectiveQuarter(q) {
  const f = (typeof fcState !== 'undefined' && fcState.filters) ? fcState.filters : {};
  q = q || f.quarter;
  if (typeof q === 'string' && /^\d{4}-Q[1-4]$/.test(q)) return q;
  const reals = (FILTER_OPTIONS.quarter || []).filter(x => /^\d{4}-Q[1-4]$/.test(x)).sort();
  // quarter='All' but a specific Fiscal Year chosen -> latest quarter of that year.
  const m = /^FY(\d{2})$/.exec(f.fy || '');
  if (m) {
    const inFy = reals.filter(x => x.slice(0, 4) === '20' + m[1]);
    if (inFy.length) return inFy[inFy.length - 1];
  }
  return reals.length ? reals[reals.length - 1] : '2025-Q1';
}

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
  const rngRENEW = seeded(fcSeedFor(filters, 'renew'));

  // New Contracts / RENEW stay modeled levers. Scale their magnitude to the slice:
  // seeded uses the multiplicative factor; live scales to the real ASU level so
  // the levers move the forecast by a sensible proportion.
  let ncApScale = factor;
  if (live && !live.empty) ncApScale = fcAvg(live.asuBase) / FC_BASE_ASU;
  const newContracts = [], renew = [];
  for (let w = 0; w < 13; w++) {
    const seasonal = 1 + 0.08 * Math.sin((w / 13) * Math.PI * 2);
    const trend = 1 + w * 0.004;
    newContracts.push(Math.round(FC_BASE_NC_WEEKLY * ncApScale * seasonal * trend * (0.94 + rngNC() * 0.12)));
    renew.push(Math.round(FC_BASE_RENEW_WEEKLY * ncApScale * seasonal * trend * (0.94 + rngRENEW() * 0.12)));
  }

  // Modeled roll-forward. startPrior/expSeries let live mode anchor it to real
  // data; when omitted it behaves exactly as the original seeded model.
  function rollModeled(ncFactor, renewFactor, startPrior, expSeries) {
    const asu = []; let prior = startPrior;
    for (let w = 0; w < 13; w++) {
      const expirations = expSeries ? expSeries[w] : prior * FC_EXPIRATION_RATE;
      const renewals = renew[w] * FC_BASE_RENEWAL_RATE * renewFactor;
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
    // proportionally as NC/RENEW change.
    const startPrior = asuBase[0];
    const modeledDefault = rollModeled(1, 1, startPrior, expirations);
    const rollASU = (ncFactor, renewFactor) => {
      const m = rollModeled(ncFactor, renewFactor, startPrior, expirations);
      return asuBase.map((v, w) => Math.round(v * (modeledDefault[w] ? m[w] / modeledDefault[w] : 1)));
    };
    return { weeks: live.weeks, newContracts, renew, asuBase, srBase, dspBase, expirations, factor, dispatchRatio, rollASU, source: 'live' };
  }

  // ---- seeded fallback (original behavior) ----
  const rollASU = (ncFactor, renewFactor) => rollModeled(ncFactor, renewFactor, FC_BASE_ASU * factor).map(Math.round);
  const asuBase = rollASU(1, 1);
  const srBase = asuBase.map(v => Math.round(v * FC_SR_RATIO));
  const dspBase = srBase.map(v => Math.round(v * dispatchRatio));
  const expirations = asuBase.map(v => Math.round(v * FC_EXPIRATION_RATE));
  return { weeks: fcWeeksForQuarter(fcEffectiveQuarter(filters.quarter)), newContracts, renew, asuBase, srBase, dspBase, expirations, factor, dispatchRatio, rollASU, source: 'simulated' };
}

function fcSensitivity() { return { nc: 0.6, renew: 0.4 }; }
function fcApplyOverrides(series, ncOverridePct, renewOverridePct) {
  const sens = fcSensitivity();
  const ncFactor = 1 + ((ncOverridePct - 10) / 100) * sens.nc;
  const renewFactor = 1 + ((renewOverridePct - 5) / 100) * sens.renew;
  const asuAdj = series.rollASU(Math.max(0, ncFactor), Math.max(0, renewFactor));
  const srAdj = asuAdj.map(v => Math.round(v * FC_SR_RATIO));
  const dspAdj = srAdj.map(v => Math.round(v * series.dispatchRatio));
  return { asuAdj, srAdj, dspAdj, ncFactor, renewFactor };
}
function fcSum(arr) { return arr.reduce((a,b) => a+b, 0); }
function fcAvg(arr) { return arr.length ? fcSum(arr)/arr.length : 0; }

// (2) Equal-weight average of the BTC Signals — this value (0–100) IS the
// selected BTC %. e.g. 4 signals at 100 -> 100; all at 50 -> 50.
function fcSignalsAverage(signals) {
  const arr = (signals || []).map(s => +s.value).filter(v => !isNaN(v));
  return arr.length ? arr.reduce((a,b) => a+b, 0) / arr.length : 0;
}

// Least-squares straight trend line over a series of y-values (x = index).
function fcTrendline(ys) {
  const n = ys.length; if (!n) return [];
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let i = 0; i < n; i++) { sx += i; sy += ys[i]; sxx += i * i; sxy += i * ys[i]; }
  const denom = (n * sxx - sx * sx) || 1;
  const m = (n * sxy - sx * sy) / denom, b = (sy - m * sx) / n;
  return ys.map((_, i) => m * i + b);
}

// Split a total across a factor map's keys in proportion to each key's factor.
function distributeByFactor(factorMap, total) {
  const keys = Object.keys(factorMap);
  const vals = keys.map(k => typeof factorMap[k] === 'object' ? factorMap[k].volume : factorMap[k]);
  const sum = vals.reduce((a,b) => a+b, 0) || 1;
  return keys.map((k,i) => ({ key: k, value: Math.round(total * vals[i] / sum) }));
}

function fcPriorQuarters(quarter, n) {
  let [y, qStr] = quarter.split('-Q'); y = +y; let q = +qStr; const out = [];
  for (let i = 0; i < n; i++) { q -= 1; if (q < 1) { q = 4; y -= 1; } out.unshift(y + '-Q' + q); }
  return out;
}

// (4.2) The most recent `n` fiscal quarters actually present in the loaded input
// workbook (FILTER_OPTIONS.quarter is read from the dataset when live). Returns
// null if fewer than `n` are available so callers can fall back.
function fcRecentFileQuarters(n) {
  const all = (FILTER_OPTIONS.quarter || []).slice().sort();   // 'YYYY-QN' sorts chronologically
  return all.length >= n ? all.slice(all.length - n) : null;
}

function fcGenerateHistory(filters) {
  const factor = fcCombinedFactor(filters);
  // (4.2) x-axis periods come from the input file's own fiscal quarters (most
  // recent 12), falling back to quarters derived from the selected slice.
  const quarters = fcRecentFileQuarters(12) || fcPriorQuarters(filters.quarter, 12);
  const rngBTC = seeded(fcSeedFor(filters, 'hist-btc'));
  const rngAcc = seeded(fcSeedFor(filters, 'hist-acc'));
  const rngAop = seeded(fcSeedFor(filters, 'hist-aop'));
  const rngMod = seeded(fcSeedFor(filters, 'hist-mod'));
  const btc = [], accuracy = [], aop = [], modern = [];
  for (let i = 0; i < 12; i++) {
    const drift = i * 0.12;
    // (1.2) Historical BTC varies across the 55%–85% band.
    const bv = Math.max(55, Math.min(85, 55 + drift * 1.2 + rngBTC() * 28));
    btc.push(+bv.toFixed(1));
    // (1.3) Forecast accuracy tracks BTC: peaks at 92% when BTC ≈ 75%, tapering
    // as BTC moves away (so it's highest inside the 65%–80% sweet spot).
    const acc = 92 - Math.abs(bv - 75) * 0.8 + (rngAcc() * 2 - 1);
    accuracy.push(Math.round(Math.max(70, Math.min(92, acc))));
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
  const renew = Math.max(0, Math.min(100, Math.round(5 + shortfall * 1.2)));
  return { nc, renew, avgAccuracy: Math.round(avgAccuracy),
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

function fcDistributeWeekly(series, btcPct, distMode, overrides) {
  const n = series.weeks.length;
  let weights = new Array(n).fill(1);
  if (distMode === 'historical') weights = series.weeks.map((_,i) => 0.7 + (i/(n-1)) * 0.6);
  else if (distMode === 'ai') { const avg = fcAvg(series.srBase); weights = series.srBase.map(v => 1 + Math.max(0, (avg - v) / avg) * 0.8); }
  const wSum = weights.reduce((a,b)=>a+b,0);
  const wNorm = weights.map(w => w * n / wSum);
  const dsForecast = series.srBase.slice();
  const totalUplift = fcSum(dsForecast) * (btcPct/100);
  const shareBase = dsForecast.map((v,i) => v * wNorm[i]);
  const shareSum = fcSum(shareBase) || 1;
  // Per-week edits (Phase 4): an override replaces that week's BTC Forecast with
  // the hand-typed value; other weeks keep their computed distribution.
  overrides = overrides || {};
  const edited = series.weeks.map(w => overrides[w] != null);
  const btcForecast = dsForecast.map((v,i) => edited[i]
    ? Math.round(overrides[series.weeks[i]])
    : Math.round(v + totalUplift * (shareBase[i] / shareSum)));
  const variance = btcForecast.map((v,i) => v - dsForecast[i]);
  const wowChange = btcForecast.map((v,i) => (i === 0 || !btcForecast[i-1]) ? null : +(((v - btcForecast[i-1]) / btcForecast[i-1]) * 100).toFixed(1));
  return { weeks: series.weeks, dsForecast, btcForecast, variance, wowChange, edited, hasOverrides: edited.some(Boolean) };
}

function fcCompute() {
  const filters = fcState.filters;
  const series = fcGenerateWeeklySeries(filters);
  const adj = fcApplyOverrides(series, fcState.ncOverride, fcState.renewOverride);
  const hist = fcGenerateHistory(filters);
  const originalTotals = { nc: fcSum(series.newContracts), renew: fcSum(series.renew), asu: series.asuBase[series.asuBase.length-1], sr: fcSum(series.srBase), dsp: fcSum(series.dspBase), expir: fcSum(series.expirations || []) };
  const scenarioTotals = { asu: adj.asuAdj[adj.asuAdj.length-1], sr: fcSum(adj.srAdj), dsp: fcSum(adj.dspAdj) };
  const btcRec = fcRecommendBTC(filters, { srTotal: scenarioTotals.sr, dspTotal: scenarioTotals.dsp });
  let selectedBTCPct = 0, selectedDetail = null;
  if (fcState.btcStrategy === 'manual' && fcState.manualBTC != null) {
    selectedBTCPct = fcState.manualBTC;
    const srAdj = Math.round(scenarioTotals.sr * (1 + selectedBTCPct/100));
    const dspAdj = Math.round(scenarioTotals.dsp * (1 + selectedBTCPct/100));
    selectedDetail = { btcPct: selectedBTCPct, srAdj, dspAdj, gapToTarget: Math.round(btcRec.target - srAdj), confidence: 70, risk: 'Medium' };
  } else if (fcState.btcStrategy === 'signals') {
    // (2) Selected BTC = equal-weight average of the BTC Signals, rounded to a
    // whole percent (avg 61.7 -> 62%), applied as a literal % uplift downstream.
    selectedBTCPct = Math.round(Math.max(0, Math.min(100, fcSignalsAverage(fcState.btcSignals))));
    const srAdj = Math.round(scenarioTotals.sr * (1 + selectedBTCPct/100));
    const dspAdj = Math.round(scenarioTotals.dsp * (1 + selectedBTCPct/100));
    selectedDetail = { btcPct: +selectedBTCPct.toFixed(2), srAdj, dspAdj, gapToTarget: Math.round(btcRec.target - srAdj), confidence: 80, risk: 'Medium' };
  } else if (fcState.btcStrategy && btcRec[fcState.btcStrategy]) {
    selectedDetail = btcRec[fcState.btcStrategy]; selectedBTCPct = selectedDetail.btcPct;
  }
  const weekly = fcDistributeWeekly({ weeks: series.weeks, srBase: adj.srAdj }, selectedBTCPct, fcState.distMode, fcState.weekOverrides);
  let finalSR = selectedDetail ? selectedDetail.srAdj : scenarioTotals.sr;
  let finalDsp = selectedDetail ? selectedDetail.dspAdj : scenarioTotals.dsp;
  if (weekly.hasOverrides) {   // hand-edited weeks make the plan bottom-up: total = sum of weekly BTC Forecast
    finalSR = fcSum(weekly.btcForecast);
    const ratio = scenarioTotals.sr ? (scenarioTotals.dsp / scenarioTotals.sr) : series.dispatchRatio;
    finalDsp = Math.round(finalSR * ratio);
  }
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

// Size a filter dropdown to span the full filter-rail width with symmetric gaps
// (measured on open, so it's exact regardless of grid column or zoom).
// Open a filter dropdown as a FIXED overlay (so the rail's overflow can't clip it),
// spanning the rail width with symmetric gaps, flipped above/below to whichever side
// has room, and height-capped to fit (long lists like Fiscal Week scroll inside).
// All measurements are getBoundingClientRect (visual px); style values are CSS px, so
// divide by the app zoom z.
function fcFitDropdownToRail(dd, item) {
  const rail = item.closest('.filter-rail'); if (!rail || !dd) return;
  const z = (typeof fcGetZoom === 'function') ? fcGetZoom() : 1;
  const rs = getComputedStyle(rail);
  const rr = rail.getBoundingClientRect();
  const br = (item.querySelector('.filter-value') || item).getBoundingClientRect();
  const innerLeft = rr.left + (parseFloat(rs.paddingLeft) || 0) * z;
  const innerRight = rr.right - (parseFloat(rs.paddingRight) || 0) * z;
  const gap = 4 * z;

  dd.style.position = 'fixed';
  dd.style.zIndex = '9999';
  dd.style.right = 'auto';
  dd.style.bottom = 'auto';
  dd.style.left = (innerLeft / z) + 'px';
  dd.style.width = ((innerRight - innerLeft) / z) + 'px';

  dd.style.maxHeight = (300) + 'px';                            // allow natural (capped) height to measure
  const natH = dd.getBoundingClientRect().height;               // visual
  const below = Math.max(0, rr.bottom - br.bottom - gap), above = Math.max(0, br.top - rr.top - gap);
  const openBelow = (below >= natH) || (below >= above);        // down if it fits, else the roomier side
  const avail = openBelow ? below : above;
  const h = Math.min(natH, avail);
  dd.style.maxHeight = (h / z) + 'px';                          // fit within the rail; long lists scroll
  const topV = openBelow ? (br.bottom + gap) : (br.top - h - gap);
  dd.style.top = (Math.max(rr.top + gap, topV) / z) + 'px';
}

let fcActiveRender = null;   // the current page's render callback (for in-place filter reset)
/* ---- (1) Cascading Fiscal Year -> Fiscal Quarter -> Fiscal Week option lists ----
 * FY22 == calendar 2022; a quarter's 13 weeks come from fcWeeksForQuarter(). Choosing a
 * specific Fiscal Year limits Quarter + Week to that year (1.1); choosing a specific
 * Quarter limits Week to that quarter's weeks (1.2). Every list keeps its 'All' option. */
function fcYearFromFY(fy) { const m = /^FY(\d{2})$/.exec(fy || ''); return m ? 2000 + (+m[1]) : null; }
function fcYearFromQuarter(q) { const m = /^(\d{4})-Q[1-4]$/.exec(q || ''); return m ? +m[1] : null; }
function fcAllowedOptions(key) {
  const base = FILTER_OPTIONS[key] || [];
  if (key === 'quarter') {
    const y = fcYearFromFY(fcState.filters.fy);
    return y == null ? base : base.filter(o => o === 'All' || fcYearFromQuarter(o) === y);
  }
  if (key === 'week') {
    const q = fcState.filters.quarter;
    if (fcYearFromQuarter(q) != null) {
      const wk = fcWeeksForQuarter(q);
      return base.filter(o => o === 'All' || wk.indexOf(o) >= 0);
    }
    const y = fcYearFromFY(fcState.filters.fy);
    return y == null ? base : base.filter(o => o === 'All' || o.indexOf(y + '-W') === 0);
  }
  return base;
}
function fcRebuildFilterDropdown(key) {
  const item = document.querySelector('.filter-item[data-filter="' + key + '"]'); if (!item) return;
  const dd = item.querySelector('.filter-dropdown'); if (!dd) return;
  dd.innerHTML = '';
  fcAllowedOptions(key).forEach(opt => {
    const o = document.createElement('div');
    o.className = 'filter-option' + (fcState.filters[key] === opt ? ' selected' : '');
    o.textContent = fcOptLabel(key, opt);
    o.dataset.value = opt;
    o.onclick = (e) => { e.stopPropagation(); dd.classList.remove('open'); fcApplyFilterSelection(key, opt); };
    dd.appendChild(o);
  });
}
function fcApplyFilterSelection(key, opt) {
  fcSetFilter(key, opt);
  // Cascade: snap now-invalid dependents to 'All', then rebuild their option lists.
  if (key === 'fy') {
    if (fcAllowedOptions('quarter').indexOf(fcState.filters.quarter) < 0) fcState.filters.quarter = 'All';
    if (fcAllowedOptions('week').indexOf(fcState.filters.week) < 0) fcState.filters.week = 'All';
    fcSaveState(fcState);
    fcRebuildFilterDropdown('quarter'); fcRebuildFilterDropdown('week');
  } else if (key === 'quarter') {
    if (fcAllowedOptions('week').indexOf(fcState.filters.week) < 0) fcState.filters.week = 'All';
    fcSaveState(fcState);
    fcRebuildFilterDropdown('week');
  }
  fcRefreshFilterButtons();
  document.querySelectorAll('.filter-dropdown.open').forEach(x => x.classList.remove('open'));
  if (typeof fcActiveRender === 'function') fcActiveRender();
}

function fcWireFilters(onChange) {
  fcActiveRender = onChange;
  document.querySelectorAll('.filter-item[data-filter]').forEach(item => {
    const key = item.dataset.filter;
    const labOverride = (fcDataMode === 'live' ? FC_LIVE_LABEL : FC_SIM_LABEL)[key];
    if (labOverride) {
      const lab = item.querySelector('.filter-label');
      if (lab) lab.textContent = labOverride;
    }
    const btn = item.querySelector('.filter-value');
    btn.firstChild.textContent = fcOptLabel(key, fcState.filters[key]);
    let dd = item.querySelector('.filter-dropdown');
    if (!dd) { dd = document.createElement('div'); dd.className = 'filter-dropdown'; item.appendChild(dd); }
    fcRebuildFilterDropdown(key);   // (1) options respect the FY/Quarter cascade
    btn.onclick = (e) => {
      e.stopPropagation();
      document.querySelectorAll('.filter-dropdown.open').forEach(x => { if (x!==dd) x.classList.remove('open'); });
      const opening = !dd.classList.contains('open');
      dd.classList.toggle('open');
      if (opening) fcFitDropdownToRail(dd, item);
    };
  });
  document.addEventListener('click', () => document.querySelectorAll('.filter-dropdown.open').forEach(x => x.classList.remove('open')));
}

/* ---- Filter rail: Reset + primary/secondary collapse (ported from master's UI, injected) ----
 * Restructures the flat filter list into a compact 2-column primary grid plus a
 * collapsible "More filters" secondary grid, and adds a Reset link. Done by DOM
 * injection so no per-page markup changes are needed. */
// (6) Every filter is shown in the primary grid — no collapsible "More filters".
// (3.1) Order drives the 2-col layout (col1, col2, col1, …): left column = Fiscal
// Year, Fiscal Week, Global LOB; right column = Fiscal Quarter, Region, Business Unit.
const FC_PRIMARY_FILTERS = ['fy', 'quarter', 'week', 'region', 'lob', 'business', 'service', 'warranty', 'coreupsell', 'wotype', 'fqm', 'gcfa'];
const FC_SECONDARY_FILTERS = [];

function fcRefreshFilterButtons() {
  document.querySelectorAll('.filter-item[data-filter]').forEach(item => {
    const key = item.dataset.filter, btn = item.querySelector('.filter-value');
    if (btn && btn.firstChild) btn.firstChild.textContent = fcOptLabel(key, fcState.filters[key]);
    item.querySelectorAll('.filter-option').forEach(o => o.classList.toggle('selected', (o.dataset.value || o.textContent) === fcState.filters[key]));
  });
}
function fcResetFilters() {
  // (3.2) Reset every filter to 'All' (each dropdown now offers it, including
  // Fiscal Year / Quarter / Week — the weekly view resolves 'All' via fcEffectiveQuarter).
  Object.keys(fcState.filters).forEach(key => {
    const opts = FILTER_OPTIONS[key] || [];
    fcState.filters[key] = (opts.indexOf('All') >= 0) ? 'All' : opts[0];
  });
  fcSaveState(fcState);
  fcRefreshFilterButtons();
  if (typeof fcActiveRender === 'function') fcActiveRender();
}

function fcInjectFilterRailCSS() {
  if (typeof document === 'undefined' || document.getElementById('fc-filterrail-css')) return;
  const st = document.createElement('style'); st.id = 'fc-filterrail-css';
  st.textContent = `
  .filter-rail-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
  .filter-rail-head-title{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:800;color:var(--text-1)}
  .filter-rail-head-title svg{width:16px;height:16px;stroke:var(--teal);flex-shrink:0}
  /* (2.1) Reset is a boxed button sitting between the Filters title and the collapse button. */
  /* (3) Reset matches the collapse button's height (26px). */
  .filter-reset{font-size:10.5px;font-weight:700;color:var(--text-2);cursor:pointer;background:var(--card);border:1px solid var(--border);border-radius:7px;font-family:inherit;height:26px;padding:0 10px;display:inline-flex;align-items:center}
  .filter-reset:hover{border-color:var(--teal);color:var(--teal)}
  .primary-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px 8px;margin-top:16px;margin-bottom:4px}
  .primary-grid .filter-item,.secondary-grid .filter-item{margin-bottom:0;min-width:0}
  .primary-grid .filter-value,.secondary-grid .filter-value{min-width:0;overflow:hidden;white-space:nowrap}
  .primary-grid .filter-value .caret,.secondary-grid .filter-value .caret{flex-shrink:0}
  .filter-rail-divider{height:1px;background:var(--border);margin:14px 0 12px}
  .more-toggle{display:flex;align-items:center;justify-content:space-between;width:100%;background:none;border:none;font:inherit;padding:2px 0;cursor:pointer;color:var(--text-2)}
  .more-toggle-label{display:flex;align-items:center;gap:7px;font-size:11.5px;font-weight:700}
  .more-toggle-count{font-size:9.5px;font-weight:800;background:var(--card-hi);color:var(--text-3);border-radius:999px;padding:1px 6px;font-variant-numeric:tabular-nums}
  .more-toggle-chevron{width:13px;height:13px;stroke:var(--text-3);transition:transform .18s ease;flex-shrink:0}
  .more-toggle.open .more-toggle-chevron{transform:rotate(180deg)}
  .secondary-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px 8px;max-height:0;overflow:hidden;opacity:0;transition:max-height .22s ease,opacity .18s ease,margin-top .22s ease}
  .secondary-grid.open{max-height:260px;opacity:1;margin-top:12px}
  /* remove all dropdown-arrow carets (some showed, some didn't — drop them all) */
  .filter-rail .filter-value .caret{display:none}
  /* dropdown opens as a fixed overlay (never clipped by the rail) with a clear boundary */
  .filter-rail .filter-dropdown{border:1px solid var(--border-hi,#b4bde8);border-radius:9px;background:var(--card,#fff);box-shadow:0 14px 34px rgba(15,23,42,.24);overflow-y:auto}
  .filter-rail .filter-dropdown .filter-option{white-space:normal}`;
  document.head.appendChild(st);
}

function fcWireFilterRailUI() {
  if (typeof document === 'undefined') return;
  const rail = document.querySelector('.filter-rail');
  if (!rail || rail.dataset.fcRailWired) return;
  fcInjectFilterRailCSS();

  // Head: wrap title + add a Reset link.
  const head = rail.querySelector('.filter-rail-head');
  if (head && !head.querySelector('.filter-reset')) {
    if (!head.querySelector('.filter-rail-head-title')) {
      const title = document.createElement('div'); title.className = 'filter-rail-head-title';
      while (head.firstChild) title.appendChild(head.firstChild);
      head.appendChild(title);
    }
    const reset = document.createElement('button');
    reset.type = 'button'; reset.className = 'filter-reset'; reset.id = 'filter-reset-btn'; reset.textContent = 'Reset';
    reset.onclick = (e) => { e.stopPropagation(); fcResetFilters(); };
    head.appendChild(reset);
  }

  // Split the flat filter items into primary grid + collapsible secondary grid.
  const items = {};
  rail.querySelectorAll('.filter-item[data-filter]').forEach(it => { items[it.dataset.filter] = it; });
  // Append items to a 2-col grid, tagging each with its column so its dropdown can
  // span the full rail width (service spans both columns and stays full-width).
  const addCols = (grid, keys) => {
    let col = 1;
    keys.forEach(k => {
      const it = items[k]; if (!it) return;
      if (k === 'service') { it.style.gridColumn = 'span 2'; it.classList.add('fc-col-full'); col = 1; }
      else { it.classList.add(col === 1 ? 'fc-col-1' : 'fc-col-2'); col = col === 1 ? 2 : 1; }
      grid.appendChild(it);
    });
  };
  const pg = document.createElement('div'); pg.className = 'primary-grid';
  addCols(pg, FC_PRIMARY_FILTERS);
  const secKeys = FC_SECONDARY_FILTERS.filter(k => items[k]);

  // Place below the scenario bar / sub, above the (now-empty) old item positions.
  const anchor = document.getElementById('fc-scenario-bar') || rail.querySelector('.filter-rail-sub') || head;
  if (secKeys.length) {
    // (legacy) collapsible "More filters" secondary grid, only if any secondary filters remain.
    const divider = document.createElement('div'); divider.className = 'filter-rail-divider';
    const moreBtn = document.createElement('button');
    moreBtn.type = 'button'; moreBtn.className = 'more-toggle'; moreBtn.id = 'more-filters-toggle';
    moreBtn.innerHTML = '<span class="more-toggle-label">More filters <span class="more-toggle-count">' + secKeys.length +
      '</span></span><svg class="more-toggle-chevron" viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
    const sg = document.createElement('div'); sg.className = 'secondary-grid'; sg.id = 'secondary-filters';
    addCols(sg, FC_SECONDARY_FILTERS);
    moreBtn.onclick = (e) => { e.stopPropagation(); const open = sg.classList.toggle('open'); moreBtn.classList.toggle('open', open); };
    anchor.after(pg, divider, moreBtn, sg);
  } else {
    anchor.after(pg);
  }
  rail.dataset.fcRailWired = '1';
}

// (2) International/abbreviated number format: K (thousand/"grand"), M (million), B (billion),
// with en-US thousands grouping (1,234,567 — never the Indian lakh grouping).
function fcN(v) {
  v = +v; const a = Math.abs(v);
  if (a >= 1e9) return (v/1e9).toFixed(2)+'B';
  if (a >= 1e6) return (v/1e6).toFixed(2)+'M';
  if (a >= 1e3) return Math.round(v/1e3).toLocaleString('en-US')+'K';
  return Math.round(v).toLocaleString('en-US');
}
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
      labels: { style: { color: tc.axis, fontSize: '9.5px', textOverflow: 'none', whiteSpace: 'nowrap' }, rotation: opts.rotate != null ? opts.rotate : (labels.length > 6 ? -35 : 0) }
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
  const sData = series.map((s, i) => {
    const d = {
      name: s.name || 'Series ' + (i + 1),
      data: s.data.slice(), color: s.color,
      dashStyle: s.dashed ? 'ShortDash' : 'Solid'
    };
    // Trend/overlay lines: no markers, thinner, and excluded from hover/tooltip.
    if (s.noHover) { d.enableMouseTracking = false; d.marker = { enabled: false }; d.lineWidth = s.width || 1.6; }
    return d;
  });
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
  const sData = seriesArr.map((s, i) => {
    const d = { name: s.label || 'Series ' + (i + 1), data: s.values.slice(), color: s.color };
    if (s.type === 'line') {   // overlay line (e.g. a trend line over the bars)
      d.type = 'line'; d.marker = { enabled: false, radius: 3 };
      d.lineWidth = 2.4; d.dashStyle = s.dashed ? 'ShortDash' : 'Solid'; d.zIndex = 5;
      if (s.noHover) d.enableMouseTracking = false;   // keep it off the hover tooltip
    }
    return d;
  });
  const existing = fcHCharts[svgId];
  if (existing && existing.series.length === sData.length && existing.options.chart.type === 'column') {
    existing.xAxis[0].setCategories(categories, false);
    sData.forEach((s, i) => {
      if (s.color && existing.series[i].color !== s.color) existing.series[i].update({ color: s.color }, false);
      existing.series[i].setData(s.data, false, { duration: 320 });
    });
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
// Donut/pie with a hover tooltip that shows each slice's value. The 'All' slice
// is rendered light blue; other slices use the palette.
function fcDrawDonut(id, shares, opts) {
  opts = opts || {};
  const el = fcHCContainer(id, opts.h || 150); if (!el || typeof Highcharts === 'undefined') return;
  const palette = opts.colors || ['#0d9488','#d97706','#0284c7','#7c3aed','#db2777','#059669','#ea580c','#0369a1'];
  const fmt = opts.fmt || fcDefaultFmt;
  const data = shares.map((s, i) => ({ name: s.key, y: s.value, color: s.key === 'All' ? '#8ec5ff' : palette[i % palette.length] }));
  if (fcHCharts[id]) fcHCharts[id].destroy();
  fcHCharts[id] = Highcharts.chart(el, {
    // Height is intentionally NOT pinned here — it follows the container (the .donut box
    // is 150px normally, and grows to fill the expand modal), so the donut reflows on expand.
    chart: { type: 'pie', backgroundColor: 'transparent', spacing: [4,4,4,4] },
    title: { text: null }, credits: { enabled: false }, legend: { enabled: false },
    tooltip: {
      backgroundColor: '#0f172a', borderColor: '#0f172a', borderRadius: 8, padding: 10,
      style: { color: '#f1f5f9', fontSize: '11.5px' },
      formatter: function () { return '<span style="color:' + this.point.color + '">●</span> ' + this.point.name + ': <b>' + fmt(this.y) + '</b>'; }
    },
    plotOptions: { pie: { innerSize: '62%', borderWidth: 0, dataLabels: { enabled: false }, states: { hover: { brightness: 0.08 } } } },
    series: [{ data }]
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
    ? 'Live data: ASU & Warranty Expirations read from the input workbook (forecast_fy26.xlsx). SR/Dispatch are derived; New Contracts, RENEW and BTC are modeled. Click to re-check.'
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
  .fc-scn-presets .fc-scn-chips{display:grid;grid-template-columns:1fr 1fr;gap:5px}
  .fc-scn-presets button{padding:5px 6px;border:1px solid #cfd9ea;border-radius:7px;background:#fff;font:600 10.5px Inter,sans-serif;color:#37415a;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .fc-scn-presets button:last-child{grid-column:1 / -1}
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
  if (fcIsDashboard()) return;   // Dashboard keeps its filters but not the scenario switcher
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
    ['NC / RENEW override',    x => `${x.plan.ncOverride}% / ${x.plan.renewOverride}%`],
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

/* ---- UI chrome: compact rail (2), Workspace collapse (3), no scenario bar on Dashboard (6),
 *      cross-page zoom (5) ----
 * A web page can't read or set the BROWSER's own zoom, and multi-page sites opened
 * from file:// don't share it. So the app keeps its own persisted zoom, driven
 * INVISIBLY by the usual Ctrl +/- / Ctrl-scroll gesture (no on-screen control), and
 * re-applied on every page load — so a zoom set on one page shows on all of them. */
const FC_NAV_KEY = 'fc_nav_collapsed', FC_FILTER_KEY = 'fc_filters_collapsed', FC_ZOOM_KEY = 'fc_zoom';
const FC_ZOOM_MIN = 0.5, FC_ZOOM_MAX = 2, FC_ZOOM_STEP = 0.1;
function fcIsDashboard() { return typeof document !== 'undefined' && /^Dashboard\b/.test((document.title || '').trim()); }
function fcGetZoom() { const z = parseFloat(localStorage.getItem(FC_ZOOM_KEY)); return isNaN(z) ? 1 : Math.min(FC_ZOOM_MAX, Math.max(FC_ZOOM_MIN, z)); }
function fcApplyZoom(z) {
  z = Math.min(FC_ZOOM_MAX, Math.max(FC_ZOOM_MIN, Math.round(z * 100) / 100));
  try { localStorage.setItem(FC_ZOOM_KEY, String(z)); } catch (e) {}
  if (document.documentElement) {
    document.documentElement.style.zoom = z;                                    // persisted -> re-applied on every page
    document.documentElement.style.setProperty('--fc-vh-scale', String(1 / z)); // keep 100vh panels window-height under zoom
  }
  return z;
}
function fcNudgeZoom(d) { fcApplyZoom(fcGetZoom() + d); }

function fcInjectChromeCSS() {
  if (typeof document === 'undefined' || document.getElementById('fc-chrome-css')) return;
  const st = document.createElement('style'); st.id = 'fc-chrome-css';
  st.textContent = `
  /* (2.2.2) wider filter rail — area cut from the main pane (which is flex:1). */
  .filter-rail{width:296px;padding:16px 16px;border-right:none}
  .main{border-left:1px solid var(--border)}
  /* (2.2.2) bigger filter boxes: long values (e.g. "Data Protection A") wrap inside
     the box instead of overflowing. Service Type spans the full width already, so it
     is left as-is. */
  .filter-value{padding:7px 10px;font-size:12px;min-height:34px}
  .primary-grid .filter-value:not(.fc-col-full .filter-value),
  .primary-grid .fc-col-1 .filter-value,.primary-grid .fc-col-2 .filter-value{white-space:normal;overflow:visible;line-height:1.25}
  .primary-grid{align-items:start}
  .filter-rail .filter-label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .filter-rail-sub{margin:3px 0 12px}
  .fc-side-toggle,.fc-filter-toggle,.fc-filter-reopen{border:1px solid var(--border);background:var(--card);color:var(--text-2);border-radius:7px;width:26px;height:26px;line-height:1;font-size:15px;cursor:pointer;flex-shrink:0}
  .fc-side-toggle:hover,.fc-filter-toggle:hover,.fc-filter-reopen:hover{border-color:var(--teal);color:var(--teal)}
  .fc-side-toggle svg,.fc-filter-reopen svg{width:16px;height:16px;stroke:currentColor;display:block}
  /* (4 / pending 5.1) The Workspace toggle (VS Code-style icon) and the filter-reopen
     funnel share a row at the top-LEFT of the sidebar. The funnel shows only when filters
     are collapsed; clicking it reopens them. */
  .fc-toggle-row{display:flex;align-items:center;gap:6px;align-self:flex-start;margin:-2px 0 10px 2px}
  .fc-side-toggle,.fc-filter-reopen{display:inline-flex;align-items:center;justify-content:center}
  .fc-filter-reopen{display:none}
  body.fc-filters-collapsed .fc-filter-reopen{display:inline-flex}
  /* (pending 5.1) Collapsing filters hides the whole rail — the sidebar funnel reopens it. */
  body.fc-filters-collapsed .filter-rail{display:none}
  /* (1.1) Workspace collapse -> narrow icon-only rail (thumbnails stay visible). */
  body.fc-nav-collapsed .sidebar{width:62px;padding:14px 8px}
  body.fc-nav-collapsed .sidebar .brand-text,
  body.fc-nav-collapsed .sidebar .nav-label{display:none}
  body.fc-nav-collapsed .sidebar .brand{justify-content:center;padding:6px 0 16px}
  body.fc-nav-collapsed .sidebar .nav-item{justify-content:center;gap:0;font-size:0;padding:10px 0}
  body.fc-nav-collapsed .fc-toggle-row{align-self:flex-start}
  /* (5) keep 100vh panels window-height under the app zoom (vh ignores CSS zoom) */
  html,body,.sidebar,.filter-rail,.main{height:calc(100vh * var(--fc-vh-scale, 1))}
  .topbar{gap:8px}`;
  document.head.appendChild(st);
}
// (4) VS Code / Claude-style "toggle sidebar" icon for the Workspace collapse button.
var FC_SIDEBAR_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>';
// (pending 5.1) Funnel icon for the sidebar "reopen filters" button (shown when collapsed).
var FC_FUNNEL_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>';
function fcSyncCollapseGlyphs() {
  // (4) The Workspace toggle keeps its static sidebar icon — only the tooltip flips.
  const nav = document.querySelector('.fc-side-toggle');
  if (nav) nav.title = document.body.classList.contains('fc-nav-collapsed') ? 'Expand Workspace' : 'Collapse Workspace';
  const fil = document.querySelector('.fc-filter-toggle');
  if (fil) fil.innerHTML = document.body.classList.contains('fc-filters-collapsed') ? '»' : '«';
}
function fcToggleNav() {
  const on = !document.body.classList.contains('fc-nav-collapsed');
  document.body.classList.toggle('fc-nav-collapsed', on);
  try { localStorage.setItem(FC_NAV_KEY, on ? '1' : '0'); } catch (e) {}
  fcSyncCollapseGlyphs();
}
function fcToggleFilters() {
  const on = !document.body.classList.contains('fc-filters-collapsed');
  document.body.classList.toggle('fc-filters-collapsed', on);
  try { localStorage.setItem(FC_FILTER_KEY, on ? '1' : '0'); } catch (e) {}
  fcSyncCollapseGlyphs();
}

function fcInjectChrome() {
  if (typeof document === 'undefined') return;
  fcInjectChromeCSS();
  if (localStorage.getItem(FC_NAV_KEY) === '1') document.body.classList.add('fc-nav-collapsed');       // persisted
  if (localStorage.getItem(FC_FILTER_KEY) === '1') document.body.classList.add('fc-filters-collapsed'); // persisted
  fcApplyZoom(fcGetZoom());                                                                        // (5) persisted, applied on load

  // (1/pending 5.1) A top-left row in the sidebar holds the Workspace toggle plus a funnel
  // that reopens the filters (visible only while filters are collapsed).
  const sidebar = document.querySelector('.sidebar');
  if (sidebar && !sidebar.querySelector('.fc-toggle-row')) {
    const row = document.createElement('div'); row.className = 'fc-toggle-row';
    const nav = document.createElement('button'); nav.type = 'button'; nav.className = 'fc-side-toggle';
    nav.title = 'Collapse Workspace'; nav.innerHTML = FC_SIDEBAR_ICON; nav.onclick = fcToggleNav;
    const fil = document.createElement('button'); fil.type = 'button'; fil.className = 'fc-filter-reopen';
    fil.title = 'Show filters'; fil.innerHTML = FC_FUNNEL_ICON; fil.onclick = fcToggleFilters;
    row.appendChild(nav); row.appendChild(fil);
    sidebar.insertBefore(row, sidebar.firstChild);
  }
  // (2.1) Filters collapse button lives in the filter-rail header.
  const fhead = document.querySelector('.filter-rail .filter-rail-head');
  if (fhead && !fhead.querySelector('.fc-filter-toggle')) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'fc-filter-toggle';
    b.title = 'Collapse filters'; b.innerHTML = '«';
    b.onclick = fcToggleFilters; fhead.appendChild(b);
  }
  // (1.1) Once collapsed the toggle button is hidden — clicking the funnel thumbnail
  // (the filter-rail header) expands the filters again.
  if (fhead && !fhead.__fcExpandWired) {
    fhead.__fcExpandWired = true;
    fhead.title = 'Filters';
    fhead.addEventListener('click', e => {
      if (e.target.closest('.fc-filter-toggle')) return;   // the button manages its own collapse
      if (document.body.classList.contains('fc-filters-collapsed')) fcToggleFilters();
    });
  }
  fcSyncCollapseGlyphs();

  // (5) drive the persisted app zoom from the usual gesture, invisibly (no control tab)
  if (!window.__fcZoomKeys) {
    window.__fcZoomKeys = true;
    document.addEventListener('keydown', (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === '+' || e.key === '=') { e.preventDefault(); fcNudgeZoom(FC_ZOOM_STEP); }
      else if (e.key === '-' || e.key === '_') { e.preventDefault(); fcNudgeZoom(-FC_ZOOM_STEP); }
      else if (e.key === '0') { e.preventDefault(); fcApplyZoom(1); }
    });
    document.addEventListener('wheel', (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      fcNudgeZoom(e.deltaY < 0 ? FC_ZOOM_STEP : -FC_ZOOM_STEP);
    }, { passive: false });
  }
}

/* ---- Reusable per-chart expand modal (Session 38) ----
 * Pages opt in with fcInitChartExpand([panelId,...]). A 30%-opaque backdrop; the chart
 * element (or its whole .donut-wrap, so the legend travels too) is moved into a fixed-size
 * modal and back. Sizing uses setSize() — Highcharts reflow() only re-reads WIDTH, so it
 * would neither grow nor shrink height; setSize(clientW, clientH) grows in the modal and
 * snaps back to the original size on close. A single shared timer avoids stale re-sizes. */
function fcInjectExpandCSS() {
  if (typeof document === 'undefined' || document.getElementById('fc-expand-css')) return;
  const st = document.createElement('style'); st.id = 'fc-expand-css';
  st.textContent = `
  .fcx-panel{position:relative}
  .fcx-btn{position:absolute;top:10px;right:12px;z-index:4;width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--border);border-radius:7px;background:var(--card);color:var(--text-2);cursor:pointer;padding:0}
  .fcx-btn:hover{border-color:var(--teal);color:var(--teal)}
  .fcx-btn svg{width:15px;height:15px;stroke:currentColor}
  .fcx-modal{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:4vh 4vw;background:rgba(15,23,42,0.30)}
  .fcx-modal[hidden]{display:none}
  .fcx-card{position:relative;width:min(1040px,92vw);height:640px;background:var(--card);border:1px solid var(--border);border-radius:14px;box-shadow:0 24px 60px rgba(15,23,42,.35);padding:24px 26px 26px;display:flex;flex-direction:column}
  .fcx-title{font:700 15px/1 inherit;color:var(--text-1);margin:0 0 14px;padding-right:34px}
  .fcx-close{position:absolute;top:14px;right:14px;width:30px;height:30px;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--text-2);font-size:16px;line-height:1;cursor:pointer}
  .fcx-close:hover{border-color:var(--red);color:var(--red)}
  .fcx-body{flex:1;min-height:0}
  .fcx-body>*{width:100%!important;height:100%!important}
  .fcx-body .donut-wrap{flex-direction:row;align-items:center;justify-content:center;gap:42px}
  .fcx-body .donut{width:54%!important;max-width:54%;height:88%!important;flex:0 0 auto}
  .fcx-body .donut-legend{flex-direction:column;flex-wrap:nowrap;font-size:15px;gap:12px}
  .fcx-body .donut-legend .lval{font-size:13px;margin-left:18px}`;
  document.head.appendChild(st);
}
var FC_EXPAND_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>';
var fcxModal = null, fcxTimer = null;
function fcxChartId(panel) {
  const donut = panel.querySelector('.donut'); if (donut) return donut.id;
  const el = Array.prototype.find.call(panel.querySelectorAll('[id]'), n => fcHCharts[n.id]);
  return el ? el.id : null;
}
function fcxFit(id) {
  const c = fcHCharts[id]; if (!c) return;
  const el = document.getElementById(id); if (!el) return;
  const w = el.clientWidth, h = el.clientHeight;
  // Resize each axis independently (a 0 means the container is hidden/undetermined — keep
  // that dimension). This lets height grow even where width can't be measured.
  if (w > 1 || h > 1) { try { c.setSize(w > 1 ? w : undefined, h > 1 ? h : undefined, false); } catch (e) {} }
}
function fcxScheduleFit(id) {
  fcxFit(id);                                   // synchronous (reading clientW/H forces layout)
  if (fcxTimer) clearTimeout(fcxTimer);
  fcxTimer = setTimeout(() => fcxFit(id), 150); // settle any late layout in a real viewport
}
function fcxEnsureModal() {
  if (fcxModal) return fcxModal;
  fcxModal = document.createElement('div'); fcxModal.className = 'fcx-modal'; fcxModal.hidden = true;
  fcxModal.innerHTML = '<div class="fcx-card"><div class="fcx-title"></div><button type="button" class="fcx-close" title="Close">✕</button><div class="fcx-body"></div></div>';
  document.body.appendChild(fcxModal);
  fcxModal.addEventListener('click', e => { if (e.target === fcxModal) fcxCloseModal(); });
  fcxModal.querySelector('.fcx-close').onclick = fcxCloseModal;
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fcxCloseModal(); });
  return fcxModal;
}
function fcxOpen(panelId) {
  const panel = document.getElementById(panelId); if (!panel) return;
  const id = fcxChartId(panel); if (!id) return;
  const el = document.getElementById(id);
  const moving = (el.closest && el.closest('.donut-wrap')) || el;   // move donut+legend together
  const modal = fcxEnsureModal(); const body = modal.querySelector('.fcx-body');
  modal.querySelector('.fcx-title').textContent = (panel.querySelector('.panel-title') || {}).textContent || 'Detail view';
  moving.__fcxOrigin = { parent: moving.parentNode, next: moving.nextSibling, style: moving.getAttribute('style') || '', chartId: id };
  body.appendChild(moving); modal.hidden = false;
  fcxScheduleFit(id);
}
function fcxCloseModal() {
  if (!fcxModal || fcxModal.hidden) return;
  const moving = fcxModal.querySelector('.fcx-body').firstElementChild;
  fcxModal.hidden = true;                       // hide first so the panel reclaims its layout
  if (moving && moving.__fcxOrigin) {
    const o = moving.__fcxOrigin;
    if (o.style) moving.setAttribute('style', o.style); else moving.removeAttribute('style');
    if (o.next) o.parent.insertBefore(moving, o.next); else o.parent.appendChild(moving);
    moving.__fcxOrigin = null;
    fcxScheduleFit(o.chartId);                  // size the chart back to its restored container
  }
}
function fcInitChartExpand(panelIds) {
  if (typeof document === 'undefined') return;
  fcInjectExpandCSS(); fcxEnsureModal();
  (panelIds || []).forEach(pid => {
    const panel = document.getElementById(pid); if (!panel || panel.querySelector('.fcx-btn')) return;
    panel.classList.add('fcx-panel');
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'fcx-btn'; b.title = 'Expand chart'; b.innerHTML = FC_EXPAND_ICON;
    b.onclick = () => fcxOpen(pid);
    panel.appendChild(b);
  });
}

/* ==== END SHARED ENGINE ==== */
fcInitData();        // decide live vs simulated before any page render (synchronous)
fcSyncThemeBtn();
// (5) Scenario switcher bar removed from all pages — the scenario STATE still
// backs the compute pipeline; only the on-rail UI (fcInjectScenarioUI) is dropped.
function fcBoot() { fcInjectBadge(); fcWireFilterRailUI(); fcInjectChrome(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fcBoot);
else fcBoot();