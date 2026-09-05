# STEP 935 — 🔴 **재시도 성공분 0건** 검증 · 34.5ms/건의 정체 · 915 표본과의 차이 (진단만)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_935_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `847c7f6`(STEP 934 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `docs/STATE.md` **131줄**(상한 142) · `REVDCF_ENABLED` Production **OFF**(Preview만 ON) · `revdcf_results` 3,020 · `us_market_cap` 5,892

🔴 **불변 금지선**: 🔑 **②단계를 시작하지 말 것** · 🔑 **계측을 추가하지 말 것 — 917 ①단계 승인은 그때 배포된 것이고 새 계측은 별도 승인이다** · **`RETRY_MAX`·`RETRY_MS`·게이트 산식·임계값(97/95)·`maxDuration` 불변** · **`lib/lensPrecompute.ts` 수정 금지** · **DoD 판정 칸 수정 금지** · **`REVDCF_ENABLED` Production을 켜지 말 것** · **환경변수 수정·재배포 금지** · DB **쓰기 금지**(읽기만) · **크론 수동 실행 금지** · **메일 발송 금지** · `lib/**`·`app/**`·`components/**`·`messages/**`·`data/**`·`.github/**`·`vercel.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **이 STEP은 코드 읽기·DB 읽기·검색만 한다. 코드 diff 0 · 판정 0 · 처방 0.**
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 🔴 934 부수 발견의 무게

934 보고:

> *"부수 발견으로 **`STOCK_SYMS − freshSet.size = 511 = retryAllLen` 정확 일치**를 확인했고, 이는 **이번 실행 재시도 성공분이 0건**이었을 가능성을 대수적으로 시사(직접 관측 아님, 별건으로 명시)."*

🔑 **이것이 사실이면 912~934가 다뤄 온 축 전체가 바뀐다.** 🔴 **`RETRY_MAX`(400)든 511이든 무의미하다 — 재시도가 아무것도 못 건지고 있다.**

🔴 **하지만 "대수적 시사"이지 관측이 아니다.** 🔑 **이 STEP은 그것을 가른다.**

## §1 — 🔴 대수적 도출이 성립하는지 코드로 검증

🔴 **`lib/lensPrecompute.ts`를 읽어서 확인한다**(#82 · `grep`만으로 단정 금지).

1. 🔑 **`freshSet`에 재시도 성공분이 실제로 들어가는가** — 들어간다면 934의 등식이 성립하고 "성공 0건"이 도출된다. 🔴 **안 들어가면 등식의 의미가 다르다** — 그렇게 적는다.
2. 🔴 **`retryAll`이 계산되는 시점** — `freshSet` 확정 **전**인가 **후**인가. 🔑 **`retryAllLen`과 `STOCK_SYMS − freshSet.size`가 같은 시점의 값이 아니면 등식은 우연일 수 있다.**
3. 🔴 **재시도 결과가 `freshSet`에 병합되는 코드 경로**를 줄 단위로 확인해 적는다.
4. 🔴 **결론**: *"성공 0건"이 **도출된다 / 도출되지 않는다 / 코드만으로는 불명*** 중 하나. 🔴 **단정하지 말 것.**

## §2 — 🔴 34.5ms/건의 정체

933 실측: `stage2Ms` = 13,808ms · `retrySetLen` = 400 → **34.5ms/건**.

🔑 **§1에서 "성공 0건"이 도출되면, 34.5ms는 "가져오는 데 걸린 시간"이 아니라 "실패하는 데 걸린 시간"이다.**

1. 🔴 **재시도 1건이 실제로 무엇을 하는지 코드로 확인** — 외부 HTTP 호출인가, 캐시 조회인가, 조건에 걸려 즉시 반환인가.
2. 🔑 **즉시 반환 경로가 있는지 본다** — 예: 이전 실패 표시·타임스탬프 가드·조건 미충족 시 skip. 🔴 **있으면 그 조건을 적는다.**
3. 🔴 **동시성 값을 확인**한다(916은 6으로 읽었다). 🔑 **동시성 6이면 400건 ÷ 6 ≈ 67배치 × 실제 왕복시간**이다. 🔴 **13.8초 ÷ 67 ≈ 206ms/배치** — 🔴 **이 계산이 맞는지 재확인**하고, 🔑 **206ms가 외부 API 왕복으로 그럴듯한지 아닌지**를 사실로 적는다(🔴 단정 말 것).
4. 🔴 **`noCapField`와 `noResponse`의 정의를 확인**한다 — 🔑 **어느 쪽이 511의 대부분인지 알면 실패 성격이 갈린다.** 🔴 **note에 그 분해가 없으면 "관측 불가"로 적는다.**

## §3 — 🔴 915 표본과 크론의 차이

915: **표본 20/20 성공**(no_data 0 · rate_limited 0) — 🔴 **개별 호출로.**
933/934: **크론에서 성공 0건 시사.**

🔴 **무엇이 다른지 코드·기록으로 대조한다**:

1. **호출 경로가 같은가** — 915 프로브(`scripts/probe_915_cohort.ts`)가 쓴 함수와 크론 stage2가 쓰는 함수가 **동일한지** 확인한다. 🔴 **다르면 915 결과를 크론에 적용할 수 없다** — 그 사실을 적는다.
2. **동시성·헤더·User-Agent·타임아웃**이 다른가.
3. 🔑 **호출량이 다르다** — 915는 20건, 크론은 400건(+stage1의 배치까지). 🔴 **레이트리밋이 걸릴 수 있는 구간인지 사실로 적는다.**
4. 🔴 **915 프로브의 소요시간 기록**(`docs/probe_915_cohort.json`)을 열어 **1건당 시간**을 크론의 34.5ms와 비교한다. 🔑 **915는 순차 136.68ms/건이었다**(916 인용). 🔴 **크론이 4배 빠른 것이 동시성 때문인지 조기 실패 때문인지**를 이 대비로 논하되 🔴 **단정하지 말 것.**

## §4 — 🔴 외부 API 제한 (검색)

🔴 **크론이 쓰는 시총 취득처를 코드로 먼저 확인**한다(야후인지 다른 곳인지 — 🔴 **추정 금지**).
🔴 **그 API의 공개된 레이트리밋·차단 정책을 검색**한다. 🔴 **공식 문서가 없으면 "공식 문서 없음"으로 적고**, 비공식 출처는 **비공식이라고 표시**해 인용한다.
🔑 **916이 Vercel Hobby 제한을 공식 문서로 확인한 방식 그대로.**

## §5 — 🔴 판정서 (`docs/DECISION_912_LIVE.md` 갱신 · 🔴 사실만)

- **§1 결과** — 성공 0건이 도출되는가.
- **§2 결과** — 34.5ms의 정체 · 동시성 산술 · 즉시 반환 경로 유무.
- **§3 결과** — 915와 크론의 차이 목록. 🔴 **915 결과를 크론에 적용 가능한지.**
- **§4 결과** — API 제한(공식/비공식/없음).
- 🔴 **원인 재분류** — 🔑 **912~934가 "예산 문제"로 다뤄 온 것이 "취득 실패 문제"일 수 있다.** 🔴 **가능성으로만 적고 확정하지 말 것.** 🔴 **A·B·C·D 병기 유지 · 새 선택지를 만들지 말 것.**
- 🔴 **다음에 무엇이 필요한지만 적는다** — 🔑 **예: 재시도 성공/실패 분해 계측.** 🔴 **그것을 이 STEP에서 만들지 말 것**(별도 승인).
- 🔴 **934의 "불가" 판정은 그대로 유지**한다(부족분 332 중 111만 채워도 93.30%). 🔴 **이 STEP이 뒤집지 않는다.**

## §6 — 문서 · 검증 · 커밋

- `docs/DECISION_912_LIVE.md` · `docs/REVDCF_SPEC.md` §11 · `docs/STATE.md`(🔴 131줄 유지) · `docs/CHANGELOG.md`(🔴 **935 항목**)
- 🔴 **플레이북은 §1~§4 결과가 새 교훈을 주면만 추가**한다. 🔴 **없으면 안 만든다**(934가 요구 없어 안 만든 것과 같은 판단).

```bash
npx tsc --noEmit && npm run test
wc -l docs/STATE.md                                    # 🔴 131 이하
git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/ vercel.json   # 🔴 출력 없어야 함
git status --porcelain                                 # 🔴 ?? 0건
```

🔴 **`lib/lensPrecompute.ts`에 diff가 나오면 계측을 추가한 것이다 — 되돌리고 보고한다.**
🔴 **DB 사전/사후 스냅샷 일치 확인**(읽기만 했는지).
🔴 **push 전에 `git pull --rebase`가 필요할 수 있다.** 🔴 **충돌 시 중단·보고.**
🔴 **커밋 메시지는 §1~§4 결과에 맞게 실행 측이 고쳐 쓴다.** 🔴 **초안이 결과를 전제하지 않았는지 확인할 것** — 916이 산술로 확정한 것이 933에 뒤집혔고, 933의 개수 절단 결론이 934에서 "그래도 불가"로, 934 부수발견이 다시 축을 흔들었다. **세 번 연속이다.**

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 935: check whether the retries brought back anything at all

- the previous step noticed that the names still missing after retrying number exactly as many as
  went into the retry, which would mean none of the four hundred attempts succeeded
- that is algebra, not observation, so the code is read to see whether recovered names actually
  join the set that count is taken from, and whether both numbers belong to the same moment
- thirty-four milliseconds per name is fast for a round trip and ordinary for a refusal, so what
  one attempt actually does is traced, including any path that returns without calling anything
- a sample of twenty succeeded completely when called on its own; whether that path is the same
  path the scheduled run uses decides whether that result transfers at all
- the earlier finding stands: raising the cap alone cannot reach the threshold. what this changes,
  if it holds, is which problem was being solved"
git push && git push origin main:revdcf-preview
```

## §7 — 보고 후 멈춘다

```
§1 🔴 freshSet에 재시도 성공분이 들어가는가 · retryAll 계산 시점 · 병합 경로(줄 단위)
   🔴 "성공 0건" = 도출된다 / 안 된다 / 불명
§2 재시도 1건이 하는 일 · 🔴 즉시 반환 경로 유무와 조건 · 동시성 값
   🔴 13.8초÷(400÷동시성) 재계산 · 🔴 noCapField vs noResponse 분해(없으면 "관측 불가")
§3 🔴 915 프로브 함수 = 크론 stage2 함수인가 · 동시성·헤더·타임아웃 차이
   🔴 915 136.68ms/건 vs 크론 34.5ms/건 대비 · 🔴 915 결과를 크론에 적용 가능한가
§4 취득처 코드 확인 · 🔴 레이트리밋 공식 문서(없으면 "없음", 비공식은 표시)
§5 🔴 원인 재분류 — 가능성으로만 · 🔴 확정 안 했는지 · A·B·C·D 병기 유지
   🔴 934 "불가" 판정 불변 · 🔴 다음에 필요한 것만 적고 만들지 않았는지
무변경: 🔴 계측 추가 0 · lib/lensPrecompute.ts diff 0 · RETRY_MAX·RETRY_MS·게이트·임계값 불변
       DoD 판정 칸 전부 불변 · 코드 diff 0 · 환경변수 0 · 재배포 0
       REVDCF_ENABLED Production OFF · 크론 미실행 · 메일 발송 0 · DB 쓰기 0(읽기만)
tsc 0 · test ?/? · wc -l STATE ? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **계측을 추가하지 말 것. ②단계를 시작하지 말 것. `RETRY_MAX`·`RETRY_MS`·게이트·임계값을 바꾸지 말 것. 원인을 확정하지 말 것. 새 선택지를 만들지 말 것. 934 판정을 뒤집지 말 것. 크론을 돌리지 말 것. DB에 쓰지 말 것. 다음 STEP을 제안하지 말 것.**
