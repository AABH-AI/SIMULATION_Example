#!/usr/bin/env python3
"""Rebuild the UI payload (btc_data.js / .json) from btc_raw_dataset.csv.
Unlike gen_btc_dataset.py (which kept only the FY27 window), this emits the FULL
FY22-FY27 weekly timeline per LOB, aggregated across regions, so the UI's
FY / Quarter / Week filters can actually slice real data. The BTC sliders still
bend only the FY27 forecast portion (fcStart onward).
Run: python gen_ui_from_csv.py
"""
import csv, json, os
from collections import defaultdict, OrderedDict

HERE = os.path.dirname(os.path.abspath(__file__))
CSV  = os.path.join(HERE, "btc_raw_dataset.csv")
SMOD_BEND = 0.92
# field/tech split of New Contract + APOS Renewal (synthetic — no source column exists).
# tech = 1 - field. Lives here in the dataset pipeline, NOT in the app engine.
FIELD_SHARE = 0.40
TECH_SHARE  = 0.60

with open(CSV, newline="", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

LOBS, CAT = [], {}
for r in rows:
    if r["LOB"] not in CAT:
        CAT[r["LOB"]] = r["Category"]; LOBS.append(r["LOB"])

# aggregate across regions: key (LOB, Fiscal Week) -> summed measures + tags
agg = defaultdict(lambda: {"asu":0,"disp":0,"sr":0,"nc":0,"apos":0,"exp":0})
meta = {}   # (lob, fw) -> (fy, fq, series)
# P5 allocation: forecast-window ASU summed per (LOB, dim, value) -> normalised weights
ALLOC_DIMS = {"region":"Region","coreupsell":"Core/Upsell","service":"Service Type"}
alloc = defaultdict(float)   # (lob, dim_key, value) -> ASU
for r in rows:
    k = (r["LOB"], r["Fiscal Week"])
    a = agg[k]
    a["asu"]  += int(r["ASU"]);          a["disp"] += int(r["Dispatches"])
    a["sr"]   += int(r["SRs"]);          a["nc"]   += int(r["New Contract"])
    a["apos"] += int(r["APOS Renewal"]); a["exp"]  += int(r["Expiring"])
    meta[k] = (r["FY"], r["Fiscal Quarter"], r["Series"])
    if r["Series"] == "Forecast":
        for dk, col in ALLOC_DIMS.items():
            alloc[(r["LOB"], dk, r[col])] += int(r["ASU"])

def alloc_for(lob):
    """Normalised forecast-window ASU shares per dimension, e.g.
    {'region':{'Americas':0.51,...}, 'coreupsell':{...}, 'service':{...}}."""
    out = {}
    for dk in ALLOC_DIMS:
        pairs = {v: w for (l, d, v), w in alloc.items() if l == lob and d == dk}
        tot = sum(pairs.values()) or 1
        out[dk] = {v: round(w / tot, 4) for v, w in sorted(pairs.items(), key=lambda x: -x[1])}
    return out

data = OrderedDict()
for lob in LOBS:
    wks = sorted(fw for (l, fw) in agg if l == lob)      # 'YYYY-Www' sorts chronologically
    fy   = [meta[(lob,w)][0] for w in wks]
    fq   = [meta[(lob,w)][1] for w in wks]
    series = [meta[(lob,w)][2] for w in wks]
    asu  = [agg[(lob,w)]["asu"]  for w in wks]
    disp = [agg[(lob,w)]["disp"] for w in wks]
    sr   = [agg[(lob,w)]["sr"]   for w in wks]
    nc   = [agg[(lob,w)]["nc"]   for w in wks]
    apos = [agg[(lob,w)]["apos"] for w in wks]
    exp  = [agg[(lob,w)]["exp"]  for w in wks]
    # field/tech split (field = round(40%), tech = remainder → field+tech == total exactly)
    nc_field   = [round(x*FIELD_SHARE) for x in nc]
    nc_tech    = [x-f for x,f in zip(nc, nc_field)]
    apos_field = [round(x*FIELD_SHARE) for x in apos]
    apos_tech  = [x-f for x,f in zip(apos, apos_field)]
    # P4 Ships Forecast: synthesised gross-shipment driver, ~15% above net new contracts.
    # Deterministic (pure function of nc). Feeds ASU as a distinct adjustable inflow; no raw
    # ships column exists in the master, so this is a derived component (like Dispatches/SRs).
    ships = [round(x * 1.15) for x in nc]
    fcStart = next(i for i,s in enumerate(series) if s == "Forecast")
    # rate targets from the FY27 forecast slice
    sD = sum(disp[fcStart:]); sS = sum(sr[fcStart:]); sA = sum(asu[fcStart:])
    data[lob] = {
        "lob": lob, "category": CAT[lob], "fcStart": fcStart,
        "fw": wks, "fy": fy, "fq": fq, "series": series,
        "asu": asu, "disp": disp, "sr": sr, "nc": nc, "apos": apos, "exp": exp, "ships": ships,
        "nc_field": nc_field, "nc_tech": nc_tech, "apos_field": apos_field, "apos_tech": apos_tech,
        "dispTarget": round((sD/sA)*SMOD_BEND, 5) if sA else 0, "dispTargetN": round(sD*SMOD_BEND),
        "srTarget":   round((sS/sA)*SMOD_BEND, 5) if sA else 0, "srTargetN":   round(sS*SMOD_BEND),
        "alloc": alloc_for(lob),
    }

# shared option lists (same timeline for every LOB)
first = data[LOBS[0]]
def uniq(seq):
    out = []
    for x in seq:
        if x not in out: out.append(x)
    return out
opts = {"fy": uniq(first["fy"]), "quarter": uniq(first["fq"]), "week": first["fw"][:]}

# declines — baked into the dataset (was a runtime CSV import). Read declines_dummy.csv
# (FW,Declines,Segment) → per-week total + field/tech maps. Global series keyed by fiscal week
# (not per-LOB); the app scales it by the active filter selection at read time (allocMult).
DECL_CSV = os.path.join(HERE, "declines_dummy.csv")
# declines file uses short fiscal weeks ('22-W01'); the dataset uses full weeks ('2022-W01').
# Map short → full so baked declines line up with the timeline (mirrors the old importer's shortFW match).
short2full = {w[2:]: w for w in opts["week"]}
decl_total, decl_field, decl_tech = {}, {}, {}
with open(DECL_CSV, newline="", encoding="utf-8") as f:
    for r in csv.DictReader(f):
        raw = r["FW"].strip()
        fw = raw if raw in short2full.values() else short2full.get(raw, raw)
        v = int(round(float(r["Declines"])))
        seg = (r.get("Segment") or "").strip().lower()
        decl_total[fw] = decl_total.get(fw, 0) + v
        if seg == "field":  decl_field[fw] = decl_field.get(fw, 0) + v
        elif seg == "tech": decl_tech[fw]  = decl_tech.get(fw, 0) + v
declines = {"total": decl_total, "field": decl_field, "tech": decl_tech}

payload = {"generated_from": "btc_raw_dataset.csv", "forecast_window": "FY27 (bent); FY22-27 timeline",
           "lobs": LOBS, "opts": opts, "data": data, "declines": declines}

with open(os.path.join(HERE, "btc_data.json"), "w", encoding="utf-8") as f:
    json.dump(payload, f, separators=(",", ":"))
with open(os.path.join(HERE, "btc_data.js"), "w", encoding="utf-8") as f:
    f.write("window.BTC_DATA = " + json.dumps(payload, separators=(",", ":")) + ";\n")

# emit a segment-augmented raw CSV: one extra "Segment" column, each source row split into a
# Tech row (60% of New Contract + APOS Renewal, all other measures intact) and a Field row
# (40% of New Contract + APOS Renewal, other measures zeroed so aggregation never double-counts).
ZERO_COLS = ["ASU", "APOS", "Renewals", "Expiring", "Dispatches", "SRs"]
seg_fields = list(rows[0].keys()) + ["Segment"]
seg_rows = []
for r in rows:
    nc = int(r["New Contract"]); f_nc = round(nc * FIELD_SHARE); t_nc = nc - f_nc
    ap = int(r["APOS Renewal"]); f_ap = round(ap * FIELD_SHARE); t_ap = ap - f_ap
    tech = dict(r); tech["New Contract"] = t_nc; tech["APOS Renewal"] = t_ap; tech["Segment"] = "Tech"
    field = dict(r); field["New Contract"] = f_nc; field["APOS Renewal"] = f_ap; field["Segment"] = "Field"
    for c in ZERO_COLS: field[c] = 0
    seg_rows.append(tech); seg_rows.append(field)
with open(os.path.join(HERE, "btc_raw_dataset_segmented.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=seg_fields); w.writeheader(); w.writerows(seg_rows)

print("LOBs:", len(LOBS), "| weeks/LOB:", len(first["fw"]),
      "| fcStart:", first["fcStart"], "| FYs:", opts["fy"],
      "| segmented rows:", len(seg_rows))
