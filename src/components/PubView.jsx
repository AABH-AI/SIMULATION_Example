// PubView.jsx — Publish page (Step 3). Forecast-window summary: KPI row, 5 charts, editable summary table,
// CSV export. Mirrors renderPub(). Edits round-trip into the same stores as the source pages.
import { useState } from 'react';
import { useBtc } from '../store/useBtc.js';
import { fmt, shortFW, getCmtPub, hasAsuOvrOf, hasAnyRateOvr } from '../engine/btcEngine.js';
import BtcChart from './BtcChart.jsx';
import Kpi from './Kpi.jsx';
import CommentIcon from './CommentIcon.jsx';
import EcInput from './EcInput.jsx';
import TblViewBtn from './TblViewBtn.jsx';

// height of the Publish All/Field/Tech toggle row (.pubseg: 22px buttons + 6px margin in btc.css)
const PUBSEG_H = 28;
// Publish charts that carry an All/Field/Tech toggle row
const SEG_CHARTS = { Nc: 1, Apos: 1, Asu: 1, Disp: 1 };

export default function PubView({ dark }) {
  const version = useBtc((s) => s.version);
  const editAsu = useBtc((s) => s.editAsu);
  const editRate = useBtc((s) => s.editRate);
  const tblReset = useBtc((s) => s.tblReset);
  const exportPublished = useBtc((s) => s.exportPublished);
  const setCmtPub = useBtc((s) => s.setCmtPub);
  const stepTo = useBtc((s) => s.stepTo);
  const cycleBaseName = useBtc((s) => s.cycleBaseName);
  const setPubSeg = useBtc((s) => s.setPubSeg);
  const [fileName, setFileName] = useState('');
  const [viewEd, setViewEd] = useState(false); // "View edits": table shows only edited weeks
  void version;
  // note icon right of an edited cell (one note per week, shared by that row's edited cells); spacer keeps inputs aligned
  const note = (fw, edited) => (edited ? <CommentIcon read={() => getCmtPub(fw)} write={(val) => setCmtPub(fw, val)} /> : <span className="cmi-sp" />);

  const v = useBtc.getState().computePubView();
  if (v.empty) return <div className="view on"><div className="card">No forecast weeks to publish.</div></div>;
  const k = v.kpi, p = v.pct, fy = v.fyLbl, di = v.declImported;
  // NC / APOS KPIs follow their chart's All/Field/Tech toggle; the segment is named in the label when not All
  const ncS = v.ncSeg === 'all' ? '' : ' · ' + v.ncSegLabel, apS = v.apSeg === 'all' ? '' : ' · ' + v.apSegLabel;
  const asuS = v.asuSeg === 'all' ? '' : ' · ' + v.asuSegLabel;
  const dispS = v.dispSeg === 0 ? '' : ' · ' + v.dispSegLabel;
  const SEGS = [{ k: 'all', l: 'All' }, { k: 'field', l: 'Field' }, { k: 'tech', l: 'Tech' }];
  const segToggle = (which, cur) => (
    <div className="segbar pubseg">
      {SEGS.map((sg) => <button key={sg.k} className={'segt' + (cur === sg.k ? ' on' : '')} onClick={() => setPubSeg(which, sg.k)}>{sg.l}</button>)}
    </div>
  );

  const sanit = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const saveName = (fileName.trim() ? (sanit(fileName) || 'published') : cycleBaseName()) + '.csv';

  return (
    <div className="view on">
      <div style={{ margin: '4px 0 12px' }}>
        <div className="ks">Publish — {fy} forecast window</div>
      </div>

      {/* KPI row */}
      <div className="kr pubk" style={{ gridTemplateColumns: `repeat(${di ? 6 : 5},minmax(0,1fr))` }}>
        <Kpi label={`New Contracts${ncS} (${fy})`} value={fmt(k.fNC)} style={{ color: '#3a6ef0' }} />
        {di && <Kpi label={`Declines${ncS} (${fy})`} value={fmt(k.fDecl)} style={{ color: '#8b0000' }} />}
        <Kpi label={`APOS Renewals${apS} (${fy})`} value={fmt(k.fAP)} style={{ color: '#6d28d9' }} />
        <Kpi label={`ASU${asuS} (${fy})`} value={fmt(k.fASU)} style={{ color: '#16a34a' }} />
        <Kpi label={`SRs (${fy})`} value={fmt(k.fSR)} style={{ color: '#38bdf8' }} />
        <Kpi label={`Dispatches${dispS} (${fy})`} value={fmt(k.fDisp)} style={{ color: '#6b4423' }} />
        {v.showAdj && <>
          <Kpi label={`Adj New Contracts${ncS} (${fy})`} value={fmt(k.aNC)} style={{ color: '#ea580c' }} pct={p.nc} flatZero />
          {di && <Kpi hidden />}
          <Kpi label={`Adj APOS Renewals${apS} (${fy})`} value={fmt(k.aAP)} style={{ color: '#ea580c' }} pct={p.ap} flatZero />
          <Kpi label={`Adjusted ASU${asuS} (${fy})`} value={fmt(k.aASU)} style={{ color: '#ea580c' }} pct={p.asu} flatZero />
          <Kpi label={`Adjusted SRs (${fy})`} value={fmt(k.aSR)} style={{ color: '#ea580c' }} pct={p.sr} flatZero />
          <Kpi label={`Adjusted Dispatches${dispS} (${fy})`} value={fmt(k.aDisp)} style={{ color: '#ea580c' }} pct={p.disp} flatZero />
        </>}
      </div>

      {/* charts grid */}
      <div className="pubcharts">
        {v.specs.map((s) => (
          <div className="card" key={s.key} style={s.key === 'Nc' && di ? { gridColumn: 'span 2' } : undefined}>
            <h3>{s.title}</h3>
            {s.key === 'Nc' && segToggle('nc', v.ncSeg)}
            {s.key === 'Apos' && segToggle('ap', v.apSeg)}
            {s.key === 'Asu' && segToggle('asu', v.asuSeg)}
            {s.key === 'Disp' && (
              <div className="segbar pubseg">
                {v.dispSegs.map((sg) => <button key={sg.i} className={'segt' + (v.dispSeg === sg.i ? ' on' : '')} onClick={() => setPubSeg('disp', sg.i)}>{sg.s}</button>)}
              </div>
            )}
            {/* charts with a toggle row lose PUBSEG_H to it; the others grow by it so every card matches */}
            <BtcChart labels={v.chart.labels} series={s.series} xlab={v.chart.xlab} opts={{ yTicks: 5 }} dark={dark} height={SEG_CHARTS[s.key] ? 200 : 200 + PUBSEG_H} />
          </div>
        ))}
      </div>

      {/* summary table + export panel */}
      <div className="row">
        <div className="card">
          {/* header buttons (original spot): eye "View edits" then ↺ reset — same icons as pages 1-2 */}
          <h3><span>Publish summary — adjusted forecast</span><span className="hdbtns">
            <TblViewBtn on={viewEd} onClick={() => setViewEd((x) => !x)} />
            <button className="tblreset" onClick={() => { tblReset('pub'); setViewEd(false); }} title="Reset table edits (also leaves View edits)">↺</button>
          </span></h3>
          <div className="tw">
            <table>
              <thead><tr>
                <th className="l">FW</th><th>NC_Adj</th><th>APOS_Adj</th><th>ASU_Adj</th>
                {di && <th>Declines</th>}<th>SR_Adj</th><th>Disp_Adj</th>
              </tr></thead>
              <tbody>
                {viewEd && !v.tableRows.some((r) => r.edited) && <tr><td className="noed" colSpan={di ? 7 : 6}>No edited weeks in this selection.</td></tr>}
                {(viewEd ? v.tableRows.filter((r) => r.edited) : v.tableRows).map((r) => (
                  <tr key={r.fw} className={r.edited ? 'edt' : ''}>
                    <td className="l">{shortFW(r.fw)}</td>
                    <td><span className="ecw"><EcInput value={r.adjNew} key={'an' + r.fw + version} onCommit={(val) => editAsu(r.fw, 'an', val)} />{note(r.fw, hasAsuOvrOf(r.fw, 'an'))}</span></td>
                    <td><span className="ecw"><EcInput value={r.btcApos} key={'ba' + r.fw + version} onCommit={(val) => editAsu(r.fw, 'ba', val)} />{note(r.fw, hasAsuOvrOf(r.fw, 'ba'))}</span></td>
                    <td><span className="ecw"><EcInput value={r.adj} key={'aa' + r.fw + version} onCommit={(val) => editAsu(r.fw, 'aa', val)} />{note(r.fw, hasAsuOvrOf(r.fw, 'aa'))}</span></td>
                    {di && <td>{r.decl == null ? '—' : fmt(r.decl)}</td>}
                    <td><span className="ecw"><EcInput value={r.sr} key={'sr' + r.fw + version} onCommit={(val) => editRate('sr', 0, r.fw, val)} />{note(r.fw, hasAnyRateOvr('sr', r.fw))}</span></td>
                    <td><span className="ecw"><EcInput value={r.disp} key={'dp' + r.fw + version} onCommit={(val) => editRate('disp', 0, r.fw, val)} />{note(r.fw, hasAnyRateOvr('disp', r.fw))}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* export panel (mirrors control panel layout) */}
        <div className="card ctl">
          <h3><span>Export</span></h3>
          <div className="mb blue" style={{ padding: '7px 8px' }}><p style={{ margin: 0, fontSize: 8, color: 'var(--t2)', lineHeight: 1.4, whiteSpace: 'nowrap' }}>ⓘ Export the adjusted forecast data for the forecast window ({fy}).</p></div>
          <div style={{ marginBottom: 9 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--t2)', marginBottom: 6 }}>FILE NAME <span style={{ fontWeight: 400, color: 'var(--t3)' }}>(optional — overrides the cycle-derived name)</span></label>
            <input className="ec" style={{ width: '100%', maxWidth: 'none', boxSizing: 'border-box', textAlign: 'left' }} value={fileName} placeholder="auto (cycle name)" onChange={(e) => setFileName(e.target.value)} />
            <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 6 }}>Saves as: <b>{saveName}</b></div>
          </div>
          <div className="btnrow"><button className="btn dis" style={{ flex: 1 }} onClick={() => stepTo(2)}>← Back to Step 2</button></div>
          <div className="btnrow"><button className="btn pub" style={{ flex: 1 }} onClick={() => exportPublished(fileName)}>⤓ Export data</button></div>
        </div>
      </div>
    </div>
  );
}
