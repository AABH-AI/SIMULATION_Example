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

# Hand-checked pivot: name -> (predicate over a record, (count, ΣASU, ΣAPOS, ΣRenewals, ΣFQM)).
# For the Service Dataset (14,820 rows = 19 products x 3 regions x 260 weeks over
# 5 fiscal years FY22-FY26). FY24/FY25/FY26 are the original dense+scaled data
# (grand ASU there ~812.66M); FY22 and FY23 were back-cast from FY24 along the
# existing growth trend (FY23 = FY24 x ~0.78, FY22 x ~0.60, with small deterministic
# per-row jitter) preserving every categorical column and distribution ratio, so the
# ΣASU per slice is unchanged from the earlier ground-truth.
# ASU now decomposes into APOS + Renewals: per row Renewals = round(0.20 * ASU) and
# APOS = ASU - Renewals, so APOS + Renewals == ASU EXACTLY for every slice (~80% / ~20%).
# All numbers ground-truthed via an independent inline-string regex parse of the workbook.
PIVOT = {
    "GRAND":                    (lambda r: True,
                                 (14820, 1110489194, 888391366, 222097828, 10380)),
    "FY=FY22":                  (lambda r: r["fy"] == "FY22",
                                 (2964, 129512482, 103610014, 25902468, 2079)),
    "FY=FY23":                  (lambda r: r["fy"] == "FY23",
                                 (2964, 168314912, 134651964, 33662948, 2079)),
    "FY=FY24":                  (lambda r: r["fy"] == "FY24",
                                 (2964, 215633277, 172506602, 43126675, 2079)),
    "FY=FY25":                  (lambda r: r["fy"] == "FY25",
                                 (2964, 270636630, 216509278, 54127352, 2055)),
    "FY=FY26":                  (lambda r: r["fy"] == "FY26",
                                 (2964, 326391893, 261113508, 65278385, 2088)),
    "Region=Americas":          (lambda r: r["region"] == "Americas",
                                 (4940, 564555281, 451644242, 112911039, 3460)),
    "Region=EMEA":              (lambda r: r["region"] == "EMEA",
                                 (4940, 302291830, 241833483, 60458347, 3460)),
    "Region=APJ":               (lambda r: r["region"] == "APJ",
                                 (4940, 243642083, 194913641, 48728442, 3460)),
    "FY26 & EMEA":              (lambda r: r["fy"] == "FY26" and r["region"] == "EMEA",
                                 (988, 88724249, 70979406, 17744843, 696)),
    "Product=Server Line A":    (lambda r: r["product"] == "Server Line A",
                                 (780, 881710277, 705368217, 176342060, 591)),
    "Quarter=2026-Q1":          (lambda r: r["fiscalQuarter"] == "2026-Q1",
                                 (741, 76586300, 61269041, 15317259, 525)),
    "Week=2024-W01":            (lambda r: r["fiscalWeek"] == "2024-W01",
                                 (57, 3676019, 2940816, 735203, 42)),
    "FY26 & Server Line A & Americas": (
                                 lambda r: r["fy"] == "FY26" and r["product"] == "Server Line A"
                                 and r["region"] == "Americas",
                                 (52, 131954700, 105563761, 26390939, 40)),
}

EXPECTED_COLUMNS = [
    ("fy", "string"), ("fiscalQuarter", "string"), ("fiscalWeek", "string"),
    ("product", "string"), ("region", "string"), ("warrantyType", "string"),
    ("businessUnit", "string"),
    ("asu", "number"), ("apos", "number"), ("renewals", "number"), ("coreUpsell", "string"),
    ("woType", "string"), ("fqmFlag", "number"), ("gcfaType", "string"),
    ("serviceType", "string"),
]


def _slice_aggregate(rows, predicate):
    """Return (count, ΣASU, ΣAPOS, ΣRenewals, ΣFQMFlag) over matching rows."""
    matched = [r for r in rows if predicate(r)]
    return (
        len(matched),
        sum(r["asu"] for r in matched),
        sum(r["apos"] for r in matched),
        sum(r["renewals"] for r in matched),
        sum(r["fqmFlag"] for r in matched),
    )


class DatasetReadPathTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = serve.load_dataset()
        cls.rows = cls.data["rows"]

    # --- shape -------------------------------------------------------------- #
    def test_row_count(self):
        self.assertEqual(self.data["rowCount"], 14820)
        self.assertEqual(len(self.rows), 14820)

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
        for i in range(5):  # count, ASU, APOS, Renewals, fqm
            self.assertEqual(sum(p[i] for p in parts), grand[i])

    def test_fiscal_years_partition_grand_total(self):
        grand = _slice_aggregate(self.rows, lambda r: True)
        parts = [_slice_aggregate(self.rows, lambda r, fy=fy: r["fy"] == fy)
                 for fy in ("FY22", "FY23", "FY24", "FY25", "FY26")]
        for i in range(5):
            self.assertEqual(sum(p[i] for p in parts), grand[i])

    def test_apos_plus_renewals_equals_asu(self):
        """ASU decomposes exactly into APOS + Renewals for every row (and in total)."""
        for r in self.rows:
            self.assertEqual(r["apos"] + r["renewals"], r["asu"])
        grand = _slice_aggregate(self.rows, lambda r: True)
        self.assertEqual(grand[2] + grand[3], grand[1])          # ΣAPOS + ΣRenewals == ΣASU
        # ~80% / ~20% split at the aggregate level
        self.assertAlmostEqual(grand[2] / grand[1], 0.80, delta=0.005)
        self.assertAlmostEqual(grand[3] / grand[1], 0.20, delta=0.005)

    def test_summary_totals_match_grand(self):
        grand = _slice_aggregate(self.rows, lambda r: True)
        totals = self.data["summary"]["totals"]
        self.assertEqual(totals["asu"], grand[1])
        self.assertEqual(totals["apos"], grand[2])
        self.assertEqual(totals["renewals"], grand[3])
        self.assertEqual(totals["fqmFlag"], grand[4])

    def test_distinct_values(self):
        distinct = self.data["summary"]["distinct"]
        self.assertEqual(distinct["fy"], ["FY22", "FY23", "FY24", "FY25", "FY26"])
        self.assertEqual(distinct["region"], ["APJ", "Americas", "EMEA"])
        self.assertEqual(len(distinct["product"]), 19)
        self.assertEqual(len(distinct["fiscalQuarter"]), 20)
        self.assertEqual(distinct["businessUnit"], ["Unit A", "Unit B"])

    def test_business_unit_80_20_split(self):
        """Business Unit is ~80% Unit A / ~20% Unit B, per Product."""
        a = sum(1 for r in self.rows if r["businessUnit"] == "Unit A")
        b = sum(1 for r in self.rows if r["businessUnit"] == "Unit B")
        self.assertEqual(a + b, 14820)
        self.assertAlmostEqual(a / (a + b), 0.80, delta=0.03)   # ~80% Unit A overall
        # per-product share also lands near 80%
        from collections import defaultdict
        tot, aa = defaultdict(int), defaultdict(int)
        for r in self.rows:
            tot[r["product"]] += 1
            if r["businessUnit"] == "Unit A":
                aa[r["product"]] += 1
        for p in tot:
            self.assertAlmostEqual(aa[p] / tot[p], 0.80, delta=0.08,
                                   msg=f"product {p!r} Unit A share off")


if __name__ == "__main__":
    unittest.main(verbosity=2)
