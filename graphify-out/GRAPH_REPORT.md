# Graph Report - D:\Repos\SIMULATION_Example  (2026-07-27)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 64 nodes · 105 edges · 8 communities (7 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 400 input · 544 output

## Community Hubs (Navigation)
- Forecasting Factor Config
- Forecast Computation
- Manifest Management
- Chart Rendering
- Chart Theming
- Project Configuration
- State and Filters
- Overrides & Sensitivity

## God Nodes (most connected - your core abstractions)
1. `fcGenerateHistory()` - 8 edges
2. `fcGenerateWeeklySeries()` - 7 edges
3. `fcCompute()` - 7 edges
4. `fcHCAxes()` - 5 edges
5. `main()` - 5 edges
6. `fcSeedFor()` - 4 edges
7. `fcSum()` - 4 edges
8. `fcAvg()` - 4 edges
9. `fcDistributeWeekly()` - 4 edges
10. `fcApplyTheme()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `fcCompute()` --calls--> `fcApplyOverrides()`  [EXTRACTED]
  forecast_copilot/fc_engine.js → forecast_copilot/fc_engine.js  _Bridges community 7 → community 1_
- `fcHCAxes()` --calls--> `fcAxisColors()`  [EXTRACTED]
  forecast_copilot/fc_engine.js → forecast_copilot/fc_engine.js  _Bridges community 4 → community 3_

## Import Cycles
- None detected.

## Communities (8 total, 1 thin omitted)

### Community 0 - "Forecasting Factor Config"
Cohesion: 0.13
Nodes (12): FC_BUSINESS_FACTOR, FC_COREUPSELL_FACTOR, FC_DEFAULT_STATE, FC_FQM_FACTOR, FC_GCFA_FACTOR, FC_LOB_FACTOR, FC_REGION_FACTOR, FC_SERVICE_FACTOR (+4 more)

### Community 1 - "Forecast Computation"
Cohesion: 0.20
Nodes (15): fcAvg(), fcCombinedFactor(), fcCompute(), fcDispatchRatio(), fcDistributeWeekly(), fcGenerateHistory(), fcGenerateWeeklySeries(), fcHash() (+7 more)

### Community 2 - "Manifest Management"
Cohesion: 0.29
Nodes (9): fs, gatherHtmlFiles(), getLatestAutoPage(), main(), manifestPath, path, readManifest(), root (+1 more)

### Community 3 - "Chart Rendering"
Cohesion: 0.38
Nodes (7): fcDefaultFmt(), fcDrawGroupedBars(), fcDrawLineSeries(), fcHCAxes(), fcHCContainer(), fcHCTooltip(), fcN()

### Community 4 - "Chart Theming"
Cohesion: 0.40
Nodes (6): fcApplyTheme(), fcAxisColors(), fcCurrentTheme(), fcRethemeCharts(), fcSyncThemeBtn(), fcToggleTheme()

### Community 5 - "Project Configuration"
Cohesion: 0.33
Nodes (5): name, private, scripts, update-manifest, version

### Community 6 - "State and Filters"
Cohesion: 0.67
Nodes (3): fcSaveState(), fcSetFilter(), fcWireFilters()

## Knowledge Gaps
- **20 isolated node(s):** `FILTER_OPTIONS`, `FC_DEFAULT_STATE`, `fcState`, `FC_REGION_FACTOR`, `FC_LOB_FACTOR` (+15 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `fcGenerateHistory()` connect `Forecast Computation` to `Forecasting Factor Config`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `fcGenerateWeeklySeries()` connect `Forecast Computation` to `Forecasting Factor Config`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **Why does `fcCompute()` connect `Forecast Computation` to `Forecasting Factor Config`, `Overrides & Sensitivity`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **What connects `FILTER_OPTIONS`, `FC_DEFAULT_STATE`, `fcState` to the rest of the system?**
  _20 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Forecasting Factor Config` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._