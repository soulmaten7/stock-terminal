<!-- 2026-07-02 -->
# STEP 513 — EDGAR 매출/매출원가 태그 확장 → 재감사로 데이터 갭 수정 확인

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_513_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
STEP 512 감사에서 확인된 데이터 갭(grossProfit 44%·totalRevenue 62%)을 태그 확장으로 메운다. → 백테스트 가능 종목이 25%에서 크게 늘어야 F-Score를 "제대로" 재검증할 수 있음.
- **Cowork이 `lib/edgar.ts` 이미 수정함**: totalRevenue 후보 9종(ASC606·구표준·은행·유틸)·costOfRevenue 5종으로 확장. 이 STEP = **재감사 실행 → 개선 확인 → 커밋**.
- grossProfit은 매출−매출원가로 자동 계산되므로 이 둘이 오르면 함께 오름.

## 0) 확인
```bash
cd ~/stock-terminal
grep -c "RevenueFromContractWithCustomerExcludingAssessedTax" lib/edgar.ts   # 1 이상이면 확장 반영됨
```

## 1) 재감사 (STEP 512와 동일 스크립트, 수 분)
```bash
npx tsx scripts/audit_data.ts
```

## 2) 결과 비교 (Cowork에)
STEP 512 대비:
- [ ] **totalRevenue 채움률** 62% → ? (목표 85%+)
- [ ] **grossProfit 채움률** 44% → ? (매출·매출원가 확장으로 상승)
- [ ] **백테스트가능(F-Score 3년+)** 25% → ? (목표 60%+)
- [ ] 정확성 대조(AAPL·JNJ·KO) 여전히 정상인지(태그 추가로 엉뚱한 값 안 잡히는지).

## 3) 판정 + 커밋
- **백테스트가능 % 크게 상승** → 데이터 갭 해소. 커밋:
```bash
git add lib/edgar.ts && git commit -m "fix(edgar): 매출·매출원가 XBRL 태그 후보 확장(소형주 변형) — F-Score 데이터 커버리지 개선 (STEP 513)" && git push
```
- **여전히 낮음** → 아직 빠진 태그가 있다는 것. 감사 출력의 낮은 필드를 Cowork에 알려주면 후보 더 추가(재감사 반복). **정확한 데이터가 될 때까지 반복 — 이게 "제대로".**

## ▶ 다음 — STEP 514
- 데이터 충분(백테스트가능 60%+) 확인되면 → **넓은 유니버스로 F-Score 재검증**(이번엔 표본이 커서 진짜 검증). 결과가 어떻든 정직하게.
- 그 후 모멘텀·저변동도 넓은 유니버스로 재확인 → 3기법 검증을 "제대로 된 데이터" 위에서 마무리.
- (표시·수익화는 전부 그 뒤.)
