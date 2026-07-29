// STEP 828 §1 — 공시요약 프롬프트 인젝션·출력 오염 방어(6개 summary 라우트 공용).
// 산출물은 전역 캐시(filing_summaries)에 저장돼 전 사용자 공유 → 오염 시 영구 노출. 입력 정화 + 출력 가드 2중.
import { passesLanguageGuard } from "./dailyBrief";
import type { Locale } from "./lensCopy";

// 클라이언트가 준 라벨(nm·items 등)을 프롬프트에 넣기 전 정화 — 다중행 지시문 주입 차단.
//   개행·탭·제어문자 제거(한 줄로) + 백틱/중괄호 제거 + 길이 상한(라벨은 원래 짧다). 산출물은 아래 가드로 2차 방어.
export function sanitizeFilingLabel(s: string | null | undefined, max = 80): string {
  return (s || "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[`{}]/g, "")
    .replace(/\p{Cc}/gu, "") // 개행 외 제어문자 제거
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

// 🔴 출력 가드용 금지어 — daily-brief의 광의 금지어(전망·예상·기대)를 그대로 쓰면 **사실 공시요약이 대량 오탐**된다
//   (실측: 삼성 주식처분·재무결과·배당·넷플릭스 실적 등 정상 요약이 '전망/기대' 단어로 걸림·실제 추천은 0건).
//   공시요약은 '사실만'이라 회사의 미래 진술을 사실로 옮길 수 있어야 함 → **추천/조언(주입 페이로드)만 차단**한다.
//   차단 대상 = 독자에게 사고팔라는 조언·목표가·유망 + 인젝션 마커(이전 지시 무시류). 사실 서술(처분·매출·전망 발표)은 통과.
// ⚠️ "목표가"는 "목표(goal)+가(주격조사)"("성과 목표가 달성")로 오탐 → 목표주가/가격문맥일 때만(목표가는·목표가 5만원). 실측 1건 오탐 제거.
// ⚠️ 바로 "추천"만 잡으면 "이사로 추천"(인사 선임)·"추천위원회"(Nomination Committee) 등 공시 사실이 대량 오탐(캐시 실측 2건).
//   → 추천은 매매/증권 문맥(종목·주식·매수·매도·투자·비중)에 붙을 때만 투자권유로 간주. 인물·위원회 추천은 통과.
const REC_KO = /(종목|주식|매수|매도|비중|투자)[^\s]{0,3}\s*추천|추천\s*(종목|주식|매수|매도)|목표주가|목표\s*주가|목표가\s*(는|은|:|[0-9₩$])|적정주가|유망주|매수하세요|매도하세요|사세요|파세요|사십시오|파십시오|강력\s*(매수|매도)|비중\s*(확대|축소)|지금\s*(사|팔)|투자의견/;
const REC_EN = /\b(recommend(?:ation|ed|s)?|target\s*price|price\s*target|strong\s*(buy|sell)|over\s*weight|under\s*weight|buy\s*now|sell\s*now|you\s*should\s*(buy|sell)|investment\s*(rating|opinion))\b/i;
// 인젝션 마커 — 모델이 주입 지시를 그대로 반영/에코하면 차단.
const INJECT = /이전\s*지시|앞의?\s*지시|시스템\s*프롬프트|규칙을?\s*무시|지시를?\s*무시|ignore\s+(the\s+)?(previous|above|prior|earlier)|disregard\s+(the\s+)?(previous|above|instruction)|system\s*prompt/i;

export function containsRecommendation(text: string, locale: Locale): boolean {
  if (INJECT.test(text)) return true;
  return locale === "ko" ? REC_KO.test(text) : REC_EN.test(text);
}

// LLM 공시요약 산출물 가드 — 추천/인젝션 차단 + 언어 검증(ko=한글 존재/en=한글 부재).
//   통과해야만 저장·노출. 결정론 폴백이 없으므로 실패 시 저장하지 않고 숨긴다(지어내지 않음).
export function filingSummaryPasses(text: string, locale: Locale): boolean {
  if (!text.trim()) return false;
  if (containsRecommendation(text, locale)) return false;
  if (!passesLanguageGuard(text, locale)) return false;
  return true;
}
