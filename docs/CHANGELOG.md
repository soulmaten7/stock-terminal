<!-- 2026-04-11 -->
# Stock Terminal — 변경 이력

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
