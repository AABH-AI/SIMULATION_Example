// TblViewBtn.jsx — "View edits" toggle for a table: an eye icon in the same 26×26 box as the ↺ reset button,
// placed to its left. `on` = table filtered to edited weeks only.
export default function TblViewBtn({ on, onClick }) {
  return (
    <button type="button" className={'tblview' + (on ? ' on' : '')} onClick={onClick} aria-pressed={on}
      title={on ? 'Show all weeks' : 'View edits (show only edited weeks)'} aria-label="View edits">
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8s-2.4 4.5-6.5 4.5S1.5 8 1.5 8z" strokeLinejoin="round" />
        <circle cx="8" cy="8" r="2" />
      </svg>
    </button>
  );
}
