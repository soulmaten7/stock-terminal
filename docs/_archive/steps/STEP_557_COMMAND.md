<!-- 2026-07-03 -->
# STEP 557 — 발생액(Accruals·Sloan) 검증 백테스트 (새 기법 ①단계)

> ③ 새 기법 다음 = **발생액**(이익의 質: (순이익−영업현금)/총자산, 낮을수록 우위 = Sloan 1996). 퀄리티·자산성장처럼 **검증 먼저 → 판정(채용=효용/등급=유의성)**.
> Cowork이 `scripts/backtest_accruals_rigor.ts` 작성 완료(edgarRows의 netIncome·operatingCashFlow·totalAssets 재사용·새 데이터 없음·production 미변경). Claude Code는 **실행 + 결과 붙여넣기**만.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_557_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
- 발생액(저−고 롱숏)이 **진짜 수익 신호인지** + **FF3(시장·규모·가치) 넘는 독립 프리미엄인지** 검증.
- **판정 기준(동일)**: 롱숏 t·샤프 + **FF3 알파 t** + βHML(독립성). 
  - 유의(t≥2·FF3 알파 유의) → 검증 등급 채용.
  - 방향·독립은 있으나 유의 미달 → 표본 약함 채용(자산성장처럼).
  - 죽거나 기존 렌즈와 겹침 → 탈락(주주환원처럼).

## 0) French 팩터 확인 (이미 있음)
```bash
cd ~/stock-terminal && ls data/ff/*[Ff]actors*.csv 2>/dev/null && echo "FF OK" || echo "⚠️ 없으면 STEP551 0)의 curl로 받기"
```

## 1) 백테스트 실행 (수 분 — EDGAR+야후)
```bash
cd ~/stock-terminal && npx tsx scripts/backtest_accruals_rigor.ts 2>&1 | tail -20
```

## 2) 결과 전체를 Cowork에 붙여넣기
- **[발생액 신뢰도]** 헤더 + 종목 수·코호트 +
- **Accruals (저−고)**: 연율·변동성·**t**·샤프·양의 달·회전율·순수익 + **CAPM 알파 t**·**FF3 알파 t**·βMkt/βSMB/**βHML**.
- 참고: βHML 부호(발생액은 가치와 약한 상관) · 회전율(연1회 형성).

## ✅ 여기까지 = 발생액 검증 결과 확보 (판정은 Cowork이)
- 통과/부분통과: STEP 558에서 `accrualsLens` 추가(등급 정직히) + ko/en 카피(`LENS_READINGS` 판정 문장 포함).
- 미통과/중복: 정직하게 탈락 → 문서 기록.
- 커밋은 STEP 558(판정 후). 이 STEP은 **검증 실행만**.
