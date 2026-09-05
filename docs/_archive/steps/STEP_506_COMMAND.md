<!-- 2026-07-02 -->
# STEP 506 — EDGAR 어댑터 + F-Score 다년 백테스트 (진짜 검증)

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_506_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
SEC EDGAR 深재무(2009~) + 야후 深가격으로 F-Score를 **2014~2023 10개 코호트** 백테스트. 실제 엔진(`lib/fscore`) 재사용. 고(7~9)/중(4~6)/저(0~3) 그룹의 이후 1년 수익률 비교 → **여러 국면 걸친 신호 유효성** 정직 측정.
- **Cowork이 이미 작성함**: `lib/edgar.ts`(어댑터), `scripts/backtest_edgar.ts`(백테스트). 이 STEP = **실행 + 결과 보고 + 커밋**.
- ⚠️ EDGAR companyfacts가 종목당 수 MB라 **수 분 소요**. 10분 넘어 끊기면 UNIVERSE를 절반으로 줄이거나 mapLimit을 6으로.

## 0) 파일 확인
```bash
cd ~/stock-terminal
ls -la lib/edgar.ts scripts/backtest_edgar.ts lib/fscore.ts
```

## 1) 백테스트 실행 (수 분)
```bash
npx tsx scripts/backtest_edgar.ts
```
> `node`로 안 됨(TS import) — **반드시 `npx tsx`**. 403/429 뜨면 UA·rate 문제 → 보고.

## 2) 결과 공유 (Cowork에 붙여넣기/스샷)
- [ ] 종목 성공 수 / 총 관측 건수.
- [ ] cohort별 표(2014~2023) + **POOLED 줄(high · mid · low · spread(high−low))** — 이게 핵심.
- [ ] high/low 그룹 표본 수(n)가 각 수십 이상인지(너무 작으면 신뢰↓).

## 3) 판정 (Cowork이 결과 보고 확정)
- **POOLED spread(high−low)가 뚜렷이 + 이고 여러 코호트에서 일관** → F-Score 신호 유효 → 카드에 정직한 track record 한 줄 추가 가능.
- **0 근처/불규칙** → "이 표본(대형주 중심)에선 약함 — 소형·가치주에서 강한 게 정설" 그대로 기록. 어느 쪽이든 **정직하게**.

## 4) 커밋
```bash
git add lib/edgar.ts scripts/backtest_edgar.ts && git commit -m "feat(validate): SEC EDGAR 어댑터 + F-Score 다년 백테스트(2014~2023 10코호트) (STEP 506)" && git push
```

## ⚠️ 다음
- 결과 → F-Score 카드 신뢰도 문구 확정(STEP 507, 정직 버전).
- 이 EDGAR 어댑터는 **US 재무 렌즈 공용 토대** — 이후 마법공식·Z-Score 등도 재사용. 또 제품의 "深재무 F-Score(US)"로도 승격 가능(야후 5년 한계 대체).
- 이후: KR 검증은 DART(무료·다년) 동일 패턴 / 또는 다음 기법.
