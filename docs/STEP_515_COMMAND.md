<!-- 2026-07-02 -->
# STEP 515 — F-Score 넓은 유니버스 재검증 (진짜 검증) + 데이터 커밋

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_515_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
데이터 갭 논의 종료: 40%는 상당부분 구조적 상한(무COGS 서비스=정상 제외). 커버리지 100% 쫓는 대신 **유니버스를 넓혀 절대 표본 확보** → F-Score를 대형주 편향 없이 재검증.
- **Cowork이 이미 수정함**: `lib/edgar.ts`(업종별 매출 태그 4종 추가), `scripts/backtest_edgar.ts`(유니버스를 us_symbols에서 ~200 고루 표본 + 동시성 6).
- 이 STEP = **넓은 백테스트 실행 → POOLED 결과 보고 → 커밋**.
- ⚠️ EDGAR companyfacts ~200개 = **수 분~10분**. 끊기면 `backtest_edgar.ts`의 `N = 200`을 `120`으로 줄여 재실행.

## 0) 확인
```bash
cd ~/stock-terminal && grep -n "const N = " scripts/backtest_edgar.ts && grep -c "RealEstateRevenueNet" lib/edgar.ts
```

## 1) 넓은 F-Score 백테스트
```bash
npx tsx scripts/backtest_edgar.ts
```

## 2) 결과 공유 (Cowork에)
- [ ] 종목 성공 수 · 관측 건수(대형주 75개 때보다 커야 함).
- [ ] cohort별 + **POOLED (high·mid·low·spread(high−low))**.
- [ ] high/low 표본 n이 충분한지(각 수십+).

## 3) 판단 (이번이 F-Score "진짜" 검증)
- **POOLED spread(high−low)가 뚜렷이 +이고 일관** → 넓은 못에선 F-Score 신호 유효 → 카드 문구를 그에 맞게 정직 갱신.
- **여전히 0 근처/불규칙** → 대형·중형 중심 표본에선 F-Score 약함이 진짜(소형·초가치는 us_symbols 표본에도 한계). → "재무 건전성 해석" 유지가 정직.
- 어느 쪽이든 **결과 그대로** + 그 교훈 `docs/LENS_DEV_PLAYBOOK.md` 로그에 즉시(그때그때) 반영. 교훈엔 "이 표본/조건" 맥락 붙일 것(§0-7).

## 4) 커밋
```bash
git add lib/edgar.ts scripts/audit_data.ts scripts/backtest_edgar.ts && git commit -m "feat(validate): F-Score 넓은 유니버스 재검증(us_symbols ~200 표본) + 업종매출 태그 (STEP 515)" && git push
```

## ▶ 다음
- 결과 반영해 F-Score 카드 정직 문구 최종화(STEP 516).
- 그 후 모멘텀·저변동도 넓은 유니버스로 재확인(가격만이라 가벼움) → 3기법 검증을 "제대로 된 데이터·유니버스" 위에서 마무리.
- (표시 정리·수익화는 전부 그 뒤.)
