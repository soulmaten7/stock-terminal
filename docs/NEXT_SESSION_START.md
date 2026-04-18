<!-- 2026-04-18 -->
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

## 가장 최근 세션 — 세션 #10 (2026-04-18)
- **W2.1 종목 상세 8탭 재구축** — 기존 `app/stocks/[symbol]/page.tsx` 다크 10탭 + AuthGuard → 라이트 8탭 + 비로그인 접근
- **V3 표준 8탭**: 개요 / 차트 / 호가 / 재무 / 실적 / 뉴스·공시 / 수급 / 비교
- **Server/Client 분리**: StockHeader / StockDetailTabs / WatchlistToggle / OverviewTab / OrderbookTab / EarningsTab / NewsDisclosureTab / CompareTab
- **URL `?tab=` 기반 탭 상태** (뒤로가기/앞으로가기 지원)
- **라이트 테마 일괄 치환**: 5개 기존 탭 + OrderBook + ExecutionList
- **보존 파일**: ShortSelling/Insider/Dividend/Sector/Macro (파일 유지, 라우팅만 제외)
- **Chrome MCP 검증 통과**: darkResidueCount 0, URL 탭 전환 정상, 비로그인 접근 OK
- **git**: 21 files changed, 커밋 `267e83b` push 완료

## 다음 세션 우선 작업 — W2.2 (개요 탭 실데이터 + DART 인프라)
- 명령어 파일: `docs/COMMANDS_V3_W2_2_OVERVIEW_DATA.md`
- 범위: `/api/stocks/overview` 집계 API + `/api/dart/company` 기업개황 + `lib/dart.ts` + `006_dart_corp_codes.sql` + `seed-dart-corpcodes.py` + OverviewTab 실데이터 연동
- DART 키 없어도 KPI 7개 (배당 제외) + 기본 정보 fallback 동작 — **키 발급은 선택**

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
