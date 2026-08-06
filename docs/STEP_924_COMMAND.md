# STEP 924 — 🟢 종목명 표시 계층 통일(B안) + 「모멘텀 모멘텀」 중복 · 값·판정 불변

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_924_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `570599b`(STEP 923 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `REVDCF_ENABLED` Production **OFF** · `revdcf_results` 3,020 · `us_market_cap` 5,892 · `lens_cuts` 10행 · `cron_heartbeats` 2행

## 🟢 판정 (Cowork · 장은태 위임 *"가장 베스트인거로 3번 생각하고 검색하고 검증하고 검수해서 진행해"* 2026-08-06)

> **923의 수리 선택지 중 B(표시 계층 통일)를 채택한다.** 🔴 **A(근본수정: `lensCompute` 폴백)는 채택하지 않는다.**

### 근거 (전부 923 실측에 걸림)

1. 🔑 **규모** — `lens_scores`(US) **998행 중 348행(34.9%)**이 폴백을 탄다. 방치할 규모가 아니고, DoD7이 막혀 **모델 완성이 안 된다.**
2. 🔑 **상세가 이미 답을 갖고 있다** — 목록=`lens_scores.name`(런타임 Yahoo) vs 상세=`data/us_symbols.json`(빌드타임). **다른 파이프라인**이고 🔑 **후자에는 이름이 있다.**
3. 🔴 **A는 크론·DB 쓰기를 건드린다.** 게다가 923이 *"348행 각각에서 왜 Yahoo가 이름을 안 줬는지는 미조사"*로 남겼다 — 🔑 **원인을 모르는 채 데이터 파이프라인을 고치는 자리다.**
4. 🔑 **DoD7이 요구하는 것은 "다섯 표면에서 같은 이름"이지 "데이터 소스 정상화"가 아니다.** B가 요구를 정확히 충족한다.

### 🔴 대가

**근본 원인(Yahoo 폴백이 DB에 영속화되는 구조)은 남는다.** `lens_scores.name`의 348행은 여전히 티커 title-case 값이다 — **표시할 때만 우선순위로 덮는다.**

### 🔴 불리한 사실

- 🔴 **923이 *"Alphabet Inc." 중복이 사용자에게 실제로 혼란을 주는지는 판정 안 함*으로 남겼다.** 이 STEP도 **티커 표시는 건드리지 않는다**(DotsRow 티커 미표시는 **설계**로 확인됨).
- 🔴 **`us_symbols.json`에도 이름이 없는 종목은 여전히 폴백을 탄다.** §2가 그 수를 센다.
- 🔴 **DoD7 원문 *"같은 이름"*은 `LENS_COMPLETION_STANDARD.md:24`에 추가 정의가 없어 모호하다**(923 확인). 🔑 **종목명이 DoD7 대상인지 자체가 확정이 아니다.** 🔴 **이 STEP은 그 해석을 정하지 않는다.**

### 🔴 재검토 조건

`us_symbols.json` 커버리지가 떨어지거나, Yahoo 폴백 원인이 규명되면 A를 다시 연다.

---

🔴 **불변 금지선**: 🔑 **`REVDCF_ENABLED`를 켜지 말 것** · **DB 쓰기 금지**(🔑 **B안의 핵심이다 — `lens_scores`를 고치지 않는다**) · **크론 수동 실행 금지** · `lib/lensPrecompute.ts` **수정 금지**(917 계측 포함) · `lib/revdcf/**` 산식 수정 금지 · `data/us_symbols.json`·`.github/workflows/**`·`vercel.json` 수정 금지(🔴 **읽기는 허용**) · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **렌즈 판정·점수·컷은 하나도 바뀌면 안 된다.** 🔑 **바뀌는 것은 화면에 찍히는 이름 문자열뿐이다.**
🔴 **②단계(증액) 시작 금지** · **안건 3 대기 유지**(22:45 UTC 크론 관측) · **DoD 판정 칸을 바꾸지 말 것.**
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §1 — 🔴 먼저 열어라

1. `docs/DECISION_923_NAMING.md`의 **A·B·C·D 선택지 원문을 그대로 인용**한다. 🔴 **Cowork이 "B"라 부른 것이 923의 B와 같은지 확인**한다. 🔑 **다르면 923의 정의를 따르고 그 사실을 적는다.**
2. 923이 찾은 경로를 연다 — `lib/usNameFormat.ts:10-21`(`titleCaseUsName`) · `lib/displayName.ts:27`(`cleanUsName`) · `ExploreClient.tsx:161`(`lensStateLabel`). 🔴 **`grep` 매칭은 존재 증거이지 내용 증거가 아니다**(#82) — 열어서 본다.
3. 🔴 **줄 번호를 믿지 말고 내용으로 찾는다**(878).
4. 🔴 **상세가 `us_symbols.json`에서 이름을 읽는 정확한 경로**를 확인한다 — 🔑 **표시 계층이 재사용할 수 있는 형태인지.**

## §2 — 🔴 표시 계층 통일 (DB 쓰기 0)

1. **목록 표시 시 종목명 우선순위를 정한다** — 🔑 **`us_symbols.json`의 이름이 있으면 그것, 없으면 현행 폴백.** 🔴 **구현 형태는 실행 측이 코드베이스에 맞게 판단**한다(Cowork이 함수명을 지정하지 않는다).
2. 🔴 **`lens_scores`에 쓰지 말 것.** 🔑 **읽어온 값을 표시할 때만 덮는다.**
3. 🔴 **적용 범위** — 🔑 **DoD7이 말하는 다섯 표면 중 실재하는 것에 전부**. 923: 변화피드·이메일·브리핑은 **N/A**(901 확정)이므로 **실질 대상은 목록**이다. 🔴 **목록이 여러 곳이면 전부**(Explore lens-top · `?list=changes` · `?list=pos` 등). 🔴 **누락 없이 열거하고 적는다.**
4. 🔴 **잔여 폴백 수를 센다** — `us_symbols.json`에도 이름이 없어 **여전히 폴백을 타는 종목이 몇 개인지.** 🔑 **348개 중 몇 개가 해소되고 몇 개가 남는가.** 🔴 **읽기만.**
5. 🔴 **KR 경로는 건드리지 말 것** — 🔑 **이 결함은 US 전용이다**(`usNameFormat.ts`). 🔴 **KR에도 같은 구조가 있으면 "있음"으로 적고 고치지는 말 것.**

## §3 — 「모멘텀 모멘텀」 중복

923: *"`ExploreClient.tsx:161`, `lensStateLabel` 일부 phrase가 렌즈이름을 내장해 이중 렌더."*

1. 🔴 **어느 phrase들이 렌즈이름을 내장하고 있는지 전수로 찾는다.** 🔑 **「모멘텀」 하나만이 아닐 수 있다.**
2. 🔴 **문구를 바꾸지 말고 조립을 고친다** — 🔑 **번역 텍스트를 건드리면 ko/en 패리티와 다른 화면에 영향이 간다.** 🔴 **불가피하게 `messages/`를 고쳐야 하면 그 이유를 적고 ko/en 동시에.**
3. 🔴 **다른 렌즈 라벨이 깨지지 않는지 확인**한다 — 🔑 **내장 phrase를 제거하면 그 phrase를 단독으로 쓰던 곳이 이름을 잃을 수 있다.**

## §4 — 🔴 이 STEP이 닫지 않는 것

🔴 **DoD7 ③판정 칸을 바꾸지 말 것.** 🔑 **표시를 고쳐도 DoD7 판정은 장은태 몫이고, 게다가 원문의 "같은 이름"이 모호하다**(923). 🔴 **`DECISION_923_NAMING.md`에 "B안 적용됨 · DoD7 판정은 미결"로 적는다.**
🔴 **「Alphabet Inc.」 중복(티커 미표시)은 건드리지 말 것** — **설계로 확인됨**(923). 🔴 **UX 판정은 이 STEP 범위 밖.**
🔴 **A안(근본수정)을 하지 말 것** · 🔴 **348행의 개별 실패 사유를 조사하지 말 것**(별건).

## §5 — 🔴 검증 (판정 불변이 성공 기준)

**사전 스냅샷**(🔴 읽기만 · `docs/probe_924_baseline.json`):
`lens_scores`(US) 행 수·`updated_at` · `lens_cuts` 10행 값 · `revdcf_results` 행 수 · `us_market_cap` 행 수 · 🔴 **표본 20종목의 렌즈 판정 문자열**

```bash
npx tsc --noEmit && npm run test          # 🔴 ko/en 패리티 포함 · 182/182 이상 유지
git diff --stat HEAD -- lib/lensPrecompute.ts lib/revdcf/ data/ .github/ vercel.json   # 🔴 출력 없어야 함
git status --porcelain                                                                  # 🔴 ?? 0건
```

🔴 **`lib/lensPrecompute.ts`나 `lib/revdcf/`에 diff가 나오면 되돌리고 보고한다.**
🔴 **사후 DB 스냅샷이 사전과 일치해야 한다** — 🔑 **DB 쓰기 0이 B안의 정의다.**
🔴 **로컬 dev를 띄운 채로 두고 보고한다** — 포트·URL·`REVDCF_ENABLED` 값을 적을 것. 🔑 **Cowork이 브라우저로 육안 검증한다**(920에서 이 방식으로 결함을 잡았고, 923에서 이 방식으로 종목명 문제를 찾았다).
🔴 **실행 측도 먼저 본다** — 「Mo」→「Altria Group, Inc.」 · 「Hst」→「Host Hotels & Resorts」 · 「모멘텀 모멘텀」→ 정상 · **다른 목록이 안 깨졌는지** · **KR 목록 무변화.**

## §6 — 문서 · 커밋

- `docs/DECISION_923_NAMING.md` — B안 채택·적용 기록(위임 근거·일자) · 🔴 **본문 선택지는 고치지 말 것** · 🔴 **DoD7 미결 명시**
- `docs/REVDCF_SPEC.md` §11(잔여 폴백 수) · `docs/STATE.md`(🔴 142줄 상한 · 🔴 **22:45 UTC 크론 관측 대기 유지**) · `docs/CHANGELOG.md`
- 🔴 **`docs/LENS_DEV_PLAYBOOK.md` 신규**:
  > 🔑 **같은 값을 두 파이프라인이 각자 가져오면 언젠가 갈린다.** 목록은 런타임 외부 API, 상세는 빌드타임 번들에서 종목명을 읽었고 **998행 중 348행(34.9%)에서 갈렸다.** 🔴 **표시 계층에서 우선순위를 한 곳에 정하면 데이터 파이프라인을 안 건드리고도 표면이 일치한다** — 근본 원인은 남으므로 그 사실을 함께 적는다.

🔴 **커밋 메시지는 §2 잔여 수와 §3 실제 수정 범위에 맞게 실행 측이 고쳐 쓴다.** 🔴 **초안이 결과를 전제하지 않았는지 확인할 것** — 913 대폭 재작성 · 914 프로브 버그 2건 · 916 유니버스 가설 기각 · 919 `lib/` 충돌 재설계. **초안은 매번 틀렸다.**

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 924: show the company name the detail page already knows, in the list that shows a ticker instead

- a third of the American rows render a title-cased ticker where a name belongs, because the list
  reads a field filled at runtime from an external quote while the detail page reads a file bundled
  at build time, and only the second one has the names
- so the display layer picks the bundled name first and falls back to what it did before, which
  leaves the stored values untouched and writes nothing: the verdicts, the scores and the cutoffs
  are the same rows they were
- the root cause stays — a default that gets persisted once the quote comes back without a name —
  and that is written down rather than quietly fixed alongside
- one lens label rendered its own name twice because the phrase already contained it, which is the
  assembly and not the wording, so the wording is left alone
- the item this serves is not closed here: what the standard means by the same name is not defined
  in it, and that reading is not ours to pick"
git push && git push origin main:revdcf-preview
```

## §7 — 보고 후 멈춘다

```
§1 923의 A·B·C·D 원문 인용 · 🔴 Cowork이 말한 B가 923의 B와 같은가
   us_symbols.json 읽는 경로 · 표시 계층에서 재사용 가능한 형태인가
§2 🔴 종목명 우선순위 구현 방식 · 🔴 적용한 목록 전수 열거(누락 없이)
   🔴 348개 중 해소 / 잔여 몇 개 · 🔴 DB 쓰기 0 확인 · KR 구조 유무(고치진 말 것)
§3 렌즈이름 내장 phrase 전수 · 🔴 조립을 고쳤는가 문구를 고쳤는가(문구면 이유+ko/en)
   🔴 다른 렌즈 라벨 안 깨졌는지
§4 🔴 DoD7 ③판정 칸 불변 · Alphabet 티커 미표시 미접촉 · A안 미실행
§5 🔴 사전/사후 DB 스냅샷 일치 · 표본 20종목 렌즈 판정 문자열 불변
   🔴 lensPrecompute.ts·revdcf/ diff 0 · ko/en 패리티
   🔴 dev 서버 URL·포트·REVDCF_ENABLED 값(Cowork이 육안 확인)
무변경: 🔴 DB 쓰기 0 · lens_scores 미수정 · 렌즈 판정·점수·컷 불변
       lib/lensPrecompute.ts(917 계측)·lib/revdcf/ diff 0 · data/.github/vercel.json diff 0
       DoD 판정 칸 전부 불변 · ②단계 미착수 · 안건 3 대기 불변
       REVDCF_ENABLED Production OFF · 크론 미실행
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **`lens_scores`에 쓰지 말 것. A안(근본수정)을 하지 말 것. 렌즈 판정·점수·컷을 바꾸지 말 것. DoD7 판정 칸을 바꾸지 말 것. 티커 표시(Alphabet)를 건드리지 말 것. KR 경로를 고치지 말 것. `REVDCF_ENABLED`를 켜지 말 것. 크론을 돌리지 말 것. ②단계를 시작하지 말 것. 다음 STEP을 제안하지 말 것.**
