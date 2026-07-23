#!/usr/bin/env python3
"""Phase 5 verification test for the Forecast Copilot write path.

Asserts serve.publish_forecast() writes a valid, dependency-free .xlsx to the
output folder: three sheets (Final Forecast / Assumptions / Audit), well-formed
XML, the payload's numbers present, a second publish never overwrites the first,
and the input workbook is left untouched (its sha256 is unchanged and is
recorded in the Audit sheet).

Run:  python -m unittest test_publish -v   (from the forecast_copilot/ folder)
Pure stdlib -- no third-party packages required.
"""
import hashlib
import os
import tempfile
import unittest
import zipfile
from xml.etree import ElementTree as ET

import serve

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"

PAYLOAD = {
    "scenario": "Test Plan", "dataMode": "live",
    "slice": {"Quarter": "2026-Q1", "Region": "EMEA", "Product": "Poweredge"},
    "assumptions": {"NC Override %": 30, "APOS Override %": 20,
                    "BTC Strategy": "Historical Best Fit", "BTC %": 5.46, "Distribution Mode": "ai"},
    "summary": [{"metric": "ASU", "forecast": 5010948, "target": 5300000, "gap": 289052, "btcPct": 5.46},
                {"metric": "SR", "forecast": 15310685, "target": 14850000, "gap": -460685, "btcPct": 5.46}],
    "weekly": [{"week": "2026-W01", "ds": 1131381, "btc": 1500000, "variance": 368619, "edited": True},
               {"week": "2026-W02", "ds": 1140000, "btc": 1140000, "variance": 0, "edited": False}],
    "ledger": [{"ts": "2026-07-23T10:00:00", "action": "set", "week": "2026-W01", "from": None, "to": 1500000}],
    "fingerprint": "fp123",
}


def _read_sheet(zf, part):
    """Return the sheet's cells as a list of rows (list of text values)."""
    ws = ET.fromstring(zf.read(part))
    rows = []
    for row in ws.find(f"{NS}sheetData").findall(f"{NS}row"):
        cells = []
        for c in row:
            t, v = c.get("t"), c.find(f"{NS}v")
            if t == "inlineStr":
                is_el = c.find(f"{NS}is")
                cells.append("".join(x.text or "" for x in is_el.iter(f"{NS}t")))
            else:
                cells.append(v.text if v is not None else "")
        rows.append(cells)
    return rows


class PublishWritePathTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.mkdtemp()
        with open(serve.DEFAULT_INPUT, "rb") as fh:
            cls.input_sha_before = hashlib.sha256(fh.read()).hexdigest()
        cls.res1 = serve.publish_forecast(PAYLOAD, output_dir=cls.tmp)
        cls.res2 = serve.publish_forecast(PAYLOAD, output_dir=cls.tmp)
        with open(serve.DEFAULT_INPUT, "rb") as fh:
            cls.input_sha_after = hashlib.sha256(fh.read()).hexdigest()
        cls.path1 = os.path.join(cls.tmp, cls.res1["filename"])

    def test_file_written(self):
        self.assertTrue(self.res1["ok"])
        self.assertTrue(os.path.exists(self.path1))
        self.assertTrue(self.res1["filename"].endswith(".xlsx"))

    def test_never_overwrites(self):
        self.assertNotEqual(self.res1["filename"], self.res2["filename"])
        self.assertEqual(len(serve.list_outputs(self.tmp)), 2)

    def test_input_untouched(self):
        self.assertEqual(self.input_sha_before, self.input_sha_after,
                         "publishing must not modify the input workbook")
        # and the recorded input hash matches the real input
        self.assertEqual(self.res1["inputSha256"], self.input_sha_before)

    def test_three_sheets_wellformed(self):
        with zipfile.ZipFile(self.path1) as zf:
            names = zf.namelist()
            for i in (1, 2, 3):
                self.assertIn(f"xl/worksheets/sheet{i}.xml", names)
            for n in names:  # every xml/rels part must parse
                if n.endswith(".xml") or n.endswith(".rels"):
                    ET.fromstring(zf.read(n))
            wb = zf.read("xl/workbook.xml").decode("utf-8")
            for nm in ("Final Forecast", "Assumptions", "Audit"):
                self.assertIn(f'name="{nm}"', wb)

    def test_final_forecast_contents(self):
        with zipfile.ZipFile(self.path1) as zf:
            flat = [c for row in _read_sheet(zf, "xl/worksheets/sheet1.xml") for c in row]
        self.assertIn("Test Plan", flat)
        self.assertIn("15310685", flat)     # SR forecast
        self.assertIn("2026-W01", flat)      # a weekly row
        self.assertIn("Yes", flat)           # the edited flag

    def test_audit_records_input_and_ledger(self):
        with zipfile.ZipFile(self.path1) as zf:
            flat = [c for row in _read_sheet(zf, "xl/worksheets/sheet3.xml") for c in row]
        self.assertIn(self.input_sha_before, flat)   # input provenance
        self.assertIn("set", flat)                   # the ledger action
        self.assertIn("dell_isg,esg_fy24-26.xlsx", flat)


if __name__ == "__main__":
    unittest.main(verbosity=2)
