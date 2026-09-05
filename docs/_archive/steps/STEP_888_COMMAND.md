# STEP 888 — 역DCF 표면 전수 감사: 브랜드 정체성 가드레일 대조 (🔴 감사 전용 · 수정 0)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_888_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `a891a62`(STEP 887 · `main`·`revdcf-preview` 동일) · tsc 0 · test 155/155 · `REVDCF_ENABLED` **OFF** · `revdcf_results` 604×3 · `us_market_cap` 5,887

🔴 **불변 금지선**: `REVDCF_ENABLED` **OFF 유지** · `revdcf_results`·`us_market_cap` **쓰기 금지** · **크론 수동 실행 금지** · `data/us_symbols.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 🔴 성격: 감사 전용

- 🔴 **`messages/*.json`·`components/`·`lib/`·`app/` 수정 0.** 한 글자도 고치지 않는다.
- 🔴 **수정안(대체 문구)을 쓰지 않는다.** 이 STEP은 **무엇이 걸리는지**만 확정한다. 교정은 889.
- 🔴 **DoD 판정을 내리지 않는다.** 감사 결과가 재료다.
- 🔴 **통과한 것은 "통과"라고 적는다.** 없는 문제를 만들지 말 것.

### 왜 감사와 교정을 나누는가

Cowork이 `messages/ko.json`의 `RevDcf` 블록 하나만 보고 *"어긋나는 건 `가치훼손` 하나뿐"*이라 보고했다가, `RevDcfMethod` 블록과 컴포넌트를 열자 **최소 네 건이 더 나왔다.** 표면 전체를 보기 전에 교정하면 놓친 것이 그대로 남는다.

## §1 — 기준: 브랜드 정체성 가드레일 (🔴 원문 인용 · 정본)

`docs/BRAND_IDENTITY.md`가 정본이다. 🔴 **감사 전에 이 파일을 직접 열어 §0·§4·§5·§6을 읽는다.** 아래는 좌표 안내이지 대체물이 아니다(플레이북 #76).

- **§0**: *"우리는 예언하지도, 추천하지도 않는다. 우리는 불을 건넨다 — 그리고 당신을 존중해, 그 불을 당신이 직접 들게 한다."*
- **3기둥 중 자립**: *"추천하지 않는다. 분석은 우리가, 판단·경쟁은 당신이."*
- **§4 가드레일**: *"약한 신호를 숨기지 않는다 · 불확실성을 드러낸다 · **과장·확신하지 않는다** · 능력을 팔되 의존을 팔지 않는다."*
- **§5 목소리**: *"**따뜻한 마케팅 카피 금지. 건조·직설·냉소·정직.**"*
- **§6 🔒**: *"카피는 항상 '전문가처럼 **본다/분석한다**'로. '전문가가 **추천한다**'로 읽히면 **정체성 위반**."*

🔴 **`CLAUDE.md:339·344`도 같은 내용을 담는다 — 대조해서 서로 어긋나면 그 사실을 적는다.**

## §2 — 선례: 7렌즈는 이미 이 집행을 받았다

🔴 **`docs/_archive/LENS_7_COMPLETED.md`(886에서 이관)를 열어 822·824·825·826의 교정 항목을 직접 읽고, 거기서 쓰인 교정 원칙을 추출한다.** 기억이나 요약으로 하지 말 것.

Cowork이 파악한 것(🔴 **확인 대상이지 결론이 아니다**):

| STEP | 무엇을 → 무엇으로 |
|---|---|
| 822 밸류 | "비쌈/쌈" → "비싼 편/싼 편" · `na`를 사유 분기(적자/우선주/결측) |
| 824 저변동 | "출렁/차분" → "출렁이는 편/차분한 편" · 임의 임계값(40%)을 임의라고 화면에 명시 |
| 825 퀄리티 | "평범/알짜" → "수익성 낮은 편/높은 편" · **"은행이라 단정 안 함"** |
| 826 자산성장 | "공격적/보수적" → "공격적인 편/보수적인 편" · 결측 3분기 |

🔴 **추출할 것**: 이 넷을 관통하는 원칙이 무엇인가. **그 원칙을 문장으로 적는다** — 889가 그 문장을 기준으로 교정한다.

## §3 — 감사 대상 (🔴 전수)

**하나라도 빠뜨리면 889가 놓친다.** `#80` 절차대로 **목록을 먼저 만들고** 각 항목에 판정을 붙인다.

1. `messages/ko.json` → `RevDcf` **전 키** (badge·headline·band·note류·driver·driverDesc·skip·expectationLevel·boardBadge 등)
2. `messages/ko.json` → `RevDcfMethod` **전 키** (intro·structure·repro·ledger·row·betaCaveat·notInvestmentAdvice 등)
3. `messages/en.json` → 같은 두 블록 (🔴 **패리티 확인** — ko만 고치면 en이 어긋난다)
4. `components/RevDcfSection.tsx` · `components/RevDcfBadge.tsx` · `/revdcf` 방법론 페이지 · 보드/목록/관심목록에서 역DCF를 표시하는 **모든 자리**
5. 🔴 **하드코딩 문자열** — `t()`를 안 거치고 컴포넌트에 직접 박힌 한글·영문
6. 🔴 **색상 토큰** — 문구 이전에 색이 판단을 한다. 각 verdict에 붙은 클래스를 전부 적는다

## §4 — 🔴 Cowork이 이미 찾은 씨앗 (**이것만 보고 끝내지 말 것**)

전수 감사의 **출발점**이지 목록이 아니다. 🔴 **각각을 직접 확인하고, 확인 결과가 다르면 다르다고 적는다.**

| # | 자리 | 관찰 | 확인할 것 |
|---|---|---|---|
| 1 | `badge.valueDestroying` · `boardBadge.valueDestroying` = **"가치훼손"** | 배지 4종 중 유일한 **가치 판단어**(나머지 `기대 해독`·`무성장 설명`·`설명 불가`는 서술어) | §6 🔒 가드레일에 걸리는가. 🔴 **목록·보드에 노출되는 자리**라 노출량이 가장 크다 |
| 2 | `RevDcfBadge.tsx:11` `bg-unjong-danger/15 text-unjong-danger` | `value_destroying`만 **위험색(빨강)**. `below_one`=muted · `over_cap`=accent | 🔑 **문구를 고쳐도 색이 남으면 판단은 그대로다.** 색이 §4 *"과장·확신하지 않는다"*에 걸리는가 |
| 3 | `RevDcfMethod.row.tax` = *"원전 재료 커버 **58%**·이상값 16.2%"* | **885가 커버리지를 359/464 = 77.4%로 재측정**했다 | 🔴 **화면 숫자가 낡았다.** 그리고 `CLAUDE.md §12 B분류` = *"외부·변동 값은 숫자를 적지 않고 **배선**"* 위반인가 |
| 4 | `RevDcfMethod.repro` = *"$285.2 / **8년**"* | 881·882가 **T7 기준 GAP 7 / T8 기준 8**을 확정했다 | T8 기준이면 라벨은 정확하다. 🔴 **어느 기준인지 화면에 없는 것**이 문제인가 아닌가 |
| 5 | `RevDcfBadge.tsx` | `value_destroying`·`below_one`·`over_cap` **3종만** 있고 `years` 분기가 안 보인다 | 🔴 보드에서 `years` 종목은 무엇이 보이는가. 아무것도 안 보이면 그게 의도인가 |
| 6 | `RevDcfMethod.row.wc` = *"한계형"* 등 원장 행 | **880이 driver5 주 판정을 marginal로 전환**했다 | 원장 표가 880·887 이후 상태와 맞는가 |

🔴 **6개 외에 새로 찾은 것이 이 감사의 진짜 성과다.**

## §5 — 산출물: 감사표

`docs/AUDIT_888_REVDCF_SURFACE.md`를 만든다. 행 하나 = 문구/색상 하나.

| 열 | 내용 |
|---|---|
| 자리 | 파일·키 또는 파일:행 |
| 현재 | 원문 그대로 |
| 노출 | 어디에 보이는가(카드·보드·목록·방법론) · 🔴 **노출량 큰 순으로 정렬** |
| 가드레일 | 걸리는 조항(§0/§4/§5/§6/`CLAUDE.md §12` 중) 또는 **"통과"** |
| 사유 | 왜 걸리는가/왜 통과인가 — 🔴 **한 줄** |
| 실측 연결 | 이 문구가 흔들리는 근거가 있으면 그 숫자(예: 885 세율만 바꿔도 가치훼손 132→125) |

**요약**: 감사 대상 총 N건 · 위반 N건 · 통과 N건 · 판단 보류 N건(🔴 보류는 **왜 보류인지** 적는다).

🔴 **대체 문구를 쓰지 말 것.** 🔴 **"이렇게 고치면 됩니다"도 쓰지 말 것.** 889가 §2에서 추출한 원칙으로 한다.

## §6 — 문서 · 검증 · 커밋

- `docs/AUDIT_888_REVDCF_SURFACE.md` **신설**
- `docs/LENS_COMPLETION_STANDARD.md` — 역DCF **DoD 6(주장 정합)** 자리에 *"888 감사 완료 → 889 교정 대기"* 한 줄. 🔴 **판정 칸은 🔶 그대로.**
- `docs/REVDCF_SPEC.md` §10 — 감사에서 나온 **미결 신규** 등재
- `docs/STATE.md` 🔴 142줄 상한 · `docs/CHANGELOG.md`

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- messages/ components/ lib/ app/ scripts/ data/   # 🔴 출력 없어야 함
git status --porcelain                                                   # 🔴 ?? 0건
```

```bash
git add -A
git reset -- data/
git status --porcelain
git commit -m "STEP 888: audit every surface the model speaks through, against the identity guardrails

- the brand document has said since July that we neither predict nor recommend, and the seven
  lenses were rewritten to match; the reverse DCF surface never got that pass
- a first look at one copy block suggested a single offending word, and opening the rest found
  more, so this step reads the whole surface before anything is changed
- colour is audited alongside wording, because one verdict carries the danger token and a
  colour judges before a word does
- numbers frozen into the methodology copy are checked against what was measured since
- findings only; no wording is changed and no replacement is proposed"
git push && git push origin main:revdcf-preview
```

## §7 — 보고 후 멈춘다

```
§1 BRAND_IDENTITY 직접 개봉 확인 · CLAUDE.md와 어긋나는 곳 유무
§2 7렌즈 교정 원칙 — 🔴 추출한 원칙 문장(889가 쓸 것)
§3 감사 대상 전수 목록(항목 수)
§4 씨앗 6건 확인 결과(관찰과 다르면 다르다고)
§5 감사표 요약 — 총 N · 위반 N · 통과 N · 보류 N · 🔴 새로 찾은 것
무변경: messages/components/lib/app/scripts/data diff 없음 · DoD 판정 칸 불변
       REVDCF_ENABLED OFF · 크론 미실행 · revdcf_results 604×3
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개 통과 여부
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **문구를 고치지 말 것. 대체안을 제안하지 말 것. DoD를 판정하지 말 것. 다음 STEP을 제안하지 말 것.**
