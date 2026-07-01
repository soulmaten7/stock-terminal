import YahooFinance from "yahoo-finance2";
import fs from "fs";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const TARGETS = [
  { syms: "data/cn_symbols.json", out: "data/cn_logo_domains.json" },
  { syms: "data/jp_symbols.json", out: "data/jp_logo_domains.json" },
];

function domainOf(website) {
  try {
    const u = new URL(String(website).startsWith("http") ? website : "https://" + website);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch { return null; }
}

async function mapLimit(arr, limit, fn) {
  let idx = 0;
  async function worker() { while (idx < arr.length) { const cur = idx++; await fn(arr[cur]); } }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, () => worker()));
}

for (const t of TARGETS) {
  const syms = JSON.parse(fs.readFileSync(t.syms, "utf8")).map((s) => s.sym);
  const map = fs.existsSync(t.out) ? JSON.parse(fs.readFileSync(t.out, "utf8")) : {};
  const todo = syms.filter((s) => !(s in map));
  console.log(`${t.out}: ${syms.length} syms · ${Object.keys(map).length} done · ${todo.length} todo`);
  let n = 0;
  await mapLimit(todo, 10, async (sym) => {
    try {
      const r = await yf.quoteSummary(sym, { modules: ["assetProfile"] });
      const w = r && r.assetProfile && r.assetProfile.website;
      map[sym] = (w ? domainOf(w) : null) || ""; // 성공: 도메인 or "" (확정, 재시도 방지)
    } catch {
      /* 실패(429/타임아웃)는 마킹 안 함 → 다음 실행 때 재시도 */
    }
    if (++n % 200 === 0) fs.writeFileSync(t.out, JSON.stringify(map));
  });
  fs.writeFileSync(t.out, JSON.stringify(map));
  const withDomain = Object.values(map).filter((v) => v).length;
  console.log(`${t.out}: 완료 — 도메인 ${withDomain} / 시도 ${Object.keys(map).length}`);
}
