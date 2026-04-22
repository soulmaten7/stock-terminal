# STEP 52B — 중복·미사용 파일 정리

**실행 명령어**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태**
- 직전 커밋: STEP 52 (Chart 페이지 리팩토링)
- 빌드 통과 상태

**목표**
아래 3 카테고리의 파일들을 `git rm`으로 제거 후 커밋.

---

## Part A — 죽은 코드 삭제 (참조 0)

### A-1. `components/common/LoadingSkeleton.tsx`
- 전체 프로젝트에서 import 안 됨 (확인 완료)

### A-2. `/compare` 라우트 전체 (사이드바·위젯 어디서도 링크 안 됨)
- `app/compare/page.tsx`
- `components/compare/CompareClient.tsx`
- `components/compare/` 디렉토리 자체 제거

```bash
git rm components/common/LoadingSkeleton.tsx
git rm -r app/compare
git rm -r components/compare
```

---

## Part B — 구 Phase 명령서 정리 (STEP 워크플로우로 대체됨)

총 15개, 5,702줄. `PRODUCT_SPEC_V3.md`에서도 "참고" 수준 언급만 있음.

```bash
git rm docs/COMMANDS_PHASE1_HOME.md
git rm docs/COMMANDS_PHASE2_API.md
git rm docs/COMMANDS_PHASE3_PAGES.md
git rm docs/COMMANDS_PHASE4_MONETIZE.md
git rm docs/COMMANDS_V3_PHASE1.md
git rm docs/COMMANDS_V3_W1_5_HOME.md
git rm docs/COMMANDS_V3_W1_6_LIGHT_THEME.md
git rm docs/COMMANDS_V3_W2_1_STOCK_DETAIL.md
git rm docs/COMMANDS_V3_W2_2_OVERVIEW_DATA.md
git rm docs/COMMANDS_V3_W2_3A_DART_ROE.md
git rm docs/COMMANDS_V3_W2_3_DB_SEEDING.md
git rm docs/COMMANDS_V3_W2_4_EARNINGS.md
git rm docs/COMMANDS_V3_W3_TOOLBOX.md
git rm docs/COMMANDS_V3_W4_PARTNER.md
git rm docs/COMMANDS_V3_W5_DUMMY_REMOVAL.md
```

> **참고**: `STEP_*_COMMAND.md` 파일들은 **삭제 대상 아님** (CLAUDE.md 규칙: 프로젝트 아카이브 유지)

---

## Part C — 중복 매핑 엑셀 제거

STEP 50에서 `REFERENCE_PLATFORM_MAPPING.xlsx` 신설, 그 이전의 `DATA_SOURCES_MAPPING.xlsx`는 내용 중복됨.

```bash
git rm docs/DATA_SOURCES_MAPPING.xlsx
```

---

## Part D — 구 Phase 문서 참조 업데이트

### D-1. `docs/PRODUCT_SPEC_V3.md` 수정

아래 줄 삭제:
```markdown
| `docs/COMMANDS_PHASE1_HOME.md` ~ `PHASE4_MONETIZE.md` | 참고 — V3 에서는 `COMMANDS_V3_PHASE1.md` 가 신규 기준 |
```

그리고 문서 끝의 이 줄도 삭제:
```markdown
**문서 종료.** Phase 1 실행 명령어는 `docs/COMMANDS_V3_PHASE1.md` 참고.
```

→ 대신:
```markdown
**문서 종료.** 이후 모든 실행은 `docs/STEP_{N}_COMMAND.md` 파일로 전달됨.
```

### D-2. `docs/NEXT_SESSION_START.md` 수정

아래 줄 삭제 (393 근처):
```markdown
| Phase 1~4 명령서 | `docs/COMMANDS_PHASE1~4_*.md` |
```

297, 315 라인의 `docs/COMMANDS_V3_PHASE1.md` 참조는 그 블록이 과거 히스토리 맥락이면 함께 제거. 현재 활성 안내 블록이면 `docs/STEP_51_COMMAND.md ~ STEP_52_COMMAND.md 참고`로 교체.

---

## Part E — 빌드 검증

```bash
npm run build
```

에러 없어야 통과. (deleted 파일들은 import되지 않았음을 이미 확인했으나 재확인)

---

## Part F — 4개 문서 헤더 날짜 갱신

- `CLAUDE.md`
- `docs/CHANGELOG.md` — 블록 추가
- `session-context.md` — 블록 추가
- `docs/NEXT_SESSION_START.md`

### F-1. CHANGELOG.md 상단에 추가

```markdown
### 2026-04-22 세션 — STEP 52B 중복 파일 정리
- [x] 죽은 코드 제거: `components/common/LoadingSkeleton.tsx`, `/compare` 라우트
- [x] 구 Phase 명령서 15개 삭제 (PHASE1~4 + V3_W1~W5, 5,702 lines)
- [x] 중복 `DATA_SOURCES_MAPPING.xlsx` 제거 (REFERENCE_PLATFORM_MAPPING.xlsx로 대체됨)
- [x] PRODUCT_SPEC_V3.md · NEXT_SESSION_START.md 의 구 명령서 참조 정리
```

### F-2. session-context.md 상단에 추가

```markdown
### 2026-04-22 세션 — STEP 52B
- [x] 중복·미사용 파일 정리 (17개 파일 삭제)
```

---

## Part G — Git commit + push

```bash
git add -A && git commit -m "$(cat <<'EOF'
chore: STEP 52B — 중복·미사용 파일 정리

죽은 코드 제거:
- components/common/LoadingSkeleton.tsx (참조 0)
- app/compare/ (사이드바 링크 없음)
- components/compare/

구 Phase 명령서 정리 (STEP 워크플로우로 대체):
- docs/COMMANDS_PHASE1~4_*.md (4개)
- docs/COMMANDS_V3_PHASE1.md + V3_W1~W5 (11개)
총 15개 파일, 5,702 lines

중복 매핑 제거:
- docs/DATA_SOURCES_MAPPING.xlsx (REFERENCE_PLATFORM_MAPPING.xlsx로 대체됨)

문서 참조 업데이트:
- docs/PRODUCT_SPEC_V3.md · docs/NEXT_SESSION_START.md

※ STEP_*_COMMAND.md 파일들은 CLAUDE.md 규칙에 따라 아카이브로 유지
EOF
)" && git push origin main
```

---

## Part H — 검증

```bash
git log --oneline -5
ls docs/ | grep -c COMMANDS
ls docs/ | grep -c STEP_
```

- COMMANDS 파일: `0` 이어야 함
- STEP_ 파일: 이전 그대로 (줄어들면 안 됨)
