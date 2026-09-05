# STEP 893 — 처방 B 적용: revdcf 크론 시총 TTL 필터 (🔴 크론 코드 변경 · 최대 주의)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_893_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `0984953`(STEP 892 · `main`·`revdcf-preview` 동일) · tsc 0 · test 155/155 · `REVDCF_ENABLED` **OFF** · `revdcf_results` 604×3 · `us_market_cap` 5,887

🔴 **불변 금지선**: `REVDCF_ENABLED` **OFF 유지** · `revdcf_results`·`us_market_cap` **쓰기 금지** · 🔴 **크론 수동 실행 금지**(다음 정규 실행에 맡긴다) · `data/us_symbols.json`·`.github/workflows/**` 수정 금지 · `lib/lensPrecompute.ts` **수정 금지**(7렌즈 파이프라인 · 894 별도) · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 승인 · 성격

**장은태 승인(2026-08-04)**: 892 §3 처방 **B 적용** — `app/api/cron/revdcf/route.ts`에 `lensPrecompute`와 같은 **7일 TTL 필터**.

🔴 **이 STEP은 매일 도는 크론의 코드를 바꾼다. 오늘 세션에서 가장 되돌리기 어려운 변경이다.**

- 🔴 **계산 로직 무변경**: `lib/revdcf/**`(engine·drivers·compute) diff **0**. 바뀌는 것은 **어떤 행을 읽느냐**뿐이다.
- 🔴 **새 측정 없음 · 새 판정 없음.**
- 🔴 **DoD 2·4를 재판정하지 말 것**(892가 891 판정이 강화됐다고 확인했다).

### 🔴 892가 남긴 정직한 사실 — 문서에 반드시 남긴다

892 §2: stale 73사(가격변동 평균 **3.59%**) 판정변경 **2/73(2.7%)** vs fresh 대조군 86사(가격변동 평균 **4.57%** — **더 큼**) 판정변경 **1/86(1.2%)**. 🔑 **대조군이 가격을 더 움직였는데 결과 규모가 사실상 같다.**

→ 892 판정의 불리한 사실을 그대로 인용한다:
> **B의 효과는 GAP 정확도 개선이 아니라 나이 상한 방지·내부 일관성이다.**

🔴 **"이 변경이 판정을 정확하게 만든다"고 적지 말 것.** 892 실측이 그것을 뒷받침하지 않는다.

## §1 — 적용 내용

### 1-1. 읽기에 TTL 필터

`app/api/cron/revdcf/route.ts:44`:
```ts
sb.from("us_market_cap").select("symbol, market_cap").range(f, f + 999)   // 현재: 전량·필터 없음
```
→ **`as_of` 하한을 건다.** 기준은 `lensPrecompute.ts:141`의 **7일**과 **같은 값**으로 하고, 🔴 **상수를 두 곳에 복제하지 말 것** — 한 곳에서 가져오거나, 복제가 불가피하면 **양쪽에 서로를 가리키는 주석**을 남긴다(886 정본 원칙).

🔴 **`select`에 `as_of`를 포함시켜 나이를 알 수 있게 한다**(§1-2에서 쓴다).

### 1-2. 🔴 스킵 사유를 정확히 분기한다

TTL 밖 심볼은 `mcapBy`에 없어져 기존 `NO_MARKETCAP` 경로로 떨어진다. **그대로 두면 안 된다.**

🔑 **시총이 없는 것과 시총이 묵은 것은 다른 상태다.** 888이 추출하고 889가 적용한 원칙 — *"계산 불가 사유는 뭉뚱그리지 않고 실제 원인별로 정확히 분기한다"* — 이 자리에 그대로 적용된다.

- 🔴 **`STALE_MARKETCAP`(또는 동등한 이름)을 신설**하고 `NO_MARKETCAP`과 분리한다.
- 🔴 **`flags`에 시총 나이(일수)와 `as_of`를 기록**한다 — 나중에 이 결정을 되돌아볼 재료가 된다.
- 🔴 `messages/ko.json`·`en.json`의 `RevDcf.skip`에 대응 문구를 추가한다. 🔴 **889의 원칙으로 쓴다** — 사유를 정확히, 단정 없이. **ko/en 패리티 테스트를 통과해야 한다.**

### 1-3. 🔴 유니버스 보존 (880 교훈 · 이 STEP 최대 위험)

`route.ts:23~26` — 유니버스 = **직전 `as_of`의 CIK 집합**. 자기참조다.

🔴 **스킵되는 종목도 반드시 행을 써야 한다. 안 쓰면 다음 날 그 종목이 유니버스에서 영구 탈락하고 되돌릴 경로가 없다.**

- 현행 코드는 skip을 `{ ...base, skip_reason }`로 **행을 쓴다**(880·881 확인). §1-2의 신규 분기도 **같은 형태**여야 한다.
- 🔴 **검증**: 조기 이탈(`return null`·`continue`·throw)이 하나라도 생기지 않았는지 확인한다. 🔴 **하나라도 있으면 중단하고 보고한다.**

## §2 — 테스트 (🔴 회귀 방지)

854의 게이팅 누락이 **테스트 부재로 살아남았다**(868이 발견). 같은 일을 만들지 않는다.

`app/api/cron/revdcf/route.test.ts`에 **최소 3건** 추가:

1. 시총이 TTL **안**이면 정상 계산된다.
2. 시총이 TTL **밖**이면 `STALE_MARKETCAP`으로 스킵되고 **🔴 행이 써진다**(유니버스 보존).
3. 시총이 **아예 없으면** `NO_MARKETCAP`으로 남는다(두 사유가 섞이지 않는다).

🔴 **`lib/revdcf/**` 테스트는 건드리지 말 것**(계산 불변).

## §3 — 🔴 오늘 효과 = 0 확인 (정직)

현재 `us_market_cap` 최고령 = **2026-07-30**(4일). **7일 TTL이면 오늘 skip은 0건이다.**

- 🔴 **프로브로 확인한다** — 오늘 데이터에 필터를 적용하면 몇 건이 걸러지는가. **0이어야 한다.**
- 🔴 **0이 아니면 중단하고 보고한다** — 필터가 의도보다 넓게 걸린 것이다.
- 🔑 **이 변경은 오늘 아무것도 바꾸지 않는다. 미래 방어다.** 보고와 문서에 그렇게 적는다. **"개선했다"고 적지 말 것.**

## §4 — 문서 · 검증 · 커밋

- `docs/REVDCF_SPEC.md` **A-11** — B 적용 완료로 갱신 · §10 갱신(**#retryBudgetHit 미연결**은 **894 대상으로 남긴다** — 해소로 적지 말 것) · §11에 892 주가 민감도 실측
- `docs/LENS_COMPLETION_STANDARD.md` — DoD 5(경계) 각주에 신규 스킵 사유 추가. 🔴 **DoD 판정 칸 불변**(5는 여전히 🔶).
- `docs/STATE.md` 🔴 142줄 상한 · `docs/CHANGELOG.md`
- 프로브 `scripts/probe_893_ttl_effect.ts` + `docs/probe_893_ttl_effect.json` — 🔴 **스크립트를 같은 커밋에**(#78)

```bash
npx tsc --noEmit && npm run test              # 🔴 신규 3건 포함·ko/en 패리티 포함
git diff --stat HEAD -- lib/revdcf/           # 🔴 출력 없어야 함 (계산 불변)
git diff --stat HEAD -- data/ .github/ lib/lensPrecompute.ts   # 🔴 출력 없어야 함
git status --porcelain                        # 🔴 ?? 0건
```

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 893: stop the model reading a market cap with no upper bound on its age

- the table keeps one row per symbol and nothing deletes old ones, so a symbol that keeps
  failing to refresh would carry its figure indefinitely; the same seven day window the lens
  pipeline already uses is applied here
- a stale figure and a missing figure are different states, so they get different skip reasons
  and the age is recorded rather than folded into one bucket
- rows are still written for skipped symbols, because the universe is defined by yesterday's
  rows and anything not written would leave it permanently
- tests cover both skip paths and the row being written, since the last gap of this shape
  survived because nothing tested it
- this changes nothing today: the oldest figure is four days old and the window is seven. it
  is a bound, not an improvement, and the measurement behind it showed fresh companies moving
  as much as stale ones"
git push && git push origin main:revdcf-preview
```

## §5 — 보고 후 멈춘다

```
§1 1-1 TTL 필터 적용 위치 · 상수 복제 여부(복제면 상호 주석)
   1-2 STALE_MARKETCAP 신설 · flags 나이 기록 · ko/en 문구(패리티 통과)
   1-3 🔴 유니버스 보존 — 스킵도 행 쓰기 확인 · 조기 이탈 0건 확인
§2 신규 테스트 3건 통과 · lib/revdcf 테스트 무변경
§3 🔴 오늘 필터 효과 = 0건 확인(아니면 중단·보고)
§4 SPEC A-11 갱신 · 🔴 retryBudgetHit 미연결은 894로 남김(해소 아님)
무변경: lib/revdcf diff 0 · lensPrecompute diff 0 · data/.github diff 0 · DoD 판정 칸 불변
       REVDCF_ENABLED OFF · 크론 미실행 · revdcf_results 604×3 · us_market_cap 쓰기 0
tsc 0 · test ?/? (신규 3건) · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **오늘 skip이 0이 아니면 중단·보고. 조기 이탈이 생기면 중단·보고. 크론을 돌리지 말 것. `lensPrecompute.ts`를 고치지 말 것. 다음 STEP을 제안하지 말 것.**
