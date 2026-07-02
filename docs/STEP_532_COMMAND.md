<!-- 2026-07-02 -->
# STEP 532 — F-Score 신뢰도 (고−저 점수 월별 롱숏·t·알파)

> 신뢰도 틀 4번째 렌즈. F-Score는 이미 "재무 건전성 해석·수익예측 아님"이 우리 입장 → rigor(t·알파)로 **공식 확인**. 유의 미달/음이면 입장 재확인.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_532_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
F-Score 고(≥7)−저(≤3) 월별 롱숏의 t·샤프·알파 확인. Cowork이 `scripts/backtest_fscore_rigor.ts` 작성(EDGAR+가격, 은행 자동제외, French 재사용).
- 이 STEP = 실행 + 보고. (커밋·문구는 STEP 533.)

## 0) French 있는지(없으면 재다운로드)
```bash
cd ~/stock-terminal && (ls data/ff/*.[Cc][Ss][Vv] >/dev/null 2>&1 && echo "data/ff OK") || (mkdir -p data/ff && curl -sL -A "Mozilla/5.0" "https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/F-F_Research_Data_Factors_CSV.zip" -o /tmp/ff3.zip && unzip -o /tmp/ff3.zip -d data/ff && echo "재다운로드")
```

## 1) 실행 (몇 분 — EDGAR 400 + yahoo 400)
```bash
cd ~/stock-terminal && npx tsx scripts/backtest_fscore_rigor.ts
```

## 2) 결과 전체 붙여넣어 보고
1. **지원 관측·유효 코호트·월수** — 은행 제외 후 표본 충분?(고·저 버킷 각 ≥10/코호트)
2. **연율·t값·샤프·양의 달** — 핵심: **t가 유의 미달(|t|<2)이거나 음(−)이면 "F-Score는 수익 예측 신호 아님" 공식 확인**(STEP 515 −36% spread와 일관).
3. **CAPM·FF3 알파·t** — 알파도 유의 미달 예상. (혹시 유의하게 +면 재검토 — 예상 밖.)

## ✅ 판정 (STEP 533 반영)
- t 유의 미달/음 → F-Score note "수익 신호 아님·재무 건전성 해석" **정식 확인**(현재 입장 유지·강화).
- 원용도 명시: **고B/M(가치)주 내 부실 필터**(Piotroski) — 넓은 유니버스 수익예측용이 아님(정설).
- 만약 유의 + 나오면(예상 밖) → 데이터·버킷 재점검 후 재판정.

## ▶ 다음 (STEP 533 — Cowork이 설계)
- F-Score note·`LENS_STRENGTH_MAP`·플레이북(#21) 갱신 + 스크립트 커밋.
- 마지막 **기술**(이미 참고용) 신뢰도 틀 재확인 → **5렌즈 전부 t·알파 신뢰도 재검 완료** = 신뢰도 업그레이드 사이클 종료.
