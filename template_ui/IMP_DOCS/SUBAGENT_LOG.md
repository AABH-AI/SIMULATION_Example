# Sub-agent Activity Log
> What was delegated to sub-agents, how it was orchestrated, and what came back.
> Scope: BTC simulator work on `template_ui/btc_adjustment_simulator_v2.html`.
> Last updated: 2026-08-13 (Sessions 44 / 44b / 44c; audit re-run complete).

---

## Why this file exists

Sessions 44–44c were run almost entirely through sub-agents at the owner's request. The
per-agent findings, verification numbers and flagged trade-offs are far more detail than
belongs in `PROMPT_TRAIL.md`, but they are exactly what a future session needs when it asks
"was this actually checked, or just claimed?". This file is that record.

---

## Orchestration rules used (and why)

**Every task touched the same single file** (`btc_adjustment_simulator_v2.html`, ~1,700 → ~1,950
lines, all CSS + JS inline). That drives the whole strategy:

| Rule | Reason |
|---|---|
| **Read-only recon agents run in parallel** | `Explore` agents only read. Three ran concurrently to map the three problem areas with zero conflict risk. |
| **Writing agents run strictly sequentially** | Two agents editing one file concurrently corrupt each other — `Edit` matches on exact strings, and the file shifts under whoever is second. One in flight at a time, always. |
| **Each writing agent gets the previous agent's line numbers as *hints*, not truth** | Line numbers shift after every pass. Every prompt said "verify line numbers before editing, they have shifted". |
| **Each writing agent is told the file is already dirty** | Otherwise an agent sees uncommitted changes it did not write and reports a "concurrent edit" alarm — which one did (agent 5, see below). |
| **Verification is demanded in the prompt, with "no success claims on assumption"** | `node --check` on the extracted inline script every pass, plus a real-browser run over `python -m http.server` with DOM/geometry reads, plus Node harnesses over the real `input/*.js` data for arithmetic invariants. |
| **Invariants are stated in the prompt, not left implied** | e.g. Σ(sub-segments) == All; legend↔series index alignment with deliberate `data:[]` slots; `Gap = BTC Adjusted − AOP Target` ties out exactly. Agents break what they are not told to protect. |

---

## Recon agents (parallel, read-only, `Explore`)

Run once at the start of Session 44, concurrently. Output: dependency maps with line numbers
and code excerpts. No edits. Token/tool usage not reported by the harness for these.

| # | Scope | Key findings that shaped the work |
|---|---|---|
| R1 | Editable adjusted cells | Only **two** editable-cell templates existed in the whole file; SR/Disp Adj was editable **only on sub-segment tabs**; Publish was fully read-only; three renderers with **no shared row-builder**; `table-layout:fixed` with no `<col>` widths would crush numeric columns if a column were added. |
| R2 | SR/Dispatch segmentation | Segment engine is **entirely count-agnostic** — everything derives from `segList().length`, so the swap was a `segList` + `hiddenFilters` change, not a refactor. Flagged the stale-`_seg` hazard: `segBase()` lacked the guard `bendSeg()` had, so a shrinking segment list would throw. |
| R3 | Chart axis + markers | `niceScale()` existed but ran **only** when `opts.yTicks` was passed — i.e. Publish charts only. `marker.enabled` hard-coded `false` (the blank single-week chart). The `sig` rebuild-guard did not encode marker state, so a marker change could ride the fast in-place `setData` path and go stale. |

---

## Writing agents (sequential, `general-purpose`)

| # | Task | Tokens | Tools | Wall | Outcome |
|---|---|---|---|---|---|
| A1 | Swap SR ↔ Dispatch segment split | 98,532 | 50 | 6.2 min | Complete |
| A2 | Dynamic y-axis + single-week dots | 129,569 | 58 | 10.5 min | Complete |
| A3 | Editable adjusted values everywhere + comments + row highlight | 205,927 | 85 | 17.7 min | Complete |
| A4 | Comments in CSV, Enter-to-commit, All-tab redistribution | 169,645 | 83 | 14.8 min | Complete |
| A5 | Delta sign fix + comment column UX (preview/popover/edit) | 233,611 | 173 | 32.0 min | Complete |
| A6 | Edit-propagation correctness audit | 189,815 | 30 | 10.9 min | **Terminated — incomplete** |
| A6-rerun | Edit-propagation audit (re-run, inline — no sub-agent) | — | — | — | **Complete — 2 defects found, both fixed & verified** |
| | **Total** | **1,027,099** | **479** | **~92 min** | |

### A1 — segment swap
Dispatches → 4 sub-tabs (Unit A/B × Parts / Parts+Labour), SRs → 2 (Unit A/B).
Verified: weights `0.30640 / 0.27360 / 0.22187 / 0.19813` (Σ = 1 within 2e-16) and `0.58 / 0.42`;
Σ sub-series == All element-by-element across **all 8 LOBs × both kinds**; live browser check
`277,837 + 273,675 + 199,323 + 196,341 = 947,176` == All 947,176. Added `segCur()` to clamp a
stale `_seg` (the R2 hazard — confirmed real: `_seg=4` on the now-2-way SR list).

### A2 — charts
`niceScale` extended to every chart (`yT = opts.yTicks || 5`); degenerate flat-range widen changed
from absolute ±1 to proportional ±2 %. Markers auto-enable per series at ≤2 non-null points.
Verified against a served copy of the pre-change file on a second port — a genuine before/after:
Publish ASU at 1 week `5,322,833–5,322,836 step 1` → `5.2M–5.5M step 100K`; marker nodes
`0 → 4/2/2` on ASU/SR/Disp. **Confirmed the stale-`sig` bug was real** (sig byte-identical across
an empty→populated adjusted series) before fixing it — the kind of check worth demanding.

### A3 — editable everywhere
Editable Adj on the All tab, Adj ASU (running-balance override, propagates forward via `ovShift`),
all five Publish adjusted columns writing back into the same stores. Comment column + light-blue
edited-row highlight. Verified: a W11 ASU edit shifted W12/13/14 by exactly +76,809 with weekly
increments identical to baseline; 23 simulated keystrokes with 0 focus/caret breaks.
**Found and fixed a latent pre-existing bug**: `editAsu` left an empty `{}` behind on clear, so the
Publish `showAdj` gate (`Object.keys(OVR.asu).length>0`) latched on forever.

### A4 — CSV comments, Enter, redistribution
`spreadAllEdit()` + `allocLR()` (largest-remainder). Proved LR was necessary rather than assuming it:
naive rounding on the real case gives 5,002 for a typed 5,001. 4,000 randomized trials, 0 mismatches;
full-window sweep 0 mismatches over 104 weeks both kinds. CSV round-tripped through an
**independently written** RFC-4180 parser with comma / embedded quote / non-ASCII / newline fields.

### A5 — delta sign + comment UX
Audited every other `>=0?'+'` site before concluding the delta one was the only string-compare
instance. Chose "click opens read popover, dblclick upgrades to edit" over a click-delay timer.
**Found three real bugs during its own verification and fixed them**: `textarea.focus()` fires a
scroll event that self-closed the popover; an in-flight scroll event (they land a frame late) did the
same; double-clicking while already editing blurred the field. Close-on-scroll is now anchor-based
(closes when the row actually moves) rather than event-based. Drove Chrome directly via
puppeteer-core when the Browser pane stopped dispatching input.

### A6 — edit-propagation audit ⚠ INCOMPLETE
**Terminated mid-run by an API error: the org's monthly spend limit.** Recovered output ends at
*"Three defects confirmed. Now let me apply the fixes."* — so:
- **Three defects were identified but are not described in the recovered output, and no fixes were applied.**
- The file was left syntactically valid (`node --check` on the extracted inline script: OK) with all
  A1–A5 work intact — the agent had not started editing.
- **This audit is still owed.** Re-run it against the same brief: verify every `OVR` key
  (`disp/sr[segIdx][fw]`, `asu[fw].an/.ba/.aa`) reaches the adjusted column on every page, the chart
  series, the Delta column, the `BTC Adjusted` / `Adjusted Rate` / `AOP Target` / `Gap` KPIs (Gap must
  tie out exactly), the MDR/ICR denominators (ASU-side edits move SR/Disp *rates*), the Publish page,
  both CSV exports, the Σ-subs invariant, filter/LOB interaction, and the `renderRate`/`editAsu`
  re-render fan-out (a page left showing a stale number until revisited is the specific risk).
  Named risk points to re-check: stale/missing `C._adj` when Publish renders before SR/Disp has;
  `aa` combined with `an`/`ba` and with imported declines on the same week; sub-tab edit → All edit
  (redistribution) with no double-application; AOP override + per-week edit tying out on both All and
  sub tabs; adjusted-reveal gating firing on an edit alone at neutral modifiers.

---

## Audit re-run (2026-08-13) — COMPLETE

The A6 audit was re-run **inline in the main thread** (no sub-agent — not requested this time), against the
same brief. Method: full static trace of every `OVR` key through every consumer, plus a Node harness over the
real `input/btc_data.js` (`LOB "Server Line A"`, fcStart 260) exercising the redistribution invariant and the
`aa` balance-override path. `node --check` on the extracted inline engine: OK. **Both defects were then
fixed and verified** (owner said "fix both") — see "Fixes applied" below.

**2 defects confirmed:**

1. **`aa` "Adj ASU" edit never reaches the ASU-page chart line** *(medium)*. Editing the Adj ASU cell
   (`OVR.asu[fw].aa`) moves the KPI card, the table column, forward balances, and the **Publish** ASU chart —
   but not the ASU-page chart's own "Adj ASU" line. Card/table/Publish plot the running **balance**
   (`rows[i].adj`, lines 1568 / 1932 / 1950); the ASU-page chart plots the weekly **composition**
   `adjNew+btcApos−decl` (line 1584). Harness: aa=8,888,888 → card/table `r.adj`=8,888,888 but the ASU-page
   plotted value stays 53,420, and its delta at wE+1 is 0 (the aa edit never reaches that chart). Same series
   name, two scales; asymmetric with Publish. Fix is an owner call (make the ASU-page line balance-consistent,
   or relabel/gate the aa cell) — the whole ASU-page chart is flow-scale by design, so it is not a one-liner.

2. **Per-week overrides don't rescale or clear on an allocation-dimension filter change** *(low-med)*.
   `OVR.disp/sr[seg][fw]` and `OVR.asu[fw]` are absolute; `bendSeg` returns them verbatim (line 1125) while the
   base series rescales by `allocMult`. Overrides clear only on a LOB change (`loadLob`, line 2054) — never in
   `applyFilters` (line 855). So an edit made under Region=All shows an out-of-scale adjusted value once a
   Region/Business/Warranty/Service/Core-Upsell/WO/FQM/GCFA filter narrows the base. Asymmetric with the LOB
   filter, which does clear. (Region etc. reshape via allocation weights, not per-week series.)

**Verified holding (no defect):** R-c redistribution / no double-application + `Σsubs == typed total`
(harness T1: subs `4899/40/33/29 = 5001`, pre-existing sub[1]=99999 **overwritten** not added, `sumSubs(All)`
ties); R-a `C._adj`/`ASU_ROWS` are absolute-indexed and `renderPub` recomputes ASU live, so no stale-number
path (incl. `go('pub')` which skips a rate re-render — safe because prune only changes `vis`, not the
absolute-indexed `_adj`); R-d AOP + per-week edit Gap ties out on both All and sub tabs (Σ seg weights = 1);
R-e adjusted-reveal fires on an edit alone at neutral modifiers on all three pages; `Gap = BTC Adjusted −
AOP Target` exact (`gapN = round(tAdj) − tgtN`); MDR/ICR denominators move on ASU-side edits
(`editAsu → renderRate(DISP)+renderRate(SR)`, `sAdjAsu` from `computeAsuRows`); both CSV paths share
`_csvRows` and stay consistent; Delta sign fix (S44c) present (sign taken off the number, line 1419).

The terminated run's "three defects" could not be reconstructed from its recovered output; only the two
confirmed above are reported — no third was fabricated.

### Fixes applied (2026-08-13)

**Defect 1** — `computeAsuRows()` now records `aaJump` per row = the net inflow injected when an `aa` edit
re-anchors the balance (exactly the amount `ovShift` grows by that week). The ASU-page "Adj ASU" chart line
(the only surface that plots the weekly *composition* rather than the balance) adds `aaJump`, so an Adj-ASU
edit shows as a one-week inflow spike and returns to the normal inflow next week — the forward balance still
carries the shift automatically. Card / table / Publish are untouched (they still show the balance), so every
tie-out the audit verified is preserved. Node harness (realistic +5,000 nudge): card `r.adj` = target;
chart line spike = **+5,000** exactly at the edited week; next week returns to baseline; forward balance
still +5,000. (Extreme values still spike hugely — but so does the card, since that is what was typed.)

**Defect 2** — `toggleMulti()` now clears the absolute per-week overrides (`OVR` + `CMT`) whenever an
**allocation-dimension** filter changes (`ALLOC_DIMS`: region / business / warranty / service / coreupsell /
wotype / fqm / gcfa), mirroring what a LOB change already does — because those dims rescale the base series by
`allocMult` and a fixed typed count would otherwise render out of scale. **FY / FQ / FW are NOT cleared**
(they only change the visible window; per-week edits stay valid). Percentage controls (segment modifiers,
target *rate* / `TGT_OVR`) survive — they are scale-invariant. Verified against the real `ALLOC_DIMS`: all 8
alloc dims clear, all 3 window dims do not. **`AOP_OVR` is cleared too** (owner follow-up) — it is a typed
absolute count with the same scale-bound problem, so an allocation-dim change resets it back to auto; the
rate-based `TGT_OVR` is kept.

`node --check` on the extracted inline engine after both fixes: OK. Full-app browser run was blocked (the
Browser pane refuses `localhost` by policy and loads the file as a `data:` snapshot where `input/btc_data.js`
can't resolve), so verification was Node-harness + branch-logic against the real data/constants, as above.
Not pushed — local-only.

---

## What worked, for the next session

- **Demand a before/after on a served copy of the unmodified file.** A2 did this and produced real
  numbers instead of "the axis looks better now".
- **Name the invariants in the prompt.** Every agent that was handed the Σ-subs / legend-index /
  Gap tie-out invariants preserved them; nothing regressed across six passes.
- **Ask agents to prove a fix was needed.** A2 (stale `sig`), A4 (largest-remainder) and A5 (the only
  string-compare sign site) each verified the premise before changing code — two of the three would
  otherwise have been unfalsifiable claims.
- **Agents self-report bent rules if asked.** Every "Things I bent" section surfaced a real decision
  worth the owner's attention (the `csv(which)` schema collapse, All-cell clear semantics, Escape
  consuming the event before an expanded chart, horizontal scroll on the two widest table layouts).
- **Budget**: ~1.03 M sub-agent tokens for this feature set, and the run ended by hitting the org's
  monthly spend limit. Scope the audit pass on its own next time rather than tail-ending it.
