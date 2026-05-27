<!-- 2026-04-23 -->
# Stock Terminal — 새 세션 즉시 시작 파일

> 이 파일을 처음부터 끝까지 읽으면 바로 작업 시작 가능.
> **Last refreshed**: 2026-04-23 (STEP 87 완료 · 세션 #24 · OTMarketing 분리 직후)
> **실행 환경**: Mac 로컬 `~/stock-terminal` 에서 직접 실행 (샌드박스/외장하드 환경 종료)
> 세션이 끝날 때마다 이 파일 섹션 2~5 반드시 업데이트할 것.

---

## 1. 나는 누구고 이건 무슨 프로젝트인가

- **나(Cowork)**: 설계·작성 담당. 코드와 명령어를 만들어서 사용자에게 전달.
- **Claude Code**: 사용자가 터미널에서 실행하는 CLI. 실제 파일 수정·빌드·git push 담당.
- **사용자**: 코딩 초보. Claude Code 터미널에 명령어 붙여넣기만 하면 됨.

**프로젝트**: 글로벌 개인투자자용 통합 주식 데이터 터미널
**포지셔닝 (V3)**: "전업투자자 = 일반인 (상위 1% 지향)" — Aspirational Design
**수익 모델 (V3 단일)**: **Partner-Agnostic Lead Gen 만.** 구독/결제/Pro/AI 리포트/CSV 일절 없음.
**기술 스택**: Next.js 16 + TypeScript + Tailwind CSS + Supabase + Zustand + Recharts + TradingView + lightweight-charts
**데이터 소스**: 100% 무료 (DART/KRX/KIS/FDR/Naver/ECOS/Yahoo Finance/SEC EDGAR) — KIS 서버사이드 실시간 연동 완료
**배포**: Vercel + Supabase Cloud (**현재 미배포** — 이번 세션 P0)
**저장소**: https://github.com/soulmaten7/stock-terminal.git

---

## 2. 현재 프로젝트 상태 (2026-04-23 STEP 87 완료 기준)

| 항목 | 상태 |
|------|------|
| 최신 STEP | 87 (섹터 API 핫픽스 + 반응형 + 호가창 동기화) |
| 최신 커밋 | `1f46fa3` (docs: session-handoff bootstrap) |
| 빌드 | ✅ 클린 · TypeScript 0 오류 · console.log 0 |
| ESLint | ⚠️ `set-state-in-effect` 63건 비차단 경고 (별도 STEP 예정) |
| 배포 | ❌ 미배포 (P0) |
| AuthGuard | `DEV_BYPASS = true` (admin 게이트는 DEV_BYPASS 무시하고 role 검증) |
| Rate limit | ✅ `KIS_RATE_LIMIT_MS=60` (20건/초) |
| 한투 API | 7개 엔드포인트 전부 검증 완료 |
| DART | corp_codes 3,959건 · financials 576건 |
| AI 분석 | GPT-4o-mini 7일 캐시 (종목 AI 분석 전용) |

**DB 시딩 누계 (이미 완료, 반복 금지)**:
- `stocks` 2,780건 (KOSPI 949 + KOSDAQ 1,821)
- `link_hub` 56건 (KR/US)
- `financials` 576건 / `stock_prices` 54,899건
- `supply_demand` 3,000건 / `dividends` 790건 / `quant_factors` 200건
- `dart_corp_codes` 3,959건

---

## 3. 홈 대시보드 5섹션 구조 (V3 기준, STEP 82 확정)

| # | 섹션 | 구성 위젯 |
|---|------|----------|
| 1 | 트레이딩 터미널 | Watchlist · Chart · OrderBook · Tick · StockDetailPanel |
| 2 | Pre-Market & Global | BriefingWidget · GlobalIndicesWidget(17지표) |
| 3 | Discovery | ScreenerExpandedWidget(6프리셋) · MoversPairWidget · Volume · NetBuy |
| 4 | Market Structure | SectorHeatmapWidget(KR/US) · ThemeTop10Widget |
| 5 | Information Streams | NewsStream · DisclosureStream(KR/US) · EconCalendar |

**전역 기능**: FloatingChat v3 (2상태 · 좌/우 토글 · persist) · selectedSymbolStore (Zustand persist) · StockDetailPanel 4탭 (종합/재무/공시/뉴스)

**신규 풀스크린 페이지 (STEP 86)**: `/market-map` · `/themes` · `/disclosures`

### 풀스크린 페이지 전체 목록 (10종 + Admin/Partner)

| 경로 | 역할 | 비고 |
|------|------|------|
| `/chart` | TradingView 풀차트 | 종목 선택 시 selectedSymbolStore 공유 |
| `/orderbook` | 호가창 + 체결 전용 뷰 | KIS 실시간 |
| `/screener` | 스크리너 풀뷰 | 6프리셋 · 커스텀 필터 |
| `/movers/price` · `/movers/volume` | 등락률 / 거래량 TOP | KIS ranking API |
| `/net-buy` | 외국인·기관 수급 | 추후 `/investor-flow` 흡수 예정 |
| `/market-map` ⭐ | 시장 지도 (신규 STEP 86) | 섹터 히트맵 확장 |
| `/themes` ⭐ | 테마 TOP10 (신규 STEP 86) | 상승 테마 랭킹 |
| `/disclosures` ⭐ | 공시 스트림 (신규 STEP 86) | KR live · US TODO |
| `/news` · `/calendar` · `/briefing` | 뉴스 / 경제캘린더 / 프리마켓 브리핑 | Information Streams 확장 |
| `/global` · `/ticks` | 글로벌 지수 · 체결 틱 | Pre-Market & Global 확장 |
| `/chat` · `/analysis` | FloatingChat 풀뷰 · AI 분석 | GPT-4o-mini 7일 캐시 |
| `/admin/partners` · `/partner/[slug]` | 파트너 관리 / 파트너 랜딩 | 수익 모델 인프라 |

---

## 4. 다음 세션 P0 (진짜 블로커만)

### 4-1. Vercel 첫 배포
- 환경변수 점검: `KIS_APP_KEY` / `KIS_APP_SECRET` / `DART_API_KEY` / `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` / `OPENAI_API_KEY`
- Supabase RLS 재검증: `watchlists` · `chat_messages` · `partners` · `partner_leads` · `partner_clicks`
- Vercel 배포 → 실도메인 연결 (도메인 미정)
- Chrome MCP 로 배포본 E2E 검증 (홈 5섹션 렌더 + 실데이터 도달)

### 4-2. DisclosureStreamWidget US 실데이터 연결
- SEC EDGAR 최근 8-K 스트림 API 신설 (`/api/stocks/disclosures` US 분기)
- 현재 KR(DART)은 live, US는 TODO 상태

### 4-3. GlobalIndicesWidget Sparkline
- Yahoo Finance 7일 히스토리 연결 (현재 실시간 값만 있고 trend mini-chart 없음)

### 4-4. 문서 self-update 루틴 정착
- **세션 종료 시 이 파일(SESSION_KICKOFF.md) 섹션 2~4 반드시 갱신**
- 과거 20+ 세션 동안 누락돼 2026-04-17 기준으로 고착돼 있었음 (2026-04-23 본 리프레시로 해소)
- 종료 루틴 체크리스트는 섹션 11 참조

### 4-5. ESLint cleanup (별도 STEP)
- `react-hooks/set-state-in-effect` 63건 일괄 정리
- 비차단이지만 코드 품질 부채로 누적 중

---

## 5. P1/P2/P3 로드맵 (참고용, 우선순위 낮음)

### P1 — 배포 후
- 장중 실시간 검증 (평일 09:00~15:30): 관심종목 변동 · 수급 갱신 · 호가창/체결
- 링크 허브 실제 링크 클릭 동작 확인
- 전체 페이지 UI 세부 점검

### P2 — 다음 주+
- KRX 크롤링 (프로그램매매 + 공매도 데이터)
- SEC EDGAR 확장 (미국 종목 상세 공시 8-K/10-Q/10-K 구조화)
- `/investor-flow` → `/net-buy` 탭 흡수
- 경제캘린더 API 소스 결정 (네이버증권 vs Investing.com vs 한경컨센서스)
- **DEV_BYPASS = false** 전환 후 프로덕션 모드

### P3 — 2주+
- Make 자동화 5개 시나리오 (리드 전송/정산)
- 모바일/태블릿 반응형
- 시장 지도 Finviz Treemap 재구현
- 글로벌 지수 V2 (스파크라인 · 상관계수 · VKOSPI)

### P4 — 1개월+
- 일본(TSE) / 홍콩(HKEX) 시장
- 영어 버전 글로벌 확장

---

## 6. 핵심 파일 위치

| 파일 | 경로 | 용도 |
|------|------|------|
| 이 파일 | `docs/SESSION_KICKOFF.md` | 새 세션 즉시 시작용 |
| 다음 세션 가이드 | `docs/NEXT_SESSION_START.md` | 최신 상태 요약 + 다음 할 일 |
| Claude 지침 | `CLAUDE.md` | 역할 분담 + 절대 규칙 |
| 개발 명령서 | `CLAUDE_CODE_INSTRUCTIONS.md` | 전체 기능 명세, DB 스키마 |
| 제품 스펙 V3 | `docs/PRODUCT_SPEC_V3.md` | V3 확정 스펙 |
| 비즈니스 전략 | `docs/BUSINESS_STRATEGY.md` | Partner-Agnostic Lead Gen 수익 모델 |
| 시스템 설계 | `docs/SYSTEM_DESIGN.md` | 아키텍처, API 현황 |
| 프로젝트 맥락 | `session-context.md` | TODO, 히스토리, 핵심 수치 |
| 변경 이력 | `docs/CHANGELOG.md` | 세션별 변경사항 |
| V3 릴리스 노트 | `docs/V3_RELEASE_NOTES.md` | STEP 82 대시보드 V3 완성 |
| 대시보드 스펙 | `docs/DASHBOARD_SPEC_V3.md` | 5섹션 레이아웃 |
| DB 스키마 | `supabase/migrations/001_initial_schema.sql` | Supabase 테이블 정의 |
| 환경변수 | `.env.local` | API 키 (반드시 stock-platform 전용 Supabase, git push 금지) |
| 한투 API 유틸 | `lib/kis.ts` | rate limiter, 토큰 캐싱 |
| AuthGuard | `components/auth/AuthGuard.tsx` | DEV_BYPASS 위치 |

---

## 7. 알아야 할 기술 이슈

### FUSE mount + Turbopack 충돌 (샌드박스 전용)
- **증상**: `Failed to open database - Operation not permitted`
- **해결**: `.fuse_hidden*` 파일 삭제 후 서버 재시작
  ```bash
  find . -name ".fuse_hidden*" -delete 2>/dev/null; npm run dev
  ```
- **운영 환경엔 영향 없음** (Vercel 배포 후 사라지는 문제)

### git 커밋 (샌드박스 전용)
- 샌드박스에서 `.git/index.lock` 삭제 불가 → Mac 터미널에서 직접 실행
  ```bash
  rm -f .git/index.lock
  git add -A
  git commit -m "커밋 메시지"
  git push
  ```

### Next.js 16 Turbopack 캐시 손상 복구
- `rm -rf .next node_modules/.cache && lsof -ti :3333 | xargs kill -9 && npm run dev`

### yahoo-finance2 v3 인스턴스화 (STEP 87 핫픽스)
- v3부터 `new YahooFinance()` 인스턴스화 필수 (default export 직접 호출 금지)

---

## 8. 한투 API 엔드포인트 현황 (7개 전부 검증)

| 엔드포인트 | TR ID | 용도 |
|-----------|-------|------|
| /api/kis/price | FHKST01010100 | 종목 현재가 |
| /api/kis/investor | FHKST01010900 | 외국인/기관 수급 |
| /api/kis/orderbook | FHKST01010200 | 10호가 |
| /api/kis/execution | FHKST01010300 | 체결 내역 |
| /api/kis/investor-rank | FHPTJ04400000 | 외국인/기관 TOP10 batch |
| /api/kis/volume-rank | FHPST01710000 | 거래량 급등 TOP |
| /api/kis/chart | FHKST03010100 | 150일 일봉 |
| /api/kis/movers | /ranking/fluctuation | 등락률 TOP (up/down) |

---

## 9. 수익 모델 (V3 단일 — Partner-Agnostic Lead Gen)

| 요소 | 상태 |
|------|------|
| Partner Landing (`/partner/[slug]`) | ✅ 인프라 완료 (세션 #14) |
| PartnerSlot 8슬롯 | ✅ 홈·종목상세·스크리너·채팅·툴박스 |
| Admin 파트너 CRUD | ✅ 완료 (세션 #15) |
| 리드 대시보드 + CSV Export | ✅ 완료 (세션 #15) |
| 클릭/리드 집계 대시보드 | ✅ 완료 (세션 #15) |
| 파트너 편집·삭제·슬롯 재매핑 | ✅ 완료 (세션 #15) |
| Make 자동화 (리드 → Slack/이메일) | ⚠️ P3 |

**제외된 것 (V3 에서 영구 폐기)**: 구독(Premium/Pro) · 결제(토스페이먼츠/Paddle) · AI 리포트 판매 · CSV 판매 · À la carte

---

## 10. 세션 시작 루틴 (Cowork 체크리스트)

새 세션 시작 시 반드시 이 순서로:

- [ ] 이 파일(`docs/SESSION_KICKOFF.md`) 읽기
- [ ] `docs/NEXT_SESSION_START.md` 확인 (최신 상태)
- [ ] `session-context.md` 확인 (TODO 가비지 컬렉션)
- [ ] 사용자에게 오늘 작업할 P0 항목 제안
- [ ] 확인 받으면 → 코드/명령어 작성 → Claude Code용 복붙 명령어 제공
- [ ] 작업 완료 후 → 4개 문서 날짜 갱신 + 로그 추가
- [ ] Claude Code용 git push 명령어 제공

---

## 11. 세션 종료 루틴 (반드시 지킬 것)

- [ ] `CLAUDE.md` 헤더 날짜 오늘로
- [ ] `docs/CHANGELOG.md` 헤더 날짜 + 이번 세션 항목 추가
- [ ] `session-context.md` 헤더 날짜 + 세션 히스토리 블록 추가 + TODO 갱신
- [ ] `docs/NEXT_SESSION_START.md` 최신 상태로 전면 갱신
- [ ] **`docs/SESSION_KICKOFF.md` (이 파일) 섹션 2~5 업데이트** ← 과거 누락 반복 주의
- [ ] Claude Code용 git push 명령어 제공:
  ```bash
  rm -f .git/index.lock
  git add -A
  git commit -m "docs: STEP N 완료 + 문서 4종 갱신"
  git push
  ```
