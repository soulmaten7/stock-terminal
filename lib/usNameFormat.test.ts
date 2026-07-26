import { describe, it, expect } from "vitest";
import { cleanUsName } from "./usNameFormat";

describe("cleanUsName — US 상장명 잡음 제거", () => {
  it("Common Stock/Shares 접미사 제거", () => {
    expect(cleanUsName("Apple Inc. - Common Stock")).toBe("Apple Inc.");
    expect(cleanUsName("Microsoft Corporation Common Shares")).toBe("Microsoft Corporation");
  });

  it("꼬리 잔여물(대시·쉼표 등) 제거 — STEP 775 §3", () => {
    expect(cleanUsName("Warner Bros. Discovery, Inc. -")).toBe("Warner Bros. Discovery, Inc.");
    expect(cleanUsName("Sandisk Corporation -")).toBe("Sandisk Corporation");
    expect(cleanUsName("Some Company,")).toBe("Some Company");
  });

  it("정상 이름은 그대로", () => {
    expect(cleanUsName("Micron Technology, Inc.")).toBe("Micron Technology, Inc.");
  });
});

describe("cleanUsName — ADR/주식종류 수식어 절단 + 중복 토큰 정리 (STEP 790)", () => {
  it("RELX 케이스 — 중복 PLC + ADR 수식어 + 괄호 설명 전부 제거", () => {
    expect(cleanUsName("RELX PLC PLC American Depositary Shares (Each representing One Ordinary Share)")).toBe("RELX PLC");
  });

  it("American Depositary Share(s)/Depository Share(s) — 구절부터 끝까지 절단", () => {
    expect(cleanUsName("Sanofi - American Depositary Shares")).toBe("Sanofi");
    expect(cleanUsName("NOVONIX Limited - American Depository Shares")).toBe("NOVONIX Limited");
    expect(cleanUsName("Ambev S.A. American Depositary Shares (Each representing 1 Common Share)")).toBe("Ambev S.A.");
  });

  it("Ordinary Share(s) 절단 — Class A/B/C는 보존(공통 주식종류 표기·의미 있음)", () => {
    expect(cleanUsName("Armada Acquisition Corp. III - Class A Ordinary Share")).toBe("Armada Acquisition Corp. III - Class A");
    expect(cleanUsName("Accenture plc Class A Ordinary Shares (Ireland)")).toBe("Accenture plc Class A");
  });

  it("Class A/B/C Common Stock — 실제 데이터 케이스(라이브 us_symbols.json)", () => {
    expect(cleanUsName("Green Dot Corporation Class A Common Stock, $0.001 par value")).toBe("Green Dot Corporation");
    // 실제 XYZ(Block) 원본 — 꼬리 쉼표 때문에 기존 정규식(끝 앵커 $)이 못 걸려 "Class A Common Stock"째 새 로직이 절단(정상 — 결과는 여전히 식별 가능).
    expect(cleanUsName("Block, Inc. Class A Common Stock,")).toBe("Block, Inc.");
  });

  it("Represent(ing|s) … — 접두 단어 없이도 절단", () => {
    expect(cleanUsName("Hess Midstream LP Class A Representing Limited Partner Interests")).toBe("Hess Midstream LP Class A");
    expect(cleanUsName("Global Partners LP Common Units representing Limited Partner Interests")).toBe("Global Partners LP Common Units");
  });

  it("New York Registry Shares / Series [A-Z] Preferred 절단", () => {
    expect(cleanUsName("Aegon Ltd. New York Registry Shares")).toBe("Aegon Ltd.");
  });

  it("절단 후 2자 미만이면 절단 취소(이름 증발 방지) — 기존 trailing-anchor 정규식이 안 건드리는 트리거로 검증", () => {
    // "American Depositary Shares"는 문자열 끝 고정 아님(기존 정규식 3종엔 없음) → 새 로직만 단독으로 시험됨.
    // 절단하면 "A"(1자) 뿐이라 선행조건에 걸려 절단 자체를 취소 — 원본 그대로.
    expect(cleanUsName("A American Depositary Shares")).toBe("A American Depositary Shares");
  });

  it("연속(인접) 중복 법인형 토큰만 축약 — 비인접 반복은 보존", () => {
    // mixed-case 입력이라야 title-case 단계가 스킵돼 dedupe만 단독으로 시험됨(전부 대문자면 KEEP 목록에 없는 토큰이 재캐이싱돼 다른 걸 테스트하게 됨).
    expect(cleanUsName("Some Corp PLC PLC")).toBe("Some Corp PLC");
    // 비인접 전체 반복(다른 데이터 품질 이슈, 예: TX Ternium)은 이번 STEP 스코프 밖이라 그대로 남는다.
    expect(cleanUsName("Ternium S.A. Ternium S.A.")).toBe("Ternium S.A. Ternium S.A.");
  });

  it("기존 케이스 회귀 없음 — 약어·camelCase 브랜드 불변", () => {
    expect(cleanUsName("IBM CORP")).toBe("IBM Corp");
    expect(cleanUsName("3M COMPANY")).toBe("3M Company");
    expect(cleanUsName("EBAY INC")).toBe("eBay Inc");
    expect(cleanUsName("JPMORGAN CHASE & CO")).toBe("JPMorgan Chase & Co");
  });
});
