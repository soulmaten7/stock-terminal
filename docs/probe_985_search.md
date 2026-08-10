# STEP 985 — 3번 규칙 기록 (①-A 3회 · ①-B 3회)

> 크론 배선 0 · DB 쓰기 0.

## A-0 (우리 자산) — 먼저 연 것

- `docs/probe_975_residual_decomposition.json` — STEP975의 "외부는 기말 발행주식수" 결론 원문 재확인: 실무 검증된 태그 우선순위 `us-gaap:CommonStockSharesOutstanding`(우선) → `CommonStockSharesIssued` → `dei:EntityCommonStockSharesOutstanding`. 15종목 중 14종목이 이 방식으로 정확히(daysFromAnchor=0) 일치.
- `docs/probe_984_mcap_root_cause.json` §2-2 — XOM 0.001% 오차 실측 재확인.

## ①-A — 시가총액 정의의 주식수 (원전 문헌 3회, 결론 상충 발견)

**A-1.** Financial Edge Training·Wikipedia("Shares outstanding") — basic(현재 발행) vs diluted(잠재 희석 포함)를 명확히 구분. *"Basic EPS counts only common shares... 최근 제출서류에 보고된 수"* — STEP975의 "기말 발행주식수"와 같은 개념(basic·point-in-time).

**A-2.** 🔴 **상충 발견** — WebSearch(wallstreetprep.com 계열 요약)이 *"The diluted number of shares outstanding is always used to calculate market capitalization... because the traded share price already reflects dilution"*라고 서술 — **STEP975의 "기말 발행주식수(basic, point-in-time)"와 반대 주장**처럼 읽힌다.

**A-3.** 🔴 **직접 대조로 상충 해소 시도** — 용어 사용이 느슨하다고 판단한다. "diluted"라는 단어를 "현재 발행주식수(=오늘자 outstanding count)"라는 뜻으로 캐주얼하게 쓰는 자료와, "희석주당순이익(diluted EPS) 계산용 가중평균 희석주식수"라는 기술적 의미로 쓰는 자료가 섞여 있다. **STEP975가 SEC 원자료에서 직접 검증한 것**(`CommonStockSharesOutstanding`=재무상태표 시점값이 외부 플랫폼과 ±1% 일치, `WeightedAverageNumberOfDilutedSharesOutstanding`=손익계산서 기간평균값은 다름)이 **말이 아니라 숫자로 검증된 사실**이므로 이걸 우선한다. 🔴 **결론적 해소는 2단계(전수 대조) 실측이 한다** — 야후 `sharesOutstanding`이 어느 쪽인지는 이론이 아니라 우리가 직접 재는 게 답이다(아래 §2).

## ①-B — 다른 서비스의 marketCap 재구성 관행 (984에서 1/3 미확보였던 것 채움)

**B-1. `yfinance`(Python, 가장 널리 쓰이는 야후 라이브러리) — GitHub 소스 직접 확인**

`quote.py`의 `market_cap` 프로퍼티: **shares × last_price가 주 계산식**이고, 실패 시에만 캐시된 "marketCap" 원시필드로 폴백한다(우리와 반대 우선순위 — yfinance는 재구성이 1순위, 원시필드가 폴백). 🔑 **재구성 자체가 이례적 처방이 아니라 업계에서 이미 쓰는 방식**이라는 근거를 확보했다 — 984에서 못 채운 "3곳 중 1곳"을 이걸로 채운다.

**B-2. Refinitiv 개발자 커뮤니티**(WebSearch) — *"market cap: outstanding shares × latest price"*를 표준 정의로 서술. 재구성 관행이라기보다 정의 자체가 이거라는 확인.

**B-3.** 🔴 **못 채움** — 세 번째 독립 서비스(RapidAPI 미러·다른 npm 라이브러리)는 이번에도 확인 안 함. B-1이 특히 강한 증거(소스코드 직접 확인)라 추가 탐색을 안 했다 — 시간 배분 판단, 미충족은 미충족으로 남긴다.
