// PubView.jsx — Publish page (Step 3). Forecast-window summary: KPI row, 5 charts, editable summary table,
// CSV export. Mirrors renderPub(). Edits round-trip into the same stores as the source pages.
import { useState } from 'react';
import { useBtc } from '../store/useBtc.js';
import { fmt, shortFW, getCmtPub } from '../engine/btcEngine.js';
import BtcChart from './BtcChart.jsx';
import Kpi from './Kpi.jsx';
import CommentCell from './CommentCell.jsx';
import AllocationModal from './AllocationModal.jsx';

export default function PubView({ dark }) {
  const version = useBtc((s) => s.version);
  const editAsu = useBtc((s) => s.editAsu);
  const editRate = useBtc((s) => s.editRate);
  const tblReset = useBtc((s) => s.tblReset);
  const exportPublished = useBtc((s) => s.exportPublished);
  const setCmtPub = useBtc((s) => s.setCmtPub);
  const stepTo = useBtc((s) => s.stepTo);
  const [alloc, setAlloc] = useState(null);
  void version;
  const commitEnter = (e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } };

  const v = useBtc.getState().computePubView();
  if (v.empty) return <div className="view on"><div className="card">No forecast weeks to publish.</div></div>;
  const k = v.kpi, fy = v.fyLbl, di = v.declImported;

  function doExport() { exportPublished(); }

  return (
    <div className="view on">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 12px' }}>
        <div className="ks">Publish — {fy} forecast window</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn dis" style={{ flex: '0 0 auto', padding: '8px 14px' }} onClick={() => stepTo(2)}>← Back to Step 2</button>
          <button className="btn dis" style={{ flex: '0 0 auto', padding: '8px 14px' }} onClick={() => setAlloc({ which: 'sr', total: v.showAdj ? k.aSR : k.fSR })}>⊞ SR allocation</button>
          <button className="btn dis" style={{ flex: '0 0 auto', padding: '8px 14px' }} onClick={() => setAlloc({ which: 'disp', total: v.showAdj ? k.aDisp : k.fDisp })}>⊞ Disp allocation</button>
          <button className="btn pub" style={{ flex: '0 0 auto', padding: '8px 18px' }} onClick={doExport}>⤓ Export published CSV</button>
        </div>
      </div>
      {alloc && <AllocationModal which={alloc.which} total={alloc.total} onClose={() => setAlloc(null)} />}

      {/* KPI row */}
      <div className="kr" style={{ gridTemplateColumns: `repeat(${di ? 6 : 5},minmax(0,1fr))` }}>
        <Kpi label={`New Contracts (${fy})`} value={fmt(k.fNC)} style={{ color: '#3a6ef0' }} />
        {di && <Kpi label={`Declines (${fy})`} value={fmt(k.fDecl)} style={{ color: '#8b0000' }} />}
        <Kpi label={`APOS Renewals (${fy})`} value={fmt(k.fAP)} style={{ color: '#6d28d9' }} />
        <Kpi label={`ASU (${fy})`} value={fmt(k.fASU)} sub="end of window" style={{ color: '#16a34a' }} />
        <Kpi label={`SRs (${fy})`} value={fmt(k.fSR)} style={{ color: '#38bdf8' }} />
        <Kpi label={`Dispatches (${fy})`} value={fmt(k.fDisp)} style={{ color: '#6b4423' }} />
        {v.showAdj && <>
          <Kpi label={`Adj New Contracts (${fy})`} value={fmt(k.aNC)} style={{ color: '#ea580c' }} />
          {di && <Kpi hidden />}
          <Kpi label={`Adj APOS Renewals (${fy})`} value={fmt(k.aAP)} style={{ color: '#ea580c' }} />
          <Kpi label={`Adjusted ASU (${fy})`} value={fmt(k.aASU)} sub="end of window" style={{ color: '#ea580c' }} />
          <Kpi label={`Adjusted SRs (${fy})`} value={fmt(k.aSR)} style={{ color: '#ea580c' }} />
          <Kpi label={`Adjusted Dispatches (${fy})`} value={fmt(k.aDisp)} style={{ color: '#ea580c' }} />
        </>}
      </div>

      {/* charts grid */}
      <div className="pubcharts">
        {v.specs.map((s) => (
          <div className="card" key={s.key} style={s.key === 'Nc' && di ? { gridColumn: 'span 2' } : undefined}>
            <h3>{s.title}</h3>
            <BtcChart labels={v.chart.labels} series={s.series} xlab={v.chart.xlab} opts={{ yTicks: 5 }} dark={dark} height={200} />
          </div>
        ))}
      </div>

      {/* summary table */}
      <div className="card">
        <h3><span>Publish summary — adjusted forecast</span><span className="hdbtns"><button className="btn dis reset-btn" onClick={() => tblReset('pub')}>Reset edits</button></span></h3>
        <div className="tw">
          <table>
            <thead><tr>
              <th className="l">FW</th><th>NC_Adj</th><th>APOS_Adj</th><th>ASU_Adj</th>
              {di && <th>Declines</th>}<th>SR_Adj</th><th>Disp_Adj</th>
              {v.anyEdP && <th className="cmt" style={{ width: 120 }}>Comment</th>}
            </tr></thead>
            <tbody>
              {v.tableRows.map((r) => (
                <tr key={r.fw} className={r.edited ? 'edt' : ''}>
                  <td className="l">{shortFW(r.fw)}</td>
                  <td><input className="ec" defaultValue={fmt(r.adjNew)} key={'an' + r.fw + version} onBlur={(e) => editAsu(r.fw, 'an', e.target.value)} onKeyDown={commitEnter} /></td>
                  <td><input className="ec" defaultValue={fmt(r.btcApos)} key={'ba' + r.fw + version} onBlur={(e) => editAsu(r.fw, 'ba', e.target.value)} onKeyDown={commitEnter} /></td>
                  <td><input className="ec" defaultValue={fmt(r.adj)} key={'aa' + r.fw + version} onBlur={(e) => editAsu(r.fw, 'aa', e.target.value)} onKeyDown={commitEnter} /></td>
                  {di && <td>{r.decl == null ? '—' : fmt(r.decl)}</td>}
                  <td><input className="ec" defaultValue={r.sr === '' ? '' : fmt(r.sr)} key={'sr' + r.fw + version} onBlur={(e) => editRate('sr', 0, r.fw, e.target.value)} onKeyDown={commitEnter} /></td>
                  <td><input className="ec" defaultValue={r.disp === '' ? '' : fmt(r.disp)} key={'dp' + r.fw + version} onBlur={(e) => editRate('disp', 0, r.fw, e.target.value)} onKeyDown={commitEnter} /></td>
                  {v.anyEdP && <CommentCell edited={r.edited} read={() => getCmtPub(r.fw)} write={(val) => setCmtPub(r.fw, val)} />}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
