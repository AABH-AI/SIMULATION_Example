# TASKS — board (mutable)

Maintained by Claude. Map to plan phases P0–P5. Mark: [x] done, [~] doing, [ ] todo.

## P0 — Scaffold
- [x] Verify toolchain (node/npm/git/registry)
- [x] `npm create vite@latest` React app
- [x] Add deps: highcharts, highcharts-react-official, zustand
- [x] Smoke-test `npm run build`
- [x] Restructure into `btc_react_simulator/` (app/ + imp_docs/)
- [ ] (optional) pin `highcharts@11.4.8` if a v13 quirk appears
- [ ] (optional) `git init`

## P1 — Store + data  ✅ DONE
- [x] Copy `template_ui/input/btc_data.json` → `app/src/data/btc_data.json` (Vite native JSON import; cleaner than `.js` global)
- [x] declines_dummy.js — ABSENT in source (HTML guards null); decline import is via CSV file-picker only
- [x] Engine `app/src/engine/btcEngine.js` — faithful DOM-free port: state + filter/alloc engine +
      segment math (bendSeg/sumSubs/spreadAllEdit/allocLR) + computeAsuRows + AOP + view compute
      (computeRate/computeAsuView) + actions + CSV export + cycle label
- [x] Zustand store `app/src/store/useBtc.js` — version-bump reactivity over engine; boot() imports JSON
- [x] Smoke test `app/scripts/smoke.mjs` — 17/17 PASS vs real dataset (boot, neutral-hide, NC lift,
      disp gap tie-out, All-edit redistribute, aa re-anchor, CSV schema, cycle label)
- [x] Vite build green with engine+store+JSON bundled (386KB, +173KB dataset)
- Deferred to later phases (DOM/browser-bound): export FS Access API path, syncPassFromDir, theme effect — engine has DOM-free cores; browser wiring lands in P4.

## P2 — ASU vertical slice (proof)  ✅ DONE
- [x] `src/engine/chartOptions.js` — pure svgChart→Highcharts (zones recolor, split, niceScale, tooltip positioner)
- [x] `src/components/BtcChart.jsx` — highcharts-react-official wrapper, immutable={false} (R3, in-place update)
- [x] `src/components/Kpi.jsx`, `src/components/AsuView.jsx` (chart + controls + table + editable ec cells)
- [x] `src/btc.css` — CSS subset ported VERBATIM; fonts in index.html; neutralized Vite index.css
- [x] Wired `App.jsx` (boot on mount) + `.claude/launch.json` (dev server)
- [x] Browser-verified: 3 actuals KPIs at neutral; NC=120 → adjusted reveals, Delta +614,556 (== smoke lift),
      legend shows Adj ASU+Adj NC only, 7 chart series stable (no remount/flicker); aa edit round-trips
      (9,000,000), edt row tint; Reset → back to neutral. Prod build green (336ms).
- **Gotcha fixed:** highcharts-react-official is UMD → component nested on default export under Vite;
  use `import HcReactPkg from ...; const HighchartsReact = HcReactPkg.HighchartsReact || HcReactPkg.default`.
- Deferred to P4: legend click-isolate/hover, comment popover, AOP slider bounds polish.

## P3 — Remaining views  ✅ DONE
- [x] Engine `computePubView()` added (mirrors renderPub; refreshes SR._adj/DISP._adj)
- [x] Store: `computeRate`/`computePubView` selectors + `goTab`/`stepTo` router actions (mirror go()/setStep())
- [x] `src/components/RateView.jsx` — shared SR + Disp (kind prop): segment tabs, 6-card KPIs, editable Adj table,
      modifier/AOP/target-rate controls, gap bar
- [x] `src/components/PubView.jsx` — Publish: KPI row (5 fc + 5 adj), 5-chart grid, editable summary table, CSV export
- [x] `App.jsx` shell: header + stepper (Prev/Next) + tab router; tab visibility gated by step (1→asu,2→sr|disp,3→pub)
- [x] btc.css: tabs/stepper/segbar/pubcharts/header styles ported
- [x] Browser-verified: step gating; SR (1 seg tab, neutral 3 KPIs); Disp (4 seg tabs, mod 125 → 6 KPIs,
      Gap +93,680 ties out); Publish (5 charts, 10 KPIs, 52 rows, export ok). Zero console errors. Prod build green.
- Sequence-gate lock: N/A — source removed it (every step always reachable).

## P4 — Chrome + extras (core done; polish → P4b)
- [x] Engine: filterDisplay/optionsFor/hiddenFilters/ctxText/setDark/setCycleOvr + MORE_KEYS
- [x] Store: toggleTheme/applySavedTheme/setCycleOvr + filter-rail selectors
- [x] `src/components/FilterRail.jsx` — 12 filters, multi-select dropdowns, More-filters collapse,
      per-tab hidden filters, outside-click close, reset. Wired to toggleMulti/resetFilters.
- [x] Theme toggle (dark + localStorage persist + restore on boot); dark propagated to all charts
- [x] Contenteditable cycle label (R6) → setCycleOvr → drives export filename
- [x] ctx header badge (LOB · BU/segment · period)
- [x] btc.css: frail/fitem/fdd/fopt/morehdr + header ctx/themebtn styles ported
- [x] Browser-verified: FY27-only filter → ctx "FY27", rows 104→52; theme→dark (localStorage 'dark', btn ☀);
      rail collapse → reopen funnel; cycle edit "My Custom Cycle" persists. Zero console errors. Build green.
## P4b — interactive polish  ✅ DONE
- [x] Legend click-isolate + hover moved INTO `BtcChart.jsx` (owns legend, binds to its own chart ref;
      empty-data series keep slot but hide legend span so isolation indices stay valid). Removed `.lg` from views.
- [x] Comment popover: `src/components/CommentCell.jsx` (portal, read/edit modes, Enter save / Esc cancel /
      Delete, cmtPos flip+clamp, outside-click/scroll/resize close). Store setCmtRate/setCmtAsu/setCmtPub.
      Wired Comment column into RateView/AsuView/PubView tables (shown only when a visible row is edited).
- [x] FS Access export + pass counter: store `exportPublished()` (showDirectoryPicker → write + Pass#=folder csv+1;
      Blob download + in-session bump fallback). PubView export → store action. Cycle label auto-refreshes Pass#.
- [x] btc.css: cmp/cmpop/cm/cmfoot/cmdel + dark variants ported.
- [x] Browser-verified: legend isolate (NC opacity 1, others 0.3, series hidden); comment popover round-trip
      ("Bumped NC for Q1 push" saved + preview); cold-tab mount = ZERO console errors. Build green (293ms).
## P4c — expand overlay + allocation modal  ✅ DONE
- [x] `src/components/ExpandableCard.jsx` — expand button → fixed overlay + dim backdrop; collapse via button/
      Escape/backdrop; dispatches window resize so Highcharts reflows. Wrapped AsuView + RateView chart cards.
- [x] `src/components/AllocationModal.jsx` — Publish SR/Disp total allocated down region/coreupsell/service
      (TL.alloc). Wired ⊞ SR/Disp allocation buttons + modal state into PubView.
- [x] btc.css: expandbtn/#expandBackdrop/.expanded + modal/modalcard/allocgrp styles.
- [x] Browser-verified (fresh tab, 0 errors): expand → .expanded + backdrop + body.expanding, chart grows to
      280px, Escape collapses; allocation modal "Published SRs allocation" 3 dims, Americas 50.8% → 193,544,
      closes on ×. Build green (378ms). 9 components total.

## P5 — Verify  ✅ DONE (2026-08-28)
- [x] Side-by-side vs original (both served: React :5173, original :8899 via `python -m http.server`).
      Driven identically via javascript_tool; compared DOM-rendered values + full CSV byte-hash.
- [x] ASU neutral == original (6,355,461 / 4,613,383 / 545,596); NC=120 → Adj ASU 6,970,017, Adj NC 5,227,939 (both).
- [x] Disp mod 125 → BTC Adjusted 486,384, Gap +93,680, Adj Rate 8.06% (both).
- [x] SR neutral → DS 774,821 / AOP 700,440 / MDR 12.84% (both).
- [x] Filter FY27-only → ctx "All LOBs · All BUs · FY27", 104→52 rows (both).
- [x] Publish neutral CSV **byte-identical**: len 2641, hash 237659324.
- [x] Publish modified CSV (NC=115 + disp mod 130) **byte-identical**: hash 2779043373 (exercises ASU_Adj + Disp_Adj cols).
- [x] Theme toggle → `body[data-theme=dark]` + localStorage `btc_sim_theme=dark` (identical key + value both).
- **Result: zero divergences.** Not separately driven (same shared engine, covered transitively): decline CSV import,
      FS Access export path (Chromium-only; Blob path verified via the CSV capture), pass counter.
- **Verify-harness gotchas (recorded):** original slider handlers (`ncSync`/`dSync`/`sSync`) render via `schedule()`
      (async rAF) — a synchronous read after firing sees stale DOM; and the Publish CSV/`_adj` is a snapshot refreshed
      only by `renderRate`/`renderPub`, so force those before `_exportCsv()`. React sliders have NO ids → drive via the
      native `HTMLInputElement.value` setter + bubbling `input` event; capture React's CSV by patching `window.Blob`
      (its export never returns the string). `dSync(100)` does NOT clear a prior segMod (leftover ×1.25) — same in both.

## UX round 2 — filters-to-top + step nav (2026-08-31)  ✅ DONE
- [x] Filters moved to a horizontal strip below the header (was fixed right-side drawer). FilterRail strip
      header + inline "More" chip; dropdowns open downward; removed drawer/rail-open CSS. `App.jsx`,
      `FilterRail.jsx`, `btc.css`.
- [x] 3 stepper pages clickable/navigable → `onStep(1|2|3)` + keyboard; `.step{cursor:pointer}`.
- [x] `start.bat` → build + `vite preview` on :5173 (npm run dev broken by `#` in repo path).
- [x] Browser-verified @ :8199 (dist): strip layout, downward multi-select dropdown, step-box nav. Build green.

## UX round 3 — tab/label/publish polish (2026-08-31, branch `master-react_v2`)  ✅ DONE
- [x] Step-1 label → "Adjust NCs, APOS renewals" (`App.jsx`).
- [x] Page-1 `All/Field/Tech` sub-tabs in `AsuView.jsx` (visual/selection only — no data split).
- [x] Page-2 Disp `Parts/Parts+Labour/Labour Only` seg buttons disabled (kept), `All` active (`RateView.jsx`).
- [x] Removed filters-strip collapse toggle; dropped `railOpen`/`useState` (`FilterRail.jsx`, `App.jsx`).
- [x] Equal tab heights (`.tab`+`.segt` = 32px) + tabs→segbar gap 24→12px (`btc.css`).
- [x] Chart-shrink fix: `ResizeObserver`→`chart.reflow()` in `BtcChart.jsx`.
- [x] Main tabs rounded (`.tab` radius 8px, no `border-bottom:none`).
- [x] Publish: removed SR/Disp allocation views; Export + Back-to-Step-2 moved to right-side `.ctl` panel
      (table+panel in `.row`); filename override input + `Saves as` preview; `exportPublished(custom)` wired;
      export label/info/saves fonts trimmed, info line single-line (`PubView.jsx`, `useBtc.js`, `btc.css`).
- [x] Build green (706 KB JS); browser-verified on `:5173` (vite preview of dist).

## UX round 4 — data cleanup + NC/APOS field/tech split (2026-08-31)  ✅ DONE
- [x] Audited copied `input/` files; deleted unneeded (`btc_data.js`, `declines_dummy.js`, `Dummy.xlsx`,
      `gen_btc_dataset.py`, and initially the raw CSV/gen — later restored); kept 2 declines CSVs.
- [x] Deleted dead `AllocationModal.jsx` + `.modal*` CSS (commit `5d6363e`).
- [x] Restored real pipeline `btc_raw_dataset.csv → gen_ui_from_csv.py → btc_data.json` from `origin/master`.
- [x] Field/tech split in the DATASET: `gen_ui_from_csv.py` emits `nc_field/nc_tech/apos_field/apos_tech`
      (40/60) + `btc_raw_dataset_segmented.csv` (real Segment column). Regenerated `btc_data.json`.
- [x] App reads split per tab (no ratio math in code): engine `ASU_SEG` + `computeAsuRows` optional args +
      `computeAsuView` array-select + `aggLob` sums + `setAsuSeg`; `AsuView` store-driven segbar + Segment column.
- [x] Verified live: NC/APOS split 40/60 exact, Segment column shows label. Build green (~743 KB JS); smoke 17/17.
- [x] **ASU = NC + APOS − Declines** (page-1 displays: KPIs, panel Base/Adjusted/Delta, chart line, derived
      Adj ASU column). Engine `adj` + SR/Disp/Publish untouched. Importing declines now reduces adjusted ASU
      (verified 5,158,979→4,858,979 for 300k declines).
- [x] **Declines field/tech split baked INTO the files:** both declines CSVs → `FW,Declines,Segment`
      (Tech 60% + Field 40%); `importDeclinesText` reads Segment → `DECL_SEG`; `computeAsuView` uses file values
      (nc-fraction fallback for old files). Verified both files: 40/60 exact, field+tech==all.

## UX round 5 — sliders / S-curve / baked declines (2026-09-04)  ✅ DONE
- [x] Adjustment sliders 60–150 → **0–150** (`clampM` lower bound; `AsuView` Slider default min; `RateView` seg min).
      Verified value 0 accepted, adjusted drops.
- [x] Adjustments ramp as an **S-curve** (smoothstep 3t²−2t³) instead of flat uniform %. `scurve`/`scurveAt` applied in
      `computeAsuRows` (NC+APOS) + `bendSeg` (SR/Disp). Verified ratio 1.000→1.257→1.500 across FY27. (Changes P5 CSV baseline.)
- [x] Declines **baked into `btc_data.json`** (`gen_ui_from_csv.py` reads `declines_dummy.csv`; short→full fw). `boot`
      loads it; import/remove UI + engine `importDeclinesText`/`removeDeclines` + store wraps removed. Verified
      ASU Actuals 3,620,423 = NC+APOS−1,538,556. Dropped `DECL_IMPORTED` from adjusted-reveal (fixed smoke).
- [x] Build green; smoke 17/17; browser-verified :5188, zero console errors.

## UX round 6 — neutral=0 sliders / reset-btn move / segment AOP (2026-09-04)  ✅ DONE
- [x] Sliders: **0 = neutral, uplift-only** (`mult = 1 + value/100`, 150 = 2.5×), default value 0. Neutral flipped
      100→0 across engine (init/clampM/bendSeg/computeAsuRows/detection/reset). Verified NC=150 ratio 1.00→1.77→2.50.
- [x] Table **reset button** moved to top-right gutter (`.tblreset` top:-3px right:-5px): right edge aligned with the
      chart expand button, lower edge aligned with the top of the table's value rows. Verified 1090≈1091, bottom==values top.
- [x] **ASU Field/Tech AOP** targets lowered to segment averages (`asuSegKeys` + seg-aware `autoAop`/`aopSliderMax`).
      Verified All 64249 = Field 25699 (.400) + Tech 38550 (.600).
- [x] **SR/Disp AOP** default → **average of their own series** (revised): `autoAop` default = avg weekly
      `seriesOf(kind)×segWeight` (was rate × avg-ASU); target-rate override (SMOD/ICR) kept. Verified SR 7321=avg SR,
      Disp 4104=avg Disp.
- [x] Smoke neutral assertion rewritten (old one invalid under baked declines). Build green; smoke 17/17; 0 console errors.

---
**Now:** P0–P5 done + 6 UX rounds. Sliders 0-neutral uplift (0→150), reset-btn top-right, S-curve adjustments,
declines baked, segment-aware ASU AOP. Branch `master-react_v2`, app at repo root.
**Next (optional):** README, pin `highcharts@11.4.8`, code-split ~743 KB bundle, rename folder without `#`
to restore `npm run dev`. Consider putting Publish's ASU_Adj on the same NC+APOS−Declines basis (page 1 only for now).
