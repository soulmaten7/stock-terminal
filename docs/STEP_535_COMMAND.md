<!-- 2026-07-02 -->
# STEP 535 — F-Score 신뢰도 최종화 (문구·문서 + 커밋)

> STEP 534(N=600·12코호트·144개월): **t=0.70·CAPM 알파 0.46·FF3 알파 0.28 전부 유의 미달**. STEP 533의 t=2.24는 소표본(5코호트) 노이즈였음. → **F-Score는 넓은 유니버스 수익 예측 신호 아님 = 재무 건전성 해석**(우리 입장·정설 확정).

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_535_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
F-Score를 "수익신호 아님·건전성 해석"으로 rigor 확정 + 커밋.
- **Cowork이 이미 수정**: `app/stock/[symbol]/page.tsx`(F-Score 안내: 12년 월별 롱숏 t≈0.7·팩터조정 후 무의미·Piotroski 원용도), `docs/LENS_STRENGTH_MAP.md`(F-Score 행 [검증·수익신호 아님]), `docs/LENS_DEV_PLAYBOOK.md`(#21 — 소표본 유의는 노이즈·데이터 보강 전 결론 금지).
- **커밋 신규**: `scripts/backtest_fscore_rigor.ts`.

## 1) 확인
```bash
cd ~/stock-terminal && grep -c "12년·월별 롱숏" app/stock/\[symbol\]/page.tsx && grep -c "수익신호 아님" docs/LENS_STRENGTH_MAP.md && grep -c "| 21 |" docs/LENS_DEV_PLAYBOOK.md
```
- [ ] 각각 1 이상.

## 2) 빌드 + 클린 재시작
```bash
npm run build 2>&1 | grep -E "error|Error|Compiled|Failed"
```
```bash
pkill -f "next dev"; rm -rf .next && npm run dev > /tmp/nextdev.log 2>&1 &
sleep 12 && curl -s "http://localhost:3333/stock/NVDA" | grep -o "12년·월별 롱숏" | head -1
```
- [ ] "Compiled successfully" + 페이지에 새 문구("12년·월별 롱숏") 노출.

## 3) 커밋
```bash
git add scripts/backtest_fscore_rigor.ts "app/stock/[symbol]/page.tsx" docs/LENS_STRENGTH_MAP.md docs/LENS_DEV_PLAYBOOK.md docs/STEP_532_COMMAND.md docs/STEP_533_COMMAND.md docs/STEP_534_COMMAND.md docs/STEP_535_COMMAND.md && git commit -m "feat(lens): F-Score 신뢰도 확정 — 12코호트 t=0.70·FF3 알파 0.28(수익신호 아님·건전성 해석), 소표본 t=2.24는 노이즈 (STEP 532~535)" && git push
```

## ✅ 여기까지 = F-Score "신뢰도 재검" 완성 (4번째 렌즈)
- 신뢰도 재정렬: **모멘텀=강** · **저변동=위험대비 강** · **밸류=정설이나 표본약함** · **F-Score=수익신호 아님(건전성만)**. 남은 = 기술.

## ▶ 다음 (STEP 536 — 마지막)
- **기술(RSI·MA)** 신뢰도 틀 재확인(이미 참고용) → 월별 롱숏 t·알파로 공식화(예상 무의미). → **5렌즈 전부 t·알파 신뢰도 재검 종료** = 신뢰도 업그레이드 사이클 완료 → 세션 문서 갱신.
