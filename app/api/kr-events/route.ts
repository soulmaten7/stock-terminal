import { NextRequest, NextResponse } from 'next/server';
import { fetchDartMaterial } from '@/lib/dartEvents';

export const runtime = 'nodejs';
export const maxDuration = 20;

// KR 종목 최근 중대 공시(DART). US /api/events(EDGAR)의 KR 짝. 10분 인메모리 캐시.
const cache = new Map<string, { at: number; data: unknown }>();

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get('symbol') || '').trim();
  if (!symbol) return NextResponse.json({ error: 'no_symbol' }, { status: 400 });

  const hit = cache.get(symbol);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return NextResponse.json(hit.data);

  const events = await fetchDartMaterial(symbol).catch(() => []);
  const data = { symbol, events };
  cache.set(symbol, { at: Date.now(), data });
  return NextResponse.json(data);
}
