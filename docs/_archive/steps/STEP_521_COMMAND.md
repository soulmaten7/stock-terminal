<!-- 2026-07-02 -->
# STEP 521 — 밸류 검증 반영 (렌즈 문구 정직화 + 문서 갱신 + 커밋)

> STEP 520 결과: **E/P 싼−비쌈 +10.2%/년(13중 11코호트 양수)=검증**, B/M +5.5%(2018·2019 성장주기 역전)=조건부. 가치 프리미엄 확인($5+ 투자가능·은행 포함).

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_521_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
밸류 렌즈 "미검증"→검증(E/P)·조건부(B/M) 정직 반영 + STEP 520 인프라(EDGAR 자기자본·backtest_value)까지 함께 커밋 → **밸류 닫기**.
- **Cowork이 이미 수정**:
  - `lib/lenses.ts` — 밸류 렌즈 name "밸류(가치)"·note 검증 문구(+10.2%p·B/M 조건부·섹터내 상대비교).
  - `docs/LENS_STRENGTH_MAP.md` — 밸류 행 [검증]·[검증·조건부], 주의 문구(미검증=기술만).
  - `docs/LENS_DEV_PLAYBOOK.md` — 문제로그 #16(밸류·조건부 교훈 4가지).
  - (STEP 520 미커밋분) `lib/edgar.ts`(stockholdersEquity), `scripts/backtest_value.ts`.
- 이 STEP = 빌드 + 검증 + 커밋. ⚠️ API 라우트 → 클린 재시작.

## 0) 확인
```bash
cd ~/stock-terminal && grep -c "가치 프리미엄 검증" lib/lenses.ts && grep -c "밸류(E/P·B/M)" docs/LENS_STRENGTH_MAP.md && grep -c "| 16 |" docs/LENS_DEV_PLAYBOOK.md && grep -c "stockholdersEquity" lib/edgar.ts
```
- [ ] 각각 1 이상.

## 1) 빌드 + 클린 재시작
```bash
npm run build
```
```bash
pkill -f "next dev"; rm -rf .next && npm run dev
```

## 2) 검증 (localhost:3333)
```bash
sleep 8
curl -s "http://localhost:3333/api/lens?symbol=NVDA" | python3 -c "import sys,json; d=json.load(sys.stdin); v=[x for x in d['lenses'] if x['key']=='valuation'][0]; print('name:',v['name']); print('note:',(v.get('note') or '')[:80])"
```
- [ ] name = "밸류(가치)".
- [ ] note 앞부분에 "가치 프리미엄 검증" + "+10.2%".
- [ ] `/stock/NVDA` 페이지 밸류 카드 정상.

## 3) 커밋 (STEP 520 인프라 + 521 정직화 함께)
```bash
git add lib/lenses.ts lib/edgar.ts scripts/backtest_value.ts docs/LENS_STRENGTH_MAP.md docs/LENS_DEV_PLAYBOOK.md docs/STEP_520_COMMAND.md docs/STEP_521_COMMAND.md && git commit -m "feat(lens): 밸류 검증 반영 — E/P +10.2%p/년 검증·B/M 조건부, EDGAR 자기자본+백테스트 (STEP 520·521)" && git push
```

## ✅ 여기까지 = 밸류 닫힘 (4번째 검증 렌즈)
- 검증: 모멘텀·저변동·F-Score·**밸류(E/P)**. 조건부: B/M. 남은 **미검증 = 기술(RSI·MA) 하나**.
## ▶ 다음 (STEP 522 후보)
- 마지막 미검증 1개 **기술(RSI·MA)** 같은 $5+ 틀로 검증 → 5렌즈 세트 완결. (아마 무의미로 나올 가능성 — 어느 쪽이든 정직 라벨.)
- 그 후: KR/글로벌 렌즈 확장 or 새 기법(퀄리티·마법공식). (수익화·UX는 계속 뒤로.)
