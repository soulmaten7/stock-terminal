<!-- 2026-08-12 STEP 997 신설 -->
# 🗂️ 데이터 소스 카탈로그 ① — 이미 쓰는 5개 기관

> **이 문서가 정본이다.** `docs/data_source_catalog.xlsx`는 같은 내용의 사본(필터·정렬용)이며, 갱신은 이 md 파일을 먼저 고치고 그다음 xlsx를 다시 낸다.
> 🔴 조사·문서 전용 STEP(997)의 산출물 — 코드 0줄·DB 쓰기 0·크론 미호출.
> 범위 = **①단계, 이미 쓰는 5개 기관만**(SEC·Yahoo Finance·Nasdaq Trader·Damodaran·SPDR/State Street). 새 기관(FRED·Treasury·Polygon·FMP 등)은 ②단계 — 이 문서 범위 밖.

## 왜 이 카탈로그인가 (장은태 지적, 원문 근거)

소스 기관은 유한하다(20~30개 수준). 한 기관이 수십 가지를 제공하는데 우리는 각 기관의 엔드포인트를 하나씩만 알고 썼다 — 필요할 때마다 새로 찾는 사후 대응이 반복됐다. 실증 두 건:

1. **SEC `companyfacts.zip` 벌크를 STEP947부터 993까지 46개 STEP 동안 몰랐다** — SEC 공식 문서(`edgar-application-programming-interfaces`)에 "가장 효율적인 방법은 벌크 아카이브 ZIP 파일"이라고 명시돼 있었다.
2. **SEC `frames` API는 "특정 태그의 전 기업 값"을 한 번에 주는데, 우리는 같은 것을 얻으려고 종목당 한 번씩 5,893번 부른다.** (단, §3-1에서 이 대안 자체는 이미 다른 이유로 기각됐음을 확인 — 아래 참조.)

🔴 **이 카탈로그는 Q1(밸류) 전용이 아니다.** Q2(배당)~Q5(변화감지)가 전부 같은 5개 기관의 다른 엔드포인트를 쓸 수 있다.

---

## §3. 즉시 이득 판별 (맨 앞에 둔다 — 보고 형식 지시)

🔴 판단만 하고 실행하지 않는다. 각 판단 = "쓸 수 있다/없다 + 근거".

### 3-1. SEC `frames` API가 993의 순증 병목(40건/일)을 대체할 수 있는가?

**판정: 쓸 수 없다 — 이미 다른 이유로 기각됐고(STEP838→840), 그 병목 자체도 이미 다른 수단(995·996 벌크ZIP)으로 해결됐다.**

- **기계적 잠재력은 실재한다**: `frames`는 태그 1개·기간 1개당 "전 기업의 최종 제출값"을 한 번에 준다. 우리가 쓰는 태그(순이익·자기자본·매출·영업이익·D&A·부채·비영업자산·주식수 등, 폴백 변형 포함)를 태그당 5개년 프레임으로 부른다고 가정하면 대략 **100~200콜로 전 유니버스(5,893종목)를 커버할 수 있었을 것**(추정, 미검증) — 종목당 1콜(현재 5,893콜)보다 극적으로 적다.
- **그러나 이미 실측으로 기각된 경로다**: `docs/REVDCF_SPEC.md`에 STEP838의 최초 판단("수집 경로 = frames 채택")이 **STEP840에서 뒤집혔다**고 명시돼 있다 — *"frames는 횡단면 카운트용이고 개별 값 판정에 못 씀(GE·DE·URI·PEG·ATO가 companyfacts엔 존재)"*. 즉 특정 종목이 `frames`에서 통째로 빠지는 사례가 실측으로 확인됐다. 원인은 `frames`가 "최근 제출된 사실 1건 + 기간 365일±30일에 맞는 것만" 담기 때문(SEC 공식 문서 재확인) — **정정본·53주 결산·비달력 회계연도 기업이 누락**된다. `lib/revdcf/registry.ts`에도 동일 경고가 이미 있다: *"개별 판정에 쓰지 말 것."*
- **설령 커버리지 문제가 없었더라도, 지금은 이미 필요 없다**: STEP995~996이 `companyfacts.zip` 벌크(Range 부분접근)로 **같은 목표(SEC 호출 수 최소화)를 커버리지 손실 없이** 이미 달성했다 — 벌크는 `companyfacts` API와 **같은 원자료**를 주므로(995: 20/20 완전일치 실증) 개별판정 부적합 문제 자체가 없다. `frames`가 풀 수 있었던 문제를 벌크가 더 잘 이미 풀었다.
- **남는 용도**: 개별 판정이 아니라 **횡단면 카운트·교차검증**(예: "이 태그를 보고하는 기업이 총 몇 개인가") — 원래도 이 용도로만 쓰기로 확정돼 있었다(838 재확정).

### 3-2. SEC Financial Statement Data Sets(분기 CSV)가 우리 태그 조립을 대신할 수 있는가?

**판정: 대신할 필요 없다 — 이득이 없고 비용만 있다.**

- 스키마가 다르다(`num`/`pre`/`sub`/`tag` 4개 CSV 관계형 덤프) — 우리 `computeDrivers()`가 바로 못 먹는다. **새 파서가 필요**하다.
- 갱신 주기가 더 느리다(**분기** — 벌크ZIP은 **매일** 밤 3시 ET).
- "as filed" 그대로 제공(가공 없음) — 정정본 처리(우리는 이미 965의 vintage 정책으로 "최신 제출값" 로직을 구현해뒀다)를 **새로 만들어야** 한다. `companyfacts`/벌크ZIP은 이미 이 문제가 없는 형태다.
- 결론: 벌크ZIP이 이미 같은 원자료를 우리 기존 코드가 그대로 소화하는 형태로 준다(995 실증) — 이걸 두고 다른 스키마로 갈아탈 이유가 없다. **교차검증용 후보로는 남는다**(별도 판정 대상, 이번엔 판단 안 함).

### 3-3. 야후 외에 시가총액을 받을 수 있는 곳이 5개 기관 안에 있는가? (미해결 14번 우회)

**판정: 있다 — 최소 2개 후보. 미해결 14번(LOCAL_OK_PROD_FAIL) 우회 실험 가치 있음, 단 정의 확인이 먼저다.**

1. **Nasdaq 스크리너(`api.nasdaq.com/api/screener/stocks`)의 `marketCap` 필드** — 🔑 **이미 우리 DB에 부분 적재돼 있다**(`us_sector_nasdaq.market_cap`, STEP940에서 섹터 목적으로 적재, 시총 자체는 부산물로 방치됨). 단: (a) 정의 미명시(나스닥이 서버사이드로 미리 계산한 값 — 발행주식수 기준·시점을 우리가 모른다) (b) 지금은 2026-08-08 1회성 스냅샷일 뿐 매일 갱신 안 됨(재수집하면 갱신 가능) (c) 나스닥 자체가 비공식 API라 SLA 없음.
2. **야후 자체의 별도 코드 경로** — 현재 우리가 쓰는 `v7/finance/quote`(배치) 말고 `quoteSummary`(모듈 `price`/`summaryDetail`)가 **독립된 엔드포인트**로 `marketCap`을 준다. 340여 건 결측이 `v7/quote`만의 직렬화 문제라면 이 경로는 살아있을 수 있다(미검증 — 992·984 미해결 14번과 이어지는 별도 실측 필요). 또한 `defaultKeyStatistics.sharesOutstanding × price`로 **파생 계산**도 가능(원천이 다르진 않지만 필드 경로는 다름).
3. SEC의 `dei:EntityPublicFloat`는 시가총액과 **다른 개념**(내부자·계열사 보유분 제외)이고 연 1회 갱신 — 실시간 대체재 아님, 완만한 교차검증용.
4. SPDR 홀딩스 파일에는 개별 종목 시총이 없다(펀드의 보유 비중·주식수만) — 후보 아님.
5. Damodaran은 업종 단위 집계만 있음 — 후보 아님.

---

## 기관별 엔드포인트 개수 요약

| 기관 | 전수 확인된 엔드포인트/데이터셋 수 | 우리가 쓰는 수 | 비고 |
|---|--:|--:|---|
| SEC (EDGAR) | 13 | 5(companyfacts·companyconcept·submissions·bulk zip·company_tickers_exchange) | frames는 조회는 하나 개별판정엔 안 씀(횡단검증 전용) |
| Yahoo Finance(비공식) | 25+ 모듈/엔드포인트 | 4(quote·quoteSummary[assetProfile]·chart·fundamentalsTimeSeries) | quoteSummary 자체는 30여 서브모듈 중 1개만 씀 |
| Nasdaq Trader/api.nasdaq.com | 24 | 4(symdir 2개·screener·ipo/dividends calendar) | 대부분 비공식(api.nasdaq.com), symdir 2개만 공식 문서 있음 |
| Damodaran(NYU) | 약 30개 파일(미국 컷 기준, 지역변형 제외) | 8(indname·taxrate·countrytaxrates·wacc·betas·capex·wcdata + totalbeta는 미사용) | ratings.xls·fundgrEB.xls·histimpl.xls가 즉시 검토 후보(아래 §신규 발견 참조) |
| SPDR/State Street | 5개 제품군(섹터ETF·핵심지수ETF·산업ETF·팩터ETF·펀드메타파일) | 1(11개 섹터 ETF 홀딩스) | `spdr-product-data-us-en.xlsx` 마스터 파일 신규 발견(전 SPDR 펀드 메타데이터 1파일) |

---

## 1. SEC (EDGAR)

**공식 문서**: `sec.gov/search-filings/edgar-application-programming-interfaces`(API 목록) · `sec.gov/search-filings/edgar-search-assistance/accessing-edgar-data`(접근 정책) · `sec.gov/data-research/sec-markets-data/financial-statement-data-sets`(분기 데이터셋). **라이선스** = 미국 연방정부 저작물(17 U.S.C. §105) — 퍼블릭 도메인, 저작권 없음. **레이트리밋** = 10 req/s(전 IP·전 기기 합산, 원문 인용: *"Current max request rate: 10 requests/second"*), 초과 시 IP 임시 차단 가능. **User-Agent 필수**(조직명+연락처, 없으면 403).

| 엔드포인트 | URL 패턴 | 무엇을 주는가(필드) | 정의 | 형식 | 크기 | 갱신주기 | 우리가 쓰는가 | 어느 자리 |
|---|---|---|---|---|---|---|---|---|
| companyfacts | `data.sec.gov/api/xbrl/companyfacts/CIK##########.json` | us-gaap·dei 전 태그의 연도별 값(모든 unit) | 기업이 실제 제출한 XBRL 사실 그대로(정정 이력 `accn` 포함) | JSON | 종목당 평균 951KB(995 실측, 미압축) | 실시간(제출 즉시 반영, 처리지연 <1분) | ✅ **값 추출 정본** — route.ts·lib/revdcf/drivers.ts | 순이익·자기자본·매출·영업이익·D&A·부채·비영업자산·주식수 전부 |
| companyconcept | `data.sec.gov/api/xbrl/companyconcept/CIK##########/us-gaap/{tag}.json` | 단일 기업·단일 개념의 전 unit별 값 | companyfacts의 부분집합(태그 1개) | JSON | 작음 | 실시간 | 부분(구 probe 스크립트) | 위와 동일(단일태그 조회용) |
| frames | `data.sec.gov/api/xbrl/frames/{ns}/{tag}/{unit}/CY####[Q#][I].json` | 태그 1개·기간 1개의 **전 기업** 최종 제출값 | "가장 최근 제출된 사실 1건" + 기간 365일±30일(연간)/91일±30일(분기) 정합 | JSON | 태그·기간별 상이(작음) | 실시간 | ✅ **횡단면 카운트·교차검증 전용**(개별판정 금지, §3-1 참조) | 유니버스 커버리지 측정용(값 추출엔 안 씀) |
| submissions | `data.sec.gov/submissions/CIK##########.json` | 제출이력·현재상호·구상호·거래소·티커 | 기업 메타데이터(SIC 포함) | JSON | 종목당 수십~수백KB | 실시간(<1초 지연) | ✅ 8-K 피드(lib/eightK.ts)·구 probe | 섹터(SIC 보조)·8-K 이벤트 |
| companyfacts.zip(벌크) | `sec.gov/Archives/edgar/daily-index/xbrl/companyfacts.zip` | companyfacts 전체(20,200개 CIK) | 위와 동일(같은 원자료) | ZIP(내부 JSON) | 1.4GB 압축·19.2GB 압축해제(995 실측) | **매일 03:00 ET** | ✅ **STEP995~996 도입** — Range 부분접근 | 위와 동일, 전 유니버스 |
| submissions.zip(벌크) | `sec.gov/Archives/edgar/daily-index/bulkdata/submissions.zip` | submissions 전체 | 위와 동일 | ZIP(내부 JSON) | 미측정(이번 STEP 범위 밖) | 매일 03:00 ET | ❌ 미사용(개별 API로 충분한 빈도) | 섹터·메타 확장 후보 |
| Financial Statement Data Sets | `sec.gov/data-research/sec-markets-data/financial-statement-data-sets` | 재무제표 표면 숫자(num·pre·sub·tag 4개 CSV) + SIC | "as filed" 그대로(정정본 별도 처리 안 됨), 원문 인용: *"presented without change from the as filed financial reports"* | ZIP(CSV) | 미측정 | **분기**(다음 분기 게시에 반영) | ❌ 미사용(§3-2에서 불필요 판정) | 값 추출 대안(비권장) |
| Financial Statement and Notes Data Sets | `sec.gov/data-research/sec-markets-data/financial-statement-notes-data-sets` | 위보다 넓음(주석 전체 포함) | 위와 동일 원칙 | ZIP(CSV) | 미측정(더 큼) | **월별**(2023-04~) | ❌ 미사용 | 주석 상세 추출 후보(미검토) |
| company_tickers.json | `sec.gov/files/company_tickers.json` | 티커↔CIK(거래소 정보 없음) | SEC 자체 매핑 | JSON | 작음 | 매일 갱신(last-modified 확인) | ❌(exchange 버전 사용) | CIK 매핑 |
| company_tickers_exchange.json | `sec.gov/files/company_tickers_exchange.json` | 티커↔CIK↔거래소 | 위 + 거래소 | JSON | 작음(10,432행) | 매일 갱신(실측 확인) | ✅ **us_cik_map 정본** | CIK 매핑 |
| Full Text Search API | `efts.sec.gov/LATEST/search-index?q=...&forms=...` | 제출문서 전문검색(스니펫·CIK·양식·날짜) | 색인된 전문검색(2001~) | JSON | 쿼리당 소량 | 실시간 | ❌ 미사용 | 특정 키워드(소송·정정 공시 등) 탐지 후보 |
| EDGAR daily/full index | `sec.gov/Archives/edgar/daily-index/`·`full-index/` | 그날/그분기 전 제출 목록(CIK·회사명·양식·날짜·파일경로) | SEC 색인 그대로 | TXT/CSV/JSON | 일별 소량 | 매일 | ❌ 미사용 | "오늘 뭐가 제출됐나" 피드 후보 |
| Public Dissemination Service(PDS) | 별도 유료 실시간 피드 | 제출 즉시 원문 스트림 | — | — | — | 유료(구독) | ❌ 미사용(비용) | 실시간성 극대화 후보(비용 이슈) |

**🔑 신규 발견**: 없음(SEC는 이미 993·995에서 충분히 파악됨). 이번엔 companyfacts.zip 채택 후 정합성 재확인 + Financial Statement (Notes) Data Sets·Full Text Search·EDGAR index·PDS를 명시적으로 "안 쓰는 이유"까지 기록한 것이 이번 STEP의 몫.

---

## 2. Yahoo Finance (비공식 — 공식 문서 없음)

🔴 **공식 문서 자체가 없다.** `yahoo-finance2`(이미 보유 라이브러리) 소스코드·응답 필드에서 직접 확인. **정의(基準) 칸은 사실상 전부 "미명시"** — 이 사실 자체를 표에 남긴다(CLAUDE.md 규칙 5-1: 원전 없는 항목은 정의 공개표로 대체).

**인증**: crumb+cookie(라이브러리가 자동 획득, `finance.yahoo.com`→`guce.yahoo.com` 동의 리다이렉트→`v1/test/getcrumb`) — API 키 아님, 깨지기 쉬움(2023·2024 각각 흐름 변경 이력). **레이트리밋**: 공식 미공개, 커뮤니티 보고 시간당 약 360콜에서 429 시작. **비용**: 무료.

| 엔드포인트/모듈 | 주요 필드 | 정의 | 형식 | 갱신주기 | 우리가 쓰는가 | 어느 자리 |
|---|---|---|---|---|---|---|
| `quote()`(`v7/finance/quote`) | marketCap·sharesOutstanding·regularMarketPrice·trailingPE·priceToBook 등 | marketCap 계산기준 미명시(shares×price로 추정) | JSON | 실시간/15분지연 | ✅ **us_market_cap 정본**(배치) | 시총·주가·주식수 |
| `quoteSummary(assetProfile)` | sector·industry·주소·임원·리스크점수 | 자체 분류(GICS 아님, 매핑표 없음) | JSON | 비정기 | ✅ **섹터 3순위**(lib/sector.ts) | 섹터 |
| `quoteSummary(summaryDetail)` | marketCap·beta·trailingPE·dividendYield 등 | v7/quote와 **별도 코드경로** | JSON | 실시간/일별 | ❌ 미사용 | 🔑 **시총 대체경로 후보**(§3-3) |
| `quoteSummary(defaultKeyStatistics)` | sharesOutstanding·floatShares·bookValue·enterpriseValue·pegRatio | 미명시 | JSON | 분기 갱신 | ❌ 미사용 | 🔑 **주식수 독립 소스**(시총 파생계산 후보) |
| `quoteSummary(price)` | marketCap·regularMarketPrice·exchange | 미명시 | JSON | 실시간 | ❌ 미사용 | 시총·주가 대체경로 |
| `quoteSummary(financialData)` | totalCash·totalDebt·totalRevenue·ebitda·margins·FCF | TTM 기준(정확한 기준일 미명시) | JSON | 분기 | ❌ 미사용(SEC가 정본) | 재무 교차검증 후보 |
| `quoteSummary(incomeStatementHistory[Quarterly])` | 매출·매출원가·매출총이익·영업비용·영업이익·순이익 | 정정 반영 여부 미명시 | JSON | 분기/연 | ❌ 미사용 | 손익 교차검증 |
| `quoteSummary(balanceSheetHistory[Quarterly])` | 총자산·총부채·자기자본·현금·부채 | 미명시 | JSON | 분기/연 | ❌ 미사용 | 재무상태 교차검증 |
| `quoteSummary(cashflowStatementHistory[Quarterly])` | 영업현금흐름·CapEx·FCF·배당지급 | 미명시 | JSON | 분기/연 | ❌ 미사용 | 현금흐름 교차검증 |
| `quoteSummary(earnings)` | 분기 실적 실제vs추정·연간차트 | 추정치 출처 미명시 | JSON | 분기 | ❌ 미사용 | 어닝서프라이즈(과거 SUE 검토에서 이미 기각된 방향) |
| `quoteSummary(earningsHistory)` | EPS 실제·추정·서프라이즈% | 미명시 | JSON | 분기 | ❌ 미사용 | 상동 |
| `quoteSummary(earningsTrend)` | 향후 분기·연도 애널리스트 컨센서스(성장률·추정치) | 컨센서스 기여자 수 미명시 | JSON | 주간 갱신 | ❌ 미사용 | 🔑 **역DCF 성장경로(층5) 후보** — 컨센서스 부재가 "가장 큰 구멍"이었음 |
| `quoteSummary(recommendationTrend)` | 매수/보유/매도 등급 카운트(월별) | 미명시 | JSON | 월별 버킷 | ❌ 미사용 | 해당없음(추천 안 함 원칙과 충돌) |
| `quoteSummary(upgradeDowngradeHistory)` | 등급 변경 이력 | 미명시 | JSON | 이벤트성 | ❌ 미사용 | 해당없음 |
| `quoteSummary(insiderHolders/insiderTransactions)` | 내부자 보유·거래 내역 | Form4 기반(지연 미명시) | JSON | 이벤트성 | ❌ 미사용 | 소유구조 신호 후보 |
| `quoteSummary(institutionOwnership/fundOwnership/majorHoldersBreakdown)` | 기관·펀드 보유비율 | 13F 기반(법정 45일 지연) | JSON | 분기 | ❌ 미사용 | 소유구조 신호 후보 |
| `quoteSummary(netSharePurchaseActivity)` | 내부자 순매수/매도 | 미명시 | JSON | 분기/반기 | ❌ 미사용 | 소유구조 신호 |
| `quoteSummary(calendarEvents)` | 실적발표일·배당락일 | 미명시 | JSON | 확정시 갱신 | ❌ 미사용 | 이벤트 캘린더 후보 |
| `quoteSummary(secFilings)` | EDGAR 제출 목록(직접 링크) | SEC 색인 패스스루 | JSON | 이벤트성 | ❌ 미사용 | SEC 원문 링크 보조 |
| `quoteSummary(quoteType)` | 증권유형·거래소·최초거래일 | 미명시 | JSON | 정적 | ❌ 미사용 | 증권유형 게이트 |
| `quoteSummary(topHoldings/fundProfile/fundPerformance)` | 펀드 전용(ETF 보유내역·수익률) | 미명시 | JSON | 주기적 | ❌ 미사용 | 해당없음(개별주 전용 제품) |
| `chart()`(`v8/finance/chart`) | OHLCV 시계열·분할/배당 이벤트 | adjclose 조정방식 미명시 | JSON | 분~일 단위 | ❌ 미사용 | 가격 히스토리(현재 us_stock_perf가 별도 소스) |
| `fundamentalsTimeSeries()` | annual/quarterly/trailing 접두 재무 시계열 | quoteSummary 재무모듈과 같은 원자료, 시계열 형태만 다름 | JSON | 분기/연 | ✅ **일부 사용**(코드 확인) | 재무 시계열 |
| `options()` | 옵션체인(행사가·IV·미결제약정) | 미명시 | JSON | 실시간/지연 | ❌ 미사용 | 해당없음(범위 밖) |
| `screener()` | 15개 고정 스크린(day_gainers 등)만, 스크린당 종목별 marketCap 등 100여 필드 | quote와 동일 필드셋, 사전정의 목록만 | JSON | 실시간 재랭킹 | ❌ 미사용 | ⚠️ **전 유니버스 대체 불가**(고정 15개 목록만, 임의 종목 조회 안 됨) |
| `trendingSymbols()` | 지역별 인기 심볼 목록(값 없음) | — | JSON | 실시간 | ❌ 미사용 | 해당없음 |
| `esgScores` | (라이브러리 이슈 #952 — **현재 미제공/제한됨**) | N/A | N/A | N/A | ❌ 불가 | 해당없음 |

**🔑 신규 발견 — 즉시 검토 가치**: ① `quoteSummary(price/summaryDetail)`가 `v7/quote`와 **별도 코드경로**로 marketCap을 줌 — 미해결 14번(340여 건 결측이 v7 전용 버그라면 이 경로가 살아있을 수 있음, 미검증) ② `defaultKeyStatistics.sharesOutstanding`가 독립 주식수 소스라 시총 파생계산(주식수×주가) 가능 ③ `earningsTrend`의 컨센서스 성장률이 역DCF 성장경로(층5, 명시적으로 "가장 큰 구멍") 후보일 수 있음(단 컨센서스 기여자 수·품질 미명시라 신중 검토 필요).

---

## 3. Nasdaq Trader / api.nasdaq.com

**공식 문서 있는 것**: `nasdaqtrader.com/trader.aspx?id=symboldirdefs`(심볼 디렉터리 필드 정의 — 진짜 공식) · `nasdaqtrader.com/Trader.aspx?id=ShortInterest`(공매도 잔고, 유료 SFTP). **공식 문서 없는 것**: `api.nasdaq.com/*` 전부(nasdaq.com 웹사이트의 비공식 백엔드, 커뮤니티 역공학) — Origin/Referer 헤더로 브라우저 흉내(진짜 인증 아님). **레이트리밋**: 전부 미명시. **비용**: symdir·screener·api.nasdaq.com 전부 무료, 공매도 SFTP만 유료.

| 엔드포인트 | 필드 | 정의 | 형식 | 공식여부 | 갱신 | 우리가 쓰는가 | 어느 자리 |
|---|---|---|---|---|---|---|---|
| `nasdaqtrader.com/dynamic/symdir/nasdaqlisted.txt` | Symbol·Security Name·Market Category·Test Issue·**Financial Status**·Round Lot·ETB | Financial Status 원문: *"Indicates when an issuer has failed to submit its regulatory filings on a timely basis, has failed to meet Nasdaq's continuing listing standards, and/or has filed for bankruptcy"*(D/E/Q/N 등 코드) | 파이프구분 TXT | ✅ 공식 | 매일 | ✅ **유니버스 정본**(scripts/refresh_us_symbols.ts) | 유니버스·🔑 **상장폐지 위험 플래그 후보**(현재 미사용) |
| `nasdaqtrader.com/dynamic/symdir/otherlisted.txt` | ACT Symbol·Exchange·CQS Symbol·**ETF**·Round Lot·Test Issue | ETF = 자체신고 분류(발행사 제출 기준, 보유구조 기반 아님) | 파이프구분 TXT | ✅ 공식 | 매일 | ✅ 유니버스 정본 | 유니버스·ETF 필터 |
| 공매도잔고(SFTP) | 종목별 공매도 주식수·결제일·평균거래량·상환일수 | 반월 결제일 기준, 공식 정의페이지 존재 | CSV(SFTP) | ✅ 공식(정의만) | 반월 | ❌ **유료라 미사용** | 공매도 신호 후보(비용 이슈) |
| `api.nasdaq.com/api/screener/stocks` | symbol·name·sector·industry·country·ipoyear·**marketCap** | marketCap = 나스닥 서버사이드 사전계산(정의 미명시) | JSON | ❌ 비공식 | 취득시각 기준(응답에 as_of 없음) | ✅ **섹터 3순위 재료**(us_sector_nasdaq) | 섹터·🔑 **시총 대체경로 후보**(§3-3) |
| `api.nasdaq.com/api/quote/{symbol}/info` | 현재가·매수/매도호가·거래량·52주 고저 | 미명시 | JSON | ❌ 비공식 | 실시간 성격 | ❌ 미사용 | 가격 대체경로 |
| `api.nasdaq.com/api/quote/{symbol}/summary` | marketCap(서버계산)·섹터·업종·배당수익률·거래량 | 미명시 | JSON | ❌ 비공식 | 실시간 성격 | ❌ 미사용 | 시총·섹터 대체경로(screener와 중복) |
| `api.nasdaq.com/api/quote/{symbol}/historical` | 일별 OHLCV | 미명시(1개월 미만 구간 조회 시 빈 응답 버그 보고됨) | JSON | ❌ 비공식 | 일별 | ❌ 미사용 | 가격 히스토리 |
| `api.nasdaq.com/api/quote/{symbol}/dividends` | 배당락일·배당액·수익률·이력 | 미명시 | JSON | ❌ 비공식 | 이벤트성 | ❌ 미사용(캘린더는 별도 엔드포인트 사용중) | 배당 상세(현재 캘린더만 사용) |
| `api.nasdaq.com/api/quote/{symbol}/eps` | EPS 이력 | 미명시 | JSON | ❌ 비공식 | 분기 | ❌ 미사용 | 실적 히스토리 |
| `api.nasdaq.com/api/quote/{symbol}/option-chain` | 옵션체인 | 미명시 | JSON | ❌ 비공식 | 실시간 성격 | ❌ 미사용 | 범위 밖 |
| `api.nasdaq.com/api/quote/{symbol}/short-interest` | 공매도 잔고(반월 포인트) | 🔑 **유료 SFTP의 무료 비공식 미러로 추정**(정의 신뢰도 미검증) | JSON | ❌ 비공식 | 반월(추정) | ❌ 미사용 | 공매도 신호(무료 대체 후보) |
| `api.nasdaq.com/api/company/{symbol}/company-profile` | 사업설명·주소·임원 | 미명시 | JSON | ❌ 비공식 | 비정기 | ❌ 미사용 | 회사개요 |
| `api.nasdaq.com/api/company/{symbol}/financials` | 손익·재무상태·현금흐름(분기/연) | 🔴 필드-GAAP 매핑 완전 미확인(가장 신뢰도 낮음) | JSON | ❌ 비공식 | 분기/연 | ❌ 미사용 | 재무 대체경로(비권장, SEC 대비 신뢰도 낮음) |
| `api.nasdaq.com/api/company/{symbol}/revenue` | 매출 세부 | 미명시 | JSON | ❌ 비공식 | 분기/연 | ❌ 미사용 | 상동 |
| `api.nasdaq.com/api/company/{symbol}/earnings-surprise` | 과거 EPS 서프라이즈 | 미명시 | JSON | ❌ 비공식 | 분기 | ❌ 미사용 | SUE류(기각된 방향) |
| `api.nasdaq.com/api/company/{symbol}/insider-trades` | 내부자 거래내역 | Form4 추정(미확인) | JSON | ❌ 비공식 | 이벤트성 | ❌ 미사용 | 소유구조 신호 |
| `api.nasdaq.com/api/company/{symbol}/institutional-holdings` | 기관보유 요약·개별 기관명·보유주식·평가액 | 🔴 **회사 전체 발행주식수 필드 없음**(보유자별 절대주식수만) | JSON | ❌ 비공식 | 분기(13F 추정) | ❌ 미사용 | 소유구조(발행주식수 소스 아님, §3-3 관련 부정 결과) |
| `api.nasdaq.com/api/company/{symbol}/sec-filings` | 제출목록(양식·날짜·링크) | SEC 색인 미러 | JSON | ❌ 비공식 | 이벤트성 | ❌ 미사용(SEC 원본 우선) | 해당없음 |
| `api.nasdaq.com/api/analyst/{symbol}/earnings-date` | 다음 실적발표일 | 미명시 | JSON | ❌ 비공식 | 실적 전 갱신 | ❌ 미사용 | 이벤트 캘린더 |
| `api.nasdaq.com/api/analyst/{symbol}/earnings-forcast` | 애널리스트 EPS·매출 추정 | 출처·방법론 미명시 | JSON | ❌ 비공식 | 주기적 | ❌ 미사용 | 컨센서스 후보(원전대조 불가라 채택 어려움) |
| `api.nasdaq.com/api/analyst/{symbol}/ratings` | 매수/보유/매도 집계 | 미명시 | JSON | ❌ 비공식 | 주기적 | ❌ 미사용 | 해당없음(추천 안 함 원칙) |
| `api.nasdaq.com/api/analyst/{symbol}/targetprice` | 목표주가(평균/고/저) | 미명시 | JSON | ❌ 비공식 | 주기적 | ❌ 미사용 | 해당없음 |
| `api.nasdaq.com/api/calendar/earnings` | 그날 실적발표 예정 종목 | 미명시 | JSON | ❌ 비공식 | 매일 | ❌ 미사용 | 실적 캘린더 |
| `api.nasdaq.com/api/calendar/splits` | 그날 액면분할 예정 | 미명시 | JSON | ❌ 비공식 | 매일 | ❌ 미사용 | 주식수 연속성 보정 후보 |
| `api.nasdaq.com/api/ipo/calendar` | IPO 예정·최근 상장 | 미명시 | JSON | ❌ 비공식 | 매일 | ✅ **이미 사용**(app/api/ipo/us-feed) | IPO 피드 |
| `api.nasdaq.com/api/calendar/dividends` | 그날 배당락 종목 | 미명시 | JSON | ❌ 비공식 | 매일 | ✅ **이미 사용**(app/api/dividends/us-feed) | 배당 피드 |

**🔑 신규 발견**: ① `nasdaqlisted.txt`의 **Financial Status 플래그**(공식 정의 있음, D=Deficient·Q=Bankrupt 등)를 우리가 지금 안 씀 — 상장폐지·부실 위험 신호로 즉시 활용 가능한 후보 ② `/api/quote/{symbol}/short-interest`가 유료 공식 상품의 무료 비공식 미러로 추정됨(신뢰도 미검증이나 비용 0으로 공매도 데이터 확보 가능) ③ **`institutional-holdings`에 발행주식수 총계가 없다는 것을 확인** — 즉 나스닥은 발행주식수 독립 소스가 못 됨(marketCap은 서버 사전계산값만 가능, §3-3에 반영).

---

## 4. Damodaran (NYU Stern)

**공식 페이지**: `pages.stern.nyu.edu/~adamodar/New_Home_Page/datacurrent.html`(현재 데이터 목록, 1차 출처) · `.../datahistory.html`(갱신정책, 원문 인용: *"I update most of the data only once a year, in the first two weeks of January"*). **라이선스**: 명시적 라이선스 문구 없음(학술 공개 자료, 실무상 광범위 인용·활용됨) — 무료·키 불필요. **구조**: 거의 모든 데이터셋이 **미국+7개 지역변형**(Europe·Japan·Australia/NZ/Canada·Emerging·China·India·Global)으로 8중 발행 — 이 표는 **미국 파일명만** 적는다.

이미 쓰는 8개(기존 registry.ts 그대로, 반복 생략): `indname.xls`·`taxrate.xls`·`countrytaxrates.xls`·`wacc.xls`·`betas.xls`·`capex.xls`·`wcdata.xls`·`totalbeta.xls`(미사용).

### 신규 발견 — 마진·수익성

| 파일 | 내용 | 정의 | 어느 자리(미사용 후보) |
|---|---|---|---|
| `margin.xls` | 업종별 매출총이익률·영업이익률·순이익률 | 94업종 집계, 시점 = 연1회 갱신 시점 | 마진 벤치마크(fade 목표치 후보) |
| `roe.xls` | 업종별 ROE 분해(마진×회전율×레버리지)·ROC/ROIC | 듀폰 분해 | ROIC 벤치마크(성장률=ROIC×재투자율 공식과 연결) |
| `EVA.xls` | 업종별 EVA($)·자기자본EVA($) | NOPAT − 자본비용×투하자본 | 미사용(가치창출 진단용, DCF 입력 아님) |

### 신규 발견 — 배수(Multiples)

| 파일 | 내용 | 정의 | 어느 자리 |
|---|---|---|---|
| `pedata.xls` | 업종별 트레일링/포워드 PE·PEG·기대성장률 | 시점 스냅샷(1월 갱신) | 업종 배수 벤치마크(Q1 교차검증) |
| `pbvdata.xls` | 업종별 P/BV·EV/BV·ROE | 시점 스냅샷 | 업종 배수(PBR 교차검증) |
| `psdata.xls` | 업종별 P/S·EV/S·마진 | 시점 스냅샷 | 업종 배수(PSR 교차검증) |
| `vebitda.xls` | 업종별 EV/EBIT·EV/EBITDA | 시점 스냅샷 | 🔑 업종 배수(EV/EBITDA 교차검증 — 역DCF 산출 NOPAT/EBITDA와 직결) |
| `mktcapmult.xlsx` | 시총 구간별(업종 아닌 규모별) 배수 | 규모 10분위 | 미사용(대안 분류축) |
| `countrystats.xls` | 국가별 배수 평균 | 국가 단위 | 미사용(US 단독 정책과 무관) |

### 신규 발견 — 자본비용·위험

| 파일 | 내용 | 정의 | 어느 자리 |
|---|---|---|---|
| `histretSP.xls` | 주식/국채/T-bill/부동산 연간수익률(1928~) | 실현 수익률 시계열 | 무위험수익률·ERP의 역사적 기초자료(현재 wacc.xls 상단값의 원천 추정) |
| `histimpl.xls` | 내재 ERP 시계열(연도별, 월별 갱신 포함) | S&P500 DDM/DCF 역산 내재 ERP — **역사적(realized) ERP가 아니라 시장 내재치** | 🔑 **ERP 대안**(현재보다 자주 갱신되는 시장반영형) |
| `ctryprem.xlsx`(+연중 복수판) | 국가별 디폴트스프레드·ERP·컨트리리스크프리미엄(150여개국) | 국가신용등급 기반 | 🅿️ 파킹(비US 확장용, 지금 안 씀) |
| `ratings.xls` | 신용등급대별 이자보상배율 구간·스프레드(대형/소형 별도표) | 🔑 다모다란 자신의 WACC 모델이 쓰는 "합성등급" 룩업테이블 | 🔑 **종목별 부채비용 산출 후보** — 현재 업종평균 WACC 대신 기업별 이자보상배율로 개별 신용스프레드 추정 가능 |
| `mktcaprisk.xlsx` | 시총 구간별 베타·변동성 | 규모 10분위 | 미사용(대안 분류축) |

### 신규 발견 — 성장률

| 파일 | 내용 | 정의 | 어느 자리 |
|---|---|---|---|
| `fundgr.xls` | 업종별 EPS 기대성장률 | = ROE×유보율(공식 산출, 컨센서스 아님) | 성장률(EPS 기준) |
| `fundgrEB.xls` | 업종별 EBIT 기대성장률 | 위와 동일 로직을 EBIT에 적용 | 🔑 **역DCF 성장경로(층5) 후보** — "컨센서스 없음"이 가장 큰 구멍이었는데, 이건 컨센서스가 아니라 다모다란 자신의 공식산출 비컨센서스 성장률이라 우리 "과거추세" 원칙과 결이 맞음. NOPAT 기반 모델과도 EBIT이라 더 부합 |
| `histgr.xls` | 업종별 과거 5/10년 실현 이익성장률(CAGR) | 후행 실현치 | 성장률 교차검증(우리 Q3 층의 업종 벤치마크) |

### 신규 발견 — 자본구조·배당·기타(미사용, 진단용)

| 파일 | 내용 | 후보 여부 |
|---|---|---|
| `debtdetails.xls` | 부채 구성(고정/변동, 담보/무담보, 만기) | 부채 구성요소 세분화 후보(현재는 단일 부채 잔액만 사용) |
| `leaseeffect.xls` | 운용리스 자본화 조정 | ASC842 도입 이후 대부분 이미 재무제표 내 반영돼 유용성 감소 추정 |
| `R&D.xls` | R&D 지출/매출 비율 | 🔑 R&D 자본화 조정(등록부에 이미 "미검토·미배선" 이슈로 있던 항목) |
| `divfcfe.xls`·`divfund.xls`·`inshold.xls`·`goodwill.xls`·`finflows.xls`·`Employee.xls`·`DollarUS.xls`·`MktCap.xls`·`macro.xls`·`macrodur.xls`·`optvar.xls` | (각각 배당정책·소유구조·영업권·자금조달·인당지표·달러표시 업종총계·업종시총·거시변수·옵션변동성) | 대부분 미사용, 밸류에이션 핵심 슬롯과 직결 안 됨(문서에 개별 기재, 표는 위 §신규발견 5절 원문 참조) |

**🔑 즉시 검토 가치 상위 4개**(원전 대조표 절차 전제, 이번 STEP은 판정 아님): `ratings.xls`(종목별 부채비용) · `fundgrEB.xls`(성장경로 층5 후보) · `histimpl.xls`(내재 ERP) · `vebitda.xls`/`pedata.xls`(배수 교차검증).

---

## 5. SPDR / State Street Global Advisors

**공식 페이지**: 개별 ETF 상품페이지(예: `ssga.com/us/en/intermediary/etfs/state-street-spdr-sp-500-etf-trust-spy`) · 홀딩스 파일 자체(자기 설명적). **라이선스 — 🔴 확인 필요**: 홀딩스 XLSX 파일 내부에 직접 명시된 문구: *"The whole or any part of this work may not be reproduced, copied or transmitted or any of its contents disclosed to third parties without SSGA's express written consent."* — 우리가 이 데이터에서 **파생시킨 섹터 라벨을 내부적으로 쓰는 것**과 **원본 홀딩스 표 자체를 재배포하는 것**은 다른 행위이나, 그 경계가 별도로 명문화돼 있지 않음(법무 검토 필요 항목으로 등재).

| 제품군 | 예시 티커 | 무엇을 추종 | 홀딩스 파일 확인 | 정의 | 형식 | 갱신 | 우리가 쓰는가 | 어느 자리 |
|---|---|---|---|---|---|---|---|---|
| 섹터 Select ETF(11개) | XLK·XLF·XLV 등 | S&P 500 GICS 11섹터 | ✅ 사용중 | 일별 보유종목·비중·섹터 라벨 | XLSX | 매일("As of" 자기표기 확인) | ✅ **GICS 진짜 정답지**(939) | 섹터 |
| 핵심지수 ETF | SPY(S&P500)·MDY(S&P400) | 대형/중형주 벤치마크 | ✅ SPY 직접 확인(504종목) | 위와 동일 스키마 | XLSX | 매일 | ❌ 미사용 | 🔑 커버리지 확장 후보(S&P500 넘어서는 확장은 안 됨, SPY 자체가 S&P500) |
| 산업 ETF(섹터보다 세분) | KBE(은행)·KRE(지방은행)·XHB(주택건설)·XBI(바이오)·XSD(반도체) | S&P Select Industry Indices | ✅ KBE 직접 확인(103종목) | Sector 컬럼은 **여전히 대분류 GICS**(세분류는 "어느 ETF에 속하는가"로만 판별 가능) | XLSX | 매일 | ❌ 미사용 | 🔑 서브인더스트리 근사 후보(간접적) |
| 팩터 ETF | SPYV/SPYG(가치/성장)·MDYV/MDYG(중형가치/성장)·ONEV·ONEY·QUS | 가치·성장·저변동성·수익률·품질 팁트 | ✅ MDYV 직접 확인, 나머지 패턴만 확인 | 팩터 정의(지수사 기준) | XLSX | 매일 | ❌ 미사용 | 미사용(팩터 렌즈와 잠재 연결 가능하나 이번 범위 밖) |
| Kensho 테마 ETF | (Intelligent Structures 등) | Kensho 자체정의 테마지수(GICS 아님) | 미확인 | — | XLSX(추정) | 매일(추정) | ❌ 미사용 | 미사용(GICS 대체재 아님) |
| 🔑 **전체 SPDR 펀드 메타데이터**(신규 발견) | `spdr-product-data-us-en.xlsx` | 약 253개 SPDR 상품 전체 1파일 | ✅ 직접 확인·파싱 | Ticker·ISIN·만기비용비율·**AUM(Total Net Assets)**·**주식수(Shares Outstanding)**·**시가총액가중평균(Weighted Average Market Cap)**·P/E·P/B 등 | XLSX | 매일(추정) | ❌ 미사용(이번에 처음 발견) | 펀드 레벨 메타(개별종목 시총 아님 — 펀드 전체 지표) |

**핵심 한계(재확인)**: 홀딩스 파일에는 **개별 종목의 시가총액·발행주식수가 없다**(펀드의 "보유 주식수"·"비중"만 있음 — 펀드 관점 데이터이지 종목 관점 데이터가 아님). §3-3의 시총 대체 후보에서 SPDR은 제외되는 이유가 이것으로 재확인됨.

**🔑 신규 발견**: ① 섹터 ETF 패턴이 **최소 SPY·KBE·MDYV 3개 다른 상품에서도 동일하게 작동**함을 직접 fetch로 확인(즉 11개 섹터ETF 전용이 아니라 SPDR 전 상품군에 적용되는 일반 엔드포인트) ② 산업 ETF(KBE 등)로 서브섹터(은행 vs 지방은행 등) 근사 가능성 ③ 라이선스 문구를 이번에 처음 원문으로 확인 — 법무 검토 대상으로 등재.

---

## §1-B. 동종 US 서비스가 이 조합을 어떻게 쓰는가 (3곳 + 보충)

🔴 US 한정. 조사 결과: **"SEC XBRL 원문 + Damodaran 업종 벤치마크"를 동시에 쓰는 서비스는 확인된 3곳 중 사실상 없다** — 이 조합 자체가 드물다.

| 서비스 | SEC 원문 직접 사용? | Damodaran 사용? | 어떻게 조합하는가 |
|---|---|---|---|
| **Simply Wall St** | ❌ (S&P Global Market Intelligence가 정규화한 것을 씀) | ❌ | 펀더멘털=S&P Global, 가격=ICE — 원문 XBRL 미접촉 |
| **stockanalysis.com** | ❌ (S&P Global·Fiscal AI 이원화) | ❌ | 데이터 종류별로 벤더를 따로 명시(펀더멘털·가격·애널리스트·기업행동·ETF보유 전부 별도 벤더) — "카테고리별 벤더 분리"가 이들의 패턴 |
| **Finbox** | ❌ (S&P Global 정규화) | ✅ **유일하게 확인된 SEC+Damodaran 병존 사례** | 단, **같은 화면에 병치할 뿐 하나의 계산 파이프라인으로 융합하지 않음**(Damodaran 자본비용 테이블을 별도 탭/섹션으로 노출) |

**보충 확인**: `GeminIQ`(신생 서비스)는 "원문 SEC XBRL 직접 사용"을 **경쟁사(GuruFocus·Finbox 등이 전부 벤더 정규화 데이터를 쓴다는 것)에 대한 차별점**으로 마케팅하고 있으나, Damodaran류 업종 벤치마크 통합은 없음. `OpenBB`(오픈소스)는 SEC 전용 공식 확장(`openbb-sec`)은 있으나 Damodaran 확장은 미확인.

🔑 **결론**: 우리 조합("원문 SEC XBRL + Damodaran 학술 업종 벤치마크 + Nasdaq 심볼/스크리너 + Yahoo 시세")은 확인된 범위에서 **업계에 흔한 패턴이 아니다** — 대다수는 벤더 정규화 데이터(S&P Global 등)로 SEC를 우회하고, Damodaran을 실제로 쓰는 곳은 찾은 것 중 1곳뿐이며 그마저 병치일 뿐 융합이 아니다.

---

## 부록 — 3중 규칙 처리

🔴 **①-A(공식문서 3회 이상)**: SEC(공식페이지 2곳 직접 curl + 3rd-party 종합 1회) · Nasdaq(공식 심볼정의 페이지 1곳 — 나머지는 비공식이라 "공식문서 없음"이 곧 조사결과) · Damodaran(공식 데이터페이지 3곳: datacurrent·databreakdown·datahistory) · Yahoo(공식문서 자체 없음 — 라이브러리 소스코드로 대체, 명시) · SPDR(개별 상품페이지 3개 + 마스터 메타파일 1개 직접 fetch).
🔴 **①-B(동종 US 서비스 3곳)**: 위 §1-B(Simply Wall St·stockanalysis.com·Finbox) + 보충(GeminIQ·OpenBB).
🔴 US 한정 — 전부 준수(Damodaran 지역변형·비US SPDR 상품은 조사 범위에서 명시적으로 제외).

## 다음 단계(②단계, 이번 STEP 범위 밖 — 기록만)

새 기관(FRED·Treasury·Polygon·FMP 등)은 이 문서 다음 STEP(②단계) 대상. 판정 없음.
