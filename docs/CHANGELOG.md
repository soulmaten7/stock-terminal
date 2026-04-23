<!-- 2026-04-23 -->
# Stock Terminal — 변경 이력

## 2026-04-23 — STEP 86: 신규 화면 3개 (/market-map 섹터 히트맵 + /themes 테마주 + /disclosures 2컬럼) + TopNav 링크 정비

## 2026-04-23 — STEP 85: 데이터 품질 수정 (sectors KR 폴백 + movers 로그 + screener ETF 필터 + news 키워드 필터)

## 2026-04-23 — feat(dashboard): Section 1 L-shape 레이아웃 + FloatingChat v3 + WidgetHeader 통일 (STEP 84) — TickWidget/BriefingWidget/GlobalIndicesWidget/VolumeTop10/NetBuyTop 변환, OverviewTab 14일 필터+종목배지+빈상태 UI

## 2026-04-23 — fix(dashboard): 긴급 패치 6건 통합 (STEP 83) — 섹션 고정높이, 위젯 전체보기 링크, FloatingChat 재설계, 중복key 수정

## 2026-04-23 — chore(qa): STEP 82 통합 QA — 빌드 검증, console 정리, V3_RELEASE_NOTES.md 생성, 세션 문서 업데이트

## 2026-04-23 — feat(widgets): 체결창/호가창 폴리싱 — fadeIn 애니, 대량체결 배지, depth bar, 총잔량, selectedSymbol 동기화 (STEP 81)

## 2026-04-23 — feat(home): Section 5 Information Streams — NewsStream + DisclosureStream(KR/US) + EconomicCalendar (STEP 80)

## 2026-04-23 — feat(home): Section 4 Market Structure — SectorHeatmapWidget (KR/US 토글) + ThemeTop10Widget (STEP 79)

## 2026-04-23 — feat(home): Section 3 Discovery — ScreenerExpandedWidget + MoversPairWidget + Volume/NetBuy inline (STEP 78)

## 2026-04-23 — feat(chat): 인라인 ChatWidget → 전역 FloatingChat 전환 (3상태: 닫힘/최소화/열림) (STEP 77)

## 2026-04-23 — feat(dashboard): Section 2 Pre-Market & Global 추가 — 장전 브리핑 + 글로벌 지수 확장 17지표 (STEP 76)

## 2026-04-23 — feat(dashboard): Section 1 TODO 보강 — 배당/DART재무상태·현금흐름/SEC공시 (STEP 75)

## 2026-04-22 — feat(dashboard): Section 1 반응형 + 선택 종목 persist + 모바일 토글 (STEP 74)

## 2026-04-22 — feat(dashboard): 뉴스·공시·재무 탭 상세 콘텐츠 (STEP 73)

## 2026-04-22 — feat(dashboard): 종합 탭 5블록 실데이터 연결 (STEP 72)

## 2026-04-22 — feat(dashboard): selectedSymbolStore + 종합 탭 5블록 구조 골격 (STEP 71)

## 2026-04-22 — feat(dashboard): Section 1 3컬럼 레이아웃 + 우측 종목상세 패널 스켈레톤 (STEP 70)

## 2026-04-22 — docs: Dashboard Spec V3.2 — Section 1 우측 컬럼 확정 (스냅샷 헤더 + 탭 4개, 종합 블록 5개)

## 2026-04-22 — Dashboard Spec V3.1 — Section 1 레이아웃 확정 (🅐 3컬럼 + 60/25/15)

## 2026-04-22 — STEP 59~66: P0/P1 위젯·페이지 전량 실데이터 전환 (commit 6cbf55a)

한 세션에 8개 STEP 일괄 실행 — 28 files, +3482 / -290.

### STEP 59: /global — Yahoo Finance 35개 심볼 실데이터
- `app/api/global/route.ts` 신설 — 35개 심볼을 8개 섹션(국내/미국/선물/환율/채권/원자재/아시아/유럽)으로 반환
- `components/global/GlobalPageClient.tsx` 신설 — 섹션 필터 세그먼트, 52주 고가/저가, 60초 자동갱신, 채권 yield 포맷 구분
- `app/global/page.tsx` — WidgetDetailStub 제거, Client 호출만 남김

### STEP 60: /briefing — 3-컬럼 실데이터
- `components/briefing/BriefingPageClient.tsx` 신설 — /api/home/briefing + /api/calendar/upcoming 조합
- 3-컬럼 그리드: 간밤 미증시 / 오늘 주요 공시 / 이번주 경제지표
- `app/briefing/page.tsx` 스텁 제거

### STEP 61: VerticalNav 5그룹 재구성
- 14개 flat 아이콘 → 5그룹 (시세 / 정보 / 일정 / 글로벌 / 도구)
- hover 시 54px → 220px 확장 애니메이션, 그룹 헤더 uppercase 라벨
- 호가창·체결창·채팅 메뉴 신규 노출 (기존 drawer/inline 전용이던 항목들)
- Task #25 해결

### STEP 62: News 폴리싱
- `NewsFeedWidget` — 소스 배지(6개 색상 맵) 클릭 시 `/news?source=` 프리셋, 종목 태그 `#` 표시
- `NewsClient` — 1h/24h/7d/전체 기간 세그먼트, 중요 공시만 토글, URL 파라미터 초기화 (`useSearchParams`)
- `app/news/page.tsx` — Suspense 래핑

### STEP 63: Calendar 폴리싱
- `EconCalendarMiniWidget` — 3단계 중요도 dot(회색/주황/빨강), 오늘/내일 라벨 + 당일 로우 하이라이트
- `CalendarPageClient` — 기간(7/30/60일) + 국가(6개: 전체/미국/한국/유럽/일본/중국) + 중요도 3-세그먼트
- URL `?importance=` 프리셋 이동 지원

### STEP 64: TrendingThemes + /analysis 폴리싱
- `TrendingThemesWidget` — 상승/하락 토글, 상대 등락률 바 시각화, 테마 클릭 시 `/analysis?theme=` 프리셋
- `AnalysisClient` — 전체 테마 4-컬럼 그리드 섹션 (상승/하락/종목수 정렬) + `?theme=` 파라미터 하이라이트
- `app/analysis/page.tsx` Suspense 래핑

### STEP 65: Chat 폴리싱
- `ChatWidget` — `$005930` `$삼성전자` 패턴 자동 감지 → `/chart?symbol=` 링크 (renderWithTags 파서)
- `app/chat/page.tsx` — WidgetDetailStub 제거, ChatWidget 풀페이지 전환

### STEP 66: Ticks 폴리싱
- `TickWidget` — 6자리 숫자 심볼 인풋, 심볼 변경 시 5초 폴링 재시작
- `components/ticks/TicksPageClient.tsx` 신설 — 통계 패널(체결강도·매수/매도·가중평균가) + 50건 로그 테이블 + 매수/매도 뱃지
- `app/ticks/page.tsx` 스텁 제거, Suspense 래핑

### 결과
- P0/P1 위젯 + 대응 풀페이지 **전량 실데이터** 전환 완료
- 홈 대시보드의 모든 위젯이 기능하는 상태 = 런칭 가능 수준 UI
- 다음 우선순위: 배포(Vercel) 검증 + P2 (Chart 확장, AI 분석 추가) / Supabase 스키마 배포

---

## 2026-04-22 — STEP 58: NetBuy 위젯 + /net-buy TopTab 개선 (P0)

### 변경
- `app/api/kis/investor-rank/route.ts` — sort(buy/sell) + market 파라미터, foreignTop/institutionTop/combined 3종 반환
- `NetBuyTopWidget` — 외국인/기관 + 매수/매도 이중 토글, 막대 시각화, href 동적화
- `components/net-buy/TopTab.tsx` — 3-세그먼트 컨트롤 (Who/Mode/Market) + URL 파라미터 초기화, 종목명 `/chart?symbol=` 링크

---

## 2026-04-22 — STEP 57: Volume 위젯 + /movers/volume 페이지 리팩토링 (P0)

### 변경
- `app/api/kis/volume-rank/route.ts` — market + sort(spike/volume/amount) + limit 파라미터 추가, tradeAmount 필드 포함
- `VolumeTop10Widget` — 배수 막대 시각화 (급등=빨강, 고배수=주황, 기본=티얼), 10x 이상 "급등" 뱃지
- `components/movers/MoversVolumePageClient.tsx` 신규 — 시장구분 + 정렬(거래증가율/거래량/거래대금), 배수 막대, 종목명 → /chart 링크
- `app/movers/volume/page.tsx` — WidgetDetailStub 스텁 제거, Suspense 래퍼로 교체

---

## 2026-04-22 — STEP 56: Movers 위젯 + /movers/price 페이지 리팩토링 (P0)

### 변경
- `app/api/kis/movers/route.ts` — market(kospi/kosdaq/all) + limit(30) 파라미터 추가, prdyVrss·volume 필드 추가
- `MoversTop10Widget` — 상한가/하한가 배경 강조 + 뱃지, 탭 라벨에 상한가 개수, href 동적화 (?tab=)
- `components/movers/MoversPricePageClient.tsx` 신규 — 상승/하락 + 시장구분 + 상한가만 토글, 전일대비·거래량 컬럼, 종목명 → /chart 링크
- `app/movers/price/page.tsx` — WidgetDetailStub 스텁 제거, Suspense 래퍼로 교체

---

## 2026-04-22 — STEP 55: DartFilings 위젯 + /disclosures 페이지 리팩토링 (P0)

### 변경
- `lib/dart-classify.ts` 신규 — classifyDartType / TYPE_COLOR / fmtDartDate / fmtDartDateFull 공용 모듈
- `DartFilingsWidget` — 전체/중요 토글 action 슬롯, 붉은 보더, 중요 뱃지, href 동적화
- `components/disclosures/DisclosuresPageClient.tsx` 신규 — 화이트/티얼 테마, 시장구분·중요 필터, 유형 뱃지 컬럼, URL 파라미터 지원
- `app/disclosures/page.tsx` — Suspense 래퍼 + 다크 테마 잔재 제거

---

## 2026-04-22 — STEP 54: /orderbook 풀스크린 10단 페이지 (P0 Phase B)

### 변경
- `app/orderbook/page.tsx` — WidgetDetailStub 스텁 제거, Suspense 래퍼로 교체
- `components/orderbook/OrderBookPageClient.tsx` — 신설 (URL ?symbol=, 종목 요약 헤더 8개 지표, 10단 호가창 3-col, 총잔량 게이지 바, 5초 갱신)

---

## 2026-04-22 — STEP 53: OrderBookWidget 리팩토링 (P0 Phase A)

### 변경
- `components/widgets/OrderBookWidget.tsx` — 3-col 그리드 (매도잔량·호가·매수잔량), 총잔량 푸터 + 비율 게이지, 6자리 심볼 입력 폼, href 동적화

---

## 2026-04-22 — STEP 52B: 중복·미사용 파일 정리

### 변경
- 죽은 코드 제거: `components/common/LoadingSkeleton.tsx`, `app/compare/`, `components/compare/`
- 구 Phase 명령서 15개 삭제 (PHASE1~4 + V3_W1~W5, 5,702 lines)
- 중복 `docs/DATA_SOURCES_MAPPING.xlsx` 제거 (`REFERENCE_PLATFORM_MAPPING.xlsx`로 대체됨)
- `PRODUCT_SPEC_V3.md` · `NEXT_SESSION_START.md` 구 명령서 참조 정리

---

## 2026-04-22 — STEP 52: Chart 페이지 리팩토링 (P0 Phase A)

### 변경
- `app/chart/page.tsx` — WidgetDetailStub 스텁 제거, Suspense 래퍼로 교체
- `components/chart/ChartPageClient.tsx` — 신설 (URL 파라미터 ?symbol=, 기간 토글 D/W/M, lightweight-charts 캔들+거래량, TradingView 임베드, OHLCV 30행 테이블)
- `components/widgets/ChartWidget.tsx` — href `/chart` → `/chart?symbol={encodeURIComponent(raw)}` 동적화

---

## 2026-04-22 — STEP 51: Watchlist Phase A — 전일비 컬럼 + 인라인 추가 폼 + 정렬

### 변경
- `components/widgets/WatchlistWidget.tsx` — `change` 필드 추가, grid-cols-5, 전일비 컬럼, 종목명 → Link
- `components/watchlist/WatchlistPageClient.tsx` — `change` 필드, 인라인 추가 폼(6자리 검증), 컬럼별 토글 정렬(SortKey 8종), 전일비 컬럼 추가

---

## 2026-04-22 — STEP 50: 레퍼런스 플랫폼 매핑 테이블 작성

### 배경
사용자 지시: "다른 플랫폼에 있는 UI와 기능을 그대로 가져온다. 매수매도만 제외." 이후 STEP 51+ 부터 각 위젯·페이지 UI를 리팩토링하기 전에, 어느 플랫폼을 벤치마킹할지 합의된 매핑 문서가 필요. 중복 기능은 가장 잘 구현된 플랫폼 하나를 선택하고, 한 곳만 있는 기능은 그대로 가져온다는 원칙 확정.

### 추가
- `docs/REFERENCE_PLATFORM_MAPPING.md` — 홈 위젯 14개 + 상세 페이지 14개 + 레퍼런스 URL 리스트 매핑
- `docs/REFERENCE_PLATFORM_MAPPING.xlsx` — 동일 내용 엑셀 버전 (필터링/정렬용, 우선순위 색상 코딩)

### 매핑 요약
- **주 벤치마크 플랫폼 (가장 많이 참조)**: 네이버증권 (정보 조회), TradingView (차트), Koyfin (대시보드/관심종목), Finviz (스크리너/히트맵), Investing.com (경제캘린더/글로벌), 키움 영웅문 (호가·체결·관심종목)
- **우선순위 분포**: P0 = 11개, P1 = 13개, P2 = 5개 (총 28개 매핑)
- **P0 핵심**: 홈/Screener/Watchlist/Chart 페이지 + Watchlist/Chart/OrderBook/DART/Movers/Volume/NetBuy 위젯

### 다음 단계
STEP 51부터 P0 항목 순서대로 레퍼런스 UI 스크린샷 수집 → 위젯별 디테일 스펙 문서 작성 → UI 리팩토링

## 2026-04-22 — STEP 49: 위젯 네비게이션 정합성 정리

### 배경
홈 위젯 13개의 `href` 연결 감사 결과, 11개 이미 정확. 사이드바 '시장 지도' 항목이 중복 페이지 `/analytics` (InvestorFlowWidget 하나만 렌더)를 가리키는 매핑 오류 발견.

### 수정
- `VerticalNav.tsx`: '시장 지도' href `/analytics` → `/analysis` (SectorHeatmap + ThemeGroups + MarketFlow + EconomicDashboard 실제 시장 지도 페이지)
- `app/analytics/` 삭제 (`/investor-flow` 와 중복 기능)
- `components/common/WidgetShell.tsx` 삭제 (미사용, `WidgetCard` 와 중복)
- `ScreenerMiniWidget.tsx`: 우상단 `ArrowUpRight` 아이콘 링크 추가 (다른 위젯과 일관된 UX)

### 유지 (이미 올바른 매핑)
- 11개 위젯 href 정확 — Watchlist, Chart, OrderBook, Tick, News, DART, EconCal, Movers, Volume, NetBuy, Global
- TrendingThemesWidget.`href="/analysis"` 는 정답이었음

## 2026-04-22 — STEP 48: 드로워 오버레이 제거, 평범한 페이지 라우팅으로 회귀

### 배경
STEP 47에서 Parallel Route `@panel` + Intercepting Route `(.)screener` + 우측 오버레이 `DetailDrawer` 조합을 구축했으나, 사용자 의도와 불일치. 사용자는 "URL만 바뀌고 레이아웃(사이드바+티커바+푸터)은 유지되는 평범한 페이지 이동"을 원했음. `/net-buy` 가 이미 그 패턴이었고, 그게 정답.

### 제거
- `app/@panel/` 디렉토리 전체 (`default.tsx`, `(.)screener/page.tsx`)
- `components/common/DetailDrawer.tsx`
- `app/layout.tsx` 의 `panel` parallel slot 파라미터

### 유지
- `components/common/WidgetShell.tsx` — [더보기 →] `<Link href>` 기반 평범 네비게이션
- STEP 47의 `link-hub` 삭제, `/filings` → `/disclosures` 정리는 그대로 유효

### 교훈
Next.js Parallel/Intercepting Routes는 진짜 모달 오버레이 UX가 필요할 때만 쓴다. "URL은 바뀌지만 레이아웃은 유지"는 App Router의 기본 동작이므로 별도 인프라 불필요.

## 2026-04-22 — STEP 47: URL 라우팅 인프라 + 드로워 패턴 도입

### Added
- **Parallel Routes 인프라**: `app/@panel/` 슬롯 + `app/layout.tsx`에 `panel` 파라미터 추가
- **Intercepting Route**: `app/@panel/(.)screener/page.tsx` — 대시보드에서 `/screener` 네비 시 드로워로 인터셉트
- **공통 컴포넌트 `DetailDrawer`** (`components/common/DetailDrawer.tsx`): 우측 슬라이드 드로워, ESC/백드롭 닫기, body 스크롤 잠금
- **공통 컴포넌트 `WidgetShell`** (`components/common/WidgetShell.tsx`): 위젯 외곽 + `[더보기 →]` 버튼 통합 (STEP 48부터 위젯 전체에 적용 예정)

### Changed
- `/screener` 직접 URL 접속은 풀페이지 유지 (공유·SEO·북마크 대응)
- `VerticalNav` 의 DART 공시 링크 `/filings` → `/disclosures` 교체
- `DartFilingsWidget` 의 `href` `/filings` → `/disclosures` 교체

### Removed
- `app/link-hub/` — `toolbox/` 가 완전 대체
- `app/filings/` — 스텁 페이지. `disclosures/` 가 실제 DART API 연동 구현체

### 아키텍처 결정
- **URL-routed drawer 패턴 채택**: `/screener` URL이 네비게이션 컨텍스트에 따라 드로워 또는 풀페이지로 렌더됨
- **인터셉팅 마커 수정**: `(..)` → `(.)` (루트 레벨에선 동일 세그먼트 마커 사용)

## 2026-04-22 — STEP 46: 스크리너 팩터 업그레이드 (API JOIN + 프리셋 8종 + 정렬 컬럼)

- **Migration**: `supabase/migrations/013_stock_snapshot_view.sql` 신규 — stocks + 최신 quant_factors + 최신 dividends LEFT JOIN LATERAL view
- **API**: `app/api/stocks/screener/route.ts` 전면 재작성 — PER/ROE/composite/yield/payout 필터 + orderBy 화이트리스트 기반 정렬
- **UI**: `components/screener/ScreenerClient.tsx` 재작성 — 프리셋 3종 → 8종 (퀀트 TOP 100 / 저PER+고ROE / 모멘텀 / 배당 귀족 / Quality), 필터 5종 추가 (PER max, ROE min, 퀀트종합 min, 배당수익률 min), 테이블 컬럼 3종 추가 (PER, ROE, 퀀트종합 배지), 클릭 정렬
- **Data**: quant_factors 200행 + dividends 790행 노출 채널 개통. 스크리너에서 전종목 팩터 검색 가능
- **Result**: `/screener` 페이지 stub → 전업용 팩터 스크리너로 격상

## 2026-04-22 — STEP 45: QuantAnalysis 재활성화 (전종목 팩터 집계 완료, 5개 분석 탭 전원 live)

- **Migration**: `supabase/migrations/012_quant_factors.sql` 신규 — quant_factors 테이블
- **Script**: `scripts/seed-quant-factors.py` 신규 — TOP 200 대상 Value/Momentum/Quality 퍼센타일 집계
- **Data**: quant_factors 200행 시딩 (schema cache 문제 → Management API로 테이블 직접 생성)
- **Component**: `components/analysis/QuantAnalysis.tsx` 스텁(32줄) → 실제 퀀트 컴포넌트(~200줄)
  - 종합 퀀트 스코어 그라디언트 헤더 (0~100, 섹터 내 순위 포함)
  - Value · Momentum · Quality 3개 점수 카드
  - 레이더 차트 (RadarChart)
  - 원시 지표 테이블 (PER/PBR/ROE/영업이익률/3M·6M·12M 수익률)
- **5개 분석 탭 모두 실데이터 연결 완료** — 가치투자 · 기술적 분석 · 수급 분석 · 배당 분석 · 퀀트 분석

## 2026-04-22 — STEP 44: DividendAnalysis 재활성화 (DART alotMatter 배당 수집)

**신규 파일**
- `scripts/seed-dividends.py` — DART `alotMatter.json` 으로 TOP 200 대상 2019~2024 (6년) 배당 이력 수집

**데이터 작업**
- dividends 테이블 790행 시딩 (200종목 × 최대 6년, 무배당주 제외)
- 삼성전자 검증: 2024 DPS=1,446원 yield=2.7% payout=29.2% ✓

**코드 변경**
- `components/analysis/DividendAnalysis.tsx` — 32줄 스텁 → 실제 배당 컴포넌트
  - 4지표 카드 (DPS·yield·payout·YoY growth), DPS 바차트, yield/payout 라인차트

---

## 2026-04-22 — STEP 43: SupplyAnalysis 재활성화 (KIS FHKST01010900 수급 시딩)

**신규 파일**
- `scripts/seed-supply-demand.py` — KIS 종목별 투자자별 매매동향 API → supply_demand 테이블 upsert

**데이터 작업**
- supply_demand 테이블 3,000행 시딩 (100종목 × ~30영업일, 실패 0건)

**코드 변경**
- `components/analysis/SupplyAnalysis.tsx` — 32줄 스텁 → 실제 수급 분석 컴포넌트
  - 60일 합계 카드 (외국인·기관·개인), 양수=빨강/음수=파랑
  - 일별 순매수 스택 바차트, 누적 순매수 라인차트, 최근 5일 요약 테이블

---

## 2026-04-22 — STEP 42: TechnicalAnalysis 재활성화 (stock_prices 시딩 + MA·볼린저·RSI)

**데이터 작업**
- `scripts/seed-stock-prices.py` 실행 → `stock_prices` 테이블 시총 TOP 200 1년 일봉 53,363건 upsert (실패 0건, 누계 54,899건)

**코드 변경**
- `types/stock.ts` — `StockPrice` 인터페이스 추가
- `components/analysis/TechnicalAnalysis.tsx` — 32줄 스텁 → 실제 기술 지표 컴포넌트 재작성
  - SMA (5·20·60·120일), 볼린저밴드 (20일 ±2σ), RSI (Wilder's 14일), 거래량 바차트
  - 일봉 20개 미만 종목은 "데이터 부족" 카드 표시

---

## 2026-04-22 — STEP 41: 나머지 4개 분석 탭 정직 스텁 교체

**코드 변경**
- `components/analysis/QuantAnalysis.tsx`: 282줄 → 35줄 (스텁, 예정 STEP 45+)
- `components/analysis/DividendAnalysis.tsx`: 320줄 → 35줄 (스텁, 예정 STEP 44)
- `components/analysis/TechnicalAnalysis.tsx`: 394줄 → 35줄 (스텁, 예정 STEP 42)
- `components/analysis/SupplyAnalysis.tsx`: 335줄 → 35줄 (스텁, 예정 STEP 43)
- **총 1,331줄 → 약 140줄** (1,191줄 감소)

**제거된 기술 부채**
- AI Summary 섹션 4개 (V3 방향성 위반)
- 하드코딩된 수익률/퍼센타일/팩터 스코어
- `ai_analyses` 테이블 쿼리 4개
- placeholder fallback 숫자

---

## 2026-04-22 — STEP 40: ValueAnalysis 정직한 재작성

**코드 변경**
- `components/analysis/ValueAnalysis.tsx` 전면 재작성 (315줄 → 약 150줄)
  - 제거: AI Summary 섹션, ai_analyses 테이블 쿼리, DCF 모델, 그레이엄 안전마진, SECTOR_AVERAGES 하드코딩, placeholder fallback 숫자 (`per ?? 12.5`, `currentPrice = 52000`, `sharesOutstanding = 100_000_000`)
  - 추가: DART 실재무 시계열 차트 (매출·영업이익·순이익 최근 5년), 수익성·안정성 지표 추이 (영업이익률·순이익률·부채비율)
  - 유지: 상단 KPI 카드 5개 (PER/PBR/ROE/EPS/BPS), null 일 때 `—` 표시

**방향성**
- CLAUDE.md 절대규칙 준수: "session-context.md 에 없는 숫자 만들기 금지"
- V3 방향성 준수: AI 리포트 전면 제거
- DART 미커버 종목은 ComingSoonCard 로 정직 표시

---

## 2026-04-22 — STEP 39: DART 파서 보완 + TOP 100 확장

**코드 변경**
- `scripts/seed-dart-financials.py` `find_amount` 전면 개선
  - account_id/account_nm 완전 일치 우선 → IFRS/DART 태그 prefix 부분 매칭 2차 fallback
  - 일반 한글 키워드 부분매칭 차단 (엉뚱한 항목 매칭 방지)
  - `find_is_or_cis` 신설 — 손익계산서는 IS 먼저, 없으면 CIS (단일 포괄손익계산서) 탐색
  - keyword 확장: 매출/영업수익/수익, 영업이익/영업이익(손실)/영업손익, 당기순이익/당기순이익(손실)/당기순손익/반기·분기순이익 + `ifrs-full_RevenueFromContractsWithCustomers`·`ifrs-full_ProfitLossFromOperatingActivities`
  - CFS → OFS fallback 추가 (연결재무제표 미제출 종목 대응)
- `lib/dart-financial.ts` 동일 방향 동기화 (`findBySjDiv` 1/2차 로직 + IS→CIS fallback + CFS→OFS fallback + keyword 확장)
- `scripts/debug-dart-sample.py` 신규 — DART `fnlttSinglAcntAll` raw 응답 덤프 (sj_div 별 그룹화, 상위 40건 + OFS 재시도)

**근본 원인 진단 (Part A)**
- SK하이닉스·한화에어로·삼성바이오·HD현대중공업 4종목 모두 **IS 섹션 없음, CIS 단일 손익계산서만 제출**
- 파서가 `sj_div='IS'` 만 탐색 → 전 필드 null
- 한화에어로 매출 = `매출` (account_nm), 삼성바이오 영업이익 = `영업이익` (괄호 없음) — keyword 확장 동시 필요

**데이터 작업**
- STEP 38 누락 4종목 전원 복구 성공 (rev/op/ni 모두 적재)
- `TOP_N=100 YEARS='2023,2024'` 배치 → `financials` 193건 upsert (누계 576건)
- SKIP 5건: 005935/005387 (우선주 corp_code 없음), HD현대마린솔루션 2023 (신규상장), 기타 2건

**효과**
- 테마 50종목 중 **37종** DART 실재무 커버 (STEP 38 의 0종 → 37종)
- 시총 TOP 100 종목의 `/stocks/[symbol]` 에 2023/2024 연간 매출·영업이익·순이익·자산·부채·자본 시계열 DB 적재 완료
- `lib/dart-financial.ts` 도 동기화되어 런타임 API 도 동일 정확도 확보

---

## 2026-04-22 — STEP 38: DART 재무제표 파이프라인

**신규 파일**
- `scripts/seed-dart-financials.py` — DART `fnlttSinglAcntAll` API → `financials` 테이블 upsert
  - IS: 매출·영업이익·순이익 / BS: 자산·부채·자본
  - `operating_margin`, `net_margin`, `debt_ratio` 자동 계산
  - `on_conflict='stock_id,period_type,period_date'` 멱등 upsert
  - 환경변수 `TOP_N` / `YEARS` / `REPRT_CODE` 로 확장 가능

**데이터 작업**
- `dart_corp_codes` 테이블 3,959건 (DART 전체 코드 매핑, Step 38A 선행 완료)
- `financials` 테이블 18건 upsert (시총 TOP 10 × 2023,2024 연간 — 총 누계 401건)
- 삼성전자 2023 rev=258.9조 op=6.6조 / 2024 rev=300.9조 op=32.7조 검증 완료

**비고**: SK하이닉스·한화에어로스페이스·삼성바이오로직스·HD현대중공업 4종목 IS 항목명 불일치로 null → STEP 39에서 account_id fallback 보완 예정

---

## 2026-04-22 — STEP 37: KIS 재무 스냅샷 시딩

**데이터 작업 (코드 변경 없음)**
- `scripts/seed-financials-snapshot.py` 실행
- `financials` 테이블에 KIS inquire-price 기반 PER/PBR/EPS/BPS 192건 upsert (실패 0건)
- 대상: 시총 TOP 200 종목 (`financials` 누계 383건)

**효과**
- `/stocks/[symbol]` OverviewTab KPI 그리드 활성화 (PER/PBR/EPS/BPS `—` → 숫자)
- 삼성전자 예시: PER 33.14 / PBR 3.4 / EPS 6,564 / BPS 63,997
- ROE는 `eps / bps * 100` 자동 계산 (OverviewTab API 기존 fallback 로직)
- `data/themes.json` 테마 50종목 중 시총 TOP 200 안의 종목들 즉시 혜택

---

## 2026-04-22 — STEP 36: Supabase stocks/link_hub 전체 시딩

**데이터 작업 (코드 변경 없음)**
- `scripts/seed-stocks.py` 실행 → `stocks` 테이블 KOSPI(949)+KOSDAQ(1820) 전체 2,780건 upsert
- `link_hub` 테이블 56건 재시딩

**효과**
- STEP 35에서 🔒 잠겼던 4개 탭(재무·어닝·뉴스·수급)이 `data/themes.json` 37개 테마 종목에서 해제됨
- `/api/stocks/resolve?symbol=xxx` 응답 `source` 필드가 `kis` → `supabase`로 전환

---

## [2026-04-22] 세션 #24 — 관심종목 생태계 완성 + 수급 탭 통합 (Step 28~30)

### Step 28 — /net-buy 탭 구조 통합
- `/investor-flow` → `/net-buy?tab=flow` 301 리다이렉트
- `/net-buy` 2탭 구조: [종목별 TOP] [시장 동향]
- `async searchParams` (Next.js 16 Promise 타입) 패턴 적용

### Step 29 — 수급 탭 KIS API 실데이터 연동
- `TopTab`: `/api/kis/investor-rank` 외국인+기관 합산 TOP 20
- `FlowTab`: `/api/home/investor-flow` 투자자별 매매동향 (KOSPI/KOSDAQ)

### Step 30 — 관심종목 생태계 완성 (Phase 2-D)
- `lib/watchlist.ts` — `getWatchlistSymbols` 헬퍼 추가
- `ScreenerClient` — ⭐ 버튼 + 낙관적 UI (로그인 필요 시 alert)
- `WatchlistPageClient` (신규) — 실데이터 풀 페이지 (auth gate + 8컬럼 + 10초 폴링 + 삭제)
- `app/watchlist/page.tsx` — Math.random() 스텁 → WatchlistPageClient 대체
- `WatchlistWidget` — 로그인 사용자: Supabase watchlist, 비로그인: DEFAULT_SYMBOLS fallback

---

## [2026-04-22] 세션 #23 — 사이드바 통합 후 레이아웃 정렬 대수술 (Step 20~27)

**배경**: 세션 #22 이후 사이드바(w-14)가 레이아웃 안으로 들어왔는데, 기존 대시보드 그리드는 사이드바 없던 시절의 폭 가정(minmax 280/640/300)을 그대로 썼음. 결과적으로 R4 + Col 3 (뉴스/DART) 가 박스 밖으로 사이드바 크기만큼 튀어나옴.

### Step 20 (`53271dd`) — User Flow 아키텍처 재구성
- 기존 Zone 기반 분류에서 User Flow 기반으로 전환
- Col 1: 마켓채팅 (45%) + 종목발굴 (10%) + 관심종목 (45%) — "정보 → 탐색 → 결정"
- Col 2: 차트 (50%) + (호가창 | 체결창 1:1) (50%) — "분석 → 주문"
- Col 3: 뉴스속보 (50%) + DART공시 (50%) — "실시간 이벤트 스트림"
- R4: 상승/하락 | 거래량 | 실시간수급 | 상승테마 | 글로벌지수 (1:1:1:1:1)

### Step 20a~21 (`64fe8fa`) — VerticalNav sticky 안정화
- `components/layout/VerticalNav.tsx`에 `self-start` 추가 — sticky top-0 스크롤 추적 정상화
- `components/layout/LayoutShell.tsx` Footer 정렬 시도

### Step 22 (`907f525`) — Footer 풀폭 복원
- LayoutShell 구조 Step 19 복원 — Header / TickerBar / Footer 모두 max-w-screen-2xl (1536) 풀폭
- 롤백 이유: Step 21의 Footer pl-14 접근이 다른 부분을 망가뜨림

### Step 23 (`e16ca3a`) — Footer 수동 정렬 시도
- Footer에 `pl-16 pr-4` 적용 — `html { font-size: 13px }` 컨텍스트 고려한 수동 픽셀 계산
- 결과: 시각적으로 여전히 미스매치 (서브픽셀 오차 추정)

### Step 24 (`7ed8fe2`) — Footer 구조 미러링 (Footer 정렬 최종 해결)
- 픽셀 계산 대신 **LayoutShell 구조 미러링** 접근
- Footer 내부를 `<div w-14 shrink-0 /> + <div flex-1 min-w-0 px-2>` 구조로 재작성
- 사이드바+Main과 **동일 Tailwind 클래스**를 쓰므로 rem base·서브픽셀·줌 무관하게 정렬 보장
- Footer turquoise / disclaimer 배경은 1536 풀폭 유지

### Step 25 (`6749cee`) — Outer grid minmax floor 축소
- `minmax(280px,2.5fr) minmax(640px,6.5fr) minmax(300px,3fr)` → `minmax(240px,2.5fr) minmax(560px,6.5fr) minmax(280px,3fr)`
- Grid 최소 합 1236 → 1080 (+gap 16 = 1096) — Main 가용 ~1190px 안에 fit
- 결과: **R4 오버플로우 해결**. 하지만 R1-R3 Col 3 (뉴스/DART)는 여전히 튀어나옴

### Step 26 (`c00d199` + `b3281e5`) — minmax track min을 0으로
- 1차 시도 (c00d199): section div에 `minWidth: 0`만 추가 → 효과 있으나 불완전
- 2차 수정 (b3281e5): outer grid를 `minmax(0,2.5fr) minmax(0,6.5fr) minmax(0,3fr)`로 변경
- Track은 부모 밖으로 못 나가지만, 새로고침 시 **잠시 fit 됐다가 다시 밀려나는** 증상 발견 — 데이터 post-hydration 시점에 grid item이 min-content로 track을 안에서 밀어냄

### Step 27 (`290ec82`) — Grid item 자체의 min-width + overflow 차단 (최종 완성)
- CSS Grid Level 1 스펙의 "Automatic Minimum Size of Grid Items" 문제 해결
- `section-col1 / col2 / col3 / r4 / orderbook-tick` 5개 grid item에 `minWidth: 0 + overflow: hidden` 추가
- **3단계 방어선 구축**:
  1. Track level: `minmax(0, Nfr)` — track이 부모 밖으로 못 나감
  2. Item level: `minWidth: 0` — item이 자식 min-content로 track을 못 밀어냄
  3. Visual level: `overflow: hidden` — 최종 clip 안전망
- 결과: 새로고침 / post-hydration / 데이터 변경 모든 시점에서 오버플로우 완전 차단

### 교훈
- **픽셀 계산보다 구조 미러링** — Step 23 실패 후 Step 24 성공. Tailwind 클래스가 같으면 rem base 무관.
- **CSS Grid는 track + item 양쪽 min-width를 모두 막아야 확실하게 오버플로우 방지** — Step 25~26의 단편적 접근으론 불충분.
- **"새로고침 시 잠시 fit → 다시 밀림"은 항상 post-hydration content growth** — 자식 min-content 팽창이 원인.
- **복붙 가능한 명령서 패턴** (`docs/STEP_N_COMMAND.md`) — Cowork 설계 + Claude Code 실행 워크플로우 검증됨.

### 커밋 9개 (시간순)
1. `53271dd` refactor: restructure home dashboard to User Flow architecture
2. `64fe8fa` fix: align footer with main + stabilize sidebar sticky
3. `907f525` revert: restore footer to full box width (header = footer = 1536)
4. `e16ca3a` fix: align footer inner content with dashboard R1/R4 left edge
5. `7ed8fe2` refactor: mirror sidebar+main structure in footer for exact alignment
6. `6749cee` fix: shrink dashboard grid mins to fit post-sidebar main width
7. `c00d199` fix: add minWidth: 0 to dashboard section divs to prevent col overflow
8. `b3281e5` fix: set grid track min to 0 so dashboard never overflows main width
9. `290ec82` fix: block grid items from expanding their tracks post-hydration

### 아카이브된 명령서 (참고용)
`docs/STEP_20_COMMAND.md` ~ `docs/STEP_27_COMMAND.md` (8개) — 이번 세션의 Cowork 설계 기록

---

## [2026-04-21] 세션 #22 (계속) — Step 12: 마켓채팅 참여자 팝업 (Phase 2-A)

### Step 12 — 마켓채팅 참여자 팝업 (Phase 2-A)

**변경 사항**:
- 마켓채팅 헤더에 실시간 참여자 수 표시 ("Live · N명")
- 참여자 수 클릭 → 참여자 목록 모달 오픈
- 모달 크기: 320px × 600px (마켓채팅 위젯과 유사)
- 참여자 추적: Supabase Presence API (로그인 사용자만)
- 모달 UX: 배경 클릭/ESC/X 버튼으로 닫힘, 배경 블러, 스크롤 가능

**신규 파일**: `components/widgets/ChatParticipantsModal.tsx`
**수정 파일**: `components/widgets/ChatWidget.tsx`

**Phase 2-A 완료. Phase 2-B, 2-C 대기**:
- Phase 2-B: `/investor-flow` 페이지 내용을 `/net-buy` 내 탭으로 흡수
- Phase 2-C: 경제캘린더 홈 미니 위젯 (오늘+내일 주요 이벤트)

---

## [2026-04-21] 세션 #22 (계속) — Step 11: 사이드바 IA 개편 Phase 1

### Step 11 — 사이드바 IA 개편 Phase 1

**변경 사항**:
- 사이드바 14개 → 12개 정리
  - 제거: 커뮤니티 채팅
  - 통합: 수급 TOP + 투자자 동향 → "수급"
  - 리네임: 분석 → 시장 지도
  - 라벨 간결화: 상승/하락 TOP → 상승/하락
  - 순서: 차트를 상위로 이동
- Active State 3중 표시 구현
  - 왼쪽 컬러 바 (티파니블루 `#0ABAB5`)
  - 배경 틴트 (10% 알파)
  - 아이콘 색상 변경
- 접근성: `aria-current="page"` 속성 추가

**변경 파일**: `components/layout/VerticalNav.tsx` (단일 파일)

**Phase 2 예정 작업** (다음 세션):
- 마켓채팅 참여자 팝업 구현
- `/investor-flow` 페이지 내용을 `/net-buy` 내 탭으로 흡수
- 경제캘린더 홈 미니 위젯 추가

**Phase 3 예정 작업**:
- 시장 지도(Finviz 스타일 히트맵) 전면 재구현
- 글로벌 지수 페이지 V2 (스파크라인 + 상관계수 + VKOSPI)

---

## [2026-04-21] 세션 #22 — 홈 대시보드 V1 → V1.5 재구성 + KIS P1 복구 (Step 9-10)

### Step 9 — KIS 상승/하락/거래량 API 빈 응답 해결 (커밋 `f198862`)
- **근본 원인**: `movers` 엔드포인트 경로가 TR ID와 완전 불일치 — `FHPST01700000`(등락률 순위)이 `/quotations/volume-rank`(거래량 순위) 경로로 호출되어 KIS가 조용히 빈 `output` 반환
- **movers 라우트 완전 재작성**:
  - 경로: `/uapi/domestic-stock/v1/quotations/volume-rank` → `/uapi/domestic-stock/v1/ranking/fluctuation`
  - 파라미터 14개 재구성 (KIS 공식 GitHub 샘플 verbatim): `fid_rsfl_rate1/2`, `fid_input_cnt_1`, `fid_prc_cls_code` 신규 추가
  - symbol 필드: `stck_shrn_iscd` 우선 + `mksc_shrn_iscd` fallback
- **volume-rank 라우트 파라미터 교정**:
  - `FID_COND_SCR_DIV_CODE`: `20101` → `20171`
  - `FID_INPUT_DATE_1`: `''` → `'0'` (빈 문자열 거부)
  - `FID_BLNG_CLS_CODE`: `'0'`(평균거래량) → `'1'`(거래증가율 = "급등")
- **실측 검증 (Chrome MCP localhost:3333 라이브)**:
  - `/api/kis/movers?dir=up` 10건 반환 — 국일제지 +29.83%, 에이에프더블류 +29.93% 등 상한가 근처
  - `/api/kis/movers?dir=down` 10건 반환
  - `/api/kis/volume-rank` 10건 반환 — 화인써키트, 현대리바트 등
- 근거: https://github.com/koreainvestment/open-trading-api (examples_llm/domestic_stock/fluctuation + volume_rank)

### Step 10 — volume-rank spike 단위 버그 수정 (보수적 패치)
- **발견된 이슈**: 모든 종목의 `spike` 값이 `101x`로 동일 표시
- **원인**: KIS `vol_inrt` 필드가 %가 아닌 basis points(‱) 단위로 추정 — `/100 + 1` 공식이 10000이란 값을 만나면 101 산출
- **수정**: `vol_inrt` 의존 제거, 수동 계산(`volume / avgVolume`)만 사용
  - 장마감 후에는 `avgVolume == volume`이라 일시적으로 1.0x 표시 (허위값 대신 투명한 0~1 표현)
  - 장중(09:00-15:30 KST)에는 실제 거래량 배수로 정확히 작동

### 커밋 9개 (시간순)
1. `c42ccb9` Step 1/3: `TrendingThemesWidget` 신규 + `ChatSidebar` 신설
2. `b928742` Step 2/3: 4-row 대시보드 + 우측 고정 ChatSidebar 레이아웃
3. `56b8114` Step 3/3: 레거시 `RealtimeChatWidget` 제거 + nav 아이콘 + detail 페이지 스텁
4. `f6c4606` Step 4: 3-row grid + 마켓채팅을 grid cell로 편입 + 탭 통합 (발견피드/시장활성도)
5. `624d204` V1.2: 2-zone 대시보드 (R1-R3 viewport 고정 + R4 discovery 스크롤)
6. `d4ab8ae` V1.3: R4 플랫 레이아웃 (5개 단일 위젯) + 500px 고정 + 단일 스크롤 레이어
7. `86685b6` V1.4: R4 뷰포트 채움 `max(500px, calc(100vh - 280px))` + F-pattern 재배치
8. `49d449f` V1.5: zone 재구성 + KOSPI 200 추가 + 30초 폴링 + Yahoo 401 해결
9. `f198862` fix(kis): 등락률/거래량 순위 API 빈 응답 해결 (P1) — Step 9
10. (pending) fix(kis): volume-rank spike 단위 버그 수정 — Step 10

### 주요 변경
- **홈 레이아웃 V1.5 확정**: 3-column grid `minmax(280px,2.5fr) minmax(640px,6.5fr) minmax(300px,3fr)` × 4-row (R1 차트/R2 위젯/R3 discovery 헤더 + 서브그리드/R4 flat 5위젯)
- **신규 위젯**: `TrendingThemesWidget` (KRX 섹터 TOP 5)
- **제거**: 레거시 `RealtimeChatWidget` (grid cell로 통합되면서 중복 제거), "발견피드"/"시장활성도" 탭 구조
- **R4 discovery 영역 확정 순서 (좌→우)**: 상승/하락 TOP 10 | 거래량 급등 TOP 10 | 실시간 수급 TOP | DART 공시 피드 | 뉴스속보
  - 내러티브 흐름: "가격 이동 → 원인 → 뉴스 컨텍스트"
  - 단일 스크롤 레이어 아키텍처 (`min-h-0` + `flex-1 overflow-y-auto`)
- **글로벌 지수 위젯 (Yahoo Finance)**:
  - `yahoo-finance2` v3 npm 설치 → Yahoo 401 crumb 인증 이슈 해결
  - **KOSPI 200 (`^KS200`) 추가** → 한국 투자자용 선물 기준 지수 (9개로 확장)
  - 30초 자동 폴링 (`setInterval` + cleanup)
  - 서버 캐시 5분 → 30초
  - breaking change: v3는 `new YahooFinance()` 인스턴스화 필요
- **NetBuyTopWidget 확장**: `size?: 'default' | 'large'` + `inline?` props 추가 (R4용)
- **Col 1 폭 축소**: 3fr → 2.5fr (마켓채팅 + 글로벌 지수 컬럼)
- **위젯 위치 스왑**:
  - Col 1 하단: 관심종목 → 글로벌 지수
  - R3 중앙: 글로벌지수|실시간수급 → 관심종목|상승테마

### 파일 변경
- 신규: `app/api/home/global/route.ts` (yahoo-finance2 기반 재작성), `components/widgets/TrendingThemesWidget.tsx`, `components/layout/ChatSidebar.tsx` (→ 나중에 grid cell로 흡수)
- 수정: `components/home/HomeClient.tsx` (여러 차례 grid 포뮬러 재조정), `components/widgets/GlobalIndicesWidget.tsx` (KOSPI 200 + 폴링), `components/widgets/NetBuyTopWidget.tsx` (size/inline props), `components/widgets/MoversTop10Widget.tsx` (size/inline props), `components/widgets/VolumeTop10Widget.tsx`, `components/widgets/DartFeedWidget.tsx`, `components/widgets/NewsFeedWidget.tsx`
- 문서: `docs/STEP_4~8_COMMAND.md` 5개 생성 (Cowork → Claude Code 핸드오프 아카이브)

### 데이터 검증
- `/api/home/global` 9개 지수 전부 실데이터 (KOSPI 6,388.47 +2.72%, KOSPI 200 962.26 +2.83%, KOSDAQ 1,179.03 +0.36%, ...)
- 홈 시각 검증: Col 1 글로벌지수 정상, R3 관심종목+상승테마 1:1, R4 5위젯 순서 일치

### 알려진 이슈 (P1 다음 세션)
- **상승/하락 TOP 10, 거래량 급등 TOP 10 "데이터 없음"** — KIS API 응답 빈 배열. 엔드포인트 조사 필요

---

## [2026-04-21] 세션 #21 — Phase B 위젯 4종 실데이터 실시간 연동

### 변경
- **WatchlistWidget** 재구현: DUMMY 하드코딩 → `/api/kis/price` × 5종목(005930·000660·035420·373220·035720) 병렬 fetch, **10초 폴링**. "준비 중" 배지 제거, subtitle "KIS API · 10초 갱신"으로 교체
- **OrderBookWidget** 재구현: 하드코딩 ASKS/BIDS → `/api/kis/orderbook` + `/api/kis/price` 병렬 fetch, **5초 폴링**, 5단 호가. maxVol 대비 볼륨 바 동적 렌더. "준비 중" 배지 제거
- **TickWidget** 재구현: DUMMY 5건 → `/api/kis/execution` (최근 30건 중 10건 표시), **5초 폴링**. 체결강도 실계산 (매수체결 볼륨 / 전체 볼륨 × 100, changeSign 1·2 = 상승). "준비 중" 배지 제거
- **RealtimeChatWidget** 재구현: DUMMY 6개 + 비활성화 입력 → **Supabase Realtime `postgres_changes` INSERT 구독** + `/api/chat/send` POST. 로그인 상태별 입력창 활성/비활성 토글. nickname = user_id 해시 → NICKS[10] 매핑. 최근 20개 초기 로드 + 실시간 append (max 50). "Phase B" 배지 → "Live"

### 제거
- "준비 중" 배지 전량 제거 (WatchlistWidget · OrderBookWidget · TickWidget · RealtimeChatWidget)
- DUMMY 하드코딩 상수 전량 제거
- `grep "준비 중|Phase B|DUMMY" components/widgets/` → **0건**

### 실데이터 연동 현황
- 13개 위젯 모두 fetch() 실데이터 연결 (EconCalendar는 iframe)
- KIS API 경로: price / orderbook / execution / chart / volume-rank / investor-rank / movers / investor (7종)
- Supabase Realtime: chat_messages INSERT 브로드캐스트

### 빌드
- 78/78 통과 · 커밋 `6d3cd13` (원커밋 `a764d22` + 메시지 amend) 푸시

---

## [2026-04-20] 세션 #20 — KIS 차트 실데이터 연동 (lightweight-charts v4)

### 추가
- `npm i lightweight-charts@4.2.3` — KRX 종목 캔들차트 렌더링 라이브러리
- `app/api/kis/chart/route.ts` — KIS `FHKST03010100` (일봉 최대 150일). params: `symbol`, `period(D/W/M)`, `from`, `to`

### 변경
- **ChartWidget** 완전 재구현:
  - 6자리 숫자 입력 → KRX 경로: `/api/kis/chart` fetch → lightweight-charts 캔들+거래량 렌더
  - 그 외(AAPL, NASDAQ:NVDA 등) → TradingView tv.js 렌더 (기존 방식 유지)
  - 상승=빨강(#FF3B30) / 하락=파랑(#0064FF) KR 색깔 컨벤션
  - 거래량 서브차트 (scaleMargins top=0.8, 반투명 색상)
  - placeholder 입력: `005930 · AAPL`
- **HomeClient**: NewsFeed R4-5 (2행 span), 경제캘린더 R6 전체 폭(1/4 span)

### 빌드
- 78/78 통과 (신규 라우트 1개 추가)

### API 검증
- `GET /api/kis/chart?symbol=005930` → 삼성전자 일봉 150일 데이터 ✓

---

## [2026-04-20] 세션 #19 cont — 그리드 포뮬러 재조정 + ChartWidget 정리

### 변경
- **gridTemplateRows 포뮬러**: `(100vh - 136px) / 3` → `(200vh - 152px) / 6`
  - 152 = sticky(112) + 5 row gaps(40), 2 뷰포트 기준 균등 분배
- **ChartWidget**: `hide_top_toolbar=1` + `allow_symbol_change=0` — 팝업 방지 + 외부 심볼 변경 차단

---

## [2026-04-20] 세션 #19 — 그리드 행 높이 뷰포트 고정 (레이아웃 v3)

### 버그픽스
- **[레이아웃 v3] gridTemplateRows 뷰포트 기반 고정**: `minmax(300px, 1fr)` → `calc((100vh - 136px) / 3)` 교체.
  - 136px = Header(72) + TickerBar(40) + grid-pad-top(8) + 2×row-gap(8×2)
  - 3행 × row_h + 2×gap = 100vh - 112px ← 1페이지 정확히 채움
  - 1440×900 기준: row_h = 254.67px, 1920×1080 기준: row_h = 314.67px
- `minHeight: 200vh` 제거 — row 고정으로 불필요
- sub-grid(R3C2 호가창+체결창)에 `gridTemplateRows: '1fr'` 추가 — 세로 꽉 채움

### 검증
- 빌드 77/77 통과
- 1440×900: page1 bottom = 900px (정확), page2 bottom = 1688px (= 2×900 - 112)
- 1920×1080: page1 bottom = 1080px, page2 bottom = 2048px (= 2×1080 - 112)

---

## [2026-04-20] 세션 #18 cont — 홈 대시보드 레이아웃 v2

### 리팩토링
- **[레이아웃 v2] 2페이지 CSS 그리드**: `gridTemplateRows: repeat(6, minmax(300px, 1fr))`, `minHeight: 200vh`. 14개 위젯 중요도 순 재배치 (위 섹션 5 배치도 참고).
- **CommunityChatWidget → RealtimeChatWidget**: 고정 플로팅 → 인라인 WidgetCard 그리드 위젯. 제목 "커뮤니티 채팅" → "실시간 채팅", 고정 포지셔닝 완전 제거.
- **Sticky Header + TickerBar**: Header `sticky top-0 z-40`, TickerBar `sticky top-[72px] z-30`.
- **테이블형 위젯 폰트 스케일업**: WatchlistWidget, VolumeTop10Widget, MoversTop10Widget, GlobalIndicesWidget, NetBuyTopWidget, InvestorFlowWidget, DartFilingsWidget, NewsFeedWidget, PreMarketBriefingWidget — 헤더 `text-[10px]`→`text-xs`, 행 `text-xs`→`text-sm`, 행 패딩 `py-1.5`→`py-2.5`.
- `/chat` 페이지 제목 "커뮤니티 채팅" → "실시간 채팅".

### 문서
- `docs/DASHBOARD_SPEC_V1.md` 섹션 5 추가 — 2페이지 배치도 + 중요도 근거.

---

## [2026-04-20] 세션 #18 — 홈 대시보드 버그픽스 4종

### 버그픽스
- **[Bug 1] 레거시 채팅 중복 제거**: `components/chat/{ChatPanel,ChatSidebar,FloatingChat,ChatProvider}.tsx` + `components/layout/FloatingChat.tsx` + `components/home/SidebarChat.tsx` 파일 삭제. `LayoutShell`에서 ChatSidebar·FloatingChat·ChatProvider 제거.
- **[Bug 2] 채팅 fixed 플로팅 전환**: `CommunityChatWidget` — `left: 72px, bottom: 12px, w: 320px, h: 360px, z-index: 40, border-radius: 12px, box-shadow`. 헤더 더블클릭·버튼 클릭 최소화/펼치기 토글. `/chat` 바로가기 ArrowUpRight 버튼. 좌측 컬럼 `grid-rows: repeat(3, minmax(0,1fr))` 균등 3등분 + `padding-bottom: 24px`.
- **[Bug 3] 위젯 바로가기 + 사이드바 페이지**: `WidgetCard`에 `href` prop + ArrowUpRight 버튼 추가. 14개 위젯 전부 href 주입. 13개 신규 라우트 페이지 생성 (`/watchlist /movers/volume /movers/price /chart /orderbook /ticks /global /filings /calendar /net-buy /investor-flow /briefing /chat`). `VerticalNav` 아이콘 12개 → 실제 라우트 경로로 업데이트.
- **[Bug 4] TradingView iframe URL 수정**: `s.tradingview.com/widgetembed/` + `hide_side_toolbar=1&allow_symbol_change=1`. 팝업 차단 완성.

### 추가
- `components/common/WidgetDetailStub.tsx` — 위젯 상세 페이지 공통 스텁 컴포넌트 (테이블 20행)
- `app/{watchlist,movers/volume,movers/price,chart,orderbook,ticks,global,filings,calendar,net-buy,investor-flow,briefing,chat}/page.tsx` — 13개 상세 페이지 스텁

---

## [2026-04-21] 세션 #17 — Phase B 데이터 통합 (9개 위젯 실데이터 연동)

### 추가
- `app/api/home/news/route.ts` — 한국경제·매일경제·이데일리 RSS 3종 병합 (정규식 파싱, 5분 캐시)
- `app/api/home/global/route.ts` — Yahoo Finance v7: 8개 지수·환율·선물·채권 실데이터
- `app/api/kis/movers/route.ts` — KIS 등락률 순위 (`FHPST01700000`, ?dir=up|down)
- `app/api/home/investor-flow/route.ts` — KIS KOSPI(0001)/KOSDAQ(1001) 투자자별 순매수 집계
- `app/api/home/briefing/route.ts` — Yahoo Finance 미증시 4종 + DART 오늘 주요 공시

### 변경 (위젯 실데이터 교체)
- `ChartWidget` — TradingView iframe 임베드 (종목 입력·이동 가능, `key` prop으로 리렌더)
- `EconCalendarWidget` — Investing.com SSLecal2 iframe (주간 캘린더)
- `NewsFeedWidget` — `/api/home/news` 실데이터, 출처별 컬러, 링크 클릭 → 원문
- `GlobalIndicesWidget` — `/api/home/global` 실데이터, Placeholder 로딩 상태
- `VolumeTop10Widget` — `/api/kis/volume-rank` 실데이터 (기존 API 활용)
- `MoversTop10Widget` — `/api/kis/movers` 실데이터 (신규 API)
- `NetBuyTopWidget` — `/api/kis/investor-rank` 실데이터 (기존 API 활용)
- `InvestorFlowWidget` — `/api/home/investor-flow` 실데이터
- `PreMarketBriefingWidget` — `/api/home/briefing` 실데이터 (미증시 + 오늘 공시)
- `DartFilingsWidget` — `/api/dart` 실데이터, 공시 유형 자동 분류, DART 원문 링크

---

## [2026-04-20] 세션 #16 — 3-패널 워크스테이션 홈 + 14개 위젯 스텁 (Phase A)

### 추가
- `components/widgets/` 신규 디렉토리 — 14개 위젯 스텁 생성
  - WatchlistWidget, VolumeTop10Widget, MoversTop10Widget (좌측)
  - ChartWidget, OrderBookWidget, TickWidget (중앙)
  - GlobalIndicesWidget, DartFilingsWidget, EconCalendarWidget (우측)
  - NetBuyTopWidget, InvestorFlowWidget, NewsFeedWidget, PreMarketBriefingWidget (우측)
  - CommunityChatWidget (고정 하단)
- `components/home/HomeClient.tsx` — 3-패널 CSS Grid (3fr 6fr 3fr, gap 8px) 레이아웃으로 전면 재작성
- `docs/DASHBOARD_SPEC_V1.md` — 설계 원칙·14위젯 상세·데이터소스·Phase 구현 로드맵
- `docs/DATA_SOURCES_MAPPING.xlsx` 기반 — 엑셀 4개 시트에서 MVP 14위젯 데이터소스 확정

### 변경
- VerticalNav section id 유지 (section-watchlist, section-volume 등)
- CommunityChatWidget: fixed bottom-0 left-12 (48px VerticalNav 회피)

### 다음 단계 (Phase B)
1. TradingView 차트 iframe 임베드 (0.5일)
2. 경제캘린더 Investing.com iframe (0.5일)
3. 뉴스 RSS 3종 API 연동 (1.5일)
4. KIS API 시세·순위 연동 (2~3일)

---

## [2026-04-18] 세션 #15 — (L) 클릭/리드 개별 삭제 API + 어드민 UI

- **신규 API `app/api/admin/partners/clicks/[id]/route.ts`** (admin only)
  - DELETE: `partner_clicks` 개별 레코드 삭제. `requireAdmin()` 게이트 + `createAdminClient()` 로 service_role 하드 삭제. 200 `{ok:true}` / 400 invalid id / 500 DB error.
- **신규 API `app/api/admin/partners/leads/[id]/route.ts`** (admin only)
  - DELETE: `partner_leads` 개별 레코드 삭제. 동일 패턴. 파트너 FK `SET NULL` 영향 없음 (리드 자체 삭제).
- **`app/admin/partners/clicks/page.tsx`** — 최근 클릭 테이블에 "액션" 컬럼 + 🗑️ 버튼 주입. confirm 가드 + `deletingId` 상태 + rowError 배너 + 성공 시 `load()` 재조회.
- **`app/admin/partners/leads/page.tsx`** — 동일 패턴 (이름 포함 confirm 메시지) + colSpan 8→9 / rowError 배너.
- 슬롯 매핑 삭제는 (I) 에서 이미 ✕ chip 지원 → 별도 API 불필요.
- 용도: QA 데이터 정리 (`/e2e-chrome-mcp-test` 클릭, E2E 테스트 리드 2건, test-asset→chat-sidebar-bottom 매핑) + 앞으로 누적될 테스트·실수 데이터 영구 관리 수단.

## [2026-04-18] 세션 #15 — (J) 채팅 사이드바 하단 PartnerSlot 추가

- **`components/chat/ChatPanel.tsx`** — 입력 div 아래(최하단)에 `<PartnerSlot slotKey="chat-sidebar-bottom" variant="compact" className="mx-2 mb-2" />` 삽입. `import PartnerSlot from '@/components/partners/PartnerSlot';` 추가.
- ChatPanel 은 `ChatSidebar`(1400px+ aside) + `FloatingChat`(1400px- 플로팅) 양쪽에서 공유되므로 데스크톱·모바일 모두 동일 위치에서 슬롯 표출. 매핑 없으면 `PartnerSlot` 이 `null` 리턴 → 레이아웃 공간 0.
- **`app/admin/partners/page.tsx` SLOT_KEYS 확장** — `chat-sidebar-bottom` 옵션 추가 (드롭다운 8 옵션). 편집/매핑 UI 그대로 재사용.
- **Chrome MCP E2E 검증** (1920px viewport):
  1. `POST /api/admin/partners/4/slots` body `{slot_key:"chat-sidebar-bottom", position:1, is_active:true}` → 200, slot id=6 insert
  2. `/` 리로드 → ChatSidebar aside 하단에 test-asset compact 카드 렌더 확인 ("테스트 자산운용 · 글로벌 ETF 포트폴리오 + AI 로보어드바이저 서비스 →"), href 에 `utm_medium=chat-sidebar-bottom` 포함
  3. Console 에러: Supabase auth-js `AbortError: Lock broken` 3건만 (기존 known, 무관)
- 잔여 QA 매핑: test-asset(id=4) → chat-sidebar-bottom(slot id=6) 은 다음 세션 cleanup 시 정리 대상.

## [2026-04-18] 세션 #15 — (K-2) Chrome MCP E2E 5/5 PASS — (I) 편집·삭제·슬롯 재매핑 검증

- **Task #48** — 라이브 검증 전부 통과 (`qa-test-bank` id=5 기준)
  1. PATCH `/api/admin/partners/5` (4필드: name·category·description·priority) → 200 OK, 응답에 갱신된 `updated_at` 포함, 리로드 후 UI 3열 (이름·카테고리·priority) 전부 반영
  2. POST `/api/admin/partners/5/slots` (`stock-detail-bottom`, position 1) → 200, slot id=4 insert 확인
  3. 동일 slot_key 로 중복 POST → 409 `{"error":"이미 매핑된 슬롯입니다"}` (UNIQUE(slot_key, partner_id) 제약 검증)
  4. DELETE `/api/admin/partners/5/slots?slot_key=stock-detail-bottom` → 200 `{ok:true}`, 리로드 후 해당 행 슬롯 비어있음 확인
  5. DELETE `/api/admin/partners/5` → 200 `{ok:true}`, 리로드 후 목록 3행 → 2행 (test, test-asset), qa-test-bank 완전 제거. ON DELETE CASCADE (partner_slots/partner_clicks) / SET NULL (partner_leads) DB 레벨 연동 확인
- Console 에러: Supabase auth-js Navigator Locks `AbortError: Lock broken` 3건만 관찰 (기존 known, 본 작업 무관)
- 잔여 QA 데이터: `/e2e-chrome-mcp-test` 클릭 1건 + (H) E2E 테스트 lead 2건은 `test` 파트너에 귀속, 운영 데이터와 혼용되지 않음. 다음 세션에서 필요시 별도 cleanup 엔드포인트로 정리

## [2026-04-18] 세션 #15 — (I) 파트너 편집·삭제 + 슬롯 재매핑 (Phase 2 CRUD 완성)

- **신규 API `app/api/admin/partners/[id]/route.ts`** (admin only, service_role)
  - PATCH: 부분 필드 업데이트 (slug/name/category/country/description/logo_url/cta_text/cta_url/priority/is_active/features). slug 정규식 재검증, features 는 문자열/객체 모두 허용 (파싱 실패 시 400), `updated_at` 자동 갱신. 중복 slug 충돌은 23505 → 409 메시지로 변환.
  - DELETE: 파트너 하드 삭제. `partner_slots`/`partner_clicks` 는 ON DELETE CASCADE 로 자동 정리, `partner_leads` 는 ON DELETE SET NULL 로 리드 로그 보존.
  - Next 16 dynamic route 규약 준수: `{ params }: { params: Promise<{ id: string }> }` + `const { id: idStr } = await params;`
- **신규 API `app/api/admin/partners/[id]/slots/route.ts`** (admin only)
  - POST: body `{ slot_key, position?, is_active? }` — 파트너에 슬롯 매핑 추가. slot_key 정규식(`^[a-z0-9-]+$`) 검증, 파트너 존재 확인 후 insert. UNIQUE(slot_key, partner_id) 충돌(23505) → 409.
  - DELETE: query `?slot_key=xxx` 또는 `?slot_id=NNN` — 해당 매핑만 제거 (partner_id 스코프 유지).
- **`app/admin/partners/page.tsx` UI Phase 2 확장**
  - `editingId` 상태: 신규 등록 vs. 편집 모드 분기. 편집 버튼(✏️) 클릭 시 폼을 해당 파트너 필드로 채우고 스크롤 업 → PATCH 제출.
  - 삭제 버튼(🗑️) + `window.confirm` 가드 → DELETE `/api/admin/partners/{id}` → 성공 배너 + 리스트 갱신.
  - 슬롯 칩에 ✕ 버튼 추가 → confirm 후 DELETE `/api/admin/partners/{id}/slots?slot_key=xxx`.
  - 슬롯 칩 행 끝에 "+ 슬롯" 인라인 액션 → 드롭다운(SLOT_KEYS) + position 입력 → POST `/api/admin/partners/{id}/slots`.
  - 행 align-top / 신규 "액션" 컬럼(9번째) / rowActionError 별도 배너.
  - 편집 모드에서는 하단 슬롯 영역 비활성(슬롯은 테이블에서 ✕/+ 로 관리) + "편집 취소" 링크 노출.
- Partner.id 타입을 `string` → `number` (BIGSERIAL 실제 타입과 일치) 정정. Slot 타입 `partner_id: number`.
- new files: `app/api/admin/partners/[id]/route.ts`, `app/api/admin/partners/[id]/slots/route.ts`

## [2026-04-18] 세션 #15 — (K) Chrome MCP E2E 5/5 PASS — (G)(H) 검증

- **Task #46** — (G) 슬롯 확장 + (H) 트래킹·대시보드 라이브 검증 전부 통과
  1. `/admin/partners/clicks` 초기 렌더 — 필터 4종·KPI 4카드·3테이블·최근 목록 전부 표출, 데이터 없음 상태 문구 정상
  2. `POST /api/partners/clicks` — 200 OK / `{ok:true}` / Supabase insert 확인
  3. 대시보드 실데이터 반영 — 총 클릭 `1` / 총 리드 `2` / 전환율 `200.0%` (리드>클릭 히스토리) / bySlot `home-row3-left:1 click, 0 lead, 0.0%` / byPartner `test · 테스트 증권 · 1/2/200%` / byDay `2026-04-18 click 1 lead 2` / 최근 1건 `21:03:37 · test · home-row3-left · /e2e-chrome-mcp-test`
  4. `/screener` 하단 PartnerSlot — `screener-bottom` 슬롯 매핑 없음 → API `{partners:[]}` → null 렌더, 에러 0
  5. `/stocks/005930` 하단 PartnerSlot — `stock-detail-bottom` 슬롯 매핑 없음 → null 렌더, 페이지 "삼성전자" 헤더 정상
- Console 에러: Supabase auth-js 라이브러리 내부 Navigator Locks `AbortError: Lock broken ... 'steal' option` 2건만 관찰 — 기존 known 경고, 본 작업과 무관
- 잔여 QA 데이터: `partner_clicks` 1건 (source_page `/e2e-chrome-mcp-test`) 유지 — 편집/삭제 API Phase 2에서 정리 가능

## [2026-04-18] 세션 #15 — (H) UTM/클릭 대시보드 + PartnerSlot 클릭 트래킹

- **(H1) PartnerSlot 클릭 트래킹 주입** — `components/partners/PartnerSlot.tsx`
  - `trackClick()` 헬퍼: `navigator.sendBeacon` 우선, 실패 시 `fetch({ keepalive: true })` 폴백
  - payload: `{ slug, slotKey, sourcePage: window.location.pathname }` → `POST /api/partners/clicks`
  - card / compact 두 variant `<Link onClick={trackClick}>` 로 바인딩
  - 트래킹 실패는 try/catch 로 완전 흡수 → 네비게이션 중단 없음
- **(H2) 신규 API `app/api/admin/partners/clicks/route.ts`** (admin only, service_role)
  - GET 필터: `partner_slug` / `slot_key` / `from` / `to` (YYYY-MM-DD)
  - 집계 4종: `bySlot` (slot_key별 클릭·리드·전환율) / `byPartner` (파트너별) / `byDay` (KST 일자별) / `recent` (최근 100건 raw)
  - 리드 연결: 동일 기간 `partner_leads` 조회 → `partner_id` 매칭하여 전환율 계산 (클릭 → 리드)
  - slot별 전환율은 `utm_medium` 이 `slot_key` 와 일치할 때만 계상 (PartnerSlot 생성 URL 규칙 준수)
- **(H2) 신규 페이지 `app/admin/partners/clicks/page.tsx`** (`AuthGuard minPlan='admin'`)
  - KPI 4카드: 총 클릭 / 총 리드 / 전체 전환율 / 활성 슬롯
  - 테이블 2종 (2-col grid): 슬롯별 / 파트너별 집계 (클릭·리드·전환율)
  - 일자별 추이 카드: ASCII bar (민트=클릭 / 오렌지=리드, maxDayCount 비례)
  - 최근 클릭 목록 100건 (clicked_at KST · 파트너 2줄 · 슬롯 · source_page truncate)
  - 필터 4종: 파트너 드롭다운 · 슬롯 키 직접 입력 · 시작/종료일 (기본 -30일 ~ 오늘)
- **헤더 네비게이션 교차 링크**:
  - `/admin/partners` → "클릭 대시보드" 버튼 (MousePointerClick 아이콘)
  - `/admin/partners/leads` → "클릭 대시보드" 버튼
  - `/admin/partners/clicks` → "리드 대시보드" 버튼
- new files: `app/api/admin/partners/clicks/route.ts`, `app/admin/partners/clicks/page.tsx`

## [2026-04-18] 세션 #15 — (G) 슬롯 키 확장 (stock-detail-bottom / screener-bottom)

- **전략 결정**: `/stocks/[symbol]` + `/screener` 모두 사이드바 레이아웃 없음 → 리팩토링 최소화 위해 **하단 풀폭 슬롯** 패턴 채택. 기존 `stock-detail-sidebar` / `toolbox-sidebar` 키는 보존 (DB 데이터 호환).
- **`app/admin/partners/page.tsx` SLOT_KEYS 확장** — `stock-detail-bottom` / `screener-bottom` 2개 추가 (드롭다운 7 옵션).
- **`app/stocks/[symbol]/page.tsx`** — `<StockDetailTabs/>` 아래에 `<PartnerSlot slotKey="stock-detail-bottom" variant="card" />` 주입 (max-w-[1400px] 래퍼).
- **`components/screener/ScreenerClient.tsx`** — 페이지네이션 아래에 `<PartnerSlot slotKey="screener-bottom" variant="card" />` 주입 (mt-8).
- 슬롯 미활성(파트너 미지정) 시 `PartnerSlot` 가 null 리턴 → 그레이스풀 빈 상태. 어드민에서 slot_key 매핑 추가 즉시 해당 위치에 카드 렌더.

## [2026-04-18] 세션 #15 — (F) /admin/partners/leads 리드 대시보드 + CSV Export

- **신규 API `app/api/admin/partners/leads/route.ts`** (admin only, service_role)
  - GET 필터: `partner_slug`, `from`, `to` (YYYY-MM-DD), `q` (이름·이메일·전화·문의 본문 ilike OR 검색), `limit`/`offset`, `format` (json|csv)
  - CSV 모드: UTF-8 BOM(`\ufeff`) 프리픽스 + 헤더 12열 (created_at·partner_slug·partner_name·name·email·phone·message·source_slug·utm_source·utm_medium·utm_campaign·consent_marketing), Content-Disposition: attachment
  - 파트너 조인: FK select 대신 `partner_id` in-clause 로 별도 조회 후 메모리에서 병합 (RLS 우회)
- **신규 페이지 `app/admin/partners/leads/page.tsx`** (`AuthGuard minPlan='admin'`)
  - 헤더: ← 파트너 관리 링크 + "리드 대시보드" + CSV 다운로드 버튼 (anchor href 로 직접 다운로드 트리거)
  - 필터 4종: 파트너 드롭다운(기본 전체) · 시작일(기본 -30일) · 종료일(오늘) · 검색박스(Enter 즉시 조회)
  - KPI 카드 4개: 총 리드 / 이메일 보유 / 전화 보유 / 마케팅 동의 — 분자/분모 포맷
  - UTM TOP 5 바(badge): utm_medium 별 유입 랭킹 (슬롯별 CTR 기반 평가에 직결)
  - 리스트 테이블: created_at (KST) · 파트너(이름+slug 2줄) · 이름 · 이메일 · 전화 · 문의(truncate+title) · UTM pill · 동의 ✓/-
- **`app/admin/partners/page.tsx` 헤더에 "리드 대시보드" 링크 추가** (ListOrdered 아이콘)
- new files: `app/api/admin/partners/leads/route.ts`, `app/admin/partners/leads/page.tsx`

## [2026-04-18] 세션 #15 — (E) /admin/partners Chrome MCP E2E 5/5 PASS

- **Task #42**: 비-admin 계정으로 1차 검증 → 2중 차단 정상 확인
  - UI: "접근 권한 없음 · 이 페이지는 관리자만 접근할 수 있습니다" AuthGuard 차단
  - API: `GET /api/admin/partners` → `403 {"error":"관리자 권한 필요"}`
- `scripts/sql-exec.py` 로 soulmaten7@gmail.com → `role='admin'` 승격 (users.id `a7db2d46-bcfb-4a1a-8ff4-14eb3c59fc87`)
- 재검증 5/5 PASS:
  1. 페이지 렌더 — 헤더 "파트너 관리" + 부제 + 새로고침/파트너 추가 버튼
  2. 리스트 2건 표출 — `test` (증권사 / 100 / home-row3-left#1 + toolbox-category-exchange#1) · `test-asset` (자산운용 / 90 / home-sidebar-bottom#1)
  3. 폼 접힘/펼침 동작
  4. POST 성공 — slug=`qa-test-bank`, name="QA 테스트 은행", 카테고리/슬롯 없이 최소 필드로 추가 → 성공 배너 "파트너 'QA 테스트 은행' 생성 완료" + 리스트에 3번째 row 즉시 반영 (priority 기본 50, 활성 ✓)
  5. 슬롯 칩 렌더링 — `home-row3-left#1` / `toolbox-category-exchange#1` / `home-sidebar-bottom#1` 3종 정상 표시

## [2026-04-18] 세션 #15 — (E) /admin/partners 최소 CRUD (Phase 1)

- **신규 관리자 페이지 `app/admin/partners/page.tsx`** — AuthGuard `minPlan='admin'` 로 게이트
  - 상단: "파트너 관리" 헤더 + 새로고침 / 파트너 추가 버튼
  - 폼 접힘/펼침 — 폼 필드 11종 (slug·name·category·country·description·logo_url·cta_text·cta_url·priority·is_active·features JSON) + 선택적 슬롯 매핑 2필드 (slot_key 드롭다운 · slot_position)
  - 슬롯 드롭다운 옵션: `home-row3-left` / `home-sidebar-bottom` / `toolbox-sidebar` / `stock-detail-sidebar` / — 선택 안 함 —
  - 리스트 테이블 — slug · 이름 · 카테고리 · 국가 · priority · 활성 뱃지 · 연결 슬롯 칩(들) · `/partner/[slug]` 바로가기
  - 성공/에러 피드백 박스 (CheckCircle2 / AlertCircle)
- **신규 API `app/api/admin/partners/route.ts`** (service_role)
  - `requireAdmin()` 헬퍼 — 서버 세션 사용자 조회 → `users.role === 'admin'` 확인 → 401/403 반환
  - GET: `partners` 전체 + `partner_slots` 조인해 슬롯 매핑 병합 (priority desc, created_at desc)
  - POST: slug 정규식 검증 (`^[a-z0-9-]+$`), features JSON 파싱·배열 검증, country 기본 'KR', cta_text 기본 '자세히 보기', 중복 slug `23505` 에러 사용자 친화 메시지, 선택적 슬롯 매핑 실패 시 `slot_warning` 으로 경고만 (파트너는 유지)
- **`app/admin/page.tsx` 대시보드** — "바로가기" 카드 섹션 추가 → `/admin/partners` 딥링크 (Handshake 아이콘)
- **Phase 1 scope**: 추가(Create)만. 편집·삭제·슬롯 재매핑은 Phase 2 (급한 경우 Supabase SQL Editor 로 처리)
- new files: `app/api/admin/partners/route.ts`, `app/admin/partners/page.tsx`

## [2026-04-18] 세션 #15 — (D) 홈 Row3 우측 하단 PartnerSlot placeholder 교체 (commit becb74c)

- **`supabase/migrations/011_partner_seed_2.sql`** — 두 번째 테스트 파트너 시드
  - `test-asset` = 테스트 자산운용, 자산운용 카테고리, features 3종 (연 보수 0.2% / AI 리밸런싱 / 최소 10만원)
  - 주황 로고 (`FF9500`) "TEST+Asset", CTA "포트폴리오 상담 신청", priority 90
  - `partner_slots` 매핑: `home-sidebar-bottom` → `test-asset` (position 1)
- **`components/home/HomeClient.tsx`** — 회색 "PARTNER SLOT (W4)" placeholder div 제거 → `<PartnerSlot slotKey="home-sidebar-bottom" variant="card" />` 렌더링
- **Chrome MCP 검증 PASS** — 우측 사이드바에 두 카드 세로 스택 (test 증권 민트 / test-asset 주황), 회색 박스 완전 사라짐, 콘솔 Fast Refresh [LOG] 13건·에러 0건
- **DB 컬럼 이름 픽스** — `partner_slots.priority` 는 존재하지 않음 → 실제 컬럼명 `position` 으로 자동 수정

## [2026-04-18] 세션 #15 — W5 더미 데이터 제거 1차 (ComingSoonCard + 4개 위젯)

- **공통 스켈레톤 `components/common/ComingSoonCard.tsx` 신설** — 제목·아이콘·설명·eta 뱃지 props, `bg-[#F5F7FA]` + 점선 border + 민트 eta 뱃지
- **4개 홈 위젯 더미 제거 → ComingSoonCard 교체** (commit b8f007d / 6 files / +287 -97)
  - `ProgramTrading.tsx` — arb 215 / nonArb -108 하드코딩 제거 → "KRX 크롤링 연동 후 공개"
  - `GlobalFutures.tsx` — S&P/NASDAQ/WTI/금 4건 하드코딩 제거 → "외부 선물 API 연결 후"
  - `WarningStocks.tsx` — 테스트A/B/C 3건 하드코딩 제거 → "KRX 데이터 연결 후"
  - `IpoSchedule.tsx` — 테크바이오/그린에너지/AI로보틱스 3건 하드코딩 제거 → "공시 파이프라인 연결 후"
- **Chrome MCP 검증 5/5 PASS**
  - 더미 잔존물 0건 (`(주)테스트`·`테크바이오`·`차익거래`·`비차익거래` 등 모두 사라짐)
  - "데이터 준비 중" 박스 정확히 4개
  - 300px 그리드 높이 유지
  - Console: Supabase auth-js `AbortError: Lock broken` 1건 (SDK 경합, W5 무관)
- **ScreenerClient 는 손대지 않음** — 이미 `/api/stocks/screener` 연결 (W2~)
- **Task #38 EarningsCalendar / #39 EconomicCalendar → Phase 2 이관 결정**
  - DART는 "발표 예정" API 미제공, ECOS는 "과거 지표" API — 둘 다 실데이터 연결이 간단하지 않음
  - W4 파트너 리드 유입 검증이 우선 — 방문자 1,000명 or 리드 10건 이상 확보 시 재검토
- new files: `components/common/ComingSoonCard.tsx`, `docs/COMMANDS_V3_W5_DUMMY_REMOVAL.md`

## [2026-04-18] 세션 #14 — W4 Partner-Agnostic Landing + E2E 검증

- **W4 Partner-Agnostic Lead Gen 인프라 1차 출시** (Claude Code 실행, commit 91eea5a — 11 files / +1322 insertions)
  - DB: `supabase/migrations/010_partners.sql` — 4 테이블 (`partners`, `partner_slots`, `partner_leads`, `partner_clicks`) + RLS (SELECT 공개 / INSERT leads·clicks 익명 허용 / 쓰기 service_role 만)
  - 테스트 시드 1건 (`slug='test'`, `테스트 증권`, features 3종 JSONB) + 슬롯 2개 바인딩 (`home-row3-left`, `toolbox-category-exchange`)
  - API 4종: `/api/partners/[slug]` (GET 단건) · `/api/partners/slots?key=…` (GET 슬롯+파트너 조인) · `/api/partners/leads` (POST 이름·연락처·동의 검증, IP SHA256 해시) · `/api/partners/clicks` (POST fire-and-forget 추적)
  - 페이지: `app/partner/[slug]/page.tsx` (Server) → `components/partners/PartnerLandingClient.tsx` (Client) — Hero + Features 3카드 + 리드 폼 (이름 필수 ≤80 / 이메일·전화 중 1 필수 / 문의 ≤1000 / consent) + 성공 박스 전환
  - 슬롯 컴포넌트: `components/partners/PartnerSlot.tsx` — card/compact 두 가지 variant, `/partner/${slug}?utm_source=slot&utm_medium=${slotKey}` 링크 생성 (부모 'use client' 때문에 Server → Client 전환)
  - 기존 placeholder 일부 교체: `components/home/HomeClient.tsx` (Row3 좌측) + `components/toolbox/CategorySection.tsx` (`slug==='exchange'` 섹션 헤더 하단)
- **W4 Chrome MCP E2E 검증 8/8 PASS** (Task #36)
  - `/partner/test` Hero + Features + 폼 렌더링 / 폼 제출 → "신청 완료" 박스 전환 / 리드 1건 삽입
  - 홈 Row3 좌측 card variant 렌더링 + 클릭 → `utm_medium=home-row3-left`
  - `/toolbox` 거래소·증권사 섹션 compact variant 렌더링 + 클릭 → `utm_medium=toolbox-category-exchange`
  - `/api/partners/slots?key=toolbox-category-exchange` JSON 실시간 응답 (partner 1건)
  - Console errors: Supabase auth-js `AbortError: Lock broken` 1건 — SDK 내부 탭 간 lock 경합 (무해, W4 무관)
- **W4 MVP 범위 밖 (Phase 2 보류)**
  - `/admin/partners` CRUD UI (현재는 SQL 시드로 추가, 추후 관리자 패널 필요)
  - 리드 대시보드 (열람/상태관리/Export)
  - 슬롯 키 추가 확장 (종목 상세 탭 내 슬롯, 채팅 사이드바 슬롯 등)
  - Utm 상세 로그·대시보드 (현재는 `partner_clicks` 테이블에 row 적재만 됨)

## [2026-04-18] 세션 #13 — Google OAuth + Chat API 하네스 + Chat UX + W2.5/W2.6/W3 실데이터

- **Supabase Google OAuth 실제 활성화 (기획 → 완료)**
  - Google Cloud 신규 프로젝트 `Terminal` + OAuth 2.0 Client ID 발급 (soulmaten7-org)
  - Redirect URI 등록: `https://qxkmwlkchyxfzxbonhtj.supabase.co/auth/v1/callback` + `http://localhost:3333/auth/callback`
  - `scripts/auth-config.py` (신규) — PAT Management API `/config/auth` GET/PATCH 래퍼
  - PATCH 완료: `external_google_enabled=true` / `client_id` / `secret` / `site_url=http://localhost:3333` / `uri_allow_list=http://localhost:3333/**`
  - Chrome MCP 검증: 로그인 버튼 → accounts.google.com 정상 리다이렉트 (client_id 일치)
- **public.users RLS INSERT 정책 누락 — 긴급 패치**
  - 증상: Google 로그인 후 세션은 생성되지만 `/auth/callback` 의 users insert 가 **조용히 차단** → AuthProvider 가 행 조회 실패 (406) → UI 는 로그아웃 상태로 보임
  - 원인: RLS 정책이 SELECT/UPDATE 만 있고 INSERT 정책 부재 (기본 deny)
  - 수정: `CREATE POLICY "Users can insert own profile" FOR INSERT WITH CHECK (auth.uid() = id)`
  - 백필: 유령 auth.users `a7db2d46-…` (soulmaten7@gmail.com) public.users 행 생성 → 기존 세션 즉시 활성화
- **/auth/callback 진단 로그 강화** (commit 60fce18)
  - `error/error_description` 파라미터 캡처, `exchangeCodeForSession` 실패 상세 로그, `users insert` 실패 로그 분리
- **Task #26 Chat API 하네스 점검 6/6 통과** (Chrome MCP E2E)
  - 401 (로그인 필요) / 400 (빈문자·공백·금지어·500자 초과) / 200 (500자 경계) / 200 (태그 추출: 한글명→symbol / 6자리 직접 / 미매칭 `[]`) / 429 (분당 5개 초과)
  - `trim()` 방어 로직 현장 검증 (공백만 메시지 차단, commit 6091053 이미 반영)
  - 하네스 메시지 5건 `hidden=true` 처리하여 채팅창 오염 방지
- **Next.js 16 Turbopack 캐시 손상 복구 절차 정립**
  - 증상: dev 서버가 /api/* 전부 pending/500 응답, ChunkLoadError 발생
  - 처방: `rm -rf .next node_modules/.cache` + `lsof -ti :3333 | xargs kill -9` + `npm run dev` 재시작
- 쿠키 정리 Mac 가이드: DevTools Application → Cookies → 수동 삭제 (HttpOnly 쿠키는 JS 로 삭제 불가)
- new files: `scripts/auth-config.py`
- DB 변경: `CREATE POLICY` 1건 (users INSERT) + public.users 1건 백필 (Management API 로 반영)
- **Task #27 Chat UX/렌더링 디테일 점검 완료** (`components/chat/ChatPanel.tsx`)
  - 글자수 카운터 추가 — `{input.length}/500` 하단 표시, 450+ 주황, 490+ 빨강 볼드
  - 에러 UX 강화 — 아이콘(⚠) + 빨강 배경/테두리 박스 + 5초 유지 (기존 3초)
  - 429 rate-limit 전용 메시지 — "분당 메시지 한도를 초과했습니다. 잠시 후 다시 시도하세요."
  - 네트워크 오류 카피 개선 — "네트워크 오류 — 연결 상태를 확인하세요"
  - 전송 후 input 포커스 유지 (inputRef) — 연속 메시지 작성 개선
  - $태그 렌더링에 pill 배경 추가 (`bg-[#0ABAB5]/10` + hover 효과) — 가독성·클릭 영역 확대
- **W2.5 비교 탭 실데이터 연동** (`/api/stocks/compare` + `CompareTab.tsx`)
  - 신규 엔드포인트: 2~5개 symbol → stocks + financials + 최근 6개월 stock_prices 통합 반환
  - CompareTab 재작성: 심볼 칩 + 검색 드롭다운 (max 5) / KPI 테이블 (현재가·6M수익률·시총·PER·PBR·ROE·EPS·BPS) / 정규화 라인차트 (시작일=100)
  - 공통 거래일 교집합으로 차트 정렬 (결측일 대응)
- **W2.6 뉴스·공시 탭 실데이터 연동** (신규 2 엔드포인트 + 2 탭 교체)
  - `/api/stocks/disclosures` — DART list.json 라이브 조회 (corp_code → `dart_corp_codes` DB lookup)
  - `/api/stocks/news` — Google News RSS 라이브 조회 (User-Agent 지정, CDATA/HTML 정리)
  - DisclosuresTab 재작성: 기간 선택 (1/3/6/12개월) + 공시 유형 10종 분류 필터 + 원본 DART 링크
  - NewsTab 재작성: timeAgo 렌더 + 출처·시간 표시, `stockId` 대신 `symbol` 사용
  - NewsDisclosureTab: 두 탭에 symbol 프로퍼티 전달로 통합
- **W3 투자자 도구함 강화** (`/app/toolbox/page.tsx` + `ToolboxClient.tsx`)
  - 국가(KR/US/…) 필터 추가 — `availableCountries` 동적 구성, 1국가뿐이면 필터 숨김
  - 표시 건수 카운터 추가 (전체 N개 · 표시 M개)
  - 기존 기능 유지: 검색 / 카테고리 접기 / 즐겨찾기 / 클릭 추적 / Partner Slot 자리
- new endpoints: `/api/stocks/compare`, `/api/stocks/disclosures`, `/api/stocks/news`
- 데이터 흐름 변화: 뉴스·공시는 DB 시딩 없이 라이브 API 의존 → `news` / `disclosures` 테이블은 향후 캐싱 용도로 보류

## [2026-04-18] 세션 #12 — W2.3 보강 + W2.4 실적 탭 실데이터

- W2.3 보강: DART corp_codes 3,959건 시딩 + ROE 계산식(EPS/BPS×100) 추가
- /api/dart/company 삼성전자 기업개황 정상 반환
- ROE 10.26% 개요 탭 표시 (KPI 7/7 완성, 배당수익률만 추후 DART 배당 API 연동 시 보강)
- W2.4 실적 탭: lib/dart-financial.ts + /api/stocks/earnings + EarningsTab 차트 교체
- DART fnlttSinglAcntAll.json 연결재무제표 파싱 (매출/영업이익/순이익/마진)
- 연간 4건 (2022~2025) + 분기 12건 (8분기 이상 확보)
- 차트: 연간 grouped bar + 분기 line + 마진 line + 상세 테이블
- Management API SQL executor 구축 (scripts/sql-exec.py) — 앞으로 모든 DDL 자동화
- Chrome MCP 검증: 개요 KPI 8/8 실데이터, 실적탭 SVG 14개 + 테이블 정상
- commits: 5c6434e (W2.3 보강), d9102da (W2.4), 88b2add (sql-exec)

## [2026-04-18] 세션 #11 — W2.3 재무·가격 DB 시딩

- financials 191건 upsert (KIS API, TOP 200 + 005930)
- stock_prices 52,969건 upsert (FDR DataReader, 200종목 × ~265일, 실패 0)
- supabase/migrations/007_stock_prices.sql 신규 (테이블 + 3 인덱스 + RLS + 2 POLICY)
- Supabase Studio 에서 직접 실행 (direct connection IPv4 미지원, pooler region 이슈로 우회)
- Chrome MCP 검증: /stocks/005930?tab=overview → PER 32.91 / PBR 3.38 / EPS 6,564 / BPS 63,997 / 52주 53,700~223,000 KRW 전부 실데이터
- 미완: ROE (KIS 미제공, W2.4에서 계산식 추가), 배당수익률 (DART corp_codes 시딩 필요)
- commit: 31f443f

## 세션 #10 — 2026-04-18 (W2.1 종목 상세 8탭 재구축 + 라이트 테마 + URL 탭 상태 + AuthGuard 제거)

### 구조 변경
- **`app/stocks/[symbol]/page.tsx` 전면 재작성**: 다크 테마 10탭 + AuthGuard 래핑 → 라이트 테마 8탭 + 비로그인 접근 허용
- **Server/Client 역할 분리**: `StockHeader.tsx` / `StockDetailTabs.tsx` / `WatchlistToggle.tsx` 로 컴포넌트 분리
- **URL `?tab=` 기반 탭 상태**: 기존 `useState` → `useSearchParams`, 뒤로가기/앞으로가기 지원

### V3 표준 8탭 (왼쪽부터)
- 개요 / 차트 / 호가 / 재무 / 실적 / 뉴스·공시 / 수급 / 비교

### 신규 컴포넌트
- `lib/constants/stock-tabs.ts` — 탭 키 상수 + 타입
- `components/stocks/StockHeader.tsx`, `StockDetailTabs.tsx`, `WatchlistToggle.tsx`
- `components/stocks/tabs/OverviewTab.tsx` (KPI 8개 placeholder + 기업개황 placeholder)
- `components/stocks/tabs/OrderbookTab.tsx` (OrderBook + ExecutionList 2분할, 미국은 안내문)
- `components/stocks/tabs/EarningsTab.tsx` (placeholder, W2.3)
- `components/stocks/tabs/NewsDisclosureTab.tsx` (뉴스/공시 서브탭 통합)
- `components/stocks/tabs/CompareTab.tsx` (placeholder, W2.3)

### 라이트 테마 일괄 치환 (총 7개 파일)
- 기존 유지 탭 5개: `ChartTab`, `FinancialsTab`, `NewsTab`, `DisclosuresTab`, `SupplyDemandTab`
- 공용 컴포넌트 2개: `OrderBook`, `ExecutionList`
- 매핑: `bg-dark-* → bg-white/F5F7FA`, `border-border → border-[#E5E7EB]`, `text-text-* → text-black/666666`, `text-up → [#FF3B30]`, `text-down → [#007AFF]`, `text-accent → [#0ABAB5]`

### 보존된 파일 (V3 범위 외, 라우팅만 제외)
- `ShortSellingTab`, `InsiderTab`, `DividendTab`, `SectorTab`, `MacroTab` — 파일 보존 (추후 개요/재무 서브섹션 활용 가능)

### 검증 (Chrome MCP)
- 8탭 순서 정확 ✅
- `darkResidueCount: 0` (bg-dark/text-text/border-border 전부 제거) ✅
- body 배경 `rgb(255, 255, 255)` ✅
- AuthGuard 차단 없음 (비로그인 접근 가능) ✅
- URL `?tab=chart/orderbook/financials/earnings/news/flow/compare` 모두 전환 정상 ✅
- 삼성전자 헤더 / AAPL 헤더 정상 ✅
- 미국 종목 (AAPL) 호가 탭 안내문 "미국 주식은 호가 데이터를 제공하지 않습니다" ✅

### git
- 21 files changed, 1,135 insertions(+), 256 deletions(-)
- 커밋 `267e83b` → push 완료

---

## 세션 #9 — 2026-04-18 (홈 Bento Grid 재구축 + Light Theme 전환 + 블룸버그 T자형 레이아웃)

### W1.5 — Header/TickerBar 슬림화 + HomeClient Bento Grid 초안
- **`components/layout/Header.tsx`** 전면 교체: 191px 2단 구조 → 단일 73px, 네비 6개 → 3개 (홈/스크리너/도구함), 민트 리본 제거
- **`components/layout/TickerBar.tsx`**: `colorTheme: 'dark' → 'light'`, `bg-[#0D1117] h-12 → bg-white h-10`
- **`components/home/HomeClient.tsx`**: flex 3단 구조 → `grid-cols-2` 5행 Bento 초안
- **`components/home/WidgetCard.tsx`** 신규: 모든 위젯 공통 래퍼 (bg-white + border-[#E5E7EB])

### W1.6 — 5개 위젯 다크→라이트 전환 + C안 T자형 레이아웃 적용
- **색상 매핑**: `bg-[#0D1117]` 제거, `bg-[#161B22] → bg-[#F5F7FA]`, `border-[#2D3748] → border-[#E5E7EB]`, `text-white → text-black`, 부가 텍스트 `text-[#666666]`
- **대상 위젯**: VolumeSpike, MarketMiniCharts, ProgramTrading, GlobalFutures, WarningStocks
- **MarketMiniCharts**: TradingView `colorTheme: 'light'` + `isTransparent: true` 전환
- **HomeClient.tsx C안 레이아웃** (블룸버그 T자형):
  - Row 3~5: 속보피드 `gridRow: span 3` (924px tall) | 경제지표/IPO/실적발표 세로 스택 (각 300px)
  - Row 6: 프로그램매매 / 글로벌선물 / 투자경고 각 `col-span-2` 균등 3등분

### 검증 (Chrome MCP)
- 다크 잔재 (`bg-[#0D1117]` / `bg-[#161B22]`) 카운트: **0** ✅
- 속보피드 실측: y=853, **height=924px** (row-span-3 작동)
- 경제/IPO/실적 x=997 정렬, 각 300px 세로 스택 확인
- Row 6 3등분 y=1789 정렬 확인
- 페이지 높이 2,579px, 첫 화면 위젯 8개

### git
- W1.5 + W1.6 통합 푸시: 17 files changed (main 브랜치)

---

## 세션 #8 — 2026-04-18 (V3 제품 스펙 전면 개정 + 전략 방향 확정)

### 전략 결정 (대화를 통한 합의)
- **포지셔닝 재정의**: "전업투자자 = 일반인 (일반투자자가 되고싶은 상위 1%)" → Aspirational Design 적용
- **UI 철학**: Bloomberg/Koyfin 표준의 Bento Grid + 단일 지속 채팅 + 투자자 도구함 (Link Hub)
- **개발 우선순위**: PC-First → 모듈식 컴포넌트 설계 → 이후 태블릿/모바일 반응형 전환
- **채팅 원칙**: 종목별 분산 X, **전체 단일 채팅** + `$종목` 자동 태그 + 필터 + 인기 종목 뱃지 (Density Over Distribution)
- **데이터 소스**: 100% 무료 소스(DART/KRX/KIS/FDR/Naver/ECOS)로 전업투자자 데이터의 95% 커버 가능 — 이미 KIS 서버사이드 연동 완료로 비로그인 이용자도 실시간 데이터 열람 가능
- **수익화 전략 단일 모델** (구독/결제 전면 폐기):
  - Phase 1 (즉시): **광고주 독립적(Partner-Agnostic) 랜딩페이지 인프라** + Lead Gen (DB 장사, 한국 리드 5~10만원/건)
  - Phase 2 (5~12주): 트래픽 확보 + 리드 퀄리티 스코어 + 파트너 슬롯 확장 (여전히 무료 플랫폼)
  - Phase 3 (12개월+): 글로벌 시장 확장 + 광고 인벤토리 세분화 — **구독/결제 시스템 일절 없음**
- **전 Phase 공통 원칙**: 플랫폼은 100% 무료 놀이터, 수익은 오직 랜딩 리드에서
- **제외 항목**: Pro 구독, 토스페이먼츠/Paddle 결제 연동, AI 종목 분석 리포트, CSV 다운로드, À la carte 프리미엄 — **전부 범위 제외**
- **레거시 제거 예정**: `components/home/AdColumn.tsx` (인증/일반 배너 20일 5만/3만원 모델) — W4 이전에 `HomeClient.tsx` 에서 렌더 제거

### 신규 문서
- **`docs/PRODUCT_SPEC_V3.md`** — 11개 섹션 제품 스펙 (V2 Home Redesign Spec을 대체, 전체 제품 범위로 확장)

### 다음 단계 (Phase 1 실행)
1. Persistent Chat (root `layout.tsx` 배치)
2. 종목 상세 8개 탭 (개요/차트/호가/재무/실적/뉴스공시/수급/비교)
3. 투자자 도구함 페이지 (10 카테고리 × 5+ 링크)
4. 광고주 독립적 랜딩페이지 템플릿 (`/partner/[slug]`)

### 검증
- 문서 작성 세션 — 코드 변경 없음

---

## 세션 #7 — 2026-04-17 (stocks + link_hub DB 시딩)

### 신규
- **`scripts/seed-stocks.py`** (155 lines) — KOSPI+KOSDAQ 종목 + link_hub 링크 시딩 스크립트

### 데이터
- **stocks 테이블 시딩**: KOSPI 949건 + KOSDAQ 1,821건 = 총 **2,780건** upsert 완료
- **link_hub 테이블 시딩**: 기존 더미 데이터 삭제 후 KR/US **56건** 재삽입 완료

### 라이브러리 전환
- **pykrx → FinanceDataReader(FDR)**:
  - pykrx가 KRX API 세션 인증 요구(`LOGOUT 400`)로 차단됨
  - FDR로 교체하여 정상 동작 확인
  - 앞으로 KRX 관련 데이터 작업(공매도, 수급, 프로그램매매 등)은 FDR 기준으로 통일
- **의존성 추가** (Python 런타임): `FinanceDataReader`, `supabase`, `python-dotenv`

### 검증
- `npm run build` — 에러 없음 ✅

### git
- `21fafe3` — `scripts/seed-stocks.py` 커밋

---

## 세션 #6 — 2026-04-17 (Rate limit 복구 + /admin AuthGuard + Cowork/Claude Code 모델 분리 규칙)

### 수정

#### `.env.local` — KIS API Rate Limit 복구
- **배경**: 한투 실전계좌 첫 3영업일 제한(1건/초)이 4/15에 종료됨 → 기존 400ms 유지 중이라 복구 필요
- **수정**: `KIS_RATE_LIMIT_MS=400` → `KIS_RATE_LIMIT_MS=60` (20건/초)

#### `components/home/WatchlistLive.tsx` — 관심종목 폴링 복구
- **수정**: `setInterval(fetchPrices, 15000)` → `setInterval(fetchPrices, 10000)` (15초 → 10초)
- 상단 주석도 3영업일 경과 기준으로 갱신 (10종목 × 60ms = 0.6초 → 10초 폴링)

#### `components/auth/AuthGuard.tsx` — `'admin'` minPlan 지원 추가 (보안 이슈)
- **배경**: 기존 AuthGuard는 `'free'|'premium'|'pro'`만 지원 → /admin 전용 게이트 불가
- **수정**:
  - `type MinPlan = 'free' | 'premium' | 'pro' | 'admin'` 추가
  - **`admin` 게이트는 DEV_BYPASS=true 여도 반드시 role 체크** (보안 우선)
  - admin 차단 시 PaywallModal 대신 "접근 권한 없음" 전용 화면 표시

#### `app/admin/page.tsx` — AuthGuard 래핑 (비로그인 접근 차단)
- **배경**: `/admin` 페이지가 AuthGuard 없이 노출되어 비로그인자도 진입 가능 (보안 이슈)
- **수정**:
  - 상단에 `import AuthGuard from '@/components/auth/AuthGuard'` 추가
  - 반환 JSX 전체를 `<AuthGuard minPlan="admin">...</AuthGuard>`로 감싸기

#### `CLAUDE.md` — Claude Code 모델 선택 규칙 섹션 신설
- **배경**: Cowork(설계)=Opus, Claude Code(실행)=Sonnet 역할 분담을 명문화할 필요
- **수정**: "역할 분담" 섹션 아래 "Claude Code 모델 선택 규칙" 신설
  - 기본값: Sonnet (`claude --dangerously-skip-permissions --model sonnet`)
  - Opus 필요 조건 4가지 명시 (원인 불명 에러 / 대규모 리팩토링 / 복잡 알고리즘 / 레거시 해독)
  - 표기 규칙: Cowork이 명령어에 **🔴 Opus 권장** 배지를 붙인 경우만 Opus 실행

### 검증
- `npm run build` — 에러 없음 ✅
- 4개 파일 변경 확인 (.env.local, WatchlistLive, AuthGuard, admin page)

---

## 세션 #5 — 2026-04-17 (AuthGuard DEV_BYPASS + Turbopack 서버 안정화 + 문서 전체 업데이트)

### 수정

#### `components/auth/AuthGuard.tsx` — DEV_BYPASS 추가
- **배경**: 세션 #4에서 13개 페이지 테스트 시 종목상세·분석 페이지가 paywall에 막혀 UI 확인 불가
- **수정**: `DEV_BYPASS = true` 플래그 추가 → 모든 기능 잠금 해제 (개발 모드 전용)
- **주의**: 프로덕션 배포 전 반드시 `DEV_BYPASS = false` 또는 해당 줄 삭제 필요
```typescript
const DEV_BYPASS = true;  // TODO: 배포 전 삭제
function canAccess(role, minPlan): boolean {
  if (DEV_BYPASS) return true;
  // ... 기존 role 체크 로직
}
```

#### `next.config.ts` — distDir 시도 후 원복
- **배경**: Turbopack이 FUSE mount 위에서 embedded DB(RocksDB) lock 파일 생성 시도 → "Operation not permitted (os error 1)" 크래시
- **시도**: `distDir: '/tmp/nextjs-dist'` 및 절대 경로로 캐시 디렉토리 이동 시도
- **결과**: Next.js 내부에서 `path.join(projectRoot, distDir)` 사용 → 절대 경로가 프로젝트 내부 상대 경로로 해석돼 효과 없음
- **최종**: `next.config.ts` 원복 (distDir 제거), `.fuse_hidden` 파일 삭제로 근본 원인 해결

### 해결된 이슈

#### Turbopack "Failed to open database" 크래시 해결
- **원인**: FUSE-mounted Mac 폴더에서 Turbopack 증분 캐시 DB(RocksDB) 파일 lock 불가
- **증상**: `[Error: Failed to open database - Loading persistence directory failed - Operation not permitted (os error 1)]`
- **해결**: `mcp__cowork__allow_cowork_file_delete`로 `.fuse_hidden*` 파일 7개 삭제 후 서버 재시작 → 정상 동작
- `.fuse_hidden` 발생 원인: 이전 서버 종료 시 오픈 상태 파일을 FUSE가 임시 파일로 보관, 이후 재시작 시 충돌
- 서버 상태: PID 22737, 포트 3333, HTTP 200 정상 확인

#### `.git/index.lock` 이슈 (FUSE mount 제약)
- 샌드박스에서 `.git/index.lock` 삭제 불가 → 샌드박스에서 git 커밋 실패
- **해결**: 사용자가 Mac 터미널에서 직접 `rm -f .git/index.lock && git add -A && git commit && git push` 실행
- 커밋 완료: `49abd20` (AuthGuard DEV_BYPASS), `da61662` (next.config.ts 관련)

### 문서 업데이트
- CLAUDE.md, docs/CHANGELOG.md, session-context.md, docs/NEXT_SESSION_START.md 날짜 2026-04-17로 갱신
- 세션 #4~5 전체 로그 기록 완료

### 미해결 / 다음 세션 이슈
1. `stocks` 테이블 DB 시딩 필요 (KOSPI/KOSDAQ 상장종목)
2. `link_hub` 테이블 DB 시딩 필요 (투자 링크 카테고리)
3. 더미 데이터 제거 필요: ProgramTrading, GlobalFutures, WarningStocks, EconomicCalendar, IpoSchedule, EarningsCalendar, ScreenerPage (12종목), ComparePage (삼성/SK 하드코딩)
4. `/admin` 페이지 AuthGuard 누락 (role=admin 체크 없음 — 보안)
5. 한투 rate limit 3영업일(~4/15) 경과 → `RATE_LIMIT_MS=60ms` + WatchlistLive 폴링 10초로 복구 필요
6. DEV_BYPASS = false 로 전환 후 프로덕션 배포

---

## 세션 #4 — 2026-04-11 (13개 페이지 Chrome MCP 테스트 + 홈 수급 최적화)

### 추가 (신규)
- **`app/api/kis/investor-rank/route.ts`** — 한투 외국인/기관 매매종목 가집계 batch endpoint (TR ID: FHPTJ04400000). 한 번의 호출로 외국인 TOP10 + 기관 TOP10 동시 반환.

### 수정 (components/home/InstitutionalFlow.tsx)
- 기존: 10개 심볼 각각 `/api/kis/investor` 병렬 호출 (10건) + 30초 폴링 → WatchlistLive의 10건과 충돌해 초당 20건 rate limit 초과
- 수정: 단일 `/api/kis/investor-rank` batch 호출 (1건) + 60초 폴링 + WatchlistLive와 겹치지 않도록 5초 지연 시작
- 홈 페이지 전체 API 호출 폭주 해결

### 13개 페이지 Chrome MCP 테스트 결과
| # | 페이지 | 상태 | 메모 |
|---|---|---|---|
| 1 | / | ✅ | 홈 대시보드 정상, InstitutionalFlow batch 적용 후 TOP10 실데이터 표시 |
| 2 | /stocks/005930 | 🔒 | AuthGuard paywall (로그인 필요 — 예상 동작) |
| 3 | /news | ✅ | RSS 실제 피드 20건, 매체 필터/키워드 검색 정상 |
| 4 | /analysis | ⚠️ | FRED 미국 경제지표 실데이터 OK / 업종 히트맵·테마·시장수급은 더미 |
| 5 | /screener | ⚠️ | UI·필터 정상, 12종목 전체 더미 데이터 |
| 6 | /compare | ⚠️ | UI 정상, 삼성전자·SK하이닉스 비교 데이터 더미 |
| 7 | /link-hub | ⚠️ | UI 정상, `link_hub` 테이블 시딩 필요 (0건) |
| 8 | /stocks | ⚠️ | UI·필터·정렬 정상, `stocks` 테이블 비어있음 |
| 9 | /stocks/005930/analysis | 🔒 | AuthGuard paywall |
| 10 | /advertiser | ✅ | 랜딩 페이지 + CTA 정상 |
| 11 | /mypage | ✅ | 미로그인 시 /auth/login 리다이렉트 정상 |
| 12 | /pricing | ✅ | Premium/Pro 요금제 버튼 정상 |
| 13 | /admin | ⚠️ | **AuthGuard 누락 — 비로그인도 접근 가능 (보안 이슈)** |

### 확인된 이슈 (후속 작업)
1. **DB 시딩 필요**: `stocks`, `link_hub` 테이블 비어있음 → 검색·링크허브 실데이터 없음
2. **더미 데이터 제거 필요**: ProgramTrading, GlobalFutures, WarningStocks, EconomicCalendar, IpoSchedule, EarningsCalendar, ScreenerPage, ComparePage
3. **관리자 페이지 AuthGuard 추가 필요** (role=admin 체크)
4. **Turbopack 파일시스템 캐시 오류**: 샌드박스 환경에서 "Operation not permitted" / "Another write batch or compaction is already active" → dev 서버 주기적 재시작 필요 (운영엔 영향 없음, 로컬 샌드박스 한정)

## 세션 #3 — 2026-04-11

### 검증 (토요일 장외, 금요일 4/10 종가 기준)
- **/api/kis/price**: 정상 ✅ (삼성전자 206,000원, +2000, +0.98%)
- **/api/kis/investor**: 정상 ✅ (4/10 외국인 +465,171주 / 기관 -475,614주)
  - 세션 #2의 "수급 +0억 문제" 해결 확인
- **/api/kis/orderbook**: 정상 ✅ (매도/매수 10호가)
- **/api/kis/execution**: 정상 ✅ (체결 내역)

### 수정 (lib/kis.ts)
- **Rate limiter race condition 수정**: 기존 단순 timestamp 방식은 동시 요청이 모두 통과되는 버그 → Promise chain으로 serialize
- **토큰 deduplication**: HMR 리로드 시 3개 API가 동시에 토큰을 발급받다가 "1분/회" 제한에 걸리는 문제 → pendingTokenPromise로 공유
- **토큰 디스크 캐시 추가**: /tmp/kis-token-cache.json에 저장 → HMR 리로드에도 토큰 재사용
- **RATE_LIMIT_MS 기본값 400ms → 1100ms**: 한투 실전계좌 첫 3영업일은 1건/초 제한. 3영업일 경과 후 env로 복구 가능

### 수정 (WatchlistLive)
- 폴링 주기 10초 → 15초 (첫 3영업일 rate limit 대응)
- 3영업일 경과 후 (~4/15) 10초로 복구 예정

## 세션 #2 — 2026-04-09

### 추가
- 홈 페이지 3-layer 리팩토링 (1층=실시간 스코어보드+채팅, 2층=오늘의 시장, 3층=주요 일정)
- 4-column 레이아웃: AdColumn(280px) | SidePanel(320px) | Main(flex-1) | AdColumn(280px), maxWidth 1920px
- 12개 새 홈 컴포넌트: WatchlistLive, SidebarChat, BreakingFeed, InstitutionalFlow, VolumeSpike, ProgramTrading, GlobalFutures, MarketMiniCharts, WarningStocks, EconomicCalendar, IpoSchedule, EarningsCalendar
- AdColumn 컴포넌트: 320x120 배너, 인증업체(금색) / 일반(회색) 구분, 광고주 랜딩 페이지 (/ad/[id])
- 한국투자증권 OpenAPI 연동: lib/kis.ts (토큰 캐싱 + 400ms 레이트 리미터)
- API 라우트 4개: /api/kis/price, /api/kis/orderbook, /api/kis/execution, /api/kis/investor
- 4개 신규 페이지: /news (뉴스·공시), /analysis (시장분석), /screener (스크리너), /compare (비교분석)
- AI 분석 시스템: GPT-4o-mini 연동, 5가지 분석 (가치/기술적/퀀트/배당/수급), 7일 캐시
- Make 자동화 설계 문서 (5개 시나리오)
- 명령서 문서 4개: COMMANDS_PHASE1~4

### 변경
- Header: sticky/fixed 해제 → 일반 스크롤, Tiffany 컬러 상단 배너, Playfair Display 로고
- TickerBar: sticky 해제
- HomeClient: 기존 대시보드 → 라이브스코어+채팅 컨셉 4-column 레이아웃으로 전면 개편
- SidebarChat: 탭 제거 (전체 채널만), sticky bottom, Supabase Realtime 채널명 Date.now() 추가
- WatchlistLive: 한투 API 실시간 연동 (10초 폴링), 가격 변동 blink 애니메이션
- InstitutionalFlow: hydration mismatch 수정 (mounted 패턴)
- BreakingFeed: TodayDisclosures + TodayNews 합쳐서 혼합 피드로 변경
- LayoutShell: 홈 페이지용 조건부 레이아웃 적용
- layout.tsx: history.scrollRestoration='manual' 추가, scrollTo 다중 타이머 적용
- .env.local: 한투 API 키, OpenAI API 키 추가

### 수정
- Hydration Mismatch: InstitutionalFlow (mounted 패턴), WatchlistLive (skeleton UI)
- SidebarChat duplicate subscription: Supabase 채널명 충돌 해결
- 스크롤 위치 문제: 다중 setTimeout + requestAnimationFrame으로 해결
- 메인 콘텐츠 너비 문제: 사이드패널을 광고 바깥으로 이동, maxWidth 1920px

## 세션 #1 — 2026-04-08

### 추가
- Next.js 16 + TypeScript + Tailwind CSS + Supabase 프로젝트 초기 설정
- 공통 레이아웃: Header, TickerBar, Footer, FloatingChat 컴포넌트
- 인증 시스템: 로그인, 회원가입, AuthProvider, AuthGuard, 소셜 로그인 콜백
- 홈 대시보드: MarketSummaryCards, TodayDisclosures, TodayNews, SupplyDemandSummary, TopMovers, BannerSection
- 링크 허브 페이지 + 한국/미국 링크 데이터 (linkHub.ts)
- 종목 검색/리스트 페이지
- 종목 상세 대시보드 10개 탭 (차트, 재무제표, 공시, 수급, 공매도, 내부자, 배당, 뉴스, 섹터, 거시경제)
- 기법별 분석 5개 컴포넌트 (가치투자, 기술적, 퀀트, 배당, 수급)
- 광고주 센터 (랜딩 + 대시보드)
- 마이페이지, 구독/결제, 관리자 페이지
- API 라우트 8개 (DART, KRX, ECOS, SEC, FRED, 뉴스, AI분석, 결제)
- DB 스키마 SQL (20개 테이블, 인덱스, RLS 정책)
- Zustand 스토어 4개 (auth, country, watchlist, chat)
- 유틸리티: 금칙어 필터, 채팅 모더레이션, 결제, AI 분석, 주식 계산 함수
- 타입 정의 5개 (stock, user, chat, advertiser, api)
- CLAUDE_CODE_INSTRUCTIONS.md 전체 개발 명령서
- 프로젝트 관리 체계 (CLAUDE.md, session-context.md, CHANGELOG, NEXT_SESSION_START, hook)

### 변경
- 없음 (초기 생성)

### 삭제
- 없음 (초기 생성)
