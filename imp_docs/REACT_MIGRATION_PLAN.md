# React Migration Plan — btc_adjustment_simulator_v2

Source: `template_ui/btc_adjustment_simulator_v2.html` (single file, 2260 lines).
Goal: port to React base, no behavior loss.

---

## 1. What the file is (facts)

- 1 HTML file. Inline `<style>` (~283 lines), inline `<script>` (~1790 lines JS).
- ~178 functions, all sharing **global mutable vars** — no modules, no classes.
- 88 inline `on*` handlers in markup (`onclick`, `oninput`, `onchange`, `onfocus`).
- 24 `.innerHTML` writes, 100 `getElementById`/`querySelector` — manual DOM.
- Charts: Highcharts 11.4.8 via cdnjs. **1** chart factory (`Highcharts.chart`, line 1042), reused for all charts. 6 in-place `.update/.setData` calls.
- Data: `window.BTC_DATA` + `window.BTC_DECLINES` injected by `<script src="input/btc_data.js">` + `input/declines_dummy.js`. `boot(window.BTC_DATA)` at line 2253.
- Persistence: localStorage (theme, pass counter fallback). File System Access API for real export.
- 4 views (ASU / SR / Disp / Publish), 3-step stepper, filter rail, allocation modal, chart expand overlay.

### Global state to migrate (line 476+)
```
BTC, TL, ASU_ROWS, OVR{disp,sr,asu}, TGT_OVR{disp,sr}, AOP_OVR{disp,sr,asu},
DECL_IMPORTED, DECL_FILE, DECL_VALS, PASS_COUNT, CMT{disp,sr,asu,pub},
DISP{...cfg}, SR{...cfg}   // per-metric element-id config objects
_outDir, _cmPop   // DOM/handle singletons
```

---

## 2. Dependencies

| Need | Package | Note |
|------|---------|------|
| Build | `vite` + `@vitejs/plugin-react` | no build system today |
| Runtime | `react`, `react-dom` | |
| Charts | `highcharts`, `highcharts-react-official` | replace cdnjs `<script>` |
| Store | `zustand` (recommended) OR Context+useReducer | see §4 |
| Fonts | Plus Jakarta Sans + IBM Plex Mono | keep Google Fonts `<link>` |

No backend. No router lib needed (tabs = state).

---

## 3. Overhauls required (ranked by size)

1. **State untangle (biggest).** 178 fns mutate globals directly. React forbid. Every fn reads/writes a store. This is bulk of effort.
2. **Markup → JSX.** 4 views + controls + tables + KPIs. 88 inline handlers → JSX props. `.innerHTML` table/KPI builders → `.map()` rows.
3. **Charts → component.** vanilla Highcharts → `<HighchartsReact>`; in-place `.update('none')` pattern → options from props + `immutable={false}`.
4. **Data load.** globals from `<script src>` → `import btcData from './input/btc_data.js'` (convert files to ES exports) or fetch JSON.
5. **CSS.** inline `<style>` → `styles.css` (near copy-paste) or CSS module. `data-theme` toggle → class on root from state.
6. **Side-effect features.** export (FS Access + Blob fallback), pass counter, contenteditable label, localStorage, resize listeners → `useEffect` / handlers.

---

## 4. State design

Use **Zustand** — flat mutable-feeling store, least refactor from current globals. One store:
```
useBtc = { btc, tl, asuRows, ovr, tgtOvr, aopOvr, decl{imported,vals,file},
           passCount, cmt, activeTab, step, theme, railOpen, expanded, modal,
           + actions: setOverride, setTarget, setAop, importDeclines, reset*, go, setStep, ... }
```
Compute-derived values (adjusted series, gaps, KPIs) = selectors / plain fns reading store, NOT stored. Keeps single source of truth.

Context+useReducer works too but more boilerplate for this many actions.

---

## 5. Roadblocks + fixes

| # | Roadblock | Why | Fix |
|---|-----------|-----|-----|
| R1 | **File System Access API** (`window.showDirectoryPicker`, `getFileHandle`, `createWritable`, lines 1977-1982) | Chromium-only, secure-context-only. Writes exports to `outputs/` + derives Pass# from folder file count. Breaks on Firefox/Safari/`file://`. | Keep as-is (already has Blob-download fallback, line 1986). Feature-detect `window.showDirectoryPicker`. Do NOT block build on it. Under Vite dev = `http://localhost` = secure context, works. |
| R2 | **Pass counter reads a directory** (`syncPassFromDir`) | async, depends on R1 handle | Port verbatim into an async store action. localStorage cleared-on-boot behavior must survive (`persistPass`). |
| R3 | **Chart re-render churn** | React re-render + Highcharts destroy/recreate = flicker + canvas corruption (documented failure mode) | Use `highcharts-react-official` with `immutable={false}`; pass new `options` obj, let it call `chart.update`. Memo options. Never key-remount chart on every state change. |
| R4 | **Global mutable state read mid-function** | many fns read `OVR`/`TL` directly, not via params | Move ALL to store; fns become `const s = useBtc.getState()` (outside render) or hooks (in render). Audit each of 178 fns. |
| R5 | **Inline `<script src>` data as globals** | React has no `window.BTC_DATA` at mount | Convert `input/*.js` to ES modules (`export default {...}`) OR fetch JSON in a load effect + gate render on ready. Preserve `loadFail()` error UI. |
| R6 | **contenteditable + `execCommand('insertText')`** (line 1960) | deprecated API, React controls DOM | Keep uncontrolled: `ref` + `onInput`, `suppressContentEditableWarning`. Or swap to plain input styled as label. Export filename follows this label — keep wired. |
| R7 | **88 inline handlers** | `onclick="go('asu')"` string handlers gone in JSX | Mechanical rename → `onClick={()=>go('asu')}`. Watch `this` uses in `clampBox(this,fn)` — pass element via event.target/ref. |
| R8 | **Manual positioning code** (`cmtPos`, `positionTblResets`, floating popover on `<body>`, `_cmPop`) | reads live `getBoundingClientRect`, appends to body | Port to a portal (`createPortal`) + effect that measures on open. Keep resize listeners as `useEffect` cleanup. |
| R9 | **Chart expand overlay** mutates `body.classList` (`expanding`, `rail-open`, `on-pub`) | React should own class list | Drive body classes from store via one effect; don't `classList.add` scattered. |
| R10 | **Theme** = `body[data-theme="dark"]` + localStorage | | store `theme`, effect sets `document.body.dataset.theme`, read localStorage on init. |
| R11 | **Init order / boot** (`boot()` at end, resize listeners) | script runs top-to-bottom today | Single mount effect: load data → boot → render. Gate on `btc` ready. |
| R12 | **`table-layout:fixed` + per-renderer explicit `<th>` px widths** | layout tuned in CSS comments | Copy CSS verbatim, don't "clean up". Many comments = load-bearing fixes. |

---

## 6. What can go wrong (failure modes)

- **Chart flicker/corruption** if remounting on state change → R3.
- **Stale closures** — handlers capturing old store snapshot. Use Zustand selectors or `getState()` in callbacks, not captured vars.
- **Lost CSS tuning** — the file has many hand-fixed layout comments (baseline align, popover clamp, fixed table widths). Rewriting CSS = regressions. Copy, don't refactor.
- **Export breaks silently** on non-Chromium — already handled by fallback, but test both paths.
- **Filter rail / modal / overlay z-index + margin coupling** (`body.rail-open .wrap{margin-right:252px}`) — keep the body-class contract.
- **Number formatting** — Indian comma format (`toLocaleString('en-IN')`) must survive.
- **`file://` open** — current file works offline via `<script src>`. React build needs a server (or `vite build` + static host). Note behavior change for anyone opening raw file.

---

## 7. Phased plan

**P0 — Scaffold (0.5d)**
- `npm create vite@latest btc-react -- --template react`; add deps (§2).
- Move `input/btc_data.js`, `input/declines_dummy.js` → `src/data/` as ES exports.
- Copy inline `<style>` → `src/styles.css`, import once. Fonts `<link>` in `index.html`.

**P1 — Store (1d)**
- Build Zustand store: all globals (§4) + actions. Port pure compute fns (`wiCompute`-style, gap/KPI/adjusted-series math) unchanged — they're just functions.
- Port export + `syncPassFromDir` + theme as store actions/effects (R1,R2,R10).

**P2 — ASU view (0.5d, proof)**
- Components: `<AsuView>` → `<ChartCard>` + `<ControlsCard>` + `<DataTable>`.
- Wire Highcharts via `highcharts-react-official` (R3). Verify slider→chart→table in-place update, no flicker.

**P3 — Remaining views (1d)**
- SR, Disp (share config objects `SR`/`DISP` → props), Publish (multi-chart grid + export).
- Stepper, tab router, sequence-gate lock logic.

**P4 — Chrome + extras (0.5d)**
- Filter rail, allocation modal, expand overlay (R8,R9), comment popover portal, contenteditable label (R6).

**P5 — Verify (0.5d)**
- Side-by-side vs original: every slider, override, target, decline import, export (both paths), theme, dark mode, pass counter.

**Est: ~4 days.** State untangle (P1) + CSS-fidelity are the risk.

---

## 8. Recommended first move

Scaffold P0 + port ASU view (P2) as a vertical slice — proves store + chart pattern before committing to all 4 views. If chart update pattern (R3) holds, rest is mechanical.

---

## 9. Status + verification (2026-08-31)

**Port complete.** App lives in `btc_react_simulator/app/` (Vite + React 19 + Zustand + Highcharts).
Phases P0–P5 done. `npm run build` clean; `npm run lint` (oxlint) clean.

### P5 — side-by-side parity vs original (`template_ui/btc_adjustment_simulator_v2.html`)
Both run live (React `:5173`, original served on `:8899`), driven through the browser and compared.

| Area | Result |
|------|--------|
| Data source | `src/data/btc_data.json` **byte-identical** to `template_ui/input/btc_data.json` (173,025 B). |
| ASU table (step 1) | All 104 weeks identical (W01 `5,424,914\|22,065\|4,946` … W52 `6,355,461\|172,347\|6,303`). |
| Driver compute | NC% 100→120 → Adjusted ASU **6,970,017**, Delta **+614,556** in both. |
| SR table (step 2) | Full-table checksum identical (all 104 wks). |
| Disp table (step 2) | Full-table checksum identical (all 104 wks). |
| Publish (step 3) | Base identical; edited `NC_Adj=60000` → `60,000\|4,840\|5,359,531\|6,547\|3,969\|Add a note…` identical both apps. |
| Reactivity (R3) | In-place chart update, no flicker, no canvas error. |
| Theme (R10) | Dark ↔ light toggle works. |
| Stepper + tab gating | 1→2→3 advance; tabs gate per step (step1 ASUs, step2 SRs+Dispatches, step3 Publish). |
| Export + Pass# (R1/R2) | Pass 1→2 on export; FS Access path is Chromium/secure-ctx only → Blob fallback verified. |
| Decline import (R5) | CSV/TXT parsed → Declines KPI + table column + Remove button. |
| Allocation modal | Opens (Region / Core-Upsell / Service breakdown), closes clean. |
| Comment popover (R6/R8) | Click→edit→Enter saves→persists→reopen shows note (body portal). |
| Console errors | **Zero** across the whole interaction sweep (original emits one benign 404). |

**Gotcha for future testers:** React commits edits on `focusout`, not a raw `blur` event — synthetic
`new Event('blur')` will not trigger the commit and looks like a "stale value" bug. Fire `focusout`
(or a real click-away / Enter). Also keep localStorage clean between comparisons (`localStorage.clear()`
+ reload) — residual overrides made two early comparisons diverge before the state was reset.

### Not automatable (verify manually once)
- **Export file-write to `outputs/`** via `showDirectoryPicker` — needs a real user gesture + secure
  context; only the Blob fallback + Pass bump were exercised headlessly.

### Intentional deviations (not defects)
- **AOP slider bound**: cap = `1.5 × peak weekly value`, min `0` (original used a narrower fixed band).
  Documented in `btcEngine.js` (`aopSliderMax`). Same target value within the overlapping range.

### Remaining (non-code)
- Repo not yet under git — connect `D:\Repos\SIMULATION_Example` to remote `AABH-AI/SIMULATION_Example`
  and check out `hn-new` before committing (untracked-file collision risk — confirm approach first).
- Bundle is one ~706 kB chunk (Highcharts); code-splitting optional.
