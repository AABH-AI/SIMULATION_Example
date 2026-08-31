// chartOptions.js — pure builder: svgChart(labels, series, yfmt, xlab, opts) → Highcharts options.
// Faithful port of the svgChart config (actual/forecast zone recolor, seg-split series, dashed target,
// niceScale y-axis, in-chart shared tooltip with positioner). No DOM. Consumed by <BtcChart>.
import { fmt, niceScale } from './btcEngine.js';

const FONT_UI = "'Plus Jakarta Sans',sans-serif";
const FONT_MO = "'IBM Plex Mono',monospace";

export function thm(dark) {
  return dark
    ? { grid: '#232a44', axis: '#8a94ad', line: '#2c3460', div: '#3a4470' }
    : { grid: '#eef1fc', axis: '#9099be', line: '#dde2f4', div: '#b4bde8' };
}
export function symSvg(sym, col) {
  let shape;
  if (sym === 'square') shape = '<rect x="1.2" y="1.2" width="7.6" height="7.6"/>';
  else if (sym === 'diamond') shape = '<path d="M5 0.7L9.3 5L5 9.3L0.7 5Z"/>';
  else if (sym === 'triangle') shape = '<path d="M5 1L9 8.6L1 8.6Z"/>';
  else if (sym === 'triangle-down') shape = '<path d="M1 1.4L9 1.4L5 9Z"/>';
  else shape = '<circle cx="5" cy="5" r="4.3"/>';
  return '<svg width="10" height="10" viewBox="0 0 10 10" style="vertical-align:middle;flex:0 0 auto" fill="' + col + '">' + shape + '</svg>';
}

const SYMS = ['circle', 'diamond', 'square', 'triangle', 'triangle-down'];

// Returns { options } or null when there is no data to plot.
export function buildChartOptions(labels, series, yfmt, xlab, opts, dark, splitFW) {
  opts = opts || {};
  yfmt = yfmt || ((v) => fmt(v));
  const hasData = series && series.length && labels.length && series.some((s) => s.data && s.data.length);
  if (!hasData) return null;

  const n = labels.length;
  let splitPos = -1;
  for (let i = 0; i < n; i++) { if (labels[i] <= splitFW) splitPos = i; }
  const sp = Math.max(splitPos, 0);

  function mkData(ser) {
    if (ser.seg === 'forecast') return ser.data.map((v, i) => (i < sp ? null : v));
    if (ser.seg === 'actual') return ser.data.map((v, i) => ((splitPos >= 0 && i > splitPos) ? null : v));
    return ser.data.slice();
  }

  const hcSeries = series.map((ser, si) => {
    const sym = ser.dash ? 'square' : SYMS[si % SYMS.length];
    const dat = mkData(ser);
    let _nn = 0; for (let k = 0; k < dat.length; k++) { if (dat[k] != null && isFinite(dat[k])) _nn++; }
    const _mk = _nn > 0 && _nn <= 2;
    const o = {
      name: ser.name || '', data: dat, lineWidth: ser.dash ? 1.5 : 2, connectNulls: false,
      marker: { enabled: _mk, radius: 3.5, symbol: sym, states: { hover: { enabled: true, radius: 4, lineColor: '#fff', lineWidth: 1 } } },
      _ac: ser.color, _fc: ser.fcColor || ser.color, _sym: sym,
    };
    if (ser.dash) { o.color = ser.color; o.dashStyle = 'Dash'; o._fc = ser.color; return o; }
    if (ser.seg) { o.color = ser.color; o._fc = ser.color; return o; }
    if (splitPos < 0) { o.color = ser.fcColor || '#ea580c'; o._ac = o._fc; }
    else if (splitPos >= n - 1) { o.color = ser.color; o._fc = ser.color; }
    else { o.color = ser.color; o.zoneAxis = 'x'; o.zones = [{ value: splitPos, color: ser.color }, { color: ser.fcColor || '#ea580c' }]; }
    return o;
  });

  // shared tight y-range via niceScale
  const allV = []; hcSeries.forEach((s) => { s.data.forEach((v) => { if (v != null && isFinite(v)) allV.push(v); }); });
  let yMin = null, yMax = null, yStep = null; const yT = opts.yTicks || 5;
  if (allV.length) {
    let mn = Math.min.apply(null, allV), mx = Math.max.apply(null, allV);
    const mag = Math.max(Math.abs(mn), Math.abs(mx)), pos = (mn >= 0);
    if (!(mx - mn > mag * 1e-4)) { const c0 = (mn + mx) / 2, hw = (mag || 1) * 0.02; mn = c0 - hw; mx = c0 + hw; if (pos && mn < 0) mn = 0; }
    const ns = niceScale(mn, mx, yT);
    if (ns) { yMin = ns.min; yMax = ns.max; yStep = ns.step; }
    else { const p0 = (mx - mn) * 0.06; yMin = mn - p0; yMax = mx + p0; if (pos) yMin = Math.max(0, yMin); }
  }

  const T = thm(dark);
  const plotLines = [];
  if (splitPos >= 0 && splitPos < n - 1) plotLines.push({ value: splitPos, color: T.div, width: 1, dashStyle: 'Dash', zIndex: 3, label: { text: 'forecast →', rotation: 0, y: 12, style: { color: T.axis, fontSize: '8px', fontFamily: FONT_UI } } });

  const xCfg = { categories: labels, lineColor: T.line, tickColor: T.div, tickLength: 6, tickWidth: 1, tickPosition: 'outside', crosshair: { width: 1, color: T.div, dashStyle: 'Dash' }, plotLines };
  const lb = { style: { color: T.axis, fontSize: '9px' } };
  if (xlab) { const tp = []; for (let q = 0; q < xlab.length; q++) if (xlab[q] !== '') tp.push(q); xCfg.tickPositions = tp; lb.formatter = function () { return xlab[this.pos] || ''; }; }
  else lb.step = Math.max(1, Math.ceil(n / 8));
  xCfg.labels = lb;

  return {
    chart: { type: 'line', backgroundColor: 'transparent', style: { fontFamily: FONT_UI }, spacing: [8, 6, 4, 4], animation: false },
    title: { text: null }, credits: { enabled: false }, legend: { enabled: false },
    xAxis: xCfg,
    yAxis: {
      title: { text: null }, gridLineColor: T.grid, startOnTick: false, endOnTick: false,
      min: yMin, max: yMax, tickInterval: yStep || undefined, maxPadding: 0, minPadding: 0,
      labels: { formatter: function () { return yfmt(this.value); }, style: { color: T.axis, fontSize: '9px', fontFamily: FONT_MO } },
    },
    tooltip: {
      shared: true, useHTML: true, outside: false, hideDelay: 0, backgroundColor: '#0d1020', borderWidth: 0, borderRadius: 6, shadow: false, padding: 9,
      style: { color: '#fff', fontFamily: FONT_MO, fontSize: '10px' },
      positioner: function (w, h, pt) {
        const ch = this.chart, gap = 12;
        const cx = ch.plotLeft + (pt.plotX || 0);
        const loX = cx - w / 2 - 4, hiX = cx + w / 2 + 4;
        let topY = Infinity, botY = -Infinity;
        ch.series.forEach((s) => {
          if (!s.visible || !s.points) return;
          s.points.forEach((p) => {
            if (p.plotX == null || p.plotY == null) return;
            const pxc = ch.plotLeft + p.plotX;
            if (pxc >= loX && pxc <= hiX) { const pyc = ch.plotTop + p.plotY; if (pyc < topY) topY = pyc; if (pyc > botY) botY = pyc; }
          });
        });
        if (!isFinite(topY)) { topY = botY = ch.plotTop + (pt.plotY || 0); }
        let x = cx - w / 2;
        let y = topY - h - gap;
        if (y < ch.plotTop + 2) y = botY + gap;
        x = Math.max(2, Math.min(x, ch.chartWidth - w - 2));
        y = Math.max(2, Math.min(y, ch.chartHeight - h - 2));
        return { x, y };
      },
      formatter: function () {
        let h = '<div style="opacity:.65;margin-bottom:4px">' + this.x + '</div>';
        h += '<div style="display:grid;grid-template-columns:auto auto;column-gap:18px;row-gap:3px;align-items:center">';
        this.points.forEach((p) => {
          const uo = p.series.userOptions, col = (splitPos >= 0 && p.point.x > splitPos && uo._fc) ? uo._fc : uo._ac;
          h += '<span style="display:inline-flex;align-items:center;gap:6px">' + symSvg(uo._sym, col) + p.series.name + '</span><span style="text-align:right">' + yfmt(p.y) + '</span>';
        });
        return h + '</div>';
      },
    },
    plotOptions: { series: { animation: false }, line: { states: { hover: { lineWidthPlus: 0, halo: { size: 5 } } } } },
    series: hcSeries,
  };
}
