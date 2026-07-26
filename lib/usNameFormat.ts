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

// ADR·주식종류 수식어(STEP 790) — 이 구절이 시작되는 지점부터 문자열 끝까지 통째 절단(뒤따르는 괄호 설명 포함).
// 예: "RELX PLC PLC American Depositary Shares (Each representing One Ordinary Share)" → "RELX PLC".
// 케이스 무시로 매칭하되 원본 대소문자는 그대로 보존(자르기만 하지 다시 title-case 안 함).
const SHARE_CLASS_TRIGGERS: RegExp[] = [
  /american\s+depositary\s+shares?/i,
  /american\s+depository\s+shares?/i,
  /each\s+representing/i,
  /represent(?:ing|s)\b/i,
  /class\s+[a-c]\s+common\s+stock/i,
  /common\s+stock/i,
  /depositary\s+shares?/i,
  /ordinary\s+shares?/i,
  /new\s+york\s+registry\s+shares?/i,
  /series\s+[a-z]\s+preferred/i,
];

// 여러 트리거 중 문자열에서 가장 먼저(왼쪽) 나타나는 지점을 절단선으로 — "Class A Common Stock"처럼 더 구체적인
// 패턴이 있어도 위치가 이르면 그쪽이 이긴다(더 넓게 자름 방지가 아니라 "그 구절부터" 요구사항 그대로).
function stripShareClassSuffix(n: string): string {
  let cutIndex = -1;
  for (const re of SHARE_CLASS_TRIGGERS) {
    const m = re.exec(n);
    if (m && (cutIndex === -1 || m.index < cutIndex)) cutIndex = m.index;
  }
  if (cutIndex === -1) return n;
  const cut = n.slice(0, cutIndex).replace(/[,\-–·\s(]+$/, "").trim();
  return cut.length >= 2 ? cut : n; // 선행조건: 절단 후 2자 미만이면 절단 취소(이름 증발 방지)
}

// 연속(인접) 중복 법인형 토큰만 축약(STEP 790) — "PLC PLC"→"PLC"·"Inc. Inc."→"Inc.". 비인접 중복은 보존(고유명사 오손 방지).
function dedupeAdjacentTokens(n: string): string {
  const words = n.split(/\s+/);
  const out: string[] = [];
  for (const w of words) {
    const prev = out[out.length - 1];
    if (prev && prev.toLowerCase() === w.toLowerCase()) continue;
    out.push(w);
  }
  return out.join(' ');
}

// US 상장명 잡음 제거: "Apple Inc. - Common Stock" → "Apple Inc." (야후 lens명과 정합·제목 깔끔)
// ⚠️ 멱등 아님(STEP 790 실측) — 원본 raw 이름에만 호출할 것. 이미 이 함수를 거친 결과를 또 넣으면(예: 짧아진 "RELX PLC"를
// 다시 title-case 판정) 원래 대문자 약어가 재캐이싱돼 틀어질 수 있다("RELX PLC"→"Relx PLC"). 호출부가 여러 단계라면
// resolveDisplayName() 한 곳에서만 이 함수를 타게 하고, 그 전 단계는 raw 이름을 그대로 보관할 것.
export function cleanUsName(n: string): string {
  const c = n
    .replace(/\s*[-–]?\s*Common Stock\s*$/i, "")
    .replace(/\s*[-–]?\s*Common Shares\s*$/i, "")
    .replace(/\s*[-–]?\s*Ordinary Shares\s*$/i, "")
    .replace(/[,\-–·\s]+$/, "") // 꼬리 잔여물(대시·쉼표·가운뎃점 등) 제거(STEP 775 §3 — 예: "... Inc. -" → "... Inc.")
    .trim();
  const cased = titleCaseUsName(c || n);
  return dedupeAdjacentTokens(stripShareClassSuffix(cased));
}
