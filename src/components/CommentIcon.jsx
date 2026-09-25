// CommentIcon.jsx — note icon shown to the right of an edited table cell + floating popover (portal).
// Mirrors cmtOpen/cmtPos/cmtKey/cmtPopClose. The icon is filled when a note exists (hover = note text).
// Click = read popover (or straight to edit when empty); double click / click when open = edit (textarea,
// Enter saves, Esc cancels, Delete wipes). `read()` returns the stored note; `write(v)` persists it.
import { useState, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

const ICON = (
  <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
    <path d="M2.5 3h11a1 1 0 0 1 1 1v6.5a1 1 0 0 1-1 1H8l-3.2 2.6V11.5H2.5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

export default function CommentIcon({ read, write }) {
  const [mode, setMode] = useState(null); // null | 'read' | 'edit'
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const cellRef = useRef(null);
  const popRef = useRef(null);
  const taRef = useRef(null);

  const val = read();

  const place = useCallback(() => {
    const cell = cellRef.current, pop = popRef.current; if (!cell || !pop) return;
    const r = cell.getBoundingClientRect(), M = 8;
    const w = pop.offsetWidth, h = pop.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
    let x = r.right + M;
    if (x + w > vw - M) x = r.left - w - M;
    if (x < M) x = Math.max(M, Math.min(vw - w - M, r.left));
    let y = r.top - 4;
    if (y + h > vh - M) y = vh - h - M;
    if (y < M) y = M;
    setPos({ x: Math.round(x), y: Math.round(y) });
  }, []);

  useLayoutEffect(() => { if (mode) place(); }, [mode, place]);
  useLayoutEffect(() => {
    if (!mode) return;
    function onDoc(e) { if (e.target.closest && (e.target.closest('.cmpop') || e.target.closest('.cmi'))) return; close(true); }
    function onScroll() { close(true); }
    function onResize() { close(true); }
    document.addEventListener('mousedown', onDoc, true);
    document.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    if (mode === 'edit' && taRef.current) { taRef.current.focus({ preventScroll: true }); try { const l = taRef.current.value.length; taRef.current.setSelectionRange(l, l); } catch { /* noop */ } }
    return () => { document.removeEventListener('mousedown', onDoc, true); document.removeEventListener('scroll', onScroll, true); window.removeEventListener('resize', onResize); };
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  function close(commit) {
    if (mode === 'edit' && commit && taRef.current) write(taRef.current.value);
    setMode(null);
  }
  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); close(true); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setMode(null); }
  }

  const icon = (
    <button type="button" className={'cmi' + (val ? ' has' : '')} ref={cellRef} title={val || 'Add a note'} aria-label={val ? 'View note' : 'Add a note'}
      onClick={() => setMode(val ? (mode === 'read' ? 'edit' : 'read') : 'edit')} onDoubleClick={() => setMode('edit')}>{ICON}</button>
  );

  const popover = mode && createPortal(
    <div className={'cmpop' + (mode === 'edit' ? ' edit' : '')} ref={popRef} style={{ left: pos.x, top: pos.y }}>
      {mode === 'edit' ? (
        <>
          <textarea className="cm" ref={taRef} defaultValue={val} placeholder="Add a note…" onKeyDown={onKey} />
          <div className="cmfoot">
            <div className="hint">Enter saves · Shift+Enter newline · Esc cancels</div>
            <button type="button" className="cmdel" onMouseDown={(e) => e.preventDefault()} onClick={() => { write(''); setMode(null); }}>Delete</button>
          </div>
        </>
      ) : val}
    </div>,
    document.body,
  );

  return <>{icon}{popover}</>;
}
