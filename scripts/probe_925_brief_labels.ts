// STEP 925 — daily-brief · email-brief 라벨 조립 진단 프로브. 읽기 전용, 메일 발송 0, DB 쓰기 0.
// 실행: npx tsx scripts/probe_925_brief_labels.ts   (환경: .env.local 의 SUPABASE_SERVICE_ROLE_KEY)
// 무엇을 재는가:
//   ① daily-brief(app/api/cron/daily-brief/route.ts)와 email-brief(app/api/cron/email-brief/route.ts)가
//      실제로 만드는 것과 같은 movers 배열을, 같은 함수(resolveDisplayName·lensDisplayName·lensStateLabel)로
//      직접 재구성해 문자열을 만든다 — 두 라우트 파일 자체는 호출하지 않는다(크론 실행·발송 없음).
//   ② 그 문자열에 "이름 이름" 식 중복(lensName이 to/from 안에 또 나오는가)이 있는지 · 종목명에 티커가
//      남아있는지(924가 고친 getTodayChanges를 거치므로 없어야 정상) 확인한다.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { getTodayChanges } from "../lib/todayChanges";
import { resolveDisplayName } from "../lib/displayName";
import { lensDisplayName, lensStateLabel, lensStateLine } from "../lib/lensCopy";
import { buildFallbackBrief, factsToPromptText, type BriefFacts, type Locale } from "../lib/dailyBrief";

type Market = "KR" | "US";

function dupCheck(lensName: string, s: string): boolean {
  return s.toLowerCase().includes(lensName.toLowerCase());
}

async function buildMoversLikeDailyBrief(market: Market, loc: Locale) {
  const changes = await getTodayChanges({ market, limit: 5 });
  const movers = changes.items.map((it) => ({
    name: resolveDisplayName({ loc, market, symbol: it.symbol, nameKo: it.nameKo, nameEn: it.nameEn, rawName: it.name, context: "list" as const }),
    lensName: lensDisplayName(loc, it.lensKey),
    from: it.fromState ? lensStateLabel(loc, it.lensKey, it.fromState) : "—",
    to: lensStateLabel(loc, it.lensKey, it.toState),
    // 924가 신설한 조립 함수로도 같은 to를 만들어 대조(실제 daily-brief/email-brief는 이걸 쓰지 않는다 — 대조용)
    toViaLensStateLine: lensStateLine(loc, it.lensKey, it.toState),
    lensKey: it.lensKey,
    toState: it.toState,
    symbol: it.symbol,
  }));
  return { date: changes.date, movers };
}

async function main() {
  const report: Record<string, unknown> = {};

  for (const [market, loc] of [["KR", "ko"], ["US", "en"]] as [Market, Locale][]) {
    const { date, movers } = await buildMoversLikeDailyBrief(market, loc);

    const dupRows = movers
      .map((m) => ({ ...m, dup: dupCheck(m.lensName, m.to) || dupCheck(m.lensName, m.from) }))
      .filter((m) => m.dup);

    const tickerLikeNames = movers.filter((m) => m.name === m.symbol);

    // daily-brief 결정론 폴백(§실제 함수 그대로 호출) — LLM 콜은 하지 않음(성공해도 실패해도 이 함수가 항상 쓰이는 경로).
    const facts: BriefFacts = {
      indices: [],
      counts: { total: movers.length, pos: 0, warn: 0 },
      movers: movers.map((m) => ({ name: m.name, lensName: m.lensName, from: m.from, to: m.to })),
      overnightUs: null,
    };
    const fallbackText = buildFallbackBrief(facts, loc);
    const promptText = factsToPromptText(facts, loc);

    // email-brief HTML mover 줄과 동일 포맷(route.ts renderHtml의 moversHtml 템플릿 문자열, 발송 없이 문자열만 재현)
    const emailLines = movers.map((m) => `${m.name} — ${m.lensName} ${m.from} → ${m.to}`);

    report[`${market}_${loc}`] = {
      date,
      movers_count: movers.length,
      duplicate_label_rows: dupRows.map((m) => ({ symbol: m.symbol, lensKey: m.lensKey, toState: m.toState, lensName: m.lensName, from: m.from, to: m.to, to_via_lensStateLine: m.toViaLensStateLine })),
      duplicate_label_count: dupRows.length,
      ticker_like_name_count: tickerLikeNames.length,
      ticker_like_names: tickerLikeNames.map((m) => m.symbol),
      fallback_brief_text: fallbackText,
      prompt_text_sample: promptText,
      email_mover_lines_sample: emailLines,
    };
  }

  console.log(JSON.stringify(report, null, 2));
}

main();
