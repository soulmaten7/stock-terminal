import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // market, supply, short

  try {
    // KRX 데이터는 data.krx.co.kr에서 가져옴
    // 실제 구현 시 KRX Open API 또는 스크래핑 필요
    return NextResponse.json({
      message: 'KRX API proxy - configure actual endpoint',
      type,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch KRX data' }, { status: 500 });
  }
}
