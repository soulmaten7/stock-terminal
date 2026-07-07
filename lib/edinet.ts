// EDINET(金融庁) 공시 클라이언트 — 일본 상장사 공시 = US EDGAR·KR DART의 JP 짝.
// documents.json은 '날짜별' 조회만 되고 회사 필터가 없어 → 크론이 매일 긁어 jp_disclosures에 미리계산.
// 키는 process.env.EDINET_API_KEY (코드/깃엔 값 없음).
const BASE = "https://api.edinet-fsa.go.jp/api/v2";

export type EdinetDoc = {
  docID: string;
  secCode: string | null; // 5자리 증권코드 (예: 72030 = 7203)
  docTypeCode: string | null;
  docDescription: string | null;
  submitDateTime: string | null; // "YYYY-MM-DD HH:mm" (JST)
  currentReportReason: string | null; // 臨時報告書 사유 (있으면 중대공시)
};

// 종목 심볼(7203.T) → EDINET secCode(72030·5자리). 4자리 티커 + 체크숫자 "0".
export function secCodeOf(symbol: string): string | null {
  const m = symbol.match(/^(\d{4})\.T$/i);
  return m ? `${m[1]}0` : null;
}

// EDINET secCode(72030) → 종목 심볼(7203.T)
export function symbolFromSecCode(sec: string): string | null {
  const m = /^(\d{4})\d?$/.exec(sec);
  return m ? `${m[1]}.T` : null;
}

// 특정 날짜(YYYY-MM-DD)의 제출서류 일람. 상장사(secCode!=null)만 반환.
export async function fetchEdinetDocsForDate(date: string, key: string): Promise<EdinetDoc[]> {
  const url = `${BASE}/documents.json?date=${date}&type=2&Subscription-Key=${encodeURIComponent(key)}`;
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(20000) });
    if (!res.ok) return [];
    const j = await res.json();
    const results: unknown[] = Array.isArray(j?.results) ? j.results : [];
    const out: EdinetDoc[] = [];
    for (const r of results as Record<string, unknown>[]) {
      if (!r?.secCode || !r?.docID) continue; // 상장사(secCode)만·펀드/비상장 제외
      out.push({
        docID: String(r.docID),
        secCode: String(r.secCode),
        docTypeCode: r.docTypeCode ? String(r.docTypeCode) : null,
        docDescription: r.docDescription ? String(r.docDescription) : null,
        submitDateTime: r.submitDateTime ? String(r.submitDateTime) : null,
        currentReportReason: r.currentReportReason ? String(r.currentReportReason) : null,
      });
    }
    return out;
  } catch {
    return [];
  }
}
