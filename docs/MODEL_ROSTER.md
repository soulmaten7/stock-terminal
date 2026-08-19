<!-- 2026-08-15 · STEP 1033 · 🔵 조사 전용 — 순위·선정·판정 없음. 판정 = 장은태 -->

# 모델 로스터 — 세상에 존재하는 주식 계산 모델 전수 조사

> **이 문서는 판정이 아니다.** 순위·선정·"이걸 만드는 게 좋겠다"는 어디에도 없다. 리스트와 대가(원전 확보 상태·수요 근거·제작 가능성)까지만 낸다. **선정·순위 판정 = 장은태.**
> 코드 diff 0 · DB 쓰기 0 · 프로덕션 미접촉.

---

## 🔴 맨 앞에 — 이 조사보다 먼저 존재했던 조사 4건

`docs/INDEX.md:110-113`에 이미 등재돼 있는데 **이 STEP(1033)의 명령서 ⓪-1b 표에 인용되지 않았던** 문서 4건을 발견했다:

| 문서 | 날짜 | 내용 |
|---|---|---|
| `docs/MODEL_DEMAND_SURVEY_2026-08-07.md` | 08-07 | 리테일 플랫폼 채택 기준 수요 조사(1차) — 수요 상위 20 + 우리 정의(5관문) 대조표 |
| `docs/MARKET_MODEL_USAGE_TOP20_2026-08-07.md` | 08-07 | 애널리스트 리포트 2,263건(Brownen-Trinh 2023)·CFA 회원 1,980명(Pinto 2019) 등 학술 서베이 기반 실사용 상위 20 |
| `docs/MODEL_UNIVERSE_63_2026-08-07.md` | 08-07 | 전체 모델 우주 **63개** × 우리 SEC 태그 실측 기반 재현 비용 |
| `docs/MODEL_BUILD_ORDER_2026-08-07.md` | 08-07 | 관문 7개(G1~G7: 방향번역·증명가능·커버리지·무료·법적·안매김·자동화)로 재정렬한 제작 순서 |

🔑 **이 넷은 이번 조사가 하려는 일의 상당 부분을 이미 08-07에 해놨다.** 63개 모델 전수·재현비용·수요증거·관문 필터까지 있다. `docs/STEP_LEDGER.md:51`에도 "모델 재조사 3차"로 기록돼 있다.

🔴 **그런데 그 산출물의 중심 질문("`CLAUDE.md:43`을 어떻게 고칠지" — §4, `MODEL_DEMAND_SURVEY.md`)이 판정된 흔적이 `docs/STATE.md`에 없다.** 2026-08-08에 `CLAUDE.md`가 "모델"에서 "질문"(Q0~Q5) 기준으로 바뀌었지만, 그건 08-07 조사의 특정 질문(순위를 어떻게 매길지)에 대한 답이 아니라 **다른 질문으로 옮겨간 것**이었다(STEP1033 자신의 §0-A ②가 이미 지적한 대로). **08-07의 63개 모델 로스터·관문 표는 그 뒤로 한 번도 다시 열리지 않은 채 남아 있었다.**

**이번 조사는 그 4건을 대체하지 않는다.** 겹치는 부분(팩터 계층·수요 학술 서베이·63개 모델 개요)은 재조사하지 않고 그대로 인용한다. 이번 조사가 새로 채운 것은: ① 08-07 조사가 "채택처 원문 확인분" 수준으로만 훑었던 곳들의 **원전 확보 상태를 4단계로 재확인**(특히 Altman/Beneish/Ohlson의 정확한 인용·접근성, relval.pdf 등 우리 저장소 공백) ② **미시도 6개 플랫폼**(Finbox·Koyfin·Value Line·YCharts·TIKR·Wisesheets) 전수 조회 ③ 플랫폼 자체 모델(④ 계층)의 **방법론 공개 정도를 항목별로 세분화**(전면공개/부분공개/블랙박스, 08-07은 인용 1줄 수준이었음) ④ 탈락·보류 항목(주주환원·발생액·마법공식)의 **데이터 쪽 재검토**.

---

## 계층별 스캔 커버리지 (하한 5개, 여섯 번째는 못 찾음)

| 계층 | 본 것 | 못 본 것 |
|---|---|---|
| ① 학술 팩터 | `LENS_ROADMAP.md` 전체 인용(7 채용·3 보조·2 탈락·1 보류) — **재조사 안 함, 지시대로** | (해당 없음 — 인용만 하라는 지시) |
| ② 밸류에이션 모델 | 역DCF(보유)·DCF·상대가치(배수)·DDM/Gordon·잔여이익/EVA·AlphaSpread | HOLT(CFROI, 기관 유료 전용 — 08-07 조사에서 이미 소진 확인, 재조사 안 함) |
| ③ 재무건전성·부도예측 | Piotroski F(보유)·Altman Z·Beneish M·Ohlson O | Montier C-Score(08-07이 이미 "틈새"로 확인, 이번엔 안 팜) |
| ④ 플랫폼 자체 모델 | SWS Snowflake·Morningstar(Star/Moat/Quant 3종)·Zacks Rank·Seeking Alpha Quant·Validea Guru Strategies·WallStreetZen·IBD CAN SLIM·ChartMill·Value Line·YCharts·Finbox·TIKR·Koyfin·Wisesheets — **14개** | Stockopedia StockRank(link_hub 미등재·08-07이 이름만 인용) — 이번에 확인 안 함 |
| ⑤ 주주환원·성장 | Simply Safe Dividends·Sure Dividend·DRIP Investing·Shareholder Yield(원 개념)·Sloan Accruals(재검토)·Magic Formula(재검토) | 자사주 매입 단독 모델(배당과 묶여서만 다뤄짐, 단독 원전 미탐색) |
| ⑥(찾아본 결과) | 여섯 번째로 구분되는 새 계층은 못 찾았다. 기술적 종합 스코어(ChartMill·IBD RS Rating)는 ④(플랫폼 자체 모델)에, 학술 모멘텀·기술 팩터는 ①에 이미 들어간다 — **다섯이 하한이자 사실상 상한이었다** | — |

---

## §1. 계층① 학술 팩터 — `LENS_ROADMAP.md` 인용만 (재조사 없음)

| 상태 | 모델 | 우리 축 | 비고 |
|---|---|---|---|
| ✅ 채용 | Momentum · Low Volatility(BAB) · Value(E/P·B/M) · Piotroski F · Technical · Quality(GP/A) · Asset Growth(CMA) | 7렌즈 | 채용 기준=효용, 등급=통계 유의성(STEP 553~554) |
| 🟡 보조(약함/니치) | Size(SMB) · Short-term Reversal · Growth | 미보유 | "진짜지만 약함" — 검증·유의 바를 넘길 가능성 낮음 |
| ❌ 탈락 | Shareholder Yield(STEP551) · Accruals(Sloan, STEP557) | — | **우리 자체 백테스트 결과**(아래 §5 재검토 참조) |
| ⏸ 보류 | Magic Formula(Greenblatt) | — | 데이터 재료 부재(아래 §5 재검토 참조) |

`docs/LENS_ROADMAP.md`(2026-07-03)의 "강력 후보 소진" 선언은 **이 표 안에서만** 참이었다 — 아래 §2~§5가 계층 밖 후보를 다룬다.

---

## §2. 계층② 밸류에이션 모델

| 모델명(EN/KO) | 원전(저자·연도·문헌) | 확보 상태 | 답하는 질문 | 수요 근거 | 제작 가능성 | 카탈로그 대조 | 우리 현황 |
|---|---|---|---|---|---|---|---|
| 역DCF / Reverse DCF | Rappaport & Mauboussin, *Expectations Investing*(2001/2021) | **보유**(`data/sources/expectations-investing/` T3~T10) | Q1 | AAII 부재(서베이 미집계) · New Constructs 상품화(전용) · 08-07 조사 수요순위 8위 | 즉시가능(완성) | `REVDCF_SPEC.md` | 이미 있음 |
| DCF(정방향, FCFF/FCFE) | Damodaran, "Discounted Cash Flow Valuation"(`dcf.pdf`, NYU Stern execval 트랙) | **공개접근**(HTTP 200 확인, 21MB 슬라이드) | Q1 | Demirakos 2004: PE와 양대 주모델 · 08-07 조사 수요순위 2위 | 조합필요(역DCF 엔진 재사용 가능 부품 다수) | — | 부분(역DCF의 정방향 절반이 이미 구현) |
| 상대가치/배수(P/E·P/B·EV/EBITDA·P/S) | Damodaran, "Relative Valuation"(`relval.pdf`) | **공개접근**(HTTP 200 확인, 2.69MB, 우리 저장소엔 **미보유** — 배수 데이터셋만 있음) | Q1 | CFA "가장 널리 쓰이는 배수" · 은행 리포트 stand-alone 97% · 08-07 조사 수요순위 3위 | 즉시가능(밸류 렌즈로 부분 보유) | `DATA_SOURCE_CATALOG.md` | 이미 있음(밸류 렌즈) |
| DDM / Gordon Growth Model | Gordon(1959, *Review of Economics and Statistics*) · 원류 = Williams(1938) | **유료**(저널 원문 paywalled) / 학술 사본 산발적 공개 — 미확인 정본 | Q2 | 은행 리포트 DDM 15%(63건) · 08-07 조사 수요순위 5위 | 조합필요(배당 데이터+성장률 가정) | — | 없음 |
| 잔여이익모델(RIM) | Ohlson(1995, *Contemporary Accounting Research*) | **유료**(Wiley paywalled, 초록만) | Q1 | 은행 리포트 3%(11건) — "학계 평가와 실사용 격차 가장 큰 항목"(08-07) | 조합필요(자기자본비용 가정 필요) | — | 없음 |
| EVA(경제적부가가치) | Stern Stewart & Co.(G. Bennett Stewart III, 1991, *The Quest for Value*) — 상표(현 Stern Value Management 보유) | **블랙박스**(핵심 회계조정 160여 개가 컨설팅 IP, 공식 정본 비공개) | Q1 | FinanceToolkit 명명 모델(오픈소스) | 원전부재(조정 방식이 비공개) | — | 없음 |
| AlphaSpread(플랫폼 자체 DCF+상대가치 혼합) | 원저 없음(Damodaran식 DCF 변형 + 상대가치 블렌드, 회사별 가중 방식 비공개) | **블랙박스**(방법론·about 페이지 전부 403 차단 — 검색엔진 스니펫으로만 파악) | Q1 | link_hub 등재(`analysis`) | 원전부재(선택 알고리즘 비공개) | — | 없음 |

---

## §3. 계층③ 재무건전성·부도예측

| 모델명(EN/KO) | 원전(저자·연도·문헌) | 확보 상태 | 답하는 질문 | 수요 근거 | 제작 가능성 | 카탈로그 대조 | 우리 현황 |
|---|---|---|---|---|---|---|---|
| Piotroski F-Score | Piotroski(2000), *Journal of Accounting Research* 38(Supp) | **보유**(무료 정본 PDF `chicagobooth.edu`, 이미 인용 중) | Q4 | 스크리너 표준 탑재 | 즉시가능(완성) | `REVDCF_SPEC.md` | 이미 있음(7렌즈) |
| Altman Z-Score | Altman(1968), *The Journal of Finance* 23(4) | **유료**(Wiley 초록만) / Altman 본인의 무료 회고 논문(`pages.stern.nyu.edu/~ealtman/PredFnclDistr.pdf`)에 공식 재수록 | Q4(부도확률 — 예측물 성격) | FinanceToolkit 명명 · 신용평가 표준 · 08-07 조사 수요순위 12위 | 즉시가능(입력 5개 전부 표준 재무제표 항목) | — | 없음 |
| Beneish M-Score | Beneish(1999), *Financial Analysts Journal* 55(5) | **유료**(Taylor & Francis 초록만) / 워킹페이퍼 사본 1건 확인했으나 fetch 403(내용 미확인) | Q4(분식 탐지 — 예측물 성격) | FinanceToolkit 명명 | 조합필요(2개년 비교 8개 비율) — 🔴 임계값(-1.78 vs -2.22) 출처 간 불일치 확인, 정본 미확정 | — | 없음 |
| Ohlson O-Score | Ohlson(1980), *Journal of Accounting Research* 18(1) | **유료**(JSTOR, 초록만) / 공식은 위키피디아 등 2차 재현으로만 확인 | Q4(부도확률 — 예측물 성격) | 학술 표준(로짓 기반, Altman의 대안) | 조합필요(GNP 물가지수 등 외부 디플레이터 필요) | — | 없음 |

---

## §4. 계층④ 플랫폼 자체 모델 (대부분 블랙박스 예상 — 실측 결과는 등급별로 갈림)

| 모델명(EN/KO) | 방법론 공개 정도 | 원전/출처 | 답하는 질문 | 수요 근거 | 제작 가능성 | 우리 현황 |
|---|---|---|---|---|---|---|
| Simply Wall St "Snowflake"(5축) | **부분공개** — 구조(축당 6체크·0~6점)는 공개, <s>Future/Past/Health 세부 6항목은 비공개</s> 🔴 **2026-08-19 STEP1072 정정** — SWS 공개 GitHub 저장소(`github.com/SimplyWallSt/Company-Analysis-Model/blob/master/MODEL.markdown`)에 Past Performance 세부 6체크 전문이 공개돼 있음(STEP1067 §9-0 원문 확인, `LENS_DISPOSITION_2026-08-08.md` §9) — Future·Health 두 축은 미확인이나 최소 1/3축(Past)은 전면공개로 정정 | help.simplywall.st | Q1~Q3 혼합 | link_hub `analysis`(Snowflake로 명시 소개) | 원전부재(3/5축 세부 비공개) | 없음 |
| Morningstar Star Rating | **전면공개**(통계 절차 PDF 정본 확인) | Morningstar Rating for Funds Methodology PDF | Q1 | 08-07: *"proprietary…templates"*(프레임워크 공개·개별종목 재현 불가) | 조합필요(위험조정수익률 3/5/10년 창) | 없음 |
| Morningstar Economic Moat | **부분공개**(정성 프레임워크는 공개, 애널리스트 판단이 최종값) | morningstar.com/stocks/moat | — | — | 원전부재(애널리스트 정성 판단이 핵심) | 없음 |
| Morningstar Quantitative Equity Rating | **전면공개**(우리가 이미 PDF 보유) | `data/sources/external/morningstar_quant_methodology_2024-12-02.pdf` | Q1 | Q1_CARD_DESIGN.md에서 이미 유니버스 A-9 근거로 활용 중 | 조합필요 | 부분(유니버스 기준으로만 씀) |
| Zacks Rank | **부분공개**(4요인명은 공개, 결합 가중치는 비공개 — 방법론 PDF 자체가 403 차단) | zacks.com(간접), Nasdaq 신디케이션 기사 | Q5 | 유료 구독 규모로 확인(사용률 자체는 미측정) | 원전부재(결합 공식 비공개) | 없음 |
| Seeking Alpha Quant Ratings | **부분공개**(5요인+실격규칙 공개, 세부 가중치·100+개 지표는 비공개) | help.seekingalpha.com FAQ | Q1~Q5 혼합 | link_hub `analysis`("Quant Ratings"로 명시) | 원전부재(가중치 비공개) | 없음 |
| Validea "Guru Strategies"(Magic Formula 등) | **Magic Formula만 전면공개**(Greenblatt 원 공식 그대로 재현 — ROC=EBIT/(순운전자본+순고정자산), 이익수익률=EBIT/EV, 순위합산 상위30) — 다른 구루 전략은 개별 확인 안 함 | validea.com/joel-greenblatt | Q1 | link_hub `analysis`(GuruFocus 인접) · 08-07 조사 §5의 마법공식 보류 사유 재검토 근거 | **조합필요**(SEC XBRL에 EBIT·투하자본 전용 태그 없음 — `OperatingIncomeLoss`를 EBIT 대용, 나머지는 표준 태그 조립 — §5 참조) | 없음(보류 상태 불변) |
| WallStreetZen "Zen Ratings" | **블랙박스**(카테고리명·팩터 개수(115)는 공개, 전체 팩터 목록·가중치 비공개) | wallstreetzen.com/zen-ratings(간접, 직접 fetch 403) | Q1~Q5 혼합 | link_hub `analysis`("Auto Scoring"으로 명시) | 원전부재 | 없음 |
| IBD "CAN SLIM" | **전면공개**(원서 출판 — William O'Neil, *How to Make Money in Stocks*) | investors.com, williamoneil.com | Q3·Q5 혼합(성장+모멘텀+수급) | link_hub `news`("CAN SLIM Growth Stocks"로 명시) | 조합필요(EPS Rating·RS Rating은 백분위 산출 필요, Composite Rating 가중치는 비공개) | 없음 |
| IBD 부속 등급(EPS/RS/Composite Rating) | **부분공개**(개념은 공개, Composite 정확한 가중치 비공개) | 같은 출처 | Q3·Q5 | — | 원전부재(Composite 가중치) | 없음 |
| ChartMill Technical/Setup/CRS | **부분공개**(개념은 문서화, 0~10 스케일 결합 공식 비공개) | chartmill.com/documentation(일부 403) | Q5 | link_hub `chart`("Technical Score"로 명시) | 원전부재 | 없음 |
| Value Line Timeliness/Safety Rank | **부분공개**(1965년부터 운영, 입력요인 공개·정확한 회귀계수 비공개. Fischer Black 1973 논문이 학술 검증) | valuelinepro.com(SSL 인증서 오류로 직접 fetch 실패), Wikipedia 교차확인 | Q1·Q5 혼합 | link_hub `analysis`("Safety Rating"으로 명시) · 08-07: *"uses a proprietary formula"* | 원전부재(정확한 공식 비공개) | 없음 |
| YCharts "Y-Rating"(Value/Fundamental/Historical-Multiple Score) | **부분공개**(입력·척도는 공개, Operating Earnings Yield·FCF Yield 계산식은 "proprietary이므로" 명시적 비공개) | go.ycharts.com/knowledge-base/the-value-score | Q1 | link_hub `analysis` | 원전부재 | 없음 |
| Finbox "Fair Value"(다중모델 블렌드) | **부분공개**(구성 모델 종류 공개 — DCF·비교기업·DDM·EPV, 정확한 블렌드 가중치는 비공개. "Uncertainty Level" 등급 체계는 공개) | finbox.com/blog(2건 fetch 성공) | Q1 | link_hub `analysis`("Fair Value·DCF Model") · 08-07 조사 DCF 채택처로 인용 | 원전부재(블렌드 가중치) | 없음 |
| TIKR "Valuation Model Builder" | **사용자 구성형**(고정 점수 아님 — 사용자가 성장률·마진·미래배수를 직접 입력하는 P/E 기반 DCF형 도구) | tikr.com/valuation-model-builder | Q1 | link_hub `analysis` | 해당없음(플랫폼 자체가 값을 안 매김, 도구 제공형) | 없음 |
| Koyfin | **모델 없음**(순수 데이터/대시보드 — 화면의 "Z-Score"는 Morningstar 인용이거나 단순 통계비율) | koyfin.com | — | link_hub `analysis` | 해당없음 | 없음 |
| Wisesheets | **모델 없음**(순수 원자료 Excel 애드온) | wisesheets.io | — | link_hub `analysis` | 해당없음 | 없음 |

---

## §5. 계층⑤ 주주환원·성장 (+ 로드맵 탈락/보류 재검토)

| 모델명(EN/KO) | 방법론 공개 정도 | 원전/출처 | 답하는 질문 | 수요 근거 | 제작 가능성 | 우리 현황 |
|---|---|---|---|---|---|---|
| Simply Safe Dividends "Dividend Safety Score" | **부분공개**(팩터 목록 공개, 정확한 가중치 비공개 — "사람 판단이 근간"이라 명시) | simplysafedividends.com | Q2 | link_hub `ipo`("Dividend Safety Analysis"로 명시) | 원전부재(애널리스트 정성 판단 포함) | 없음 |
| Dividend King/Aristocrat/Achiever/Champion 분류 | **업계 관행**(고유 모델 아님 — S&P Aristocrats 지수 규칙·Mergent/Nasdaq Achievers 지수·Fish/DRIP Investing Champion 계보 3갈래가 각각 정본) | S&P Dow Jones Indices · Nasdaq · dripinvesting.org | Q2 | link_hub `ipo`(Sure Dividend·DRIP Investing 등 4곳 등재) | 즉시가능(연속 배당 증가 연수 = 배당 이력만 있으면 셈) | 없음 |
| 총주주환원수익률(Shareholder Yield, 원 개념) | William Priest(Epoch Investment Partners, 2005 논문 → 2007 공저서) → Meb Faber(2015, 3요소 확장판) | **공개접근**(책·논문 형태로 공개, 학술 1차 논문 아님) | Q2 | Validea가 Faber식 포트폴리오 공개 운용 중 | 즉시가능(배당+자사주+순부채상환 데이터) | 로드맵에 **이미 탈락**(아래 재검토 참조) |

**🔴 로드맵 탈락·보류 3건 재검토 — 데이터 쪽에 변화가 있는지만 확인, 재판정 없음**:

| 항목 | 원 탈락/보류 사유 | 데이터 쪽 변화 |
|---|---|---|
| Shareholder Yield | **자체 백테스트 근거**(STEP551) — 롱숏 t 0.85/1.09·FF3 알파 소멸(t 0.56/0.84)·βHML 0.5+ → 밸류(HML) 재포장으로 판정. 데이터 부족이 사유가 아니었다 | 없음 — 데이터를 더 좋게 만들어도 "신호 자체가 약하다"는 원 사유를 안 건드린다 |
| Accruals(Sloan) | **자체 백테스트 근거**(STEP557) — 저−고 롱숏 −7.62%(부호 역전)·t−1.36·FF3 알파 t−1.20 → 1996년 발표 이후 전 세계적으로 약화된 것으로 알려진 이례현상과 방향 일치 | 없음 — 동일 사유로 데이터 무관 |
| Magic Formula(Greenblatt) | **데이터 재료 부재**(STEP553~554) — 진짜 ROC(EBIT/투하자본)를 EDGAR에서 못 뽑아 근사 필요 + 밸류·퀄리티와 중복 | **변화 없음** — SEC us-gaap 택사노미에 전용 "EBIT"·"투하자본" 태그가 없다(확인됨). `OperatingIncomeLoss`가 EBIT 대용으로 쓰일 뿐, 나머지(순운전자본·순고정자산)는 여전히 표준 태그 조립이 필요 — 08-07 시점과 동일한 근사 문제. Validea가 공식 자체는 공개하지만(위 §4) **조달 방법**은 공개하지 않는다 |

---

## `link_hub` 병행 조회 결과 (⓪-5-B)

**필요 데이터**: "US 플랫폼이 어떤 계산 모델을 파는가"(카테고리 `analysis`·`research`·`chart` 중심, 나머지 7개 카테고리도 전수 확인).
**조회**: US 139개 전체(10 카테고리 전부) — MCP `execute_sql`로 `link_hub` 테이블 직접 조회, 웹검색과 병행.
**결과**: **되는 곳**(방법론 페이지 확인 성공) = Finbox·YCharts(Value Score)·Value Line(간접)·Validea·Simply Wall St·Morningstar·IBD·Simply Safe Dividends·Sure Dividend·DRIP Investing 등 다수. **키/유료 필요** = Value Line(구독 전용, 무료 접근 랭크 없음)·YCharts(무료 티어 없음)·Wisesheets(무료 티어 없음). **없음**(모델 자체가 없음, 데이터 곧 확인) = Koyfin·Wisesheets. **신규 발견**(08-07 조사에 없던 것) = Validea Guru Strategies(마법공식 재검토 핵심 근거)·IBD CAN SLIM(link_hub `news` 카테고리에 있었음, 앞선 조사가 `analysis`/`research`만 봐서 놓쳤을 가능성)·Simply Safe Dividends·Sure Dividend·DRIP Investing(전부 `ipo`/배당 카테고리 — 앞선 08-07 조사가 여기까지 안 감).

🔑 **⓪-4 조건 "link_hub에서 새로 나온 게 0건이면 병행 의무가 형식이었다"는 성립하지 않는다** — 신규 발견이 다수 나왔다.

---

## 차단된 곳 전수 목록

| 곳 | 무엇이 막혔나 | 대체 경로 |
|---|---|---|
| Zacks (zacks.com 방법론 페이지·PDF) | 403(봇탐지) | Nasdaq 신디케이션 기사로 개념 확인(완전한 공식은 미확보) |
| WallStreetZen (zen-ratings 페이지) | 403 | 검색엔진 색인 스니펫 + 별도 help 문서로 대체 확인 |
| ChartMill (전략 문서 1개) | 403 | 인접 문서 페이지로 대체 확인(CRS·Technical Analysis 문서는 성공) |
| TIKR (지원센터 문서 1개) | 403 | 마케팅 페이지로 대체 확인(성공) |
| YCharts (pricing 페이지) | 405(메서드 거부) | 검색으로 가격 확인 |
| AlphaSpread (전 페이지 — about·methodology·계산기·kb 전부) | 403(전면) | 검색엔진 스니펫만으로 재구성 — **원전 확인 불가 등급으로 명시**(내용 추측 안 함) |
| Value Line (valuelinepro.com·valuelinelibrary.com 랭킹 페이지) | SSL 인증서 오류(로그인 아님) | 검색 스니펫 + Wikipedia 교차확인 |
| Beneish M-Score 워킹페이퍼 사본(calctopia.com) | 403 | 2차 재현 자료로 공식만 확인(원문 검증 안 됨, 임계값 불일치 그대로 노출) |

🔴 **어느 것도 우회 시도(프록시·User-Agent 위장·브라우저 자동화)를 하지 않았다.** 전부 대체 공개 경로를 시도했고, 그래도 안 되면 "확인 불가"로 남겼다.

---

## 3중 규칙

- **못 한 축**: Stockopedia StockRank(08-07이 이름만 인용, 이번엔 미확인) · Montier C-Score(08-07이 "틈새"로 확인, 재조사 안 함) · CFROI/HOLT(08-07이 "기관 유료 전용·30년 회계조정"으로 이미 소진 확인, 재조사 안 함) · Beneish 임계값(-1.78 vs -2.22) 정본 미확정.
- **철회·정정**: 없음(이번 조사는 새 발견이며 기존 결론을 뒤집지 않는다) — 단 STEP1033 명령서 자체의 인용 오타 정정: `docs/LENS_DISPOSITION.md`가 아니라 `docs/LENS_DISPOSITION_2026-08-08.md`가 정확한 파일명.
- **미측정**: 각 모델의 실제 국내(KR) 재현 가능성(이번 조사 = US 단독 원칙에 따라 US만) · 08-07 조사가 이미 "못 잰 것"으로 남긴 항목들(2026년 현재 사용률·역DCF 실제 사용률 등)은 이번에도 다시 재지 않음(재조사 범위 밖).

---

## ⓪-4 반증 조건 — 실측 결과

| 조건 | 실측 |
|---|---|
| 팩터 계층 밖에서 원전 확보 가능한 모델이 5개 이상 | 🔑 **해당.** DCF·상대가치·DDM·Piotroski(기존)·Altman Z·Beneish M·Ohlson O·CAN SLIM·Value Line Rank·Magic Formula(Validea 재현)·배당등급 분류까지 **12개 이상**이 최소 부분공개 이상 — `LENS_ROADMAP.md`의 "강력 후보 소진" 선언은 **팩터 계층 한정 판단이었음이 확증된다.** |
| 팩터 밖에서도 원전 확보 가능한 게 1~2개뿐 | 해당 없음(위 조건이 성립) |
| 수요 상위 모델 대부분이 블랙박스 | 🔴 **표에 없는 조합** — "대부분 블랙박스"는 아니다. **완전공개**(CAN SLIM·Magic Formula·Morningstar Star Rating·Damodaran DCF/상대가치)와 **부분공개**(Zacks·SA Quant·WallStreetZen·YCharts·ChartMill·Value Line 등, 개념은 공개하나 정확한 가중치는 비공개)가 섞여 있다 — 완전 블랙박스는 EVA(조정방식 비공개)·AlphaSpread(전면 차단) 정도뿐이다. |
| link_hub 139개에서 새로 나온 게 0건 | 🔴 **해당 안 됨** — Validea·IBD CAN SLIM·Simply Safe Dividends·Sure Dividend·DRIP Investing 등 다수 신규 발견. 병행 의무가 실질적으로 작동했다. |

---

**이 문서는 판정이 아니다. 순위·선정 = 장은태.** 이번 조사가 낸 것은 (a) 08-07 조사 4건의 존재를 다시 수면 위로 올린 것 (b) 그 조사가 얕게 다룬 곳의 원전 확보 상태를 4단계로 재확인한 것 (c) 미시도 6개 플랫폼을 전수 조회한 것 (d) 탈락·보류 3건의 데이터 쪽 변화 유무를 확인한 것, 넷뿐이다.
