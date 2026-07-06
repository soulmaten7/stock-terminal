import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchStockNews } from '@/lib/stockNews';

export const runtime = 'nodejs';
export const maxDuration = 30;

// R3: 종목 최근 뉴스 요약(사실만) + 중립 토픽 태그. 중대 뉴스 있을 때만(헤드라인 없으면 summary=null → 프론트 숨김).
// 뉴스 = 사실 브리핑이지 '감성 점수'가 아님(방향 태그 금지). 지연 생성 + 종목·날짜 캐시.
const SYSTEM =
  '당신은 종목 관련 최근 뉴스 헤드라인을 한국 개인투자자에게 사실만 전달합니다. 주어진 헤드라인에서 실제로 일어난 일·주제를 2~3문장으로 요약하고, 중립 토픽 태그 2~4개를 뽑습니다. ' +
  '규칙: 예측·투자추천·감정(강세/약세) 점수 금지, 헤드라인에 없는 내용 추가 금지, 방향 태그 금지(신제품·공급계약·규제·실적·소송 같은 사실 토픽만). 해요체. ' +
  'JSON만 출력: {"summary":"...","tags":["...","..."]}';

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get('symbol') || '').trim().toUpperCase();
  if (!symbol) return NextResponse.json({ error: 'no_symbol' }, { status: 400 });

  const sb = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: hit } = await sb
    .from('news_briefs').select('summary_ko, tags').eq('symbol', symbol).eq('as_of', today).maybeSingle();
  if (hit?.summary_ko) return NextResponse.json({ summary: hit.summary_ko, tags: hit.tags || [], cached: true });

  const news = await fetchStockNews(`${symbol} stock`, 8);
  if (!news.length) return NextResponse.json({ summary: null, tags: [] });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'no_key' }, { status: 500 });
  const headlines = news.map((n, i) => `${i + 1}. ${n.title}`).join('\n');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: `${symbol} 최근 뉴스 헤드라인:\n${headlines}` },
      ],
      max_tokens: 320,
      temperature: 0.2,
    }),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) return NextResponse.json({ error: `llm ${res.status}` }, { status: 502 });
  const j = await res.json();
  let summary = ''; let tags: string[] = [];
  try {
    const p = JSON.parse(j.choices?.[0]?.message?.content || '{}');
    summary = (p.summary || '').trim();
    tags = Array.isArray(p.tags) ? p.tags.slice(0, 4).map((t: unknown) => String(t)) : [];
  } catch { /* 파싱 실패 = 요약 없음 */ }
  if (!summary) return NextResponse.json({ summary: null, tags: [] });

  await sb.from('news_briefs').upsert(
    { symbol, as_of: today, summary_ko: summary, tags, model: 'gpt-4o-mini' },
    { onConflict: 'symbol,as_of' },
  );
  return NextResponse.json({ summary, tags, cached: false });
}
