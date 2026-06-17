# Prompt Trail — ISG BPA
> Chronological log of every major request and what was built/fixed. Update after each session.
> Last updated: 2026-06-16

---

## Session 1 — Initial Dashboard (Supply Chain Goliath era)
**Files**: `epic_dashboard_mockup.html`
**What was built**:
- Left accordion nav panel, right Power BI-style filter panel
- Dark/light theme, CSV export, rule-based Smart Insights banner
- No pie charts (replaced with horizontal bar charts)
- Logo: `Aligned logo.png`

---

## Session 2 — Rebranding & Professional Redesign
**Files**: `IBP_Forcasting.html`, `index.html`
**Prompts**:
- "Change IBP to ISG BPA: Business Planning and Analytics in landing page"
- "It is still showing IBP Forcasting view to me — where did you change?"
- "Remove SUPPLY CHAIN INTELLIGENCE"
- "NOW RECREATE UI to make it professional"
- "Only these 4 pages... Forecast Accuracy / Work Orders / Demand Profiling / Demand Planning Alerts / Data Raw"

**What was done**:
- Full title/branding rename throughout `IBP_Forcasting.html` and `index.html`
- Invoked frontend-design plugin; adopted Indigo-Black design system
- Plus Jakarta Sans + IBM Plex Mono font pairing
- Rebuilt left nav, filter chips, breadcrumb, KPI cards

---

## Session 3 — Landing Page + Two New Modules
**Files**: `index.html`, `bend_the_curve.html`, `IBP_Forcasting.html`
**Prompts**:
- "Add 2 more tabs in landing page: Bend the Curve and What If Simulation"
- "Take inspiration for What-If Simulation from enterprise_whatif_forecasting_platform.html"

**What was built**:
- `index.html` redesigned: 3-column Primary Tools grid + searchable All Modules list
- `bend_the_curve.html` created: 8 toggle levers (each with impact %, lag weeks, confidence), target slider, gap-to-target band-fill chart, achievement panel, contribution chart
- What-If Simulation added as native module inside `IBP_Forcasting.html` (moduleId: `whatif`)

---

## Session 4 — Theme Switcher Fix
**Files**: `IBP_Forcasting.html`
**Prompt**: "Fix the dark/light theme switcher — the navigation pane is still in dark theme"

**Root cause**: `[data-theme="light"]` block had `--nav-bg: #0f1328` and `--nav-hover: #1a2040` — still dark navy.
**Fix**: Changed to `--nav-bg: #ffffff` and `--nav-hover: #eef1fc`.
**Also fixed**: `toggleTheme()` only iterated `chartInstances`; added `Object.values(wiCharts).forEach(...)`.

---

## Session 5 — Lovable AI Reference Design for What-If
**Files**: `IBP_Forcasting.html`
**Assets**: `lovable ai format/Whatif Simulation/` (screenshots + prompt.md)
**Prompts**:
- "In What-if simulation in IBP_Forcasting.html I have given you assets in lovable ai format/Whatif Simulation/ — it has everything"
- "These sliders should affect the graphs: APOS Renewal Rate 94.5% / New Contracts Growth +8% / Forecast Modifier +2% / Renewed Units Override"
- "When user adds units it gets comma automatically — 5,00,000"

**What was rebuilt**:
- Monthly axis Feb → Jan (12 months, WI_MONTHS array)
- Band-fill area chart (`fill: '-1'`) for ASU Trend, SR Forecast, Dispatch Forecast
- 3 sliders: APOS Renewal Rate (70–100%), New Contracts Growth (-20–+50%), Forecast Modifier (-15–+25%)
- Renewed Units Override text input with live en-IN comma formatting
- `wiCompute()` calibrated to produce +8.6% ASU lift at default slider values
- Horizontal pipeline bar (APOS Renewals vs New Contracts)
- Audit trail log

---

## Session 6 — Slider → Chart Fix
**Files**: `IBP_Forcasting.html`
**Root cause**: `wiRenderCharts()` was calling Chart.js destroy+recreate on every `oninput` (~60/sec during drag), corrupting the canvas context.
**Fix**: Smart in-place update — if chart instances exist, update `.data.datasets[1].data` and call `.update('none')`; only create on first render.

---

## Session 7 — Push prompt.md Only
**Files**: `lovable ai format/Whatif Simulation/prompt.md`
**Prompt**: "Push it to GitHub" → "Just push that prompt, not those images"
**Result**: Committed and pushed only `prompt.md`; PNG screenshots excluded.

---

## Session 8 — IMP_DOCS Created
**Files**: `IMP_DOCS/HANDOFF.md`, `IMP_DOCS/DESIGN_SYSTEM.md`, `IMP_DOCS/TECHNICAL.md`, `IMP_DOCS/PROMPT_TRAIL.md`
**Prompt**: "Make a handoff.md prompttrail.md all in one single prompt file — which knows everything about the project. Put these in a folder called IMP_DOCS."
**Result**: Replaced stale `handoff.md` + `prompttrail.md` (Supply Chain Goliath era) with 4 focused files in `IMP_DOCS/`.

---

<!-- Add new sessions below this line -->
