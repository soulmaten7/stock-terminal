// STEP 834 §4 — churn '표본 추정'(프록시). 저장 이력이 없어 과거 top-1000 경계 churn은 측정 불가.
//   대신 경계권 표본의 '일별 거래대금(가격×거래량)'과 '가격'의 변동성을 재서, 거래대금 순위가 시총 순위보다
//   얼마나 더 요동치는지(=유니버스 정의별 일일 churn 경향)를 프록시로 본다. 🔴 절대 boundary flip율 아님(표본 프록시).
// 실행: npx tsx scripts/probe_churn_proxy.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import YahooFinance from "yahoo-finance2";
import { createAdminClient } from "../lib/supabase/admin";
const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

function cv(xs: number[]): number { // 변동계수 = std/mean
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  const v = xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length;
  return Math.sqrt(v) / m;
}
const med = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

(async () => {
  const sb = createAdminClient();
  // 경계권 표본: 시총 순위 800~1200(top-1000 경계 부근) 중 무작위 아닌 '경계 층화' 100종목.
  const { data } = await sb.from("us_market_cap").select("symbol,market_cap").order("market_cap", { ascending: false }).range(799, 1199);
  const boundary = ((data ?? []) as { symbol: string }[]).map((r) => r.symbol);
  const sample = boundary.filter((_, i) => i % 4 === 0).slice(0, 100); // 층화(매 4번째) 100
  console.log(`§4 churn 프록시 — 경계권(시총순위 800~1200) 표본 ${sample.length}종목 · 최근 ~15영업일 일별 거래대금 vs 가격 변동`);

  const dvCVs: number[] = [], pxCVs: number[] = [];
  let done = 0, i = 0;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (i < sample.length) {
      const sym = sample[i++];
      try {
        const ch = (await yf.chart(sym, { period1: new Date(Date.now() - 30 * 864e5), interval: "1d" })) as { quotes?: { close?: number | null; volume?: number | null }[] };
        const qs = (ch.quotes ?? []).filter((q) => typeof q.close === "number" && typeof q.volume === "number" && (q.volume as number) > 0).slice(-15);
        if (qs.length < 8) continue;
        const dv = qs.map((q) => (q.close as number) * (q.volume as number)); // 일별 거래대금
        const px = qs.map((q) => q.close as number);                          // 일별 가격(시총 프록시·주식수 불변)
        dvCVs.push(cv(dv)); pxCVs.push(cv(px));
      } catch { /* skip */ } finally { if (++done % 25 === 0) console.log(`  ...${done}/${sample.length}`); }
    }
  }));
  console.log(`\n표본 ${dvCVs.length}종목 일별 변동계수(CV) 중앙값:`);
  console.log(`  거래대금 CV 중앙 = ${(100 * med(dvCVs)).toFixed(1)}%  (일별 거래대금이 이만큼 요동 → 순위·경계 편입/제외 잦음)`);
  console.log(`  가격(시총) CV 중앙 = ${(100 * med(pxCVs)).toFixed(1)}%  (시총은 가격만 움직이고 주식수 불변 → 훨씬 안정)`);
  console.log(`  → 거래대금 순위가 시총 순위보다 약 ${(med(dvCVs) / med(pxCVs)).toFixed(1)}배 요동(프록시). 정의를 거래대금으로 하면 일일 유니버스 churn↑.`);
  console.log(`(끝 · 표본 프록시 · 절대 churn율 아님 · 프로덕션 무기록)`);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
