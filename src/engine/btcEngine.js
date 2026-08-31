// btcEngine.js — framework-agnostic port of btc_adjustment_simulator_v2.html compute core.
// DOM, Highcharts and rendering stripped. Math kept byte-faithful to the original.
// Original DOM slider inputs (ncI/apI + per-segment sliders) are now engine STATE.
// The React store (useBtc.js) wraps this for reactivity; components read compute*() results.
//
// Fidelity notes carried from source:
//  - modifier 100 = neutral (60..150). FLAT uniform % across the whole forecast window (no ramp).
//  - Adj ASU is a running BALANCE (o.aa re-anchors via ovShift). NC/APOS/SR/Disp are flows.
//  - 'All' segment total = Σ(sub-segments); an All edit is redistributed down (spreadAllEdit / largest-remainder).
//  - AOP target auto = mean over the forecast FY. Gap = BTC Adjusted − AOP Target.

// ============================ STATE ============================
export const state = {
  BTC: {},
  TL: null,
  SPLIT_FW: '25-W25',
  // filter selections
  F: { fy: [], quarter: [], week: [], region: [], lob: [], business: [], warranty: [], service: [], coreupsell: [], wotype: [], fqm: [], gcfa: [] },
  // overrides / targets / notes
  OVR: { disp: {}, sr: {}, asu: {} },
  TGT_OVR: { disp: null, sr: null },
  AOP_OVR: { disp: null, sr: null, asu: null },
  CMT: { disp: {}, sr: {}, asu: {}, pub: {} },
  // declines (display-only, forecast-only, imported)
  DECL_IMPORTED: false,
  DECL_VALS: {},
  DECL_FILE: null,
  // ASU driver modifiers (were DOM #ncI / #apI)
  ncMod: 100,
  apMod: 100,
  // ASU field/tech split tab ('all' | 'field' | 'tech') — selects pre-split arrays from the dataset
  ASU_SEG: 'all',
  // per-metric segment config (element ids from original dropped)
  DISP: { kind: 'disp', _seg: 0, _segMods: null, _adj: null, _vis: null, unit: 'Dispatches', tgtLbl: 'SMOD', rateLbl: 'MDR ×100', dsName: 'DISP Actuals', adjName: 'Adj Disp' },
  SR: { kind: 'sr', _seg: 0, _segMods: null, _adj: null, _vis: null, unit: 'SRs', tgtLbl: 'ICR', rateLbl: 'ICR ×100', dsName: 'SR Actuals', adjName: 'Adj SRs' },
  // step + tab + cycle
  STEP: 1,
  activeTab: 'asu',
  PASS_COUNT: 1,
  CYCLE_OVR: null,
  dark: false,
  // filter option lists (built at boot)
  opts: { fy: ['All'], quarter: ['All'], week: ['All'], lob: [] },
};
function C(kind) { return kind === 'disp' ? state.DISP : state.SR; }

// ============================ HELPERS ============================
export function ramp(i, N) { return N > 1 ? Math.pow(i / (N - 1), 8) : 0; }
export function fmt(n) { return Number(Math.round(n)).toLocaleString('en-US'); }
export function shortFW(l) { return ('' + l).slice(2); }
export function setOf(a) { const o = {}; a.forEach((x) => { o[x] = 1; }); return o; }
export function pc(a, b) { return (a && isFinite(a)) ? (b - a) / a * 100 : null; }

// FILTER config (option lists filled at boot for fy/quarter/week/lob)
export const FILTERS = [
  { k: 'fy', label: 'Fiscal Year', multi: true, opts: ['All'] },
  { k: 'quarter', label: 'Fiscal Quarter', multi: true, opts: ['All'] },
  { k: 'week', label: 'Fiscal Week', multi: true, opts: ['All'] },
  { k: 'region', label: 'Region', multi: true, opts: ['All', 'AMERICAS', 'EMEA', 'APJ'] },
  { k: 'lob', label: 'Global LOB', multi: true, opts: [] },
  { k: 'business', label: 'Business Unit', multi: true, opts: ['All', 'Unit A', 'Unit B'] },
  { k: 'warranty', label: 'Warranty Type', multi: true, opts: ['All', 'Basic', 'Premium', 'Premium Flex', 'Premium Plus'] },
  { k: 'service', label: 'Service Type', multi: true, opts: ['All', 'Parts Only (Unit A)', 'Parts Only (Unit B)', 'Parts + Labour (Unit A)', 'Parts + Labour (Unit B)', 'Labour Only (Unit A)', 'Labour Only (Unit B)'] },
  { k: 'coreupsell', label: 'Core / Upsell', multi: true, opts: ['All', 'Core', 'Upsell'] },
  { k: 'wotype', label: 'WO Type', multi: true, opts: ['All', 'Break Fix', 'Part/s dispatch'] },
  { k: 'fqm', label: 'FQM Flag', multi: true, opts: ['All', '1', '0'] },
  { k: 'gcfa', label: 'GCFA Type', multi: true, opts: ['All', 'GCFA', 'non-GCFA', 'Unknown'] },
];
export function cfgOf(k) { for (let i = 0; i < FILTERS.length; i++) if (FILTERS[i].k === k) return FILTERS[i]; }
export function labOf(k, o) { return ((k === 'week' || k === 'quarter') && o !== 'All') ? ('' + o).slice(2) : o; }

// ============================ FILTER ENGINE ============================
export function visIdx() {
  const TL = state.TL, F = state.F; if (!TL) return [];
  const fyS = F.fy.length ? setOf(F.fy) : null, qS = F.quarter.length ? setOf(F.quarter) : null, wS = F.week.length ? setOf(F.week) : null;
  const out = [];
  for (let i = 0; i < TL.fw.length; i++) {
    if (fyS && !fyS[TL.fy[i]]) continue;
    if (qS && !qS[TL.fq[i]]) continue;
    if (wS && !wS[TL.fw[i]]) continue;
    out.push(i);
  }
  return out;
}
export function chgPeriods() {
  const TL = state.TL, F = state.F, vis = visIdx();
  function wd(dim, val) { return vis.filter((i) => TL[dim][i] === val); }
  if (F.week.length >= 2) return { a: wd('fw', F.week[0]), b: wd('fw', F.week[F.week.length - 1]) };
  if (F.quarter.length >= 2) return { a: wd('fq', F.quarter[0]), b: wd('fq', F.quarter[F.quarter.length - 1]) };
  if (F.fy.length >= 2) return { a: wd('fy', F.fy[0]), b: wd('fy', F.fy[F.fy.length - 1]) };
  return null;
}
export function deriveDim(outDim) {
  const TL = state.TL, F = state.F;
  const qS = F.quarter.length ? setOf(F.quarter) : null, wS = F.week.length ? setOf(F.week) : null, seen = {}, d = [];
  for (let i = 0; i < TL.fw.length; i++) { if ((qS && qS[TL.fq[i]]) || (wS && wS[TL.fw[i]])) { const v = TL[outDim][i]; if (!seen[v]) { seen[v] = 1; d.push(v); } } }
  return d;
}
// Filter-rail display + option-set derivation (ported from renderRail helpers).
export const MORE_KEYS = { coreupsell: 1, wotype: 1, fqm: 1, gcfa: 1 };
export function filterDisplay(cfg) {
  const k = cfg.k, a = state.F[k], TL = state.TL;
  if (!a.length && TL) {
    let d = null;
    if (k === 'fy' && (state.F.quarter.length || state.F.week.length)) d = deriveDim('fy');
    else if (k === 'quarter' && state.F.week.length) d = deriveDim('fq');
    if (d && d.length) return d.length === 1 ? labOf(k, d[0]) : labOf(k, d[0]) + '–' + labOf(k, d[d.length - 1]) + ' (' + d.length + ')';
  }
  if (!a.length) return 'All';
  if (a.length === 1) return labOf(k, a[0]);
  return labOf(k, a[0]) + '–' + labOf(k, a[a.length - 1]) + ' (' + a.length + ')';
}
export function optionsFor(cfg) {
  const TL = state.TL, F = state.F; if (!TL) return cfg.opts;
  const isPublishTab = state.activeTab === 'pub';
  if (isPublishTab) {
    if (cfg.k === 'fy') { const fcFY = TL.fy[TL.fcStart]; return ['All'].concat(cfg.opts.filter((o) => o !== 'All' && o === fcFY)); }
    if (cfg.k === 'quarter') { const fcSet = setOf(TL.fq.slice(TL.fcStart)); return ['All'].concat(cfg.opts.filter((o) => o !== 'All' && fcSet[o])); }
    if (cfg.k === 'week') { const fwSet = {}; for (let i = TL.fcStart; i < TL.fw.length; i++) fwSet[TL.fw[i]] = 1; return ['All'].concat(cfg.opts.filter((o) => o !== 'All' && fwSet[o])); }
  }
  if (cfg.k === 'quarter' && F.fy.length) { const fyS = setOf(F.fy), aq = {}; for (let i = 0; i < TL.fw.length; i++) { if (fyS[TL.fy[i]]) aq[TL.fq[i]] = 1; } return ['All'].concat(cfg.opts.filter((o) => o !== 'All' && aq[o])); }
  if (cfg.k === 'week' && (F.fy.length || F.quarter.length)) {
    const fyW = F.fy.length ? setOf(F.fy) : null, qW = F.quarter.length ? setOf(F.quarter) : null, aw = {};
    for (let j = 0; j < TL.fw.length; j++) { if (fyW && !fyW[TL.fy[j]]) continue; if (qW && !qW[TL.fq[j]]) continue; aw[TL.fw[j]] = 1; }
    return ['All'].concat(cfg.opts.filter((o) => o !== 'All' && aw[o]));
  }
  return cfg.opts;
}
export function hiddenFilters() {
  const tab = state.activeTab, h = {};
  if (tab === 'disp' && (state.DISP._seg || 0) > 0) h.service = 1;
  else if (tab === 'sr' && (state.SR._seg || 0) > 0) h.business = 1;
  return h;
}
export function ctxText() {
  const TL = state.TL, F = state.F; if (!TL) return '—';
  function rng(a, st) { if (!a.length) return null; const lo = st ? ('' + a[0]).slice(2) : a[0], hi = st ? ('' + a[a.length - 1]).slice(2) : a[a.length - 1]; return a.length === 1 ? lo : lo + '–' + hi; }
  const fy = rng(F.fy), q = rng(F.quarter, true), w = rng(F.week, true); let tp;
  if (!fy && !q && !w) tp = 'FY22–FY27';
  else { const p = []; if (fy) p.push(fy); if (q) p.push('Q ' + q); if (w) p.push('W ' + w); tp = p.join(' · '); }
  let bu = filterDisplay(cfgOf('business')); if (bu === 'All') bu = 'All BUs';
  const tab = state.activeTab; let segLbl = null;
  if (tab === 'sr' || tab === 'disp') { const c = (tab === 'disp') ? state.DISP : state.SR, i = c._seg || 0, L = segList(tab); if (i > 0) segLbl = (L[i] || {}).l || null; }
  return TL.lob + ' · ' + (segLbl || bu) + ' · ' + tp;
}
// theme + cycle-label override
export function setDark(d) { state.dark = !!d; }
export function setCycleOvr(text) { const t = ('' + text).trim(); state.CYCLE_OVR = (t && t !== autoCycleLabel()) ? t : null; }

// ============================ ALLOCATION-WEIGHT ENGINE ============================
export const SEG_BU = { A: 0.58, B: 0.42 };
const SYNTH_ALLOC = {
  business: { 'Unit A': SEG_BU.A, 'Unit B': SEG_BU.B },
  warranty: { Basic: 0.34, Premium: 0.31, 'Premium Flex': 0.19, 'Premium Plus': 0.16 },
  wotype: { 'Break Fix': 0.63, 'Part/s dispatch': 0.37 },
  fqm: { 1: 0.72, 0: 0.28 },
  gcfa: { GCFA: 0.55, 'non-GCFA': 0.38, Unknown: 0.07 },
};
export const ALLOC_DIMS = ['region', 'business', 'warranty', 'service', 'coreupsell', 'wotype', 'fqm', 'gcfa'];
function weightsFor(k) {
  const a = (state.TL && state.TL.alloc) || {}, out = {};
  if (k === 'region' || k === 'coreupsell') {
    const src = a[k] || {}; Object.keys(src).forEach((v) => { out[v.toUpperCase()] = src[v]; });
    return Object.keys(out).length ? out : null;
  }
  if (k === 'service') {
    const s = a.service || {};
    Object.keys(s).forEach((v) => { out[(v + ' (Unit A)').toUpperCase()] = s[v] * SEG_BU.A; out[(v + ' (Unit B)').toUpperCase()] = s[v] * SEG_BU.B; });
    return Object.keys(out).length ? out : null;
  }
  const syn = SYNTH_ALLOC[k]; if (!syn) return null;
  Object.keys(syn).forEach((v) => { out[v.toUpperCase()] = syn[v]; });
  return out;
}
function dimShare(k) {
  const sel = state.F[k]; if (!sel || !sel.length) return 1;
  const w = weightsFor(k); if (!w) return 1;
  let tot = 0, s = 0;
  Object.keys(w).forEach((v) => { tot += w[v]; });
  sel.forEach((v) => { const x = w[('' + v).toUpperCase()]; if (x != null) s += x; });
  return tot > 0 ? (s / tot) : 1;
}
export function allocMult() { let m = 1; ALLOC_DIMS.forEach((k) => { m *= dimShare(k); }); return m; }
let _scc = { sig: null, map: {} };
export function SC(key, arr) {
  const m = allocMult(); if (m === 1 || !arr) return arr;
  const sig = m + '|' + (state.TL ? state.TL.lob : '');
  if (_scc.sig !== sig) _scc = { sig, map: {} };
  if (!_scc.map[key]) _scc.map[key] = arr.map((v) => Math.round(v * m));
  return _scc.map[key];
}
function declAt(fw) { const v = state.DECL_VALS[fw]; if (v == null) return null; const m = allocMult(); return m === 1 ? v : Math.round(v * m); }

// ============================ SEGMENT ENGINE ============================
export function segList(kind) {
  if (kind === 'sr') return [{ l: 'All', w: 1 }]; // Unit A/B tabs commented out in source
  const s = (state.TL && state.TL.alloc && state.TL.alloc.service) || {};
  let P = s['Parts Only'], PL = s['Parts + Labour'], LO = s['Labour Only'];
  if (P == null && PL == null && LO == null) { P = PL = LO = 1 / 3; } else { P = P || 0; PL = PL || 0; LO = LO || 0; }
  const tot = (P + PL + LO) || 1;
  return [{ l: 'All', w: 1 }, { l: 'Parts', w: P / tot }, { l: 'Parts+Labour', w: PL / tot }, { l: 'Labour Only', w: LO / tot }];
}
function segCur(c) { const L = segList(c.kind); let i = c._seg || 0; if (!(i >= 0 && i < L.length)) { i = 0; c._seg = 0; } return i; }
function segModsOf(c) { const L = segList(c.kind); segCur(c); if (!c._segMods || c._segMods.length !== L.length) c._segMods = L.map(() => 100); return c._segMods; }
function subIdxs(c) { const L = segList(c.kind), a = []; for (let i = 1; i < L.length; i++) a.push(i); return a; }
function hasSubs(c) { return subIdxs(c).length > 0; }
export function segWeight(c) { const L = segList(c.kind), i = segCur(c); return L[i] ? L[i].w : 1; }
function seriesOf(kind) { return SC(kind, kind === 'disp' ? state.TL.disp : state.TL.sr); }
function bendSeg(c, segIdx) {
  const nd = seriesOf(c.kind), fc = state.TL.fcStart, L = segList(c.kind), w = L[segIdx] ? L[segIdx].w : 1;
  const mult = segModsOf(c)[segIdx] / 100, ov = (state.OVR[c.kind] && state.OVR[c.kind][segIdx]) || {};
  return nd.map((v, i) => {
    const vb = v * w;
    if (i < fc) return Math.round(vb);
    const a = Math.round(vb * mult);
    const o = ov[state.TL.fw[i]]; return (o != null ? o : a);
  });
}
function sumSubs(c) { if (!hasSubs(c)) return bendSeg(c, 0); const subs = subIdxs(c); let out = null; subs.forEach((si) => { const s = bendSeg(c, si); if (!out) out = s.slice(); else out = out.map((x, i) => x + s[i]); }); return out || seriesOf(c.kind).slice(); }
export function allocLR(total, shares) {
  let s = 0; const out = [], fr = []; let acc = 0;
  for (let i = 0; i < shares.length; i++) s += shares[i];
  if (!(s > 0)) s = shares.length || 1;
  for (let i = 0; i < shares.length; i++) { const x = total * (shares[i] / s), f = Math.floor(x); out.push(f); fr.push({ i, r: x - f }); acc += f; }
  const rem = Math.round(total - acc);
  fr.sort((a, b) => (b.r - a.r) || (a.i - b.i));
  for (let i = 0; i < rem && i < fr.length; i++) out[fr[i].i]++;
  return out;
}
function spreadAllEdit(c, fw, total) {
  const subs = subIdxs(c), L = segList(c.kind), idx = state.TL.fw.indexOf(fw);
  if (idx < 0) return;
  if (!subs.length) { state.OVR[c.kind][0] = state.OVR[c.kind][0] || {}; state.OVR[c.kind][0][fw] = total; return; }
  const cur = subs.map((si) => bendSeg(c, si)[idx]);
  let sum = 0; cur.forEach((v) => { sum += v; });
  const shares = (sum > 0) ? cur : subs.map((si) => (L[si] ? L[si].w : 1));
  const alloc = allocLR(total, shares);
  subs.forEach((si, k) => { state.OVR[c.kind][si] = state.OVR[c.kind][si] || {}; state.OVR[c.kind][si][fw] = alloc[k]; });
}
function segBase(c, segIdx) { const nd = seriesOf(c.kind), L = segList(c.kind), w = L[segIdx] ? L[segIdx].w : 1; return nd.map((v) => Math.round(v * w)); }
function sumSubsBase(c) { if (!hasSubs(c)) return segBase(c, 0); let out = null; subIdxs(c).forEach((si) => { const s = segBase(c, si); out = out ? out.map((x, i) => x + s[i]) : s.slice(); }); return out || seriesOf(c.kind).slice(); }
function segAdjActiveAt(c, idx) {
  const mods = segModsOf(c), ov = (state.OVR[c.kind] && state.OVR[c.kind][idx]) || {};
  if (idx > 0) return mods[idx] !== 100 || Object.keys(ov).length > 0;
  if (!hasSubs(c)) return mods[0] !== 100 || Object.keys(ov).length > 0;
  for (let i = 1; i < mods.length; i++) if (segAdjActiveAt(c, i)) return true;
  return false;
}
export function segAdjActive(c) { return segAdjActiveAt(c, 0); }
function compositeMod(c) {
  if (!hasSubs(c)) return segModsOf(c)[0];
  const mods = segModsOf(c), L = segList(c.kind); let s = 0, w = 0;
  subIdxs(c).forEach((si) => { s += mods[si] * L[si].w; w += L[si].w; });
  return w ? Math.round((s / w) * 4) / 4 : 100;
}

// ============================ OVERRIDE / COMMENT PREDICATES ============================
export function hasAnyRateOvr(kind, fw) { const s = state.OVR[kind] || {}; for (const k in s) { if (s[k] && s[k][fw] != null) return true; } return false; }
export function hasRateOvr(kind, segIdx, fw) { if (+segIdx === 0) return hasAnyRateOvr(kind, fw); const m = state.OVR[kind] && state.OVR[kind][segIdx]; return !!(m && m[fw] != null); }
export function hasAsuOvr(fw) { const o = state.OVR.asu[fw]; return !!(o && (o.an != null || o.ba != null || o.aa != null)); }
export function hasPubOvr(fw) { return hasAsuOvr(fw) || hasAnyRateOvr('sr', fw) || hasAnyRateOvr('disp', fw); }
export function getCmtRate(kind, segIdx, fw) { const m = state.CMT[kind] && state.CMT[kind][segIdx]; return (m && m[fw]) || ''; }
export function getCmtAsu(fw) { return state.CMT.asu[fw] || ''; }
export function getCmtPub(fw) { return state.CMT.pub[fw] || ''; }
export function setCmtRate(kind, segIdx, fw, v) { v = ('' + v).trim(); state.CMT[kind][segIdx] = state.CMT[kind][segIdx] || {}; if (v) state.CMT[kind][segIdx][fw] = v; else delete state.CMT[kind][segIdx][fw]; }
export function setCmtAsu(fw, v) { v = ('' + v).trim(); if (v) state.CMT.asu[fw] = v; else delete state.CMT.asu[fw]; }
export function setCmtPub(fw, v) { v = ('' + v).trim(); if (v) state.CMT.pub[fw] = v; else delete state.CMT.pub[fw]; }
export function pruneCmt() {
  ['disp', 'sr'].forEach((k) => {
    Object.keys(state.CMT[k]).forEach((si) => { const m = state.CMT[k][si] || {}; Object.keys(m).forEach((fw) => { if (!hasRateOvr(k, si, fw)) delete m[fw]; }); });
  });
  Object.keys(state.CMT.asu).forEach((fw) => { if (!hasAsuOvr(fw)) delete state.CMT.asu[fw]; });
  Object.keys(state.CMT.pub).forEach((fw) => { if (!hasPubOvr(fw)) delete state.CMT.pub[fw]; });
}

// ============================ AOP TARGET ============================
export function autoAop(kind) {
  const TL = state.TL; if (!TL) return 0;
  const fcFY = TL.fy[TL.fcStart], idx = [];
  for (let i = TL.fcStart; i < TL.fw.length; i++) if (TL.fy[i] === fcFY) idx.push(i);
  if (!idx.length) return 0;
  if (kind === 'asu') {
    const NC = SC('nc', TL.nc), AP = SC('apos', TL.apos); let sf = 0;
    idx.forEach((i) => { sf += NC[i] + AP[i]; });
    return Math.round(sf / idx.length);
  }
  const c = C(kind), sw = segWeight(c), A = SC('asu', TL.asu);
  const mo = state.TGT_OVR[kind], rate = (mo != null) ? (mo / 100) : ((kind === 'disp' ? TL.dispTarget : TL.srTarget) * 100);
  let sa = 0; idx.forEach((i) => { sa += A[i] * sw; });
  return Math.round(rate / 100 * (sa / idx.length));
}
export function aopVal(kind) {
  if (state.AOP_OVR[kind] == null) return autoAop(kind);
  if (kind === 'asu') return state.AOP_OVR.asu;
  const c = C(kind); return Math.round(state.AOP_OVR[kind] * segWeight(c));
}
export function aopBounds(kind, cur) {
  const a = autoAop(kind) || 0;
  let lo = Math.max(0, Math.round(a * 0.5)), hi = Math.round(a * 1.5);
  if (!(hi > lo)) { lo = 0; hi = Math.max(100, Math.round((cur || 0) * 1.5) || 100); }
  if (cur != null) { lo = Math.min(lo, cur); hi = Math.max(hi, cur); }
  return { lo, hi, st: 1 };
}
// AOP slider upper cap = 1.5 × the peak weekly value of the page's own metric over the forecast FY.
// asu → weekly NC+APOS inflow (same axis as the ASU AOP line); sr/disp → weekly DS forecast (× segment weight).
export function aopSliderMax(kind) {
  const TL = state.TL; if (!TL) return 100;
  const fcFY = TL.fy[TL.fcStart]; const w = [];
  for (let i = TL.fcStart; i < TL.fw.length; i++) if (TL.fy[i] === fcFY) w.push(i);
  let mx = 0;
  if (kind === 'asu') { const NC = SC('nc', TL.nc), AP = SC('apos', TL.apos); w.forEach((i) => { mx = Math.max(mx, NC[i] + AP[i]); }); }
  else { const c = C(kind), sw = segWeight(c), DS = seriesOf(kind); w.forEach((i) => { mx = Math.max(mx, DS[i] * sw); }); }
  return Math.max(1, Math.round(mx * 1.5));
}

// ============================ ASU CHAIN (pure) ============================
export function computeAsuRows(ncSrc, apSrc, ncKey, apKey) {
  const TL = state.TL; if (!TL) return [];
  const ncM = (+state.ncMod) / 100, apM = (+state.apMod) / 100;
  const fc = TL.fcStart, N = TL.fw.length, rows = [];
  let ncCum = 0, renCum = 0, declCum = 0, ovShift = 0; const ov = state.OVR.asu;
  const A = SC('asu', TL.asu), NC = SC(ncKey || 'nc', ncSrc || TL.nc), AP = SC(apKey || 'apos', apSrc || TL.apos);
  for (let i = 0; i < N; i++) {
    const base = A[i]; let an, ba, adjV, ncV, renV, aaJump = 0;
    const decl = state.DECL_IMPORTED ? (declAt(TL.fw[i]) != null ? declAt(TL.fw[i]) : (i >= fc ? 0 : null)) : null;
    if (i < fc) { an = NC[i]; ba = AP[i]; adjV = base; ncV = base; renV = base; }
    else {
      const o = ov[TL.fw[i]] || {};
      an = (o.an != null) ? o.an : Math.round(NC[i] * ncM);
      ba = (o.ba != null) ? o.ba : Math.round(AP[i] * apM);
      ncCum += (an - NC[i]); renCum += (ba - AP[i]); declCum += (decl || 0);
      ncV = base + ncCum; renV = base + renCum;
      adjV = base + ncCum + renCum - declCum + ovShift;
      if (o.aa != null) { aaJump = o.aa - adjV; ovShift += aaJump; adjV = o.aa; }
    }
    rows.push({ fw: TL.fw[i], base, decl, nc: NC[i], apos: AP[i], adjNew: an, btcApos: ba, adj: adjV, ncLine: ncV, renLine: renV, aaJump });
  }
  return rows;
}

// ============================ AXIS HELPERS (pure, for chart component) ============================
export function axisLabels(idx) {
  const TL = state.TL, out = idx.map(() => '');
  if (!idx.length || !TL) return out;
  const qs = [], lastPos = {};
  idx.forEach((ti, pos) => { const q = TL.fq[ti]; if (qs.indexOf(q) < 0) qs.push(q); lastPos[q] = pos; });
  if (qs.length > 8) {
    out[0] = ('' + TL.fq[idx[0]]).slice(2);
    out[idx.length - 1] = ('' + TL.fq[idx[idx.length - 1]]).slice(2);
  } else {
    out[0] = shortFW(TL.fw[idx[0]]);
    qs.forEach((q) => { out[lastPos[q]] = shortFW(TL.fw[idx[lastPos[q]]]); });
  }
  return out;
}
export function niceScale(mn, mx, maxTicks) {
  maxTicks = Math.max(3, maxTicks || 5);
  if (!isFinite(mn) || !isFinite(mx)) return null;
  if (mn === mx) { mn = mn - Math.abs(mn || 1) * 0.1; mx = mx + Math.abs(mx || 1) * 0.1; }
  const span = mx - mn, mags = [1, 2, 5, 10], e0 = Math.floor(Math.log(span / (maxTicks - 1)) / Math.LN10);
  for (let e = e0; e <= e0 + 4; e++) {
    for (let i = 0; i < mags.length; i++) {
      const step = mags[i] * Math.pow(10, e); if (!(step > 0)) continue;
      let lo = Math.floor(mn / step + 1e-9) * step, hi = Math.ceil(mx / step - 1e-9) * step;
      if (hi <= mx + step * 1e-9) hi += step;
      if (lo < 0 && mn >= 0) lo = 0;
      const n = Math.round((hi - lo) / step) + 1;
      if (n >= 3 && n <= maxTicks) return { min: lo, max: hi, step, count: n };
    }
  }
  return null;
}

// ============================ VIEW COMPUTE (DOM-free; returns data for components) ============================
// Rate sheet (Dispatches / SR). Mirrors renderRate() math exactly; assigns C._adj / C._vis as a side effect.
export function computeRate(kind) {
  const c = C(kind), TL = state.TL, fc = TL.fcStart;
  const adjAsu = computeAsuRows().map((r) => r.adj);
  const segIdx = segCur(c), segs = segModsOf(c), sw = segWeight(c);
  const shown = (segIdx === 0) ? compositeMod(c) : segs[segIdx];
  if (segIdx === 0) segs[0] = shown;
  const adjFull = sumSubs(c);
  let nds, adjs, adjAsus;
  if (segIdx > 0) { nds = segBase(c, segIdx); adjs = bendSeg(c, segIdx); adjAsus = adjAsu.map((x) => Math.round(x * sw)); }
  else { nds = sumSubsBase(c); adjs = adjFull; adjAsus = adjAsu.slice(); }
  const mo = state.TGT_OVR[c.kind];
  const vis = visIdx();
  if (!vis.length) { c._adj = adjFull; c._vis = []; return { empty: true, segIdx, shown, adjFull }; }
  const _asuF = SC('asu', TL.asu);
  let tAdj = 0, tBase = 0, sBaseAsu = 0, sAdjAsu = 0;
  vis.forEach((i) => { tAdj += adjs[i]; tBase += nds[i]; sBaseAsu += _asuF[i] * sw; sAdjAsu += adjAsus[i]; });
  const tgtWeekly = aopVal(c.kind);
  const tgtN = Math.round(tgtWeekly * vis.length);
  const target = sAdjAsu ? (tgtN / sAdjAsu * 100) : 0;
  const cp = chgPeriods();
  function ap2(idxs) { let a = 0, b = 0; idxs.forEach((i) => { a += adjs[i]; b += nds[i]; }); return { adj: a, base: b }; }
  const A = (cp && cp.a.length) ? ap2(cp.a) : null, B = (cp && cp.b.length) ? ap2(cp.b) : null;
  function CB(f) { return (A && B) ? pc(A[f], B[f]) : null; }
  const actualsOnly = vis.every((i) => i < fc);
  const adjActive = segAdjActiveAt(c, segIdx);
  const showAdj = !actualsOnly && adjActive;
  const frate = sBaseAsu ? tBase / sBaseAsu * 100 : 0, arate = sAdjAsu ? tAdj / sAdjAsu * 100 : 0;
  const gapN = Math.round(tAdj) - tgtN;
  const gc = Math.abs(arate - target) < 0.003 ? 'var(--gn)' : (arate > target ? 'var(--am)' : 'var(--rd)');
  const anyEd = showAdj && vis.some((i) => i >= fc && hasRateOvr(c.kind, segIdx, TL.fw[i]));
  const rows = vis.map((i) => {
    const isA = i < fc, fwK = TL.fw[i];
    const dN = adjs[i] - nds[i];
    const edited = !isA && hasRateOvr(c.kind, segIdx, fwK);
    return { i, fw: fwK, isA, base: nds[i], adj: adjs[i], delta: dN, edited, cmt: edited ? getCmtRate(c.kind, segIdx, fwK) : '' };
  });
  const lbl = vis.map((i) => shortFW(TL.fw[i])), xlab = axisLabels(vis);
  const chart = {
    labels: lbl, xlab,
    series: [
      { color: '#16a34a', fcColor: '#16a34a', name: c.dsName, data: vis.map((i) => nds[i]) },
      { color: '#ea580c', name: c.adjName, seg: 'forecast', data: showAdj ? vis.map((i) => adjs[i]) : [] },
      { color: '#b45309', dash: true, name: 'AOP Target', data: lbl.map(() => tgtWeekly) },
    ],
  };
  c._adj = adjFull; c._vis = vis;
  return {
    empty: false, kind, segIdx, shown, segList: segList(c.kind), segMods: segs.slice(),
    vis, actualsOnly, adjActive, showAdj, anyEd, mo,
    kpi: { tBase, tAdj, tgtN, frate, arate, gapN, gc, cbBase: CB('base'), cbAdj: CB('adj') },
    target, tgtWeekly, rows, chart, adjFull,
  };
}

// ASU view. Mirrors renderAsu() math; assigns ASU_ROWS via return.
export const ASU_SEG_LBL = { all: 'All', field: 'Field', tech: 'Tech' };

export function computeAsuView() {
  const TL = state.TL, fc = TL.fcStart, vis = visIdx();
  // field/tech split: read the pre-split arrays from the dataset (no ratio math here).
  const segK = ASU_SEG_LBL[state.ASU_SEG] ? state.ASU_SEG : 'all';
  const rows = (segK === 'field') ? computeAsuRows(TL.nc_field, TL.apos_field, 'nc_field', 'apos_field')
    : (segK === 'tech') ? computeAsuRows(TL.nc_tech, TL.apos_tech, 'nc_tech', 'apos_tech')
    : computeAsuRows();
  if (!vis.length) return { empty: true, rows, seg: segK, segLabel: ASU_SEG_LBL[segK] };
  const last = rows[vis[vis.length - 1]];
  let tAN = 0, tBA = 0, tNC = 0, tAP = 0, tDecl = 0;
  vis.forEach((i) => { tAN += rows[i].adjNew; tBA += rows[i].btcApos; tNC += rows[i].nc; tAP += rows[i].apos; if (rows[i].decl != null) tDecl += rows[i].decl; });
  const cp = chgPeriods();
  function ap2(idxs) { let an = 0, ba = 0, nc = 0, ap = 0, dc = 0; idxs.forEach((i) => { an += rows[i].adjNew; ba += rows[i].btcApos; nc += rows[i].nc; ap += rows[i].apos; dc += (rows[i].decl || 0); }); const li = idxs[idxs.length - 1]; return { base: rows[li].base, adj: rows[li].adj, adjNew: an, btcApos: ba, nc, apos: ap, decl: dc }; }
  const A = (cp && cp.a.length) ? ap2(cp.a) : null, B = (cp && cp.b.length) ? ap2(cp.b) : null;
  function CB(f) { return (A && B) ? pc(A[f], B[f]) : null; }
  const actualsOnly = vis.every((i) => i < fc);
  const ncM = +state.ncMod, apM = +state.apMod; let ovAn = false, ovBa = false, ovAa = false;
  Object.keys(state.OVR.asu).forEach((fw) => { const o = state.OVR.asu[fw] || {}; if (o.an != null) ovAn = true; if (o.ba != null) ovBa = true; if (o.aa != null) ovAa = true; });
  const ncAdj = !actualsOnly && (ncM !== 100 || ovAn), apAdj = !actualsOnly && (apM !== 100 || ovBa);
  const asuAdj = !actualsOnly && (ncAdj || apAdj || state.DECL_IMPORTED || ovAa), anyAdj = asuAdj;
  const anyEdA = anyAdj && vis.some((i) => i >= fc && hasAsuOvr(rows[i].fw));
  const aopW = aopVal('asu');
  const lbl = vis.map((i) => shortFW(TL.fw[i])), xlab = axisLabels(vis);
  const aser = [
    { color: '#4ade80', fcColor: '#4ade80', name: 'ASU Actuals', data: vis.map((i) => rows[i].nc + rows[i].apos) },
    { color: '#3a6ef0', fcColor: '#3a6ef0', name: 'NC Actuals', data: vis.map((i) => rows[i].nc) },
    { color: '#6d28d9', fcColor: '#6d28d9', name: 'APOS Actuals', data: vis.map((i) => rows[i].apos) },
    { color: '#ea580c', name: 'Adj ASU', seg: 'forecast', data: asuAdj ? vis.map((i) => rows[i].adjNew + rows[i].btcApos - (rows[i].decl || 0) + (rows[i].aaJump || 0)) : [] },
    { color: '#0891b2', name: 'Adj NC', seg: 'forecast', data: ncAdj ? vis.map((i) => rows[i].adjNew) : [] },
    { color: '#ac4073', name: 'Adj APOS', seg: 'forecast', data: apAdj ? vis.map((i) => rows[i].btcApos) : [] },
    { color: '#b45309', dash: true, name: 'AOP Target', data: vis.map(() => aopW) },
  ];
  if (state.DECL_IMPORTED) aser.push({ color: '#8b0000', fcColor: '#8b0000', name: 'Declines', data: vis.map((i) => rows[i].decl) });
  const lift = last.adj - last.base;
  return {
    empty: false, vis, rows, actualsOnly, ncAdj, apAdj, asuAdj, anyAdj, anyEdA, declImported: state.DECL_IMPORTED,
    totals: { base: last.base, nc: tNC, apos: tAP, decl: tDecl, adjNew: tAN, btcApos: tBA, adj: last.adj },
    cb: { base: CB('base'), nc: CB('nc'), apos: CB('apos'), decl: CB('decl'), adj: CB('adj'), adjNew: CB('adjNew'), btcApos: CB('btcApos') },
    aopW, lift, chart: { labels: lbl, xlab, series: aser },
    seg: segK, segLabel: ASU_SEG_LBL[segK],
  };
}

// Publish view. Mirrors renderPub() math; forecast-weeks only. Ensures SR._adj / DISP._adj are fresh.
export function computePubView() {
  const TL = state.TL; if (!TL) return { empty: true };
  const fc = TL.fcStart, vis = visIdx().filter((i) => i >= fc);
  const fyLbl = TL.fy[TL.fcStart];
  // refresh SR._adj / DISP._adj (renderPub reads them)
  computeRate('sr'); computeRate('disp');
  if (!vis.length) return { empty: true, fyLbl, declImported: state.DECL_IMPORTED };
  const rows = computeAsuRows();
  const pNC = SC('nc', TL.nc), pAP = SC('apos', TL.apos), pSR = SC('sr', TL.sr), pDisp = SC('disp', TL.disp);
  const showAdj = (+state.ncMod !== 100) || (+state.apMod !== 100) || Object.keys(state.OVR.asu).length > 0 || segAdjActive(state.DISP) || segAdjActive(state.SR);
  let fNC = 0, aNC = 0, fAP = 0, aAP = 0, fDisp = 0, aDisp = 0, fSR = 0, aSR = 0, fDecl = 0;
  vis.forEach((i) => {
    fNC += pNC[i]; aNC += rows[i].adjNew;
    fAP += pAP[i]; aAP += rows[i].btcApos;
    fDisp += pDisp[i]; aDisp += state.DISP._adj ? state.DISP._adj[i] : 0;
    fSR += pSR[i]; aSR += state.SR._adj ? state.SR._adj[i] : 0;
    if (rows[i].decl != null) fDecl += rows[i].decl;
  });
  const _lastR = rows[vis[vis.length - 1]], fASU = _lastR.base, aASU = _lastR.adj;
  const anyEdP = showAdj && vis.some((i) => hasPubOvr(TL.fw[i]));
  const _expPub = false; // expand overlay is P4
  const lbl = vis.map((i) => shortFW(TL.fw[i])), xlab = _expPub ? null : axisLabels(vis);
  const ADJ = '#ea580c';
  const specs = [
    { key: 'Nc', title: 'New Contracts - Forecast vs Adjusted', series: [{ color: '#3a6ef0', fcColor: '#3a6ef0', name: 'NC Forecast', data: vis.map((i) => pNC[i]) }, { color: ADJ, fcColor: ADJ, name: 'Adj NC', data: showAdj ? vis.map((i) => rows[i].adjNew) : [] }] },
    { key: 'Apos', title: 'APOS Renewals - Forecast vs Adjusted', series: [{ color: '#6d28d9', fcColor: '#6d28d9', name: 'APOS Forecast', data: vis.map((i) => pAP[i]) }, { color: ADJ, fcColor: ADJ, name: 'Adj APOS', data: showAdj ? vis.map((i) => rows[i].btcApos) : [] }] },
    { key: 'Asu', title: 'ASU - Forecast vs Adjusted', series: [{ color: '#16a34a', fcColor: '#16a34a', name: 'ASU Forecast', data: vis.map((i) => rows[i].base) }, { color: ADJ, fcColor: ADJ, name: 'Adj ASU', data: showAdj ? vis.map((i) => rows[i].adj) : [] }] },
  ];
  if (state.DECL_IMPORTED) specs[0].series.push({ color: '#8b0000', fcColor: '#8b0000', name: 'Declines', data: vis.map((i) => rows[i].decl) });
  specs.push({ key: 'Sr', title: 'SRs - Forecast vs Adjusted', series: [{ color: '#38bdf8', fcColor: '#38bdf8', name: 'SR Forecast', data: vis.map((i) => pSR[i]) }, { color: ADJ, fcColor: ADJ, name: 'Adj SR', data: showAdj ? vis.map((i) => (state.SR._adj ? state.SR._adj[i] : 0)) : [] }] });
  specs.push({ key: 'Disp', title: 'Dispatches - Forecast vs Adjusted', series: [{ color: '#6b4423', fcColor: '#6b4423', name: 'Disp Forecast', data: vis.map((i) => pDisp[i]) }, { color: ADJ, fcColor: ADJ, name: 'Adj Disp', data: showAdj ? vis.map((i) => (state.DISP._adj ? state.DISP._adj[i] : 0)) : [] }] });
  const tableRows = vis.map((i) => ({
    i, fw: TL.fw[i], edited: hasPubOvr(TL.fw[i]),
    adjNew: rows[i].adjNew, btcApos: rows[i].btcApos, adj: rows[i].adj, decl: rows[i].decl,
    sr: state.SR._adj ? state.SR._adj[i] : '', disp: state.DISP._adj ? state.DISP._adj[i] : '',
    cmt: hasPubOvr(TL.fw[i]) ? getCmtPub(TL.fw[i]) : '',
  }));
  return {
    empty: false, fyLbl, vis, showAdj, declImported: state.DECL_IMPORTED, anyEdP,
    kpi: { fNC, aNC, fAP, aAP, fASU, aASU, fSR, aSR, fDisp, aDisp, fDecl },
    specs, chart: { labels: lbl, xlab }, tableRows,
  };
}

// ============================ DATA BUILD ============================
function aggLob(keys) {
  const all = Object.keys(state.BTC); keys = (keys && keys.length) ? keys : all; if (!keys.length) return null;
  const f = state.BTC[keys[0]], N = f.fw.length;
  const z = () => { const a = []; for (let i = 0; i < N; i++) a.push(0); return a; };
  const g = { lob: (keys.length >= all.length ? 'All LOBs' : keys.length + ' LOBs'), category: 'All', fcStart: f.fcStart, fw: f.fw.slice(), fy: f.fy.slice(), fq: f.fq.slice(), series: f.series.slice(), asu: z(), disp: z(), sr: z(), nc: z(), apos: z(), nc_field: z(), nc_tech: z(), apos_field: z(), apos_tech: z(), dispTarget: 0, srTarget: 0, dispTargetN: 0, srTargetN: 0 };
  keys.forEach((k) => { const d = state.BTC[k]; for (let i = 0; i < N; i++) { g.asu[i] += d.asu[i]; g.disp[i] += d.disp[i]; g.sr[i] += d.sr[i]; g.nc[i] += d.nc[i]; g.apos[i] += d.apos[i]; g.nc_field[i] += (d.nc_field ? d.nc_field[i] : 0); g.nc_tech[i] += (d.nc_tech ? d.nc_tech[i] : 0); g.apos_field[i] += (d.apos_field ? d.apos_field[i] : 0); g.apos_tech[i] += (d.apos_tech ? d.apos_tech[i] : 0); } });
  let sd = 0, ss = 0, sa = 0; for (let i = g.fcStart; i < N; i++) { sd += g.disp[i]; ss += g.sr[i]; sa += g.asu[i]; }
  g.dispTarget = sa ? (sd / sa) * 0.92 : 0; g.srTarget = sa ? (ss / sa) * 0.92 : 0; g.dispTargetN = Math.round(sd * 0.92); g.srTargetN = Math.round(ss * 0.92);
  const am = {}; let tot = 0; const DIMS = ['region', 'coreupsell', 'service'];
  keys.forEach((k) => { const d = state.BTC[k]; if (!d.alloc) return; let w = 0; for (let i = d.fcStart; i < N; i++) w += d.asu[i]; tot += w; DIMS.forEach((dk) => { am[dk] = am[dk] || {}; const src = d.alloc[dk] || {}; Object.keys(src).forEach((v) => { am[dk][v] = (am[dk][v] || 0) + src[v] * w; }); }); });
  if (tot) DIMS.forEach((dk) => { if (am[dk]) { let s = 0; Object.keys(am[dk]).forEach((v) => { s += am[dk][v]; }); if (s) Object.keys(am[dk]).forEach((v) => { am[dk][v] = Math.round(am[dk][v] / s * 1e4) / 1e4; }); } });
  g.alloc = am;
  return g;
}
function currentLobs() { const all = Object.keys(state.BTC), sel = state.F.lob.filter((l) => state.BTC[l]); return sel.length ? sel : all; }
export function loadLob() {
  const sel = currentLobs(); if (!sel.length) return;
  state.TL = (sel.length === 1) ? state.BTC[sel[0]] : aggLob(sel); if (!state.TL) return;
  state.SPLIT_FW = shortFW(state.TL.fw[state.TL.fcStart - 1]);
  state.OVR = { disp: {}, sr: {}, asu: {} };
  state.CMT = { disp: {}, sr: {}, asu: {}, pub: {} };
}
export function boot(payload) {
  state.DECL_FILE = (typeof window !== 'undefined' && window.BTC_DECLINES) ? window.BTC_DECLINES : null;
  state.BTC = payload.data || {};
  const lobs = payload.lobs || Object.keys(state.BTC);
  const o = payload.opts || {};
  cfgOf('fy').opts = ['All'].concat(o.fy || []);
  cfgOf('quarter').opts = ['All'].concat(o.quarter || []);
  cfgOf('week').opts = ['All'].concat(o.week || []);
  cfgOf('lob').opts = ['All'].concat(lobs);
  state.opts = { fy: cfgOf('fy').opts, quarter: cfgOf('quarter').opts, week: cfgOf('week').opts, lob: cfgOf('lob').opts };
  state.F.lob = [];
  state.F.fy = ['FY26', 'FY27'];
  loadLob();
}

// ============================ CSV EXPORT ============================
function csvCell(v) { v = (v == null ? '' : '' + v); return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
function csvJoin(rows) { return rows.map((r) => r.map((c2) => csvCell(c2)).join(',')).join('\n'); }
function rateNote(kind, fw) {
  const L = segList(kind), parts = [], all = getCmtRate(kind, 0, fw);
  if (all) parts.push(all);
  for (let i = 1; i < L.length; i++) { const s = getCmtRate(kind, i, fw); if (s) parts.push(L[i].l + ': ' + s); }
  return parts.join(' | ');
}
export function csvRows() {
  const TL = state.TL, vis = visIdx(), xSR = SC('sr', TL.sr), xDisp = SC('disp', TL.disp);
  const ASU_ROWS = computeAsuRows();
  // ensure SR._adj / DISP._adj are current
  computeRate('sr'); computeRate('disp');
  const rows = [['FW', 'ASU_Base', 'ASU_Adj', 'ASU_Comment', 'SR_DS', 'SR_Adj', 'SR_Comment', 'Disp_DS', 'Disp_Adj', 'Disp_Comment', 'Comment']];
  vis.forEach((i) => {
    const ar = ASU_ROWS[i] || {}, fw = TL.fw[i];
    rows.push([fw, ar.base, ar.adj, getCmtAsu(fw), xSR[i], (state.SR._adj ? state.SR._adj[i] : ''), rateNote('sr', fw), xDisp[i], (state.DISP._adj ? state.DISP._adj[i] : ''), rateNote('disp', fw), getCmtPub(fw)]);
  });
  return rows;
}
export function exportCsv() { return csvJoin(csvRows()); }

// ============================ CYCLE LABEL ============================
export function autoCycleLabel() { return 'Adjustment Cycle ' + (state.TL ? state.TL.fy[state.TL.fcStart] : '') + ', Pass ' + state.PASS_COUNT; }
export function cycleLabelVal() { return state.CYCLE_OVR || autoCycleLabel(); }
export function cycleBaseName() { const s = cycleLabelVal().trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); return 'btc-' + (s || 'published'); }

// ============================ MUTATION ACTIONS (DOM-free) ============================
export function clampM(v) { v = parseFloat(v); if (isNaN(v)) v = 100; return Math.max(60, Math.min(150, v)); }
export function setAsuSeg(seg) { state.ASU_SEG = ASU_SEG_LBL[seg] ? seg : 'all'; }
export function setNcMod(v) { state.ncMod = clampM(v); }
export function setApMod(v) { state.apMod = clampM(v); }
export function setSegMod(kind, v) { const c = C(kind); v = clampM(v); const mods = segModsOf(c), idx = segCur(c); mods[idx] = v; if (idx === 0) { for (let i = 1; i < mods.length; i++) mods[i] = v; } }
export function selectSeg(kind, i) {
  const c = C(kind); c._seg = i; i = segCur(c); const mods = segModsOf(c);
  if (i === 0) { const subs = subIdxs(c); if (subs.length && subs.every((s) => mods[s] === mods[subs[0]])) mods[0] = mods[subs[0]]; }
}
export function editRate(kind, segIdx, fw, val) {
  const n = parseFloat(('' + val).replace(/,/g, '')); const c = C(kind); segIdx = +segIdx;
  if (segIdx === 0) {
    if (isFinite(n)) spreadAllEdit(c, fw, Math.round(n));
    else { if (state.OVR[kind][0]) delete state.OVR[kind][0][fw]; subIdxs(c).forEach((si) => { if (state.OVR[kind][si]) delete state.OVR[kind][si][fw]; }); }
  } else {
    state.OVR[kind][segIdx] = state.OVR[kind][segIdx] || {};
    if (isFinite(n)) state.OVR[kind][segIdx][fw] = Math.round(n); else delete state.OVR[kind][segIdx][fw];
  }
  pruneCmt();
}
export function editAsu(fw, which, val) {
  const n = parseFloat(('' + val).replace(/,/g, '')); state.OVR.asu[fw] = state.OVR.asu[fw] || {};
  if (isFinite(n)) state.OVR.asu[fw][which] = Math.round(n); else delete state.OVR.asu[fw][which];
  if (!Object.keys(state.OVR.asu[fw]).length) delete state.OVR.asu[fw];
  pruneCmt();
}
export function setTarget(kind, val) {
  const n = parseFloat(('' + val).replace(/[^0-9.-]/g, ''));
  state.TGT_OVR[kind] = isFinite(n) ? n : null;
  if (state.TGT_OVR[kind] != null) state.AOP_OVR[kind] = null;
}
export function aopSync(kind, val) {
  const n = Math.round(parseFloat(val));
  if (!isFinite(n)) { state.AOP_OVR[kind] = null; return; }
  if (kind === 'asu') state.AOP_OVR.asu = n;
  else { const cw = C(kind), w = segWeight(cw) || 1; state.AOP_OVR[kind] = Math.round(n / w); state.TGT_OVR[kind] = null; }
}
export function segReset(kind) {
  const c = C(kind), idx = segCur(c), mods = segModsOf(c);
  if (idx > 0) { mods[idx] = 100; delete state.OVR[c.kind][idx]; delete state.CMT[c.kind][idx]; }
  else { for (let i = 0; i < mods.length; i++) mods[i] = 100; state.OVR[c.kind] = {}; state.CMT[c.kind] = {}; }
  pruneCmt();
  state.TGT_OVR[c.kind] = null; state.AOP_OVR[c.kind] = null;
}
export function asuReset() {
  state.OVR.asu = {}; state.CMT.asu = {}; pruneCmt();
  state.DECL_VALS = {}; state.DECL_IMPORTED = false; state.AOP_OVR.asu = null;
  state.ncMod = 100; state.apMod = 100;
}
export function tblReset(kind) {
  if (kind === 'pub') { state.OVR.disp = {}; state.OVR.sr = {}; state.OVR.asu = {}; state.CMT.disp = {}; state.CMT.sr = {}; state.CMT.asu = {}; state.CMT.pub = {}; pruneCmt(); return; }
  if (kind === 'asu') { state.OVR.asu = {}; state.CMT.asu = {}; pruneCmt(); return; }
  const c = C(kind), idx = segCur(c);
  if (idx > 0) { delete state.OVR[c.kind][idx]; delete state.CMT[c.kind][idx]; }
  else { state.OVR[c.kind] = {}; state.CMT[c.kind] = {}; }
  pruneCmt();
}
// filters
function pruneWeeks() { const TL = state.TL, F = state.F; if (!TL || !F.quarter.length) return; const q = setOf(F.quarter), allow = {}; for (let i = 0; i < TL.fw.length; i++) { if (q[TL.fq[i]]) allow[TL.fw[i]] = 1; } F.week = F.week.filter((w) => allow[w]); }
function pruneByFY() { const TL = state.TL, F = state.F; if (!TL || !F.fy.length) return; const fyS = setOf(F.fy), aq = {}, aw = {}; for (let i = 0; i < TL.fw.length; i++) { if (fyS[TL.fy[i]]) { aq[TL.fq[i]] = 1; aw[TL.fw[i]] = 1; } } F.quarter = F.quarter.filter((q) => aq[q]); F.week = F.week.filter((w) => aw[w]); }
export function toggleMulti(k, v) {
  const cfg = cfgOf(k), real = cfg.opts.filter((o) => o !== 'All'), F = state.F;
  if (v === 'All') { F[k] = []; }
  else { const set = {}; F[k].forEach((x) => { set[x] = 1; }); if (set[v]) delete set[v]; else set[v] = 1; F[k] = real.filter((x) => set[x]); }
  if (k === 'fy') pruneByFY();
  if (k === 'quarter') pruneWeeks();
  if (k === 'lob') { loadLob(); return; }
  if (ALLOC_DIMS.indexOf(k) >= 0) { state.OVR = { disp: {}, sr: {}, asu: {} }; state.CMT = { disp: {}, sr: {}, asu: {}, pub: {} }; state.AOP_OVR = { disp: null, sr: null, asu: null }; }
}
export function resetFilters() { FILTERS.forEach((cfg) => { state.F[cfg.k] = []; }); state.F.fy = ['FY26', 'FY27']; loadLob(); }
export function pruneToForecast() {
  const TL = state.TL, F = state.F; if (!TL) return;
  const fcFY = TL.fy[TL.fcStart], fcQ = {}, fcW = {};
  for (let i = TL.fcStart; i < TL.fw.length; i++) { fcQ[TL.fq[i]] = 1; fcW[TL.fw[i]] = 1; }
  if (F.fy.length) F.fy = F.fy.filter((x) => x === fcFY);
  F.quarter = F.quarter.filter((q) => fcQ[q]);
  F.week = F.week.filter((w) => fcW[w]);
}
// declines import — accepts raw CSV/TXT text (component reads the File)
export function importDeclinesText(txt) {
  const TL = state.TL, fc = TL.fcStart; let n = 0; const vals = {};
  const map = {}; for (let i = 0; i < TL.fw.length; i++) { map[TL.fw[i]] = i; map[shortFW(TL.fw[i])] = i; }
  const seq = []; for (let i = fc; i < TL.fw.length; i++) seq.push(i); let sp = 0;
  ('' + txt).split(/\r?\n/).forEach((ln) => {
    ln = ('' + ln).trim(); if (!ln) return;
    const parts = ln.split(/[,\t;]/);
    const raw = (parts[parts.length - 1] || '').replace(/[^0-9.-]/g, '');
    const num = parseFloat(raw); if (!isFinite(num)) return;
    const key = (parts[0] || '').trim(); let idx = null;
    if (map[key] != null) idx = map[key];
    else if (key.length > 2 && map[key.slice(2)] != null) idx = map[key.slice(2)];
    if (idx == null) { if (sp < seq.length) idx = seq[sp++]; else return; }
    vals[TL.fw[idx]] = Math.round(num); n++;
  });
  if (n > 0) { state.DECL_VALS = vals; state.DECL_IMPORTED = true; }
  return n;
}
export function removeDeclines() { state.DECL_VALS = {}; state.DECL_IMPORTED = false; }
export function setStep(n) { state.STEP = Math.max(1, Math.min(3, n)); }
export function setTab(v) { state.activeTab = v; }
