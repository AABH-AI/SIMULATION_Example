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
  approvals: { scenario: false, btc: false, submitted: false }
};
function fcLoadState() {
  try {
    const raw = localStorage.getItem(FC_STATE_KEY);
    if (!raw) return JSON.parse(JSON.stringify(FC_DEFAULT_STATE));
    const parsed = JSON.parse(raw);
    return { ...JSON.parse(JSON.stringify(FC_DEFAULT_STATE)), ...parsed,
      filters: { ...FC_DEFAULT_STATE.filters, ...(parsed.filters||{}) },
      approvals: { ...FC_DEFAULT_STATE.approvals, ...(parsed.approvals||{}) } };
  } catch(e) { return JSON.parse(JSON.stringify(FC_DEFAULT_STATE)); }
}
function fcSaveState(state) { localStorage.setItem(FC_STATE_KEY, JSON.stringify(state)); }
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

/* ==== END SHARED ENGINE ==== */
fcInitData();        // decide live vs simulated before any page render (synchronous)
fcSyncThemeBtn();
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fcInjectBadge);
else fcInjectBadge();