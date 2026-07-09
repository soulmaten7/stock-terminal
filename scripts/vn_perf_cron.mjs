// VN perf 계산: VCI gap-chart(배치) → r1d..r1y·price·amount → vn_stock_perf upsert.
// GitHub Actions에서 실행(Vercel은 VCI IP차단). node scripts/vn_perf_cron.mjs
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SB_URL || !SB_KEY) { console.error("Supabase env 없음"); process.exit(1); }
const sb = createClient(SB_URL, SB_KEY);

const VCI = "https://trading.vietcap.com.vn/api/chart/OHLCChart/gap-chart";
const H = { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0", Referer: "https://trading.vietcap.com.vn/" };

const syms = JSON.parse(fs.readFileSync("data/vn_symbols.json", "utf8")).map((s) => s.sym); // 'XXX.VN'
const ret = (c, n) => (c.length > n && c[c.length-1-n] > 0) ? (c[c.length-1]/c[c.length-1-n]-1)*100 : null;

function chunk(a, n) { const o=[]; for (let i=0;i<a.length;i+=n) o.push(a.slice(i,i+n)); return o; }

async function fetchBatch(tickers) { // tickers = ['SHS', ...] (.VN 제거됨)
  const to = Math.floor(Date.now()/1000);
  const r = await fetch(VCI, { method:"POST", headers:H,
    body: JSON.stringify({ timeFrame:"ONE_DAY", symbols: tickers, to, countBack: 300 }) });
  if (!r.ok) return [];
  const j = await r.json();
  return Array.isArray(j) ? j : (j?.data ?? []);
}

const rows = [];
const at = new Date().toISOString();
for (const grp of chunk(syms, 40)) {                     // 배치 40개씩
  const tickers = grp.map((s) => s.replace(/\.VN$/i, ""));
  let data = [];
  try { data = await fetchBatch(tickers); } catch { data = []; }
  const byT = new Map(data.map((d) => [d.symbol, d]));
  for (const s of grp) {
    const d = byT.get(s.replace(/\.VN$/i, ""));
    const c = d && Array.isArray(d.c) ? d.c.filter((x) => x>0) : [];
    if (c.length < 6) continue;
    const price = c[c.length-1];                         // 풀 VND (×1000 X)
    const vol = Array.isArray(d.v) && d.v.length ? Number(d.v[d.v.length-1]) : 0;
    rows.push({ symbol: s, price, amount: price*vol,
      r1d: ret(c,1), r1w: ret(c,5), r1m: ret(c,21), r3m: ret(c,63), r6m: ret(c,126), r1y: ret(c,252),
      updated_at: at });
  }
  await new Promise((z) => setTimeout(z, 300));           // VCI 배려
}

for (let i=0;i<rows.length;i+=500) {
  const { error } = await sb.from("vn_stock_perf").upsert(rows.slice(i,i+500), { onConflict:"symbol" });
  if (error) { console.error(error); process.exit(1); }
}
console.log("computed", rows.length, "/", syms.length);
