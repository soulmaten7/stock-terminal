# STEP 912 — 🔴 라이브 이상징후 진단: `lens_cuts` 8일 정체 · KR 크론 2개 미실행 (수리 금지 · 진단만)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_912_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `a793fef`(STEP 911 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `REVDCF_ENABLED` Production **OFF** · `revdcf_results` 604×4 · `us_market_cap` 5,888

🔴 **불변 금지선**: DB **쓰기 금지**(읽기만) · **크론 수동 실행 금지** · `vercel.json`·`.github/workflows/**`·`data/us_symbols.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **이 STEP은 진단만 한다. 코드 수정 0.** 🔑 **7렌즈는 라이브다 — 원인을 모르는 채 고치면 사용자에게 나가는 판정이 바뀐다.**
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 🔴 성격: 이것은 보류 위반이 아니다

`STATE.md` 보류: *"**7렌즈 깊이 확장** — 모델 완성 전 재개 금지."*

🔑 **"깊이 확장"과 "라이브 장애 진단"은 다르다.** `lens_cuts`가 **8일 8시간** 멈춘 것은 확장이 아니라 **고장 가능성**이고, **7렌즈는 플래그 뒤가 아니라 실제 사용자에게 나가고 있다**(역DCF와 정반대 상황).

🔴 **그래도 이 STEP은 고치지 않는다. 진단하고 판정서를 올린다.** 🔑 **수리 여부·시점은 장은태 판단이다** — 866~868에서 `/api/revdcf` 유출을 즉시 막은 것과 달리, 여기는 **무엇이 원인인지조차 모른다.**

🔴 **범위 판단은 Cowork 것이 아니다.** 위 §0의 *"진단 ≠ 확장"*은 **Cowork의 주장**이고, 899·901에서 Cowork이 같은 자리에서 이미 한 번 틀렸다(보류 중 수행). 🔑 **이 파일이 붙여넣기로 실행된다는 것 자체가 장은태의 범위 승인**이다 — 승인 없이 스스로 열지 않는다.

## §1 — 911 실측 (🔴 재확인부터)

| 크론 | 테이블 | 최신 `as_of` | 상태 |
|---|---|---|---|
| `us-perf` | `us_stock_perf` | 08-04 22:24 | 정상 |
| `kr-etp` | `kr_etp_snapshot` | 08-05 10:25 | 정상 |
| `lens-scores`(US) | `lens_scores`(US)·`us_market_cap` | 08-04 22:18 | 정상 |
| `daily-brief` | `daily_brief` | 08-04 | 정상 |
| `email-brief` | `cron_heartbeats` | 08-04 23:14 `ok=true` | 정상 |
| `revdcf` | `revdcf_results` | 08-04 | 정상 |
| 🔴 `kr-perf` | `kr_stock_snapshot` | **08-04 10:37** | 오늘 지터창(10:59) 지나고 **약 1h41m 초과 미갱신** |
| 🔴 `kr-lens-scores` | `lens_scores`(KR) | **08-04 11:13** | 오늘 지터창(10:30±59) 지나고 미갱신 |
| 🔴 **`lens_cuts`(US·KR)** | — | **07-28 04:33** | **8일 8시간 정체** |

🔴 **먼저 이 표를 재확인**한다(시각이 지나 상태가 바뀌었을 수 있다). 🔴 **다르면 다르다고 적고 그 값으로 진행한다.**

## §2 — 🔴 `lens_cuts` 정체 원인 (최우선)

🔑 **패턴이 단서다**: 같은 파이프라인의 **값 upsert는 정상**(`lens_scores`·`us_market_cap` 08-04)인데 **컷 재유도만** 멈췄다.

### Cowork 가설 (🔴 가설이다 · 검증 대상)

`lib/lensPrecompute.ts`:
```
:460  const { coverageOk, compositionOk, compRatio, cutGateOk } = capGateDecision(diag.freshCoverage, priorTopSyms, freshSet);
:468  if (!cutGateOk) Sentry.captureMessage(`[us-cut-gate] 취득 게이트 실패(…) → 컷 재유도·프루닝 금지`, "error");
```
→ 🔴 **`cutGateOk=false`가 계속 나와 컷 재유도가 차단되고 있을 가능성.**

### 🔴 검증 (코드로 · 추정 금지)

1. **`capGateDecision`을 열어** `coverageOk`·`compositionOk`·`cutGateOk` 산식과 **임계값**을 그대로 적는다.
2. **컷을 쓰는 경로를 따라간다** — `cutGateOk`가 false면 **정확히 무엇이 안 일어나는가**. `lens_cuts` upsert가 그 뒤에 있는가.
3. 🔴 **`freshCoverage`의 최근 값을 알 수 있는가** — 894가 로그에 붙였다. 🔴 **로그 보존 1시간**(911 확정)이라 **다음 크론 실행 시각에 봐야 한다.** 🔴 **이 STEP에서 못 보면 "다음 실행 때 확인 필요"로 적고 시각을 명시한다**(US `lens-scores` = 21:30 UTC · KR = 10:30 UTC).
4. **DB로 우회 추정** — `us_market_cap`의 최신 `as_of` 행 수(5,888 중 오늘자 몇 건)로 `freshCoverage`를 **역산할 수 있는지** 본다. 🔴 **역산이 부정확하면 부정확하다고 적는다.**
5. 🔴 **7-28에 무슨 일이 있었는지** — `CHANGELOG.md`·STEP 문서에서 그 날짜 전후를 찾는다. 🔑 **컷이 그때부터 멈췄다면 그날 무언가 바뀌었을 수 있다.**

## §3 — KR 크론 2개 미실행

`kr-perf`·`kr-lens-scores`가 오늘 지터창을 지나고도 안 돌았다.

1. **어제(08-04)는 돌았다** — 🔴 **08-04 이전에도 이런 패턴이 있었는지** 과거 `as_of`를 조회해 **연속성**을 본다. 🔑 **오늘만 그런 건지 반복인지가 원인을 가른다.**
2. **`cron_heartbeats`에 KR 크론 기록이 있는가** — `email-brief`는 있다. 🔴 **없으면 "관측 수단 없음"으로 적는다.**
3. 🔴 **Vercel 로그는 보존 1시간이라 이미 밖이다**(911 확정). **다음 실행 시각(10:30 UTC)에 확인해야 한다**고 적고 넘어간다. 🔴 **추정으로 원인을 쓰지 말 것.**

## §4 — 🔴 판정서 (`docs/DECISION_912_LIVE.md` 신설)

**장은태가 수리 여부·시점을 정할 수 있는 한 장.**

- **무엇이 고장났는가**(§1~§3 사실)
- 🔴 **사용자에게 지금 무엇이 보이고 있는가** — 🔑 **`lens_cuts`가 8일 전 값이면 7렌즈 판정이 8일 전 컷으로 나온다.** 🔴 **그것이 실제로 어떤 영향인지**(컷이 얼마나 움직였을지)를 **추정하지 말고**, *"영향 크기 미측정"*으로 적는다.
- **원인 확정 여부** — 확정 / 가설 / 미상
- 🔴 **고치려면 무엇이 필요한가** · **되돌릴 수 있는가**
- 🔴 **권고안 하나** + 근거·대가·불리한 사실·**미룰 때의 비용**
- 🔑 **892가 지적하고 894가 막은 것을 다시 적는다** — *"`retryBudgetHit`이 `capGateDecision` 인자에 없다"*(892). **894가 "게이트 변경은 7렌즈 판정을 바꾸므로 범위 밖"으로 막았다.** 🔴 **그 판단이 지금도 유효한지 적는다** — 게이트가 실제로 컷을 막고 있다면 성격이 다르다.

## §5 — 문서 · 검증 · 커밋

- `docs/DECISION_912_LIVE.md` 신설
- `docs/STATE.md` — 🔴 **"▶ 다음" 최상단에 이 건 기록**(라이브 이상). 🔴 142줄 상한
- `docs/REVDCF_SPEC.md` §11에 §1 표 · `docs/CHANGELOG.md`
- 🔴 **`docs/LENS_COMPLETION_STANDARD.md`는 건드리지 말 것**(7렌즈 완성 기록은 이 STEP의 대상이 아니다)

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/ vercel.json   # 🔴 출력 없어야 함
git status --porcelain                                                                # 🔴 ?? 0건
```

🔴 **커밋 메시지는 §2 원인 확정 여부에 맞게 실행 측이 고쳐 쓴다** — 🔴 **원인을 확정 못 했으면 확정한 것처럼 쓰지 말 것**(894·908·909·910 교훈).

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 912: diagnose why the lens cutoffs stopped moving eight days ago, without touching them

- the value writes in that pipeline are current while the cutoff table has not changed since the
  twenty-eighth, which points at the gate that decides whether cutoffs get re-derived rather than
  at the fetch that fills them
- two Korean jobs also missed today's window, and whether that is new or recurring is read from
  the history of the tables they write
- nothing is repaired here: these lenses go to real users, and changing a gate changes what those
  users are told, so what is wrong is written down and the decision to fix is left with its cost
- the logs that would confirm the cause expire after an hour on this plan, so the times to look
  are recorded instead of guessed at"
git push && git push origin main:revdcf-preview
```

## §6 — 보고 후 멈춘다

```
§1 §1 표 재확인 — 바뀐 값이 있으면 그것
§2 capGateDecision 산식·임계값 · cutGateOk=false면 무엇이 안 일어나는가
   🔴 freshCoverage 최근값 확인 가능 여부(불가면 다음 실행 시각 명시)
   DB 역산 가능 여부 · 🔴 07-28 전후에 무슨 일이 있었는가
   🔴 원인 = 확정인가 가설인가 미상인가
§3 KR 크론 — 08-04 이전 연속성 · cron_heartbeats 기록 유무 · 🔴 추정 안 했는지
§4 DECISION_912 — 권고안 1개 + 근거·대가·불리한사실·미룰때비용
   🔴 "사용자 영향 크기 미측정" 명시 · 🔴 894의 게이트 금지 판단이 지금도 유효한지
무변경: 코드 diff 0 · vercel.json·크론 손 안 댐 · DB 쓰기 0
       DoD 판정 칸 전부 불변 · 안건 2·4 대기 불변 · REVDCF_ENABLED Production OFF
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **고치지 말 것. 게이트를 바꾸지 말 것. 크론을 돌리지 말 것. 원인을 추정으로 확정하지 말 것. 다음 STEP을 제안하지 말 것.**
