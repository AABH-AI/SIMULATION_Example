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
