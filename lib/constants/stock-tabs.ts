export const STOCK_TABS = [
  { key: 'overview', label: '개요' },
  { key: 'chart', label: '차트' },
  { key: 'orderbook', label: '호가' },
  { key: 'financials', label: '재무' },
  { key: 'earnings', label: '실적' },
  { key: 'news', label: '뉴스/공시' },
  { key: 'flow', label: '수급' },
  { key: 'compare', label: '비교' },
] as const;

export type StockTabKey = (typeof STOCK_TABS)[number]['key'];

export const DEFAULT_STOCK_TAB: StockTabKey = 'overview';
