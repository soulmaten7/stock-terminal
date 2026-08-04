// 🔴 896 §2/§4 — skip_reason → 화면 문구 키. 계산 로직이 아니라 표시 매핑이다(REVDCF_SPEC §10 896).
//   여기 없는 값(미래에 새로 생기는 사유 포함)은 전부 "unspecified" 폴백으로 떨어진다.
//   889 원칙: 확인 안 된 구체적 원인은 단정하지 않는다. HTTP_*는 접두어라 열거로 못 막아 별도 startsWith로 처리.
export const SKIP_KEY_MAP: Record<string, string> = {
  INSUFFICIENT_HISTORY: "insufficientHistory",
  NOT_APPLICABLE_SECTOR: "notApplicableSector",
  NO_INDUSTRY: "noIndustry",
  NO_MARGINAL_CAPEX: "noMarginalCapex",
  STALE_MARKETCAP: "staleMarketcap",
  NO_MARKETCAP: "noMarketcap",
  MULTI_CLASS_SHARES: "multiClassShares",
  EX: "exception",
  // 🔴 896 이전 행은 이 코드 그대로 DB에 저장돼 있어 문구를 남겨둔다 — 지우면 과거 행이 오표시된다.
  MISSING_TAG: "missingTag",
  MISSING_TAG_OPERATING_INCOME: "missingTagOperatingIncome",
  MISSING_TAG_PPE: "missingTagPpe",
  MISSING_TAG_OPERATING_CASH: "missingTagOperatingCash",
};

export function skipKeyFor(skipReason: string | null): string {
  if (!skipReason) return "unspecified";
  if (skipReason.startsWith("HTTP_")) return "httpError";
  return SKIP_KEY_MAP[skipReason] ?? "unspecified";
}
