<!-- 2026-04-09 -->
# Stock Terminal — Claude Code 지침서

@AGENTS.md

## 프로젝트 개요
글로벌 개인투자자용 통합 데이터 터미널 플랫폼 — 전업투자자의 투자 환경을 일반 투자자에게 월 구독료로 제공하는 서비스.

## 절대 규칙
- 빌드 깨진 코드 push 금지
- console.log 남긴 채 커밋 금지
- 한 번에 하나의 작업만 — 멀티태스킹 금지
- session-context.md에 없는 숫자 만들기 금지
- 기존 POTAL Supabase 프로젝트 URL/Key 절대 사용 금지 — 반드시 stock-platform 전용 Supabase 프로젝트 사용
- 코드/기술 용어는 영어, 소통은 한국어
- 코딩 초보자 대상 — 기술 설명 간결하게, 작업은 직접 해줘야 함

## 폴더 구조
```
/
├── app/                    # Next.js App Router 페이지
├── components/             # React 컴포넌트
├── lib/                    # 유틸리티, API, 상수
├── stores/                 # Zustand 상태관리
├── types/                  # TypeScript 타입 정의
├── supabase/               # DB 스키마 마이그레이션
├── public/                 # 정적 파일
├── docs/                   # 프로젝트 문서 (CHANGELOG, NEXT_SESSION_START)
├── .claude/hooks/          # 세션 종료 검증 hook
├── CLAUDE.md               # 이 파일 — Claude Code 지침서
├── CLAUDE_CODE_INSTRUCTIONS.md  # 전체 개발 명령서
└── session-context.md      # 프로젝트 맥락 + TODO
```

## 문서 업데이트 규칙
코드 작업 완료 시 반드시 아래 4개 파일의 헤더 날짜를 오늘로 업데이트:
1. `CLAUDE.md` — 첫 줄 날짜
2. `docs/CHANGELOG.md` — 첫 줄 날짜
3. `session-context.md` — 첫 줄 날짜
4. `docs/NEXT_SESSION_START.md` — 첫 줄 날짜

## 세션 종료 체크리스트
- [ ] 4개 문서 헤더 날짜 오늘로 업데이트
- [ ] CHANGELOG.md에 이번 세션 변경사항 추가
- [ ] session-context.md에 이번 세션 완료 블록 추가
- [ ] NEXT_SESSION_START.md 최신 상태로 업데이트
- [ ] git push
- [ ] 빌드 에러 없는지 확인

## 참조 파일 경로 테이블

| 파일 | 경로 | 용도 |
|------|------|------|
| 개발 명령서 | `CLAUDE_CODE_INSTRUCTIONS.md` | 전체 기능 명세, DB 스키마, 페이지별 상세 |
| 비즈니스 전략 | `docs/BUSINESS_STRATEGY.md` | 사업 전략, 투자심사 Q&A, AI전략, 수익모델, 확장계획, 핵심 결정 기록 |
| 시스템 설계 | `docs/SYSTEM_DESIGN.md` | 아키텍처, 페이지별 기능명세, API현황, 채팅설계, 인증/권한, 자동화, 배포체크리스트 |
| 프로젝트 맥락 | `session-context.md` | TODO, 히스토리, 핵심 수치 |
| 변경 이력 | `docs/CHANGELOG.md` | 세션별 변경사항 |
| 다음 세션 가이드 | `docs/NEXT_SESSION_START.md` | 최신 상태 요약 + 다음 할 일 |
| DB 스키마 | `supabase/migrations/001_initial_schema.sql` | Supabase 테이블 정의 |
| 환경변수 | `.env.local` | API 키 (반드시 stock-platform 전용 Supabase) |

## 🔒 하네스 규칙 (자동 강제 — 부탁이 아닌 시스템)

### 세션 종료 시 자동 검증
- Hook이 4개 문서 헤더 날짜를 자동 검증
- 오늘 날짜가 아니면 ❌ → 반드시 업데이트 후 push

### 가비지 컬렉션 (세션 시작 시 필수)
- 매 세션 시작 시 session-context.md의 TODO 섹션 점검
- 완료된 항목이 TODO에 남아있으면 즉시 제거
- 1주일 이상 지난 "대기 중" 항목은 날짜 갱신 필요 여부 확인

### 문서 4개 날짜 일치 규칙
- 코드 작업이 있는 세션에서는 4개 문서 헤더 날짜가 반드시 오늘이어야 함
- CLAUDE.md, docs/CHANGELOG.md, session-context.md, docs/NEXT_SESSION_START.md

## 세션 루틴

### 세션 시작 시
1. CLAUDE.md 읽기 (규칙 확인)
2. docs/BUSINESS_STRATEGY.md 읽기 (사업 전략 + 핵심 결정)
3. docs/SYSTEM_DESIGN.md 읽기 (시스템 설계 + 구현 현황)
4. session-context.md 읽기 (맥락 + TODO)
5. docs/NEXT_SESSION_START.md 읽기 (최신 상태)
6. 가비지 컬렉션: TODO에서 완료된 항목 정리

### 세션 종료 시
1. 코드 변경 있으면 → 4개 문서 헤더 날짜 오늘로 업데이트
2. CHANGELOG.md에 이번 세션 변경사항 추가
3. session-context.md에 이번 세션 완료 블록 추가
4. NEXT_SESSION_START.md 최신 상태로 업데이트
5. git push

## 핵심 원칙
- "로그 없으면 미완료" — 빌드 성공해도, 테스트 통과해도, 기록 없으면 미완료
- "session-context.md에 없는 숫자 만들기 금지" — 근거 없는 수치 사용 금지
- "한 번에 하나의 작업만" — 멀티태스킹 금지
