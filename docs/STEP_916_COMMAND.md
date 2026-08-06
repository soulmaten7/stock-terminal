# STEP 916 — A안의 형태를 정한다: 시간 예산 산술 · 07-31 방아쇠 · 🔴 플랫폼 상한 (진단·설계만 · 구현 금지)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_916_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `0beabca`(STEP 915 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `REVDCF_ENABLED` Production **OFF** · `revdcf_results` 604×5 · `us_market_cap` 5,892 · `lens_cuts` 10행

🔴 **불변 금지선**: DB **쓰기 금지**(읽기만) · **크론 수동 실행 금지** · `vercel.json`·`.github/workflows/**`·`data/us_symbols.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지 · `docs/LENS_COMPLETION_STANDARD.md` 건드리지 말 것.
🔴 **이 STEP은 진단과 설계만 한다. 코드 수정 0. `RETRY_MAX`·`RETRY_MS`·게이트·임계값 손대지 말 것.**
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 915가 만든 모순

915 확정:

| 사실 | 값 |
|---|---|
| 표본 직접 호출 | **20/20 성공** · 404 **0** · 429 **0** |
| 07-30~07-31 **US 취득 경로** 코드 변경 | **없음** |
| `5,881/5,966` vs 833 기록 정상치 | **98.5753% vs 98.5743%** — 사실상 일치 |
| A안 | **가능** · (D)는 404 0건이라 지지 안 됨 |

🔑 **개별로 부르면 100% 되는데 크론에서는 안 된다. 그리고 우리 코드는 안 바뀌었다.**

🔴 **그러면 원인은 종목도 코드도 아니라 배치 실행 조건이다** — **시간·동시성·예산**. `lib/lensPrecompute.ts:115` `RETRY_MAX = 400`, `RETRY_MS = 40_000`이 그 자리에 있다.

🔴 **가설이다. 이 STEP이 숫자로 가른다.**

## §1 — 🔴 시간 예산 산술 (핵심)

1. **915 프로브의 실제 소요시간**을 확인한다 — `docs/probe_915_cohort.json`에 기록돼 있는가. 🔴 **없으면 표본 20개를 같은 방식으로 다시 불러 시간을 잰다**(🔴 읽기만 · rate limit 준수 · 크론 경로 안 탐).
2. **1건당 평균 소요**를 낸다 → **464건에 필요한 시간**을 산출한다. 🔴 **직렬인지 병렬인지가 결정적이다 — `lensPrecompute.ts`의 재시도 루프가 어떤 동시성으로 도는지 코드로 확인**하고 그 동시성으로 계산한다.
3. 🔴 **`RETRY_MS = 40_000`(40초)과 비교**한다. 🔑 **464건에 40초를 크게 넘는 시간이 필요하면 원인 확정이다.**
4. 🔴 **`RETRY_MAX = 400` < 464**도 함께 적는다. 🔑 **둘 중 어느 쪽이 먼저 걸리는가** — 개수 절단인가 시간 절단인가. 🔴 **`:157 retryBudgetHit = retryAll.length > RETRY_MAX || timeHit`이 둘을 OR로 묶어 구분이 안 된다는 사실**을 적는다(892가 지적한 자리).
5. 🔴 **원인을 "확정"이라 쓰려면 숫자가 그렇게 말해야 한다.** 애매하면 애매하다고 적는다.

## §2 — 🔴 07-31 방아쇠: GHA 자동커밋 2건을 연다

915는 07-30~07-31 구간에서 *"GHA 자동커밋 2건(코드 아님)"*으로 넘겼다.

🔑 **코드가 아니어도 데이터가 바뀌면 부하가 바뀐다.** 🔴 **`data/us_symbols.json`은 GitHub Actions가 매일 09:00 UTC에 자동 갱신한다** — 그 2건이 그것일 수 있다.

1. 🔴 **그 2건의 실제 diff를 `git show`로 연다.** 🔴 **"코드 아님"으로 넘기지 말 것 — 무엇이 몇 줄 바뀌었는지.**
2. 🔴 **유니버스 크기 변화**를 낸다 — 07-30 시점 심볼 수 → 07-31 시점 심볼 수. 🔑 **늘었으면 그날부터 취득 부하가 늘었고, 예산 절단이 그때 시작된 것과 정합한다.**
3. 🔴 **정합해도 인과를 단정하지 말 것**(#10 · 890 교훈). 🔑 **"시점이 맞는다"와 "그것이 원인이다"는 다르다.** 🔴 **유니버스가 안 늘었으면 안 늘었다고 적고, 그러면 이 가설은 죽는다.**
4. **`retryAll`이 어떻게 구성되는지** 코드로 확인한다 — 🔑 **왜 매일 거의 같은 집합이 굶는가.** 정렬·순서가 결정론적이면 **앞쪽 400개만 계속 처리되고 뒤쪽은 영구히 안 온다**는 뜻이다. 🔴 **코드로 확인하고, 순서가 결정론적인지 아닌지 적는다.**

## §3 — 🔴 회복 속도 산술 (C안의 대가)

914→915 사이 값 변화가 있다. 🔴 **Cowork의 산술이다 — 맞는지 확인부터 한다.**

- 07-30 잔류: **480 → 464** (하루에 **16** 회복?)
- 결측: **78 → 74** (하루에 **4**?)

1. 🔴 **이 차이가 실제로 "회복"인지 확인**한다 — 측정 시각이 달라서 생긴 것인지, 종목 집합이 실제로 줄어든 것인지. 🔴 **어제 464/480 집합과 오늘 집합의 교집합**을 보면 답이 나온다. 🔴 **어제 목록이 프로브 산출물에 없으면 "비교 불가"로 적는다.**
2. 🔴 **회복이 맞다면 속도로 남은 일수를 낸다** — 하루 N개씩이면 464개 해소에 며칠, 그때 coverage가 97%를 넘는 시점은 언제인가.
3. 🔑 **이것이 C안(방치)의 정확한 대가다** — *"영구 동결"*인지 *"N일 뒤 자연 회복"*인지가 갈린다. 🔴 **둘은 완전히 다른 이야기다.**

## §4 — 🔴 플랫폼 상한 (A안의 형태를 정한다)

🔑 **A안이 "예산을 늘린다"라면, 늘릴 수 있는 상한이 있는지부터 알아야 한다.**

1. 🔴 **검색**(외부 축 필요): **Vercel Hobby 플랜의 서버리스 함수 최대 실행시간**을 **공식 문서에서** 확인한다. 🔴 **못 찾으면 "못 찾음"으로 적는다.** 🔴 **911이 Hobby 크론 제한·로그 보존을 공식 문서로 확인한 방식 그대로.**
2. 🔴 **현재 크론 함수의 설정된 상한**을 확인한다 — `vercel.json`·라우트 설정에 `maxDuration`이 있는가. 🔴 **읽기만. 고치지 말 것.**
3. 🔑 **여기가 갈림길이다**:
   - **상한에 여유가 있으면** → A안 = **예산 증액**(단순).
   - 🔴 **`RETRY_MS=40초`가 이미 플랫폼 상한에 가까우면** → **예산 증액은 불가**하고 A안의 형태가 바뀐다 — **분할 실행·청크·다회 크론** 등. 🔑 **그러면 이건 "설정 한 줄"이 아니라 "구조 변경"이고 대가가 완전히 다르다.**
4. 🔴 **A안의 실제 형태를 설계로 적는다**(🔴 **구현 금지 · 코드 diff 0**) — 무엇을 어떻게 바꾸면 464가 회복되는가, **한 번에 되는가 며칠 걸리는가**, 되돌릴 수 있는가.

## §5 — 판정서 · KR 별건

`docs/DECISION_912_LIVE.md` 갱신(🔴 **본문 지우지 말고 추가 · 정정은 취소선 보존**).

- 🔴 **원인 = 확정인가 가설인가** — §1 숫자로. 🔑 **915까지 "거의 확정"이었다. 여기서 확정이 되는지 적는다.**
- 🔴 **A안의 형태**(§4) — 예산 증액인가 구조 변경인가. 🔴 **대가·리스크·되돌리기 비용.**
- 🔴 **C안(방치)의 대가**(§3) — 영구 동결인가 N일 뒤 자연 회복인가. 🔴 **숫자로.**
- 🔴 **A·B·C·D 병기 유지** · 914·915의 권고(A)가 §4 결과로 **유지되는지 형태가 바뀌는지.**
- 🔴 **KR 크론 재측정**(915: 08-05분도 놓쳐 **2일 연속**) — 🔴 **08-06분도 놓쳤는지 다시 잰다.** 🔴 **며칠째인지 숫자로.** 🔑 **US 컷보다 오래되진 않았지만 매일 늘고 있다.** 🔴 **원인 규명은 여전히 범위 밖 — 상태만.**
- 🔴 **`#67` 로그 확인** — 915가 *"선택적 보강자료"*로 지위를 내렸다. §1이 숫자를 내면 **완전 철회 가능한지** 적는다.

## §6 — 문서 · 검증 · 커밋

- `docs/DECISION_912_LIVE.md` · `docs/REVDCF_SPEC.md` §11 · `docs/STATE.md`(🔴 142줄 상한) · `docs/CHANGELOG.md`
- 프로브를 새로 돌렸으면 `scripts/probe_916_*.ts` + 산출 JSON — 🔴 **같은 커밋에**(#78) · 🔴 **sanity check 넣을 것**(#87)
- 🔴 **`docs/LENS_DEV_PLAYBOOK.md` 신규**:
  > 🔑 **"코드 변경 아님"으로 넘긴 커밋이 부하를 바꿨을 수 있다.** 자동 갱신되는 데이터 파일(유니버스·심볼 목록)은 코드가 아니지만 **실행 시간과 예산 소모를 바꾼다.** 🔴 **변경 구간을 볼 때 데이터 커밋도 열어 본다.** **이력**: 915가 07-30~07-31 GHA 자동커밋 2건을 *"코드 아님"*으로 넘겼다.

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/ vercel.json   # 🔴 출력 없어야 함
git status --porcelain                                                                # 🔴 ?? 0건
```

🔴 **커밋 메시지는 §1~§4 결과에 맞게 실행 측이 고쳐 쓴다.** 🔴 **초안이 결과를 전제하지 않았는지 확인할 것**(913 대폭 재작성 · 914 프로브 버그 2건 · 915 교훈).

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 916: work out whether the budget can be raised at all, before recommending that it is

- every one of the sampled names answers when called on its own, and nothing in our fetch path
  changed on the day they stopped, which leaves the batch conditions: how many, how long, at once
- so the time one call takes is measured and multiplied out against the window the retry loop is
  given, and the count cap is compared against the number of names waiting
- the automated data commits from that day are opened rather than waved past as not-code, because
  a larger universe costs more time even when no line of logic moves
- the shortfall shrank slightly between yesterday and today, and whether that is real recovery or
  a measurement artifact decides whether leaving this alone means frozen or merely slow
- and the platform's own ceiling on how long one of these runs may take is looked up, because it
  decides whether the fix is a number or a restructure"
git push && git push origin main:revdcf-preview
```

## §7 — 보고 후 멈춘다

```
§1 1건당 소요 · 동시성(코드 확인) · 464건 필요시간 vs RETRY_MS=40s
   🔴 개수 절단(400)인가 시간 절단인가 · OR로 묶여 구분 안 되는 사실
   🔴 원인 = 확정인가 가설인가
§2 🔴 GHA 자동커밋 2건 실제 diff · 유니버스 크기 07-30 → 07-31
   retryAll 구성·순서가 결정론적인가 · 🔴 인과 단정 안 했는지
§3 🔴 480→464 · 78→74가 실제 회복인가 측정 artifact인가(집합 교집합)
   회복이면 속도와 97% 도달 예상일 · 🔴 비교 불가면 "비교 불가"
§4 🔴 Vercel Hobby 함수 실행시간 상한(공식 문서 · 못 찾으면 "못 찾음")
   현재 maxDuration 설정 · 🔴 A안 = 예산 증액인가 구조 변경인가
   🔴 A안 설계(구현 0) · 한 번에 되는가 며칠 걸리는가 · 되돌리기
§5 🔴 원인 확정 여부 · A안 형태 · C안 대가(숫자) · A·B·C·D 병기 유지
   🔴 KR 며칠째인지 · #67 완전철회 가능한지
무변경: 코드 diff 0 · vercel.json·크론·RETRY_MAX·RETRY_MS·임계값 손 안 댐 · DB 쓰기 0
       lens_cuts 10행 불변 · LENS_COMPLETION_STANDARD.md 불변
       DoD 판정 칸 전부 불변 · 안건 2·4 대기 불변 · REVDCF_ENABLED Production OFF
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **고치지 말 것. `RETRY_MAX`·`RETRY_MS`·게이트·임계값을 바꾸지 말 것. 유니버스 필터를 구현하지 말 것. 크론을 돌리지 말 것. 컷을 DB에 쓰지 말 것. 다음 STEP을 제안하지 말 것.**
