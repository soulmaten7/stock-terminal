export function formatNumber(value: number | null | undefined): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('ko-KR').format(value);
}

export function formatCurrency(value: number | null | undefined, currency = 'KRW'): string {
  if (value == null) return '-';
  if (currency === 'KRW') {
    return new Intl.NumberFormat('ko-KR').format(value) + '원';
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return '-';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatMarketCap(value: number | null | undefined): string {
  if (value == null) return '-';
  if (value >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(1)}조`;
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(0)}억`;
  return formatNumber(value);
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr)} ${formatTime(dateStr)}`;
}
