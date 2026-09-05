<!-- 2026-07-02 -->
# STEP 517 — 모멘텀·저변동 넓은 유니버스 재확인 (3기법 검증 마무리)

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_517_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
F-Score를 넓은 못에서 검증했듯, 모멘텀·저변동도 **같은 넓은 유니버스(us_symbols ~250 표본)**로 재확인 → 3기법 검증을 동일 토대 위에서 마무리. 가격만이라 가볍고 빠름(EDGAR 없음).
- **Cowork이 이미 수정함**: `backtest_momentum.ts`·`backtest_lowvol.ts` 유니버스를 넓은 표본으로.
- 이 STEP = 둘 다 실행 → 결과 보고 → 커밋.

## 1) 실행 (가격만 — 각 1~3분)
```bash
cd ~/stock-terminal
npx tsx scripts/backtest_momentum.ts
echo "==== LOWVOL ===="
npx tsx scripts/backtest_lowvol.ts
```

## 2) 결과 공유 (Cowork에)
- [ ] **모멘텀**: 상/중/하 3분위 + **프리미엄(고−저)**. 대형주 때 +4%p였는데 넓은 못에선? (소형 포함이라 더 강할 수도/노이즈일 수도)
- [ ] **저변동**: 저/중/고 3분위 수익 + 실현변동성 + **저−고 차**. 넓은 못에선 이례현상(저변동 위험대비 우위) 나타나나?
- [ ] 각 표본 n·리밸런스 수(대형주 때보다 커야).

## 3) 판정 + 기록 (그때그때·조건부)
- 결과 그대로 판정(과신 금물, 비용전·생존편향 명시).
- **즉시** `docs/LENS_DEV_PLAYBOOK.md` 로그에 교훈 추가(이 표본/조건 맥락 붙여서 §0-7).
- `docs/LENS_STRENGTH_MAP.md`의 모멘텀·저변동 행을 넓은 검증 결과로 갱신([검증] 근거 업데이트).

## 4) 커밋
```bash
git add scripts/backtest_momentum.ts scripts/backtest_lowvol.ts docs/LENS_DEV_PLAYBOOK.md docs/LENS_STRENGTH_MAP.md && git commit -m "feat(validate): 모멘텀·저변동 넓은 유니버스 재확인(us_symbols ~250) + 로그·적합지도 갱신 (STEP 517)" && git push
```

## ▶ 다음
- 3기법 검증이 "제대로 된 유니버스"로 마무리됨 → 렌즈 페이지 표시 정리(검증 결과·적합영역 반영, 미검증 라벨).
- 그 후에야 표시 UX·수익화 논의. (지금은 무관.)
- 이후 새 기법(밸류·퀄리티 등)은 이 틀(플레이북+적합지도+EDGAR/가격 토대) 위에서 반복.
