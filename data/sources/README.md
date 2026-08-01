# `data/sources/` — 원전·재료 제공자 **원본** 보관소

> 🔴 **CLAUDE.md 규칙 ⓪**: 목록만 만들지 말고 **원본 그대로** 저장한다.
> 판단이 갈릴 때는 내 기억이나 문서 요약이 아니라 **여기 있는 원본을 다시 연다.**
> 요약·발췌본은 원본을 대신하지 못한다.

취득일: **2026-08-01**

---

## `expectations-investing/` — 원전 계산 스프레드시트

출처: https://www.expectationsinvesting.com/online-tutorials
파일 패턴: `/s/Online-Tutorial-{n}.xlsx` (튜토리얼 #1·#2는 스프레드시트 없음 = 404)

| 파일 | 튜토리얼 | 주제 | 대응 driver | 시트 |
|---|---|---|---|---|
| `T3.xlsx` | #3 | 영업이익률 | **driver 2** | Inputs · Tutorial 3 · Margins |
| `T4.xlsx` | #4 | 증분 순운전자본 | **driver 4** | Inputs · Tutorial 4 · Working Capital Analysis · Cash Conversion Cycle |
| `T5.xlsx` | #5 | 증분 고정자본 | **driver 5** | Inputs · Tutorial 5 · Cash Flow Method |
| `T6.xlsx` | #6 | 현금세율 | **driver 3** | Inputs · Tutorial 6 · Cash Tax Rate |
| `T7.xlsx` | #7 | 자본비용(WACC) | **driver 6** | Inputs · Tutorial 8 · WACC |
| `T8.xlsx` | #8 | **PIE 분석 = 역산기 본체** | — | Inputs · Tutorial 8 · Price Implied Expectations |
| `T9.xlsx` | #9 | M&A 분석 | (해당없음) | … · SVAR & Premium at Risk |
| `T10.xlsx` | #10 | 실물옵션 | (해당없음) | … · Real Options Calculations |

🔴 **판독 상태는 `lib/revdcf/registry.ts`의 `PRIMARY_SOURCE.readStatus`가 정본.**
2026-08-01 현재 **T8만 판독 완료 · T3~T7 미독** — 해당 driver 설계를 확정하기 전에 반드시 열 것.

---

## `damodaran/` — 재료 데이터셋

출처: https://pages.stern.nyu.edu/~adamodar/pc/datasets/
**갱신: 연 1회 · 매년 1월 첫 2주** (원문 확인). 현재 보관본 = **2026-01-05 기준**

| 파일 | 내용 | 쓰는 곳 |
|---|---|---|
| `indname.xls` (21.7MB) | 회사→업종 매핑 · `Exchange:Ticker` · `Industry Group` · **SIC Code** · `Country` · 전세계 48,156사 | 업종 매핑 (🔴 매칭키 = **상장 거래소 + 구두점 정규화**) |
| `taxrate.xls` | 업종별 실효세율 94개 (`eff_all`/`eff_money`/`eff_agg`/`cash_*`) | driver 3 병기값 |
| `countrytaxrates.xls` | 국가별 **한계세율** (US 행) | **driver 3 기본값** |
| `wacc.xls` | 업종별 베타·자기자본비용·D/E·부채비용·자본비용 + **상단 입력**(무위험·ERP·스프레드표·한계세율) | driver 6 재료 |
| `betas.xls` | 업종별 베타·D/E·**무차입베타**·**현금조정 무차입베타** | **driver 6 하향식 베타** |
| `capex.xls` | 업종별 CapEx·감가상각·**Net CapEx/Sales**·Sales/Invested Capital | driver 5 대조 |
| `wcdata.xls` | 업종별 매출채권/재고/매입채무/**Non-cash WC/Sales** | driver 4 대조 (🔴 폴백 사용 금지 — 정의 불일치) |
| `totalbeta.xls` | 총베타(비분산 투자자용) | 미검토 |

🔴 **알려진 내부 불일치**: `countrytaxrates.xls` US 한계세율 **25.63%** vs `wacc.xls`·`betas.xls` 입력 **25.00%**.
→ 결정: `countrytaxrates.xls` 채택 + **WACC은 직접 조립**(그의 완성 `Cost of Capital` 열 사용 금지). 상세 = `docs/REVDCF_SPEC.md` §12.

---

## `text/` — 원문 페이지 raw HTML

각 파일 첫 줄에 `<!-- 취득일 · URL -->` 주석이 있다.

| 파일 | 내용 |
|---|---|
| `EI_tutorial_index.html` | 튜토리얼 10개 목록 |
| `EI_tutorial_02_sales.html` ~ `EI_tutorial_08_PIE.html` | 각 driver의 원전 산출 절차 (02 매출·03 마진·04 운전자본·05 고정자본·06 현금세율·07 자본비용·08 PIE) |
| `damodaran_working_capital.html` | 운전자본 추정 **5가지 방법**과 저자의 순위 평가 · 음수 운전자본 경고 |
| `damodaran_effective_tax_rates.html` | 실효세율 vs 한계세율 · "매 기간 동일 세율이면 한계세율이 안전" 근거 |
| `sec_edgar_api.html` | `frames`/`companyfacts`/`companyconcept` 규격 · **frames 배정 규칙**(마지막 제출본 1건 · 365일±30일) |
| `newconstructs_coverage_methodology.html` | 커버리지 2,748사 · 지수 사다리 · "매출 없는 회사 미커버" |
| `famafrench2000_abstract.html` | 수익성 평균회귀 **연 38%** · 비선형 |

🔴 미확보: `newconstructs_gap.html` (404 — URL 재확인 필요)

---

## 갱신 규칙

| 소스 | 주기 | 조치 |
|---|---|---|
| 다모다란 8개 파일 | **연 1회 · 1월 첫 2주** | 재다운로드 + 기준일 갱신 + 값 변화 확인 |
| 원전 스프레드시트 | 개정판 나올 때만 | 변경 없음 가정 |
| SEC API 문서 | 변경 고지 시 | frames 규칙 변경 여부 확인 |
| us-gaap 택사노미 | 연 1회 개정 | 태그 폐기·신설 확인 |
