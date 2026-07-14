import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchStockNews } from '@/lib/stockNews';
import { getDartCorpName } from '@/lib/dart';
import { fetchYahooName } from '@/lib/lensCompute';
import { marketDate } from '@/lib/marketDate';
import { getJpName } from '@/lib/jpName';
import { getCnName } from '@/lib/cnName';
import { KR_SEARCH_ALIAS } from '@/lib/krName';
import { getVnName } from '@/lib/vnName';
import { getGbName } from '@/lib/gbName';
import { pickLocale } from '@/lib/lensCopy';

export const runtime = 'nodejs';
export const maxDuration = 30;

// R3: 종목 최근 뉴스 요약(사실만) + 중립 토픽 태그. 중대 뉴스 있을 때만(헤드라인 없으면 summary=null → 프론트 숨김).
// 뉴스 = 사실 브리핑이지 '감성 점수'가 아님(방향 태그 금지). 지연 생성 + 종목·날짜 캐시.
// Tier3(722): ?lang=en → 영어 프롬프트·summary_en/tags_en 컬럼. 로케일별 캐시 컬럼이 분리돼 서로 안 지운다.
const SYSTEM =
  '당신은 종목 관련 최근 뉴스 헤드라인에서 "실제로 발생한 구체 사건·사실"만 골라 한국 개인투자자에게 전달합니다. ' +
  '포함 가능 사건: 실적 발표(매출·이익 숫자·어닝서프라이즈), 신제품/서비스 출시, 계약·수주·파트너십 체결, 인수합병, 임원/이사 교체, 소송·규제 결정, 공시·제출 사실. ' +
  '【절대 금지 — 아래 유형은 헤드라인에 있어도 summary에 한 단어도 포함하지 마세요】: ' +
  '(A) 애널리스트·증권사 의견: 목표가·목표주가·주가 목표·적정가·적정주가·등급·투자의견·상향조정·하향조정·비중확대·매수추천·매도추천·중립. ' +
  '(B) 밸류에이션 판단: 과대평가·과대 평가·저평가·저 평가·공정가치·공정 가치·적정가치·비싸다·싸다·저렴·프리미엄. ' +
  '(C) 가격·방향 전망: 오를 것·내릴 것·상승 전망·하락 전망·강세 전망·~할 것으로 보인다·~으로 예상된다·~이 기대된다. ' +
  '(D) 투자심리·기관포지션 변동만 있는 뉴스: 기관이 주식을 매입/매도했다는 보고 자체(실적/공시 사건 없이 포지션만). ' +
  '위 유형만 있는 헤드라인은 통째로 무시. 서로 다른 기사·회사의 내용을 하나로 잇거나 인과관계로 엮지 말고, 각 사실은 개별 헤드라인에서 확인되는 그대로만 쓰세요(불확실한 연결은 생략). 구체 사건이 하나도 없으면 summary를 빈 문자열("")로 두세요. ' +
  'summary는 반드시 한국어로 씁니다 — 헤드라인이 영어·일본어·중국어여도 한국어로 옮겨서. 해요체 2~3문장. 태그도 한국어. 태그는 사건 토픽만(예: 실적·신제품·계약·인사·소송·규제) — 주가·목표주가·전망·투자자관심 태그 금지. ' +
  '회사명·제품명은 한국에서 통용되는 표기로 옮기세요(한자·외국어 원명을 그대로 두지 말 것 — 예: 任天堂→닌텐도, 阿里巴巴→알리바바, ソニー→소니). ' +
  '통화·수량 단위는 원문 그대로 유지하세요 — 일본 엔(円)을 "원"으로, 중국 위안(元)을 "원"으로 임의 변환 금지(엔은 "엔", 위안은 "위안"). ' +
  'JSON만 출력: {"summary":"...","tags":["...","..."]}';

// 영어 요약 — ko와 동일한 가드레일(목표가·밸류 판단·방향 전망·포지션만 뉴스 금지). 영어로 생성하므로 후처리1(한국어 번역)·3(원→엔/위안)은 타지 않는다.
const SYSTEM_EN =
  'You pick ONLY concrete events/facts that actually happened from a stock\'s recent news headlines and convey them to individual investors. ' +
  'Eligible events: earnings releases (revenue/profit figures, earnings surprises), new product/service launches, contracts/orders/partnerships signed, M&A, executive/board changes, litigation/regulatory decisions, filing/submission facts. ' +
  '【ABSOLUTELY FORBIDDEN — do not include a single word of the following in summary, even if it is in a headline】: ' +
  '(A) Analyst/brokerage opinions: target price, price target, fair value, rating, investment opinion, upgrade, downgrade, overweight, buy/sell recommendation, neutral. ' +
  '(B) Valuation judgments: overvalued, undervalued, fair value, expensive, cheap, premium. ' +
  '(C) Price/direction forecasts: will rise or fall, upside/downside outlook, bullish/bearish outlook, "expected to," "likely to," "anticipated." ' +
  '(D) News with only investor-sentiment or institutional-position changes: a report that an institution bought or sold shares (position only, without an earnings/filing event). ' +
  'Ignore headlines that contain only the above types. Do not stitch or causally link content from different articles or companies — write each fact exactly as confirmed in its individual headline (omit uncertain links). If there is not a single concrete event, leave summary as an empty string (""). ' +
  'Write summary in English — even if headlines are Korean, Japanese, or Chinese, render them into English. Plain professional English, 2-3 sentences. Tags in English too. Tags = event topics only (e.g., earnings, product, contract, personnel, litigation, regulation) — no stock-price, target-price, outlook, or investor-interest tags. Render company/product names in standard English. Keep currency and units as in the source. ' +
  'Output JSON only: {"summary":"...","tags":["...","..."]}';

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get('symbol') || '').trim().toUpperCase();
  if (!symbol) return NextResponse.json({ error: 'no_symbol' }, { status: 400 });

  const locale = pickLocale(req.nextUrl.searchParams.get('lang')); // 기본 ko · ?lang=en
  const en = locale === 'en';
  const sumCol = en ? 'summary_en' : 'summary_ko'; // 로케일별 캐시 컬럼(서로 독립)
  const tagCol = en ? 'tags_en' : 'tags';
  const sb = createAdminClient();
  const today = marketDate(symbol);

  const { data: hit } = await sb
    .from('news_briefs').select(`${sumCol}, ${tagCol}`).eq('symbol', symbol).eq('as_of', today).maybeSingle();
  const row = hit as Record<string, unknown> | null;
  const cachedSummary = row?.[sumCol] as string | null | undefined;
  if (cachedSummary) return NextResponse.json({ summary: cachedSummary, tags: (row?.[tagCol] as string[] | null) || [], cached: true });

  // 국가별 뉴스 소스: KR=한글명·ko, JP=일본명·ja, 그 외=영어 (US 코드 그대로·소스만 교체)
  const code6 = symbol.replace(/\.(KS|KQ)$/i, '');
  // KR: 공식 상장명이 영문+플랫폼명 충돌(예: NAVER)인 소수 종목은 한글 별칭으로 검색. 그 외는 DART 한글명.
  const krName = /^\d{6}$/.test(code6) ? (KR_SEARCH_ALIAS[code6] || (await getDartCorpName(code6))) : null;
  // JP: 일본어 종목명(jp_names·JPX 시드) 우선 → ja 검색이 진짜 일본어 기사를 물게. 없으면 야후 영어명 폴백.
  const jpName = !krName && /\.T$/i.test(symbol) ? ((await getJpName(symbol)) || (await fetchYahooName(symbol))) : null;
  // CN: 중국어 종목명(cn_names) 우선 → HK=번체(zh-HK)·A주=간체(zh-CN) 검색이 진짜 중국어 기사를 물게. 없으면 야후 영어명 폴백.
  const cnName = !krName && !jpName && /\.(HK|SS|SZ)$/i.test(symbol) ? ((await getCnName(symbol)) || (await fetchYahooName(symbol))) : null;
  const cnLocale: 'zh' | 'zh-hk' = /\.HK$/i.test(symbol) ? 'zh-hk' : 'zh';
  // VN: 베트남어 종목명(vn_names·vnstock HOSE) 우선 → vi 검색이 진짜 베트남어 기사를 물게. 없으면 야후 영문명 폴백.
  const vnName = !krName && !jpName && !cnName && /\.VN$/i.test(symbol) ? ((await getVnName(symbol)) || (await fetchYahooName(symbol))) : null;
  // GB: 클린 영문 종목명(gb_names·Wikipedia FTSE) 우선 → en-GB 검색이 영국 기사를 물게. 없으면 야후 영문명 폴백.
  const gbName = !krName && !jpName && !cnName && !vnName && /\.L$/i.test(symbol) ? ((await getGbName(symbol)) || (await fetchYahooName(symbol))) : null;
  const label = krName || jpName || cnName || vnName || gbName || symbol;
  let news = krName
    ? await fetchStockNews(krName, 8, 'ko')
    : jpName
    ? await fetchStockNews(jpName, 8, 'ja')
    : cnName
    ? await fetchStockNews(cnName, 8, cnLocale)
    : vnName
    ? await fetchStockNews(vnName, 8, 'vi')
    : gbName
    ? await fetchStockNews(gbName, 8, 'en-gb')
    : await fetchStockNews(`${symbol} stock`, 8);
  // 로컬 로케일 뉴스가 0건이면 영어로 재시도 (로컬 검색 실패 대비 — 요약은 후처리가 한국어로 번역)
  if (!news.length && (krName || jpName || cnName || vnName || gbName)) {
    news = await fetchStockNews(`${krName || jpName || cnName || vnName || gbName} stock`, 8, 'en');
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
        { role: 'system', content: en ? SYSTEM_EN : SYSTEM },
        {
          role: 'user',
          content: en
            ? `Today is ${today}. Below are news headlines for ${label}. Rules: (1) summary and tags must be in English (render Korean/Japanese/Chinese headlines into English). (2) Only recent events (within ~2 months) — exclude old content with explicit past years (e.g., 2023) such as stale earnings/figures. (3) If there is no concrete event, leave summary empty.\n\n${headlines}`
            : `오늘은 ${today}입니다. 아래는 ${label} 관련 뉴스 헤드라인입니다. 규칙: (1) summary·tags 반드시 한국어(영어·일본어 헤드라인이어도 한국어로 옮겨서). (2) 최근(약 2개월 이내) 사건만 — 명시된 과거 연도(예: 2023년)의 실적·수치 등 오래된 내용은 제외. (3) 구체 사건 없으면 summary 빈 문자열.\n\n${headlines}`,
        },
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

  // 후처리1(ko 전용): 요약이 한국어가 아니면 한국어로 번역(야후 영어 상호 → 영어 기사가 잡히는 케이스 방어)
  // en은 영어 프롬프트라 이미 영어 — 여기 태우면 영어 요약이 한국어로 재번역돼 /en이 깨진다.
  if (!en && !/[가-힣]/.test(summary)) {
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

  // 후처리3(ko 전용): JP/CN 브리핑 통화 단위 교정(결정론) — 일본·중국 금액은 엔·위안인데 LLM이 '원'으로 오표기하는 경향.
  // 숫자(+조/억/만/천 단위) 바로 뒤의 '원'만 치환 → '원가·원자재·원인' 등 일반어(앞이 숫자가 아님)는 건드리지 않음. KR 경로는 이 블록을 타지 않음.
  // en 요약엔 '원'이 없으니 무의미 — 게이팅으로 영어 문장 훼손 가능성 자체를 차단.
  if (!en) {
    if (jpName) summary = summary.replace(/(\d[\d,.]*\s*[조억만천]?\s*)원/g, '$1엔');
    else if (cnName) summary = summary.replace(/(\d[\d,.]*\s*[조억만천]?\s*)원/g, '$1위안');
    else if (vnName) summary = summary.replace(/(\d[\d,.]*\s*[조억만천]?\s*)원/g, '$1동');
    else if (gbName) summary = summary.replace(/(\d[\d,.]*\s*[조억만천]?\s*)원/g, '$1파운드');
  }

  // 해당 로케일 컬럼만 payload에 담는다 → Supabase upsert는 준 키만 UPDATE하므로 반대 로케일 캐시 무손상.
  const { error: upErr } = await sb.from('news_briefs').upsert(
    { symbol, as_of: today, [sumCol]: summary, [tagCol]: tags, model: 'gpt-4o-mini' },
    { onConflict: 'symbol,as_of' },
  );
  // 캐시 쓰기 실패를 삼키면 매 조회마다 유료 LLM 재생성(조용한 과금 누수) — 응답은 살리되 로그는 남긴다.
  if (upErr) console.error('[news-brief] cache upsert failed', { symbol, sumCol, error: upErr.message });
  return NextResponse.json({ summary, tags, cached: false });
}
