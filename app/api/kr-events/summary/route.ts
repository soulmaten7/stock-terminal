import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchDartDocText } from '@/lib/dartSummary';
import { blockLLM } from '@/lib/rateLimit';
import { sanitizeFilingLabel, filingSummaryPasses } from '@/lib/filingGuard';
import * as Sentry from '@sentry/nextjs';

export const runtime = 'nodejs';
export const maxDuration = 30;

// R1-KR: DART 공시(rcept_no) 원문 → 한국어 '사실' 요약. 전역 캐시(filing_summaries, accession=rcept_no).
// R1-US와 같은 파이프라인 — 소스만 EDGAR→DART. 예측·판정 금지(사실만).
export async function GET(req: NextRequest) {
  const rcept = (req.nextUrl.searchParams.get('rcept') || '').trim();
  const symbol = (req.nextUrl.searchParams.get('symbol') || '').trim();
  const nm = sanitizeFilingLabel(req.nextUrl.searchParams.get('nm')); // STEP 828 §1: 클라 라벨 정화(인젝션 차단)
  const locale = req.nextUrl.searchParams.get('lang') === 'en' ? 'en' : 'ko';
  const col = locale === 'en' ? 'summary_en' : 'summary_ko';
  if (!/^\d{14}$/.test(rcept)) return NextResponse.json({ error: 'bad rcept' }, { status: 400 });

  const sb = createAdminClient();
  const { data: hit } = await sb
    .from('filing_summaries').select(col).eq('accession', rcept).maybeSingle();
  const cachedText = (hit as Record<string, string> | null)?.[col];
  if (cachedText) return NextResponse.json({ summary: cachedText, cached: true });

  // 캐시 미스 = 새 유료 LLM 생성. 봇·레이트리밋 차단(과금 남용 방어·STEP 793). 캐시 히트는 위에서 이미 반환됨.
  if (blockLLM(req)) return NextResponse.json({ summary: '' }, { status: 429 });

  const text = await fetchDartDocText(rcept);
  if (!text || text.length < 80) return NextResponse.json({ error: 'no extractable text' }, { status: 502 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY missing' }, { status: 500 });
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages:
        locale === 'en'
          ? [
              {
                role: 'system',
                content:
                  'You are an analyst conveying Korean DART disclosures to individual investors — facts only. Summarize only what is actually written in the filing, in 2-3 sentences. Rules: (1) No forecasts, outlook, or investment recommendations (buy/sell, target price, "opportunity") — absolutely forbidden. (2) Do not add anything not in the filing. (3) Only "what happened" — facts (amounts, ratios, schedules). (4) Keep numbers and currency (Korean won ₩) exactly as in the source (do not convert). (5) Plain professional English, no filler.',
              },
              {
                role: 'user',
                content: `This is the text of a Korean DART disclosure (${nm || 'untitled'}). In 2-3 English sentences, summarize the facts of what happened:\n\n${text}`,
              },
            ]
          : [
              {
                role: 'system',
                content:
                  '당신은 한국 DART 공시를 개인투자자에게 사실만 전달하는 애널리스트입니다. 원문에 실제로 쓰인 내용만 2~3문장으로 요약합니다. 규칙: (1) 예측·전망·투자 추천(사라/팔아라·목표가) 절대 금지 (2) 원문에 없는 내용 추가 금지 (3) "무슨 일이 일어났는지" 사실만(금액·비율·일정 등) (4) 숫자는 원문 그대로 (5) 해요체·군더더기 없이.',
              },
              {
                role: 'user',
                content: `DART 공시(${nm || '제목없음'}) 원문입니다. 무슨 일이 일어났는지 한국어로 2~3문장 사실 요약:\n\n${text}`,
              },
            ],
      max_tokens: 300,
      temperature: 0.2,
    }),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) return NextResponse.json({ error: `llm ${res.status}` }, { status: 502 });
  const j = await res.json();
  const summary = (j.choices?.[0]?.message?.content || '').trim();
  if (!summary) return NextResponse.json({ error: 'llm empty' }, { status: 502 });

  // 🔴 STEP 828 §1: 출력 가드 — 금지어(추천·매수 등)·언어 검증 실패 시 저장하지 않고 숨긴다(전역 캐시 오염 방지·지어내지 않음).
  if (!filingSummaryPasses(summary, locale)) {
    Sentry.captureMessage(`[kr-events/summary] output guard blocked (rcept ${rcept})`, 'warning');
    return NextResponse.json({ summary: '' });
  }

  // 저장 실패를 삼키면 같은 공시를 볼 때마다 LLM 재호출 = 조용한 유료 누수(교훈 #31) → 로그+Sentry.
  const { error: upErr } = await sb.from('filing_summaries').upsert(
    { accession: rcept, symbol, [col]: summary, model: 'gpt-4o-mini' },
    { onConflict: 'accession' },
  );
  if (upErr) {
    console.error('[kr-events/summary] filing_summaries upsert failed', { accession: rcept, error: upErr.message });
    Sentry.captureMessage(`[kr-events/summary] filing_summaries upsert failed: ${upErr.message}`, 'error');
  }
  return NextResponse.json({ summary, cached: false });
}
