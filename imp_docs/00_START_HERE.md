# START HERE — read this folder first

**Every session, before doing anything: read ALL files in `imp_docs/`.**
This folder is the project's persistent memory across sessions.

## Files
- `00_START_HERE.md` — this index + the rules.
- `REACT_MIGRATION_PLAN.md` — the migration plan (deps, roadblocks R1–R12, phases P0–P5). The spec.
- `SESSION_CONTEXT.md` — current state of the project. Living snapshot: what is true *now*
  (folders, deps, how to run, what's done, open issues). Read to get up to speed.
- `PROMPT_TRAIL.md` — chronological history. One entry per session: date, what was asked,
  what was done, outcome. Append-only.
- `TASKS.md` — task board. What's done / doing / next, mapped to plan phases. Mutable.

## What this project is
Porting `../../template_ui/btc_adjustment_simulator_v2.html` (2260-line single HTML file)
to a React base. Source of truth for the target behavior = that HTML file + the plan.

## Layout
```
btc_react_simulator/
  app/          ← the React app (Vite). Run from here.
  imp_docs/     ← this folder. Trails + plan.
```

## Rules (keep doing these unless the user says otherwise)
1. **Start of session:** read every file in `imp_docs/`.
2. **After meaningful work:** update `SESSION_CONTEXT.md` (edit changed sections so it stays a
   correct *current* snapshot), append a dated entry to `PROMPT_TRAIL.md`, and update `TASKS.md`.
3. **SESSION_CONTEXT + TASKS = now** (mutable). **PROMPT_TRAIL = history** (append, never rewrite).
4. Default is **always update**. Stop only if the user explicitly says so.
5. Keep entries terse and technical. Exact file names, commands, error strings verbatim.
6. Target-behavior fidelity: the original HTML is the spec. Copy CSS verbatim, don't refactor.
