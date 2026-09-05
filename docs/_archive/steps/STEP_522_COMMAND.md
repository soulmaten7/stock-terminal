<!-- 2026-07-02 -->
# STEP 522 — 기술(RSI·MA) 백테스트 검증 (마지막 미검증 렌즈)

> 원칙: 한 번에 하나 완전히. 5렌즈 중 마지막 미검증 = 기술. 이것만 닫으면 무료 렌즈층 전부 판정 완료.
> 기술은 팩터(횡단면 순위)가 아니라 **상태 신호** → 3분위 아닌 상태별 이후수익 비교.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_522_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
기술 렌즈(현재 "미검증 참고용")를 같은 $5+ 틀로 검증 → 정직 판정.
- **Cowork이 이미 작성/리팩터**:
  - `lib/technical.ts`(신규) — RSI·SMA·상태라벨 순수함수. 렌즈·백테스트가 **같은 함수** 사용(§0-3 엔진=검증 일치).
  - `lib/lenses.ts` — 로컬 rsi/sma 제거하고 `lib/technical`에서 import(리팩터). 동작 동일.
  - `scripts/backtest_technical.ts` — RSI 상태·200일선별 이후 1M·3M 수익률.
- 이 STEP = **빌드(리팩터 검증) + 백테스트 실행 + 결과 보고**. ⚠️ **커밋하지 말 것**(판정 후 STEP 523).

## 0) 변경 확인
```bash
cd ~/stock-terminal && grep -c "export function rsi" lib/technical.ts && grep -c 'from "./technical"' lib/lenses.ts && ls -la scripts/backtest_technical.ts
```
- [ ] technical.ts export 있음, lenses.ts가 import함, 스크립트 존재.

## 1) 빌드 (리팩터가 렌즈 안 깨는지 — 먼저)
```bash
npm run build 2>&1 | grep -E "error|Error|Compiled|Failed"
```
- [ ] "Compiled successfully". 에러 나면 여기서 멈추고 보고(리팩터 문제).

## 2) 렌즈 동작 확인 (클린 재시작 후)
```bash
pkill -f "next dev"; rm -rf .next && npm run dev > /tmp/nextdev.log 2>&1 &
sleep 12 && curl -s "http://localhost:3333/api/lens?symbol=NVDA" | python3 -c "import sys,json; d=json.load(sys.stdin); t=[x for x in d['lenses'] if x['key']=='technical'][0]; print('name:',t['name'],'| short:',t['short'],'| long:',t['long'],'| detail:',t['detail'])"
```
- [ ] 기술 렌즈 정상(RSI·200일선대비·52주위치 숫자, short/long 라벨). 리팩터 전과 동일해야.

## 3) 백테스트 실행 (몇 분 — 250종목 월간 패널)
```bash
cd ~/stock-terminal && npx tsx scripts/backtest_technical.ts
```

## 4) 결과 전체 붙여넣어 보고 (순서대로)
1. **[데이터 커버리지]** — 종목 수·stock-month 관측치(수천 건 나와야 정상).
2. **① RSI 평균회귀 엣지(침체−과열)** 1M·3M — 양수면 "침체 매수" 우위(평균회귀 작동).
3. **② 200일선 추세 엣지(위−아래)** 1M·3M — 양수면 추세추종 우위.

## ✅ 판정 기준 (STEP 523에서 반영)
- RSI·MA 둘 다 뚜렷한 `+` → 기술 검증(조건부 명시).
- 한쪽만/미미 → 조건부(어느 신호만 유효한지). 예상: MA 추세는 약한 +, RSI는 미미할 가능성.
- 둘 다 ≈0/음수 → **정직 기각**(렌즈는 "참고용" 유지, 단독 신호 약함 기록). ← 그래도 5렌즈 세트는 **완결**(판정 완료).
- 커버리지 부실하면 데이터부터.

## ▶ 다음 (STEP 523 — 결과 보고 후 Cowork이 설계)
- 기술 note 정직화 + 적합영역·플레이북 **그때그때** 갱신 + 리팩터·백테스트 커밋 → **5렌즈 세트 완결**(무료층 전부 정직 판정).
- 이후: KR/글로벌 렌즈 확장 or 새 기법. (수익화·UX는 계속 뒤로.)
