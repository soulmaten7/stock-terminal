<!-- 2026-07-02 -->
# STEP 538 — 세션 종료 문서 갱신 커밋 + push (신뢰도 사이클 반영)

> Cowork이 세션 문서 7종에 신뢰도 업그레이드 사이클(STEP 525~537·HEAD 5bdf56f) 반영 완료. 이 STEP = 명시적 git add + commit + push.
> ⚠️ `git add -A` 금지 — 미커밋 STEP 백로그·`app/api/ai-view`·zip 등은 제외.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_538_COMMAND.md 파일 내용대로 실행해줘
```

## 0) 날짜 확인 (하네스 4문서 = 오늘)
```bash
cd ~/stock-terminal && head -1 CLAUDE.md docs/CHANGELOG.md session-context.md docs/NEXT_SESSION_START.md
```
- [ ] 4개 다 `<!-- 2026-07-02 -->`.

## 1) 빌드 (안전 확인)
```bash
npm run build 2>&1 | grep -E "error|Error|Compiled|Failed"
```
- [ ] "Compiled successfully".

## 2) 세션 문서만 커밋 + push
```bash
git add session-context.md docs/CHANGELOG.md docs/NEXT_SESSION_START.md docs/SESSION_BOOT.md docs/NEXT_SESSION_PLAYBOOK.md docs/SESSION_KICKOFF.md docs/NEW_SESSION_HANDOFF.md docs/STEP_538_COMMAND.md && git commit -m "docs: 세션 문서 갱신 — 신뢰도 업그레이드 사이클(STEP 525~537) 5렌즈 t·알파 재검 반영" && git push
```

## 3) 확인
```bash
git log --oneline -3 && git status --short | head -5
```
- [ ] 최신 커밋 = 위 메시지, push 완료.

## ✅ 여기까지 = 세션 마무리
- 새 세션은 `docs/NEW_SESSION_HANDOFF.md`(또는 `SESSION_BOOT.md`)부터 → 신뢰도 재검 완료 상태(모멘텀=유의·저변동=위험대비·밸류=표본약함·F=수익신호아님·기술=참고용)로 이어받음.
- 다음 후보: (a) KR/글로벌 렌즈 확장 · (b) 새 기법(퀄리티·마법공식) · (c) 생존편향 없는 데이터 승격. (수익화·UX는 계속 뒤로.)
