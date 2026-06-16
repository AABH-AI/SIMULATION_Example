# Design System — ISG BPA
> Indigo-Black design language. Last updated: 2026-06-16

## Fonts
```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```
- **UI / Display**: `Plus Jakarta Sans` — all headings, body, labels
- **Numbers / Mono**: `IBM Plex Mono` — KPI values, code, file names

## CSS Tokens

```css
:root {
  /* Backgrounds */
  --bg: #07090f;
  --surface: #0d1018;
  --card: #111521;
  --card-hi: #161c2c;

  /* Borders */
  --border: #1d2135;
  --border-hi: #2c3460;

  /* Text */
  --text-1: #e9ecf7;   /* primary */
  --text-2: #6b758f;   /* secondary */
  --text-3: #3a4060;   /* muted / disabled */

  /* Accent palette */
  --accent: #4c7ef8;
  --accent-dim: rgba(76,126,248,0.08);
  --blue: #4c7ef8;      --blue-dim: rgba(76,126,248,0.08);
  --green: #22d472;     --green-dim: rgba(34,212,114,0.10);
  --red: #f06060;       --red-dim: rgba(240,96,96,0.10);
  --amber: #f0a830;     --amber-dim: rgba(240,168,48,0.10);
  --purple: #9d78f0;

  /* Navigation */
  --nav-bg: #0a0c16;
  --nav-hover: #13172a;

  /* Typography */
  --font-ui: 'Plus Jakarta Sans', sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
}

/* Light theme — MUST override every dark token above */
[data-theme="light"] {
  --bg: #f0f3fc;
  --surface: #ffffff;
  --card: #ffffff;
  --card-hi: #eef1fc;
  --border: #dde2f4;
  --border-hi: #b4bde8;
  --text-1: #0d1020;
  --text-2: #5a6280;
  --text-3: #9099be;
  --accent: #3a6ef0;
  --accent-dim: rgba(58,110,240,0.07);
  --blue: #3a6ef0;      --blue-dim: rgba(58,110,240,0.07);
  --green: #16a34a;     --green-dim: rgba(22,163,74,0.09);
  --red: #dc2626;       --red-dim: rgba(220,38,38,0.09);
  --amber: #b45309;     --amber-dim: rgba(180,83,9,0.09);
  --purple: #6d28d9;
  --nav-bg: #ffffff;      /* was #0f1328 — caused nav to stay dark in light mode */
  --nav-hover: #eef1fc;   /* was #1a2040 */
}
```

## Primary Tool Card Accents (index.html)
| Tool | `--card-accent` |
|---|---|
| ISG BPA (IBP_Forcasting.html) | `#4c7ef8` blue |
| What-If Simulation | `#9d78f0` purple |
| Bend the Curve | `#22d472` green |

## Chart.js
- **Version**: 4.4.1 (CDN)
- **Band fill**: `fill: '-1'` — fills between two datasets (base line and adjusted line)
- **No animation on slider drag**: `.update('none')` for performance
- **Theme update**: `updateChartTheme(chartInstance)` then `.update()` — must be called for BOTH `chartInstances` and `wiCharts` stores on theme toggle

## Icon Library
Tabler Icons via CDN: `<link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css" rel="stylesheet">`
Usage: `<i class="ti ti-moon"></i>`

## Number Formatting
- **Indian commas**: `n.toLocaleString('en-IN')` → `5,00,000`
- Input must be `type="text" inputmode="numeric"` — NOT `type="number"` (number inputs reject comma values)
