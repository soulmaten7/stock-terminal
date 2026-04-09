export const LINK_CATEGORIES = [
  { key: 'news', label: '뉴스/기사' },
  { key: 'disclosure', label: '공시/재무' },
  { key: 'exchange', label: '거래소/시장데이터' },
  { key: 'macro', label: '거시경제' },
  { key: 'chart', label: '차트/분석도구' },
  { key: 'research', label: '증권사리서치' },
  { key: 'community', label: '커뮤니티' },
] as const;

export type LinkCategory = (typeof LINK_CATEGORIES)[number]['key'];
