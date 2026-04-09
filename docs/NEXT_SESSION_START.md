<!-- 2026-04-09 -->
# Stock Terminal — 다음 세션 시작 가이드

## 현재 상태 요약
- **프로젝트**: 글로벌 개인투자자용 통합 데이터 터미널 플랫폼
- **총 파일**: 120개 이상
- **페이지**: 13개
- **빌드 상태**: 정상 (dev 서버 localhost:3333)
- **배포 상태**: 미배포
- **한투 API**: 실전 계좌 연동 완료
- **AI 분석**: GPT-4o-mini 연동 완료

## 가장 최근 세션 — 세션 #2 (2026-04-09)
- Phase 1~4 전체 구현 완료
- 홈 3-layer 라이브스코어+채팅 컨셉 완성
- 한투 OpenAPI 4개 엔드포인트 연동
- 4개 신규 페이지 (뉴스·공시, 시장분석, 스크리너, 비교분석)
- AI 분석 GPT-4o-mini 테스트 성공
- Hydration mismatch 3건 수정

## 다음 할 일 (우선순위 순)

### 1순위 — 장중 검증 (09:00~)
1. **관심종목 실시간 변동 확인** — 한투 API /api/kis/price 10초 폴링이 정상 동작하는지
2. **수급 데이터 +0억 문제** — /api/kis/investor에서 외국인/기관 순매수가 0으로 나오는 문제 확인
3. **호가창/체결 데이터** — /api/kis/orderbook, /api/kis/execution 정상 응답 확인

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
