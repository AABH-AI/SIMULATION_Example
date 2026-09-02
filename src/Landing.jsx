import './landing.css';

export default function Landing({ onOpenBtc }) {
  return (
    <div className="landing-page">
      <div className="page">
        <header>
          <div className="header-inner">
            <p className="header-eyebrow">Home</p>
            <h1>TET BPA <span>/ Business Planning and Analytics</span></h1>
            <p className="header-sub">Interactive simulation demos and analytical dashboards. Open a primary tool below.</p>
          </div>
        </header>

        <p className="section-label">Primary Tools</p>
        <div className="primary-grid">

          <button type="button" className="primary-card" style={{ '--card-accent': '#0d9488' }} onClick={onOpenBtc}>
            <div className="card-tag">BTC Simulator ✦</div>
            <div className="card-title">BTC Adjustments <span className="new-badge">New</span></div>
            <div className="card-desc">Bend-The-Curve adjustment simulator — reconcile the statistical forecast to SMOD / AOP targets across ASUs, SRs, and Dispatches with live sliders (−150%…+150%, 0 = forecast) and per-week manual overrides.</div>
            <div className="card-footer">
              <span className="card-file">React app</span>
              <span className="card-cta">Open →</span>
            </div>
          </button>

          <a href="./BPA_FORCASTING_MOCK.HTML" className="primary-card" style={{ '--card-accent': '#3a6ef0' }}>
            <div className="card-tag">Active Development ✦</div>
            <div className="card-title">TET BPA — Forecasting Suite <span className="new-badge">Updated</span></div>
            <div className="card-desc">Full forecasting dashboard with Forecast Accuracy (incl. Forecast Trend), Actuals Profiling with demand classification &amp; WoW/MoM/QoQ trends, What-If Simulation, and Data Management. Filter-aware charts respond to FY &amp; Product Group.</div>
            <div className="card-footer">
              <span className="card-file">BPA_FORCASTING_MOCK.HTML</span>
              <span className="card-cta">Open →</span>
            </div>
          </a>

          <div className="primary-card disabled" style={{ '--card-accent': '#9d78f0', cursor: 'default' }}>
            <div className="card-tag">Scenario Planning</div>
            <div className="card-title">What-If Simulation <span className="new-badge">Work in Progress</span></div>
            <div className="card-desc">Slider-driven parametric exploration — adjust renewal rates, contract growth, dispatch conversion, and SR intensity to model scenario outcomes across ASU, revenue, and cost.</div>
            <div className="card-footer">
              <span className="card-file">Coming soon</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
