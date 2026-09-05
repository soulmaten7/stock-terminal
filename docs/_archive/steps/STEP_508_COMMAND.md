<!-- 2026-07-02 -->
# STEP 508 — 12-1 모멘텀 다년 백테스트 (검증 먼저) · 가격 데이터만

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_508_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
두 번째 기법 = **12-1 모멘텀**. F-Score와 달리 **검증부터** — 가격만 필요해 EDGAR 없이 야후 深가격으로 다년 백테스트. 유니버스를 매월 모멘텀 3분위(상/중/하)로 나눠 이후 3개월 수익률 비교 → **모멘텀 프리미엄(상−하)** 측정.
- **Cowork이 이미 작성함**: `lib/momentum.ts`(12-1 함수, 렌즈와 공유), `scripts/backtest_momentum.ts`(백테스트). 이 STEP = **실행 + 보고 + 커밋**.
- 가격만이라 EDGAR보다 가볍고 빠름(수십 초~1분대).

## 0) 파일 확인
```bash
cd ~/stock-terminal
ls -la lib/momentum.ts scripts/backtest_momentum.ts
```

## 1) 백테스트 실행
```bash
npx tsx scripts/backtest_momentum.ts
```
> TS import → **`npx tsx`**. (야후만 호출)

## 2) 결과 공유 (Cowork에)
- [ ] 종목 성공 수 · 리밸런스 횟수.
- [ ] 상/중/하 3분위 각 3개월 수익률(+연율) · 표본 n.
- [ ] **모멘텀 프리미엄(상−하)** — 이게 핵심. + 이면 신호 유효(고모멘텀이 저모멘텀 초과).

## 3) 판정
- **상위 > 하위(프리미엄 +)** → 모멘텀 신호 유효 → F-Score(대형주 무관)와 대비되는 **검증된 렌즈** 확보. STEP 509에서 모멘텀 렌즈를 canonical 12-1로 정리 + 정직한 "검증됨" 문구.
- **차이 없음/음수** → 그대로 기록(이 표본에선 약함). 어느 쪽이든 정직하게.

## 4) 커밋
```bash
git add lib/momentum.ts scripts/backtest_momentum.ts && git commit -m "feat(validate): 12-1 모멘텀 다년 백테스트(횡단면 3분위) + lib/momentum (STEP 508)" && git push
```

## ⚠️ 다음 — STEP 509
- 결과 반영해 렌즈 페이지 모멘텀 카드를 **canonical 12-1**로 정리(현재 얕은 1/3/6/12개월 → 12-1 중심) + 백테스트 근거 한 줄(정직).
- 이걸로 **"정의→데이터→엣지→검증→표현" 완주**가 (검증 결과가 +라면) 긍정 사례로 닫힘 → 기법 확장 방법론 확립.
