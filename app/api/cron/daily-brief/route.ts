import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTodayChanges } from "@/lib/todayChanges";
import { getIndices, type IndexItem } from "@/lib/indices";
import { resolveDisplayName } from "@/lib/displayName";
import { lensDisplayName, lensStateLabel } from "@/lib/lensCopy";
import {
  buildFallbackBrief, factsToPromptText, passesGuard,
  type BriefFacts, type Locale,
} from "@/lib/dailyBrief";

// "한 입 브리핑" 크론 — 하루 1회(21:00 UTC), KR은 ko 브리핑만, US는 en 브리핑만 생성(오늘 화면은 시장당 한 로케일만 씀).
export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const DAILY_BRIEF_SYSTEM: Record<Locale, string> = {
  ko:
    '당신은 한국 개인투자자에게 어제 시장을 요약하는 애널리스트입니다. 아래 주어진 사실(지수 등락·렌즈 전환 통계·거래대금 상위 전환 종목)만 근거로 3~4문장 한국어 시황 요약을 씁니다.\n' +
    '규칙(반드시): (1) 전망·예측·추천·매수·매도 표현 절대 금지 — "오를 것/내릴 것·사야/팔아·목표가·추천·기대·유망" 등 금지. ' +
    '(2) 주어진 사실에 없는 내용·숫자·원인(섹터 추측 등) 추가 금지. (3) 건조하게, 군더더기 없이, 한 문단. (4) 숫자는 사실 그대로.',
  en:
    'You are an analyst summarizing yesterday\'s market for individual investors. Write a 3-4 sentence English market summary based ONLY on the facts given below (index changes, lens transition stats, top movers by trade value).\n' +
    'Rules (must): (1) No forecasts, outlook, or recommendations — never say "will rise/fall, buy/sell, target price, recommend, expect, promising," etc. ' +
    '(2) Do not add content, numbers, or causes (e.g. sector guesses) not in the given facts. (3) Keep it dry and plain, no filler, one paragraph. (4) Numbers exactly as given.',
};

async function generateBrief(facts: BriefFacts, locale: Locale): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const fallback = buildFallbackBrief(facts, locale);
  if (!apiKey) return fallback;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: DAILY_BRIEF_SYSTEM[locale] },
          {
            role: "user",
            content: locale === "en"
              ? `Below are yesterday's market facts. Write the summary based on them:\n\n${factsToPromptText(facts, locale)}`
              : `아래는 어제 시장 사실입니다. 이걸 바탕으로 시황 요약을 써주세요:\n\n${factsToPromptText(facts, locale)}`,
          },
        ],
        max_tokens: 220,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return fallback;
    const j = await res.json();
    const text = (j.choices?.[0]?.message?.content || "").trim();
    // 3중 가드: 금지어 후처리 필터 + 언어 검증 — 통과 못 하면 결정론 폴백으로 폐기·대체(어떤 경우에도 빈 값 없이 저장).
    return passesGuard(text, locale) ? text : fallback;
  } catch {
    return fallback;
  }
}

function findIndex(items: IndexItem[], name: string): IndexItem | undefined {
  return items.find((i) => i.name === name);
}

async function buildMarketFacts(market: "KR" | "US", loc: Locale, indices: IndexItem[]) {
  const changes = await getTodayChanges({ market, limit: 3 });
  const movers = changes.items.map((it) => ({
    name: resolveDisplayName({ loc, market, symbol: it.symbol, nameKo: it.nameKo, nameEn: it.nameEn, rawName: it.name, context: "list" }),
    lensName: lensDisplayName(loc, it.lensKey),
    from: it.fromState ? lensStateLabel(loc, it.lensKey, it.fromState) : "—",
    to: lensStateLabel(loc, it.lensKey, it.toState),
  }));
  const idxNames = market === "KR" ? ["KOSPI", "KOSDAQ"] : ["S&P 500", "NASDAQ"];
  const idxFacts = idxNames
    .map((n) => findIndex(indices, n))
    .filter((i): i is IndexItem => !!i)
    .map((i) => ({ name: i.name, changePct: i.changePct }));
  const sp500 = market === "KR" ? findIndex(indices, "S&P 500") : undefined;

  const facts: BriefFacts = {
    indices: idxFacts,
    counts: changes.counts,
    movers,
    overnightUs: market === "KR" && sp500 ? { name: sp500.name, changePct: sp500.changePct } : null,
  };
  return { date: changes.date, facts };
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const sb = createAdminClient();
  const results: { market: string; ok: boolean; date?: string | null; error?: string }[] = [];

  const [{ items: indices }] = await Promise.all([getIndices()]);

  for (const { market, locale, col } of [
    { market: "KR" as const, locale: "ko" as Locale, col: "text_ko" as const },
    { market: "US" as const, locale: "en" as Locale, col: "text_en" as const },
  ]) {
    try {
      const { date, facts } = await buildMarketFacts(market, locale, indices);
      if (!date) throw new Error("no_change_date");
      const text = await generateBrief(facts, locale);
      const { error } = await sb
        .from("daily_brief")
        .upsert({ brief_date: date, market, [col]: text, source_facts: facts }, { onConflict: "brief_date,market" });
      if (error) throw new Error(error.message);
      results.push({ market, ok: true, date });
    } catch (e) {
      Sentry.captureMessage(`[daily-brief] ${market} 생성 실패: ${String(e)}`, "error");
      results.push({ market, ok: false, error: String(e) });
    }
  }

  return NextResponse.json({ ok: results.every((r) => r.ok), results });
}
