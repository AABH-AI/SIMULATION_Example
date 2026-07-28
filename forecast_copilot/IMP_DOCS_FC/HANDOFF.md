# HANDOFF — Forecast Copilot

> Quick-start for a new session or teammate. This is the folder-local handoff for the
> **`forecast_copilot/`** product. Full detail is in `README.md`; the plan is in
> `BUILD_PLAN.md`; the chronological build log is in `PROMPT_TRAIL.md`.
> Last updated: 2026-07-27 (Phases 0–6 complete; filter-rail UI polish — see PROMPT_TRAIL).

---

## What this is

**Forecast Copilot** — a demand-planning demo that turns an immutable input workbook into an
**input → edit → publish** loop:

- **Input** (read-only): a modeled Dell ISG/ESG workbook is the single source of truth.
- **Edit** (in the browser): slice with filters, adjust NC/APOS levers, pick a BTC strategy, save
  and compare **named scenarios**, and **hand-edit any week** with every change logged to a ledger.
- **Publish**: **Submit** writes a **timestamped, audited `.xlsx`** to `output/` — never overwriting.

A small local server (`serve.py`) reads the workbook and writes published forecasts. The UI is 6
static HTML pages sharing one engine (`fc_engine.js`). Everything is **pure Python stdlib + browser
JS** — no `pip install`, no build step, no cloud.

## Run it

```bash
cd forecast_copilot
python serve.py            # -> http://127.0.0.1:8000/  (opens the Dashboard; Ctrl+C to stop)
python -m unittest         # 14 tests (read path + write path), stdlib only
```

- **Live vs Simulated:** a bottom-left badge shows the mode. Served by `serve.py` → **Live** (real
  workbook). Opened without the server (e.g. `file://` or a plain static host) → **Simulated**
  (seeded fallback), so the pages never break.

## The loop / architecture ("1 + 6 + 4")

- **1 flow:** immutable input → in-app edits → `output/` (timestamped, never overwrites input).
- **6 pages** (left nav order): Dashboard · ASU Simulation · Historical Performance · AI BTC Advisor ·
  BTC Distribution · Final Forecast. State flows across all of them via `localStorage` (`fc_state_v1`).
- **4 audit:** every weekly edit is a timestamped delta in the active scenario's ledger; the published
  workbook carries **Final Forecast · Assumptions · Audit** sheets (the Audit sheet records the input's
  sha256 + the ledger).

## Where things live

| Path | What |
|---|---|
| `serve.py` | Zero-dep server: static files + `GET /api/health` · `GET /api/dataset` · `GET /api/outputs` · `POST /api/publish`. Also a stdlib `.xlsx` reader **and** writer. |
| `fc_engine.js` | **Shared engine — edit once, don't re-inline.** Data provider (live/seeded), filters, compute pipeline, scenarios, weekly overrides + ledger, charts (Highcharts), and the injected badge / scenario bar / compare modal. |
| `*.html` (×6) | The pages. Each loads Highcharts (CDN) → `fc_engine.js` → a small page-specific inline script. |
| `input/forecast_fy26.xlsx` | **The source the app reads** — sheet `Service Dataset`, 8,892 rows (19 products × 3 regions × 156 weeks), modeled/dummy, dense + scaled. Read-only. |
| `input/fy24-26_info.xlsx` | Reference only (Dell 10-K sheets + an "ASU by Product" summary). Not read by the app. |
| `input/INPUT_SHA256.txt` | Pinned sha256 of both input files (proves the input is never mutated). |
| `output/` | Published forecasts land here (`.gitkeep` until the first publish). |
| `test_dataset.py` / `test_publish.py` | Read-path pivot test / write-path publish test (14 total). |

## Status

- **Phases 0–6 complete** on branch **`hn-new`** (pushed to `AABH-AI/SIMULATION_Example`).
  0 scaffold · 1 server+read · 2 real-data adapter · 3 scenarios · 4 editing+ledger · 5 publish ·
  6 e2e+docs. Verified end-to-end in a browser (0 console errors), 14/14 tests pass.
- **Phase 7 (LLM insights)** is optional/later — read-only explanation of scenarios; needs a model API
  + backend key, so it's off the static/offline critical path.
- **Post-demo decision (open):** *should the production version be Power BI?* The working demo now
  exists as the evidence to decide — see the "can this be Power BI?" section in `BUILD_PLAN.md`
  (view/slider maps natively; cell-editing + saved scenarios + structured/audited output do not).

## Guardrails

- Work on **`hn-new`** only — never `master` / `gh-pages` / others. Pushing HTML to `hn-new` is safe
  (the deploy workflow only publishes from `master`).
- `fc_engine.js` is the **single shared engine** — change it once; don't paste it back into the pages.
- The **input workbook is read-only** at runtime. It's modeled/dummy data (labelled "MODELED
  ESTIMATES"); regenerating/enriching it is a deliberate dev-time act (re-pin `INPUT_SHA256.txt` +
  update the pivot test). Commit the `.xlsx` data files **and** published `output/` files; gitignore
  only Excel lock temps (`~$*.xlsx`) and Python `__pycache__/`.
