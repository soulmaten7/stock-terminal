<!-- 2026-07-03 -->
# STEP 560 — 재무 3렌즈 3중 교차검증 (밸류·퀄리티·자산성장)

> 7렌즈 3중 교차검증 계속. 가격 3렌즈(STEP 559: 모멘텀 단단·저변동 방어별도·기술 모멘텀중복) 이후, 재무 렌즈를 코호트 3분할로. F-Score는 '수익 신호 아님'으로 확정이라 수익 교차검증 대상 아님.
> Cowork이 `scripts/backtest_crossval_fund.ts` 작성 완료(edgarRows 재사용·production 미변경). Claude Code는 **실행 + 결과 붙여넣기**만.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_560_COMMAND.md 파일 내용대로 실행해줘
```

## 1) 교차검증 실행 (수 분 — EDGAR+야후)
```bash
cd ~/stock-terminal && npx tsx scripts/backtest_crossval_fund.ts 2>&1 | tail -30
```

## 2) 결과 전체를 Cowork에 붙여넣기
- 각 렌즈(밸류·퀄리티·자산성장)마다:
  - **전체**: 연·**t**·양의달
  - **fold1/fold2/fold3**: 각 구간 코호트·연수익·**t**·양의달
  - **FF3 알파 t·βHML**
  - **▶ 3구간 부호 [x,y,z] → 단단/취약**
- 관전 포인트: 퀄리티(검증)가 3구간 다 +유지되나? 밸류·자산성장(표본약함)이 방향이라도 일관되나?

## ✅ 여기까지 = 7렌즈 교차검증 완료 (가격 3 + 재무 3 + F-Score 별도)
## ▶ 다음
- **STEP 561 (재등급 반영)**: 교차검증 결과를 note·등급에 정직 반영 —
  - 모멘텀=검증 확정 · 기술=참고용 유지(모멘텀 중복 명시) · 저변동=방어 등급 + raw 약함 명시(위험축 CV는 여지) · 밸류/자산성장/퀄리티=결과대로.
- 그 다음: **UI 편의성**(Phase 2) — 검증 단단해진 렌즈들을 사용자에게 더 잘 보이게.
