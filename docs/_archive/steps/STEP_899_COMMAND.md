# STEP 899 — 🔴 DoD 7 실측 결함: 같은 종목이 화면마다 다른 판정을 낸다

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_899_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `6bffecd`(STEP 898 · `main`·`revdcf-preview` 동일) · tsc 0 · test 169/169 · `REVDCF_ENABLED` **Production OFF** · `revdcf_results` 604×3 · `us_market_cap` 5,887

🔴 **불변 금지선**: `REVDCF_ENABLED` Production **OFF 유지** · `revdcf_results`·`us_market_cap`·`lens_scores` **쓰기 금지** · **크론 수동 실행 금지** · `data/us_symbols.json`·`.github/workflows/**`·`lib/lensPrecompute.ts` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 🔴 Cowork 브라우저 실측 (2026-08-04)

898의 표 수정을 확인한 뒤, 같은 브라우저로 종목 상세를 열어 **불일치를 찾았다.**

### 확인 1 — 898 수정 ✅

방법론 표 첫 열: `성장률`·`세율`·`운전자본`·`증분 재투자율`·`자본비용`·`터미널` **전부 한 줄.** 🔑 *"증분 재투 자율"* 오독 해소.

### 🔴 확인 2 — 판정 불일치 (이 STEP의 대상)

**AAL** — DB `verdict = value_destroying`(08-03)인데 **종목 상세 화면은 다르게 말한다**:

```
배지   "적용 밖"
문구   "영업적자 상태라 이 기법이 성립하지 않습니다.
        역DCF는 이익을 내는 기업의 기대치를 해독합니다."
```

`components/RevDcfSection.tsx:64` — `lossMaking ? t("outOfScope") : t(badge.…)`. **적자면 `outOfScope`가 우선한다.**

🔴 **그런데 `components/RevDcfBadge.tsx`는 `verdict`만 보고 `lossMaking`을 보지 않는다**(3~4분기 · 897·889에서 확인한 구조).

🔑 **같은 종목이 종목 상세에서는 "적용 밖", 보드·목록에서는 "가치훼손"으로 보일 수 있다.** DoD 7의 정의가 *"카드·목록·변화 피드·이메일·브리핑에서 **같은 이름·판정·단위**"*이므로 **정면 위반이다.**

🔴 **그리고 더 깊은 자리가 있다**: 화면 쪽이 옳다(적자면 기법이 성립하지 않으므로 판정을 내리면 안 된다). **그런데 엔진은 `value_destroying`이라는 판정을 내려 DB에 저장했다.** 그 값이 API로도 나간다.

### 확인 3 — 기록만

종목 상세에 `세율·자본비용은 **2026-01-05** 기준`이 표시된다(오늘 2026-08-04). 🔴 **registry `costOfCapital.open`에 이미 적힌 미결**(*"rf = damodaran 연 단위·FRED 일간 변형 후속"*)이다. 🔴 **이 STEP에서 다루지 말 것 — 기록만.**

## §1 — 🔴 범위 확정 먼저 (판정 전)

**고치기 전에 실제 규모를 잰다.** 🔴 **읽기만.**

1. **`lossMaking` 판정 기준을 코드에서 확인**한다 — `RevDcfSection`이 무엇을 보고 `lossMaking`이라 하는가(영업이익률 음수? 다른 조건?). 🔴 **그 기준이 엔진의 `value_destroying` 조건과 어떻게 겹치는가.**
2. **DB에서 규모 실측** — 최신 `as_of`에서 `lossMaking`에 해당하는 종목이 몇이고, 그중 `verdict`가 무엇인지 분포를 낸다. 🔴 **CLAUDE.md:124가 이미 적은 사실**(*"`value_destroying` 63 + `over_cap` 11 + `years` 4 = 78사"*)이 **지금도 맞는지 재측정**한다 — 880의 driver5 전환 이후다.
3. 🔴 **`years` 적자 종목이 특히 위험하다** — CLAUDE.md:124: *"`years` 적자 4사에는 'N년 성장 요구'가 떠 있었다."* 🔴 **지금도 그런지 확인한다.** 적자 기업에 *"시장은 N년의 초과성장을 요구합니다"*가 뜨면 화면이 거짓을 말하는 것이다.
4. **어느 표면이 `RevDcfBadge`를 쓰는가** — 보드·목록·관심목록·브리핑·이메일 전수 grep.

## §2 — 🔴 판정 (하나만)

§1 실측으로 **하나를 고른다**(플레이북 #79 · 선택지 나열 금지).

| 안 | 내용 | 성격 |
|---|---|---|
| A | **`RevDcfBadge`에도 `lossMaking` 분기를 넣는다** | 표면 일치 · 🔴 DB는 그대로 |
| B | **엔진이 적자면 판정 대신 스킵**(`NOT_APPLICABLE_LOSS_MAKING` 등) | 근본 · 🔴 **계산 경로 변경 · DB 값 변경 · 유니버스 보존 필요** |
| C | **DB `verdict`는 그대로 두되 `flags`에 적자를 기록하고 모든 표면이 그것을 본다** | 절충 |

🔴 **A는 표면만 맞추고 DB는 여전히 "가치훼손"이라 말한다.** API를 쓰는 쪽·나중에 DB를 직접 보는 사람은 여전히 틀린 답을 얻는다. **그 대가를 판정에 적는다.**
🔴 **B는 되돌리기 어렵다** — 계산 경로가 바뀌고 판정 78사가 움직인다. **고른다면 이 STEP에서 적용하지 말고 별도 STEP으로 넘긴다**(880 선례: 판정 → 다음 STEP 적용).
🔴 **판정에 근거·대가·불리한 사실·재검토 조건을 반드시 적는다.**

## §3 — 적용 (🔴 §2가 A 또는 C일 때만)

- 🔴 **계산 로직 무변경**: `lib/revdcf/engine.ts`·`compute.ts`·`drivers.ts` diff **0**.
- 🔴 **DB 쓰기 0.**
- 문구는 **889의 원칙**으로 쓴다 — 판단어 금지·사유 정확 분기. 🔴 **ko/en 패리티 통과.**
- 🔴 **테스트 신규**: 적자 종목이 **모든 표면에서 같은 판정**을 낸다.
- 🔴 **§2가 B면 §3을 건너뛰고 판정서만 남긴다.**

## §4 — 문서 · 검증 · 커밋

- `docs/REVDCF_SPEC.md` §11에 §0 실측 3건 · §10에 신규(§2가 B면 그 판정) · 확인 3(다모다란 기준일)은 **기록만**
- `docs/LENS_COMPLETION_STANDARD.md` — DoD 7 각주에 §0·§1 결과. 🔴 **DoD 7을 판정하지 말 것**(크로스 서피스 점검이 이 STEP으로 시작됐을 뿐 끝나지 않았다)
- `docs/STATE.md` 🔴 142줄 상한 · `docs/CHANGELOG.md`
- 프로브 `scripts/probe_899_lossmaking.ts` + `docs/probe_899_lossmaking.json` — 🔴 **스크립트를 같은 커밋에**(#78)

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/revdcf/ data/ .github/   # 🔴 출력 없어야 함
git status --porcelain                               # 🔴 ?? 0건
```

🔴 **커밋 메시지는 §2 판정에 맞게 실행 측이 고쳐 쓴다**(894 교훈). 아래는 A/C 초안이다.

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 899: make a loss-making company say the same thing on every surface

- opening the page for one of them showed the detail view saying the method does not apply,
  while the stored verdict says the company destroys value and the list badge reads from that
  verdict alone
- the detail view is the honest one: a company running an operating loss is outside what this
  method reads, so no verdict should be pronounced on it at all
- the scale is measured first, including whether any loss-making company is currently being
  told the market demands years of growth from it
- calculations are untouched and nothing is written to the database"
git push && git push origin main:revdcf-preview
```

## §5 — 보고 후 멈춘다

```
§1 lossMaking 기준 · value_destroying 조건과의 겹침
   🔴 적자 종목 수와 verdict 분포(CLAUDE.md:124의 78사가 지금도 맞는가)
   🔴 years 적자 종목에 "N년 성장 요구"가 뜨는가
   RevDcfBadge 사용 표면 전수
§2 🔴 판정 A/B/C 하나 + 근거·대가·불리한사실·재검토조건
§3 적용 내용(A·C인 경우) · 신규 테스트 · ko/en 패리티 · 🔴 B면 미적용 사유
§4 SPEC §11 실측 3건 · 다모다란 기준일 기록만 · DoD 7 판정 안 함
무변경: lib/revdcf diff 0 · data/.github diff 0 · DB 쓰기 0 · REVDCF_ENABLED Production OFF
       크론 미실행
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **계산을 바꾸지 말 것. DB에 쓰지 말 것. DoD 7을 판정하지 말 것. B를 골랐으면 적용하지 말 것. 크론을 돌리지 말 것. 다음 STEP을 제안하지 말 것.**
