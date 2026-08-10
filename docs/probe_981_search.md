# STEP 981 — 3번 규칙 기록 (①-A 3회 · ①-B 3회)

> 조사 전용. 코드 0줄·DB 쓰기 0. 🇺🇸 US 단독 — KR 비교 대상·예시 일절 없음.

## A-0 (우리 자산) — 먼저 연 것

- `docs/VALUE_LENS_DEFECT_AUDIT_2026-08-07.md` — **이미 존재하는 밸류 렌즈 결함 실측 문서.** 결함 2("야후가 계산한 값을 받아씀")·결함 3("TTM PER과 연간 PER을 한 분포에 섞음")이 972가 본 "PER이 셋" 문제를 이미 07-07에 코드 인용으로 지적해 놓았다. 이번 STEP은 이 문서가 지적만 하고 **재지 않은 것**(몇 종목이 어느 기준인지·괴리가 얼마나 큰지)을 잰다.
- `lib/lensCompute.ts:139-245` — pe/pb 조달 경로 원본(1-1·1-2 근거).
- `lib/valuation.ts` — Q1(SEC) 밸류 계산 정의(원전: Damodaran `pedata.xls`/`pbv.pdf`, STEP963 확정).
- `docs/probe_951_cache/` — SEC companyfacts 1,167종목 로컬 캐시. 2-2 원인분류에 재사용(재조회 없음).
- `data/sources/damodaran_multiples/pedata.xls` — 이미 로컬 보유(STEP979에서 저장). 이번에 FAQ 시트를 다시 열어 Current/Trailing/Forward PE 정의를 처음으로 정독(이전 STEP들은 "money-losing firms" 행만 봤음).

## ①-A — 원전·공식문서 (3회, 서로 다른 문서)

**A-1. `data/sources/damodaran_multiples/pedata.xls` "Variables & FAQ" 시트** (이미 로컬 보유 원본, `xlrd`로 직접 읽음)

Damodaran이 업종별로 **PER을 세 가지로 나눠 별도 컬럼**으로 공개한다:
- **Current PE** = "Price per share divided by EPS in most recent fiscal year" (우리 SEC 파이프라인의 "annual"과 같은 정의)
- **Trailing PE** = "Price per share divided by EPS in trailing twelve months" (야후 `trailingPE`와 같은 정의)
- **Forward PE** = "Price per share divided by expected EPS in next four quarters"

세 컬럼 모두 "averaged across all money-making firms" — **셋을 섞어 평균 내지 않고 처음부터 별개 통계로 유지**한다.

**A-2. `data/sources/damodaran_pdfs/ch18.pdf`("Earnings Multiples", Investment Valuation 2nd ed.)** — 이번에 신규 취득(`curl`로 원문 PDF 다운로드 → `pdftotext`로 직접 추출 → `data/sources/damodaran_pdfs/`에 영구 저장, ⓪ 원전 저장 규칙 준수)

원문 인용(줄 29-40):
> *"PE ratios could be computed using current earnings per share, trailing earnings per share, forward earnings per share, fully diluted earnings per share and primary earnings per share. Especially with high growth firms, the PE ratio can be very different depending upon which measure of earnings per share is used."*

Figure 18.1(2000년 7월 미국 주식 전수)이 Current/Trailing/Forward PE 세 분포를 나란히 보여주며, 본문이 명시: *"The current PE ratios are also higher than the trailing PE ratios, which, in turn, are higher than the forward PE ratios."* — **큰 괴리가 나는 것 자체가 원전이 이미 기록한 정상 현상**이다.

PEG 비율 계산 대목(줄 2124-2130)에서 **일관성 원칙**을 명시:
> *"The answer depends upon the base... If it [PE] is based upon the most recent year (current earnings), the PE ratio that should be used is the current PE ratio. If it is based upon trailing earnings, the PE ratio used should be the trailing PE ratio. The forward PE ratio should never be used in this computation, since it may result in a double counting of growth."*

🔑 **원전의 규칙은 "어느 게 맞다"가 아니라 "무엇과 짝짓든 같은 기준을 유지하라"다.** 우리 현재 상태(야후 TTM 1순위 vs SEC 파이프라인 연간)는 이 일관성 원칙을 어긴 사례는 아니다(두 파이프라인이 각자 내부적으로는 일관됨) — 문제는 **"PER"이라는 이름 하나로 두 기준이 사용자에게 구분 없이 노출**된다는 데 있다(972의 원래 지적과 정확히 일치).

**A-3. WebSearch로 원전 리스트업 확인**(위 두 원전을 찾기 위한 탐색 자체도 기록) — `pages.stern.nyu.edu/~adamodar` 도메인에서 `relval.pdf`·`ch18.pdf`·`ch17.pdf` 등 관련 챕터 존재를 확인. Chapter 17("Fundamental Principles of Relative Valuation")은 이번엔 열지 않음(ch18이 직접 질문에 답해 충분) — 🔴 **미독 표시**: `ch17.pdf`는 "일관성" 원칙의 더 앞선 원문일 가능성이 있으나 이번 STEP에서 열지 않았다.

## ①-B — 타 플랫폼 실무 (3곳, 전부 실제 조회 — AMT 동일 종목)

| 플랫폼 | PE 표시 개수 | 라벨 | 기본(헤드라인) 값 | TTM/FY 명시 여부 |
|---|:--:|---|---|---|
| **stockanalysis.com** | 2개 | "PE Ratio"(23.73) · "Forward PE"(25.74) | "PE Ratio" | ❌ 라벨에 TTM 표기 없음(업계 관행상 TTM으로 추정되나 페이지 자체엔 명시 없음) |
| **WallStreetZen** | 2개 | "P/E"(23.7x) · "P/E vs Market" | "P/E" | ❌ TTM/연간 구분 전혀 없음 |
| **MarketBeat** | 3개 | "P/E Ratio"(23.72, 헤드라인) · "Trailing P/E Ratio"(23.72) · "Forward P/E Ratio"(16.00) | "P/E Ratio"(Trailing과 동일값) | 🟡 Trailing/Forward만 라벨에 명시, 헤드라인 자체엔 없음 |

🔑 **3곳 전부 "Current PE"(연간·FY 기준)를 별도 라벨로 보여주지 않는다.** 우리 Q1/SEC 파이프라인이 계산하는 "annual" 기준은 Damodaran의 원전 데이터셋(`pedata.xls`)에는 존재하지만, **실무 소비자 플랫폼 3곳 어디에도 그 이름으로 노출되지 않는다.** 실무의 기본값은 전부 TTM(야후와 같은 정의) — 이 사실은 972가 이미 확보한 3곳(978에서도 재확인)과 일치하되, 이번엔 "몇 개를 보여주는가·라벨을 어떻게 다는가"까지 새로 확인했다.

🔴 **못 채운 것**: 3곳 모두 성공(978의 "실패 7곳" 목록엔 이번엔 접촉하지 않음 — 재실패 확인 불필요 판단, 성공한 곳만 재확인).
