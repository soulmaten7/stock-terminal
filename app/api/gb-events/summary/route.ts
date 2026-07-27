import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { blockLLM } from "@/lib/rateLimit";
import { urlCacheKey } from "@/lib/summaryCacheKey";
import * as Sentry from "@sentry/nextjs";

export const runtime = "nodejs";
export const maxDuration = 30;

// R1-GB: RNS 공시(Investegate 상세) 원문(영어) → 한국어 '사실' 요약. US/KR/JP R1의 GB 짝.
// 전역 캐시(filing_summaries, accession='GB'+id). 예측·판정 금지. 원문=공개 RNS 규제공시.
// 본문 컨테이너 = {source}-announcement(gnw/rns/prn/eqs…). 거기부터 시작해 사이트 푸터 컷.
function extractBody(html: string): string {
  const m = html.search(/class="[a-z0-9]+-announcement"/i);
  const seg = m >= 0 ? html.slice(m) : html;
  let text = seg
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&pound;/g, "£")
    .replace(/\s+/g, " ").trim();
  for (const c of ["This information is provided by RNS", "AI Summary Disclaimer", "Latest directors dealings", "This website is for Private Investors"]) {
    const i = text.indexOf(c);
    if (i > 200) text = text.slice(0, i);
  }
  return text.slice(0, 12000);
}

export async function GET(req: NextRequest) {
  const url = (req.nextUrl.searchParams.get("url") || "").trim();
  const symbol = (req.nextUrl.searchParams.get("symbol") || "").trim();
  const nm = req.nextUrl.searchParams.get("nm") || "";
  // SSRF·포이즈닝 방지(STEP 797 §2) — Investegate 공시 상세 URL만 허용. 중간 세그먼트를 경로구분자 없는 토큰으로
  // 제한(예전 [^?#"']+는 `/`·`..` 통과 → `.../a/../../../company/BP./9123456`로 임의 페이지를 임의 id로 저장 가능).
  // 중간은 여러 세그먼트(rns/bp/slug/id) 허용하되 경로구분자만 있는 토큰으로 제한 + `..` 명시 거부(traversal 차단).
  // 캐시 키가 sha1(url)이라 id 위조로는 포이즈닝 불가 — `..` 차단이 다른 investegate 페이지 본문 접근을 막는다.
  if (
    url.includes("..") ||
    !/^https:\/\/www\.investegate\.co\.uk\/announcement\/[a-z]+\/[A-Za-z0-9._/-]+\/\d+$/i.test(url)
  ) {
    return NextResponse.json({ error: "bad url" }, { status: 400 });
  }
  // 캐시 키를 본문 URL 해시로 파생(CN/VN과 동일 규칙·공용 헬퍼).
  const acc = urlCacheKey("GB", url);
  const locale = req.nextUrl.searchParams.get("lang") === "en" ? "en" : "ko";
  const col = locale === "en" ? "summary_en" : "summary_ko";

  const sb = createAdminClient();
  const { data: hit } = await sb.from("filing_summaries").select(col).eq("accession", acc).maybeSingle();
  const cachedText = (hit as Record<string, string> | null)?.[col];
  if (cachedText) return NextResponse.json({ summary: cachedText, cached: true });

  // 캐시 미스 = 새 유료 LLM 생성. 봇·레이트리밋 차단(과금 남용 방어·STEP 793). 캐시 히트는 위에서 이미 반환됨.
  if (blockLLM(req)) return NextResponse.json({ summary: "" }, { status: 429 });

  let text = "";
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TrillionBot/1.0; +https://onetrillion.app)", Accept: "text/html" },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) text = extractBody(await res.text());
  } catch {
    /* graceful */
  }
  if (!text || text.length < 80) return NextResponse.json({ error: "no extractable text" }, { status: 502 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY missing" }, { status: 500 });
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages:
        locale === "en"
          ? [
              {
                role: "system",
                content:
                  'You are an analyst conveying UK RNS regulatory announcements to individual investors — facts only. Summarize only what is actually written in the announcement, in 2-3 sentences. Rules: (1) No forecasts, outlook, or investment recommendations (buy/sell, target price, "opportunity") — absolutely forbidden. (2) Do not add anything not in the announcement. (3) Only "what happened" — facts (amounts, ratios, schedules). (4) Keep numbers and currency (£/$) exactly as in the source (do not convert). (5) Plain professional English, no filler.',
              },
              {
                role: "user",
                content: `This is the text of a UK RNS regulatory announcement (${nm || "untitled"}). In 2-3 English sentences, summarize the facts of what happened:\n\n${text}`,
              },
            ]
          : [
              {
                role: "system",
                content:
                  "당신은 영국 RNS 공시(영어)를 한국 개인투자자에게 사실만 전달하는 애널리스트입니다. 원문에 실제로 쓰인 내용만 2~3문장 한국어로 요약합니다. 규칙: (1) 예측·전망·투자 추천(사라/팔아라·목표가) 절대 금지 (2) 원문에 없는 내용 추가 금지 (3) \"무슨 일이 일어났는지\" 사실만(금액·비율·일정 등) (4) 숫자·통화(£·$)는 원문 그대로 (5) 해요체·군더더기 없이.",
              },
              {
                role: "user",
                content: `영국 RNS 공시(${nm || "제목없음"}) 원문(영어)입니다. 무슨 일이 일어났는지 한국어로 2~3문장 사실 요약:\n\n${text}`,
              },
            ],
      max_tokens: 320,
      temperature: 0.2,
    }),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) return NextResponse.json({ error: `llm ${res.status}` }, { status: 502 });
  const j = await res.json();
  const summary = (j.choices?.[0]?.message?.content || "").trim();
  if (!summary) return NextResponse.json({ error: "llm empty" }, { status: 502 });

  // 저장 실패를 삼키면 같은 공시를 볼 때마다 LLM 재호출 = 조용한 유료 누수(교훈 #31) → 로그+Sentry.
  const { error: upErr } = await sb.from("filing_summaries").upsert(
    { accession: acc, symbol, [col]: summary, model: "gpt-4o-mini" },
    { onConflict: "accession" },
  );
  if (upErr) {
    console.error("[gb-events/summary] filing_summaries upsert failed", { accession: acc, error: upErr.message });
    Sentry.captureMessage(`[gb-events/summary] filing_summaries upsert failed: ${upErr.message}`, "error");
  }
  return NextResponse.json({ summary, cached: false });
}
