# STEP 894 — `retryBudgetHit` 관측 연결 · 상호 주석 완성 (🔴 7렌즈 라이브 파이프라인 · 최소 변경)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_894_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `fb2fafb`(STEP 893 · `main`·`revdcf-preview` 동일) · tsc 0 · test **158/158** · `REVDCF_ENABLED` **OFF** · `revdcf_results` 604×3 · `us_market_cap` 5,887

🔴 **불변 금지선**: `REVDCF_ENABLED` **OFF 유지** · `revdcf_results`·`us_market_cap`·`lens_scores`·`lens_cuts` **쓰기 금지** · 🔴 **크론 수동 실행 금지**(7렌즈 크론 포함) · `data/us_symbols.json`·`.github/workflows/**` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 🔴 성격: 이 파일은 라이브다

`lib/lensPrecompute.ts`는 **7렌즈 파이프라인**이다. 역DCF와 달리 **플래그 뒤에 있지 않고, 매일 `lens_scores`·`lens_cuts`를 써서 실제 사용자에게 노출된다.**

- 🔴 **계산·게이트 로직 무변경.** 바뀌는 것은 **관측(로그·Sentry)**과 **주석**뿐이다.
- 🔴 **`capGateDecision`의 인자·판정 로직을 바꾸지 말 것.** 892가 *"`retryBudgetHit`이 `capGateDecision` 인자에도 없다"*고 지적했지만, **게이트에 새 신호를 넣는 것은 7렌즈 컷 유도 판정을 바꾸는 일**이다. 이 STEP의 범위가 아니다. 🔴 **필요하다는 의견이 있으면 보고에만 적는다.**
- 🔴 **`RETRY_MAX`·`RETRY_MS` 값을 바꾸지 말 것.** 그건 892가 남긴 A안이고, **A는 이 관측이 붙은 뒤에야 평가할 수 있다.**

### 🔴 Cowork 사전 확인 (다시 하지 말고 이어서)

892의 *"계산되고 버려짐"*이 코드에서 확인된다:

```
lib/lensPrecompute.ts:151  console.log(`[topByMarketCap] batchOk … 재시도복구 ${recovered}/${retrySet.length}
                                        · 폴백 ${fallbackUsed} · fresh커버 …`)   🔴 retryBudgetHit 없음
                     :153  const diag: CapDiag = { …, retryBudgetHit: retryAll.length > RETRY_MAX || timeHit, … }
                     :467  console.log(`[computeLensScores US] fresh커버 … · 폴백 ${diag.fallbackUsed}
                                        · 재시도복구 ${diag.recovered}`)          🔴 retryBudgetHit 없음
                     :468  Sentry.captureMessage(…cutGateOk 실패 시…)             🔴 retryBudgetHit 무관
                     :150  Sentry.captureMessage(…failedChunks > 0 시…)           🔴 retryBudgetHit 무관
```

🔑 **다른 diag 필드는 전부 로그에 실리는데 `retryBudgetHit`만 빠져 있다.** 의도적 제외인지 누락인지는 알 수 없다 — 🔴 **그 판단을 하지 말고, 관측 가능하게만 만든다.**

## §1 — 관측 연결

### 1-1. 기존 로그 두 줄에 추가

`:151`과 `:467`의 `console.log`에 **`retryBudgetHit`을 붙인다.** 🔴 **줄을 새로 만들지 말고 기존 줄에 필드만 추가**한다(로그 볼륨 증가 0).
🔴 **`retryAttempted`도 함께 보이게** 한다 — `retryBudgetHit`이 true일 때 *"몇 개가 시도됐고 몇 개가 잘렸는지"*를 알아야 A안을 평가할 수 있다. `retryAll.length`가 로그에 없으면 **잘린 양을 모른다.**

### 1-2. 조건부 경고 1건

`retryBudgetHit === true`일 때 **`Sentry.captureMessage`를 남긴다.**

- 🔴 **심각도는 `warning`**. `error`로 올리지 말 것 — 892 실측상 결과 영향이 작다(대조군이 오히려 더 움직였다).
- 🔴 **메시지에 숫자를 담는다**: 시도 대상 총수 · `RETRY_MAX` · `timeHit` 여부. 🔑 **"잘렸다"만으로는 A안을 평가할 수 없다. 얼마나 잘렸는지가 필요하다.**
- 🔴 **알림 노이즈를 고려한다.** 매일 걸리면 무시하게 된다. 🔴 **매일 걸릴 가능성이 있는지 판단해 보고**하고, 높다면 **경고를 안 만들고 로그만 남기는 쪽**을 택한다(그 경우 이유를 적는다).

### 1-3. 🔴 하지 말 것

- `capGateDecision` 시그니처·로직 변경
- `RETRY_MAX`·`RETRY_MS`·청크 크기 변경
- `us_market_cap` 쓰기 경로 변경
- 폴백(Stage 3) 변경

## §2 — 상호 주석 완성 (893이 못 한 것)

893 보고:
> *"상호 주석 원칙(886 정본)을 완전히 지키지 못했다 — `route.ts`는 `lensPrecompute.ts`를 가리키지만, 반대 방향(그 파일이 `route.ts`를 가리키는 주석)은 그 파일 수정 금지 지시와 정면 충돌해 만들 수 없었다. 두 지시가 부딪히는 지점이라 한쪽(수정 금지)을 우선했다."*

**이번 STEP은 그 파일을 여니 마저 단다.**

- `lensPrecompute.ts`의 **7일 TTL 상수 자리**(`:141~142` 근방)에 주석을 단다: *"이 값은 `app/api/cron/revdcf/route.ts`의 `MCAP_TTL_DAYS`와 같아야 한다(893)."*
- 🔴 **주석만이다. 상수를 공유 모듈로 빼지 말 것** — 그건 리팩터이고 7렌즈 파이프라인 구조를 건드린다.
- 🔴 893이 `route.ts`에 단 주석과 **양방향이 맞는지** 확인한다.

## §3 — 검증 (🔴 라이브 파이프라인이라 엄격히)

```bash
npx tsc --noEmit && npm run test
git diff HEAD -- lib/lensPrecompute.ts        # 🔴 육안 확인: console.log·Sentry·주석 외 변경 0
git diff --stat HEAD -- lib/revdcf/ app/ components/ messages/ data/ .github/   # 🔴 출력 없어야 함
git status --porcelain                        # 🔴 ?? 0건
```

🔴 **추가 확인**:
- `capGateDecision` 호출부(`:460`·`:508`)의 **인자가 그대로인지**
- `us_market_cap` upsert 경로(`:131~136`)가 **그대로인지**
- 🔴 **7렌즈 관련 테스트가 전부 그대로 통과하는지**(158/158 유지)

🔴 **크론을 돌려 확인하고 싶어도 돌리지 말 것.** 다음 정규 실행 로그에서 확인된다. **이 STEP은 관측 장치를 다는 것이지 관측 결과를 얻는 것이 아니다.**

## §4 — 문서 · 커밋

- `docs/REVDCF_SPEC.md` §10 — **`retryBudgetHit` 미연결 해소**(893이 894 대상으로 명시한 것). 🔴 **A안 평가는 여전히 미측정**이라고 함께 적는다 — 관측 장치가 붙었을 뿐 아직 관측한 것이 없다.
- `docs/LENS_DEV_PLAYBOOK.md` — 🔴 **신규**: *"진단값을 계산해놓고 어디에도 싣지 않으면 없는 것과 같다. 계산한 진단은 로그·알림 중 최소 한 곳에 도달시킨다."* (892 발견 · 894 해소)
- `docs/STATE.md` 🔴 142줄 상한 · `docs/CHANGELOG.md`
- 🔴 **893이 남긴 "스킵 사유 목록 불완전"은 895 대상**이다. 이 STEP에서 손대지 말 것.

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 894: make the retry cap visible, since it was being computed and thrown away

- every other diagnostic from the market cap fetch reaches a log line; the one that says the
  retry budget ran out reached nothing, so nobody could tell whether it had ever fired
- it now rides on the two log lines that already exist, with the number attempted alongside it,
  because knowing that something was truncated is useless without knowing how much
- a warning is raised only when it fires, at warning level rather than error, since the
  measurement behind it showed fresh companies moving as much as stale ones
- the gate that decides whether cuts get re-derived is left alone: feeding it a new signal
  would change what the seven lenses publish, which is not what this is for
- the pointer between the two places that share a seven day window now runs both ways
- this installs an instrument; it does not yet read one"
git push && git push origin main:revdcf-preview
```

## §5 — 보고 후 멈춘다

```
§1 1-1 로그 2줄 추가 내용(retryBudgetHit + retryAttempted/retryAll)
   1-2 경고를 만들었는가 로그만인가 · 🔴 매일 걸릴 가능성 판단과 근거
   1-3 하지 말 것 4종 준수 확인
§2 상호 주석 양방향 확인
§3 🔴 lensPrecompute diff 육안 — console.log·Sentry·주석 외 변경 0
   capGateDecision 인자 불변 · upsert 경로 불변 · 158/158 유지
§4 SPEC §10 해소 + 🔴 "A안은 여전히 미측정" 병기 · 플레이북 신규
무변경: lib/revdcf·app·components·messages·data·.github diff 0 · DoD 판정 칸 불변
       REVDCF_ENABLED OFF · 크론 미실행(7렌즈 포함) · lens_scores·lens_cuts·us_market_cap 쓰기 0
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **`capGateDecision`·`RETRY_MAX`·폴백을 건드리지 말 것. 크론을 돌리지 말 것. 895(스킵 사유 전수)를 여기서 하지 말 것. 다음 STEP을 제안하지 말 것.**
