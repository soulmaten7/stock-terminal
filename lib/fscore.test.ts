// 특성화 테스트 — computeFScore의 현재 출력을 고정(동작 불변 보증). 로직은 STEP696(stockholdersEquity 필드) 외 불변.
import { describe, it, expect } from "vitest";
import { computeFScore, type FRow } from "./fscore";

// 2년치 재무 픽스처(오름차순) — 필수 필드 충족 → supported. T가 P보다 개선된 형태로 구성.
const rowsAsc: FRow[] = [
  {
    date: "2023-12-31",
    totalRevenue: 1000,
    grossProfit: 400,
    costOfRevenue: 600,
    netIncome: 80,
    totalAssets: 2000,
    currentAssets: 500,
    currentLiabilities: 300,
    longTermDebt: 600,
    operatingCashFlow: 120,
    ordinarySharesNumber: 1000,
    stockholdersEquity: 900,
  },
  {
    date: "2024-12-31",
    totalRevenue: 1200,
    grossProfit: 540,
    costOfRevenue: 660,
    netIncome: 140,
    totalAssets: 2100,
    currentAssets: 650,
    currentLiabilities: 300,
    longTermDebt: 500,
    operatingCashFlow: 200,
    ordinarySharesNumber: 1000,
    stockholdersEquity: 1000,
  },
];

describe("computeFScore — 특성화", () => {
  it("정상 2년치: 전체 FScore 결과 고정", () => {
    expect(computeFScore(rowsAsc)).toMatchInlineSnapshot(`
      {
        "asOf": "2024-12-31",
        "criteria": [
          {
            "group": "수익성",
            "key": "roa_pos",
            "label": "ROA 양수",
            "note": "ROA 6.7%",
            "pass": true,
            "plain": "돈을 벌어요·흑자",
          },
          {
            "group": "수익성",
            "key": "cfo_pos",
            "label": "영업현금흐름 양수",
            "note": "CFO 200",
            "pass": true,
            "plain": "팔아서 진짜 현금이 들어와요",
          },
          {
            "group": "수익성",
            "key": "roa_up",
            "label": "ROA 개선",
            "note": "4.0% → 6.7%",
            "pass": true,
            "plain": "작년보다 더 잘 벌어요",
          },
          {
            "group": "수익성",
            "key": "accrual",
            "label": "이익의 질",
            "note": "현금 200 · 순익 140",
            "pass": true,
            "plain": "번 돈이 진짜 통장에 들어와요",
          },
          {
            "group": "재무 안정성",
            "key": "lever_dn",
            "label": "장기부채비율 하락",
            "note": "30.0% → 23.8%",
            "pass": true,
            "plain": "빚 부담이 줄었어요",
          },
          {
            "group": "재무 안정성",
            "key": "liq_up",
            "label": "유동비율 개선",
            "note": "1.67 → 2.17",
            "pass": true,
            "plain": "급할 때 갚을 돈이 늘었어요",
          },
          {
            "group": "재무 안정성",
            "key": "no_dilute",
            "label": "신주발행 없음",
            "note": "1000 → 1000",
            "pass": true,
            "plain": "주식을 새로 안 찍어냈어요",
          },
          {
            "group": "효율성",
            "key": "margin_up",
            "label": "매출총이익률 개선",
            "note": "40.0% → 45.0%",
            "pass": true,
            "plain": "팔면 남는 게 많아졌어요",
          },
          {
            "group": "효율성",
            "key": "turn_up",
            "label": "자산회전율 개선",
            "note": "0.50 → 0.57",
            "pass": true,
            "plain": "가진 걸로 더 많이 팔아요",
          },
        ],
        "grade": "우량",
        "max": 9,
        "score": 9,
        "supported": true,
      }
    `);
  });

  it("1년치 미만: 미지원(2년 부족)", () => {
    expect(computeFScore([rowsAsc[1]])).toMatchInlineSnapshot(`
      {
        "criteria": [],
        "grade": "-",
        "max": 9,
        "reason": "재무 데이터 2년치가 부족해요",
        "score": 0,
        "supported": false,
      }
    `);
  });

  it("은행형(매출총이익 없음): 미지원", () => {
    const bank: FRow[] = [
      { ...rowsAsc[0], grossProfit: null, costOfRevenue: null, totalRevenue: null },
      { ...rowsAsc[1], grossProfit: null, costOfRevenue: null, totalRevenue: null },
    ];
    expect(computeFScore(bank)).toMatchInlineSnapshot(`
      {
        "criteria": [],
        "grade": "-",
        "max": 9,
        "reason": "이 종목은 은행·보험이라 점수를 낼 수 없어요 — 그런 회사는 재무 구조가 보통 기업과 달라서요.",
        "score": 0,
        "supported": false,
      }
    `);
  });

  it("stockholdersEquity 필드 존재 확인(STEP696): supported 결과에 반영", () => {
    const r = computeFScore(rowsAsc);
    expect(r.supported).toBe(true);
  });
});
