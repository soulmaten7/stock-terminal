<!-- 2026-05-27 -->
# 세션 #25 종료 — 모든 문서 3번 교차검증 + git push

> **목표**: 세션 #25 종료. 6개 문서 갱신 완료. 3번 교차검증 후 git push.
> **세션**: #25 (Layer 0 + 21개 카드 디테일 완성)
> **전제**: STEP 88~99 + 95-A/C/D/E/E1/F 모두 push 완료 (`8890620`). Cowork 이 6개 문서 직접 갱신 완료.
> **유형**: 세션 종료 검증·push (작업 시간 15~30분)

---

## 실행 명령어 (Sonnet)

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

그 다음 Claude Code 에:

```
@docs/SESSION_25_CLOSE_COMMAND.md 파일 내용대로 실행해줘
```

---

## 핵심 — Cowork 이 이미 갱신한 6개 문서

| 파일 | 갱신 내용 |
|------|---------|
| `docs/_archive/SESSION_KICKOFF.md` | 전면 갱신 (2026-04-23 → 2026-05-27, 세션 #24 → #25 종료, 운종 브랜드 + Layer 0 완성) |
| `docs/CHANGELOG.md` | 세션 #25 종료 블록 추가 (STEP 95-A revert · 95-C · 95-D · 95-E · 95-E1 · 95-F · 96 · 97 · 98+99) |
| `session-context.md` | 세션 #25 후속 STEP 추가 + TODO Layer 별 재정의 (Last GC: 2026-05-27) |
| `docs/_archive/NEXT_SESSION_START.md` | 전면 갱신 (Layer 0 + 21개 카드 디테일 완성, Layer 1 진입 가이드) |
| `docs/_archive/PRODUCT_SPEC_V4.md` | 진행 상태 갱신 (Layer 0 ✅, Layer 1 ⏸️ 시작 예정), 섹션 11·14·15 갱신 |
| `CLAUDE.md` | 헤더 날짜 그대로 (`<!-- 2026-05-27 -->`) |

Claude Code 는 **검증 + git push** 만 담당.

---

## 작업 1 — 1차 교차검증: 4개 핵심 문서 헤더 날짜

```bash
cd ~/stock-terminal
echo "=== CLAUDE.md ==="
head -1 CLAUDE.md
echo ""
echo "=== docs/CHANGELOG.md ==="
head -1 docs/CHANGELOG.md
echo ""
echo "=== session-context.md ==="
head -2 session-context.md
echo ""
echo "=== docs/_archive/NEXT_SESSION_START.md ==="
head -1 docs/_archive/NEXT_SESSION_START.md
echo ""
echo "=== docs/_archive/SESSION_KICKOFF.md ==="
head -1 docs/_archive/SESSION_KICKOFF.md
echo ""
echo "=== docs/_archive/PRODUCT_SPEC_V4.md ==="
head -1 docs/_archive/PRODUCT_SPEC_V4.md
echo ""
echo "=== docs/BRAND_IDENTITY.md ==="
head -1 docs/BRAND_IDENTITY.md
```

**기대 결과**: 모든 파일 첫 줄 = `<!-- 2026-05-27 -->`

만약 다른 날짜 있으면 → Cowork 에게 보고.

---

## 작업 2 — 2차 교차검증: 운종 브랜드 일관성

```bash
cd ~/stock-terminal

# "Stock Terminal" 잔재 확인 (코드 + 문서)
echo "=== Stock Terminal 잔재 확인 ==="
grep -rn "Stock Terminal\|StockTerminal\|stock-platform" --include="*.tsx" --include="*.ts" --include="*.md" --include="*.json" . 2>/dev/null | grep -v ".next" | grep -v "node_modules" | head -20

# 한자 雲從 확인 (UNJONG 운종만 사용)
echo ""
echo "=== 한자 雲從 사용 확인 (문서·코드 따로) ==="
grep -rn "雲從" --include="*.tsx" --include="*.ts" . 2>/dev/null | grep -v ".next" | grep -v "node_modules" | head -10
echo "(코드에서 한자는 보통 0건이 정상. 문서·주석에서는 일부 허용)"
```

**기대 결과**:
- "Stock Terminal" → 0건 (또는 의도된 보존만, 예: PRODUCT_SPEC_V3.md, CHANGELOG 의 과거 기록)
- 코드 (.tsx/.ts) 에서 雲從 한자 → 0건 (UNJONG 운종만)

---

## 작업 3 — 3차 교차검증: 커밋 히스토리 일관성

```bash
cd ~/stock-terminal
echo "=== 세션 #25 커밋 히스토리 ==="
git log --oneline -20 | head -25
echo ""
echo "=== 마지막 커밋 ==="
git log -1 --format="%H%n%s%n%ad" --date=short
echo ""
echo "=== Brand 검증 ==="
grep -l "892c662\|8890620\|cf5835e" docs/*.md session-context.md CLAUDE.md 2>/dev/null
```

**기대 결과**:
- 마지막 커밋 = `8890620` (STEP 98+99) 또는 최신
- 커밋 해시 (892c662·8890620·cf5835e 등) 가 CHANGELOG·SESSION_KICKOFF·session-context 에 명시되어 있어야 함

---

## 작업 4 — STEP 명령서 파일 존재 확인

```bash
cd ~/stock-terminal
echo "=== docs/STEP_NN_COMMAND.md 파일 목록 ==="
ls -1 docs/STEP_*.md 2>/dev/null | sort
echo ""
echo "=== 합계 ==="
ls -1 docs/STEP_*.md 2>/dev/null | wc -l
```

**기대 결과**: STEP_88 ~ STEP_99 (8개) + STEP_95A, 95C, 95D, 95E, 95E1, 95F (6개) = **총 14개 명령서 + SESSION_25_CLOSE_COMMAND.md = 15개**.

빠진 명령서 있으면 보고.

---

## 작업 5 — 빌드 검증

```bash
cd ~/stock-terminal
npm run build 2>&1 | grep -E "(error TS|Error:|✓|Failed|Type error|Compiled)" | head -10
```

**기대 결과**: `✓ Compiled successfully` + TypeScript 오류 0.

---

## 작업 6 — git status 확인

```bash
cd ~/stock-terminal
git status
```

**기대 결과**: 6개 문서 (SESSION_KICKOFF, CHANGELOG, session-context, NEXT_SESSION_START, PRODUCT_SPEC_V4, SESSION_25_CLOSE_COMMAND) 가 modified/untracked.

---

## 작업 7 — git commit + push

빌드 클린 + 모든 검증 통과 시:

```bash
cd ~/stock-terminal
rm -f .git/index.lock
# 갱신된 문서 14개 전체 (운종 브랜드 통일 + V3 보존 명시)
git add CLAUDE.md README.md CLAUDE_CODE_INSTRUCTIONS.md session-context.md \
        docs/_archive/SESSION_KICKOFF.md docs/CHANGELOG.md docs/_archive/NEXT_SESSION_START.md \
        docs/_archive/PRODUCT_SPEC_V4.md docs/SESSION_25_CLOSE_COMMAND.md \
        docs/BUSINESS_STRATEGY.md docs/PAGE_FRAME_SPEC.md \
        docs/REFERENCE_PLATFORM_MAPPING.md docs/SYSTEM_DESIGN.md
git status --short
git commit -m "docs: 세션 #25 종료 — 모든 문서 3번 교차검증 갱신

세션 #25 (2026-05-27) — 운종(雲從) Layer 0 + 21개 카드 디테일 완성

갱신 문서 6개:
- docs/_archive/SESSION_KICKOFF.md — 전면 갱신 (세션 #24 → #25 종료)
  · 운종 브랜드 + Layer 0 완성 명시
  · 헤더 4단 통합 + 3컬럼 구조 + 21개 카드 + 21개 디테일
  · 다음 P0 = Layer 1 (3가지 후보)
  · 세션 #25 커밋 히스토리 16개
- docs/CHANGELOG.md — 세션 #25 종료 블록 추가
  · STEP 95-A revert · 95-C · 95-D · 95-E · 95-E1 · 95-F · 96 · 97 · 98+99
- session-context.md — 세션 #25 후속 STEP 누적 + TODO Layer 별 재정의
  · Last GC: 2026-05-27 (이전 2026-04-23)
  · V3 잔재 TODO 제거, Layer 1~6 로드맵으로 재정의
- docs/_archive/NEXT_SESSION_START.md — 전면 갱신
  · Layer 0 + 21개 카드 디테일 완성 표시
  · Layer 1 (A·B·C 후보) 진입 가이드
- docs/_archive/PRODUCT_SPEC_V4.md — 진행 상태 갱신
  · 섹션 9 (레이어 로드맵): Layer 0 ✅
  · 섹션 11 (미루기): 카드 7개 완성 → 완료
  · 섹션 14 (다음 작업): Layer 1 (A·B·C)
- docs/SESSION_25_CLOSE_COMMAND.md — 본 명령서

3번 교차검증:
- 1차: 4개 핵심 문서 헤더 날짜 = 2026-05-27
- 2차: 운종 브랜드 일관성 (Stock Terminal 잔재 0, 한자 雲從 코드에서 0)
- 3차: 커밋 히스토리 일관성 (892c662~8890620 모두 명시)

세션 #25 최종 상태:
- Layer 0 (8 STEP) + Layer 0 후속 (8 STEP) = 16 STEP 모두 완성
- 21개 카드 (3창 × 7) + 21개 디테일 페이지 (동적 라우트 3개)
- 헤더 4단 통합 + 3컬럼 본문 + ContextNav

다음 세션: Layer 1 (실데이터 + 채팅 실시간 + 카드 → 패널 연결)"
git push
```

---

## 작업 8 — 푸시 후 최종 확인

```bash
cd ~/stock-terminal
echo "=== 마지막 커밋 ==="
git log -1 --oneline
echo ""
echo "=== 원격 동기화 확인 ==="
git fetch && git status -sb
```

**기대 결과**: `Your branch is up to date with 'origin/main'`.

---

## 검증 체크리스트

- [ ] 1차: 모든 핵심 문서 헤더 `<!-- 2026-05-27 -->`
- [ ] 2차: "Stock Terminal" 코드 잔재 0건 (의도된 보존 제외)
- [ ] 2차: 코드 (.tsx/.ts) 의 한자 `雲從` 0건
- [ ] 3차: 커밋 해시 (892c662·8890620 등) CHANGELOG 에 정확히
- [ ] 3차: STEP 명령서 14개 + SESSION_25_CLOSE = 15개 확인
- [ ] 빌드 클린 (TypeScript 0 오류)
- [ ] git commit 메시지 명확
- [ ] git push 완료
- [ ] 원격 동기화 확인

---

## 완료 보고 (Claude Code → 사용자)

```
🏁 세션 #25 종료. 모든 문서 3번 교차검증 + git push 완료.

3번 교차검증 결과:
- 1차 (헤더 날짜): 모든 문서 = 2026-05-27 ✅
- 2차 (운종 브랜드): Stock Terminal 잔재 X건 / 한자 雲從 코드 0건 ✅
- 3차 (커밋 히스토리): CHANGELOG·session-context·SESSION_KICKOFF 일치 ✅

빌드 클린, git push 완료 (커밋 [해시])

세션 #25 최종 성과:
- Layer 0 완성 + 21개 카드 디테일 페이지 100%
- 운종 시각 정체성 골격 구현 완료
- 다음 세션 = Layer 1 (실데이터 + 채팅 실시간)

세션 종료 가능. 새 세션 시작 시:
  1. docs/_archive/SESSION_KICKOFF.md 먼저 읽기 (최신 상태)
  2. docs/_archive/NEXT_SESSION_START.md 확인 (Layer 1 가이드)
  3. session-context.md TODO 확인 (Layer 1 후보)
  4. Layer 1-A/B/C 중 선택 후 STEP 100 명령서 작성
```

---

## ⚠️ 주의 사항

1. **빌드 깨지면 즉시 멈춤** — 6개 문서만 변경했으니 빌드 깨질 일 없지만 만약 깨지면 보고
2. **Stock Terminal 잔재 발견 시** — 의도된 보존 (PRODUCT_SPEC_V3, 과거 CHANGELOG 기록) 인지 판단 후 보고
3. **한자 雲從 검출 시** — 코드 (.tsx/.ts) 에서 발견되면 운종(雲從) → 운종 으로 정리. 단, BRAND_IDENTITY.md 같은 문서에서는 의도된 한자 (브랜드 명시) 허용
4. **git push 실패 시** — `git pull --rebase origin main` 후 재시도
5. **console.log 남기지 말 것** — CLAUDE.md 규칙
