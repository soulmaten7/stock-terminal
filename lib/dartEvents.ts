import { getDartCorpCode, fetchDart } from '@/lib/dart';

// KR 종목 최근 '중대' 공시(DART list.json). report_nm은 한국어 서술이라 키워드로 중대 여부 판단(결정론).
// US eightK(8-K item 코드)의 KR 짝. 여기선 목록만 — 원문 요약(R1-KR)은 STEP 596에서 얹음.
const MATERIAL_KW = [
  '유상증자', '무상증자', '감자', '합병', '분할', '영업(잠정)', '실적', '매출액', '영업이익',
  '배당', '자기주식', '자사주', '최대주주', '대주주', '상장폐지', '감사보고서', '주요사항보고서',
  '전환사채', '신주인수권', '교환사채', '공급계약', '단일판매', '수주', '횡령', '배임', '소송', '회생', '파산',
];

export type DartEvent = { date: string; report_nm: string; rcept_no: string; url: string };

const fmt = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

// KR 티커(005930.KS·005930) → 6자리 코드 → corp_code → 최근 6개월 중대 공시.
export async function fetchDartMaterial(symbol: string, limit = 6): Promise<DartEvent[]> {
  const code6 = symbol.replace(/\.(KS|KQ)$/i, '').trim();
  if (!/^\d{6}$/.test(code6)) return []; // KR 6자리만(비KR·미상장 = 빈 배열)

  const corp = await getDartCorpCode(code6);
  if (!corp) return [];

  const now = new Date();
  const bgn = new Date(now.getTime() - 180 * 86400000);
  let list: Array<Record<string, string>> = [];
  try {
    const res = await fetchDart<{ list?: Array<Record<string, string>> }>('/list.json', {
      corp_code: corp, bgn_de: fmt(bgn), end_de: fmt(now), page_count: '40', page_no: '1',
    });
    list = res?.list || [];
  } catch {
    return []; // status 013(무데이터) 등 throw → 빈 배열
  }

  const out: DartEvent[] = [];
  for (const it of list) {
    const nm = it.report_nm || '';
    if (!MATERIAL_KW.some((kw) => nm.includes(kw))) continue;
    out.push({
      date: it.rcept_dt || '',
      report_nm: nm,
      rcept_no: it.rcept_no || '',
      url: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${it.rcept_no || ''}`,
    });
    if (out.length >= limit) break;
  }
  return out;
}
