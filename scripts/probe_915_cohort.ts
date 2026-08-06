// STEP 915 §3 — 480(오늘 464) 고정실패 코호트를 직접 호출해 원인을 가른다: 성공(예산부족→A안 통함)
// / 404·없음(원천불가→유니버스 문제) / 429·타임아웃(호출량 문제→A안 통하되 대가 다름).
// 읽기 전용 · DB 쓰기 0 · 크론 경로(RETRY_MAX·게이트) 안 탐 — 순수 취득 함수(yf.quote)만 개별 호출.
// 실행: npx tsx scripts/probe_915_cohort.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import { writeFileSync } from "fs";
import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

async function main() {
  const sb = createAdminClient();

  // [1] 07-30에 멈춘 코호트 전수(오늘 기준 — 914의 480에서 일부 자연 회복돼 오늘은 464)
  const { data } = await sb.from("us_market_cap").select("symbol,market_cap,as_of").eq("as_of", "2026-07-30").order("symbol", { ascending: true });
  const cohort = (data ?? []) as { symbol: string; market_cap: number; as_of: string }[];
  console.error(`[1] 07-30 고정 코호트 n=${cohort.length}(914 시점 480 → 오늘 자연 감소분 반영)`);

  // [2] 표본 20개 — 체계적 표집(systematic sampling): 심볼 알파벳순 정렬 후 등간격 스텝으로 20개.
  //   재현 가능: step = floor(n/20), 시작 인덱스 0, 인덱스 = 0, step, 2*step, ... (Math.random 미사용 — 이 스크립트는 워크플로 밖이라 가능은 하나
  //   요구사항 "표본 선정 방식을 기록·재현 가능"을 가장 단순히 만족시키는 결정론적 방법을 택함).
  const SAMPLE_SIZE = 20;
  const step = Math.max(1, Math.floor(cohort.length / SAMPLE_SIZE));
  const sample: typeof cohort = [];
  for (let i = 0; i < cohort.length && sample.length < SAMPLE_SIZE; i += step) sample.push(cohort[i]);
  console.error(`[2] 표집 방식: 심볼 알파벳순 정렬 후 step=${step} 간격 체계적 표집 · 표본 n=${sample.length}`);
  console.error(`  표본: ${sample.map((s) => s.symbol).join(", ")}`);

  type Result = {
    symbol: string;
    lastKnownCap: number;
    outcome: "success" | "no_data" | "rate_limited_or_timeout" | "other_error";
    freshMarketCap: number | null;
    errorMessage: string | null;
    elapsedMs: number;
  };
  const results: Result[] = [];

  for (const row of sample) {
    const t0 = Date.now();
    try {
      const q = (await yf.quote(row.symbol)) as { marketCap?: number; symbol?: string };
      const elapsedMs = Date.now() - t0;
      if (typeof q?.marketCap === "number" && q.marketCap > 0) {
        results.push({ symbol: row.symbol, lastKnownCap: row.market_cap, outcome: "success", freshMarketCap: q.marketCap, errorMessage: null, elapsedMs });
      } else {
        // 호출은 됐으나(에러 없음) marketCap 필드가 없음 — noCapField 케이스(832 진단과 같은 유형). "성공"은 아니되 404류도 아님.
        results.push({ symbol: row.symbol, lastKnownCap: row.market_cap, outcome: "no_data", freshMarketCap: null, errorMessage: "quote 응답에 marketCap 필드 없음(에러는 아님)", elapsedMs });
      }
    } catch (e) {
      const elapsedMs = Date.now() - t0;
      const msg = e instanceof Error ? e.message : String(e);
      const lower = msg.toLowerCase();
      let outcome: Result["outcome"] = "other_error";
      if (lower.includes("429") || lower.includes("rate") || lower.includes("timeout") || lower.includes("timed out") || elapsedMs > 15000) outcome = "rate_limited_or_timeout";
      else if (lower.includes("not found") || lower.includes("404") || lower.includes("no fundamentals") || lower.includes("quote not found") || lower.includes("invalid")) outcome = "no_data";
      results.push({ symbol: row.symbol, lastKnownCap: row.market_cap, outcome, freshMarketCap: null, errorMessage: msg, elapsedMs });
    }
    console.error(`  ${row.symbol}: ${results[results.length - 1].outcome}(${results[results.length - 1].elapsedMs}ms)${results[results.length - 1].errorMessage ? " — " + results[results.length - 1].errorMessage : ""}`);
    await new Promise((r) => setTimeout(r, 300)); // 예의상 간격(야후 무료 API 명시적 rate limit 문서 없음 — 배치 크론의 동시성6보다 훨씬 보수적으로)
  }

  // sanity check(플레이북 #87 — 재현 로직을 실제와 대조 없이 믿지 않는다): outcome 분류가 서로 배타적인지, 20개 전부 분류됐는지.
  const total = results.length;
  const bucketed = results.filter((r) => ["success", "no_data", "rate_limited_or_timeout", "other_error"].includes(r.outcome)).length;
  const sanityOk = total === sample.length && bucketed === total;
  console.error(`\n[sanity] 표본수=${sample.length} · 결과수=${total} · 분류완료=${bucketed} · 정합=${sanityOk}`);

  const counts = { success: 0, no_data: 0, rate_limited_or_timeout: 0, other_error: 0 };
  for (const r of results) counts[r.outcome]++;

  const output = {
    cohortSize_today: cohort.length,
    cohortSize_914: 480,
    sampleMethod: "심볼 알파벳순 정렬 → 체계적 표집(step=floor(n/SAMPLE_SIZE), 시작 0) → 결정론적·재현 가능(Math.random 미사용)",
    sampleSize: sample.length,
    sample: sample.map((s) => s.symbol),
    results,
    counts,
    interpretation: {
      success: `${counts.success}/${sample.length} — 취득 자체는 가능(예산·시간 부족이 원인일 수 있음 → A안 통함 방향의 근거)`,
      no_data: `${counts.no_data}/${sample.length} — 원천 취득 불가로 보임(상장폐지·티커변경 등 가능성 → A안 실패, 유니버스 문제 방향의 근거)`,
      rate_limited_or_timeout: `${counts.rate_limited_or_timeout}/${sample.length} — 호출량/응답지연 문제(A안 통하되 대가[동시성·시간예산] 다름)`,
      other_error: `${counts.other_error}/${sample.length} — 위 세 갈래로 명확히 안 갈리는 기타 에러(원문 메시지 참조)`,
    },
    sanityCheck: { sampleSize: sample.length, resultCount: total, allBucketed: bucketed === total, ok: sanityOk },
    caveat: "🔴 표본 20개는 전체(464~480)의 확정 추정치가 아니다. 방향과 대략의 비율만 시사한다 — 전수 추정치를 단정하지 않는다(#10·890 교훈).",
  };
  writeFileSync("docs/probe_915_cohort.json", JSON.stringify(output, null, 2));

  console.error(`\n=== 요약 ===`);
  console.error(`성공 ${counts.success} · no_data ${counts.no_data} · rate_limited/timeout ${counts.rate_limited_or_timeout} · 기타 ${counts.other_error} (표본 ${sample.length}개 중)`);

  const rr = (await sb.from("revdcf_results").select("as_of")).data as { as_of: string }[];
  const rcounts: Record<string, number> = {}; for (const x of rr) rcounts[x.as_of] = (rcounts[x.as_of] || 0) + 1;
  console.error(`\n무변경 확인: revdcf_results ${JSON.stringify(rcounts)}`);
  const mc = (await sb.from("us_market_cap").select("symbol", { count: "exact", head: true })).count;
  console.error(`us_market_cap count=${mc}(이 스크립트가 안 씀 — DB 쓰기 0)`);
  const lc = (await sb.from("lens_cuts").select("market", { count: "exact", head: true })).count;
  console.error(`lens_cuts count=${lc}(10 기준, 무변경)`);
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
