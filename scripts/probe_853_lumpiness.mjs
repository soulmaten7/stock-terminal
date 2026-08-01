/**
 * STEP 853 §1-2 — M&A 럼피니스: 5년누적 marginal 자본투자에서 인수가 차지하는 비중 분포.
 * 인수 비중 크면 marginal이 일회성 M&A에 오염 → default 결정 재료.
 * 출력: docs/probe_853_lumpiness.json · 실행: node scripts/probe_853_lumpiness.mjs
 */
import fs from "node:fs";
const UA = process.env.SEC_USER_AGENT || "Trillion Research admin@onetrillion.app";
const CACHE = "docs/probe_853_lump_cache.json";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const wall = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("wall")), ms))]);
const INV = [2021, 2022, 2023, 2024];
const calY = (e) => { const y = +String(e).slice(0, 4), m = +String(e).slice(5, 7); return m <= 5 ? y - 1 : y; };
const isAnnual = (f) => /^10-K/.test(String(f));
function amap(g, tags) { const o = {}; for (const t of tags) { const a = g[t]?.units?.USD; if (!Array.isArray(a)) continue; for (const e of a) { if (!isAnnual(e.form) || e.val == null || !e.start || !e.end) continue; const d = (Date.parse(e.end) - Date.parse(e.start)) / 864e5; if (d < 300 || d > 400) continue; const y = calY(e.end); if (o[y] == null) o[y] = e.val; } } return o; }
const CAPEX = ["PaymentsToAcquirePropertyPlantAndEquipment", "PaymentsToAcquireProductiveAssets", "PaymentsForCapitalImprovements"];
const ACQ = ["PaymentsToAcquireBusinessesNetOfCashAcquired"];
const CAPSW = ["PaymentsToDevelopSoftware", "CapitalizedComputerSoftwareAdditions"];
const OTHINV = ["PaymentsForProceedsFromOtherInvestingActivities"];

const ciks = JSON.parse(fs.readFileSync("/tmp/847_ciks.json", "utf8"));
let cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, "utf8")) : {};
const todo = ciks.filter((c) => cache[c] === undefined);
let n = 0;
for (const cik of todo) {
  try {
    const r = await wall(fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${String(cik).padStart(10, "0")}.json`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(25000) }), 30000);
    await sleep(120);
    if (!r.ok) { cache[cik] = null; }
    else {
      const g = (await wall(r.json(), 30000)).facts?.["us-gaap"] || {};
      const capex = amap(g, CAPEX), acq = amap(g, ACQ), capsw = amap(g, CAPSW), othinv = amap(g, OTHINV);
      if (INV.every((y) => capex[y] != null)) {
        let gross = 0, ac = 0;
        for (const y of INV) { gross += Math.abs(capex[y]) + Math.abs(acq[y] ?? 0) + Math.abs(capsw[y] ?? 0) + Math.abs(othinv[y] ?? 0); ac += Math.abs(acq[y] ?? 0); }
        cache[cik] = gross > 0 ? +(ac / gross).toFixed(4) : null;
      } else cache[cik] = null;
    }
  } catch { cache[cik] = null; }
  n++; if (n % 50 === 0) { fs.writeFileSync(CACHE, JSON.stringify(cache)); process.stderr.write(`\r${n}/${todo.length}`); }
}
fs.writeFileSync(CACHE, JSON.stringify(cache));
const shares = Object.values(cache).filter((v) => v != null).sort((a, b) => a - b);
const q = (p) => shares.length ? +shares[Math.floor((shares.length - 1) * p)].toFixed(3) : null;
const out = {
  companiesWithMarginal: shares.length,
  acqShareOfGrossInvestment: { median: q(0.5), p25: q(0.25), p75: q(0.75), p90: q(0.9) },
  pctWithAcqOver30: +(shares.filter((s) => s > 0.3).length / shares.length).toFixed(3),
  pctWithAcqOver50: +(shares.filter((s) => s > 0.5).length / shares.length).toFixed(3),
  pctZeroAcq: +(shares.filter((s) => s === 0).length / shares.length).toFixed(3),
};
fs.writeFileSync("docs/probe_853_lumpiness.json", JSON.stringify(out, null, 2));
console.log("\n" + JSON.stringify(out, null, 2));
