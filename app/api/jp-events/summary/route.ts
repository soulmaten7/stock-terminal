import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { unzipSync } from "fflate";
import { blockLLM } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 45;

// R1-JP: EDINET 공시(docID) 원문(CSV) → 일본어 본문 추출 → 한국어 '사실' 요약.
// R1-US(EDGAR)·R1-KR(DART)의 JP 짝. 전역 캐시(filing_summaries, accession=docID). 예측·판정 금지.
const BASE = "https://api.edinet-fsa.go.jp/api/v2";

// EDINET CSV(type=5) zip → 서술형 일본어 본문만 뽑아 이어붙임(캡 12k).
// CSV = 탭구분·UTF-16LE(BOM). 값(値)은 마지막 열. 긴 일본어 문장만 추림(숫자/코드/짧은값 제외).
function extractJpText(zip: Uint8Array): string {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(zip);
  } catch {
    return "";
  }
  let text = "";
  for (const [name, bytes] of Object.entries(files)) {
    if (!/\.csv$/i.test(name)) continue;
    let csv = "";
    try {
      // BOM 판별: FF FE = UTF-16LE, 아니면 UTF-8.
      const enc = bytes[0] === 0xff && bytes[1] === 0xfe ? "utf-16le" : "utf-8";
      csv = new TextDecoder(enc).decode(bytes);
    } catch {
      continue;
    }
    for (const line of csv.split(/\r?\n/)) {
      const cols = line.split("\t");
      let val = (cols[cols.length - 1] || "").trim().replace(/^"|"$/g, "");
      val = val.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); // HTML 태그 제거
      // 서술형 일본어: 30자↑ + 가나/한자 포함 + 순수 숫자/날짜 아님.
      if (val.length > 30 && /[぀-ヿ一-鿿]/.test(val) && !/^[\d,.\-\/年月日]+$/.test(val)) {
        text += val + "\n";
      }
      if (text.length > 12000) break;
    }
    if (text.length > 12000) break;
  }
  return text.slice(0, 12000);
}

export async function GET(req: NextRequest) {
  const docid = (req.nextUrl.searchParams.get("docid") || "").trim();
  const symbol = (req.nextUrl.searchParams.get("symbol") || "").trim();
  const nm = req.nextUrl.searchParams.get("nm") || "";
  const locale = req.nextUrl.searchParams.get("lang") === "en" ? "en" : "ko";
  const col = locale === "en" ? "summary_en" : "summary_ko";
  if (!/^[A-Za-z0-9]+$/.test(docid)) return NextResponse.json({ error: "bad docid" }, { status: 400 });

  const sb = createAdminClient();
  const { data: hit } = await sb
    .from("filing_summaries").select(col).eq("accession", docid).maybeSingle();
  const cachedText = (hit as Record<string, string> | null)?.[col];
  if (cachedText) return NextResponse.json({ summary: cachedText, cached: true });

  // 캐시 미스 = 새 유료 LLM 생성. 봇·레이트리밋 차단(과금 남용 방어·STEP 793). 캐시 히트는 위에서 이미 반환됨.
  if (blockLLM(req)) return NextResponse.json({ summary: "" }, { status: 429 });

  const key = (process.env.EDINET_API_KEY || "").trim();
  if (!key) return NextResponse.json({ error: "no EDINET key" }, { status: 500 });

  // 원문 CSV(type=5) 다운로드 → 본문 추출.
  let text = "";
  try {
    const res = await fetch(`${BASE}/documents/${docid}?type=5&Subscription-Key=${encodeURIComponent(key)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });
    if (res.ok) text = extractJpText(new Uint8Array(await res.arrayBuffer()));
  } catch {
    /* fall through */
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
                  'You are an analyst conveying Japanese EDINET disclosures to individual investors — facts only. Summarize only what is actually written in the filing, in 2-3 sentences. Rules: (1) No forecasts, outlook, or investment recommendations (buy/sell, target price, "opportunity") — absolutely forbidden. (2) Do not add anything not in the filing. (3) Only "what happened" — facts (amounts, ratios, schedules). (4) Keep numbers and currency (Japanese yen ¥) exactly as in the source (do not convert). (5) Plain professional English, no filler.',
              },
              {
                role: "user",
                content: `This is the text of a Japanese EDINET disclosure (${nm || "untitled"}). In 2-3 English sentences, summarize the facts of what happened:\n\n${text}`,
              },
            ]
          : [
              {
                role: "system",
                content:
                  "당신은 일본 EDINET 공시(일본어)를 한국 개인투자자에게 사실만 전달하는 애널리스트입니다. 원문에 실제로 쓰인 내용만 2~3문장 한국어로 요약합니다. 규칙: (1) 예측·전망·투자 추천(사라/팔아라·목표가) 절대 금지 (2) 원문에 없는 내용 추가 금지 (3) \"무슨 일이 일어났는지\" 사실만(금액·비율·일정 등) (4) 숫자는 원문 그대로 (5) 일본 고유명사는 자연스러운 한국어로 (6) 해요체·군더더기 없이.",
              },
              {
                role: "user",
                content: `EDINET 공시(${nm || "제목없음"}) 원문(일본어)입니다. 무슨 일이 일어났는지 한국어로 2~3문장 사실 요약:\n\n${text}`,
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
    { accession: docid, symbol, [col]: summary, model: "gpt-4o-mini" },
    { onConflict: "accession" },
  );
  return NextResponse.json({ summary, cached: false });
}
