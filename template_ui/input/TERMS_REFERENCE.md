# BTC Dataset — Terms Reference

> Anonymisation map + metric definitions for `btc_raw_dataset.csv` / `btc_data.json`.
> Source: `forecast_copilot_v2/input/forecast_fy26.xlsx` (already anonymised) +
> `name_mapping_reference.xlsx`. This file is the decode key for the 8-LOB BTC dataset.
> All Dell-specific names are replaced by generic labels; do **not** reintroduce originals in the UI.

---

## 1. LOBs in this dataset (8 of 19)

Balanced spread across every product category, including high-volume, AI, and dual-BU lines.

| Generic (used everywhere) | Category | Original (Dell) | FY27 ASU entering | Notes |
|---|---|---|---|---|
| Server Line A | Server | Poweredge | ~5.53M | Highest volume; core server line |
| Server Line B (AI) | Server | Poweredge AI | ~24K | Low volume, high growth (+22% YoY), high touch |
| Storage Array C | Storage | Powerscale | ~208K | Scale-out storage |
| Storage Array D | Storage | Powerflex | ~61K | Software-defined storage |
| Storage Array H | Storage | Unity | ~87K | Midrange storage |
| Data Protection B | Data Protection | Datadomain | ~89K | Backup / dedup |
| Hyperconverged A | Hyperconverged | Vxrail | ~154K | HCI cluster (dual-BU / 4-tab candidate) |
| Networking A | Networking | Powerswitch | ~364K | Switching; lower dispatch rate |

The other 11 anonymised LOBs (Server Line C, Storage Arrays A/B/E/F/G/I/J/K, Data Protection A,
Networking B) exist in the master and can be added later — see `name_mapping_reference.xlsx`.

---

## 2. Dimension term mappings

| Field | Original (Dell) | Generic (used here) |
|---|---|---|
| Business Unit | ISG | **Unit A** |
| Business Unit | CSG | **Unit B** |
| Warranty Type | Basic | Basic |
| Warranty Type | ProSupport | **Premium** |
| Warranty Type | ProSupport Flex | **Premium Flex** |
| Warranty Type | ProSupport Plus | **Premium Plus** |
| Region | APJ / Americas / EMEA | (unchanged) |
| Service Type | Parts Only / Parts + Labour / Labour Only | (unchanged) |
| Core/Upsell | Core / Upsell | (unchanged) |
| W/O Type | Break fix / Part/s dispatch | (unchanged) |
| GCFA Type | GCFA / non-GCFA / Unknown | (unchanged) |

> The **4-tab** adjustment case = a dual-BU LOB (Unit A × Unit B) crossed with Service Type
> (Parts Only × Parts + Labour). Every LOB here carries both BUs, so the intersection is representable.

---

## 3. Metric / column definitions

| Column | Meaning | Source |
|---|---|---|
| ASU | Active Service Units — installed hardware assets (level, per week) | **Real** (master) |
| APOS | APOS contracts | **Real** (master) |
| Renewals | Renewed units | **Real** (master) |
| Expiring | Contracts expiring that week (chain outflow) | **Derived** — balancing term |
| New Contract | New-contract inflow that week | **Derived** — modelled inflow |
| APOS Renewal | Renewed units re-entering ASU (the editable APOS field in the ASU sheet) | **Derived** |
| Dispatches | Weekly field dispatches (No IQR) | **Derived** = ASU × MDR × noise |
| SRs | Weekly pre-UCR service requests (No IQR) | **Derived** = ASU × ICR × noise |
| Series | `Actual` (FY22–26) or `Forecast` (FY27) | — |

**Key derived relationships**
- **ASU chain** (holds exactly within each fiscal year): `ASU[w] = ASU[w-1] − Expiring[w] + New Contract[w] + APOS Renewal[w]`.
  Expiring is solved as the balancing term so the chain closes against the real ASU trajectory.
  The FY26→FY27 boundary is an intentional anchor reset (not a continuous flow week).
- **MDR** (dispatch rate) = Dispatches ÷ ASU. **ICR** (SR rate) = SRs ÷ ASU. Both weekly.
- **No IQR** = the original statistical forecast series (before any IQR outlier treatment) — the BTC starting point.
- **Adj** = the BTC-adjusted series the analyst produces (starts equal to No IQR; the UI sliders bend it).

---

## 4. Synthesis assumptions (Dispatches / SR / chain)

Calibrated to the real `Adjustment 1Templates.xlsx` ranges. Deterministic (fixed per-LOB seeds).

| Parameter | Value | Basis |
|---|---|---|
| Base MDR (dispatches/ASU/wk) | 0.00072 | Real POWEREDGE ≈ 4,500 disp / 6.55M ASU |
| Base ICR (SRs/ASU/wk) | 0.00130 | Real ≈ 9,000 SR / 6.6M ASU |
| New-contract inflow rate | 0.0040 × ASU | modelled |
| Renewal inflow rate | 0.0009 × ASU | modelled |
| Noise band | ±15–30% seeded | realistic week-to-week jitter |
| SMOD/ICR target | 92% of DS forecast rate | ~8% bend-down to a reachable target |

**Per-LOB tuning** (MDR mult, ICR mult, FY27 YoY):
Server Line A (1.00, 1.00, 0.97) · Server Line B AI (1.25, 1.30, 1.22) · Storage Array C (1.10, 0.95, 0.99) ·
Storage Array D (1.15, 0.98, 0.96) · Storage Array H (1.08, 0.96, 0.94) · Data Protection B (0.90, 1.05, 1.02) ·
Hyperconverged A (1.05, 1.00, 1.01) · Networking A (0.80, 0.85, 0.98).

---

## 5. Files

| File | Purpose |
|---|---|
| `btc_raw_dataset.csv` | Tidy long raw source — 7,488 rows (8 LOB × 3 region × 312 wks), all dims + metrics. |
| `btc_data.json` | Compact per-LOB weekly source for the UI: FY27 forecast window (52 wks) + 8-wk FY26 tail, dispatch/SR/ASU-chain arrays + targets. |
| `TERMS_REFERENCE.md` / `.csv` | This decode key. |

Regenerate via `input/gen_btc_dataset.py` (reads the master; deterministic — stable md5 seed).

**UI wiring:** `btc_adjustment_simulator.html` fetches `input/btc_data.json` on load, populates the
LOB dropdown (8), and drives all 3 sheets from the selected LOB. Serve over http (`python -m http.server`
in `template_ui/`) — browsers block `fetch` on `file://`. The `output/` folder (future) will hold the
published series after adjustments are finalised.
