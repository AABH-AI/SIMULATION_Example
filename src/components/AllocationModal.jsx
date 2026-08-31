// AllocationModal.jsx — Publish allocation breakdown. Mirrors showAlloc(): the published SR/Dispatch total
// weighted-allocated down region / core-upsell / service dimensions from TL.alloc.
import { fmt, state } from '../engine/btcEngine.js';

const TITLES = { region: 'Region', coreupsell: 'Core / Upsell', service: 'Service Type' };

export default function AllocationModal({ which, total, onClose }) {
  const a = state.TL && state.TL.alloc;
  const metric = which === 'disp' ? 'Dispatches' : 'SRs';
  return (
    <div className="modal on" onClick={(e) => { if (e.target.classList.contains('modal')) onClose(); }}>
      <div className="modalcard">
        <div className="mh"><h3>Published {metric} allocation</h3><button className="mx" onClick={onClose}>×</button></div>
        <div className="modalbody">
          <div className="ks" style={{ marginBottom: 14 }}>
            Published <b style={{ color: 'var(--gn)' }}>{fmt(total)}</b> adjusted forecast {metric} (forecast window) — weighted-allocated down each dimension:
          </div>
          {!a && <div className="gate"><span>ⓘ</span><span>No allocation weights in this dataset.</span></div>}
          {a && ['region', 'coreupsell', 'service'].map((dk) => a[dk] && (
            <div className="allocgrp" key={dk}>
              <h4>{TITLES[dk]}</h4>
              <table>
                <thead><tr><th className="l">Segment</th><th>Share</th><th>Allocated {metric}</th></tr></thead>
                <tbody>
                  {Object.keys(a[dk]).map((v) => (
                    <tr key={v}><td className="l">{v}</td><td>{(a[dk][v] * 100).toFixed(1)}%</td><td>{fmt(Math.round(total * a[dk][v]))}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
