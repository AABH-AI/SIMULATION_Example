import { useEffect, useRef } from 'react';
import { useBtc } from './store/useBtc.js';
import { state } from './engine/btcEngine.js';
import AsuView from './components/AsuView.jsx';
import RateView from './components/RateView.jsx';
import PubView from './components/PubView.jsx';
import FilterRail from './components/FilterRail.jsx';
import './btc.css';

const TABS = [
  { v: 'asu', label: 'ASUs' },
  { v: 'sr', label: 'SRs' },
  { v: 'disp', label: 'Dispatches' },
  { v: 'pub', label: 'Publish' },
];

export default function App() {
  const boot = useBtc((s) => s.boot);
  const ready = useBtc((s) => s.ready);
  const version = useBtc((s) => s.version);
  const goTab = useBtc((s) => s.goTab);
  const stepTo = useBtc((s) => s.stepTo);
  const toggleTheme = useBtc((s) => s.toggleTheme);
  const applySavedTheme = useBtc((s) => s.applySavedTheme);
  const setCycleOvr = useBtc((s) => s.setCycleOvr);
  const cycleLabelVal = useBtc((s) => s.cycleLabelVal);
  const ctxText = useBtc((s) => s.ctxText);

  const cycleRef = useRef(null);
  const bootedCycle = useRef(false);

  useEffect(() => { boot(); applySavedTheme(); }, [boot, applySavedTheme]);
  void version;

  // keep the auto label (incl. Pass #) fresh, but never clobber a live edit or a user override (caret-safe)
  useEffect(() => {
    const el = cycleRef.current; if (!ready || !el) return;
    if (!bootedCycle.current) bootedCycle.current = true;
    if (document.activeElement !== el && !state.CYCLE_OVR) el.textContent = cycleLabelVal();
  }, [ready, version, cycleLabelVal]);

  if (!ready) return <div style={{ padding: 24, fontFamily: 'var(--ui)', color: 'var(--t2)' }}>Loading BTC dataset…</div>;

  const step = state.STEP, tab = state.activeTab, dark = state.dark;
  const tabVisible = (v) => (step === 1 && v === 'asu') || (step === 2 && (v === 'sr' || v === 'disp')) || (step === 3 && v === 'pub');

  function onTab(v) { goTab(v); }
  function onStep(n) { stepTo(n); }

  return (
    <>
      <div className="hd">
        <span className="brandtxt">BPA</span>
        <span className="crumb"><b>BTC Adjustment Simulator</b></span>
        <span className="hdsep" />
        <span className="cycle" ref={cycleRef} contentEditable suppressContentEditableWarning spellCheck={false}
          onInput={(e) => setCycleOvr(e.currentTarget.textContent)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }} />
        <div style={{ flex: 1 }} />
        <span className="ctx">{ctxText()}</span>
        <button className="themebtn" onClick={toggleTheme} title="Toggle dark mode">{dark ? '☀' : '☾'}</button>
      </div>

      <FilterRail open={true} />

      <div className="stepper">
        <button className="step-nav" disabled={step <= 1} onClick={() => onStep(step - 1)}>← Prev</button>
        <div className={'step' + (step === 1 ? ' on' : step > 1 ? ' done' : '')} role="button" tabIndex={0} onClick={() => onStep(1)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStep(1); } }}><b>1</b> Adjust NCs, APOS renewals</div>
        <span className="arw">→</span>
        <div className={'step' + (step === 2 ? ' on' : step > 2 ? ' done' : '')} role="button" tabIndex={0} onClick={() => onStep(2)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStep(2); } }}><b>2</b> Adjust SRs &amp; Dispatches</div>
        <span className="arw">→</span>
        <div className={'step' + (step === 3 ? ' on' : '')} role="button" tabIndex={0} onClick={() => onStep(3)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStep(3); } }}><b>3</b> Publish</div>
        <button className="step-nav" disabled={step >= 3} onClick={() => onStep(step + 1)}>Next →</button>
      </div>

      <div className="tabs">
        {TABS.filter((t) => tabVisible(t.v)).map((t) => (
          <div key={t.v} className={'tab' + (tab === t.v ? ' on' : '')} onClick={() => onTab(t.v)}>{t.label}</div>
        ))}
      </div>

      <div className="wrap" style={{ paddingTop: 12 }}>
        {tab === 'asu' && <AsuView dark={dark} />}
        {tab === 'sr' && <RateView kind="sr" dark={dark} />}
        {tab === 'disp' && <RateView kind="disp" dark={dark} />}
        {tab === 'pub' && <PubView dark={dark} />}
      </div>
    </>
  );
}
