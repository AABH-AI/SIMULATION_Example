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

with open(CSV, newline="", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

LOBS, CAT = [], {}
for r in rows:
    if r["LOB"] not in CAT:
        CAT[r["LOB"]] = r["Category"]; LOBS.append(r["LOB"])

# aggregate across regions: key (LOB, Fiscal Week) -> summed measures + tags
agg = defaultdict(lambda: {"asu":0,"disp":0,"sr":0,"nc":0,"apos":0,"exp":0})
meta = {}   # (lob, fw) -> (fy, fq, series)
for r in rows:
    k = (r["LOB"], r["Fiscal Week"])
    a = agg[k]
    a["asu"]  += int(r["ASU"]);          a["disp"] += int(r["Dispatches"])
    a["sr"]   += int(r["SRs"]);          a["nc"]   += int(r["New Contract"])
    a["apos"] += int(r["APOS Renewal"]); a["exp"]  += int(r["Expiring"])
    meta[k] = (r["FY"], r["Fiscal Quarter"], r["Series"])

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
    fcStart = next(i for i,s in enumerate(series) if s == "Forecast")
    # rate targets from the FY27 forecast slice
    sD = sum(disp[fcStart:]); sS = sum(sr[fcStart:]); sA = sum(asu[fcStart:])
    data[lob] = {
        "lob": lob, "category": CAT[lob], "fcStart": fcStart,
        "fw": wks, "fy": fy, "fq": fq, "series": series,
        "asu": asu, "disp": disp, "sr": sr, "nc": nc, "apos": apos, "exp": exp,
        "dispTarget": round((sD/sA)*SMOD_BEND, 5) if sA else 0, "dispTargetN": round(sD*SMOD_BEND),
        "srTarget":   round((sS/sA)*SMOD_BEND, 5) if sA else 0, "srTargetN":   round(sS*SMOD_BEND),
    }

# shared option lists (same timeline for every LOB)
first = data[LOBS[0]]
def uniq(seq):
    out = []
    for x in seq:
        if x not in out: out.append(x)
    return out
opts = {"fy": uniq(first["fy"]), "quarter": uniq(first["fq"]), "week": first["fw"][:]}

payload = {"generated_from": "btc_raw_dataset.csv", "forecast_window": "FY27 (bent); FY22-27 timeline",
           "lobs": LOBS, "opts": opts, "data": data}

with open(os.path.join(HERE, "btc_data.json"), "w", encoding="utf-8") as f:
    json.dump(payload, f, separators=(",", ":"))
with open(os.path.join(HERE, "btc_data.js"), "w", encoding="utf-8") as f:
    f.write("window.BTC_DATA = " + json.dumps(payload, separators=(",", ":")) + ";\n")

print("LOBs:", len(LOBS), "| weeks/LOB:", len(first["fw"]),
      "| fcStart:", first["fcStart"], "| FYs:", opts["fy"])
