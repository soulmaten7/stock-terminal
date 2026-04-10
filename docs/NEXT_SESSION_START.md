<!-- 2026-04-11 -->
# Stock Terminal — 다음 세션 시작 가이드

## 현재 상태 요약
- **프로젝트**: 글로벌 개인투자자용 통합 데이터 터미널 플랫폼
- **총 파일**: 120개 이상
- **페이지**: 13개
- **빌드 상태**: 정상 (dev 서버 localhost:3333)
- **배포 상태**: 미배포
- **한투 API**: 4개 엔드포인트 전부 검증 완료 (4/10 종가 기준)
- **AI 분석**: GPT-4o-mini 연동 완료

## 가장 최근 세션 — 세션 #3 (2026-04-11, 토요일)
- 한투 API 4종 (/price, /investor, /orderbook, /execution) 전부 정상 확인
- lib/kis.ts rate limiter race condition 수정 (Promise chain serialize)
- 토큰 deduplication + 디스크 캐시 추가 (HMR 리로드 대응)
- RATE_LIMIT_MS 400ms → 1100ms (첫 3영업일 1건/초 제한)
- WatchlistLive 폴링 10초 → 15초

## 다음 할 일 (우선순위 순)

### 1순위 — 월요일 장중 (4/13, 09:00~) 실시간 검증
1. **관심종목 실시간 변동** — WatchlistLive 15초 폴링, 가격 blink 동작 확인
2. **수급 실시간 업데이트** — InstitutionalFlow 외국인/기관 TOP10 갱신 확인
3. **호가창/체결 라이브** — 종목 상세 페이지 실시간 데이터 확인
4. **동시 사용자 부하** — 여러 브라우저 탭 열어도 rate limit 안 걸리는지

### 2순위 — 4/15 이후 3영업일 제한 해제
5. RATE_LIMIT_MS를 60ms(20건/초)로 복구 — .env.local에 `KIS_RATE_LIMIT_MS=60` 추가
6. WatchlistLive 폴링 15초 → 10초 복구

### 2순위 — UI/기능 점검
4. TradingView 위젯 정상 동작 확인
5. 링크 허브 실제 링크 동작 확인
6. 로그인/회원가입 Supabase Auth 연동 테스트
7. 전체 페이지 UI 세부 점검

### 3순위 — 추가 연동
8. **토스페이먼츠** — 라이브 홈페이지 URL 생성 후 실제 API 키 발급 및 연동
9. **프로그램매매 데이터** — 한투 API에 없어서 KRX 크롤링 필요
10. **KRX 공매도 데이터** 크롤링
11. **SEC EDGAR API** 연동 (미국 주식)

### 4순위 — 수익화/운영
12. 광고주 배너 등록 시스템 완성
13. 관리자 페이지 완성
14. Make 자동화 5개 시나리오 세팅

## 미해결 사항
- 토스페이먼츠: 라이브 URL 필요 → 추후 진행
- 프로그램매매: 한투 API에 엔드포인트 없음 → KRX 크롤링 필요
- 장중 실시간 데이터 검증 미완료

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
