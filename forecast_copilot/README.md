# Forecast Copilot — AI Planning Suite

> Folder-local documentation for the `forecast_copilot/` product.
> This is a **copy** kept inside the folder; the canonical project docs in `../IMP_DOCS/` are left as-is.
> Last updated: 2026-07-20

A standalone, static 6-page suite for **BTC (Bend-the-Curve) forecast planning**. Pure HTML/CSS/JS,
no backend or build step. Light theme (Inter font, teal `#0d9488` accent), charts via Highcharts 11.4.8.
Live on GitHub Pages (served through the repo-root `.nojekyll` file).

Separate product from the ISG BPA dashboards (`../BPA_FORCASTING_MOCK.HTML` etc.) — no shared code with them.

---

## Files

| File | Purpose |
|---|---|
| `fc_engine.js` | **Shared engine — single source of truth.** Loaded by all 6 pages. Edit here once. |
| `Dashboard — Forecast Copilot.html` | Entry point. 9 KPI cards, Forecast vs Target table, ASU/SR/Dispatch trends, Historical BTC trend, activity list |
| `ASU Simulation — Forecast Copilot.html` | Manual Simulation (NC/APOS sliders) + Recommendation Mode (Accept / Modify / Reject) |
| `Historical Performance — Forecast Copilot.html` | 12-quarter BTC / Accuracy / AOP / Modernization trends (0–100% axes), Forecast vs Actual |
| `AI BTC Advisor — Forecast Copilot.html` | 3-strategy BTC comparison table (click-to-select), 6 confidence-driver sliders, manual BTC override |
| `BTC Distribution — Forecast Copilot.html` | Region/Business donuts, LOB/Service h-bars, weekly DS-vs-BTC bars, Weekly Forecast Table, Opportunity Table |
| `Final Forecast — Forecast Copilot.html` | Original/Scenario/BTC/Final/Target chart, Submission Summary, status cards, Approve/Submit |
| `Dispatches_Dummy.xlsx`, `dell_isg,esg_fy24-26.xlsx` | Reference data files — **not wired into the app** (all in-app data is mock/seeded) |

Navigation order (left sidebar): Dashboard → ASU Simulation → Historical → AI BTC Advisor → BTC Distribution → Final Forecast.

---

## Data source: Live vs Simulated (`fc_engine.js` provider — Phase 2)

The engine runs in one of two modes, decided once at load and shown by a fixed
**badge** in the bottom-left corner:

| Mode | When | Data | Badge |
|---|---|---|---|
| **Live** | `serve.py` is running (page served over `http://`) | Real workbook via `GET /api/dataset` | teal "Live data" |
| **Simulated** | No server (e.g. opened from `file://`, or a plain static host) | Seeded generator | amber "Simulated data" |

`fcInitData()` does a **synchronous** `GET /api/dataset` at engine load — because
the engine script runs *before* each page's inline render script, real data is
guaranteed ready before the first `fcCompute()`, so no page needed changing. Any
failure (no server, `file://`, non-2xx) is caught and the engine stays Simulated.
Clicking the badge reloads to re-check (e.g. after starting the server).

**In Live mode:**
- **Filter options are derived from the data's distinct values** (not hardcoded),
  which removes the `AMERICAS`/`Americas`, `PowerEdge`/`Poweredge` reconciliation
  problem — the rail shows exactly what's in the workbook. Two filters are
  remapped/relabelled because the seeded model doesn't match the sheet: **Global
  LOB → Product** (the real `Product` column), and **Product Business → Warranty
  Type** (the sheet has no ESG/ISG/HES column but does have Warranty Type). A
  stored/seeded filter value that isn't a real option is snapped to `All`.
- **Real weekly ASU + Warranty Expirations drive each slice.** For the selected
  quarter + slice, rows are aggregated into the quarter's 13 canonical weeks. The
  Service Dataset is dense on **Product × Region × week** (see *Input data* below),
  so single- and two-dimension drill-downs show a full 13-week trend. For any
  weeks with no matching rows (only deeper 3-plus-filter combos), ASU — a *stock* —
  carries its last observed value forward, and Expirations — a *flow* — is 0.
- **SR / Dispatch stay derived** by ratio (`SR = ASU × 0.185`; Dispatch =
  `SR × serviceRatio`).
- **New Contracts / APOS stay modeled levers** (no such columns exist). They apply
  as the modeled lift *relative to* the default slider position, so at default
  sliders the scenario equals the real baseline and moving a slider adjusts it
  proportionally.
- **Historical BTC / accuracy / AOP remain modeled overlays** in both modes.

Simulated mode is the original seeded engine, unchanged — it is the fallback.

## Architecture: shared engine (`fc_engine.js`)

The engine (`fc_engine v1`) was previously an **identical block copy-pasted into all 6 HTML files**.
It has since been **extracted into `fc_engine.js`** so there is one source of truth.

### Page structure

```html
<head>
  … Highcharts 11.4.8 (CDN) …          <!-- must load first: engine calls Highcharts.setOptions() -->
</head>
<body>
  … page markup …
  <script src="fc_engine.js"></script>  <!-- shared engine -->
  <script> /* page-specific rendering only */ </script>
</body>
```

**Load order is a hard requirement:**
1. Highcharts (CDN, in `<head>`, synchronous)
2. `fc_engine.js` (bottom of `<body>`) — references `Highcharts` at parse time and reads `#theme-toggle-icon` via `fcSyncThemeBtn()`, so it must run after both exist
3. The page-specific inline `<script>` — calls engine globals (`fcCompute`, `fcDrawLineSeries`, `fcWireFilters`, …)

All three are classic (non-module) scripts, so the engine's top-level `const`/`function` are global and visible to the page script.

> **Editing rule:** change engine behaviour in `fc_engine.js` **only**. Do not re-inline it into the HTML files.

### What the engine provides

| Area | Key symbols |
|---|---|
| Cross-page state | `fcState`, `fcLoadState`/`fcSaveState` (localStorage key `fc_state_v1`), `fcSetFilter` |
| Seeded data | `seeded()`, `fcHash`, `fcSeedFor`, factor maps (`FC_REGION_FACTOR`, `FC_LOB_FACTOR`, …) |
| Pipeline | `fcGenerateWeeklySeries` (ASU roll-forward), `fcApplyOverrides`, `fcGenerateHistory` |
| Recommendations | `fcRecommendOverrides`, `fcRecommendBTC` (3 strategies), `fcDistributeWeekly` |
| Master compute | `fcCompute()` — every page calls this |
| Filters UI | `fcWireFilters(onChange)` |
| Charts | `fcDrawLineSeries`, `fcDrawGroupedBars` (Highcharts, cached in `fcHCharts`, 320 ms animated `setData`) |
| Theme | `fcToggleTheme` / `fcApplyTheme` (light/dark, persisted to `fc_theme`) |
| Formatting | `fcN` (K/M), `fcPct` |

### Business pipeline (per selected slice)

```
ASU[w] = ASU[w-1] − Expirations[w] + (APOS[w] × RenewalRate × aposFactor) + (NewContracts[w] × ncFactor)
SR      = ASU × 0.185
Dispatch = SR × service.dispatchRatio
```

Data is deterministic: `fcSeedFor()` hashes the active `region|lob|business|service|quarter` combo, so the same
slice always produces the same numbers and different slices produce different, realistically-scaled ones.

### Cross-page state (`fc_state_v1`)

`fcState` persists to `localStorage` and carries filters, `ncOverride`/`aposOverride`, `simMode`,
`btcStrategy`/`manualBTC`, `distMode`, and `approvals` across pages — a selection made on one page is
already applied when the next page loads.

---

## Filters

Right-hand rail on every page. 10 filters, all wired through `fcWireFilters` → `fcSetFilter` → re-render.

| Filter | `data-filter` | Options |
|---|---|---|
| Fiscal Quarter | `quarter` | `YYYY-Qn` (no "All" — parsed by `fcWeeksForQuarter`) |
| Fiscal Week | `week` | `YYYY-Wnn` (no "All") |
| Region | `region` | **All**, AMERICAS, EMEA, APJ |
| Global LOB | `lob` | **All**, PowerEdge, PowerStore, PowerScale, PowerFlex, VxRail, Avamar, Networking, Insignia |
| Product Business | `business` | **All**, ESG, ISG, HES |
| Service Type | `service` | **All**, Parts Only / Parts + Labour / Labour Only × ESG/ISG |
| Core / Upsell | `coreupsell` | All, Core, Upsell |
| WO Type | `wotype` | All, Break Fix, Part/s dispatch |
| FQM Flag | `fqm` | All, 1, 0 |
| GCFA Type | `gcfa` | All, GCFA, non-GCFA, Unknown |

**"All" semantics:** the aggregate factor is the sum of the dimension's parts (e.g. `FC_REGION_FACTOR.All = 2.65`),
so because the engine is multiplicative, all-`All` equals the total over the full cross-product of slices.

> **Casing note:** the label is `All` everywhere (Region/LOB/Business/Service were previously `ALL` and were
> normalized to `All` to match the other filters). A browser holding an **old** `fc_state_v1` with `'ALL'` will
> miss the factor-map key and fall back to factor `1` for that dimension until the filter is reselected. Fresh
> users are unaffected (defaults are `AMERICAS` / `PowerEdge` / `ESG`, not `All`).

---

## Charts & licensing

- Rendering: **Highcharts 11.4.8** via cdnjs (`cdnjs.cloudflare.com/.../highcharts/11.4.8/highcharts.min.js`).
  Do not switch to `code.highcharts.com` — it 403s requests without a Referer header (breaks `file://`).
- Charts are cached in `fcHCharts` and updated in place (`setData`, 320 ms) rather than recreated.
- **Licensing:** Highcharts is commercially licensed but free for **non-commercial / research** use, which is
  the scope of this suite. A note to that effect is in the header of `fc_engine.js`.

---

## Verification

After any engine edit, load each page in a browser and confirm: 0 console errors, engine loaded
(`typeof fcCompute === 'function'`), and charts render. Expected chart counts:
Dashboard 5 · ASU Simulation 3 · Historical 4 · AI BTC Advisor 0 · BTC Distribution 1 · Final Forecast 1.

---

## Local server & read path (`serve.py`) — Phase 1

`serve.py` is a **zero-dependency** local server (Python 3 standard library only — no `pip install`,
no network). It serves the static suite over `http://` *and* exposes a small JSON API over the
**read-only** input workbook (`input/dell_isg,esg_fy24-26.xlsx`, sheet **Service Dataset**).

```bash
cd forecast_copilot
python serve.py            # -> http://127.0.0.1:8000/  (Ctrl+C to stop)
# options: --port 8000  --host 127.0.0.1  --input <path to .xlsx>
```

| Route | Method | Returns |
|---|---|---|
| `/` | GET | 302 redirect to the Dashboard page |
| `/api/health` | GET | `{status, source, sheet, sha256, rowCount}` |
| `/api/dataset` | GET | `{source, sheet, sha256, columns[], rowCount, rows[], summary{totals,distinct}}` |
| `/api/outputs` | GET | **501** — publish history (Phase 5) |
| `/api/publish` | POST | **501** — write path (Phase 5) |
| any other path | GET | static file from `forecast_copilot/` |

- **Read-only input.** The server never writes to the workbook. Every response echoes the file's
  `sha256`, which `test_dataset.py` pins to `input/INPUT_SHA256.txt`, so "input never mutated" is provable.
- **Parsing.** An `.xlsx` is a zip of XML; the fixed-format Service Dataset sheet is parsed with
  `zipfile` + `xml.etree`. The sheet is found by **name** and columns are mapped by **header label**,
  so the parser survives sheet/column reordering. Categorical values are kept verbatim (no
  `Poweredge→PowerEdge` normalization) — Phase 2 derives filter options from the data's distinct values.
- **Result is cached** in memory (re-parsed only if the file's mtime/size change).

### Test

```bash
cd forecast_copilot
python -m unittest -v          # 8 tests, stdlib only
```

`test_dataset.py` asserts `serve.load_dataset()` reproduces a hand-checked pivot of 12 slice
aggregates (grand total, by-FY, by-Region, and multi-dimension slices), the 8,892-row × 13-column
schema, distinct values, the input sha256, and that Region/FY slices each partition the grand total.
The expected pivot was ground-truthed with an independent regex parse of the workbook.

### Input data (Service Dataset)

`input/dell_isg,esg_fy24-26.xlsx`, sheet **Service Dataset** — **8,892 rows** = 19 products ×
3 regions × 156 weeks (52 × 3 fiscal years), one row per Product × Region × week. Columns: FY,
Fiscal Quarter, Fiscal Week, Product, Region, Warranty Type, ASU, Warranty Expirations,
Core/Upsell, W/O Type, FQM Flag, GCFA Type, Service Type. It is **modeled/dummy demo data**
(the workbook's own sheets are labelled "MODELED ESTIMATES").

This sheet was **densified** from an original 2,964-row sample (one row per Product × week, with a
single rotating region) so that Product + Region drill-downs show full weekly trends instead of
gaps, and **scaled to 10%** so ASU sits at a believable magnitude (the raw sample's units were
unrealistically large — whole-business single-week ~50M, ~8.1B summed over 156 weeks). The scale is
**uniform, so every distribution ratio is preserved** (region mix, product mix, weekly shape); after
scaling, the whole-business single-week installed base is **~5M units** and grand ASU is ~812.66M.
Mechanically: each original (product, week) value is scaled by 0.10 then split across the three
regions by that product's own regional mix via a largest-remainder integer split (Warranty
Expirations scaled + split the same way).

- `densify_service_dataset.py` regenerates it (idempotent) and only rewrites the Service Dataset
  worksheet; the real Dell 10-K sheets (FY26 Official, Product Estimates, …) are left byte-identical.
- `input/dell_isg,esg_fy24-26.source.xlsx` is the pristine pre-densification sample (provenance).
- `input/INPUT_SHA256.txt` pins the sha256 of both the working file and the source.

The **runtime** rule is unchanged: the server never writes to the input. Densification is a
one-time, dev-time refinement of demo data, run deliberately and recorded here.
