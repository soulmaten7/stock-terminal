// US 상장명 정리 — 순수 함수만(서버 전용 import 없음) → 서버(lib/stockName.ts)·클라이언트 컴포넌트 양쪽에서 안전하게 재사용(STEP 765b).
// ⚠️ lib/stockName.ts는 createAdminClient(SERVICE_ROLE_KEY)를 쓰므로 클라 컴포넌트에서 직접 import 금지 — 이 파일만 공유.

// SEC 올대문자 종목명(예 "MICRON TECHNOLOGY INC") → 스마트 title-case("Micron Technology Inc").
// 올대문자일 때만 처리(mixed-case는 이미 정상). 약어(IBM·3M·AT&T)·camelcase 브랜드(JPMorgan·eBay)는 보존.
const KEEP = new Set(['IBM','AMD','HP','3M','AT&T','KKR','UPS','AIG','MGM','CVS','PNC','BNY','USA','ETF','ETN','REIT','PLC','LLC','LP','NV','SA','AG','SE','AB','ADR','HD','GE','GM']); // 약어·법인형 그대로
const CAMEL: Record<string,string> = { JPMORGAN:'JPMorgan', EBAY:'eBay', ISHARES:'iShares', PAYPAL:'PayPal', PROSHARES:'ProShares', POWERSHARES:'PowerShares', LPL:'LPL', MSCI:'MSCI', SPDR:'SPDR' };
const SUFFIX: Record<string,string> = { INC:'Inc', CORP:'Corp', CO:'Co', LTD:'Ltd', COMPANY:'Company', HOLDINGS:'Holdings', GROUP:'Group', TECHNOLOGIES:'Technologies', TECHNOLOGY:'Technology', INTERNATIONAL:'International', INDUSTRIES:'Industries', SYSTEMS:'Systems', ENTERPRISES:'Enterprises', PHARMACEUTICALS:'Pharmaceuticals', FINANCIAL:'Financial', MOTORS:'Motors', ENERGY:'Energy', TRUST:'Trust', INCORPORATED:'Incorporated', 'N.V.':'N.V.', 'S.A.':'S.A.' };

export function titleCaseUsName(n: string): string {
  if (/[a-z]/.test(n)) return n;              // 이미 mixed-case면 그대로
  return n.split(/\s+/).map((w) => {
    const u = w.toUpperCase();
    if (KEEP.has(u)) return u;                // 약어 그대로
    if (CAMEL[u]) return CAMEL[u];            // camelcase 브랜드
    if (SUFFIX[u]) return SUFFIX[u];          // 법인 접미
    if (/^\d/.test(w)) return w;              // 3M·1ST 등 숫자 시작 그대로
    // 하이픈·앰퍼샌드 포함 토큰도 각 조각 title-case
    return w.replace(/[A-Za-z]+/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
  }).join(' ');
}

// US 상장명 잡음 제거: "Apple Inc. - Common Stock" → "Apple Inc." (야후 lens명과 정합·제목 깔끔)
export function cleanUsName(n: string): string {
  const c = n
    .replace(/\s*[-–]?\s*Common Stock\s*$/i, "")
    .replace(/\s*[-–]?\s*Common Shares\s*$/i, "")
    .replace(/\s*[-–]?\s*Ordinary Shares\s*$/i, "")
    .replace(/[,\-–·\s]+$/, "") // 꼬리 잔여물(대시·쉼표·가운뎃점 등) 제거(STEP 775 §3 — 예: "... Inc. -" → "... Inc.")
    .trim();
  return titleCaseUsName(c || n);
}
