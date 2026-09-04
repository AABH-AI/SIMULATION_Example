// RateView.jsx — shared SR / Dispatches rate sheet (Step 2). Driven by `kind` ('sr'|'disp').
// Mirrors renderRate(): segment tabs, 6-card KPIs, chart, editable Adj table, modifier/AOP/target controls.
import { useBtc } from '../store/useBtc.js';
import { fmt, shortFW, getCmtRate } from '../engine/btcEngine.js';
import BtcChart from './BtcChart.jsx';
import Kpi from './Kpi.jsx';
import CommentCell from './CommentCell.jsx';
import ExpandableCard from './ExpandableCard.jsx';

export default function RateView({ kind, dark }) {
  const version = useBtc((s) => s.version);
  const setSegMod = useBtc((s) => s.setSegMod);
  const selectSeg = useBtc((s) => s.selectSeg);
  const editRate = useBtc((s) => s.editRate);
  const setTarget = useBtc((s) => s.setTarget);
  const aopSync = useBtc((s) => s.aopSync);
  const segReset = useBtc((s) => s.segReset);
  const setCmtRate = useBtc((s) => s.setCmtRate);
  const goTab = useBtc((s) => s.goTab);
  const stepTo = useBtc((s) => s.stepTo);
  const tblReset = useBtc((s) => s.tblReset);
  void version;

  const v = useBtc.getState().computeRate(kind);
  const aopMax = useBtc.getState().aopSliderMax(kind);
  const commitEnter = (e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } };
  const u = kind === 'disp' ? 'Disp' : 'SR';
  const dsName = kind === 'disp' ? 'DISP Actuals' : 'SR Actuals';
  const adjHdr = kind === 'disp' ? 'Adj Disp' : 'Adj SRs';

  // segment tabs always render (even when empty view)
  const segTabs = (
    <div className="segbar">
      {v.segList && v.segList.map((s, i) => (
        <button key={s.l} className={'segt' + (i === v.segIdx ? ' on' : '')} disabled={i > 0} onClick={() => selectSeg(kind, i)}>{s.l}</button>
      ))}
    </div>
  );

  if (v.empty) {
    return <div className="view on">{segTabs}<div className="card">No weeks in this selection.</div></div>;
  }

  const k = v.kpi;
  const targetPct = (v.target * 100).toFixed(2);
  const aratePct = (k.arate * 100).toFixed(2);
  const grP = (+aratePct - +targetPct).toFixed(2);

  return (
    <div className="view on">
      {segTabs}
      {/* KPI row (6-card set; adjusted cards only when showAdj) */}
      <div className="kr kr6">
        <Kpi label={u + ' DS Forecast'} value={fmt(k.tBase)} pct={k.cbBase} />
        {v.showAdj && <Kpi label={u + ' BTC Adjusted'} value={fmt(k.tAdj)} style={{ color: 'var(--ac)' }} pct={k.cbAdj} />}
        <Kpi label="AOP Target" value={fmt(k.tgtN)} />
        <Kpi label="MDR Rate" value={(k.frate * 100).toFixed(2) + '%'} />
        {v.showAdj && <Kpi label="Adjusted Rate" value={(k.arate * 100).toFixed(2) + '%'} style={{ color: k.gc }} />}
        {v.showAdj && <Kpi label="Gap" value={(k.gapN >= 0 ? '+' : '') + fmt(k.gapN)} style={{ color: k.gc }} />}
      </div>

      <div className="row">
        {/* chart + table */}
        <ExpandableCard>
          <h3>{u === 'Disp' ? 'Dispatches' : 'SRs'} — DS vs Adjusted vs Target</h3>
          <BtcChart labels={v.chart.labels} series={v.chart.series} xlab={v.chart.xlab} dark={dark} />
          <div className="twwrap">
          <button className="tblreset" onClick={() => tblReset(kind)} title="Reset table edits">↺</button>
          <div className="tw">
            <table>
              <thead>
                {v.showAdj
                  ? <tr><th className="l">FW</th><th>{dsName}</th><th>{adjHdr}</th><th>Delta</th>{v.anyEd && <th className="cmt" style={{ width: 160 }}>Comment</th>}</tr>
                  : <tr><th className="l">FW</th><th>{dsName}</th></tr>}
              </thead>
              <tbody>
                {v.rows.map((r) => (
                  <tr key={r.fw} className={r.isA ? 'act' : (r.edited ? 'edt' : '')}>
                    <td className="l">{shortFW(r.fw)}</td>
                    <td>{fmt(r.base)}</td>
                    {v.showAdj && <><td style={{ color: '#ea580c' }}>{r.isA ? '—' : <input className="ec" defaultValue={fmt(r.adj)} key={'r' + r.fw + version} onBlur={(e) => editRate(kind, v.segIdx, r.fw, e.target.value)} onKeyDown={commitEnter} />}</td>
                      <td>{r.isA ? '—' : ((r.delta >= 0 ? '+' : '') + fmt(r.delta))}</td>
                      {v.anyEd && <CommentCell edited={r.edited} read={() => getCmtRate(kind, v.segIdx, r.fw)} write={(val) => setCmtRate(kind, v.segIdx, r.fw, val)} />}</>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </ExpandableCard>

        {/* controls */}
        <div className="card ctl">
          <h3><span>Controls</span><span className="hdbtns"><button className="btn dis reset-btn" onClick={() => segReset(kind)}>Reset</button></span></h3>
          {!v.actualsOnly && (
            <div className="mb blue"><h4 style={{ color: 'var(--ac)' }}>{u === 'Disp' ? 'Dispatches' : 'SRs'}</h4>
              <div className="sl sl-b">
                <input type="range" min={0} max={150} step={0.25} value={v.shown} onChange={(e) => setSegMod(kind, e.target.value)} />
                <input type="number" min={0} max={150} step={0.25} value={v.shown} onChange={(e) => setSegMod(kind, e.target.value)} />
                <span style={{ fontWeight: 700, color: 'var(--ac)' }}>%</span>
              </div>
            </div>
          )}
          <div className="mb amber mb-aop"><h4 style={{ color: 'var(--am)' }}>AOP Target</h4>
            <div className="sl sl-a"><input type="range" value={Math.min(v.tgtWeekly, aopMax)} min={0} max={aopMax} onChange={(e) => aopSync(kind, e.target.value)} /><input type="number" value={v.tgtWeekly} min={0} max={aopMax} onChange={(e) => aopSync(kind, e.target.value)} /></div>
          </div>
          <div className="gap"><span>Adjusted rate</span><b>{aratePct}%</b></div>
          <div className="gap"><span>Target rate</span>
            <input className="ec tgtbox" defaultValue={v.mo != null ? v.mo.toFixed(2) + '%' : ''} placeholder={targetPct + '%'} key={'tgt' + kind + version} onBlur={(e) => setTarget(kind, e.target.value)} onKeyDown={commitEnter} />
          </div>
          <div className="bar"><div style={{ width: Math.max(4, Math.min(100, k.arate ? v.target / k.arate * 100 : 0)) + '%' }} /></div>
          <div className="gap"><span>Gap</span><b style={{ color: k.gc }}>{(grP >= 0 ? '+' : '') + grP + '%'}</b></div>
          <div className="btnrow">
            {kind === 'disp'
              ? <button className="btn dis" onClick={() => goTab('sr')}>← Switch to SRs</button>
              : <button className="btn dis" onClick={() => goTab('disp')}>Switch to Dispatches →</button>}
          </div>
          <div className="btnrow">
            <button className="btn dis" onClick={() => stepTo(1)}>← Step 1 (ASU)</button>
            <button className="btn pub" onClick={() => stepTo(3)}>Step 3 (Publish) →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
