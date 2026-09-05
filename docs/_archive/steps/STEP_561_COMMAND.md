<!-- 2026-07-03 -->
# STEP 561 — 3중 교차검증 결과 반영 (note·문서) + 커밋

> 7렌즈 3중 교차검증(STEP 559 가격3 + 560 재무3) 결과를 각 렌즈 note에 정직 반영. **등급 변경 없음** — 교차검증이 기존 정직 등급을 재확인(모멘텀·퀄리티 시기 무관 단단 / 밸류 시기의존 / 저변동 방어별도 / 기술 모멘텀중복 / 자산성장 방향일관). 로직 변경 없음(note 문자열만) → 빌드 통과 확실.
> Cowork이 소스·문서 수정 완료. Claude Code는 **빌드 + 재시작 + 확인 + 커밋**.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_561_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표 (Cowork이 이미 수정)
- `lib/lenses.ts` — 6렌즈 note에 "3중 교차검증(STEP559/560): …" 결과 추가(모멘텀·퀄리티·기술·저변동·밸류·자산성장).
- `docs/LENS_STRENGTH_MAP.md` — "3중 교차검증" 표 추가.
- `docs/LENS_DEV_PLAYBOOK.md` — #27(교차검증 방법론+결과: 등급 재확인·부호일관≠유의성·FF3 모멘텀 맹점).
- `scripts/backtest_crossval_price.ts`·`backtest_crossval_fund.ts`(STEP 559~560 신규) 커밋 포함.

## 0) 확인
```bash
cd ~/stock-terminal && grep -c "3중 교차검증" lib/lenses.ts && grep -c "3중 교차검증" docs/LENS_STRENGTH_MAP.md
```
- [ ] lenses.ts 6, STRENGTH_MAP 1+.

## 1) 빌드 + 클린 재시작
```bash
npm run build 2>&1 | grep -E "error|Error|Compiled|Failed"
```
```bash
pkill -f "next dev"; rm -rf .next && npm run dev > /tmp/nextdev.log 2>&1 &
```
- [ ] "Compiled successfully".

## 2) 확인 (note에 교차검증 반영)
```bash
sleep 12
curl -s "http://localhost:3333/api/lens?symbol=NVDA" | python3 -c "import sys,json; d=json.load(sys.stdin); q=[x for x in d['lenses'] if x['key']=='quality']; print('OK' if '3중 교차검증' in q[0].get('note','') else 'MISSING')"
```
- [ ] `OK` (퀄리티 note에 교차검증 문구).

## 3) 커밋
```bash
git add lib/lenses.ts docs/LENS_STRENGTH_MAP.md docs/LENS_DEV_PLAYBOOK.md scripts/backtest_crossval_price.ts scripts/backtest_crossval_fund.ts docs/STEP_559_COMMAND.md docs/STEP_560_COMMAND.md docs/STEP_561_COMMAND.md && git commit -m "verify(lens): 7렌즈 3중 교차검증(시기 3분할) 반영 — 모멘텀·퀄리티 단단 재확인·밸류 시기의존·기술 모멘텀중복·저변동 방어별도·자산성장 방향일관 (STEP 559~561)" && git push
```

## ✅ 여기까지 = 7렌즈 3중 교차검증 완료·note 반영 (등급 불변·정직 재확인)
## ▶ 다음 = **UI 편의성 (Phase 2)** — 검증 단단해진 렌즈들을 사용자에게 더 잘 보이게 (Cowork과 설계).
