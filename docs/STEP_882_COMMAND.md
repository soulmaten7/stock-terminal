# STEP 882 — 🔴 "GAP 8" 전수 정정 · 대조표 구조 결함 · 차이 9행 6행(인플레) ③판정

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_882_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `7421020`(STEP 881 · `main`·`revdcf-preview` 동일) · tsc 0 · test 155/155 · `REVDCF_ENABLED` **OFF** · `revdcf_results` 604×3 · `us_market_cap` 5,887

🔴 **불변 금지선**: `REVDCF_ENABLED` **OFF 유지** · `revdcf_results`·`us_market_cap` **쓰기 금지** · **크론 수동 실행 금지** · `data/us_symbols.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.

🔴 **§3은 ③판정까지 간다. "대기"로 끝내지 말 것**(플레이북 #79).

---

## §1 — 🔴 "GAP 8→23년" 전수 정정 (881이 한 자리만 고쳤다)

881 ①이 부수 발견을 냈다 — T7 원본 수치로 재현하면 **GAP은 7**이고, "8"은 T8의 다른 조합(주식 39.35·WACC 0.05357)에서만 나오는 knife-edge다.
881은 이것을 `LENS_COMPLETION_STANDARD.md:795`에 **부기 한 줄로만** 적었다. **Cowork이 grep한 결과 "GAP 8→23년"이 다섯 자리에 그대로 살아 있다:**

| 파일:행 | 내용 |
|---|---|
| `docs/LENS_COMPLETION_STANDARD.md:594` | 22행 대조표 driver 6 행 — *"GAP 8→23년"* |
| `docs/LENS_COMPLETION_STANDARD.md:954` | 잔여 불일치 항목 — *"도미노 GAP 8→23년"* |
| `docs/CHANGELOG.md:888` | *"도미노 GAP 8→23년"* |
| `docs/CHANGELOG.md:987` | *"GAP 8→23년(밴드 13~38)"* |
| `docs/REVDCF_SPEC.md:1048` | 🔑 핵심 교훈 — *"GAP 8→23년의 차이는 사실상 WACC 하나"* |

### 할 것

**다섯 자리 전부** 정정한다. 🔴 **취소선 보존**(이력).

> ~~GAP 8→23년~~ 🔴 **정정(882)**: 원전 T7 수치 그대로면 **GAP 7**. "8"은 T8의 조합(주식 39.35·WACC 0.05357)에서만 나오는 knife-edge다(881 격리 실험). **차이가 WACC 하나라는 결론은 그대로다** — 881 분해 실험이 재확인했다(시점 1단계가 절대다수, 방법 2~4단계는 ±0.3%p).

🔴 **`docs/CHANGELOG.md`는 이력 문서다.** 과거 기록을 고쳐 쓰지 말고 **각주로 정정 표시만** 붙인다. `STEP_*_COMMAND.md`(849·881 등)는 **당시 명령서이므로 건드리지 않는다.**

### 🔴 플레이북 #80 — 게이트 (교훈이 아니라 절차)

같은 유형이 **오늘 세 번**이다: 878 §1(SPEC 622·991만 고치고 1344 잔존) · 881(795만 부기) · 그 사이 #77을 만들었는데도 재발했다.

> 🔑 **수치나 주장을 정정할 때는 발견 지점이 아니라 전수 지점에서 끝낸다.**
> **절차(생략 금지)**: ① 정정 대상 문자열을 **내용으로 grep**해 **출현 목록을 만든다** ② 목록의 **각 항목에 ✅정정 또는 제외사유**를 붙인다 ③ 목록을 **보고에 그대로 싣는다** ④ 그 다음에 커밋한다.
> 🔴 **부기 한 줄은 정정이 아니다.**

## §2 — 🔴 대조표 구조 결함 (Cowork 발견 · 기록만)

`docs/LENS_COMPLETION_STANDARD.md:607`:

> **행 수 = 22** · **동일 8행** + **동일 식·값만 차이 1행(터미널=인플레 값)** + **차이 9행**(driver1·3·**4**·5·6·**인플레**·모집단·데이터출처·검증사례) + **우리 추가물 4행**

🔴 **인플레가 "동일 식·값만 차이 1행"과 "차이 9행" 양쪽에 이름을 올리고 있다.** 산술(8+1+9+4=22)은 맞지만 **같은 항목이 두 칸에 있다.**

그리고 오늘 두 행이 같은 성격으로 판명됐다:
- **driver 3**(877): *"구조는 같고 값만 다르다"* — 원전도 우리도 하나의 세율을 양쪽에 쓴다.
- **driver 6**(881): 분해 실험 결과 **차이의 절대다수가 시점(rf 빈티지)**, 방법 선택은 ±0.3%p.

→ 🔑 **차이 9행 중 driver 3 · driver 6 · 인플레 세 행이 "동일 식·값만 차이" 성격이다.**

🔴 **재분류하지 말 것 — 장은태 판정이다.** 이 STEP은 **`:607` 옆에 사실을 기록**하고 세 행 각주에 상호 참조만 단다.

## §3 — 차이 9행 **6행: 인플레(터미널 i)** ③판정

현재 진행표 6행: `도미노 1.6% | expected_inflation 2.5%(B분류) | 미측정 | — | 🔴 대기`
878이 registry의 *"✅ 851 확정"*과 진행표의 *"대기"*를 **두 축으로 분리**했다(851은 **값 선택** 확정, **원전 대조 판정은 별개**). **그 별개 축을 이 STEP에서 닫는다.**

### ① 원전 재개봉 — 🔴 셀로 본다

- `T8 Inputs!C17 = 0.016` 재확인 · **터미널 식이 실제로 어느 셀에서 어떻게 계산되는지** 수식으로 확인(우리는 `NOPAT(1+i)/(WACC−i)` — 859에서 정정한 형태. **셀과 일치하는지**).
- 🔴 **원전이 i를 "무엇으로 정하라"고 하는가** — 인플레인가, 영구성장률인가, 그냥 도미노 값인가. `T8`·`T9`·`T10` 튜토리얼 서술 전수. **서술과 셀이 다르면 셀이 이긴다.**
- 🔴 **원전의 `i=1.6%`와 `rf=0.65%`를 나란히 본다** — 원전에서는 **i > rf**다.

### ② 실측

- 851의 3안(i=인플레 / i=0 / i=T8 0.016) 결과를 **재확인**한다(GAP 중앙 16/16/14로 기록돼 있다 — 현재 데이터로 재현되는가).
- 🔴 **터미널 비중**: 원전 관찰 중앙 79.6%로 기록돼 있다. 현재 515사에서 재측정한다. **i가 GAP을 얼마나 지배하는지**는 이 비중에 달려 있다.
- 🔴 **i 민감도**: i = 1.6% / 2.0% / 2.5% / 3.0%에서 GAP 분포·판정 이동. 881의 분해 실험과 같은 형식.
- 🔴 **`i` vs `rf` 관계 실측**: 현재 `expected_inflation` 2.5% · `riskfree_rate` 3.95% → i < rf. **원전은 i > rf였다.** 우리 값이 항상 i < rf를 유지하는 구조인지, 아니면 배선상 뒤집힐 수 있는지 확인한다.

### ③ 검색 — 🔴 결론 전에 · 직인용

1. 🔴 **다모다란이 영구성장률에 대해 "무위험이자율을 넘을 수 없다"고 하는가** — 원문 직인용으로 확정. 🔑 **그렇다면 원전(i=1.6% > rf=0.65%)은 그 규칙을 위반한다.** 이건 driver 3에서 나온 것과 같은 구조의 발견이다(원전이 다모다란 권고를 안 따른다).
2. 영구성장률로 **인플레를 쓰는 것**과 **명목 GDP 성장률·무위험이자율**을 쓰는 것 중 무엇을 권고하는가.
3. `expected_inflation`이 다모다란 데이터셋에서 **무엇을 뜻하는 값인지**(기대 인플레 vs 목표 인플레 vs 국채 브레이크이븐) — 출처 정의 확인.

### ④ 🔴 ③판정

driver 1·4·5·6과 동일 형식. **하나만.**

> **③판정**: (현행 유지 / 원전 채택 / 제3안)
> **근거**: 번호. 각 근거는 **실측 또는 직인용**에 걸릴 것.
> **🔴 대가** · **🔴 불리한 사실** · **🔴 재검토 조건**

🔴 **선택지 목록으로 끝내지 말 것.**

## §4 — 문서 · 검증 · 커밋

- `docs/LENS_COMPLETION_STANDARD.md` — §1 두 자리 · §2 `:607` 기록 · 진행표 **6행** 실측/검색/판정
- `lib/revdcf/registry.ts` `inflation` — 878이 나눈 두 축 중 **원전 대조 판정 축** 확정
- `docs/REVDCF_SPEC.md` §1048 정정 · §10 미결 갱신 · §11에 T8 터미널 셀 판독
- `docs/PRIMARY_SOURCE_MAP.md` — 인플레 절 신설(현재 없음)
- `docs/LENS_DEV_PLAYBOOK.md` #80
- `docs/STATE.md` 🔴 1~2p(미측정 목록 보존) · `docs/CHANGELOG.md`
- 프로브 `scripts/probe_882_inflation.ts` + `docs/probe_882_inflation.json` — 🔴 **스크립트 같은 커밋에**(#78)

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- data/ app/ components/ messages/   # 🔴 출력 없어야 함
grep -rn "GAP 8→23" docs/ | grep -v STEP_                  # 🔴 정정 표시 없는 잔존 0건
git status --porcelain                                     # 🔴 ?? 0건
```

```bash
git add -A docs/ lib/ scripts/
git status --porcelain
git commit -m "STEP 882: finish the gap correction everywhere, record a flaw in the comparison table, decide the inflation row

- the previous step found the source reproduces a gap of seven rather than eight and noted it in
  one place; the old figure was still standing in five others, so it is corrected at every
  occurrence with the list shown in the report
- playbook 80 makes that a gate rather than a lesson: grep the string, list every occurrence,
  mark each one, then commit
- the comparison table lists inflation in two different buckets at once, and two more rows have
  since turned out to differ only in value rather than in method; recorded, not reclassified
- the inflation row is decided on its own axis, separately from the earlier choice of which
  value to wire, with the terminal weight and the sensitivity measured
- no code outside the registry, flag unchanged, cron not run"
git push && git push origin main:revdcf-preview
```

## §5 — 보고 후 멈춘다

```
§1 🔴 "GAP 8→23년" 출현 목록 5건 + 각 항목 ✅정정/제외사유 (목록을 그대로 실을 것) · 플레이북 #80
§2 대조표 :607 인플레 이중 등재 기록 · driver3·6과 상호참조 (🔴 재분류 안 함)
§3 ① T8 터미널 셀 수식 · 원전 i 근거 · i>rf 사실
   ② 851 3안 재현 · 터미널 비중 재측정 · i 민감도 4점 · i vs rf 구조
   ③ 다모다란 직인용 3건(못 찾으면 "못 찾음")
   ④ 🔴 ③판정 + 근거·대가·불리한 사실·재검토 조건
§4 진행표 6행·registry·SPEC·MAP·STATE
무변경: data/app/components/messages diff 없음 · REVDCF_ENABLED OFF · 크론 미실행 · revdcf_results 604×3
tsc 0 · test ?/? · push ? · git status ?? 0건 · grep 잔존 0건
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **다음 행을 제안하지 말 것.**
