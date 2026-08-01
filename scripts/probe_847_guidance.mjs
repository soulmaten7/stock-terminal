/**
 * STEP 847 §4-A — 회사 가이던스 존재율(무료·SEC 8-K). 표본 60(604에서 결정론 stride).
 * submissions.recent.items로 Item 2.02(실적) 8-K를 찾고, 최근 1건의 본문에서 매출 가이던스 언어를 스캔.
 * 실행: node scripts/probe_847_guidance.mjs
 */
import fs from "node:fs";
const UA = process.env.SEC_USER_AGENT || "Trillion Research admin@onetrillion.app";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ciks = JSON.parse(fs.readFileSync("/tmp/847_ciks.json", "utf8"));
// 결정론 표본 60 (stride)
const N = 60, stride = Math.floor(ciks.length / N);
const sample = []; for (let i = 0; i < ciks.length && sample.length < N; i += stride) sample.push(ciks[i]);

const GUID = /(guidance|outlook|we (?:expect|anticipate|project|forecast)|full[- ]year|fiscal (?:20\d\d|year) .{0,30}(?:revenue|sales|growth)|reaffirm|raising our)/i;
const REVGUID = /(revenue|net sales|sales|comparable sales|same[- ]store).{0,60}(guidance|outlook|expect|to be (?:between|approximately|in the range)|range of|202\d)/i;

let has8k = 0, hasEarnings8k = 0, hasGuidance = 0, hasRevGuidance = 0, fetched = 0;
const samples = [];
for (const cik of sample) {
  const p = String(cik).padStart(10, "0");
  try {
    const r = await fetch(`https://data.sec.gov/submissions/CIK${p}.json`, { headers: { "User-Agent": UA } });
    await sleep(150);
    if (!r.ok) continue;
    const j = await r.json();
    const rec = j.filings?.recent || {};
    const forms = rec.form || [], items = rec.items || [], accn = rec.accessionNumber || [], docs = rec.primaryDocument || [], dates = rec.filingDate || [];
    let any8k = false, earn = null;
    for (let i = 0; i < forms.length; i++) { if (forms[i] !== "8-K") continue; any8k = true;
      if (/2\.02/.test(items[i] || "") && !earn) earn = { accn: accn[i], doc: docs[i], date: dates[i] }; }
    if (any8k) has8k++;
    if (earn) { hasEarnings8k++;
      const an = earn.accn.replace(/-/g, "");
      // 🔑 가이던스는 8-K 본문(껍데기)이 아니라 Exhibit 99.1(보도자료)에 있다 → index.json에서 99.1 문서를 찾는다.
      let exDoc = earn.doc;
      try { const ix = await fetch(`https://www.sec.gov/Archives/edgar/data/${cik}/${an}/index.json`, { headers: { "User-Agent": UA } }); await sleep(150);
        if (ix.ok) { const ixj = await ix.json(); const items = ixj.directory?.item || [];
          const ex = items.find((f) => /ex.?99.?1|ex991|exhibit99/i.test(f.name)) || items.find((f) => /ex.?99/i.test(f.name));
          if (ex) exDoc = ex.name; } } catch {}
      const url = `https://www.sec.gov/Archives/edgar/data/${cik}/${an}/${exDoc}`;
      try { const dr = await fetch(url, { headers: { "User-Agent": UA } }); await sleep(150);
        if (dr.ok) { fetched++; const txt = (await dr.text()).replace(/<[^>]+>/g, " ").slice(0, 300000);
          const g = GUID.test(txt), rg = REVGUID.test(txt); if (g) hasGuidance++; if (rg) hasRevGuidance++;
          if (samples.length < 12) samples.push(`${j.tickers?.[0] || cik} ${earn.date} [${exDoc}]: guid=${g} revGuid=${rg}`); } }
      catch {}
    }
  } catch {}
}
const out = {
  sampleSize: sample.length, with8K: has8k, withEarnings8K: hasEarnings8k, earningsDocsFetched: fetched,
  withGuidanceLanguage: hasGuidance, withRevenueGuidanceLanguage: hasRevGuidance,
  rateGuidanceOfFetched: fetched ? +(hasGuidance / fetched).toFixed(3) : null,
  rateRevGuidanceOfFetched: fetched ? +(hasRevGuidance / fetched).toFixed(3) : null,
  samples,
  note: "존재율은 '가이던스 언어 정규식' 근사(정확한 금액·기간 추출엔 LLM 필요). 8-K Item 2.02 최근 1건 본문 스캔.",
};
fs.writeFileSync("docs/probe_847_guidance.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
