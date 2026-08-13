<!-- STEP 1006 P2 — 조사 전용. 코드 수정 0 · DB 쓰기 0(upsert 전부 생략) · 크론 미호출. -->
# STEP 1006 P2 — `revdcf` finally 블록 구간별 계측

> 원자료 = `scripts/probe_1006_finally_timing.ts` 실행 결과. 실행일 2026-08-13, 로컬 환경.
> 🔴 **로컬 기준이다. Vercel 실측이 아니다.** 로컬은 Vercel보다 빠를 수 있다(네트워크 홉·콜드스타트·CPU 성능 차이) — 아래 수치를 그대로 production 예산 판정에 쓰지 말 것.
> `upsert()` 호출은 코드 전체에서 0회 — `us_valuation`·`us_sector_relative`·`us_sector_wide` 어디에도 쓰지 않았다(행 수·payload 바이트만 계산 후 버림).

## 구간별 소요시간

| # | 구간 | 내용 | ms |
|---|---|---|---:|
| 1 | valuation 재료 3종 read | `us_fundamentals`(5,780행)·`us_market_cap`(5,601행)·`us_stock_perf`(6,383행) 전량 read | **2,671** |
| 2 | valuation 행 조립 | 5,780행 계산(upsert 생략) — payload 6배치 합계 1.91MB | **13** |
| 3 | `us_valuation` 전량 read + `us_sector_wide` 최신 as_of | `us_valuation`(as_of=2026-08-12) 5,780행 + `us_sector_wide` 최신 as_of 조회 | **383** |
| 4a | `missingSymbols` 산출 | `us_sector_wide`(as_of=2026-08-08) 기존 심볼 5,167행 read → 미부착 613건 산출 | **256** |
| 4b | `resolveSector(613건)` 실제 호출 | 외부 네트워크 0건(Supabase read만) — 471/613건 해석 성공 | **1,731** |
| 5 | `sectorRows` read + `computeSectorRelativeBatch` | `us_sector_wide` 5,167행 재read + 5,780행 배치 계산 | **377** |
| 6 | sector_relative 행 조립 | 5,780행 계산(upsert 생략) — payload 6배치 합계 2.89MB | **15** |
| | **누적** | | **5,447ms (5.4s)** |

## 🔑 핵심 관측

**누적 5.4초 — `BUDGET_MS` 소진 후 남는 예산(300s − 270s = 30s)의 18%뿐이다. 로컬 기준으로는 30초를 넘지 않는다.**

- **예외 0건** — `resolveSector(613건)` 실제 호출을 포함해 6개 구간 전부 에러 없이 완료됐다. 가설ⓑ(내부 예외)가 이 로컬 재현에서는 발생하지 않았다.
- **가장 느린 단일 구간은 1번(valuation 재료 3종 read, 2,671ms)과 4b(`resolveSector`, 1,731ms)** — 둘이 전체의 80%를 차지한다.
- `resolveSector(613건)` 중 471건만 해석됐고 142건은 미분류로 남았다(정상 동작 — 4순위까지 못 걸리면 미분류로 반환하는 기존 설계, 에러 아님).

## 🔴 이 결과가 가설ⓐ·ⓑ를 확정하지 않는 이유

이 STEP의 지시대로 정직하게 남긴다:

1. **로컬(내 세션)과 Vercel(production serverless)은 다른 환경이다.** Supabase까지의 네트워크 왕복(RTT)이 로컬은 사무실/집 네트워크 기준이고 Vercel은 (리전에 따라) 다를 수 있다 — 특히 구간1·3·4a·5의 반복적인 `.range()` 페이지네이션 read가 RTT에 민감하다. Vercel에서 이 5.4초가 몇 배로 늘어날 가능성을 배제할 수 없다.
2. **콜드스타트가 빠져 있다.** Vercel의 서버리스 함수는 콜드스타트 시 추가 지연이 있을 수 있고, 이 로컬 실행은 이미 워밍업된 Node 프로세스다.
3. **이 실행은 `finally` 블록 앞의 SEC 워커 루프(§4 루프, `BUDGET_MS=270,000ms`)를 전혀 실행하지 않았다** — 실제 크론은 이 루프가 최대 270초를 쓴 **직후**에 `finally` 블록에 진입하므로, 시스템 리소스(메모리·네트워크 커넥션풀 등)가 이미 소모된 상태에서 시작한다. 이 로컬 재현은 "깨끗한 상태에서 finally 블록만" 잰 것이라 실제 조건과 다르다.

**결론(관측만)**: 로컬 기준으로는 예산 초과 가설(ⓐ)을 지지하는 증거가 나오지 않았다(5.4s ≪ 30s, 예외도 없음) — 그러나 위 세 가지 차이 때문에 **이 결과만으로 가설ⓐ를 기각할 수 없다.** 오히려 "로컬에서는 문제가 재현되지 않았다"는 사실 자체가, 원인이 Vercel 환경 특유의 무언가(콜드스타트·SEC루프 이후 리소스 상태·네트워크 RTT)일 가능성 쪽으로 무게를 살짝 옮긴다 — 단, 이것도 추정이다.

## 🔴 하지 않은 것 (지시대로)

`upsert()` 0회 호출 · `us_valuation`·`us_sector_relative`·`us_sector_wide` 쓰기 0 · 크론 수동 실행 0(이 스크립트는 `route.ts`의 `GET` 핸들러를 부르지 않고, 그 안의 두 함수 로직만 읽기 전용으로 재현했다) · SEC 신규 호출 0(구간1~6 어디에도 SEC API 호출이 없다 — `computeAndSaveValuation`·`computeAndSaveSectorRelative` 자체가 원래 SEC 호출이 없는 함수였음, 코드 주석에 이미 명시돼 있었다).

## 못 한 것 / 미측정

- Vercel 실제 환경에서의 재현 — 이 STEP의 범위 밖(크론 수동 실행 금지)
- SEC 워커 루프 실행 직후의 리소스 상태에서 재측정하는 것 — 안 함
- `resolveSector` 내부 4개 하위 쿼리(SPDR·나스닥·SIC·야후) 각각의 개별 소요시간 분해 — 4b는 뭉뚱그려 쟀을 뿐 내부 분해는 안 함
