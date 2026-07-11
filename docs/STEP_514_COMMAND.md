<!-- 2026-07-02 -->
# STEP 514 — 재감사(태그 확장 + 실패원인 분류)로 "진짜 갭" 확인

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_514_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
"백테스트가능 26%"가 낮아 보인 건 **금융주(구조상 F-Score 미적용)를 데이터갭과 뭉뚱그렸기 때문**. 이제 감사가 실패 원인을 분류하니 **진짜 지표 = "비금융(분류BS 보유) 종목 중 백테스트가능 %"**를 본다. + costOfRevenue 태그 변형 추가.
- **Cowork이 이미 수정함**: `lib/edgar.ts`(costOfRevenue에 CostOfRevenues·CostOfOperatingRevenues·CostOfSales 추가), `scripts/audit_data.ts`(금융/태그갭/연수부족/백테스트가능 분류 + "비금융 중 %").
- 이 STEP = 재감사 실행 → 진짜 지표 확인 → 판단·커밋.

## 1) 재감사
```bash
cd ~/stock-terminal
npx tsx scripts/audit_data.ts
```

## 2) 결과 공유 (Cowork에) — 특히 새 줄들
- [ ] **실패 원인 분류**: EDGAR없음 / 금융·구조상미적용 / **태그갭(고칠대상)** / 연수부족 / 백테스트가능 각 몇 개.
- [ ] **"비금융(분류BS 보유) N종목 중 백테스트가능 X%"** ← 이게 진짜 지표.
- [ ] totalRevenue·grossProfit 채움률(태그 추가 후 상승했는지).

## 3) 판단
- **비금융 중 백테스트가능이 높음(60%+)** → 데이터 충분(낮아 보였던 건 금융주 착시). → `lib/edgar.ts` 커밋 후 **F-Score 넓은 유니버스 재검증(STEP 515)**로.
- **태그갭이 아직 큼** → 감사 출력에서 어떤 필드가 낮은지 Cowork에 알려줘 → 태그 후보 더 추가 → 재감사 반복(정확해질 때까지).

## 4) 커밋 (데이터 충분 확인 시)
```bash
git add lib/edgar.ts scripts/audit_data.ts && git commit -m "fix(edgar): costOfRevenue 태그 변형 추가 + 감사 실패원인 분류(금융/태그갭 구분) (STEP 514)" && git push
```

## ▶ 다음
- 데이터 충분 → **STEP 515: F-Score 넓은 유니버스 재검증**(비금융 백테스트가능 종목으로, 이번엔 표본 커서 진짜 검증). 결과 정직 기록 + 플레이북 로그.
- (모멘텀·저변동도 넓은 유니버스 재확인은 그 뒤. 표시·수익화는 전부 검증 후.)
> ⚠️ 이 STEP 결과의 교훈은 받는 즉시 `docs/LENS_DEV_PLAYBOOK.md` 로그에 반영(그때그때 규칙).
