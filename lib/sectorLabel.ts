// STEP 945 — 섹터 어휘 통일(판정 ⓐ, 장은태 2026-08-08): 야후·GICS·네이버(KR) 세 어휘를 GICS명 기준으로 한 곳에서만 매핑.
// 🔴 규칙 5-2 — 매핑을 한 곳에 둔다. 화면마다 복붙 금지. messages 키는 추가·삭제하지 않는다(기존 21키 그대로 재사용).
// 🔴 KR(네이버) 입력은 이 함수를 거치되 결과가 기존과 완전히 동일해야 한다(EtfLensClient.tsx 원래 SECTOR_KEYS와 동일 동작).

// (a) 야후 섹터키 → GICS 섹터명(11:1, 941 §1 확정 대응표)
export const YAHOO_TO_GICS: Record<string, string> = {
  technology: "Information Technology",
  financial_services: "Financials",
  consumer_cyclical: "Consumer Discretionary",
  consumer_defensive: "Consumer Staples",
  basic_materials: "Materials",
  healthcare: "Health Care",
  realestate: "Real Estate",
  communication_services: "Communication Services",
  industrials: "Industrials",
  energy: "Energy",
  utilities: "Utilities",
};

// (b) GICS 섹터명 → messages 키(EtfLens.sector, 기존 21키 중 11개 그대로 재사용 — 신규 키 0개)
export const GICS_TO_MESSAGE_KEY: Record<string, string> = {
  "Information Technology": "it",
  Financials: "financials",
  "Consumer Discretionary": "consumer_discretionary",
  "Consumer Staples": "consumer_staples",
  Materials: "materials",
  "Health Care": "health_care",
  "Communication Services": "communication",
  Industrials: "industrials",
  Energy: "energy",
  Utilities: "utilities",
  "Real Estate": "real_estate",
};

export const GICS_SECTORS = Object.keys(GICS_TO_MESSAGE_KEY);

// 네이버(KR) 등 기존에 messages 키를 원문 그대로 쓰던 입력 — 야후 변환표에 없으면 이 목록에서 직접 조회(기존 EtfLensClient.tsx SECTOR_KEYS의 "네이버(KR)" 절과 동일).
const NATIVE_MESSAGE_KEYS = new Set([
  "it", "financials", "materials", "health_care", "consumer_discretionary", "consumer_staples",
  "communication", "real_estate", "unclassified", "etc", "industrials", "energy", "utilities",
]);

type Translate = (key: string) => string;

/**
 * 섹터 원문 키 → 번역 라벨. 야후 키는 GICS를 거쳐 messages 키로, 그 외(KR 네이버 등)는 기존처럼 직접 조회.
 * 매핑에 없으면 원문을 그대로 반환(기존 sectorLabel 동작과 동일 — 규칙 5-2, 지어내지 않음).
 */
export function sectorLabel(key: string, t: Translate): string {
  const raw = (key ?? "").toLowerCase();
  const gics = YAHOO_TO_GICS[raw];
  if (gics) {
    const msgKey = GICS_TO_MESSAGE_KEY[gics];
    return msgKey ? t(`sector.${msgKey}`) : key;
  }
  if (NATIVE_MESSAGE_KEYS.has(raw)) return t(`sector.${raw}`);
  return key;
}

/** GICS 섹터명(예: "Information Technology") → messages 키. 필터 칩 등 GICS명으로 이미 정규화된 값을 번역할 때. */
export function gicsLabel(gicsSector: string, t: Translate): string {
  const msgKey = GICS_TO_MESSAGE_KEY[gicsSector];
  return msgKey ? t(`sector.${msgKey}`) : gicsSector;
}

/**
 * STEP 945 §4/§5-5 — Explore US 거래대금 리스트의 섹터 필터 로직(순수함수로 분리해 테스트 가능하게).
 * filter='all'이면 원복(입력 그대로), 그 외에는 sectorOf(item)===filter인 것만 남긴다.
 */
export function filterBySector<T>(items: T[], filter: string, sectorOf: (item: T) => string | undefined): T[] {
  if (filter === "all") return items;
  return items.filter((item) => sectorOf(item) === filter);
}
