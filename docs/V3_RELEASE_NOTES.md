<!-- 2026-04-23 -->
# Stock Terminal V3 — Release Notes

## 릴리즈 요약

V3는 "전업투자자의 환경을 일반 투자자에게 무료로" 라는 핵심 비전을 완성하는 대시보드 플랫폼입니다.
구독·결제·Pro·AI리포트·CSV 기능을 **전면 제거**하고, Partner-Agnostic Lead Gen 수익 모델로 전환합니다.

---

## 섹션 구성 (홈 대시보드)

### Section 1 — 트레이딩 터미널
- **WatchlistWidget** — 관심종목 퍼시스트, 종목 선택 → 전체 연동
- **ChartWidget** — TradingView 경량 차트, KR/US 60초 자동갱신
- **OrderBookWidget** — 5호가 depth bar, 총잔량 비율, selectedSymbol 동기화
- **TickWidget** — 체결강도, 대량체결 '대' 배지, fadeIn 애니메이션, depth bar
- **StockDetailPanel** — 스냅샷 헤더(시총/PER/PBR/배당) + 탭 4개
  - 종합: 주요지표 5블록 (실데이터)
  - 재무: DART 손익/BS/현금흐름
  - 공시: DART (KR) / SEC EDGAR (US)
  - 뉴스: 종목 뉴스 스트림

### Section 2 — Pre-Market & Global
- **BriefingWidget** (compact) — 장전 브리핑 + 주요 일정 미리보기
- **GlobalIndicesWidget** (expanded) — 17개 지표: 지수·환율·원자재·채권·암호화폐

### Section 3 — Discovery
- **ScreenerExpandedWidget** — 6 프리셋 (저PER/고배당/급등/급락/우량주/초소형) + 검색
- **MoversPairWidget** — 급등/급락 Top10 2-col, 상한가/하한가 배지
- **VolumeTop10Widget** (inline) — 거래량 Top10
- **NetBuyTopWidget** (inline) — 기관 순매수 Top10

### Section 4 — Market Structure
- **SectorHeatmapWidget** — KR(3개월 수익률)/US(SPDR ETF) 섹터 히트맵, 색상 강도 인코딩
- **ThemeTop10Widget** — 테마 Top10 상승/하락 토글, 배경 바 시각화

### Section 5 — Information Streams
- **NewsStreamWidget** — 한경/매경/이데일리 RSS, 5분 자동갱신, 소스 컬러 배지
- **DisclosureStreamWidget** — KR(DART 최근 주요공시) / US(미구현·대기) 토글
- **EconomicCalendarWidget** — 7일 주요 경제지표, 중요도 점 표시, 오늘 강조

---

## 전역 기능

| 기능 | 구현 |
|------|------|
| FloatingChat | 3상태(닫힘/최소화/열림), Supabase Realtime, 참여자 모달 |
| selectedSymbolStore | Zustand persist + hydration guard, 전위젯 공유 |
| AuthGuard (DEV_BYPASS) | `NEXT_PUBLIC_DEV_BYPASS_AUTH=true` 로 결제벽 우회 |
| StockDetailToggle | 모바일 오버레이, FloatingChat 겹침 방지 (bottom-24) |

---

## 알려진 제한사항 / TODO

| 항목 | 상태 | 비고 |
|------|------|------|
| DisclosureStreamWidget US | 미구현 | SEC EDGAR 스트림 API 필요 |
| GlobalIndicesWidget Sparkline | 7일 히스토리 없음 | Yahoo Finance historical 연결 필요 |
| SectorHeatmapWidget KR | return_3m 기준 (장중 미반영) | KIS 섹터 API 연결 시 당일 전환 |
| ESLint `set-state-in-effect` | 63건 비차단 경고 | 기존 패턴 전체 (별도 Cleanup STEP 필요) |
| ChartWidget | TradingView 위젯 로딩 지연 가능 | CSR-only |

---

## 빌드 상태

- TypeScript: ✅ 오류 없음
- Next.js 빌드: ✅ 81 페이지 정적 생성 완료
- ESLint: ⚠️ 63 비차단 경고 (기존 패턴)
- console.log: ✅ 신규 파일 없음

---

## 주요 API 엔드포인트

| 경로 | 용도 |
|------|------|
| `/api/home/briefing` | 장전 브리핑 |
| `/api/home/global` | 홈 글로벌 지수 (compact) |
| `/api/home/sectors` | 섹터 히트맵 데이터 |
| `/api/home/disclosures` | 최근 공시 스트림 |
| `/api/home/news` | 뉴스 RSS 집계 |
| `/api/global` | 전체 글로벌 17개 심볼 |
| `/api/kis/movers` | 급등/급락 종목 |
| `/api/kis/price` | 실시간 가격 (배당 포함) |
| `/api/kis/orderbook` | 호가창 |
| `/api/kis/execution` | 체결창 |
| `/api/themes` | 테마별 평균 등락 |
| `/api/stocks/screener` | 멀티팩터 스크리너 |
| `/api/stocks/disclosures` | 종목별 공시 (DART/SEC) |
| `/api/calendar/upcoming` | 경제 캘린더 |

---

_Generated 2026-04-23 — STEP 75~82 완료_
