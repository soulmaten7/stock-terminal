# STEP 849 — 엔진에 넣을 나머지 재료 배선 (WACC 조립 · 부채 · 비영업자산 · 주식수)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus` 🔴 **Opus 권장**(태그 탐색 · 정의 판단)

**전제 상태**: STEP 848 커밋 `c3b5df0` 이후 HEAD · 트리 클린

**착수 전 필독**: `lib/revdcf/engine.ts` · `lib/revdcf/registry.ts` · `docs/REVDCF_SPEC.md` §12(A/B/C 분류) · `CLAUDE.md` ⓪-2

---

## 0. 성격

🔴 **화면 변경 0.** 계산 모듈 + 스크립트 + 문서.
🔴 **값을 코드에 박지 말 것.** 전부 846에서 적재한 `damodaran_*` 테이블에서 읽는다(§12 B분류).
🔴 848 재현이 통과했으므로 **엔진은 손대지 않는다.** 이번은 **엔진에 넣을 재료**만.

---

## §1 — 🔴 848 민감도가 바꾼 것: WACC은 점추정이 아니다

848 실측: **WACC ±1%p → GAP 8년 ↔ 15년 (또는 below_one).** 영향력 순위 **WACC ≫ 성장 ≈ 마진**.
WACC은 베타에 의존하고, **FF 1992: 베타의 개별 종목 수익률 설명력 ≈ 3%.**

🔴 **따라서 GAP을 단일 숫자로 내놓는 것은 거짓 정밀도다.** 우리 원칙(예측 안 함·불확실성 드러냄)에 정면으로 어긋난다.

**결정 (근거와 함께 기록할 것)**

| 안 | 방식 | 채택 |
|---|---|---|
| A. 통계적 신뢰구간 | 베타 표준오차로 WACC 분포 추정 → GAP 구간 | ❌ **가정이 늘어난다**(분포 형태·독립성). 우리 원칙 위반 |
| B. 고정폭 밴드 | WACC ±1%p 고정 | ❌ 1%p라는 폭 자체가 임의 가정 |
| ✅ **C. 민감도 그대로 노출** | **GAP을 WACC 3점(−1%p / 기준 / +1%p)으로 함께 산출** | ✅ **가정 0.** 사용자가 자기 관점을 고른다 = "판단은 당신" |

→ **엔진 호출을 3회 하고 결과 3개를 반환하는 래퍼**를 만든다. 통계 모델링 금지.

`lib/revdcf/compute.ts` (신규)
```ts
computeGapWithSensitivity(drivers, market, opts)
  → { base: Verdict, waccMinus1: Verdict, waccPlus1: Verdict, wacc: number, waccSource: {...} }
```

---

## §2 — WACC 조립 (점추정 = 기준값)

🔴 **다모다란의 완성 `Cost of Capital` 열은 쓰지 않는다**(§12 결정 — 그 안의 세율 25%와 우리 세율이 어긋남). **구성요소로 조립한다.**

```
자기자본비용 Ke = 무위험수익률 + β_relevered × ERP
β_relevered     = β_unlevered_cash_adjusted × [1 + (1 − 세율) × D/E]
세후 부채비용   = (무위험수익률 + 신용스프레드) × (1 − 세율)
WACC            = Ke × E/(D+E) + 세후부채비용 × D/(D+E)
```

| 재료 | 출처 (전부 DB) | 비고 |
|---|---|---|
| 무위험수익률 | `damodaran_global_inputs.riskfree_rate` **또는 FRED**(키 보유) | 🔴 **둘 중 무엇을 쓸지 결정하고 사유 기재.** 다모다란은 연 1회 고정, FRED는 매일 |
| ERP | `damodaran_global_inputs.erp` | 연 1회 |
| **β_unlevered (현금조정)** | `damodaran_beta.unlevered_beta_cash_adj` | 업종 매핑으로 결합 |
| 세율 | `damodaran_country_tax` US 행 | driver 3과 **동일 값** |
| **D/E** | 🔴 **기업별 실측** — 부채(§3) ÷ 시가총액 | 업종 평균 D/E를 쓰지 말 것 |
| 신용스프레드 | `damodaran_credit_spread` (847 §6 적재) | 🔴 매칭 기준(주가 변동성) 확인 필요 |

1. **업종 매핑**은 846의 `ticker_norm` + `is_us_listed` 사용.
2. 🔴 **검산**: 우리 조립 WACC와 `damodaran_wacc.cost_of_capital`(그의 완성값)을 **업종 평균끼리 비교**. 큰 괴리가 나면 조립 로직이 틀렸을 수 있다. 차이 분포를 보고할 것.
3. 🔴 **도미노 대조**: 우리 조립 WACC vs 원전 T7의 **5.357%**. 차이와 원인(원전은 베타=1·무위험 0.65%·ERP 5.1%·세율 16.5% 사용) 규명.

---

## §3 — 부채 태그 (847에서 미포착)

847에서 도미노 부채 4,170을 **재현 실패**했다. 태그 확장 필요.

- 후보를 **데이터에서 발견**하라(`LongTermDebt*`·`DebtCurrent`·`FinanceLease*`·`OperatingLeaseLiability*` 패턴 전수).
- 🔴 **함정**: `LongTermDebtMaturitiesRepayments…`는 만기 스케줄 **주석**이지 잔액이 아니다(838 기록).
- 🔴 **리스 부채 포함 여부를 결정하고 사유 기재.** 다모다란은 리스를 부채에 포함한다(`wacc.xls` "Total Debt (including lease debt)"). 원전 T8은 도미노 4,170 = 차입금 위주로 보인다.
- **604 커버리지** + 도미노 4,170 재현 여부 보고.

---

## §4 — 비영업자산 정의 (미결 해소)

원전 T8: **현금 + 유가증권** 전액을 비영업자산으로 더한다(도미노 391.9).
🔴 그러나 driver 4(T4)에서는 **운영 필요 현금을 매출의 2%**로 본다 — 즉 원전 스스로 "전액이 여유현금은 아니다"를 인정한다.

**두 안을 다 계산해 차이를 실측한 뒤 결정할 것.**
| 안 | 정의 |
|---|---|
| A | 현금 + 단기투자 **전액** (원전 T8) |
| B | 전액 − **매출 × 2%**(운영 필요 현금) (원전 T4와 정합) |

- 604에서 **A vs B가 GAP을 몇 년 바꾸는지** 표본으로 실측.
- 🔴 차이가 작으면 **A(원전 그대로)**를 택한다. 크면 근거를 대고 결정.
- 태그: `CashAndCashEquivalentsAtCarryingValue` union + `ShortTermInvestments`·`MarketableSecuritiesCurrent`·`AvailableForSaleSecuritiesCurrent`.

---

## §5 — 주식수 (미결 해소)

- 후보: `dei:EntityCommonStockSharesOutstanding` · `us-gaap:CommonStockSharesOutstanding` · `WeightedAverageNumberOfDilutedSharesOutstanding`
- 🔴 **원전 T8은 39.35M을 쓴다.** 847에서 우리가 38.67M을 얻었다 — **어느 태그가 원전에 가까운지** 확인하고 그것을 채택.
- **기본주 vs 희석주 결정 + 사유.** (역DCF는 현재 주주가치를 주당으로 나누는 것이므로 **발행주식수**가 원칙이나, 스톡옵션 희석을 무시하면 주당가치가 과대)
- 604 커버리지 보고.

---

## §6 — 도미노 전 입력 재현 (§2~§5 종합)

847 §5 대조표를 **다시** 채운다. 이번엔 WACC·부채·비영업자산·주식수까지.

| 항목 | 원전 T8 | 847 | **849** |
|---|---|---|---|
| 자본비용 | 5.357% | 미구현 | ? |
| 부채 | 4,170 | 미포착 | ? |
| 비영업자산 | 391.9 | 190.6 | ? |
| 주식수 | 39.35M | 38.67M | ? |

🔴 **그리고 우리 재료 전부로 엔진을 돌려 GAP이 몇 년 나오는지** 보고. 원전 8년과 얼마나 다른가.
→ 이게 **"원전 구조 + 우리 조달"의 실제 결과**다. 차이가 크면 어느 재료 때문인지 분해할 것.

---

## 검증

1. `npx tsc --noEmit` 0 · `npm run test` · `npm run build`
2. **프로덕션 화면 변경 0 증거**
3. §2 조립 WACC vs 다모다란 완성값 **업종 평균 비교 분포** + 도미노 5.357% 대조
4. §3 부채 커버리지 + **도미노 4,170 재현 여부**
5. §4 A/B 두 정의의 **GAP 차이 실측** + 결정
6. §5 태그 결정 + **도미노 39.35M 대조**
7. §6 **전 입력 재현표 + 최종 GAP**
8. 🔴 **3중 점검 블록** 명시
9. `docs/REVDCF_SPEC.md` 갱신 — §6에 **WACC 3점 민감도 표시 결정**(안 C·근거) · §12 B분류에 신규 배선 · §10 미결 해소분 제거 · §11 실측 원장
10. `lib/revdcf/registry.ts`의 `INPUTS` 중 `open` 항목 갱신(비영업자산·주식수·부채 해소)
11. `docs/CHANGELOG.md`·`docs/STATE.md` 오늘 날짜
12. 커밋:
    ```bash
    git add lib/ scripts/ docs/ supabase/
    git commit -m "STEP 849: assemble WACC from components with 3-point sensitivity, wire debt/non-operating assets/share count, reconcile Domino's full inputs"
    git push
    ```

## 완료 보고 → Cowork에게

- 🔴 **도미노 전 입력 재현표 + 최종 GAP** (원전 8년 대비)
- 조립 WACC의 타당성(다모다란 대조)
- §4·§5 결정과 근거
- 🔴 못 한 것과 이유
