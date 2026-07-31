# STEP 838 — 🇺🇸 역DCF 데이터 프로브 (SEC XBRL 단독 · 실측 전용)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus` 🔴 **Opus 권장**(태그 매핑 판단 · 업종 분류 · 대량 데이터 해석)

**전제 상태**: STEP 837 이후 HEAD · 트리 클린

**착수 전 필독**: 🔴 **`docs/REVDCF_SPEC.md` 전체** (특히 §2 용어집 · §4 A층 · §5 B층 · **§B-0 이미 실측된 14건**) · `CLAUDE.md` 최우선 전략 블록(US 단독 · 3중 규칙)

---

## 0. 성격 — 🔴 실측 전용. 고치지 않는다

🔴 **프로덕션 코드·크론·DB 스키마 변경 금지.** 이번 커밋에 들어갈 수 있는 것은 **프로브 스크립트 + 실측 문서 + `REVDCF_SPEC.md` 갱신**뿐.
🔴 **US 단독.** KR/DART는 보지 않는다.
🔴 **추측 금지.** 모든 수치는 실제 응답에서 세어서 보고. 못 잰 건 "미측정"으로 명시.
🔴 **3중 규칙 적용**(`CLAUDE.md`): 축 A 원문 / 축 B 실무 / 축 C 반대 증거 · 검증 3(원문·우리데이터·제3자) · 검수 3(반박·수치출처·이전발언 대조).
🔴 **재현 가능하게 남길 것.** Cowork가 오늘 손으로 잰 14건은 숫자만 남고 방법이 안 남았다. 이번 스크립트가 그 방법을 대체한다.

---

## 1. 이미 실측된 것 (다시 재지 말 것 · 검산만)

`docs/REVDCF_SPEC.md` §B-0에 **전체 SEC filer 기준 CY2024** 14건이 기록돼 있다. 요약:

- `Assets` 6,248 · `NetCashProvidedByUsedInOperatingActivities` 6,149 · `IncomeTaxExpenseBenefit` 5,173 · `CashAndCashEquivalentsAtCarryingValue` 5,129 · `OperatingIncomeLoss` 4,980 · `AssetsCurrent` 4,944 · `dei:EntityPublicFloat` 4,353
- 매출 3태그 합 **6,167**(Excluding 2,951 · Revenues 2,467 · Including 749)
- capex 3태그 합 **4,645**(PP&E 3,915 · ProductiveAssets 592 · CapitalImprovements 138=거의 REIT)

**측정 방법(재사용할 것)**: `frames` 응답의 **`pts` 필드** = 그 프레임 보고 기업 수.

🔴 **이번 STEP의 핵심 차이**: 위는 **전체 filer** 기준이다. **우리 유니버스(US 시총 상위 1,000) 기준**은 아직 아무것도 모른다.

---

## §1 — 수집 경로 결정 (먼저)

세 경로의 비용을 **실측**하고 하나를 택하라.

| 경로 | 호출 수 | 비고 |
|---|---|---|
| **A. `frames`** | 태그당 1회 (20~30회) → CIK로 우리 1,000개 필터 | 응답 ~73KB/회 |
| **B. `companyfacts`** | 종목당 1회 (1,000회) | 응답이 수 MB일 수 있음 |
| **C. 벌크 ZIP** | 1회(`companyfacts.zip`) | 매일 새벽 3시 ET 재컴파일 · 용량 확인 필요 |

🔑 **A가 압도적으로 적어 보이지만 검증하라** — 태그 변형을 다 세려면 A는 변형 수만큼 호출이 늘고, C는 한 번에 전부 본다. **다운로드 용량·소요 시간을 실측**해 결정하고 근거를 기재.

⚠️ **SEC 접근 규칙 준수**: `SEC_USER_AGENT` 헤더 필수(이미 env 보유) · 요청 속도 제한 준수 · `data.sec.gov`는 CORS 미지원이므로 서버에서만.

---

## §2 — 🔴 유니버스 확정 (A층 마지막 칸)

**목표: 시총 상위 1,000에서 제외 규칙을 적용하면 몇 개가 남는가.**

1. **티커 → CIK 매핑**: SEC `company_tickers.json`(또는 동등) 사용. `us_market_cap` 시총 상위 1,000과 조인. **매핑 실패 수를 보고.**
2. **분류 수집**: 각 CIK의 **SIC 코드**·`stateOfIncorporation`·`exchanges`·`fiscalYearEnd`(submissions API 헤더).
3. **제외 규칙 적용 후 카운트**:

| 제외 | 기준 | 실측할 것 |
|---|---|---|
| 금융사 | SIC 6000~6999 | 몇 개 |
| REIT | SIC 6798 | 몇 개 |
| SPAC | SIC 6770 | 몇 개 |
| 외국 발행사 | 최근 연간보고서 `form`이 20-F/40-F | 몇 개 |
| 매출 0/없음 | 매출 태그 전부 결측 또는 0 | 몇 개 |

4. 🔑 **교차 확인**: `AssetsCurrent` **결측**을 금융·REIT 판별 보조 신호로 써서 SIC 분류와 **얼마나 일치하는지** 측정. (SIC는 자기신고라 부정확할 수 있음 — `REVDCF_SPEC.md` §4 한계)
5. **최종 산출**: **제외 후 남는 종목 수 N**, 그리고 **N이 분포·백분위 표본으로 충분한지 판단 근거**(예: 상위 3%가 몇 종목이 되는지).

---

## §3 — 🔴 태그 커버리지 (우리 유니버스 기준)

**§2에서 남은 N종목**에 대해, driver별 필수 항목의 **연도별 확보율**을 낸다.

| driver | 항목 | 후보 태그(시작점 — **전수는 §4에서**) |
|---|---|---|
| 1 매출 | Revenue | `RevenueFromContractWithCustomerExcludingAssessedTax` · `Revenues` · `RevenueFromContractWithCustomerIncludingAssessedTax` |
| 2 영업이익 | EBIT | `OperatingIncomeLoss` |
| 3 세율 | 법인세·세전이익 | `IncomeTaxExpenseBenefit` · 세전이익 태그 |
| 4 운전자본 | 유동자산·유동부채·매입채무 | `AssetsCurrent` · `LiabilitiesCurrent` · `AccountsPayableCurrent` |
| 5 고정자산 | PP&E·capex | `PropertyPlantAndEquipmentNet` · capex 3태그 |
| — | 투하자본 | `Assets` · `CashAndCashEquivalentsAtCarryingValue` |
| 7 WACC | 이자비용·부채 | `InterestExpense` · 부채 태그 |
| FCF | 영업현금흐름 | `NetCashProvidedByUsedInOperatingActivities` |
| FALR | 유동시총 | `dei:EntityPublicFloat` |
| 주식수 | | `dei:EntityCommonStockSharesOutstanding` |

**보고 형식**: 항목 × 연도(CY2016~CY2025) 확보율 표. 그리고 **"5년 연속 확보 종목 비율"**과 **"10년 연속"**을 따로.

🔑 **B-1에서 정한 "5년 CAGR 기본 · 가능한 만큼 병기"가 실제로 몇 %에서 되는지가 여기서 나온다.**

---

## §4 — 🔴 태그 변형 전수 발견 (추측 금지)

후보 태그를 **우리가 나열하지 말고 데이터에서 뽑는다.**

1. 표본 종목(예: §2 통과분 중 업종 분산 100~200개)의 **`companyfacts` 전체 태그 목록**을 수집.
2. 항목별로 **실제 사용된 태그를 빈도순 집계**:
   - 매출: `Revenue*` · `Sales*` 패턴
   - capex: `PaymentsToAcquire*` · `PaymentsFor*Capital*` 패턴
   - 부채: `LongTermDebt*` · `DebtCurrent` 등
   - 이자: `InterestExpense*`
3. **우선순위 목록(fallback chain)을 데이터 기반으로 작성.**
4. 🔴 **겹침 검산**: 한 종목이 두 태그를 다 보고하는 구간에서 **값이 일치하는지** 확인(애플 CY2017·CY2018 매출 일치 전례). **불일치 사례가 있으면 반드시 보고.**
5. 🔑 **태그 = 업종 신호** 가설 검증: `PaymentsForCapitalImprovements` 사용 종목이 실제로 REIT/부동산인지, `AssetsCurrent` 결측이 금융/REIT인지 — **SIC와 대조해 적중률**을 낸다.

---

## §5 — FCF 음수·이상 케이스

§2 통과 N종목에 대해:

- `영업현금흐름 − capex`가 **음수인 비율** (최근 연도 기준 · 3년 평균 · 5년 평균 각각)
- **정규화(3·5년 평균)로 음수가 해소되는 비율** — `REVDCF_SPEC.md` §6의 "정규화로 흡수" 가정 검증
- 참고: 러셀 1000 적자 비율 약 3%(외부 인용) 대비 **우리 실측은 얼마인지**

---

## §6 — FALR 재료 확인

- `dei:EntityPublicFloat` **우리 유니버스 확보율**·최신값 기준일 분포(연 1회 보고 → 얼마나 묵었나)
- 야후 chart 응답에 **volume이 실제로 오는지** 표본 확인(현재 코드는 매핑을 안 하고 버림 — `lib/lensCompute.ts`)
- 🔴 **구현은 하지 말 것.** 오는지만 확인.

---

## §7 — 재현 스크립트

`scripts/probe_revdcf_us.ts`(신규·일회성) 하나로 §1~§6을 재현 가능하게.

- **오늘 손으로 잰 방법(`frames` + `pts`)을 함수로 포함**해 전체 filer 기준 수치도 다시 뽑을 수 있게
- 결과는 **표준출력 + JSON 파일**로. 문서에 붙일 수 있는 형태
- 🔴 프로덕션 모듈을 import해 쓰되 **수정하지 말 것**

---

## 검증 (제출 전 자체 점검)

1. `npx tsc --noEmit` 0 · `npm run test`(기존 유지) · `npm run build`
2. **프로덕션 변경 0 증거**: `git diff --stat`에 `app/`·`lib/`·`supabase/`·`vercel.json` 없음(스크립트·문서만). `lens_scores`·`lens_cuts` 행수 전후 동일.
3. §1 세 경로 **실측 비용 비교표** + 선택 근거
4. §2 **유니버스 최종 N** + 제외 사유별 종목 수 + SIC vs `AssetsCurrent` 교차 적중률
5. §3 **항목 × 연도 확보율 표** + 5년/10년 연속 확보 비율
6. §4 **태그 우선순위 목록(데이터 기반)** + 겹침 검산 결과(불일치 사례 포함)
7. §5 FCF 음수 비율 3종
8. §6 `EntityPublicFloat` 확보율 · volume 수신 여부
9. **3중 검수 명시**: 반박 시도 / 수치가 실측인지 / 이전 기록(§B-0)과 모순 없는지
10. `docs/REVDCF_SPEC.md` 갱신 — §11 실측 원장에 **우리 유니버스 기준 수치** 추가, §4 A층의 **N 확정**, §10 미결 목록에서 해소된 항목 제거
11. `docs/LENS_DEV_PLAYBOOK.md` 로그 1행
12. 커밋:
    ```bash
    git add scripts/ docs/
    git commit -m "STEP 838: probe US reverse-DCF data availability - universe after exclusions, tag coverage by year, tag variant discovery"
    git push
    ```

## 완료 보고 → Cowork에게

- §1 수집 경로 선택과 **실측 비용**
- §2 **유니버스 최종 N** (이게 A층을 닫는 마지막 숫자)
- §3 5년/10년 연속 확보 비율
- §4 태그 우선순위 목록 + **겹침 불일치 사례**
- §5 FCF 음수 비율
- §6 FALR 재료 가능 여부
- 🔴 **못 잰 것과 그 이유**

(다음 = A층 정식 종료 → B층 driver 2~7 → C 해법 설계.)
