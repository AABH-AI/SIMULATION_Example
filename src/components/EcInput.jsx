// EcInput.jsx — editable table cell input. Shows the value WITH thousands commas; on focus the commas are stripped so
// the raw number is edited; on blur the new value is committed and the cell re-renders formatted again. Enter commits,
// Esc cancels. Only a real change is committed (focusing a cell and leaving it no longer creates an edit/override).
// Width = the formatted value's length (mono font → N chars = N ch; +1ch caret, +12px padding/border) so values never
// clip beside the note icon.
import { fmt } from '../engine/btcEngine.js';

const shown = (v) => (v === '' || v == null ? '' : fmt(v));
const raw = (v) => (v === '' || v == null ? '' : String(Math.round(+v)));

export default function EcInput({ value, onCommit }) {
  const disp = shown(value);
  return (
    <input className="ec" style={{ width: `calc(${Math.max(4, disp.length) + 1}ch + 12px)` }} defaultValue={disp}
      onFocus={(e) => { e.target.value = e.target.value.replace(/,/g, ''); e.target.select(); }}
      onBlur={(e) => {
        const typed = e.target.value.replace(/,/g, '').trim();
        if (typed === raw(value)) { e.target.value = disp; return; } // unchanged → no edit, restore commas
        onCommit(typed);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); }
        else if (e.key === 'Escape') { e.preventDefault(); e.currentTarget.value = raw(value); e.currentTarget.blur(); }
      }}
    />
  );
}
