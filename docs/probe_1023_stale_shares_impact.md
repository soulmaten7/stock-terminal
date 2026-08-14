<!-- STEP 1023 — 322건의 낡은 주식수가 실제로 어디에 닿는가 (읽기 전용 · DB 쓰기 0) -->
# probe_1023 — 322건 소재 확정과 프로덕션 영향

## ⓪-4 판정

🔴 **네 번째 갈래 — 322건은 `us_fundamentals.shares`가 아니라 STEP1019~1022의 조립용 임시(probe-내부) 데이터였다. 프로덕션 영향 = 0. 이 STEP은 §1-1에서 종료한다(§1-2~1-4는 진행하지 않음, 명령서 지시대로).**

- **604 유니버스 도달 건수 = 0**(322건이 애초에 프로덕션 테이블에 존재한 적이 없어 "도달"이라는 개념 자체가 성립하지 않는다)
- **verdict 변화 건수 = 해당 없음**(재계산 대상 자체가 없음)

---

## 1-1. 322건의 소재 확정 — 가장 먼저, 그리고 결정적으로

### STEP1022의 "322건"이 실제로 비교한 것

`scripts/probe_1022_sec_window_audit.ts`를 직접 열어 확인했다:

- **"낡은 값"(비교 기준선)** — `deiByCik`/`gaapByCik`(`:67-70`), SEC **`frames`** API(`https://data.sec.gov/api/xbrl/frames/...`)를 **이 프로브 스크립트 실행 시점에 라이브로 호출**해 메모리에만 채운 `Map` 객체. `us_fundamentals`·어떤 테이블도 읽지 않는다.
- **"더 최신 값"** — `latestShare(cf)`(`:134`), SEC **`companyfacts`**를 같은 프로브 실행 중 라이브로 호출한 결과.
- **비교 자체** — `:134-137`, `framesLatest`(위 첫 번째) vs `latest.end`(두 번째), **둘 다 이 스크립트 프로세스 안의 휘발성 변수**다.

🔑 **`grep -n "us_fundamentals" scripts/probe_1022_sec_window_audit.ts` → 0건.** 이 파일 어디에도 `us_fundamentals` 테이블을 읽거나 쓰는 코드가 없다. **322건은 "1022가 만든 낡은 기준선"과 "1022가 만든 새 기준선"을 서로 비교한 것이지, 프로덕션에 저장된 값과 비교한 게 아니다.**

### 프로덕션(`us_fundamentals.shares`)이 실제로 쓰는 경로 — 완전히 다르다

`app/api/cron/revdcf/route.ts`를 직접 확인했다:

| 항목 | 프로덕션(`revdcf` 크론) | STEP1019~1022 프로브 |
|---|---|---|
| SEC 엔드포인트 | 🔑 **`companyfacts`**(`route.ts:278`, `https://data.sec.gov/api/xbrl/companyfacts/CIK...`) | `frames`(6분기 창) + `companyfacts`(1022에서만) |
| 조회창 | **없음** — companyfacts는 원래 전체 이력을 준다 | **6분기 임의값**(근거 없음, 1022 §1-1) |
| 주식수 산출 로직 | `computeDrivers()`(`lib/revdcf/drivers.ts:199`, `route.ts:3,281`) — **`WeightedAverageNumberOfDilutedSharesOutstanding`(연간 가중평균희석주식수) 최우선**, 없으면 `WeightedAverageNumberOfSharesOutstandingBasic`→`CommonStockSharesOutstanding`(연간)→**`dei:EntityCommonStockSharesOutstanding`은 최후순위**(`drivers.ts:367-373`) | `dei:EntityCommonStockSharesOutstanding`(instant) 우선, `us-gaap:CommonStockSharesOutstanding`(instant) 차선(1019~1022 전체) |
| 복수클래스 처리 | 🔑 **명시적 처리 있음** — 못 찾으면 `skipReason: "MULTI_CLASS_SHARES"`로 계산 자체를 건너뜀(`drivers.ts:375-384`), 조용히 틀린 값을 안 씀 | **없음**(1019~1021이 발견한 "복수클래스 신뢰 불가" 문제가 그대로 남아 있었음) |
| `us_fundamentals.shares` 저장 | `route.ts:46` — `market ? market.shares : null`(= `dr.market.shares`) | 저장 안 함(프로브가 DB에 안 씀) |

🔑 **프로덕션은 `frames`를 단 한 번도 쓴 적이 없다** — 1019~1022가 조사 편의를 위해 채택한 `frames` 6분기 창은 **이 세션의 조사 스크립트에만 존재했던 인공물**이고, 실제 `revdcf` 계산 경로와는 애초에 무관했다. 프로덕션은 (a) 창 제한이 없는 `companyfacts`를 쓰고 (b) 애초에 다른 개념(연간 가중평균희석주식수)을 1순위로 쓰며 (c) 복수클래스는 이미 명시적으로 걸러낸다.

### 🔴 결론

**STEP1022의 "322건(7.07%)이 낡은 값을 쓰고 있다"는 발견은 전부 사실이었지만, 그 "낡은 값"이 있던 곳은 프로덕션이 아니라 이 세션의 조사 스크립트 내부였다.** 322건은 `us_fundamentals`에도, `revdcf_results`에도, 화면에도 존재한 적이 없다 — **⓪-4 네 번째 갈래가 확정됐고, 명령서 지시대로 §1-2~1-4(낡음 분포·다운스트림 도달·판정 재계산)는 진행하지 않는다.**

---

## 전수 비용 명시(§0-5 규칙 준수)

이 STEP은 §1-1에서 종료했으므로 추가 SEC 호출이 필요 없었다(**재조회 0회**). 만약 §1-2~1-4를 진행했다면 322건 × 10 req/s ≈ **약 33초**로, 표본 상한을 걸 이유가 없었을 것이다(참고 기록만 — 실제로 진행하지 않음).

---

## 1-5. 오늘 밤 관측 — 🔴 여전히 미도래

작업 시각 **2026-08-14T04:20:41Z**. 다음 크론(2026-08-14T22:45:00Z)까지 약 18.4시간 — **미도래**(1020·1021·1022와 동일 반복 확인, 새 정보 아님). `cron_heartbeats`는 여전히 5개 job(email-brief·jp-disclosures·kr-lens-scores·lens-scores·us-perf)뿐, `revdcf` 없음. `us-perf`의 `nasdaqError`도 변화 없음.

---

## `ANSWERABILITY_MAP.md` §F 갱신

§F(재무 원문 수치)의 한계 고지에 있던 1022발 "322건(7.07%) 낡은 값" 경고를 **정정**한다 — 그 낡음은 프로덕션 `us_fundamentals.shares`가 아니라 조사 스크립트 내부의 것이었으므로, F의 실제 데이터 신뢰도에 대한 한계 고지로는 부적절했다. 취소선으로 보존하고 이 STEP의 확정 사실로 교체한다. §3은 건드리지 않는다.

## 카탈로그 갱신

**슬롯 #2(발행주식수)**: 1022가 붙인 "322건 낡음" 서술에 이 STEP의 확정(프로덕션 무관, 프로브 내부 현상)을 추가.
**신규 절 "0-A 시가총액 커버리지 — 분자 경로 소진"**을 카탈로그에 추가해, 야후·나스닥·SEC 조립·SEC 조회창 확장까지 시도된 5개 경로가 전부 막히거나 소진됐다는 사실을 한곳에 정리한다(다음에 같은 길을 다시 파지 않도록).

---

## 못 한 것 / 철회·정정한 것 / 미측정으로 남은 것

**못 한 것**
- §1-2(낡음×변화율 교차표)·§1-3(다운스트림 도달)·§1-4(verdict 재계산) — ⓪-4 네 번째 갈래 확정으로 명령서 지시대로 진행하지 않았다.
- 프로덕션(`lib/revdcf/drivers.ts`)의 `companyfacts` 기반 접근이 **자체적인** 신선도 문제를 갖고 있는지(예: 연간 가중평균희석주식수도 오래된 회계연도만 있을 수 있는가) — 이 STEP은 "1022의 문제가 프로덕션에 있는가"만 확인했고, "프로덕션에 이것과는 다른 별도의 신선도 문제가 있는가"는 새로운 질문이라 다루지 않았다.

**철회·정정한 것**
- 🔴 **1022의 "322건이 이미 채워진 SEC 주식수 중 낡은 것"이라는 서술이 프로덕션 데이터를 가리키는 것처럼 읽힐 수 있었던 부분을 정정한다.** 1022 자신은 "기존 충족분"이라고만 썼고 어느 테이블인지 명시하지 않았다 — 이 STEP이 처음으로 그 소재를 확정했다.

**미측정으로 남은 것**
- `lib/revdcf/drivers.ts`의 `WeightedAverageNumberOfDilutedSharesOutstanding` 우선순위 방식 자체의 신선도(별도 질문, 별도 STEP 필요) — 장은태 판정 대상 여부도 미정.
- 유니버스 재정의(1021 이월) — 이 STEP 범위 밖.

🔴 **조회창 수정·322건 관련 배선·유니버스 재정의는 전부 장은태 판정이지만, 이 STEP의 결론은 "판정할 대상 자체가 없었다"였다 — 322건은 프로덕션에 존재한 적이 없다.**
