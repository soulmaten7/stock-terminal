// 종목명 표시 일원화(STEP 775 §3, context 구분 STEP 776 §1) — 오늘·탐색(목록·풀리스트)·서버 API(explore/lens-top·search)가 전부 이 함수 하나로.
// KR = pickKrName(kr_stock_snapshot 조인 한글/영문).
// US = context가 갈린다 — 'list'(오늘·탐색 목록/풀리스트·검색 결과 표시)는 항상 cleanUsName 영문(로케일 무관, 한 리스트 내 한글/영문 혼재 방지).
//      'detail'(종목 상세)만 ko 로케일에서 foreign_ko_names 한글 오버라이드. 화면별 재분기 금지 — 이 플래그 하나로 결정.
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
  context: 'list' | 'detail';
}): string {
  const { loc, market, symbol, nameKo, nameEn, rawName, context } = params;
  if (market === 'KR') return pickKrName(loc, nameKo, nameEn, rawName ?? symbol);
  if (context === 'detail' && loc === 'ko') {
    const ko = FOREIGN_KO[symbol.toUpperCase()];
    if (ko) return ko;
  }
  return cleanUsName(rawName ?? symbol);
}

// 관심목록 전용(STEP 781) — watchlist.name_ko는 등록 당시 로케일 스냅샷이라 국가와 무관하게 한글/영문이 섞여 저장됨
// (예: 상세 페이지에서 등록 시 FK 오버라이드 "로빈후드"가 그대로 박힘). KR은 기존과 동일 pickKrName.
// 비KR은 위 resolveDisplayName의 'list' 규칙(로케일 무관 항상 영문)을 따르되, 원본 영문명(name_en)이 없으면
// (이번 STEP은 US만 채움 — JP/CN/VN/GB는 후속) 회귀 방지로 저장된 name_ko 그대로 폴백.
export function resolveWatchlistName(loc: 'ko' | 'en', q: { symbol: string; country: string; name_ko: string | null; name_en?: string | null }): string {
  if (q.country === 'KR') return resolveDisplayName({ loc, market: 'KR', symbol: q.symbol, nameKo: q.name_ko, nameEn: q.name_en ?? null, context: 'list' });
  if (q.name_en) return resolveDisplayName({ loc, market: 'US', symbol: q.symbol, rawName: q.name_en, context: 'list' });
  return q.name_ko ?? q.symbol;
}
