# STEP 915 — 480 고정 코호트의 정체 · **07-31 전환점** · A안 실행 가능성 (진단만 · 수리 금지)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_915_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `5e08a39`(STEP 914 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `REVDCF_ENABLED` Production **OFF** · `revdcf_results` 604×4 · `us_market_cap` 5,888 · `lens_cuts` 10행

🔴 **불변 금지선**: DB **쓰기 금지**(읽기만) · **크론 수동 실행 금지** · `vercel.json`·`.github/workflows/**`·`data/us_symbols.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지 · `docs/LENS_COMPLETION_STANDARD.md` 건드리지 말 것.
🔴 **이 STEP도 진단만 한다. 코드 수정 0. 게이트·임계값 불변. `RETRY_MAX` 손대지 말 것.**
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 914가 세운 것 · 이 STEP이 갈 자리

914 확정: US 원인 **거의 확정** · 영향 **111/998 = 11.12%(117건)** · 권고 **A(취득 고치기)**.
914 미측정으로 남긴 것: *"`RETRY_MAX=400`과 480개 고정실패 코호트 사이의 정확한 인과 메커니즘."*

🔑 **A안의 성패가 전부 그 한 줄에 달려 있다.** 480이 **예산 부족으로 굶는 것**이면 A안이 통하고, **원천적으로 취득 불가**(상장폐지·티커 변경·API에 없음)면 🔴 **재시도를 아무리 늘려도 영원히 안 되고 A안은 실패한다.**

## §1 — 🔴 KR 크론 재측정 (악화 중일 수 있다)

914가 *"`kr-perf`·`kr-lens-scores` 오늘 미실행 = **실제**(허상 아님)"*로 확정했다. 마지막 실행은 **08-04**였고 지금은 **08-06**이다.

1. 🔴 **두 테이블의 신선도 열을 다시 잰다**(914가 확인한 신뢰 가능 열로). 🔑 **08-04에서 안 움직였으면 2일 연속 미실행이고, 이건 US 컷과 별개의 두 번째 라이브 이상이며 악화 중이다.**
2. 🔴 **US 쪽 크론들은 정상인가** — 같은 표를 다시 떠서 **US는 도는데 KR만 안 도는지** 확인한다.
3. 🔴 **판정만 하고 고치지 말 것.** 🔑 **원인 규명은 이 STEP 범위가 아니다** — 상태만 기록하고 §5 판정서에 **별건으로** 올린다.

## §2 — 🔴 480 코호트: **07-31에 무슨 일이 있었나**

914 실측 `us_market_cap` `as_of` 분포: **08-04: 5,401 · 08-03: 2 · 08-02: 5 · 07-30: 480**.

🔑 **480의 마지막 성공이 07-30이다. 그리고 914는 게이트가 07-30에는 통과했다고 판정했다** (*"도입 직후 통과, 이후 5일 연속 차단"*).

🔴 **그러면 480은 07-30에는 취득에 성공했고 07-31부터 실패한다.** 🔑 **"원래 못 가져오던 종목"이 아니다. 되던 것이 그날 안 되기 시작했다.**

1. 🔴 **위 추론이 맞는지 먼저 확인**한다 — 480의 `as_of`가 전부 07-30인지, 아니면 더 오래된 것이 섞여 있는지. 🔴 **틀리면 틀렸다고 적고 그 값으로 진행한다.**
2. 🔴 **07-30~07-31 사이의 변경 전수** — `git log`로 그 구간 커밋을 **전부** 열거하고 취득 경로(`lensPrecompute.ts`·시총 취득·외부 API 호출부)를 건드린 것이 있는지 본다. 🔴 **`grep` 매칭은 존재 증거이지 내용 증거가 아니다(#82) — 열어서 확인한다.**
3. 🔴 **코드 변경이 없으면 없다고 적는다.** 🔑 **그러면 원인은 우리 쪽이 아니라 외부(API 정책·rate limit·티커 변동)일 수 있고, 그건 §3이 답한다.**

## §3 — 🔴 480을 지금 직접 불러본다 (결정적 검증)

914는 *"종목별 실패단계 로그 부재로 구분 불가"*라 했다. 🔑 **로그가 없으면 직접 호출해서 답한다.**

**방법**(🔴 **읽기 전용 · DB 쓰기 0 · 크론 경로 안 탐 · 프로브로만**):

1. 480 중 **무작위 표본 20개**를 뽑는다. 🔴 **표본 선정 방식을 기록**한다(재현 가능해야 한다 · #78).
2. **크론이 쓰는 것과 같은 취득 경로로 그 20개를 직접 호출**한다. 🔴 **SEC/외부 API rate limit을 지킬 것**(SEC는 10 req/s). 🔴 **`RETRY_MAX`·게이트를 우회하지 말고, 순수 취득 함수만 호출**한다.
3. 🔴 **결과를 세 갈래로 가른다**:
   - **성공** → 🔑 **취득 자체는 가능하다 → 예산·시간 부족이 원인 → A안이 통한다.**
   - **404/없음** → 🔑 **원천 취득 불가(상장폐지·티커 변경 등) → A안 실패 → 유니버스 문제다.**
   - **429/rate limit/타임아웃** → 🔑 **호출량 문제 → A안이 통하되 대가가 다르다.**
4. 🔴 **표본 20개는 480 전체의 답이 아니다.** 🔴 **"표본 20개 중 N개"로 적고, 전수 추정치를 단정하지 말 것**(#10 · 890 교훈).
5. 프로브 `scripts/probe_915_cohort.ts` + `docs/probe_915_cohort.json` — 🔴 **스크립트를 같은 커밋에**(#78) · 🔴 **914가 자기 프로브에서 strict-null 2건을 잡은 것처럼 sanity check를 넣을 것**(플레이북 #87).

## §4 — 🔴 914 산술 검증 2건

914가 낸 숫자에서 따라 나오는 것이 두 개 있다. 🔴 **Cowork의 산술이다 — 맞는지 확인부터 하고, 틀리면 틀렸다고 적는다.**

1. **결측 78** — `as_of` 분포 합계 `5,401+2+5+480 = 5,888`이 `us_market_cap` 행 수와 같다. 그런데 912의 `freshCoverage` 분모는 **5,966**이었다. 🔴 **차이 78종목은 stale이 아니라 행 자체가 없는 것인가.** 🔑 **그렇다면 결손은 "480 반복실패 + 78 부재"의 두 종류이고 처방이 다르다.** 🔴 **분모 5,966의 출처를 코드로 확인**하고, 78의 정체를 밝힌다. 🔴 **다른 설명이 가능하면(최근 추가·상장폐지 등) 그것도 적는다.**
2. **A안의 목표치** — 480을 회복하면 `(5,401+480)/5,966 = 5,881/5,966 ≈ **98.6%**`다. 🔑 **833이 게이트를 만들 때 기록한 "정상치 98.6%"와 같은 값이다**(914 §2 확인). 🔴 **이 일치가 맞는지 계산으로 확인**한다. 맞으면 🔑 **A안은 "임계를 억지로 넘기는 것"이 아니라 "원래 수준으로 되돌리는 것"**이고, 그것이 A안 권고의 근거를 크게 강화한다. 🔴 **틀리면 틀렸다고 적는다.**

## §5 — 판정서 갱신 (`docs/DECISION_912_LIVE.md`)

🔴 **본문 지우지 말고 추가 · 정정은 취소선 보존.**

- 🔴 **A안 실행 가능성 = 가능 / 불가 / 미상.** §3 표본 결과로. 🔴 **표본 한계를 함께 적을 것.**
- 🔴 **선택지에 (D)를 추가**한다 — **취득 불가 종목을 유니버스(분모)에서 제외**. 🔑 **§3에서 404가 많이 나오면 이것이 유일한 길일 수 있다.** 🔴 **대가**: `data/us_symbols.json`은 GitHub Actions가 매일 09:00 UTC에 자동 갱신하므로 **파일 수정으로는 안 되고 코드 쪽 필터가 필요**하다는 사실을 적는다. 🔴 **이 STEP에서 구현하지 말 것.**
- 🔴 **A·B·C·D 네 개를 병기**하고 914의 권고(A)가 §3 결과로 **유지되는지 바뀌는지** 적는다. 🔴 **나머지를 지우지 말 것.**
- 🔴 **KR 크론 미실행을 별건으로 등재**(§1) — 🔑 **US 컷과 원인이 다르고 아직 아무도 안 보고 있다.** 🔴 **며칠째인지 숫자로.**
- 🔴 **영향 크기 111/998(11.12%)는 914 값 유지** — 재측정하지 말 것(하루 차이로 흔들릴 값이고, 이 STEP의 질문이 아니다).
- 🔴 **로그 확인**(오늘 21:30 UTC)의 지위 — 914가 *"판정엔 불필요, A안 목표수치로 유용"*으로 유지 권고했다. §3·§4가 목표치를 대신 낼 수 있으면 **철회 가능**한지 적는다.

## §6 — 문서 · 검증 · 커밋

- `docs/DECISION_912_LIVE.md` 갱신 · `docs/REVDCF_SPEC.md` §11 실측 · `docs/STATE.md`(🔴 142줄 상한) · `docs/CHANGELOG.md`
- 🔴 **`docs/LENS_DEV_PLAYBOOK.md` 신규**:
  > 🔑 **로그가 없어서 못 가른다면, 직접 호출해서 가른다.** 실패 원인을 로그로만 구분하려 하면 보존기간·계정권한에 막힌다. **같은 경로를 프로브로 한 번 태우면 성공/404/429가 즉시 갈린다.** 🔴 **단, 표본은 표본이라고 적는다.**

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/ vercel.json   # 🔴 출력 없어야 함
git status --porcelain                                                                # 🔴 ?? 0건
```

🔴 **커밋 메시지는 §2~§4 결과에 맞게 실행 측이 고쳐 쓴다.** 🔴 **초안이 결과를 전제하지 않았는지 확인할 것** — 913에서 초안이 명령서 가설을 전제했다가 정반대 결과가 나와 대폭 재작성했고, 914에서도 커밋 전 프로브 버그 2건을 잡았다.

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 915: ask the four hundred and eighty names directly, since the logs will not say why they fail

- those names were fetched successfully on the thirtieth and not once since, so they are not names
  that never worked; something turned on the thirty-first, and the commits from that day are read
- whether a bigger retry budget would recover them cannot be settled from logs that expire in an
  hour, so a sample is fetched through the same path right now and sorted into succeeded, not
  found, and rate limited, which is the distinction the recommendation rests on
- the arithmetic from the previous step is checked rather than inherited: the rows in the table
  fall short of the universe the coverage is measured against, and recovering the failing cohort
  would land coverage exactly where it sat when the threshold was chosen
- a fourth option joins the three already written down, because names that cannot be fetched at
  all are a question about the universe rather than about the budget
- separately, the Korean jobs have now missed more than one day, and that is recorded as its own
  item rather than folded into this one"
git push && git push origin main:revdcf-preview
```

## §7 — 보고 후 멈춘다

```
§1 KR 크론 — 🔴 며칠째 미실행인지 숫자 · US 크론은 정상인지
§2 480의 as_of가 전부 07-30인지 · 🔴 07-30~07-31 커밋 전수와 취득 경로 변경 유무
   🔴 변경 없으면 "없음"
§3 🔴 표본 20개 직접 호출 결과 — 성공/404/429 각 몇 건(🔴 "표본 20개 중 N"으로)
   표본 선정 방식 · sanity check 넣었는지
§4 🔴 결측 78의 정체 · 분모 5,966의 출처 · 🔴 5,881/5,966 = 98.6% 확인 결과
   🔴 833 기록 "정상치 98.6%"와 일치하는지
§5 🔴 A안 가능/불가/미상 · (D) 추가 · A·B·C·D 병기 · 914 권고 유지/변경
   🔴 KR 별건 등재 · 로그 확인 유지/철회
무변경: 코드 diff 0 · vercel.json·크론·RETRY_MAX·임계값 손 안 댐 · DB 쓰기 0
       lens_cuts 10행 불변 · LENS_COMPLETION_STANDARD.md 불변
       DoD 판정 칸 전부 불변 · 안건 2·4 대기 불변 · REVDCF_ENABLED Production OFF
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **고치지 말 것. `RETRY_MAX`·게이트·임계값을 바꾸지 말 것. 유니버스 필터를 구현하지 말 것. 크론을 돌리지 말 것. 컷을 DB에 쓰지 말 것. 다음 STEP을 제안하지 말 것.**
