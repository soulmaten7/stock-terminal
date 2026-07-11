<!-- 2026-07-02 -->
# STEP 510 — 저변동성 다년 백테스트 (검증 먼저) · 가격 데이터만

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_510_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
세 번째 기법 = **저변동성**. 모멘텀처럼 검증부터(가격만). 매월 유니버스를 실현변동성 3분위(저/중/고)로 나눠 이후 3개월 **수익률 + 실현위험** 비교.
- **핵심 관점**: 저변동성 이례현상은 "위험 대비" 성과 — 저변동군이 위험(변동성)은 훨씬 낮으면서 수익은 비슷/더 나은지. **수익만이 아니라 위험도 같이 본다.**
- **Cowork이 이미 작성함**: `lib/lowvol.ts`, `scripts/backtest_lowvol.ts`. 이 STEP = 실행 + 보고 + 커밋.

## 0) 확인
```bash
cd ~/stock-terminal && ls -la lib/lowvol.ts scripts/backtest_lowvol.ts
```

## 1) 실행
```bash
npx tsx scripts/backtest_lowvol.ts
```

## 2) 결과 공유 (Cowork에)
- [ ] 저/중/고 변동 3분위 각: 3개월 수익(+연율) · **평균 실현변동성** · 표본 n.
- [ ] **저−고 수익차** + **저변동군 위험이 고변동군의 몇 %인지**.
- [ ] 판정: 저변동군이 (a) 위험 훨씬 낮고 (b) 수익 비슷/우위 → 이례현상 확인(위험대비 우수). 수익만 낮고 위험만 낮으면 "위험조절용"으로 정직 기록.

## 3) 커밋
```bash
git add lib/lowvol.ts scripts/backtest_lowvol.ts && git commit -m "feat(validate): 저변동성 다년 백테스트(3분위·수익+위험) + lib/lowvol (STEP 510)" && git push
```

## ▶ 다음 — 방향 선택 (Cowork과 상의)
STEP 511 후보:
- (a) 저변동성 렌즈 표시(결과 반영, canonical) → 무료 렌즈 4종 세트 완성(모멘텀·기술·밸류·F-Score·저변동).
- (b) **유료 "AI보기"(LLM 종합)** 착수 — 무료 렌즈들 + 실시간 뉴스/공시를 종목 맥락에서 묶어 서술(수익화 핵심). LLM API 키 필요.
- (c) KR·글로벌 확장(모멘텀·저변동은 가격만이라 4개국 즉시).
> 방법론은 이미 확립(2~3기법). 이제 **(b) 유료 AI보기로 수익화 축을 세울지**, (a)로 무료 렌즈를 더 갖출지 정할 시점.
