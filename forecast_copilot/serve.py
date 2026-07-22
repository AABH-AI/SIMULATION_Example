#!/usr/bin/env python3
"""Forecast Copilot — local dev server + read path (Phase 1).

A zero-dependency local server for the Forecast Copilot suite. It does two jobs:

  1. Serves the static HTML/JS suite from this folder (so the pages load over
     http:// instead of file://, which is what the Phase 2 data adapter needs).
  2. Exposes a small JSON read API over the immutable input workbook:
       GET /api/health   -> liveness + which workbook is loaded (name + sha256)
       GET /api/dataset  -> the "Service Dataset" sheet parsed to cached JSON
       GET /api/outputs  -> 501 (published-forecast history; Phase 5)
       POST /api/publish -> 501 (write path; Phase 5)

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
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote, urlparse
from xml.etree import ElementTree as ET

# --------------------------------------------------------------------------- #
# Paths / constants
# --------------------------------------------------------------------------- #

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_INPUT = os.path.join(HERE, "input", "dell_isg,esg_fy24-26.xlsx")
SHEET_NAME = "Service Dataset"

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
                return self._send_json(
                    {"error": "not implemented", "phase": 5,
                     "detail": "Published-forecast history arrives in Phase 5."},
                    status=501)
            if path == "/api/publish" and method == "POST":
                return self._send_json(
                    {"error": "not implemented", "phase": 5,
                     "detail": "The write path (POST /api/publish) arrives in Phase 5."},
                    status=501)
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
