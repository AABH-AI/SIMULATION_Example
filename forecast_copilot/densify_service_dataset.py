#!/usr/bin/env python3
"""Densify the modeled Service Dataset to a Product x Region x Week grid.

Why: the shipped Service Dataset is a *sample* -- exactly one row per
(product, week), with Region (and the other attributes) assigned to a single
rotating value. That makes multi-dimension drill-downs (e.g. Product + Region)
sparse: a product only appears in one region per week, so "PowerEdge in
Americas" exists in ~1/3 of weeks. This script rewrites that sheet so every
Product x Region x Week has a real value, and drill-downs show full weekly
trends. The sheet is explicitly labelled "MODELED ESTIMATES", so this is a
deliberate, dev-time refinement of demo data -- not real Dell figures.

Ratio-preserving with a global scale: each original (product, week) value is
first scaled by SCALE (a uniform factor, so ALL distribution ratios -- region
mix, product mix, weekly shape -- are preserved exactly), then split across the
three regions using that product's own realised regional ASU mix, with an
integer largest-remainder split so the three parts sum EXACTLY to the scaled
per-(product,week) total. Warranty Expirations are scaled + split the same way
(keeping the ASU<->Expiration relationship sane); FQM flag and the other
attributes are inherited unchanged.

SCALE = 0.10 brings ASU to a believable magnitude: the raw sample's active
support units summed unrealistically high (whole-business single-week ~50M, and
~8.1B summed across 156 weeks). At 0.10 the whole-business single-week installed
base is ~5M units. Set SCALE = 1.0 to densify without rescaling.

Safety:
  - Only the Service Dataset worksheet part (xl/worksheets/sheet1.xml) is
    rewritten. Every other part -- the real 10-K sheets (FY26 Official, Product
    Estimates, ...), styles, sharedStrings, calcChain -- is copied byte for
    byte. (Verified: the Service Dataset has no formulas and calcChain never
    references it.) String cells are written as inline strings so sharedStrings
    is not touched.
  - Idempotent: reads from a pristine source copy (`*.source.xlsx`, created on
    first run), so re-running always regenerates from the original sample.

Usage:  python densify_service_dataset.py
"""
from __future__ import annotations

import math
import os
import re
import shutil
import zipfile

import serve  # reuse the stdlib parser + column schema

HERE = os.path.dirname(os.path.abspath(__file__))
INPUT = os.path.join(HERE, "input", "dell_isg,esg_fy24-26.xlsx")
SOURCE = os.path.join(HERE, "input", "dell_isg,esg_fy24-26.source.xlsx")
SHEET_PART = "xl/worksheets/sheet1.xml"
REGIONS = ["Americas", "EMEA", "APJ"]
SCALE = 0.10   # global ASU/Expiration scale (uniform -> ratios preserved). 1.0 = no rescale.

# Column letter -> record key, in the sheet's A..M order (from serve.FIELD_SCHEMA).
_LETTERS = [chr(ord("A") + i) for i in range(len(serve.FIELD_SCHEMA))]
COLS = [(_LETTERS[i], lbl, key, typ) for i, (lbl, key, typ) in enumerate(serve.FIELD_SCHEMA)]


def _xml_escape(s: str) -> str:
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def _split_int(total: int, shares: list[float]) -> list[int]:
    """Split an integer total across shares (summing to 1) via largest remainder,
    so the returned integers sum EXACTLY to total."""
    raw = [total * s for s in shares]
    floors = [int(math.floor(x)) for x in raw]
    rem = total - sum(floors)
    order = sorted(range(len(shares)), key=lambda i: raw[i] - floors[i], reverse=True)
    for i in range(rem):
        floors[order[i]] += 1
    return floors


def regional_shares(rows) -> dict[str, list[float]]:
    """Per-product realised regional ASU share (from the original sample),
    floored at 10% each and renormalised so every region gets real coverage."""
    by_prod: dict[str, dict[str, float]] = {}
    for r in rows:
        d = by_prod.setdefault(r["product"], {rg: 0.0 for rg in REGIONS})
        d[r["region"]] = d.get(r["region"], 0.0) + (r["asu"] or 0)
    shares = {}
    for prod, d in by_prod.items():
        tot = sum(d[rg] for rg in REGIONS)
        s = [(d[rg] / tot if tot else 1 / 3) for rg in REGIONS]
        s = [max(x, 0.10) for x in s]                 # floor so no region is ~empty
        ssum = sum(s)
        shares[prod] = [x / ssum for x in s]
    return shares


def build_dense_rows(rows):
    """Expand each (product, week) row into three region rows (total-preserving)."""
    shares = regional_shares(rows)
    out = []
    for r in rows:
        sp = shares[r["product"]]
        # Scale the per-(product,week) total first (uniform -> ratios preserved),
        # then split the scaled total across regions with exact integer parts.
        asu_parts = _split_int(round(int(r["asu"] or 0) * SCALE), sp)
        exp_parts = _split_int(round(int(r["warrantyExpirations"] or 0) * SCALE), sp)
        for i, rg in enumerate(REGIONS):
            nr = dict(r)
            nr["region"] = rg
            nr["asu"] = asu_parts[i]
            nr["warrantyExpirations"] = exp_parts[i]
            out.append(nr)
    # Tidy chronological layout: week, then product, then region.
    out.sort(key=lambda r: (r["fiscalWeek"], r["product"], REGIONS.index(r["region"])))
    return out


def _cell_xml(ref: str, key: str, typ: str, value) -> str:
    if typ == "number":
        return f'<c r="{ref}" s="4"><v>{value}</v></c>'
    return f'<c r="{ref}" s="4" t="inlineStr"><is><t>{_xml_escape(value)}</t></is></c>'


def build_sheet_data(dense_rows) -> str:
    parts = ["<sheetData>"]
    # header (row 1), style s=3, inline strings
    hdr = "".join(
        f'<c r="{col}1" s="3" t="inlineStr"><is><t>{_xml_escape(lbl)}</t></is></c>'
        for col, lbl, _key, _typ in COLS
    )
    parts.append(f'<row r="1" spans="1:13">{hdr}</row>')
    for n, r in enumerate(dense_rows, start=2):
        cells = "".join(_cell_xml(f"{col}{n}", key, typ, r[key]) for col, _lbl, key, typ in COLS)
        parts.append(f'<row r="{n}" spans="1:13">{cells}</row>')
    parts.append("</sheetData>")
    return "".join(parts)


def rewrite_sheet(original_sheet_xml: str, dense_rows) -> str:
    last_row = len(dense_rows) + 1
    xml = re.sub(r'<dimension ref="[^"]+"/>', f'<dimension ref="A1:M{last_row}"/>', original_sheet_xml, count=1)
    head = xml[: xml.index("<sheetData>")]
    tail = xml[xml.index("</sheetData>") + len("</sheetData>"):]
    return head + build_sheet_data(dense_rows) + tail


def main():
    # 1) Preserve a pristine source copy on first run; always regenerate from it.
    if not os.path.exists(SOURCE):
        shutil.copy2(INPUT, SOURCE)
        print(f"saved provenance copy -> {os.path.basename(SOURCE)}")
    src_data = serve.load_dataset(SOURCE)
    rows = src_data["rows"]
    print(f"source: {len(rows)} rows, grand ASU {src_data['summary']['totals']['asu']:,}")

    dense_rows = build_dense_rows(rows)
    print(f"dense : {len(dense_rows)} rows "
          f"({len({r['product'] for r in rows})} products x {len(REGIONS)} regions x "
          f"{len({r['fiscalWeek'] for r in rows})} weeks)")

    with zipfile.ZipFile(SOURCE) as zf:
        sheet_xml = zf.read(SHEET_PART).decode("utf-8")
        names = zf.namelist()
        blobs = {n: zf.read(n) for n in names}
    blobs[SHEET_PART] = rewrite_sheet(sheet_xml, dense_rows).encode("utf-8")

    tmp = INPUT + ".tmp"
    with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zf:
        for n in names:                       # preserve original part order
            zf.writestr(n, blobs[n])
    os.replace(tmp, INPUT)
    print(f"wrote {os.path.basename(INPUT)}")

    # 2) Verify with the same parser and confirm the scaled totals are exact.
    out = serve.load_dataset(INPUT)
    ot, st = out["summary"]["totals"], src_data["summary"]["totals"]
    exp_asu = sum(round(int(r["asu"] or 0) * SCALE) for r in rows)
    exp_exp = sum(round(int(r["warrantyExpirations"] or 0) * SCALE) for r in rows)
    print(f"verify: rowCount {out['rowCount']}, ASU {ot['asu']:,} "
          f"(source {st['asu']:,} x {SCALE}), Expir {ot['warrantyExpirations']:,}")
    assert out["rowCount"] == len(dense_rows), "row count mismatch"
    assert ot["asu"] == exp_asu, "scaled ASU total mismatch!"
    assert ot["warrantyExpirations"] == exp_exp, "scaled Expirations total mismatch!"
    assert sorted(out["summary"]["distinct"]["region"]) == sorted(REGIONS), "region set changed"
    print(f"OK: densified + scaled x{SCALE}; ratios preserved (uniform scale).")


if __name__ == "__main__":
    main()
