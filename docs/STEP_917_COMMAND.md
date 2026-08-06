# STEP 917 — 🟢 **A안 ①단계 (장은태 승인 2026-08-06)**: 계측만 넣는다 · 값 불변

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_917_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `1ea93e9`(STEP 916 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `REVDCF_ENABLED` Production **OFF** · `revdcf_results` 604×5 · `us_market_cap` 5,892 · `lens_cuts` 10행

## 🟢 승인 범위 (912~916과 다르다 — 처음으로 `lib/` 수정을 연다)

> **장은태 승인**: *"A안 ①단계만 승인"* — **계측 로깅만.** 결과를 보고 ②단계(증액)는 **다시 판정**한다.

🔴 **`lib/lensPrecompute.ts` 수정을 계측 목적에 한해 허용한다.** 🔴 **그 외 모든 금지선은 그대로다**:
`RETRY_MAX`·`RETRY_MS`·게이트 산식·임계값(97%/95%)·`maxDuration`·`vercel.json`·`.github/workflows/**`·`data/us_symbols.json` **전부 불변** · **크론 수동 실행 금지** · **Cowork/Claude Code의 DB 직접 쓰기 금지** · `docs/PROD_ACCESS_*.md` 편집 금지 · `docs/LENS_COMPLETION_STANDARD.md` 건드리지 말 것 · `REVDCF_ENABLED` Production **OFF 유지**.

🔑 **이 STEP의 성공 기준은 "값이 하나도 안 바뀌는 것"이다.** 🔴 **계측이 판정을 바꾸면 실패다.**
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 🔴 먼저: `console.log`만 붙이면 또 못 본다

894가 `retryBudgetHit`을 **이미 `console.log`에 붙였다.** 그런데 8 STEP 동안 그 값을 **한 번도 못 봤다** — 🔴 **Vercel Hobby 로그 보존이 1시간**이기 때문이다(911 확정). MCP 채널은 **403**(915 확정), 브라우저는 실행 시각에 사람이 붙어 있어야 한다.

🔑 **같은 방법을 또 쓰면 같은 결과가 나온다.** 🔴 **그래서 이 STEP의 첫 일은 "어디에 남길 것인가"다.**

### 채널 조사 (🔴 코드·스키마를 열어서 · 추정 금지)

1. **`cron_heartbeats` 테이블을 연다** — 911이 `email-brief`가 쓰는 것을 확인했다. 🔴 **스키마(컬럼·타입·제약)와 기존 쓰기 코드를 직접 읽는다.** 🔑 **계측값을 담을 자리가 이미 있는가**(JSON 컬럼·payload 컬럼 등).
2. **Sentry 사용처를 연다** — `:468`이 `captureMessage(..., "error")`를 쓰고 있다. 🔴 **`level: "info"`로 하루 1회 남기는 것이 가능한지**, 그리고 894가 *"매일 발화해서 안 됨"*으로 막은 것이 **경고**였는지 **모든 레벨**이었는지 원문을 확인한다.

### 🔴 채널 선택 사다리 (위에서부터)

1. **`cron_heartbeats`에 기록** — 🔴 **스키마 변경 없이 가능하면 이것.** 🔑 **보존이 길고, KR 크론 미실행 관측 수단도 함께 생긴다**(913·914가 *"관측 수단 없음"*으로 남긴 항목).
2. **Sentry `level: "info"`** — 1번이 스키마 변경을 요구하면 이것.
3. **`console.log`만** — 🔴 **위 둘 다 불가할 때만.** 🔴 **이 경우 "①단계가 #67을 해소하지 못한다"고 명시**하고, 배포 직후 1시간 내 관측이 필요함을 §5에 시각과 함께 적는다.

🔴 **스키마 변경(컬럼 추가·새 테이블)이 필요하면 이 STEP에서 하지 말고 보고한다.** 🔑 **스키마 변경은 별개 승인이다.**

## §1 — 🔴 무엇을 잴 것인가

🔑 **②단계(증액폭 계산)에 필요한 값만.** 🔴 **호기심으로 늘리지 말 것 — 계측도 시간을 쓴다.**

1. **`retryAll.length`** — 🔑 **오늘 실제로 몇 개가 대기했는가. `#67`의 답이고, 916이 *"유일 원인 확정을 막는 핵심 공백"*으로 남긴 그 값이다.**
2. **`retrySet.length`** — 실제 시도한 수(절단 후).
3. 🔴 **`retryBudgetHit`을 분해** — `countHit`(= `retryAll.length > RETRY_MAX`)과 `timeHit`을 **따로** 남긴다. 🔑 **892가 지적하고 894가 막은 자리다.** 🔴 **게이트 산식은 손대지 않는다 — `:157`의 OR 결합 값은 그대로 두고, 두 항을 각각 추가로 기록만 한다.** 🔴 **`retryBudgetHit`을 쓰는 곳의 동작은 불변이어야 한다.**
4. **`freshSet.size` · `freshCoverage`** — 894가 붙인 것. 🔴 **중복이면 중복이라고 적고 새 채널로 옮긴다.**
5. **`coverageOk` · `compositionOk` · `compRatio` · `cutGateOk`** — `:460`의 네 값.
6. 🔴 **단계별 elapsed** — 916이 *"코드에 계측 자체가 없어 224s/141s의 내역을 못 나눈다"*고 한 그 분해. 🔴 **어떤 단계로 나눌지는 코드를 열어 실제 경계에 맞춘다**(Cowork이 이름을 지어 주지 않는다). 🔑 **300초 중 남는 여유가 어디에 있는지가 ②단계 증액폭을 정한다.**
7. **전체 elapsed** · **US/KR 구분**.

## §2 — 🔴 구현 (최소 diff · 안전장치)

1. 🔴 **계산에 쓰이는 값은 하나도 바꾸지 않는다.** 추가되는 줄은 **전부 계측**이어야 한다.
2. 🔴 **계측 실패가 파이프라인을 죽이면 안 된다** — 기록 호출을 `try/catch`로 감싸고, 실패해도 렌즈 계산이 계속되게 한다. 🔑 **관측을 넣다가 라이브를 세우면 최악이다.**
3. 🔴 **계측 자체의 시간 비용을 최소화** — 루프 안에서 매 건 기록하지 말 것. 🔑 **집계해서 끝에 한 번.**
4. 🔴 **`git diff`를 육안으로 읽고**, 추가된 줄이 전부 로깅/계측인지 확인한다. 🔴 **하나라도 계산에 관여하면 되돌린다.**
5. 🔴 **KR 경로에도 같은 계측을 넣는다** — 🔑 **KR 크론 미실행이 아직 관측 수단 없는 별건이다.** 🔴 **KR 게이트 임계(95%)·산식은 불변.**

## §3 — 🔴 판정 불변 검증 (이 STEP의 성공 기준)

```bash
npx tsc --noEmit && npm run test          # 🔴 182/182 유지
git diff HEAD -- lib/lensPrecompute.ts    # 🔴 육안 확인 — 추가분이 전부 계측인가
git diff --stat HEAD -- app/ components/ messages/ data/ .github/ vercel.json   # 🔴 출력 없어야 함
git status --porcelain                     # 🔴 ?? 0건
```

🔴 **`vercel.json`에 diff가 나오면 `maxDuration`을 건드린 것이다 — 되돌리고 보고한다.**
🔴 **`lib/` 중 `lensPrecompute.ts` 외 파일에 diff가 나오면 중단하고 보고한다.**

**배포 전 DB 스냅샷**(🔴 읽기만): `lens_cuts` 10행의 값 · `lens_scores` 최신 `as_of`와 행 수 · `us_market_cap` 행 수. 🔑 **다음 크론 이후 비교할 기준선이다.** 🔴 **`docs/probe_917_baseline.json`으로 저장**(#78).

## §4 — 판정서 · 문서

- `docs/DECISION_912_LIVE.md` — 🔴 **①단계 승인·적용 기록**(승인자·일자·범위). 🔴 **②단계는 "미판정"으로 명시** · **A·B·C·D 병기 유지**.
- 🔴 **`#67` 상태 갱신** — §0에서 고른 채널이 1·2번이면 *"①단계로 구조적 해소 예정 · 값은 다음 실행 후"*, 3번이면 *"미해소"*로. 🔴 **아직 소진 처리하지 말 것 — 값을 못 얻었다.**
- `docs/REVDCF_SPEC.md` §11 · `docs/STATE.md`(🔴 142줄 상한 · 🔴 **`lib/lensPrecompute.ts` 금지선이 ①단계에 한해 열렸다는 사실을 기록**) · `docs/CHANGELOG.md`
- 🔴 **`docs/LENS_DEV_PLAYBOOK.md` 신규**:
  > 🔑 **보존기간보다 짧게 사는 로그는 관측 수단이 아니다.** 894가 붙인 `console.log`는 **8 STEP 동안 한 번도 읽히지 못했다** — Hobby 보존 1시간, MCP 403, 브라우저는 사람이 그 시각에 붙어 있어야. 🔴 **계측을 넣을 때는 "어디에 남길 것인가"를 "무엇을 잴 것인가"보다 먼저 정한다.**

## §5 — 🔴 배포 후 관측 시점 (다음 STEP의 입력)

🔴 **이 STEP은 배포까지만 한다. 관측은 다음 STEP이다.**

- **US** `lens-scores` = **21:30 UTC**(지터 ±59분 → 20:31~22:29). 최근 실측은 22:18·22:25 부근.
- **KR** `kr-lens-scores` = **10:30 UTC** · `kr-perf` = **10:00 UTC**.
- 🔴 **§0에서 3번(console.log)을 골랐다면 그 창 안에 사람이 붙어야 한다**는 것을 명시한다.
- 🔴 **다음 실행 후에 볼 것을 목록으로 남긴다** — §1의 7개 항목 + §3 기준선 대비 **판정이 안 바뀌었는지**.

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
```

🔴 **커밋 메시지는 §0에서 고른 채널과 §1에서 실제로 넣은 항목에 맞게 실행 측이 고쳐 쓴다.** 🔴 **초안이 결과를 전제하지 않았는지 확인할 것**(913 대폭 재작성 · 914 프로브 버그 2건 · 916 유니버스 가설 기각 — 초안은 매번 틀렸다).

```bash
git commit -m "STEP 917: measure the run before changing what it is allowed to spend

- the count that would settle the cause has been logged since an earlier step and never once read,
  because these logs live an hour and the window belongs to whoever happens to be awake, so where
  the numbers are written is decided before which numbers are written
- the budget flag folds a count check and a time check into one boolean; both halves are recorded
  separately without touching the flag itself or anything that reads it
- the route reports its total but never its parts, so the boundaries already in the code are timed,
  which is what a safe increase would have to be calculated from
- nothing about what the pipeline computes moves here: the thresholds, the caps, the ceiling and
  the gate are all left exactly as they were, and the stored cutoffs are snapshotted first so the
  next run can be checked against them"
git push && git push origin main:revdcf-preview
```

## §6 — 보고 후 멈춘다

```
§0 🔴 채널 조사 — cron_heartbeats 스키마·기존 쓰기 코드 / Sentry level 확인
   🔴 사다리 몇 번을 골랐는가와 이유 · 🔴 스키마 변경 필요하면 "필요"로 보고(하지 말 것)
   🔴 894가 막은 것이 경고였는지 모든 레벨이었는지 원문
§1 실제로 넣은 계측 항목 목록 · 🔴 단계 경계를 어떻게 나눴는가(코드 기준)
   🔴 retryBudgetHit 분해 — 게이트 동작 불변 확인
§2 🔴 git diff 육안 확인 결과 — 추가분이 전부 계측인가
   try/catch 감쌌는가 · 루프 밖 집계인가 · KR 경로에도 넣었는가
§3 🔴 tsc 0 · test 182/182 · lensPrecompute.ts 외 lib/ diff 0 · vercel.json diff 0
   🔴 기준선 스냅샷(probe_917_baseline.json) 내용
§4 #67 상태 · 🔴 ②단계 미판정 명시 · A·B·C·D 병기 유지
§5 🔴 관측 시각(US 21:30 / KR 10:00·10:30 UTC) · 다음 STEP이 볼 목록
무변경: RETRY_MAX·RETRY_MS·게이트 산식·임계값(97/95)·maxDuration·vercel.json·크론 불변
       Cowork/Claude Code의 DB 직접 쓰기 0 · lens_cuts 10행 불변
       LENS_COMPLETION_STANDARD.md 불변 · DoD 판정 칸 전부 불변
       안건 2·4 대기 불변 · REVDCF_ENABLED Production OFF
push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **임계값·`RETRY_MAX`·`RETRY_MS`·`maxDuration`을 바꾸지 말 것. 게이트 산식을 바꾸지 말 것. 스키마를 바꾸지 말 것. 크론을 돌리지 말 것. 컷을 DB에 쓰지 말 것. ②단계를 시작하지 말 것. 다음 STEP을 제안하지 말 것.**
