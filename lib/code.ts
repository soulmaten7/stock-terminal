/**
 * KRX 국내 단축코드 판별.
 * - 숫자 6자리(예: 005930, 069500)
 * - 영문 섞인 신형 단축코드(예: 0193T0, 0167A0, 0195S0) — 단일종목 레버리지/인버스 등 신상품
 * 미국 티커(AAPL 등 알파벳 시작 · ^지수)와의 구분 규칙: "6자 영숫자이며 첫 글자가 숫자".
 */
export function isKrxCode(code: string | null | undefined): boolean {
  return !!code && /^\d[0-9A-Za-z]{5}$/.test(code);
}
