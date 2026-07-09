// SEC company_tickers.json → us_symbols.json placeholder 실명 보강. node scripts/enrich_us_names.mjs
import fs from "node:fs";

const UA = "Trillion/1.0 (contact@onetrillion.app)"; // ⚠️ SEC는 UA 없으면 차단
const res = await fetch("https://www.sec.gov/files/company_tickers.json", { headers: { "User-Agent": UA } });
if (!res.ok) { console.error("SEC fetch failed", res.status); process.exit(1); }
const sec = await res.json(); // { "0": {cik_str, ticker, title}, ... }

// 티커→title 맵(대문자). SEC 티커는 클래스주에 '-' 사용(예: BRK-B). 변형도 등록.
const map = new Map();
for (const k in sec) {
  const t = String(sec[k].ticker || "").toUpperCase().trim();
  const title = String(sec[k].title || "").trim();
  if (!t || !title) continue;
  map.set(t, title);
  map.set(t.replace(/-/g, "."), title);   // BRK-B ↔ BRK.B
  map.set(t.replace(/[-.]/g, ""), title);  // BRKB
}

// 타이틀케이스(SEC는 전부 대문자) — 간단 변환, 약어(&·JR·II 등)는 대충 유지.
function titleCase(s) {
  return s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\b(Inc|Corp|Ltd|Llc|Plc|Co|Sa|Nv|Ag)\b/g, (m) => m);
}

const path = "data/us_symbols.json";
const arr = JSON.parse(fs.readFileSync(path, "utf8"));
let fixed = 0, still = 0;
for (const s of arr) {
  if (s.type !== "stock") continue;
  const code = String(s.sym).split(".")[0].toUpperCase();
  const isPlaceholder = !s.name || s.name.trim().toUpperCase() === code || s.name.trim().toUpperCase() === String(s.sym).toUpperCase();
  if (!isPlaceholder) continue;
  const hit = map.get(code) || map.get(code.replace(/-/g, ".")) || map.get(code.replace(/[-.]/g, ""));
  if (hit) { s.name = titleCase(hit); fixed++; } else { still++; }
}
fs.writeFileSync(path, JSON.stringify(arr, null, 0));
console.log(`보강 ${fixed}, 여전히 placeholder ${still}`);
