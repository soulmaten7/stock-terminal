import { NextRequest, NextResponse } from 'next/server';
import { computeSymbolLenses } from '@/lib/lensCompute';
import { fetchMaterial8K } from '@/lib/eightK';
import { fetchDartMaterial } from '@/lib/dartEvents';
import { createAdminClient } from '@/lib/supabase/admin';
import { marketDate } from '@/lib/marketDate';

export const runtime = 'nodejs';
export const maxDuration = 30;

// R2: 종목 브리핑. 우리 결정론 렌즈 판정 + 최근 공시 사실만 근거로 LLM이 '핵심 긴장 + 지켜볼 것'을 1문단.
// 예측·판정 금지(가드레일). 지연 생성 + 종목·날짜 캐시(하루 1회 재생성 = 렌즈 주기와 일치).
const H: Record<string, string> = { short: '단기', mid: '중기', long: '장기' };

const BRIEF_SYSTEM =
  '당신은 한국 개인투자자에게 종목을 브리핑하는 애널리스트입니다. 주어진 "검증된 기법 판정"과 "최근 공시 사실"만 근거로 3~4문장 한국어 브리핑을 씁니다.\n' +
  '규칙(반드시): (1) 예측·전망·투자 추천 절대 금지 — "오른다/내린다·사라/팔아라·목표가·기회·지금이 타이밍" 등 금지. ' +
  '(2) 핵심은 ⓐ 시간축·기법 간 "긴장(엇갈림)"을 짚고 ⓑ "지켜볼 것"(관찰 가능한 촉매·사실)을 가리키는 것. ' +
  '(3) 주어진 facts에 없는 내용·숫자 추가 금지. "최근 중대 공시"는 이미 접수된 과거 사실이니 "예정"이라 쓰지 말 것. (4) 방향 판단은 하지 않는 태도 유지(문구를 매번 붙이진 말 것). (5) 해요체·군더더기 없이·한 문단.\n' +
  '예시 톤: "○○는 단기 과열, 중기·장기는 강세로 시간축마다 결이 갈려요. 재무·품질은 우호적인데 밸류는 비싼 편이라 성장에 프리미엄이 붙은 그림이에요. 최근 실적 발표로 재무 렌즈 근거가 갱신됐을 수 있으니, 과열 해소와 다음 실적을 지켜볼 만해요."';

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get('symbol') || '').trim().toUpperCase();
  if (!symbol) return NextResponse.json({ error: 'no_symbol' }, { status: 400 });

  const sb = createAdminClient();
  const today = marketDate(symbol);

  // 1) 캐시(종목+날짜)
  const { data: hit } = await sb
    .from('stock_briefings').select('brief_ko').eq('symbol', symbol).eq('as_of', today).maybeSingle();
  if (hit?.brief_ko) return NextResponse.json({ brief: hit.brief_ko, cached: true });

  // 2) 결정론 상태 서버 재계산(브리핑은 우리가 계산한 사실에만 근거)
  const data = await computeSymbolLenses(symbol);
  const lenses = data.lenses || [];
  if (!lenses.length && !data.fscore) return NextResponse.json({ error: 'no_data' }, { status: 200 });
  const code6 = symbol.replace(/\.(KS|KQ)$/i, ''); // 공시 소스 분기용(KR 6자리)

  const lensFacts = lenses
    .filter((l) => l.verdict?.phrase)
    .map((l) => `- ${l.name}(${H[l.horizon] || l.horizon}·${l.grade}): ${l.verdict!.phrase}${l.headline ? ` [${l.headline}]` : ''}`)
    .join('\n');
  const fsc = data.fscore as { supported?: boolean; score?: number; max?: number; grade?: string } | null | undefined;
  const fs = fsc?.supported
    ? `- F-Score(장기·재무건전성): ${fsc.score}/${fsc.max} (${fsc.grade})` : '';
  // 공시 사실: KR(6자리)=DART, 그 외=EDGAR 8-K (US 코드 그대로, 소스만 교체)
  let evFacts: string;
  if (/^\d{6}$/.test(code6)) {
    const dartEv = await fetchDartMaterial(symbol, 5).catch(() => []);
    evFacts = dartEv.length ? dartEv.map((e) => `- ${e.date} ${e.report_nm}`).join('\n') : '(최근 중대 공시 없음)';
  } else {
    const events = await fetchMaterial8K(symbol, 5).catch(() => []);
    evFacts = events.length
      ? events.map((e) => `- ${e.date} ${e.defs[0]?.label ?? ''}(${e.items.join(',')})${e.defs[0]?.klass === 'A' ? ' ※재무 렌즈 근거 갱신 가능' : ''}`).join('\n')
      : '(최근 중대 공시 없음)';
  }
  const facts = `종목: ${symbol}${data.name ? ` (${data.name})` : ''}\n\n[검증된 기법 판정]\n${lensFacts}\n${fs}\n\n[최근 중대 공시]\n${evFacts}`;

  // 3) LLM 브리핑
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'no_key' }, { status: 500 });
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: BRIEF_SYSTEM },
        { role: 'user', content: `아래는 이 종목에 대한 우리 결정론 기법들의 판정과 최근 공시 사실입니다. 이걸 바탕으로 브리핑을 써주세요:\n\n${facts}` },
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

  await sb.from('stock_briefings').upsert(
    { symbol, as_of: today, brief_ko: brief, model: 'gpt-4o-mini' },
    { onConflict: 'symbol,as_of' },
  );
  return NextResponse.json({ brief, cached: false });
}
