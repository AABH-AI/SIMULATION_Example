// BtcChart.jsx — Highcharts wrapper (R3: immutable={false}, in-place update).
// Owns its legend + legend interactivity (hover-highlight, click-to-isolate) against its own chart ref,
// mirroring initLegends/legHover/legClick/applyIso from the source. Legend entries are index-aligned with
// the series array (empty-data series keep their slot but their legend span is hidden), so isolation indices
// stay correct on every page.
import { useMemo, useRef, useState, useCallback } from 'react';
import Highcharts from 'highcharts';
import { buildChartOptions, symSvg } from '../engine/chartOptions.js';
import { fmt, niceScale, state } from '../engine/btcEngine.js';

import HcReactPkg from 'highcharts-react-official';
const HighchartsReact = HcReactPkg.HighchartsReact || HcReactPkg.default || HcReactPkg;

function visibleYRange(ch) {
  const vals = [];
  ch.series.forEach((s) => { if (!s.visible) return; (s.yData || []).forEach((v) => { if (v != null && isFinite(v)) vals.push(v); }); });
  if (!vals.length) return null;
  let mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
  const mag = Math.max(Math.abs(mn), Math.abs(mx)), pos = (mn >= 0);
  if (!(mx - mn > mag * 1e-4)) { const c0 = (mn + mx) / 2, hw = (mag || 1) * 0.02; mn = c0 - hw; mx = c0 + hw; if (pos && mn < 0) mn = 0; }
  const ns = niceScale(mn, mx, 5);
  if (ns) return { min: ns.min, max: ns.max, step: ns.step };
  const p0 = (mx - mn) * 0.06; return { min: pos ? Math.max(0, mn - p0) : mn - p0, max: mx + p0, step: undefined };
}

export default function BtcChart({ labels, series, xlab, opts, dark = false, height = 250 }) {
  const chartRef = useRef(null);
  const [iso, setIso] = useState({}); // { seriesIndex: 1 } isolated set

  const options = useMemo(
    () => buildChartOptions(labels, series, (v) => fmt(v), xlab, opts, dark, state.SPLIT_FW),
    [labels, series, xlab, opts, dark],
  );

  const applyIso = useCallback((isoMap) => {
    const ch = chartRef.current && chartRef.current.chart; if (!ch) return;
    const any = Object.keys(isoMap).length > 0;
    ch.series.forEach((s, i) => { s.setVisible(any ? !!isoMap[i] : true, false); });
    const r = visibleYRange(ch); if (r) ch.yAxis[0].update({ min: r.min, max: r.max, tickInterval: r.step || undefined }, false);
    ch.redraw(false);
  }, []);

  const legHover = useCallback((idx) => {
    const ch = chartRef.current && chartRef.current.chart; if (!ch) return;
    if (ch.series[idx] && !ch.series[idx].visible) ch.series[idx].setVisible(true, false);
    const r = visibleYRange(ch); if (r) ch.yAxis[0].update({ min: r.min, max: r.max, tickInterval: r.step || undefined }, false);
    ch.redraw(false);
    ch.series.forEach((s, i) => { s.setState(i === idx ? 'hover' : 'inactive'); });
  }, []);
  const legReset = useCallback(() => {
    const ch = chartRef.current && chartRef.current.chart; if (!ch) return;
    ch.series.forEach((s) => { s.setState(''); });
    applyIso(iso);
  }, [applyIso, iso]);
  const legClick = useCallback((idx) => {
    setIso((prev) => { const next = { ...prev }; if (next[idx]) delete next[idx]; else next[idx] = 1; applyIso(next); return next; });
  }, [applyIso]);

  if (!options) {
    return <div className="cw" style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', fontSize: 11 }}>No data for this selection.</div>;
  }

  const anyIso = Object.keys(iso).length > 0;
  const SYMS = ['circle', 'diamond', 'square', 'triangle', 'triangle-down'];
  return (
    <>
      <div className="lg">
        {series.map((s, i) => {
          const hasData = s.data && s.data.length > 0;
          if (!hasData) return null; // keep slot in chart, hide from legend (index i still valid)
          const sym = s.dash ? 'square' : SYMS[i % SYMS.length];
          const op = !anyIso || iso[i] ? 1 : 0.3;
          return (
            <span key={s.name + i} style={{ opacity: op }} onMouseEnter={() => legHover(i)} onMouseLeave={legReset} onClick={() => legClick(i)}
              dangerouslySetInnerHTML={{ __html: symSvg(sym, s.color) + s.name }} />
          );
        })}
      </div>
      <div className="cw" style={{ height }}>
        <HighchartsReact ref={chartRef} highcharts={Highcharts} options={options} immutable={false} containerProps={{ style: { height: '100%', width: '100%' } }} />
      </div>
    </>
  );
}
