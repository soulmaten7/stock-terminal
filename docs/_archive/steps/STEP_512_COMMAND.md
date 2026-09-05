<!-- 2026-07-02 -->
# STEP 512 — 데이터 감사 (재검증 전 진단) · 리포트만, 변경 없음

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_512_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
"기법이 약한 것"과 "데이터가 부족·불완전한 것"을 가른다. 넓은 표본(us_symbols에서 고루 ~120 + 대형주 대조)에 **실제 어댑터(lib/edgar·lib/fscore) + 야후**를 그대로 돌려:
1. **정확성** — 대형주 몇 개 값이 실제와 맞나(spot-check).
2. **완전성** — F-Score 9필드 채움률(%), 백테스트 가능 종목 비율.
3. **양·대표성** — 소형·중형 포함 넓은 표본에서 EDGAR·가격이 얼마나 잡히나.
- **커밋 없음.** 리포트 → 갭 있으면 다음 스텝에서 태그/필드/추출 보강. 없으면 유니버스 넓혀 재검증.

## 0) 확인
```bash
cd ~/stock-terminal && ls -la scripts/audit_data.ts lib/edgar.ts lib/fscore.ts data/us_symbols.json
```

## 1) 실행 (EDGAR companyfacts 다수 → 수 분 소요)
```bash
npx tsx scripts/audit_data.ts
```
> 10분 넘어 끊기면: `scripts/audit_data.ts`의 `slice(0, 120)`을 `slice(0, 60)`으로 줄여 재실행.

## 2) 결과 공유 (Cowork에 그대로)
- [ ] 가격: 5년+ 종목 비율(모멘텀·저변동 넓은 검증 가능한지).
- [ ] EDGAR: 재무 있음 % · **백테스트가능(F-Score 3년+) %** · 평균 연수.
- [ ] **F-Score 9필드 채움률** — 특히 낮은 필드(longTermDebt·shares·grossProfit 등).
- [ ] 정확성 대조(AAPL·JNJ·KO) 값이 상식적인지.

## 3) 해석 (Cowork이 결과 보고)
- **가격 커버리지 높음(예상)** → 모멘텀·저변동은 넓은 유니버스로 바로 재검증 가능.
- **EDGAR 백테스트가능 % 낮거나 특정 필드 채움률 저조** → 소형주에서 XBRL 태그가 달라 데이터가 새는 것 → **태그 후보 확장·추출 보강 필요**(기법 탓 아님). 보강 후 F-Score 재검증.
- 값이 이상(음수 자산 등) → 추출 버그 → 수정.

## ▶ 다음
- 데이터 갭 발견 시: EDGAR 어댑터 태그 후보 확장 / 필드 보강 → 재감사.
- 데이터 충분 확인 시: **넓은 유니버스로 저변동성·F-Score 재검증**(모멘텀도 재확인) → 그때가 "진짜 검증".
- (수익화·표시·AI보기는 전부 그 뒤 — 지금 무관.)
