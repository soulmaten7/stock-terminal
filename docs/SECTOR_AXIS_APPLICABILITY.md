# 업종 × 축 적용성 — 44칸 판정 자료 (STEP 959, 2026-08-09)

> 🔴 **이 파일은 판정 자료다. 판정(적용/미적용/조건부를 실제로 어떻게 처리할지)은 장은태가 한다.**
> 🔴 원자료 = `docs/probe_959_axis_applicability.json`. 이 문서는 그 요약·서술이다.
> 🔴 `SECTOR_RELATIVE_SPEC`은 이 STEP에서 바꾸지 않았다.

## 0단계 — 안을 먼저 열었다(규칙 ⓪-5)

- **`data/sources/damodaran/`의 xls 8종**(betas·capex·countrytaxrates·indname·taxrate·totalbeta·wacc·wcdata) — 전부 열어 확인. **업종별 배수(PE·PBV·PS·EV/EBITDA) 데이터는 이 8개 안에 없다.** 전부 계산 투입재료(베타·WACC·세율·운전자본비율·산업분류)뿐이었다.
- 🔑 **`data/sources/text/damodaran_data_update_1_2026.html`(기존 저장본) 재검토에서 새 신호 발견** — 이 블로그 글이 *"my estimate the PE ratio for an industry grouping..."*, *"the EV/EBITDA multiple that I report for emerging market steel companies"*라고 직접 언급한다. **Damodaran이 업종별 배수 데이터셋을 별도로 발행한다는 뜻** — 우리가 안 받아둔 자료가 있다는 신호였다.
- 이 신호를 따라 웹서치 → **`pedata.xls`(PE)·`pbvdata.xls`(PBV)·`vebitda.xls`(EV/EBITDA)·`psdata.xls`(Price/Sales)** 4개 파일을 찾아 전부 다운로드·확인 — **우리 4축과 정확히 1:1 대응한다.** `data/sources/damodaran_multiples/`에 원본 저장.
- **DB `damodaran_*` 테이블 9개**(beta·capex·country_tax·credit_spread·global_inputs·industry·tax_rate·wacc·working_capital) — 전부 xls와 대응, 배수 데이터 없음.
- **link_hub `analysis`** — STEP 958에서 이미 조회 완료(14곳, stockanalysis.com 채택). 이번엔 재조회 안 함(958 결과 유효).
- 🔑 **결론 — 중단하지 않았다.** Damodaran 1차 자료(4개 신규 데이터셋)로 44칸 중 대부분이 실제로 갈렸다.

## 1단계 — 축별 성립 조건 (업종 대입 전에 먼저 정의)

| 축 | 정의(분자/분모) | 원전 근거 | 개별종목 붕괴조건(업종 무관, 이미 처리 중) | 업종 특유 우려 |
|---|---|---|---|---|
| **PER** | 시총 ÷ 순이익 | `pedata.xls` FAQ | 순이익≤0 → `NEGATIVE_EARNINGS` | REIT: GAAP 감가상각이 순이익을 구조적으로 낮춤 → 실무는 FFO 표준(실무출처 4건, 958) |
| **PBR** | 시총 ÷ 자기자본 장부가 | `pbvdata.xls` FAQ | 자기자본<0 → `NEGATIVE_EQUITY` | REIT: 취득원가 장부가가 시가상승 미반영 → NAV/P-NAV 선호(실무출처, 958) |
| **PSR** | 시총(또는 EV) ÷ 매출 | `psdata.xls` FAQ | 해당 없음 | 🔴 **원전 내부 상충**(아래 §2 참조) |
| **EV/EBITDA** | (시총+순부채) ÷ EBITDA | `vebitda.xls` FAQ("EV = Mkt Cap + Total Debt − Cash") | 해당 없음(이 STEP 범위 밖) | 부채가 자본조달이 아니라 **영업의 원재료**인 업종에서 EV 개념 붕괴 — `finsvc.pdf` slide12 직접인용: *"Debt, for non-financial service firms, is a source of capital. For a financial service firm, debt is more raw material than source of capital."* |

🔑 **조건을 먼저 세운 뒤 업종을 대입했다** — 업종별 사후 이유 붙이기 금지 원칙을 지켰다.

## 2단계 — 44칸 표

### Financials

| 축 | 판정 | 근거 | 확신도 | 현재 상태 |
|---|---|---|---|---|
| PER | **적용** | 라이브 `pedata.xls`: 9개 업종군 중 NA 0개(전부 계산됨) | 상 | 계산·노출 중(n=54) |
| PBR | **적용** | 라이브 `pbvdata.xls`: 9개 업종군 중 NA 0개 | 상 | 계산·노출 중(n=59) |
| PSR | **조건부** | 🔴 c21 교과서 원문: *"Since sales or revenues are not really measurable for financial service firms, price-to-sales ratios cannot be estimated or used for these firms."* — 그런데 **같은 저자의 라이브 `psdata.xls`(2026-01 갱신)는 9개 업종군 전부(0/9 NA) 실제 Price/Sales를 계산해 발행한다.** 텍스트(이론)와 실제 관행(데이터)이 상충 — 이번 STEP 신규 발견 | 하(상충) | 🔴 **계산·노출 중(n=61, minSample 안 가려짐) — 뚫려있는 칸** |
| EV/EBITDA | **조건부** | 라이브 `vebitda.xls`: 9개 업종군 중 **은행·증권 3개군(Bank Money Center·Banks Regional·Brokerage & Investment Banking, 615개사) = NA** / **보험·자산운용 6개군(Financial Svcs Non-bank&Insurance·Insurance General/Life/Prop-Cas·Investments & Asset Mgmt·Reinsurance, 558개사) = 실값 계산됨.** `finsvc.pdf`의 "부채=원재료" 논리와 정합(은행만 해당, 보험은 아님) | 상(단 세분화 필요) | minSample(20)로 가려짐(n=16, 우연) |

### Real Estate

| 축 | 판정 | 근거 | 확신도 | 현재 상태 |
|---|---|---|---|---|
| PER | **조건부** | 라이브 `pedata.xls`는 계산함(0/5 NA)이나 **Retail (REITs) PE=109.9로 이례적으로 높음** — 실무출처 4건(958: wallstreetprep·ibinterviewquestions·dividend.com·fairpriceindex)이 GAAP 감가상각 왜곡·P/FFO 선호를 명시 | 중 | minSample로 가려짐(n=10) |
| PBR | **조건부** | 라이브 `pbvdata.xls`는 계산함(0/5 NA)이나 실무출처가 NAV/P-NAV 선호를 명시(취득원가 장부가 문제) | 중 | minSample로 가려짐(n=17) |
| PSR | **적용** 🟢 | **958의 "불명" 정정** — 라이브 `psdata.xls`: 5개 업종군 전부(0/5 NA) 실제 계산됨 | 상 | minSample로 가려짐(n=18) |
| EV/EBITDA | **적용** | 라이브 `vebitda.xls`: 5개 업종군 전부(0/5 NA) 실제 계산됨 — 실무출처(958)와도 정합(REIT 부채는 정상 자본구조, 은행과 다름) | 상 | minSample로 가려짐(n=4) |

### 나머지 9개 업종

🟢 **958의 "적용(일반론, 근거없음)" 표기를 정정한다** — 이번 STEP에서 실제 근거(Damodaran 라이브 데이터셋)를 확보했다. "불명"이 아니라 **근거를 갖춘 "적용"**이다.

| 업종 | 업종군 수 | PER | PBR | PSR | EV/EBITDA |
|---|:--:|:--:|:--:|:--:|:--:|
| Communication Services | 8 | 적용(0/8 NA) | 적용(0/8) | 적용(0/8) | 적용(0/8) |
| Consumer Discretionary | 16 | 적용(2/16 NA — 개별예외*) | 적용(0/16) | 적용(0/16) | 적용(0/16) |
| Consumer Staples | 8 | 적용(0/8) | 적용(1/8 NA — 개별예외*) | 적용(0/8) | 적용(0/8) |
| Energy | 5 | 적용(0/5) | 적용(0/5) | 적용(0/5) | 적용(0/5) |
| Health Care | 6 | 적용(0/6) | 적용(0/6) | 적용(0/6) | 적용(0/6) |
| Industrials | 17 | 적용(0/17) | 적용(0/17) | 적용(0/17) | 적용(0/17) |
| Information Technology | 8 | 적용(0/8) | 적용(0/8) | 적용(0/8) | 적용(0/8) |
| Materials | 8 | 적용(1/8 NA — 개별예외*) | 적용(0/8) | 적용(0/8) | 적용(0/8) |
| Utilities | 4 | 적용(0/4) | 적용(0/4) | 적용(0/4) | 적용(0/4) |

`*` **개별 업종군 예외**(구조적 신호로 보지 않음 — 소표본·저수익연도 등으로 추정, 미확인): Consumer Discretionary PER — `Electronics (Consumer & Office)`·`Rubber& Tires` / Consumer Staples PBR — `Tobacco` / Materials PER — `Chemical (Diversified)`. 각 섹터 5~17개 업종군 중 1~2개뿐이라 섹터 전체 판정을 바꾸지 않는다.

**확신도 = 중** (전 사분면 공통) — "계산 가능함(NA 없음)"까지만 확인했고, REIT처럼 "계산되나 질적으로 왜곡"인지는 섹터별 개별조사를 안 했다.

### 집계

| 판정 | 칸 수 |
|---|:--:|
| 적용 | 40 |
| 조건부 | 4 (Financials PSR·EV/EBITDA · Real Estate PER·PBR) |
| 미적용 | 0 |
| 불명 | 0 |

🔴 **"미적용" 확정 칸은 0개다.** STEP 958이 "미적용"이라 적었던 2칸(Financials PSR·EV/EBITDA)은 라이브 데이터를 파고드니 둘 다 "조건부"(부분적으로는 계산되거나, 원전 내부에 이견이 있음)로 더 정밀해졌다.

## 2-4. 🔴 「미적용인데 안 가려지는」 칸 — 실제 피해 범위

**Financials × PSR, n=61, minSample 안 가려짐.** 유일한 노출 칸이다. 🔴 **단 "미적용"이 아니라 "조건부(원전 내부 상충)"로 재정의됐다** — Damodaran 자신의 라이브 데이터가 이 값을 실제로 계산해 발행하고 있어, "틀린 값"이라 단정하기보다 "이견이 있는 값"이라 부르는 게 더 정확하다. Q1_ENABLED가 OFF라 화면에는 안 나간다.

(Financials EV/EBITDA는 조건부이나 minSample로 가려져 있어 노출 칸 목록에 없다. Real Estate PER·PBR도 조건부이나 마찬가지로 가려져 있다.)

## 3단계 — 처방 후보 (판정하지 않음)

| # | 후보 | 대가 | 바뀌는 칸 수 |
|---|---|---|:--:|
| ① | `NOT_APPLICABLE`을 unavailable 사유에 추가, 계산에서 제외 | `lib/sectorRelativeBatch.ts`에 업종×축 예외표 하드코딩 필요(f/x 경계 재검토 소지). 조건부 칸을 미적용과 똑같이 취급하면 과잉배제 | **0개**(확정 미적용이 없어 발동 대상 자체가 없음) |
| ② | 계산은 하되 표시에서만 가린다 | 저장은 그대로, `Q1Section.tsx`에 업종×축 숨김표 추가(화면 코드 변경 — 이 STEP 범위 밖) | 조건부 4칸 대상 가능 |
| ③ | 조건부는 계산하되 별도 사유로 표시 | `unavailable`에 새 사유코드(예: `CONDITIONAL_DISTORTED`) 추가 — jsonb라 컬럼 변경 없이 가능하나 `lib/sectorRelativeBatch.ts`·`Q1Section.tsx` 양쪽 수정 필요 | 조건부 4칸 전부 — **이번 조사 결론(적용/조건부/미적용 3분류)을 가장 적은 코드 변경으로 화면에 반영** |
| ④ | 업종별 대체 축(Real Estate→FFO, Financials→P/TBV 등) | 🔴 새 축 신설 — FFO는 `us_fundamentals`에 없는 완전히 새 데이터(감가상각 조정·SEC 태그 별도조사 필요). **Q1 전체 재설계에 가까운 규모** | 이론상 Real Estate 4칸+Financials 일부, 실제로는 파이프라인 없이 0칸(구현 전) |

## 못 한 것 / 미측정 / 추측

- 업종군→GICS 섹터 매핑은 firm-count 다수결로만 했다 — `R.E.I.T.`처럼 Financials/Real Estate 경계가 애매한 10개 업종군은 소수 소속(예: `R.E.I.T.`의 Financials 쪽 43개사)을 버렸다.
- 우리 `us_sector_wide`의 섹터 배정(SPDR/Damodaran/야후 5단계)과 이번에 쓴 Damodaran 라이브데이터의 업종군 배정이 종목 단위로 같은 회사를 가리키는지 직접 대조하지 않았다 — 둘 다 "Damodaran 계열"이라 개연성은 높으나 미확인.
- "적용" 40칸은 "계산 가능함"만 확인했다 — REIT처럼 "계산되나 왜곡"인 질적 문제까지는 9개 섹터 전부를 개별조사하지 않았다.
- Financials EV/EBITDA를 은행/보험으로 세분화했을 때 **우리 실제 106개 Financials 종목 중 몇 개가 은행류인지는 세지 않았다**(다음 조사 후보로 남긴다).
- 처방 후보 4개는 전부 기록만 하고 고르지 않았다(대전제 준수).
