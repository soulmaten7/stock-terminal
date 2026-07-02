<!-- 2026-07-02 -->
# STEP 533 — F-Score 신뢰도 재실행 (3분위 버킷·데이터 보강)

> STEP 532는 **데이터 부족**: 고정 임계(≥7/≤3)라 저점수 버킷이 희소(부실주 드묾+생존편향) → 유효 코호트 3개(36개월)뿐. 결론 불가.
> 수정: **점수 3분위(상 1/3 vs 하 1/3)**로 균형 버킷 → 전 코호트 사용(~14코호트·~168개월). 데이터 먼저(§0-4) 원칙.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_533_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
Cowork이 `scripts/backtest_fscore_rigor.ts`를 3분위 버킷으로 수정. 재실행해 **충분한 표본**에서 F-Score 고−저 롱숏 t·알파 확인.
- 이 STEP = 재실행 + 보고. (커밋·문구는 STEP 534.)

## 0) 수정 확인 + French
```bash
cd ~/stock-terminal && grep -c "3분위" scripts/backtest_fscore_rigor.ts && (ls data/ff/*.[Cc][Ss][Vv] >/dev/null 2>&1 && echo "data/ff OK")
```
- [ ] "3분위" 있음, data/ff OK.

## 1) 실행 (몇 분 — EDGAR 400 + yahoo 400)
```bash
cd ~/stock-terminal && npx tsx scripts/backtest_fscore_rigor.ts
```

## 2) 결과 전체 붙여넣어 보고
1. **유효 코호트·월수** — 이번엔 10코호트+·120개월+ 나와야 정상(데이터 보강 확인).
2. **연율·t값·샤프·양의 달** — F-Score 고−저 롱숏. **t 유의 미달/음 → "수익 예측 신호 아님" 확인**(STEP 515 −36%와 일관 예상).
3. **CAPM·FF3 알파·t** — 유의 미달 예상.

## ✅ 판정 (STEP 534 반영)
- 표본 충분(코호트 10+) + t 유의 미달/음 → F-Score "재무 건전성 해석·수익예측 아님" **정식 확인**.
- 만약 이번에도 표본 작으면(코호트 <8) → 데이터 더 검수(N 상향·연도 확장) 후 재실행. 결론은 그 뒤.
- 원용도(정설): 고B/M 가치주 내 부실 필터 — 넓은 유니버스 수익예측용 아님.

## ▶ 다음 (STEP 534)
- F-Score note·`LENS_STRENGTH_MAP`·플레이북(#21) 갱신 + 스크립트 커밋. → 4번째 렌즈 완성.
- 마지막 기술 → 5렌즈 신뢰도 재검 종료.
