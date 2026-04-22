<!-- 2026-04-22 -->
# Stock Terminal — Claude Code 지침서

@AGENTS.md

## 프로젝트 개요
글로벌 개인투자자용 통합 데이터 터미널 플랫폼 — 전업투자자의 투자 환경을 일반 투자자에게 **완전 무료**로 제공, 수익은 **Partner-Agnostic Lead Gen** 만으로 발생. 구독/결제/Pro/AI 리포트/CSV — V3 에서 **전면 제외** (상세: `docs/PRODUCT_SPEC_V3.md`).

## 역할 분담 — 핵심 워크플로우

### Cowork (Claude AI 어시스턴트)
- 사용자와 대화하며 **무엇을 만들지** 결정
- 구체적인 명령어, 코드, 설정을 **직접 작성해서 전달**
- 문서 업데이트, 로그 기록, 다음 할 일 정리
- **실행은 하지 않음** — 명령어를 만들어서 Claude Code에게 넘기거나, 사용자에게 붙여넣기 안내

### Claude Code (터미널 CLI 에이전트)
- Cowork이 만든 명령어/코드를 **실제로 실행**
- 파일 수정, npm 실행, git commit/push, 서버 재시작
- 빌드 에러 확인, 테스트 실행

### 작업 방식
1. 사용자가 Cowork에게 원하는 것 말하기
2. Cowork이 → 명령어/코드/지시문 작성
3. 사용자가 → Claude Code 터미널에 붙여넣어 실행
4. 결과를 Cowork에게 공유 → 다음 단계 안내

> **한 줄 요약**: Cowork = 두뇌(설계·작성), Claude Code = 손(실행·빌드)

### Claude Code 모델 선택 규칙

**기본값: Sonnet 사용**
- 파일 수정, 빌드, git push, npm run 같은 "손" 작업은 Sonnet으로 충분
- 속도 빠르고 요금 저렴 (Opus의 약 1/5)

**실행 명령어 (기본 — Sonnet):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**Opus가 필요한 경우** — Cowork이 명령어 줄 때 **🔴 Opus 권장** 배지를 명시:
- 🔴 원인 불명 빌드/런타임 에러 디버깅 (스택 트레이스로도 추적 어려울 때)
- 🔴 대규모 리팩토링·아키텍처 변경 (여러 파일 간 영향도 판단 필요)
- 🔴 복잡한 알고리즘 구현 (Cowork이 설계 못 한 부분)
- 🔴 레거시 코드 해독 후 수정 (의도 파악이 어려울 때)

**Opus 실행 명령어 (Cowork이 🔴 표시한 경우만):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model opus
```

**표기 규칙:**
- Cowork이 제공하는 명령어 블록에 별도 표기 없음 → Sonnet 실행
- 명령어 블록 상단에 🔴 **Opus 권장** 표시가 있을 때만 Opus 실행

### 명령어 전달 방식 (파일 vs 인라인)

Cowork이 Claude Code에게 지시를 전달하는 2가지 방식. 상황에 따라 선택.

**📄 파일 방식** — `docs/STEP_N_COMMAND.md` 생성 후 참조

Cowork이 명령어 Markdown을 파일로 저장하고, 사용자는 Claude Code에서 `@docs/STEP_N_COMMAND.md 파일 내용대로 실행해줘`로 호출.

- 트리거:
  - 3단계 이상 작업 (여러 파일 수정)
  - 빌드 검증 + git commit/push 포함
  - 리팩토링·아키텍처 변경
  - 커밋 메시지까지 명시해야 하는 작업
- 장점: 긴 지시문 스크롤 없음, 재실행/롤백 용이, 설계 의도 파일로 보존, Git 히스토리와 별도로 "왜 이렇게 바꿨는가" 기록
- 파일명 규칙: `docs/STEP_{번호}_COMMAND.md` (번호는 연속)
- 파일 상단에 **실행 명령어** (Sonnet/Opus) + **목표** + **전제 상태(이전 커밋 해시)** 필수 명시
- 실행 후 파일은 그대로 유지 — 삭제하지 말 것. 프로젝트 아카이브 역할.

**💬 인라인 방식** — 채팅 내 코드 블록

- 트리거:
  - 단순 1~2파일 수정
  - 디버깅·탐색 (grep, log 확인)
  - 긴급 핫픽스
  - 명령어가 10줄 이내
- 장점: 즉시 대화로 수정 가능, 파일 생성 오버헤드 없음

**판단 기준**: "이 명령어를 한 달 뒤에 다시 봐야 할 가치가 있나?" → Yes면 파일, No면 인라인.

---

## 절대 규칙
- 빌드 깨진 코드 push 금지
- console.log 남긴 채 커밋 금지
- 한 번에 하나의 작업만 — 멀티태스킹 금지
- session-context.md에 없는 숫자 만들기 금지
- 기존 POTAL Supabase 프로젝트 URL/Key 절대 사용 금지 — 반드시 stock-platform 전용 Supabase 프로젝트 사용
- 코드/기술 용어는 영어, 소통은 한국어
- 코딩 초보자 대상 — 기술 설명 간결하게, 명령어는 복붙 가능하게 만들어줄 것

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

### 세션 시작 시 (Cowork이 처리)
1. **`docs/SESSION_KICKOFF.md` 읽기** ← 항상 이것부터 (전체 현황 + 우선순위 정리됨)
2. session-context.md 확인 (TODO 가비지 컬렉션)
3. 사용자에게 오늘 할 P0 작업 제안 → 확인 후 명령어 작성

### 작업 중 (역할 분담)
- **Cowork**: 코드 작성, 명령어 생성, 설계 결정
- **Claude Code**: Cowork이 만든 명령어 실행, 빌드 확인, git push
- 사용자는 Claude Code 터미널에 명령어 붙여넣기만 하면 됨

### 세션 종료 시 (Cowork이 처리)
1. 4개 문서 헤더 날짜 오늘로 업데이트
2. CHANGELOG.md에 이번 세션 변경사항 추가
3. session-context.md에 이번 세션 완료 블록 추가
4. NEXT_SESSION_START.md 최신 상태로 업데이트
5. Claude Code용 git push 명령어 제공 → 사용자가 실행

## 핵심 원칙
- "로그 없으면 미완료" — 빌드 성공해도, 테스트 통과해도, 기록 없으면 미완료
- "session-context.md에 없는 숫자 만들기 금지" — 근거 없는 수치 사용 금지
- "한 번에 하나의 작업만" — 멀티태스킹 금지
- "Cowork은 설계·작성, Claude Code는 실행" — 역할 절대 혼용 금지
- "명령어는 복붙 가능하게" — 사용자가 바로 Claude Code 터미널에 붙여넣을 수 있는 형태로 제공
