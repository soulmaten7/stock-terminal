// STEP 896 §5 — 895가 찾은 오표시(알 수 없는 사유가 missingTag로 떨어짐) 회귀 방지.
import { describe, it, expect } from "vitest";
import { skipKeyFor } from "./skipKey";

describe("skipKeyFor — 896 §2 안전망(중립 폴백)", () => {
  it("알 수 없는 skip_reason은 missingTag가 아니라 unspecified로 간다(895 오표시 회귀 방지)", () => {
    expect(skipKeyFor("SOME_FUTURE_REASON_NOT_YET_MAPPED")).toBe("unspecified");
    expect(skipKeyFor("SOME_FUTURE_REASON_NOT_YET_MAPPED")).not.toBe("missingTag");
  });

  it("null skip_reason도 unspecified로 간다", () => {
    expect(skipKeyFor(null)).toBe("unspecified");
  });

  it("HTTP_* 는 상태코드와 무관하게 전용 문구(httpError)로 간다 — 열거가 아니라 접두어 매칭", () => {
    expect(skipKeyFor("HTTP_404")).toBe("httpError");
    expect(skipKeyFor("HTTP_503")).toBe("httpError");
    expect(skipKeyFor("HTTP_999")).toBe("httpError"); // 매핑에 없는 상태코드라도 커버돼야 함
  });

  it("895가 지목한 4종(문구 없이 missingTag로 오표시되던 사유)이 각각 전용 키를 갖는다", () => {
    expect(skipKeyFor("NO_MARKETCAP")).toBe("noMarketcap");
    expect(skipKeyFor("MULTI_CLASS_SHARES")).toBe("multiClassShares");
    expect(skipKeyFor("EX")).toBe("exception");
    expect(skipKeyFor("HTTP_500")).toBe("httpError");
    for (const wrong of ["noMarketcap", "multiClassShares", "exception", "httpError"]) {
      // 위 4종 어느 것도 missingTag로 떨어지면 안 된다(895가 발견한 정확히 그 결함).
      expect(wrong).not.toBe("missingTag");
    }
  });

  it("과거 행(896 이전)의 MISSING_TAG는 여전히 missingTag 문구로 남는다", () => {
    expect(skipKeyFor("MISSING_TAG")).toBe("missingTag");
  });

  it("MISSING_TAG 3분기(896 §4) — 세 신규 코드가 서로 다른 키로 간다", () => {
    const oi = skipKeyFor("MISSING_TAG_OPERATING_INCOME");
    const ppe = skipKeyFor("MISSING_TAG_PPE");
    const cash = skipKeyFor("MISSING_TAG_OPERATING_CASH");
    expect(oi).toBe("missingTagOperatingIncome");
    expect(ppe).toBe("missingTagPpe");
    expect(cash).toBe("missingTagOperatingCash");
    expect(new Set([oi, ppe, cash]).size).toBe(3); // 서로 겹치지 않는다
  });
});
