export const ANALYSIS_TYPES = [
  { key: 'value', label: '가치투자', description: 'PER, PBR, 안전마진, DCF 분석' },
  { key: 'technical', label: '기술적분석', description: '이동평균, RSI, MACD, 볼린저밴드' },
  { key: 'quant', label: '퀀트', description: '모멘텀, 밸류, 퀄리티 팩터 분석' },
  { key: 'dividend', label: '배당투자', description: '배당수익률, 성장률, 안정성 분석' },
  { key: 'supply', label: '수급분석', description: '외국인/기관 매집, 거래량 분석' },
] as const;

export type AnalysisType = (typeof ANALYSIS_TYPES)[number]['key'];
