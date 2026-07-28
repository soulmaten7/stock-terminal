import { getDartCorpCode, fetchDart } from '@/lib/dart';

// KR 종목 최근 '중대' 공시(DART list.json). report_nm은 한국어 서술이라 키워드로 중대 여부 판단(결정론).
// US eightK(8-K item 코드)의 KR 짝. 여기선 목록만 — 원문 요약(R1-KR)은 STEP 596에서 얹음.
// 🔴 STEP 809 §4: 정기보고서(분기·반기·사업·감사)는 '정례 제출물'이라 8-K식 '중대 이벤트'가 아님 → 제거.
//   (실적·잠정실적은 이벤트성이라 유지). 안 그러면 "중대 공시" 목록에 정기 공시가 섞여 빈 문구 "정기 공시만"과 모순.
const MATERIAL_KW = [
  '유상증자', '무상증자', '감자', '합병', '분할', '영업(잠정)', '실적', '매출액', '영업이익',
  '배당', '자기주식', '자사주', '최대주주', '대주주', '상장폐지', '주요사항보고서',
  '전환사채', '신주인수권', '교환사채', '공급계약', '단일판매', '수주', '횡령', '배임', '소송', '회생', '파산',
  '잠정실적', '투자판단', '주식소각', '주식분할', '자산양수도',
];

export type DartEvent = { date: string; report_nm: string; rcept_no: string; url: string };
// 🔴 STEP 809 §4: 실패를 [](없음)로 삼키지 않고 구분 반환 — 라우트의 3상태(ok/fetch_failed/unsupported)가 실제 작동하게.
export type DartResult = { ok: true; events: DartEvent[] } | { ok: false; reason: 'unsupported' | 'fetch_failed' };

const fmt = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

// KR 티커(005930.KS·005930) → 6자리 코드 → corp_code → 최근 6개월 중대 공시.
export async function fetchDartMaterial(symbol: string, limit = 6): Promise<DartResult> {
  const code6 = symbol.replace(/\.(KS|KQ)$/i, '').trim();
  if (!/^\d{6}$/.test(code6)) return { ok: false, reason: 'unsupported' }; // KR 6자리만(비KR·미상장)

  let corp: string | null;
  try {
    corp = await getDartCorpCode(code6);
  } catch {
    return { ok: false, reason: 'fetch_failed' }; // corp_code 테이블 조회 자체가 실패 = 못 가져옴(없음 아님)
  }
  if (!corp) return { ok: false, reason: 'unsupported' }; // DART 매핑 없음(비상장·미등록) = 지원 안 함

  const now = new Date();
  const bgn = new Date(now.getTime() - 180 * 86400000);
  let list: Array<Record<string, string>>;
  try {
    const res = await fetchDart<{ list?: Array<Record<string, string>> }>('/list.json', {
      corp_code: corp, bgn_de: fmt(bgn), end_de: fmt(now), page_count: '100', page_no: '1',
    });
    list = res?.list || [];
  } catch {
    // 🔴 HTTP 오류·status≠000·키 없음 등 = '못 가져옴'(빈 배열로 삼키면 "사건 없어요" 거짓 단언). 실패로 전파.
    return { ok: false, reason: 'fetch_failed' };
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
  return { ok: true, events: out }; // 조회 성공(0건 포함) = 진짜 '없음'
}
