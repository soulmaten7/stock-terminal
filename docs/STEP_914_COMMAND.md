# STEP 914 — US 컷 6일 정지: 날짜 대조 · 임계 도달 가능성 · 🔴 **영향 크기 실측** (진단만 · 수리 금지)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_914_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `26cbfcb`(STEP 913 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `REVDCF_ENABLED` Production **OFF** · `revdcf_results` 604×4 · `us_market_cap` 5,888

🔴 **불변 금지선**: DB **쓰기 금지**(읽기만) · **크론 수동 실행 금지** · `vercel.json`·`.github/workflows/**`·`data/us_symbols.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지 · `docs/LENS_COMPLETION_STANDARD.md` 건드리지 말 것.
🔴 **이 STEP도 진단만 한다. 코드 수정 0. 게이트 변경 금지. 임계값 손대지 말 것.**
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 🔴 913이 뒤집은 것 · 그리고 **오염 범위**

913 실측: `lens_cuts.updated_at`은 `default=now()`뿐이고 **트리거 0건**, upsert payload(`:394`)에도 없다 → 🔑 **최초 INSERT 시각을 영구 보존하는 열**이었다. 진짜 신선도 열 `as_of`로 다시 재니:

| | 912가 적은 값 | 🔴 913 실측(`as_of`) |
|---|---|---|
| `lens_cuts` **US** | 07-28 04:33 | **07-30 (6일 전)** |
| `lens_cuts` **KR** | 07-28 04:33 | **08-04 (1일 전 · 정상)** |

🔴 **KR은 문제가 없었다.** 🔴 **"US·KR 같은 분" 단서도, "8일 8시간 정체"도, "KR 게이트 모순"도 전부 허상이었다** — 잘못된 열을 읽은 결과다.

### 🔴 그런데 게이트 배제가 함께 풀렸다

912는 *"취득게이트(STEP 833)는 **07-30 커밋** → 정지(07-28)보다 이틀 늦어 최초원인일 수 없음"*으로 게이트를 **배제**했다.
🔑 **진짜 정지일은 07-30이다. 게이트 커밋일과 같은 날이다.** 🔴 **배제 근거가 사라졌다 — 게이트가 다시 최유력이다.**

### 🔴 이 STEP이 먼저 할 일: **같은 함정에 다른 행도 걸렸는지**

911·912의 §1 표는 크론 9개를 한 표로 읽었다. 🔴 **그 중 `lens_cuts`가 잘못된 열이었다면 다른 행도 그럴 수 있다.**

1. 🔴 **표의 각 테이블을 어느 열로 읽었는지 전수 재확인**한다 — `as_of`인가 `updated_at`인가 다른 열인가.
2. 🔴 **특히 911이 "오늘 미실행"으로 적은 `kr-perf`(`kr_stock_snapshot`)·`kr-lens-scores`(`lens_scores` KR)를 진짜 신선도 열로 다시 잰다.** 🔑 **그것도 허상이면 "KR 크론 2개 미실행"은 없던 일이 된다.**
3. 🔴 **각 테이블의 `updated_at`류 열에 트리거가 있는지 `information_schema.triggers`로 확인**한다(913이 `lens_cuts`에 쓴 방법 그대로).
4. 🔴 **표를 정정하고, 무엇이 실제 이상이고 무엇이 허상이었는지 가른다.**

## §1 — 🔴 07-30 대조: 컷 정지와 게이트 배포

1. **US `lens_cuts.as_of`의 정확한 값**(날짜만이 아니라 시각까지)을 조회한다.
2. **취득게이트(STEP 833) 커밋의 정확한 타임스탬프**와 **그 커밋이 프로덕션에 배포된 시각**을 본다. 🔴 **커밋 시각 ≠ 배포 시각**이다 — 구분해 적고, 배포 시각을 모르면 모른다고 적는다.
3. 🔴 **순서를 판정한다** — 마지막 컷 성공 write가 게이트 배포 **전**인가 **후**인가. 🔑 **전이면 "게이트 도입 직후부터 한 번도 못 썼다"가 되고, 이건 거의 확정에 가깝다.**
4. 🔴 **07-28 04:33은 이제 미스터리가 아니다** — 마이그레이션 `20260728_lens_cuts.sql`로 테이블이 생기고 컷이 **처음 쓰인** 시각이다. 🔴 **913의 "ad-hoc 실행 여부 판단 불가"를 이 해석으로 닫고, `#`항목으로 남아 있으면 소진 처리**한다.

## §2 — 🔴 97%는 도달 가능한 임계인가

912 역산: US `freshCoverage` ≈ **5,401/5,966 = 90.5%** · 게이트 임계 **97%**.

🔑 **게이트가 고장난 게 아니라 설계대로 동작 중일 수 있다. 문제는 시스템이 그 임계를 낼 수 있느냐다.**

1. 🔴 **STEP 833이 97%(US)·95%(KR)를 고른 근거**를 문서에서 찾는다. 🔑 **"당시 실측이 98%였으니 97%"라면 그 뒤 취득이 회귀한 것이고, 임의로 정한 값이면 임계가 문제다.** 🔴 **근거가 문서에 없으면 "없음"으로 적는다. 추정 금지.**
2. 🔴 **결손 565개의 성격**을 본다(읽기만) — `us_market_cap`에서 최신 `as_of`가 아닌 행들의 **`as_of` 분포**. 🔑 **날짜가 제각각이면 매일 다른 종목이 실패하는 것이고, 한 날짜에 뭉쳐 있으면 같은 종목들이 계속 굶는 것이다.** 🔴 **이 구분이 §4 권고를 가른다.**
3. 🔴 **`RETRY_MAX=400` 절단(891~893 발견)과 결손 규모의 관계** — 🔴 **인과를 단정하지 말 것**(플레이북 #10 · 890 교훈: 연결 안 된 전파 사슬을 연결됐다고 쓴 적 있다). 🔑 **잴 수 있는 것만 잰다**: 결손 종목 집합이 **날마다 같은가**를 `as_of` 분포로 답할 수 있는지, 없으면 없다고 적는다.
4. **KR은 왜 통과하는가** — KR 유니버스 크기·취득 경로가 US와 무엇이 다른가. 🔑 **KR이 100%를 내는데 US가 90.5%면 US 취득 쪽에 무언가 있다.**

## §3 — 🔴 영향 크기 실측 (미측정으로 남기지 말 것)

911·912·913이 세 번 연속 *"사용자 영향 크기 미측정"*으로 남겼다. 🔴 **이제 잰다.** 🔑 **6일 된 컷이 실제로 얼마나 틀렸는지가 수리 긴급도를 정한다.**

**방법**(🔴 **읽기만 · DB 쓰기 0 · 크론 실행 0**):

1. 현재 `lens_scores`(US)로 **오늘 기준 p30/p70 컷이 얼마가 나올지 계산**한다 — 🔴 **`lens_cuts`에 쓰지 말고 계산만.**
2. 저장된 **07-30 컷과 비교** — 렌즈 5개 각각 p30·p70이 얼마나 움직였는가.
3. 🔴 **판정이 바뀌는 종목 수** — 오늘 컷으로 재판정하면 **몇 개 종목의 렌즈 판정이 달라지는가.** 🔑 **이것이 "사용자가 지금 잘못 보고 있는 양"이다.**
4. 🔴 **0이면 0이라고 적는다.** 🔑 **6일 동안 컷이 거의 안 움직였다면 긴급도가 낮고, 많이 움직였다면 높다. 둘 다 결정에 필요한 답이다.**
5. 프로브 `scripts/probe_914_cut_drift.ts` + `docs/probe_914_cut_drift.json` — 🔴 **스크립트를 같은 커밋에**(#78).

## §4 — 판정서 · 🔴 권고안 (미루지 말 것)

`docs/DECISION_912_LIVE.md` 갱신(🔴 **본문 지우지 말고 추가 · 정정은 취소선 보존**).

- 🔴 **US 원인 = 확정인가 가설인가** — §1 순서 판정과 §2 임계 분석으로.
- 🔴 **KR = 문제 없음** 확정(913) · §0 재확인 결과로 **"KR 크론 2개 미실행"도 유지/철회** 판정.
- 🔴 **영향 크기**(§3) — 숫자로. **더 이상 "미측정"으로 남기지 말 것.**
- 🔴 **권고안 하나** + 근거·대가·**불리한 사실**·**미룰 때의 비용**. 🔑 **재료가 다 모였으면 판단을 되돌려 보내지 않는다**(플레이북 #79).
  선택지는 최소 이 셋을 **각각의 대가와 함께** 적는다 — 🔴 **고르되 나머지를 지우지 말 것**:
  - **(A) 취득을 고친다**(예: 재시도 예산) → 🔴 **크론 실행시간·타임아웃 리스크를 적는다.**
  - **(B) 게이트 임계를 낮춘다** → 🔴 **833이 게이트를 만든 이유를 훼손한다. §2-1 근거가 없으면 이 안의 위험도 평가할 수 없다고 적는다.**
  - **(C) 그대로 둔다** → 🔑 **컷이 영구 동결이면 "컷 기능이 없는 것"과 같다.** 🔴 **§3 숫자로 이 대가를 적는다.**
- 🔴 **894의 게이트 금지 판단**(892 지적 → 894가 "7렌즈 판정을 바꾸므로 범위 밖"으로 차단) — 🔴 **지금도 유효한지 다시 적는다.** 🔑 **게이트가 실제로 컷을 막고 있다면 성격이 다르다.**
- 🔴 **로그 확인의 지위** — §1·§2가 원인을 확정하면 오늘 21:30 UTC 로그 확인은 **불필요**해질 수 있다. 🔴 **유지인지 철회인지 적는다**(`#67`은 별개로 미소진 유지).

## §5 — 플레이북 · 문서 · 검증 · 커밋

🔴 **`docs/LENS_DEV_PLAYBOOK.md` 신규 2건**:

> 🔑 **타임스탬프 열로 추론하기 전에 그 열이 무엇을 담는지 확인한다.** `updated_at`이 `default=now()`이고 **트리거가 없고 upsert payload에 없으면**, 그것은 *"마지막 갱신"*이 아니라 *"최초 생성"*이다. **이력**: 911·912가 이 열로 *"8일 정체"*·*"US·KR 동일 분"*·*"KR 게이트 모순"* 세 결론을 냈고 913에서 **전부 허상**으로 판명됐다. 🔴 **`information_schema.triggers`와 upsert payload를 함께 본다.**

> 🔑 **틀린 관측으로 배제한 원인은 관측이 정정되면 함께 되살린다.** 912는 *"게이트 커밋(07-30)이 정지(07-28)보다 늦다"*는 이유로 게이트를 배제했는데, **정지일이 07-30으로 정정되자 배제 근거가 사라졌다.** 🔴 **관측 정정 시 그 관측에 기대 내린 판단을 전수 재검토한다.**

- `docs/DECISION_912_LIVE.md` 갱신 · `docs/REVDCF_SPEC.md` §11 실측 · `docs/STATE.md`(🔴 142줄 상한) · `docs/CHANGELOG.md`

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/ vercel.json   # 🔴 출력 없어야 함
git status --porcelain                                                                # 🔴 ?? 0건
```

🔴 **커밋 메시지는 §1~§4 결과에 맞게 실행 측이 고쳐 쓴다.** 🔴 **초안이 결과를 전제하지 않았는지 확인할 것** — 913에서 초안이 명령서 §0 가설을 전제했다가 **정반대 결과**가 나와 대폭 재작성했다.

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 914: recheck every row read from the frozen column, then measure what six days of stale cutoffs cost

- one table was read from a column that never changes after insert, and three conclusions were
  built on it; the same column is checked across the rest of the table before anything else
- correcting the date also revives the cause that was ruled out for being two days too late: the
  gate landed the same day the cutoffs actually stopped
- whether the threshold it enforces can be met at all is the question, so the missing rows are
  read for whether the same names go missing every day or different ones do
- and the drift is finally measured rather than deferred a fourth time: today's cutoffs are
  computed without writing them, and compared against the stored ones, so the cost of leaving
  this alone is a number instead of an adjective"
git push && git push origin main:revdcf-preview
```

## §6 — 보고 후 멈춘다

```
§0 911·912 표 전수 재확인 — 어느 열로 읽었는가 · 트리거 유무
   🔴 kr-perf·kr-lens-scores "오늘 미실행"이 실제인가 허상인가
   🔴 무엇이 실제 이상이고 무엇이 허상이었는가
§1 US 컷 정지 정확 시각 · 게이트 커밋/배포 시각 · 🔴 순서 판정
   🔴 07-28 04:33 = 테이블 최초 생성으로 닫았는지
§2 833의 97%/95% 근거(없으면 "없음") · 결손 565의 as_of 분포
   🔴 같은 종목이 계속 굶는가 매일 다른가 · 🔴 RETRY_MAX 인과 단정 안 했는지
   KR이 통과하는 이유
§3 🔴 컷 드리프트 실측 — 렌즈 5개 p30/p70 이동폭 · 🔴 판정 바뀌는 종목 수(0이면 0)
§4 🔴 US 원인 확정/가설 · KR 문제없음 확정 · 🔴 권고안 1개 + 대가·불리한사실·미룰때비용
   🔴 선택지 A·B·C 각각의 대가 · 894 판단 재평가 · 로그 확인 유지/철회
§5 플레이북 2건
무변경: 코드 diff 0 · vercel.json·크론 손 안 댐 · DB 쓰기 0 · 임계값 불변
       LENS_COMPLETION_STANDARD.md 불변 · DoD 판정 칸 전부 불변 · 안건 2·4 대기 불변
       REVDCF_ENABLED Production OFF
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **고치지 말 것. 게이트·임계값을 바꾸지 말 것. 컷을 DB에 쓰지 말 것. 크론을 돌리지 말 것. 다음 STEP을 제안하지 말 것.**
