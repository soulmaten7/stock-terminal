# STEP 911 — 안건 3 채널 정정 · Hobby 플랜 vs 크론 9개 모순 확인

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_911_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `a10a3e8`(STEP 910 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `REVDCF_ENABLED` Production **OFF** · `revdcf_results` 604×4 · `us_market_cap` 5,888
**결정 대기**: 안건 2(`#17`·`#37`·`#43`) · 안건 3(`#67`) · 안건 4(모델 완성 정의) — **안건 1은 910에서 해소**

🔴 **불변 금지선**: `REVDCF_ENABLED` Production **OFF 유지** · DB **쓰기 금지** · **크론 수동 실행 금지** · `data/us_symbols.json`·`.github/workflows/**`·`lib/lensPrecompute.ts`·`vercel.json` **수정 금지** · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 🔴 Cowork 브라우저 실측 (2026-08-05)

908·909가 안건 3(`#67`)을 *"Vercel 대시보드 = **장은태 전용 채널**"*로 적었다.

🔴 **Cowork이 브라우저로 직접 열었다 — 접근된다.**

| 확인 | 결과 |
|---|---|
| `vercel.com/toms-projects-c798474e/stock-terminal/logs` | ✅ **열린다**(인증된 브라우저) |
| 로그 검색 | ✅ **작동**(`?search=topByMarketCap` URL 파라미터로 반영) |
| 기본 Timeline | **"Last 30 minutes"** — 🔴 그 범위엔 `topByMarketCap` **결과 0건** |
| 🔴 **플랜 배지** | **`Hobby`** — 🔑 **STATE §9의 *"Vercel 플랜(`vercel.json` 크론 9개 vs STATE 'Hobby') 모순"* 항목이 눈으로 확인됐다** |
| 좌측 필터 | Warning 0 · Error 0 · Fatal 0(30분 범위) · Resource·Environment·Route·Request Path·Status Code 등 |

🔑 **897의 교훈이 두 번째로 성립했다** — *"한쪽이 '구조적으로 불가능'이라 적은 것이 다른 쪽에서는 가능할 수 있다."*

## §1 — 안건 3 재분류 (문서 정정)

- `docs/DECISION_908_PENDING.md` 안건 3의 *"장은태 전용 채널"* 서술을 **정정**한다(🔴 **취소선 보존**):
  > 🔴 **정정(911)**: Vercel 대시보드 Logs는 **Cowork이 인증된 브라우저로 접근 가능**하다(2026-08-05 실측). 남은 제약은 **권한이 아니라 로그 보존 기간**이다 — 기본 Timeline "Last 30 minutes"에서는 대상 로그가 안 잡혔고, **Hobby 플랜의 보존 기간을 확인해야 한다.**
- `docs/REVDCF_SPEC.md` §10 `#67` 같은 취지로 갱신
- 🔴 **`#67`을 소진 처리하지 말 것** — **값을 아직 못 얻었다.** 상태는 *"채널 확인됨 · 값 미확보"*다.
- 🔴 **`docs/LENS_DEV_PLAYBOOK.md`에 이력 추가** — 897(브라우저 육안)·911(Vercel 로그)로 **같은 플레이북 항목이 두 번 성립**했다.

## §2 — 🔴 Hobby 플랜 vs 크론 9개 (STATE §9 미확정 항목)

`vercel.json`에 크론이 **9개** 있고 플랜은 **Hobby**로 확인됐다.

🔴 **문서·검색으로 단정하지 말고 DB로 확인한다** — 🔑 **어느 크론이 실제로 도는지는 그 크론이 쓰는 테이블이 답한다.**

1. **`vercel.json`의 크론 9개를 열거**하고 각각이 **어느 테이블에 쓰는지** 코드로 확인한다.
2. **각 테이블의 최신 `as_of`·갱신 주기를 DB로 조회**한다(🔴 **읽기만**). 예: `revdcf_results`·`lens_scores`·`lens_cuts`·`us_stock_perf`·`kr_stock_snapshot` 등.
3. 🔴 **실제로 도는 크론과 안 도는 크론을 가른다.** 🔴 **"안 도는 것 같다"가 아니라 "최신 as_of가 N일 전"처럼 숫자로.**
4. **검색**(🔴 이번엔 외부 축이 필요하다): Vercel **Hobby 플랜의 크론 제한과 로그 보존 기간**을 공식 문서에서 확인한다. 🔴 **못 찾으면 "못 찾음"으로 적는다.**
5. 🔴 **모순이면 모순이라고, 아니면 아니라고 적는다.** 🔴 **`vercel.json`을 고치지 말 것** — 크론 구성 변경은 **운영 변경**이고 이 STEP 범위가 아니다.

🔑 **이것이 중요한 이유**: 안 도는 크론이 있으면 **그 크론이 채우는 데이터가 낡아 있고**, 891~893이 시총 신선도에서 겪은 것과 **같은 종류의 문제**가 다른 테이블에도 있을 수 있다.

## §3 — 문서 · 검증 · 커밋

- `docs/DECISION_908_PENDING.md`(안건 3 정정) · `docs/REVDCF_SPEC.md` §10 `#67` · §11에 §0·§2 실측
- `docs/STATE.md` §9 — **Vercel 플랜 항목** §2 결과로 갱신. 🔴 **모순이 해소되면 항목을 지우지 말고 해소 표시** · 🔴 142줄 상한
- `docs/LENS_DEV_PLAYBOOK.md` 이력 추가
- `docs/CHANGELOG.md`

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/ vercel.json   # 🔴 출력 없어야 함
git status --porcelain                                                                # 🔴 ?? 0건
```

🔴 **커밋 메시지는 §2 결과에 맞게 실행 측이 고쳐 쓴다**(894·908·909·910 교훈 — **초안이 결과를 전제하지 않았는지 확인**).

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 911: correct who can read the logs, and check whether nine scheduled jobs run on a plan that may not allow them

- two steps recorded the deployment logs as reachable only by the owner; they open from an
  authenticated browser, so the remaining limit is retention rather than permission
- the plan badge is visible on that same page, which settles a contradiction the state file has
  carried for a while: nine cron entries against a plan whose limits are not what the file assumed
- which of those nine actually run is answered from the tables they write to rather than from
  documentation, because a job that does not run leaves its data sitting at an old date
- the log value itself is still not in hand, so that item stays open with its reason changed"
git push && git push origin main:revdcf-preview
```

## §4 — 보고 후 멈춘다

```
§1 안건 3 정정 내용 · 🔴 #67을 소진 처리하지 않았는지 · 플레이북 이력 추가
§2 크론 9개 열거와 각각의 쓰기 대상 테이블
   🔴 테이블별 최신 as_of — 실제로 도는 것 / 안 도는 것(숫자로)
   🔴 Hobby 크론 제한·로그 보존 검색 결과(못 찾으면 "못 찾음")
   🔴 모순인가 아닌가 · vercel.json 무변경 확인
§3 STATE §9 갱신(🔴 항목 삭제 말고 해소 표시)
무변경: lib/app/components/messages/data/.github/vercel.json diff 0
       DoD 판정 칸 전부 불변 · 보류 목록 불변 · 안건 2·4 대기 불변
       REVDCF_ENABLED Production OFF · 크론 미실행 · DB 쓰기 0
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **`vercel.json`을 고치지 말 것. 크론을 돌리지 말 것. `#67`을 소진 처리하지 말 것. 안건 2·4에 손대지 말 것. 다음 STEP을 제안하지 말 것.**
