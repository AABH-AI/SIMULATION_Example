# BTC Adjustment Simulator — React

React + Vite port of `template_ui/btc_adjustment_simulator_v2.html` (single-file, ~2260 lines).
Faithful behavior port: same seeded data, same math, same 3-step flow. Verified against the
original side-by-side (see `../imp_docs/REACT_MIGRATION_PLAN.md`, §9 Verification).

## Run

```bash
npm install
npm run dev      # Vite dev server (http://localhost:5173)
npm run build    # production build → dist/
npm run preview  # serve the build
npm run lint     # oxlint (clean)
```

## Architecture

| Layer | File | Role |
|-------|------|------|
| Engine | `src/engine/btcEngine.js` | Faithful port of the original's math + mutable state (the single source of truth). Pure `compute*()` functions; no React. |
| Store | `src/store/useBtc.js` | Thin Zustand layer. Holds a `version` counter; every mutation bumps it so components re-read `compute*()`. `wrap(fn)` runs an engine mutation then bumps. |
| Charts | `src/components/BtcChart.jsx` + `src/engine/chartOptions.js` | `highcharts-react-official`, in-place update (`immutable={false}`) — no destroy/recreate, no flicker. |
| Views | `App.jsx` → `AsuView` (step 1) · `RateView` (step 2, `kind='sr'\|'disp'`) · `PubView` (step 3) | Tabs gate by step. `FilterRail`, `Kpi`, `CommentCell`, `ExpandableCard`, `AllocationModal`. |
| Data | `src/data/btc_data.json` | Byte-identical to `template_ui/input/btc_data.json`. |

### State model
Engine owns the real state (`state.OVR`, `state.TL`, `ncMod`, `apMod`, `DECL_VALS`, `CMT`, …).
The store exposes only `version` + wrapped action creators. Components select `version` to
subscribe, then call `useBtc.getState().computeXxxView()` for derived data. Derived values are
never stored — single source of truth stays in the engine.

### Editing → recompute
Table cells are **uncontrolled** inputs keyed by `...+version` and commit on **`onBlur`**
(React listens for `focusout`). A commit calls `editAsu` / `editRate`, which bumps `version`,
remounts the row inputs, and re-reads the recomputed value. Enter blurs to commit.

## Notes / known deltas from the original
- **AOP slider bound** is intentionally redesigned: cap = `1.5 × peak weekly value` of the page's
  own metric, min `0` (original used a narrower fixed band). Same target value within overlap.
- **Export** (`exportPublished`): File System Access API writes a timestamped CSV into a picked
  `outputs/` folder and derives Pass# from the folder's CSV count (Chromium + secure context only);
  otherwise falls back to a Blob download + in-session Pass bump. Feature-detected — never blocks.
- Bundle is a single ~706 kB chunk (Highcharts). Code-splitting not applied (optional).

## Not a git repo yet
`D:\Repos\SIMULATION_Example` has no `.git`. Work belongs on branch `hn-new`
(remote `AABH-AI/SIMULATION_Example`); connect before committing — see the migration plan §git.
