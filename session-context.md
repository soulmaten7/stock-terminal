<!-- 2026-04-18 -->
# Stock Terminal — 프로젝트 맥락

## 프로젝트 개요
- **서비스 정의**: 글로벌 개인투자자용 통합 데이터 터미널 플랫폼
- **포지셔닝 (V3 확정)**: "전업투자자 = 일반인 (일반투자자가 되고싶은 상위 1%)" — Aspirational Design
- **핵심 전략**: 전업투자자가 보는 데이터 환경을 일반 투자자에게 **완전 무료**로 제공, 수익은 Partner-Agnostic Lead Gen 으로만 발생 (V3 확정)
- **UI 철학**: Bloomberg/Koyfin 표준 Bento Grid + 단일 지속 채팅 + 투자자 도구함(Link Hub)
- **수익 모델 (V3 단일)**: **Partner-Agnostic Lead Gen 만.** 구독/결제/Pro/AI 리포트/CSV/À la carte — **전부 제외**
  - Phase 1 (즉시): 랜딩페이지 인프라 + Lead Gen (한국 5~10만원/리드)
  - Phase 2 (5~12주): 트래픽 확보 + 리드 퀄리티 스코어 + 파트너 슬롯 확장
  - Phase 3 (12개월+): 글로벌 시장 + 광고 인벤토리 세분화 — **여전히 구독 없음**
- **데이터 소스**: 100% 무료 (DART/KRX/KIS/FDR/Naver/ECOS) — KIS 서버사이드 연동 완료로 비로그인 이용자도 실시간
- **기술 스택**: Next.js 16 + TypeScript + Tailwind CSS + Supabase + Zustand + Recharts + TradingView 위젯
- **배포**: Vercel + Supabase Cloud
- **결제 연동**: **없음** — 토스페이먼츠/Paddle 연동 코드 작성 금지 (별도 의사결정 전까지)

## 현재 TODO

### P0 — 지금 당장 (블로커)
- [x] ~~**DB 시딩**: `stocks` 테이블~~ → 세션 #7 완료 (KOSPI 949 + KOSDAQ 1,821 = 2,780건)
- [x] ~~**DB 시딩**: `link_hub` 테이블~~ → 세션 #7 완료 (KR/US 56건)
- [x] ~~**더미 데이터 제거**: ~~ProgramTrading~~, ~~GlobalFutures~~, ~~WarningStocks~~, EconomicCalendar(#39→Phase2), ~~IpoSchedule~~, EarningsCalendar(#38→Phase2), ~~ScreenerPage~~, ~~ComparePage(W2.5)~~~~ → 세션 #15 ComingSoon 4개 완료, 나머지 결정됨
- [ ] **W4 Phase 2**: ~~/admin/partners CRUD (Phase 1 = 추가만)~~ ~~리드 대시보드~~ ~~슬롯 키 확장 (종목 상세·스크리너 하단)~~ 완료 → 편집·삭제·슬롯 재매핑 · UTM 대시보드 · (추후) 채팅 사이드바 슬롯
- [x] ~~**(D) 홈 Row3 잔여 PARTNER SLOT (W4) placeholder 교체**~~ → 세션 #15 완료 (commit becb74c, home-sidebar-bottom 슬롯에 테스트 자산운용 시드 + HomeClient 회색 박스 제거)
- [x] ~~**(E) /admin/partners 최소 CRUD (Phase 1 = 추가)**~~ → 세션 #15 완료 (GET/POST API + AuthGuard admin 페이지 + /admin 대시보드 바로가기, Chrome MCP E2E 5/5 PASS + soulmaten7 admin 승격)
- [x] ~~**(F) /admin/partners/leads 리드 대시보드 + CSV Export**~~ → 세션 #15 완료 (필터 4종 + KPI 4카드 + UTM TOP5 + 리스트 + CSV BOM 다운로드)
- [x] ~~**(G) 슬롯 키 확장 (stock-detail-bottom / screener-bottom)**~~ → 세션 #15 완료 (SLOT_KEYS 7옵션 + `/stocks/[symbol]` 하단 + `/screener` 하단 PartnerSlot 주입, 빈 상태=null 렌더)
- [x] ~~**/admin AuthGuard 추가**~~ → 세션 #6 완료 (2026-04-17)
- [x] ~~**rate limit 복구**~~ → 세션 #6 완료 (2026-04-17)

### P1 — 이번 주
- [ ] TradingView 위젯 연동 확인 (차트, 티커바)
- [ ] 링크 허브 페이지 실제 링크 동작 확인
- [x] ~~로그인/회원가입 Supabase Auth 연동 테스트~~ → 세션 #13 완료 (Google OAuth 실동작, RLS INSERT 정책 신설)
- [x] ~~Chat API 하네스 점검~~ → 세션 #13 완료 (Task #26, 6/6 통과)
- [x] ~~Chat 초기 UX·메시지 렌더링 디테일 점검~~ → 세션 #13 완료 (Task #27, 글자수 카운터 + 에러 UX + 429 전용 + $태그 pill + 포커스 유지)
- [ ] 전체 페이지 UI 세부 점검
- [ ] 장중 실시간 데이터 검증 (관심종목 변동, 수급 갱신, 호가창/체결)

### P2 — 다음 주
- [ ] KRX 크롤링 (프로그램매매 + 공매도 데이터)
- [ ] SEC EDGAR API 연동 (미국 주식)
- [ ] 관리자 페이지 완성 (파트너 CRUD 중심)
- [ ] **DEV_BYPASS = false** 전환 후 프로덕션 배포 준비
- ~~[ ] 토스페이먼츠 결제 연동~~ → **V3 에서 제외 (구독 모델 폐기)**
- ~~[ ] 광고주 배너 등록 시스템~~ → **V3 에서 제외 (Partner-Agnostic Landing 으로 대체)**

### P3 — 2주 후
- [ ] Make 자동화 스케줄링 세팅 (5개 시나리오)
- [ ] 모바일/태블릿 반응형 대응
- [ ] 성능 최적화

### P4 — 1개월 후
- [ ] 일본(TSE) / 홍콩(HKEX) 시장 추가
- [ ] 영어 버전 글로벌 확장
- ~~[ ] Paddle 결제 연동~~ → **V3 에서 제외 (글로벌 진출 후에도 구독 없음)**
- ~~[ ] 코인 플랫폼~~ → 별건 프로젝트로 분리 (V3 범위 아님)

## 완료된 세션 히스토리

### 세션 #15 — 2026-04-18 ((G) 슬롯 키 확장 — stock-detail-bottom / screener-bottom)
- **전략 결정**: `/stocks/[symbol]` + `/screener` 둘 다 사이드바 없음 → 리팩토링 최소화 위해 **하단 풀폭 슬롯** 패턴 채택 (기존 `stock-detail-sidebar` / `toolbox-sidebar` 키는 보존하여 DB 데이터 호환)
- **`app/admin/partners/page.tsx` SLOT_KEYS 확장** — `stock-detail-bottom` / `screener-bottom` 2개 신설 → 드롭다운 7 옵션
- **`app/stocks/[symbol]/page.tsx`** — `<StockDetailTabs/>` 아래 `max-w-[1400px] mx-auto px-4 pb-10` 래퍼로 `<PartnerSlot slotKey="stock-detail-bottom" variant="card" />` 주입
- **`components/screener/ScreenerClient.tsx`** — Pagination 블록 아래 `mt-8` 여백으로 `<PartnerSlot slotKey="screener-bottom" variant="card" />` 주입
- 동작: 파트너 미지정(슬롯 매핑 없음)이면 PartnerSlot이 `null` 리턴 → 그레이스풀 빈 상태. 어드민에서 slot_key 추가 즉시 카드 출현.

### 세션 #15 — 2026-04-18 ((F) /admin/partners/leads 리드 대시보드 + CSV Export)
- **신규 API `app/api/admin/partners/leads/route.ts`** (admin only)
  - GET 필터: partner_slug · from · to (YYYY-MM-DD) · q (이름/이메일/전화/문의 OR ilike) · limit · offset · format(json|csv)
  - CSV 모드: UTF-8 BOM 프리픽스 + 12열 헤더 + `attachment; filename="partner_leads_YYYY-MM-DD.csv"` 내려보냄 (엑셀 한글 깨짐 방지)
  - 파트너 이름/slug 병합은 FK select 대신 in-clause 별도 조회 후 메모리 병합 (RLS 우회 안전)
- **신규 페이지 `app/admin/partners/leads/page.tsx`** (AuthGuard admin)
  - 필터 4종 + 검색 + 조회/CSV 다운로드 버튼 · KPI 4카드 (총/이메일/전화/동의) · UTM TOP 5 badge · 리드 테이블 8컬럼
  - 기본 기간: 오늘 ~ 30일 전 (`todayIso(-30)` ~ `todayIso(0)`)
  - CSV 다운로드는 anchor href 로 직접 트리거 → 브라우저 "다운로드 허용 필요" 팝업 유발 가능 (보안 정책 준수)
- `app/admin/partners/page.tsx` 헤더에 "리드 대시보드" 링크 버튼 추가 (ListOrdered 아이콘)

### 세션 #15 — 2026-04-18 ((E) /admin/partners Chrome MCP E2E 검증)
- **Task #42 — 2단계 검증 후 5/5 PASS**
  1. 비-admin 1차 — UI `AuthGuard` 차단 + API `GET /api/admin/partners` → 403
  2. `scripts/sql-exec.py` 로 soulmaten7@gmail.com → `role='admin'` 승격 (`UPDATE public.users ... RETURNING`)
  3. 재로드 후 UI 렌더 — 헤더/새로고침/파트너 추가 버튼 표출
  4. 리스트 2건 표출 — `test` + slot 칩 2종 (home-row3-left#1, toolbox-category-exchange#1), `test-asset` + home-sidebar-bottom#1
  5. 폼 POST — `qa-test-bank` / "QA 테스트 은행" 최소 필드로 생성 → 성공 배너 + 리스트 3번째 row 즉시 반영
- 검증용 QA 데이터 유지 (Phase 1 = DELETE 없음, 추후 SQL로 제거 가능)
- 스크린샷 저장 · Task #42 완료

### 세션 #15 — 2026-04-18 ((E) /admin/partners 최소 CRUD — Phase 1 = 추가)
- **신규 API `app/api/admin/partners/route.ts`** (service_role, `requireAdmin` 헬퍼로 admin 검증 후 create)
  - GET: partners 전체 + partner_slots 조인 (priority desc, created_at desc) — 슬롯 매핑 병합
  - POST: slug 정규식(`^[a-z0-9-]+$`) 검증 / features JSON 파싱·배열 검증 / country 기본 'KR' / 중복 slug `23505` 사용자 친화 메시지 / 선택적 `slot_key` + `slot_position` 주입 (매핑 실패 시 `slot_warning` 으로 경고만)
- **신규 페이지 `app/admin/partners/page.tsx`** (`AuthGuard minPlan='admin'`)
  - 헤더 (← 대시보드 링크 + 새로고침 + 파트너 추가 버튼) + 성공/에러 배너
  - 접힘/펼침 폼: 11 필드 + features JSON 텍스트영역 + 슬롯 드롭다운(`home-row3-left` / `home-sidebar-bottom` / `toolbox-sidebar` / `stock-detail-sidebar`) + position
  - 리스트 테이블: slug · 이름 · 카테고리 · 국가 · priority · 활성 뱃지 · 슬롯 칩 · `/partner/[slug]` 외부 링크
- **`app/admin/page.tsx` 대시보드** — "바로가기" 카드 섹션 추가 (Handshake 아이콘 + `/admin/partners` 딥링크)
- **Phase 2 남은 것**: 편집·삭제·슬롯 재매핑 UI, 리드 대시보드, 슬롯 키 확장, UTM 대시보드

### 세션 #15 — 2026-04-18 ((D) 홈 Row3 우측 하단 PartnerSlot placeholder 교체)
- `supabase/migrations/011_partner_seed_2.sql` — 두 번째 테스트 파트너 `test-asset` (테스트 자산운용) + `home-sidebar-bottom` 슬롯 매핑 (position 1)
  - DB 컬럼 픽스: `partner_slots.priority` → 실제 컬럼명 `position` 으로 자동 수정 후 재적용
- `components/home/HomeClient.tsx` — 회색 "PARTNER SLOT (W4)" placeholder div 제거 → `<PartnerSlot slotKey="home-sidebar-bottom" variant="card" />` 교체
- Chrome MCP 검증 PASS (commit becb74c) — 사이드바에 두 카드 세로 스택 (상: 테스트 증권 민트 / 하: 테스트 자산운용 주황), 회색 박스 완전 사라짐, 콘솔 Fast Refresh [LOG] 13건·에러 0건

### 세션 #15 — 2026-04-18 (W5 더미 데이터 제거 1차 — ComingSoonCard + 4개 위젯)
- `components/common/ComingSoonCard.tsx` 공통 스켈레톤 신설 (제목·아이콘·설명·eta 뱃지)
- 4개 홈 위젯 하드코딩 더미 제거 → ComingSoonCard 교체 (commit b8f007d, 6 files / +287 -97)
  - ProgramTrading (arb 215 / nonArb -108) → "KRX 데이터 연결 후"
  - GlobalFutures (S&P/NASDAQ/WTI/금 4건) → "외부 선물 API 연결 후"
  - WarningStocks (테스트A/B/C 3건) → "KRX 데이터 연결 후"
  - IpoSchedule (테크바이오 등 3건) → "공시 파이프라인 연결 후"
- Chrome MCP 검증 5/5 PASS — 더미 잔존물 0건, "데이터 준비 중" 4개, 300px 유지, console error W5 무관 1건
- ScreenerClient는 이미 실연결 상태라 손대지 않음
- **결정**: Task #38 EarningsCalendar / #39 EconomicCalendar → Phase 2 이관 (DART·ECOS 모두 '발표 예정' API 미제공, W4 리드 유입 검증 우선)
- 다음 순서 (D) 홈 잔여 PARTNER SLOT (W4) 회색 placeholder 교체 → (E) /admin/partners 최소 CRUD

### 세션 #14 — 2026-04-18 (W4 Partner-Agnostic Landing + E2E 검증)
- **W4 Partner-Agnostic Lead Gen 인프라 1차 완료** (commit 91eea5a, 11 files / +1322 insertions)
  - `supabase/migrations/010_partners.sql` — 4 테이블 + RLS (SELECT 공개 / leads·clicks INSERT 익명 허용 / 쓰기 service_role)
  - 테스트 시드: `slug='test' 테스트 증권`, features 3종 (수수료 0.015% / AI 리서치 무료 / 24시간 상담), 슬롯 2개 (`home-row3-left`, `toolbox-category-exchange`)
  - API 4종 (`/api/partners/[slug]`, `/slots`, `/leads`, `/clicks`) — curl 4/4 PASS, leads POST 시 IP SHA256 해시화
  - 페이지: `/partner/[slug]` Server + `PartnerLandingClient` Client (Hero + Features + 리드 폼 + 성공 박스 전환)
  - 컴포넌트: `PartnerSlot` (card/compact variant, UTM 쿼리 자동 주입) — 부모 'use client' 때문에 Client 컴포넌트로 전환
  - 교체: `HomeClient` Row3 좌측 + `CategorySection` `slug==='exchange'` 헤더 하단
- **Chrome MCP E2E 8/8 PASS** (Task #36)
  - `/partner/test` 풀 렌더링 + 폼 제출 → "신청 완료" 전환 / 홈 card 클릭 UTM `home-row3-left` 전달 / toolbox compact 클릭 UTM `toolbox-category-exchange` 전달 / slots API 실시간 응답
  - Console errors: Supabase auth-js `AbortError: Lock broken` 1건 (SDK 내부 탭 lock 경합, 기능 무관)
- **MVP 범위 밖 (Phase 2)**: `/admin/partners` CRUD · 리드 대시보드 · 슬롯 키 확장 · UTM 대시보드

### 세션 #13 — 2026-04-18 (Google OAuth + Chat API/UX + W2.5/W2.6/W3 실데이터)
- Google Cloud `Terminal` 프로젝트 + OAuth Client 발급 (soulmaten7-org)
- `scripts/auth-config.py` 신규 (PAT Management API `/config/auth` 래퍼)
- Supabase PATCH: `external_google_enabled=true` / client_id·secret / `site_url=http://localhost:3333` / `uri_allow_list=http://localhost:3333/**`
- Chrome MCP 검증: 로그인 버튼 → accounts.google.com 리다이렉트 (client_id 일치)
- **긴급 패치**: public.users RLS INSERT 정책 부재로 callback 의 users insert 조용히 차단 → 406 → UI 로그아웃 상태 증상 발견
- 수정: `CREATE POLICY "Users can insert own profile" FOR INSERT WITH CHECK (auth.uid() = id)` + 유령 `a7db2d46-…` soulmaten7@gmail.com 백필
- /auth/callback 진단 로그 강화 (commit 60fce18) — exchangeCodeForSession / users insert 실패 상세 로깅
- Task #26 Chat API 하네스 6/6 통과: 401 / 400×4 / 200 / 태그추출 3종 / 429 (Chrome MCP fetch 기반 E2E)
- 하네스 메시지 5건 hidden 처리
- Turbopack 캐시 손상 복구 절차 정립: `rm -rf .next node_modules/.cache` + `lsof -ti :3333 | xargs kill -9` + `npm run dev`
- **Task #27 완료** — `components/chat/ChatPanel.tsx` 디테일 보강
  - 글자수 카운터 `{len}/500` (450+ 주황, 490+ 빨강 볼드)
  - 에러 박스 아이콘(⚠) + 빨강 테두리 + 5초 유지
  - 429 rate-limit 전용 한글 안내 + 네트워크 오류 카피 개선
  - 전송 후 input 포커스 유지 (inputRef)
  - $태그 렌더 pill 배경 추가 (`bg-teal/10` + hover `/20`)
- commits: 60fce18 push 완료, `scripts/auth-config.py` + ChatPanel 개선 + 문서 4종 동기화 이 세션 마지막 commit 에서 포함
- **W2.5 완료** — `/api/stocks/compare` 신규 + `CompareTab` 전면 재작성
  - 2~5개 symbol 비교: 심볼 칩(추가/제거) + KPI 테이블 (시총·PER·PBR·ROE·EPS·BPS·6M수익률) + 정규화 라인차트 (시작일=100)
  - 공통 거래일 교집합 정렬, 5가지 고정 색상 (teal/red/blue/amber/violet)
- **W2.6 완료** — 뉴스·공시 라이브 엔드포인트 2종 + 탭 2종 재작성
  - `/api/stocks/disclosures`: DART list.json 라이브 (corp_code DB lookup) + 10종 유형 분류
  - `/api/stocks/news`: Google News RSS 라이브 (국가별 한/영 쿼리 + CDATA/HTML 정리)
  - DisclosuresTab: 기간 1/3/6/12개월 + 유형 필터 동적 카운트 + DART 원본 링크
  - NewsTab: 외부 RSS 기반 → `symbol` prop 필요 (NewsDisclosureTab 도 함께 업데이트)
- **W3 완료** — `/toolbox` 국가 필터 추가 (ToolboxClient + page.tsx)
  - `availableCountries` 동적 구성 (실제 데이터에 존재하는 국가만)
  - 1개 국가뿐이면 필터 숨김, 전체/KR/US/… 토글
  - 표시 건수 카운터 (전체 N · 표시 M)
- 신규 API: 3개 (`compare`, `disclosures`, `news`)
- 새 파일 없음 (기존 탭 재작성 + 엔드포인트 디렉토리 생성)

### 세션 #12 — 2026-04-18 (W2.3 보강 + W2.4 실적 탭 실데이터)
- W2.3 보강: DART corp_codes 3,959건 시딩 + ROE 계산식(EPS/BPS×100) 추가 → KPI 7/7 완성
- /api/dart/company 기업개황 정상 반환 (삼성전자 대표이사·주소·홈페이지·전화)
- W2.4 실적 탭: lib/dart-financial.ts + /api/stocks/earnings + EarningsTab 차트 교체
- DART fnlttSinglAcntAll 연결재무제표 파싱 (annual 4건, quarters 12건)
- 차트: 연간 grouped bar + 분기 line + 마진 line + 상세 테이블
- scripts/sql-exec.py: Supabase Management API PAT 래퍼 — 이후 모든 DDL 자동화 가능
- Chrome MCP 검증: KPI 8/8 실데이터, SVG 14개 + 테이블 정상
- commits: 5c6434e / d9102da / 88b2add push 완료

### 세션 #11 — 2026-04-18 (W2.3 재무·가격 DB 시딩)
- financials 191건 upsert (KIS API inquire-price, TOP 200 + 005930)
- stock_prices 52,969건 upsert (FDR DataReader 1Y OHLCV, 200종목 × ~265일, 실패 0)
- supabase/migrations/007_stock_prices.sql 신규 (테이블 + 3 인덱스 + RLS + 2 POLICY)
- Supabase Studio 직접 실행 (direct DB connection IPv4 미지원, pooler region 이슈 우회)
- Chrome MCP 검증: PER 32.91 / PBR 3.38 / EPS 6,564 / BPS 63,997 / 52주 53,700~223,000 KRW 전부 실데이터
- 미완: ROE (KIS 미제공, W2.4에서 계산식 추가), 배당수익률 (DART corp_codes 시딩 필요)
- commit: 31f443f push 완료

### 세션 #10 — 2026-04-18 (W2.1 종목 상세 8탭 재구축)
- **페이지 재작성**: `app/stocks/[symbol]/page.tsx` 다크 10탭 + AuthGuard → 라이트 8탭 + 비로그인 접근
- **8탭 표준**: 개요 / 차트 / 호가 / 재무 / 실적 / 뉴스·공시 / 수급 / 비교 (V3 스펙)
- **컴포넌트 분리**: StockHeader / StockDetailTabs / WatchlistToggle / 5개 신규 탭 (Overview/Orderbook/Earnings/NewsDisclosure/Compare)
- **URL `?tab=` 기반 탭 상태**: useSearchParams, 뒤로가기/앞으로가기 지원
- **라이트 테마 일괄 치환**: 5개 기존 탭(ChartTab/FinancialsTab/NewsTab/DisclosuresTab/SupplyDemandTab) + OrderBook + ExecutionList
- **보존 파일**: ShortSelling/Insider/Dividend/Sector/Macro 파일 유지 (라우팅만 제외)
- **Chrome MCP 검증**: darkResidueCount 0, 8탭 정확, URL 탭 전환 정상, 비로그인 접근 OK, 미국 종목 호가 안내문 확인
- **git**: 21 files changed, 커밋 `267e83b` push 완료

### 세션 #9 — 2026-04-18 (홈 Bento Grid 재구축 + Light Theme 전환)
- **W1.5 — Header/TickerBar 슬림화 + HomeClient Bento 초안:**
  - `Header.tsx` 191px 2단 → 단일 73px, 네비 6→3개 (홈/스크리너/도구함), 민트 리본 제거
  - `TickerBar.tsx` 다크 48px → 라이트 40px (`colorTheme: 'light'`, `isTransparent: true`)
  - `HomeClient.tsx` flex 3단 → `grid-cols-2` 5행 Bento Grid 초안
  - `WidgetCard.tsx` 신규 공통 래퍼 (bg-white + border-[#E5E7EB])
- **W1.6 — 5개 위젯 다크→라이트 + C안 T자형 레이아웃:**
  - 대상 위젯: VolumeSpike, MarketMiniCharts, ProgramTrading, GlobalFutures, WarningStocks
  - 색상 매핑: `bg-[#0D1117]` 제거, `bg-[#161B22]→bg-[#F5F7FA]`, `border-[#2D3748]→border-[#E5E7EB]`, `text-white→text-black`, 부가 `text-[#666666]`
  - MarketMiniCharts TradingView `colorTheme: 'light'` 전환
  - **C안 블룸버그 T자형 레이아웃**: 속보피드 `gridRow: span 3` (924px tall) | 경제/IPO/실적 세로 스택 (각 300px)
  - Row 6: 프로그램매매 / 글로벌선물 / 투자경고 각 col-span-2 3등분
- **Chrome MCP 검증:** darkResidueCount 0, 속보 y=853 height=924, 경제/IPO/실적 x=997 세로 스택, 페이지 높이 2,579px, 첫 화면 8개 위젯
- **git:** W1.5 + W1.6 통합 푸시 17 files changed (main)

### 세션 #8 — 2026-04-18 (V3 제품 스펙 전면 개정)
- **전략 방향 확정 (대화):**
  - "전업투자자 = 일반인 (상위 1%)" Aspirational Design 포지셔닝
  - Bloomberg/Koyfin Bento Grid + 단일 지속 채팅 + 투자자 도구함
  - PC-First → 이후 태블릿/모바일 반응형 (모듈식 설계)
  - 채팅은 전체 1개, 종목 분산 X (Density Over Distribution)
  - 데이터 100% 무료 소스로 95% 커버 — KIS 서버사이드로 비로그인 이용자도 실시간
  - 수익화 단일 모델: **Partner-Agnostic Lead Gen 만.** 구독/결제/Pro/AI 리포트/CSV — **전부 제거**
- **신규 문서:** `docs/PRODUCT_SPEC_V3.md` (11섹션), `docs/COMMANDS_V3_PHASE1.md`
- **V2 Spec 아카이브:** `docs/HOME_REDESIGN_V2_SPEC.md` 는 참고용으로만 유지
- **코드 변경:** 없음 (문서 세션)

### 세션 #7 — 2026-04-17 (stocks + link_hub DB 시딩)
- **stocks 테이블 시딩**: KOSPI 949건 + KOSDAQ 1,821건 = 총 2,780건 upsert 완료
- **link_hub 테이블 시딩**: 기존 더미 데이터 삭제 후 KR/US 56건 재삽입 완료
- **pykrx → FDR 전환**: KRX API 세션 인증 차단(LOGOUT 400) → FinanceDataReader로 교체
- **신규 파일**: `scripts/seed-stocks.py` (155 lines)
- **빌드**: `npm run build` 에러 없음 ✅
- **git**: `21fafe3` 커밋

### 세션 #6 — 2026-04-17 (Rate limit 복구 + /admin AuthGuard + 모델 선택 규칙)
- **Rate limit 복구**: `.env.local` `KIS_RATE_LIMIT_MS=400→60`, `WatchlistLive.tsx` 폴링 15초→10초
- **/admin AuthGuard 추가 (보안)**:
  - `AuthGuard.tsx`에 `'admin'` minPlan 타입 추가
  - admin 게이트는 `DEV_BYPASS=true` 여도 반드시 `role==='admin'` 체크 (보안 우선)
  - admin 차단 시 PaywallModal 대신 "접근 권한 없음" 전용 화면
  - `app/admin/page.tsx` 전체를 `<AuthGuard minPlan="admin">` 로 래핑
- **모델 선택 규칙 명문화**: `CLAUDE.md`에 Sonnet 기본 / Opus는 🔴 배지 붙은 경우만 실행 규칙 신설
- **빌드**: `npm run build` 에러 없음 ✅
- **git**: `18fcc48` push 완료 (세션 #6 — 12개 파일 변경)

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
- **stocks 테이블**: 2,780건 (KOSPI 949 + KOSDAQ 1,821)
- **link_hub 테이블**: 56건 (KR/US)
- **배포 상태**: 미배포
- **한투 API**: 실전 계좌 연동 완료 (첫 3일 3회/초 제한)
- **AI 분석**: GPT-4o-mini 연동 완료, 7일 캐시

## 세션 업데이트 지침
- 이 파일에 없는 숫자를 임의로 만들지 말 것
- 핵심 수치는 실제 확인된 수치만 기록
- 세션 히스토리는 가장 최근이 아래에 추가
