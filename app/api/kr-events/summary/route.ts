import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchDartDocText } from '@/lib/dartSummary';

export const runtime = 'nodejs';
export const maxDuration = 30;

// R1-KR: DART 공시(rcept_no) 원문 → 한국어 '사실' 요약. 전역 캐시(filing_summaries, accession=rcept_no).
// R1-US와 같은 파이프라인 — 소스만 EDGAR→DART. 예측·판정 금지(사실만).
export async function GET(req: NextRequest) {
  const rcept = (req.nextUrl.searchParams.get('rcept') || '').trim();
  const symbol = (req.nextUrl.searchParams.get('symbol') || '').trim();
  const nm = req.nextUrl.searchParams.get('nm') || '';
  if (!/^\d{14}$/.test(rcept)) return NextResponse.json({ error: 'bad rcept' }, { status: 400 });

  const sb = createAdminClient();
  const { data: hit } = await sb
    .from('filing_summaries').select('summary_ko').eq('accession', rcept).maybeSingle();
  if (hit?.summary_ko) return NextResponse.json({ summary: hit.summary_ko, cached: true });

  const text = await fetchDartDocText(rcept);
  if (!text || text.length < 80) return NextResponse.json({ error: 'no extractable text' }, { status: 502 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY missing' }, { status: 500 });
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
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

  await sb.from('filing_summaries').upsert(
    { accession: rcept, symbol, summary_ko: summary, model: 'gpt-4o-mini' },
    { onConflict: 'accession' },
  );
  return NextResponse.json({ summary, cached: false });
}
