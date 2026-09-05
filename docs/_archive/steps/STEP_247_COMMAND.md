<!-- 2026-06-15 -->
# STEP 247 — 문서 갱신 커밋 (STEP 240·243~246 + STEP 명령서 아카이브)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_247_COMMAND.md 파일 내용대로 실행해줘`

## 목표
**문서 내용은 Cowork가 이미 갱신 완료.** Claude Code는 **커밋·push만**.
- 갱신된 문서(이번 라운드): `docs/CHANGELOG.md` · `session-context.md` · `docs/NEXT_SESSION_START.md` · `docs/NEXT_SESSION_PLAYBOOK.md` (STEP 240·243~246 반영 — 기간 수익률 실데이터 + /market 통합 디렉토리)
- 날짜는 이미 **2026-06-15**(오늘) — 변경 없음.
- 미커밋 **STEP 명령서**(`docs/STEP_243`~`STEP_247_COMMAND.md`) 아카이브 함께 커밋.

## 전제 상태
- 현재 HEAD: `bfa7d97` (STEP 246)
- 코드 변경 **0** (문서·STEP 명령서만)

---

## 작업 1/1 — 커밋·push (git만)

확인(선택):
```bash
cd ~/stock-terminal && git status --short
```
> 예상: `M` docs/CHANGELOG.md·docs/NEXT_SESSION_START.md·docs/NEXT_SESSION_PLAYBOOK.md·session-context.md / `??` docs/STEP_243~247_COMMAND.md (코드 파일 `M components/...` 없어야 정상)

커밋·push:
```bash
cd ~/stock-terminal && git add docs/ session-context.md && git commit -m "docs: STEP 240·243~246 갱신 (기간 수익률 실데이터 + /market 통합 디렉토리) + STEP 명령서 아카이브" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `git push` 완료 (커밋 해시 알려주기)
- [ ] `git status` 깨끗
- [ ] 4개 문서 날짜 = **2026-06-15** (세션 종료 hook 통과)

## 주의·예상 이슈
- 코드 변경 섞여 있으면(`M components/...` 등) **멈추고 알릴 것** — 문서 전용 커밋.
- `index.lock` 잔여 에러 나면(이전 git 흔적) `rm -f .git/index.lock` 후 재시도 — 무해.

---
> STEP 247 = 문서 갱신 커밋(240·243~246). 전제 STEP 246(`bfa7d97`).
> 다음 작업 후보: US를 /market 통합 합류 · 종목→증권사 바로가기(B) · ETN(KRX)·펀드(KOFIA) · AI 해설.
