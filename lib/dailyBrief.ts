// "한 입 브리핑" — 오늘 화면 리드 문단(STEP 778). 결정론 사실(지수·렌즈 전환)만 입력 → LLM 1문단.
// 3중 가드: (1) 금지어 후처리 필터 (2) 언어 검증(ko 한글 존재·en 한글 부재) (3) 실패 시 결정론 폴백 → 어떤 경우에도 빈 값 없이 저장.
// 순수 함수만 이 파일에 둔다 — 유닛테스트(dailyBrief.test.ts)가 프롬프트/DB 없이 가드 로직만 검증할 수 있도록.
import { createAdminClient } from "./supabase/admin";

export type Locale = "ko" | "en";

export type IndexFact = { name: string; changePct: number };
export type MoverFact = { name: string; lensName: string; from: string; to: string };
export type BriefFacts = {
  indices: IndexFact[];
  counts: { total: number; pos: number; warn: number };
  movers: MoverFact[];
  overnightUs?: IndexFact | null; // KR 시장용(간밤 미국 한 줄) — US 시장은 null
};

// 금지어(STEP 778 명세 — 프롬프트 신뢰 금지, 산출물 후처리 검출).
const BANNED_KO = /전망|예상|추천|매수|매도|목표가|사야|팔아|오를 것|내릴 것|기대|유망/;
const BANNED_EN = /\b(forecast|outlook|recommend(?:ation)?s?|buy|sell|target price|expect(?:ed|ation)?|promising)\b/i;

export function containsBannedWords(text: string, locale: Locale): boolean {
  return locale === "ko" ? BANNED_KO.test(text) : BANNED_EN.test(text);
}

// 언어 검증 — 기존 코드베이스 패턴(news-brief 등) 재사용: ko는 한글 존재, en은 한글 부재.
export function passesLanguageGuard(text: string, locale: Locale): boolean {
  const hasHangul = /[가-힣]/.test(text);
  return locale === "ko" ? hasHangul : !hasHangul;
}

// LLM 산출물이 이 가드를 통과해야만 채택 — 실패 시 호출부가 buildFallbackBrief로 대체.
export function passesGuard(text: string, locale: Locale): boolean {
  if (!text.trim()) return false;
  if (containsBannedWords(text, locale)) return false;
  if (!passesLanguageGuard(text, locale)) return false;
  return true;
}

function pctText(v: number): string {
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

// 결정론 폴백 — 사실을 그대로 문장으로 조립(가드 실패·LLM 실패 시에도 항상 값이 있도록).
export function buildFallbackBrief(facts: BriefFacts, locale: Locale): string {
  const idxSep = locale === "en" ? ", " : "·";
  const idxSentence = facts.indices.map((i) => `${i.name} ${pctText(i.changePct)}`).join(idxSep);
  const moversText = facts.movers.length
    ? locale === "en"
      ? ` ${facts.movers.map((m) => `${m.name} moved ${m.lensName} ${m.from}→${m.to}`).join(", ")}.`
      : ` ${facts.movers.map((m) => `${m.name}는 ${m.lensName} ${m.from}→${m.to} 전환`).join(", ")}.`
    : "";
  const usText = facts.overnightUs
    ? locale === "en"
      ? ` Overnight, ${facts.overnightUs.name} ${pctText(facts.overnightUs.changePct)}.`
      : ` 간밤 미국은 ${facts.overnightUs.name} ${pctText(facts.overnightUs.changePct)}.`
    : "";
  return locale === "en"
    ? `Yesterday ${idxSentence}. Lens transitions: ${facts.counts.total} total — ${facts.counts.pos} strong, ${facts.counts.warn} caution.${moversText}${usText}`
    : `어제 ${idxSentence}. 렌즈 전환 ${facts.counts.total}건 — 강점 ${facts.counts.pos}·주의 ${facts.counts.warn}.${moversText}${usText}`;
}

// LLM 프롬프트에 넣을 사실 목록(사람이 읽기 좋은 불릿) — facts 밖 내용 추가 금지를 위해 이 텍스트만 근거로 준다.
export function factsToPromptText(facts: BriefFacts, locale: Locale): string {
  const idxLines = facts.indices.map((i) => `- ${i.name}: ${pctText(i.changePct)}`).join("\n");
  const moverLines = facts.movers.map((m) => `- ${m.name}: ${m.lensName} ${m.from} → ${m.to}`).join("\n");
  const usBlock = facts.overnightUs
    ? locale === "en"
      ? `\n\n[Overnight US]\n- ${facts.overnightUs.name}: ${pctText(facts.overnightUs.changePct)}`
      : `\n\n[간밤 미국]\n- ${facts.overnightUs.name}: ${pctText(facts.overnightUs.changePct)}`
    : "";
  return locale === "en"
    ? `[Index changes]\n${idxLines}\n\n[Lens transitions]\nTotal ${facts.counts.total}, strong ${facts.counts.pos}, caution ${facts.counts.warn}\n\n[Top movers by trade value]\n${moverLines}${usBlock}`
    : `[지수 등락]\n${idxLines}\n\n[렌즈 전환]\n전체 ${facts.counts.total}건, 강점 ${facts.counts.pos}, 주의 ${facts.counts.warn}\n\n[거래대금 상위 전환 종목]\n${moverLines}${usBlock}`;
}

export type DailyBriefRow = {
  brief_date: string;
  market: "KR" | "US";
  text_ko: string | null;
  text_en: string | null;
  created_at: string;
};

// 오늘 화면 서버 프리페치용(STEP 771 패턴) — 해당 시장 최신 행(오늘자 없으면 최신) 1건.
export async function getLatestDailyBrief(market: "KR" | "US"): Promise<DailyBriefRow | null> {
  const sb = createAdminClient();
  const { data } = await sb
    .from("daily_brief")
    .select("brief_date,market,text_ko,text_en,created_at")
    .eq("market", market)
    .order("brief_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as DailyBriefRow | null) ?? null;
}
