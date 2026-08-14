<!-- STEP 1018 — 죽는 지점을 죽기 전에 기록한다 + 나스닥 호출 방식을 다시 찾는다 (계측·취득 방식만 · 값 불변) -->
# probe_1018 — 단계별 heartbeat 배선 + 나스닥 호출 재탐색

## W1. `revdcf` 단계별 heartbeat 배선

### 배선 위치(`app/api/cron/revdcf/route.ts`)

1007의 설계 오류(heartbeat가 `finally` 맨 끝에만 있어 함수가 강제 종료되면 죽는 지점을 못 잰다)를 고쳤다. `stageHeartbeat()` 헬퍼를 신설해 같은 `job='revdcf'` 행을 stage가 끝날 때마다 upsert로 덮어쓴다.

| stage 값 | 배선 위치(`파일:줄번호`) | 찍는 시점 |
|---|---|---|
| `loop_done` | `app/api/cron/revdcf/route.ts` — `finally` 진입 직후, `computeAndSaveValuation` 호출 전 | SEC 워커 루프 종료 직후 |
| `valuation_done` | 같은 파일 — `computeAndSaveValuation` 반환 직후, `computeAndSaveSectorRelative` 호출 전 | 밸류에이션 저장 완료 직후 |
| `sector_relative_done` | 같은 파일 — `try` 블록 안, `computeAndSaveSectorRelative` 성공 반환 직후(예외 시엔 이 stage를 안 남기고 `catch`로 빠진다) | 섹터 상대 저장 완료 직후 |
| `complete` | 같은 파일 — 기존 위치(안쪽 `finally`) | 기존과 동일, `stage:"complete"`만 추가 |

각 stage 호출은 `elapsedMsAtStage`(그 시점까지 누적 경과)·`maxDurationRemainingMs`(`maxDuration*1000 − elapsedMsAtStage`)·`heartbeatCallMs`(이전 stage들의 heartbeat 호출 자체가 소요한 시간, 누적)를 함께 싣는다. 기존 note 필드(`processed`·`finished`·`loopMs`·`budgetExhausted`·`valuationSaved`·`sectorRelativeSaved`·`sectorWideAdded`·`sectorWideError`·`finallyMs`·`finallyTotalMs`·`routeMs`·`sectorRelativeError`)는 **전부 유지**하고 `complete` 단계에서 그대로 다시 싣는다 — 이번 것은 stage 4개로 나눠 찍는 추가일 뿐 기존 계측을 대체하지 않는다.

`recordHeartbeat`는 기존과 동일하게 내부 try/catch로 격리돼 있다(917 §2, 무변경). 4회로 늘어난 호출 자체의 소요시간은 `heartbeatCallMs`에 담겨 다음 stage부터 확인 가능하다 — 오늘 밤 결과에서 이 값이 무시할 만한 수준(수십 ms대)인지 실측된다.

**값 계산 변경 없음**: `computeAndSaveValuation`·`computeAndSaveSectorRelative`의 내부 로직, upsert 대상 테이블·컬럼, `BUDGET_MS`(270,000)·`maxDuration`(300) 전부 무변경 — `git diff`로 확인(아래 §값 불변 증명).

### 🔴 내일 밤 무엇을 보면 무엇이 확정되는가(⓪-4 W1 표 그대로)

| 관측(내일 08-14 22:45 UTC 이후) | 결론 | 다음 축 |
|---|---|---|
| 마지막 stage가 `valuation_done`에서 멈춤 | 🔑 **`computeAndSaveSectorRelative` 도중 함수가 죽었다** — 예산 초과 확정 | `BUDGET_MS` 판정(장은태) |
| `sector_relative_done`까지 찍히고 `complete`가 없음 | 마지막 upsert(`us_sector_relative`) 이후, heartbeat 기록 이전 구간에서 죽는다 | 그 구간(수십 ms 내외로 매우 짧음) 재조사 |
| `complete`까지 찍힘 + `us_sector_relative` 08-14 생성 | 🔑 **정지가 저절로 풀렸다** — 어제까지의 실패는 다른 원인(1017의 heartbeat 부재와 무관한 별개 사고였을 수 있음) | 재조사 |
| stage가 **하나도 안 남음**(행 자체가 없거나 여전히 옛 형식) | 🔴 계측 자체가 도달 못 함 — `loop_done`보다도 앞에서(SEC 워커 루프 진입 전, 혹은 GET 핸들러 극초반) 죽는다 | 루프 진입 전 구간 조사 — 이 STEP의 배선으로도 못 잡음, 추가 계측 필요 |

---

## W2. 나스닥 호출 방식 탐색 — 로컬 5회, 전부 실패

`scripts/probe_1018_nasdaq_call.ts`(신규 프로브, 프로덕션 코드 아님 — `lib/nasdaqMarketCap.ts`는 읽지도 수정하지도 않음)로 5가지 방식을 순서대로 1회씩, 호출 간 10초 이상 간격으로 시도했다.

| # | 방식 | URL 차이 | timeout | 결과 | 소요시간 | 에러 |
|---|---|---|---|---|---|---|
| 1 | 현행 그대로(대조군) | `tableonly=false&limit=25000&download=true` | 20s | 🔴 실패 | 20,004ms | `TimeoutError: The operation was aborted due to timeout` |
| 2 | timeout만 60초 | 동일 URL | 60s | 🔴 실패 | 60,002ms | 동일 |
| 3 | `tableonly=true` | `tableonly=true&limit=25000&download=true` | 20s | 🔴 실패 | 20,002ms | 동일 |
| 4 | 페이지네이션(`limit=1000&offset=0`) | `tableonly=false&limit=1000&offset=0&download=true` | 20s | 🔴 실패 | 20,001ms | 동일 |
| 5 | 거래소 분할(`exchange=nasdaq`) | `tableonly=false&limit=25000&exchange=nasdaq&download=true` | 20s | 🔴 실패 | 20,001ms | 동일 |

**총 호출 5회**(7회 이내 준수, 성공이 없어 재현 확인 라운드는 실행하지 않음) · **호출 간 10초 이상 준수.**

🔑 **⓪-4 W2 판정 — 두 번째 갈래.** "어떤 방식으로도 로컬 실패" — 특히 **timeout을 60초로 3배 늘려도 정확히 60,002ms에서 그대로 timeout됐다**는 것은, 이게 "응답이 느릴 뿐"이 아니라 **연결 자체가 어떤 timeout을 걸어도 완결되지 않는 상태**였음을 강하게 시사한다(1017의 20초 로컬 실패와 같은 결이지만, 이번엔 timeout 값 자체를 배제할 수 있게 됐다). `tableonly`·페이지네이션·거래소 파라미터 변경도 전부 동일하게 실패해, **쿼리 파라미터 조합의 문제도 아니다.**

**교체 판정 — 교체하지 않는다.** 규칙대로 "1회 성공만으로는 교체하지 않는다"가 아니라 **애초에 성공이 0건**이라 재현 확인 라운드 자체가 발동하지 않았다. `lib/nasdaqMarketCap.ts`는 **수정하지 않았다.**

🔴 **이 STEP의 로컬 결과만으로 "나스닥 API 자체가 죽었다"고 단정하지 않는다** — ⓪-5가 명시한 대로, 오늘의 5회 실패가 **오늘 이 시각의 상태**인지 **지속적 현상**인지는 반복 관측 없이 모른다(이 STEP은 반복 호출을 금지했다). 로컬·프로덕션(1017) 양쪽에서 같은 실패가 나온 것은 egress 전용 가설을 약화시키지만, **나스닥 소스 자체의 현재 가용성**이 남은 설명이다(⓪-4 W2 두 번째 행 그대로).

---

## 2-3. "296건 고정" 정정

1017이 밝힌 대로 `us_market_cap`의 07-30 코호트는 고정이 아니라 **296 → 287로 완만히 회복 중**이다(2026-08-13 밤 사이 9건 회복, 이번 §값 불변 증명 재확인에서도 287 유지).

**검색 결과**: `docs/DATA_SOURCE_CATALOG.md`(md·xlsx 둘 다) 전체를 검색했으나 **"296건 고정" 서술 자체가 이 파일엔 없었다** — 정정할 문구가 존재하지 않는다(확인만 하고 손대지 않음). 실제로 이 서술이 있던 곳은 아래 두 문서였다:

| 문서 | 처리 |
|---|---|
| `docs/ANSWERABILITY_MAP.md`(§2 G, 현재 상태 행) | ~~296건 고정~~ 취소선 + "1017/1018에서 정정: 고정이 아니라 완만히 회복 중" 추가 |
| `docs/probe_1015_answerability_audit.md`(§1-G, §5 두 곳) | 각각 ~~296건 고정~~ 취소선 + 1018 정정 문구 추가 |
| `docs/DATA_SOURCE_CATALOG.md` / `.xlsx` | 🟢 **해당 서술 없음 — 정정 대상 아님(확인됨, 변경 0)** |
| `docs/CHANGELOG.md` · `docs/STEP_LEDGER.md` | 🔴 **손대지 않음** — 세션별 이력 로그는 작성 시점의 사실을 그대로 보존하는 것이 원칙(정정은 그 시점 이후 세션에서 새 항목으로 기록, 과거 항목을 소급 수정하지 않는다) |

🔴 **회복 속도는 추정하지 않는다** — 지금 가진 것은 2일치 관측(1016의 15:47Z 스냅샷 → 1017/1018의 08-14 00시대 스냅샷)뿐이다. "9건/일" 같은 추세선을 긋지 않았다.

`docs/ANSWERABILITY_MAP.md` §3(답하지 않는 영역)은 건드리지 않았다.

---

## § 값 불변 증명 (배포 전 스냅샷)

| 항목 | 값 |
|---|---|
| `revdcf_results` 최신 as_of(2026-08-13) 행수 | 604 |
| `revdcf_results` 지문(cik:verdict:wacc md5) | `8457c543b1bd188bc441944dfd45eda2` |
| `us_valuation` 최신 as_of(2026-08-13) 행수 | 5,820 |
| `us_market_cap` 총 행수 / 07-30 코호트 | 5,913 / 287 |
| `us_stock_perf` 행수 | 6,385 |
| `lens_scores` US / KR | 1,036 / 978 |
| `lens_cuts` US as_of | 2026-07-30(불변 — 이번 STEP은 이 정지를 풀지 않는다) |
| `us_sector_relative` 최신 as_of | 2026-08-10(불변 — 아직 안 풀린 게 정상, D는 여전히 100% 실패 상태) |
| `us_market_cap_nasdaq` 행수 | 0(다음 크론 전까지 유지) |

**보호 파일 diff 0 확인**: `lib/lensPrecompute.ts` · `scripts/ingest_us_sector.ts` · `vercel.json` · `data/us_symbols.json` — `git diff --stat` 전부 빈 결과.

🔴 배포 후 재확인은 크론이 아직 안 돌아 값 자체가 바뀔 수 없다(코드 배포는 DB에 아무것도 안 씀) — 배포 직후 즉시 동일 쿼리로 재확인해 **바이트 단위로 일치함**을 아래 "게이트 8 확인" 절차 중 함께 검증한다.

---

## 못 한 것 / 철회·정정한 것 / 미측정으로 남은 것

**못 한 것**
- W1의 실제 관측 — 내일 밤(08-14 22:45 UTC) 크론까지 기다려야 한다.
- W2에서 나스닥이 "오늘만 느렸는지 지속적인지" — 반복 호출 금지 원칙상 확인 못 함.

**철회·정정한 것**
- "296건 고정"(1008 이래 여러 문서에 퍼져 있던 서술) — `ANSWERABILITY_MAP.md`·`probe_1015`에서 취소선 정정. `DATA_SOURCE_CATALOG.md`는 애초에 이 서술이 없어 정정 대상이 아니었음을 확인.

**미측정으로 남은 것**
- `BUDGET_MS` 조정 여부 · 나스닥 폴백 배선 · 게이트 도입 · D 조회 키 수정 — 전부 장은태 판정, 이 STEP은 손대지 않았다.
- W1의 4가지 확정 조건 중 어느 것이 맞을지 — 내일 밤 관측 필요.

🔴 **`BUDGET_MS`·나스닥 폴백 배선·게이트 도입·D 조회 키 수정은 전부 장은태 판정이다. 내일 밤 크론이 W1의 답을 낸다. 그때까지 `revdcf`를 다시 건드리지 않는다.**
