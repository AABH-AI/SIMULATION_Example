// smoke.mjs — verify the ported engine boots and computes against the REAL dataset.
// Run: node scripts/smoke.mjs   (from app/). No DOM, no React — pure engine.
import { readFileSync } from 'node:fs';
import * as E from '../src/engine/btcEngine.js';

const data = JSON.parse(readFileSync(new URL('../src/data/btc_data.json', import.meta.url)));

function ok(cond, msg) { console.log((cond ? 'PASS' : 'FAIL') + ' — ' + msg); if (!cond) process.exitCode = 1; }

// 1. boot
E.boot(data);
const s = E.state;
ok(!!s.TL, 'boot builds TL (LOB=' + (s.TL && s.TL.lob) + ')');
ok(s.TL.fw.length === 312, 'timeline = 312 weeks (FY22-27), got ' + s.TL.fw.length);
ok(s.F.fy.join(',') === 'FY26,FY27', 'default FY window = FY26,FY27');

// 2. neutral state — no adjustment revealed
let rate = E.computeRate('disp');
ok(rate.showAdj === false, 'disp: neutral modifier → adjusted hidden');
const asu0 = E.computeAsuView();
ok(asu0.asuAdj === false, 'asu: neutral → adjusted hidden');
// neutral = no NC/APOS bend: every forecast row's adjusted NC/APOS equals its actual (declines are
// baked into the dataset and reduce adj on both sides, so adj != base — that is expected, not neutral).
const rows0 = E.computeAsuRows(), fc0 = s.TL.fcStart;
const neutralNoBend = rows0.slice(fc0).every((r) => r.adjNew === r.nc && r.btcApos === r.apos);
ok(neutralNoBend, 'asu: neutral → adjNew==nc & btcApos==apos on every forecast week');

// 3. bend NC up (neutral = 0; 120 = +120% uplift) → ASU lift positive
E.setNcMod(120);
const asu1 = E.computeAsuView();
ok(asu1.ncAdj === true, 'asu: NC mod 120 → NC adjusted revealed');
ok(asu1.lift > 0, 'asu: NC +120% → positive lift (' + E.fmt(asu1.lift) + ')');
E.setNcMod(0);

// 4. dispatch modifier 130 → adjusted > base, gap ties out (adj − target)
E.setSegMod('disp', 130);
rate = E.computeRate('disp');
ok(rate.showAdj === true, 'disp: mod 130 → adjusted shown');
ok(rate.kpi.tAdj > rate.kpi.tBase, 'disp: mod 130 → adjusted total > DS base');
ok(rate.kpi.gapN === Math.round(rate.kpi.tAdj) - rate.kpi.tgtN, 'disp: Gap == BTC Adjusted − AOP Target');
E.segReset('disp');
rate = E.computeRate('disp');
ok(rate.showAdj === false, 'disp: segReset → back to neutral');

// 5. per-week override on disp All → redistributes to sub-segments, All total == typed
E.setSegMod('disp', 110); // reveal adjusted
const rr = E.computeRate('disp');
const fwEdit = rr.rows.find((r) => !r.isA).fw;
E.editRate('disp', 0, fwEdit, 999999);
const rr2 = E.computeRate('disp');
const editedRow = rr2.rows.find((r) => r.fw === fwEdit);
ok(editedRow && editedRow.adj === 999999, 'disp: All-tab edit → All total == typed 999999 (got ' + (editedRow && editedRow.adj) + ')');
E.segReset('disp');

// 6. ASU balance re-anchor (o.aa) propagates forward
E.setNcMod(0);
const av = E.computeAsuView();
const fwA = av.rows.find((r, i) => i >= s.TL.fcStart).fw;
E.editAsu(fwA, 'aa', 5000000);
const av2 = E.computeAsuView();
const rowA = av2.rows.find((r) => r.fw === fwA);
ok(rowA.adj === 5000000, 'asu: aa override re-anchors balance to 5,000,000');
E.asuReset();

// 7. CSV export has header + one row per visible week
const csv = E.exportCsv();
const lines = csv.split('\n');
ok(lines[0].startsWith('FW,ASU_Base,ASU_Adj'), 'csv: header schema intact');
ok(lines.length - 1 === E.visIdx().length, 'csv: one data row per visible week (' + (lines.length - 1) + ')');

// 8. cycle label
ok(E.cycleLabelVal() === 'Adjustment Cycle FY27, Pass 1', 'cycle label = "Adjustment Cycle FY27, Pass 1"');

console.log('\nSmoke complete.' + (process.exitCode ? ' (FAILURES)' : ' All passing.'));
