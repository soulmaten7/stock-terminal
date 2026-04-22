<!-- 2026-04-22 -->
# Stock Terminal — 다음 세션 시작 가이드

## ⚠️ 다음 세션에서 가장 먼저 할 일
1. `docs/PRODUCT_SPEC_V3.md` **반드시 읽기** — 이 문서가 V2 Home Redesign Spec을 대체함
2. `docs/COMMANDS_V3_PHASE1.md` 읽고 Phase 1 실행 순서 숙지
3. 기존 `docs/HOME_REDESIGN_V2_SPEC.md` 는 **참고용 아카이브** — V3이 우선순위

## V3 전략 요약 (세션 #8에서 확정)
- **포지셔닝**: "전업투자자 = 일반인 (상위 1% 지향)" — Aspirational Design
- **UI**: Bloomberg/Koyfin Bento Grid + 단일 지속 채팅 + 투자자 도구함(Link Hub)
- **4-페이지 심장부**: 홈(런처) / 종목상세(8탭) / 스크리너 / 투자자 도구함
- **채팅**: 전체 1개, 종목 분산 X, `$종목` 자동 태그 + 필터 + 인기 뱃지
- **데이터**: 100% 무료 소스 (DART/KRX/KIS/FDR/Naver/ECOS) — KIS 이미 서버사이드 실시간 연동
- **수익화**: **Partner-Agnostic Lead Gen 단일 모델.** 구독/결제/Pro/AI 리포트/CSV 일절 없음. Phase 1~3 모두 무료 놀이터 + 리드 수익

## 현재 상태 (2026-04-22 기준)

Phase 2-A 완료 + 세션 #23 레이아웃 정렬 대수술 완료 (Step 20~27, 9개 커밋).
**대시보드 오버플로우 완전 해결** — 3단 방어선(track `minmax(0,Nfr)` + item `minWidth: 0` + `overflow: hidden`).
Phase 2-B 작업 대기.

## 다음 세션 P0

- **Phase 2-B**: `/investor-flow` 페이지 내용을 `/net-buy` 내 탭으로 통합
  - 탭 구조: [종목별 TOP] [시장 동향 시계열]
  - URL은 `/net-buy`로 단일화, `/investor-flow`는 301 리다이렉트

## 다음 세션 P1

- **Phase 2-C**: 경제캘린더 홈 미니 위젯
  - API 소스 리서치 필요
  - 크기/배치 결정 필요 (현재 어느 위젯 옆?)

---

## 현재 상태 요약
- **프로젝트**: 글로벌 개인투자자용 통합 데이터 터미널 플랫폼
- **총 파일**: 120개 이상
- **페이지**: 13개 (V3에서 4페이지로 심장부 재정의)
- **빌드 상태**: 정상 (세션 #6 끝 기준 `npm run build` 에러 없음)
- **배포 상태**: 미배포
- **한투 API**: 7개 엔드포인트 전부 검증 완료 (price/orderbook/execution/investor/investor-rank/volume-rank/token)
- **AI 분석**: GPT-4o-mini 연동 완료
- **AuthGuard**: `DEV_BYPASS = true` (paywall 비활성), `'admin'` minPlan은 DEV_BYPASS 무시하고 role 검증
- **rate limit**: `KIS_RATE_LIMIT_MS=60` (20건/초로 복구 완료)
- **관심종목 폴링**: 10초 (3영업일 경과 후 복구 완료)
- **DB 시딩**: stocks 2,780건 + link_hub 56건 완료

## 다음 세션 P1 — 장중 재검증 (09:00-15:30 KST)

세션 #22에서 KIS API 빈 응답은 해결됐지만, 장마감 상태로 검증해서 일부 거동 재확인 필요:

### 재검증 항목
1. **volume-rank `spike` 값**: 장마감 후 `avgVolume == volume`이라 1.0x로만 표시됨. 장중에 실제 "거래량 급등" 배수(예: 3.5x) 제대로 계산되는지 확인
2. **movers `dir=down` 정렬**: 장마감 상태에서 일부 양수값 혼재 관찰됨. 장중 재호출 시 하락률 순으로 정상 정렬되는지 확인
3. **장중 vol_inrt 단위 실측**: 만약 KIS `vol_inrt`가 실제로는 % 단위였다면 Step 10 보수적 패치를 철회하고 `vol_inrt` 재활용 검토 (장중 실측 후 판단)

### 확인 방법
- `curl http://localhost:3333/api/kis/volume-rank | head -c 500` 로 장중 응답 확인
- Chrome MCP로 홈 R4 스크린샷 — spike 값이 1.0x 이상 다양하게 표시되는지

---

## 가장 최근 세션 — 세션 #22 (2026-04-21, 홈 대시보드 V1 → V1.5 재구성)
- **신규**: TrendingThemesWidget (KRX 섹터 TOP 5)
- **V1.5 홈 레이아웃 확정**:
  - Col 1: 마켓채팅 + 글로벌 지수 (폭 3fr → 2.5fr)
  - Col 2: 차트 + (관심종목 | 상승테마 1:1)
  - Col 3: 호가창 + 체결창
  - R4 discovery (5위젯 순서): 상승/하락 | 거래량 | 실시간수급 | DART | 뉴스
  - R4 높이 뷰포트 채움 `max(500px, calc(100vh - 280px))`
  - 단일 스크롤 레이어 아키텍처
- **Yahoo Finance 401 복구**: yahoo-finance2 v3 설치 + KOSPI 200(`^KS200`) 추가 + 30초 폴링 + 서버 캐시 30초
- **NetBuyTopWidget**: size/inline props 확장 (R4 대형 배치)
- **제거**: 레거시 RealtimeChatWidget, 발견피드/시장활성도 탭
- 8개 커밋 (c42ccb9 → 49d449f), STEP_4~8_COMMAND.md 5개 아카이브
- 데이터 검증: `/api/home/global` 9개 지수 전부 실데이터 (KOSPI 6,388.47 +2.72%, KOSPI 200 962.26 +2.83% 등)

## 세션 #21 (2026-04-21, Phase B 위젯 4종 실데이터 실시간 연동)
- **WatchlistWidget**: /api/kis/price × 5종목, 10초 폴링
- **OrderBookWidget**: /api/kis/orderbook + price 병렬, 5초 폴링, 5단 호가
- **TickWidget**: /api/kis/execution, 5초 폴링, 체결강도 실계산
- **RealtimeChatWidget**: Supabase Realtime INSERT 구독 + /api/chat/send POST, 로그인 토글
- "준비 중" 배지 전량 제거 · 13개 위젯 모두 실데이터 연동 (EconCalendar iframe 제외)
- 빌드 78/78 통과, 커밋 `6d3cd13` 푸시

## 세션 #20 (2026-04-20, KIS 차트 실데이터 + lightweight-charts)
- /api/kis/chart: FHKST03010100, 150일 일봉, symbol/period/from/to 지원
- ChartWidget: 한국 종목(6자리) → KIS+Lightweight v4 캔들차트 / 영문 → TradingView
- HomeClient: NewsFeed R4-5 span, EconCalendar R6 전체폭

## 세션 #19 (2026-04-20, 그리드 뷰포트 고정 레이아웃 v3)
- `gridTemplateRows: repeat(6, calc((100vh - 136px) / 3))` — 정확히 2페이지
- 1440×900, 1920×1080 모두 row3 bottom = 1×viewport ✓

## 세션 #18 cont (2026-04-20, 홈 대시보드 레이아웃 v2 완성)
- CommunityChatWidget → RealtimeChatWidget (인라인 WidgetCard, "실시간 채팅")
- 2페이지 CSS 그리드 완성 (6행, minHeight 200vh, 위젯 중요도 재배치)
- Sticky Header z-40 + TickerBar top-[72px] z-30
- 테이블형 위젯 9종 폰트 스케일업 완료
- 빌드 77/77 통과

## 세션 #15 이전 — (2026-04-18, W4 Phase 2 Partner CRUD 완성 — (D)(E)(F)(G)(H)(K)(I)(K-2)(J)(L))
- **W5 더미 제거 1차** — `components/common/ComingSoonCard.tsx` 공통 스켈레톤 + 4개 홈 위젯 교체 (ProgramTrading / GlobalFutures / WarningStocks / IpoSchedule) — commit b8f007d
- **(D) 홈 Row3 우측 하단 PartnerSlot 교체** (commit becb74c)
  - `supabase/migrations/011_partner_seed_2.sql` — 테스트 자산운용 `test-asset` + `home-sidebar-bottom` 슬롯 (position 1)
  - `HomeClient.tsx` 회색 PARTNER SLOT (W4) placeholder div 제거 → `<PartnerSlot slotKey="home-sidebar-bottom" variant="card" />`
  - Chrome MCP: 사이드바 두 카드 세로 스택 (테스트 증권 민트 / 테스트 자산운용 주황), 콘솔 에러 0
- **(E) /admin/partners 최소 CRUD (Phase 1 = 추가)**
  - `app/api/admin/partners/route.ts` — `requireAdmin()` 헬퍼(서버 세션 + role 검증) + GET(파트너+슬롯 조인) + POST(slug 정규식·features JSON·slot 매핑 옵션)
  - `app/admin/partners/page.tsx` — AuthGuard admin + 접힘/펼침 폼(11 필드 + 슬롯 드롭다운) + 리스트 테이블 + /partner/[slug] 바로가기
  - `app/admin/page.tsx` 대시보드에 "바로가기" 카드 추가 (Handshake → /admin/partners)
- **결정**: EarningsCalendar(#38) / EconomicCalendar(#39) → Phase 2 이관 (API 미제공, 리드 유입 검증 우선)
- **(E) Chrome MCP E2E 5/5 PASS** — 비-admin AuthGuard/API 403 차단 확인 → soulmaten7 admin 승격 → UI/리스트/폼 POST 전부 동작
- **(F) /admin/partners/leads 리드 대시보드 + CSV Export 완료**
  - GET `/api/admin/partners/leads` (partner_slug·from·to·q·format=json|csv)
  - 페이지: 필터 4종 + KPI 4카드 + UTM TOP5 + 리드 테이블 + CSV BOM 다운로드
  - 파트너 관리 헤더에 "리드 대시보드" 링크 추가
- **(G) 슬롯 키 확장 (stock-detail-bottom / screener-bottom) 완료**
  - 전략: `/stocks/[symbol]` + `/screener` 모두 사이드바 없음 → **하단 풀폭 슬롯** 패턴 (리팩토링 최소화 + 기존 key 보존)
  - `app/admin/partners/page.tsx` SLOT_KEYS 확장 (7옵션)
  - `app/stocks/[symbol]/page.tsx`: StockDetailTabs 아래 `<PartnerSlot slotKey="stock-detail-bottom" />`
  - `components/screener/ScreenerClient.tsx`: Pagination 아래 `<PartnerSlot slotKey="screener-bottom" />`
  - 동작: 슬롯 미매핑 시 `null` 리턴 → 그레이스풀 빈 상태
- **(H) UTM/클릭 대시보드 + PartnerSlot 트래킹 완료**
  - (H1) `PartnerSlot.tsx`: `sendBeacon` + `fetch({keepalive:true})` 폴백으로 `/api/partners/clicks` POST
  - (H2) `/api/admin/partners/clicks`: 4종 집계 (bySlot / byPartner / byDay / recent) + 리드 전환율 (click→lead)
  - (H2) `/admin/partners/clicks` 페이지: KPI 4카드 + 슬롯별·파트너별 2-col 테이블 + 일자별 ASCII bar (민트·오렌지) + 최근 100건
  - 교차 네비: partners ↔ leads ↔ clicks 세 페이지 상호 이동 버튼
- **(K) Chrome MCP E2E (G)(H) 검증 5/5 PASS**
  - /admin/partners/clicks 대시보드 초기 렌더 ✅
  - POST /api/partners/clicks 200 OK + DB insert ✅
  - 대시보드 실데이터: KPI / bySlot / byPartner / byDay ASCII bar / 최근 목록 전부 반영 ✅
  - /screener 하단 PartnerSlot null 렌더 ✅
  - /stocks/005930 하단 PartnerSlot null 렌더 ✅
  - Console 에러 0 (Supabase auth lock AbortError 기존 known)
- **(I) 파트너 편집·삭제 + 슬롯 재매핑 완료 (Phase 2 CRUD)**
  - PATCH/DELETE `/api/admin/partners/[id]` — 부분 필드 업데이트 + 하드 삭제 (CASCADE slots/clicks, SET NULL leads)
  - POST/DELETE `/api/admin/partners/[id]/slots` — 슬롯 매핑 추가/제거 (slot_key 또는 slot_id 스코프)
  - 어드민 UI: 편집 버튼(✏️) · 삭제 버튼(🗑️) + confirm · 슬롯 칩 ✕ · "+ 슬롯" 인라인 액션 · "액션" 컬럼 신설
  - Partner.id `string → number` 타입 정정 (BIGSERIAL 실제 타입과 일치)
- **(K-2) Chrome MCP E2E 5/5 PASS** — `qa-test-bank` id=5 대상
  - PATCH 200 (name·category·description·priority 반영) · POST slot 200 · 중복 409 · DELETE slot 200 · DELETE partner 200 → 목록 3→2행
  - Console 에러 0 (Supabase auth lock 기존 known)
  - 잔여 QA: `/e2e-chrome-mcp-test` 클릭 1건 + E2E lead 2건 → 다음 세션에서 cleanup 엔드포인트로 정리
- **(J) 채팅 사이드바 하단 PartnerSlot 추가 완료**
  - `components/chat/ChatPanel.tsx` — 입력 영역 아래 최하단에 `<PartnerSlot slotKey="chat-sidebar-bottom" variant="compact" />`
  - ChatPanel 은 ChatSidebar(1400px+) + FloatingChat(<1400px) 양쪽에서 공유 → 데스크톱·모바일 공통 반영
  - `app/admin/partners/page.tsx` SLOT_KEYS 에 `chat-sidebar-bottom` 옵션 추가 (드롭다운 8 옵션)
  - Chrome MCP 렌더 확인: test-asset → chat-sidebar-bottom 매핑 후 `/` 사이드바 하단에 compact 카드 표출, `utm_medium=chat-sidebar-bottom` 포함
- **(L) 클릭/리드 개별 삭제 API + 어드민 UI 완료**
  - 신규: `DELETE /api/admin/partners/clicks/[id]` + `DELETE /api/admin/partners/leads/[id]` (admin only, service_role)
  - 대시보드 🗑️ 버튼 주입 — `/admin/partners/clicks` 최근 클릭 테이블 + `/admin/partners/leads` 리스트 테이블 (confirm 가드 + deletingId 상태 + rowError 배너)
  - 슬롯 매핑 삭제는 (I) ✕ chip 으로 커버 → 별도 작업 없음
  - 영구 관리 수단: QA 데이터 + 향후 테스트 데이터 어드민이 UI 에서 직접 정리
- **다음 순서 (사용자 지침 "순서대로 다해")**:
  - W5 Phase 2: #38 EarningsCalendar (DART) → #39 EconomicCalendar (ECOS) 실데이터 연결
  - (선택) (L) Chrome MCP E2E 삭제 검증
  - 세션 마무리

## 이전 세션 — 세션 #14 (2026-04-18, W4 Partner-Agnostic Landing + E2E)
- **W4 Partner-Agnostic Lead Gen 인프라 출시** (commit 91eea5a — 11 files / +1322 insertions)
  - `supabase/migrations/010_partners.sql` — `partners`·`partner_slots`·`partner_leads`·`partner_clicks` 4 테이블 + RLS
  - 테스트 시드: `slug='test' 테스트 증권` + 슬롯 2개 (`home-row3-left`, `toolbox-category-exchange`)
  - API 4종: `/api/partners/[slug]` · `/slots` · `/leads` (이름/연락처/동의 검증 + IP SHA256 해시) · `/clicks` (fire-and-forget)
  - 페이지: `app/partner/[slug]/page.tsx` Server + `PartnerLandingClient` — Hero / Features 3카드 / 리드 폼 / "신청 완료" 전환
  - 컴포넌트: `PartnerSlot` (card/compact) — UTM 자동 주입 링크 `/partner/${slug}?utm_source=slot&utm_medium=${slotKey}`
  - `HomeClient` Row3 좌측 + `CategorySection` `slug==='exchange'` 헤더 하단 교체
- **Chrome MCP E2E 8/8 PASS** — `/partner/test` 렌더 + 폼 제출 → 성공 박스 / 홈 UTM=home-row3-left / toolbox UTM=toolbox-category-exchange / slots API 실시간 응답
- Console errors: Supabase auth-js `AbortError: Lock broken` (SDK lock 경합, W4 무관)
- **W4 Phase 2 (미구현)**: `/admin/partners` CRUD · 리드 대시보드 · 슬롯 키 확장 · UTM 대시보드

## 이전 세션 — 세션 #13 (2026-04-18, Day 2 종료 + Day 3 W2.5/W2.6/W3)
- **Google OAuth 실동작화** — Google Cloud `Terminal` 프로젝트 + OAuth Client 발급 → Supabase PATCH (`external_google_enabled=true` / client_id / secret / site_url / uri_allow_list)
- **Task #27 Chat UX 디테일 완료** — `components/chat/ChatPanel.tsx`
  - 글자수 카운터 `{len}/500` (450+ 주황, 490+ 빨강)
  - 에러 박스 아이콘(⚠) + 빨강 테두리 + 5초 유지
  - 429 rate-limit 전용 한글 안내
  - 전송 후 포커스 유지 (inputRef)
  - $태그 pill 배경 (`bg-teal/10` + hover `/20`)
- **W2.5 비교 탭 완료** — `/api/stocks/compare` 신규 + `CompareTab` 재작성
  - 2~5 심볼 비교: 심볼 칩 + 검색 드롭다운 + KPI 테이블 + 정규화 라인차트(시작일=100)
- **W2.6 뉴스·공시 완료** — DART list.json + Google News RSS 라이브
  - `/api/stocks/disclosures` + `/api/stocks/news` 신규
  - DisclosuresTab: 기간 1/3/6/12개월 + 유형 10종 분류
  - NewsTab: timeAgo + 출처 링크 (DB 시딩 불요)
- **W3 투자자 도구함 강화** — 국가(KR/US) 필터 + 표시 건수 카운터 추가
- **scripts/auth-config.py 신규** — PAT Management API `/config/auth` 래퍼 (get / get.providers / patch JSON)
- **🔥 긴급 패치 — public.users RLS INSERT 정책 부재**
  - `CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);`
  - 유령 auth.users 1건 백필 (`a7db2d46-…`)
- **/auth/callback 진단 로그 강화** (commit 60fce18) — `hasCode / errParam / errDesc / origin` + 단계별 redirect 분기
- **Task #26 Chat API 하네스 6/6 통과**:
  | 테스트 | 기대 | 결과 |
  |-------|------|------|
  | 빈 문자열 | 400 "내용 필요" | ✅ |
  | 공백만 | 400 "내용 필요" | ✅ |
  | 금지어 "씨발" | 400 "금지어 포함" | ✅ |
  | 501자 | 400 "500자 초과" | ✅ |
  | 500자 경계 | 200 inserted | ✅ |
  | $삼성전자 | 200 [005930] | ✅ |
  | $005930 | 200 [005930] | ✅ |
  | $SK하이닉스 | 200 [000660] | ✅ |
  | $없는회사 | 200 [] | ✅ |
  | 6회 연속 | 429 "분당 5개 초과" | ✅ |
  | 쿠키 없음 | 401 "로그인 필요" | ✅ |
- **하네스 메시지 5건 hidden 처리** (SQL UPDATE)
- **Next.js 16 Turbopack 캐시 손상 복구 절차 정립** — `rm -rf .next node_modules/.cache && kill -9 포트 && npm run dev`
- Mac 단축키 규칙 확정 — 이후 ⌥⌘I / ⌘R / ⌘⇧R 기준

## 세션 #18 완료 (2026-04-21) — 홈 대시보드 버그픽스 4종
- 레거시 채팅 파일 삭제 + LayoutShell 정리 (Bug 1)
- CommunityChatWidget fixed floating left:72px + 최소화 토글 (Bug 2)
- WidgetCard href+↗버튼 + 14위젯 href + 13 라우트 페이지 스텁 + VerticalNav 업데이트 (Bug 3)
- TradingView s.tradingview.com 도메인 + allow_symbol_change (Bug 4)
- 빌드: 77/77 OK

## 다음 세션 우선 작업 — 세 가지 중 선택

**(A) 더미 데이터 제거** (예상 1~2시간) — **W4 인프라 완료 상태, 이제 제품 투명성 확보 차례**
- ProgramTrading, GlobalFutures, WarningStocks, EconomicCalendar, IpoSchedule, EarningsCalendar, ScreenerPage 7종
- 각 컴포넌트 실 API 연결 또는 "곧 출시" 스켈레톤 UI 교체 (숫자 만들기 절대 금지)

**(B) W4 Phase 2 — Admin/리드 대시보드** (예상 2~3시간) — 수익화 운영화
- `/admin/partners` CRUD UI (테이블 시드만 되어있는 상태)
- 리드 열람·상태관리·CSV Export 대시보드
- UTM 원본별 클릭→리드 전환율 대시보드 (`partner_clicks` + `partner_leads` 조인)
- Make 자동화: 리드 생성 → Slack/이메일 알림 시나리오

**(C) 슬롯 키 확장** (예상 1~2시간) — 수익 노출면 확대
- 종목 상세 8탭 내 슬롯 자리 지정 (개요 KPI 하단, 비교 탭 상단 등)
- 채팅 사이드바 AD 영역에 PartnerSlot 치환
- 홈에 남은 "PARTNER SLOT (W4)" placeholder 교체 (현재 Row3 좌측만 실슬롯)

## 세션 #12 (2026-04-18)
- **W2.3 보강**: DART corp_codes 3,959건 + ROE 10.26% 개요 탭 표시 → KPI 7/7 완성
- **W2.4 실적 탭**: DART fnlttSinglAcntAll 파싱 → annual 4건(2022~2025) + quarters 12건
- 차트 3종(연간 bar / 분기 line / 마진 line) + 상세 테이블
- **scripts/sql-exec.py**: PAT 기반 DDL 자동화 파이프라인 구축 — 이후 Studio 불필요
- Chrome MCP 검증: KPI 8/8 실데이터 + 실적탭 SVG 14개 + 테이블 정상
- commits: 5c6434e / d9102da / 88b2add push 완료

## 세션 #9 (2026-04-18) — 홈 Bento Grid 재구축 + Light Theme 전환
- **W1.5 홈 재구축** — Header 191px→73px, 네비 6→3개, TickerBar 다크→라이트, HomeClient flex 3단→Bento Grid 초안, `WidgetCard.tsx` 신규
- **W1.6 라이트 테마 + C안 레이아웃** — 5개 위젯(VolumeSpike/MarketMiniCharts/ProgramTrading/GlobalFutures/WarningStocks) 다크→라이트 전환, TradingView `colorTheme: 'light'` 적용
- **블룸버그 T자형 레이아웃 (C안)** — 속보피드 `gridRow: span 3` 924px tall + 경제/IPO/실적 세로 스택(300px×3), Row 6 3등분
- **Chrome MCP 검증**: darkResidueCount 0, 좌표/높이 전부 C안 일치, 페이지 높이 2,579px, 첫 화면 8개 위젯
- **git**: W1.5 + W1.6 통합 푸시 (17 files changed, main 브랜치)

## 세션 #8 (2026-04-18)
- **V3 제품 스펙 확정** — `docs/PRODUCT_SPEC_V3.md` 신규 작성
- **전략 방향 확정** — Aspirational Design, Bento Grid, 단일 채팅, Partner-Agnostic Lead Gen
- **Phase 1 실행 명령어** — `docs/COMMANDS_V3_PHASE1.md` 작성
- **코드 변경 없음** (문서 세션)

## 세션 #7 (2026-04-17)
- **stocks 테이블 시딩**: KOSPI 949건 + KOSDAQ 1,821건 = 총 **2,780건** upsert 완료
- **link_hub 테이블 시딩**: KR/US **56건** 삽입 완료
- **pykrx → FinanceDataReader(FDR) 전환**: KRX API 세션 인증 차단 → FDR로 교체, 앞으로 KRX 데이터 작업은 FDR 기준
- **신규 파일**: `scripts/seed-stocks.py`
- **git**: `21fafe3` 커밋

## 세션 #6 (2026-04-17)
- Rate limit 복구: `.env.local` 400→60, `WatchlistLive.tsx` 15s→10s 폴링
- `/admin` AuthGuard 추가: `'admin'` minPlan, DEV_BYPASS 무시하고 role 체크
- 모델 선택 규칙 명문화: `CLAUDE.md` Sonnet 기본 / 🔴 Opus 배지 규칙

## 다음 할 일 (우선순위 순)

### 0순위 (V3) — 4-페이지 심장부 구현
**`docs/COMMANDS_V3_PHASE1.md` 참고하여 Claude Code에 순서대로 전달**

1. **Persistent Chat** (`app/layout.tsx` 에 배치 — 페이지 이동해도 채팅 유지)
2. **종목 상세 8탭** (`app/stocks/[symbol]/page.tsx` — 개요/차트/호가/재무/실적/뉴스공시/수급/비교)
3. **투자자 도구함** (`app/toolbox/page.tsx` — 10 카테고리 × 5+ 링크)
4. **Partner-Agnostic Landing** (`app/partner/[slug]/page.tsx` + `partners` DB 테이블)

### 0순위 (레거시) — 지금 당장 처리해야 할 항목

1. **더미 데이터 제거 (8개 컴포넌트)**:
   - `ProgramTrading` — KRX 크롤링 필요 (한투 API 엔드포인트 없음)
   - `GlobalFutures` — 외부 API 연동 필요
   - `WarningStocks` — KRX 경고종목 API 연동
   - `EconomicCalendar` — 경제지표 일정 API 연동
   - `IpoSchedule` — IPO 일정 API 연동
   - `EarningsCalendar` — 실적발표 일정 API 연동
   - `ScreenerPage` — stocks 테이블 시딩 후 DB 쿼리로 교체
   - `ComparePage` — stocks 테이블 시딩 후 실데이터로 교체

### 1순위 — 장중 실시간 검증 (평일 09:00~15:30)
1. **관심종목 실시간 변동** — WatchlistLive 10초 폴링, 가격 blink 동작 확인
2. **수급 실시간 업데이트** — InstitutionalFlow 외국인/기관 TOP10 갱신 확인
3. **호가창/체결 라이브** — 종목 상세 페이지 실시간 데이터 확인
4. **동시 사용자 부하** — 여러 브라우저 탭 열어도 rate limit(`60ms`) 안 걸리는지

### 2순위 — UI/기능 점검
5. TradingView 위젯 정상 동작 확인
6. 링크 허브 실제 링크 동작 확인
7. 로그인/회원가입 Supabase Auth 연동 테스트
8. 전체 페이지 UI 세부 점검
9. `/admin` role=admin 사용자로 실제 진입 가능한지 확인 (기존 유저 role 수동 업데이트 필요)

### 3순위 — 추가 연동
10. **프로그램매매 데이터** — 한투 API에 없어서 KRX 크롤링 필요
11. **KRX 공매도 데이터** 크롤링
12. **SEC EDGAR API** 연동 (미국 주식)
   - ~~토스페이먼츠 연동~~ → **V3 에서 제외 (구독 모델 폐기)**

### 4순위 — 수익화/운영
13. **관리자 파트너 관리 페이지 완성** (Partner-Agnostic Landing 인프라 — W4)
14. Make 자동화 5개 시나리오 세팅 (리드 전송/정산 자동화)
   - ~~광고주 배너 등록 시스템~~ → **V3 에서 제외 (Partner Slot 으로 대체)**

### 프로덕션 배포 전 필수
- [ ] `AuthGuard.tsx`: `DEV_BYPASS = true` → `false` (또는 해당 줄 삭제)
- [ ] 환경변수 프로덕션용 설정 확인
- [ ] `console.log` 전체 제거
- [ ] Vercel 배포 설정

## 미해결 사항
- 프로그램매매: 한투 API에 엔드포인트 없음 → KRX 크롤링 필요
- 장중 실시간 데이터 검증 미완료
- **레거시 제거 필요**: `components/home/AdColumn.tsx` 렌더 코드 (구 배너 광고 컬럼 — V3에서 폐기 합의된 것) — `HomeClient.tsx` 에서 `<AdColumn>` 블록 2개 제거

## 알려진 환경 이슈 (샌드박스 전용, 운영 무관)
- **Turbopack FUSE mount 충돌**: `.fuse_hidden` 파일이 생기면 서버 재시작 전 삭제 필요
- **git 커밋**: 샌드박스에서 `.git/index.lock` 삭제 불가 → Mac 터미널에서 직접 `rm -f .git/index.lock && git add -A && git commit && git push`

## Claude Code 실행 명령어 (세션 #6 부터 적용)

**기본 (Sonnet — 거의 모든 경우):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**🔴 Opus (Cowork이 명령어에 "🔴 Opus 권장" 표시한 경우만):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model opus
```

## 참조 파일 경로

| 파일 | 경로 |
|------|------|
| 개발 명령서 | `CLAUDE_CODE_INSTRUCTIONS.md` |
| 비즈니스 전략 | `docs/BUSINESS_STRATEGY.md` |
| 시스템 설계 | `docs/SYSTEM_DESIGN.md` |
| 페이지 프레임 스펙 | `docs/PAGE_FRAME_SPEC.md` |
| Phase 1~4 명령서 | `docs/COMMANDS_PHASE1~4_*.md` |
| Make 자동화 | `docs/MAKE_AUTOMATION.md` |
| Claude Code 지침 | `CLAUDE.md` |
| 프로젝트 맥락 | `session-context.md` |
| 변경 이력 | `docs/CHANGELOG.md` |
| DB 스키마 | `supabase/migrations/001_initial_schema.sql` |
| 환경변수 | `.env.local` |
| 한투 API 유틸 | `lib/kis.ts` |
| AuthGuard | `components/auth/AuthGuard.tsx` |
| 시딩 스크립트 | `scripts/seed-stocks.py` |
