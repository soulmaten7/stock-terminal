// 원 단위 큰 금액 → "1.23조" / "4,567억" / "12원"
export function formatKRW(won: number | null): string {
  if (won === null || isNaN(won)) return "—";
  const sign = won < 0 ? "-" : "";
  const v = Math.abs(won);
  if (v >= 1e12) return `${sign}${(v / 1e12).toFixed(2)}조`;
  if (v >= 1e8) return `${sign}${Math.round(v / 1e8).toLocaleString()}억`;
  return `${sign}${v.toLocaleString()}원`;
}

export function formatPct(n: number | null, digits = 1): string {
  return n === null || isNaN(n) ? "—" : `${n.toFixed(digits)}%`;
}
