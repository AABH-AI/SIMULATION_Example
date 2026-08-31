// FilterRail.jsx — right-side filter rail. Ported from renderRail()/fitemHtml()/ddClick()/toggleMore().
// openK (open dropdown) + moreOpen are local view state; selections live in the engine (toggleMulti).
import { useState, useRef, useEffect } from 'react';
import { useBtc } from '../store/useBtc.js';

export default function FilterRail({ open, onToggleOpen }) {
  const version = useBtc((s) => s.version);
  const toggleMulti = useBtc((s) => s.toggleMulti);
  const resetFilters = useBtc((s) => s.resetFilters);
  const { FILTERS, MORE_KEYS, filterDisplay, optionsFor, hiddenFilters, labOf } = useBtc.getState();
  void version;

  const [openK, setOpenK] = useState(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const rootRef = useRef(null);

  // outside-click closes the open dropdown (mirrors the document click handler in source)
  useEffect(() => {
    function onDoc(e) { if (openK !== null && rootRef.current && !e.target.closest('.fitem')) setOpenK(null); }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [openK]);

  const hid = hiddenFilters();
  const F = useBtc.getState().state.F;

  function Fitem({ cfg }) {
    const k = cfg.k, opts = optionsFor(cfg);
    const up = (k === 'fqm' || k === 'gcfa'); // last rows sit at the rail bottom — open their dropdown upward
    return (
      <div className="fitem">
        <div className="flab">{cfg.label}{cfg.multi && <span className="mx">multi</span>}</div>
        <button className="fval" onClick={(e) => { e.stopPropagation(); setOpenK(openK === k ? null : k); }}>
          <span>{filterDisplay(cfg)}</span><span className="cr">▾</span>
        </button>
        <div className={'fdd' + (up ? ' up' : '') + (openK === k ? ' open' : '')}>
          {opts.map((o) => {
            const sel = cfg.multi ? (o === 'All' ? F[k].length === 0 : F[k].indexOf(o) >= 0) : F[k] === o;
            return (
              <div key={o} className={'fopt' + (sel ? ' on' : '')} onClick={(e) => { e.stopPropagation(); toggleMulti(k, o); }}>
                {cfg.multi && <span className={'cb' + (sel ? ' on' : '')}>{sel ? '✓' : ''}</span>}
                {labOf(k, o)}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const main = FILTERS.filter((c) => !hid[c.k] && !MORE_KEYS[c.k]);
  const more = FILTERS.filter((c) => !hid[c.k] && MORE_KEYS[c.k]);

  return (
    <>
      {!open && <button className="ficon freopen" onClick={onToggleOpen} title="Show filters">⧩</button>}
      <div className="frail" ref={rootRef}>
        <div className="frail-hd"><span>Filters</span><span className="ficon" onClick={onToggleOpen} title="Hide filters">✕</span></div>
        <button className="freset" onClick={resetFilters}>Reset filters</button>
        <div id="frailBody">
          {main.map((c) => <Fitem key={c.k} cfg={c} />)}
          <div className="morehdr" onClick={() => setMoreOpen((v) => !v)}><span>More filters</span><span className="cr">{moreOpen ? '▴' : '▾'}</span></div>
          <div className={'moreblk' + (moreOpen ? ' open' : '')}>
            {more.map((c) => <Fitem key={c.k} cfg={c} />)}
          </div>
        </div>
      </div>
    </>
  );
}
