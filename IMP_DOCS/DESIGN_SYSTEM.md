# Design System — ISG BPA
> Indigo-Black design language (light theme in BPA_FORCASTING_MOCK.HTML). Last updated: 2026-06-22

---

## Fonts
```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```
- **UI / Display**: `Plus Jakarta Sans` — all headings, body, labels, buttons
- **Numbers / Mono**: `IBM Plex Mono` — KPI values, stat tile values, code snippets

---

## CSS Tokens

### BPA_FORCASTING_MOCK.HTML (Light — permanent, no dark mode)
```css
:root {
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
  --green: #16a34a;
  --red: #dc2626;
  --amber: #d97706;
  --purple: #6d28d9;
  --nav-bg: #ffffff;
  --nav-hover: #eef1fc;
}
/* isDark = false hardcoded — no dark mode toggle */
```

### IBP_Forcasting.html (Dark/Light toggleable)
```css
:root {  /* dark default */
  --bg: #07090f;  --surface: #0d1018;  --card: #111521;  --card-hi: #161c2c;
  --border: #1d2135;  --border-hi: #2c3460;
  --text-1: #e9ecf7;  --text-2: #6b758f;  --text-3: #3a4060;
  --accent: #4c7ef8;  --green: #22d472;  --red: #f06060;  --amber: #f0a830;
  --nav-bg: #0a0c16;  --nav-hover: #13172a;
}
[data-theme="light"] { /* overrides all — both stores must be updated on toggle */ }
```

---

## Icons
Tabler Icons via CDN:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css">
```
Examples: `ti-home`, `ti-adjustments-horizontal`, `ti-chevron-down`, `ti-alert-triangle`

---

## Number Formatting
```js
// Indian comma format: 5,00,000 not 500,000
n.toLocaleString('en-IN')

// For inputs accepting commas:
// type="text" inputmode="numeric"  — NOT type="number"
```

---

## Chart.js 4.4.1 Patterns

### CDN
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>
```
> **Note**: Highcharts was trialled in session 14 for the quadrant charts but reverted — Highcharts charts failed to render in hidden flexbox containers. Stick with Chart.js.

### Axis Colors (theme-aware)
```js
function gridColor() { return isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'; }
function axisColor() { return isDark ? '#6b758f' : '#5a6280'; }
```

### Zero-Reference Gridline (no annotation plugin needed)
```js
y: { grid: { color: ctx => ctx.tick.value === 0 ? 'rgba(0,0,0,0.2)' : gridColor() } }
```

### Dashed / Dotted Lines
```js
borderDash: [8, 4]   // long dash ——  (used for Forecast)
borderDash: [3, 3]   // short dot ··· (used for Adjusted Forecast)
// NOTE: borderDash is a Chart.js dataset property (not CSS)
```

### SVG Inline Legend (exact dash patterns)
For charts where dashes must be visually accurate, use SVG in the card header:
```html
<svg width="26" height="10">
  <line x1="0" y1="5" x2="26" y2="5" stroke="#16a34a" stroke-width="2" stroke-dasharray="8 4"/>
</svg>Forecast
```

### Inline Plugin Pattern (vertical line at a specific index)
```js
const myPlugin = {
  id: 'unique_plugin_id',
  afterDraw(chart) {
    if (chart.canvas.id !== 'target-canvas-id') return;
    const { ctx, chartArea: { top, bottom }, scales: { x } } = chart;
    const px = x.getPixelForValue(TODAY_IDX);
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = 'rgba(58,110,240,0.4)'; ctx.lineWidth = 1.5;
    ctx.moveTo(px, top); ctx.lineTo(px, bottom); ctx.stroke();
    ctx.restore();
  }
};
new Chart(el, { type:'line', plugins:[myPlugin], data:{...}, options:{...} });
```

### Mixed Bar + Line (Demand Trends / Forecast Error)
```js
new Chart(el, {
  type: 'bar',
  data: { datasets: [
    { type: 'bar',  label: 'Demand',    data: [...], backgroundColor: [...], yAxisID: 'y' },
    { type: 'line', label: '% Change',  data: [...], borderDash: [5,3],      yAxisID: 'y1' }
  ]},
  options: { scales: {
    y:  { position: 'left', ... },
    y1: { position: 'right', grid: { display: false }, ... }
  }}
});
```

### In-Place Update (no destroy/recreate)
```js
// Preferred for filter updates and slider drag — avoids canvas corruption
chart.data.datasets[0].data = newData;
chart.update('none');  // 'none' = instant, no animation
```

---

## Layout Components

### Card / Visual Card
```html
<div class="visual-card">             <!-- single card, full-width -->
<div class="visual-row">             <!-- flex row of cards -->
  <div class="visual-card">          <!-- grows equally by default -->
  <div class="visual-card" style="flex:1.8">  <!-- wider card in 2-col layout -->
```

### KPI Cards
```html
<div class="kpi-row">
  <div class="kpi-card">
    <div class="kpi-label">Label</div>
    <div class="kpi-value kpi-dynamic" style="color:var(--accent)">Value</div>
    <div class="kpi-sub" style="color:var(--text-2)">Sub-text</div>
  </div>
</div>
```
> `kpi-dynamic` class marks cards that `triggerDataUpdate()` will randomly fluctuate.

### Stat Tiles (Forecast Trend right panel)
```html
<div class="ft-stats-grid">          <!-- 2×2 grid -->
  <div class="ft-stat-tile">
    <div class="ft-stat-tile-label">MAPE</div>
    <div class="ft-stat-tile-value" id="ft-mape">—</div>
    <div class="ft-stat-tile-sub">Mean abs % error</div>
  </div>
</div>
```
`.ft-stat-tile-value` uses IBM Plex Mono at 20px for the number.

### CV Info Button + Tooltip
```html
<div class="cv-tooltip-wrap">
  <span class="dp-x-text">Coefficient of Variation (Demand)</span>
  <button class="cv-info-btn" onclick="toggleCVTooltip(event)">i</button>
  <div id="cv-tooltip-box" class="cv-tooltip-box" style="display:none;">
    <!-- content -->
  </div>
</div>
```
`.cv-info-btn` is a 16×16 circular button with `--accent` border. `.cv-tooltip-box` is `position:absolute; bottom: calc(100% + 10px)` relative to `.cv-tooltip-wrap`.

---

## No-Pie Rule
**Never use pie or donut charts.** Use horizontal bar charts instead.

---

## Demand Classification Colors
| Category | Color | Hex |
|---|---|---|
| Consistent | Green | `#16a34a` |
| Erratic | Amber | `#d97706` |
| Intermittent | Blue | `#2563eb` |
| Lumpy | Pink | `#db2777` |

## Forecast Trend Colors
| Series | Color | Hex | Style |
|---|---|---|---|
| Actuals | Blue (accent) | `#3a6ef0` | Solid line + fill |
| Forecast | Green | `#16a34a` | Dashed `[8,4]` |
| Adjusted Forecast | Amber | `#d97706` | Dotted `[3,3]` |
| AOP Target | Indigo | `#6366f1` | Dash-dot `[10,3,3,3]` |
| Over-forecast bar | Green | `rgba(22,163,74,0.75)` | Column fill |
| Under-forecast bar | Red | `rgba(220,38,38,0.72)` | Column fill |

## Product Group Colors (data.html LOB column)
| Group | Hex |
|---|---|
| ISG | `#3a6ef0` |
| ESG | `#16a34a` |
| HES | `#7c3aed` |

## Animated Counter Pattern
For hero scores where a single number is the key insight (e.g. data health %). Count up from 0 using `requestAnimationFrame` with quadratic ease-in-out. One moment per page — nothing else animates.
```js
const ease = t => t < .5 ? 2*t*t : -1+(4-2*t)*t;
// Always respect prefers-reduced-motion: skip animation if media query matches
```

## Completeness Bar Pattern
Render at `width:0%` first, then flip to target in a `requestAnimationFrame` callback. CSS `transition: width 0.7s cubic-bezier(.4,0,.2,1)` handles the visual. Colour threshold: ≥99% green, ≥95% amber, else red.
