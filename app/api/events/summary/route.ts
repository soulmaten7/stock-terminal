import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchFilingText } from '@/lib/eightKSummary';

export const runtime = 'nodejs';
export const maxDuration = 30;

// R1: 특정 8-K(accession)의 한국어 '사실' 요약. 전역 캐시(filing_summaries) — 공시당 1회 생성·전원 공유.
// 지연 생성(유저가 볼 때 호출) → 첫 요청만 LLM, 이후 캐시. LLM = 원문을 읽어 사실만(예측·판정 금지).
// link는 반드시 SEC Archives URL만(클라이언트 입력 SSRF 방지).
const SEC_ARCHIVE = /^https:\/\/www\.sec\.gov\/Archives\/edgar\/data\/(\d+)\/([^/]+)\/(.+)$/;

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get('symbol') || '').toUpperCase();
  const link = req.nextUrl.searchParams.get('link') || '';
  const items = req.nextUrl.searchParams.get('items') || '';
  const m = link.match(SEC_ARCHIVE);
  if (!symbol || !m) {
    return NextResponse.json({ error: 'symbol and valid SEC Archives link required' }, { status: 400 });
  }
  const [, cik, acc, doc] = m;

  const sb = createAdminClient();

  // 1) 전역 캐시
  const { data: hit } = await sb
    .from('filing_summaries').select('summary_ko').eq('accession', acc).maybeSingle();
  if (hit?.summary_ko) return NextResponse.json({ summary: hit.summary_ko, cached: true });

  // 2) 원문 텍스트(본문 + 필요 시 EX-99.x)
  const text = await fetchFilingText(Number(cik), acc, doc);
  if (!text || text.length < 100) {
    return NextResponse.json({ error: 'no extractable text' }, { status: 502 });
  }

  // 3) LLM 요약 (사실만·가드레일)
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
            '당신은 미국 SEC 공시를 한국 개인투자자에게 사실만 전달하는 애널리스트입니다. 원문에 실제로 쓰인 내용만 2~3문장으로 요약합니다. 규칙: (1) 예측·전망·투자 추천(사라/팔아라·목표가·"기회") 절대 금지 (2) 원문에 없는 내용 추가 금지 (3) "무슨 일이 일어났는지" 사실만 (4) 숫자는 원문 그대로 (5) 해요체, 군더더기 없이.',
        },
        {
          role: 'user',
          content: `8-K 공시 원문(item ${items || '?'})입니다. 무슨 일이 일어났는지 한국어로 2~3문장 사실 요약:\n\n${text}`,
        },
      ],
      max_tokens: 300,
      temperature: 0.2,
    }),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) return NextResponse.json({ error: `llm http ${res.status}` }, { status: 502 });
  const j = await res.json();
  const summary = (j.choices?.[0]?.message?.content || '').trim();
  if (!summary) return NextResponse.json({ error: 'llm empty' }, { status: 502 });

  // 4) 캐시 저장(전역·영구)
  await sb.from('filing_summaries').upsert(
    { accession: acc, symbol, summary_ko: summary, model: 'gpt-4o-mini' },
    { onConflict: 'accession' },
  );
  return NextResponse.json({ summary, cached: false });
}
