import { formatMarketCap } from './utils/format';

// 시장별 현재가 통화 포맷 — KR 원(접미·소수0) / US $(접두·소수2). JP ¥ 등 확장 대비.
const CURRENCY: Record<string, { sym: string; pos: 'pre' | 'suf'; frac: number; locale: string }> = {
  KR: { sym: '원', pos: 'suf', frac: 0, locale: 'ko-KR' },
  US: { sym: '$', pos: 'pre', frac: 2, locale: 'en-US' },
  JP: { sym: '¥', pos: 'pre', frac: 0, locale: 'ja-JP' },
  HK: { sym: 'HK$', pos: 'pre', frac: 2, locale: 'en-HK' },
  CN: { sym: '¥', pos: 'pre', frac: 2, locale: 'zh-CN' },
  VN: { sym: '₫', pos: 'suf', frac: 0, locale: 'vi-VN' },
  GB: { sym: 'p', pos: 'suf', frac: 0, locale: 'en-GB' },
};

export function formatPrice(v: number, country: string): string {
  const c = CURRENCY[country] ?? CURRENCY.US;
  const n = (v ?? 0).toLocaleString(c.locale, { minimumFractionDigits: c.frac, maximumFractionDigits: c.frac });
  return c.pos === 'pre' ? `${c.sym}${n}` : `${n}${c.sym}`;
}

// 거래대금 축약 표시(STEP 774 §2) — 종목 상세 헤더 공용. KR=조/억(lib/utils/format.ts formatMarketCap 재사용) · 그 외=$B/$M.
// country는 formatPrice와 동일 키(KR/US 등). US 외 시장은 애초에 값 소스가 없어 이 함수까지 안 옴(정직 결측 — 호출부에서 null 가드).
export function formatTradeValue(amount: number, country: string): string {
  if (country === 'KR') return formatMarketCap(amount);
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(0)}M`;
  return `$${Math.round(amount).toLocaleString('en-US')}`;
}
