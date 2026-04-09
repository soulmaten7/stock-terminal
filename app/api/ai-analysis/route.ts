import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const stockId = request.nextUrl.searchParams.get('stock_id');
  const type = request.nextUrl.searchParams.get('type');
  if (!stockId) return NextResponse.json({ error: 'stock_id required' }, { status: 400 });

  const supabase = createAdminClient();
  let query = supabase.from('ai_analysis').select('*').eq('stock_id', stockId).gt('expires_at', new Date().toISOString());
  if (type) query = query.eq('analysis_type', type);
  const { data } = await query.order('generated_at', { ascending: false });
  return NextResponse.json({ analyses: data || [] });
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  try {
    const { stockId, analysisType, data } = await request.json();

    if (!stockId || !analysisType || !data) {
      return NextResponse.json({ error: 'stockId, analysisType, and data are required' }, { status: 400 });
    }

    const prompts: Record<string, string> = {
      value: '다음 재무 데이터를 가치투자 관점에서 간결하게 한국어로 분석해주세요. PER, PBR, ROE 등 핵심 지표를 중심으로 동종업계 대비 위치를 설명해주세요.',
      technical: '다음 기술적 지표 데이터를 기술적 분석 관점에서 간결하게 한국어로 정리해주세요. 이동평균, RSI, MACD 등의 상태를 요약해주세요.',
      quant: '다음 퀀트 팩터 데이터를 정리하여 모멘텀, 밸류, 퀄리티 관점에서 간결하게 한국어로 분석해주세요.',
      dividend: '다음 배당 데이터를 배당 투자 관점에서 간결하게 한국어로 분석해주세요. 배당 안정성, 성장성, 수익률을 중심으로 설명해주세요.',
      supply: '다음 수급 데이터를 분석하여 외국인, 기관의 매매 패턴을 간결하게 한국어로 정리해주세요.',
    };

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: '당신은 한국 주식 시장 전문 데이터 분석가입니다. 객관적인 데이터를 정리하되, 투자 추천은 하지 않습니다. 3-5문장으로 간결하게 답변합니다.' },
          { role: 'user', content: `${prompts[analysisType] || prompts.value}\n\n데이터:\n${JSON.stringify(data)}` },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    const result = await res.json();
    const content = result.choices?.[0]?.message?.content || '';

    // Save to DB
    const supabase = createAdminClient();
    await supabase.from('ai_analysis').upsert(
      {
        stock_id: stockId,
        analysis_type: analysisType,
        content_ko: content,
        data_snapshot: data,
        generated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: 'stock_id,analysis_type' }
    );

    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json({ error: 'AI analysis generation failed' }, { status: 500 });
  }
}
