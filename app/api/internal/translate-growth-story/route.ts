import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// 성장스토리 번역 구현(2026-09-07, 채팅 지시) — channel_growth_stories AFTER INSERT OR UPDATE
// 트리거(pg_net, 마이그레이션 20260907d)가 부르는 내부 라우트. 사람이 직접 호출하지 않는다.
// translate-channel-report/route.ts와 같은 원칙·같은 숫자 무결성 검증(하드: %, 소프트: 그 외
// 숫자)을 그대로 쓰되, 이 유형엔 broker·verdict·target_price가 없어 그 관련 로직은 뺐다.
export const runtime = "nodejs";
export const maxDuration = 60;

type GrowthStoryRow = {
  id: number;
  country: string;
  symbol: string;
  stock_name: string;
  source_lang: string;
  intro: string;
  challenge: string;
  response: string;
  summary: string;
};

function buildSystemPrompt(targetLang: "en" | "ko"): string {
  const targetName = targetLang === "en" ? "English" : "Korean";
  return (
    `You translate a stock channel's "company growth story" (what the company does, an industry-wide ` +
    `challenge it faces, and how it responded — sourced from the company's own annual report/10-K) into ` +
    `natural, professional ${targetName} for retail investors. ` +
    "Translate the narrative sentences faithfully. Do NOT summarize, do NOT add opinion, do NOT add or drop any fact. " +
    "🔴 PROPER NOUNS — the exact company name given to you in 'Fixed name' below MUST appear verbatim wherever it occurs, in either direction. " +
    "Never translate, transliterate, or paraphrase a proper noun (company name, subsidiary, brand, product name) — copy it exactly as given, including any other company/brand name mentioned in passing that is not in the fixed-name list. " +
    "🔴 NUMBERS — copy every number exactly (only reformat digit grouping/decimal style for the target locale; never round, drop, or alter a digit). " +
    "Output strict JSON only, matching the exact shape given in the user message (same field names)."
  );
}

function buildUserPrompt(params: {
  targetLang: "en" | "ko";
  fixedStockName: string;
  payload: { intro: string; challenge: string; response: string; summary: string };
}): string {
  const { targetLang, fixedStockName, payload } = params;
  const lines = [
    `Target language: ${targetLang === "en" ? "English" : "Korean"}.`,
    `Fixed name (copy verbatim wherever it appears, do not translate): company = "${fixedStockName}".`,
    "Translate the JSON object below. Return ONLY the translated JSON, same shape:",
    JSON.stringify(payload),
  ];
  return lines.join("\n");
}

// 숫자 무결성 검증 — translate-channel-report/route.ts와 동일 원리·동일 임계값(그 파일 주석 참고:
// 배수 단위가 붙는 숫자는 조/억/trillion/billion 환산 재배열로 오탐이 나 비교 대상에서 뺀다).
const MAGNITUDE_WORD = /^\s*(조|억|만|천|백|십|trillion|billion|million|thousand|hundred)/i;

function extractNumbers(text: string | null | undefined): number[] {
  if (!text) return [];
  const out: number[] = [];
  const re = /\d[\d,]*\.?\d*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const after = text.slice(m.index + m[0].length);
    if (MAGNITUDE_WORD.test(after)) continue;
    const n = parseFloat(m[0].replace(/,/g, ""));
    if (!Number.isNaN(n)) out.push(n);
  }
  return out;
}

function numbersMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = extractNumbers(a).sort((x, y) => x - y);
  const nb = extractNumbers(b).sort((x, y) => x - y);
  if (na.length !== nb.length) return false;
  return na.every((v, i) => Math.abs(v - nb[i]) < 0.005);
}

function extractPct(t: string | null | undefined) {
  return (t ?? "").match(/\d+(?:\.\d+)?\s*%/g) ?? [];
}

function pctMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const pa = extractPct(a).map((s) => parseFloat(s)).sort((x, y) => x - y);
  const pb = extractPct(b).map((s) => parseFloat(s)).sort((x, y) => x - y);
  return pa.length === pb.length && pa.every((v, i) => Math.abs(v - pb[i]) < 0.005);
}

export async function POST(req: NextRequest) {
  const expected = process.env.CHANNEL_GROWTH_STORY_TRANSLATE_SECRET;
  const given = req.headers.get("x-translate-secret");
  if (!expected || !given || given !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const storyId = body?.story_id;
  if (!storyId || typeof storyId !== "number") {
    return NextResponse.json({ error: "no_story_id" }, { status: 400 });
  }

  const sb = createAdminClient();
  const { data: row, error: rowErr } = await sb
    .from("channel_growth_stories")
    .select("id, country, symbol, stock_name, source_lang, intro, challenge, response, summary")
    .eq("id", storyId)
    .maybeSingle();
  if (rowErr || !row) return NextResponse.json({ error: "story_not_found" }, { status: 404 });
  const story = row as GrowthStoryRow;

  const targetLang: "en" | "ko" | null =
    story.source_lang === "ko" ? "en" : story.source_lang === "en" ? "ko" : null;
  if (!targetLang) {
    return NextResponse.json({ skipped: true, reason: `unsupported source_lang: ${story.source_lang}` });
  }

  // 🔴 channel_reports 쪽과 달리 "이미 번역 있으면 skip" 분기를 두지 않는다 — 이 트리거는
  // INSERT뿐 아니라 UPDATE(재제작 갱신)에서도 매번 불려서, skip하면 옛 번역이 새 원문 옆에
  // 그대로 남는다. 매 호출마다 무조건 재번역해 upsert한다.

  // 고유명사 고정값 — KR→EN만 kr_stock_snapshot.name_en 조회(channel_reports와 동일 원칙).
  // US→KR은 회사명을 그대로 유지(번역·음역 금지, 기존 확정 원칙).
  let fixedStockName = story.stock_name;
  if (story.country === "KR" && targetLang === "en") {
    const { data: snap } = await sb.from("kr_stock_snapshot").select("name_en").eq("symbol", story.symbol).maybeSingle();
    if (snap?.name_en) fixedStockName = snap.name_en;
  }

  const payload = {
    intro: story.intro,
    challenge: story.challenge,
    response: story.response,
    summary: story.summary,
  };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    await sb.from("channel_growth_story_translations").upsert(
      { story_id: storyId, target_lang: targetLang, status: "failed", error: "no_openai_key", model: "gpt-4o-mini" },
      { onConflict: "story_id,target_lang" }
    );
    return NextResponse.json({ error: "no_key" }, { status: 500 });
  }

  let translated: { intro: string; challenge: string; response: string; summary: string };
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        temperature: 0.2,
        messages: [
          { role: "system", content: buildSystemPrompt(targetLang) },
          { role: "user", content: buildUserPrompt({ targetLang, fixedStockName, payload }) },
        ],
        max_tokens: 2000,
      }),
      signal: AbortSignal.timeout(45000),
    });
    if (!res.ok) throw new Error(`openai_${res.status}`);
    const j = await res.json();
    const parsed = JSON.parse(j.choices?.[0]?.message?.content || "{}");
    if (!parsed.intro || !parsed.challenge || !parsed.response || !parsed.summary) {
      throw new Error("missing_fields_in_translation");
    }
    translated = { intro: parsed.intro, challenge: parsed.challenge, response: parsed.response, summary: parsed.summary };
  } catch (e) {
    await sb.from("channel_growth_story_translations").upsert(
      { story_id: storyId, target_lang: targetLang, status: "failed", error: String(e).slice(0, 500), model: "gpt-4o-mini" },
      { onConflict: "story_id,target_lang" }
    );
    return NextResponse.json({ error: "translate_failed", detail: String(e) }, { status: 502 });
  }

  // (1) 하드 게이트: 퍼센트 불일치는 실패로 기록(저장 안 함, 원문 폴백).
  const pctMismatches: string[] = [];
  (["intro", "challenge", "response", "summary"] as const).forEach((f) => {
    if (!pctMatch(payload[f], translated[f])) pctMismatches.push(f);
  });
  if (pctMismatches.length) {
    await sb.from("channel_growth_story_translations").upsert(
      { story_id: storyId, target_lang: targetLang, status: "failed", error: `percent_mismatch: ${pctMismatches.join(", ")}`, model: "gpt-4o-mini" },
      { onConflict: "story_id,target_lang" }
    );
    return NextResponse.json({ error: "percent_mismatch", fields: pctMismatches }, { status: 422 });
  }

  // (2) 소프트 신호: 그 외 숫자는 로그만(서수 표기 차이 등으로 오탐 가능 — 저장은 그대로 진행).
  const softMismatches: string[] = [];
  (["intro", "challenge", "response", "summary"] as const).forEach((f) => {
    if (!numbersMatch(payload[f], translated[f])) softMismatches.push(f);
  });
  if (softMismatches.length) {
    console.warn(`[translate-growth-story] soft number mismatch story_id=${storyId} fields=${softMismatches.join(",")}`);
  }

  const { error: upErr } = await sb.from("channel_growth_story_translations").upsert(
    {
      story_id: storyId,
      target_lang: targetLang,
      intro: translated.intro,
      challenge: translated.challenge,
      response: translated.response,
      summary: translated.summary,
      status: "ok",
      error: null,
      model: "gpt-4o-mini",
      translated_at: new Date().toISOString(),
    },
    { onConflict: "story_id,target_lang" }
  );
  if (upErr) return NextResponse.json({ error: "save_failed", detail: upErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, story_id: storyId, target_lang: targetLang });
}
