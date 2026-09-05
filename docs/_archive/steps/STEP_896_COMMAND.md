# STEP 896 — 스킵 사유 오표시 차단 · 문구 4종 신설 · `MISSING_TAG` 3분기

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_896_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `a059f3a`(STEP 895 · `main`·`revdcf-preview` 동일) · tsc 0 · test 158/158 · `REVDCF_ENABLED` **OFF** · `revdcf_results` 604×3(08-03이 marginal 기반) · `us_market_cap` 5,887

🔴 **불변 금지선**: `REVDCF_ENABLED` **OFF 유지** · `revdcf_results`·`us_market_cap`·`lens_scores` **쓰기 금지** · **크론 수동 실행 금지** · `data/us_symbols.json`·`.github/workflows/**`·`lib/lensPrecompute.ts` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 895가 찾은 것 (이 STEP이 고칠 것)

> **`components/RevDcfSection.tsx:70`의 `else` 분기** — 문구 없는 사유 4종(`NO_MARKETCAP`·`MULTI_CLASS_SHARES`·`EX`·`HTTP_*`)이 **"안 보임"이 아니라 `skip.missingTag`("재무 항목 5년치 미확보")로 떨어져 사실과 다르게 표시된다.** 오늘 `MULTI_CLASS_SHARES` **5건이 실제 해당**.

> **`MISSING_TAG` = 원칙 위반 판정(895 §3-1)** — 15(영업이익)/13(PP&E)/3(영업현금흐름) 세 원인이 한 코드·한 문구로 뭉쳐 있고, `flags.missing`은 DB에 저장되나 **렌더링 코드가 0건**이라 화면에 절대 도달하지 않는다.

🔑 **둘 다 822가 고친 것과 같은 유형이다** — 적자를 *"이익 정보가 없어"*로 오도하던 것. 🔴 **895 DoD 5 판정(🔶 유지)의 사유가 바로 이 둘이다.**

## §1 — 성격 · 순서

- 🔴 **계산 결과 무변경.** `verdict`·`gap_years`·드라이버 값이 하나도 안 바뀌어야 한다. 바뀌는 것은 **스킵된 종목의 사유 문자열과 화면 문구**뿐이다.
- 🔴 **순서 고정: §2 → §3 → §4.** §2가 안전망이고, §3·§4는 그 위에 얹는다.
- 🔴 **DoD 5를 이 STEP에서 판정하지 말 것.** 895가 🔶로 판정했다. 재판정은 897 이후 별도.

## §2 — 🔴 오표시 차단 (최우선 · 안전망)

`components/RevDcfSection.tsx:70`의 `else` 분기를 **중립 폴백**으로 바꾼다.

- 🔴 **알 수 없는 사유가 `missingTag`로 떨어지지 않게** 한다. 폴백 문구는 **원인을 단정하지 않는 것**이어야 한다(889 원칙 — *"확인 안 된 구체적 원인은 단정하지 않는다"*).
- 🔑 **`HTTP_*`는 동적이라 열거로 못 막는다.** 폴백이 유일한 방어다. 🔴 **폴백을 지우거나 특정 사유로 대체하지 말 것.**
- 🔴 **§3에서 4종 문구를 신설해도 폴백은 남긴다** — 미래에 새 사유가 생겨도 오표시가 안 나야 한다.

## §3 — 문구 4종 신설

`messages/ko.json`·`en.json`의 `RevDcf.skip`에 추가한다.

| 사유 | 실제 조건 | 🔴 주의 |
|---|---|---|
| `NO_MARKETCAP` | 시총 자체가 없음 | `STALE_MARKETCAP`(893)과 **다른 상태**임이 문구에서 구분돼야 한다 |
| `MULTI_CLASS_SHARES` | 복수 클래스 주식 | 🔴 **오늘 5건 실발생.** 🔴 *"복잡해서"*·*"위험해서"* 같은 판단어 금지 — **사실만** |
| `EX` | 처리 중 예외 | 🔴 사용자에게 내부 오류를 그대로 노출하지 말되 **거짓말도 하지 말 것** |
| `HTTP_*` | 원자료 조회 실패(상태코드 가변) | 🔴 상태코드를 화면에 노출할지 판단하고 **이유를 적는다** |

- 🔴 **889가 추출한 원칙으로 쓴다**: 상대적·서술적 · 원인별 정확 분기 · 미확인 원인 단정 금지.
- 🔴 **ko/en 동시**. en은 `BRAND_IDENTITY §5` *"축약형 금지"* 준수. **`messages.test.ts` 패리티 통과 필수.**
- 🔴 **기존 문구를 고치지 말 것.** 추가만 한다.

## §4 — `MISSING_TAG` 3분기

`lib/revdcf/drivers.ts` `:113`(영업이익) · `:119`(PP&E) · `:122`(영업현금흐름)가 같은 코드를 반환한다. **세 코드로 나눈다.**

- 🔴 **계산 로직·조건식을 바꾸지 말 것.** `has5(...)` 검사와 반환 시점은 그대로, **반환하는 문자열만** 나눈다.
- 🔴 **`flags.missing`은 그대로 둔다** — 이미 세부를 담고 있고 DB에 저장된다.
- 🔴 **기존 DB 행은 손대지 말 것.** 과거 행은 `MISSING_TAG`로 남는다. 🔴 **그 사실을 SPEC §10에 적는다**(이력 행과 신규 행의 코드가 다르다).
- 🔴 화면 문구 3종을 §3과 같은 원칙으로 추가한다.
- 🔴 **`MISSING_TAG` 자체를 지우지 말 것** — 과거 행이 그 코드를 갖고 있으므로 **문구가 남아 있어야 한다.**

## §5 — 테스트 (🔴 회귀 방지)

`app/api/cron/revdcf/route.test.ts` 또는 드라이버 테스트에 **최소 4건**:

1. 세 `MISSING_TAG` 분기가 **각각 다른 코드**를 반환한다.
2. 스킵 사유별로 **행이 써진다**(유니버스 보존 — 880 교훈).
3. **알 수 없는 사유 문자열**이 들어와도 `missingTag`가 **아닌** 폴백으로 렌더된다.
4. `ko`·`en` **패리티**(기존 테스트로 커버되면 그 사실을 적고 생략).

🔴 **`lib/revdcf/engine.ts` 테스트는 건드리지 말 것**(계산 불변).

## §6 — 검증 · 커밋

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/revdcf/engine.ts lib/revdcf/compute.ts   # 🔴 출력 없어야 함
git diff --stat HEAD -- lib/lensPrecompute.ts data/ .github/          # 🔴 출력 없어야 함
git status --porcelain                                                # 🔴 ?? 0건
```

🔴 **추가 확인**: `drivers.ts` diff가 **반환 문자열 3곳뿐**인지 육안 확인. 조건식·순서·`flags` 변경이 있으면 **중단하고 보고**한다.

🔴 **커밋 메시지는 §2~§4의 실제 결정에 맞게 실행 측이 고쳐 쓴다**(플레이북 — 894 교훈). 아래는 초안이다.

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 896: stop telling companies their financials are missing when they are not

- four skip reasons had no wording, and the fallback branch handed them the sentence about
  missing five years of financials; five companies today are told that about a share structure
- the fallback now says nothing it cannot support, and it stays in place after the four are
  given their own wording, because one of the reasons carries a status code and cannot be
  enumerated ahead of time
- one code covered three different missing figures, and the detail that would tell them apart
  was stored but never rendered, so the code is split three ways while the checks that produce
  it stay exactly as they were
- older rows keep the old code and its wording is kept for them
- tests cover the split, the fallback and that a row is still written for every skip"
git push && git push origin main:revdcf-preview
```

## §7 — 보고 후 멈춘다

```
§2 폴백 문구 · 🔴 미래 사유에도 안전한가
§3 문구 4종 — 각 문구와 적용한 원칙 조항 · HTTP_* 상태코드 노출 판단과 이유
§4 MISSING_TAG 3분기 — 신규 코드명 · 🔴 drivers.ts diff가 반환 문자열 3곳뿐인지
   과거 행 MISSING_TAG 잔존 사실 SPEC 등재
§5 신규 테스트 통과 · engine 테스트 무변경
§6 🔴 커밋 메시지를 고쳐 썼는가
무변경: engine·compute·lensPrecompute·data·.github diff 0 · DoD 판정 칸 불변
       REVDCF_ENABLED OFF · 크론 미실행 · revdcf_results·us_market_cap·lens_scores 쓰기 0
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **계산을 바꾸지 말 것. DB 기존 행을 고치지 말 것. DoD를 판정하지 말 것. 크론을 돌리지 말 것. 다음 STEP을 제안하지 말 것.**
