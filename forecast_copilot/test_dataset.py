#!/usr/bin/env python3
"""Phase 1 verification test for the Forecast Copilot read path.

Asserts that serve.load_dataset() reproduces a hand-checked pivot of the
"Service Dataset" sheet. The expected numbers below are the ground truth: they
were computed with a completely independent regex/streaming parse of the .xlsx
(a different code path from serve.py's ElementTree parser) and cross-checked for
internal consistency -- every region slice sums to the grand total, every fiscal
year sums to the grand total, and the per-slice row counts reconcile. So this is
a genuine cross-validation of the parser, not the parser checked against itself.

Run:  python -m unittest -v   (from the forecast_copilot/ folder)
  or: python test_dataset.py

Pure stdlib -- no third-party packages required.
"""
import os
import unittest

import serve

HERE = os.path.dirname(os.path.abspath(__file__))

# Hand-checked pivot: name -> (predicate over a record, (count, ΣASU, ΣExpirations, ΣFQM)).
# For the DENSE Service Dataset (8,892 rows = 19 products x 3 regions x 156 weeks),
# produced by densify_service_dataset.py. The grid is total-preserving: grand ASU
# and ΣExpirations are unchanged from the original sample; FQM is inherited into
# each of the 3 region rows (so ΣFQM = 3 x the original 2074 = 6222). Regional ASU
# totals shift slightly vs the original sample because each (product,week) value is
# now split across regions by a largest-remainder integer split. Ground-truthed via
# an independent inline-string regex parse of the workbook.
PIVOT = {
    "GRAND":                    (lambda r: True,
                                 (8892, 8126618028, 46961720, 6222)),
    "FY=FY24":                  (lambda r: r["fy"] == "FY24",
                                 (2964, 2156332756, 12135552, 2079)),
    "FY=FY25":                  (lambda r: r["fy"] == "FY25",
                                 (2964, 2706366343, 15647476, 2055)),
    "FY=FY26":                  (lambda r: r["fy"] == "FY26",
                                 (2964, 3263918929, 19178692, 2088)),
    "Region=Americas":          (lambda r: r["region"] == "Americas",
                                 (2964, 4133546981, 23877048, 2074)),
    "Region=EMEA":              (lambda r: r["region"] == "EMEA",
                                 (2964, 2211365747, 12786696, 2074)),
    "Region=APJ":               (lambda r: r["region"] == "APJ",
                                 (2964, 1781705300, 10297976, 2074)),
    "FY26 & EMEA":              (lambda r: r["fy"] == "FY26" and r["region"] == "EMEA",
                                 (988, 887242721, 5217992, 696)),
    "Product=Poweredge":        (lambda r: r["product"] == "Poweredge",
                                 (468, 6456134248, 37273392, 351)),
    "Quarter=2026-Q1":          (lambda r: r["fiscalQuarter"] == "2026-Q1",
                                 (741, 765863013, 4794673, 525)),
    "Week=2024-W01":            (lambda r: r["fiscalWeek"] == "2024-W01",
                                 (57, 36760198, 233376, 42)),
    "FY26 & Poweredge & Americas": (
                                 lambda r: r["fy"] == "FY26" and r["product"] == "Poweredge"
                                 and r["region"] == "Americas",
                                 (52, 1319546987, 7746856, 40)),
}

EXPECTED_COLUMNS = [
    ("fy", "string"), ("fiscalQuarter", "string"), ("fiscalWeek", "string"),
    ("product", "string"), ("region", "string"), ("warrantyType", "string"),
    ("asu", "number"), ("warrantyExpirations", "number"), ("coreUpsell", "string"),
    ("woType", "string"), ("fqmFlag", "number"), ("gcfaType", "string"),
    ("serviceType", "string"),
]


def _slice_aggregate(rows, predicate):
    """Return (count, ΣASU, ΣWarrantyExpirations, ΣFQMFlag) over matching rows."""
    matched = [r for r in rows if predicate(r)]
    return (
        len(matched),
        sum(r["asu"] for r in matched),
        sum(r["warrantyExpirations"] for r in matched),
        sum(r["fqmFlag"] for r in matched),
    )


class DatasetReadPathTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = serve.load_dataset()
        cls.rows = cls.data["rows"]

    # --- shape -------------------------------------------------------------- #
    def test_row_count(self):
        self.assertEqual(self.data["rowCount"], 8892)
        self.assertEqual(len(self.rows), 8892)

    def test_columns(self):
        got = [(c["key"], c["type"]) for c in self.data["columns"]]
        self.assertEqual(got, EXPECTED_COLUMNS)

    def test_input_hash_unchanged(self):
        """The parsed file's sha256 must match the committed INPUT_SHA256.txt."""
        rec = os.path.join(HERE, "input", "INPUT_SHA256.txt")
        with open(rec, encoding="utf-8") as fh:
            expected = fh.read().split()[0].strip().lstrip("*")
        self.assertEqual(self.data["sha256"], expected,
                         "input workbook hash changed -- input must stay immutable")

    # --- pivot aggregates --------------------------------------------------- #
    def test_pivot_slices(self):
        for name, (pred, expected) in PIVOT.items():
            with self.subTest(slice=name):
                self.assertEqual(_slice_aggregate(self.rows, pred), expected,
                                 f"slice {name!r} does not match hand-checked pivot")

    # --- structural consistency (independent of the frozen numbers) --------- #
    def test_regions_partition_grand_total(self):
        grand = _slice_aggregate(self.rows, lambda r: True)
        parts = [_slice_aggregate(self.rows, lambda r, rg=rg: r["region"] == rg)
                 for rg in ("Americas", "EMEA", "APJ")]
        for i in range(4):  # count, ASU, expirations, fqm
            self.assertEqual(sum(p[i] for p in parts), grand[i])

    def test_fiscal_years_partition_grand_total(self):
        grand = _slice_aggregate(self.rows, lambda r: True)
        parts = [_slice_aggregate(self.rows, lambda r, fy=fy: r["fy"] == fy)
                 for fy in ("FY24", "FY25", "FY26")]
        for i in range(4):
            self.assertEqual(sum(p[i] for p in parts), grand[i])

    def test_summary_totals_match_grand(self):
        grand = _slice_aggregate(self.rows, lambda r: True)
        totals = self.data["summary"]["totals"]
        self.assertEqual(totals["asu"], grand[1])
        self.assertEqual(totals["warrantyExpirations"], grand[2])
        self.assertEqual(totals["fqmFlag"], grand[3])

    def test_distinct_values(self):
        distinct = self.data["summary"]["distinct"]
        self.assertEqual(distinct["fy"], ["FY24", "FY25", "FY26"])
        self.assertEqual(distinct["region"], ["APJ", "Americas", "EMEA"])
        self.assertEqual(len(distinct["product"]), 19)
        self.assertEqual(len(distinct["fiscalQuarter"]), 12)


if __name__ == "__main__":
    unittest.main(verbosity=2)
