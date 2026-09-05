# STEP 847 — 🔴 원전 정의 기준 재료 커버리지 실측 (driver 3·4·5 재설계 전제)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus` 🔴 **Opus 권장**(태그 탐색·항등식 판별)

**전제 상태**: STEP 846 커밋 `e16d9b4` 이후 HEAD · 트리 클린

**착수 전 필독**: `CLAUDE.md` **규칙 ⓪·⓪-2** · `lib/revdcf/registry.ts` · `data/sources/README.md` · `docs/REVDCF_SPEC.md` §12

---

## 0. 성격 — 🔴 실측 전용. 설계하지 않는다

🔴 **프로덕션 변경 금지.** 스크립트 + 문서 + 마이그레이션(§6)만.
🔴 **이 STEP은 "원전 방식이 우리 데이터로 되는가"만 잰다.** 대안 설계는 결과를 보고 다음 STEP에서.
🔴 순서 원칙이 바뀌었다: **원전이 기준선 · 안 되는 것만 대체 + 사유.** 내 판단으로 먼저 정하지 않는다.
🔴 **모르면 모른다고 보고.** 미측정은 미측정이라 쓴다.

**유니버스**: 616종목 / **604 발행사** (MLP 7 제외 후). `docs/probe_survivors.json` + 파트너십 필터.
**연도**: CY2020~CY2024 (5년). **값 추출은 `companyfacts`**(frames는 개별 판정에 부적합 — §B-5).

---

## §1 — driver 3: 원전 **무차입 현금세율** 재료

**원전 절차 (T6 · `data/sources/expectations-investing/T6.xlsx`)**
```
세율            = 법인세비용 ÷ 세전이익            (실효세율)
현행 법인세     = 현금으로 낸 세금
세금방패        = 이자비용 × 세율
무차입 현금세금 = 현행 법인세 − 세금방패
현금세율        = 무차입 현금세금 ÷ 영업이익
5년 현금세율    = 5년 평균
```

**실측할 태그 커버리지 (604 기준 · 5년 연속)**

| 원전 항목 | 후보 태그 | 비고 |
|---|---|---|
| 현금으로 낸 세금 | `IncomeTaxesPaidNet` · `IncomeTaxesPaid` | 🔴 **현금흐름표 보충공시** — 커버리지 미지 |
| 법인세비용 | `IncomeTaxExpenseBenefit` | 838 실측 기존 |
| 세전이익 | `IncomeLossFromContinuingOperationsBeforeIncomeTaxes…` | |
| 이자비용 | `InterestExpense` + 변형 | 840: frames 절벽은 아티팩트 |
| 영업이익 | `OperatingIncomeLoss` (+Pretax+Interest 재구성 폴백) | |

1. 🔴 **태그 변형을 데이터에서 발견**하라(`IncomeTaxesPaid*` 패턴 전수). 우리가 나열하지 말 것.
2. **5개 전부 5년 연속 확보되는 발행사 수**를 낸다.
3. 산출된 현금세율의 **분포**(중앙·10%·90%분위)와 **연도간 변동**(같은 회사 내 표준편차).
4. 🔴 **한계세율(25.63%)로 계산한 값과 나란히** 비교표를 낸다. 어느 쪽이 안정적인가.
5. 🔴 **음수·100% 초과 등 이상값 비율**을 보고(가드는 넣지 말 것 — CLAUDE.md 하드코딩 가드 금지).

---

## §2 — driver 4: 원전 **순운전자본** 재료

**원전 절차 (T4)**
```
영업유동자산 = (매출×2%)  + 매출채권 + 재고 + 기타유동자산 + 이연법인세자산
무이자유동부채 = 매입채무 + 미지급비용 + (광고기금부채) + 기타미지급부채
순운전자본 = 영업유동자산 − 무이자유동부채
증분운전자본율 = Δ순운전자본 ÷ Δ매출   → 5년 평균
```

🔑 **원전은 유동부채 전체에서 차입금을 빼지 않는다. 무이자 항목만 더한다.**
→ 844에서 막혔던 **단기차입금 태그 부족(union 60.5%)** 문제를 **우회**할 수 있다. 이게 이 절의 핵심 가설이다.

| 원전 항목 | 후보 태그 |
|---|---|
| 매출채권 | `AccountsReceivableNetCurrent` (+변형) |
| 재고 | `InventoryNet` (+변형) |
| 기타유동자산 | `OtherAssetsCurrent` |
| 이연법인세자산 | `DeferredIncomeTaxAssetsNet` · `DeferredTaxAssetsNetCurrent` |
| 매입채무 | `AccountsPayableCurrent` |
| 미지급비용 | `AccruedLiabilitiesCurrent` |
| 기타미지급부채 | `OtherLiabilitiesCurrent` · `OtherAccruedLiabilitiesCurrent` |

1. 태그 변형 **데이터에서 발견** + 각 커버리지.
2. **전부 확보되는 발행사 수** + 일부 결측 시 0으로 둘 수 있는 항목이 무엇인지 판단(근거 기재).
3. 🔴 **검산**: `영업유동자산 − 무이자유동부채` 와 `AssetsCurrent − 현금 − LiabilitiesCurrent`(844 방식)를 **같은 종목에서 비교**. 차이 분포를 낸다.
4. **증분율(Δ/Δ매출)의 연도간 변동**을 낸다. 844 실측(한계형 94.95%p)이 **원전 정의로도 그런지** 확인.
   - 🔴 **844의 결론(수준형 채택)이 유지되는지 뒤집히는지가 이 절의 판정이다.**

---

## §3 — driver 5: 원전 **증분 고정자본** 재료

**원전 절차 (T5)**
```
총 고정자본투자 = 설비투자 + 자본화 소프트웨어 + 기타 투자활동(순) + 인수(순현금)
순 고정자본투자 = 총 − 감가상각
증분고정자본율  = 순 고정자본투자 ÷ Δ매출   → 5년 평균
```

🔴 **838에서 "함정"이라 기록한 `PaymentsToAcquireBusinessesNetOfCashAcquired`가 원전에서는 필수 재료다.** 그 판정을 정정할 것.

| 항목 | 후보 태그 |
|---|---|
| 설비투자 | `PaymentsToAcquirePropertyPlantAndEquipment` · `PaymentsToAcquireProductiveAssets` · `PaymentsForCapitalImprovements` |
| 자본화 소프트웨어 | `PaymentsToDevelopSoftware` · `CapitalizedComputerSoftwareAdditions` |
| 기타 투자활동(순) | `PaymentsForProceedsFromOtherInvestingActivities` |
| 인수(순현금) | `PaymentsToAcquireBusinessesNetOfCashAcquired` |
| 감가상각 | `DepreciationDepletionAndAmortization` · `DepreciationAndAmortization` |

1. 각 항목 커버리지 + **없을 때 0으로 둘 수 있는지** 판단(자본화SW·기타투자는 0 가능성, 설비투자·감가상각은 필수).
2. **증분율의 연도간 변동** + 844의 자본집약도(PP&E÷매출, 변동 2.34%p)와 **나란히 비교**.
3. 🔴 **인수 포함 여부가 값을 얼마나 바꾸는지** 실측(브로드컴·오라클 등 대형 인수 기업 사례 포함).

---

## §4 — 🔴 driver 1: 미래 성장률 조달 가능성

**원전은 과거 CAGR을 쓰지 않는다**(T2 원문: 회사 가이던스 · Value Line · Morningstar · 자체 분석).

### §4-A 회사 가이던스 (무료 · SEC)
- 8-K **Item 2.02** + **Exhibit 99.1**(실적 보도자료)에 forward guidance가 들어간다.
- 🔑 **우리는 이미 8-K 파이프라인이 있다**(`/api/events` · `filing_summaries` · LLM 요약). 재사용 가능한지 먼저 확인.
- **표본 60종목**(seed 42, 604에서)에 대해 최근 4개 분기 8-K Exhibit 99.1을 훑어:
  - **매출 가이던스가 명시된 종목 비율**
  - 제시 형태(연간/분기 · 금액/성장률 · 범위/점추정)
  - 🔴 **몇 년 앞까지** 주는지
- 추출은 규칙기반으로 먼저 시도하고, 안 되면 **LLM 필요 여부**만 판단(이번엔 구현하지 말 것).

### §4-B 애널리스트 컨센서스 (유료 후보)
- **FMP** `Financial Estimates API` — Starter **$22/월**(연 청구) · US 커버리지.
- 🔴 **`FMP_API_KEY`가 `.env.local`에 있으면** 무료/보유 티어로 표본 실측, **없으면 "키 미보유"로 보고하고 건너뛴다.** 임의 결제·가입 금지.
- 실측할 것: 우리 604 중 **매출 추정치 보유 비율** · **몇 개 연도 앞까지** · 참여 애널리스트 수 분포.

🔴 **판정에 필요한 숫자**: "앞으로 N년은 근거 있는 값, 이후는 유지"에서 **N이 얼마인가.**

---

## §5 — 🔴 조달 검증: 도미노 대조 (가장 중요)

원전 T8 Inputs 값과 **우리 파이프라인 산출값**을 나란히 놓는다. 도미노피자 1종목.

| 항목 | 원전(T8, 2020-09 기준) | 우리 산출 | 차이 |
|---|---|---|---|
| 매출성장률 | 7% | ? | |
| 영업이익률 | 17.5% | ? | |
| 시작 영업이익률 | 17.39% | ? | |
| 현금세율 | 16.5% | ? | |
| 증분고정자본율 | 15% | ? | |
| 증분운전자본율 | 10% | ? | |
| 자본비용 | 5.357% | ? | |
| 주식수 | 39.35M | ? | |
| 부채 | 4,170 | ? | |
| 현금·유가증권 | 391.9 | ? | |

🔑 **엔진 검증(수식이 맞나)과 조달 검증(재료가 맞나)은 다르다. 이건 후자다.**
- 시점을 2020-09에 맞춰 **당시 공시 기준**으로 산출할 것.
- 🔴 차이가 크면 **어느 단계에서 벌어지는지**까지 규명.

---

## §6 — 846 잔여 2건

1. `damodaran_tax_rate`에 **Total Market 집계 행 미포함** → driver 3 폴백값(수익기업평균/aggregate)을 DB에서 못 읽는다. **적재 추가.**
2. `wacc.xls` **등급별 Basis Spread 표 미배선** → 부채비용 산출에 필요. `damodaran_credit_spread(as_of, std_dev_lo, std_dev_hi, spread)` 테이블 신설 + 적재.

---

## 검증

1. `npx tsc --noEmit` 0 · `npm run test` · `npm run build`
2. **프로덕션 변경 0 증거** (`git diff --stat`에 `app/` 없음)
3. §1~§3 **항목별 커버리지 표** + **연도간 변동 비교표**(원전 정의 vs 844 정의)
4. §2-4 · §3-2 **판정 명시**: 844의 결정(수준형)이 **유지되는가 뒤집히는가**
5. §4 가이던스 존재율 + 컨센서스 커버(또는 "키 미보유") + **🔴 N년 판정**
6. §5 **도미노 대조표** 10행 전부
7. §6 테이블 행 수
8. 🔴 **3중 점검 블록**(⓪ 원전인벤토리 / A-0 / A / B / C / 검증 / 검수 / 미측정) 명시
9. `docs/REVDCF_SPEC.md` §B-4 갱신 + §9 정정 기록에 **"838: PaymentsToAcquireBusinesses는 함정"** 정정 추가
10. `lib/revdcf/registry.ts`의 `readStatus` 전부 `판독완료`로 갱신 + `divergence` 재작성
11. `docs/CHANGELOG.md`·`docs/STATE.md` 오늘 날짜
12. 커밋:
    ```bash
    git add scripts/ docs/ lib/ supabase/
    git commit -m "STEP 847: measure primary-source (Expectations Investing) material coverage for drivers 3/4/5, growth-estimate sourcing, Domino's reconciliation"
    git push
    ```

## 완료 보고 → Cowork에게

- §1~§3 커버리지 + **원전 정의 vs 844 정의 변동 비교**
- §2-4 · §3-2 **판정**(수준형 유지/뒤집힘)
- §4 **N년** + 가이던스 존재율 + 컨센서스 가능 여부
- §5 **도미노 대조표**
- 🔴 못 잰 것과 이유
