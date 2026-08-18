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

🔴 **워크드 PIE/MIFP 사례 = 도미노 1건뿐 (STEP 863·864 총 8곳 소진 · 재탐색 불요)**: T9=가상회사(Buyer/Seller Inc.)·T10=Shopify(실물옵션·PIE 아님)·튜토리얼 8p=도미노만·책 5~7장=도미노가 유일 PIE 케이스·Special Site Extras(3장: Active Investor·Pitfalls·Earnings/PE)=일반챕터·Mauboussin 리포트=재현가능 명명 MIFP 없음. **864 추가 소진**: 각주15(=CAP 문헌·아래)·NC 무료 글(GAP=우리 개념이나 NOPAT 자체조정 비공개라 재현불가)·학술 CAP. **완전 명세 재현가능 워크드 케이스 = 도미노 1건뿐**(값 검증 = 도미노 정확 재현 + 분포 관찰 3개 + 방법 3원 확인 = 도메인 상한).

## `academic/` — 학술 문헌 (STEP 864·872)

| 파일 | 출처 | 우리와의 관계 |
|---|---|---|
| `mauboussin_johnson_1997_CAP.pdf` | **Mauboussin & Johnson, "Competitive Advantage Period: The Neglected Value Driver"**, Financial Management 1997 (CS First Boston·Damodaran 사이트 사본 `pages.stern.nyu.edu/~adamodar/pdfiles/eqnotes/cap.pdf`) | 🔑 **MICAP(market-implied CAP) = 우리 GAP/MIFP와 정확히 같은 개념**(Rappaport의 market-implied duration 차용·"주가에 닿을 때까지 예측지평을 늘림"=우리 LOOKUP). 명명 값(1997): 미국시장 총 **10~15년**·개별 **0~2년~20년+**·Intel ~5·MSFT 17~20·Coca-Cola 20+·Kellogg 15·**포장식품 업종 14~16년**. 🔴 **터미널 = NOPAT/WACC(무성장)** — 우리(인플레 영구연금 T8)·와 다름. 1997 데이터라 **동시점 종목 재현 불가**·범위/패턴만 대조 |
| `chan_karceski_lakonishok_2003_growth_persistence.pdf` | **Chan, Karceski & Lakonishok, "The Level and Persistence of Growth Rates"**, Journal of Finance 58(2), 2003 (NBER working paper w8282, `nber.org/system/files/working_papers/w8282/w8282.pdf`) | **driver 1(매출 성장률) 판정의 C축(반대 증거) 근거**(872). 검증된 인용 2건(본문 문자열 그대로 확인): *"There is a great deal of persistence in sales growth"* / *"[analysts'] long-term estimates ... are over-optimistic and do poorly in predicting realized growth over longer horizons"*. 🔑 매출 성장의 **지속성은 지지**하되, **이익 성장의 지속성과 애널리스트 장기 전망의 정확도는 부정적으로** 평가 — 871의 컨센서스 교체 실측(p95 38.8%→52.9%·판정 이동 대칭)과 방향이 정합한다는 근거로 인용됨(872, 채택 판단 아님) |
| `baker_bradley_wurgler_2011_low_volatility_anomaly.pdf` | **Baker, Bradley & Wurgler, "Benchmarks as Limits to Arbitrage: Understanding the Low-Volatility Anomaly"**, Financial Analysts Journal 67(1), 2011 (`pages.stern.nyu.edu/~jwurgler/papers/faj-benchmarks.pdf`, 2026-08-17 취득) | **저변동성 렌즈(`lib/lowvol.ts`)의 원전**(801/813/824가 BAB→BBW로 이미 정정, STEP1057이 원문 직접 대조로 재확인). 원문 방법론(본문 그대로 확인) — *"We sorted stocks into five groups for each month according to either five-year trailing total volatility or trailing beta... We also restricted the investing universe to the top 1,000 stocks by market capitalization"* · *"We estimated volatility and beta by using up to 60 months of trailing returns"* · *"with at least 24 months of return history"* · 월별 리밸런싱·시가총액가중. 🔴 **우리와의 차이**(전부 기존 문서·화면에 이미 공개돼 있던 것과 일치) — 창(60개월 월별 vs 1년 일별)·분위(5분위 vs p30/p70 3분위)·리밸런싱(월별 vs 매일 스냅샷) |
| `novy_marx_2013_gross_profitability_premium.pdf` | **Novy-Marx, "The Other Side of Value: The Gross Profitability Premium"**, Journal of Financial Economics 108(1), 2013 (`oldschoolvalue-files.s3.amazonaws.com/pdf/Novy-Marx_Gross-Profitability-Anomaly_JFE_2013.pdf`, 2026-08-18 취득) | **퀄리티(GP/A) 렌즈(`lib/lenses.ts:322~365`)의 원전**(STEP1059가 원문 직접 대조). 정의(본문 그대로 확인) — *"gross profits (revenues minus cost of goods sold, REVT − COGS) scaled by assets (AT)"*. 🔴 **금융사 제외 명시**(Table 1·2·Fig.1 캡션 반복) — *"The sample excludes financial firms (those with a one-digit standard industrial classification (SIC) code of six)"*. 리밸런싱 = *"accounting data for a given fiscal year starting at the end of June of the following calendar year"*(Fama-French 표준 지연 매칭 — **AT 자체는 같은 회계연도 기말**, 시차는 "언제 적용하는지"에만 있음). 분기 데이터도 동시점(`ATQ`, footnote 3). 🔑 **STEP815의 801 되돌림(분모=기초→기말)이 원문과 정확히 일치함을 확인** — 우리 구현과 차이 0 |

🔴 **PDF 판독 방법 (2026-08-08 실측 · 재발견 방지)**: `chan_karceski_lakonishok_2003_*.pdf`는 **ToUnicode 맵이 없어** `pypdf` 추출 시 `/G31/G25/G28...` 글리프 코드로 나온다. **복호 = `chr(hex값 + 29)`** (`/G24`→`A` · `/G3`→공백 · `/G11`→`.`). 추출 중 `c` 뒤에 붙는 `._`는 잡음이라 제거. 이 절차로 **47p 전문 판독 완료(2026-08-08)**.

🔴 **값 검증 함의**: 우리 GAP = 학술 MICAP = NC "Growth Appreciation Period" = Rappaport market-implied duration (**3개 독립 출처가 방법을 확인**). 그러나 **재현 가능한 동시점 개별 종목 값 대조는 불가** — CAP 논문은 1997+터미널 다름, NC는 자체조정 NOPAT 비공개, 둘 다 무성장 터미널. 우리 2026 범위(중앙 11·1~24)는 논문 범위(총 10~15·개별 0~2~20+)와 **정합**.

## `damodaran_pdfs/` — Q1 업종별 축 적용성 원전 (STEP 958)

| 파일 | 출처 | 우리와의 관계 |
|---|---|---|
| `finsvc.pdf` | Damodaran, **"The Valuation of Financial Service Firms"**(강의 슬라이드, `pages.stern.nyu.edu/~adamodar/pdfiles/eqnotes/finsvc.pdf`) | Q1 「업종별 축 적용성」(Financials × EV/EBITDA) 근거. slide 12: *"Debt, for non-financial service firms, is a source of capital. For a financial service firm, debt is more raw material than source of capital."* |
| `c21.pdf` | Damodaran, **Investment Valuation** 3rd ed. Chapter 21 "Valuing Financial Service Firms"(`pages.stern.nyu.edu/~adamodar/pdfiles/val3ed/c21.pdf`) | 같은 목적, 더 직접적인 인용. p.3/p.19-20 "Choices in Multiples": *"Firm value multiples such as value-to-EBITDA or value-to-EBIT cannot be easily adapted to value financial service firms... Since sales or revenues are not really measurable for financial service firms, price-to-sales ratios cannot be estimated or used for these firms... Equity multiples such as price-to-earnings or price-to-book ratios are a much better fit for financial service firms than value multiples."* → **Financials 업종은 EV/EBITDA뿐 아니라 PSR도 미적용**(신규 발견, `docs/probe_958_external_check.json`) |

🔴 **PDF 판독 방법**: 두 파일 다 ToUnicode 맵 정상(글리프 복호 불필요) — `PyPDF2.PdfReader(...).pages[i].extract_text()`로 바로 판독됨. 키워드(`EBITDA`·`debt`·`bank`·`multiple`) grep으로 관련 페이지 특정 후 전문 인용.
🔴 **다운로드**: `curl -A "Mozilla/5.0 ..." -o {file} {url}` — WebFetch 1차 시도는 텍스트가 손상돼 보여(압축 인코딩) 실패, curl로 직접 받아 PyPDF2로 재추출.

## `damodaran_multiples/` — 업종별 배수 라이브 데이터셋 (STEP 959 신규 발견)

🔑 **기존 `data/sources/damodaran/`의 8개 xls(betas·capex·countrytaxrates·indname·taxrate·totalbeta·wacc·wcdata)에는 업종별 배수(PE·PBV·PS·EV/EBITDA) 데이터가 없었다** — 전부 계산 투입재료뿐이었다. `data/sources/text/damodaran_data_update_1_2026.html`(기존 저장본)을 STEP 959에서 재검토하다 *"my estimate the PE ratio for an industry grouping..."*·*"the EV/EBITDA multiple that I report for emerging market steel companies"*를 발견 → Damodaran이 업종별 배수를 별도 데이터셋으로 발행한다는 신호 → 웹서치로 아래 4개 확보.

| 파일 | 출처 | 무엇을 담나 |
|---|---|---|
| `pedata.xls` | `pages.stern.nyu.edu/~adamodar/pc/datasets/pedata.xls` | 업종별 Current PE·Trailing PE·Forward PE·PEG. `Industry Averages` 시트, `Industry Name` 기준 |
| `pbvdata.xls` | `.../pbvdata.xls` | 업종별 PBV·ROE·EV/Invested Capital·ROIC |
| `vebitda.xls` | `.../vebitda.xls` | 업종별 EV/EBITDA·EV/EBITDAR&D·EV/EBIT·EV/EBIT(1-t) |
| `psdata.xls` | `.../psdata.xls` | 업종별 Price/Sales·EV/Sales·Net Margin |

🔴 **핵심 발견**: `vebitda.xls`에서 **Financials 9개 업종군 중 은행·증권 3개(Bank Money Center·Banks Regional·Brokerage & Investment Banking)만 `NA`**, 보험·자산운용 6개는 실값 계산됨 — `finsvc.pdf`의 "부채=원재료" 논리가 은행에만 해당하고 보험엔 해당 안 됨을 실측 데이터로 확인. `psdata.xls`에서는 **Financials 9개 업종군 전부 실값 계산됨**(NA 0개) — `c21.pdf` 교과서 원문("PSR을 못 쓴다")과 **상충**. 상세 = `docs/SECTOR_AXIS_APPLICABILITY.md`.
🔴 **다운로드**: `curl -A "Mozilla/5.0 ..." -o {file} {url}`. **판독**: `xlrd.open_workbook()`(정식 BIFF 바이너리, `PyPDF2` 아님) — `Industry Averages` 시트, 헤더는 8번째 행(`pedata`/`pbvdata`/`psdata`) 또는 9번째 행(`vebitda`)에 있음(파일마다 다름, 헤더 로우 하드코딩 전 매번 확인할 것).
🔴 **업종군→GICS 섹터 매핑**: 별도 크로스워크가 없어 `data/sources/damodaran/indname.xls`("By industry" 시트, `Country=United States`만)의 `Industry Group`↔`Primary Sector` 실측 빈도로 직접 구축(94개 업종군, US 상장사 기준 다수결). 10개 업종군은 소속 섹터가 갈림(예: `R.E.I.T.`는 Real Estate 147개사·Financials 43개사) — 다수결로만 처리, 소수 소속은 버렸다(미해결로 기록).

## `external/` — 외부 방법론 원본 (유니버스 A-9)

| 파일 | 출처 | 관계 |
|---|---|---|
| `morningstar_quant_methodology_2024-12-02.pdf` | **Morningstar Quantitative Equity Ratings Methodology**(2024-12-02 시행·공식 q4cdn `s21.q4cdn.com/198919461/…`) | 유니버스 A-9 외부 준거 — Quant 유동성 하한(현지통화 5,000/일·"모델 편향 완화")·US 4,379사. `EXTERNAL_UNIVERSE_QUOTES.md` 발췌의 **PDF 원본** |

---

## `sec/` — SEC 공식 모집단 통계 + 전수 매핑 (STEP 866)

| 파일 | 무엇을 정의하나 | 갱신 주기 | 좌표 |
|---|---|---|---|
| `sec_reporting_issuers_20260630.xlsx` | SEC 공식 제출사 수(모집단 상한의 공식 근거) — Reporting Issuers 통계 | 연 1회(직전 갱신 2026-06-30) | `Stats Table` 시트 · `2025` 행 · `U.S. domiciled exchange listed companies` 열(=3,714) · `Data Visual 2` 시트에 Shell/Non-shell 분리(비셸=3,692) |
| `company_tickers_exchange_20260802.json` | CIK ↔ ticker ↔ exchange 전수 매핑(10,432행·CIK 기준 8,017개사) | 🔴 SEC 미명시(EDGAR API 공식 문서 `text/sec_edgar_api.html`에 이 파일 자체 언급 없음 — 스코프·갱신주기 서술도 없음. 이유를 지어내지 않고 그대로 기록) | `fields`(`cik`·`name`·`ticker`·`exchange`) / `data` 배열 |

| `sec_sic_missing219_20260808.json` | 🔑 **Q0 판정 근거** — Damodaran `indname.xls`(`is_us_listed`) **미매핑 219종목**의 CIK·SIC 전수 조회 결과(회사명 포함). **CIK 매칭 219/219 · SIC 보유 218/219 = 99.5%**(결측 = `ARCC`, BDC라 SIC 미부여) | 재취득 시 갱신 | `data` 배열 · `_meta.source`에 엔드포인트 |

- STEP 866 모집단 사다리(`docs/probe_866_ladder.json`)의 시작점 = `company_tickers_exchange_20260802.json` 전수(`us_market_cap` 상위 1,000이 아니라).
- SEC 공식 통계(3,714/3,692/3,600/3,589)는 **금융업 포함 상한**이지 목표치가 아니다(우리는 SIC 6000~6999를 뺀다) — `docs/REVDCF_SPEC.md` A-9 정정 참고.

---

## `nasdaq/` — 나스닥 공식 스크리너 (Q0 섹터 분류 · 2026-08-08 신설)

🔴 **git 제외**(`.gitignore`) — 로컬만. 원본 정본 = **Supabase Storage 버킷 `sources`** (다모다란과 동일 관행).

| 파일 | 무엇을 정의하나 | 갱신 주기 | 좌표 |
|---|---|---|---|
| `nasdaq_screener_20260808.json` (1.5MB) | **미국 상장 전 종목 7,127건**의 `sector`·`industry`·**`country`**·`marketCap`·`ipoyear`. 🔑 **무료·키 불필요.** Q0 「2-of-2 합의제」의 ③단계 출처 | 🔴 **`data.asOf = null`(939 재현 확인 — 응답이 기준일을 안 준다).** 939에서 같은 날 재조회해 7,127행 전수 대조 — `sector`·`industry` 변경 **0건**(checked 7,127·changed 0). **우리가 취득 시각을 `as_of`로 찍는다**(Damodaran과 동일 구조) | `data` 배열 · `_meta.source` = `https://api.nasdaq.com/api/screener/stocks?tableonly=false&limit=25000&download=true` |

🔑 **940 적재 — Postgres 테이블 `us_sector_nasdaq`**(as_of·symbol·sector·industry·country·ipo_year·market_cap, PK(as_of,symbol)) — 원본 7,127행과 **정확히 일치 적재**(`scripts/ingest_us_sector.ts`). 빈 `sector`(712건)는 `null`로.

🔴 **분류 체계가 GICS가 아니다** — 12개(`Finance`·`Basic Materials`·`Telecommunications`·`Miscellaneous` 등)이고 **`Communication Services`가 없다**(→ `GOOG`·`NTES`가 `Technology`로 감). GICS 이름으로 옮기려면 변환이 필요하고 **변환 손실이 있다.**
🔴 **시세 컬럼 제거하고 보관** — `lastsale`·`netchange`·`pctchange`·`volume`·`url`은 원응답에 있으나 섹터 분류 목적과 무관해 뺐다(`_meta.note`에 기록).
🔑 **구조적 사실**: **GICS는 S&P Dow Jones Indices·MSCI 공동 소유 라이선스 상품**이라 **전 종목 진짜 GICS는 무료로 못 얻는다.** Damodaran `primary_sector`도 GICS 이름을 빌린 그의 배정이다. 🟢 **정정(939 발견 → 940 이전 장은태 판정)**: *"무료 소스는 진짜 GICS를 줄 수 없다"*는 **S&P 500 부분집합에 한해 틀렸다** — 아래 `spdr/` 절이 무료·진짜 GICS다. 나스닥 자체 분류는 여전히 GICS가 아니다(이 절 상단 사실 불변).

---

## `spdr/` — S&P 500 진짜 GICS 정답지 (Q0 대조 · 2026-08-08(939) 신설)

🔴 **939의 발견**: `CLAUDE.md` ⓪-5-B(link_hub 병행조회)를 돌다가 `link_hub`의 `etf` 카테고리에서 **State Street SPDR 섹터 ETF holdings**를 찾았다. **11개 ETF(XLK·XLF·XLV·XLE·XLI·XLY·XLP·XLU·XLB·XLRE·XLC)의 구성종목 = S&P 500 종목의 진짜 GICS 섹터**이고 **무료**다 — 위 `nasdaq/` 절의 "무료 소스는 진짜 GICS를 줄 수 없다"는 **S&P 500 부분집합에 한해 예외**가 있다는 뜻(전 종목 커버는 여전히 불가).

| 파일 | 무엇을 정의하나 | 갱신 주기 | 좌표 |
|---|---|---|---|
| `spdr_sector_holdings_2026-08-06.json` (68KB · git 포함) | **S&P 500 구성종목 515개**(939 실측·11개 ETF 합계)의 진짜 GICS 섹터. Q0 정답지 대조용 | 🔴 **지수 리밸런싱마다 바뀜** — 취득일마다 `as_of`를 함께 보존(xlsx 내부 "Holdings: As of {date}"에서 파싱, 나스닥과 달리 **출처가 기준일을 준다**) | `data` 배열(`{ticker,name,etf,sector}`) · `_meta.excluded`(티커 없거나 `-`인 24행, 현금/MMF 포지션) · `_meta.source` = SSGA xlsx URL 패턴 |

🔴 **URL 패턴**: `https://www.ssga.com/us/en/intermediary/library-content/products/fund-data/etfs/us/holdings-daily-us-en-{티커소문자}.xlsx` — **User-Agent 헤더 없으면 실패할 수 있음**(브라우저 UA 필요, 939 실측).
🔴 **xlsx 구조**: 3행째 `"Holdings:"` | `"As of {date}"` · 헤더행은 첫 열이 `"Name"`(고정 숫자 위치로 찾지 말 것) · `Sector` 열은 전부 `"-"`(못 씀 — 섹터는 **ETF 티커가 결정**) · 헤더 다음부터 **첫 빈 행 전까지**가 실제 보유종목(그 뒤는 각주·면책 문구 텍스트, 939 실측으로 확인).
🔴 **파일(939 원본) 자체는 그대로 둔다** — 현금/머니마켓(티커=`-`)만 `_meta.excluded`로 표시, 이상 티커 12건은 `data`에 남아 있다(원본은 관측 그대로 보존).
🔑 **정답지 용도**: S&P 500만 커버(전체 유니버스의 절반 정도) — **커버리지 해결책이 아니라 다른 두 출처(Damodaran·나스닥)가 맞았는지 확인하는 잣대.**

**939 대조 실측**(재현 스크립트 = `scripts/probe_939_gics_truth.ts` → `docs/probe_939_gics_truth.json`, 값은 그 파일이 정본이지 여기 안 박는다): Damodaran `primary_sector`가 SPDR과 **99%대로 높게 일치**, 불일치는 극소수(`APP`·`DD` 2건). 미매핑 219종목 중에도 SPDR에 존재하는 10건이 있어(`GOOG`·`FOX`·`NWS`·`BRK-B`·`BF-B` 등) 형제-우선 규칙의 근거를 보강한다.

🟢 **판정(ⓘ·ⓙ, 2026-08-08 장은태)**: **SPDR을 출처 0순위로 승격**(유일하게 검증된 진짜 GICS) · **이상 티커 12건(E-mini 섹터 선물 11 + CONTRA 1)은 DB 적재에서 제외**(`ECHO`·`FDXF`·`HONA`·`MRSH`는 Damodaran 미등재일 뿐 실회사라 제외 대상 아님 — 판정 근거).
🔑 **940 적재 — Postgres 테이블 `us_sector_gics`**(as_of·symbol·sector·etf, PK(as_of,symbol)) — 원본 515행 − ⓙ 제외 12행 = **503행 적재**(`scripts/ingest_us_sector.ts`, 제외 목록은 스크립트 로그·리포트에 그대로 출력).

---

## `yahoo/` — 야후 assetProfile 섹터 (Q0 3번째 출처 · 2026-08-08(941) 신설)

🔴 **API라 파일 원본이 없다** — 좌표만 기록(`lib/revdcf/registry.ts` `yahoo` 항목). 라이브러리는 **`yahoo-finance2`(이미 프로젝트 보유, 신규 설치 없음)**.

🔴 **야후 의존 추가를 명시한다** — `us_market_cap`도 야후 계열이라(937 `retryNoCapField:400` 사례) 이미 있던 의존이 하나 더 늘어난 것이다. 섹터는 정적 데이터라 위험은 낮다.

| 무엇을 정의하나 | 갱신 주기 | 좌표 |
|---|---|---|
| `assetProfile.sector`(원문, Title Case) → **11:1로 GICS 매핑**(손실 없음 — 나스닥 12분류의 `Miscellaneous`/`Communication Services` 부재 문제가 야후엔 없다) | 🔴 응답에 기준일 없음(나스닥과 동일 사정) — 취득 시각을 `as_of`로 찍는다 | `yf.quoteSummary(symbol, {modules:["assetProfile"]})` |

🔑 **941 적재 — Postgres 테이블 `us_sector_yahoo`**(as_of·symbol·sector_raw·sector·industry·country, PK(as_of,symbol)) — `lens_scores` US 1,021종목 취득, `scripts/ingest_yahoo_sector.ts`(동시성 6, 기존 야후 재시도 루프 관행). **성공 1,020/1,021(99.9%)**, 실패 1건(`FISV`, `no_data` — Fiserv 구 티커). **매핑표 밖 `sector_raw` 0건.**

**941 대조 실측**(재현 스크립트 = `scripts/probe_941_third_source.ts` → `docs/probe_941_third_source.json`, 값은 그 파일이 정본): SPDR(503) 대비 야후 단독 정확도 **95.8%**(497 겹침, 불일치 21건 — 결제·서비스업체를 IT로, 포장재를 소비재로 분류하는 등 체계적 패턴). 나스닥∩SIC 3순위(현행) 95.3% · 2-of-3 다수결 94.8% · 3-of-3 만장일치 99.2%. **미분류 70건 재분류 시뮬레이션 — 야후 단독으로 70/70(100%) 회수.**

🔴 **판정 대기(942)**: `lib/sector.ts`의 합의 규칙을 이 실측에 맞춰 바꿀지는 이 STEP(941)에서 정하지 않는다.

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
| `histimpl.xls`(113KB) | 내재 ERP **연간** 시계열(1960~2025) — Year·T.Bond Rate·Implied ERP(FCFE) 등 19컬럼 | ERP 대안(연간, 998이 처음 등재) — **STEP1001 확인: 실제로는 연1회 갱신**(998의 "월별 갱신 포함" 서술은 부정확했음) |
| `ERPbymonth.xlsx`(47KB, https://pages.stern.nyu.edu/~adamodar/pc/implprem/ERPbymonth.xlsx) | 내재 ERP **월간** 시계열(2008-09~) — `Start of month`·`T.Bond Rate`·`$ Riskfree Rate`(별도 계열, 산식 미상)·ERP 5변형이 같은 행에 짝으로 존재 | 🔑 **STEP1001 신규 발견 — 998의 카탈로그가 놓쳤던 진짜 월간 파일.** `damodaran_global_inputs`(riskfree=0.0395·erp=0.0446, as_of 2026-01-05)가 이 파일 2026-01행의 `$ Riskfree Rate`·`ERP(T12m) with adj riskfree rate`와 정확 일치 — 우리 저장값의 실제 원천이 이것임을 역추적으로 확인. HTTP `Last-Modified` 월1회 갱신 확인(대조: `wacc.xls`는 2026-01-12 이후 정체) |

🔴 **알려진 내부 불일치**: `countrytaxrates.xls` US 한계세율 **25.63%** vs `wacc.xls`·`betas.xls` 입력 **25.00%**.
→ 결정: `countrytaxrates.xls` 채택 + **WACC은 직접 조립**(그의 완성 `Cost of Capital` 열 사용 금지). 상세 = `docs/REVDCF_SPEC.md` §12.

🔴 **`wacc.xls`의 리스크프리·ERP 값(상단 입력)은 갱신 주기가 다른 xls들과 다르다(STEP1001)**: 2026-08-12 재다운로드해도 `Long Term Treasury bond rate`·`Risk Premium to Use for Equity` 값이 여전히 2026-01-05 그대로다(Last-Modified도 2026-01-12에서 정체) — Damodaran이 이 두 셀만 따로, 불규칙하게(연1회 정도) 업데이트하는 것으로 보인다. `ERPbymonth.xlsx`는 매월 갱신되므로 이 두 값만큼은 그쪽을 보는 것이 더 최신이다. 상세 = `docs/REVDCF_SPEC.md` §10-F.

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
| 🔴 `EXTERNAL_UNIVERSE_QUOTES.md` | **외부 3주체 유니버스 규칙 원문 발췌**(2026-08-02) — NC 지수사다리(**이유 서술 없음**) · Morningstar Quant 유동성 하한(현지통화 5,000/일·이유="모델 편향 완화"·US 4,379사) · **Damodaran 컷 없음**(48,156·이유="표본 편향"). 🔴 **발췌지 원본 아님** → 원본은 `external/`·아래 Damodaran/NC 원문 |
| `damodaran_data_update_1_2026.html` | **Damodaran "Data Update 1 for 2026: The Push and Pull of…"** 블로그 원문(2026-01·유니버스=48,156사 무컷·표본편향 논거의 1차 출처) |
| `newconstructs_gap.html` | **New Constructs "Growth Appreciation Period(GAP)"** 교육 페이지 원문 — GAP=우리 개념(ROIC>WACC 연수·DCF=주가 역산). 🔴 값은 자체조정 NOPAT(비공개)이라 재현 불가 |

✅ **미저장 3건 → 전부 원본 확보 완료 (2026-08-02)**

| 대상 | 저장 위치 | 취득 경로 |
|---|---|---|
| Morningstar Quant 방법론 **PDF 원본** | `external/morningstar_quant_methodology_2024-12-02.pdf` (813KB) | 🔴 지정 URL(`s205.q4cdn.com/437373358/…`)은 **403(edge 차단)** → 동일 문서의 **공식 대체 호스트** `s21.q4cdn.com/198919461/files/doc_downloads/2024/11/Quantative-Equity-Research-Effective-2-Dec-2024.pdf`에서 확보(1페이지 "Morningstar Quantitative Equity Ratings Methodology" 확인) |
| Damodaran `Data Update 1 for 2026` 원문 | `text/damodaran_data_update_1_2026.html` (161KB) | `aswathdamodaran.blogspot.com/2026/01/data-update-1-for-2026-push-and-pull-of.html` (첫 줄 취득일·URL 주석) |
| New Constructs **GAP** 페이지 | `text/newconstructs_gap.html` (98KB) | 옛 URL 404 → 검색으로 현행 `www.newconstructs.com/education-growth-appreciation-period/` 확인·확보("growth appreciation period" 12회) |

---

## 🔴 유니버스 = **원전에 없는 우리 추가물** (2026-08-02 확인)

**개봉 확인**: `EI_tutorial_02_sales.html`·`EI_tutorial_08_PIE.html`에서 `liquidity`·`trading volume`·`universe`·`screening` **전부 0건**.
→ **원전은 단일 종목 분석서**라 "어떤 종목을 담을까"라는 문제가 발생하지 않는다.

따라서 유니버스·유동성 컷은 **원전 대조표의 "우리 추가물" 행**이며, 근거는 원전이 아니라 밖에서 와야 한다.
🔴 그런데 **밖이 서로 다르다**(위 3주체). 상세 = `EXTERNAL_UNIVERSE_QUOTES.md` · 결정은 `docs/REVDCF_SPEC.md` §4 A-9.

---

## 갱신 규칙

| 소스 | 주기 | 조치 |
|---|---|---|
| 다모다란 8개 파일 | **연 1회 · 1월 첫 2주** | 재다운로드 + 기준일 갱신 + 값 변화 확인 |
| 원전 스프레드시트 | 개정판 나올 때만 | 변경 없음 가정 |
| SEC API 문서 | 변경 고지 시 | frames 규칙 변경 여부 확인 |
| us-gaap 택사노미 | 연 1회 개정 | 태그 폐기·신설 확인 |
