import { NextRequest, NextResponse } from 'next/server';
import { fetchDartMaterial } from '@/lib/dartEvents';

export const runtime = 'nodejs';
export const maxDuration = 20;

// KR 종목 최근 중대 공시(DART). US /api/events(EDGAR)의 KR 짝. 10분 인메모리 캐시.
// STEP 797 §1: "0건"과 "못 가져옴"을 구분해 반환 — 상류 실패를 200+빈배열로 삼키면 화면이 "사건 없음"을
// 거짓 단언(§직시 위반). ok(0건 포함)=events / fetch_failed=상류 장애(캐시 안 함, 클라가 섹션 숨김).
const cache = new Map<string, { at: number; data: unknown }>();

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get('symbol') || '').trim();
  if (!symbol) return NextResponse.json({ error: 'no_symbol' }, { status: 400 });

  const hit = cache.get(symbol);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return NextResponse.json(hit.data);

  let events;
  try {
    events = await fetchDartMaterial(symbol);
  } catch {
    // 상류 실패 — 지어내지 않는다. 캐시하지 않음(다음 조회 재시도).
    return NextResponse.json({ symbol, events: [], error: 'fetch_failed' });
  }
  const data = { symbol, events };
  cache.set(symbol, { at: Date.now(), data });
  return NextResponse.json(data);
}
