import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchStockNews } from '@/lib/stockNews';

export const runtime = 'nodejs';
export const maxDuration = 30;

// R3: 종목 최근 뉴스 요약(사실만) + 중립 토픽 태그. 중대 뉴스 있을 때만(헤드라인 없으면 summary=null → 프론트 숨김).
// 뉴스 = 사실 브리핑이지 '감성 점수'가 아님(방향 태그 금지). 지연 생성 + 종목·날짜 캐시.
const SYSTEM =
  '당신은 종목 관련 최근 뉴스 헤드라인에서 "실제로 발생한 구체 사건·사실"만 골라 한국 개인투자자에게 전달합니다. ' +
  '포함 가능 사건: 실적 발표(매출·이익 숫자·어닝서프라이즈), 신제품/서비스 출시, 계약·수주·파트너십 체결, 인수합병, 임원/이사 교체, 소송·규제 결정, 공시·제출 사실. ' +
  '【절대 금지 — 아래 유형은 헤드라인에 있어도 summary에 한 단어도 포함하지 마세요】: ' +
  '(A) 애널리스트·증권사 의견: 목표가·목표주가·주가 목표·적정가·적정주가·등급·투자의견·상향조정·하향조정·비중확대·매수추천·매도추천·중립. ' +
  '(B) 밸류에이션 판단: 과대평가·과대 평가·저평가·저 평가·공정가치·공정 가치·적정가치·비싸다·싸다·저렴·프리미엄. ' +
  '(C) 가격·방향 전망: 오를 것·내릴 것·상승 전망·하락 전망·강세 전망·~할 것으로 보인다·~으로 예상된다·~이 기대된다. ' +
  '(D) 투자심리·기관포지션 변동만 있는 뉴스: 기관이 주식을 매입/매도했다는 보고 자체(실적/공시 사건 없이 포지션만). ' +
  '위 유형만 있는 헤드라인은 통째로 무시. 구체 사건이 하나도 없으면 summary를 빈 문자열("")로 두세요. ' +
  '해요체 2~3문장. 태그는 사건 토픽만(예: 실적·신제품·계약·인사·소송·규제) — 주가·목표주가·전망·투자자관심 태그 금지. ' +
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
