// STEP 985 §2 — 전수 대조(계산만, DB 쓰기 0). topByMarketCap()과 같은 배치(100)·동시성(6)으로 야후를 조회하되
// us_market_cap에 쓰지 않는다(순수 관측). resolveMarketCap()을 실제로 통과시켜 대조한다(로직 복제 아님, import).
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import YahooFinance from "yahoo-finance2";
import fs from "fs";
import symbols from "../data/us_symbols.json";
import { resolveMarketCap } from "../lib/marketCapReconstruct";
import { createAdminClient } from "../lib/supabase/admin";

type Sym = { sym: string; name: string; type: string };
const STOCK_SYMS: string[] = (symbols as Sym[]).filter((s) => s.type === "stock").map((s) => s.sym);

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

async function mapLimit<T, R>(arr: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(arr.length);
  let idx = 0;
  async function worker() { while (idx < arr.length) { const cur = idx++; out[cur] = await fn(arr[cur]); } }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, () => worker()));
  return out;
}

const FLAGGED_MEGACAPS = ["XOM", "HD", "MCD", "CRM", "MRK", "LOW", "TGT"]; // 984가 지목한 초대형 실패군

async function main() {
  const chunks: string[][] = [];
  for (let i = 0; i < STOCK_SYMS.length; i += 100) chunks.push(STOCK_SYMS.slice(i, i + 100));
  console.log(`유니버스 ${STOCK_SYMS.length}종목, ${chunks.length}청크`);

  const rows: { symbol: string; hasField: boolean; fieldVal: number | null; reconVal: number | null; source: string | null; availableFields?: string[] }[] = [];
  let failedChunks = 0;

  await mapLimit(chunks, 6, async (grp) => {
    try {
      const qs = (await yf.quote(grp)) as Array<Record<string, unknown>>;
      for (const q of Array.isArray(qs) ? qs : []) {
        const sym = q.symbol as string | undefined;
        if (!sym) continue;
        const hasField = typeof q.marketCap === "number" && (q.marketCap as number) > 0;
        const fieldVal = hasField ? (q.marketCap as number) : null;
        const r = resolveMarketCap(q);
        // 원시필드가 있어도 재구성값을 따로 계산해 대조(§2-1) — resolveMarketCap 자체는 field 우선이라 그 결과와 별개로 여기서 직접 계산.
        const shares = q.sharesOutstanding, price = q.regularMarketPrice;
        const reconVal = typeof shares === "number" && shares > 0 && typeof price === "number" && price > 0 ? shares * price : null;
        rows.push({ symbol: sym, hasField, fieldVal, reconVal, source: r.source, availableFields: r.source == null ? r.availableFields : undefined });
      }
    } catch { failedChunks++; }
  });

  console.log(`응답 심볼 ${rows.length}개 (실패청크 ${failedChunks}/${chunks.length})`);

  // §2-1: marketCap 있는 종목의 재구성값 대조
  const bothPresent = rows.filter((r) => r.hasField && r.reconVal != null && r.fieldVal != null);
  const ratios = bothPresent.map((r) => Math.abs(r.fieldVal! - r.reconVal!) / Math.abs(r.fieldVal!)).sort((a, b) => a - b);
  const pct = (p: number) => ratios[Math.min(ratios.length - 1, Math.floor(ratios.length * p))];
  const top20 = [...bothPresent].sort((a, b) =>
    Math.abs(b.fieldVal! - b.reconVal!) / Math.abs(b.fieldVal!) - Math.abs(a.fieldVal! - a.reconVal!) / Math.abs(a.fieldVal!)
  ).slice(0, 20).map((r) => ({ symbol: r.symbol, fieldVal: r.fieldVal, reconVal: r.reconVal, relDiffPct: Number((Math.abs(r.fieldVal! - r.reconVal!) / Math.abs(r.fieldVal!) * 100).toFixed(4)) }));

  // §2-2: marketCap 없는 종목에서 재구성 성공률
  const missing = rows.filter((r) => !r.hasField);
  const reconSuccess = missing.filter((r) => r.reconVal != null);
  const reconFail = missing.filter((r) => r.reconVal == null);
  const fieldFreqInFail: Record<string, number> = {};
  for (const r of reconFail) for (const f of r.availableFields ?? []) fieldFreqInFail[f] = (fieldFreqInFail[f] ?? 0) + 1;

  // §2-3: freshCoverage 재계산(재구성 포함 시) + compRatio(같은 freshSet에서 파생, capGateDecision과 동일 정의)
  const universe = STOCK_SYMS.length;
  const freshBefore = rows.filter((r) => r.hasField).length;
  const freshAfter = freshBefore + reconSuccess.length;
  const freshCoverageBefore = freshBefore / universe;
  const freshCoverageAfter = freshAfter / universe;

  const sb = createAdminClient(); // 읽기 전용 — 직전 상위200 메가캡 구성게이트 대조용(쓰기 없음)
  const { data: priorTop } = await sb.from("us_market_cap").select("symbol").order("market_cap", { ascending: false }).limit(200);
  const priorTopSyms = ((priorTop ?? []) as { symbol: string }[]).map((r) => r.symbol);
  const freshSetBefore = new Set(rows.filter((r) => r.hasField).map((r) => r.symbol));
  const freshSetAfter = new Set(rows.filter((r) => r.hasField || r.reconVal != null).map((r) => r.symbol));
  const compRatio = (freshSet: Set<string>) => priorTopSyms.length ? priorTopSyms.filter((s) => freshSet.has(s)).length / priorTopSyms.length : null;
  const compRatioBefore = compRatio(freshSetBefore);
  const compRatioAfter = compRatio(freshSetAfter);

  // §2-4: 지목된 초대형주 개별 확인
  const megacapCheck = FLAGGED_MEGACAPS.map((sym) => {
    const r = rows.find((x) => x.symbol === sym);
    return r ? { symbol: sym, hasField: r.hasField, fieldVal: r.fieldVal, reconVal: r.reconVal } : { symbol: sym, note: "이번 조회에 응답 없음" };
  });

  const result = {
    universe, respondedSymbols: rows.length, failedChunks, totalChunks: chunks.length,
    section2_1: { bothPresentN: bothPresent.length, p50RelDiffPct: Number((pct(0.5) * 100).toFixed(4)), p90RelDiffPct: Number((pct(0.9) * 100).toFixed(4)), maxRelDiffPct: Number((ratios[ratios.length - 1] * 100).toFixed(4)), top20 },
    section2_2: { missingN: missing.length, reconSuccessN: reconSuccess.length, reconFailN: reconFail.length, fieldFreqInFail },
    section2_3: {
      freshCoverageBefore: Number((freshCoverageBefore * 100).toFixed(2)), freshCoverageAfter: Number((freshCoverageAfter * 100).toFixed(2)),
      coverageGateThreshold: 97, passesCoverageGateBefore: freshCoverageBefore >= 0.97, passesCoverageGateAfter: freshCoverageAfter >= 0.97,
      compRatioBefore: compRatioBefore != null ? Number((compRatioBefore * 100).toFixed(2)) : null,
      compRatioAfter: compRatioAfter != null ? Number((compRatioAfter * 100).toFixed(2)) : null,
      compositionGateThreshold: 95,
      passesCompositionGateBefore: compRatioBefore != null ? compRatioBefore >= 0.95 : null,
      passesCompositionGateAfter: compRatioAfter != null ? compRatioAfter >= 0.95 : null,
      cutGateOkAfter: freshCoverageAfter >= 0.97 && (compRatioAfter == null || compRatioAfter >= 0.95),
    },
    section2_4_megacaps: megacapCheck,
  };
  fs.writeFileSync("docs/probe_985_full_universe_output.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}

main();
