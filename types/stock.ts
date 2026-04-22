export interface Stock {
  id: number | null;  // null = Supabase 미수록, KIS fallback 전용
  symbol: string;
  name_ko: string | null;
  name_en: string | null;
  market: string;
  country: string;
  sector: string | null;
  industry: string | null;
  market_cap: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Financial {
  id: number;
  stock_id: number;
  period_type: 'annual' | 'quarterly';
  period_date: string;
  revenue: number | null;
  operating_income: number | null;
  net_income: number | null;
  total_assets: number | null;
  total_liabilities: number | null;
  total_equity: number | null;
  eps: number | null;
  bps: number | null;
  per: number | null;
  pbr: number | null;
  roe: number | null;
  roa: number | null;
  debt_ratio: number | null;
  operating_margin: number | null;
  net_margin: number | null;
  source: string | null;
  raw_data: Record<string, unknown> | null;
  created_at: string;
}

export interface Disclosure {
  id: number;
  stock_id: number | null;
  symbol: string | null;
  title: string;
  disclosure_type: string | null;
  source: string;
  source_url: string | null;
  published_at: string;
  ai_summary: string | null;
  raw_data: Record<string, unknown> | null;
  created_at: string;
}

export interface SupplyDemand {
  id: number;
  stock_id: number;
  trade_date: string;
  foreign_net: number | null;
  institution_net: number | null;
  individual_net: number | null;
  foreign_cumulative: number | null;
  program_net: number | null;
  created_at: string;
}

export interface ShortCredit {
  id: number;
  stock_id: number;
  trade_date: string;
  short_volume: number | null;
  short_balance: number | null;
  short_ratio: number | null;
  credit_balance: number | null;
  loan_balance: number | null;
  created_at: string;
}

export interface InsiderTrade {
  id: number;
  stock_id: number;
  insider_name: string;
  position: string | null;
  trade_type: 'buy' | 'sell';
  shares: number;
  price: number | null;
  total_amount: number | null;
  trade_date: string;
  source_url: string | null;
  created_at: string;
}

export interface Dividend {
  id: number;
  stock_id: number;
  fiscal_year: number;
  dividend_per_share: number | null;
  dividend_yield: number | null;
  payout_ratio: number | null;
  ex_dividend_date: string | null;
  payment_date: string | null;
  created_at: string;
}

export interface News {
  id: number;
  stock_id: number | null;
  symbol: string | null;
  title: string;
  source: string;
  url: string;
  published_at: string;
  summary_ko: string | null;
  country: string | null;
  created_at: string;
}

export interface MacroIndicator {
  id: number;
  indicator_name: string;
  country: string;
  value: number;
  previous_value: number | null;
  change_rate: number | null;
  unit: string | null;
  measured_at: string;
  source: string | null;
  created_at: string;
}

export interface AIAnalysis {
  id: number;
  stock_id: number;
  analysis_type: 'value' | 'technical' | 'quant' | 'dividend' | 'supply';
  content_ko: string;
  content_en: string | null;
  data_snapshot: Record<string, unknown> | null;
  generated_at: string;
  expires_at: string | null;
}
