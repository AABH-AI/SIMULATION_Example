#!/usr/bin/env python3
"""Forecast Copilot — local dev server + read path (Phase 1).

A zero-dependency local server for the Forecast Copilot suite. It does two jobs:

  1. Serves the static HTML/JS suite from this folder (so the pages load over
     http:// instead of file://, which is what the Phase 2 data adapter needs).
  2. Exposes a small JSON API over the immutable input workbook + output folder:
       GET /api/health   -> liveness + which workbook is loaded (name + sha256)
       GET /api/dataset  -> the "Service Dataset" sheet parsed to cached JSON
       GET /api/outputs  -> published-forecast history (output/*.xlsx, newest first)
       POST /api/publish -> writes a timestamped forecast .xlsx to output/ (never
                            overwrites); body is the forecast JSON from the page

The workbook is parsed with the Python standard library only (`zipfile` + XML) --
an .xlsx is a zip of XML, and this file is a small, fixed-format demo sheet, so a
dependency like openpyxl/pandas buys nothing and would break the offline/static
posture the project deliberately keeps. `python serve.py` runs on any Python 3
with nothing to install and no network.

The input workbook is treated as READ-ONLY: this server never writes to it. Its
sha256 is reported on every /api/health and /api/dataset response so "input was
never mutated" stays provable end to end.

Usage:
    python serve.py [--port 8000] [--host 127.0.0.1] [--input PATH]

The dataset parser (`load_dataset`) is importable without starting the server,
which is how test_dataset.py verifies slice aggregates against a pivot.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import threading
import zipfile
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote, urlparse
from xml.etree import ElementTree as ET

# --------------------------------------------------------------------------- #
# Paths / constants
# --------------------------------------------------------------------------- #

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_INPUT = os.path.join(HERE, "input", "dell_isg,esg_fy24-26.xlsx")
SHEET_NAME = "Service Dataset"
OUTPUT_DIR = os.path.join(HERE, "output")

# OOXML SpreadsheetML namespaces.
_MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
_RELS = "http://schemas.openxmlformats.org/package/2006/relationships"
_DOC_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"


def _q(ns: str, tag: str) -> str:
    return f"{{{ns}}}{tag}"


# Column schema for the Service Dataset sheet. Header labels are matched exactly
# against row 1 so the parser is robust to column reordering; anything numeric is
# coerced to a Python number, everything else stays a verbatim string (no value
# normalization here -- Phase 2 derives filter options from the data's own
# distinct values, which is what avoids the Poweredge/PowerEdge reconciliation
# problem at the root).
FIELD_SCHEMA = [
    ("FY", "fy", "string"),
    ("Fiscal Quarter", "fiscalQuarter", "string"),
    ("Fiscal Week", "fiscalWeek", "string"),
    ("Product", "product", "string"),
    ("Region", "region", "string"),
    ("Warranty Type", "warrantyType", "string"),
    ("ASU", "asu", "number"),
    ("Warranty Expirations", "warrantyExpirations", "number"),
    ("Core/Upsell", "coreUpsell", "string"),
    ("W/O Type", "woType", "string"),
    ("FQM Flag", "fqmFlag", "number"),
    ("GCFA Type", "gcfaType", "string"),
    ("Service Type", "serviceType", "string"),
]
# Fields that participate in numeric aggregation (totals / pivots).
NUMERIC_KEYS = [key for _lbl, key, typ in FIELD_SCHEMA if typ == "number"]
# Categorical fields we surface distinct values for.
CATEGORICAL_KEYS = [key for _lbl, key, typ in FIELD_SCHEMA if typ == "string"]


# --------------------------------------------------------------------------- #
# .xlsx parsing (stdlib only)
# --------------------------------------------------------------------------- #

def _col_letter(ref: str) -> str:
    """'B12' -> 'B' (strip the row number from an A1-style cell reference)."""
    m = re.match(r"[A-Z]+", ref)
    return m.group(0) if m else ""


def _read_shared_strings(zf: zipfile.ZipFile) -> list[str]:
    """Return the shared-string table. Concatenates rich-text runs within an <si>."""
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []
    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    out: list[str] = []
    for si in root.findall(_q(_MAIN, "si")):
        out.append("".join(t.text or "" for t in si.iter(_q(_MAIN, "t"))))
    return out


def _worksheet_path(zf: zipfile.ZipFile, sheet_name: str) -> str:
    """Resolve the worksheet part path for a sheet by its display name."""
    wb = ET.fromstring(zf.read("xl/workbook.xml"))
    rid = None
    for sheet in wb.iter(_q(_MAIN, "sheet")):
        if sheet.get("name") == sheet_name:
            rid = sheet.get(_q(_DOC_REL, "id"))
            break
    if rid is None:
        raise ValueError(f"Sheet {sheet_name!r} not found in workbook")

    rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    for rel in rels.iter(_q(_RELS, "Relationship")):
        if rel.get("Id") == rid:
            target = rel.get("Target")
            # Targets are relative to the xl/ folder.
            return "xl/" + target.lstrip("/") if not target.startswith("xl/") else target
    raise ValueError(f"Relationship {rid!r} for sheet {sheet_name!r} not found")


def _coerce_number(text: str):
    """Parse an OOXML numeric cell value; return int when integral, else float."""
    f = float(text)
    return int(f) if f.is_integer() else f


def _cell_value(c: ET.Element, shared: list[str]):
    """Extract a cell's value, resolving shared strings / inline strings / formulas."""
    t = c.get("t")
    if t == "inlineStr":
        is_el = c.find(_q(_MAIN, "is"))
        if is_el is None:
            return None
        return "".join(tt.text or "" for tt in is_el.iter(_q(_MAIN, "t")))
    v = c.find(_q(_MAIN, "v"))
    if v is None or v.text is None:
        return None
    if t == "s":            # shared string index
        return shared[int(v.text)]
    if t in ("str",):       # formula string result
        return v.text
    if t == "b":            # boolean
        return v.text not in ("0", "", None)
    return v.text           # numeric (as raw text; coerced by column schema later)


def load_dataset(input_path: str = DEFAULT_INPUT, sheet_name: str = SHEET_NAME) -> dict:
    """Parse the Service Dataset sheet into a JSON-ready dict.

    Returns:
        {
          "source": <basename>, "sheet": <name>, "sha256": <hex>,
          "columns": [ {"key","label","type"} ... ],
          "rowCount": int,
          "rows": [ { <key>: value, ... }, ... ],
          "summary": { "totals": {<numeric key>: n}, "distinct": {<cat key>: [...]} }
        }

    The input file is opened read-only and never modified.
    """
    with open(input_path, "rb") as fh:
        raw = fh.read()
    sha256 = hashlib.sha256(raw).hexdigest()

    with zipfile.ZipFile(input_path) as zf:
        shared = _read_shared_strings(zf)
        ws_path = _worksheet_path(zf, sheet_name)
        ws = ET.fromstring(zf.read(ws_path))

    sheet_data = ws.find(_q(_MAIN, "sheetData"))
    if sheet_data is None:
        raise ValueError(f"Sheet {sheet_name!r} has no sheetData")
    rows = sheet_data.findall(_q(_MAIN, "row"))
    if not rows:
        raise ValueError(f"Sheet {sheet_name!r} is empty")

    # --- Map header labels (row 1) to column letters, then to our schema. ---
    header = {}
    for c in rows[0]:
        header[_col_letter(c.get("r", ""))] = _cell_value(c, shared)
    label_to_letter = {v: k for k, v in header.items() if v is not None}

    schema, letter_map = [], {}   # letter_map: col letter -> (key, type)
    for label, key, typ in FIELD_SCHEMA:
        letter = label_to_letter.get(label)
        if letter is None:
            raise ValueError(f"Expected column {label!r} not found in {sheet_name!r} header")
        letter_map[letter] = (key, typ)
        schema.append({"key": key, "label": label, "type": typ})

    # --- Parse data rows. ---
    records = []
    for r in rows[1:]:
        rec = {}
        for c in r:
            letter = _col_letter(c.get("r", ""))
            spec = letter_map.get(letter)
            if spec is None:
                continue  # column outside our schema; ignore
            key, typ = spec
            val = _cell_value(c, shared)
            if typ == "number" and val is not None and val != "":
                val = _coerce_number(val)
            rec[key] = val
        # Skip fully-blank trailing rows (defensive; none expected in this file).
        if any(v not in (None, "") for v in rec.values()):
            # Ensure every schema key is present even if the cell was absent.
            for _label, key, _typ in FIELD_SCHEMA:
                rec.setdefault(key, None)
            records.append(rec)

    # --- Summary: numeric totals + distinct categorical values. ---
    totals = {k: 0 for k in NUMERIC_KEYS}
    for rec in records:
        for k in NUMERIC_KEYS:
            v = rec.get(k)
            if isinstance(v, (int, float)):
                totals[k] += v
    totals = {k: (int(v) if float(v).is_integer() else v) for k, v in totals.items()}

    distinct = {}
    for k in CATEGORICAL_KEYS:
        seen = {rec.get(k) for rec in records if rec.get(k) is not None}
        distinct[k] = sorted(seen)

    return {
        "source": os.path.basename(input_path),
        "sheet": sheet_name,
        "sha256": sha256,
        "columns": schema,
        "rowCount": len(records),
        "rows": records,
        "summary": {"totals": totals, "distinct": distinct},
    }


# --------------------------------------------------------------------------- #
# Cached loader
# --------------------------------------------------------------------------- #

class DatasetCache:
    """Parses the workbook once and serves the cached result to every request.

    Re-parses only if the file's (mtime, size) change -- cheap way to pick up an
    edited input during dev without a restart, while normally never re-reading.
    """

    def __init__(self, input_path: str):
        self.input_path = input_path
        self._lock = threading.Lock()
        self._data = None
        self._stamp = None

    def _current_stamp(self):
        st = os.stat(self.input_path)
        return (st.st_mtime_ns, st.st_size)

    def get(self) -> dict:
        with self._lock:
            stamp = self._current_stamp()
            if self._data is None or stamp != self._stamp:
                self._data = load_dataset(self.input_path)
                self._stamp = stamp
            return self._data


# --------------------------------------------------------------------------- #
# Write path: publish a forecast to output/ (Phase 5)
# --------------------------------------------------------------------------- #
# A minimal, dependency-free .xlsx WRITER (same stdlib-only posture as the
# reader): strings are written as inline strings so there is no shared-string
# table to manage; a tiny styles part gives a normal + a bold cell style.

def _xml_escape(s: str) -> str:
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            .replace('"', "&quot;"))


def _col_name(n: int) -> str:
    """1 -> A, 26 -> Z, 27 -> AA (for writing A1-style refs)."""
    s = ""
    while n > 0:
        n, r = divmod(n - 1, 26)
        s = chr(ord("A") + r) + s
    return s


def _cell_xml(ref: str, value) -> str:
    """A cell is a scalar, or {'v': value, 'b': True} for bold."""
    bold = False
    if isinstance(value, dict):
        bold, value = bool(value.get("b")), value.get("v")
    s = ' s="1"' if bold else ""
    if isinstance(value, bool):
        value = "TRUE" if value else "FALSE"
    if value is None or value == "":
        return f'<c r="{ref}"{s}/>'
    if isinstance(value, (int, float)):
        return f'<c r="{ref}"{s}><v>{value}</v></c>'
    return f'<c r="{ref}"{s} t="inlineStr"><is><t xml:space="preserve">{_xml_escape(value)}</t></is></c>'


def _sheet_xml(rows) -> str:
    maxc = max((len(r) for r in rows), default=1)
    body = []
    for ri, row in enumerate(rows, start=1):
        cells = "".join(_cell_xml(f"{_col_name(ci + 1)}{ri}", row[ci]) for ci in range(len(row)))
        body.append(f'<row r="{ri}">{cells}</row>')
    dim = f"A1:{_col_name(max(maxc, 1))}{max(len(rows), 1)}"
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
            'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            f'<dimension ref="{dim}"/><sheetData>' + "".join(body) + "</sheetData></worksheet>")


def _write_xlsx(path, sheets):
    """sheets = [{'name': str, 'rows': [[cell, ...], ...]}]. Writes a valid .xlsx."""
    n = len(sheets)
    ct = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
          '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
          '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
          '<Default Extension="xml" ContentType="application/xml"/>'
          '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
          + "".join(f'<Override PartName="/xl/worksheets/sheet{i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' for i in range(n))
          + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>')
    root_rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                 '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                 '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
    sheet_tags = "".join(f'<sheet name="{_xml_escape(s["name"])}" sheetId="{i+1}" r:id="rId{i+1}"/>' for i, s in enumerate(sheets))
    workbook = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
                'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
                f'<sheets>{sheet_tags}</sheets></workbook>')
    wb_rels = ("".join(f'<Relationship Id="rId{i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{i+1}.xml"/>' for i in range(n))
               + f'<Relationship Id="rId{n+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>')
    wb_rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
               '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + wb_rels + "</Relationships>")
    styles = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
              '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
              '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>'
              '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>'
              '<borders count="1"><border/></borders>'
              '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
              '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
              '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>'
              '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>')

    tmp = path + ".tmp"
    with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", ct)
        zf.writestr("_rels/.rels", root_rels)
        zf.writestr("xl/workbook.xml", workbook)
        zf.writestr("xl/_rels/workbook.xml.rels", wb_rels)
        zf.writestr("xl/styles.xml", styles)
        for i, s in enumerate(sheets):
            zf.writestr(f"xl/worksheets/sheet{i+1}.xml", _sheet_xml(s["rows"]))
    os.replace(tmp, path)


def publish_forecast(payload, output_dir=OUTPUT_DIR, input_path=DEFAULT_INPUT):
    """Write a timestamped forecast workbook (Final Forecast / Assumptions / Audit)
    to output_dir. Never overwrites. Returns metadata. Reads-only the input (its
    sha256 is recorded in the Audit sheet)."""
    os.makedirs(output_dir, exist_ok=True)
    now = datetime.now()
    published_at = now.strftime("%Y-%m-%d %H:%M:%S")
    input_sha = ""
    if os.path.exists(input_path):
        with open(input_path, "rb") as fh:
            input_sha = hashlib.sha256(fh.read()).hexdigest()
    scenario = str(payload.get("scenario") or "forecast")
    data_mode = str(payload.get("dataMode") or "")

    def B(v):
        return {"v": v, "b": True}

    # --- Final Forecast sheet ---
    ff = [[B("Final Forecast")], ["Scenario", scenario], ["Published", published_at],
          ["Data source", data_mode], [],
          [B("Metric"), B("Forecast"), B("Target"), B("Gap"), B("BTC %")]]
    for m in payload.get("summary", []) or []:
        ff.append([m.get("metric"), m.get("forecast"), m.get("target"), m.get("gap"), m.get("btcPct")])
    ff += [[], [B("Fiscal Week"), B("DS Forecast"), B("BTC Forecast"), B("Variance"), B("Edited")]]
    for w in payload.get("weekly", []) or []:
        ff.append([w.get("week"), w.get("ds"), w.get("btc"), w.get("variance"), ("Yes" if w.get("edited") else "")])

    # --- Assumptions sheet ---
    asm = [[B("Assumptions")], [B("Slice")]]
    for k, v in (payload.get("slice") or {}).items():
        asm.append([k, v])
    asm += [[], [B("Levers")]]
    for k, v in (payload.get("assumptions") or {}).items():
        asm.append([k, v])

    # --- Audit sheet ---
    aud = [[B("Audit")], ["Published at", published_at], ["Scenario", scenario],
           ["Input file", os.path.basename(input_path)], ["Input SHA-256", input_sha],
           ["Data source", data_mode], [],
           [B("Change ledger")], [B("Timestamp"), B("Action"), B("Week"), B("From"), B("To")]]
    ledger = payload.get("ledger", []) or []
    if ledger:
        for e in ledger:
            aud.append([e.get("ts"), e.get("action"), e.get("week"),
                        ("" if e.get("from") is None else e.get("from")),
                        ("" if e.get("to") is None else e.get("to"))])
    else:
        aud.append(["(no manual edits)"])

    sheets = [{"name": "Final Forecast", "rows": ff},
              {"name": "Assumptions", "rows": asm},
              {"name": "Audit", "rows": aud}]

    slug = re.sub(r"[^A-Za-z0-9]+", "-", scenario).strip("-").lower() or "forecast"
    base = f"forecast_{slug}_{now.strftime('%Y-%m-%d_%H%M%S')}"
    name, i = base + ".xlsx", 2
    while os.path.exists(os.path.join(output_dir, name)):   # never overwrite
        name, i = f"{base}-{i}.xlsx", i + 1
    dest = os.path.join(output_dir, name)
    _write_xlsx(dest, sheets)
    return {"ok": True, "filename": name, "publishedAt": published_at,
            "inputSha256": input_sha, "bytes": os.path.getsize(dest)}


def list_outputs(output_dir=OUTPUT_DIR):
    """List published .xlsx files (newest first) with size + mtime."""
    if not os.path.isdir(output_dir):
        return []
    out = []
    for n in os.listdir(output_dir):
        if n.lower().endswith(".xlsx") and not n.startswith("~$"):
            st = os.stat(os.path.join(output_dir, n))
            out.append({"filename": n, "bytes": st.st_size,
                        "modified": datetime.fromtimestamp(st.st_mtime).strftime("%Y-%m-%d %H:%M:%S")})
    out.sort(key=lambda x: x["modified"], reverse=True)
    return out


# --------------------------------------------------------------------------- #
# HTTP handler
# --------------------------------------------------------------------------- #

class Handler(SimpleHTTPRequestHandler):
    cache: DatasetCache = None      # injected by make_server
    server_dir: str = HERE          # static root

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=self.server_dir, **kwargs)

    # -- helpers ----------------------------------------------------------- #
    def _send_json(self, obj, status=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def _dashboard_target(self):
        """Return the encoded URL path of the Dashboard page, if present."""
        for name in sorted(os.listdir(self.server_dir)):
            if name.startswith("Dashboard") and name.endswith(".html"):
                from urllib.parse import quote
                return "/" + quote(name)
        return None

    # -- routing ----------------------------------------------------------- #
    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/":
            target = self._dashboard_target()
            if target:
                self.send_response(302)
                self.send_header("Location", target)
                self.end_headers()
                return
            # fall through to directory listing
        if path.startswith("/api/"):
            return self._handle_api(path, "GET")
        return super().do_GET()

    def do_HEAD(self):
        path = urlparse(self.path).path
        if path.startswith("/api/"):
            return self._handle_api(path, "HEAD")
        return super().do_HEAD()

    def do_POST(self):
        path = urlparse(self.path).path
        if path.startswith("/api/"):
            return self._handle_api(path, "POST")
        self._send_json({"error": "not found", "path": path}, status=404)

    def _handle_api(self, path, method):
        try:
            if path == "/api/health" and method in ("GET", "HEAD"):
                d = self.cache.get()
                return self._send_json({
                    "status": "ok",
                    "source": d["source"],
                    "sheet": d["sheet"],
                    "sha256": d["sha256"],
                    "rowCount": d["rowCount"],
                })
            if path == "/api/dataset" and method in ("GET", "HEAD"):
                return self._send_json(self.cache.get())
            if path == "/api/outputs" and method in ("GET", "HEAD"):
                return self._send_json({"outputs": list_outputs()})
            if path == "/api/publish" and method == "POST":
                length = int(self.headers.get("Content-Length", 0) or 0)
                raw = self.rfile.read(length) if length else b""
                try:
                    payload = json.loads(raw.decode("utf-8")) if raw else {}
                except json.JSONDecodeError as exc:
                    return self._send_json({"error": "bad request", "detail": f"invalid JSON: {exc}"}, status=400)
                res = publish_forecast(payload, input_path=self.cache.input_path)
                return self._send_json(res, status=201)
            return self._send_json({"error": "not found", "path": path}, status=404)
        except Exception as exc:  # noqa: BLE001 -- surface parse/IO errors as JSON
            return self._send_json({"error": "server error", "detail": str(exc)}, status=500)

    # Quieter, single-line logging.
    def log_message(self, fmt, *args):
        sys.stderr.write("  %s - %s\n" % (self.address_string(), fmt % args))


# --------------------------------------------------------------------------- #
# Server bootstrap
# --------------------------------------------------------------------------- #

def make_server(host: str, port: int, input_path: str) -> ThreadingHTTPServer:
    cache = DatasetCache(input_path)

    handler = type("BoundHandler", (Handler,), {"cache": cache, "server_dir": HERE})
    httpd = ThreadingHTTPServer((host, port), handler)
    return httpd


def main(argv=None):
    ap = argparse.ArgumentParser(description="Forecast Copilot local server (Phase 1)")
    ap.add_argument("--host", default="127.0.0.1", help="bind host (default: 127.0.0.1, localhost only)")
    ap.add_argument("--port", type=int, default=8000, help="bind port (default: 8000)")
    ap.add_argument("--input", default=DEFAULT_INPUT, help="path to the input workbook")
    args = ap.parse_args(argv)

    if not os.path.exists(args.input):
        sys.exit(f"Input workbook not found: {args.input}")

    # Parse once up front so startup fails loudly on a bad file, and print a summary.
    try:
        data = load_dataset(args.input)
    except Exception as exc:  # noqa: BLE001
        sys.exit(f"Failed to parse {args.input}: {exc}")

    httpd = make_server(args.host, args.port, args.input)
    url = f"http://{args.host}:{args.port}/"
    print("Forecast Copilot server (Phase 1 - read path)")
    print(f"  serving : {HERE}")
    print(f"  input   : {os.path.basename(args.input)}  (sha256 {data['sha256'][:12]}...)")
    print(f"  dataset : {data['rowCount']} rows, sheet {data['sheet']!r}")
    print(f"  totals  : ASU={data['summary']['totals']['asu']:,}  "
          f"Expirations={data['summary']['totals']['warrantyExpirations']:,}")
    print(f"  API     : {url}api/health  |  {url}api/dataset")
    print(f"  open    : {url}   (Ctrl+C to stop)")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped.")
        httpd.shutdown()


if __name__ == "__main__":
    main()
