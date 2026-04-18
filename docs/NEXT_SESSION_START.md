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
- **수익화**: Phase 1 = 광고주 독립적 랜딩페이지 + Lead Gen (5~10만원/건), Phase 2 = Pro 구독, Phase 3 = 광고 확장

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

## 가장 최근 세션 — 세션 #8 (2026-04-18)
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
10. **토스페이먼츠** — 라이브 홈페이지 URL 생성 후 실제 API 키 발급 및 연동
11. **프로그램매매 데이터** — 한투 API에 없어서 KRX 크롤링 필요
12. **KRX 공매도 데이터** 크롤링
13. **SEC EDGAR API** 연동 (미국 주식)

### 4순위 — 수익화/운영
14. 광고주 배너 등록 시스템 완성
15. 관리자 페이지 실제 기능 완성 (현재는 껍데기 + 게이트만 완료)
16. Make 자동화 5개 시나리오 세팅

### 프로덕션 배포 전 필수
- [ ] `AuthGuard.tsx`: `DEV_BYPASS = true` → `false` (또는 해당 줄 삭제)
- [ ] 환경변수 프로덕션용 설정 확인
- [ ] `console.log` 전체 제거
- [ ] Vercel 배포 설정

## 미해결 사항
- 토스페이먼츠: 라이브 URL 필요 → 추후 진행
- 프로그램매매: 한투 API에 엔드포인트 없음 → KRX 크롤링 필요
- 장중 실시간 데이터 검증 미완료

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
