# STEP 866C — OTC 시총 조달 가능성 실측 + 동시 결격 재분류 (측정 전용)

**실행 명령어** (Sonnet)

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

```
@docs/STEP_866C_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `52db062`(STEP 866B) · 로컬 2커밋 ahead(미푸시) · tsc 0 · vitest 151/151 · `REVDCF_ENABLED` OFF · `revdcf_results` = 2026-08-01/02/03 각 604

---

## 왜 866C인가 — 866B가 남긴 두 구멍

**① "OTC 산출 0"의 원인이 OTC가 아니다**

866B 교차표는 `computed(a) OTC 0` · `undecidable(b) OTC 0` · `insufficient(c) OTC 486`이었다. Cowork이 `probe_866b_rows.json`을 직접 집계한 결과:

| 확인 | 결과 |
|---|---|
| final OTC 486의 시총 보유 | **0 / 486** |
| `damodaran_industry` OTCPK 2,152 중 `us_market_cap` 보유 | **8건 (0.4%)** — NYSE 94.8% · NasdaqGS 94.9% · NasdaqCM 90.4% |
| final OTC 486 중 `data/us_symbols.json`(6,766)에 있는 것 | **0개** (거래소상장은 2,838/2,857 = 99.3%) |
| `us_market_cap` 기록자 | `lib/lensPrecompute.ts:134` — 위 심볼 목록으로 upsert |
| Yahoo 공식 거래소 목록 | *"United States of America \| **OTC Markets Group** \| 15 min \| ICE Data Services"* — **커버한다** |

🔴 **막힌 게 아니라 안 넣은 것이다.** 486 전원이 시총 결격이므로 드라이버를 다 통과해도 `NO_MARKETCAP`에서 죽는다. **산출 0은 수학적으로 예정돼 있었다.**

→ 따라서 **"OTC를 포함하면 분포가 어떻게 되나"는 아직 한 번도 측정된 적이 없다.** 866C가 그걸 잰다.

**② `insufficientCause` 분류가 순서 의존이라 무효**

파이프라인이 `computeDrivers` → `NO_INDUSTRY` → `NO_MARKETCAP` 순이라 **먼저 걸린 사유 하나만** 기록된다. OTC 486의 실제 분해:

| subTag | n | 866B 분류 | 실제 |
|---|---|---|---|
| `INSUFFICIENT_HISTORY` | 199 | "회사 공시 부재" | 🔴 **시총도 없다** |
| `NO_MARKETCAP` | 135 | 우리 조달 실패 | ✓ |
| `MISSING_TAG` | 124 | "회사 공시 부재" | 🔴 **시총도 없다** |
| `NO_INDUSTRY` | 24 | 우리 조달 실패 | ✓ |
| 기타 | 4 | 기타 | — |

시총 결측만 세도 **518**(`no-mcap` 버킷). 기록된 "우리 조달 실패 246"의 **2.1배**.

---

## 🔴 금지사항

| # | 금지 |
|---|---|
| 1 | `lib/revdcf/**` · `lib/lensPrecompute.ts` 수정 — 읽기·import만 |
| 2 | 🔴 **`us_market_cap`에 쓰기** — 866C가 받아온 OTC 시총을 **프로덕션 테이블에 넣지 말 것.** 측정 전용 파일로만 |
| 3 | `revdcf_results` 쓰기 |
| 4 | `data/us_symbols.json` 수정 — **목록 확장은 채택 결정 후** |
| 5 | `app/**` 수정 · 플래그 변경 · 화면 변경 |
| 6 | **"OTC를 넣자/빼자" 제안** · 컷 제안 |
| 7 | `git push` |

🔴 **2번·4번 강조**: 866C는 *"OTC를 유니버스에 넣을 수 있나"* 를 **재는** STEP이지 **넣는** STEP이 아니다. `us_symbols.json`을 늘리면 다음 크론이 `us_market_cap`을 바꾸고, 그러면 7렌즈 유니버스까지 움직인다. **한 줄도 건드리지 말 것.**

---

## 1단계 — OTC 486 시총 실측

**신규 파일**: `scripts/probe_866c_otc_supply.ts`

**재사용할 것**(새로 만들지 말 것): `scripts/probe_us_universe.ts`의 `yf.quote(chunk)` 배치 패턴 — 100개씩 묶고 동시성 6, `yahoo-finance2` v3.14.0(이미 설치됨).

대상 = `docs/probe_866b_rows.json`에서 `ladderStage === "final"` 이고 `exchangeSec === "OTC"` 인 **486개의 `symbol`**.

```
docs/probe_866c_supply.json
{
  "otcN": 486,
  "quoteReturned": ?,        // 야후 응답에 심볼이 등장한 수
  "hasMarketCap": ?,         // marketCap > 0
  "hasPriceOnly": ?,         // 가격은 오는데 marketCap 없음
  "noResponse": ?,
  "marketCapPercentiles": { "p10": ?, "p50": ?, "p90": ? },
  "byExchangeField": { ... } // 야후가 돌려준 fullExchangeName 분포
}
```

🔴 **`hasPriceOnly`를 따로 세는 이유**: 파이프라인은 `sharePrice = mcap / shares`로 역산하는데, `shares`는 이미 companyfacts에서 나온다(`dr.market.shares`). **가격만 있어도 `mcap = price × shares`로 채울 수 있다.** 어느 경로가 더 많이 잡히는지가 재료다. **어느 쪽을 쓸지는 제안하지 말 것.**

🔴 **야후 심볼 표기 차이 주의**: OTC는 접미사 규칙이 다를 수 있다(예: `RNLXY`·`ZOMDF`·`VREOF`). **응답 없음으로 처리하기 전에 원티커 그대로 1회만** 시도하고, 변형 탐색은 하지 말 것(추측 금지). 응답 없음 수를 그대로 보고한다.

---

## 2단계 — 시총이 붙었을 때의 분포 변화

866B의 캐시된 companyfacts를 재사용한다(**재다운로드 금지**). 1단계에서 시총을 확보한 OTC에 대해서만 기존 엔진을 다시 태운다.

```ts
import { computeDrivers } from "../lib/revdcf/drivers";
import { assembleWacc, creditSpreadFor, computeGapWithSensitivity } from "../lib/revdcf/compute";
import { runRevDcf } from "../lib/revdcf/engine";
```

조립은 `app/api/cron/revdcf/route.ts`의 `processOne()`을 그대로 따른다(`maxYears: 25`). **시총만 866C 실측값으로 대체**하고 나머지는 동일.

🔴 **`NO_MARKETCAP` 135는 드라이버·업종을 이미 통과한 것들이다.** 시총만 붙으면 즉시 (a) 또는 (b)로 간다. 이 135의 이동 결과를 **따로** 보고한다.

```json
{
  "otcWithMcap": ?,
  "moved": { "computed": ?, "undecidable": ?, "stillInsufficient": ? },
  "from135_NO_MARKETCAP": { "computed": ?, "undecidable": ?, "failedElsewhere": ? },
  "gapYearsOtc": { "median": ?, "p25": ?, "p75": ?, "n": ? },
  "verdictMixOtc": { "years": ?, "over_cap": ?, "value_destroying": ?, "below_one": ? }
}
```

**전수 재집계** — OTC 이동분을 반영한 새 분포를 866B 값과 나란히:

| | 866B | 866C |
|---|---|---|
| N | 3,354 | 3,354 |
| computed (a) | 364 | ? |
| undecidable (b) | 1,688 | ? |
| insufficient (c) | 1,302 | ? |
| 산출률 (a)÷N | 10.9% | ? |
| GAP 중앙 | 8년 | ? |
| ICC (860 정의) | 0.165 | ? |
| micro 버킷 산출률 (N 기준) | 3.3% | ? |

---

## 3단계 — 🔴 동시 결격 재분류 (순서 의존 제거)

`insufficient` **1,302 전원**에 대해 **먼저 걸린 사유 하나가 아니라 전 조건을 각각** 평가해 기록한다.

```json
{ "cik": ?, "symbol": ?,
  "hasMarketCap": true/false,      // us_market_cap 또는 866C 실측
  "hasIndustry": true/false,       // damodaran_industry 매칭
  "driversOk": true/false,         // computeDrivers().ok
  "driverFailReason": "INSUFFICIENT_HISTORY" | "MISSING_TAG" | ... | null,
  "firstBlockingReason": "…"       // 866B가 기록한 값(대조용)
}
```

집계:

```
우리 조달 실패만    (시총·업종 결측 O · 드라이버 OK)        = ?
회사 공시 부재만    (시총·업종 OK · 드라이버 실패)          = ?
둘 다              (시총·업종 결측 O · 드라이버도 실패)     = ?   ← 866B가 못 센 칸
```

🔴 **"둘 다" 칸이 이 단계의 목적이다.** 866B의 `246 / 1,001 / 55`는 이 칸을 한쪽에 몰아넣어 만들어진 수다. 세 칸을 채운 뒤 **866B 수치를 정정**한다(`probe_866b_output.json`의 `insufficientCause`에 `supersededBy` 키 추가 · 덮어쓰지 말 것).

---

## 4단계 — 산출물

- `docs/probe_866c_supply.json` (1단계)
- `docs/probe_866c_output.json` (2·3단계)
- `docs/probe_866c_rows.json` — CIK별 행(3단계 4필드 포함)
- `docs/probe_866b_output.json` — `insufficientCause`에 `supersededBy: "docs/probe_866c_output.json"` **키만 추가**

---

## 5단계 — 검증 후 멈춘다

```bash
npx tsc --noEmit          # 0
npx vitest run            # 151/151
git status --short
```

**무변경 확인 (필수)**:

```sql
select as_of, count(*) from revdcf_results group by as_of order by as_of desc;
-- 기대: 2026-08-03 / 08-02 / 08-01 각 604

select count(*) from us_market_cap;
-- 기대: 5,886 (866C 실행 전후 동일 — 늘었으면 실패다)
```

```bash
git diff --stat HEAD -- data/us_symbols.json lib/lensPrecompute.ts lib/revdcf/
# 기대: 출력 없음
```

**커밋** (push 금지):

```bash
git add scripts/probe_866c_otc_supply.ts docs/probe_866c_*.json docs/probe_866b_output.json \
        docs/STEP_866C_COMMAND.md docs/STATE.md docs/CHANGELOG.md
git commit -m "STEP 866C: measure OTC market-cap availability and reclassify simultaneous blockers (measurement only)

- 486 OTC issuers had zero market cap in us_market_cap; Yahoo does cover OTC Markets Group
- probe Yahoo quotes for those tickers, count marketCap vs price-only availability
- re-run existing engine on OTC names that obtain a market cap, report distribution shift
- reclassify all 1,302 insufficient rows by evaluating every blocking condition, not just the first
- supersede 866B insufficientCause (246/1001/55 was order-dependent)
- no writes to us_market_cap or revdcf_results, no change to us_symbols.json, flag unchanged"
```

## 🔴 마지막 — 다음 항목 제안 금지

**보고 형식**:

```
OTC 시총 조달: 486 중 응답 ? · marketCap ? · 가격만 ? · 무응답 ?
시총 붙은 뒤 이동: computed ? / undecidable ? / 여전히 부족 ?
  그중 NO_MARKETCAP 135 출신: computed ? / undecidable ? / 다른 데서 실패 ?
전수 재집계: (a) 364→? · 산출률 10.9%→?% · GAP 중앙 8→?년 · ICC(860정의) 0.165→?
동시 결격 3칸: 우리 조달만 ? / 회사 공시만 ? / 둘 다 ?  (866B 246/1001/55 정정)
무변경 확인: revdcf_results 604×3 · us_market_cap 5,886 · us_symbols.json diff 없음
tsc 0 · vitest ?/?
```

OTC 채택 여부·심볼 목록 확장 여부에 **의견을 쓰지 말 것.** 판정은 장은태가 한다.
