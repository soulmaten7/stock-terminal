// 종목명 표시 일원화(STEP 775 §3) — 오늘·탐색(목록·풀리스트)·서버 API(explore/lens-top)가 전부 이 함수 하나로.
// KR = pickKrName(kr_stock_snapshot 조인 한글/영문) · US = foreign_ko_names 한글 오버라이드(ko) → cleanUsName 축약.
// 순수 함수(서버·클라 양쪽 안전) — foreign_ko_names는 JSON, pickKrName/cleanUsName도 의존성 없음.
import { pickKrName } from './krNameFormat';
import { cleanUsName } from './usNameFormat';
import foreignKoRaw from '@/data/foreign_ko_names.json';

const FOREIGN_KO = foreignKoRaw as Record<string, string>;

export function resolveDisplayName(params: {
  loc: 'ko' | 'en';
  market: 'KR' | 'US';
  symbol: string;
  nameKo?: string | null;
  nameEn?: string | null;
  rawName?: string | null;
}): string {
  const { loc, market, symbol, nameKo, nameEn, rawName } = params;
  if (market === 'KR') return pickKrName(loc, nameKo, nameEn, rawName ?? symbol);
  if (loc === 'ko') {
    const ko = FOREIGN_KO[symbol.toUpperCase()];
    if (ko) return ko;
  }
  return cleanUsName(rawName ?? symbol);
}
