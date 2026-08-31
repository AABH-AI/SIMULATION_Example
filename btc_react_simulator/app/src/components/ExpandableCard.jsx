// ExpandableCard.jsx — wraps a chart card; an expand button promotes it to a fixed overlay over a dim backdrop.
// Collapse via the button, Escape, or backdrop click. Dispatches a window resize so Highcharts reflows to the
// new size (HighchartsReact listens to window resize). Mirrors toggleExpand/collapseExpand from the source.
import { useState, useEffect } from 'react';

const EXPAND = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h4v4" /><path d="M14 10l6 -6" /><path d="M8 20H4v-4" /><path d="M4 20l6 -6" /><path d="M16 20h4v-4" /><path d="M14 14l6 6" /><path d="M8 4H4v4" /><path d="M4 4l6 6" /></svg>;
const COLLAPSE = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 9h4V5" /><path d="M3 3l6 6" /><path d="M5 15h4v4" /><path d="M3 21l6 -6" /><path d="M19 9h-4V5" /><path d="M21 3l-6 6" /><path d="M19 15h-4v4" /><path d="M21 21l-6 -6" /></svg>;

export default function ExpandableCard({ className = '', children }) {
  const [exp, setExp] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('expanding', exp);
    // let the CSS size settle, then nudge Highcharts to reflow into the new box
    const t = setTimeout(() => window.dispatchEvent(new Event('resize')), 60);
    if (!exp) return () => clearTimeout(t);
    const onKey = (e) => { if (e.key === 'Escape') setExp(false); };
    document.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); document.removeEventListener('keydown', onKey); };
  }, [exp]);

  return (
    <>
      {exp && <div id="expandBackdrop" onClick={() => setExp(false)} />}
      <div className={'card' + (className ? ' ' + className : '') + (exp ? ' expanded' : '')}>
        <button className="ficon expandbtn" onClick={() => setExp((v) => !v)} title={exp ? 'Collapse chart' : 'Expand chart'}>{exp ? COLLAPSE : EXPAND}</button>
        {children}
      </div>
    </>
  );
}
