<!-- STEP 1017 — 어젯밤 크론이 남긴 두 실패의 종료 사유를 확정한다 (읽기 전용 · 코드 수정 0) -->
# probe_1017 — 크론 실패 종료 사유 확정

## ⓪-4 판정 요약

**A(`revdcf` heartbeat 없음)**: 🟡 **확정 불가 — Vercel 로그 접근 자체가 막혀 있다(403 Forbidden).** DB 정황증거(아래)는 ⓪-4 첫 번째 행("함수가 통째로 죽었다")에 강하게 부합하나, **로그 원문 없이는 확정하지 않는다.** ⓪-4 표의 네 갈래 중 **"로그를 못 봄 → 확정 불가"**(네 번째 행)가 실제 결과다.

**B(나스닥 timeout)**: 🔴 **⓪-4 표의 세 갈래 어디에도 정확히 안 들어맞는 네 번째 관측 — "로컬도 같은 timeout으로 실패했다."** 로컬에서 정확히 같은 URL·헤더·20초 timeout으로 1회 재현했더니 **로컬도 20,008ms에서 동일하게 timeout**(프로덕션 관측 20,003ms와 거의 일치). "환경 차이가 야후 밖에서도 재현됐다"(⓪-4 세 번째 행, egress 가설 강화)의 **반대 방향** — 로컬도 실패했으므로 **Vercel egress 전용 문제로 단정할 근거가 약해졌다.** 🔴 **1회 관측이다. 단정하지 말 것**(⓪-5 명시).

---

## 1-1. `revdcf` 08-13 22:45 UTC Vercel 로그

🔴 **미확인 — 접근 자체가 실패했다.**

Vercel MCP 도구(`get_runtime_logs`)로 `2026-08-13T22:30:00Z`~`23:10:00Z` 구간·`revdcf` 쿼리로 조회 시도:
```
Runtime log query failed at page 0: 403 Forbidden -
{"error":{"message":"You don't have permission to access this resource."}}
```
`list_teams` 호출도 빈 결과(`{"teams":[]}`) — 이 세션의 Vercel MCP 인증 범위 자체가 `toms-projects-c798474e` 팀 리소스에 접근 권한이 없다(1016 시점에도 동일 403 확인됨). 🔴 **장은태 직접 로그인이 필요하나, 이 STEP은 로그 없이도 낼 수 있는 정황증거까지만 정리하고 로그인을 요청하지 않았다**(⓪-3 — 로그인 필요 시 요청하되 자격증명은 입력 금지, 이번엔 시도 자체가 즉시 403으로 막혀 대화형 로그인 필요 여부조차 판단 못 함).

### 코드 정황증거(DB 관측 기반, 로그 대체 아님)

`app/api/cron/revdcf/route.ts:374-399`를 직접 읽었다 — 구조:
```
} finally {                                  // 바깥 finally (:374)
  await computeAndSaveValuation(...)         // :377, us_valuation 저장
  try {
    await computeAndSaveSectorRelative(...)  // :384, us_sector_relative 저장
  } catch (e) {
    sectorRelativeError = ...
    throw e                                  // :390
  } finally {
    await recordHeartbeat(...)               // :393, 안쪽 finally — 예외를 던져도 실행돼야 함
  }
}
```
`maxDuration=300`(`:18`) · `BUDGET_MS=270_000`(`:26`, 메인 루프가 이 안에서만 도는 소프트 예산, `:351`).

**어젯밤 관측(⓪-1 인용)과 대조**:
- `revdcf_results` 08-13 604행 — 메인 루프(`:351` 이전 구간) **완주**로 해석됨(⓪-1 "루프 완주" 표기)
- `us_valuation` 08-13 5,820행 — `:377`의 `computeAndSaveValuation` **완료·저장 확인**
- `us_sector_relative`는 여전히 08-10(4일째 정지) — `:384`의 `computeAndSaveSectorRelative`가 **완료되지 않음**
- `cron_heartbeats`에 `job='revdcf'` 행 자체가 없음 — `:393`의 `recordHeartbeat`가 **실행되지 않음**(안쪽 `finally`조차 안 돎)

🔑 **이 조합이 가리키는 것**: 메인 루프와 `computeAndSaveValuation`은 완료됐는데, `computeAndSaveSectorRelative` 도중(또는 그 이후 `recordHeartbeat` 호출 이전)에 **JS의 `finally` 보장이 깨졌다.** 코드상 `finally`는 예외가 던져져도 실행되므로, **실행되지 않았다는 것 자체가 "예외가 아니라 프로세스/함수가 통째로 종료됐다"는 정황**이다(⓪-4 A 표 첫 번째 행과 부합). `maxDuration=300`과 `BUDGET_MS=270_000`의 30초 여유가, 루프 완주 후 `computeAndSaveValuation`(5,820행 upsert) + `computeAndSaveSectorRelative`(비슷한 규모 계산) 두 단계를 처리하기엔 부족했을 가능성이 있다.

🔴 **이건 정황증거이지 확정이 아니다.** Vercel 로그의 "정상 종료"가 찍혀 있었다면 이 추론 전체가 틀렸을 수 있다(⓪-4 세 번째 행) — **그 가능성을 배제하지 못한 채로 이 STEP을 마친다.**

---

## 1-2. `us-perf` 08-13 23:01 UTC 로그 — 나스닥 timeout

🔴 **로그 원문도 미확인**(같은 403). 단 `cron_heartbeats.note`(`job='us-perf'`) 자체가 이미 구조화 계측이라 원문 없이도 아래는 확정 가능:

```json
{"perfMs":167534,"nasdaqMs":20003,"routeMs":187537,"nasdaqRows":0,"nasdaqSaved":0,
 "nasdaqEmptyCap":0,"nasdaqError":"rate_limited_or_timeout: The operation was aborted due to timeout",
 "budgetLeftMs":112463}
```

**20초 timeout이 우리 코드값인가 — ✅ 확정**: `lib/nasdaqMarketCap.ts:9` `const TIMEOUT_MS = 20_000;` · `:29` `signal: AbortSignal.timeout(TIMEOUT_MS)`. 관측된 `nasdaqMs:20003`은 우리가 건 20,000ms에 3ms의 실행 오버헤드가 더해진 값과 정확히 일치 — **우리가 건 timeout이 맞다.**

**응답을 일부라도 받았는가**: `nasdaqRows:0`·`nasdaqSaved:0`·`nasdaqEmptyCap:0` — 전부 0. `fetchNasdaqMarketCap()`(`lib/nasdaqMarketCap.ts`)은 `fetch()` 자체가 `AbortSignal.timeout`으로 중단되면 즉시 예외를 던지고 응답 파싱 단계(`totalRows`/`savedRows`/`emptyCap` 집계)에 도달하지 못한다 — **연결이 됐는지 여부와 무관하게, 파싱 가능한 응답을 전혀 못 받았다**는 뜻이다(0/0/0이 "빈 응답을 받았다"가 아니라 "집계 자체가 안 됐다"임을 코드 흐름으로 확인).

---

## 1-3. 로컬 재현 — 나스닥 (1회)

`lib/nasdaqMarketCap.ts`와 **같은 URL·같은 헤더·같은 20초 timeout**으로 별도 프로브 스크립트(코드 미수정, 로컬 1회 실행)를 돌렸다:

```js
const NASDAQ_URL = "https://api.nasdaq.com/api/screener/stocks?tableonly=false&limit=25000&download=true";
const UA = { "User-Agent": "Trillion Research admin@onetrillion.app", Accept: "application/json" };
const TIMEOUT_MS = 20_000;
```

**결과**:
```json
{"ok":false,"elapsedMs":20008,"errorName":"TimeoutError","errorMessage":"The operation was aborted due to timeout"}
```

🔑 **로컬도 실패했다 — 프로덕션(20,003ms)과 거의 동일한 20,008ms에서 같은 에러.** ⓪-4 B 표의 세 번째 행("로컬에서는 같은 호출이 성공한다")은 **관측되지 않았다.** 오히려 반대 — 로컬 재현도 20초 안에 완결되지 않았다.

**이게 무엇을 뜻하는가(해석, 확정 아님)**: 로컬과 프로덕션(Vercel) 양쪽에서 같은 타임아웃에 걸렸다는 것은, **"Vercel egress에서만 나스닥이 막힌다"는 가설(⓪-4 B 두 번째 행)의 근거가 약해졌다**는 뜻이다 — 최소한 이번 1회 관측에서는 로컬 네트워크도 이 요청을 20초 안에 끝내지 못했다. 대신 두 가지 가능성이 남는다: **① 나스닥 스크리너 API 자체가 이 시점에 응답이 느렸다**(비공식 API, ~25,000개 종목 규모 응답이라 원래도 무거움) **② 20초라는 timeout 값 자체가 이 엔드포인트엔 짧다.** 어느 쪽인지는 **1회 관측으로 가릴 수 없다** — STEP940이 프로브 단계에서 성공했던 적이 있다는 과거 기록과 대조하면 "항상 느리다"는 아니고, 오늘 이 순간의 상태다.

🔴 **1회만 호출했다.** 추가 재현 시도는 나스닥에 부담을 주지 않기 위해 하지 않았다.

---

## 1-4. 결측 코호트 이동 관측

### `noCapField` 373(전일, ⓪-1 인용) → 365(08-13 22:25 UTC, DB 직접 확인)

`cron_heartbeats.note`(`job='lens-scores'`, 08-13 22:25:38 UTC)를 직접 조회해 `noCapField:365`·`noPriceEither:348`·`freshCoverage:0.9389223560910308`(93.89%)를 확인 — ⓪-1이 인용한 오늘 값과 **byte 일치.**

🔴 **전일(373)의 심볼 명단은 재구성 불가 — 미확인.** `cron_heartbeats`는 PK가 `job`뿐인 스냅샷 테이블이라(`docs/CRON_OBSERVABILITY.md:14` 재확인 — 917부터 "계측 전용"으로 이미 문서화된 제약) **어제 값이 오늘 값으로 덮어써져 남아있지 않는다.** 이 저장소 전체(`docs/*.md`)를 검색했으나 노란색 373건의 심볼 단위 명단을 저장해 둔 곳이 없다(집계 숫자만 여러 STEP에서 인용됨). **"어느 8건이 빠져나갔는지"는 코드·DB 어디에도 근거가 없어 특정할 수 없다 — 확인불가로 남긴다.**

### 대체 근거 — `us_market_cap`의 `as_of` 이동(다른 지표, 방향은 같음)

`noCapField`와는 다른 지표지만(전자는 그날 야후 배치 응답의 marketCap 필드 유무, 후자는 종목별 최신 성공 `as_of`), **같은 방향의 "고정이 아니라 움직인다"는 증거**로 병기한다.

| as_of | 1016 관측(08-13 15:47Z, 전날 크론까지 반영) | 1017 관측(08-14 00:21Z 이후, 어젯밤 크론 반영) |
|---|---|---|
| 07-30 | 296 | **287**(🔑 9건 이탈) |
| 08-02 | 5 | 5(불변) |
| 08-03 | 2 | 2(불변) |
| 08-04 | 1 | 1(불변) |
| 08-05 | 1 | 1(불변) |
| 08-06 | 2 | 2(불변) |
| 08-10 | 1 | 1(불변) |
| 08-11 | 2 | 2(불변) |
| 08-12 | 5,601 | **1**(🔑 5,600건이 08-13으로 진행 — 정상 갱신) |
| 08-13 | (없음) | **5,611**(신규) |
| **합계** | 5,911 | **5,913**(+2, 신규 유입 추정) |

🔑 **1008이 "296건 고정"이라 한 것과 어긋난다 — 그대로 적는다.** 296건이 정적 상수가 아니라 **9건이 이번 밤 사이에 07-30 묶음에서 빠져나갔다**(287로 감소). 동시에 08-02~08-11 사이의 14건은 **전혀 안 움직였다** — "전부 고정"도 "전부 움직인다"도 아니고, **고정된 서브그룹과 움직이는 서브그룹이 섞여 있다.** 🔴 이 9건이 `noCapField`의 373→365(8건 감소)와 **같은 종목들인지는 확인 못 했다**(서로 다른 두 지표, 교집합 대조는 이 STEP 범위 밖).

### AADX 필드 목록 전후 대조

🔴 **부분 확인.** 오늘(08-13 22:25 UTC) 값은 `cron_heartbeats.note`에서 직접 확인했다 — `AADX`는 `missingFieldNames` 표본(처음 10개 심볼 중 하나)에 여전히 등장하며, 결측 필드 목록에 `regularMarketPrice`·`regularMarketVolume`·`bid`·`ask`·`longName`이 **포함돼 있다**(⓪-1의 서술과 일치 — "메타데이터만이 아니라 가격·거래량·매수호가까지 있고 marketCap만 없다"는 패턴, 정확히는 `marketCap` 자체가 목록에 없으므로 — 이 필드는 "빠진 필드 목록"이라 marketCap이 없다는 것은 그 목록에 marketCap이 **있어야** 정상인데, 실제로 목록엔 없다 — 즉 이 특정 실행에서 AADX는 marketCap을 포함해 매우 많은 필드가 함께 빠졌다고 재확인됨).

`us_market_cap` 테이블에서 `AADX`를 직접 조회 — **0행(존재 자체가 없음)**. AADX는 `us_market_cap`에 단 한 번도 성공적으로 적재된 적이 없다(과거 `docs/probe_1006_yahoo_endpoints.md`·`docs/probe_1008_yahoo_prod_full.md`의 "완전 결측" 86종목 코호트에 이미 있던 종목).

🔴 **"전일과 완전히 달라졌다"는 ⓪-1의 서술 자체는 재현·검증 불가** — 전일의 `missingFieldNames` 값이 스냅샷 테이블에서 이미 사라졌다(위와 같은 제약). 오늘 값만 확인했다.

---

## 1-5. 수정 선택지 정리 — 🔴 판정 없음

### `revdcf`(A가 "함수 통째 종료"로 확정될 경우 — 🔴 단, A는 이 STEP에서 미확정)

| 방식 | 결과 | 위험 |
|---|---|---|
| ⓐ `BUDGET_MS` 인하 | `finally`(밸류에이션+섹터상대)에 시간이 더 남는다 | `revdcf_results`가 매일 604행 완주 중이므로 메인 루프 손실은 없을 수 있다 — **단, "완주"가 정확히 얼마나 여유 있게 끝나는지(잔여 시간)는 로그 없이 모른다.** 확인 필요 |
| ⓑ `computeAndSaveSectorRelative`를 다른 크론으로 이동 | 예산 경쟁이 사라진다 | 🔴 Hobby 크론 9개 상한 — 새 크론 불가. 기존 크론(`us-perf`·`lens-scores` 등)에 얹어야 하는데 둘 다 이미 자기 예산이 빠듯함(`us-perf`는 나스닥 20초 timeout으로 이미 실패 중, `lens-scores`는 `cutGateOk:false`로 이미 압박 상태) |
| ⓒ `sector_relative` 계산을 가볍게 | 시간 단축 | 계산 로직 변경 = 값 변경(규칙 5-2 위반 소지, 별도 승인 필요) |
| ⓓ 그대로 두고 heartbeat만 앞으로(먼저 기록 후 계산) | 원인 규명 없이도 "실행됐다"는 사실은 남길 수 있다 | `sectorRelativeSaved` 등 결과 필드가 그 시점엔 아직 없어 부분 정보만 기록됨. 정지 자체는 안 풀린다 |

### 나스닥(B — timeout 확정, egress 단정은 약화됨)

| 방식 | 결과 | 위험 |
|---|---|---|
| ⓐ timeout 인상(예: 40~60초) | 응답이 느릴 뿐이면 해결 가능성 — **로컬도 20초에 걸렸으므로 시도해볼 근거는 있다** | `us-perf` 예산 잠식(현재 `budgetLeftMs` 112,463ms 여유 — 20초 늘려도 여유는 충분해 보임, 단 매일 그런지는 미확인) |
| ⓑ 페이지네이션으로 분할 | 응답 크기 감소 | 나스닥 API가 페이지네이션을 지원하는지 미확인(`limit=25000` 파라미터 외 offset류 파라미터 존재 여부 미조사 — 이 STEP 범위 밖) |
| ⓒ egress 문제로 보고 다른 소스 필요 | — | 🔴 **로컬도 실패했으므로 이 갈래의 근거가 약해졌다** — 채택 우선순위가 낮아짐(판정은 아님) |

🔴 **확정된 사유가 없으므로(A는 미확정, B는 정황상 egress 단정이 약화됐을 뿐) 위 선택지 중 무엇도 "기각"으로 지우지 않았다** — 전부 결과와 위험만 병기했다.

---

## `ANSWERABILITY_MAP.md` 반영

§2 D·G 항목에 어젯밤 관측을 추가 반영(취소선 없이 추가만, 기존 1015/1016 내용은 그대로 보존):
- **D**: `us_sector_relative`가 08-10에서 **4일째** 정지 중임을 재확인(1016 관측 시점 대비 하루 더 진행, 정지 상태 불변) — `revdcf` 함수 자체가 `computeAndSaveSectorRelative` 단계에서 완주하지 못하고 있다는 이 STEP의 정황증거를 근거로 추가.
- **G**: `us_market_cap`이 어젯밤 정상 갱신됐음을 반영 — 08-13 5,611행 신규(전체 5,913행 중), 07-30 고정 코호트가 296→287로 **일부 회복**(1008의 "완전 고정" 서술과 어긋남을 명시).

🔴 §3(답하지 않는 영역)은 건드리지 않았다.

---

## 못 한 것 / 철회·정정한 것 / 미측정으로 남은 것

**못 한 것**
- Vercel 런타임 로그 원문 확인(A·B 둘 다) — MCP 접근이 403으로 막힘. 장은태 직접 로그인이 필요하나 이 STEP에서 요청하지 않았다(⓪-3, 로그인 필요시 요청 가능했으나 시도 자체가 즉시 거부돼 판단 보류).
- `noCapField` 373건의 심볼 명단 확보 — 어제 시점 데이터가 스냅샷 테이블 특성상 이미 사라짐.
- 373→365(또는 `us_market_cap`의 296→287)의 정확한 교집합 대조 — 두 지표가 같은 종목을 가리키는지 미확인.
- 나스닥 API의 페이지네이션 지원 여부 조사(선택지 ⓑ의 실현 가능성 판단 재료, 이 STEP 범위 밖으로 판단).

**철회·정정한 것**
- ⓪-4 B의 세 가지 예상 갈래(우리 timeout이 짧다/egress 문제다/로컬은 성공한다) 중 **어느 것도 정확히 관측되지 않았다** — 로컬도 실패했다는 **네 번째, 예상 밖의 결과**로 정정한다. "egress 문제"로 단정하려던 방향은 **이 STEP의 관측으로 약해졌다**(완전히 기각된 것은 아니다 — 1회 관측이라 단정 자체를 안 함).

**미측정으로 남은 것**
- A(`revdcf` 함수 종료 사유)의 최종 확정 — 로그 확보 후에만 가능.
- B(나스닥 timeout)가 일시적 현상인지 지속적 현상인지 — 추가 관측(여러 날) 없이는 모름, 이 STEP은 반복 호출을 금지했다.
- 1-5의 선택지 중 무엇을 채택할지 — 전부 장은태 판정.

🔴 **`BUDGET_MS`·timeout·게이트·D 조회 키 수정은 전부 장은태 판정이다. 이 STEP은 사유를 확정하는 것까지다 — A는 확정하지 못했고, B는 예상과 다른 방향으로 부분 확정했다.**
