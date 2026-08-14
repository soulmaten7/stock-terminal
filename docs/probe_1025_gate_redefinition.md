<!-- STEP 1025 — 새 게이트 산식을 드라이런으로 배선한다 (판정 불변 · 컷 안 열림) -->
# probe_1025 — 게이트 재정의 드라이런

## 새 산식 정의 (관측 전용 — `cutGateOk` 실제 판정은 그대로)

```
ABS_FLOOR   = 0.85   // 절대 하한
DROP_LIMIT  = 0.03   // 전일 대비 낙폭 상한(3%p, 832형 사고 — 98.6%→~0% — 를 잡는다)
newCoverageOk = freshCoverage >= ABS_FLOOR
             && (priorCoverage == null || freshCoverage >= priorCoverage - DROP_LIMIT)
newCutGateOk  = newCoverageOk && compositionOk   // compositionOk는 기존 계산 그대로 재사용
```

**`priorCoverage` 우선순위**: `us_coverage_history`의 직전 `as_of`(오늘 것 제외) → 없으면 `cron_heartbeats.job='lens-scores'` note의 `freshCoverage` → 둘 다 없으면 `null`(부트스트랩, 절대 하한만 적용). `lib/lensPrecompute.ts`의 `capGateDecision`에 반환 필드로만 추가했다 — 기존 4개 필드(`coverageOk`·`compositionOk`·`compRatio`·`cutGateOk`)의 계산은 한 글자도 바꾸지 않았다(833 값 잠금 테스트 11/11 무수정 통과로 증명, 아래 §값불변 참조).

## 오늘 데이터로 판정 시 통과 여부(예상 — 오늘 밤 22:45 UTC 이전 아직 실행 전)

`us_coverage_history`가 배포 시점엔 비어 있어 **첫 실행은 heartbeat 폴백 경로를 탄다.** 현재 저장된 마지막 `lens-scores` note(2026-08-13 22:25 UTC)를 그대로 대입:

| 값 | 현재(예상 prior) |
|---|---|
| `freshCoverage`(어제) | 93.89% |
| `compositionOk`(어제) | true(`compRatio` 96%) |
| `ABS_FLOOR` 통과 | 93.89% ≥ 85% → ✅ |
| `DROP_LIMIT` 통과(가정: 오늘도 비슷한 수준) | 낙폭이 3%p를 넘으려면 오늘 freshCoverage가 90.89% 미만이어야 함 — 최근 며칠 변동폭(93.76%→93.89%, STEP1017·1023 관측)보다 훨씬 큰 낙폭이라 **통과 가능성 높음** |
| **예상 `newCutGateOk`** | **true(통과) — 단 실제 값은 오늘 밤 실행 후 확정.** §W5 참조 |

🔴 **이 표는 예상이지 확정이 아니다.** 실제 `priorSource`·`newCutGateOk`는 오늘 밤 `cron_heartbeats.job='lens-scores'` note에서 확정된다(미도래, §W5).

---

## W1. `us_coverage_history` 신설 — 완료

`supabase/migrations/20260814_us_coverage_history.sql`(기존 마이그레이션 관례 그대로 — `us_market_cap_nasdaq` 패턴 재사용: `as_of`+`market` 복합키·이력 누적·RLS enable+anon/authenticated revoke) 작성 + MCP로 라이브 적용 완료(컬럼 7개 확인). `computeLensScores`(US)·`computeKrLensScores`(KR) 양쪽에 `recordCoverageHistory()` 호출을 추가했다 — **try/catch 내장**(917 §2 원칙, 적재 실패가 크론을 안 죽인다). KR도 같은 테이블에 `market='KR'`로 적재하되, US의 `capGateDecision` 호출부는 KR 값을 전혀 참조하지 않는다(전면 US 단독 원칙은 판정에 적용, 적재는 공용).

---

## W2. 새 게이트 산식 — 완료(관측 필드로만)

`lib/lensPrecompute.ts`의 `capGateDecision`에 `newCoverageOk`·`newCutGateOk`·`priorCoverage`·`priorSource`·`coverageDrop` 5개 필드를 반환에 추가했다. 부트스트랩 경로(`priorCoverage`가 `null`이면 `DROP_LIMIT` 조건을 자동 통과 — 절대 하한만 적용)를 명시적으로 구현했다. `computeLensScores`(US)에서 `fetchPriorCoverage()`를 **`recordHeartbeat()` 호출 전에** 실행해 이번 실행이 heartbeat를 덮어쓰기 전의 "어제" 값을 읽는다. 새 필드 전부를 heartbeat note에 실었다(`newCoverageOk`·`newCutGateOk`·`priorCoverage`·`priorSource`·`coverageDrop`).

---

## W3. 프루닝 가상 영향 — 배선 완료, 오늘 밤 실행분부터 실측치 생성

`pruneImpact()`를 신설해 `computeLensScores`(US)에 배선했다 — 실제 `DELETE`는 절대 실행하지 않고, **실제 prune 쿼리와 동일한 조건**(`market='US' AND updated_at < at`)으로 몇 행이 지워질지만 센다. `wouldPrune`(= `successRate>=0.8 && universeOk && pass2Ok`, `cutGateOk` 항은 제외 — "cutGateOk가 true였다면"을 보려는 것이므로)·`wouldPruneRows`·`wouldPruneSample`(최대 10건, `universeSet` 소속 여부로 "유니버스이탈" vs "계산실패(유니버스잔류)" 구분)·`successRate`·`universeOk`·`pass2Ok`·`pruned`를 전부 heartbeat note에 추가했다.

🔴 **이 STEP 시점엔 실측치가 없다** — `computeLensScores`는 크론에서만 호출되고(라이브 화면·API는 안 씀), 이 함수를 이 STEP에서 별도로 호출하면 `us_market_cap`을 실제로 갱신해 §값불변 증명을 깨므로 **호출하지 않았다**(아래 W4 설계 이유와 동일 원칙). **오늘 밤(22:45 UTC 이전 lens-scores는 21:30 UTC) 정규 실행부터 heartbeat에 실제 숫자가 쌓인다.** §W5에서 도래 여부 확인.

---

## W4. 컷 교체 시 판정 변화 — 완료(가상 계산, `lens_cuts`·`lens_scores`에 안 씀)

🔴 **"오늘 데이터"를 얻으려고 `topByMarketCap()`을 다시 부르지 않았다** — 그 함수는 `us_market_cap`을 실제로 upsert해 §값불변 증명(07-30 코호트 수 등)을 깬다. 대신 `lens_scores.*_value`(pass1이 `cutGateOk`와 무관하게 매일 밤 갱신하는 원시값, `computeLensScoresFor` 코드 직접 확인 — 컷 재유도만 `cutGateOk`에 걸리고 값 upsert는 무조건 실행)를 읽기만 했다. `scripts/probe_1025_cut_swap.ts`(신규, DB 쓰기 0)로 오늘자 값 분포에서 p30/p70을 다시 계산(프로덕션과 동일한 선형보간 `pctile` 공식 재사용)해 07-30 컷과 나란히 놓고, `lib/lensCuts.ts`의 `stateFromCut()`(프로덕션 판정 함수 그대로 재사용)으로 축별 state 변화를 셌다.

| 축 | 07-30 컷 | 오늘 컷 | 표본 | 변화 | 변화율 |
|---|---|---|--:|--:|--:|
| momentum | lo −2.707 · hi 34.272 | lo −1.168 · hi 37.170 | 1,017 | 36 | 3.54% |
| lowvol | lo 27.184 · hi 40.896 | lo 27.722 · hi 43.110 | 1,023 | 54 | 5.28% |
| valuation | lo 18.240 · hi 35.100 | lo 17.725 · hi 35.305 | 936 | 9 | 0.96% |
| quality | lo 13.909 · hi 30.329 | lo 13.903 · hi 30.447 | 888 | 3 | 0.34% |
| assetgrowth | lo 2.480 · hi 12.125 | lo 2.524 · hi 12.680 | 1,015 | 20 | 1.97% |
| **전체(축 무관, 하나라도 바뀐 종목)** | — | — | 1,036 | **117** | **11.3%** |

🔑 **18일치가 한꺼번에 반영돼도 우려했던 것만큼 크지 않다.** 컷 자체가 18일 동안 거의 안 움직였다(momentum `hi` 34.27→37.17, lowvol `hi` 40.90→43.11 정도 — 소폭 우측 이동, 시장이 완만히 랠리했다는 뜻과 정합). 가장 크게 흔들린 축은 lowvol(5.28%)·momentum(3.54%)이고, valuation·quality는 1% 미만으로 거의 안 흔들렸다. 축 5개 중 최소 하나가 바뀐 종목은 1,036건 중 117건(11.3%) — 대부분 경계값 근처(예: momentum 34.34~35.96, 새 `hi`=37.17에 못 미쳐 up→flat)에서 발생했고 극단적 역전(up→down 등)은 없었다.

---

## 1-4. STEP1024 자기신고 버그(SIC "0000") — 전수 확정

`scripts/probe_1025_sic0000.ts`(신규, DB 쓰기 0)로 5,976건 전수 재조회(재조회 필요 — 1024는 mismatch 서브셋만 직렬화해 COMMON_SIC 5,134건 전체의 원시 SIC 값을 남기지 않았다).

| 항목 | 건수 |
|---|--:|
| 전체 | 5,976 |
| CIK 없음 | 17 |
| 조회 실패 | 0 |
| SIC 있음(0000 아님) | 5,567 |
| **SIC = "0000"(플레이스홀더, 1024 버그 영향분)** | **17** |
| SIC 없음(그 외) | 375 |

검산: 5,567+17+375+17 = 5,976 ✅. 1024의 `hasSicCount`(93.44%=5,584)와도 정확히 일치(5,567+17=5,584).

**nameKind 분포**: `CEF_TRUST`(11) — `BKT`·`EEA`·`FUND`·`GF`·`HQH`·`HQL`·`KF`·`MIY`·`MPA`·`MQY`·`MUA`·`MYI`·`MYN`·`NVG`·`PCF`·`RCS`·`RFI` 중 11건(1024가 이미 보고한 11건과 정확히 일치, 검증됨) · `COMMON`(6) — 나머지 6건은 이름 패턴상 보통주로 분류됐던 것도 SIC "0000"이었다(1024가 못 본 부분, 이번에 처음 확인).

🔴 **1024의 결론(분모 축 닫힘)을 뒤집지 않는다.** 이 17건은 STEP1024의 시나리오 계산(SIC 6726·6770만으로 exclude 여부를 정함)에서 애초에 exclude 후보가 아니었다 — "COMMON_SIC으로 오분류"됐어도 "판별불가"로 정정해도 **어느 쪽이든 유니버스에서 빠지지 않는다**(둘 다 "제외 안 함" 범주). 96.95%→96.91% 하락이라는 결론에 영향 0. `docs/probe_1024_universe_sic.md`에 정정만 남긴다(아래 §문서갱신).

---

## W5. 오늘 밤 관측 — STEP1018 heartbeat(`revdcf`), 미도래

작업 시각 확인 **2026-08-14T07:30:49Z**. 다음 `revdcf` 크론(2026-08-14T22:45:00Z)까지 약 15.2시간 — **미도래**(1020~1024와 동일 반복 확인). `cron_heartbeats`는 여전히 5개 job뿐(email-brief·jp-disclosures·kr-lens-scores·lens-scores·us-perf), `revdcf` 부재 — 변화 없음.

`lens-scores`(21:30 UTC, 오늘 밤 이 STEP의 새 코드로 처음 도는 크론)도 아직 미도래 — 마지막 실행은 2026-08-13 22:25:38 UTC(어제), `freshCoverage=93.89%`·`compositionOk=true`·`cutGateOk=false`(위 예상 계산의 기준값). **오늘 밤 21:30 UTC 실행분부터 `newCutGateOk`·W3 프루닝 가상 수치가 실측으로 채워진다** — 이 STEP 완료 시점엔 아직 관측 불가.

🔴 **두 크론 구분**: `lens-scores`(21:30 UTC) = 이 STEP이 건드린 것. `revdcf`(22:45 UTC) = STEP1018의 4단계 heartbeat 첫 시험(이 STEP은 `app/api/cron/revdcf/route.ts` diff 0으로 무관하게 보호). 둘 다 오늘 밤 처음으로 각자의 신규 계측을 달고 돈다.

---

## 문서 갱신

- `docs/DATA_SOURCE_CATALOG.md`: 이 STEP 범위 밖(게이트 산식은 카탈로그 대상 아님) — 갱신 없음.
- `docs/probe_1024_universe_sic.md`: 슬롯 서술에 **1-4 결과(17건, 1024 결론 불변)** 정정 한 줄 추가 예정(아래 실제 편집 참조).
- `docs/CRON_OBSERVABILITY.md` §5-2: `us_coverage_history` 행 추가 + `lens-scores` 새 관측 필드 설명 추가(완료, 위 커밋 대상).
- `docs/ANSWERABILITY_MAP.md` §E(7렌즈): 현재 상태에 "새 게이트 산식 드라이런 배선(관측 전용, 실제 판정 불변)" 한 줄 추가(§3 미변경).

---

## 못 한 것 / 철회·정정한 것 / 미측정으로 남은 것

**못 한 것**
- W3(프루닝 가상 영향)의 **실측치** — 오늘 밤 21:30 UTC 정규 실행 전까지는 배선만 확인 가능(값 불변 증명을 지키려고 이 STEP에서 직접 호출하지 않았다)
- W5(STEP1018 heartbeat) 실측 — `revdcf` 22:45 UTC 미도래

**철회·정정한 것**
- 없음(이 STEP 자체의 새 발견은 전부 "정정"이 아니라 "관측"이었다)

**미측정으로 남은 것**
- 오늘 밤 실행 후 `newCutGateOk`의 실제 값(위 표는 예상치)
- 프루닝 가상 삭제 건수·성격(오늘 밤 이후)
- SPAC의 SIC 6770 미배정 15건 원인(1024 이월)
- COMMON_SIC 내 0000 외 다른 오분류 가능성(예: SIC가 있으나 실제 사업과 무관한 행정 기본값 — 1024가 SPAC에서 발견한 것과 유사한 패턴이 다른 카테고리에도 있을 수 있음, 미검토)

🔴 **실제 게이트 전환·프루닝 분리·상수(0.85/0.03) 확정은 전부 장은태 판정이다. 이 STEP은 새 산식이 무엇을 판정할지 보여주는 것까지다.**
