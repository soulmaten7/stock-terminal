// STEP 899 §1 — 적자(lossMaking) 종목 규모·판정 분포 재측정. 읽기 전용 · DB 쓰기 0 · 크론 실행 없음.
// 실행: npx tsx scripts/probe_899_lossmaking.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { writeFileSync } from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";

const sb = createAdminClient();

(async () => {
  const latestAsOf = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;
  const asOf = latestAsOf!.as_of;

  const rows: { symbol: string; verdict: string | null; operating_margin: number | null; gap_years: number | null }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from("revdcf_results").select("symbol, verdict, operating_margin, gap_years").eq("as_of", asOf).range(from, from + 999);
    const c = (data ?? []) as typeof rows;
    rows.push(...c);
    if (c.length < 1000) break;
  }

  const lossMaking = rows.filter((r) => r.operating_margin != null && r.operating_margin <= 0);
  const byVerdict: Record<string, number> = {};
  for (const r of lossMaking) byVerdict[r.verdict ?? "null"] = (byVerdict[r.verdict ?? "null"] ?? 0) + 1;

  const yearsLossMaking = lossMaking.filter((r) => r.verdict === "years");

  const result = {
    asOf,
    totalRows: rows.length,
    lossMakingTotal: lossMaking.length,
    lossMakingByVerdict: byVerdict,
    claudeMd124Compare: { citedTotal78: "63(value_destroying)+11(over_cap)+4(years)", measuredNow: `${lossMaking.length} = ${JSON.stringify(byVerdict)}`, note: "880 driver5 전환 이후 재측정 — 다른 값이 예상됨(재판정 아님, 재측정)" },
    yearsLossMakingSymbols: yearsLossMaking.map((r) => ({ symbol: r.symbol, gap_years: r.gap_years, operating_margin: r.operating_margin })),
    codeTraceConclusion: {
      revDcfSection: "lossMaking = d.operatingMargin != null && d.operatingMargin <= 0 (components/RevDcfSection.tsx:41) — !lossMaking 게이트가 v==='years' 헤드라인(:85)보다 먼저 적용돼 적자면 'N년 성장 요구' 문구 자체가 안 뜬다",
      revDcfBadge: "components/RevDcfBadge.tsx가 lossMaking prop을 받아 최우선 분기(if (lossMaking) return outOfScope)한다 — verdict만 보는 게 아니다(856 §2 구현 확인)",
      onlyCaller: "components/toolbox/UsMarketBoard.tsx 2곳(desktop :520 · mobile :555) 전부 lossMaking={revdcf.map[r.symbol]?.lossMaking}을 넘긴다",
      batchApiSource: "app/api/revdcf/batch/route.ts가 lossMaking: r.operating_margin != null && r.operating_margin <= 0 을 서버에서 계산해 반환한다(:19-20)",
      otherSurfaces: "watchlist·briefing·email 등 다른 화면은 revdcf를 아예 소비하지 않는다(app/ lib/ components/ 전수 grep — revdcf 참조 파일 12개, 위 목록이 전부)",
    },
  };
  writeFileSync("docs/probe_899_lossmaking.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
})();
