<!-- 2026-04-17 -->
# Stock Terminal — 프로젝트 맥락

## 프로젝트 개요
- **서비스 정의**: 글로벌 개인투자자용 통합 데이터 터미널 플랫폼
- **핵심 전략**: 전업투자자가 수년 걸려 세팅한 투자 정보 환경을 일반 투자자에게 월 구독료(2~3만원)로 제공
- **수익 모델**: 구독료 + 인증업체 배너(20일 5만원) + 일반 배너(20일 3만원) + 추후 거래소 제휴 링크
- **기술 스택**: Next.js 16 + TypeScript + Tailwind CSS + Supabase + Zustand + Recharts + TradingView 위젯
- **배포**: Vercel + Supabase Cloud
- **결제**: 토스페이먼츠 (한국), 추후 Paddle (글로벌)

## 현재 TODO

### P0 — 지금 당장 (블로커)
- [ ] **DB 시딩**: `stocks` 테이블 (KOSPI/KOSDAQ 상장종목 전체)
- [ ] **DB 시딩**: `link_hub` 테이블 (카테고리별 투자 링크)
- [ ] **더미 데이터 제거 (8개 컴포넌트)**: ProgramTrading, GlobalFutures, WarningStocks, EconomicCalendar, IpoSchedule, EarningsCalendar, ScreenerPage, ComparePage
- [ ] **/admin AuthGuard 추가**: role=admin 체크 (보안 이슈)
- [ ] **rate limit 복구**: 3영업일(~4/15) 경과 → `.env.local`에 `KIS_RATE_LIMIT_MS=60` 추가, WatchlistLive 폴링 15초→10초 복구

### P1 — 이번 주
- [ ] TradingView 위젯 연동 확인 (차트, 티커바)
- [ ] 링크 허브 페이지 실제 링크 동작 확인
- [ ] 로그인/회원가입 Supabase Auth 연동 테스트
- [ ] 전체 페이지 UI 세부 점검
- [ ] 장중 실시간 데이터 검증 (관심종목 변동, 수급 갱신, 호가창/체결)

### P2 — 다음 주
- [ ] 토스페이먼츠 결제 연동 (라이브 URL 생성 후)
- [ ] KRX 크롤링 (프로그램매매 + 공매도 데이터)
- [ ] SEC EDGAR API 연동 (미국 주식)
- [ ] 광고주 배너 등록 시스템 완성
- [ ] 관리자 페이지 완성
- [ ] **DEV_BYPASS = false** 전환 후 프로덕션 배포 준비

### P3 — 2주 후
- [ ] Make 자동화 스케줄링 세팅 (5개 시나리오)
- [ ] 모바일/태블릿 반응형 대응
- [ ] 성능 최적화

### P4 — 1개월 후
- [ ] 일본(TSE) / 홍콩(HKEX) 시장 추가
- [ ] 코인 플랫폼 (브랜드명-코인) 런칭
- [ ] 영어 버전 글로벌 확장
- [ ] Paddle 결제 연동 (글로벌)

## 완료된 세션 히스토리

### 세션 #5 — 2026-04-17 (AuthGuard DEV_BYPASS + Turbopack 서버 안정화 + 문서 전체 갱신)
- **AuthGuard**: `DEV_BYPASS = true` 추가 → 13개 페이지 paywall 전체 해제 (개발 확인용)
- **Turbopack 크래시 해결**: `.fuse_hidden` 파일 7개 삭제 후 서버 재시작 → `✓ Ready in 1175ms`
  - 원인: FUSE mount 위에서 Turbopack RocksDB lock 파일 생성 불가 → "Operation not permitted"
  - 해결: `mcp__cowork__allow_cowork_file_delete`로 `.fuse_hidden*` 삭제 후 `next.config.ts` 원복
- **next.config.ts**: `distDir` 절대경로 시도 (실패) → 원복 (Next.js path.join 제약으로 절대경로 불가)
- **git 이슈**: 샌드박스에서 `.git/index.lock` 삭제 불가 → 사용자 Mac 터미널에서 직접 push 완료 (커밋 `49abd20`, `da61662`)
- **문서 전체 갱신**: 4개 문서 날짜 + 세션 #4~5 로그 기록 완료

### 세션 #4 — 2026-04-11 (13개 페이지 Chrome MCP 테스트 + 홈 수급 최적화)
- **신규**: `app/api/kis/investor-rank/route.ts` (batch endpoint, TR ID: FHPTJ04400000)
- **수정**: `components/home/InstitutionalFlow.tsx` — 10건 병렬 개별호출 → 1건 batch 호출 (60초 폴링)
- **효과**: 홈 페이지에서 WatchlistLive(10건/15초) + InstitutionalFlow(1건/60초) = 한투 rate limit 안정화
- **테스트**: 13개 페이지 전부 Chrome MCP로 순회, 페이지별 UI/데이터 상태 기록
- **발견된 이슈**:
  - DB 시딩 필요 (`stocks`, `link_hub` 비어있음)
  - 더미 데이터 8개 컴포넌트 제거 필요
  - `/admin` AuthGuard 누락 (보안)
  - Turbopack 파일시스템 캐시 오류 (샌드박스 한정)

### 세션 #1 — 2026-04-08
- **작업 내용**: 프로젝트 초기 설정 + 전체 파일 구조 생성
- **완료된 것**:
  - Next.js 16 + TypeScript + Tailwind + Supabase 프로젝트 생성
  - 90개 이상 파일 생성 (9개 페이지 + 50개 이상 컴포넌트 + API 라우트 + 유틸리티)
  - DB 스키마 SQL 작성 (20개 테이블)
  - 공통 레이아웃 (Header, TickerBar, Footer, FloatingChat)
  - 인증 시스템 (로그인/회원가입/AuthGuard)
  - 홈 대시보드 전체 컴포넌트
  - CLAUDE_CODE_INSTRUCTIONS.md 전체 개발 명령서 작성

### 세션 #4 — 2026-04-11 (13개 페이지 Chrome MCP 테스트 + 홈 수급 최적화)
- **신규**: `app/api/kis/investor-rank/route.ts` (batch endpoint, TR ID: FHPTJ04400000)
- **수정**: `components/home/InstitutionalFlow.tsx` — 10건 병렬 개별호출 → 1건 batch 호출 (60초 폴링)
- **효과**: 홈 페이지에서 WatchlistLive(10건/15초) + InstitutionalFlow(1건/60초) = 한투 rate limit 안정화
- **테스트**: 13개 페이지 전부 Chrome MCP로 순회, 페이지별 UI/데이터 상태 기록
- **발견된 이슈**:
  - DB 시딩 필요 (`stocks`, `link_hub` 비어있음)
  - 더미 데이터 8개 컴포넌트 제거 필요
  - `/admin` AuthGuard 누락 (보안)
  - Turbopack 파일시스템 캐시 오류 (샌드박스 한정)

### 세션 #3 — 2026-04-11
- **작업 내용**: 한투 API 4종 검증 + lib/kis.ts 버그 수정
- **검증 결과 (토요일 장외, 4/10 종가 기준)**:
  - /api/kis/price: 정상 (삼성전자 206,000원)
  - /api/kis/investor: 정상 (외국인 +465,171주 / 기관 -475,614주) — 수급 +0억 문제 해결
  - /api/kis/orderbook: 정상 (10호가)
  - /api/kis/execution: 정상 (체결 내역)
- **수정한 버그**:
  - Rate limiter race condition → Promise chain serialize
  - 토큰 발급 deduplication → pendingTokenPromise 공유
  - 토큰 디스크 캐시 추가 (/tmp/kis-token-cache.json)
  - RATE_LIMIT_MS 400ms → 1100ms (첫 3영업일 1건/초 제한 대응)
  - WatchlistLive 폴링 10초 → 15초
- **병렬 3개 API 호출 재테스트**: 3.1초 (1.1초 × 3, 직렬화 정상)

### 세션 #2 — 2026-04-09
- **작업 내용**: Phase 1~4 전체 구현 (홈 리팩토링 + API + 서브페이지 + 수익화)
- **완료된 것**:
  - 홈 3-layer 리팩토링 (라이브스코어+채팅 컨셉)
  - 4-column 레이아웃 (Ad | SidePanel | Main | Ad), maxWidth 1920px
  - 12개 새 홈 컴포넌트 구현
  - 한투 OpenAPI 연동 (4개 API 라우트, 토큰 캐싱, 레이트 리미터)
  - 관심종목 실시간 10초 폴링, 외국인/기관 수급 30초 폴링
  - 속보 뉴스+공시 혼합 피드 (DART + RSS)
  - 4개 신규 페이지 (/news, /analysis, /screener, /compare)
  - AI 분석 GPT-4o-mini 연동 성공 (삼성전자 가치분석 테스트 완료)
  - AdColumn (320x120 배너, 인증/일반 구분)
  - Hydration mismatch 3건 수정
  - Header/TickerBar sticky 해제
  - SidebarChat 탭 제거, sticky bottom
- **미완료**: 토스페이먼츠 (라이브 URL 필요), 프로그램매매 데이터 (KRX 크롤링 필요)

## 핵심 수치
- **총 파일 수**: 120개 이상
- **페이지 수**: 13개 (홈, 링크허브, 종목검색, 종목상세, 기법분석, 광고주센터, 마이페이지, 구독결제, 관리자, 뉴스·공시, 시장분석, 스크리너, 비교분석)
- **컴포넌트 수**: 70개 이상
- **DB 테이블 수**: 20개
- **API 라우트 수**: 12개 이상
- **지원 시장**: 한국(코스피/코스닥) + 미국(나스닥/NYSE) — 추후 일본, 홍콩 추가
- **빌드 상태**: 정상 (dev 서버 localhost:3333)
- **배포 상태**: 미배포
- **한투 API**: 실전 계좌 연동 완료 (첫 3일 3회/초 제한)
- **AI 분석**: GPT-4o-mini 연동 완료, 7일 캐시

## 세션 업데이트 지침
- 이 파일에 없는 숫자를 임의로 만들지 말 것
- 핵심 수치는 실제 확인된 수치만 기록
- 세션 히스토리는 가장 최근이 아래에 추가
