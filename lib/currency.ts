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
