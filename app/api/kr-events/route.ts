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

  // STEP 809 §4: fetchDartMaterial이 실패를 구분 반환 → 3상태가 실제로 작동.
  //   fetch_failed(상류 장애)=캐시 안 함(재시도) · unsupported(비상장·미매핑)=캐시 OK · ok(0건 포함)=캐시 OK.
  const r = await fetchDartMaterial(symbol);
  if (!r.ok) {
    if (r.reason === 'fetch_failed') return NextResponse.json({ symbol, events: [], error: 'fetch_failed' });
    const data = { symbol, events: [], error: 'unsupported' };
    cache.set(symbol, { at: Date.now(), data });
    return NextResponse.json(data);
  }
  const data = { symbol, events: r.events };
  cache.set(symbol, { at: Date.now(), data });
  return NextResponse.json(data);
}
