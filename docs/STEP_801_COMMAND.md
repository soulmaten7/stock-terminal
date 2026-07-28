# STEP 801 — 🔬 렌즈 기법 정의 정합 (학술 원전 대조 결과 반영) + 계산 유닛 테스트 신설

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus` 🔴 **Opus 권장**(금융 계산 정의 변경)

**전제 상태**: STEP 800 커밋 이후 HEAD · 트리 클린

**착수 전 필독**: `docs/LENS_DEV_PLAYBOOK.md` §0 + 문제해결 로그.

---

## 배경 — Cowork 학술 원전 3중 대조 결과(07-27)

| 렌즈 | 원전 | 판정 |
|---|---|---|
| 모멘텀 12-1 | Jegadeesh-Titman 1993 | 구간 정의 **정확**, 단 **총수익률(배당 포함)**이 표준인데 우리는 배당 미조정 종가 사용 |
| 저변동성 | 우리는 **실현 변동성** 계산 | ❌ **이름이 틀림** — BAB(Frazzini-Pedersen 2014)는 **베타** 기반. 변동성 이상현상은 **Baker-Bradley-Wurgler 2011**이 원전 |
| 기술(RSI) | Wilder 1978 = α=1/14 재귀 평활 | ❌ 우리는 **단순평균(SMA)** = 별개 지표인 **Cutler's RSI**. 라벨·설명은 "와일더" |
| 퀄리티 GP/A | Novy-Marx 2013 | 분자·분모 정의 **정확**, 단 원전은 **기초(전기말) 총자산** |
| F-스코어 | Piotroski 2000 | 9항목 구성 **정확**, 단 ROA 분모가 원전은 **기초 총자산** |
| 자산성장 | Cooper-Gulen-Schill 2008 | **정확** |
| 밸류 E/P·B/M | Graham·Fama-French | 정의 **정확**(입력값 문제는 STEP 803) |

**장은태 결정(07-27)**: 어긋난 것은 바로잡는다.

---

## 수정

### 1) ❌→✅ 저변동성 렌즈 — 이름·계보 정정 (계산은 유지)

- **계산 변경 없음**(실현 변동성 유지 — 초보에게 직관적이고 베타는 지수 데이터 추가 배선이 필요).
- **정정 대상**: 렌즈 영문명에서 `(BAB)` 제거 → 실제 계산에 맞는 표기로(예: `Low Volatility`). `about`·`note`·서사(`narrativeMethodLowvol`)의 학술 계보를 **Baker-Bradley-Wurgler 2011(저변동성 이상현상)**로 교체. `/about` 페이지의 기법 계보 목록도 동일 정정.
- **금지**: BAB·Frazzini-Pedersen 인용을 남겨두는 것. 계산하지 않는 기법을 근거로 대는 것은 브랜드 정면 위반.
- 기존 백테스트 note에 BAB 근거가 인용돼 있으면, **그 note가 실제로 무엇을 검증했는지 확인 후** 문구를 사실에 맞게 조정(과장·확대 금지).

### 2) ❌→✅ RSI — 와일더 평활로 교정

- `lib/technical.ts`의 RSI를 **와일더 재귀 평활(α = 1/14)**로 변경: 첫 14봉은 단순평균으로 시드 → 이후 `avg = (avg*(n-1) + current) / n`.
- 이유: 화면 라벨이 `RSI(14)`이고 설명이 "와일더가 만든"이므로, **증권사 HTS·TradingView와 같은 값**이 나와야 사용자가 검증할 수 있다. 현행 SMA 방식은 Cutler's RSI라는 다른 지표.
- 판정 컷(30/70)은 이번엔 유지(컷 자체는 STEP 802에서 다룸).
- ⚠️ 이 변경으로 기존 스냅샷 테스트가 깨진다 — **의도된 변경**이므로 갱신하되, 갱신 diff에서 RSI 값만 바뀌고 다른 렌즈는 불변인지 확인.

### 3) ⚠️→✅ 모멘텀 — 배당 조정

- 야후 chart 호출 시 **배당 조정 종가**를 사용(`adjclose`/`events=div` 등 라이브러리가 제공하는 경로 확인 후 채택). 12-1은 총수익률 기준이 학술 표준.
- ⚠️ 200일선·RSI는 **가격 지표**이므로 조정 종가를 쓰면 차트와 어긋날 수 있다 → **모멘텀·수익률 계산에만 조정 종가**, 기술 지표엔 현행 종가를 쓰는 식으로 분리할지 판단하고 **선택과 근거를 보고에 기재**.
- 조정 종가를 못 얻는 종목은 현행 종가로 폴백하되 **그 사실을 데이터에 표시**(향후 정직 표기용).

### 4) ⚠️→✅ GP/A·F스코어 ROA — 기초 총자산

- Novy-Marx GP/A와 Piotroski ROA의 분모를 **직전 회계연도 말 총자산**으로 변경(원전 정의). 직전 연도 데이터가 없으면 **계산 불가로 처리**(기말로 대체하지 말 것 — 정의를 흐리는 편법).
- ΔROA 등 비교 항목도 같은 기준으로 일관되게.

### 5) 🔴 계산 유닛 테스트 신설 (이번 STEP의 절반)

현재 계산 정확성을 검증하는 테스트가 **0건**이고, 특성화 스냅샷이 오히려 버그를 고정하고 있다.

- `lib/momentum.test.ts` — 알려진 입력에 대한 12-1 값, 룩백 구간이 정확히 [t-252, t-21]인지, 결측 시 null.
- `lib/technical.test.ts` — **와일더 RSI를 공개된 참조값과 대조**(예: 표준 예제 시계열의 RSI 값). SMA 200 계산, 데이터 부족 시 null.
- `lib/lowvol.test.ts` — √252 환산, 최소 표본 미달 시 null(STEP 803과 연동).
- `lib/fscore.test.ts` — 9항목 각각에 대해 pass/fail이 갈리는 경계 케이스. **기존의 잘못된 "은행·보험" 기대값은 STEP 803에서 정정되므로 이번엔 건드리지 말 것**(중복 수정 방지).
- 테스트는 **값을 검증**해야 한다 — 스냅샷 찍기 금지.

## 검증

1. `npx tsc --noEmit` 0 · `npm run test`(신규 테스트 포함 전부 통과) · `npm run build`
2. **RSI 정합 실증**: KR 종목 2개(삼성전자 등)의 RSI(14)를 외부 툴(증권사 HTS·TradingView 등 공개 값)과 대조해 **소수점 수준에서 근접**하는지 보고에 수치로 기재. 교정 전/후 값도 함께.
3. 모멘텀: 배당 지급 이력이 있는 KR 종목에서 조정 전/후 12-1 값 차이를 보고.
4. GP/A·F스코어: 기말→기초 변경 전후 값 비교(KR 2종목).
5. 라이브: 종목 상세 렌즈 카드가 정상 렌더 · 저변동성 카드에 BAB 표기 0(grep) · `/about` 계보 정정 확인.
6. `docs/LENS_DEV_PLAYBOOK.md` 문제해결 로그에 **"기법 이름과 실제 계산이 어긋난 사례(BAB)"** 교훈 기록.
7. 커밋:
   ```bash
   git add app/ components/ lib/ messages/ docs/
   git commit -m "STEP 801: align lens methods with source papers (wilder rsi, low-vol lineage, dividend-adjusted momentum, beginning assets) and add real calculation tests"
   git push
   ```

## 완료 보고 → Cowork에게: RSI 외부 대조 수치 + 각 변경의 전후 값 + 신규 테스트 목록 + 커밋 해시. (직후 802.)
