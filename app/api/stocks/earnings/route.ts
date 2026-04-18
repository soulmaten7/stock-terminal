import { NextRequest, NextResponse } from 'next/server';
import { getDartCorpCode, DartKeyMissingError } from '@/lib/dart';
import { fetchDartFinancial, FinancialStatement } from '@/lib/dart-financial';

export const runtime = 'nodejs';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i); // [2026,2025,...,2022]
const QUARTER_CODES = [
  { reprt: '11013', label: 'Q1' },
  { reprt: '11012', label: 'Q2' },
  { reprt: '11014', label: 'Q3' },
  { reprt: '11011', label: 'Q4/연간' },
];

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol');
  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 });

  let corpCode: string | null;
  try {
    corpCode = await getDartCorpCode(symbol.toUpperCase());
  } catch (e) {
    if (e instanceof DartKeyMissingError) {
      return NextResponse.json({
        quarters: [], annual: [],
        fallbackReason: 'DART_API_KEY 미설정',
      });
    }
    throw e;
  }

  if (!corpCode) {
    return NextResponse.json({
      quarters: [], annual: [],
      fallbackReason: `corp_code 없음 — dart_corp_codes 테이블에 ${symbol} 미등록`,
    });
  }

  // 5년 × 4분기 병렬 조회 (최대 20 요청 — DART 일 10,000 제한 내)
  const tasks: Promise<FinancialStatement | null>[] = [];
  for (const year of YEARS) {
    for (const { reprt } of QUARTER_CODES) {
      tasks.push(fetchDartFinancial(corpCode, year, reprt));
    }
  }
  const results = await Promise.all(tasks);
  const valid = results.filter((r): r is FinancialStatement => r !== null);

  // annual: reprtCode 11011 (사업보고서)
  const annual = valid
    .filter((r) => r.periodType === 'annual')
    .sort((a, b) => a.year - b.year);

  // quarters: Q1/Q2/Q3 + 직전 연간을 Q4로 추산
  const quarters: FinancialStatement[] = [];
  for (const year of [...YEARS].reverse()) {
    for (const { reprt, label } of QUARTER_CODES) {
      const found = valid.find(
        (r) => r.year === year && r.period === `${year}${label === 'Q4/연간' ? '' : label}`
      );
      if (found) quarters.push(found);
    }
  }
  // 최근 12개 분기만
  const recentQuarters = quarters.slice(-12);

  return NextResponse.json({ symbol, quarters: recentQuarters, annual });
}
