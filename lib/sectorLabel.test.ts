// STEP 945 §5 — sectorLabel 유닛테스트: 야후→GICS 11개(ko·en) · KR(네이버) 회귀 · 매핑 밖 값.
import { describe, it, expect } from "vitest";
import koRaw from "../messages/ko.json";
import enRaw from "../messages/en.json";
import { sectorLabel, gicsLabel, filterBySector, YAHOO_TO_GICS, GICS_TO_MESSAGE_KEY, GICS_SECTORS } from "./sectorLabel";

const ko = (koRaw as { EtfLens: { sector: Record<string, string> } }).EtfLens.sector;
const en = (enRaw as { EtfLens: { sector: Record<string, string> } }).EtfLens.sector;
const tKo = (key: string) => ko[key.replace("sector.", "")] ?? key;
const tEn = (key: string) => en[key.replace("sector.", "")] ?? key;

describe("sectorLabel — 야후 → GICS 11개", () => {
  const yahooKeys = Object.keys(YAHOO_TO_GICS);
  it.each(yahooKeys)("야후 키 '%s' → messages 원문과 일치(ko)", (k) => {
    const gics = YAHOO_TO_GICS[k];
    const msgKey = GICS_TO_MESSAGE_KEY[gics];
    expect(sectorLabel(k, tKo)).toBe(ko[msgKey]);
  });
  it.each(yahooKeys)("야후 키 '%s' → messages 원문과 일치(en)", (k) => {
    const gics = YAHOO_TO_GICS[k];
    const msgKey = GICS_TO_MESSAGE_KEY[gics];
    expect(sectorLabel(k, tEn)).toBe(en[msgKey]);
  });

  it("11개 GICS 섹터 전부 대응된다(빠짐 없음)", () => {
    const gicsValues = new Set(Object.values(YAHOO_TO_GICS));
    expect(gicsValues.size).toBe(11);
    expect(GICS_SECTORS.length).toBe(11);
  });
});

describe("sectorLabel — 🔴 KR(네이버) 회귀: 기존과 동일한 라벨", () => {
  const naverKeys = ["it", "financials", "materials", "health_care", "consumer_discretionary", "consumer_staples", "communication", "real_estate", "unclassified", "etc"];
  it.each(naverKeys)("네이버 키 '%s' → 기존 messages 값 그대로(ko)", (k) => {
    expect(sectorLabel(k, tKo)).toBe(ko[k]);
  });
  it.each(naverKeys)("네이버 키 '%s' → 기존 messages 값 그대로(en)", (k) => {
    expect(sectorLabel(k, tEn)).toBe(en[k]);
  });
});

describe("sectorLabel — 매핑에 없는 값", () => {
  it("원문을 그대로 반환한다(지어내지 않음)", () => {
    expect(sectorLabel("weird_unknown_sector", tKo)).toBe("weird_unknown_sector");
  });
  it("빈 문자열·null 유사값도 원문 그대로", () => {
    expect(sectorLabel("", tKo)).toBe("");
  });
});

describe("gicsLabel — GICS 섹터명(정규화된 값) → 라벨", () => {
  it("11개 GICS명 전부 messages 원문과 일치(ko)", () => {
    for (const gics of GICS_SECTORS) expect(gicsLabel(gics, tKo)).toBe(ko[GICS_TO_MESSAGE_KEY[gics]]);
  });
  it("매핑에 없는 GICS명은 원문 그대로", () => {
    expect(gicsLabel("Not A Real Sector", tKo)).toBe("Not A Real Sector");
  });
});

// STEP 945 §5-5 — 섹터 필터: 선택 시 해당 섹터만 남는다 · 전체 선택 시 원복.
describe("filterBySector", () => {
  const rows = [
    { symbol: "AAPL", sector: "Information Technology" },
    { symbol: "SONY", sector: "Information Technology" },
    { symbol: "XOM", sector: "Energy" },
  ];
  const sectorOf = (r: (typeof rows)[number]) => r.sector;

  it("특정 섹터 선택 시 그 섹터만 남는다", () => {
    expect(filterBySector(rows, "Energy", sectorOf)).toEqual([{ symbol: "XOM", sector: "Energy" }]);
  });

  it("🔴 'all' 선택 시 원복(입력 그대로, 필터링 안 함)", () => {
    expect(filterBySector(rows, "all", sectorOf)).toEqual(rows);
    expect(filterBySector(rows, "all", sectorOf)).toBe(rows); // 같은 참조 — 새 배열을 안 만듦
  });

  it("일치하는 섹터가 없으면 빈 배열", () => {
    expect(filterBySector(rows, "Materials", sectorOf)).toEqual([]);
  });

  it("sectorOf가 undefined를 반환해도(섹터 미분류) 안전하게 걸러진다", () => {
    const withUnclassified = [...rows, { symbol: "FOO", sector: undefined as unknown as string }];
    expect(filterBySector(withUnclassified, "Energy", (r) => r.sector)).toEqual([{ symbol: "XOM", sector: "Energy" }]);
  });
});
