import { describe, it, expect } from "vitest";
import { passesGuard, containsBannedWords, passesLanguageGuard, buildFallbackBrief, type BriefFacts } from "./dailyBrief";

const facts: BriefFacts = {
  indices: [{ name: "코스피", changePct: 3.56 }],
  counts: { total: 138, pos: 34, warn: 55 },
  movers: [{ name: "삼성전자", lensName: "모멘텀", from: "뚜렷한 추세 없음", to: "강한 상승 추세" }],
  overnightUs: { name: "S&P 500", changePct: 0.8 },
};

describe("dailyBrief guard", () => {
  it("rejects LLM output containing a banned recommendation word (ko) — falls back to deterministic template", () => {
    const llmOutput = "어제 코스피는 강세였고, 반도체 대형주 매수를 추천합니다.";
    expect(containsBannedWords(llmOutput, "ko")).toBe(true);
    expect(passesGuard(llmOutput, "ko")).toBe(false);

    const fallback = buildFallbackBrief(facts, "ko");
    expect(containsBannedWords(fallback, "ko")).toBe(false);
    expect(fallback).toContain("코스피 +3.56%");
    expect(fallback).toContain("강점 34·주의 55");
  });

  it("rejects LLM output containing a banned word (en)", () => {
    const llmOutput = "We recommend buying this dip before it rises further.";
    expect(containsBannedWords(llmOutput, "en")).toBe(true);
    expect(passesGuard(llmOutput, "en")).toBe(false);
  });

  it("accepts clean fact-only text with no banned words", () => {
    const clean = "어제 코스피는 3.56% 올랐다. 렌즈 전환은 138건, 강점 34건·주의 55건이었다.";
    expect(containsBannedWords(clean, "ko")).toBe(false);
    expect(passesGuard(clean, "ko")).toBe(true);
  });

  it("language guard: ko text must contain Hangul, en text must not", () => {
    expect(passesLanguageGuard("어제 코스피는 올랐다.", "ko")).toBe(true);
    expect(passesLanguageGuard("Yesterday the KOSPI rose.", "ko")).toBe(false);
    expect(passesLanguageGuard("Yesterday the KOSPI rose.", "en")).toBe(true);
    expect(passesLanguageGuard("어제 코스피는 올랐다.", "en")).toBe(false);
  });

  it("empty text never passes the guard", () => {
    expect(passesGuard("   ", "ko")).toBe(false);
  });
});
