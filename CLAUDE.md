<!-- 2026-06-07 -->
# 운종(雲從) · UNJONG — Claude Code 지침서

@AGENTS.md

## 프로젝트 개요
**운종(雲從) · UNJONG** — **투자상품에 속지 않게 돕는 곳** · 정보 + 대화 + 허브 + 신뢰 4박자 플랫폼 (중심축 = 신뢰).
브랜드명: 운종 (UNJONG, 한자 雲從 코드 표기 X — 영문+한글만).
**V6 정체성 (2026-06-03 확정)**: 정확한 정보 + 솔직한 토론 + 검증된 신뢰. V5 구조(네이버 레이아웃 + 토스 카드 + Trustpilot 평가)는 계승, 중심축만 "편의(동선의 출발점)" → "신뢰(안 속는 곳)"로 재정렬. 마스터 비전: `docs/PRODUCT_SPEC_V6.md`.
거래 X — 정보·대화·허브·신뢰 역할만.

**수익 모델**:
- MVP 1.0 — 기본 정보 + 정제된 채팅·토론 (트래픽 확보)
- **MVP 2.0** — 상품·리딩방 평가 디렉토리 (Trustpilot 금융 버전) — 운종 진짜 차별화 (STEP 128 진입)
- Tier 1·2·3 인증 광고 시스템 (Sponsored ↔ 평가 명확 분리 — 추후)

**최신 비전 (2026-06-03 확정 · V6)**: `docs/PRODUCT_SPEC_V6.md` · 다음 세션 가이드: `docs/NEXT_SESSION_START.md`
**V4 비전 보존**: `docs/PRODUCT_SPEC_V4.md` · **V3 보존** (히스토리): `docs/PRODUCT_SPEC_V3.md`

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
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

**Opus가 필요한 경우** — Cowork이 명령어 줄 때 **🔴 Opus 권장** 배지를 명시:
- 🔴 원인 불명 빌드/런타임 에러 디버깅 (스택 트레이스로도 추적 어려울 때)
- 🔴 대규모 리팩토링·아키텍처 변경 (여러 파일 간 영향도 판단 필요)
- 🔴 복잡한 알고리즘 구현 (Cowork이 설계 못 한 부분)
- 🔴 레거시 코드 해독 후 수정 (의도 파악이 어려울 때)

**Opus 실행 명령어 (Cowork이 🔴 표시한 경우만):**
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus
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
- 기존 POTAL Supabase 프로젝트 URL/Key 절대 사용 금지 — 반드시 운종 전용 Supabase 프로젝트 (구 stock-platform 명) 사용
- 코드/기술 용어는 영어, 소통은 한국어
- 코딩 초보자 대상 — 기술 설명 간결하게, 명령어는 복붙 가능하게 만들어줄 것
- **OTMarketing CPA 작업은 여기서 하지 않는다** → `~/OTMarketing/` 별도 저장소 (2026-04-23 분리 완료, 상세: `docs/CROSS_REFERENCE.md`)
- 광고주 DB 수집·정산 로직은 본 프로젝트 영역 아님 — 투자 정보·차트·시그널·트레이딩 도구만 다룸

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
- [ ] **`docs/NEXT_SESSION_PLAYBOOK.md` 갱신** (다음 세션 마스터 인수인계 — HEAD 해시·STEP 번호·다음 STEP 후보·디자인 변경 등 반영)
- [ ] SESSION_KICKOFF.md `현재 커밋` 표기 갱신
- [ ] git push
- [ ] 빌드 에러 없는지 확인 (`npm run build`)

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
| 환경변수 | `.env.local` | API 키 (반드시 운종 전용 Supabase, 구 stock-platform 명) |

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
1. **`docs/NEXT_SESSION_PLAYBOOK.md` 읽기** ← **항상 이것부터** (디테일 마스터 인수인계 — 정체성·페이지 13개·디자인 시스템·STEP 88~135 이력·다음 STEP 후보·환경변수·자주 쓰는 명령어 전부 한 파일)
2. `docs/SESSION_KICKOFF.md` 보조 확인 (간략 요약 — PLAYBOOK 의 단축본)
3. `session-context.md` 확인 (TODO 가비지 컬렉션)
4. 사용자에게 오늘 할 P0 작업 제안 → 확인 후 명령어 작성

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
