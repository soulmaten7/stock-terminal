<!-- 2026-06-15 -->
# STEP 242 — 문서 일괄 갱신 커밋 (STEP 228~241 + STEP 명령서 14개 아카이브)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_242_COMMAND.md 파일 내용대로 실행해줘`

## 목표
**문서 내용은 Cowork가 이미 갱신 완료(아래 파일들 수정됨).** Claude Code는 **커밋·push만** 하면 됨.
- 갱신된 문서 6종: `CLAUDE.md` · `docs/CHANGELOG.md` · `session-context.md` · `docs/NEXT_SESSION_START.md` · `docs/NEXT_SESSION_PLAYBOOK.md` · `docs/SESSION_KICKOFF.md` (전부 날짜 **2026-06-15** + STEP 228~241 반영)
- 미커밋 **STEP 명령서 14개**(`docs/STEP_228_COMMAND.md` ~ `STEP_241_COMMAND.md`) + 이 파일(242) 아카이브 → `git add docs/`로 함께 커밋

## 전제 상태
- 현재 HEAD: `bbf4e88` (STEP 241)
- 코드 변경 **0** (문서·STEP 명령서만)
- ⚠️ STEP 240(ETF 미리보기 폭)은 **미적용** 상태로 기록됨 — 다음 세션 적용 대기(`docs/STEP_240_COMMAND.md` 그대로 있음)

---

## 작업 1/1 — 커밋·push (코드/문서 수정 없음, git만)

먼저 무엇이 커밋될지 확인(선택):
```bash
cd ~/stock-terminal && git status --short
```
> 예상: `M` CLAUDE.md·session-context.md·docs/CHANGELOG.md·docs/NEXT_SESSION_START.md·docs/NEXT_SESSION_PLAYBOOK.md·docs/SESSION_KICKOFF.md / `??` docs/STEP_228~242_COMMAND.md (코드 파일은 없어야 정상)

커밋·push:
```bash
cd ~/stock-terminal && git add docs/ CLAUDE.md session-context.md && git commit -m "docs: STEP 228~241 일괄 갱신 (홈=상품 성적표 재편+헤더 정리) + STEP 명령서 아카이브" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `git push` 완료 (커밋 해시 알려주기)
- [ ] `git status` 깨끗(미커밋 docs 없음)
- [ ] 4개 문서 날짜 = **2026-06-15** (CLAUDE·CHANGELOG·session-context·NEXT_SESSION_START) → 세션 종료 hook 통과

## 주의·예상 이슈
- 코드 변경이 섞여 있으면(`M components/...`) **멈추고 알릴 것** — 이 STEP은 문서 전용이어야 함.
- STEP 명령서 파일 내부 날짜(일부 `2026-06-14`)는 아카이브 라벨이라 무관(hook은 4개 문서만 검증).
- `npm run build`는 코드 변경 0이라 불필요(원하면 확인만).

---
> STEP 242 = 문서 일괄 갱신 커밋. 전제 STEP 241(`bbf4e88`).
> 다음 세션 1순위: STEP 240 적용(ETF 미리보기 폭) → 주식 1주~1년·시총 실데이터 연동(데이터 레이어).
