<!-- 2026-07-03 -->
# STEP 553 — 자산성장(Asset Growth·CMA) 검증 백테스트 (새 기법 ①단계)

> ③ 새 기법 다음 = **자산성장**(총자산 전년比 증가율, 낮을수록 우위 = CMA 투자팩터). 퀄리티처럼 **검증 먼저 → 통과 시 렌즈 추가(STEP 554)**.
> Cowork이 `scripts/backtest_assetgrowth_rigor.ts` 작성 완료(edgarRows의 totalAssets 재사용·새 데이터 없음·production 미변경). Claude Code는 **실행 + 결과 붙여넣기**만.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_553_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
- 자산성장(저성장−고성장 롱숏 = CMA)이 **진짜 수익 신호인지** + **FF3(시장·규모·가치) 넘는 독립 프리미엄인지** 검증.
- **판정 기준(퀄리티·주주환원과 동일)**: 롱숏 t·샤프 + **FF3 알파 t**. CMA는 FF3에 없는 별도 팩터라 알파 **살아야 정상**(살면=검증·독립 / 죽으면=참고·제외).

## 0) French 팩터 확인 (STEP 551서 이미 있음)
```bash
cd ~/stock-terminal && ls data/ff/*[Ff]actors*.csv 2>/dev/null && echo "FF OK" || echo "⚠️ 없으면 STEP551 0)의 curl로 받기"
```

## 1) 백테스트 실행 (수 분 — EDGAR+야후)
```bash
cd ~/stock-terminal && npx tsx scripts/backtest_assetgrowth_rigor.ts 2>&1 | tail -20
```

## 2) 결과 전체를 Cowork에 붙여넣기
- **[자산성장 신뢰도]** 헤더 + 종목 수·코호트 +
- **Asset Growth (저−고)**: 연율·변동성·**t**·샤프·양의 달·회전율·순수익 + **CAPM 알파 t**·**FF3 알파 t**·βMkt/βSMB/**βHML**.
- 참고: βHML 부호(자산성장은 가치와 음의 상관 경향) · 회전율(연1회 형성이라 낮아야 정상).

## ✅ 여기까지 = 자산성장 검증 결과 확보 (렌즈 추가 X — 판정은 Cowork이)
- 통과(t≥2·FF3 알파 유의): STEP 554에서 `assetGrowthLens` 추가 + edgar.ts는 이미 totalAssets 있음(태그 승격 불필요) + ko/en 카피.
- 미통과: 정직하게 "참고/제외" → 다음 후보(발생액 Sloan)로.
- 커밋은 STEP 554(판정 후). 이 STEP은 **검증 실행만**.
