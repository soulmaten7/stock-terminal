# Reference Platform Mapping — StockTerminal V3

> **최종 업데이트**: 2026-04-22
> **원칙**: "다른 플랫폼에 있는 UI와 기능을 그대로 가져온다. 매수매도만 제외." (사용자 지시, STEP 47 리뷰)
> **레퍼런스 후보군 (4 카테고리)**:
> - **MTS**: 키움 영웅문, 한투 eFriend, 미래에셋 M-Stock, NH나무, 삼성증권
> - **핀테크 모바일**: 토스증권, 카카오페이증권
> - **정보 조회 포털**: 네이버증권, 다음금융, 38커뮤니케이션
> - **분석·리서치 특화**: TradingView, Koyfin, Finviz, Investing.com, Seeking Alpha, Yahoo Finance, DART 공식

---

## 1. 홈 대시보드 위젯 (14개)

한 화면에 압축 표시하는 "1차 집합체". 각 위젯은 우상단 ↗ 아이콘으로 상세 페이지 진입.

| # | 위젯 | 기능 | 주 레퍼런스 | 보조 레퍼런스 | 벤치마크 포인트 | 우선순위 |
|---|------|------|------------|--------------|----------------|---------|
| 1 | ChatWidget (마켓 채팅) | 실시간 채팅 + 참여자 목록 | 네이버증권 종목토론실 | 디스코드 / 카카오톡 오픈채팅 | 익명·닉네임·말머리(매수/매도/정보), 스크롤 고정 입력창 | P1 |
| 2 | ScreenerMiniWidget (종목 발굴) | 시장 토글 + 키워드 검색 → /screener | 네이버증권 상단 검색바 | Yahoo Finance Quote Lookup | 심플 원줄 폼, 엔터 즉시 이동 | P2 |
| 3 | WatchlistWidget (관심종목) | 심볼·가격·등락 리스트 | **키움 영웅문 관심종목** | 토스증권 관심종목 / Koyfin Watchlist | 인라인 편집, 드래그 정렬, 그룹 분류 | P0 |
| 4 | ChartWidget (차트) | 실시간 캔들차트 | **TradingView** | 네이버증권 차트 / Koyfin | 지표 오버레이, 시간프레임 탭, 심볼 검색 | P0 |
| 5 | OrderBookWidget (호가창) | 5단 호가 + 잔량 | **키움 영웅문 호가창** | 한투 / 네이버증권 호가 | 잔량 막대 그래프, 상단 5호가 센터정렬, 거래량 누적 | P0 |
| 6 | TickWidget (체결창) | 실시간 체결 내역 | **키움 영웅문 체결창** | 한투 | 체결가 색상(상승 빨강/하락 파랑), 체결 강도 표시 | P1 |
| 7 | NewsFeedWidget (뉴스 속보) | 한경·매경·이데일리 피드 | **네이버증권 뉴스** | Seeking Alpha / Yahoo Finance News | 매체 컬러 태그, 시간 상대표기(3분 전), 원문 새창 | P1 |
| 8 | DartFilingsWidget (DART 공시) | DART 실시간 공시 | **DART 공식** | 네이버증권 공시탭 | 공시유형 뱃지(중요/일반), 기업명·공시명 2단 | P0 |
| 9 | EconCalendarMini (경제캘린더) | 이번 주 주요 지표 | **Investing.com 경제캘린더** | Forex Factory | 중요도 별(★★★), 국가 플래그, 이전/예상/실제 | P1 |
| 10 | MoversTop10 (상승/하락) | 등락률 상·하위 10 | **네이버증권 상한가/하한가** | Finviz / 다음금융 | 탭 전환(상승/하락), 상한가 비율 색상 강조 | P0 |
| 11 | VolumeTop10 (거래량 급등) | 거래량 상위 10 | **네이버증권 거래량 순위** | Finviz | 전일비 거래량 증가율 막대 | P0 |
| 12 | NetBuyTop (수급) | 외인·기관 순매수 | **네이버증권 투자자별 매매동향** | 한경 인베스트먼트 | 외인/기관 탭, 순매수 금액 정렬 | P0 |
| 13 | TrendingThemesWidget (상승 테마) | 평균등락률 상위 테마 | **네이버증권 테마** | 38커뮤니케이션 / 다음금융 | 테마명 + 구성종목 수 + 평균등락률 | P1 |
| 14 | GlobalIndicesWidget (글로벌 지수) | 미/유/아시아 주요 지수 | **Investing.com 지수** | Koyfin / Yahoo Finance | 지수 로고, 현재가·등락액·등락률, 미니차트 | P1 |

---

## 2. 상세 페이지 (사이드바 14항목)

각 위젯 우상단 ↗ 또는 사이드바에서 진입. "1차 집합체" 대비 풀 기능 제공.

| # | 페이지 | 경로 | 주 레퍼런스 | 보조 레퍼런스 | 벤치마크 포인트 | 우선순위 |
|---|-------|------|------------|--------------|----------------|---------|
| 1 | 홈 (대시보드) | `/` | **Koyfin Dashboard** | TradingView Desktop | 위젯 드래그 재배치(v2+), 다중 레이아웃 프리셋 | P0 |
| 2 | 종목 발굴 | `/screener` | **Finviz Screener** | Yahoo Finance Screener / Koyfin Screener | 필터 8종(시가총액/PER/거래량 etc), 컬럼 커스터마이징, 프리셋 저장 | P0 |
| 3 | 관심종목 | `/watchlist` | **Koyfin Watchlist** | TradingView / 키움 | 다중 그룹, 컬럼 커스터마이징, 엑셀 복사 | P0 |
| 4 | 차트 | `/chart` | **TradingView** | Koyfin Advanced Chart | 지표 100+종, 저장 레이아웃, 멀티차트 | P0 |
| 5 | 상승/하락 | `/movers/price` | **네이버증권 상한가** | Finviz Top Gainers | 기간 필터(당일/주/월), 거래대금 컬럼 | P1 |
| 6 | 거래량 급등 | `/movers/volume` | **네이버증권 거래량** | Finviz Volume Leaders | 전일대비 증가율, 거래대금 정렬 | P1 |
| 7 | 수급 | `/net-buy` | **네이버증권 투자자별 매매동향** | 한국거래소 통계 | 탭(외인/기관/개인), 누적 기간 선택, 차트 시각화 | P1 |
| 8 | 뉴스 속보 | `/news` | **네이버증권 뉴스** | Seeking Alpha Latest News | 매체 필터, 종목 태그, 원문 링크 + 요약 | P1 |
| 9 | DART 공시 | `/disclosures` | **DART 공식** | 네이버증권 공시 | 기업명·공시유형·날짜 검색, PDF 뷰어 연결 | P1 |
| 10 | 경제캘린더 | `/calendar` | **Investing.com** | Forex Factory | 주간/월간 뷰, 중요도 필터, 국가 필터 | P2 |
| 11 | 장전 브리핑 | `/briefing` | **Seeking Alpha Wall Street Breakfast** | 조선비즈 장전 체크 / Yahoo Finance Premarket | 카테고리 3단(미국 마감/아시아/국내 주요 이슈) | P2 |
| 12 | 글로벌 지수 | `/global` | **Investing.com 지수** | Koyfin World Markets | 대륙별 탭, 선물/현물 구분, 환율 포함 | P2 |
| 13 | 시장 지도 | `/analysis` | **Finviz Heatmap** | TradingView Heatmap / Koyfin Sector Heatmap | 섹터→업종→종목 드릴다운, 시가총액 크기 비례 | P1 |
| 14 | 참고 사이트 | `/toolbox` | (자체 큐레이션) | DART·KRX·금감원 등 공식 링크 허브 | 카테고리 7종, 즐겨찾기(로그인), 사이트 설명 | P2 |

---

## 3. 우선순위 기준

### P0 — 즉시 착수 (MVP 핵심)
사용자가 매일 보는 위젯 + 전업투자자가 가장 많이 사용하는 페이지.
- **위젯**: Watchlist, Chart, OrderBook, DART, Movers, Volume, NetBuy
- **페이지**: 홈, Screener, Watchlist, Chart

### P1 — 2차 착수
정보 탐색·이벤트 스트림 관련.
- **위젯**: Chat, Tick, News, EconCal, Themes, GlobalIndices
- **페이지**: Movers/Price, Movers/Volume, NetBuy, News, Disclosures, Analysis(시장지도)

### P2 — 여유 있을 때
부가 정보.
- **위젯**: ScreenerMini
- **페이지**: Calendar, Briefing, Global, Toolbox

---

## 4. 진행 방식 (STEP 51+)

1. P0 항목부터 하나씩 해당 레퍼런스 플랫폼 스크린샷 수집 → Chrome MCP로 실제 UI 확인
2. 위젯/페이지별 디테일 스펙 문서 작성 (`docs/WIDGET_SPEC_{name}.md`)
3. 스펙 기반으로 각 위젯 UI 리팩토링 진행
4. 매수매도 관련 요소(주문 버튼/수량 입력/체결 알림 등) 제거 확인

---

## 5. 레퍼런스 플랫폼 URL (참고용)

| 플랫폼 | URL | 비고 |
|--------|-----|------|
| 네이버증권 | https://finance.naver.com | 정보 조회 포털 |
| 다음 금융 | https://finance.daum.net | 정보 조회 포털 |
| 38커뮤니케이션 | https://www.38.co.kr | 테마/공모주 특화 |
| DART 공식 | https://dart.fss.or.kr | 공시 원본 |
| 한국거래소 KRX | https://kind.krx.co.kr | 공식 시장 정보 |
| TradingView | https://www.tradingview.com | 차트 업계 표준 |
| Koyfin | https://www.koyfin.com | 블룸버그 대체 |
| Finviz | https://finviz.com | Screener·Heatmap |
| Investing.com | https://investing.com | 경제캘린더·글로벌 |
| Seeking Alpha | https://seekingalpha.com | 뉴스·분석 |
| Yahoo Finance | https://finance.yahoo.com | 종목 정보 종합 |
| 키움 영웅문 | (MTS 다운로드) | MTS 표준 UI |
| 토스증권 | (앱) | 모바일 UX 레퍼런스 |

---

## 6. 중요 원칙 (사용자 지시 재확인)

- ✅ **"보고 검색하는 기능만"** 가져온다
- ❌ 매수매도·주문·체결 알림 같은 실행 기능은 전부 제외
- ✅ 중복 기능은 **가장 잘 구현된 플랫폼** 하나를 선택
- ✅ 한 곳만 있는 기능은 **그대로 갖고온다**
- ✅ **자체 UI 디자인하지 않는다** — 브랜딩/색상/밀도 조율은 기능 완성 후 진행
