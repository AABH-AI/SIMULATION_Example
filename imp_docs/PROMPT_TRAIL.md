# PROMPT TRAIL — session history (append-only)

Newest at bottom. One entry per session. Never rewrite past entries.

---

## 2026-08-27 — Scope migration + scaffold React base
- **Asked:** convert `btc_adjustment_simulator_v2` to React; identify deps/roadblocks/overhauls/
  failure-modes + fixes; make a plan; check deps exist; run scaffold; put everything in a new
  folder; keep imp_docs + prompt + task trails updated.
- **Done:**
  - Scoped source: `template_ui/btc_adjustment_simulator_v2.html` = 2260 lines, ~178 fns,
    88 inline handlers, Highcharts 11.4.8, global mutable state, data via `window.BTC_DATA`
    `<script src>` globals, File System Access API export (`showDirectoryPicker`, lines 1977-1982).
  - Wrote `REACT_MIGRATION_PLAN.md` (deps, roadblocks R1–R12, failure modes, phases P0–P5, ~4d est).
  - Verified toolchain: node v24.18.0, npm 11.16.0, git 2.45.2, registry PONG. All target pkgs resolvable.
  - P0: `npm create vite@latest btc-react -- --template react`; `npm install`;
    added `highcharts highcharts-react-official zustand`. `npm run build` clean (20 modules, ~391ms).
  - Note: highcharts resolved to 13.0.2 (original pins 11.4.8; compatible for used API).
  - Restructured: created `btc_react_simulator/`, moved app → `app/`, plan → `imp_docs/`.
  - Set up imp_docs trail system (00_START_HERE, SESSION_CONTEXT, PROMPT_TRAIL, TASKS).
- **Outcome:** scaffold live + build green. No BTC logic ported yet. Next = P1 store + data move.

## 2026-08-27 (cont.) — P1: engine + store + data
- **Asked:** run P1.
- **Done:**
  - Read full source JS (474–2260) to port compute faithfully.
  - Copied `template_ui/input/btc_data.json` → `app/src/data/` (Vite native JSON; declines_dummy.js absent in source).
  - Wrote `app/src/engine/btcEngine.js` — faithful DOM/Highcharts-free port of the compute core:
    state module + filter/alloc engine (visIdx/chgPeriods/allocMult/SC) + segment math
    (bendSeg/sumSubs/spreadAllEdit/allocLR/compositeMod) + computeAsuRows + AOP (autoAop/aopVal/aopBounds)
    + view compute (computeRate/computeAsuView return plain data) + mutation actions + CSV export + cycle label.
    Original DOM slider reads (#ncI/#apI) became state.ncMod/state.apMod.
  - Wrote `app/src/store/useBtc.js` — Zustand version-bump reactivity wrapper; boot() imports the JSON.
  - Wrote `app/scripts/smoke.mjs` — 17 assertions vs real dataset. ALL PASS (boot/312wk, neutral-hides-adjusted,
    NC +20% lift +614,556, disp gap == BTC Adjusted − AOP Target, All-edit redistributes to typed total,
    aa balance re-anchor, CSV schema, cycle label).
  - Vite build green with engine+store+JSON bundled (193→386KB, +173KB = dataset).
- **Outcome:** P1 complete + verified. Compute math confirmed faithful. Next = P2 (ASU React slice + Highcharts).

## 2026-08-27 (cont.) — P2: ASU vertical slice (first React UI)
- **Asked:** run P2.
- **Done:**
  - Read remaining svgChart Highcharts config (1034–1148).
  - `app/src/engine/chartOptions.js` — pure svgChart→Highcharts options (actual/forecast zone recolor, seg-split,
    dashed target, niceScale y-axis, in-chart shared tooltip w/ positioner + symSvg). No DOM.
  - `app/src/components/BtcChart.jsx` (highcharts-react-official, immutable={false}), `Kpi.jsx`, `AsuView.jsx`
    (KPI row + chart + editable table + NC/APOS/AOP sliders + declines import + reset).
  - `app/src/btc.css` — CSS subset ported verbatim; fonts → `app/index.html`; neutralized Vite `index.css`;
    `App.jsx` boots store; `.claude/launch.json` for dev server.
  - Debugged: highcharts-react-official UMD → component nested on default export under Vite. Fixed import to
    `HcReactPkg.HighchartsReact || HcReactPkg.default`. (Root-caused via javascript_tool probe of the optimized dep.)
  - Browser-verified live (localhost:5173): neutral = 3 actuals KPIs (adjusted hidden ✓); drove NC slider→120
    via real input event → adjusted revealed (Adjusted ASU 6,970,017, Adj NC 5,227,939), Delta +614,556
    (EXACT match to P1 smoke lift), legend shows Adj ASU+Adj NC only, 7 chart series updated in place (no
    remount/flicker, R3 holds); Adj-ASU cell edit round-trips (9,000,000, aa re-anchor), edt row tint;
    Reset → back to 3 KPIs / ncMod=100. Prod build green (336ms).
- **Outcome:** P2 complete + browser-verified. Store+Highcharts pattern proven end-to-end. Next = P3 (SR/Disp/Publish views, stepper/tab router). Engine still needs computePubView for Publish.

## 2026-08-27 (cont.) — P3: SR/Disp/Publish views + stepper + tab router
- **Asked:** run p3.
- **Done:**
  - Engine: added `computePubView()` (mirrors renderPub math; calls computeRate('sr'/'disp') to refresh _adj).
  - Store: `computeRate`/`computePubView` selectors + `goTab(v)` (pruneToForecast on Publish; restore FY26+FY27 on
    leave) + `stepTo(n)` (step 2 resets segment views; lands each step on its tab) — mirror original go()/setStep().
  - `app/src/components/RateView.jsx` — shared SR + Disp by `kind`: segment tabs (selectSeg), 6-card KPIs,
    chart, editable Adj table (editRate), modifier + AOP + target-rate controls, gap bar.
  - `app/src/components/PubView.jsx` — Publish: 5+5 KPI row, 5-chart pubcharts grid, editable summary table
    (editAsu an/ba/aa + editRate sr/disp 0), CSV export via Blob download.
  - `App.jsx` — header + stepper (Prev/Next) + tabs; tab visibility gated by step. btc.css: tabs/stepper/segbar/
    pubcharts/header ported.
  - Verified live: step gating (step1 only ASUs tab); step2 SR (1 seg tab 'All', neutral 3 KPIs) → Dispatches
    (4 seg tabs All/Parts/Parts+Labour/Labour Only), mod 125 → 6 KPIs, Disp BTC Adjusted 486,384 vs DS 433,019,
    Gap +93,680 == 486,384−392,704 (ties out), 3 chart series; step3 Publish (only Publish tab, 5 charts, 10 KPIs,
    52 forecast rows, export click ok). ZERO console errors across full flow. Smoke 17/17 still pass; prod build green (338ms).
- **Outcome:** P3 complete + browser-verified. All 4 views + stepper + router working. Core simulation loop feature-complete. Next = P4 (chrome: filter rail, theme, comment popover, legend isolate, expand overlay, FS Access export, cycle label edit).

## 2026-08-27 (cont.) — P4 core: filter rail + theme + cycle-label edit
- **Asked:** run P4. (Interlude: user found `template_ui/btc-adjustment-cycle-fy27-pass-1.csv` — confirmed it was
  the P3 test export from clicking Publish's export button; Disp_Adj = Disp_DS×1.25 leftover; throwaway.)
- **Done (core; polish split to P4b):**
  - Engine: filterDisplay/optionsFor/hiddenFilters/ctxText + setDark/setCycleOvr + MORE_KEYS + state.dark.
  - Store: toggleTheme/applySavedTheme/setCycleOvr + filter-rail selectors.
  - `app/src/components/FilterRail.jsx` — 12 filters, multi-select dropdowns, More-filters collapse,
    per-tab hidden filters, outside-click close, reset (openK/moreOpen local view state).
  - `App.jsx` rebuilt: header (brand + contenteditable cycle label + ctx badge + theme ☾/☀ btn) + Filters
    button + rail-open state; dark propagated to all charts (buildChartOptions dep).
  - btc.css: frail/fitem/fdd/fopt/morehdr + header ctx/themebtn styles ported.
  - Browser-verified live: rail 12 filters render, ctx "All LOBs · All BUs · FY26–FY27"; opened FY dropdown,
    deselected FY26 → ctx "FY27", visible rows 104→52 (filter drives data slice); theme toggle → data-theme=dark,
    btn ☀, localStorage 'dark'; Filters button collapses rail → reopen funnel; cycle label edit "My Custom Cycle"
    persists (drives export filename). Zero console errors. Smoke 17/17 pass; prod build green (420ms).
- **Deferred → P4b:** legend click-isolate/hover, comment popover (portal), chart expand overlay, FS Access
  export path + pass counter (plain Blob download works today), allocation modal.
- **Outcome:** P4 core complete + browser-verified. App fully usable. Next = P4b polish or P5 verification.

## 2026-08-27 (cont.) — P4b: legend isolate/hover + comment popover + FS Access export
- **Asked:** run P4b.
- **Done:**
  - Legend: refactored `BtcChart.jsx` to OWN the legend + click-isolate + hover against its own chart ref
    (visibleYRange rescale on isolate/hover; empty-data series keep chart slot, legend span hidden → indices stay
    aligned). Removed the `.lg` blocks from AsuView/RateView/PubView.
  - Comment popover: `CommentCell.jsx` (createPortal to body; read/edit modes; Enter save / Esc cancel / Delete;
    cmtPos flip+clamp; close on outside-click/scroll/resize). Store setCmtRate/setCmtAsu/setCmtPub. Wired the
    Comment column into all 3 tables (only when a visible row is edited). btc.css: cmp/cmpop/cm/cmfoot/cmdel + dark.
  - Export: store `exportPublished()` — FS Access (showDirectoryPicker → write + Pass#=folder-csv+1) with
    Blob-download + in-session bump fallback. PubView → store action. App effect auto-refreshes cycle label Pass#.
  - Debug: import gotcha for HighchartsReact re-confirmed. A dev-only "useEffect deps changed size" warning
    appeared from editing the cycle effect's deps mid-session (Fast Refresh) — proved benign via a COLD new-tab
    mount = ZERO console errors.
  - Browser-verified: legend isolate NC (opacity 1 vs 0.3, other series hidden); comment popover round-trip
    (typed "Bumped NC for Q1 push" → Enter → saved + preview + popover closed). Smoke 17/17; build green (293ms).
- **Deferred → P4c (pure view niceties, no data logic):** chart expand overlay (R9), allocation modal (showAlloc).
- **Outcome:** P4b complete + browser-verified. App at near-full parity. Next = P4c (minor) or P5 (side-by-side verification).

## 2026-08-27 (cont.) — P4c: chart expand overlay + allocation modal
- **Asked:** run P4c.
- **Done:**
  - `ExpandableCard.jsx` — wraps a chart card; expand button → `.expanded` fixed overlay + `#expandBackdrop`
    + `body.expanding`; collapse via button/Escape/backdrop; dispatches window resize so HighchartsReact reflows.
    Wrapped the AsuView + RateView chart cards. btc.css: expandbtn/#expandBackdrop/.expanded.
  - `AllocationModal.jsx` — Publish SR/Disp total weighted-allocated down region/coreupsell/service (TL.alloc).
    ⊞ SR/Disp allocation buttons + modal state wired into PubView. btc.css: modal/modalcard/allocgrp.
  - Verified live (fresh tab, 0 console errors): expand → .expanded + backdrop + body.expanding, chart grows to
    280px, Escape collapses; allocation modal "Published SRs allocation" (Region/Core-Upsell/Service; Americas
    50.8% → 193,544), closes on ×. Transient Vite 500s during edit were mid-edit HMR (open/close tags edited
    separately) — build passed clean, fresh tab clean. Smoke 17/17; prod build green (378ms). 9 components total.
- **Outcome:** P4c complete + browser-verified. FULL feature parity with the original reached. Next = P5 (side-by-side verification vs original HTML).

## 2026-08-28 — P5: side-by-side verification vs original HTML
- **Asked:** continue with btc_react_simulator; read all imp_docs. (Docs said Next = P5.)
- **Setup:** React dev already on :5173 (user-started). Served original: `cd template_ui && python -m http.server 8899`
  → `http://localhost:8899/btc_adjustment_simulator_v2.html` (opening via `file://` gave a static, non-running snapshot;
  a real HTTP server was needed so its `<script src=input/btc_data.js>` + Highcharts CDN load). Loaded both in browser
  tabs, drove each identically via `javascript_tool`, compared DOM-rendered values + a full-CSV byte-hash.
- **Verified identical (original == React):**
  - ASU neutral: ASU 6,355,461 / NC 4,613,383 / APOS 545,596.
  - ASU NC=120: Adjusted ASU 6,970,017, Adj NC 5,227,939 (Δ +614,556 == P1 smoke lift).
  - Disp mod 125: DS 433,019, BTC Adjusted 486,384, AOP 392,704, MDR 7.18%, Adj Rate 8.06%, Gap +93,680.
  - SR neutral: DS 774,821, AOP 700,440, MDR 12.84%.
  - Filter FY27-only: ctx "All LOBs · All BUs · FY27", visible rows 104→52.
  - Publish neutral CSV **byte-identical**: len 2641, hash 237659324 (11-col header, 52 data rows).
  - Publish modified CSV (NC=115 + disp mod 130) **byte-identical**: hash 2779043373 (exercises ASU_Adj + Disp_Adj).
  - Theme toggle: `body[data-theme=dark]` + localStorage `btc_sim_theme=dark` (same key + value).
- **Result: ZERO divergences.** Full parity confirmed at the byte level on the export.
- **Harness gotchas (learned mid-verify, recorded for next time):**
  - Original slider handlers (`ncSync`/`dSync`/`sSync`) render via `schedule()` (async rAF); a synchronous DOM read
    right after firing sees the PRE-update render. Force `renderAsu()`/`renderRate(C)`/`renderPub()` before reading.
  - Publish CSV / `C._adj` is a snapshot refreshed only by `renderRate`/`renderPub` — call those before `_exportCsv()`,
    else the export reflects a stale (often neutral) state even though the modifier is set.
  - React sliders have no `id` → drive with the native `HTMLInputElement.prototype.value` setter + a bubbling `input`
    event (React's controlled-input contract). Capture React's CSV by monkeypatching `window.Blob` before clicking
    export (its `exportCsv()` is a module fn, never returns the string to the page; export just downloads a Blob).
  - `dSync(100)` does NOT clear a previously-set segMod (leaves the ×1.25 bend) — identical in both apps, not a bug;
    a fresh reload or the segment reset is the clean path. Matches the P4 "Disp_Adj×1.25 leftover" note.
- **Not committed:** repo still not a git repo (see memory). No code changed this session — verification + docs only.
- **Outcome:** P5 complete. Migration DONE — React port is a faithful, byte-verified replacement of the original HTML.
  Optional follow-ups: git init, README, pin highcharts@11.4.8, code-split the 704 KB bundle.

## 2026-08-28 (cont.) — UX fixes (6) on the React app
- **Asked:** (1) nav buttons missing in control panels; (2) AOP slider has no upper limit — cap at 1.5× the page's
  max value (different for asu/sr/disp); (3) FQM Flag + GCFA Type dropdowns should open upward; (4) remove the extra
  blue-shaded Filters button; (5) add a reset button for the table below the chart; (6) table edit drops out on a
  single backspace — must click again.
- **Root cause of (6):** `.ec` cells used React `onChange` (fires per keystroke) + a `key` containing `version`. Each
  keystroke → editAsu/editRate → store `version` bump → key changes → React remounts the input → focus lost. The
  original HTML uses native `onchange` (commits on blur/Enter, NOT per keystroke) — the port changed the semantics.
- **Done:**
  - (6) All `.ec` table inputs + the target-rate box (AsuView/RateView/PubView) switched `onChange`→`onBlur` +
    `onKeyDown` Enter→blur. Commits only on blur/Enter (matches original `onchange`); no remount mid-typing → focus
    kept through typing and backspace. Verified: focus survives type + backspace; blur commits + persists post-remount.
  - (2) Engine `aopSliderMax(kind)` added (after `aopBounds`): 1.5 × peak weekly value over the forecast FY —
    asu = weekly NC+APOS inflow, sr/disp = weekly DS × segment weight. Store selector `aopSliderMax` exposed.
    AsuView/RateView AOP range+number `max` now use it. Verified per-page: ASU 267,975 vs Disp 7,043 (distinct).
  - (1) Nav buttons ported into the control cards: ASU → "Go to Step 2 …"; SR → "Switch to Dispatches →"; Disp →
    "← Switch to SRs"; SR/Disp both get "← Step 1 (ASU)" + "Step 3 (Publish) →"; Publish → "← Back to Step 2".
    Wired to store `goTab`/`stepTo`.
  - (3) FilterRail: FQM Flag + GCFA Type `.fdd` get an `up` class; btc.css `.fdd.up.open{position:absolute;bottom:100%}`
    renders their dropdown above the button (they sit at the rail bottom). Other filters unaffected.
  - (4) Removed the stepper's blue `.fbtn` "⧩ Filters" button from App.jsx — the rail's own ✕ / ⧩ reopen control
    already toggles it. (`.fbtn` CSS left in place, now unused.)
  - (5) Table reset: `.twwrap` wrapper + a floating `.tblreset` (↺) button over each table in AsuView/RateView →
    store `tblReset(kind)` (clears that view's per-week OVR/CMT, keeps the modifier). PubView already had its
    "Reset edits". btc.css: `.twwrap`/`.tblreset` ported. Verified: edit 99,999 → ↺ → reverts to 4,763, modifier
    stays 120.
- **Files:** `src/engine/btcEngine.js` (+aopSliderMax), `src/store/useBtc.js` (+selector), `src/components/AsuView.jsx`,
  `RateView.jsx`, `PubView.jsx`, `FilterRail.jsx`, `App.jsx`, `src/btc.css`.
- **Verified:** prod build green (717ms); smoke 17/17 (engine change is additive); every fix DOM-verified live on
  :5173. (Browser pane wasn't compositing this run — checked via `javascript_tool` DOM/class/attr reads, not pixels.)
- **Outcome:** all 6 fixes in. No behavior regression to the P5-verified engine math.

## 2026-08-31 — Filters-to-top + clickable step pages + start.bat fix
- **Asked:** (1) move filters to the top as a horizontal strip below the heading bar; (2) make the
  3 step "pages" selectable/navigable; then replace start.bat and kill the stale dev server; push to
  `master-react`.
- **Done:**
  - (1) Filters relocated from the fixed right-side drawer to a horizontal strip directly under `.hd`.
    `App.jsx`: `<FilterRail>` moved above the stepper (was last child after `.wrap`); dropped the dead
    `document.body.classList.toggle('rail-open', railOpen)` effect. `FilterRail.jsx`: strip header
    (`Filters` · `Reset` · ▾ collapse toggle), removed the floating `⧩ freopen` button + the upward-
    dropdown (`up`) logic (all dropdowns open downward now); "More" is an inline chip. `btc.css`:
    `.frail` = flex-wrap row, full-width, `border-bottom`; `#frailBody` flex-wrap; `.fitem` inline
    min-width columns; `.fdd.open` absolute downward; `.morehdr` inline chip; removed `.rail-open`
    margin/drawer rules, `.freopen`, `.fdd.up.open`, and stale `body.rail-open .expanded{right:276px}`.
    Added `.frail.collapsed #frailBody{display:none}`.
  - (2) Stepper `.step` boxes now clickable → `onStep(1|2|3)` + `role=button`/`tabIndex`/Enter-Space
    keydown. `stepTo` clamps 1–3 and jumps freely. `btc.css`: `.step{cursor:pointer}` + hover.
  - start.bat rewritten: `npm run build` then `npm run preview -- --port 5173` (was `npm run dev`).
- **# path roadblock:** `npm run dev` fails on this repo — path `D:\Repos\#Git\...` contains `#`,
  Vite's dep scanner errors `UNLOADABLE_DEPENDENCY … Access is denied. (os error 5)` on `/src/main.jsx`.
  `vite build` + `vite preview` are unaffected (no dep-scan), so start.bat uses build+preview. Real fix =
  rename the folder without `#` → dev + hot reload return.
- **Files:** `src/App.jsx`, `src/components/FilterRail.jsx`, `src/btc.css`, `start.bat`.
- **Verified:** `npm run build` clean (35 modules, ~364ms, 706 KB JS). Browser (served `dist` @ :8199):
  filters render as a horizontal strip; Fiscal Year dropdown opens downward with multi-select intact;
  clicking the Publish step → Step 3 (steps 1&2 marked done), clicking Adjust ASU → Step 1. Filters
  auto-collapse on Publish (pre-existing `onTab('pub')` behavior), reopen via ▾.
- **Outcome:** both UX changes in, build green, pushed to `master-react`.

## 2026-08-31 (cont.) — UX round 3: tab/label/publish polish (branch `master-react_v2`)
- **Asked (5 rounds):** (1) rename step 1 → "Adjust NCs, APOS renewals" + add Field/Tech sub-tabs like
  page-2 dispatch tabs; (2) page 2 disable (not remove) Parts / Parts+Labour / Labour Only seg buttons;
  (3) remove the top filters-strip collapse button; (4) remove now-unused `railOpen`; re-add the `All`
  seg tab (was dropped); (5) equalize the 3 tab heights across pages 1&2, shrink main-tab↔sub-tab gap
  (equal spacing), fix page-1 chart shrinking on first All→Field/Tech switch; (6) round the main tabs'
  bottom corners; (7) Publish page — remove SR/Disp allocation views, move Export + "Back to Step 2"
  into a right-side panel beside the table (control-panel style, per attached mock w/ filename override);
  (8) shrink the export label + "Saves as" + info-line fonts, force the info line onto a single line.
- **Done:**
  - Seg tabs on page 1: `AsuView.jsx` renders a `.segbar` with `['All','Field','Tech']` (local `asuSeg`
    state, default `All`). **Visual/selection only** — page-1 has no field/tech data split, so no data
    wiring (noted to user). Step-1 label in `App.jsx` → "Adjust NCs, APOS renewals" (dropped `driver` sub).
  - `RateView.jsx` seg buttons: `disabled={i>0}` → only `All` clickable on Disp (SR already has just `All`).
    Kept in DOM (not removed).
  - `FilterRail.jsx`: removed the `.frail-toggle` (▴/▾) collapse span; `App.jsx` dropped `railOpen`/
    `setRailOpen`/`onToggleOpen` + the `useState` import; `<FilterRail open={true}/>`.
  - Tab sizing (`btc.css`): `.tab` and `.segt` both `display:inline-flex;align-items:center;
    box-sizing:border-box;height:32px` (were 32 vs 27.2) → equal. `.segbar{margin:0}` (was `12px 0 0`)
    → tabs→segbar gap 24px→12px, matching the stepper/tabs rhythm (12px each). Verified live: tabH=[32],
    segH=[32,32,32], gap=12.
  - **Chart shrink fix** (`BtcChart.jsx`): added a `ResizeObserver` on the `.cw` container →
    `chart.reflow()`. Root cause = Highcharts first-paint sized before layout settled (oversized), and the
    first tab switch reflowed it down. Now SVG stays 892×250 across All↔Field↔Tech. `useEffect`+`cwRef`.
  - Tab corners (`btc.css`): `.tab` border-radius `8px 8px 0 0` → `8px`, removed `border-bottom:none`
    (now a pill, not a folder tab). Verified `8px`.
  - Publish restructure (`PubView.jsx`): removed `AllocationModal` import + `alloc` state + the ⊞ SR/Disp
    allocation buttons. Summary table + a new Export panel now sit in a `.row` (table `.card` flex + Export
    `.card.ctl` 310px). Export panel mirrors the control-panel layout + the attached mock: info box, a
    **FILE NAME** override input (`.ec`, `maxWidth:none` to beat the 78px cap → fills to the card's right
    edge, equal 14.8px gaps both sides), live `Saves as: <name>.csv` preview, `← Back to Step 2`,
    `⤓ Export data`. Store `exportPublished(custom)` now sanitizes an optional name (else `cycleBaseName()`).
  - Font trims (`PubView.jsx`): FILE NAME label + `Saves as` 11px→10px; info line 11px→8px +
    `white-space:nowrap` + `.mb` padding `7px 8px` so it fits one line (measured overflow 0). `AllocationModal.jsx`
    now unused (no importers) — file left in place.
- **Run/verify:** built each round (`npm run build`, green, ~350-420ms, 706 KB JS) and DOM/pixel-verified on
  `:5173`. IMPORTANT: `:5173` is a `vite preview` of `dist` (NOT dev/HMR) — it only reflects changes after a
  rebuild; a stale preview served old CSS until rebuilt. A fresh `vite dev` on `:5199` failed the same way as
  always (`UNLOADABLE_DEPENDENCY … Access is denied` from the `#` in the repo path) — build+preview is the only
  path here. `.claude/launch.json` present locally (uncommitted; dev is broken by `#` anyway).
- **Files:** `src/App.jsx`, `src/btc.css`, `src/components/AsuView.jsx`, `src/components/BtcChart.jsx`,
  `src/components/FilterRail.jsx`, `src/components/PubView.jsx`, `src/components/RateView.jsx`, `src/store/useBtc.js`.
- **Outcome:** all requests in, build green, browser-verified. Pushed to `master-react_v2`.

## 2026-08-31 (cont.) — data cleanup + NC/APOS field/tech split (dataset-side)
- **Asked:** (a) user copied master's `input/` files into `src/data/`; verify + list needed vs not;
  (b) delete the unneeded ones, keep the 2 declines CSVs; (c) split NC + APOS into field/tech —
  "1 new column, values either field or tech", **60% tech / 40% field**; the split must live in the
  **dataset, not the app engine**; chose "regenerate raw dataset (add a real Segment column, 40/60)".
- **Data audit:** only `btc_data.json` is imported ([useBtc.js:7]); declines are upload-only (file-picker →
  `importDeclinesText`, [btcEngine.js]). Deleted `btc_data.js`, `declines_dummy.js`, `btc_raw_dataset.csv`,
  `gen_btc_dataset.py`, `gen_ui_from_csv.py`, `Dummy.xlsx` (all untracked). Kept `declines_dummy.csv` +
  `declines_dummy_alt.csv`. Also deleted dead `AllocationModal.jsx` + `.modal*` CSS (commit `5d6363e`).
- **Pipeline recovered:** the real chain is `btc_raw_dataset.csv → gen_ui_from_csv.py → btc_data.json`
  (NOT gen_btc_dataset.py, which reads an unavailable xlsx and emits a different schema). Restored the CSV +
  `gen_ui_from_csv.py` from `origin/master:template_ui/input/`.
- **Field/tech split (dataset):** `gen_ui_from_csv.py` — added `FIELD_SHARE=0.40`/`TECH_SHARE=0.60`; per LOB it
  now emits `nc_field/nc_tech/apos_field/apos_tech` (field=round(40%), tech=remainder → field+tech==total
  exactly). Also writes `btc_raw_dataset_segmented.csv`: a real **Segment** column, each source row split into a
  Tech row (60% of New Contract + APOS Renewal, other measures intact) + a Field row (40%, other measures
  zeroed so aggregation never double-counts). Regenerated `btc_data.json` (8 LOBs, 312 wks, 14,976 seg rows).
  Verified FY27 nc split == 0.400/0.600, sums exact.
- **App wiring (minimal — reads data, no ratio math in code):** engine `state.ASU_SEG` ('all'|'field'|'tech');
  `computeAsuRows(ncSrc,apSrc,ncKey,apKey)` now optional (defaults = full nc/apos → Publish/SR/Disp untouched);
  `computeAsuView` picks `TL.nc_field/nc_tech`(+apos) by `ASU_SEG`, returns `seg`/`segLabel`; `aggLob` sums the 4
  new arrays (SC cache-safe via distinct keys); `setAsuSeg` action. `AsuView.jsx`: All/Field/Tech segbar now
  store-driven (was local visual-only) + a new **Segment** column in the table. ASU level stays full (only
  NC/APOS split, as asked).
- **Verified live** (`vite preview` :5175): NC row All 22,065 = Field 8,825 + Tech 13,240 (40.0/60.0);
  APOS 4,946 = 1,977 + 2,969; NC KPI 4,613,383 = 1,845,342 + 2,768,041; ASU Actuals constant 5,424,914 across
  tabs; Segment column shows the active label. Build green (743 KB JS); smoke 17/17.
- **Files:** `src/data/gen_ui_from_csv.py` (restored+edited), `src/data/btc_raw_dataset.csv` (restored),
  `src/data/btc_raw_dataset_segmented.csv` (new), `src/data/btc_data.json` (regenerated), `src/engine/btcEngine.js`,
  `src/store/useBtc.js`, `src/components/AsuView.jsx`.
- **Note:** rebuild required for `:5173`/preview to reflect data changes (`#`-path still blocks `vite dev`).
- **Outcome:** field/tech split lives in the dataset; app reads it per tab. Pushed to `master-react_v2`.

## 2026-08-31 (cont.) — ASU redefined as NC + APOS − Declines (page-1 display)
- **Asked:** ASU must equal NC + APOS − Declines, strictly; and importing declines must affect Adjusted ASU.
- **Root cause:** the KPI/panel "Adjusted ASU" used the engine's installed-base recursion (`t.adj` =
  base + ncCum + renCum − declCum, ~6.36M scale). Declines DID reduce it (engine test: 6,355,461→5,202,192),
  but on the installed-base scale, inconsistent with the new ASU-Actuals = nc+apos−decl. The installed-base ASU
  is load-bearing for SR/Disp/Publish (dispatches = ASU × rate), so it stays in the engine — only page-1
  DISPLAYS switch to the nc+apos−decl basis.
- **Done (AsuView only):** added `asuActuals = t.nc+t.apos−t.decl`, `asuAdjusted = t.adjNew+t.btcApos−t.decl`,
  `asuDelta`. ASU Actuals KPI, Adjusted ASU KPI, panel Base/Adjusted/Delta, and the chart ASU-Actuals line all
  use this basis; the table "Adj ASU" column is now DERIVED (`adjNew+btcApos−decl`, non-editable — the old
  direct-`aa` edit is dropped from page 1; engine `adj`/Publish untouched). Panel heading → "ASU (NC + APOS −
  Declines)".
- **Verified:** node — no declines: actuals==adjusted==5,158,979; with declines_dummy.csv: both 3,620,423
  (−1,538,556). Browser — injected 300,000 forecast declines → ASU Actuals & Adjusted ASU both 5,158,979→
  4,858,979. Build green; smoke 17/17.
- **Files:** `src/components/AsuView.jsx`, `src/engine/btcEngine.js` (chart ASU line only).
- **Note:** SR/Disp/Publish still use the installed-base ASU driver (unchanged); only page-1 ASU displays use
  the nc+apos−decl identity.
- **Outcome:** ASU = NC + APOS − Declines on page 1; declines now visibly move adjusted ASU. Pushed to `master-react_v2`.

## 2026-08-31 (cont.) — declines field/tech split moved INTO the files
- **Asked (blunt):** the field/tech split must live in the declines FILES (portable to another device), not be
  computed in the engine. Update both declines CSVs with the 40/60 split.
- **Done:** rewrote `declines_dummy.csv` + `declines_dummy_alt.csv` to `FW,Declines,Segment` — each source week
  now has a Tech row (60%) + Field row (40%); total = field+tech. Importer `importDeclinesText` now READS the
  Declines column (2nd) + Segment column (3rd) and stores `state.DECL_SEG={field,tech}` alongside the total
  `DECL_VALS`. `computeAsuView` field/tech uses the file's `DECL_SEG` values directly (no ratio math); the old
  runtime nc-fraction split remains only as a fallback for a Segment-less file. `removeDeclines` + state init
  updated for `DECL_SEG`. Parser stays backward-compatible with old 2-column files.
- **Verified:** both files parse (624 rows each); declines_dummy all 1,538,556 = field 615,426 (40.0%) + tech
  923,130; alt all 2,932,345 = 1,172,939 + 1,759,406. Build green; smoke 17/17.
- **Files:** `src/data/declines_dummy.csv`, `src/data/declines_dummy_alt.csv`, `src/engine/btcEngine.js`.
- **Outcome:** declines field/tech split is now data-resident (in the CSVs); the app reads it. Pushed to `master-react_v2`.

## 2026-09-01 — GitHub Pages was serving a blank page; fixed the build+deploy pipeline
- **Asked (different session/tool - Claude Code, working from `IMP_DOCS/` on `master`/`master_html`):**
  owner had pointed the repo's live GitHub Pages ("Deploy from a branch") at `master-react_v2`, expecting to
  see this app live at `https://aabh-ai.github.io/SIMULATION_Example/` - it rendered blank for every visitor.
  Asked to check this branch's `imp_docs/`, diagnose, and make it properly deployable.
- **Root cause (confirmed, not guessed):** this branch had no `dist/` (never built for production) and no
  `.github/workflows/` (nothing ever built it). "Deploy from a branch" serves raw files as-is - it never runs
  `npm install && npm run build`. It was serving the raw source `index.html`, whose `<script type="module"
  src="/src/main.jsx">` is unbuilt JSX a browser can't execute, and the absolute `/` paths would 404 under
  the Pages project-site subpath even if it were built. `vite.config.js` had no `base` set (default `/`).
- **Done:**
  - `vite.config.js`: `base: './'` - relative paths so assets resolve under `/SIMULATION_Example/` (or any
    subpath) regardless of repo name.
  - `.github/workflows/deploy-react-pages.yml` (new) - on push to `master-react_v2`: `npm ci` → `npm run
    build` → `actions/upload-pages-artifact` (path `./dist`) → `actions/deploy-pages`. Nothing is committed
    back to the branch - `dist/` stays gitignored, matching this branch's own convention.
  - Requires the repo's Pages **Source** setting changed from "Deploy from a branch" to "GitHub Actions" for
    the workflow to actually take effect - flagged to the owner as the one live/shared-system step needing
    explicit sign-off before doing it, same as the push itself.
- **Verified:** `npm ci && npm run build` locally - green (743 KB JS, matches this doc's earlier bundle-size
  note), `dist/index.html` confirmed relative (`./assets/...`). Served `dist/` via `vite preview` on :5199 and
  browser-verified live: full render (header, filter bar, 3-step stepper, ASUs/SRs/Dispatches views, KPI
  cards, chart, table), stepper navigation and a filter dropdown both interactive, zero console errors (one
  benign Highcharts accessibility-module warning, not an error).
- **Files:** `vite.config.js`, `.github/workflows/deploy-react-pages.yml` (new). No app source/logic touched.
- **Outcome:** build+deploy pipeline fixed and verified working end-to-end locally. NOT yet pushed - owner
  confirmation pending on the push itself and on flipping the Pages Source setting (both are live/shared-repo
  actions the other session's own standing rules and this project's git-workflow conventions call for
  explicit sign-off on).

## 2026-09-01 (follow-up, same session) — Owner confirmed; pushed, flipped Pages Source, hit a deploy race, fixed
- **Owner confirmed both asks:** push commit `b6850be` to `origin/master-react_v2`, and flip the repo's Pages
  Source from "Deploy from a branch" to "GitHub Actions" (`gh api -X PUT .../pages -f build_type=workflow`).
  Re-fetched `origin/master-react_v2` first - no concurrent commits, safe to push.
- **Pushed and flipped the setting.** The push auto-triggered the new `deploy-react-pages.yml` workflow, which
  completed green (build + deploy jobs both ✓). Site was still blank on first browser check.
- **Second root cause found (not assumed - confirmed via `gh run list` timestamps):** GitHub's own legacy
  "pages build and deployment" workflow (auto-attached while Source was still "Deploy from a branch") fired
  from the same push and raced our new workflow. Ours finished at `07:20:47`; the legacy one finished 7s later
  at `07:20:54` and, being a "deploy from a branch" run, uploaded the raw unbuilt branch tree - overwriting
  our correct `dist/` artifact. `curl` confirmed the live HTML had reverted to `<script src="/src/main.jsx">`
  (the exact original bug) even though our workflow run showed all-green.
- **Fix:** no code change needed - `build_type` was already `"workflow"` by the time this was diagnosed, so
  the legacy runner won't fire on future pushes. Re-triggered `deploy-react-pages.yml` manually via
  `gh workflow run ... --ref master-react_v2` (uses the `workflow_dispatch` trigger already in the workflow
  file). This run completed alone, no legacy run alongside it.
- **Verified live, twice:** `curl` of `https://aabh-ai.github.io/SIMULATION_Example/` now returns the built
  HTML (`./assets/index-*.js`, `./assets/index-*.css`, relative paths). Real-browser check (fresh fetch,
  cache-busted, post-reload) confirms full render - header, filter bar, 3-step stepper, KPI cards, Highcharts
  chart, data table, Controls panel - zero failed requests, zero console errors (one benign Highcharts a11y
  warning only).
- **Outcome:** live at `https://aabh-ai.github.io/SIMULATION_Example/`, fully working, confirmed end-to-end.
  Watch point for later: any *other* future push to this branch made while Source briefly reads as
  "branch"-mode (e.g. right after a Settings revert) could reintroduce this exact race - the fix is
  structural (Source now pinned to "workflow"), not a one-off patch, so this shouldn't recur under normal use.

## 2026-09-02 (follow-up) — Site only showed the BTC app; added a landing page with the other 2 tools
- **Asked:** owner reported the deployed site "is showing only BTC ui not the other UI... we have to show
  all the 3 tabs and it opens their respective tabs normally what was in previous branch." Initially
  scoped this as "port the entire BPA_FORCASTING_MOCK.HTML dashboard to React" (owner said "port the other
  UI too" when first asked) and started planning that as a multi-phase migration - but the owner's
  follow-up message clarified the actual ask was much narrower: restore the 3-card entry point that
  `master`'s `index.html` has (BTC Adjustments / TET BPA Forecasting Suite / What-If Simulation), "opens
  normally" meaning real navigation like the previous branch, not a full React port of the forecasting
  dashboard. Correctly re-scoped down before writing the large migration - avoided a lot of wasted work.
- **Root cause:** this branch's `index.html`/`main.jsx` always rendered the BTC app directly as the app
  root - there was never a home page, so the deployed site could only ever show BTC, matching its own
  documented scope ("porting `template_ui/btc_adjustment_simulator_v2.html`... only" per `00_START_HERE.md`).
  Nothing was broken; the other 2 tools were simply never wired up on this branch.
- **Done:**
  - `src/App.jsx` rewritten as a thin shell holding `view` state (`'home' | 'btc'`); old `App.jsx` content
    moved verbatim to `src/BtcApp.jsx` (added an optional `onHome` prop -> "<- Home" button in its header,
    no other internal changes).
  - `src/Landing.jsx` + `src/landing.css` (new) - 3-card home page matching `master`'s `index.html` design
    and copy exactly (same teal/blue/purple accents, same card text). "BTC Adjustments" card is a `<button>`
    that flips `view` to `'btc'` (in-app, no page reload) rather than linking to the old standalone HTML.
  - `public/BPA_FORCASTING_MOCK.HTML` and `public/template_ui/btc_adjustment_simulator_v2.html` (new,
    copied verbatim from `master` via `git show`) - the "Forecasting Suite" card is a plain `<a href>` to
    the static copy, served as-is by Vite's `public/` passthrough; this preserves the static file's own
    internal BTC link too. No React port attempted for this file in this pass - out of scope for what was
    asked; flagged as a much larger follow-on task if ever wanted.
  - `index.html` `<title>` changed to "TET BPA - Business Planning and Analytics" (was "BTC Adjustment
    Simulator", stale now that BTC isn't the only destination).
  - "What-If Simulation" card left disabled/"Coming soon", matching `master`'s own placeholder state -
    not built, since it isn't built there either.
- **Verified:** `npm run build` green; `dist/` confirmed to contain both static HTML files at the right
  paths; local `vite preview` + live-browser check (2 passes, first hit a session rate-limit mid-run and
  was retried) confirmed: landing page renders all 3 cards correctly, BTC card switches view in-place with
  zero console errors, Home button returns to landing, Forecasting Suite card does a real navigation to
  the static file which renders (one transient, non-reproducible 404 on first load only, looked like a
  stray favicon request, not caused by this change). Pushed (`e9aa827`), GitHub Actions workflow ran alone
  (no legacy-runner race this time, confirming the Pages Source fix from the prior entry holds), and the
  live site was re-verified via `curl` (title + both static routes return 200).
- **Files:** `src/App.jsx` (rewritten), `src/BtcApp.jsx` (new, moved), `src/Landing.jsx` (new),
  `src/landing.css` (new), `public/BPA_FORCASTING_MOCK.HTML` (new), `public/template_ui/` (new),
  `index.html` (title only).
- **Outcome:** live at `https://aabh-ai.github.io/SIMULATION_Example/` - all 3 primary tools reachable
  from a home page, each opening the way it did on `master`. Full React port of
  `BPA_FORCASTING_MOCK.HTML`'s 5-module dashboard remains undone and unstarted; revisit as its own project
  if wanted (a research pass sized it at roughly the same effort as the original BTC migration, dominated
  by the ~1200-line "Forecast Copilot" sub-module).

## 2026-09-04 — sliders 0–150 + S-curve adjustments + declines baked into dataset
- **Asked (3):** (1) adjustment sliders 60–150 → 0–150 (verify non-breakage); (2) forecast line adjustment should
  move in an S-curve (as it was once) — all values; (3) add declines to the main dataset + remove the "Import
  declines" option. Clarified: S-curve shape = **true smoothstep** (3t²−2t³); declines source = **declines_dummy.csv**.
- **Investigation:** history — v1 html (`master/template_ui/btc_adjustment_simulator.html:547`) DID ramp via
  `v*(1+(p/100)*ramp(i-fc,N))`, `ramp=pow(x,8)`; v2 html + the React port switched to FLAT uniform %. `ramp()` was
  defined-but-unused in the port. So "as it was once" = restore a ramp; chose smoothstep over pow-8 per user.
- **Done:**
  - (1) `clampM` 60→0; `AsuView` `Slider` default `min` 60→0; `RateView` seg slider min 60→0. Verified 0 accepted.
  - (2) Added `scurve(t)`=t²(3−2t) + `scurveAt(k,len)`; applied `eff=1+(mult−1)*scurveAt(i−fc,N−fc)` in
    `computeAsuRows` (NC+APOS) and `bendSeg` (SR/Disp). Verified @ncMod=150: ratio 1.000→1.257→1.500 (slow-fast-slow,
    full at horizon). Changes P5 CSV byte baseline (intentional).
  - (3) `gen_ui_from_csv.py` bakes `declines_dummy.csv` → `payload.declines{total,field,tech}` (short-fw→full-fw
    normalized via `opts.week`; first pass had 0 overlap because data uses '2022-W01' vs file '22-W01' — fixed).
    `boot()` loads declines (always-on `DECL_IMPORTED`); `asuReset` keeps them; removed Import/Remove UI +
    `onFile`/`useRef`, engine `importDeclinesText`/`removeDeclines`, store wraps. Dropped `DECL_IMPORTED` from the
    adjusted-reveal trigger (fixed a smoke FAIL — declines alone no longer force "adjusted" since they hit both sides).
    Verified: ASU Actuals 3,620,423 = 4,613,383 + 545,596 − 1,538,556.
- **Verify:** `npm run build` green; smoke 17/17; browser (`vite preview` :5188) — no import buttons, Declines KPI
  1,538,556, sliders min=0, s-curve ramp confirmed via engine dump, zero console errors.
- **Files:** `src/engine/btcEngine.js`, `src/components/AsuView.jsx`, `src/components/RateView.jsx`,
  `src/store/useBtc.js`, `src/data/gen_ui_from_csv.py`, `src/data/btc_data.json` (regenerated).
- **Outcome:** all 3 in + verified. Not committed (left to user).

## 2026-09-04 (cont.) — neutral=0 sliders + reset-btn reposition + segment-aware ASU AOP
- **Asked (4):** (1) sliders default start at 0; adjustments move 0→150 (clarified: 0 = neutral, uplift-only,
  mult = 1 + value/100 → 150 = 2.5×; loses decrease); (2) move table reset button right — right edge aligned with
  chart expand button, lower edge aligned with the start of the table's value rows; (3) ASU Field/Tech AOP targets
  lowered to their values' averages; (4) SR/Disp AOP targets NOT averaged.
- **Done:**
  - (1) neutral flipped 100→0 across engine: `ncMod`/`apMod` init 0, `segModsOf`/`segReset`/`compositeMod`,
    `clampM` NaN→0, `bendSeg`+`computeAsuRows` mult=`1+value/100`, detection `!==100`→`!==0` (computeAsuView,
    computePubView). Verified NC=150 ratio 1.00→1.77→2.50.
  - (2) `.tblreset` `top:16px;right:6px` → `top:-3px;right:-5px`; verified right 1090≈expand 1091, bottom==values top.
  - (3) `asuSegKeys()` + seg-aware `autoAop('asu')`/`aopSliderMax('asu')`. Verified All 64249 = Field 25699 (.400)
    + Tech 38550 (.600).
  - (4) SR/Disp branch untouched (gated on kind==='asu'). Verified SR AOP 6735 full.
- **Smoke fix:** the "neutral → adj balance == base" assertion was silently invalid since last round's declines
  fw-key fix (baked declines make neutral adj = base − declines; it only passed earlier when keys had 0 overlap).
  Rewrote it to "adjNew==nc & btcApos==apos on every forecast week". Now genuinely 17/17.
- **Files:** `src/engine/btcEngine.js`, `src/btc.css`, `scripts/smoke.mjs`.
- **Verify:** build green; smoke 17/17; browser (`vite preview` :5188, viewport 1440) — all 4 confirmed, zero console errors.
- **Outcome:** all 4 in + verified. Not committed.

## 2026-09-04 (cont.) — SR/Disp AOP default → average of own series
- **Asked:** "why no change in sr/dispatch aop?" then "make aop target the average". Clarified that ALL AOP targets
  were already weekly averages, but SR/Disp used `rate × avg-ASU` (not the average of the SR/Disp values themselves,
  unlike ASU AOP = avg NC+APOS). User wants SR/Disp AOP = the average of their own values. Also answered "wtf is
  target rate?" — the SMOD/MDR (Disp) & ICR (SR) lever that expresses the AOP target as a ratio to ASU (rate × ASU).
- **Done:** `autoAop` else-branch (sr/disp) — DEFAULT (no `TGT_OVR`) now returns avg weekly `seriesOf(kind)×segWeight`;
  the target-rate override path (`mo != null` → `rate × avg-ASU`) kept unchanged so the SMOD/ICR box still works.
- **Verified:** SR autoAop 7321 == avg weekly SR; Disp 4104 == avg weekly Disp (both match; were 6735 rate-based).
  Build green; smoke 17/17.
- **Files:** `src/engine/btcEngine.js`.
- **Outcome:** SR/Disp AOP default is now the average of their own series (target-rate override intact). Not committed.
