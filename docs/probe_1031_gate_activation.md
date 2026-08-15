<!-- STEP 1031 — 커버리지 게이트를 실제로 전환한다 (🔴 라이브 판정값이 바뀐다 · 장은태 승인 완료) -->
# probe_1031 — 게이트 실전환 + 프루닝 명시적 차단

## 전환 내용 한 줄

`lib/lensPrecompute.ts`의 `capGateDecision`에서 `coverageOk`(따라서 `cutGateOk`)의 계산식을 **고정 97% 임계 → "급락 탐지"(절대 하한 85% + 전일 대비 낙폭 상한 3%p)로 교체**했다. `compositionOk`(메가캡 95%)는 무변경. **프루닝은 이번엔 US에서만 명시적으로 안 켰다**(`pruneEnabled:false`, §1-3) — KR은 완전히 무영향.

**배포 시각 vs 21:30 UTC**: 배포 Ready 11:25 UTC, 크론까지 약 10시간 5분 여유 — 오늘 밤이 확실히 새 코드로 돈다(상세 "배포 시각 대조" 절).

---

## 🔴 STEP1032 정정(2026-08-15) — 아래 본문의 "63행(6.08%)"·"117/1,036(11.3%)"은 예측/추정이었고 실측과 다르다

**이 문서 작성 당시(08-14, 오늘 밤 실행 전) 아래 §들에 남긴 "63행"·"11.3%"는 전부 그날의 최선 추정이었다 — 지우지 않고 그대로 두되, 실측으로 확정된 값을 여기 먼저 밝힌다.**

| 항목 | 이 문서(08-14, 실행 전 추정) | 실측(08-14 21:30 UTC 실행 후, STEP1032 확정) |
|---|---|---|
| 프루닝 영향 행수 | 63행(6.08%) | **76행(1,039행 중 7.3%)** |
| 컷 교체 시 판정 변화 | 예측 11.3%(STEP1025 W4 시뮬레이션) | **실측 6.2%**(예측의 절반 — 원인 미규명, 장은태 판정: 기록만) |

**§0-A 게이트 실전환 성공 — 실측 확정 (08-14 21:30 UTC `lens-scores` 크론, `cron_heartbeats.job='lens-scores'` `last_run_at=2026-08-14 21:39:32 UTC`, `ok=true`)**:

| 관측 | 값 | 뜻 |
|---|---|---|
| `freshCoverage` | 94.16% | 구 산식(97%)이면 FAIL — 전환 없었으면 20일째 정지였다 |
| `priorCoverage` / `coverageDrop` | 93.89% / −0.27%p | 낙폭이 아니라 개선. 3%p 상한 여유 충분 |
| `coverageOk`·`compositionOk`(96%)·`cutGateOk` | 전부 true | 새 산식 통과 |
| `newCoverageOk`·`newCutGateOk` | 전부 true | 1025 관측 필드와 일치 = 자체 검증 통과 |
| `pruned`/`pruneBlockedByFlag` | false/true | §1-3 차단 작동 확인 |
| `lens_cuts` US `as_of` | **2026-08-14** | 07-30에서 19일 만에 갱신 |

상세 판정·정정·상한 신설은 `docs/probe_1032_prune_activation.md` 참조.

---

## ⓪-1b 기존 답 확인

- `docs/KNOWN_ANSWERS.md`에 "게이트 임계"·"프루닝"·"컷 재유도" 항목 직접 검색 — **"커버리지 게이트(97%)를 지금 넘길 방법이 있는가"** 1건만 존재(분자·분모 소진 결론, "남은 레버 = 게이트 임계 자체" — 이 STEP이 그 레버를 실제로 당긴다). "프루닝"·"컷 재유도" 단독 항목은 없음(신설 대상 — 이 STEP 완료 후 추가).
- **STEP833 원 판정 근거 확인**(`docs/CHANGELOG.md:4890-4899`, `## 2026-07-30 (3) — 🔧 US 유니버스 취득 완전성`): 취득 게이트 도입 이유 = *"fresh 커버리지 <97%(정상 98.6%) ∨ 구성(직전 상위 200 메가캡 fresh확보<95%)이면 → 컷 재유도 금지·프루닝 금지·Sentry error·크론 500. 편향 표본으로 판정 기준을 안 만든다(832 진짜 피해 차단)."* 🔑 **97%라는 숫자 자체의 근거는 "정상 ~98.6%(프로브 실측)·여유 1.6pp"**(코드 주석, `lensPrecompute.ts:69`, 이번 STEP에서 삭제) — 즉 97%는 이론적 임계가 아니라 **당시 실측 정상치에 여유를 더한 경험값**이었다. 그 정상치 자체가 소진돼(1017~1024) 더 이상 유효하지 않다는 것이 게이트 재정의의 근거.

---

## 1-1. 롤백 재료 확보(원문 그대로)

### `lens_cuts` US 5행(as_of=2026-07-30)

| market | lens_key | lo | hi | n | method | as_of |
|---|---|---|---|---|---|---|
| US | assetgrowth | 2.48 | 12.125 | 976 | p30/p70 | 2026-07-30 |
| US | lowvol | 27.184 | 40.896 | 978 | p30/p70 | 2026-07-30 |
| US | momentum | -2.707 | 34.272 | 974 | p30/p70 | 2026-07-30 |
| US | quality | 13.909 | 30.329 | 852 | p30/p70 | 2026-07-30 |
| US | valuation | 18.24 | 35.1 | 901 | p30/p70 | 2026-07-30 |

### `lens_scores` US 1,036행 — 7축 `*_state` 분포(전이 대조용)

| 축 | 라벨별 건수 |
|---|---|
| momentum | flat 403 · up 325 · down 289 · null 19 |
| technical | up 737 · down 283 · null 16 |
| lowvol | mid 408 · jumpy 334 · calm 281 · null 13 |
| valuation | mid 365 · cheap 289 · rich 282 · na 100 |
| quality | mid 351 · high 270 · low 267 · na 148 |
| assetgrowth | mid 396 · aggressive 319 · conservative 300 · na 21 |
| fscore | mid 424 · strong 295 · na 292 · weak 25 |

🔴 `lens_cuts`는 upsert라 오늘 밤 크론이 돌면 07-30 값이 사라진다 — 위 표가 유일한 대조군이다.

---

## 1-2. 산식 전환 (`lib/lensPrecompute.ts` `capGateDecision`)

**diff 요지**:
- `coverageMin` 파라미터·계산 삭제(구 산식 전용, 고정 97%/KR 0.95 임계값이었음).
- `coverageOk = newCoverageOk`(= `freshCoverage >= ABS_FLOOR && (priorCoverage == null || freshCoverage >= priorCoverage - DROP_LIMIT)`)로 교체.
- `ABS_FLOOR = opts.absFloor ?? 0.85` · `DROP_LIMIT = opts.dropLimit ?? 0.03` — 이름은 STEP1025가 이미 붙여둔 그대로, 계산 위치만 `coverageOk`로 승격.
- `compositionOk`(§ compMin 0.95) — **한 글자도 안 바꿈**.
- `newCoverageOk`·`newCutGateOk` 필드는 **그대로 유지**(관측용 독립 재계산) — 이제 `coverageOk`·`cutGateOk`와 항상 같은 값이어야 하므로 self-check가 된다. `computeLensScores`(US)의 로그·Sentry에 불일치 감지(`[us-cut-gate-mismatch]`)를 추가했다.
- **KR 호출부(`computeKrLensScores`) 1줄 변경**: `{ coverageMin: 0.95 }` → `{ absFloor: 0.95 }`. KR은 `priorCoverage`를 안 넘기므로(`fetchPriorCoverage` 미호출) 항상 부트스트랩 경로(절대 하한만 비교)를 타 **수치상 구 산식과 완전히 동일**하다 — KR 전면 동결을 코드 레벨에서 보존.

---

## 1-3. 프루닝 명시적 차단

**방식**: `computeLensScoresFor`의 opts에 `pruneEnabled?: boolean`(기본 `true` — 기존 호출부 전부 무전달로 완전 불변) 추가. `canPrune = pruneEnabled && successRate>=0.8 && universeOk && pass2Ok && cutGateOk`(기존 4중 게이트 조건은 **한 글자도 안 지움**, `pruneEnabled &&`만 앞에 추가). 반환값에 `pruneBlockedByFlag: !pruneEnabled` 추가.

**US만 명시적으로 차단**: `computeLensScores` 안 `computeLensScoresFor(..., { ..., pruneEnabled: false })` — 한 줄. **KR은 `pruneEnabled`를 안 넘겨 기본 `true`, 완전히 무영향**(§0-B가 우려한 "게이트 열면 프루닝도 같이 열린다"는 공유 함수 문제를, STEP 텍스트가 예시로 든 모듈 전역 상수 대신 **호출부별 opt-in 파라미터**로 풀었다 — 모듈 전역 상수였다면 KR 프루닝도 하루 동안 collateral로 막혔을 것이다. 이 설계 판단은 STEP 텍스트의 "예:" 예시를 문자 그대로 따르지 않은 것이라 여기 명시한다).

**되돌리는 법**: `lib/lensPrecompute.ts`의 `computeLensScores`(US) 안 `pruneEnabled: false` 를 지우거나 `true`로 바꾸면 다음 실행부터 즉시 복원 — 833의 4중 게이트는 그대로 살아있어 추가 안전장치 역할을 한다.

**관측**: `cron_heartbeats.job='lens-scores'`의 `note.pruneBlockedByFlag`가 `true`로 나와야 정상(차단이 실제로 걸렸다는 증거). `false`가 나오면 차단 실패 — ⓪-4 매트릭스 네 번째 행.

---

## 1-4. 833 테스트 — 보존 + 확장

`lib/lensUniverseGate.test.ts`: **기존 11개 `it()` 블록 전부 보존**(구조·설명 문자열까지 그대로, 지운 것 없음). 기대값이 바뀐 것은 **1개뿐**:

| 테스트 | 구 기대값 | 신 기대값 | 이유 |
|---|---|---|---|
| "커버리지 95%·전일 기록 없음" (구 라벨: "커버리지 < 97%면 게이트 실패") | `coverageOk=false`(97% 고정 임계 미달) | `coverageOk=true`(85% 절대 하한 통과, 부트스트랩) | coverageOk 산식 자체가 교체됐다 — 97%라는 숫자가 더 이상 존재하지 않는다 |

나머지 10개(§1 결측분류 1 · §2 구성대량소실·정상·정상화ADD·부트스트랩구성스킵·경계95%/94.5% 5 · §3 churn 3)는 **전부 무수정 통과** — coverageOk 산식과 무관하거나(§3), 테스트에 쓰인 freshCoverage 값(0.986)이 구·신 산식 양쪽에서 똑같이 통과하는 값이라서다. KR 테스트 1개는 파라미터명만 `coverageMin`→`absFloor`로 바뀌었다(값·기대값 불변, KR 동결 증명).

**새로 추가한 6개**(`§2b capGateDecision — 새 산식`): 절대 하한 경계(85.0%/84.9%) · 낙폭 상한 경계(전일 90%→87%/86.9%) · 절대하한 통과해도 낙폭이 크면 실패(832형 재현: 98.6%→50%) · `priorCoverage=null` 부트스트랩(`priorSource="none"` 확인) · `coverageOk`↔`newCoverageOk`·`cutGateOk`↔`newCutGateOk` self-check 일치(4개 시나리오) · 새 산식 통과해도 `compositionOk=false`면 여전히 차단(AND 결합 확인).

tsc 0 · vitest **378/378**(372+6신규, 기존 372 중 1개는 기대값 변경·나머지 371개는 무수정 재확인 통과).

---

## ⓪-4 반증 조건 매트릭스(오늘 밤 21:30 UTC 이후 확인 — 그대로 인용)

| 관측 | 결론 | 다음 축 |
|---|---|---|
| `lens_cuts` US가 **08-14로 갱신** + 판정 변화 **11% 내외** | 🔑 **19일 만에 정상화.** 1025 W4 예측과 일치 | 프루닝 판정 |
| 갱신됐는데 판정 변화가 **11%와 크게 다르다** | 🔴 W4 시뮬레이션이 틀렸거나 데이터가 그새 바뀌었다 | 원인 규명 |
| **여전히 07-30** | 산식 전환이 실행 경로를 안 탔다 | 배선 재확인 |
| 🔴 **프루닝이 돌아 행이 지워졌다** | 🔴 **차단 실패.** 즉시 크게 보고 | 복구 + 차단 재설계 |

🔴 **네 번째가 나오면 최우선으로 보고한다.**

---

## 🔴 근거 세 개가 전부 1일 관측이다

§0-A의 "PASS"·"63행(6.08%)"·"117/1,036(11.3%)" — 셋 다 **오늘(2026-08-14) 단 하루의 관측치**다. 오늘 밤 실행이 그 첫 실측이고, 다르게 나올 수 있다. 특히 "PASS" 판정(85% 하한·낙폭 +0.13%p·구성 96%)은 어제-오늘 단 한 쌍의 비교이며, 낙폭이 +0.13%p(개선)였다는 것은 **오늘이 우연히 좋은 날일 가능성을 배제하지 못한다**는 뜻이기도 하다.

---

## 배포 시각 대조

`lens-scores` 크론 스케줄 확인: `vercel.json:20-22` → `"path": "/api/cron/lens-scores", "schedule": "30 21 * * *"` = **21:30 UTC**.

**실측**: 커밋 `e337b0d` → push(11:23 UTC) → Vercel 배포 생성 `2026-08-14 11:23:22 UTC` → Ready 확인 `2026-08-14 11:25 UTC`(빌드 ~2분). **21:30 UTC까지 약 10시간 5분 여유** — 1020이 겪은 "배포가 크론보다 늦어 구코드로 첫 실행됨" 함정과 정반대로 충분히 앞섬. 오늘 밤 21:30 UTC 실행이 확실히 이 STEP의 코드로 돈다.

---

## 3중 규칙

- **못 한 축**: 실제 게이트 전환 후 첫 크론 실행 결과(오늘 밤 21:30 UTC) — 아직 미도래. 프루닝을 켰을 때 실제로 몇 행이 지워지는지(오늘은 차단돼 있어 관측 불가, `wouldPrune`/`pruneImpact()` 시뮬레이션값만 존재).
- **철회·정정**: 없음(이 STEP은 STEP1025의 드라이런을 그대로 실전환한 것이며, 기존 결론을 뒤집지 않는다).
- **미측정**: 오늘 밤 실행 후 `lens_cuts` 갱신 여부·판정 변화율·`pruneBlockedByFlag` 실제값·`cutGateOk`/`newCutGateOk` self-check 일치 여부 — 전부 미도래.

## 판정 요청(다음 STEP, 오늘 밤 관측 후)

프루닝 활성화 여부 · `BUDGET_MS` 조정 · D축(업종 대비) 조회 키 수정 — 전부 이 STEP 범위 밖, 장은태 판정 대기.
