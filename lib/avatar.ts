// 종목 아바타/로고 유틸 — 주요 종목은 실로고(favicon), 나머지는 레터 아바타 폴백.

const PALETTE = [
  "#FEE2E2", "#FEF3C7", "#D1FAE5", "#DBEAFE",
  "#EDE9FE", "#FCE7F3", "#E0F2FE", "#FEF9C3",
  "#FFE4E6", "#ECFCCB",
];

export function avatarBg(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function avatarChar(name: string): string {
  const t = (name || "").trim();
  return t ? t.charAt(0).toUpperCase() : "?";
}

// 종목코드(KR 6자리)/티커(US) → 회사 도메인. 주요 종목만(나머지는 아바타 폴백).
// 로고가 이상하게 나오는 종목은 이 맵의 도메인만 고치면 됨.
const DOMAIN_MAP: Record<string, string> = {
  // ── 국내 ──
  "005930": "samsung.com",          // 삼성전자
  "005935": "samsung.com",          // 삼성전자우
  "000660": "skhynix.com",          // SK하이닉스
  "035420": "navercorp.com",        // NAVER
  "035720": "kakaocorp.com",        // 카카오
  "005380": "hyundai.com",          // 현대차
  "000270": "kia.com",              // 기아
  "066570": "lge.co.kr",            // LG전자
  "068270": "celltrion.com",        // 셀트리온
  "207940": "samsungbiologics.com", // 삼성바이오로직스
  "006400": "samsungsdi.com",       // 삼성SDI
  "051910": "lgchem.com",           // LG화학
  "373220": "lgensol.com",          // LG에너지솔루션
  "015760": "kepco.co.kr",          // 한국전력
  "017670": "sktelecom.com",        // SK텔레콤
  "030200": "kt.com",               // KT
  "105560": "kbfg.com",             // KB금융
  "055550": "shinhangroup.com",     // 신한지주
  "086790": "hanafn.com",           // 하나금융지주
  "000810": "samsungfire.com",      // 삼성화재
  // ── 미국 ──
  AAPL: "apple.com",
  TSLA: "tesla.com",
  NVDA: "nvidia.com",
  MSFT: "microsoft.com",
  GOOGL: "google.com",
  AMZN: "amazon.com",
  META: "meta.com",
  NFLX: "netflix.com",
};

/** 주요 종목이면 실로고 URL, 아니면 null(→아바타 폴백) */
export function logoUrl(code: string): string | null {
  const domain = DOMAIN_MAP[code];
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
}
