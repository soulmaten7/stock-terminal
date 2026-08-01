/**
 * STEP 847 summarize — probe_847_raw.json → 커버리지·분포·연도간 변동·재구성·판정 (원전 정의).
 * 네트워크 없음. 출력: docs/probe_847_output.json + stdout.
 */
import fs from "node:fs";
const raw = JSON.parse(fs.readFileSync("docs/probe_847_raw.json", "utf8"));
const YS = ["2020", "2021", "2022", "2023", "2024"];
const per = Object.entries(raw.perCik).filter(([, v]) => !v._err).map(([cik, v]) => ({ cik, ...v }));

const q = (a, p) => { const s = a.filter((x) => Number.isFinite(x)).sort((x, y) => x - y); return s.length ? +s[Math.floor((s.length - 1) * p)].toFixed(4) : null; };
const mean = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
const sd = (a) => { if (a.length < 2) return null; const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
const has5 = (c) => c && YS.every((y) => c[y] != null);
const get = (c, y) => (c && c[y] != null ? c[y] : null);

const out = { measuredAt: new Date().toISOString(), issuersFetched: per.length, errors: Object.values(raw.perCik).filter((v) => v._err).length };

// ── §1 driver 3: 무차입 현금세율 ─────────────────────────────────────────────
{
  const need = ["cashTax", "taxExp", "pretax", "interest", "oi"];
  const cov = {}; for (const k of need) cov[k] = per.filter((p) => has5(p.comp[k])).length;
  const full = per.filter((p) => need.every((k) => has5(p.comp[k])));
  // 개별 결측 원인(전 5년 확보 아닌 것 중 어느 게 병목)
  const bindng = {}; for (const k of need) bindng[k] = per.filter((p) => !has5(p.comp[k])).length;
  const issuerAvg = [], withinSd = [], marginalWithinSd = [];
  let anomN = 0, cellN = 0;
  for (const p of full) {
    const ctr = [];
    for (const y of YS) {
      const tax = get(p.comp.taxExp, y), pre = get(p.comp.pretax, y), cash = get(p.comp.cashTax, y), intr = Math.abs(get(p.comp.interest, y)), oi = get(p.comp.oi, y);
      if (pre === 0 || oi === 0) { continue; }
      const bookRate = tax / pre;
      const unlev = cash + intr * bookRate;
      const rate = unlev / oi;
      ctr.push(rate); cellN++; if (rate < 0 || rate > 1) anomN++;
    }
    if (ctr.length >= 3) { issuerAvg.push(mean(ctr)); const s = sd(ctr); if (s != null) withinSd.push(s); marginalWithinSd.push(0); }
  }
  out.driver3 = {
    coverage5yr: cov, allFivePresent: full.length, binding: bindng,
    cashTaxRate: { issuers: issuerAvg.length, median: q(issuerAvg, 0.5), p10: q(issuerAvg, 0.1), p90: q(issuerAvg, 0.9) },
    withinIssuerVolatility: { cashRate_medianSd: q(withinSd, 0.5), cashRate_p90Sd: q(withinSd, 0.9), marginalRate_sd: 0 },
    anomalyRate: cellN ? +(anomN / cellN).toFixed(3) : null,
    marginalConstant: 0.2563,
    note: "현금세율=(현금세금+이자×장부세율)/영업이익. 한계세율은 상수(변동 0). anomaly=현금세율<0 또는>1",
  };
}

// ── §2 driver 4: 순운전자본 (원전 vs 844) ────────────────────────────────────
{
  const req = ["rev", "ar", "inv", "oca", "ap", "accr"]; // dta·ocl 선택
  const cov = {}; for (const k of [...req, "dta", "ocl", "assetsCur", "liabCur", "cash"]) cov[k] = per.filter((p) => has5(p.comp[k])).length;
  const full = per.filter((p) => req.every((k) => has5(p.comp[k])));
  const nwcP = (p, y) => { const rev = get(p.comp.rev, y); const opCash = 0.02 * rev; const a = opCash + get(p.comp.ar, y) + get(p.comp.inv, y) + get(p.comp.oca, y) + (get(p.comp.dta, y) || 0); const l = get(p.comp.ap, y) + get(p.comp.accr, y) + (get(p.comp.ocl, y) || 0); return a - l; };
  const nwc844 = (p, y) => { const ac = get(p.comp.assetsCur, y), ca = get(p.comp.cash, y), lc = get(p.comp.liabCur, y); if (ac == null || ca == null || lc == null) return null; return ac - ca - lc; };
  const reconDiffRel = [], incP = [], inc844 = [], incP_all = [];
  for (const p of full) {
    const volP = [];
    for (let i = 1; i < YS.length; i++) {
      const y = YS[i], yp = YS[i - 1];
      const rev = get(p.comp.rev, y), revp = get(p.comp.rev, yp); if (rev == null || revp == null || rev === revp) continue;
      const dRev = rev - revp;
      const r = (nwcP(p, y) - nwcP(p, yp)) / dRev; if (Number.isFinite(r)) { volP.push(r); incP_all.push(r); }
      const n1 = nwc844(p, y), n0 = nwc844(p, yp); if (n1 != null && n0 != null) { const r2 = (n1 - n0) / dRev; if (Number.isFinite(r2)) inc844.push(r2); }
      // 재구성 대조: 같은 해 수준값
      const a = nwcP(p, y), b = nwc844(p, y); if (b != null && rev) reconDiffRel.push((a - b) / rev);
    }
    if (volP.length >= 2) incP.push(sd(volP));
  }
  out.driver4 = {
    coverage5yr: cov, allRequiredPresent: full.length,
    reconVs844_diffOverRev: { median: q(reconDiffRel, 0.5), p10: q(reconDiffRel, 0.1), p90: q(reconDiffRel, 0.9), n: reconDiffRel.length },
    incrementalRatePrimary: { median: q(incP_all, 0.5), p10: q(incP_all, 0.1), p90: q(incP_all, 0.9) },
    withinIssuerVolatility_primaryMarginal: { medianSd: q(incP, 0.5), p90Sd: q(incP, 0.9), n: incP.length },
    note: "원전 정의(2%현금+AR+Inv+기타+DTA − AP+미지급+기타) — 단기차입금 미차감. 844=AssetsCurrent−현금−LiabilitiesCurrent. 증분율=Δnwc/Δrev(한계형).",
  };
}

// ── §3 driver 5: 증분 고정자본 ──────────────────────────────────────────────
{
  const req = ["rev", "capex", "dna"]; const cov = {}; for (const k of [...req, "acq", "capsw", "othinv"]) cov[k] = per.filter((p) => has5(p.comp[k])).length;
  const full = per.filter((p) => req.every((k) => has5(p.comp[k])));
  const incAll = [], incVol = [], acqImpact = [];
  for (const p of full) {
    const vol = [];
    for (let i = 1; i < YS.length; i++) { const y = YS[i], yp = YS[i - 1]; const rev = get(p.comp.rev, y), revp = get(p.comp.rev, yp); if (rev == null || revp == null || rev === revp) continue; const dRev = rev - revp;
      const capex = Math.abs(get(p.comp.capex, y)), dna = Math.abs(get(p.comp.dna, y)), acq = Math.abs(get(p.comp.acq, y) || 0), capsw = Math.abs(get(p.comp.capsw, y) || 0), othinv = Math.abs(get(p.comp.othinv, y) || 0);
      const netWith = (capex + acq + capsw + othinv) - dna; const netNo = capex - dna;
      const r = netWith / dRev, rNo = netNo / dRev; if (Number.isFinite(r)) { vol.push(r); incAll.push(r); if (Number.isFinite(rNo)) acqImpact.push(Math.abs(r - rNo)); }
    }
    if (vol.length >= 2) incVol.push(sd(vol));
  }
  out.driver5 = {
    coverage5yr: cov, allRequiredPresent: full.length,
    incrementalRate: { median: q(incAll, 0.5), p10: q(incAll, 0.1), p90: q(incAll, 0.9) },
    withinIssuerVolatility: { medianSd: q(incVol, 0.5), p90Sd: q(incVol, 0.9), n: incVol.length },
    acquisitionImpact_absRateDelta: { median: q(acqImpact, 0.5), p90: q(acqImpact, 0.9) },
    note: "순고정=(capex+인수+자본화SW+기타투자)−D&A. 증분율=순고정/Δrev. acqImpact=인수 포함/제외 증분율 차.",
  };
}

fs.writeFileSync("docs/probe_847_output.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
