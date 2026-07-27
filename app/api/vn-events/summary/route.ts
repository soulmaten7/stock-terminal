import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { blockLLM } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 30;

// R1-VN: Google News 링크 → 원문 기사(베트남어) → 한국어 '사실' 요약. US/KR/JP/GB R1의 VN 짝.
// VN은 공식 공시원문이 없어 뉴스 기사 기반. 구글뉴스 링크가 원문으로 resolve 안 되면 조용히 숨김.
// 전역 캐시(filing_summaries, accession='VN'+id). 예측·판정 금지.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

function extractArticle(html: string): string {
  let seg = "";
  const art = html.match(/<article\b[\s\S]*?<\/article>/i);
  if (art) seg = art[0];
  else {
    const ps = html.match(/<p\b[^>]*>[\s\S]*?<\/p>/gi) || [];
    seg = ps.slice(0, 40).join(" ");
  }
  const text = seg
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ").trim();
  return text.slice(0, 12000);
}

export async function GET(req: NextRequest) {
  const url = (req.nextUrl.searchParams.get("url") || "").trim();
  const symbol = (req.nextUrl.searchParams.get("symbol") || "").trim();
  const nm = req.nextUrl.searchParams.get("nm") || "";
  // SSRF 방지 — 구글뉴스 링크만 허용(리다이렉트는 공개 언론사로만 감).
  if (!/^https:\/\/news\.google\.com\//i.test(url)) {
    return NextResponse.json({ error: "bad url" }, { status: 400 });
  }
  // 캐시 키를 본문(구글뉴스) URL에서 파생(해시) — 예전엔 클라 id가 url과 독립이라 임의 기사를 임의 id로
  // 저장하는 캐시 포이즈닝이 가능했음. 이제 키가 소스 URL에만 묶임(STEP 793·GB 라우트 원칙과 동일).
  const acc = "VN" + createHash("sha1").update(url).digest("hex").slice(0, 24);
  const locale = req.nextUrl.searchParams.get("lang") === "en" ? "en" : "ko";
  const col = locale === "en" ? "summary_en" : "summary_ko";

  const sb = createAdminClient();
  const { data: hit } = await sb.from("filing_summaries").select(col).eq("accession", acc).maybeSingle();
  const cachedText = (hit as Record<string, string> | null)?.[col];
  if (cachedText) return NextResponse.json({ summary: cachedText, cached: true });

  // 캐시 미스 = 새 유료 LLM 생성. 봇·레이트리밋 차단(과금 남용 방어·STEP 793). 캐시 히트는 위에서 이미 반환됨.
  if (blockLLM(req)) return NextResponse.json({ summary: "" }, { status: 429 });

  // 구글뉴스 링크 → 최종 기사(리다이렉트 따라감)
  let text = "";
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html", "Accept-Language": "vi-VN,vi;q=0.9" },
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      const finalUrl = res.url || "";
      // 여전히 구글 도메인이면 원문 resolve 실패(인터스티셜) → 숨김
      if (!/news\.google\.com|consent\.google\.com/i.test(finalUrl)) {
        text = extractArticle(await res.text());
      }
    }
  } catch { /* graceful */ }
  if (!text || text.length < 120) return NextResponse.json({ error: "no extractable text" }, { status: 502 });

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
                  'You are an analyst conveying Vietnamese company news to individual investors — facts only. Summarize only what is actually written in the article, in 2-3 sentences. Rules: (1) No forecasts, outlook, or investment recommendations (buy/sell, target price, "opportunity") — absolutely forbidden. (2) Do not add anything not in the article. (3) Only "what happened" — facts (amounts, ratios, schedules). (4) Keep numbers and currency (Vietnamese dong ₫) exactly as in the source (do not convert). (5) Plain professional English, no filler.',
              },
              {
                role: "user",
                content: `This is the text of a Vietnamese company-news article (${nm || "untitled"}). In 2-3 English sentences, summarize the facts of what happened:\n\n${text}`,
              },
            ]
          : [
              {
                role: "system",
                content:
                  "당신은 베트남 증시 기사(베트남어)를 한국 개인투자자에게 사실만 전달하는 애널리스트입니다. 기사에 실제로 쓰인 내용만 2~3문장 한국어로 요약합니다. 규칙: (1) 예측·전망·투자 추천(사라/팔아라·목표가) 절대 금지 (2) 기사에 없는 내용 추가 금지 (3) \"무슨 일이 일어났는지\" 사실만(금액·비율·일정 등) (4) 숫자·통화(동 ₫)는 원문 그대로 (5) 반드시 한국어로, 해요체·군더더기 없이. 영어·베트남어로 답하지 마세요.",
              },
              {
                role: "user",
                content: `베트남 증시 기사(${nm || "제목없음"}) 원문(베트남어)입니다. 무슨 일이 일어났는지 한국어로 2~3문장 사실 요약:\n\n${text}`,
              },
            ],
      max_tokens: 320,
      temperature: 0.2,
    }),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) return NextResponse.json({ error: `llm ${res.status}` }, { status: 502 });
  const j = await res.json();
  let summary = (j.choices?.[0]?.message?.content || "").trim();
  if (!summary) return NextResponse.json({ error: "llm empty" }, { status: 502 });

  // 후처리1: 한국어 아니면 번역(R3 방식 — 베트남어/영어 출력 방어) — ko 게이팅(en은 영어 그대로 둔다)
  if (locale === "ko" && !/[가-힣]/.test(summary)) {
    try {
      const tr = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "다음을 자연스러운 한국어(해요체)로 옮깁니다. 내용 추가·의견 금지, 사실만." },
            { role: "user", content: summary },
          ],
          max_tokens: 320, temperature: 0.2,
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (tr.ok) { const t = (((await tr.json()).choices?.[0]?.message?.content) || "").trim(); if (/[가-힣]/.test(t)) summary = t; }
    } catch { /* 유지 */ }
  }
  // 후처리2: 통화 교정 — 베트남 동(숫자 뒤 '원'→'동'). '원가·원인' 등 일반어(앞이 숫자 아님)는 안 건드림. ko만(en은 원문 통화 그대로).
  if (locale === "ko") summary = summary.replace(/(\d[\d,.]*\s*[조억만천]?\s*)원/g, "$1동");

  await sb.from("filing_summaries").upsert(
    { accession: acc, symbol, [col]: summary, model: "gpt-4o-mini" },
    { onConflict: "accession" },
  );
  return NextResponse.json({ summary, cached: false });
}
