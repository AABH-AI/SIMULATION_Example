# Forecast Copilot — Build Plan (input → edit → publish)

> Canonical plan for the "dashboard as the one-stop for editing/forecasts/insights" task.
> Excel files become pure I/O: **input** (read-only) and **output** (timestamped, published).
> Last updated: 2026-07-21

---

## Read first

Folder-local docs (current): `README.md`, `HANDOFF.md`, `PROMPT_TRAIL.md`.
`../IMP_DOCS/*` is canonical but pre-refactor. `../CLAUDE.md` is partly stale — folder-local docs win.

## Current state

- Engine is **`fc_engine.js`** (single source of truth — edit once, don't re-inline). Load order per page:
  Highcharts (CDN, head) → `fc_engine.js` (body) → page-specific inline script.
- Data is **100% mock/seeded** today. Cross-page state in `localStorage` key `fc_state_v1`.
- Filter option is `All` (renamed from `ALL`). All 6 pages verified, 0 console errors.
- "AI BTC Advisor" is a single-variable **BTC picker** (3 fixed recipes), **not** a scenario engine.

## Environment (verified 2026-07-21)

- Node **v24.18.0** + npm 11.16.0 on PATH. Python **3.13** also (openpyxl + pandas). git **2.45.2**.
- **Work happens on branch `hn-new`** (exists on the remote `AABH-AI/SIMULATION_Example`, confirmed 2026-07-21).
  Other branches (`master`, `gh-pages`, …) = other people — **do not touch**.
- ⚠️ `D:\Repos\SIMULATION_Example` is **not yet a git repo** (no `.git`, no remote) and is full of untracked files
  that differ from the repo — it must be **connected to the remote and checked out onto `hn-new`** before any
  commits (a bare `git init` would create an unrelated history, NOT put you on `hn-new`). See Phase 0. Back up before bulk edits.
- Repo is **public** (GitHub Pages). The `.xlsx` files are **modeled/dummy demo data** (owner-confirmed; the file's
  own sheets are labeled "MODELED ESTIMATES", sibling is `Dispatches_Dummy.xlsx`) → **safe to commit**.
  `output/` is the **published forecast record / audit trail → commit it too** (not regenerable). Gitignore
  only the Excel lock/owner temp files (`~$*.xlsx`).

---

## Architecture — "1 + 6 + 4"

One line: **immutable input → named scenarios edited in the dashboard → publish one to a timestamped output that carries its own audit trail.**

- **1 (flow):** `input/` file is read-only. Dashboard reads it, all editing happens in-app, **Submit** writes a
  **new timestamped `.xlsx`** to `output/` — never overwrites, never touches input.
- **6 (scenarios):** `fcState.scenarios[]` = multiple **named full-state plans** (slice + NC/APOS overrides +
  BTC choice + per-week edits + distribution). save / duplicate / switch / compare. Publishing materializes one.
  - **Authoring = manual + recipe presets** (Baseline / Aggressive / Conservative) — deterministic, no LLM.
  - A **chatbot is optional and later**, scoped to **insights/explanation only** (needs a model API + backend
    key; breaks the static/offline posture — keep off the v1 critical path).
  - The Advisor's BTC pick becomes **one field inside** a scenario.
- **4 (ledger):** every edit appended as a **timestamped delta**; output workbook carries
  **Final Forecast + Assumptions + Audit** sheets.

## Data reality

Input = `dell_isg,esg_fy24-26.xlsx`, sheet **`Service Dataset`** — 2,965 rows × 13 cols:

```
FY | Fiscal Quarter (2024-Q1) | Fiscal Week (2024-W01) | Product (Poweredge→PowerEdge) |
Region | Warranty Type | ASU | Warranty Expirations | Core/Upsell | W/O Type | FQM Flag |
GCFA Type | Service Type
```

- **Gap:** no New Contracts / APOS / SR / Dispatch columns → real **ASU + Expirations** drive the slice;
  SR/Dispatch stay **derived** (ratios); NC/APOS stay **levers**.
- `Dispatches_Dummy.xlsx` is messy (offset headers, `#N/A`) → **out of scope for v1**.
- Filter options should be **derived from the data's distinct values**, not hardcoded (kills the
  `ALL`/`All`, `Poweredge`/`PowerEdge` reconciliation problem at the root).

## Serving

A small **local server** (`serve.py` in Python stdlib + openpyxl, or Node now that it's installed):
`GET /api/dataset` · `POST /api/publish` · `GET /api/outputs`.
Static-mode fallback = seeded data + a visible **"Live / Simulated"** badge; publish falls back to a
browser download when the server is absent. (A pure-static app cannot silently write to `output/`.)

---

## Build order

Each phase is independently verifiable. Natural stop-and-review after **Phase 2** and **Phase 5**.

- **Phase 0 — Connect to `hn-new` + scaffold**
  This folder isn't a repo yet, so first connect it to the remote and land on the existing branch — do **not**
  bare-`git init` (that makes an unrelated history). Options: (a) `git init` → `git remote add origin
  https://github.com/AABH-AI/SIMULATION_Example.git` → `git fetch origin hn-new` → `git checkout -b hn-new
  origin/hn-new`, handling the existing untracked files carefully (they'll collide with tracked ones); or
  (b) clone fresh into a sibling folder and copy the `forecast_copilot/` work in. Confirm the approach with the
  user — the untracked-file collision is real. Then add `.gitignore` (ignore only Excel lock temp files `~$*.xlsx` — the `.xlsx` data files AND published `output/` files ARE committed),
  create `input/` (move the raw file in) and `output/` (`.gitkeep`). ✔ record the input file hash so "never mutated" is provable.

- **Phase 1 — Server + read path**
  `serve.py`: static server + `GET /api/dataset` (parse `Service Dataset` → cached JSON).
  ✔ Python test asserts slice aggregates match a hand-checked Excel pivot.

- **Phase 2 — Engine data adapter** *(milestone: real-data dashboard)*
  `fc_engine.js` provider interface: API → real data, else seeded fallback + badge. Filter options derived
  from the data's distinct values. Real ASU/Expirations drive the slice; SR/Dispatch derived; NC/APOS levers.
  ✔ dashboard shows real numbers; kill server → falls back cleanly.

- **Phase 3 — Scenario layer (#6)**
  `fcState.scenarios[]` + active id; save / name / duplicate / delete / switch, each snapshotting full state;
  compare view. Advisor's BTC pick becomes a field inside a scenario.
  ✔ two scenarios with different filters persist and compare.

- **Phase 4 — Editing + ledger (#4)**
  Editable weekly grid (BTC Distribution): per-week overrides in the active scenario, flagged + resettable.
  Every edit appends a timestamped delta to that scenario's ledger.
  ✔ a cell edit flows through `fcCompute()` to all pages; ledger records it.

- **Phase 5 — Publish / write path (1)** *(milestone: loop closed)*
  Final Forecast **Submit** → `POST /api/publish` → `serve.py` writes a timestamped `.xlsx`
  (sheets: Final Forecast · Assumptions · Audit) to `output/`, never overwriting. Publish-history panel
  via `GET /api/outputs`. ✔ file appears with correct numbers + audit; input hash unchanged; second publish = second file.

- **Phase 6 — E2E + docs**
  Full walk-through, then update `README.md` + folder-local docs + memory.

- **Phase 7 — (optional, later) Insights assistant (LLM)**
  Read-only explanation / comparison of scenarios; **not** authoring. Requires a model API + backend key.

## Next step (post-demo): can this be Power BI?

Once Phases 0–6 exist as a working demo, use it to answer a real question before investing further:
**should the production version live in Power BI instead of a custom app?** The demo is the cheap,
offline, fast-to-iterate way to prove the flow and show stakeholders — *then* decide the platform.

**Splits sharply along read vs. write:**
- **Maps natively (Power BI's home turf):** connect the input (Power Query), slicers = the filter rail,
  KPIs/trends/tables = the pages, and **What-If parameters** = the NC/APOS/BTC sliders. You can even
  round-trip *slider* changes: adjust → the visual recalculates → **Export data** → Excel of the adjusted
  numbers. Zero add-ons.
- **Not native (the actual point of this build):**
  - **Cell-level editing** (type a new weekly value) — Power BI tables are display-only.
  - **Saved multiple scenarios *with data edits*** — bookmarks capture view state, not edited data.
  - **Structured, timestamped, audited output workbook** — native "Export data" is manual, single-visual,
    unstructured, current-view-only, row-capped, lands in Downloads. Not a governed `output/` artifact.
  - **Append-only ledger** — needs a writeback datastore.

**Three routes if it goes to Power BI:**
1. **Native-lite:** slicers + What-If sliders + bookmarks + manual Export data. Fast/cheap, but it's a
   *report*, not a planning tool — loses editing, saved scenarios, structured output, and audit.
2. **Third-party planning visual (Inforiver / Acterys):** editable Excel-like grid + writeback + formatted
   multi-sheet Excel export *inside* Power BI. Closest to "this exact thing." Paid, AppSource-certified.
3. **Full Microsoft stack:** Power BI (view) + embedded Power Apps (edit) + Dataverse/SQL (scenarios +
   ledger) + Power Automate/Office Scripts (timestamped .xlsx to SharePoint/OneDrive). Most capable; most plumbing.

**Flags:** routes 2–3 need the Power BI **cloud Service** + **paid tiers** (Pro/PPU/Premium) and put the
Dell-labeled data in the cloud — a **data-residency/governance** decision the local static demo sidesteps.

**Rule of thumb:** analytics + light what-if → Power BI wins. A planning/data-entry tool that authors
audited artifacts (what this is) → either accept route 2/3, or keep the custom app. The demo is what lets
you make that call with evidence instead of guesswork.

## Git / publishing

- **Branch is decided: `hn-new`.** All work commits there. Never touch `master` / `gh-pages` / others.
- Still to handle in Phase 0: **how** to connect this untracked folder to the remote (init+fetch+checkout vs
  fresh clone) — the untracked-file collision is real, so confirm the approach with the user.
- Push auth/account is **unverified** (prior wrong-account caching issue, `Arnav1771` vs `AABH-AI`) — verify the
  push resolves to `AABH-AI` before/when pushing, or commit locally and let the user push.
- Commit the `.xlsx` data files (modeled/dummy demo data) **and** the published `output/` files (the forecast
  record). Gitignore only the Excel lock temp files (`~$*.xlsx`).

**Start at:** Phase 0 (unless told otherwise).

---

## New-chat kickoff message

Paste this into a fresh session to hand off the task:

```
PROJECT: Forecast Copilot (ISG BPA suite) — Aligned Automation.
Working dir: D:\Repos\SIMULATION_Example ; product in forecast_copilot\
BRANCH: work on hn-new (exists on remote AABH-AI/SIMULATION_Example).

READ forecast_copilot/BUILD_PLAN.md IN FULL — canonical plan for the current task
(input→edit→publish, "1+6+4" architecture, phased build order, data reality,
environment, the post-demo Power BI evaluation, and git/publishing). Then skim the
folder-local docs it points to: README.md, HANDOFF.md, PROMPT_TRAIL.md.

Key guardrails from that doc:
- fc_engine.js is the single shared engine (edit once; don't re-inline).
- This folder is NOT a git repo yet — Phase 0 must CONNECT it to the remote and check out
  hn-new (a bare `git init` would make an unrelated history, NOT put you on hn-new).
  The folder has untracked files that collide with the repo — confirm the connect approach first.
- Commit only on hn-new; never touch master / gh-pages / other branches.
- Commit the .xlsx data files AND the published output/ files (they're modeled/dummy demo
  data and the forecast record/audit trail). Gitignore ONLY the Excel lock temp files (~$*.xlsx).
- Push auth is unverified (prior wrong-account issue) — verify AABH-AI or let the user push.
- Node v24.18.0 / Python 3.13 / git 2.45.2 all available.

SCOPE / ORDER:
- Build the custom dashboard demo first: Phases 0→6 (0 connect+scaffold, 1 server read,
  2 real-data adapter [milestone], 3 scenarios, 4 editing+ledger, 5 publish [loop closed], 6 e2e+docs).
- Phase 7 (LLM insights) is optional/later.
- Do NOT start a Power BI rebuild yet. After the demo works, there's a post-demo decision
  ("Next step: can this be Power BI?" in BUILD_PLAN.md): the view/slider side maps natively,
  but cell-editing + saved scenarios + structured/timestamped/audited output do NOT — that
  needs Inforiver/Acterys or the Power Apps+Automate stack (paid, cloud). Decide with the demo as evidence.

START AT: Phase 0. Confirm the git-connect approach with me before running it.
```
