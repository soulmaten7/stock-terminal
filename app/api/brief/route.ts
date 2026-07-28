import { NextRequest, NextResponse } from 'next/server';
import { computeSymbolLenses } from '@/lib/lensCompute';
import { fetchMaterial8K } from '@/lib/eightK';
import { fetchDartMaterial } from '@/lib/dartEvents';
import { createAdminClient } from '@/lib/supabase/admin';
import { marketDate } from '@/lib/marketDate';
import { pickLocale, type Locale } from '@/lib/lensCopy';
import { blockLLM } from '@/lib/rateLimit';
import { isActiveSymbol } from '@/lib/activeMarkets';

export const runtime = 'nodejs';
export const maxDuration = 30;

// R2: 종목 브리핑. 우리 결정론 렌즈 판정 + 최근 공시 사실만 근거로 LLM이 '핵심 긴장 + 지켜볼 것'을 1문단.
// 예측·판정 금지(가드레일). 지연 생성 + 종목·날짜 캐시(하루 1회 재생성 = 렌즈 주기와 일치).
// Tier3(721): ?lang=en → 영어 프롬프트·영어 facts·brief_en 컬럼. 로케일별 캐시 컬럼이 분리돼 서로 안 지운다.
const H: Record<Locale, Record<string, string>> = {
  ko: { short: '단기', mid: '중기', long: '장기' },
  en: { short: 'Short', mid: 'Mid', long: 'Long' },
};

const BRIEF_SYSTEM =
  '당신은 한국 개인투자자에게 종목을 브리핑하는 애널리스트입니다. 주어진 "검증된 기법 판정"과 "최근 공시 사실"만 근거로 3~4문장 한국어 브리핑을 씁니다.\n' +
  '규칙(반드시): (1) 예측·전망·투자 추천 절대 금지 — "오른다/내린다·사라/팔아라·목표가·기회·지금이 타이밍" 등 금지. ' +
  '(2) 핵심은 ⓐ 시간축·기법 간 "긴장(엇갈림)"을 짚고 ⓑ "지켜볼 것"(관찰 가능한 촉매·사실)을 가리키는 것. ' +
  '(3) 주어진 facts에 없는 내용·숫자 추가 금지. "최근 중대 공시"는 이미 접수된 과거 사실이니 "예정"이라 쓰지 말 것. (4) 방향 판단은 하지 않는 태도 유지(문구를 매번 붙이진 말 것). (5) 해요체·군더더기 없이·한 문단.\n' +
  '예시 톤: "○○는 단기 과열, 중기·장기는 강세로 시간축마다 결이 갈려요. 재무·품질은 우호적인데 밸류는 비싼 편이라 성장에 프리미엄이 붙은 그림이에요. 최근 실적 발표로 재무 렌즈 근거가 갱신됐을 수 있으니, 과열 해소와 다음 실적을 지켜볼 만해요."';

// 영어 브리핑 — ko와 동일한 가드레일(예측·추천 금지 / 긴장 + 지켜볼 것 / facts 밖 내용 금지).
const BRIEF_SYSTEM_EN =
  'You are an analyst briefing a stock to individual investors. Write a 3-4 sentence English briefing based ONLY on the given "proven-method verdicts" and "recent filing facts."\n' +
  'Rules (must): (1) No forecasts, outlook, or investment recommendations — never say "will rise/fall, buy/sell, target price, opportunity, now is the time," etc. ' +
  '(2) The core is ⓐ pointing out the tension (divergence) across time horizons and methods, and ⓑ pointing to what to watch (observable catalysts/facts). ' +
  '(3) Do not add content or numbers not in the facts. "Recent material filings" are already-received past facts, so do not call them upcoming or expected. (4) Keep a stance of not judging direction (do not attach a disclaimer every time). (5) Plain professional English, no filler, one paragraph.\n' +
  'Example tone: "It runs hot in the short term while mid- and long-term read strong — the grain differs by time horizon. Financials and quality are favorable, but value is on the expensive side, so growth carries a premium here. A recent earnings filing may have refreshed the basis for the financial lens, so the cooling of the overheating and the next results are worth watching."';

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get('symbol') || '').trim().toUpperCase();
  // 식별자(symbol) 형식 엄격 검증 — 알려진 종목 형식만(과금 유발 입력 게이트·STEP 793).
  if (!/^[A-Z0-9.\-]{1,15}$/.test(symbol)) return NextResponse.json({ error: 'no_symbol' }, { status: 400 });
  // 🔴 STEP 806 §6: 활성 시장(KR·US)만 — 파킹 시장(7203.T 등)은 LLM 생성까지 진행 금지(blockLLM은 레이트리밋일 뿐 시장 게이트 아님).
  if (!isActiveSymbol(symbol)) return NextResponse.json({ error: 'inactive_market' }, { status: 400 });

  const locale = pickLocale(req.nextUrl.searchParams.get('lang')); // 기본 ko · ?lang=en
  const col = locale === 'en' ? 'brief_en' : 'brief_ko'; // 로케일별 캐시 컬럼(서로 독립)
  const sb = createAdminClient();
  const today = marketDate(symbol);

  // 1) 캐시(종목+날짜+로케일 컬럼)
  const { data: hit } = await sb
    .from('stock_briefings').select(col).eq('symbol', symbol).eq('as_of', today).maybeSingle();
  const cached = (hit as Record<string, string | null> | null)?.[col];
  if (cached) return NextResponse.json({ brief: cached, cached: true });

  // 캐시 미스 = 새 유료 LLM 생성. 봇·레이트리밋 차단(과금 남용 방어·STEP 793). 캐시 히트는 위에서 이미 반환됨.
  if (blockLLM(req)) return NextResponse.json({ brief: '' }, { status: 429 });

  // 2) 결정론 상태 서버 재계산(브리핑은 우리가 계산한 사실에만 근거)
  const data = await computeSymbolLenses(symbol, locale);
  const lenses = data.lenses || [];
  if (!lenses.length && !data.fscore) return NextResponse.json({ error: 'no_data' }, { status: 200 });
  const code6 = symbol.replace(/\.(KS|KQ)$/i, ''); // 공시 소스 분기용(KR 6자리)
  const en = locale === 'en';

  const lensFacts = lenses
    .filter((l) => l.verdict?.phrase)
    .map((l) => `- ${l.name}(${H[locale][l.horizon] || l.horizon}·${l.grade}): ${l.verdict!.phrase}${l.headline ? ` [${l.headline}]` : ''}`)
    .join('\n');
  const fsc = data.fscore as { supported?: boolean; score?: number; max?: number; grade?: string } | null | undefined;
  const fs = fsc?.supported
    ? en
      ? `- F-Score (long-term · financial health): ${fsc.score}/${fsc.max} (${fsc.grade})`
      : `- F-Score(장기·재무건전성): ${fsc.score}/${fsc.max} (${fsc.grade})`
    : '';
  // 공시 사실: KR(6자리)=DART, 그 외=EDGAR 8-K (US 코드 그대로, 소스만 교체)
  const noEv = en ? '(No recent material filings)' : '(최근 중대 공시 없음)';
  let evFacts: string;
  if (/^\d{6}$/.test(code6)) {
    // DART report_nm은 한국어 원문(공시 제목 = 소스 언어) — 번역 대상 아님.
    const dartEv = await fetchDartMaterial(symbol, 5).catch(() => []);
    evFacts = dartEv.length ? dartEv.map((e) => `- ${e.date} ${e.report_nm}`).join('\n') : noEv;
  } else {
    // 8-K def는 label(ko)·en을 둘 다 들고 옴(716) — 로케일에 맞는 쪽만 고른다.
    const events = await fetchMaterial8K(symbol, 5).catch(() => []);
    const flag = en ? ' ※ may refresh the financial-lens basis' : ' ※재무 렌즈 근거 갱신 가능';
    evFacts = events.length
      ? events.map((e) => {
          const d = e.defs[0];
          const label = (en ? d?.en : d?.label) ?? '';
          return `- ${e.date} ${label}(${e.items.join(',')})${d?.klass === 'A' ? flag : ''}`;
        }).join('\n')
      : noEv;
  }
  const facts = en
    ? `Stock: ${symbol}${data.name ? ` (${data.name})` : ''}\n\n[Proven-method verdicts]\n${lensFacts}\n${fs}\n\n[Recent material filings]\n${evFacts}`
    : `종목: ${symbol}${data.name ? ` (${data.name})` : ''}\n\n[검증된 기법 판정]\n${lensFacts}\n${fs}\n\n[최근 중대 공시]\n${evFacts}`;

  // 3) LLM 브리핑
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'no_key' }, { status: 500 });
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: en ? BRIEF_SYSTEM_EN : BRIEF_SYSTEM },
        {
          role: 'user',
          content: en
            ? `Below are our deterministic methods' verdicts and recent filing facts for this stock. Write a briefing based on them:\n\n${facts}`
            : `아래는 이 종목에 대한 우리 결정론 기법들의 판정과 최근 공시 사실입니다. 이걸 바탕으로 브리핑을 써주세요:\n\n${facts}`,
        },
      ],
      max_tokens: 260,
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) return NextResponse.json({ error: `llm ${res.status}` }, { status: 502 });
  const j = await res.json();
  const brief = (j.choices?.[0]?.message?.content || '').trim();
  if (!brief) return NextResponse.json({ error: 'llm_empty' }, { status: 502 });

  // 해당 로케일 컬럼만 payload에 담는다 → Supabase upsert는 준 키만 UPDATE하므로 반대 로케일 캐시 무손상.
  const { error: upErr } = await sb.from('stock_briefings').upsert(
    { symbol, as_of: today, [col]: brief, model: 'gpt-4o-mini' },
    { onConflict: 'symbol,as_of' },
  );
  // 캐시 쓰기 실패를 삼키면 매 조회마다 유료 LLM 재생성(조용한 과금 누수) — 응답은 살리되 로그는 남긴다.
  if (upErr) console.error('[brief] cache upsert failed', { symbol, col, error: upErr.message });
  return NextResponse.json({ brief, cached: false });
}
