<!-- 2026-07-02 -->
# STEP 531 — 밸류 신뢰도 최종화 (정직 하향 + 커밋)

> STEP 530: E/P 월별 롱숏 +6.19%·**t=0.93**(유의 미달) / B/M +8.87%·**t=1.54**(경계·미달) / FF3 βHML=0.71(우리 밸류=학계 HML 재현) / 연1회 리밸런스=저비용.
> **정직한 읽기**: 밸류는 **정설 팩터(HML) 재현은 확인**되나, 우리 표본(2010~24)에선 **통계적으로 약함**(t<2) — 최근 ~15년 가치주 부진과 일치. 방향은 +, 유의성 부족 → 모멘텀·저변동보다 한 단계 낮은 신뢰. (rigor가 STEP 520의 느슨한 "+10.2% 검증"을 정직하게 하향.)

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_531_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
밸류 렌즈를 "정설 팩터·표본 약함"으로 정직 하향 + 커밋.
- **Cowork이 이미 수정**: `lib/lenses.ts`(밸류 note: 정설 HML 재현·표본 통계 약함·방향만), `docs/LENS_STRENGTH_MAP.md`(밸류 행 [정설]+[표본 약함]), `docs/LENS_DEV_PLAYBOOK.md`(#20 — 느슨한 코호트 과대평가·팩터진짜≠표본수익·rigor 재정렬).
- **커밋 신규**: `scripts/backtest_value_rigor.ts`.

## 1) 확인
```bash
cd ~/stock-terminal && grep -c "정설 팩터" lib/lenses.ts && grep -c "표본 약함" docs/LENS_STRENGTH_MAP.md && grep -c "| 20 |" docs/LENS_DEV_PLAYBOOK.md
```
- [ ] 각각 1 이상.

## 2) 빌드 + 클린 재시작 + 검증
```bash
npm run build 2>&1 | grep -E "error|Error|Compiled|Failed"
```
```bash
pkill -f "next dev"; rm -rf .next && npm run dev > /tmp/nextdev.log 2>&1 &
sleep 12 && curl -s "http://localhost:3333/api/lens?symbol=NVDA" | python3 -c "import sys,json; d=json.load(sys.stdin); v=[x for x in d['lenses'] if x['key']=='valuation'][0]; print((v.get('note') or '')[:90])"
```
- [ ] "Compiled successfully" + note에 "정설 팩터" + "통계적으로 약함".

## 3) 커밋
```bash
git add scripts/backtest_value_rigor.ts lib/lenses.ts docs/LENS_STRENGTH_MAP.md docs/LENS_DEV_PLAYBOOK.md docs/STEP_530_COMMAND.md docs/STEP_531_COMMAND.md && git commit -m "feat(lens): 밸류 신뢰도 — 정설 팩터(HML βHML=0.71) 재현이나 우리 표본(2010~24) 월별 t<2 통계 약함(정직 하향) (STEP 530~531)" && git push
```

## ✅ 여기까지 = 밸류 "신뢰도 재검" 완성 (3번째 렌즈)
- 신뢰도 재정렬 현황: **모멘텀=강(t2.5·알파유의)** · **저변동=위험대비 강(알파유의·raw약)** · **밸류=정설이나 표본 약함(t<2)**. rigor가 각 렌즈 진짜 등급을 정직하게 재배치 중.

## ▶ 다음 (STEP 532 — Cowork이 설계)
- **F-Score** 신뢰도 — 점수 고(7~9)−저(0~3) 롱숏 월별 t·알파. 이미 "건전성 해석·수익예측 아님"이 우리 입장 → rigor로 그걸 공식 확인(아마 유의 미달/음). 정직 재확인.
- 마지막 **기술**(이미 참고용)까지 하면 5렌즈 전부 신뢰도 등급 재검 완료.
