<!-- 2026-07-02 -->
# STEP 534 — F-Score 표본 보강 재실행 (N 600·버킷 완화)

> STEP 533(3분위): 유효 코호트 5개(60개월) — 아직 <8. t=2.24(+)인데 STEP 515 넓은표본(−36%)과 **부호 반대** + FF3 알파 t=1.61(유의 미달). → 데이터부터 더 확보 후 판정(§0-4).

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_534_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
Cowork이 `backtest_fscore_rigor.ts`를 **N=600·MIN_BUCKET=8**로 상향(코호트당 지원종목↑ → 유효 코호트↑). 재실행해 표본 충분히 확보 후 F-Score 수익신호 여부 확정.
- 이 STEP = 재실행 + 보고. (커밋·문구는 판정 후.)

## 0) 수정 확인 + French
```bash
cd ~/stock-terminal && grep -c "N = 600" scripts/backtest_fscore_rigor.ts && (ls data/ff/*.[Cc][Ss][Vv] >/dev/null 2>&1 && echo "data/ff OK")
```

## 1) 실행 (좀 더 걸림 — EDGAR 600 + yahoo 600)
```bash
cd ~/stock-terminal && npx tsx scripts/backtest_fscore_rigor.ts
```

## 2) 결과 전체 붙여넣어 보고
1. **유효 코호트·월수** — 이번엔 8~11코호트 목표(표본 충분?).
2. **연율·t값·양의 달** — 부호가 STEP 533(+2.24)과 같은지, STEP 515(−)와 여전히 다른지.
3. **FF3 알파·t** — 핵심: 시장·규모·가치 통제 후에도 유의한가? (t<2면 "raw는 size/style 노출, 진짜 F-Score 알파 아님").
4. **βSMB·βHML** — 스타일 노출 확인.

## ✅ 판정 (다음 STEP에서 반영)
- **표본 커졌는데도 (a) 부호가 표본 따라 흔들리거나 (b) FF3 알파 유의 미달** → **F-Score는 견고한 수익 신호 아님 = "재무 건전성 해석" 확정**(우리 입장·정설과 일치). ← 가장 가능성 높음.
- 만약 표본 충분 + FF3 알파도 유의(+) → 예상 밖 → 재검토(원용도·소형가치 한정 등).
- 여전히 코호트 <8 → 이 유니버스(무료·생존편향)에선 F-Score 월별 롱숏 검정이 구조적으로 어렵다고 정직 기록 → STEP 515(넓은표본)+정설로 판정.

## ▶ 다음
- 결과로 F-Score note·`LENS_STRENGTH_MAP`·플레이북(#21) 갱신 + 커밋. → 4번째 렌즈 마무리.
- 마지막 기술 → 5렌즈 신뢰도 재검 종료.
