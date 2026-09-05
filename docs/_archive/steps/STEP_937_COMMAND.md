<!-- 2026-08-08 · STEP 937 · 관측 등재 전용 -->

# STEP 937 — 계측 ②차 **관측 결과 등재**: `recovered = 0` 직접 관측 확정 · 재시도는 "실패"가 아니라 **응답에 필드가 없었다**

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_937_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD = 문서 커밋 이후(936 코드 `5b35982` 위) · tsc 0 · test 182/182 · `REVDCF_ENABLED` Production **OFF** · `lib/lensPrecompute.ts` **936 배포본 그대로**

**성격**: 🔴 **관측 등재 전용. 코드 0줄 · DB 쓰기 0 · 크론 실행 0 · 판정 0.**

---

## 0. 🔴 금지 (하나라도 어기면 중단)

| # | 금지 |
|---|---|
| 1 | 🔴 **A안 ②단계(예산·상한 증액)를 판정하지 말 것** — 장은태 승인 사항 |
| 2 | 🔴 **934의 "불가" 판정(도달 상한 93.30%)을 뒤집지 말 것** |
| 3 | 🔴 **원인을 확정하지 말 것** — 916→933→934→935로 축이 **세 번** 바뀌었다. 이번이 네 번째 후보다 |
| 4 | 🔴 **A·B·C·D 선택지 병기 유지 · 새 선택지 만들지 말 것** |
| 5 | 🔴 `RETRY_MAX`·`RETRY_MS`·게이트 산식·임계값(97%/95%)·`maxDuration` **불변** |
| 6 | 🔴 `lib/lensPrecompute.ts` **수정 금지** · `lib/**`·`app/**`·`components/**`·`messages/**`·`data/**`·`.github/**`·`vercel.json` **diff 0** |
| 7 | 🔴 **DB 쓰기 금지**(읽기만) · **크론 수동 실행 금지** · `REVDCF_ENABLED` Production **OFF 유지** |
| 8 | 🔴 **DoD 판정 칸 불변** |
| 9 | 🔴 **다음 STEP 제안 금지** |

---

## §1. 관측 실측 — `cron_heartbeats` (job=`lens-scores`, 2026-08-07 21:39:56 UTC, `ok:false`)

```json
{"market":"US","freshCoverage":0.9227805695142378,"coverageOk":false,
 "compositionOk":false,"compRatio":0.93,"cutGateOk":false,
 "retryAllLen":461,"retrySetLen":400,"countHit":true,"timeHit":false,"retryBudgetHit":true,
 "stage1Ms":3436,"stage2Ms":13080,"stage3Ms":269,"acqMs":16785,
 "loopMs":135739,"pass2Ms":1075,"pruneMs":1,"calcMs":136815,"routeMs":154509,
 "churn":0.084,"skipChangeDiff":false,"computed":928,"universe":1000,
 "batchOk":5509,"noCapField":461,"noResponse":0,
 "recovered":0,"fallbackUsed":0,
 "failedChunks":0,"totalChunks":60,
 "retryCallMs":5703,"upsertMs":7377,
 "retryNoCapField":400,"retryFailReasons":{},"retryFailSample":[]}
```

**KR(`kr-lens-scores`, 08-07 10:43:34, `ok:true`)**: `coverage:1` · `coverageOk:true` · `cutGateOk:true` · `computed:976`. **문제 없음.**

---

## §2. 🔴 최우선 판정 — `recovered = 0` **직접 관측 확정**

| | 934 (대수적 도출) | **937 (직접 관측)** |
|---|---|---|
| `recovered` | 저장 안 됨 → 항등식으로 **도출** | **`0` — 필드로 직접 관측** |

**항등식 재검산 (이번 실행값으로)**
- `freshSet.size = batchOk + recovered` = 5,509 + 0 = **5,509**
- 분모 = 5,509 ÷ 0.9227805695142378 = **5,970.0000** (오차 없이 정수)
- `retryAllLen` = 5,970 − 5,509 = **461** ✅ 관측값과 일치
- `noCapField`(461) + `noResponse`(0) = 461 = `retryAllLen` ✅

🔑 **934의 대수적 도출이 관측으로 뒷받침됐다.** 재시도 400건이 **단 한 건도 복구하지 못했다.**

---

## §3. 🔴 그런데 원인 축이 또 바뀐다 — **"실패"가 아니었다**

**관측된 사실만 (해석 아님)**

| 필드 | 값 | 뜻 |
|---|---|---|
| `retryFailReasons` | **`{}`** | 🔑 **예외·에러가 0건.** 429도, 타임아웃도, 5xx도 없음 |
| `retryFailSample` | **`[]`** | 실패 표본이 비었다 = 잡을 실패가 없었다 |
| `retryNoCapField` | **400** | 🔴 **재시도한 400건이 전부 정상 응답을 받았고, 그 응답에 `marketCap` 필드가 없었다** |
| `noResponse` | **0** | 무응답 0 |
| `failedChunks`/`totalChunks` | **0 / 60** | 🔑 **Stage1 배치도 실패 0** |
| `batchOk` | **5,509** | 배치가 5,509건은 정상 취득 |

🔑 **936이 빈 `catch` 자리에 넣은 집계가 비어 있다는 것 자체가 결과다.** 재시도는 **실패하지 않았다.** 정상적으로 응답을 받았고, 그 응답에 필요한 필드가 없었다.

🔴 **원인 축 이력** — 912~934 *"예산(시간·개수) 문제"* → 935 *"취득 실패 가능성"* → **937 관측: 취득이 실패한 게 아니다.**

🔴 **여기서 원인을 확정하지 않는다.** 위는 **관측**이고, *"야후에 해당 종목의 시총이 없다"*는 **해석**이다. 축이 세 번 바뀐 이력을 고려해 **해석을 결론으로 승격시키지 않는다.** 확정하려면 별도 검증(같은 심볼을 개별 `yf.quote`로 조회해 필드 유무 확인)이 필요하고 **이 STEP의 범위가 아니다.**

🔑 **다만 934의 "불가" 판정과의 관계는 적을 수 있다** — 재시도가 에러 없이 같은 응답을 받는다면, **상한을 올려도 같은 응답을 더 많이 받는 것**이라는 방향이다. **934의 판정을 뒤집지 않으며, 강화 방향으로 관측됐다는 사실만 기록한다.**

---

## §4. 나머지 계측 해석

### 4-1. 🔑 935의 타이머 경계 문제 해소 — 933/934의 "34.5ms/건"은 오염된 값이었다

| 이번 관측 | 값 |
|---|---|
| `retryCallMs` (순수 재시도 호출) | **5,703ms** |
| `upsertMs` (DB 저장만) | **7,377ms** |
| 합 | 13,080ms = **`stage2Ms`와 정확히 일치** ✅ |

- 순수 재시도 = 5,703 ÷ 400 = **14.3ms/건**(동시성 6 기준 실효 왕복 ≈ 86ms)
- 🔴 **933/934가 쓴 34.5ms/건은 DB 저장이 섞인 값이었다.** 935의 지적이 관측으로 확인됨.
- `timeHit:false` · `countHit:true` — **시간이 아니라 개수(400)에서 잘렸다.** 916의 반대 결론(933)이 이번에도 재확인.

### 4-2. 커버리지는 개선됐으나 **재시도 덕이 아니다**

| | 934 시점 | **937** | 차이 |
|---|---|---|---|
| `freshCoverage` | 91.44% | **92.28%** | +0.84%p |
| `retryAllLen` | 511 | **461** | −50 |
| `batchOk` | (미기록) | **5,509** | — |
| 분모 | 5,968 | **5,970** | +2 |

🔑 **개선분은 전부 Stage1 배치가 50건 더 성공한 것**이다(`recovered`가 0이므로 재시도 기여 0). `data/us_symbols.json`이 매일 09:00 UTC 자동 갱신되므로 분모도 매일 바뀐다.

### 4-3. 미시도분과 도달 상한 (🔴 934 판정 재확인일 뿐, 재판정 아님)

- 미시도 = `retryAllLen`(461) − `retrySetLen`(400) = **61건**
- 미시도 61건을 **전부** 살린다고 가정: (5,509 + 61) ÷ 5,970 = **93.30%**
- 🔑 **934가 다른 날 데이터로 계산한 93.30%와 같은 값.** 🔴 **97% 임계 미달은 그대로.**

### 4-4. 🔴 구성 게이트도 미달 — 이번에 수치로 관측

- `compositionOk: false` · **`compRatio: 0.93`** (임계 0.95)
- 🔑 커버리지(97%)뿐 아니라 **구성(직전 상위 200 메가캡 fresh 확보율 95%)도 못 넘는다.** 두 게이트 **모두** 실패이므로 `cutGateOk:false`.
- 🔴 **이 값이 이전 관측에 기록돼 있었는지 확인하고, 신규 관측이면 그렇게 적을 것.**

---

## §5. ✅ 판정 불변 검증 — **936의 성공 기준 충족**

`docs/probe_936_baseline.json` 대비:

| 항목 | 배포 전 | **관측 시점** | 판정 |
|---|---|---|---|
| **표본 20종목 × 7렌즈 = 140칸** | — | — | ✅ **140칸 전부 동일 · 변화 0** |
| `lens_cuts` US 5행 `as_of` | 07-30 | **07-30** | ✅ 불변(정지 지속 = 9일째) |
| `lens_cuts` KR 5행 `as_of` | 08-06 | **08-07** | ✅ 정상 갱신 |
| `lens_scores` US 행수 | 1,001 | **1,021** | 🔶 +20 (churn 8.4% — 유니버스 일일 갱신·정상) |
| `lens_scores` KR 행수 | 975 | **976** | 🔶 +1 |
| `cron_heartbeats` 행수 | 4 | **4** | ✅ |

🔑 **936은 "값 계산 0건 변경"을 목표로 했고, 140칸 전수 대조로 충족이 확인됐다.**

---

## §6. 🔴 못 잰 것 (추정 금지)

| 항목 | 사유 |
|---|---|
| `marketCap` 필드가 **왜** 없는지 | 야후 내부 사정 — 우리 계측으로 원리적 불가 |
| 461건이 **어떤 종목**인지 | `retryFailSample`이 실패용이라 비었고, **필드 없음은 "실패"로 안 잡힌다** — 표본을 남기려면 별도 계측 필요 |
| 그 종목들이 개별 `yf.quote`로는 나오는지 | **미검증** — 915 프로브는 20건 표본이었고 조건(동시성·직전 맥락)이 다름 |
| `compRatio` 이전 값 | 이번 note에만 있음 — 과거 비교 불가(`cron_heartbeats`는 최신 1행만 보존) |
| `ok=false` 시작 시점 | 원리적 불가(최신 1행만 보존) |
| 461 중 폴백(`us_market_cap` 최근값) 적용분 | `fallbackUsed: 0` — **폴백도 0건** |

---

## §7. 이 STEP이 할 일

1. **§1~§6을 `docs/CHANGELOG.md`에 STEP 937 항목으로 등재**(🔴 931 플레이북 — *"CHANGELOG는 확인만"*으로 닫지 말 것. **이 STEP의 기록은 반드시 남긴다**).
2. `docs/DECISION_912_LIVE.md`에 §16 신설 — §2·§3·§4를 옮긴다.
3. `docs/REVDCF_SPEC.md` §11 실측 원장에 이번 수치 1건 추가.
4. `docs/STATE.md` "▶ 다음 00" 갱신 — **131~142줄 범위 유지**. 🔴 *"7렌즈 실사용자 노출 중"* 전제는 이미 정정됨(2026-08-07 장은태: 실사용자 없음) — **되돌리지 말 것.**
5. 🔴 **`docs/STEP_LEDGER.md`에 STEP 937 한 줄 추가** — 새 규칙 ⓐ(`CLAUDE.md` 「STEP 기록 규칙」). 결과 = `✅ 성공`(관측 목적 달성).
6. 플레이북 추가 여부 판단 — 🔑 **후보**: *"빈 집계(`{}`)도 결과다 — 실패 사유를 잡으려고 만든 자리가 비었다는 것은 실패가 없었다는 뜻이고, 그것이 원인 축을 바꾼다."* 중복이면 추가하지 않고 그 판단을 CHANGELOG에 적을 것.

**커밋 메시지**
```
STEP 937: observe instrumentation round 2 — recovered=0 confirmed directly, retries returned no error but no marketCap field
```

**완료 보고에 반드시 포함**: `git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/ vercel.json` 출력 없음 · tsc 0 · test 182/182 · DB 쓰기 0 · 크론 미실행 · 메일 발송 0 · `REVDCF_ENABLED` Production OFF · DoD 판정 칸 불변 · A안 ②단계 미판정 · 934 "불가" 판정 불변.
