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

It also adds an **"ASU by Product"** summary sheet: one row per FY > Quarter >
Week, one column per product (ASU summed across regions) plus a Total, with an
Excel AutoFilter on the header. This is a read-only view of the same numbers.

Safety:
  - The Service Dataset worksheet part (xl/worksheets/sheet1.xml) is rewritten;
    the summary sheet is added as a new part (xl/worksheets/sheet6.xml) and
    registered in workbook.xml / workbook.xml.rels / [Content_Types].xml (plus
    the stale Service Dataset AutoFilter range is corrected). Every other part --
    the real 10-K sheets (FY26 Official, Product Estimates, ...), styles,
    sharedStrings, calcChain, theme -- is copied byte for byte. (Verified: the
    Service Dataset has no formulas and calcChain never references it.) String
    cells are written as inline strings so sharedStrings is not touched.
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

# --- "ASU by Product" summary sheet (added to the workbook) ---
SUMMARY_SHEET_NAME = "ASU by Product"
SUMMARY_PART = "xl/worksheets/sheet6.xml"      # sheet1-5 already exist
SUMMARY_REL_TARGET = "worksheets/sheet6.xml"
SUMMARY_RID = "rId10"                          # rId1-9 already used
SUMMARY_SHEET_ID = 6                           # sheetId 1-5 already used
SUMMARY_LOCAL_IDX = 5                          # 0-based tab position (appended last)
CT_WORKSHEET = "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"

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
    # Fix the sheet's AutoFilter range so it covers all densified rows (was A1:M2965).
    xml = re.sub(r'(<autoFilter ref=")A1:M\d+(")', rf'\g<1>A1:M{last_row}\g<2>', xml, count=1)
    head = xml[: xml.index("<sheetData>")]
    tail = xml[xml.index("</sheetData>") + len("</sheetData>"):]
    return head + build_sheet_data(dense_rows) + tail


# --------------------------------------------------------------------------- #
# "ASU by Product" summary sheet
# --------------------------------------------------------------------------- #

def _col_letter(n: int) -> str:
    """1 -> A, 26 -> Z, 27 -> AA."""
    s = ""
    while n > 0:
        n, r = divmod(n - 1, 26)
        s = chr(ord("A") + r) + s
    return s


def build_asu_by_product(dense_rows):
    """ASU per product, laid out one row per (FY > Quarter > Week), one column per
    product (summed across regions) plus a Total. Returns (headers, rows)."""
    from collections import defaultdict
    products = sorted({r["product"] for r in dense_rows})
    wk_meta = {}                                   # week -> (fy, quarter)
    cell = defaultdict(int)                        # (week, product) -> ASU
    for r in dense_rows:
        wk_meta[r["fiscalWeek"]] = (r["fy"], r["fiscalQuarter"])
        cell[(r["fiscalWeek"], r["product"])] += r["asu"]
    headers = ["FY", "Fiscal Quarter", "Fiscal Week"] + products + ["Total"]
    out = []
    for w in sorted(wk_meta):                      # 'YYYY-Www' sorts chronologically
        fy, q = wk_meta[w]
        vals = [cell[(w, p)] for p in products]
        out.append([fy, q, w] + vals + [sum(vals)])
    return headers, out


def build_summary_sheet_xml(headers, data_rows) -> str:
    ncols, nrows = len(headers), len(data_rows) + 1
    last_col, last_ref = _col_letter(ncols), f"A1:{_col_letter(ncols)}{nrows}"
    n_text = 3   # first three columns (FY, Quarter, Week) are text; the rest numeric

    def cell(col_i, row_i, value, text):
        ref = f"{_col_letter(col_i)}{row_i}"
        if text:
            return f'<c r="{ref}" t="inlineStr"><is><t>{_xml_escape(value)}</t></is></c>'
        return f'<c r="{ref}"><v>{value}</v></c>'

    body = [f'<row r="1">' + "".join(cell(i + 1, 1, h, True) for i, h in enumerate(headers)) + "</row>"]
    for ri, row in enumerate(data_rows, start=2):
        cells = "".join(cell(ci + 1, ri, v, ci < n_text) for ci, v in enumerate(row))
        body.append(f'<row r="{ri}">{cells}</row>')

    cols = (
        '<cols>'
        '<col min="1" max="1" width="7" customWidth="1"/>'
        '<col min="2" max="2" width="14" customWidth="1"/>'
        '<col min="3" max="3" width="12" customWidth="1"/>'
        f'<col min="4" max="{ncols - 1}" width="15" customWidth="1"/>'
        f'<col min="{ncols}" max="{ncols}" width="14" customWidth="1"/>'
        '</cols>'
    )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        f'<dimension ref="{last_ref}"/>'
        '<sheetViews><sheetView workbookViewId="0">'
        '<pane xSplit="3" ySplit="1" topLeftCell="D2" activePane="bottomRight" state="frozen"/>'
        '</sheetView></sheetViews>'
        '<sheetFormatPr defaultRowHeight="14.4"/>'
        + cols +
        '<sheetData>' + "".join(body) + '</sheetData>'
        f'<autoFilter ref="{last_ref}"/>'
        '<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>'
        '</worksheet>'
    ), last_ref


def register_summary_sheet(wb_xml, rels_xml, ct_xml, filter_ref, service_last_row):
    """Add the summary sheet to workbook.xml / rels / [Content_Types], and fix the
    Service Dataset filter range. Every other part is left untouched."""
    wb = wb_xml.replace(
        "</sheets>",
        f'<sheet name="{SUMMARY_SHEET_NAME}" sheetId="{SUMMARY_SHEET_ID}" r:id="{SUMMARY_RID}"/></sheets>')
    wb = re.sub(r"('Service Dataset'!\$A\$1:\$M\$)\d+", rf"\g<1>{service_last_row}", wb, count=1)
    new_dn = (f'<definedName name="_xlnm._FilterDatabase" localSheetId="{SUMMARY_LOCAL_IDX}" hidden="1">'
              f"'{SUMMARY_SHEET_NAME}'!{filter_ref}</definedName>")
    wb = wb.replace("</definedNames>", new_dn + "</definedNames>")
    rels = rels_xml.replace(
        "</Relationships>",
        f'<Relationship Id="{SUMMARY_RID}" '
        'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" '
        f'Target="{SUMMARY_REL_TARGET}"/></Relationships>')
    ct = ct_xml.replace("</Types>", f'<Override PartName="/{SUMMARY_PART}" ContentType="{CT_WORKSHEET}"/></Types>')
    return wb, rels, ct


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
        wb_xml = zf.read("xl/workbook.xml").decode("utf-8")
        rels_xml = zf.read("xl/_rels/workbook.xml.rels").decode("utf-8")
        ct_xml = zf.read("[Content_Types].xml").decode("utf-8")
        names = zf.namelist()
        blobs = {n: zf.read(n) for n in names}

    # (a) densify + scale the Service Dataset sheet.
    blobs[SHEET_PART] = rewrite_sheet(sheet_xml, dense_rows).encode("utf-8")

    # (b) add the "ASU by Product" summary sheet and register it everywhere.
    headers, summary_rows = build_asu_by_product(dense_rows)
    summary_xml, last_ref = build_summary_sheet_xml(headers, summary_rows)
    abs_ref = re.sub(r"([A-Z]+)(\d+)", r"$\1$\2", last_ref)       # A1:W157 -> $A$1:$W$157
    service_last_row = len(dense_rows) + 1
    wb_xml, rels_xml, ct_xml = register_summary_sheet(wb_xml, rels_xml, ct_xml, abs_ref, service_last_row)
    blobs["xl/workbook.xml"] = wb_xml.encode("utf-8")
    blobs["xl/_rels/workbook.xml.rels"] = rels_xml.encode("utf-8")
    blobs["[Content_Types].xml"] = ct_xml.encode("utf-8")
    blobs[SUMMARY_PART] = summary_xml.encode("utf-8")
    print(f"summary sheet {SUMMARY_SHEET_NAME!r}: {len(summary_rows)} week rows x "
          f"{len(headers)} cols (range {last_ref})")

    # Write order: original parts (preserved order) with the new sheet after sheet5.
    write_names = list(names)
    write_names.insert(write_names.index("xl/worksheets/sheet5.xml") + 1, SUMMARY_PART)

    tmp = INPUT + ".tmp"
    with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zf:
        for n in write_names:
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
