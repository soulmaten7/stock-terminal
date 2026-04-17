<!-- 2026-04-17 -->
# Stock Terminal — 다음 세션 시작 가이드

## 현재 상태 요약
- **프로젝트**: 글로벌 개인투자자용 통합 데이터 터미널 플랫폼
- **총 파일**: 120개 이상
- **페이지**: 13개
- **빌드 상태**: 정상 (dev 서버 localhost:3333)
- **배포 상태**: 미배포
- **한투 API**: 4개 엔드포인트 전부 검증 완료 (4/10 종가 기준)
- **AI 분석**: GPT-4o-mini 연동 완료
- **AuthGuard**: DEV_BYPASS = true (개발 모드 — 모든 페이지 잠금 해제 상태)
- **rate limit**: 3영업일 제한(~4/15) 종료 → RATE_LIMIT_MS 복구 필요

## 가장 최근 세션 — 세션 #5 (2026-04-17)
- AuthGuard `DEV_BYPASS = true` 추가 → 13개 페이지 paywall 전체 해제
- Turbopack "Failed to open database" 크래시 해결
  - `.fuse_hidden*` 파일 7개 삭제 (FUSE mount 잔존 파일)
  - `next.config.ts` distDir 시도 후 원복 (Next.js path.join 제약으로 절대경로 무효)
  - 서버 재시작 → `✓ Ready in 1175ms`, HTTP 200 정상
- git 커밋: 사용자 Mac 터미널에서 직접 push (커밋 `49abd20`, `da61662`)
- 4개 문서 전체 날짜 갱신 + 세션 #4~5 로그 완전 기록

## 세션 #4 (2026-04-11)
- 13개 페이지 Chrome MCP 체크리스트 테스트 완료
- 신규 `/api/kis/investor-rank` batch endpoint 추가 (TR ID: FHPTJ04400000)
- InstitutionalFlow: 10건 병렬 → 1건 batch 호출로 rate limit 안정화
- 발견된 이슈: DB 시딩 필요 + 8개 컴포넌트 더미 데이터 + /admin AuthGuard 누락

## 다음 할 일 (우선순위 순)

### 0순위 — 지금 당장 처리해야 할 항목

1. **rate limit 복구** (4/15 이후 이미 해제됨)
   - `.env.local`에 `KIS_RATE_LIMIT_MS=60` 추가 (20건/초로 복구)
   - `components/home/WatchlistLive.tsx` 폴링 15초 → 10초 복구

2. **DB 시딩**: `stocks` 테이블 (KOSPI/KOSDAQ 상장종목 전체)
   - KRX 공공데이터 또는 한투 API로 전체 종목 리스트 수집 후 Supabase insert

3. **DB 시딩**: `link_hub` 테이블 (카테고리별 투자 링크)
   - 기존 `lib/linkHub.ts` 데이터를 DB로 이전

4. **더미 데이터 제거 (8개 컴포넌트)**:
   - `ProgramTrading` — KRX 크롤링 필요 (한투 API 엔드포인트 없음)
   - `GlobalFutures` — 외부 API 연동 필요
   - `WarningStocks` — KRX 경고종목 API 연동
   - `EconomicCalendar` — 경제지표 일정 API 연동
   - `IpoSchedule` — IPO 일정 API 연동
   - `EarningsCalendar` — 실적발표 일정 API 연동
   - `ScreenerPage` — stocks 테이블 시딩 후 DB 쿼리로 교체
   - `ComparePage` — stocks 테이블 시딩 후 실데이터로 교체

5. **/admin AuthGuard 추가** (보안):
   ```tsx
   // app/admin/page.tsx 상단에 AuthGuard 감싸기
   <AuthGuard minPlan="pro">  {/* 또는 role=admin 체크 */}
     <AdminDashboard />
   </AuthGuard>
   ```

### 1순위 — 장중 실시간 검증 (평일 09:00~15:30)
1. **관심종목 실시간 변동** — WatchlistLive 폴링, 가격 blink 동작 확인
2. **수급 실시간 업데이트** — InstitutionalFlow 외국인/기관 TOP10 갱신 확인
3. **호가창/체결 라이브** — 종목 상세 페이지 실시간 데이터 확인
4. **동시 사용자 부하** — 여러 브라우저 탭 열어도 rate limit 안 걸리는지

### 2순위 — UI/기능 점검
5. TradingView 위젯 정상 동작 확인
6. 링크 허브 실제 링크 동작 확인
7. 로그인/회원가입 Supabase Auth 연동 테스트
8. 전체 페이지 UI 세부 점검

### 3순위 — 추가 연동
9. **토스페이먼츠** — 라이브 홈페이지 URL 생성 후 실제 API 키 발급 및 연동
10. **프로그램매매 데이터** — 한투 API에 없어서 KRX 크롤링 필요
11. **KRX 공매도 데이터** 크롤링
12. **SEC EDGAR API** 연동 (미국 주식)

### 4순위 — 수익화/운영
13. 광고주 배너 등록 시스템 완성
14. 관리자 페이지 완성 + AuthGuard 추가
15. Make 자동화 5개 시나리오 세팅

### 프로덕션 배포 전 필수
- [ ] `AuthGuard.tsx`: `DEV_BYPASS = true` → `false` (또는 해당 줄 삭제)
- [ ] 환경변수 프로덕션용 설정 확인
- [ ] `console.log` 전체 제거
- [ ] Vercel 배포 설정

## 미해결 사항
- 토스페이먼츠: 라이브 URL 필요 → 추후 진행
- 프로그램매매: 한투 API에 엔드포인트 없음 → KRX 크롤링 필요
- 장중 실시간 데이터 검증 미완료
- `/admin` AuthGuard 누락 (보안 이슈)

## 알려진 환경 이슈 (샌드박스 전용, 운영 무관)
- **Turbopack FUSE mount 충돌**: `.fuse_hidden` 파일이 생기면 서버 재시작 전 삭제 필요
- **git 커밋**: 샌드박스에서 `.git/index.lock` 삭제 불가 → Mac 터미널에서 직접 `rm -f .git/index.lock && git add -A && git commit && git push`

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
