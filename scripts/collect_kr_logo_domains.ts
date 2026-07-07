// KR 종목 로고 도메인 수집 — DART 기업개황(company.json)의 hm_url(홈페이지) → 도메인.
// JP/CN/VN/GB(야후 프로필)의 KR 짝. 한국 공식 소스라 커버리지 좋음.
// 실행: cd ~/stock-terminal && npx tsx scripts/collect_kr_logo_domains.ts
// 필요 env(.env.local): DART_API_KEY · NEXT_PUBLIC_SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";

const DART_KEY = (process.env.DART_API_KEY || "").trim();
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function domainOf(url: string): string | null {
  if (!url) return null;
  let u = String(url).trim().toLowerCase();
  if (u.length < 4 || u === "-") return null;
  u = u.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const host = u.split(/[/?#\s]/)[0];
  if (!host || !host.includes(".") || host.length < 4) return null;
  return host;
}

async function main() {
  if (!DART_KEY || !SB_URL || !SB_KEY) throw new Error("env 누락: DART_API_KEY / SUPABASE URL·SERVICE_ROLE_KEY");
  const sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });

  // 상장 6자리 stock_code ↔ corp_code 전량
  const rows: { stock_code: string; corp_code: string }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from("dart_corp_codes")
      .select("stock_code, corp_code")
      .not("stock_code", "is", null)
      .neq("stock_code", "")
      .range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    for (const r of data as { stock_code: string; corp_code: string }[]) {
      if (/^\d{6}$/.test(r.stock_code) && r.corp_code) rows.push(r);
    }
    if (data.length < 1000) break;
  }
  console.log("상장 corp:", rows.length);

  const out: Record<string, string> = {};
  let done = 0;
  for (const { stock_code, corp_code } of rows) {
    try {
      const res = await fetch(`https://opendart.fss.or.kr/api/company.json?crtfc_key=${DART_KEY}&corp_code=${corp_code}`);
      const j = (await res.json()) as { status?: string; hm_url?: string };
      if (j.status === "000") {
        const d = domainOf(j.hm_url || "");
        if (d) out[stock_code] = d;
      }
    } catch {
      /* skip */
    }
    if (++done % 200 === 0) console.log(`${done}/${rows.length} · 수집 ${Object.keys(out).length}`);
    await new Promise((r) => setTimeout(r, 60)); // DART rate limit 여유
  }

  writeFileSync("data/kr_logo_domains.json", JSON.stringify(out));
  console.log(`DONE: ${Object.keys(out).length}개 도메인 → data/kr_logo_domains.json`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
