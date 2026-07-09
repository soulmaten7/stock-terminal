// 🅿️ PARKED — VN HNX(+HOSE) perf via VCI. 거주지 IP(VPS/로컬 맥)에서만 동작.
// ⚠️ 클라우드 IP(Vercel·GitHub Actions)는 VCI가 지속요청 시 소프트차단(`[]`). 활성화 방법: docs/PARKED_HNX_VCI_ACTIVATION.md
// 실행: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/vn_hnx_vci_cron.mjs
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SB_URL || !SB_KEY) { console.error("Supabase env 없음"); process.exit(1); }
const sb = createClient(SB_URL, SB_KEY);

const VCI = "https://trading.vietcap.com.vn/api/chart/OHLCChart/gap-chart";
const H = { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0", Referer: "https://trading.vietcap.com.vn/" };

// data/vn_symbols.json에 HNX가 추가돼 있어야 함(활성화 3단계). 없으면 HOSE만 계산됨.
const syms = JSON.parse(fs.readFileSync("data/vn_symbols.json", "utf8")).map((s) => s.sym); // 'XXX.VN'
const ret = (c, n) => (c.length > n && c[c.length - 1 - n] > 0) ? (c[c.length - 1] / c[c.length - 1 - n] - 1) * 100 : null;
const chunk = (a, n) => { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; };

async function fetchBatch(tickers) {
  const to = Math.floor(Date.now() / 1000);
  const r = await fetch(VCI, { method: "POST", headers: H, body: JSON.stringify({ timeFrame: "ONE_DAY", symbols: tickers, to, countBack: 300 }) });
  if (!r.ok) return [];
  const j = await r.json();
  return Array.isArray(j) ? j : (j?.data ?? []);
}

const rows = [];
const at = new Date().toISOString();
for (const grp of chunk(syms, 40)) {
  const tickers = grp.map((s) => s.replace(/\.VN$/i, ""));
  let data = [];
  try { data = await fetchBatch(tickers); } catch { data = []; }
  const byT = new Map(data.map((d) => [d.symbol, d]));
  for (const s of grp) {
    const d = byT.get(s.replace(/\.VN$/i, ""));
    const c = d && Array.isArray(d.c) ? d.c.filter((x) => x > 0) : [];
    if (c.length < 6) continue;
    const price = c[c.length - 1];                       // 풀 VND
    const vol = Array.isArray(d.v) && d.v.length ? Number(d.v[d.v.length - 1]) : 0;
    rows.push({ symbol: s, price, amount: price * vol, r1d: ret(c, 1), r1w: ret(c, 5), r1m: ret(c, 21), r3m: ret(c, 63), r6m: ret(c, 126), r1y: ret(c, 252), updated_at: at });
  }
  await new Promise((z) => setTimeout(z, 300));
}

for (let i = 0; i < rows.length; i += 500) {
  const { error } = await sb.from("vn_stock_perf").upsert(rows.slice(i, i + 500), { onConflict: "symbol" });
  if (error) { console.error(error); process.exit(1); }
}
console.log("computed", rows.length, "/", syms.length);
