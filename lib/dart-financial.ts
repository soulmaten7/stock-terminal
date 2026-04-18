import { fetchDart } from '@/lib/dart';

export type PeriodType = 'annual' | 'q1' | 'q2' | 'q3';

export interface FinancialStatement {
  period: string;        // e.g. "2024", "2024Q1"
  periodType: PeriodType;
  year: number;
  revenue: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  opMargin: number | null;   // %
  netMargin: number | null;  // %
}

interface DartAcntItem {
  sj_div: string;
  account_nm: string;
  account_id: string;
  thstrm_amount?: string;
  frmtrm_amount?: string;
}

interface DartAcntAllResponse {
  status: string;
  message: string;
  list?: DartAcntItem[];
}

// reprt_code → periodType
const REPRT_MAP: Record<string, { type: PeriodType; suffix: string }> = {
  '11011': { type: 'annual', suffix: '' },
  '11012': { type: 'q2',     suffix: 'Q2' },
  '11013': { type: 'q1',     suffix: 'Q1' },
  '11014': { type: 'q3',     suffix: 'Q3' },
};

function parseAmount(raw?: string): number | null {
  if (!raw) return null;
  const n = Number(raw.replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

function findAmount(items: DartAcntItem[], ...keywords: string[]): number | null {
  for (const kw of keywords) {
    const hit = items.find(
      (x) => x.sj_div === 'IS' && (x.account_nm === kw || x.account_id?.includes(kw))
    );
    if (hit) {
      const v = parseAmount(hit.thstrm_amount) ?? parseAmount(hit.frmtrm_amount);
      if (v !== null) return v;
    }
  }
  return null;
}

export async function fetchDartFinancial(
  corpCode: string,
  year: number,
  reprtCode: string
): Promise<FinancialStatement | null> {
  const meta = REPRT_MAP[reprtCode];
  if (!meta) return null;

  let data: DartAcntAllResponse;
  try {
    data = await fetchDart<DartAcntAllResponse>('/fnlttSinglAcntAll.json', {
      corp_code: corpCode,
      bsns_year: String(year),
      reprt_code: reprtCode,
      fs_div: 'CFS',
    });
  } catch {
    return null;
  }

  const items = data.list ?? [];
  if (items.length === 0) return null;

  const revenue = findAmount(items, '매출액', 'ifrs-full_Revenue', '수익(매출액)');
  const operatingIncome = findAmount(
    items, '영업이익', 'dart_OperatingIncomeLoss', '영업이익(손실)'
  );
  const netIncome = findAmount(
    items, '당기순이익', 'ifrs-full_ProfitLoss', '당기순이익(손실)'
  );

  const opMargin =
    revenue && operatingIncome !== null ? (operatingIncome / revenue) * 100 : null;
  const netMargin =
    revenue && netIncome !== null ? (netIncome / revenue) * 100 : null;

  return {
    period: `${year}${meta.suffix}`,
    periodType: meta.type,
    year,
    revenue,
    operatingIncome,
    netIncome,
    opMargin: opMargin !== null ? Math.round(opMargin * 100) / 100 : null,
    netMargin: netMargin !== null ? Math.round(netMargin * 100) / 100 : null,
  };
}
