import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchStockNews } from '@/lib/stockNews';
import { getDartCorpName } from '@/lib/dart';
import { fetchYahooName } from '@/lib/lensCompute';
import { getJpName } from '@/lib/jpName';
import { getCnName } from '@/lib/cnName';

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
  '위 유형만 있는 헤드라인은 통째로 무시. 서로 다른 기사·회사의 내용을 하나로 잇거나 인과관계로 엮지 말고, 각 사실은 개별 헤드라인에서 확인되는 그대로만 쓰세요(불확실한 연결은 생략). 구체 사건이 하나도 없으면 summary를 빈 문자열("")로 두세요. ' +
  'summary는 반드시 한국어로 씁니다 — 헤드라인이 영어·일본어여도 한국어로 옮겨서. 해요체 2~3문장. 태그도 한국어. 태그는 사건 토픽만(예: 실적·신제품·계약·인사·소송·규제) — 주가·목표주가·전망·투자자관심 태그 금지. ' +
  'JSON만 출력: {"summary":"...","tags":["...","..."]}';

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get('symbol') || '').trim().toUpperCase();
  if (!symbol) return NextResponse.json({ error: 'no_symbol' }, { status: 400 });

  const sb = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: hit } = await sb
    .from('news_briefs').select('summary_ko, tags').eq('symbol', symbol).eq('as_of', today).maybeSingle();
  if (hit?.summary_ko) return NextResponse.json({ summary: hit.summary_ko, tags: hit.tags || [], cached: true });

  // 국가별 뉴스 소스: KR=한글명·ko, JP=일본명·ja, 그 외=영어 (US 코드 그대로·소스만 교체)
  const code6 = symbol.replace(/\.(KS|KQ)$/i, '');
  const krName = /^\d{6}$/.test(code6) ? await getDartCorpName(code6) : null;
  // JP: 일본어 종목명(jp_names·JPX 시드) 우선 → ja 검색이 진짜 일본어 기사를 물게. 없으면 야후 영어명 폴백.
  const jpName = !krName && /\.T$/i.test(symbol) ? ((await getJpName(symbol)) || (await fetchYahooName(symbol))) : null;
  // CN: 중국어 종목명(cn_names) 우선 → HK=번체(zh-HK)·A주=간체(zh-CN) 검색이 진짜 중국어 기사를 물게. 없으면 야후 영어명 폴백.
  const cnName = !krName && !jpName && /\.(HK|SS|SZ)$/i.test(symbol) ? ((await getCnName(symbol)) || (await fetchYahooName(symbol))) : null;
  const cnLocale: 'zh' | 'zh-hk' = /\.HK$/i.test(symbol) ? 'zh-hk' : 'zh';
  const label = krName || jpName || cnName || symbol;
  let news = krName
    ? await fetchStockNews(krName, 8, 'ko')
    : jpName
    ? await fetchStockNews(jpName, 8, 'ja')
    : cnName
    ? await fetchStockNews(cnName, 8, cnLocale)
    : await fetchStockNews(`${symbol} stock`, 8);
  // 로컬 로케일 뉴스가 0건이면 영어로 재시도 (중국 A주 등 로컬 검색 실패 대비 — 요약은 후처리가 한국어로 번역)
  if (!news.length && (krName || jpName || cnName)) {
    news = await fetchStockNews(`${krName || jpName || cnName} stock`, 8, 'en');
  }
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
        { role: 'user', content: `오늘은 ${today}입니다. 아래는 ${label} 관련 뉴스 헤드라인입니다. 규칙: (1) summary·tags 반드시 한국어(영어·일본어 헤드라인이어도 한국어로 옮겨서). (2) 최근(약 2개월 이내) 사건만 — 명시된 과거 연도(예: 2023년)의 실적·수치 등 오래된 내용은 제외. (3) 구체 사건 없으면 summary 빈 문자열.\n\n${headlines}` },
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

  // 후처리1: 요약이 한국어가 아니면 한국어로 번역(야후 영어 상호 → 영어 기사가 잡히는 케이스 방어)
  if (!/[가-힣]/.test(summary)) {
    try {
      const tr = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: '다음을 자연스러운 한국어 뉴스체(해요체)로 옮깁니다. 내용 추가·의견 금지, 사실만.' },
            { role: 'user', content: summary },
          ],
          max_tokens: 320, temperature: 0.2,
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (tr.ok) { const t = (((await tr.json()).choices?.[0]?.message?.content) || '').trim(); if (/[가-힣]/.test(t)) summary = t; }
    } catch { /* 번역 실패 시 원문 유지 */ }
  }

  // 후처리2: 작년 이전 연도(예: 2023) 언급 문장 제거 — 구글이 옛 기사를 최근으로 재순환시키는 것 방어(결정론)
  const yrCut = new Date().getFullYear() - 1;
  summary = summary
    .split(/(?<=[.!?。])\s+/)
    .filter((s) => { const ys = s.match(/20\d\d/g); return !ys || !ys.some((y) => parseInt(y, 10) < yrCut); })
    .join(' ')
    .trim();
  if (!summary) return NextResponse.json({ summary: null, tags: [] });

  await sb.from('news_briefs').upsert(
    { symbol, as_of: today, summary_ko: summary, tags, model: 'gpt-4o-mini' },
    { onConflict: 'symbol,as_of' },
  );
  return NextResponse.json({ summary, tags, cached: false });
}
