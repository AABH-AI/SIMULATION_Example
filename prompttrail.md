# Prompt Trail & Execution Log

This document tracks the iterative requests made during the design and development of the Supply Chain Goliath dashboard, and how they were resolved.

### Request 1: Initial Mockup Creation
**Prompt:** Create a majestic mockup using specific data headings (Filters: Region, LOB, Fiscal Year/Month/Week, etc. Columns: Forecast Tech ASU, Weekly SR Actuals, MDR Work Orders, etc.). Make it epic, professional, and minimalistic ("less is more"). Use tabs for data sets. Include a dark/light theme switcher. 
**Execution:** Created an initial dark/glassmorphic mockup. Used basic tabs at the top for navigation. Integrated Chart.js and dummy data for the exact headers provided.

### Request 2: Aligning with Provided Image Context
**Prompt:** User expressed that tabs were incorrect based on provided images in the directory (`Home page.png`, `left_panel.png`, `right_filter_panel.png`, `Design_Speicifics.png`). The UI needs a Home Page portal, a left-side accordion navigation panel, and a right-side filter panel reflecting the long lists (M1-M12, W1-W52).
**Execution:** 
- Analyzed images using the `view_file` tool.
- Restructured the HTML to feature a `home-view` (landing portal) and a `dashboard-view`.
- Implemented a Left Accordion navigation panel replicating the "Supply Chain Goliath" structure.
- Implemented a Power BI-style Right Filter Panel with built-in search boxes inside dropdowns to prevent excessive scrolling for the 52 weeks.

### Request 3: Interactive Visuals, No Pie Charts, and Logo Update
**Prompt:** Filters need to actively update the graphs. Clicking different home page tiles should open different designs (not just the same Forecast page). Do NOT use pie charts. Use `ALigned logo.png`.
**Execution:**
- Added `triggerDataUpdate()` JavaScript function to listen to checkbox changes and instantly update KPI text, regenerate table rows, and update Chart.js datasets with simulated variances.
- Created unique module sections (Data Quality -> Line Chart, Demand Profiling -> Stacked Bar, Demand Alerts -> Table).
- Replaced the Doughnut chart with a Horizontal Bar Chart.
- Updated the header to use the actual image logo.

### Request 4: Expand Data Usage & Add "Epic" Features
**Prompt:** Utilize more of the provided data points (Locations, Partners, Queue Names, Bus Reporting). Make it cleaner, use data cards, make it more epic.
**Execution:**
- Created a 3rd page inside Forecast Accuracy called "Location & Partner View".
- Added a new Horizontal chart for MDR Work Orders by Partner.
- Added a detailed data table for Locations, Queues, and Bus Reporting.
- Greatly expanded the right filter panel to include Partner, Location, and Queue checkboxes.

### Request 5: Export & Insights (Addressing LLM Compute Concerns)
**Prompt:** User liked suggestions for "Export to CSV" and "Smart Insights", but was concerned about the computation time of running an AI model on millions of rows.
**Execution:**
- Implemented a purely client-side "Export CSV" button using JavaScript Blob data to instantly download the tables.
- Implemented a rule-based "Smart Insights" banner. Rather than passing millions of rows to an LLM, the JS reads the current aggregated KPI cards (e.g., if Tech ASU > 140K) and instantly displays appropriate plain text alerts/observations in the UI.
