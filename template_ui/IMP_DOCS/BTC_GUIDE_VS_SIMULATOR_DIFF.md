# BTC Guide vs. Simulator v3 — Gap Analysis

> How `btc_adjustment_simulator_v3.html` differs from the process described in `BTC_GUIDE.md`.
> The guide is the **real-world KT reference** (Doug O'Neill's actual adjustment process). The simulator is a
> **simplified interactive demo** built to the `DEVIN_PROMPT_v3.md` spec. This doc catalogs where the demo
> diverges from reality — useful for deciding which gaps to close and which are intentional simplifications.
>
> Last updated: 2026-08-10

---

## How to read this

Each item lists: **what the guide says**, **what the simulator does**, and **why it matters**. Items are grouped
into Logic/Math (the numbers), Flow/Workflow (the steps), and UX (the interface). "Guide §N" points to a section
in `BTC_GUIDE.md`; line references point into `btc_adjustment_simulator_v3.html`.

---

## A. Logic & Math — how the numbers are produced

### A1. The bend shape is flat, not incremental *(biggest divergence)*
- **Guide (§6.1–6.2):** The adjustment ramps up *over time* — little change in the early weeks, accumulating to
  its full effect in the back half of the year, as initiatives kick in. It's an S-curve, by design.
- **Simulator:** Applies the modifier evenly to every forecast week (`adjusted = forecast × (1 + p/100)`,
  around line 688). The `DEVIN_PROMPT_v3` spec (task 2.3) deliberately removed the original ramp curve.
- **Why it matters:** The simulator produces the *opposite* profile from the one Doug actually builds. A flat
  lift is easy to reason about but doesn't reflect how real initiatives phase in.

### A2. The modifier means something different
- **Guide (§6.3):** The modifier is a percentage where **100% = no change** and lower values bend the forecast
  *down* toward target (e.g. "80% takes 20% and spreads it"). It's a one-directional reduction lever.
- **Simulator:** The slider is centered on **0 = no change**, ranges −100% to +150%, and can push the forecast
  either up or down.
- **Why it matters:** Different scale and different intent. The real tool is about *reducing* dispatches to hit
  modernization targets; the demo is a symmetric up/down multiplier.

### A3. Targets are invented, not sourced from SMOD
- **Guide (§5, §18):** Targets (SMOD) are set externally by "triad" leadership consensus, stored in Mark's
  spreadsheet, defined per product and per ship-vintage year.
- **Simulator:** Target = baseline × 0.92 (a hardcoded 8% haircut, around line 1074).
- **Why it matters:** No real target data flows in; every product gets the same synthetic 8% goal.

### A4. A third adjustment lever ("Declines") was added
- **Guide (§9.2):** There are exactly **two** adjustable contract fields — New Contracts and APOS Renewal.
- **Simulator:** Has three sliders — New Contract, APOS Renewal, **and Declines** (the Expiring outflow).
- **Why it matters:** The guide treats Expiring as *data pulled from Julius* (§9.4), not a lever a planner
  slides. The extra control is a demo convenience, not a real degree of freedom.

### A5. ASU→Dispatch/SR coupling is a modeling invention
- **Guide:** Dispatches/SRs are the **primary** BTC adjustment ("95% are made this way", §6.6). ASU contract
  adjustments are a **separate** file that happens to use "the same methodology" (§9.1).
- **Simulator:** Makes ASU the upstream *driver* — dispatches and SRs are mathematically derived from adjusted
  ASU (ASU × MDR, ASU × ICR, around line 687).
- **Why it matters:** In reality Doug adjusts dispatches directly against their own SMOD target. The causal
  chain "adjust ASU → dispatches move" doesn't exist in his process; it's a simplification for the demo.

### A6. No IQR / No-IQR starting point
- **Guide (§3.4):** Doug starts from the "no-IQR" dispatch series for storage products, IQR for client products.
- **Simulator:** No concept of IQR at all.
- **Why it matters:** The choice of starting series is a real judgment call the demo skips.

### A7. No actuals-override in the forecast gap
- **Guide (§12):** There's a 2–3 week lag where actuals arrive after the forecast is cut; those real values
  overwrite the forecast weeks so everything ties out (example: 26,274).
- **Simulator:** Actuals are frozen before `fcStart`; recent forecast weeks can't be overwritten with new actuals.
- **Why it matters:** The demo can't model the "the first few forecast weeks are already real" situation.

### A8. No quarterly phasing / rebalancing
- **Guide (§10):** A separate step rebalances quarters using a **plain percentage** (not the BTC calc) to avoid a
  "cliff drop then summit" shape leadership rejected.
- **Simulator:** No phasing step exists.
- **Why it matters:** A whole class of real adjustment (phasing) is absent.

### A9. No 4-tab storage-product split
- **Guide (§8):** Dual-BU products (VxRail lives in both ESG and ISG) × service type (Parts&Labor vs Parts-Only)
  force **4 adjustments per product**, with unequal values across the four intersections.
- **Simulator:** Works on a single LOB timeline; no ESG/ISG × service-type intersection. (A separate
  `btc- 4 tab.html` prototype explores this; v3 does not.)
- **Why it matters:** This is one of the biggest real-world pain points and the demo doesn't represent it.

### A10. Allocation — mostly aligned ✓
- **Guide (§7.2):** Published values are weighted-allocated down to the lowest level (region, core/upsell, etc.),
  explicitly *not* split equally.
- **Simulator:** `showAlloc()` does weighted region / core-upsell / service allocation (around line 929).
- **Why it matters:** This one largely matches. Missing piece: the product-BU (ESG/ISG) dimension.

---

## B. Flow & Workflow — the sequence of steps

### B1. No "quality check first" step
- **Guide (§4):** Step one is always validating that the adjustment cube matches Julius (ASU ≈ 277,597;
  work orders 527 in both).
- **Simulator:** Jumps straight into adjusting.

### B2. No LOB priority ordering
- **Guide (§15.1):** Products are worked in volume-priority order — PowerScale first ("lion's share"), then the
  top 8–10, then the rest.
- **Simulator:** Any LOB can be picked in any order; no priority guidance.

### B3. Step sequence differs
- **Guide:** quality-check → size the annual adjustment → rebalance quarters → downstream metrics.
- **Simulator:** Step 1 ASU → Step 2 Dispatches + SRs → Step 3 Publish (around line 857). Clean and gated, but
  not Doug's actual order.

### B4. Publish uses a different metaphor
- **Guide (§7.1, §7.3):** Values are pasted into an OLAP cube (values only, no formulas), a red mark appears,
  then **Publish Change** or **Discard**. The cube rejects zeros, formulas, and multi-value pastes.
- **Simulator:** A per-metric **Lock forecast** button plus CSV export (around line 886). No red-mark /
  publish-change / discard cycle, and none of the OLAP input constraints.

### B5. No validation / handoff loop
- **Guide (§11):** After adjustment: Francisco extracts → Brandon loads into Julius → Mark validates →
  iterative fixes feed back.
- **Simulator:** Ends at CSV export; no downstream validation or feedback loop.

### B6. "Pass" counter means something different
- **Guide:** A "Pass" is a fiscal-year planning pass (e.g. the Excel header "FY27 Pass 2", §3.5).
- **Simulator:** "Pass N" = the count of export files written to the output folder (around line 978).

---

## C. UX — the interface

### C1. No adjustable time window
- **Guide (§17.1–17.2):** Doug's wish-list is a loan-calculator-style tool — pick the time frame ("I have 8
  weeks I need to adjust"), pick the precision.
- **Simulator:** Has the slider + number field (good), but the modifier always applies to the *whole* forecast
  window — no way to target a sub-range or set precision.

### C2. Only one adjustment type
- **Guide (§17.6):** Names four distinct adjustment types — phasing, bend-the-curve, anomalies, seasonality.
- **Simulator:** Implements bend-the-curve only (and the flat version of it).

### C3. No vintage / generation view
- **Guide (§17.4):** Wants vintage × fiscal-quarter profiling to analyze each product.
- **Simulator:** No vintage dimension.

### C4. Filter set doesn't match the real dimensions
- **Guide:** Real dimensions are region, country, core/upsell, service type, and **product BU (ESG/ISG)**.
- **Simulator:** Includes invented, mostly display-only filters (Warranty Type, FQM Flag, GCFA Type, WO Type —
  they don't reshape the series, see the comment near line 352) and is **missing product-BU**, which is exactly
  the dimension the 4-tab reality (A9) needs.

---

## D. Where the simulator is *ahead* of reality

- **Single-page, real-time, slider-driven modeling.** The guide's own "future state" (§17.1, §17.3) asks for
  exactly this — a fast, visible, anytime scenario tool (ideally in Power BI). The demo already delivers that
  interaction model, which the current all-manual Excel/OLAP process does not.

---

## Changelog

- **2026-08-10** — Renamed the SR & Dispatches "Forecast Rate" KPI to **MDR Rate** and expressed it (plus the
  Adjusted Rate, Target rate, and Gap readouts) as a **real percentage** (rate 0.10 → 10%). MDR follows the
  adjustment-template definition — `metric_FY / avgASU_FY / 52`. The rate value is multiplied by 100 at display
  time; the internal gap-count / colour / bar math stays on its own scale. Verified in-browser: Dispatches MDR
  **7.18%** (target 6.60%, gap +0.58%), SRs MDR **12.84%** (target 11.77%, gap +1.07%).
- **2026-08-10** — Created this gap-analysis doc.
