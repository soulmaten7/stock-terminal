<!-- 2026-07-03 -->
# STEP 559 — 가격 3렌즈 3중 교차검증 (모멘텀·저변동·기술)

> 방향 확정: **7렌즈를 3중 교차검증(시기 3분할)으로 진짜 단단한지 재확인 → 그다음 UI 편의성.** 이번은 가격 기반 3렌즈(데이터 길어 3분할 신뢰도 최고).
> "3번의 교차검증" = 전체 기간을 초·중·후반 3구간(fold)으로 나눠 각 구간에서도 같은 방향이 나오는지. 3/3 동일 = 단단 / 부호 뒤집힘 = 정직 하향.
> Cowork이 `scripts/backtest_crossval_price.ts` 작성 완료(가격만·production 미변경). Claude Code는 **실행 + 결과 붙여넣기**만.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_559_COMMAND.md 파일 내용대로 실행해줘
```

## 0) (선택) 발생액 탈락 커밋이 아직이면 먼저
```bash
cd ~/stock-terminal && git log --oneline -1 | grep -q "발생액" && echo "이미 커밋됨" || echo "⚠️ STEP_558_COMMAND.md 먼저 실행 권장(발생액 탈락 기록)"
```

## 1) 교차검증 실행 (수 분 — 야후 가격만)
```bash
cd ~/stock-terminal && npx tsx scripts/backtest_crossval_price.ts 2>&1 | tail -30
```

## 2) 결과 전체를 Cowork에 붙여넣기
- 각 렌즈(모멘텀·저변동·기술)마다:
  - **전체**: 연·**t**·양의달
  - **fold1/fold2/fold3**: 각 구간 연도·연수익·**t**·양의달
  - **FF3 알파 t**
  - **▶ 3구간 부호 [x, y, z] → 단단/취약** 판정
- 이걸로 Cowork이 각 렌즈 등급이 정말 3구간 내내 유지되는지 확인 → 필요 시 note·등급 정직 조정.

## ✅ 여기까지 = 가격 3렌즈 교차검증 결과 확보 (판정은 Cowork)
## ▶ 다음
- STEP 560: 재무 4렌즈(밸류·퀄리티·자산성장·F-Score) 3중 교차검증.
- 이후: 결과 반영(등급·note 조정) → **UI 편의성** 개선(Phase 2).
