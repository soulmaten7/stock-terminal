import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractText, getDocumentProxy } from "unpdf";
import { blockLLM } from "@/lib/rateLimit";
import { urlCacheKey } from "@/lib/summaryCacheKey";
import { sanitizeFilingLabel, filingSummaryPasses } from "@/lib/filingGuard";
import * as Sentry from "@sentry/nextjs";

export const runtime = "nodejs";
export const maxDuration = 60;

// R1-CN: cninfo 공시 PDF(중국어) → 한국어 '사실' 요약. US/KR/JP/GB R1의 CN 짝.
// 전역 캐시(filing_summaries, accession='CN'+id). 예측·판정 금지. 원문=증감회 지정 공식 공시(공개).
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36";

export async function GET(req: NextRequest) {
  const pdf = (req.nextUrl.searchParams.get("pdf") || "").trim();
  const symbol = (req.nextUrl.searchParams.get("symbol") || "").trim();
  const nm = sanitizeFilingLabel(req.nextUrl.searchParams.get("nm")); // STEP 828 §1
  // SSRF 방지 — cninfo 정적 PDF 또는 HKEXnews PDF만 허용.
  const okCninfo = /^https?:\/\/static\.cninfo\.com\.cn\/.+\.PDF$/i.test(pdf);
  const okHkex = /^https?:\/\/www\d?\.hkexnews\.hk\/.+\.(pdf|PDF)$/i.test(pdf);
  if (!okCninfo && !okHkex) {
    return NextResponse.json({ error: "bad url" }, { status: 400 });
  }
  // 캐시 키를 본문 PDF URL에서 파생(해시) — 예전엔 클라 id가 pdf와 독립이라 임의 문서를 임의 id로
  // 저장하는 캐시 포이즈닝이 가능했음. 이제 키가 소스 URL에만 묶임(STEP 793·GB 라우트 원칙과 동일).
  const acc = urlCacheKey(okHkex ? "HK" : "CN", pdf);
  const locale = req.nextUrl.searchParams.get("lang") === "en" ? "en" : "ko";
  const col = locale === "en" ? "summary_en" : "summary_ko";

  const sb = createAdminClient();
  const { data: hit } = await sb.from("filing_summaries").select(col).eq("accession", acc).maybeSingle();
  const cachedText = (hit as Record<string, string> | null)?.[col];
  if (cachedText) return NextResponse.json({ summary: cachedText, cached: true });

  // 캐시 미스 = 새 유료 LLM 생성. 봇·레이트리밋 차단(과금 남용 방어·STEP 793). 캐시 히트는 위에서 이미 반환됨.
  if (blockLLM(req)) return NextResponse.json({ summary: "" }, { status: 429 });

  // PDF 다운로드 → 텍스트 추출
  let text = "";
  try {
    const res = await fetch(pdf, {
      headers: { "User-Agent": UA, Referer: okHkex ? "https://www1.hkexnews.hk/" : "http://www.cninfo.com.cn/" },
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    if (res.ok) {
      const buf = new Uint8Array(await res.arrayBuffer());
      const doc = await getDocumentProxy(buf);
      const { text: t } = await extractText(doc, { mergePages: true });
      text = (t || "").replace(/\s+/g, " ").trim().slice(0, 12000);
    }
  } catch { /* graceful */ }
  // 텍스트 너무 짧으면 = 스캔 PDF or 추출 실패 → 숨김
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
                  'You are an analyst conveying Chinese CNINFO / HKEX disclosures to individual investors — facts only. Summarize only what is actually written in the disclosure, in 2-3 sentences. Rules: (1) No forecasts, outlook, or investment recommendations (buy/sell, target price, "opportunity") — absolutely forbidden. (2) Do not add anything not in the disclosure. (3) Only "what happened" — facts (amounts, ratios, schedules). (4) Keep numbers and currency (yuan ¥ / HK$) exactly as in the source (do not convert). (5) Plain professional English, no filler.',
              },
              {
                role: "user",
                content: `This is the text of a Chinese / Hong Kong disclosure (${nm || "untitled"}). In 2-3 English sentences, summarize the facts of what happened:\n\n${text}`,
              },
            ]
          : [
              {
                role: "system",
                content:
                  "당신은 중국·홍콩 상장사 공시(중국어 또는 영어)를 한국 개인투자자에게 사실만 전달하는 애널리스트입니다. 공시에 실제로 쓰인 내용만 2~3문장 한국어로 요약합니다. 규칙: (1) 예측·전망·투자 추천(사라/팔아라·목표가) 절대 금지 (2) 공시에 없는 내용 추가 금지 (3) \"무슨 일이 일어났는지\" 사실만(금액·비율·일정 등) (4) 숫자·통화(위안 元·홍콩달러 HKD)는 원문 그대로 (5) 반드시 한국어로, 해요체·군더더기 없이.",
              },
              {
                role: "user",
                content: `중국·홍콩 공시(${nm || "제목없음"}) 원문입니다. 무슨 일이 일어났는지 한국어로 2~3문장 사실 요약:\n\n${text}`,
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

  // 후처리1: 한국어 아니면 번역(중국어 출력 방어·JP/VN 전례) — ko 게이팅(en은 영어 그대로 둔다)
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
          max_tokens: 320,
          temperature: 0.2,
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (tr.ok) {
        const t = (((await tr.json()).choices?.[0]?.message?.content) || "").trim();
        if (/[가-힣]/.test(t)) summary = t;
      }
    } catch { /* 유지 */ }
  }
  // 후처리2: 통화 교정 — 중국 위안(숫자 뒤 '원'→'위안'). ko만(en은 원문 통화 그대로).
  if (locale === "ko") summary = summary.replace(/(\d[\d,.]*\s*[조억만천]?\s*)원/g, "$1위안");

  // 저장 실패를 삼키면 같은 공시를 볼 때마다 LLM 재호출 = 조용한 유료 누수(교훈 #31) → 로그+Sentry.
  // 🔴 STEP 828 §1: 출력 가드 — 금지어·언어 검증 실패 시 저장 안 하고 숨김(전역 캐시 오염 방지).
  if (!filingSummaryPasses(summary, locale)) {
    Sentry.captureMessage(`[cn-events/summary] output guard blocked (acc ${acc})`, "warning");
    return NextResponse.json({ summary: "" });
  }
  const { error: upErr } = await sb.from("filing_summaries").upsert(
    { accession: acc, symbol, [col]: summary, model: "gpt-4o-mini" },
    { onConflict: "accession" },
  );
  if (upErr) {
    console.error("[cn-events/summary] filing_summaries upsert failed", { accession: acc, error: upErr.message });
    Sentry.captureMessage(`[cn-events/summary] filing_summaries upsert failed: ${upErr.message}`, "error");
  }
  return NextResponse.json({ summary, cached: false });
}
