// Kpi.jsx — one KPI card. Mirrors the original kpi(l,v,s,st,pct) HTML builder.
export default function Kpi({ label, value, sub = '', style, pct, hidden }) {
  if (hidden) return <div className="kp" style={{ visibility: 'hidden' }} />;
  let badge = null;
  if (pct != null && isFinite(pct)) {
    const up = pct >= 0, col = up ? 'var(--gn)' : 'var(--rd)', ar = up ? '▲' : '▼';
    badge = <div className="kchg" style={{ color: col }}>{ar} {(up ? '+' : '') + pct.toFixed(1)}%</div>;
  }
  return (
    <div className="kp">
      <div className="kl">{label}</div>
      <div className="kv" style={style}>{value}</div>
      {badge}
      <div className="ks">{sub}</div>
    </div>
  );
}
