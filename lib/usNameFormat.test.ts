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
