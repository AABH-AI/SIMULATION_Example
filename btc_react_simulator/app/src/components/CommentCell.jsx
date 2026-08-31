// CommentCell.jsx — per-row note cell + floating popover (portal). Mirrors cmtOpen/cmtPos/cmtKey/cmtPopClose.
// Cell shows a one-line preview; the full note opens in a fixed-position popover anchored to the cell.
// Single click = read popover; double click / click when open = edit (textarea, Enter saves, Esc cancels, Delete wipes).
// `read()` returns the stored note; `write(v)` persists it (store-wrapped, bumps version).
import { useState, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export default function CommentCell({ edited, read, write }) {
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
    function onDoc(e) { if (e.target.closest && (e.target.closest('.cmpop') || e.target.closest('.cmp'))) return; close(true); }
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

  if (!edited) return <td className="cmt" />;

  const preview = val
    ? <div className="cmp" onClick={() => setMode(mode === 'read' ? 'edit' : 'read')} onDoubleClick={() => setMode('edit')} ref={cellRef}>{val}</div>
    : <div className="cmp add" onClick={() => setMode('edit')} onDoubleClick={() => setMode('edit')} ref={cellRef}>Add a note…</div>;

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

  return <td className="cmt">{preview}{popover}</td>;
}
