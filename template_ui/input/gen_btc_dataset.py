#!/usr/bin/env python3
"""Build BTC raw dataset (8 LOBs) from the anonymised master forecast_fy26.xlsx.
Actuals FY22-26 (real ASU/APOS/Renewals) + derived Expiring/NewContract/Dispatches/SR
+ generated FY27 forward forecast window that the BTC sliders bend.
Outputs (into template_ui/input/): btc_raw_dataset.csv, btc_data.json
Deterministic (fixed seeds). Run: python gen_btc_dataset.py
"""
import openpyxl, json, csv, os, hashlib
from collections import defaultdict

def stable_seed(*parts):
    """Deterministic seed from strings (Python's hash() is salted per-process)."""
    return int(hashlib.md5("|".join(map(str,parts)).encode()).hexdigest()[:8], 16)

SRC = r"D:/Repos/#Git/SIMULATION_Example/master/forecast_copilot_v2/input/forecast_fy26.xlsx"
OUT = r"D:/Repos/#Git/SIMULATION_Example/master/template_ui/input"
os.makedirs(OUT, exist_ok=True)

LOBS = ["Server Line A","Server Line B (AI)","Storage Array C","Storage Array D",
        "Data Protection B","Hyperconverged A","Networking A","Storage Array H"]
CATEGORY = {"Server Line A":"Server","Server Line B (AI)":"Server","Storage Array C":"Storage",
    "Storage Array D":"Storage","Storage Array H":"Storage","Data Protection B":"Data Protection",
    "Hyperconverged A":"Hyperconverged","Networking A":"Networking"}

BASE_MDR = 0.00072      # dispatches / ASU  (weekly)
BASE_ICR = 0.00130      # SRs / ASU         (weekly)
INFLOW   = 0.0040       # new-contract inflow as fraction of ASU
RENFRAC  = 0.0009       # renewal inflow as fraction of ASU
# per-LOB tuning: (mdr_mult, icr_mult, fy27_yoy)
TUNE = {
 "Server Line A":     (1.00,1.00,0.97),
 "Server Line B (AI)":(1.25,1.30,1.22),
 "Storage Array C":   (1.10,0.95,0.99),
 "Storage Array D":   (1.15,0.98,0.96),
 "Storage Array H":   (1.08,0.96,0.94),
 "Data Protection B": (0.90,1.05,1.02),
 "Hyperconverged A":  (1.05,1.00,1.01),
 "Networking A":      (0.80,0.85,0.98),
}
SMOD_BEND = 0.92  # rate target = 92% of DS forecast rate

def srand(seed):
    s=[seed % 2147483647]
    if s[0]<=0: s[0]+=2147483646
    def r():
        s[0]=(s[0]*16807)%2147483647
        return (s[0]-1)/2147483646
    return r

wb=openpyxl.load_workbook(SRC, read_only=True)
ws=wb["Service Dataset"]; it=ws.iter_rows(values_only=True); H=next(it)
ix={n:i for i,n in enumerate(H)}
act=defaultdict(lambda:defaultdict(list))
for r in it:
    lob=r[ix["Product"]]
    if lob not in LOBS: continue
    act[lob][r[ix["Region"]]].append({
        "fy":r[ix["FY"]],"fq":r[ix["Fiscal Quarter"]],"fw":r[ix["Fiscal Week"]],
        "asu":r[ix["ASU"]] or 0,"apos":r[ix["APOS"]] or 0,"ren":r[ix["Renewals"]] or 0,
        "bu":r[ix["Business Unit"]],"war":r[ix["Warranty Type"]],"cu":r[ix["Core/Upsell"]],
        "wo":r[ix["W/O Type"]],"gcfa":r[ix["GCFA Type"]],"st":r[ix["Service Type"]]})

REGIONS=["Americas","EMEA","APJ"]

def derive_series(lob, reg, rows):
    mdr=BASE_MDR*TUNE[lob][0]; icr=BASE_ICR*TUNE[lob][1]; yoy=TUNE[lob][2]
    rnd=srand(stable_seed(lob,reg) % 2000000 + 7)
    def chain_flows(asu, prev):
        # Expiring is the balancing term: ASU = prev - Exp + New + Renewed closes exactly.
        newc=round(asu*INFLOW*(0.7+0.6*rnd())); renewed=round(asu*RENFRAC*(0.7+0.6*rnd()))
        exp=prev+newc+renewed-asu
        if exp<0: newc+=-exp; exp=0
        return exp,newc,renewed
    recs=[]; prev_asu=None
    for rec in rows:
        asu=rec["asu"]; prev=asu if prev_asu is None else prev_asu
        exp,newc,renewed=chain_flows(asu,prev)
        recs.append({**rec,"series":"Actual","expiring":exp,"new_contract":newc,
                     "apos_renewal":renewed,"dispatches":round(asu*mdr*(0.85+0.30*rnd())),
                     "srs":round(asu*icr*(0.85+0.30*rnd()))}); prev_asu=asu
    fy26=[x for x in recs if x["fy"]=="FY26"]; fy27=[]
    for i,base in enumerate(fy26[:52]):
        wnum=i+1; asu=round(base["asu"]*yoy*(0.98+0.04*rnd()))
        prev=asu if i==0 else prev_asu       # fresh anchor at FY27 W01 (no year-wrap seam)
        exp,newc,renewed=chain_flows(asu,prev); q=(wnum-1)//13+1
        fy27.append({"fy":"FY27","fq":f"2027-Q{q}","fw":f"2027-W{wnum:02d}","asu":asu,
            "apos":round(asu*0.8),"ren":renewed,"bu":base["bu"],"war":base["war"],"cu":base["cu"],
            "wo":base["wo"],"gcfa":base["gcfa"],"st":base["st"],"series":"Forecast","expiring":exp,
            "new_contract":newc,"apos_renewal":renewed,"dispatches":round(asu*mdr*(0.85+0.30*rnd())),
            "srs":round(asu*icr*(0.85+0.30*rnd()))}); prev_asu=asu
    return recs+fy27

raw_rows=[]; ui={}
for lob in LOBS:
    agg=defaultdict(lambda:{"asu":0,"disp":0,"sr":0,"exp":0,"nc":0,"apos":0})
    tail=defaultdict(lambda:{"asu":0,"disp":0,"sr":0}); order=[]
    for reg in REGIONS:
        rows=act[lob][reg]
        if not rows: continue
        for x in derive_series(lob,reg,rows):
            raw_rows.append([x["fy"],x["fq"],x["fw"],lob,CATEGORY[lob],reg,x["bu"],x["war"],
                x["cu"],x["st"],x["gcfa"],x["wo"],x["series"],x["asu"],x["apos"],x["ren"],
                x["expiring"],x["new_contract"],x["apos_renewal"],x["dispatches"],x["srs"]])
            if x["series"]=="Forecast":
                a=agg[x["fw"]];a["asu"]+=x["asu"];a["disp"]+=x["dispatches"];a["sr"]+=x["srs"]
                a["exp"]+=x["expiring"];a["nc"]+=x["new_contract"];a["apos"]+=x["apos_renewal"]
                if x["fw"] not in order: order.append(x["fw"])
            elif x["fy"]=="FY26":
                t=tail[x["fw"]];t["asu"]+=x["asu"];t["disp"]+=x["dispatches"];t["sr"]+=x["srs"]
    order=sorted(order); tailw=sorted(tail.keys())[-8:]
    wk=[w.split("-W")[1] for w in order]
    asu=[agg[w]["asu"] for w in order]; disp=[agg[w]["disp"] for w in order]; sr=[agg[w]["sr"] for w in order]
    nc=[agg[w]["nc"] for w in order]; apos=[agg[w]["apos"] for w in order]; exp=[agg[w]["exp"] for w in order]
    base0=sum(act[lob][r][-1]["asu"] for r in REGIONS if act[lob][r])
    sumD=sum(disp); sumS=sum(sr); sumA=sum(asu)
    ui[lob]={"lob":lob,"category":CATEGORY[lob],"weeks":wk,
        "tail":{"weeks":[w.split("-W")[1] for w in tailw],"asu":[tail[w]["asu"] for w in tailw],
                "disp":[tail[w]["disp"] for w in tailw],"sr":[tail[w]["sr"] for w in tailw]},
        "asu_level":asu,
        "dispatches":{"nd":disp,"asu":asu,"target":round((sumD/sumA)*SMOD_BEND,5) if sumA else 0,"target_n":round(sumD*SMOD_BEND)},
        "sr":{"nd":sr,"asu":asu,"target":round((sumS/sumA)*SMOD_BEND,5) if sumA else 0,"target_n":round(sumS*SMOD_BEND)},
        "contracts":{"base0":base0,"nc":nc,"apos":apos,"exp":exp}}

hdr=["FY","Fiscal Quarter","Fiscal Week","LOB","Category","Region","Business Unit","Warranty Type",
     "Core/Upsell","Service Type","GCFA Type","W/O Type","Series",
     "ASU","APOS","Renewals","Expiring","New Contract","APOS Renewal","Dispatches","SRs"]
with open(os.path.join(OUT,"btc_raw_dataset.csv"),"w",newline="",encoding="utf-8") as f:
    w=csv.writer(f); w.writerow(hdr); w.writerows(raw_rows)
payload={"generated_from":"forecast_fy26.xlsx","forecast_window":"FY27 (52 wks)","lobs":LOBS,"data":ui}
with open(os.path.join(OUT,"btc_data.json"),"w",encoding="utf-8") as f:
    json.dump(payload,f,indent=1)
# also emit a JS wrapper so the UI loads via <script src> (works from file:// — fetch does not)
with open(os.path.join(OUT,"btc_data.js"),"w",encoding="utf-8") as f:
    f.write("window.BTC_DATA = "+json.dumps(payload)+";\n")
print("raw rows:",len(raw_rows),"| LOBs:",len(ui))
