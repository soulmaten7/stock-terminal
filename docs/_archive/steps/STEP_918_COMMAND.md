# STEP 918 — 역DCF 복귀: 안건 2 세 건(`#17`·`#37`·`#43`) 원전 대조 · 권고까지

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_918_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `a0fddbb`(STEP 917 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `REVDCF_ENABLED` Production **OFF** · `revdcf_results` 604×5 · `us_market_cap` 5,892 · `lens_cuts` 10행

🔴 **불변 금지선**: `REVDCF_ENABLED` Production **OFF 유지** · DB **쓰기 금지**(읽기만) · **크론 수동 실행 금지** · `data/us_symbols.json`·`.github/workflows/**`·`vercel.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **`lib/lensPrecompute.ts` 수정 금지로 되돌린다** — 917의 계측 허용은 **917 한정**이었다. 🔴 **917이 넣은 계측을 건드리지 말 것.**
🔴 **`RETRY_MAX`·`RETRY_MS`·게이트 산식·임계값(97/95)·`maxDuration` 불변** · **②단계(증액) 시작 금지** — 다음 크론 관측 후 판정이다.
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 왜 지금 이 STEP인가

917이 계측을 **배포만** 했고, 값은 다음 정규 크론(KR 10:30 UTC · US 21:30 UTC) 뒤에 나온다. 🔑 **그동안 라이브 건은 할 일이 없다.**

🔑 **원래 방침으로 돌아간다** — *"이 모델만 먼저 완벽하게 완성한다."* 912~917이 6개 STEP 동안 라이브 진단·수리에 갔고, 그건 승인된 이탈이었다. 🔴 **이제 역DCF다.**

908 §3이 *"지시 없이 진행 가능한 항목 없음"*을 상태로 기록한 이유는 **안건 2가 전부 결정형이고 권고가 없어서**다. 🔑 **910이 안건 1에서 한 것과 같은 방식으로 뚫는다** — Cowork이 실측 근거로 권고를 내고, 장은태가 승인/기각한다. 🔴 **값을 안 바꾸는 판정이면 되돌리는 비용이 문서 수정뿐이다**(910 §5의 논리).

## §1 — 🔴 먼저 원문을 연다 (단정 금지)

🔴 **Cowork은 세 항목의 세부를 모른다. 기억으로 쓰지 말 것.**

`docs/AUDIT_904_OPEN_ITEMS.md` · `docs/DECISION_905_NEXT.md` · `docs/REVDCF_SPEC.md` §10에서 **`#17`·`#37`·`#43`의 실제 문구를 그대로 인용**한다.

1. 🔴 **각 항목이 정확히 무엇을 묻는가** — 한 줄로.
2. 🔴 **905가 "결정형"이라 한 근거 문구**를 인용한다.
3. 🔴 **줄 번호를 믿지 말 것** — 878에서 `§1311`이 실제로는 **1344행**이었다(문서가 자라면 줄 번호가 밀린다). **내용으로 찾는다.**
4. 🔴 **`grep` 매칭은 존재 증거이지 내용 증거가 아니다**(#82) — 매칭된 파일을 **열어서** 확인한다.
5. 🔴 **세 항목 중 이미 해소됐거나 무효인 것이 있는지** 먼저 본다. 🔑 **전례가 있다**: `#26`·`#33`은 진작 끝났는데 표시가 안 됐었고, `#22`는 825와 충돌해 **무효**였다.

## §2 — 🔴 원전 대조 (이 프로젝트의 제1 기준)

🔑 **대원칙: 원전이 어떻게 하는지가 답이다.** 🔴 **Damodaran 등 2차 권위는 원전을 앞설 수 없다**(장은태 지시).

**세 항목 각각에 대해**:

1. 🔴 **원전(T1~T8 스프레드시트 · 원전 본문)에서 해당 논점을 어떻게 처리하는지 직접 연다.** 🔴 **어느 시트 어느 셀인지 적는다.**
2. 🔴 **원전이 그 논점을 아예 다루지 않으면 "원전에 없음"으로 적는다.** 🔑 **그러면 그건 원전 준수 문제가 아니라 우리 제품 결정이고, 판단 근거가 달라진다.**
3. 🔴 **원전 자료를 못 구하면 "미확보"로 적는다** — `#44`·`#45`·`#48`이 이미 **원전 책 page 92 미확보**로 원리적 불가 처리돼 있다. 🔴 **못 구한 것을 구한 척하지 말 것.**
4. 🔴 **877의 교훈**: 튜토리얼 산문에서 읽은 것과 실제 셀 값이 달랐다(*"원전은 세율을 둘 쓴다"* → `T7 Inputs!C10 = 0.165` 단일). 🔴 **산문이 아니라 셀을 본다.**
5. 🔴 **906의 교훈**: 시트 번호를 틀렸다(T3는 마진 튜토리얼이었다). 🔴 **시트를 열어 무엇의 튜토리얼인지 확인하고 인용한다.**

## §3 — 🔴 실측 (권고에 숫자를 붙인다)

🔑 **910이 안건 1을 판정할 수 있었던 이유는 실측이 있었기 때문이다** — *"세 안 중 어느 것도 판정을 바꾸지 않는다"*가 결정적이었다.

**각 항목에 대해 답할 것**(🔴 **읽기만 · DB 쓰기 0 · 프로브로**):

1. 🔴 **채택하면 값이 바뀌는가** — `revdcf_results` 604사에서 **GAP이 몇 사 움직이는가 · 판정(유출/유입)이 몇 건 바뀌는가.**
2. 🔴 **커버리지 대가가 있는가** — 새 태그·새 입력이 필요하면 **몇 사에서 계산이 불가능해지는가.**
3. 🔴 **0이면 0이라고 적는다.** 🔑 **910에서 "판정 이동 0"이 "이건 계산 문제가 아니라 표시 문제다"를 확정했다.**
4. 🔴 **잴 수 없는 항목이면 왜 못 재는지 적는다.** 🔑 **`#37`(라벨)처럼 화면 표시 문제면 GAP 실측 대상이 아닐 수 있다** — 그러면 **무엇으로 재야 하는지**를 적는다(예: 해당 라벨이 붙을 종목 수).
5. 프로브가 필요하면 `scripts/probe_918_*.ts` + 산출 JSON — 🔴 **같은 커밋에**(#78) · 🔴 **sanity check 넣을 것**(#87, 914가 자기 프로브에서 strict-null 2건을 잡은 전례).

## §4 — 🔴 권고 (미루지 말 것)

**세 건 각각에 권고 하나씩.** 🔴 **910의 형식을 그대로 따른다**:

- **권고 한 줄** (채택 / 현행 유지 / 무효 처리 중 하나)
- **근거** — 🔴 **전부 §2 원전 또는 §3 실측에 걸려야 한다.** 🔴 **"그게 나아 보인다"류 금지.**
- 🔴 **대가** — 이 선택이 포기하는 것.
- 🔴 **불리한 사실** — 🔑 **반드시 적는다.** 910이 도미노 부호 반전·26사 체계적 편향을 스스로 적었다.
- 🔴 **재검토 조건** — 무엇이 바뀌면 다시 여는가.

🔴 **세 건을 한 방향으로 몰지 말 것.** 🔑 **각각 독립이다** — 하나가 채택이라고 나머지도 채택일 이유가 없다.
🔴 **판정을 장은태에게 되돌려 보내지 말 것**(#79). 🔴 **동시에, 이것은 권고이고 승인은 장은태 것임을 명시**한다(910 §5).

## §5 — 🔴 화면 3건에 손대지 말 것

905 권고 ④단계(`#29`·`#40`·`#41` 화면)는 **안건 2 결정 후**다. 🔴 **이 STEP은 권고까지만 하고 화면은 건드리지 않는다.** 🔑 **승인 전에 화면을 만들면 재작업 위험이 905 권고의 근거였다.**

## §6 — 문서 · 검증 · 커밋

- `docs/DECISION_918_AGENDA2.md` 신설 — 세 건의 원전 대조·실측·권고. 🔴 **한 문서에 세 건.**
- `docs/DECISION_908_PENDING.md` — 안건 2에 **"918 권고 제출 · 승인 대기"** 표시. 🔴 **안건 3·4는 그대로.** 🔴 **안건 2를 해소 처리하지 말 것 — 승인 전이다.**
- `docs/REVDCF_SPEC.md` §10 `#17`·`#37`·`#43` 상태 갱신 · §11에 §3 실측 등재
- `docs/LENS_COMPLETION_STANDARD.md` — 🔴 **③판정 칸을 바꾸지 말 것.** 관련 각주에만 권고 블록 추가.
- `docs/STATE.md`(🔴 142줄 상한 · 🔴 **라이브 건은 "917 계측 배포 · 다음 크론 관측 대기"로 유지**) · `docs/CHANGELOG.md`

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/ vercel.json   # 🔴 출력 없어야 함
git status --porcelain                                                                # 🔴 ?? 0건
```

🔴 **`lib/`에 diff가 나오면 산식이나 917 계측을 건드린 것이다 — 되돌리고 보고한다.**
🔴 **커밋 메시지는 §4의 실제 권고에 맞게 실행 측이 고쳐 쓴다.** 🔴 **초안이 결과를 전제하지 않았는지 확인할 것** — 913 대폭 재작성 · 914 프로브 버그 2건 · 916 유니버스 가설 기각. **초안은 매번 틀렸다.**

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 918: return to the model and answer the three items that were only ever labelled decisions

- these were parked as things someone had to choose rather than things anyone could measure, which
  is why nothing could proceed; the same treatment that unblocked the working capital question is
  applied, so each one arrives with a recommendation attached to evidence
- the source is opened cell by cell rather than read from its prose, because prose and cells have
  disagreed here before, and where the source says nothing at all that is recorded as its own
  answer: not a compliance question but a product one
- what each choice would actually move is counted across the companies we can compute, since a
  change that alters no verdict is a question about presentation, not arithmetic
- the three are judged separately and the screens that depend on them are left alone, because
  building those before the choices are approved is the rework the earlier recommendation warned of"
git push && git push origin main:revdcf-preview
```

## §7 — 보고 후 멈춘다

```
§1 세 항목 실제 문구 인용 · 905가 "결정형"이라 한 근거
   🔴 이미 해소됐거나 무효인 것이 있는가(#26·#33·#22 전례)
§2 🔴 각 건 원전 처리 — 어느 시트 어느 셀 · 🔴 "원전에 없음"이면 그렇게
   🔴 원전 자료 미확보면 "미확보" · 산문 아닌 셀을 봤는지
§3 🔴 각 건 실측 — GAP 이동 · 판정 이동 · 커버리지 대가(0이면 0)
   🔴 못 재는 항목이면 왜 · 무엇으로 대신 쟀는가
§4 🔴 세 건 각각 권고 1개 + 근거·대가·불리한사실·재검토조건
   🔴 한 방향으로 안 몰았는지 · 🔴 승인은 장은태 것임을 명시했는지
§5 🔴 화면 #29·#40·#41 무변경 확인
무변경: lib/app/components/messages/data/.github/vercel.json diff 0
       917 계측 불변 · RETRY_MAX·RETRY_MS·게이트·임계값·maxDuration 불변
       LENS_COMPLETION_STANDARD ③판정 칸 불변 · DoD 판정 칸 전부 불변
       안건 3·4 대기 불변 · 🔴 안건 2도 "승인 대기"이지 해소 아님
       REVDCF_ENABLED Production OFF · 크론 미실행 · DB 쓰기 0
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **화면(#29·#40·#41)에 손대지 말 것. 917 계측을 건드리지 말 것. ②단계(증액)를 시작하지 말 것. 안건 3·4에 손대지 말 것. 안건 2를 해소 처리하지 말 것. 크론을 돌리지 말 것. 다음 STEP을 제안하지 말 것.**
