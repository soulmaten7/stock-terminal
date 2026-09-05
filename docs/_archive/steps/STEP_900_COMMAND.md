# STEP 900 — DoD 8(테스트) 커버리지 정리 · 판정

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_900_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `aa95aa3`(STEP 899 · `main`·`revdcf-preview` 동일) · tsc 0 · test **174/174** · `REVDCF_ENABLED` Production **OFF** · `revdcf_results` 604×3 · `us_market_cap` 5,887

🔴 **불변 금지선**: `REVDCF_ENABLED` Production **OFF 유지** · `revdcf_results`·`us_market_cap`·`lens_scores` **쓰기 금지** · **크론 수동 실행 금지** · `data/us_symbols.json`·`.github/workflows/**`·`lib/lensPrecompute.ts` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 🔴 Cowork 자체 정정 (899가 반증한 것) · 플레이북 신규

899 §2:
> *"`RevDcfBadge.tsx`는 **856 §2부터 `lossMaking` 최우선 분기가 있었고** 유일 소비처가 이미 정확히 넘기고 있었다. **STEP §0가 '897·889에서 확인한 구조'라 인용한 출처 자체가 틀렸다**(그 두 STEP은 이 로직과 무관)."*

🔴 **Cowork이 브라우저로 본 현상(종목상세 "적용 밖" ↔ DB `value_destroying`)은 사실이었다. 틀린 것은 그 원인 설명이다.** 파일의 일부 줄만 보고 *"`lossMaking` 분기가 없다"*고 단정했고, 출처로 붙인 STEP 번호도 기억에서 나온 것이었다.

🔑 **890에서도 같은 모양이었다** — *"`us_symbols`가 매일 바뀐다"*는 관찰은 사실인데 **전파 사슬을 추정으로 이어** 틀렸다(실제로는 그 사슬이 연결돼 있지 않았다).

### 플레이북 신규

> 🔑 **관찰한 현상과 그 원인은 별개다. 현상을 봤다고 원인을 안 것이 아니다.**
> 화면·DB·로그에서 이상을 발견하면 **그것은 현상**이다. 원인을 말하려면 **해당 코드 경로를 처음부터 끝까지 열어** 확인한다. 🔴 **파일의 일부 줄만 보고 "그 분기가 없다"고 단정하지 않는다**(#82의 확장). 🔴 **출처로 STEP 번호를 인용할 때는 그 STEP을 열어 실제로 그 내용이 있는지 확인한다.**
> **이력**: 890(사슬 추정) · 899(분기 부재 단정 · 출처 오인용).

## §1 — 성격

**DoD 8(테스트)을 닫는다.** 현재 🔶, 사유는 *"`engine.test.ts` 도미노 재현. **driver/compute 경계 테스트 커버리지 미정리**."*

- 🔴 **프로덕션 코드 무변경.** `lib/**`·`app/**`·`components/**`·`messages/**` diff **0**. 바뀌는 것은 **테스트와 문서**뿐이다.
- 🔴 **테스트를 맞추려고 프로덕션 코드를 고치지 말 것.** 테스트가 실패하면 **그것이 발견이다** — 고치지 말고 **보고하고 멈춘다.**
- 🔴 **새 측정·새 판정 없음**(DoD 8 판정 제외).

## §2 — 현재 커버리지 실측 (🔴 추정 금지)

🔴 **Cowork은 이번에 아무것도 단정하지 않는다.** 아래는 **측정 항목**이지 결론이 아니다.

1. **테스트 파일 전수** — `lib/revdcf/**`·`app/api/**`에 관련된 테스트 파일과 각 건수를 표로 낸다.
2. **커버리지 도구가 있는가** — `vitest --coverage` 등이 설정돼 있는가. 🔴 **없으면 "없음"으로 적고 새로 설치하지 말 것**(도구 도입은 별도 판단).
3. 🔴 **DoD 8 정의로 채점한다**: *"참조값 유닛테스트 + **경계 케이스**(스냅샷 금지·**값 검증**)"*
   - **참조값**: 도미노 재현이 있는가 ✅/🔴
   - **경계 케이스**: 아래가 각각 테스트로 고정돼 있는가 — 🔴 **하나씩 확인**
     - `drivers.ts`의 스킵 5분기(`INSUFFICIENT_HISTORY`·`MISSING_TAG` **3종**·`NOT_APPLICABLE_SECTOR`·`MULTI_CLASS_SHARES`)
     - `route.ts`의 스킵(`NO_INDUSTRY`·`NO_MARKETCAP`·`STALE_MARKETCAP`·`NO_MARGINAL_CAPEX`·`EX`·`HTTP_*`)
     - `engine.ts`의 판정 5종(`years`·`below_one`·`over_cap`·`value_destroying`·`invalid`)
     - `compute.ts` 민감도(WACC ±1%p)·`assembleWacc`
     - `Δ매출 = 0` · 음수 재투자율 · `WACC ≤ i`(터미널 미성립)
     - 🔴 **유니버스 보존** — 모든 스킵 경로가 **행을 쓴다**
   - **스냅샷 금지**: 스냅샷 테스트가 섞여 있는가 🔴 **있으면 그 사실을 적는다**(제거는 판정 후)

## §3 — 빈 곳 채우기

§2에서 **🔴로 나온 것만** 테스트를 추가한다.

- 🔴 **이미 있는 것을 다시 만들지 말 것** — 899가 *"새로 구현이 아니라 이미 구현돼 있음을 확인"*으로 끝난 선례가 있다.
- 🔴 **값 검증으로 쓴다** — 스냅샷·`toMatchObject` 남발 금지. **기대값을 숫자로 적는다.**
- 🔴 **기대값의 출처를 주석에 남긴다**(원전 셀 좌표 / 프로브 JSON / 계산 근거). 출처 없는 기대값은 **다음 세션이 못 고친다.**
- 🔴 **테스트가 실패하면 프로덕션 코드를 고치지 말고 중단·보고.**

## §4 — 🔴 DoD 8 판정

> **③판정**: ✅ 또는 🔶 유지 — 🔴 **하나만**
> **근거**: 각 근거는 **§2 실측 또는 §3 추가분**에 걸릴 것
> **🔴 대가** · **🔴 불리한 사실** · **🔴 재검토 조건**

🔴 **반드시 다룰 것**:
1. **커버리지 도구가 없다면** 🔴 *"몇 %"*를 말할 수 없다. **항목별 유무로 판정하는 것임을 명시**한다.
2. 🔴 **7렌즈가 DoD 8을 어떤 기준으로 통과했는지 확인**하고(`docs/_archive/LENS_7_COMPLETED.md`), **다른 기준을 쓰면 그렇게 적는다.**
3. 🔴 **`REVDCF_ENABLED` OFF라 통합·E2E는 불가**하다는 한계를 불리한 사실에 적는다.

🔴 **DoD 3·7·9는 판정하지 말 것.**

## §5 — 문서 · 검증 · 커밋

- `docs/LENS_COMPLETION_STANDARD.md` — DoD 8 판정 · 🔴 **다른 항목 판정 칸 불변**
- `docs/REVDCF_SPEC.md` §10 — 스냅샷 테스트·커버리지 도구 부재 등 신규 등재
- `docs/LENS_DEV_PLAYBOOK.md` §0 신규
- `docs/STATE.md` 🔴 142줄 상한 · `docs/CHANGELOG.md`

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/   # 🔴 테스트 파일 외 출력 없어야 함
git status --porcelain                                                   # 🔴 ?? 0건
```

🔴 **위 diff에 `*.test.ts` 외의 파일이 잡히면 중단하고 보고한다.**
🔴 **커밋 메시지는 §4 판정에 맞게 실행 측이 고쳐 쓴다**(894 교훈).

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 900: check which boundaries are actually pinned by a test, and pin the ones that are not

- the completion item for tests has said the boundary coverage was never tidied up, so every
  boundary the model can hit is listed and checked one by one against what exists
- what is already covered is left alone; the last step ended by finding that a thing it was
  asked to build had been built years earlier
- expected values are written as numbers with a note saying where each came from, so a later
  session can tell a broken test from a changed one
- no production code is touched: a failing test is a finding, not something to make pass"
git push && git push origin main:revdcf-preview
```

## §6 — 보고 후 멈춘다

```
§0 플레이북 신규(현상 ≠ 원인)
§2 테스트 파일·건수 표 · 커버리지 도구 유무 · 🔴 경계 항목별 ✅/🔴 채점표
   스냅샷 테스트 유무
§3 추가한 테스트 — 항목·기대값·🔴 기대값 출처 주석
   🔴 이미 있던 것을 다시 만들지 않았는지
§4 🔴 DoD 8 판정 + 근거·대가·불리한사실·재검토조건
   🔴 커버리지 % 없이 항목별로 판정함을 명시했는가 · 7렌즈 기준과 같은가 다른가
무변경: lib/app/components/messages/data/.github diff 0(테스트 제외) · 다른 DoD 판정 칸 불변
       REVDCF_ENABLED Production OFF · 크론 미실행 · DB 쓰기 0
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **프로덕션 코드를 고치지 말 것. 테스트가 실패하면 중단·보고. DoD 3·7·9를 판정하지 말 것. 크론을 돌리지 말 것. 다음 STEP을 제안하지 말 것.**
