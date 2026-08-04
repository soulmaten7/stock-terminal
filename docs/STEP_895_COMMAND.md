# STEP 895 — 스킵 사유 3자 대조(코드↔문서↔화면) · DoD 5 판정

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_895_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `d413b7e`(STEP 894 · `main`·`revdcf-preview` 동일) · tsc 0 · test 158/158 · `REVDCF_ENABLED` **OFF** · `us_market_cap` 5,887
🔴 **`revdcf_results` 갱신됨** — 정규 크론이 돌아 **08-03에 880 전환이 반영**됐다(계산됨 515→**465** · `NO_MARGINAL_CAPEX` **50** 신설). 604×3은 유지.

🔴 **불변 금지선**: `REVDCF_ENABLED` **OFF 유지** · `revdcf_results`·`us_market_cap`·`lens_scores` **쓰기 금지** · **크론 수동 실행 금지** · `data/us_symbols.json`·`.github/workflows/**` 수정 금지 · `lib/lensPrecompute.ts` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 🔴 Cowork 자체 정정 (894가 잡아낸 것)

894 보고:
> *"커밋 메시지를 STEP이 준 그대로 쓰지 못했다. 원문 3번째 항목이 `a warning is raised only when it fires`라고 단정했는데, §1-2의 판단 결과 실제로는 경고를 안 만들었다 — **STEP 파일이 내 판단 이전에 결과를 가정하고 쓰인 문장**이었다."*

🔴 **명령서 작성 쪽 결함이다.** §1-2는 *"경고를 만들지 로그만 남길지 판단하라"*고 **열어놓고**, 커밋 메시지는 *"경고를 만든다"*로 **닫아놨다.** 한 문서 안에서 모순이라 **실행 측이 둘 중 하나를 어길 수밖에 없었다.**

### 플레이북 신규

> 🔑 **명령서의 커밋 메시지에 아직 안 내린 판단의 결과를 확정형으로 쓰지 않는다.** 판단을 여는 절이 있으면 커밋 메시지는 그 자리를 **비워두거나 조건형**으로 쓰고, *"실행 측이 판단 결과에 맞게 고쳐 쓴다"*고 명시한다.
> **이력**: 894 — 판단을 열어둔 절과 결과를 단정한 커밋 메시지가 충돌.

🔴 **이 STEP의 커밋 메시지에도 같은 함정이 없는지 실행 전에 확인하고, 있으면 고쳐 쓰고 그 사실을 보고한다.**

## §1 — 🔴 Cowork 사전 실측 (다시 하지 말고 이어서)

### 코드에 정의된 스킵 사유 (grep 실측)

| 사유 | 위치 | 비고 |
|---|---|---|
| `INSUFFICIENT_HISTORY` | `drivers.ts:88` | 매출 5년 미확보 |
| `MISSING_TAG` | `drivers.ts:113` · `:119` · `:122` | 🔴 **세 자리·다른 원인**(영업이익 / PP&E / 영업현금흐름)이 **같은 코드**를 쓴다 |
| `NOT_APPLICABLE_SECTOR` | `drivers.ts:121` | 유동/비유동 미분류 |
| `MULTI_CLASS_SHARES` | `drivers.ts:140` | |
| `NO_INDUSTRY` | `route.ts` | |
| `NO_MARKETCAP` | `route.ts` | |
| `STALE_MARKETCAP` | `route.ts` | 893 신설 |
| `NO_MARGINAL_CAPEX` | `route.ts` | 880 신설 |
| `EX` | `route.ts` catch | |
| `HTTP_${status}` | `route.ts:57` | 🔴 **동적 문자열** — 값이 열려 있다 |

### DB 실제 발생 (2026-08-03)

```
(계산됨) 465 · NO_MARGINAL_CAPEX 50 · INSUFFICIENT_HISTORY 39 · MISSING_TAG 31
NO_INDUSTRY 10 · MULTI_CLASS_SHARES 5 · NOT_APPLICABLE_SECTOR 4          합 604
```
→ 🔴 **`NO_MARKETCAP`·`STALE_MARKETCAP`·`EX`·`HTTP_*`는 발생 0건**(893 예측대로 STALE은 오늘 0).

### 세 목록이 전부 다르다

- **코드**: 10종(+`HTTP_*` 가변)
- **문서**(`LENS_COMPLETION_STANDARD` DoD 5): **5종**만 — 893이 이미 *"불완전함을 발견했으나 바로잡지 않고 사실만 부기"*라 남겼다
- **화면**(`RevDcf.skip`): 6종 — 🔴 **`NO_MARKETCAP`·`MULTI_CLASS_SHARES`·`EX`·`HTTP_*` 문구가 없다**

## §2 — 3자 대조표 (🔴 §1을 검증하고 확장한다)

🔴 **§1은 Cowork 실측이다. 그대로 믿지 말고 직접 확인한 뒤 표를 만든다**(플레이북 #82 — 남의 grep 결과를 내용 증거로 쓰지 않는다).

`docs/AUDIT_895_SKIP_REASONS.md` 신설. 행 하나 = 사유 하나.

| 열 | 내용 |
|---|---|
| 사유 코드 | |
| 코드 위치 | 파일:행 · 🔴 **여러 자리면 전부** |
| 발생 조건 | 한 줄 |
| 실제 발생 수 | 최신 `as_of` 기준 · 0이면 0 |
| 문서 기재 | ✅ / 🔴 누락 |
| 화면 문구 | ✅(키) / 🔴 없음 |
| 🔴 문구 없을 때 화면 | **실제로 무엇이 보이는가** — 코드에서 확인 |

🔴 **`MISSING_TAG`는 세 원인을 별도 행으로 펼쳐 적는다.** `flags.missing`에 세부가 들어가지만 **사유 코드는 하나**라는 사실을 명시한다.

## §3 — 🔴 판정 두 개 (섞지 말 것)

### 3-1. `MISSING_TAG` 분기 판정

889가 적용한 원칙: *"계산 불가 사유는 뭉뚱그리지 않고 **실제 원인별로 정확히 분기**한다."*
🔴 **`MISSING_TAG` 하나가 세 원인을 덮고 있다. 원칙 위반인가 아닌가를 판정한다.**

- **위반이면**: 🔴 **이 STEP에서 코드를 고치지 말고** 판정만 하고 896으로 남긴다(계산 경로 변경이라 테스트가 필요하다).
- **아니면**(예: `flags.missing`이 화면에 도달해 사용자가 원인을 안다면): **왜 아닌지**를 적는다.
- 🔴 **`flags.missing`이 실제로 화면까지 가는지 코드로 확인**한 뒤 판정한다. 추정 금지.

### 3-2. 🔴 DoD 5(경계 처리) 판정

정의: *"**경계 처리** — 계산 불가 조건 · 최소 표본 · 결측 표기."* 현재 🔶, 사유는 *"스킵 사유 5종+적자 적용밖 구현. **형식적 3중 검증 패스는 미수행**."*

**3중 검증을 실제로 돌린다**:
- **패스1 원전 대조** — 원전이 경계를 어떻게 다루는가. 🔴 **이미 알려진 것**: `T8 C31`에 음수 분기 없음·주석 0개(866D). **재개봉해 확인**하고, 원전에 경계 처리가 없다면 **우리 것은 전부 "우리 추가물"**임을 명시한다.
- **패스2 실측** — §2 대조표 + 사유별 발생 수 + 🔴 **604 중 스킵 139건(23%)이 무엇인지** 요약.
- **패스3 화면 정합** — 문구 없는 사유가 화면에 무엇을 내는가. 🔴 **`REVDCF_ENABLED` OFF라 라이브 렌더는 불가** — 코드 리뷰로 확인하고 **그 한계를 판정의 불리한 사실에 적는다.**

> **③판정**: ✅ 또는 🔶 유지 — 🔴 **하나만**
> **근거** · **🔴 대가** · **🔴 불리한 사실** · **🔴 재검토 조건**

🔴 **문서 5종을 코드 실측대로 갱신하는 것은 이 STEP에서 한다**(문서 정정이라 안전). 🔴 **화면 문구 신설은 하지 않는다** — 889의 원칙 적용이 필요하고 ko/en 패리티가 걸려 **896 대상**이다. 🔴 **판정에 "화면 문구 4종 부재"를 대가 또는 불리한 사실로 반드시 적는다.**

## §4 — 문서 · 검증 · 커밋

- `docs/AUDIT_895_SKIP_REASONS.md` 신설
- `docs/LENS_COMPLETION_STANDARD.md` — DoD 5 서술의 **5종 → 코드 실측대로** 갱신(🔴 취소선 보존) · 판정 기록
- `docs/REVDCF_SPEC.md` §10 — `MISSING_TAG` 분기(3-1 결과)·화면 문구 부재를 **896 대상**으로 등재
- `docs/LENS_DEV_PLAYBOOK.md` §0 신규
- `docs/STATE.md` 🔴 142줄 상한 · `docs/CHANGELOG.md`

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/   # 🔴 출력 없어야 함
git status --porcelain                                                   # 🔴 ?? 0건
```

🔴 **커밋 메시지는 §3의 판정 결과에 맞게 실행 측이 고쳐 쓴다**(§0 플레이북). 아래는 **판정이 "🔶 유지"로 났을 때의 초안**이며, ✅로 났다면 그에 맞게 다시 쓰고 **고쳐 썼다는 사실을 보고한다.**

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 895: line up every way the model declines to answer, in code, in the documents and on screen

- ten reasons exist in code, six have ever fired, five are written down and the screen has
  wording for six; no two of those lists match
- one reason covers three different missing figures under a single code, which is the thing the
  copy rules say not to do, so whether that counts as a violation is decided here and the code
  change it would require is left to its own step
- the completion item for boundary handling gets the three verification passes it never had,
  and the passes record what could not be checked because the feature is behind a flag
- the written list is corrected to match the code; the missing screen wording is not invented
  here, because it has to follow the same principle the other copy was rewritten under"
git push && git push origin main:revdcf-preview
```

## §5 — 보고 후 멈춘다

```
§0 🔴 이 STEP 커밋 메시지에 같은 함정이 있었는가 · 고쳐 썼는가
§2 3자 대조표 — 사유 수(코드/발생/문서/화면) · 🔴 §1과 다른 점이 있으면 그것
   🔴 문구 없는 사유가 화면에 무엇을 내는가(코드 확인 결과)
§3 3-1 MISSING_TAG 분기 — 원칙 위반인가 · flags.missing이 화면에 도달하는가
   3-2 🔴 DoD 5 판정 + 근거·대가·불리한사실·재검토조건 · 3중 패스 각각의 결과
       🔴 라이브 렌더 미검증을 불리한 사실에 적었는가
§4 문서 5종 → 실측 갱신 · 896 대상 등재(MISSING_TAG 분기 · 화면 문구 4종)
무변경: lib/app/components/messages/data/.github diff 0 · REVDCF_ENABLED OFF · 크론 미실행
       revdcf_results·us_market_cap·lens_scores 쓰기 0
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **코드를 고치지 말 것. 화면 문구를 신설하지 말 것. 크론을 돌리지 말 것. 다음 STEP을 제안하지 말 것.**
