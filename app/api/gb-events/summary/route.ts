import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
  // SSRF 방지 — Investegate 공시 상세 URL만 허용.
  if (!/^https:\/\/www\.investegate\.co\.uk\/announcement\/[a-z]+\/[^?#"']+\/\d+$/i.test(url)) {
    return NextResponse.json({ error: "bad url" }, { status: 400 });
  }
  const id = (url.match(/\/(\d+)$/) || [])[1] || "";
  const acc = "GB" + id;

  const sb = createAdminClient();
  const { data: hit } = await sb.from("filing_summaries").select("summary_ko").eq("accession", acc).maybeSingle();
  if (hit?.summary_ko) return NextResponse.json({ summary: hit.summary_ko, cached: true });

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
      messages: [
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

  await sb.from("filing_summaries").upsert(
    { accession: acc, symbol, summary_ko: summary, model: "gpt-4o-mini" },
    { onConflict: "accession" },
  );
  return NextResponse.json({ summary, cached: false });
}
