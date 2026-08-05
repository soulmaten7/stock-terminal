# STEP 913 — 🔴 `lens_cuts` 원인 재조준: **US·KR이 같은 분에 멈췄다** (진단만 · 수리 금지)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_913_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `ae47b76`(STEP 912 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `REVDCF_ENABLED` Production **OFF** · `revdcf_results` 604×4 · `us_market_cap` 5,888

🔴 **불변 금지선**: DB **쓰기 금지**(읽기만) · **크론 수동 실행 금지** · `vercel.json`·`.github/workflows/**`·`data/us_symbols.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지 · `docs/LENS_COMPLETION_STANDARD.md` 건드리지 말 것.
🔴 **이 STEP도 진단만 한다. 코드 수정 0. 게이트 변경 금지.** 🔑 **7렌즈는 라이브다.**
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 🔴 912가 지나친 단서: **동일 분(minute)**

912 §1 실측:

| 테이블 | 최신 `as_of` |
|---|---|
| `lens_cuts` **US** | **07-28 04:33** |
| `lens_cuts` **KR** | **07-28 04:33** |

🔑 **US 컷과 KR 컷이 같은 분에 멈췄다.** 그런데 두 값을 쓰는 크론은 **서로 다른 시각에 돈다** — US `lens-scores` = **21:30 UTC** · KR `kr-lens-scores` = **10:30 UTC**(각각 ±59분 지터).

🔴 **서로 다른 시각에 도는 두 크론이 같은 분에 마지막 값을 남길 수 없다.** 🔑 **그러면 그 행들은 크론이 쓴 것이 아닐 가능성이 있다 — 단일 조작(부트스트랩 SQL·수동 스크립트·최초 배포 시딩)이 둘을 동시에 썼을 가능성.**

### 🔴 그러면 성격이 뒤집힌다

- 912는 이것을 **"8일 정체 = 고장"**으로 읽었다.
- 🔑 **다른 읽기가 가능하다: "07-28에 한 번 씨딩됐고, 그 뒤로 크론이 `lens_cuts`를 쓴 적이 없다."** 그러면 **정체가 아니라 미작동**이고, *"언제부터 고장났나"*가 아니라 *"애초에 작동한 적이 있나"*가 질문이다.

### 🔴 게이트가 최초 원인이 아니라는 912 자신의 실측

912: *"취득게이트(STEP 833) 자체는 **07-30 커밋** → 정지보다 **이틀 늦게** 도입돼 최초원인은 게이트와 무관할 수 있음."*
912: *"STEP 799~811(**07-28 커밋**, 분모유도컷 도입) 시기와 정지시각 정합 가능성."*

🔑 **07-28은 컷 기능이 처음 들어온 날이다.** 🔴 **그 날 04:33이 "멈춘 시각"이 아니라 "처음 쓰인 시각"일 수 있다.** 이 STEP이 가를 것이 그것이다.

🔴 **가설이다. 확정하지 말고 아래로 검증한다.**

## §1 — 🔴 `lens_cuts` 쓰기 주체 전수 (최우선)

🔑 **크론만이 쓰는 게 아닐 수 있다.** 쓰는 주체를 **빠짐없이** 찾는다.

1. **`lens_cuts`를 쓰는 코드를 전수 검색**한다 — `insert`·`upsert`·`update`·`delete`, SQL 문자열, 마이그레이션, `scripts/**`, `supabase/**`, 부트스트랩·백필 스크립트까지.
2. 🔴 **`grep` 매칭은 존재 증거이지 내용 증거가 아니다(플레이북 #82).** **매칭된 파일을 전부 열어** 실제로 쓰는지 확인하고, **쓰기 주체 목록**을 만든다.
3. 🔴 **각 주체가 "언제 어떻게 실행되는가"를 적는다** — 크론인가 / 수동인가 / 마이그레이션인가 / 한 번만 도는 부트스트랩인가.
4. 🔑 **크론 경로가 실제로 `lens_cuts`에 도달하는지 코드로 따라간다** — `lensPrecompute.ts:400~401`(912가 확인한 upsert 지점)까지 오는 **모든 선행 조건**을 열거한다. `cutGateOk` **외에** 조건이 더 있는가(early return·try/catch 삼킴·환경변수·`if (bootstrap)` 류).
5. 🔴 **그 upsert의 `onConflict` 키를 확인**한다. 🔑 **912가 `kr_stock_snapshot`에서 배운 것과 같은 함정** — 키가 덮어쓰기면 과거 이력이 DB에 없어 *"언제부터"*는 원리적으로 답할 수 없다. 🔴 **그러면 답할 수 없다고 적는다.**

## §2 — 🔴 "07-28 04:33 = 씨딩인가 정지인가"

1. **07-28 04:33 UTC 전후의 git 이력**을 본다 — 그 시각 **직전** 배포/커밋이 무엇인가. 🔴 **커밋 타임스탬프를 실제로 대조**한다(912가 "못 한 것"으로 남긴 항목).
2. 🔑 **04:33은 US(21:30)도 KR(10:30)도 아닌 시각이다.** 🔴 **어느 크론의 지터 창에도 들어가는가** — 들어가지 않으면 **크론이 쓴 값이 아니라는 강한 증거**다. 🔴 지터는 ±59분(911 확정)이므로 US는 20:31~22:29, KR은 09:31~11:29다. **04:33은 둘 다 밖이다** — 🔴 **이것이 맞는지 직접 확인**하고 맞으면 그렇게 적는다.
3. **`lens_cuts`의 행 구조를 읽는다**(🔴 읽기만) — US·KR 행이 **몇 개이고 어떤 컬럼**인가. 🔑 **두 지역 행의 `created_at`(있으면)이 같은 트랜잭션을 가리키는가.**
4. 🔴 **부트스트랩·백필 스크립트가 있으면 그것이 07-28에 돌았을 수 있는 흔적**을 찾는다 — 스크립트 파일의 커밋 시각, `CHANGELOG.md`·STEP 문서의 그 날짜 기록. 🔴 **"돌렸다"는 기록이 없으면 없다고 적는다. 추정 금지.**

## §3 — 🔴 KR 모순 (게이트 가설을 깨는 사실)

912 실측: **KR `freshCoverage` 현재 100% · KR 게이트 임계 95%.**

🔑 **KR은 게이트를 통과해야 한다. 그런데 KR 컷도 07-28에 멈춰 있다.** 🔴 **게이트 가설로는 KR이 설명되지 않는다** — 912도 *"KR 미상"*으로 적었다.

1. **KR 컷 경로를 US와 나란히 놓고 비교**한다 — KR에 `compositionOk`가 없다는 것(912 확인) 외에 **무엇이 다른가.**
2. 🔴 **KR 컷 upsert가 코드에 존재하는가부터 확인한다.** 🔑 **존재하지 않으면 KR 컷은 "고장"이 아니라 "구현 안 됨"이고, 그것이 §0 가설을 강하게 지지한다.**
3. 🔴 **US·KR의 원인이 같은가 다른가**를 판정한다 — 같으면 §0 가설, 다르면 각각.

## §4 — 판정서 갱신 (`docs/DECISION_912_LIVE.md`)

🔴 **새 문서를 만들지 말고 912 판정서를 갱신**한다. 🔴 **912 본문을 지우지 말고 추가**한다(정정은 취소선 보존).

- 🔴 **912의 "8일 정체" 프레임이 유지되는가 정정되는가** — §0~§3 결과로.
- **원인** — 확정 / 가설 / 미상. 🔴 **US와 KR을 따로 적는다.**
- 🔴 **912의 권고안(다음 실행 로그 확인)이 아직 유효한가** — 🔑 **§1이 "크론이 `lens_cuts`를 쓰지 않는다"를 확정하면 `freshCoverage` 로그값은 원인과 무관해진다.** 🔴 **그러면 그 권고를 철회하고 철회 사유를 적는다.**
- 🔴 **Cowork 실측 정정(2026-08-05)을 등재**: Vercel **MCP** 채널(`get_runtime_logs`)은 **403 Forbidden** — MCP가 다른 계정으로 인증돼 있다(`orgId=team_75sBjDtj4rCJOBtQ2d1gnYE6`, `projectId=prj_o5Eao0DzSsFCo9Oa7ZkxdSKLSHdk`로 시도). 🔑 **911이 확인한 브라우저 채널만 작동한다.** 🔴 **로그 확인 수단은 "인증된 브라우저 1개"뿐**임을 `#67`에 적는다.
- 🔴 **사용자 영향 크기는 여전히 미측정**으로 유지.
- 🔴 **권고안 하나** + 근거·대가·불리한 사실·미룰 때의 비용.

## §5 — 문서 · 검증 · 커밋

- `docs/DECISION_912_LIVE.md` 갱신 · `docs/REVDCF_SPEC.md` §10 `#67`(채널 정정) · §11에 실측
- `docs/STATE.md` — 🔴 142줄 상한 · 라이브 항목 갱신
- `docs/LENS_DEV_PLAYBOOK.md` — 🔴 **신규 항목**: *"같은 값이 서로 다른 주기의 두 경로에서 **같은 분**에 멈춰 있으면, 그 경로들이 쓴 것이 아니다."* 🔑 **분포가 아니라 타임스탬프의 일치가 단서였다.**
- `docs/CHANGELOG.md`

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/ vercel.json   # 🔴 출력 없어야 함
git status --porcelain                                                                # 🔴 ?? 0건
```

🔴 **커밋 메시지는 §1~§3 결과에 맞게 실행 측이 고쳐 쓴다.** 🔴 **아래 초안이 결과를 전제하지 않았는지 확인할 것**(894·908·909·910·912 교훈 — 912에서도 초안이 *"이력을 보고 답한다"*고 전제했다가 `onConflict` 덮어쓰기로 답할 수 없었다).

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 913: ask whether the cutoffs ever moved, instead of when they stopped

- the two regions hold the same minute, and the jobs that would write them run eleven hours apart,
  so whatever wrote those rows was not either of those jobs
- that reading turns the question around: not what broke on the twenty-eighth, but whether the
  scheduled path has ever written this table at all, which is answered by listing every writer
- the gate found last time cannot be the first cause, because it was committed two days after the
  timestamp it was supposed to explain, and it does not explain the other region at all, whose
  coverage sits above its own threshold
- the log channel is corrected: the deployment tool reports forbidden because it is signed in as
  another account, leaving the authenticated browser as the only way to read them
- still nothing repaired, and the size of what users have been shown is still not measured"
git push && git push origin main:revdcf-preview
```

## §6 — 보고 후 멈춘다

```
§1 lens_cuts 쓰기 주체 전수(🔴 파일 열어서 확인 · grep만으로 단정 안 함)
   🔴 크론 경로가 upsert까지 오는 모든 선행 조건 · onConflict 키와 이력 보존 여부
§2 07-28 04:33 = 씨딩인가 정지인가 · 🔴 04:33이 어느 지터창에도 안 드는지 확인 결과
   직전 커밋/배포 타임스탬프 대조 결과 · 부트스트랩 실행 흔적 유무
§3 KR — 컷 upsert가 코드에 존재하는가 · US와 무엇이 다른가
   🔴 US·KR 원인이 같은가 다른가
§4 DECISION_912 갱신 — 🔴 "8일 정체" 프레임 유지/정정 · US·KR 원인 각각(확정/가설/미상)
   🔴 912 권고 유효/철회(+사유) · Vercel MCP 403 등재 · 사용자 영향 미측정 유지
무변경: 코드 diff 0 · vercel.json·크론 손 안 댐 · DB 쓰기 0 · LENS_COMPLETION_STANDARD.md 불변
       DoD 판정 칸 전부 불변 · 안건 2·4 대기 불변 · REVDCF_ENABLED Production OFF
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **고치지 말 것. 게이트를 바꾸지 말 것. 크론을 돌리지 말 것. 원인을 추정으로 확정하지 말 것. 다음 STEP을 제안하지 말 것.**
