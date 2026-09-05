# STEP 919 — 🟢 **안건 2 승인 적용(장은태 2026-08-06)** · 905 ④단계 화면 3건

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_919_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `ab12d1e`(STEP 918 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `REVDCF_ENABLED` Production **OFF** · `revdcf_results` 3,020 · `us_market_cap` 5,892 · `lens_cuts` 10행 · `cron_heartbeats` 2행

## 🟢 승인 기록

> **장은태 승인 2026-08-06**: *"세 건 전부 권고대로"* — `#17` **채택**(각주 병기) · `#37` **현행 유지** · `#43` **현행 유지**.

🔴 **불변 금지선**: `REVDCF_ENABLED` Production **OFF 유지** · DB **쓰기 금지** · **크론 수동 실행 금지** · `data/us_symbols.json`·`.github/workflows/**`·`vercel.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **`lib/revdcf/**` 산식 불변 — 이 STEP은 값을 하나도 바꾸지 않는다.** 🔴 **`lib/lensPrecompute.ts` 수정 금지 · 917 계측 건드리지 말 것** · `RETRY_MAX`·`RETRY_MS`·게이트·임계값(97/95)·`maxDuration` 불변 · **②단계(증액) 시작 금지**.
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 🔴 먼저 열어라

🔴 **Cowork은 `#29`·`#40`·`#41`의 세부를 모른다. 기억으로 쓰지 말 것.**

1. `docs/AUDIT_904_OPEN_ITEMS.md` · `docs/DECISION_905_NEXT.md` · `docs/REVDCF_SPEC.md` §10에서 **`#29`·`#40`·`#41`의 실제 문구를 그대로 인용**한다.
2. 🔴 **905가 이 셋을 "④단계"로 묶은 근거 문구**를 인용한다. 🔴 **왜 안건 2 결정 후여야 했는지**도.
3. `docs/DECISION_918_AGENDA2.md`를 열어 **`#17` 권고가 정확히 무엇을 병기하라는 것인지** 확인한다. 🔴 **"각주 병기"의 각주가 어디인지**(문서인지 화면인지 둘 다인지) 918 문구로 확정한다.
4. 🔴 **줄 번호를 믿지 말고 내용으로 찾는다**(878: `§1311`이 실제 1344행). 🔴 **`grep` 매칭은 존재 증거이지 내용 증거가 아니다**(#82) — 열어서 확인.
5. 🔴 **셋 중 이미 해소됐거나 무효인 것이 있는지 먼저 본다**(`#26`·`#33`=진작 해소, `#22`=무효 전례).

## §1 — 승인 적용 (문서)

- `docs/DECISION_908_PENDING.md` — **안건 2 해소** 표시(승인자·일자·결과 3건). 🔴 **안건 3·4는 그대로 대기.**
- `docs/DECISION_918_AGENDA2.md` — 머리에 **승인 기록** 추가. 🔴 **본문 권고는 고치지 말 것**(907 전례: 판단은 그 문서의 것이다).
- `docs/REVDCF_SPEC.md` §10 — `#17` **채택으로 소진** · `#37`·`#43` **현행 유지로 종결**. 🔴 **종결에도 918의 불리한 사실을 같이 남긴다**(특히 `#37`의 bandCross 8.9%, `#43`의 872 실측).
- `docs/LENS_COMPLETION_STANDARD.md` — driver 3 각주에 `#17` 채택 블록. 🔴 **③판정 칸을 바꾸지 말 것.**

## §2 — 🔴 화면 (905 ④단계)

🔑 **이 프로젝트의 화면 원칙은 889가 세웠다** — driver 6에서 *"업종 평균 근사 편향은 515사 미측정"*을 **값은 안 바꾸고 화면에 공개**했다. **`SPEC §1048`**: *"단일 값은 거짓 정밀도."*

**§0에서 확인한 `#29`·`#40`·`#41` 각각에 대해**:

1. 🔴 **그 항목이 요구하는 것을 한 줄로 적고**, 그 다음 구현한다. 🔴 **요구를 넘어서지 말 것.**
2. 🔴 **위치를 새로 만들지 말 것** — 기존 방법론 페이지·원장 표에 들어갈 자리가 있는지 먼저 본다(910 §2가 *"새 절을 만들지 말 것"*으로 처리한 방식).
3. 🔴 **889 원칙으로 쓴다** — 서술적 · 단정 금지 · 수치 출처 명시.
4. 🔴 **숫자를 박지 말고 배선한다**(`CLAUDE.md §12 B분류` · 907 `#32` 판단 — **화면은 배선 대상**). 🔴 **배선이 불가능해 정성으로 쓴 곳은 그 이유를 적는다.**
5. **`#17` 병기**도 §0-3에서 확정한 위치에 같은 원칙으로 넣는다.

🔴 **`#37`·`#43`은 현행 유지다 — 화면에 아무것도 만들지 말 것.** 🔑 **단, 그 판정의 근거를 화면에 이미 적어야 할 자리가 있으면 §0에서 확인해 보고만 한다.** 🔴 **이 STEP에서 만들지는 말 것.**

## §3 — 🔴 ko/en

- 🔴 **ko/en 동시** · `messages.test.ts` **패리티 통과** · 🔴 **en 축약형 금지**(910 §2에서 확인된 규칙).
- 🔴 **en이 ko의 요약이 되면 안 된다** — 같은 사실을 같은 밀도로.

## §4 — 검증 · 커밋

```bash
npx tsc --noEmit && npm run test          # 🔴 ko/en 패리티 포함 · 182/182 유지
git diff --stat HEAD -- lib/               # 🔴 출력 없어야 함
git diff --stat HEAD -- data/ .github/ vercel.json   # 🔴 출력 없어야 함
git status --porcelain                     # 🔴 ?? 0건
```

🔴 **`lib/`에 diff가 나오면 산식이나 917 계측을 건드린 것이다 — 되돌리고 보고한다.**
🔴 **DB 사전/사후 스냅샷 일치 확인**(918이 한 방식 그대로).

🔴 **커밋 메시지는 §2에서 실제로 쓴 문구에 맞게 실행 측이 고쳐 쓴다.** 🔴 **초안이 결과를 전제하지 않았는지 확인할 것** — 913 대폭 재작성 · 914 프로브 버그 2건 · 916 유니버스 가설 기각. **초안은 매번 틀렸다.**

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 919: apply the three approved answers and put on screen what the model does not do

- two of the three were approved as leave-it-alone, so the work there is to record why in the
  ledger rather than to build anything: the source has no such labelling at all, and where it does
  give a range it arrives at one by human judgement rather than by a rule we could follow
- the third adds a comparison figure alongside the rate already used, which changes no result
  because that rate is one constant applied to every company
- the screens follow what was done for the cost of capital: state the limit in prose, name where
  each number came from, and wire the figures rather than typing them, so they cannot drift
- nothing computed moves here, the flag stays off, and the instrumentation added two steps ago is
  left untouched while its first readings are still pending"
git push && git push origin main:revdcf-preview
```

## §5 — 보고 후 멈춘다

```
§0 #29·#40·#41 실제 문구 인용 · 905가 ④단계로 묶은 근거
   🔴 #17 "각주 병기"의 위치를 918 문구로 확정한 결과
   🔴 셋 중 이미 해소·무효인 것이 있는가
§1 안건 2 해소 표시 · 🔴 안건 3·4 대기 불변 · 🔴 918 본문 권고 불변
   🔴 #37·#43 종결에 불리한 사실(bandCross 8.9% · 872 실측) 남겼는지
§2 화면 3건 각각 — 요구 한 줄 · 넣은 위치(🔴 새 절 안 만들었는지) · 실제 문구
   🔴 배선인가 정성인가와 이유 · #17 병기 위치
   🔴 #37·#43은 아무것도 안 만들었는지
§3 ko/en 패리티 통과 · 🔴 en 축약 아닌지
§4 🔴 lib/ diff 0 · DB 스냅샷 사전/사후 일치
무변경: lib/ diff 0(산식·917 계측) · data/.github/vercel.json diff 0
       RETRY_MAX·RETRY_MS·게이트·임계값·maxDuration 불변 · ②단계 미착수
       LENS_COMPLETION_STANDARD ③판정 칸 불변 · DoD 판정 칸 전부 불변
       안건 3·4 대기 불변 · REVDCF_ENABLED Production OFF · 크론 미실행 · DB 쓰기 0
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **산식을 바꾸지 말 것. 917 계측을 건드리지 말 것. ②단계(증액)를 시작하지 말 것. `#37`·`#43`용 화면을 만들지 말 것. 안건 3·4에 손대지 말 것. `REVDCF_ENABLED`를 켜지 말 것. 크론을 돌리지 말 것. 다음 STEP을 제안하지 말 것.**
