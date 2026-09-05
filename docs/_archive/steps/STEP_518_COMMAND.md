<!-- 2026-07-02 -->
# STEP 518 — 유동성 필터(주가≥$5) 후 모멘텀·저변동 재검증 (투자가능 유니버스)

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_518_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
STEP 517 발견: 넓은 raw 표본엔 페니스탁(vol 99%)이 섞여 모멘텀 역전·저변동 왜곡. "넓은 표본 ≠ 대표 표본". → **진입 시점 주가 ≥ $5 필터(페니스탁 제외 = 유동성 프록시)**로 투자가능 유니버스에서 재검증 → 모멘텀·저변동을 제대로 닫는다.
- **Cowork이 이미 수정**: `backtest_momentum.ts`·`backtest_lowvol.ts`에 `pE < 5` 제외 추가.
- 이 STEP = 둘 다 재실행 → 결과 보고 → 로그·적합지도 갱신 → 커밋.

## 1) 실행
```bash
cd ~/stock-terminal
npx tsx scripts/backtest_momentum.ts
echo "==== LOWVOL ===="
npx tsx scripts/backtest_lowvol.ts
```

## 2) 결과 공유 (Cowork에)
- [ ] **모멘텀 프리미엄(고−저)**: 페니 제외 후 부호·크기. (대형 +4%p / raw넓은 −8.2%p 였음 → 투자가능 유니버스에선?)
- [ ] **저변동**: 저/중/고 실현변동성(고변동이 이제 99% 아닌 상식적 값?)·수익·저−고차. 이례현상(저변동 위험대비 우위) 보이나?
- [ ] 표본 n·리밸런스.

## 3) 판정 + 즉시 기록 (그때그때·조건부)
- 결과 그대로. **`docs/LENS_DEV_PLAYBOOK.md` 로그 + `docs/LENS_STRENGTH_MAP.md` 모멘텀·저변동 행**을 이 결과로 갱신(근거 [검증], "투자가능 유니버스·주가≥$5" 조건 명시).
- 판정 방향(예상): 모멘텀은 페니 제외 시 +로 복귀 가능(그럼 "유동성 있는 종목서 유효" 확정). 저변동은 왜곡 걷히면 위험대비 관점 재평가.

## 4) 커밋
```bash
git add scripts/backtest_momentum.ts scripts/backtest_lowvol.ts docs/LENS_DEV_PLAYBOOK.md docs/LENS_STRENGTH_MAP.md && git commit -m "feat(validate): 유동성 필터(≥\$5) 후 모멘텀·저변동 재검증 — 투자가능 유니버스 (STEP 518)" && git push
```

## ▶ 다음
- 이걸로 3기법이 "투자가능 유니버스"로 검증 닫힘 → **STEP 519: 렌즈 페이지 표시 정리**(각 렌즈 노트를 최종 검증결과·조건으로 갱신, 미검증(밸류·기술) 라벨). 모멘텀 카드 노트(현재 "+4%p")도 조건부로 정정.
- 그 후에야 UX·수익화.
