/**
 * STEP 845 — SEC `frames` vs `companyfacts` 커버리지 격차 실측 (표본)
 *
 * 배경: 838이 호출 수만 보고 수집 경로로 `frames`를 택했으나, 이후 세 번 오류가 났다.
 *   - 840 `InterestExpense` 절벽 = frames 아티팩트
 *   - 842 `dei:EntityPublicFloat` 77.8% → 실제 99.7%
 *   - 844 PP&E 75.3% → GE·DE·URI·PEG·ATO가 companyfacts엔 존재(허위 결측)
 *
 * 목적: "frames가 얼마나 과소평가하는가"를 표본으로 정량화한다.
 *   벌크 ZIP(1.39GB)은 샌드박스에서 다운로드가 멈춰 표본 경로로 전환.
 *
 * 방법: 우리 유니버스 604 발행사에서 seed=42로 60개 무작위 표본 →
 *   `companyfacts` 1회 호출 → 10-K 제출분만 골라 2020~2024 연속 보유 여부 판정 →
 *   같은 종목에 대한 frames 판정과 대조.
 *
 * 실행: node scripts/probe_845_companyfacts_vs_frames.mjs   (표본 목록 = /tmp/samp.json)
 */

import fs from "node:fs";

const UA = process.env.SEC_USER_AGENT || "StockTerminal soulmaten7@gmail.com";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const REV = [
  "RevenueFromContractWithCustomerExcludingAssessedTax",
  "Revenues",
  "RevenueFromContractWithCustomerIncludingAssessedTax",
  "SalesRevenueNet",
];
const PPE = [
  "PropertyPlantAndEquipmentNet",
  "PropertyPlantAndEquipmentAndFinanceLeaseRightOfUseAssetAfterAccumulatedDepreciationAndAmortization",
  "PropertyPlantAndEquipmentOtherNet",
  "PublicUtilitiesPropertyPlantAndEquipmentNet",
];
const CASH = [
  "CashAndCashEquivalentsAtCarryingValue",
  "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents",
  "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalentsIncludingDisposalGroupAndDiscontinuedOperations",
];

const GROUPS = {
  rev: REV,
  oi: ["OperatingIncomeLoss"],
  ac: ["AssetsCurrent"],
  lc: ["LiabilitiesCurrent"],
  cash: CASH,
  ppe: PPE,
};

const YS = [2020, 2021, 2022, 2023, 2024];

const samp = JSON.parse(fs.readFileSync("/tmp/samp.json", "utf8"));
const res = {};

for (const cik of samp) {
  const p = String(cik).padStart(10, "0");
  try {
    const r = await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${p}.json`, {
      headers: { "User-Agent": UA },
    });
    await sleep(160);
    if (!r.ok) {
      res[cik] = "ERR" + r.status;
      continue;
    }
    const j = await r.json();
    const g = j.facts?.["us-gaap"] || {};
    const o = {};
    for (const [k, tags] of Object.entries(GROUPS)) {
      const yrs = new Set();
      for (const t of tags) {
        for (const d of g[t]?.units?.USD || []) {
          if (String(d.form).startsWith("10-K")) yrs.add(Number(String(d.end).slice(0, 4)));
        }
      }
      o[k] = YS.every((y) => yrs.has(y));
    }
    res[cik] = o;
  } catch {
    res[cik] = "EX";
  }
}

fs.writeFileSync("/tmp/sampres.json", JSON.stringify(res));
console.log("done", Object.keys(res).length);
