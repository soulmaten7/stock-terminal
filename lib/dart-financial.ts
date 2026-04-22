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

function findBySjDiv(
  items: DartAcntItem[],
  sjDiv: string,
  keywords: string[]
): number | null {
  // 1차: 완전 일치 (account_nm == kw 또는 account_id == kw)
  for (const kw of keywords) {
    const hit = items.find(
      (x) => x.sj_div === sjDiv && (x.account_nm === kw || x.account_id === kw)
    );
    if (hit) {
      const v = parseAmount(hit.thstrm_amount) ?? parseAmount(hit.frmtrm_amount);
      if (v !== null) return v;
    }
  }
  // 2차: account_id 부분 매칭 (IFRS/DART 태그 prefix 만)
  for (const kw of keywords) {
    if (!(kw.startsWith('ifrs-full_') || kw.startsWith('dart_'))) continue;
    const hit = items.find(
      (x) => x.sj_div === sjDiv && (x.account_id ?? '').includes(kw)
    );
    if (hit) {
      const v = parseAmount(hit.thstrm_amount) ?? parseAmount(hit.frmtrm_amount);
      if (v !== null) return v;
    }
  }
  return null;
}

function findAmount(items: DartAcntItem[], ...keywords: string[]): number | null {
  // 손익계산서 — IS 먼저, 없으면 CIS (단일 포괄손익계산서) 탐색
  const is = findBySjDiv(items, 'IS', keywords);
  if (is !== null) return is;
  return findBySjDiv(items, 'CIS', keywords);
}

export async function fetchDartFinancial(
  corpCode: string,
  year: number,
  reprtCode: string
): Promise<FinancialStatement | null> {
  const meta = REPRT_MAP[reprtCode];
  if (!meta) return null;

  async function request(fsDiv: 'CFS' | 'OFS'): Promise<DartAcntItem[] | null> {
    try {
      const d = await fetchDart<DartAcntAllResponse>('/fnlttSinglAcntAll.json', {
        corp_code: corpCode,
        bsns_year: String(year),
        reprt_code: reprtCode,
        fs_div: fsDiv,
      });
      const list = d.list ?? [];
      return list.length > 0 ? list : null;
    } catch {
      return null;
    }
  }

  let items = await request('CFS');
  if (!items) items = await request('OFS');
  if (!items) return null;

  const revenue = findAmount(
    items,
    '매출액', '매출', '수익(매출액)', '영업수익', '수익',
    'ifrs-full_Revenue',
    'ifrs-full_RevenueFromContractsWithCustomers'
  );
  const operatingIncome = findAmount(
    items,
    '영업이익', '영업이익(손실)', '영업손익',
    'dart_OperatingIncomeLoss',
    'ifrs-full_ProfitLossFromOperatingActivities'
  );
  const netIncome = findAmount(
    items,
    '당기순이익', '당기순이익(손실)', '당기순손익', '반기순이익', '분기순이익',
    'ifrs-full_ProfitLoss'
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
