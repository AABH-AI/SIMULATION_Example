// AsuView.jsx — Step 1 ASU driver (vertical slice). Reads computeAsuView(); sliders drive ncMod/apMod
// through the store; edits round-trip via editAsu. Chart via <BtcChart>. (Comment popover + legend
// isolation deferred to P4.)
import { useRef } from 'react';
import { useBtc } from '../store/useBtc.js';
import { fmt, shortFW, state, hasAsuOvr, getCmtAsu } from '../engine/btcEngine.js';
import BtcChart from './BtcChart.jsx';
import Kpi from './Kpi.jsx';
import CommentCell from './CommentCell.jsx';
import ExpandableCard from './ExpandableCard.jsx';

function Slider({ cls, color, label, value, min = 60, max = 150, step = 0.25, onChange }) {
  return (
    <div className="mb blue" style={{ borderColor: color ? color + '55' : undefined }}>
      <h4 style={{ color }}>{label}</h4>
      <div className={'sl ' + cls}>
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(e.target.value)} />
        <input type="number" min={min} max={max} step={step} value={value} onChange={(e) => onChange(e.target.value)} />
        <span style={{ fontWeight: 700, color }}>%</span>
      </div>
    </div>
  );
}

export default function AsuView({ dark }) {
  const version = useBtc((s) => s.version);
  const setNcMod = useBtc((s) => s.setNcMod);
  const setApMod = useBtc((s) => s.setApMod);
  const editAsu = useBtc((s) => s.editAsu);
  const asuReset = useBtc((s) => s.asuReset);
  const aopSync = useBtc((s) => s.aopSync);
  const importDeclinesText = useBtc((s) => s.importDeclinesText);
  const removeDeclines = useBtc((s) => s.removeDeclines);
  const setCmtAsu = useBtc((s) => s.setCmtAsu);
  const stepTo = useBtc((s) => s.stepTo);
  const tblReset = useBtc((s) => s.tblReset);
  const setAsuSeg = useBtc((s) => s.setAsuSeg);
  const fileRef = useRef(null);
  const ASU_SEGS = [{ k: 'all', l: 'All' }, { k: 'field', l: 'Field' }, { k: 'tech', l: 'Tech' }];

  // version keeps this reactive to store mutations
  void version;
  const v = useBtc.getState().computeAsuView();
  const { ncMod, apMod, DECL_IMPORTED } = state;
  const aopMax = useBtc.getState().aopSliderMax('asu');
  const commitEnter = (e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } };

  if (v.empty) return <div className="card">No forecast weeks in this selection.</div>;
  const t = v.totals, cb = v.cb;

  function onFile(e) {
    const f = e.target.files && e.target.files[0]; e.target.value = '';
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => { importDeclinesText('' + (ev.target.result || '')); };
    r.readAsText(f);
  }

  return (
    <div className="view on">
      <div className="segbar">
        {ASU_SEGS.map((s) => (
          <button key={s.k} className={'segt' + (v.seg === s.k ? ' on' : '')} onClick={() => setAsuSeg(s.k)}>{s.l}</button>
        ))}
      </div>
      {/* KPI row */}
      <div className={'kr ' + (v.declImported ? 'kr4' : 'kr5')}>
        <Kpi label="ASU Actuals" value={fmt(t.nc + t.apos - t.decl)} pct={cb.base} />
        <Kpi label="NC Actuals" value={fmt(t.nc)} style={{ color: 'var(--ac)' }} pct={cb.nc} />
        <Kpi label="APOS Actuals" value={fmt(t.apos)} style={{ color: 'var(--pu)' }} pct={cb.apos} />
        {v.declImported && <Kpi label="Declines" value={fmt(t.decl)} style={{ color: '#8b0000' }} pct={cb.decl} />}
        {v.anyAdj && <>
          {v.asuAdj ? <Kpi label="Adjusted ASU" value={fmt(t.adj)} style={{ color: '#ea580c' }} pct={cb.adj} /> : <Kpi hidden />}
          {v.ncAdj ? <Kpi label="Adj NC" value={fmt(t.adjNew)} style={{ color: '#0891b2' }} pct={cb.adjNew} /> : <Kpi hidden />}
          {v.apAdj ? <Kpi label="Adj APOS" value={fmt(t.btcApos)} style={{ color: '#ac4073' }} pct={cb.btcApos} /> : <Kpi hidden />}
          {v.declImported && <Kpi hidden />}
        </>}
      </div>

      <div className="row">
        {/* chart + table */}
        <ExpandableCard>
          <h3>ASU Forecast — Base vs Adjusted</h3>
          <BtcChart labels={v.chart.labels} series={v.chart.series} xlab={v.chart.xlab} dark={dark} />
          <div className="twwrap">
          <button className="tblreset" onClick={() => tblReset('asu')} title="Reset table edits">↺</button>
          <div className="tw">
            <table>
              <thead><tr>
                <th className="l">FW</th><th>Segment</th><th>ASU Actuals</th><th>NC Actuals</th><th>APOS Actuals</th>
                {v.declImported && <th>Declines</th>}
                {v.ncAdj && <th style={{ color: 'var(--ac)' }}>Adj NC</th>}
                {v.apAdj && <th style={{ color: 'var(--pu)' }}>Adj APOS</th>}
                {v.asuAdj && <th>Adj ASU</th>}
                {v.anyEdA && <th className="cmt" style={{ width: 120 }}>Comment</th>}
              </tr></thead>
              <tbody>
                {v.vis.map((i) => {
                  const r = v.rows[i], isA = i < state.TL.fcStart;
                  const edited = !isA && hasAsuOvr(r.fw);
                  return (
                    <tr key={r.fw} className={isA ? 'act' : (edited ? 'edt' : '')}>
                      <td className="l">{shortFW(r.fw)}</td>
                      <td>{v.segLabel}</td>
                      <td>{fmt(r.nc + r.apos - (r.decl || 0))}</td><td>{fmt(r.nc)}</td><td>{fmt(r.apos)}</td>
                      {v.declImported && <td>{r.decl == null ? '—' : fmt(r.decl)}</td>}
                      {v.ncAdj && <td style={{ color: 'var(--ac)' }}>{isA ? '—' : <input className="ec" defaultValue={r.adjNew} key={'an' + r.fw + version} onBlur={(e) => editAsu(r.fw, 'an', e.target.value)} onKeyDown={commitEnter} />}</td>}
                      {v.apAdj && <td style={{ color: 'var(--pu)' }}>{isA ? '—' : <input className="ec" defaultValue={r.btcApos} key={'ba' + r.fw + version} onBlur={(e) => editAsu(r.fw, 'ba', e.target.value)} onKeyDown={commitEnter} />}</td>}
                      {v.asuAdj && <td>{isA ? '—' : <input className="ec" defaultValue={fmt(r.adj)} key={'aa' + r.fw + version} onBlur={(e) => editAsu(r.fw, 'aa', e.target.value)} onKeyDown={commitEnter} />}</td>}
                      {v.anyEdA && <CommentCell edited={edited} read={() => getCmtAsu(r.fw)} write={(val) => setCmtAsu(r.fw, val)} />}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </div>
        </ExpandableCard>

        {/* controls */}
        <div className="card ctl">
          <h3><span>Controls</span><span className="hdbtns"><button className="btn dis reset-btn" onClick={asuReset}>Reset</button></span></h3>
          {!v.actualsOnly && <>
            <Slider cls="sl-b" color="var(--ac)" label="New Contracts" value={ncMod} onChange={setNcMod} />
            <Slider cls="sl-p" color="var(--pu)" label="APOS Renewals" value={apMod} onChange={setApMod} />
          </>}
          <div className="mb" style={{ borderColor: 'rgba(139,0,0,.35)' }}>
            <h4 style={{ color: '#8b0000' }}>Declines</h4>
            <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={onFile} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn dis" style={{ flex: '0 0 auto', padding: '6px 12px' }} onClick={() => fileRef.current && fileRef.current.click()}>⇧ Import declines</button>
              {DECL_IMPORTED && <button className="btn dis" style={{ flex: '0 0 auto', padding: '6px 12px' }} onClick={removeDeclines}>✕ Remove file</button>}
            </div>
          </div>
          <div className="mb amber mb-aop">
            <h4 style={{ color: 'var(--am)' }}>AOP Target</h4>
            <div className="sl sl-a"><input type="range" value={Math.min(v.aopW, aopMax)} min={0} max={aopMax} onChange={(e) => aopSync('asu', e.target.value)} /><input type="number" value={v.aopW} min={0} max={aopMax} onChange={(e) => aopSync('asu', e.target.value)} /></div>
          </div>
          <h4 style={{ fontSize: 10, marginBottom: 8 }}>ASU vs Base (end of window)</h4>
          <div className="gap"><span>Base ASU</span><b>{fmt(t.base)}</b></div>
          <div className="gap"><span>Adjusted ASU</span><b style={{ color: 'var(--ac)' }}>{fmt(t.adj)}</b></div>
          <div className="bar"><div style={{ width: Math.max(4, Math.min(100, t.adj ? t.base / t.adj * 100 : 0)) + '%' }} /></div>
          <div className="gap"><span>Delta</span><b style={{ color: v.lift >= 0 ? 'var(--gn)' : 'var(--rd)' }}>{(v.lift >= 0 ? '+' : '') + fmt(v.lift)}</b></div>
          <div className="btnrow" style={{ justifyContent: 'center' }}><button className="btn pub" style={{ flex: '0 0 auto', padding: '8px 24px' }} onClick={() => stepTo(2)}>Go to Step 2 (SRs &amp; Dispatches) →</button></div>
        </div>
      </div>
    </div>
  );
}
