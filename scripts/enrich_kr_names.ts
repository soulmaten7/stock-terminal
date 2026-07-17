// KR 종목 영문명 채우기 — 야후 longName/shortName → kr_stock_snapshot.name_en.
// 실행: npx tsx scripts/enrich_kr_names.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" }); // admin 클라이언트가 SUPABASE_SERVICE_ROLE_KEY 읽기 전에 로드
import YahooFinance from "yahoo-finance2";
import { createAdminClient } from "../lib/supabase/admin";
const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

async function mapLimit<T>(arr: T[], limit: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, async () => {
    while (i < arr.length) { const cur = i++; await fn(arr[cur]); }
  }));
}

(async () => {
  const sb = createAdminClient();
  // PostgREST 기본 반환 상한(1000) 회피 — range로 페이지네이션해 전 종목(2000+)을 다 가져온다.
  const list: { symbol: string; market: string }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from("kr_stock_snapshot").select("symbol, market").range(from, from + 999);
    if (!data || data.length === 0) break;
    list.push(...(data as { symbol: string; market: string }[]));
    if (data.length < 1000) break;
  }
  const ysym = (r: { symbol: string; market: string }) => r.symbol + (r.market === "kosdaq" ? ".KQ" : ".KS");
  const codeByY = new Map(list.map((r) => [ysym(r), r.symbol]));
  const yss = [...codeByY.keys()];
  const nameBySym = new Map<string, string>();
  // 배치 quote 100개씩 → longName||shortName
  for (let i = 0; i < yss.length; i += 100) {
    const grp = yss.slice(i, i + 100);
    try {
      const qs = (await yf.quote(grp)) as Array<{ symbol?: string; longName?: string; shortName?: string }>;
      for (const q of Array.isArray(qs) ? qs : []) {
        const code = codeByY.get(q.symbol ?? "");
        const en = (q.longName || q.shortName || "").trim();
        if (code && en) nameBySym.set(code, en);
      }
    } catch { /* 청크 실패 스킵 */ }
    console.log(`  ...quote ${Math.min(i + 100, yss.length)}/${yss.length}`);
  }
  // name_en만 UPDATE(동시성 8·다른 컬럼 보존)
  const entries = [...nameBySym.entries()];
  let saved = 0;
  await mapLimit(entries, 8, async ([symbol, name_en]) => {
    const { error } = await sb.from("kr_stock_snapshot").update({ name_en }).eq("symbol", symbol);
    if (!error) saved++;
  });
  console.log(`완료: name_en 저장 ${saved}/${entries.length}`);
  process.exit(0);
})();
