// Kpi.jsx — one KPI card. Mirrors the original kpi(l,v,s,st,pct) HTML builder.
// flatZero: a change that rounds to 0.0% shows grey with no arrow (instead of a green ▲ +0.0%).
export default function Kpi({ label, value, sub = '', style, pct, hidden, flatZero }) {
  if (hidden) return <div className="kp" style={{ visibility: 'hidden' }} />;
  let badge = null;
  if (pct != null && isFinite(pct)) {
    if (flatZero && Math.abs(pct) < 0.05) badge = <div className="kchg" style={{ color: 'var(--t3)' }}>0.0%</div>;
    else {
      const up = pct >= 0, col = up ? 'var(--gn)' : 'var(--rd)', ar = up ? '▲' : '▼';
      badge = <div className="kchg" style={{ color: col }}>{ar} {(up ? '+' : '') + pct.toFixed(1)}%</div>;
    }
  }
  return (
    <div className="kp">
      <div className="kl">{label}</div>
      {/* value left, ▲/▼ % change right on the same row */}
      <div className="kvrow">
        <div className="kv" style={style}>{value}</div>
        {badge}
      </div>
      <div className="ks">{sub}</div>
    </div>
  );
}
