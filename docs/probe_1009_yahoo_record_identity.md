<!-- STEP 1009 — 조사 전용. 코드 수정 0 · DB 쓰기 0. -->
# STEP 1009 — 결측 응답이 "같은 레코드인가 다른 레코드인가"

> 대상 = 1008과 동일한 390건 target(`docs/probe_1006_yahoo_endpoints.md`). 프로덕션 재조회(`https://onetrillion.app/api/diag/yahoo`, 8회 분할, 회차 간 6초 이상, 2026-08-13 12:13:15Z~12:15:46Z). 1006 로컬 원자료(`/tmp/step1006_raw_results.json`, 같은 날 앞서 수집)와 심볼 단위 조인.
> 🔴 1008이 저장한 raw 배치 JSON은 세션 정리 과정에서 삭제돼(스크래치패드 관례) 이번 STEP에서 프로덕션을 **다시** 전수 호출했다(§3-3 허용 범위 — 표본 아닌 8회 전수, 회차별 리전 기록).

## 3-1 판정 (한 줄)

🔑 **부분 판정 — "같은 레코드"에 강하게 기울지만 완전 확정은 못 한다.** 값 비교가 가능한 4개 필드(`quoteType`·`exchange`·`fullExchangeName`·`marketState`) 중 3개는 284건 전부 로컬과 완전 일치, 1개 필드(`exchange`/`fullExchangeName`)에서 심볼 1건(`EVV`)만 불일치가 나왔다(283/284=99.6% 일치). 🔴 그러나 이 STEP이 "그 자리에서 확정"이라고 지목한 `currency`·`region`·`language`는 **진단 엔드포인트가 값을 반환하지 않아**(키 존재만 확인·값은 미수집) 비교 자체를 못 했다 — 이건 관측 실패가 아니라 **이번 STEP이 지킨 "엔드포인트 코드를 고치지 말 것" 제약의 직접적 결과**다. 아래 §2에서 정확히 무엇을 봤고 무엇을 못 봤는지 나눈다.

## §1. 4분면 재확인 (1008과 동일 방법론, 다른 시각 재조회)

| | 프로덕션 ✅ | 프로덕션 ❌ |
|---|---:|---:|
| **로컬 ✅** | 20건(5.1%) | **284건(72.8%) — 이 STEP의 대상** |
| **로컬 ❌** | 0건(0.0%) | 86건(22.1%) |

1008과 완전히 동일한 4분면(390건 전수, 재조회에도 구성 불변) — 🔴 **재현성 확인**: 약 20분 뒤 다시 불러도 같은 심볼이 같은 칸에 있다(우연한 일시적 결함이 아니라 안정적인 상태).

## §2. 메타데이터 값 비교

### 2-1. 값 비교가 **가능한** 4개 필드 (환경차이 코호트 284건 vs 로컬 1006)

| 필드 | 불일치 건수 | 비고 |
|---|---:|---|
| `quoteType` | **0/284** | 완전 일치 |
| `exchange` | **1/284** | `EVV`만 — 로컬 `ASE` vs 프로덕션 `NYQ` |
| `fullExchangeName` | **1/284** | `EVV`만 — 로컬 `NYSE American` vs 프로덕션 `NYSE`(같은 심볼, 같은 방향 불일치) |
| `marketState` | 비교 불가(로컬 기준값 없음) | 1006 로컬 프로브가 이 필드를 안 잡았다. 프로덕션 값만 관측: **284건 전부 `PRE`**(양쪽정상 20건도 전부 `PRE`) — 호출 시각(12:13~12:15 UTC = 08:13~08:15 EDT, 개장 전)이 프리마켓과 겹쳐서 이 필드로는 두 코호트를 가를 수 없다. |

🔴 **`EVV` 상세**: `docs/probe_1006_yahoo_endpoints.md` 수집 시각(당일 이른 시각)엔 `exchange=ASE`(NYSE American)였는데, 이번 STEP의 프로덕션 조회(같은 날 나중 시각)엔 `exchange=NYQ`(NYSE)로 나왔다. **1심볼·1일 안에서 거래소가 실제로 바뀌었을 가능성은 사실상 0이다** — 두 호출이 어떤 이유로든 다른 데이터를 봤다는 뜻이지만, 원인(캐시 시점차·야후 내부 라우팅차·일시적 데이터 이상)은 이 STEP에서 확정하지 않는다. 나머지 283건은 완전 일치.

### 2-2. 값 비교가 **불가능한** 7개 필드 — 존재만 확인, 값은 미수집

STEP1009 §3-1이 지목한 11개 필드 중 `symbol`·`typeDisp`·`currency`·`region`·`language`·`market`·`exchangeTimezoneName` 7개는 `/api/diag/yahoo`가 **필드명만** 반환하고(`fields` 배열) **값은 반환하지 않는다.** 이 STEP은 "엔드포인트 코드를 고치지 말 것"을 명시했으므로, 이 7개 필드에 대해 할 수 있는 것은 **키 존재 여부 확인**뿐이었다:

| 필드 | 환경차이(284) 중 키 존재 | 값 비교 |
|---|---:|---|
| `typeDisp` | 284/284 | ❌ 불가(값 미수집) |
| `currency` | 284/284 | ❌ 불가 — 🔴 STEP이 "USD 아니면 그 자리에서 확정"이라 명시한 바로 그 필드 |
| `region` | 284/284 | ❌ 불가 — 🔴 확정 신호 필드 |
| `language` | 284/284 | ❌ 불가 — 🔴 확정 신호 필드 |
| `market` | 284/284 | ❌ 불가 |
| `exchangeTimezoneName` | 284/284 | ❌ 불가 |
| `symbol`(야후가 실제로 돌려준 값) | 확인 불가(진단 엔드포인트가 요청 심볼을 그대로 echo — 야후 원본 `q.symbol` 자체를 저장하지 않음) | ❌ 불가 |

🔴 **키 존재율은 1007의 단일 사례(HD)와 이번 284건 전수가 100% 일치** — 결측군의 응답이 "필드가 아예 빠진 축소판"이 아니라 "특정 4개 필드(`marketCap`·`sharesOutstanding`·`impliedSharesOutstanding`·1008이 본 `longName`)만 빠진 거의 완전한 레코드"라는 1008의 결론과 정합적이다. 다만 **값 자체(특히 currency/region/language)를 못 봤으므로, "다른 시장의 레코드"라는 가설을 완전히 기각할 수는 없다** — 이게 이 STEP이 "부분 판정"에 머무는 이유다.

## §3. 92.1% 잔차 전수 — A군·B군

### 3-1. A군 — 티커 ≤3자인데 프로덕션 정상(규칙을 어긴 성공, 11건)

| 심볼 | 길이 | exchange(로컬) | quoteType |
|---|---:|---|---|
| EA | 2 | NMS | EQUITY |
| ACM | 3 | NYQ | EQUITY |
| CAG | 3 | NYQ | EQUITY |
| EML | 3 | NGM | EQUITY |
| EYE | 3 | NMS | EQUITY |
| FLY | 3 | NGM | EQUITY |
| FNV | 3 | NYQ | EQUITY |
| GOF | 3 | NYQ | EQUITY |
| MDV | 3 | NYQ | EQUITY |
| NUE | 3 | NYQ | EQUITY |
| TFX | 3 | NYQ | EQUITY |

### 3-2. B군 — 티커 ≥4자인데 프로덕션 결측(규칙을 어긴 실패, 13건)

| 심볼 | 길이 | exchange(로컬) | quoteType |
|---|---:|---|---|
| ARAI | 4 | NGM | EQUITY |
| AMBO | 4 | ASE | EQUITY |
| ASIC | 4 | NYQ | EQUITY |
| ASTI | 4 | NCM | EQUITY |
| AVBP | 4 | NGM | EQUITY |
| EDSA | 4 | NCM | EQUITY |
| GAIN | 4 | NMS | EQUITY |
| LBRDK | 5 | NMS | EQUITY |
| MANU | 4 | NYQ | EQUITY |
| NOMD | 4 | NYQ | EQUITY |
| RMCO | 4 | NCM | EQUITY |
| SNYR | 4 | NCM | EQUITY |
| ZBIO | 4 | NMS | EQUITY |

### 3-3. 공유 속성 검사

- **거래소**: A군 = {NYQ 7·NGM 2·NMS 2}, B군 = {NCM 4·NYQ 3·NMS 3·NGM 2·ASE 1}. **NYQ·NGM·NMS 셋 다 두 군에 동시에 존재한다** — 어느 거래소도 A/B를 배타적으로 가르지 못한다.
- **quoteType**: A군·B군 **둘 다 100% EQUITY** — 구분력 없음.
- 🔴 **판정: 공유 속성 없음.** 거래소와 quoteType 둘 다 확인했으나 A/B를 가르는 공통 속성을 찾지 못했다. 억지로 다른 축을 찾지 않는다(지시대로).

## §4. `revdcf` heartbeat (1007 W1)

이 STEP 작업 시각(2026-08-13 12:13~12:17 UTC)은 `revdcf` 크론 예정 시각(22:45 UTC)보다 여전히 훨씬 이르다. `cron_heartbeats` 읽기 전용 재확인(크론 미호출) — 여전히 4행(`email-brief`·`jp-disclosures`·`kr-lens-scores`·`lens-scores`)뿐, `revdcf` 없음. 🔴 **다음 정규 크론(22:45 UTC) 이후 확인**으로 남긴다.

## 못 한 것 / 철회·정정한 것 / 미측정으로 남은 것

**못 한 것**
- 🔴 `currency`·`region`·`language`·`symbol`(실제 반환값)·`typeDisp`·`market`·`exchangeTimezoneName` **값** 비교 — 진단 엔드포인트가 이 값들을 반환하지 않고, 이번 STEP은 엔드포인트 코드 수정이 금지돼 있어 구조적으로 불가능했다. 존재 여부(284/284 전부 키 있음)만 확인했다.
- `EVV` 불일치의 원인 규명(캐시 시점차인지, 야후 내부 상태인지) — 관측만 하고 원인 조사는 범위 밖으로 남겼다.
- `revdcf` heartbeat 실측값(다음 크론 이후).

**철회·정정한 것**
- 없음. 1008의 4분면·설명력 수치는 이번 재조회로 **재현 확인**됐다(철회 대상 없음).

**미측정으로 남은 것**
- "같은 레코드 vs 다른 레코드"의 **완전 확정** — currency/region/language 값을 볼 수 없어 "다른 시장의 레코드" 가설을 완전히 기각하지 못했다.
- A/B군(24건)이 공유하는 속성 — 거래소·quoteType 둘 다 확인했으나 못 찾음(없다고 판정, 억지 탐색 안 함).
- `EVV` 하나의 예외가 우연인지 신호인지 — 표본이 1건뿐이라 판단 불가.

🔴 **판정(취득 경로 변경·심볼 표기 변경·`BUDGET_MS` 조정·게이트 임계)은 전부 다음 STEP 이후로 이관한다. 이 STEP에서 고르지 않았다.**
