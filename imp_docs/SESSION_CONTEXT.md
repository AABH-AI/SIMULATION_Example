# SESSION CONTEXT — current state

_Last updated: 2026-08-31._

## Layout NOW (repo restructured)
App restructured to **repo root** (commit `7ce9178` "BTC Adjustment Simulator (React) as standalone
app at root"). Sources are at `src/`, `scripts/`, `index.html`, `start.bat` at root — NOT under `app/`.
Older sections below that say `app/…` = read as root-relative (`app/src/X` → `src/X`). Branch: `master-react_v2`
(earlier work was on `master-react`).

## How to run NOW (# path roadblock)
`npm run dev` is BROKEN here: repo path `D:\Repos\#Git\…` contains `#`, and Vite's dep scanner errors
`UNLOADABLE_DEPENDENCY … Access is denied. (os error 5)` on `/src/main.jsx`. `vite build` + `vite preview`
are fine (no dep-scan). So:
```
start.bat              # one-click: (install if needed) → npm run build → vite preview on :5173 → opens browser
```
Production build = NO hot reload; re-run start.bat after edits. **Real fix:** rename the folder without `#`
→ `npm run dev` + hot reload return.

## Project
Port `D:\Repos\SIMULATION_Example\template_ui\btc_adjustment_simulator_v2.html`
(single HTML, 2260 lines, ~178 fns, Highcharts, global mutable state) → React base.
Target behavior = that HTML file. Plan = `imp_docs/REACT_MIGRATION_PLAN.md`.

## Layout
```
btc_react_simulator/
  app/          ← Vite React app
  imp_docs/     ← trails + plan
```
Original source stays at `../template_ui/btc_adjustment_simulator_v2.html` (untouched).
Data files (not yet moved): `../template_ui/input/btc_data.js`, `input/declines_dummy.js`.

## Environment / toolchain (verified 2026-08-27)
- node v24.18.0, npm 11.16.0, npx 11.16.0, git 2.45.2. Registry PONG 375ms.
- NOT a git repo yet.

## App deps (installed in app/)
```
react 19.2.8   react-dom 19.2.8   vite 8.2.2   @vitejs/plugin-react 6.1.0
highcharts-react-official 3.2.3   zustand 5.0.15
highcharts 13.0.2   ← original pins 11.4.8; API compatible, pin down if quirk appears
```

## How to run
```
cd btc_react_simulator/app
npm run dev      # dev server
npm run build    # prod build (verified: 20 modules, ~391ms)
```

## Done
- P0 scaffold: `npm create vite@latest btc-react -- --template react`, deps added, build clean.
- Moved app → `btc_react_simulator/app/`, plan → `imp_docs/`. Set up imp_docs trails.
- P1: data + engine + store + smoke test. See below.

## P1 deliverables (all verified)
- `app/src/data/btc_data.json` — dataset (312-week FY22-27 timeline, 8 LOBs). Vite native JSON import.
- `app/src/engine/btcEngine.js` — faithful DOM-free port of the compute core (state, filter/alloc
  engine, segment math, computeAsuRows, AOP, computeRate/computeAsuView, actions, CSV, cycle label).
- `app/src/store/useBtc.js` — Zustand `version`-bump reactivity over the engine's mutable state.
- `app/scripts/smoke.mjs` — 17/17 PASS vs real data. Run: `node scripts/smoke.mjs` from app/.
- declines_dummy.js is ABSENT in source (HTML null-guards it); declines only via CSV file-picker.

## Engine design (important for P2+)
Single module mirrors the original's single-scope IIFE — lowest translation risk. Engine keeps the
mutable globals (state.TL/F/OVR/CMT/TGT_OVR/AOP_OVR/DECL_*, per-metric DISP/SR config with _seg/_segMods/_adj).
Original DOM slider reads (#ncI/#apI) are now state.ncMod/state.apMod. compute*() return plain data
objects (KPIs, table rows, chart series) — NO DOM, NO Highcharts. Components (P2) render those +
own the Highcharts instance. Store wraps mutations to bump `version`; components subscribe to version.

## P2 deliverables (browser-verified)
- `app/src/engine/chartOptions.js` — pure svgChart→Highcharts options (zone recolor, split, niceScale, tooltip).
- `app/src/components/BtcChart.jsx` — highcharts-react-official wrapper (R3 immutable={false}, in-place update).
- `app/src/components/Kpi.jsx`, `app/src/components/AsuView.jsx` — ASU page (chart+controls+table, editable cells).
- `app/src/btc.css` — CSS subset VERBATIM from source. Fonts in `app/index.html`. `app/src/index.css` neutralized.
- `app/src/App.jsx` boots store on mount. `.claude/launch.json` = dev server (npm run dev, port 5173, cwd app).
- IMPORT GOTCHA (documented): highcharts-react-official ships UMD → the component is nested on the default
  export under Vite. Use `const HighchartsReact = HcReactPkg.HighchartsReact || HcReactPkg.default || HcReactPkg`.

## How to run the UI
```
cd btc_react_simulator/app
npm run dev            # http://localhost:5173
```
Browser test proved: neutral = 3 actuals KPIs; NC=120 → adjusted reveals, Delta +614,556 (matches smoke),
7 chart series update in place (no remount), edits round-trip, Reset works. Prod build green.

## P3 deliverables (browser-verified)
- Engine: `computePubView()` added (mirrors renderPub, refreshes SR._adj/DISP._adj).
- Store: `computeRate`/`computePubView` selectors + `goTab(v)`/`stepTo(n)` router (mirror original go()/setStep()).
- `app/src/components/RateView.jsx` — shared SR + Disp (kind prop): segment tabs, 6-card KPIs, editable table, controls.
- `app/src/components/PubView.jsx` — Publish: KPI row + 5-chart grid + editable summary table + CSV export.
- `app/src/App.jsx` — header + stepper (Prev/Next) + tabs; tab visibility gated by step (1→asu, 2→sr|disp, 3→pub).
- btc.css: added tabs/stepper/segbar/pubcharts/header styles.
Verified: Disp mod 125 → Gap +93,680 (486,384 − 392,704, ties out); Publish 5 charts/10 KPIs/52 rows; export ok; 0 errors.

## P4 core deliverables (browser-verified)
- Engine: filterDisplay/optionsFor/hiddenFilters/ctxText/setDark/setCycleOvr + MORE_KEYS + state.dark.
- Store: toggleTheme/applySavedTheme/setCycleOvr + filter-rail selectors (FILTERS/filterDisplay/optionsFor/etc.).
- `app/src/components/FilterRail.jsx` — 12-filter rail, multi-select dropdowns, More-filters collapse,
  per-tab hidden filters, outside-click close, reset. openK/moreOpen are local view state.
- `App.jsx` — header (brand + editable cycle label + ctx badge + theme btn), filter button, rail-open state.
- Theme: dark toggle, localStorage persist + restore on boot, dark propagated to all charts.
- btc.css: frail/fitem/fdd/fopt/morehdr + header styles.
Verified: FY27-only filter → ctx "FY27", rows 104→52; theme→dark persists; rail collapse+reopen; cycle edit persists.

## P4b deliverables (browser-verified)
- `app/src/components/BtcChart.jsx` now owns the legend + click-isolate + hover (binds to its own chart ref;
  empty-data series keep their chart slot but hide the legend span so isolation indices stay aligned). `.lg`
  removed from AsuView/RateView/PubView.
- `app/src/components/CommentCell.jsx` — per-row note cell + portal popover (read/edit, Enter save, Esc cancel,
  Delete, flip/clamp positioning, close on outside-click/scroll/resize). Store setCmtRate/setCmtAsu/setCmtPub.
  Comment column wired into all 3 tables (shown only when a visible row carries an override).
- Store `exportPublished()` — FS Access API path (showDirectoryPicker → write into outputs/, Pass#=csv-count+1)
  with Blob-download + in-session pass-bump fallback. PubView export uses it. Cycle label auto-refreshes Pass#.
- btc.css: comment cmp/cmpop/cm/cmfoot/cmdel + dark variants.
Verified: legend isolate (NC op 1, rest 0.3); comment popover round-trip; cold-tab mount = 0 console errors.
NOTE: editing a hook's deps mid-session logs a dev-only Fast-Refresh "deps changed size" warning — a cold load is clean.

## P4c deliverables (browser-verified)
- `app/src/components/ExpandableCard.jsx` — expand chart card → fixed overlay + dim backdrop; collapse via
  button/Escape/backdrop; window-resize dispatch reflows Highcharts. Wraps AsuView + RateView chart cards.
- `app/src/components/AllocationModal.jsx` — Publish SR/Disp total allocated down region/coreupsell/service
  from TL.alloc; ⊞ SR/Disp allocation buttons + modal state in PubView.
- btc.css: expand overlay + modal styles.
Verified: expand fills to overlay + Escape collapses; allocation modal shows 3 dims (Americas 50.8% → 193,544), × closes.

## Components (8; AllocationModal deleted)
AsuView, BtcChart, CommentCell, ExpandableCard, FilterRail, Kpi, PubView, RateView.
Engine: `src/engine/btcEngine.js` (state+compute+actions), `src/engine/chartOptions.js` (Highcharts builder).
Store: `src/store/useBtc.js`. Data: `src/data/btc_data.json`. Smoke: `scripts/smoke.mjs`.

## State of the app
FULL feature parity with the original HTML, **P5-verified byte-identical** (Publish CSV, neutral + modified): 4 views
(ASU/SR/Disp/Publish), stepper + tab router, filter rail, theme toggle, cycle-label edit, legend isolate/hover, comment
popover, FS Access export + pass counter, chart expand overlay, allocation modal. Runs vs real data. Smoke 17/17;
every phase browser-verified; builds clean (704 KB JS, warns >500 KB).

## P5 verification (2026-08-28) — DONE, zero divergences
Both apps served + driven identically via javascript_tool; compared DOM values + full CSV byte-hash.
- React :5173 (Vite dev, user-started). Original served: `cd template_ui && python -m http.server 8899`
  → `http://localhost:8899/btc_adjustment_simulator_v2.html` (the one 404 = declines_dummy.js, expected/null-guarded).
- Matches (original == React): ASU neutral 6,355,461/4,613,383/545,596; ASU NC=120 → Adj 6,970,017 / Adj NC 5,227,939;
  Disp mod 125 → BTC Adj 486,384, Gap +93,680; SR neutral 774,821/700,440/12.84%; FY27-only filter → 104→52 rows,
  ctx "FY27"; Publish neutral CSV **byte-identical** (len 2641, hash 237659324); Publish modified (NC=115+disp130)
  CSV **byte-identical** (hash 2779043373); theme → data-theme=dark + localStorage `btc_sim_theme=dark` (same key).
- Harness notes: original renders via `schedule()` (async) — force `renderRate`/`renderPub` before reading DOM/`_exportCsv`;
  React sliders have no ids (native value-setter + input event); capture React CSV by patching `window.Blob`.

## UX fixes (2026-08-28) — 6 applied, DOM-verified
1. Control-panel nav buttons restored (ASU→Step2; SR/Disp→switch + Step1/Step3; Pub→Back to Step2) via goTab/stepTo.
2. AOP slider capped at 1.5× the page's peak weekly value — engine `aopSliderMax(kind)` (asu=NC+APOS inflow,
   sr/disp=DS×segWeight). Per-page distinct (ASU 267,975 / Disp 7,043).
3. FQM Flag + GCFA Type filter dropdowns open upward (`.fdd.up.open` absolute, bottom:100%).
4. Removed the redundant blue `.fbtn` Filters button from the stepper (rail has its own ✕/⧩).
5. Floating `.tblreset` (↺) button over each chart-table (AsuView/RateView) → `tblReset(kind)` (clears per-week
   edits, keeps modifier). PubView already had "Reset edits".
6. **Edit-focus bug fixed:** `.ec` cells were `onChange`+`key` w/ `version` → per-keystroke remount → focus lost on
   backspace. Now `onBlur` commit + Enter→blur (matches original native `onchange`). Focus survives typing/backspace.
Files: btcEngine.js, useBtc.js, AsuView.jsx, RateView.jsx, PubView.jsx, FilterRail.jsx, App.jsx, btc.css.
Build green; smoke 17/17.

## UX changes (2026-08-31) — browser-verified
1. **Filters → horizontal strip at top.** Moved from fixed right-side drawer to a full-width strip
   directly below the header (`.hd`). `App.jsx`: `<FilterRail>` rendered above the stepper; removed dead
   `body.classList.toggle('rail-open')` effect. `FilterRail.jsx`: inline header (Filters · Reset · ▾
   toggle), removed floating `⧩ freopen` + upward-dropdown (`up`) logic; "More" now an inline chip.
   `btc.css`: `.frail` flex-wrap row + `border-bottom`; `#frailBody` flex-wrap; `.fitem` inline columns;
   `.fdd.open` absolute downward; removed `.rail-open` margin/drawer rules + `.freopen`/`.fdd.up.open` +
   stale `.expanded` rail offset; added `.frail.collapsed #frailBody{display:none}`.
2. **3 step pages clickable.** Stepper `.step` boxes → `onStep(1|2|3)` + `role=button`/tabIndex/Enter-Space.
   `stepTo` clamps 1–3, jumps freely. `btc.css`: `.step{cursor:pointer}` + hover.
3. **start.bat** rewritten → build + `vite preview -- --port 5173` (was broken `npm run dev`; see # path note above).
Files: `src/App.jsx`, `src/components/FilterRail.jsx`, `src/btc.css`, `start.bat`. Build green (706 KB JS).
Verified @ :8199 (served dist): horizontal strip, FY dropdown opens down w/ multi-select, step-box nav works.
NOTE: filters auto-collapse on Publish (pre-existing `onTab('pub')`); reopen via ▾.

## UX changes (2026-08-31, round 3) — browser-verified, branch `master-react_v2`
1. **Step-1 renamed** "Adjust ASU driver" → **"Adjust NCs, APOS renewals"** (`App.jsx`).
2. **Page-1 sub-tabs** `All / Field / Tech` added to `AsuView.jsx`. (Round 3 = visual only; **round 4 made
   them functional** — they now drive the NC/APOS field/tech split, see the data section below.)
3. **Page-2 Disp seg buttons** `Parts / Parts+Labour / Labour Only` **disabled** (`disabled={i>0}` in
   `RateView.jsx`), `All` stays active. Kept in DOM.
4. **Filters-strip collapse toggle removed** (`.frail-toggle` span gone from `FilterRail.jsx`); `App.jsx`
   dropped `railOpen`/`setRailOpen`/`onToggleOpen` + `useState` import; `<FilterRail open={true}/>`.
5. **Equal tab heights + gap** (`btc.css`): `.tab` and `.segt` both `inline-flex`/`height:32px`
   (were 32 vs 27.2); `.segbar{margin:0}` → tabs→segbar gap 24px→12px (matches stepper/tabs rhythm).
6. **Chart-shrink fix** (`BtcChart.jsx`): `ResizeObserver` on `.cw` → `chart.reflow()`. Fixes page-1 chart
   shrinking on the first All→Field/Tech switch (Highcharts oversized first paint before layout settled).
7. **Main tabs rounded** (`btc.css`): `.tab` border-radius `8px 8px 0 0`→`8px`, dropped `border-bottom:none`.
8. **Publish page** (`PubView.jsx`): removed ⊞ SR/Disp allocation buttons + `AllocationModal` usage. Summary
   table + new **Export panel** now in a `.row` (table flex + `.card.ctl` 310px, control-panel style). Export
   panel = info box, **FILE NAME** override input (`maxWidth:none` → fills to card right edge, equal gaps),
   live `Saves as: <name>.csv`, `← Back to Step 2`, `⤓ Export data`. Store `exportPublished(custom)` sanitizes
   an optional filename (else `cycleBaseName()`). Fonts trimmed: label + Saves-as 11→10px; info line 11→8px +
   `white-space:nowrap` + `.mb` padding `7px 8px` → single line (overflow 0).
Files: `App.jsx`, `btc.css`, `AsuView.jsx`, `BtcChart.jsx`, `FilterRail.jsx`, `PubView.jsx`, `RateView.jsx`,
`useBtc.js`. Build green (706 KB JS). Verified on `:5173` = **`vite preview` of `dist`** (not dev/HMR — only
reflects a rebuild; rebuild before checking). Fresh `vite dev` on `:5199` still fails on the `#` path.

## Data pipeline + NC/APOS field/tech split (2026-08-31, round 4) — dataset-side
- **Pipeline:** `src/data/btc_raw_dataset.csv → src/data/gen_ui_from_csv.py → src/data/btc_data.json`.
  Run: `cd src/data && python gen_ui_from_csv.py`. (gen_btc_dataset.py is NOT the app's generator — it reads
  an unavailable xlsx and emits a different schema; ignore it.) Only `btc_data.json` is imported by the app.
- **Field/tech split lives in the DATA:** `gen_ui_from_csv.py` has `FIELD_SHARE=0.40`/`TECH_SHARE=0.60`; per LOB
  `btc_data.json` now carries `nc_field/nc_tech/apos_field/apos_tech` (field=round40%, tech=remainder → exact).
  Also emits `btc_raw_dataset_segmented.csv` (real **Segment** column: Tech row=60% NC/APOS + full other
  measures, Field row=40% NC/APOS + other measures zeroed so aggregation never double-counts).
- **App reads it per tab (no ratio math in code):** engine `state.ASU_SEG` ('all'|'field'|'tech');
  `computeAsuRows(ncSrc,apSrc,ncKey,apKey)` optional args (defaults=full → Publish/SR/Disp untouched);
  `computeAsuView` selects the split arrays by `ASU_SEG` + returns `seg`/`segLabel`; `aggLob` sums the 4 new
  arrays; `setAsuSeg` action; `AsuView` All/Field/Tech segbar is store-driven + has a **Segment** table column.
  Verified: NC/APOS split 40/60 exact.
- **ASU = NC + APOS − Declines (page-1 display, strict):** the ASU-Actuals + Adjusted-ASU KPIs, the control-panel
  Base/Adjusted/Delta, the chart ASU-Actuals line, and the table's Adj ASU column (now DERIVED, non-editable —
  the old direct-`aa` edit is dropped from page 1) all use `nc+apos−decl` / `adjNew+btcApos−decl`. Importing
  declines now visibly reduces adjusted ASU. **Engine `adj` (installed-base recursion) + SR/Disp/Publish are
  UNCHANGED** — dispatches = ASU × rate needs the installed-base ASU, so only page-1 DISPLAYS use the identity.
- **Declines field/tech split lives in the FILES:** `declines_dummy.csv` + `declines_dummy_alt.csv` are now
  `FW,Declines,Segment` (Tech 60% + Field 40% rows per week; total = field+tech). `importDeclinesText` READS the
  Declines (2nd col) + Segment (3rd col) → `DECL_VALS` (total) + `DECL_SEG {field,tech}`; `computeAsuView` uses
  the file's `DECL_SEG` per tab (no ratio math; nc-fraction kept only as fallback for a Segment-less file).
  Parser is backward-compatible with old 2-column declines files.
- **src/data now:** `btc_data.json` (imported), `btc_raw_dataset.csv` + `gen_ui_from_csv.py` +
  `btc_raw_dataset_segmented.csv` (pipeline), `declines_dummy.csv` + `declines_dummy_alt.csv` (split, upload
  fixtures). Deleted earlier: `btc_data.js`, `declines_dummy.js`, `Dummy.xlsx`, `gen_btc_dataset.py`.
- `AllocationModal.jsx` + `.modal*` CSS DELETED (commit `5d6363e`).

## Next (optional)
- README, pin `highcharts@11.4.8` (currently 13.0.2), code-split the ~743 KB JS bundle (build warns >500 KB).
- Rename repo folder without `#` to restore `npm run dev` + hot reload.

## Open risks (see plan §5 for fixes)
- R1 File System Access API export (Chromium/secure-context only) — has Blob fallback.
- R3 Highcharts flicker on React re-render — use highcharts-react-official immutable={false}.
- R5 data via `<script src>` globals → convert to ES modules.
- CSS fidelity — original has load-bearing hand-tuned layout; copy verbatim.
- highcharts 13 vs original 11.4.8.

## User style
Caveman mode (terse). Blunt. Wants exactly what's asked, no scope creep. Confirm before big/irreversible moves.
