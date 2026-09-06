import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BROKER_EN_GLOSSARY } from "@/lib/channelReportI18n";

// 콘텐츠 번역 구현(2026-09-06, 채팅 지시) — channel_reports AFTER INSERT 트리거(pg_net, 마이그레이션
// 20260906_channel_reports_translate_trigger.sql)가 부르는 내부 라우트. 사람이 직접 호출하지 않는다
// (백필 스크립트 scripts/backfill-channel-report-translations.ts만 예외 — 같은 비밀 헤더로 호출).
//
// 번역 대상은 자유서술 필드(title·reasons[].title/detail·earnings_summary)뿐이다 — stock_name·broker는
// 여기서 번역하지 않는다(kr_stock_snapshot.name_en 조회로 별도 처리, lib/channelReportI18n.ts).
// verdict도 여기서 절대 손대지 않는다(components/reports/ReportRow.tsx의 고정 사전이 정본).
export const runtime = "nodejs";
export const maxDuration = 60;

type ChannelReportRow = {
  id: number;
  country: string;
  symbol: string | null;
  stock_name: string;
  broker: string;
  source_lang: string;
  verdict: string | null;
  target_price: string | null;
  current_price: string | null;
  title: string | null;
  reasons: { title: string; detail?: string }[] | null;
  earnings_summary: string | null;
};

const VERDICT_FACT: Record<string, string> = {
  상향: "The broker raised its price target for this stock — this is a broker rating action, not the company's own guidance.",
  유지: "The broker maintained its existing price target for this stock — this is a broker rating action.",
  하향: "The broker lowered its price target for this stock — this is a broker rating action.",
  신규제시:
    "The company itself newly issued or updated its own earnings/financial guidance, straight from its SEC filing. This is NOT a broker price-target action — there is no broker and no price target involved. Do not describe it as one.",
};

function buildSystemPrompt(targetLang: "en" | "ko"): string {
  const targetName = targetLang === "en" ? "English" : "Korean";
  return (
    `You translate Korean-channel or US-filing stock report fragments into natural, professional ${targetName} for retail investors. ` +
    "Translate the narrative sentences faithfully. Do NOT summarize, do NOT add opinion, do NOT add or drop any fact. " +
    "🔴 PROPER NOUNS — the exact company/broker names given to you in the 'Fixed names' list below MUST appear verbatim wherever they occur in the text, in either direction. " +
    "Never translate, transliterate, or paraphrase a proper noun (company name, ticker, broker/securities-firm name, product/brand name, institution name) — copy it exactly as given. " +
    "If a proper noun appears in the source text but is NOT in the 'Fixed names' list (e.g. a counterparty or partner company mentioned in passing), still do not translate or transliterate it — copy the original characters/spelling as-is. " +
    "🔴 DO NOT CHANGE THE EVENT — you are given a 'Confirmed fact' about what already happened (e.g. a broker price-target change vs. the company's own guidance update). Your translation must stay consistent with that fact and must never re-characterize it as a different kind of event. " +
    "🔴 NUMBERS — copy every number exactly (only reformat digit grouping/decimal style for the target locale, e.g. '90,000원'→'₩90,000'; never round, drop, or alter a digit). " +
    "Output strict JSON only, matching the exact shape given in the user message (same field names, same array length as the input reasons array)."
  );
}

function buildUserPrompt(params: {
  row: ChannelReportRow;
  targetLang: "en" | "ko";
  fixedStockName: string;
  fixedBrokerName: string;
  payload: { title: string | null; reasons: { title: string; detail?: string }[]; earnings_summary: string | null };
}): string {
  const { row, targetLang, fixedStockName, fixedBrokerName, payload } = params;
  const fact = row.verdict ? VERDICT_FACT[row.verdict] : null;
  const lines = [
    `Target language: ${targetLang === "en" ? "English" : "Korean"}.`,
    `Fixed names (copy verbatim wherever they appear, do not translate): stock = "${fixedStockName}", broker/source = "${fixedBrokerName}".`,
  ];
  if (fact) lines.push(`Confirmed fact about this report: ${fact}`);
  if (row.target_price) lines.push(`Structured field target_price = "${row.target_price}" (do not restate this as a different number).`);
  if (row.current_price) lines.push(`Structured field current_price = "${row.current_price}".`);
  lines.push("Translate the JSON object below. Return ONLY the translated JSON, same shape:");
  lines.push(JSON.stringify(payload));
  return lines.join("\n");
}

// 원문↔번역문 사이에 숫자가 바뀌지 않았는지(콘텐츠 번역 구현 지시 §안전장치) — 단, "31조 4천억원" 같은
// 한국어 조/억/만/천 단위 표기는 영어로 옮기면 "31 trillion 400 billion won"처럼 자릿수 자체가 재배열돼
// 원문 숫자런("31"·"4")과 번역문 숫자런("31"·"400")이 똑같이 옳은 번역이어도 안 맞는다(구현 중 실측
// 확인 — gpt-4o-mini가 정확히 환산했는데도 오탐이 났었다). 그래서 숫자 바로 뒤에 배수 단위(한글
// 조/억/만/천/백/십 또는 영어 trillion/billion/million/thousand/hundred)가 붙는 숫자는 비교 대상에서
// 아예 뺀다(배수 환산은 LLM을 신뢰) — 남는 건 연도·퍼센트·"450,000원"처럼 단위 없이 쓰는 순수 값뿐이라
// 원문·번역문이 정말 같은 값을 말하는지 애매함 없이 비교할 수 있다. 순서는 문장 재배열로 바뀔 수 있어
// 멀티셋(정렬 후) 비교. 오탐이 나도 번역을 안 쓰고 원문을 보여줄 뿐이라(읽기 경로 폴백) 과도하게
// 엄격한 쪽이 과소하게 관대한 쪽보다 안전하다.
const MAGNITUDE_WORD = /^\s*(조|억|만|천|백|십|trillion|billion|million|thousand|hundred)/i;

function extractNumbers(text: string | null | undefined): number[] {
  if (!text) return [];
  const out: number[] = [];
  const re = /\d[\d,]*\.?\d*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const after = text.slice(m.index + m[0].length);
    if (MAGNITUDE_WORD.test(after)) continue; // 배수 단위가 바로 뒤에 붙는 숫자는 비교 제외
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

export async function POST(req: NextRequest) {
  const expected = process.env.CHANNEL_REPORT_TRANSLATE_SECRET;
  const given = req.headers.get("x-translate-secret");
  if (!expected || !given || given !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const reportId = body?.report_id;
  const force = body?.force === true;
  if (!reportId || typeof reportId !== "number") {
    return NextResponse.json({ error: "no_report_id" }, { status: 400 });
  }

  const sb = createAdminClient();
  const { data: row, error: rowErr } = await sb
    .from("channel_reports")
    .select("id, country, symbol, stock_name, broker, source_lang, verdict, target_price, current_price, title, reasons, earnings_summary")
    .eq("id", reportId)
    .maybeSingle();
  if (rowErr || !row) return NextResponse.json({ error: "report_not_found" }, { status: 404 });
  const report = row as ChannelReportRow;

  const targetLang: "en" | "ko" | null =
    report.source_lang === "ko" ? "en" : report.source_lang === "en" ? "ko" : null;
  if (!targetLang) {
    return NextResponse.json({ skipped: true, reason: `unsupported source_lang: ${report.source_lang}` });
  }

  if (!force) {
    const { data: existing } = await sb
      .from("channel_report_translations")
      .select("status")
      .eq("report_id", reportId)
      .eq("target_lang", targetLang)
      .maybeSingle();
    if (existing?.status === "ok") return NextResponse.json({ skipped: true, reason: "already_translated" });
  }

  // 고유명사 고정값 — 번역 대상 문장 안에 등장하는 종목명·증권사명을 이 값 그대로 쓰게 프롬프트에 박아 넣는다.
  // KR 종목: kr_stock_snapshot.name_en 조회(+비상장 증권사 소규모 용어집). US 종목: 로케일 무관 원문 그대로
  // (Victoria's Secret 등 — 번역 방향이 en→ko여도 회사명은 절대 한글 표기로 바꾸지 않는다, 사용자 확정사항).
  let fixedStockName = report.stock_name;
  let fixedBrokerName = report.broker;
  if (report.country === "KR" && targetLang === "en") {
    if (report.symbol) {
      const { data: snap } = await sb.from("kr_stock_snapshot").select("name_en").eq("symbol", report.symbol).maybeSingle();
      if (snap?.name_en) fixedStockName = snap.name_en;
    }
    if (BROKER_EN_GLOSSARY[report.broker]) {
      fixedBrokerName = BROKER_EN_GLOSSARY[report.broker];
    } else {
      const { data: brokerSnap } = await sb.from("kr_stock_snapshot").select("name_en").eq("name", report.broker).maybeSingle();
      if (brokerSnap?.name_en) fixedBrokerName = brokerSnap.name_en;
    }
  }

  const payload = {
    title: report.title,
    reasons: report.reasons ?? [],
    earnings_summary: report.earnings_summary,
  };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    await sb.from("channel_report_translations").upsert(
      { report_id: reportId, target_lang: targetLang, status: "failed", error: "no_openai_key", model: "gpt-4o-mini" },
      { onConflict: "report_id,target_lang" }
    );
    return NextResponse.json({ error: "no_key" }, { status: 500 });
  }

  let translated: { title: string | null; reasons: { title: string; detail?: string }[]; earnings_summary: string | null };
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
          { role: "user", content: buildUserPrompt({ row: report, targetLang, fixedStockName, fixedBrokerName, payload }) },
        ],
        max_tokens: 1500,
      }),
      signal: AbortSignal.timeout(45000),
    });
    if (!res.ok) throw new Error(`openai_${res.status}`);
    const j = await res.json();
    const parsed = JSON.parse(j.choices?.[0]?.message?.content || "{}");
    if (!Array.isArray(parsed.reasons) || parsed.reasons.length !== payload.reasons.length) {
      throw new Error(`reasons_length_mismatch ${parsed.reasons?.length} vs ${payload.reasons.length}`);
    }
    translated = { title: parsed.title ?? null, reasons: parsed.reasons, earnings_summary: parsed.earnings_summary ?? null };
  } catch (e) {
    await sb.from("channel_report_translations").upsert(
      { report_id: reportId, target_lang: targetLang, status: "failed", error: String(e).slice(0, 500), model: "gpt-4o-mini" },
      { onConflict: "report_id,target_lang" }
    );
    return NextResponse.json({ error: "translate_failed", detail: String(e) }, { status: 502 });
  }

  // 숫자 무결성 검증 — 2단계.
  // (1) 하드 게이트: 퍼센트(%)는 조/억/만·trillion/billion 같은 배수 단위나 "Third"→"3분기" 같은
  //     서수 표기 차이의 영향을 안 받는 유일한 숫자 종류라(어느 언어든 그대로), 어긋나면 실제 오역
  //     (자릿수 전치 등)일 가능성이 높다 — 저장하지 않고 실패로 기록한다.
  const pctMismatches: string[] = [];
  const extractPct = (t: string | null | undefined) => (t ?? "").match(/\d+(?:\.\d+)?\s*%/g) ?? [];
  const pctMatch = (a: string | null | undefined, b: string | null | undefined) => {
    const pa = extractPct(a).map((s) => parseFloat(s)).sort((x, y) => x - y);
    const pb = extractPct(b).map((s) => parseFloat(s)).sort((x, y) => x - y);
    return pa.length === pb.length && pa.every((v, i) => Math.abs(v - pb[i]) < 0.005);
  };
  if (!pctMatch(payload.title, translated.title)) pctMismatches.push("title");
  if (!pctMatch(payload.earnings_summary, translated.earnings_summary)) pctMismatches.push("earnings_summary");
  payload.reasons.forEach((r, i) => {
    const tr = translated.reasons[i];
    if (!pctMatch(r.title, tr?.title)) pctMismatches.push(`reasons[${i}].title`);
    if (!pctMatch(r.detail, tr?.detail)) pctMismatches.push(`reasons[${i}].detail`);
  });
  if (pctMismatches.length) {
    await sb.from("channel_report_translations").upsert(
      { report_id: reportId, target_lang: targetLang, status: "failed", error: `percent_mismatch: ${pctMismatches.join(", ")}`, model: "gpt-4o-mini" },
      { onConflict: "report_id,target_lang" }
    );
    return NextResponse.json({ error: "percent_mismatch", fields: pctMismatches }, { status: 422 });
  }

  // (2) 소프트 신호: 그 외 일반 숫자는 배수 단위(위 extractNumbers)로 걸러도 "Third Quarter"→"3분기"
  //     같은 서수 표기 차이가 남아 오탐이 실제로 관찰됐다(구현 중 실측) — 막지 않고 로그만 남긴다
  //     (Vercel 함수 로그에서 사후 확인 가능, 번역 자체는 그대로 저장).
  const softMismatches: string[] = [];
  if (!numbersMatch(payload.title, translated.title)) softMismatches.push("title");
  if (!numbersMatch(payload.earnings_summary, translated.earnings_summary)) softMismatches.push("earnings_summary");
  payload.reasons.forEach((r, i) => {
    const tr = translated.reasons[i];
    if (!numbersMatch(r.title, tr?.title)) softMismatches.push(`reasons[${i}].title`);
    if (!numbersMatch(r.detail, tr?.detail)) softMismatches.push(`reasons[${i}].detail`);
  });
  if (softMismatches.length) {
    console.warn(`[translate-channel-report] soft number mismatch report_id=${reportId} fields=${softMismatches.join(",")}`);
  }

  const { error: upErr } = await sb.from("channel_report_translations").upsert(
    {
      report_id: reportId,
      target_lang: targetLang,
      title: translated.title,
      reasons: translated.reasons,
      earnings_summary: translated.earnings_summary,
      status: "ok",
      error: null,
      model: "gpt-4o-mini",
      translated_at: new Date().toISOString(),
    },
    { onConflict: "report_id,target_lang" }
  );
  if (upErr) return NextResponse.json({ error: "save_failed", detail: upErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, report_id: reportId, target_lang: targetLang });
}
