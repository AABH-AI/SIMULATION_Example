// useBtc.js — thin Zustand reactivity layer over btcEngine's mutable state.
// The engine holds the real state + math (faithful port). The store exposes a `version`
// counter that every mutation bumps, so React components re-read compute*() after a change.
// Components select `version` (to subscribe) + call engine compute fns for derived data.
import { create } from 'zustand';
import * as E from '../engine/btcEngine.js';
import btcData from '../data/btc_data.json';

let booted = false;
let outDir = null; // File System Access API directory handle (Chromium, secure context) — picked once, reused

export const useBtc = create((set) => {
  // bump() forces a re-render by advancing version; wrap() runs an engine mutation then bumps.
  const bump = () => set((s) => ({ version: s.version + 1 }));
  const wrap = (fn) => (...args) => { fn(...args); bump(); };

  return {
    version: 0,
    ready: false,

    boot() {
      if (booted) return;
      try { E.boot(btcData); booted = true; set((s) => ({ ready: true, version: s.version + 1 })); }
      catch (e) { console.error('btc boot failed', e); set({ ready: false }); }
    },

    // ---- mutations (each bumps version) ----
    setNcMod: wrap(E.setNcMod),
    setApMod: wrap(E.setApMod),
    setSegMod: wrap(E.setSegMod),
    selectSeg: wrap(E.selectSeg),
    editRate: wrap(E.editRate),
    editAsu: wrap(E.editAsu),
    setTarget: wrap(E.setTarget),
    aopSync: wrap(E.aopSync),
    segReset: wrap(E.segReset),
    asuReset: wrap(E.asuReset),
    tblReset: wrap(E.tblReset),
    toggleMulti: wrap(E.toggleMulti),
    resetFilters: wrap(E.resetFilters),
    importDeclinesText: wrap(E.importDeclinesText),
    removeDeclines: wrap(E.removeDeclines),
    setCycleOvr: wrap(E.setCycleOvr),
    setCmtRate: wrap(E.setCmtRate),
    setCmtAsu: wrap(E.setCmtAsu),
    setCmtPub: wrap(E.setCmtPub),
    toggleTheme: () => {
      const d = !E.state.dark; E.setDark(d);
      if (typeof document !== 'undefined') document.body.setAttribute('data-theme', d ? 'dark' : 'light');
      try { localStorage.setItem('btc_sim_theme', d ? 'dark' : 'light'); } catch { /* ignore */ }
      bump();
    },
    applySavedTheme: () => {
      let t; try { t = localStorage.getItem('btc_sim_theme'); } catch { /* ignore */ }
      const d = t === 'dark'; E.setDark(d);
      if (typeof document !== 'undefined') document.body.setAttribute('data-theme', d ? 'dark' : 'light');
      bump();
    },

    // tab router — mirrors original go(v): entering Publish restricts to forecast window; leaving it restores FY26+FY27
    goTab: (v) => {
      const prev = E.state.activeTab;
      E.setTab(v);
      if (v === 'pub') E.pruneToForecast();
      else if (prev === 'pub') { E.state.F.fy = ['FY26', 'FY27']; E.state.F.quarter = []; E.state.F.week = []; }
      bump();
    },
    // step model — mirrors original setStep(n): step 2 resets segment views to 'All'; each step lands on its tab
    stepTo: (n) => {
      n = Math.max(1, Math.min(3, n));
      E.setStep(n);
      if (n === 2) { E.state.SR._seg = 0; E.state.DISP._seg = 0; }
      const prev = E.state.activeTab;
      const tab = n === 1 ? 'asu' : (n === 2 ? (prev === 'disp' ? 'disp' : 'sr') : 'pub');
      E.setTab(tab);
      if (tab === 'pub') E.pruneToForecast();
      else if (prev === 'pub') { E.state.F.fy = ['FY26', 'FY27']; E.state.F.quarter = []; E.state.F.week = []; }
      bump();
    },

    // Export the published CSV. FS Access path (Chromium/secure ctx) writes into a picked outputs/ folder and
    // derives Pass# = (#csv in folder)+1; otherwise plain Blob download + in-session pass bump. Mirrors exportPublished().
    exportPublished: async (custom) => {
      const csv = E.exportCsv();
      const clean = (custom || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const name = (clean || E.cycleBaseName()) + '.csv';
      if (typeof window !== 'undefined' && window.showDirectoryPicker) {
        try {
          if (!outDir) outDir = await window.showDirectoryPicker({ id: 'btc-outputs', mode: 'readwrite' });
          const fh = await outDir.getFileHandle(name, { create: true }), w = await fh.createWritable();
          await w.write(csv); await w.close();
          let c = 0; for await (const e of outDir.values()) { if (e.kind === 'file' && /\.csv$/i.test(e.name)) c++; }
          E.state.PASS_COUNT = c + 1; bump();
          if (typeof alert !== 'undefined') alert('Saved ' + name + ' — now on Pass ' + E.state.PASS_COUNT + '.');
          return;
        } catch (e) { if (e && e.name === 'AbortError') return; } // else fall through to download
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      a.download = name; a.click();
      E.state.PASS_COUNT += 1; bump();
    },

    // ---- read-through selectors (call after subscribing to `version`) ----
    cycleBaseName: E.cycleBaseName,
    aopSliderMax: E.aopSliderMax,
    computeRate: E.computeRate,
    computeAsuView: E.computeAsuView,
    computePubView: E.computePubView,
    exportCsv: E.exportCsv,
    cycleLabelVal: E.cycleLabelVal,
    // filter-rail selectors
    FILTERS: E.FILTERS,
    MORE_KEYS: E.MORE_KEYS,
    filterDisplay: E.filterDisplay,
    optionsFor: E.optionsFor,
    hiddenFilters: E.hiddenFilters,
    labOf: E.labOf,
    ctxText: E.ctxText,
    state: E.state,
  };
});
